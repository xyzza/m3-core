#coding:utf-8
'''
Created on 27.02.2010

@author: akvarats
'''

from m3.ui.ext.base import ExtUIComponent

from m3.ui.ext.misc import ExtDataStore

class BaseExtField(ExtUIComponent):
    '''
    Базовый класс для полей
    '''
    def __init__(self, *args, **kwargs):
        super(BaseExtField, self).__init__(*args, **kwargs)
        # Нужно выставлять пустое значение для того, чтобы обязательные поля,
        # те, которые allow_blank=False подсвечивались автоматически после
        # рендеринга
        self.value = ""

        # Признак нередактируемости поля
        self.read_only = False

        # Признак, что поле используется для изменения значения,
        # а не для навигации - при Истине будут повешаны обработчики на изменение окна
        # см. m3.js
        self.is_edit = True

        # Не обязательно для заполнения (True), иначе поле должно быть не пустым
        self.allow_blank = True

        # Тип валидации
        self.vtype = None

        # Этот текст будет выводиться, если поле незаполненно
        self.empty_text = None

        # Минимальные длина поля и текст ошибки, если длина была превышена
        self.min_length = self.min_length_text = None

        # Максимальные длина поля и текст ошибки, если длина была превышена
        self.max_length = self.max_length_text = None

        # Валидация на регулярное вырожение и текст ошибки, если валидация будет нарушена
        self.regex = self.regex_text = None

        # Порядок обхода для этого поля
        self.tab_index = None

        # Свой CSS класс валидации для некорректно заполненного поля
        # TODO: Вынести в атрибут класса, а не атрибут экземпляра
        self.invalid_class = 'm3-form-invalid'

        # Текст, который будет отображаться, если поле заполненно некорректно
        self.invalid_text = None

        # Плагины к полям ввода
        self.plugins = []

        # Дополнительные DOM-атрибуты
        self.auto_create = {"tag": "input", "type": "text", "size": "20", "autocomplete": "off"}

    def t_render_label_style(self):
        if isinstance(self.label_style, dict):
            return ';'.join(['%s:%s' % (k, v) for k, v in self.label_style.items()])
        else:
            return self.label_style

    def t_render_regex(self):
        return '/%s/' % self.regex

    def make_read_only(self, access_off=True, exclude_list=[], *args, **kwargs):
        # Описание в базовом классе ExtUiComponent.
        # Обрабатываем исключения.
        access_off = self.pre_make_read_only(access_off, exclude_list, *args, **kwargs)
        # Выключаем\включаем компоненты.
        self.read_only = access_off
        # Выключаем/включаем обязательность заполнения.
        if not hasattr(self, '_allow_blank_old'):
            self._allow_blank_old = self.allow_blank
        self.allow_blank = True if access_off else self._allow_blank_old

    #===========================================================================
    # Врапперы над событиями listeners[...]
    #===========================================================================
    @property
    def handler_specialkey(self):
        return self._listeners.get('specialkey')

    @handler_specialkey.setter
    def handler_specialkey(self, function):
        self._listeners['specialkey'] = function

    @property
    def handler_change(self):
        return self._listeners.get('change')

    @handler_change.setter
    def handler_change(self, function):
        self._listeners['change'] = function

    def render_base_config(self):
        if self.read_only:
            grey_cls = 'm3-grey-field'
            self.cls = grey_cls  if not self.cls else self.cls + grey_cls

        super(BaseExtField, self).render_base_config()
        self._put_config_value('value', self.value)

        self._put_config_value('readOnly', self.read_only, self.read_only)
        self._put_config_value('isEdit', self.is_edit)
        self._put_config_value('allowBlank', self.allow_blank, not self.allow_blank)
        self._put_config_value('vtype', self.vtype)
        self._put_config_value('emptyText', self.empty_text)
        self._put_config_value('minLength', self.min_length)
        self._put_config_value('minLengthText', self.min_length_text)
        self._put_config_value('maxLength', self.max_length)
        self._put_config_value('maxLengthText', self.max_length_text)
        self._put_config_value('regex', self.t_render_regex, self.regex)
        self._put_config_value('regexText', self.regex_text)
        self._put_config_value('tabIndex', self.tab_index)
        self._put_config_value('invalidClass', self.invalid_class)
        self._put_config_value('invalidText', self.invalid_text)
        self._put_config_value('plugins', (lambda: '[%s]' % ','.join(self.plugins)), self.plugins)

        # дополнительно вешаем DOM-атрибуты через Ext.Field.autoCreate
        if self.max_length:
            self.auto_create.update({"maxlength": self.max_length})
            self._put_config_value('autoCreate', self.auto_create)

class BaseExtTriggerField(BaseExtField):
    '''
    Базовый класс для комбобокса, поля выбора справочника
    '''

    ALL = 'all'
    QUERY = 'query'

    def __init__(self, *args, **kwargs):
        super(BaseExtTriggerField, self).__init__(*args, **kwargs)

        # Поле, которое будет отображаться при выборе
        self.display_field = None

        # Поле, которое будет использоваться в качестве значения
        self.value_field = None

        #
        self.hidden_name = None

        # Скрыть триггера выподающего списка
        self.hide_trigger = False

        #
        self.type_ahead = False

        #
        self.query_param = None

        # Количество записей, показываемых на странице
        self.page_size = None

        # Максимальная высота выподаюего списка
        self.max_heigth_dropdown_list = None

        # Количество введенных символов, после которых произойдет запрос на сервер
        self.min_chars = None

        # Ссылка на хранилище данных
        self.__store = None

        #
        self.mode = None

        # Признак возможности редактирования
        self.editable = True

        # если True, то для выбора будут доступны все элементы,
        # в противном случае будут доступны только элементы, начинающиеся с
        # введенной строки
        self.trigger_action_all = False

        #
        self.force_selection = False

        # Текст, если записей в сторе нет
        self.not_found_text = None

        # Текст, отображаемый при загрузке данных
        self.loading_text = u'Загрузка...'

    def set_store(self, store):
        self.mode = 'local' if isinstance(store, ExtDataStore) else 'remote'
        self.__store = store

    def get_store(self):
        return self.__store

    store = property(get_store, set_store)

    def t_render_store(self):
        assert self.__store, 'Store is not define'
        return self.__store.render([self.display_field, ])

    @property
    def name(self):
        return self.hidden_name

    @name.setter
    def name(self, value):
        self.hidden_name = value

    #//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\
    # Врапперы над событиями listeners[...]
    #------------------------------------------------------------------------
    @property
    def handler_change(self):
        return self._listeners.get('change')

    @handler_change.setter
    def handler_change(self, function):
        self._listeners['change'] = function

    @property
    def handler_select(self):
        return self._listeners.get('select')

    @handler_select.setter
    def handler_select(self, function):
        self._listeners['select'] = function

    @property
    def handler_afterrender(self):
        return self._listeners.get('afterrender')

    @handler_afterrender.setter
    def handler_afterrender(self, function):
        self._listeners['afterrender'] = function

    def pre_render(self):
        if self.get_store():
            self.get_store().action_context = self.action_context
        super(BaseExtTriggerField, self).pre_render()

    def render_base_config(self):
        self.pre_render()

        super(BaseExtTriggerField, self).render_base_config()
        self._put_config_value('displayField', self.display_field)
        self._put_config_value('valueField', self.value_field)
        self._put_config_value('hiddenName', self.hidden_name)
        self._put_config_value('hideTrigger', self.hide_trigger)
        self._put_config_value('typeAhead', self.type_ahead)
        self._put_config_value('queryParam', self.query_param)
        self._put_config_value('pageSize', self.page_size)
        self._put_config_value('maxHeight', self.max_heigth_dropdown_list)
        self._put_config_value('minChars', self.min_chars)
        self._put_config_value('mode', self.mode)
        # значение атрибута trigger_action_all приводится к булевому типу
        # и в конфиг попадает соответствующая константа
        self._put_config_value('triggerAction',
            self.ALL if self.trigger_action_all else self.QUERY
        )
        self._put_config_value('editable', self.editable)
        self._put_config_value('forceSelection', self.force_selection)
        self._put_config_value('valueNotFoundText', self.not_found_text)
        self._put_config_value('loadingText', self.loading_text)
        self._put_config_value('store', self.t_render_store, self.get_store())
