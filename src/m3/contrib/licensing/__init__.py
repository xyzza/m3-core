#coding:utf-8
'''
Набор инструкций, предназначенных для использования проверки лицензионного ключа

@author: telepenin
'''

import django.dispatch
import ConfigParser
import datetime
#from django.http import HttpResponse
from m3.contrib.licensing import helpers

class LicensingError(Exception):
    '''
        Исключения этого вида говорят о том, что лицензионный ключ не прошел проверку
    '''
    pass

class InheritanceError(Exception):
    '''
        Исключения этого вида говорят о том, что некоторые методы в классе необходимо перепределить
    '''
    pass

# Определение сигнала
signal_license_key = django.dispatch.Signal(providing_args=['app_key',])
def check_license_key(self, app_key):
    '''
        Посылает сигнал в космос на то, что нужно проверить лицензионный ключ
    '''
    try:
        signal_license_key.send(sender=self, app_key=app_key)
    except:
        raise    

class ApplicationLicKey:
    '''
        Используется как прослойка, в которую считывается значение
        поля body модели StoredLicKey (m3.contrib.licensing.models), и которую потом удобно использовать в
        различных подсистемах приложения.
        
        Поля:
        *orgname*: string # наименование организации, которой выдан данный лицензионный ключ
        *since*: date # дата выдачи лицезионного ключа;
        *until*: date # дата окончания действия лицензионного ключа
        *max_users*: integer # максимальное количество пользователей, которые могут быть заведены 
        # в системе (максимальное количество записей в таблице @django.contrib.auth.users@)
        *demo_mode*: boolean # отражает признак демонстрационного лицензионного ключа

    '''
    def __init__(self):
        self.__key_body = ''

    def __set_key(self):
        '''
            Возвращает и записывает Body ключа в поле __key_body 
        '''
        import StringIO
        try:
            key_body = helpers.get_key()
        except:
            key_body = None
        
        self.__key_body = StringIO.StringIO(key_body)    
        return self.__key_body
 
    def get_config(self):
        '''
        
            Создает и возвращает объект ConfigParser.ConfigParser()
        '''
        key_body = self.__set_key() # self.__key_body or 
        if not key_body:
            return None
        
        try:
            config = ConfigParser.ConfigParser()
            config.readfp(key_body)
        except:
            config = None
        return config
        
    def get_config_value(self, conf, section, item):
        '''
            Безопасно получает значения полей в секции конфига
        '''
        try:
            return conf.get(section, item)
        except:
            return ''
        

    def fill(self):
        '''
            Заполняет объект значениями из модели StoredLicKey
            Перепределить в наследующем классе
        ''' 
        raise InheritanceError       

class LicenseMiddleware:
    '''
        Основная задача заключается в простановке экземплярам request (в методе process_request) 
        сессионной переменной типа ApplicationLicKey, в которой хранится информация о текущем лицензионном ключе.
    '''
    def process_request(self, request): 
       '''
           1.  Посылается сигнал на проверку лицензии, если с предыдущей проверки не прошло 24 часа.
           2.  Если сигнал вернул объект ApplicationLicKey, то в переменную request.session['m3_license_key']
           записывается ключ (хеш), или если его нет, то выставляется пустое значение
               Иначе, если сгенирировано исключение, ключ считается не подлинным, у объекта проставляется 
               demo_mode = True, и в переменную request.session['m3_license_key'] пишется произвольное значение
       '''
       
       last_modify = request.session.get('m3_license_key_lastupdate') or (datetime.datetime.now() - datetime.timedelta(days=360))
       if datetime.datetime.now() - datetime.timedelta(seconds=3600*24) < last_modify: # <
           return None
       else:
           request.session['m3_license_key_lastupdate'] = datetime.datetime.now()
               
           try: 
               # неправильно передовать всю сессию целиком!
               check_license_key(self, request.session)
           except LicensingError, message:
               # Ключ не верный - продолжаем работать, но с определенным экземпляром, 
               # например включающим - demo_mode = true
               pass
               #return HttpResponse('Cracked!' + '<br>' + request.session['m3_license_key']._hsh) # тесты 
           except Exception, message:
               pass
               #raise
           
           return None
           #return HttpResponse('Correct key!' + '<br>' +request.session['m3_license_key']._hsh) # тесты
