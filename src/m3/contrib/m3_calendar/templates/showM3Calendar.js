/**
 * Created by .
 * User: daniil-ganiev
 * Date: 14.04.11
 * Time: 14:49
 */
//ВНИМАНИЕ!
// Нижеследующий код DatePicker является частным случаем. Если кто-то вдруг захочет
// использовать его в своем коде, пусть обратится к Ганиеву Даниилу. У него
// есть план по значительному изменению дэйтпикера и превращению его в удобный
// для наследования класс без грязной перегрузки.
// Сейчас есть крупная проблема, что получившийся экстовский класс является
// очень частным и неудобным к изменению.
// Просьба заранее не пугаться нечистоте кода.
date_save_url = '{{ component.date_save_url }}';

//////////////////////////////////////////////////////////////////
//Building the calendar
//////////////////////////////////////////////////////////////////
function fillDatePickers(item, index){

    Ext.m3.WorkDatePicker = Ext.extend(Ext.DatePicker, {
        /**
         * @cfg {Array} dayOffDates
         * An array of Javascript Dates that have a meaning as dayoff dates.
         */
        dayOffDates: [],
         /**
         * @cfg {Array} holidayDates
         * An array of Javascript Dates that have a meaning as holiday dates.
         * Holiday dates are more important when rendering. So holiday dates
         * will override dayoffs
         */
        holidayDates: [],
         /**
         * @cfg {Array} workDates
         * An array of Javascript Dates/
         * By default all dates that are not dayoffs or holidays are treated as
         * workdays, but if we need to overload dates in holidayDates or dayOffDates,
         * we use this array.
         */
        workDates: [],

        constructor: function(baseConfig, params){
            Ext.m3.WorkDatePicker.superclass.constructor.call(this, baseConfig);
        },// private
        initComponent : function(){
            Ext.m3.WorkDatePicker.superclass.initComponent.call(this);
            function arrayObjToClearTime(elem, index, ar){
                ar[index]=elem.clearTime().getTime();
            }
            if (this.dayOffDates){
                Ext.each(this.dayOffDates, arrayObjToClearTime);
            }
            if (this.holidayDates){
                Ext.each(this.holidayDates, arrayObjToClearTime);
            }
            if (this.workDates){
                Ext.each(this.workDates, arrayObjToClearTime);
            }
        },
        onRender : function(container, position){
            //////Копипаста из базового класса.
            // Очень плохой экст контрол.
            // Вполне возможно, что полная копипаста не нужна, а только местами,
            // но унаследоваться простым способом без магических пассов у меня
            // не вышло.
            //
            var m = [
                 '<table cellspacing="0">',
                    '<tr><td class="x-date-left"><a href="#" title=""></a></td><td class="x-date-middle" align="center"></td><td class="x-date-right"><a href="#"></a></td></tr>',
                    '<tr><td colspan="3"><table class="x-date-inner" cellspacing="0"><thead><tr>'],
                    dn = this.dayNames,
                    i;
            for(i = 0; i < 7; i++){
                var d = this.startDay+i;
                if(d > 6){
                    d = d-7;
                }
                m.push('<th><span>', dn[d].substr(0,1), '</span></th>');
            }
            m[m.length] = '</tr></thead><tbody><tr>';
            for(i = 0; i < 42; i++) {
                if(i % 7 === 0 && i !== 0){
                    m[m.length] = '</tr><tr>';
                }
                m[m.length] = '<td><a href="#" hidefocus="on" class="x-date-date" tabIndex="1"><em><span></span></em></a></td>';
            }
            m.push('</tr></tbody></table></td></tr>',
                    this.showToday ? '<tr><td colspan="3" class="x-date-bottom" align="center"></td></tr>' : '',
                    '</table><div class="x-date-mp"></div>');

            var el = document.createElement('div');
            el.className = 'x-work-date-picker';
            //Поменял название класса, чтобы применять стили
            el.innerHTML = m.join('');

            container.dom.insertBefore(el, position);

            this.el = Ext.get(el);
            this.eventEl = Ext.get(el.firstChild);

            this.prevRepeater = new Ext.util.ClickRepeater(this.el.child('td.x-date-left a'), {
                handler: null,
                scope: this,
                preventDefault:true,
                stopDefault:true
            });

            this.nextRepeater = new Ext.util.ClickRepeater(this.el.child('td.x-date-right a'), {
                handler: null,
                scope: this,
                preventDefault:true,
                stopDefault:true
            });

            //Выше дважды хэндлеры убрал

            this.monthPicker = this.el.down('div.x-date-mp');
            this.monthPicker.enableDisplayMode('block');

            this.keyNav = new Ext.KeyNav(this.eventEl, {
                'left' : function(e){
                    if(e.ctrlKey){
                        this.showPrevMonth();
                    }else{
                        this.update(this.activeDate.add('d', -1));
                    }
                },

                'right' : function(e){
                    if(e.ctrlKey){
                        this.showNextMonth();
                    }else{
                        this.update(this.activeDate.add('d', 1));
                    }
                },

                'up' : function(e){
                    if(e.ctrlKey){
                        this.showNextYear();
                    }else{
                        this.update(this.activeDate.add('d', -7));
                    }
                },

                'down' : function(e){
                    if(e.ctrlKey){
                        this.showPrevYear();
                    }else{
                        this.update(this.activeDate.add('d', 7));
                    }
                },
                //Здесь убрал пару кейбайндингов

                scope : this
            });

            this.el.unselectable();

            this.cells = this.el.select('table.x-date-inner tbody td');
            this.textNodes = this.el.query('table.x-date-inner tbody span');

            this.mbtn = new Ext.Button({
                text: '&#160;',
                tooltip: null,
                renderTo: this.el.child('td.x-date-middle', true)
            });
            //Тут убрал стиль верхней кнопки у месяца

    //        удалил тут создание кнопки "Сегодня"
            this.mon(this.eventEl, 'mousewheel', this.handleMouseWheel, this);
            this.mon(this.eventEl, 'click', this.handleDateClick,  this, {delegate: 'a.x-date-date'});
    //        здесь убрал что-то
            this.onEnable(true);
        },
        ////////Копипаста из базового класса закончена
        update : function(date, forceRefresh){
            Ext.m3.WorkDatePicker.superclass.update.call(this, date, forceRefresh);
            //Тут тоже копипаста, но уже не всего метода, удалось обойтись
            // главной его частью
            if (this.rendered)
            {
                //Выделенные элементы нам не нужны
                this.cells.removeClass('x-date-selected');
                this.cells.each(function(c){
                   c.removeClass('x-date-selected');
                });

                var days = date.getDaysInMonth(),
                        firstOfMonth = date.getFirstDateOfMonth(),
                        startingPos = firstOfMonth.getDay() - this.startDay;

                if (startingPos < 0) {
                    startingPos += 7;
                }
                days += startingPos;

                var pm = date.add('mo', -1),
                    prevStart = pm.getDaysInMonth() - startingPos,
                    cells = this.cells.elements,
                    textEls = this.textNodes,
                    // convert everything to numbers so it's fast
                    d = (new Date(pm.getFullYear(), pm.getMonth(), prevStart, this.initHour)),
                    today = new Date().clearTime().getTime(),
                    sel = date.clearTime(true).getTime(),
                    min = this.minDate ? this.minDate.clearTime(true) : Number.NEGATIVE_INFINITY,
                    max = this.maxDate ? this.maxDate.clearTime(true) : Number.POSITIVE_INFINITY,
                    ddMatch = this.disabledDatesRE,
                    ddText = this.disabledDatesText,
                    ddays = this.disabledDays ? this.disabledDays.join('') : false,
                    ddaysText = this.disabledDaysText,
                    format = this.format;

                var setCellClass = function(cal, cell) {
                    cell.title = '';
                    var t = d.clearTime(true).getTime();
                    cell.firstChild.dateValue = t;
                    if (t == today) {
                        cell.className += ' x-date-today';
                        cell.title = cal.todayText;
                    }
                    //убрал здесь if для выделенных дат
                    if (t < min) {
                        cell.className = ' x-date-disabled';
                        cell.title = cal.minText;
                        return;
                    }
                    if (t > max) {
                        cell.className = ' x-date-disabled';
                        cell.title = cal.maxText;
                        return;
                    }
                    if (ddays) {
                        if (ddays.indexOf(d.getDay()) != -1) {
                            cell.title = ddaysText;
                            cell.className = ' x-date-disabled';
                        }
                    }
                    if (ddMatch && format) {
                        var fvalue = d.dateFormat(format);
                        if (ddMatch.test(fvalue)) {
                            cell.title = ddText.replace('%0', fvalue);
                            cell.className = ' x-date-disabled';
                        }
                    }
                    //Excinsky
                    // Вот тут подключаюсь я
                    // Надо не забыть, что я представил даты в виде абсолютного
                    // числа секунд от начала времен. Ведь с числами работать
                    // намного быстрее.
                    if (cal.dayOffDates && includeInArr(cal.dayOffDates, t)){
                        cell.className = ' x-date-dayoff';
                    }
                    if (cal.holidayDates && includeInArr(cal.holidayDates, t)){
                        cell.className = ' x-date-holiday';
                    }
                    if (cal.workDates && includeInArr(cal.workDates, t)){
                        cell.className = ' x-date-active';
                    }
                };

                var i = 0;
                for(; i < startingPos; i++) {
                    textEls[i].innerHTML = (++prevStart);
                    d.setDate(d.getDate()+1);
                    cells[i].className = 'x-date-prevday';
                    setCellClass(this, cells[i]);
                }
                for(; i < days; i++){
                    var intDay = i - startingPos + 1;
                    textEls[i].innerHTML = (intDay);
                    d.setDate(d.getDate()+1);
                    cells[i].className = 'x-date-active';
                    setCellClass(this, cells[i]);
                }
                var extraDays = 0;
                for(; i < 42; i++) {
                     textEls[i].innerHTML = (++extraDays);
                     d.setDate(d.getDate()+1);
                     cells[i].className = 'x-date-nextday';
                     setCellClass(this, cells[i]);
                }
            }
        },
        // private
        changeDateType : function(date){
            var clearTime = date.clearTime().getTime();
            function changeDateArray(clearTime, dateArrFrom, dateArrTo, callr){
                if (includeInArr(dateArrFrom, clearTime))
                {
                    dateArrFrom.remove(clearTime);
                    dateArrTo.push(clearTime);
                    return true;
                }
                else{
                    return false;
                }
            }

            var DAYOFF = 1;
            var HOLIDAY = 2;
            var WORKDAY = 3;
            if (changeDateArray(clearTime, this.dayOffDates, this.holidayDates, this)){
                this.update(date);
                return HOLIDAY;
            }
            if (changeDateArray(clearTime, this.holidayDates, this.workDates, this)){
                this.update(date);
                return WORKDAY;
            }
            if (includeInArr(this.workDates, clearTime)){
                if(changeDateArray(clearTime, this.workDates, this.dayOffDates, this)){
                    this.update(date);
                    return DAYOFF;
                }
            }
            else{
                this.dayOffDates.push(clearTime);
                this.update(date);
                return DAYOFF;
            }
        }
    });

    var calendarDate = new Date(new Date().getFullYear(), index, 1);

    var picker = new Ext.m3.WorkDatePicker({
        dayOffDates:[new Date('12/12/2011'), new Date('04/05/2011'),
                     new Date('12/15/2011')],
        holidayDates:[new Date('01/01/2011'), new Date('12/15/2011')],
        workDates:[new Date('12/15/2011')],
        showToday:false,
        minDate:calendarDate,
        maxDate:calendarDate.getLastDateOfMonth()
    });
    picker.setValue(calendarDate);
    item.add(picker);

    picker.on('select',function(picker, date){
        type = picker.changeDateType(date);
        Ext.Ajax.request({
            url: date_save_url
            ,params: {date: date.format('d.m.Y'), type: type}
            ,failure: function(response, opts){
              uiAjaxFailMessage(response,opts);
            }
        });
    });
}

function generateCalendars(){
    var cntTable = Ext.getCmp('{{ component.table_container.client_id }}');
    Ext.each(cntTable.items.items, fillDatePickers);
}

win.doLayout();