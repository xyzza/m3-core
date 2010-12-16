
var ajax = Ext.Ajax;

function save_query(){
  var query_name = Ext.getCmp('{{ component.query_name.client_id }}').getValue();
  if (!query_name){
    Ext.Msg.show({
       title:'',
       msg: 'Необходимо указать имя запроса.',
       buttons: Ext.Msg.OK,
       icon: Ext.MessageBox.WARNING
    });
    return;
  }
  Ext.Ajax.request({
            url: '{{ component.new_query_save_url }}',
            method: 'POST',
            params: { query_str: '{{ component.query_str }}',
                      query_name: query_name
                 },
            success: function(response, opts){
               var resp_obj = Ext.decode(response.responseText);
               if (resp_obj['success']==false){
                    new_message = resp_obj['message'].replace(/</gi, "&lt;").replace(/>/gi, '&gt;');
                    Ext.Msg.alert('ВНИМАНИЕ!','Во время запроса произошла ошибка<br>'+new_message); 
                  }else{
                    smart_eval(response.responseText);
              }  
              Ext.getCmp('{{ component.client_id }}').close(true);
            },
            failure: function(){
              Ext.Msg.show({
                title:'', 
                msg: 'Не удалось сохранить.', 
                buttons:Ext.Msg.OK, 
                icon: Ext.Msg.WARNING
              });
            }
        });
}

