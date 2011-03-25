#coding:utf-8
import json
from django.http import  HttpResponse
from m3.contrib.m3_docs.helpers import DesignerConfigAdapter
from m3.contrib.m3_docs.models import DocumentType, DocumentTypeGroup
from m3.contrib.m3_docs.ui import SimpleDocumentTypeEditWindow, DocumentTypeEditWindow
from m3.ui.actions import Action, ActionPack
from m3.ui.actions.context import ActionContextDeclaration
from m3.ui.actions.results import OperationResult, JsonResult
from m3.ui.actions.tree_packs import BaseTreeDictionaryModelActions

__author__ = 'ZIgi'


class DocumentTypePack(BaseTreeDictionaryModelActions):
    url = '/doc_type'
    shortname = 'm3_doc_type_pack'

    tree_model = DocumentTypeGroup
    list_model = DocumentType

    title = u'Типы документов'
    tree_width = 350
    tree_columns = [('name', u'Группы типов документов', 300)]
    list_columns = [('name', u'Типы документов')]
    edit_node_window = SimpleDocumentTypeEditWindow
    edit_window = DocumentTypeEditWindow

    def __init__(self):
        super(DocumentTypePack,self).__init__()
        self.actions.remove(self.save_row_action)
        self.save_row_action = SaveDocumentTypeAction()
        self.actions.extend([GetDesignerConfigAction,self.save_row_action])

    def get_list_window(self, win):
        win.maximized = True
        win.buttons.clear()
        return win

class DocumentsPack(ActionPack):
    url = '/docs'

    def __init__(self):
        super(DocumentsPack, self).__init__()


class GetDesignerConfigAction(Action):
    url = '/designer-config'
    shortname = 'designer-config-action'

    def context_declaration(self):
        return [ActionContextDeclaration(name='id', required=True, type=int)]

    def run(self, request, context):
        builder = DesignerConfigAdapter()
        cfg = None

        if context.id == 0:
            cfg = builder.create_new()
        else:
            raise NotImplementedError()

        return JsonResult(data = cfg)


class SaveDocumentTypeAction(Action):
    url = '/save-document-type'
    shortname = 'save-document-type'

    def context_declaration(self):
        return [ActionContextDeclaration(name='parent_id', required=True, type=int)]

    def run(self, request, context):
        parser = DesignerConfigAdapter()
        parser.parse(json_string=request.POST['data'], doc_type_group_id = context.parent_id)
        return OperationResult(success=True)