/**
 * 
 */

Ext.onReady(function(){
	new Ext.Viewport({
		title: 'Дизайнер UI m3'
	    ,layout: 'border'
	    ,items: [{
	        region: 'north'
	        ,title: 'Дизайнер UI m3'
	        ,autoHeight: true
	        ,border: false
	        ,margins: '0 0 5 0'
	    }, {
	        region: 'west'
	        ,collapsible: true
	        ,title: 'Project Viewer'
	        ,split: true
	        ,width: 200
	        ,maxWidth: 300
	        ,minWidth: 200
	        ,layout: 'fit'     
	        ,items: [new Ext.tree.TreePanel({
	        	    	useArrows: true
					    ,autoScroll: true
					    ,animate: true
					    //,enableDD: true
					    ,containerScroll: true
					    ,border: false					    
					    ,dataUrl: '/project-files'					
					    ,root: {
					        nodeType: 'async'
					        ,text: 'Файлы проекта'
					        ,draggable: false
					        ,id: 'source'
					        ,expanded: true
					        //,hidden: true
					    }
						,contextMenu: new Ext.menu.Menu({
						        items: [{
						            id: 'open-file',
						            text: 'Открыть файл'
						        }],
						        listeners: {
						            itemclick: function(item) {
						                window.open('/designer');
						            }
						        }
						    }),
						    listeners: {
						        contextmenu: function(node, e) {
						            node.select();
						            if (node.text === 'ui.py' || node.text === 'form.py') {
							            var c = node.getOwnerTree().contextMenu;
							            c.contextNode = node;
							            c.showAt(e.getXY());						            	
						            }

						        }
						    }	
	        })]
	    }, {
	        region: 'center'
	        ,xtype: 'tabpanel' 
	        ,activeTab: 0
	        ,items: {
	            title: 'Обзор'
	            ,html: '<iframe src="http://m3.bars-open.ru" width="100%" height="100%" style="border: 0px none;"></iframe>'
	        }
	    }]
	});
})
