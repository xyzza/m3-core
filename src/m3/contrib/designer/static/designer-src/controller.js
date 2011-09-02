/**
 * Crafted by ZIgi
 */
Ext.namespace('M3Designer.controller');

/**
 * @class M3Designer.controller.AppController
 * Класс контроллера приложения. Инициирует классы, используемые дизайнером,
 * и управляет их взаимодействием друг с другом. Здесь же находятся обработчики действий
 * пользовательского интерфейса.
 * @param {Object} конфиг объект
 */
M3Designer.controller.AppController = Ext.extend(Ext.util.Observable, {
    /**
     * @constructor
     * @cfg {Ext.tree.TreePanel} tree
     * Экземпляр экстового дерева в котором будет отображаться струкутра текущей формы
     * @cfg {Ext.Container} designPanel
     * Контейнер или наследник в котором будут визуально отображаться компоненты
     * @cfg {Ext.tree.TreePanel} toolbox
     * Дерево используемое в качестве панели инструментов
     */
    constructor: function (config) {
        this.addEvents('contentchanged');
        Ext.apply(this, config);
    },

    //здесь храняться id последнего подсвеченного dom элемента
    _lastHighlightedId: undefined,
    //id последнего быстроредактируемого компонента
    _lastQuickPropertyId: undefined,

    /**
     * Фактическая инициализация дизайнера
     * @param {Object} formCfg json объект с данными, который преобразовывается во внутреннюю модель приложения
     */
    init: function (formCfg) {
        //создаем модель
        this._model = M3Designer.ModelTransfer.deserialize(formCfg);
        //создаем объекты представления модели
        this._treeView = new M3Designer.view.ComponentTree(this.tree, this._model);
        this._designView = new M3Designer.view.DesignView(this.designPanel, this._model);
        //синхронизируем id у панели - общего контейнера и рута модели
        //требуется для работы драг дропа с тулбокса в корень
        this._model.root.setId(this.designPanel.id);
        //создаем объект отвечающий за редактирование свойств
        this._editorManager = new M3Designer.edit.PropertyEditorManager();
        //заполним тулбокс
        this.initToolbox(this.toolbox);
        //иницируем ДД с тулбокса на превью
        this.initDesignDD(this.designPanel);
        //запустим обработку мышиных событий на панели дизайнера
        this.initDesignMouseEvents(this.designPanel);

        //обработчики событий
        this.tree.on('beforenodedrop', this.onComponentTreeBeforeNodeDrop.createDelegate(this));
        this.tree.on('nodedrop', this.onComponentTreeNodeDrop.createDelegate(this));
        this.tree.on('dblclick', this.onComponentTreeNodeDblClick.createDelegate(this));
        this.tree.on('click', this.onComponentTreeNodeClick.createDelegate(this));
        this.tree.on('nodedragover', this.onComponentTreeNodeDragOver.createDelegate(this));

        this._editorManager.on('modelUpdate', this.onModelUpdate.createDelegate(this));

        this._model.on('append', this.beforeRefreshView.createDelegate(this));
        this._model.on('insert', this.beforeRefreshView.createDelegate(this));
        this._model.on('move', this.beforeRefreshView.createDelegate(this));
        this._model.on('remove', this.beforeRefreshView.createDelegate(this));

        //в тулбокс ничего перетаскивать нельзя, можно только из него
        this.toolbox.on('nodedragover', function (dragOverEvent) {
            dragOverEvent.cancel = true;
        });
        this.toolbox.on('beforenodedrop', function (dropEvent) {
            dropEvent.cancel = true;
        });

        //обновим экранное представление
        this.refreshView();
    },

    /**
     * Инициализация объектов и обработчиков для драг энд дропа с тулбокса с на панель превью
     */
    initDesignDD: function () {
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
        this.designPanel.dropZone = new Ext.dd.DropZone(this.designPanel.getEl(), {
            ddGroup: 'designerDDGroup',

            // Джедайский прием. Проброс функции инстанса аппконтроллера,
            // путем создания объекта указателя на функцию со сменой объекта исполнения,
            // нужно это потому что объект который порождает дроп зону будет недоступен на момент
            // исполнения onNodeDrop. И, увы, дроп зона не наследует Observable
            // Да, чуваки, ООП в жабаскрипте это вам не хрен собачий
            processDropResults: this.processDesignerDomDrop.createDelegate(this),
            validateDrop: this.validateDesignerDomDrop.createDelegate(this),

            getTargetFromEvent: function (e) {
                //сюда попадают мышиные DOM события, будем пытаться найти ближайший допустимый
                //контейнер. getTarget ищет по селектору или в текущей вершине, или в вершнах предках, но
                //не в наследниках. Те функция вернет или null и функции ниже ничего не будут делать,
                //или target'ом станет ближайший найденый контейнер(вернее DOM вершина которую этот конейтер
                //олицетворяет)
                return e.getTarget('.designContainer');
            },
            onNodeEnter: function (target) {
                Ext.fly(target).addClass('selectedElement');
            },
            onNodeOut: function (target) {
                Ext.fly(target).removeClass('selectedElement');
            },
            onNodeOver: function (target, dd, e, data) {
                //здесь штука чтобы показать значок 'Можно дропать' на экране
                return this.validateDrop(target, dd, e, data) ? Ext.dd.DropZone.prototype.dropAllowed :
                    Ext.dd.DropZone.prototype.dropNotAllowed;
            },
            onNodeDrop: function (target, dd, e, data) {
                this.processDropResults(target, dd, e, data);
            }
        });
    },

    /**
     * Вешаемся на клики по панели. При ординарном щелчке подсвечиваем ближайший редактируемый элемент
     * При двойном открываем окно редактирования
     */
    initDesignMouseEvents: function (panel) {
        var el = panel.getEl();
        el.on('dblclick', this.onDesignerPanelDomDblClick.createDelegate(this));
        el.on('click', this.onDesignerPanelDomClick.createDelegate(this)); /* Демократия товарищи */
        el.on('contextmenu', this.onDesignerPanelDomClick.createDelegate(this), null, {
            preventDefault: true
        });
    },

    /**
     * Заполняем тулбокс компонентами
     */
    initToolbox: function (toolbox) {
        var root = toolbox.getRootNode();
        root.appendChild(M3Designer.Types.getToolboxData());
    },

    /**
     * Функция возвращает состояние,
     * если в аргументах пришло состояние оно будет присвоено переменной
     * @param stateBool {Boolean} setter
     */
    changedState: function(stateBool){
        if (stateBool !== undefined){
            this._model.root.dirty = stateBool;
            if (stateBool === false){
                this._model.cleanChanges();
            }
        }
        return this._model.root.dirty
    },

    /**
     * Подствека в превью дизайнера компонента для элемента с id
     * @id id Элемента
     * @stayAliveQuickProperty bool значение, если true то QuickPropertyWindow не уничтожиться
     */
    highlightElement: function (id, stayAliveQuickProperty) {
        this.removeHighlight(stayAliveQuickProperty);
        var flyEl = Ext.fly(id);
        if (flyEl) {
            flyEl.addClass('selectedElement');
            this._lastHighlightedId = id;
        }
    },

    /**
     * Убрать подстветку
     * @stayAliveQuickProperty {Boolean} если true то QuickPropertyWindow не уничтожиться
     */
    removeHighlight: function (stayAliveQuickProperty) {
        if (!Ext.isEmpty(this._lastHighlightedId)) {
            var flyEl = Ext.fly(this._lastHighlightedId);
            var win = Ext.getCmp(this._lastQuickPropertyId);

            if (win && !stayAliveQuickProperty){
                win.close();
            }

            if (flyEl) {
                flyEl.removeClass('selectedElement');
            } else {
                //ситуация когда подсветка была на элемента, который удалили
                this._lastHighlightedId = undefined;
            }
        }
    },

    /**
     * Просто все перерисовываем
     */
    refreshView: function () {
        this._treeView.refresh();
        this._designView.refresh();
    },

    /**
     * Динамическая замена модели в приложении. Старая модель выкидывается и заменяется новой
     * @param {Object} formCfg - json объект с данными
     */
    reloadModel: function (formCfg) {
        this._model = M3Designer.ModelTransfer.deserialize(formCfg);
        Ext.destroy(this._treeView);
        Ext.destroy(this._designView);
        this._treeView = new M3Designer.view.ComponentTree(this.tree, this._model);
        this._designView = new M3Designer.view.DesignView(this.designPanel, this._model);
        this._model.root.setId(this.designPanel.id);
        this.refreshView();
    },

    /**
     * Обработка дропа на деверева компонентов. Параметры две TreeNode и строка с положеним относитнльно
     * друг друга
     */
    moveTreeNode: function (drop, target, point) {
        var sourceModel = this._model.findModelById(drop.attributes.id);
        var targetModel = this._model.findModelById(target.attributes.id);

        //Изменение положения ноды это фактически две операции - удаление и аппенд к новому родителю
        //поэтому прежде чем двигать отключим обновление UI, так как иначе получим js ошибки при перерисовке
        //дерева в неподходящий момент внутри treeSorter'а
        this.removeHighlight();

        this._treeView.suspendModelListening();
        this._designView.suspendModelListening();

        this.moveModelComponent(sourceModel, targetModel, point);

        this.refreshView();

        this._treeView.resumeModelListening();
        this._designView.resumeModelListening();

        return false;
    },

    /**
     * Обработка перемещения компонентов
     * @param {Ext.data.Node} source нода что перемещается
     * @param {Ext.data.Node} target нода куда перемещается
     * @param {string} point положение относительно target(above, below, append)
     */
    moveModelComponent: function (source, target, point) {
        if (point === 'append') {
            target.appendChild(source);
        } else if (point === 'above') {
            var parent = target.parentNode;
            parent.insertBefore(source, target);
        } else if (point === 'below') {
            target.parentNode.insertBefore(source, target.nextSibling);
        }
    },

    /**
     * Создаем новый компонент
     * @param {M3Designer.model.ComponentModel} parentModel куда прицепить новосозданый компонент
     * @param {String} type тип нового компонента строкой
     */
    createModelComponent: function (parentModel, type) {
        if (!parentModel.checkRestrictions(type)) {
            return;
        }
        var newModelNodeConfig = {};
        newModelNodeConfig.properties = M3Designer.Types.getTypeInitProperties(type);
        var nameIndex = this._model.countModelsByType(type);
        newModelNodeConfig.properties.id = newModelNodeConfig.properties.id + '_' + (nameIndex + 1);
        newModelNodeConfig.type = type;
        parentModel.appendChild(new M3Designer.model.ComponentModel(newModelNodeConfig));
    },

    /**
     * Обработка дропа в дизайнер с тулбокса
     */
    processDesignerDomDrop: function (target, dd, e, data) {
        this.removeHighlight();
        if (!data.node.attributes.isToolboxNode) {
            return void !!'Jakesnake, %username%'; //void? void!
        }
        var componentNode = data.node;
        var modelId = M3Designer.Utils.parseModelId(target.id);
        var model = this._model.findModelById(modelId);
        this.createModelComponent(model, componentNode.attributes.type);
    },

    /**
     * Проверка допустимости при перетаскивании между тулбоксом и дизайнером
     */
    validateDesignerDomDrop: function (target, dd, e, data) {
        //в дизайнер разрешается дропать только ноды с тулбокса, из дерева компонентов нельзя
        if (!data.node.attributes.isToolboxNode) {
            return false;
        }
        var modelId = M3Designer.Utils.parseModelId(target.id);
        var parent = this._model.findModelById(modelId);
        var child = data.node.attributes.type;
        return parent.checkRestrictions(child);
    },

    /**
     * Проверка допустимости при перетаскивании в дереве компонентов.
     * @param eventObj dragOverEvent или dropEvent
     */
    validateComponentTreeDrop: function (eventObj) {
        var parent = this._model.findModelById(eventObj.target.attributes.id);
        var child = eventObj.dropNode.attributes.type;

        if (eventObj.target.isRoot) {
            //рут не отображается, и в него нельзя перетаскивать
            return false;
        }

        //отображаемый рут - window или panel. Вне него нельзя ничего перемещать
        if (parent.isRoot && (eventObj.point === 'above' || eventObj.point === 'below')) {
            return false;
        }

        //проверка допустимости типов
        if (eventObj.point === 'append') {
            return parent.checkRestrictions(child);
        } else {
            var grandParent = parent.parentNode;
            return grandParent.checkRestrictions(child);
        }
    },

    /**
     * Преобразует внутреннюю модель приложения в объект с данными,
     * для отправки на сервер например
     */
    getTransferObject: function () {
        return M3Designer.ModelTransfer.serialize(this._model);
    },

    /**
     * Дабл клик по компоненту в панели дизайнера - открывает окошко со свойствами
     */
    onDesignerPanelDomDblClick: function (event) {
        var el = event.getTarget('.designComponent');
        if (el) {
            var modelId = M3Designer.Utils.parseModelId(el.id);
            var model = this._model.findModelById(modelId);
            this._editorManager.editModel(model);
        }
    },
    /*Выделяет узел дерева по id элемента*/
    selectTreeNodeByElementId:function(elelmentId){
        var nodeId = M3Designer.Utils.parseDomIdToNodeId(elelmentId);
        var treeNode = this.tree.getNodeById(nodeId);
        if (!treeNode.isExpanded()) treeNode.ensureVisible();
        treeNode.select();
    },
    /**
     * Один клик по компоненту в панели дизайна. Вызывает подсветку компонента, инлайн редактирование
     * и разворачивает узел в дереве компонентов
     */
    onDesignerPanelDomClick: function (event) {
        var el = event.getTarget('.designComponent');
        if (el) {
            //Выделяет элемент в дереве компонентов
            this.selectTreeNodeByElementId(el.id);
            //Подсвечивает элементы выделения
            this.highlightElement(el.id);

            // Определение QuickPropertyWindow
            if (!Ext.getCmp(this._lastQuickPropertyId)){
                var modelId = M3Designer.Utils.parseModelId(el.id);
                var model = this._model.findModelById(modelId);
                this._editorManager.editModelInline(model);
                this._lastQuickPropertyId = this._editorManager.quickEditModel(model);
            }
        }
    },

    /**
     * Клик по узлу в дереве компонентов - подствека и инлайн редактирование
     */
    onComponentTreeNodeClick: function (node) {
        this.highlightElement(M3Designer.Utils.parseDomId(node.id));

        // Отображение property, в панели динамически
        var model = this._model.findModelById(node.id);
        this._editorManager.editModelInline(model);
    },

    /**
     * Обработчик при перетаскивание ноды на дерево компонентов
     */
    onComponentTreeBeforeNodeDrop: function (dropEvent) {
        var dropAllowed = this.validateComponentTreeDrop(dropEvent);
        if (dropAllowed && dropEvent.dropNode.attributes.isToolboxNode) {
            //тут такой хитрый воркэраунд - мы заменяем объект перетаскивания на дубликат
            //если этого не сделать то перемещаемая нода будет удалена в тулбоксе(какое дефолтное поведение экстового дерева),
            //а так как был создан дубликат то его и удалят, его не жалко.
            //Кажется что есть другие способы, например создавать компонент в этом соыбтии и отменять дд
            //но все это ведет к js ошибкам.
            dropEvent.dropNode = new Ext.tree.TreeNode(dropEvent.dropNode.attributes);
        }
        return dropAllowed;
    },

    /**
     * Обработчик при перетаскивании
     */
    onComponentTreeNodeDragOver: function (dragOverEvent) {
        //если перетаскивать нельзя, то будет отображен соответствующий значек на курсоре мышки
        dragOverEvent.cancel = !this.validateComponentTreeDrop(dragOverEvent);
    },

    /**
     * Обработчик при перетаскивании
     */
    onComponentTreeNodeDrop: function (dropEvent) {
        //либо перемещение нод, либо создание нового компонента, если нода была из тулбокса
        if (!dropEvent.dropNode.attributes.isToolboxNode) {
            this.moveTreeNode(dropEvent.dropNode, dropEvent.target, dropEvent.point);
        } else {
            var model = this._model.findModelById(dropEvent.target.id);
            if (dropEvent.point !== 'append') {
                model = model.parentNode;
            }
            var type = dropEvent.dropNode.attributes.type;
            this.createModelComponent(model, type);
        }
        return false;
    },

    /**
     * Дабл клик по ноде - редактирование в окошке
     */
    onComponentTreeNodeDblClick: function (node) {
        var model = this._model.findModelById(node.id);
        this._editorManager.editModel(model);
    },

    /**
     * Обработчик на удаление компонента
     */
    onComponentTreeNodeDeleteClick: function (treeNode) {
        var model = this._model.findModelById(treeNode.id);
        model.remove(true);
    },

    /**
     * Обработчик при обновлении модели - перерисовка превью
     */
    onModelUpdate: function (model) {
        this.refreshView();
        var domElementId = M3Designer.Utils.parseDomId(model.id);

        //Можно просто брать id элемента из модели ( domElementId )
        var highlightedId = domElementId ==  this._lastHighlightedId ?
                                this._lastHighlightedId : domElementId;
        //Возвращаем Highlight элементу
        this.selectTreeNodeByElementId(highlightedId);
        //Выделяем элемент в дереве
        this.highlightElement(highlightedId, true);

        this.changedState(true);
        //Зажигаем событие
        this.fireEvent('contentchanged');
    },
    /**
     * Хендлер, выполняется до синхронизации модели и предстовления
     */
    beforeRefreshView: function(){
        //Меняем состояние
        this.changedState(true);
        //Зажигаем событие
        this.fireEvent('contentchanged');
    }
});