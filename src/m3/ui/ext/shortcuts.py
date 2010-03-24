#coding:utf-8
'''
Модуль шорткатов для подсистемы m3.ui.ext

Created on 24.03.2010

@author: akvarats
'''

def js_submit_form(form, success_handler='', failure_handler=''):
    '''
    Шорткат, который позволяет назначить хендлер для обработки
    субмита формы
    '''
    template = u'''
function(){
    var form = Ext.getCmp('%(form_id)s').getForm();
    form.submit({
        %(success_handler)s
        %(failure_handler)s
        url: '%(url)s'
    });
}
'''    
    return template % {'form_id': form.client_id, 
                       'url': form.url, 
                       'success_handler': 'success:' + success_handler + ',' if success_handler.strip() else '',
                       'failure_handler': 'failure:' + failure_handler + ',' if failure_handler.strip() else ''}
