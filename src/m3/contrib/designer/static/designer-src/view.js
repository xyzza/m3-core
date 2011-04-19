/**
 * Crafted by ZIgi
 */

Ext.namespace('M3Designer.view');

/**
 * Классы представления. Принцип работы - классы наследники повешены на события обновления модели,
 * когда модель обновляется контроллером, представление перерисовывается без внешнего участия
 * Это MVC етп.
 */

M3Designer.view.BaseView = Ext.extend(Object, {
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

M3Designer.view.DesignView = Ext.extend(M3Designer.view.BaseView, {
    constructor: function(container, model) {
        this._container = container;
        M3Designer.view.DesignView.superclass.constructor.call(this, model);
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
        return M3Designer.ui.ModelUIPresentaitionBuilder.build(model);
    }
});

/*
* Обновляет содержимое дерева по модели
 */

M3Designer.view.ComponentTree = Ext.extend(M3Designer.view.BaseView, {
    constructor: function(tree, model) {
        this._tree = tree;
        M3Designer.view.ComponentTree.superclass.constructor.call(this, model);
    },
    refresh:function() {
        var root = this._tree.root;
        root.removeAll(true);

        var recursion = function(parent, model) {
            var newNode = this.createTreeNode(model);
            parent.appendChild(newNode);

            if (model.childNodes && model.childNodes.length > 0) {
                for (var i=0; i < model.childNodes.length; i ++) {
                    recursion.call(this,newNode, model.childNodes[i]);
                }
            }
        };
        recursion.call(this,root, this._model.root);
    },
    createTreeNode:function(model) {
        //Опять же важное замечание - id ноды в дереве компнентов на экране и id модельки равны друг другу
        var iconCls = M3Designer.Types.getTypeIconCls(model.attributes.type);
        var nodeText = model.attributes.properties.id;
        if (model.attributes.properties.title) {
            nodeText += ' (' + model.attributes.properties.title + ')'
        };
        if (model.attributes.properties.fieldLabel) {
            nodeText += ' (' + model.attributes.properties.fieldLabel + ')'
        };
        return new Ext.tree.TreeNode({
                text:nodeText,
                id:model.id,
                expanded:true,
                allowDrop:model.isContainer(),
                orderIndex:model.attributes.orderIndex+'' || '0',
                iconCls: iconCls
            });
    }
});
