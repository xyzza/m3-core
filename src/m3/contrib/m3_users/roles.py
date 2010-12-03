#coding:utf-8
'''
Created on 11.06.2010

@author: akvarats
'''
import inspect

from django.db import transaction
from django.contrib.auth.models import User

from m3.ui import actions
from m3.ui.ext import windows
from m3.ui.ext import panels
from m3.ui.ext import fields
from m3.ui.ext import controls
from m3.ui.ext.panels.grids import ExtObjectGrid
from m3.ui.ext.containers.grids import ExtGridCheckBoxSelModel
from m3.ui.ext.panels.trees import ExtObjectTree

from m3.helpers import ui as ui_helpers
from m3.db import safe_delete
from m3.helpers import logger
from m3.ui.actions import ActionContextDeclaration, ControllerCache, ActionPack, Action

from users import SelectUsersListWindow

import helpers
import models
import metaroles
import app_meta

class RolesActions(actions.ActionPack):
    '''
    Пакет действий для подсистемы прав пользователей
    '''
    
    url = '/roles'
    
    def __init__(self):
        super(RolesActions, self).__init__()
        self.actions = [
            RolesWindowAction(),
            EditRoleWindowAction(),
            SaveRoleAction(),
            DeleteRoleAction(),
            
            
            ShowAssignedUsersAction(), # показ окна со списком пользователей, ассоциированных с ролью
            RoleAssignedUsersDataAction(), # получение списка пользователей, ассоциированных с ролью
            SelectUsersToAssignWindowAction(), # получение окна со списком пользователей, которые можно добавить в роль
            UsersForRoleAssignmentData(), # получение списка пользователей, которых можно включить в заданную роль
            RolesDataAction(),
            AssignUsers(), # действие на добавление пользователей в роль
            DeleteAssignedUser(), # удаление связанного с ролью пользователя
            GetRolePermissionAction(), # получение списка прав доступа роли
            AddRolePermission(), # выбор прав доступа для добавления в роль
            GetAllPermissions(), # получение дерева всех прав доступа
        ]

#===============================================================================
# UI actions
#  - RolesWindowAction -- получение окна со списком ролей
#  - EditRoleWindowAction -- получение окна редактирования роли
#===============================================================================
        
class RolesWindowAction(actions.Action):
    '''
    Действие на получение окна показа списка пользовательских ролей
    '''
    url = '/roles-window'
    
    def run(self, request, context):
        return actions.ExtUIScriptResult(data = RolesListWindow())

class EditRoleWindowAction(actions.Action):
    '''
    Получение окна редактирования роли пользователя
    '''
    url = '/edit-role-window'
    
    def context_declaration(self):
        return [
            ActionContextDeclaration(name=u'userrole_id', type=int, required=True, default=0)
        ]
    
    def run(self, request, context):
        
        if(context.userrole_id > 0):
            try:
                user_role = models.UserRole.objects.get(pk=context.userrole_id)
            except models.UserRole.DoesNotExist:
                return actions.OperationResult(success=False, message=u'Роль с указанным идентификатором не найдена')
        else:
            user_role = models.UserRole()
        
        window = RolesEditWindow()
        window.form.from_object(user_role)                
        
        return actions.ExtUIScriptResult(data=window)
    
class ShowAssignedUsersAction(actions.Action):
    '''
    Получение окна со списком связанных пользователей
    '''
    url = '/role-assigned-users-window'
    
    def context_declaration(self):
        return [
            actions.ActionContextDeclaration(name='userrole_id', type=int, required=True)
        ]
        
    def run(self, request, context):
        window = AssignedUsersWindow()
        role = models.UserRole.objects.get(id=context.userrole_id)
        window.field_role_name.value = role.name
        
        return actions.ExtUIScriptResult(window)
    
class SelectUsersToAssignWindowAction(actions.Action):
    '''
    Показ окна с выбором сотрудников, которые не были выбраны ранее для указанной роли
    '''
    url = '/role-assigned-users-append-window'
    
    def context_declaration(self):
        return [
            actions.ActionContextDeclaration(name='userrole_id', type=int, required=True)
        ]
        
    def run(self, request, context):
        role = models.UserRole.objects.get(id=context.userrole_id)
        window = SelectUsersListWindow()
        window.grid.action_data = UsersForRoleAssignmentData
        window.grid.title = u"Выберите пользователей для роли '%s'" % role.name 
        window.action_submit = AssignUsers
        
        return actions.ExtUIScriptResult(window)

class AddRolePermission(actions.Action):
    '''
    Выбор прав доступа для добавления в роль
    '''
    url = '/role-add-permission-window'
    
#    def context_declaration(self):
#        return [
#            actions.ActionContextDeclaration(name='userrole_id', type=int, required=True)
#        ]
#        
    def run(self, request, context):
        #role = models.UserRole.objects.get(id=context.userrole_id)
        window = SelectPermissionWindow()
        #window.title = u"Выберите права доступа для роли '%s'" % role.name
        return actions.ExtUIScriptResult(window)

#===============================================================================
# DATA actions
#===============================================================================

class RolesDataAction(actions.Action):
    
    url = '/roles-data'
    
    def context_declaration(self):
        return [
            actions.ActionContextDeclaration(name='filter', required=True, default=''),
            actions.ActionContextDeclaration(name='start', type=int, required=True, default=0),
            actions.ActionContextDeclaration(name='limit', type=int, required=True, default=25),
        ]
    
    def run(self, request, context):
        return actions.JsonResult(ui_helpers.paginated_json_data(helpers.get_roles_query(context.filter), context.start, context.limit))
    
class RoleAssignedUsersDataAction(actions.Action):
    '''
    Получение данных (списка) пользователей, которые прикреплены к указанной роли
    '''
    url = '/role-users'
    
    def context_declaration(self):
        return [
            actions.ActionContextDeclaration(name='userrole_id', type=int, required=True)
        ]
        
    def run(self, request, context):
        return actions.ExtGridDataQueryResult(helpers.get_assigned_users_query(context.userrole_id))
    
class UsersForRoleAssignmentData(actions.Action):
    '''
    Получение списка пользователей, которые могут быть назначены на роль
    '''
    
    url = '/role-assign-users-unassigned'
    
    def context_declaration(self):
        return [
            actions.ActionContextDeclaration(name='userrole_id', type=int, required=True),
            actions.ActionContextDeclaration(name='filter', type=str, required=True, default=u'')
        ]
    
    def run(self, request, context):
        return actions.ExtGridDataQueryResult(helpers.get_unassigned_users(context.userrole_id, context.filter))
        
class GetRolePermissionAction(actions.Action):
    '''
    Получение списка прав доступа для указанной роли
    '''
    url = '/role-permission-rows'
    
    def context_declaration(self):
        return [
            actions.ActionContextDeclaration(name='userrole_id', type=int, required=True)
        ]
    
    def run(self, request, context):
        perms = models.RolePermission.objects.filter(role=int(context.userrole_id))
        res = []
        for perm in perms:
            codes = perm.permission_code.split('#')
            act_code = codes[0]
            sub_code = codes[1] if len(codes) > 1 else ''
            act = ControllerCache.get_action_by_url(act_code)
            perm.verbose_name = act.verbose_name if act.verbose_name else act.__class__.__name__
            if sub_code and sub_code in act.sub_permissions.keys():
                perm.verbose_name = act.sub_permissions[sub_code]
            res.append(perm)
        return actions.ExtGridDataQueryResult(res)
    
class GetAllPermissions(actions.Action):
    '''
    Получение дерева прав доступа
    '''
    url = '/permission-tree'
    
    def run(self, request, context):
        class PermProxy:
            def __init__(self, id, parent=None, name='', url='', can_select = True):
                self.parent = parent
                self.name = name
                self.url = url
                self.id = id
                self.can_select = can_select
        def add_nodes(parent_node, action_set, res):
            # если передали Набор действий, то у него надо взять Действия и подчиненные Наборы
            if isinstance(action_set, ActionPack):
                # обработаем действия
                for act in action_set.actions:
                    # добавляем если надо проверять права или есть подчиненные права
                    if act.need_check_permission or act.sub_permissions:
                        if inspect.isclass(act):
                            act = act()
                        name = act.verbose_name if act.verbose_name else act.__class__.__name__ 
                        child1 = PermProxy(len(res)+1, parent_node, name, act.absolute_url(), act.need_check_permission)
                        res.append(child1)
                        add_nodes(child1, act, res)
                # обработаем подчиненные Наборы
                for pack in action_set.subpacks:
                    if isinstance(pack, ActionPack) and pack.need_check_permission: 
                        name = pack.title if hasattr(pack, 'title') and pack.title else pack.verbose_name if pack.verbose_name else pack.__class__.__name__
                        child2 = PermProxy(len(res)+1, parent_node, name, pack.url, False)
                        res.append(child2)
                        sub_count = len(res)
                        add_nodes(child2, pack, res)
                        if len(res)-sub_count == 0:
                            res.remove(child2)
            # если передали Действие, то у него надо взять подчиненные права
            elif isinstance(action_set, Action):
                for key, value in action_set.sub_permissions.items():
                    child3 = PermProxy(len(res)+1, parent_node, value, action_set.get_sub_permission_code(key), True)
                    res.append(child3)
        res = []
        for ctrl in ControllerCache.get_contollers():
            root = PermProxy(len(res)+1, None, ctrl.verbose_name if ctrl.verbose_name else ctrl.__class__.__name__, ctrl.url)
            res.append(root)
            count = len(res)
            for pack in ctrl.get_top_actions():
                if isinstance(pack, ActionPack) and pack.need_check_permission:
                    name = pack.title if hasattr(pack, 'title') and pack.title else pack.verbose_name if pack.verbose_name else pack.__class__.__name__
                    child1 = PermProxy(len(res)+1, root, name, pack.url, False)
                    res.append(child1)
                    sub_count = len(res)
                    add_nodes(child1, pack, res)
                    if len(res)-sub_count == 0:
                        res.remove(child1)
                elif isinstance(pack, Action) and (pack.need_check_permission or pack.sub_permissions):
                    name = pack.verbose_name if pack.verbose_name else pack.__class__.__name__
                    child1 = PermProxy(len(res)+1, root, name, pack.absolute_url(), pack.need_check_permission)
                    res.append(child1)
                    add_nodes(child1, pack, res)
            if len(res)-count == 0:
                res.remove(root)
        return actions.ExtAdvancedTreeGridDataQueryResult(res)

#===============================================================================
# OPERATIONS
#===============================================================================

class SaveRoleAction(actions.Action):
    '''
    Сохранение роли пользователя
    '''
    
    url = '/save-role'
    
    def context_declaration(self):
        return [
            ActionContextDeclaration(name=u'userrole_id', type=int, required=True, default=0),
            ActionContextDeclaration(name=u'perms', type=object, required=True, default=[])
        ]
    
    def run(self, request, context):
        
        try:
            if(context.userrole_id > 0):
                try:
                    user_role = models.UserRole.objects.get(id=context.userrole_id)
                except models.UserRole.DoesNotExist:
                    return actions.OperationResult(success=False, message=u'Роль с указанным идентификатором не найдена')
            else:
                user_role = models.UserRole()
            
            window = RolesEditWindow()
            window.form.bind_to_request(request)
            window.form.to_object(user_role)
            
            user_role.save()
            
            # сохраним также права доступа
            ids = []
            for perm in context.perms:
                code = perm['permission_code']
                q = models.RolePermission.objects.filter(role=user_role, permission_code = code).all()
                if len(q) > 0:
                    perm_obj = q[0]
                else:
                    perm_obj = models.RolePermission(role = user_role, permission_code = perm['permission_code'])
                perm_obj.disabled = perm['disabled']
                perm_obj.save()
                ids.append(perm_obj.id)
            # удалим те, которые не обновились
            models.RolePermission.objects.filter(role=user_role).exclude(id__in=ids).delete()
        except:
            logger.exception(u'Не удалось сохранить роль пользователя')
            return actions.OperationResult(success=False, message=u'Не удалось сохранить роль пользователя.')
            
        return actions.OperationResult(success=True)

class DeleteRoleAction(actions.Action):
    
    url = '/delete-role'
    
    def context_declaration(self):
        return [
            ActionContextDeclaration(name=u'userrole_id', type=int, required=True)
        ]
        
    def run(self, request, context):
        try:
            user_role = models.UserRole.objects.get(id=context.userrole_id)
        except models.UserRole.DoesNotExist:
            return actions.OperationResult(success=False, message=u'Роль с указанным идентификатором не найдена')
        
        if len(helpers.get_assigned_users_query(user_role)) > 0:
            return actions.OperationResult(success=False, message=u'К данной роли привязаны пользователи. Удалять такую роль нельзя')
        
        try:
            if not safe_delete(user_role):
                # FIXME: return в try - это зло
                return actions.OperationResult(success=False, message=u'Не удалось удалить роль пользователя.<br>На эту запись есть ссылки в базе данных.')
        except:
            logger.exception(u'Не удалось удалить роль пользователя')
            return actions.OperationResult(success=False, message=u'Не удалось удалить роль пользователя.<br>Подробности в логах системы.')
        
        return actions.OperationResult(success=True)
    
class AssignUsers(actions.Action):
    '''
    Сопоставление пользователей роли
    '''
    url = '/assign-users-to-role'
    
    def context_declaration(self):
        return [
            actions.ActionContextDeclaration(name='userrole_id', type=int, required=True),
            actions.ActionContextDeclaration(name='ids', type=str, required=True),
        ]
        
    @transaction.commit_manually
    def run(self, request, context):
        # получаем список пользователей, которые уже были ассоциированы с ролью
        
        try:
            assigned_users = list(helpers.get_assigned_users_query(context.userrole_id))
            
            user_ids = context.ids.strip().split(' ')
            for strid in user_ids:
                if not strid:
                    continue
                try:
                    user_id = int(strid)
                    already_assigned = False
                    for assigned_user in assigned_users:
                        if assigned_user.user.id == user_id:
                            already_assigned = True
                            break
                    if not already_assigned:
                        assign_object = models.AssignedRole()
                        assign_object.role = models.UserRole.objects.get(id=context.userrole_id)
                        assign_object.user = User.objects.get(id=user_id)
                        assign_object.save()
                except ValueError:
                    continue
            transaction.commit()
        except:
            logger.exception(u'Не удалось добавить список пользователей в роль')
            transaction.rollback()
            return actions.OperationResult(success = False, message = u'Не удалось добавить пользователей в роль')
        return actions.OperationResult(success = True, message = u'Пользователи успешно добавлены в роль')

class DeleteAssignedUser(actions.Action):
    '''
    Удаление связанного с ролью пользователя
    '''
    url = '/delete-assigned-user'
    
    def context_declaration(self):
        return [
            actions.ActionContextDeclaration(name='assigneduser_id', type=int, required=True)
        ]
        
    def run(self, request, context):
        try:
            assigned_user = models.AssignedRole.objects.get(id=context.assigneduser_id)
        except:
            return actions.OperationResult(success=False, message=u'Не удалось удалить запись. Указанный пользователь не найден.')
        
        try:
            if not safe_delete(assigned_user):
                return actions.OperationResult(success=False, message=u'Не удалось удалить Запись.<br>На нее есть ссылки в базе данных.')
        except:
            logger.exception(u'Не удалось удалить привязку пользователя к роли')
            return actions.OperationResult(success=False, message=u'Не удалось удалить запись. Подробности в логах системы.')    
        
        return actions.OperationResult(success=True)
        
#===============================================================================
# UI 
#===============================================================================

class RolesListWindow(windows.ExtWindow):
    
    def __init__(self, *args, **kwargs):
        super(RolesListWindow, self).__init__(*args, **kwargs)
        
        self.title = u'Роли пользователей'
        self.layout = 'fit'
        self.width = 500
        self.height = 500
        self.template_globals = 'm3-users/roles-list-window.js'
        
        #=======================================================================
        # Настройка грида со списком ролей
        #=======================================================================
        self.grid = panels.ExtObjectGrid()
        self.grid.add_column(header=u'Наименование роли', data_index='name', width=300)
        self.grid.add_column(header=u'Метароль', data_index='metarole_name', width=200)
        self.items.append(self.grid)
        
        self.grid.action_data = RolesDataAction
        self.grid.action_new = EditRoleWindowAction
        self.grid.action_edit = EditRoleWindowAction
        self.grid.action_delete = DeleteRoleAction
        self.grid.top_bar.button_new.text = u'Добавить новую роль'
        self.grid.row_id_name = 'userrole_id'
        
        # дополнительные действия формы
        self.grid.action_show_assigned_users = ShowAssignedUsersAction
        
        self.grid.context_menu_row.add_item(text = u'Показать пользователей', icon_cls = 'user-icon-16', handler='contextMenu_ShowAssignedUsers')
        #self.grid.context_menu_row.add_item(text = u'Показать разрешения роли', icon_cls = 'edit_item', handler='contextMenu_ShowPermissions')
        self.grid.context_menu_row.add_separator()
        
        
        self.init_component(*args, **kwargs)
        
class RolesEditWindow(windows.ExtEditWindow):
    '''
    Окно редактирования роли
    '''
    
    def __init__(self, new_role = False, *args, **kwargs):
        super(RolesEditWindow, self).__init__(*args, **kwargs)
        
        self.width=500
        self.height=400
        self.modal = True
        
        self.template_globals = 'm3-users/edit-role-window.js'
        
        self.title = u'Роль пользователя'
        self.layout = 'border'
        self.form = panels.ExtForm(layout='form', region = 'north', height = 60, style = {'padding': '5px'})
        self.form.label_width = 100
        self.form.url = SaveRoleAction.absolute_url()
        
        field_name = fields.ExtStringField(name='name', label = u'Наименование', allow_blank=False, anchor='100%')
        field_metarole = fields.ExtDictSelectField(name='metarole', label=u'Метароль', anchor='100%', hide_trigger=False)
        field_metarole.configure_by_dictpack(metaroles.Metaroles_DictPack, app_meta.users_controller)
        
        self.form.items.extend([field_name, field_metarole])
        
        self.grid = ExtObjectGrid(title=u"Права доступа", region="center")
        self.grid.action_data = GetRolePermissionAction
        self.grid.action_new = AddRolePermission
        self.grid.top_bar.items.append(controls.ExtButton(text = u'Удалить', icon_cls = 'delete_item', handler='deletePermission'))
        self.grid.top_bar.button_refresh.hidden = True
        self.grid.force_fit = True
        self.grid.allow_paging = False
        self.grid.row_id_name = 'permission_code'
        self.grid.store.id_property = 'permission_code'
        self.grid.store.auto_save = False
        self.grid.add_column(header=u'Действие', data_index='permission_code', width=100)
        self.grid.add_column(header=u'Наименование', data_index='verbose_name', width=100)
        self.grid.add_bool_column(header=u'Запрет', data_index='disabled', width=50, text_false = u'Нет', text_true = u'Да')
        self.items.append(self.grid)
        
        self.buttons.extend([
            controls.ExtButton(text=u'Сохранить', handler='submitForm'),
            controls.ExtButton(text=u'Отмена', handler='cancelForm')
        ])

class AssignedUsersWindow(windows.ExtWindow):
    '''
    Окно просмотра пользователей, которые включены в данную роль
    '''
    def __init__(self, *args, **kwargs):
        super(AssignedUsersWindow, self).__init__(*args, **kwargs)
        self.title = u'Пользователи, с указанной ролью'
        self.width = 700
        self.height = 400
        self.modal = True
        
        self.layout = 'border'
        self.panel_north = panels.ExtForm(layout='form', region = 'north', height=40, label_width=50, style={'padding': '5px'})
        self.panel_center = panels.ExtPanel(layout='fit', region = 'center', body_cls='x-window-mc', title=u'Пользователи с данной ролью', style={'padding': '5px'})
        
        self.items.extend([
            self.panel_north,
            self.panel_center,
        ])
        
        # настройка северной панели
        self.field_role_name = fields.ExtStringField(name='role-name', label=u'Роль', anchor='100%', read_only=True)
        self.panel_north.items.append(self.field_role_name)
        
        # настройка центральной панели
        self.grid_users = panels.ExtObjectGrid()
        self.grid_users.allow_paging = False
        self.grid_users.add_column(header=u'Логин', data_index='user_login', width=100)
        self.grid_users.add_column(header=u'Фамилия', data_index='user_last_name', width=200)
        self.grid_users.add_column(header=u'Имя', data_index='user_first_name', width=200)
        self.grid_users.add_column(header=u'E-mail', data_index='user_email', width=200)
        self.grid_users.action_data = RoleAssignedUsersDataAction
        
        self.grid_users.action_new = SelectUsersToAssignWindowAction
        
        self.grid_users.action_delete = DeleteAssignedUser
        self.grid_users.top_bar.button_new.text = u'Добавить пользователей'
        self.grid_users.context_menu_grid.menuitem_new.text = u'Добавить пользователей'
        self.grid_users.context_menu_row.menuitem_new.text = u'Добавить пользователей'
        self.grid_users.context_menu_row.menuitem_delete.text = u'Удалить пользователя из роли'
        self.grid_users.row_id_name = 'assigneduser_id'
        self.panel_center.items.append(self.grid_users)
        
        
        self.buttons.append(controls.ExtButton(text=u'Закрыть', handler='closeWindow'))
        
class SelectPermissionWindow(windows.ExtEditWindow):
    '''
    Окно выбора прав доступа для добавления в роль
    '''
    def __init__(self, *args, **kwargs):
        super(SelectPermissionWindow, self).__init__(*args, **kwargs)
        self.title = u'Выберите права доступа для роли'
        self.width = 600
        self.height = 500
        self.maximizable = True
        self.layout = 'fit'
        self.tree = ExtObjectTree()
        self.tree.add_column(header=u'Имя', data_index = 'name', width=140)
        self.tree.master_column_id = 'name'
        self.tree.auto_expand_column = 'name'
        self.tree.add_column(header=u'Адрес', data_index = 'url', width=140)
        self.tree.top_bar.button_refresh.text = None
        self.tree.row_id_name = 'id'
        self.tree.top_bar.hidden = True
        self.tree.sm = ExtGridCheckBoxSelModel()
        self.tree.action_data = GetAllPermissions
        self.items.append(self.tree)
        self.buttons.append(controls.ExtButton(text=u'Выбрать', handler='''function select(btn, e, baseParams) {
            var tree = Ext.getCmp('%s');
            var records = tree.getSelectionModel().getSelections();
            win.fireEvent('closed_ok', records);
            win.close(true);
        }''' % self.tree.client_id))
        self.buttons.append(controls.ExtButton(text=u'Отмена', handler='cancelForm'))