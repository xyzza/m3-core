new Ext.form.Label({
	{% include 'base-ext-ui.js'%}
	
	{% if component.text %},fieldLabel:'{{ component.text}}'  {% endif %}   
})