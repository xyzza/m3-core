/**
 * Created by .
 * User: kir
 * Date: 15.04.11
 * Time: 16:31
 */

extendedCodeEditor = Ext.extend(Ext.ux.panel.CodeEditor,{
    initComponent: function() {
        Ext.applyIf(this, {
            closable: true,
            buttons:[
                new Ext.Button({text:'Сохранить',handler:this.onSave.createDelegate(this) }),
                new Ext.Button({ text:'Отмена', handler:this._onClose.createDelegate(this) })
            ]
        });
        extendedCodeEditor.superclass.initComponent.call(this);
    },
    _onClose:function() {
       /*Вероятно можно будет оптимизировать, т.к. дублирует поведение beforeclose у tabpanel (выше)*/
       var textArea = this.findByType('textarea')[0];
       /*Если есть именения в коде, выводим сообщения [ showMessage ]*/

       if (textArea.isDirty()){
           var scope = this;
           this.showMessage(choise, textArea.id)
           function choise(buttonId){
               if (buttonId=='yes') {
                   scope.onSave();
                   scope.fireEvent('close_tab', scope);
               }
               else if (buttonId=='no') {
                   scope.fireEvent('close_tab', scope);
               }
           }
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
    showMessage:function(fn, animEl_id, buttons){
        Ext.Msg.show({
               title:'Сохранить изменения?',
               msg: 'Вы закрываете вкладку, в которой имеются изменения. Хотели бы вы сохранить ваши изменения?',
               buttons: buttons? buttons :Ext.Msg.YESNOCANCEL,
               fn: fn,
               animEl: animEl_id,
               icon: Ext.MessageBox.QUESTION
        });
    }
})
