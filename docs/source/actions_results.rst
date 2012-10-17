Возможные результаты работы экшенов (m3.ui.actions.results)
===========================================================

В Django в качестве конечного ответа вьюшек используется класс `HttpResponse  <http://docs.djangoproject.com/en/dev/ref/request-response>`_. В М3, при работе с экшенами и паками, используются более высокие абстракции - класс производные от *ActionResult*.

Главные отличия ActionResult от HttpResponse:

* ActionResult используется для хранения и трансформации ответа приложения на запрос. HttpResponse же напротив является готовым ответом и содержит в себе данные специфичные для протокола http, например status_code и cookie. Которые не нужны при написании бизнес-логики.
* Тип ответа в ActionResult определяется классом и интерфейсом им предоставляемым, а в HttpResponse только mimetype.
* ActionResult поддерживает передачу контекста (глава :doc:`actions_context`)
* ActionResult преобразуется в HttpResponse после обработки запроса в контроллере с помощью метода *get_http_response*.

Благодаря этим особенностям в процессе обработки запроса можно изменять и даже подменять ответы. Например, подключенный плагин может модифицировать форму, передаваемую через ExtUIScriptResult, добавив в нее новые контролы.

.. module:: m3.ui.actions.results

.. autoclass:: ActionResult
   :members:
   
От него наследуется более сложный базовый класс BaseContextedResult, который может передавать контекст в визуальные компоненты и формы.

.. autoclass:: BaseContextedResult
   :members:
   
Простые обёртки над HttpResponse
--------------------------------

.. autoclass:: HttpReadyResult
   :members:

.. autoclass:: TextResult
   :members:   
 
.. autoclass:: XMLResult
   :members:  
   
   
Ответы передающие JSON
----------------------

Предназначены для работы с JSON и готовыми к JSON-сериализации данными

.. autoclass:: JsonResult
   :members:

.. autoclass:: PreJsonResult
   :members:
   

Ответы передающие данные из БД
------------------------------

.. autoclass:: ExtGridDataQueryResult
   :members:
   
.. autoclass:: ExtAdvancedTreeGridDataQueryResult
   :members:
   
Ответы передающие визуальные компоненты
---------------------------------------

.. autoclass:: ExtUIComponentResult
   :members:
   
.. autoclass:: ExtUIScriptResult
   :members:
   
Результат выполнения операции
-----------------------------

.. autoclass:: OperationResult
   :members: