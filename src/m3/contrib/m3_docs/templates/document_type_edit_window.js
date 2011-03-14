/**
 *  Класс преназначен для синхронизации модели и экранного превью. В конструктор передается
 * экземпляр Ext.Container(к примеру это могут быть Ext.Panel или Ext.Window) и экземпляер модели
 * При вызове метода refresh() старое содержимое контейнера удаляется и заполняется новосоздаными элементами UI
 * по модели
 */
DesignView = Ext.extend(Object, {
    constructor: function(container, model) {
        this._model = model;
        this._container = container;
    },
    refresh: function(){
        this._container.removeAll();

        var recursion = function(container, model) {
            var newComponent = this._createComponent( model );
            if (newComponent){
                container.add( newComponent );
            }
            if (model.isContainer() && model.childNodes && model.childNodes.length > 0) {
                for (var i=0; i < model.childNodes.length; i++) {
                    recursion.call(this, newComponent,  model.childNodes[i] );
                }
            }
        };

        //recursion.call(this, this._container, this._model.root);

        for (var i=0; i < this._model.root.childNodes.length; i++) {
            recursion.call(this, this._container, this._model.root.childNodes[i]);
        }
        this._container.doLayout();
    },
    _createComponent:function(model) {
        // Очень тупой вариант создания контролов. Потом для этого следует написать
        // класс типа фабрики

        switch(model.type)
        {
            case 'text': 
                return new Ext.form.TextField({
                    fieldLabel:model.attributes.name,
                    anchor:'95%'

                });
            break;
            case 'number':
                return new Ext.form.NumberField({
                    fieldLabel:model.attributes.name,
                    anchor:'95%'
                });
            break;
            case 'section':
                 return new Ext.form.FieldSet({
                     title:model.attributes.name
                 });
            break;
        }
    }
});

/*
* Обновляет содержимое дерева
 */

ComponentTreeView = Ext.extend(Object, {
    constructor: function(tree, model) {
        this._tree = tree;
        this._model = model;
    },
    refresh:function() {
        var root = this._tree.root;
        root.removeAll(true);

        var recursion = function(parent, model) {
            var newNode = new Ext.tree.TreeNode({
                name:model.attributes.name,
                modelObj:model
            });
            parent.appendChild(newNode);

            if (model.childNodes && model.childNodes.length > 0) {
                for (var i=0; i < model.childNodes.length; i ++) {
                    recursion(newNode, model.childNodes[i]);
                }
            }
        };

        recursion(root, this._model.root);

        this._tree.expandAll();
    }
});

/**
 *  Преднастроеное окно со свойствами объекта. Используется для создания новых элементов модели,
 * и редактирования существующих.
 */
PropertyWindow = Ext.extend(Ext.Window, {
    initComponent: function() {
        this.addEvents('save');

        this._grid = new Ext.grid.PropertyGrid({
                        autoHeight: true,
                        source: {
                            "(name)": "My Object",
                            "id": 0,
                            "type": "text"
                        }
                    });
        
        Ext.apply(this, {
            height:400,
            width:400,
            closeAction:'hide',
            title:'Редактирование компонента',
            layout:'fit',
            items:[this._grid],
            buttons:[
                new Ext.Button({text:'Сохранить',handler:this._onSave.createDelegate(this) }),
                new Ext.Button({ text:'Отмена', handler:this._onClose.createDelegate(this) })
            ]
        });
        
        PropertyWindow.superclass.initComponent.apply(this, arguments);
    },
    show:function( modelObj ) {
        var modelProxy;
        if (modelObj){
            modelProxy = {
                id : modelObj.id,
                name: modelObj.name,
                type: modelObj.type
            }
        }
        else {
            modelProxy = {
                id:0,
                name:'',
                type:'text'
            }
        }

        this._grid.setSource(modelProxy);
        PropertyWindow.superclass.show.call(this);
    },
    _onSave:function() {
        //debugger;
        this.fireEvent('save', this._grid.getSource());
        this.hide();
    },
    _onClose:function() {
        //debugger;
        this.hide();
    }
});



/*
*
* config = {
*   model = ...,
*   tree = ...,
*   container = ...,
* }
*
 */

AppController = Ext.extend(Object, {
   constructor: function(config) {
       Ext.apply(this, config);
   },

   init: function() {
       this._model = FormModel.initFromJson(this.initJson);
       
       this._treeView = new ComponentTreeView(this.tree, this._model);
       this._designView = new DesignView(this.container, this._model);
       this._editWindow = new PropertyWindow();
       this._editWindow.on('save',this.saveComponent, this);
       this.refreshView();
   },
   refreshView:function() {
       this._treeView.refresh();
       this._designView.refresh();
   },
   addControl:function(parentTreeNode) {
       //debugger;
       this.currentParent = parentTreeNode;
       this._editWindow.show();
   },
   saveComponent:function(obj) {
       //debugger;

       //тут нужны преобразования соответсвтующие

       if (obj.type == 'section') {
           obj.isContainer = true;
           obj.items = [];
       }

       //debugger;
       if (this.currentParent.attributes.modelObj){
           this.currentParent.attributes.modelObj.items.push(obj);
       }
       else {
           this.model.items.push(obj);
       }
       this.refreshView();
   }

});

/**
 *  Внутрення модель представления структуры документа. Для простоты реализации
 * наследуемся от классов Ext.data.Tree и Ext.data.Node, предоставляющих уже реалзованые функции
 * работы с деревом и его вершинами.
 */

ComponentModel = Ext.extend(Ext.data.Node, {
    constructor: function(config) {
        this.type = config.type || 'undefined';
        ComponentModel.superclass.constructor.call(this,config);
    },
    isContainer: function() {
        return this.type == 'section' ? true : false;
    }
});

FormModel = Ext.extend(Ext.data.Tree, {
   
});

/**
 * "Статические" методы - по json передаваемому с сервера строит древовидную модель
 * @param jsonObj - сериалозваная модель
 */
FormModel._cleanConfig = function(jsonObj) {
    // просто удаляет items из json объекта
    var config = Ext.apply({}, jsonObj);
    Ext.destroyMembers(config, 'items');
    return config;
};

FormModel.initFromJson = function(jsonObj) {
    //обходит json дерево и строт цивилизованое дерево с нодами, событьями и проч
    var root = new ComponentModel(FormModel._cleanConfig(jsonObj));

    var callBack = function(node, jsonObj) {
        var newNode = new ComponentModel(FormModel._cleanConfig(jsonObj));
        node.appendChild(newNode);
        if (!jsonObj.items)
            return;
        for (var i = 0; i < jsonObj.items.length; i++) {
            callBack(newNode, jsonObj.items[i])
        }
    };

    if (jsonObj.items) {
        for (var i = 0; i < jsonObj.items.length; i++) {
            callBack(root, jsonObj.items[i])
        }
    }

    return new FormModel(root);
};

var fake = {
    type:'document',
    name:'Документ',
    items:[
        {
            type:'section',
            id:33,
            name:'Тупо секция',
            isContainer:true,
            items:[
                {
                    id:1,
                    type:'text',
                    name:'Это строка',
                    isContainer:false
                },
                {
                    id:2,
                    type:'number',
                    name:'Это число',
                    isContainer:false
                }]
        }
    ]
};

var fake2 = {
    type:'document',
    name:'Документ',
    items:[
                {
                    id:1,
                    type:'text',
                    name:'Это строка',
                    isContainer:false
                },
                {
                    id:2,
                    type:'number',
                    name:'Это число',
                    isContainer:false
                }]
};


var previewPanel = Ext.getCmp('{{ component.preview_panel.client_id }}');
var componentTree = Ext.getCmp('{{ component.tree.client_id }}');

var application = new AppController({
    tree:componentTree,
    model:fake,
    container:previewPanel,
    initJson:fake
});

application.init();

function test(){
}

function treeNodeAddClick(item) {
    application.addControl(item.parentMenu.contextNode);
}

function treeNodeDblClick(item) {
    application.addControl(item.parentMenu.contextNode);
}

function treeNodeDeleteClick(item) {
    //var n = item.parentMenu.contextNode; объект ноды по которой кликнули
}

function addBtnClick() {
    application.addControl(componentTree.root);
//    var p = previewPanel;
//
//    var simple = new Ext.form.TextField({
//        fieldLabel: 'teh test'
//    });
//
//    p.add(simple);
//    p.doLayout();
}

function deleteBtnClick() {
    //refresher.refresh();
}