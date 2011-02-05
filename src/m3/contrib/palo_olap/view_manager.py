#coding:utf-8

from models import PaloView, PaloRole, PaloViewRole, PaloAccount, PaloUser
from django.template.loader import get_template
from django import template as django_template

class ViewManager(object):
    '''
    класс для работы с виешками в palo pivot базе
    '''
    @classmethod
    def sync_view_for_cube(cls, view, cube):
        '''
        создаем или обновляем view и расшариваем его
        '''
        assert view.name, u'Не указано имя для %s' % view.__name__
        database_id = cube._db.get_palo_db().get_id() 
        cube_id = cube.get_palo_cube_id()
        
        try:
            owner = PaloUser.objects.get(login='admin')
        except PaloUser.DoesNotExist:
            raise Exception(u'Для синхронизации отчетов нужен пользователь с login = admin')

        try:
            account = PaloAccount.objects.get(name='admin', user=owner)
        except PaloAccount.DoesNotExist:
            raise Exception(u'Для синхронизации отчетов нужен аккаунт с name = admin')
        
        try:
            obj = PaloView.objects.get(name=view.name, owner=owner)
        except PaloView.DoesNotExist:
            obj = PaloView()
        definition = view.render(cube)
        obj.name = view.name
        obj.definition = definition.strip()
        obj.owner = owner
        obj.account = account
        obj.database_id = database_id
        obj.cube_id = cube_id
        obj.save()
        
        
        for role in PaloRole.objects.filter(name__in=["EDITOR", "VIEWER"]):
            PaloViewRole.objects.get_or_create(role=role, view=obj)
            
class ViewDifinition(object):
    '''
    писание palo view 
    на выходе дает xml
    '''
    rows = [] #писок дименшенов на строках
    cols = [] #писок дименшенов на строках
    name = None #имя вьюшки
    #selected = [] собирается автоматически (все оставиеся дименшены)
    
    @classmethod
    def render(cls, cube):
        '''
        генерирет xml
        смотрит структуру куба
        '''
        def get_dim_list_info(dims):
            res = []
            for dim in dims:
                dim = dim() #превратим в синглетов
                d = {}
                d['id']=dim.get_palo_dimension_id()
                res.append(d)
            return res
            
            
        for dim in cls.rows:
            assert dim in cube.dimensions, u'Дименшен %s в объявлении %s отсутвует в кубе %s' %(dim.__name__, cls.__name__, cube.__class__.__name__)
        data = {}
        data['view_id'] = 0 #работает и так
        data['cube_id'] = cube.get_palo_cube_id()
        data['rows'] = get_dim_list_info(cls.rows)
        data['cols'] = get_dim_list_info(cls.cols)
        #все оставшиесе дименшены куба засунем в филтр
        selected = []
        for dim in cube.dimensions:
            if dim in cls.rows: continue
            if dim in cls.cols: continue
            selected.append(dim)
            
            
        data['selected'] = get_dim_list_info(selected)
            
        
        xml_def = get_template('palo_view.xml')
        context = django_template.Context(data)        
        return xml_def.render(context)
        
     
            

