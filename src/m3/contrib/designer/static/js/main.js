// Переменные манипуляций с Файловой Сиситемы
var typeFile = 'file';
var typeDir = 'dir';
var actionDelete = 'delete';
var actionRename = 'rename';
var actionNew = 'new';

// Переменные манипуляций в дереве структуры проекта
var designerFormFiles = ["forms.py","ui.py"];
var codeViewFileTypes = ["py", "css", "js", "conf", "html", "sql"];

/**
 * добавляем функцию has в array,
 * функция возвращает true если хотябы один элемент встречается в массиве
 */
Array.prototype.has = function() {
    var	i = arguments.length;
    while(i){
        var x = this.indexOf(arguments[--i]) !== -1;
        if(x) {
            return true;
        }
    }
    return false;
};

/*==========================Перехват нажатий клавиш===========================*/
//Инициируем перехват нажатия ctrl+s для автоматического сохранения на сервер
Ext.fly(document).on('keydown',function(e,t,o){
   if (e.ctrlKey && (e.keyCode == 83)) {// кнопка S
   	   var tabPanel = Ext.getCmp('tab-panel');
       var tab = tabPanel.getActiveTab();
       if (tab && tab.onSave && (typeof(tab.onSave) == 'function')) {
           tab.onSave();
           e.stopEvent();
       }
   }
});

/**
 * Хендлер на keydown (del) в дереве структуры проекта, вызывает удаление объекта
 * @param {string} id
 */
function initAdditionalTreeEvents(id){
    Ext.fly(id).on('keydown',function(e,t,o){
        if(e.keyCode == 46){ //del
            var selectedNode = projectViewTreeManipulation();
            var isnotFormClass = !designerFormFiles.has(selectedNode.parentNode.text);
            if (selectedNode && isnotFormClass){
                var isFile = selectedNode.leaf;
                deleteTarget(selectedNode, isFile);
            }
        }
    });
}
/*============================================================================*/

/**
 * Базовая функция внешнего воздействия на дерево структуры проекта.
 */
function projectViewTreeManipulation(){
    var selectedNode = M3Designer.Utils.projectViewTreeGetSelectedNode();
    if (!selectedNode){
        Ext.Msg.show({
            title: 'Информация',
            msg: 'Для выполнения действия необходимо выделить узел дерева',
            buttons: Ext.Msg.OK,
            icon: Ext.Msg.INFO
        });
    }
    return selectedNode
}

/**
 * Адаптер
 * @param fn - Функция
 */
function toolBarFuncWraper(fn){
    var selectedNode = projectViewTreeManipulation();
    if (selectedNode){
        fn(selectedNode, true);
    }
}

/**
 * Создает класс в файлах форм дизайнера
 * @param node
 * @param e
 */
function createClass(node, e){
    Ext.MessageBox.prompt('Создание класса', 'Введите название класса',
        function(btn, text){
            if (btn == 'ok'){
                M3Designer.Requests.createClass(node, text);
            }
        }
    );
}

/**
 * Дерево структуры проекта 
 */
function createTreeView(rootNodeName){
	
	var commands = {
        'create-file': {
            text: 'Создать файл'
            ,iconCls: 'icon-script-add'
            ,handler: function(item, e) {
                newTarget(item.parentMenu.contextNode, true)
            }
        },
        'rename-file': {
            text: 'Переименовать файл'
            ,iconCls: 'icon-script-edit'
            ,handler: function(item, e) {
                renameTarget(item.parentMenu.contextNode, true)
            }
        },
        'delete-file':{
            text: 'Удалить файл'
            ,iconCls: 'icon-script-delete'
            ,handler: function(item, e) {
                deleteTarget(item.parentMenu.contextNode, true)
            }
        },
        'open-file':{
            text: 'Редактировать файл'
            ,iconCls: 'icon-script-lightning'
            ,handler: function(item, e) {
                editFile(item.parentMenu.contextNode, true)
            }
        },
        'create-dir':{
            text: 'Создать директорию'
            ,iconCls: 'icon-folder-add'
            ,handler: function(item, e) {
                newTarget(item.parentMenu.contextNode, false)
            }
        },
        'create-class': {
            text: 'Добавить класс'
            ,iconCls: 'icon-cog-add'
            ,handler: function(item, e) {
                createClass(item.parentMenu.contextNode, e)
            }
        },
        'rename-dir':{
            text: 'Переименовать директорию'
            ,iconCls: 'icon-folder-edit'
            ,handler: function(item, e) {
                renameTarget(item.parentMenu.contextNode, false)
            }
        },
        'delete-dir':{
            text: 'Удалить директорию'
            ,iconCls: 'icon-folder-delete'
            ,handler: function(item, e) {
                deleteTarget(item.parentMenu.contextNode, false)
            }
        },
        'create-init':{
            text: 'Создать функцию инициализации'
            ,iconCls: 'icon-award-star-add'
            ,handler: function(item, e) {
                M3Designer.Requests.generateInitialize(item.parentMenu.contextNode);
            }
        },
        'create-simple-func':{
            text: 'Создать контейнерную функцию'
            ,iconCls: 'icon-medal-gold-add'
            ,handler: function(item, e) {

                var store = new Ext.data.ArrayStore({
                    autoDestroy: true,
                    idIndex: 0,
                    fields: [
                        'type',
                        'descr'
                    ]
                    ,data: [
                        ['container', 'Container'],
                        ['panel', 'Panel'],
                        ['formPanel', 'Form panel']
                    ]
                });


                var form =
                        new Ext.form.FormPanel({
                            padding: 10
                            ,baseCls: 'x-plain'
                            ,labelWidth: 100
                            ,items:[
                                new Ext.form.TextField({
                                    fieldLabel: 'Название'
                                    ,id:'func-name'
                                    ,anchor: '100%'
                                    ,allowBlank: false
                                    ,maskRe: /[A-Za-z\_]+/
                                    ,name:'name'
                                }),
                                new Ext.form.ComboBox({
                                    fieldLabel: 'Контейнерный класс'
                                    ,anchor: '100%'
                                    ,allowBlank: false
                                    ,mode:'local'
                                    ,store: store
                                    ,valueField: 'type'
                                    ,hiddenName: 'type'
                                    ,displayField: 'descr'
                                    ,editable: false
                                    ,triggerAction: 'all'
                                    ,name:'type'
                                })
                            ]
                        });

                var node = item.parentMenu.contextNode;

                var win = new Ext.Window({
                    title: 'Создание функции для класса - ' + node.text
                    ,resizable: false
                    ,modal: true
                    ,width: 400
                    ,items:[ form ]
                    ,buttons: [
                        new Ext.Button({
                            text: 'Создать',
                            handler: function(btn, e) {
                                var funcName = form.getForm().findField('func-name').getValue();
                                var funcType = form.getForm().findField('type').getValue();
                                M3Designer.Requests.createFunction(funcName, funcType, node, win);
                            }
                        }),
                        new Ext.Button({
                            text: 'Отмена',
                            handler: function(btn, e) {
                                btn.ownerCt.ownerCt.close();
                            }
                        })
                    ]
                });
                win.show();
            }
        }
    };

	var contextMenuUiClass = new Ext.menu.Menu({
        items: [
        	commands['create-file'],
        	commands['rename-file'],
        	commands['delete-file'],
        	commands['open-file'],
        	'-',
        	commands['create-dir'],
        	'-',
        	commands['create-class']
        ]
	});

    var contextFileMenu = new Ext.menu.Menu({
        items: [
        	commands['create-file'],
        	commands['rename-file'],
        	commands['delete-file'],
        	commands['open-file'],
        	'-',
        	commands['create-dir']
		]
    });

    var contextDirMenu = new Ext.menu.Menu({
        items: [
        	commands['create-dir'],
        	commands['rename-dir'],
        	commands['delete-dir'],
        	commands['open-file'],
        	'-',
        	commands['create-file']
        ]
    });

	var contextMenuClass = new Ext.menu.Menu({
        items: [
        	commands['create-class'],
        	'-',
        	commands['create-init'],
        	commands['create-simple-func']
        ]
    });

	var contextMenuFunc = new Ext.menu.Menu({
        items: [
        	commands['create-init'],
        	commands['create-simple-func']
        ]
    });


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
		,listeners: {
	        contextmenu: function(node, e) {
	            node.select();
                if (node.parentNode) {
                    var parentNodeText = node.parentNode.text;

					var menu;

					// Узел для функции
					if (node.attributes['class_name'] && node.attributes['func_name']){
						menu = contextMenuFunc;
					}
					// Узел для класса
					else if (node.attributes['class_name']){
						menu = contextMenuClass;
					}
                    //Файл дизайна форм
                    else if (designerFormFiles.has(node.text)) {
                        menu = contextMenuUiClass;
                    }
                    //Файл
                    else if(node.leaf) {
                        menu = contextFileMenu;
                    }
                    //Директория
                    else if(!node.leaf) {
                        menu = contextDirMenu;
                    }
                    if (menu) {
                        menu.contextNode = node;
                        menu.showAt(e.getXY());
                    }
                }
	        },
	        dblclick: function(node, e){
                var parentNodeText = node.parentNode.text;
                var fileType = node.text.split('.').slice(-1);

                if (designerFormFiles.has(parentNodeText)){
		        	onClickNode(node);
	        	}
	        	if (node.attributes['func_name']){
		        	onClickNode(node);
	        	}

                //Все типы фалов которые не входят в codeViewFileTypes
                else if(codeViewFileTypes.has(fileType[0])){
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
		id:'accordion-view',
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
	    }],
        listeners:{
            clear: function(){
                var panel = Ext.getCmp('property-panel');
                panel.removeAll();
                panel.setTitle('Свойства');
                var accordionView = panel.ownerCt;
                if (accordionView.items.itemAt(0).collapsed){
                    accordionView.items.itemAt(0).expand();
                }
            }
        }
	});
    tree.on('afterrender', function(){initAdditionalTreeEvents(tree.id)});
	return accordion;
}

/**
 * Возвращает расширение файла
 * @param fileName
 */
function getFileExpansion(fileName){
    var splitedFileName = fileName.split('.');
    return splitedFileName[splitedFileName.length-1];
}

/**
 * Возвращает класс иконки по типу расширения файла
 * @param fileName
 */
function caseOfIncons(fileName){
    var fileExpansion = getFileExpansion(fileName);
    var fileExpansionIconsObj = {
        "py": "icon-page-white-py",
        "js": "icon-page-white-js",
        "css": "icon-css",
        "html": "html",
        "default": "icon-page-white-text"
    };
    return fileExpansionIconsObj[fileExpansion] ? fileExpansionIconsObj[fileExpansion] : fileExpansionIconsObj["default"];
}

/**
 * Возвращает тип файла по расширения файла
 * @param fileName
 */
function fileTypeByExpansion(fileName){
    var fileExpansion = getFileExpansion(fileName);
    var fileTypesObj = {
        "py": "python",
        "js": "javascript",
        "css": "css",
        "html": "html",
        "sql": "sql",
        "default": "python"
    };
    return fileTypesObj[fileExpansion] ? fileTypesObj[fileExpansion] : fileTypesObj["default"];
}

/**
 * Функция редактирования файла
 * @param node 
 * @param e
 */
function editFile(node, e){
    var fileType = node.text.split('.').slice(-1)[0];
    if(fileType == 'py' || fileType == 'conf'){
        var fileAttr = {};
        fileAttr['path'] = node.attributes.path;
        fileAttr['fileName'] = node.attributes.text;
        onClickNodePyFiles(node, fileAttr);
    }
    else wrongFileTypeMessage(fileType);
}

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
            M3Designer.Requests.manipulation(params, function(obj){
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
        }
    });
}

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
                M3Designer.Requests.manipulation(params, function(){
                    node.remove();
                });
            }
        }
    });
}

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
        M3Designer.Requests.manipulation(params, function(){
            node.setText(name);
            if (params.access) {
                node.remove(function(){
                    this.parentNode.reload();
                });
            }
        });
        }
    });
}


/**
 * Сообщение
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
                M3Designer.Requests.manipulation(params, fn);
            }
        }
    });
}

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
}

/**
 * Функция обрабатывает клик по ноде
 * @param node - нода по которой был совершон клик
 */
function onClickNode(node) {
	var attr =  node.attributes;
	var tabPanel = Ext.getCmp('tab-panel');

	var funcTitle = ' (initialize)';
	if (attr['func_name']) {
		funcTitle = ' ('+ attr['func_name'] + ')';
	}

	var id = attr['path'] + attr['class_name'] + funcTitle;

	var tab = tabPanel.getItem(id);
	if(tab){
		tabPanel.setActiveTab(tab);
		return;
	}

    var workspace = new DesignerWorkspace({
    	id: id,
        dataUrl:'/designer/data',
        saveUrl:'/designer/save',
        path:attr['path'],
        className:attr['class_name'],
        funcName:attr['func_name'],
        previewUrl:'/designer/preview',
        uploadCodeUrl: 'designer/upload-code'
    });

 	workspace.loadModel();

    initWorkSpaceCloseHandler(workspace.application);

	workspace.on('beforeload', function(jsonObj){
        var result = false;
		if (jsonObj['not_autogenerated']) {

       		// Может быть сгенерировать эту функцию в этом классе?
       		Ext.Msg.show({
			   title:'Функция не определена'
			   ,msg: 'Функция автогенерация не определена в классе ' + attr['class_name'] + '. <br/> Сгенерировать данную функцию?'
			   ,buttons: Ext.Msg.YESNO
			   ,icon: Ext.MessageBox.QUESTION
			   ,fn: function(btn, text){
			   		if (btn == 'yes'){
			   			M3Designer.Requests.generateInitialize(node);
			   		}
			   }
			});
        } else if (jsonObj.success) {
			this.setTitle(attr['class_name'] + funcTitle);

			tabPanel.add(this);
		    tabPanel.activate(this);

            this.application.on('contentchanged', function(){
                this.onChange();
            }, this);
            
            this.on('beforeclose', function(){
                return initTabCloseHandler(this, this.application.changedState())
            });
            
            //Хендлер на событие закрытие таба таб панели
            this.on('close', function(tab){
                if (tab) {
                    var tabPanel = Ext.getCmp('tab-panel');
                    tabPanel.remove(tab);
                    window.onbeforeunload = undefined;
                }
            });
            
		    // Прослушивает событие "tabchange"
		    tabPanel.on('tabchange', function(panel, newTab){
                this.application.removeHighlight();
                Ext.getCmp('accordion-view').fireEvent('clear');
    		}, this);

			result = true;

        } else {
            M3Designer.Utils.failureMessage({ "message": jsonObj.json });
        }

       return result;
     }, workspace);
}

/**
 * Вымогает у сервера некий файл
 * @param node
 * @param fileAttr
 */
function onClickNodePyFiles(node, fileAttr){
    var tabPanel = Ext.getCmp('tab-panel');
    var tab = tabPanel.getItem(fileAttr.path + fileAttr.fileName);
	if(tab){				
		tabPanel.setActiveTab(tab);
		return;
	}
    //Запрос содержимого файла по path на сервере
    M3Designer.Requests.fileGetContent(fileAttr, tabPanel);
}

/**
 * Функция слушает событие изменение контента елемента.
 * @param element
 * @param chagedBool
 */
function initWorkSpaceCloseHandler(element, chagedBool){
    //Хендлер на событие перед закрытием
    element.on({
        // Хендлер на событие перед закрытием
        'contentchanged':{
            fn: function(){
                // Дефолтное значение или аргумент
                var chagedBool = chagedBool === undefined ? element.contentChanged : chagedBool;
                if (chagedBool === undefined){
                    chagedBool = true;
                }
                if (chagedBool){
                    window.onbeforeunload = function(){
                        return 'Вы закрываете вкладку, в которой имеются изменения.'
                    }
                }else{
                    //Очищаем хендлер срабатывающий перед закрытием вкладки окна браузера
                    window.onbeforeunload = undefined;
                }
            }
        },
        // Хендлер на событие перед закрытием
        'beforeclose':{
            fn: function(){
                return initTabCloseHandler(element);
            }
        }
    });
}

/**
 * Хендлер на закрытие вкладки
 * @param element
 * @param chagedBool
 */
function initTabCloseHandler(element, chagedBool){
    var chagedBool = element.contentChanged || chagedBool;
    //async close tab && message
    var userTakeChoice = true;
    if (chagedBool){
        var scope = element;
        M3Designer.Utils.showMessage(function(buttonId){
            if (buttonId==='yes') {
                scope.onSave();
                scope.fireEvent('close', scope);
            }
            else if (buttonId==='no') {
                scope.fireEvent('close', scope);
            }
            else if (buttonId==='cancel') {
                userTakeChoice = !userTakeChoice;
            }
            userTakeChoice = !userTakeChoice;
        });
    }else {
        userTakeChoice = !userTakeChoice;
    }
    return !userTakeChoice;
}

/**
 * Иницализация хендлеров codeEditor'а
 * @param codeEditor
 */
function initCodeEditorHandlers(codeEditor, path){

    initWorkSpaceCloseHandler(codeEditor);

    /* Хендлер на событие закрытие таба таб панели */
    codeEditor.on('close', function(tab){
        if (tab) {
            window.onbeforeunload = undefined;
        	var tabPanel = Ext.getCmp('tab-panel');
        	tabPanel.remove(tab); 
        }
    });

    /* Хендлер на событие сохранения */
    codeEditor.on('save', function(){
        /*Запрос на сохранение изменений */
        M3Designer.Requests.fileSaveContent(codeEditor, path);
    });

    /* Хендлер на событие обновление */
    codeEditor.on('update', function(){
        //Запрос на обновление
        M3Designer.Requests.fileUpdateContent(codeEditor, path);
    });
}

