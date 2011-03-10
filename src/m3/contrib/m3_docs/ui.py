#coding:utf-8
from m3.ui.ext.containers.forms import ExtForm
from m3.ui.ext.controls.buttons import ExtButton
from m3.ui.ext.fields.simple import ExtStringField, ExtHiddenField
from m3.ui.ext.windows.edit_window import ExtEditWindow

__author__ = 'ZIgi'

class SimpleDocumentTypeEditWindow(ExtEditWindow):

    def __init__(self, create_new = True, *args, **kwargs):
        super(SimpleDocumentTypeEditWindow, self).__init__(*args, **kwargs)
        self.layout = 'fit'
        self.form = ExtForm()
        self.items.append(self.form)
        self.title = u'Тупо окошко'
        self.width = 300
        self.height = 400

        self.name_field = ExtStringField(name = 'name', label = u'Наименование', allow_blank = False)
        self.id_field = ExtHiddenField(name = 'id')
        self.code_field = ExtStringField(name = 'code', label = u'Код')
        self.parent_field = ExtHiddenField(name = 'parent_id')
        self.form.items.extend([self.name_field, self.code_field, self.id_field, self.parent_field])

        save_btn = ExtButton(text=u'OK', handler='submitForm')
        cancel_btn = ExtButton(text=u'Отмена', handler='cancelForm')
        self.buttons.extend((save_btn, cancel_btn,))