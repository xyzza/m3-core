/*!
 * Ext3 JS Library 3.3.0
 * Copyright(c) 2006-2010 Ext3 JS, Inc.
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
Ext3.ns('Ext3.calendar');

 (function() {
    Ext3.apply(Ext3.calendar, {
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
 * @class Ext3.calendar.DayHeaderTemplate
 * @extends Ext3.XTemplate
 * <p>This is the template used to render the all-day event container used in {@link Ext3.calendar.DayView DayView} and 
 * {@link Ext3.calendar.WeekView WeekView}. Internally the majority of the layout logic is deferred to an instance of
 * {@link Ext3.calendar.BoxLayoutTemplate}.</p> 
 * <p>This template is automatically bound to the underlying event store by the 
 * calendar components and expects records of type {@link Ext3.calendar.EventRecord}.</p>
 * <p>Note that this template would not normally be used directly. Instead you would use the {@link Ext3.calendar.DayViewTemplate}
 * that internally creates an instance of this template along with a {@link Ext3.calendar.DayBodyTemplate}.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext3.calendar.DayHeaderTemplate = function(config){
    
    Ext3.apply(this, config);
    
    this.allDayTpl = new Ext3.calendar.BoxLayoutTemplate(config);
    this.allDayTpl.compile();
    
    Ext3.calendar.DayHeaderTemplate.superclass.constructor.call(this,
        '<div class="ext3-cal-hd-ct">',
            '<table class="ext3-cal-hd-days-tbl" cellspacing="0" cellpadding="0">',
                '<tbody>',
                    '<tr>',
                        '<td class="ext3-cal-gutter"></td>',
                        '<td class="ext3-cal-hd-days-td"><div class="ext3-cal-hd-ad-inner">{allDayTpl}</div></td>',
                        '<td class="ext3-cal-gutter-rt"></td>',
                    '</tr>',
                '</tobdy>',
            '</table>',
        '</div>'
    );
};

Ext3.extend(Ext3.calendar.DayHeaderTemplate, Ext3.XTemplate, {
    applyTemplate : function(o){
        return Ext3.calendar.DayHeaderTemplate.superclass.applyTemplate.call(this, {
            allDayTpl: this.allDayTpl.apply(o)
        });
    }
});

Ext3.calendar.DayHeaderTemplate.prototype.apply = Ext3.calendar.DayHeaderTemplate.prototype.applyTemplate;
/**
 * @class Ext3.calendar.DayBodyTemplate
 * @extends Ext3.XTemplate
 * <p>This is the template used to render the scrolling body container used in {@link Ext3.calendar.DayView DayView} and 
 * {@link Ext3.calendar.WeekView WeekView}. This template is automatically bound to the underlying event store by the 
 * calendar components and expects records of type {@link Ext3.calendar.EventRecord}.</p>
 * <p>Note that this template would not normally be used directly. Instead you would use the {@link Ext3.calendar.DayViewTemplate}
 * that internally creates an instance of this template along with a {@link Ext3.calendar.DayHeaderTemplate}.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext3.calendar.DayBodyTemplate = function(config){
    
    Ext3.apply(this, config);
    
    Ext3.calendar.DayBodyTemplate.superclass.constructor.call(this,
        '<table class="ext3-cal-bg-tbl" cellspacing="0" cellpadding="0">',
            '<tbody>',
                '<tr height="1">',
                    '<td class="ext3-cal-gutter"></td>',
                    '<td colspan="{dayCount}">',
                        '<div class="ext3-cal-bg-rows">',
                            '<div class="ext3-cal-bg-rows-inner">',
                                '<tpl for="times">',
                                    '<div class="ext3-cal-bg-row">',
                                        '<div class="ext3-cal-bg-row-div ext3-row-{[xindex]}"></div>',
                                    '</div>',
                                '</tpl>',
                            '</div>',
                        '</div>',
                    '</td>',
                '</tr>',
                '<tr>',
                    '<td class="ext3-cal-day-times">',
                        '<tpl for="times">',
                            '<div class="ext3-cal-bg-row">',
                                '<div class="ext3-cal-day-time-inner">{.}</div>',
                            '</div>',
                        '</tpl>',
                    '</td>',
                    '<tpl for="days">',
                        '<td class="ext3-cal-day-col">',
                            '<div class="ext3-cal-day-col-inner">',
                                '<div id="{[this.id]}-day-col-{.:date("Ymd")}" class="ext3-cal-day-col-gutter"></div>',
                            '</div>',
                        '</td>',
                    '</tpl>',
                '</tr>',
            '</tbody>',
        '</table>'
    );
};

Ext3.extend(Ext3.calendar.DayBodyTemplate, Ext3.XTemplate, {
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
        
        return Ext3.calendar.DayBodyTemplate.superclass.applyTemplate.call(this, {
            days: days,
            dayCount: days.length,
            times: times
        });
    }
});

Ext3.calendar.DayBodyTemplate.prototype.apply = Ext3.calendar.DayBodyTemplate.prototype.applyTemplate;
/**
 * @class Ext3.calendar.DayViewTemplate
 * @extends Ext3.XTemplate
 * <p>This is the template used to render the all-day event container used in {@link Ext3.calendar.DayView DayView} and 
 * {@link Ext3.calendar.WeekView WeekView}. Internally this class simply defers to instances of {@link Ext3.calerndar.DayHeaderTemplate}
 * and  {@link Ext3.calerndar.DayBodyTemplate} to perform the actual rendering logic, but it also provides the overall calendar view
 * container that contains them both.  As such this is the template that should be used when rendering day or week views.</p> 
 * <p>This template is automatically bound to the underlying event store by the 
 * calendar components and expects records of type {@link Ext3.calendar.EventRecord}.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext3.calendar.DayViewTemplate = function(config){
    
    Ext3.apply(this, config);
    
    this.headerTpl = new Ext3.calendar.DayHeaderTemplate(config);
    this.headerTpl.compile();
    
    this.bodyTpl = new Ext3.calendar.DayBodyTemplate(config);
    this.bodyTpl.compile();
    
    Ext3.calendar.DayViewTemplate.superclass.constructor.call(this,
        '<div class="ext3-cal-inner-ct">',
            '{headerTpl}',
            '{bodyTpl}',
        '</div>'
    );
};

Ext3.extend(Ext3.calendar.DayViewTemplate, Ext3.XTemplate, {
    // private
    applyTemplate : function(o){
        return Ext3.calendar.DayViewTemplate.superclass.applyTemplate.call(this, {
            headerTpl: this.headerTpl.apply(o),
            bodyTpl: this.bodyTpl.apply(o)
        });
    }
});

Ext3.calendar.DayViewTemplate.prototype.apply = Ext3.calendar.DayViewTemplate.prototype.applyTemplate;
/**
 * @class Ext3.calendar.BoxLayoutTemplate
 * @extends Ext3.XTemplate
 * <p>This is the template used to render calendar views based on small day boxes within a non-scrolling container (currently
 * the {@link Ext3.calendar.MonthView MonthView} and the all-day headers for {@link Ext3.calendar.DayView DayView} and 
 * {@link Ext3.calendar.WeekView WeekView}. This template is automatically bound to the underlying event store by the 
 * calendar components and expects records of type {@link Ext3.calendar.EventRecord}.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext3.calendar.BoxLayoutTemplate = function(config){
    
    Ext3.apply(this, config);
    
    var weekLinkTpl = this.showWeekLinks ? '<div id="{weekLinkId}" class="ext3-cal-week-link">{weekNum}</div>' : '';
    
    Ext3.calendar.BoxLayoutTemplate.superclass.constructor.call(this,
        '<tpl for="weeks">',
            '<div id="{[this.id]}-wk-{[xindex-1]}" class="ext3-cal-wk-ct" style="top:{[this.getRowTop(xindex, xcount)]}%; height:{[this.getRowHeight(xcount)]}%;">',
                weekLinkTpl,
                '<table class="ext3-cal-bg-tbl" cellpadding="0" cellspacing="0">',
                    '<tbody>',
                        '<tr>',
                            '<tpl for=".">',
                                 '<td id="{[this.id]}-day-{date:date("Ymd")}" class="{cellCls}">&nbsp;</td>',
                            '</tpl>',
                        '</tr>',
                    '</tbody>',
                '</table>',
                '<table class="ext3-cal-evt-tbl" cellpadding="0" cellspacing="0">',
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

Ext3.extend(Ext3.calendar.BoxLayoutTemplate, Ext3.XTemplate, {
    // private
    applyTemplate : function(o){
        
        Ext3.apply(this, o);
        
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
                    weeks[w].weekLinkId = 'ext3-cal-week-'+dt.format('Ymd');
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
                    titleCls: 'ext3-cal-dtitle ' + (isToday ? ' ext3-cal-dtitle-today' : '') + 
                        (w==0 ? ' ext3-cal-dtitle-first' : '') +
                        (prevMonth ? ' ext3-cal-dtitle-prev' : '') + 
                        (nextMonth ? ' ext3-cal-dtitle-next' : ''),
                    cellCls: 'ext3-cal-day ' + (isToday ? ' ext3-cal-day-today' : '') + 
                        (d==0 ? ' ext3-cal-day-first' : '') +
                        (prevMonth ? ' ext3-cal-day-prev' : '') +
                        (nextMonth ? ' ext3-cal-day-next' : '')
                });
                dt = dt.add(Date.DAY, 1);
                first = false;
            }
        }
        
        return Ext3.calendar.BoxLayoutTemplate.superclass.applyTemplate.call(this, {
            weeks: weeks
        });
    },
    
    // private
    getTodayText : function(){
        var dt = new Date().format('l, F j, Y'),
            todayText = this.showTodayText !== false ? this.todayText : '',
            timeText = this.showTime !== false ? ' <span id="'+this.id+'-clock" class="ext3-cal-dtitle-time">' + 
                    new Date().format('g:i a') + '</span>' : '',
            separator = todayText.length > 0 || timeText.length > 0 ? ' &mdash; ' : '';
        
        if(this.dayCount == 1){
            return dt + separator + todayText + timeText;
        }
        fmt = this.weekCount == 1 ? 'D j' : 'j';
        return todayText.length > 0 ? todayText + timeText : new Date().format(fmt) + timeText;
    }
});

Ext3.calendar.BoxLayoutTemplate.prototype.apply = Ext3.calendar.BoxLayoutTemplate.prototype.applyTemplate;
/**
 * @class Ext3.calendar.MonthViewTemplate
 * @extends Ext3.XTemplate
 * <p>This is the template used to render the {@link Ext3.calendar.MonthView MonthView}. Internally this class defers to an
 * instance of {@link Ext3.calerndar.BoxLayoutTemplate} to handle the inner layout rendering and adds containing elements around
 * that to form the month view.</p> 
 * <p>This template is automatically bound to the underlying event store by the 
 * calendar components and expects records of type {@link Ext3.calendar.EventRecord}.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext3.calendar.MonthViewTemplate = function(config){
    
    Ext3.apply(this, config);
    
    this.weekTpl = new Ext3.calendar.BoxLayoutTemplate(config);
    this.weekTpl.compile();
    
    var weekLinkTpl = this.showWeekLinks ? '<div class="ext3-cal-week-link-hd">&nbsp;</div>' : '';
    
    Ext3.calendar.MonthViewTemplate.superclass.constructor.call(this,
        '<div class="ext3-cal-inner-ct {extraClasses}">',
            '<div class="ext3-cal-hd-ct ext3-cal-month-hd">',
                weekLinkTpl,
                '<table class="ext3-cal-hd-days-tbl" cellpadding="0" cellspacing="0">',
                    '<tbody>',
                        '<tr>',
                            '<tpl for="days">',
                                '<th class="ext3-cal-hd-day{[xindex==1 ? " ext3-cal-day-first" : ""]}" title="{.:date("l, F j, Y")}">{.:date("D")}</th>',
                            '</tpl>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            '</div>',
            '<div class="ext3-cal-body-ct">{weeks}</div>',
        '</div>'
    );
};

Ext3.extend(Ext3.calendar.MonthViewTemplate, Ext3.XTemplate, {
    // private
    applyTemplate : function(o){
        var days = [],
            weeks = this.weekTpl.apply(o),
            dt = o.viewStart;
        
        for(var i = 0; i < 7; i++){
            days.push(dt.add(Date.DAY, i));
        }
        
        var extraClasses = this.showHeader === true ? '' : 'ext3-cal-noheader';
        if(this.showWeekLinks){
            extraClasses += ' ext3-cal-week-links';
        }
        
        return Ext3.calendar.MonthViewTemplate.superclass.applyTemplate.call(this, {
            days: days,
            weeks: weeks,
            extraClasses: extraClasses 
        });
    }
});

Ext3.calendar.MonthViewTemplate.prototype.apply = Ext3.calendar.MonthViewTemplate.prototype.applyTemplate;
/**
 * @class Ext3.dd.ScrollManager
 * <p>Provides automatic scrolling of overflow regions in the page during drag operations.</p>
 * <p>The ScrollManager configs will be used as the defaults for any scroll container registered with it,
 * but you can also override most of the configs per scroll container by adding a 
 * <tt>ddScrollConfig</tt> object to the target element that contains these properties: {@link #hthresh},
 * {@link #vthresh}, {@link #increment} and {@link #frequency}.  Example usage:
 * <pre><code>
var el = Ext3.get('scroll-ct');
el.ddScrollConfig = {
    vthresh: 50,
    hthresh: -1,
    frequency: 100,
    increment: 200
};
Ext3.dd.ScrollManager.register(el);
</code></pre>
 * <b>Note: This class uses "Point Mode" and is untested in "Intersect Mode".</b>
 * @singleton
 */
Ext3.dd.ScrollManager = function() {
    var ddm = Ext3.dd.DragDropMgr,
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
                var dds = Ext3.dd.ScrollManager,
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
                            el.ddScrollConfig.frequency: Ext3.dd.ScrollManager.frequency,
                group = el.ddScrollConfig ? el.ddScrollConfig.ddGroup: undefined;

            if (group === undefined || ddm.dragCurrent.ddGroup == group) {
                proc.id = setInterval(doScroll, freq);
            }
        },
        onFire = function(e, isDrop) {
            if (isDrop || !ddm.dragCurrent) {
                return;
            }
            var dds = Ext3.dd.ScrollManager;
            if (!dragEl || dragEl != ddm.dragCurrent) {
                dragEl = ddm.dragCurrent;
                // refresh regions on drag start
                dds.refreshCache();
            }

            var xy = Ext3.lib.Event.getXY(e),
                pt = new Ext3.lib.Point(xy[0], xy[1]),
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
            if (Ext3.isArray(el)) {
                var i = 0,
                    len = el.length;
                for (; i < len; i++) {
                    this.register(el[i]);
                }
            } else {
                el = Ext3.get(el);
                els[el.id] = el;
            }
        },

        /**
         * Unregisters overflow element(s) so they are no longer scrolled
         * @param {Mixed/Array} el The id of or the element to be removed or an array of either
         */
        unregister: function(el) {
            if (Ext3.isArray(el)) {
                var i = 0,
                    len = el.length;
                for (; i < len; i++) {
                    this.unregister(el[i]);
                }
            } else {
                el = Ext3.get(el);
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
         * MUST BE less than Ext3.dd.ScrollManager.frequency! (defaults to .4)
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
 * @class Ext3.calendar.StatusProxy
 * A specialized drag proxy that supports a drop status icon, {@link Ext3.Layer} styles and auto-repair. It also
 * contains a calendar-specific drag status message containing details about the dragged event's target drop date range.  
 * This is the default drag proxy used by all calendar views.
 * @constructor
 * @param {Object} config
 */
Ext3.calendar.StatusProxy = function(config) {
    Ext3.apply(this, config);
    this.id = this.id || Ext3.id();
    this.el = new Ext3.Layer({
        dh: {
            id: this.id,
            cls: 'ext3-dd-drag-proxy x3-dd-drag-proxy ' + this.dropNotAllowed,
            cn: [
            {
                cls: 'x3-dd-drop-icon'
            },
            {
                cls: 'ext3-dd-ghost-ct',
                cn: [
                {
                    cls: 'x3-dd-drag-ghost'
                },
                {
                    cls: 'ext3-dd-msg'
                }
                ]
            }
            ]
        },
        shadow: !config || config.shadow !== false
    });
    this.ghost = Ext3.get(this.el.dom.childNodes[1].childNodes[0]);
    this.message = Ext3.get(this.el.dom.childNodes[1].childNodes[1]);
    this.dropStatus = this.dropNotAllowed;
};

Ext3.extend(Ext3.calendar.StatusProxy, Ext3.dd.StatusProxy, {
    /**
     * @cfg {String} moveEventCls
     * The CSS class to apply to the status element when an event is being dragged (defaults to 'ext3-cal-dd-move').
     */
    moveEventCls: 'ext3-cal-dd-move',
    /**
     * @cfg {String} addEventCls
     * The CSS class to apply to the status element when drop is not allowed (defaults to 'ext3-cal-dd-add').
     */
    addEventCls: 'ext3-cal-dd-add',

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
            Ext3.fly(el).setStyle('float', 'none').setHeight('auto');
            Ext3.getDom(el).id += '-ddproxy';
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
Ext3.calendar.DragZone = Ext3.extend(Ext3.dd.DragZone, {
    ddGroup: 'CalendarDD',
    eventSelector: '.ext3-cal-evt',

    constructor: function(el, config) {
        if (!Ext3.calendar._statusProxyInstance) {
            Ext3.calendar._statusProxyInstance = new Ext3.calendar.StatusProxy();
        }
        this.proxy = Ext3.calendar._statusProxyInstance;
        Ext3.calendar.DragZone.superclass.constructor.call(this, el, config);
    },

    getDragData: function(e) {
        // Check whether we are dragging on an event first
        var t = e.getTarget(this.eventSelector, 3);
        if (t) {
            var rec = this.view.getEventRecordFromEl(t);
            return {
                type: 'eventdrag',
                ddel: t,
                eventStart: rec.data[Ext3.calendar.EventMappings.StartDate.name],
                eventEnd: rec.data[Ext3.calendar.EventMappings.EndDate.name],
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
            child = Ext3.fly(ghost).child('dl');

            Ext3.fly(ghost).setWidth('auto');

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
        if (Ext3.enableFx && this.dragData.ddel) {
            Ext3.Element.fly(this.dragData.ddel).highlight(this.hlColor || 'c3daf9');
        }
        this.dragging = false;
    },

    getRepairXY: function(e) {
        if (this.dragData.ddel) {
            return Ext3.Element.fly(this.dragData.ddel).getXY();
        }
    },

    afterInvalidDrop: function(e, id) {
        Ext3.select('.ext3-dd-shim').hide();
    }
});

/*
 * Internal drop zone implementation for the calendar components. This provides base functionality
 * and is primarily for the month view -- DayViewDD adds day/week view-specific functionality.
 */
Ext3.calendar.DropZone = Ext3.extend(Ext3.dd.DropZone, {
    ddGroup: 'CalendarDD',
    eventSelector: '.ext3-cal-evt',

    // private
    shims: [],

    getTargetFromEvent: function(e) {
        var dragOffset = this.dragOffset || 0,
        y = e.getPageY() - dragOffset,
        d = this.view.getDayAt(e.getPageX(), y);

        return d.el ? d: null;
    },

    onNodeOver: function(n, dd, e, data) {
        var D = Ext3.calendar.Date,
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
            cnt = Ext3.calendar.Date.diffDays(dt, end) + 1;

        Ext3.each(this.shims,
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

        Ext3.each(this.shims,
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
            this.shimCt = Ext3.get('ext3-dd-shim-ct');
            if (!this.shimCt) {
                this.shimCt = document.createElement('div');
                this.shimCt.id = 'ext3-dd-shim-ct';
                Ext3.getBody().appendChild(this.shimCt);
            }
        }
        var el = document.createElement('div');
        el.className = 'ext3-dd-shim';
        this.shimCt.appendChild(el);

        return new Ext3.Layer({
            shadow: false,
            useDisplay: true,
            constrain: false
        },
        el);
    },

    clearShims: function() {
        Ext3.each(this.shims,
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
                dt = Ext3.calendar.Date.copyTime(rec.data[Ext3.calendar.EventMappings.StartDate.name], n.date);

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
        Ext3.calendar.DropZone.superclass.destroy.call(this);
        Ext3.destroy(this.shimCt);
    }
});

/*
 * Internal drag zone implementation for the calendar day and week views.
 */
Ext3.calendar.DayViewDragZone = Ext3.extend(Ext3.calendar.DragZone, {
    ddGroup: 'DayViewDD',
    resizeSelector: '.ext3-evt-rsz',

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
                eventStart: rec.data[Ext3.calendar.EventMappings.StartDate.name],
                eventEnd: rec.data[Ext3.calendar.EventMappings.EndDate.name],
                proxy: this.proxy
            };
        }
        t = e.getTarget(this.eventSelector, 3);
        if (t) {
            rec = this.view.getEventRecordFromEl(t);
            return {
                type: 'eventdrag',
                ddel: t,
                eventStart: rec.data[Ext3.calendar.EventMappings.StartDate.name],
                eventEnd: rec.data[Ext3.calendar.EventMappings.EndDate.name],
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
Ext3.calendar.DayViewDropZone = Ext3.extend(Ext3.calendar.DropZone, {
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

            curr = Ext3.calendar.Date.copyTime(n.date, this.dragCreateDt);
            this.dragStartDate = Ext3.calendar.Date.min(this.dragCreateDt, curr);
            this.dragEndDate = endDt || Ext3.calendar.Date.max(this.dragCreateDt, curr);

            dt = this.dragStartDate.format('g:ia-') + this.dragEndDate.format('g:ia');
        }
        else {
            evtEl = Ext3.get(data.ddel);
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

                curr = Ext3.calendar.Date.copyTime(n.date, this.resizeDt);
                start = Ext3.calendar.Date.min(data.eventStart, curr);
                end = Ext3.calendar.Date.max(data.eventStart, curr);

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
        Ext3.each(this.shims,
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
                Ext3.destroy(this.dragStartMarker);
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
 * @class Ext3.calendar.EventMappings
 * @extends Object
 * A simple object that provides the field definitions for EventRecords so that they can be easily overridden.
 */
Ext3.calendar.EventMappings = {
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
 * @class Ext3.calendar.EventRecord
 * @extends Ext3.data.Record
 * <p>This is the {@link Ext3.data.Record Record} specification for calendar event data used by the
 * {@link Ext3.calendar.CalendarPanel CalendarPanel}'s underlying store. It can be overridden as 
 * necessary to customize the fields supported by events, although the existing column names should
 * not be altered. If your model fields are named differently you should update the <b>mapping</b>
 * configs accordingly.</p>
 * <p>The only required fields when creating a new event record instance are StartDate and
 * EndDate.  All other fields are either optional are will be defaulted if blank.</p>
 * <p>Here is a basic example for how to create a new record of this type:<pre><code>
rec = new Ext3.calendar.EventRecord({
    StartDate: '2101-01-12 12:00:00',
    EndDate: '2101-01-12 13:30:00',
    Title: 'My cool event',
    Notes: 'Some notes'
});
</code></pre>
 * If you have overridden any of the record's data mappings via the Ext3.calendar.EventMappings object
 * you may need to set the values using this alternate syntax to ensure that the fields match up correctly:<pre><code>
var M = Ext3.calendar.EventMappings;

rec = new Ext3.calendar.EventRecord();
rec.data[M.StartDate.name] = '2101-01-12 12:00:00';
rec.data[M.EndDate.name] = '2101-01-12 13:30:00';
rec.data[M.Title.name] = 'My cool event';
rec.data[M.Notes.name] = 'Some notes';
</code></pre>
 * @constructor
 * @param {Object} data (Optional) An object, the properties of which provide values for the new Record's
 * fields. If not specified the {@link Ext3.data.Field#defaultValue defaultValue}
 * for each field will be assigned.
 * @param {Object} id (Optional) The id of the Record. The id is used by the
 * {@link Ext3.data.Store} object which owns the Record to index its collection
 * of Records (therefore this id should be unique within each store). If an
 * id is not specified a {@link #phantom}
 * Record will be created with an {@link #Record.id automatically generated id}.
 */
 (function() {
    var M = Ext3.calendar.EventMappings;

    Ext3.calendar.EventRecord = Ext3.data.Record.create([
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
     * Reconfigures the default record definition based on the current Ext3.calendar.EventMappings object
     */
    Ext3.calendar.EventRecord.reconfigure = function() {
        Ext3.calendar.EventRecord = Ext3.data.Record.create([
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
Ext3.calendar.MonthDayDetailView = Ext3.extend(Ext3.BoxComponent, {
    initComponent: function() {
        Ext3.calendar.CalendarView.superclass.initComponent.call(this);

        this.addEvents({
            eventsrendered: true
        });

        if (!this.el) {
            this.el = document.createElement('div');
        }
    },

    afterRender: function() {
        this.tpl = this.getTemplate();

        Ext3.calendar.MonthDayDetailView.superclass.afterRender.call(this);

        this.el.on({
            'click': this.view.onClick,
            'mouseover': this.view.onMouseOver,
            'mouseout': this.view.onMouseOut,
            scope: this.view
        });
    },

    getTemplate: function() {
        if (!this.tpl) {
            this.tpl = new Ext3.XTemplate(
            '<div class="ext3-cal-mdv x3-unselectable">',
            '<table class="ext3-cal-mvd-tbl" cellpadding="0" cellspacing="0">',
            '<tbody>',
            '<tpl for=".">',
            '<tr><td class="ext3-cal-ev">{markup}</td></tr>',
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
                recStart = rec.data[Ext3.calendar.EventMappings.StartDate.name].clearTime(true).getTime(),
                startsOnDate = (thisDt == recStart),
                spansDate = false;

            if (!startsOnDate) {
                var recEnd = rec.data[Ext3.calendar.EventMappings.EndDate.name].clearTime(true).getTime();
                spansDate = recStart < thisDt && recEnd >= thisDt;
            }
            return startsOnDate || spansDate;
        },
        this);

        evts.each(function(evt) {
            var item = evt.data,
            M = Ext3.calendar.EventMappings;

            item._renderAsAllDay = item[M.IsAllDay.name] || Ext3.calendar.Date.diffDays(item[M.StartDate.name], item[M.EndDate.name]) > 0;
            item.spanLeft = Ext3.calendar.Date.diffDays(item[M.StartDate.name], this.date) > 0;
            item.spanRight = Ext3.calendar.Date.diffDays(this.date, item[M.EndDate.name]) > 0;
            item.spanCls = (item.spanLeft ? (item.spanRight ? 'ext3-cal-ev-spanboth':
            'ext3-cal-ev-spanleft') : (item.spanRight ? 'ext3-cal-ev-spanright': ''));

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

Ext3.reg('monthdaydetailview', Ext3.calendar.MonthDayDetailView);
/**
 * @class Ext3.calendar.CalendarPicker
 * @extends Ext3.form.ComboBox
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
Ext3.calendar.CalendarPicker = Ext3.extend(Ext3.form.ComboBox, {
    fieldLabel: 'Calendar',
    valueField: 'CalendarId',
    displayField: 'Title',
    triggerAction: 'all',
    mode: 'local',
    forceSelection: true,
    width: 200,

    // private
    initComponent: function() {
        Ext3.calendar.CalendarPicker.superclass.initComponent.call(this);
        this.tpl = this.tpl ||
        '<tpl for="."><div class="x3-combo-list-item ext3-color-{' + this.valueField +
        '}"><div class="ext3-cal-picker-icon">&nbsp;</div>{' + this.displayField + '}</div></tpl>';
    },

    // private
    afterRender: function() {
        Ext3.calendar.CalendarPicker.superclass.afterRender.call(this);

        this.wrap = this.el.up('.x3-form-field-wrap');
        this.wrap.addClass('ext3-calendar-picker');

        this.icon = Ext3.DomHelper.append(this.wrap, {
            tag: 'div',
            cls: 'ext3-cal-picker-icon ext3-cal-picker-mainicon'
        });
    },

    // inherited docs
    setValue: function(value) {
        this.wrap.removeClass('ext3-color-' + this.getValue());
        if (!value && this.store !== undefined) {
            // always default to a valid calendar
            value = this.store.getAt(0).data.CalendarId;
        }
        Ext3.calendar.CalendarPicker.superclass.setValue.call(this, value);
        this.wrap.addClass('ext3-color-' + value);
    }
});

Ext3.reg('calendarpicker', Ext3.calendar.CalendarPicker);
/*
 * This is an internal helper class for the calendar views and should not be overridden.
 * It is responsible for the base event rendering logic underlying all of the calendar views.
 */
Ext3.calendar.WeekEventRenderer = function() {

    var getEventRow = function(id, week, index) {
        var indexOffset = 1,
            //skip row with date #'s
            evtRow,
            wkRow = Ext3.get(id + '-wk-' + week);
        if (wkRow) {
            var table = wkRow.child('.ext3-cal-evt-tbl', true);
                evtRow = table.tBodies[0].childNodes[index + indexOffset];
            if (!evtRow) {
                evtRow = Ext3.DomHelper.append(table.tBodies[0], '<tr></tr>');
            }
        }
        return Ext3.get(evtRow);
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
                            cls: 'ext3-cal-ev',
                            id: o.id + '-empty-0-day-' + dt.format('Ymd'),
                            html: '&nbsp;'
                        };
                        if (dayCount > 1) {
                            cellCfg.colspan = dayCount;
                        }
                        Ext3.DomHelper.append(row, cellCfg);
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
                                        cls: 'ext3-cal-ev',
                                        id: o.id + '-empty-' + ct + '-day-' + dt.format('Ymd')
                                    };
                                    if (emptyCells > 1 && max - ev > emptyCells) {
                                        cellCfg.rowspan = Math.min(emptyCells, max - ev);
                                    }
                                    Ext3.DomHelper.append(row, cellCfg);
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
                                    item._renderAsAllDay = item[Ext3.calendar.EventMappings.IsAllDay.name] || evt.isSpanStart;
                                    item.spanLeft = item[Ext3.calendar.EventMappings.StartDate.name].getTime() < startOfWeek.getTime();
                                    item.spanRight = item[Ext3.calendar.EventMappings.EndDate.name].getTime() > endOfWeek.getTime();
                                    item.spanCls = (item.spanLeft ? (item.spanRight ? 'ext3-cal-ev-spanboth':
                                    'ext3-cal-ev-spanleft') : (item.spanRight ? 'ext3-cal-ev-spanright': ''));

                                    row = getEventRow(o.id, w, ev);
                                    cellCfg = {
                                        tag: 'td',
                                        cls: 'ext3-cal-ev',
                                        cn: eventTpl.apply(o.templateDataFn(item))
                                    };
                                    var diff = Ext3.calendar.Date.diffDays(dt, item[Ext3.calendar.EventMappings.EndDate.name]) + 1,
                                        cspan = Math.min(diff, dayCount - d);

                                    if (cspan > 1) {
                                        cellCfg.colspan = cspan;
                                    }
                                    Ext3.DomHelper.append(row, cellCfg);
                                }
                            }
                            if (ev > max) {
                                row = getEventRow(o.id, w, max);
                                Ext3.DomHelper.append(row, {
                                    tag: 'td',
                                    cls: 'ext3-cal-ev-more',
                                    id: 'ext3-cal-ev-more-' + dt.format('Ymd'),
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
                                        cls: 'ext3-cal-ev',
                                        id: o.id + '-empty-' + (ct + 1) + '-day-' + dt.format('Ymd')
                                    };
                                    var rowspan = o.evtMaxCount[w] - ct;
                                    if (rowspan > 1) {
                                        cellCfg.rowspan = rowspan;
                                    }
                                    Ext3.DomHelper.append(row, cellCfg);
                                }
                            }
                        } else {
                            row = getEventRow(o.id, w, 0);
                            if (row) {
                                cellCfg = {
                                    tag: 'td',
                                    cls: 'ext3-cal-ev',
                                    id: o.id + '-empty-day-' + dt.format('Ymd')
                                };
                                if (o.evtMaxCount[w] > 1) {
                                    cellCfg.rowSpan = o.evtMaxCount[w];
                                }
                                Ext3.DomHelper.append(row, cellCfg);
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
 * @class Ext3.calendar.CalendarView
 * @extends Ext3.BoxComponent
 * <p>This is an abstract class that serves as the base for other calendar views. This class is not
 * intended to be directly instantiated.</p>
 * <p>When extending this class to create a custom calendar view, you must provide an implementation
 * for the <code>renderItems</code> method, as there is no default implementation for rendering events
 * The rendering logic is totally dependent on how the UI structures its data, which
 * is determined by the underlying UI template (this base class does not have a template).</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext3.calendar.CalendarView = Ext3.extend(Ext3.BoxComponent, {
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
    eventSelector: '.ext3-cal-evt',
    eventOverClass: 'ext3-evt-over',
    eventElIdDelimiter: '-evt-',
    dayElIdDelimiter: '-day-',

    /**
     * Returns a string of HTML template markup to be used as the body portion of the event template created
     * by {@link #getEventTemplate}. This provdes the flexibility to customize what's in the body without
     * having to override the entire XTemplate. This string can include any valid {@link Ext3.Template} code, and
     * any data tokens accessible to the containing event template can be referenced in this string.
     * @return {String} The body template string
     */
    getEventBodyMarkup: Ext3.emptyFn,
    // must be implemented by a subclass
    /**
     * <p>Returns the XTemplate that is bound to the calendar's event store (it expects records of type
     * {@link Ext3.calendar.EventRecord}) to populate the calendar views with events. Internally this method
     * by default generates different markup for browsers that support CSS border radius and those that don't.
     * This method can be overridden as needed to customize the markup generated.</p>
     * <p>Note that this method calls {@link #getEventBodyMarkup} to retrieve the body markup for events separately
     * from the surrounding container markup.  This provdes the flexibility to customize what's in the body without
     * having to override the entire XTemplate. If you do override this method, you should make sure that your 
     * overridden version also does the same.</p>
     * @return {Ext3.XTemplate} The event XTemplate
     */
    getEventTemplate: Ext3.emptyFn,
    // must be implemented by a subclass
    // private
    initComponent: function() {
        this.setStartDate(this.startDate || new Date());

        Ext3.calendar.CalendarView.superclass.initComponent.call(this);

        this.addEvents({
            /**
             * @event eventsrendered
             * Fires after events are finished rendering in the view
             * @param {Ext3.calendar.CalendarView} this 
             */
            eventsrendered: true,
            /**
             * @event eventclick
             * Fires after the user clicks on an event element
             * @param {Ext3.calendar.CalendarView} this
             * @param {Ext3.calendar.EventRecord} rec The {@link Ext3.calendar.EventRecord record} for the event that was clicked on
             * @param {HTMLNode} el The DOM node that was clicked on
             */
            eventclick: true,
            /**
             * @event eventover
             * Fires anytime the mouse is over an event element
             * @param {Ext3.calendar.CalendarView} this
             * @param {Ext3.calendar.EventRecord} rec The {@link Ext3.calendar.EventRecord record} for the event that the cursor is over
             * @param {HTMLNode} el The DOM node that is being moused over
             */
            eventover: true,
            /**
             * @event eventout
             * Fires anytime the mouse exits an event element
             * @param {Ext3.calendar.CalendarView} this
             * @param {Ext3.calendar.EventRecord} rec The {@link Ext3.calendar.EventRecord record} for the event that the cursor exited
             * @param {HTMLNode} el The DOM node that was exited
             */
            eventout: true,
            /**
             * @event datechange
             * Fires after the start date of the view changes
             * @param {Ext3.calendar.CalendarView} this
             * @param {Date} startDate The start date of the view (as explained in {@link #getStartDate}
             * @param {Date} viewStart The first displayed date in the view
             * @param {Date} viewEnd The last displayed date in the view
             */
            datechange: true,
            /**
             * @event rangeselect
             * Fires after the user drags on the calendar to select a range of dates/times in which to create an event
             * @param {Ext3.calendar.CalendarView} this
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
             * @param {Ext3.calendar.CalendarView} this
             * @param {Ext3.calendar.EventRecord} rec The {@link Ext3.calendar.EventRecord record} for the event that was moved with
             * updated start and end dates
             */
            eventmove: true,
            /**
             * @event initdrag
             * Fires when a drag operation is initiated in the view
             * @param {Ext3.calendar.CalendarView} this
             */
            initdrag: true,
            /**
             * @event dayover
             * Fires while the mouse is over a day element 
             * @param {Ext3.calendar.CalendarView} this
             * @param {Date} dt The date that is being moused over
             * @param {Ext3.Element} el The day Element that is being moused over
             */
            dayover: true,
            /**
             * @event dayout
             * Fires when the mouse exits a day element 
             * @param {Ext3.calendar.CalendarView} this
             * @param {Date} dt The date that is exited
             * @param {Ext3.Element} el The day Element that is exited
             */
            dayout: true
            /*
             * @event eventdelete
             * Fires after an event element is deleted by the user. Not currently implemented directly at the view level -- currently 
             * deletes only happen from one of the forms.
             * @param {Ext3.calendar.CalendarView} this
             * @param {Ext3.calendar.EventRecord} rec The {@link Ext3.calendar.EventRecord record} for the event that was deleted
             */
            //eventdelete: true
        });
    },

    // private
    afterRender: function() {
        Ext3.calendar.CalendarView.superclass.afterRender.call(this);

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
            var hd = this.el.child('.ext3-cal-hd-ct'),
            bd = this.el.child('.ext3-cal-body-ct');

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
        var days = Ext3.calendar.Date.diffDays(this.viewStart, this.viewEnd);
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
                        var startsOnDate = (dt.getTime() == rec.data[Ext3.calendar.EventMappings.StartDate.name].clearTime(true).getTime());
                        var spansFromPrevView = (w == 0 && d == 0 && (dt > rec.data[Ext3.calendar.EventMappings.StartDate.name]));
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
            var M = Ext3.calendar.EventMappings,
            days = Ext3.calendar.Date.diffDays(
            Ext3.calendar.Date.max(this.viewStart, evt.data[M.StartDate.name]),
            Ext3.calendar.Date.min(this.viewEnd, evt.data[M.EndDate.name])) + 1;

            if (days > 1 || Ext3.calendar.Date.diffDays(evt.data[M.StartDate.name], evt.data[M.EndDate.name]) > 1) {
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
        if (Ext3.calendar.Date.compare(rec.data[Ext3.calendar.EventMappings.StartDate.name], dt) === 0) {
            // no changes
            return;
        }
        var diff = dt.getTime() - rec.data[Ext3.calendar.EventMappings.StartDate.name].getTime();
        rec.set(Ext3.calendar.EventMappings.StartDate.name, dt);
        rec.set(Ext3.calendar.EventMappings.EndDate.name, rec.data[Ext3.calendar.EventMappings.EndDate.name].add(Date.MILLI, diff));

        this.fireEvent('eventmove', this, rec);
    },

    // private
    onCalendarEndDrag: function(start, end, onComplete) {
        // set this flag for other event handlers that might conflict while we're waiting
        this.dragPending = true;

        // have to wait for the user to save or cancel before finalizing the dd interation
        var o = {};
        o[Ext3.calendar.EventMappings.StartDate.name] = start;
        o[Ext3.calendar.EventMappings.EndDate.name] = end;

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
        if (operation == Ext3.data.Record.COMMIT) {
            this.refresh();
            if (this.enableFx && this.enableUpdateFx) {
                this.doUpdateFx(this.getEventEls(rec.data[Ext3.calendar.EventMappings.EventId.name]), {
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
            this.doAddFx(this.getEventEls(rec.data[Ext3.calendar.EventMappings.EventId.name]), {
                scope: this
            });
        };
    },

    doAddFx: function(els, o) {
        els.fadeIn(Ext3.apply(o, {
            duration: 2
        }));
    },

    // private
    onRemove: function(ds, rec) {
        if (this.monitorStoreEvents === false) {
            return;
        }
        if (this.enableFx && this.enableRemoveFx) {
            this.doRemoveFx(this.getEventEls(rec.data[Ext3.calendar.EventMappings.EventId.name]), {
                remove: true,
                scope: this,
                callback: this.refresh
            });
        }
        else {
            this.getEventEls(rec.data[Ext3.calendar.EventMappings.EventId.name]).remove();
            this.refresh();
        }
    },

    doRemoveFx: function(els, o) {
        els.fadeOut(o);
    },

    /**
     * Visually highlights an event using {@link Ext3.Fx#highlight} config options.
     * If {@link #highlightEventActions} is false this method will have no effect.
     * @param {Ext3.CompositeElement} els The element(s) to highlight
     * @param {Object} color (optional) The highlight color. Should be a 6 char hex 
     * color without the leading # (defaults to yellow: 'ffff9c')
     * @param {Object} o (optional) Object literal with any of the {@link Ext3.Fx} config 
     * options. See {@link Ext3.Fx#highlight} for usage examples.
     */
    highlightEvent: function(els, color, o) {
        if (this.enableFx) {
            var c;
            ! (Ext3.isIE || Ext3.isOpera) ?
            els.highlight(color, o) :
            // Fun IE/Opera handling:
            els.each(function(el) {
                el.highlight(color, Ext3.applyIf({
                    attr: 'color'
                },
                o));
                c = el.child('.ext3-cal-evm');
                if (c) {
                    c.highlight(color, o);
                }
            },
            this);
        }
    },

    /**
     * Retrieve an Event object's id from its corresponding node in the DOM.
     * @param {String/Element/HTMLElement} el An {@link Ext3.Element}, DOM node or id
     */
    getEventIdFromEl: function(el) {
        el = Ext3.get(el);
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
     * @return {Ext3.CompositeElement} The matching CompositeElement of nodes
     * that comprise the rendered event.  Any event that spans across a view 
     * boundary will contain more than one internal Element.
     */
    getEventEls: function(eventId) {
        var els = Ext3.select(this.getEventSelectorCls(this.getEventId(eventId), true), false, this.el.id);
        return new Ext3.CompositeElement(els);
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
        M = Ext3.calendar.EventMappings,
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
        M = Ext3.calendar.EventMappings,
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
        return Ext3.get(this.getDayId(dt));
    },

    getDayId: function(dt) {
        if (Ext3.isDate(dt)) {
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
     * @param {MixedCollection} evts A {@link Ext3.util.MixedCollection MixedCollection}  
     * of {@link #Ext3.calendar.EventRecord EventRecord} objects
     */
    sortEventRecordsForDay: function(evts) {
        if (evts.length < 2) {
            return;
        }
        evts.sort('ASC',
        function(evtA, evtB) {
            var a = evtA.data,
            b = evtB.data,
            M = Ext3.calendar.EventMappings;

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
                var diff = Ext3.calendar.Date.diffDays;
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
        if (Ext3.isDate(dt)) {
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
        var days = Ext3.calendar.Date.diffDays(this.viewStart, this.viewEnd) + 1;
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
     * Sets the event store used by the calendar to display {@link Ext3.calendar.EventRecord events}.
     * @param {Ext3.data.Store} store
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
        var idx = this.store.find(Ext3.calendar.EventMappings.EventId.name, id);
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
            rel = Ext3.get(e.getRelatedTarget());
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
                rel = Ext3.get(e.getRelatedTarget()),
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
 * @class Ext3.calendar.MonthView
 * @extends Ext3.calendar.CalendarView
 * <p>Displays a calendar view by month. This class does not usually need ot be used directly as you can
 * use a {@link Ext3.calendar.CalendarPanel CalendarPanel} to manage multiple calendar views at once including
 * the month view.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext3.calendar.MonthView = Ext3.extend(Ext3.calendar.CalendarView, {
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
     * True to display an extra column before the first day in the calendar that links to the {@link Ext3.calendar.WeekView view}
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
     * defaults to 'ext3-week-link-over').
     */
    weekLinkOverClass: 'ext3-week-link-over',

    //private properties -- do not override:
    daySelector: '.ext3-cal-day',
    moreSelector: '.ext3-cal-ev-more',
    weekLinkSelector: '.ext3-cal-week-link',
    weekCount: -1,
    // defaults to auto by month
    dayCount: 7,
    moreElIdDelimiter: '-more-',
    weekLinkIdDelimiter: 'ext3-cal-week-',

    // private
    initComponent: function() {
        Ext3.calendar.MonthView.superclass.initComponent.call(this);
        this.addEvents({
            /**
             * @event dayclick
             * Fires after the user clicks within the view container and not on an event element
             * @param {Ext3.calendar.MonthView} this
             * @param {Date} dt The date/time that was clicked on
             * @param {Boolean} allday True if the day clicked on represents an all-day box, else false. Clicks within the 
             * MonthView always return true for this param.
             * @param {Ext3.Element} el The Element that was clicked on
             */
            dayclick: true,
            /**
             * @event weekclick
             * Fires after the user clicks within a week link (when {@link #showWeekLinks is true)
             * @param {Ext3.calendar.MonthView} this
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

        this.dragZone = new Ext3.calendar.DragZone(this.el, cfg);
        this.dropZone = new Ext3.calendar.DropZone(this.el, cfg);
    },

    // private
    onDestroy: function() {
        Ext3.destroy(this.ddSelector);
        Ext3.destroy(this.dragZone);
        Ext3.destroy(this.dropZone);
        Ext3.calendar.MonthView.superclass.onDestroy.call(this);
    },

    // private
    afterRender: function() {
        if (!this.tpl) {
            this.tpl = new Ext3.calendar.MonthViewTemplate({
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
        this.addClass('ext3-cal-monthview ext3-cal-ct');

        Ext3.calendar.MonthView.superclass.afterRender.call(this);
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
            var hd = this.el.select('.ext3-cal-hd-days-tbl'),
            bgTbl = this.el.select('.ext3-cal-bg-tbl'),
            evTbl = this.el.select('.ext3-cal-evt-tbl'),
            wkLinkW = this.el.child('.ext3-cal-week-link').getWidth(),
            w = this.el.getWidth() - wkLinkW;

            hd.setWidth(w);
            bgTbl.setWidth(w);
            evTbl.setWidth(w);
        }
        Ext3.calendar.MonthView.superclass.forceSize.call(this);
    },

    //private
    initClock: function() {
        if (Ext3.fly(this.id + '-clock') !== null) {
            this.prevClockDay = new Date().getDay();
            if (this.clockTask) {
                Ext3.TaskMgr.stop(this.clockTask);
            }
            this.clockTask = Ext3.TaskMgr.start({
                run: function() {
                    var el = Ext3.fly(this.id + '-clock'),
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
            '<i class="ext3-cal-ic ext3-cal-ic-rem">&nbsp;</i>',
            '</tpl>',
            '<tpl if="_isRecurring">',
            '<i class="ext3-cal-ic ext3-cal-ic-rcr">&nbsp;</i>',
            '</tpl>',
            '<tpl if="spanLeft">',
            '<i class="ext3-cal-spl">&nbsp;</i>',
            '</tpl>',
            '<tpl if="spanRight">',
            '<i class="ext3-cal-spr">&nbsp;</i>',
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

            tpl = !(Ext3.isIE || Ext3.isOpera) ?
            new Ext3.XTemplate(
            '<div id="{_elId}" class="{_selectorCls} {_colorCls} {values.spanCls} ext3-cal-evt ext3-cal-evr">',
            body,
            '</div>'
            )
            : new Ext3.XTemplate(
            '<tpl if="_renderAsAllDay">',
            '<div id="{_elId}" class="{_selectorCls} {values.spanCls} {_colorCls} ext3-cal-evt ext3-cal-evo">',
            '<div class="ext3-cal-evm">',
            '<div class="ext3-cal-evi">',
            '</tpl>',
            '<tpl if="!_renderAsAllDay">',
            '<div id="{_elId}" class="{_selectorCls} {_colorCls} ext3-cal-evt ext3-cal-evr">',
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
        var M = Ext3.calendar.EventMappings,
        selector = this.getEventSelectorCls(evt[M.EventId.name]),
        title = evt[M.Title.name];

        return Ext3.applyIf({
            _selectorCls: selector,
            _colorCls: 'ext3-color-' + (evt[M.CalendarId.name] ?
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
        Ext3.calendar.MonthView.superclass.refresh.call(this);

        if (this.showTime !== false) {
            this.initClock();
        }
    },

    // private
    renderItems: function() {
        Ext3.calendar.WeekEventRenderer.render({
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
        return Ext3.get(this.getDayId(dt));
    },

    // private
    getDayId: function(dt) {
        if (Ext3.isDate(dt)) {
            dt = dt.format('Ymd');
        }
        return this.id + this.dayElIdDelimiter + dt;
    },

    // private
    getWeekIndex: function(dt) {
        var el = this.getDayEl(dt).up('.ext3-cal-wk-ct');
        return parseInt(el.id.split('-wk-')[1], 10);
    },

    // private
    getDaySize: function(contentOnly) {
        var box = this.el.getBox(),
        w = box.width / this.dayCount,
        h = box.height / this.getWeekCount();

        if (contentOnly) {
            var hd = this.el.select('.ext3-cal-dtitle').first().parent('tr');
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
            var evt = this.el.select('.ext3-cal-evt').first();
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
        Ext3.calendar.MonthView.superclass.onInitDrag.call(this);
        Ext3.select(this.daySelector).removeClass(this.dayOverClass);
        if (this.detailPanel) {
            this.detailPanel.hide();
        }
    },

    // private
    onMoreClick: function(dt) {
        if (!this.detailPanel) {
            this.detailPanel = new Ext3.Panel({
                id: this.id + '-details-panel',
                title: dt.format('F j'),
                layout: 'fit',
                floating: true,
                renderTo: Ext3.getBody(),
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
        Ext3.calendar.MonthView.superclass.onHide.call(this);
        if (this.detailPanel) {
            this.detailPanel.hide();
        }
    },

    // private
    onClick: function(e, t) {
        if (this.detailPanel) {
            this.detailPanel.hide();
        }
        if (Ext3.calendar.MonthView.superclass.onClick.apply(this, arguments)) {
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

                this.fireEvent('dayclick', this, Date.parseDate(dt, 'Ymd'), false, Ext3.get(this.getDayId(dt)));
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
        Ext3.calendar.MonthView.superclass.handleDayMouseEvent.apply(this, arguments);
    }
});

Ext3.reg('monthview', Ext3.calendar.MonthView);
/**
 * @class Ext3.calendar.DayHeaderView
 * @extends Ext3.calendar.MonthView
 * <p>This is the header area container within the day and week views where all-day events are displayed.
 * Normally you should not need to use this class directly -- instead you should use {@link Ext3.calendar.DayView DayView}
 * which aggregates this class and the {@link Ext3.calendar.DayBodyView DayBodyView} into the single unified view
 * presented by {@link Ext3.calendar.CalendarPanel CalendarPanel}.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext3.calendar.DayHeaderView = Ext3.extend(Ext3.calendar.MonthView, {
    // private configs
    weekCount: 1,
    dayCount: 1,
    allDayOnly: true,
    monitorResize: false,

    /**
     * @event dayclick
     * Fires after the user clicks within the day view container and not on an event element
     * @param {Ext3.calendar.DayBodyView} this
     * @param {Date} dt The date/time that was clicked on
     * @param {Boolean} allday True if the day clicked on represents an all-day box, else false. Clicks within the 
     * DayHeaderView always return true for this param.
     * @param {Ext3.Element} el The Element that was clicked on
     */

    // private
    afterRender: function() {
        if (!this.tpl) {
            this.tpl = new Ext3.calendar.DayHeaderTemplate({
                id: this.id,
                showTodayText: this.showTodayText,
                todayText: this.todayText,
                showTime: this.showTime
            });
        }
        this.tpl.compile();
        this.addClass('ext3-cal-day-header');

        Ext3.calendar.DayHeaderView.superclass.afterRender.call(this);
    },

    // private
    forceSize: Ext3.emptyFn,

    // private
    refresh: function() {
        Ext3.calendar.DayHeaderView.superclass.refresh.call(this);
        this.recalcHeaderBox();
    },

    // private
    recalcHeaderBox: function() {
        var tbl = this.el.child('.ext3-cal-evt-tbl'),
        h = tbl.getHeight();

        this.el.setHeight(h + 7);

        if (Ext3.isIE && Ext3.isStrict) {
            this.el.child('.ext3-cal-hd-ad-inner').setHeight(h + 4);
        }
        if (Ext3.isOpera) {
            //TODO: figure out why Opera refuses to refresh height when
            //the new height is lower than the previous one
            //            var ct = this.el.child('.ext3-cal-hd-ct');
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

                this.fireEvent('dayclick', this, Date.parseDate(dt, 'Ymd'), true, Ext3.get(this.getDayId(dt)));
                return;
            }
        }
        Ext3.calendar.DayHeaderView.superclass.onClick.apply(this, arguments);
    }
});

Ext3.reg('dayheaderview', Ext3.calendar.DayHeaderView);
/**S
 * @class Ext3.calendar.DayBodyView
 * @extends Ext3.calendar.CalendarView
 * <p>This is the scrolling container within the day and week views where non-all-day events are displayed.
 * Normally you should not need to use this class directly -- instead you should use {@link Ext3.calendar.DayView DayView}
 * which aggregates this class and the {@link Ext3.calendar.DayHeaderView DayHeaderView} into the single unified view
 * presented by {@link Ext3.calendar.CalendarPanel CalendarPanel}.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext3.calendar.DayBodyView = Ext3.extend(Ext3.calendar.CalendarView, {
    //private
    dayColumnElIdDelimiter: '-day-col-',

    //private
    initComponent: function() {
        Ext3.calendar.DayBodyView.superclass.initComponent.call(this);

        this.addEvents({
            /**
             * @event eventresize
             * Fires after the user drags the resize handle of an event to resize it
             * @param {Ext3.calendar.DayBodyView} this
             * @param {Ext3.calendar.EventRecord} rec The {@link Ext3.calendar.EventRecord record} for the event that was resized
             * containing the updated start and end dates
             */
            eventresize: true,
            /**
             * @event dayclick
             * Fires after the user clicks within the day view container and not on an event element
             * @param {Ext3.calendar.DayBodyView} this
             * @param {Date} dt The date/time that was clicked on
             * @param {Boolean} allday True if the day clicked on represents an all-day box, else false. Clicks within the 
             * DayBodyView always return false for this param.
             * @param {Ext3.Element} el The Element that was clicked on
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
            vthresh: Ext3.isIE || Ext3.isOpera ? 100: 40,
            hthresh: -1,
            frequency: 50,
            increment: 100,
            ddGroup: 'DayViewDD'
        };
        this.dragZone = new Ext3.calendar.DayViewDragZone(this.el, Ext3.apply({
            view: this,
            containerScroll: true
        },
        cfg));

        this.dropZone = new Ext3.calendar.DayViewDropZone(this.el, Ext3.apply({
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
        defer = defer || (Ext3.isIE || Ext3.isOpera);
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
            this.tpl = new Ext3.calendar.DayBodyTemplate({
                id: this.id,
                dayCount: this.dayCount,
                showTodayText: this.showTodayText,
                todayText: this.todayText,
                showTime: this.showTime
            });
        }
        this.tpl.compile();

        this.addClass('ext3-cal-body-ct');

        Ext3.calendar.DayBodyView.superclass.afterRender.call(this);

        // default scroll position to 7am:
        this.scrollTo(7 * 42);
    },

    // private
    forceSize: Ext3.emptyFn,

    // private
    onEventResize: function(rec, data) {
        var D = Ext3.calendar.Date,
        start = Ext3.calendar.EventMappings.StartDate.name,
        end = Ext3.calendar.EventMappings.EndDate.name;

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
            '<i class="ext3-cal-ic ext3-cal-ic-rem">&nbsp;</i>',
            '</tpl>',
            '<tpl if="_isRecurring">',
            '<i class="ext3-cal-ic ext3-cal-ic-rcr">&nbsp;</i>',
            '</tpl>'
            //                '<tpl if="spanLeft">',
            //                    '<i class="ext3-cal-spl">&nbsp;</i>',
            //                '</tpl>',
            //                '<tpl if="spanRight">',
            //                    '<i class="ext3-cal-spr">&nbsp;</i>',
            //                '</tpl>'
            ].join('');
        }
        return this.eventBodyMarkup;
    },

    // inherited docs
    getEventTemplate: function() {
        if (!this.eventTpl) {
            this.eventTpl = !(Ext3.isIE || Ext3.isOpera) ?
            new Ext3.XTemplate(
            '<div id="{_elId}" class="{_selectorCls} {_colorCls} ext3-cal-evt ext3-cal-evr" style="left: {_left}%; width: {_width}%; top: {_top}px; height: {_height}px;">',
            '<div class="ext3-evt-bd">', this.getEventBodyMarkup(), '</div>',
            '<div class="ext3-evt-rsz"><div class="ext3-evt-rsz-h">&nbsp;</div></div>',
            '</div>'
            )
            : new Ext3.XTemplate(
            '<div id="{_elId}" class="ext3-cal-evt {_selectorCls} {_colorCls}-x" style="left: {_left}%; width: {_width}%; top: {_top}px;">',
            '<div class="ext3-cal-evb">&nbsp;</div>',
            '<dl style="height: {_height}px;" class="ext3-cal-evdm">',
            '<dd class="ext3-evt-bd">',
            this.getEventBodyMarkup(),
            '</dd>',
            '<div class="ext3-evt-rsz"><div class="ext3-evt-rsz-h">&nbsp;</div></div>',
            '</dl>',
            '<div class="ext3-cal-evb">&nbsp;</div>',
            '</div>'
            );
            this.eventTpl.compile();
        }
        return this.eventTpl;
    },

    /**
     * <p>Returns the XTemplate that is bound to the calendar's event store (it expects records of type
     * {@link Ext3.calendar.EventRecord}) to populate the calendar views with <strong>all-day</strong> events. 
     * Internally this method by default generates different markup for browsers that support CSS border radius 
     * and those that don't. This method can be overridden as needed to customize the markup generated.</p>
     * <p>Note that this method calls {@link #getEventBodyMarkup} to retrieve the body markup for events separately
     * from the surrounding container markup.  This provdes the flexibility to customize what's in the body without
     * having to override the entire XTemplate. If you do override this method, you should make sure that your 
     * overridden version also does the same.</p>
     * @return {Ext3.XTemplate} The event XTemplate
     */
    getEventAllDayTemplate: function() {
        if (!this.eventAllDayTpl) {
            var tpl,
            body = this.getEventBodyMarkup();

            tpl = !(Ext3.isIE || Ext3.isOpera) ?
            new Ext3.XTemplate(
            '<div id="{_elId}" class="{_selectorCls} {_colorCls} {values.spanCls} ext3-cal-evt ext3-cal-evr" style="left: {_left}%; width: {_width}%; top: {_top}px; height: {_height}px;">',
            body,
            '</div>'
            )
            : new Ext3.XTemplate(
            '<div id="{_elId}" class="ext3-cal-evt" style="left: {_left}%; width: {_width}%; top: {_top}px; height: {_height}px;">',
            '<div class="{_selectorCls} {values.spanCls} {_colorCls} ext3-cal-evo">',
            '<div class="ext3-cal-evm">',
            '<div class="ext3-cal-evi">',
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
        var selector = this.getEventSelectorCls(evt[Ext3.calendar.EventMappings.EventId.name]),
        data = {},
        M = Ext3.calendar.EventMappings;

        this.getTemplateEventBox(evt);

        data._selectorCls = selector;
        data._colorCls = 'ext3-color-' + evt[M.CalendarId.name] + (evt._renderAsAllDay ? '-ad': '');
        data._elId = selector + (evt._weekIndex ? '-' + evt._weekIndex: '');
        data._isRecurring = evt.Recurrence && evt.Recurrence != '';
        data._isReminder = evt[M.Reminder.name] && evt[M.Reminder.name] != '';
        var title = evt[M.Title.name];
        data.Title = (evt[M.IsAllDay.name] ? '': evt[M.StartDate.name].format('g:ia ')) + (!title || title.length == 0 ? '(No title)': title);

        return Ext3.applyIf(data, evt);
    },

    // private
    getTemplateEventBox: function(evt) {
        var heightFactor = 0.7,
            start = evt[Ext3.calendar.EventMappings.StartDate.name],
            end = evt[Ext3.calendar.EventMappings.EndDate.name],
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
                Ext3.apply(item, {
                    cls: 'ext3-cal-ev',
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

            Ext3.DomHelper.append(target, markup);
        }

        this.fireEvent('eventsrendered', this);
    },

    // private
    getDayEl: function(dt) {
        return Ext3.get(this.getDayId(dt));
    },

    // private
    getDayId: function(dt) {
        if (Ext3.isDate(dt)) {
            dt = dt.format('Ymd');
        }
        return this.id + this.dayColumnElIdDelimiter + dt;
    },

    // private
    getDaySize: function() {
        var box = this.el.child('.ext3-cal-day-col-inner').getBox();
        return {
            height: box.height,
            width: box.width
        };
    },

    // private
    getDayAt: function(x, y) {
        var sel = '.ext3-cal-body-ct',
        xoffset = this.el.child('.ext3-cal-day-times').getWidth(),
        viewBox = this.el.getBox(),
        daySize = this.getDaySize(false),
        relX = x - viewBox.x - xoffset,
        dayIndex = Math.floor(relX / daySize.width),
        // clicked col index
        scroll = this.el.getScroll(),
        row = this.el.child('.ext3-cal-bg-row'),
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
        if (this.dragPending || Ext3.calendar.DayBodyView.superclass.onClick.apply(this, arguments)) {
            // The superclass handled the click already so exit
            return;
        }
        if (e.getTarget('.ext3-cal-day-times', 3) !== null) {
            // ignore clicks on the times-of-day gutter
            return;
        }
        var el = e.getTarget('td', 3);
        if (el) {
            if (el.id && el.id.indexOf(this.dayElIdDelimiter) > -1) {
                var dt = this.getDateFromId(el.id, this.dayElIdDelimiter);
                this.fireEvent('dayclick', this, Date.parseDate(dt, 'Ymd'), true, Ext3.get(this.getDayId(dt, true)));
                return;
            }
        }
        var day = this.getDayAt(e.xy[0], e.xy[1]);
        if (day && day.date) {
            this.fireEvent('dayclick', this, day.date, false, null);
        }
    }
});

Ext3.reg('daybodyview', Ext3.calendar.DayBodyView);
/**
 * @class Ext3.calendar.DayView
 * @extends Ext3.Container
 * <p>Unlike other calendar views, is not actually a subclass of {@link Ext3.calendar.CalendarView CalendarView}.
 * Instead it is a {@link Ext3.Container Container} subclass that internally creates and manages the layouts of
 * a {@link Ext3.calendar.DayHeaderView DayHeaderView} and a {@link Ext3.calendar.DayBodyView DayBodyView}. As such
 * DayView accepts any config values that are valid for DayHeaderView and DayBodyView and passes those through
 * to the contained views. It also supports the interface required of any calendar view and in turn calls methods
 * on the contained views as necessary.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext3.calendar.DayView = Ext3.extend(Ext3.Container, {
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
        
        var cfg = Ext3.apply({}, this.initialConfig);
        cfg.showTime = this.showTime;
        cfg.showTodatText = this.showTodayText;
        cfg.todayText = this.todayText;
        cfg.dayCount = this.dayCount;
        cfg.wekkCount = 1; 
        
        var header = Ext3.applyIf({
            xtype: 'dayheaderview',
            id: this.id+'-hd'
        }, cfg);
        
        var body = Ext3.applyIf({
            xtype: 'daybodyview',
            id: this.id+'-bd'
        }, cfg);
        
        this.items = [header, body];
        this.addClass('ext3-cal-dayview ext3-cal-ct');
        
        Ext3.calendar.DayView.superclass.initComponent.call(this);
    },
    
    // private
    afterRender : function(){
        Ext3.calendar.DayView.superclass.afterRender.call(this);
        
        this.header = Ext3.getCmp(this.id+'-hd');
        this.body = Ext3.getCmp(this.id+'-bd');
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
            var ct = this.el.up('.x3-panel-body'),
                hd = this.el.child('.ext3-cal-day-header'),
                h = ct.getHeight() - hd.getHeight();
            
            this.el.child('.ext3-cal-body-ct').setHeight(h);
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

Ext3.reg('dayview', Ext3.calendar.DayView);
/**
 * @class Ext3.calendar.WeekView
 * @extends Ext3.calendar.DayView
 * <p>Displays a calendar view by week. This class does not usually need ot be used directly as you can
 * use a {@link Ext3.calendar.CalendarPanel CalendarPanel} to manage multiple calendar views at once including
 * the week view.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext3.calendar.WeekView = Ext3.extend(Ext3.calendar.DayView, {
    /**
     * @cfg {Number} dayCount
     * The number of days to display in the view (defaults to 7)
     */
    dayCount: 7
});

Ext3.reg('weekview', Ext3.calendar.WeekView);/**
 * @class Ext3.calendar.DateRangeField
 * @extends Ext3.form.Field
 * <p>A combination field that includes start and end dates and times, as well as an optional all-day checkbox.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext3.calendar.DateRangeField = Ext3.extend(Ext3.form.Field, {
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
            this.startDate = new Ext3.form.DateField({
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
            this.startTime = new Ext3.form.TimeField({
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
            this.endTime = new Ext3.form.TimeField({
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
            this.endDate = new Ext3.form.DateField({
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
            this.allDay = new Ext3.form.Checkbox({
                id: this.id + '-allday',
                hidden: this.showTimes === false || this.showAllDay === false,
                boxLabel: this.allDayText,
                handler: function(chk, checked) {
                    this.startTime.setVisible(!checked);
                    this.endTime.setVisible(!checked);
                },
                scope: this
            });
            this.toLabel = new Ext3.form.Label({
                xtype: 'label',
                id: this.id + '-to-label',
                text: this.toText
            });

            this.fieldCt = new Ext3.Container({
                autoEl: {
                    id: this.id
                },
                //make sure the container el has the field's id
                cls: 'ext3-dt-range',
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
            this.items = new Ext3.util.MixedCollection();
            this.items.addAll([this.startDate, this.endDate, this.toLabel, this.startTime, this.endTime, this.allDay]);
        }
        Ext3.calendar.DateRangeField.superclass.onRender.call(this, ct, position);
    },

    // private
    checkDates: function(type, startend) {
        var startField = Ext3.getCmp(this.id + '-start-' + type),
        endField = Ext3.getCmp(this.id + '-end-' + type),
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

        if (Ext3.isDate(dt)) {
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
     * as defined in {@link Ext3.calendar.EventMappings}.</div></li><ul></div>
     */
    setValue: function(v) {
        if (Ext3.isArray(v)) {
            this.setDT(v[0], 'start');
            this.setDT(v[1], 'end');
            this.allDay.setValue( !! v[2]);
        }
        else if (Ext3.isDate(v)) {
            this.setDT(v, 'start');
            this.setDT(v, 'end');
            this.allDay.setValue(false);
        }
        else if (v[Ext3.calendar.EventMappings.StartDate.name]) {
            //object
            this.setDT(v[Ext3.calendar.EventMappings.StartDate.name], 'start');
            if (!this.setDT(v[Ext3.calendar.EventMappings.EndDate.name], 'end')) {
                this.setDT(v[Ext3.calendar.EventMappings.StartDate.name], 'end');
            }
            this.allDay.setValue( !! v[Ext3.calendar.EventMappings.IsAllDay.name]);
        }
    },

    // private setValue helper
    setDT: function(dt, startend) {
        if (dt && Ext3.isDate(dt)) {
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
        Ext3.destroy(this.fieldCt);
        Ext3.calendar.DateRangeField.superclass.beforeDestroy.call(this);
    },

    /**
     * @method getRawValue
     * @hide
     */
    getRawValue: Ext3.emptyFn,
    /**
     * @method setRawValue
     * @hide
     */
    setRawValue: Ext3.emptyFn
});

Ext3.reg('daterangefield', Ext3.calendar.DateRangeField);
/**
 * @class Ext3.calendar.ReminderField
 * @extends Ext3.form.ComboBox
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
Ext3.calendar.ReminderField = Ext3.extend(Ext3.form.ComboBox, {
    width: 200,
    fieldLabel: 'Reminder',
    mode: 'local',
    triggerAction: 'all',
    forceSelection: true,
    displayField: 'desc',
    valueField: 'value',

    // private
    initComponent: function() {
        Ext3.calendar.ReminderField.superclass.initComponent.call(this);

        this.store = this.store || new Ext3.data.ArrayStore({
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

Ext3.reg('reminderfield', Ext3.calendar.ReminderField);
/**
 * @class Ext3.calendar.EventEditForm
 * @extends Ext3.form.FormPanel
 * <p>A custom form used for detailed editing of events.</p>
 * <p>This is pretty much a standard form that is simply pre-configured for the options needed by the
 * calendar components. It is also configured to automatically bind records of type {@link Ext3.calendar.EventRecord}
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
    cls: 'ext3-evt-edit-form',
</code></pre>
 * @constructor
 * @param {Object} config The config object
 */
Ext3.calendar.EventEditForm = Ext3.extend(Ext3.form.FormPanel, {
    labelWidth: 65,
    title: 'Event Form',
    titleTextAdd: 'Add Event',
    titleTextEdit: 'Edit Event',
    bodyStyle: 'background:transparent;padding:20px 20px 10px;',
    border: false,
    buttonAlign: 'center',
    autoHeight: true,
    // to allow for the notes field to autogrow
    cls: 'ext3-evt-edit-form',

    // private properties:
    newId: 10000,
    layout: 'column',

    // private
    initComponent: function() {

        this.addEvents({
            /**
             * @event eventadd
             * Fires after a new event is added
             * @param {Ext3.calendar.EventEditForm} this
             * @param {Ext3.calendar.EventRecord} rec The new {@link Ext3.calendar.EventRecord record} that was added
             */
            eventadd: true,
            /**
             * @event eventupdate
             * Fires after an existing event is updated
             * @param {Ext3.calendar.EventEditForm} this
             * @param {Ext3.calendar.EventRecord} rec The new {@link Ext3.calendar.EventRecord record} that was updated
             */
            eventupdate: true,
            /**
             * @event eventdelete
             * Fires after an event is deleted
             * @param {Ext3.calendar.EventEditForm} this
             * @param {Ext3.calendar.EventRecord} rec The new {@link Ext3.calendar.EventRecord record} that was deleted
             */
            eventdelete: true,
            /**
             * @event eventcancel
             * Fires after an event add/edit operation is canceled by the user and no store update took place
             * @param {Ext3.calendar.EventEditForm} this
             * @param {Ext3.calendar.EventRecord} rec The new {@link Ext3.calendar.EventRecord record} that was canceled
             */
            eventcancel: true
        });

        this.titleField = new Ext3.form.TextField({
            fieldLabel: 'Title',
            name: Ext3.calendar.EventMappings.Title.name,
            anchor: '90%'
        });
        this.dateRangeField = new Ext3.calendar.DateRangeField({
            fieldLabel: 'When',
            anchor: '90%'
        });
        this.reminderField = new Ext3.calendar.ReminderField({
            name: 'Reminder'
        });
        this.notesField = new Ext3.form.TextArea({
            fieldLabel: 'Notes',
            name: Ext3.calendar.EventMappings.Notes.name,
            grow: true,
            growMax: 150,
            anchor: '100%'
        });
        this.locationField = new Ext3.form.TextField({
            fieldLabel: 'Location',
            name: Ext3.calendar.EventMappings.Location.name,
            anchor: '100%'
        });
        this.urlField = new Ext3.form.TextField({
            fieldLabel: 'Web Link',
            name: Ext3.calendar.EventMappings.Url.name,
            anchor: '100%'
        });

        var leftFields = [this.titleField, this.dateRangeField, this.reminderField],
        rightFields = [this.notesField, this.locationField, this.urlField];

        if (this.calendarStore) {
            this.calendarField = new Ext3.calendar.CalendarPicker({
                store: this.calendarStore,
                name: Ext3.calendar.EventMappings.CalendarId.name
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
            cls: 'ext3-del-btn',
            text: 'Delete',
            scope: this,
            handler: this.onDelete
        },
        {
            text: 'Cancel',
            scope: this,
            handler: this.onCancel
        }];

        Ext3.calendar.EventEditForm.superclass.initComponent.call(this);
    },

    // inherited docs
    loadRecord: function(rec) {
        this.form.loadRecord.apply(this.form, arguments);
        this.activeRecord = rec;
        this.dateRangeField.setValue(rec.data);
        if (this.calendarStore) {
            this.form.setValues({
                'calendar': rec.data[Ext3.calendar.EventMappings.CalendarId.name]
            });
        }
        this.isAdd = !!rec.data[Ext3.calendar.EventMappings.IsNew.name];
        if (this.isAdd) {
            rec.markDirty();
            this.setTitle(this.titleTextAdd);
            Ext3.select('.ext3-del-btn').setDisplayed(false);
        }
        else {
            this.setTitle(this.titleTextEdit);
            Ext3.select('.ext3-del-btn').setDisplayed(true);
        }
        this.titleField.focus();
    },

    // inherited docs
    updateRecord: function() {
        var dates = this.dateRangeField.getValue();

        this.form.updateRecord(this.activeRecord);
        this.activeRecord.set(Ext3.calendar.EventMappings.StartDate.name, dates[0]);
        this.activeRecord.set(Ext3.calendar.EventMappings.EndDate.name, dates[1]);
        this.activeRecord.set(Ext3.calendar.EventMappings.IsAllDay.name, dates[2]);
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

Ext3.reg('eventeditform', Ext3.calendar.EventEditForm);
/**
 * @class Ext3.calendar.EventEditWindow
 * @extends Ext3.Window
 * <p>A custom window containing a basic edit form used for quick editing of events.</p>
 * <p>This window also provides custom events specific to the calendar so that other calendar components can be easily
 * notified when an event has been edited via this component.</p>
 * @constructor
 * @param {Object} config The config object
 */
Ext3.calendar.EventEditWindow = function(config) {
    var formPanelCfg = {
        xtype: 'form',
        labelWidth: 65,
        frame: false,
        bodyStyle: 'background:transparent;padding:5px 10px 10px;',
        bodyBorder: false,
        border: false,
        items: [{
            id: 'title',
            name: Ext3.calendar.EventMappings.Title.name,
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

    Ext3.calendar.EventEditWindow.superclass.constructor.call(this, Ext3.apply({
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

Ext3.extend(Ext3.calendar.EventEditWindow, Ext3.Window, {
    // private
    newId: 10000,

    // private
    initComponent: function() {
        Ext3.calendar.EventEditWindow.superclass.initComponent.call(this);

        this.formPanel = this.items.items[0];

        this.addEvents({
            /**
             * @event eventadd
             * Fires after a new event is added
             * @param {Ext3.calendar.EventEditWindow} this
             * @param {Ext3.calendar.EventRecord} rec The new {@link Ext3.calendar.EventRecord record} that was added
             */
            eventadd: true,
            /**
             * @event eventupdate
             * Fires after an existing event is updated
             * @param {Ext3.calendar.EventEditWindow} this
             * @param {Ext3.calendar.EventRecord} rec The new {@link Ext3.calendar.EventRecord record} that was updated
             */
            eventupdate: true,
            /**
             * @event eventdelete
             * Fires after an event is deleted
             * @param {Ext3.calendar.EventEditWindow} this
             * @param {Ext3.calendar.EventRecord} rec The new {@link Ext3.calendar.EventRecord record} that was deleted
             */
            eventdelete: true,
            /**
             * @event eventcancel
             * Fires after an event add/edit operation is canceled by the user and no store update took place
             * @param {Ext3.calendar.EventEditWindow} this
             * @param {Ext3.calendar.EventRecord} rec The new {@link Ext3.calendar.EventRecord record} that was canceled
             */
            eventcancel: true,
            /**
             * @event editdetails
             * Fires when the user selects the option in this window to continue editing in the detailed edit form
             * (by default, an instance of {@link Ext3.calendar.EventEditForm}. Handling code should hide this window
             * and transfer the current event record to the appropriate instance of the detailed form by showing it
             * and calling {@link Ext3.calendar.EventEditForm#loadRecord loadRecord}.
             * @param {Ext3.calendar.EventEditWindow} this
             * @param {Ext3.calendar.EventRecord} rec The {@link Ext3.calendar.EventRecord record} that is currently being edited
             */
            editdetails: true
        });
    },

    // private
    afterRender: function() {
        Ext3.calendar.EventEditWindow.superclass.afterRender.call(this);

        this.el.addClass('ext3-cal-event-win');

        Ext3.get('tblink').on('click',
        function(e) {
            e.stopEvent();
            this.updateRecord();
            this.fireEvent('editdetails', this, this.activeRecord);
        },
        this);
    },

    /**
     * Shows the window, rendering it first if necessary, or activates it and brings it to front if hidden.
	 * @param {Ext3.data.Record/Object} o Either a {@link Ext3.data.Record} if showing the form
	 * for an existing event in edit mode, or a plain object containing a StartDate property (and 
	 * optionally an EndDate property) for showing the form in add mode. 
     * @param {String/Element} animateTarget (optional) The target element or id from which the window should
     * animate while opening (defaults to null with no animation)
     * @return {Ext3.Window} this
     */
    show: function(o, animateTarget) {
        // Work around the CSS day cell height hack needed for initial render in IE8/strict:
        var anim = (Ext3.isIE8 && Ext3.isStrict) ? null: animateTarget;

        Ext3.calendar.EventEditWindow.superclass.show.call(this, anim,
        function() {
            Ext3.getCmp('title').focus(false, 100);
        });
        Ext3.getCmp('delete-btn')[o.data && o.data[Ext3.calendar.EventMappings.EventId.name] ? 'show': 'hide']();

        var rec,
        f = this.formPanel.form;

        if (o.data) {
            rec = o;
            this.isAdd = !!rec.data[Ext3.calendar.EventMappings.IsNew.name];
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

            var M = Ext3.calendar.EventMappings,
            eventId = M.EventId.name,
            start = o[M.StartDate.name],
            end = o[M.EndDate.name] || start.add('h', 1);

            rec = new Ext3.calendar.EventRecord();
            rec.data[M.EventId.name] = this.newId++;
            rec.data[M.StartDate.name] = start;
            rec.data[M.EndDate.name] = end;
            rec.data[M.IsAllDay.name] = !!o[M.IsAllDay.name] || start.getDate() != end.clone().add(Date.MILLI, 1).getDate();
            rec.data[M.IsNew.name] = true;

            f.reset();
            f.loadRecord(rec);
        }

        if (this.calendarStore) {
            Ext3.getCmp('calendar').setValue(rec.data[Ext3.calendar.EventMappings.CalendarId.name]);
        }
        Ext3.getCmp('date-range').setValue(rec.data);
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
            //var anim = afterDelete || (Ext3.isIE8 && Ext3.isStrict) ? null : this.animateTarget;
            this.hide();
        }
    },

    // private
    updateRecord: function() {
        var f = this.formPanel.form,
        dates = Ext3.getCmp('date-range').getValue(),
        M = Ext3.calendar.EventMappings;

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
 * @class Ext3.calendar.CalendarPanel
 * @extends Ext3.Panel
 * <p>This is the default container for Ext3 calendar views. It supports day, week and month views as well
 * as a built-in event edit form. The only requirement for displaying a calendar is passing in a valid
 * {@link #calendarStore} config containing records of type {@link Ext3.calendar.EventRecord EventRecord}. In order
 * to make the calendar interactive (enable editing, drag/drop, etc.) you can handle any of the various
 * events fired by the underlying views and exposed through the CalendarPanel.</p>
 * {@link #layoutConfig} option if needed.</p>
 * @constructor
 * @param {Object} config The config object
 * @xtype calendarpanel
 */
Ext3.calendar.CalendarPanel = Ext3.extend(Ext3.Panel, {
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
            cls: 'ext3-cal-toolbar',
            border: true,
            buttonAlign: 'center',
            items: [{
                id: this.id + '-tb-prev',
                handler: this.onPrevClick,
                scope: this,
                iconCls: 'x3-tbar-page-prev'
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
            iconCls: 'x3-tbar-page-next'
        });
        this.tbar.items.push('->');

        var idx = this.viewCount - 1;
        this.activeItem = this.activeItem === undefined ? idx: (this.activeItem > idx ? idx: this.activeItem);

        if (this.showNavBar === false) {
            delete this.tbar;
            this.addClass('x3-calendar-nonav');
        }

        Ext3.calendar.CalendarPanel.superclass.initComponent.call(this);

        this.addEvents({
            /**
             * @event eventadd
             * Fires after a new event is added to the underlying store
             * @param {Ext3.calendar.CalendarPanel} this
             * @param {Ext3.calendar.EventRecord} rec The new {@link Ext3.calendar.EventRecord record} that was added
             */
            eventadd: true,
            /**
             * @event eventupdate
             * Fires after an existing event is updated
             * @param {Ext3.calendar.CalendarPanel} this
             * @param {Ext3.calendar.EventRecord} rec The new {@link Ext3.calendar.EventRecord record} that was updated
             */
            eventupdate: true,
            /**
             * @event eventdelete
             * Fires after an event is removed from the underlying store
             * @param {Ext3.calendar.CalendarPanel} this
             * @param {Ext3.calendar.EventRecord} rec The new {@link Ext3.calendar.EventRecord record} that was removed
             */
            eventdelete: true,
            /**
             * @event eventcancel
             * Fires after an event add/edit operation is canceled by the user and no store update took place
             * @param {Ext3.calendar.CalendarPanel} this
             * @param {Ext3.calendar.EventRecord} rec The new {@link Ext3.calendar.EventRecord record} that was canceled
             */
            eventcancel: true,
            /**
             * @event viewchange
             * Fires after a different calendar view is activated (but not when the event edit form is activated)
             * @param {Ext3.calendar.CalendarPanel} this
             * @param {Ext3.CalendarView} view The view being activated (any valid {@link Ext3.calendar.CalendarView CalendarView} subclass)
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
             * @param {Ext3.calendar.CalendarPanel} this 
             */
            /**
             * @event eventclick
             * Fires after the user clicks on an event element
             * @param {Ext3.calendar.CalendarPanel} this
             * @param {Ext3.calendar.EventRecord} rec The {@link Ext3.calendar.EventRecord record} for the event that was clicked on
             * @param {HTMLNode} el The DOM node that was clicked on
             */
            /**
             * @event eventover
             * Fires anytime the mouse is over an event element
             * @param {Ext3.calendar.CalendarPanel} this
             * @param {Ext3.calendar.EventRecord} rec The {@link Ext3.calendar.EventRecord record} for the event that the cursor is over
             * @param {HTMLNode} el The DOM node that is being moused over
             */
            /**
             * @event eventout
             * Fires anytime the mouse exits an event element
             * @param {Ext3.calendar.CalendarPanel} this
             * @param {Ext3.calendar.EventRecord} rec The {@link Ext3.calendar.EventRecord record} for the event that the cursor exited
             * @param {HTMLNode} el The DOM node that was exited
             */
            /**
             * @event datechange
             * Fires after the start date of the view changes
             * @param {Ext3.calendar.CalendarPanel} this
             * @param {Date} startDate The start date of the view (as explained in {@link #getStartDate}
             * @param {Date} viewStart The first displayed date in the view
             * @param {Date} viewEnd The last displayed date in the view
             */
            /**
             * @event rangeselect
             * Fires after the user drags on the calendar to select a range of dates/times in which to create an event
             * @param {Ext3.calendar.CalendarPanel} this
             * @param {Object} dates An object containing the start (StartDate property) and end (EndDate property) dates selected
             * @param {Function} callback A callback function that MUST be called after the event handling is complete so that
             * the view is properly cleaned up (shim elements are persisted in the view while the user is prompted to handle the
             * range selection). The callback is already created in the proper scope, so it simply needs to be executed as a standard
             * function call (e.g., callback()).
             */
            /**
             * @event eventmove
             * Fires after an event element is dragged by the user and dropped in a new position
             * @param {Ext3.calendar.CalendarPanel} this
             * @param {Ext3.calendar.EventRecord} rec The {@link Ext3.calendar.EventRecord record} for the event that was moved with
             * updated start and end dates
             */
            /**
             * @event initdrag
             * Fires when a drag operation is initiated in the view
             * @param {Ext3.calendar.CalendarPanel} this
             */
            /**
             * @event eventresize
             * Fires after the user drags the resize handle of an event to resize it
             * @param {Ext3.calendar.CalendarPanel} this
             * @param {Ext3.calendar.EventRecord} rec The {@link Ext3.calendar.EventRecord record} for the event that was resized
             * containing the updated start and end dates
             */
            /**
             * @event dayclick
             * Fires after the user clicks within a day/week view container and not on an event element
             * @param {Ext3.calendar.CalendarPanel} this
             * @param {Date} dt The date/time that was clicked on
             * @param {Boolean} allday True if the day clicked on represents an all-day box, else false.
             * @param {Ext3.Element} el The Element that was clicked on
             */
        });

        this.layout = 'card';
        // do not allow override
        if (this.showDayView) {
            var day = Ext3.apply({
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
            var wk = Ext3.applyIf({
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
            var month = Ext3.applyIf({
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

        this.add(Ext3.applyIf({
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
        Ext3.calendar.CalendarPanel.superclass.afterRender.call(this);
        this.fireViewChange();
    },

    // private
    onLayout: function() {
        Ext3.calendar.CalendarPanel.superclass.onLayout.call(this);
        if (!this.navInitComplete) {
            this.updateNavState();
            this.navInitComplete = true;
        }
    },

    // private
    onEventAdd: function(form, rec) {
        rec.data[Ext3.calendar.EventMappings.IsNew.name] = false;
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
     * @param {Ext3.calendar.EventRecord} record The event record to edit
     * @return {Ext3.calendar.CalendarPanel} this
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
     * @return {Ext3.calendar.CalendarPanel} this
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

            var btn = Ext3.getCmp(this.id + '-tb-' + suffix);
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
     * {@link Ext3.calendar.CalendarView CalendarView}.
     * @return {Ext3.calendar.CalendarView} The active view
     */
    getActiveView: function() {
        return this.layout.activeItem;
    }
});

Ext3.reg('calendarpanel', Ext3.calendar.CalendarPanel);