.. _dev_m3_query_builder:

Генератор отчетов с точки зрения разработчика прикладных проектов на М3.
========================================================================

.. _description:

Общее описание работы генератора отчетов
----------------------------------------
Сервер и клиент генератора отчетов (далее просто генератор отчетов или ГО)
работает так:

Клиент ГО в прикладной системе собирает особым образом
сформированные классы, оформленные в специальных файлах. Эти классы называются
сущностями. Сущности преобразуются в JSON, и отправляются на сервер ГО
где сохраняются для дальнейшего использования.

Далее, с помощью веб-интерфейса, предоставляемого клиентом ГО,
на сервере ГО можно составлять запросы на основе тех сущностей,
которые ранее были загружены клиентом.

После того, как составлены необходимые запросы, можно загрузить на сервер
специальным образом составленный шаблон, и связать его с составленными
запросами. Таким образом можно составлять практически ничем не ограниченные
отчеты.

Подробная инструкция о составлении запросов и отчетов находится в
разделе :ref:`Документация для пользователей <user>`.

После того, как шаблон составлен, с помощью клиентского интерфейса можно
отправить запрос с необходимыми параметрами на сервер ГО, и получить
заполненный отчет.

*Важно:* При составлении отчета, ГО пытается обратиться за данными в БД по тем
настройкам, которые предоставил клиент. Поэтому важно следить за тем, чтобы
клиетская БД могла принимать запросы с URI ГО.


Подключение генератора отчетов в прикладных проектах
-------------------------------------------------------------

Любой прикладной проект на М3 можно связать с ГО.
Для этого в первую очередь нужно подойти к куратору сервера ГО, и
зарегистрировать на нем свой проект. После этого нужно добавить некоторые
параметры в файлы настройки проекта.

.. _settings:

Настройки проекта
--------------------------------

Сначала нужно подключить к проекту контриб клиента ГО. Для
этого нужно добавить внутрь параметра-словаря ``__require__`` файла
``version.py`` следующую пару "ключ-значение": *'m3_query_builder': 'default'*.

После этого необходимо запустить сценарий ``prepare_env.py``.

Как только сценарий закончит свою работу, следует добавить к параметру-кортежу
``INSTALLED_APPS`` файла ``settings.py`` строку *'m3_query_builder'*.

Это подключит М3 клиента ГО. Теперь следует настроить его.
Для этого нужно добавить в файл ``settings.py`` следующие параметры::

    REPORT_GENERATOR_URL = 'http://localhost:8000'

Ключ, выданный вам куратором сервера ГО. Служит
флагом разделения пространства каждого клиента, пока нет авторизации::

    REPORT_GENERATOR_SYSTEM_ID = 'bars-office-test'

Настройки БД. По этим настройкам ГО будет пытаться обратиться к БД клиента,
например для выполнения SQL-запроса, поэтому важно следить, чтобы они были
верными.

Настройки могут отличаться от тех, которые используются основным приложением,
так как запросы могут поступать с внешних URI, и под ключом HOST необходимо
будет указывать URI или ip сервера БД, в отличии от наиболее часто
используемого localhost::

    METADATA_CONNECTION = {
        'default': {
            'ENGINE'  : DATABASES['default']['ENGINE'],
            'NAME'    : conf.get('database', 'DATABASE_NAME'),
            'USER'    : conf.get('database', 'DATABASE_USER'),
            'PASSWORD': conf.get('database', 'DATABASE_PASSWORD'),
            'HOST'    : conf.get('database', 'DATABASE_HOST'),
            'PORT'    : conf.get('database', 'DATABASE_PORT'),
        }
    }
    if conf.get('database', 'READONLY_DATABASE_USER'):
        METADATA_CONNECTION['readonly'] = {
            'ENGINE'  : DATABASES['readonly']['ENGINE'],
            'NAME'    : conf.get('database', 'DATABASE_NAME'),
            'USER'    : conf.get('database', 'READONLY_DATABASE_USER'),
            'PASSWORD': conf.get('database', 'READONLY_DATABASE_PASSWORD'),
            'HOST'    : conf.get('database', 'DATABASE_HOST'),
            'PORT'    : conf.get('database', 'DATABASE_PORT'),
        }

.. _add-entity-rules:

Добавление сущностей в схемы
------------------------------

Далее под понятием "*сущность*" будет подразумеваться некий объект, который
может быть моделью в django-представлении, либо объект, который реализует 
определенный интерфейс ``BaseEntity``. 

В приложении необходимо создать файл с названием ``schema.py``, в котором необходимо описать 
имеющиеся в этом приложении сущности, например, сущности "*Аудит*" и 
"*Пользователи и метароли*" описываются следующим образом::

	class EntityOne(BaseEntity):
	    '''
	    Пользователь и его метароли
	    '''
	    def __init__(self):
	        super(EntityOne, self).__init__()
	
	        # Константные объекты для упрощенного доступа внутри сущности
	        class Data(object):
	            # Модель ролей
	            USER_ROLE = Model('m3_users.UserRole')
	            
	            # Модель связей ролей и пользователей
	            ASSIGNED_ROLE = Model('m3_users.AssignedRole')
	            
	            # Модель пользователей
	            USER = Model('auth.User')
	
	        # Название сущности - то, как она будет называться в редакторе запросов
	        self.name = u'Пользователь и его метароли'
	
	        # Список сущностей, который будет использоваться 
	        self.entities = [
	            Data.USER_ROLE,
	            Data.ASSIGNED_ROLE,
	            Data.USER,
	        ]
	
	        # Список связей между сущностями
	        self.relations = [
	            Relation( Field(Data.USER_ROLE, 'id'), Field(Data.ASSIGNED_ROLE, 'role') ),
	            Relation( Field(Data.ASSIGNED_ROLE, 'user'), Field(Data.USER, 'id') ),
	        ]
	
	        # Можно не указывать
	        self.group_by = []
	
                # Описание условия могло бы выглядеть вот так:
                # self.where = Where(Field(Data.ASSIGNED_ROLE, 'id'), 
                #					 Where.NE, 
                #					 Param(name='param1', 
                #						type=Param.NUMBER, 
                #						verbose_name=u'Идентификатор параметра')
                #				) & Where(Field(Data.USER, 'username'), 
                #						Where.EQ, 
                #						Param(name='param2', 
                #							type=Param.STRING, 
                #							verbose_name=u'ФИО пользователя') )
			
                # Описание сортировки могло бы выглядеть вот так:
                #self.order_by = [SortOrder(Field(Data.USER, 'username'), SortOrder.ASC)]
	
	        # Список полей, которые будут использоваться в выводе данных
	        self.select = [
	            Field(Data.USER, Field.ALL_FIELDS),
	            Field(Data.ASSIGNED_ROLE, 'id',  alias='assign_id'),
	            Field(Data.USER_ROLE, 'metarole'),
	        ]
	
	        # Использовать ли признак DISTINCT
	        self.distinct = None
	        
	class EntityTree(BaseEntity):
	    '''
	    Аудит
	    '''
	    def __init__(self):
	        super(EntityTree, self).__init__()
	
	        class Data(object):
	            AUDIT = Model('m3_audit.AuthAuditModel')
	
	        self.name = u'Аудит'
	
	        self.entities = [
	            Data.AUDIT,        
	        ]
	
	        self.relations = []
	
	        self.group_by = []
	
	        self.where = None
	
	        self.order_by = [SortOrder(Field(Data.AUDIT, field_name='id'), SortOrder.DESC)]
	
	        self.select = [
	            Field(Data.AUDIT, Field.ALL_FIELDS),        
	        ]
	
	        self.distinct = None
	        
Обязательное условие - описываемые классы должны наследоваться от ``BaseEntity`` и 
должны декларативно описывать свои возможности.

Разберем возможности более подробно:

.. module:: m3_query_builder.entity

* Класс ``Data``:

 * Нужен для более легкого доступа к сущностям модели, то есть чтобы 
   везде не писать ``Model('m3_audit.AuthAuditModel')``, можно использовать 
   ``Data.AUDIT``
 
 * ``Model('m3_audit.AuthAuditModel')`` - ``Model`` в контекте *django* говорит о том, что используется 
   модель. Так же есть возможность использовать ``Entity``:
	  
   .. autoclass:: Model
      :noindex:
   
   .. autoclass:: Entity
      :noindex:
   
* Атрибут ``name``:
  Название сущности
  
* Атрибут ``entities``:
  Список возможных сущностей, которые включают в себя данные из ``Data``, которые
  будут участвовать в запросе. Пример::    
  
   self.entities = [
      Data.USER_ROLE,
      Data.ASSIGNED_ROLE,
      Data.USER,
   ]

* Атрибут ``relations``:
  Список связей между сущностями ``entities``
  
  Пример: ::
  
    self.relations = [
        Relation( Field(Data.USER_ROLE, 'id'), Field(Data.ASSIGNED_ROLE, 'role') ),
        Relation( Field(Data.ASSIGNED_ROLE, 'user'), Field(Data.USER, 'id') ),
    ]

  где ``Relation``:
  
  .. autoclass:: Relation
     :noindex:
  
  и где ``Field``:
  
  .. autoclass:: Field
     :noindex:

* Атрибут ``group_by``:
  Список полей для сортировки
  
  Пример::
  
	  # Список полей для группировки
	  group_fields = [Field(Data.USER_ROLE, 'username'),]
	  # Список полей для агрегированных выражений: поддерживаются Count, Min, Max
	  aggr_fields = [Aggregate.Count(Field(Data.USER_ROLE, 'id')),]
	  self.group_by = Grouping(group_fields=group_fields, 
	                               aggregate_fields=aggr_fields)
	                               
  ``Grouping``:
  
  .. autoclass:: Grouping
     :noindex:
  
  ``Aggregate``:
  
  .. autoclass:: Aggregate
     :noindex:

  ``Field``:
  
  .. autoclass:: Field
     :noindex:

* Атрибут ``order_by``:
  Список полей для сортировки
  
  Пример::
  
  	# Возможна по возрастанию (SortOrder.ASC) и по убыванию (SortOrder.DESC)
	self.order_by = [SortOrder(Field(Data.USER, 'username'), SortOrder.ASC)]
	
  ``SortOrder``:
	
  .. autoclass:: SortOrder
	 :noindex:
	
* Атрибут ``select``:
  Список результирующих полей, которые будут отображаться в готовом отчете


  Пример::
  
	  self.select = [
	    Field(Data.USER, Field.ALL_FIELDS),
	    Field(Data.ASSIGNED_ROLE, 'id',  alias='assign_id'),
	    Field(Data.USER_ROLE, 'metarole'),
	  ]
	  
  ``Field.ALL_FIELDS``- Будут показаны все поля, имеющиеся в сущности.

* Атрибут ``where``:
  Список условий
    
    
  Пример::
    
    # Добавляет условие неравно на поле id сущности Data.ASSIGNED_ROLE
    # где параметр должен называться "param1" и иметь числовой тип
    # текстовое представление параметра "Идентификатор параметра" - нужно
    # для представления в коррилице в редакторе запросов 
    self.where = Where( Field(Data.ASSIGNED_ROLE, 'id'), Where.NE, 
                    	    Param(name='param1', type=Param.NUMBER, 
                    	        verbose_name=u'Идентификатор параметра')) 
                    	        
    # Добавляет к предыдущему условию уловие через AND (&).
    # Условие "равно" накладывается на поле "username" сущности Data.USER,
    # где параметр должен называться как "param2", иметь строковый тип
    # Представление параметра в кириллице: "ФИО пользователя"
    self.where &= Where( Field(Data.USER, 'username'), Where.EQ, 
                             Param(name='param2', type=Param.STRING, 
                                 verbose_name=u'ФИО пользователя'))
                                 
  Условия, подобно условиям в django, можно соединять через: 
   * ``&`` (AND - логическое "И"); 
   * ``|`` (OR - логическое "ИЛИ"); 
   * ``~`` (NOT - не равно);
  
  Доступные логические конструкции внутри условия::
   
   # Условия при преобразовании в SQL использует конструкцию ANY(...)
   # Параметров может быть множество и они передаются в списке
   Where.EQ = u'= (Вхождение)'
   Where.NE = u'!= (Не вхождение)'
   
   # Не зависит от количества параметров
   Where.LT = '<'
   Where.LE = '<='
   Where.GT = '>'
   Where.GE = '>='
  
  ``Where``:
  
  .. autoclass:: Where
     :noindex:
  
  Предопределенные типы параметров (для подстановки в редактор отчетов)::
  
    STRING = 1 # Строковое представление
    NUMBER = 2 # Числовое
    DICTIONARY =3 # Выбор из справочника
    DATE = 4 # Дата
    BOOLEAN = 5 # Булево
  
  ``Param``:
  
  .. autoclass:: Param
     :noindex:

* Атрибут ``distinct``:
  ``True`` или ``False`` - Добавляет ключевое слово ``DISTINCT`` в запрос.
  Пример: ::

    self.distinct = False
  
* Атрибут ``limit``:
  Добавляет количество отобранных записей. Пример: ::

    self.limit = 100 # Будут возвращены 100 записей
    
    
Простейшая схема без наворотов с сортировками, группировками и прочим может быть 
представлена следующим образом::

	class EntityAudit(BaseEntity):
	    '''
	    Сущность для аудита
	    
	    Использует модель "m3_audit.AuthAuditModel" и предоставляет доступ ко
	    всем имеющимся полям в модели
	    '''
	    def __init__(self):
	        super(EntityAudit, self).__init__()
	
	        class Data(object):
	            AUDIT = Model('m3_audit.AuthAuditModel')
	
	        self.name = u'Аудит'
	
	        self.entities = [Data.AUDIT,]
	
	        self.select = [Field(Data.AUDIT, Field.ALL_FIELDS),]

.. _rules-cirilic-name:

Правила именования полей в кириллице
-------------------------------------

Для моделей django необходимо проставлять ``verbose_name`` в полях, например::

	class BaseAuditModel(models.Model):
	    '''
	    Базовая модель, от которой наследуются все 
	    модели хранения результатов аудита
	    '''
	    
	    # данные пользователя. специально не делается ForeignKey.
	    # чтобы не быть завязанными на ссылочную целостность
	    # * логин пользователя в системе (на момент записи значения
	    username = models.CharField(max_length=50, null=True, blank=True, 
	                                db_index=True, default=u'', 
	                                verbose_name=u'Логин пользователя')
	    
	    # * идентификатор пользователя
	    userid = models.PositiveIntegerField(default=0, db_index=True,
	                                    verbose_name=u'Идентификатор пользователя')
	
	    # * ФИО пользователя на момент записи значения (для ускоренного отображения 
	    #   значений
	    user_fio = models.CharField(max_length=70, null=True, blank=True, 
	                                db_index=True, default=u'',
	                                verbose_name=u'ФИО пользователя')
	    
	    # * дополнительные сведения о пользователе (например, сотрудником какого 
	    #   учреждения он являлся на момент записи
	    user_info = models.CharField(max_length=200, null=True, blank=True, default=u'',
	                                verbose_name=u'Дополнительные сведения о пользователе')
	    
	    # серверный таймстамп на запись аудита
	    created = models.DateTimeField(auto_now_add=True, db_index=True, 
	                                verbose_name=u'Дата создания')
	                                
Для сущностей, наследников от ``BaseEntity`` необходимо, чтобы в списке ``self.select`` 
у каждого поля ``Field`` имелось текстовое представление ``verbose_name``