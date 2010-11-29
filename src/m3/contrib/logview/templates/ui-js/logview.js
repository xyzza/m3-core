/**
 * @author kir
 */
 
var logFilesCombo = Ext.getCmp('{{component.log_files_combo.client_id}}');
var textField = Ext.getCmp('{{component.text_field.client_id}}');
var grid = Ext.getCmp('{{component.grid.client_id}}');
var updateButton = Ext.getCmp('{{component.update_button.client_id}}');
var startDate = Ext.getCmp('{{component.start_date.client_id}}');
var endDate = Ext.getCmp('{{component.end_date.client_id}}');

//Хендлер на операцию изменения даты
startDate.on('select',callBackfunc_date,this);
endDate.on('select',callBackfunc_date,this);

function callBackfunc_date(){
    if (!startDate.isValid() | !endDate.isValid()){
        fill_the_filds();
    }
    else{
    var params = {
       start_date : startDate.getValue().format('Y-m-d') || '',
       end_date : endDate.getValue().format('Y-m-d') || ''
    };
    Ext.Ajax.request({
    method: 'POST',
    url: '{{ component.logs_list_by_date_url }}',
    params: params,
    success: function(response, opts) {
      logFilesCombo.setValue('');
      textField.setValue('');
      logFilesCombo.getStore().loadData(Ext.decode(response.responseText));
      
    },
    failure: function(response, opts) {
      uiAjaxFailMessage();
    }
  });
}
};

//Сообщение о необходимости заполнения полей даты
function fill_the_filds(){
        Ext.Msg.show({title:'Проверка формы',
        msg:'Проверьте правильность заполнения полей.<br>Некорректно заполненные поля подсвечены желтым.',
        buttons: Ext.Msg.OK, icon: Ext.Msg.WARNING});
        return;
}

//Хендлер на операцию выбора из Combobox
logFilesCombo.on('select',callBackfunc_combo,this);

function callBackfunc_combo(){
    updateButton.setVisible(true);
    textField.setValue('');
    var params = {
        filename:logFilesCombo.getValue()||''
       ,start:0
       ,limit:25
    };
  Ext.Ajax.request({
    method: 'POST',
    url: '{{ component.get_logs_url }}',
    params: params,
    success: function(response, opts) {
        grid.getStore().loadData(Ext.decode(response.responseText));
    },
    failure: function(response, opts) {
      uiAjaxFailMessage();
    }
  });
};

//Хендлер на операцию смены страницы пейджинга
grid.getStore().on('beforeload', onGridBeforeLoad);

function onGridBeforeLoad(store, options) {
    store.setBaseParam('filename', logFilesCombo.getValue());
}
//Хендлер на операцию выделения строки из грида
grid.on('cellclick', GridClick);

function GridClick(grid, row, col, e) {
    var rec = grid.getStore().getAt(row);
    textField.setValue(rec.get('full')||rec.get('additionally'));
}
