/**
 * 
 */

Ext.onReady(function(){
	new Ext.Viewport({
		title: 'Дизайнер UI m3',
	    layout: 'border',
	    items: [{
	        region: 'north',
	        title: 'Дизайнер UI m3',
	        autoHeight: true,
	        border: false,
	        margins: '0 0 5 0'
	    }, {
	        region: 'west',
	        collapsible: true,
	        title: 'Project Viewer',
	        split: true,
	        width: 200,
	        maxWidth: 300,
	        minWidth: 200        
	    }, {
	        region: 'south',
	        title: 'Панель информации',
	        collapsible: true,
	        html: 'Здесь куча дополнительной информации',
	        split: true,
	        height: 100,
	        minHeight: 100
	    }, {
	        region: 'center',
	        xtype: 'tabpanel', 
	        activeTab: 0,
	        items: {
	            title: 'Обзор',
	            html: '<iframe src="http://google.com/linux" width="100%" height="100%" style="border: 0px none;"></iframe>'
	        }
	    }]
	});
})
