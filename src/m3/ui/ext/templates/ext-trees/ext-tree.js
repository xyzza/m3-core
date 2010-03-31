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
		id: '{{ component.client_id }}'
		{% if component.disabled %} ,disabled: true {% endif %}
		{% if component.hidden %} ,hidden: true {% endif %}
		{% if component.width %} ,width: {{ component.width }} {% endif %}
		{% if component.height %} ,height: {{ component.height }} {% endif %}
		{% if component.html  %} ,html: '{{ component.html|safe }}' {% endif %}
		{% if component.style %} ,style: {{ component.t_render_style|safe }} {% endif %}
		{% if component.x %} ,x: {{ component.x }} {% endif %}
		{% if component.y %} ,y: {{ component.y }} {% endif %}
		{% if component.region %} ,region: '{{ component.region }}' {% endif %}
		{% if component.flex %} ,flex: {{ component.flex }} {% endif %}
		
		{% if component.icon_cls %} ,iconCls: '{{ component.icon_cls }}' {% endif %}
		{% if component.title %} ,title: '{{ component.title }}' {% endif %}
		
	    ,useArrows: true
	    ,autoScroll: true
	    ,animate: true
	    ,enableDD: true
	    ,containerScroll: true
	    ,border: false
		,split: true
		,columns:[{{ component.t_render_columns|safe }}]
		,loader: {{ component.t_render_tree_loader|safe }}	
		,root: new Ext.tree.AsyncTreeNode({
			children: [ {{ component.t_render_nodes|safe }} ]
        })
        {% if component.t_render_listeners %}
			{# Прописываются имеющиеся обработчики #}
			,listeners:{
				{% for k, v in component.t_render_listeners.items %}
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
					{% if not forloop.last %},{% endif %}
			{% endfor%}
		}
		{% endif %}
	});
	
	{# Здесь может быть Ваша реклама! #}
	
	return tree;
}()

