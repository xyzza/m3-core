/**
 * Классы представления. Принцип работы - классы наследники повешены на события обновления модели,
 * когда модель обновляется контроллером, представление перерисовывается без внешнего участия
 * Это MVC епте.
 */

BaseView = Ext.extend(Object, {
    _modelEventsActive:true,
    constructor: function(model) {
        this._model = model;
        this._model.on('append', this._beforeRefresh.createDelegate(this));
        this._model.on('insert', this._beforeRefresh.createDelegate(this));
        this._model.on('move', this._beforeRefresh.createDelegate(this));
        this._model.on('remove', this._beforeRefresh.createDelegate(this));

    },
    /**
     * После вызова метода ивенты модели не обрабатываюцца
     */
    suspendModelListening:function() {
        this._modelEventsActive = false;
    },
    /**
     * Посе вызова метода ивенты обрабатываюцца
     */
    resumeModelListening:function() {
        this._modelEventsActive = true;
    },
    _beforeRefresh:function() {
        if (this._modelEventsActive) {
            this.refresh();
        }
    },
    refresh:function(){
        //оверрайдиццо в дочерних классах
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
                    anchor:'95%',
                    id:model.id

                });
            break;
            case 'number':
                return new Ext.form.NumberField({
                    fieldLabel:model.attributes.name,
                    anchor:'95%',
                    id:model.id
                });
            break;
            case 'section':
                 return new Ext.form.FieldSet({
                     title:model.attributes.name,
                     cls:'designContainer',
                     id:model.id
                 });
            break;
        }
    }
});

/*
* Обновляет содержимое дерева по модели
 */

ComponentTreeView = Ext.extend(BaseView, {
    constructor: function(tree, model) {
        this._tree = tree;
        ComponentTreeView.superclass.constructor.call(this, model);

        new Ext.tree.TreeSorter(this._tree, {
            folderSort:true,
            dir:'asc',
            property:'orderIndex'
        });
    },
    refresh:function() {
        var root = this._tree.root;
        root.removeAll(true);

        var recursion = function(parent, model) {
            //TODO нормально сделать построение нод
            var iconCls = '';
            switch (model.attributes.type){
                case 'document':
                    iconCls = 'designer-icon-page';
                break;
                case 'section':
                    iconCls = 'designer-icon-fieldset';
                break;
                case 'text':
                    iconCls = 'designer-icon-text';
                break;
                case 'number':
                    iconCls = 'designer-icon-number';
                break;
            }
            var newNode = new Ext.tree.TreeNode({
                name:model.attributes.name,
                modelObj:model,
                id:model.id,
                expanded:true,
                allowDrop:model.isContainer(),
                orderIndex:model.attributes.orderIndex+'' || '0',
                iconCls: iconCls
            });
            parent.appendChild(newNode);

            if (model.childNodes && model.childNodes.length > 0) {
                for (var i=0; i < model.childNodes.length; i ++) {
                    recursion(newNode, model.childNodes[i]);
                }
            }
        };
        recursion(root, this._model.root);
    }
});


/**
 *  Классы для работы с редактором свойств.
 */


/**
 * Класс предоставляет внешний интерфейс для контроллера. Он управляет показом окошка с редакторами свойств, содержит
 * в себе необходимые структуры данных и обновляет модель. При обновлении модели зажигается событие modelUpdate
 */

PropertyEditorManager = Ext.extend( Ext.util.Observable, {
    /**
     * Конфиуграция доступных свойств для каждого типа компонента. Первый уровень вложенности - типы компонентов
     * Второй уровень - доступные свойства каждого типа
     */
    //TODO этот конфиг где то отдельно должен лежать
    typesConfig:{
        text:{
            name:{
                allowBlank:false,
                defaultValue:'Новый компонент'
            },
            allowBlank:{
                allowBlank:true,
                defaultValue:true
            },
            regexp:{
                allowBlank:true,
                defaultValue:''
            }
        },
        number:{
            name:{
                editorType:'string',
                allowBlank:false,
                defaultValue:'Новый компонент'
            },
            decimalPrecision:{
                allowBlank:true,
                defaultValue:2
            },
            allowBlank:{
                allowBlank:true,
                defaultValue:true
            }
        },
        section:{
            name:{
                editorType:'string',
                allowBlank:false,
                defaultValue:'Новый компонент'
            }
        },
        document:{
            name:{
                editorType:'string',
                allowBlank:false,
                defaultValue:'Новый компонент'
            }
        }
    },

    constructor:function() {
        PropertyEditorManager.superclass.constructor.call(this);
        this.addEvents('modelUpdate');
    },
    editModel:function(model) {
        //конфиг объект для PropertyGrid'а
        var cfg = {};

        //пояснение для тех кто не достиг дзена - в js объекты и ассоциативные массивы(словари) одно и тоже
        //И более того, с помощью цикла for можно итерировать по свойствам массива(читай - получить все ключи словаря)

        //заполняем сначала свойства дефолтными значениями
        var currentType = this.typesConfig[model.attributes.type];
        for (var i in currentType) {
            cfg[i] = currentType[i]['defaultValue'];
        };

        //теперь заполняем значениями которые есть у модели
        for (var k in model.attributes) {
            if (cfg.hasOwnProperty(k)) {
                cfg[k] = model.attributes[k];
            }
        };

        var window = new PropertyWindow({
            source:cfg,
            model:model
        });
        window.on('save', this.saveModel.createDelegate(this));
        window.show();
    },
    saveModel:function(eventObj) {
        // в ивент обжекте приходят объект модели и объект source из грида
        // далее копируются свойства из сурса в атрибуты модели
        
        for (var i in eventObj.model.attributes) {
            if (eventObj.source.hasOwnProperty(i) )
            {
                eventObj.model.attributes[i] = eventObj.source[i];
            }
        }
        this.fireEvent('modelUpdate');
    }
});


/**
 *  Преднастроеное окно со свойствами объекта. Используется для создания новых элементов модели,
 * и редактирования существующих. При нажатии кнопки сохранить генерируется событие save
 */

PropertyWindow = Ext.extend(Ext.Window, {
    propertyNames: {
        name:'Наименование',
        regexp:'Ругулярное выражение',
        decimalPrecision:'Знаков после запятой',
        allowBlank:'Необязательно к заполнению'
    },
    /**
     * Параметры конфига:
     * cfg.source = {} - то что редактируется
     * cfg.model = ... ссылка на модель
     * @param cfg
     */
    constructor:function(cfg) {
        Ext.apply(this, cfg);
        PropertyWindow.superclass.constructor.call(this);
    },
    initComponent: function(cfg) {
        this.addEvents('save');
        this._grid = new Ext.grid.PropertyGrid({
                        autoHeight: true,
                        source: this.source,
                        propertyNames:this.propertyNames,
                        customRenderers:{
                            allowBlank: function(v) {
                                if (v) {
                                    return 'Да'
                                }
                                else {
                                    return 'Нет'
                                }
                            }
                        }
                    });
        
        Ext.apply(this, {
            height:400,
            width:400,
            title:'Редактирование компонента',
            layout:'fit',
            items:[this._grid],
            buttons:[
                new Ext.Button({text:'Сохранить',handler:this._onSave.createDelegate(this) }),
                new Ext.Button({ text:'Отмена', handler:this._onClose.createDelegate(this) })
            ]
        });
        
        PropertyWindow.superclass.initComponent.call(this);
    },
    show:function( ) {
        PropertyWindow.superclass.show.call(this);
    },
    _onSave:function() {
        //TODO прикрутить валидацию
        var eventObj = {
            source:this._grid.getSource(),
            model:this.model
        };

        this.fireEvent('save', eventObj);
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
       this._initCSSRules();
   },
   init: function() {
       //создаем модель
       this._model = DocumentModel.initFromJson(this.initJson);
       //создаем объекты представления
       this._treeView = new ComponentTreeView(this.tree, this._model);
       this._designView = new DesignView(this.designPanel, this._model);
       //синхронизируем id у панели - общего контейнера и рута модели
       //требуется для работы драг дропа с тулбокса в корень
       this._model.root.setId( this.designPanel.id);
       //создаем объект отвечающий за редактирование свойств
       this._editorManager = new PropertyEditorManager();
       //иницируем ДД с тулбокса на превью
       this._initDesignDD(this.designPanel);

       //обработчики событий
       this.tree.on('beforenodedrop', this.onBeforeNodeDrop.createDelegate(this));
       this.tree.on('nodedrop', this.onTreeNodeDrop.createDelegate(this));
       this.tree.on('dblclick', this.onTreeNodeDblClick.createDelegate(this))
       this._editorManager.on('modelUpdate', this.onModelUpdate.createDelegate(this));


       //обновим экранное представление
       this.refreshView();
   },
   _initCSSRules:function() {
       //Когда-нибудь это все обзаведеться нормальными файлами с реусрсами. А пока будем таким вот образом
       //добавлять CSS'ки в документ

       Ext.util.CSS.createStyleSheet(
               '.selectedElement {' +
                    'border: 2px solid #710AF0;'+
               '}','selectedElem');

       //selectedElement вешается на все подряд, но панельки составные из хедера, футера etc
       //поэтому перебиваем цвет у body
       Ext.util.CSS.createStyleSheet(
               '.selectedElement * .x-panel-body {' +
                   'border: 2px solid #710AF0;' +
               '}'
               ,'selectedPanelBody');

   },
   _initDesignDD:function() {
       /**
        * Принцип действия драг энд дропа с тулбокса - тулбокс и превью дизайнера объеденины
        * в одну ddGroup. На DOM элемент панели дизайнера вешается Ext.dd.DropZone
        * Это класс которые перехватывает дом события и решает можно ли выполнить Drop операцию,
        * и что в ней делать если вдруг можно
        */

       //Для того чтобы понимать что в DOM дереве является контенером(читай наследник Ext.Container)
       //в который можно добавлять новый компоненты(читай Ext.Component)
       //используется фейковый CSS класс .designContainer
       //Когда создаем экстовые компоненты - незабываем навешивать эту штуку

       //Здесь ручками присоеденим класс к родительской панели, чтобы она тоже участвовала в процессе
       this.designPanel.getEl().addClass('designContainer');

       this.designPanel.dropZone = new Ext.dd.DropZone( this.designPanel.getEl(), {
               ddGroup:'designerDDGroup',

               // Джедайский прием. Проброс функции инстанса аппконтроллера,
               // путем создания объекта указателя на функцию со сменой объекта исполнения,
               // нужно это потому что объект который порождает дроп зону будет недоступен на момент
               // исполнения onNodeDrop. И, увы, дроп зона не наследует Observable
               // Да, чуваки, ООП в жабаскрипте это вам не хрен собачий
               processDropResults : this.domNodeDrop.createDelegate(this),

               getTargetFromEvent: function(e) {
                   //сюда попадают мышиные DOM события, будем пытаться найти ближайший допустимый
                   //контейнер. getTarget ищет по селектору или в текущей вершине, или в вершнах предках, но
                   //не в наследниках. Те функция вернет или null и функции ниже ничего не будут делать,
                   //или target'ом станет ближайший найденый контейнер(вернее DOM вершина которую этот конейтер
                   //олицетворяет)
                   return e.getTarget('.designContainer');
               },
               onNodeEnter: function(target, dd, e, data) {
                   Ext.fly(target).addClass('selectedElement');
               },
               onNodeOut:function(target, dd, e, data){
                   Ext.fly(target).removeClass('selectedElement');
               },
               onNodeOver:function(target, dd, e, data) {
                   //здесь штука чтобы показать значок 'Можно дропать' на экране
                   return Ext.dd.DropZone.prototype.dropAllowed;
               },
               onNodeDrop:function(target, dd, e, data) {
                   this.processDropResults(target, dd, e, data);
               }
           });
   },

   refreshView:function() {
       this._treeView.refresh();
       this._designView.refresh();
   },
   createModel:function(parentTreeNode) {
       //TODO перенести сюда создание новых нод после дропа
//       var parentModel = parentTreeNode.attributes.modelObj;
//       var contextObj = {
//           parent : parentModel
//       };
//
//       this._editWindow.createModel(contextObj);
   },
   saveModel:function(context) {
//       switch(context.operation){
//           case 'append':
//               var newNode = new ComponentModel(context.proxy);
//               var parent = context.parent;
//               parent.appendChild(newNode);
//               break;
//       }
   },
   moveTreeNode:function(drop, target, point) {
        var source = drop.attributes.modelObj;
        var targetNode = target.attributes.modelObj;

       //Изменение положения ноды это фактически две операции - удаление и аппенд к новому родителю
       //поэтому прежде чем двигать отключим обновление UI, так как иначе получим js ошибки при перерисовке
       //дерева в неподходящий момент внутри treeSorter'а

       //TODO похоже баг при сортировке не исправлен! Надо попробовать двигать в beforeDrop или на колбэке к нему

       this._treeView.suspendModelListening();
       this._designView.suspendModelListening();

       this._moveModelComponent(source, targetNode, point);

       this.refreshView();

       this._treeView.resumeModelListening();
       this._designView.resumeModelListening();

       return false;
   },
   _moveModelComponent:function( source, target, point) {
       if(point == 'append') {
           target.appendChild(source);
       }
       else if (point == 'above') {
           var parent = target.parentNode;
           parent.insertBefore(source, target);
       }
       else if (point == 'below') {
           target.parentNode.insertBefore(source, target.nextSibling);
       }
   },
   domNodeDrop:function(target, dd, e, data ) {
       var componentNode = data.node;
       var model = this._model.findModelById(target.id);

       //TODO сделать умно
       //Ну, тут тупейшее создание новых компонентов. Пока тупейшее

       var newModelConfig = {
           type:componentNode.attributes.type
       };

       switch(componentNode.attributes.type) {
           case 'section':
                   newModelConfig.name = 'Новая секция';
           break;
           case 'text':
                   newModelConfig.name = 'Новый текстовый редактор';
           break;
           case 'number':
                   newModelConfig.name = 'Новый редактор чисел';
           break;
       }
       model.appendChild( new ComponentModel(newModelConfig) );
   },
   onBeforeNodeDrop:function(dropEvent) {
        if (dropEvent.target.isRoot) {
            //рут не отображается, и в него нельзя перетаскивать
            return false;
        }
        if (this._model.findModelById(dropEvent.target.id ).type == 'document' && (dropEvent.point =='above' ||
                dropEvent.point =='below')) {
            //а это суррагатный рут "Документ"
            return false;
        }
        return true;
   },
   onTreeNodeDrop: function(dropEvent) {
       this.moveTreeNode(dropEvent.dropNode, dropEvent.target, dropEvent.point);
       return false;
   },
   onTreeNodeDblClick:function(node, e) {
       var model = this._model.findModelById(node.id);
       this._editorManager.editModel(model);
   },
   onTreeNodeDeleteClick:function(treeNode) {
       var model = this._model.findModelById(treeNode.id);
       model.remove(true);
   },
   onModelUpdate:function() {
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
        return this.type == 'section' || this.type == 'document';
    }
});

DocumentModel = Ext.extend(Ext.data.Tree, {
    /**
     * Поиск модели по id. Это именно поиск с обходом. Может быть в дальнейшем стоит разобраться
     * со словарем nodeHash внутри дерева и его использовать для поиска по id(но это вряд ли, деревья маленькие)
     */
    findModelById:function(id) {
        if (this.root.id == id ){
            return this.root;
        }
        return this.root.findChild('id',id, true);
    },
    /**
     * Сортирует коллекции items дерева в соответствии в orderIndex атрибутами
     */
    initOrderIndexes:function() {
        var sortFn = function(node1, node2) {
            if (node1.attributes.orderIndex > node2.attributes.orderIndex ) {
                return 1;
            }
            else if (node1.attributes.orderIndex == node2.attributes.orderIndex) {
                return 0;
            }
            else if (node1.attributes.orderIndex < node2.attributes.orderIndex) {
                return -1;
            }
        };

        this.root.cascade(function(node){
            node.sort( sortFn );
        } );

        //Смотрим на события изменения в дереве и обновляем orderIndex.
        //Он нам нужен для хранения на сервере верного
        //порядка расположения компонентов на форме
        this.on('append', function(tree, self, node, index) {
            node.attributes.orderIndex = index;
        } );
        this.on('move', function(tree, self, oldParent, newParent, index ) {
            self.attributes.orderIndex = index ;
        });
        this.on('remove', function(tree, parent, node) {
            var next  = node.nextSibling;
            while(next) {
                next.attributes.orderIndex--;
                next = next.nextSibling;
            }
        });
        this.on('insert', function(tree, parent, node, refNode) {
            node.attributes.orderIndex = refNode.attributes.orderIndex;
            var next = node.nextSibling;
            while (next) {
                next.attributes.orderIndex++;
                next = next.nextSibling;
            }
        });
    }
});

/**
 * "Статические" методы - по json передаваемому с сервера строит древовидную модель
 * @param jsonObj - сериализованая модель
 */
DocumentModel._cleanConfig = function(jsonObj) {
    // просто удаляет items из json объекта
    var config = Ext.apply({}, jsonObj);
    Ext.destroyMembers(config, 'items');
    return config;
};

DocumentModel.initFromJson = function(jsonObj) {
    //обходит json дерево и строт цивилизованое дерево с нодами, событьями и проч
    var root = new ComponentModel(DocumentModel._cleanConfig(jsonObj));

    var callBack = function(node, jsonObj) {
        var newNode = new ComponentModel(DocumentModel._cleanConfig(jsonObj));
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

    var result = new DocumentModel(root);
    result.initOrderIndexes();
    return result;
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
            name:'Тупо секция',
            orderIndex:0,
            items:[
                {
                    type:'text',
                    orderIndex:1,
                    name:'Это строка'
                },
                {
                    type:'number',
                    orderIndex:0,
                    name:'Это число'
                }]
        }
    ]
};

var previewPanel = Ext.getCmp('{{ component.preview_panel.client_id }}');
var componentTree = Ext.getCmp('{{ component.tree.client_id }}');

var application = new AppController({
    tree:componentTree,
    designPanel:previewPanel,
    initJson:fake
});

application.init();

function treeNodeDeleteClick(item) {
    application.onTreeNodeDeleteClick(item.parentMenu.contextNode);
}
