#coding:utf-8
'''
Created on 22.04.2011

@author: akvarats
'''

#===============================================================================
# Описание врапперов над структурой элементов базы данных (таблиц и их полей)
#===============================================================================

class DBTable(object):
    '''
    Враппер над таблицами в базе данных
    '''
    def __init__(self):
        self.name = '' # имя таблицы в базе данных
        self.fields = [] # список полей для таблицы в базе данных
        
    def find_field(self, field_name):
        '''
        Метод находит поле с указанным именем. Если поле не найдено в описании
        таблицы, то возвращается None
        '''
        for field in self.fields:
            if field.name == field_name:
                return field
        return None

class NullTable(DBTable):
    '''
    Фейковый класс, который представляет собой пустую, несуществующую таблицу.
    
    Данный класс необходим для того, чтобы дать понять механизмам миграции о том,
    что таблица не существует в базе данных
    '''
    pass

class DBField(object):
    '''
    Враппер над полем таблицы в базе данных
    '''
    def __init__(self):
        self.name = '' # наименование поля
        self.django_type = '' # имя в базе данных
        self.indexed = False # признак создания индекса для поля
        self.allow_blank = True
        

class IDField(DBField):
    '''
    Поле, являющееся идентификатором записи в таблице базы данных
    '''
    def __init__(self):
        self.name = 'id'
        self.django_type = 'django.db.models.fields.AutoField'
        self.indexed = True
        self.allow_blank = False
        
#===============================================================================
# Механизмы для миграции таблиц базы данных
#===============================================================================
class BaseMigrator(object):
    '''
    Базовый мигратор, выполняющий функции изменения структуры таблиц в базе 
    данных. 
    '''
    def __init__(self):
        pass
    
    def migrate(self, table_name, to_version, from_version=None):
        '''
        Метод миграции структуры таблицы
        
        @param to_version: представляет собой объект типа DBTable, который хранит
        описание
        '''
        pass
    
    def _get_active_version(self, table_name):
        '''
        Метод, который возвращает текущее активное описание таблицы. 
        
        Данный метод необходимо перекрывать в дочерних классах, которые
        собственно и реализуют поведение конкретного механизма управления
        динамическими таблицами.
        '''
        return None
    
    def _register_active_version(self, table_name, active_version):
        '''
        Метод регистрирует текущую активную версию базы данных. Данный метод 
        требует переопределения в конкретных методах миграции. 
        '''
        pass
    
    #===========================================================================
    # Внутренние приватные методы, которые 
    #===========================================================================
    
    def _diff_versions(self, left_version, right_version):
        '''
        Формирует список команд, с помощью таблица с описанием left_version
        должна быть переведена в таблицу с описанием right_version
        '''
        # внимание! с целью обеспечения читаемости кода в данном методе
        # есть несколько точек выхода. берегите себя. 
        commands = [] 
       
        # 0. если левой версии не существует, то надо сломиться и попытаться
        # получить её через специальные методы класса
        cleaned_right = right_version
        if not cleaned_right:
            raise Exception(u'В процедуре миграции правая версия таблицы должна быть всегда задана')
        
        cleaned_left = left_version if left_version else self._get_active_version(cleaned_right.name) 
        if not cleaned_left:
            raise Exception(u'Не удалось получить левую версию таблицы "%s".', cleaned_right.name)
        
        if (not isinstance(cleaned_left, NullTable) and
            not isinstance(cleaned_right, NullTable) and 
            cleaned_left.name != cleaned_right.name):
            raise Exception(u'Миграция таблиц с разными именами в левой и правой частях запрещена.')
        
        if (not isinstance(cleaned_left, DBTable) and 
            not isinstance(cleaned_right, DBTable)):
            raise Exception(u'При выполнении миграции либо в левой, либо в правой части должно находиться описание реальной таблицы (экземпляра класса DBTable)')
        
        db_table = cleaned_left if isinstance(cleaned_left) else cleaned_right
        
        # 1. Если правая версия является NullTable, то мы имеем дело с 
        # командой на удаление таблицы, если левая версия - то создания таблицы
        if isinstance(cleaned_right, NullTable):
            commands.append(DropTableCommand(cleaned_left))
            # поскольку дальше без вариантов, то мы завершаем выполнение
            return commands
        
        if isinstance(cleaned_left, NullTable):
            commands.append(CreateTableCommand(cleaned_left))
        
        # 2. проходимся по полям левой таблицы
        for left_field in cleaned_left:
            right_field = cleaned_right.find_field(left_field.name)
            
            if not right_field:
                commands.append(RemoveFieldCommand(db_table, left_field))
                continue
            
            # формирование команд на изменение индексов
            if left_field.indexed and not right_field.indexed:
                commands.append(RemoveFieldIndexCommand(db_table, right_field))
                 
            if right_field.indexed and not left_field.indexed:
                commands.append(AppendFieldIndexCommand(db_table, right_field))
                
            # формирование команд на изменение обязательность
            if left_field.allow_blank and not right_field.allow_blank:
                commands.append(ForbidFieldBlankCommand(db_table, right_field))
                                
            if right_field.allow_blank and not left_field.allow_blank:
                commands.append(AllowFieldBlankCommand(db_table, right_field))
            
        # 3. проходимся по полям правой таблицы
        for right_field in cleaned_right:
            left_field = cleaned_left.find_field(right_field.name)
            if not right_field:
                commands.append(AppendFieldCommand(db_table, right_field))
        
        return commands
    
class DDLCommand(object):
    '''
    Общий класс команды, с помощью которой происходит изменение описания таблицы 
    базы данных
    '''
    def __init__(self, db_table):
        '''
        @param db_table: описание таблицы, над которой выполняется DDL команда
        '''
        self.db_table = db_table


class CreateTableCommand(DDLCommand):
    '''
    Команда на создание таблицы
    '''
    def __init__(self, db_table):
        super(CreateTableCommand, self).__init__(db_table)
        
class DropTableCommand(DDLCommand):
    '''
    Команда на удаление таблицы из базы данных
    '''
    def __init__(self, db_table):
        super(DropTableCommand, self).__init__(db_table)
        
class BaseFieldCommand(DDLCommand):
    '''
    Базовая команда, предназначенная для работы с полями
    '''
    def __init__(self, db_table, db_field):
        '''
        @param db_table: таблица, над которой выполняется команда (объект класса
            DBTable)
        @param db_field: поле, над которым выполняется команда (объект класса
            DBField) 
        '''
        super(BaseFieldCommand, self).__init__(db_table)
        self.db_field = db_field

class AppendFieldCommand(BaseFieldCommand):
    '''
    Команда на добавление поля в таблицу
    '''
    def __init__(self, db_table, db_field):
        super(AppendFieldCommand, self).__init__(db_table, db_field)
        
        
class RemoveFieldCommand(BaseFieldCommand):
    '''
    Команда на удаление поля из таблицы
    '''
    def __init__(self, db_table, db_field):
        super(RemoveFieldCommand, self).__init__(db_table, db_field)
        
class AppendFieldIndexCommand(BaseFieldCommand):
    '''
    Команда на добавление индекса на поле таблицы
    '''
    def __init__(self, db_table, db_field):
        super(AppendFieldIndexCommand, self).__init__(db_table, db_field)
        
class RemoveFieldIndexCommand(BaseFieldCommand):
    '''
    Команда на добавление индекса на поле таблицы
    '''
    def __init__(self, db_table, db_field):
        super(RemoveFieldIndexCommand, self).__init__(db_table, db_field)
        
class AllowFieldBlankCommand(BaseFieldCommand):
    '''
    Команда, которая разрешает заполнение поля пустыми значениями
    '''
    def __init__(self, db_table, db_field):
        super(AllowFieldBlankCommand, self).__init__(db_table, db_field)
        
class ForbidFieldBlankCommand(BaseFieldCommand):
    '''
    Команда, которая запрещает заполнение поля пустыми значениями
    '''
    def __init__(self, db_table, db_field):
        super(ForbidFieldBlankCommand, self).__init__(db_table, db_field)