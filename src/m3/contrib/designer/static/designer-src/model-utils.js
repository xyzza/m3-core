/**
 * Crafted by ZIgi
 */

/**
 * Объект включает в себя набор утилитных функций для преобразования модели во что-то другое
 */
ModelUtils = Ext.apply({},{
    /*
    * Возвращает id модели по id визуального компонента
     */
    parseModelId:function(cmpId) {
        return cmpId.substring(4, cmpId.length);
    },
    /**
     * Возвращает TreeNode по модели
     */
    buildTreeNode:function(model) {
        //Опять же важное замечание - id ноды в дереве компнентов на экране и id модельки равны друг другу
        var iconCls = ModelTypeLibrary.getTypeIconCls(model.attributes.type);
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