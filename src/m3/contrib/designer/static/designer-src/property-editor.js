/**
 * Crafted by ZIgi
 */

Ext.namespace('M3Designer.edit');

/**
 *  Классы для работы с редактором свойств.
 */


/**
 * Класс предоставляет внешний интерфейс для контроллера. Он управляет показом окошка с редакторами свойств, содержит
 * в себе необходимые структуры данных и обновляет модель. При обновлении модели зажигается событие modelUpdate
 */

M3Designer.edit.PropertyEditorManager = Ext.extend( Ext.util.Observable, {
    constructor:function() {
        M3Designer.edit.PropertyEditorManager.superclass.constructor.call(this);
        this.addEvents('modelUpdate');
    },
    editModel:function(model) {
        var cfg = this.initConfig(model);
        var window = new M3Designer.edit.PropertyWindow({
            source:cfg,
            model:model
        });
        window.on('save', this.saveModel.createDelegate(this));
        window.show();
    },
    /**
     * Отображение свойств (аля delphi)
     */
    editModelInline:function(model) {
    	
    	// Грубый подбор компонента
    	var idCmp = 'property-panel';
        var panel = Ext.getCmp(idCmp);   
        if (panel) {
	        var cfg = this.initConfig(model);
	        var propertyGrid = new M3Designer.edit.InlinePropertyGrid({
	            source:cfg,
	            model:model
	        });
			propertyGrid.on('save', this.saveModel.createDelegate(this));
	
			// Нужно найти компонент
			var idCmp = 'property-panel';
	        var panel = Ext.getCmp(idCmp);        
	        panel.removeAll();
	        panel.setTitle('Свойства (' + cfg.id + ')');
	        panel.add(propertyGrid);
	        panel.doLayout();   
	        
	        var accorditionView = panel.ownerCt;         
	        if (accorditionView.items.itemAt(1).collapsed) {
	        	accorditionView.items.itemAt(1).expand();	
	        }
        }
    },
    /**/
    quickEditModel:function(model) {
        var cfg = this.initConfig(model, true);
        var window = new M3Designer.edit.QuickPropertyWindow({
            source:cfg,
            model:model
        });
        window.anchorWinTo(model.id);
        window.on('save', this.saveModel.createDelegate(this));
        window.show();
        return window.id
    },
    initConfig:function(model, quickEditProperties){
        //конфиг объект для PropertyGrid'а
        //getQuickEditProperties [boolean]
        
        var modelAttrType = model.attributes.type;
        var modelAttrProperties = model.attributes.properties;
        
        var cfg = (quickEditProperties ?
                M3Designer.Types.getQuickEditProperties(modelAttrType):
                M3Designer.Types.getTypeDefaultProperties(modelAttrType));
        for (var p in modelAttrProperties) {
            if (cfg.hasOwnProperty(p)) {
                cfg[p] = modelAttrProperties[p];

                if ((cfg[p]) == undefined) {
                    cfg[p] = 'undefined';
                }

                if (M3Designer.Types.isPropertyObject(modelAttrType, p)) {
                    cfg[p] = Ext.util.JSON.encode(cfg[p]);
                }
            }
        }
        return cfg
    },
    saveModel:function(eventObj) {
        // в ивент обжекте приходят объект модели и объект source из грида
        // далее копируются свойства из сурса в атрибуты модели, при условии что пользователь
        // менял что в свойстве(те значения отличается от дефолтного или значение было хоть раз задано, что
        // требуется если пользователь поменял значение на равное дефолтному)
        var defaults = M3Designer.Types.getTypeDefaultProperties(eventObj.model.attributes.type);
        var model = eventObj.model;
        var source = eventObj.source;

        for (var s in source) {
            if ((source[s] != defaults[s]) || ( model.attributes.properties.hasOwnProperty(s)) ) {
                if (M3Designer.Types.isPropertyObject(model.attributes.type, s)) {
                    model.attributes.properties[s] = Ext.isEmpty(source[s]) ? undefined :
                            Ext.util.JSON.decode(source[s])
                }
                else {
                    model.attributes.properties[s] = source[s];
                }
            }
        }
        this.fireEvent('modelUpdate');
    }
});

/**
 * Окно быстрой настройки объекта
 */
M3Designer.edit.QuickPropertyWindow = Ext.extend(Ext.Window, {
    layout: 'form',
    autoWidth: true,
    autoHeight:true,
    draggable: false,
    resizable: false,
    closable: false,
    border:false,
    plain: true,
    titleCollapse: true,
    collapsible: true,
    hideCollapseTool: true,
    title:'',
    baseCls: 'x-tipcustom',
    iconCls: 'x-tipcustom-icon',
    
    constructor:function(cfg) {
        Ext.apply(this, cfg);
        M3Designer.edit.QuickPropertyWindow.superclass.constructor.call(this);
    },
    initComponent: function(cfg) {
        var customEditors = {};
        var modelItems = [];

        this._setup_panel_customs(customEditors);

        for (var i in customEditors) modelItems.push(customEditors[i])

        Ext.apply(this, {
            items: modelItems
            /** Обработчики на события mouseover (раскрывает),
             * mouseout(сворачивает) панель
            **/
//            listeners: {
//                render: function(p, e) {
//                    p.el.on('mouseover', function(e){
//                        if(!e.within(Ext.get(p.el.id), true)) {
//                            if (p.collapsed) p.expand();
//                        }
//                    }, this, p.el.id);
//                    p.el.on('mouseout', function(e){
//                        if(!e.within(Ext.get(p.el.id), true)) {
//                            if (!p.collapsed) p.collapse();
//                    }
//                }, this, p.el.id);
//              }
//            }
        });

        M3Designer.edit.QuickPropertyWindow.superclass.initComponent.call(this);
    },
    anchorWinTo:function(modeId){
        M3Designer.edit.QuickPropertyWindow.superclass.show.call(this);
        this.collapse(false);
        var domElementId = M3Designer.Utils.parseDomId(modeId);
        this.anchorTo(document.getElementById(domElementId), "tr-tr");
        this.setTitle(this.source['id']||'');
    },
    /**/
    _setup_panel_customs:function(customEditorsCfg) {
        for (var p in this.source) {
            var type = M3Designer.Types.getPropertyType(this.model.attributes.type, p);
            
            if (type == 'object') {
                customEditorsCfg[p] = this._get_code_editor(p);
            }
            else if (type == 'enum') {
                customEditorsCfg[p] = this._get_combo_editor(p);
                customEditorsCfg[p].on('select', this._onSave.createDelegate(this))
            }
            else if (type == "number") {
                customEditorsCfg[p] = this._get_number_editor(p);
            }
            else if (type == "string"){
                customEditorsCfg[p] = this._get_string_editor(p);
            }
            else if (type == "boolean") {
                customEditorsCfg[p] = this._get_boolean_editor(p);
                customEditorsCfg[p].on('check', this._onSave.createDelegate(this))
            }
            type != "undefined" ? customEditorsCfg[p].on('change', this._onSave.createDelegate(this)) : 0
            
        }
    },
    _get_number_editor:function(propertyName){
         var numberField = new Ext.form.NumberField({
                    width: 120,
                    fieldLabel: propertyName,
                    value: this.source[propertyName]
         });
        return numberField;
    },
    _get_string_editor:function(propertyName){
        var textField = new Ext.form.TextField({
            width: 120,
            fieldLabel: propertyName,
            value: this.source[propertyName]
        });
        return textField;
    },
    _get_boolean_editor:function(propertyName){
        var booleanField = new Ext.form.Checkbox({
            fieldLabel: propertyName,
            checked:this.source[propertyName]
        });
        return booleanField;
    },
    _get_combo_editor:function(propertyName) {
        var data = [];
        var ar = M3Designer.Types.getEnumValues(propertyName);
        for (var i=0;i<ar.length;i++) {
            data.push([ar[i]]);
        }

        var store = new Ext.data.ArrayStore({
            autoDestroy:true,
            idIndex:0,
            fields:['name'],
            data:data
        });
        
        var result = new Ext.form.ComboBox({
            width: 120,
            fieldLabel:propertyName,
            value: this.source[propertyName],
            store:store,
            displayField:'name',
            mode:'local',
            triggerAction:'all',
            editable:false,
            selectOnFocus:true
        });
        return result;
    },
    _get_code_editor:function(property) {
        return new Ext.grid.GridEditor(new Ext.form.TextArea({value:'{Object}'}));
    },
    _onSave:function(obj, newValue) {
        var itemsObj = {};
        var nVal =  typeof newValue == 'object' ? newValue.id: newValue
        itemsObj[obj['fieldLabel']] = nVal;
/* Если будет изменение более одного элемента*/
//        var items = this.items.items;
//        for (var i in items)
//            itemsObj[items[i]['fieldLabel']] = items[i]['value']

        var eventObj = {
            source: itemsObj,
            model:this.model
        };
        
        this.fireEvent('save', eventObj);
        this.close();
    }
});

/**
 *  Преднастроеное окно со свойствами объекта. При нажатии кнопки сохранить генерируется событие save, на него
 * подвешен класс менеджера
 */

M3Designer.edit.PropertyWindow = Ext.extend(Ext.Window, {
    //autoScroll:true,
    /**
     * Параметры конфига:
     * cfg.source = {} - то что редактируется проперти гридом
     * cfg.model = ... ссылка на модель
     * @param cfg
     */
    constructor:function(cfg) {
        Ext.apply(this, cfg);
        M3Designer.edit.PropertyWindow.superclass.constructor.call(this);
    },
    initComponent: function(cfg) {
        this.addEvents('save');

        var customEditors = {};
        var customRenderers = {};
        this._setup_grid_customs(customEditors, customRenderers);

        this._grid = new Ext.grid.PropertyGrid({
                        source: this.source,
                        customEditors:customEditors,
                        customRenderers:customRenderers
                    });

        Ext.apply(this, {
            height:400,
            width:400,
            title:'Редактирование компонента',
            layout:'fit',
            items:[this._grid],
            buttons:[
                new Ext.Button({text:'Сохранить',handler:this._onSave.createDelegate(this) }),
                new Ext.Button({ text:'Отмена', handler:this._onClose.createDelegate(this) })
            ]
        });

        M3Designer.edit.PropertyWindow.superclass.initComponent.call(this);
    },
    show:function( ) {
        M3Designer.edit.PropertyWindow.superclass.show.call(this);
    },
    _setup_grid_customs:function(customEditorsCfg, customRenderersCfg) {
        for (var p in this.source) {
            var type = M3Designer.Types.getPropertyType(this.model.attributes.type, p);
            if (type == 'object') {
                customEditorsCfg[p] = this._get_code_editor();
                customRenderersCfg[p] = function() { return '{Object}'; }
            }
            else if (type == 'enum') {
                customEditorsCfg[p] = this._get_combo_editor(p);
            }
        }
    },
    _get_combo_editor:function(propertyName) {
        var data = [];
        var ar = M3Designer.Types.getEnumValues(propertyName);
        for (var i=0;i<ar.length;i++) {
            data.push([ar[i]]);
        }

        var store = new Ext.data.ArrayStore({
            autoDestroy:true,
            idIndex:0,
            fields:['name'],
            data:data
        });
        var result = new Ext.form.ComboBox({
            store:store,
            displayField:'name',
            mode:'local',
            triggerAction:'all',
            editable:false,
            selectOnFocus:true
        });
        return new Ext.grid.GridEditor(result);
    },
    _get_code_editor:function() {
        return new Ext.grid.GridEditor(
                    new Ext.form.TextArea()
                );
    },
    _onSave:function() {
        //TODO прикрутить валидацию
        var source = this._grid.getSource();
        var eventObj = {
            source:source,
            model:this.model
        };

        this.fireEvent('save', eventObj);
        this.hide();
    },
    _onClose:function() {
        this.hide();
    }
});

/**
 * Грид для встраивания в панель свойств
 */
M3Designer.edit.InlinePropertyGrid = Ext.extend(Ext.grid.PropertyGrid, {    
    /**
     * Параметры конфига:
     * cfg.source = {} - то что редактируется проперти гридом
     * cfg.model = ... ссылка на модель
     * @param cfg
     */
    constructor:function(cfg) {
        Ext.apply(this, cfg);        
        M3Designer.edit.InlinePropertyGrid.superclass.constructor.call(this);
    },
    initComponent: function(cfg) {
        this.addEvents('save');

        var customEditors = {};
        var customRenderers = {};
		this._setup_grid_customs(customEditors, customRenderers);
		
		Ext.apply(this, {
			customEditors: customEditors,
			customRenderers: customRenderers
		});
		
		this.on('propertychange', this._onSave.createDelegate(this))

        M3Designer.edit.InlinePropertyGrid.superclass.initComponent.call(this);
    },
    _setup_grid_customs:function(customEditorsCfg, customRenderersCfg) {
        for (var p in this.source) {
            var type = M3Designer.Types.getPropertyType(this.model.attributes.type, p);
            if (type == 'object') {
                customEditorsCfg[p] = this._get_code_editor();
                customRenderersCfg[p] = function() { return '{Object}'; }
            }
            else if (type == 'enum') {
                customEditorsCfg[p] = this._get_combo_editor(p);
            }            
        }
    },
    _get_combo_editor:function(propertyName) {
        var data = [];
        var ar = M3Designer.Types.getEnumValues(propertyName);
        for (var i=0;i<ar.length;i++) {
            data.push([ar[i]]);
        }

        var store = new Ext.data.ArrayStore({
            autoDestroy:true,
            idIndex:0,
            fields:['name'],
            data:data
        });
        var result = new Ext.form.ComboBox({
            store:store,
            displayField:'name',
            mode:'local',
            triggerAction:'all',
            editable:false,
            selectOnFocus:true
        });
        return new Ext.grid.GridEditor(result);
    },
    _get_code_editor:function() {
        return new Ext.grid.GridEditor(
                    new Ext.form.TextArea()
                );
    },
    _onSave:function() {
        var eventObj = {
            source: this.getSource(),
            model:this.model
        };
        this.fireEvent('save', eventObj);        
    }
});