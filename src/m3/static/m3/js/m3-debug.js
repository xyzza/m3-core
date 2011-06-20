/*!
 * Ext JS Library 3.3.1
 * Copyright(c) 2006-2010 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */
/**
 * @class Ext.ux.Reorderer
 * @extends Object
 * Generic base class for handling reordering of items. This base class must be extended to provide the
 * actual reordering functionality - the base class just sets up events and abstract logic functions.
 * It will fire events and set defaults, deferring the actual reordering to a doReorder implementation.
 * See Ext.ux.TabReorderer for an example.
 */
Ext.ux.Reorderer = Ext.extend(Object, {
    /**
     * @property defaults
     * @type Object
     * Object containing default values for plugin configuration details. These can be overridden when
     * constructing the plugin
     */
    defaults: {
        /**
         * @cfg animate
         * @type Boolean
         * If set to true, the rearranging of the toolbar items is animated
         */
        animate: true,
        
        /**
         * @cfg animationDuration
         * @type Number
         * The duration of the animation used to move other toolbar items out of the way
         */
        animationDuration: 0.2,
        
        /**
         * @cfg defaultReorderable
         * @type Boolean
         * True to make every toolbar draggable unless reorderable is specifically set to false.
         * This defaults to false
         */
        defaultReorderable: false
    },
    
    /**
     * Creates the plugin instance, applies defaults
     * @constructor
     * @param {Object} config Optional config object
     */
    constructor: function(config) {
        Ext.apply(this, config || {}, this.defaults);
    },
    
    /**
     * Initializes the plugin, stores a reference to the target 
     * @param {Mixed} target The target component which contains the reorderable items
     */
    init: function(target) {
        /**
         * @property target
         * @type Ext.Component
         * Reference to the target component which contains the reorderable items
         */
        this.target = target;
        
        this.initEvents();
        
        var items  = this.getItems(),
            length = items.length,
            i;
        
        for (i = 0; i < length; i++) {
            this.createIfReorderable(items[i]);
        }
    },
    
    /**
     * Reorders the items in the target component according to the given mapping object. Example:
     * this.reorder({
     *     1: 5,
     *     3: 2
     * });
     * Would move the item at index 1 to index 5, and the item at index 3 to index 2
     * @param {Object} mappings Object containing current item index as key and new index as property
     */
    reorder: function(mappings) {
        var target = this.target;
        
        if (target.fireEvent('before-reorder', mappings, target, this) !== false) {
            this.doReorder(mappings);
            
            target.fireEvent('reorder', mappings, target, this);
        }
    },
    
    /**
     * Abstract function to perform the actual reordering. This MUST be overridden in a subclass
     * @param {Object} mappings Mappings of the old item indexes to new item indexes
     */
    doReorder: function(paramName) {
        throw new Error("doReorder must be implemented in the Ext.ux.Reorderer subclass");
    },
    
    /**
     * Should create and return an Ext.dd.DD for the given item. This MUST be overridden in a subclass
     * @param {Mixed} item The item to create a DD for. This could be a TabPanel tab, a Toolbar button, etc
     * @return {Ext.dd.DD} The DD for the given item
     */
    createItemDD: function(item) {
        throw new Error("createItemDD must be implemented in the Ext.ux.Reorderer subclass");
    },
    
    /**
     * Sets up the given Toolbar item as a draggable
     * @param {Mixed} button The item to make draggable (usually an Ext.Button instance)
     */
    createItemDD: function(button) {
        var el   = button.getEl(),
            id   = el.id,
            tbar = this.target,
            me   = this;
        
        button.dd = new Ext.dd.DD(el, undefined, {
            isTarget: false
        });
        
        button.dd.constrainTo(tbar.getEl());
        button.dd.setYConstraint(0, 0, 0);
        
        Ext.apply(button.dd, {
            b4StartDrag: function() {       
                this.startPosition = el.getXY();
                
                //bump up the z index of the button being dragged but keep a reference to the original
                this.startZIndex = el.getStyle('zIndex');
                el.setStyle('zIndex', 10000);
                
                button.suspendEvents();
            },
            
            onDrag: function(e) {
                //calculate the button's index within the toolbar and its current midpoint
                var buttonX  = el.getXY()[0],
                    deltaX   = buttonX - this.startPosition[0],
                    items    = tbar.items.items,
                    oldIndex = items.indexOf(button),
                    newIndex;
                
                //find which item in the toolbar the midpoint is currently over
                for (var index = 0; index < items.length; index++) {
                    var item = items[index];
                    
                    if (item.reorderable && item.id != button.id) {
                        //find the midpoint of the button
                        var box        = item.getEl().getBox(),
                            midpoint   = (me.buttonXCache[item.id] || box.x) + (box.width / 2),
                            movedLeft  = oldIndex > index && deltaX < 0 && buttonX < midpoint,
                            movedRight = oldIndex < index && deltaX > 0 && (buttonX + el.getWidth()) > midpoint;
                        
                        if (movedLeft || movedRight) {
                            me[movedLeft ? 'onMovedLeft' : 'onMovedRight'](button, index, oldIndex);
                            break;
                        }                        
                    }
                }
            },
            
            /**
             * After the drag has been completed, make sure the button being dragged makes it back to
             * the correct location and resets its z index
             */
            endDrag: function() {
                //we need to update the cache here for cases where the button was dragged but its
                //position in the toolbar did not change
                me.updateButtonXCache();
                
                el.moveTo(me.buttonXCache[button.id], undefined, {
                    duration: me.animationDuration,
                    scope   : this,
                    callback: function() {
                        button.resumeEvents();
                        
                        tbar.fireEvent('reordered', button, tbar);
                    }
                });
                
                el.setStyle('zIndex', this.startZIndex);
            }
        });
    },
    
    /**
     * @private
     * Creates a DD instance for a given item if it is reorderable
     * @param {Mixed} item The item
     */
    createIfReorderable: function(item) {
        if (this.defaultReorderable && item.reorderable == undefined) {
            item.reorderable = true;
        }
        
        if (item.reorderable && !item.dd) {
            if (item.rendered) {
                this.createItemDD(item);                
            } else {
                item.on('render', this.createItemDD.createDelegate(this, [item]), this, {single: true});
            }
        }
    },
    
    /**
     * Returns an array of items which will be made draggable. This defaults to the contents of this.target.items,
     * but can be overridden - e.g. for TabPanels
     * @return {Array} The array of items which will be made draggable
     */
    getItems: function() {
        return this.target.items.items;
    },
    
    /**
     * Adds before-reorder and reorder events to the target component
     */
    initEvents: function() {
        this.target.addEvents(
          /**
           * @event before-reorder
           * Fires before a reorder occurs. Return false to cancel
           * @param {Object} mappings Mappings of the old item indexes to new item indexes
           * @param {Mixed} component The target component
           * @param {Ext.ux.TabReorderer} this The plugin instance
           */
          'before-reorder',
          
          /**
           * @event reorder
           * Fires after a reorder has occured.
           * @param {Object} mappings Mappings of the old item indexes to the new item indexes
           * @param {Mixed} component The target component
           * @param {Ext.ux.TabReorderer} this The plugin instance
           */
          'reorder'
        );
    }
});

/**
 * @class Ext.ux.HBoxReorderer
 * @extends Ext.ux.Reorderer
 * Description
 */
Ext.ux.HBoxReorderer = Ext.extend(Ext.ux.Reorderer, {
    /**
     * Initializes the plugin, decorates the container with additional functionality
     */
    init: function(container) {
        /**
         * This is used to store the correct x value of each button in the array. We need to use this
         * instead of the button's reported x co-ordinate because the buttons are animated when they move -
         * if another onDrag is fired while the button is still moving, the comparison x value will be incorrect
         */
        this.buttonXCache = {};
        
        container.on({
            scope: this,
            add  : function(container, item) {
                this.createIfReorderable(item);
            }
        });
        
        //super sets a reference to the toolbar in this.target
        Ext.ux.HBoxReorderer.superclass.init.apply(this, arguments);
    },
    
    /**
     * Sets up the given Toolbar item as a draggable
     * @param {Mixed} button The item to make draggable (usually an Ext.Button instance)
     */
    createItemDD: function(button) {
        if (button.dd != undefined) {
            return;
        }
        
        var el   = button.getEl(),
            id   = el.id,
            me   = this,
            tbar = me.target;
        
        button.dd = new Ext.dd.DD(el, undefined, {
            isTarget: false
        });
        
        el.applyStyles({
            position: 'absolute'
        });
        
        //if a button has a menu, it is disabled while dragging with this function
        var menuDisabler = function() {
            return false;
        };
        
        Ext.apply(button.dd, {
            b4StartDrag: function() {       
                this.startPosition = el.getXY();
                
                //bump up the z index of the button being dragged but keep a reference to the original
                this.startZIndex = el.getStyle('zIndex');
                el.setStyle('zIndex', 10000);
                
                button.suspendEvents();
                if (button.menu) {
                    button.menu.on('beforeshow', menuDisabler, me);
                }
            },
            
            startDrag: function() {
                this.constrainTo(tbar.getEl());
                this.setYConstraint(0, 0, 0);
            },
            
            onDrag: function(e) {
                //calculate the button's index within the toolbar and its current midpoint
                var buttonX  = el.getXY()[0],
                    deltaX   = buttonX - this.startPosition[0],
                    items    = tbar.items.items,
                    length   = items.length,
                    oldIndex = items.indexOf(button),
                    newIndex, index, item;
                
                //find which item in the toolbar the midpoint is currently over
                for (index = 0; index < length; index++) {
                    item = items[index];
                    
                    if (item.reorderable && item.id != button.id) {
                        //find the midpoint of the button
                        var box        = item.getEl().getBox(),
                            midpoint   = (me.buttonXCache[item.id] || box.x) + (box.width / 2),
                            movedLeft  = oldIndex > index && deltaX < 0 && buttonX < midpoint,
                            movedRight = oldIndex < index && deltaX > 0 && (buttonX + el.getWidth()) > midpoint;
                        
                        if (movedLeft || movedRight) {
                            me[movedLeft ? 'onMovedLeft' : 'onMovedRight'](button, index, oldIndex);
                            break;
                        }                        
                    }
                }
            },
            
            /**
             * After the drag has been completed, make sure the button being dragged makes it back to
             * the correct location and resets its z index
             */
            endDrag: function() {
                //we need to update the cache here for cases where the button was dragged but its
                //position in the toolbar did not change
                me.updateButtonXCache();
                
                el.moveTo(me.buttonXCache[button.id], el.getY(), {
                    duration: me.animationDuration,
                    scope   : this,
                    callback: function() {
                        button.resumeEvents();
                        if (button.menu) {
                            button.menu.un('beforeshow', menuDisabler, me);
                        }
                        
                        tbar.fireEvent('reordered', button, tbar);
                    }
                });
                
                el.setStyle('zIndex', this.startZIndex);
            }
        });
    },
    
    onMovedLeft: function(item, newIndex, oldIndex) {
        var tbar   = this.target,
            items  = tbar.items.items,
            length = items.length,
            index;
        
        if (newIndex != undefined && newIndex != oldIndex) {
            //move the button currently under drag to its new location
            tbar.remove(item, false);
            tbar.insert(newIndex, item);
            
            //set the correct x location of each item in the toolbar
            this.updateButtonXCache();
            for (index = 0; index < length; index++) {
                var obj  = items[index],
                    newX = this.buttonXCache[obj.id];
                
                if (item == obj) {
                    item.dd.startPosition[0] = newX;
                } else {
                    var el = obj.getEl();
                    
                    el.moveTo(newX, el.getY(), {
                        duration: this.animationDuration
                    });
                }
            }
        }
    },
    
    onMovedRight: function(item, newIndex, oldIndex) {
        this.onMovedLeft.apply(this, arguments);
    },
    
    /**
     * @private
     * Updates the internal cache of button X locations. 
     */
    updateButtonXCache: function() {
        var tbar   = this.target,
            items  = tbar.items,
            totalX = tbar.getEl().getBox(true).x;
            
        items.each(function(item) {
            this.buttonXCache[item.id] = totalX;

            totalX += item.getEl().getWidth();
        }, this);
    }
});
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
 * This attribute is the configuration of the Ext.form.Field to use as filter in the header or an array of fields configurations.<br>
 * <br>
 * The filter configuration object can include some special attributes to manage filter configuration:
 * <ul>
 * <li><code>filterName</code>: to specify the name of the filter and the corresponding HTTP parameter used to send filter value to server. 
 * If not specified column "dataIndex" attribute will be used, if more than one filter is configured for the same column, the filterName will be the "dataIndex" followed by filter index (if index &gt; 0)</li>
 * <li><code>value</code>: to specify default value for filter. If no value is provided for filter (in <code>filters</code> plugin configuration parameter or from loaded status), 
 * this value will be used as default filter value</li>
 * <li><code>filterEncoder</code>: a function used to convert filter value returned by filter field "getValue" method to a string. Useful if the filter field getValue() method
 * returns an object that is not a string</li>
 * <li><code>filterDecoder</code>: a function used to convert a string to a valid filter field value. Useful if the filter field setValue(obj) method
 * 						needs an object that is not a string</li>
 * <li><code>applyFilterEvent</code></li>: a string that specifies the event that starts filter application for this filter field. If not specified, the "applyMode" is used. (since 1.0.10)</li>
 *	</ul>
 * <br>
 * Filter fields are rendered in the header cells within an <code>Ext.Panel</code> with <code>layout='form'</code>.<br>
 * For each filter you can specify <code>fieldLabel</code> or other values supported by this layout type.<br>
 * You can also override panel configuration using <code>containerConfig</code> attribute.<br>
 * <br>
 * This plugin enables some new grid methods:
 * <ul>
 * <li>getHeaderFilter(name)</li>
 * <li>getHeaderFilterField(name)</li> 
 * <li>setHeaderFilter(name, value)</li> 
 * <li>setHeaderFilters(object, [bReset], [bReload])</li>
 * <li>resetHeaderFilters([bReload])</li>
 * <li>applyHeaderFilters([bReload])</li>
 * </ul>
 * The "name" is the filterName (see filterName in each filter configuration)
 * 
 * @author Damiano Zucconi - http://www.isipc.it
 * @version 2.0.6 - 03/03/2011
 */
Ext.ux.grid.GridHeaderFilters = function(cfg){if(cfg) Ext.apply(this, cfg);};
	
Ext.extend(Ext.ux.grid.GridHeaderFilters, Ext.util.Observable, 
{
	/**
	 * @cfg {Number} fieldHeight
	 * Height for each filter field used by <code>autoHeight</code>.
	 */
	fieldHeight: 22,
	
	/**
	 * @cfg {Number} padding
	 * Padding for filter fields. Default: 2
	 */
	fieldPadding: 1,
	
	/**
	 * @cfg {Boolean} highlightOnFilter
	 * Enable grid header highlight if active filters 
	 */
	highlightOnFilter: true,
	
	/**
	 * @cfg {String} highlightColor
	 * Color for highlighted grid header
	 */
	highlightColor: 'yellow',
	
	/**
	 * @cfg {String} highlightCls
	 * Class to apply to filter header when filters are highlighted. If specified overrides highlightColor.
	 * See <code>highlightOnFilter</code>. 
	 */
	highlightCls: null,
	
	/**
	 * @cfg {Boolean} stateful
	 * Enable or disable filters save and restore through enabled Ext.state.Provider
	 */
	stateful: true,
	
	/**
	 * @cfg {String} applyMode
	 * Sets how filters are applied. If equals to "auto" (default) the filter is applyed when filter field value changes (change, select, ENTER).
	 * If set to "enter" the filters are applied only when user push "ENTER" on filter field.<br> 
	 * See also <code>applyFilterEvent</code> in columnmodel filter configuration: if this option is specified in
	 * filter configuration, <code>applyMode</code> value will be ignored and filter will be applied on specified event.
	 * @since Ext.ux.grid.GridHeaderFilters 1.0.6
	 */
	applyMode: "auto",
	
	/**
	 * @cfg {Object} filters
	 * Initial values for filters (mapped with filters names). If this object is defined,
	 * its attributes values overrides the corresponding filter values loaded from grid status or <code>value</code> specified in column model filter configuration.<br>
	 * Values specified into column model configuration (filter <code>value</code> attribute) are ignored if this object is specified.<br>
	 * See <code>filtersInitMode</code> to understand how these values are mixed with values loaded from grid status.
	 * @since Ext.ux.grid.GridHeaderFilters 1.0.9
	 */
	filters: null,
	
	/**
	 * @cfg {String} filtersInitMode
	 * If <code>filters</code> config value is specified, this parameter defines how these values are used:
	 * <ul>
	 * <li><code>replace</code>: these values replace all values loaded from grid status (status is completely ignored)</li>
	 * <li><code>merge</code>: these values overrides values loaded from status with the same name. Other status values are keeped and used to init filters.</li>
	 * </ul>
	 * This parameter doesn't affect how filter <code>value</code> attribute is managed: it will be always ignored if <code>filters</code> object is specified.<br>
	 * Default = 'replace'
	 */
	filtersInitMode: 'replace',
	
	/**
	 * @cfg {Boolean} ensureFilteredVisible
	 * If true, forces hidden columns to be made visible if relative filter is set. Default = true.
	 */
	ensureFilteredVisible: true,
	
	cfgFilterInit: false,
	
	/**
	 * @cfg {Object} containerConfig
	 * Base configuration for filters container of each column. With this attribute you can override filters <code>Ext.Container</code> configuration.
	 */
	containerConfig: null,
	
	/**
	 * @cfg {Number} labelWidth
	 * Label width for filter containers Form layout. Default = 50.
	 */
	labelWidth: 50,
	
	fcc: null,
	
	filterFields: null,
	
	filterContainers: null,
	
	filterContainerCls: 'x-ghf-filter-container',
	
	//kirov - признак того что идет изменение размеров колонок
	inResizeProcess: false,
	
	init:function(grid) 
	{
		this.grid = grid;
		var gv = this.grid.getView();
		gv.updateHeaders = gv.updateHeaders.createSequence(function(){
			this.renderFilters.call(this);
		},this).createInterceptor(function(){
			// kirov - непонятно, зачем уничтожать фильтры если потом они рендерятся. иначе у нас не работают произвольные контролы в заголовке
			//this.destroyFilters.call(this);
			return true;
		},this);
		this.grid.on({
			scope: this,
			render: this.onRender,
			resize: this.onResize,
			columnresize: this.onColResize,
			reconfigure: this.onReconfigure,
			beforedestroy: this.destroyFilters
		});
		//this.grid.on("columnmove", this.renderFilters, this);
		if(this.stateful)
		{
			this.grid.on("beforestatesave", this.saveFilters, this);
			this.grid.on("beforestaterestore", this.loadFilters, this);
		}
		
		//Column hide event managed
		this.grid.getColumnModel().on("hiddenchange", this.onColHidden, this);
		
		this.grid.addEvents(
		/**
      * @event filterupdate
      * <b>Event enabled on the GridPanel</b>: fired when a filter is updated
      * @param {String} name Filter name
      * @param {Object} value Filter value
      * @param {Ext.form.Field} el Filter field
      */	
		'filterupdate');
		
		this.addEvents(
			/**
	      * @event render
	      * Fired when filters render on grid header is completed
	      * @param {Ext.ux.grid.GridHeaderFilters} this
	      */	
			{'render': true}
		);
		
		//Must ignore filter config value ?
		this.cfgFilterInit = Ext.isDefined(this.filters) && this.filters !== null;
		if(!this.filters)
			this.filters = {};
		
		//Configuring filters
		this.configure(this.grid.getColumnModel());
			
		Ext.ux.grid.GridHeaderFilters.superclass.constructor.call(this);
		
		if(this.stateful)
		{
			if(!Ext.isArray(this.grid.stateEvents))
				this.grid.stateEvents = [];
			this.grid.stateEvents.push('filterupdate');
		}
		
		//Enable new grid methods
		Ext.apply(this.grid, {
			headerFilters: this,
			getHeaderFilter: function(sName){
				if(!this.headerFilters)
					return null;
				return this.headerFilters.filters[sName];	
			},
			setHeaderFilter: function(sName, sValue){
				if(!this.headerFilters)
					return;
				var fd = {};
				fd[sName] = sValue;
				this.setHeaderFilters(fd);
			},
			setHeaderFilters: function(obj, bReset, bReload)
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
			},
			getHeaderFilterField: function(fn)
			{
				if(!this.headerFilters)
					return;
				if(this.headerFilters.filterFields[fn])
					return this.headerFilters.filterFields[fn];
				else
					return null;
			},
			resetHeaderFilters: function(bReload)
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
						this.headerFilters.setFieldValue(el, '');
					}
					this.headerFilters.applyFilter(el, false);
				}
				if(bReload)
					this.headerFilters.storeReload();
			},
			applyHeaderFilters: function(bReload)
			{
				if(arguments.length == 0)
					var bReload = true;
				this.headerFilters.applyFilters(bReload);
			}
		});
		
	},
	
	/**
	 * @private
	 * Configures filters and containers starting from grid ColumnModel
	 * @param {Ext.grid.ColumnModel} cm The column model to use
	 */
	configure: function(cm)
	{
		/*Filters config*/
		var filteredColumns = cm.getColumnsBy(function(cc){
			if(Ext.isObject(cc.filter) || Ext.isArray(cc.filter))
				return true;
			else
				return false;
		});
		
		/*Building filters containers configs*/
		this.fcc = {};
		for (var i = 0; i < filteredColumns.length; i++) 
		{
			var co = filteredColumns[i];
			var fca = co.filter;
			if(!Ext.isArray(fca))
				fca = [fca];
			for(var ci = 0; ci < fca.length; ci++)
			{
				var fc = Ext.apply({
					filterName: ci > 0 ? co.dataIndex+ci : co.dataIndex
				},fca[ci]);
				Ext.apply(fc, {
					columnId: co.id,
					dataIndex: co.dataIndex,
					//hideLabel: Ext.isEmpty(fc.fieldLabel),
					hideLabel: true,
					anchor: '100%'
				});
				
				if(!this.cfgFilterInit && !Ext.isEmpty(fc.value))
				{
					this.filters[fc.filterName] = Ext.isFunction(fc.filterEncoder) ? fc.filterEncoder.call(this, fc.value) : fc.value;
				}
				delete fc.value;
				
				/*
				 * Se la configurazione del field di filtro specifica l'attributo applyFilterEvent, il filtro verrà applicato
				 * in corrispondenza di quest'evento specifico
				 */
				if(fc.applyFilterEvent)
				{
					fc.listeners = {scope: this};
					fc.listeners[fc.applyFilterEvent] = function(field){this.applyFilter(field);};
					delete fc.applyFilterEvent;
				}
				else
				{
					//applyMode: auto o enter
					if(this.applyMode === 'auto' || this.applyMode === 'change' || Ext.isEmpty(this.applyMode))
					{
						//Legacy mode and deprecated. Use applyMode = "enter" or applyFilterEvent
						// kirov - через листенеры удобно новые объекты делать, иначе через события
						if (fc.hasListener != undefined) {
							if (!fc.hasListener('change')) {
								fc.on('change',function(field)
									{
										var t = field.getXType();
										if(t=='combo' || t=='datefield'){ //avoid refresh twice for combo select 
										return;
										}else{
										this.applyFilter(field);
										}
									}, this);
							}
							if (!fc.hasListener('specialkey')) {
								fc.on('specialkey',function(el,ev)
									{
										ev.stopPropagation();
										if(ev.getKey() == ev.ENTER) 
											el.el.dom.blur();
									}, this);
							}
							if (!fc.hasListener('select')) {
								fc.on('select',function(field){this.applyFilter(field);}, this);
							}
						} else {
							fc.listeners = 
							{
								change: function(field)
								{
									var t = field.getXType();
									if(t=='combo' || t=='datefield'){ //avoid refresh twice for combo select 
										return;
									}else{
										this.applyFilter(field);
									}
								},
								// kirov - не обязательный походу обработчик
								// specialkey: function(el,ev)
								// {
									// ev.stopPropagation();
									// if(ev.getKey() == ev.ENTER) 
										// el.el.dom.blur();
								// },
								select: function(field){
									this.applyFilter(field);
									},
								scope: this	
							};
						}
					}
					else if(this.applyMode === 'enter')
					{
						fc.listeners = 
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
				
				//Looking for filter column index
				var containerCfg = this.fcc[fc.columnId];
				if(!containerCfg)
				{
					containerCfg = {
						cls: this.filterContainerCls,
						border: false,
						bodyBorder: false,
						bodyStyle: "background-color: transparent", //kirov - для нормального цвета
						//layout: 'vbox',
						//layoutConfig: {align: 'stretch', padding: this.padding},
						labelSeparator: '', 
						labelWidth: this.labelWidth,
						layout: 'hbox', // kirov - вместо form, чтобы фильтры располагались горизонтально
						style: {},
						items: []
					};
					if(this.containerConfig)
						Ext.apply(containerCfg, this.containerConfig);
					this.fcc[fc.columnId] = containerCfg;
				}
				// kirov - для hbox лучше использовать еще один контейнер
				var tempCont = { 
					bodyStyle: "background-color: transparent",
					border: false,
					bodyBorder: false,
					layout: 'form',
					padding: 2,
					margins: '0 0 -4 0',
                    flex: 1,
                    items: [fc]
                };
				
				containerCfg.items.push(tempCont);
			}
		}
	},
	
	renderFilterContainer: function(columnId, fcc)
	{
		if(!this.filterContainers)
			this.filterContainers = {};
		//Associated column index
		var ci = this.grid.getColumnModel().getIndexById(columnId);
		//Header TD
		var td = this.grid.getView().getHeaderCell(ci);
		td = Ext.get(td);
		//Patch for field text selection on Mozilla
		if(Ext.isGecko)
			td.dom.style.MozUserSelect = "text";
		td.dom.style.verticalAlign = 'top';
		//Render filter container
		fcc.width = td.getWidth() - 3;
		var fc = new Ext.Container(fcc);
		fc.render(td);
		//Container cache
		this.filterContainers[columnId] = fc;
		//Fields cache	
		var height = 0;
		if(!this.filterFields)
			this.filterFields = {};
		var fields = fc.findBy(function(cmp){return !Ext.isEmpty(cmp.filterName);});
		if(!Ext.isEmpty(fields))
		{
			for(var i=0;i<fields.length;i++)
			{
				var filterName = fields[i].filterName;
				/*if(this.filterFields[filterName])
				{
					//Ext.destroy(this.filterFields[filterName])
					delete this.filterFields[filterName];
				}*/
				this.filterFields[filterName] = fields[i];
				height += fields[i].getHeight();
			}
		}
		
		return fc;
	},
	
	renderFilters: function()
	{
		if(!this.fcc)
			return;
		for(var cid in this.fcc)
		{
			this.renderFilterContainer(cid, this.fcc[cid]);
		}
		this.setFilters(this.filters);
		this.highlightFilters(this.isFiltered());
	},
	
	onRender: function()
	{
		this.renderFilters();
		if(this.isFiltered())
		{
			this.applyFilters(false);
		}
		this.fireEvent("render", this);
	},
	
	getFilterField: function(filterName)
	{
		return this.filterFields ? this.filterFields[filterName] : null;
	},
	
	/**
	 * Sets filter values by values specified into fo.
	 * @param {Object} fo Object with attributes filterName = value
	 * @param {Boolean} clear If current values must be cleared. Default = false
	 */
	setFilters: function(fo,clear)
	{
		this.filters = fo;
		
		if(this.filters && this.filterFields)
		{
			//Delete filters that doesn't match with any field
			for(var fn in this.filters)
			{
				if(!this.filterFields[fn])
					delete this.filters[fn];
			}
			
			for(var fn in this.filterFields)
			{
				var field = this.filterFields[fn];
				var value = this.filters[field.filterName];
				if(Ext.isEmpty(value))
				{
					if(clear)
						this.setFieldValue(field, '');
				}
				else
					this.setFieldValue(field, value);
			}
		}
	},
	
	onColResize: function(index, iWidth){
		if(!this.filterContainers)
			return;
		// kirov - пошлем событие изменения размера всего грида, если колонки растянуты по ширине
		if (!this.inResizeProcess) {
			if (this.grid.viewConfig && this.grid.viewConfig.forceFit) {
				this.onResize();
				return;
			}
		}
		var colId = this.grid.getColumnModel().getColumnId(index);
		var cnt = this.filterContainers[colId];
		if(cnt)
		{
			if(isNaN(iWidth))
				iWidth = 0;
			var filterW = (iWidth < 3) ? 0 : (iWidth - 3);
			cnt.setWidth(filterW);
			//Thanks to ob1
			cnt.doLayout(false,true);
		}
	},
	
	/**
	 * @private
	 * Resize filters containers on grid resize
	 * Thanks to dolittle
	 */
	onResize: function() 
	{
		this.inResizeProcess = true; // kirov - чтобы исключить повторный вызов
		var n = this.grid.getColumnModel().getColumnCount();
		for(var i=0; i<n; i++) {
			var td = this.grid.getView().getHeaderCell(i);
			td = Ext.get(td);
			this.onColResize(i, td.getWidth());
		}
		this.inResizeProcess = false; // kirov
	},
	
	onColHidden: function(cm, index, bHidden){
		if(bHidden)
			return;
		var cw = this.grid.getColumnModel().getColumnWidth(index);
		this.onColResize(index, cw);
	},
	
	onReconfigure: function(grid, store, cm)
	{
		this.destroyFilters();
		this.configure(cm);
		this.renderFilters();
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
			if(this.cfgFilterInit)
			{					
				if(this.filtersInitMode === 'merge')
					Ext.apply(vals,this.filters);
			}
			else
				this.filters = vals;
		}
	},
	
	isFiltered: function()
	{
		for(var k in this.filters)
		{
			if(/*this.filterFields && this.filterFields[k] && */!Ext.isEmpty(this.filters[k]))
				return true;
		}
		return false;
	},
	
	highlightFilters: function(enable)
	{
		if(!this.highlightOnFilter)
			return;
		if(!this.filterContainers)
			return;
		if(!this.grid.getView().mainHd)
			return;
			
		// var tr = this.grid.getView().mainHd.child('.x-grid3-hd-row');
		// if(!Ext.isEmpty(this.highlightCls))
		// {
			// if(enable)
				// tr.addClass(this.highlightCls);
			// else
				// tr.removeClass(this.highlightCls);
		// }
		// else
		// {
			// tr.setStyle('background-color',enable ? this.highlightColor : '');
		// }
		// for(var i=0; i < this.grid.getColumnModel().getColumnCount(); i++) 
		// {
			// var hc = Ext.get(this.grid.getView().getHeaderCell(i));
			// if(!Ext.isEmpty(this.highlightCls))
			// {
				// if(enable)
					// hc.addClass(this.highlightCls);
				// else
					// hc.removeClass(this.highlightCls);
			// }
			// else
			// {
				// hc.setStyle('background-color',enable ? this.highlightColor : 'transparent');
			// }
		// }
		var color = enable ? this.highlightColor : 'transparent';
		for(var fn in this.filterContainers)
		{
			var fc = this.filterContainers[fn];
			if(fc.rendered)
			{
				if(!Ext.isEmpty(this.highlightCls))
				{
					if(enable)
						fc.getEl().addClass(this.highlightCls);
					else
						fc.getEl().removeClass(this.highlightCls);
				}
				else
					fc.getEl().setStyle('backgroundColor',color);
			}
		}
	},
	
	getFieldValue: function(eField)
	{
		if(Ext.isFunction(eField.filterEncoder))
			return eField.filterEncoder.call(eField, eField.getValue());
		else
			return eField.getValue();
	},
	
	setFieldValue: function(eField, value)
	{
		if(Ext.isFunction(eField.filterDecoder))
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
			
		if(el.disabled && !Ext.isDefined(this.grid.store.baseParams[el.filterName]))
			return;
		
		var sValue = this.getFieldValue(el);
		
		if(el.disabled || Ext.isEmpty(sValue))
		{
			delete this.grid.store.baseParams[el.filterName];
			delete this.filters[el.filterName];
		}
		else	
		{
			this.grid.store.baseParams[el.filterName] = sValue;
			this.filters[el.filterName] = sValue;
			
			if(this.ensureFilteredVisible)
			{
				//Controllo che la colonna del filtro applicato sia visibile
				var ci = this.grid.getColumnModel().getIndexById(el.columnId);
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
	
	getFilterContainer: function(columnId)
	{
		return this.filterContainers ? this.filterContainers[columnId] : null; 
	},
	
	destroyFilters: function()
	{
		if(this.filterFields)
		{
			for(var ff in this.filterFields)
			{
				Ext.destroy(this.filterFields[ff]);
				delete this.filterFields[ff];
			}
		}
		
		if(this.filterContainers)
		{
			for(var ff in this.filterContainers)
			{
				Ext.destroy(this.filterContainers[ff]);
				delete this.filterContainers[ff];
			}
		}
		
	}
});
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
/*!
 * Ext JS Library 3.3.1
 * Copyright(c) 2006-2010 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */
/**
 * @class Ext.ux.ToolbarDroppable
 * @extends Object
 * Plugin which allows items to be dropped onto a toolbar and be turned into new Toolbar items.
 * To use the plugin, you just need to provide a createItem implementation that takes the drop
 * data as an argument and returns an object that can be placed onto the toolbar. Example:
 * <pre>
 * new Ext.ux.ToolbarDroppable({
 *   createItem: function(data) {
 *     return new Ext.Button({text: data.text});
 *   }
 * });
 * </pre>
 * The afterLayout function can also be overridden, and is called after a new item has been 
 * created and inserted into the Toolbar. Use this for any logic that needs to be run after
 * the item has been created.
 */
Ext.ux.ToolbarDroppable = Ext.extend(Object, {
    /**
     * @constructor
     */
    constructor: function(config) {
      Ext.apply(this, config, {
          
      });
    },
    
    /**
     * Initializes the plugin and saves a reference to the toolbar
     * @param {Ext.Toolbar} toolbar The toolbar instance
     */
    init: function(toolbar) {
      /**
       * @property toolbar
       * @type Ext.Toolbar
       * The toolbar instance that this plugin is tied to
       */
      this.toolbar = toolbar;
      
      this.toolbar.on({
          scope : this,
          render: this.createDropTarget
      });
    },
    
    /**
     * Creates a drop target on the toolbar
     */
    createDropTarget: function() {
        /**
         * @property dropTarget
         * @type Ext.dd.DropTarget
         * The drop target attached to the toolbar instance
         */
        this.dropTarget = new Ext.dd.DropTarget(this.toolbar.getEl(), {
            notifyOver: this.notifyOver.createDelegate(this),
            notifyDrop: this.notifyDrop.createDelegate(this)
        });
    },
    
    /**
     * Adds the given DD Group to the drop target
     * @param {String} ddGroup The DD Group
     */
    addDDGroup: function(ddGroup) {
    	if (this.dropTarget != undefined) {
    		this.dropTarget.addToGroup(ddGroup);
    	}
    },
    
    /**
     * Calculates the location on the toolbar to create the new sorter button based on the XY of the
     * drag event
     * @param {Ext.EventObject} e The event object
     * @return {Number} The index at which to insert the new button
     */
    calculateEntryIndex: function(e) {
        var entryIndex = 0,
            toolbar    = this.toolbar,
            items      = toolbar.items.items,
            count      = items.length,
            xTotal     = toolbar.getEl().getXY()[0],
            xHover     = e.getXY()[0] - xTotal;
        
        for (var index = 0; index < count; index++) {
            var item     = items[index],
                width    = item.getEl().getWidth(),
                midpoint = xTotal + width / 2;
            
            xTotal += width;
            
            if (xHover < midpoint) {
                entryIndex = index;       

                break;
            } else {
                entryIndex = index + 1;
            }
        }
        
        return entryIndex;
    },
    
    /**
     * Returns true if the drop is allowed on the drop target. This function can be overridden
     * and defaults to simply return true
     * @param {Object} data Arbitrary data from the drag source
     * @return {Boolean} True if the drop is allowed
     */
    canDrop: function(data) {
        return true;
    },
    
    /**
     * Custom notifyOver method which will be used in the plugin's internal DropTarget
     * @return {String} The CSS class to add
     */
    notifyOver: function(dragSource, event, data) {
        return this.canDrop.apply(this, arguments) ? this.dropTarget.dropAllowed : this.dropTarget.dropNotAllowed;
    },
    
    /**
     * Called when the drop has been made. Creates the new toolbar item, places it at the correct location
     * and calls the afterLayout callback.
     */
    notifyDrop: function(dragSource, event, data) {
        var canAdd = this.canDrop(dragSource, event, data),
            tbar   = this.toolbar;
        
        if (canAdd) {
            var entryIndex = this.calculateEntryIndex(event);
            
            tbar.insert(entryIndex, this.createItem(data));
            tbar.doLayout();
            
            this.afterLayout();
        }
        
        return canAdd;
    },
    
    /**
     * Creates the new toolbar item based on drop data. This method must be implemented by the plugin instance
     * @param {Object} data Arbitrary data from the drop
     * @return {Mixed} An item that can be added to a toolbar
     */
    createItem: function(data) {
        throw new Error("The createItem method must be implemented in the ToolbarDroppable plugin");
    },
    
    /**
     * Called after a new button has been created and added to the toolbar. Add any required cleanup logic here
     */
    afterLayout: Ext.emptyFn
});
/*!
 * Ext JS Library 3.3.1
 * Copyright(c) 2006-2010 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */
/**
 * @class Ext.ux.ToolbarReorderer
 * @extends Ext.ux.Reorderer
 * Plugin which can be attached to any Ext.Toolbar instance. Provides ability to reorder toolbar items
 * with drag and drop. Example:
 * <pre>
 * new Ext.Toolbar({
 *     plugins: [
 *         new Ext.ux.ToolbarReorderer({
 *             defaultReorderable: true
 *         })
 *     ],
 *     items: [
 *       {text: 'Button 1', reorderable: false},
 *       {text: 'Button 2'},
 *       {text: 'Button 3'}
 *     ]
 * });
 * </pre>
 * In the example above, buttons 2 and 3 will be reorderable via drag and drop. An event named 'reordered'
 * is added to the Toolbar, and is fired whenever a reorder has been completed.
 */
Ext.ux.ToolbarReorderer = Ext.extend(Ext.ux.Reorderer, {
    /**
     * Initializes the plugin, decorates the toolbar with additional functionality
     */
    init: function(toolbar) {
        /**
         * This is used to store the correct x value of each button in the array. We need to use this
         * instead of the button's reported x co-ordinate because the buttons are animated when they move -
         * if another onDrag is fired while the button is still moving, the comparison x value will be incorrect
         */
        this.buttonXCache = {};
        
        toolbar.on({
            scope: this,
            add  : function(toolbar, item) {
                this.createIfReorderable(item);
            }
        });
        
        //super sets a reference to the toolbar in this.target
        Ext.ux.ToolbarReorderer.superclass.init.apply(this, arguments);
    },
        
    /**
     * Sets up the given Toolbar item as a draggable
     * @param {Mixed} button The item to make draggable (usually an Ext.Button instance)
     */
    createItemDD: function(button) {
        if (button.dd != undefined) {
            return;
        }
        
        var el   = button.getEl(),
            id   = el.id,
            tbar = this.target,
            me   = this;
        
        button.dd = new Ext.dd.DD(el, undefined, {
            isTarget: false
        });
        
        //if a button has a menu, it is disabled while dragging with this function
        var menuDisabler = function() {
            return false;
        };
        
        Ext.apply(button.dd, {
            b4StartDrag: function() {       
                this.startPosition = el.getXY();
                
                //bump up the z index of the button being dragged but keep a reference to the original
                this.startZIndex = el.getStyle('zIndex');
                el.setStyle('zIndex', 10000);
                
                button.suspendEvents();
                if (button.menu) {
                    button.menu.on('beforeshow', menuDisabler, me);
                }
            },
            
            startDrag: function() {
                this.constrainTo(tbar.getEl());
                this.setYConstraint(0, 0, 0);
            },
            
            onDrag: function(e) {
                //calculate the button's index within the toolbar and its current midpoint
                var buttonX  = el.getXY()[0],
                    deltaX   = buttonX - this.startPosition[0],
                    items    = tbar.items.items,
                    oldIndex = items.indexOf(button),
                    newIndex;
                
                //find which item in the toolbar the midpoint is currently over
                for (var index = 0; index < items.length; index++) {
                    var item = items[index];
                    
                    if (item.reorderable && item.id != button.id) {
                        //find the midpoint of the button
                        var box        = item.getEl().getBox(),
                            midpoint   = (me.buttonXCache[item.id] || box.x) + (box.width / 2),
                            movedLeft  = oldIndex > index && deltaX < 0 && buttonX < midpoint,
                            movedRight = oldIndex < index && deltaX > 0 && (buttonX + el.getWidth()) > midpoint;
                        
                        if (movedLeft || movedRight) {
                            me[movedLeft ? 'onMovedLeft' : 'onMovedRight'](button, index, oldIndex);
                            break;
                        }                        
                    }
                }
            },
            
            /**
             * After the drag has been completed, make sure the button being dragged makes it back to
             * the correct location and resets its z index
             */
            endDrag: function() {
                //we need to update the cache here for cases where the button was dragged but its
                //position in the toolbar did not change
                me.updateButtonXCache();
                
                el.moveTo(me.buttonXCache[button.id], el.getY(), {
                    duration: me.animationDuration,
                    scope   : this,
                    callback: function() {
                        button.resumeEvents();
                        if (button.menu) {
                            button.menu.un('beforeshow', menuDisabler, me);
                        }
                        
                        tbar.fireEvent('reordered', button, tbar);
                    }
                });
                
                el.setStyle('zIndex', this.startZIndex);
            }
        });
    },
    
    onMovedLeft: function(item, newIndex, oldIndex) {
        var tbar  = this.target,
            items = tbar.items.items;
        
        if (newIndex != undefined && newIndex != oldIndex) {
            //move the button currently under drag to its new location
            tbar.remove(item, false);
            tbar.insert(newIndex, item);
            
            //set the correct x location of each item in the toolbar
            this.updateButtonXCache();
            for (var index = 0; index < items.length; index++) {
                var obj  = items[index],
                    newX = this.buttonXCache[obj.id];
                
                if (item == obj) {
                    item.dd.startPosition[0] = newX;
                } else {
                    var el = obj.getEl();
                    
                    el.moveTo(newX, el.getY(), {duration: this.animationDuration});
                }
            }
        }
    },
    
    onMovedRight: function(item, newIndex, oldIndex) {
        this.onMovedLeft.apply(this, arguments);
    },
    
    /**
     * @private
     * Updates the internal cache of button X locations. 
     */
    updateButtonXCache: function() {
        var tbar   = this.target,
            items  = tbar.items,
            totalX = tbar.getEl().getBox(true).x;
            
        items.each(function(item) {
            this.buttonXCache[item.id] = totalX;

            totalX += item.getEl().getWidth();
        }, this);
    }
});
Ext.ux.Mask = function(mask) {
    var config = {
        mask: mask
    };
    Ext.apply(this, config);
};
Ext.extend(Ext.ux.Mask, Object, {
    init: function(c) {
        this.LetrasL = 'abcdefghijklmnopqrstuvwxyz';
        this.LetrasU = Ext.util.Format.uppercase(this.LetrasL);
        this.Letras  = this.LetrasL + this.LetrasU;
        this.Numeros = '0123456789';
        this.Fixos  = '().-:/ '; 
        this.Charset = " !\"#$%&\'()*+,-./0123456789:;<=>?@" + this.LetrasU + "[\]^_/`" + this.LetrasL + "{|}~";
        c.enableKeyEvents = true;
        c.on('keypress', function(field, evt) { return this.press(field, evt) }, this);
    },
    press: function(field, evt) {
        var value = field.getValue();
        var key = evt.getKey();
        var mask = this.mask;
        var objDom = field.el.dom;
        if(evt){
        	if((objDom.selectionEnd - objDom.selectionStart) > 0){
                return true;    
		    }
		    if((objDom.selectionStart > 0) && (objDom.selectionStart < objDom.textLength)){
		        return true;    
		    }
            var tecla = this.Charset.substr(key - 32, 1);
            if(key < 32 || evt.isNavKeyPress() || key == evt.BACKSPACE){
                return true;
            }
            if(Ext.isGecko || Ext.isGecko2 || Ext.isGecko3)
                if((evt.charCode == 0 && evt.keyCode == 46) || evt.isSpecialKey()) return true; // DELETE (conflict with dot(.))
            var tamanho = value.length;
            if(tamanho >= mask.length){
                field.setValue(value);
                evt.stopEvent();
                return false;
            }
            var pos = mask.substr(tamanho,1); 
            while(this.Fixos.indexOf(pos) != -1){
                value += pos;
                tamanho = value.length;
                if(tamanho >= mask.length){
                    evt.stopEvent();
                    return false;
                }
                pos = mask.substr(tamanho,1);
            }
            switch(pos){
                case '#' : if(this.Numeros.indexOf(tecla) == -1){evt.stopEvent(); return false;} break;
                case 'A' : tecla = tecla.toUpperCase(); if(this.LetrasU.indexOf(tecla) == -1){evt.stopEvent(); return false;} break;
                case 'a' : tecla = tecla.toLowerCase(); if(this.LetrasL.indexOf(tecla) == -1){evt.stopEvent(); return false;} break;
                case 'Z' : if(this.Letras.indexOf(tecla) == -1) {evt.stopEvent(); return false;} break;
                case '*' : field.setValue(value + tecla); break;
                default : field.setValue(value); break;
            }
        }
        field.setValue(value + tecla);
        objDom.selectionEnd = objDom.selectionStart;
        evt.stopEvent();
        return false;
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
		for (var i; i < offset; i++) {
			retVal += real.charAt(i);
		}
		retVal += ' ';
	}
	
    for (var i; i < real.length; i++) {
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

// Функция проверки существования элемента в массиве. В эксте её нет.
// Не работает под ие6, но для него тоже написана реализация, если понадобится:
// http://stackoverflow.com/questions/143847/best-way-to-find-an-item-in-a-javascript-array
function includeInArr(arr, obj) {
    return (arr.indexOf(obj) != -1);
}

//Cообщения
function showMessage(msg, title, icon){
	title = title || 'Внимание';
	msg = msg || '';
	icon = icon || Ext.MessageBox.INFO;
    Ext.Msg.show({
        title: title,
        msg: msg,
        buttons: Ext.Msg.OK,
        icon: icon
    });
}

function showWarning(msg, title){
	showMessage(msg, title, Ext.MessageBox.WARNING);
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
				if (!this.getSelectionModel().isSelected(index)) {
						this.getSelectionModel().selectRow(index);
				};
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
				{name: 'okato'},
				{name: 'addr_name'}
			]
		});
		if (params.place_record != '' && params.place_record != undefined) {
			var rec = Ext.util.JSON.decode(params.place_record);
    		place_store.loadData({total:1, rows:[rec]});
		}
		if (params.read_only) 
			var field_cls = 'm3-grey-field' 
		else
			var field_cls = ''
		this.place = new Ext.form.ComboBox({
			name: params.place_field_name,
			fieldLabel: params.place_label,
			allowBlank: params.place_allow_blank,
            readOnly: params.read_only,
            cls: field_cls,
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
			valueNotFoundText: '',
            invalidClass: params.invalid_class
		});		
		this.place.setValue(params.place_value);
		
        this.zipcode = new Ext.form.TextField({
            name: params.zipcode_field_name,
            value: params.zipcode_value,
            emptyText: 'индекс',
            readOnly: params.read_only,
            cls: field_cls,
            width: 55,
            maskRe: /[0-9]/
        });
		
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
					{name: 'okato'},
					{name: 'name'}
				]
			});
			if (params.street_record != '' && params.street_record != undefined) {
				var rec = Ext.util.JSON.decode(params.street_record);
				street_store.loadData({total:1, rows:[rec]});
			}
			this.street = new Ext.form.ComboBox({
				name: params.street_field_name,
				fieldLabel: params.street_label,
				allowBlank: params.street_allow_blank,
                readOnly: params.read_only,
                cls: field_cls,
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
                valueNotFoundText: '',
                invalidClass: params.invalid_class
			});
			this.street.setValue(params.street_value);
			
			if (params.level > 2) {
				this.house = new Ext.form.TextField({
					name: params.house_field_name,
                    allowBlank: params.house_allow_blank,
                    readOnly: params.read_only,
                    cls: field_cls,
					fieldLabel: params.house_label,
					value: params.house_value,
					emptyText: '',
					width: 40,
                    invalidClass: params.invalid_class
				});
				
				if (params.level > 3) {
					this.flat = new Ext.form.TextField({
						name: params.flat_field_name,
						fieldLabel: params.flat_label,
						value: params.flat_value,
                        allowBlank: params.flat_allow_blank,
                        readOnly: params.read_only,
                        cls: field_cls,
						emptyText: '',
						width: 40,
                        invalidClass: params.invalid_class
					});
				}
			}
		}
		if (params.addr_visible) {
			this.addr = new Ext.form.TextArea({
				name: params.addr_field_name,
				anchor: '100%',
				fieldLabel: params.addr_label,
				value: params.addr_value,
				readOnly: true,
				cls: field_cls,
				height: 36
			});
		}
		if (params.view_mode == 1){
			// В одну строку
			this.place.flex = 1;
			if (params.level > 2) {
    			var row_items = [this.place, this.zipcode];
    		} else {
	    		var row_items = [this.place];
	    	}
	    		
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
                , invalidClass: params.invalid_composite_field_class

			};
			items.push(row);
			if (params.addr_visible) {
				items.push(this.addr);
			}
		}
		if (params.view_mode == 2){
			// В две строки
			if (params.level > 2) {
			    this.place.flex = 1;
			    var row = {
				    xtype: 'compositefield'
				    , anchor: '100%'
				    , fieldLabel: params.place_label
				    , items: [this.place, this.zipcode]
                    , invalidClass: params.invalid_composite_field_class
			    };
			    items.push(row);
			} else {
			    this.place.anchor = '100%';
			    items.push(this.place);
			}
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
				}
				var row = {
					xtype: 'compositefield'
					, anchor: '100%'
					, fieldLabel: params.street_label
					, items: row_items
                    , invalidClass: params.invalid_composite_field_class
				};
				items.push(row);
			}
			if (params.addr_visible) {
				items.push(this.addr);
			}
		}
		if (params.view_mode == 3){
			// В три строки
			if (params.level > 2) {
			    this.place.flex = 1;
			    var row = {
				    xtype: 'compositefield'
				    , anchor: '100%'
				    , fieldLabel: params.place_label
				    , items: [this.place, this.zipcode]
                    , invalidClass: params.invalid_composite_field_class
			    };
			    items.push(row);
			} else {
			    this.place.anchor = '100%';
			    items.push(this.place);
			}
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
			}
			if (params.addr_visible) {
				items.push(this.addr);
			}
		}
						
		var config = Ext.applyIf({
			items: items
			, get_addr_url: params.get_addr_url
			, level: params.level
			, addr_visible: params.addr_visible
			, style: {overflow: 'hidden'}
		}, baseConfig);
		
		Ext.Container.superclass.constructor.call(this, config);
	}
	, beforeStreetQuery: function(qe) {
		this.street.getStore().baseParams.place_code = this.place.value;		
	}
	, clearStreet: function() {		
    	this.street.setValue('');		
	}
    , afterRenderAddr: function(){
        //вашем обработчик dbl click через DOM елемент
        if (this.addr_visible) {
            this.addr.getEl().on('dblclick', this.onDblClickAddr, this)
        }
    }

	, initComponent: function(){
		Ext.m3.AddrField.superclass.initComponent.call(this);		
		this.mon(this.place, 'change', this.onChangePlace, this);
		if (this.level > 1) {
			this.mon(this.street, 'change', this.onChangeStreet, this);
			if (this.level > 2) {
				this.mon(this.house, 'change', this.onChangeHouse, this);
				this.mon(this.zipcode, 'change', this.onChangeZipcode, this);
				if (this.level > 3) {
					this.mon(this.flat, 'change', this.onChangeFlat, this);
				}
			}
		}
		this.mon(this.place, 'beforequery', this.beforePlaceQuery, this);
		if (this.level > 1) {
			this.mon(this.street, 'beforequery', this.beforeStreetQuery, this);
		}
        if (this.addr_visible) {
    		this.addr.on('afterrender', this.afterRenderAddr, this)
    	}
		
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
             * @event change_zipcode
             * При изменении индекса
             * @param {AddrField} this
             * @param {zipcode} индекс
             */
			'change_zipcode',
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
		var zipcode;
		if (this.zipcode != undefined) {
			zipcode = this.zipcode.getValue();
		}
		var place = null;
		var place_data =  this.place.getStore().data.get(place_id);
		if (place_data != undefined) {
			place = place_data.data;
		}
		var street = null;
		var street_data =  this.street.getStore().data.get(street_id);
		if (street_data != undefined) {
			street = street_data.data;
		}
		
		var new_addr = this.generateTextAddr(place, street, house_num, flat_num, zipcode);
		if (this.addr != undefined) {
			this.addr.setValue(new_addr);
		}
		
		/*
		var addrCmp = this;
		Ext.Ajax.request({
			url: this.get_addr_url,
			params: Ext.applyIf({ place: place_id, street: street_id, house: house_num, flat: flat_num, zipcode: zipcode, addr_cmp: this.addr.id }, this.params),
			success: function(response, opts){
			    smart_eval(response.responseText);
			    addrCmp.fireEvent('change');
			    },
			failure: function(){Ext.Msg.show({ title:'', msg: 'Не удалось получить адрес.<br>Причина: сервер временно недоступен.', buttons:Ext.Msg.OK, icon: Ext.Msg.WARNING });}
		});
		*/
    }
	, generateTextAddr: function(place, street, house, flat, zipcode) {
		/* Формирование текстового представления полного адреса */
		
		var addr_text = '';
		if (street != undefined) {
			addr_text = place.addr_name+', '+street.socr+' '+street.name;
		} else {
			addr_text = place.addr_name;
		}
		// проставим индекс
		if (zipcode != '') {
            addr_text = zipcode+', '+addr_text;
		}
		// обработаем и поставим дом с квартирой
        if (house != '' && house != undefined) {
            addr_text = addr_text+', '+'д. '+house;
        }
        if (flat != '' && flat != undefined) {
            addr_text = addr_text+', '+'к. '+flat;
        }
		return addr_text;
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
		    if (data.zipcode) {
		        this.zipcode.setValue(data.zipcode)
		    }
		} else {
			this.place.setValue('');
		}
		this.clearStreet();
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
		    if (data.zipcode) {
		        this.zipcode.setValue(data.zipcode)
		    }
		} else {
			this.clearStreet();
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
	, onChangeZipcode: function(){
		this.fireEvent('change_zipcode', this, this.zipcode.getValue());
		if (this.addr_visible) {
			this.getNewAddr();
		}
	}
	, beforePlaceQuery: function(qe) {
		this.fireEvent('before_query_place', this, qe);
	}
    , onDblClickAddr: function(qe) {
        if (this.addr_visible) {
            this.addr.setReadOnly(false);
        }
    }
            
});

/**
 * Расширенный комбобокс, включает несколько кнопок
 * @param {Object} baseConfig
 * @param {Object} params
 */
Ext.m3.AdvancedComboBox = Ext.extend(Ext.m3.ComboBox, {
	constructor: function(baseConfig, params){
		
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
		var value_id = this.getValue();
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
        // Очистка значения, если в автоподборе ничего не выбрано
        if (!this.getValue() && this.lastQuery) {
            this.setRawValue('');            
        }
        this.validate();
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
		this.baseTriggers[1].handler = function(){ 
			var today = new Date();
			this.setValue( today );
			this.fireEvent('select', this, today);
		};
		this.baseTriggers[1].hide = this.hideTriggerToday;
	}

});


/**
 * @class Ext.m3.CodeEditor
 * @extends Ext.Panel
 * Converts a panel into a code mirror editor with toolbar
 * @constructor
 *
 * @version 0.1
 */

 // Define a set of code type configurations

Ext.ns('Ext.m3.CodeEditorConfig');
Ext.apply(Ext.m3.CodeEditorConfig, {
    parser: {
        python: { mode: {name: "python", version: 2, singleLineStringErrors: false}},
        css: {mode: "css"},
        html: {mode: "text/html", tabMode: "indent"},
        javascript:{ mode:{ name: "javascript", json: true}},
        sql: {lineNumbers: true, matchBrackets: true, indentUnit: 4, mode: "text/x-plsql"}
    }
});

//Ext.ns('Ext.m3');
Ext.m3.CodeEditor = Ext.extend(Ext.Panel, {
    sourceCode: '/*Default code*/ ',
    readOnly: false,

    constructor: function(baseConfig){
        Ext.m3.CodeEditor.superclass.constructor.call(this, baseConfig);
    },

    initComponent: function() {
        // this property is used to determine if the source content changes
        this.contentChanged = false;

        Ext.apply(this, {
            items: [{
                xtype: 'textarea',
                readOnly: this.readOnly,
                hidden: true,
                value: this.sourceCode,
                enableKeyEvents: true
            }]
        });

        this.addEvents('editorkeyevent','editorfocus');

        Ext.m3.CodeEditor.superclass.initComponent.apply(this, arguments);
    },


    onRender: function() {
        Ext.m3.CodeEditor.superclass.onRender.apply(this, arguments);

        this.oldSourceCode = this.sourceCode;
        // trigger editor on afterlayout
        this.on('afterlayout', this.triggerCodeEditor, this, {
            single: true
        });

    },
    /* Хендлер перехвата клавиатурных действий */
    fireKeyEvent:function(i,e) {
        this.fireEvent('editorkeyevent', i, e);
    },

    fireFocusEvent:function() {
        this.fireEvent('editorfocus');
    },

    contentChange: function() {
        var oCmp = this.getTextArea();
        var sCode = this.codeMirrorEditor.getValue();

        oCmp.setValue(sCode);
        if(this.oldSourceCode == sCode) this.setTitleClass(true);
        else this.setTitleClass();
        this.fireEvent('contentChaged', this);
    },

    /** @private*/
    triggerCodeEditor: function() {
        var oThis = this;
        var oCmp = this.getTextArea();
        var editorConfig = Ext.applyIf(this.codeMirrorEditor || {}, {
            height: "100%",
            width: "100%",
            theme: "default",
            lineNumbers: true,
            indentUnit: 4,
            tabMode: "shift",
            matchBrackets: true,
            textWrapping: false,
            content: oCmp.getValue(),
            readOnly: oCmp.readOnly,
            autoMatchParens: true,
            /* Событие нажатия клавиши */
            onKeyEvent: this.fireKeyEvent.createDelegate(this),
            /* Событие изменения контента */
            onChange: this.contentChange.createDelegate(this),
            /* Событие фокуса эдитора */
            onFocus:this.fireFocusEvent.createDelegate(this)
       });

        var sParserType = oThis.parser || 'python';
        editorConfig = Ext.applyIf(editorConfig, Ext.m3.CodeEditorConfig.parser[sParserType]);

        this.codeMirrorEditor = new CodeMirror.fromTextArea(Ext.getDom(oCmp.id), editorConfig);
    },

    setTitleClass: function(){
        this.contentChanged = arguments[0] !== true;
    },

    getTextArea:function() {
        return this.findByType('textarea')[0];
    }
});

Ext.reg('uxCodeEditor', Ext.m3.CodeEditor);

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


Ext.ns('Ext.ux.grid');

Ext.ux.grid.Exporter = Ext.extend(Ext.util.Observable,{
    title:'',
    sendDatFromStore: true,
    constructor: function(config){
        Ext.ux.grid.Exporter.superclass.constructor.call(this);
    },
    init: function(grid){
        if (grid instanceof Ext.grid.GridPanel){
            this.grid = grid;
            this.grid.on('afterrender', this.onRender, this);
        }
        this.dataUrl = this.grid.dataUrl;
    },
    onRender:function(){
        //создадим top bar, если его нет
        if (!this.grid.tbar){
            this.grid.elements += ',tbar';
            tbar = new Ext.Toolbar();
            this.grid.tbar = tbar;
            this.grid.add(tbar);
            this.grid.doLayout();
    }
        //добавим кнопку
        this.grid.tbar.insert(0, new Ext.Button({
            text:'Экспорт',
            iconCls:'icon-application-go',
            listeners:{
                scope:this,
                click:this.exportData                
            }
        }));
    },
    exportData:function(){
        console.log(this.grid.store);
        columns = []
        Ext.each(this.grid.colModel.config,function(column,index){
            columns.push({
                data_index:column.dataIndex,
                header:column.header,
                id:column.id,
                is_column:column.isCoumn,
                sortable:column.sortable,
                width:column.width
            })
        });
        data = []

        if (this.sendDatFromStore){
            Ext.each(this.grid.store.data.items,function(item,index){ data.push(item.data) });
        }
        params = {
            columns: Ext.encode(columns),
            title: this.title || this.grid.title || this.grid.id,
            data: Ext.encode(data)
        }
        Ext.Ajax.request({
            url : '/ui/exportgrid-export',
            success : function(res,opt){                
                location.href=res.responseText;
            },
            failure : function(){
            },
            params : params
        });
    }
});
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
	,initComponent: function(){
		Ext.m3.AdvancedTreeGrid.superclass.initComponent.call(this);
		var store = this.getStore();
		store.baseParams = Ext.applyIf(store.baseParams || {}, this.actionContextJson || {});	
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


Ext.namespace('Ext.ux');

Ext.ux.OnDemandLoad = function(){

    loadComponent = function(component, callback){
        var fileType = component.substring(component.lastIndexOf('.'));
        var head = document.getElementsByTagName("head")[0];
        var done = false;
        if (fileType === ".js") {
            var fileRef = document.createElement('script');
            fileRef.setAttribute("type", "text/javascript");
            fileRef.setAttribute("src", component);
            fileRef.onload = fileRef.onreadystatechange = function(){
                if (!done) {
                    done = true;
                    if(typeof callback == "function"){
                        callback();
                    };
                    head.removeChild(fileRef);
                }
            };
        } else if (fileType === ".css") {
            var fileRef = document.createElement("link");
            fileRef.setAttribute("type", "text/css");
            fileRef.setAttribute("rel", "stylesheet");
            fileRef.setAttribute("href", component);
        }
        if (typeof fileRef != "undefined") {
            head.appendChild(fileRef);
        }
    };

    return {
        load: function(components, callback){
                loadComponent(components, callback);
        }
    };
}();
var CodeMirror=function(){function G(a,b){if(a.indexOf)return a.indexOf(b);for(var c=0,d=a.length;c<d;++c)if(a[c]==b)return c;return-1}function F(a,b){if(!b)return a?a.length:0;if(!a)return b.length;for(var c=a.length,d=b.length;c>=0&&d>=0;--c,--d)if(a.charAt(c)!=b.charAt(d))break;return d+1}function E(a){return a.replace(/[<>&]/g,function(a){return a=="&"?"&amp;":a=="<"?"&lt;":"&gt;"})}function D(a){return{line:a.line,ch:a.ch}}function C(a,b){return a.line<b.line||a.line==b.line&&a.ch<b.ch}function B(a,b){return a.line==b.line&&a.ch==b.ch}function A(a){return a.textContent||a.innerText||a.nodeValue||""}function z(a,b){var c=a.ownerDocument.body,d=0,e=0,f=!1;for(var g=a;g;g=g.offsetParent)d+=g.offsetLeft,e+=g.offsetTop,g==c&&(f=!0);var h=b&&f?null:c;for(var g=a.parentNode;g!=h;g=g.parentNode)g.scrollLeft!=null&&(d-=g.scrollLeft,e-=g.scrollTop);return{left:d,top:e}}function y(a,b){b==null&&(b=a.search(/[^\s\u00a0]/),b==-1&&(b=a.length));for(var c=0,d=0;c<b;++c)a.charAt(c)=="\t"?d+=u-d%u:++d;return d}function o(){this.id=null}function n(a,b,c,d){function e(a){c(new m(a||window.event))}if(typeof a.addEventListener=="function"){a.addEventListener(b,e,!1);if(d)return function(){a.removeEventListener(b,e,!1)}}else{a.attachEvent("on"+b,e);if(d)return function(){a.detachEvent("on"+b,e)}}}function m(a){this.e=a}function l(a){a.stop||(a.stop=k);return a}function k(){this.preventDefault?(this.preventDefault(),this.stopPropagation()):(this.returnValue=!1,this.cancelBubble=!0)}function j(){this.time=0,this.done=[],this.undone=[]}function i(a,b,c,d){for(var e=0,f=0,g=0;f<b;e+=2){var h=c[e],i=f+h.length;g==0?(i>a&&d.push(h.slice(a-f,Math.min(h.length,b-f)),c[e+1]),i>=a&&(g=1)):g==1&&(i>b?d.push(h.slice(0,b-f),c[e+1]):d.push(h,c[e+1])),f=i}}function h(a,b){this.styles=b||[a,null],this.stateAfter=null,this.text=a,this.marked=this.gutterMarker=this.className=null}function g(a){this.pos=this.start=0,this.string=a}function f(a,b,c){return a.startState?a.startState(b,c):!0}function e(a,b){if(b===!0)return b;if(a.copyState)return a.copyState(b);var c={};for(var d in b){var e=b[d];e instanceof Array&&(e=e.concat([])),c[d]=e}return c}function a(b,c){function cO(a,b,c){this.atOccurrence=!1,c==null&&(c=typeof a=="string"&&a==a.toLowerCase()),b&&typeof b=="object"?b=cc(b):b={line:0,ch:0},this.pos={from:b,to:b};if(typeof a!="string")this.matches=function(b,c){if(b){var d=W[c.line].text.slice(0,c.ch),e=d.match(a),f=0;while(e){var g=d.indexOf(e[0]);f+=g,d=d.slice(g+1);var h=d.match(a);if(h)e=h;else break;f++}}else var d=W[c.line].text.slice(c.ch),e=d.match(a),f=e&&c.ch+d.indexOf(e[0]);if(e)return{from:{line:c.line,ch:f},to:{line:c.line,ch:f+e[0].length},match:e}};else{c&&(a=a.toLowerCase());var d=c?function(a){return a.toLowerCase()}:function(a){return a},e=a.split("\n");e.length==1?this.matches=function(b,c){var e=d(W[c.line].text),f=a.length,g;if(b?c.ch>=f&&(g=e.lastIndexOf(a,c.ch-f))!=-1:(g=e.indexOf(a,c.ch))!=-1)return{from:{line:c.line,ch:g},to:{line:c.line,ch:g+f}}}:this.matches=function(a,b){var c=b.line,f=a?e.length-1:0,g=e[f],h=d(W[c].text),i=a?h.indexOf(g)+g.length:h.lastIndexOf(g);if(!(a?i>=b.ch||i!=g.length:i<=b.ch||i!=h.length-g.length))for(;;){if(a?!c:c==W.length-1)return;h=d(W[c+=a?-1:1].text),g=e[a?--f:++f];if(f>0&&f<e.length-1){if(h!=g)return;continue}var j=a?h.lastIndexOf(g):h.indexOf(g)+g.length;if(a?j!=h.length-g.length:j!=g.length)return;var k={line:b.line,ch:i},l={line:c,ch:j};return{from:a?l:k,to:a?k:l}}}}}function cN(a){return function(){cM++||cK();try{var b=a.apply(this,arguments)}finally{--cM||cL()}return b}}function cL(){var a=!1;bf&&(a=!bS()),bd.length?bV(bd):bf&&bZ(),a&&bS(),bf&&cC(),!bg&&(bc===!0||bc!==!1&&bf)&&bQ(),bf&&g.matchBrackets&&setTimeout(cN(function(){bm&&(bm(),bm=null),cE(!1)}),20);var b=be;bf&&g.onCursorActivity&&g.onCursorActivity(br),b&&g.onChange&&br&&g.onChange(br,b)}function cK(){bc=null,bd=[],be=bf=!1}function cJ(a){!X.length||T.set(a,cN(cI))}function cI(){var a=+(new Date)+g.workTime,b=X.length;while(X.length){if(!W[bh].stateAfter)var c=bh;else var c=X.pop();if(c>=W.length)continue;var d=cF(c),h=d&&W[d-1].stateAfter;h?h=e(V,h):h=f(V);var i=0,j=V.compareStates;for(var k=d,l=W.length;k<l;++k){var m=W[k],n=m.stateAfter;if(+(new Date)>a){X.push(k),cJ(g.workDelay),bd.push({from:c,to:k});return}var o=m.highlight(V,h);m.stateAfter=e(V,h);if(j){if(n&&j(n,h))break}else if(o||!n)i=0;else if(++i>3)break}bd.push({from:c,to:k})}b&&g.onHighlightComplete&&g.onHighlightComplete(br)}function cH(a,b){var c=cG(a);for(var d=a;d<b;++d){var f=W[d];f.highlight(V,c),f.stateAfter=e(V,c)}}function cG(a){var b=cF(a),c=b&&W[b-1].stateAfter;c?c=e(V,c):c=f(V);for(var d=b;d<a;++d){var g=W[d];g.highlight(V,c),g.stateAfter=e(V,c)}W[a].stateAfter||X.push(a);return c}function cF(a){var b,c;for(var d=a,e=a-40;d>e;--d){if(d==0)return 0;var f=W[d-1];if(f.stateAfter)return d;var g=f.indentation();if(c==null||b>g)c=d,b=g}return c}function cE(a){function p(a,b,c){if(!!a.text){var d=a.styles,e=g?0:a.text.length-1,f;for(var i=g?0:d.length-2,j=g?d.length:-2;i!=j;i+=2*h){var k=d[i];if(d[i+1]!=null&&d[i+1]!=m){e+=h*k.length;continue}for(var l=g?0:k.length-1,p=g?k.length:-1;l!=p;l+=h,e+=h)if(e>=b&&e<c&&o.test(f=k.charAt(l))){var q=cD[f];if(q.charAt(1)==">"==g)n.push(f);else{if(n.pop()!=q.charAt(0))return{pos:e,match:!1};if(!n.length)return{pos:e,match:!0}}}}}}var b=$.inverted?$.from:$.to,c=W[b.line],d=b.ch-1,e=d>=0&&cD[c.text.charAt(d)]||cD[c.text.charAt(++d)];if(!!e){var f=e.charAt(0),g=e.charAt(1)==">",h=g?1:-1,i=c.styles;for(var j=d+1,k=0,l=i.length;k<l;k+=2)if((j-=i[k].length)<=0){var m=i[k+1];break}var n=[c.text.charAt(d)],o=/[(){}[\]]/;for(var k=b.line,l=g?Math.min(k+50,W.length):Math.max(-1,k-50);k!=l;k+=h){var c=W[k],q=k==b.line,r=p(c,q&&g?d+1:0,q&&!g?d:c.text.length);if(r){var m=r.match?"CodeMirror-matchingbracket":"CodeMirror-nonmatchingbracket",s=cn({line:b.line,ch:d},{line:b.line,ch:d+1},m),t=cn({line:k,ch:r.pos},{line:k,ch:r.pos+1},m),u=cN(function(){s(),t()});a?setTimeout(u,800):bm=u;break}}}}function cC(){clearInterval(U);var a=!0;Q.style.visibility="",U=setInterval(function(){Q.style.visibility=(a=!a)?"":"hidden"},650)}function cB(a){function e(){y.value!=d&&cN(bI)(y.value,"end"),y.style.cssText=c,bg=!1,bQ(),bN()}var b=cA(a);if(!!b&&!window.opera){(B($.from,$.to)||C(b,$.from)||!C(b,$.to))&&ca(b.line,b.ch);var c=y.style.cssText;y.style.cssText="position: fixed; width: 30px; height: 30px; top: "+(a.pageY()-1)+"px; left: "+(a.pageX()-1)+"px; z-index: 1000; background: white; "+"border-width: 0; outline: none; overflow: hidden; opacity: .05;";var d=y.value=bL();bR(),J(y,0,y.value.length),bg=!0;if(q){a.stop();var f=n(window,"mouseup",function(){f(),setTimeout(e,20)},!0)}else setTimeout(e,50)}}function cA(a,b){var c=z(E,!0),d=a.e.clientX,e=a.e.clientY;if(!b&&(d-c.left>E.clientWidth||e-c.top>E.clientHeight))return null;var f=z(P,!0),g=bh+Math.floor((e-f.top)/cx());return cc({line:g,ch:cu(cb(g),d-f.left)})}function cz(){return P.offsetLeft}function cy(){return P.offsetTop}function cx(){var a=R.childNodes.length;if(a)return R.offsetHeight/a||1;L.innerHTML="<pre>x</pre>";return L.firstChild.offsetHeight||1}function cw(a){var b=cv(a,!0),c=z(P);return{x:c.left+b.x,y:c.top+b.y,yBot:c.top+b.yBot}}function cv(a,b){var c=cx(),d=a.line-(b?bh:0);return{x:ct(a.line,a.ch),y:d*c,yBot:(d+1)*c}}function cu(a,b){function e(a){L.innerHTML="<pre><span>"+c.getHTML(null,null,!1,a)+"</span></pre>";return L.firstChild.firstChild.offsetWidth}if(b<=0)return 0;var c=W[a],d=c.text,f=0,g=0,h=d.length,i,j=Math.min(h,Math.ceil(b/cs("x")));for(;;){var k=e(j);if(k<=b&&j<h)j=Math.min(h,Math.ceil(j*1.2));else{i=k,h=j;break}}if(b>i)return h;j=Math.floor(h*.8),k=e(j),k<b&&(f=j,g=k);for(;;){if(h-f<=1)return i-b>b-g?f:h;var l=Math.ceil((f+h)/2),m=e(l);m>b?(h=l,i=m):(f=l,g=m)}}function ct(a,b){if(b==0)return 0;L.innerHTML="<pre><span>"+W[a].getHTML(null,null,!1,b)+"</span></pre>";return L.firstChild.firstChild.offsetWidth}function cs(a){L.innerHTML="<pre><span>x</span></pre>",L.firstChild.firstChild.firstChild.nodeValue=a;return L.firstChild.firstChild.offsetWidth||10}function cr(a){if(typeof a=="number"){var b=a;a=W[a];if(!a)return null}else{var b=G(W,a);if(b==-1)return null}var c=a.gutterMarker;return{line:b,text:a.text,markerText:c&&c.text,markerClass:c&&c.style}}function cq(a,b){if(typeof a=="number"){var c=a;a=W[cb(a)]}else{var c=G(W,a);if(c==-1)return null}a.className!=b&&(a.className=b,bd.push({from:c,to:c+1}));return a}function cp(a){typeof a=="number"&&(a=W[cb(a)]),a.gutterMarker=null,bY()}function co(a,b,c){typeof a=="number"&&(a=W[cb(a)]),a.gutterMarker={text:b,style:c},bY();return a}function cn(a,b,c){function e(a,b,c,e){var a=W[a],f=a.addMark(b,c,e);f.line=a,d.push(f)}a=cc(a),b=cc(b);var d=[];if(a.line==b.line)e(a.line,a.ch,b.ch,c);else{e(a.line,a.ch,null,c);for(var f=a.line+1,g=b.line;f<g;++f)e(f,0,null,c);e(b.line,0,b.ch,c)}bd.push({from:a.line,to:b.line+1});return function(){var a,b;for(var c=0;c<d.length;++c){var e=d[c],f=G(W,e.line);e.line.removeMark(e),f>-1&&(a==null&&(a=f),b=f)}a!=null&&bd.push({from:a,to:b+1})}}function cm(){var a=g.gutter||g.lineNumbers;N.style.display=a?"":"none",a?bY():R.parentNode.style.marginLeft=0}function cl(){V=a.getMode(g,g.mode);for(var b=0,c=W.length;b<c;++b)W[b].stateAfter=null;X=[0],cJ()}function ck(a,b){if(b=="smart")if(!V.indent)b="prev";else var c=cG(a);var d=W[a],e=d.indentation(),f=d.text.match(/^\s*/)[0],h;b=="prev"?a?h=W[a-1].indentation():h=0:b=="smart"?h=V.indent(c,d.text.slice(f.length)):b=="add"?h=e+g.indentUnit:b=="subtract"&&(h=e-g.indentUnit),h=Math.max(0,h);var i=h-e;if(!i){if($.from.line!=a&&$.to.line!=a)return;var j=f}else{var j="",k=0;if(g.indentWithTabs)for(var l=Math.floor(h/u);l;--l)k+=u,j+="\t";while(k<h)++k,j+=" "}bH(j,{line:a,ch:0},{line:a,ch:f.length})}function cj(a){_=null;switch(g.tabMode){case"default":return!1;case"indent":for(var b=$.from.line,c=$.to.line;b<=c;++b)ck(b,"smart");break;case"classic":if(B($.from,$.to)){a?ck($.from.line,"smart"):bI("\t","end");break};case"shift":for(var b=$.from.line,c=$.to.line;b<=c;++b)ck(b,a?"subtract":"add")}return!0}function ci(){bI("\n","end"),g.enterMode!="flat"&&ck($.from.line,g.enterMode=="keep"?"prev":"smart")}function ch(a){b$({line:a,ch:0},{line:a,ch:W[a].text.length})}function cg(a){var b=W[a.line].text,c=a.ch,d=a.ch;while(c>0&&/\w/.test(b.charAt(c-1)))--c;while(d<b.length&&/\w/.test(b.charAt(d)))++d;b$({line:a.line,ch:c},{line:a.line,ch:d})}function cf(){var a=W.length-1;b_({line:0,ch:0},{line:a,ch:W[a].text.length})}function ce(a){var b=a?{line:0,ch:0}:{line:W.length-1,ch:W[W.length-1].text.length};b$(b,b)}function cd(a){var b=Math.floor(E.clientHeight/cx()),c=$.inverted?$.from:$.to;ca(c.line+Math.max(b-1,1)*(a?1:-1),c.ch,!0)}function cc(a){if(a.line<0)return{line:0,ch:0};if(a.line>=W.length)return{line:W.length-1,ch:W[W.length-1].text.length};var b=a.ch,c=W[a.line].text.length;return b==null||b>c?{line:a.line,ch:c}:b<0?{line:a.line,ch:0}:a}function cb(a){return Math.max(0,Math.min(a,W.length-1))}function ca(a,b,c){var d=cc({line:a,ch:b||0});(c?b$:b_)(d,d)}function b_(a,b,c,d){if(!B($.from,a)||!B($.to,b)){if(C(b,a)){var e=b;b=a,a=e}B(a,b)?$.inverted=!1:B(a,$.to)?$.inverted=!1:B(b,$.from)&&($.inverted=!0),c==null&&(c=$.from.line,d=$.to.line),B(a,b)?B($.from,$.to)||bd.push({from:c,to:d+1}):B($.from,$.to)?bd.push({from:a.line,to:b.line+1}):(B(a,$.from)||(a.line<c?bd.push({from:a.line,to:Math.min(b.line,c)+1}):bd.push({from:c,to:Math.min(d,a.line)+1})),B(b,$.to)||(b.line<d?bd.push({from:Math.max(c,a.line),to:d+1}):bd.push({from:Math.max(a.line,d),to:b.line+1}))),$.from=a,$.to=b,bf=!0}}function b$(a,b){var c=_&&cc(_);c&&(C(c,a)?a=c:C(b,c)&&(b=c)),b_(a,b)}function bZ(){var a=$.inverted?$.from:$.to,b=cx(),c=ct(a.line,a.ch)+"px",d=(a.line-bh)*b+"px";x.style.top=a.line*b-E.scrollTop+"px",B($.from,$.to)?(Q.style.top=d,Q.style.left=c,Q.style.display=""):Q.style.display="none"}function bY(){if(!!g.gutter||!!g.lineNumbers){var a=M.offsetHeight,b=E.clientHeight;N.style.height=(a-b<2?b:a)+"px";var c=[];for(var d=bh;d<Math.max(bi,bh+1);++d){var e=W[d].gutterMarker,f=g.lineNumbers?d+g.firstLineNumber:null;e&&e.text?f=e.text.replace("%N%",f!=null?f:""):f==null&&(f="\u00a0"),c.push(e&&e.style?'<pre class="'+e.style+'">':"<pre>",f,"</pre>")}N.style.display="none",O.innerHTML=c.join("");var h=String(W.length).length,i=O.firstChild,j=A(i),k="";while(j.length+k.length<h)k+="\u00a0";k&&i.insertBefore(m.createTextNode(k),i.firstChild),N.style.display="",P.style.marginLeft=N.offsetWidth+"px"}}function bX(a){var b=$.from.line,c=$.to.line,d=0,e=p&&m.createElement("div");for(var f=0,g=a.length;f<g;++f){var h=a[f],i=h.to-h.from-h.domSize,j=R.childNodes[h.domStart+h.domSize+d]||null;if(p)for(var k=Math.max(-i,h.domSize);k>0;--k)R.removeChild(j?j.previousSibling:R.lastChild);else if(i){for(var k=Math.max(0,i);k>0;--k)R.insertBefore(m.createElement("pre"),j);for(var k=Math.max(0,-i);k>0;--k)R.removeChild(j?j.previousSibling:R.lastChild)}var l=R.childNodes[h.domStart+d],n=b<h.from&&c>=h.from;for(var k=h.from;k<h.to;++k){var o=null,q=null;n?(o=0,c==k&&(n=!1,q=$.to.ch)):b==k&&(c==k?(o=$.from.ch,q=$.to.ch):(n=!0,o=$.from.ch)),p?(e.innerHTML=W[k].getHTML(o,q,!0),R.insertBefore(e.firstChild,j)):(l.innerHTML=W[k].getHTML(o,q,!1),l.className=W[k].className||"",l=l.nextSibling)}d+=i}}function bW(a,b){var c=[],d={line:a,ch:0},e=C($.from,d)&&!C($.to,d);for(var f=a;f<b;++f){var g=null,h=null;e?(g=0,$.to.line==f&&(e=!1,h=$.to.ch)):$.from.line==f&&($.to.line==f?(g=$.from.ch,h=$.to.ch):(e=!0,g=$.from.ch)),c.push(W[f].getHTML(g,h,!0))}R.innerHTML=c.join("")}function bV(a){if(!E.clientWidth)bh=bi=0;else{var b=a===!0?[]:[{from:bh,to:bi,domStart:0}];for(var c=0,d=a.length||0;c<d;++c){var e=a[c],f=[],g=e.diff||0;for(var h=0,i=b.length;h<i;++h){var j=b[h];e.to<=j.from?f.push({from:j.from+g,to:j.to+g,domStart:j.domStart}):j.to<=e.from?f.push(j):(e.from>j.from&&f.push({from:j.from,to:e.from,domStart:j.domStart}),e.to<j.to&&f.push({from:e.to+g,to:j.to+g,domStart:j.domStart+(e.to-j.from)}))}b=f}var k=bU(),l=Math.min(bh,Math.max(k.from-3,0)),m=Math.min(W.length,Math.max(bi,k.to+3)),n=[],o=0,p=bi-bh,q=l,r=0;for(var c=0,d=b.length;c<d;++c){var j=b[c];if(j.to<=l)continue;if(j.from>=m)break;if(j.domStart>o||j.from>q)n.push({from:q,to:j.from,domSize:j.domStart-o,domStart:o}),r+=j.from-q;q=j.to,o=j.domStart+(j.to-j.from)}if(o!=p||q!=m)r+=Math.abs(m-q),n.push({from:q,to:m,domSize:p-o,domStart:o});if(!n.length)return;R.style.display="none",r>(k.to-k.from)*.3?bW(l=Math.max(k.from-10,0),m=Math.min(k.to+7,W.length)):bX(n),R.style.display="";var s=l!=bh||m!=bi||bj!=E.clientHeight;bh=l,bi=m,M.style.top=l*cx()+"px",s&&(bj=E.clientHeight,K.style.height=W.length*cx()+2*cy()+"px",bY());var t=cs(bn);P.style.width=t>E.clientWidth?t+"px":"";if(R.childNodes.length!=bi-bh)throw new Error("BAD PATCH! "+JSON.stringify(n)+" size="+(bi-bh)+" nodes="+R.childNodes.length);bZ()}}function bU(){var a=cx(),b=E.scrollTop-cy();return{from:Math.min(W.length,Math.max(0,Math.floor(b/a))),to:Math.min(W.length,Math.ceil((b+E.clientHeight)/a))}}function bT(a,b,c,d){var e=cz(),f=cy(),h=cx();b+=f,d+=f,a+=e,c+=e;var i=E.clientHeight,j=E.scrollTop,k=!1,l=!0;b<j?(E.scrollTop=Math.max(0,b-2*h),k=!0):d>j+i&&(E.scrollTop=d+h-i,k=!0);var m=E.clientWidth,n=E.scrollLeft;a<n?(a<50&&(a=0),E.scrollLeft=Math.max(0,a-10),k=!0):c>m+n&&(E.scrollLeft=c+10-m,k=!0,c>K.clientWidth&&(l=!1)),k&&g.onScroll&&g.onScroll(br);return l}function bS(){var a=cv($.inverted?$.from:$.to);return bT(a.x,a.y,a.x,a.yBot)}function bR(){g.readOnly!="nocursor"&&y.focus()}function bQ(){var a=[],b=Math.max(0,$.from.line-1),c=Math.min(W.length,$.to.line+2);for(var d=b;d<c;++d)a.push(W[d].text);a=y.value=a.join(t);var e=$.from.ch,f=$.to.ch;for(var d=b;d<$.from.line;++d)e+=t.length+W[d].text.length;for(var d=b;d<$.to.line;++d)f+=t.length+W[d].text.length;bl={text:a,from:b,to:c,start:e,end:f},J(y,e,ba?e:f)}function bP(){function f(a,c){var d=0;for(;;){var e=b.indexOf("\n",d);if(e==-1||(b.charAt(e-1)=="\r"?e-1:e)>=a)return{line:c,ch:a-d};++c,d=e+1}}if(!bg){var a=!1,b=y.value,c=I(y);if(!c)return!1;var a=bl.text!=b,d=ba,e=a||c.start!=bl.start||c.end!=(d?bl.start:bl.end);if(!e&&!d)return!1;if(a){_=ba=null;if(g.readOnly){bc=!0;return"changed"}}var h=f(c.start,bl.from),i=f(c.end,bl.from);if(d){var j=c.start==d.anchor?i:h,k=_?$.to:c.start==d.anchor?h:i;($.inverted=C(j,k))?(h=j,i=k):(ba=null,h=k,i=j)}h.line==i.line&&h.line==$.from.line&&h.line==$.to.line&&!_&&(bc=!1);if(a){var l=0,m=b.length,n=Math.min(m,bl.text.length),o,p=bl.from,q=-1;while(l<n&&(o=b.charAt(l))==bl.text.charAt(l))++l,o=="\n"&&(p++,q=l);var r=q>-1?l-q:l,s=bl.to-1,t=bl.text.length;for(;;){o=bl.text.charAt(t);if(b.charAt(m)!=o){++m,++t;break}o=="\n"&&s--;if(t<=l||m<=l)break;--m,--t}var q=bl.text.lastIndexOf("\n",t-1),u=q==-1?t:t-q-1;bC({line:p,ch:r},{line:s,ch:u},H(b.slice(l,m)),h,i);if(p!=s||h.line!=p)bc=!0}else b_(h,i);bl.text=b,bl.start=c.start,bl.end=c.end;return a?"changed":e?"moved":!1}}function bO(a){function c(){cK();var d=bP();d=="moved"&&a&&(w[a]=!0),!d&&!b?(b=!0,S.set(80,c)):(bM=!1,bN()),cL()}var b=!1;bM=!0,S.set(20,c)}function bN(){bM||S.set(2e3,function(){cK(),bP(),Z&&bN(),cL()})}function bL(){return bK($.from,$.to)}function bK(a,b){var c=a.line,d=b.line;if(c==d)return W[c].text.slice(a.ch,b.ch);var e=[W[c].text.slice(a.ch)];for(var f=c+1;f<d;++f)e.push(W[f].text);e.push(W[d].text.slice(0,b.ch));return e.join("\n")}function bJ(a,b,c,d){var e=a.length==1?a[0].length+b.ch:a[a.length-1].length,f=d({line:b.line+a.length-1,ch:e});bC(b,c,a,f.from,f.to)}function bI(a,b){bJ(H(a),$.from,$.to,function(a){return b=="end"?{from:a,to:a}:b=="start"?{from:$.from,to:$.from}:{from:$.from,to:a}})}function bH(a,b,c){function d(d){if(C(d,b))return d;if(!C(c,d))return e;var f=d.line+a.length-(c.line-b.line)-1,g=d.ch;d.line==c.line&&(g+=a[a.length-1].length-(c.ch-(c.line==b.line?b.ch:0)));return{line:f,ch:g}}b=cc(b),c?c=cc(c):c=b,a=H(a);var e;bJ(a,b,c,function(a){e=a;return{from:d($.from),to:d($.to)}});return e}function bG(a,b,c,d,e){function s(a){return a<=Math.min(b.line,b.line+q)?a:a+q}var f=!1,g=bn.length;for(var i=a.line;i<=b.line;++i)if(W[i].text.length==g){f=!0;break}var j=b.line-a.line,k=W[a.line],l=W[b.line];if(k==l)if(c.length==1)k.replace(a.ch,b.ch,c[0]);else{l=k.split(b.ch,c[c.length-1]);var m=[a.line+1,j];k.replace(a.ch,k.text.length,c[0]);for(var i=1,n=c.length-1;i<n;++i)m.push(new h(c[i]));m.push(l),W.splice.apply(W,m)}else if(c.length==1)k.replace(a.ch,k.text.length,c[0]+l.text.slice(b.ch)),W.splice(a.line+1,j);else{var m=[a.line+1,j-1];k.replace(a.ch,k.text.length,c[0]),l.replace(0,b.ch,c[c.length-1]);for(var i=1,n=c.length-1;i<n;++i)m.push(new h(c[i]));W.splice.apply(W,m)}for(var i=a.line,n=i+c.length;i<n;++i){var o=W[i].text;o.length>g&&(bn=o,g=o.length,f=!1)}if(f){g=0,bn="";for(var i=0,n=W.length;i<n;++i){var o=W[i].text;o.length>g&&(g=o.length,bn=o)}}var p=[],q=c.length-j-1;for(var i=0,o=X.length;i<o;++i){var r=X[i];r<a.line?p.push(r):r>b.line&&p.push(r+q)}c.length<5?(cH(a.line,a.line+c.length),p.push(a.line+c.length)):p.push(a.line),X=p,cJ(100),bd.push({from:a.line,to:b.line+1,diff:q}),be={from:a,to:b,text:c},b_(d,e,s($.from.line),s($.to.line)),K.style.height=W.length*cx()+2*cy()+"px"}function bF(){bD(Y.undone,Y.done)}function bE(){bD(Y.done,Y.undone)}function bD(a,b){var c=a.pop();if(c){var d=[],e=c.start+c.added;for(var f=c.start;f<e;++f)d.push(W[f].text);b.push({start:c.start,added:c.old.length,old:d});var g=cc({line:c.start+c.old.length-1,ch:F(d[d.length-1],c.old[c.old.length-1])});bG({line:c.start,ch:0},{line:e-1,ch:W[e-1].text.length},c.old,g,g)}}function bC(a,b,c,d,e){if(Y){var f=[];for(var h=a.line,i=b.line+1;h<i;++h)f.push(W[h].text);Y.addChange(a.line,c.length,f);while(Y.done.length>g.undoDepth)Y.done.shift()}bG(a,b,c,d,e)}function bB(){Z&&g.onBlur&&g.onBlur(br),clearInterval(U),_=null,Z=!1,s.className=s.className.replace(" CodeMirror-focused","")}function bA(){g.readOnly!="nocursor"&&(!Z&&g.onFocus&&g.onFocus(br),Z=!0,bN(),s.className.search(/\bCodeMirror-focused\b/)==-1&&(s.className+=" CodeMirror-focused"),cC())}function bz(a){if(!g.onKeyEvent||!g.onKeyEvent(br,l(a.e))){if(g.electricChars&&V.electricChars){var b=String.fromCharCode(a.e.charCode==null?a.e.keyCode:a.e.charCode);V.electricChars.indexOf(b)>-1&&setTimeout(cN(function(){ck($.to.line,"smart")}),50)}var c=a.e.keyCode;c==13?(g.readOnly||ci(),a.stop()):!a.e.ctrlKey&&!a.e.altKey&&!a.e.metaKey&&c==9&&g.tabMode!="default"?a.stop():bO(bk)}}function by(a){if(!g.onKeyEvent||!g.onKeyEvent(br,l(a.e)))ba&&(ba=null,bc=!0),a.e.keyCode==16&&(_=null)}function bx(a){Z||bA();var b=a.e.keyCode;r&&b==27&&(a.e.returnValue=!1);var c=(v?a.e.metaKey:a.e.ctrlKey)&&!a.e.altKey,d=a.e.ctrlKey||a.e.altKey||a.e.metaKey;b==16||a.e.shiftKey?_=_||($.inverted?$.to:$.from):_=null;if(!g.onKeyEvent||!g.onKeyEvent(br,l(a.e))){if(b==33||b==34){cd(b==34);return a.stop()}if(c&&(b==36||b==35||v&&(b==38||b==40))){ce(b==36||b==38);return a.stop()}if(c&&b==65){cf();return a.stop()}if(!g.readOnly){if(!d&&b==13)return;if(!d&&b==9&&cj(a.e.shiftKey))return a.stop();if(c&&b==90){bE();return a.stop()}if(c&&(a.e.shiftKey&&b==90||b==89)){bF();return a.stop()}}bk=(c?"c":"")+b;if($.inverted&&w.hasOwnProperty(bk)){var e=I(y);e&&(ba={anchor:e.start},J(y,e.start,e.start))}bO(bk)}}function bw(a){a.e.preventDefault();var b=cA(a,!0),c=a.e.dataTransfer.files;if(!!b&&!g.readOnly)if(c&&c.length&&window.FileReader&&window.File){function d(a,c){var d=new FileReader;d.onload=function(){f[c]=d.result,++h==e&&bH(f.join(""),cc(b),cc(b))},d.readAsText(a)}var e=c.length,f=Array(e),h=0;for(var i=0;i<e;++i)d(c[i],i)}else try{var f=a.e.dataTransfer.getData("Text");f&&bH(f,b,b)}catch(a){}}function bv(a){var b=cA(a);!b||(cg(b),a.stop(),bb=+(new Date))}function bu(a){function i(a){var b=cA(a,!0);if(b&&!B(b,e)){Z||bA(),e=b,b$(d,b),bc=!1;var c=bU();if(b.line>=c.to||b.line<c.from)f=setTimeout(cN(function(){i(a)}),150)}}function h(){bR(),bc=!0,j(),k()}var b=bb;bb=null;for(var c=a.target();c!=s;c=c.parentNode)if(c.parentNode==O){g.onGutterClick&&g.onGutterClick(br,G(O.childNodes,c)+bh);return a.stop()}q&&a.button()==3&&cB(a);if(a.button()==1){var d=cA(a),e=d,f;if(!d){a.target()==E&&a.stop();return}Z||bA(),a.stop();if(b&&+(new Date)-b<400)return ch(d.line);ca(d.line,d.ch,!0);var j=n(m,"mousemove",cN(function(a){clearTimeout(f),a.stop(),i(a)}),!0),k=n(m,"mouseup",cN(function(a){clearTimeout(f);var b=cA(a);b&&b$(d,b),a.stop(),h()}),!0)}}function bt(a){var b=[];for(var c=0,d=W.length;c<d;++c)b.push(W[c].text);return b.join("\n")}function bs(a){Y=null;var b={line:0,ch:0};bC(b,{line:W.length-1,ch:W[W.length-1].text.length},H(a),b,b),Y=new j}function bq(a){return a>=0&&a<W.length}var g={},i=a.defaults;for(var k in i)i.hasOwnProperty(k)&&(g[k]=(c&&c.hasOwnProperty(k)?c:i)[k]);var m=g.document,s=m.createElement("div");s.className="CodeMirror",s.innerHTML='<div style="overflow: hidden; position: relative; width: 1px; height: 0px;"><textarea style="position: absolute; width: 2px;" wrap="off"></textarea></div><div class="CodeMirror-scroll cm-s-'+g.theme+'">'+'<div style="position: relative">'+'<div style="position: absolute; height: 0; width: 0; overflow: hidden;"></div>'+'<div style="position: relative">'+'<div class="CodeMirror-gutter"><div class="CodeMirror-gutter-text"></div></div>'+'<div class="CodeMirror-lines"><div style="position: relative">'+'<pre class="CodeMirror-cursor">&#160;</pre>'+"<div></div>"+"</div></div></div></div></div>",b.appendChild?b.appendChild(s):b(s);var x=s.firstChild,y=x.firstChild,E=s.lastChild,K=E.firstChild,L=K.firstChild,M=L.nextSibling,N=M.firstChild,O=N.firstChild,P=N.nextSibling.firstChild,Q=P.firstChild,R=Q.nextSibling;g.tabindex!=null&&(y.tabindex=g.tabindex),!g.gutter&&!g.lineNumbers&&(N.style.display="none");var S=new o,T=new o,U,V,W=[new h("")],X,Y=new j,Z;cl();var $={from:{line:0,ch:0},to:{line:0,ch:0},inverted:!1},_,ba,bb,bc,bd,be,bf,bg,bh=0,bi=0,bj=0,bk=null,bl,bm,bn="";cN(function(){bs(g.value||""),bc=!1})(),setTimeout(bQ,20),n(E,"mousedown",cN(bu)),q||n(E,"contextmenu",cN(cB)),n(K,"dblclick",cN(bv)),n(E,"scroll",function(){bV([]),g.onScroll&&g.onScroll(br)}),n(window,"resize",function(){bV(!0)}),n(y,"keyup",cN(by)),n(y,"keydown",cN(bx)),n(y,"keypress",cN(bz)),n(y,"focus",bA),n(y,"blur",bB),n(E,"dragenter",function(a){a.stop()}),n(E,"dragover",function(a){a.stop()}),n(E,"drop",cN(bw)),n(E,"paste",function(){bR(),bO()}),n(y,"paste",function(){bO()}),n(y,"cut",function(){bO()});var bo;try{bo=m.activeElement==y}catch(bp){}bo?bA():bB();var br={getValue:bt,setValue:cN(bs),getSelection:bL,replaceSelection:cN(bI),focus:function(){bR(),bA(),bQ(),bO()},setOption:function(a,b){g[a]=b,a=="lineNumbers"||a=="gutter"?cm():a=="mode"||a=="indentUnit"?cl():a=="readOnly"&&b=="nocursor"?y.blur():a=="theme"&&(E.className=E.className.replace(/cm-s-\w+/,"cm-s-"+b))},getOption:function(a){return g[a]},undo:cN(bE),redo:cN(bF),indentLine:cN(function(a){bq(a)&&ck(a,"smart")}),historySize:function(){return{undo:Y.done.length,redo:Y.undone.length}},matchBrackets:cN(function(){cE(!0)}),getTokenAt:function(a){a=cc(a);return W[a.line].getTokenAt(V,cG(a.line),a.ch)},getStateAfter:function(a){a=cb(a==null?W.length-1:a);return cG(a+1)},cursorCoords:function(a){a==null&&(a=$.inverted);return cw(a?$.from:$.to)},charCoords:function(a){return cw(cc(a))},coordsChar:function(a){var b=z(P),c=cb(Math.min(W.length-1,bh+Math.floor((a.y-b.top)/cx())));return cc({line:c,ch:cu(cb(c),a.x-b.left)})},getSearchCursor:function(a,b,c){return new cO(a,b,c)},markText:cN(function(a,b,c){return cN(cn(a,b,c))}),setMarker:co,clearMarker:cp,setLineClass:cN(cq),lineInfo:cr,addWidget:function(a,b,c){var a=cv(cc(a),!0);b.style.top=bh*cx()+a.yBot+cy()+"px",b.style.left=a.x+cz()+"px",K.appendChild(b),c&&bT(a.x,a.yBot,a.x+b.offsetWidth,a.yBot+b.offsetHeight)},lineCount:function(){return W.length},getCursor:function(a){a==null&&(a=$.inverted);return D(a?$.from:$.to)},somethingSelected:function(){return!B($.from,$.to)},setCursor:cN(function(a,b){b==null&&typeof a.line=="number"?ca(a.line,a.ch):ca(a,b)}),setSelection:cN(function(a,b){b_(cc(a),cc(b||a))}),getLine:function(a){if(bq(a))return W[a].text},setLine:cN(function(a,b){bq(a)&&bH(b,{line:a,ch:0},{line:a,ch:W[a].text.length})}),removeLine:cN(function(a){bq(a)&&bH("",{line:a,ch:0},cc({line:a+1,ch:0}))}),replaceRange:cN(bH),getRange:function(a,b){return bK(cc(a),cc(b))},operation:function(a){return cN(a)()},refresh:function(){bV(!0)},getInputField:function(){return y},getWrapperElement:function(){return s},getScrollerElement:function(){return E}},bM=!1,cD={"(":")>",")":"(<","[":"]>","]":"[<","{":"}>","}":"{<"},cM=0;cO.prototype={findNext:function(){return this.find(!1)},findPrevious:function(){return this.find(!0)},find:function(a){function d(a){var c={line:a,ch:0};b.pos={from:c,to:c},b.atOccurrence=!1;return!1}var b=this,c=cc(a?this.pos.from:this.pos.to);for(;;){if(this.pos=this.matches(a,c)){this.atOccurrence=!0;return this.pos.match||!0}if(a){if(!c.line)return d(0);c={line:c.line-1,ch:W[c.line-1].text.length}}else{if(c.line==W.length-1)return d(W.length);c={line:c.line+1,ch:0}}}},from:function(){if(this.atOccurrence)return D(this.pos.from)},to:function(){if(this.atOccurrence)return D(this.pos.to)}};for(var cP in d)d.propertyIsEnumerable(cP)&&!br.propertyIsEnumerable(cP)&&(br[cP]=d[cP]);return br}a.defaults={value:"",mode:null,theme:"default",indentUnit:2,indentWithTabs:!1,tabMode:"classic",enterMode:"indent",electricChars:!0,onKeyEvent:null,lineNumbers:!1,gutter:!1,firstLineNumber:1,readOnly:!1,onChange:null,onCursorActivity:null,onGutterClick:null,onHighlightComplete:null,onFocus:null,onBlur:null,onScroll:null,matchBrackets:!1,workTime:100,workDelay:200,undoDepth:40,tabindex:null,document:window.document};var b={},c={};a.defineMode=function(c,d){!a.defaults.mode&&c!="null"&&(a.defaults.mode=c),b[c]=d},a.defineMIME=function(a,b){c[a]=b},a.getMode=function(d,e){typeof e=="string"&&c.hasOwnProperty(e)&&(e=c[e]);if(typeof e=="string")var f=e,g={};else if(e!=null)var f=e.name,g=e;var h=b[f];if(!h){window.console&&console.warn("No mode "+f+" found, falling back to plain text.");return a.getMode(d,"text/plain")}return h(d,g||{})},a.listModes=function(){var a=[];for(var c in b)b.propertyIsEnumerable(c)&&a.push(c);return a},a.listMIMEs=function(){var a=[];for(var b in c)c.propertyIsEnumerable(b)&&a.push(b);return a};var d={};a.defineExtension=function(a,b){d[a]=b},a.fromTextArea=function(b,c){function d(){b.value=h.getValue()}c||(c={}),c.value=b.value,!c.tabindex&&b.tabindex&&(c.tabindex=b.tabindex);if(b.form){var e=n(b.form,"submit",d,!0);if(typeof b.form.submit=="function"){var f=b.form.submit;function g(){d(),b.form.submit=f,b.form.submit(),b.form.submit=g}b.form.submit=g}}b.style.display="none";var h=a(function(a){b.parentNode.insertBefore(a,b.nextSibling)},c);h.save=d,h.toTextArea=function(){d(),b.parentNode.removeChild(h.getWrapperElement()),b.style.display="",b.form&&(e(),typeof b.form.submit=="function"&&(b.form.submit=f))};return h},a.startState=f,a.copyState=e,g.prototype={eol:function(){return this.pos>=this.string.length},sol:function(){return this.pos==0},peek:function(){return this.string.charAt(this.pos)},next:function(){if(this.pos<this.string.length)return this.string.charAt(this.pos++)},eat:function(a){var b=this.string.charAt(this.pos);if(typeof a=="string")var c=b==a;else var c=b&&(a.test?a.test(b):a(b));if(c){++this.pos;return b}},eatWhile:function(a){var b=this.start;while(this.eat(a));return this.pos>b},eatSpace:function(){var a=this.pos;while(/[\s\u00a0]/.test(this.string.charAt(this.pos)))++this.pos;return this.pos>a},skipToEnd:function(){this.pos=this.string.length},skipTo:function(a){var b=this.string.indexOf(a,this.pos);if(b>-1){this.pos=b;return!0}},backUp:function(a){this.pos-=a},column:function(){return y(this.string,this.start)},indentation:function(){return y(this.string)},match:function(a,b,c){if(typeof a!="string"){var e=this.string.slice(this.pos).match(a);e&&b!==!1&&(this.pos+=e[0].length);return e}function d(a){return c?a.toLowerCase():a}if(d(this.string).indexOf(d(a),this.pos)==this.pos){b!==!1&&(this.pos+=a.length);return!0}},current:function(){return this.string.slice(this.start,this.pos)}},a.StringStream=g,h.prototype={replace:function(a,b,c){var d=[],e=this.marked;i(0,a,this.styles,d),c&&d.push(c,null),i(b,this.text.length,this.styles,d),this.styles=d,this.text=this.text.slice(0,a)+c+this.text.slice(b),this.stateAfter=null;if(e){var f=c.length-(b-a),g=this.text.length;function h(a){return a<=Math.min(b,b+f)?a:a+f}for(var j=0;j<e.length;++j){var k=e[j],l=!1;k.from>=g?l=!0:(k.from=h(k.from),k.to!=null&&(k.to=h(k.to)));if(l||k.from>=k.to)e.splice(j,1),j--}}},split:function(a,b){var c=[b,null];i(a,this.text.length,this.styles,c);return new h(b+this.text.slice(a),c)},addMark:function(a,b,c){var d=this.marked,e={from:a,to:b,style:c};this.marked==null&&(this.marked=[]),this.marked.push(e),this.marked.sort(function(a,b){return a.from-b.from});return e},removeMark:function(a){var b=this.marked;if(!!b)for(var c=0;c<b.length;++c)if(b[c]==a){b.splice(c,1);break}},highlight:function(a,b){var c=new g(this.text),d=this.styles,e=0,f=!1,h=d[0],i;this.text==""&&a.blankLine&&a.blankLine(b);while(!c.eol()){var j=a.token(c,b),k=this.text.slice(c.start,c.pos);c.start=c.pos,e&&d[e-1]==j?d[e-2]+=k:k&&(!f&&(d[e+1]!=j||e&&d[e-2]!=i)&&(f=!0),d[e++]=k,d[e++]=j,i=h,h=d[e]);if(c.pos>5e3){d[e++]=this.text.slice(c.pos),d[e++]=null;break}}d.length!=e&&(d.length=e,f=!0),e&&d[e-2]!=i&&(f=!0);return f||d.length<5&&this.text.length<10},getTokenAt:function(a,b,c){var d=this.text,e=new g(d);while(e.pos<c&&!e.eol()){e.start=e.pos;var f=a.token(e,b)}return{start:e.start,end:e.pos,string:e.current(),className:f||null,state:b}},indentation:function(){return y(this.text)},getHTML:function(a,b,c,d){function f(a,b){!a||(b?e.push('<span class="cm-',b,'">',E(a),"</span>"):e.push(E(a)))}var e=[];c&&e.push(this.className?'<pre class="'+this.className+'">':"<pre>");var g=this.styles,h=this.text,i=this.marked;a==b&&(a=null);var j=h.length;d!=null&&(j=Math.min(d,j));if(!h&&d==null)f(" ",a!=null&&b==null?"CodeMirror-selected":null);else if(!i&&a==null)for(var k=0,l=0;l<j;k+=2){var m=g[k],n=m.length;l+n>j&&(m=m.slice(0,j-l)),l+=n,f(m,g[k+1])}else{var o=0,k=0,p="",q,r=0,s=-1,t=null;function u(){i&&(s+=1,t=s<i.length?i[s]:null)}u();while(o<j){var v=j,w="";if(a!=null)if(a>o)v=a;else if(b==null||b>o)w=" CodeMirror-selected",b!=null&&(v=Math.min(v,b));while(t&&t.to!=null&&t.to<=o)u();t&&(t.from>o?v=Math.min(v,t.from):(w+=" "+t.style,t.to!=null&&(v=Math.min(v,t.to))));for(;;){var x=o+p.length,y=q;w&&(y=q?q+w:w),f(x>v?p.slice(0,v-o):p,y);if(x>=v){p=p.slice(v-o),o=v;break}o=x,p=g[k++],q=g[k++]}}a!=null&&b==null&&f(" ","CodeMirror-selected")}c&&e.push("</pre>");return e.join("")}},j.prototype={addChange:function(a,b,c){this.undone.length=0;var d=+(new Date),e=this.done[this.done.length-1];if(d-this.time>400||!e||e.start>a+b||e.start+e.added<a-e.added+e.old.length)this.done.push({start:a,added:b,old:c});else{var f=0;if(a<e.start){for(var g=e.start-a-1;g>=0;--g)e.old.unshift(c[g]);e.added+=e.start-a,e.start=a}else e.start<a&&(f=a-e.start,b+=f);for(var g=e.added-f,h=c.length;g<h;++g)e.old.push(c[g]);e.added<b&&(e.added=b)}this.time=d}},m.prototype={stop:function(){k.call(this.e)},target:function(){return this.e.target||this.e.srcElement},button:function(){if(this.e.which)return this.e.which;if(this.e.button&1)return 1;if(this.e.button&2)return 3;if(this.e.button&4)return 2},pageX:function(){if(this.e.pageX!=null)return this.e.pageX;var a=this.target().ownerDocument;return this.e.clientX+a.body.scrollLeft+a.documentElement.scrollLeft},pageY:function(){if(this.e.pageY!=null)return this.e.pageY;var a=this.target().ownerDocument;return this.e.clientY+a.body.scrollTop+a.documentElement.scrollTop}},o.prototype={set:function(a,b){clearTimeout(this.id),this.id=setTimeout(b,a)}};var p=function(){var a=document.createElement("pre");a.innerHTML=" ";return!a.innerHTML}(),q=/gecko\/\d{7}/i.test(navigator.userAgent),r=/MSIE \d/.test(navigator.userAgent),s=/Apple Computer/.test(navigator.vendor),t="\n";(function(){var a=document.createElement("textarea");a.value="foo\nbar",a.value.indexOf("\r")>-1&&(t="\r\n")})();var u=8,v=/Mac/.test(navigator.platform),w={};for(var x=35;x<=40;++x)w[x]=w["c"+x]=!0;a.htmlEscape=E;if("\n\nb".split(/\n/).length!=3)var H=function(a){var b=0,c,d=[];while((c=a.indexOf("\n",b))>-1)d.push(a.slice(b,a.charAt(c-1)=="\r"?c-1:c)),b=c+1;d.push(a.slice(b));return d};else var H=function(a){return a.split(/\r?\n/)};a.splitLines=H;if(window.getSelection){var I=function(a){try{return{start:a.selectionStart,end:a.selectionEnd}}catch(b){return null}};if(s)var J=function(a,b,c){b==c?a.setSelectionRange(b,c):(a.setSelectionRange(b,c-1),window.getSelection().modify("extend","forward","character"))};else var J=function(a,b,c){try{a.setSelectionRange(b,c)}catch(d){}}}else var I=function(a){try{var b=a.ownerDocument.selection.createRange()}catch(c){return null}if(!b||b.parentElement()!=a)return null;var d=a.value,e=d.length,f=a.createTextRange();f.moveToBookmark(b.getBookmark());var g=a.createTextRange();g.collapse(!1);if(f.compareEndPoints("StartToEnd",g)>-1)return{start:e,end:e};var h=-f.moveStart("character",-e);for(var i=d.indexOf("\r");i>-1&&i<h;i=d.indexOf("\r",i+1),h++);if(f.compareEndPoints("EndToEnd",g)>-1)return{start:h,end:e};var j=-f.moveEnd("character",-e);for(var i=d.indexOf("\r");i>-1&&i<j;i=d.indexOf("\r",i+1),j++);return{start:h,end:j}},J=function(a,b,c){var d=a.createTextRange();d.collapse(!0);var e=d.duplicate(),f=0,g=a.value;for(var h=g.indexOf("\n");h>-1&&h<b;h=g.indexOf("\n",h+1))++f;d.move("character",b-f);for(;h>-1&&h<c;h=g.indexOf("\n",h+1))++f;e.move("character",c-f),d.setEndPoint("EndToEnd",e),d.select()};a.defineMode("null",function(){return{token:function(a){a.skipToEnd()}}}),a.defineMIME("text/plain","null");return a}();CodeMirror.overlayParser=function(a,b,c){return{startState:function(){return{base:CodeMirror.startState(a),overlay:CodeMirror.startState(b),basePos:0,baseCur:null,overlayPos:0,overlayCur:null}},copyState:function(c){return{base:CodeMirror.copyState(a,c.base),overlay:CodeMirror.copyState(b,c.overlay),basePos:c.basePos,baseCur:null,overlayPos:c.overlayPos,overlayCur:null}},token:function(d,e){d.start==e.basePos&&(e.baseCur=a.token(d,e.base),e.basePos=d.pos),d.start==e.overlayPos&&(d.pos=d.start,e.overlayCur=b.token(d,e.overlay),e.overlayPos=d.pos),d.pos=Math.min(e.basePos,e.overlayPos),d.eol()&&(e.basePos=e.overlayPos=0);if(e.overlayCur==null)return e.baseCur;return e.baseCur!=null&&c?e.baseCur+" "+e.overlayCur:e.overlayCur},indent:function(b,c){return a.indent(b.base,c)},electricChars:a.electricChars}},CodeMirror.runMode=function(a,b,c){var d=CodeMirror.getMode({indentUnit:2},b),e=c.nodeType==1;if(e){var f=c,g=[];c=function(a,b){a=="\n"?g.push("<br>"):b?g.push('<span class="cm-'+CodeMirror.htmlEscape(b)+'">'+CodeMirror.htmlEscape(a)+"</span>"):g.push(CodeMirror.htmlEscape(a))}}var h=CodeMirror.splitLines(a),i=CodeMirror.startState(d);for(var j=0,k=h.length;j<k;++j){j&&c("\n");var l=new CodeMirror.StringStream(h[j]);while(!l.eol()){var m=d.token(l,i);c(l.current(),m),l.start=l.pos}}e&&(f.innerHTML=g.join(""))},CodeMirror.defineMode("javascript",function(a,b){function R(a,b){if(a=="variable"){v(b);return u()}}function Q(a,b){if(a=="variable"){v(b);return u(Q)}if(a=="(")return u(z(")"),x,I(R,")"),A,C,y)}function P(a){a!=")"&&u(D)}function O(a,b){if(a==";")return u(P);if(b=="in")return u(D);return u(D,B(";"),P)}function N(a,b){if(b=="in")return u(D);return u(E,O)}function M(a){if(a=="var")return u(K,O);if(a==";")return t(O);if(a=="variable")return u(N);return t(O)}function L(a,b){if(b=="=")return u(D,L);if(a==",")return u(K)}function K(a,b){if(a=="variable"){v(b);return u(L)}return u()}function J(a){if(a=="}")return u();return t(C,J)}function I(a,b){function c(d){if(d==",")return u(a,c);if(d==b)return u();return u(B(b))}return function(d){return d==b?u():t(a,c)}}function H(a){a=="variable"&&(s.marked="property");if(o.hasOwnProperty(a))return u(B(":"),D)}function G(a){if(a=="variable"){s.marked="property";return u()}}function F(a){if(a==":")return u(A,C);return t(E,B(";"),A)}function E(a,b){if(a=="operator"&&/\+\+|--/.test(b))return u(E);if(a=="operator")return u(D);if(a!=";"){if(a=="(")return u(z(")"),I(D,")"),A,E);if(a==".")return u(G,E);if(a=="[")return u(z("]"),D,B("]"),A,E)}}function D(a){if(o.hasOwnProperty(a))return u(E);if(a=="function")return u(Q);if(a=="keyword c")return u(D);if(a=="(")return u(z(")"),D,B(")"),A,E);if(a=="operator")return u(D);if(a=="[")return u(z("]"),I(D,"]"),A,E);if(a=="{")return u(z("}"),I(H,"}"),A,E);return u()}function C(a){if(a=="var")return u(z("vardef"),K,B(";"),A);if(a=="keyword a")return u(z("form"),D,C,A);if(a=="keyword b")return u(z("form"),C,A);if(a=="{")return u(z("}"),J,A);if(a==";")return u();if(a=="function")return u(Q);if(a=="for")return u(z("form"),B("("),z(")"),M,B(")"),A,C,A);if(a=="variable")return u(z("stat"),F);if(a=="switch")return u(z("form"),D,z("}","switch"),B("{"),J,A,A);if(a=="case")return u(D,B(":"));if(a=="default")return u(B(":"));if(a=="catch")return u(z("form"),x,B("("),R,B(")"),C,A,y);return t(z("stat"),D,B(";"),A)}function B(a){return function(b){return b==a?u():a==";"?t():u(arguments.callee)}}function A(){var a=s.state;a.lexical.prev&&(a.lexical.type==")"&&(a.indented=a.lexical.indented),a.lexical=a.lexical.prev)}function z(a,b){var c=function(){var c=s.state;c.lexical=new p(c.indented,s.stream.column(),a,null,c.lexical,b)};c.lex=!0;return c}function y(){s.state.localVars=s.state.context.vars,s.state.context=s.state.context.prev}function x(){s.state.context||(s.state.localVars=w),s.state.context={prev:s.state.context,vars:s.state.localVars}}function v(a){var b=s.state;if(b.context){s.marked="def";for(var c=b.localVars;c;c=c.next)if(c.name==a)return;b.localVars={name:a,next:b.localVars}}}function u(){t.apply(null,arguments);return!0}function t(){for(var a=arguments.length-1;a>=0;a--)s.cc.push(arguments[a])}function r(a,b,c,e,f){var g=a.cc;s.state=a,s.stream=f,s.marked=null,s.cc=g,a.lexical.hasOwnProperty("align")||(a.lexical.align=!0);for(;;){var h=g.length?g.pop():d?D:C;if(h(c,e)){while(g.length&&g[g.length-1].lex)g.pop()();if(s.marked)return s.marked;if(c=="variable"&&q(a,e))return"variable-2";return b}}}function q(a,b){for(var c=a.localVars;c;c=c.next)if(c.name==b)return!0}function p(a,b,c,d,e,f){this.indented=a,this.column=b,this.type=c,this.prev=e,this.info=f,d!=null&&(this.align=d)}function n(a,b){var c=!1,d;while(d=a.next()){if(d=="/"&&c){b.tokenize=l;break}c=d=="*"}return k("comment","comment")}function m(a){return function(b,c){h(b,a)||(c.tokenize=l);return k("string","string")}}function l(a,b){var c=a.next();if(c=='"'||c=="'")return g(a,b,m(c));if(/[\[\]{}\(\),;\:\.]/.test(c))return k(c);if(c=="0"&&a.eat(/x/i)){a.eatWhile(/[\da-f]/i);return k("number","atom")}if(/\d/.test(c)){a.match(/^\d*(?:\.\d*)?(?:e[+\-]?\d+)?/);return k("number","atom")}if(c=="/"){if(a.eat("*"))return g(a,b,n);if(a.eat("/")){a.skipToEnd();return k("comment","comment")}if(b.reAllowed){h(a,"/"),a.eatWhile(/[gimy]/);return k("regexp","string")}a.eatWhile(f);return k("operator",null,a.current())}if(f.test(c)){a.eatWhile(f);return k("operator",null,a.current())}a.eatWhile(/[\w\$_]/);var d=a.current(),i=e.propertyIsEnumerable(d)&&e[d];return i?k(i.type,i.style,d):k("variable","variable",d)}function k(a,b,c){i=a,j=c;return b}function h(a,b){var c=!1,d;while((d=a.next())!=null){if(d==b&&!c)return!1;c=!c&&d=="\\"}return c}function g(a,b,c){b.tokenize=c;return c(a,b)}var c=a.indentUnit,d=b.json,e=function(){function a(a){return{type:a,style:"keyword"}}var b=a("keyword a"),c=a("keyword b"),d=a("keyword c"),e=a("operator"),f={type:"atom",style:"atom"};return{"if":b,"while":b,"with":b,"else":c,"do":c,"try":c,"finally":c,"return":d,"break":d,"continue":d,"new":d,"delete":d,"throw":d,"var":a("var"),"function":a("function"),"catch":a("catch"),"for":a("for"),"switch":a("switch"),"case":a("case"),"default":a("default"),"in":e,"typeof":e,"instanceof":e,"true":f,"false":f,"null":f,"undefined":f,NaN:f,Infinity:f}}(),f=/[+\-*&%=<>!?|]/,i,j,o={atom:!0,number:!0,variable:!0,string:!0,regexp:!0},s={state:null,column:null,marked:null,cc:null},w={name:"this",next:{name:"arguments"}};A.lex=!0;return{startState:function(a){return{tokenize:l,reAllowed:!0,cc:[],lexical:new p((a||0)-c,0,"block",!1),localVars:null,context:null,indented:0}},token:function(a,b){a.sol()&&(b.lexical.hasOwnProperty("align")||(b.lexical.align=!1),b.indented=a.indentation());if(a.eatSpace())return null;var c=b.tokenize(a,b);if(i=="comment")return c;b.reAllowed=i=="operator"||i=="keyword c"||i.match(/^[\[{}\(,;:]$/);return r(b,c,i,j,a)},indent:function(a,b){if(a.tokenize!=l)return 0;var d=b&&b.charAt(0),e=a.lexical,f=e.type,g=d==f;return f=="vardef"?e.indented+4:f=="form"&&d=="{"?e.indented:f=="stat"||f=="form"?e.indented+c:e.info=="switch"&&!g?e.indented+(/^(?:case|default)\b/.test(b)?c:2*c):e.align?e.column+(g?0:1):e.indented+(g?0:c)},electricChars:":{}"}}),CodeMirror.defineMIME("text/javascript","javascript"),CodeMirror.defineMIME("application/json",{name:"javascript",json:!0}),CodeMirror.defineMode("xml",function(a,b){function v(a){if(a=="word"&&d.allowUnquoted){m="string";return o()}if(a=="string")return o();return n()}function u(a){if(a=="word"){m="attribute";return o(u)}if(a=="equals")return o(v,u);return n()}function t(a){return function(b){a&&(m="error");if(b=="endTag")return o();return n()}}function s(a){return function(b){if(b=="selfcloseTag"||b=="endTag"&&d.autoSelfClosers.hasOwnProperty(l.tagName.toLowerCase()))return o();if(b=="endTag"){p(l.tagName,a);return o()}return o()}}function r(a){if(a=="openTag"){l.tagName=f;return o(u,s(l.startOfLine))}if(a=="closeTag"){var b=!1;l.context?(b=l.context.tagName!=f,q()):b=!0,b&&(m="error");return o(t(b))}if(a=="string"){(!l.context||l.context.name!="!cdata")&&p("!cdata"),l.tokenize==h&&q();return o()}return o()}function q(){l.context&&(l.context=l.context.prev)}function p(a,b){var c=d.doNotIndent.hasOwnProperty(a)||l.context&&l.context.noIndent;l.context={prev:l.context,tagName:a,indent:l.indented,startOfLine:b,noIndent:c}}function o(){n.apply(null,arguments);return!0}function n(){for(var a=arguments.length-1;a>=0;a--)l.cc.push(arguments[a])}function k(a,b){return function(c,d){while(!c.eol()){if(c.match(b)){d.tokenize=h;break}c.next()}return a}}function j(a){return function(b,c){while(!b.eol())if(b.next()==a){c.tokenize=i;break}return"string"}}function i(a,b){var c=a.next();if(c==">"||c=="/"&&a.eat(">")){b.tokenize=h,g=c==">"?"endTag":"selfcloseTag";return"tag"}if(c=="="){g="equals";return null}if(/[\'\"]/.test(c)){b.tokenize=j(c);return b.tokenize(a,b)}a.eatWhile(/[^\s\u00a0=<>\"\'\/?]/);return"word"}function h(a,b){function c(c){b.tokenize=c;return c(a,b)}var d=a.next();if(d=="<"){if(a.eat("!")){if(a.eat("["))return a.match("CDATA[")?c(k("atom","]]>")):null;if(a.match("--"))return c(k("comment","-->"));if(a.match("DOCTYPE")){a.eatWhile(/[\w\._\-]/);return c(k("meta",">"))}return null}if(a.eat("?")){a.eatWhile(/[\w\._\-]/),b.tokenize=k("meta","?>");return"meta"}g=a.eat("/")?"closeTag":"openTag",a.eatSpace(),f="";var e;while(e=a.eat(/[^\s\u00a0=<>\"\'\/?]/))f+=e;b.tokenize=i;return"tag"}if(d=="&"){a.eatWhile(/[^;]/),a.eat(";");return"atom"}a.eatWhile(/[^&<]/);return null}var c=a.indentUnit,d=b.htmlMode?{autoSelfClosers:{br:!0,img:!0,hr:!0,link:!0,input:!0,meta:!0,col:!0,frame:!0,base:!0,area:!0},doNotIndent:{pre:!0,"!cdata":!0},allowUnquoted:!0}:{autoSelfClosers:{},doNotIndent:{"!cdata":!0},allowUnquoted:!1},e=b.alignCDATA,f,g,l,m;return{startState:function(){return{tokenize:h,cc:[],indented:0,startOfLine:!0,tagName:null,context:null}},token:function(a,b){a.sol()&&(b.startOfLine=!0,b.indented=a.indentation());if(a.eatSpace())return null;m=g=f=null;var c=b.tokenize(a,b);if((c||g)&&c!="xml-comment"){l=b;for(;;){var d=b.cc.pop()||r;if(d(g||c))break}}b.startOfLine=!1;return m||c},indent:function(a,b){var d=a.context;if(d&&d.noIndent)return 0;if(e&&/<!\[CDATA\[/.test(b))return 0;d&&/^<\//.test(b)&&(d=d.prev);while(d&&!d.startOfLine)d=d.prev;return d?d.indent+c:0},compareStates:function(a,b){if(a.indented!=b.indented||a.tagName!=b.tagName)return!1;for(var c=a.context,d=b.context;;c=c.prev,d=d.prev){if(!c||!d)return c==d;if(c.tagName!=d.tagName)return!1}},electricChars:"/"}}),CodeMirror.defineMIME("application/xml","xml"),CodeMirror.defineMIME("text/html",{name:"xml",htmlMode:!0}),CodeMirror.defineMode("css",function(a){function h(a){return function(b,c){var f=!1,g;while((g=b.next())!=null){if(g==a&&!f)break;f=!f&&g=="\\"}f||(c.tokenize=e);return d("string","string")}}function g(a,b){var c=0,f;while((f=a.next())!=null){if(c>=2&&f==">"){b.tokenize=e;break}c=f=="-"?c+1:0}return d("comment","comment")}function f(a,b){var c=!1,f;while((f=a.next())!=null){if(c&&f=="/"){b.tokenize=e;break}c=f=="*"}return d("comment","comment")}function e(a,b){var c=a.next();if(c=="@"){a.eatWhile(/\w/);return d("meta",a.current())}if(c=="/"&&a.eat("*")){b.tokenize=f;return f(a,b)}if(c=="<"&&a.eat("!")){b.tokenize=g;return g(a,b)}if(c=="=")d(null,"compare");else{if(c!="~"&&c!="|"||!a.eat("=")){if(c=='"'||c=="'"){b.tokenize=h(c);return b.tokenize(a,b)}if(c=="#"){a.eatWhile(/\w/);return d("atom","hash")}if(c=="!"){a.match(/^\s*\w*/);return d("keyword","important")}if(/\d/.test(c)){a.eatWhile(/[\w.%]/);return d("number","unit")}if(/[,.+>*\/]/.test(c))return d(null,"select-op");if(/[;{}:\[\]]/.test(c))return d(null,c);a.eatWhile(/[\w\\\-_]/);return d("variable","variable")}return d(null,"compare")}}function d(a,b){c=b;return a}var b=a.indentUnit,c;return{startState:function(a){return{tokenize:e,baseIndent:a||0,stack:[]}},token:function(a,b){if(a.eatSpace())return null;var d=b.tokenize(a,b),e=b.stack[b.stack.length-1];if(c=="hash"&&e=="rule")d="atom";else if(d=="variable")if(e=="rule")d="number";else if(!e||e=="@media{")d="tag";e=="rule"&&/^[\{\};]$/.test(c)&&b.stack.pop(),c=="{"?e=="@media"?b.stack[b.stack.length-1]="@media{":b.stack.push("{"):c=="}"?b.stack.pop():c=="@media"?b.stack.push("@media"):e=="{"&&c!="comment"&&b.stack.push("rule");return d},indent:function(a,c){var d=a.stack.length;/^\}/.test(c)&&(d-=a.stack[a.stack.length-1]=="rule"?2:1);return a.baseIndent+d*b},electricChars:"}"}}),CodeMirror.defineMIME("text/css","css"),CodeMirror.defineMode("htmlmixed",function(a,b){function i(a,b){if(a.match(/^<\/\s*style\s*>/i,!1)){b.token=f,b.localState=null;return f(a,b)}return g(a,/<\/\s*style\s*>/,e.token(a,b.localState))}function h(a,b){if(a.match(/^<\/\s*script\s*>/i,!1)){b.token=f,b.curState=null;return f(a,b)}return g(a,/<\/\s*script\s*>/,d.token(a,b.localState))}function g(a,b,c){var d=a.current(),e=d.search(b);e>-1&&a.backUp(d.length-e);return c}function f(a,b){var f=c.token(a,b.htmlState);f=="tag"&&a.current()==">"&&b.htmlState.context&&(/^script$/i.test(b.htmlState.context.tagName)?(b.token=h,b.localState=d.startState(c.indent(b.htmlState,""))):/^style$/i.test(b.htmlState.context.tagName)&&(b.token=i,b.localState=e.startState(c.indent(b.htmlState,""))));return f}var c=CodeMirror.getMode(a,{name:"xml",htmlMode:!0}),d=CodeMirror.getMode(a,"javascript"),e=CodeMirror.getMode(a,"css");return{startState:function(){var a=c.startState();return{token:f,localState:null,htmlState:a}},copyState:function(a){if(a.localState)var b=CodeMirror.copyState(a.token==i?e:d,a.localState);return{token:a.token,localState:b,htmlState:CodeMirror.copyState(c,a.htmlState)}},token:function(a,b){return b.token(a,b)},indent:function(a,b){return a.token==f||/^\s*<\//.test(b)?c.indent(a.htmlState,b):a.token==h?d.indent(a.localState,b):e.indent(a.localState,b)},electricChars:"/{}:"}}),CodeMirror.defineMIME("text/html","htmlmixed"),CodeMirror.defineMode("clike",function(a,b){function u(a){return a.context=a.context.prev}function t(a,b,c){return a.context=new s(a.indented,b,c,null,a.context)}function s(a,b,c,d,e){this.indented=a,this.column=b,this.type=c,this.align=d,this.prev=e}function r(a,b){var c=!1,d;while(d=a.next()){if(d=="/"&&c){b.tokenize=o;break}c=d=="*"}return n("comment","comment")}function q(a,b){var c;while((c=a.next())!=null)if(c=='"'&&!a.eat('"')){b.tokenize=o;break}return n("string","string")}function p(a){return function(b,c){var d=!1,e,f=!1;while((e=b.next())!=null){if(e==a&&!d){f=!0;break}d=!d&&e=="\\"}if(f||!d&&!g)c.tokenize=o;return n("string","string")}}function o(a,b){var c=a.next();if(c=='"'||c=="'")return l(a,b,p(c));if(/[\[\]{}\(\),;\:\.]/.test(c))return n(c);if(c=="#"&&f&&b.startOfLine){a.skipToEnd();return n("directive","meta")}if(/\d/.test(c)){a.eatWhile(/[\w\.]/);return n("number","number")}if(c=="/"){if(a.eat("*"))return l(a,b,r);if(a.eat("/")){a.skipToEnd();return n("comment","comment")}a.eatWhile(k);return n("operator")}if(k.test(c)){a.eatWhile(k);return n("operator")}if(j&&c=="@"&&a.eat('"'))return l(a,b,q);if(i&&c=="@"){a.eatWhile(/[\w\$_]/);return n("annotation","meta")}if(h&&c=="$"){a.eatWhile(/[\w\$_]/);return n("word","variable")}a.eatWhile(/[\w\$_]/);var g=a.current();if(d&&d.propertyIsEnumerable(g))return n("keyword","keyword");if(e&&e.propertyIsEnumerable(g))return n("atom","atom");return n("word")}function n(a,b){m=a;return b}function l(a,b,c){b.tokenize=c;return c(a,b)}var c=a.indentUnit,d=b.keywords,e=b.atoms,f=b.useCPP,g=b.multiLineStrings,h=b.$vars,i=b.atAnnotations,j=b.atStrings,k=/[+\-*&%=<>!?|]/,m;return{startState:function(a){return{tokenize:o,context:new s((a||0)-c,0,"top",!1),indented:0,startOfLine:!0}},token:function(a,b){var c=b.context;a.sol()&&(c.align==null&&(c.align=!1),b.indented=a.indentation(),b.startOfLine=!0);if(a.eatSpace())return null;var d=b.tokenize(a,b);if(m=="comment")return d;c.align==null&&(c.align=!0),m!=";"&&m!=":"||c.type!="statement"?m=="{"?t(b,a.column(),"}"):m=="["?t(b,a.column(),"]"):m=="("?t(b,a.column(),")"):m=="}"?(c.type=="statement"&&(c=u(b)),c.type=="}"&&(c=u(b)),c.type=="statement"&&(c=u(b))):m==c.type?u(b):(c.type=="}"||c.type=="top")&&t(b,a.column(),"statement"):u(b),b.startOfLine=!1;return d},indent:function(a,b){if(a.tokenize!=o)return 0;var d=b&&b.charAt(0),e=a.context,f=d==e.type;return e.type=="statement"?e.indented+(d=="{"?0:c):e.align?e.column+(f?0:1):e.indented+(f?0:c)},electricChars:"{}"}}),function(){function a(a){var b={},c=a.split(" ");for(var d=0;d<c.length;++d)b[c[d]]=!0;return b}var b="auto if break int case long char register continue return default short do sizeof double static else struct entry switch extern typedef float union for unsigned goto while enum void const signed volatile";CodeMirror.defineMIME("text/x-csrc",{name:"clike",useCPP:!0,keywords:a(b),atoms:a("null")}),CodeMirror.defineMIME("text/x-c++src",{name:"clike",useCPP:!0,keywords:a(b+" asm dynamic_cast namespace reinterpret_cast try bool explicit new "+"static_cast typeid catch operator template typename class friend private "+"this using const_cast inline public throw virtual delete mutable protected "+"wchar_t"),atoms:a("true false null")}),CodeMirror.defineMIME("text/x-java",{name:"clike",atAnnotations:!0,keywords:a("abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while"),atoms:a("true false null")}),CodeMirror.defineMIME("text/x-csharp",{name:"clike",atAnnotations:!0,atStrings:!0,keywords:a("abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new object operator out override params private protected public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw try typeof uint ulong unchecked unsafe ushort using virtual void volatile while add alias ascending descending dynamic from get global group into join let orderby partial remove select set value var yield"),atoms:a("true false null")})}(),CodeMirror.defineMode("python",function(a){function w(a,c){r=null;var d=c.tokenize(a,c),e=a.current();if(e==="."){d=c.tokenize(a,c),e=a.current();return d==="variable"?"variable":b}if(e==="@"){d=c.tokenize(a,c),e=a.current();return d==="variable"||e==="@staticmethod"||e==="@classmethod"?"meta":b}if(e==="pass"||e==="return")c.dedent+=1;(e===":"&&!c.lambda&&c.scopes[0].type=="py"||r==="indent")&&u(a,c);var f="[({".indexOf(e);f!==-1&&u(a,c,"])}".slice(f,f+1));if(r==="dedent"&&v(a,c))return b;f="])}".indexOf(e);if(f!==-1&&v(a,c))return b;c.dedent>0&&a.eol()&&c.scopes[0].type=="py"&&(c.scopes.length>1&&c.scopes.shift(),c.dedent-=1);return d}function v(a,b){if(b.scopes.length!=1){if(b.scopes[0].type==="py"){var c=a.indentation(),d=-1;for(var e=0;e<b.scopes.length;++e)if(c===b.scopes[e].offset){d=e;break}if(d===-1)return!0;while(b.scopes[0].offset!==c)b.scopes.shift();return!1}b.scopes.shift();return!1}}function u(b,c,d){d=d||"py";var e=0;if(d==="py"){for(var f=0;f<c.scopes.length;++f)if(c.scopes[f].type==="py"){e=c.scopes[f].offset+a.indentUnit;break}}else e=b.column()+b.current().length;c.scopes.unshift({offset:e,type:d})}function t(c){while("rub".indexOf(c[0].toLowerCase())>=0)c=c.substr(1);var d=new RegExp(c),e=c.length==1,f="string";return function(c,g){while(!c.eol()){c.eatWhile(/[^'"\\]/);if(c.eat("\\")){c.next();if(e&&c.eol())return f}else{if(c.match(d)){g.tokenize=s;return f}c.eat(/['"]/)}}e&&(a.mode.singleLineStringErrors?f=b:g.tokenize=s);return f}}function s(a,c){if(a.sol()){var k=c.scopes[0].offset;if(a.eatSpace()){var l=a.indentation();l>k?r="indent":l<k&&(r="dedent");return null}k>0&&v(a,c)}if(a.eatSpace())return null;var m=a.peek();if(m==="#"){a.skipToEnd();return"comment"}if(a.match(/^[0-9\.]/,!1)){var n=!1;a.match(/^\d*\.\d+(e[\+\-]?\d+)?/i)&&(n=!0),a.match(/^\d+\.\d*/)&&(n=!0),a.match(/^\.\d+/)&&(n=!0);if(n){a.eat(/J/i);return"number"}var s=!1;a.match(/^0x[0-9a-f]+/i)&&(s=!0),a.match(/^0b[01]+/i)&&(s=!0),a.match(/^0o[0-7]+/i)&&(s=!0),a.match(/^[1-9]\d*(e[\+\-]?\d+)?/)&&(a.eat(/J/i),s=!0),a.match(/^0(?![\dx])/i)&&(s=!0);if(s){a.eat(/L/i);return"number"}}if(a.match(o)){c.tokenize=t(a.current());return c.tokenize(a,c)}if(a.match(h)||a.match(g))return null;if(a.match(f)||a.match(d)||a.match(j))return"operator";if(a.match(e))return null;if(a.match(q))return"builtin";if(a.match(p))return"keyword";if(a.match(i))return"variable";a.next();return b}function c(a){return new RegExp("^(("+a.join(")|(")+"))\\b")}var b="error",d=new RegExp("^[\\+\\-\\*/%&|\\^~<>!]"),e=new RegExp("^[\\(\\)\\[\\]\\{\\}@,:`=;\\.]"),f=new RegExp("^((==)|(!=)|(<=)|(>=)|(<>)|(<<)|(>>)|(//)|(\\*\\*))"),g=new RegExp("^((\\+=)|(\\-=)|(\\*=)|(%=)|(/=)|(&=)|(\\|=)|(\\^=))"),h=new RegExp("^((//=)|(>>=)|(<<=)|(\\*\\*=))"),i=new RegExp("^[_A-Za-z][_A-Za-z0-9]*"),j=c(["and","or","not","is","in"]),k=["as","assert","break","class","continue","def","del","elif","else","except","finally","for","from","global","if","import","lambda","pass","raise","return","try","while","with","yield"],l=["bool","classmethod","complex","dict","enumerate","float","frozenset","int","list","object","property","reversed","set","slice","staticmethod","str","super","tuple","type"],m={types:["basestring","buffer","file","long","unicode","xrange"],keywords:["exec","print"]},n={types:["bytearray","bytes","filter","map","memoryview","open","range","zip"],keywords:["nonlocal"]};if(!a.mode.version||parseInt(a.mode.version,10)!==3){k=k.concat(m.keywords),l=l.concat(m.types);var o=new RegExp("^(([rub]|(ur)|(br))?('{3}|\"{3}|['\"]))","i")}else{k=k.concat(n.keywords),l=l.concat(n.types);var o=new RegExp("^(([rb]|(br))?('{3}|\"{3}|['\"]))","i")}var p=c(k),q=c(l),r=null,x={startState:function(a){return{tokenize:s,scopes:[{offset:a||0,type:"py"}],lastToken:null,lambda:!1,dedent:0}},token:function(a,b){var c=w(a,b);b.lastToken={style:c,content:a.current()},a.eol()&&a.lambda&&(b.lambda=!1);return c},indent:function(a,b){if(a.tokenize!=s)return 0;return a.scopes[0].offset}};return x}),CodeMirror.defineMIME("text/x-python","python"),function(){function a(a){var b={},c=a.split(" ");for(var d=0;d<c.length;++d)b[c[d]]=!0;return b}var b=a("abstract and array as break case catch cfunction class clone const continue declare default do else elseif enddeclare endfor endforeach endif endswitch endwhile extends final for foreach function global goto if implements interface instanceof namespace new or private protected public static switch throw try use var while xor return"),c={name:"clike",keywords:b,multiLineStrings:!0,$vars:!0,atoms:a("true false null")};CodeMirror.defineMode("php",function(a,b){function h(a,b){if(b.curMode==d){var c=d.token(a,b.curState);c=="meta"&&/^<\?/.test(a.current())?(b.curMode=g,b.curState=b.php,b.curClose=/^\?>/):c=="tag"&&a.current()==">"&&b.curState.context&&(/^script$/i.test(b.curState.context.tagName)?(b.curMode=e,b.curState=e.startState(d.indent(b.curState,"")),b.curClose=/^<\/\s*script\s*>/i):/^style$/i.test(b.curState.context.tagName)&&(b.curMode=f,b.curState=f.startState(d.indent(b.curState,"")),b.curClose=/^<\/\s*style\s*>/i));return c}if(a.match(b.curClose,!1)){b.curMode=d,b.curState=b.html,b.curClose=null;return h(a,b)}return b.curMode.token(a,b.curState)}var d=CodeMirror.getMode(a,"text/html"),e=CodeMirror.getMode(a,"text/javascript"),f=CodeMirror.getMode(a,"text/css"),g=CodeMirror.getMode(a,c);return{startState:function(){var a=d.startState();return{html:a,php:g.startState(),curMode:d,curState:a,curClose:null}},copyState:function(a){var b=a.html,c=CodeMirror.copyState(d,b),e=a.php,f=CodeMirror.copyState(g,e),h;a.curState==b?h=c:a.curState==e?h=f:h=CodeMirror.copyState(a.curMode,a.curState);return{html:c,php:f,curMode:a.curMode,curState:h,curClose:a.curClose}},token:h,indent:function(a,b){if(a.curMode!=g&&/^\s*<\//.test(b)||a.curMode==g&&/^\?>/.test(b))return d.indent(a.html,b);return a.curMode.indent(a.curState,b)},electricChars:"/{}:"}}),CodeMirror.defineMIME("application/x-httpd-php","php"),CodeMirror.defineMIME("text/x-php",c)}(),CodeMirror.defineMode("haskell",function(a,b){function p(a,b){if(a.eat("\\"))return c(a,b,o);a.next(),b(m);return"error"}function o(a,b){while(!a.eol()){var c=a.next();if(c=='"'){b(m);return"string"}if(c=="\\"){if(a.eol()||a.eat(l)){b(p);return"string"}a.eat("&")||a.next()}}b(m);return"error"}function n(a,b){if(b==0)return m;return function(c,d){var e=b;while(!c.eol()){var f=c.next();if(f=="{"&&c.eat("-"))++e;else if(f=="-"&&c.eat("}")){--e;if(e==0){d(m);return a}}}d(n(a,e));return a}}function m(a,b){if(a.eatWhile(l))return null;var m=a.next();if(k.test(m)){if(m=="{"&&a.eat("-")){var p="comment";a.eat("#")&&(p="meta");return c(a,b,n(p,1))}return null}if(m=="'"){a.eat("\\")?a.next():a.next();if(a.eat("'"))return"string";return"error"}if(m=='"')return c(a,b,o);if(e.test(m)){a.eatWhile(i);if(a.eat("."))return"qualifier";return"variable-2"}if(d.test(m)){a.eatWhile(i);return"variable"}if(f.test(m)){if(m=="0"){if(a.eat(/[xX]/)){a.eatWhile(g);return"integer"}if(a.eat(/[oO]/)){a.eatWhile(h);return"number"}}a.eatWhile(f);var p="number";a.eat(".")&&(p="number",a.eatWhile(f)),a.eat(/[eE]/)&&(p="number",a.eat(/[-+]/),a.eatWhile(f));return p}if(j.test(m)){if(m=="-"&&a.eat(/-/)){a.eatWhile(/-/);if(!a.eat(j)){a.skipToEnd();return"comment"}}var p="variable";m==":"&&(p="variable-2"),a.eatWhile(j);return p}return"error"}function c(a,b,c){b(c);return c(a,b)}var d=/[a-z_]/,e=/[A-Z]/,f=/[0-9]/,g=/[0-9A-Fa-f]/,h=/[0-7]/,i=/[a-z_A-Z0-9']/,j=/[-!#$%&*+.\/<=>?@\\^|~:]/,k=/[(),;[\]`{}]/,l=/[ \t\v\f]/,q=function(){function b(b){return function(){for(var c=0;c<arguments.length;c++)a[arguments[c]]=b}}var a={};b("keyword")("case","class","data","default","deriving","do","else","foreign","if","import","in","infix","infixl","infixr","instance","let","module","newtype","of","then","type","where","_"),b("keyword")("..",":","::","=","\\",'"',"<-","->","@","~","=>"),b("builtin")("!!","$!","$","&&","+","++","-",".","/","/=","<","<=","=<<","==",">",">=",">>",">>=","^","^^","||","*","**"),b("builtin")("Bool","Bounded","Char","Double","EQ","Either","Enum","Eq","False","FilePath","Float","Floating","Fractional","Functor","GT","IO","IOError","Int","Integer","Integral","Just","LT","Left","Maybe","Monad","Nothing","Num","Ord","Ordering","Rational","Read","ReadS","Real","RealFloat","RealFrac","Right","Show","ShowS","String","True"),b("builtin")("abs","acos","acosh","all","and","any","appendFile","asTypeOf","asin","asinh","atan","atan2","atanh","break","catch","ceiling","compare","concat","concatMap","const","cos","cosh","curry","cycle","decodeFloat","div","divMod","drop","dropWhile","either","elem","encodeFloat","enumFrom","enumFromThen","enumFromThenTo","enumFromTo","error","even","exp","exponent","fail","filter","flip","floatDigits","floatRadix","floatRange","floor","fmap","foldl","foldl1","foldr","foldr1","fromEnum","fromInteger","fromIntegral","fromRational","fst","gcd","getChar","getContents","getLine","head","id","init","interact","ioError","isDenormalized","isIEEE","isInfinite","isNaN","isNegativeZero","iterate","last","lcm","length","lex","lines","log","logBase","lookup","map","mapM","mapM_","max","maxBound","maximum","maybe","min","minBound","minimum","mod","negate","not","notElem","null","odd","or","otherwise","pi","pred","print","product","properFraction","putChar","putStr","putStrLn","quot","quotRem","read","readFile","readIO","readList","readLn","readParen","reads","readsPrec","realToFrac","recip","rem","repeat","replicate","return","reverse","round","scaleFloat","scanl","scanl1","scanr","scanr1","seq","sequence","sequence_","show","showChar","showList","showParen","showString","shows","showsPrec","significand","signum","sin","sinh","snd","span","splitAt","sqrt","subtract","succ","sum","tail","take","takeWhile","tan","tanh","toEnum","toInteger","toRational","truncate","uncurry","undefined","unlines","until","unwords","unzip","unzip3","userError","words","writeFile","zip","zip3","zipWith","zipWith3");return a}();return{startState:function(){return{f:m}},copyState:function(a){return{f:a.f}},token:function(a,b){var c=b.f(a,function(a){b.f=a}),d=a.current();return d in q?q[d]:c}}}),CodeMirror.defineMIME("text/x-haskell","haskell"),CodeMirror.defineMode("diff",function(){return{token:function(a){var b=a.next();a.skipToEnd();if(b=="+")return"plus";if(b=="-")return"minus";if(b=="@")return"rangeinfo"}}}),CodeMirror.defineMIME("text/x-diff","diff"),CodeMirror.defineMode("stex",function(a,b){function l(a,b){var c=a.peek();if(c=="{"||c=="["){var f=d(b),g=f.openBracket(c);a.eat(c),i(b,j);return"bracket"}if(/[ \t\r]/.test(c)){a.eat(c);return null}i(b,j),f=d(b),f&&e(b);return j(a,b)}function k(a,b){a.skipToEnd(),i(b,j);return"comment"}function j(a,b){if(a.match(/^\\[a-z]+/)){var e=a.current();e=e.substr(1,e.length-1);var g=h[e];typeof g=="undefined"&&(g=h.DEFAULT),g=new g,c(b,g),i(b,l);return g.style}var j=a.next();if(j=="%"){i(b,k);return"comment"}if(j=="}"||j=="]"){g=d(b);if(g)g.closeBracket(j),i(b,l);else return"error";return"bracket"}if(j=="{"||j=="["){g=h.DEFAULT,g=new g,c(b,g);return"bracket"}if(/\d/.test(j)){a.eatWhile(/[\w.%]/);return"atom"}a.eatWhile(/[\w-_]/);return f(b)}function i(a,b){a.f=b}function g(a,b,c,d){return function(){this.name=a,this.bracketNo=0,this.style=b,this.styles=d,this.brackets=c,this.styleIdentifier=function(a){return this.bracketNo<=this.styles.length?this.styles[this.bracketNo-1]:null},this.openBracket=function(a){this.bracketNo++;return"bracket"},this.closeBracket=function(a){}}}function f(a){var b=a.cmdState;for(var c=b.length-1;c>=0;c--){var d=b[c];if(d.name=="DEFAULT")continue;return d.styleIdentifier()}return null}function e(a){if(a.cmdState.length>0){var b=a.cmdState.pop();b.closeBracket()}}function d(a){return a.cmdState.length>0?a.cmdState[a.cmdState.length-1]:null}function c(a,b){a.cmdState.push(b)}var h=[];h.importmodule=g("importmodule","tag","{[",["string","builtin"]),h.documentclass=g("documentclass","tag","{[",["","atom"]),h.usepackage=g("documentclass","tag","[",["atom"]),h.begin=g("documentclass","tag","[",["atom"]),h.end=g("documentclass","tag","[",["atom"]),h.DEFAULT=function(){this.name="DEFAULT",this.style="tag",this.styleIdentifier=function(a){},this.openBracket=function(a){},this.closeBracket=function(a){}};return{startState:function(){return{f:j,cmdState:[]}},copyState:function(a){return{f:a.f,cmdState:a.cmdState.slice(0,a.cmdState.length)}},token:function(a,b){var c=b.f(a,b),d=a.current();return c}}}),CodeMirror.defineMIME("text/x-stex","stex"),CodeMirror.defineMode("smalltalk",function(a,b){function m(a){return a.context=a.context.prev}function l(a,b,c){return a.context=new k(a.indented,b,c,null,a.context)}function k(a,b,c,d,e){this.indented=a,this.column=b,this.type=c,this.align=d,this.prev=e}function j(a){return function(b,c){var d,e=!1;while((d=b.next())!=null)if(d==a){e=!0;break}e&&(c.tokenize=h);return g("comment","comment")}}function i(a){return function(b,c){var d=!1,e,f=!1;while((e=b.next())!=null){if(e==a&&!d){f=!0;break}d=!d&&e=="\\"}if(f||!d)c.tokenize=h;return g("string","string")}}function h(a,b){var d=a.next();if(d=='"')return e(a,b,j(d));if(d=="'")return e(a,b,i(d));if(d=="#"){a.eatWhile(/[\w\$_]/);return g("string","string")}if(/\d/.test(d)){a.eatWhile(/[\w\.]/);return g("number","number")}if(/[\[\]()]/.test(d))return g(d,null);a.eatWhile(/[\w\$_]/);if(c&&c.propertyIsEnumerable(a.current()))return g("keyword","keyword");return g("word","variable")}function g(a,b){f=a;return b}function e(a,b,c){b.tokenize=c;return c(a,b)}var c={"true":1,"false":1,nil:1,self:1,"super":1,thisContext:1},d=a.indentUnit,f;return{startState:function(a){return{tokenize:h,context:new k((a||0)-d,0,"top",!1),indented:0,startOfLine:!0}},token:function(a,b){var c=b.context;a.sol()&&(c.align==null&&(c.align=!1),b.indented=a.indentation(),b.startOfLine=!0);if(a.eatSpace())return null;var d=b.tokenize(a,b);if(f=="comment")return d;c.align==null&&(c.align=!0),f=="["?l(b,a.column(),"]"):f=="("?l(b,a.column(),")"):f==c.type&&m(b),b.startOfLine=!1;return d},indent:function(a,b){if(a.tokenize!=h)return 0;var c=b&&b.charAt(0),e=a.context,f=c==e.type;return e.align?e.column+(f?0:1):e.indented+(f?0:d)},electricChars:"]"}}),CodeMirror.defineMIME("text/x-stsrc",{name:"smalltalk"}),CodeMirror.defineMode("rst",function(a,b){function D(a,b,c){if(a.eol()||a.eatSpace()){a.skipToEnd();return c}e(b,a);return null}function C(a,b){if(!h)return D(a,b,"verbatim");if(a.sol()){a.eatSpace()||e(b,a);return null}return h.token(a,b.ctx.local)}function B(a,b){return D(a,b,"comment")}function A(a,b){var c="body";if(!b.ctx.start||a.sol())return D(a,b,c);a.skipToEnd(),d(b);return c}function z(a,b){var d=null;if(a.match(k))d="directive";else if(a.match(l))d="hyperlink";else if(a.match(m))d="footnote";else if(a.match(n))d="citation";else{a.eatSpace();if(a.eol()){e(b,a);return null}a.skipToEnd(),c(b,B);return"comment"}c(b,A,{start:!0});return d}function y(a,b){function g(a){b.ctx.prev=a;return f}var d=a.next(),f=b.ctx.token;if(d!=b.ctx.ch)return g(d);if(/\s/.test(b.ctx.prev))return g(d);if(b.ctx.wide){d=a.next();if(d!=b.ctx.ch)return g(d)}if(!a.eol()&&!t.test(a.peek())){b.ctx.wide&&a.backUp(1);return g(d)}c(b,x),e(b,d);return f}function x(a,b){function n(b){return a.match(b)&&l(/\W/)&&m(/\W/)}function m(b){return a.eol()||a.match(b,!1)}function l(a){return f||!b.ctx.back||a.test(b.ctx.back)}var d,f,g;if(a.eat(/\\/)){d=a.next(),e(b,d);return null}f=a.sol();if(f&&(d=a.eat(j))){for(g=0;a.eat(d);g++);if(g>=3&&a.match(/^\s*$/)){e(b,null);return"section"}a.backUp(g+1)}if(f&&a.match(q)){a.eol()||c(b,z);return"directive-marker"}if(a.match(r)){if(!h)c(b,C);else{var k=h;c(b,C,{mode:k,local:k.startState()})}return"verbatim-marker"}if(f&&a.match(w,!1)){if(!i){c(b,C);return"verbatim-marker"}var k=i;c(b,C,{mode:k,local:k.startState()});return null}if(f&&(a.match(u)||a.match(v))){e(b,a);return"list"}if(n(o)){e(b,a);return"footnote"}if(n(p)){e(b,a);return"citation"}d=a.next();if(l(s)){if((d===":"||d==="|")&&a.eat(/\S/)){var t;d===":"?t="role":t="replacement",c(b,y,{ch:d,wide:!1,prev:null,token:t});return t}if(d==="*"||d==="`"){var x=d,A=!1;d=a.next(),d==x&&(A=!0,d=a.next());if(d&&!/\s/.test(d)){var t;x==="*"?t=A?"strong":"emphasis":t=A?"inline":"interpreted",c(b,y,{ch:x,wide:A,prev:null,token:t});return t}}}e(b,d);return null}function g(b){return f(b)?CodeMirror.getMode(a,b):null}function f(a){if(a){var b=CodeMirror.listModes();for(var c in b)if(b[c]==a)return!0}return!1}function e(a,b){if(b&&typeof b!="string"){var d=b.current();b=d[d.length-1]}c(a,x,{back:b})}function d(a,b){a.ctx=b||{}}function c(a,b,c){a.fn=b,d(a,c)}var h=g(b.verbatim),i=g("python"),j=/^[!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]/,k=/^\s*\w([-:.\w]*\w)?::(\s|$)/,l=/^\s*_[\w-]+:(\s|$)/,m=/^\s*\[(\d+|#)\](\s|$)/,n=/^\s*\[[A-Za-z][\w-]*\](\s|$)/,o=/^\[(\d+|#)\]_/,p=/^\[[A-Za-z][\w-]*\]_/,q=/^\.\.(\s|$)/,r=/^::\s*$/,s=/^[-\s"([{</:]/,t=/^[-\s`'")\]}>/:.,;!?\\_]/,u=/^\s*((\d+|[A-Za-z#])[.)]|\((\d+|[A-Z-a-z#])\))\s/,v=/^\s*[-\+\*]\s/,w=/^\s+(>>>|In \[\d+\]:)\s/;return{startState:function(){return{fn:x,ctx:{}}},copyState:function(a){return{fn:a.fn,ctx:a.ctx}},token:function(a,b){var c=b.fn(a,b);return c}}}),CodeMirror.defineMIME("text/x-rst","rst"),CodeMirror.defineMode("plsql",function(a,b){function o(a,b){var c=!1,d;while(d=a.next()){if(d=="/"&&c){b.tokenize=m;break}c=d=="*"}return l("comment","plsql-comment")}function n(a){return function(b,c){var d=!1,e,f=!1;while((e=b.next())!=null){if(e==a&&!d){f=!0;break}d=!d&&e=="\\"}if(f||!d&&!h)c.tokenize=m;return l("string","plsql-string")}}function m(a,b){var c=a.next();if(c=='"'||c=="'")return j(a,b,n(c));if(/[\[\]{}\(\),;\.]/.test(c))return l(c);if(/\d/.test(c)){a.eatWhile(/[\w\.]/);return l("number","number")}if(c=="/"){if(a.eat("*"))return j(a,b,o);a.eatWhile(i);return l("operator","operator")}if(c=="-"){if(a.eat("-")){a.skipToEnd();return l("comment","comment")}a.eatWhile(i);return l("operator","operator")}if(c=="@"||c=="$"){a.eatWhile(/[\w\d\$_]/);return l("word","variable")}if(i.test(c)){a.eatWhile(i);return l("operator","operator")}a.eatWhile(/[\w\$_]/);if(d&&d.propertyIsEnumerable(a.current().toLowerCase()))return l("keyword","keyword");if(e&&e.propertyIsEnumerable(a.current().toLowerCase()))return l("keyword","builtin");if(f&&f.propertyIsEnumerable(a.current().toLowerCase()))return l("keyword","variable-2");if(g&&g.propertyIsEnumerable(a.current().toLowerCase()))return l("keyword","variable-3");return l("word","plsql-word")}function l(a,b){k=a;return b}function j(a,b,c){b.tokenize=c;return c(a,b)}var c=a.indentUnit,d=b.keywords,e=b.functions,f=b.types,g=b.sqlplus,h=b.multiLineStrings,i=/[+\-*&%=<>!?:\/|]/,k;return{startState:function(a){return{tokenize:m,startOfLine:!0}},token:function(a,b){if(a.eatSpace())return null;var c=b.tokenize(a,b);return c}}}),function(){function a(a){var b={},c=a.split(" ");for(var d=0;d<c.length;++d)b[c[d]]=!0;return b}var b="abort accept access add all alter and any array arraylen as asc assert assign at attributes audit authorization avg base_table begin between binary_integer body boolean by case cast char char_base check close cluster clusters colauth column comment commit compress connect connected constant constraint crash create current currval cursor data_base database date dba deallocate debugoff debugon decimal declare default definition delay delete desc digits dispose distinct do drop else elsif enable end entry escape exception exception_init exchange exclusive exists exit external fast fetch file for force form from function generic goto grant group having identified if immediate in increment index indexes indicator initial initrans insert interface intersect into is key level library like limited local lock log logging long loop master maxextents maxtrans member minextents minus mislabel mode modify multiset new next no noaudit nocompress nologging noparallel not nowait number_base object of off offline on online only open option or order out package parallel partition pctfree pctincrease pctused pls_integer positive positiven pragma primary prior private privileges procedure public raise range raw read rebuild record ref references refresh release rename replace resource restrict return returning reverse revoke rollback row rowid rowlabel rownum rows run savepoint schema segment select separate session set share snapshot some space split sql start statement storage subtype successful synonym tabauth table tables tablespace task terminate then to trigger truncate type union unique unlimited unrecoverable unusable update use using validate value values variable view views when whenever where while with work",c="abs acos add_months ascii asin atan atan2 average bfilename ceil chartorowid chr concat convert cos cosh count decode deref dual dump dup_val_on_index empty error exp false floor found glb greatest hextoraw initcap instr instrb isopen last_day least lenght lenghtb ln lower lpad ltrim lub make_ref max min mod months_between new_time next_day nextval nls_charset_decl_len nls_charset_id nls_charset_name nls_initcap nls_lower nls_sort nls_upper nlssort no_data_found notfound null nvl others power rawtohex reftohex round rowcount rowidtochar rpad rtrim sign sin sinh soundex sqlcode sqlerrm sqrt stddev substr substrb sum sysdate tan tanh to_char to_date to_label to_multi_byte to_number to_single_byte translate true trunc uid upper user userenv variance vsize",d="bfile blob character clob dec float int integer mlslabel natural naturaln nchar nclob number numeric nvarchar2 real rowtype signtype smallint string varchar varchar2",e="appinfo arraysize autocommit autoprint autorecovery autotrace blockterminator break btitle cmdsep colsep compatibility compute concat copycommit copytypecheck define describe echo editfile embedded escape exec execute feedback flagger flush heading headsep instance linesize lno loboffset logsource long longchunksize markup native newpage numformat numwidth pagesize pause pno recsep recsepchar release repfooter repheader serveroutput shiftinout show showmode size spool sqlblanklines sqlcase sqlcode sqlcontinue sqlnumber sqlpluscompatibility sqlprefix sqlprompt sqlterminator suffix tab term termout time timing trimout trimspool ttitle underline verify version wrap";CodeMirror.defineMIME("text/x-plsql",{name:"plsql",keywords:a(b),functions:a(c),types:a(d),sqlplus:a(e)})}(),CodeMirror.defineMode("lua",function(a,b){function o(a){return function(b,c){var d=!1,e;while((e=b.next())!=null){if(e==a&&!d)break;d=!d&&e=="\\"}d||(c.cur=m);return"string"}}function n(a,b){return function(c,d){var e=null,f;while((f=c.next())!=null)if(e==null)f=="]"&&(e=0);else if(f=="=")++e;else{if(f=="]"&&e==a){d.cur=m;break}e=null}return b}}function m(a,b){var c=a.next();if(c=="-"&&a.eat("-")){if(a.eat("["))return(b.cur=n(l(a),"comment"))(a,b);a.skipToEnd();return"comment"}if(c=='"'||c=="'")return(b.cur=o(c))(a,b);if(c=="["&&/[\[=]/.test(a.peek()))return(b.cur=n(l(a),"string"))(a,b);if(/\d/.test(c)){a.eatWhile(/[\w.%]/);return"number"}if(/[\w_]/.test(c)){a.eatWhile(/[\w\\\-_.]/);return"variable"}return null}function l(a){var b=0;while(a.eat("="))++b;a.eat("[");return b}function e(a){return new RegExp("^(?:"+a.join("|")+")$","i")}function d(a){return new RegExp("^(?:"+a.join("|")+")","i")}var c=a.indentUnit,f=e(b.specials||[]),g=e(["_G","_VERSION","assert","collectgarbage","dofile","error","getfenv","getmetatable","ipairs","load","loadfile","loadstring","module","next","pairs","pcall","print","rawequal","rawget","rawset","require","select","setfenv","setmetatable","tonumber","tostring","type","unpack","xpcall","coroutine.create","coroutine.resume","coroutine.running","coroutine.status","coroutine.wrap","coroutine.yield","debug.debug","debug.getfenv","debug.gethook","debug.getinfo","debug.getlocal","debug.getmetatable","debug.getregistry","debug.getupvalue","debug.setfenv","debug.sethook","debug.setlocal","debug.setmetatable","debug.setupvalue","debug.traceback","close","flush","lines","read","seek","setvbuf","write","io.close","io.flush","io.input","io.lines","io.open","io.output","io.popen","io.read","io.stderr","io.stdin","io.stdout","io.tmpfile","io.type","io.write","math.abs","math.acos","math.asin","math.atan","math.atan2","math.ceil","math.cos","math.cosh","math.deg","math.exp","math.floor","math.fmod","math.frexp","math.huge","math.ldexp","math.log","math.log10","math.max","math.min","math.modf","math.pi","math.pow","math.rad","math.random","math.randomseed","math.sin","math.sinh","math.sqrt","math.tan","math.tanh","os.clock","os.date","os.difftime","os.execute","os.exit","os.getenv","os.remove","os.rename","os.setlocale","os.time","os.tmpname","package.cpath","package.loaded","package.loaders","package.loadlib","package.path","package.preload","package.seeall","string.byte","string.char","string.dump","string.find","string.format","string.gmatch","string.gsub","string.len","string.lower","string.match","string.rep","string.reverse","string.sub","string.upper","table.concat","table.insert","table.maxn","table.remove","table.sort"]),h=e(["and","break","elseif","false","nil","not","or","return","true","function","end","if","then","else","do","while","repeat","until","for","in","local"]),i=e(["function","if","repeat","for","while","\\(","{"]),j=e(["end","until","\\)","}"]),k=d(["end","until","\\)","}","else","elseif"]);return{startState:function(a){return{basecol:a||0,indentDepth:0,cur:m}},token:function(a,b){if(a.eatSpace())return null;var c=b.cur(a,b),d=a.current();c=="variable"&&(h.test(d)?c="keyword":g.test(d)?c="builtin":f.test(d)&&(c="variable-2")),i.test(d)?++b.indentDepth:j.test(d)&&--b.indentDepth;return c},indent:function(a,b){var d=k.test(b);return a.basecol+c*(a.indentDepth-(d?1:0))}}}),CodeMirror.defineMIME("text/x-lua","lua")
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
                var renderTo = Ext.get(this.renderTo); 
                if ( renderTo ) {
                    if (renderTo.getHeight() < this.getHeight() ) 
                        this.setHeight( renderTo.getHeight() );
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

if  (Ext.isIE7 || Ext.isIE6) {
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
    
/**
 * добавим поддержку чекбоксов по аналогии с TreePanel
 * чек боксы включаются просто передачей checked в сторе 
 */
Ext.override(Ext.ux.tree.TreeGridNodeUI, {
    renderElements : function(n, a, targetNode, bulkRender){
        var t = n.getOwnerTree(),
            cb = Ext.isBoolean(a.checked),
            cb = Ext.isBoolean(a.checked),
            cols = t.columns,
            c = cols[0],
            i, buf, len;

        this.indentMarkup = n.parentNode ? n.parentNode.ui.getChildIndent() : '';

        buf = [
             '<tbody class="x-tree-node">',
                '<tr ext:tree-node-id="', n.id ,'" class="x-tree-node-el x-tree-node-leaf x-unselectable ', a.cls, '">',
                    '<td class="x-treegrid-col">',
                        '<span class="x-tree-node-indent">', this.indentMarkup, "</span>",
                        '<img src="', this.emptyIcon, '" class="x-tree-ec-icon x-tree-elbow" />',
                        '<img src="', a.icon || this.emptyIcon, '" class="x-tree-node-icon', (a.icon ? " x-tree-node-inline-icon" : ""), (a.iconCls ? " "+a.iconCls : ""), '" unselectable="on" />',
                        cb ? ('<input class="x-tree-node-cb" type="checkbox" ' + (a.checked ? 'checked="checked" />' : '/>')) : '',
                        '<a hidefocus="on" class="x-tree-node-anchor" href="', a.href ? a.href : '#', '" tabIndex="1" ',
                            a.hrefTarget ? ' target="'+a.hrefTarget+'"' : '', '>',
                        '<span unselectable="on">', (c.tpl ? c.tpl.apply(a) : a[c.dataIndex] || c.text), '</span></a>',
                    '</td>'
        ];

        for(i = 1, len = cols.length; i < len; i++){
            c = cols[i];
            buf.push(
                    '<td class="x-treegrid-col ', (c.cls ? c.cls : ''), '">',
                        '<div unselectable="on" class="x-treegrid-text"', (c.align ? ' style="text-align: ' + c.align + ';"' : ''), '>',
                            (c.tpl ? c.tpl.apply(a) : a[c.dataIndex]),
                        '</div>',
                    '</td>'
            );
        }

        buf.push(
            '</tr><tr class="x-tree-node-ct"><td colspan="', cols.length, '">',
            '<table class="x-treegrid-node-ct-table" cellpadding="0" cellspacing="0" style="table-layout: fixed; display: none; width: ', t.innerCt.getWidth() ,'px;"><colgroup>'
        );
        for(i = 0, len = cols.length; i<len; i++) {
            buf.push('<col style="width: ', (cols[i].hidden ? 0 : cols[i].width) ,'px;" />');
        }
        buf.push('</colgroup></table></td></tr></tbody>');

        if(bulkRender !== true && n.nextSibling && n.nextSibling.ui.getEl()){
            this.wrap = Ext.DomHelper.insertHtml("beforeBegin", n.nextSibling.ui.getEl(), buf.join(''));
        }else{
            this.wrap = Ext.DomHelper.insertHtml("beforeEnd", targetNode, buf.join(''));
        }

        this.elNode = this.wrap.childNodes[0];
        this.ctNode = this.wrap.childNodes[1].firstChild.firstChild;
        var cs = this.elNode.firstChild.childNodes;
        this.indentNode = cs[0];
        this.ecNode = cs[1];
        this.iconNode = cs[2];
        index = 3;
        if(cb){
            this.checkbox = cs[3];
            // fix for IE6
            this.checkbox.defaultChecked = this.checkbox.checked;
            index++;
        }
        this.anchor = cs[index];
        this.textNode = cs[index].firstChild;
    }
});
    
/**
 * добавим поддержку чекбоксов по аналогии с TreePanel
 * чек боксы включаются просто передачей checked в сторе 
 */
Ext.override(Ext.ux.tree.TreeGrid, {

    /**
     * Retrieve an array of checked nodes, or an array of a specific attribute of checked nodes (e.g. 'id')
     * @param {String} attribute (optional) Defaults to null (return the actual nodes)
     * @param {TreeNode} startNode (optional) The node to start from, defaults to the root
     * @return {Array}
     */
    getChecked : function(a, startNode){
        startNode = startNode || this.root;
        var r = [];
        var f = function(){
            if(this.attributes.checked){
                r.push(!a ? this : (a == 'id' ? this.id : this.attributes[a]));
            }
        };
        startNode.cascade(f);
        return r;
    }
});
