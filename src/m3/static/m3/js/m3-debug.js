/*!
 * Ext JS Library 3.3.0
 * Copyright(c) 2006-2010 Ext JS, Inc.
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
Ext.ns('Ext.calendar');

 (function() {
    Ext.apply(Ext.calendar, {
        Date: {
            diffDays: function(start, end) {
                day = 1000 * 60 * 60 * 24;
                diff = end.clearTime(true).getTime() - start.clearTime(true).getTime();
                return Math.ceil(diff / day);
            },

            copyTime: function(fromDt, toDt) {
                var dt = toDt.clone();
                dt.setHours(
                fromDt.getHours(),
                fromDt.getMinutes(),
                fromDt.getSeconds(),
                fromDt.getMilliseconds());

                return dt;
            },

            compare: function(dt1, dt2, precise) {
                if (precise !== true) {
                    dt1 = dt1.clone();
                    dt1.setMilliseconds(0);
                    dt2 = dt2.clone();
                    dt2.setMilliseconds(0);
                }
                return dt2.getTime() - dt1.getTime();
            },

            // private helper fn
            maxOrMin: function(max) {
                var dt = (max ? 0: Number.MAX_VALUE),
                i = 0,
                args = arguments[1],
                ln = args.length;
                for (; i < ln; i++) {
                    dt = Math[max ? 'max': 'min'](dt, args[i].getTime());
                }
                return new Date(dt);
            },

            max: function() {
                return this.maxOrMin.apply(this, [true, arguments]);
            },

            min: function() {
                return this.maxOrMin.apply(this, [false, arguments]);
            }
        }
    });
})();/**
 * @class Ext.calendar.DayHeaderTemplate
 * @extends Ext.XTemplate
 * <p>This is the template used to render the all-day event container used in {@link Ext.calendar.DayView DayView} and 
 * {@link Ext.calendar.WeekView WeekView}. Internally the majority of the layout logic is deferred to an instance of
 * {@link Ext.calendar.BoxLayoutTemplate}.</p> 
 * <p>This template is automatically bound to the underlying event store by the 
 * calendar components and expects records of type {@link Ext.calendar.EventRecord}.</p>
 * <p>Note that this template would not normally be used directly. Instead you would use the {@link Ext.calendar.DayViewTemplate}
 * that internally creates an instance of this template along with a {@link Ext.calendar.DayBodyTemplate}.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext.calendar.DayHeaderTemplate = function(config){
    
    Ext.apply(this, config);
    
    this.allDayTpl = new Ext.calendar.BoxLayoutTemplate(config);
    this.allDayTpl.compile();
    
    Ext.calendar.DayHeaderTemplate.superclass.constructor.call(this,
        '<div class="ext-cal-hd-ct">',
            '<table class="ext-cal-hd-days-tbl" cellspacing="0" cellpadding="0">',
                '<tbody>',
                    '<tr>',
                        '<td class="ext-cal-gutter"></td>',
                        '<td class="ext-cal-hd-days-td"><div class="ext-cal-hd-ad-inner">{allDayTpl}</div></td>',
                        '<td class="ext-cal-gutter-rt"></td>',
                    '</tr>',
                '</tobdy>',
            '</table>',
        '</div>'
    );
};

Ext.extend(Ext.calendar.DayHeaderTemplate, Ext.XTemplate, {
    applyTemplate : function(o){
        return Ext.calendar.DayHeaderTemplate.superclass.applyTemplate.call(this, {
            allDayTpl: this.allDayTpl.apply(o)
        });
    }
});

Ext.calendar.DayHeaderTemplate.prototype.apply = Ext.calendar.DayHeaderTemplate.prototype.applyTemplate;
/**
 * @class Ext.calendar.DayBodyTemplate
 * @extends Ext.XTemplate
 * <p>This is the template used to render the scrolling body container used in {@link Ext.calendar.DayView DayView} and 
 * {@link Ext.calendar.WeekView WeekView}. This template is automatically bound to the underlying event store by the 
 * calendar components and expects records of type {@link Ext.calendar.EventRecord}.</p>
 * <p>Note that this template would not normally be used directly. Instead you would use the {@link Ext.calendar.DayViewTemplate}
 * that internally creates an instance of this template along with a {@link Ext.calendar.DayHeaderTemplate}.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext.calendar.DayBodyTemplate = function(config){
    
    Ext.apply(this, config);
    
    Ext.calendar.DayBodyTemplate.superclass.constructor.call(this,
        '<table class="ext-cal-bg-tbl" cellspacing="0" cellpadding="0">',
            '<tbody>',
                '<tr height="1">',
                    '<td class="ext-cal-gutter"></td>',
                    '<td colspan="{dayCount}">',
                        '<div class="ext-cal-bg-rows">',
                            '<div class="ext-cal-bg-rows-inner">',
                                '<tpl for="times">',
                                    '<div class="ext-cal-bg-row">',
                                        '<div class="ext-cal-bg-row-div ext-row-{[xindex]}"></div>',
                                    '</div>',
                                '</tpl>',
                            '</div>',
                        '</div>',
                    '</td>',
                '</tr>',
                '<tr>',
                    '<td class="ext-cal-day-times">',
                        '<tpl for="times">',
                            '<div class="ext-cal-bg-row">',
                                '<div class="ext-cal-day-time-inner">{.}</div>',
                            '</div>',
                        '</tpl>',
                    '</td>',
                    '<tpl for="days">',
                        '<td class="ext-cal-day-col">',
                            '<div class="ext-cal-day-col-inner">',
                                '<div id="{[this.id]}-day-col-{.:date("Ymd")}" class="ext-cal-day-col-gutter"></div>',
                            '</div>',
                        '</td>',
                    '</tpl>',
                '</tr>',
            '</tbody>',
        '</table>'
    );
};

Ext.extend(Ext.calendar.DayBodyTemplate, Ext.XTemplate, {
    // private
    applyTemplate : function(o){
        this.today = new Date().clearTime();
        this.dayCount = this.dayCount || 1;
        
        var i = 0, days = [],
            dt = o.viewStart.clone(),
            times;
            
        for(; i<this.dayCount; i++){
            days[i] = dt.add(Date.DAY, i);
        }

        times = [];
        dt = new Date().clearTime();
        for(i=0; i<24; i++){
            times.push(dt.format('ga'));
            dt = dt.add(Date.HOUR, 1);
        }
        
        return Ext.calendar.DayBodyTemplate.superclass.applyTemplate.call(this, {
            days: days,
            dayCount: days.length,
            times: times
        });
    }
});

Ext.calendar.DayBodyTemplate.prototype.apply = Ext.calendar.DayBodyTemplate.prototype.applyTemplate;
/**
 * @class Ext.calendar.DayViewTemplate
 * @extends Ext.XTemplate
 * <p>This is the template used to render the all-day event container used in {@link Ext.calendar.DayView DayView} and 
 * {@link Ext.calendar.WeekView WeekView}. Internally this class simply defers to instances of {@link Ext.calerndar.DayHeaderTemplate}
 * and  {@link Ext.calerndar.DayBodyTemplate} to perform the actual rendering logic, but it also provides the overall calendar view
 * container that contains them both.  As such this is the template that should be used when rendering day or week views.</p> 
 * <p>This template is automatically bound to the underlying event store by the 
 * calendar components and expects records of type {@link Ext.calendar.EventRecord}.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext.calendar.DayViewTemplate = function(config){
    
    Ext.apply(this, config);
    
    this.headerTpl = new Ext.calendar.DayHeaderTemplate(config);
    this.headerTpl.compile();
    
    this.bodyTpl = new Ext.calendar.DayBodyTemplate(config);
    this.bodyTpl.compile();
    
    Ext.calendar.DayViewTemplate.superclass.constructor.call(this,
        '<div class="ext-cal-inner-ct">',
            '{headerTpl}',
            '{bodyTpl}',
        '</div>'
    );
};

Ext.extend(Ext.calendar.DayViewTemplate, Ext.XTemplate, {
    // private
    applyTemplate : function(o){
        return Ext.calendar.DayViewTemplate.superclass.applyTemplate.call(this, {
            headerTpl: this.headerTpl.apply(o),
            bodyTpl: this.bodyTpl.apply(o)
        });
    }
});

Ext.calendar.DayViewTemplate.prototype.apply = Ext.calendar.DayViewTemplate.prototype.applyTemplate;
/**
 * @class Ext.calendar.BoxLayoutTemplate
 * @extends Ext.XTemplate
 * <p>This is the template used to render calendar views based on small day boxes within a non-scrolling container (currently
 * the {@link Ext.calendar.MonthView MonthView} and the all-day headers for {@link Ext.calendar.DayView DayView} and 
 * {@link Ext.calendar.WeekView WeekView}. This template is automatically bound to the underlying event store by the 
 * calendar components and expects records of type {@link Ext.calendar.EventRecord}.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext.calendar.BoxLayoutTemplate = function(config){
    
    Ext.apply(this, config);
    
    var weekLinkTpl = this.showWeekLinks ? '<div id="{weekLinkId}" class="ext-cal-week-link">{weekNum}</div>' : '';
    
    Ext.calendar.BoxLayoutTemplate.superclass.constructor.call(this,
        '<tpl for="weeks">',
            '<div id="{[this.id]}-wk-{[xindex-1]}" class="ext-cal-wk-ct" style="top:{[this.getRowTop(xindex, xcount)]}%; height:{[this.getRowHeight(xcount)]}%;">',
                weekLinkTpl,
                '<table class="ext-cal-bg-tbl" cellpadding="0" cellspacing="0">',
                    '<tbody>',
                        '<tr>',
                            '<tpl for=".">',
                                 '<td id="{[this.id]}-day-{date:date("Ymd")}" class="{cellCls}">&nbsp;</td>',
                            '</tpl>',
                        '</tr>',
                    '</tbody>',
                '</table>',
                '<table class="ext-cal-evt-tbl" cellpadding="0" cellspacing="0">',
                    '<tbody>',
                        '<tr>',
                            '<tpl for=".">',
                                '<td id="{[this.id]}-ev-day-{date:date("Ymd")}" class="{titleCls}"><div>{title}</div></td>',
                            '</tpl>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            '</div>',
        '</tpl>', {
            getRowTop: function(i, ln){
                return ((i-1)*(100/ln));
            },
            getRowHeight: function(ln){
                return 100/ln;
            }
        }
    );
};

Ext.extend(Ext.calendar.BoxLayoutTemplate, Ext.XTemplate, {
    // private
    applyTemplate : function(o){
        
        Ext.apply(this, o);
        
        var w = 0, title = '', first = true, isToday = false, showMonth = false, prevMonth = false, nextMonth = false,
            weeks = [[]],
            today = new Date().clearTime(),
            dt = this.viewStart.clone(),
            thisMonth = this.startDate.getMonth();
        
        for(; w < this.weekCount || this.weekCount == -1; w++){
            if(dt > this.viewEnd){
                break;
            }
            weeks[w] = [];
            
            for(var d = 0; d < this.dayCount; d++){
                isToday = dt.getTime() === today.getTime();
                showMonth = first || (dt.getDate() == 1);
                prevMonth = (dt.getMonth() < thisMonth) && this.weekCount == -1;
                nextMonth = (dt.getMonth() > thisMonth) && this.weekCount == -1;
                
                if(dt.getDay() == 1){
                    // The ISO week format 'W' is relative to a Monday week start. If we
                    // make this check on Sunday the week number will be off.
                    weeks[w].weekNum = this.showWeekNumbers ? dt.format('W') : '&nbsp;';
                    weeks[w].weekLinkId = 'ext-cal-week-'+dt.format('Ymd');
                }
                
                if(showMonth){
                    if(isToday){
                        title = this.getTodayText();
                    }
                    else{
                        title = dt.format(this.dayCount == 1 ? 'l, F j, Y' : (first ? 'M j, Y' : 'M j'));
                    }
                }
                else{
                    var dayFmt = (w == 0 && this.showHeader !== true) ? 'D j' : 'j';
                    title = isToday ? this.getTodayText() : dt.format(dayFmt);
                }
                
                weeks[w].push({
                    title: title,
                    date: dt.clone(),
                    titleCls: 'ext-cal-dtitle ' + (isToday ? ' ext-cal-dtitle-today' : '') + 
                        (w==0 ? ' ext-cal-dtitle-first' : '') +
                        (prevMonth ? ' ext-cal-dtitle-prev' : '') + 
                        (nextMonth ? ' ext-cal-dtitle-next' : ''),
                    cellCls: 'ext-cal-day ' + (isToday ? ' ext-cal-day-today' : '') + 
                        (d==0 ? ' ext-cal-day-first' : '') +
                        (prevMonth ? ' ext-cal-day-prev' : '') +
                        (nextMonth ? ' ext-cal-day-next' : '')
                });
                dt = dt.add(Date.DAY, 1);
                first = false;
            }
        }
        
        return Ext.calendar.BoxLayoutTemplate.superclass.applyTemplate.call(this, {
            weeks: weeks
        });
    },
    
    // private
    getTodayText : function(){
        var dt = new Date().format('l, F j, Y'),
            todayText = this.showTodayText !== false ? this.todayText : '',
            timeText = this.showTime !== false ? ' <span id="'+this.id+'-clock" class="ext-cal-dtitle-time">' + 
                    new Date().format('g:i a') + '</span>' : '',
            separator = todayText.length > 0 || timeText.length > 0 ? ' &mdash; ' : '';
        
        if(this.dayCount == 1){
            return dt + separator + todayText + timeText;
        }
        fmt = this.weekCount == 1 ? 'D j' : 'j';
        return todayText.length > 0 ? todayText + timeText : new Date().format(fmt) + timeText;
    }
});

Ext.calendar.BoxLayoutTemplate.prototype.apply = Ext.calendar.BoxLayoutTemplate.prototype.applyTemplate;
/**
 * @class Ext.calendar.MonthViewTemplate
 * @extends Ext.XTemplate
 * <p>This is the template used to render the {@link Ext.calendar.MonthView MonthView}. Internally this class defers to an
 * instance of {@link Ext.calerndar.BoxLayoutTemplate} to handle the inner layout rendering and adds containing elements around
 * that to form the month view.</p> 
 * <p>This template is automatically bound to the underlying event store by the 
 * calendar components and expects records of type {@link Ext.calendar.EventRecord}.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext.calendar.MonthViewTemplate = function(config){
    
    Ext.apply(this, config);
    
    this.weekTpl = new Ext.calendar.BoxLayoutTemplate(config);
    this.weekTpl.compile();
    
    var weekLinkTpl = this.showWeekLinks ? '<div class="ext-cal-week-link-hd">&nbsp;</div>' : '';
    
    Ext.calendar.MonthViewTemplate.superclass.constructor.call(this,
        '<div class="ext-cal-inner-ct {extraClasses}">',
            '<div class="ext-cal-hd-ct ext-cal-month-hd">',
                weekLinkTpl,
                '<table class="ext-cal-hd-days-tbl" cellpadding="0" cellspacing="0">',
                    '<tbody>',
                        '<tr>',
                            '<tpl for="days">',
                                '<th class="ext-cal-hd-day{[xindex==1 ? " ext-cal-day-first" : ""]}" title="{.:date("l, F j, Y")}">{.:date("D")}</th>',
                            '</tpl>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            '</div>',
            '<div class="ext-cal-body-ct">{weeks}</div>',
        '</div>'
    );
};

Ext.extend(Ext.calendar.MonthViewTemplate, Ext.XTemplate, {
    // private
    applyTemplate : function(o){
        var days = [],
            weeks = this.weekTpl.apply(o),
            dt = o.viewStart;
        
        for(var i = 0; i < 7; i++){
            days.push(dt.add(Date.DAY, i));
        }
        
        var extraClasses = this.showHeader === true ? '' : 'ext-cal-noheader';
        if(this.showWeekLinks){
            extraClasses += ' ext-cal-week-links';
        }
        
        return Ext.calendar.MonthViewTemplate.superclass.applyTemplate.call(this, {
            days: days,
            weeks: weeks,
            extraClasses: extraClasses 
        });
    }
});

Ext.calendar.MonthViewTemplate.prototype.apply = Ext.calendar.MonthViewTemplate.prototype.applyTemplate;
/**
 * @class Ext.dd.ScrollManager
 * <p>Provides automatic scrolling of overflow regions in the page during drag operations.</p>
 * <p>The ScrollManager configs will be used as the defaults for any scroll container registered with it,
 * but you can also override most of the configs per scroll container by adding a 
 * <tt>ddScrollConfig</tt> object to the target element that contains these properties: {@link #hthresh},
 * {@link #vthresh}, {@link #increment} and {@link #frequency}.  Example usage:
 * <pre><code>
var el = Ext.get('scroll-ct');
el.ddScrollConfig = {
    vthresh: 50,
    hthresh: -1,
    frequency: 100,
    increment: 200
};
Ext.dd.ScrollManager.register(el);
</code></pre>
 * <b>Note: This class uses "Point Mode" and is untested in "Intersect Mode".</b>
 * @singleton
 */
Ext.dd.ScrollManager = function() {
    var ddm = Ext.dd.DragDropMgr,
        els = {},
        dragEl = null,
        proc = {},
        onStop = function(e) {
            dragEl = null;
            clearProc();
        },
        triggerRefresh = function() {
            if (ddm.dragCurrent) {
                ddm.refreshCache(ddm.dragCurrent.groups);
            }
        },
        doScroll = function() {
            if (ddm.dragCurrent) {
                var dds = Ext.dd.ScrollManager,
                    inc = proc.el.ddScrollConfig ? proc.el.ddScrollConfig.increment: dds.increment;
                if (!dds.animate) {
                    if (proc.el.scroll(proc.dir, inc)) {
                        triggerRefresh();
                    }
                } else {
                    proc.el.scroll(proc.dir, inc, true, dds.animDuration, triggerRefresh);
                }
            }
        },
        clearProc = function() {
            if (proc.id) {
                clearInterval(proc.id);
            }
            proc.id = 0;
            proc.el = null;
            proc.dir = "";
        },
        startProc = function(el, dir) {
            clearProc();
            proc.el = el;
            proc.dir = dir;
            var freq = (el.ddScrollConfig && el.ddScrollConfig.frequency) ?
                            el.ddScrollConfig.frequency: Ext.dd.ScrollManager.frequency,
                group = el.ddScrollConfig ? el.ddScrollConfig.ddGroup: undefined;

            if (group === undefined || ddm.dragCurrent.ddGroup == group) {
                proc.id = setInterval(doScroll, freq);
            }
        },
        onFire = function(e, isDrop) {
            if (isDrop || !ddm.dragCurrent) {
                return;
            }
            var dds = Ext.dd.ScrollManager;
            if (!dragEl || dragEl != ddm.dragCurrent) {
                dragEl = ddm.dragCurrent;
                // refresh regions on drag start
                dds.refreshCache();
            }

            var xy = Ext.lib.Event.getXY(e),
                pt = new Ext.lib.Point(xy[0], xy[1]),
                id,
                el,
                r,
                c;
            for (id in els) {
                if (els.hasOwnProperty(id)) {
                    el = els[id];
                    r = el._region;
                    c = el.ddScrollConfig ? el.ddScrollConfig: dds;
                    if (r && r.contains(pt) && el.isScrollable()) {
                        if (r.bottom - pt.y <= c.vthresh) {
                            if (proc.el != el) {
                                startProc(el, "down");
                            }
                            return;
                        } else if (r.right - pt.x <= c.hthresh) {
                            if (proc.el != el) {
                                startProc(el, "left");
                            }
                            return;
                        } else if (pt.y - r.top <= c.vthresh) {
                            if (proc.el != el) {
                                startProc(el, "up");
                            }
                            return;
                        } else if (pt.x - r.left <= c.hthresh) {
                            if (proc.el != el) {
                                startProc(el, "right");
                            }
                            return;
                        }
                    }
                }
            }
            clearProc();
        };

    ddm.fireEvents = ddm.fireEvents.createSequence(onFire, ddm);
    ddm.stopDrag = ddm.stopDrag.createSequence(onStop, ddm);

    return {
        /**
         * Registers new overflow element(s) to auto scroll
         * @param {Mixed/Array} el The id of or the element to be scrolled or an array of either
         */
        register: function(el) {
            if (Ext.isArray(el)) {
                var i = 0,
                    len = el.length;
                for (; i < len; i++) {
                    this.register(el[i]);
                }
            } else {
                el = Ext.get(el);
                els[el.id] = el;
            }
        },

        /**
         * Unregisters overflow element(s) so they are no longer scrolled
         * @param {Mixed/Array} el The id of or the element to be removed or an array of either
         */
        unregister: function(el) {
            if (Ext.isArray(el)) {
                var i = 0,
                    len = el.length;
                for (; i < len; i++) {
                    this.unregister(el[i]);
                }
            } else {
                el = Ext.get(el);
                delete els[el.id];
            }
        },

        /**
         * The number of pixels from the top or bottom edge of a container the pointer needs to be to
         * trigger scrolling (defaults to 25)
         * @type Number
         */
        vthresh: 25,
        /**
         * The number of pixels from the right or left edge of a container the pointer needs to be to
         * trigger scrolling (defaults to 25)
         * @type Number
         */
        hthresh: 25,

        /**
         * The number of pixels to scroll in each scroll increment (defaults to 50)
         * @type Number
         */
        increment: 100,

        /**
         * The frequency of scrolls in milliseconds (defaults to 500)
         * @type Number
         */
        frequency: 500,

        /**
         * True to animate the scroll (defaults to true)
         * @type Boolean
         */
        animate: true,

        /**
         * The animation duration in seconds - 
         * MUST BE less than Ext.dd.ScrollManager.frequency! (defaults to .4)
         * @type Number
         */
        animDuration: 0.4,

        /**
         * Manually trigger a cache refresh.
         */
        refreshCache: function() {
            var id;
            for (id in els) {
                if (els.hasOwnProperty(id)) {
                    if (typeof els[id] == 'object') {
                        // for people extending the object prototype
                        els[id]._region = els[id].getRegion();
                    }
                }
            }
        }
    };
}();/*
 * @class Ext.calendar.StatusProxy
 * A specialized drag proxy that supports a drop status icon, {@link Ext.Layer} styles and auto-repair. It also
 * contains a calendar-specific drag status message containing details about the dragged event's target drop date range.  
 * This is the default drag proxy used by all calendar views.
 * @constructor
 * @param {Object} config
 */
Ext.calendar.StatusProxy = function(config) {
    Ext.apply(this, config);
    this.id = this.id || Ext.id();
    this.el = new Ext.Layer({
        dh: {
            id: this.id,
            cls: 'ext-dd-drag-proxy x-dd-drag-proxy ' + this.dropNotAllowed,
            cn: [
            {
                cls: 'x-dd-drop-icon'
            },
            {
                cls: 'ext-dd-ghost-ct',
                cn: [
                {
                    cls: 'x-dd-drag-ghost'
                },
                {
                    cls: 'ext-dd-msg'
                }
                ]
            }
            ]
        },
        shadow: !config || config.shadow !== false
    });
    this.ghost = Ext.get(this.el.dom.childNodes[1].childNodes[0]);
    this.message = Ext.get(this.el.dom.childNodes[1].childNodes[1]);
    this.dropStatus = this.dropNotAllowed;
};

Ext.extend(Ext.calendar.StatusProxy, Ext.dd.StatusProxy, {
    /**
     * @cfg {String} moveEventCls
     * The CSS class to apply to the status element when an event is being dragged (defaults to 'ext-cal-dd-move').
     */
    moveEventCls: 'ext-cal-dd-move',
    /**
     * @cfg {String} addEventCls
     * The CSS class to apply to the status element when drop is not allowed (defaults to 'ext-cal-dd-add').
     */
    addEventCls: 'ext-cal-dd-add',

    // inherit docs
    update: function(html) {
        if (typeof html == 'string') {
            this.ghost.update(html);
        } else {
            this.ghost.update('');
            html.style.margin = '0';
            this.ghost.dom.appendChild(html);
        }
        var el = this.ghost.dom.firstChild;
        if (el) {
            Ext.fly(el).setStyle('float', 'none').setHeight('auto');
            Ext.getDom(el).id += '-ddproxy';
        }
    },

    /**
     * Update the calendar-specific drag status message without altering the ghost element.
     * @param {String} msg The new status message
     */
    updateMsg: function(msg) {
        this.message.update(msg);
    }
});/*
 * Internal drag zone implementation for the calendar components. This provides base functionality
 * and is primarily for the month view -- DayViewDD adds day/week view-specific functionality.
 */
Ext.calendar.DragZone = Ext.extend(Ext.dd.DragZone, {
    ddGroup: 'CalendarDD',
    eventSelector: '.ext-cal-evt',

    constructor: function(el, config) {
        if (!Ext.calendar._statusProxyInstance) {
            Ext.calendar._statusProxyInstance = new Ext.calendar.StatusProxy();
        }
        this.proxy = Ext.calendar._statusProxyInstance;
        Ext.calendar.DragZone.superclass.constructor.call(this, el, config);
    },

    getDragData: function(e) {
        // Check whether we are dragging on an event first
        var t = e.getTarget(this.eventSelector, 3);
        if (t) {
            var rec = this.view.getEventRecordFromEl(t);
            return {
                type: 'eventdrag',
                ddel: t,
                eventStart: rec.data[Ext.calendar.EventMappings.StartDate.name],
                eventEnd: rec.data[Ext.calendar.EventMappings.EndDate.name],
                proxy: this.proxy
            };
        }

        // If not dragging an event then we are dragging on
        // the calendar to add a new event
        t = this.view.getDayAt(e.getPageX(), e.getPageY());
        if (t.el) {
            return {
                type: 'caldrag',
                start: t.date,
                proxy: this.proxy
            };
        }
        return null;
    },

    onInitDrag: function(x, y) {
        if (this.dragData.ddel) {
            var ghost = this.dragData.ddel.cloneNode(true),
            child = Ext.fly(ghost).child('dl');

            Ext.fly(ghost).setWidth('auto');

            if (child) {
                // for IE/Opera
                child.setHeight('auto');
            }
            this.proxy.update(ghost);
            this.onStartDrag(x, y);
        }
        else if (this.dragData.start) {
            this.onStartDrag(x, y);
        }
        this.view.onInitDrag();
        return true;
    },

    afterRepair: function() {
        if (Ext.enableFx && this.dragData.ddel) {
            Ext.Element.fly(this.dragData.ddel).highlight(this.hlColor || 'c3daf9');
        }
        this.dragging = false;
    },

    getRepairXY: function(e) {
        if (this.dragData.ddel) {
            return Ext.Element.fly(this.dragData.ddel).getXY();
        }
    },

    afterInvalidDrop: function(e, id) {
        Ext.select('.ext-dd-shim').hide();
    }
});

/*
 * Internal drop zone implementation for the calendar components. This provides base functionality
 * and is primarily for the month view -- DayViewDD adds day/week view-specific functionality.
 */
Ext.calendar.DropZone = Ext.extend(Ext.dd.DropZone, {
    ddGroup: 'CalendarDD',
    eventSelector: '.ext-cal-evt',

    // private
    shims: [],

    getTargetFromEvent: function(e) {
        var dragOffset = this.dragOffset || 0,
        y = e.getPageY() - dragOffset,
        d = this.view.getDayAt(e.getPageX(), y);

        return d.el ? d: null;
    },

    onNodeOver: function(n, dd, e, data) {
        var D = Ext.calendar.Date,
        start = data.type == 'eventdrag' ? n.date: D.min(data.start, n.date),
        end = data.type == 'eventdrag' ? n.date.add(Date.DAY, D.diffDays(data.eventStart, data.eventEnd)) :
        D.max(data.start, n.date);

        if (!this.dragStartDate || !this.dragEndDate || (D.diffDays(start, this.dragStartDate) != 0) || (D.diffDays(end, this.dragEndDate) != 0)) {
            this.dragStartDate = start;
            this.dragEndDate = end.clearTime().add(Date.DAY, 1).add(Date.MILLI, -1);
            this.shim(start, end);

            var range = start.format('n/j');
            if (D.diffDays(start, end) > 0) {
                range += '-' + end.format('n/j');
            }
            var msg = String.format(data.type == 'eventdrag' ? this.moveText: this.createText, range);
            data.proxy.updateMsg(msg);
        }
        return this.dropAllowed;
    },

    shim: function(start, end) {
        this.currWeek = -1;
        var dt = start.clone(),
            i = 0,
            shim,
            box,
            cnt = Ext.calendar.Date.diffDays(dt, end) + 1;

        Ext.each(this.shims,
            function(shim) {
                if (shim) {
                    shim.isActive = false;
                }
            }
        );

        while (i++<cnt) {
            var dayEl = this.view.getDayEl(dt);

            // if the date is not in the current view ignore it (this
            // can happen when an event is dragged to the end of the
            // month so that it ends outside the view)
            if (dayEl) {
                var wk = this.view.getWeekIndex(dt);
                shim = this.shims[wk];

                if (!shim) {
                    shim = this.createShim();
                    this.shims[wk] = shim;
                }
                if (wk != this.currWeek) {
                    shim.boxInfo = dayEl.getBox();
                    this.currWeek = wk;
                }
                else {
                    box = dayEl.getBox();
                    shim.boxInfo.right = box.right;
                    shim.boxInfo.width = box.right - shim.boxInfo.x;
                }
                shim.isActive = true;
            }
            dt = dt.add(Date.DAY, 1);
        }

        Ext.each(this.shims,
        function(shim) {
            if (shim) {
                if (shim.isActive) {
                    shim.show();
                    shim.setBox(shim.boxInfo);
                }
                else if (shim.isVisible()) {
                    shim.hide();
                }
            }
        });
    },

    createShim: function() {
        if (!this.shimCt) {
            this.shimCt = Ext.get('ext-dd-shim-ct');
            if (!this.shimCt) {
                this.shimCt = document.createElement('div');
                this.shimCt.id = 'ext-dd-shim-ct';
                Ext.getBody().appendChild(this.shimCt);
            }
        }
        var el = document.createElement('div');
        el.className = 'ext-dd-shim';
        this.shimCt.appendChild(el);

        return new Ext.Layer({
            shadow: false,
            useDisplay: true,
            constrain: false
        },
        el);
    },

    clearShims: function() {
        Ext.each(this.shims,
        function(shim) {
            if (shim) {
                shim.hide();
            }
        });
    },

    onContainerOver: function(dd, e, data) {
        return this.dropAllowed;
    },

    onCalendarDragComplete: function() {
        delete this.dragStartDate;
        delete this.dragEndDate;
        this.clearShims();
    },

    onNodeDrop: function(n, dd, e, data) {
        if (n && data) {
            if (data.type == 'eventdrag') {
                var rec = this.view.getEventRecordFromEl(data.ddel),
                dt = Ext.calendar.Date.copyTime(rec.data[Ext.calendar.EventMappings.StartDate.name], n.date);

                this.view.onEventDrop(rec, dt);
                this.onCalendarDragComplete();
                return true;
            }
            if (data.type == 'caldrag') {
                this.view.onCalendarEndDrag(this.dragStartDate, this.dragEndDate,
                this.onCalendarDragComplete.createDelegate(this));
                //shims are NOT cleared here -- they stay visible until the handling
                //code calls the onCalendarDragComplete callback which hides them.
                return true;
            }
        }
        this.onCalendarDragComplete();
        return false;
    },

    onContainerDrop: function(dd, e, data) {
        this.onCalendarDragComplete();
        return false;
    },

    destroy: function() {
        Ext.calendar.DropZone.superclass.destroy.call(this);
        Ext.destroy(this.shimCt);
    }
});

/*
 * Internal drag zone implementation for the calendar day and week views.
 */
Ext.calendar.DayViewDragZone = Ext.extend(Ext.calendar.DragZone, {
    ddGroup: 'DayViewDD',
    resizeSelector: '.ext-evt-rsz',

    getDragData: function(e) {
        var t = e.getTarget(this.resizeSelector, 2, true),
            p,
            rec;
        if (t) {
            p = t.parent(this.eventSelector);
            rec = this.view.getEventRecordFromEl(p);

            return {
                type: 'eventresize',
                ddel: p.dom,
                eventStart: rec.data[Ext.calendar.EventMappings.StartDate.name],
                eventEnd: rec.data[Ext.calendar.EventMappings.EndDate.name],
                proxy: this.proxy
            };
        }
        t = e.getTarget(this.eventSelector, 3);
        if (t) {
            rec = this.view.getEventRecordFromEl(t);
            return {
                type: 'eventdrag',
                ddel: t,
                eventStart: rec.data[Ext.calendar.EventMappings.StartDate.name],
                eventEnd: rec.data[Ext.calendar.EventMappings.EndDate.name],
                proxy: this.proxy
            };
        }

        // If not dragging/resizing an event then we are dragging on
        // the calendar to add a new event
        t = this.view.getDayAt(e.getPageX(), e.getPageY());
        if (t.el) {
            return {
                type: 'caldrag',
                dayInfo: t,
                proxy: this.proxy
            };
        }
        return null;
    }
});

/*
 * Internal drop zone implementation for the calendar day and week views.
 */
Ext.calendar.DayViewDropZone = Ext.extend(Ext.calendar.DropZone, {
    ddGroup: 'DayViewDD',

    onNodeOver: function(n, dd, e, data) {
        var dt,
            box,
            endDt,
            text = this.createText,
            curr,
            start,
            end,
            evtEl,
            dayCol;
        if (data.type == 'caldrag') {
            if (!this.dragStartMarker) {
                // Since the container can scroll, this gets a little tricky.
                // There is no el in the DOM that we can measure by default since
                // the box is simply calculated from the original drag start (as opposed
                // to dragging or resizing the event where the orig event box is present).
                // To work around this we add a placeholder el into the DOM and give it
                // the original starting time's box so that we can grab its updated
                // box measurements as the underlying container scrolls up or down.
                // This placeholder is removed in onNodeDrop.
                this.dragStartMarker = n.el.parent().createChild({
                    style: 'position:absolute;'
                });
                this.dragStartMarker.setBox(n.timeBox);
                this.dragCreateDt = n.date;
            }
            box = this.dragStartMarker.getBox();
            box.height = Math.ceil(Math.abs(e.xy[1] - box.y) / n.timeBox.height) * n.timeBox.height;

            if (e.xy[1] < box.y) {
                box.height += n.timeBox.height;
                box.y = box.y - box.height + n.timeBox.height;
                endDt = this.dragCreateDt.add(Date.MINUTE, 30);
            }
            else {
                n.date = n.date.add(Date.MINUTE, 30);
            }
            this.shim(this.dragCreateDt, box);

            curr = Ext.calendar.Date.copyTime(n.date, this.dragCreateDt);
            this.dragStartDate = Ext.calendar.Date.min(this.dragCreateDt, curr);
            this.dragEndDate = endDt || Ext.calendar.Date.max(this.dragCreateDt, curr);

            dt = this.dragStartDate.format('g:ia-') + this.dragEndDate.format('g:ia');
        }
        else {
            evtEl = Ext.get(data.ddel);
            dayCol = evtEl.parent().parent();
            box = evtEl.getBox();

            box.width = dayCol.getWidth();

            if (data.type == 'eventdrag') {
                if (this.dragOffset === undefined) {
                    this.dragOffset = n.timeBox.y - box.y;
                    box.y = n.timeBox.y - this.dragOffset;
                }
                else {
                    box.y = n.timeBox.y;
                }
                dt = n.date.format('n/j g:ia');
                box.x = n.el.getLeft();

                this.shim(n.date, box);
                text = this.moveText;
            }
            if (data.type == 'eventresize') {
                if (!this.resizeDt) {
                    this.resizeDt = n.date;
                }
                box.x = dayCol.getLeft();
                box.height = Math.ceil(Math.abs(e.xy[1] - box.y) / n.timeBox.height) * n.timeBox.height;
                if (e.xy[1] < box.y) {
                    box.y -= box.height;
                }
                else {
                    n.date = n.date.add(Date.MINUTE, 30);
                }
                this.shim(this.resizeDt, box);

                curr = Ext.calendar.Date.copyTime(n.date, this.resizeDt);
                start = Ext.calendar.Date.min(data.eventStart, curr);
                end = Ext.calendar.Date.max(data.eventStart, curr);

                data.resizeDates = {
                    StartDate: start,
                    EndDate: end
                };
                dt = start.format('g:ia-') + end.format('g:ia');
                text = this.resizeText;
            }
        }

        data.proxy.updateMsg(String.format(text, dt));
        return this.dropAllowed;
    },

    shim: function(dt, box) {
        Ext.each(this.shims,
        function(shim) {
            if (shim) {
                shim.isActive = false;
                shim.hide();
            }
        });

        var shim = this.shims[0];
        if (!shim) {
            shim = this.createShim();
            this.shims[0] = shim;
        }

        shim.isActive = true;
        shim.show();
        shim.setBox(box);
    },

    onNodeDrop: function(n, dd, e, data) {
        var rec;
        if (n && data) {
            if (data.type == 'eventdrag') {
                rec = this.view.getEventRecordFromEl(data.ddel);
                this.view.onEventDrop(rec, n.date);
                this.onCalendarDragComplete();
                delete this.dragOffset;
                return true;
            }
            if (data.type == 'eventresize') {
                rec = this.view.getEventRecordFromEl(data.ddel);
                this.view.onEventResize(rec, data.resizeDates);
                this.onCalendarDragComplete();
                delete this.resizeDt;
                return true;
            }
            if (data.type == 'caldrag') {
                Ext.destroy(this.dragStartMarker);
                delete this.dragStartMarker;
                delete this.dragCreateDt;
                this.view.onCalendarEndDrag(this.dragStartDate, this.dragEndDate,
                this.onCalendarDragComplete.createDelegate(this));
                //shims are NOT cleared here -- they stay visible until the handling
                //code calls the onCalendarDragComplete callback which hides them.
                return true;
            }
        }
        this.onCalendarDragComplete();
        return false;
    }
});
/**
 * @class Ext.calendar.EventMappings
 * @extends Object
 * A simple object that provides the field definitions for EventRecords so that they can be easily overridden.
 */
Ext.calendar.EventMappings = {
    EventId: {
        name: 'EventId',
        mapping: 'id',
        type: 'int'
    },
    CalendarId: {
        name: 'CalendarId',
        mapping: 'cid',
        type: 'int'
    },
    Title: {
        name: 'Title',
        mapping: 'title',
        type: 'string'
    },
    StartDate: {
        name: 'StartDate',
        mapping: 'start',
        type: 'date',
        dateFormat: 'c'
    },
    EndDate: {
        name: 'EndDate',
        mapping: 'end',
        type: 'date',
        dateFormat: 'c'
    },
    Location: {
        name: 'Location',
        mapping: 'loc',
        type: 'string'
    },
    Notes: {
        name: 'Notes',
        mapping: 'notes',
        type: 'string'
    },
    Url: {
        name: 'Url',
        mapping: 'url',
        type: 'string'
    },
    IsAllDay: {
        name: 'IsAllDay',
        mapping: 'ad',
        type: 'boolean'
    },
    Reminder: {
        name: 'Reminder',
        mapping: 'rem',
        type: 'string'
    },
    IsNew: {
        name: 'IsNew',
        mapping: 'n',
        type: 'boolean'
    }
};

/**
 * @class Ext.calendar.EventRecord
 * @extends Ext.data.Record
 * <p>This is the {@link Ext.data.Record Record} specification for calendar event data used by the
 * {@link Ext.calendar.CalendarPanel CalendarPanel}'s underlying store. It can be overridden as 
 * necessary to customize the fields supported by events, although the existing column names should
 * not be altered. If your model fields are named differently you should update the <b>mapping</b>
 * configs accordingly.</p>
 * <p>The only required fields when creating a new event record instance are StartDate and
 * EndDate.  All other fields are either optional are will be defaulted if blank.</p>
 * <p>Here is a basic example for how to create a new record of this type:<pre><code>
rec = new Ext.calendar.EventRecord({
    StartDate: '2101-01-12 12:00:00',
    EndDate: '2101-01-12 13:30:00',
    Title: 'My cool event',
    Notes: 'Some notes'
});
</code></pre>
 * If you have overridden any of the record's data mappings via the Ext.calendar.EventMappings object
 * you may need to set the values using this alternate syntax to ensure that the fields match up correctly:<pre><code>
var M = Ext.calendar.EventMappings;

rec = new Ext.calendar.EventRecord();
rec.data[M.StartDate.name] = '2101-01-12 12:00:00';
rec.data[M.EndDate.name] = '2101-01-12 13:30:00';
rec.data[M.Title.name] = 'My cool event';
rec.data[M.Notes.name] = 'Some notes';
</code></pre>
 * @constructor
 * @param {Object} data (Optional) An object, the properties of which provide values for the new Record's
 * fields. If not specified the {@link Ext.data.Field#defaultValue defaultValue}
 * for each field will be assigned.
 * @param {Object} id (Optional) The id of the Record. The id is used by the
 * {@link Ext.data.Store} object which owns the Record to index its collection
 * of Records (therefore this id should be unique within each store). If an
 * id is not specified a {@link #phantom}
 * Record will be created with an {@link #Record.id automatically generated id}.
 */
 (function() {
    var M = Ext.calendar.EventMappings;

    Ext.calendar.EventRecord = Ext.data.Record.create([
    M.EventId,
    M.CalendarId,
    M.Title,
    M.StartDate,
    M.EndDate,
    M.Location,
    M.Notes,
    M.Url,
    M.IsAllDay,
    M.Reminder,
    M.IsNew
    ]);

    /**
     * Reconfigures the default record definition based on the current Ext.calendar.EventMappings object
     */
    Ext.calendar.EventRecord.reconfigure = function() {
        Ext.calendar.EventRecord = Ext.data.Record.create([
        M.EventId,
        M.CalendarId,
        M.Title,
        M.StartDate,
        M.EndDate,
        M.Location,
        M.Notes,
        M.Url,
        M.IsAllDay,
        M.Reminder,
        M.IsNew
        ]);
    };
})();
/*
 * This is the view used internally by the panel that displays overflow events in the
 * month view. Anytime a day cell cannot display all of its events, it automatically displays
 * a link at the bottom to view all events for that day. When clicked, a panel pops up that
 * uses this view to display the events for that day.
 */
Ext.calendar.MonthDayDetailView = Ext.extend(Ext.BoxComponent, {
    initComponent: function() {
        Ext.calendar.CalendarView.superclass.initComponent.call(this);

        this.addEvents({
            eventsrendered: true
        });

        if (!this.el) {
            this.el = document.createElement('div');
        }
    },

    afterRender: function() {
        this.tpl = this.getTemplate();

        Ext.calendar.MonthDayDetailView.superclass.afterRender.call(this);

        this.el.on({
            'click': this.view.onClick,
            'mouseover': this.view.onMouseOver,
            'mouseout': this.view.onMouseOut,
            scope: this.view
        });
    },

    getTemplate: function() {
        if (!this.tpl) {
            this.tpl = new Ext.XTemplate(
            '<div class="ext-cal-mdv x-unselectable">',
            '<table class="ext-cal-mvd-tbl" cellpadding="0" cellspacing="0">',
            '<tbody>',
            '<tpl for=".">',
            '<tr><td class="ext-cal-ev">{markup}</td></tr>',
            '</tpl>',
            '</tbody>',
            '</table>',
            '</div>'
            );
        }
        this.tpl.compile();
        return this.tpl;
    },

    update: function(dt) {
        this.date = dt;
        this.refresh();
    },

    refresh: function() {
        if (!this.rendered) {
            return;
        }
        var eventTpl = this.view.getEventTemplate(),

        templateData = [];

        evts = this.store.queryBy(function(rec) {
            var thisDt = this.date.clearTime(true).getTime(),
                recStart = rec.data[Ext.calendar.EventMappings.StartDate.name].clearTime(true).getTime(),
                startsOnDate = (thisDt == recStart),
                spansDate = false;

            if (!startsOnDate) {
                var recEnd = rec.data[Ext.calendar.EventMappings.EndDate.name].clearTime(true).getTime();
                spansDate = recStart < thisDt && recEnd >= thisDt;
            }
            return startsOnDate || spansDate;
        },
        this);

        evts.each(function(evt) {
            var item = evt.data,
            M = Ext.calendar.EventMappings;

            item._renderAsAllDay = item[M.IsAllDay.name] || Ext.calendar.Date.diffDays(item[M.StartDate.name], item[M.EndDate.name]) > 0;
            item.spanLeft = Ext.calendar.Date.diffDays(item[M.StartDate.name], this.date) > 0;
            item.spanRight = Ext.calendar.Date.diffDays(this.date, item[M.EndDate.name]) > 0;
            item.spanCls = (item.spanLeft ? (item.spanRight ? 'ext-cal-ev-spanboth':
            'ext-cal-ev-spanleft') : (item.spanRight ? 'ext-cal-ev-spanright': ''));

            templateData.push({
                markup: eventTpl.apply(this.getTemplateEventData(item))
            });
        },
        this);

        this.tpl.overwrite(this.el, templateData);
        this.fireEvent('eventsrendered', this, this.date, evts.getCount());
    },

    getTemplateEventData: function(evt) {
        var data = this.view.getTemplateEventData(evt);
        data._elId = 'dtl-' + data._elId;
        return data;
    }
});

Ext.reg('monthdaydetailview', Ext.calendar.MonthDayDetailView);
/**
 * @class Ext.calendar.CalendarPicker
 * @extends Ext.form.ComboBox
 * <p>A custom combo used for choosing from the list of available calendars to assign an event to.</p>
 * <p>This is pretty much a standard combo that is simply pre-configured for the options needed by the
 * calendar components. The default configs are as follows:<pre><code>
    fieldLabel: 'Calendar',
    valueField: 'CalendarId',
    displayField: 'Title',
    triggerAction: 'all',
    mode: 'local',
    forceSelection: true,
    width: 200
</code></pre>
 * @constructor
 * @param {Object} config The config object
 */
Ext.calendar.CalendarPicker = Ext.extend(Ext.form.ComboBox, {
    fieldLabel: 'Calendar',
    valueField: 'CalendarId',
    displayField: 'Title',
    triggerAction: 'all',
    mode: 'local',
    forceSelection: true,
    width: 200,

    // private
    initComponent: function() {
        Ext.calendar.CalendarPicker.superclass.initComponent.call(this);
        this.tpl = this.tpl ||
        '<tpl for="."><div class="x-combo-list-item ext-color-{' + this.valueField +
        '}"><div class="ext-cal-picker-icon">&nbsp;</div>{' + this.displayField + '}</div></tpl>';
    },

    // private
    afterRender: function() {
        Ext.calendar.CalendarPicker.superclass.afterRender.call(this);

        this.wrap = this.el.up('.x-form-field-wrap');
        this.wrap.addClass('ext-calendar-picker');

        this.icon = Ext.DomHelper.append(this.wrap, {
            tag: 'div',
            cls: 'ext-cal-picker-icon ext-cal-picker-mainicon'
        });
    },

    // inherited docs
    setValue: function(value) {
        this.wrap.removeClass('ext-color-' + this.getValue());
        if (!value && this.store !== undefined) {
            // always default to a valid calendar
            value = this.store.getAt(0).data.CalendarId;
        }
        Ext.calendar.CalendarPicker.superclass.setValue.call(this, value);
        this.wrap.addClass('ext-color-' + value);
    }
});

Ext.reg('calendarpicker', Ext.calendar.CalendarPicker);
/*
 * This is an internal helper class for the calendar views and should not be overridden.
 * It is responsible for the base event rendering logic underlying all of the calendar views.
 */
Ext.calendar.WeekEventRenderer = function() {

    var getEventRow = function(id, week, index) {
        var indexOffset = 1,
            //skip row with date #'s
            evtRow,
            wkRow = Ext.get(id + '-wk-' + week);
        if (wkRow) {
            var table = wkRow.child('.ext-cal-evt-tbl', true);
                evtRow = table.tBodies[0].childNodes[index + indexOffset];
            if (!evtRow) {
                evtRow = Ext.DomHelper.append(table.tBodies[0], '<tr></tr>');
            }
        }
        return Ext.get(evtRow);
    };

    return {
        render: function(o) {
            var w = 0,
                grid = o.eventGrid,
                dt = o.viewStart.clone(),
                eventTpl = o.tpl,
                max = o.maxEventsPerDay != undefined ? o.maxEventsPerDay: 999,
                weekCount = o.weekCount < 1 ? 6: o.weekCount,
                dayCount = o.weekCount == 1 ? o.dayCount: 7,
                cellCfg;

            for (; w < weekCount; w++) {
                if (!grid[w] || grid[w].length == 0) {
                    // no events or span cells for the entire week
                    if (weekCount == 1) {
                        row = getEventRow(o.id, w, 0);
                        cellCfg = {
                            tag: 'td',
                            cls: 'ext-cal-ev',
                            id: o.id + '-empty-0-day-' + dt.format('Ymd'),
                            html: '&nbsp;'
                        };
                        if (dayCount > 1) {
                            cellCfg.colspan = dayCount;
                        }
                        Ext.DomHelper.append(row, cellCfg);
                    }
                    dt = dt.add(Date.DAY, 7);
                } else {
                    var row,
                        d = 0,
                        wk = grid[w],
                        startOfWeek = dt.clone(),
                        endOfWeek = startOfWeek.add(Date.DAY, dayCount).add(Date.MILLI, -1);

                    for (; d < dayCount; d++) {
                        if (wk[d]) {
                            var ev = emptyCells = skipped = 0,
                                day = wk[d],
                                ct = day.length,
                                evt;

                            for (; ev < ct; ev++) {
                                if (!day[ev]) {
                                    emptyCells++;
                                    continue;
                                }
                                if (emptyCells > 0 && ev - emptyCells < max) {
                                    row = getEventRow(o.id, w, ev - emptyCells);
                                    cellCfg = {
                                        tag: 'td',
                                        cls: 'ext-cal-ev',
                                        id: o.id + '-empty-' + ct + '-day-' + dt.format('Ymd')
                                    };
                                    if (emptyCells > 1 && max - ev > emptyCells) {
                                        cellCfg.rowspan = Math.min(emptyCells, max - ev);
                                    }
                                    Ext.DomHelper.append(row, cellCfg);
                                    emptyCells = 0;
                                }

                                if (ev >= max) {
                                    skipped++;
                                    continue;
                                }
                                evt = day[ev];

                                if (!evt.isSpan || evt.isSpanStart) {
                                    //skip non-starting span cells
                                    var item = evt.data || evt.event.data;
                                    item._weekIndex = w;
                                    item._renderAsAllDay = item[Ext.calendar.EventMappings.IsAllDay.name] || evt.isSpanStart;
                                    item.spanLeft = item[Ext.calendar.EventMappings.StartDate.name].getTime() < startOfWeek.getTime();
                                    item.spanRight = item[Ext.calendar.EventMappings.EndDate.name].getTime() > endOfWeek.getTime();
                                    item.spanCls = (item.spanLeft ? (item.spanRight ? 'ext-cal-ev-spanboth':
                                    'ext-cal-ev-spanleft') : (item.spanRight ? 'ext-cal-ev-spanright': ''));

                                    row = getEventRow(o.id, w, ev);
                                    cellCfg = {
                                        tag: 'td',
                                        cls: 'ext-cal-ev',
                                        cn: eventTpl.apply(o.templateDataFn(item))
                                    };
                                    var diff = Ext.calendar.Date.diffDays(dt, item[Ext.calendar.EventMappings.EndDate.name]) + 1,
                                        cspan = Math.min(diff, dayCount - d);

                                    if (cspan > 1) {
                                        cellCfg.colspan = cspan;
                                    }
                                    Ext.DomHelper.append(row, cellCfg);
                                }
                            }
                            if (ev > max) {
                                row = getEventRow(o.id, w, max);
                                Ext.DomHelper.append(row, {
                                    tag: 'td',
                                    cls: 'ext-cal-ev-more',
                                    id: 'ext-cal-ev-more-' + dt.format('Ymd'),
                                    cn: {
                                        tag: 'a',
                                        html: '+' + skipped + ' more...'
                                    }
                                });
                            }
                            if (ct < o.evtMaxCount[w]) {
                                row = getEventRow(o.id, w, ct);
                                if (row) {
                                    cellCfg = {
                                        tag: 'td',
                                        cls: 'ext-cal-ev',
                                        id: o.id + '-empty-' + (ct + 1) + '-day-' + dt.format('Ymd')
                                    };
                                    var rowspan = o.evtMaxCount[w] - ct;
                                    if (rowspan > 1) {
                                        cellCfg.rowspan = rowspan;
                                    }
                                    Ext.DomHelper.append(row, cellCfg);
                                }
                            }
                        } else {
                            row = getEventRow(o.id, w, 0);
                            if (row) {
                                cellCfg = {
                                    tag: 'td',
                                    cls: 'ext-cal-ev',
                                    id: o.id + '-empty-day-' + dt.format('Ymd')
                                };
                                if (o.evtMaxCount[w] > 1) {
                                    cellCfg.rowSpan = o.evtMaxCount[w];
                                }
                                Ext.DomHelper.append(row, cellCfg);
                            }
                        }
                        dt = dt.add(Date.DAY, 1);
                    }
                }
            }
        }
    };
}();
/**
 * @class Ext.calendar.CalendarView
 * @extends Ext.BoxComponent
 * <p>This is an abstract class that serves as the base for other calendar views. This class is not
 * intended to be directly instantiated.</p>
 * <p>When extending this class to create a custom calendar view, you must provide an implementation
 * for the <code>renderItems</code> method, as there is no default implementation for rendering events
 * The rendering logic is totally dependent on how the UI structures its data, which
 * is determined by the underlying UI template (this base class does not have a template).</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext.calendar.CalendarView = Ext.extend(Ext.BoxComponent, {
    /**
     * @cfg {Number} startDay
     * The 0-based index for the day on which the calendar week begins (0=Sunday, which is the default)
     */
    startDay: 0,
    /**
     * @cfg {Boolean} spansHavePriority
     * Allows switching between two different modes of rendering events that span multiple days. When true,
     * span events are always sorted first, possibly at the expense of start dates being out of order (e.g., 
     * a span event that starts at 11am one day and spans into the next day would display before a non-spanning 
     * event that starts at 10am, even though they would not be in date order). This can lead to more compact
     * layouts when there are many overlapping events. If false (the default), events will always sort by start date
     * first which can result in a less compact, but chronologically consistent layout.
     */
    spansHavePriority: false,
    /**
     * @cfg {Boolean} trackMouseOver
     * Whether or not the view tracks and responds to the browser mouseover event on contained elements (defaults to
     * true). If you don't need mouseover event highlighting you can disable this.
     */
    trackMouseOver: true,
    /**
     * @cfg {Boolean} enableFx
     * Determines whether or not visual effects for CRUD actions are enabled (defaults to true). If this is false
     * it will override any values for {@link #enableAddFx}, {@link #enableUpdateFx} or {@link enableRemoveFx} and
     * all animations will be disabled.
     */
    enableFx: true,
    /**
     * @cfg {Boolean} enableAddFx
     * True to enable a visual effect on adding a new event (the default), false to disable it. Note that if 
     * {@link #enableFx} is false it will override this value. The specific effect that runs is defined in the
     * {@link #doAddFx} method.
     */
    enableAddFx: true,
    /**
     * @cfg {Boolean} enableUpdateFx
     * True to enable a visual effect on updating an event, false to disable it (the default). Note that if 
     * {@link #enableFx} is false it will override this value. The specific effect that runs is defined in the
     * {@link #doUpdateFx} method.
     */
    enableUpdateFx: false,
    /**
     * @cfg {Boolean} enableRemoveFx
     * True to enable a visual effect on removing an event (the default), false to disable it. Note that if 
     * {@link #enableFx} is false it will override this value. The specific effect that runs is defined in the
     * {@link #doRemoveFx} method.
     */
    enableRemoveFx: true,
    /**
     * @cfg {Boolean} enableDD
     * True to enable drag and drop in the calendar view (the default), false to disable it
     */
    enableDD: true,
    /**
     * @cfg {Boolean} monitorResize
     * True to monitor the browser's resize event (the default), false to ignore it. If the calendar view is rendered
     * into a fixed-size container this can be set to false. However, if the view can change dimensions (e.g., it's in 
     * fit layout in a viewport or some other resizable container) it is very important that this config is true so that
     * any resize event propagates properly to all subcomponents and layouts get recalculated properly.
     */
    monitorResize: true,
    /**
     * @cfg {String} ddCreateEventText
     * The text to display inside the drag proxy while dragging over the calendar to create a new event (defaults to 
     * 'Create event for {0}' where {0} is a date range supplied by the view)
     */
    ddCreateEventText: 'Create event for {0}',
    /**
     * @cfg {String} ddMoveEventText
     * The text to display inside the drag proxy while dragging an event to reposition it (defaults to 
     * 'Move event to {0}' where {0} is the updated event start date/time supplied by the view)
     */
    ddMoveEventText: 'Move event to {0}',
    /**
     * @cfg {String} ddResizeEventText
     * The string displayed to the user in the drag proxy while dragging the resize handle of an event (defaults to 
     * 'Update event to {0}' where {0} is the updated event start-end range supplied by the view). Note that 
     * this text is only used in views
     * that allow resizing of events.
     */
    ddResizeEventText: 'Update event to {0}',

    //private properties -- do not override:
    weekCount: 1,
    dayCount: 1,
    eventSelector: '.ext-cal-evt',
    eventOverClass: 'ext-evt-over',
    eventElIdDelimiter: '-evt-',
    dayElIdDelimiter: '-day-',

    /**
     * Returns a string of HTML template markup to be used as the body portion of the event template created
     * by {@link #getEventTemplate}. This provdes the flexibility to customize what's in the body without
     * having to override the entire XTemplate. This string can include any valid {@link Ext.Template} code, and
     * any data tokens accessible to the containing event template can be referenced in this string.
     * @return {String} The body template string
     */
    getEventBodyMarkup: Ext.emptyFn,
    // must be implemented by a subclass
    /**
     * <p>Returns the XTemplate that is bound to the calendar's event store (it expects records of type
     * {@link Ext.calendar.EventRecord}) to populate the calendar views with events. Internally this method
     * by default generates different markup for browsers that support CSS border radius and those that don't.
     * This method can be overridden as needed to customize the markup generated.</p>
     * <p>Note that this method calls {@link #getEventBodyMarkup} to retrieve the body markup for events separately
     * from the surrounding container markup.  This provdes the flexibility to customize what's in the body without
     * having to override the entire XTemplate. If you do override this method, you should make sure that your 
     * overridden version also does the same.</p>
     * @return {Ext.XTemplate} The event XTemplate
     */
    getEventTemplate: Ext.emptyFn,
    // must be implemented by a subclass
    // private
    initComponent: function() {
        this.setStartDate(this.startDate || new Date());

        Ext.calendar.CalendarView.superclass.initComponent.call(this);

        this.addEvents({
            /**
             * @event eventsrendered
             * Fires after events are finished rendering in the view
             * @param {Ext.calendar.CalendarView} this 
             */
            eventsrendered: true,
            /**
             * @event eventclick
             * Fires after the user clicks on an event element
             * @param {Ext.calendar.CalendarView} this
             * @param {Ext.calendar.EventRecord} rec The {@link Ext.calendar.EventRecord record} for the event that was clicked on
             * @param {HTMLNode} el The DOM node that was clicked on
             */
            eventclick: true,
            /**
             * @event eventover
             * Fires anytime the mouse is over an event element
             * @param {Ext.calendar.CalendarView} this
             * @param {Ext.calendar.EventRecord} rec The {@link Ext.calendar.EventRecord record} for the event that the cursor is over
             * @param {HTMLNode} el The DOM node that is being moused over
             */
            eventover: true,
            /**
             * @event eventout
             * Fires anytime the mouse exits an event element
             * @param {Ext.calendar.CalendarView} this
             * @param {Ext.calendar.EventRecord} rec The {@link Ext.calendar.EventRecord record} for the event that the cursor exited
             * @param {HTMLNode} el The DOM node that was exited
             */
            eventout: true,
            /**
             * @event datechange
             * Fires after the start date of the view changes
             * @param {Ext.calendar.CalendarView} this
             * @param {Date} startDate The start date of the view (as explained in {@link #getStartDate}
             * @param {Date} viewStart The first displayed date in the view
             * @param {Date} viewEnd The last displayed date in the view
             */
            datechange: true,
            /**
             * @event rangeselect
             * Fires after the user drags on the calendar to select a range of dates/times in which to create an event
             * @param {Ext.calendar.CalendarView} this
             * @param {Object} dates An object containing the start (StartDate property) and end (EndDate property) dates selected
             * @param {Function} callback A callback function that MUST be called after the event handling is complete so that
             * the view is properly cleaned up (shim elements are persisted in the view while the user is prompted to handle the
             * range selection). The callback is already created in the proper scope, so it simply needs to be executed as a standard
             * function call (e.g., callback()).
             */
            rangeselect: true,
            /**
             * @event eventmove
             * Fires after an event element is dragged by the user and dropped in a new position
             * @param {Ext.calendar.CalendarView} this
             * @param {Ext.calendar.EventRecord} rec The {@link Ext.calendar.EventRecord record} for the event that was moved with
             * updated start and end dates
             */
            eventmove: true,
            /**
             * @event initdrag
             * Fires when a drag operation is initiated in the view
             * @param {Ext.calendar.CalendarView} this
             */
            initdrag: true,
            /**
             * @event dayover
             * Fires while the mouse is over a day element 
             * @param {Ext.calendar.CalendarView} this
             * @param {Date} dt The date that is being moused over
             * @param {Ext.Element} el The day Element that is being moused over
             */
            dayover: true,
            /**
             * @event dayout
             * Fires when the mouse exits a day element 
             * @param {Ext.calendar.CalendarView} this
             * @param {Date} dt The date that is exited
             * @param {Ext.Element} el The day Element that is exited
             */
            dayout: true
            /*
             * @event eventdelete
             * Fires after an event element is deleted by the user. Not currently implemented directly at the view level -- currently 
             * deletes only happen from one of the forms.
             * @param {Ext.calendar.CalendarView} this
             * @param {Ext.calendar.EventRecord} rec The {@link Ext.calendar.EventRecord record} for the event that was deleted
             */
            //eventdelete: true
        });
    },

    // private
    afterRender: function() {
        Ext.calendar.CalendarView.superclass.afterRender.call(this);

        this.renderTemplate();

        if (this.store) {
            this.setStore(this.store, true);
        }

        this.el.on({
            'mouseover': this.onMouseOver,
            'mouseout': this.onMouseOut,
            'click': this.onClick,
            'resize': this.onResize,
            scope: this
        });

        this.el.unselectable();

        if (this.enableDD && this.initDD) {
            this.initDD();
        }

        this.on('eventsrendered', this.forceSize);
        this.forceSize.defer(100, this);

    },

    // private
    forceSize: function() {
        if (this.el && this.el.child) {
            var hd = this.el.child('.ext-cal-hd-ct'),
            bd = this.el.child('.ext-cal-body-ct');

            if (bd == null || hd == null) return;

            var headerHeight = hd.getHeight(),
            sz = this.el.parent().getSize();

            bd.setHeight(sz.height - headerHeight);
        }
    },

    refresh: function() {
        this.prepareData();
        this.renderTemplate();
        this.renderItems();
    },

    getWeekCount: function() {
        var days = Ext.calendar.Date.diffDays(this.viewStart, this.viewEnd);
        return Math.ceil(days / this.dayCount);
    },

    // private
    prepareData: function() {
        var lastInMonth = this.startDate.getLastDateOfMonth(),
        w = 0,
        row = 0,
        dt = this.viewStart.clone(),
        weeks = this.weekCount < 1 ? 6: this.weekCount;

        this.eventGrid = [[]];
        this.allDayGrid = [[]];
        this.evtMaxCount = [];

        var evtsInView = this.store.queryBy(function(rec) {
            return this.isEventVisible(rec.data);
        },
        this);

        for (; w < weeks; w++) {
            this.evtMaxCount[w] = 0;
            if (this.weekCount == -1 && dt > lastInMonth) {
                //current week is fully in next month so skip
                break;
            }
            this.eventGrid[w] = this.eventGrid[w] || [];
            this.allDayGrid[w] = this.allDayGrid[w] || [];

            for (d = 0; d < this.dayCount; d++) {
                if (evtsInView.getCount() > 0) {
                    var evts = evtsInView.filterBy(function(rec) {
                        var startsOnDate = (dt.getTime() == rec.data[Ext.calendar.EventMappings.StartDate.name].clearTime(true).getTime());
                        var spansFromPrevView = (w == 0 && d == 0 && (dt > rec.data[Ext.calendar.EventMappings.StartDate.name]));
                        return startsOnDate || spansFromPrevView;
                    },
                    this);

                    this.sortEventRecordsForDay(evts);
                    this.prepareEventGrid(evts, w, d);
                }
                dt = dt.add(Date.DAY, 1);
            }
        }
        this.currentWeekCount = w;
    },

    // private
    prepareEventGrid: function(evts, w, d) {
        var row = 0,
        dt = this.viewStart.clone(),
        max = this.maxEventsPerDay ? this.maxEventsPerDay: 999;

        evts.each(function(evt) {
            var M = Ext.calendar.EventMappings,
            days = Ext.calendar.Date.diffDays(
            Ext.calendar.Date.max(this.viewStart, evt.data[M.StartDate.name]),
            Ext.calendar.Date.min(this.viewEnd, evt.data[M.EndDate.name])) + 1;

            if (days > 1 || Ext.calendar.Date.diffDays(evt.data[M.StartDate.name], evt.data[M.EndDate.name]) > 1) {
                this.prepareEventGridSpans(evt, this.eventGrid, w, d, days);
                this.prepareEventGridSpans(evt, this.allDayGrid, w, d, days, true);
            } else {
                row = this.findEmptyRowIndex(w, d);
                this.eventGrid[w][d] = this.eventGrid[w][d] || [];
                this.eventGrid[w][d][row] = evt;

                if (evt.data[M.IsAllDay.name]) {
                    row = this.findEmptyRowIndex(w, d, true);
                    this.allDayGrid[w][d] = this.allDayGrid[w][d] || [];
                    this.allDayGrid[w][d][row] = evt;
                }
            }

            if (this.evtMaxCount[w] < this.eventGrid[w][d].length) {
                this.evtMaxCount[w] = Math.min(max + 1, this.eventGrid[w][d].length);
            }
            return true;
        },
        this);
    },

    // private
    prepareEventGridSpans: function(evt, grid, w, d, days, allday) {
        // this event spans multiple days/weeks, so we have to preprocess
        // the events and store special span events as placeholders so that
        // the render routine can build the necessary TD spans correctly.
        var w1 = w,
        d1 = d,
        row = this.findEmptyRowIndex(w, d, allday),
        dt = this.viewStart.clone();

        var start = {
            event: evt,
            isSpan: true,
            isSpanStart: true,
            spanLeft: false,
            spanRight: (d == 6)
        };
        grid[w][d] = grid[w][d] || [];
        grid[w][d][row] = start;

        while (--days) {
            dt = dt.add(Date.DAY, 1);
            if (dt > this.viewEnd) {
                break;
            }
            if (++d1 > 6) {
                // reset counters to the next week
                d1 = 0;
                w1++;
                row = this.findEmptyRowIndex(w1, 0);
            }
            grid[w1] = grid[w1] || [];
            grid[w1][d1] = grid[w1][d1] || [];

            grid[w1][d1][row] = {
                event: evt,
                isSpan: true,
                isSpanStart: (d1 == 0),
                spanLeft: (w1 > w) && (d1 % 7 == 0),
                spanRight: (d1 == 6) && (days > 1)
            };
        }
    },

    // private
    findEmptyRowIndex: function(w, d, allday) {
        var grid = allday ? this.allDayGrid: this.eventGrid,
        day = grid[w] ? grid[w][d] || [] : [],
        i = 0,
        ln = day.length;

        for (; i < ln; i++) {
            if (day[i] == null) {
                return i;
            }
        }
        return ln;
    },

    // private
    renderTemplate: function() {
        if (this.tpl) {
            this.tpl.overwrite(this.el, this.getParams());
            this.lastRenderStart = this.viewStart.clone();
            this.lastRenderEnd = this.viewEnd.clone();
        }
    },

    disableStoreEvents: function() {
        this.monitorStoreEvents = false;
    },

    enableStoreEvents: function(refresh) {
        this.monitorStoreEvents = true;
        if (refresh === true) {
            this.refresh();
        }
    },

    // private
    onResize: function() {
        this.refresh();
    },

    // private
    onInitDrag: function() {
        this.fireEvent('initdrag', this);
    },

    // private
    onEventDrop: function(rec, dt) {
        if (Ext.calendar.Date.compare(rec.data[Ext.calendar.EventMappings.StartDate.name], dt) === 0) {
            // no changes
            return;
        }
        var diff = dt.getTime() - rec.data[Ext.calendar.EventMappings.StartDate.name].getTime();
        rec.set(Ext.calendar.EventMappings.StartDate.name, dt);
        rec.set(Ext.calendar.EventMappings.EndDate.name, rec.data[Ext.calendar.EventMappings.EndDate.name].add(Date.MILLI, diff));

        this.fireEvent('eventmove', this, rec);
    },

    // private
    onCalendarEndDrag: function(start, end, onComplete) {
        // set this flag for other event handlers that might conflict while we're waiting
        this.dragPending = true;

        // have to wait for the user to save or cancel before finalizing the dd interation
        var o = {};
        o[Ext.calendar.EventMappings.StartDate.name] = start;
        o[Ext.calendar.EventMappings.EndDate.name] = end;

        this.fireEvent('rangeselect', this, o, this.onCalendarEndDragComplete.createDelegate(this, [onComplete]));
    },

    // private
    onCalendarEndDragComplete: function(onComplete) {
        // callback for the drop zone to clean up
        onComplete();
        // clear flag for other events to resume normally
        this.dragPending = false;
    },

    // private
    onUpdate: function(ds, rec, operation) {
        if (this.monitorStoreEvents === false) {
            return;
        }
        if (operation == Ext.data.Record.COMMIT) {
            this.refresh();
            if (this.enableFx && this.enableUpdateFx) {
                this.doUpdateFx(this.getEventEls(rec.data[Ext.calendar.EventMappings.EventId.name]), {
                    scope: this
                });
            }
        }
    },


    doUpdateFx: function(els, o) {
        this.highlightEvent(els, null, o);
    },

    // private
    onAdd: function(ds, records, index) {
        if (this.monitorStoreEvents === false) {
            return;
        }
        var rec = records[0];
        this.tempEventId = rec.id;
        this.refresh();

        if (this.enableFx && this.enableAddFx) {
            this.doAddFx(this.getEventEls(rec.data[Ext.calendar.EventMappings.EventId.name]), {
                scope: this
            });
        };
    },

    doAddFx: function(els, o) {
        els.fadeIn(Ext.apply(o, {
            duration: 2
        }));
    },

    // private
    onRemove: function(ds, rec) {
        if (this.monitorStoreEvents === false) {
            return;
        }
        if (this.enableFx && this.enableRemoveFx) {
            this.doRemoveFx(this.getEventEls(rec.data[Ext.calendar.EventMappings.EventId.name]), {
                remove: true,
                scope: this,
                callback: this.refresh
            });
        }
        else {
            this.getEventEls(rec.data[Ext.calendar.EventMappings.EventId.name]).remove();
            this.refresh();
        }
    },

    doRemoveFx: function(els, o) {
        els.fadeOut(o);
    },

    /**
     * Visually highlights an event using {@link Ext.Fx#highlight} config options.
     * If {@link #highlightEventActions} is false this method will have no effect.
     * @param {Ext.CompositeElement} els The element(s) to highlight
     * @param {Object} color (optional) The highlight color. Should be a 6 char hex 
     * color without the leading # (defaults to yellow: 'ffff9c')
     * @param {Object} o (optional) Object literal with any of the {@link Ext.Fx} config 
     * options. See {@link Ext.Fx#highlight} for usage examples.
     */
    highlightEvent: function(els, color, o) {
        if (this.enableFx) {
            var c;
            ! (Ext.isIE || Ext.isOpera) ?
            els.highlight(color, o) :
            // Fun IE/Opera handling:
            els.each(function(el) {
                el.highlight(color, Ext.applyIf({
                    attr: 'color'
                },
                o));
                c = el.child('.ext-cal-evm');
                if (c) {
                    c.highlight(color, o);
                }
            },
            this);
        }
    },

    /**
     * Retrieve an Event object's id from its corresponding node in the DOM.
     * @param {String/Element/HTMLElement} el An {@link Ext.Element}, DOM node or id
     */
    getEventIdFromEl: function(el) {
        el = Ext.get(el);
        var id = el.id.split(this.eventElIdDelimiter)[1];
        if (id.indexOf('-') > -1) {
            //This id has the index of the week it is rendered in as the suffix.
            //This allows events that span across weeks to still have reproducibly-unique DOM ids.
            id = id.split('-')[0];
        }
        return id;
    },

    // private
    getEventId: function(eventId) {
        if (eventId === undefined && this.tempEventId) {
            eventId = this.tempEventId;
        }
        return eventId;
    },

    /**
     * 
     * @param {String} eventId
     * @param {Boolean} forSelect
     * @return {String} The selector class
     */
    getEventSelectorCls: function(eventId, forSelect) {
        var prefix = forSelect ? '.': '';
        return prefix + this.id + this.eventElIdDelimiter + this.getEventId(eventId);
    },

    /**
     * 
     * @param {String} eventId
     * @return {Ext.CompositeElement} The matching CompositeElement of nodes
     * that comprise the rendered event.  Any event that spans across a view 
     * boundary will contain more than one internal Element.
     */
    getEventEls: function(eventId) {
        var els = Ext.select(this.getEventSelectorCls(this.getEventId(eventId), true), false, this.el.id);
        return new Ext.CompositeElement(els);
    },

    /**
     * Returns true if the view is currently displaying today's date, else false.
     * @return {Boolean} True or false
     */
    isToday: function() {
        var today = new Date().clearTime().getTime();
        return this.viewStart.getTime() <= today && this.viewEnd.getTime() >= today;
    },

    // private
    onDataChanged: function(store) {
        this.refresh();
    },

    // private
    isEventVisible: function(evt) {
        var start = this.viewStart.getTime(),
        end = this.viewEnd.getTime(),
        M = Ext.calendar.EventMappings,
        evStart = (evt.data ? evt.data[M.StartDate.name] : evt[M.StartDate.name]).getTime(),
        evEnd = (evt.data ? evt.data[M.EndDate.name] : evt[M.EndDate.name]).add(Date.SECOND, -1).getTime(),

        startsInRange = (evStart >= start && evStart <= end),
        endsInRange = (evEnd >= start && evEnd <= end),
        spansRange = (evStart < start && evEnd > end);

        return (startsInRange || endsInRange || spansRange);
    },

    // private
    isOverlapping: function(evt1, evt2) {
        var ev1 = evt1.data ? evt1.data: evt1,
        ev2 = evt2.data ? evt2.data: evt2,
        M = Ext.calendar.EventMappings,
        start1 = ev1[M.StartDate.name].getTime(),
        end1 = ev1[M.EndDate.name].add(Date.SECOND, -1).getTime(),
        start2 = ev2[M.StartDate.name].getTime(),
        end2 = ev2[M.EndDate.name].add(Date.SECOND, -1).getTime();

        if (end1 < start1) {
            end1 = start1;
        }
        if (end2 < start2) {
            end2 = start2;
        }

        var ev1startsInEv2 = (start1 >= start2 && start1 <= end2),
        ev1EndsInEv2 = (end1 >= start2 && end1 <= end2),
        ev1SpansEv2 = (start1 < start2 && end1 > end2);

        return (ev1startsInEv2 || ev1EndsInEv2 || ev1SpansEv2);
    },

    getDayEl: function(dt) {
        return Ext.get(this.getDayId(dt));
    },

    getDayId: function(dt) {
        if (Ext.isDate(dt)) {
            dt = dt.format('Ymd');
        }
        return this.id + this.dayElIdDelimiter + dt;
    },

    /**
     * Returns the start date of the view, as set by {@link #setStartDate}. Note that this may not 
     * be the first date displayed in the rendered calendar -- to get the start and end dates displayed
     * to the user use {@link #getViewBounds}.
     * @return {Date} The start date
     */
    getStartDate: function() {
        return this.startDate;
    },

    /**
     * Sets the start date used to calculate the view boundaries to display. The displayed view will be the 
     * earliest and latest dates that match the view requirements and contain the date passed to this function.
     * @param {Date} dt The date used to calculate the new view boundaries
     */
    setStartDate: function(start, refresh) {
        this.startDate = start.clearTime();
        this.setViewBounds(start);
        this.store.load({
            params: {
                start: this.viewStart.format('m-d-Y'),
                end: this.viewEnd.format('m-d-Y')
            }
        });
        if (refresh === true) {
            this.refresh();
        }
        this.fireEvent('datechange', this, this.startDate, this.viewStart, this.viewEnd);
    },

    // private
    setViewBounds: function(startDate) {
        var start = startDate || this.startDate,
        offset = start.getDay() - this.startDay;

        switch (this.weekCount) {
        case 0:
        case 1:
            this.viewStart = this.dayCount < 7 ? start: start.add(Date.DAY, -offset).clearTime(true);
            this.viewEnd = this.viewStart.add(Date.DAY, this.dayCount || 7).add(Date.SECOND, -1);
            return;

        case - 1:
            // auto by month
            start = start.getFirstDateOfMonth();
            offset = start.getDay() - this.startDay;

            this.viewStart = start.add(Date.DAY, -offset).clearTime(true);

            // start from current month start, not view start:
            var end = start.add(Date.MONTH, 1).add(Date.SECOND, -1);
            // fill out to the end of the week:
            this.viewEnd = end.add(Date.DAY, 6 - end.getDay());
            return;

        default:
            this.viewStart = start.add(Date.DAY, -offset).clearTime(true);
            this.viewEnd = this.viewStart.add(Date.DAY, this.weekCount * 7).add(Date.SECOND, -1);
        }
    },

    // private
    getViewBounds: function() {
        return {
            start: this.viewStart,
            end: this.viewEnd
        };
    },

    /* private
     * Sort events for a single day for display in the calendar.  This sorts allday
     * events first, then non-allday events are sorted either based on event start
     * priority or span priority based on the value of {@link #spansHavePriority} 
     * (defaults to event start priority).
     * @param {MixedCollection} evts A {@link Ext.util.MixedCollection MixedCollection}  
     * of {@link #Ext.calendar.EventRecord EventRecord} objects
     */
    sortEventRecordsForDay: function(evts) {
        if (evts.length < 2) {
            return;
        }
        evts.sort('ASC',
        function(evtA, evtB) {
            var a = evtA.data,
            b = evtB.data,
            M = Ext.calendar.EventMappings;

            // Always sort all day events before anything else
            if (a[M.IsAllDay.name]) {
                return - 1;
            }
            else if (b[M.IsAllDay.name]) {
                return 1;
            }
            if (this.spansHavePriority) {
                // This logic always weights span events higher than non-span events
                // (at the possible expense of start time order). This seems to
                // be the approach used by Google calendar and can lead to a more
                // visually appealing layout in complex cases, but event order is
                // not guaranteed to be consistent.
                var diff = Ext.calendar.Date.diffDays;
                if (diff(a[M.StartDate.name], a[M.EndDate.name]) > 0) {
                    if (diff(b[M.StartDate.name], b[M.EndDate.name]) > 0) {
                        // Both events are multi-day
                        if (a[M.StartDate.name].getTime() == b[M.StartDate.name].getTime()) {
                            // If both events start at the same time, sort the one
                            // that ends later (potentially longer span bar) first
                            return b[M.EndDate.name].getTime() - a[M.EndDate.name].getTime();
                        }
                        return a[M.StartDate.name].getTime() - b[M.StartDate.name].getTime();
                    }
                    return - 1;
                }
                else if (diff(b[M.StartDate.name], b[M.EndDate.name]) > 0) {
                    return 1;
                }
                return a[M.StartDate.name].getTime() - b[M.StartDate.name].getTime();
            }
            else {
                // Doing this allows span and non-span events to intermingle but
                // remain sorted sequentially by start time. This seems more proper
                // but can make for a less visually-compact layout when there are
                // many such events mixed together closely on the calendar.
                return a[M.StartDate.name].getTime() - b[M.StartDate.name].getTime();
            }
        }.createDelegate(this));
    },

    /**
     * Updates the view to contain the passed date
     * @param {Date} dt The date to display
     */
    moveTo: function(dt, noRefresh) {
        if (Ext.isDate(dt)) {
            this.setStartDate(dt);
            if (noRefresh !== false) {
                this.refresh();
            }
            return this.startDate;
        }
        return dt;
    },

    /**
     * Updates the view to the next consecutive date(s)
     */
    moveNext: function(noRefresh) {
        return this.moveTo(this.viewEnd.add(Date.DAY, 1));
    },

    /**
     * Updates the view to the previous consecutive date(s)
     */
    movePrev: function(noRefresh) {
        var days = Ext.calendar.Date.diffDays(this.viewStart, this.viewEnd) + 1;
        return this.moveDays( - days, noRefresh);
    },

    /**
     * Shifts the view by the passed number of months relative to the currently set date
     * @param {Number} value The number of months (positive or negative) by which to shift the view
     */
    moveMonths: function(value, noRefresh) {
        return this.moveTo(this.startDate.add(Date.MONTH, value), noRefresh);
    },

    /**
     * Shifts the view by the passed number of weeks relative to the currently set date
     * @param {Number} value The number of weeks (positive or negative) by which to shift the view
     */
    moveWeeks: function(value, noRefresh) {
        return this.moveTo(this.startDate.add(Date.DAY, value * 7), noRefresh);
    },

    /**
     * Shifts the view by the passed number of days relative to the currently set date
     * @param {Number} value The number of days (positive or negative) by which to shift the view
     */
    moveDays: function(value, noRefresh) {
        return this.moveTo(this.startDate.add(Date.DAY, value), noRefresh);
    },

    /**
     * Updates the view to show today
     */
    moveToday: function(noRefresh) {
        return this.moveTo(new Date(), noRefresh);
    },

    /**
     * Sets the event store used by the calendar to display {@link Ext.calendar.EventRecord events}.
     * @param {Ext.data.Store} store
     */
    setStore: function(store, initial) {
        if (!initial && this.store) {
            this.store.un("datachanged", this.onDataChanged, this);
            this.store.un("add", this.onAdd, this);
            this.store.un("remove", this.onRemove, this);
            this.store.un("update", this.onUpdate, this);
            this.store.un("clear", this.refresh, this);
        }
        if (store) {
            store.on("datachanged", this.onDataChanged, this);
            store.on("add", this.onAdd, this);
            store.on("remove", this.onRemove, this);
            store.on("update", this.onUpdate, this);
            store.on("clear", this.refresh, this);
        }
        this.store = store;
        if (store && store.getCount() > 0) {
            this.refresh();
        }
    },

    getEventRecord: function(id) {
        var idx = this.store.find(Ext.calendar.EventMappings.EventId.name, id);
        return this.store.getAt(idx);
    },

    getEventRecordFromEl: function(el) {
        return this.getEventRecord(this.getEventIdFromEl(el));
    },

    // private
    getParams: function() {
        return {
            viewStart: this.viewStart,
            viewEnd: this.viewEnd,
            startDate: this.startDate,
            dayCount: this.dayCount,
            weekCount: this.weekCount,
            title: this.getTitle()
        };
    },

    getTitle: function() {
        return this.startDate.format('F Y');
    },

    /*
     * Shared click handling.  Each specific view also provides view-specific
     * click handling that calls this first.  This method returns true if it
     * can handle the click (and so the subclass should ignore it) else false.
     */
    onClick: function(e, t) {
        var el = e.getTarget(this.eventSelector, 5);
        if (el) {
            var id = this.getEventIdFromEl(el);
            this.fireEvent('eventclick', this, this.getEventRecord(id), el);
            return true;
        }
    },

    // private
    onMouseOver: function(e, t) {
        if (this.trackMouseOver !== false && (this.dragZone == undefined || !this.dragZone.dragging)) {
            if (!this.handleEventMouseEvent(e, t, 'over')) {
                this.handleDayMouseEvent(e, t, 'over');
            }
        }
    },

    // private
    onMouseOut: function(e, t) {
        if (this.trackMouseOver !== false && (this.dragZone == undefined || !this.dragZone.dragging)) {
            if (!this.handleEventMouseEvent(e, t, 'out')) {
                this.handleDayMouseEvent(e, t, 'out');
            }
        }
    },

    // private
    handleEventMouseEvent: function(e, t, type) {
        var el = e.getTarget(this.eventSelector, 5, true),
            rel,
            els,
            evtId;
        if (el) {
            rel = Ext.get(e.getRelatedTarget());
            if (el == rel || el.contains(rel)) {
                return true;
            }

            evtId = this.getEventIdFromEl(el);

            if (this.eventOverClass != '') {
                els = this.getEventEls(evtId);
                els[type == 'over' ? 'addClass': 'removeClass'](this.eventOverClass);
            }
            this.fireEvent('event' + type, this, this.getEventRecord(evtId), el);
            return true;
        }
        return false;
    },

    // private
    getDateFromId: function(id, delim) {
        var parts = id.split(delim);
        return parts[parts.length - 1];
    },

    // private
    handleDayMouseEvent: function(e, t, type) {
        t = e.getTarget('td', 3);
        if (t) {
            if (t.id && t.id.indexOf(this.dayElIdDelimiter) > -1) {
                var dt = this.getDateFromId(t.id, this.dayElIdDelimiter),
                rel = Ext.get(e.getRelatedTarget()),
                relTD,
                relDate;

                if (rel) {
                    relTD = rel.is('td') ? rel: rel.up('td', 3);
                    relDate = relTD && relTD.id ? this.getDateFromId(relTD.id, this.dayElIdDelimiter) : '';
                }
                if (!rel || dt != relDate) {
                    var el = this.getDayEl(dt);
                    if (el && this.dayOverClass != '') {
                        el[type == 'over' ? 'addClass': 'removeClass'](this.dayOverClass);
                    }
                    this.fireEvent('day' + type, this, Date.parseDate(dt, "Ymd"), el);
                }
            }
        }
    },

    // private
    renderItems: function() {
        throw 'This method must be implemented by a subclass';
    }
});/**
 * @class Ext.calendar.MonthView
 * @extends Ext.calendar.CalendarView
 * <p>Displays a calendar view by month. This class does not usually need ot be used directly as you can
 * use a {@link Ext.calendar.CalendarPanel CalendarPanel} to manage multiple calendar views at once including
 * the month view.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext.calendar.MonthView = Ext.extend(Ext.calendar.CalendarView, {
    /**
     * @cfg {Boolean} showTime
     * True to display the current time in today's box in the calendar, false to not display it (defautls to true)
     */
    showTime: true,
    /**
     * @cfg {Boolean} showTodayText
     * True to display the {@link #todayText} string in today's box in the calendar, false to not display it (defautls to true)
     */
    showTodayText: true,
    /**
     * @cfg {String} todayText
     * The text to display in the current day's box in the calendar when {@link #showTodayText} is true (defaults to 'Today')
     */
    todayText: 'Today',
    /**
     * @cfg {Boolean} showHeader
     * True to display a header beneath the navigation bar containing the week names above each week's column, false not to 
     * show it and instead display the week names in the first row of days in the calendar (defaults to false).
     */
    showHeader: false,
    /**
     * @cfg {Boolean} showWeekLinks
     * True to display an extra column before the first day in the calendar that links to the {@link Ext.calendar.WeekView view}
     * for each individual week, false to not show it (defaults to false). If true, the week links can also contain the week 
     * number depending on the value of {@link #showWeekNumbers}.
     */
    showWeekLinks: false,
    /**
     * @cfg {Boolean} showWeekNumbers
     * True to show the week number for each week in the calendar in the week link column, false to show nothing (defaults to false).
     * Note that if {@link #showWeekLinks} is false this config will have no affect even if true.
     */
    showWeekNumbers: false,
    /**
     * @cfg {String} weekLinkOverClass
     * The CSS class name applied when the mouse moves over a week link element (only applies when {@link #showWeekLinks} is true,
     * defaults to 'ext-week-link-over').
     */
    weekLinkOverClass: 'ext-week-link-over',

    //private properties -- do not override:
    daySelector: '.ext-cal-day',
    moreSelector: '.ext-cal-ev-more',
    weekLinkSelector: '.ext-cal-week-link',
    weekCount: -1,
    // defaults to auto by month
    dayCount: 7,
    moreElIdDelimiter: '-more-',
    weekLinkIdDelimiter: 'ext-cal-week-',

    // private
    initComponent: function() {
        Ext.calendar.MonthView.superclass.initComponent.call(this);
        this.addEvents({
            /**
             * @event dayclick
             * Fires after the user clicks within the view container and not on an event element
             * @param {Ext.calendar.MonthView} this
             * @param {Date} dt The date/time that was clicked on
             * @param {Boolean} allday True if the day clicked on represents an all-day box, else false. Clicks within the 
             * MonthView always return true for this param.
             * @param {Ext.Element} el The Element that was clicked on
             */
            dayclick: true,
            /**
             * @event weekclick
             * Fires after the user clicks within a week link (when {@link #showWeekLinks is true)
             * @param {Ext.calendar.MonthView} this
             * @param {Date} dt The start date of the week that was clicked on
             */
            weekclick: true,
            // inherited docs
            dayover: true,
            // inherited docs
            dayout: true
        });
    },

    // private
    initDD: function() {
        var cfg = {
            view: this,
            createText: this.ddCreateEventText,
            moveText: this.ddMoveEventText,
            ddGroup: 'MonthViewDD'
        };

        this.dragZone = new Ext.calendar.DragZone(this.el, cfg);
        this.dropZone = new Ext.calendar.DropZone(this.el, cfg);
    },

    // private
    onDestroy: function() {
        Ext.destroy(this.ddSelector);
        Ext.destroy(this.dragZone);
        Ext.destroy(this.dropZone);
        Ext.calendar.MonthView.superclass.onDestroy.call(this);
    },

    // private
    afterRender: function() {
        if (!this.tpl) {
            this.tpl = new Ext.calendar.MonthViewTemplate({
                id: this.id,
                showTodayText: this.showTodayText,
                todayText: this.todayText,
                showTime: this.showTime,
                showHeader: this.showHeader,
                showWeekLinks: this.showWeekLinks,
                showWeekNumbers: this.showWeekNumbers
            });
        }
        this.tpl.compile();
        this.addClass('ext-cal-monthview ext-cal-ct');

        Ext.calendar.MonthView.superclass.afterRender.call(this);
    },

    // private
    onResize: function() {
        if (this.monitorResize) {
            this.maxEventsPerDay = this.getMaxEventsPerDay();
            this.refresh();
        }
    },

    // private
    forceSize: function() {
        // Compensate for the week link gutter width if visible
        if (this.showWeekLinks && this.el && this.el.child) {
            var hd = this.el.select('.ext-cal-hd-days-tbl'),
            bgTbl = this.el.select('.ext-cal-bg-tbl'),
            evTbl = this.el.select('.ext-cal-evt-tbl'),
            wkLinkW = this.el.child('.ext-cal-week-link').getWidth(),
            w = this.el.getWidth() - wkLinkW;

            hd.setWidth(w);
            bgTbl.setWidth(w);
            evTbl.setWidth(w);
        }
        Ext.calendar.MonthView.superclass.forceSize.call(this);
    },

    //private
    initClock: function() {
        if (Ext.fly(this.id + '-clock') !== null) {
            this.prevClockDay = new Date().getDay();
            if (this.clockTask) {
                Ext.TaskMgr.stop(this.clockTask);
            }
            this.clockTask = Ext.TaskMgr.start({
                run: function() {
                    var el = Ext.fly(this.id + '-clock'),
                    t = new Date();

                    if (t.getDay() == this.prevClockDay) {
                        if (el) {
                            el.update(t.format('g:i a'));
                        }
                    }
                    else {
                        this.prevClockDay = t.getDay();
                        this.moveTo(t);
                    }
                },
                scope: this,
                interval: 1000
            });
        }
    },

    // inherited docs
    getEventBodyMarkup: function() {
        if (!this.eventBodyMarkup) {
            this.eventBodyMarkup = ['{Title}',
            '<tpl if="_isReminder">',
            '<i class="ext-cal-ic ext-cal-ic-rem">&nbsp;</i>',
            '</tpl>',
            '<tpl if="_isRecurring">',
            '<i class="ext-cal-ic ext-cal-ic-rcr">&nbsp;</i>',
            '</tpl>',
            '<tpl if="spanLeft">',
            '<i class="ext-cal-spl">&nbsp;</i>',
            '</tpl>',
            '<tpl if="spanRight">',
            '<i class="ext-cal-spr">&nbsp;</i>',
            '</tpl>'
            ].join('');
        }
        return this.eventBodyMarkup;
    },

    // inherited docs
    getEventTemplate: function() {
        if (!this.eventTpl) {
            var tpl,
            body = this.getEventBodyMarkup();

            tpl = !(Ext.isIE || Ext.isOpera) ?
            new Ext.XTemplate(
            '<div id="{_elId}" class="{_selectorCls} {_colorCls} {values.spanCls} ext-cal-evt ext-cal-evr">',
            body,
            '</div>'
            )
            : new Ext.XTemplate(
            '<tpl if="_renderAsAllDay">',
            '<div id="{_elId}" class="{_selectorCls} {values.spanCls} {_colorCls} ext-cal-evt ext-cal-evo">',
            '<div class="ext-cal-evm">',
            '<div class="ext-cal-evi">',
            '</tpl>',
            '<tpl if="!_renderAsAllDay">',
            '<div id="{_elId}" class="{_selectorCls} {_colorCls} ext-cal-evt ext-cal-evr">',
            '</tpl>',
            body,
            '<tpl if="_renderAsAllDay">',
            '</div>',
            '</div>',
            '</tpl>',
            '</div>'
            );
            tpl.compile();
            this.eventTpl = tpl;
        }
        return this.eventTpl;
    },

    // private
    getTemplateEventData: function(evt) {
        var M = Ext.calendar.EventMappings,
        selector = this.getEventSelectorCls(evt[M.EventId.name]),
        title = evt[M.Title.name];

        return Ext.applyIf({
            _selectorCls: selector,
            _colorCls: 'ext-color-' + (evt[M.CalendarId.name] ?
            evt[M.CalendarId.name] : 'default') + (evt._renderAsAllDay ? '-ad': ''),
            _elId: selector + '-' + evt._weekIndex,
            _isRecurring: evt.Recurrence && evt.Recurrence != '',
            _isReminder: evt[M.Reminder.name] && evt[M.Reminder.name] != '',
            Title: (evt[M.IsAllDay.name] ? '': evt[M.StartDate.name].format('g:ia ')) + (!title || title.length == 0 ? '(No title)': title)
        },
        evt);
    },

    // private
    refresh: function() {
        if (this.detailPanel) {
            this.detailPanel.hide();
        }
        Ext.calendar.MonthView.superclass.refresh.call(this);

        if (this.showTime !== false) {
            this.initClock();
        }
    },

    // private
    renderItems: function() {
        Ext.calendar.WeekEventRenderer.render({
            eventGrid: this.allDayOnly ? this.allDayGrid: this.eventGrid,
            viewStart: this.viewStart,
            tpl: this.getEventTemplate(),
            maxEventsPerDay: this.maxEventsPerDay,
            id: this.id,
            templateDataFn: this.getTemplateEventData.createDelegate(this),
            evtMaxCount: this.evtMaxCount,
            weekCount: this.weekCount,
            dayCount: this.dayCount
        });
        this.fireEvent('eventsrendered', this);
    },

    // private
    getDayEl: function(dt) {
        return Ext.get(this.getDayId(dt));
    },

    // private
    getDayId: function(dt) {
        if (Ext.isDate(dt)) {
            dt = dt.format('Ymd');
        }
        return this.id + this.dayElIdDelimiter + dt;
    },

    // private
    getWeekIndex: function(dt) {
        var el = this.getDayEl(dt).up('.ext-cal-wk-ct');
        return parseInt(el.id.split('-wk-')[1], 10);
    },

    // private
    getDaySize: function(contentOnly) {
        var box = this.el.getBox(),
        w = box.width / this.dayCount,
        h = box.height / this.getWeekCount();

        if (contentOnly) {
            var hd = this.el.select('.ext-cal-dtitle').first().parent('tr');
            h = hd ? h - hd.getHeight(true) : h;
        }
        return {
            height: h,
            width: w
        };
    },

    // private
    getEventHeight: function() {
        if (!this.eventHeight) {
            var evt = this.el.select('.ext-cal-evt').first();
            this.eventHeight = evt ? evt.parent('tr').getHeight() : 18;
        }
        return this.eventHeight;
    },

    // private
    getMaxEventsPerDay: function() {
        var dayHeight = this.getDaySize(true).height,
            h = this.getEventHeight(),
            max = Math.max(Math.floor((dayHeight - h) / h), 0);

        return max;
    },

    // private
    getDayAt: function(x, y) {
        var box = this.el.getBox(),
            daySize = this.getDaySize(),
            dayL = Math.floor(((x - box.x) / daySize.width)),
            dayT = Math.floor(((y - box.y) / daySize.height)),
            days = (dayT * 7) + dayL,
            dt = this.viewStart.add(Date.DAY, days);
        return {
            date: dt,
            el: this.getDayEl(dt)
        };
    },

    // inherited docs
    moveNext: function() {
        return this.moveMonths(1);
    },

    // inherited docs
    movePrev: function() {
        return this.moveMonths( - 1);
    },

    // private
    onInitDrag: function() {
        Ext.calendar.MonthView.superclass.onInitDrag.call(this);
        Ext.select(this.daySelector).removeClass(this.dayOverClass);
        if (this.detailPanel) {
            this.detailPanel.hide();
        }
    },

    // private
    onMoreClick: function(dt) {
        if (!this.detailPanel) {
            this.detailPanel = new Ext.Panel({
                id: this.id + '-details-panel',
                title: dt.format('F j'),
                layout: 'fit',
                floating: true,
                renderTo: Ext.getBody(),
                tools: [{
                    id: 'close',
                    handler: function(e, t, p) {
                        p.hide();
                    }
                }],
                items: {
                    xtype: 'monthdaydetailview',
                    id: this.id + '-details-view',
                    date: dt,
                    view: this,
                    store: this.store,
                    listeners: {
                        'eventsrendered': this.onDetailViewUpdated.createDelegate(this)
                    }
                }
            });
        }
        else {
            this.detailPanel.setTitle(dt.format('F j'));
        }
        this.detailPanel.getComponent(this.id + '-details-view').update(dt);
    },

    // private
    onDetailViewUpdated: function(view, dt, numEvents) {
        var p = this.detailPanel,
        frameH = p.getFrameHeight(),
        evtH = this.getEventHeight(),
        bodyH = frameH + (numEvents * evtH) + 3,
        dayEl = this.getDayEl(dt),
        box = dayEl.getBox();

        p.updateBox(box);
        p.setHeight(bodyH);
        p.setWidth(Math.max(box.width, 220));
        p.show();
        p.getPositionEl().alignTo(dayEl, 't-t?');
    },

    // private
    onHide: function() {
        Ext.calendar.MonthView.superclass.onHide.call(this);
        if (this.detailPanel) {
            this.detailPanel.hide();
        }
    },

    // private
    onClick: function(e, t) {
        if (this.detailPanel) {
            this.detailPanel.hide();
        }
        if (Ext.calendar.MonthView.superclass.onClick.apply(this, arguments)) {
            // The superclass handled the click already so exit
            return;
        }
        if (this.dropZone) {
            this.dropZone.clearShims();
        }
        var el = e.getTarget(this.weekLinkSelector, 3),
            dt,
            parts;
        if (el) {
            dt = el.id.split(this.weekLinkIdDelimiter)[1];
            this.fireEvent('weekclick', this, Date.parseDate(dt, 'Ymd'));
            return;
        }
        el = e.getTarget(this.moreSelector, 3);
        if (el) {
            dt = el.id.split(this.moreElIdDelimiter)[1];
            this.onMoreClick(Date.parseDate(dt, 'Ymd'));
            return;
        }
        el = e.getTarget('td', 3);
        if (el) {
            if (el.id && el.id.indexOf(this.dayElIdDelimiter) > -1) {
                parts = el.id.split(this.dayElIdDelimiter);
                dt = parts[parts.length - 1];

                this.fireEvent('dayclick', this, Date.parseDate(dt, 'Ymd'), false, Ext.get(this.getDayId(dt)));
                return;
            }
        }
    },

    // private
    handleDayMouseEvent: function(e, t, type) {
        var el = e.getTarget(this.weekLinkSelector, 3, true);
        if (el) {
            el[type == 'over' ? 'addClass': 'removeClass'](this.weekLinkOverClass);
            return;
        }
        Ext.calendar.MonthView.superclass.handleDayMouseEvent.apply(this, arguments);
    }
});

Ext.reg('monthview', Ext.calendar.MonthView);
/**
 * @class Ext.calendar.DayHeaderView
 * @extends Ext.calendar.MonthView
 * <p>This is the header area container within the day and week views where all-day events are displayed.
 * Normally you should not need to use this class directly -- instead you should use {@link Ext.calendar.DayView DayView}
 * which aggregates this class and the {@link Ext.calendar.DayBodyView DayBodyView} into the single unified view
 * presented by {@link Ext.calendar.CalendarPanel CalendarPanel}.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext.calendar.DayHeaderView = Ext.extend(Ext.calendar.MonthView, {
    // private configs
    weekCount: 1,
    dayCount: 1,
    allDayOnly: true,
    monitorResize: false,

    /**
     * @event dayclick
     * Fires after the user clicks within the day view container and not on an event element
     * @param {Ext.calendar.DayBodyView} this
     * @param {Date} dt The date/time that was clicked on
     * @param {Boolean} allday True if the day clicked on represents an all-day box, else false. Clicks within the 
     * DayHeaderView always return true for this param.
     * @param {Ext.Element} el The Element that was clicked on
     */

    // private
    afterRender: function() {
        if (!this.tpl) {
            this.tpl = new Ext.calendar.DayHeaderTemplate({
                id: this.id,
                showTodayText: this.showTodayText,
                todayText: this.todayText,
                showTime: this.showTime
            });
        }
        this.tpl.compile();
        this.addClass('ext-cal-day-header');

        Ext.calendar.DayHeaderView.superclass.afterRender.call(this);
    },

    // private
    forceSize: Ext.emptyFn,

    // private
    refresh: function() {
        Ext.calendar.DayHeaderView.superclass.refresh.call(this);
        this.recalcHeaderBox();
    },

    // private
    recalcHeaderBox: function() {
        var tbl = this.el.child('.ext-cal-evt-tbl'),
        h = tbl.getHeight();

        this.el.setHeight(h + 7);

        if (Ext.isIE && Ext.isStrict) {
            this.el.child('.ext-cal-hd-ad-inner').setHeight(h + 4);
        }
        if (Ext.isOpera) {
            //TODO: figure out why Opera refuses to refresh height when
            //the new height is lower than the previous one
            //            var ct = this.el.child('.ext-cal-hd-ct');
            //            ct.repaint();
            }
    },

    // private
    moveNext: function(noRefresh) {
        this.moveDays(this.dayCount, noRefresh);
    },

    // private
    movePrev: function(noRefresh) {
        this.moveDays( - this.dayCount, noRefresh);
    },

    // private
    onClick: function(e, t) {
        var el = e.getTarget('td', 3),
            parts,
            dt;
        if (el) {
            if (el.id && el.id.indexOf(this.dayElIdDelimiter) > -1) {
                parts = el.id.split(this.dayElIdDelimiter);
                dt = parts[parts.length - 1];

                this.fireEvent('dayclick', this, Date.parseDate(dt, 'Ymd'), true, Ext.get(this.getDayId(dt)));
                return;
            }
        }
        Ext.calendar.DayHeaderView.superclass.onClick.apply(this, arguments);
    }
});

Ext.reg('dayheaderview', Ext.calendar.DayHeaderView);
/**S
 * @class Ext.calendar.DayBodyView
 * @extends Ext.calendar.CalendarView
 * <p>This is the scrolling container within the day and week views where non-all-day events are displayed.
 * Normally you should not need to use this class directly -- instead you should use {@link Ext.calendar.DayView DayView}
 * which aggregates this class and the {@link Ext.calendar.DayHeaderView DayHeaderView} into the single unified view
 * presented by {@link Ext.calendar.CalendarPanel CalendarPanel}.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext.calendar.DayBodyView = Ext.extend(Ext.calendar.CalendarView, {
    //private
    dayColumnElIdDelimiter: '-day-col-',

    //private
    initComponent: function() {
        Ext.calendar.DayBodyView.superclass.initComponent.call(this);

        this.addEvents({
            /**
             * @event eventresize
             * Fires after the user drags the resize handle of an event to resize it
             * @param {Ext.calendar.DayBodyView} this
             * @param {Ext.calendar.EventRecord} rec The {@link Ext.calendar.EventRecord record} for the event that was resized
             * containing the updated start and end dates
             */
            eventresize: true,
            /**
             * @event dayclick
             * Fires after the user clicks within the day view container and not on an event element
             * @param {Ext.calendar.DayBodyView} this
             * @param {Date} dt The date/time that was clicked on
             * @param {Boolean} allday True if the day clicked on represents an all-day box, else false. Clicks within the 
             * DayBodyView always return false for this param.
             * @param {Ext.Element} el The Element that was clicked on
             */
            dayclick: true
        });
    },

    //private
    initDD: function() {
        var cfg = {
            createText: this.ddCreateEventText,
            moveText: this.ddMoveEventText,
            resizeText: this.ddResizeEventText
        };

        this.el.ddScrollConfig = {
            // scrolling is buggy in IE/Opera for some reason.  A larger vthresh
            // makes it at least functional if not perfect
            vthresh: Ext.isIE || Ext.isOpera ? 100: 40,
            hthresh: -1,
            frequency: 50,
            increment: 100,
            ddGroup: 'DayViewDD'
        };
        this.dragZone = new Ext.calendar.DayViewDragZone(this.el, Ext.apply({
            view: this,
            containerScroll: true
        },
        cfg));

        this.dropZone = new Ext.calendar.DayViewDropZone(this.el, Ext.apply({
            view: this
        },
        cfg));
    },

    //private
    refresh: function() {
        var top = this.el.getScroll().top;
        this.prepareData();
        this.renderTemplate();
        this.renderItems();

        // skip this if the initial render scroll position has not yet been set.
        // necessary since IE/Opera must be deferred, so the first refresh will
        // override the initial position by default and always set it to 0.
        if (this.scrollReady) {
            this.scrollTo(top);
        }
    },

    /**
     * Scrolls the container to the specified vertical position. If the view is large enough that
     * there is no scroll overflow then this method will have no affect.
     * @param {Number} y The new vertical scroll position in pixels 
     * @param {Boolean} defer (optional) <p>True to slightly defer the call, false to execute immediately.</p> 
     * <p>This method will automatically defer itself for IE and Opera (even if you pass false) otherwise
     * the scroll position will not update in those browsers. You can optionally pass true, however, to
     * force the defer in all browsers, or use your own custom conditions to determine whether this is needed.</p>
     * <p>Note that this method should not generally need to be called directly as scroll position is managed internally.</p>
     */
    scrollTo: function(y, defer) {
        defer = defer || (Ext.isIE || Ext.isOpera);
        if (defer) {
            (function() {
                this.el.scrollTo('top', y);
                this.scrollReady = true;
            }).defer(10, this);
        }
        else {
            this.el.scrollTo('top', y);
            this.scrollReady = true;
        }
    },

    // private
    afterRender: function() {
        if (!this.tpl) {
            this.tpl = new Ext.calendar.DayBodyTemplate({
                id: this.id,
                dayCount: this.dayCount,
                showTodayText: this.showTodayText,
                todayText: this.todayText,
                showTime: this.showTime
            });
        }
        this.tpl.compile();

        this.addClass('ext-cal-body-ct');

        Ext.calendar.DayBodyView.superclass.afterRender.call(this);

        // default scroll position to 7am:
        this.scrollTo(7 * 42);
    },

    // private
    forceSize: Ext.emptyFn,

    // private
    onEventResize: function(rec, data) {
        var D = Ext.calendar.Date,
        start = Ext.calendar.EventMappings.StartDate.name,
        end = Ext.calendar.EventMappings.EndDate.name;

        if (D.compare(rec.data[start], data.StartDate) === 0 &&
        D.compare(rec.data[end], data.EndDate) === 0) {
            // no changes
            return;
        }
        rec.set(start, data.StartDate);
        rec.set(end, data.EndDate);

        this.fireEvent('eventresize', this, rec);
    },

    // inherited docs
    getEventBodyMarkup: function() {
        if (!this.eventBodyMarkup) {
            this.eventBodyMarkup = ['{Title}',
            '<tpl if="_isReminder">',
            '<i class="ext-cal-ic ext-cal-ic-rem">&nbsp;</i>',
            '</tpl>',
            '<tpl if="_isRecurring">',
            '<i class="ext-cal-ic ext-cal-ic-rcr">&nbsp;</i>',
            '</tpl>'
            //                '<tpl if="spanLeft">',
            //                    '<i class="ext-cal-spl">&nbsp;</i>',
            //                '</tpl>',
            //                '<tpl if="spanRight">',
            //                    '<i class="ext-cal-spr">&nbsp;</i>',
            //                '</tpl>'
            ].join('');
        }
        return this.eventBodyMarkup;
    },

    // inherited docs
    getEventTemplate: function() {
        if (!this.eventTpl) {
            this.eventTpl = !(Ext.isIE || Ext.isOpera) ?
            new Ext.XTemplate(
            '<div id="{_elId}" class="{_selectorCls} {_colorCls} ext-cal-evt ext-cal-evr" style="left: {_left}%; width: {_width}%; top: {_top}px; height: {_height}px;">',
            '<div class="ext-evt-bd">', this.getEventBodyMarkup(), '</div>',
            '<div class="ext-evt-rsz"><div class="ext-evt-rsz-h">&nbsp;</div></div>',
            '</div>'
            )
            : new Ext.XTemplate(
            '<div id="{_elId}" class="ext-cal-evt {_selectorCls} {_colorCls}-x" style="left: {_left}%; width: {_width}%; top: {_top}px;">',
            '<div class="ext-cal-evb">&nbsp;</div>',
            '<dl style="height: {_height}px;" class="ext-cal-evdm">',
            '<dd class="ext-evt-bd">',
            this.getEventBodyMarkup(),
            '</dd>',
            '<div class="ext-evt-rsz"><div class="ext-evt-rsz-h">&nbsp;</div></div>',
            '</dl>',
            '<div class="ext-cal-evb">&nbsp;</div>',
            '</div>'
            );
            this.eventTpl.compile();
        }
        return this.eventTpl;
    },

    /**
     * <p>Returns the XTemplate that is bound to the calendar's event store (it expects records of type
     * {@link Ext.calendar.EventRecord}) to populate the calendar views with <strong>all-day</strong> events. 
     * Internally this method by default generates different markup for browsers that support CSS border radius 
     * and those that don't. This method can be overridden as needed to customize the markup generated.</p>
     * <p>Note that this method calls {@link #getEventBodyMarkup} to retrieve the body markup for events separately
     * from the surrounding container markup.  This provdes the flexibility to customize what's in the body without
     * having to override the entire XTemplate. If you do override this method, you should make sure that your 
     * overridden version also does the same.</p>
     * @return {Ext.XTemplate} The event XTemplate
     */
    getEventAllDayTemplate: function() {
        if (!this.eventAllDayTpl) {
            var tpl,
            body = this.getEventBodyMarkup();

            tpl = !(Ext.isIE || Ext.isOpera) ?
            new Ext.XTemplate(
            '<div id="{_elId}" class="{_selectorCls} {_colorCls} {values.spanCls} ext-cal-evt ext-cal-evr" style="left: {_left}%; width: {_width}%; top: {_top}px; height: {_height}px;">',
            body,
            '</div>'
            )
            : new Ext.XTemplate(
            '<div id="{_elId}" class="ext-cal-evt" style="left: {_left}%; width: {_width}%; top: {_top}px; height: {_height}px;">',
            '<div class="{_selectorCls} {values.spanCls} {_colorCls} ext-cal-evo">',
            '<div class="ext-cal-evm">',
            '<div class="ext-cal-evi">',
            body,
            '</div>',
            '</div>',
            '</div></div>'
            );
            tpl.compile();
            this.eventAllDayTpl = tpl;
        }
        return this.eventAllDayTpl;
    },

    // private
    getTemplateEventData: function(evt) {
        var selector = this.getEventSelectorCls(evt[Ext.calendar.EventMappings.EventId.name]),
        data = {},
        M = Ext.calendar.EventMappings;

        this.getTemplateEventBox(evt);

        data._selectorCls = selector;
        data._colorCls = 'ext-color-' + evt[M.CalendarId.name] + (evt._renderAsAllDay ? '-ad': '');
        data._elId = selector + (evt._weekIndex ? '-' + evt._weekIndex: '');
        data._isRecurring = evt.Recurrence && evt.Recurrence != '';
        data._isReminder = evt[M.Reminder.name] && evt[M.Reminder.name] != '';
        var title = evt[M.Title.name];
        data.Title = (evt[M.IsAllDay.name] ? '': evt[M.StartDate.name].format('g:ia ')) + (!title || title.length == 0 ? '(No title)': title);

        return Ext.applyIf(data, evt);
    },

    // private
    getTemplateEventBox: function(evt) {
        var heightFactor = 0.7,
            start = evt[Ext.calendar.EventMappings.StartDate.name],
            end = evt[Ext.calendar.EventMappings.EndDate.name],
            startMins = start.getHours() * 60 + start.getMinutes(),
            endMins = end.getHours() * 60 + end.getMinutes(),
            diffMins = endMins - startMins;

        evt._left = 0;
        evt._width = 100;
        evt._top = Math.round(startMins * heightFactor) + 1;
        evt._height = Math.max((diffMins * heightFactor) - 2, 15);
    },

    // private
    renderItems: function() {
        var day = 0,
            evts = [],
            ev,
            d,
            ct,
            item,
            i,
            j,
            l,
            overlapCols,
            prevCol,
            colWidth,
            evtWidth,
            markup,
            target;
        for (; day < this.dayCount; day++) {
            ev = emptyCells = skipped = 0;
            d = this.eventGrid[0][day];
            ct = d ? d.length: 0;

            for (; ev < ct; ev++) {
                evt = d[ev];
                if (!evt) {
                    continue;
                }
                item = evt.data || evt.event.data;
                if (item._renderAsAllDay) {
                    continue;
                }
                Ext.apply(item, {
                    cls: 'ext-cal-ev',
                    _positioned: true
                });
                evts.push({
                    data: this.getTemplateEventData(item),
                    date: this.viewStart.add(Date.DAY, day)
                });
            }
        }

        // overlapping event pre-processing loop
        i = j = overlapCols = prevCol = 0;
        l = evts.length;
        for (; i < l; i++) {
            evt = evts[i].data;
            evt2 = null;
            prevCol = overlapCols;
            for (j = 0; j < l; j++) {
                if (i == j) {
                    continue;
                }
                evt2 = evts[j].data;
                if (this.isOverlapping(evt, evt2)) {
                    evt._overlap = evt._overlap == undefined ? 1: evt._overlap + 1;
                    if (i < j) {
                        if (evt._overcol === undefined) {
                            evt._overcol = 0;
                        }
                        evt2._overcol = evt._overcol + 1;
                        overlapCols = Math.max(overlapCols, evt2._overcol);
                    }
                }
            }
        }

        // rendering loop
        for (i = 0; i < l; i++) {
            evt = evts[i].data;
            if (evt._overlap !== undefined) {
                colWidth = 100 / (overlapCols + 1);
                evtWidth = 100 - (colWidth * evt._overlap);

                evt._width = colWidth;
                evt._left = colWidth * evt._overcol;
            }
            markup = this.getEventTemplate().apply(evt);
            target = this.id + '-day-col-' + evts[i].date.format('Ymd');

            Ext.DomHelper.append(target, markup);
        }

        this.fireEvent('eventsrendered', this);
    },

    // private
    getDayEl: function(dt) {
        return Ext.get(this.getDayId(dt));
    },

    // private
    getDayId: function(dt) {
        if (Ext.isDate(dt)) {
            dt = dt.format('Ymd');
        }
        return this.id + this.dayColumnElIdDelimiter + dt;
    },

    // private
    getDaySize: function() {
        var box = this.el.child('.ext-cal-day-col-inner').getBox();
        return {
            height: box.height,
            width: box.width
        };
    },

    // private
    getDayAt: function(x, y) {
        var sel = '.ext-cal-body-ct',
        xoffset = this.el.child('.ext-cal-day-times').getWidth(),
        viewBox = this.el.getBox(),
        daySize = this.getDaySize(false),
        relX = x - viewBox.x - xoffset,
        dayIndex = Math.floor(relX / daySize.width),
        // clicked col index
        scroll = this.el.getScroll(),
        row = this.el.child('.ext-cal-bg-row'),
        // first avail row, just to calc size
        rowH = row.getHeight() / 2,
        // 30 minute increment since a row is 60 minutes
        relY = y - viewBox.y - rowH + scroll.top,
        rowIndex = Math.max(0, Math.ceil(relY / rowH)),
        mins = rowIndex * 30,
        dt = this.viewStart.add(Date.DAY, dayIndex).add(Date.MINUTE, mins),
        el = this.getDayEl(dt),
        timeX = x;

        if (el) {
            timeX = el.getLeft();
        }

        return {
            date: dt,
            el: el,
            // this is the box for the specific time block in the day that was clicked on:
            timeBox: {
                x: timeX,
                y: (rowIndex * 21) + viewBox.y - scroll.top,
                width: daySize.width,
                height: rowH
            }
        };
    },

    // private
    onClick: function(e, t) {
        if (this.dragPending || Ext.calendar.DayBodyView.superclass.onClick.apply(this, arguments)) {
            // The superclass handled the click already so exit
            return;
        }
        if (e.getTarget('.ext-cal-day-times', 3) !== null) {
            // ignore clicks on the times-of-day gutter
            return;
        }
        var el = e.getTarget('td', 3);
        if (el) {
            if (el.id && el.id.indexOf(this.dayElIdDelimiter) > -1) {
                var dt = this.getDateFromId(el.id, this.dayElIdDelimiter);
                this.fireEvent('dayclick', this, Date.parseDate(dt, 'Ymd'), true, Ext.get(this.getDayId(dt, true)));
                return;
            }
        }
        var day = this.getDayAt(e.xy[0], e.xy[1]);
        if (day && day.date) {
            this.fireEvent('dayclick', this, day.date, false, null);
        }
    }
});

Ext.reg('daybodyview', Ext.calendar.DayBodyView);
/**
 * @class Ext.calendar.DayView
 * @extends Ext.Container
 * <p>Unlike other calendar views, is not actually a subclass of {@link Ext.calendar.CalendarView CalendarView}.
 * Instead it is a {@link Ext.Container Container} subclass that internally creates and manages the layouts of
 * a {@link Ext.calendar.DayHeaderView DayHeaderView} and a {@link Ext.calendar.DayBodyView DayBodyView}. As such
 * DayView accepts any config values that are valid for DayHeaderView and DayBodyView and passes those through
 * to the contained views. It also supports the interface required of any calendar view and in turn calls methods
 * on the contained views as necessary.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext.calendar.DayView = Ext.extend(Ext.Container, {
    /**
     * @cfg {Boolean} showTime
     * True to display the current time in today's box in the calendar, false to not display it (defautls to true)
     */
    showTime: true,
    /**
     * @cfg {Boolean} showTodayText
     * True to display the {@link #todayText} string in today's box in the calendar, false to not display it (defautls to true)
     */
    showTodayText: true,
    /**
     * @cfg {String} todayText
     * The text to display in the current day's box in the calendar when {@link #showTodayText} is true (defaults to 'Today')
     */
    todayText: 'Today',
    /**
     * @cfg {String} ddCreateEventText
     * The text to display inside the drag proxy while dragging over the calendar to create a new event (defaults to 
     * 'Create event for {0}' where {0} is a date range supplied by the view)
     */
    ddCreateEventText: 'Create event for {0}',
    /**
     * @cfg {String} ddMoveEventText
     * The text to display inside the drag proxy while dragging an event to reposition it (defaults to 
     * 'Move event to {0}' where {0} is the updated event start date/time supplied by the view)
     */
    ddMoveEventText: 'Move event to {0}',
    /**
     * @cfg {Number} dayCount
     * The number of days to display in the view (defaults to 1)
     */
    dayCount: 1,
    
    // private
    initComponent : function(){
        // rendering more than 7 days per view is not supported
        this.dayCount = this.dayCount > 7 ? 7 : this.dayCount;
        
        var cfg = Ext.apply({}, this.initialConfig);
        cfg.showTime = this.showTime;
        cfg.showTodatText = this.showTodayText;
        cfg.todayText = this.todayText;
        cfg.dayCount = this.dayCount;
        cfg.wekkCount = 1; 
        
        var header = Ext.applyIf({
            xtype: 'dayheaderview',
            id: this.id+'-hd'
        }, cfg);
        
        var body = Ext.applyIf({
            xtype: 'daybodyview',
            id: this.id+'-bd'
        }, cfg);
        
        this.items = [header, body];
        this.addClass('ext-cal-dayview ext-cal-ct');
        
        Ext.calendar.DayView.superclass.initComponent.call(this);
    },
    
    // private
    afterRender : function(){
        Ext.calendar.DayView.superclass.afterRender.call(this);
        
        this.header = Ext.getCmp(this.id+'-hd');
        this.body = Ext.getCmp(this.id+'-bd');
        this.body.on('eventsrendered', this.forceSize, this);
    },
    
    // private
    refresh : function(){
        this.header.refresh();
        this.body.refresh();
    },
    
    // private
    forceSize: function(){
        // The defer call is mainly for good ol' IE, but it doesn't hurt in
        // general to make sure that the window resize is good and done first
        // so that we can properly calculate sizes.
        (function(){
            var ct = this.el.up('.x-panel-body'),
                hd = this.el.child('.ext-cal-day-header'),
                h = ct.getHeight() - hd.getHeight();
            
            this.el.child('.ext-cal-body-ct').setHeight(h);
        }).defer(10, this);
    },
    
    // private
    onResize : function(){
        this.forceSize();
    },
    
    // private
    getViewBounds : function(){
        return this.header.getViewBounds();
    },
    
    /**
     * Returns the start date of the view, as set by {@link #setStartDate}. Note that this may not 
     * be the first date displayed in the rendered calendar -- to get the start and end dates displayed
     * to the user use {@link #getViewBounds}.
     * @return {Date} The start date
     */
    getStartDate : function(){
        return this.header.getStartDate();
    },

    /**
     * Sets the start date used to calculate the view boundaries to display. The displayed view will be the 
     * earliest and latest dates that match the view requirements and contain the date passed to this function.
     * @param {Date} dt The date used to calculate the new view boundaries
     */
    setStartDate: function(dt){
        this.header.setStartDate(dt, true);
        this.body.setStartDate(dt, true);
    },

    // private
    renderItems: function(){
        this.header.renderItems();
        this.body.renderItems();
    },
    
    /**
     * Returns true if the view is currently displaying today's date, else false.
     * @return {Boolean} True or false
     */
    isToday : function(){
        return this.header.isToday();
    },
    
    /**
     * Updates the view to contain the passed date
     * @param {Date} dt The date to display
     */
    moveTo : function(dt, noRefresh){
        this.header.moveTo(dt, noRefresh);
        this.body.moveTo(dt, noRefresh);
    },
    
    /**
     * Updates the view to the next consecutive date(s)
     */
    moveNext : function(noRefresh){
        this.header.moveNext(noRefresh);
        this.body.moveNext(noRefresh);
    },
    
    /**
     * Updates the view to the previous consecutive date(s)
     */
    movePrev : function(noRefresh){
        this.header.movePrev(noRefresh);
        this.body.movePrev(noRefresh);
    },

    /**
     * Shifts the view by the passed number of days relative to the currently set date
     * @param {Number} value The number of days (positive or negative) by which to shift the view
     */
    moveDays : function(value, noRefresh){
        this.header.moveDays(value, noRefresh);
        this.body.moveDays(value, noRefresh);
    },
    
    /**
     * Updates the view to show today
     */
    moveToday : function(noRefresh){
        this.header.moveToday(noRefresh);
        this.body.moveToday(noRefresh);
    }
});

Ext.reg('dayview', Ext.calendar.DayView);
/**
 * @class Ext.calendar.WeekView
 * @extends Ext.calendar.DayView
 * <p>Displays a calendar view by week. This class does not usually need ot be used directly as you can
 * use a {@link Ext.calendar.CalendarPanel CalendarPanel} to manage multiple calendar views at once including
 * the week view.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext.calendar.WeekView = Ext.extend(Ext.calendar.DayView, {
    /**
     * @cfg {Number} dayCount
     * The number of days to display in the view (defaults to 7)
     */
    dayCount: 7
});

Ext.reg('weekview', Ext.calendar.WeekView);/**
 * @class Ext.calendar.DateRangeField
 * @extends Ext.form.Field
 * <p>A combination field that includes start and end dates and times, as well as an optional all-day checkbox.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext.calendar.DateRangeField = Ext.extend(Ext.form.Field, {
    /**
     * @cfg {String} toText
     * The text to display in between the date/time fields (defaults to 'to')
     */
    toText: 'to',
    /**
     * @cfg {String} toText
     * The text to display as the label for the all day checkbox (defaults to 'All day')
     */
    allDayText: 'All day',

    // private
    onRender: function(ct, position) {
        if (!this.el) {
            this.startDate = new Ext.form.DateField({
                id: this.id + '-start-date',
                format: 'n/j/Y',
                width: 100,
                listeners: {
                    'change': {
                        fn: function() {
                            this.checkDates('date', 'start');
                        },
                        scope: this
                    }
                }
            });
            this.startTime = new Ext.form.TimeField({
                id: this.id + '-start-time',
                hidden: this.showTimes === false,
                labelWidth: 0,
                hideLabel: true,
                width: 90,
                listeners: {
                    'select': {
                        fn: function() {
                            this.checkDates('time', 'start');
                        },
                        scope: this
                    }
                }
            });
            this.endTime = new Ext.form.TimeField({
                id: this.id + '-end-time',
                hidden: this.showTimes === false,
                labelWidth: 0,
                hideLabel: true,
                width: 90,
                listeners: {
                    'select': {
                        fn: function() {
                            this.checkDates('time', 'end');
                        },
                        scope: this
                    }
                }
            });
            this.endDate = new Ext.form.DateField({
                id: this.id + '-end-date',
                format: 'n/j/Y',
                hideLabel: true,
                width: 100,
                listeners: {
                    'change': {
                        fn: function() {
                            this.checkDates('date', 'end');
                        },
                        scope: this
                    }
                }
            });
            this.allDay = new Ext.form.Checkbox({
                id: this.id + '-allday',
                hidden: this.showTimes === false || this.showAllDay === false,
                boxLabel: this.allDayText,
                handler: function(chk, checked) {
                    this.startTime.setVisible(!checked);
                    this.endTime.setVisible(!checked);
                },
                scope: this
            });
            this.toLabel = new Ext.form.Label({
                xtype: 'label',
                id: this.id + '-to-label',
                text: this.toText
            });

            this.fieldCt = new Ext.Container({
                autoEl: {
                    id: this.id
                },
                //make sure the container el has the field's id
                cls: 'ext-dt-range',
                renderTo: ct,
                layout: 'table',
                layoutConfig: {
                    columns: 6
                },
                defaults: {
                    hideParent: true
                },
                items: [
                this.startDate,
                this.startTime,
                this.toLabel,
                this.endTime,
                this.endDate,
                this.allDay
                ]
            });

            this.fieldCt.ownerCt = this;
            this.el = this.fieldCt.getEl();
            this.items = new Ext.util.MixedCollection();
            this.items.addAll([this.startDate, this.endDate, this.toLabel, this.startTime, this.endTime, this.allDay]);
        }
        Ext.calendar.DateRangeField.superclass.onRender.call(this, ct, position);
    },

    // private
    checkDates: function(type, startend) {
        var startField = Ext.getCmp(this.id + '-start-' + type),
        endField = Ext.getCmp(this.id + '-end-' + type),
        startValue = this.getDT('start'),
        endValue = this.getDT('end');

        if (startValue > endValue) {
            if (startend == 'start') {
                endField.setValue(startValue);
            } else {
                startField.setValue(endValue);
                this.checkDates(type, 'start');
            }
        }
        if (type == 'date') {
            this.checkDates('time', startend);
        }
    },

    /**
     * Returns an array containing the following values in order:<div class="mdetail-params"><ul>
     * <li><b><code>DateTime</code></b> : <div class="sub-desc">The start date/time</div></li>
     * <li><b><code>DateTime</code></b> : <div class="sub-desc">The end date/time</div></li>
     * <li><b><code>Boolean</code></b> : <div class="sub-desc">True if the dates are all-day, false 
     * if the time values should be used</div></li><ul></div>
     * @return {Array} The array of return values
     */
    getValue: function() {
        return [
        this.getDT('start'),
        this.getDT('end'),
        this.allDay.getValue()
        ];
    },

    // private getValue helper
    getDT: function(startend) {
        var time = this[startend + 'Time'].getValue(),
        dt = this[startend + 'Date'].getValue();

        if (Ext.isDate(dt)) {
            dt = dt.format(this[startend + 'Date'].format);
        }
        else {
            return null;
        };
        if (time != '' && this[startend + 'Time'].isVisible()) {
            return Date.parseDate(dt + ' ' + time, this[startend + 'Date'].format + ' ' + this[startend + 'Time'].format);
        }
        return Date.parseDate(dt, this[startend + 'Date'].format);

    },

    /**
     * Sets the values to use in the date range.
     * @param {Array/Date/Object} v The value(s) to set into the field. Valid types are as follows:<div class="mdetail-params"><ul>
     * <li><b><code>Array</code></b> : <div class="sub-desc">An array containing, in order, a start date, end date and all-day flag.
     * This array should exactly match the return type as specified by {@link #getValue}.</div></li>
     * <li><b><code>DateTime</code></b> : <div class="sub-desc">A single Date object, which will be used for both the start and
     * end dates in the range.  The all-day flag will be defaulted to false.</div></li>
     * <li><b><code>Object</code></b> : <div class="sub-desc">An object containing properties for StartDate, EndDate and IsAllDay
     * as defined in {@link Ext.calendar.EventMappings}.</div></li><ul></div>
     */
    setValue: function(v) {
        if (Ext.isArray(v)) {
            this.setDT(v[0], 'start');
            this.setDT(v[1], 'end');
            this.allDay.setValue( !! v[2]);
        }
        else if (Ext.isDate(v)) {
            this.setDT(v, 'start');
            this.setDT(v, 'end');
            this.allDay.setValue(false);
        }
        else if (v[Ext.calendar.EventMappings.StartDate.name]) {
            //object
            this.setDT(v[Ext.calendar.EventMappings.StartDate.name], 'start');
            if (!this.setDT(v[Ext.calendar.EventMappings.EndDate.name], 'end')) {
                this.setDT(v[Ext.calendar.EventMappings.StartDate.name], 'end');
            }
            this.allDay.setValue( !! v[Ext.calendar.EventMappings.IsAllDay.name]);
        }
    },

    // private setValue helper
    setDT: function(dt, startend) {
        if (dt && Ext.isDate(dt)) {
            this[startend + 'Date'].setValue(dt);
            this[startend + 'Time'].setValue(dt.format(this[startend + 'Time'].format));
            return true;
        }
    },

    // inherited docs
    isDirty: function() {
        var dirty = false;
        if (this.rendered && !this.disabled) {
            this.items.each(function(item) {
                if (item.isDirty()) {
                    dirty = true;
                    return false;
                }
            });
        }
        return dirty;
    },

    // private
    onDisable: function() {
        this.delegateFn('disable');
    },

    // private
    onEnable: function() {
        this.delegateFn('enable');
    },

    // inherited docs
    reset: function() {
        this.delegateFn('reset');
    },

    // private
    delegateFn: function(fn) {
        this.items.each(function(item) {
            if (item[fn]) {
                item[fn]();
            }
        });
    },

    // private
    beforeDestroy: function() {
        Ext.destroy(this.fieldCt);
        Ext.calendar.DateRangeField.superclass.beforeDestroy.call(this);
    },

    /**
     * @method getRawValue
     * @hide
     */
    getRawValue: Ext.emptyFn,
    /**
     * @method setRawValue
     * @hide
     */
    setRawValue: Ext.emptyFn
});

Ext.reg('daterangefield', Ext.calendar.DateRangeField);
/**
 * @class Ext.calendar.ReminderField
 * @extends Ext.form.ComboBox
 * <p>A custom combo used for choosing a reminder setting for an event.</p>
 * <p>This is pretty much a standard combo that is simply pre-configured for the options needed by the
 * calendar components. The default configs are as follows:<pre><code>
    width: 200,
    fieldLabel: 'Reminder',
    mode: 'local',
    triggerAction: 'all',
    forceSelection: true,
    displayField: 'desc',
    valueField: 'value'
</code></pre>
 * @constructor
 * @param {Object} config The config object
 */
Ext.calendar.ReminderField = Ext.extend(Ext.form.ComboBox, {
    width: 200,
    fieldLabel: 'Reminder',
    mode: 'local',
    triggerAction: 'all',
    forceSelection: true,
    displayField: 'desc',
    valueField: 'value',

    // private
    initComponent: function() {
        Ext.calendar.ReminderField.superclass.initComponent.call(this);

        this.store = this.store || new Ext.data.ArrayStore({
            fields: ['value', 'desc'],
            idIndex: 0,
            data: [
            ['', 'None'],
            ['0', 'At start time'],
            ['5', '5 minutes before start'],
            ['15', '15 minutes before start'],
            ['30', '30 minutes before start'],
            ['60', '1 hour before start'],
            ['90', '1.5 hours before start'],
            ['120', '2 hours before start'],
            ['180', '3 hours before start'],
            ['360', '6 hours before start'],
            ['720', '12 hours before start'],
            ['1440', '1 day before start'],
            ['2880', '2 days before start'],
            ['4320', '3 days before start'],
            ['5760', '4 days before start'],
            ['7200', '5 days before start'],
            ['10080', '1 week before start'],
            ['20160', '2 weeks before start']
            ]
        });
    },

    // inherited docs
    initValue: function() {
        if (this.value !== undefined) {
            this.setValue(this.value);
        }
        else {
            this.setValue('');
        }
        this.originalValue = this.getValue();
    }
});

Ext.reg('reminderfield', Ext.calendar.ReminderField);
/**
 * @class Ext.calendar.EventEditForm
 * @extends Ext.form.FormPanel
 * <p>A custom form used for detailed editing of events.</p>
 * <p>This is pretty much a standard form that is simply pre-configured for the options needed by the
 * calendar components. It is also configured to automatically bind records of type {@link Ext.calendar.EventRecord}
 * to and from the form.</p>
 * <p>This form also provides custom events specific to the calendar so that other calendar components can be easily
 * notified when an event has been edited via this component.</p>
 * <p>The default configs are as follows:</p><pre><code>
    labelWidth: 65,
    title: 'Event Form',
    titleTextAdd: 'Add Event',
    titleTextEdit: 'Edit Event',
    bodyStyle: 'background:transparent;padding:20px 20px 10px;',
    border: false,
    buttonAlign: 'center',
    autoHeight: true,
    cls: 'ext-evt-edit-form',
</code></pre>
 * @constructor
 * @param {Object} config The config object
 */
Ext.calendar.EventEditForm = Ext.extend(Ext.form.FormPanel, {
    labelWidth: 65,
    title: 'Event Form',
    titleTextAdd: 'Add Event',
    titleTextEdit: 'Edit Event',
    bodyStyle: 'background:transparent;padding:20px 20px 10px;',
    border: false,
    buttonAlign: 'center',
    autoHeight: true,
    // to allow for the notes field to autogrow
    cls: 'ext-evt-edit-form',

    // private properties:
    newId: 10000,
    layout: 'column',

    // private
    initComponent: function() {

        this.addEvents({
            /**
             * @event eventadd
             * Fires after a new event is added
             * @param {Ext.calendar.EventEditForm} this
             * @param {Ext.calendar.EventRecord} rec The new {@link Ext.calendar.EventRecord record} that was added
             */
            eventadd: true,
            /**
             * @event eventupdate
             * Fires after an existing event is updated
             * @param {Ext.calendar.EventEditForm} this
             * @param {Ext.calendar.EventRecord} rec The new {@link Ext.calendar.EventRecord record} that was updated
             */
            eventupdate: true,
            /**
             * @event eventdelete
             * Fires after an event is deleted
             * @param {Ext.calendar.EventEditForm} this
             * @param {Ext.calendar.EventRecord} rec The new {@link Ext.calendar.EventRecord record} that was deleted
             */
            eventdelete: true,
            /**
             * @event eventcancel
             * Fires after an event add/edit operation is canceled by the user and no store update took place
             * @param {Ext.calendar.EventEditForm} this
             * @param {Ext.calendar.EventRecord} rec The new {@link Ext.calendar.EventRecord record} that was canceled
             */
            eventcancel: true
        });

        this.titleField = new Ext.form.TextField({
            fieldLabel: 'Title',
            name: Ext.calendar.EventMappings.Title.name,
            anchor: '90%'
        });
        this.dateRangeField = new Ext.calendar.DateRangeField({
            fieldLabel: 'When',
            anchor: '90%'
        });
        this.reminderField = new Ext.calendar.ReminderField({
            name: 'Reminder'
        });
        this.notesField = new Ext.form.TextArea({
            fieldLabel: 'Notes',
            name: Ext.calendar.EventMappings.Notes.name,
            grow: true,
            growMax: 150,
            anchor: '100%'
        });
        this.locationField = new Ext.form.TextField({
            fieldLabel: 'Location',
            name: Ext.calendar.EventMappings.Location.name,
            anchor: '100%'
        });
        this.urlField = new Ext.form.TextField({
            fieldLabel: 'Web Link',
            name: Ext.calendar.EventMappings.Url.name,
            anchor: '100%'
        });

        var leftFields = [this.titleField, this.dateRangeField, this.reminderField],
        rightFields = [this.notesField, this.locationField, this.urlField];

        if (this.calendarStore) {
            this.calendarField = new Ext.calendar.CalendarPicker({
                store: this.calendarStore,
                name: Ext.calendar.EventMappings.CalendarId.name
            });
            leftFields.splice(2, 0, this.calendarField);
        };

        this.items = [{
            id: 'left-col',
            columnWidth: 0.65,
            layout: 'form',
            border: false,
            items: leftFields
        },
        {
            id: 'right-col',
            columnWidth: 0.35,
            layout: 'form',
            border: false,
            items: rightFields
        }];

        this.fbar = [{
            text: 'Save',
            scope: this,
            handler: this.onSave
        },
        {
            cls: 'ext-del-btn',
            text: 'Delete',
            scope: this,
            handler: this.onDelete
        },
        {
            text: 'Cancel',
            scope: this,
            handler: this.onCancel
        }];

        Ext.calendar.EventEditForm.superclass.initComponent.call(this);
    },

    // inherited docs
    loadRecord: function(rec) {
        this.form.loadRecord.apply(this.form, arguments);
        this.activeRecord = rec;
        this.dateRangeField.setValue(rec.data);
        if (this.calendarStore) {
            this.form.setValues({
                'calendar': rec.data[Ext.calendar.EventMappings.CalendarId.name]
            });
        }
        this.isAdd = !!rec.data[Ext.calendar.EventMappings.IsNew.name];
        if (this.isAdd) {
            rec.markDirty();
            this.setTitle(this.titleTextAdd);
            Ext.select('.ext-del-btn').setDisplayed(false);
        }
        else {
            this.setTitle(this.titleTextEdit);
            Ext.select('.ext-del-btn').setDisplayed(true);
        }
        this.titleField.focus();
    },

    // inherited docs
    updateRecord: function() {
        var dates = this.dateRangeField.getValue();

        this.form.updateRecord(this.activeRecord);
        this.activeRecord.set(Ext.calendar.EventMappings.StartDate.name, dates[0]);
        this.activeRecord.set(Ext.calendar.EventMappings.EndDate.name, dates[1]);
        this.activeRecord.set(Ext.calendar.EventMappings.IsAllDay.name, dates[2]);
    },

    // private
    onCancel: function() {
        this.cleanup(true);
        this.fireEvent('eventcancel', this, this.activeRecord);
    },

    // private
    cleanup: function(hide) {
        if (this.activeRecord && this.activeRecord.dirty) {
            this.activeRecord.reject();
        }
        delete this.activeRecord;

        if (this.form.isDirty()) {
            this.form.reset();
        }
    },

    // private
    onSave: function() {
        if (!this.form.isValid()) {
            return;
        }
        this.updateRecord();

        if (!this.activeRecord.dirty) {
            this.onCancel();
            return;
        }

        this.fireEvent(this.isAdd ? 'eventadd': 'eventupdate', this, this.activeRecord);
    },

    // private
    onDelete: function() {
        this.fireEvent('eventdelete', this, this.activeRecord);
    }
});

Ext.reg('eventeditform', Ext.calendar.EventEditForm);
/**
 * @class Ext.calendar.EventEditWindow
 * @extends Ext.Window
 * <p>A custom window containing a basic edit form used for quick editing of events.</p>
 * <p>This window also provides custom events specific to the calendar so that other calendar components can be easily
 * notified when an event has been edited via this component.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext.calendar.EventEditWindow = function(config) {
    var formPanelCfg = {
        xtype: 'form',
        labelWidth: 65,
        frame: false,
        bodyStyle: 'background:transparent;padding:5px 10px 10px;',
        bodyBorder: false,
        border: false,
        items: [{
            id: 'title',
            name: Ext.calendar.EventMappings.Title.name,
            fieldLabel: 'Title',
            xtype: 'textfield',
            anchor: '100%'
        },
        {
            xtype: 'daterangefield',
            id: 'date-range',
            anchor: '100%',
            fieldLabel: 'When'
        }]
    };

    if (config.calendarStore) {
        this.calendarStore = config.calendarStore;
        delete config.calendarStore;

        formPanelCfg.items.push({
            xtype: 'calendarpicker',
            id: 'calendar',
            name: 'calendar',
            anchor: '100%',
            store: this.calendarStore
        });
    }

    Ext.calendar.EventEditWindow.superclass.constructor.call(this, Ext.apply({
        titleTextAdd: 'Add Event',
        titleTextEdit: 'Edit Event',
        width: 600,
        autocreate: true,
        border: true,
        closeAction: 'hide',
        modal: false,
        resizable: false,
        buttonAlign: 'left',
        savingMessage: 'Saving changes...',
        deletingMessage: 'Deleting event...',

        fbar: [{
            xtype: 'tbtext',
            text: '<a href="#" id="tblink">Edit Details...</a>'
        },
        '->', {
            text: 'Save',
            disabled: false,
            handler: this.onSave,
            scope: this
        },
        {
            id: 'delete-btn',
            text: 'Delete',
            disabled: false,
            handler: this.onDelete,
            scope: this,
            hideMode: 'offsets'
        },
        {
            text: 'Cancel',
            disabled: false,
            handler: this.onCancel,
            scope: this
        }],
        items: formPanelCfg
    },
    config));
};

Ext.extend(Ext.calendar.EventEditWindow, Ext.Window, {
    // private
    newId: 10000,

    // private
    initComponent: function() {
        Ext.calendar.EventEditWindow.superclass.initComponent.call(this);

        this.formPanel = this.items.items[0];

        this.addEvents({
            /**
             * @event eventadd
             * Fires after a new event is added
             * @param {Ext.calendar.EventEditWindow} this
             * @param {Ext.calendar.EventRecord} rec The new {@link Ext.calendar.EventRecord record} that was added
             */
            eventadd: true,
            /**
             * @event eventupdate
             * Fires after an existing event is updated
             * @param {Ext.calendar.EventEditWindow} this
             * @param {Ext.calendar.EventRecord} rec The new {@link Ext.calendar.EventRecord record} that was updated
             */
            eventupdate: true,
            /**
             * @event eventdelete
             * Fires after an event is deleted
             * @param {Ext.calendar.EventEditWindow} this
             * @param {Ext.calendar.EventRecord} rec The new {@link Ext.calendar.EventRecord record} that was deleted
             */
            eventdelete: true,
            /**
             * @event eventcancel
             * Fires after an event add/edit operation is canceled by the user and no store update took place
             * @param {Ext.calendar.EventEditWindow} this
             * @param {Ext.calendar.EventRecord} rec The new {@link Ext.calendar.EventRecord record} that was canceled
             */
            eventcancel: true,
            /**
             * @event editdetails
             * Fires when the user selects the option in this window to continue editing in the detailed edit form
             * (by default, an instance of {@link Ext.calendar.EventEditForm}. Handling code should hide this window
             * and transfer the current event record to the appropriate instance of the detailed form by showing it
             * and calling {@link Ext.calendar.EventEditForm#loadRecord loadRecord}.
             * @param {Ext.calendar.EventEditWindow} this
             * @param {Ext.calendar.EventRecord} rec The {@link Ext.calendar.EventRecord record} that is currently being edited
             */
            editdetails: true
        });
    },

    // private
    afterRender: function() {
        Ext.calendar.EventEditWindow.superclass.afterRender.call(this);

        this.el.addClass('ext-cal-event-win');

        Ext.get('tblink').on('click',
        function(e) {
            e.stopEvent();
            this.updateRecord();
            this.fireEvent('editdetails', this, this.activeRecord);
        },
        this);
    },

    /**
     * Shows the window, rendering it first if necessary, or activates it and brings it to front if hidden.
	 * @param {Ext.data.Record/Object} o Either a {@link Ext.data.Record} if showing the form
	 * for an existing event in edit mode, or a plain object containing a StartDate property (and 
	 * optionally an EndDate property) for showing the form in add mode. 
     * @param {String/Element} animateTarget (optional) The target element or id from which the window should
     * animate while opening (defaults to null with no animation)
     * @return {Ext.Window} this
     */
    show: function(o, animateTarget) {
        // Work around the CSS day cell height hack needed for initial render in IE8/strict:
        var anim = (Ext.isIE8 && Ext.isStrict) ? null: animateTarget;

        Ext.calendar.EventEditWindow.superclass.show.call(this, anim,
        function() {
            Ext.getCmp('title').focus(false, 100);
        });
        Ext.getCmp('delete-btn')[o.data && o.data[Ext.calendar.EventMappings.EventId.name] ? 'show': 'hide']();

        var rec,
        f = this.formPanel.form;

        if (o.data) {
            rec = o;
            this.isAdd = !!rec.data[Ext.calendar.EventMappings.IsNew.name];
            if (this.isAdd) {
                // Enable adding the default record that was passed in
                // if it's new even if the user makes no changes
                rec.markDirty();
                this.setTitle(this.titleTextAdd);
            }
            else {
                this.setTitle(this.titleTextEdit);
            }

            f.loadRecord(rec);
        }
        else {
            this.isAdd = true;
            this.setTitle(this.titleTextAdd);

            var M = Ext.calendar.EventMappings,
            eventId = M.EventId.name,
            start = o[M.StartDate.name],
            end = o[M.EndDate.name] || start.add('h', 1);

            rec = new Ext.calendar.EventRecord();
            rec.data[M.EventId.name] = this.newId++;
            rec.data[M.StartDate.name] = start;
            rec.data[M.EndDate.name] = end;
            rec.data[M.IsAllDay.name] = !!o[M.IsAllDay.name] || start.getDate() != end.clone().add(Date.MILLI, 1).getDate();
            rec.data[M.IsNew.name] = true;

            f.reset();
            f.loadRecord(rec);
        }

        if (this.calendarStore) {
            Ext.getCmp('calendar').setValue(rec.data[Ext.calendar.EventMappings.CalendarId.name]);
        }
        Ext.getCmp('date-range').setValue(rec.data);
        this.activeRecord = rec;

        return this;
    },

    // private
    roundTime: function(dt, incr) {
        incr = incr || 15;
        var m = parseInt(dt.getMinutes(), 10);
        return dt.add('mi', incr - (m % incr));
    },

    // private
    onCancel: function() {
        this.cleanup(true);
        this.fireEvent('eventcancel', this);
    },

    // private
    cleanup: function(hide) {
        if (this.activeRecord && this.activeRecord.dirty) {
            this.activeRecord.reject();
        }
        delete this.activeRecord;

        if (hide === true) {
            // Work around the CSS day cell height hack needed for initial render in IE8/strict:
            //var anim = afterDelete || (Ext.isIE8 && Ext.isStrict) ? null : this.animateTarget;
            this.hide();
        }
    },

    // private
    updateRecord: function() {
        var f = this.formPanel.form,
        dates = Ext.getCmp('date-range').getValue(),
        M = Ext.calendar.EventMappings;

        f.updateRecord(this.activeRecord);
        this.activeRecord.set(M.StartDate.name, dates[0]);
        this.activeRecord.set(M.EndDate.name, dates[1]);
        this.activeRecord.set(M.IsAllDay.name, dates[2]);
        this.activeRecord.set(M.CalendarId.name, this.formPanel.form.findField('calendar').getValue());
    },

    // private
    onSave: function() {
        if (!this.formPanel.form.isValid()) {
            return;
        }
        this.updateRecord();

        if (!this.activeRecord.dirty) {
            this.onCancel();
            return;
        }

        this.fireEvent(this.isAdd ? 'eventadd': 'eventupdate', this, this.activeRecord);
    },

    // private
    onDelete: function() {
        this.fireEvent('eventdelete', this, this.activeRecord);
    }
});/**
 * @class Ext.calendar.CalendarPanel
 * @extends Ext.Panel
 * <p>This is the default container for Ext calendar views. It supports day, week and month views as well
 * as a built-in event edit form. The only requirement for displaying a calendar is passing in a valid
 * {@link #calendarStore} config containing records of type {@link Ext.calendar.EventRecord EventRecord}. In order
 * to make the calendar interactive (enable editing, drag/drop, etc.) you can handle any of the various
 * events fired by the underlying views and exposed through the CalendarPanel.</p>
 * {@link #layoutConfig} option if needed.</p>
 * @constructor
 * @param {Object} config The config object
 * @xtype calendarpanel
 */
Ext.calendar.CalendarPanel = Ext.extend(Ext.Panel, {
    /**
     * @cfg {Boolean} showDayView
     * True to include the day view (and toolbar button), false to hide them (defaults to true).
     */
    showDayView: true,
    /**
     * @cfg {Boolean} showWeekView
     * True to include the week view (and toolbar button), false to hide them (defaults to true).
     */
    showWeekView: true,
    /**
     * @cfg {Boolean} showMonthView
     * True to include the month view (and toolbar button), false to hide them (defaults to true).
     * If the day and week views are both hidden, the month view will show by default even if
     * this config is false.
     */
    showMonthView: true,
    /**
     * @cfg {Boolean} showNavBar
     * True to display the calendar navigation toolbar, false to hide it (defaults to true). Note that
     * if you hide the default navigation toolbar you'll have to provide an alternate means of navigating the calendar.
     */
    showNavBar: true,
    /**
     * @cfg {String} todayText
     * Alternate text to use for the 'Today' nav bar button.
     */
    todayText: 'Today',
    /**
     * @cfg {Boolean} showTodayText
     * True to show the value of {@link #todayText} instead of today's date in the calendar's current day box,
     * false to display the day number(defaults to true).
     */
    showTodayText: true,
    /**
     * @cfg {Boolean} showTime
     * True to display the current time next to the date in the calendar's current day box, false to not show it 
     * (defaults to true).
     */
    showTime: true,
    /**
     * @cfg {String} dayText
     * Alternate text to use for the 'Day' nav bar button.
     */
    dayText: 'Day',
    /**
     * @cfg {String} weekText
     * Alternate text to use for the 'Week' nav bar button.
     */
    weekText: 'Week',
    /**
     * @cfg {String} monthText
     * Alternate text to use for the 'Month' nav bar button.
     */
    monthText: 'Month',

    // private
    layoutConfig: {
        layoutOnCardChange: true,
        deferredRender: true
    },

    // private property
    startDate: new Date(),

    // private
    initComponent: function() {
        this.tbar = {
            cls: 'ext-cal-toolbar',
            border: true,
            buttonAlign: 'center',
            items: [{
                id: this.id + '-tb-prev',
                handler: this.onPrevClick,
                scope: this,
                iconCls: 'x-tbar-page-prev'
            }]
        };

        this.viewCount = 0;

        if (this.showDayView) {
            this.tbar.items.push({
                id: this.id + '-tb-day',
                text: this.dayText,
                handler: this.onDayClick,
                scope: this,
                toggleGroup: 'tb-views'
            });
            this.viewCount++;
        }
        if (this.showWeekView) {
            this.tbar.items.push({
                id: this.id + '-tb-week',
                text: this.weekText,
                handler: this.onWeekClick,
                scope: this,
                toggleGroup: 'tb-views'
            });
            this.viewCount++;
        }
        if (this.showMonthView || this.viewCount == 0) {
            this.tbar.items.push({
                id: this.id + '-tb-month',
                text: this.monthText,
                handler: this.onMonthClick,
                scope: this,
                toggleGroup: 'tb-views'
            });
            this.viewCount++;
            this.showMonthView = true;
        }
        this.tbar.items.push({
            id: this.id + '-tb-next',
            handler: this.onNextClick,
            scope: this,
            iconCls: 'x-tbar-page-next'
        });
        this.tbar.items.push('->');

        var idx = this.viewCount - 1;
        this.activeItem = this.activeItem === undefined ? idx: (this.activeItem > idx ? idx: this.activeItem);

        if (this.showNavBar === false) {
            delete this.tbar;
            this.addClass('x-calendar-nonav');
        }

        Ext.calendar.CalendarPanel.superclass.initComponent.call(this);

        this.addEvents({
            /**
             * @event eventadd
             * Fires after a new event is added to the underlying store
             * @param {Ext.calendar.CalendarPanel} this
             * @param {Ext.calendar.EventRecord} rec The new {@link Ext.calendar.EventRecord record} that was added
             */
            eventadd: true,
            /**
             * @event eventupdate
             * Fires after an existing event is updated
             * @param {Ext.calendar.CalendarPanel} this
             * @param {Ext.calendar.EventRecord} rec The new {@link Ext.calendar.EventRecord record} that was updated
             */
            eventupdate: true,
            /**
             * @event eventdelete
             * Fires after an event is removed from the underlying store
             * @param {Ext.calendar.CalendarPanel} this
             * @param {Ext.calendar.EventRecord} rec The new {@link Ext.calendar.EventRecord record} that was removed
             */
            eventdelete: true,
            /**
             * @event eventcancel
             * Fires after an event add/edit operation is canceled by the user and no store update took place
             * @param {Ext.calendar.CalendarPanel} this
             * @param {Ext.calendar.EventRecord} rec The new {@link Ext.calendar.EventRecord record} that was canceled
             */
            eventcancel: true,
            /**
             * @event viewchange
             * Fires after a different calendar view is activated (but not when the event edit form is activated)
             * @param {Ext.calendar.CalendarPanel} this
             * @param {Ext.CalendarView} view The view being activated (any valid {@link Ext.calendar.CalendarView CalendarView} subclass)
             * @param {Object} info Extra information about the newly activated view. This is a plain object 
             * with following properties:<div class="mdetail-params"><ul>
             * <li><b><code>activeDate</code></b> : <div class="sub-desc">The currently-selected date</div></li>
             * <li><b><code>viewStart</code></b> : <div class="sub-desc">The first date in the new view range</div></li>
             * <li><b><code>viewEnd</code></b> : <div class="sub-desc">The last date in the new view range</div></li>
             * </ul></div>
             */
            viewchange: true

            //
            // NOTE: CalendarPanel also relays the following events from contained views as if they originated from this:
            //
            /**
             * @event eventsrendered
             * Fires after events are finished rendering in the view
             * @param {Ext.calendar.CalendarPanel} this 
             */
            /**
             * @event eventclick
             * Fires after the user clicks on an event element
             * @param {Ext.calendar.CalendarPanel} this
             * @param {Ext.calendar.EventRecord} rec The {@link Ext.calendar.EventRecord record} for the event that was clicked on
             * @param {HTMLNode} el The DOM node that was clicked on
             */
            /**
             * @event eventover
             * Fires anytime the mouse is over an event element
             * @param {Ext.calendar.CalendarPanel} this
             * @param {Ext.calendar.EventRecord} rec The {@link Ext.calendar.EventRecord record} for the event that the cursor is over
             * @param {HTMLNode} el The DOM node that is being moused over
             */
            /**
             * @event eventout
             * Fires anytime the mouse exits an event element
             * @param {Ext.calendar.CalendarPanel} this
             * @param {Ext.calendar.EventRecord} rec The {@link Ext.calendar.EventRecord record} for the event that the cursor exited
             * @param {HTMLNode} el The DOM node that was exited
             */
            /**
             * @event datechange
             * Fires after the start date of the view changes
             * @param {Ext.calendar.CalendarPanel} this
             * @param {Date} startDate The start date of the view (as explained in {@link #getStartDate}
             * @param {Date} viewStart The first displayed date in the view
             * @param {Date} viewEnd The last displayed date in the view
             */
            /**
             * @event rangeselect
             * Fires after the user drags on the calendar to select a range of dates/times in which to create an event
             * @param {Ext.calendar.CalendarPanel} this
             * @param {Object} dates An object containing the start (StartDate property) and end (EndDate property) dates selected
             * @param {Function} callback A callback function that MUST be called after the event handling is complete so that
             * the view is properly cleaned up (shim elements are persisted in the view while the user is prompted to handle the
             * range selection). The callback is already created in the proper scope, so it simply needs to be executed as a standard
             * function call (e.g., callback()).
             */
            /**
             * @event eventmove
             * Fires after an event element is dragged by the user and dropped in a new position
             * @param {Ext.calendar.CalendarPanel} this
             * @param {Ext.calendar.EventRecord} rec The {@link Ext.calendar.EventRecord record} for the event that was moved with
             * updated start and end dates
             */
            /**
             * @event initdrag
             * Fires when a drag operation is initiated in the view
             * @param {Ext.calendar.CalendarPanel} this
             */
            /**
             * @event eventresize
             * Fires after the user drags the resize handle of an event to resize it
             * @param {Ext.calendar.CalendarPanel} this
             * @param {Ext.calendar.EventRecord} rec The {@link Ext.calendar.EventRecord record} for the event that was resized
             * containing the updated start and end dates
             */
            /**
             * @event dayclick
             * Fires after the user clicks within a day/week view container and not on an event element
             * @param {Ext.calendar.CalendarPanel} this
             * @param {Date} dt The date/time that was clicked on
             * @param {Boolean} allday True if the day clicked on represents an all-day box, else false.
             * @param {Ext.Element} el The Element that was clicked on
             */
        });

        this.layout = 'card';
        // do not allow override
        if (this.showDayView) {
            var day = Ext.apply({
                xtype: 'dayview',
                title: this.dayText,
                showToday: this.showToday,
                showTodayText: this.showTodayText,
                showTime: this.showTime
            },
            this.dayViewCfg);

            day.id = this.id + '-day';
            day.store = day.store || this.eventStore;
            this.initEventRelay(day);
            this.add(day);
        }
        if (this.showWeekView) {
            var wk = Ext.applyIf({
                xtype: 'weekview',
                title: this.weekText,
                showToday: this.showToday,
                showTodayText: this.showTodayText,
                showTime: this.showTime
            },
            this.weekViewCfg);

            wk.id = this.id + '-week';
            wk.store = wk.store || this.eventStore;
            this.initEventRelay(wk);
            this.add(wk);
        }
        if (this.showMonthView) {
            var month = Ext.applyIf({
                xtype: 'monthview',
                title: this.monthText,
                showToday: this.showToday,
                showTodayText: this.showTodayText,
                showTime: this.showTime,
                listeners: {
                    'weekclick': {
                        fn: function(vw, dt) {
                            this.showWeek(dt);
                        },
                        scope: this
                    }
                }
            },
            this.monthViewCfg);

            month.id = this.id + '-month';
            month.store = month.store || this.eventStore;
            this.initEventRelay(month);
            this.add(month);
        }

        this.add(Ext.applyIf({
            xtype: 'eventeditform',
            id: this.id + '-edit',
            calendarStore: this.calendarStore,
            listeners: {
                'eventadd': {
                    scope: this,
                    fn: this.onEventAdd
                },
                'eventupdate': {
                    scope: this,
                    fn: this.onEventUpdate
                },
                'eventdelete': {
                    scope: this,
                    fn: this.onEventDelete
                },
                'eventcancel': {
                    scope: this,
                    fn: this.onEventCancel
                }
            }
        },
        this.editViewCfg));
    },

    // private
    initEventRelay: function(cfg) {
        cfg.listeners = cfg.listeners || {};
        cfg.listeners.afterrender = {
            fn: function(c) {
                // relay the view events so that app code only has to handle them in one place
                this.relayEvents(c, ['eventsrendered', 'eventclick', 'eventover', 'eventout', 'dayclick',
                'eventmove', 'datechange', 'rangeselect', 'eventdelete', 'eventresize', 'initdrag']);
            },
            scope: this,
            single: true
        };
    },

    // private
    afterRender: function() {
        Ext.calendar.CalendarPanel.superclass.afterRender.call(this);
        this.fireViewChange();
    },

    // private
    onLayout: function() {
        Ext.calendar.CalendarPanel.superclass.onLayout.call(this);
        if (!this.navInitComplete) {
            this.updateNavState();
            this.navInitComplete = true;
        }
    },

    // private
    onEventAdd: function(form, rec) {
        rec.data[Ext.calendar.EventMappings.IsNew.name] = false;
        this.eventStore.add(rec);
        this.hideEditForm();
        this.fireEvent('eventadd', this, rec);
    },

    // private
    onEventUpdate: function(form, rec) {
        rec.commit();
        this.hideEditForm();
        this.fireEvent('eventupdate', this, rec);
    },

    // private
    onEventDelete: function(form, rec) {
        this.eventStore.remove(rec);
        this.hideEditForm();
        this.fireEvent('eventdelete', this, rec);
    },

    // private
    onEventCancel: function(form, rec) {
        this.hideEditForm();
        this.fireEvent('eventcancel', this, rec);
    },

    /**
     * Shows the built-in event edit form for the passed in event record.  This method automatically
     * hides the calendar views and navigation toolbar.  To return to the calendar, call {@link #hideEditForm}.
     * @param {Ext.calendar.EventRecord} record The event record to edit
     * @return {Ext.calendar.CalendarPanel} this
     */
    showEditForm: function(rec) {
        this.preEditView = this.layout.activeItem.id;
        this.setActiveView(this.id + '-edit');
        this.layout.activeItem.loadRecord(rec);
        return this;
    },

    /**
     * Hides the built-in event edit form and returns to the previous calendar view. If the edit form is
     * not currently visible this method has no effect.
     * @return {Ext.calendar.CalendarPanel} this
     */
    hideEditForm: function() {
        if (this.preEditView) {
            this.setActiveView(this.preEditView);
            delete this.preEditView;
        }
        return this;
    },

    // private
    setActiveView: function(id) {
        var l = this.layout;
        l.setActiveItem(id);

        if (id == this.id + '-edit') {
            this.getTopToolbar().hide();
            this.doLayout();
        }
        else {
            l.activeItem.refresh();
            this.getTopToolbar().show();
            this.updateNavState();
        }
        this.activeView = l.activeItem;
        this.fireViewChange();
    },

    // private
    fireViewChange: function() {
        var info = null,
            view = this.layout.activeItem;

        if (view.getViewBounds) {
            vb = view.getViewBounds();
            info = {
                activeDate: view.getStartDate(),
                viewStart: vb.start,
                viewEnd: vb.end
            };
        };
        this.fireEvent('viewchange', this, view, info);
    },

    // private
    updateNavState: function() {
        if (this.showNavBar !== false) {
            var item = this.layout.activeItem,
            suffix = item.id.split(this.id + '-')[1];

            var btn = Ext.getCmp(this.id + '-tb-' + suffix);
            btn.toggle(true);
        }
    },

    /**
     * Sets the start date for the currently-active calendar view.
     * @param {Date} dt
     */
    setStartDate: function(dt) {
        this.layout.activeItem.setStartDate(dt, true);
        this.updateNavState();
        this.fireViewChange();
    },

    // private
    showWeek: function(dt) {
        this.setActiveView(this.id + '-week');
        this.setStartDate(dt);
    },

    // private
    onPrevClick: function() {
        this.startDate = this.layout.activeItem.movePrev();
        this.updateNavState();
        this.fireViewChange();
    },

    // private
    onNextClick: function() {
        this.startDate = this.layout.activeItem.moveNext();
        this.updateNavState();
        this.fireViewChange();
    },

    // private
    onDayClick: function() {
        this.setActiveView(this.id + '-day');
    },

    // private
    onWeekClick: function() {
        this.setActiveView(this.id + '-week');
    },

    // private
    onMonthClick: function() {
        this.setActiveView(this.id + '-month');
    },

    /**
     * Return the calendar view that is currently active, which will be a subclass of
     * {@link Ext.calendar.CalendarView CalendarView}.
     * @return {Ext.calendar.CalendarView} The active view
     */
    getActiveView: function() {
        return this.layout.activeItem;
    }
});

Ext.reg('calendarpanel', Ext.calendar.CalendarPanel);
/*
 * Ext JS Library 3.3.0
 * Copyright(c) 2006-2010 Ext JS, Inc.
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
Ext.ns("Ext.calendar");(function(){Ext.apply(Ext.calendar,{Date:{diffDays:function(b,a){day=1000*60*60*24;diff=a.clearTime(true).getTime()-b.clearTime(true).getTime();return Math.ceil(diff/day)},copyTime:function(c,b){var a=b.clone();a.setHours(c.getHours(),c.getMinutes(),c.getSeconds(),c.getMilliseconds());return a},compare:function(c,b,a){if(a!==true){c=c.clone();c.setMilliseconds(0);b=b.clone();b.setMilliseconds(0)}return b.getTime()-c.getTime()},maxOrMin:function(a){var f=(a?0:Number.MAX_VALUE),c=0,b=arguments[1],e=b.length;for(;c<e;c++){f=Math[a?"max":"min"](f,b[c].getTime())}return new Date(f)},max:function(){return this.maxOrMin.apply(this,[true,arguments])},min:function(){return this.maxOrMin.apply(this,[false,arguments])}}})})();Ext.calendar.DayHeaderTemplate=function(a){Ext.apply(this,a);this.allDayTpl=new Ext.calendar.BoxLayoutTemplate(a);this.allDayTpl.compile();Ext.calendar.DayHeaderTemplate.superclass.constructor.call(this,'<div class="ext-cal-hd-ct">','<table class="ext-cal-hd-days-tbl" cellspacing="0" cellpadding="0">',"<tbody>","<tr>",'<td class="ext-cal-gutter"></td>','<td class="ext-cal-hd-days-td"><div class="ext-cal-hd-ad-inner">{allDayTpl}</div></td>','<td class="ext-cal-gutter-rt"></td>',"</tr>","</tobdy>","</table>","</div>")};Ext.extend(Ext.calendar.DayHeaderTemplate,Ext.XTemplate,{applyTemplate:function(a){return Ext.calendar.DayHeaderTemplate.superclass.applyTemplate.call(this,{allDayTpl:this.allDayTpl.apply(a)})}});Ext.calendar.DayHeaderTemplate.prototype.apply=Ext.calendar.DayHeaderTemplate.prototype.applyTemplate;Ext.calendar.DayBodyTemplate=function(a){Ext.apply(this,a);Ext.calendar.DayBodyTemplate.superclass.constructor.call(this,'<table class="ext-cal-bg-tbl" cellspacing="0" cellpadding="0">',"<tbody>",'<tr height="1">','<td class="ext-cal-gutter"></td>','<td colspan="{dayCount}">','<div class="ext-cal-bg-rows">','<div class="ext-cal-bg-rows-inner">','<tpl for="times">','<div class="ext-cal-bg-row">','<div class="ext-cal-bg-row-div ext-row-{[xindex]}"></div>',"</div>","</tpl>","</div>","</div>","</td>","</tr>","<tr>",'<td class="ext-cal-day-times">','<tpl for="times">','<div class="ext-cal-bg-row">','<div class="ext-cal-day-time-inner">{.}</div>',"</div>","</tpl>","</td>",'<tpl for="days">','<td class="ext-cal-day-col">','<div class="ext-cal-day-col-inner">','<div id="{[this.id]}-day-col-{.:date("Ymd")}" class="ext-cal-day-col-gutter"></div>',"</div>","</td>","</tpl>","</tr>","</tbody>","</table>")};Ext.extend(Ext.calendar.DayBodyTemplate,Ext.XTemplate,{applyTemplate:function(e){this.today=new Date().clearTime();this.dayCount=this.dayCount||1;var a=0,f=[],b=e.viewStart.clone(),c;for(;a<this.dayCount;a++){f[a]=b.add(Date.DAY,a)}c=[];b=new Date().clearTime();for(a=0;a<24;a++){c.push(b.format("ga"));b=b.add(Date.HOUR,1)}return Ext.calendar.DayBodyTemplate.superclass.applyTemplate.call(this,{days:f,dayCount:f.length,times:c})}});Ext.calendar.DayBodyTemplate.prototype.apply=Ext.calendar.DayBodyTemplate.prototype.applyTemplate;Ext.calendar.DayViewTemplate=function(a){Ext.apply(this,a);this.headerTpl=new Ext.calendar.DayHeaderTemplate(a);this.headerTpl.compile();this.bodyTpl=new Ext.calendar.DayBodyTemplate(a);this.bodyTpl.compile();Ext.calendar.DayViewTemplate.superclass.constructor.call(this,'<div class="ext-cal-inner-ct">',"{headerTpl}","{bodyTpl}","</div>")};Ext.extend(Ext.calendar.DayViewTemplate,Ext.XTemplate,{applyTemplate:function(a){return Ext.calendar.DayViewTemplate.superclass.applyTemplate.call(this,{headerTpl:this.headerTpl.apply(a),bodyTpl:this.bodyTpl.apply(a)})}});Ext.calendar.DayViewTemplate.prototype.apply=Ext.calendar.DayViewTemplate.prototype.applyTemplate;Ext.calendar.BoxLayoutTemplate=function(a){Ext.apply(this,a);var b=this.showWeekLinks?'<div id="{weekLinkId}" class="ext-cal-week-link">{weekNum}</div>':"";Ext.calendar.BoxLayoutTemplate.superclass.constructor.call(this,'<tpl for="weeks">','<div id="{[this.id]}-wk-{[xindex-1]}" class="ext-cal-wk-ct" style="top:{[this.getRowTop(xindex, xcount)]}%; height:{[this.getRowHeight(xcount)]}%;">',b,'<table class="ext-cal-bg-tbl" cellpadding="0" cellspacing="0">',"<tbody>","<tr>",'<tpl for=".">','<td id="{[this.id]}-day-{date:date("Ymd")}" class="{cellCls}">&nbsp;</td>',"</tpl>","</tr>","</tbody>","</table>",'<table class="ext-cal-evt-tbl" cellpadding="0" cellspacing="0">',"<tbody>","<tr>",'<tpl for=".">','<td id="{[this.id]}-ev-day-{date:date("Ymd")}" class="{titleCls}"><div>{title}</div></td>',"</tpl>","</tr>","</tbody>","</table>","</div>","</tpl>",{getRowTop:function(c,e){return((c-1)*(100/e))},getRowHeight:function(c){return 100/c}})};Ext.extend(Ext.calendar.BoxLayoutTemplate,Ext.XTemplate,{applyTemplate:function(e){Ext.apply(this,e);var n=0,m="",h=true,j=false,f=false,g=false,i=false,a=[[]],l=new Date().clearTime(),c=this.viewStart.clone(),b=this.startDate.getMonth();for(;n<this.weekCount||this.weekCount==-1;n++){if(c>this.viewEnd){break}a[n]=[];for(var k=0;k<this.dayCount;k++){j=c.getTime()===l.getTime();f=h||(c.getDate()==1);g=(c.getMonth()<b)&&this.weekCount==-1;i=(c.getMonth()>b)&&this.weekCount==-1;if(c.getDay()==1){a[n].weekNum=this.showWeekNumbers?c.format("W"):"&nbsp;";a[n].weekLinkId="ext-cal-week-"+c.format("Ymd")}if(f){if(j){m=this.getTodayText()}else{m=c.format(this.dayCount==1?"l, F j, Y":(h?"M j, Y":"M j"))}}else{var p=(n==0&&this.showHeader!==true)?"D j":"j";m=j?this.getTodayText():c.format(p)}a[n].push({title:m,date:c.clone(),titleCls:"ext-cal-dtitle "+(j?" ext-cal-dtitle-today":"")+(n==0?" ext-cal-dtitle-first":"")+(g?" ext-cal-dtitle-prev":"")+(i?" ext-cal-dtitle-next":""),cellCls:"ext-cal-day "+(j?" ext-cal-day-today":"")+(k==0?" ext-cal-day-first":"")+(g?" ext-cal-day-prev":"")+(i?" ext-cal-day-next":"")});c=c.add(Date.DAY,1);h=false}}return Ext.calendar.BoxLayoutTemplate.superclass.applyTemplate.call(this,{weeks:a})},getTodayText:function(){var b=new Date().format("l, F j, Y"),c=this.showTodayText!==false?this.todayText:"",a=this.showTime!==false?' <span id="'+this.id+'-clock" class="ext-cal-dtitle-time">'+new Date().format("g:i a")+"</span>":"",e=c.length>0||a.length>0?" &mdash; ":"";if(this.dayCount==1){return b+e+c+a}fmt=this.weekCount==1?"D j":"j";return c.length>0?c+a:new Date().format(fmt)+a}});Ext.calendar.BoxLayoutTemplate.prototype.apply=Ext.calendar.BoxLayoutTemplate.prototype.applyTemplate;Ext.calendar.MonthViewTemplate=function(a){Ext.apply(this,a);this.weekTpl=new Ext.calendar.BoxLayoutTemplate(a);this.weekTpl.compile();var b=this.showWeekLinks?'<div class="ext-cal-week-link-hd">&nbsp;</div>':"";Ext.calendar.MonthViewTemplate.superclass.constructor.call(this,'<div class="ext-cal-inner-ct {extraClasses}">','<div class="ext-cal-hd-ct ext-cal-month-hd">',b,'<table class="ext-cal-hd-days-tbl" cellpadding="0" cellspacing="0">',"<tbody>","<tr>",'<tpl for="days">','<th class="ext-cal-hd-day{[xindex==1 ? " ext-cal-day-first" : ""]}" title="{.:date("l, F j, Y")}">{.:date("D")}</th>',"</tpl>","</tr>","</tbody>","</table>","</div>",'<div class="ext-cal-body-ct">{weeks}</div>',"</div>")};Ext.extend(Ext.calendar.MonthViewTemplate,Ext.XTemplate,{applyTemplate:function(f){var g=[],e=this.weekTpl.apply(f),c=f.viewStart;for(var b=0;b<7;b++){g.push(c.add(Date.DAY,b))}var a=this.showHeader===true?"":"ext-cal-noheader";if(this.showWeekLinks){a+=" ext-cal-week-links"}return Ext.calendar.MonthViewTemplate.superclass.applyTemplate.call(this,{days:g,weeks:e,extraClasses:a})}});Ext.calendar.MonthViewTemplate.prototype.apply=Ext.calendar.MonthViewTemplate.prototype.applyTemplate;Ext.dd.ScrollManager=function(){var c=Ext.dd.DragDropMgr,f={},b=null,i={},h=function(l){b=null;a()},j=function(){if(c.dragCurrent){c.refreshCache(c.dragCurrent.groups)}},e=function(){if(c.dragCurrent){var l=Ext.dd.ScrollManager,m=i.el.ddScrollConfig?i.el.ddScrollConfig.increment:l.increment;if(!l.animate){if(i.el.scroll(i.dir,m)){j()}}else{i.el.scroll(i.dir,m,true,l.animDuration,j)}}},a=function(){if(i.id){clearInterval(i.id)}i.id=0;i.el=null;i.dir=""},g=function(m,l){a();i.el=m;i.dir=l;var o=(m.ddScrollConfig&&m.ddScrollConfig.frequency)?m.ddScrollConfig.frequency:Ext.dd.ScrollManager.frequency,n=m.ddScrollConfig?m.ddScrollConfig.ddGroup:undefined;if(n===undefined||c.dragCurrent.ddGroup==n){i.id=setInterval(e,o)}},k=function(o,q){if(q||!c.dragCurrent){return}var s=Ext.dd.ScrollManager;if(!b||b!=c.dragCurrent){b=c.dragCurrent;s.refreshCache()}var t=Ext.lib.Event.getXY(o),u=new Ext.lib.Point(t[0],t[1]),m,n,l,p;for(m in f){if(f.hasOwnProperty(m)){n=f[m];l=n._region;p=n.ddScrollConfig?n.ddScrollConfig:s;if(l&&l.contains(u)&&n.isScrollable()){if(l.bottom-u.y<=p.vthresh){if(i.el!=n){g(n,"down")}return}else{if(l.right-u.x<=p.hthresh){if(i.el!=n){g(n,"left")}return}else{if(u.y-l.top<=p.vthresh){if(i.el!=n){g(n,"up")}return}else{if(u.x-l.left<=p.hthresh){if(i.el!=n){g(n,"right")}return}}}}}}}a()};c.fireEvents=c.fireEvents.createSequence(k,c);c.stopDrag=c.stopDrag.createSequence(h,c);return{register:function(n){if(Ext.isArray(n)){var m=0,l=n.length;for(;m<l;m++){this.register(n[m])}}else{n=Ext.get(n);f[n.id]=n}},unregister:function(n){if(Ext.isArray(n)){var m=0,l=n.length;for(;m<l;m++){this.unregister(n[m])}}else{n=Ext.get(n);delete f[n.id]}},vthresh:25,hthresh:25,increment:100,frequency:500,animate:true,animDuration:0.4,refreshCache:function(){var l;for(l in f){if(f.hasOwnProperty(l)){if(typeof f[l]=="object"){f[l]._region=f[l].getRegion()}}}}}}();Ext.calendar.StatusProxy=function(a){Ext.apply(this,a);this.id=this.id||Ext.id();this.el=new Ext.Layer({dh:{id:this.id,cls:"ext-dd-drag-proxy x-dd-drag-proxy "+this.dropNotAllowed,cn:[{cls:"x-dd-drop-icon"},{cls:"ext-dd-ghost-ct",cn:[{cls:"x-dd-drag-ghost"},{cls:"ext-dd-msg"}]}]},shadow:!a||a.shadow!==false});this.ghost=Ext.get(this.el.dom.childNodes[1].childNodes[0]);this.message=Ext.get(this.el.dom.childNodes[1].childNodes[1]);this.dropStatus=this.dropNotAllowed};Ext.extend(Ext.calendar.StatusProxy,Ext.dd.StatusProxy,{moveEventCls:"ext-cal-dd-move",addEventCls:"ext-cal-dd-add",update:function(a){if(typeof a=="string"){this.ghost.update(a)}else{this.ghost.update("");a.style.margin="0";this.ghost.dom.appendChild(a)}var b=this.ghost.dom.firstChild;if(b){Ext.fly(b).setStyle("float","none").setHeight("auto");Ext.getDom(b).id+="-ddproxy"}},updateMsg:function(a){this.message.update(a)}});Ext.calendar.DragZone=Ext.extend(Ext.dd.DragZone,{ddGroup:"CalendarDD",eventSelector:".ext-cal-evt",constructor:function(b,a){if(!Ext.calendar._statusProxyInstance){Ext.calendar._statusProxyInstance=new Ext.calendar.StatusProxy()}this.proxy=Ext.calendar._statusProxyInstance;Ext.calendar.DragZone.superclass.constructor.call(this,b,a)},getDragData:function(b){var a=b.getTarget(this.eventSelector,3);if(a){var c=this.view.getEventRecordFromEl(a);return{type:"eventdrag",ddel:a,eventStart:c.data[Ext.calendar.EventMappings.StartDate.name],eventEnd:c.data[Ext.calendar.EventMappings.EndDate.name],proxy:this.proxy}}a=this.view.getDayAt(b.getPageX(),b.getPageY());if(a.el){return{type:"caldrag",start:a.date,proxy:this.proxy}}return null},onInitDrag:function(a,e){if(this.dragData.ddel){var b=this.dragData.ddel.cloneNode(true),c=Ext.fly(b).child("dl");Ext.fly(b).setWidth("auto");if(c){c.setHeight("auto")}this.proxy.update(b);this.onStartDrag(a,e)}else{if(this.dragData.start){this.onStartDrag(a,e)}}this.view.onInitDrag();return true},afterRepair:function(){if(Ext.enableFx&&this.dragData.ddel){Ext.Element.fly(this.dragData.ddel).highlight(this.hlColor||"c3daf9")}this.dragging=false},getRepairXY:function(a){if(this.dragData.ddel){return Ext.Element.fly(this.dragData.ddel).getXY()}},afterInvalidDrop:function(a,b){Ext.select(".ext-dd-shim").hide()}});Ext.calendar.DropZone=Ext.extend(Ext.dd.DropZone,{ddGroup:"CalendarDD",eventSelector:".ext-cal-evt",shims:[],getTargetFromEvent:function(b){var a=this.dragOffset||0,f=b.getPageY()-a,c=this.view.getDayAt(b.getPageX(),f);return c.el?c:null},onNodeOver:function(f,k,j,h){var a=Ext.calendar.Date,b=h.type=="eventdrag"?f.date:a.min(h.start,f.date),g=h.type=="eventdrag"?f.date.add(Date.DAY,a.diffDays(h.eventStart,h.eventEnd)):a.max(h.start,f.date);if(!this.dragStartDate||!this.dragEndDate||(a.diffDays(b,this.dragStartDate)!=0)||(a.diffDays(g,this.dragEndDate)!=0)){this.dragStartDate=b;this.dragEndDate=g.clearTime().add(Date.DAY,1).add(Date.MILLI,-1);this.shim(b,g);var i=b.format("n/j");if(a.diffDays(b,g)>0){i+="-"+g.format("n/j")}var c=String.format(h.type=="eventdrag"?this.moveText:this.createText,i);h.proxy.updateMsg(c)}return this.dropAllowed},shim:function(a,f){this.currWeek=-1;var b=a.clone(),g=0,e,h,c=Ext.calendar.Date.diffDays(b,f)+1;Ext.each(this.shims,function(i){if(i){i.isActive=false}});while(g++<c){var j=this.view.getDayEl(b);if(j){var k=this.view.getWeekIndex(b);e=this.shims[k];if(!e){e=this.createShim();this.shims[k]=e}if(k!=this.currWeek){e.boxInfo=j.getBox();this.currWeek=k}else{h=j.getBox();e.boxInfo.right=h.right;e.boxInfo.width=h.right-e.boxInfo.x}e.isActive=true}b=b.add(Date.DAY,1)}Ext.each(this.shims,function(i){if(i){if(i.isActive){i.show();i.setBox(i.boxInfo)}else{if(i.isVisible()){i.hide()}}}})},createShim:function(){if(!this.shimCt){this.shimCt=Ext.get("ext-dd-shim-ct");if(!this.shimCt){this.shimCt=document.createElement("div");this.shimCt.id="ext-dd-shim-ct";Ext.getBody().appendChild(this.shimCt)}}var a=document.createElement("div");a.className="ext-dd-shim";this.shimCt.appendChild(a);return new Ext.Layer({shadow:false,useDisplay:true,constrain:false},a)},clearShims:function(){Ext.each(this.shims,function(a){if(a){a.hide()}})},onContainerOver:function(a,c,b){return this.dropAllowed},onCalendarDragComplete:function(){delete this.dragStartDate;delete this.dragEndDate;this.clearShims()},onNodeDrop:function(h,a,f,c){if(h&&c){if(c.type=="eventdrag"){var g=this.view.getEventRecordFromEl(c.ddel),b=Ext.calendar.Date.copyTime(g.data[Ext.calendar.EventMappings.StartDate.name],h.date);this.view.onEventDrop(g,b);this.onCalendarDragComplete();return true}if(c.type=="caldrag"){this.view.onCalendarEndDrag(this.dragStartDate,this.dragEndDate,this.onCalendarDragComplete.createDelegate(this));return true}}this.onCalendarDragComplete();return false},onContainerDrop:function(a,c,b){this.onCalendarDragComplete();return false},destroy:function(){Ext.calendar.DropZone.superclass.destroy.call(this);Ext.destroy(this.shimCt)}});Ext.calendar.DayViewDragZone=Ext.extend(Ext.calendar.DragZone,{ddGroup:"DayViewDD",resizeSelector:".ext-evt-rsz",getDragData:function(c){var a=c.getTarget(this.resizeSelector,2,true),b,f;if(a){b=a.parent(this.eventSelector);f=this.view.getEventRecordFromEl(b);return{type:"eventresize",ddel:b.dom,eventStart:f.data[Ext.calendar.EventMappings.StartDate.name],eventEnd:f.data[Ext.calendar.EventMappings.EndDate.name],proxy:this.proxy}}a=c.getTarget(this.eventSelector,3);if(a){f=this.view.getEventRecordFromEl(a);return{type:"eventdrag",ddel:a,eventStart:f.data[Ext.calendar.EventMappings.StartDate.name],eventEnd:f.data[Ext.calendar.EventMappings.EndDate.name],proxy:this.proxy}}a=this.view.getDayAt(c.getPageX(),c.getPageY());if(a.el){return{type:"caldrag",dayInfo:a,proxy:this.proxy}}return null}});Ext.calendar.DayViewDropZone=Ext.extend(Ext.calendar.DropZone,{ddGroup:"DayViewDD",onNodeOver:function(c,k,j,g){var b,h,i,l=this.createText,p,a,f,o,m;if(g.type=="caldrag"){if(!this.dragStartMarker){this.dragStartMarker=c.el.parent().createChild({style:"position:absolute;"});this.dragStartMarker.setBox(c.timeBox);this.dragCreateDt=c.date}h=this.dragStartMarker.getBox();h.height=Math.ceil(Math.abs(j.xy[1]-h.y)/c.timeBox.height)*c.timeBox.height;if(j.xy[1]<h.y){h.height+=c.timeBox.height;h.y=h.y-h.height+c.timeBox.height;i=this.dragCreateDt.add(Date.MINUTE,30)}else{c.date=c.date.add(Date.MINUTE,30)}this.shim(this.dragCreateDt,h);p=Ext.calendar.Date.copyTime(c.date,this.dragCreateDt);this.dragStartDate=Ext.calendar.Date.min(this.dragCreateDt,p);this.dragEndDate=i||Ext.calendar.Date.max(this.dragCreateDt,p);b=this.dragStartDate.format("g:ia-")+this.dragEndDate.format("g:ia")}else{o=Ext.get(g.ddel);m=o.parent().parent();h=o.getBox();h.width=m.getWidth();if(g.type=="eventdrag"){if(this.dragOffset===undefined){this.dragOffset=c.timeBox.y-h.y;h.y=c.timeBox.y-this.dragOffset}else{h.y=c.timeBox.y}b=c.date.format("n/j g:ia");h.x=c.el.getLeft();this.shim(c.date,h);l=this.moveText}if(g.type=="eventresize"){if(!this.resizeDt){this.resizeDt=c.date}h.x=m.getLeft();h.height=Math.ceil(Math.abs(j.xy[1]-h.y)/c.timeBox.height)*c.timeBox.height;if(j.xy[1]<h.y){h.y-=h.height}else{c.date=c.date.add(Date.MINUTE,30)}this.shim(this.resizeDt,h);p=Ext.calendar.Date.copyTime(c.date,this.resizeDt);a=Ext.calendar.Date.min(g.eventStart,p);f=Ext.calendar.Date.max(g.eventStart,p);g.resizeDates={StartDate:a,EndDate:f};b=a.format("g:ia-")+f.format("g:ia");l=this.resizeText}}g.proxy.updateMsg(String.format(l,b));return this.dropAllowed},shim:function(b,a){Ext.each(this.shims,function(e){if(e){e.isActive=false;e.hide()}});var c=this.shims[0];if(!c){c=this.createShim();this.shims[0]=c}c.isActive=true;c.show();c.setBox(a)},onNodeDrop:function(g,a,c,b){var f;if(g&&b){if(b.type=="eventdrag"){f=this.view.getEventRecordFromEl(b.ddel);this.view.onEventDrop(f,g.date);this.onCalendarDragComplete();delete this.dragOffset;return true}if(b.type=="eventresize"){f=this.view.getEventRecordFromEl(b.ddel);this.view.onEventResize(f,b.resizeDates);this.onCalendarDragComplete();delete this.resizeDt;return true}if(b.type=="caldrag"){Ext.destroy(this.dragStartMarker);delete this.dragStartMarker;delete this.dragCreateDt;this.view.onCalendarEndDrag(this.dragStartDate,this.dragEndDate,this.onCalendarDragComplete.createDelegate(this));return true}}this.onCalendarDragComplete();return false}});Ext.calendar.EventMappings={EventId:{name:"EventId",mapping:"id",type:"int"},CalendarId:{name:"CalendarId",mapping:"cid",type:"int"},Title:{name:"Title",mapping:"title",type:"string"},StartDate:{name:"StartDate",mapping:"start",type:"date",dateFormat:"c"},EndDate:{name:"EndDate",mapping:"end",type:"date",dateFormat:"c"},Location:{name:"Location",mapping:"loc",type:"string"},Notes:{name:"Notes",mapping:"notes",type:"string"},Url:{name:"Url",mapping:"url",type:"string"},IsAllDay:{name:"IsAllDay",mapping:"ad",type:"boolean"},Reminder:{name:"Reminder",mapping:"rem",type:"string"},IsNew:{name:"IsNew",mapping:"n",type:"boolean"}};(function(){var a=Ext.calendar.EventMappings;Ext.calendar.EventRecord=Ext.data.Record.create([a.EventId,a.CalendarId,a.Title,a.StartDate,a.EndDate,a.Location,a.Notes,a.Url,a.IsAllDay,a.Reminder,a.IsNew]);Ext.calendar.EventRecord.reconfigure=function(){Ext.calendar.EventRecord=Ext.data.Record.create([a.EventId,a.CalendarId,a.Title,a.StartDate,a.EndDate,a.Location,a.Notes,a.Url,a.IsAllDay,a.Reminder,a.IsNew])}})();Ext.calendar.MonthDayDetailView=Ext.extend(Ext.BoxComponent,{initComponent:function(){Ext.calendar.CalendarView.superclass.initComponent.call(this);this.addEvents({eventsrendered:true});if(!this.el){this.el=document.createElement("div")}},afterRender:function(){this.tpl=this.getTemplate();Ext.calendar.MonthDayDetailView.superclass.afterRender.call(this);this.el.on({click:this.view.onClick,mouseover:this.view.onMouseOver,mouseout:this.view.onMouseOut,scope:this.view})},getTemplate:function(){if(!this.tpl){this.tpl=new Ext.XTemplate('<div class="ext-cal-mdv x-unselectable">','<table class="ext-cal-mvd-tbl" cellpadding="0" cellspacing="0">',"<tbody>",'<tpl for=".">','<tr><td class="ext-cal-ev">{markup}</td></tr>',"</tpl>","</tbody>","</table>","</div>")}this.tpl.compile();return this.tpl},update:function(a){this.date=a;this.refresh()},refresh:function(){if(!this.rendered){return}var a=this.view.getEventTemplate(),b=[];evts=this.store.queryBy(function(i){var f=this.date.clearTime(true).getTime(),e=i.data[Ext.calendar.EventMappings.StartDate.name].clearTime(true).getTime(),g=(f==e),h=false;if(!g){var c=i.data[Ext.calendar.EventMappings.EndDate.name].clearTime(true).getTime();h=e<f&&c>=f}return g||h},this);evts.each(function(c){var e=c.data,f=Ext.calendar.EventMappings;e._renderAsAllDay=e[f.IsAllDay.name]||Ext.calendar.Date.diffDays(e[f.StartDate.name],e[f.EndDate.name])>0;e.spanLeft=Ext.calendar.Date.diffDays(e[f.StartDate.name],this.date)>0;e.spanRight=Ext.calendar.Date.diffDays(this.date,e[f.EndDate.name])>0;e.spanCls=(e.spanLeft?(e.spanRight?"ext-cal-ev-spanboth":"ext-cal-ev-spanleft"):(e.spanRight?"ext-cal-ev-spanright":""));b.push({markup:a.apply(this.getTemplateEventData(e))})},this);this.tpl.overwrite(this.el,b);this.fireEvent("eventsrendered",this,this.date,evts.getCount())},getTemplateEventData:function(a){var b=this.view.getTemplateEventData(a);b._elId="dtl-"+b._elId;return b}});Ext.reg("monthdaydetailview",Ext.calendar.MonthDayDetailView);Ext.calendar.CalendarPicker=Ext.extend(Ext.form.ComboBox,{fieldLabel:"Calendar",valueField:"CalendarId",displayField:"Title",triggerAction:"all",mode:"local",forceSelection:true,width:200,initComponent:function(){Ext.calendar.CalendarPicker.superclass.initComponent.call(this);this.tpl=this.tpl||'<tpl for="."><div class="x-combo-list-item ext-color-{'+this.valueField+'}"><div class="ext-cal-picker-icon">&nbsp;</div>{'+this.displayField+"}</div></tpl>"},afterRender:function(){Ext.calendar.CalendarPicker.superclass.afterRender.call(this);this.wrap=this.el.up(".x-form-field-wrap");this.wrap.addClass("ext-calendar-picker");this.icon=Ext.DomHelper.append(this.wrap,{tag:"div",cls:"ext-cal-picker-icon ext-cal-picker-mainicon"})},setValue:function(a){this.wrap.removeClass("ext-color-"+this.getValue());if(!a&&this.store!==undefined){a=this.store.getAt(0).data.CalendarId}Ext.calendar.CalendarPicker.superclass.setValue.call(this,a);this.wrap.addClass("ext-color-"+a)}});Ext.reg("calendarpicker",Ext.calendar.CalendarPicker);Ext.calendar.WeekEventRenderer=function(){var a=function(i,f,e){var h=1,c,b=Ext.get(i+"-wk-"+f);if(b){var g=b.child(".ext-cal-evt-tbl",true);c=g.tBodies[0].childNodes[e+h];if(!c){c=Ext.DomHelper.append(g.tBodies[0],"<tr></tr>")}}return Ext.get(c)};return{render:function(m){var g=0,b=m.eventGrid,k=m.viewStart.clone(),l=m.tpl,q=m.maxEventsPerDay!=undefined?m.maxEventsPerDay:999,s=m.weekCount<1?6:m.weekCount,n=m.weekCount==1?m.dayCount:7,p;for(;g<s;g++){if(!b[g]||b[g].length==0){if(s==1){f=a(m.id,g,0);p={tag:"td",cls:"ext-cal-ev",id:m.id+"-empty-0-day-"+k.format("Ymd"),html:"&nbsp;"};if(n>1){p.colspan=n}Ext.DomHelper.append(f,p)}k=k.add(Date.DAY,7)}else{var f,x=0,c=b[g],z=k.clone(),h=z.add(Date.DAY,n).add(Date.MILLI,-1);for(;x<n;x++){if(c[x]){var v=emptyCells=skipped=0,r=c[x],e=r.length,j;for(;v<e;v++){if(!r[v]){emptyCells++;continue}if(emptyCells>0&&v-emptyCells<q){f=a(m.id,g,v-emptyCells);p={tag:"td",cls:"ext-cal-ev",id:m.id+"-empty-"+e+"-day-"+k.format("Ymd")};if(emptyCells>1&&q-v>emptyCells){p.rowspan=Math.min(emptyCells,q-v)}Ext.DomHelper.append(f,p);emptyCells=0}if(v>=q){skipped++;continue}j=r[v];if(!j.isSpan||j.isSpanStart){var u=j.data||j.event.data;u._weekIndex=g;u._renderAsAllDay=u[Ext.calendar.EventMappings.IsAllDay.name]||j.isSpanStart;u.spanLeft=u[Ext.calendar.EventMappings.StartDate.name].getTime()<z.getTime();u.spanRight=u[Ext.calendar.EventMappings.EndDate.name].getTime()>h.getTime();u.spanCls=(u.spanLeft?(u.spanRight?"ext-cal-ev-spanboth":"ext-cal-ev-spanleft"):(u.spanRight?"ext-cal-ev-spanright":""));f=a(m.id,g,v);p={tag:"td",cls:"ext-cal-ev",cn:l.apply(m.templateDataFn(u))};var i=Ext.calendar.Date.diffDays(k,u[Ext.calendar.EventMappings.EndDate.name])+1,t=Math.min(i,n-x);if(t>1){p.colspan=t}Ext.DomHelper.append(f,p)}}if(v>q){f=a(m.id,g,q);Ext.DomHelper.append(f,{tag:"td",cls:"ext-cal-ev-more",id:"ext-cal-ev-more-"+k.format("Ymd"),cn:{tag:"a",html:"+"+skipped+" more..."}})}if(e<m.evtMaxCount[g]){f=a(m.id,g,e);if(f){p={tag:"td",cls:"ext-cal-ev",id:m.id+"-empty-"+(e+1)+"-day-"+k.format("Ymd")};var y=m.evtMaxCount[g]-e;if(y>1){p.rowspan=y}Ext.DomHelper.append(f,p)}}}else{f=a(m.id,g,0);if(f){p={tag:"td",cls:"ext-cal-ev",id:m.id+"-empty-day-"+k.format("Ymd")};if(m.evtMaxCount[g]>1){p.rowSpan=m.evtMaxCount[g]}Ext.DomHelper.append(f,p)}}k=k.add(Date.DAY,1)}}}}}}();Ext.calendar.CalendarView=Ext.extend(Ext.BoxComponent,{startDay:0,spansHavePriority:false,trackMouseOver:true,enableFx:true,enableAddFx:true,enableUpdateFx:false,enableRemoveFx:true,enableDD:true,monitorResize:true,ddCreateEventText:"Create event for {0}",ddMoveEventText:"Move event to {0}",ddResizeEventText:"Update event to {0}",weekCount:1,dayCount:1,eventSelector:".ext-cal-evt",eventOverClass:"ext-evt-over",eventElIdDelimiter:"-evt-",dayElIdDelimiter:"-day-",getEventBodyMarkup:Ext.emptyFn,getEventTemplate:Ext.emptyFn,initComponent:function(){this.setStartDate(this.startDate||new Date());Ext.calendar.CalendarView.superclass.initComponent.call(this);this.addEvents({eventsrendered:true,eventclick:true,eventover:true,eventout:true,datechange:true,rangeselect:true,eventmove:true,initdrag:true,dayover:true,dayout:true})},afterRender:function(){Ext.calendar.CalendarView.superclass.afterRender.call(this);this.renderTemplate();if(this.store){this.setStore(this.store,true)}this.el.on({mouseover:this.onMouseOver,mouseout:this.onMouseOut,click:this.onClick,resize:this.onResize,scope:this});this.el.unselectable();if(this.enableDD&&this.initDD){this.initDD()}this.on("eventsrendered",this.forceSize);this.forceSize.defer(100,this)},forceSize:function(){if(this.el&&this.el.child){var e=this.el.child(".ext-cal-hd-ct"),b=this.el.child(".ext-cal-body-ct");if(b==null||e==null){return}var a=e.getHeight(),c=this.el.parent().getSize();b.setHeight(c.height-a)}},refresh:function(){this.prepareData();this.renderTemplate();this.renderItems()},getWeekCount:function(){var a=Ext.calendar.Date.diffDays(this.viewStart,this.viewEnd);return Math.ceil(a/this.dayCount)},prepareData:function(){var h=this.startDate.getLastDateOfMonth(),c=0,g=0,f=this.viewStart.clone(),e=this.weekCount<1?6:this.weekCount;this.eventGrid=[[]];this.allDayGrid=[[]];this.evtMaxCount=[];var b=this.store.queryBy(function(i){return this.isEventVisible(i.data)},this);for(;c<e;c++){this.evtMaxCount[c]=0;if(this.weekCount==-1&&f>h){break}this.eventGrid[c]=this.eventGrid[c]||[];this.allDayGrid[c]=this.allDayGrid[c]||[];for(d=0;d<this.dayCount;d++){if(b.getCount()>0){var a=b.filterBy(function(k){var j=(f.getTime()==k.data[Ext.calendar.EventMappings.StartDate.name].clearTime(true).getTime());var i=(c==0&&d==0&&(f>k.data[Ext.calendar.EventMappings.StartDate.name]));return j||i},this);this.sortEventRecordsForDay(a);this.prepareEventGrid(a,c,d)}f=f.add(Date.DAY,1)}}this.currentWeekCount=c},prepareEventGrid:function(c,b,g){var f=0,e=this.viewStart.clone(),a=this.maxEventsPerDay?this.maxEventsPerDay:999;c.each(function(h){var j=Ext.calendar.EventMappings,i=Ext.calendar.Date.diffDays(Ext.calendar.Date.max(this.viewStart,h.data[j.StartDate.name]),Ext.calendar.Date.min(this.viewEnd,h.data[j.EndDate.name]))+1;if(i>1||Ext.calendar.Date.diffDays(h.data[j.StartDate.name],h.data[j.EndDate.name])>1){this.prepareEventGridSpans(h,this.eventGrid,b,g,i);this.prepareEventGridSpans(h,this.allDayGrid,b,g,i,true)}else{f=this.findEmptyRowIndex(b,g);this.eventGrid[b][g]=this.eventGrid[b][g]||[];this.eventGrid[b][g][f]=h;if(h.data[j.IsAllDay.name]){f=this.findEmptyRowIndex(b,g,true);this.allDayGrid[b][g]=this.allDayGrid[b][g]||[];this.allDayGrid[b][g][f]=h}}if(this.evtMaxCount[b]<this.eventGrid[b][g].length){this.evtMaxCount[b]=Math.min(a+1,this.eventGrid[b][g].length)}return true},this)},prepareEventGridSpans:function(i,a,h,g,j,k){var f=h,b=g,l=this.findEmptyRowIndex(h,g,k),e=this.viewStart.clone();var c={event:i,isSpan:true,isSpanStart:true,spanLeft:false,spanRight:(g==6)};a[h][g]=a[h][g]||[];a[h][g][l]=c;while(--j){e=e.add(Date.DAY,1);if(e>this.viewEnd){break}if(++b>6){b=0;f++;l=this.findEmptyRowIndex(f,0)}a[f]=a[f]||[];a[f][b]=a[f][b]||[];a[f][b][l]={event:i,isSpan:true,isSpanStart:(b==0),spanLeft:(f>h)&&(b%7==0),spanRight:(b==6)&&(j>1)}}},findEmptyRowIndex:function(b,h,a){var f=a?this.allDayGrid:this.eventGrid,c=f[b]?f[b][h]||[]:[],e=0,g=c.length;for(;e<g;e++){if(c[e]==null){return e}}return g},renderTemplate:function(){if(this.tpl){this.tpl.overwrite(this.el,this.getParams());this.lastRenderStart=this.viewStart.clone();this.lastRenderEnd=this.viewEnd.clone()}},disableStoreEvents:function(){this.monitorStoreEvents=false},enableStoreEvents:function(a){this.monitorStoreEvents=true;if(a===true){this.refresh()}},onResize:function(){this.refresh()},onInitDrag:function(){this.fireEvent("initdrag",this)},onEventDrop:function(c,a){if(Ext.calendar.Date.compare(c.data[Ext.calendar.EventMappings.StartDate.name],a)===0){return}var b=a.getTime()-c.data[Ext.calendar.EventMappings.StartDate.name].getTime();c.set(Ext.calendar.EventMappings.StartDate.name,a);c.set(Ext.calendar.EventMappings.EndDate.name,c.data[Ext.calendar.EventMappings.EndDate.name].add(Date.MILLI,b));this.fireEvent("eventmove",this,c)},onCalendarEndDrag:function(e,a,b){this.dragPending=true;var c={};c[Ext.calendar.EventMappings.StartDate.name]=e;c[Ext.calendar.EventMappings.EndDate.name]=a;this.fireEvent("rangeselect",this,c,this.onCalendarEndDragComplete.createDelegate(this,[b]))},onCalendarEndDragComplete:function(a){a();this.dragPending=false},onUpdate:function(b,c,a){if(this.monitorStoreEvents===false){return}if(a==Ext.data.Record.COMMIT){this.refresh();if(this.enableFx&&this.enableUpdateFx){this.doUpdateFx(this.getEventEls(c.data[Ext.calendar.EventMappings.EventId.name]),{scope:this})}}},doUpdateFx:function(a,b){this.highlightEvent(a,null,b)},onAdd:function(c,a,b){if(this.monitorStoreEvents===false){return}var e=a[0];this.tempEventId=e.id;this.refresh();if(this.enableFx&&this.enableAddFx){this.doAddFx(this.getEventEls(e.data[Ext.calendar.EventMappings.EventId.name]),{scope:this})}},doAddFx:function(a,b){a.fadeIn(Ext.apply(b,{duration:2}))},onRemove:function(a,b){if(this.monitorStoreEvents===false){return}if(this.enableFx&&this.enableRemoveFx){this.doRemoveFx(this.getEventEls(b.data[Ext.calendar.EventMappings.EventId.name]),{remove:true,scope:this,callback:this.refresh})}else{this.getEventEls(b.data[Ext.calendar.EventMappings.EventId.name]).remove();this.refresh()}},doRemoveFx:function(a,b){a.fadeOut(b)},highlightEvent:function(b,a,e){if(this.enableFx){var f;!(Ext.isIE||Ext.isOpera)?b.highlight(a,e):b.each(function(c){c.highlight(a,Ext.applyIf({attr:"color"},e));f=c.child(".ext-cal-evm");if(f){f.highlight(a,e)}},this)}},getEventIdFromEl:function(a){a=Ext.get(a);var b=a.id.split(this.eventElIdDelimiter)[1];if(b.indexOf("-")>-1){b=b.split("-")[0]}return b},getEventId:function(a){if(a===undefined&&this.tempEventId){a=this.tempEventId}return a},getEventSelectorCls:function(b,a){var c=a?".":"";return c+this.id+this.eventElIdDelimiter+this.getEventId(b)},getEventEls:function(b){var a=Ext.select(this.getEventSelectorCls(this.getEventId(b),true),false,this.el.id);return new Ext.CompositeElement(a)},isToday:function(){var a=new Date().clearTime().getTime();return this.viewStart.getTime()<=a&&this.viewEnd.getTime()>=a},onDataChanged:function(a){this.refresh()},isEventVisible:function(i){var b=this.viewStart.getTime(),e=this.viewEnd.getTime(),g=Ext.calendar.EventMappings,j=(i.data?i.data[g.StartDate.name]:i[g.StartDate.name]).getTime(),h=(i.data?i.data[g.EndDate.name]:i[g.EndDate.name]).add(Date.SECOND,-1).getTime(),c=(j>=b&&j<=e),a=(h>=b&&h<=e),f=(j<b&&h>e);return(c||a||f)},isOverlapping:function(l,k){var j=l.data?l.data:l,i=k.data?k.data:k,g=Ext.calendar.EventMappings,c=j[g.StartDate.name].getTime(),h=j[g.EndDate.name].add(Date.SECOND,-1).getTime(),b=i[g.StartDate.name].getTime(),f=i[g.EndDate.name].add(Date.SECOND,-1).getTime();if(h<c){h=c}if(f<b){f=b}var e=(c>=b&&c<=f),m=(h>=b&&h<=f),a=(c<b&&h>f);return(e||m||a)},getDayEl:function(a){return Ext.get(this.getDayId(a))},getDayId:function(a){if(Ext.isDate(a)){a=a.format("Ymd")}return this.id+this.dayElIdDelimiter+a},getStartDate:function(){return this.startDate},setStartDate:function(b,a){this.startDate=b.clearTime();this.setViewBounds(b);this.store.load({params:{start:this.viewStart.format("m-d-Y"),end:this.viewEnd.format("m-d-Y")}});if(a===true){this.refresh()}this.fireEvent("datechange",this,this.startDate,this.viewStart,this.viewEnd)},setViewBounds:function(a){var e=a||this.startDate,c=e.getDay()-this.startDay;switch(this.weekCount){case 0:case 1:this.viewStart=this.dayCount<7?e:e.add(Date.DAY,-c).clearTime(true);this.viewEnd=this.viewStart.add(Date.DAY,this.dayCount||7).add(Date.SECOND,-1);return;case -1:e=e.getFirstDateOfMonth();c=e.getDay()-this.startDay;this.viewStart=e.add(Date.DAY,-c).clearTime(true);var b=e.add(Date.MONTH,1).add(Date.SECOND,-1);this.viewEnd=b.add(Date.DAY,6-b.getDay());return;default:this.viewStart=e.add(Date.DAY,-c).clearTime(true);this.viewEnd=this.viewStart.add(Date.DAY,this.weekCount*7).add(Date.SECOND,-1)}},getViewBounds:function(){return{start:this.viewStart,end:this.viewEnd}},sortEventRecordsForDay:function(a){if(a.length<2){return}a.sort("ASC",function(g,f){var e=g.data,c=f.data,i=Ext.calendar.EventMappings;if(e[i.IsAllDay.name]){return -1}else{if(c[i.IsAllDay.name]){return 1}}if(this.spansHavePriority){var h=Ext.calendar.Date.diffDays;if(h(e[i.StartDate.name],e[i.EndDate.name])>0){if(h(c[i.StartDate.name],c[i.EndDate.name])>0){if(e[i.StartDate.name].getTime()==c[i.StartDate.name].getTime()){return c[i.EndDate.name].getTime()-e[i.EndDate.name].getTime()}return e[i.StartDate.name].getTime()-c[i.StartDate.name].getTime()}return -1}else{if(h(c[i.StartDate.name],c[i.EndDate.name])>0){return 1}}return e[i.StartDate.name].getTime()-c[i.StartDate.name].getTime()}else{return e[i.StartDate.name].getTime()-c[i.StartDate.name].getTime()}}.createDelegate(this))},moveTo:function(b,a){if(Ext.isDate(b)){this.setStartDate(b);if(a!==false){this.refresh()}return this.startDate}return b},moveNext:function(a){return this.moveTo(this.viewEnd.add(Date.DAY,1))},movePrev:function(a){var b=Ext.calendar.Date.diffDays(this.viewStart,this.viewEnd)+1;return this.moveDays(-b,a)},moveMonths:function(b,a){return this.moveTo(this.startDate.add(Date.MONTH,b),a)},moveWeeks:function(b,a){return this.moveTo(this.startDate.add(Date.DAY,b*7),a)},moveDays:function(b,a){return this.moveTo(this.startDate.add(Date.DAY,b),a)},moveToday:function(a){return this.moveTo(new Date(),a)},setStore:function(a,b){if(!b&&this.store){this.store.un("datachanged",this.onDataChanged,this);this.store.un("add",this.onAdd,this);this.store.un("remove",this.onRemove,this);this.store.un("update",this.onUpdate,this);this.store.un("clear",this.refresh,this)}if(a){a.on("datachanged",this.onDataChanged,this);a.on("add",this.onAdd,this);a.on("remove",this.onRemove,this);a.on("update",this.onUpdate,this);a.on("clear",this.refresh,this)}this.store=a;if(a&&a.getCount()>0){this.refresh()}},getEventRecord:function(b){var a=this.store.find(Ext.calendar.EventMappings.EventId.name,b);return this.store.getAt(a)},getEventRecordFromEl:function(a){return this.getEventRecord(this.getEventIdFromEl(a))},getParams:function(){return{viewStart:this.viewStart,viewEnd:this.viewEnd,startDate:this.startDate,dayCount:this.dayCount,weekCount:this.weekCount,title:this.getTitle()}},getTitle:function(){return this.startDate.format("F Y")},onClick:function(c,a){var b=c.getTarget(this.eventSelector,5);if(b){var f=this.getEventIdFromEl(b);this.fireEvent("eventclick",this,this.getEventRecord(f),b);return true}},onMouseOver:function(b,a){if(this.trackMouseOver!==false&&(this.dragZone==undefined||!this.dragZone.dragging)){if(!this.handleEventMouseEvent(b,a,"over")){this.handleDayMouseEvent(b,a,"over")}}},onMouseOut:function(b,a){if(this.trackMouseOver!==false&&(this.dragZone==undefined||!this.dragZone.dragging)){if(!this.handleEventMouseEvent(b,a,"out")){this.handleDayMouseEvent(b,a,"out")}}},handleEventMouseEvent:function(h,c,g){var f=h.getTarget(this.eventSelector,5,true),a,b,i;if(f){a=Ext.get(h.getRelatedTarget());if(f==a||f.contains(a)){return true}i=this.getEventIdFromEl(f);if(this.eventOverClass!=""){b=this.getEventEls(i);b[g=="over"?"addClass":"removeClass"](this.eventOverClass)}this.fireEvent("event"+g,this,this.getEventRecord(i),f);return true}return false},getDateFromId:function(c,b){var a=c.split(b);return a[a.length-1]},handleDayMouseEvent:function(j,f,h){f=j.getTarget("td",3);if(f){if(f.id&&f.id.indexOf(this.dayElIdDelimiter)>-1){var i=this.getDateFromId(f.id,this.dayElIdDelimiter),a=Ext.get(j.getRelatedTarget()),c,b;if(a){c=a.is("td")?a:a.up("td",3);b=c&&c.id?this.getDateFromId(c.id,this.dayElIdDelimiter):""}if(!a||i!=b){var g=this.getDayEl(i);if(g&&this.dayOverClass!=""){g[h=="over"?"addClass":"removeClass"](this.dayOverClass)}this.fireEvent("day"+h,this,Date.parseDate(i,"Ymd"),g)}}}},renderItems:function(){throw"This method must be implemented by a subclass"}});Ext.calendar.MonthView=Ext.extend(Ext.calendar.CalendarView,{showTime:true,showTodayText:true,todayText:"Today",showHeader:false,showWeekLinks:false,showWeekNumbers:false,weekLinkOverClass:"ext-week-link-over",daySelector:".ext-cal-day",moreSelector:".ext-cal-ev-more",weekLinkSelector:".ext-cal-week-link",weekCount:-1,dayCount:7,moreElIdDelimiter:"-more-",weekLinkIdDelimiter:"ext-cal-week-",initComponent:function(){Ext.calendar.MonthView.superclass.initComponent.call(this);this.addEvents({dayclick:true,weekclick:true,dayover:true,dayout:true})},initDD:function(){var a={view:this,createText:this.ddCreateEventText,moveText:this.ddMoveEventText,ddGroup:"MonthViewDD"};this.dragZone=new Ext.calendar.DragZone(this.el,a);this.dropZone=new Ext.calendar.DropZone(this.el,a)},onDestroy:function(){Ext.destroy(this.ddSelector);Ext.destroy(this.dragZone);Ext.destroy(this.dropZone);Ext.calendar.MonthView.superclass.onDestroy.call(this)},afterRender:function(){if(!this.tpl){this.tpl=new Ext.calendar.MonthViewTemplate({id:this.id,showTodayText:this.showTodayText,todayText:this.todayText,showTime:this.showTime,showHeader:this.showHeader,showWeekLinks:this.showWeekLinks,showWeekNumbers:this.showWeekNumbers})}this.tpl.compile();this.addClass("ext-cal-monthview ext-cal-ct");Ext.calendar.MonthView.superclass.afterRender.call(this)},onResize:function(){if(this.monitorResize){this.maxEventsPerDay=this.getMaxEventsPerDay();this.refresh()}},forceSize:function(){if(this.showWeekLinks&&this.el&&this.el.child){var f=this.el.select(".ext-cal-hd-days-tbl"),e=this.el.select(".ext-cal-bg-tbl"),c=this.el.select(".ext-cal-evt-tbl"),b=this.el.child(".ext-cal-week-link").getWidth(),a=this.el.getWidth()-b;f.setWidth(a);e.setWidth(a);c.setWidth(a)}Ext.calendar.MonthView.superclass.forceSize.call(this)},initClock:function(){if(Ext.fly(this.id+"-clock")!==null){this.prevClockDay=new Date().getDay();if(this.clockTask){Ext.TaskMgr.stop(this.clockTask)}this.clockTask=Ext.TaskMgr.start({run:function(){var b=Ext.fly(this.id+"-clock"),a=new Date();if(a.getDay()==this.prevClockDay){if(b){b.update(a.format("g:i a"))}}else{this.prevClockDay=a.getDay();this.moveTo(a)}},scope:this,interval:1000})}},getEventBodyMarkup:function(){if(!this.eventBodyMarkup){this.eventBodyMarkup=["{Title}",'<tpl if="_isReminder">','<i class="ext-cal-ic ext-cal-ic-rem">&nbsp;</i>',"</tpl>",'<tpl if="_isRecurring">','<i class="ext-cal-ic ext-cal-ic-rcr">&nbsp;</i>',"</tpl>",'<tpl if="spanLeft">','<i class="ext-cal-spl">&nbsp;</i>',"</tpl>",'<tpl if="spanRight">','<i class="ext-cal-spr">&nbsp;</i>',"</tpl>"].join("")}return this.eventBodyMarkup},getEventTemplate:function(){if(!this.eventTpl){var b,a=this.getEventBodyMarkup();b=!(Ext.isIE||Ext.isOpera)?new Ext.XTemplate('<div id="{_elId}" class="{_selectorCls} {_colorCls} {values.spanCls} ext-cal-evt ext-cal-evr">',a,"</div>"):new Ext.XTemplate('<tpl if="_renderAsAllDay">','<div id="{_elId}" class="{_selectorCls} {values.spanCls} {_colorCls} ext-cal-evt ext-cal-evo">','<div class="ext-cal-evm">','<div class="ext-cal-evi">',"</tpl>",'<tpl if="!_renderAsAllDay">','<div id="{_elId}" class="{_selectorCls} {_colorCls} ext-cal-evt ext-cal-evr">',"</tpl>",a,'<tpl if="_renderAsAllDay">',"</div>","</div>","</tpl>","</div>");b.compile();this.eventTpl=b}return this.eventTpl},getTemplateEventData:function(b){var e=Ext.calendar.EventMappings,a=this.getEventSelectorCls(b[e.EventId.name]),c=b[e.Title.name];return Ext.applyIf({_selectorCls:a,_colorCls:"ext-color-"+(b[e.CalendarId.name]?b[e.CalendarId.name]:"default")+(b._renderAsAllDay?"-ad":""),_elId:a+"-"+b._weekIndex,_isRecurring:b.Recurrence&&b.Recurrence!="",_isReminder:b[e.Reminder.name]&&b[e.Reminder.name]!="",Title:(b[e.IsAllDay.name]?"":b[e.StartDate.name].format("g:ia "))+(!c||c.length==0?"(No title)":c)},b)},refresh:function(){if(this.detailPanel){this.detailPanel.hide()}Ext.calendar.MonthView.superclass.refresh.call(this);if(this.showTime!==false){this.initClock()}},renderItems:function(){Ext.calendar.WeekEventRenderer.render({eventGrid:this.allDayOnly?this.allDayGrid:this.eventGrid,viewStart:this.viewStart,tpl:this.getEventTemplate(),maxEventsPerDay:this.maxEventsPerDay,id:this.id,templateDataFn:this.getTemplateEventData.createDelegate(this),evtMaxCount:this.evtMaxCount,weekCount:this.weekCount,dayCount:this.dayCount});this.fireEvent("eventsrendered",this)},getDayEl:function(a){return Ext.get(this.getDayId(a))},getDayId:function(a){if(Ext.isDate(a)){a=a.format("Ymd")}return this.id+this.dayElIdDelimiter+a},getWeekIndex:function(b){var a=this.getDayEl(b).up(".ext-cal-wk-ct");return parseInt(a.id.split("-wk-")[1],10)},getDaySize:function(f){var c=this.el.getBox(),a=c.width/this.dayCount,b=c.height/this.getWeekCount();if(f){var e=this.el.select(".ext-cal-dtitle").first().parent("tr");b=e?b-e.getHeight(true):b}return{height:b,width:a}},getEventHeight:function(){if(!this.eventHeight){var a=this.el.select(".ext-cal-evt").first();this.eventHeight=a?a.parent("tr").getHeight():18}return this.eventHeight},getMaxEventsPerDay:function(){var b=this.getDaySize(true).height,c=this.getEventHeight(),a=Math.max(Math.floor((b-c)/c),0);return a},getDayAt:function(a,i){var f=this.el.getBox(),b=this.getDaySize(),c=Math.floor(((a-f.x)/b.width)),g=Math.floor(((i-f.y)/b.height)),h=(g*7)+c,e=this.viewStart.add(Date.DAY,h);return{date:e,el:this.getDayEl(e)}},moveNext:function(){return this.moveMonths(1)},movePrev:function(){return this.moveMonths(-1)},onInitDrag:function(){Ext.calendar.MonthView.superclass.onInitDrag.call(this);Ext.select(this.daySelector).removeClass(this.dayOverClass);if(this.detailPanel){this.detailPanel.hide()}},onMoreClick:function(a){if(!this.detailPanel){this.detailPanel=new Ext.Panel({id:this.id+"-details-panel",title:a.format("F j"),layout:"fit",floating:true,renderTo:Ext.getBody(),tools:[{id:"close",handler:function(f,b,c){c.hide()}}],items:{xtype:"monthdaydetailview",id:this.id+"-details-view",date:a,view:this,store:this.store,listeners:{eventsrendered:this.onDetailViewUpdated.createDelegate(this)}}})}else{this.detailPanel.setTitle(a.format("F j"))}this.detailPanel.getComponent(this.id+"-details-view").update(a)},onDetailViewUpdated:function(h,c,i){var b=this.detailPanel,f=b.getFrameHeight(),j=this.getEventHeight(),a=f+(i*j)+3,g=this.getDayEl(c),e=g.getBox();b.updateBox(e);b.setHeight(a);b.setWidth(Math.max(e.width,220));b.show();b.getPositionEl().alignTo(g,"t-t?")},onHide:function(){Ext.calendar.MonthView.superclass.onHide.call(this);if(this.detailPanel){this.detailPanel.hide()}},onClick:function(g,a){if(this.detailPanel){this.detailPanel.hide()}if(Ext.calendar.MonthView.superclass.onClick.apply(this,arguments)){return}if(this.dropZone){this.dropZone.clearShims()}var b=g.getTarget(this.weekLinkSelector,3),c,f;if(b){c=b.id.split(this.weekLinkIdDelimiter)[1];this.fireEvent("weekclick",this,Date.parseDate(c,"Ymd"));return}b=g.getTarget(this.moreSelector,3);if(b){c=b.id.split(this.moreElIdDelimiter)[1];this.onMoreClick(Date.parseDate(c,"Ymd"));return}b=g.getTarget("td",3);if(b){if(b.id&&b.id.indexOf(this.dayElIdDelimiter)>-1){f=b.id.split(this.dayElIdDelimiter);c=f[f.length-1];this.fireEvent("dayclick",this,Date.parseDate(c,"Ymd"),false,Ext.get(this.getDayId(c)));return}}},handleDayMouseEvent:function(f,a,c){var b=f.getTarget(this.weekLinkSelector,3,true);if(b){b[c=="over"?"addClass":"removeClass"](this.weekLinkOverClass);return}Ext.calendar.MonthView.superclass.handleDayMouseEvent.apply(this,arguments)}});Ext.reg("monthview",Ext.calendar.MonthView);Ext.calendar.DayHeaderView=Ext.extend(Ext.calendar.MonthView,{weekCount:1,dayCount:1,allDayOnly:true,monitorResize:false,afterRender:function(){if(!this.tpl){this.tpl=new Ext.calendar.DayHeaderTemplate({id:this.id,showTodayText:this.showTodayText,todayText:this.todayText,showTime:this.showTime})}this.tpl.compile();this.addClass("ext-cal-day-header");Ext.calendar.DayHeaderView.superclass.afterRender.call(this)},forceSize:Ext.emptyFn,refresh:function(){Ext.calendar.DayHeaderView.superclass.refresh.call(this);this.recalcHeaderBox()},recalcHeaderBox:function(){var b=this.el.child(".ext-cal-evt-tbl"),a=b.getHeight();this.el.setHeight(a+7);if(Ext.isIE&&Ext.isStrict){this.el.child(".ext-cal-hd-ad-inner").setHeight(a+4)}if(Ext.isOpera){}},moveNext:function(a){this.moveDays(this.dayCount,a)},movePrev:function(a){this.moveDays(-this.dayCount,a)},onClick:function(g,a){var b=g.getTarget("td",3),f,c;if(b){if(b.id&&b.id.indexOf(this.dayElIdDelimiter)>-1){f=b.id.split(this.dayElIdDelimiter);c=f[f.length-1];this.fireEvent("dayclick",this,Date.parseDate(c,"Ymd"),true,Ext.get(this.getDayId(c)));return}}Ext.calendar.DayHeaderView.superclass.onClick.apply(this,arguments)}});Ext.reg("dayheaderview",Ext.calendar.DayHeaderView);Ext.calendar.DayBodyView=Ext.extend(Ext.calendar.CalendarView,{dayColumnElIdDelimiter:"-day-col-",initComponent:function(){Ext.calendar.DayBodyView.superclass.initComponent.call(this);this.addEvents({eventresize:true,dayclick:true})},initDD:function(){var a={createText:this.ddCreateEventText,moveText:this.ddMoveEventText,resizeText:this.ddResizeEventText};this.el.ddScrollConfig={vthresh:Ext.isIE||Ext.isOpera?100:40,hthresh:-1,frequency:50,increment:100,ddGroup:"DayViewDD"};this.dragZone=new Ext.calendar.DayViewDragZone(this.el,Ext.apply({view:this,containerScroll:true},a));this.dropZone=new Ext.calendar.DayViewDropZone(this.el,Ext.apply({view:this},a))},refresh:function(){var a=this.el.getScroll().top;this.prepareData();this.renderTemplate();this.renderItems();if(this.scrollReady){this.scrollTo(a)}},scrollTo:function(b,a){a=a||(Ext.isIE||Ext.isOpera);if(a){(function(){this.el.scrollTo("top",b);this.scrollReady=true}).defer(10,this)}else{this.el.scrollTo("top",b);this.scrollReady=true}},afterRender:function(){if(!this.tpl){this.tpl=new Ext.calendar.DayBodyTemplate({id:this.id,dayCount:this.dayCount,showTodayText:this.showTodayText,todayText:this.todayText,showTime:this.showTime})}this.tpl.compile();this.addClass("ext-cal-body-ct");Ext.calendar.DayBodyView.superclass.afterRender.call(this);this.scrollTo(7*42)},forceSize:Ext.emptyFn,onEventResize:function(e,b){var c=Ext.calendar.Date,f=Ext.calendar.EventMappings.StartDate.name,a=Ext.calendar.EventMappings.EndDate.name;if(c.compare(e.data[f],b.StartDate)===0&&c.compare(e.data[a],b.EndDate)===0){return}e.set(f,b.StartDate);e.set(a,b.EndDate);this.fireEvent("eventresize",this,e)},getEventBodyMarkup:function(){if(!this.eventBodyMarkup){this.eventBodyMarkup=["{Title}",'<tpl if="_isReminder">','<i class="ext-cal-ic ext-cal-ic-rem">&nbsp;</i>',"</tpl>",'<tpl if="_isRecurring">','<i class="ext-cal-ic ext-cal-ic-rcr">&nbsp;</i>',"</tpl>"].join("")}return this.eventBodyMarkup},getEventTemplate:function(){if(!this.eventTpl){this.eventTpl=!(Ext.isIE||Ext.isOpera)?new Ext.XTemplate('<div id="{_elId}" class="{_selectorCls} {_colorCls} ext-cal-evt ext-cal-evr" style="left: {_left}%; width: {_width}%; top: {_top}px; height: {_height}px;">','<div class="ext-evt-bd">',this.getEventBodyMarkup(),"</div>",'<div class="ext-evt-rsz"><div class="ext-evt-rsz-h">&nbsp;</div></div>',"</div>"):new Ext.XTemplate('<div id="{_elId}" class="ext-cal-evt {_selectorCls} {_colorCls}-x" style="left: {_left}%; width: {_width}%; top: {_top}px;">','<div class="ext-cal-evb">&nbsp;</div>','<dl style="height: {_height}px;" class="ext-cal-evdm">','<dd class="ext-evt-bd">',this.getEventBodyMarkup(),"</dd>",'<div class="ext-evt-rsz"><div class="ext-evt-rsz-h">&nbsp;</div></div>',"</dl>",'<div class="ext-cal-evb">&nbsp;</div>',"</div>");this.eventTpl.compile()}return this.eventTpl},getEventAllDayTemplate:function(){if(!this.eventAllDayTpl){var b,a=this.getEventBodyMarkup();b=!(Ext.isIE||Ext.isOpera)?new Ext.XTemplate('<div id="{_elId}" class="{_selectorCls} {_colorCls} {values.spanCls} ext-cal-evt ext-cal-evr" style="left: {_left}%; width: {_width}%; top: {_top}px; height: {_height}px;">',a,"</div>"):new Ext.XTemplate('<div id="{_elId}" class="ext-cal-evt" style="left: {_left}%; width: {_width}%; top: {_top}px; height: {_height}px;">','<div class="{_selectorCls} {values.spanCls} {_colorCls} ext-cal-evo">','<div class="ext-cal-evm">','<div class="ext-cal-evi">',a,"</div>","</div>","</div></div>");b.compile();this.eventAllDayTpl=b}return this.eventAllDayTpl},getTemplateEventData:function(b){var a=this.getEventSelectorCls(b[Ext.calendar.EventMappings.EventId.name]),c={},f=Ext.calendar.EventMappings;this.getTemplateEventBox(b);c._selectorCls=a;c._colorCls="ext-color-"+b[f.CalendarId.name]+(b._renderAsAllDay?"-ad":"");c._elId=a+(b._weekIndex?"-"+b._weekIndex:"");c._isRecurring=b.Recurrence&&b.Recurrence!="";c._isReminder=b[f.Reminder.name]&&b[f.Reminder.name]!="";var e=b[f.Title.name];c.Title=(b[f.IsAllDay.name]?"":b[f.StartDate.name].format("g:ia "))+(!e||e.length==0?"(No title)":e);return Ext.applyIf(c,b)},getTemplateEventBox:function(c){var g=0.7,h=c[Ext.calendar.EventMappings.StartDate.name],b=c[Ext.calendar.EventMappings.EndDate.name],f=h.getHours()*60+h.getMinutes(),a=b.getHours()*60+b.getMinutes(),e=a-f;c._left=0;c._width=100;c._top=Math.round(f*g)+1;c._height=Math.max((e*g)-2,15)},renderItems:function(){var p=0,s=[],o,n,k,r,h,e,b,a,c,g,f,q,m;for(;p<this.dayCount;p++){o=emptyCells=skipped=0;n=this.eventGrid[0][p];k=n?n.length:0;for(;o<k;o++){evt=n[o];if(!evt){continue}r=evt.data||evt.event.data;if(r._renderAsAllDay){continue}Ext.apply(r,{cls:"ext-cal-ev",_positioned:true});s.push({data:this.getTemplateEventData(r),date:this.viewStart.add(Date.DAY,p)})}}h=e=a=c=0;b=s.length;for(;h<b;h++){evt=s[h].data;evt2=null;c=a;for(e=0;e<b;e++){if(h==e){continue}evt2=s[e].data;if(this.isOverlapping(evt,evt2)){evt._overlap=evt._overlap==undefined?1:evt._overlap+1;if(h<e){if(evt._overcol===undefined){evt._overcol=0}evt2._overcol=evt._overcol+1;a=Math.max(a,evt2._overcol)}}}}for(h=0;h<b;h++){evt=s[h].data;if(evt._overlap!==undefined){g=100/(a+1);f=100-(g*evt._overlap);evt._width=g;evt._left=g*evt._overcol}q=this.getEventTemplate().apply(evt);m=this.id+"-day-col-"+s[h].date.format("Ymd");Ext.DomHelper.append(m,q)}this.fireEvent("eventsrendered",this)},getDayEl:function(a){return Ext.get(this.getDayId(a))},getDayId:function(a){if(Ext.isDate(a)){a=a.format("Ymd")}return this.id+this.dayColumnElIdDelimiter+a},getDaySize:function(){var a=this.el.child(".ext-cal-day-col-inner").getBox();return{height:a.height,width:a.width}},getDayAt:function(n,j){var f=".ext-cal-body-ct",h=this.el.child(".ext-cal-day-times").getWidth(),r=this.el.getBox(),m=this.getDaySize(false),o=n-r.x-h,a=Math.floor(o/m.width),l=this.el.getScroll(),q=this.el.child(".ext-cal-bg-row"),p=q.getHeight()/2,k=j-r.y-p+l.top,i=Math.max(0,Math.ceil(k/p)),b=i*30,e=this.viewStart.add(Date.DAY,a).add(Date.MINUTE,b),c=this.getDayEl(e),g=n;if(c){g=c.getLeft()}return{date:e,el:c,timeBox:{x:g,y:(i*21)+r.y-l.top,width:m.width,height:p}}},onClick:function(g,b){if(this.dragPending||Ext.calendar.DayBodyView.superclass.onClick.apply(this,arguments)){return}if(g.getTarget(".ext-cal-day-times",3)!==null){return}var c=g.getTarget("td",3);if(c){if(c.id&&c.id.indexOf(this.dayElIdDelimiter)>-1){var f=this.getDateFromId(c.id,this.dayElIdDelimiter);this.fireEvent("dayclick",this,Date.parseDate(f,"Ymd"),true,Ext.get(this.getDayId(f,true)));return}}var a=this.getDayAt(g.xy[0],g.xy[1]);if(a&&a.date){this.fireEvent("dayclick",this,a.date,false,null)}}});Ext.reg("daybodyview",Ext.calendar.DayBodyView);Ext.calendar.DayView=Ext.extend(Ext.Container,{showTime:true,showTodayText:true,todayText:"Today",ddCreateEventText:"Create event for {0}",ddMoveEventText:"Move event to {0}",dayCount:1,initComponent:function(){this.dayCount=this.dayCount>7?7:this.dayCount;var b=Ext.apply({},this.initialConfig);b.showTime=this.showTime;b.showTodatText=this.showTodayText;b.todayText=this.todayText;b.dayCount=this.dayCount;b.wekkCount=1;var c=Ext.applyIf({xtype:"dayheaderview",id:this.id+"-hd"},b);var a=Ext.applyIf({xtype:"daybodyview",id:this.id+"-bd"},b);this.items=[c,a];this.addClass("ext-cal-dayview ext-cal-ct");Ext.calendar.DayView.superclass.initComponent.call(this)},afterRender:function(){Ext.calendar.DayView.superclass.afterRender.call(this);this.header=Ext.getCmp(this.id+"-hd");this.body=Ext.getCmp(this.id+"-bd");this.body.on("eventsrendered",this.forceSize,this)},refresh:function(){this.header.refresh();this.body.refresh()},forceSize:function(){(function(){var a=this.el.up(".x-panel-body"),c=this.el.child(".ext-cal-day-header"),b=a.getHeight()-c.getHeight();this.el.child(".ext-cal-body-ct").setHeight(b)}).defer(10,this)},onResize:function(){this.forceSize()},getViewBounds:function(){return this.header.getViewBounds()},getStartDate:function(){return this.header.getStartDate()},setStartDate:function(a){this.header.setStartDate(a,true);this.body.setStartDate(a,true)},renderItems:function(){this.header.renderItems();this.body.renderItems()},isToday:function(){return this.header.isToday()},moveTo:function(b,a){this.header.moveTo(b,a);this.body.moveTo(b,a)},moveNext:function(a){this.header.moveNext(a);this.body.moveNext(a)},movePrev:function(a){this.header.movePrev(a);this.body.movePrev(a)},moveDays:function(b,a){this.header.moveDays(b,a);this.body.moveDays(b,a)},moveToday:function(a){this.header.moveToday(a);this.body.moveToday(a)}});Ext.reg("dayview",Ext.calendar.DayView);Ext.calendar.WeekView=Ext.extend(Ext.calendar.DayView,{dayCount:7});Ext.reg("weekview",Ext.calendar.WeekView);Ext.calendar.DateRangeField=Ext.extend(Ext.form.Field,{toText:"to",allDayText:"All day",onRender:function(b,a){if(!this.el){this.startDate=new Ext.form.DateField({id:this.id+"-start-date",format:"n/j/Y",width:100,listeners:{change:{fn:function(){this.checkDates("date","start")},scope:this}}});this.startTime=new Ext.form.TimeField({id:this.id+"-start-time",hidden:this.showTimes===false,labelWidth:0,hideLabel:true,width:90,listeners:{select:{fn:function(){this.checkDates("time","start")},scope:this}}});this.endTime=new Ext.form.TimeField({id:this.id+"-end-time",hidden:this.showTimes===false,labelWidth:0,hideLabel:true,width:90,listeners:{select:{fn:function(){this.checkDates("time","end")},scope:this}}});this.endDate=new Ext.form.DateField({id:this.id+"-end-date",format:"n/j/Y",hideLabel:true,width:100,listeners:{change:{fn:function(){this.checkDates("date","end")},scope:this}}});this.allDay=new Ext.form.Checkbox({id:this.id+"-allday",hidden:this.showTimes===false||this.showAllDay===false,boxLabel:this.allDayText,handler:function(c,e){this.startTime.setVisible(!e);this.endTime.setVisible(!e)},scope:this});this.toLabel=new Ext.form.Label({xtype:"label",id:this.id+"-to-label",text:this.toText});this.fieldCt=new Ext.Container({autoEl:{id:this.id},cls:"ext-dt-range",renderTo:b,layout:"table",layoutConfig:{columns:6},defaults:{hideParent:true},items:[this.startDate,this.startTime,this.toLabel,this.endTime,this.endDate,this.allDay]});this.fieldCt.ownerCt=this;this.el=this.fieldCt.getEl();this.items=new Ext.util.MixedCollection();this.items.addAll([this.startDate,this.endDate,this.toLabel,this.startTime,this.endTime,this.allDay])}Ext.calendar.DateRangeField.superclass.onRender.call(this,b,a)},checkDates:function(f,g){var e=Ext.getCmp(this.id+"-start-"+f),b=Ext.getCmp(this.id+"-end-"+f),c=this.getDT("start"),a=this.getDT("end");if(c>a){if(g=="start"){b.setValue(c)}else{e.setValue(a);this.checkDates(f,"start")}}if(f=="date"){this.checkDates("time",g)}},getValue:function(){return[this.getDT("start"),this.getDT("end"),this.allDay.getValue()]},getDT:function(c){var b=this[c+"Time"].getValue(),a=this[c+"Date"].getValue();if(Ext.isDate(a)){a=a.format(this[c+"Date"].format)}else{return null}if(b!=""&&this[c+"Time"].isVisible()){return Date.parseDate(a+" "+b,this[c+"Date"].format+" "+this[c+"Time"].format)}return Date.parseDate(a,this[c+"Date"].format)},setValue:function(a){if(Ext.isArray(a)){this.setDT(a[0],"start");this.setDT(a[1],"end");this.allDay.setValue(!!a[2])}else{if(Ext.isDate(a)){this.setDT(a,"start");this.setDT(a,"end");this.allDay.setValue(false)}else{if(a[Ext.calendar.EventMappings.StartDate.name]){this.setDT(a[Ext.calendar.EventMappings.StartDate.name],"start");if(!this.setDT(a[Ext.calendar.EventMappings.EndDate.name],"end")){this.setDT(a[Ext.calendar.EventMappings.StartDate.name],"end")}this.allDay.setValue(!!a[Ext.calendar.EventMappings.IsAllDay.name])}}}},setDT:function(a,b){if(a&&Ext.isDate(a)){this[b+"Date"].setValue(a);this[b+"Time"].setValue(a.format(this[b+"Time"].format));return true}},isDirty:function(){var a=false;if(this.rendered&&!this.disabled){this.items.each(function(b){if(b.isDirty()){a=true;return false}})}return a},onDisable:function(){this.delegateFn("disable")},onEnable:function(){this.delegateFn("enable")},reset:function(){this.delegateFn("reset")},delegateFn:function(a){this.items.each(function(b){if(b[a]){b[a]()}})},beforeDestroy:function(){Ext.destroy(this.fieldCt);Ext.calendar.DateRangeField.superclass.beforeDestroy.call(this)},getRawValue:Ext.emptyFn,setRawValue:Ext.emptyFn});Ext.reg("daterangefield",Ext.calendar.DateRangeField);Ext.calendar.ReminderField=Ext.extend(Ext.form.ComboBox,{width:200,fieldLabel:"Reminder",mode:"local",triggerAction:"all",forceSelection:true,displayField:"desc",valueField:"value",initComponent:function(){Ext.calendar.ReminderField.superclass.initComponent.call(this);this.store=this.store||new Ext.data.ArrayStore({fields:["value","desc"],idIndex:0,data:[["","None"],["0","At start time"],["5","5 minutes before start"],["15","15 minutes before start"],["30","30 minutes before start"],["60","1 hour before start"],["90","1.5 hours before start"],["120","2 hours before start"],["180","3 hours before start"],["360","6 hours before start"],["720","12 hours before start"],["1440","1 day before start"],["2880","2 days before start"],["4320","3 days before start"],["5760","4 days before start"],["7200","5 days before start"],["10080","1 week before start"],["20160","2 weeks before start"]]})},initValue:function(){if(this.value!==undefined){this.setValue(this.value)}else{this.setValue("")}this.originalValue=this.getValue()}});Ext.reg("reminderfield",Ext.calendar.ReminderField);Ext.calendar.EventEditForm=Ext.extend(Ext.form.FormPanel,{labelWidth:65,title:"Event Form",titleTextAdd:"Add Event",titleTextEdit:"Edit Event",bodyStyle:"background:transparent;padding:20px 20px 10px;",border:false,buttonAlign:"center",autoHeight:true,cls:"ext-evt-edit-form",newId:10000,layout:"column",initComponent:function(){this.addEvents({eventadd:true,eventupdate:true,eventdelete:true,eventcancel:true});this.titleField=new Ext.form.TextField({fieldLabel:"Title",name:Ext.calendar.EventMappings.Title.name,anchor:"90%"});this.dateRangeField=new Ext.calendar.DateRangeField({fieldLabel:"When",anchor:"90%"});this.reminderField=new Ext.calendar.ReminderField({name:"Reminder"});this.notesField=new Ext.form.TextArea({fieldLabel:"Notes",name:Ext.calendar.EventMappings.Notes.name,grow:true,growMax:150,anchor:"100%"});this.locationField=new Ext.form.TextField({fieldLabel:"Location",name:Ext.calendar.EventMappings.Location.name,anchor:"100%"});this.urlField=new Ext.form.TextField({fieldLabel:"Web Link",name:Ext.calendar.EventMappings.Url.name,anchor:"100%"});var a=[this.titleField,this.dateRangeField,this.reminderField],b=[this.notesField,this.locationField,this.urlField];if(this.calendarStore){this.calendarField=new Ext.calendar.CalendarPicker({store:this.calendarStore,name:Ext.calendar.EventMappings.CalendarId.name});a.splice(2,0,this.calendarField)}this.items=[{id:"left-col",columnWidth:0.65,layout:"form",border:false,items:a},{id:"right-col",columnWidth:0.35,layout:"form",border:false,items:b}];this.fbar=[{text:"Save",scope:this,handler:this.onSave},{cls:"ext-del-btn",text:"Delete",scope:this,handler:this.onDelete},{text:"Cancel",scope:this,handler:this.onCancel}];Ext.calendar.EventEditForm.superclass.initComponent.call(this)},loadRecord:function(a){this.form.loadRecord.apply(this.form,arguments);this.activeRecord=a;this.dateRangeField.setValue(a.data);if(this.calendarStore){this.form.setValues({calendar:a.data[Ext.calendar.EventMappings.CalendarId.name]})}this.isAdd=!!a.data[Ext.calendar.EventMappings.IsNew.name];if(this.isAdd){a.markDirty();this.setTitle(this.titleTextAdd);Ext.select(".ext-del-btn").setDisplayed(false)}else{this.setTitle(this.titleTextEdit);Ext.select(".ext-del-btn").setDisplayed(true)}this.titleField.focus()},updateRecord:function(){var a=this.dateRangeField.getValue();this.form.updateRecord(this.activeRecord);this.activeRecord.set(Ext.calendar.EventMappings.StartDate.name,a[0]);this.activeRecord.set(Ext.calendar.EventMappings.EndDate.name,a[1]);this.activeRecord.set(Ext.calendar.EventMappings.IsAllDay.name,a[2])},onCancel:function(){this.cleanup(true);this.fireEvent("eventcancel",this,this.activeRecord)},cleanup:function(a){if(this.activeRecord&&this.activeRecord.dirty){this.activeRecord.reject()}delete this.activeRecord;if(this.form.isDirty()){this.form.reset()}},onSave:function(){if(!this.form.isValid()){return}this.updateRecord();if(!this.activeRecord.dirty){this.onCancel();return}this.fireEvent(this.isAdd?"eventadd":"eventupdate",this,this.activeRecord)},onDelete:function(){this.fireEvent("eventdelete",this,this.activeRecord)}});Ext.reg("eventeditform",Ext.calendar.EventEditForm);Ext.calendar.EventEditWindow=function(b){var a={xtype:"form",labelWidth:65,frame:false,bodyStyle:"background:transparent;padding:5px 10px 10px;",bodyBorder:false,border:false,items:[{id:"title",name:Ext.calendar.EventMappings.Title.name,fieldLabel:"Title",xtype:"textfield",anchor:"100%"},{xtype:"daterangefield",id:"date-range",anchor:"100%",fieldLabel:"When"}]};if(b.calendarStore){this.calendarStore=b.calendarStore;delete b.calendarStore;a.items.push({xtype:"calendarpicker",id:"calendar",name:"calendar",anchor:"100%",store:this.calendarStore})}Ext.calendar.EventEditWindow.superclass.constructor.call(this,Ext.apply({titleTextAdd:"Add Event",titleTextEdit:"Edit Event",width:600,autocreate:true,border:true,closeAction:"hide",modal:false,resizable:false,buttonAlign:"left",savingMessage:"Saving changes...",deletingMessage:"Deleting event...",fbar:[{xtype:"tbtext",text:'<a href="#" id="tblink">Edit Details...</a>'},"->",{text:"Save",disabled:false,handler:this.onSave,scope:this},{id:"delete-btn",text:"Delete",disabled:false,handler:this.onDelete,scope:this,hideMode:"offsets"},{text:"Cancel",disabled:false,handler:this.onCancel,scope:this}],items:a},b))};Ext.extend(Ext.calendar.EventEditWindow,Ext.Window,{newId:10000,initComponent:function(){Ext.calendar.EventEditWindow.superclass.initComponent.call(this);this.formPanel=this.items.items[0];this.addEvents({eventadd:true,eventupdate:true,eventdelete:true,eventcancel:true,editdetails:true})},afterRender:function(){Ext.calendar.EventEditWindow.superclass.afterRender.call(this);this.el.addClass("ext-cal-event-win");Ext.get("tblink").on("click",function(a){a.stopEvent();this.updateRecord();this.fireEvent("editdetails",this,this.activeRecord)},this)},show:function(c,e){var i=(Ext.isIE8&&Ext.isStrict)?null:e;Ext.calendar.EventEditWindow.superclass.show.call(this,i,function(){Ext.getCmp("title").focus(false,100)});Ext.getCmp("delete-btn")[c.data&&c.data[Ext.calendar.EventMappings.EventId.name]?"show":"hide"]();var h,j=this.formPanel.form;if(c.data){h=c;this.isAdd=!!h.data[Ext.calendar.EventMappings.IsNew.name];if(this.isAdd){h.markDirty();this.setTitle(this.titleTextAdd)}else{this.setTitle(this.titleTextEdit)}j.loadRecord(h)}else{this.isAdd=true;this.setTitle(this.titleTextAdd);var k=Ext.calendar.EventMappings,a=k.EventId.name,b=c[k.StartDate.name],g=c[k.EndDate.name]||b.add("h",1);h=new Ext.calendar.EventRecord();h.data[k.EventId.name]=this.newId++;h.data[k.StartDate.name]=b;h.data[k.EndDate.name]=g;h.data[k.IsAllDay.name]=!!c[k.IsAllDay.name]||b.getDate()!=g.clone().add(Date.MILLI,1).getDate();h.data[k.IsNew.name]=true;j.reset();j.loadRecord(h)}if(this.calendarStore){Ext.getCmp("calendar").setValue(h.data[Ext.calendar.EventMappings.CalendarId.name])}Ext.getCmp("date-range").setValue(h.data);this.activeRecord=h;return this},roundTime:function(b,c){c=c||15;var a=parseInt(b.getMinutes(),10);return b.add("mi",c-(a%c))},onCancel:function(){this.cleanup(true);this.fireEvent("eventcancel",this)},cleanup:function(a){if(this.activeRecord&&this.activeRecord.dirty){this.activeRecord.reject()}delete this.activeRecord;if(a===true){this.hide()}},updateRecord:function(){var a=this.formPanel.form,b=Ext.getCmp("date-range").getValue(),c=Ext.calendar.EventMappings;a.updateRecord(this.activeRecord);this.activeRecord.set(c.StartDate.name,b[0]);this.activeRecord.set(c.EndDate.name,b[1]);this.activeRecord.set(c.IsAllDay.name,b[2]);this.activeRecord.set(c.CalendarId.name,this.formPanel.form.findField("calendar").getValue())},onSave:function(){if(!this.formPanel.form.isValid()){return}this.updateRecord();if(!this.activeRecord.dirty){this.onCancel();return}this.fireEvent(this.isAdd?"eventadd":"eventupdate",this,this.activeRecord)},onDelete:function(){this.fireEvent("eventdelete",this,this.activeRecord)}});Ext.calendar.CalendarPanel=Ext.extend(Ext.Panel,{showDayView:true,showWeekView:true,showMonthView:true,showNavBar:true,todayText:"Today",showTodayText:true,showTime:true,dayText:"Day",weekText:"Week",monthText:"Month",layoutConfig:{layoutOnCardChange:true,deferredRender:true},startDate:new Date(),initComponent:function(){this.tbar={cls:"ext-cal-toolbar",border:true,buttonAlign:"center",items:[{id:this.id+"-tb-prev",handler:this.onPrevClick,scope:this,iconCls:"x-tbar-page-prev"}]};this.viewCount=0;if(this.showDayView){this.tbar.items.push({id:this.id+"-tb-day",text:this.dayText,handler:this.onDayClick,scope:this,toggleGroup:"tb-views"});this.viewCount++}if(this.showWeekView){this.tbar.items.push({id:this.id+"-tb-week",text:this.weekText,handler:this.onWeekClick,scope:this,toggleGroup:"tb-views"});this.viewCount++}if(this.showMonthView||this.viewCount==0){this.tbar.items.push({id:this.id+"-tb-month",text:this.monthText,handler:this.onMonthClick,scope:this,toggleGroup:"tb-views"});this.viewCount++;this.showMonthView=true}this.tbar.items.push({id:this.id+"-tb-next",handler:this.onNextClick,scope:this,iconCls:"x-tbar-page-next"});this.tbar.items.push("->");var a=this.viewCount-1;this.activeItem=this.activeItem===undefined?a:(this.activeItem>a?a:this.activeItem);if(this.showNavBar===false){delete this.tbar;this.addClass("x-calendar-nonav")}Ext.calendar.CalendarPanel.superclass.initComponent.call(this);this.addEvents({eventadd:true,eventupdate:true,eventdelete:true,eventcancel:true,viewchange:true});this.layout="card";if(this.showDayView){var b=Ext.apply({xtype:"dayview",title:this.dayText,showToday:this.showToday,showTodayText:this.showTodayText,showTime:this.showTime},this.dayViewCfg);b.id=this.id+"-day";b.store=b.store||this.eventStore;this.initEventRelay(b);this.add(b)}if(this.showWeekView){var e=Ext.applyIf({xtype:"weekview",title:this.weekText,showToday:this.showToday,showTodayText:this.showTodayText,showTime:this.showTime},this.weekViewCfg);e.id=this.id+"-week";e.store=e.store||this.eventStore;this.initEventRelay(e);this.add(e)}if(this.showMonthView){var c=Ext.applyIf({xtype:"monthview",title:this.monthText,showToday:this.showToday,showTodayText:this.showTodayText,showTime:this.showTime,listeners:{weekclick:{fn:function(g,f){this.showWeek(f)},scope:this}}},this.monthViewCfg);c.id=this.id+"-month";c.store=c.store||this.eventStore;this.initEventRelay(c);this.add(c)}this.add(Ext.applyIf({xtype:"eventeditform",id:this.id+"-edit",calendarStore:this.calendarStore,listeners:{eventadd:{scope:this,fn:this.onEventAdd},eventupdate:{scope:this,fn:this.onEventUpdate},eventdelete:{scope:this,fn:this.onEventDelete},eventcancel:{scope:this,fn:this.onEventCancel}}},this.editViewCfg))},initEventRelay:function(a){a.listeners=a.listeners||{};a.listeners.afterrender={fn:function(b){this.relayEvents(b,["eventsrendered","eventclick","eventover","eventout","dayclick","eventmove","datechange","rangeselect","eventdelete","eventresize","initdrag"])},scope:this,single:true}},afterRender:function(){Ext.calendar.CalendarPanel.superclass.afterRender.call(this);this.fireViewChange()},onLayout:function(){Ext.calendar.CalendarPanel.superclass.onLayout.call(this);if(!this.navInitComplete){this.updateNavState();this.navInitComplete=true}},onEventAdd:function(a,b){b.data[Ext.calendar.EventMappings.IsNew.name]=false;this.eventStore.add(b);this.hideEditForm();this.fireEvent("eventadd",this,b)},onEventUpdate:function(a,b){b.commit();this.hideEditForm();this.fireEvent("eventupdate",this,b)},onEventDelete:function(a,b){this.eventStore.remove(b);this.hideEditForm();this.fireEvent("eventdelete",this,b)},onEventCancel:function(a,b){this.hideEditForm();this.fireEvent("eventcancel",this,b)},showEditForm:function(a){this.preEditView=this.layout.activeItem.id;this.setActiveView(this.id+"-edit");this.layout.activeItem.loadRecord(a);return this},hideEditForm:function(){if(this.preEditView){this.setActiveView(this.preEditView);delete this.preEditView}return this},setActiveView:function(b){var a=this.layout;a.setActiveItem(b);if(b==this.id+"-edit"){this.getTopToolbar().hide();this.doLayout()}else{a.activeItem.refresh();this.getTopToolbar().show();this.updateNavState()}this.activeView=a.activeItem;this.fireViewChange()},fireViewChange:function(){var b=null,a=this.layout.activeItem;if(a.getViewBounds){vb=a.getViewBounds();b={activeDate:a.getStartDate(),viewStart:vb.start,viewEnd:vb.end}}this.fireEvent("viewchange",this,a,b)},updateNavState:function(){if(this.showNavBar!==false){var b=this.layout.activeItem,c=b.id.split(this.id+"-")[1];var a=Ext.getCmp(this.id+"-tb-"+c);a.toggle(true)}},setStartDate:function(a){this.layout.activeItem.setStartDate(a,true);this.updateNavState();this.fireViewChange()},showWeek:function(a){this.setActiveView(this.id+"-week");this.setStartDate(a)},onPrevClick:function(){this.startDate=this.layout.activeItem.movePrev();this.updateNavState();this.fireViewChange()},onNextClick:function(){this.startDate=this.layout.activeItem.moveNext();this.updateNavState();this.fireViewChange()},onDayClick:function(){this.setActiveView(this.id+"-day")},onWeekClick:function(){this.setActiveView(this.id+"-week")},onMonthClick:function(){this.setActiveView(this.id+"-month")},getActiveView:function(){return this.layout.activeItem}});Ext.reg("calendarpanel",Ext.calendar.CalendarPanel);
// Create the namespace
Ext.ns('Ext.ux.plugins.grid');

/**
 * Ext.ux.plugins.grid.CellToolTips plugin for Ext.grid.GridPanel
 *
 * A GridPanel plugin that enables the creation of record based,
 * per-column tooltips that can also be dynamically loaded via Ajax
 * calls.
 *
 * Requires Animal's triggerElement override when using ExtJS 2.x
 * (from <a href="http://extjs.com/forum/showthread.php?p=265259#post265259">http://extjs.com/forum/showthread.php?p=265259#post265259</a>)
 * In ExtJS 3.0 this feature is arealy in the standard.
 *
 * Starting from version 1.1, CellToolTips also supports dynamic
 * loading of tooltips via Ajax. Just specify the 'url' parameter
 * in the respective column configuration for the CellToolTips,
 * and the data for the tooltip will be loaded from there. By
 * default, the record data for the current row will be passed
 * to the request.
 *
 * If you want to supply different parameters, you can specify a
 * function with the 'fn' parameter. This function gets the data
 * object for the current row record. The object it returns will
 * be used as the Ajax paremeters.
 *
 * An example configuration:
 * <pre><code>
	var tts = new Ext.ux.plugins.grid.CellToolTips([
		{
			// 'Standard' CellToolTip, the current row record is applied
			// to the template.
			field: 'company',
			tpl:   '<b>Company: {company}</b><br />This is a local column tooltip'
		},
		{
			// Simple Ajax CellToolTip, an Ajax request is dispatched with the
			// current row record as its parameters, and after adding the property
			// "ADDITIONAL" to the return data it is applied to the template.
			field: 'price', 
			tpl: '<b>Company: {company}</b><br /><hr />Description: {description}<br /><hr />Price: {price} $<br />Change: {pctChange}%<br />{ADDITIONAL}', 
			url: 'json_ajaxtip1.php',
			afterFn: function(data) { return Ext.apply({ ADDITIONAL: 'Test' }, data; }
		},
		{
			// Advanced Ajax CellToolTip, the current row record is passed to the
			// function in 'fn', its return values are passed to an Ajax call and
			// the Ajax return data is applied to the template.
			field: 'change', 
			tpl: '<b>Company: {company}</b><br /><hr />Description: {description}<br /><hr />Price: {price} $<br />Change: {pctChange}%', 
			fn: function(parms) {
				parms.price = parms.price * 100;
				return Ext.apply({},parms);
			},
			url: '/json_ajaxtip2.php'
		}
	]);
	
	var grid = new Ext.grid.GridPanel({
		... normal config ...
		,plugins:	[ tts ]
		// Optional: filter which rows should have a tooltip:
		,CellToolTipCondition: function( row, rec ) {
			// don't show a tooltip for the first row or if
			// the record has a property 'secret' set to true
			if( row == 0 || rec.get('secret') == true ) {
				return false;
			}
		}
   </code></pre>
 *
 * A complete example can be found <a href="http://www.chrwinter.de/ext3/CellToolTips.html">here</a>.
 *
 * @author  BitPoet
 * @date    July 08, 2009
 * @version 1.3
 *
 * @class Ext.ux.plugins.grid.CellToolTips
 * @extends Ext.util.Observable
 */
Ext.ux.plugins.grid.CellToolTips = function(config) {
    var cfgTips;
    if( Ext.isArray(config) ) {
        cfgTips = config;
        config = {};
    } else {
    	cfgTips = config.ajaxTips;
    }
    Ext.ux.plugins.grid.CellToolTips.superclass.constructor.call(this, config);
    if( config.tipConfig ) {
    	this.tipConfig = config.tipConfig;
    }
    this.ajaxTips = cfgTips;
} // End of constructor

// plugin code
Ext.extend( Ext.ux.plugins.grid.CellToolTips, Ext.util.Observable, {
    version: 1.3,
    /**
     * Temp storage from the config object
     *
     * @private
     */
    ajaxTips: false,
    
    /**
     * Tooltip Templates indexed by column id
     *
     * @private
     */
    tipTpls: false,

    /**
     * Tooltip data filter function for setting base parameters
     *
     * @private
     */
    tipFns: false,
    
    /**
     * URLs for ajax backend
     *
     * @private
     */
    tipUrls: '',
    
    /**
     * Tooltip configuration items
     *
     * @private
     */
    tipConfig: {},

    /**
     * Loading action
     *
     * @private
     */
    request: false,

    /**
     * Plugin initialization routine
     *
     * @param {Ext.grid.GridPanel} grid
     */
    init: function(grid) {
        if( ! this.ajaxTips ) {
            return;
        }
        this.tipTpls = {};
        this.tipFns  = {};
      	this.tipAfterFns = {};
        this.tipUrls = {};
        // Generate tooltip templates
        Ext.each( this.ajaxTips, function(tip) {
        	this.tipTpls[tip.field] = new Ext.XTemplate( tip.tpl );
        	if( tip.url ) {
        		this.tipUrls[tip.field] = tip.url;
        	}
       		if( tip.fn )
       			this.tipFns[tip.field] = tip.fn;
       		if( tip.afterFn )
       			this.tipAfterFns[tip.field] = tip.afterFn;
       		if (tip.tipConfig)
			this.tipConfig = tip.tipConfig;

        }, this);
        // delete now superfluous config entry for ajaxTips
        delete( this.ajaxTips );
        grid.on( 'render', this.onGridRender.createDelegate(this) );
    } // End of function init

    /**
     * Set/Add a template for a column
     *
     * @param {String} fld
     * @param {String | Ext.XTemplate} tpl
     */
    ,setFieldTpl: function(fld, tpl) {
        this.tipTpls[fld] = Ext.isObject(tpl) ? tpl : new Ext.XTemplate(tpl);
    } // End of function setFieldTpl

    /**
     * Set up the tooltip when the grid is rendered
     *
     * @private
     * @param {Ext.grid.GridPanel} grid
     */
    ,onGridRender: function(grid) 
    {
        if( ! this.tipTpls ) {
            return;
        }
        // Create one new tooltip for the whole grid
        Ext.apply(this.tipConfig, {
            target:      grid.getView().mainBody,
            delegate:    '.x-grid3-cell-inner',
            renderTo:    document.body,
            finished:	 false
        });
        Ext.applyIf(this.tipConfig, {
            
            //prefer M: В ie с запятой не будет работать. 
            // monkey pathcing mode true
            //trackMouse:  true,
            trackMouse:  true
    	});

        this.tip = new Ext.ToolTip( this.tipConfig );
        this.tip.ctt = this;
        // Hook onto the beforeshow event to update the tooltip content
        this.tip.on('beforeshow', this.beforeTipShow.createDelegate(this.tip, [this, grid], true));
        this.tip.on('hide', this.hideTip);
    } // End of function onGridRender

    /**
     * Replace the tooltip body by applying current row data to the template
     *
     * @private
     * @param {Ext.ToolTip} tip
     * @param {Ext.ux.plugins.grid.CellToolTips} ctt
     * @param {Ext.grid.GridPanel} grid
     */
    ,beforeTipShow: function(tip, ctt, grid) {
	// Get column id and check if a tip is defined for it
	var colIdx = grid.getView().findCellIndex( tip.triggerElement );
	var tipId = grid.getColumnModel().getDataIndex( colIdx );
       	if( ! ctt.tipTpls[tipId] )
       	    return false;
    	if( ! tip.finished ) {
	       	var isAjaxTip = (typeof ctt.tipUrls[tipId] == 'string');
        	// Fetch the rows record from the store and apply the template
        	var rowNum = grid.getView().findRowIndex( tip.triggerElement );
        	var cellRec = grid.getStore().getAt( rowNum );
	        if( grid.CellToolTipCondition && grid.CellToolTipCondition(rowNum, cellRec) === false ) {
        	    return false;
        	}
        	// create a copy of the record and use its data, otherwise we might
        	// accidentially modify the original record's values
        	var data = cellRec.copy().data;
        	if( isAjaxTip ) {
        		ctt.loadDetails((ctt.tipFns[tipId]) ? ctt.tipFns[tipId](data) : data, tip, grid, ctt, tipId);
        		tip.body.dom.innerHTML = 'Loading...';
        	} else {
			tip.body.dom.innerHTML = ctt.tipTpls[tipId].apply( (ctt.tipFns[tipId]) ? ctt.tipFns[tipId](cellRec.data) : cellRec.data );
		}       		
        } else {
        	tip.body.dom.innerHTML = tip.ctt.tipTpls[tipId].apply( tip.tipdata );
        }
    } // End of function beforeTipShow
    
    /**
     * Fired when the tooltip is hidden, resets the finished handler.
     *
     * @private
     * @param {Ext.ToolTip} tip
     */
    ,hideTip: function(tip) {
    	tip.finished = false;
    }
    
    /**
     * Loads the data to apply to the tip template via Ajax
     *
     * @private
     * @param {object} data Parameters for the Ajax request
     * @param {Ext.ToolTip} tip The tooltip object
     * @param {Ext.grid.GridPanel} grid The grid
     * @param {Ext.ux.plugins.grid.CellToolTips} ctt The CellToolTips object
     * @param {String} tipid Id of the tooltip (= field name)
     */
    ,loadDetails: function(data, tip, grid, ctt, tipid) {
    	Ext.Ajax.request({
    		url:	ctt.tipUrls[tipid],
    		params:	data,
    		method: 'POST',
    		success:	function(resp, opt) {
    			tip.finished = true;
    			tip.tipdata  = Ext.decode(resp.responseText);
    			if( ctt.tipAfterFns[tipid] ) {
    				tip.tipdata = ctt.tipAfterFns[tipid](tip.tipdata);
    			}
    			tip.show();
    		}
    	});
    }

}); // End of extend

Ext.namespace("Ext.ux.grid");

/**
 * @class Ext.ux.grid.GridHeaderFilters
 * @extends Ext.util.Observable
 * 
 * Plugin that enables filters in columns headers.
 * 
 * To add a grid header filter, put the "filter" attribute in column configuration of the grid column model.
 * This attribute is the configuration of the Ext.form.Field to use as filter in the header:<br>
 * 
 * The filter configuration object can include some attributes to manage filter configuration:
 * "filterName": to specify the name of the filter and the corresponding HTTP parameter used to send filter value to server. 
 * 					If not specified column "dataIndex" attribute will be used.
 * "value": to specify default value for filter. If no value is provided for filter, this value will be used as default filter value
 * "filterEncoder": a function used to convert filter value returned by filter field "getValue" method to a string. Useful if the filter field getValue() method
 * 						returns an object that is not a string
 * "filterDecoder": a function used to convert a string to a valid filter field value. Useful if the filter field setValue(obj) method
 * 						needs an object that is not a string
 * "applyFilterEvent" (since 1.0.10): a string that specifies the event that starts filter application for this filter field. If not specified, the "applyMode" is used
 *
 * The GridHeaderFilter constructor accept a configuration object with these properties:
 * "stateful": Switch GridHeaderFilter plugin to attempt to save and restore filters values with the configured Ext.state.Provider. Default true.
 * "height": Height of filters header area. Default 26.
 * "padding": Padding of header filters cells. Default 4.
 * "highlightOnFilter": Enabled grid header highlight if at least one filter is set. Default true.
 * "highlightColor": Color to use when highlight header (see "highlightOnFilter"). Default "orange".
 * "applyMode": Sets how filters are applied. If equals to "auto" or "change" (default) the filter is applyed when filter field value changes (change, select, ENTER).
 * 				If set to "enter" the filters are applied only when user push "ENTER" on filter field. See also "applyFilterEvent" in column filter configuration.
 * "filters": Initial values for grid filters. These values always override grid status saved filters.
 * "ensureFilteredVisible" (since 1.0.11): a boolean value that force filtered columns to be made visible if hidden. Default = true.
 *
 * This plugin fires "render" event when the filters are rendered after grid rendering:
 * render(GridHeaderFiltersPlugin)
 * 
 * This plugin enables "filterupdate" event for the grid:
 * filterupdate(filtername, filtervalue, field)
 * 
 * This plugin enables some new grid methods:
 * getHeaderFilter(name)
 * getHeaderFilterField(name) 
 * setHeaderFilter(name, value) 
 * setHeaderFilters(object, [bReset], [bReload])
 * resetHeaderFilters([bReload])
 * applyHeaderFilters([bReload])
 * 
 * The "name" is the dataIndex of the corresponding column or to the filterName (if specified in filter cfg)
 * 
 * @constructor Create a new GridHeaderFilters plugin
 * @param cfg Plugin configuration.
 * @author Damiano Zucconi - http://www.isipc.it
 * @version 1.0.12 - 06/08/2010
 */
Ext.ux.grid.GridHeaderFilters = function(cfg){if(cfg) Ext.apply(this, cfg);};
	
Ext.extend(Ext.ux.grid.GridHeaderFilters, Ext.util.Observable, 
{
	/**
	 * @cfg {Number} height
	 * Height of filter area in grid header. Default: 32px
	 */
	height: 26,
	
	/**
	 * @cfg {Number} padding
	 * Padding for filter header cells. Default: 2
	 */
	padding: 2,
	
	/**
	 * @cfg {Boolean} highlightOnFilter
	 * Enable grid header highlight if active filters 
	 */
	highlightOnFilter: true,
	
	/**
	 * @cfg {String} highlightColor
	 * Color for highlighted grid header
	 */
	// M prefer 13.10.10
	//highlightColor: 'orange',
	// -->
	highlightColor: 'yellow',
	// M prefer <-
	
	/**
	 * @cfg {Boolean} stateful
	 * Enable or disable filters save and restore through enabled Ext.state.Provider
	 */
	stateful: true,
	
	/**
	 * @cfg {String} applyMode
	 * Sets how filters are applied. If equals to "auto" (default) the filter is applyed when filter field value changes (change, select, ENTER).
	 * If set to "button" an apply button is rendered near each filter. When user push this button all filters are applied at the same time. This
	 * could be useful if you want to set more than one filter before reload the store.
	 * @since Ext.ux.grid.GridHeaderFilters 1.0.6
	 */
	applyMode: "auto",
	
	/**
	 * @cfg {Object} filters
	 * Initial values for filters. Overrides values loaded from grid status.
	 * @since Ext.ux.grid.GridHeaderFilters 1.0.9
	 */
	filters: null,
	
	/**
	 * @cfg {Boolean} ensureFilteredVisible
	 * If true, forces hidden columns to be made visible if relative filter is set. Default = true.
	 * @type Boolean
	 */
	ensureFilteredVisible: true,
	
	applyFiltersText: "Apply filters",
	
	init:function(grid) 
	{
		this.grid = grid;
		this.gridView = null;
		this.panels = [];
		//I TD corrispondenti ai vari headers
		this.headerCells = null;
		this.grid.on("render", this.onRender, this);
		this.grid.on("columnmove", this.renderFilters.createDelegate(this, [false]), this);
		this.grid.on("columnresize", this.onColResize, this);
		this.grid.on("resize", this.resizeAllFilterFields, this);
		if(this.stateful)
		{
			this.grid.on("beforestatesave", this.saveFilters, this);
			this.grid.on("beforestaterestore", this.loadFilters, this);
		}
		
		this.grid.getColumnModel().on("hiddenchange", this.onColHidden, this);
		
		this.grid.addEvents({"filterupdate": true});
		this.addEvents({'render': true});
		Ext.ux.grid.GridHeaderFilters.superclass.constructor.call(this);
		
		this.grid.stateEvents[this.grid.stateEvents.length] = "filterupdate";
		
		this.grid.headerFilters = this;
		
		this.grid.getHeaderFilter = function(sName){
			if(!this.headerFilters)
				return null;
			if(this.headerFilters.filterFields[sName])
				return this.headerFilters.getFieldValue(this.headerFilters.filterFields[sName]);
			else
				return null;	
		};
		
		this.grid.setHeaderFilter = function(sName, sValue){
			if(!this.headerFilters)
				return;
			var fd = {};
			fd[sName] = sValue;
			this.setHeaderFilters(fd);
		};
		
		this.grid.setHeaderFilters = function(obj, bReset, bReload)
		{
			if(!this.headerFilters)
				return;
			if(bReset)
				this.resetHeaderFilters(false);
			if(arguments.length < 3)
				var bReload = true;
			var bOne = false;
			for(var fn in obj)
			{
				if(this.headerFilters.filterFields[fn])
				{
					var el = this.headerFilters.filterFields[fn];
					this.headerFilters.setFieldValue(el,obj[fn]);
					this.headerFilters.applyFilter(el, false);
					bOne = true;
				}
			}
			if(bOne && bReload)
				this.headerFilters.storeReload();
		};
		
		this.grid.getHeaderFilterField = function(fn)
		{
			if(!this.headerFilters)
				return;
			if(this.headerFilters.filterFields[fn])
				return this.headerFilters.filterFields[fn];
			else
				return null;
		};
		
		this.grid.resetHeaderFilters = function(bReload)
		{
			if(!this.headerFilters)
				return;
			if(arguments.length == 0)
				var bReload = true; 
			for(var fn in this.headerFilters.filterFields)
			{
				var el = this.headerFilters.filterFields[fn];
				if(Ext.isFunction(el.clearValue)) 
				{
					el.clearValue();
				} 
				else 
				{
					this.headerFilters.setFieldValue(el, "");
				}
				this.headerFilters.applyFilter(el, false);
			}
			if(bReload)
				this.headerFilters.storeReload();
		};
		
		this.grid.applyHeaderFilters = function(bReload)
		{
			if(arguments.length == 0)
				var bReload = true;
			this.headerFilters.applyFilters(bReload);
		};
	},
	
	renderFilters: function(bReload)
	{
		//Eliminazione Fields di filtro esistenti
		this.filterFields = {};
		
		//Elimino pannelli esistenti
		for(var pId in this.panels)
		{
			if((this.panels[pId] != null) && (Ext.type(this.panels[pId].destroy) == "function"))
				this.panels[pId].destroy();
		}
		this.panels = [];
		
		this.cm = this.grid.getColumnModel();
		this.gridView = this.grid.view;
		this.headTr = Ext.DomQuery.selectNode("tr",this.gridView.mainHd.dom);
		this.headerCells = Ext.query("td",this.headTr);
		
		var cols = this.cm.getColumnsBy(function(){return true;});
		for ( var i = 0; i < cols.length; i++) 
		{
			var co = cols[i];
			this.panels[co.dataIndex] = this.createFilterPanel(co, this.grid);
		}
		//Cleaning this.filters
		
		//Check if some filter is already active
		if(this.isFiltered())
		{
			//Apply filters
			if(bReload)
				this.storeReload();
			//Highlight header
			this.highlightFilters(true);
		}
	},
	
	onRender: function()
	{
		if(!this.filters)
			this.filters = {};
		this.renderFilters(true);
		
		/*
		 * A prefer 13.10.10
		 * Monkey pathcing наше все
		 * по мотивам: 
		 * http://www.sencha.com/forum/showthread.php?41658-Grid-header-filters&p=522074#post522074
		 */
		this.grid.store.on('load', function(store, records, opt){
        this.renderFilters(false);
		}, this);
		// A prefer <
		
		this.fireEvent("render", this);
	},
	
	onRefresh: function(){
		this.renderFilters(false);
	},
	
	resizeAllFilterFields: function(){
	  for(var pId in this.panels)
    {
      var ind = this.cm.findColumnIndex(pId);
      if (ind >= 0){
        var width = this.cm.getColumnWidth(ind);
        var panel = this.panels[pId];
        if(panel && (panel != null) && (Ext.type(panel.doLayout) == "function")){
          panel.setWidth(width-2);
          panel.doLayout(false,true);
        }
      }
    }
	},
	
	onColResize: function(index, iWidth){
		var colId = this.cm.getDataIndex(index);
		var panel = this.panels[colId];
		if(panel && (panel != null))
		{
			if(isNaN(iWidth))
				iWidth = 0;
			var filterW = (iWidth < 2) ? 0 : (iWidth - 2);
			panel.setWidth(filterW);
			//Thanks to ob1
			panel.doLayout(false,true);
			if (index > 0) {
			  var leftcolId = this.cm.getDataIndex(index-1);
			  var leftpanel = this.panels[leftcolId];
        if(leftpanel && (leftpanel != null) && (Ext.type(leftpanel.doLayout) == "function")){
          var width = this.cm.getColumnWidth(index-1);
          leftpanel.setWidth(width-2);
          leftpanel.doLayout(false,true);
        }
			}
			if (index+1 < this.cm.getColumnCount()) {
        var rightcolId = this.cm.getDataIndex(index+1);
        var rightpanel = this.panels[rightcolId];
        if(rightpanel && (rightpanel != null) && (Ext.type(rightpanel.doLayout) == "function")){
          var width = this.cm.getColumnWidth(index+1);
          rightpanel.setWidth(width-2);
          rightpanel.doLayout(false,true);
        }
      }
		}
	},
	
	onColHidden: function(cm, index, bHidden){
		if(bHidden)
			return;
		var colId = cm.getDataIndex(index);
		var panel = this.panels[colId];
		if(panel && (panel != null))
		{
			var iWidth = cm.getColumnWidth(index);
			var filterW = (iWidth < 2) ? 0 : (iWidth - 2);
			panel.setWidth(filterW);
			//Thanks to ob1
			panel.doLayout(false,true);
		}
	},
	
	saveFilters: function(grid, status)
	{
		var vals = {};
		for(var name in this.filters)
		{
			vals[name] = this.filters[name];
		}
		status["gridHeaderFilters"] = vals;
		return true;
	},
    
	loadFilters: function(grid, status)
	{
		var vals = status.gridHeaderFilters;
		if(vals)
		{
			if(!this.filters)
				this.filters = {};
			
			Ext.applyIf(this.filters, vals);
			/*var bOne = false;
			for(var name in vals)
			{
				this.filters[name] = vals[name];
				this.grid.store.baseParams[name] = vals[name];
				bOne = true;
			}
			/*if(bOne)
				this.grid.store.reload();*/
		}
		
	},
	
	isFiltered: function()
	{
		for(var k in this.filters)
		{
			if(this.filterFields[k] && !Ext.isEmpty(this.filters[k]))
				return true;
		}
		return false;
	},
	
	highlightFilters: function(enable)
	{
		if(!this.highlightOnFilter)
			return;
		var color = enable ? this.highlightColor : "transparent";
		for(var fn in this.filterFields)
    {
      this.filterFields[fn].highlightCtrl.getEl().dom.style.backgroundColor = "transparent";
      
      if(!Ext.isEmpty(this.filters[fn])) { 
        this.filterFields[fn].highlightCtrl.getEl().dom.style.backgroundColor = color;
      }
    }
	},
	
	getFieldValue: function(eField)
	{
		if(Ext.type(eField.filterEncoder) == "function")
			return eField.filterEncoder.call(eField, eField.getValue());
		else
			return eField.getValue();
	},
	
	setFieldValue: function(eField, value)
	{
		if(Ext.type(eField.filterDecoder) == "function")
			value = eField.filterDecoder.call(eField, value);
		eField.setValue(value);
	},
	
	applyFilter: function(el, bLoad)
	{
		if(arguments.length < 2)
			bLoad = true;
		if(!el)
			return;
			
		if(!el.isValid())
			return;
		
		var sValue = this.getFieldValue(el);
		
		
		if(Ext.isEmpty(sValue))
		{
		  if (this.filters[el.filterName] == sValue)
		    bLoad = false;
			delete this.grid.store.baseParams[el.filterName];
			delete this.filters[el.filterName];
		}
		else	
		{
		  if (this.filters[el.filterName] == sValue)
        bLoad = false;
			this.grid.store.baseParams[el.filterName] = sValue;
			this.filters[el.filterName] = sValue;
			
			if(this.ensureFilteredVisible)
			{
				//Controllo che la colonna del filtro applicato sia visibile
				var ci = this.grid.getColumnModel().findColumnIndex(el.dataIndex);
				if((ci >= 0) && (this.grid.getColumnModel().isHidden(ci)))
						this.grid.getColumnModel().setHidden(ci, false);
			}
		}
		
		//Evidenza filtri se almeno uno attivo
		this.highlightFilters(this.isFiltered());
		
		this.grid.fireEvent("filterupdate",el.filterName,sValue,el);
		
		if(bLoad)
			this.storeReload();
	},
	
	applyFilters: function(bLoad)
	{
		if(arguments.length < 1)
			bLoad = true;
		for(var fn in this.filterFields)
		{
			this.applyFilter(this.filterFields[fn], false);
		}
		if(bLoad)
			this.storeReload();
	},
	
	storeReload: function()
	{
		if(!this.grid.store.lastOptions)
			return;
		var slp = {start: 0};
		if(this.grid.store.lastOptions.params && this.grid.store.lastOptions.params.limit)
			slp.limit = this.grid.store.lastOptions.params.limit;
		this.grid.store.load({params: slp});
	},
	
	createFilterField: function(fDataIndex, fConfig)
	{
	  //Configurazione widget filtro
    var filterConfig = {};
    Ext.apply(filterConfig, fConfig);
    Ext.apply(filterConfig, {
      dataIndex: fDataIndex,
      stateful: false
    });/*
     * Se la configurazione del field di filtro specifica l'attributo applyFilterEvent, il filtro verrà applicato
     * in corrispondenza di quest'evento specifico
     */
    if(filterConfig.applyFilterEvent)
    {
      filterConfig.listeners = {scope: this};
      filterConfig.listeners[filterConfig.applyFilterEvent] = function(field){this.applyFilter(field);};
    }
    else
    {
      //applyMode: auto o enter
      if(this.applyMode == "auto" || this.applyMode == "change" || Ext.isEmpty(this.applyMode))
      {
        //Legacy mode and deprecated. Use applyMode = "enter" or applyFilterEvent
        filterConfig.listeners = 
        {
          change: function(field, newValue, oldValue){
            if (newValue == oldValue) return;
            var t = field.getXType();
            if(t=='combo' || t=='datefield'){ //avoid refresh twice for combo select 
            return;
            }else{
            this.applyFilter(field);
            }
          },
          // specialkey: function(el,ev)
          // {
          //   //ev.stopPropagation();
          //   //if(ev.getKey() == ev.ENTER) 
          //   //  this.applyFilters();
          //   //  el.el.dom.blur();
          // },
          select: function(field){
             this.applyFilter(field);
          },
          scope: this 
        };
      }
      else if(this.applyMode == "enter")
      {
        filterConfig.listeners = 
        {
          specialkey: function(el,ev)
          {
            ev.stopPropagation();
            if(ev.getKey() == ev.ENTER) 
            {
              this.applyFilters();
            }
          },
          scope: this
        };
      }
    }
    return filterConfig;
	},
	
	configureField: function(filterField)
	{
	  this.filterFields[filterField.filterName] = filterField;
    if(!Ext.isEmpty(this.filters[filterField.filterName]))
    {
      this.setFieldValue(filterField,this.filters[filterField.filterName]);
      this.applyFilter(filterField, false);            
    }
    else if(filterField.value)
    {
      filterField.setValue(filterField.value);
      this.applyFilter(filterField, false);
    }
	},
	
  createFilterPanel: function(colCfg, grid)
  {
		// = this.cm.findColumnIndex(colCfg.dataIndex);
		//Thanks to dzj
		var iColIndex = this.cm.getIndexById(colCfg.id);
    	//var headerTd = Ext.get(this.gridView.getHeaderCell(iColIndex));
		var headerTd = Ext.get(this.headerCells[iColIndex]);
		//Patch for field text selection on Mozilla
		if(Ext.isGecko)
			headerTd.dom.style.MozUserSelect = "text";
		var filterPanel = null;
			
		if(colCfg.filter)
    	{
				var iColWidth = this.cm.getColumnWidth(iColIndex);
				var iPanelWidth = iColWidth - 2;
				
				//Pannello filtri
				var panelConfig = {
						/*id: "filter-panel-"+colCfg.id,*/
						width: iPanelWidth,
						height: this.height,
						border: false,
						bodyStyle: "background-color: transparent; padding: "+this.padding+"px",
						bodyBorder: false,
						layout: "fit",
						items: [],
						stateful: false
					};
				
			  // Проверим, вдруг несколько фильтров - тогда будет цикл
			  if (colCfg.filter.constructor == Array)
			  {
			    var compositeConfig = {
			      xtype: "compositefield",
			      items: []
			    };
			    for(var cfgInd in colCfg.filter)
			    {
			      if (!colCfg.filter.hasOwnProperty(cfgInd)) continue;
			      var cfgF = colCfg.filter[cfgInd];
			      var filterConfig = this.createFilterField(colCfg.dataIndex, cfgF);
			      var filterName = filterConfig.filterName ? filterConfig.filterName : colCfg.dataIndex;
            filterConfig.filterName = filterName;
            filterConfig.flex = 1;
            compositeConfig.items.push(filterConfig);
			    };
			    panelConfig.items.push(compositeConfig);
			  }
			  else 
			  {
			    var cfgF = colCfg.filter;
			    Ext.apply(cfgF, {      
            margins: {top:2,left:2,right:2,bottom:2}
          });
			    var filterConfig = this.createFilterField(colCfg.dataIndex, cfgF);
			    var filterName = filterConfig.filterName ? filterConfig.filterName : colCfg.dataIndex;
          filterConfig.filterName = filterName;
			    panelConfig.items.push(filterConfig);
			  };				
				
				filterPanel = new Ext.Panel(panelConfig);
				filterPanel.render(headerTd);
				for(var filterInd=0; filterInd<filterPanel.items.length; filterInd++)
				{
				  var filterField = filterPanel.items.get(filterInd);
				  var t = filterField.getXType();
          if(t=='compositefield')
          {
            for(var fieldInd=0; fieldInd<filterField.items.length; fieldInd++)
            {
              var field = filterField.items.get(fieldInd)
              field.highlightCtrl = filterField.ownerCt;
              this.configureField(field);
            }
          }
          else
          {
            filterField.highlightCtrl = filterField.ownerCt;
            this.configureField(filterField);
          }
				};
    	}
		return filterPanel;
    }
});

Ext.ns('Ext.ux');

Ext.ux.Lightbox = (function(){
    var els = {},
        images = [],
        activeImage,
        initialized = false,
        selectors = [];

    return {
        overlayOpacity: 0.85,
        animate: true,
        resizeSpeed: 8,
        borderSize: 10,
        labelImage: "Image",
        labelOf: "of",

        init: function() {
            this.resizeDuration = this.animate ? ((11 - this.resizeSpeed) * 0.15) : 0;
            this.overlayDuration = this.animate ? 0.2 : 0;

            if(!initialized) {
                Ext.apply(this, Ext.util.Observable.prototype);
                Ext.util.Observable.constructor.call(this);
                this.addEvents('open', 'close');
                this.initMarkup();
                this.initEvents();
                initialized = true;
            }
        },

        initMarkup: function() {
            els.shim = Ext.DomHelper.append(document.body, {
                tag: 'iframe',
                id: 'ux-lightbox-shim'
            }, true);
            els.overlay = Ext.DomHelper.append(document.body, {
                id: 'ux-lightbox-overlay'
            }, true);
            
            var lightboxTpl = new Ext.Template(this.getTemplate());
            els.lightbox = lightboxTpl.append(document.body, {}, true);

            var ids =
                ['outerImageContainer', 'imageContainer', 'image', 'hoverNav', 'navPrev', 'navNext', 'loading', 'loadingLink',
                'outerDataContainer', 'dataContainer', 'data', 'details', 'caption', 'imageNumber', 'bottomNav', 'navClose'];

            Ext.each(ids, function(id){
                els[id] = Ext.get('ux-lightbox-' + id);
            });

            Ext.each([els.overlay, els.lightbox, els.shim], function(el){
                el.setVisibilityMode(Ext.Element.DISPLAY)
                el.hide();
            });

            var size = (this.animate ? 250 : 1) + 'px';
            els.outerImageContainer.setStyle({
                width: size,
                height: size
            });
        },

        getTemplate : function() {
            return [
                '<div id="ux-lightbox">',
                    '<div id="ux-lightbox-outerImageContainer">',
                        '<div id="ux-lightbox-imageContainer">',
                            '<img id="ux-lightbox-image">',
                            '<div id="ux-lightbox-hoverNav">',
                                '<a href="#" id="ux-lightbox-navPrev"></a>',
                                '<a href="#" id="ux-lightbox-navNext"></a>',
                            '</div>',
                            '<div id="ux-lightbox-loading">',
                                '<a id="ux-lightbox-loadingLink"></a>',
                            '</div>',
                        '</div>',
                    '</div>',
                    '<div id="ux-lightbox-outerDataContainer">',
                        '<div id="ux-lightbox-dataContainer">',
                            '<div id="ux-lightbox-data">',
                                '<div id="ux-lightbox-details">',
                                    '<span id="ux-lightbox-caption"></span>',
                                    '<span id="ux-lightbox-imageNumber"></span>',
                                '</div>',
                                '<div id="ux-lightbox-bottomNav">',
                                    '<a href="#" id="ux-lightbox-navClose"></a>',
                                '</div>',
                            '</div>',
                        '</div>',
                    '</div>',
                '</div>'
            ];
        },

        initEvents: function() {
            var close = function(ev) {
                ev.preventDefault();
                this.close();
            };

            els.overlay.on('click', close, this);
            els.loadingLink.on('click', close, this);
            els.navClose.on('click', close, this);

            els.lightbox.on('click', function(ev) {
                if(ev.getTarget().id == 'ux-lightbox') {
                    this.close();
                }
            }, this);

            els.navPrev.on('click', function(ev) {
                ev.preventDefault();
                this.setImage(activeImage - 1);
            }, this);

            els.navNext.on('click', function(ev) {
                ev.preventDefault();
                this.setImage(activeImage + 1);
            }, this);
        },

        register: function(sel, group) {
            if(selectors.indexOf(sel) === -1) {
                selectors.push(sel);

                Ext.fly(document).on('click', function(ev){
                    var target = ev.getTarget(sel);

                    if (target) {
                        ev.preventDefault();
                        this.open(target, sel, group);
                    }
                }, this);
            }
        },

        open: function(image, sel, group) {
            group = group || false;
            this.setViewSize();
            els.overlay.fadeIn({
                duration: this.overlayDuration,
                endOpacity: this.overlayOpacity,
                callback: function() {
                    images = [];

                    var index = 0;
                    if(!group) {
                        images.push([image.href, image.title]);
                    }
                    else {
                        var setItems = Ext.query(sel);
                        Ext.each(setItems, function(item) {
                            if(item.href) {
                                images.push([item.href, item.title]);
                            }
                        });

                        while (images[index][0] != image.href) {
                            index++;
                        }
                    }

                    // calculate top and left offset for the lightbox
                    var pageScroll = Ext.fly(document).getScroll();

                    var lightboxTop = pageScroll.top + (Ext.lib.Dom.getViewportHeight() / 10);
                    var lightboxLeft = pageScroll.left;
                    els.lightbox.setStyle({
                        top: lightboxTop + 'px',
                        left: lightboxLeft + 'px'
                    }).show();

                    this.setImage(index);
                    
                    this.fireEvent('open', images[index]);                                        
                },
                scope: this
            });
        },
        
        setViewSize: function(){
            var viewSize = this.getViewSize();
            els.overlay.setStyle({
                width: viewSize[0] + 'px',
                height: viewSize[1] + 'px'
            });
            els.shim.setStyle({
                width: viewSize[0] + 'px',
                height: viewSize[1] + 'px'
            }).show();
        },

        setImage: function(index){
            activeImage = index;
                      
            this.disableKeyNav();            
            if (this.animate) {
                els.loading.show();
            }

            els.image.hide();
            els.hoverNav.hide();
            els.navPrev.hide();
            els.navNext.hide();
            els.dataContainer.setOpacity(0.0001);
            els.imageNumber.hide();

            var preload = new Image();
            preload.onload = (function(){
                els.image.dom.src = images[activeImage][0];
                this.resizeImage(preload.width, preload.height);
            }).createDelegate(this);
            preload.src = images[activeImage][0];
        },

        resizeImage: function(w, h){
            var wCur = els.outerImageContainer.getWidth();
            var hCur = els.outerImageContainer.getHeight();

            var wNew = (w + this.borderSize * 2);
            var hNew = (h + this.borderSize * 2);

            var wDiff = wCur - wNew;
            var hDiff = hCur - hNew;

            var afterResize = function(){
                els.hoverNav.setWidth(els.imageContainer.getWidth() + 'px');

                els.navPrev.setHeight(h + 'px');
                els.navNext.setHeight(h + 'px');

                els.outerDataContainer.setWidth(wNew + 'px');

                this.showImage();
            };
            
            if (hDiff != 0 || wDiff != 0) {
                els.outerImageContainer.shift({
                    height: hNew,
                    width: wNew,
                    duration: this.resizeDuration,
                    scope: this,
                    callback: afterResize,
                    delay: 50
                });
            }
            else {
                afterResize.call(this);
            }
        },

        showImage: function(){
            els.loading.hide();
            els.image.fadeIn({
                duration: this.resizeDuration,
                scope: this,
                callback: function(){
                    this.updateDetails();
                }
            });
            this.preloadImages();
        },

        updateDetails: function(){
            var detailsWidth = els.data.getWidth(true) - els.navClose.getWidth() - 10;
            els.details.setWidth((detailsWidth > 0 ? detailsWidth : 0) + 'px');
            
            els.caption.update(images[activeImage][1]);

            els.caption.show();
            if (images.length > 1) {
                els.imageNumber.update(this.labelImage + ' ' + (activeImage + 1) + ' ' + this.labelOf + '  ' + images.length);
                els.imageNumber.show();
            }

            els.dataContainer.fadeIn({
                duration: this.resizeDuration/2,
                scope: this,
                callback: function() {
                    var viewSize = this.getViewSize();
                    els.overlay.setHeight(viewSize[1] + 'px');
                    this.updateNav();
                }
            });
        },

        updateNav: function(){
            this.enableKeyNav();

            els.hoverNav.show();

            // if not first image in set, display prev image button
            if (activeImage > 0)
                els.navPrev.show();

            // if not last image in set, display next image button
            if (activeImage < (images.length - 1))
                els.navNext.show();
        },

        enableKeyNav: function() {
            Ext.fly(document).on('keydown', this.keyNavAction, this);
        },

        disableKeyNav: function() {
            Ext.fly(document).un('keydown', this.keyNavAction, this);
        },

        keyNavAction: function(ev) {
            var keyCode = ev.getKey();

            if (
                keyCode == 88 || // x
                keyCode == 67 || // c
                keyCode == 27
            ) {
                this.close();
            }
            else if (keyCode == 80 || keyCode == 37){ // display previous image
                if (activeImage != 0){
                    this.setImage(activeImage - 1);
                }
            }
            else if (keyCode == 78 || keyCode == 39){ // display next image
                if (activeImage != (images.length - 1)){
                    this.setImage(activeImage + 1);
                }
            }
        },

        preloadImages: function(){
            var next, prev;
            if (images.length > activeImage + 1) {
                next = new Image();
                next.src = images[activeImage + 1][0];
            }
            if (activeImage > 0) {
                prev = new Image();
                prev.src = images[activeImage - 1][0];
            }
        },

        close: function(){
            this.disableKeyNav();
            els.lightbox.hide();
            els.overlay.fadeOut({
                duration: this.overlayDuration
            });
            els.shim.hide();
            this.fireEvent('close', activeImage);
        },

        getViewSize: function() {
            return [Ext.lib.Dom.getViewWidth(), Ext.lib.Dom.getViewHeight()];
        }
    }
})();

Ext.onReady(Ext.ux.Lightbox.init, Ext.ux.Lightbox);
Ext.ns('Ext.ux.grid');

Ext.ux.grid.LockingHeaderGroupGridView = Ext.extend(Ext.grid.GridView, {
    lockText : 'Lock',
    unlockText : 'Unlock',
    rowBorderWidth : 1,
    lockedBorderWidth : 1,

    /*
     * This option ensures that height between the rows is synchronized
     * between the locked and unlocked sides. This option only needs to be used
     * when the row heights aren't predictable.
     */
    syncHeights: false,

    initTemplates : function(){
        var ts = this.templates || {};

        if (!ts.master) {
            ts.master = new Ext.Template(
                '<div class="x-grid3" hidefocus="true">',
                    '<div class="x-grid3-locked">',
                        '<div class="x-grid3-header"><div class="x-grid3-header-inner"><div class="x-grid3-header-offset" style="{lstyle}">{lockedHeader}</div></div><div class="x-clear"></div></div>',
                        '<div class="x-grid3-scroller"><div class="x-grid3-body" style="{lstyle}">{lockedBody}</div><div class="x-grid3-scroll-spacer"></div></div>',
                    '</div>',
                    '<div class="x-grid3-viewport x-grid3-unlocked">',
                        '<div class="x-grid3-header"><div class="x-grid3-header-inner"><div class="x-grid3-header-offset" style="{ostyle}">{header}</div></div><div class="x-clear"></div></div>',
                        '<div class="x-grid3-scroller"><div class="x-grid3-body" style="{bstyle}">{body}</div><a href="#" class="x-grid3-focus" tabIndex="-1"></a></div>',
                    '</div>',
                    '<div class="x-grid3-resize-marker">&#160;</div>',
                    '<div class="x-grid3-resize-proxy">&#160;</div>',
                '</div>'
            );
        }
        //kirov
	    if(!ts.gcell){
            ts.gcell = new Ext.XTemplate('<td class="x-grid3-hd x-grid3-gcell x-grid3-td-{id} ux-grid-hd-group-row-{row} {cls}" style="{style}">', '<div {tooltip} class="x-grid3-hd-inner x-grid3-hd-{id}" unselectable="on" style="{istyle}">', this.grid.enableHdMenu ? '<a class="x-grid3-hd-btn" href="#"></a>' : '', '{value}</div></td>');
        }
        this.templates = ts;
        //kirov
	    this.hrowRe = new RegExp("ux-grid-hd-group-row-(\\d+)", "");
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.initTemplates.call(this);
    },

    getEditorParent : function(ed){
        return this.el.dom;
    },

    initElements : function(){
        var E  = Ext.Element,
            el = this.grid.getGridEl().dom.firstChild,
            cs = el.childNodes;

        this.el             = new E(el);
        this.lockedWrap     = new E(cs[0]);
        this.lockedHd       = new E(this.lockedWrap.dom.firstChild);
        this.lockedInnerHd  = this.lockedHd.dom.firstChild;
        this.lockedScroller = new E(this.lockedWrap.dom.childNodes[1]);
        this.lockedBody     = new E(this.lockedScroller.dom.firstChild);
        this.mainWrap       = new E(cs[1]);
        this.mainHd         = new E(this.mainWrap.dom.firstChild);

        if (this.grid.hideHeaders) {
            this.lockedHd.setDisplayed(false);
            this.mainHd.setDisplayed(false);
        }

        this.innerHd  = this.mainHd.dom.firstChild;
        this.scroller = new E(this.mainWrap.dom.childNodes[1]);

        if(this.forceFit){
            this.scroller.setStyle('overflow-x', 'hidden');
        }

        this.mainBody     = new E(this.scroller.dom.firstChild);
        this.focusEl      = new E(this.scroller.dom.childNodes[1]);
        this.resizeMarker = new E(cs[2]);
        this.resizeProxy  = new E(cs[3]);

        this.focusEl.swallowEvent('click', true);
    },

    getLockedRows : function(){
        return this.hasRows() ? this.lockedBody.dom.childNodes : [];
    },

    getLockedRow : function(row){
        return this.getLockedRows()[row];
    },

    getCell : function(row, col){
        var llen = this.cm.getLockedCount();
        if(col < llen){
            return this.getLockedRow(row).getElementsByTagName('td')[col];
        }
        return Ext.ux.grid.LockingHeaderGroupGridView.superclass.getCell.call(this, row, col - llen);
    },

    getHeaderCell : function(index){
        var llen = this.cm.getLockedCount();
        if(index < llen){
            return this.lockedHd.dom.getElementsByTagName('td')[index];
        }
        //kirov
        //return Ext.ux.grid.LockingHeaderGroupGridView.superclass.getHeaderCell.call(this, index - llen);
        return this.mainHd.query(this.cellSelector)[index-llen];
    },

    addRowClass : function(row, cls){
        var r = this.getLockedRow(row);
        if(r){
            this.fly(r).addClass(cls);
        }
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.addRowClass.call(this, row, cls);
    },

    removeRowClass : function(row, cls){
        var r = this.getLockedRow(row);
        if(r){
            this.fly(r).removeClass(cls);
        }
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.removeRowClass.call(this, row, cls);
    },

    removeRow : function(row) {
        Ext.removeNode(this.getLockedRow(row));
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.removeRow.call(this, row);
    },

    removeRows : function(firstRow, lastRow){
        var bd = this.lockedBody.dom;
        for(var rowIndex = firstRow; rowIndex <= lastRow; rowIndex++){
            Ext.removeNode(bd.childNodes[firstRow]);
        }
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.removeRows.call(this, firstRow, lastRow);
    },

    syncScroll : function(e){
        var mb = this.scroller.dom;
        this.lockedScroller.dom.scrollTop = mb.scrollTop;
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.syncScroll.call(this, e);
    },

    updateSortIcon : function(col, dir){
        var sc = this.sortClasses,
            lhds = this.lockedHd.select('td').removeClass(sc),
            hds = this.mainHd.select('td').removeClass(sc),
            llen = this.cm.getLockedCount(),
            cls = sc[dir == 'DESC' ? 1 : 0];
        if(col < llen){
            lhds.item(col).addClass(cls);
        }else{
            hds.item(col - llen).addClass(cls);
        }
    },

    updateAllColumnWidths : function(){
        var tw = this.getTotalWidth(),
            clen = this.cm.getColumnCount(),
            lw = this.getLockedWidth(),
            llen = this.cm.getLockedCount(),
            ws = [], len, i;
        this.updateLockedWidth();
        for(i = 0; i < clen; i++){
            ws[i] = this.getColumnWidth(i);
            var hd = this.getHeaderCell(i);
            hd.style.width = ws[i];
        }
        var lns = this.getLockedRows(), ns = this.getRows(), row, trow, j;
        for(i = 0, len = ns.length; i < len; i++){
            row = lns[i];
            row.style.width = lw;
            if(row.firstChild){
                row.firstChild.style.width = lw;
                trow = row.firstChild.rows[0];
                for (j = 0; j < llen; j++) {
                   trow.childNodes[j].style.width = ws[j];
                }
            }
            row = ns[i];
            row.style.width = tw;
            if(row.firstChild){
                row.firstChild.style.width = tw;
                trow = row.firstChild.rows[0];
                for (j = llen; j < clen; j++) {
                   trow.childNodes[j - llen].style.width = ws[j];
                }
            }
        }
        //kirov
        this.updateGroupStyles();
        this.onAllColumnWidthsUpdated(ws, tw);
        this.syncHeaderHeight();
    },
    //kirov
    onColumnWidthUpdated: function(){
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.onColumnWidthUpdated.call(this, arguments);
        this.updateGroupStyles.call(this);
    },
    //kirov
    onAllColumnWidthsUpdated: function(){
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.onAllColumnWidthsUpdated.call(this, arguments);
        this.updateGroupStyles.call(this);
    },
    //kirov
    //onColumnHiddenUpdated: function(){
    //    Ext.ux.grid.LockingHeaderGroupGridView.superclass.onColumnHiddenUpdated.call(this, arguments);
    //    this.updateGroupStyles.call(this);
    //},

    updateColumnWidth : function(col, width){
        var w = this.getColumnWidth(col),
            llen = this.cm.getLockedCount(),
            ns, rw, c, row;
        this.updateLockedWidth();
        if(col < llen){
            ns = this.getLockedRows();
            rw = this.getLockedWidth();
            c = col;
        }else{
            ns = this.getRows();
            rw = this.getTotalWidth();
            c = col - llen;
        }
        var hd = this.getHeaderCell(col);
        hd.style.width = w;
        for(var i = 0, len = ns.length; i < len; i++){
            row = ns[i];
            row.style.width = rw;
            if(row.firstChild){
                row.firstChild.style.width = rw;
                row.firstChild.rows[0].childNodes[c].style.width = w;
            }
        }
        this.onColumnWidthUpdated(col, w, this.getTotalWidth());
        this.syncHeaderHeight();
    },

    updateColumnHidden : function(col, hidden){
        var llen = this.cm.getLockedCount(),
            ns, rw, c, row,
            display = hidden ? 'none' : '';
        this.updateLockedWidth();
        if(col < llen){
            ns = this.getLockedRows();
            rw = this.getLockedWidth();
            c = col;
        }else{
            ns = this.getRows();
            rw = this.getTotalWidth();
            c = col - llen;
        }
        var hd = this.getHeaderCell(col);
        hd.style.display = display;
        for(var i = 0, len = ns.length; i < len; i++){
            row = ns[i];
            row.style.width = rw;
            if(row.firstChild){
                row.firstChild.style.width = rw;
                row.firstChild.rows[0].childNodes[c].style.display = display;
            }
        }
        this.onColumnHiddenUpdated(col, hidden, this.getTotalWidth());
        delete this.lastViewWidth;
        this.layout();
    },

    doRender : function(cs, rs, ds, startRow, colCount, stripe){
        var ts = this.templates, ct = ts.cell, rt = ts.row, last = colCount-1,
            tstyle = 'width:'+this.getTotalWidth()+';',
            lstyle = 'width:'+this.getLockedWidth()+';',
            buf = [], lbuf = [], cb, lcb, c, p = {}, rp = {}, r;
        for(var j = 0, len = rs.length; j < len; j++){
            r = rs[j]; cb = []; lcb = [];
            var rowIndex = (j+startRow);
            for(var i = 0; i < colCount; i++){
                c = cs[i];
                p.id = c.id;
                p.css = (i === 0 ? 'x-grid3-cell-first ' : (i == last ? 'x-grid3-cell-last ' : '')) +
                    (this.cm.config[i].cellCls ? ' ' + this.cm.config[i].cellCls : '');
                p.attr = p.cellAttr = '';
                p.value = c.renderer(r.data[c.name], p, r, rowIndex, i, ds);
                p.style = c.style;
                if(Ext.isEmpty(p.value)){
                    p.value = '&#160;';
                }
                if(this.markDirty && r.dirty && Ext.isDefined(r.modified[c.name])){
                    p.css += ' x-grid3-dirty-cell';
                }
                if(c.locked){
                    lcb[lcb.length] = ct.apply(p);
                }else{
                    cb[cb.length] = ct.apply(p);
                }
            }
            var alt = [];
            if(stripe && ((rowIndex+1) % 2 === 0)){
                alt[0] = 'x-grid3-row-alt';
            }
            if(r.dirty){
                alt[1] = ' x-grid3-dirty-row';
            }
            rp.cols = colCount;
            if(this.getRowClass){
                alt[2] = this.getRowClass(r, rowIndex, rp, ds);
            }
            rp.alt = alt.join(' ');
            rp.cells = cb.join('');
            rp.tstyle = tstyle;
            buf[buf.length] = rt.apply(rp);
            rp.cells = lcb.join('');
            rp.tstyle = lstyle;
            lbuf[lbuf.length] = rt.apply(rp);
        }
        return [buf.join(''), lbuf.join('')];
    },
    processRows : function(startRow, skipStripe){
        if(!this.ds || this.ds.getCount() < 1){
            return;
        }
        var rows = this.getRows(),
            lrows = this.getLockedRows(),
            row, lrow;
        skipStripe = skipStripe || !this.grid.stripeRows;
        startRow = startRow || 0;
        for(var i = 0, len = rows.length; i < len; ++i){
            row = rows[i];
            lrow = lrows[i];
            row.rowIndex = i;
            lrow.rowIndex = i;
            if(!skipStripe){
                row.className = row.className.replace(this.rowClsRe, ' ');
                lrow.className = lrow.className.replace(this.rowClsRe, ' ');
                if ((i + 1) % 2 === 0){
                    row.className += ' x-grid3-row-alt';
                    lrow.className += ' x-grid3-row-alt';
                }
            }
            if(this.syncHeights){
                var el1 = Ext.get(row),
                    el2 = Ext.get(lrow),
                    h1 = el1.getHeight(),
                    h2 = el2.getHeight();

                if(h1 > h2){
                    el2.setHeight(h1);
                }else if(h2 > h1){
                    el1.setHeight(h2);
                }
            }
        }
        if(startRow === 0){
            Ext.fly(rows[0]).addClass(this.firstRowCls);
            Ext.fly(lrows[0]).addClass(this.firstRowCls);
        }
        Ext.fly(rows[rows.length - 1]).addClass(this.lastRowCls);
        Ext.fly(lrows[lrows.length - 1]).addClass(this.lastRowCls);
    },

    afterRender : function(){
        if(!this.ds || !this.cm){
            return;
        }
        var bd = this.renderRows() || ['&#160;', '&#160;'];
        this.mainBody.dom.innerHTML = bd[0];
        this.lockedBody.dom.innerHTML = bd[1];
        this.processRows(0, true);
        if(this.deferEmptyText !== true){
            this.applyEmptyText();
        }
    },

    renderUI : function(){
        var header = this.renderHeaders();
        var body = this.templates.body.apply({rows:'&#160;'});
        var html = this.templates.master.apply({
            body: body,
            header: header[0],
            ostyle: 'width:'+this.getOffsetWidth()+';',
            bstyle: 'width:'+this.getTotalWidth()+';',
            lockedBody: body,
            lockedHeader: header[1],
            lstyle: 'width:'+this.getLockedWidth()+';'
        });
        var g = this.grid;
        g.getGridEl().dom.innerHTML = html;
        this.initElements();
        Ext.fly(this.innerHd).on('click', this.handleHdDown, this);
        Ext.fly(this.lockedInnerHd).on('click', this.handleHdDown, this);
        this.mainHd.on({
            scope: this,
            mouseover: this.handleHdOver,
            mouseout: this.handleHdOut,
            mousemove: this.handleHdMove
        });
        this.lockedHd.on({
            scope: this,
            mouseover: this.handleHdOver,
            mouseout: this.handleHdOut,
            mousemove: this.handleHdMove
        });
        this.scroller.on('scroll', this.syncScroll,  this);
        if(g.enableColumnResize !== false){
            this.splitZone = new Ext.grid.GridView.SplitDragZone(g, this.mainHd.dom);
            this.splitZone.setOuterHandleElId(Ext.id(this.lockedHd.dom));
            this.splitZone.setOuterHandleElId(Ext.id(this.mainHd.dom));
        }
        if(g.enableColumnMove){
            this.columnDrag = new Ext.grid.GridView.ColumnDragZone(g, this.innerHd);
            this.columnDrag.setOuterHandleElId(Ext.id(this.lockedInnerHd));
            this.columnDrag.setOuterHandleElId(Ext.id(this.innerHd));
            this.columnDrop = new Ext.grid.HeaderDropZone(g, this.mainHd.dom);
        }
        if(g.enableHdMenu !== false){
            this.hmenu = new Ext.menu.Menu({id: g.id + '-hctx'});
            this.hmenu.add(
                {itemId: 'asc', text: this.sortAscText, cls: 'xg-hmenu-sort-asc'},
                {itemId: 'desc', text: this.sortDescText, cls: 'xg-hmenu-sort-desc'}
            );
            if(this.grid.enableColLock !== false){
                this.hmenu.add('-',
                    {itemId: 'lock', text: this.lockText, cls: 'xg-hmenu-lock'},
                    {itemId: 'unlock', text: this.unlockText, cls: 'xg-hmenu-unlock'}
                );
            }
            if(g.enableColumnHide !== false){
                this.colMenu = new Ext.menu.Menu({id:g.id + '-hcols-menu'});
                this.colMenu.on({
                    scope: this,
                    beforeshow: this.beforeColMenuShow,
                    itemclick: this.handleHdMenuClick
                });
                this.hmenu.add('-', {
                    itemId:'columns',
                    hideOnClick: false,
                    text: this.columnsText,
                    menu: this.colMenu,
                    iconCls: 'x-cols-icon'
                });
            }
            this.hmenu.on('itemclick', this.handleHdMenuClick, this);
        }
        if(g.trackMouseOver){
            this.mainBody.on({
                scope: this,
                mouseover: this.onRowOver,
                mouseout: this.onRowOut
            });
            this.lockedBody.on({
                scope: this,
                mouseover: this.onRowOver,
                mouseout: this.onRowOut
            });
        }

        if(g.enableDragDrop || g.enableDrag){
            this.dragZone = new Ext.grid.GridDragZone(g, {
                ddGroup : g.ddGroup || 'GridDD'
            });
        }
        this.updateHeaderSortState();
        //kirov
        //Ext.apply(this.columnDrop, this.columnDropConfig);
        //Ext.apply(this.splitZone, this.splitZoneConfig);
    },
    
    //kirov
    splitZoneConfig: {
        allowHeaderDrag: function(e){
            return !e.getTarget(null, null, true).hasClass('ux-grid-hd-group-cell');
        }
    },
    //kirov
    columnDropConfig: {
        getTargetFromEvent: function(e){
            var t = Ext.lib.Event.getTarget(e);
            return this.view.findHeaderCell(t);
        },

        positionIndicator: function(h, n, e){
            var data = this.getDragDropData.call(this, h, n, e);
            if(data === false){
                return false;
            }
            var px = data.px + this.proxyOffsets[0];
            this.proxyTop.setLeftTop(px, data.r.top + this.proxyOffsets[1]);
            this.proxyTop.show();
            this.proxyBottom.setLeftTop(px, data.r.bottom);
            this.proxyBottom.show();
            return data.pt;
        },

        onNodeDrop: function(n, dd, e, data){
            var h = data.header;
            if(h != n){
                var d = this.getDragDropData.call(this, h, n, e);
                if(d === false){
                    return false;
                }
                var cm = this.grid.colModel, right = d.oldIndex < d.newIndex, rows = cm.rows;
                for(var row = d.row, rlen = rows.length; row < rlen; row++){
                    var r = rows[row], len = r.length, fromIx = 0, span = 1, toIx = len;
                    for(var i = 0, gcol = 0; i < len; i++){
                        var group = r[i];
                        if(d.oldIndex >= gcol && d.oldIndex < gcol + group.colspan){
                            fromIx = i;
                        }
                        if(d.oldIndex + d.colspan - 1 >= gcol && d.oldIndex + d.colspan - 1 < gcol + group.colspan){
                            span = i - fromIx + 1;
                        }
                        if(d.newIndex >= gcol && d.newIndex < gcol + group.colspan){
                            toIx = i;
                        }
                        gcol += group.colspan;
                    }
                    var groups = r.splice(fromIx, span);
                    rows[row] = r.splice(0, toIx - (right ? span : 0)).concat(groups).concat(r);
                }
                for(var c = 0; c < d.colspan; c++){
                    var oldIx = d.oldIndex + (right ? 0 : c), newIx = d.newIndex + (right ? -1 : c);
                    cm.moveColumn(oldIx, newIx);
                    this.grid.fireEvent("columnmove", oldIx, newIx);
                }
                return true;
            }
            return false;
        }
    },
    //kirov
    updateGroupStyles: function(col){
        var tables = this.lockedHd.query('.x-grid3-header-offset > table'), tw = this.getLockedWidth(), rows = this.rows;
        var rowGroups = [];
        for(var row = 0; row < tables.length; row++){
            tables[row].style.width = tw;
            if(row < rows.length){
                var cells = tables[row].firstChild.firstChild.childNodes;
                rowGroups[row] = 0;
                for(var i = 0, gcol = 0; i < cells.length; i++){
                    var group = rows[row][i];
                    rowGroups[row] = rowGroups[row]+1;
                    if((typeof col != 'number') || (col >= gcol && col < gcol + group.colspan)){
                        var gs = this.getGroupStyle.call(this, group, gcol);
                        cells[i].style.width = gs.width;
                        cells[i].style.display = gs.hidden ? 'none' : '';
                    }
                    gcol += group.colspan;
                }
            }
        }
        var tables = this.mainHd.query('.x-grid3-header-offset > table'), tw = this.getTotalWidth(), rows = this.rows;
        for(var row = 0; row < tables.length; row++){
            tables[row].style.width = tw;
            if(row < rows.length){
                var cells = tables[row].firstChild.firstChild.childNodes;
                for(var i = 0, gcol = this.cm.getLockedCount(); i < cells.length; i++){
                    var group = rows[row][rowGroups[row]+i];
                    if((typeof col != 'number') || (col >= gcol && col < gcol + group.colspan)){
                        var gs = this.getGroupStyle.call(this, group, gcol);
                        cells[i].style.width = gs.width;
                        cells[i].style.display = gs.hidden ? 'none' : '';
                    }
                    gcol += group.colspan;
                }
            }
        }
    },
    //kirov
    getGroupRowIndex: function(el){
        if(el){
            var m = el.className.match(this.hrowRe);
            if(m && m[1]){
                return parseInt(m[1], 10);
            }
        }
        return this.cm.rows.length;
    },

    layout : function(){
        if(!this.mainBody){
            return;
        }
        var g = this.grid;
        var c = g.getGridEl();
        var csize = c.getSize(true);
        var vw = csize.width;
        if(!g.hideHeaders && (vw < 20 || csize.height < 20)){
            return;
        }
        this.syncHeaderHeight();
        if(g.autoHeight){
            this.scroller.dom.style.overflow = 'visible';
            this.lockedScroller.dom.style.overflow = 'visible';
            if(Ext.isWebKit){
                this.scroller.dom.style.position = 'static';
                this.lockedScroller.dom.style.position = 'static';
            }
        }else{
            this.el.setSize(csize.width, csize.height);
            var hdHeight = this.mainHd.getHeight();
            var vh = csize.height - (hdHeight);
        }
        this.updateLockedWidth();
        if(this.forceFit){
            if(this.lastViewWidth != vw){
                this.fitColumns(false, false);
                this.lastViewWidth = vw;
            }
        }else {
            this.autoExpand();
            this.syncHeaderScroll();
        }
        this.onLayout(vw, vh);
    },
    //kirov
    getGroupSpan: function(row, col){
        if(row < 0){
            return {
                col: 0,
                colspan: this.cm.getColumnCount()
            };
        }
        var r = this.cm.rows[row];
        if(r){
            for(var i = 0, gcol = 0, len = r.length; i < len; i++){
                var group = r[i];
                if(col >= gcol && col < gcol + group.colspan){
                    return {
                        col: gcol,
                        colspan: group.colspan
                    };
                }
                gcol += group.colspan;
            }
            return {
                col: gcol,
                colspan: 0
            };
        }
        return {
            col: col,
            colspan: 1
        };
    },

    getOffsetWidth : function() {
        return (this.cm.getTotalWidth() - this.cm.getTotalLockedWidth() + this.getScrollOffset()) + 'px';
    },

    renderHeaders : function(){
        var cm = this.cm,
            ts = this.templates,
            ct = ts.hcell,
            cb = [], lcb = [],
            p = {},
            len = cm.getColumnCount(),
            last = len - 1;
        for(var i = 0; i < len; i++){
            p.id = cm.getColumnId(i);
            p.value = cm.getColumnHeader(i) || '';
            p.style = this.getColumnStyle(i, true);
            p.tooltip = this.getColumnTooltip(i);
            p.css = (i === 0 ? 'x-grid3-cell-first ' : (i == last ? 'x-grid3-cell-last ' : '')) +
                (cm.config[i].headerCls ? ' ' + cm.config[i].headerCls : '');
            if(cm.config[i].align == 'right'){
                p.istyle = 'padding-right:16px';
            } else {
                delete p.istyle;
            }
            if(cm.isLocked(i)){
                lcb[lcb.length] = ct.apply(p);
            }else{
                cb[cb.length] = ct.apply(p);
            }
        }
        //kirov
	    var ts = this.templates, headers0 = [], headers1 = [], cm = this.cm, rows = this.rows, tstyle = 'width:' + this.getTotalWidth() + ';';
        for(var row = 0, rlen = rows.length; row < rlen; row++){
            var r = rows[row], cells0 = [], cells1 = [];
            for(var i = 0, gcol = 0, len = r.length; i < len; i++){
                var group = r[i];
                group.colspan = group.colspan || 1;
                var id = this.getColumnId(group.dataIndex ? cm.findColumnIndex(group.dataIndex) : gcol), gs = this.getGroupStyle.call(this, group, gcol);
                var cell = ts.gcell.apply({
                    cls: 'ux-grid-hd-group-cell',
                    id: id,
                    row: row,
                    style: 'width:' + gs.width + ';' + (gs.hidden ? 'display:none;' : '') + (group.align ? 'text-align:' + group.align + ';' : ''),
                    tooltip: group.tooltip ? (Ext.QuickTips.isEnabled() ? 'ext:qtip' : 'title') + '="' + group.tooltip + '"' : '',
                    istyle: group.align == 'right' ? 'padding-right:16px' : '',
                    btn: this.grid.enableHdMenu && group.header,
                    value: group.header || '&nbsp;'
                });
                if (cm.isLocked(group.dataIndex ? cm.findColumnIndex(group.dataIndex) : gcol))
                    cells1[i] = cell;
                else
                    cells0[i] = cell;
                gcol += group.colspan;
            }
            headers0[row] = ts.header.apply({
                tstyle: tstyle,
                cells: cells0.join('')
            });
            headers1[row] = ts.header.apply({
                tstyle: tstyle,
                cells: cells1.join('')
            });
        }
        //kirov
        headers0.push(ts.header.apply({cells: cb.join(''), tstyle:'width:'+this.getTotalWidth()+';'}));
        headers1.push(ts.header.apply({cells: lcb.join(''), tstyle:'width:'+this.getLockedWidth()+';'}));
        return [headers0.join(''),headers1.join('')];
    },
    //kirov
    getGroupStyle: function(group, gcol){
        var width = 0, hidden = true;
        for(var i = gcol, len = gcol + group.colspan; i < len; i++){
            if(!this.cm.isHidden(i)){
                var cw = this.cm.getColumnWidth(i);
                if(typeof cw == 'number'){
                    width += cw;
                }
                hidden = false;
            }
        }
        return {
            width: (Ext.isBorderBox || (Ext.isWebKit && !Ext.isSafari2) ? width : Math.max(width - this.borderWidth, 0)) + 'px',
            hidden: hidden
        };
    },
    //kirov
    findHeaderCell: function(el){
        return el ? this.fly(el).findParent('td.x-grid3-hd', this.cellSelectorDepth) : false;
    },
    //kirov
    findHeaderIndex: function(el){
        var cell = this.findHeaderCell(el);
        return cell ? this.getCellIndex(cell) : false;
    },

    updateHeaders : function(){
        var hd = this.renderHeaders();
        this.innerHd.firstChild.innerHTML = hd[0];
        this.innerHd.firstChild.style.width = this.getOffsetWidth();
        this.innerHd.firstChild.firstChild.style.width = this.getTotalWidth();
        this.lockedInnerHd.firstChild.innerHTML = hd[1];
        var lw = this.getLockedWidth();
        this.lockedInnerHd.firstChild.style.width = lw;
        this.lockedInnerHd.firstChild.firstChild.style.width = lw;
    },

    getResolvedXY : function(resolved){
        if(!resolved){
            return null;
        }
        var c = resolved.cell, r = resolved.row;
        return c ? Ext.fly(c).getXY() : [this.scroller.getX(), Ext.fly(r).getY()];
    },

    syncFocusEl : function(row, col, hscroll){
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.syncFocusEl.call(this, row, col, col < this.cm.getLockedCount() ? false : hscroll);
    },

    ensureVisible : function(row, col, hscroll){
        return Ext.ux.grid.LockingHeaderGroupGridView.superclass.ensureVisible.call(this, row, col, col < this.cm.getLockedCount() ? false : hscroll);
    },

    insertRows : function(dm, firstRow, lastRow, isUpdate){
        var last = dm.getCount() - 1;
        if(!isUpdate && firstRow === 0 && lastRow >= last){
            this.refresh();
        }else{
            if(!isUpdate){
                this.fireEvent('beforerowsinserted', this, firstRow, lastRow);
            }
            var html = this.renderRows(firstRow, lastRow),
                before = this.getRow(firstRow);
            if(before){
                if(firstRow === 0){
                    this.removeRowClass(0, this.firstRowCls);
                }
                Ext.DomHelper.insertHtml('beforeBegin', before, html[0]);
                before = this.getLockedRow(firstRow);
                Ext.DomHelper.insertHtml('beforeBegin', before, html[1]);
            }else{
                this.removeRowClass(last - 1, this.lastRowCls);
                Ext.DomHelper.insertHtml('beforeEnd', this.mainBody.dom, html[0]);
                Ext.DomHelper.insertHtml('beforeEnd', this.lockedBody.dom, html[1]);
            }
            if(!isUpdate){
                this.fireEvent('rowsinserted', this, firstRow, lastRow);
                this.processRows(firstRow);
            }else if(firstRow === 0 || firstRow >= last){
                this.addRowClass(firstRow, firstRow === 0 ? this.firstRowCls : this.lastRowCls);
            }
        }
        this.syncFocusEl(firstRow);
    },

    getColumnStyle : function(col, isHeader){
        var style = !isHeader ? this.cm.config[col].cellStyle || this.cm.config[col].css || '' : this.cm.config[col].headerStyle || '';
        style += 'width:'+this.getColumnWidth(col)+';';
        if(this.cm.isHidden(col)){
            style += 'display:none;';
        }
        var align = this.cm.config[col].align;
        if(align){
            style += 'text-align:'+align+';';
        }
        return style;
    },

    getLockedWidth : function() {
        return this.cm.getTotalLockedWidth() + 'px';
    },

    getTotalWidth : function() {
        return (this.cm.getTotalWidth() - this.cm.getTotalLockedWidth()) + 'px';
    },

    getColumnData : function(){
        var cs = [], cm = this.cm, colCount = cm.getColumnCount();
        for(var i = 0; i < colCount; i++){
            var name = cm.getDataIndex(i);
            cs[i] = {
                name : (!Ext.isDefined(name) ? this.ds.fields.get(i).name : name),
                renderer : cm.getRenderer(i),
                id : cm.getColumnId(i),
                style : this.getColumnStyle(i),
                locked : cm.isLocked(i)
            };
        }
        return cs;
    },

    renderBody : function(){
        var markup = this.renderRows() || ['&#160;', '&#160;'];
        return [this.templates.body.apply({rows: markup[0]}), this.templates.body.apply({rows: markup[1]})];
    },

    refreshRow : function(record){
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.refreshRow.call(this, record);
        var index = Ext.isNumber(record) ? record : this.ds.indexOf(record);
        this.getLockedRow(index).rowIndex = index;
    },

    refresh : function(headersToo){
        this.fireEvent('beforerefresh', this);
        this.grid.stopEditing(true);
        var result = this.renderBody();
        this.mainBody.update(result[0]).setWidth(this.getTotalWidth());
        this.lockedBody.update(result[1]).setWidth(this.getLockedWidth());
        if(headersToo === true){
            this.updateHeaders();
            this.updateHeaderSortState();
        }
        this.processRows(0, true);
        this.layout();
        this.applyEmptyText();
        this.fireEvent('refresh', this);
    },

    onDenyColumnLock : function(){

    },

    initData : function(ds, cm){
        if(this.cm){
            this.cm.un('columnlockchange', this.onColumnLock, this);
        }
        Ext.ux.grid.LockingHeaderGroupGridView.superclass.initData.call(this, ds, cm);
        if(this.cm){
            this.cm.on('columnlockchange', this.onColumnLock, this);
        }
    },

    onColumnLock : function(){
        this.refresh(true);
    },

    handleHdMenuClick : function(item){
        var index = this.hdCtxIndex,
            cm = this.cm,
            id = item.getItemId(),
            llen = cm.getLockedCount();
        switch(id){
            case 'lock':
                if(cm.getColumnCount(true) <= llen + 1){
                    this.onDenyColumnLock();
                    return;
                }
                cm.setLocked(index, true);
                if(llen != index){
                    cm.moveColumn(index, llen);
                    this.grid.fireEvent('columnmove', index, llen);
                }
            break;
            case 'unlock':
                if(llen - 1 != index){
                    cm.setLocked(index, false, true);
                    cm.moveColumn(index, llen - 1);
                    this.grid.fireEvent('columnmove', index, llen - 1);
                }else{
                    cm.setLocked(index, false);
                }
            break;
            default:
                return Ext.ux.grid.LockingHeaderGroupGridView.superclass.handleHdMenuClick.call(this, item);
        }
        return true;
    },

    handleHdDown : function(e, t){
        //kirov
        //Ext.ux.grid.LockingHeaderGroupGridView.superclass.handleHdDown.call(this, e, t);
        var el = Ext.get(t);
        if(el.hasClass('x-grid3-hd-btn')){
            e.stopEvent();
            var hd = this.findHeaderCell(t);
            Ext.fly(hd).addClass('x-grid3-hd-menu-open');
            var index = this.getCellIndex(hd);
            this.hdCtxIndex = index;
            var ms = this.hmenu.items, cm = this.cm;
            ms.get('asc').setDisabled(!cm.isSortable(index));
            ms.get('desc').setDisabled(!cm.isSortable(index));
            this.hmenu.on('hide', function(){
                Ext.fly(hd).removeClass('x-grid3-hd-menu-open');
            }, this, {
                single: true
            });
            this.hmenu.show(t, 'tl-bl?');
        }else if(el.hasClass('ux-grid-hd-group-cell') || Ext.fly(t).up('.ux-grid-hd-group-cell')){
            e.stopEvent();
        }

        if(this.grid.enableColLock !== false){
            if(Ext.fly(t).hasClass('x-grid3-hd-btn')){
                var hd = this.findHeaderCell(t),
                    index = this.getCellIndex(hd),
                    ms = this.hmenu.items, cm = this.cm;
                ms.get('lock').setDisabled(cm.isLocked(index));
                ms.get('unlock').setDisabled(!cm.isLocked(index));
            }
        }
    },
    //kirov
    handleHdOver: function(e, t){
        var hd = this.findHeaderCell(t);
        if(hd && !this.headersDisabled){
            this.activeHdRef = t;
            this.activeHdIndex = this.getCellIndex(hd);
            var fly = this.fly(hd);
            this.activeHdRegion = fly.getRegion();
            if(!(this.cm.isMenuDisabled(this.activeHdIndex) || fly.hasClass('ux-grid-hd-group-cell'))){
                fly.addClass('x-grid3-hd-over');
                this.activeHdBtn = fly.child('.x-grid3-hd-btn');
                if(this.activeHdBtn){
                    this.activeHdBtn.dom.style.height = (hd.firstChild.offsetHeight - 1) + 'px';
                }
            }
        }
    },
    //kirov
    handleHdOut: function(e, t){
        var hd = this.findHeaderCell(t);
        if(hd && (!Ext.isIE || !e.within(hd, true))){
            this.activeHdRef = null;
            this.fly(hd).removeClass('x-grid3-hd-over');
            hd.style.cursor = '';
        }
    },

    syncHeaderHeight: function(){
        this.innerHd.firstChild.firstChild.style.height = 'auto';
        this.lockedInnerHd.firstChild.firstChild.style.height = 'auto';
        var hd = this.innerHd.firstChild.firstChild.offsetHeight,
            lhd = this.lockedInnerHd.firstChild.firstChild.offsetHeight,
            height = (lhd > hd ? lhd : hd) + 'px';
        this.innerHd.firstChild.firstChild.style.height = height;
        this.lockedInnerHd.firstChild.firstChild.style.height = height;
    },

    updateLockedWidth: function(){
        var lw = this.cm.getTotalLockedWidth(),
            tw = this.cm.getTotalWidth() - lw,
            csize = this.grid.getGridEl().getSize(true),
            lp = Ext.isBorderBox ? 0 : this.lockedBorderWidth,
            rp = Ext.isBorderBox ? 0 : this.rowBorderWidth,
            vw = (csize.width - lw - lp - rp) + 'px',
            so = this.getScrollOffset();
        if(!this.grid.autoHeight){
            var vh = (csize.height - this.mainHd.getHeight()) + 'px';
            this.lockedScroller.dom.style.height = vh;
            this.scroller.dom.style.height = vh;
        }
        this.lockedWrap.dom.style.width = (lw + rp) + 'px';
        this.scroller.dom.style.width = vw;
        this.mainWrap.dom.style.left = (lw + lp + rp) + 'px';
        if(this.innerHd){
            this.lockedInnerHd.firstChild.style.width = lw + 'px';
            this.lockedInnerHd.firstChild.firstChild.style.width = lw + 'px';
            this.innerHd.style.width = vw;
            this.innerHd.firstChild.style.width = (tw + rp + so) + 'px';
            this.innerHd.firstChild.firstChild.style.width = tw + 'px';
        }
        if(this.mainBody){
            this.lockedBody.dom.style.width = (lw + rp) + 'px';
            this.mainBody.dom.style.width = (tw + rp) + 'px';
        }
    }
});

Ext.ux.grid.LockingGroupColumnModel = Ext.extend(Ext.grid.ColumnModel, {
    /**
     * Returns true if the given column index is currently locked
     * @param {Number} colIndex The column index
     * @return {Boolean} True if the column is locked
     */
    isLocked : function(colIndex){
        return this.config[colIndex].locked === true;
    },

    /**
     * Locks or unlocks a given column
     * @param {Number} colIndex The column index
     * @param {Boolean} value True to lock, false to unlock
     * @param {Boolean} suppressEvent Pass false to cause the columnlockchange event not to fire
     */
    setLocked : function(colIndex, value, suppressEvent){
        if (this.isLocked(colIndex) == value) {
            return;
        }
        this.config[colIndex].locked = value;
        if (!suppressEvent) {
            this.fireEvent('columnlockchange', this, colIndex, value);
        }
    },

    /**
     * Returns the total width of all locked columns
     * @return {Number} The width of all locked columns
     */
    getTotalLockedWidth : function(){
        var totalWidth = 0;
        for (var i = 0, len = this.config.length; i < len; i++) {
            if (this.isLocked(i) && !this.isHidden(i)) {
                totalWidth += this.getColumnWidth(i);
            }
        }

        return totalWidth;
    },

    /**
     * Returns the total number of locked columns
     * @return {Number} The number of locked columns
     */
    getLockedCount : function() {
        var len = this.config.length;

        for (var i = 0; i < len; i++) {
            if (!this.isLocked(i)) {
                return i;
            }
        }

        //if we get to this point all of the columns are locked so we return the total
        return len;
    },

    /**
     * Moves a column from one position to another
     * @param {Number} oldIndex The current column index
     * @param {Number} newIndex The destination column index
     */
    moveColumn : function(oldIndex, newIndex){
        var oldLocked = this.isLocked(oldIndex),
            newLocked = this.isLocked(newIndex);

        if (oldIndex < newIndex && oldLocked && !newLocked) {
            this.setLocked(oldIndex, false, true);
        } else if (oldIndex > newIndex && !oldLocked && newLocked) {
            this.setLocked(oldIndex, true, true);
        }

        Ext.ux.grid.LockingGroupColumnModel.superclass.moveColumn.apply(this, arguments);
    }
});

Ext.namespace('Ext.ux.Ribbon');

Ext.ux.Ribbon = Ext.extend(Ext.TabPanel, {

    titleId: null,

    constructor: function(config){
        this.titleId = new Array();

        Ext.apply(config, {
            baseCls: "x-plain ui-ribbon",
            margins: "0 0 0 0",
            // plugins: new Ext.ux.TabScrollerMenu({
            //     maxText: 15,
            //     pageSize: 5
            // }),
            //enableTabScroll: true,
            plain: true,
            border: false,
            deferredRender: false,
            layoutOnTabChange: true,
            title: '',
            //collapsible: true,
            activeTab: 0,
            listeners: {
                beforetabchange: function(tp, ntb, ctb){
                    tp.expand();
                },
                afterrender: {
                    scope: this,
                    fn: function(){
                        //this.expand();
                        //this.doLayout();
                        if (this.titleId.length > 0){
                            for (var key = 0; key < this.titleId.length; key++){
                                r = Ext.get(this.titleId[key].id);
                                if (r)
                                r.on('click', this.titleId[key].fn);
                            }
                        }
                    }
                }
            }
        });

        Ext.apply(this, Ext.apply(this.initialConfig, config));

        if (config.items){
            for (var i = 0; i < config.items.length; i++)
            this.initRibbon(config.items[i], i);
        }

        Ext.ux.Ribbon.superclass.constructor.apply(this, arguments);
        
    },

    initRibbon: function(item, index){
        var tbarr = new Array();
        for (var j = 0; j < item.ribbon.length; j++){
            // for (var i = 0; i < item.ribbon[j].items.length; i++){
            //                             if (item.ribbon[j].items[i].scale !== "small"){
            //                                 item.ribbon[j].items[i].text = String(item.ribbon[j].items[i].text).replace(/[ +]/gi, "<br/>");
            //                             }
            //                         }
            c = {
                xtype: "buttongroup",
                cls: "x-btn-group-ribbonstyle",
                defaults: {
                    scale: "small",
                    iconAlign: "left",
                    minWidth: 40
                },
                items: item.ribbon[j].items
            };

            title = item.ribbon[j].title || '';
            topTitle = item.ribbon[j].topTitle || false;
            onTitleClick = item.ribbon[j].onTitleClick || false;

            if (onTitleClick){
                titleId = 'ux-ribbon-' + Ext.id();
                title = '<span id="' + titleId + '" style="cursor:pointer;">' + title + '</span>';
                this.titleId.push({
                    id: titleId,
                    fn: onTitleClick
                });
            }
            if (title !== ''){
                if (!topTitle){
                    Ext.apply(c, {
                        footerCfg: {
                            cls: "x-btn-group-header x-unselectable",
                            tag: "span",
                            html: title
                        }
                    });
                } else{
                    Ext.apply(c, {
                        title: title
                    });
                }
            }

            cfg = item.ribbon[j].cfg || null;

            if (cfg){
                Ext.applyIf(c, item.ribbon[j].cfg);
                if (cfg.defaults)
                Ext.apply(c.defaults, cfg.defaults);
            }

            tbarr.push(c);
        }

        Ext.apply(item, {
            baseCls: "x-plain",
            tbar: tbarr
        });
    }
});
/**
 * Содержит общие функции вызываемые из разных частей
 */
Ext.QuickTips.init();

/**
 * Чтобы ie и прочие не правильные браузеры, где нет console не падали
 */
if (typeof console == "undefined") var console = { log: function() {} };

Ext.namespace('Ext.m3');


var SOFTWARE_NAME = 'Платформа М3';

/**
 *  Реализация стандартного assert
 * @param {Boolean} condition
 * @param {Str} errorMsg
 */
function assert(condition, errorMsg) {
  if (!condition) {
      console.error(errorMsg);
      throw new Error(errorMsg);
  }
}

/**
 * 
 * @param {Object} text
 */
function smart_eval(text){
	if( text == undefined ){
	    // на случай, когда в процессе получения ответа сервера произошел аборт
		return;
	}
	if(text.substring(0,1) == '{'){
		// это у нас json объект
		var obj = Ext.util.JSON.decode(text);
		if(!obj){
			return;
		}
		if(obj.code){
			var eval_result = obj.code();
			if( eval_result &&  eval_result instanceof Ext.Window && typeof AppDesktop != 'undefined' && AppDesktop){
				AppDesktop.getDesktop().createWindow(eval_result);
			}
			return eval_result;
		}
		else
		{
    		if(obj.message && obj.message != ''){
    			Ext.Msg.show({title:'Внимание', msg: obj.message, buttons:Ext.Msg.OK, icon: (obj.success!=undefined && !obj.success ? Ext.Msg.WARNING : Ext.Msg.Info)});
    			return;
    		}
		}
	}
	else{
	    try{ 
		    var eval_result = eval(text);
		} catch (e) {
		     Ext.Msg.show({
                title:'Внимание'
                ,msg:'Произошла непредвиденная ошибка!'
                ,buttons: Ext.Msg.OK
                ,fn: Ext.emptyFn
                ,animEl: 'elId'
                ,icon: Ext.MessageBox.WARNING
            });
		    throw e;
		}
		if( eval_result &&  eval_result instanceof Ext.Window && typeof AppDesktop != 'undefined' && AppDesktop){
			AppDesktop.getDesktop().createWindow(eval_result);
		}
		return eval_result;
	}
}

Ext.ns('Ext.app.form');
/**
 * Модифицированный контрол поиска, за основу был взят контрол от ui.form.SearchField
 * @class {Ext.app.form.SearchField} Контрол поиска
 * @extends {Ext.form.TwinTriggerField} Абстрактный класс как раз для разного рода таких вещей, типа контрола поиска
 */
Ext.app.form.SearchField = Ext.extend(Ext.form.TwinTriggerField, {
    initComponent : function(){
        Ext.app.form.SearchField.superclass.initComponent.call(this);
        this.on('specialkey', function(f, e){
            if(e.getKey() == e.ENTER){
                this.onTrigger2Click();
            }
        }, this);
    }

    ,validationEvent:false
    ,validateOnBlur:false
    ,trigger1Class:'x-form-clear-trigger'
    ,trigger2Class:'x-form-search-trigger'
    ,hideTrigger1:true
    ,width:180
    ,hasSearch : false
    ,paramName : 'filter'
	,paramId: 'id'
	,nodeId:'-1'
    
    ,onTrigger1Click : function(e, html, arg){
        if(this.hasSearch){
        	this.el.dom.value = '';
        	var cmp = this.getComponentForSearch();
        	if (cmp instanceof Ext.grid.GridPanel) {
	            var o = {start: 0};
	            var store = cmp.getStore();
	            store.baseParams = store.baseParams || {};
	            store.baseParams[this.paramName] = '';
				store.baseParams[this.paramId] = this.nodeId || '';	
	            store.reload({params:o});

	        } else if (cmp instanceof Ext.ux.tree.TreeGrid) {
	        	this.el.dom.value = '';
	        	
	        	var loader = cmp.getLoader();
	        	loader.baseParams = loader.baseParams || {};
	        	loader.baseParams[this.paramName] = '';
	        	var rootNode = cmp.getRootNode();
	        	loader.load(rootNode);
	        	rootNode.expand();
	        };
	        this.triggers[0].hide();
	        this.hasSearch = false;
        }
    }

    ,onTrigger2Click : function(e, html, arg){
        var value = this.getRawValue();
        var cmp = this.getComponentForSearch();
        if (cmp instanceof Ext.grid.GridPanel) {
            var o = {start: 0};
            var store = cmp.getStore();
	        store.baseParams = store.baseParams || {};
	        store.baseParams[this.paramName] = value;
	        store.baseParams[this.paramId] = this.nodeId || '';	
	        store.reload({params:o});
        } else if (cmp instanceof Ext.ux.tree.TreeGrid) {
        	var loader = cmp.getLoader();
        	loader.baseParams = loader.baseParams || {};
	        loader.baseParams[this.paramName] = value;
        	var rootNode = cmp.getRootNode();
        	loader.load(rootNode);
        	rootNode.expand();
        	//console.log(rootNode);
        };
        if (value) {
        	this.hasSearch = true;
	    	this.triggers[0].show();
        }
    }
    
    ,clear : function(node_id){ this.onTrigger1Click() }
    ,search: function(node_id){ this.onTrigger2Click() }
});
/**
 * В поле добавим функционал отображения того, что оно изменено.
 */
Ext.override(Ext.form.Field, {
	/**
	 * Признак, что поле используется для изменения значения, 
	 * а не для навигации - при Истине будут повешаны обработчики на изменение окна
	 * */ 
	isEdit: true,
	isModified: false,
	updateLabel: function() {
		this.setFieldLabel(this.fieldLabel);
	},
	setFieldLabel : function(text) {
		if ( text != undefined ) {
	    	if (this.rendered) {
	      		var newtext = text+':';
	      		if (this.isModified) {newtext = '<span style="color:darkmagenta;">' + newtext + '</span>'; };
		  		//if (this.isModified) {newtext = '<span">*</span>' + newtext; };
				var lab = this.el.up('.x-form-item', 10, true);
				if (lab) {
					lab.child('.x-form-item-label').update(newtext);
				}
	    	}
	    	this.fieldLabel = text;
		}
	},
	// переопределим клавишу ENTER для применения изменений поля
	fireKey : function(e){
        if(e.isSpecialKey()){
			if (e.getKey() == e.ENTER) {
				// этот метод делает применение изменений
				this.onBlur();
			};
            this.fireEvent('specialkey', this, e);
        }
    }
});

/**
 * Создаётся новый компонент: Панель с возможностью включения в заголовок
 * визуальных компонентов.
 */
Ext.app.TitlePanel = Ext.extend(Ext.Panel, {
   titleItems: null,
   addTitleItem: function (itemConfig) { 
       var item = Ext.ComponentMgr.create(itemConfig);
       var itemsDiv = Ext.DomHelper.append(this.header, {tag:"div", style:"float:right;margin-top:-4px;margin-left:3px;"}, true);
       item.render(itemsDiv);
   },
   onRender: function (ct, position) {
       Ext.app.TitlePanel.superclass.onRender.apply(this, arguments);
       if (this.titleItems != null) {
           if(Ext.isArray(this.titleItems)){
               for (var i = this.titleItems.length-1; i >= 0 ; i--) {
                   this.addTitleItem(this.titleItems[i]);
               }
           } else {
               this.addTitleItems(this.titleItems);
           }
           
           if (this.header)
               this.header.removeClass('x-unselectable');
       };
   },
   getChildByName: function (name) {
       if (this.items)
           for (var i = 0;  i < this.items.length; i++)
               if (this.items.items[i].name == name)
                   return this.items.items[i];

       if (this.titleItems)
           for (var i = 0; i < this.titleItems.length; i++)
               if (this.titleItems[i].name == name)
                   return this.titleItems[i];

       return null;
    }
});


/*
 * выполняет обработку failure response при submit пользовательских форм
 * context.action -- объект, передаваемый из failure handle
 * context.title -- заголовок окон с сообщением об ошибке
 * context.message -- текст в случае, если с сервера на пришло иного сообщения об ошибке
 */
function uiFailureResponseOnFormSubmit(context){
    if(context.action.failureType=='server'){
        obj = Ext.util.JSON.decode(context.action.response.responseText);
        Ext.Msg.show({title: context.title,
            msg: obj.error_msg,
            buttons: Ext.Msg.OK,
            icon: Ext.Msg.WARNING});
    }else{
        Ext.Msg.alert(context.title, context.message);
    }
}

/*
 * Если функция вызвана без параметров, то будет выдано простое сообщение об ошибке
 * Если передан параметр респонс, то будет нарисовано экстовое окно и в нем отображен
 * респонс сервера(предназначено для отладки серверных ошибок)
*/
function uiAjaxFailMessage (response, opt) {
	
	if (Ext.isEmpty(response)) {
		Ext.Msg.alert(SOFTWARE_NAME, 'Извините, сервер временно не доступен.');
		return;
	}
	
	if (opt['failureType'] === "server"){ 
	    // Пришел OperationResult('success':False)
	    if (opt && opt.response && opt.response.responseText) {
	        smart_eval( opt.response.responseText );
	    }	    	    
	} else {
    	var bodySize = Ext.getBody().getViewSize(),
    		width = (bodySize.width < 500) ? bodySize.width - 50 : 500,
    		height = (bodySize.height < 300) ? bodySize.height - 50 : 300,
    		win;
        
        // Для submit'a response приходит вторым параметром
        if (!response.responseText && opt && opt.response){
            response = opt.response;
        }
    	var errorMsg = response.responseText;
	
    	var win = new Ext.Window({ modal: true, width: width, height: height, 
    	    title: "Request Failure", layout: "fit", maximizable: true, 
    	    maximized: true,
    		listeners : {
    			"maximize" : {
    				fn : function (el) {
    					var v = Ext.getBody().getViewSize();
    					el.setSize(v.width, v.height);
    				},
    				scope : this
    			},
    
    			"resize" : {
    				fn : function (wnd) {
    					var editor = Ext.getCmp("__ErrorMessageEditor");
    					var sz = wnd.body.getViewSize();
    					editor.setSize(sz.width, sz.height - 42);
    				}
    			}
    		},
    		items : new Ext.form.FormPanel({
    			baseCls : "x-plain",
    			layout  : "absolute",
    			defaultType : "label",
    			items : [
    				{x: 5,y: 5,
    					html : '<div class="x-window-dlg"><div class="ext-mb-error" style="width:32px;height:32px"></div></div>'
    				},
    				{x: 42,y: 6,
    					html : "<b>Status Code: </b>"
    				},
    				{x: 125,y: 6,
    					text : response.status
    				},
    				{x: 42,y: 25,
    					html : "<b>Status Text: </b>"
    				},
    				{x: 125,y: 25,
    					text : response.statusText
    				},
    				{x: 0,y: 42,
    					id : "__ErrorMessageEditor",
    					xtype    : "htmleditor",
    					value    : errorMsg,
    					readOnly : true,
    					enableAlignments : false,
    					enableColors     : false,
    					enableFont       : false,
    					enableFontSize   : false,
    					enableFormat     : false,
    					enableLinks      : false,
    					enableLists      : false,
    					enableSourceEdit : false,
    					listeners         : {
    						"push" : {
    							fn : function(self,html) {
    								
    								// событие возникает когда содержимое iframe становится доступно
    								
    								function fixDjangoPageScripts(doc) {
    									//грязный хак - эвалим скрипты в iframe 
    									
    									try {																				
    										var scripts = doc.getElementsByTagName('script');
    										for (var i = 0; i < scripts.length;i++) {
    											if (scripts[i].innerText) {
    												this.eval(scripts[i].innerText);
    											}
    											else {
    												this.eval(scripts[i].textContent);
    											}
    										}	
    																			
    										//и скрыта подробная информация, тк document.onLoad не будет
    										//вызвано
    										this.hideAll(this.getElementsByClassName(doc, 'table', 'vars'));
    										this.hideAll(this.getElementsByClassName(doc, 'ol', 'pre-context'));
    										this.hideAll(this.getElementsByClassName(doc, 'ol', 'post-context'));
    										this.hideAll(this.getElementsByClassName(doc, 'div', 'pastebin'));
    										
    									}
    									catch(er) {
    										//
    									}
    								}
    								
    								//магия - меняем объект исполнения на window из iframe
    								fixDjangoPageScripts.call(this.iframe.contentWindow, this.iframe.contentDocument);
    								//TO DO: нужно еще поправлять стили странички в IE и Сафари
    							}
    						}
    					
    					}
    				}
    			]
    		})
    	});
    
    	win.show();
	}
}

// Проверяет есть ли в ответе сообщение и выводит его
// Возвращает серверный success
function uiShowErrorMessage(response){
	obj = Ext.util.JSON.decode(response.responseText);
	if (obj.error_msg)
		Ext.Msg.alert(SOFTWARE_NAME, obj.error_msg);
// Не понятно зачем нужен этот код.
//	if (obj.code)
//		alert('Пришел код на выполнение ' + obj.code);
	return obj.success;
}

/**
 * Генерирует запрос на сервер по переданному url
 * @param {String} url URL запроса на получение формы
 * @param {Object} desktop Объект типа AppDesktop.getDesktop()
 * @param {Object} параметры запроса
 */
function sendRequest(url, desktop, params){                     
    var mask = new Ext.LoadMask(Ext.getBody());
    mask.show();
    Ext.Ajax.request({
    	params: params,
        url: url,
        method: 'POST',
        success: function(response, options){
            try{             
                smart_eval(response.responseText);
            } finally { 
                mask.hide();
            }
        }, 
        failure: function(){            
            uiAjaxFailMessage.apply(this, arguments);
            mask.hide();
        }
    });
}

/**
 * Для правильного отображения колонок в гриде для цен и сумм
 * Использовать в качестве renderer в колонке грида
 * param Значение в колонке
 */
 function thousandCurrencyRenderer(val) {
    if (typeof (val) != 'number') {
        var num = val;
        try { num = parseFloat(val.replace(/,+/, ".").replace(/\s+/g, "")); }
        catch (ex) { num = NaN; }

        if (isNaN(num)) {
            return val;
        }
        else {
            val = num;
        }
    }

    var retVal = "";
    var x = val.toFixed(2).split('.');
    var real = x[0];
    var decimal = x[1];
    var g = 0;
    var i = 0;
    
    var offset = real.length % 3;
	
	if (offset != 0) {
		for (i; i < offset; i++) {
			retVal += real.charAt(i);
		}
		retVal += ' ';
	}
	
    for (i; i < real.length; i++) {
        if (g % 3 == 0 && g != 0) {
            retVal += ' ';
        }
        retVal += real.charAt(i);
        g++;

    }

    if (decimal) {
        retVal += ',' + decimal;
    }

    retVal = retVal.replace(/\s,/, ",");

    return retVal;
}


/**
 * Расширенный функционал комбобокса
 */

Ext.m3.ComboBox =  Ext.extend(Ext.form.ComboBox,{
	/**
	 * Возвращает текстовое представление комбобокса
	 */
	getText: function(){
		return this.lastSelectionText;
	}
})
/**
 * Расширенный грид на базе Ext.grid.GridPanel
 * @param {Object} config
 */
Ext.m3.GridPanel = Ext.extend(Ext.grid.GridPanel, {
	constructor: function(baseConfig, params){
//		console.log(baseConfig);
//		console.log(params);
		
		// Добавлене selection model если нужно
		var selModel = params.selModel;
		var gridColumns = params.colModel || [];
		if (selModel && selModel instanceof Ext.grid.CheckboxSelectionModel) {
			gridColumns.columns.unshift(selModel);
		}
		
		// Навешивание обработчиков на контекстное меню если нужно 
		var funcContMenu;
		if (params.menus.contextMenu && 
			params.menus.contextMenu instanceof Ext.menu.Menu) {
			
			funcContMenu = function(e){
				e.stopEvent();
	            params.menus.contextMenu.showAt(e.getXY())
			}
		} else {
			funcContMenu = Ext.emptyFn;
		}
		
		var funcRowContMenu;
		if (params.menus.rowContextMenu && 
			params.menus.rowContextMenu instanceof Ext.menu.Menu) {
			
			funcRowContMenu = function(grid, index, e){
				e.stopEvent();
                this.getSelectionModel().selectRow(index);
                params.menus.rowContextMenu.showAt(e.getXY())
			}
		} else {
			funcRowContMenu = Ext.emptyFn;
		}
		
		var plugins = params.plugins || [];
		var bundedColumns = params.bundedColumns;
		if (bundedColumns && bundedColumns instanceof Array &&
			bundedColumns.length > 0) {

			plugins.push( 
				new Ext.ux.grid.ColumnHeaderGroup({
					rows: bundedColumns
				})
			);
		}
		
		// объединение обработчиков
		baseConfig.listeners = Ext.applyIf({
			contextmenu: funcContMenu
			,rowcontextmenu: funcRowContMenu
			,beforerender: function(){
				var bbar = this.getBottomToolbar();
				if (bbar && bbar instanceof Ext.PagingToolbar){
					var store = this.getStore();
					store.setBaseParam('start',0);
					store.setBaseParam('limit',bbar.pageSize);
					bbar.bind(store);
				}
			}	
		}
		,baseConfig.listeners || {});

		var config = Ext.applyIf({
			sm: selModel
			,colModel: gridColumns
			,plugins: plugins
		}, baseConfig);
		
		Ext.m3.GridPanel.superclass.constructor.call(this, config);
	}
	,initComponent: function(){
		Ext.m3.GridPanel.superclass.initComponent.call(this);
		var store = this.getStore();
		store.on('exception', this.storeException, this);
	}
	/**
	 * Обработчик исключений хранилица
	 */
	,storeException: function (proxy, type, action, options, response, arg){
		//console.log(proxy, type, action, options, response, arg);
		uiAjaxFailMessage(response, options);
	}
});

Ext.m3.EditorGridPanel = Ext.extend(Ext.grid.EditorGridPanel, {
  constructor: function(baseConfig, params){
//    console.log(baseConfig);
//    console.log(params);
    
    // Добавлене selection model если нужно
    var selModel = params.selModel;
    var gridColumns = params.colModel || [];
    if (selModel && selModel instanceof Ext.grid.CheckboxSelectionModel) {
      gridColumns.unshift(selModel);
    }
    
    // Навешивание обработчиков на контекстное меню если нужно 
    var funcContMenu;
    if (params.menus.contextMenu && 
      params.menus.contextMenu instanceof Ext.menu.Menu) {
      
      funcContMenu = function(e){
        e.stopEvent();
              params.menus.contextMenu.showAt(e.getXY())
      }
    } else {
      funcContMenu = Ext.emptyFn;
    }
    
    var funcRowContMenu;
    if (params.menus.rowContextMenu && 
      params.menus.contextMenu instanceof Ext.menu.Menu) {
      
      funcRowContMenu = function(grid, index, e){
        e.stopEvent();
                this.getSelectionModel().selectRow(index);
                params.menus.rowContextMenu.showAt(e.getXY())
      }
    } else {
      funcRowContMenu = Ext.emptyFn;
    }
    
    var plugins = params.plugins || [];
    var bundedColumns = params.bundedColumns;
    if (bundedColumns && bundedColumns instanceof Array &&
      bundedColumns.length > 0) {

      plugins.push( 
        new Ext.ux.grid.ColumnHeaderGroup({
          rows: bundedColumns
        })
      );
    }
    
    // объединение обработчиков
    baseConfig.listeners = Ext.applyIf({
      contextmenu: funcContMenu
      ,rowcontextmenu: funcRowContMenu
      ,beforerender: function(){
        var bbar = this.getBottomToolbar();
        if (bbar && bbar instanceof Ext.PagingToolbar){
          var store = this.getStore();
          store.setBaseParam('start',0);
          store.setBaseParam('limit',bbar.pageSize);
          bbar.bind(store);
        }
      } 
    }
    ,baseConfig.listeners || {});

    var config = Ext.applyIf({
      sm: selModel
      ,colModel: gridColumns
      ,plugins: plugins
    }, baseConfig);
    
    Ext.m3.EditorGridPanel.superclass.constructor.call(this, config);
  }
	,initComponent: function(){
		Ext.m3.EditorGridPanel.superclass.initComponent.call(this);
		var store = this.getStore();
		store.on('exception', this.storeException, this);
	}
	/**
	 * Обработчик исключений хранилица
	 */
	,storeException: function (proxy, type, action, options, response, arg){
		//console.log(proxy, type, action, options, response, arg);
		if (type == 'remote' && action != Ext.data.Api.actions.read) {
		  if (response.raw.message) {
  		  Ext.Msg.show({
  		    title: 'Внимание!',
  		    msg: response.raw.message,
  		    buttons: Ext.Msg.CANCEL,
  		    icon: Ext.Msg.WARNING
  		  });
  		};
		} else {
		  uiAjaxFailMessage(response, options);
		};
	}
});
if (Ext.version == '3.0') {
    Ext.override(Ext.grid.GridView, {
        ensureVisible : function(row, col, hscroll) {
        
            var resolved = this.resolveCell(row, col, hscroll);
            if(!resolved || !resolved.row){
                return;
            }

            var rowEl = resolved.row, 
                cellEl = resolved.cell,
                c = this.scroller.dom,
                ctop = 0,
                p = rowEl, 
                stop = this.el.dom;
            
            var p = rowEl, stop = this.el.dom;
            while(p && p != stop){
                ctop += p.offsetTop;
                p = p.offsetParent;
            }
            ctop -= this.mainHd.dom.offsetHeight;
        
            var cbot = ctop + rowEl.offsetHeight;
        
            var ch = c.clientHeight;
            var stop = parseInt(c.scrollTop, 10);
            var sbot = stop + ch;
    
            if(ctop < stop){
              c.scrollTop = ctop;
            }else if(cbot > sbot){
                c.scrollTop = cbot-ch;
            }
    
            if(hscroll !== false){
                var cleft = parseInt(cellEl.offsetLeft, 10);
                var cright = cleft + cellEl.offsetWidth;
    
                var sleft = parseInt(c.scrollLeft, 10);
                var sright = sleft + c.clientWidth;
                if(cleft < sleft){
                    c.scrollLeft = cleft;
                }else if(cright > sright){
                    c.scrollLeft = cright-c.clientWidth;
                }
            }
            return this.getResolvedXY(resolved);
        }
    });
}

Ext.namespace('Ext.ux.maximgb.tg');

/**
 * This class shouldn't be created directly use NestedSetStore or AdjacencyListStore instead.
 *
 * @abstract
 */
Ext.ux.maximgb.tg.AbstractTreeStore = Ext.extend(Ext.data.Store,
{
    /**
     * @cfg {String} is_leaf_field_name Record leaf flag field name.
     */
    leaf_field_name : '_is_leaf',
    
    /**
     * Current page offset.
     *
     * @access private
     */
    page_offset : 0,
    
    /**
     * Current active node. 
     *
     * @access private
     */
    active_node : null,
    
    /**
     * @constructor
     */
    constructor : function(config)
    {
        Ext.ux.maximgb.tg.AbstractTreeStore.superclass.constructor.call(this, config);
        
        if (!this.paramNames.active_node) {
            this.paramNames.active_node = 'anode';
        }
        
        this.addEvents(
            /**
             * @event beforeexpandnode
             * Fires before node expand. Return false to cancel operation.
             * param {AbstractTreeStore} this
             * param {Record} record
             */
            'beforeexpandnode',
            /**
             * @event expandnode
             * Fires after node expand.
             * param {AbstractTreeStore} this
             * param {Record} record
             */
            'expandnode',
            /**
             * @event expandnodefailed
             * Fires when expand node operation is failed.
             * param {AbstractTreeStore} this
             * param {id} Record id
             * param {Record} Record, may be undefined 
             */
            'expandnodefailed',
            /**
             * @event beforecollapsenode
             * Fires before node collapse. Return false to cancel operation.
             * param {AbstractTreeStore} this
             * param {Record} record
             */
            'beforecollapsenode',
            /**
             * @event collapsenode
             * Fires after node collapse.
             * param {AbstractTreeStore} this
             * param {Record} record
             */
            'collapsenode',
            /**
             * @event beforeactivenodechange
             * Fires before active node change. Return false to cancel operation.
             * param {AbstractTreeStore} this
             * param {Record} old active node record
             * param {Record} new active node record
             */
            'beforeactivenodechange',
            /**
             * @event activenodechange
             * Fires after active node change.
             * param {AbstractTreeStore} this
             * param {Record} old active node record
             * param {Record} new active node record
             */
            'activenodechange'
        );
    },  

    // Store methods.
    // -----------------------------------------------------------------------------------------------  
    /**
     * Removes record and all its descendants.
     *
     * @access public
     * @param {Record} record Record to remove.
     */
    remove : function(record)
    {
        // ----- Modification start
        if (record === this.active_node) {
            this.setActiveNode(null);
        }
        this.removeNodeDescendants(record);
        // ----- End of modification        
        Ext.ux.maximgb.tg.AbstractTreeStore.superclass.remove.call(this, record);
    },
    
    /**
     * Removes node descendants.
     *
     * @access private
     */
    removeNodeDescendants : function(rc)
    {
        var i, len, children = this.getNodeChildren(rc);
        for (i = 0, len = children.length; i < len; i++) {
            this.remove(children[i]);
        }
    },
    
    /**
     * Loads current active record data.
     */
    load : function(options)
    {
        if (options) {
            if (options.params) {
                if (options.params[this.paramNames.active_node] === undefined) {
                    options.params[this.paramNames.active_node] = this.active_node ? this.active_node.id : null;
                }
            }
            else {
                options.params = {};
                options.params[this.paramNames.active_node] = this.active_node ? this.active_node.id : null;
            }
        }
        else {
            options = {params: {}};
            options.params[this.paramNames.active_node] = this.active_node ? this.active_node.id : null;
        }

        if (options.params[this.paramNames.active_node] !== null) {
            options.add = true;
        }

        return Ext.ux.maximgb.tg.AbstractTreeStore.superclass.load.call(this, options); 
    },
    
    /**
     * Called as a callback by the Reader during load operation.
     *
     * @access private
     */
    loadRecords : function(o, options, success)
    {
        if (!o || success === false) {
            if (success !== false) {
                this.fireEvent("load", this, [], options);
            }
            if (options.callback) {
                options.callback.call(options.scope || this, [], options, false);
            }
            return;
        }
    
        var r = o.records, t = o.totalRecords || r.length,  
            page_offset = this.getPageOffsetFromOptions(options),
            loaded_node_id = this.getLoadedNodeIdFromOptions(options), 
            loaded_node, i, len, prev_record, record, idx, updated, self = this;
    
        if (!options || options.add !== true/* || loaded_node_id === null*/) {
            if (this.pruneModifiedRecords) {
                this.modified = [];
            }
            for (var i = 0, len = r.length; i < len; i++) {
                r[i].join(this);
            }
            if (this.snapshot) {
                this.data = this.snapshot;
                delete this.snapshot;
            }
            this.data.clear();
            this.data.addAll(r);
            this.page_offset = page_offset;
            this.totalLength = t;
            this.applySort();
            this.fireEvent("datachanged", this);
        } 
        else {
            if (loaded_node_id) {
                loaded_node = this.getById(loaded_node_id);
            }
            if (loaded_node) {
                this.setNodeLoaded(loaded_node, true);
                this.setNodeChildrenOffset(loaded_node, page_offset);
                this.setNodeChildrenTotalCount(loaded_node, Math.max(t, r.length));
                this.removeNodeDescendants(loaded_node);
            }
            this.suspendEvents();
            updated = {};
            for (i = 0, len = r.length; i < len; i++) {
                record = r[i];
                idx = this.indexOfId(record.id);
                if (idx == -1) {
                    updated[record.id] = false;
                    this.add(record);
                }
                else {
                    updated[record.id] = true;
                    prev_record = this.getAt(idx);
                    prev_record.reject();
                    prev_record.data = record.data;
                    r[i] = prev_record;
                }
            }
            this.applySort();            
            this.resumeEvents();
    
            r.sort(function(r1, r2) {
                var idx1 = self.data.indexOf(r1),
                    idx2 = self.data.indexOf(r2),
                    result;
         
                if (idx1 > idx2) {
                    result = 1;
                }
                else {
                    result = -1;
                }
                return result;
            });
            
            for (i = 0, len = r.length; i < len; i++) {
                record = r[i];
                if (updated[record.id] == true) {
                    this.fireEvent('update',  this, record, Ext.data.Record.COMMIT);
                }
                else {
                    this.fireEvent("add", this, [record], this.data.indexOf(record));
                }
            }
        }
        this.fireEvent("load", this, r, options);
        if (options.callback) {
            options.callback.call(options.scope || this, r, options, true);
        }
    },

   /**
     * Sort the Records.
     *
     * @access public
     */
    sort : function(fieldName, dir)
    {
        if (this.remoteSort) {
            this.setActiveNode(null);
            if (this.lastOptions) {
                this.lastOptions.add = false;
                if (this.lastOptions.params) {
                    this.lastOptions.params[this.paramNames.active_node] = null;
                }
            }
        }

        return Ext.ux.maximgb.tg.AbstractTreeStore.superclass.sort.call(this, fieldName, dir);         
    },    

    /**
     * Applyes current sort method.
     *
     * @access private
     */
    applySort : function()
    {
        if(this.sortInfo && !this.remoteSort){
            var s = this.sortInfo, f = s.field;
            this.sortData(f, s.direction);
        }
        // ----- Modification start
        else {
            this.applyTreeSort();
        }
        // ----- End of modification
    },
    
    /**
     * Sorts data according to sort params and then applyes tree sorting.
     *
     * @access private
     */
    sortData : function(f, direction) 
    {
        direction = direction || 'ASC';
        var st = this.fields.get(f).sortType;
        var fn = function(r1, r2){
            var v1 = st(r1.data[f]), v2 = st(r2.data[f]);
            return v1 > v2 ? 1 : (v1 < v2 ? -1 : 0);
        };
        this.data.sort(direction, fn);
        if(this.snapshot && this.snapshot != this.data){
            this.snapshot.sort(direction, fn);
        }
        // ----- Modification start
        this.applyTreeSort();
        // ----- End of modification
    },
    
    // Tree support methods.
    // -----------------------------------------------------------------------------------------------

    /**
     * Sorts store data with respect to nodes parent-child relation. Every child node will be 
     * positioned after its parent.
     *
     * @access public
     */
    applyTreeSort : function()
    {        
        var i, len, temp,
               rec, records = [],
               roots = this.getRootNodes();
                
        // Sorting data
        for (i = 0, len = roots.length; i < len; i++) {
            rec = roots[i];
            records.push(rec);
            this.collectNodeChildrenTreeSorted(records, rec); 
        }
        
        if (records.length > 0) {
            this.data.clear();
            this.data.addAll(records);
        }
        
        // Sorting the snapshot if one present.
        if (this.snapshot && this.snapshot !== this.data) {
            temp = this.data;
            this.data = this.snapshot;
            this.snapshot = null; 
            this.applyTreeSort();
            this.snapshot = this.data;
            this.data = temp;
        }
    },
    
    /**
     * Recusively collects rec descendants and adds them to records[] array.
     *
     * @access private
     * @param {Record[]} records
     * @param {Record} rec
     */
    collectNodeChildrenTreeSorted : function(records, rec)
    {
        var i, len,
            child, 
            children = this.getNodeChildren(rec);
                
        for (i = 0, len = children.length; i < len; i++) {
            child = children[i];
            records.push(child);
            this.collectNodeChildrenTreeSorted(records, child); 
        }
    },
    
    /**
     * Returns current active node.
     * 
     * @access public
     * @return {Record}
     */
    getActiveNode : function()
    {
        return this.active_node;
    },
    
    /**
     * Sets active node.
     * 
     * @access public
     * @param {Record} rc Record to set active. 
     */
    setActiveNode : function(rc)
    {
        if (this.active_node !== rc) {
            if (rc) {
                if (this.data.indexOf(rc) != -1) {
                    if (this.fireEvent('beforeactivenodechange', this, this.active_node, rc) !== false) {
                        this.active_node = rc;
                        this.fireEvent('activenodechange', this, this.active_node, rc);
                    }
                }
                else {
                    throw "Given record is not from the store.";
                }
            }
            else {
                if (this.fireEvent('beforeactivenodechange', this, this.active_node, rc) !== false) {
                    this.active_node = rc;
                    this.fireEvent('activenodechange', this, this.active_node, rc);
                }
            }
        }
    },
     
    /**
     * Returns true if node is expanded.
     *
     * @access public
     * @param {Record} rc
     */
    isExpandedNode : function(rc)
    {
        return rc.ux_maximgb_tg_expanded === true;
    },
    
    /**
     * Sets node expanded flag.
     *
     * @access private
     */
    setNodeExpanded : function(rc, value)
    {
        rc.ux_maximgb_tg_expanded = value;
    },
    
    /**
     * Returns true if node's ancestors are all expanded - node is visible.
     *
     * @access public
     * @param {Record} rc
     */
    isVisibleNode : function(rc)
    {
        var i, len,
                ancestors = this.getNodeAncestors(rc),
                result = true;
        
        for (i = 0, len = ancestors.length; i < len; i++) {
            result = result && this.isExpandedNode(ancestors[i]);
            if (!result) {
                break;
            }
        }
        
        return result;
    },
    
    /**
     * Returns true if node is a leaf.
     *
     * @access public
     * @return {Boolean}
     */
    isLeafNode : function(rc)
    {
        return rc.get(this.leaf_field_name) == true;
    },
    
    /**
     * Returns true if node was loaded.
     *
     * @access public
     * @return {Boolean}
     */
    isLoadedNode : function(rc)
    {
        var result;
        
        if (rc.ux_maximgb_tg_loaded !== undefined) {
            result = rc.ux_maximgb_tg_loaded;
        }
        else if (this.isLeafNode(rc) || this.hasChildNodes(rc)) {
            result = true;
        }
        else {
            result = false;
        }
        
        return result;
    },
    
    /**
     * Sets node loaded state.
     *
     * @access private
     * @param {Record} rc
     * @param {Boolean} value
     */
    setNodeLoaded : function(rc, value)
    {
        rc.ux_maximgb_tg_loaded = value;
    },
    
    /**
     * Returns node's children offset.
     *
     * @access public
     * @param {Record} rc
     * @return {Integer} 
     */
    getNodeChildrenOffset : function(rc)
    {
        return rc.ux_maximgb_tg_offset || 0;
    },
    
    /**
     * Sets node's children offset.
     *
     * @access private
     * @param {Record} rc
     * @parma {Integer} value 
     */
    setNodeChildrenOffset : function(rc, value)
    {
        rc.ux_maximgb_tg_offset = value;
    },
    
    /**
     * Returns node's children total count
     *
     * @access public
     * @param {Record} rc
     * @return {Integer}
     */
    getNodeChildrenTotalCount : function(rc)
    {
        return rc.ux_maximgb_tg_total || 0;
    },
    
    /**
     * Sets node's children total count.
     *
     * @access private
     * @param {Record} rc
     * @param {Integer} value
     */
    setNodeChildrenTotalCount : function(rc, value)
    {
        rc.ux_maximgb_tg_total = value;
    },
    
    /**
     * Collapses node.
     *
     * @access public
     * @param {Record} rc
     * @param {Record} rc Node to collapse. 
     */
    collapseNode : function(rc)
    {
        if (
            this.isExpandedNode(rc) &&
            this.fireEvent('beforecollapsenode', this, rc) !== false 
        ) {
            this.setNodeExpanded(rc, false);
            this.fireEvent('collapsenode', this, rc);
        }
    },
    
    /**
     * Expands node.
     *
     * @access public
     * @param {Record} rc
     */
    expandNode : function(rc)
    {
        var params;
        
        if (
            !this.isExpandedNode(rc) &&
            this.fireEvent('beforeexpandnode', this, rc) !== false
        ) {
            // If node is already loaded then expanding now.
            if (this.isLoadedNode(rc)) {
                this.setNodeExpanded(rc, true);
                this.fireEvent('expandnode', this, rc);
            }
            // If node isn't loaded yet then expanding after load.
            else {
                params = {};
                params[this.paramNames.active_node] = rc.id;
                this.load({
                    add : true,
                    params : params,
                    callback : this.expandNodeCallback,
                    scope : this
                });
            }
        }
    },
    
    /**
     * @access private
     */
    expandNodeCallback : function(r, options, success)
    {
        var rc = this.getById(options.params[this.paramNames.active_node]);
        
        if (success && rc) {
            this.setNodeExpanded(rc, true);
            this.fireEvent('expandnode', this, rc);
        }
        else {
            this.fireEvent('expandnodefailed', this, options.params[this.paramNames.active_node], rc);
        }
    },
    
    /**
     * Expands all nodes.
     *
     * @access public
     */
    expandAll : function()
    {
        var r, i, len, records = this.data.getRange();
        this.suspendEvents();
        for (i = 0, len = records.length; i < len; i++) {
            r = records[i];
            if (!this.isExpandedNode(r)) {
                this.expandNode(r);
            }
        }
        this.resumeEvents();
        this.fireEvent('datachanged', this);
    },
    
    /**
     * Collapses all nodes.
     *
     * @access public
     */
    collapseAll : function()
    {
        var r, i, len, records = this.data.getRange();
        
        this.suspendEvents();
        for (i = 0, len = records.length; i < len; i++) {
            r = records[i];
            if (this.isExpandedNode(r)) {
                this.collapseNode(r);
            }
        }
        this.resumeEvents();
        this.fireEvent('datachanged', this);
    },
    
    /**
     * Returns loaded node id from the load options.
     *
     * @access public
     */
    getLoadedNodeIdFromOptions : function(options)
    {
        var result = null;
        if (options && options.params && options.params[this.paramNames.active_node]) {
            result = options.params[this.paramNames.active_node];
        }
        return result;
    },
    
    /**
     * Returns start offset from the load options.
     */
    getPageOffsetFromOptions : function(options)
    {
        var result = 0;
        if (options && options.params && options.params[this.paramNames.start]) {
            result = parseInt(options.params[this.paramNames.start], 10);
            if (isNaN(result)) {
                result = 0;
            }
        }
        return result;
    },
    
    // Public
    hasNextSiblingNode : function(rc)
    {
        return this.getNodeNextSibling(rc) !== null;
    },
    
    // Public
    hasPrevSiblingNode : function(rc)
    {
        return this.getNodePrevSibling(rc) !== null;
    },
    
    // Public
    hasChildNodes : function(rc)
    {
        return this.getNodeChildrenCount(rc) > 0;
    },
    
    // Public
    getNodeAncestors : function(rc)
    {
        var ancestors = [],
            parent;
        
        parent = this.getNodeParent(rc);
        while (parent) {
            ancestors.push(parent);
            parent = this.getNodeParent(parent);    
        }
        
        return ancestors;
    },
    
    // Public
    getNodeChildrenCount : function(rc)
    {
        return this.getNodeChildren(rc).length;
    },
    
    // Public
    getNodeNextSibling : function(rc)
    {
        var siblings,
            parent,
            index,
            result = null;
                
        parent = this.getNodeParent(rc);
        if (parent) {
            siblings = this.getNodeChildren(parent);
        }
        else {
            siblings = this.getRootNodes();
        }
        
        index = siblings.indexOf(rc);
        
        if (index < siblings.length - 1) {
            result = siblings[index + 1];
        }
        
        return result;
    },
    
    // Public
    getNodePrevSibling : function(rc)
    {
        var siblings,
            parent,
            index,
            result = null;
                
        parent = this.getNodeParent(rc);
        if (parent) {
            siblings = this.getNodeChildren(parent);
        }
        else {
            siblings = this.getRootNodes();
        }
        
        index = siblings.indexOf(rc);
        if (index > 0) {
            result = siblings[index - 1];
        }
        
        return result;
    },
    
    // Abstract tree support methods.
    // -----------------------------------------------------------------------------------------------
    
    // Public - Abstract
    getRootNodes : function()
    {
        throw 'Abstract method call';
    },
    
    // Public - Abstract
    getNodeDepth : function(rc)
    {
        throw 'Abstract method call';
    },
    
    // Public - Abstract
    getNodeParent : function(rc)
    {
        throw 'Abstract method call';
    },
    
    // Public - Abstract
    getNodeChildren : function(rc)
    {
        throw 'Abstract method call';
    },
    
    // Public - Abstract
    addToNode : function(parent, child)
    {
        throw 'Abstract method call';
    },
    
    // Public - Abstract
    removeFromNode : function(parent, child)
    {
        throw 'Abstract method call';
    },
    
    // Paging support methods.
    // -----------------------------------------------------------------------------------------------
    /**
     * Returns top level node page offset.
     *
     * @access public
     * @return {Integer}
     */
    getPageOffset : function()
    {
        return this.page_offset;
    },
    
    /**
     * Returns active node page offset.
     *
     * @access public
     * @return {Integer}
     */
    getActiveNodePageOffset : function()
    {
        var result;
        
        if (this.active_node) {
            result = this.getNodeChildrenOffset(this.active_node);
        }
        else {
            result = this.getPageOffset();
        }
        
        return result;
    },
    
    /**
     * Returns active node children count.
     *
     * @access public
     * @return {Integer}
     */
    getActiveNodeCount : function()
    {
        var result;
        
        if (this.active_node) {
            result = this.getNodeChildrenCount(this.active_node);
        }
        else {
            result = this.getRootNodes().length;
        }
        
        return result;
    },
    
    /**
     * Returns active node total children count.
     *
     * @access public
     * @return {Integer}
     */
    getActiveNodeTotalCount : function()
    {
        var result;
        
        if (this.active_node) {
            result = this.getNodeChildrenTotalCount(this.active_node);
        }
        else {
            result = this.getTotalCount();
        }
        
        return result;  
    }
});

/**
 * Tree store for adjacency list tree representation.
 */
Ext.ux.maximgb.tg.AdjacencyListStore = Ext.extend(Ext.ux.maximgb.tg.AbstractTreeStore,
{
    /**
     * @cfg {String} parent_id_field_name Record parent id field name.
     */
    parent_id_field_name : '_parent',
    
    getRootNodes : function()
    {
        var i, 
            len, 
            result = [], 
            records = this.data.getRange();
        
        for (i = 0, len = records.length; i < len; i++) {
            if (records[i].get(this.parent_id_field_name) == null) {
                result.push(records[i]);
            }
        }
        
        return result;
    },
    
    getNodeDepth : function(rc)
    {
        return this.getNodeAncestors(rc).length;
    },
    
    getNodeParent : function(rc)
    {
        return this.getById(rc.get(this.parent_id_field_name));
    },
    
    getNodeChildren : function(rc)
    {
        var i, 
            len, 
            result = [], 
            records = this.data.getRange();
        
        for (i = 0, len = records.length; i < len; i++) {
            if (records[i].get(this.parent_id_field_name) == rc.id) {
                result.push(records[i]);
            }
        }
        
        return result;
    },
    
    addToNode : function(parent, child)
    {
        child.set(this.parent_id_field_name, parent.id);
        this.addSorted(child);
    },
    
    removeFromNode : function(parent, child)
    {
        this.remove(child);
    }
});

Ext.reg('Ext.ux.maximgb.tg.AdjacencyListStore', Ext.ux.maximgb.tg.AdjacencyListStore);

/**
 * Tree store for nested set tree representation.
 */
Ext.ux.maximgb.tg.NestedSetStore = Ext.extend(Ext.ux.maximgb.tg.AbstractTreeStore,
{
    /**
     * @cfg {String} left_field_name Record NS-left bound field name.
     */
    left_field_name : '_lft',
    
    /**
     * @cfg {String} right_field_name Record NS-right bound field name.
     */
    right_field_name : '_rgt',
    
    /**
     * @cfg {String} level_field_name Record NS-level field name.
     */
    level_field_name : '_level',
    
    /**
     * @cfg {Number} root_node_level Root node level.
     */
    root_node_level : 1,
    
    getRootNodes : function()
    {
        var i, 
            len, 
            result = [], 
            records = this.data.getRange();
        
        for (i = 0, len = records.length; i < len; i++) {
            if (records[i].get(this.level_field_name) == this.root_node_level) {
                result.push(records[i]);
            }
        }
        
        return result;
    },
    
    getNodeDepth : function(rc)
    {
        return rc.get(this.level_field_name) - this.root_node_level;
    },
    
    getNodeParent : function(rc)
    {
        var result = null,
            rec, records = this.data.getRange(),
            i, len,
            lft, r_lft,
            rgt, r_rgt,
            level, r_level;
                
        lft = rc.get(this.left_field_name);
        rgt = rc.get(this.right_field_name);
        level = rc.get(this.level_field_name);
        
        for (i = 0, len = records.length; i < len; i++) {
            rec = records[i];
            r_lft = rec.get(this.left_field_name);
            r_rgt = rec.get(this.right_field_name);
            r_level = rec.get(this.level_field_name);
            
            if (
                r_level == level - 1 &&
                r_lft < lft &&
                r_rgt > rgt
            ) {
                result = rec;
                break;
            }
        }
        
        return result;
    },
    
    getNodeChildren : function(rc)
    {
        var lft, r_lft,
            rgt, r_rgt,
            level, r_level,
            records, rec,
            result = [];
                
        records = this.data.getRange();
        
        lft = rc.get(this.left_field_name);
        rgt = rc.get(this.right_field_name);
        level = rc.get(this.level_field_name);
        
        for (i = 0, len = records.length; i < len; i++) {
            rec = records[i];
            r_lft = rec.get(this.left_field_name);
            r_rgt = rec.get(this.right_field_name);
            r_level = rec.get(this.level_field_name);
            
            if (
                r_level == level + 1 &&
                r_lft > lft &&
                r_rgt < rgt
            ) {
                result.push(rec);
            }
        }
        
        return result;
    }
});

Ext.ux.maximgb.tg.GridView = Ext.extend(Ext.grid.GridView, 
{   
    expanded_icon_class : 'ux-maximgb-tg-elbow-minus',
    last_expanded_icon_class : 'ux-maximgb-tg-elbow-end-minus',
    collapsed_icon_class : 'ux-maximgb-tg-elbow-plus',
    last_collapsed_icon_class : 'ux-maximgb-tg-elbow-end-plus',
    skip_width_update_class: 'ux-maximgb-tg-skip-width-update',
    
    // private - overriden
    initTemplates : function()
    {
        var ts = this.templates || {};
        
        if (!ts.row) {
            ts.row = new Ext.Template(
                '<div class="x-grid3-row ux-maximgb-tg-level-{level} {alt}" style="{tstyle} {display_style}">',
                    '<table class="x-grid3-row-table" border="0" cellspacing="0" cellpadding="0" style="{tstyle}">',
                        '<tbody>',
                            '<tr>{cells}</tr>',
                            (
                            this.enableRowBody ? 
                            '<tr class="x-grid3-row-body-tr" style="{bodyStyle}">' +
                                '<td colspan="{cols}" class="x-grid3-body-cell" tabIndex="0" hidefocus="on">'+
                                    '<div class="x-grid3-row-body">{body}</div>'+
                                '</td>'+
                            '</tr>' 
                                : 
                            ''
                            ),
                        '</tbody>',
                    '</table>',
                '</div>'
            );
        }
        
        if (!ts.mastercell) {
            ts.mastercell = new Ext.Template(
                '<td class="x-grid3-col x-grid3-cell x-grid3-td-{id} {css}" style="{style}" tabIndex="0" {cellAttr}>',
                    '<div class="ux-maximgb-tg-mastercell-wrap">', // This is for editor to place itself right
                        '{treeui}',
                        '<div class="x-grid3-cell-inner x-grid3-col-{id}" unselectable="on" {attr}>{value}</div>',
                    '</div>',
                '</td>'
            );
        }
        
        if (!ts.treeui) {
            ts.treeui = new Ext.Template(
                '<div class="ux-maximgb-tg-uiwrap" style="width: {wrap_width}px">',
                    '{elbow_line}',
                    '<div style="left: {left}px" class="{cls}">&#160;</div>',
                '</div>'
            );
        }
        
        if (!ts.elbow_line) {
            ts.elbow_line = new Ext.Template(
                '<div style="left: {left}px" class="{cls}">&#160;</div>'
            );
        }
        
        this.templates = ts;
        Ext.ux.maximgb.tg.GridView.superclass.initTemplates.call(this);
    },
    
    // Private - Overriden
    doRender : function(cs, rs, ds, startRow, colCount, stripe)
    {
        var ts = this.templates, ct = ts.cell, rt = ts.row, last = colCount-1;
        var tstyle = 'width:'+this.getTotalWidth()+';';
        // buffers
        var buf = [], cb, c, p = {}, rp = {tstyle: tstyle}, r;
        for (var j = 0, len = rs.length; j < len; j++) {
            r = rs[j]; cb = [];
            var rowIndex = (j+startRow);
            
            var row_render_res = this.renderRow(r, rowIndex, colCount, ds, this.cm.getTotalWidth());
            
            if (row_render_res === false) {
                for (var i = 0; i < colCount; i++) {
                    c = cs[i];
                    p.id = c.id;
                    p.css = i == 0 ? 'x-grid3-cell-first ' : (i == last ? 'x-grid3-cell-last ' : '');
                    p.attr = p.cellAttr = "";
                    p.value = c.renderer.call(c.scope, r.data[c.name], p, r, rowIndex, i, ds);                              
                    p.style = c.style;
                    if(Ext.isEmpty(p.value)){
                        p.value = "&#160;";
                    }
                    if(this.markDirty && r.dirty && typeof r.modified[c.name] !== 'undefined'){
                        p.css += ' x-grid3-dirty-cell';
                    }
                    // ----- Modification start
                    if (c.id == this.grid.master_column_id) {
                        p.treeui = this.renderCellTreeUI(r, ds);
                        ct = ts.mastercell;
                    }
                    else {
                        ct = ts.cell;
                    }
                    // ----- End of modification
                    cb[cb.length] = ct.apply(p);
                }
            }
            else {
                cb.push(row_render_res);
            }
            
            var alt = [];
            if (stripe && ((rowIndex+1) % 2 == 0)) {
                alt[0] = "x-grid3-row-alt";
            }
            if (r.dirty) {
                alt[1] = " x-grid3-dirty-row";
            }
            rp.cols = colCount;
            if(this.getRowClass){
                alt[2] = this.getRowClass(r, rowIndex, rp, ds);
            }
            rp.alt = alt.join(" ");
            rp.cells = cb.join("");
            // ----- Modification start
            if (!ds.isVisibleNode(r)) {
                rp.display_style = 'display: none;';
            }
            else {
                rp.display_style = '';
            }
            rp.level = ds.getNodeDepth(r);
            // ----- End of modification
            buf[buf.length] =  rt.apply(rp);
        }
        return buf.join("");
    },
  
    renderCellTreeUI : function(record, store)
    {
        var tpl = this.templates.treeui,
            line_tpl = this.templates.elbow_line,
            tpl_data = {},
            rec, parent,
            depth = level = store.getNodeDepth(record);
        
        tpl_data.wrap_width = (depth + 1) * 16; 
        if (level > 0) {
            tpl_data.elbow_line = '';
            rec = record;
            left = 0;
            while(level--) {
                parent = store.getNodeParent(rec);
                if (parent) {
                    if (store.hasNextSiblingNode(parent)) {
                        tpl_data.elbow_line = 
                            line_tpl.apply({
                                left : level * 16, 
                                cls : 'ux-maximgb-tg-elbow-line'
                            }) + 
                            tpl_data.elbow_line;
                    }
                    else {
                        tpl_data.elbow_line = 
                            line_tpl.apply({
                                left : level * 16,
                                cls : 'ux-maximgb-tg-elbow-empty'
                            }) +
                            tpl_data.elbow_line;
                    }
                }
                else {
                    throw [
                        "Tree inconsistency can't get level ",
                        level + 1,
                        " node(id=", rec.id, ") parent."
                    ].join("");
                }
                rec = parent;
            }
        }
        if (store.isLeafNode(record)) {
            if (store.hasNextSiblingNode(record)) {
                tpl_data.cls = 'ux-maximgb-tg-elbow';
            }
            else {
                tpl_data.cls = 'ux-maximgb-tg-elbow-end';
            }
        }
        else {
            tpl_data.cls = 'ux-maximgb-tg-elbow-active ';
            if (store.isExpandedNode(record)) {
                if (store.hasNextSiblingNode(record)) {
                    tpl_data.cls += this.expanded_icon_class;
                }
                else {
                    tpl_data.cls += this.last_expanded_icon_class;
                }
            }
            else {
                if (store.hasNextSiblingNode(record)) {
                    tpl_data.cls += this.collapsed_icon_class;
                }
                else {
                    tpl_data.cls += this.last_collapsed_icon_class;
                }
            }
        }
        tpl_data.left = 1 + depth * 16;
            
        return tpl.apply(tpl_data);
    },
    
    // Template method
    renderRow : function(record, index, col_count, ds, total_width)
    {
        return false;
    },
    
    // private - overriden
    afterRender : function()
    {
        Ext.ux.maximgb.tg.GridView.superclass.afterRender.call(this);
        this.updateAllColumnWidths();
    },
    
    // private - overriden to support missing column td's case, if row is rendered by renderRow() 
    // method.
    updateAllColumnWidths : function()
    {
        var tw = this.getTotalWidth(),
        clen = this.cm.getColumnCount(),
        ws = [],
        len,
        i;
        for(i = 0; i < clen; i++){
            ws[i] = this.getColumnWidth(i);
        }
        this.innerHd.firstChild.style.width = this.getOffsetWidth();
        this.innerHd.firstChild.firstChild.style.width = tw;
        this.mainBody.dom.style.width = tw;
        for(i = 0; i < clen; i++){
            var hd = this.getHeaderCell(i);
            hd.style.width = ws[i];
        }
    
        var ns = this.getRows(), row, trow;
        for(i = 0, len = ns.length; i < len; i++){
            row = ns[i];
            row.style.width = tw;
            if(row.firstChild){
                row.firstChild.style.width = tw;
                trow = row.firstChild.rows[0];
                for (var j = 0; j < clen && j < trow.childNodes.length; j++) {
                    if (!Ext.fly(trow.childNodes[j]).hasClass(this.skip_width_update_class)) {
                        trow.childNodes[j].style.width = ws[j];
                    }
                }
            }
        }
    
        this.onAllColumnWidthsUpdated(ws, tw);
    },

    // private - overriden to support missing column td's case, if row is rendered by renderRow() 
    // method.
    updateColumnWidth : function(col, width)
    {
        var w = this.getColumnWidth(col);
        var tw = this.getTotalWidth();
        this.innerHd.firstChild.style.width = this.getOffsetWidth();
        this.innerHd.firstChild.firstChild.style.width = tw;
        this.mainBody.dom.style.width = tw;
        var hd = this.getHeaderCell(col);
        hd.style.width = w;

        var ns = this.getRows(), row;
        for(var i = 0, len = ns.length; i < len; i++){
            row = ns[i];
            row.style.width = tw;
            if(row.firstChild){
                row.firstChild.style.width = tw;
                if (col < row.firstChild.rows[0].childNodes.length) {
                    if (!Ext.fly(row.firstChild.rows[0].childNodes[col]).hasClass(this.skip_width_update_class)) {
                        row.firstChild.rows[0].childNodes[col].style.width = w;
                    }
                }
            }
        }

        this.onColumnWidthUpdated(col, w, tw);
    },

    // private - overriden to support missing column td's case, if row is rendered by renderRow() 
    // method.
    updateColumnHidden : function(col, hidden)
    {
        var tw = this.getTotalWidth();
        this.innerHd.firstChild.style.width = this.getOffsetWidth();
        this.innerHd.firstChild.firstChild.style.width = tw;
        this.mainBody.dom.style.width = tw;
        var display = hidden ? 'none' : '';

        var hd = this.getHeaderCell(col);
        hd.style.display = display;

        var ns = this.getRows(), row, cell;
        for(var i = 0, len = ns.length; i < len; i++){
            row = ns[i];
            row.style.width = tw;
            if(row.firstChild){
                row.firstChild.style.width = tw;
                if (col < row.firstChild.rows[0].childNodes.length) {
                    if (!Ext.fly(row.firstChild.rows[0].childNodes[col]).hasClass(this.skip_width_update_class)) {
                        row.firstChild.rows[0].childNodes[col].style.display = display;
                    }
                }
            }
        }

        this.onColumnHiddenUpdated(col, hidden, tw);
        delete this.lastViewWidth; // force recalc
        this.layout();
    },
    
    // private - overriden to skip hidden rows processing.
    processRows : function(startRow, skipStripe)
    {
        var processed_cnt = 0;
        
        if(this.ds.getCount() < 1){
            return;
        }
        skipStripe = !this.grid.stripeRows; //skipStripe || !this.grid.stripeRows;
        startRow = startRow || 0;
        var rows = this.getRows();
        var processed_cnt = 0;
        
        Ext.each(rows, function(row, idx){
            row.rowIndex = idx;
            row.className = row.className.replace(this.rowClsRe, ' ');
            if (row.style.display != 'none') {
                if (!skipStripe && ((processed_cnt + 1) % 2 === 0)) {
                    row.className += ' x-grid3-row-alt';
                }
                processed_cnt++;
            }
        }, this);
        
        Ext.fly(rows[0]).addClass(this.firstRowCls);
        Ext.fly(rows[rows.length - 1]).addClass(this.lastRowCls);
    },
    
    ensureVisible : function(row, col, hscroll)
    {
        var ancestors, record = this.ds.getAt(row);
        
        if (!this.ds.isVisibleNode(record)) {
            ancestors = this.ds.getNodeAncestors(record);
            while (ancestors.length > 0) {
                record = ancestors.shift();
                if (!this.ds.isExpandedNode(record)) {
                    this.ds.expandNode(record);
                }
            }
        }
        
        return Ext.ux.maximgb.tg.GridView.superclass.ensureVisible.call(this, row, col, hscroll);
    },
    
    // Private
    expandRow : function(record, skip_process)
    {
        var ds = this.ds,
            i, len, row, pmel, children, index, child_index;
        
        if (typeof record == 'number') {
            index = record;
            record = ds.getAt(index);
        }
        else {
            index = ds.indexOf(record);
        }
        
        skip_process = skip_process || false;
        
        row = this.getRow(index);
        pmel = Ext.fly(row).child('.ux-maximgb-tg-elbow-active');
        if (pmel) {
            if (ds.hasNextSiblingNode(record)) {
                pmel.removeClass(this.collapsed_icon_class);
                pmel.removeClass(this.last_collapsed_icon_class);
                pmel.addClass(this.expanded_icon_class);
            }
            else {
                pmel.removeClass(this.collapsed_icon_class);
                pmel.removeClass(this.last_collapsed_icon_class);
                pmel.addClass(this.last_expanded_icon_class);
            }
        }
        if (ds.isVisibleNode(record)) {
            children = ds.getNodeChildren(record);
            for (i = 0, len = children.length; i < len; i++) {
                child_index = ds.indexOf(children[i]);
                row = this.getRow(child_index);
                row.style.display = 'block';
                if (ds.isExpandedNode(children[i])) {
                    this.expandRow(child_index, true);
                }
            }
        }
        if (!skip_process) {
            this.processRows(0);
        }
        //this.updateAllColumnWidths();
    },
    
    collapseRow : function(record, skip_process)
    {
        var ds = this.ds,
            i, len, children, row, index, child_index;
                
        if (typeof record == 'number') {
            index = record;
            record = ds.getAt(index);
        }
        else {
            index = ds.indexOf(record);
        }
        
        skip_process = skip_process || false;
        
        row = this.getRow(index);
        pmel = Ext.fly(row).child('.ux-maximgb-tg-elbow-active');
        if (pmel) {
            if (ds.hasNextSiblingNode(record)) {
                pmel.removeClass(this.expanded_icon_class);
                pmel.removeClass(this.last_expanded_icon_class);
                pmel.addClass(this.collapsed_icon_class);
            }
            else {
                pmel.removeClass(this.expanded_icon_class);
                pmel.removeClass(this.last_expanded_icon_class);
                pmel.addClass(this.last_collapsed_icon_class);
            }
        }
        children = ds.getNodeChildren(record);
        for (i = 0, len = children.length; i < len; i++) {
            child_index = ds.indexOf(children[i]);
            row = this.getRow(child_index);
            if (row.style.display != 'none') {
                row.style.display = 'none'; 
                this.collapseRow(child_index, true);
            }
        }
        if (!skip_process) {
            this.processRows(0);
        }
        //this.updateAllColumnWidths();
    },
    
    /**
     * @access private
     */
    initData : function(ds, cm)
    {
        Ext.ux.maximgb.tg.GridView.superclass.initData.call(this, ds, cm);
        if (this.ds) {
            this.ds.un('expandnode', this.onStoreExpandNode, this);
            this.ds.un('collapsenode', this.onStoreCollapseNode, this);
        }
        if (ds) {
            ds.on('expandnode', this.onStoreExpandNode, this);
            ds.on('collapsenode', this.onStoreCollapseNode, this);
        }
    },
    
    onLoad : function(store, records, options)
    {
        var ridx;
        
        if (
            options && 
            options.params && 
            (
                options.params[store.paramNames.active_node] === null ||
                store.indexOfId(options.params[store.paramNames.active_node]) == -1
            )
        ) {
            Ext.ux.maximgb.tg.GridView.superclass.onLoad.call(this, store, records, options);
        }
    },
    
    onAdd : function(ds, records, index)
    {
        Ext.ux.maximgb.tg.GridView.superclass.onAdd.call(this, ds, records, index);
        if (this.mainWrap) {
           //this.updateAllColumnWidths();
           this.processRows(0);
        }
    },
    
    onRemove : function(ds, record, index, isUpdate)
    {
        Ext.ux.maximgb.tg.GridView.superclass.onRemove.call(this, ds, record, index, isUpdate);
        if(isUpdate !== true){
            if (this.mainWrap) {
                //this.updateAllColumnWidths();
                this.processRows(0);
            }
        }
    },
    
    onUpdate : function(ds, record)
    {
        Ext.ux.maximgb.tg.GridView.superclass.onUpdate.call(this, ds, record);
        if (this.mainWrap) {
            //this.updateAllColumnWidths();
            this.processRows(0);
        }
    },
    
    onStoreExpandNode : function(store, rc)
    {
        this.expandRow(rc);
    },
    
    onStoreCollapseNode : function(store, rc)
    {
        this.collapseRow(rc);
    }
});

Ext.ux.maximgb.tg.GridPanel = Ext.extend(Ext.m3.GridPanel, 
{
    /**
     * @cfg {String|Integer} master_column_id Master column id. Master column cells are nested.
     * Master column cell values are used to build breadcrumbs.
     */
    master_column_id : 0,
    
    /**
     * @cfg {Stirng} TreeGrid panel custom class.
     */
    tg_cls : 'ux-maximgb-tg-panel',
	
    // Private
    initComponent : function()
    {
        this.initComponentPreOverride();
        Ext.ux.maximgb.tg.GridPanel.superclass.initComponent.call(this);
        this.getSelectionModel().on('selectionchange', this.onTreeGridSelectionChange, this);
        this.initComponentPostOverride();
    },
    
    initComponentPreOverride : Ext.emptyFn,
    
    initComponentPostOverride : Ext.emptyFn,
    
    // Private
    onRender : function(ct, position)
    {
        Ext.ux.maximgb.tg.GridPanel.superclass.onRender.call(this, ct, position);
        this.el.addClass(this.tg_cls);
    },

    /**
     * Returns view instance.
     *
     * @access private
     * @return {GridView}
     */
    getView : function()
    {
        if (!this.view) {
            this.view = new Ext.ux.maximgb.tg.GridView(this.viewConfig);
        }
        return this.view;
    },
    
    /**
     * @access private
     */
    onClick : function(e)
    {
        var target = e.getTarget(),
            view = this.getView(),
            row = view.findRowIndex(target),
            store = this.getStore(),
            sm = this.getSelectionModel(), 
            record, record_id, do_default = true;
        
        // Row click
        if (row !== false) {
            if (Ext.fly(target).hasClass('ux-maximgb-tg-elbow-active')) {
                record = store.getAt(row);
                if (store.isExpandedNode(record)) {
                    store.collapseNode(record);
                }
                else {
                    store.expandNode(record);
                }
                do_default = false;
            }
        }

        if (do_default) {
            Ext.ux.maximgb.tg.GridPanel.superclass.onClick.call(this, e);
        }
    },

    /**
     * @access private
     */
    onMouseDown : function(e)
    {
        var target = e.getTarget();

        if (!Ext.fly(target).hasClass('ux-maximgb-tg-elbow-active')) {
            Ext.ux.maximgb.tg.GridPanel.superclass.onMouseDown.call(this, e);
        }
    },
    
    /**
     * @access private
     */
    onTreeGridSelectionChange : function(sm, selection)
    {
        var record, ancestors, store = this.getStore();
        // Row selection model
        if (sm.getSelected) {
            record = sm.getSelected();
            store.setActiveNode(record);
        }
        // Cell selection model
        else if (sm.getSelectedCell && selection) {
            record = selection.record;
            store.setActiveNode(record);
        }

        // Ensuring that selected node is visible.
        if (record) {
            if (!store.isVisibleNode(record)) {
                ancestors = store.getNodeAncestors(record);
                while (ancestors.length > 0) {
                    store.expandNode(ancestors.pop());
                }
            }
        }
    }
});

Ext.ux.maximgb.tg.EditorGridPanel = Ext.extend(Ext.grid.EditorGridPanel, 
{
    /**
     * @cfg {String|Integer} master_column_id Master column id. Master column cells are nested.
     * Master column cell values are used to build breadcrumbs.
     */
    master_column_id : 0,

    // Private
    initComponent : function()
    {
        this.initComponentPreOverride();
    
        Ext.ux.maximgb.tg.EditorGridPanel.superclass.initComponent.call(this);
        
        this.getSelectionModel().on(
            'selectionchange',
            this.onTreeGridSelectionChange,
            this
        );
        
        this.initComponentPostOverride();
    },
    
    initComponentPreOverride : Ext.emptyFn,
    
    initComponentPostOverride : Ext.emptyFn,
    
    // Private
    onRender : function(ct, position)
    {
        Ext.ux.maximgb.tg.EditorGridPanel.superclass.onRender.call(this, ct, position);
        this.el.addClass('ux-maximgb-tg-panel');
    },

    /**
     * Returns view instance.
     *
     * @access private
     * @return {GridView}
     */
    getView : function()
    {
        if (!this.view) {
            this.view = new Ext.ux.maximgb.tg.GridView(this.viewConfig);
        }
        return this.view;
    },
    
    /**
     * @access private
     */
    onClick : function(e)
    {
        var target = e.getTarget(),
            view = this.getView(),
            row = view.findRowIndex(target),
            store = this.getStore(),
            sm = this.getSelectionModel(), 
            record, record_id, do_default = true;
        
        // Row click
        if (row !== false) {
            if (Ext.fly(target).hasClass('ux-maximgb-tg-elbow-active')) {
                record = store.getAt(row);
                if (store.isExpandedNode(record)) {
                    store.collapseNode(record);
                }
                else {
                    store.expandNode(record);
                }
                do_default = false;
            }
        }

        if (do_default) {
            Ext.ux.maximgb.tg.EditorGridPanel.superclass.onClick.call(this, e);
        }
    },

    /**
     * @access private
     */
    onMouseDown : function(e)
    {
        var target = e.getTarget();

        if (!Ext.fly(target).hasClass('ux-maximgb-tg-elbow-active')) {
            Ext.ux.maximgb.tg.EditorGridPanel.superclass.onMouseDown.call(this, e);
        }
    },
    
    /**
     * @access private
     */
    onTreeGridSelectionChange : function(sm, selection)
    {
        var record, ancestors, store = this.getStore();
        // Row selection model
        if (sm.getSelected) {
            record = sm.getSelected();
            store.setActiveNode(record);
        }
        // Cell selection model
        else if (sm.getSelectedCell && selection) {
            record = selection.record;
            store.setActiveNode(record);
        }

        // Ensuring that selected node is visible.
        if (record) {
            if (!store.isVisibleNode(record)) {
                ancestors = store.getNodeAncestors(record);
                while (ancestors.length > 0) {
                    store.expandNode(ancestors.pop());
                }
            }
        }
    }
});

/**
 * Paging toolbar for work this AbstractTreeStore.
 */
Ext.ux.maximgb.tg.PagingToolbar = Ext.extend(Ext.PagingToolbar,
{
    onRender : function(ct, position)
    {
        Ext.ux.maximgb.tg.PagingToolbar.superclass.onRender.call(this, ct, position);
        this.updateUI();
    },

    getPageData : function()
    {
        var total = 0, cursor = 0;
        if (this.store) {
            cursor = this.store.getActiveNodePageOffset();
            total = this.store.getActiveNodeTotalCount();
        }
        return {
            total : total,
            activePage : Math.ceil((cursor + this.pageSize) / this.pageSize),
            pages :  total < this.pageSize ? 1 : Math.ceil(total / this.pageSize)
        };
    },
    
    updateInfo : function()
    {
        var count = 0, cursor = 0, total = 0, msg;
        if (this.displayItem) {
            if (this.store) {
                cursor = this.store.getActiveNodePageOffset();
                count = this.store.getActiveNodeCount();
                total = this.store.getActiveNodeTotalCount();
            }
            msg = count == 0 ?
                this.emptyMsg 
                    :
                String.format(
                    this.displayMsg,
                    cursor + 1, cursor + count, total
                );
            this.displayItem.setText(msg);
        }
    },
    
    updateUI : function()
    {
        var d = this.getPageData(), ap = d.activePage, ps = d.pages;
        
        this.afterTextItem.setText(String.format(this.afterPageText, d.pages));
        this.inputItem.setValue(ap);
        
        this.first.setDisabled(ap == 1);
        this.prev.setDisabled(ap == 1);
        this.next.setDisabled(ap == ps);
        this.last.setDisabled(ap == ps);
        this.refresh.enable();
        this.updateInfo();
    },
    
    bindStore : function(store, initial)
    {
        if (!initial && this.store) {
            this.store.un('activenodechange', this.onStoreActiveNodeChange, this);
        }
        if (store) {
            store.on('activenodechange', this.onStoreActiveNodeChange, this);
        }
        Ext.ux.maximgb.tg.PagingToolbar.superclass.bindStore.call(this, store, initial);
    },
    
    beforeLoad : function(store, options)
    {
        var paramNames = this.getParams();
        
        Ext.ux.maximgb.tg.PagingToolbar.superclass.beforeLoad.call(this, store, options);
        
        if (options && options.params) {
            if(options.params[paramNames.start] === undefined) {
                options.params[paramNames.start] = 0;
            }
            if(options.params[paramNames.limit] === undefined) {
                options.params[paramNames.limit] = this.pageSize;
            }
        }
    },
    
    /**
     * Move to the first page, has the same effect as clicking the 'first' button.
     */
    moveFirst : function()
    {
        this.doLoad(0);
    },

    /**
     * Move to the previous page, has the same effect as clicking the 'previous' button.
     */
    movePrevious : function()
    {
        var store = this.store,
            cursor = store ? store.getActiveNodePageOffset() : 0;
            
        this.doLoad(Math.max(0, cursor - this.pageSize));
    },

    /**
     * Move to the next page, has the same effect as clicking the 'next' button.
     */
    moveNext : function()
    {
        var store = this.store,
            cursor = store ? store.getActiveNodePageOffset() : 0;
            
        this.doLoad(cursor + this.pageSize);
    },

    /**
     * Move to the last page, has the same effect as clicking the 'last' button.
     */
    moveLast : function()
    {
        var store = this.store,
            cursor = store ? store.getActiveNodePageOffset() : 0,
            total = store ? store.getActiveNodeTotalCount() : 0,
            extra = total % this.pageSize;

        this.doLoad(extra ? (total - extra) : total - this.pageSize);
    },
    
    onStoreActiveNodeChange : function(store, old_rec, new_rec)
    {
        if (this.rendered) {
            this.updateUI();
        }
    }
});

Ext.reg('Ext.ux.maximgb.tg.GridPanel', Ext.ux.maximgb.tg.GridPanel);
Ext.reg('Ext.ux.maximgb.tg.EditorGridPanel', Ext.ux.maximgb.tg.EditorGridPanel);
Ext.reg('Ext.ux.maximgb.tg.PagingToolbar', Ext.ux.maximgb.tg.PagingToolbar);


/**
 * Окно на базе Ext.Window
 */

Ext.m3.Window = Ext.extend(Ext.Window, {
	constructor: function(baseConfig, params){
//		console.log('Ext.m3.Window >>');
//		console.log(baseConfig);
//		console.log(params);
		
		// Ссылка на родительское окно
		this.parentWindow = null;
		
		// Контекст
		this.actionContextJson = null;
		
		if (params && params.parentWindowID) {
			this.parentWindow = Ext.getCmp(params.parentWindowID);
		}
		
        if (params && params.helpTopic) {
            this.m3HelpTopic = params.helpTopic;
        }
    
		if (params && params.contextJson){
			this.actionContextJson = params.contextJson;
		}
    
        // на F1 что-то нормально не вешается обработчик..
        //this.keys = {key: 112, fn: function(k,e){e.stopEvent();console.log('f1 pressed');}}
    
		Ext.m3.Window.superclass.constructor.call(this, baseConfig);
	},
    initTools: function(){
        if (this.m3HelpTopic){
            var m3HelpTopic = this.m3HelpTopic;
            this.addTool({id: 'help', handler:function(){ showHelpWindow(m3HelpTopic);}});
        }
        Ext.m3.Window.superclass.initTools.call(this);
    }
})



/**
 * Расширенное дерево на базе Ext.ux.maximgb.tg.GridPanel
 * http://www.sencha.com/forum/showthread.php?76331-TreeGrid-%28Ext.ux.maximgb.tg%29-a-tree-grid-component-based-on-Ext-s-native-grid.
 * http://max-bazhenov.com/dev/ux.maximgb.tg/index.php
 * @param {Object} config
 */
Ext.m3.AdvancedTreeGrid = Ext.extend(Ext.ux.maximgb.tg.GridPanel, {
	constructor: function(baseConfig, params){
//		console.log(baseConfig);
//		console.log(params);

		// Проверки значений
		assert(params.storeParams.url, "Некорректо задано url. \
			url=" + params.storeParams.url);

		// Заполнение Store
		var columnsToRecord = params.columnsToRecord || [];
		columnsToRecord.push(
			{name: '_id', type: 'int'}
			,{name: '_level', type: 'int'}
			,{name: '_lft', type: 'int'}
			,{name: '_rgt', type: 'int'}
			,{name: '_is_leaf', type: 'bool'}
			,{name: '_parent', type: 'int'}
		);
		
		var store = new Ext.ux.maximgb.tg.AdjacencyListStore({
			autoLoad : true,
			url: params.storeParams.url,
			reader: new Ext.data.JsonReader({
					id: '_id',
					root: params.storeParams.root,
					totalProperty: 'total',
					successProperty: 'success'
				}, 
				Ext.data.Record.create(columnsToRecord)
			)
		});
		
		var botom_bar;
		if (params.bbar) {
			botom_bar = new Ext.ux.maximgb.tg.PagingToolbar({
				store: store
				,displayInfo:true
				,pageSize: params.bbar.pageSize
			});
		}
		
		var config = Ext.applyIf({
			store: store 
			,bbar: botom_bar
		}, baseConfig);
		
		Ext.m3.AdvancedTreeGrid.superclass.constructor.call(this, config, params);
	}
});

/**
 * Панель редактирования адреса
 */
Ext.m3.AddrField = Ext.extend(Ext.Container, {
	constructor: function(baseConfig, params){
		 
		var items = params.items || [];
		
		var place_store = new Ext.data.JsonStore({
			url: params.kladr_url,
			idProperty: 'code',
			root: 'rows',
			totalProperty: 'total',
			fields: [{name: 'code'},
				{name: 'display_name'},
				{name: 'socr'},
				{name: 'zipcode'},
				{name: 'gni'},
				{name: 'uno'},
				{name: 'okato'}
			]
		});
		var record = new Ext.data.Record();
    	record.code = params.place_value;
    	record.display_name = params.place_text;
		place_store.loadData({total:1, rows:[record]});
		
		this.place = new Ext.form.ComboBox({
			name: params.place_field_name,
			fieldLabel: params.place_label,
			allowBlank: params.place_allow_blank,
            readOnly: params.read_only,
			hideTrigger: true,
			minChars: 2,
			emptyText: 'Введите населенный пункт...',
			queryParam: 'filter',
			store: place_store,
			resizable: true,
			displayField: 'display_name',
			valueField: 'code',
			mode: 'remote',
			hiddenName: params.place_field_name,
			valueNotFoundText: ''
		});		
		this.place.setValue(params.place_value);
		
		if (params.level > 1) {
			var street_store = new Ext.data.JsonStore({
				url: params.street_url,
				idProperty: 'code',
				root: 'rows',
				totalProperty: 'total',
				fields: [{name: 'code'},
					{name: 'display_name'},
					{name: 'socr'},
					{name: 'zipcode'},
					{name: 'gni'},
					{name: 'uno'},
					{name: 'okato'}
				]
			});
			var record = new Ext.data.Record();
			record.code = params.street_value;
			record.display_name = params.street_text;
			street_store.loadData({
				total: 1,
				rows: [record]
			});
			
			this.street = new Ext.form.ComboBox({
				name: params.street_field_name,
				fieldLabel: params.street_label,
				allowBlank: params.street_allow_blank,
                readOnly: params.read_only,
				hideTrigger: true,
				minChars: 2,
				emptyText: 'Введите улицу...',
				queryParam: 'filter',
				store: street_store,
				resizable: true,
				displayField: 'display_name',
				valueField: 'code',
				mode: 'remote',
				hiddenName: params.street_field_name,
        valueNotFoundText: ''
			});
			this.street.setValue(params.street_value);
			
			if (params.level > 2) {
				this.house = new Ext.form.TextField({
					name: params.house_field_name,
                    allowBlank: params.house_allow_blank,
                    readOnly: params.read_only,
					fieldLabel: params.house_label,
					value: params.house_value,
					emptyText: '',
					width: 40
				});
				
				if (params.level > 3) {
					this.flat = new Ext.form.TextField({
						name: params.flat_field_name,
						fieldLabel: params.flat_label,
						value: params.flat_value,
                        allowBlank: params.flat_allow_blank,
                        readOnly: params.read_only,
						emptyText: '',
						width: 40
					});
				}
			}
		};
		if (params.addr_visible) {
			this.addr = new Ext.form.TextArea({
				name: params.addr_field_name,
				anchor: '100%',
				fieldLabel: params.addr_label,
				value: params.addr_value,
				readOnly: true,
				height: 36
			});
		};
		if (params.view_mode == 1){
			// В одну строку
			this.place.flex = 1;
			var row_items = [this.place];
			if (params.level > 1) {
				this.street.flex = 1;
				this.street.fieldLabel = params.place_label;
				row_items.push({
						xtype: 'label'
						,style: {padding:'3px'}
    					,text: params.street_label+':'
					}
					, this.street
				);
				if (params.level > 2) {
					this.house.fieldLabel = params.place_label;
					row_items.push({
							xtype: 'label'
							,style: {padding:'3px'}
	    					,text: params.house_label+':'
						}
						, this.house
					);
					if (params.level > 3) {
						this.flat.fieldLabel = params.place_label;
						row_items.push({
								xtype: 'label'
								,style: {padding:'3px'}
		    					,text: params.flat_label+':'
							}
							, this.flat
						);
					}
				}
			}
			var row = {
				xtype: 'compositefield'
				, anchor: '100%'
				, fieldLabel: params.place_label
				, items: row_items
			};
			items.push(row);
			if (params.addr_visible) {
				items.push(this.addr);
			}
		};
		if (params.view_mode == 2){
			// В две строки
			this.place.anchor = '100%';
			items.push(this.place);
			if (params.level > 1) {
				this.street.flex = 1;
				var row_items = [this.street];
				if (params.level > 2) {
					this.house.fieldLabel = params.street_label;
					row_items.push({
							xtype: 'label'
							,style: {padding:'3px'}
	    					,text: params.house_label+':'
						}
						, this.house
					);
					if (params.level > 3) {
						this.flat.fieldLabel = params.street_label;
						row_items.push({
								xtype: 'label'
								,style: {padding:'3px'}
		    					,text: params.flat_label+':'
							}
							, this.flat
						);
					}
				};
				var row = {
					xtype: 'compositefield'
					, anchor: '100%'
					, fieldLabel: params.street_label
					, items: row_items
				};
				items.push(row);
			}
			if (params.addr_visible) {
				items.push(this.addr);
			}
		};
		if (params.view_mode == 3){
			// В три строки
			this.place.anchor = '100%';
			items.push(this.place);
			if (params.level > 1) {
				this.street.anchor = '100%';
				items.push(this.street);
				if (params.level > 2) {
					var row_items = [{
						xtype: 'container'
						, layout: 'form'
						, items: this.house 
            , style: {overflow: 'hidden'} 
					}];
					if (params.level > 3) {
						row_items.push({
							xtype: 'container'
							, layout: 'form'
							, style: {padding: '0px 0px 0px 5px', overflow: 'hidden'}
							, items: this.flat
						});
					}
					var row = new Ext.Container({
						anchor: '100%'
						, layout: 'column'
						, items: row_items
            , style: {overflow: 'hidden'} 
					});
					items.push(row);
				}
			};
			if (params.addr_visible) {
				items.push(this.addr);
			}
		};
						
		var config = Ext.applyIf({
			items: items
			, get_addr_url: params.get_addr_url
			, level: params.level
			, addr_visible: params.addr_visible
		}, baseConfig);
		
		Ext.Container.superclass.constructor.call(this, config);
	}
	, beforeStreetQuery: function(qe) {
		this.street.getStore().baseParams.place_code = this.place.value;		
	}
	, clearStreet: function() {		
    	this.street.setValue('');		
	}
	, initComponent: function(){
		Ext.m3.AddrField.superclass.initComponent.call(this);		
		this.mon(this.place, 'change', this.onChangePlace, this);
		if (this.level > 1) {
			this.mon(this.street, 'change', this.onChangeStreet, this);
			if (this.level > 2) {
				this.mon(this.house, 'change', this.onChangeHouse, this);
				if (this.level > 3) {
					this.mon(this.flat, 'change', this.onChangeFlat, this);
				}
			}
		};
		this.mon(this.place, 'beforequery', this.beforePlaceQuery, this);
		if (this.level > 1) {
			this.mon(this.place, 'change', this.clearStreet, this);
			this.mon(this.street, 'beforequery', this.beforeStreetQuery, this);
		};
		this.addEvents(
            /**
             * @event change
             * При изменении адресного поля целиком. 
             */
		    'change',
			/**
             * @event change_place
             * При изменении населенного пункта 
             * @param {AddrField} this
             * @param {Place_code} Код нас. пункта по КЛАДР
             * @param {Store} Строка с информацией о данных КЛАДРа по выбранному пункту
             */
			'change_place',
			/**
             * @event change_street
             * При изменении улицы 
             * @param {AddrField} this
             * @param {Street_code} Код улицы по КЛАДР
             * @param {Store} Строка с информацией о данных КЛАДРа по выбранной улице
             */
			'change_street',
			/**
             * @event change_house
             * При изменении дома 
             * @param {AddrField} this
             * @param {House} Номер дома             
             */
			'change_house',
			/**
             * @event change_flat
             * При изменении квартиры 
             * @param {AddrField} this
             * @param {Flat} Номер квартиры             
             */
			'change_flat',
			/**
             * @event before_query_place
             * Перед запросом данных о населенном пункте
             * @param {AddrField} this
             * @param {Event} Событие              
             */
			'before_query_place');
	}	
	, getNewAddr: function (){
		var place_id;
		if (this.place != undefined) {
			place_id = this.place.getValue();
		}
		var street_id;
		if (this.street != undefined) {
			street_id = this.street.getValue();
		}
		var house_num;
		if (this.house != undefined) {
			house_num = this.house.getValue();
		}
		var flat_num;
		if (this.flat != undefined) {
			flat_num = this.flat.getValue();
		}
		var addrCmp = this
		Ext.Ajax.request({
			url: this.get_addr_url,
			params: Ext.applyIf({ place: place_id, street: street_id, house: house_num, flat: flat_num, addr_cmp: this.addr.id }, this.params),
			success: function(response, opts){
			    smart_eval(response.responseText);
			    addrCmp.fireEvent('change');
			    },
			failure: function(){Ext.Msg.show({ title:'', msg: 'Не удалось получить адрес.<br>Причина: сервер временно недоступен.', buttons:Ext.Msg.OK, icon: Ext.Msg.WARNING });}
		});
    }
	, setNewAddr: function(newAddr){
		if (this.addr != undefined) {
			this.addr.value = newAddr;
		}
	}
	, onChangePlace: function(){
		var val = this.place.getValue();
		var data =  this.place.getStore().data.get(val);
		if (data != undefined) {
			data = data.data;
		}
		this.fireEvent('change_place', this, val, data);
		if (this.addr_visible) {
			this.getNewAddr();
		}
	}
	, onChangeStreet: function(){
		var val = this.street.getValue();
		var data =  this.street.getStore().data.get(val);
		if (data != undefined) {
			data = data.data;
		}
		this.fireEvent('change_street', this, val, data);
		if (this.addr_visible) {
			this.getNewAddr();
		}
	}
	, onChangeHouse: function(){
		this.fireEvent('change_house', this, this.house.getValue());
		if (this.addr_visible) {
			this.getNewAddr();
		}
	}
	, onChangeFlat: function(){
		this.fireEvent('change_flat', this, this.flat.getValue());
		if (this.addr_visible) {
			this.getNewAddr();
		}
	}
	, beforePlaceQuery: function(qe) {
		this.fireEvent('before_query_place', this, qe);
	}
})

/**
 * Расширенный комбобокс, включает несколько кнопок
 * @param {Object} baseConfig
 * @param {Object} params
 */
Ext.m3.AdvancedComboBox = Ext.extend(Ext.m3.ComboBox, {
	constructor: function(baseConfig, params){
		//console.log(baseConfig);
		//console.log(params);
		
		/**
		 * Инициализация значений
		 */
		
		// Будет ли задаваться вопрос перед очисткой значения
		this.askBeforeDeleting = true;
		
		this.actionSelectUrl = null;
		this.actionEditUrl = null;
		this.actionContextJson = null;
		
		this.hideBaseTrigger = false;
		
		this.defaultValue = null;
		this.defaultText = null;
		
		// кнопка очистки
		this.hideTriggerClear = params.hideClearTrigger || false;
		
		// кнопка выбора из выпадающего списка
		this.hideTriggerDropDown = false;
		
		// кнопка выбора из справочника
		this.hideTriggerDictSelect =  params.hideDictSelectTrigger || false;
		
		// кнопка редактирования элемента
		this.hideTriggerDictEdit = true;
		if (!params.hideEditTrigger){
			this.hideTriggerDictEdit = params.hideEditTrigger;
		}
		
		// Количество записей, которые будут отображаться при нажатии на кнопку 
		// выпадающего списка
		this.defaultLimit = 50;
		
		// css классы для иконок на триггеры 
		this.triggerClearClass = 'x-form-clear-trigger';
		this.triggerSelectClass = 'x-form-select-trigger';
		this.triggerEditClass = 'x-form-edit-trigger';
		
		
		
		assert(params.actions, 'params.actions is undefined');
		
		if (params.actions.actionSelectUrl) {
			this.actionSelectUrl = params.actions.actionSelectUrl
		}
		
		if (params.actions.actionEditUrl) {
			this.actionEditUrl = params.actions.actionEditUrl;
		}
		
		this.askBeforeDeleting = params.askBeforeDeleting;
		this.actionContextJson = params.actions.contextJson;
		
		this.hideBaseTrigger = false;
		if (baseConfig['hideTrigger'] ) {
			delete baseConfig['hideTrigger'];
			this.hideBaseTrigger = true;
		}
		

		this.defaultValue = params.defaultValue;
		this.defaultText = params.defaultText;
		this.baseTriggers = [
			{
				iconCls: 'x-form-clear-trigger',
				handler: null,
				hide: null
			}
			,{
				iconCls:'', 
				handler: null,
				hide: null
			}
			,{
				iconCls:'x-form-select-trigger', 
				handler: null,
				hide: null
			}
			,{
				iconCls:'x-form-edit-trigger', 
				handler: null,
				hide: true
			}
		];
		this.allTriggers = [].concat(this.baseTriggers);
		if (params.customTriggers) {
			Ext.each(params.customTriggers, function(item, index, all){
				this.allTriggers.push(item);
			}, this);
		
		}

		Ext.m3.AdvancedComboBox.superclass.constructor.call(this, baseConfig);
	}
	/**
	 * Конфигурация компонента 
	 */
	,initComponent: function () {
		Ext.m3.AdvancedComboBox.superclass.initComponent.call(this);
		
		// см. TwinTriggerField
        this.triggerConfig = {
            tag:'span', cls:'x-form-twin-triggers', cn:[]};

		Ext.each(this.allTriggers, function(item, index, all){
			this.triggerConfig.cn.push(
				{tag: "img", src: Ext.BLANK_IMAGE_URL, cls: "x-form-trigger " + item.iconCls}
			);
		}, this);

		if (!this.actionSelectUrl) {
			this.hideTriggerDictSelect = true;
		}
		
		if (!this.actionEditUrl) {
			this.hideTriggerDictEdit = true;
		}
		
		if (this.hideBaseTrigger){
			this.hideTriggerDropDown = true;
		}

		// Значения по-умолчанию
		if (this.defaultValue && this.defaultText) {
			this.addRecordToStore(this.defaultValue, this.defaultText);
		}

		// Инициализация базовой настройки триггеров
		this.initBaseTrigger();
		
		this.addEvents(
			/**
			 * Генерируется сообщение при нажатии на кнопку вызыва запроса на сервер
			 * Параметры:
			 *   this - Сам компонент
			 * Возвр. значения:
			 *   true - обработка продолжается
			 *   false - отмена обработки
			*/
			'beforerequest',
		
			/**
			 * Генерируется сообщение после выбора значения. 
			 * Здесь может быть валидация и прочие проверки
			 * Параметры:
			 *   this - Сам компонент
			 *   id - Значение 
			 *   text - Текстовое представление значения
			 * Возвр. значения:
			 *   true - обработка продолжается
			 *   false - отмена обработки
			*/
			'afterselect',
		
			/**
			 * Генерируется сообщение после установки значения поля
			 * По-умолчанию в комбобоксе change генерируется при потери фокуса
			 * В данном контроле вызов change сделан после выбора значения и 
			 * потеря фокуса контрола обрабатывается вручную
			 * Параметры:
			 *   this - Сам компонент
			*/
			'changed'
		);
		
		this.getStore().baseParams = Ext.applyIf({start:0, limit: this.defaultLimit }, this.getStore().baseParams );
		
	}
	// см. TwinTriggerField
	,getTrigger : function(index){
        return this.triggers[index];
    },
	// см. TwinTriggerField
    initTrigger : function(){
		
        var ts = this.trigger.select('.x-form-trigger', true);
        var triggerField = this;
        ts.each(function(t, all, index){
			
            var triggerIndex = 'Trigger'+(index+1);
            t.hide = function(){
                var w = triggerField.wrap.getWidth();
                this.dom.style.display = 'none';
                triggerField.el.setWidth(w-triggerField.trigger.getWidth());
                this['hidden' + triggerIndex] = true;
            };
            t.show = function(){
                var w = triggerField.wrap.getWidth();
                this.dom.style.display = '';
                triggerField.el.setWidth(w-triggerField.trigger.getWidth());
                this['hidden' + triggerIndex] = false;
            };

            if( this.allTriggers[index].hide ){
                t.dom.style.display = 'none';
                this['hidden' + triggerIndex] = true;
            }
            if (!this.disabled) { 
                this.mon(t, 'click', this.allTriggers[index].handler, this, {preventDefault:true});
                t.addClassOnOver('x-form-trigger-over');
                t.addClassOnClick('x-form-trigger-click');
            } else {
                this.mun(t, 'click', this.allTriggers[index].handler, this, {preventDefault:true});
            }
        }, this);
		
        this.triggers = ts.elements;
    }
	/**
	 * Инициализация первоначальной настройки триггеров 
	 */
	,initBaseTrigger: function(){
		this.baseTriggers[0].handler = this.onTriggerClearClick;
		this.baseTriggers[1].handler = this.onTriggerDropDownClick;
		this.baseTriggers[2].handler = this.onTriggerDictSelectClick;
		this.baseTriggers[3].handler = this.onTriggerDictEditClick;
		
		this.baseTriggers[0].hide = this.hideTriggerClear;
		this.baseTriggers[1].hide = this.hideTriggerDropDown;
		this.baseTriggers[2].hide = this.hideTriggerDictSelect;
		this.baseTriggers[3].hide = this.hideTriggerDictEdit;
		
		if (!this.getValue()) {
			this.baseTriggers[0].hide = true;
			this.baseTriggers[3].hide = true; 
		}
	}
	
	// см. TwinTriggerField
    ,getTriggerWidth: function(){
        var tw = 0;
        Ext.each(this.triggers, function(t, index){
            var triggerIndex = 'Trigger' + (index + 1),
                w = t.getWidth();
				
            if(w === 0 && !this['hidden' + triggerIndex]){
                tw += this.defaultTriggerWidth;
            }else{
                tw += w;
            }
        }, this);
        return tw;
    },
	// см. TwinTriggerField
    // private
    onDestroy : function() {
        Ext.destroy(this.triggers);
		Ext.destroy(this.allTriggers);
		Ext.destroy(this.baseTriggers);
        Ext.m3.AdvancedComboBox.superclass.onDestroy.call(this);
    }

	/**
	 * Вызывает метод выпадающего меню у комбобокса
	 **/
	,onTriggerDropDownClick: function() {
		if (this.fireEvent('beforerequest', this)) {

			if (this.isExpanded()) {
				this.collapse();
			} else {
				this.getStore().load();
				this.onFocus({});
				this.doQuery(this.allQuery, true);
			}
			this.el.focus();
		}
	}
	/**
	 * Кнопка открытия справочника в режиме выбора
	 */
	,onTriggerDictSelectClick: function() {
		this.onSelectInDictionary();
	}
	/**
	 * Кнопка очистки значения комбобокса
	 */
	,onTriggerClearClick: function() {
		
		if (this.askBeforeDeleting) {
			var scope = this;
			Ext.Msg.show({
	            title: 'Подтверждение',
	            msg: 'Вы действительно хотите очистить выбранное значение?',
	            icon: Ext.Msg.QUESTION,
	            buttons: Ext.Msg.YESNO,
	            fn:function(btn,text,opt){ 
	                if (btn == 'yes') {
	                    scope.clearValue(); 
	                };
	            }
	        });	
		} else {
			this.clearValue();
		}
	}
	/**
	 * Кнопка открытия режима редактирования записи
	 */
	,onTriggerDictEditClick: function() {
		this.onEditBtn();
	}
	/**
	 * При выборе значения необходимо показывать кнопку "очистить"
	 * @param {Object} record
	 * @param {Object} index
	 */
	,onSelect: function(record, index){
		if (this.fireEvent('afterselect', this, record.data[this.valueField], record.data[this.displayField] )) {
			Ext.m3.AdvancedComboBox.superclass.onSelect.call(this, record, index);
			this.showClearBtn();
			this.showEditBtn();
			this.fireEvent('change', this, record.data[this.valueField || this.displayField]);
			this.fireEvent('changed', this);
		}
	}
	/**
	 * Показывает кнопку очистки значения
	 */
	,showClearBtn: function(){
		if (!this.hideTriggerClear) {
			this.el.parent().setOverflow('hidden');
			this.getTrigger(0).show();
		}
	}
	/**
	 * Скрывает кнопку очистки значения
	 */
	,hideClearBtn: function(){
		this.el.parent().setOverflow('auto');
		this.getTrigger(0).hide();
	}
	/**
	 * Показывает кнопку открытия карточки элемента
	 */
	,showEditBtn: function(){
		if (this.actionEditUrl && !this.hideTriggerDictEdit && this.getValue()) {
			this.el.parent().setOverflow('hidden');
			this.getTrigger(3).show();
		}
	}
	/**
	 * Скрывает кнопку открытия карточки элемента
	 */
	,hideEditBtn: function(){
		if (this.actionEditUrl) {
			this.el.parent().setOverflow('auto');
			this.getTrigger(3).hide();
		}
	}
	/**
	 * Перегруженный метод очистки значения, плюс ко всему скрывает 
	 * кнопку очистки
	 */
	,clearValue: function(){
		var oldValue = this.getValue();
		Ext.m3.AdvancedComboBox.superclass.clearValue.call(this);
		this.hideClearBtn();
		this.hideEditBtn();
		
		this.fireEvent('change', this, '', oldValue);
		this.fireEvent('changed', this);
	}
	/**
	 * Перегруженный метод установки значения, плюс ко всему отображает 
	 * кнопку очистки
	 */
	,setValue: function(value){
		Ext.m3.AdvancedComboBox.superclass.setValue.call(this, value);
		if (value) {
			if (this.rendered) {
				this.showClearBtn();
				this.showEditBtn();
			} else {
				this.hideTrigger1 = true;
				this.hideTrigger4 = true;
			}
		}
	}
	/**
	 * Генерирует ajax-запрос за формой выбора из справочника и
	 * вешает обработку на предопределенное событие closed_ok
	 */
	,onSelectInDictionary: function(){
		assert( this.actionSelectUrl, 'actionSelectUrl is undefined' );
		
		if(this.fireEvent('beforerequest', this)) { 
			var scope = this;
			Ext.Ajax.request({
				url: this.actionSelectUrl
				,method: 'POST'
				,params: this.actionContextJson
				,success: function(response, opts){
				    var win = smart_eval(response.responseText);
				    if (win){
				        win.on('closed_ok',function(id, displayText){
							if (scope.fireEvent('afterselect', scope, id, displayText)) {
								scope.addRecordToStore(id, displayText);
							}
							
				        });
				    };
				}
				,failure: function(response, opts){
					uiAjaxFailMessage.apply(this, arguments);
				}
			});
		}
	}
	/**
	 * Добавляет запись в хранилище и устанавливает ее в качестве выбранной
	 * @param {Object} id Идентификатор
	 * @param {Object} value Отображаемое значение
	 */
	,addRecordToStore: function(id, value){
    	var record = new Ext.data.Record();
    	record['id'] = id;
    	record[this.displayField] = value;
		this.getStore().loadData({total:1, rows:[record]});    
		
		var oldValue = this.getValue()
		this.setValue(id);
		this.collapse()
		
		this.fireEvent('change', this, id, oldValue);
		this.fireEvent('changed', this);
	}
	/**
	 * Обработчик вызываемый по нажатию на кнопку редактирования записи
	 */
	,onEditBtn: function(){
		assert( this.actionEditUrl, 'actionEditUrl is undefined' );
		
		// id выбранного элемента для редактирования
		value_id = this.getValue();
		assert( value_id, 'Value not selected but edit window called' );
		
		Ext.Ajax.request({
			url: this.actionEditUrl
			,method: 'POST'
			,params: Ext.applyIf({id: value_id}, this.actionContextJson)
			,success: function(response, opts){
			    smart_eval(response.responseText);
			}
			,failure: function(response, opts){
				uiAjaxFailMessage();
			}
		});
	}
	/**
	 * Не нужно вызывать change после потери фокуса
	 */
	,triggerBlur: function () {
		if(this.focusClass){
            this.el.removeClass(this.focusClass);
        }
		if(this.wrap){
            this.wrap.removeClass(this.wrapFocusClass);
        }
	}
});
/**
 * Компонент поля даты. 
 * Добавлена кнопа установки текущий даты
 */
Ext.m3.AdvancedDataField = Ext.extend(Ext.form.DateField, {
	constructor: function(baseConfig, params){
//		console.log(baseConfig);
//		console.log(params);

		// Базовый конфиг для тригеров
		this.baseTriggers = [
			{
				iconCls: 'x-form-date-trigger'
				,handler: null
				,hide:null
			},
			{
				iconCls: 'x-form-current-date-trigger'
				,handler: null
				,hide:null
			}
		];
		
		this.hideTriggerToday = false;
	

		if (params.hideTriggerToday) {
			this.hideTriggerToday = true;
		};
		
		Ext.m3.AdvancedDataField.superclass.constructor.call(this, baseConfig);
	}
	,initComponent: function(){
		Ext.m3.AdvancedDataField.superclass.initComponent.call(this);

        this.triggerConfig = {
            tag:'span', cls:'x-form-twin-triggers', cn:[]};

		Ext.each(this.baseTriggers, function(item, index, all){
			this.triggerConfig.cn.push(
				{tag: "img", src: Ext.BLANK_IMAGE_URL, cls: "x-form-trigger " + item.iconCls}
			);
		}, this);

		this.initBaseTrigger()
	},
	initTrigger : function(){
		
        var ts = this.trigger.select('.x-form-trigger', true);
        var triggerField = this;
        ts.each(function(t, all, index){
			
            var triggerIndex = 'Trigger'+(index+1);
            t.hide = function(){
                var w = triggerField.wrap.getWidth();
                this.dom.style.display = 'none';
                triggerField.el.setWidth(w-triggerField.trigger.getWidth());
                this['hidden' + triggerIndex] = true;
            };
            t.show = function(){
                var w = triggerField.wrap.getWidth();
                this.dom.style.display = '';
                triggerField.el.setWidth(w-triggerField.trigger.getWidth());
                this['hidden' + triggerIndex] = false;
            };

            if( this.baseTriggers[index].hide ){
                t.dom.style.display = 'none';
                this['hidden' + triggerIndex] = true;
            }
            this.mon(t, 'click', this.baseTriggers[index].handler, this, {preventDefault:true});
            t.addClassOnOver('x-form-trigger-over');
            t.addClassOnClick('x-form-trigger-click');
        }, this);
		
        this.triggers = ts.elements;
    }
	,initBaseTrigger: function(){
		this.baseTriggers[0].handler = this.onTriggerClick;
		this.baseTriggers[1].handler = function(){ this.setValue( new Date() ); };
		this.baseTriggers[1].hide = this.hideTriggerToday;
	}

});


/**
 * Окно на базе Ext.m3.Window, которое включает такие вещи, как:
 * 1) Submit формы, если она есть;
 * 2) Навешивание функции на изменение поля, в связи с чем обновляется заголовок 
 * окна;
 * 3) Если поля формы были изменены, то по-умолчанию задается вопрос "Вы 
 * действительно хотите отказаться от внесенных измений";
 */

Ext.m3.EditWindow = Ext.extend(Ext.m3.Window, {
	/**
	 * Инициализация первонального фунционала
	 * @param {Object} baseConfig Базовый конфиг компонента
	 * @param {Object} params Дополнительные параметры 
	 */
	constructor: function(baseConfig, params){
		
		/**
		 * id формы в окне, для сабмита
		 */
		this.formId = null;
		
		/**
		 * url формы в окне дя сабмита
		 */
		this.formUrl = null;
		
		/**
		 * Количество измененных полей
		 */
		this.changesCount = 0;
		
		/**
		 * Оргинальный заголовок
		 */
		this.originalTitle = null;
		
		
		if (params) {
			if (params.form) {
				if (params.form.id){
					this.formId = params.form.id;
				}
				if (params.form.url){
					this.formUrl = params.form.url;
				}
			}
			

		}

		Ext.m3.EditWindow.superclass.constructor.call(this, baseConfig, params);
	}
	/**
	 * Инициализация дополнительного функционала
	 */
	,initComponent: function(){
		Ext.m3.EditWindow.superclass.initComponent.call(this);
		
		// Устанавливает функции на изменение значения
		this.items.each(function(item){
			this.setFieldOnChange(item, this);
		}, this);
	
		this.addEvents(
			/**
			 * Генерируется сообщение до начала запроса на сохранение формы
			 * Проще говоря до начала submit'a
			 * Параметры:
			 *   this - Сам компонент
			 *   @param {Object} submit - sumbit-запрос для отправки на сервер
			*/
			'beforesubmit'
			/**
			 * Генерируется, если произошел запрос на закрытие окна
			 * (через win.close()) при несохраненных изменениях, а пользователь
			 * в диалоге, запрашивающем подтверждение закрытия без сохранения,
			 * отказался закрывать окно.
			 * Параметры:
			 *   this - Сам компонент
			 */
			 ,'closing_canceled'
			)
	
	}
	/**
	 * Получает форму по formId
	 */
	,getForm: function() {
		assert(this.formId, 'Не задан formId для формы');
		
		return Ext.getCmp(this.formId).getForm();
	}
	/**
	 * Сабмит формы
	 * @param {Object} btn
	 * @param {Object} e
	 * @param {Object} baseParams
	 */
	,submitForm: function(btn, e, baseParams){
		assert(this.formUrl, 'Не задан url для формы');

		var form = Ext.getCmp(this.formId).getForm();
		if (form && !form.isValid()) {
			Ext.Msg.show({
				title: 'Проверка формы',
				msg: 'На форме имеются некорректно заполненные поля',
				buttons: Ext.Msg.OK,
				icon: Ext.Msg.WARNING
			});
			
			return;
		}
				
        var scope = this;
		var mask = new Ext.LoadMask(this.body, {msg:'Сохранение...'});
		var submit = {
            url: this.formUrl
           ,submitEmptyText: false
           ,params: Ext.applyIf(baseParams || {}, this.actionContextJson || {})
           ,success: function(form, action){
              scope.fireEvent('closed_ok', action.response.responseText);
              scope.close(true);
              try { 
                  smart_eval(action.response.responseText);
              } finally { 
                  mask.hide();
                  scope.disableToolbars(false);
              }
           }
           ,failure: function (form, action){
              uiAjaxFailMessage.apply(scope, arguments);
              mask.hide();
              scope.disableToolbars(false);
           }
        };
        
        if (scope.fireEvent('beforesubmit', submit)) {
            this.disableToolbars(true);
        	mask.show();
        	form.submit(submit);
        }
	}
	
	 /**
	  * Функция на изменение поля
	  * @param {Object} sender
	  * @param {Object} newValue
	  * @param {Object} oldValue
	  */
	,onChangeFieldValue: function (sender, newValue, oldValue, window) {

		if (sender.originalValue !== newValue) {
			if (!sender.isModified) {
				window.changesCount++;
			}
			sender.isModified = true;
		} else {
			if (sender.isModified){
				window.changesCount--;
			}
					
			sender.isModified = false;
		};
		
		window.updateTitle();
		sender.updateLabel();
    }
	/**
	 * Рекурсивная установка функции на изменение поля
	 * @param {Object} item
	 */
	,setFieldOnChange: function (item, window){
		if (item) {
			if (item instanceof Ext.form.Field && item.isEdit) {
				item.on('change', function(scope, newValue, oldValue){
					window.onChangeFieldValue(scope, newValue, oldValue, window);
				});
			};
			if (item.items) {
				if (!(item.items instanceof Array)) {	
					item.items.each(function(it){					
            			window.setFieldOnChange(it, window);
        			});
				} else {
					for (var i = 0; i < item.items.length; i++) {
						window.setFieldOnChange(item.items[i], window);
					};
				}
			};
			// оказывается есть еще и заголовочные элементы редактирования
			if (item.titleItems) {
				for (var i = 0; i < item.titleItems.length; i++) {
					window.setFieldOnChange(item.titleItems[i], window);
				};
			};
		};
	}
	
	/**
	 * Обновление заголовка окна
	 */
	,updateTitle: function(){
		// сохраним оригинальное значение заголовка
		if (this.title !== this.originalTitle && this.originalTitle === null) {
			this.originalTitle = this.title;
		};

		if (this.changesCount !== 0) {
			this.setTitle('*'+this.originalTitle);
		} else {
			this.setTitle(this.originalTitle);
		}
	}
	/**
	 * Перегрузка закрытия окна со вставкой пользовательского приложения
	 * @param {Bool} forceClose Приндтельное (без вопросов) закрытие окна
	 * 
	 * Если forceClose != true и пользователь в ответ на диалог
	 * откажется закрывать окно, возбуждается событие 'closing_canceled'
	 */
	,close: function (forceClose) {

		if (this.changesCount !== 0 && !forceClose ) {
			var scope = this;
			Ext.Msg.show({
				title: "Внимание",
				msg: "Данные были изменены! Cохранить изменения?",
				buttons: Ext.Msg.YESNOCANCEL,
				fn: function(buttonId, text, opt){
					if (buttonId === 'yes') {
						this.submitForm();
					} else if (buttonId === 'no') {
					    Ext.m3.EditWindow.superclass.close.call(scope);					  
					} else {
					   scope.fireEvent('closing_canceled');  
					}
				},
				animEl: 'elId',
				icon: Ext.MessageBox.QUESTION,
				scope: this				
			});

			return;
		};
		Ext.m3.EditWindow.superclass.close.call(this);
	}
    ,disableToolbars: function(disabled){
        var toolbars = [this.getTopToolbar(), this.getFooterToolbar(), 
                       this.getBottomToolbar()]
        for (var i=0; i<toolbars.length; i++){
            if (toolbars[i]){
                toolbars[i].setDisabled(disabled);
            }
        }
    }
})


/**
 * Окно показа контекстной помощи
 */

Ext.m3.HelpWindow = Ext.extend(Ext.Window, {
    constructor: function(baseConfig, params){
        this.title = 'Справочная информация';
        this.maximized = true;
        this.maximizable = true;
        this.minimizable = true;
        this.width=800;
        this.height=550;

    Ext.m3.HelpWindow.superclass.constructor.call(this, baseConfig);
  }
});

function showHelpWindow(url){

    window.open(url);
}

/**
 * Объектный грид, включает в себя тулбар с кнопками добавить, редактировать и удалить
 * @param {Object} config
 */
Ext.m3.ObjectGrid = Ext.extend(Ext.m3.GridPanel, {
	constructor: function(baseConfig, params){
		
		assert(params.allowPaging !== undefined,'allowPaging is undefined');
		assert(params.rowIdName !== undefined,'rowIdName is undefined');
		assert(params.actions !== undefined,'actions is undefined');
		
		this.allowPaging = params.allowPaging;
		this.rowIdName = params.rowIdName;
		this.columnParamName = params.columnParamName; // используется при режиме выбора ячеек. через этот параметр передается имя выбранной колонки
		this.actionNewUrl = params.actions.newUrl;
		this.actionEditUrl = params.actions.editUrl;
		this.actionDeleteUrl = params.actions.deleteUrl;
		this.actionDataUrl = params.actions.dataUrl;
		this.actionContextJson = params.actions.contextJson;
		
		Ext.m3.ObjectGrid.superclass.constructor.call(this, baseConfig, params);
	}
	
	,initComponent: function(){
		Ext.m3.ObjectGrid.superclass.initComponent.call(this);
		var store = this.getStore();
		store.baseParams = Ext.applyIf(store.baseParams || {}, this.actionContextJson || {});
		
		
		this.addEvents(
			/**
			 * Событие до запроса добавления записи - запрос отменится при возврате false
			 * @param ObjectGrid this
			 * @param JSON request - AJAX-запрос для отправки на сервер
			 */
			'beforenewrequest',
			/**
			 * Событие после запроса добавления записи - обработка отменится при возврате false
			 * @param ObjectGrid this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'afternewrequest',
			/**
			 * Событие до запроса редактирования записи - запрос отменится при возврате false
			 * @param ObjectGrid this
			 * @param JSON request - AJAX-запрос для отправки на сервер 
			 */
			'beforeeditrequest',
			/**
			 * Событие после запроса редактирования записи - обработка отменится при возврате false
			 * @param ObjectGrid this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'aftereditrequest',
			/**
			 * Событие до запроса удаления записи - запрос отменится при возврате false
			 * @param ObjectGrid this
			 * @param JSON request - AJAX-запрос для отправки на сервер 
			 */
			'beforedeleterequest',
			/**
			 * Событие после запроса удаления записи - обработка отменится при возврате false
			 * @param ObjectGrid this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'afterdeleterequest'
			);
		
	}
	/**
	 * Нажатие на кнопку "Новый"
	 */
	,onNewRecord: function (){
		assert(this.actionNewUrl, 'actionNewUrl is not define');
		var mask = new Ext.LoadMask(this.body);
		
		var req = {
			url: this.actionNewUrl,
			params: this.actionContextJson || {},
			success: function(res, opt){
				if (scope.fireEvent('afternewrequest', scope, res, opt)) {
				    try { 
				        var child_win = scope.childWindowOpenHandler(res, opt);
				    } finally { 
    				    mask.hide();
    				    scope.disableToolbars(false);
				    }
					return child_win;
				}
				mask.hide();
				scope.disableToolbars(false);
			}
           ,failure: function(){ 
               uiAjaxFailMessage.apply(this, arguments);
               mask.hide();
               scope.disableToolbars(false);
               
           }
		};
		
		if (this.fireEvent('beforenewrequest', this, req)) {
			var scope = this;

			this.disableToolbars(true);
			mask.show();
			Ext.Ajax.request(req);
		}
		
	}
	/**
	 * Нажатие на кнопку "Редактировать"
	 */
	,onEditRecord: function (){
		assert(this.actionEditUrl, 'actionEditUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');
		
	    if (this.getSelectionModel().hasSelection()) {
			var baseConf = {};
			var sm = this.getSelectionModel();
			// для режима выделения строк
			if (sm instanceof Ext.grid.RowSelectionModel) {
				if (sm.singleSelect) {
					baseConf[this.rowIdName] = sm.getSelected().id;
				} else {
					// для множественного выделения
					var sels = sm.getSelections();
					var ids = [];
					for(var i = 0, len = sels.length; i < len; i++){
						ids.push(sels[i].id);
					}
					baseConf[this.rowIdName] = ids.join();
				}
			}
			// для режима выделения ячейки
			else if (sm instanceof Ext.grid.CellSelectionModel) {
				assert(this.columnParamName, 'columnParamName is not define');
				
				var cell = sm.getSelectedCell();
				if (cell) {
					var record = this.getStore().getAt(cell[0]); // получаем строку данных
					baseConf[this.rowIdName] = record.id;
					baseConf[this.columnParamName] = this.getColumnModel().getDataIndex(cell[1]); // получаем имя колонки
				}
			}
			
			var mask = new Ext.LoadMask(this.body);
			var req = {
				url: this.actionEditUrl,
				params: Ext.applyIf(baseConf, this.actionContextJson || {}),
				success: function(res, opt){
					if (scope.fireEvent('aftereditrequest', scope, res, opt)) {
					    try { 
						    var child_win = scope.childWindowOpenHandler(res, opt);
						} finally { 
    						mask.hide();
    						scope.disableToolbars(false);
						}
						return child_win;
					}
					mask.hide();
                    scope.disableToolbars(false);
				}
               ,failure: function(){ 
                   uiAjaxFailMessage.apply(this, arguments);
                   mask.hide();
                   scope.disableToolbars(false);
               }
			};
			
			if (this.fireEvent('beforeeditrequest', this, req)) {
				var scope = this;
				this.disableToolbars(true);
				mask.show();
				Ext.Ajax.request(req);
			}
    	}
	}
	/**
	 * Нажатие на кнопку "Удалить"
	 */
	,onDeleteRecord: function (){
		assert(this.actionDeleteUrl, 'actionDeleteUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');
		
		var scope = this;
		if (scope.getSelectionModel().hasSelection()) {
		    Ext.Msg.show({
		        title: 'Удаление записи',
			    msg: 'Вы действительно хотите удалить выбранную запись?',
			    icon: Ext.Msg.QUESTION,
		        buttons: Ext.Msg.YESNO,
		        fn:function(btn, text, opt){ 
		            if (btn == 'yes') {
						var baseConf = {};
						var sm = scope.getSelectionModel();
						// для режима выделения строк
						if (sm instanceof Ext.grid.RowSelectionModel) {
							if (sm.singleSelect) {
								baseConf[scope.rowIdName] = sm.getSelected().id;
							} else {
								// для множественного выделения
								var sels = sm.getSelections();
								var ids = [];
								for(var i = 0, len = sels.length; i < len; i++){
									ids.push(sels[i].id);
								}
								baseConf[scope.rowIdName] = ids.join();
							}
						}
						// для режима выделения ячейки
						else if (sm instanceof Ext.grid.CellSelectionModel) {
							assert(scope.columnParamName, 'columnParamName is not define');
							
							var cell = sm.getSelectedCell();
							if (cell) {
								var record = scope.getStore().getAt(cell[0]);
								baseConf[scope.rowIdName] = record.id;
								baseConf[scope.columnParamName] = scope.getColumnModel().getDataIndex(cell[1]);
							}
						}
						
						var mask = new Ext.LoadMask(scope.body);
						var req = {
		                   url: scope.actionDeleteUrl,
		                   params: Ext.applyIf(baseConf, scope.actionContextJson || {}),
		                   success: function(res, opt){
		                	   if (scope.fireEvent('afterdeleterequest', scope, res, opt)) {
		                	       try { 
		                		       var child_win =  scope.deleteOkHandler(res, opt);
		                		   } finally { 
    		                		   mask.hide();
    		                		   scope.disableToolbars(false);
    		                	   }
		                		   return child_win;
		                	   }
		                	   mask.hide();
                               scope.disableToolbars(false);
						   }
                           ,failure: function(){ 
                               uiAjaxFailMessage.apply(this, arguments);
                               mask.hide();
                               scope.disableToolbars(false);
                           }
		                };
						if (scope.fireEvent('beforedeleterequest', scope, req)) {
						    scope.disableToolbars(true);
						    mask.show();
							Ext.Ajax.request(req);
						}
	                }
	            }
	        });
	    }
	}
	
	/**
	 * Показ и подписка на сообщения в дочерних окнах
	 * @param {Object} response Ответ
	 * @param {Object} opts Доп. параметры
	 */
	,childWindowOpenHandler: function (response, opts){
		
	    var window = smart_eval(response.responseText);
	    if(window){
			var scope = this;
	        window.on('closed_ok', function(){
				return scope.refreshStore()
			});
	    }
	}
	/**
	 * Хендлер на удаление окна
	 * @param {Object} response Ответ
	 * @param {Object} opts Доп. параметры
	 */
	,deleteOkHandler: function (response, opts){
		smart_eval(response.responseText);
		this.refreshStore();
	}
	,refreshStore: function (){
		if (this.allowPaging) {
			var pagingBar = this.getBottomToolbar(); 
			if(pagingBar &&  pagingBar instanceof Ext.PagingToolbar){
			    var active_page = Math.ceil((pagingBar.cursor + pagingBar.pageSize) / pagingBar.pageSize);
		        pagingBar.changePage(active_page);
			}
		} else {
			this.getStore().load(); 	
		}

	}
	,disableToolbars: function(disabled){
        var toolbars = [this.getTopToolbar(), this.getFooterToolbar(), 
                       this.getBottomToolbar()]
        for (var i=0; i<toolbars.length; i++){
            if (toolbars[i]){
                toolbars[i].setDisabled(disabled);
            }
        }
    }
});

Ext.m3.EditorObjectGrid = Ext.extend(Ext.m3.EditorGridPanel, {
	constructor: function(baseConfig, params){
//		console.log(baseConfig);
//		console.log(params);
		
		assert(params.allowPaging !== undefined,'allowPaging is undefined');
		assert(params.rowIdName !== undefined,'rowIdName is undefined');
		assert(params.actions !== undefined,'actions is undefined');
		
		this.allowPaging = params.allowPaging;
		this.rowIdName = params.rowIdName;
		this.columnParamName = params.columnParamName; // используется при режиме выбора ячеек. через этот параметр передается имя выбранной колонки
		this.actionNewUrl = params.actions.newUrl;
		this.actionEditUrl = params.actions.editUrl;
		this.actionDeleteUrl = params.actions.deleteUrl;
		this.actionDataUrl = params.actions.dataUrl;
		this.actionContextJson = params.actions.contextJson;
		
		Ext.m3.EditorObjectGrid.superclass.constructor.call(this, baseConfig, params);
	}
	
	,initComponent: function(){
		Ext.m3.EditorObjectGrid.superclass.initComponent.call(this);
		var store = this.getStore();
		store.baseParams = Ext.applyIf(store.baseParams || {}, this.actionContextJson || {});
		
		
		this.addEvents(
			/**
			 * Событие до запроса добавления записи - запрос отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param {JSON} request - AJAX-запрос для отправки на сервер
			 */
			'beforenewrequest',
			/**
			 * Событие после запроса добавления записи - обработка отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'afternewrequest',
			/**
			 * Событие до запроса редактирования записи - запрос отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param {JSON} request - AJAX-запрос для отправки на сервер 
			 */
			'beforeeditrequest',
			/**
			 * Событие после запроса редактирования записи - обработка отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'aftereditrequest',
			/**
			 * Событие до запроса удаления записи - запрос отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param {JSON} request - AJAX-запрос для отправки на сервер 
			 */
			'beforedeleterequest',
			/**
			 * Событие после запроса удаления записи - обработка отменится при возврате false
			 * @param {ObjectGrid} this
			 * @param res - результат запроса
			 * @param opt - параметры запроса 
			 */
			'afterdeleterequest'
			);
		
	}
	/**
	 * Нажатие на кнопку "Новый"
	 */
	,onNewRecord: function (){
		assert(this.actionNewUrl, 'actionNewUrl is not define');
		
		var req = {
			url: this.actionNewUrl,
			params: this.actionContextJson || {},
			success: function(res, opt){
				if (scope.fireEvent('afternewrequest', scope, res, opt)) {
					return scope.childWindowOpenHandler(res, opt);
				}
			},
			failure: Ext.emptyFn
		};
		
		if (this.fireEvent('beforenewrequest', this, req)) {
			var scope = this;
			Ext.Ajax.request(req);
		}
		
	}
	/**
	 * Нажатие на кнопку "Редактировать"
	 */
	,onEditRecord: function (){
		assert(this.actionEditUrl, 'actionEditUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');
		
	    if (this.getSelectionModel().hasSelection()) {
			var baseConf = {};
			var sm = this.getSelectionModel();
			// для режима выделения строк
			if (sm instanceof Ext.grid.RowSelectionModel) {
				if (sm.singleSelect) {
					baseConf[this.rowIdName] = sm.getSelected().id;
				} else {
					// для множественного выделения
					var sels = sm.getSelections();
					var ids = [];
					for(var i = 0, len = sels.length; i < len; i++){
						ids.push(sels[i].id);
					}
					baseConf[this.rowIdName] = ids;
				}
			}
			// для режима выделения ячейки
			else if (sm instanceof Ext.grid.CellSelectionModel) {
				assert(this.columnParamName, 'columnParamName is not define');
				
				var cell = sm.getSelectedCell();
				if (cell) {
					var record = this.getStore().getAt(cell[0]); // получаем строку данных
					baseConf[this.rowIdName] = record.id;
					baseConf[this.columnParamName] = this.getColumnModel().getDataIndex(cell[1]); // получаем имя колонки
				}
			}
			var req = {
				url: this.actionEditUrl,
				params: Ext.applyIf(baseConf, this.actionContextJson || {}),
				success: function(res, opt){
					if (scope.fireEvent('aftereditrequest', scope, res, opt)) {
						return scope.childWindowOpenHandler(res, opt);
					}
				},
				failure: Ext.emptyFn
			};
			
			if (this.fireEvent('beforeeditrequest', this, req)) {
				var scope = this;
				Ext.Ajax.request(req);
			}
    	}
	}
	/**
	 * Нажатие на кнопку "Удалить"
	 */
	,onDeleteRecord: function (){
		assert(this.actionDeleteUrl, 'actionDeleteUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');
		
		var scope = this;
		if (scope.getSelectionModel().hasSelection()) {
		    Ext.Msg.show({
		        title: 'Удаление записи',
			    msg: 'Вы действительно хотите удалить выбранную запись?',
			    icon: Ext.Msg.QUESTION,
		        buttons: Ext.Msg.YESNO,
		        fn:function(btn, text, opt){ 
		            if (btn == 'yes') {
						var baseConf = {};
						var sm = scope.getSelectionModel();
						// для режима выделения строк
						if (sm instanceof Ext.grid.RowSelectionModel) {
							if (sm.singleSelect) {
								baseConf[scope.rowIdName] = sm.getSelected().id;
							} else {
								// для множественного выделения
								var sels = sm.getSelections();
								var ids = [];
								for(var i = 0, len = sels.length; i < len; i++){
									ids.push(sels[i].id);
								}
								baseConf[scope.rowIdName] = ids;
							}
						}
						// для режима выделения ячейки
						else if (sm instanceof Ext.grid.CellSelectionModel) {
							assert(scope.columnParamName, 'columnParamName is not define');
							
							var cell = sm.getSelectedCell();
							if (cell) {
								var record = scope.getStore().getAt(cell[0]);
								baseConf[scope.rowIdName] = record.id;
								baseConf[scope.columnParamName] = scope.getColumnModel().getDataIndex(cell[1]);
							}
						}
						
						var req = {
		                   url: scope.actionDeleteUrl,
		                   params: Ext.applyIf(baseConf, scope.actionContextJson || {}),
		                   success: function(res, opt){
		                	   if (scope.fireEvent('afterdeleterequest', scope, res, opt)) {
		                		   return scope.deleteOkHandler(res, opt);
		                	   }
						   },
		                   failure: Ext.emptyFn
		                };
						if (scope.fireEvent('beforedeleterequest', scope, req)) {
							Ext.Ajax.request(req);
						}
	                }
	            }
	        });
	    }
	}
	
	/**
	 * Показ и подписка на сообщения в дочерних окнах
	 * @param {Object} response Ответ
	 * @param {Object} opts Доп. параметры
	 */
	,childWindowOpenHandler: function (response, opts){
		
	    var window = smart_eval(response.responseText);
	    if(window){
			var scope = this;
	        window.on('closed_ok', function(){
				return scope.refreshStore()
			});
	    }
	}
	/**
	 * Хендлер на удаление окна
	 * @param {Object} response Ответ
	 * @param {Object} opts Доп. параметры
	 */
	,deleteOkHandler: function (response, opts){
		smart_eval(response.responseText);
		this.refreshStore();
	}
	,refreshStore: function (){
		if (this.allowPaging) {
			var pagingBar = this.getBottomToolbar(); 
			if(pagingBar &&  pagingBar instanceof Ext.PagingToolbar){
			    var active_page = Math.ceil((pagingBar.cursor + pagingBar.pageSize) / pagingBar.pageSize);
		        pagingBar.changePage(active_page);
			}
		} else {
			this.getStore().load(); 	
		}

	}
});
/**
 * Объектное дерево, включает в себя тулбар с кнопками добавить (в корень и дочерний элемент), редактировать и удалить
 * @param {Object} config
 */
Ext.m3.ObjectTree = Ext.extend(Ext.m3.AdvancedTreeGrid, {
	constructor: function(baseConfig, params){
//		console.log(baseConfig);
//		console.log(params);
		
		assert(params.allowPaging !== undefined,'allowPaging is undefined');
		assert(params.rowIdName !== undefined,'rowIdName is undefined');
		assert(params.actions !== undefined,'actions is undefined');
		
		this.allowPaging = params.allowPaging;
		this.rowIdName = params.rowIdName;
		this.actionNewUrl = params.actions.newUrl;
		this.actionEditUrl = params.actions.editUrl;
		this.actionDeleteUrl = params.actions.deleteUrl;
		this.actionDataUrl = params.actions.dataUrl;
		this.actionContextJson = params.actions.contextJson;
		
		Ext.m3.ObjectTree.superclass.constructor.call(this, baseConfig, params);
	}
	,onNewRecord: function (){
		assert(this.actionNewUrl, 'actionNewUrl is not define');
		
		var scope = this;
	    Ext.Ajax.request({
	       url: this.actionNewUrl
	       ,params: this.actionContextJson || {}
	       ,success: function(res, opt){
		   		return scope.childWindowOpenHandler(res, opt);
		    }
	       ,failure: Ext.emptyFn
    	});
	}
	,onNewRecordChild: function (){
		assert(this.actionNewUrl, 'actionNewUrl is not define');
		
		if (!this.getSelectionModel().getSelected()) {
			Ext.Msg.show({
			   title: 'Новый',
			   msg: 'Элемент не выбран',
			   buttons: Ext.Msg.OK,
			   icon: Ext.MessageBox.INFO
			});
			return;
		}
		var baseConf = {};
		baseConf[this.rowIdName] = this.getSelectionModel().getSelected().get('_parent');
		var scope = this;
	    Ext.Ajax.request({
	       url: this.actionNewUrl
	       ,params: Ext.applyIf(baseConf, this.actionContextJson || {})
	       ,success: function(res, opt){
		   		return scope.childWindowOpenHandler(res, opt);
		    }
	       ,failure: Ext.emptyFn
    	});
	}
	,onEditRecord: function (){
		assert(this.actionEditUrl, 'actionEditUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');
		
	    if (this.getSelectionModel().hasSelection()) {
			var baseConf = {};
			baseConf[this.rowIdName] = this.getSelectionModel().getSelected().id;
			
			var scope = this;
		    Ext.Ajax.request({
		       url: this.actionEditUrl,
		       params: Ext.applyIf(baseConf, this.actionContextJson || {}),
		       success: function(res, opt){
			   		return scope.childWindowOpenHandler(res, opt);
			   },
		       failure: Ext.emptyFn
		    });
    	}
	}
	,onDeleteRecord: function (){
		assert(this.actionDeleteUrl, 'actionDeleteUrl is not define');
		assert(this.rowIdName, 'rowIdName is not define');
		
		var scope = this;
	    Ext.Msg.show({
	        title: 'Удаление записи',
		    msg: 'Вы действительно хотите удалить выбранную запись?',
		    icon: Ext.Msg.QUESTION,
	        buttons: Ext.Msg.YESNO,
	        fn:function(btn,text,opt){ 
	            if (btn == 'yes') {
	                if (scope.getSelectionModel().hasSelection()) {
						var baseConf = {};
						baseConf[scope.rowIdName] = scope.getSelectionModel().getSelected().id;
			
		                Ext.Ajax.request({
		                   url: scope.actionDeleteUrl,
		                   params: Ext.applyIf(baseConf, scope.actionContextJson || {}),
		                   success: function(res, opt){
						   	    return scope.deleteOkHandler(res, opt);
						   },
		                   failure: Ext.emptyFn
		                });
	                }
	            }
	        }
	    });
	}
	,childWindowOpenHandler: function (response, opts){
		
	    var window = smart_eval(response.responseText);
	    if(window){
			var scope = this;
	        window.on('closed_ok', function(){
				return scope.refreshStore()
			});
	    }
	}
	,deleteOkHandler: function (response, opts){
		smart_eval(response.responseText);
		this.refreshStore();
	}
	,refreshStore: function (){
		if (this.allowPaging) {
			var pagingBar = this.getBottomToolbar(); 
			if(pagingBar &&  pagingBar instanceof Ext.PagingToolbar){
			    var active_page = Math.ceil((pagingBar.cursor + pagingBar.pageSize) / pagingBar.pageSize);
		        pagingBar.changePage(active_page);
			}
		} else {
			this.getStore().load(); 	
		}

	}
});


Ext.ns('Ext.ux.form');

Ext.ux.form.FileUploadField = Ext.extend(Ext.form.TextField,  {

    /**
     * @cfg {Object} buttonCfg A standard {@link Ext.Button} config object.
     */

    // private
    readOnly: true

    /**
     * @hide
     * @method autoSize
     */
    ,autoSize: Ext.emptyFn

     /**
     * Класс иконки для выбора файла
     */
    ,iconClsSelectFile: 'x-form-file-icon'

    /**
     * Класс иконки для очистки файла
     */
    ,iconClsClearFile: 'x-form-file-clear-icon'

    /**
     * Класс иконки для скачивания файла
     */
    ,iconClsDownloadFile: 'x-form-file-download-icon'

    ,constructor: function(baseConfig, params){
        if (params) {
            if (params.prefixUploadField) {
                this.prefixUploadField = params.prefixUploadField;
            }
            if (params.fileUrl) {
                this.fileUrl = params.fileUrl;
            }                            
            if (baseConfig.readOnly) {
                this.readOnlyAll = true;
            }
            if (params.possibleFileExtensions) {
                this.possibleFileExtensions = params.possibleFileExtensions;
            }
            else{
                this.possibleFileExtensions = '';
            }
        }

        Ext.ux.form.FileUploadField.superclass.constructor.call(this, baseConfig, params);
    }

    // private
    ,initComponent: function(){
        Ext.ux.form.FileUploadField.superclass.initComponent.call(this);

        this.addEvents(
            /**
             * @event fileselected
             * Fires when the underlying file input field's value has changed from the user
             * selecting a new file from the system file selection dialog.
             * @param {Ext.ux.form.FileUploadField} this
             * @param {String} value The file value returned by the underlying file input field
             */
            'fileselected'
        );
    }

    // private
    ,onRender : function(ct, position){
        Ext.ux.form.FileUploadField.superclass.onRender.call(this, ct, position);

        // Используем название файла
        this.value = this.getFileName();

        this.wrap = this.el.wrap({cls:'x-form-field-wrap x-form-file-wrap'});
        this.el.addClass('x-form-file-text');
        //this.el.dom.removeAttribute('name');

        this.createFileInput();

        var btnCfg = Ext.applyIf(this.buttonCfg || {}, {
            iconCls: this.iconClsSelectFile
        });
        this.buttonFile = new Ext.Button(Ext.apply(btnCfg, {
            renderTo: this.wrap
            ,width: 16
            ,cls: 'x-form-file-btn' + (btnCfg.iconCls ? ' x-btn-icon' : '')
            ,tooltip: {
                text:'Выбрать файл'
                ,width: 150
            }
        }));

        this.buttonClear = new Ext.Button({
            renderTo: this.wrap
            ,width: 16
            ,cls: 'x-form-file-clear'
            ,iconCls: this.iconClsClearFile
            ,handler: this.clickClearField
            ,scope: this
            ,hidden: this.value ? false : true
            ,tooltip: {
                text:'Очистить'
                ,width: 65
            }
        });

        this.renderHelperBtn();

        this.bindListeners();
        this.resizeEl = this.positionEl = this.wrap;
        
        if (this.readOnlyAll) {                      
            this.buttonFile.setDisabled(true); 
            // Перекрывает невидимый индекс
            this.buttonFile.getEl().setStyle('z-index', 3);
            this.buttonClear.setDisabled(true); 
            if (this.getHelperBtn() ) {
                this.getHelperBtn().setDisabled(true); 
            }
        }

    }
    ,renderHelperBtn: function() {
        this.buttonDownload = new Ext.Button({
            renderTo: this.wrap
            ,width: 16
            ,cls: 'x-form-file-download'
            ,iconCls: this.iconClsDownloadFile
            ,handler: this.clickDownload
            ,scope: this
            ,hidden: this.value ? false : true
             ,tooltip: {
                text:'Загрузить'
                ,width: 65
            }
        });
    }
    ,getHelperBtn: function(){
        return this.buttonDownload;
    }
    ,bindListeners: function(){
        this.fileInput.on({
            scope: this,
            mouseenter: function() {
                 this.buttonFile.addClass(['x-btn-over','x-btn-focus'])
             },
             mouseleave: function(){
                 this.buttonFile.removeClass(['x-btn-over','x-btn-focus','x-btn-click'])
             },
             mousedown: function(){
                 this.buttonFile.addClass('x-btn-click')
             },
             mouseup: function(){
                 this.buttonFile.removeClass(['x-btn-over','x-btn-focus','x-btn-click'])
             },
             change: function(){
                 if (!this.isFileExtensionOK()){
                     Ext.Msg.show({
                       title:'Внимание'
                       ,msg: 'Неверное расширение файла'
                       ,buttons: Ext.Msg.OK
                       ,fn: Ext.emptyFn
                       ,animEl: 'elId'
                       ,icon: Ext.MessageBox.WARNING
                    });                     
                     this.reset();
                     return;
                 }
                 var v = this.fileInput.dom.value;
                 this.setValue(v);
                 this.fireEvent('fileselected', this, v);

                 if (v) {
                    // Очищаем ссылку на файл
                    this.fileUrl = null;

                    if (!this.buttonClear.isVisible()) {
                        this.buttonClear.show();
                        this.el.setWidth( this.el.getWidth() - this.buttonClear.getWidth());
                    }
                 }
             }
        });
    }

    ,createFileInput : function() {
        this.fileInput = this.wrap.createChild({
            id: this.getFileInputId(),
            name: (this.prefixUploadField || '') + this.name,
            cls: 'x-form-file',
            tag: 'input',
            type: 'file',
            size: 1,
            width: 20
        });

        Ext.QuickTips.unregister(this.fileInput);
        Ext.QuickTips.register({
            target: this.fileInput,
            text: 'Выбрать файл',
            width: 86,
            dismissDelay: 10000
        });
    }

    ,reset : function(){
        this.fileInput.remove();
        this.createFileInput();
        this.bindListeners();
        Ext.ux.form.FileUploadField.superclass.reset.call(this);
    }

    // private
    ,getFileInputId: function(){
        return this.id + '-file';
    }

    // private
    ,onResize : function(w, h) {
        Ext.ux.form.FileUploadField.superclass.onResize.call(this, w, h);

        this.wrap.setWidth(w);

        var w = this.wrap.getWidth() - this.buttonFile.getEl().getWidth();
        var btnClearWidth = this.buttonClear.getWidth();
        if (btnClearWidth) {
            w -= btnClearWidth;
        }
        var btnDonwloadWidth = this.getHelperBtn() ? this.getHelperBtn().getWidth() : 0;
        if (btnDonwloadWidth) {
            w -= btnDonwloadWidth;
        }

        if (Ext.isWebKit) {
            // Юлядть
            // Некорректная верстка в вебкитовских движках
            this.el.setWidth(w + 5);
        } else {
            this.el.setWidth(w);
        }

    }

    // private
    ,onDestroy: function(){
        Ext.ux.form.FileUploadField.superclass.onDestroy.call(this);
        Ext.QuickTips.unregister(this.fileInput);
        Ext.destroy(this.fileInput, this.buttonFile, this.buttonClear,
            this.getHelperBtn(), this.wrap);
    }

    ,onDisable: function(){
        Ext.ux.form.FileUploadField.superclass.onDisable.call(this);
        this.doDisable(true);
    }

    ,onEnable: function(){
        Ext.ux.form.FileUploadField.superclass.onEnable.call(this);
        this.doDisable(false);

    }

    // private
    ,doDisable: function(disabled){
        this.fileInput.dom.disabled = disabled;
        this.buttonFile.setDisabled(disabled);
        this.buttonClear.setDisabled(disabled);
        if(this.getHelperBtn()) {
            this.getHelperBtn().setDisabled(disabled);
        }
    }

    // private
    ,preFocus : Ext.emptyFn

    // private
    ,alignErrorIcon : function(){
        this.errorIcon.alignTo(this.wrap, 'tl-tr', [2, 0]);
    }

    //private
    ,clickClearField: function(){
        this.reset();
        this.setValue('');
        var width = this.el.getWidth() + this.buttonClear.getWidth();
        if (this.getHelperBtn()){
            width += (this.getHelperBtn().isVisible() ? this.getHelperBtn().getWidth() : 0);
            this.getHelperBtn().hide();
        }
        this.el.setWidth(width);
        this.buttonClear.hide();

    },

    getFileUrl: function(url){
        return document.location.protocol + '//' + document.location.host +
            '/' + url;
    }
    ,clickDownload: function(){
        var fUrl = this.getFileUrl(this.fileUrl);
        if (fUrl){
            window.open(fUrl);
        }
    }
    ,getFileName: function(){
        return this.value.split('/').reverse()[0];
    }
    ,isFileExtensionOK: function(){
        var fileExtension = this.fileInput.dom.value.split('.');
        if (fileExtension.length > 0){
            //Поиск на существование элемента внутри массива
            return this.possibleFileExtensions.split(',')
                    .indexOf(fileExtension[fileExtension.length-1].toLowerCase()) != -1;
        }
        return false;
    }
    //override
    ,setReadOnly: function(readOnly){
         Ext.ux.form.FileUploadField.superclass.setReadOnly.call(this, readOnly);
    }
});

Ext.reg('fileuploadfield', Ext.ux.form.FileUploadField);

// backwards compat
Ext.form.FileUploadField = Ext.ux.form.FileUploadField;

Ext.ns('Ext.ux.form');

Ext.ux.form.ImageUploadField = Ext.extend(Ext.form.FileUploadField,  {

     /**
     * Класс иконки для выбора файла
     */
     iconClsSelectFile: 'x-form-image-icon'
    
    /**
     * Класс иконки для очистки файла 
     */
    ,iconClsClearFile: 'x-form-image-clear-icon'

    /**
     * Класс иконки для предпросмотра файла
     */
    ,iconClsPreviewImage: 'x-form-image-preview-icon'
    
    ,constructor: function(baseConfig, params){
        
        if (params) {
            if (params.thumbnailWidth) {
                this.thumbnailWidth = params.thumbnailWidth;
            }
            if (params.thumbnailHeight) {
                this.thumbnailHeight = params.thumbnailHeight;
            }
            if (params.prefixThumbnailImg) {
                this.prefixThumbnailImg = params.prefixThumbnailImg;
            }
            if (params.thumbnail) {
                this.thumbnail = params.thumbnail;
            }
            
        if (params.fileUrl) {
            var mass = params.fileUrl.split('/');
            var dir = mass.slice(0, mass.length - 1);
            var file_name = mass[mass.length-1];
            var prefix = this.prefixThumbnailImg || '';
            var url = String.format('{0}/{1}{2}', dir.join('/'), prefix, file_name);
            
            this.previewTip = new Ext.QuickTip({
                id: 'preview_tip_window',  
                html: String.format('<a href="{0}" rel="lightbox"><image src="{1}" WIDTH={2} HEIGHT={3} OnClick=Ext.getCmp("preview_tip_window").hide()></a>', 
                        params.fileUrl,
                        this.getFileUrl(url),
                        this.thumbnailWidth,
                        this.thumbnailHeight)
                ,autoHide: false
                ,width: this.thumbnailWidth + 10
                ,height: this.thumbnailHeight + 10
            });
        }
        }        
        
        Ext.ux.form.ImageUploadField.superclass.constructor.call(this, baseConfig, params);
    }     
   ,renderHelperBtn: function(){
       if (this.thumbnail) {
            this.buttonPreview = new Ext.Button({
                renderTo: this.wrap
                ,width: 16
                ,cls: 'x-form-file-download'
                ,iconCls: this.iconClsPreviewImage
                ,handler: this.clickHelperBtn
                ,scope: this
                ,hidden: this.value ? false : true
                ,tooltip: {
                    text: 'Предварительный показ'
                    ,width: 140
                }
            });
        }
    }
    ,getHelperBtn: function(){
        return this.buttonPreview;
    }    
    ,clickHelperBtn: function(){
            var el = this.getEl();
            var xy = el.getXY()
            this.previewTip.showAt([xy[0], xy[1] + el.getHeight()]);

    }
    ,createFileInput : function() {
        this.fileInput = this.wrap.createChild({
            id: this.getFileInputId(),
            name: (this.prefixUploadField || '') + this.name,
            cls: 'x-form-file',
            tag: 'input',
            type: 'file',
            size: 1,
            width: 20
        });
        
        Ext.QuickTips.unregister(this.fileInput);
        Ext.QuickTips.register({
            target: this.fileInput,
            text: 'Выбрать изображение',
            width: 130,
            dismissDelay: 10000 
        });
    }
    ,onDestroy: function(){
        Ext.ux.form.ImageUploadField.superclass.onDestroy.call(this);
        Ext.destroy(this.previewTip);
    }
});
// Регистрация lightbox
Ext.ux.Lightbox.register('a[rel^=lightbox]');
Ext.reg('imageuploadfield', Ext.ux.form.ImageUploadField);

/**
 * Функции рендера компонентов-контейнеров
 * @author: prefer
 */
/**
 * Создание расширенного дерева, на базе внешего компонента
 * @param {Object} baseConfig Базовый конфиг для компонента
 * @param {Object} params Дрополнительные параметра для правильной конф-ии
 */
function createAdvancedTreeGrid(baseConfig, params){
	return new Ext.m3.AdvancedTreeGrid(baseConfig, params);
}

/**
 * Создание грида
 * @param {Object} baseConfig
 * @param {Object} params
 */
function createGridPanel(baseConfig, params){
  if (baseConfig.editor) {
    return new Ext.m3.EditorGridPanel(baseConfig, params);
  }
  else {
	  return new Ext.m3.GridPanel(baseConfig, params);
	}
}

/**
 * Создание объектного грида
 * @param {Object} baseConfig
 * @param {Object} params
 */
function createObjectGrid(baseConfig, params){
  if (baseConfig.editor) {
    return new Ext.m3.EditorObjectGrid(baseConfig, params);
  }
  else {
	  return new Ext.m3.ObjectGrid(baseConfig, params);
	}
}

/**
 * Создание объектного дерева
 * @param {Object} baseConfig
 * @param {Object} params
 */
function createObjectTree(baseConfig, params){
	return new Ext.m3.ObjectTree(baseConfig, params);
}

/**
 * Создание расширенного комбобокса
 * @param {Object} baseConfig
 * @param {Object} params
 */
function createAdvancedComboBox(baseConfig, params){
	var adv_combo = new Ext.m3.AdvancedComboBox(baseConfig, params);
//	adv_combo.on('beforeselect',function(){
//		console.log('beforeselect');
//	});
//	adv_combo.on('beforequery',function(e){
//		
//		//e.cancel = true;
//		console.log('beforequery');
//	});
//	adv_combo.on('change',function(){
//		console.log('change');
//	});
//	adv_combo.on('beforerequest',function(){
//		console.log('beforerequest');
//		return false;
//	});
//	adv_combo.on('changed',function(){
//		console.log('changed');
//		//return false;
//	});
//		adv_combo.on('afterselect',function(){
//		console.log(arguments);
//		console.log('afterselect');
//		//return false;
//	});
	
	return adv_combo;
}

/**
 * Создание своего переопределенного компонента DateField
 * @param {Object} baseConfig
 */
function createAdvancedDataField(baseConfig, params){
	return new Ext.m3.AdvancedDataField(baseConfig, params);
}
/**
 * Здесь нужно перегружать объекты и дополнять функционал.
 * Этот файл подключается последним.
 */
 
/**
 * Нужно для правильной работы окна 
 */
Ext.onReady(function(){
	Ext.override(Ext.Window, {
	
	  /*
	   *  Если установлена модальность и есть родительское окно, то
	   *  флаг модальности помещается во временную переменную tmpModal, и 
	   *  this.modal = false;
	   */
	  tmpModal: false 
	  ,manager: new Ext.WindowGroup()
	  // 2011.01.14 kirov
	  // убрал, т.к. совместно с desktop.js это представляет собой гремучую смесь
	  // кому нужно - пусть прописывает Ext.getBody() в своем "десктопе" на onReady или когда хочет
	  //,renderTo: Ext.getBody().id
	  ,constrain: true
	  /**
	   * Выводит окно на передний план
	   * Вызывается в контексте дочернего 
	   * по отношению к parentWindow окну
	   */
	  ,activateChildWindow: function(){
	    this.toFront();
	  }
	  ,listeners: {
	
	    'beforeshow': function (){
	      if ( Ext.get(this.renderTo).getHeight() < this.getHeight() ) {
	        this.setHeight( Ext.get(this.renderTo).getHeight() );
	      }
				
				if (this.parentWindow) {
					
					this.parentWindow.setDisabled(true);
					
					/*
					 * В Extjs 3.3 Добавили общую проверку в функцию mask, см:
					 *  if (!(/^body/i.test(dom.tagName) && me.getStyle('position') == 'static')) {
	                    	me.addClass(XMASKEDRELATIVE);
	               		 }
					 * 
					 * было до версии 3.3: 
					 *  if(!/^body/i.test(dom.tagName) && me.getStyle('position') == 'static'){
		            		me.addClass(XMASKEDRELATIVE);
		        		}
					 * Теперь же расположение замаскированых окон должно быть относительным
					 * (relative) друг друга
					 * 
					 * Такое поведение нам не подходит и другого решения найдено не было.
					 * Кроме как удалять данный класс
					 * */
					this.parentWindow.el.removeClass('x-masked-relative');
	
					this.parentWindow.on('activate', this.activateChildWindow, this);
					
					this.modal = false;
					this.tmpModal = true;
	                
					if (window.AppDesktop) {
						var el = AppDesktop.getDesktop().taskbar.tbPanel.getTabWin(this.parentWindow);
						if (el) {
							el.mask();
						}
					}
				}
				if (this.modal){
					var taskbar = Ext.get('ux-taskbar');
					if (taskbar) {
	 					taskbar.mask();
					}
						var toptoolbar = Ext.get('ux-toptoolbar');
					if (toptoolbar) {
		 				toptoolbar.mask();
					}
				}
			}
			,'beforeclose': function (){
				if (this.tmpModal && this.parentWindow) {			
					this.parentWindow.un('activate', this.activateChildWindow, this);
					this.parentWindow.setDisabled(false);
					this.parentWindow.toFront();
	
					if (window.AppDesktop) {
						var el = AppDesktop.getDesktop().taskbar.tbPanel.getTabWin(this.parentWindow);
						if (el) {
							el.unmask();
						}
					}
				}
	
				if (this.modal){
	 				var taskbar = Ext.get('ux-taskbar');
					if (taskbar) {
	 					taskbar.unmask();
					}
						var toptoolbar = Ext.get('ux-toptoolbar');
					if (toptoolbar) {
		 				toptoolbar.unmask();
					}
				}
			}
			,'hide': function (){
				if (this.modal){
					if (!this.parentWindow) {
		 				var taskbar = Ext.get('ux-taskbar');
						if (taskbar) {
		 					taskbar.unmask();
						}
	 					var toptoolbar = Ext.get('ux-toptoolbar');
						if (toptoolbar) {
			 				toptoolbar.unmask();
						}
					}
				}
			}
		}
	}); 
})
/**
 * Обновим TreeGrid чтобы колонки занимали всю ширину дерева
 */
Ext.override(Ext.ux.tree.TreeGrid, {
	
	// добавлено
	fitColumns: function() {
        var nNewTotalWidth = this.getInnerWidth() - Ext.num(this.scrollOffset, Ext.getScrollBarWidth());
        var nOldTotalWidth = this.getTotalColumnWidth();
        var cs = this.getVisibleColumns();
        var n, nUsed = 0;
        
        for (n = 0; n < cs.length; n++) {
            if (n == cs.length - 1) {
                cs[n].width = nNewTotalWidth - nUsed - 1;
                break;
            }
            cs[n].width = Math.floor((nNewTotalWidth / 100) * (cs[n].width * 100 / nOldTotalWidth)) - 1;
            nUsed += cs[n].width;
        }
        
        this.updateColumnWidths();
    },
	// <--
	onResize : function(w, h) {
        Ext.ux.tree.TreeGrid.superclass.onResize.apply(this, arguments);
        
        var bd = this.innerBody.dom;
        var hd = this.innerHd.dom;

        if(!bd){
            return;
        }

        if(Ext.isNumber(h)){
            bd.style.height = this.body.getHeight(true) - hd.offsetHeight + 'px';
        }

        if(Ext.isNumber(w)){                        
            var sw = Ext.num(this.scrollOffset, Ext.getScrollBarWidth());
            if(this.reserveScrollOffset || ((bd.offsetWidth - bd.clientWidth) > 10)){
                this.setScrollOffset(sw);
            }else{
                var me = this;
                setTimeout(function(){
                    me.setScrollOffset(bd.offsetWidth - bd.clientWidth > 10 ? sw : 0);
                }, 10);
            }
        }
		this.fitColumns(); // добавилась/заменила
    }
}); 

Ext.override(Ext.tree.ColumnResizer, {

    onEnd : function(e){
        var nw = this.proxy.getWidth(),
            tree = this.tree;
        
        this.proxy.remove();
        delete this.dragHd;
        
        tree.columns[this.hdIndex].width = nw;
        //tree.updateColumnWidths(); // закомментировано
		tree.fitColumns();			// добавлено
        
        setTimeout(function(){
            tree.headersDisabled = false;
        }, 100);
    }
});

/**
 * Обновим ячейку дерева чтобы при двойном клике не открывались/сворачивались дочерние узлы
 */
Ext.override(Ext.tree.TreeNodeUI, {
	onDblClick : function(e){
        e.preventDefault();
        if(this.disabled){
            return;
        }
        if(this.fireEvent("beforedblclick", this.node, e) !== false){
            if(this.checkbox){
                this.toggleCheck();
            }
			// закомментировано. 
            //if(!this.animating && this.node.isExpandable()){
            //    this.node.toggle();
            //}
            this.fireEvent("dblclick", this.node, e);
        }
    }
});
/**
 * Исправим ошибку, когда значения emptyText в композитном поле передаются на сервер, даже если установлен признак "не передавать"
 */
Ext.override(Ext.form.Action.Submit, {
	run : function(){
        var o = this.options,
            method = this.getMethod(),
            isGet = method == 'GET';
        if(o.clientValidation === false || this.form.isValid()){
            if (o.submitEmptyText === false) {
                var fields = this.form.items,
                    emptyFields = [];
                fields.each(function(f) {					
                    if (f.el.getValue() == f.emptyText) {
                        emptyFields.push(f);
                        f.el.dom.value = "";
                    };
					// Добавилось
                    // вот тут сделаем добавку
                    if (f instanceof Ext.form.CompositeField) {
                        f.items.each(function(cf) {					
                            if (cf.el.getValue() == cf.emptyText) {
                                emptyFields.push(cf);
                                cf.el.dom.value = "";
                            };
                        });
                    };
					// <--
                });
            }
            Ext.Ajax.request(Ext.apply(this.createCallback(o), {
                form:this.form.el.dom,
                url:this.getUrl(isGet),
                method: method,
                headers: o.headers,
                params:!isGet ? this.getParams() : null,
                isUpload: this.form.fileUpload
            }));
            if (o.submitEmptyText === false) {
                Ext.each(emptyFields, function(f) {
                    if (f.applyEmptyText) {
                        f.applyEmptyText();
                    }
                });
            }
        }else if (o.clientValidation !== false){ // client validation failed
            this.failureType = Ext.form.Action.CLIENT_INVALID;
            this.form.afterAction(this, false);
        }
    }
});

/**
 * Раньше нельзя было перейти на конкретную страницу в движках webkit. Т.к.
 * Событие PagingBlur наступает раньше pagingChange, и обновлялась текущая 
 * страница, т.к. PagingBlur обновляет индекс.
 */
Ext.override(Ext.PagingToolbar, {
    onPagingBlur: Ext.emptyFn
});

/*
 * Проблема скроллинга хидеров в компонентах ExtPanel или ExtFieldSet
 * (Скролятся только хидеры)
 */

if  (Ext.isIE7) {
    Ext.Panel.override({
        setAutoScroll: function() {
        if (this.rendered && this.autoScroll) {
            var el = this.body || this.el;
        if (el) {
            el.setOverflow('auto');
            // Following line required to fix autoScroll
            el.dom.style.position = 'relative';
            }
        }
        }
    });
}

