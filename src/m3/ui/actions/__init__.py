#coding:utf-8

class ActionResult(object):
    '''
    Класс описывает результат выполнения Action'а
    '''
    
    def __init__(self):
        self.data = None
        
    def get_http_response(self):
        '''
        Переопределяемый в дочерних классах метод.
        '''
        raise NotImplementedError()
    
class PreJsonResult(ActionResult):
    '''
    Результат выполнения операции в виде, например, списка объектов, 
    готовых к сериализации в JSON формат и отправке в response.
    Для данного класса в self.data храниться список некоторых объектов. 
    Метод self.get_http_response выполняет сериализацию этих данных в строковый формат.
    '''
    pass

class JsonResult(ActionResult):
    '''
    Результат выполнения операции в виде готового JSON объекта для возврата в response.
    Для данного класса в self.data храниться строка с данными JSON объекта.
    '''
    pass

class HttpReadyResult(ActionResult):
    '''
    Результат выполнения операции в виде готового HttpResponse. 
    Для данного класса в self.data храниться объект класса HttpResponse.
    '''
    pass

class ExtUIComponentResult(ActionResult):
    '''
    Результат выполнения операции, описанный в виде отдельного компонента пользовательского интерфейса.
    В self.data хранится некоторый наследник класса m3.ui.ext.ExtUiComponent.
    Метод get_http_response выполняет метод render у объекта в self.data.
    '''
    pass

class ExtUIScriptResult(ActionResult):
    '''
    По аналогии с ExtUiComponentResult, представляет собой некоторого наследника класса ExtUiComponent.
    Единственное отличие заключается в том, что get_http_response должен сформировать
    готовый к отправке javascript. Т.е. должен быть вызван метод self.data.get_script()
    '''
    pass

class ActionContextDeclaration(object):
    '''
    Класс, который декларирует необходимость наличия определенного параметра в объекте контекста
    '''
    name = ''
    default = None
    required = False
    type = None

class ActionContext(object):
    '''
    Контекст выполнения операции, восстанавливаемый из запроса.
    '''
    
    def build(self, request, rules):
        '''
        Выполняет заполнение собственных атрибутов согласно переданному request
        '''
        pass
    
class Action(object):
    '''
    Базовый класс описания Action'а в системе (аналог вьюшки)
    '''
    
    # Часть адреса запроса которая однозначно определяет его принадленость к конкретному Action'у
    url = ''
    
    # Ссылка на ActionPack к которому принадлежит данный Action
    parent = None
    
    def pre_run(self, request, context):
        '''
        Предварительная обработка входящего запроса (request) и контекста (context)
        перед передачений на исполнение
        '''
        return request
    
    def post_run(self, request, context, response):
        '''
        Постобработка результата работы Action'а
        '''
        return response
    
    def context_declaration(self):
        '''
        Метод декларирует необходимость наличия определенных параметров в контексте
        выполнения данной операции
        '''
        pass
    
    def run(self, request, context):
        '''
        Обеспечивает непосредственное исполнение запроса, аналог views в Django.
        Обязательно должен быть перекрыт наследником
        '''
        raise NotImplementedError()
    
class ActionPack(object):
    '''
    Базовый класс управления набором схожих по смыслу действий
    '''
    
    # Список действий зарегистрированных на исполнение в данном пакете
    actions = []
    
    # Список дочерних пакетов (подпакетов) зарегистрированных на исполнение в данном пакете
    subpacks = []
    
    # Ссылка на вышестоящий пакет, тот в котором зарегистрирован данный пакет
    parent = None
    
    def pre_run(self, request, context):
        '''
        Обработка входящего запроса HttpRequest перед передачений 
        на исполнение соответствующему Action'у
        '''
        return request
    
    def post_run(self, response, context, response):
        '''
        Обработка исходящего ответа HttpResponse после исполнения запроса
        соответствующим Action'ом
        '''
        return response
    
class ActionController(object):
    '''
    Класс коонтроллер - обеспечивает обработку пользовательских запросов путем передачи
    их на исполнение соответствущим Action'ам
    '''
    
    def __init__(self):
        self.packs = []
        
    def process_request(self, request):
        '''
        Обработка входящего запроса от клиента. Обрабатывается по аналогии с UrlResolver'ом Django
        '''
        pass
    
    def find_action(self):
        pass
    
    def build_context(self):
        pass
    
class ControllerCache(object):
    '''
    Внутренний класс подсистемы m3.ui.actions, который отвечает за прогрузку объявленных
    в приложениях прикладного проекта объектов ActionPack.
    В системе существует только один объект данного класса.
    '''
    
    def __init__(self):
        self.loaded = False
        
    def populate(self):
        pass
    
    def load_app_actions(self):
        pass