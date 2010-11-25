Ext.ns('Ext.ux.form');

/**
 * @class Ext.ux.form.FileUploadField
 * @extends Ext.form.TextField
 * Creates a file upload field.
 * @xtype fileuploadfield
 */
Ext.ux.form.FileUploadField = Ext.extend(Ext.form.TextField,  {
    /**
     * @cfg {String} buttonText The button text to display on the upload button (defaults to
     * 'Browse...').  Note that if you supply a value for {@link #buttonCfg}, the buttonCfg.text
     * value will be used instead if available.
     */
    buttonText: '',
    /**
     * @cfg {Boolean} buttonOnly True to display the file upload field as a button with no visible
     * text field (defaults to false).  If true, all inherited TextField members will still be available.
     */
    buttonOnly: false,
    /**
     * @cfg {Number} buttonOffset The number of pixels of space reserved between the button and the text field
     * (defaults to 3).  Note that this only applies if {@link #buttonOnly} = false.
     */
    buttonOffset: 0,
    /**
     * @cfg {Object} buttonCfg A standard {@link Ext.Button} config object.
     */

    // private
    readOnly: true,

    /**
     * @hide
     * @method autoSize
     */
    autoSize: Ext.emptyFn,

    /**
     * Для quick tips
     */
    cls: 'tip-target',

    constructor: function(baseConfig, params){
        
        if (params) {
            if (params.prefixUploadField) {
                this.prefixUploadField = params.prefixUploadField;
            }
            if (params.fileUrl) {
                this.fileUrl = params.fileUrl;
            }
        }        
        
        Ext.ux.form.FileUploadField.superclass.constructor.call(this, baseConfig, params);
    },
    
    // private
    initComponent: function(){
        Ext.ux.form.FileUploadField.superclass.initComponent.call(this);

        this.addEvents(
            /**
             * @event fileselected
             * Fires when the underlying file input field's value has changed from the user
             * selecting a new file from the system file selection dialog.
             * @param {Ext.ux.form.FileUploadField} this
             * @param {String} value The file value returned by the underlying file input field
             */
            'fileselected'
        );
    },
    
    // private
    onRender : function(ct, position){
        Ext.ux.form.FileUploadField.superclass.onRender.call(this, ct, position);

        // Используем название файла
        this.value = this.getFileName();

        this.wrap = this.el.wrap({cls:'x-form-field-wrap x-form-file-wrap'});
        this.el.addClass('x-form-file-text');
        //this.el.dom.removeAttribute('name');
        
        this.createFileInput();

        var btnCfg = Ext.applyIf(this.buttonCfg || {}, {
            text: this.buttonText
            ,iconCls: 'x-form-file-image'
        });
        this.buttonFile = new Ext.Button(Ext.apply(btnCfg, {
            renderTo: this.wrap
            ,width: 16
            ,cls: 'x-form-file-btn' + (btnCfg.iconCls ? ' x-btn-icon' : '')
            ,tooltip: 'Выбрать файл'
        }));

        this.buttonClear = new Ext.Button({
            renderTo: this.wrap
            ,width: 16
            ,cls: 'x-form-file-clear'
            ,iconCls: 'x-form-file-clear-image'
            ,handler: this.clickClearField
            ,scope: this
            ,hidden: this.value ? false : true
            ,tooltip: 'Очистить'
        });
        
        this.buttonDownload = new Ext.Button({
            renderTo: this.wrap
            ,width: 16
            ,cls: 'x-form-file-download'
            ,iconCls: 'x-form-file-download-image'
            ,handler: this.clickDownload
            ,scope: this
            ,hidden: this.value ? false : true
            ,tooltip: 'Загрузить'
        });
        
        this.bindListeners();
        this.resizeEl = this.positionEl = this.wrap;

    },
    
    bindListeners: function(){
        this.fileInput.on({
            scope: this,
            mouseenter: function() {
                 this.buttonFile.addClass(['x-btn-over','x-btn-focus'])
             },
             mouseleave: function(){
                 this.buttonFile.removeClass(['x-btn-over','x-btn-focus','x-btn-click'])
             },
             mousedown: function(){
                 this.buttonFile.addClass('x-btn-click')
             },
             mouseup: function(){
                 this.buttonFile.removeClass(['x-btn-over','x-btn-focus','x-btn-click'])
             },                   mouseenter: function() {
                 this.buttonFile.addClass(['x-btn-over','x-btn-focus'])
             },
             mouseleave: function(){
                 this.buttonFile.removeClass(['x-btn-over','x-btn-focus','x-btn-click'])
             },
             mousedown: function(){
                 this.buttonFile.addClass('x-btn-click')
             },
             mouseup: function(){
                                  //     this.button.removeClass(['x-btn-over','x-btn-focus','x-btn-click'])
              },
             change: function(){
                 var v = this.fileInput.dom.value;
                 this.setValue(v);
                 this.fireEvent('fileselected', this, v);   
                 
                 if (v) {
                    // Очищаем ссылку на файл
                    this.fileUrl = null;
                                                         
                    if (!this.buttonClear.isVisible()) {
                        this.buttonClear.show();
                        this.el.setWidth( this.el.getWidth() - this.buttonClear.getWidth());
                    }
                 }
                
             }
        }); 
    },
    
    createFileInput : function() {
        this.fileInput = this.wrap.createChild({
            id: this.getFileInputId(),
            name: (this.prefixUploadField || '') + this.name,
            cls: 'x-form-file',
            tag: 'input',
            type: 'file',
            size: 1,
            width: 20
        });
        
        Ext.QuickTips.unregister(this.fileInput);
        Ext.QuickTips.register({
            target: this.fileInput,
            text: 'Выбрать файл',
            width: 86,
            dismissDelay: 10000 
        });
    },
    
    reset : function(){ 
        this.fileInput.remove();
        this.createFileInput();
        this.bindListeners();
        Ext.ux.form.FileUploadField.superclass.reset.call(this);
    },

    // private
    getFileInputId: function(){
        return this.id + '-file';
    },

    // private
    onResize : function(w, h){
        Ext.ux.form.FileUploadField.superclass.onResize.call(this, w, h);

        this.wrap.setWidth(w);
        var w = this.wrap.getWidth() - this.buttonFile.getEl().getWidth() - this.buttonOffset;
        var btnClearWidth = this.buttonClear.getWidth();
        if (btnClearWidth) {
            w -= btnClearWidth;
        }
        var btnDonwloadWidth = this.buttonDownload.getWidth();
        if (btnDonwloadWidth) {
            w -= btnDonwloadWidth;
        }
        
        if (Ext.isWebKit) {
            // Юлядть 
            // Некорректная верстка в вебкитовских движках
            this.el.setWidth(w + 5);
        } else {
            this.el.setWidth(w);
        }

    },

    // private
    onDestroy: function(){
        Ext.ux.form.FileUploadField.superclass.onDestroy.call(this);
        Ext.destroy(this.fileInput, this.buttonFile, this.buttonClear, 
            this.buttonDownload, this.wrap);
        Ext.QuickTips.unregister(this.fileInput);
    },
    
    onDisable: function(){
        Ext.ux.form.FileUploadField.superclass.onDisable.call(this);
        this.doDisable(true);
    },
    
    onEnable: function(){
        Ext.ux.form.FileUploadField.superclass.onEnable.call(this);
        this.doDisable(false);

    },
    
    // private
    doDisable: function(disabled){
        this.fileInput.dom.disabled = disabled;
        this.buttonFile.setDisabled(disabled);
        this.buttonClear.setDisabled(disabled);
        this.buttonDownload.setDisabled(disabled);
    },


    // private
    preFocus : Ext.emptyFn,

    // private
    alignErrorIcon : function(){
        this.errorIcon.alignTo(this.wrap, 'tl-tr', [2, 0]);
    }
    
    //private
    ,clickClearField: function(){       
        this.reset();
        this.setValue('');
        this.el.setWidth( this.el.getWidth() + this.buttonClear.getWidth() + 
            (this.buttonDownload.isVisible() ? this.buttonDownload.getWidth() : 0 ));
        this.buttonClear.hide();
        this.buttonDownload.hide();
    }
    ,clickDownload: function(){
        var fUrl = document.location.protocol + '//' + document.location.host + 
                '/' + this.fileUrl;
        if (fUrl){
            window.open(fUrl);
        }       
    }
    ,getFileName: function(){
        return this.value.split('/').reverse()[0];
    }
});

Ext.reg('fileuploadfield', Ext.ux.form.FileUploadField);

// backwards compat
Ext.form.FileUploadField = Ext.ux.form.FileUploadField;
