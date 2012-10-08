**********************************
Подробное описание клиента
**********************************

Клиентская часть разрабатывалась с такой целью чтобы можно было использовать LiveMessages с разными JavaScript библиотеками.

Пространство имен приложения живых сообщений называется **LiveMessages**.

Общий обзор
===========

**LiveMessages.AjaxWrapper** - Обертка для механизма аякс запросов, мы можем использовать внутри обертки любую библиоткеку для запросов на сервер.

**LiveMessages.Controller** - точка входа приложения, Инициализация всех контроллеров и подписка их на получение данных от сервера через Socket.IO

**LiveMessages.AbstractController** - абстрактный контроллер приложения, в котором есть общие механизмы:

- **ajaxControl** отправка ajax при возникновении события.
- **handler** обработчик получаемого сообщения от сервера.
- **sendDataToView** механизм передачи данных во вьюшки. Передает имя события и аргумент даты. Соответсвенно вьюшка сама решает как реагировать на это событие и обработать данные.
- **afterHandler** вызывается после **handler** и передается туда массив полученных сообщений.

**LiveMessages.ExtBox** - абстрактный класс для миниокон, реализован на ExtJs. имеет общие реализации:

- **handler** обработка передаваемых данных контролером, наличие этого метода обязательна, т.к. она предоставляет API для контроллера!
- **showBox** раскрыть миниокно.
- **hideBox** скрыть миниокно.

Разработка своего модуля
========================

Для разработки своего модуля Живых сообщений, можно унаследовать от абстрактного класса LiveMessages.AbstractController все методы и поля.
Назовем пример модуля именем Example, контроллер этого модуля LiveMessages.ExampleController и вьюшка будет называться LiveMessages.ExampleUI.
Создадим папку example и два файла в нем с именами controller.js и ui.js.

Соотвествено в controller.js будет описан скрипт контроллера, а в ui.js скрипт представления.

Произведем наследование от абстрактного класса::

    LiveMessages.ExampleController = LiveMessages.extend(LiveMessages.AbstractController, {
        init: function (settings) {
            LiveMessages.AbstractController.prototype.init.call(this, settings);
            // Обязательно нужно вызвать конструктор родителя чтобы получить все поля и свойства и необходимую инициализацию класса.
        }
    });

Реализуем обработчики успешных ответов от сервера::

    // Обработчик события удаления сообщения
    messageDelete: function (event, response, id) {
        if (response['success']) {
            this.sendDataToView(event, id);
        }
    }

    // Обработчик события чтения сообщения.
    messageRead: function (event, response, id) {
        if (response['success']) {
            this.sendDataToView(event, id);
        }
    }

    // Передается во вьюхи информация о непрочитанных сообщениях.
    messageNotReadCount: function (event, response) {
        this.sendDataToView(event, response['count']);
    }

.. note::
    Это нужно для того чтобы контроллер знал как обработать поступившие данные и передать их во вьюху.

Чтобы механизм Ajax запроса знал по какому пути выполнять запрос при конкретных событиях, необходимо прописать карту запроса.

    urlMapper: {
        'delete'      : "/roles/messages/delete",
        'query'       : "/roles/messages/all",
        'read'        : "/roles/messages/read",
        'countNotRead': "/roles/messages/count-not-read"
    }

Так как механизм ajax запроса единственный на все приложение, она принимает аргументами имя события и дополнительные аргументы влияющие на запрос.
Чтобы при успешном запросе, механизм мог понять при каком событии какой обработчик вызывать, необходимо прописать в _handlerMapper соответствующий обработчик на соответсвующее событие::

    this._handlerMapper = {
        'delete': this.messageDelete,
        'query': this.handler,
        'read': this.messageRead,
        'countNotRead': this.messageNotReadCount
    };

Можно прописать параметры запроса по умолчанию::

    this._eventDefaultParams = {
        'delete': {
            id: null
        },
        'query': {
            start: 0,
            limit: 25
        },
        'read': {
            id: null
        },
        'countNotRead': {}
    }

И необходимо в контроллере подписаться на события вьюшек::

    while (i < length) {
        view[i].on({
            'delete': function (id) {
                // Обработчик события удаления.
            },
            'read': function (id) {
                // Обработчик события чтения сообщения
            },
            'query': function (start, limit) {
                // Обработчик запроса на получение необходимого количества сообщений.
            },
            'countNotRead': function () {
                // Обработчик запроса количества непрочитанных сообщений.
            }
        });
        i++;
    }

