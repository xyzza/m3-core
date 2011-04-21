/**
 * Crafted by ZIgi
 */

Ext.namespace('M3Designer.model');

Ext.apply(M3Designer.model.ModelTypeLibrary,{
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
                    isQuickEditable: true
                },
                height:{
                    defaultValue:0,
                    isQuickEditable: true
                },
                width:{
                    defaultValue:0,
                    isQuickEditable: true
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
                    isQuickEditable: true
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
                    isQuickEditable: true
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
                    isInitProperty:true,
                    isQuickEditable: true
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
                    isInitProperty:true,
                    isQuickEditable: true
                },
                text: {
                    defaultValue:'New label',
                    isInitProperty:true,
                    isQuickEditable: true
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
                    isQuickEditable: true
                },
                layoutConfig :{
                    defaultValue:'undefined',
                    propertyType:'object'
                },
                labelWidth:{
                    defaultValue:0,
                    isQuickEditable: true
                },
                labelAlign:{
                    defaultValue:'left',
                    propertyType:'enum',
                    isQuickEditable: true
                },
                labelPad:{
                    defaultValue:''
                },
                id: {
                    defaultValue:'container',
                    isInitProperty:true,
                    isQuickEditable: true
                }
            },
            toolboxData:{
                category:'Containers',
                text:'Container'
            },
            childTypesRestrictions:{
                disallowed:['arrayStore','gridColumn','jsonStore','pagingToolbar']
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
                    isQuickEditable: true
                },
                id:{
                    defaultValue:'panel',
                    isInitProperty:true,
                    isQuickEditable: true
                },
                collapsible: {
                    defaultValue:false,
                    isQuickEditable: true
                },
                collapsed : {
                    defaultValue:false,
                    isQuickEditable: true
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
                    isQuickEditable: true
                },
                header: {
                    defaultValue:false,
                    isInitProperty:true
                }
            },
            childTypesRestrictions:{
                disallowed:['arrayStore','gridColumn','jsonStore','pagingToolbar']
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
                    isQuickEditable: true
                },
                title:{
                    defaultValue:'New fieldset',
                    isInitProperty:true,
                    isQuickEditable: true
                },
                id:{
                    defaultValue:'fieldset',
                    isInitProperty:true,
                    isQuickEditable: true
                }
            },
            childTypesRestrictions:{
                disallowed:['arrayStore','gridColumn','jsonStore','pagingToolbar']
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
                    isQuickEditable: true
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
                allowed:['panel', 'formPanel','fieldSet', 'gridPanel','objectGrid']
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
                    isQuickEditable: true
                },
                layout: {
                    defaultValue:'form',
                    isInitProperty:true,
                    isQuickEditable: true
                },
                title: {
                    defaultValue:'',
                    isInitProperty:true,
                    isQuickEditable: true
                },
                url: {
                    defaultValue:''
                },
                fileUpload:{
                    defaultValue:false
                }
            },
            childTypesRestrictions:{
                disallowed:['arrayStore','gridColumn','jsonStore','pagingToolbar']
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
                    isQuickEditable: true
                },
                value: {
                    defaultValue:'',
                    isQuickEditable: true
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
                    isQuickEditable: true
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
                    isQuickEditable: true
                },
                checked: {
                    defaultValue:false,
                    isQuickEditable: true
                },
                boxLabel: {
                    defaultValue:'',
                    isQuickEditable: true
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
                    isQuickEditable: true
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
                    isQuickEditable: true
                },
                format : {
                    defaultValue:'g:i A',
                    isQuickEditable: true
                },
                increment: {
                    defaultValue:15,
                    isQuickEditable: true
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
                    isQuickEditable: true
                },
                 allowBlank :{
                    defaultValue:true,
                    isQuickEditable: true
                },
                 vtype: {
                    defaultValue:''
                },
                emptyText: {
                    defaultValue:'',
                    isQuickEditable: true
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
                    isQuickEditable: true
                },
                decimalSeparator:{
                    defaultValue:'.'
                },
                allowDecimal: {
                    defaultValue:true,
                    isQuickEditable: true
                },
                allowNegative: {
                    defaultValue:true,
                    isQuickEditable: true
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
                    isQuickEditable: true
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
                    isQuickEditable: true
                },
                triggerAction:{
                    defaultValue:'all',
                    isInitProperty:true,
                    propertyType:'enum',
                    isQuickEditable: true
                },
                valueField:{
                    defaultValue:'id',
                    isInitProperty:true,
                    isQuickEditable: true
                },
                displayField:{
                    defaultValue:'name',
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
                allowed:['arrayStore','jsonStore'],
                single:['arrayStore','jsonStore']
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
                    isQuickEditable: true
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
                    isQuickEditable: true
                },
                value : {
                    defaultValue:'New display field',
                    isInitProperty:true,
                    isQuickEditable: true
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
                    isQuickEditable: true
                },
                name : {
                    defaultValue:'',
                    isQuickEditable: true
                },
                value: {
                    defaultValue:'',
                    isQuickEditable: true
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
                    isInitProperty:true,
                    isQuickEditable: true
                },
                parentDockType: {
                    defaultValue:'tbar',
                    isInitProperty:true,
                    propertyType:'enum',
                    isQuickEditable: true
                },
                layout: {
                    defaultValue:'toolbar',
                    isInitProperty:true,
                    isQuickEditable: true
                }
            },
            toolboxData:{
                category:'Toolbar',
                text:'Toolbar'
            },
            childTypesRestrictions:{
                disallowed:['arrayStore','gridColumn','jsonStore','pagingToolbar']
            }
        },
        tbfill: {
            properties: {
                id: {
                    defaultValue: 'toolbar_fill',
                    isInitProperty:true,
                    isQuickEditable: true
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
                    isInitProperty:true,
                    isQuickEditable: true
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
                    isInitProperty:true,
                    isQuickEditable: true
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
                    isInitProperty:true,
                    isQuickEditable: true
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
        pagingToolbar: {
            properties: {
                id: {
                    defaultValue: 'paging_toolbar',
                    isInitProperty:true,
                    isQuickEditable: true
                },
                parentDockType: {
                    defaultValue:'bbar',
                    isInitProperty:true,
                    propertyType:'enum',
                    isQuickEditable: true
                },
                layout: {
                    defaultValue:'toolbar',
                    isInitProperty:true
                },
                pageSize:{
                    defaultValue:25,
                    isQuickEditable:true
                },
                displayMessage: {
                    defaultValue:'Показано записей {0} - {1} из {2}'
                },
                displayInfo: {
                    defaultValue:true
                },
                emptyMessage:{
                    defaultValue:'Нет записей'
                }
            },
            toolboxData:{
                category:'Grid',
                text:'Paging toolbar'
            }
        },

        gridPanel:{
            parent:'panel',
            isContainer: true,
            properties: {
                id:{
                    defaultValue:'grid_panel',
                    isInitProperty:true,
                    isQuickEditable: true
                },
                title: {
                    defaultValue:'New grid',
                    isInitProperty:true,
                    isQuickEditable: true
                },
                autoExpandColumn: {
                    defaultValue:''
                },
                layout: {
                    defaultValue:'auto',
                    isInitProperty:true,
                    isQuickEditable: false
                }
            },
            childTypesRestrictions:{
                allowed:['gridColumn','arrayStore', 'toolbar','jsonStore','pagingToolbar'],
                single:['arrayStore','jsonStore','pagingToolbar']
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
                    isQuickEditable: true
                },
                header:{
                    defaultValue:'column',
                    isInitProperty:true,
                    isQuickEditable: true
                },
                dataIndex:{
                    defaultValue:'Foo',
                    isInitProperty:true,
                    isQuickEditable: true
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
                    isQuickEditable: true
                },
                layout:{
                    defaultValue:'fit',
                    isInitProperty:true,
                    propertyType:'enum',
                    isQuickEditable: true
                },
                title: {
                    defaultValue:'New window',
                    isInitProperty:true,
                    isQuickEditable: true
                }
            },
            childTypesRestrictions:{
                disallowed:['arrayStore','gridColumn','jsonStore','pagingToolbar']
            },
            isContainer:true,
            treeIconCls:'designer-icon-page'
        },
        baseStore: {
            properties: {
                _baseParams: {
                    defaultValue:'undefined',
                    propertyType:'object'
                },
                autoLoad: {
                    defaultValue:false
                },
                autoSave: {
                    defaultValue: true
                },
                url: {
                    defaultValue:'',
                    isQuickEditable:true
                }
            }
        },
        arrayStore:{
            parent:'baseStore',
            properties : {
                id: {
                    defaultValue:'array_store',
                    isInitProperty:true,
                    isQuickEditable: true
                },
                storeId: {
                    defaultValue:'New store',
                    isInitProperty:true
                },
                idIndex : {
                    defaultValue:0,
                    isInitProperty:true
                },
                data: {
                    defaultValue:'undefined',
                    propertyType:'object',
                    isQuickEditable:true
                }
            },
            treeIconCls:'icon-database',
            toolboxData: {
                text:'Data store',
                category:'Data'
            }
        },
        jsonStore:{
            parent:'baseStore',
            properties : {
                id: {
                    defaultValue:'json_store',
                    isInitProperty:true,
                    isQuickEditable: true
                },
                storeId: {
                    defaultValue:'newJsonStore',
                    isInitProperty:true
                },
                idProperty : {
                    defaultValue:'id',
                    isInitProperty:true
                },
                fields: {
                    defaultValue:'undefined',
                    propertyType:'object',
                    isQuickEditable: true
                },
                root: {
                    defaultValue:'undefined'
                },
                _start: {
                    defaultValue: 0
                },
                _limit: {
                    defaultValue:-1
                },
                totalProperty: {
                    defaultValue:'undefined'
                }
            },
            treeIconCls:'icon-database',
            toolboxData: {
                text:'Json store',
                category:'Data'
            }
        },
        /*
        * М3
        */
        dictSelect:{
            parent:'comboBox',
            properties: {
                id: {
                    defaultValue:'dict_select_field',
                    isInitProperty:true
                },
                hideTrigger: {
                    defaultValue:true
                },
                hideClearTrigger: {
                    defaultValue:false
                },
                hideEditTrigger: {
                    defaultValue:false
                },
                hideDictSelectTrigger: {
                    defaultValue:false
                },
                minChars: {
                    defaultValue:2
                },
                width: {
                    defaultValue:150
                },
                defaultText: {
                    defaultValue:''
                },
                askBeforeDelete: {
                    defaultValue:true
                },
                url: {
                    defaultValue:'',
                    isQuickEditable:true
                },
                urlShortName:{
                    defaultValue:'',
                    isQuickEditable:true
                },
                editUrl:{
                    defaultValue:''
                },
                editUrlShortName: {
                    defaultValue:''
                },
                autocompleteUrl: {
                    defaultValue:''
                },
                autocompleteUrlShortName: {
                    defaultValue:''
                }

            },
            treeIconCls:'designer-icon-combo',
            toolboxData: {
                text:'Dictionary select field',
                category:'M3'
            }
        },
        objectGrid: {
            parent:'grid',
            isContainer: true,
            properties: {
                id:{
                    defaultValue:'object_grid',
                    isInitProperty:true,
                    isQuickEditable: true
                },
                title: {
                    defaultValue:'New object grid',
                    isInitProperty:true,
                    isQuickEditable: true
                },
                autoExpandColumn: {
                    defaultValue:''
                },
                layout: {
                    defaultValue:'auto',
                    isInitProperty:true,
                    isQuickEditable: false
                },
                urlDataShortName: {
                    defaultValue:'',
                    isQuickEditable:true
                },
                urlEditShortName: {
                    defaultValue:'',
                    isQuickEditable:true
                },
                urlDeleteShortName: {
                    defaultValue:'',
                    isQuickEditable:true
                },
                urlNewShortName: {
                    defaultValue:'',
                    isQuickEditable:true
                },
                urlData: {
                    defaultValue:''
                },
                urlEdit: {
                    defaultValue:''
                },
                urlDelete: {
                    defaultValue:''
                },
                urlNew: {
                    defaultValue:''
                },
                loadMask: {
                    defaultValue:true
                },
                rowIdName: {
                    defaultValue:'row_id',
                    isQuickEditable:true
                },
                columnParamName: {
                    defaultValue:'column'
                },
                allowPaging: {
                    defaultValue:true
                }
            },
            childTypesRestrictions:{
                allowed:['gridColumn'],
                disallowed:['arrayStore','jsonStore','pagingToolbar','toolbar']
            },
            treeIconCls:'designer-grid-panel',
            toolboxData:{
                text:'Object grid',
                category:'M3'
            }
        }
    }
});
