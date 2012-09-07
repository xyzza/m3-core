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

/**
 * Заместитель объекта LiveMessages.Notification, который выводит уведомление о полученных сообщениях от пользователей.
 */
Ext3.ux.MessageNotify = function () {
    this.eventHandler = {};
    this.handlerMapper = {
        socket: this.showMessage
    };
};

Ext3.ux.MessageNotify.prototype.on = function (event, handler) {
    var eventName;
    if (typeof event === 'string') {
        this.eventHandler[event] = handler;
    } else {
        for (eventName in event) {
            this.eventHandler[eventName] = event[eventName];
        }
    }
};

Ext3.ux.MessageNotify.prototype.handler = function (eventName, data) {
    var eventHandler = this.handlerMapper[eventName];
    if (eventHandler) {
        eventHandler.call(this, data);
    }
};

Ext3.ux.MessageNotify.prototype.showMessage = function (json) {
    var data = json[0];
    this.showNotify(data['id'], data['from_user'], data['subject'], data['text']);
};

Ext3.ux.MessageNotify.prototype.showNotify = function (id, user_name, subject, text) {
    var self = this, icon, notifyWindow;
    notifyWindow = new Ext3.ux.Notification({
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
Ext3.ux.TaskNotify = function () {
    this.drawRecords = {};
    this.eventHandler = {};
    this.handlerMapper = {
        socket: this.change
    };
};

var Child = function () {};
Child.prototype = Ext3.ux.MessageNotify.prototype;
Ext3.ux.TaskNotify.prototype = new Child();

Ext3.ux.TaskNotify.prototype.change = function (json) {
    var record,
        data = json[0];
        id = data['id'];

    if (record = this.drawRecords['task_' + id]) {
        if (record.active) {
            this.updateProgress(record['progressBar'], data['progress'], data['state']);
        } else {
            if (data['completed']) {
                this.showNotify(id, data['state'], data['name'], data['progress']);
            }
        }
    } else {
        this.drawRecords['task_' + id] = {
            id: id
        };
        this.showNotify(id, data['state'], data['name'], data['progress']);
    }
};

Ext3.ux.TaskNotify.prototype.showNotify = function (id, status, description, progress) {
    var self = this,
        icon,
        notifyWindow,
        progressBar,
        record = this.drawRecords['task_' + id];

    progressBar = new Ext3.ProgressBar({
        id: 'task-progress',
        width: 225,
        text: status
    });
    this.updateProgress(progressBar, progress, status);

    record['progressBar'] = progressBar;
    record['active'] = true;

    notifyWindow = new Ext3.ux.Notification({
        title: description || 'Внимание',
        items: [
            progressBar
        ],
        iconCls: icon,
        width: 250,
        padding: 5
    });

    notifyWindow.registerCallbackOnClosed(function () {
        record.active = false;
    });

    notifyWindow.show(document);
};

Ext3.ux.TaskNotify.prototype.updateProgress = function (progressBar, value, status) {
    progressBar.updateProgress(value / 100, status, true);
};