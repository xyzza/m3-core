# -*- coding: utf-8 -*-
from optparse import OptionParser, OptionGroup
import sys, os, zipfile
import subprocess

DEBAG = False
SETUP_VERSION = '0.5'

# Supported data management:
# key - type db
# value - type in django
POSTGRE = 'postgre'
MYSQL   = 'mysql'
SQLITE  = 'sqlite'
ORACLE  = 'oracle'
SUPPORTED_DB = (POSTGRE, MYSQL, SQLITE, ORACLE)
DJANGO_CONN = {POSTGRE:'postgresql_psycopg2', MYSQL:'mysql',SQLITE:'sqlite3',ORACLE:'oracle'}

mtINFORMATION = ''
mtERROR = 'ERROR!\n'

# PATHS:
PATH_TO_VENDOR = '\\m3\\vendor'
PATH_TO_SETTINGS = r'\eor\settings.py'
PATH_TO_MANAGE   = '\\eor\\manage.py'

def print_log(message, status_message=mtINFORMATION):
    print '%s%s' % (status_message, message)

    if status_message==mtERROR:
        print 'Instalation failure.'
        raw_input('Please press ENTER.')

def unzip_file_into_dir(file, dir):
    """
        Разархивирует файл (file) в директорию (dir)
    """
    #os.mkdir(dir, 0777)
    zfobj = zipfile.ZipFile(file)
    for name in zfobj.namelist():
        if name.endswith('/'):
            if not (os.path.exists(os.path.join(dir, name))):
                os.mkdir(os.path.join(dir, name))
        else:
            outfile = open(os.path.join(dir, name), 'wb')
            outfile.write(zfobj.read(name))
            outfile.close()

def add_all_parameters(parser):
    """
        Здесь определяются все параметры, которые передаются скрипту
    """
    parser.add_option("-p", "--path", dest="path_to_project",
                      help="Path to project")
    parser.add_option("-s", "--src_path", dest="src_file",        
                      help="Src path to zip archive install") 
    parser.add_option("-t", "--type-install",
                      dest="type_install",
                      type="int",
                      help="Type install (1 - full, 2 - update version, 3 - update build)")

    group_db = OptionGroup(parser, "Data base options")
    group_db.add_option("-d", "--db-type",
                      dest="db_type",
                      default="postgre",
                      help="Type database using -- postgre, mysql, oracle, etc.\n"
                        "[default: %default]")
    group_db.add_option( "--host",
                      dest="host",
                      default="localhost",
                      help="IP address to database [default: %default]")
    group_db.add_option( "--port",
                      dest="port",
                      default=5432,
                      type="int",
                      help="Port to database [default Postgre port: %default]")
    group_db.add_option( "--user",
                      dest="user",
                      help="User to database")
    group_db.add_option( "--password",
                      dest="password",
                      help="Password to database")
    group_db.add_option( "--db-name",
                      dest="db_name",
                      help="Name to database")
    group_db.add_option( "--superuser",
                      dest="superuser",
                      help="Superuser name in data base")
    group_db.add_option( "--superpassword",
                      dest="superpassword",
                      help="Password of superuser")
    parser.add_option_group(group_db)

def set_db_parameters(path, dbtype, **db_parameters):
    """
        Устанавливает значения, переданные в качестве параметров
    """
    if DEBAG:
        print_log(path)

    sys.path.append('%s%s' % (path, PATH_TO_VENDOR))
    
    path_to_settings = path + PATH_TO_SETTINGS

    from user_modules import django_ini      
    ini = django_ini.DjangoIni(path_to_settings)
    ini['DATABASE_ENGINE']  = DJANGO_CONN[dbtype]
    ini['DATABASE_NAME']    = db_parameters.get('dbname', ini['DATABASE_NAME'])
    ini['DATABASE_USER']    = db_parameters.get('user', ini['DATABASE_USER'])
    ini['DATABASE_PASSWORD']= db_parameters.get('password', ini['DATABASE_PASSWORD'])
    ini['DATABASE_HOST'] = db_parameters.get('host', ini['DATABASE_HOST'])
    ini['DATABASE_PORT'] = db_parameters.get('port', ini['DATABASE_PORT'])
    ini.save(path_to_settings)

def exec_sql(db_type, sql, conn_string):
    """
        Выполняет sql-команды    
    """
    if DEBAG:
        print_log('conn_string: %s \nsql: %s' % (conn_string, sql))
    
    if db_type==POSTGRE:
        try:
            import psycopg2
        except:
            print_log("Don\'n import psycopg2")
            raise
    
        try:
            conn = psycopg2.connect(conn_string)
            conn.set_isolation_level(0)
            cur = conn.cursor()
        except Exception, message:
            print_log("Unable to connect to the database" + ('\n%s' % message))
            raise

        try:
            cur.execute(sql)
        except:
            print_log("Error sql execute")
            raise


def full_install(options):
    if DEBAG:
        print_log(options.path_to_project)
        print_log(options.type_install)
        print_log(options.db_type)
        print_log(options.host)
        print_log(options.port)
        print_log(options.user)
        print_log(options.password)
        print_log(options.db_name)
        print_log(options.src_file)

    
    print_log('Unzipping archive...')
    try:
        #pass
        unzip_file_into_dir(options.src_file, options.path_to_project)
    except Exception, message:
        print_log("Don't much unzipping archive")
        print_log(message, mtERROR)
        exit()
    
    conndb_param = {'host': options.host,
                     'port':options.port or '',
                     'user':options.superuser or '',
                     'password':options.superpassword or ''}

    # connection string:
    conn_string = ' '.join(['%s=%s' % (k, v) for k, v in conndb_param.items() if conndb_param[k]])         
    create_db = 'CREATE DATABASE %s' % options.db_name
    create_user = "CREATE USER %s WITH PASSWORD '%s' NOCREATEDB" % (options.user, options.password) #options.user
    grant_privileges = 'GRANT ALL PRIVILEGES ON DATABASE %s TO %s' % (options.db_name, options.user)

    print_log('Creating database...')
    try:
        exec_sql(options.db_type, create_db, conn_string)
    except:
        print_log('Database not created.', mtERROR)
        exit()

    print_log('Creating user %s...' % options.user)
    try:
        exec_sql(options.db_type, create_user, conn_string)
    except:
        print_log('User nit created.', mtERROR)
        exit()

    print_log('Creating privileges on %s to %s' % (options.db_name, options.user))
    try:
        exec_sql(options.db_type, grant_privileges, conn_string)
    except:
        print_log('Privileges not set!!', mtERROR)
        exit()

    # Set in django parameters in settings.py
    print_log('Set django settings parameters...')
    django_param = {'host': str(options.host),
                     'port':str(options.port) or '',
                     'user':str(options.user) or '',
                     'password':str(options.password) or '',
                     'dbname':str(options.db_name) or ''}
    try:
        set_db_parameters(options.path_to_project, options.db_type, **django_param)
    except Exception, message:
        print_log('Set django settings.py.')
        print_log(message)
        exit()

    # Django syncdb:
    try:
        subprocess.call([get_path_to_python(), options.path_to_project + PATH_TO_MANAGE,'syncdb','--noinput'])
    except:
        print_log('SyncDB..', mtERROR)
        exit()

def get_path_to_python():
    '''
        For Win 
    '''
    for path in sys.path:
        path_to_python = '%s\\python.exe' % path
        if os.path.exists(path_to_python):
            return path_to_python

def update_version(options):
    '''
        Update
    '''
    pass

def update_build(options):
    pass
    

def main():
    """
        main()
    """
    print_log('Begin install:')
    
    usage = "usage: %prog [options] arg"
    parser = OptionParser(usage, version="%prog " + SETUP_VERSION)
    add_all_parameters(parser)  
    (options, args) = parser.parse_args()


    # Нужно проверить введенные значения на корректность
    if options.db_type not in SUPPORTED_DB:
        parser.error("%s not supported." % options.db_type)
        raw_input('Press ENTER to continue...')
        exit()

    # add path to project to PyntonPath, need to import python-file
    #sys.path.append(options.path_to_project + r'\eor')
    
    if options.type_install==1:
        full_install(options)
    elif options.type_install==2:
        update_version(options)
    elif options.type_install==3:
        update_build(options)
    else:
        parser.error('Install type %s not supported.' % options.type_install)
        exit()

    raw_input('Installation successfully. Press ENTER to continue...')

if __name__ == "__main__":
    main()
