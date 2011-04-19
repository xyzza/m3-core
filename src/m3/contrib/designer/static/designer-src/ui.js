/**
 * Crafted by ZIgi
 */

Ext.namespace('M3Designer.ui');

/*
* Эта реализация паттерна посетитель, которая позволяет используя мощь JS'а
* реализовать полиморфное поведение при обходе древовидной структуры
*/

M3Designer.ui.ModelUIPresentaitionBuilder = function() {
    //Важное замечание номер раз - каждому экстовому компоненту присваевается id = id модели
    //это требуется для того чтобы ставить в соответсвие DOM элементы и экстовые компоненты
    //Важное замечание номер два - у контейнеров следует навешивать cls 'designContainer'
    //он нужен для визуального dd на форму при лукапе по DOM'у
    //Третье важное замечание - у всего что можно подсвечивать вешается класс designComponent

    var mapObject =
    {
        button:function(model,cfg){
            return Ext.apply(cfg,{
                xtype:'button'
            });
        },
        label:function(model,cfg) {
            return Ext.apply(cfg,{
                xtype:'label'
            });
        },
        window:function(model, cfg) {
            return Ext.apply(cfg, {
                xtype:'panel'
            });
        },
        panel:function(model, cfg) {
            return Ext.apply(cfg, {
                xtype:'panel'
            });
        },
        container:function(model, cfg) {
            return Ext.apply(cfg,{
                xtype:'container'
            });
        },
        fieldSet:function(model, cfg) {
            return Ext.apply(cfg,{
                xtype:'fieldset'
            });
        },
        formPanel:function(model, cfg) {
            return Ext.apply(cfg,{
                xtype:'form'
            });

        },
        textField:function(model, cfg) {
            return Ext.apply(cfg, {
                xtype:'textfield',
                readonly:true
            });
        },
        htmlEditor:function(model,cfg) {
            return Ext.apply(cfg,{
                        readOnly:true,
                        xtype:'htmleditor'
                    });
        },
        textArea:function(model, cfg){
            return Ext.apply(cfg, {
                xtype:'textarea',
                readonly:'true'
            });
        },
        checkBox:function(model, cfg){
            return Ext.apply(cfg,{
               readOnly:true,
               xtype:'checkbox'
            });
        },
        numberField:function(model, cfg){
            return Ext.apply(cfg,{
                        readOnly:true,
                        xtype:'numberfield'
                    });
        },
        displayField:function(model, cfg) {
            return Ext.apply(cfg,{
                xtype:'displayfield'
            });
        },
        dateField:function(model, cfg){
            return Ext.apply(cfg,{
                xtype:'datefield'
            });
        },
        timeField :function(model, cfg) {
            return Ext.apply(cfg,{
                xtype:'timefield'
            });
        },
        comboBox:function(model, cfg) {
            var store = undefined;
            //попробуем найти стор
            for (var i = 0; i < model.childNodes.length; i++) {
                if (model.childNodes[i].attributes.type == 'arrayStore') {
                    store = new Ext.data.ArrayStore(
                                Ext.apply({
                                    fields:['id',model.attributes.properties.displayField]
                                },model.childNodes[i].attributes.properties)
                            );
                }
            }
            //или создадим пустой
            if (!store) {
                store = new Ext.data.Store({
                    autoDestroy:true
                });
            }
            return Ext.apply( cfg , {
                        store:store,
                        mode:'local',
                        xtype:'combo'
                    });
        },
        triggerField:function(model, cfg) {
            return Ext.apply(cfg,{
                xtype:'trigger'
            });
        },
        dictSelect:function(model, cfg) {
            return Ext.apply(cfg,{
                        xtype:'designer-dict-select'
            });
        },
        tabPanel:function(model, cfg) {
            return Ext.apply(cfg,{
                        xtype:'tabpanel',
                        deferredRender:false,
                        activeTab: model.attributes.activeTabId ?
                                model.attributes.activeTabId : model.attributes.properties.activeTab,
                        listeners:{
                            tabchange:function(panel, tab) {
                                var modelId = M3Designer.Utils.parseModelId(panel.id);
                                var tabPanelModel = model.ownerTree.findModelById(modelId);
                                tabPanelModel.attributes.activeTabId = tab.id;
                            }
                        }
                    });
        },
        gridPanel:function(model, cfg) {
            var columns = [];

            //поиск колонок
            for (var i = 0; i < model.childNodes.length; i++) {
                if (model.childNodes[i].attributes.type == 'gridColumn') {
                      var newColumn = Ext.apply({},model.childNodes[i].attributes.properties);
                      columns.push(newColumn);
                }
            }

            //если нет колонок, создадим фейк
            if (columns.length == 0) {
                columns.push({
                    id:'fake',
                    header:'Fake column',
                    dataIndex:'fake',
                    menuDisabled:true
                });
            }

             var store = undefined;
            //попробуем найти стор
            for (var i = 0; i < model.childNodes.length; i++) {
                if (model.childNodes[i].attributes.type == 'arrayStore') {

                    //TODO доделать
                    var fields = ['id'];
                    for (var k=0; k<columns.length;k++) {

                    }

                    store = new Ext.data.ArrayStore(
                                Ext.apply({},model.childNodes[i].attributes.properties)
                            );
                }
            }
            //или создадим пустой
            if (!store) {
                store = new Ext.data.Store({
                    autoDestroy:true
                });
            }

            return  Ext.apply(cfg, {
                xtype:'grid',
                cls:'designContainer designComponent',
                id: M3Designer.Utils.parseDomId(model.id),
                store: store,
                colModel:new Ext.grid.ColumnModel({
                    columns:columns
                })
            });
        },
        toolbar:function(model,cfg) {
            return Ext.apply(cfg,{
                xtype:'toolbar'
            });
        },
        tbfill:function(model,cfg) {
            return Ext.apply(cfg,{
                xtype:'tbfill'
            });
        },
        tbseparator:function(model,cfg) {
            return Ext.apply(cfg,{
                xtype:'tbseparator'
            });
        },
        tbspacer:function(model,cfg) {
            return Ext.apply(cfg,{
                xtype:'tbspacer'
            });
        },
        tbtext:function(model,cfg) {
            return Ext.apply(cfg,{
                xtype:'tbtext'
            });
        },
        pagingToolbar:function(model,cfg) {
            return Ext.apply(cfg,{
                xtype:'paging'
            });
        }
    };

    return {
        /**
         * Возвращает конфиг
         */
        build:function(model) {
            var cfg = Ext.apply({}, model.attributes.properties);
            cfg.id = M3Designer.Utils.parseDomId(model.id);
            if (M3Designer.Types.isTypeContainer(model.attributes.type)) {
                cfg.cls = 'designContainer designComponent';
                cfg.items = [];
            }
            else {
                cfg.cls = 'designComponent';
            }
            if (mapObject.hasOwnProperty(model.attributes.type)) {
                return mapObject[model.attributes.type](model, cfg);
            }
        }
    }
}();