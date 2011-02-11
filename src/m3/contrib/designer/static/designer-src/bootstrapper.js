/**
 * Crafted by ZIgi
 */

/**
 * Это просто болванка UI для запуска приложения в черновом варианте.
 */

Bootstrapper = Ext.extend(Object, {
    init: function(dataUrl, saveUrl, path, className) {

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

        var application = new AppController({
            tree:componentTree,
            designPanel:designPanel,
            toolbox:toolbox
        });

         var storage = new ServerStorage({
            id:0,
            loadUrl:dataUrl,
            saveUrl:saveUrl,
            pathFile: path,
            className: className,
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
                    text:'Отмена',
                    iconCls:'icon-cancel'
                })
            ]
        });

        storage.on('load',
                function(jsonObj){
                    application.init(jsonObj);
                });

        storage.on('save', function() {
            Ext.Msg.alert('Сохранение формы','Данные успешно сохранены');
        });        

        function onTreeNodeDeleteClick(item) {
            application.onTreeNodeDeleteClick(item.parentMenu.contextNode);
        }              
        
        return viewportWrapper;  
    },
    loadModel: function(){
    	this.storage.loadModel();
    }
});
