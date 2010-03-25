#coding:utf-8
'''
Модуль шорткатов для подсистемы m3.ui.ext

Created on 24.03.2010

@author: akvarats
'''
from m3.ui.ext.containers.forms import ExtForm

def js_submit_form(form, success_handler='', failure_handler='', invalid_handler='', params=''):
    '''
    Шорткат, который позволяет назначить хендлер для обработки субмита формы
    @param form: экземпляр ExtForm
    @param success_handler: анонимная JS функция срабатывающая при успешном исходе субмита 
    @param failure_handler: анонимная JS функция срабатывающая ошибке
    @param invalid_handler: JS действия при отказе сабмита из-за неверных значений полей
    @param params: дополнительные параметры в виде объекта JS передаваемые через POST
    '''
    assert isinstance(form, ExtForm)
    assert isinstance(success_handler, str) and isinstance(failure_handler, str) and \
           isinstance(invalid_handler, str) and isinstance(params, str)

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
        url: '%(url)s'
    });
}
'''
    return template % {'form_id': form.client_id,
                       'url': form.url, 
                       'success_handler': 'success:' + success_handler + ',' if success_handler else '',
                       'failure_handler': 'failure:' + failure_handler + ',' if failure_handler else '',
                       'params': 'params:'  + params + ',' if params else '',
                       'invalid_handler': invalid_handler}


def js_success_response():
    '''
    Возвращает Ext Ajax ответ что операция прошла успешно
    '''
    return '{success: true}'
    
def js_failure_response():
    '''
    Возвращает Ext Ajax ответ что операция прервана
    '''
    return '{success: false}'