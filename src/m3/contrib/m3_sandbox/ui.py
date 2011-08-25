#coding:utf-8
from m3.helpers import urls
from m3.ui.ext.containers.containers import ExtContainer
from m3.ui.ext.containers.forms import ExtForm, ExtPanel
from m3.ui.ext.containers.grids import ExtGridRowSelModel
from m3.ui.ext.controls.buttons import ExtButton
from m3.ui.ext.fields.complex import ExtDictSelectField
from m3.ui.ext.fields.simple import ExtHiddenField, ExtStringField, ExtCheckBox
from m3.ui.ext.misc.label import ExtLabel
from m3.ui.ext.panels.grids import ExtObjectGrid
from m3.ui.ext.windows.edit_window import ExtEditWindow

__author__ = 'ZIgi'

class SandboxAccountsWindow(ExtEditWindow):

    def __init__(self, create_new = False, *args, **kwargs):
        super(SandboxAccountsWindow, self).__init__(*args, **kwargs)
        self.layout = 'fit'
        self.form = ExtForm()
        self.form.layout = 'vbox'
        self.form.layout_config['align'] = 'stretch'
        self.items.append(self.form)

        self.title = u'Учетная запись'
        self.width = 500
        self.height = 500
        save_btn = ExtButton(text=u'OK', handler='submitForm')
        cancel_btn = ExtButton(text=u'Отмена', handler='cancelForm')
        self.buttons.extend((save_btn, cancel_btn,))

        fields_cont = ExtContainer(layout = 'form', height = 70)

        self.name_field = ExtStringField(name = 'name', label = u'Учетная запись', anchor = '90%')
        self.id_field = ExtHiddenField(name = 'id')

        fields_cont.items.extend([self.name_field, self.id_field])
        self.form.items.extend([fields_cont, self._init_users_grid()])

    def _init_users_grid(self):
        panel = ExtPanel(flex = 1, layout = 'fit',
                         title = u'Пользователи учетной записи')
        grid = ExtObjectGrid()
        grid.add_column(header = u'Логин', data_index = 'name')
        grid.add_column(header = u'Является разработчиком', data_index = 'is_developer')

        grid.row_id_name = 'account_id'
        grid.allow_paging = False
        grid.sm = ExtGridRowSelModel()
        grid.sm.single_select = True
        self.docs_grid = grid
        self.docs_grid.action_data = urls.get_action('read_account_users')
        self.docs_grid.action_new = urls.get_action('new_account_user')
        #self.docs_grid.action_edit = urls.get_action('edit_account_user')
        self.docs_grid.action_delete = urls.get_action('delete_account_user')
        panel.items.append(grid)

        return panel


class EditAccountUserWindow(ExtEditWindow):

    def __init__(self, *args, **kwargs):
        super(EditAccountUserWindow, self).__init__(*args, **kwargs)
        self.layout = 'fit'
        self.form = ExtForm()
        self.items.append(self.form)
        self.form.url = urls.get_acton_url('save_account_user')
        self.form.label_width = 200
        self.title = u'Пользователь учетной записи'
        self.width = 500
        self.height = 150
        save_btn = ExtButton(text=u'OK', handler='submitForm')
        cancel_btn = ExtButton(text=u'Отмена', handler='cancelForm')
        self.buttons.extend((save_btn, cancel_btn,))

        self.select_field = ExtDictSelectField(name='user_id', label=u'Пользователь системы', anchor='100%',
                                               display_field='username', ask_before_deleting=False,
                                               hide_trigger=True, hide_clear_trigger=True,
                                               hide_edit_trigger=True, editable = False)
        self.select_field.pack = 'SelectDjangoUserPack'

        self.is_developer = ExtCheckBox(name='is_developer', label = u'Является разработчиком', anchor = '100%')

        self.form.items.extend([self.select_field, self.is_developer])