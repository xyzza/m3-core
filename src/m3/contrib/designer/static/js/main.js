/**
 * 
 */

var tree = new Ext.tree.TreePanel({
	useArrows: true
    ,autoScroll: true
    ,animate: true    
    ,containerScroll: true
    ,border: false					        
    ,loader: new Ext.tree.TreeLoader({
		url: '/project-files'
	})					
    ,root: {
        nodeType: 'async'
        ,text: 'Файлы проекта'
        ,draggable: false
        ,id: 'source'
        ,expanded: true					     
    }
	,contextMenu: new Ext.menu.Menu({
	        items: [{
	            id: 'open-file',
	            text: 'Открыть файл'
	        }],
	        listeners: {
	            itemclick: function(item, e) {													
					onClickNode( item.parentMenu.contextNode ); 
	            }
	        }
	    }),
	    listeners: {
	        contextmenu: function(node, e) {
	            node.select();	            
	            if (node.parentNode && (node.parentNode.text === 'ui.py' || node.parentNode.node.text === 'forms.py' ) ){
		            var c = node.getOwnerTree().contextMenu;
		            c.contextNode = node;
		            c.showAt(e.getXY());						            	
	            }

	        },
	        dblclick: function(node, e){
	        	onClickNode(node);
	        }
	    }	
})


var tabPanel = new Ext.TabPanel({	
	region: 'center'
    ,xtype: 'tabpanel' 
    ,activeTab: 0
    ,items: [{
    	title: 'Обзор'
		,html: '<iframe src="http://m3.bars-open.ru" width="100%" height="100%" style="border: 0px none;"></iframe>'
    }]	    
});


function onClickNode(node) {					
	var attr =  node.attributes;	            	
	
	var starter = new Bootstrapper();
	var panel = starter.init('/designer/fake', 
				'/designer/save', 
				attr['path'], 
				attr['class_name']);
				   	 
   	panel.setTitle(attr['class_name']); 
	tabPanel.add( panel );
	
	starter.loadModel();
	
	tabPanel.activate(panel);
}


tree.getLoader().on("beforeload", function(treeLoader, node) {	
    treeLoader.baseParams['path'] = node.attributes.path;
}, this);
