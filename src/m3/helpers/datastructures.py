#coding:utf-8
'''
Created on 29.03.2010

@author: prefer
'''
class TypedList(list):
    '''
        Вспомогательный класс, перекрывает три метода - добавление (append, insert, extend), изменение и расширение списка
        Атрибут должен быть типом, переданном в качестве параметра type, или соответствовать значению,
        переданному в *aprgs - иначе выводится assert
        Если значение входит в список исключений exceptions, то проверка не производится
    '''
    def __init__(self, type, exceptions = []):
        ''' 
        @param type: Тип значений, которые должны находится в списке
        '''
        super(TypedList, self).__init__()
        self.__type = type
        self.__exceptions = exceptions
        
    def __setitem__(self, key, value):
        self.__check(value)
        super(TypedList, self).__setitem__(key, value)
 
    def append(self, value):
        self.__check(value)
        super(TypedList, self).append(value)

    def insert(self, num, value):
        self.__check(value)
        super(TypedList, self).insert(num, value)
        
    def extend(self, values):
        map(self.append, values)
        
    def __check(self, value):
        '''
            Функция проверки типа и значения
            Сначало проверяется значение, то есть если значение "Разделитель" = "-" и тд, то дальнейшие проверки не осуществляются
            Иначе проверяется тип объекта.
        '''
        if value not in self.__exceptions:
            assert isinstance(value, self.__type), 'Type value "%s" isn\'t %s!' % (value, self.__type.__name__)
            
class MutableList(list):
    '''
    Список с признаком измененности "changed"
    '''
    def __init__(self, mutable = True, *args, **kwargs):
        super(MutableList, self).__init__(*args, **kwargs)
        self._mutable = mutable
        self.changed = False
    
    def _assert_mutable(self):
        if not self._mutable:
            raise AttributeError("This MutableList instance is immutable")
        self.changed = True
    
    def __setitem__(self, key, value):
        self._assert_mutable()
        super(MutableList, self).__setitem__(key, value)
        
    def append(self, value):
        self._assert_mutable()
        super(MutableList, self).append(value)
    
    def extend(self, values):
        self._assert_mutable()
        super(MutableList, self).extend(values)
    
    def insert(self, num, value):
        self._assert_mutable()
        super(MutableList, self).append(num, value)
