**********************************
Обзор
**********************************

Livemessage - система живых сообщений, предназначена для уведомления браузера сервером через вебсокеты и не только.
В качестве транспорта используется популярная библиотека для работы с вебсокетами
`Socket.IO <http://socket.io/>`_. Также необходимо использовать веб-сервер,
который поддерживает веб-сокеты, а именно `RFC6455 <http://tools.ietf.org/html/rfc6455>`_

`Говорят <http://trac.nginx.org/nginx/roadmap>`_, что в nginx 1.3.x  появится поддержка вебсокетов. Пока что с
уществует модуль для nginx, который включает поддержку вебсокетов, но в продакшене его использовать не рекомендуют.

В данный момент предлагается использовать `HAProxy <http://haproxy.1wt.eu/>`_,
который ставивиться перед веб-сервером и работает на уровне TCP.
HAProxy не работает с win решениями.

В остальном модуль livemessage - легкорасширяемый контриб для М3 как на сервере так и на клиенте.
Вся реализация работает ассинхронно как с PostgreSQL, так и с RabbitMQ.

Разворачивание сервера
======================

Возможные параметры в project.conf::

     [livemessages]
     # Порт для Торнадо
     #PORT = 7777
     # Минимальное количество соединений для асинхронного postgres
     #POSTGRES_MINCON = 1
     # Максимальное количество соединений для асинхронного postgres
     #POSTGRES_MAXCON = 20
     # Таймаут для асинхронного postgres
     #POSTGRES_CLEANUP_TIMEOUT = 10
     # Хост, где настроен rabbitmq
     #BROKER_HOST = localhost

и settings.py параметры::

    LIVEMESSAGES_PORT = conf.get_int('livemessages', 'PORT')

    # Минимальное время соединения с постгресом
    LIVEMESSAGES_POSTGRES_MINCON = conf.get_int('livemessages', 'POSTGRES_MINCON')

    # Максимальное время соединения с постгресом
    LIVEMESSAGES_POSTGRES_MAXCON = conf.get_int('livemessages', 'POSTGRES_MAXCON')

    #
    LIVEMESSAGES_POSTGRES_CLEANUP_TIMEOUT = conf.get_int('livemessages', 'POSTGRES_CLEANUP_TIMEOUT')

    # Хост на котором расположен RabbitMQ
    LIVEMESSAGES_BROKER_HOST = conf.get('livemessages', 'BROKER_HOST')

    LIVEMESSAGES_ACTIONS = {
        'messages':{
            'read': 'livemessages.messages.actions.MessageReadAction',
            'delete': 'livemessages.messages.actions.MessageDeleteAction',
            'all': 'livemessages.messages.actions.MessageAllAction',
            'not-read-count':'livemessages.messages.actions.CountNotReadMessagesAction',
            'sender': 'livemessages.core.handlers.MessageHandler',
            },
        'tasks':{
            'delete': 'livemessages.tasks.actions.TaskDeleteAction',
            'all': 'livemessages.tasks.actions.TaskAllAction',
            'progress-count':'livemessages.tasks.actions.TaskProgressCountAction',
            'sender': 'livemessages.core.handlers.TaskHandler',
            }
    }

Обязательным параметром является только *LIVEMESSAGES_ACTIONS*, который декларирует какие подсистемы работы
с вебсокетами и какие обработчики используются внутри этих систем.

Данные экшены нужно зарегестрировать где-то в системе, поэтому нужно в любой из *app_meta.py* дописать
вызов *register_packs()*, который вернет паки с экшенами, например::

    def register_actions():
        controller.packs.extend([
            ...,
            ...,
        ] + register_packs())

Так же можно на основе существующих экшенов создать другие (свои) экшены, указав пути к ним в конфиге.
Если вы все сделали правильно, серверная часть готова к работе.

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