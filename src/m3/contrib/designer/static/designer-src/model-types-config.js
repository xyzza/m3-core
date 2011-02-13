/**
 * Crafted by ZIgi
 */

Ext.apply(ModelTypeLibrary,{
    typesConfig:{
        component:{
            properties:{
                style:{
                    defaultValue:'undefined',
                    propertyType:'object'
                },
                hidden:{
                    defaultValue:false
                },
                disabled:{
                    defaultValue:false,
                    isQuckEditable: true
                },
                height:{
                    defaultValue:0,
                    isQuckEditable: true
                },
                width:{
                    defaultValue:0,
                    isQuckEditable: true
                },
                x:{
                    defaultValue:0
                },
                y:{
                    defaultValue:0
                },
                html:{
                    defaultValue:''
                },
                region:{
                    defaultValue:'',
                    propertyType:'enum',
                    isQuckEditable: true
                },
                flex:{
                    defaultValue:0
                },
                maxHeight:{
                    defaultValue:0
                },
                minHeight:{
                    defaultValue:0
                },
                maxWidth:{
                    defaultValue:0
                },
                minWidth:{
                    defaultValue:0
                },
                name:{
                    defaultValue:'',
                    isQuckEditable: true
                },
                anchor:{
                    defaultValue:''
                },
                cls:{
                    defaultValue:''
                },
                autoScroll:{
                    defaultValue:false
                }
            }
        },

        /*
        * Простые компоненты
        */
        button: {
            parent:'component',
            properties: {
                id:{
                    defaultValue:'button',
                    isInitProperty:true
                },
                text:{
                    defaultValue:'New button',
                    isInitProperty:true
                },
                iconCls:{
                    defaultValue:''
                },
                handler: {
                    defaultValue:'undefined'
                }
            },
            toolboxData:{
                category:'Standart',
                text:'Button'
            }
        },
        label: {
            parent:'component',
            properties: {
                id:{
                    defaultValue:'label',
                    isInitProperty:true
                },
                text: {
                    defaultValue:'New label',
                    isInitProperty:true,
                    isQuckEditable: true
                }
            },
            toolboxData:{
                category:'Standart',
                text:'Label'
            }
        },
        /*
        * Контейнеры
        */
        container : {
            isContainer:true,
            parent:'component',
            properties: {
                layout:{
                    defaultValue:'auto',
                    isInitProperty:true,
                    propertyType:'enum',
                    isQuckEditable: true
                },
                layoutConfig :{
                    defaultValue:'undefined',
                    propertyType:'object'
                },
                labelWidth:{
                    defaultValue:0,
                    isQuckEditable: true
                },
                labelAlign:{
                    defaultValue:'left',
                    propertyType:'enum',
                    isQuckEditable: true
                },
                labelPad:{
                    defaultValue:''
                },
                id: {
                    defaultValue:'container',
                    isInitProperty:true,
                    isQuckEditable: true
                }
            },
            toolboxData:{
                category:'Containers',
                text:'Container'
            },
            childTypesRestrictions:{
                disallowed:['arrayStore','gridColumn']
            },
            treeIconCls:'designer-container'
        },
        panel:{
            isContainer:true,
            parent:'container',
            properties:{
                title:{
                    defaultValue:'New panel',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                id:{
                    defaultValue:'panel',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                collapsible: {
                    defaultValue:false
                },
                collapsed : {
                    defaultValue:false
                },
                border: {
                    defaultValue: true
                },
                bodyBorder : {
                    defaultValue: true
                },
                baseCls :{
                    defaultValue: 'x-panel'
                },
                autoLoad : {
                    defaultValue: 'undefined'
                },
                padding:{
                    defaultValue:'undefined',
                    isQuckEditable: true
                },
                header: {
                    defaultValue:false,
                    isInitProperty:true
                }
            },
            childTypesRestrictions:{
                disallowed:['arrayStore','gridColumn']
            },
            toolboxData:{
                text:'Panel',
                category:'Containers'
            },
            treeIconCls:'designer-panel'
        },
        fieldSet:{
            parent:'panel',
            isContainer:true,
            properties:{
                layout:{
                    defaultValue:'form',
                    isInitProperty:true,
                    propertyType:'enum',
                    isQuckEditable: true
                },
                title:{
                    defaultValue:'New fieldset',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                id:{
                    defaultValue:'fieldset',
                    isInitProperty:true,
                    isQuckEditable: true
                }
            },
            childTypesRestrictions:{
                disallowed:['arrayStore','gridColumn']
            },
            toolboxData:{
                text:'Field set',
                category:'Containers'
            },
            treeIconCls:'designer-icon-fieldset'
        },
        tabPanel:{
            parent:'panel',
            isContainer:true,
            properties:{
                id:{
                    defaultValue:'tab_panel',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                activeTab:{
                    defaultValue:0,
                    isInitProperty:true
                },
                layout: {
                    defaultValue:undefined,
                    isInitProperty:true
                }
            },
            childTypesRestrictions:{
                allowed:['panel', 'formPanel','fieldSet', 'gridPanel']
            },
            toolboxData:{
                text:'Tab panel',
                category:'Containers'
            },
            treeIconCls:'designer-tab-panel'
        },
        formPanel: {
            parent:'panel',
            isContainer:true,
            properties : {
                id : {
                    defaultValue:'form_panel',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                layout: {
                    defaultValue:'form',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                title: {
                    defaultValue:'',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                url: {
                    defaultValue:''
                },
                fileUpload:{
                    defaultValue:false
                }
            },
            childTypesRestrictions:{
                disallowed:['arrayStore','gridColumn']
            },
            toolboxData: {
                category:'Containers',
                text:'Form panel'
            },
            treeIconCls:'designer-formpanel'
        },
        /*
        * Поля для ввода
        */
        baseField : {
            parent:'component',
            properties:{
                fieldLabel:{
                    defaultValue:'',
                    isQuckEditable: true
                },
                value: {
                    defaultValue:'',
                    isQuckEditable: true
                },
                labelStyle:{
                    defaultValue:''
                },
                readOnly:{
                    defaultValue:false
                },
                hideLabel :{
                    defaultValue:false
                },
                tabIndex:{
                    defaultValue:0
                },
                invalidClass:{
                    defaultValue:'m3-form-invalid',
                    isInitValue:true
                }
            }
        },
        textArea:{
            parent:'textField',
            properties:{
                id:{
                    defaultValue:'text_area',
                    isInitProperty:true,
                    isQuckEditable: true
                }
            },
            toolboxData:{
                text:'Text area',
                category:'Fields'
            },
            treeIconCls:'designer-textarea'
        },
        checkBox:{
            parent:'baseField',
            properties: {
                id: {
                    defaultValue:'check_box',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                checked: {
                    defaultValue:false
                },
                boxLabel: {
                    defaultValue:''
                }
            },
            toolboxData:{
                text:'Checkbox',
                category:'Fields'
            },
            treeIconCls:'designer-checkbox'
        },
        dateField: {
            parent:'baseField',
            properties: {
                id:{
                    defaultValue:'date_field',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                startDay : {
                    defaultValue:0
                }
            },
            toolboxData:{
                text:'Date field',
                category:'Fields'
            },
            treeIconCls:'designer-icon-datefield'
        },
        timeField : {
            parent:'baseField',
            properties: {
                id:{
                    defaultValue:'time_field',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                format : {
                    defaultValue:'g:i A',
                    isQuckEditable: true
                },
                increment: {
                    defaultValue:15,
                    isQuckEditable: true
                }
            },
            toolboxData:{
                text:'Time field',
                category:'Fields'
            },
            treeIconCls:'designer-timefield'
        },
        textField:{
            parent:'baseField',
            properties:{
                id:{
                    defaultValue:'string_field',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                 allowBlank :{
                    defaultValue:true,
                    isQuckEditable: true
                },
                 vtype: {
                    defaultValue:''
                },
                emptyText: {
                    defaultValue:''
                },
                minLength:{
                    defaultValue:0
                },
                minLengthText:{
                    defaultValue:''
                },
                maxLength:{
                    defaultValue:0
                },
                maxLengthText:{
                    defaultValue:''
                },
                regex:{
                    defaultValue:''
                },
                regexText:{
                    defaultValue:''
                }
            },
            toolboxData:{
                text:'String field',
                category:'Fields'
            },
            treeIconCls:'designer-icon-text'
        },
        numberField:{
            parent:'textField',
            properties:{
                id:{
                    defaultValue:'number_field',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                decimalSeparator:{
                    defaultValue:'.'
                },
                allowDecimal: {
                    defaultValue:true,
                    isQuckEditable: true
                },
                allowNegative: {
                    defaultValue:true,
                    isQuckEditable: true
                },
                decimalPrecision: {
                    defaultValue:2
                },
                maxValue : {
                    defaultValue:0
                },
                maxText: {
                    defaultValue:''
                },
                minValue : {
                    defaultValue:0
                },
                minText: {
                    defaultValue:''
                },
                selectOnFocus: {
                    defaultValue: false
                }

            },
            toolboxData:{
                text:'Number field',
                category:'Fields'
            },
            treeIconCls:'designer-icon-number'
        },
        htmlEditor: {
            parent:'baseField',
            properties : {
                id: {
                    defaultValue:'html_editor',
                    isInitProperty:true,
                    isQuckEditable: true
                }

            },
            toolboxData: {
                category:'Fields',
                text:'Html editor'
            },
            treeIconCls:'designer-htmleditor'
        },
        comboBox: {
            isContainer:true,
            parent:'triggerField',
            properties: {
                id:{
                    defaultValue:'combobox',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                triggerAction:{
                    defaultValue:'all',
                    isInitProperty:true,
                    propertyType:'enum',
                    isQuckEditable: true
                },
                valueField:{
                    defaultValue:'value',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                displayField:{
                    defaultValue:'displayText',
                    isInitProperty:true
                },
                mode: {
                    defaultValue:'local',
                    propertyType:'enum',
                    isInitProperty:true
                },
                hiddenName: {
                    defaultValue:'undefined'
                },
                typeAhead: {
                    defaultValue:false
                },
                queryParam: {
                    defaultValue:'query'
                },
                pageSize: {
                    defaultValue:0
                },
                maxHeight: {
                    defaultValue: 300
                },
                minChars: {
                    defaultValue:0
                },
                forceSelection: {
                    defaultValue:false
                },
                valueNotFoundText:{
                    defaultValue:'undefined'
                }
            },
            childTypesRestrictions:{
                allowed:['arrayStore'],
                single:['arrayStore']
            },
            toolboxData:{
                text:'Combo box',
                category:'Fields'
            },
            treeIconCls:'designer-icon-combo'
        },
        triggerField: {
            parent:'textField',
            properties: {
                id: {
                    defaultValue:'New trigger field',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                editable: {
                    defaultValue:true,
                    isInitProperty:true
                },
                hideTrigger : {
                    defaultValue:false
                }
            },
            toolboxData:{
                text:'Trigger field',
                category:'Fields'
            },
            treeIconCls:'designer-icon-combo'
        },
        displayField: {
            parent:'baseField',
            properties: {
                id : {
                    defaultValue:'display_field',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                value : {
                    defaultValue:'New display field',
                    isInitProperty:true,
                    isQuckEditable: true
                }
            },
            toolboxData:{
                text:'Display field',
                category:'Fields'
            },
            treeIconCls:'designer-displayfield'
        },
        hiddenField: {
            properties: {
                id : {
                    defaultValue:'hidden_field',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                name : {
                    defaultValue:'',
                    isQuckEditable: true
                },
                value: {
                    defaultValue:'',
                    isQuckEditable: true
                }
            },
            toolboxData:{
                text:'Hidden field',
                category:'Fields'
            }
        },
        /*
        * Тулбары
        */
        toolbar: {
            isContainer:true,
            parent:'container',
            properties: {
                id: {
                    defaultValue: 'toolbar',
                    isInitProperty:true
                },
                parentDockType: {
                    defaultValue:'tbar',
                    isInitProperty:true,
                    propertyType:'enum'
                },
                layout: {
                    defaultValue:'toolbar',
                    isInitProperty:true
                }
            },
            toolboxData:{
                category:'Toolbar',
                text:'Toolbar'
            }
        },
        tbfill: {
            properties: {
                id: {
                    defaultValue: 'toolbar_fill',
                    isInitProperty:true
                }
            },
            toolboxData:{
                category:'Toolbar',
                text:'Toolbar fill'
            }
        },
        tbseparator: {
            properties: {
                id: {
                    defaultValue: 'toolbar_separator',
                    isInitProperty:true
                }
            },
            toolboxData:{
                category:'Toolbar',
                text:'Toolbar separator'
            }
        },
        tbspacer: {
            properties: {
                id: {
                    defaultValue: 'toolbar_spacer',
                    isInitProperty:true
                }
            },
            toolboxData:{
                category:'Toolbar',
                text:'Toolbar spacer'
            }
        },
        tbtext: {
            properties: {
                id: {
                    defaultValue: 'toolbar_text',
                    isInitProperty:true
                },
                text: {
                    defaultValue:'Toolbar text',
                    isInitProperty:true
                }
            },
            toolboxData:{
                category:'Toolbar',
                text:'Toolbar text item'
            }
        },
        gridPanel:{
            parent:'panel',
            isContainer: true,
            properties: {
                id:{
                    defaultValue:'grid_panel',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                title: {
                    defaultValue:'New grid',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                autoExpandColumn: {
                    defaultValue:''
                },
                layout: {
                    defaultValue:undefined,
                    isInitProperty:true,
                    isQuckEditable: true
                }
            },
            childTypesRestrictions:{
                allowed:['gridColumn','arrayStore', 'toolbar'],
                single:['arrayStore']
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
                    //ATTENTION - пробелы в id ведут к багу при наведении мышки на хедер
                    defaultValue:'gridColumn',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                header:{
                    defaultValue:'column',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                dataIndex:{
                    defaultValue:'Foo',
                    isInitProperty:true,
                    isQuckEditable: true
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
            parent:'panel',
            properties: {
                id:{
                    defaultValue:'window',
                    isInitProperty:true,
                    isQuckEditable: true
                },
                layout:{
                    defaultValue:'fit',
                    isInitProperty:true,
                    propertyType:'enum',
                    isQuckEditable: true
                },
                title: {
                    defaultValue:'New window',
                    isInitProperty:true,
                    isQuckEditable: true
                }
            },
            childTypesRestrictions:{
                disallowed:['arrayStore','gridColumn']
            },
            isContainer:true,
            treeIconCls:'designer-icon-page'
        },
        arrayStore:{
            properties : {
                id: {
                    defaultValue:'array_store',
                    isInitProperty:true,
                    isQuckEditable: true
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
                    propertyType:'object',
                    isQuckEditable: true
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
