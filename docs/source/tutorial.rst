.. _tutotial:

Туториал по m3
==============

Рассмотрим пример создания нового приложения в рамках абстрактного проекта.
Стандартный набор файлов для приложения выглядит следующим образом:

* ``__init__.py`` 
	Файл, определяющий каталог как `package` (пакет). Как правило остается пустым.
* ``ui.py``
	Файл форм, в этом файле описываются все существующие формы приложения
* ``actions.py``
	Здесь находится вся логика приемки запроса, обработки и отдачи результата.
	Имеющиеся экшены, паки необходимо описывать здесь.
* ``models.py``
	Файл моделей, в этом файле описываются необходимые модели для текущего приложения
* ``app_meta.py``
	В этом файле регистрируется контроллер для приложения, регистрируются имеющие паки. 
	А так же экшены, паки либо ссылки (урлы), которые будут отображаться на web-desktope 
	в пуске "Меню", в topbar'е, и в рабочей области (область ярлыков в windows)   
* ``api.py``
	Здесь необходимо описывать общие реюзабельные функции и классы, которые как правило
	используются в экшенах.

	
Так же внутри приложения могут находиться каталоги с миграциями `migrations` и `templates`.

* ``migrations`` - папка для south-миграций.
* ``templates`` - папка для шаблонов форм (как правило здесь находятся шаблоны, зарегестрированные в 
атрибуте окон - ``template_glabals`` ).


Cоздание болванки проекта, основанного на web-desktop.
======================================================

Требуется создать болванку проекта, основанного на web-desktop.

Выбираем папку и делаем::

$ django-admin.py startproject m3_examples

Создаем файл manage_dev.py (копируя manege.py), через который будем запускать локальный http-сервер командой::

$ manage_dev.py runserver

это нужно для того, что пути до платформы m3 на локальной машине и на сервере могут отличаться.
В начало файла добавляем строки::

	#coding:utf-8
	#!/usr/bin/env python
	'''
	Отличается от стандартного джанговского manage.py тем, что добавляет пути к М3 
	и сторонним библиотека входящим в М3
	Но пути в отличие от продакшена более глубокие и содержат src.
	Используется для разработки без веб-сервера.
	'''
	
	# ------------- Связка с Платформой М3 ---------
	import os,sys
	PROJECT_PATH = os.path.dirname(__file__)
	# связка в режиме разработки
	sys.path.insert(0, os.path.join(PROJECT_PATH, 'plugins/'))
	sys.path.insert(0, os.path.join(PROJECT_PATH, 'vendor/'))
	sys.path.insert(0, os.path.join(PROJECT_PATH, '../../../m3/src/m3/vendor/'))
	sys.path.insert(0, os.path.join(PROJECT_PATH, '../../../m3/src/'))
	
	# Информация о версиях. Бывает полезно когда стоят разные версии пакетов.
	import django
	print 'Django version:', django.get_version()
	import south
	print 'South version:', south.__version__, '\n'
	
Следующим шагом добавим точку входа, которая будет отдавать основной шаблон приложения.
Функция будет называться ``workspace`` и находиться в файле ``views.py``, который необходимо создать.

Для начала модифицируем ``urls.py`` примерно в такой вид::

	#coding:utf-8
	
	import os.path
	
	from django.conf.urls.defaults import *
	from django.conf import settings
	
	# Перехват ошибки 500 для записи в лог
	handler500 = 'm3.helpers.logger.catch_error_500'
	
	urlpatterns = patterns('',
	    # статичный контент проекта
	    (r'^static/(?P<path>.*)$', 'django.views.static.serve', 
	    	{'document_root': settings.MEDIA_ROOT}),
	    
	    # статичный контент для m3 
	    (r'^m3static/(?P<path>.*)$', 'django.views.static.serve', 
	    	{'document_root': os.path.join(settings.M3_ROOT, 'static')}),
	
	    # Рабочий стол
	    (r'^$', 'zakupki.views.workspace'),
	)

Пишем точку входа ``workspace`` внутри ``views.py``::

	#coding:utf-8
	
	from django.http import HttpResponse, HttpResponseRedirect
	from django import template as django_template
	from django.conf import settings as django_settings
	
	from m3.ui.app_ui import DesktopModel, DesktopLoader
	
	#from mis.users.decorators import check_first_run_decorator
	
	#@check_first_run_decorator
	def workspace(request):
	    # Если имеется регистрация
	    #if not request.user.is_authenticated():
	    #    return HttpResponseRedirect('/project-auth/login')
	    
	    desktop_items = DesktopModel()
	    DesktopLoader.populate(request.user, desktop_items)
	    
	    # Имя пользователя в заголовке меню ПУСК
	    user_profile = request.user.get_profile()
	    user = '%s %s %s' % (user_profile.fname, user_profile.iname, user_profile.oname)
	    
	    context = django_template.Context({
	        'components': desktop_items,
	        'user': user,
	        'user_icon': 'user',
	        'DEBUG': django_settings.DEBUG
	    })
	    template = django_template.loader.get_template('workspace.html')
	    return HttpResponse(template.render(context))

Декаратор ``check_first_run_decorator`` понадобится в том случае, если необходимо
регистрировать суперадминистратора в системе через веб-интерфейс.

Как видно из кода, будет отдаваться шаблон ``workspace.html``, разделим его на две части

#. master.html - Основной шаблон приложения, содержит включения необходимых скриптов.
#. workspace.html - Динамически создаваемый шаблон, наследуется от master.html 

Оба шаблона поместим в созданную папку templates

master.html примет примерно вот такой вид::

	<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
	<html xmlns="http://www.w3.org/1999/xhtml">
	    <head>
	        <title>БАРС</title>
			<meta content="text/html; charset=utf-8" http-equiv="Content-Type" />      
	        <style type='text/css'>
	            html, body{font-family:Tahoma,Sans;font-size:11px;}
	            #loading-mask{position:absolute;top:0;left:0;width:100%;height:100%;background:#000000;z-index:1001;}
	            #loading{position:absolute;top:40%;left:45%;z-index:1002;}
	        </style>
					
		    <!-- css классы extjs -->
		    <link rel='stylesheet' type='text/css' href='/m3static/vendor/extjs/resources/css/ext-all.css'/>
		    <link rel='stylesheet' type='text/css' href='/m3static/vendor/extjs/resources/css/ux/ux-all.css'/>
		
		    
		    <!-- m3 css-->
		    <link rel='stylesheet' type='text/css' href='/m3static/m3/css/m3.css'/>
		    <link rel='stylesheet' type='text/css' href='/m3static/m3/css/icons.css'/>
		    
		    <!-- m3 lightbox css-->
		    <link rel='stylesheet' type='text/css' href='/m3static/ext/css/lightbox.css'/>
		    
		    <!-- базовые файлы extjs -->
		    <script type="text/javascript" src="/m3static/vendor/extjs/adapter/ext/ext-base.js"></script>
		    <script type='text/javascript' src='/m3static/vendor/extjs/ext-all-debug.js'></script>
		    <script type='text/javascript' src='/m3static/vendor/extjs/ux-all-debug.js'></script>
		    <script type='text/javascript' src='/m3static/vendor/extjs/locale/ext-lang-ru.js'></script>
		    
		    <!-- web-desktop css и js -->
		    <link rel="stylesheet" type="text/css" href="/m3static/ext/web-desktop/css/desktop.css" />
		    <script type="text/javascript" src="/m3static/ext/web-desktop/js/desktop.js"></script>
		     
		    <!-- m3 js-->
		    <script type='text/javascript' src='/m3static/m3/js/m3-debug.js'></script>
	
			{# Точка расширения для скриптов #}
			{% block content_head %}{% endblock %}
	    </head>
	    <body scroll="no">
	    	<!-- Анимация при входе на рабочий стол -->
	        {# preload indicator area #}
	        <div id="loading-mask"></div>
	        <div id="loading">
	            <span id="loading-message">Загрузка приложения...</span>
	        </div>
	        {# END: preload indicator area #}
	
	
	        <!-- Анимация при входе на рабочий стол -->
	        <script type='text/javascript'>
	            Ext.onReady(function(){
	            	// Инициализация всплывающих подсказок в extjs
					Ext.QuickTips.init();
					
	                var loadingMask = Ext.get('loading-mask');
	                var loading = Ext.get('loading');
	                //  Hide loading message
	                loading.fadeOut({ duration: 0.2, remove: true });
	                //  Hide loading mask
	                loadingMask.setOpacity(0.9);
	                loadingMask.shift({
	                    xy: loading.getXY(),
	                    width: loading.getWidth(),
	                    height: loading.getHeight(),
	                    remove: true,
	                    duration: 1,
	                    opacity: 0.1,
	                    easing: 'bounceOut'
	                });                       
	            });
	                        
	        </script>
	    	
	    	{# Точка расширения для дополнительно html кода #}
	        {% block content %}{% endblock %}
			
	    </body>
	</html>




А workspace.html будет содержать вот такой код:: 

	{% extends 'master.html' %}
	
	{% block content_head %}
	
	    <script type="text/javascript"> 
	
		// Основной объект web-desktop'a 
		AppDesktop = new Ext.app.App({
				// Реализация функции, которая выводит список 
			    getModules : function(){
			        return [
					// Элементы меню "Пуск"
					{% for menu_item in components.start_menu %}
						{% if not forloop.first %},{% endif %}
			            new AppDesktop.MenuItem_{{ forloop.counter }}()
					{% endfor %}
					
					// Значки на рабочем столе
					{% if components.desktop %},{% endif %}
					{% for desktop_item in components.desktop %}
						{% if not forloop.first %},{% endif %}
						new AppDesktop.DesktopItem_{{ forloop.counter }}()
					{% endfor %}
	                {# Включаются элементы верхней панели #}
					
					{% if components.start_menu %}
					,
					{% else %}
						{% if components.desktop %},{% endif %}
					{% endif %}
					
					// Значки на topbar                
	                {% for desktop_item in components.toptoolbar %}
						{% if not forloop.first %},{% endif %}
						new AppDesktop.TopToolbarItem_{{ forloop.counter }}()
					{% endfor %}
			        ];
			    },
			    
			    // Обязательные настройки меню "Пуск"
			    getStartConfig : function(){
			        return {
			            title: '{{ user }}',
			            iconCls: '{{ user_icon }}',
			            toolItems: [
							{% for tool in components.toolbox %}
							{% if not forloop.first%},{%endif%}
							{% ifequal tool '"-"'%} '-',
							{% else %}
								{	text:'{{ tool.name }}'
					                , iconCls:'{{ tool.icon }}'
					                , scope:this
									{% if tool.t_is_subitems %}
									, handler: function(){ return false;}
									, menu: {{ tool.render_items|safe }}
									{% else %}
									, handler: function(){
										return sendRequest('{{ tool.url }}');
									}
									{%endif%}
					            }
							{%endifequal%}
							{% endfor %}
						]
			        };
			    }
			});
			
			{# Обрабатываются модули, находящиеся в меню Пуск #}
			{% for menu_item in components.start_menu %}
			AppDesktop.MenuItem_{{ forloop.counter }} = Ext.extend(Ext.app.Module, {
			    id:'menu-item-{{ forloop.counter }}',
			    init : function(){
			        this.launcher = {
						in_start_menu: true
						, scope: this
			            , text: '{{ menu_item.name }}'
			            , iconCls: '{{ menu_item.icon }}'
						{% if menu_item.t_is_subitems %}
						, menu: {{ menu_item.render_items|safe }}
						, handler: function(){ return false;}
						{% else %}
						, handler: function(){
							return sendRequest('{{ menu_item.url }}');
						}
						{%endif%}
			    	}
				}
			});
			{% endfor %}
			
			{# Обрабатываются модули, находящиеся на Рабочем Столе, не пересекаются с меню Пуск #}
			{% for desktop_item in components.desktop %}
			AppDesktop.DesktopItem_{{ forloop.counter }} = Ext.extend(Ext.app.Module, {
			    id:'desktop-item-{{ forloop.counter }}',
			    init : function(){
			        this.launcher = {
			            text: '{{ desktop_item.name }}',
			            iconCls:'{{ desktop_item.icon }}',
			            handler : function(){
							return sendRequest('{{ desktop_item.url }}');
						},
			            scope: this
			        }
			    }
			});
			{% endfor %}
	
	      	{# Элементы верхней панельки (topbara) #}                
	       	{% for toptoolbar_item in components.toptoolbar %}
			AppDesktop.TopToolbarItem_{{ forloop.counter }} = Ext.extend(Ext.app.Module, {
			    id:'toptoolbar-item-{{ forloop.counter }}',
			    init : function(){
			        this.launcher = {
	                    index: '{{ toptoolbar_item.index }}',
			            text: '{{ toptoolbar_item.name }}',
			            iconCls:'{{ toptoolbar_item.icon }}',
			            scope: this
	                            {% if toptoolbar_item.t_is_subitems %}
	                                , menu: {{ toptoolbar_item.render_items|safe }}
					, handler: function(){ return false;}
				    {% else %}
					, handler: function(){
					    return sendRequest('{{ toptoolbar_item.url }}');
					}
				    {%endif%}
			        }
			    }
			});
			{% endfor %}
	
		</script>	
	{% endblock %}
	
	{% block content %}
		<!-- Верхняя панель -->
		<div id="ux-toptoolbar"></div>
		
		<!-- Верхняя панель -->
		<div id="x-desktop">
			<table id="x-shortcuts">
				<tr>
					<!-- Иконки в десктопе -->
					{% for desktop_item in components.desktop %}
					<td id="desktop-item-{{ forloop.counter }}-shortcut">
						<a href="#">
							<div class="base-desktop-image {{ desktop_item.icon }}"> </div>
			           	 	<div>{{ desktop_item.name }}</div>
						</a>
					</td>
					{% endfor %}
				</tr>	
			</table>
		</div>
		
		<!-- Нижняя панель и меню пуск -->
		<div id="ux-taskbar">
			<div id="ux-taskbar-start"></div>
			<div id="ux-taskbuttons-panel"></div>
			<div class="x-clear"></div>
		</div>
	{% endblock %}


To be continued...

