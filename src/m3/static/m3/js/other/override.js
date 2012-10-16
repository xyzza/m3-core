/**
 * Здесь нужно перегружать объекты и дополнять функционал.
 * Этот файл подключается последним.
 */
 
/**
 * Нужно для правильной работы окна 
 */
Ext3.onReady(function(){
	Ext3.override(Ext3.Window, {
	
	  /*
	   *  Если установлена модальность и есть родительское окно, то
	   *  флаг модальности помещается во временную переменную tmpModal, и 
	   *  this.modal = false;
	   */
	  tmpModal: false

      //rrzakirov: Чтобы в одном рабочем столе, окна от ExtJS3 и ExtJS4 могли работать вместе.
	  ,manager: new Ext3.DesktopWindowGroup()

	  // 2011.01.14 kirov
	  // убрал, т.к. совместно с desktop.js это представляет собой гремучую смесь
	  // кому нужно - пусть прописывает Ext3.getBody() в своем "десктопе" на onReady или когда хочет
	  //,renderTo: Ext3.getBody().id
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
                var renderTo = Ext3.get(this.renderTo); 
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
					this.parentWindow.el.removeClass('x3-masked-relative');
	
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
					var taskbar = Ext3.get('ux-taskbar');
					if (taskbar) {
	 					taskbar.mask();
					}
						var toptoolbar = Ext3.get('ux-toptoolbar');
					if (toptoolbar) {
		 				toptoolbar.mask();
					}
				}
			}
			,'close': function (){
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
	 				var taskbar = Ext3.get('ux-taskbar');
					if (taskbar) {
	 					taskbar.unmask();
					}
						var toptoolbar = Ext3.get('ux-toptoolbar');
					if (toptoolbar) {
		 				toptoolbar.unmask();
					}
				}
			}
			,'hide': function (){
				if (this.modal){
					if (!this.parentWindow) {
		 				var taskbar = Ext3.get('ux-taskbar');
						if (taskbar) {
		 					taskbar.unmask();
						}
	 					var toptoolbar = Ext3.get('ux-toptoolbar');
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
Ext3.override(Ext3.ux.tree.TreeGrid, {
	
	// добавлено
	fitColumns: function() {
        var nNewTotalWidth = this.getInnerWidth() - Ext3.num(this.scrollOffset, Ext3.getScrollBarWidth());
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
        Ext3.ux.tree.TreeGrid.superclass.onResize.apply(this, arguments);
        
        var bd = this.innerBody.dom;
        var hd = this.innerHd.dom;

        if(!bd){
            return;
        }

        if(Ext3.isNumber(h)){
            bd.style.height = this.body.getHeight(true) - hd.offsetHeight + 'px';
        }

        if(Ext3.isNumber(w)){                        
            var sw = Ext3.num(this.scrollOffset, Ext3.getScrollBarWidth());
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

Ext3.override(Ext3.tree.ColumnResizer, {

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
Ext3.override(Ext3.tree.TreeNodeUI, {
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
Ext3.override(Ext3.form.Action.Submit, {
	run : function(){
        var o = this.options,
            method = this.getMethod(),
            isGet = method == 'GET';
        if(o.clientValidation === false || this.form.isValid()){
            if (o.submitEmptyText === false) {
                var fields = this.form.items,
                    emptyFields = [];
                fields.each(function(f) {
                    assert(f.el, "Возможно у вас непроинициализировались некоторые поля для отправки. Обратите внимание на TabPanel'и.");
                    if (f.el.getValue() == f.emptyText) {
                        emptyFields.push(f);
                        f.el.dom.value = "";
                    }
					// Добавилось
                    // вот тут сделаем добавку
                    if (f instanceof Ext3.form.CompositeField) {
                        f.items.each(function(cf) {
                            if (cf.el.getValue() == cf.emptyText) {
                                emptyFields.push(cf);
                                cf.el.dom.value = "";
                            }
                        });
                    }
					// <--
                });
            }
            Ext3.Ajax.request(Ext3.apply(this.createCallback(o), {
                form:this.form.el.dom,
                url:this.getUrl(isGet),
                method: method,
                headers: o.headers,
                params:!isGet ? this.getParams() : null,
                isUpload: this.form.fileUpload
            }));
            if (o.submitEmptyText === false) {
                Ext3.each(emptyFields, function(f) {
                    if (f.applyEmptyText) {
                        f.applyEmptyText();
                    }
                });
            }
        }else if (o.clientValidation !== false){ // client validation failed
            this.failureType = Ext3.form.Action.CLIENT_INVALID;
            this.form.afterAction(this, false);
        }
    }
});

/**
 * Метод  вызывается и при клике и при событии change - сюда добавлена обработка
 * атрибута readOnly, тк в стандартном поведении браузеры обрабаытвают этот атрибут только
 * у текстоввых полей
 */
Ext3.override(Ext3.form.Checkbox, {
    onClick : function(e){
        if (this.readOnly) {
            e.stopEvent();
            return false;
        }

        if(this.el.dom.checked != this.checked){
            this.setValue(this.el.dom.checked);
        }
    }
});

/**
 * Раньше нельзя было перейти на конкретную страницу в движках webkit. Т.к.
 * Событие PagingBlur наступает раньше pagingChange, и обновлялась текущая 
 * страница, т.к. PagingBlur обновляет индекс.
 */
Ext3.override(Ext3.PagingToolbar, {
    onPagingBlur: Ext3.emptyFn
});

/*
 * Проблема скроллинга хидеров в компонентах ExtPanel или ExtFieldSet
 * (Скролятся только хидеры)
 */

if  (Ext3.isIE7 || Ext3.isIE6) {
    Ext3.Panel.override({
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
Ext3.override(Ext3.ux.tree.TreeGridNodeUI, {
    renderElements : function(n, a, targetNode, bulkRender){
        var t = n.getOwnerTree(),
            cb = Ext3.isBoolean(a.checked),
            cb = Ext3.isBoolean(a.checked),
            cols = t.columns,
            c = cols[0],
            i, buf, len;

        this.indentMarkup = n.parentNode ? n.parentNode.ui.getChildIndent() : '';

        buf = [
             '<tbody class="x3-tree-node">',
                '<tr ext:tree-node-id="', n.id ,'" class="x3-tree-node-el x3-tree-node-leaf x3-unselectable ', a.cls, '">',
                    '<td class="x3-treegrid-col">',
                        '<span class="x3-tree-node-indent">', this.indentMarkup, "</span>",
                        '<img src="', this.emptyIcon, '" class="x3-tree-ec-icon x3-tree-elbow" />',
                        '<img src="', a.icon || this.emptyIcon, '" class="x3-tree-node-icon', (a.icon ? " x3-tree-node-inline-icon" : ""), (a.iconCls ? " "+a.iconCls : ""), '" unselectable="on" />',
                        cb ? ('<input class="x3-tree-node-cb" type="checkbox" ' + (a.checked ? 'checked="checked" />' : '/>')) : '',
                        '<a hidefocus="on" class="x3-tree-node-anchor" href="', a.href ? a.href : '#', '" tabIndex="1" ',
                            a.hrefTarget ? ' target="'+a.hrefTarget+'"' : '', '>',
                        '<span unselectable="on">', (c.tpl ? c.tpl.apply(a) : a[c.dataIndex] || c.text), '</span></a>',
                    '</td>'
        ];

        for(i = 1, len = cols.length; i < len; i++){
            c = cols[i];
            buf.push(
                    '<td class="x3-treegrid-col ', (c.cls ? c.cls : ''), '">',
                        '<div unselectable="on" class="x3-treegrid-text"', (c.align ? ' style="text-align: ' + c.align + ';"' : ''), '>',
                            (c.tpl ? c.tpl.apply(a) : a[c.dataIndex]),
                        '</div>',
                    '</td>'
            );
        }

        buf.push(
            '</tr><tr class="x3-tree-node-ct"><td colspan="', cols.length, '">',
            '<table class="x3-treegrid-node-ct-table" cellpadding="0" cellspacing="0" style="table-layout: fixed; display: none; width: ', t.innerCt.getWidth() ,'px;"><colgroup>'
        );
        for(i = 0, len = cols.length; i<len; i++) {
            buf.push('<col style="width: ', (cols[i].hidden ? 0 : cols[i].width) ,'px;" />');
        }
        buf.push('</colgroup></table></td></tr></tbody>');

        if(bulkRender !== true && n.nextSibling && n.nextSibling.ui.getEl()){
            this.wrap = Ext3.DomHelper.insertHtml("beforeBegin", n.nextSibling.ui.getEl(), buf.join(''));
        }else{
            this.wrap = Ext3.DomHelper.insertHtml("beforeEnd", targetNode, buf.join(''));
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
Ext3.override(Ext3.ux.tree.TreeGrid, {

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

/**
 * По-умолчанию ExtJS отправляет за картинкой на 'http://www.extjs.com/s.gif'
 * Тут укажем что они не правы
 */
Ext3.apply(Ext3, function(){
    return {
        BLANK_IMAGE_URL : Ext3.isIE6 || Ext3.isIE7 || Ext3.isAir ?
            '/m3static/vendor/extjs/resources/images/default/s.gif' :
            'data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='
    };
}());


/**
 * Исправление поведения Ext3.ComboBox, когда значения списка с value '' и 0
 * считаются идентичными: теперь сравнение происходит с приведением к строке.
 * Описание ошибки и патч отсюда: http://www.sencha.com/forum/showthread.php?79285
 */
Ext3.override(Ext3.form.ComboBox, {
    findRecord : function(prop, value){
        var record;
        if(this.store.getCount() > 0){
            this.store.each(function(r){
                if(String(r.data[prop]) == String(value)){
                    record = r;
                    return false;
                }
            });
        }
        return record;
    }
});

/**
 * Добавление/удаление пользовательского класса m3-grey-field после использования
 * setReadOnly для Ext3.form.Field и Ext3.form.TriggerField
 * см m3.css - стр. 137 .m3-grey-field
 */
var setReadOnlyField = Ext3.form.Field.prototype.setReadOnly;
var restoreClass = function(readOnly){
    if(readOnly) {         
        this.addClass('m3-grey-field');
    } else {
        this.removeClass('m3-grey-field');
    }
}
Ext3.override(Ext3.form.Field, {
    setReadOnly : function(readOnly){
        setReadOnlyField.call(this, readOnly);
        restoreClass.call(this, readOnly);
    }
});
var setReadOnlyTriggerField = Ext3.form.TriggerField.prototype.setReadOnly;
Ext3.override(Ext3.form.TriggerField, {
    setReadOnly : function(readOnly){
        setReadOnlyTriggerField.call(this, readOnly);
        restoreClass.call(this, readOnly);
    }
});
