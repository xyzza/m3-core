/**
 * Crafted by ZIgi
 */

Ext.namespace('M3Designer.code');

M3Designer.code.PyCodeWindow = Ext.extend(Ext.Window, {
    title:'Предварительный просмотр',
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
    },
    show:function( code ) {
        this.add(
            new Ext.ux.panel.CodeEditor({
                sourceCode:code,
                autoScroll:true
            })
        );
        M3Designer.edit.PropertyWindow.superclass.show.call(this);
    }
});

M3Designer.code.ExtendedCodeEditor = Ext.extend(Ext.ux.panel.CodeEditor,{
    initComponent: function() {
        Ext.applyIf(this, {
            closable: true,
            buttons:[
                new Ext.Button({text:'Сохранить',handler:this.onSave.createDelegate(this) }),
                new Ext.Button({ text:'Отмена', handler:this._onClose.createDelegate(this) })
            ]
        });
        M3Designer.code.ExtendedCodeEditor.superclass.initComponent.call(this);
    },
    _onClose:function() {
       /*Вероятно можно будет оптимизировать, т.к. дублирует поведение beforeclose у tabpanel (выше)*/
       var textArea = this.findByType('textarea')[0];
       /*Если есть именения в коде, выводим сообщения [ showMessage ]*/

       if (textArea.isDirty()){
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

    onSave:function() {
        var textArea = this.findByType('textarea')[0];
        this.fireEvent('save', textArea.value, this);
    },

    /* Показывает messagebox, о имеющихся изменениях*/
    showMessage:function(fn, animElId, buttons){
        Ext.Msg.show({
               title:'Сохранить изменения?',
               msg: 'Вы закрываете вкладку, в которой имеются изменения. Хотели бы вы сохранить ваши изменения?',
               buttons: buttons? buttons :Ext.Msg.YESNOCANCEL,
               fn: fn,
               animEl: animElId,
               icon: Ext.MessageBox.QUESTION
        });
    }
});