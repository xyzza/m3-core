/**
 * 
 */
function createTreeView(rootNodeName){
	var tree =  new Ext.tree.TreePanel({
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
	        ,text: rootNodeName
	        ,draggable: false
	        ,id: 'source'
	        ,expanded: true					     
	    }
		,contextMenu: new Ext.menu.Menu({
		        items: [{
		            id: 'create-file'
		            ,text: 'Создать файл'
		            ,iconCls: 'icon-script-add'
		        },{
		            id: 'rename-file'
		            ,text: 'Переименовать файл'
		            ,iconCls: 'icon-script-edit'
		        },{
		            id: 'delete-file'
		            ,text: 'Удалить файл'
		            ,iconCls: 'icon-script-delete'
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
		    listeners: {
		        contextmenu: function(node, e) {
		            node.select();	            
		            if (node.text === 'ui.py' || node.text === 'forms.py' ) {
			            var c = node.getOwnerTree().contextMenu;
			            c.contextNode = node;
			            c.showAt(e.getXY());						            	
		            }
	
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
                    }
		        }
		    }	
	})
	
	tree.getLoader().on("beforeload", function(treeLoader, node) {	
    	treeLoader.baseParams['path'] = node.attributes.path;
	}, this);
	
	return tree;
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


function onClickNode(node) {					
	var attr =  node.attributes;	            	
	
	var starter = new Bootstrapper();
	var panel = starter.init({
				dataUrl:'/designer/data',
				saveUrl:'/designer/save',
				path:attr['path'],
				className:attr['class_name'],
                previewUrl:'/designer/preview'});
				   	 
   	panel.setTitle(attr['class_name']); 
	tabPanel.add(panel);
	
	starter.loadModel();
	
	tabPanel.activate(panel);
}

/*Вымогает у сервера некий файл*/
function onClickNodePyFiles(node, fileAttr){
    var path = fileAttr.path;
    var fileName = fileAttr.fileName;

    Ext.Ajax.request({
        url:'/file-content',
        method: 'GET',
        params: {
            path: path
        }
        ,success: function(response, opts){
            var obj = Ext.util.JSON.decode(response.responseText);
            var codeEditor = new M3Designer.code.ExtendedCodeEditor({
                sourceCode : obj.data.file_content
            })

            codeEditor.setTitle(fileName)
            tabPanel.add( codeEditor );
            tabPanel.activate(codeEditor);

            /* async close tab && message */
            var userTakeChoise = true;
            codeEditor.on('beforeclose', function(panel){
                /* findByType вернет список элементов, т.к у нас всего один
                textarea забираем его по индексу */
                var textArea = panel.findByType('textarea')[0];
                if (textArea.isDirty()){
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
                            userTakeChoise = !userTakeChoise;
                        }
                        userTakeChoise = !userTakeChoise;
                    }, textArea.id);

                }
                else userTakeChoise = !userTakeChoise;

                return !userTakeChoise;
                
            })

            codeEditor.on('close_tab', function(tab){
                if (tab) tabPanel.remove(tab);
            })
            codeEditor.on('save', function(fileContent, tab){
                /*Запрос на сохранения изменений */
                Ext.Ajax.request({
                    url:'/file-content/save',
                    params: {
                        path: path,
                        content: fileContent
                    },
                    success: function(response, opts){
                        var obj = Ext.util.JSON.decode(response.responseText);
                        var title = '';
                        var message ='';
                        var icon ='success';
                        if (obj.success)
                            message = 'Изменения были успешно сохранены';
                        else if (!obj.success && obj.error){
                            message = 'Ошибка при сохранении файла';
                            icon = 'warning';
                        }
                        /*Тут будет вывод сообщения*/
                    },
                    failure: uiAjaxFailMessage
                })
            })
        },
        failure: uiAjaxFailMessage
    });
}
