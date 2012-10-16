/**
 * Окно на базе Ext3.Window
 */

Ext3.m3.Window = Ext3.extend(Ext3.Window, {
	constructor: function(baseConfig, params){

		// Ссылка на родительское окно
		this.parentWindow = null;
		
		// Контекст
		this.actionContextJson = null;
		
		if (params && params.parentWindowID) {
			this.parentWindow = Ext3.getCmp(params.parentWindowID);
		}
		
        if (params && params.helpTopic) {
            this.m3HelpTopic = params.helpTopic;
        }
    
		if (params && params.contextJson){
			this.actionContextJson = params.contextJson;
		}
    
        // на F1 что-то нормально не вешается обработчик..
        //this.keys = {key: 112, fn: function(k,e){e.stopEvent();console.log('f1 pressed');}}
    
		Ext3.m3.Window.superclass.constructor.call(this, baseConfig);
	},
    initTools: function() {
        if (this.m3HelpTopic) {
            var m3HelpTopic = this.m3HelpTopic;
            this.addTool({id: 'help', handler:function(){ showHelpWindow(m3HelpTopic);}});
        }
        Ext3.m3.Window.superclass.initTools.call(this);
    }
})


