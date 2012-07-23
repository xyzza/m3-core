LiveMessages = {};

/**
 * Notification окна оповещения, создает цепочку окон оповещения с автоскрытием
 *  принимает аргументы
 *  title - заголовок,
 *  html - содержание,
 *  iconCls - иконка
 */
LiveMessages.NotificationMgr = {
    notifications: [],
    originalBodyOverflowY: null
};
LiveMessages.Notification = Ext.extend(Ext.Window, {
    initComponent: function () {
        // TODO: Параметры не перекрываются если наследоваться от этого объекта.
        Ext.apply(this, {
            iconCls: this.iconCls || 'icon-accept',
            cls: 'x-notification',
            autoHeight: true,
            plain: false,
            draggable: false,
            bodyStyle: 'text-align:center',
            padding: 5,
            header: false,
            shadow: false
        });
        if (this.autoDestroy) {
            this.task = new Ext.util.DelayedTask(this.hide, this);
        } else {
            this.closable = true;
        }
        LiveMessages.Notification.superclass.initComponent.apply(this);
    },
    setMessage: function (msg) {
        this.body.update(msg);
    },
    setTitle: function (title, iconCls) {
        LiveMessages.Notification.superclass.setTitle.call(this, title, iconCls || this.iconCls);
    },
    onDestroy: function () {
        LiveMessages.NotificationMgr.notifications.remove(this);
        LiveMessages.Notification.superclass.onDestroy.call(this);
    },
    cancelHiding: function () {
        this.addClass('fixed');
        if (this.autoDestroy) {
            this.task.cancel();
        }
    },
    afterShow: function () {
        LiveMessages.Notification.superclass.afterShow.call(this);
        Ext.fly(this.body.dom).on('click', this.cancelHiding, this);
        if (this.autoDestroy) {
            this.task.delay(this.hideDelay ? this.hideDelay * 1000 : 3 * 1000);
        }
    },
    animShow: function () {
        var pos = 40,
            i = 0,
            notifyLength = LiveMessages.NotificationMgr.notifications.length;

        // save original body overflowY
        if (LiveMessages.NotificationMgr.originalBodyOverflowY == null) {
            LiveMessages.NotificationMgr.originalBodyOverflowY = document.body.style.overflowY;
        }

        // if the body haven't horizontal scrollbar it should not appear
        if (document.body.clientHeight == document.body.scrollHeight) {
            document.body.style.overflowY = 'hidden';
        }

        this.setSize(this.width, 100);


        for (null; i < notifyLength; i += 1) {
            pos += LiveMessages.NotificationMgr.notifications[i].getSize().height + 10;
        }

        LiveMessages.NotificationMgr.notifications.push(this);

        this.el.alignTo(document.body, "br-br", [ -10, -pos ]);

        this.el.slideIn("b", {
            duration: 0.8,
            callback: this.afterShow,
            scope: this
        });
    },
    animHide: function () {
        this.el.ghost("t", {
            duration: 0.8,
            remove: false,
            callback : function () {
                LiveMessages.NotificationMgr.notifications.remove(this);

                if (LiveMessages.NotificationMgr.notifications.length == 0) {
                    document.body.style.overflowY = LiveMessages.NotificationMgr.originalBodyOverflowY;
                }

                this.destroy();
            }.createDelegate(this)
        });
    },
    focus: Ext.emptyFn
});

/**
 * Заместитель объекта LiveMessages.Notification, который выводит уведомление о полученных сообщениях от пользователей.
 */
LiveMessages.messageNotify = function (title, msg, icon) {
    new LiveMessages.Notification({
        title: title ||'Внимание',
        html: msg ||'Новое сообщение',
        iconCls: icon,
        width: 250,
        padding: 5
    }).show(document);
};

/**
 * Заместитель объекта LiveMessages.Notification, который выводит уведомление о выполненных задачах.
 */
LiveMessages.taskNotify = function (title, msg, icon) {
    new LiveMessages.Notification({
        title: title || 'Внимание',
        html: msg || 'Действие выполнено.',
        iconCls: icon,
        width: 250,
        padding: 5
    }).show(document);
};