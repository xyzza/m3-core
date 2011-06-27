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
            width: 250,
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

        this.setSize(this.width, 100);
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

/**
 * Кастомный селект филд
 * Базовый класс
**/
Ext.ux.SelectField = Ext.extend(Ext.form.TwinTriggerField, {
    initComponent : function(){
        Ext.app.form.SearchField.superclass.initComponent.call(this);
        this.on('specialkey', function(f, e){
            if(e.getKey() == e.ENTER){
                this.onTrigger2Click();
            }
        }, this);
    }
    ,validationEvent:false
    ,validateOnBlur:false
    ,trigger1Class: 'x-form-clear-trigger'
    ,trigger2Class: 'x-form-edit-trigger'
    ,hideTrigger1:true
    ,hasSelect : false
    ,listeners:{
        beforeshow: function(){
            if (this.getValue()) this.triggers[0].show();
        }
    }
    ,onTrigger1Click : function(){
        if(!this.hasSelect){
        	this.reset();
	        this.triggers[0].hide();
	        this.hasSelect = false;
            //Вызываем сторонюю функцию
            this.clear();
        }
    }
    ,onTrigger2Click : function(){
        var value = this.getRawValue();
        if (value) {
        	this.hasSelect = true;
	    	this.triggers[0].show();
        }
        //Вызываем сторонюю функцию
        this.select(value);
    }
    //Точки расширения
    ,clear : function(){}
    ,select: function(){}
});

/**
 * Селект филд для templateGlobals
 * добавлен фукнционал к обработчику выбора
 */
Ext.ux.templateGlobalsSelectField = Ext.extend(Ext.ux.SelectField,{
    regexText: 'Расширния файла должно быть *.js',
    invalidText:'Поле не прошло валидацию',
    regex: /^\S+\.(js)$/i,
    select:function(value){
        var tabPanel = Ext.getCmp('tab-panel'),
            path = tabPanel.getActiveTab().path;
        if (!value){
             // Создадим файл на сервере (templates/ui-js/имяфайла),
             // если все в порядке присвоим * полю имя файла, и выведим Notification
            Ext.MessageBox.prompt('Создание templateGlobals', 'Введите имя файла',
                function(btn, text){
                    if (btn == 'ok' && this.regex.test(text)){
                        M3Designer.Requests.fileGTGetContent(path, text, tabPanel, true);
                        this.setValue(text);
                    }
                    else if(text){
                        M3Designer.Utils.failureMessage({"message": this.regexText})
                    }
                },
            this);
        }else{
             // Если есть имя templateGlobals файла, выполним запрос
             // если все ок, добавим новый таб в таб панель

             //Запрос содержимого файла по path на сервере
            if (path && value){
                M3Designer.Requests.fileGTGetContent(path, value, tabPanel);
            }
        }
    }
});