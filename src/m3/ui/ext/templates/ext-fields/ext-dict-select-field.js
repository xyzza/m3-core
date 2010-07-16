function(){
	var baseConfig = { {{ component.render_base_config|safe }} };
	var params = { {{ component.render_params|safe }} }; 
	
	return createAdvancedComboBox(baseConfig, params);
}()
