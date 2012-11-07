/* Для совместимости с ExtJS 4.1 */

// Этот класс нужно использовать для совместной работы окон ExtJS3 и ExtJS4 на одном рабочем столе.
Ext.DesktopWindowGroup = Ext.extend(Ext.WindowGroup, {
    getNextZSeed: function() {
        return Ext.ZIndexManager.zBase;
    },
    bringToFront : function(comp) {
        var me = this,
            result = false,
            zIndexStack = me.zIndexStack;

        //rrzakirov: 3-ий Ext передает в этот метод объект Ext3.Window
        comp = comp instanceof Ext3.Window ? comp : me.get(comp);

        if (comp !== me.front) {
            Ext.Array.remove(zIndexStack, comp);
            if (comp.preventBringToFront) {
                zIndexStack.unshift(comp);
            } else {
                zIndexStack.push(comp);
            }

            me.assignZIndices();
            result = true;
            this.front = comp;
        }
        if (result && comp.modal) {
            me._showModalMask(comp);
        }
        return result;
    }
});

Ext.WindowManager = Ext.WindowMgr = Ext3.WindowMgr = new Ext.DesktopWindowGroup();

function setZIndex (index){
    if(this.modal){
        this.mask.setStyle('z-index', index);
    }
    this.el.setZIndex(++index);
    index += 5;

    if(this.resizer && this.resizer.proxy){
        this.resizer.proxy.setStyle('z-index', ++index);
    }

    this.lastZIndex = index;
    // kirov - для совместимости с ExtJS 4 тут надо вернуть значение
    return index;
}

Ext3.override(Ext3.Window, {
    setZIndex: setZIndex
});

Ext.override(Ext.Window, {
    setZIndex: setZIndex,
    manager: Ext.WindowManager
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