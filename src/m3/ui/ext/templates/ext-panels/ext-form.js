
(function(){
    var form_panel = new Ext.FormPanel({
    	{% include 'base-ext-ui.js'%}
		
    	{% if component.url %} ,url: '{{ component.url }}' {% endif %}
    	
    	{% if component.layout %} ,layout: '{{ component.layout }}' {% endif %}
    	{% if component.layout_config %} ,layoutConfig: {{ component.t_render_layout_config|safe }} {% endif %}
    	
    	{% if component.icon_cls %} ,iconCls: '{{ component.icon_cls }}' {% endif %}
    	{% if component.title %} 
    		,title: '{{ component.title }}' 
    		,header: true
    	{% else %}
    		,header: false
    	{% endif %}
		, fileUpload: {% if component.file_upload %} true {% else %} false {% endif %}
    	{% if component.top_bar %} ,tbar: {{ component.t_render_top_bar|safe }} {% endif %}
    	{% if component.buttom_bar %} ,bbar: {{ component.t_render_buttom_bar|safe }} {% endif %}
    	{% if component.footer_bar %} ,fbar: {{ component.t_render_footer_bar|safe }} {% endif %}
     	,baseCls: 'x-plain'
        ,items: [{{ component.t_render_items|safe }}]
    });
    {% if component.focused_field %}
	form_panel.on('afterrender', function(){
		Ext.getCmp('{{ component.focused_field.client_id}}').focus();
	});
	
	Ext.getCmp('{{ component.focused_field.client_id}}').focus(false, 1000);
	{% endif %}
    return form_panel;
})()