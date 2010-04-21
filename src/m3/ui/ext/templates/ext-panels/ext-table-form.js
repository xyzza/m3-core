new Ext.FormPanel({
	id: '{{ component.client_id }}'
	,title: 'Table Layout'
	
    ,layout:'table'
    ,defaults: {
        // applied to each contained panel
        bodyStyle:'padding:20px',
        
        width:200, 
        height: 200,
        border: false
        
    },
    layoutConfig: {
        // The total column count must be specified here
        columns: 3
    },
    items: [{
        //title: '<p>Cell A content</p>',
        rowspan: 2,
        height: 400,
        
    },{
        title: '<p>Cell B content</p>',
        collapsible  : true,
        colspan: 2,
        width:400,
        layout: 'form',
        items:[{
        	xtype: 'textfield',
        	fieldLabel: '11'
	        
        }]
    },{

    },{
        html: '<p>Cell D content</p>'
    }]

})