(function(){
	{% if component.addr %}
	function getNewAddr(){
    	var place = Ext.getCmp({% if component.place %}'{{ component.place.client_id }}'{% else %}''{% endif %});
		if (place != undefined) {
			place = place.getValue();
		}
		var street = Ext.getCmp({% if component.street %}'{{ component.street.client_id }}'{% else %}''{% endif %});
		if (street != undefined) {
			street = street.getValue();
		}
		var house = Ext.getCmp({% if component.house %}'{{ component.house.client_id }}'{% else %}''{% endif %});
		if (house != undefined) {
			house = house.getValue();
		}
		var flat = Ext.getCmp({% if component.flat %}'{{ component.flat.client_id }}'{% else %}''{% endif %});
		if (flat != undefined) {
			flat = flat.getValue();
		}		
		Ext.Ajax.request({
			url: '{{ component.action_getaddr.absolute_url }}',
			params: Ext.applyIf({ place: place, street: street, house: house, flat: flat, addr_cmp: '{{ component.addr.client_id }}' },{% if component.action_context %}{{component.action_context.json|safe}}{% else %}{}{% endif %}),
			success: function(response, opts){ smart_eval(response.responseText); },
			failure: function(){Ext.Msg.show({title:'', msg: 'Не удалось получить адрес.<br>Причина: сервер временно недоступен.', buttons:Ext.Msg.OK, icon: Ext.Msg.WARNING});}
		});
    };
	function setNewAddr(addr){
		var addr = Ext.getCmp('{{ component.addr.client_id }}');
		if (addr != undefined) {
			addr.value = addr;
		}
	};
	{% endif %}
	var container = new Ext.Container({
		{% include 'base-ext-ui.js'%}
	
		{% if component.layout %} ,layout: '{{ component.layout }}' {% endif %}
		{% if component.layout_config %} ,layoutConfig: {{ component.t_render_layout_config|safe }} {% endif %}
		,items: [{{ component.t_render_items|safe }}]
	});
	{% if component.addr %}
	getNewAddr();
	{% endif %}
	return container;
})()
