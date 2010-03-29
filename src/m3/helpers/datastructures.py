#coding:utf-8
'''
Created on 29.03.2010

@author: prefer
'''
class TypedList(list):
    '''
        Вспомогательный класс, перекрывает три метода - добавление (append, insert) и изменение атрибута
        Атрибут должен быть типом, переданном в качестве параметра type, или соответствовать значению,
        переданному в *aprgs - иначе выводится assert
    '''
    def __init__(self, type):
        ''' 
        @param type: Тип значений, которые должны находится в списке
        '''
        super(TypedList, self).__init__()
        self.__type = type
        
    def __setitem__(self, key, value):
        self.__check(value)
        super(TypedList, self).__setitem__(key, value)
 
    def append(self, value):
        self.__check(value)
        super(TypedList, self).append(value)

    def insert(self, num, value):
        self.__check(value)
        super(TypedList, self).insert(num, value)
        
    def __check(self, value):
        '''
            Функция проверки типа и значения
            Сначало проверяется значение, то есть если значение "Разделитель" = "-" и тд, то дальнейшие проверки не осуществляются
            Иначе проверяется тип объекта.
        '''
        assert isinstance(value, self.__type), 'Type value "%s" isn\'t %s!' % (value, self.__type.__name__)