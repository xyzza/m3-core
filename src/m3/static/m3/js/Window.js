/**
 * Окно на базе Ext.Window
 */

Ext.m3.Window = Ext.extend(Ext.Window, {
	/**
	 * Ссылка на родительское окно
	 */
	parentWindow: null
	
	/**
	 * Контекст 
	 */
	,actionContextJson: null
	
	,constructor: function(baseConfig, params){
//		console.log('Ext.m3.Window >>');
//		console.log(baseConfig);
//		console.log(params);
		
		if (params && params.parentWindowID) {
			this.parentWindow = Ext.getCmp(params.parentWindowID);
		}
		
		if (params && params.contextJson){
			this.actionContextJson = params.contextJson;
		}

		Ext.m3.Window.superclass.constructor.call(this, baseConfig);
	}

})


