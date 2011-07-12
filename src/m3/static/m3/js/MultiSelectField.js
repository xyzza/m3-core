Ext.ns('Ext.m3');

/**
 * @class Ext.ux.form.MultiSelectField
 * @extends Ext.m3.AdvancedComboBox
 *
 * Контрол для выбора множества значений. Может быть использован как локальное комбо,
 * с галочками в выпадающем списке. Или же так же как выбор из справочника, с установкой пака
 * Отличается от выбора из спровочника переопределенным шаблоном для отображения выпадающего списка
 * с галочками. Реальные значения храняться как массив рекордов в свойстве checkedItems
 */
Ext.m3.MultiSelectField = Ext.extend(Ext.m3.AdvancedComboBox, {

    delimeter:',',

    initComponent:function() {

        this.checkedItems = [];

        this.hideTriggerDictEdit = true;

        this.editable = false;

        if (!this.tpl) {
             this.tpl = '<tpl for="."><div class="x-combo-list-item x-multi-combo-item">' +
            '<img src="' + Ext.BLANK_IMAGE_URL + '" class="{[this.getImgClass(values)]}" />' +
            '<div>{' + this.displayField + '}</div></div></tpl>';
            
            this.tpl = new Ext.XTemplate(this.tpl, {
                getImgClass: this.getCheckboxCls.createDelegate(this)
            })

        }

       Ext.m3.MultiSelectField.superclass.initComponent.apply(this);
    },

    setValue:function(v) {
        if (!v) {
            return;
        }

        this.value = this.getValue();
        this.setRawValue(this.getText());
        if (this.hiddenField) {
            this.hiddenField.value = this.value;
        }
        if (this.el) {
            this.el.removeClass(this.emptyClass);
        }
    },

    getValue : function () {
        var value = [];
		Ext.each(this.checkedItems, function (record) {
			value.push(record.get(this.valueField));
		}, this);
		return value.join(',');
	},

    initValue:function() {
        var i = 0, obj, values, val, record;

        if (this.store && this.value && this.mode === 'local') {
            //Случай, если контрол используется как локальный комбобокс
            //со множественным выбором
            values = Ext.util.JSON.decode(this.value);
            this.store.each(function (r) {
			    Ext.each(values, function (value) {
			        if (r.get(this.valueField) == value) {
			            this.checkedItems.push(r);
			            return false;
			        }
			    }, this);					
		    }, this);
        }
        else if (this.value) {
            //Попробуем создать значения из того что нам прислали с сервера
            //ожидаем что там будут некие объекты с полями значения и отображения
            values = Ext.util.JSON.decode(this.value);

            for (;i < values.length; i++) {
                val = values[i];

                if (typeof(val) !== 'object' ||
                    !( val[this.displayField] && val[this.valueField] )){
                    continue;
                }
                
                record = new Ext.data.Record();
                record.data['id'] = val[this.valueField];
                record.data[this.displayField] = val[this.displayField];

                this.checkedItems.push(record);
            }
        }

       Ext.m3.MultiSelectField.superclass.initValue.call(this);
    },

    getText : function () {
		var value = [];
		Ext.each(this.checkedItems, function (record) {
			value.push(record.get(this.displayField));
		}, this);

		return value.join(this.delimeter + ' ');
	},

    getCheckboxCls:function(record) {
        var i = 0;
        for (; i < this.checkedItems.length; i++) {
            if ( record[this.valueField] == this.checkedItems[i].data[this.valueField] ) {
                return 'x-grid3-check-col-on';
            }
        }

        return 'x-grid3-check-col';
    },

    getCheckedRecords:function() {
        return this.checkedItems;    
    },

    onSelect : function (record, index) {
        if (this.fireEvent("beforeselect", this, record, index) !== false) {
			if (this.checkedItems.indexOf(record) === -1) {
			    this.checkedItems.push(record);
			} else {
			    this.checkedItems.remove(record);
			}

            this.refreshItem(record);

			this.setValue(this.getValue());
            this.fireEvent("select", this, record, index);
        }
	},

    refreshItem:function(record) {
        if (this.view) {
            this.view.refreshNode(this.store.indexOf(record));
        }
    },

    onSelectInDictionary: function(){
        assert( this.actionSelectUrl, 'actionSelectUrl is undefined' );

		if(this.fireEvent('beforerequest', this)) {
			Ext.Ajax.request({
				url: this.actionSelectUrl
				,method: 'POST'
				,params: this.actionContextJson
				,success: function(response, opts){
				    var win = smart_eval(response.responseText);
				    if (win){
                        win.initMultiSelect(this.checkedItems);
				        win.on('closed_ok',function(records){
							if (this.fireEvent('afterselect', records)) {
								this.addRecordsToStore( records);
							}
				        }, this);
				    };
				}
				,failure: function(response, opts){
					uiAjaxFailMessage.apply(this, arguments);
				},
                scope:this
			});
		}
	},

    clearValue:function() {
        Ext.ux.form.MultiSelectField.superclass.clearValue.call(this);
    },

    addRecordsToStore: function(records){
    	var i = 0, newRecords = [], record;

        for (i; i< records.length;i++) {
            record = new Ext.data.Record();
            record.data['id'] = records[i].data.id;
            record.data[this.displayField] = records[i].data[this.displayField];
            newRecords.push( record );
        }

        this.getStore().loadData({total:newRecords.length, rows:newRecords});
        this.checkedItems = newRecords;

        this.setValue(this.getValue());
	}

});

Ext.reg('m3-multiselect', Ext.m3.MultiSelectField );
