{
	id: '{{ component.client_id }}'
	,xtype: 'datecolumn'
	{%if component.width%} ,width: {{component.width}} {%endif%}
	
	{%if component.header %} ,header: '{{ component.header }}' {%endif%}
	,sortable: {{ component.sortable|lower }}
	{%if component.data_index %} ,dataIndex: '{{ component.data_index }}' {%endif%}
	{%if component.align %} ,align: '{{ component.align }}' {%endif%}
	{%if component.editor %} ,editor: {{ component.render_editor }} {%endif%}
	,fixed: {{ component.fixed|lower }}
	{% if component.format %}, format: '{{ component.format|safe }}' {%endif%}
	{%if component.hidden %} ,hidden: true {%endif%}
	{%if component.column_renderer %} ,renderer: {{ component.column_renderer }}{%endif%}
}