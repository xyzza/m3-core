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
			hideTrigger: true,
			minChars: 2,
			emptyText: 'Населенный пункт...',
			queryParam: 'filter',
			store: place_store,
			resizable: true,
			displayField: 'display_name',
			valueField: 'code',
			mode: 'remote',
			hiddenName: params.place_field_name
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
				hideTrigger: true,
				minChars: 2,
				emptyText: 'Улица...',
				queryParam: 'filter',
				store: street_store,
				resizable: true,
				displayField: 'display_name',
				valueField: 'code',
				mode: 'remote',
				hiddenName: params.street_field_name
			});
			this.street.setValue(params.street_value);
			
			if (params.level > 2) {
				this.house = new Ext.form.TextField({
					name: params.house_field_name,
					fieldLabel: params.house_label,
					value: params.house_value,
					emptyText: 'Дом...',
					width: 40
				});
				
				if (params.level > 3) {
					this.flat = new Ext.form.TextField({
						name: params.flat_field_name,
						fieldLabel: params.flat_label,
						value: params.flat_value,
						emptyText: 'Кв-ра...',
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
					}];
					if (params.level > 3) {
						row_items.push({
							xtype: 'container'
							, layout: 'form'
							, style: {padding: '0px 0px 0px 5px'}
							, items: this.flat
						});
					}
					var row = new Ext.Container({
						anchor: '100%'
						, layout: 'column'
						, items: row_items
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
		}
		if (this.level > 1) {
			this.mon(this.place, 'change', this.clearStreet, this);
			this.mon(this.street, 'beforequery', this.beforeStreetQuery, this);
		};
		this.addEvents(
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
			'change_flat');
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
		Ext.Ajax.request({
			url: this.get_addr_url,
			params: Ext.applyIf({ place: place_id, street: street_id, house: house_num, flat: flat_num, addr_cmp: this.addr.id }, this.params),
			success: function(response, opts){ smart_eval(response.responseText); },
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
})