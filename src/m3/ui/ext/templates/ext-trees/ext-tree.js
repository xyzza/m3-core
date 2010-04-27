function(){
	{% for k, v in component.t_render_listeners.items %}
		{# Здесь рендерится контекстное меню #}
		{% ifequal k "contextmenu" %}
			var contmenu = {{ v.render }};
		{% endifequal %}
		{% ifequal k "containercontextmenu" %}
			var container_contmenu = {{ v.render }};
		{% endifequal %}
	{% endfor%}
	
	var tree = new Ext.ux.tree.TreeGrid({
		{% include 'base-ext-ui.js'%}
		
		{% if component.icon_cls %} ,iconCls: '{{ component.icon_cls }}' {% endif %}
		{% if component.title %} ,title: '{{ component.title }}' {% endif %}
		{% if component.top_bar %} ,tbar: {{ component.t_render_top_bar|safe }} {% endif %}
		{% if component.buttom_bar %} ,bbar: {{ component.t_render_buttom_bar|safe }} {% endif %}
		{% if component.footer_bar %} ,fbar: {{ component.t_render_footer_bar|safe }} {% endif %}
		
	    ,useArrows: true
	    ,autoScroll: true
	    ,animate: true
	    ,enableDD: true
	    //,containerScroll: true
	    //,border: false
		,split: true
		,columns:[{{ component.t_render_columns|safe }}]
		,loader: {{ component.t_render_tree_loader|safe }}	
		,rootVisible: false
		,root: new Ext.tree.AsyncTreeNode({
			id: '-1'
			{%if self.nodes %},children: [ {{ component.t_render_nodes|safe }} ] {%endif%}
        })
        {% if component.t_render_listeners %}
			{# Прописываются имеющиеся обработчики #}
			,listeners:{
				{% for k, v in component.t_render_listeners.items %}
					{% if not forloop.first%},{%endif%}
				
					{# Здесь рендерится контекстное меню #}
					{% ifequal k "contextmenu" %}
						contextmenu:
		                    function(node, e){
								node.select();
					            contmenu.contextNode = node;
					            contmenu.showAt(e.getXY());
		                    }
					{% endifequal %}  
					{% ifequal k "containercontextmenu" %}
						containercontextmenu:
		                    function(tree, e){
								e.stopEvent();
					            container_contmenu.showAt(e.getXY());
		                    }
					{% endifequal %}  
					{% ifequal k "click" %}
						'{{k}}': {{v}}
					{% endifequal %}  
			{% endfor%}
		}
		{% endif %}
	});
	
	{# Здесь может быть Ваша реклама! #}
	
	return tree;
}()

