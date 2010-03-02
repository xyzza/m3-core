function entry_point(){
    var window = {{ renderer.window.render }};
    
    window.show();
}

entry_point();

{{ renderer.window.render_globals }}