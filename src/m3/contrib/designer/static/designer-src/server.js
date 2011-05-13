/**
 * Crafted by ZIgi
 */
Ext.namespace('M3Designer');

/**
 * @class M3Designer.ServerStorage
 * Класс для обмена данными с сервером
 */
M3Designer.ServerStorage = Ext.extend(Ext.util.Observable, {
    /**
     * @constructor
     * @cfg {string} loadUrl
     * @cfg {string} saveUrl
     * @cfg {string} previewUrl
     * @cfg {Ext.Element} maskEl - куда вешать маску. Ext.getBody() например
     */
    constructor: function (cfg) {
        Ext.apply(this, cfg);
        M3Designer.ServerStorage.superclass.constructor.call(this);
        this.addEvents('load', 'save', 'preview', 'loadcode');
    },

    loadModel: function () {
        this.mask = new Ext.LoadMask(this.maskEl, {
            msg: 'Загрузка данных...'
        });
        this.mask.show();
        Ext.Ajax.request({
            url: this.loadUrl,
            //TODO поставить POST!
            method: 'GET',
            params: {
                path: this.pathFile,
                className: this.className,
                funcName: this.funcName
            },
            success: this.onSuccessDefault.createDelegate(this, ['load'], true),
            failure: this.onFailureDefault.createDelegate(this)
        });
    },

    saveModel: function (dataObj) {
        this.mask = new Ext.LoadMask(this.maskEl, {
            msg: 'Сохранение данных...'
        });
        this.mask.show();
        Ext.Ajax.request({
            url: this.saveUrl,
            params: {
                id: this.id,
                data: Ext.util.JSON.encode(dataObj),
                path: this.pathFile,
                className: this.className,
                funcName: this.funcName
            },
            success: this.onSuccessDefault.createDelegate(this, ['save'], true),
            failure: this.onFailureDefault.createDelegate(this)
        });
    },

    previewCode: function (dataObj) {
        this.mask = new Ext.LoadMask(this.maskEl, {
            msg: 'Получаем код...'
        });
        this.mask.show();
        Ext.Ajax.request({
            url: this.previewUrl,
            params: {
                data: Ext.util.JSON.encode(dataObj)
            },
            success: this.onSuccessDefault.createDelegate(this, ['preview'], true),
            failure: this.onFailureDefault.createDelegate(this)
        });
    },

    uploadCode: function (dataObj) {
        this.mask = new Ext.LoadMask(this.maskEl, {
            msg: 'Получаем код...'
        });
        this.mask.show();
        Ext.Ajax.request({
            url: this.uploadCodeUrl,
            params: {
                data: Ext.util.JSON.encode(dataObj)
            },
            success: this.onSuccessDefault.createDelegate(this, ['loadcode'], true),
            failure: this.onFailureDefault.createDelegate(this)
        });
    },

    onSuccessDefault: function (response, opts, eventName) {
        this.mask.hide();
        var obj = Ext.util.JSON.decode(response.responseText);
        this.fireEvent(eventName, obj);
    },

    onFailureDefault: function (response, opts) {
        this.mask.hide();
        if (window.uiAjaxFailMessage) { //функция в наборе скриптов М3 для вывода серверного стектрейса
            window.uiAjaxFailMessage(response, opts);
        } else {
            Ext.MessageBox.alert('Ошибка', 'Произошла непредвиденная ошибка. Обратитесь к разработчикам');
        }
    }
});