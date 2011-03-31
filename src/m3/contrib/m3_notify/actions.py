#coding:utf-8
from m3.contrib.m3_notify.ui import NotifyMessagesListWindow
from m3.ui.actions import ActionPack, Action
from m3.ui.actions.results import ExtUIScriptResult
from m3.helpers import urls

__author__ = 'daniil-ganiev'


class M3NotifierActionPack(ActionPack):
    url = '/notifier_pack'

    def __init__(self):
        super(M3NotifierActionPack, self).__init__()
        self.actions.extend([ListNotifyMessagesAction])

    def get_list_url(self):
        '''Метод для закрепления позиций на раб. столе\меню приложения'''
        return urls.get_acton_url('notify_messages_list')


class ListNotifyMessagesAction(Action):
    url = '/notify_messages_list'
    shortname = 'notify_messages_list'

    def run(self, request, context):
        window = NotifyMessagesListWindow()
        return ExtUIScriptResult(window)


#class ProcessActionPack(ActionPack):
#    url = '/process'
#
#    def __init__(self):
#        super(ProcessActionPack, self).__init__()
#        self.actions.extend([ListProcessAction,
#                             NewProcessAction,
#                             EditProcessAction,
#                             ReadProcessAction,
#                             SaveProcessAction,
#                             SaveNewProcessAction,
#                             ChangeProcessStepAction,
#                             SaveChangeStepAction,
#                             ReadAvailableGroupsAction,
#                             GetProcessFiles,
#                             AddProcessFile,
#                             SaveProcessFile,
#                             EditProcessFile,
#                             DeleteProcessFile])
#
#    def get_list_url(self):
#        return urls.get_acton_url('list_process_action')
#
#
#class ListProcessAction(Action):
#    url = '/list_process'
#    shortname = 'list_process_action'
#
#    def run(self, request, context):
#        steps_dict = get_steps_by_user(request.user)
#        window = ProcessListWindow(steps_dict = steps_dict)
#        return ExtUIScriptResult(window)
#
#
#class EditProcessAction(Action):
#    url = '/edit_process'
#    shortname = 'edit_process_action'
#
#    def context_declaration(self):
#        return [ActionContextDeclaration(name='process_id', required=True, type=int)]
#
#    def run(self, request, context):
#        window = ProcessEditWindow()
#        process = Process.objects.get(pk = context.process_id)
#        window.form.from_object(process)
#        adapter = ProcessInitFieldsAdapter(owner_id=process.id)
#        window.append_init_fields( adapter.get_ext_form_fields() )
#        return ExtUIScriptResult(window)
#
#class NewProcessAction(Action):
#    url = '/new_process'
#    shortname = 'new_process_action'
#
#    def run(self, request, context):
#        window = ProcessNewWindow()
#
#        return ExtUIScriptResult(window)
#
#
#class SaveNewProcessAction(Action):
#    url = '/save_new_process'
#    shortname = 'save_new_process_action'
#
#    def context_declaration(self):
#        return [ActionContextDeclaration(name='process_type_id', required=True, type=int),
#                ActionContextDeclaration(name='customer_id', required=True, type=int),]
#
#    @transaction.commit_on_success
#    def run(self, request, context):
#        process_save_routine = NewProcessSaveRoutine(process_type_id=context.process_type_id,
#                                                     customer_id=context.customer_id,
#                                                     process_num=context.process_num,)
#
#        try:
#            process_save_routine.create_process()
#        except NewProcessSaveException, ex:
#            return OperationResult(success=False,message=ex.message)
#
#        return OperationResult(success=True)
#
#
#class SaveProcessAction(Action):
#    url = '/save_process'
#    shortname = 'save_process_action'
#
#    def context_declaration(self):
#        return [ActionContextDeclaration(name='id', required=False, type=int, default = 0)]
#
#    @transaction.commit_on_success
#    def run(self, request, context):
#        process = Process.objects.get(pk = context.id ) if hasattr(context, 'id') else Process()
#
#        window = ProcessEditWindow()
#        window.form.bind_to_request(request)
#        window.form.to_object(process)
#
#        process.save()
#
#        adapter = ProcessInitFieldsAdapter(owner_id = process.id)
#        adapter.parse_request(request=request)
#
#        return OperationResult(success=True)
#
#class ReadProcessAction(Action):
#    url = '/read_process'
#    shortname = 'read_process_action'
#
#    def context_declaration(self):
#        return [ActionContextDeclaration(name='start', type=int, required=True),
#                ActionContextDeclaration(name='limit', type=int, required=True),
#                ActionContextDeclaration(name='step', type=int, required=True, default=0),]
#
#    def run(self, request, context):
#        if context.step:
#            processes = Process.objects.select_related('process_type').filter(route__step__id = context.step)
#        else:
#            processes = Process.objects.none()
#
#        rows  = map( lambda process: { 'id':process.id ,
#                                       'num': process.process_num, 'type': process.process_type.name}, processes )
#        return PreJsonResult({'rows': rows, 'total': len(rows)})
#
#
#class ChangeProcessStepAction(Action):
#    url = '/change_process_step'
#    shortname = 'change_process_step_action'
#
#    def context_declaration(self):
#        return [ActionContextDeclaration(name='ids', required=True, type=int)]
#
#    def run(self, request, context):
#        window = ChangeProcessStepWindow()
#        process = Process.objects.get(pk = context.ids)
#        steps =  get_next_steps(process.route.step)
#
#        steps_data = map(lambda s: [s.id, s.name], steps)
#        window.data_bind(data = steps_data)
#
#        window.form.url = urls.get_url('save_change_step_action')
#        window.experts_store.url = urls.get_url('read_available_groups_action')
#
#        return ExtUIScriptResult(window)
#
#
#class SaveChangeStepAction(Action):
#    url = '/save_change_step'
#    shortname = 'save_change_step_action'
#
#    def context_declaration(self):
#        return [ActionContextDeclaration(name='ids', required=True, type=int),
#                ActionContextDeclaration(name='step_id', required=True, type=int),
#                ActionContextDeclaration(name='group_id', required=True, type=int)]
#
#    @transaction.commit_on_success
#    def run(self, request, context):
#        process = Process.objects.get(pk = context.ids)
#
#        current_route = process.route
#        current_route.is_active = False
#        current_route.save()
#
#        new_route = ProcessRoute()
#        new_route.step_id = context.step_id
#        new_route.group_id = context.group_id
#        new_route.previous = current_route
#        new_route.is_active = True
#        new_route.save()
#
#        process.route = new_route
#        process.save()
#        return OperationResult(success=True)
#
#
#class ReadAvailableGroupsAction(Action):
#    url = '/read_available_groups'
#    shortname = 'read_available_groups_action'
#
#    def context_declaration(self):
#        return [ActionContextDeclaration(name='step_id', required=True, type=int)]
#
#    def run(self, request, context):
#        groups = ExpertGroupStep.objects.select_related('group').filter(step__id = context.step_id).distinct()
#        data = map( lambda g: { 'id': g.group.id, 'name' : g.group.name }, groups)
#        return JsonResult(json.dumps(data))
#
#class GetProcessFiles(Action):
#    '''
#    Возвращает список прикрепленных к процессу файлов
#    '''
#    url = '/get-process-files'
#    shortname = 'get_process_files'
#
#    def context_declaration(self):
#        return [ActionContextDeclaration(name='process_id', type=int, required=True)]
#
#    def add_url(self, rec):
#        url  = u'%s/%s' % (settings.UPLOADS_URL, unicode(basename(rec.doc_file.name)))
#        rec.url = u'<a href="%s" target="blank">Скачать</a>' % url
#        file_name = '%s' % rec.doc_name
#        index = file_name.find('/')
#        rec.name = file_name[index+1:] if index>0 else file_name
#        rec.doc_file = None
#        return rec
#
#    def run(self, request, context):
#        result = ProcessDocument.objects.filter(process=context.process_id)
#        rows, total = queryset_limiter(result, context.start, context.limit)
#        map(self.add_url, rows)
#        return PreJsonResult({'rows': list(rows), 'total': total})
#
#
#class AddProcessFile(Action):
#    '''
#    Добавление файла к продукту
#    '''
#    url = '/add-process-file'
#    shortname = 'add_process_file'
#
#    def context_declaration(self):
#        return [ActionContextDeclaration(name='process_id', type=int, required=True)]
#
#    def run(self, request, context):
#        win = AddProcessFileWindow()
#        return ExtUIScriptResult(win)
#
#
#class SaveProcessFile(Action):
#    '''
#    Сохранение файла
#    '''
#    url = '/save-process-file'
#    shortname = 'save_process_file'
#
#    def context_declaration(self):
#        return [ActionContextDeclaration(name='process_id', type=int, required=True),
#                ActionContextDeclaration(name='id', type=int, required=False),]
#
#    def run(self, request, context):
#        file = ProcessDocument.objects.get(pk=context.file_id) if hasattr(context,'id') else ProcessDocument()
#
#        win = AddProcessFileWindow()
#        win.form.bind_to_request(request)
#        win.form.to_object(file)
#
#        file.process_id = context.process_id
#        file.source = ProcessDocumentSourceEnum.PROCESS_INTERNAL_SIMPLE
#
#        if file.init_doc.init_doc_type == ProcessDocTypeEnum.SINGLE_FILE:
#            files = ProcessDocument.objects.filter(init_doc=file.init_doc.id,
#                                                   process=file.process_id)
#            if files and len(files) >= 1 and files[0].id != file.id:
#                return OperationResult(success=False,
#                                       message=u'Можно добавить только один файл данного типа')
#
#        file.save()
#        return OperationResult()
#
#class EditProcessFile(Action):
#    '''
#    Редактирование файла
#    '''
#    url = '/edit-process-file'
#    shortname = 'edit_process_file'
#
#    def context_declaration(self):
#        return [ActionContextDeclaration(name='file_id', type=int, required=True),]
#
#    def run(self, request, context):
#        file = ProcessDocument.objects.get(id=context.file_id)
#        win = AddProcessFileWindow()
#        win.title = u'Редактирование файла'
#        win.form.bind_to_request(request)
#        win.doc_file = file.doc_file
#        win.form.from_object(file)
#        return ExtUIScriptResult(win)
#
#class DeleteProcessFile(Action):
#    '''
#    Удаление файла при процессе
#    '''
#    url = '/delete-process-file'
#    shortname = 'delete_process_file'
#
#    def context_declaration(self):
#        return [ActionContextDeclaration(name='file_id', type=int, required=True)]
#
#    @transaction.commit_on_success()
#    def run(self, request, context):
#        file = ProcessDocument.objects.get(id=context.file_id)
#        file.safe_delete()
#        return OperationResult()
