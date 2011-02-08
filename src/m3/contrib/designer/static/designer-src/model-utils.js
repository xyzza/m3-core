/**
 * Crafted by ZIgi
 */

/**
 * Объект включает в себя набор утилитных функций для преобразования модели во что-то другое
 */
ModelUtils = Ext.apply(Object,{
    /**
     * Возвращает TreeNode по модели
     */
    buildTreeNode:function(model) {
        //Опять же важное замечание - id ноды в дереве компнентов на экране и id модельки равны друг другу
        var iconCls = ModelTypeLibrary.getTypeIconCls(model.attributes.type);
        return new Ext.tree.TreeNode({
                text:model.attributes.properties.id,
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
    *       type:'document',
    *       name:'fofofo',
    *       items:[]
    *   },
    *   deletedModels:[
    *       {
    *           type:'date',
    *           name:'Bla-bla'
    *       }
    *   ] //нужно уведомить сервер о удаленных компонентов
    * }
    */
    buildTransferObject:function(model){
        var result = {};

        var doRecursion = function(model) {
            var node = {};
            node.properties = {};
            Ext.apply(node.properties, model.attributes.properties);
            node.type = model.attributes.type;
            node.id = model.attributes.id;
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