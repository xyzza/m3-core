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
            //params:{
            //    id:this.id
            //},
            success:this._onLoadSuccess.createDelegate(this),
            failure:this._onLoadFailure.createDelegate(this)
        });
    },
    saveModel:function(){
        // Not implemented yet
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
    }
});
