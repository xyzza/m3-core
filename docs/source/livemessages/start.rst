**********************************
Быстрый старт
**********************************

Разворачивание сервера
======================

Скоро будет.

Разворачивание клиента
======================

Так как приложение ориентировалось под разные библиотеки, модель в клиенте Живых сообщений не была реализована.
Если необходима реализация модели, можно использовать любую MVC библиотеку.

Чтобы использовать готовое приложение Живых сообщений в своем прикладном проекте, можно подключить модули::

    <script type="text/javascript" src="{% static 'livemessages/js/live-messages-utils.js' %}"></script>
    <script type='text/javascript' src="{% static 'livemessages/js/store.js' %}"></script>
    <script type='text/javascript' src="{% static 'livemessages/js/abstract-controller.js' %}"></script>
    <script type='text/javascript' src="{% static 'livemessages/js/extjs-box.js' %}"></script>
    <script type='text/javascript' src="{% static 'livemessages/js/messages/extjs-ui.js' %}"></script>
    <script type='text/javascript' src="{% static 'livemessages/js/tasks/extjs-ui.js' %}"></script>
    <script type='text/javascript' src="{% static 'livemessages/js/messages/controller.js' %}"></script>
    <script type='text/javascript' src="{% static 'livemessages/js/tasks/controller.js' %}"></script>
    <script type='text/javascript' src="{% static 'socket-io-client/socket.io.js' %}"></script>
    <script type='text/javascript' src="{% static 'livemessages/js/init.js' %}"></script>
    <link rel='stylesheet' type='text/css' href="{% static 'livemessages/css/live-messages.css' %}"/>

Конфигурации для приложения находяться в файле **livemessages/js/init.js**

.. note::
    На клиенте точкой входа является **LiveMessages.Init**, он подписывает передаваемые ему контроллеры модулей на получение данных от сервера.

Пример из файла **init.js**::

    var live,
        container          = '#container',
        documentElement    = document.documentElement,
        clientWidth        = documentElement.clientWidth,
        clientHeight       = documentElement.clientHeight,

    // конфиги для мини окна сообщений.
        message_box_height = 300,
        message_box_width  = 230,
        message_top        = clientHeight - message_box_height - 150,
        message_left       = clientWidth - message_box_width - 300,
        message_hiddenY    = message_top,
        message_hiddenX    = clientWidth + 20,
        buttonMessage      = Ext.select('.bottom-toolbar .tray .messages'),
        countBox           = Ext.select('.messages-count'),

    // конфиги для мини окна задач.
        task_box_height    = 300,
        task_box_width     = 300,
        task_top           = clientHeight - task_box_height - 150,
        task_left          = clientWidth - task_box_width - 300,
        task_hiddenY       = task_top,
        task_hiddenX       = clientWidth + 20,
        buttonTask         = Ext.select('.bottom-toolbar .tray .tasks'),
        allTaskProgress    = Ext.select('.bottom-toolbar .tray .tasks .all-tasks-progress');

    live = new LiveMessages.Init({
        messages: new LiveMessages.MessagesController({
            view: [
                new LiveMessages.MessagesUI({
                    'container'  : container,
                    'width'      : message_box_width,
                    'height'     : message_box_height,
                    'class'      : 'messages',
                    'title_color': '#A2A2A2',
                    'left'       : message_left,
                    'top'        : message_top,
                    'title'      : 'Полученные сообщения',
                    'hiddenX'    : message_hiddenX,
                    'hiddenY'    : message_hiddenY,
                    'button'     : buttonMessage,
                    'countBox'   : countBox
                }),
                new Ext.ux.MessageNotify()
            ],
            urlMapper: {
                'delete'      : "/roles/messages/delete",
                'query'       : "/roles/messages/all",
                'read'        : "/roles/messages/read",
                'countNotRead': "/roles/messages/count-not-read"
            }
        }),

        tasks: new LiveMessages.TaskController({
            view: [
                new LiveMessages.TasksUI({
                    'container'  : container,
                    'width'      : task_box_width,
                    'height'     : task_box_height,
                    'class'      : 'tasks',
                    'title_color': '#A2A2A2',
                    'left'       : task_left,
                    'top'        : task_top,
                    'title'      : 'Задачи',
                    'hiddenX'    : task_hiddenX,
                    'hiddenY'    : task_hiddenY,
                    'button'     : buttonTask,
                    'progress'   : allTaskProgress
                }),
                new Ext.ux.TaskNotify()
            ],
            urlMapper: {
                'delete'  : "/roles/tasks/delete",
                'query'   : "/roles/tasks/all",
                'progress': "/roles/tasks/progress"
            }
        })
    });

.. note::
    Каждый контроллер должен иметь метод **handler** который будет принимать данные получаемые от сервера.