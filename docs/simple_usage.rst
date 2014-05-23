Простое использование
=====================

Класс Action и его использование
++++++++++++++++++++++++++++++++

Пример экшена, который читает даннные из POST'а. Проверяет значение C и сохраняет в БД значения A и B. Код::
    
    from m3.ui.actions import Action
    from m3.ui.actions.results import OperationResult
    ...
    
    class MyFirstAction(Action):
        url = 'save'
        verbose_name = u'Сохранение данных'
        short_name = 'my-first-action-alias'
        
        def pre_run(self, request, context):
            """ pre_run удобно использовать для начальных проверок """
            value = request.POST.get('C')
            if value < 0:
                # Обработка запроса на этом прерывается
                return OperationResult(success=False, message=u'Недопустимое значение')
                
        def run(self, request, context):
            """ Основная работа экшена производится здесь """
            a = request.POST.get('A')
            b = request.POST.get('B')
            SomeModel.objects.create(a=a, b=b)
            return OperationResult(message=u'Данные сохранены')

OperationResult это один из возможных результатов работы экшена, который автоматически преобразуется в Django HttpResponse внутри контроллера. В нашем случае класс  *OperationResult* указывает успешно ли завершилась операция *success* и несет соответствующее сообщение *message*.


Класс ActionPack и его использование
++++++++++++++++++++++++++++++++++++

Экшены и паки входящие внутрь нашего пака задаются с помощью атрибутов *actions* и *subpacks*. Пример::
    
    from m3.ui.actions import ActionPack
    
    class MyFormActionPack(ActionPack):
        def __init__(self):
            super(MyFormActionPack, self).__init__()
            self.actions.extend([
                GetWindowAction, GetDataAction(), SaveAction, DeleteAction()
            ])
            self.subpacks.append( InnerActionPack )
            
    class InnerActionPack(ActionPack):
        url = 'inner'
        def __init__(self):
            super(InnerActionPack, self).__init__()
            self.actions.extend([
                SubAction1, SubAction2, ...  
            ])

Обратите внимание, что в список *actions* можно добавлять как классы, так и экземпляры экшенов. На самом деле это не имеет значения, т.к. контроллер при инициализации автоматически создает экземпляры экшенов и паков, а также дополняет их специальными атрибутами. Об этом в главе :ref:`actions_ActionController`
    
Часто бывает необходимо получить прямой доступ к экшенам внутри пака через атрибуты. Живой пример из М3::

    class BaseDictionaryActions(ActionPack):
        def __init__(self):
            super(BaseDictionaryActions, self).__init__()
            self.list_window_action   = DictListWindowAction()
            self.select_window_action = DictSelectWindowAction()
            self.edit_window_action   = DictEditWindowAction()
            ...
            self.actions = [
                self.list_window_action,
                self.select_window_action,
                self.edit_window_action,
                ...
            ]
   
.. _actions_ActionController:
   
Класс ActionController и его использование
++++++++++++++++++++++++++++++++++++++++++

Определение контроллера состоит из нескольких этапов:

#. Экземпляр контроллера как правило создается в файле *app_meta.py* внутри приложения.
#. Чтобы передавать в него запросы Django нужно создать вьюшку контроллера *dict_view* и зарегистрировать url pattern для неё в методе *register_urlpatterns*. Он вызывается автоматически для всех приложений.
#. Регистрация паков в контроллере производится методом *register_actions*.

Пример файла app_meta.py внутри приложения dicts::
    
    # Именованный экземпляр контроллера
    dict_controller = ActionController(url='/core-dicts', name=u'Справочники')
    
    def register_urlpatterns():
        """ Регистрация вьюшки контроллера """
        return urls.patterns('',
                (r'^core-dicts/', 'mis.core.dicts.app_meta.dict_view'),
            )

        def dict_view(request):
            """ Вьюшка контроллера """
            return dict_controller.process_request(request)
            
        def register_actions():
            """ Регистрация паков в контроллере """
            dict_controller.packs.extend([
                MyFormActionPack, 
                MyDictionaryActions
            ])

При добавлении пака в контроллер вызывается метод *_build_pack_node*, который создает экземпляр пака и всех вложенных в него экшенов и паков. Заполняются служебные атрибуты, с помощью которых можно обходить дерево:

* parent - ссылка на родительский пак
* controller - ссылка на родительский контроллер

Чаще всего бывает нужно найти экшен или пак в уже сформированной иерархии. Для этого есть несколько методов:

* По известному адресу экшен можно найти методом *get_action_by_url*
* Пак по имени или классу можно найти методом *find_pack*
* Рекомендуется искать экшены и паки по короткому имени (псевдониму). Для него есть атрибут short_name.

Пример::
    
    from m3.helpers import urls
    
    my_action = urls.get_action('my-action-alias')
    my_pack = urls.get_pack('my-pack-alias')


.. _actions_context:

Контекст запросов в М3 (m3.actions.context)
----------------------------------------------

В Django параметры запросов передаются с помощью класса `HttpRequest <http://docs.djangoproject.com/en/dev/ref/request-response/#httprequest-objects>`_ в трех словарях POST, GET и REQUEST. Извлекаемые из них значения не проверяются и не конвертируются в сложные типы Python. Ещё один минус, что извлечение, как правило, делают внутри кода вьюшки, таким образом загромождается место под бизнес логику.

В М3 был разработан механизм контекста, который позволяет:

* Автоматически извлекать значения из запроса по заранее заданным правилам.
* Преобразовывать сырое значение в указанный в правилах тип.
* Передавать контекст в ответе к визуальным компонентам.

.. _actions_context_rules:

Определение контекста в экшенах
+++++++++++++++++++++++++++++++

Правила извлечения контекста задаются внутри метода *context_declaration* экшена. Представляют собой список экземпляров класса *ActionContextDeclaration* или его упрощенное написание *ACD*. Так же можно использовать декларативное описание по определенной схеме

.. automethod:: m3.actions.Action.context_declaration

.. module:: m3.actions.context

.. autoclass:: ActionContextDeclaration
   :members:

Пример определения правил::
    
    from m3.actions.context import ActionContextDeclaration, ACD
    ... 
    
    class GetRowsAction(Action):
        def context_declaration(self):
                return [
                    ActionContextDeclaration(name='id', type=int, required=True, verbose_name=u'Идентификатор модели'),
                    ActionContextDeclaration(name='start', type=int, required=True),
                    ActionContextDeclaration(name='limit', type=int, required=True)
                ]
            ...

    class GetRowsAction(Action):
        url = 'save'
    
        def context_declaration(self):
            # декларативное опимание контекста
            return {
                # параметр запроса -> параметры разбора
                'ids': {
                    # значение по умолчанию,
                    # используется при отсутствии параметра в запросе
                    # если не указано - параметр считается обязательным
                    'default': '',

                    # тип парсера, может быть:
                    # - строкой - именем одного из предопределенных парсеров
                    # - callable-объектом, выполняющим парсинг. Такой объект
                    #   может возбуждать ValueError/TypeError/KeyError/IndexError
                    #   в случае неправильного формата данных, что позволяет
                    #   использовать в качестве парсера что-то вроде:
                    #     'type': ['on', 'yes'].__contains__
                    #     'type': {1: 'Male', 2: 'Female'}.get
                    #     'type': float
                    #     'type': json.loads
                    'type': int

                    # наименование параметра, понятное пользователю
                    # используется в сообщениях об ошибках
                    'verbose_name': u'Идентификатор объекта'
                },
                # 
                'date': {
                    'type': datetime.date,
                    'verbose_name': u'Дата начала действия изменений'
                },
                'comment': {
                    'type': str
                }
            }
        
        @transaction.commit_on_success
        def run(self, request, context):
            if not hasattr(context, 'comment'):
                context.comment = u'Без комментариев'
        
            for id in context.ids:
                SomeModel.objects.create(pid=id, comment=context.comment)
        
            msg = u'Изменения внесены на дату %s' % context.date
            return OperationResult(message=msg)
                
Разберем правило::
    
    ACD(name='date', required=True, type=datetime.date, verbose_name=u'Дата начала действия изменений')
    
Из словаря REQUEST запроса HttpRequest будет извлечено значение с именем "date" и приведено к типу datetime.date. Если его нет в REQUEST, то до run() управление не дойдет и будет сгенерировано исключение RequiredFailed.

Разберем правило::

    ACD(name='comment', type=str)
    
Из словаря REQUEST запроса HttpRequest будет извлечено значение с именем "comment". Если его нет в REQUEST, то соответствующий атрибут не будет добавлен в context, т.к. required=False по умолчанию. Управление будет передано в run().

Возможные результаты работы экшенов (m3.actions.results)
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

В Django в качестве конечного ответа вьюшек используется класс `HttpResponse  <http://docs.djangoproject.com/en/dev/ref/request-response>`_. В М3, при работе с экшенами и паками, используются более высокие абстракции - класс производные от *ActionResult*.

Главные отличия ActionResult от HttpResponse:

* ActionResult используется для хранения и трансформации ответа приложения на запрос. HttpResponse же напротив является готовым ответом и содержит в себе данные специфичные для протокола http, например status_code и cookie. Которые не нужны при написании бизнес-логики.
* Тип ответа в ActionResult определяется классом и интерфейсом им предоставляемым, а в HttpResponse только mimetype.
* ActionResult поддерживает передачу контекста
* ActionResult преобразуется в HttpResponse после обработки запроса в контроллере с помощью метода *get_http_response*.

Благодаря этим особенностям в процессе обработки запроса можно изменять и даже подменять ответы. Например, подключенный плагин может модифицировать форму, передаваемую через ExtUIScriptResult, добавив в нее новые контролы.

.. autoclass:: m3.actions.results.ActionResult
   :members:
   
От него наследуется более сложный базовый класс BaseContextedResult, который может передавать контекст в визуальные компоненты и формы.

.. autoclass:: m3.actions.results.BaseContextedResult
   :members:
   
Простые обёртки над HttpResponse
--------------------------------

.. autoclass:: m3.actions.results.HttpReadyResult
   :members:

.. autoclass:: m3.actions.results.TextResult
   :members:   
 
.. autoclass:: m3.actions.results.XMLResult
   :members:  
   
   
Ответы передающие JSON
----------------------

Предназначены для работы с JSON и готовыми к JSON-сериализации данными

.. autoclass:: m3.actions.results.JsonResult
   :members:

.. autoclass:: m3.actions.results.PreJsonResult
   :members:
   

.. Ответы передающие данные из БД
.. ------------------------------

.. .. autoclass:: m3.actions.results.ExtGridDataQueryResult
..    :members:
   
.. .. autoclass:: m3.actions.results.ExtAdvancedTreeGridDataQueryResult
..    :members:
   
.. Ответы передающие визуальные компоненты
.. ---------------------------------------

.. .. autoclass:: m3.actions.results.ExtUIComponentResult
..    :members:
   
.. .. autoclass:: m3.actions.results.ExtUIScriptResult
..    :members:
   
Результат выполнения операции
-----------------------------

.. autoclass:: m3.actions.results.OperationResult
   :members: