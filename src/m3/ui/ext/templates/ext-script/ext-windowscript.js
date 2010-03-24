(function (){
    var win = {{ renderer.window.render }};
    win.show();
    
    {{ renderer.window.render_globals }}
    
    return win;
})()



