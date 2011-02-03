#coding:utf-8

from models import PaloView, PaloRole, PaloViewRole, PaloAccount, PaloUser

class ViewManager(object):
    @classmethod
    def sync_view(cls, name, definition, database_id, cube_id):
        '''
        создаем или обновляем view и расшариваем его
        '''
        try:
            owner = PaloUser.objects.get(login='admin')
        except PaloUser.DoesNotExist:
            raise Exception(u'Для синхронизации отчетов нужен пользователь с login = admin')

        try:
            account = PaloAccount.objects.get(name='admin', user=owner)
        except PaloAccount.DoesNotExist:
            raise Exception(u'Для синхронизации отчетов нужен аккаунт с name = admin')
        
        try:
            view = PaloView.objects.get(name=name, owner=owner)
        except PaloView.DoesNotExist:
            view = PaloView()
            
        view.name = name
        view.definition = definition.strip()
        view.owner = owner
        view.account = account
        view.database_id = database_id
        view.cube_id = cube_id
        view.save()
        
        
        for role in PaloRole.objects.filter(name__in=["EDITOR", "VIEWER"]):
            PaloViewRole.objects.get_or_create(role=role, view=view)
            

