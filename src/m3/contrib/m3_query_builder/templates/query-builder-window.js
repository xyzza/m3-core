/**
 * User: kirs
 * Date: 02.06.11
 * Time: 13:49
 */


/*Выбор связи*/
function selectConnection(){
    var loadMask = new Ext.LoadMask(win.body);
    loadMask.show();
    debugger;
    Ext.Ajax.request({
        url: '{{component.params.select_connections_url}}'
        ,success: function(response){
            loadMask.hide();
            smart_eval(response.responseText);
        }
        ,failure: function(){
        	loadMask.hide();
            uiAjaxFailMessage.apply(this, arguments);
        }
    });
};

/*Удаление связи*/
function deleteConnection(){
    
}
/*Закрытие окна*/
function winClose(){
    win.close();
}