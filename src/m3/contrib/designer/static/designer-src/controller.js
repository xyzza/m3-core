/**
 * Crafted by ZIgi
 */

Ext.namespace('M3Designer.controller');

/* Класс контроллера приложения. Является клеем между другими частями приложения.
* При создании экземпляра
* должен быть передан конфиг следующего вида:
*
* config = {
*   tree = ...,
*   container = ...,
*   toolbox = ...,
* }
*
 */

M3Designer.controller.AppController = Ext.extend(Object, {
   //здесь храниться id последнего подсвеченного dom элемента
   _lastHighlightedId: undefined,
   _lastQuickPropertyId: undefined,

    constructor: function(config) {
       Ext.apply(this, config);
   },
   init: function(formCfg) {
       //создаем модель
       this._model = M3Designer.ModelTransfer.deserialize(formCfg);
       //создаем объекты представления модели
       this._treeView = new M3Designer.view.ComponentTree(this.tree, this._model);
       this._designView = new M3Designer.view.DesignView(this.designPanel, this._model);
       //синхронизируем id у панели - общего контейнера и рута модели
       //требуется для работы драг дропа с тулбокса в корень
       this._model.root.setId( this.designPanel.id);
       //создаем объект отвечающий за редактирование свойств
       this._editorManager = new M3Designer.edit.PropertyEditorManager();
       //заполним тулбокс
       this._initToolbox(this.toolbox);
       //иницируем ДД с тулбокса на превью
       this._initDesignDD(this.designPanel);
       //запустим обработку мышиных событий на панели дизайнера
       this._initDesignMouseEvents(this.designPanel);

       //обработчики событий
       this.tree.on('beforenodedrop', this.onComponentTreeBeforeNodeDrop.createDelegate(this));
       this.tree.on('nodedrop', this.onComponentTreeNodeDrop.createDelegate(this));
       this.tree.on('dblclick', this.onComponentTreeNodeDblClick.createDelegate(this));
       this.tree.on('click', this.onComponentTreeNodeClick.createDelegate(this));
       this.tree.on('nodedragover', this.onComponentTreeNodeDragOver.createDelegate(this));
       this._editorManager.on('modelUpdate', this.onModelUpdate.createDelegate(this));

       //в тулбокс ничего перетаскивать нельзя, можно только из него
       this.toolbox.on('nodedragover', function(dragOverEvent) {dragOverEvent.cancel = true });
       this.toolbox.on('beforenodedrop', function(dropEvent){dropEvent.cancel = true });

       //обновим экранное представление
       this.refreshView();
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

       this.designPanel.dropZone = new Ext.dd.DropZone( this.designPanel.getEl(), {
               ddGroup:'designerDDGroup',

               // Джедайский прием. Проброс функции инстанса аппконтроллера,
               // путем создания объекта указателя на функцию со сменой объекта исполнения,
               // нужно это потому что объект который порождает дроп зону будет недоступен на момент
               // исполнения onNodeDrop. И, увы, дроп зона не наследует Observable
               // Да, чуваки, ООП в жабаскрипте это вам не хрен собачий
               processDropResults : this.processDesignerDomDrop.createDelegate(this),
               validateDrop: this.validateDesignerDomDrop.createDelegate(this),

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
                   return this.validateDrop(target, dd, e, data) ? Ext.dd.DropZone.prototype.dropAllowed:
                           Ext.dd.DropZone.prototype.dropNotAllowed;
               },
               onNodeDrop:function(target, dd, e, data) {
                   this.processDropResults(target, dd, e, data);
               }
           });
   },
   /*
   * Вешаемся на клики по панели. При ординарном щелчке подсвечиваем ближайший редактируемый элемент
   * При двойном открываем окно редактирования
   */
   _initDesignMouseEvents: function(panel) {
       var el = panel.getEl();
       el.on('dblclick', this.onDesignerPanelDomDblClick.createDelegate(this));
       el.on('click', this.onDesignerPanelDomClick.createDelegate(this));
       /* Демократия товарищи */
       el.on('contextmenu', this.onDesignerPanelDomClick.createDelegate(this), null, {preventDefault: true});
   },
   /*
   * Заполняем тулбокс компонентами
   */
   _initToolbox:function(toolbox) {
            var root = toolbox.getRootNode();
            root.appendChild(M3Designer.Types.getToolboxData() );
   },
   /*
    * Подствека в превью дизайнера компонента для элемента с id
    */
   highlightElement:function(id) {
       this.removeHighlight();
       var flyEl = Ext.fly(id);
       if (flyEl) {
           flyEl.addClass('selectedElement');
            this._lastHighlightedId = id;
       }
   },
   /*
    * Убрать подстветку
    */
   removeHighlight:function() {
       if (!Ext.isEmpty(this._lastHighlightedId)) {
           var flyEl = Ext.fly(this._lastHighlightedId);
           if (flyEl) {
               flyEl.removeClass('selectedElement');
           }
           else {
               //ситуация когда подсветка была на элемента, который удалили
               this._lastHighlightedId = undefined;
           }
       }  
   },
    /*
    * Просто все перерисовываем
    */
   refreshView:function() {
       this._treeView.refresh();
       this._designView.refresh();
   },

   /*
    * Обработка дропа на деверева компонентов. Параметры две TreeNode и строка с положеним относитнльно
    * друг друга
    */
   moveTreeNode:function(drop, target, point) {
        var sourceModel = this._model.findModelById(drop.attributes.id);
        var targetModel = this._model.findModelById(target.attributes.id);

       //Изменение положения ноды это фактически две операции - удаление и аппенд к новому родителю
       //поэтому прежде чем двигать отключим обновление UI, так как иначе получим js ошибки при перерисовке
       //дерева в неподходящий момент внутри treeSorter'а

       this.removeHighlight();

       this._treeView.suspendModelListening();
       this._designView.suspendModelListening();

       this._moveModelComponent(sourceModel, targetModel, point);

       this.refreshView();

       this._treeView.resumeModelListening();
       this._designView.resumeModelListening();

       return false;
   },
   /*
    * Перемещение моделей в дереве документа
    */
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
   /*
   * Создаем новый компонент
   */
   _createModelComponent:function(parentModel, type){
       if (!parentModel.checkRestrictions(type)) {
           return;
       }
       var newModelNodeConfig = {};
       newModelNodeConfig.properties = M3Designer.Types.getTypeInitProperties(type);
       var nameIndex = this._model.countModelsByType(type);
       newModelNodeConfig.properties.id = newModelNodeConfig.properties.id + '_' + (nameIndex+1) ;
       newModelNodeConfig.type = type;
       parentModel.appendChild( new M3Designer.model.ComponentModel(newModelNodeConfig) );
   },
   /*
   * Обработка дропа в дизайнер с тулбокса
   */
   processDesignerDomDrop:function(target, dd, e, data ) {
       this.removeHighlight();
       if (!data.node.attributes.isToolboxNode) {
           return void(!!'Jakesnake, %username%');//void? void!
       }
       var componentNode = data.node;
       var modelId = M3Designer.Utils.parseModelId(target.id);
       var model = this._model.findModelById(modelId);
       this._createModelComponent(model, componentNode.attributes.type);
   },
   /*
   * Проверка допустимости при перетаскивании между тулбоксом и дизайнером
    */
   validateDesignerDomDrop:function(target, dd, e, data) {
       //в дизайнер разрешается дропать только ноды с тулбокса, из дерева компонентов нельзя
       if (!data.node.attributes.isToolboxNode) {
           return false;
       }
       var modelId = M3Designer.Utils.parseModelId(target.id);
       var parent = this._model.findModelById(modelId);
       var child = data.node.attributes.type;
       return parent.checkRestrictions(child);
   },
   /*
    * Проверка допустимости при перетаскивании в дереве компонентов. eventObj эли dragOverEvent или dropEvent
    * у TreePanel
    */
   validateComponentTreeDrop:function(eventObj) {
       var parent = this._model.findModelById( eventObj.target.attributes.id);
       var child = eventObj.dropNode.attributes.type;

       if (eventObj.target.isRoot) {
           //рут не отображается, и в него нельзя перетаскивать
           return false;
       }

       //отображаемый рут - window или panel. Вне него нельзя ничего перемещать
       if (parent.isRoot && (eventObj.point == 'above' ||
           eventObj.point == 'below')) {
           return false;
       }
       
       //проверка допустимости типов
       if (eventObj.point == 'append') {
           return parent.checkRestrictions(child);
       }
       else {
           var grandParent = parent.parentNode;
           return grandParent.checkRestrictions(child);
       }
   },
   /*
   * Возвращает объект для отправки на сервер
   */
   getTransferObject:function() {
       return M3Designer.ModelTransfer.serialize(this._model);
   },
   onDesignerPanelDomDblClick: function(event, target, obj) {
       var el = event.getTarget('.designComponent');
       if (el) {
           var modelId = M3Designer.Utils.parseModelId(el.id);
           var model = this._model.findModelById(modelId);
           this._editorManager.editModel(model);
       }
   },
   onDesignerPanelDomClick: function(event, target, obj) {
       var el = event.getTarget('.designComponent');
       if (el) {
           //Выделяет элемент в дереве компонентов
           var nodeId = M3Designer.Utils.parseDomIdToNodeId(el.id)
           this.tree.getNodeById(nodeId).select();

           this.highlightElement(el.id);
           var modelId = M3Designer.Utils.parseModelId(el.id);
           var model = this._model.findModelById(modelId);
           //Закрываем окно предыдущие окно быстрого редактирования свойств (если оно есть)
           var win = Ext.getCmp(this._lastQuickPropertyId);
           if (win) win.close();
           this._lastQuickPropertyId = this._editorManager.quickEditModel(model, event.xy);
       }
   },
   onComponentTreeNodeClick:function(node, e) {
       this.highlightElement(M3Designer.Utils.parseDomId(node.id));
   },
   onComponentTreeBeforeNodeDrop:function(dropEvent) {
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
   onComponentTreeNodeDragOver:function(dragOverEvent){
       //если перетаскивать нельзя, то будет отображен соответствующий значек на курсоре мышки
       dragOverEvent.cancel = !this.validateComponentTreeDrop(dragOverEvent);
   },
   onComponentTreeNodeDrop: function(dropEvent) {
       //либо перемещение нод, либо создание нового компонента, если нода была из тулбокса
       if (!dropEvent.dropNode.attributes.isToolboxNode) {
           this.moveTreeNode(dropEvent.dropNode, dropEvent.target, dropEvent.point);
       }
       else {
           var model = this._model.findModelById(dropEvent.target.id);
           var type = dropEvent.dropNode.attributes.type;
           this._createModelComponent(model,type);
       }
       return false;
   },
   onComponentTreeNodeDblClick:function(node, e) {
       var model = this._model.findModelById(node.id);
       this._editorManager.editModel(model);
   },
   onComponentTreeNodeDeleteClick:function(treeNode) {
       var model = this._model.findModelById(treeNode.id);
       model.remove(true);
   },
   onModelUpdate:function() {
       this.refreshView();
   }
});