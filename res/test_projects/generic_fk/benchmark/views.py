# -*- coding: utf-8 -*-

from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.db import transaction
from ORM_test.benchmark.models import Document_0, Document_1, Document_2
from django.contrib.contenttypes.models import ContentType
import logging
import time
import random
import models

WORKFLOW_COUNT  =    10000
WORKFLOW_PART   =      100

class ObjectFactory:
    def spawnWorkflows(self, count):
        ''' Создаем пул процессов и записываем их в базу '''
        assert count%2 == 0
        # Можно как-то избавиться от копипаста... Передать тип ак аргумент, а что делать с a и b?
        pool0 = []
        pool1 = []
        for i in xrange(count / 2):
            wf1 = models.Workflow_0(name = "", key = random.randrange(1, 1001), a = 123)
            wf1.save()
            # Второе значиение будет означать сколько ссылок на процесс уже есть
            pool0.append([wf1, 0])
            wf2 = models.Workflow_1(name = "", key = random.randrange(1, 1001), b = 321)
            wf2.save()
            pool1.append([wf2, 0])
        return (pool0, pool1)
            
    def spawnDocuments(self, count):
        ''' Создает пулы документов пока не привязанных к процессам '''
        assert count%3 == 0
        # Фак мой мозг! Опять копипаст
        pool = []
        for i in xrange(count / 3):
            doc0 = models.Document_0(docNumber = 123123, a = 0)
            pool.append(doc0)
            doc1 = models.Document_1(docNumber = 123123, b = 1)
            pool.append(doc1)
            doc2 = models.Document_2(docNumber = 123123, c = 2)
            pool.append(doc2)
        return pool

    def LinkDocuments(self, wfPools, docList):
        ''' К каждому документу (3 вида) привязываем по 1 из 2х видов процессов '''
        for doc in docList:
            # Есть 2 пула с процессами, если один из них заканчивается, то из него не берем :)
            if (len(wfPools[0]) > 0) and (len(wfPools[1]) > 0):
                PoolToUse = random.choice(wfPools)
            elif len(wfPools[0]) > 0:
                PoolToUse = wfPools[0]
            elif len(wfPools[1]) > 0:
                PoolToUse = wfPools[1]
            else:
                raise Exception('Что за фигня?')
            
            # Выбираем случайный процесс из пула. Если он был выбран 6 раз, то удаляем
            index = random.randrange(0, len(PoolToUse))
            workflow = PoolToUse[index][0]
            PoolToUse[index][1] += 1
            if PoolToUse[index][1] == 6:
                del PoolToUse[index]
            # Добавлем в документ
            doc.workflow = workflow
            doc.save()
    
    @transaction.commit_manually
    def DoBenchmark(self):
        ''' Прогоняет добавление объектов с засечением времени. Возвращает полное время и список времен транзакций'''
        logging.info('Начат тест добавления объектов')
        startBenchTime = time.clock()
        
        writedWF = 0
        while writedWF < WORKFLOW_COUNT:
            startTransTime = time.clock()
            try:
                docPool = self.spawnDocuments(WORKFLOW_PART * 6)
                wfPool  = self.spawnWorkflows(WORKFLOW_PART)
                self.LinkDocuments(wfPool, docPool)
            except:
                transaction.rollback()
                raise
            
            transaction.commit()
            writedWF += WORKFLOW_PART
            timesByTrans = time.clock() - startTransTime
            logging.info('Записано процессов %s, документов %s' % (writedWF, writedWF * 6))
            logging.info('Затрачено %s' % timesByTrans)
        
        fullBenchTime = time.clock() - startBenchTime
        logging.info('СУММАРНОЕ ЗАТРАЧЕННОЕ ВРЕМЯ %s' % fullBenchTime)

#TODO: Сделать отчет с запросом по ключевому полю процесса

def benchmark(request):
    factory = ObjectFactory()
    factory.DoBenchmark()
    return HttpResponse('Тест завершен! Смотри результат в логах.')

def benchmark_singleSelect(request):
    ''' Выборка документов по одному процессу '''
    
    #TODO: Нужно попробовать с db_index
    logging.info('Начат тест запросов 1')
    count = models.Workflow_0.objects.count()
    # Прогоним 10 раз для верности
    for i in xrange(10):
        start = time.clock()
        # Берем случайный процесс
        wf = models.Workflow_0.objects.all()[random.randrange(0, count)]
        logging.info('Случайно выбран процесс с PK = %s <br>' % wf.pk)
        
        # 1. Reserve relation мы на него не можем поставить, т.к. класс абстрактный
        # 2. Прямой фильтр тоже не будет работать, так написано в мануале
        # 3. Фильт через преобразование ContentType 
        workflow_type = ContentType.objects.get_for_model(wf)
        
        # Нужно использовать Union? 
        docs0 = Document_0.objects.filter(content_type = workflow_type, object_id = wf.id)
        docs1 = Document_1.objects.filter(content_type = workflow_type, object_id = wf.id)
        docs2 = Document_2.objects.filter(content_type = workflow_type, object_id = wf.id)

        # Каждый процесс должен ссылаться на 6 документов
        assert len(docs0) + len(docs1) + len(docs2) == 6 
        
        # Из-за отложенности QuerySet документы не запрашиваются пока это явно не сделать
        for doc in docs0:
            print str(doc)
        for doc in docs1:
            print str(doc)
        for doc in docs2:
            print str(doc)
        
        logging.info('Затрачено времени %s' % (time.clock() - start))
        
    return HttpResponse('Тест завершен! Смотри результат в логах.')

def benchmark_joinedByKey(request):
    ''' Выборка документов по процессам с одинаковым заданным ключом '''
    pass

def index(request):
    return render_to_response("index.html")

def stats(request):
    result = 'Количество объектов в базе <br>'
    result += 'WF0: %s' % models.Workflow_0.objects.count() + '<br>'
    result += 'WF1: %s' % models.Workflow_1.objects.count() + '<br>'
    result += 'DOC0 %s' % models.Document_0.objects.count() + '<br>'
    result += 'DOC1 %s' % models.Document_1.objects.count() + '<br>'
    result += 'DOC2 %s' % models.Document_2.objects.count() + '<br>'
    return HttpResponse(result)

def remove(request):
    #TODO: Обнаружено очень медленное удаление чем SQL
    logging.info('!!!Начато удаление объектов!!!')
    models.Workflow_0.objects.all().delete()
    models.Workflow_1.objects.all().delete()
    models.Document_0.objects.all().delete()
    models.Document_1.objects.all().delete()
    models.Document_2.objects.all().delete()
    logging.info('База очищена. Можно баловаться дальше :)')
    return HttpResponse('Удаление завершено!')
