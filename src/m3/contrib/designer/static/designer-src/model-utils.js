/**
 * Crafted by ZIgi
 */

/**
 * Объект включает в себя набор утилитных функций для преобразования модели во что-то другое
 */
ModelUtils = Ext.apply(Object,{
    /**
     * Возвращает ExtComponent или какой нибудь его наследник
     */
    buildExtUIComponent:function(model) {
        //Важное замечание номер раз - каждому экстовому компоненту присваевается id = id модели
        //это требуется для того чтобы ставить в соответсвие DOM элементы и экстовые компоненты
        //Важное замечание номер два - у контейнеров следует навешивать cls 'designContainer'
        //он нужен для визуального dd на форму при лукапе по DOM'у

        var cfg = Ext.apply({}, model.attributes.properties);
        cfg.id = model.id;
        if (ModelTypeLibrary.isTypeContainer(model.attributes.type)) {
            cfg.cls = 'designContainer';
        }


        switch(model.attributes.type)
        {
            case 'panel':
                return new Ext.Panel(cfg);
            break;

            case 'window':
                return new Ext.Panel(cfg);
            break;

            case 'textField':
                return new Ext.form.TextField(
                    Ext.apply(cfg,{
                        readOnly:true
                    })
                );
            break;

            case 'tabPanel':
                return new Ext.TabPanel(
                    Ext.apply(cfg,{
                        deferredRender:false
                    })
                );
            break;
        }
    },
    /**
     * Возвращает TreeNode по модели
     */
    buildTreeNode:function(model) {
        //Опять же важное замечание - id ноды в дереве компнентов на экране и id модельки равны друг другу
        var iconCls = ModelTypeLibrary.getTypeIconCls(model.attributes.type);
            return new Ext.tree.TreeNode({
                text:model.attributes.properties.name,
                id:model.id,
                expanded:true,
                allowDrop:model.isContainer(),
                orderIndex:model.attributes.orderIndex+'' || '0',
                iconCls: iconCls
            });
    },
    /*
    * Подготавливает данные модели для отправки на сервер. Объект выглядит следующим образом:
    * {
    *   model:{ //сама модель
     *      id:507, //это серверный id, или 0 для новых компонентов
    *       type:'document',
    *       name:'fofofo',
    *       items:[]
    *   },
    *   deletedModels:[
    *       {
    *           id:508,
    *           type:'date',
    *           name:'Bla-bla'
    *       }
    *   ] //нужно уведомить сервер о удаленных компонентов
    * }
    */
    buildTransferObject:function(model){
        var result = {};
        var prepareId = function(dataObject){
            dataObject.id = dataObject.serverId ? dataObject.serverId : 0;
        };

        var doRecursion = function(model) {
            var node = Ext.apply({}, model.attributes);
            prepareId(node);
            if (model.hasChildNodes()) {
                node.items = [];
                for (var i = 0; i < model.childNodes.length; i++){
                    node.items.push( doRecursion(model.childNodes[i]) );
                }
            }
            return node;
        };

        result.model = doRecursion(model.root);

        result.deletedModels = model.deletedItemsBag;
        return result;
    }
});