/**
 * Crafted by ZIgi
 */

DictSelectMock = Ext.extend(Ext.form.TwinTriggerField, {
    width:150,
    trigger1Class:'x-form-clear-trigger',
    trigger2Class:'x-form-select-trigger',
    initComponent:function() {
        DictSelectMock.superclass.initComponent.call(this);
    }
});

Ext.reg('designer-dict-select', DictSelectMock);