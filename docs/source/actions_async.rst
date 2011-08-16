.. _actions_async:

Асинхронные экшены и фоновые операции
=====================================

Введение
--------

Часто на практике нам приходиться осуществлять некие операции, длительность исполнения которых превышает "разумные"
(превышающие таймаут реквеста) пределы. К примеру, это могут быть импорт/экспорт, выборки данных, построение отчетов,
вычисление числа "ПИ" до 100500 знака, брутфорс пароля на сервер и так далее. С точки зрения разработчика обычно
нет никаких проблем с тем, чтобы написать код и запустить его в экшене - пишем, запускаем, ждем пока код выполниться.
С точки зрения пользователя, после того как он запустил долгую операцию, сессия отваливается, бедняга видит таймаут запроса,
думает что что-то пошло не так, перезагружает компьютер,
пытается запустить еще раз, расстраивается, звонит в техподдержку, ругается...

Для того чтобы максимально просто и безопасно решать такой набор задач, сохраняя время разработчикам и
нервы пользователям, представляем вашему вниманию набор классов для фоновых операций, выполняющихся в отдельном потоке
с обновлением UI

Классы
------

.. module:: m3.ui.actions.async

.. autoclass:: IBackgroundWorker
   :members:

.. autoclass:: AsyncAction

.. module:: m3.ui.ext.misc.background_operation

.. autoclass:: BackgroundOperationBar

Пример реализации
--------------------

Предположим, мы работаем над веб-интерфейсом для управления запуском межконтинентальных баллистических ракет.
Допустим что время полета ракеты 2 минуты, для того чтобы пользователи системы могли наглядно видеть в каком состоянии
находиться процесс, реализуем фоновую операцию.

В actions.py::

    class MissleLaunch(IBackgroundWorker):

    def start(self):
        super(MissleLaunch, self).start()
        return AsyncOperationResult(text = u'Поехали!')

    def run(self):
        self._time_total = 120 #в секундах
        self._time_elapsed = 0
        self._is_active = True

        while self._is_active:
            time.sleep(2)
            self._time_elapsed += 2
            if self._time_elapsed >= self._time_total:
                self._is_active = False

        self._is_active = False

    def stop(self):
        self._is_active = False
        return AsyncOperationResult(text = u'Полет отменен')

    def ping(self):
        progress = (self._time_elapsed / float(self._time_total))
        if progress >= 1:
            text = u'Кабуууум!'
        else:
            text = u'Полет завершен на ' + str(progress*100) +'%'
        return AsyncOperationResult(value = progress, text = text,
                                    is_active=self._is_active)

    def is_active(self):
        return self._is_active

    class TheAsyncAction(AsyncAction):
        url = '/async'
        shortname = 'async_action'
        worker_cls = MissleLaunch


Создадим визуальное отображение в ui.py::

    class CommanderWindow(ExtEditWindow):

    def __init__(self, *args, **kwargs):
        super(CommanderWindow, self).__init__(*args, **kwargs)
        self.layout = 'fit'
        self.template_globals = 'commander-window.js'
        self.form = ExtForm()
        self.items.append(self.form)
        self.width = 700
        self.height = 500

        self.foo = BackgroundOperationBar(label = u'Время полета', text = u'К полету готов', value = 0.0, interval = 3000,
                                          url = get_acton_url('async_action'))
        self.form.items.append(self.foo)

        start_btn = ExtButton(text=u'Start', handler='start')
        self.buttons.append(start_btn)

        ping_btn = ExtButton(text=u'Ping', handler='ping')
        self.buttons.append(ping_btn)

        stop_btn = ExtButton(text=u'Stop', handler='stop')
        self.buttons.append(stop_btn)

И обработчики кнопок в 'commander-window.js'::

    var progress = Ext.getCmp('{{ component.foo.client_id }}');

    function start(){
        progress.start();
    }

    function stop() {
        progress.stop();
    }

    function ping() {
        progress.ping();
    }

