/**
 * Crafted by ZIgi
 */

Ext.namespace('M3Designer.code');

M3Designer.code.PyCodeWindow = Ext.extend(Ext.Window, {
    title:'Просмотр кода',
    width:600,
    height:500,
    layout:'fit',
    maximizable:true,
    constructor:function(cfg) {
        Ext.apply(this, cfg);
        M3Designer.edit.PropertyWindow.superclass.constructor.call(this);
    },
    initComponent: function() {
        M3Designer.code.PyCodeWindow.superclass.initComponent.call(this);
        
        this.addEvents('loadcode');
    },
    show:function( code ) {
    	var codeEditor = new Ext.m3.CodeEditor({
                sourceCode:code,
                autoScroll:true
            })
        
        this.codeEditor = codeEditor;
        
        this.add(this.codeEditor);        
        this.addButton({
            text:'Загрузить код в форму',
            iconCls:'icon-page-white-get',
            handler:  function(){            	
            	this.fireEvent('loadcode',this.codeEditor.getCode());
            },
            scope: this            
        });
        M3Designer.edit.PropertyWindow.superclass.show.call(this);
    }
});

M3Designer.code.ExtendedCodeEditor = Ext.extend(Ext.m3.CodeEditor,{
    autoScroll:true,
    border:true,
    initComponent: function() {
        Ext.applyIf(this, {
            closable: true,
            buttons:[
                new Ext.Button({text:'Сохранить',
                                handler:this.onSave.createDelegate(this),
                                iconCls:'icon-script-save'}),
                new Ext.Button({text:'Обновить',
                                handler:this.onUpdate.createDelegate(this),
                                iconCls:'icon-script-go'}),
                new Ext.Button({text:'Закрыть',
                                handler:this._onClose.createDelegate(this),
                                iconCls:'icon-cancel'})
            ]
        });
        /*Хендлер на изменение кода*/
        this.on('contentChaged', function(){
            this.onChange();
        });
        M3Designer.code.ExtendedCodeEditor.superclass.initComponent.call(this, arguments);
    },
    _onClose:function() {
       /*Вероятно можно будет оптимизировать, т.к. дублирует поведение beforeclose у tabpanel (выше)*/
       var textArea = this.findByType('textarea')[0];
       /*Если есть именения в коде, выводим сообщения [ showMessage ]*/
       if (this.contentChanged){
           var scope = this;
           this.showMessage(function(buttonId){
               if (buttonId=='yes') {
                   scope.onSave();
                   scope.fireEvent('close_tab', scope);
               }
               else if (buttonId=='no') {
                   scope.fireEvent('close_tab', scope);
               }
           }, textArea.id);
       }
       else{
           this.fireEvent('close_tab', this);
       }
    },
    onChange:function(){
        var newTitle = '*'+this.orginalTitle;
        if  ( (this.title != newTitle) && this.contentChanged) {
            this.orginalTitle = this.title;
            this.setTitle('*'+this.orginalTitle);
        }
        else if(!this.contentChanged) this.setTitle(this.orginalTitle || this.title);
    },
    onSave:function() {
        this.fireEvent('save');
    },
    onUpdate:function() {
        this.fireEvent('update');
    },

    /* Показывает messagebox, о имеющихся изменениях*/
    showMessage:function(fn, animElId, msg){
        Ext.Msg.show({
               title:'Сохранить изменения?',
               msg: msg ? msg : 'Вы закрываете вкладку, в которой имеются изменения. Хотели бы вы сохранить ваши изменения?',
               buttons: Ext.Msg.YESNOCANCEL,
               fn: fn,
               animEl: animElId,
               icon: Ext.MessageBox.QUESTION
        });
    }
});