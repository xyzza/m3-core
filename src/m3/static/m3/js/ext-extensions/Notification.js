Ext.namespace('Ext.ux');

/**
 * Notification окна оповещения, создает цепочку окон оповещения с автоскрытием
 *  принимает аргументы
 *  title - заголовок,
 *  html - содержание,
 *  iconCls - иконка
 */
Ext.ux.NotificationMgr = {
    notifications: [],
    originalBodyOverflowY: null
};
Ext.ux.Notification = Ext.extend(Ext.Window, {
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
        this.closedCallback = function () {};
        if (this.autoDestroy) {
            this.task = new Ext.util.DelayedTask(this.hide, this);
        } else {
            this.closable = true;
        }
        Ext.ux.Notification.superclass.initComponent.apply(this);
    },
    setMessage: function (msg) {
        this.body.update(msg);
    },
    setTitle: function (title, iconCls) {
        Ext.ux.Notification.superclass.setTitle.call(this, title, iconCls || this.iconCls);
    },
    registerCallbackOnClosed: function (callback) {
        this.closedCallback = callback;
    },
    onDestroy: function () {
        Ext.ux.NotificationMgr.notifications.remove(this);
        Ext.ux.Notification.superclass.onDestroy.call(this);
        this.closedCallback();
    },
    cancelHiding: function () {
        this.addClass('fixed');
        if (this.autoDestroy) {
            this.task.cancel();
        }
    },
    afterShow: function () {
        Ext.ux.Notification.superclass.afterShow.call(this);
        Ext.fly(this.body.dom).on('click', this.cancelHiding, this);
    },
    animShow: function () {
        var pos = 120,
            i = 0,
            notifyLength = Ext.ux.NotificationMgr.notifications.length;
        // save original body overflowY
        if (Ext.ux.NotificationMgr.originalBodyOverflowY == null) {
            Ext.ux.NotificationMgr.originalBodyOverflowY = document.body.style.overflowY;
        }


        document.body.style.overflow = 'hidden';

        this.setSize(this.width, 100);


        for (null; i < notifyLength; i += 1) {
            pos += Ext.ux.NotificationMgr.notifications[i].getSize().height + 10;
        }

        Ext.ux.NotificationMgr.notifications.push(this);

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
                Ext.ux.NotificationMgr.notifications.remove(this);

                document.body.style.overflow = 'auto';

                this.destroy();
            }.createDelegate(this)
        });
    },
    focus: Ext.emptyFn
});

/**
 * Заместитель объекта LiveMessages.Notification, который выводит уведомление о полученных сообщениях от пользователей.
 */
Ext.ux.MessageNotify = function () {
    this.eventHandler = {};
    this.handlerMapper = {
        socket: this.showMessage
    };
};

Ext.ux.MessageNotify.prototype.on = function (event, handler) {
    var eventName;
    if (typeof event === 'string') {
        this.eventHandler[event] = handler;
    } else {
        for (eventName in event) {
            this.eventHandler[eventName] = event[eventName];
        }
    }
};

Ext.ux.MessageNotify.prototype.handler = function (eventName, data) {
    var eventHandler = this.handlerMapper[eventName];
    if (eventHandler) {
        eventHandler.call(this, data);
    }
};

Ext.ux.MessageNotify.prototype.showMessage = function (data) {
    this.showNotify(data['id'], data['from_user'], data['subject'], data['text']);
};

Ext.ux.MessageNotify.prototype.showNotify = function (id, user_name, subject, text) {
    var self = this, icon, notifyWindow;
    notifyWindow = new Ext.ux.Notification({
        title: user_name || 'Внимание',
        html: '<div class="notify">' +
                '<div class="notify-icon-info"></div>' +
                '<div class="message"><b>' + subject + '</b></br>' + text + '</div>' +
              '</div>',
        iconCls: icon,
        width: 250,
        padding: 5
    });

    notifyWindow.task.delay(6 * 1000); // Скрывает плавно уведомление через 6 сек.

    notifyWindow.show(document);
};
/**
 * Заместитель объекта LiveMessages.Notification, который выводит уведомление о выполненных задачах.
 */
Ext.ux.TaskNotify = Ext.extend(Ext.ux.MessageNotify, {
    initComponent: function () {
        this.drawRecords = {};
    },

    change: function (id, data) {
        var record;

        if (record = this.drawRecords['task_' + id]) {
            if (record['active']) {
                this.updateProgress(record['progressBar'], data['progress'], data['state']);
            } else {
                this.showNotify(id, data['state'], data['name']);
            }
        } else {
            this.drawRecords['task_' + id] = {
                id: id
            };
            this.showNotify(id, data['state'], data['name']);
        }
    },

    showNotify: function (id, status, description) {
        var self = this, icon, notifyWindow, progressBar;

        progressBar = new Ext.ProgressBar({
            id: 'task-progress',
            width: 220,
            text: description
        });

        this.drawRecords['task_' + id]['progressBar'] = progressBar;
        this.drawRecords['task_' + id]['active'] = true;

        notifyWindow = new Ext.ux.Notification({
            title: status || 'Внимание',
            items: progressBar,
            iconCls: icon,
            width: 250,
            padding: 5
        });

        notifyWindow.registerCallbackOnClosed((function (_id) {
            return function () {
                self.drawRecords['task_' + _id]['active'] = false;
            }
        })(id));

        notifyWindow.show(document);
    },

    updateProgress: function (progressBar, value, status) {
        progressBar.updateProgress(value, status, true);
    }
});