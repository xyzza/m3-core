/**
 * Crafted by ZIgi
 */

Ext.namespace('M3Designer');

/**
 * Объект включает в себя набор утилитных функций для преобразования модели во что-то другое
 */
M3Designer.Utils = Ext.apply({},{
    /*
    * Возвращает id модели по id визуального компонента
     */
    parseModelId:function(domCmpId) {
        return domCmpId.substring(4, domCmpId.length);
    },
    /*
    * Возвращает id DOM element'а по id модели
     */
    parseDomId:function(modelId) {
        return 'cmp-'+modelId;
    },
    /*
    * Возвращает id node по id DOM element'а
     */
    parseDomIdToNodeId:function(domId) {
        // удаляем первые 4 символа из id > "cmp-"
        return domId.slice(4,domId.length)
    },
    /* Востанавливает оригинальные значения перед отправкой на сервер */
    setKladrOriginalValues: function(obj){
        var levelArray = M3Designer.model.ModelTypeLibrary.enumConfig.level;
        var viewModeArray = M3Designer.model.ModelTypeLibrary.enumConfig.viewMode;
        obj.level = levelArray.indexOf(obj.level) + 1;
        obj.viewMode = viewModeArray.indexOf(obj.viewMode) + 1;
    },
    /* Устанавливает человеке читаемые значения */
    setKladrTemporaryValues: function(obj){
        var levelArray = M3Designer.model.ModelTypeLibrary.enumConfig.level;
        var viewModeArray = M3Designer.model.ModelTypeLibrary.enumConfig.viewMode;
        obj.level = levelArray[obj.level-1];
        obj.viewMode = viewModeArray[obj.viewMode-1];
    }
});