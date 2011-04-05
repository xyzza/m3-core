/**
 * Crafted by ZIgi
 */

/**
 * Объект для обмена данными с сервером
 * cfg = {
 *  id:507 - id документа
 *  loadUrl:'foo.bar',  - url для загрузки данных
 *  saveUrl:'foo.bar', - url для сохранения данных
 *  maskEl: Ext.getBody() - элемент куда вешать маску
 * }
 */

ServerStorage = Ext.extend(Ext.util.Observable, {

    constructor: function(cfg){
        Ext.apply(this, cfg);
        ServerStorage.superclass.constructor.call(this);
        this.addEvents('load');
    },
    loadModel:function(){
        this.mask = new Ext.LoadMask(this.maskEl, {
            msg:'Загрузка данных...'
        });
        this.mask.show();
        Ext.Ajax.request({
            url:this.loadUrl,
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
    _onLoadSuccess:function(response, opts) {
        var obj = Ext.util.JSON.decode(response.responseText);
        this.mask.hide();
        this.fireEvent('load', obj);
    },
    _onLoadFailure:function(response, opts){
        this.mask.hide();
        uiAjaxFailMessage(response, opts);
        //Ext.Msg.alert('Ошибка','Произошла ошибка при формировании данных документа');
    },
    _onSaveSuccess:function(response, opts) {
        this.mask.hide();
        this.fireEvent('save');
    },
    _onSaveFailure:function(response, opts) {
        this.mask.hide();
        uiAjaxFailMessage(response,opts);
    }
});
