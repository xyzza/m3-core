/**
 * Crafted by ZIgi
 */

Ext.ns('Ext.m3');

Ext.m3.BackgroundOperationProxy = Ext.extend(Ext.util.Observable, {
    /**
     * @cfg {String} адрес сервера для комуникации
     */
    url:'/',
    
    /**
     * @cfg {Number} промежуток в мс для опроса сервера
     */
    interval:5000,

    COMMAND_PARAM:'command',

    START:0,

    STOP:1,

    PING:2,

    constructor:function(cfg) {
        Ext.apply(this, cfg);
        Ext.m3.BackgroundOperationProxy.superclass.constructor.call(this);

        this.taskRunner = new Ext.util.TaskRunner();
        this.task = {
            run:this.wait,
            interval:this.interval,
            scope:this
        };

        this.isRunning = false;

        this.addEvents('update');
    },

    start:function() {
        this.doRequest(this.START, this.run);
    },

    stop:function() {
        this.stopWaiting();
        this.doRequest(this.STOP, function(response) {
            this.fireEvent('update', this.parseResponse(response));
        });
    },

    run:function(response, opts) {
        if (!this.isRunning) {
            this.isRunning = true;
            this.taskRunner.start( this.task);
        }
    },

    stopWaiting:function() {
        if (this.isRunning) {
            this.isRunning = false;
            this.taskRunner.stop(this.task);
        }
    },


    ping:function(response, opts) {
        var responseObj = this.parseResponse(response);
        if (!responseObj.isActive) {
            this.stopWaiting();
        }
        this.fireEvent('update',responseObj);
    },

    wait:function() {
        //console.log('on wait');
        this.doRequest(this.PING, this.ping);
    },

    doRequest:function(command,successCallback) {
        var params = {};
        params[this.COMMAND_PARAM] = command;

        Ext.Ajax.request({
            url:this.url,
            success:successCallback,
            failure:this.requestError,
            scope:this,
            params: params
        });
    },

    requestError:function(response, opts) {
        this.stopWaiting();
        //TODO показывать ошибку
    },

    parseResponse:function(response) {
        return Ext.util.JSON.decode(response.responseText);
    }
});

Ext.m3.BackgroundOperationBar = Ext.extend(Ext.ProgressBar, {

    url:'/domain/test/async',
    interval:5000,

    initComponent:function() {
        //TODO написать деструктор который будет грохать прокси объект при уничтожении прогресс бара
        Ext.m3.BackgroundOperationBar.superclass.initComponent.call(this);
        this.serverProxy = new Ext.m3.BackgroundOperationProxy({
            url:this.url,
            interval:this.interval
        });

        this.mon(this.serverProxy, 'update', this.onUpdate, this);
    },
    start:function() {
        this.serverProxy.start();
    },
    stop:function() {
        this.serverProxy.stop();
    },
    onUpdate:function(obj) {
        this.updateProgress( obj.value,obj.text );
    }
});