#coding:utf-8
from m3.db import models, BaseObjectModel, BaseEnumerate

__author__ = 'ZIgi'


class DocumentTypeGroup(BaseObjectModel):
    '''
    Группа типов документов
    '''
    name = models.CharField(max_length=300, null = False, blank = False)
    parent = models.ForeignKey('self', null = True)

    class Meta:
        db_table = 'm3_docs_doc_type_group'


class DocumentType(BaseObjectModel):
    '''
    Тип документа
    '''
    code = models.CharField(max_length=100, null = True, blank = True)
    name = models.CharField(max_length=200, null = False, blank = False)
    parent = models.ForeignKey(DocumentTypeGroup, null = False)

    class Meta:
        db_table = 'm3_docs_doc_type'

class DocumentFieldTypeEnum(BaseEnumerate):
    '''
    Тип дополнительного аттрбута
    '''
    STRING = 1 # Текстовое поле
    BOOLEAN = 2 # Логическое
    NUMBER = 3 # Числовое
    DATE = 4 # Дата
    DATETIME = 5 # Дата + время
    LIST = 6 # Список

    values = { STRING: u'Текст',
               BOOLEAN: u'Логическое',
               NUMBER: u'Числовое',
               DATE: u'Дата',
               DATETIME: u'Дата и время',
               LIST: u'Список' }

class DocumentField(BaseObjectModel):
    '''
    Произвольное поле документа
    '''
    document_type = models.ForeignKey(DocumentType, null = False)
    name = models.CharField(max_length=300) #название поля
    section = models.ForeignKey('DocumentSection', null = True) #секция, которой приндлежит поле
    type = models.PositiveIntegerField(choices = DocumentFieldTypeEnum.get_choices())
    allow_blank = models.BooleanField(default = True) # обязательно для заполнения
    regexp = models.CharField(max_length= 300, null = True, blank = True ) # проверка значений для текстовых полей
    decimal_precision = models.PositiveIntegerField(null = True) # ограничение знаков после запятой для числовых полей
    order_index = models.IntegerField(null = False) # порядковое положение поля
    meta = models.TextField() # значения для выбора из списка, возможно потом что-нибудь еще будет там лежать

    class Meta:
        db_table = 'm3_docs_doc_field'


class DocumentSection(BaseObjectModel):
    '''
    Секция документа. Это элемент логичской группировки полей документа
    '''
    document_type = models.ForeignKey(DocumentType, null = False, related_name='sections')
    name = models.CharField(max_length = 200, null = False, blank = False)
    multiple = models.BooleanField(default = False) # возможно ли повторение секции в пределах документа
    order_index = models.IntegerField(null = False) # порядковый индекс секции
    parent = models.ForeignKey('self', null = True) # родительская секция, если секции вложенные

    class Meta:
        db_table = 'm3_docs_doc_section'
