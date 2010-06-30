/**
 * Здесь нужно перегружать объекты и дополнять функционал.
 * Этот файл подключается последним.
 */
 
/**
 * Нужно для правильной работы окна 
 */
Ext.override(Ext.Window, {
	//minimizable: true
    //,maximizable: true
	masked: false
	,manager: new Ext.WindowGroup()
    ,renderTo: 'x-desktop'
    ,constrain: true
	,parentWindowID: ''
	,listeners: {
		'show': function (){
			if (this.modal){
				var parent_wind = Ext.getCmp(this.parentWindowID);
				if (parent_wind != undefined) {
					parent_wind.masked = true;
				}
				else {
					var taskbar = Ext.get('ux-taskbar');
					taskbar.mask();
                	var toptoolbar = Ext.get('ux-toptoolbar');
					toptoolbar.mask();
				}
			}
		}
		,'beforeclose': function (){
			if (this.modal){
				var parent_wind = Ext.getCmp(this.parentWindowID);
				if (parent_wind != undefined) {
					parent_wind.masked = false;
				}
				else {
	 				var taskbar = Ext.get('ux-taskbar');
	 				taskbar.unmask();
	 				var toptoolbar = Ext.get('ux-toptoolbar');
	 				toptoolbar.unmask();
				}
			}
		}
		,'hide': function (){
			if (this.modal){
				var parent_wind = Ext.getCmp(this.parentWindowID);
				if (parent_wind == undefined) {
	 				var taskbar = Ext.get('ux-taskbar');
	 				taskbar.unmask();
	 				var toptoolbar = Ext.get('ux-toptoolbar');
	 				toptoolbar.unmask();
				}
			}
		}
	},
	beforeShow : function(){
        delete this.el.lastXY;
        delete this.el.lastLT;
        if(this.x === undefined || this.y === undefined){
            var xy = this.el.getAlignToXY(this.container, 'c-c');
            var pos = this.el.translatePoints(xy[0], xy[1]);
            this.x = this.x === undefined? pos.left : this.x;
            this.y = this.y === undefined? pos.top : this.y;
        }
        this.el.setLeftTop(this.x, this.y);

        if(this.expandOnShow){
            this.expand(false);
        }

        if(this.modal){
            Ext.getBody().addClass('x-body-masked');
			// kirov
			// работа с родительским окном
			var parent_wind = Ext.getCmp(this.parentWindowID);
			if (parent_wind != undefined) {
				var box = parent_wind.getBox(true);
				this.mask.setLeftTop(box.x, box.y);
				this.mask.setSize(box.width, box.height);
			}
			else {
				this.mask.setLeftTop(0, 0);
				this.mask.setSize(Ext.lib.Dom.getViewWidth(true), Ext.lib.Dom.getViewHeight(true));
			}
            this.mask.show();
        }
    },
	onRender : function(ct, position){
        Ext.Window.superclass.onRender.call(this, ct, position);

        if(this.plain){
            this.el.addClass('x-window-plain');
        }

        // this element allows the Window to be focused for keyboard events
        this.focusEl = this.el.createChild({
                    tag: 'a', href:'#', cls:'x-dlg-focus',
                    tabIndex:'-1', html: '&#160;'});
        this.focusEl.swallowEvent('click', true);

        this.proxy = this.el.createProxy('x-window-proxy');
        this.proxy.enableDisplayMode('block');

        if(this.modal){
			this.mask = this.container.createChild({cls:'m3-el-mask'}, this.el.dom);
            this.mask.enableDisplayMode('block');
            this.mask.hide();
            this.mon(this.mask, 'click', this.focus, this);
        }
        if(this.maximizable){
            this.mon(this.header, 'dblclick', this.toggleMaximize, this);
        }
    },
	onWindowResize : function(){
        if(this.maximized){
            this.fitContainer();
        }
        if (this.modal) {
			var parent_wind = Ext.getCmp(this.parentWindowID);
			if (parent_wind != undefined) {
				var box = parent_wind.getBox(true);
				this.mask.setLeftTop(box.x, box.y);
				this.mask.setSize(box.width, box.height);
			}
			else {
				this.mask.setSize('100%', '100%');
				var force = this.mask.dom.offsetHeight;
				this.mask.setLeftTop(0, 0);
				this.mask.setSize(Ext.lib.Dom.getViewWidth(true), Ext.lib.Dom.getViewHeight(true));
			}
		}
        this.doConstrain();
    },
	setZIndex : function(index){
        if(this.modal){
			var parent_wind = Ext.getCmp(this.parentWindowID);
			if (parent_wind != undefined) {
				this.mask.setStyle('z-index', parent_wind.lastZIndex + 1);
			}
			else {
				this.mask.setStyle('z-index', index);
			}
        }
        this.el.setZIndex(++index);
        index += 5;

        if(this.resizer){
            this.resizer.proxy.setStyle('z-index', ++index);
        }

        this.lastZIndex = index;
    },
	hide : function(animateTarget, cb, scope){
        if(this.hidden || this.fireEvent('beforehide', this) === false){
            return this;
        }
        if(cb){
            this.on('hide', cb, scope, {single:true});
        }
        this.hidden = true;
        if(animateTarget !== undefined){
            this.setAnimateTarget(animateTarget);
        }
        if(this.modal){
			// kirov
			// работа с родительским окном
			var parent_wind = Ext.getCmp(this.parentWindowID);
			if (parent_wind == undefined) {
				this.mask.hide();
				Ext.getBody().removeClass('x-body-masked');
			}
        }
        if(this.animateTarget){
            this.animHide();
        }else{
            this.el.hide();
            this.afterHide();
        }
        return this;
    },
}); 

/**
 * Обновим TreeGrid чтобы колонки занимали всю ширину дерева
 */
Ext.override(Ext.ux.tree.TreeGrid, {
	
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
		this.fitColumns();
    }
}); 

Ext.override(Ext.tree.ColumnResizer, {

    onEnd : function(e){
        var nw = this.proxy.getWidth(),
            tree = this.tree;
        
        this.proxy.remove();
        delete this.dragHd;
        
        tree.columns[this.hdIndex].width = nw;
        //tree.updateColumnWidths();
		tree.fitColumns();
        
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
            //if(!this.animating && this.node.isExpandable()){
            //    this.node.toggle();
            //}
            this.fireEvent("dblclick", this.node, e);
        }
    }
});
