/**
 * Created by .
 * User: kirs
 * Date: 10.06.11
 * Time: 16:02
 */

/**
 * TODO:
 * 1. Вынести логику из запросов.
 * 2. Исправить создание класса (неправильное место добавления узла)
*/

Ext.namespace('M3Designer');
/**
 * Объект для совершения запросов к серверу
 */
M3Designer.Requests = Ext.apply({}, {
    /*Запрос на сохранение */
    fileSaveContent:function(codeEditor, path){
        Ext.Ajax.request({
            url:'/designer/file-content/save',
            params: {
                path: path,
                content: codeEditor.codeMirrorEditor.getValue()
            },
            success: function(response, opts){
                var obj = Ext.util.JSON.decode(response.responseText);
                if (obj.success){
                     M3Designer.Utils.successMessage();
                }else if (!obj.success && obj.error){
                    M3Designer.Utils.failureMessage({ "message": 'Ошибка при сохранении файла\n'+obj.error });
                };
                codeEditor.contentChanged = false;
                codeEditor.onChange();
            },
            failure: uiAjaxFailMessage
        })
    },
    /*Запрос на обновление*/
    fileUpdateContent:function(codeEditor, path, userTakeChoice, textArea){
        Ext.Ajax.request({
            url:'/designer/file-content',
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
                               codeEditor.codeMirrorEditor.setValue(obj.data.content);
                               codeEditor.contentChanged = false;
                           });
                        }
                        else if (buttonId=='no') {
                           codeEditor.codeMirrorEditor.setValue(obj.data.content);
                           codeEditor.contentChanged = false;
                        }
                        else if (buttonId=='cancel') {
                            userTakeChoice = !userTakeChoice;
                        }
                        userTakeChoice = !userTakeChoice;
                    }, textArea.id, msg);
                    codeEditor.onChange();
                }
                else {
                    userTakeChoice = !userTakeChoice;
                    codeEditor.codeMirrorEditor.setValue(obj.data.content);
                    codeEditor.contentChanged = false;
                    codeEditor.onChange();
                }
                if (obj.success){
                M3Designer.Utils.successMessage({
                            "title": "Обнавление",
                            "message": "Файл успешно обнавлен",
                            "icon": "icon-arrow-rotate-anticlockwise"});
                }else if (!obj.success && obj.error){
                    M3Designer.Utils.failureMessage({ "message": 'Ошибка при обновлении файла\n'+obj.error });
                };
                return !userTakeChoice;

            },
            failure: uiAjaxFailMessage
        });
    },
    /*Запрос содержимого файла по path на сервере*/
    fileGetContent:function(path, fileName, tabPanel){
        Ext.Ajax.request({
            url:'/designer/file-content',
            method: 'GET',
            params: {
                path: path
            }
            ,success: function(response, opts){
                var obj = Ext.util.JSON.decode(response.responseText);
                var type = fileTypeByExpansion(fileName);

                var codeEditor = new M3Designer.code.ExtendedCodeEditor({
                    sourceCode : obj.data.content,
                    parser: type
                });

                codeEditor.setTitle(fileName);
                tabPanel.add( codeEditor );
                tabPanel.activate(codeEditor);
            
                initCodeEditorHandlers(codeEditor, path);
            },
            failure: uiAjaxFailMessage
        });
    },
    /*Запрос содержимого файла по path на сервере*/
            /**
             *
             * @param path относительный пусть
             * @param fileName имя файла
             * @param tabPanel
             * @param crateNew bool флаг на создание нового файла
             */
    fileGTGetContent:function(path, fileName, tabPanel, crateNew){
        var scope = this,
            crateNew = crateNew || false;
        Ext.Ajax.request({
            url:'/designer/project-global-template',
            method: 'GET',
            params: {
                path: path,
                file: fileName,
                crateNew: crateNew ? 1:0
            }
            ,success: function(response, opts){
                var obj = Ext.util.JSON.decode(response.responseText);
                if (obj.success) {
                    var type = fileTypeByExpansion('js');
                    var codeEditor = new M3Designer.code.ExtendedCodeEditor({
                        sourceCode : obj.data.content,
                        parser: type
                    });

                    codeEditor.setTitle(fileName);

                    tabPanel.add( codeEditor );
                    tabPanel.activate(codeEditor);

                    initCodeEditorHandlers(codeEditor, obj.data.path);

                    if (crateNew){
                        M3Designer.Utils.successMessage({
                            "title": "Создание файла templateGlobals",
                            "message": "Файл "+fileName+" успешно создан в директории "+ obj.data['dir']});
                    }
                } else {
                    if(obj.error == 'notExists'){
                        Ext.Msg.show({
                            title:'Файл не найден',
                            msg: 'Файл '+fileName+' не был найден в директории '+obj.data.dir+'\n Создать файл ?',
                            buttons: Ext.Msg.YESNOCANCEL,
                            icon: Ext.MessageBox.QUESTION,
                            fn: function(btn, text){
                                if (btn == 'yes'){
                                    scope.fileGTGetContent(path, fileName, tabPanel, true)
                                };
                            }
                        });
                    }
                    else M3Designer.Utils.failureMessage({"message": obj.error});
                };
            },
            failure: uiAjaxFailMessage
        });
    },
    /* Генерирует функцию автогенерации для класса */
    generateInitialize:function(node){
        Ext.Ajax.request({
            url:'create-autogen-function'
            ,params:{
                path: node.attributes['path'],
                className: node.attributes['class_name']
            }
            ,success: function(response, opts){
                var obj = Ext.util.JSON.decode(response.responseText);
                if (obj.success) {
                    var funcName = 'initialize';
                    var new_node = new Ext.tree.TreeNode({
                        text: funcName
                        ,path: node.attributes['path']
                        ,class_name: node.attributes['class_name']
                        ,func_name: funcName
                        ,iconCls: 'icon-function'
                    });

                    node.appendChild(new_node);

                    onClickNode(node);
                    M3Designer.Utils.successMessage({
                            "title": "Создание функции",
                            "message": "Функция initialize успешно создана в классе "+ node.attributes['class_name']});
                } else {
                    M3Designer.Utils.failureMessage({"message": obj.json});
                };
            }
            ,failure: uiAjaxFailMessage
        })
    },
    /**
     * Выполняет запрос на различные манипуляции с файловой сиситемой
     * (GET, DELETE, RENAME для директорий и файлов)
     * DRY
     * @param params - Параметры запроса
     * @param fn - Функция которая будет выполнена при success
    */
    manipulation:function(params, fn){
        var errorTypeExist = 'exist';
        Ext.Ajax.request({
            url:'/designer/project-manipulation',
            method: 'POST',
            params: params,
            success: function(response, opts){
                var obj = Ext.util.JSON.decode(response.responseText);
                if (obj.success && fn instanceof Function)
                    fn(obj);
                else if (obj.error.msg && obj.error.type == errorTypeExist){
                    var additionalMessage = '. Заменить?';
                    customMessage(obj, params, fn,additionalMessage)
                }
                else if (obj.error.msg){
                    M3Designer.Utils.failureMessage({"message": obj.error.msg});
                };
            },
            failure: uiAjaxFailMessage
        });
    },
    /*Запрос на создание новой контейнерной функции */
    createFunction:function(funcName, funcType, node, win){
        Ext.Ajax.request({
            url: '/create-function'
            ,params:{
                name: funcName,
                path: node.attributes['path'],
                className: node.attributes['class_name'],
                type: funcType
            }
            ,success: function(response, opts){
                var obj = Ext.util.JSON.decode(response.responseText);
                if (obj.success) {

                    var new_node = new Ext.tree.TreeNode({
                        text: funcName
                        ,path: node.attributes['path']
                        ,class_name: node.attributes['class_name']
                        ,func_name: funcName
                        ,iconCls: 'icon-function'
                    });

                    node.appendChild(new_node);

                    win.close();
                    M3Designer.Utils.successMessage({
                            "title": "Создание функции",
                            "message": "Функция "+funcName+" успешно создана в классе "+ node.attributes['class_name']});
                    onClickNode(new_node);

                } else {
                    M3Designer.Utils.failureMessage({"message":obj.json});
                };
            }
            ,failure: uiAjaxFailMessage
        });
    },
    /*Запрос на cоздание нового класса в файле*/
    createClass: function(node, attr, text){
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
                        ,children:[]
                    });

                    node.appendChild(new_node);

                    var nodes = [{
                        text: '__init__'
                        ,path: attr['path']
                        ,class_name: text
                        ,func_name: '__init__'
                        ,iconCls: 'icon-function'
                    },{
                        text: 'initialize'
                        ,path: attr['path']
                        ,class_name: text
                        ,func_name: 'initialize'
                        ,iconCls: 'icon-function'
                    }]

                    for (var i=0; i<nodes.length; i++) {
                        new_node.appendChild(new Ext.tree.TreeNode( nodes[i] ));
                    }
                    M3Designer.Utils.successMessage({
                        "title": "Создание класса",
                        "message": "Класс "+text+" успешно создан"});
                } else {
                    M3Designer.Utils.failureMessage({"message":obj.json});
                };

            },
            failure: uiAjaxFailMessage
        });
    }

})