#coding:utf-8
'''
Модуль шорткатов для подсистемы m3.ui.ext

Created on 24.03.2010

@author: akvarats
'''
from m3.ui.ext.containers.forms import ExtForm
from m3.ui.ext.windows.base import BaseExtWindow
import json
from django import http

def js_submit_form(form, success_handler='', failure_handler='', invalid_handler='', params=None):
    '''
    Шорткат, который позволяет назначить хендлер для обработки субмита формы
    @param form: экземпляр ExtForm
    @param success_handler: анонимная JS функция срабатывающая при успешном исходе субмита 
    @param failure_handler: анонимная JS функция срабатывающая ошибке
    @param invalid_handler: JS действия при отказе сабмита из-за неверных значений полей
    @param params: словарь с доп. параметрами передаваемыми через POST
    '''
    assert isinstance(form, ExtForm)
    template = u'''
function(){
    var form = Ext.getCmp('%(form_id)s').getForm();
    if (!form.isValid()){
        %(invalid_handler)s
        return;
    }
    form.submit({
        %(params)s
        %(success_handler)s
        %(failure_handler)s
        %(url)s
    });
}
'''
    return template % {'form_id': form.client_id,
                       'url': "url:'%s'" % form.url if form.url else '',
                       'success_handler': 'success:' + success_handler + ',' if success_handler else '',
                       'failure_handler': 'failure:' + failure_handler + ',' if failure_handler else '',
                       'params': 'params:'  + json.JSONEncoder().encode(params) + ',' if params else '',
                       'invalid_handler': invalid_handler}


def js_success_response():
    '''
    Возвращает Ext Ajax ответ что операция прошла успешно
    '''
    return http.HttpResponse('{success: true}')
    
def js_failure_response():
    '''
    Возвращает Ext Ajax ответ что операция прервана
    '''
    return http.HttpResponse('{success: false}')

def js_close_window(win):
    '''
    Возвращает JS код закрывающий окно win
    '''
    assert isinstance(win, BaseExtWindow)
    return 'function(){Ext.getCmp("%s").close();}' % win.client_id

def js_submit_ajax(url, params = {}, success_handler = None, failure_handler = None):
    '''
    Возвращает JS код посылающий AJAX запрос
    '''
    template = u'''
function(){
    Ext.Ajax.request({
        url: '%(url)s',
        %(success_handler)s
        %(failure_handler)s
        params: %(params)s
    });
}
    '''
    return template % {'url': url, 
                       'success_handler': 'success:' + success_handler + ',' if success_handler else '',
                       'failure_handler': 'failure:' + failure_handler + ',' if failure_handler else '',
                       'params': json.JSONEncoder().encode(params) if params else ''}

def js_fire_event_window(event_name, close_after_fire=True, *args):
    '''
    Генерирует вызов события для окна
    @param event_name: Название события
    @param close_after_fire: Закрывать ли окно после вызова события?
    @param *args: Параметры, которые будут переданы при генерации события
    '''
    template = u'''
function(){
    win.fireEvent("%(event_name)s" %(params)s);
    %(win_close)s
}
    '''
    return template % {'event_name': event_name, 
                       'params': (',"%s"' % '","'.join(args)) if args else '',
                       'win_close' : 'win.close();' if close_after_fire else ''
                       }
    
def js_fire_event(component, event_name, *args):
    '''
    Генерирует вызов события для любого компонента
    @param component: Компонент, от чьего лица генерируется событие
    @param event_name: Название события
    @param *args: Параметры, которые будут переданы при генерации события
    '''
    template = u'''
function(){
    var component = Ext.getCmp("%(client_id)s");
    component.fireEvent("%(event_name)s" %(params)s);
}
    '''
    return template % {'client_id':component.client_id,
                       'event_name': event_name, 
                       'params': (',"%s"' % '","'.join(args)) if args else '',
                       }