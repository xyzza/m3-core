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
        this.addEvents('load','save','preview', 'loadcode');
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
               className: this.className,
               funcName: this.funcName
            },
            success:this._onSuccessDefault.createDelegate(this, ['load'], true),
            failure:this._onFailureDefault.createDelegate(this)
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
            success:this._onSuccessDefault.createDelegate(this, ['save'], true),
            failure:this._onFailureDefault.createDelegate(this)
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
            success:this._onSuccessDefault.createDelegate(this, ['preview'], true),
            failure:this._onFailureDefault.createDelegate(this)
        });
    },
    uploadCode: function(dataObj){
    	this.mask = new Ext.LoadMask(this.maskEl, {
            msg:'Получаем код...'
        });
        this.mask.show();
    	Ext.Ajax.request({
    	    url:this.uploadCodeUrl,
            params:{
                data: Ext.util.JSON.encode(dataObj) 
            },
            success:this._onSuccessDefault.createDelegate(this, ['loadcode'], true),
            failure:this._onFailureDefault.createDelegate(this),            
    	})
    },    
    _onSuccessDefault:function(response, opts, eventName) {    	
    	this.mask.hide();        
        var obj = Ext.util.JSON.decode(response.responseText);                
        this.fireEvent(eventName, obj);        
    },
    _onFailureDefault:function(response, opts){
        this.mask.hide();
        uiAjaxFailMessage(response, opts);        
    }
});
