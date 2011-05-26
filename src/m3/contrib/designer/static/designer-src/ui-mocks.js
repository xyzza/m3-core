/**
 * Crafted by ZIgi
 */
Ext.namespace('M3Designer.ui');

/*
* Здесь расположены классы компонентов имитирующие м3 компоненты. Почему не использовать настоящие?
* Во первых чтобы не было оверхеда, во вторых большинство м3 кастомов написано криво и не поддерживают xtype
*/

/**
 * @class M3Designer.ui.DictSelectMock
 * Фейк для выбора из справочника
 */
M3Designer.ui.DictSelectMock = Ext.extend(Ext.form.TwinTriggerField, {
    width: 150,
    trigger1Class: 'x-form-clear-trigger',
    trigger2Class: 'x-form-select-trigger',
    initComponent: function () {
        M3Designer.ui.DictSelectMock.superclass.initComponent.call(this);
    }
});

Ext.reg('designer-dict-select', M3Designer.ui.DictSelectMock);

//TODO: Отрефакторить
M3Designer.ui.KladrCompanent = Ext.extend(Ext.Container,{
    constructor: function(params){
        var zipcode = {
                    xtype: 'textfield',
                    width: 55,
                    emptyText: 'индекс'
                    };
        var place = {
                    xtype: 'textfield',
                    fieldLabel: params.placeLabel,
                    allowBlank: params.placeAllowBlank,
                    emptyText: 'Введите населенный пункт...'
                    };
        var street = {
                    xtype: 'textfield',
                    fieldLabel: params.streetLabel,
                    allowBlank: params.streetAllowBlank,
                    emptyText: 'Введите улицу...'
                    };
        var house = {
                    xtype: 'textfield',
                    allowBlank: params.houseAllowBlank,
                    fieldLabel: params.houseLabel,
                    emptyText: '',
                    width: 40
                    };
        var flat = {
                    xtype: 'textfield',
                    fieldLabel: params.flatLabel,
                    allowBlank: params.flatAllowBlank,
                    emptyText: '',
                    width: 40
                    };
        var addr = {
                    xtype: 'textfield',
                    anchor: '100%',
                    fieldLabel: params.addrLabel,
                    height: 36
                    };
        var level = M3Designer.model.ModelTypeLibrary.enumConfig.level.indexOf(params.level) + 1;
        var viewMode = M3Designer.model.ModelTypeLibrary.enumConfig.viewMode.indexOf(params.viewMode) + 1;
        var items = [];
        if (viewMode == 1){
                place.flex = 1;
            if (level > 2) {
                var row_items = [place, zipcode];
            } else {
                var row_items = [place];
            }
            if (level > 1) {
                street.flex = 1;
                row_items.push({
                    xtype: 'label',
                    style: {padding:'3px'},
                    text: params.streetLabel+':'
                }, street);

                if (level > 2) {
                house.fieldLabel = params.placeLabel;
                row_items.push({
                        xtype: 'label'
                        ,style: {padding:'3px'}
                        ,text: params.houseLabel+':'
                    }, house);
                if (level > 3) {
                    flat.fieldLabel = params.placeLabel;
                    row_items.push({
                            xtype: 'label'
                            ,style: {padding:'3px'}
                            ,text: params.flatLabel+':'
                        }, flat);
                    }
                }
            }
            var row = {
                xtype: 'compositefield',
                anchor: '100%',
                fieldLabel: params.placeLabel,
                items: row_items
                };
            items.push(row);
        }
        if (viewMode == 2){
            // В две строки
            if (level > 2) {
                place.flex = 1;
                var row = {
                    xtype: 'compositefield'
                    , anchor: '100%'
                    , fieldLabel: params.placeLabel
                    , items: [place, zipcode]
                };
                items.push(row);
            } else {
                place.anchor = '100%';
                items.push(place);
            }
            if (level > 1) {
                street.flex = 1;
                var row_items = [street];
                if (level > 2) {
                    house.fieldLabel = params.streetLabel;
                    row_items.push({
                            xtype: 'label'
                            ,style: {padding:'3px'}
                            ,text: params.houseLabel+':'
                    }, house);
                    if (level > 3) {
                        flat.fieldLabel = params.streetLabel;
                        row_items.push({
                                xtype: 'label'
                                ,style: {padding:'3px'}
                                ,text: params.flatLabel+':'
                        }, flat);
                    }
                }
                var row = {
                    xtype: 'compositefield'
                    , anchor: '100%'
                    , fieldLabel: params.streetLabel
                    , items: row_items
                };
                items.push(row);
            }
        }
        if (viewMode == 3){
            // В три строки
            if (level > 2) {
                place.flex = 1;
                var row = {
                    xtype: 'compositefield'
                    , anchor: '100%'
                    , fieldLabel: params.placeLabel
                    , items: [place, zipcode]
                };
                items.push(row);
            } else {
                place.anchor = '100%';
                items.push(place);
            }
            if (level > 1) {
                street.anchor = '100%';
                items.push(street);
                if (level > 2) {
                    var row_items = [{
                        xtype: 'container'
                        , layout: 'form'
                        , items: house
                        , style: {overflow: 'hidden'}
                    }];
                    if (level > 3) {
                        row_items.push({
                            xtype: 'container'
                            , layout: 'form'
                            , style: {padding: '0px 0px 0px 5px', overflow: 'hidden'}
                            , items: flat
                        });
                    }
                    var row = new Ext.Container({
                        anchor: '100%'
                        , layout: 'column'
                        , items: row_items
                        , style: {overflow: 'hidden'}
                    });
                    items.push(row);
                }
            }
        }
        if (items && params.addrVisible) {
            items.push(addr);
        }
        Ext.apply(params, {
                items: items
            });
        Ext.Container.superclass.constructor.call(this, params);
    },
    initComponent: function () {
        M3Designer.ui.KladrCompanent.superclass.initComponent.call(this);
    }
})

Ext.reg('designer-kladr-companent', M3Designer.ui.KladrCompanent);