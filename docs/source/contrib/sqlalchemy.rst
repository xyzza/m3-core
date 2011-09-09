.. _sqlalchemy:

Пример использования SQLAlchemy
==============================

Содержимое ``models.py``::

    #encoding: utf-8
    from django.contrib import admin
    from django.contrib.admin.sites import AlreadyRegistered
    from django.db import models

    class Seller(models.Model):
        """ ПРОДАВЕЦ """
        name = models.CharField(u'Полное имя', max_length=50, unique=True)
        age = models.PositiveSmallIntegerField(u'Возраст')

        def __unicode__(self):
            return self.name

        class Meta:
            verbose_name = u'Продавец'
            verbose_name_plural = u'Продавцы'


    class ProductGroup(models.Model):
        name = models.CharField(u'Наименование группы', max_length=50, unique=True)

        def __unicode__(self):
            return self.name

        class Meta:
            verbose_name = u'Группа товаров'
            verbose_name_plural = u'Группы товаров'


    class Product(models.Model):
        group = models.ForeignKey(ProductGroup)
        name = models.CharField(u'Наименование товара', max_length=50, unique=True)
        cost = models.DecimalField(u'Цена за шт.', max_digits=16, decimal_places=2)
        count = models.PositiveIntegerField(u'Остаток на складе', default=0)

        def __unicode__(self):
            return u'%s (осталось %s штук по %s руб)' % (self.name, self.count, self.cost)

        class Meta:
            verbose_name = u'Товар'
            verbose_name_plural = u'Товары'


    class Sales(models.Model):
        """ ПРОДАЖИ """
        date = models.DateField(u'Дата продажи')
        product = models.ForeignKey(Product)
        seller = models.ForeignKey(Seller)
        count = models.IntegerField(u'Количество')

        class Meta:
            verbose_name = u'Продажа'
            verbose_name_plural = u'Продажи'


    #===================== НАСТРОЙКА АДМИНКИ =========================

    class SellerAdmin(admin.ModelAdmin):
        list_display = ('name', 'age')

    class ProductAdmin(admin.ModelAdmin):
        list_display = ('name', 'cost', 'count')
        list_filter = ('group', )

    class SalesAdmin(admin.ModelAdmin):
        list_display = ('date', 'product', 'seller', 'count')
        list_filter = ('seller', 'product__group')

    try:
        admin.site.register(Seller, SellerAdmin)
        admin.site.register(ProductGroup)
        admin.site.register(Product, ProductAdmin)
        admin.site.register(Sales, SalesAdmin)
    except AlreadyRegistered:
        pass
        
Содержимое ``examples.py``::

    #encoding: utf-8
    import datetime
    import random
    import pprint

    from django.conf import settings

    from sqlalchemy.orm import Session
    from sqlalchemy import func
    from sqlalchemy.orm.util import aliased
    from sqlalchemy.schema import Table, Column
    from sqlalchemy.types import Integer

    from m3.db.alchemy_wrapper import SQLAlchemyWrapper


    #======================== ПОДКЛЮЧЕНИЕ АЛХИМИИ =============================
    WRAPPER = SQLAlchemyWrapper(settings.DATABASES)
    WRAPPER.engine.echo = True

    models = WRAPPER.get_models_map(create_mappers=True)


    #========================= РАБОТА С ДАННЫМИ ===============================
    def generate_sales():
        """ Генератор продаж! """

        # Создаем сессию для работы с БД
        session = Session()

        # Выборка всех продавцов
        sellers = session.query(models.Seller).all()

        # Выборка всех товаров имеющихся в наличии
        products = session.query(models.Product).filter(models.Product.c.count > 0).all()

        # Цикл по периоду дней
        today = datetime.date.today()
        for i in range(-3, 4):
            date = today + datetime.timedelta(days=i)

            # Создание записей о продажах
            for k in range(10):
                sale = models.Sales.class_()
                sale.date = date
                sale.product = random.choice(products)
                sale.seller = random.choice(sellers)
                sale.count = random.randrange(1,5)

                # Но все же для модификации данных лучше использовать Django ORM,
                # т.к. у нас не отсылаются сигналы и методы модели могут быть перекрыты.
                session.add(sale)

        session.commit()
            

    #============================ ОТЧЕТЫ ======================================

    gs = Session() # Общая сессия для всех выборок

    def example0():
        """
        Получение продуктов в виде объектов по сложному условию
        """
        some_group = gs.query(models.ProductGroup).first()
        print some_group.name
        
        query = gs.query(models.Product).\
            filter_by(group=some_group).\
            filter(
                (models.Product.c.count > 2) &
                 models.Product.c.name.like('%Ge%') &
                 models.Product.c.cost.between(100, 5000) |
                 models.Product.c.name.in_(['Name1', 'Name2', 'Name2'])
            )[1:10]
        
        for obj in query:
            print obj.name, obj.cost, obj.count


    def example1():
        """
        Получаем суммарное количество единиц техники на дату
        """
        query = gs.query(func.sum(models.Sales.c.count)).\
            filter(models.Sales.c.date==datetime.date.today())

        # Так выглядит запрос
        print query

        # Есть несколько способов получения результата: first, one, all, scalar
        print 'Count:', query.scalar()


    def example2_1():
        """
        Получаем самую часто продаваемую технику на дату
        """
        query = gs.query(models.Product.c.name, func.sum(models.Sales.c.count)).\
            filter(
                (models.Sales.c.date==datetime.date.today()) & 
                (models.Product.c.id==models.Sales.c.product_id) ).\
            group_by(models.Product.c.name).\
            order_by(func.sum(models.Sales.c.count).desc())

        print query

        pprint.pprint(query.all())


    def example2_2():
        """
        Получаем самую часто продаваемую технику на дату
        """
        query = gs.query(models.Product.c.name, func.sum(models.Sales.c.count)).\
            select_from(models.Product).\
            join(models.Sales).\
            filter(models.Sales.c.date==datetime.date.today()).\
            group_by(models.Product.c.name).\
            order_by(func.sum(models.Sales.c.count).desc()).\
            limit(10)

        print query

        pprint.pprint(query.all())
        
        
    def example3():
        """
        Выборка из двух подзапросов с объединением по произвольному полю
        """
        
        # 2 самых молодых продавца
        young_sellers = gs.query(models.Seller).order_by('age').limit(2).subquery('YS')
        print young_sellers
        
        # Самые продающие продавцы
        top_salers = gs.query(func.sum(models.Sales.c.count), models.Seller.c.name).\
            select_from(models.Sales).join(models.Seller).\
            group_by(models.Seller.c.name).\
            order_by(func.sum(models.Sales.c.count).desc())
        
        # Сколько товаров продали самые молодые продавцы (имея только данные из top_salers)
        #FIXME: А тут что-то не получается, поэтому покажу другой пример :)
        
        # Группы товаров продаваемые разными продавцами
    #    name1 = models.Seller.c.name.label('seller_name')
    #    name2 = models.Product.c.name.label('product_name')
    #    sellers_groups = gs.query(name1, name2).\
    #        select_from(models.Seller).join(models.Sales).join(models.Product).\
    #        group_by(name1, name2).\
    #        subquery('SG')
    #    print sellers_groups
    #
    #    # Сама выборка
    #    query = gs.query(young_sellers, sellers_groups.c.product_name).\
    #        outerjoin(sellers_groups, young_sellers.c.name==sellers_groups.c.product_name)
        

    def example4():
        """
        Пример UNION
        """
        query1 = gs.query('Product: ' + models.Product.c.name)
        query2 = gs.query('Name: ' + models.Seller.c.name)
        
        # Так же есть EXCEPT и INTERSECT
        query = query1.union(query2)
        print query
        
        pprint.pprint(query.all())


    def example5():
        """
        Создание временной таблицы
        """

        # Объявление и создание новой таблицы на уровне SQL Expression API
        tmp_foo = Table('tmp_foo', WRAPPER.metadata,
            Column('id', Integer, primary_key=True, autoincrement=True),
            Column('foo', Integer),
            prefixes=['TEMPORARY']
        )
        tmp_foo.create()

        # Генерация конструкции INSERT
        ins = tmp_foo.insert()

        values = [{'foo': x} for x in range(10)]
        conn = WRAPPER.engine.connection
        conn.execute(ins, values)
