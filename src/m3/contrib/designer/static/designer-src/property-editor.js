/**
 * Crafted by ZIgi
 */

/**
 *  Классы для работы с редактором свойств.
 */


/**
 * Класс предоставляет внешний интерфейс для контроллера. Он управляет показом окошка с редакторами свойств, содержит
 * в себе необходимые структуры данных и обновляет модель. При обновлении модели зажигается событие modelUpdate
 */

PropertyEditorManager = Ext.extend( Ext.util.Observable, {
    constructor:function() {
        PropertyEditorManager.superclass.constructor.call(this);
        this.addEvents('modelUpdate');
    },
    editModel:function(model) {
        //конфиг объект для PropertyGrid'а
        var cfg = ModelTypeLibrary.getTypeDefaultProperties(model.attributes.type);
        for (var p in model.attributes.properties) {
            if (cfg.hasOwnProperty(p)) {
                cfg[p] = model.attributes.properties[p];
            }
        }
        var window = new PropertyWindow({
            source:cfg,
            model:model
        });
        window.on('save', this.saveModel.createDelegate(this));
        window.show();
    },
    saveModel:function(eventObj) {
        // в ивент обжекте приходят объект модели и объект source из грида
        // далее копируются свойства из сурса в атрибуты модели, при условии что пользователь
        // менял что в свойстве(те значения отличается от дефолтного или значение было хоть раз задано, что
        // требуется если пользователь поменял значение на равное дефолтному)

        var defaults = ModelTypeLibrary.getTypeDefaultProperties(eventObj.model.attributes.type);
        var model = eventObj.model;
        var source = eventObj.source;

        for (var s in source) {
            if ((source[s] != defaults[s]) || ( model.attributes.properties.hasOwnProperty(s)) ) {
                model.attributes.properties[s] = source[s];
            }
        }
        this.fireEvent('modelUpdate');
    }
});


/**
 *  Преднастроеное окно со свойствами объекта. При нажатии кнопки сохранить генерируется событие save, на него
 * подвешен класс менеджера
 */

PropertyWindow = Ext.extend(Ext.Window, {
    listEditors:{
        'layout':['auto','fit','form','hbox','vbox','border','absolute'],
        'labelAlign':['left','top']
    },
    /**
     * Параметры конфига:
     * cfg.source = {} - то что редактируется проперти гридом
     * cfg.model = ... ссылка на модель
     * @param cfg
     */
    constructor:function(cfg) {
        Ext.apply(this, cfg);
        PropertyWindow.superclass.constructor.call(this);
    },
    initComponent: function(cfg) {
        this.addEvents('save');
        this._grid = new Ext.grid.PropertyGrid({
                        autoHeight: true,
                        source: this.source,
                        customEditors:{
                            'layout': this._get_combo_editor('layout'),
                            'labelAlign':this._get_combo_editor('labelAlign')
                        }
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

        PropertyWindow.superclass.initComponent.call(this);
    },
    show:function( ) {
        PropertyWindow.superclass.show.call(this);
    },
    _get_combo_editor:function(propertyName) {
        var data = [];
        var ar = this.listEditors[propertyName];
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
    _onSave:function() {
        //TODO прикрутить валидацию
        var eventObj = {
            source:this._grid.getSource(),
            model:this.model
        };

        this.fireEvent('save', eventObj);
        this.hide();
    },
    _onClose:function() {
        this.hide();
    }
});