/**
 * Crafted by ZIgi
 */

/*
 * Класс хранит в себе информацию о возможных типах компонентов, доступных им свойст, отображение в тулбоксе
 */

ModelTypeLibrary = Ext.apply(Object, {
    typesConfig:{
        panel:{
            isContainer:true,
            properties:{
                autoScroll:{
                    defaultValue:false    
                },
                layout:{
                    defaultValue:'auto',
                    isInitProperty:true
                },
                title:{
                    defaultValue:'New panel',
                    isInitProperty:true
                },
                name:{
                    defaultValue:'New panel',
                    isInitProperty:true
                },
                // ATTENTION:EXT не понимает строки в качестве высоты и ширины панели, поэтому тут число
                height:{
                    defaultValue:0
                },
                width:{
                    defaultValue:0
                },
                flex:{
                    defaultValue:'undefined'
                },
                labelWidth:{
                    defaultValue:100
                },
                labelAlign:{
                    defaultValue:'left'
                },
                padding:{
                    defaultValue:'undefined'
                }
            },
            toolboxData:{
                text:'Panel',
                category:'Containers'
            },
            treeIconCls:'designer-panel'
        },
        tabPanel:{
            isContainer:true,
            properties:{
                title:{
                    defaultValue:'New tab panel',
                    isInitProperty:true
                },
                name:{
                    defaultValue:'New tab panel',
                    isInitProperty:true
                },
                activeTab:{
                    defaultValue:0,
                    isInitProperty:true
                }
            },
            toolboxData:{
                text:'Tab panel',
                category:'Containers'
            },
            treeIconCls:'designer-tab-panel'
        },
        textField:{
            properties:{
                fieldLabel:{
                    defaultValue:''
                },
                name:{
                    defaultValue:'New text field',
                    isInitProperty:true
                },
                anchor:{
                    defaultValue:'auto'
                }
            },
            toolboxData:{
                text:'Text field',
                category:'Fields'
            },
            treeIconCls:'designer-icon-text'
        },
        window:{
            properties: {
                name:{
                    defaultValue:'Ext window',
                    isInitProperty:true
                },
                layout:{
                    defaultValue:'fit',
                    isInitProperty:true
                },
                title: {
                    defaultValue:'New window',
                    isInitProperty:true
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
    /*
    * Возвращает конфиг объекта с атрибутами, нужными для его создания и заполнеными дефолтными значениями
    */
    getTypeInitProperties:function(type) {
        var currentType = this.typesConfig[type]['properties'];
        var cfg = {};
        for (var i in currentType) {
            if (currentType[i]['isInitProperty']) {
                cfg[i] = currentType[i]['defaultValue'];
            }
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
        var categories = {};

        for (var type in this.typesConfig){
           if (!this.typesConfig[type].hasOwnProperty('toolboxData')) {
                continue;
           };

           var currentType = this.typesConfig[type];

           var node = new Ext.tree.TreeNode({
               text:this.typesConfig[type]['toolboxData'].text,
               type:type,
               iconCls:this.typesConfig[type]['treeIconCls']
           });

           if (currentType['toolboxData'].hasOwnProperty('category')) {

               if (categories[currentType['toolboxData']['category']]) {
                   categories[currentType['toolboxData']['category']].appendChild(node);
               }
               else {
                   var categoryNode = new Ext.tree.TreeNode({
                       text:currentType['toolboxData']['category'],
                       allowDrag:false
                   });
                   categories[currentType['toolboxData']['category']] = categoryNode; 
                   categoryNode.appendChild(node);
                   result.push(categoryNode);
               }
           }
           else {
               result.push(node);
           }
        }
        return result;
    }
});
