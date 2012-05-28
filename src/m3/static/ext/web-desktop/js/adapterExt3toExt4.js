/* Для совместимости с ExtJS 4.1 */

Ext3.WindowMgr = Ext.WindowManager;

Ext3.override(Ext3.Window, {
    isComponent: true,
    setZIndex: function(index){
        if(this.modal){
            this.mask.setStyle('z-index', index);
        }
        this.el.setZIndex(++index);
        index += 5;

        if(this.resizer){
            this.resizer.proxy.setStyle('z-index', ++index);
        }

        this.lastZIndex = index;
        // kirov - для совместимости с ExtJS 4 тут надо вернуть значение
        return index;
    }
});

Ext3.override(Ext3.Element, {
    addCls: function(className){
        this.addClass(className);
        return this;
    },
    removeCls: function(className){
        this.removeClass(className);
        return this;
    }
});