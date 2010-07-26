/**
 * Окно на базе Ext.Window
 */

Ext.m3.Window = Ext.extend(Ext.Window, {
	parentWindow: null
	
	,constructor: function(baseConfig, params){
//		console.log('Ext.m3.Window >>');
//		console.log(baseConfig);
//		console.log(params);
		
		if (params && params.parentWindowID) {
			this.parentWindow = Ext.getCmp(params.parentWindowID);
		}

		Ext.m3.Window.superclass.constructor.call(this, baseConfig);
	}

})


