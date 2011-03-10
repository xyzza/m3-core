#coding:utf-8
from django.http import  HttpResponse
from m3.contrib.m3_docs.models import DocumentType, DocumentTypeGroup
from m3.contrib.m3_docs.ui import SimpleDocumentTypeEditWindow
from m3.ui.actions import Action, ActionPack
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
    edit_window = SimpleDocumentTypeEditWindow
    
    def get_list_window(self, win):
        win.maximized = True
        win.buttons.clear()
        return win

class DocumentsPack(ActionPack):
    url = '/docs'

    def __init__(self):
        super(DocumentsPack, self).__init__()
        self.actions.extend([HelloAction])


class HelloAction(Action):
    url = '/hello'

    def run(self, request, context):

        return HttpResponse(content='bla bla bla')