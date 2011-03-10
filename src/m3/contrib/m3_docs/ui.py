#coding:utf-8
from m3.helpers.icons import Icons
from m3.ui.ext.containers.containers import ExtToolBar
from m3.ui.ext.containers.forms import ExtForm, ExtPanel
from m3.ui.ext.containers.trees import ExtTree, ExtTreeNode
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


class DocumentTypeEditWindow(ExtEditWindow):

    def __init__(self, create_new = False, *args, **kwargs):
        super(DocumentTypeEditWindow, self).__init__(*args, **kwargs)
        self.layout = 'border'
        self.title = u'Тип документа'
        self.template_globals = 'document_type_edit_window.js'
        self.maximized = True
        center_wrapper = ExtPanel(region = 'center', layout = 'border')
        center_wrapper.items.extend([ self._init_main_form_panel(), self._init_preview_panel() ])

        self.items.append(center_wrapper)
        self.items.extend([center_wrapper,
                           self._init_east_panel()])

        save_btn = ExtButton(text=u'OK', handler='submitForm')
        cancel_btn = ExtButton(text=u'Отмена', handler='cancelForm')
        self.buttons.extend((save_btn, cancel_btn,))

    def _init_main_form_panel(self):
        self.form = ExtForm()
        # Строчка далее - хрестоматийный пример понятие workaround aka "костыль"
        # self.form это пропертя с сеттером, где идет сразу добавление формы в коллекцию итемсов окна
        # Помните, дети, сайд эффекты при использовании пропертей ведут к минусам в профессиональную карму
        self.items.remove(self.form)
        self.form.region = 'north'
        self.form.height = 70
        self.name_field = ExtStringField(name = 'name', label = u'Наименование', allow_blank = False)
        self.id_field = ExtHiddenField(name = 'id')
        self.code_field = ExtStringField(name = 'code', label = u'Код')
        self.parent_field = ExtHiddenField(name = 'parent_id')
        self.form.items.extend([self.name_field, self.code_field, self.id_field, self.parent_field])
        return self.form

    def _init_preview_panel(self):
        self.preview_panel = ExtPanel(region = 'center', layout = 'form')
        self.preview_panel.items.append(
            ExtStringField(label='nnnnnn')
        )
        return self.preview_panel

    def _init_east_panel(self):
        return self._init_tree_panel()

    def _init_tree_panel(self):
        self.tree = ExtTree(region = 'east', width = 300)
        self.tree.add_column(header = 'fofofo', data_index = 'name')
        self.tree.handler_click = 'test'
        root = ExtTreeNode()
        root.set_items(name = 'fofofofo')
        root.text = 'bla'
        self.tree.nodes.append(root)

        self.tree.top_bar = ExtToolBar()
        add_btn = ExtButton(text = u'Добавить', icon_cls = Icons.M3_ADD, handler = 'addBtnClick')
        delete_btn = ExtButton(text = u'Удалить', icon_cls = Icons.M3_DELETE, handler = 'deleteBtnClick')
        self.tree.top_bar.items.extend([add_btn, delete_btn])

        return self.tree