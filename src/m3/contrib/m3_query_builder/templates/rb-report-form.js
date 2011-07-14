var form = Ext.getCmp('{{ component.frm_form.client_id }}');

var fieldsModel = new function(){
	
	var containers = {};
	
	return {
		
		HEIGHT_LINE: 14, // Высота смещения по вертикали
		
		/**
		 * 
		 */
		getFieldContainer: function(contID){			
			return containers[contID];
		},
		
		
		/**
		 * 
		 */
		setFieldContainer: function(contID){
			containers[contID] = {
				
				// Значения вида [value1, value2]				
				values: [],
				
				// Высота контейнера, где находятся отображаемые значения
				height: 0
			}
		},
		
		/**
		 * 
		 */
		getValues: function(){
			var mass = [];
			for (var field in containers){
				console.log(field);
				var d = {};
				d[field] = containers[field]['values'];
				mass.push(d);
			}
			return mass;
		},
		
		/**
		 * 
		 */
		addValue: function(contID, value){
			containers[contID]['values'].push( value );
		},
		
		/**
		 * 
		 */
		deleteValue: function(contID, value){
			var mass = containers[contID]['values'];
			mass.splice(mass.indexOf(value), 1);
		}
	}
}

function submitForm(){
	
	var url = '{{ component.submit_data_url }}';
	assert(url, 'Url for child window is not define');
	
	var loadMask = new Ext.LoadMask(win.body);
    loadMask.show();
	
	form.getForm().submit({
		clientValidation: true
		,url: url
		,success: function(form, action) {
			loadMask.hide();
		}
		,failure: function(){
        	loadMask.hide();
            uiAjaxFailMessage.apply(this, arguments);
        }
	});
}

function addValue(id){
	var component = Ext.getCmp(id);
	
	if (!component.getValue()){
		return;
	}
		
	var value;
	if (component.isXType(Ext.m3.AdvancedDataField)){
		var d = component.getValue();
		value = String.format('{0}.{1}.{2}', d.getDate(), d.getMonth(), d.getFullYear()
								);
	} else {
		value = component.getValue();
	}

	var divEl = Ext.get('div' + id);
	var newChildEl = divEl.createChild({
		tag: 'span',
	    cls: '{display:inline}',
	});
	
	var linkEl = newChildEl.createChild({		
    	tag: 'a',
    	href: '#',
    	html: String.format('{0} [x], ', value)	    
	});
 	
 	// Обработчик на клик - удаление элемента 	 
 	linkEl.on('click', function(){	
 		fieldsModel.deleteValue(divEl.id, value);
 		this.remove();
 	}, newChildEl);
	
	if (divEl.getHeight() > fieldsModel.getFieldContainer(divEl.id)['height']) {
		
		var k;		
		if (!fieldsModel.getFieldContainer(divEl.id)['height']) {

			k = divEl.getHeight()/fieldsModel.HEIGHT_LINE;	
		} else {
			k =  divEl.getHeight()/fieldsModel.getFieldContainer(divEl.id)['height'];
		}
		
		component.ownerCt.ownerCt.setHeight( component.ownerCt.ownerCt.getHeight() + k*fieldsModel.HEIGHT_LINE );
		component.ownerCt.setHeight( component.ownerCt.getHeight() + k*fieldsModel.HEIGHT_LINE );	
		win.setHeight(win.getHeight() + k*fieldsModel.HEIGHT_LINE);	
		
		fieldsModel.getFieldContainer(divEl.id)['height'] = divEl.getHeight();		
	}
	
	fieldsModel.addValue(divEl.id, value);
	
	component.setValue('');
	component.focus();
	
	console.log(fieldsModel.getValues());
}

// Добавление в каждый field, за исключением некоторых, контейнерный элемент
win.on('beforeshow', function(window){
	var el;

	form.getForm().items.each(function(item, index, length){
		if ( !item.isXType(Ext.form.Checkbox) && !item.isXType(Ext.form.Hidden)
			&& !item.isXType(Ext.m3.MultiSelectField) && !item.isXType(Ext.m3.AdvancedComboBox)){ 
				
			el = item.getEl().parent();
			var spec = {	    
				id: 'div' + item.id,
			    tag: 'div'
			}

			var newChildEl;
			if (item.isXType(Ext.m3.AdvancedDataField)){
				newChildEl = el.parent().createChild(spec);
				
				console.log(newChildEl);
			} else {
				newChildEl = el.createChild(spec);
			}

			fieldsModel.setFieldContainer(newChildEl.id);
		
			
		}
	});
});
