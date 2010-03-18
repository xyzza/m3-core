function(){
	{% for k, v in component.listeners.items %}
		{# Здесь рендерится контекстное меню #}
		{% ifequal k "contextmenu" %}
			var contmenu = {{ v.render }};
		{% endifequal %}
	{% endfor%}
	
	var tree = new Ext.ux.tree.TreeGrid({
		id: '{{ component.client_id}}',
	    useArrows: true,
	    autoScroll: true,
	    animate: true,
	    enableDD: true,
	    containerScroll: true,
	    border: false,
		split: true,
		title: '{{ component.title }}',
		
		columns:[{{ component.render_columns|safe }}],
		loader: {{ component.render_tree_loader|safe }},	
		root: new Ext.tree.AsyncTreeNode({
			children: [ {{ component.render_nodes|safe }} ]
        })
        {% if component.listeners %}
			{# Прописываются имеющиеся обработчики #}
			,listeners:{
				{% for k, v in component.listeners.items %}
					{# Здесь рендерится контекстное меню #}
					{% ifequal k "contextmenu" %}
						contextmenu:
		                    function(node, e){
								node.select();

					            contmenu.contextNode = node;
					            contmenu.showAt(e.getXY());
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

