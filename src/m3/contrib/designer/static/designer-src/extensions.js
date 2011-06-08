/**
 * User: kirs
 * Date: 31.05.11
 * Time: 15:20
 */


Ext.namespace("Ext.ux");

Ext.ux.NotificationMgr = {
notifications: [],
originalBodyOverflowY: null
};
/**
 * Notification окна оповещения, создает цепочку окон оповещения с автоскрытием
 *  принимает аргументы
 *  title - заголовок,
 *  html - содержание,
 *  iconCls - иконка
 */
Ext.ux.Notification = Ext.extend(Ext.Window, {
    initComponent: function(){
        Ext.apply(this, {
            iconCls: this.iconCls || 'icon-information',
            cls: 'x-notification',
            width: 200,
            autoHeight: true,
            plain: false,
            draggable: false,
            shadow:false,
            bodyStyle: 'text-align:center',
            padding: 5
        });
        if(this.autoDestroy) {
            this.task = new Ext.util.DelayedTask(this.hide, this);
        } else {
            this.closable = true;
        }
        Ext.ux.Notification.superclass.initComponent.apply(this);
    },
    setMessage: function(msg){
        this.body.update(msg);
    },
    setTitle: function(title, iconCls){
        Ext.ux.Notification.superclass.setTitle.call(this, title, iconCls||this.iconCls);
    },
    onDestroy: function(){
        Ext.ux.NotificationMgr.notifications.remove(this);
        Ext.ux.Notification.superclass.onDestroy.call(this);
    },
    cancelHiding: function(){
        this.addClass('fixed');
        if(this.autoDestroy) {
            this.task.cancel();
        }
    },
    afterShow: function(){
        Ext.ux.Notification.superclass.afterShow.call(this);
        Ext.fly(this.body.dom).on('click', this.cancelHiding, this);
        if(this.autoDestroy) {
            this.task.delay(this.hideDelay ? this.hideDelay*1000 : 3*1000);
       }
    },
    animShow: function() {
		// save original body overflowY
		if (Ext.ux.NotificationMgr.originalBodyOverflowY == null)
		{
			Ext.ux.NotificationMgr.originalBodyOverflowY = document.body.style.overflowY;
		}

		// if the body haven't horizontal scrollbar it should not appear
		if (document.body.clientHeight == document.body.scrollHeight)
		{
			document.body.style.overflowY = 'hidden';
		}

        this.setSize(200, 100);
        pos = -5;

		for (var i = 0; i < Ext.ux.NotificationMgr.notifications.length; i++)
		{
			pos += Ext.ux.NotificationMgr.notifications[i].getSize().height + 15;
		}

        Ext.ux.NotificationMgr.notifications.push(this);

        this.el.alignTo(document.body, "tr-tr", [ -20, pos ]);

        this.el.slideIn("t", {
            duration: .5,
            callback: this.afterShow,
            scope: this
        });
    },
    animHide: function(){
        this.el.ghost("t", {
            duration: .8,
            remove: false,
            callback : function () {
                Ext.ux.NotificationMgr.notifications.remove(this);

				if (Ext.ux.NotificationMgr.notifications.length == 0)
				{
					document.body.style.overflowY = Ext.ux.NotificationMgr.originalBodyOverflowY;
				}

                this.destroy();
            }.createDelegate(this)

        });
    },
    focus: Ext.emptyFn
});
