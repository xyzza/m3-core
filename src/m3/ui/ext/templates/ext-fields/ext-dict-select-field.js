new Ext.Container({
	layout: 'column',
	items:
		[{
			xtype: 'container',
			layout: 'form',
			items: {
				xtype: 'textfield',
				id: "{{ component.client_id }}",
				name: "{{ component.name }}",
				fieldLabel: "{{ component.label }}",
				value: "{{ component.value }}",
				width: "{{ component.width }}",
				readOnly: true
			}
		},
		{{ component.t_render_select_button|safe }},
		{{ component.t_render_clean_button|safe }}
	]
})
