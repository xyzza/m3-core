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
	highlightColor: 'orange',
	
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
    }
		for(var fn in this.filters)
		{
		  if(!Ext.isEmpty(this.filters[fn]))
		    this.filterFields[fn].highlightCtrl.getEl().dom.style.backgroundColor = color;
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
