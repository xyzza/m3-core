#coding:utf-8
'''
Created on 11.06.2010

@author: akvarats
'''

from django.db import transaction
from django.contrib.auth.models import User

from m3.ui import actions
from m3.ui.ext import windows
from m3.ui.ext import panels
from m3.ui.ext import fields
from m3.ui.ext import controls

from m3.helpers import ui as ui_helpers
from m3.db import safe_delete
from m3.helpers import logger
from m3.ui.actions import ActionContextDeclaration

import helpers
import models
from users import SelectUsersListWindow
from m3.ui.ext.panels.grids import ExtObjectGrid
from m3.contrib.users.models import UserRole


class RolesActions(actions.ActionPack):
    '''
    Пакет действий для подсистемы прав пользователей
    '''
    
    url = '/roles'
    
    def __init__(self):
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
        role = UserRole.objects.get(id=context.userrole_id)
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
        role = UserRole.objects.get(id=context.userrole_id)
        window = SelectUsersListWindow()
        window.grid.action_data = UsersForRoleAssignmentData
        window.grid.title = u'Выберите пользователей для роли "' + role.name + '"'
        window.action_submit = AssignUsers
        
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
            ActionContextDeclaration(name=u'userrole_id', type=int, required=True, default=0)
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
        
        self.title = 'Роли пользователей'
        self.layout = 'fit'
        self.width = 500
        self.height = 500
        self.template_globals = 'm3-users/roles-list-window.js'
        
        #=======================================================================
        # Настройка грида со списком ролей
        #=======================================================================
        self.grid = panels.ExtObjectGrid()
        self.grid.add_column(header=u'Наименование роли', data_index='name', width=500)
        self.items.append(self.grid)
        
        self.grid.action_data = RolesDataAction
        self.grid.action_new = EditRoleWindowAction
        self.grid.action_edit = EditRoleWindowAction
        self.grid.action_delete = DeleteRoleAction
        self.grid.top_bar.button_new.text = u'Добавить новую роль'
        self.grid.row_id_name = 'userrole_id'
        
        # дополнительные действия формы
        self.grid.action_show_assigned_users = ShowAssignedUsersAction
        
        self.grid.context_menu_row.add_item(text = u'Показать пользователей', icon_cls = 'edit_item', handler='contextMenu_ShowAssignedUsers')
        self.grid.top_bar.items.append(controls.ExtButton(text = u'Показать пользователей', icon_cls = 'edit_item', handler='contextMenu_ShowAssignedUsers'))
        
        #self.grid.context_menu_row.add_item(text = u'Показать разрешения роли', icon_cls = 'edit_item', handler='contextMenu_ShowPermissions')
        self.grid.context_menu_row.add_separator()
        
        
        self.init_component(*args, **kwargs)
        
class RolesEditWindow(windows.ExtEditWindow):
    '''
    Окно редактирования роли
    '''
    
    def __init__(self, new_role = False, *args, **kwargs):
        super(RolesEditWindow, self).__init__(*args, **kwargs)
        
        self.width=400
        self.height=100
        self.modal = True
        
        self.title = u'Роль пользователя'
        self.form = panels.ExtForm(layout='form')
        self.form.label_width = 100
        self.form.url = SaveRoleAction.absolute_url()
        
        field_name = fields.ExtStringField(name='name', label = u'Наименование', allow_blank=True, anchor='100%')
        
        self.form.items.append(field_name)
        
        #if not new_role:
        #    self.grid_users = ExtObjectGrid()
        #    self.form.items.append(self.grid_users)
        
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
        self.field_role_name = fields.ExtStringField(name='role-name', label='Роль', anchor='100%', read_only=True)
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