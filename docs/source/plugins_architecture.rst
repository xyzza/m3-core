.. _plugins_overview:


.. _plugins_extension_points::

Точки расширений (m3.core.plugins)
----------------------------------

Точки расширений позволяют встраиваться в работу отдельных функций приложения. Они используются там, где слишком избыточно перекрывать функционал целых классов и экшенпаков.

Разберем работу этого механизма на примере по шагам. Допустим я ядре нашего проекта project.core есть место, в котором вызывается некая функция original(), не важно что она делает. При подключении плагина myplugin вместо вызова функции original(), должна вызываться функция внутри плагина new().

1. Регистрируем точку расширения. Сделать это можно двумя способами: с помощью метода register_extensions() в app_meta::
	
	# project/core/app_meta.py
	from m3.core import plugins
	from project.core.api import original

	def register_extensions():
	    plugins.ExtensionManager().append_point(
	        plugins.ExtensionPoint(
	            name='project.core.my-extension-name',
	            default_listener=plugins.ExtensionListener(handler = original) ))

Либо с помощью декоратора (рекомендуется)::
	
	# project/core/api.py
	from m3.core.plugins import extension_point
	
	@extension_point('project.core.my-extension-name')
	def original(a, b, c)
	    return a + b + c
	
Строка ``project.core.my-extension-name`` уникально идентифицирует точку расширения в целом по системе.

.. module:: m3.core.plugins

.. autofunction:: extension_point
	
2. В местах, где использовалась функции original(), её нужно заменить вызовом точки расширения::
	
	# project/core/actions.py
	...
	# from mis.core.helpers import original 
	# original(1, 2, 3)

	from m3.core.plugins import ExtensionManager
	ExtensionManager.execute('project.core.my-extension-name', 1, 2, 3)
	
В метод execute() можно передавать произвольные аргументы, они будут переданы оригинальной функции.

3. Устанавливаем собственный обработчик точки расширения в плагине::
	
	# project/plugins/myplugin.py
	from m3.core import plugins
	from myplugin.helpers import new

	def register_extensions():
		plugins.ExtensionManager().append_listener(
		    'project.core.my-extension-name',
		    plugins.ExtensionListener(new) )

Класс ExtensionListener поддерживает несколько режимов раширения. По умолчание оригинальная функция заменяется, но её можно не заменять, а выполнить новую функцию до или после оригинальной::
	
	# Выполнения до оригинала
	plugins.ExtensionManager().append_listener(
	    'project.core.my-extension-name',
	    plugins.ExtensionListener(new, plugins.ExtensionListener.BEFORE_PARENT))
	
	# Выполнения после оригинала
	plugins.ExtensionManager().append_listener(
	    'project.core.my-extension-name',
	    plugins.ExtensionListener(new, plugins.ExtensionListener.AFTER_PARENT))


.. autoclass:: ExtensionManager
   :members:
   
.. autoclass:: ExtensionPoint
   :members:
   
.. autoclass:: ExtensionHandler
   :members:
