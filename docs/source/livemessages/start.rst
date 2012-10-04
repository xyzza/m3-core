**********************************
Быстрый старт
**********************************

Разворачивание сервера
======================

Скоро будет.

Разворачивание клиента
======================

.. note::

На клиенте точкой входа яв-ся **LiveMessages.Controller**, он подписывает передаваемые ему контроллеры на получение данных от сервера.

.. note::
    Каждый контроллер должен иметь метод **handler** который будет принимать данные получаемые от сервера.

Для вывода получаемых данных пользователю, можно скормить контроллеры массивом с неограниченным количеством UI.

.. note::
    Необходимо задать ключевое имя **view** передаваемому массиву.

Пример::

    new LiveMessages.Controller({
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
                    'hiddenY'    : message_hiddenY
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
                    'hiddenY'    : task_hiddenY
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

**urlMapper** яв-ся конфигом для аякс запросов.