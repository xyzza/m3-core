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
            plain: false,
            draggable: false,
            bodyStyle: 'text-align:center',
            padding: 5,
            header: false,
            shadow: false
        });
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
    onDestroy: function () {
        Ext3.ux.NotificationMgr.notifications.remove(this);
        Ext3.ux.Notification.superclass.onDestroy.call(this);
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
        if (this.autoDestroy) {
            this.task.delay(this.hideDelay ? this.hideDelay * 1000 : 6 * 1000);
        }
    },
    animShow: function () {
        var pos = 40,
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

/**
 * Заместитель объекта LiveMessages.Notification, который выводит уведомление о полученных сообщениях от пользователей.
 */
Ext3.ux.MessageNotify = function () {
    this.handler = null;
    this.handlerContext = null;
};

Ext3.ux.MessageNotify.prototype.setClickHandler = function (handler, context) {
    this.handler = handler;
    this.handlerContext = context || window;
};

Ext3.ux.MessageNotify.prototype.showNotify = function (id, user_name, subject, text) {
    var self = this, icon, notifyWindow;
    notifyWindow = new Ext3.ux.Notification({
        title: user_name || 'Внимание',
        html: '<div class="notify">' +
                '<div class="message"><b>' + subject + '</b></br>' + text + '</div>' +
              '</div>',
        iconCls: icon,
        width: 250,
        padding: 5
    });

    notifyWindow.on({
        'click': (function (_id) {
            return function () {
                self.handler.apply(self.handlerContext, _id);
            }
        })(id)
    });

    notifyWindow.show(document);
};
/**
 * Заместитель объекта LiveMessages.Notification, который выводит уведомление о выполненных задачах.
 */
Ext3.ux.TaskNotify = Ext3.extend(Ext3.ux.MessageNotify, {
    initComponent: function () {
        Ext3.ux.TaskNotify.superclass.initComponent.apply(this);
    },
    showNotify: function (id, status, description) {
        var self = this, icon, notifyWindow;
        notifyWindow = new Ext3.ux.Notification({
            title: status || 'Внимание',
            html: '<div class="notify">' +
                        '<div class="task-description">' + description + '</div>' +
                  '</div>',
            iconCls: icon,
            width: 250,
            padding: 5
        });

        notifyWindow.on({
            'click': (function (_id) {
                return function () {
                    self.handler.apply(self.handlerContext, _id);
                }
            })(id)
        });

        notifyWindow.show(document);
    }
});