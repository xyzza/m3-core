/**
 * Crafted by ZIgi
 */
Ext.namespace('M3Designer.view');

/**
 * @class M3Designer.view.BaseView
 * Базовый класс представления. Принцип работы - классы наследники повешены на события обновления модели,
 * когда модель обновляется контроллером, представление перерисовывается без внешнего участия
 * Это MVC етп.
 */
M3Designer.view.BaseView = Ext.extend(Object, {
    /**
     * флажок - реагировать ли на события модели
     */
    _modelEventsActive: true,

    /**
     * @constructor
     * @param {M3Designer.model.FormModel} model
     */
    constructor: function (model) {
        this._model = model;
        this._model.on('append', this.beforeRefresh.createDelegate(this));
        this._model.on('insert', this.beforeRefresh.createDelegate(this));
        this._model.on('move', this.beforeRefresh.createDelegate(this));
        this._model.on('remove', this.beforeRefresh.createDelegate(this));

    },

    /**
     * После вызова метода ивенты модели не обрабатываются до вызова resumeModelListening
     */
    suspendModelListening: function () {
        this._modelEventsActive = false;
    },

    /**
     * Посе вызова метода ивенты обрабатываюцца
     */
    resumeModelListening: function () {
        this._modelEventsActive = true;
    },

    /**
     * Можно обновляться?
     */
    beforeRefresh: function () {
        if (this._modelEventsActive) {
            this.refresh();
        }
    },

    /**
     * Метод должен переопределяться в дочерних классах
     */
    refresh: function () {
        //
    }
});

/**
 * @class M3Designer.view.DesignView
 * Класс преназначен для синхронизации модели и экранного превью. В конструктор передается
 * экземпляр Ext.Container(к примеру это могут быть Ext.Panel или Ext.Window) и экземпляер модели
 * При вызове метода refresh() старое содержимое контейнера удаляется и заполняется новосоздаными элементами UI
 * по модели
 */
M3Designer.view.DesignView = Ext.extend(M3Designer.view.BaseView, {
    /**
     * @constructor
     * @param {Ext.Container} container
     * @param {M3Designer.model.FormModel} model
     */
    constructor: function (container, model) {
        this._container = container;
        M3Designer.view.DesignView.superclass.constructor.call(this, model);
    },
    refresh: function () {
        this._container.removeAll();

        var recursion = function (model) {
            var newComponentCfg = this.createComponent(model);
            var i;

            if (model.isContainer() && model.childNodes && model.childNodes.length > 0) {
                for (i = 0; i < model.childNodes.length; i++) {
                    if (!(model.childNodes[i].attributes.properties.parentDockType
                            && model.childNodes[i].attributes.properties.parentDockType !== '(none)')) {
                        var newChild = recursion.call(this, model.childNodes[i]);
                        if (newChild) {
                            newComponentCfg.items.push(newChild);
                        }
                    } else {
                        newComponentCfg[model.childNodes[i].attributes.properties.parentDockType] =
                            (recursion.call(this, model.childNodes[i]));
                    }
                }
            }
            return newComponentCfg;
        };

        var childCfg = recursion.call(this, this._model.root);

        this._container.add(childCfg);
        //Legacy code, все уже забыли причины
        //this._container.doLayout(true, true);
        this._container.doLayout();
    },
    createComponent: function (model) {
        return M3Designer.ui.ModelUIPresentaitionBuilder.build(model);
    }
});

/**
 * @class M3Designer.view.ComponentTree
 * Обновляет содержимое дерева компонентов по модели
 */
M3Designer.view.ComponentTree = Ext.extend(M3Designer.view.BaseView, {
    /**
     * @constructor
     * @param {Ext.tree.TreePanel} tree дерево компонентов
     * @param {ComponentModel} model моделька
     */
    constructor: function (tree, model) {
        this._tree = tree;
        M3Designer.view.ComponentTree.superclass.constructor.call(this, model);

        //Дзен кодинг:
        //мы сохраняем в отдельные поля текущего объекты ссылки на функции обработчики
        //это нужно чтобы можно было удалить обработчики с дерева компонентов
        //тк в качестве обраточиков в дерева компонентов используется createDelegate с
        // изменением контекста исполнения заранее
        //,а он в свою очередь внутри себя создает новую функцию с замыканием на
        //объект this. Те нельзя удалить обработчик с дерева
        //повторно вызвав createDelegate. А если обработчик не удалять при удалении объекта, то при создании
        // новго экземпляра этого класса будет наблюдаться интересный
        //эффект когда на раскрытие ноды будут отрабатывать две функции подряд, и одна из них делать
        //это неправильно соответсвенно(и более того неудаленный обработчик будет
        //подвешивать в память экземпляр объекта. Привет утечкам памяти)
        // Если кто-то найдет более изящный способ реализовать это - сообщите мне
        //У наследников Ext.Component кстати такие штуки предусмотрены через mon и mun
        //и жизненный цикл с деструкторами
        this.nodeExpandHandler = this.onNodeExpand.createDelegate(this);
        this.nodeCollapseHandler = this.onNodeCollapse.createDelegate(this);

        //в переменной attributes.expanded сохраняется какие ноды в дереве раскрывал пользователь
        //это учитывается при перерисовке чтобы дерево лишнего не расхлопывало
        tree.on('expandnode', this.nodeExpandHandler);
        tree.on('collapsenode', this.nodeCollapseHandler);
    },

    /**
     * @destructor
     * Деструктор в моем джава скрипте ололо?
     * На самом деле этот метод мог бы и по другому называться, но в объектной модели эксте так принято
     */
    destroy: function () {
        this._tree.un('expandnode', this.nodeExpandHandler);
        this._tree.un('collapsenode', this.nodeCollapseHandler);
    },
    refresh: function () {
        var root = this._tree.root;
        root.removeAll(true);

        var recursion = function (parent, model) {
                var newNode = this.createTreeNode(model);
                var i;
                parent.appendChild(newNode);

                if (model.childNodes && model.childNodes.length > 0) {
                    for (i = 0; i < model.childNodes.length; i++) {
                        recursion.call(this, newNode, model.childNodes[i]);
                    }
                }
            };
        recursion.call(this, root, this._model.root);
    },
    createTreeNode: function (model) {
        //Опять же важное замечание - id ноды в дереве компнентов на экране и id модельки равны друг другу
        var iconCls = M3Designer.Types.getTypeIconCls(model.attributes.type);
        var nodeText = model.attributes.properties.id;
        if (model.attributes.properties.title) {
            nodeText += ' (' + model.attributes.properties.title + ')';
        }
        if (model.attributes.properties.fieldLabel) {
            nodeText += ' (' + model.attributes.properties.fieldLabel + ')';
        }

        var expanded = model.attributes.expanded || false;
        if (model.isRoot) {
            expanded = true;
        }

        return new Ext.tree.TreeNode({
            text: nodeText,
            id: model.id,
            expanded: expanded,
            allowDrop: model.isContainer(),
            iconCls: iconCls,
            type: model.attributes.type
        });
    },
    onNodeExpand: function (node) {
        var componentModel = this._model.findModelById(node.id);
        componentModel.attributes.expanded = true;
    },
    onNodeCollapse: function (node) {
        var componentModel = this._model.findModelById(node.id);
        componentModel.attributes.expanded = false;
    }
});