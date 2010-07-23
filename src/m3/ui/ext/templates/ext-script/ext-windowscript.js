(function (){
    var win = {{ renderer.window.render|safe }};
    win.show();
    
    {{ renderer.window.render_globals }}
    
    function closeWindow(){ win.close(); }
    
    return win;
})()



