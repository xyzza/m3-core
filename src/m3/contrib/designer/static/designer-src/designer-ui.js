/**
 * Crafted by ZIgi
 */

/*
* Эта реализация паттерна посетитель, которая позволяет используя мощь JS'а
* реализовать полиморфное поведение при обходе древовидной структуры
*/

ModelUIPresentaitionBuilder = function() {
    //Важное замечание номер раз - каждому экстовому компоненту присваевается id = id модели
    //это требуется для того чтобы ставить в соответсвие DOM элементы и экстовые компоненты
    //Важное замечание номер два - у контейнеров следует навешивать cls 'designContainer'
    //он нужен для визуального dd на форму при лукапе по DOM'у

    var mapObject =
    {
        window:function(model, cfg) {
            return new Ext.Panel(cfg);
        },
        panel:function(model, cfg) {
            return new Ext.Panel(cfg);
        },
        fieldSet:function(model, cfg) {
            return new Ext.form.FieldSet(cfg);    
        },
        textField:function(model, cfg) {
            return new Ext.form.TextField(
                    Ext.apply(cfg,{
                        readOnly:true
                    })
                );
        },
        comboBox:function(model, cfg) {
            var store = new Ext.data.ArrayStore({
            autoDestroy:true,
            idIndex:0,
            fields:['name'],
            data:['foo','bar']
        });
            var result = new Ext.form.ComboBox({
                store:store,
                displayField:'name',
                mode:'local',
                triggerAction:'all',
                editable:false,
                selectOnFocus:true,
                fieldLabel:'fukken test',
                lazyInit:false,
                value:'foo'
            });
            return result;

//            return new Ext.form.ComboBox(
//                    cfg
//                    );
        },
        tabPanel:function(model, cfg) {
            return new Ext.TabPanel(
                    Ext.apply(cfg,{
                        deferredRender:false,
                        activeTab: model.attributes.activeTabId ?
                                model.attributes.activeTabId : model.attributes.properties.activeTab,
                        listeners:{
                            tabchange:function(panel, tab) {
                                var tabPanelModel = model.ownerTree.findModelById(panel.id);
                                tabPanelModel.attributes.activeTabId = tab.id;
                            }
                        }
                    })
                );
        },
        gridPanel:function(model, cfg) {
            return new Ext.grid.GridPanel({
                store: new Ext.data.Store({
                    autoDestroy: true
                    //reader: reader,
                    //data: xg.dummyData
                }),
                colModel: new Ext.grid.ColumnModel({
                    defaults: {
                        width: 120,
                        sortable: true
                    },
                    columns: [
                        {id: 'company', header: 'Company', width: 200, sortable: true, dataIndex: 'company'},
                        {header: 'Price', renderer: Ext.util.Format.usMoney, dataIndex: 'price'},
                        {header: 'Change', dataIndex: 'change'},
                        {header: '% Change', dataIndex: 'pctChange'},
                        // instead of specifying renderer: Ext.util.Format.dateRenderer('m/d/Y') use xtype
                        {
                            header: 'Last Updated', width: 135, dataIndex: 'lastChange',
                            xtype: 'datecolumn', format: 'M d, Y'
                        }
                    ]
                }),
                viewConfig: {
                    forceFit: true,

            //      Return CSS class to apply to rows depending upon data values
                    getRowClass: function(record, index) {
                        var c = record.get('change');
                        if (c < 0) {
                            return 'price-fall';
                        } else if (c > 0) {
                            return 'price-rise';
                        }
                    }
                },
                //sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
                width: 600,
                height: 300,
                //frame: true,
                title: 'Framed with Row Selection and Horizontal Scrolling'
                //iconCls: 'icon-grid'
            });
        }
    }

    return {
        /**
         * Возвращает ExtComponent или какой нибудь его наследник
         */
        build:function(model) {
            var cfg = Ext.apply({}, model.attributes.properties);
            cfg.id = model.id;
            if (ModelTypeLibrary.isTypeContainer(model.attributes.type)) {
                cfg.cls = 'designContainer';
            }
            if (mapObject.hasOwnProperty(model.attributes.type)) {
                return mapObject[model.attributes.type](model, cfg);
            }
        }
    }
}();