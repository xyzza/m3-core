/**
 * Crafted by ZIgi
 */

ModelTypeLibrary = Ext.apply(Object, {
    typesConfig:{
        panel:{
            isContainer:true,
            properties:{
                layout:{
                    defaultValue:'auto'
                },
                title:{
                    defaultValue:'New panel'
                },
                name:{
                    defaultValue:'New panel'
                },
                height:{
                    defaultValue:'auto'
                },
                width:{
                    defaultValue:'auto'
                },
                flex:{
                    defaultValue:0
                }
            },
            toolboxData:{
                text:'Panel'
            },
            treeIconCls:'icon-heart'
        },
        tabPanel:{
            isContainer:true,
            properties:{
                title:{
                    defaultValue:'New tab panel'
                },
                name:{
                    defaultValue:'New tab panel'
                },
                activeTab:{
                    defaultValue:0
                }
            },
            toolboxData:{
                text:'Tab panel'
            },
            treeIconCls:'icon-heart'
        },
        textField:{
            properties:{
                fieldLabel:{
                    defaultValue:''
                },
                name:{
                    defaultValue:'New text field'
                }
            },
            toolboxData:{
                text:'Text field'
            },
            treeIconCls:'designer-icon-text'
        },
        window:{
            properties: {
                name:{
                    allowBlank:false,
                    defaultValue:'Ext window'
                },
                layout:{
                    defaultValue:'fit'
                },
                title: {
                    defaultValue:'New window'
                }
            },
            isContainer:true,
            treeIconCls:'designer-icon-page'
        }
    },
    /**
     * Возвращает объект со свойствами заполнеными дефолтными значениями по типу модели
     *
     */
    getTypeDefaultProperties:function(type) {
        //пояснение для тех кто не достиг дзена - в js объекты и ассоциативные массивы(словари) одно и тоже
        //И более того, с помощью цикла for можно итерировать по свойствам массива(читай - получить все ключи словаря)
        var currentType = this.typesConfig[type]['properties'];
        var cfg = {};
        for (var i in currentType) {
            cfg[i] = currentType[i]['defaultValue'];
        }
        return cfg;
    },
    /**
     * Возвращает класс иконки для переданного типа
     */
    getTypeIconCls:function(type) {
        return this.typesConfig[type]['treeIconCls'];
    },
    /**
     * Просто проверка является ли тип контейнером
     */
    isTypeContainer:function(type) {
        return this.typesConfig[type].isContainer ? true : false;
    },
    /*
     * Метод возвращает массив ExtTreeNode для отображения в тулбоксе
     */
    getToolboxData:function() {
        var result = [];
        for (var type in this.typesConfig){
           if (!this.typesConfig[type].hasOwnProperty('toolboxData')) {
                continue;
           };
           var node = new Ext.tree.TreeNode({
               text:this.typesConfig[type]['toolboxData'].text,
               type:type,
               iconCls:this.typesConfig[type]['treeIconCls']
           });
            result.push(node);
        }
        return result;
    }
});
