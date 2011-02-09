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
                    isInitProperty:true,
                    propertyType:'enum'
                },
                layoutConfig :{
                    defaultValue:'undefined',
                    propertyType:'object'
                },
                title:{
                    defaultValue:'New panel',
                    isInitProperty:true
                },
                id:{
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
                    defaultValue:'left',
                    propertyType:'enum'
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
        fieldSet:{
            isContainer:true,
            properties:{
                layout:{
                    defaultValue:'form',
                    isInitProperty:true,
                    propertyType:'enum'
                },
                title:{
                    defaultValue:'New fieldset',
                    isInitProperty:true
                },
                id:{
                    defaultValue:'New fieldset',
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
                    defaultValue:'left',
                    propertyType:'enum'
                },
                padding:{
                    defaultValue:'undefined'
                }
            },
            toolboxData:{
                text:'Field set',
                category:'Containers'
            },
            treeIconCls:'designer-icon-fieldset'
        },
        tabPanel:{
            isContainer:true,
            properties:{
                title:{
                    defaultValue:'New tab panel',
                    isInitProperty:true
                },
                id:{
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
                id:{
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
        comboBox: {
            //FIXME комбобоксеке не работают
            properties: {
                fieldLabel:{
                    defaultValue:''
                },
                id:{
                    defaultValue:'New text field',
                    isInitProperty:true
                },
                anchor:{
                    defaultValue:'auto'
                },
                triggerAction:{
                    defaultValue:'all',
                    isInitProperty:true
                },
                valueField:{
                    defaultValue:'myId',
                    isInitProperty:true
                },
                displayField:{
                    defaultValue:'displayText',
                    isInitProperty:true        
                },
                store:{
                    defaultValue: new Ext.data.ArrayStore({
                                id: 0,
                                fields: [
                                    'myId',
                                    'displayText'
                                ],
                                data: [[1, 'item1'], [2, 'item2']]
                            }),
                    isInitProperty:true
                }
            },
            toolboxData:{
                text:'Combo box',
                category:'Fields'
            },
            treeIconCls:'designer-icon-combo'
        },
        gridPanel:{
            isContainer: true,
            properties: {
                id:{
                    defaultValue:'Grid panel',
                    isInitProperty:true
                },
                title: {
                    defaultValue:'New grid',
                    isInitProperty:true
                },
                autoExpandColumn: {
                    defaultValue:''
                }
            },
            treeIconCls:'designer-grid-panel',
            toolboxData:{
                text:'Grid panel',
                category:'Grid'
            }

        },
        gridColumn:{
            properties: {
                id:{
                    defaultValue:'grid column',
                    isInitProperty:true
                },
                name:{
                    defaultValue:'New column',
                    isInitProperty:true
                },
                header:{
                    defaultValue:'New column',
                    isInitProperty:true
                },
                dataIndex:{
                    defaultValue:'Foo',
                    isInitProperty:true
                },
                menuDisabled: {
                    defaultValue:true,
                    isInitProperty:true
                }
            },
            treeIconCls:'designer-grid-column',
            toolboxData: {
                text:'Grid column',
                category:'Grid'
            }
        },
        window:{
            properties: {
                id:{
                    defaultValue:'Ext window',
                    isInitProperty:true
                },
                layout:{
                    defaultValue:'fit',
                    isInitProperty:true,
                    propertyType:'enum'
                },
                title: {
                    defaultValue:'New window',
                    isInitProperty:true
                }
            },
            isContainer:true,
            treeIconCls:'designer-icon-page'
        },
        arrayStore:{
            properties : {
                id: {
                    defaultValue:'New array store',
                    isInitProperty:true
                },
                storeId: {
                    defaultValue:'New store',
                    isInitProperty:true
                },
                idIndex : {
                    defaultValue:0,
                    isInitProperty:true
                },
                fields: {
                    defaultValue:'undefined',
                    propertyType:'object'
                },
                data: {
                    defaultValue:'undefined',
                    propertyType:'object'
                }
            },
            treeIconCls:'icon-database',
            toolboxData: {
                text:'Array store',
                category:'Data'
            }
        }
    },
    enumConfig: {
        layout:['auto','fit','form','hbox','vbox','border','absolute'],
        labelAlign:['left','top']
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
    * Является ли данное свойство объектом?
    */
    isPropertyObject:function(type, property) {
        if (this.typesConfig[type]['properties'][property].hasOwnProperty('propertyType') &&
                this.typesConfig[type]['properties'][property]['propertyType'] == 'object') {
            return true;
        }
        else
        {
            return false;
        }
    },
    /*
    * Возвращает списко значений перечисления(типичный пример - layout)
    */
    getEnumValues: function(enumName) {
        return this.enumConfig[enumName];    
    },
    /*
    * Тип свойства модели - простое(string, number, boolean - трактуется по типу дефолтного значения),
    * перечисление(enum) или объектное(object) - метод используется при редактировании в свойств компонентов
    * в PropertyGrid'е
    */
    getPropertyType:function(modelTypeName, propertyName) {
        if (this.typesConfig[modelTypeName]['properties'][propertyName].hasOwnProperty('propertyType')) {
            return this.typesConfig[modelTypeName]['properties'][propertyName]['propertyType']
        }
        else {
            return typeof this.typesConfig[modelTypeName]['properties'][propertyName]['defaultValue'];
        }
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
