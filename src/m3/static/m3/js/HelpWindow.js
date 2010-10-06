/**
 * Окно показа контекстной помощи
 */

Ext.m3.HelpWindow = Ext.extend(Ext.Window, {
    constructor: function(baseConfig, params){
        this.title = 'Справочная информация';
        this.maximized = true;
        this.maximizable = true;
        this.minimizable = true;
        this.width=800;
        this.height=550;
        
        /*
        this.items = [{
            xtype: 'box',
            autoEl: {
                tag: 'iframe',
                width: '100%',
                height: '100%',
                src: 'http://127.0.0.1:90'
            }
        }]*/  
    
    Ext.m3.HelpWindow.superclass.constructor.call(this, baseConfig);
  }
});

function showHelpWindow(url){
    /*var help_window = new Ext.m3.HelpWindow();
    
    if (typeof AppDesktop != 'undefined' && AppDesktop){
        AppDesktop.getDesktop().createWindow(help_window);
    }
    
    help_window.show();*/
    
    window.open(url);
}
