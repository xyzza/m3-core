/**
 * 
 */
function createTreeView(rootNodeName){
	var tree =  new Ext.tree.TreePanel({
		useArrows: true
		,id:'project-view'
	    ,autoScroll: true
	    ,animate: true    
	    ,containerScroll: true
	    ,border: false
	    ,header: false		        
	    ,loader: new Ext.tree.TreeLoader({
			url: '/project-files'
		})
		,tbar: new Ext.Toolbar({			
            items: [{
            	iconCls: 'icon-script-add'
            	,tooltip:'Создать файл'
            },{
            	iconCls: 'icon-script-edit'
            	,tooltip:'Переименовать файл'
            },{
            	iconCls: 'icon-script-delete'
            	,tooltip:'Удалить файл'
            },{
            	xtype: 'tbseparator'
            },{
            	iconCls: 'icon-arrow-refresh'
            	,tooltip:'Обновить структуру проекта'
            	,handler: function(){
            		var cmp = Ext.getCmp('project-view');
					var loader = cmp.getLoader();
		        	var rootNode = cmp.getRootNode();
		        	loader.load(rootNode);
		        	rootNode.expand();
            	}
            }]        
		})
	    ,root: {
	        nodeType: 'async'
	        ,text: rootNodeName
	        ,draggable: false
	        ,id: 'source'
	        ,expanded: true					     
	    }
		,contextMenu: new Ext.menu.Menu({
                items: [{
		            id: 'edit-file'
		            ,text: 'Редактировать файл'
		            ,iconCls: 'icon-script-lightning'
                    ,handler: function(item, e){}
		        },{
		            id: 'create-file'
		            ,text: 'Создать файл'
		            ,iconCls: 'icon-script-add'
                    ,handler: function(item, e){}
		        },{
		            id: 'rename-file'
		            ,text: 'Переименовать файл'
		            ,iconCls: 'icon-script-edit'
                    ,handler: function(item, e){}
		        },{
		            id: 'delete-file'
		            ,text: 'Удалить файл'
		            ,iconCls: 'icon-script-delete'
                    ,handler: function(item, e){}
		        },'-',{
		        	id: 'create-class'
		            ,text: 'Добавить класс'
		            ,iconCls: 'icon-cog-add'
		            ,handler: function(item, e){

						Ext.MessageBox.prompt('Создание класса',
							'Введите название класса',
							function(btn, text){
								if (btn == 'ok'){
									var node = item.parentMenu.contextNode;
						            var attr = node.attributes;
					            	Ext.Ajax.request({
					            		url:'/create-new-class'
					            		,params: {
					            			path: attr['path']
					            			,className: text
					            		}
					            		,success: function(response, opts){
					            			var obj = Ext.util.JSON.decode(response.responseText);             
					            			if (obj.success) {                
						            			var new_node = new Ext.tree.TreeNode({
						            				text: text
						            				,path: attr['path']
						            				,class_name: text
						            				,iconCls: 'icon-class'	
						            				,leaf: true			            				
						            			});
		
						            			node.appendChild(new_node);
								           	} else {
								           		Ext.Msg.show({
												   title:'Ошибка'
												   ,msg: obj.json
												   ,buttons: Ext.Msg.OK						   						   
												   ,icon: Ext.MessageBox.WARNING
												});
								           	}    

					            		},
					            		failure: uiAjaxFailMessage
					            	});
					            }
							}						
						);
		            }
		        }
		        ]
		    }),
            contextFileMenu: new Ext.menu.Menu({
                items: [{
		            id: 'edit-file1'
		            ,text: 'Редактировать файл'
		            ,iconCls: 'icon-script-lightning'
                    ,handler: function(item, e){}
		        },{
		            id: 'create-file2'
		            ,text: 'Создать файл'
		            ,iconCls: 'icon-script-add'
                    ,handler: function(item, e){}
		        },{
		            id: 'rename-file2'
		            ,text: 'Переименовать файл'
		            ,iconCls: 'icon-script-edit'
                    ,handler: function(item, e){}
		        },{
		            id: 'delete-file2'
		            ,text: 'Удалить файл'
		            ,iconCls: 'icon-script-delete'
                    ,handler: function(item, e){}
		        }]
            }),
            contextDirMenu: new Ext.menu.Menu({
                items: [{
		            id: 'create-file3'
		            ,text: 'Создать файл'
		            ,iconCls: 'icon-script-add'
                    ,handler: function(item, e){}
                },'-',{
		            id: 'create-dir'
		            ,text: 'Создать директорию'
		            ,iconCls: 'icon-folder-add'
                    ,handler: function(item, e){}
		        },{
		            id: 'rename-dir'
		            ,text: 'Переименовать директорию'
		            ,iconCls: 'icon-folder-edit'
                    ,handler: function(item, e){}
		        },{
		            id: 'delete-dir'
		            ,text: 'Удалить директорию'
		            ,iconCls: 'icon-folder-delete'
                    ,handler: function(item, e){}
		        }]
            }),
		    listeners: {
		        contextmenu: function(node, e) {
		            node.select();
                    /* Файл дизайна форм */
		            if (node.text === 'ui.py' || node.text === 'forms.py' ) {
			            var c = node.getOwnerTree().contextMenu;
			            c.contextNode = node;
			            c.showAt(e.getXY());						            	
		            }
                    /* Файл */
                    else if(node.leaf && (node.parentNode.text !== 'ui.py' && node.parentNode.text !== 'forms.py')) {
                        var c = node.getOwnerTree().contextFileMenu;
			            c.contextNode = node;
			            c.showAt(e.getXY());
                    }
                    /* Директория */
                    else if(!node.leaf && (node.parentNode.text !== 'ui.py' && node.parentNode.text !== 'forms.py')) {
                        var c = node.getOwnerTree().contextDirMenu;
			            c.contextNode = node;
			            c.showAt(e.getXY());
                    };
		        },
		        dblclick: function(node, e){
		        	if (node.parentNode && (node.parentNode.text === 'ui.py' || node.parentNode.text === 'forms.py' ) ){
			        	onClickNode(node);
		        	}
                    /*Все файлы не являющиеся *.py и conf */
                    else if(node.text.split('.').slice(-1) == 'py' || node.text.split('.').slice(-1) == 'conf'){
                        var fileAttr = {};
                        fileAttr['path'] = node.attributes.path;
                        fileAttr['fileName'] = node.attributes.text;
                        onClickNodePyFiles(node, fileAttr);
                    };
		        }
		    }
	});
	
	tree.getLoader().on("beforeload", function(treeLoader, node) {	
    	treeLoader.baseParams['path'] = node.attributes.path;
	}, this);
	
	var accordion = new Ext.Panel({
		id:'accordition-view',		   
	    layout:'accordion',	    
	    layoutConfig: {
	        animate: true,
	        collapseFirst: true	        
	    },
	    items: [{
	        title: 'Структура проекта',	 
	        layout: 'fit',       
	        items: [tree]
	    },{
	        title: 'Свойства',
	        id: 'property-panel',
	        layout: 'fit'
	    }]
	});
	
	
	return accordion;
}

var tabPanel = new Ext.TabPanel({
	region: 'center',
    xtype: 'tabpanel',
    activeTab: 0,
    items: [{
    	title: 'Обзор',
        html: '<iframe src="http://m3.bars-open.ru" width="100%" height="100%" style="border: 0px none;"></iframe>'
    }]
});

//Инициируем перехват нажатия ctrl+s для автоматического сохранения на сервер
Ext.fly(document).on('keydown',function(e,t,o){
   if (e.ctrlKey && (e.keyCode == 83)) {// кнопка S
       var tab = tabPanel.getActiveTab();
       if (tab && tab.saveOnServer &&
               (typeof(tab.saveOnServer) == 'function')) {
           tab.saveOnServer();
           e.stopEvent();
       }
   }
});

function onClickNode(node) {					
	var attr =  node.attributes;	            	

    var workspace = new DesignerWorkspace({
        dataUrl:'/designer/data',
        saveUrl:'/designer/save',
        path:attr['path'],
        className:attr['class_name'],
        previewUrl:'/designer/preview'
    });

   	workspace.setTitle(attr['class_name']);
	tabPanel.add(workspace);
	workspace.loadModel();

    tabPanel.activate(workspace);

    // Прослушивает событие "tabchange", вызывает новое событие в дочерней панели
    tabPanel.on('tabchange', function(panel,newTab,currentTab){
        workspace.application.designPanel.fireEvent('tabchanged');
    });
}

/**
 * Вымогает у сервера некий файл
 * @param path - путь к файлу
 * TODO: Сделать callBack'ами Ext.Ajax.request
 */
function onClickNodePyFiles(node, fileAttr){
    var path = fileAttr.path;
    var fileName = fileAttr.fileName;
    /*Запрос содержимого файла по path на сервере*/
    Ext.Ajax.request({
        url:'/file-content',
        method: 'GET',
        params: {
            path: path
        }
        ,success: function(response, opts){
            var obj = Ext.util.JSON.decode(response.responseText);
            var codeEditor = new M3Designer.code.ExtendedCodeEditor({
                sourceCode : obj.data.content
            });

            codeEditor.setTitle(fileName);
            tabPanel.add( codeEditor );
            tabPanel.activate(codeEditor);
        
            initCodeEditorHandlers(codeEditor, path);
        },
        failure: uiAjaxFailMessage
    });
};
/**
 * Иницализация хендлеров codeEditor'а
 * @param codeEditor
 */
function initCodeEditorHandlers(codeEditor, path){
    /* findByType вернет список элементов, т.к у нас всего один
    textarea забираем его по индексу */
    var textArea = codeEditor.findByType('textarea')[0];

    /* async close tab && message */
    var userTakeChoice = true;

    /* Хендлер на событие перед закрытием */
    codeEditor.on('beforeclose', function(){
        if (codeEditor.contentChanged){
            var scope = this;
            this.showMessage(function(buttonId){
                if (buttonId=='yes') {
                   scope.onSave();
                   scope.fireEvent('close_tab', scope);
                }
                else if (buttonId=='no') {
                   scope.fireEvent('close_tab', scope);
                }
                else if (buttonId=='cancel') {
                    userTakeChoice = !userTakeChoice;
                }
                userTakeChoice = !userTakeChoice;
            }, textArea.id);
        }
        else userTakeChoice = !userTakeChoice;
        return !userTakeChoice;
    });

    /* Хендлер на событие закрытие таба таб панели */
    codeEditor.on('close_tab', function(tab){
        if (tab) tabPanel.remove(tab);
    });

    /* Хендлер на событие сохранения */
    codeEditor.on('save', function(){
        /*Запрос на сохранения изменений */
        Ext.Ajax.request({
            url:'/file-content/save',
            params: {
                path: path,
                content: codeEditor.codeMirrorEditor.getCode()
            },
            success: function(response, opts){
                var obj = Ext.util.JSON.decode(response.responseText);
                var title = 'Сохранение';
                var message ='';
                var icon = Ext.Msg.INFO;
                if (obj.success)
                    message = 'Изменения были успешно сохранены';
                else if (!obj.success && obj.error){
                    message = 'Ошибка при сохранении файла\n'+obj.error;
                    icon = Ext.MessageBox.WARNING;
                };
                 Ext.Msg.show({
                    title: title,
                    msg: message,
                    buttons: Ext.Msg.OK,
                    animEl: codeEditor.id,
                    icon: icon
                 });
                codeEditor.contentChanged = false;
                codeEditor.onChange();
            },
            failure: uiAjaxFailMessage
        });
    });

    /* Хендлер на событие обновление */
    codeEditor.on('update', function(){
        var scope = this;
        /*Запрос на обновление */
        Ext.Ajax.request({
            url:'/file-content',
            method: 'GET',
            params: {
                path: path
            },
            success: function(response, opts){
                var obj = Ext.util.JSON.decode(response.responseText);
                if (codeEditor.contentChanged){
                    var msg = 'Хотели бы вы сохранить ваши изменения?';
                    codeEditor.showMessage(function(buttonId){
                        if (buttonId=='yes') {
                           scope.onSave(function(){
                               codeEditor.codeMirrorEditor.setCode(obj.data.content);
                               codeEditor.contentChanged = false;
                           });
                        }
                        else if (buttonId=='no') {
                           codeEditor.codeMirrorEditor.setCode(obj.data.content, function(){
                               codeEditor.contentChanged = false;
                           });
                        }
                        else if (buttonId=='cancel') {
                            userTakeChoice = !userTakeChoice;
                        }
                        userTakeChoice = !userTakeChoice;
                    }, textArea.id, msg);
                    codeEditor.onChange();
                }
                else userTakeChoice = !userTakeChoice;
                return !userTakeChoice;
            },
            failure: uiAjaxFailMessage
        });
    });
};