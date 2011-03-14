/**
 * Класс представления. Принцип работы - они повешены на события обновления модели,
 * когда модель обновляется контроллером, представление перерисовывается по модели
 * MVC епте
 */

BaseView = Ext.extend(Object, {
    constructor: function(model) {
        this._model = model;
        this._model.on('append', this.refresh.createDelegate(this));
    },
    refresh:function(){
        //нужно оверрайдить
    }
});


/**
 *  Класс преназначен для синхронизации модели и экранного превью. В конструктор передается
 * экземпляр Ext.Container(к примеру это могут быть Ext.Panel или Ext.Window) и экземпляер модели
 * При вызове метода refresh() старое содержимое контейнера удаляется и заполняется новосоздаными элементами UI
 * по модели
 */

DesignView = Ext.extend(BaseView, {
    constructor: function(container, model) {
        this._container = container;
        DesignView.superclass.constructor.call(this, model);
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

ComponentTreeView = Ext.extend(BaseView, {
    constructor: function(tree, model) {
        this._tree = tree;
        ComponentTreeView.superclass.constructor.call(this, model);
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

PropertyGridAdapter = Ext.extend(Object, {

//    vocabulary: {
//        'id':'id',
//        'name':'Наименование',
//        'type':'Тип'
//    },
    newProxy: function() {
        return {
            id:0,
            name:'',
            type:'text'
        };

//        return this.toRussian( {
//            id:0,
//            name:'',
//            type:'text'
//        });
    }
//    toRussian: function(obj) {
//        var newObj = {};
//        for (var v in obj) {
//            newObj[ this.vocabulary[v] ] = obj[v];
//        }
//        return newObj;
//    },
//    fromRussian:function(obj) {
//
//    }

});


PropertyWindow = Ext.extend(Ext.Window, {
    initComponent: function() {
        this._proxyAdapter = new PropertyGridAdapter();
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
    createModel:function(context, type) {
        var modelProxy = this._proxyAdapter.newProxy();
        this._grid.setSource(modelProxy);
        context.operation = 'append';
        this.context = context;
        PropertyWindow.superclass.show.call(this);
        this.show();

    },
    show:function( ) {
        PropertyWindow.superclass.show.call(this);
    },
    _onSave:function() {
        this.context.proxy = this._grid.getSource();
        this.fireEvent('save', this.context);
        this.context = null;
        this.hide();
    },
    _onClose:function() {
        this.hide();
    }
});

/* Класс контроллера приложения. Является клеем между другими частями приложения, чтобы не
* писать 100500 строк в обработчиках событий UI и оставить приложение переносимым. При создании экземпляра
* должен быть передан конфиг следующего вида:
*
* config = {
*   initJson = ...,
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
       this._editWindow.on('save',this.saveModel, this);
       this.refreshView();
   },
   refreshView:function() {
       this._treeView.refresh();
       this._designView.refresh();
   },
   createModel:function(parentTreeNode) {
       var parentModel = parentTreeNode.attributes.modelObj;
       var contextObj = {
           parent : parentModel
       };
       
       this._editWindow.createModel(contextObj);
   },
   saveModel:function(context) {
       switch(context.operation){
           case 'append':
               var newNode = new ComponentModel(context.proxy);
               var parent = context.parent;
               parent.appendChild(newNode);
               break;
       }
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
        return this.type == 'section';
    }
});

FormModel = Ext.extend(Ext.data.Tree, {
   
});

/**
 * "Статические" методы - по json передаваемому с сервера строит древовидную модель
 * @param jsonObj - сериализованая модель
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


// Просто json для отладки
//
//
//
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
    application.createModel(item.parentMenu.contextNode);
}

function treeNodeDblClick(item) {
    application.createModel(item.parentMenu.contextNode);
}

function treeNodeDeleteClick(item) {
    //var n = item.parentMenu.contextNode; объект ноды по которой кликнули
}

function addBtnClick() {
    application.createModel(componentTree.root);
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