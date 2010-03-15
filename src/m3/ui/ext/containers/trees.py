#coding:utf-8
'''
Created on 11.3.2010

@author: prefer
'''

from base import BaseExtPanel
from m3.ui.ext.base import ExtUIComponent
from m3.ui.ext.misc.base import BaseExtStore
from m3.ui.ext import render_component
from m3.ui.ext.containers import ExtGridColumn

class ExtTree(BaseExtPanel):
    def __init__(self, url='', *args, **kwargs):
        super(ExtTree, self).__init__(*args, **kwargs)
        self.template = 'ext-trees/ext-tree.js'
        self.nodes = []
        self.columns = []
        self.tree_loader = ExtTreeLoader(url=url)
        self.title = ''
        self.init_component(*args, **kwargs)
    
    @staticmethod    
    def nodes_auto_check(node):
        node.auto_check = True
        for child in node.children:
            ExtTree.nodes_auto_check(child)         
    
    def render(self):
        if not self.tree_loader.url:
            # Проставим у всех узлов автопроверку
            for node in self.nodes:
                ExtTree.nodes_auto_check(node)
        return render_component(self)
    
    def render_tree_loader(self):
        return self.tree_loader.render()
    
    def render_nodes(self):
        return ','.join([node.render() for node in self.nodes])
    
    def render_columns(self):
        return ','.join([column.render() for column in self.columns])
    
    def add_nodes(self, *args):
        for node in args:
            if isinstance(node, ExtTreeNode):
                self.nodes.append(node)
            else:
                raise TypeError('First parameter "%s" is not type of ExtTreeNode' % node)
    
    def add_column(self,**kwargs):
        self.columns.append(ExtGridColumn(**kwargs))
    
class ExtTreeNode(ExtUIComponent):
    def __init__(self,*args, **kwargs):
        super(ExtTreeNode, self).__init__(*args, **kwargs)
        self.template = 'ext-trees/ext-tree-node.js'
        self.text = ''
        self.leaf = False
        self.has_children = False
        self.node_id = ''
        self.expanded = False
        self.auto_check = False
        self.children = []
        self.__items = {}

        self.init_component(*args, **kwargs)
                
    def render(self):
        return render_component(self)
    
    def render_children(self):
 
        return '[%s]' % ','.join([child.render() for child in self.children])
             
    def add_children(self, children):
        '''
            Добавляет дочерние узлы
            Если необходимо, здесь можно указать у узлов атрибут "parent" на текущий (родительский) узел
        '''
        self.has_children = True
        self.children.append(children)
       
    @property    
    def items(self):
        return self.__items
    
    def set_items(self, **kwargs):
        for k, v in kwargs.items():
            self.__items[k] = v
        
class ExtTreeLoader(BaseExtStore):
    def __init__(self, *args, **kwargs):
        super(ExtTreeLoader, self).__init__(*args, **kwargs)
        self.template = 'ext-trees/ext-tree-loader.js'
        self.url = ''
        self.init_component(*args, **kwargs)
        
    def render(self):
        return render_component(self)