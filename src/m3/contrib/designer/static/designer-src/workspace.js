/**
 * Crafted by ZIgi
 */

DesignerWorkspace = Ext.extend(Ext.Panel, {

    layout:'border',
    closable:true,

    initComponent: function() {

        DesignerWorkspace.superclass.initComponent.call(this);

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
            useArrows:true,
            flex:1,
            enableDD:true,
            ddGroup:'designerDDGroup',
            animate:false,
            rootVisible:false,
            title:'Дерево компонентов',
            autoScroll: true,
            contextMenu: new Ext.menu.Menu({
                items: [{
                    text: 'Удалить',
                    iconCls:'delete_item',
                    handler: onTreeNodeDeleteClick
                }]
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
            useArrows:true,
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
        this.application = application;

         var storage = new M3Designer.ServerStorage({
            id:0,
            loadUrl:this.dataUrl,
            saveUrl:this.saveUrl,
            pathFile: this.path,
            className: this.className,
            previewUrl:this.previewUrl,
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

        this.add([designPanel,eastWrapper]);
        this.addButton({
            text:'Сохранить',
            iconCls:'icon-disk',
            handler: function() {
                    storage.saveModel(application.getTransferObject());
            }
        });
        this.addButton({
           text:'Предварительный просмотр кода',
            iconCls:'icon-page-white-put',
            handler: function() {
                storage.previewCode(application.getTransferObject());
            }
        });

        storage.on('load', this.onSuccessLoad.createDelegate(this));

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
    },
    saveOnServer:function() {
        this.storage.saveModel(this.application.getTransferObject());
    },
    loadModel: function(){
    	this.storage.loadModel();
    },
    onSuccessLoad: function(jsonObj){    	
		if (jsonObj.success) { 
			if (this.fireEvent('beforeload', jsonObj)){				
				this.application.init(jsonObj.json);	
			}	        	                    
	   	} else {
	   		Ext.Msg.show({
			   title:'Ошибка'
			   ,msg: jsonObj.json
			   ,buttons: Ext.Msg.OK						   						   
			   ,icon: Ext.MessageBox.WARNING
			});
        }                   	
    }
});
