function contextMenu_ShowDependencies(){
    alert('Показываем зависимости плагина');
}

function restartApplicationServer(){
    Ext.Msg.show({
        title: 'Управление сервером приложений',
        msg: 'Вы действительно хотите выполнить перезагрузку сервера приложений?',
        buttons: Ext.Msg.YESNO,
        fn: function(btn, text){
            if (btn == 'yes'){
                Ext.Ajax.request({
                    url: '{{window.action_restart_server.absolute_url}}',
                    timeout: 5000,
                });
            }   
        },
        icon: Ext.Msg.WARNING
    });
}

function contextMenuAllPluginsOpen(context_menu){
    //alert('we are about to show component');
}

function contextMenuActivatePlugin(){
    var grid = Ext.getCmp('{{window.grid_plugins.client_id}}');
    Ext.Ajax.request({
        url: '{{window.activate_plugin_action.absolute_url}}',
        params: {plugin_name: grid.getSelectionModel().getSelected().get('name')},
        success: function(response, opt){
            smart_eval(response.responseText);
            grid.refreshStore();
        },
        failure: Ext.emptyFn
    });
}

function contextMenuDeactivatePlugin(){
    var grid = Ext.getCmp('{{window.grid_plugins.client_id}}');
    Ext.Ajax.request({
        url: '{{window.deactivate_plugin_action.absolute_url}}',
        params: {plugin_name: grid.getSelectionModel().getSelected().get('name')},
        success: function(response, opt){
            smart_eval(response.responseText);
            grid.refreshStore();
        },
        failure: Ext.emptyFn
    });
}
