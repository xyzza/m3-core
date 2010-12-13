/**
 * Здесь нужно перегружать объекты и дополнять функционал.
 * Этот файл подключается последним.
 */
 
/**
 * Нужно для правильной работы окна 
 */
Ext.override(Ext.Window, {

	/*
	 *  Если установлена модальность и есть родительское окно, то
	 *  флаг модальности помещается во временную переменную tmpModal, и 
	 *  this.modal = false;
	 */
	tmpModal: false 
	
	,manager: new Ext.WindowGroup()
    ,renderTo: 'x-desktop'
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
			if ( Ext.get('x-desktop').getHeight() < this.getHeight() ) {
				this.setHeight( Ext.get('x-desktop').getHeight() );
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
