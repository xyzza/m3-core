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
        //debugger;

        var cfg = ModelTypeLibrary.getTypeDefaultProperties(model.attributes.type);
        for (var p in model.attributes) {
            if (cfg.hasOwnProperty(p)) {
                cfg[p] = model.attributes[p];
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
        // далее копируются свойства из сурса в атрибуты модели

        for (var i in eventObj.model.attributes) {
            if (eventObj.source.hasOwnProperty(i) )
            {
                eventObj.model.attributes[i] = eventObj.source[i];
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
                        source: this.source
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