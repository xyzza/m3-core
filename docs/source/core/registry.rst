Регистры накопления
-------------------

Для того, чтобы задать регистр накопления необходимо:

#. описать модель хранения записей регистра;
#. создать управляющий класс, с использованием которого осуществляется вся работа
   с данным регистром.
   
Модель хранения записей регистра является обычной моделью приложения, в которой
в обязательном порядке должны быть объявлены следующие поля:

#. поле для хранения системной даты регистра. Это должно быть поле одного из
   двух типов: DateField либо DateTimeField (в зависимости от типа периодичности
   регистра).
#. одно и более числовых полей, в которых будут храниться накопление и обороты
   регистра.
   
В обычном регистре также присутствуют поля, которые являются так называемыми
измерениями регистра. Значения данных полей задают разрезы, в которых храняться
суммовые поля. 

Пример описания модели хранения регистра::
    
    # someapp/models.py
    
    class MyRegisterModel(models.Model):
        '''
        Модель хранения записей регистра
        '''
        date = models.DateField(db_index=True)
        
        # измерения
        dim1 = models.ForeignKey('someapp.SomeModel', db_index=True)
        dim2 = models.IntegerField(db_index=True)
        dim3 = models.CharField(max_length=30, db_index=True)
        
        # суммовые поля хранения накопления
        rest1 = models.DecimalField(max_digits=16, decimal_places=2)
        rest2 = models.DecimalField(max_digits=16, decimal_places=2)
        
        # суммовые поля хранения оборотов
        circ1 = models.DecimalField(max_digits=16, decimal_places=2)
        circ2 = models.DecimalField(max_digits=16, decimal_places=2)
        
        
Каждое поле регистра должно быть либо системной датой, либо измерением, 
либо полем хранения накопления, либо полем хранения оборотов. Остальные поля
при сохранении данных в регистр игнорируются.

В модели хранения записей для полей системной даты и всех измерений 
рекомендуется указывать ``db_index=True``, поскольку эти поля участвуют
в выборках и сортировках. 

Особенность задания модели хранения состоит в том, что *количество полей накопления
должно совпадать с количеством полей оборотов*.

Управляющий класс регистра должен быть унаследован от базового класса 
``m3.core.registry.CumulativeRegister``.

.. module:: m3.core.registry.cumulative

.. autoclass:: CumulativeRegister
   :members:

Пример задания управляющего класса::
    
    # someapp/some_module.py
    
    from models import MyRegisterModel 

    class MyCumulativeRegister(CumulativeRegister):
        '''
        Простой куммулятивный регистр
        '''
        model = MyRegisterModel
        
        dim_fields = ['dim1', 'dim2', 'dim3',]
        rest_fields = ['rest1', 'rest2',]
        circ_fields = ['circ1', 'circ2',]
        
Пример работы с регистрами::

        MyCumulativeRegister.write(date = datetime.date(2011,1,1), 
                                   dim1='1', dim2=10, dim3='2',
                                   rest1=10, rest2=15,)
        
        MyCumulativeRegister.write(date = datetime.date(2011,2,1), 
                                   dim1='1', dim2=10, dim3='2', 
                                   rest1=100, rest2=150,)
        
        MyCumulativeRegister.write(date = datetime.date(2011,1,15), 
                                   dim1='1', dim2=10, dim3='2',
                                   rest1=2, rest2=3,)
        
        rest1, rest2, circ1, circ2 = MyCumulativeRegister.get(datetime.date(2010,1,1),
                                                              dim1='1', dim2=10, dim3='2')
        self.failUnlessEqual(rest1, 0)
        self.failUnlessEqual(rest2, 0)
        self.failUnlessEqual(circ1, 0)
        self.failUnlessEqual(circ2, 0)
        
        
        rest1, rest2, circ1, circ2 = MyCumulativeRegister.get(datetime.date(2011,1,15),
                                                              dim1='1',
                                                              dim2=10,
                                                              dim3='2')
        
        self.failUnlessEqual(rest1, 12)
        self.failUnlessEqual(rest2, 18)
        self.failUnlessEqual(circ1, 2)
        self.failUnlessEqual(circ2, 3)
        
        rest1, rest2, circ1, circ2 = MyCumulativeRegister.get(datetime.date(2011,1,16),
                                                              dim1='1',
                                                              dim2=10,
                                                              dim3='2')
        
        self.failUnlessEqual(rest1, 12)
        self.failUnlessEqual(rest2, 18)
        self.failUnlessEqual(circ1, 0)
        self.failUnlessEqual(circ2, 0)
        
        rest1, rest2, circ1, circ2 = MyCumulativeRegister.get(datetime.date(2011,2,1),
                                                              dim1='1',
                                                              dim2=10,
                                                              dim3='2')
        
        self.failUnlessEqual(rest1, 112)
        self.failUnlessEqual(rest2, 168)
        self.failUnlessEqual(circ1, 100)
        self.failUnlessEqual(circ2, 150)
        
        rest1, rest2, circ1, circ2 = MyCumulativeRegister.get(datetime.date(2011,2,2),
                                                              dim1='1',
                                                              dim2=10,
                                                              dim3='2')
        
        self.failUnlessEqual(rest1, 112)
        self.failUnlessEqual(rest2, 168)
        self.failUnlessEqual(circ1, 0)
        self.failUnlessEqual(circ2, 0)