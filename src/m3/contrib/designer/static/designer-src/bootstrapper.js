/**
 * Crafted by ZIgi
 */

/**
 * Это просто болванка UI для запуска приложения в черновом варианте.
 */

Bootstrapper = Ext.extend(Object, {
    init: function(cfg) {

        var designPanel = new Ext.Panel({
            layout:'fit',
            region:'center',
            ddGroup:'designerDDGroup'
        });

        var componentTree = new Ext.tree.TreePanel({
            root: new Ext.tree.TreeNode({
                text:'foo',
                id:'root',
                expanded:true
            }),
            flex:1,
            enableDD:true,
            ddGroup:'designerDDGroup',
            animate:false,
            rootVisible:false,
            title:'Дерево компонентов',
            autoScroll: true,
            contextMenu: new Ext.menu.Menu({
                items: [{
                    id: 'delete-node',
                    text: 'Удалить',
                    iconCls:'delete_item'
                }],
                listeners: {
                    itemclick: function(item) {
                        switch (item.id) {
                            case 'delete-node':
                                  onTreeNodeDeleteClick(item);
                                break;
                        }
                    }
                }
            }),
            listeners: {
                contextmenu: function(node, e) {
                    node.select();
                    var c = node.getOwnerTree().contextMenu;
                    c.contextNode = node;
                    c.showAt(e.getXY());
                }
            }
        });

        var toolbox = new Ext.tree.TreePanel({
            root: new Ext.tree.TreeNode({
                text:'foo',
                id:'root'
            }),
            flex:1,
            ddGroup:'designerDDGroup',
            enableDD:true,
            animate:false,
            autoScroll: true,
            rootVisible:false,
            title:'Инструменты'
        });

        var application = new M3Designer.controller.AppController({
            tree:componentTree,
            designPanel:designPanel,
            toolbox:toolbox
        });

         var storage = new M3Designer.ServerStorage({
            id:0,
            loadUrl:cfg.dataUrl,
            saveUrl:cfg.saveUrl,
            pathFile: cfg.path,
            className: cfg.className,
            previewUrl:cfg.previewUrl, 
            maskEl:Ext.getBody()
        });
		this.storage = storage;

        var eastWrapper = new Ext.Panel({
            region:'east',
            width:250,
            split:true,
            layout:'vbox',
            layoutConfig:{
                align:'stretch'
            },
            items:[componentTree, toolbox]
        });

        var viewportWrapper = new Ext.Panel({
            layout:'border',
            closable: true,
            items: [
                designPanel, eastWrapper
            ],
            buttons:[
                new Ext.Button({
                    text:'Сохранить',
                    iconCls:'icon-disk',
                    handler: function() {
                            storage.saveModel(application.getTransferObject());
                    }
                }),
                new Ext.Button({
                    text:'Предварительный просмотр кода',
                    iconCls:'icon-page-white-put',
                    handler: function() {
                        storage.previewCode(application.getTransferObject());
                    }
                })
            ]
        });

        storage.on('load',
                function(jsonObj){
                	if (jsonObj.success) { 
	                    application.init(jsonObj.json);	                    
                   	} else {
                   		Ext.Msg.show({
						   title:'Ошибка'
						   ,msg: jsonObj.json
						   ,buttons: Ext.Msg.OK						   						   
						   ,icon: Ext.MessageBox.WARNING
						});
                   	}                   	
                });

        storage.on('save', function(jsonObj) {
	        if (jsonObj.success) {                
                Ext.Msg.show({
				   title:'Сохранение формы'
				   ,msg: 'Данные успешно сохранены'
				   ,buttons: Ext.Msg.OK						   						   
				   ,icon: Ext.MessageBox.INFO
				});
           	} else {
           		Ext.Msg.show({
				   title:'Ошибка'
				   ,msg: jsonObj.json
				   ,buttons: Ext.Msg.OK						   						   
				   ,icon: Ext.MessageBox.WARNING
				});
           	}                 
        });        

        storage.on('preview', function(jsonObj) {
        	if (jsonObj.success) {                
           		var previewWindow = new M3Designer.code.PyCodeWindow();
            	previewWindow.show(jsonObj.json);
           	} else {
           		Ext.Msg.show({
				   title:'Ошибка'
				   ,msg: jsonObj.json
				   ,buttons: Ext.Msg.OK						   						   
				   ,icon: Ext.MessageBox.WARNING
				});
           	}     
           	

        });

        function onTreeNodeDeleteClick(item) {
            application.onComponentTreeNodeDeleteClick(item.parentMenu.contextNode);
        }              
        
        return viewportWrapper;  
    },
    loadModel: function(){
    	this.storage.loadModel();
    }
});
