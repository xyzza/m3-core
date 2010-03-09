function (){
    Ext.Msg.show({
        title: 'Подтверждение',
        msg: 'Вы действительно хотите очистить значение?',
        icon: Ext.Msg.QUESTION,
        buttons: Ext.Msg.YESNO,
        fn:function(btn,text,opt){ 
            if (btn == 'yes') {
				var client_id = '{{ component.client_id }}'; 
                Ext.getCmp(client_id).setValue(''); 
				Ext.getCmp(client_id).reference_id='';
            }
        }
    });
}