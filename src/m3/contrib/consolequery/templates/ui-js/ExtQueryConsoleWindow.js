var ajax = Ext.Ajax;
var combobox_empty = Ext.getCmp('{{ component.query_selected.client_id }}');


function check_query(query_str){
  var str = query_str.substring(0,6);
  if ( !query_str) {
    Ext.Msg.show({
       title:'',
       msg: 'Необходимо написать текст запроса.',
       buttons: Ext.Msg.OK,
       icon: Ext.MessageBox.WARNING
    });
    return;
  }
   return true;
}

function load_selected_query(){
  var  selected_query = Ext.getCmp('{{ component.query_selected.client_id }}').getValue();
  if (selected_query>0){
      Ext.Ajax.request({
            url: '{{ component.load_selected_query_url }}',
           method: 'POST',
            params: { query_id: selected_query
                 },
            success: function(response, opts){
              Ext.getCmp('{{ component.query_str.client_id }}').setValue(Ext.decode(response.responseText)['rows']);
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
}

function save_new_query(){
  var query_str = Ext.getCmp('{{ component.query_str.client_id }}').getValue();
  var selected_query = Ext.getCmp('{{ component.query_selected.client_id }}').getValue(); 
  if (check_query(query_str)){
    Ext.Ajax.request({
              url: '{{ component.new_query_save_url }}',
             method: 'POST',
              params: { query_str: escape(query_str),
                        query_name: selected_query},
              success: function(response, opts){
                    smart_eval(response.responseText);
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
}

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
        smart_eval(response.responseText);
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

function make_query(){
  var query_str = Ext.getCmp('{{ component.query_str.client_id }}').getValue();
  if (check_query(query_str)){ 
    var query_selected = Ext.getCmp('{{ component.query_selected.client_id }}').getValue();
    var grid = Ext.getCmp('{{component.grid.client_id}}');
    ajax.request({
      method: 'POST',
      url: '{{ component.query_console_url }}',
      params: {query_str: query_str,
               query_selected: query_selected},
      success: function(response, opts) {            
            var resp_obj = Ext.decode(response.responseText);
            if (resp_obj['success']==false){
              var new_data = [];
              new_data['rows'] = [];
              new_data['column'] = [];
              create_sql_grid(new_data, grid);
              new_message = resp_obj['message'].replace(/</gi, "&lt;").replace(/>/gi, '&gt;');
              Ext.Msg.alert('ВНИМАНИЕ!','Во время запроса произошла ошибка<br>'+new_message); 
 
            }else{
              var new_grid = create_sql_grid(resp_obj, grid);
              new_grid.getStore().loadData(Ext.decode(response.responseText));   
            }   
        },
      failure: function(response, opts){
           Ext.Msg.alert('','Возможно ошибка в запросе.'+response.responseText);
        }
    });
  }
}

function create_sql_grid(data, grid){
  var grid_columns = [];
  var store_fields = [];
  //if (data.rows.length>0){
    for (var i=0;i<data.column.length;i++){
        var mapping = data.column[i][0];
        store_fields[i] = {name: mapping};
        grid_columns[i] = {header: mapping, dataIndex: mapping}
    }
    var store = new Ext.data.ArrayStore({
      root: 'rows',
      fields: store_fields
    });
    
    var columns = new Ext.grid.ColumnModel({
      columns: grid_columns
    });
    
    grid.reconfigure(store, columns);
  //}
  return grid;
}

