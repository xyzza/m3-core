#coding:utf-8
'''
Created on 12.04.2011

@author: akvarats
'''

import datetime

from django.test import TestCase
from registers import CumulativeDayRegister
from models import RegisterDayModel

class CumulativeRegisterTests(TestCase):
    '''
    Тесты для кумулятивного регистра
    '''
    
    def test_infrastracture(self):
        '''
        Проверяем работу вспомогательных методов регистра
        '''
        
        dirty_kwargs = dict(dim1='dim1',
                            dim2='dim2',
                            dim3='dim3',
                            dim4='dim4', # этого параметра типа в модели нет
                            rest1='rest1',
                            rest2='rest2',
                            circ1='circ1',
                            circ2='circ2',)
        
        cleaned_model_kwargs = CumulativeDayRegister._cleaned_kwargs_by_model(CumulativeDayRegister.model, dirty_kwargs)
        cleaned_dim_kwargs = CumulativeDayRegister._cleaned_kwargs_by_dims(CumulativeDayRegister.model, dirty_kwargs)
        cleaned_rest_kwargs = CumulativeDayRegister._cleaned_kwargs_by_rests(CumulativeDayRegister.model, dirty_kwargs)
        cleaned_circ_kwargs = CumulativeDayRegister._cleaned_kwargs_by_circs(CumulativeDayRegister.model, dirty_kwargs)
        
        
        self.failUnlessEqual(len(cleaned_model_kwargs), 7)
        self.failUnlessEqual(len(cleaned_dim_kwargs), 3)
        self.failUnlessEqual(len(cleaned_rest_kwargs), 2)
        self.failUnlessEqual(len(cleaned_circ_kwargs), 2)
        
        
        self.failUnlessEqual(cleaned_model_kwargs['dim1'], 'dim1')
        self.failUnlessEqual(cleaned_model_kwargs['dim2'], 'dim2')
        self.failUnlessEqual(cleaned_model_kwargs['dim3'], 'dim3')
        self.failUnlessEqual(cleaned_model_kwargs['rest1'], 'rest1')
        self.failUnlessEqual(cleaned_model_kwargs['rest2'], 'rest2')
        self.failUnlessEqual(cleaned_model_kwargs['circ1'], 'circ1')
        self.failUnlessEqual(cleaned_model_kwargs['circ2'], 'circ2')
        
        self.failUnlessEqual(cleaned_dim_kwargs['dim1'], 'dim1')
        self.failUnlessEqual(cleaned_dim_kwargs['dim2'], 'dim2')
        self.failUnlessEqual(cleaned_dim_kwargs['dim3'], 'dim3')
        
        self.failUnlessEqual(cleaned_rest_kwargs['rest1'], 'rest1')
        self.failUnlessEqual(cleaned_rest_kwargs['rest2'], 'rest2')
        
        self.failUnlessEqual(cleaned_circ_kwargs['circ1'], 'circ1')
        self.failUnlessEqual(cleaned_circ_kwargs['circ2'], 'circ2')
        
    def test_simple_write(self):
        
        CumulativeDayRegister.write(date = datetime.date(2011,1,1), 
                                    dim1='1',
                                    dim2=10,
                                    dim3='2',
                                    rest1=10,
                                    rest2=15,)
        
        CumulativeDayRegister.write(date = datetime.date(2011,2,1), 
                                    dim1='1',
                                    dim2=10,
                                    dim3='2',
                                    rest1=100,
                                    rest2=150,)
        
        CumulativeDayRegister.write(date = datetime.date(2011,1,15), 
                                    dim1='1',
                                    dim2=10,
                                    dim3='2',
                                    rest1=2,
                                    rest2=3,)
        
        # до начала времен
        rest1, rest2, circ1, circ2 = CumulativeDayRegister.get(datetime.date(2010,1,1),
                                                               dim1='1',
                                                               dim2=10,
                                                               dim3='2')
        self.failUnlessEqual(rest1, 0)
        self.failUnlessEqual(rest2, 0)
        self.failUnlessEqual(circ1, 0)
        self.failUnlessEqual(circ2, 0)
        
        
        rest1, rest2, circ1, circ2 = CumulativeDayRegister.get(datetime.date(2011,1,15),
                                                               dim1='1',
                                                               dim2=10,
                                                               dim3='2')
        
        self.failUnlessEqual(rest1, 12)
        self.failUnlessEqual(rest2, 18)
        self.failUnlessEqual(circ1, 2)
        self.failUnlessEqual(circ2, 3)
        
        rest1, rest2, circ1, circ2 = CumulativeDayRegister.get(datetime.date(2011,1,16),
                                                               dim1='1',
                                                               dim2=10,
                                                               dim3='2')
        
        self.failUnlessEqual(rest1, 12)
        self.failUnlessEqual(rest2, 18)
        self.failUnlessEqual(circ1, 0)
        self.failUnlessEqual(circ2, 0)
        
        rest1, rest2, circ1, circ2 = CumulativeDayRegister.get(datetime.date(2011,2,1),
                                                               dim1='1',
                                                               dim2=10,
                                                               dim3='2')
        
        self.failUnlessEqual(rest1, 112)
        self.failUnlessEqual(rest2, 168)
        self.failUnlessEqual(circ1, 100)
        self.failUnlessEqual(circ2, 150)
        
        rest1, rest2, circ1, circ2 = CumulativeDayRegister.get(datetime.date(2011,2,2),
                                                               dim1='1',
                                                               dim2=10,
                                                               dim3='2')
        
        self.failUnlessEqual(rest1, 112)
        self.failUnlessEqual(rest2, 168)
        self.failUnlessEqual(circ1, 0)
        self.failUnlessEqual(circ2, 0)
        