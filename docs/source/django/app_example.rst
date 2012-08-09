.. _app_example::

Пример приложения
==================

Рассмотрим пример Django приложения:
Файл ``models.py`` описывает таблицу базы данных. ::
    from django.db import models
    class Book(models.Model):
        name = models.CharField(max_length=50)
        pub_date = models.DateField()
Файл ``views.py`` описывает
логику приложения. ::
    from django.shortcuts import render_to_response
    from models import Book
    def latest_books(request):
        book_list = Book.objects.order_by('-pub_date')[:10]
        return render_to_response('latest_books.html', {'book_list': book_list})
Файл ``urls.py`` описывает соответствие URL логике
приложения. ::
    from django.conf.urls.defaults import *
    import views
    urlpatterns = patterns('',
        (r'^latest/$', views.latest_books),
    )
Файл ``latest_books.html`` описывает HTML шаблон,
используемый при выводе страницы. ::
    <html><head><title>Книги</title></head>
    <body>
    <h1>Книги</h1>
    <ul>
    {% for book in book_list %}
    <li>{{ book.name }}</li>
    {% endfor %}
    </ul>
    </body></html>
Главной идеей в Django является разделение задач:
    •	Файл ``models.py`` содержит описание таблицы базы данных, представленное в виде класса Python. Такой класс называется моделью. С помощью данного класса вы можете создавать, получать, обновлять и удалять записи в таблице вашей базы данных, используя простой код на языке Python вместо использования повторяющихся SQL команд.
    •	Файл ``views.py`` содержит логику отображения страницы в функции ``latest_books``. Такая функция называется представлением.
    •	Файл ``urls.py`` определяет какое именно представление будет вызвано для URL, заданного в виде шаблона. В данном случае URL ``/latest/`` будет обработано функцией ``latest_books``. Другими словами, если имя вашего домена example.com, то любой доступ к ``http://example.com/latest/`` будет обработан функцией ``latest_books``.
    •	Файл ``latest_books.html`` является HTML шаблоном, который описывает дизайн страницы. Он использует шаблонный язык с основными логическими операторами — ``{% for book in book_list %}``.
Объединённые вместе, эти компоненты приложения следуют шаблону Модель-Представление-Контроллёр (Model-View-Controller, MVC). Примем, что MVC определяет способ разработки программного обеспечения при котором код для определения и доступа к данным (модель) отделён от логики приложения (управление), которая в свою очередь отделена от интерфейса пользователя (представление).

Для подробного ознакомления обратитесь к `документации Django. <https://docs.djangoproject.com/en/1.4/>`_
