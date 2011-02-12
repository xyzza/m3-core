/**
 * Crafted by ZIgi
 */

PyCodeWindow = Ext.extend(Ext.Window, {
    title:'Предварительный просмотр',
    width:600,
    height:500,
    layout:'fit',
    constructor:function(cfg) {
        Ext.apply(this, cfg);
        PropertyWindow.superclass.constructor.call(this);
    },
    initComponent: function() {
        PyCodeWindow.superclass.initComponent.call(this);
    },
    show:function( code ) {
        this.add(
            new Ext.ux.panel.CodeEditor({
                sourceCode:code
            })
        );
        PropertyWindow.superclass.show.call(this);
    }
});