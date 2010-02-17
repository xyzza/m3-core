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
        self.org_name = ''
        self.since = ''
        self.until = ''
        self.max_users = ''

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
        key_body = self.__key_body or self.__set_key()
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
        '''        

        conf = self.get_config()
        if conf:
            self.org_name   = self.get_config_value(conf,'info','orgname')
            self.since      = self.get_config_value(conf,'info', 'since')
            self.until      = self.get_config_value(conf,'info', 'until')
            self.max_users  = -1
  
    # Следующий код должен находится в наследующем классе    
    #def get_demo_mode(self):
    #    return self.__demo_mode
    #
    #def set_demo_mode(self, demo_mode):
    #    self.__demo_mode = demo_mode
    #    
    #demo_mode = property(set_demo_mode, get_demo_mode)

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
       if datetime.datetime.now() - datetime.timedelta(seconds=3600*24) < last_modify:
           return None
       else:
           request.session['m3_license_key_lastupdate'] = datetime.datetime.now()
           if not isinstance(request.session.get('m3_license_key'), ApplicationLicKey):
               request.session['m3_license_key'] = ApplicationLicKey()
               return None
               
           try: 
               # не правильно передовать всю сессию целиком!
               check_license_key(self, request.session)
           except LicensingError:
               # Ключ не верный - продолжаем работать, но с определенным экземпляром, 
               # например включающим - demo_mode = true
               pass
           
           return None
           #return HttpResponse(request.session['m3_license_key'].org_name)
       
def callback_check_signal(sender, **kwargs):
    '''
        Здесь можно проверить лицензию. и сгенерить исключение, если ключ не подлинный
    '''    
    if isinstance(kwargs.get('app_key').get('m3_license_key'), ApplicationLicKey):
        app_key_session = kwargs.get('app_key').get('m3_license_key')
    else:
        raise LicensingError
    
    # здесь может быть проверка объекта app_key на подлинность
    # если ключ неверный можно устанавливать различные поля объекта, например demo_mode = True
    # и в дальнейшем во вьюхе разделять смысл работы в зависимости от этих полей
  
    app_key = ApplicationLicKey()
    app_key.fill()
    
    # Проверка, например:
    # app_key.hash = app_key_session.hash
    
    # Проверили, если не устраивает, то 
    app_key.demo_mode = True
       
    kwargs.get('app_key')['m3_license_key'] = app_key
    return None

# Подписываемся на сигнал   
signal_license_key.connect(callback_check_signal) 