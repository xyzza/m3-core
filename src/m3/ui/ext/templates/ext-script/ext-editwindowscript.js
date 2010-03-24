/* шаблон окна с формой редактирования */
(function (){
    var win = {{ window.render }};
    {# здесь идет код для управления создания store и загрузки значений с сервера #}
    
    {# показываем окно#}
    win.show();
    
    {{ renderer.window.render_globals }}
    
    return win;
})()

