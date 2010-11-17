/**
 * Календарь на базе Sencha Calendar
 */

Ext.m3.Calendar = Ext.extend(Ext.calendar.CalendarPanel, {
    constructor: function(baseConfig, params){
        console.log('Ext.m3.Calendar >>');
        console.log(baseConfig);
        console.log(params);

        Ext.m3.Calendar.superclass.constructor.call(this, baseConfig);
    }
})
