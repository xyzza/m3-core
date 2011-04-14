/**
 * Created by .
 * User: daniil-ganiev
 * Date: 14.04.11
 * Time: 14:49
 */

function generateCalendars(){

 var cntTable = Ext.getCmp('{{ component.table_container.client_id }}');

 var currentYear = new Date().getFullYear();

 Ext.each(cntTable.items.items, function(item, index){
     var calendarDate = new Date(currentYear, index, 1);
     var picker = new Ext.DatePicker({
                  disabledDays:[0,6],
                  showToday:false,
                  minDate:calendarDate,
                  maxDate:calendarDate.getLastDateOfMonth()
                });
     picker.setValue(calendarDate);
     item.add(picker);
 });
}

win.doLayout();