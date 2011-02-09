/**
 * Crafted by ZIgi
 */

Ext.apply(ModelTypeLibrary,{
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
    }
});