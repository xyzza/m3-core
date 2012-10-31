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

В секцию  *INSTALLED_APPS* добавляем::

    'livemessages',
    'livemessages.messages',
    'livemessages.tasks',

Данные экшены нужно зарегестрировать где-то в системе, поэтому нужно в любой из *app_meta.py* дописать
вызов *register_packs()*, который вернет паки с экшенами, например::

    def register_actions():
        controller.packs.extend([
            ...,
            ...,
        ] + register_packs())

Так же можно на основе существующих экшенов создать другие (свои) экшены, указав пути к ним в конфиге.

Вам нужно стартануть сервер HAProxy, например с конфигом, который имеется в папке с livemessage,
например вот так::

   $ /usr/local/sbin/haproxy -f ../env/livemessages/haproxy.config

Затем нужно запустить сервер отправки сообщений. Сделать это можно командой::

   $ python manage.py livemessage start

Если вы все сделали правильно, серверная часть готова к работе.

Разворачивание клиента
======================

Так как приложение ориентировалось под разные библиотеки, уровень модели в клиенте Живых сообщений отсутствует.

Статика подключается как в django 1.4, `документация по подключению статики. <https://docs.djangoproject.com/en/dev/ref/contrib/staticfiles/>`_

Чтобы использовать готовое приложение Живых сообщений в прикладном проекте, необходимо подключить модули::

    <!-- Подключается библиотека для работы с socket соединением -->
    <script type='text/javascript' src="{% static 'vendor/socket-io-client/socket.io.js' %}"></script>

    <!-- Подключается модуль живых сообщений -->
    <script type="text/javascript" src="{% static 'js/livemessages-opt.js' %}"></script>

    <!-- Подключается таблица стилей для живых сообщений -->
    <link rel='stylesheet' type='text/css' href="{% static 'css/live-messages.css' %}"/>

Из коробки.
LiveMessages предоставляет контроллеры::

    // контроллер сообщений
    LiveMessages.MessagesController

    // контроллер задач
    LiveMessages.TaskController

    // Оба контроллера являются наследниками абстрактного класса
    LiveMessages.AbstractController.

Подробнее о контроллерах смотри в :ref:`client`

и вьюшки::

    // Мини окно Сообщений
    LiveMessages.MessagesUI

    // Мини окно Задач
    LiveMessages.TasksUI

    // Всплывающее уведомление Сообщений
    LiveMessages.MessageNotify

    // Всплывающее уведомление Задач
    LiveMessages.TaskNotify

Запуск всех скриптов начинаается в *LiveMessages.Init*, он подписывает передаваемые ему контроллеры на соединение с сервером через WebSocket.
Контроллеры имеют обработчики которые подвешены на события транспорта WebSocket и Ajax запросов, при срабатывании события данные передаются соответствующему обрабтчику.
По умолчанию WebSocket дергает обработчик подвешенный на событие socket.

Пример инициализации системы живых сообщений::

    // В прикладном проекте после подключения необходимых библиотек,
    // в любом месте можем вызвать LiveMessages.Init и тем самым запустить в процесс клиентскую систему Живых сообщений.

    new LiveMessages.Init({

        // Инициализируется контроллер, автоматически подвешивается на постоянное соединение с сервером.

        messages: new LiveMessages.MessagesController({
            view: [

                // Инициализируется вьюшка, автоматически слушает события контроллера.

                new LiveMessages.MessagesUI({
                    'title'      : 'Полученные сообщения'
                }),
                new LiveMessages.MessageNotify()
            ],

            // скармливаем контроллер УРЛами для возможности ajax запросов.

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
                    'title'      : 'Задачи'
                }),
                new LiveMessages.TaskNotify()
            ],
            urlMapper: {
                'delete'  : "/roles/tasks/delete",
                'query'   : "/roles/tasks/all",
                'progress': "/roles/tasks/progress"
            }
        })
    });

.. note::
    Каждый контроллер должен подвесить обработчик на событие socket на который будет передан ответ от сервера.
    Данные будут в json формате.