/**
 * Crafted by ZIgi
 */

/**
 * Это просто болванка UI для запуска приложения в черновом варианте.
 */

Bootstrapper = Ext.extend(Object, {
    start:function(dataUrl) {

        var designPanel = new Ext.Panel({
            title:'M3 дизайнер',
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
            title:'Дерево компонентов'
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
            rootVisible:false,
            title:'Инструменты'
        });

        var eastWrapper = new Ext.Panel({
            region:'east',
            width:250,
            //split:true,
            layout:'vbox',
            layoutConfig:{
                align:'stretch'
            },
            items:[componentTree, toolbox]
        });

        new Ext.Viewport({
            layout: 'border',
            items: [
                designPanel, eastWrapper
            ]
	    });
        var storage = new ServerStorage({
            id:0,
            loadUrl:dataUrl,
            maskEl:Ext.getBody()
        });

        //а вот тут настоящее приложение
        var application = new AppController({
            tree:componentTree,
            designPanel:designPanel,
            toolbox:toolbox
        });

        storage.on('load',
                function(jsonObj){
                    application.init(jsonObj);
                });

        storage.loadModel();
    }
});
