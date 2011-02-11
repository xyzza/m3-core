/**
 * Crafted by ZIgi
 */

/**
 * Классы представления. Принцип работы - классы наследники повешены на события обновления модели,
 * когда модель обновляется контроллером, представление перерисовывается без внешнего участия
 * Это MVC етп.
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

        var recursion = function(model) {
            var newComponentCfg = this._createComponent( model );

            if (model.isContainer() && model.childNodes && model.childNodes.length > 0) {
                for (var i=0; i < model.childNodes.length; i++) {
                    if (!(model.childNodes[i].attributes.properties.parentDockType &&
                            model.childNodes[i].attributes.properties.parentDockType != '(none)')) {
                        var newChild = recursion.call(this, model.childNodes[i]);
                        if (newChild) {
                            newComponentCfg.items.push(newChild);
                        }
                    }
                    else {
                        newComponentCfg[model.childNodes[i].attributes.properties.parentDockType] =
                                (recursion.call(this, model.childNodes[i]) );
                    }
                }
            }

            return newComponentCfg;
        };


        var childCfg = recursion.call(this, this._model.root);
        this._container.add(childCfg);
        this._container.doLayout(true, true);
    },
    _createComponent:function(model) {
        return ModelUIPresentaitionBuilder.build(model);
    }
});

/*
* Обновляет содержимое дерева по модели
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
            var newNode = ModelUtils.buildTreeNode(model);
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
