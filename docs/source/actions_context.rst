.. _actions_context::

Контекст запросов в М3 (m3.ui.actions.context)
==============================================

В Django параметры запросов передаются с помощью класса `HttpRequest <http://docs.djangoproject.com/en/dev/ref/request-response/#httprequest-objects>`_ в трех словарях POST, GET и REQUEST. Извлекаемые из них значения не проверяются и не конвертируются в сложные типы Python. Ещё один минус, что извлечение, как правило, делают внутри кода вьюшки, таким образом загромождается место под бизнес логику.

В М3 был разработан механизм контекста, который позволяет:

* Автоматически извлекать значения из запроса по заранее заданным правилам.
* Преобразовывать сырое значение в указанный в правилах тип.
* Передавать контекст в ответе к визуальным компонентам.

.. _actions_context_rules::

Определение контекста в экшенах
-------------------------------

Правила извлечения контекста задаются внутри метода *context_declaration* экшена. Представляют собой список экземпляров класса *ActionContextDeclaration* или его упрощенное написание *ACD*. 

.. automethod:: m3.ui.actions.Action.context_declaration

.. module:: m3.ui.actions.context

.. autoclass:: ActionContextDeclaration
   :members:

Пример определения правил::
	
	from m3.ui.actions.context import ActionContextDeclaration, ACD
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
                return [
                    ACD(name='ids', required=True, type=ActionContext.ValuesList(',', int)),
                    ACD(name='date', required=True, type=datetime.date, verbose_name=u'Дата начала действия изменений'),
                    ACD(name='comment', type=str)
                ]
            
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

Контекст
--------

.. autoexception:: ActionContext
   :members:

Исключения
----------

.. autoexception:: ActionContextException
   :members:

.. autoexception:: RequiredFailed
   :members:

.. autoexception:: ConversionFailed
   :members:

	
	
