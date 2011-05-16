/**
 * Crafted by ZIgi
 */
Ext.namespace('M3Designer.edit');

/*
 *  Классы для редактирования свойств компонентов
 */

/**
 * @class M3Designer.edit.PropertyEditorManager
 * Класс предоставляет внешний интерфейс для контроллера. Он управляет показом окошка с редакторами свойств, содержит
 * в себе необходимые структуры данных и обновляет модель. При обновлении модели зажигается событие modelUpdate
 */
M3Designer.edit.PropertyEditorManager = Ext.extend(Ext.util.Observable, {
    constructor: function () {
        M3Designer.edit.PropertyEditorManager.superclass.constructor.call(this);
        this.addEvents('modelUpdate');
    },

    /**
     * Редактирование в окошке
     */
    editModel: function (model) {
        var cfg = this.initConfig(model);
        var window = new M3Designer.edit.PropertyWindow({
            source: cfg,
            model: model
        });
        window.on('save', this.saveModel.createDelegate(this));
        window.show();
    },

    /**
     * Отображение свойств (аля delphi)
     */
    editModelInline: function (model) {
        // Грубый подбор компонента
        var idCmp = 'property-panel';
        var panel = Ext.getCmp(idCmp);
        if (panel) {
            var cfg = this.initConfig(model);
            var propertyGrid = new M3Designer.edit.InlinePropertyGrid({
                source: cfg,
                model: model
            });
            propertyGrid.on('save', this.saveModel.createDelegate(this));
            // Нужно найти компонент
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

    /**
     * Редактирование в квик эдиторе
     */
    quickEditModel: function (model) {
        var cfg = this.initConfig(model, true);
        var window = new M3Designer.edit.QuickPropertyWindow({
            source: cfg,
            model: model
        });
        window.anchorWinTo(model.id);
        window.on('save', this.saveModel.createDelegate(this));
        window.show();
        return window.id;
    },

    /**
     * Инициализация
     */
    initConfig: function (model, quickEditProperties) {
        //конфиг объект для PropertyGrid'а
        var modelAttrType = model.attributes.type;
        var modelAttrProperties = model.attributes.properties;
        var p;

        var cfg = (quickEditProperties ? M3Designer.Types.getQuickEditProperties(modelAttrType) :
            M3Designer.Types.getTypeDefaultProperties(modelAttrType));
        
        for (p in modelAttrProperties) {
            if (modelAttrProperties.hasOwnProperty(p) && cfg.hasOwnProperty(p)) {
                cfg[p] = modelAttrProperties[p];

                if ((cfg[p]) === undefined) {
                    cfg[p] = 'undefined';
                }

                if (M3Designer.Types.isPropertyObject(modelAttrType, p)) {
                    cfg[p] = Ext.util.JSON.encode(cfg[p]);
                }
            }
        }
        return cfg;
    },

    /**
     * Сохранение модели
     */
    saveModel: function (eventObj) {
        // в ивент обжекте приходят объект модели и объект source из грида
        // далее копируются свойства из сурса в атрибуты модели, при условии что пользователь
        // менял что в свойстве(те значения отличается от дефолтного или значение было хоть раз задано, что
        // требуется если пользователь поменял значение на равное дефолтному)
        var defaults = M3Designer.Types.getTypeDefaultProperties(eventObj.model.attributes.type);
        var model = eventObj.model;
        var source = eventObj.source;
        var s;

        //проверка на пересечение id моделей
        if (source.id) {
            var existingModel = model.ownerTree.findModelByPropertyValue('id', source.id);
            if (existingModel) {
                if (existingModel !== model) {
                    Ext.MessageBox.alert('Ошибка', 'id компонента совпадает с уже существующим значением');
                    return undefined;
                }
            }
        }

        for (s in source) {
            if (source.hasOwnProperty(s) &&
                    ((source[s] !== defaults[s]) || (model.attributes.properties.hasOwnProperty(s)))) {
                if (M3Designer.Types.isPropertyObject(model.attributes.type, s)) {
                    model.attributes.properties[s] = Ext.isEmpty(source[s]) ? undefined : Ext.util.JSON.decode(source[s]);
                } else {
                    model.attributes.properties[s] = source[s];
                }
            }
        }
        this.fireEvent('modelUpdate');
    }
});

/**
 * @class M3Designer.edit.QuickPropertyWindow
 * Окно быстрой настройки объекта
 */
M3Designer.edit.QuickPropertyWindow = Ext.extend(Ext.Window, {
    layout: 'form',
    shadow: false,
    autoWidth: true,
    autoHeight: true,
    draggable: false,
    resizable: false,
    closable: false,
    border: false,
    plain: true,
    titleCollapse: true,
    collapsible: true,
    hideCollapseTool: true,
    title: '',
    baseCls: 'x-tipcustom',
    iconCls: 'x-tipcustom-icon',

    initComponent: function () {
        var customEditors = {};
        var modelItems = [];
        var i;

        this.setupPanelCustoms(customEditors);

        for (i in customEditors) {
            if (customEditors.hasOwnProperty(i)) {
                modelItems.push(customEditors[i]);
            }
        }

        Ext.apply(this, {
            items: modelItems
        });

        M3Designer.edit.QuickPropertyWindow.superclass.initComponent.call(this);
    },
    anchorWinTo: function (modelId) {
        M3Designer.edit.QuickPropertyWindow.superclass.show.call(this);
        var domElementId = M3Designer.Utils.parseDomId(modelId);
        var collapsedHeigth = this.getHeight();
        this.collapse(false);
        this.anchorTo(document.getElementById(domElementId), "tr-tr");
        /*Если окно будет выходить за видимые границы, переместим его в видимую область*/
        var panelSizeHeight = Ext.getCmp('tab-panel').getActiveTab().getSize().height;
        if (this.y + collapsedHeigth > panelSizeHeight) {
            this.on('expand', function(){
                this.getEl().shift({
                    y: this.y - (this.y + collapsedHeigth - panelSizeHeight),
                    easing: 'easeOut',
                    duration: 0.35
                });
            });
            this.on('collapse', function(){
                this.getEl().shift({
                    y: this.y,
                    easing: 'easeIn',
                    duration: 0.35
                });
            });
        };
        this.setTitle(this.source.id || '');
    },
    /**/
    setupPanelCustoms: function (customEditorsCfg) {
        var p;

        for (p in this.source) {
            if (this.source.hasOwnProperty(p)) {
                var type = M3Designer.Types.getPropertyType(this.model.attributes.type, p);

                if (type === 'object') {
                    customEditorsCfg[p] = this.getCodeEditor(p);
                } else if (type === 'enum') {
                    customEditorsCfg[p] = this.getComboEditor(p);
                    customEditorsCfg[p].on('select', this.onSave.createDelegate(this));
                } else if (type === "number") {
                    customEditorsCfg[p] = this.getNumberEditor(p);
                } else if (type === "string") {
                    customEditorsCfg[p] = this.getStringEditor(p);
                } else if (type === "boolean") {
                    customEditorsCfg[p] = this.getBooleanEditor(p);
                    customEditorsCfg[p].on('check', this.onSave.createDelegate(this));
                }

                if (type !== "undefined") {
                    customEditorsCfg[p].on('change', this.onSave.createDelegate(this));
                }
            }
        }
    },
    getNumberEditor: function (propertyName) {
        return new Ext.form.NumberField({
            width: 120,
            fieldLabel: propertyName,
            value: this.source[propertyName]
        });
    },
    getStringEditor: function (propertyName) {
        return new Ext.form.TextField({
            width: 120,
            fieldLabel: propertyName,
            value: this.source[propertyName]
        });
    },
    getBooleanEditor: function (propertyName) {
        return new Ext.form.Checkbox({
            fieldLabel: propertyName,
            checked: this.source[propertyName]
        });
    },
    getComboEditor: function (propertyName) {
        var data = [];
        var i;

        var ar = M3Designer.Types.getEnumValues(propertyName);
        for (i = 0; i < ar.length; i++) {
            data.push([ar[i]]);
        }

        var store = new Ext.data.ArrayStore({
            autoDestroy: true,
            idIndex: 0,
            fields: ['name'],
            data: data
        });

        return new Ext.form.ComboBox({
            width: 120,
            fieldLabel: propertyName,
            value: this.source[propertyName],
            store: store,
            displayField: 'name',
            mode: 'local',
            triggerAction: 'all',
            editable: false,
            selectOnFocus: true
        });
    },
    getCodeEditor: function () {
        return new Ext.grid.GridEditor(new Ext.form.TextArea({
            value: '{Object}'
        }));
    },
    onSave: function (obj, newValue) {
        var itemsObj = {};
        itemsObj[obj.fieldLabel] = typeof newValue === 'object' ? newValue.id : newValue;

        var eventObj = {
            source: itemsObj,
            model: this.model
        };

        this.fireEvent('save', eventObj); /*Плавное скрытие окна*/
        this.getEl().fadeOut({
            endOpacity: 0,
            easing: 'easeOut',
            duration: 0.5,
            remove: true
        });
    }
});

/**
 * @class M3Designer.edit.PropertyWindow
 * Преднастроеное окно со свойствами объекта. При нажатии кнопки сохранить генерируется событие save, на него
 * подвешен класс менеджера
 */
M3Designer.edit.PropertyWindow = Ext.extend(Ext.Window, {
    /**
     * @constructor
     * @cfg {Object} source то что редактируется проперти гридом
     * @cfg {ComponentModel} model - ссылка на модель
     */
    constructor: function (cfg) {
        Ext.apply(this, cfg);
        M3Designer.edit.PropertyWindow.superclass.constructor.call(this);
    },
    initComponent: function () {
        this.addEvents('save');
        var customEditors = {};
        var customRenderers = {};
        this.setupGridCustoms(customEditors, customRenderers);

        this._grid = new Ext.grid.PropertyGrid({
            source: this.source,
            customEditors: customEditors,
            customRenderers: customRenderers
        });

        Ext.apply(this, {
            height: 400,
            width: 400,
            title: 'Редактирование компонента',
            layout: 'fit',
            items: [this._grid],
            buttons: [
                new Ext.Button({
                    text: 'Сохранить',
                    handler: this.onSave.createDelegate(this)
                }),
                new Ext.Button({
                    text: 'Отмена',
                    handler: this.onClose.createDelegate(this)
                })
            ]
        });

        M3Designer.edit.PropertyWindow.superclass.initComponent.call(this);
    },
    show: function () {
        M3Designer.edit.PropertyWindow.superclass.show.call(this);
    },
    setupGridCustoms: function (customEditorsCfg, customRenderersCfg) {
        var objectRendererFunction = function () {
            return '{Object}';
        };
        var p;


        for (p in this.source) {
            if (this.source.hasOwnProperty(p)) {
                var type = M3Designer.Types.getPropertyType(this.model.attributes.type, p);
                if (type === 'object') {
                    customEditorsCfg[p] = this.getCodeEditor();
                    customRenderersCfg[p] = objectRendererFunction; 
                } else if (type === 'enum') {
                    customEditorsCfg[p] = this.getComboEditor(p);
                }
            }
        }
    },
    getComboEditor: function (propertyName) {
        var data = [];
        var ar = M3Designer.Types.getEnumValues(propertyName);
        var i;

        for (i = 0; i < ar.length; i++) {
            data.push([ar[i]]);
        }

        var store = new Ext.data.ArrayStore({
            autoDestroy: true,
            idIndex: 0,
            fields: ['name'],
            data: data
        });
        var result = new Ext.form.ComboBox({
            store: store,
            displayField: 'name',
            mode: 'local',
            triggerAction: 'all',
            editable: false,
            selectOnFocus: true
        });
        return new Ext.grid.GridEditor(result);
    },
    getCodeEditor: function () {
        return new Ext.grid.GridEditor(
            new Ext.form.TextArea()
        );
    },
    onSave: function () {
        //TODO прикрутить валидацию
        var source = this._grid.getSource();
        var eventObj = {
            source: source,
            model: this.model
        };

        this.fireEvent('save', eventObj);
        this.hide();
    },
    onClose: function () {
        this.hide();
    }
});

/**
 * @class M3Designer.edit.InlinePropertyGrid
 * Грид для встраивания в панель свойств
 */
M3Designer.edit.InlinePropertyGrid = Ext.extend(Ext.grid.PropertyGrid, {
    constructor: function (cfg) {
        Ext.apply(this, cfg);
        M3Designer.edit.InlinePropertyGrid.superclass.constructor.call(this);
    },
    initComponent: function () {
        this.addEvents('save');

        var customEditors = {};
        var customRenderers = {};
        this.setupGridCustoms(customEditors, customRenderers);

        Ext.apply(this, {
            customEditors: customEditors,
            customRenderers: customRenderers
        });

        this.on('propertychange', this.onSave.createDelegate(this));

        M3Designer.edit.InlinePropertyGrid.superclass.initComponent.call(this);
    },
    setupGridCustoms: function (customEditorsCfg, customRenderersCfg) {
        var p;
        var objectRendererFunction = function () {
            return '{Object}';
        };
        
        for (p in this.source) {
            if (this.source.hasOwnProperty(p)) {
                var type = M3Designer.Types.getPropertyType(this.model.attributes.type, p);
                if (type === 'object') {
                    customEditorsCfg[p] = this.getCodeEditor();
                    customRenderersCfg[p] = objectRendererFunction;
                } else if (type === 'enum') {
                    customEditorsCfg[p] = this.getComboEditor(p);
                }
            }
        }
    },
    getComboEditor: function (propertyName) {
        var data = [];
        var ar = M3Designer.Types.getEnumValues(propertyName);
        var i;

        for (i = 0; i < ar.length; i++) {
            data.push([ar[i]]);
        }

        var store = new Ext.data.ArrayStore({
            autoDestroy: true,
            idIndex: 0,
            fields: ['name'],
            data: data
        });
        var result = new Ext.form.ComboBox({
            store: store,
            displayField: 'name',
            mode: 'local',
            triggerAction: 'all',
            editable: false,
            selectOnFocus: true
        });
        return new Ext.grid.GridEditor(result);
    },
    getCodeEditor: function () {
        return new Ext.grid.GridEditor(
            new Ext.form.TextArea()
        );
    },
    onSave: function () {
        var eventObj = {
            source: this.getSource(),
            model: this.model
        };
        this.fireEvent('save', eventObj);
    }
});