
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
			this.mon(this.place, 'change', this.clearStreet, this);
			this.mon(this.street, 'beforequery', this.beforeStreetQuery, this);
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
		var addrCmp = this
		Ext.Ajax.request({
			url: this.get_addr_url,
			params: Ext.applyIf({ place: place_id, street: street_id, house: house_num, flat: flat_num, zipcode: zipcode, addr_cmp: this.addr.id }, this.params),
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
		    if (data.zipcode) {
		        this.zipcode.setValue(data.zipcode)
		    }
		} else {
			this.place.setValue('');
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
});
