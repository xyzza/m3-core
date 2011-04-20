/**
 * Crafted by ZIgi
 */

Ext.namespace('M3Designer');

/**
 * Объект для обмена данными с сервером
 * cfg = {
 *  id:507 - id документа
 *  loadUrl:'foo.bar',  - url для загрузки данных
 *  saveUrl:'foo.bar', - url для сохранения данных
 *  previewUrl:'foo.bar' - url возвращающий py код
 *  maskEl: Ext.getBody() - элемент куда вешать маску
 * }
 */

M3Designer.ServerStorage = Ext.extend(Ext.util.Observable, {

    constructor: function(cfg){
        Ext.apply(this, cfg);
        M3Designer.ServerStorage.superclass.constructor.call(this);
        this.addEvents('load','save','preview');
    },
    loadModel:function(){
        this.mask = new Ext.LoadMask(this.maskEl, {
            msg:'Загрузка данных...'
        });
        this.mask.show();
        Ext.Ajax.request({
            url:this.loadUrl,
            //TODO поставить POST!
            method:'GET',
            params:{
               path: this.pathFile,
               className: this.className
            },
            success:this._onLoadSuccess.createDelegate(this),
            failure:this._onLoadFailure.createDelegate(this)
        });
    },
    saveModel:function(dataObj){
        this.mask = new Ext.LoadMask(this.maskEl, {
            msg:'Сохранение данных...'
        });
        this.mask.show();
        Ext.Ajax.request({
            url:this.saveUrl,
            params:{
                id:this.id,
                data:Ext.util.JSON.encode( dataObj ),
                path: this.pathFile,
                className: this.className
            },
            success:this._onSaveSuccess.createDelegate(this),
            failure:this._onSaveFailure.createDelegate(this)
        });
    },
    previewCode:function(dataObj) {
        this.mask = new Ext.LoadMask(this.maskEl, {
            msg:'Получаем код...'
        });
        this.mask.show();
        Ext.Ajax.request({
            url:this.previewUrl,
            params:{
                data:Ext.util.JSON.encode( dataObj )
            },
            success:this._onPreviewSuccess.createDelegate(this),
            failure:this._onPreviewFailure.createDelegate(this)
        });
    },
    _onLoadSuccess:function(response, opts) {    	
    	this.mask.hide();        
        var obj = Ext.util.JSON.decode(response.responseText);                
        this.fireEvent('load', obj);        
    },
    _onLoadFailure:function(response, opts){
        this.mask.hide();
        uiAjaxFailMessage(response, opts);
        //Ext.Msg.alert('Ошибка','Произошла ошибка при формировании данных документа');
    },
    _onSaveSuccess:function(response, opts) {
        this.mask.hide();
        var obj = Ext.util.JSON.decode(response.responseText);
        this.fireEvent('save', obj);
    },
    _onSaveFailure:function(response, opts) {
        this.mask.hide();
        uiAjaxFailMessage(response,opts);
    },
    _onPreviewSuccess:function(response, opts) {
        this.mask.hide();
        var obj = Ext.util.JSON.decode(response.responseText);
        this.fireEvent('preview', obj);
    },
    _onPreviewFailure:function(response, opts) {
        this.mask.hide();
        uiAjaxFailMessage(response,opts);
    }

});
