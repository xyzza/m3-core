Ext3.namespace('Ext3.ux');

/**
 * Notification окна оповещения, создает цепочку окон оповещения с автоскрытием
 *  принимает аргументы
 *  title - заголовок,
 *  html - содержание,
 *  iconCls - иконка
 */
Ext3.ux.NotificationMgr = {
    notifications: [],
    originalBodyOverflowY: null
};
Ext3.ux.Notification = Ext3.extend(Ext3.Window, {
    initComponent: function () {
        // TODO: Параметры не перекрываются если наследоваться от этого объекта.
        Ext3.apply(this, {
            iconCls: this.iconCls || 'icon-accept',
            cls: 'x-notification',
            autoHeight: true,
            plain: true,
            draggable: false,
            bodyStyle: 'text-align:center',
            padding: 5,
            header: false,
            shadow: false,
            'float': true
        });
        this.closedCallback = function () {};
        if (this.autoDestroy) {
            this.task = new Ext3.util.DelayedTask(this.hide, this);
        } else {
            this.closable = true;
        }
        Ext3.ux.Notification.superclass.initComponent.apply(this);
    },
    setMessage: function (msg) {
        this.body.update(msg);
    },
    setTitle: function (title, iconCls) {
        Ext3.ux.Notification.superclass.setTitle.call(this, title, iconCls || this.iconCls);
    },
    registerCallbackOnClosed: function (callback) {
        this.closedCallback = callback;
    },
    onDestroy: function () {
        Ext3.ux.NotificationMgr.notifications.remove(this);
        Ext3.ux.Notification.superclass.onDestroy.call(this);
        this.closedCallback();
    },
    cancelHiding: function () {
        this.addClass('fixed');
        if (this.autoDestroy) {
            this.task.cancel();
        }
    },
    afterShow: function () {
        Ext3.ux.Notification.superclass.afterShow.call(this);
        Ext3.fly(this.body.dom).on('click', this.cancelHiding, this);
    },
    animShow: function () {
        var pos = 120,
            i = 0,
            notifyLength = Ext3.ux.NotificationMgr.notifications.length;
        // save original body overflowY
        if (Ext3.ux.NotificationMgr.originalBodyOverflowY == null) {
            Ext3.ux.NotificationMgr.originalBodyOverflowY = document.body.style.overflowY;
        }


        document.body.style.overflow = 'hidden';

        this.setSize(this.width, 100);


        for (null; i < notifyLength; i += 1) {
            pos += Ext3.ux.NotificationMgr.notifications[i].getSize().height + 10;
        }

        Ext3.ux.NotificationMgr.notifications.push(this);

        this.el.alignTo(document.body, "br-br", [ -10, -pos ]);

        this.el.slideIn("b", {
            duration: 1.2,
            callback: this.afterShow,
            scope: this
        });
    },
    animHide: function () {
        this.el.ghost("t", {
            duration: 1.2,
            remove: false,
            callback : function () {
                Ext3.ux.NotificationMgr.notifications.remove(this);

                document.body.style.overflow = 'auto';

                this.destroy();
            }.createDelegate(this)
        });
    },
    focus: Ext3.emptyFn
});
