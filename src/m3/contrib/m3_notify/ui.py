#coding:utf-8
from m3.contrib.m3_notify.models import BackendTypeEnum
from m3.ui.ext.containers.forms import ExtForm
from m3.ui.ext.controls.buttons import ExtButton
from m3.ui.ext.fields.simple import ExtStringField, ExtHTMLEditor, ExtComboBox
from m3.ui.ext.misc.store import ExtDataStore
from m3.ui.ext.panels.grids import ExtObjectGrid
from m3.ui.ext.windows.edit_window import ExtEditWindow
from m3.ui.ext.windows.window import ExtWindow
from m3.helpers import urls

__author__ = 'daniil-ganiev'


class NotifyMessagesListWindow(ExtWindow):
    '''Таблица отображения всех шаблонов'''
    def __init__(self):
        super(NotifyMessagesListWindow, self).__init__()
        self.width, self.height = 700, 500
        self.maximized = False
        self.maximizable = True
        self.title = u'Реестр шаблонов для рассылки'
        self.layout = 'fit'
        self.items.extend([self.__init_messages_grid()])

    def __init_messages_grid(self):
        grid = ExtObjectGrid()
        grid.add_column(header=u'Идентификатор шаблона',data_index='id')
        grid.add_column(header=u'Описание',data_index='description')
        grid.add_column(header=u'Тип',data_index='parent_type')

        grid.row_id_name = 'template_id'
        
        grid.action_data = urls.get_action('read_notify_messages')
        grid.action_new = urls.get_action('new_notify_message')
        grid.action_edit = urls.get_action('edit_notify_message')
        grid.action_delete = urls.get_action('delete_notify_message')

        self.messages_grid = grid

        return self.messages_grid


class EditNotifyMessageWindow(ExtEditWindow):
    '''Окно изменения шаблона'''
    def __init__(self, create_new=False, *args, **kwargs):
        #TODO: Не забыть подключить шаблоны в виде файлов
        super(EditNotifyMessageWindow, self).__init__(*args, **kwargs)

        self.title = u'Изменить шаблон' if not create_new else u'Создать шаблон'
        self.width, self.height = 700, 490
        self.min_width, self.min_height = self.width, self.height

        self.form = ExtForm(label_width=150)
        self.form.url = urls.get_acton_url('save_notify_message')

        self.template_id_field = ExtStringField(label=u'Идентификатор шаблона',
                                                name='template_id',
                                                anchor='98%',)
        self.description_field = ExtStringField(label=u'Описание',
                                                name='description',
                                                anchor='98%',)
        self.template_text_field = ExtHTMLEditor(label=u'Текст шаблона',
                                                 name='body',
                                                 anchor='98%',)
        self.type_field = ExtComboBox(label = u'Сервис рассылки, используемый по умолчанию',
                                     display_field = 'name',
                                     value_field = 'id',
                                     anchor = '98%',
                                     trigger_action_all = True,
                                     name = 'type',
                                     editable = False)
        self.type_field.set_store( ExtDataStore(data = BackendTypeEnum.get_choices()))
        self.type_field.value = str(BackendTypeEnum.EMAIL)

        self.form.items.extend([self.template_id_field,self.description_field,
                           self.template_text_field,self.type_field])

        save_btn = ExtButton(text=u'OK', handler='submitForm')
        cancel_btn = ExtButton(text=u'Отмена', handler='cancelForm')
        self.buttons.extend((save_btn, cancel_btn,))
