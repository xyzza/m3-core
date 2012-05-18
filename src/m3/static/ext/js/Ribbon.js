Ext3.namespace('Ext3.ux.Ribbon');

Ext3.ux.Ribbon = Ext3.extend(Ext3.TabPanel, {

    titleId: null,

    constructor: function(config){
        this.titleId = new Array();

        Ext3.apply(config, {
            baseCls: "x3-plain ui-ribbon",
            margins: "0 0 0 0",
            // plugins: new Ext3.ux.TabScrollerMenu({
            //     maxText: 15,
            //     pageSize: 5
            // }),
            //enableTabScroll: true,
            plain: true,
            border: false,
            deferredRender: false,
            layoutOnTabChange: true,
            title: '',
            //collapsible: true,
            activeTab: 0,
            listeners: {
                beforetabchange: function(tp, ntb, ctb){
                    tp.expand();
                },
                afterrender: {
                    scope: this,
                    fn: function(){
                        //this.expand();
                        //this.doLayout();
                        if (this.titleId.length > 0){
                            for (var key = 0; key < this.titleId.length; key++){
                                r = Ext3.get(this.titleId[key].id);
                                if (r)
                                r.on('click', this.titleId[key].fn);
                            }
                        }
                    }
                }
            }
        });

        Ext3.apply(this, Ext3.apply(this.initialConfig, config));

        if (config.items){
            for (var i = 0; i < config.items.length; i++)
            this.initRibbon(config.items[i], i);
        }

        Ext3.ux.Ribbon.superclass.constructor.apply(this, arguments);
        
    },

    initRibbon: function(item, index){
        var tbarr = new Array();
        for (var j = 0; j < item.ribbon.length; j++){
            // for (var i = 0; i < item.ribbon[j].items.length; i++){
            //                             if (item.ribbon[j].items[i].scale !== "small"){
            //                                 item.ribbon[j].items[i].text = String(item.ribbon[j].items[i].text).replace(/[ +]/gi, "<br/>");
            //                             }
            //                         }
            c = {
                xtype: "buttongroup",
                cls: "x3-btn-group-ribbonstyle",
                defaults: {
                    scale: "small",
                    iconAlign: "left",
                    minWidth: 40
                },
                items: item.ribbon[j].items
            };

            title = item.ribbon[j].title || '';
            topTitle = item.ribbon[j].topTitle || false;
            onTitleClick = item.ribbon[j].onTitleClick || false;

            if (onTitleClick){
                titleId = 'ux-ribbon-' + Ext3.id();
                title = '<span id="' + titleId + '" style="cursor:pointer;">' + title + '</span>';
                this.titleId.push({
                    id: titleId,
                    fn: onTitleClick
                });
            }
            if (title !== ''){
                if (!topTitle){
                    Ext3.apply(c, {
                        footerCfg: {
                            cls: "x3-btn-group-header x3-unselectable",
                            tag: "span",
                            html: title
                        }
                    });
                } else{
                    Ext3.apply(c, {
                        title: title
                    });
                }
            }

            cfg = item.ribbon[j].cfg || null;

            if (cfg){
                Ext3.applyIf(c, item.ribbon[j].cfg);
                if (cfg.defaults)
                Ext3.apply(c.defaults, cfg.defaults);
            }

            tbarr.push(c);
        }

        Ext3.apply(item, {
            baseCls: "x3-plain",
            tbar: tbarr
        });
    }
});