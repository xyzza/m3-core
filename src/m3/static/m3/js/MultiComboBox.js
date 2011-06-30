Ext.ns('Ext.ux.form');

Ext.ux.form.MultiComboBox = Ext.extend(Ext.form.ComboBox, {

    delimeter:',',

    checkedItems:[],
    
    initComponent:function() {
        this.editable = false;

        if (!this.tpl) {
             this.tpl = '<tpl for="."><div class="x-combo-list-item x-multi-combo-item">' +
            '<img src="' + Ext.BLANK_IMAGE_URL + '" class="{[this.getImgClass(values)]}" />' +
            '<div>{' + this.displayField + '}</div></div></tpl>';
            
            this.tpl = new Ext.XTemplate(this.tpl, {
                getImgClass: this.getCheckboxCls.createDelegate(this)
            })

        }
        Ext.ux.form.MultiComboBox.superclass.initComponent.apply(this);
    },

    getValue : function () {
		var values = [], i = 0 ;

        for (;i < this.checkedItems.length;i++) {
            values.push( this.checkedItems[i].get(this.valueField))
        }

        return values.join(this.delimeter);

//		Ext.each(this.checkedRecords, function (record) {
//			value.push(record.get(field || this.valueField));
//		}, this);
//
//		return value.join(this.delimiter);
	},

//    setValue:function() {
//        alert('!set!');
//    },

    getText:function() {
        console.log('get text');
        Ext.ux.form.MultiComboBox.superclass.getText.apply(this, arguments);
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

    normalizeStringValues : function (s) {
	    if (!Ext.isEmpty(s, false)) {
	        var values = [],
	            re = /^\[{1}|\]{1}$/g;

            s =  s.toString().replace(re, "");

	        Ext.each(s.split(this.delimiter), function (item) {
	            values.push(item.trim());
	        });
	        s = values.join(this.delimiter);
	    }

	    return s;
	},

    onSelect : function (record, index) {
        if (this.fireEvent("beforeselect", this, record, index) !== false) {
			if (this.checkedItems.indexOf(record) === -1) {
			    this.checkedItems.push(record);
			} else {
			    this.checkedItems.remove(record);
			}

            this.refreshItem(record);

//			if (this.store.isFiltered()) {
//				this.doQuery(this.allQuery);
//			}

//			this.setValue(this.getValue());
            this.fireEvent("select", this, record, index);
        }
	},

    refreshItem:function(record) {
        if (this.view) {
            this.view.refreshNode(this.store.indexOf(record));
        }
    }

});

Ext.reg('m3-multicombo', Ext.ux.form.MultiComboBox );
