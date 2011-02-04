import os.path
import re
import datetime

from django.db import connection, models
from django.db.backends.util import truncate_name
from django.core.management.color import no_style
from django.db.models.fields import NOT_PROVIDED
from south.db import generic

print " ! WARNING: Experimental Firebird 2.0 support by BARS Group. Bugs may be everywhere!"

class DatabaseOperations(generic.DatabaseOperations):    
    """
    Firebird implementation of database operations.    
    """
    backend_name = 'firebird'

    alter_string_set_type =     'ALTER TABLE %(table_name)s ALTER COLUMN "%(column)s" TYPE %(type)s;'
    alter_string_set_default =  'ALTER TABLE %(table_name)s ALTER COLUMN "%(column)s" SET DEFAULT %(default)s;'
    add_column_string =         'ALTER TABLE %s ADD %s;'
    delete_column_string =      'ALTER TABLE %s DROP %s;'

    allows_combined_alters = False
    
    constraits_dict = {
        'PRIMARY KEY': 'PRIMARY KEY',
        'UNIQUE': 'UNIQUE',
        'CHECK': 'CHECK',
        'REFERENCES': 'FOREIGN KEY'
    }
    table_names_cache = set()

    def adj_column_sql(self, col, field):
        col = re.sub('(?P<constr>CHECK \(.*\))(?P<any>.*)(?P<default>DEFAULT [0|1])', 
                     lambda mo: '%s %s%s'%(mo.group('default'), mo.group('constr'), mo.group('any')), col) #syntax fix for boolean field only
        col = re.sub('(?P<not_null>NOT NULL) (?P<default>DEFAULT.+)',
                     lambda mo: '%s %s'%(mo.group('default'), mo.group('not_null')), col) #fix order  of DEFAULT and NOT NULL
        if field.null:
            col = re.sub('(?P<any>.*) (?P<null>NULL)',
                        lambda mo: '%s'%(mo.group('any')), col) #fix NULL
        col = col.replace(field.column.upper(), '"%s"' % field.column.upper())
        col = col.replace('numeric(20, 2)', 'numeric(18, 2)')
        return col

    def check_m2m(self, table_name):
        m2m_table_name = table_name
        existing_tables = []

        if not self.table_names_cache:
            self.check_meta(table_name)
            self.table_names_cache = set(connection.introspection.table_names())
        tn = table_name.rsplit('_', 1)

        while len(tn) == 2:
            tn2qn = self.quote_name(tn[0], upper = False, check_m2m = False) 
            if tn2qn in self.table_names_cache:
                m2m_table_name = table_name.replace(tn[0], tn2qn)
                break
            else:
                if not existing_tables:
                    existing_tables = connection.introspection.table_names()
                if tn2qn in existing_tables:
                    m2m_table_name = table_name.replace(tn[0], tn2qn)
                    break
            tn = tn[0].rsplit('_', 1)

        self.table_names_cache.add(m2m_table_name)
        return m2m_table_name

    def check_meta(self, table_name):
        return table_name in [ m._meta.db_table for m in models.get_models() ] #caching provided by Django

    def quote_name(self, name, upper=True, column = False, check_m2m = True):
        if not column:
            if check_m2m:
                name = self.check_m2m(name)
            #if self.check_meta(name): #replication of Django flow for models where Meta.db_table is set by user
            #    name = name.upper()
        tn = truncate_name(name, connection.ops.max_name_length())

        return upper and tn.upper() or tn.lower()
        
    def trunc_time(self, field):
        if isinstance(field, (models.DateField, models.DateTimeField, models.TimeField)) and not field.null and not getattr(field, '_suppress_default', False) and field.has_default():
            default = field.get_default()
            if default is not None:
                if callable(default):
                    default = default()
                if isinstance(default, (datetime.date, datetime.time, datetime.datetime)):
                    default = "%s" % default
                #if isinstance(field, models.DateField):
                #    default = default[:10]
                if isinstance(field, models.DateTimeField):
                    default = default[:24]
                #if isinstance(field, models.TimeField):
                #    default = default[:13]
                field.default = default
        return field
        
    def create_table(self, table_name, fields): 
        qn = self.quote_name(table_name, upper = False)
        qn_upper = qn.upper()
        columns = []
        autoinc_sql = ''

        for field_name, field in fields:
            field = self.trunc_time(field)
            col = self.column_sql(qn_upper, field_name, field)
            if not col:
                continue
            col = self.adj_column_sql(col, field)

            columns.append(col)
            if isinstance(field, models.AutoField):
                autoinc_sql = connection.ops.autoinc_sql(qn, field_name)

        sql = 'CREATE TABLE %s (%s);' % (qn_upper, ', '.join([col for col in columns]))
        self.execute(sql)
        if autoinc_sql:
            self.execute(autoinc_sql[0])
            self.execute(autoinc_sql[1])
    
    def get_generator_name(self, table_name):
        return '%s_GN' % truncate_name(table_name, connection.ops.max_name_length() - 3).upper()
    
    def delete_table(self, table_name, cascade=True):
        qn = self.quote_name(table_name, upper = False)

        if cascade:
            # delete all foreign key to table
            rows = self.execute("""
                select F.RDB$RELATION_NAME, F.RDB$CONSTRAINT_NAME
                from RDB$REF_CONSTRAINTS C, RDB$RELATION_CONSTRAINTS F, RDB$RELATION_CONSTRAINTS T 
                where C.RDB$CONSTRAINT_NAME = F.RDB$CONSTRAINT_NAME and 
                    T.RDB$CONSTRAINT_NAME = C.RDB$CONST_NAME_UQ and
                    T.RDB$RELATION_NAME = '%s'
            """ % (self.quote_name(table_name)))
            for tbl,constr in rows:
                self.execute('ALTER TABLE %s DROP CONSTRAINT %s;' % (tbl.upper(),constr.upper()))
            self.execute('DROP TABLE %s;' % qn.upper())
        else:
            self.execute('DROP TABLE %s;' % qn.upper())
        self.execute('DROP GENERATOR %s;'% self.get_generator_name(qn))

    def alter_column(self, table_name, name, field, explicit_name=True):
        qn = self.quote_name(table_name)

        # hook for the field to do any resolution prior to it's attributes being queried
        if hasattr(field, 'south_init'):
            field.south_init()
        field = self._field_sanity(field)

        # Add _id or whatever if we need to
        field.set_attributes_from_name(name)
        if not explicit_name:
            name = field.column
        qn_col = self.quote_name(name, column = True)

        # First, change the type
        params = {
            'table_name':qn,
            'column': qn_col,
            'type': self._db_type_for_alter_column(field),
            'default': 'NULL'
        }
        params['type'] = params['type'].replace('numeric(20, 2)', 'numeric(18, 2)')
        
        # drop index
        #self.delete_index(qn,qn_col)
        
        sqls = [self.alter_string_set_type % params]

        if not field.null and field.has_default():
            params['default'] = field.get_default()
        
        sqls.append('commit;')
        sqls.append(self.alter_string_set_default % params)
        sqls.append('commit;')
        if not field.null:
            sql_not_null = """
                UPDATE RDB$RELATION_FIELDS SET RDB$NULL_FLAG = 1
                WHERE RDB$FIELD_NAME = '%s' AND RDB$RELATION_NAME = '%s'
            """ % (qn_col, qn)
            sqls.append(sql_not_null)
        else:
            sql_null = """
                UPDATE RDB$RELATION_FIELDS SET RDB$NULL_FLAG = NULL
                WHERE RDB$FIELD_NAME = '%s' AND RDB$RELATION_NAME = '%s'
            """ % (qn_col, qn)
            sqls.append(sql_null)
        sqls.append('commit;')
        #UNIQUE constraint
        unique_constraint = list(self._constraints_affecting_columns(qn, [qn_col]))
        if unique_constraint:
            self.delete_unique(qn, [qn_col])
         
        if field.unique and not unique_constraint:
            self.create_unique(qn, [qn_col])
        
        #CHECK constraint is not handled

        for sql in sqls:
            #try:
            self.execute(sql)
            #self.commit_transaction()
            #self.start_transaction()
            #except cx_Oracle.DatabaseError, exc:
            #    if str(exc).find('ORA-01442') == -1:
            #        raise

    def add_column(self, table_name, name, field, keep_default=True):
        qn = self.quote_name(table_name, upper = False)
        sql = self.column_sql(qn, name, field)
        sql = self.adj_column_sql(sql, field)

        if sql:
            params = (
                qn.upper(),
                sql
            )
            sql = self.add_column_string % params
            self.execute(sql)

            # Now, drop the default if we need to
            
            #if not keep_default and field.default is not None:
            #    field.default = NOT_PROVIDED
            #    self.alter_column(table_name, name, field, explicit_name=False)

    def _indexes_on_column(self, table_name, name):
        rows = self.execute("""
            SELECT C.RDB$INDEX_NAME
            FROM RDB$INDICES C
            INNER JOIN RDB$INDEX_SEGMENTS I ON I.RDB$INDEX_NAME = C.RDB$INDEX_NAME
            WHERE C.RDB$RELATION_NAME = '%s'
              and I.RDB$FIELD_NAME = '%s'
        """ % (self.quote_name(table_name), self.quote_name(name)))
        return rows
        
    def delete_column(self, table_name, name):
        rows = self.execute("""
                select F.RDB$RELATION_NAME, F.RDB$CONSTRAINT_NAME
                from RDB$RELATION_CONSTRAINTS F, RDB$INDEX_SEGMENTS I
                where I.RDB$INDEX_NAME = F.RDB$INDEX_NAME and
                    F.RDB$RELATION_NAME = '%s' and
                    I.RDB$FIELD_NAME = '%s' 
            """ % (self.quote_name(table_name).upper(), name.upper()))
        for tbl,constr in rows:
            self.execute('ALTER TABLE %s DROP CONSTRAINT %s;' % (self.quote_name(table_name).upper(),constr.upper()))
        for ind in self._indexes_on_column(table_name, name):
            sql = self.drop_index_string % {
                "index_name": ind[0]
            }
            self.execute(sql)
        return super(DatabaseOperations, self).delete_column(self.quote_name(table_name), name)

    def _field_sanity(self, field):
        """
        This particular override stops us sending DEFAULTs for BooleanField.
        """
        if isinstance(field, (models.BooleanField, models.NullBooleanField)) and field.has_default():
            field.default = int(field.to_python(field.get_default()))
        return field
    
    def _constraints_affecting_columns(self, table_name, columns, type='UNIQUE'):
        """
        Gets the names of the constraints affecting the given columns.
        """
        qn = self.quote_name

        if self.dry_run:
            raise ValueError("Cannot get constraints for columns during a dry run.")
        columns = set(columns)
        rows = self.execute("""
            SELECT C.RDB$CONSTRAINT_NAME, I.RDB$FIELD_NAME
            FROM RDB$RELATION_CONSTRAINTS C
            INNER JOIN RDB$INDEX_SEGMENTS I ON I.RDB$INDEX_NAME = C.RDB$INDEX_NAME
            WHERE C.RDB$RELATION_NAME = '%s' AND
                  C.RDB$CONSTRAINT_TYPE = '%s'
        """ % (qn(table_name), self.constraits_dict[type]))
        # Load into a dict
        mapping = {}
        for constraint, column in rows:
            mapping.setdefault(constraint.encode().strip(), set())
            mapping[constraint.encode().strip()].add(column.encode().strip())
        # Find ones affecting these columns
        for constraint, itscols in mapping.items():
            if itscols == columns:
                yield constraint
    
    
    def delete_index(self, table_name, column_names, db_tablespace=''):
        """
        Deletes an index created with create_index.
        This is possible using only columns due to the deterministic
        index naming function which relies on column names.
        """
        if isinstance(column_names, (str, unicode)):
            column_names = [column_names]
        
        for column in column_names:
            for ind in self._indexes_on_column(table_name, column):
                sql = self.drop_index_string % {
                    "index_name": ind[0]
                }
                self.execute(sql)

    
    #def rename_table(self, old_table_name, table_name):
    #    """
    #    Renames the table 'old_table_name' to 'table_name'.
    #    """
    #    if old_table_name == table_name:
            # Short-circuit out.
    #        return
        #params = (self.quote_name(old_table_name), self.quote_name(table_name))
        # create new table
        
        # create index, foreign key, check
        # copy data
        # drop old table