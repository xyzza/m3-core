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
    @deprecated: Использовать методы окна, например, в ExtEditWindow метод submitForm
    
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
        %(submit_params)s        
    });
}
'''
    # Эти функции смотри в static/js/common.js
    failure_handler = failure_handler or 'uiAjaxFailMessage'
    submit_params = []
    if form.url:
        submit_params.append("url: '%s'" % form.url)
    if success_handler:
        submit_params.append("success: " + success_handler)
    if failure_handler:
        submit_params.append("failure: " + failure_handler)
    if params:
        submit_params.append("params: " + json.JSONEncoder().encode(params))
    submit_params.append("submitEmptyText: false")
    return template % {'form_id': form.client_id,
                       'invalid_handler': invalid_handler,
                       'submit_params': ",".join(submit_params)}


def js_success_response():
    '''
    @deprecated: Использовать OperationResult
    
    Возвращает Ext Ajax ответ что операция прошла успешно
    @deprecated: Нужно использовать OperationResult
    '''
    return http.HttpResponse('{success: true}')
    
def js_failure_response():
    '''
    @deprecated: Использовать OperationResult
    
    Возвращает Ext Ajax ответ что операция прервана
    @deprecated: Нужно использовать OperationResult
    '''
    return http.HttpResponse('{success: false}')

def js_close_window(win, forceClose=False):
    '''
    @deprecated: Использовать методы окна, например, в ExtEditWindow метод calcelForm
    
    Возвращает JS код закрывающий окно win
    '''
    assert isinstance(win, BaseExtWindow)
    forceClose = 'true' if forceClose else 'false'
    return 'function(){Ext.getCmp("%s").close(%s);}' % (win.client_id, 
                                                        forceClose,)

def js_submit_ajax(url, params = {}, success_handler = None, failure_handler = None):
    '''
    @deprecated: Использовать sendRequest из m3.js
    
    Возвращает JS код посылающий AJAX запрос
    '''
    template = u'''
function(){
    Ext.Ajax.request({
        url: '%(url)s'
        %(success_handler)s
        %(failure_handler)s
        %(params)s
    });
}
    '''
    return template % {'url': url, 
                       'success_handler': ', success:' + success_handler if success_handler else '',
                       'failure_handler': ', failure:' + failure_handler if failure_handler else '',
                       'params': ', params:' + json.JSONEncoder().encode(params) if params else ''}

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
                       'win_close' : 'win.close(true);' if close_after_fire else ''
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
    
def js_on_key_enter(function, *args):
    return '''
function(field, e){
    if (e.getKey()== e.ENTER){
        return (%(function)s)(%(params)s);
    };
}
''' % {'function':function,
       'params': '"%s"' % '","'.join(args)
      }

# Временно лежит тут. Не знаю пока куда засунуть.
class MessageBox:
    '''
    Обёртка над стандартным MessageBox ExtJS
    '''
    # Константы определяющие значек формы
    ICON_INFO     = 'Ext.MessageBox.INFO'
    ICON_ERROR    = 'Ext.MessageBox.ERROR'
    ICON_QUESTION = 'Ext.MessageBox.QUESTION'
    ICON_WARNING  = 'Ext.MessageBox.WARNING'
    
    # Константы определяющие доступные кнопки
    BTN_OK          = 'Ext.Msg.OK'
    BTN_CANCEL      = 'Ext.Msg.CANCEL'
    BTN_OKCANCEL    = 'Ext.Msg.OKCANCEL'
    BTN_YESNO       = 'Ext.Msg.YESNO'
    BTN_YESNOCANCEL = 'Ext.Msg.YESNOCANCEL'
    
    def __init__(self, title = '', msg = '', icon = ICON_INFO, buttons = BTN_OK):
        self.title = title
        self.msg = msg
        self.icon = icon
        self.buttons = buttons
        # Обработчики для каждой кнопки
        self.handler_ok = ''
        self.handler_cancel = ''
        self.handler_yes = ''
        self.handler_no = ''
        
    def get_script(self):
        template = '''
Ext.Msg.show({
   title: "%(title)s",
   msg: "%(msg)s",
   buttons: %(buttons)s,
   fn: %(handler)s,
   animEl: 'elId',
   icon: %(icon)s
});
        '''
        template = template.replace('\n', ' ')
        # Для каждой кнопки можно задавать свой обработчик
        handler = '''
function(buttonId, text, opt){
    switch (buttonId){
        case 'yes':
            %(handler_yes)s
            break;
        case 'no':
            %(handler_no)s
            break;
        case 'cancel':
            %(handler_cancel)s
            break;
        case 'ok':
            %(handler_ok)s
            break;
    }
}
        '''
        handler = handler % {'handler_yes': self.handler_yes,
                             'handler_no': self.handler_no,
                             'handler_cancel': self.handler_cancel,
                             'handler_ok': self.handler_ok}
        result = template % {'title': self.title,
                             'msg': self.msg,
                             'buttons': self.buttons,
                             'icon': self.icon,
                             'handler': handler}
        return result
    
