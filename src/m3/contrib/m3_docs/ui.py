#coding:utf-8
from m3.helpers.icons import Icons
from m3.ui.ext.containers.containers import ExtToolBar, ExtContainer
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
        self.preview_panel.dd_group = 'designerDDGroup'
        return self.preview_panel

    def _init_east_panel(self):
        east_wrapper = ExtContainer(layout='vbox', region='east', width = 300)
        east_wrapper.layout_config['align'] = 'stretch'
        component_tree = self._init_component_tree()
        component_tree.flex = 1
        toolbox = self._init_toolbox_tree()
        toolbox.height = 180
        east_wrapper.items.extend([component_tree, toolbox])
        return east_wrapper

    def _init_component_tree(self):
        self.tree = ExtTree()
        self.tree.add_column(header = u'Структура документа', data_index = 'name')
        self.tree.drag_drop = True
        root = ExtTreeNode()
        root.set_items(name = u'Root')
        self.tree.nodes.append(root)
        self.tree.top_bar = ExtToolBar()

        #Меню
        node_menu = ExtContextMenu()
        node_menu.add_item(text = u'Удалить', handler = 'treeNodeDeleteClick', icon_cls = Icons.M3_DELETE)
        self.tree.handler_contextmenu = node_menu

        return self.tree

    def _init_toolbox_tree(self):
        self.toolbox = ExtTree()
        self.toolbox.add_column(header = u'Инструменты', data_index = 'name')
        self.toolbox.drag_drop = True
        self.toolbox.dd_group = 'designerDDGroup'
        section = ExtTreeNode()
        section.icon_cls = 'designer-icon-fieldset'
        section.set_items(name = u'Секция', type = 'section' )
        self.toolbox.nodes.append(section)

        text_node = ExtTreeNode(icon_cls = 'designer-icon-text')
        text_node.set_items(name = u'Текстовое поле', type = 'text' )
        self.toolbox.nodes.append(text_node)

        number_node = ExtTreeNode(icon_cls = 'designer-icon-number')
        number_node.set_items(name = u'Числовое поле', type = 'number' )
        self.toolbox.nodes.append(number_node)
        
        return self.toolbox
        