/**
 * Crafted by ZIgi
 */

Ext.namespace('M3Designer');

/**
 * Объект включает в себя набор утилитных функций для преобразования модели во что-то другое
 */
M3Designer.Utils = Ext.apply({},{
    /**
     * Возвращает id модели по id визуального компонента
     * @param {string} domCmpId
     */
    parseModelId:function(domCmpId) {
        return domCmpId.substring(4, domCmpId.length);
    },
    /**
     * Возвращает id DOM element'а по id модели
     * @param {string} modelId
     */
    parseDomId:function(modelId) {
        return 'cmp-'+modelId;
    },
    /**
     * Возвращает id node по id DOM element'а
     * @param {string} domId
     */
    parseDomIdToNodeId:function(domId) {
        // удаляем первые 4 символа из id > "cmp-"
        return domId.slice(4,domId.length)
    },
    /**
     * Востанавливает оригинальные значения перед отправкой на сервер
     * @param {object} obj
     */
    setKladrOriginalValues: function(obj){
        var levelArray = M3Designer.model.ModelTypeLibrary.enumConfig.level;
        var viewModeArray = M3Designer.model.ModelTypeLibrary.enumConfig.viewMode;
        obj.level = levelArray.indexOf(obj.level) + 1;
        obj.viewMode = viewModeArray.indexOf(obj.viewMode) + 1;
    },
    /**
     * Устанавливает человеке читаемые значения
     * @param {object} obj
     */
    setKladrTemporaryValues: function(obj){
        var levelArray = M3Designer.model.ModelTypeLibrary.enumConfig.level;
        var viewModeArray = M3Designer.model.ModelTypeLibrary.enumConfig.viewMode;
        obj.level = levelArray[obj.level-1];
        obj.viewMode = viewModeArray[obj.viewMode-1];
    },

    /**
     * Единый successMessage в виде Notification
     * @param {object} options
     */
    successMessage: function(options){
        var opt = options || {};
        new Ext.ux.Notification({
            title: opt.title ||'Сохранение',
            html: opt.message ||'Изменения были успешно сохранены',
            iconCls: opt.icon ||'icon-accept'
        }).show(document);
    },

    /**
     * Единый failureMessage в виде MessageBox
     * @param {object} options
     */
    failureMessage: function(options){
        var opt = options || {};
        Ext.Msg.show({
            title: opt.title || 'Ошибка'
           ,msg: opt.message || 'Во время выполнения операции произошла ошибка.'
           ,buttons: Ext.Msg.OK
           ,icon: Ext.MessageBox.WARNING
        });
    },
    
    /**
     * Показывает messagebox, о имеющихся изменениях
     * @param {function} fn
     * @param {string} msg
     */
    showMessage: function (fn, msg) {
        Ext.Msg.show({
            title: 'Сохранить изменения?',
            msg: msg ? msg : 'Вы закрываете вкладку, в которой имеются изменения. Хотели бы вы сохранить ваши изменения?',
            buttons: Ext.Msg.YESNOCANCEL,
            fn: fn,
            icon: Ext.MessageBox.QUESTION
        });
    },
    /**
     * Возвращает выделенный узел дерева структуры проекта
     */
    projectViewTreeGetSelectedNode: function(){
        return Ext.getCmp('project-view').getSelectionModel().getSelectedNode();
    }

});