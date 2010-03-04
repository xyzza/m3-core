/* шаблон окна с формой редактирования */
function entry_point(){
    var win = {{ window.render }};
    {# здесь идет код для управления создания store и загрузки значений с сервера #}
    
    {# показываем окно#}
    win.show();
}

entry_point();

{{ renderer.window.render_globals }}