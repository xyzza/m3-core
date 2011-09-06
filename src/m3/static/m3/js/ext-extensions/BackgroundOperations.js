/**
 * Crafted by ZIgi
 */

Ext.ns('Ext.m3');

/**
 * @class Ext.m3.BackgroundOperationProxy Класс обеспечивающий интерфейс для
 * опроса сервера с заданным интервалом. При получении данных срабатывает событие update, в качестве
 * аргумента к событию передается объект следуеющего вида
 * {
 *     value:0.3, //текущий прогресс от 0 до 1
 *     isActive: true, // производиться ли операция на серврере
 *     text:'' // строка сообщение с сервера
 * }
 */
Ext.m3.BackgroundOperationProxy = Ext.extend(Ext.util.Observable, {
    /**
     * @cfg {String} адрес сервера для комуникации
     */
    url:'/',
    
    /**
     * @cfg {Number} промежуток в мс между опросами сервера
     */
    interval:1000,

    /**
     * @cfg {String} Название парамтетра с командой серверу
     */
    commandParam:'command',

    constructor:function(cfg) {
        Ext.apply(this, cfg);
        Ext.m3.BackgroundOperationProxy.superclass.constructor.call(this);

        //таск раннер - класс выполняющий некую функцию в бескончено цикле с заданным интервалом
        this.taskRunner = new Ext.util.TaskRunner();
        this.task = {
            run:this.wait,
            interval:this.interval,
            scope:this
        };

        this.isRunning = false;

        this.addEvents('update');
    },

    /**
     * @public Команда старта операции
     */
    start:function() {
        this.doRequest('start', this.run);
    },

    /**
     * @public Команда остановки операции
     */
    stop:function() {
        this.stopWaiting();
        this.doRequest('stop', function(response) {
            this.fireEvent('update', this.parseResponse(response));
        });
    },

    /**
     * @public Команда проверки прогресса
     */
    ping:function() {
        this.doRequest('ping', this.run);
    },

    /**
     * @private Запуск цикла опроса
     */
    run:function(response) {
        if (!this.isRunning) {
            this.isRunning = true;
            this.taskRunner.start( this.task);
        }

        this.fireEvent('update', this.parseResponse(response));
    },

    /**
     * @private Остановка цикла опроса
     */
    stopWaiting:function() {
        if (this.isRunning) {
            this.isRunning = false;
            this.taskRunner.stop(this.task);
        }
    },

    /**
     * @private Обработка ответа сервера
     */
    waitCallback:function(response) {
        var responseObj = this.parseResponse(response);
        if (!responseObj.isActive) {
            this.stopWaiting();
        }

        this.fireEvent('update',responseObj);
    },

    /**
     * @private Это функция запускается в бексонечном цикле
     */
    wait:function() {
        this.doRequest('ping', this.waitCallback);
    },

    /**
     * @private Запрос на сервер
     */
    doRequest:function(command,successCallback) {
        var params = {};
        params[this.commandParam] = command;

        Ext.Ajax.request({
            url:this.url,
            success:successCallback,
            failure:this.requestError,
            scope:this,
            params: params
        });
    },

    /**
     * @private Обработка серверной ошибки
     */
    requestError:function(response, opts) {
        this.stopWaiting();
        if (window.uiAjaxFailMessage) {
            window.uiAjaxFailMessage(response,opts);
        }
    },

    /**
     * @public Вызывает для очистки ресурсов
     */
    destroy:function() {
        this.taskRunner.stopAll();
    },

    /**
     * @private Преобразование ответа сервера
     */
    parseResponse:function(response) {
        return Ext.util.JSON.decode(response.responseText);
    }
});

/**
 * @class Ext.m3.BackgroundOperationBar
 * Экстовый прогресс бар, с привязаным к нему прокси. Интерфейс комуникации с сервером:
 * start(), stop(), ping()
 */
Ext.m3.BackgroundOperationBar = Ext.extend(Ext.ProgressBar, {

    /**
     * @cfg {String} Урл
     */
    url:'/',

    /**
     * @cfg {Number} Интервал опроса
     */
    interval:1000,

    initComponent:function() {
        Ext.m3.BackgroundOperationBar.superclass.initComponent.call(this);
        this.serverProxy = new Ext.m3.BackgroundOperationProxy({
            url:this.url,
            interval:this.interval
        });

        //mon вместо on чтобы функция хендлер уничтожалась вместе с объектом прогрес бара
        this.mon(this.serverProxy, 'update', this.onUpdate, this);
        this.on('destroy', this.onDestroy)
    },

    ping:function() {
        this.serverProxy.ping();
    },

    start:function() {
        this.serverProxy.start();
    },

    stop:function() {
        this.serverProxy.stop();
    },

    onUpdate:function(obj) {
        this.updateProgress( obj.value,obj.text );
    },

    onDestroy:function() {
        this.serverProxy.destroy();
    }
});