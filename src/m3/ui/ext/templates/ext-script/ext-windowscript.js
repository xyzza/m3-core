(function (){
    var win = {{ renderer.window.render }};
    win.show();
    
    {{ renderer.window.render_globals }}
    
    function closeWindow(){ Ext.getCmp('{{window.client_id}}').close(); }
    
    return win;
})()



