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
        textField:function(model, cfg) {
            return new Ext.form.TextField(
                    Ext.apply(cfg,{
                        readOnly:true
                    })
                );
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
            return mapObject[model.attributes.type](model, cfg);
        }
    }
}();