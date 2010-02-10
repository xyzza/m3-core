#coding: utf-8
'''
Обеспечивают удобные средства установки, удаления и чтения лицензионных ключей.

@author: telepenin
'''
from m3.contrib.licensing.models import StoredLicKey

def add_key(key_body):
    '''
    В случае отсутствия предыдущего установленного ключа 
    функция add_key добавляет новую запись в таблицу модели StoredLicKey. 
    В противном случае происходит замена содержимого поля body у существующей записи.    
    '''
    if StoredLicKey.objects.count() > 0:
        key = StoredLicKey.objects.all()[0]
        key.body = key_body
    else:
        key = StoredLicKey(body=key_body)
    key.save()
        
def remove_key():
    '''
        Удаляет лицензионный ключ
    '''
    if StoredLicKey.objects.count() > 0:
        StoredLicKey.objects.all().delete()

def get_key():
    '''
        Возвращает объект класса StoredLicKey либо значение None.
    '''
    if StoredLicKey.objects.count() > 0:
        return StoredLicKey.objects.all()[0].body
    else:
        return None