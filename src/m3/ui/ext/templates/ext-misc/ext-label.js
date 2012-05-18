new Ext3.form.Label({
	{% include 'base-ext-ui.js'%}
	
	{% if component.text %},text:'{{ component.text}}'  {% endif %}   
})