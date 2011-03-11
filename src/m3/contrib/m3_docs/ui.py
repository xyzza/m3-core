#coding:utf-8
from m3.helpers.icons import Icons
from m3.ui.ext.containers.containers import ExtToolBar
from m3.ui.ext.containers.context_menu import ExtContextMenu
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
        self.form = ExtForm(region = 'north', height = 70, padding = 5)
        # Строчка далее - хрестоматийный пример понятие workaround aka "костыль"
        # self.form это пропертя с сеттером, где идет сразу добавление формы в коллекцию итемсов окна
        # Помните, дети, сайд эффекты при использовании пропертей ведут к минусам в профессиональную карму
        self.form.style['padding'] = '5px'
        self.items.remove(self.form)
        self.name_field = ExtStringField(name = 'name', label = u'Наименование', allow_blank = False)
        self.id_field = ExtHiddenField(name = 'id')
        self.code_field = ExtStringField(name = 'code', label = u'Код')
        self.parent_field = ExtHiddenField(name = 'parent_id')
        self.form.items.extend([self.name_field, self.code_field, self.id_field, self.parent_field])
        return self.form

    def _init_preview_panel(self):
        self.preview_panel = ExtPanel(region = 'center', layout = 'form', padding = 5, label_width = 200 )
        self.preview_panel.items.append(
            ExtStringField(label='nnnnnn',anchor = '95%')
        )
        return self.preview_panel

    def _init_east_panel(self):
        return self._init_tree_panel()

    def _init_tree_panel(self):
        self.tree = ExtTree(region = 'east', width = 300)
        self.tree.add_column(header = u'Структура документа', data_index = 'name')
        self.tree.handler_click = 'test'
        root = ExtTreeNode()
        root.set_items(name = u'Секция 1')
        self.tree.nodes.append(root)

        self.tree.top_bar = ExtToolBar()
        add_btn = ExtButton(text = u'Добавить', icon_cls = Icons.M3_ADD, handler = 'addBtnClick')
        delete_btn = ExtButton(text = u'Удалить', icon_cls = Icons.M3_DELETE, handler = 'deleteBtnClick')
        self.tree.top_bar.items.extend([add_btn, delete_btn])

        #Меню

        node_menu = ExtContextMenu()
        node_menu.add_item(text = u'Добавить', handler = 'treeNodeAddClick', icon_cls = Icons.M3_ADD)
        node_menu.add_item(text = u'Удалить', handler = 'treeNodeDeleteClick', icon_cls = Icons.M3_DELETE)
        self.tree.handler_contextmenu = node_menu

        return self.tree