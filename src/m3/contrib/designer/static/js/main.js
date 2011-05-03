/* Переменные манипуляций с Файловой Сиситемы */
var typeFile = 'file';
var typeDir = 'dir';
var actionDelete = 'delete';
var actionRename = 'rename';
var actionNew = 'new';

/* Переменные манипуляций в дереве структуры проекта */
var fileForms = 'forms.py'
var fileUi = 'ui.py'
var filePython = 'py'
var fileConf = 'conf'

/**
 * Адаптер
 * @param fn - Функция
 */
function toolBarFuncWraper(fn){
    var cmp = Ext.getCmp('project-view');
    var selectedNode = cmp.getSelectionModel().getSelectedNode();
    if (selectedNode){
        fn(selectedNode, true);
    }
    else{
        Ext.Msg.show({
        title: 'Информация',
        msg: 'Для выполнения действия необходимо выделить узел дерева',
        buttons: Ext.Msg.OK,
        icon: Ext.Msg.INFO
    });
    };
};

/**
 * Создает класс в файлах форм дизайнера
 * @param node
 * @param e
 */
function createClass(node,e){
    Ext.MessageBox.prompt('Создание класса',
        'Введите название класса',
        function(btn, text){
            if (btn == 'ok'){
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
                        };

                    },
                    failure: uiAjaxFailMessage
                });
            };
        }
    );
};

/**
 * Дерево структуры проекта 
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
            	iconCls: 'icon-script-add',
            	tooltip:'Создать файл',
                handler: function(item, e){toolBarFuncWraper(newTarget)}
            },{
            	iconCls: 'icon-script-edit',
            	tooltip:'Переименовать файл',
                handler: function(item, e){toolBarFuncWraper(renameTarget)}
            },{
            	iconCls: 'icon-script-delete',
            	tooltip:'Удалить файл',
                handler: function(item, e){toolBarFuncWraper(deleteTarget)}
            },{
                tooltip: 'Редактировать файл',
		        iconCls: 'icon-script-lightning',
                handler: function(item, e){toolBarFuncWraper(editFile)}
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
		            id: 'create-file'
		            ,text: 'Создать файл'
		            ,iconCls: 'icon-script-add'
                    ,handler: function(item, e){newTarget(item.parentMenu.contextNode, true)}
		        },{
		            id: 'rename-file'
		            ,text: 'Переименовать файл'
		            ,iconCls: 'icon-script-edit'
                    ,handler: function(item, e){renameTarget(item.parentMenu.contextNode, true)}
		        },{
		            id: 'delete-file'
		            ,text: 'Удалить файл'
		            ,iconCls: 'icon-script-delete'
                    ,handler: function(item, e){deleteTarget(item.parentMenu.contextNode, true)}
		        },{
		            id: 'edit-file'
		            ,text: 'Редактировать файл'
		            ,iconCls: 'icon-script-lightning'
                    ,handler: function(item, e){editFile(item.parentMenu.contextNode, true)}

		        },'-',{
		            id: 'create-dir1'
		            ,text: 'Создать директорию'
		            ,iconCls: 'icon-folder-add'
                    ,handler: function(item, e){newTarget(item.parentMenu.contextNode, true)}
                },'-',{
		        	id: 'create-class'
		            ,text: 'Добавить класс'
		            ,iconCls: 'icon-cog-add'
		            ,handler: function(item, e){createClass(item.parentMenu.contextNode,e)}
		        }]
		    }),
            contextFileMenu: new Ext.menu.Menu({
                items: [{
		            id: 'create-file2'
		            ,text: 'Создать файл'
		            ,iconCls: 'icon-script-add'
                    ,handler: function(item, e){newTarget(item.parentMenu.contextNode, true)}
		        },{
		            id: 'rename-file2'
		            ,text: 'Переименовать файл'
		            ,iconCls: 'icon-script-edit'
                    ,handler: function(item, e){renameTarget(item.parentMenu.contextNode, true)}
		        },{
		            id: 'delete-file2'
		            ,text: 'Удалить файл'
		            ,iconCls: 'icon-script-delete'
                    ,handler: function(item, e){deleteTarget(item.parentMenu.contextNode, true)}
		        },{
		            id: 'edit-file1'
		            ,text: 'Редактировать файл'
		            ,iconCls: 'icon-script-lightning'
                    ,handler: function(item, e){editFile(item.parentMenu.contextNode, true)}
		        },'-',{
		            id: 'create-dir2'
		            ,text: 'Создать директорию'
		            ,iconCls: 'icon-folder-add'
                    ,handler: function(item, e){newTarget(item.parentMenu.contextNode, false)}
                }]
            }),
            contextDirMenu: new Ext.menu.Menu({
                items: [{
		            id: 'create-dir'
		            ,text: 'Создать директорию'
		            ,iconCls: 'icon-folder-add'
                    ,handler: function(item, e){newTarget(item.parentMenu.contextNode, false)}
		        },{
		            id: 'rename-dir'
		            ,text: 'Переименовать директорию'
		            ,iconCls: 'icon-folder-edit'
                    ,handler: function(item, e){renameTarget(item.parentMenu.contextNode, false)}
		        },{
		            id: 'delete-dir'
		            ,text: 'Удалить директорию'
		            ,iconCls: 'icon-folder-delete'
                    ,handler: function(item, e){deleteTarget(item.parentMenu.contextNode, false)}
		        },'-',{
		            id: 'create-file3'
		            ,text: 'Создать файл'
		            ,iconCls: 'icon-script-add'
                    ,handler: function(item, e){newTarget(item.parentMenu.contextNode, true)}
                }]
            }),
		    listeners: {
		        contextmenu: function(node, e) {
		            node.select();
                    var parentNodeText = node.parentNode.text;
                    /* Файл дизайна форм */
		            if (node.text === fileUi || node.text === fileForms ) {
			            var c = node.getOwnerTree().contextMenu;
		            }
                    /* Файл */
                    else if(node.leaf && (parentNodeText !== fileUi && parentNodeText !== fileForms)) {
                        var c = node.getOwnerTree().contextFileMenu;
                    }
                    /* Директория */
                    else if(!node.leaf && (parentNodeText !== fileUi && parentNodeText !== fileForms)) {
                        var c = node.getOwnerTree().contextDirMenu;
                    };
                    if (c) {
                        c.contextNode = node;
			            c.showAt(e.getXY());
                    }
		        },
		        dblclick: function(node, e){
                    var parentNodeText = node.parentNode.text;
                    var fileType = node.text.split('.').slice(-1);
		        	if (parentNodeText === fileUi || parentNodeText === fileForms){
			        	onClickNode(node);
		        	}
                    /*Все файлы не являющиеся *.py и conf */
                    else if(fileType == filePython || fileType == fileConf){
                        var fileAttr = {};
                        fileAttr['path'] = node.attributes.path;
                        fileAttr['fileName'] = node.attributes.text;
                        onClickNodePyFiles(node, fileAttr);
                    }
                    else if(node.leaf) wrongFileTypeMessage(fileType);
		        }
		    }
	});
	
	tree.getLoader().on("beforeload", function(treeLoader, node) {	
    	treeLoader.baseParams['path'] = node.attributes['path'];
    	treeLoader.baseParams['class_name'] = node.attributes['class_name'];
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
};

/**
 * Возвращает класс иконки по типо расширения файла
 * @param fileName
 */
function caseOfIncons(fileName){
    var splitedFileNmae = fileName.split('.');
    var fileExpansion = splitedFileNmae[splitedFileNmae.length-1];
    var icon = '';
    switch (fileExpansion) {
      case 'py':
        icon = 'icon-page-white-py';
        break
      case 'js':
        icon = 'icon-page-white-js';
        break
      case 'css':
        icon = 'icon-css';
        break
      case 'html':
        icon = 'icon-html';
        break
      default:
        icon = 'icon-page-white-text';
    };
    return icon;
};

/* Редактировать файл */
function editFile(node, e){
    var fileType = node.text.split('.').slice(-1);
    if(fileType == 'py' || fileType == 'conf'){
        var fileAttr = {};
        fileAttr['path'] = node.attributes.path;
        fileAttr['fileName'] = node.attributes.text;
        onClickNodePyFiles(node, fileAttr);
    }
    else wrongFileTypeMessage(fileType);
};

/**
 * Новый файл/директорию
 * @param node - узел
 * @param fileBool - boolean флаг файл иль нет
 */
function newTarget(node, fileBool){
    Ext.MessageBox.prompt('Новый '+(fileBool? 'файл': 'директория'),'Введите имя '+ (fileBool? 'файла': 'директории'),
    function(btn, name){
        if (btn == 'ok' && name){
            var path = node.attributes['path'];
            var params = {
                path : path,
                type: fileBool? typeFile: typeDir,
                name : name,
                action : actionNew
            };
            manipulationRequest(params, function(obj){
                var new_node = new Ext.tree.TreeNode({
                    text: name
                    ,path: obj.data['path']
                    ,iconCls: fileBool? caseOfIncons(name): 'icon-folder'
                    ,leaf: fileBool? true : false
                });
                var currentNode = node.leaf ? node.parentNode: node;
                currentNode.appendChild(new_node, function(){
                    currentNode.reload();
                });
            });
        };
    });
};

/**
 * Удалить файл/директорию
 * @param node - узел
 * @param fileBool - boolean флаг файл иль нет
 */
function deleteTarget(node, fileBool){
    var path = node.attributes['path'];
    var params = {
        path : path,
        type: fileBool? typeFile: typeDir,
        action : actionDelete
    };
    Ext.Msg.show({
        title:'Удалить '+(fileBool? 'файл': 'директорию'),
        msg: 'Вы действительно хотите удалить '+ (fileBool? 'файл': 'директорию')+ ' '+node.text+'?',
        buttons: Ext.Msg.YESNOCANCEL,
        icon: Ext.MessageBox.QUESTION,
        fn: function(btn, text){
            if (btn == 'yes'){
                params.access = 1;
                manipulationRequest(params, function(){
                    node.remove();
                });
            };
        }
    });
};

/**
 * Преименовать файл/директорию
 * @param node - узел
 * @param fileBool - boolean флаг файл иль нет
 */
function renameTarget(node, fileBool){
    Ext.MessageBox.prompt('Переименование '+(fileBool? 'файла': 'директории'),
            'Введите имя '+(fileBool? 'файла': 'директории'),
    function(btn, name){
        if (btn == 'ok' && name){
        var path = node.attributes['path'];
        var params = {
            path : path,
            type: fileBool? typeFile: typeDir,
            action : actionRename,
            name : name
        };
        manipulationRequest(params, function(){
            node.setText(name);
            if (params.access) node.remove(function(){
                this.parentNode.reload();
            });
        });
        };
    });
};


/**
 * DRY
 * @param params - Параметры запроса
 * @param fn - Функция которая будет выполнена при success
 */
function manipulationRequest(params, fn){
    var errorTypeExist = 'exist';
    Ext.Ajax.request({
        url:'/designer/project-manipulation',
        method: 'POST',
        params: params,
        success: function(response, opts){
            var obj = Ext.util.JSON.decode(response.responseText);
            if (obj.success && fn instanceof Function) fn(obj);
            else if (obj.error.msg && obj.error.type == errorTypeExist){
                var additionalMessage = '. Заменить?';
                customMessage(obj, params, fn,additionalMessage)
            }
            else if (obj.error.msg){
                Ext.Msg.show({
                   title:'Ошибка',
                   msg: obj.error.msg,
                   buttons: Ext.Msg.OK,
                   icon: Ext.MessageBox.WARNING
                   });
            };
        },
        failure: uiAjaxFailMessage
    });
};

/**
 *
 * @param obj - Объект ответа сервера
 * @param params - Параметры запроса к серверу, для послед. запроса
 * @param fn - Функция которая передается в рекурсивно вызывающийся запрос
 * @param additionalMessage - добавочное сообщение
 */
function customMessage(obj, params, fn, additionalMessage){
    Ext.Msg.show({
        title:'Уведомление',
        msg: obj.error.msg + additionalMessage,
        buttons: Ext.Msg.YESNOCANCEL,
        icon: Ext.MessageBox.QUESTION,
        fn: function(btn, text){
            if (btn == 'yes'){
                params.access = 1;
                manipulationRequest(params, fn);
            }
        }
    });
};

/**
 * Сообщение о неверности формата
 * @param fileType - Тип файла (*.html, *.css, ...)
 */
function wrongFileTypeMessage(fileType){
    Ext.Msg.show({
            title: 'Открытие файла',
            msg: 'Расширение '+fileType+' не поддерживается',
            buttons: Ext.Msg.OK,
            icon: Ext.Msg.INFO
    });
};

//Инициируем перехват нажатия ctrl+s для автоматического сохранения на сервер
Ext.fly(document).on('keydown',function(e,t,o){
   if (e.ctrlKey && (e.keyCode == 83)) {// кнопка S
   	   var tabPanel = Ext.getCmp('tab-panel');
       var tab = tabPanel.getActiveTab();
       if (tab && tab.saveOnServer &&
               (typeof(tab.saveOnServer) == 'function')) {
           tab.saveOnServer();
           e.stopEvent();
       };
   };
});

function onClickNode(node) {					
	var attr =  node.attributes;
	            	
	var tabPanel = Ext.getCmp('tab-panel');	
	var id = attr['path'] + attr['class_name'];

	var tab = tabPanel.getItem(id);
	if(tab){				
		tabPanel.setActiveTab(tab);
		return;
	};
	
    var workspace = new DesignerWorkspace({
    	id: id,
        dataUrl:'/designer/data',
        saveUrl:'/designer/save',
        path:attr['path'],
        className:attr['class_name'],
        previewUrl:'/designer/preview',
        uploadCodeUrl: 'designer/upload-code'
    });
    
 	workspace.loadModel();    
	workspace.on('beforeload', function(jsonObj){

		if (jsonObj['not_autogenerated']) {

       		// Может быть сгенерировать эту функцию в этом классе?
       		Ext.Msg.show({
			   title:'Функция не определена'
			   ,msg: 'Функция автогенерация не определена в классе ' + attr['class_name'] + '. <br/> Сгенерировать данную функцию?'
			   ,buttons: Ext.Msg.YESNO					   						   
			   ,icon: Ext.MessageBox.QUESTION
			   ,fn: function(btn, text){
			   		if (btn == 'yes'){
			   			generateInitialize(node, attr['path'], attr['class_name']);
			   		};
			   }
			});
       		result = false;
       } else if (jsonObj.success) {

			this.setTitle(attr['class_name']); 
												
			tabPanel.add(this);				
		    tabPanel.activate(this);
		
		    // Прослушивает событие "tabchange", вызывает новое событие в дочерней панели
		    tabPanel.on('tabchange', function(panel,newTab,currentTab){
		        this.application.designPanel.fireEvent('tabchanged');
    		}, this);
			
			result = true;
			
       	} else {
       		Ext.Msg.show({
			   title:'Ошибка'
			   ,msg: jsonObj.json
			   ,buttons: Ext.Msg.OK						   						   
			   ,icon: Ext.MessageBox.WARNING
			});
			result = false;
       	};
       	
       return result;               	
     }, workspace);
};


/**
 * Генерирует функцию автогенерации для класса 
 */
function generateInitialize(node, path, className){
	Ext.Ajax.request({
		url:'create-autogen-function'
		,params:{
			path: path,
			className: className
		}
		,success: function(response, opts){			
			onClickNode(node);
		}
		,failure: uiAjaxFailMessage
	});
};

/**
 * Вымогает у сервера некий файл
 * @param path - путь к файлу
 * TODO: Сделать callBack'ами Ext.Ajax.request
 */
function onClickNodePyFiles(node, fileAttr){
    var path = fileAttr.path;
    var fileName = fileAttr.fileName;
        
    var id = path + fileName;
    
    var tabPanel = Ext.getCmp('tab-panel');
    var tab = tabPanel.getItem(id);
	if(tab){				
		tabPanel.setActiveTab(tab);
		return;
	};
    
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
            	id:id,
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
        if (tab) { 
        	var tabPanel = Ext.getCmp('tab-panel');
        	tabPanel.remove(tab); 
        };
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
