var form = Ext.getCmp('{{ component.frm_form.client_id }}');

var fieldsModel = new function(){
	
	var containers = {};
	
	return {
		
		HEIGHT_LINE: 14, // Высота смещения по вертикали
		
		/**
		 * Возвращает объект поля
		 */
		getFieldContainer: function(contID){			
			return containers[contID];
		},
		
		
		/**
		 * Устанавливает объект поля
		 */
		setFieldContainer: function(contID){
			containers[contID] = {
				
				// Значения вида [value1, value2]				
				values: [],
				
				name: null,
				
				// Высота контейнера, где находятся отображаемые значения
				height: 0
			}
		},
		
		/**
		 * Получает значения всех объектов
		 */
		getValues: function(){
			var d = {};
			for (var field in containers){
				d[containers[field].name ] = containers[field]['values'];				
			}
			return d;
		},
		
		/**
		 * Устанавливает значение по id контейнера
		 */
		addValue: function(contID, value){
			containers[contID]['values'].push( value );
		},
		
		/**
		 * Устанавливает имя у компонента по id контейнера
		 */
		addName: function(contID, name){
			containers[contID]['name'] = name;
		},
		
		/**
		 * Уджаляет значение по id контейнера
		 */
		deleteValue: function(contID, value){
			var mass = containers[contID]['values'];
			mass.splice(mass.indexOf(value), 1);
		}
	}
}

/**
 * Сабмит данных на сервер
 */
function submitForm(){
	
	var url = '{{ component.submit_data_url }}';
	assert(url, 'Url for child window is not define');

	var values = Ext.applyIf( fieldsModel.getValues(), form.getForm().getValues() );		
	
	var loadMask = new Ext.LoadMask(win.body);
    loadMask.show();
	
	Ext.Ajax.request({		
		url: url
		,params: {'params': Ext.encode(values) }
		,success: function(form, action) {
			loadMask.hide();
		}
		,failure: function(){
        	loadMask.hide();
            uiAjaxFailMessage.apply(this, arguments);
        }
	});
}

/**
 * 
 */
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
		tag: 'span'	    
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
 		
 		// Уменьшать размеры компонентов
 		decreaseCmp(component, divEl);
 	}, newChildEl);

	increaseCmp(component, divEl);
	
	fieldsModel.addValue(divEl.id, value);	
	
	component.setValue('');
	component.focus();
}

/**
 * Увеличение размеров компонента
 */
function increaseCmp(cmp, el){
	var id = el.id;
	
	if (el.getHeight() > fieldsModel.getFieldContainer(id)['height']) {
		
		var k;		
		if (!fieldsModel.getFieldContainer(id)['height']) {

			k = el.getHeight()/fieldsModel.HEIGHT_LINE;	
		} else {
			k =  el.getHeight()/fieldsModel.getFieldContainer(id)['height'];
		}
		
		cmp.ownerCt.ownerCt.setHeight( cmp.ownerCt.ownerCt.getHeight() + k*fieldsModel.HEIGHT_LINE );
		cmp.ownerCt.setHeight( cmp.ownerCt.getHeight() + k*fieldsModel.HEIGHT_LINE );	
		win.setHeight(win.getHeight() + k*fieldsModel.HEIGHT_LINE);	
		
		fieldsModel.getFieldContainer(id)['height'] = el.getHeight();		
	}
}

/**
 * Уменьшение размеров компонента, при удалении дочерних элементов
 */
function decreaseCmp(cmp, el){
	var id = el.id;
	
	if (el.getHeight() < fieldsModel.getFieldContainer(id)['height']) {
		
		var k;		
		if (!el.getHeight()) {
			k = fieldsModel.getFieldContainer(id)['height']/fieldsModel.HEIGHT_LINE;	
		} else {
			k =  fieldsModel.getFieldContainer(id)['height']/el.getHeight();
		}
		
		cmp.ownerCt.ownerCt.setHeight( cmp.ownerCt.ownerCt.getHeight() - k*fieldsModel.HEIGHT_LINE );
		cmp.ownerCt.setHeight( cmp.ownerCt.getHeight() - k*fieldsModel.HEIGHT_LINE );	
		win.setHeight(win.getHeight() - k*fieldsModel.HEIGHT_LINE);	
		
		fieldsModel.getFieldContainer(id)['height'] = el.getHeight();		
	}
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
			} else {
				newChildEl = el.createChild(spec);
			}

			// Добавление значения по нажатию ENTER
			item.on('keydown', function(cmp, e){				
				if (e.keyCode == e.ENTER) {
					addValue(cmp.id);
				}
			});			
			fieldsModel.setFieldContainer(newChildEl.id);
			fieldsModel.addName(newChildEl.id, item.getName());	
		}
	});
});
