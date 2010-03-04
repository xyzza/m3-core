function entry_point(){
    var win = {{ renderer.window.render }};
    
    win.show();
}

entry_point();

{{ renderer.window.render_globals }}