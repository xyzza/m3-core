#coding: utf-8
'''
Управление размерностями куба на сервере Palo Olap
'''

ELEMENT_TYPE_NUMERIC = 1
ELEMENT_TYPE_STRING = 2
ELEMENT_TYPE_CONSOLIDATED = 4

class PaloDimension():
    def __init__(self, Connection, APIOutput):
        APIOutput = APIOutput.split(';')
        self.Sid = Connection.Sid
        self.Client = Connection.Client
        self.getUrlResult = Connection.getUrlResult
        self.getDatabaseUrlRequest = Connection.getDatabaseUrlRequest
        self.ServerRoot = Connection.ServerRoot
        self.__DataBaseID = Connection.get_id()
        self.__ID = APIOutput[0]
        try:
            name = APIOutput[1][1:-1].decode('utf-8')
        except UnicodeDecodeError:
            name = APIOutput[1][1:-1]
        self.__Name = name
        self.__NumElements = APIOutput[2]
        self.__Type = self._getType(APIOutput[6])
        self.__AttributeCubeID = APIOutput[8]
        self.__AttributeCubeName = self._getAttrCubeName()
        self.__Token = APIOutput[10]
        self.__Elements = {}
        self.__ElementsByID = {}
        self.__ElementsIDList = []
        self.__isLoaded = False

    def getDataBaseID(self):
        '''
        ID базы данных
        '''
        return self.__DataBaseID

    def get_id(self):
        '''
        ID размерности
        '''
        return self.__ID

    def getName(self):
        '''
        Наименование размерности
        '''
        return self.__Name

    def getNumElements(self):
        '''
        Количество элементов размерности
        '''
        return self.__NumElements

    def getType(self):
        '''
        Тип размерности
        '''
        return self.__Type

    def getAttributeCubeID(self):
        '''
        ID атрибута куба
        '''
        return self.__AttributeCubeID

    def getAttributeCubeName(self):
        '''
        Имя атрибута кубаы
        '''
        return self.__AttributeCubeName

    def getToken(self):
        '''
        Токен
        '''
        return self.__Token

    def getDimensionUrlRequest(self, CMD, Param = {}):
        '''
        Ссылка на команду управления размерностями
        '''
        Param['dimension'] = self.get_id()
        return self.getDatabaseUrlRequest(CMD, Param)

    def _getAttrCubeName(self):
        '''
        Получение имени атрибута куба
        '''
        CMD = 'cube/info'
        ID = self.getAttributeCubeID()
        if len(ID) > 0:
            Param = {'cube': self.getAttributeCubeID()}
            Url = self.getDatabaseUrlRequest(CMD, Param)
            Res = self.getUrlResult(Url)
            return Res.read().split(';')[1].replace('"', '')
        else:
            return False
    
    def isLoaded(self):
        '''
        Признак загрузки размерности 
        '''
        return self.__isLoaded
    
    def loadElements(self):
        '''
        Загрузить элементы
        '''
        CMD = 'dimension/elements'
        Url = self.getDimensionUrlRequest(CMD)
        Res = self.getUrlResult(Url)
        List = Res.read().split('\n')[:-1]
        for Element in List:
            id, name = Element.split(';')[:2]
            try:
                name = name[1:-1].decode('utf-8')
            except UnicodeDecodeError:
                name = name[1:-1]
            self.__Elements[name] = str(id)
            self.__ElementsByID[str(id)] = name
            self.__ElementsIDList.append(id)
            #self.__ElementsAliasByID[str(ID)]['alias_name'] = 'alias_value'
        self.__isLoaded = True
            
    def getElements(self):
        '''
        Получить элементы
        '''
        return self.__Elements
    
    def getElementsName(self):
        '''
        Получить имена элементов
        '''
        return self.__Elements.keys()

    def getElementID(self, Name):
        '''
        Получить ID элемента по имени
        '''
        if Name in self.__Elements:
            return self.__Elements[Name]
        else:
            return False
        
    def ElementsIDList(self):
        '''
        Получить ID элементов
        '''
        return self.__ElementsIDList
    
    def getElementsNameList(self):
        '''
        Получить список имен элементов
        '''
        return [self.__ElementsByID[ID] for ID in self.__ElementsIDList]

    def getKeyDW(self):
        '''
        Получить ключ размерности
        '''
        return self.__Elements['KeyDW']
        
    def getKeyDWName(self):
        '''
        Имя ключа размерности
        '''
        return 'KeyDW'

    def getElementName(self, ID):
        '''
        Получить имя элемента по ID
        '''
        return self.__ElementsByID[ID]

    def ElementExists(self, Name):
        '''
        Проверка наличия элемента
        '''
        return Name in self.__Elements

    def KeyDataWarehouseExists(self):
        '''
        Проверка, есть ли ключ размерности
        '''
        return 'KeyDW' in self.__Elements

    def deleteElement(self, Name):
        '''
        Удаление элемента
        '''
        CMD = 'element/destroy'
        Param = {'element': self.getElementID(Name)}
        Url = self.getDimensionUrlRequest(CMD, Param)
        self.getUrlResult(Url)
        
    def MoveElement(self, Name, NewPosition):
        '''
        Перемещение элемента в размерности
        '''
        CMD = 'element/move'
        Param = {'element': self.getElementID(Name),
                 'position': NewPosition}
        Url = self.getDimensionUrlRequest(CMD, Param)
        Res = self.getUrlResult(Url)
        return Res.read().split('\n')[:-1]
                
    def clear(self):
        '''
        Очистка размерности
        '''
        CMD = 'dimension/clear'
        Url = self.getDimensionUrlRequest(CMD)
        Res = self.getUrlResult(Url)
        return Res
                
    def _getType(self, TypeID):
        '''
        Преобразование типа размерности
        '''
        TypeDict = {"0": "NORMAL", "1": "SYSTEM", "2": "ATTRIBUTE", "3":"USER_INFO"}
        return TypeDict[TypeID]
    
    def create_element(self, name, type = ELEMENT_TYPE_NUMERIC, children_ids = None):
        '''
        Добавление элемента в размерность
        '''
        CMD = 'element/create'
        try:
            name = name.encode('utf-8')
        except UnicodeDecodeError:
            pass
        param = {'new_name': name,
                 'type': type
                 }
        if type == ELEMENT_TYPE_CONSOLIDATED:
            param['children'] = ','.join(['%s' % id for id in children_ids])
        Url = self.getDimensionUrlRequest(CMD, param)
        Res = self.getUrlResult(Url)
        Element = Res.read().split('\n')[:-1][0]
        id, name = Element.split(';')[:2]
        try:
            name = name[1:-1].decode('utf-8')
        except UnicodeDecodeError:
            name = name[1:-1]
        self.__Elements[name] = str(id)
        self.__ElementsByID[str(id)] = name
        self.__ElementsIDList.append(id)
        return [id,name]
    
    def create_consolidate_element(self, name, childrens):
        '''
        Создание сводного элемента размерности
        '''
        CMD = 'element/create'
        try:
            name = name.encode('utf-8')
        except UnicodeDecodeError:
            pass
        list = [] 
        for C in childrens:
            if self.getElementID(C):
                list.append(self.getElementID(C))
        Param = {'new_name': name,
                 'type': ELEMENT_TYPE_CONSOLIDATED,
                 'children': ','.join(list)}
        Url = self.getDimensionUrlRequest(CMD, Param)
        Res = self.getUrlResult(Url)
        Element = Res.read().split('\n')[:-1][0]
        id, name = Element.split(';')[:2]
        try:
            name = name[1:-1].decode('utf-8')
        except UnicodeDecodeError:
            name = name[1:-1]
        self.__Elements[name] = str(id)
        self.__ElementsByID[str(id)] = name
        self.__ElementsIDList.append(id)
        return [id,name]
    
    def create_elements(self, names, type = ELEMENT_TYPE_NUMERIC):
        '''
        Массовое добавление элементов в размерность
        '''
        CMD = 'element/create_bulk'
        names = ','.join(names)
        try:
            names = names.encode('utf-8')
        except UnicodeDecodeError:
            pass
        Param = {'name_elements': names,
                 'type': type}
        Url = self.getDimensionUrlRequest(CMD, Param)
        self.getUrlResult(Url)
        self.loadElements()
        
    def append_to_consolidate_element(self, element_id, children_ids):
        '''
        Добавление к сводному элементу размерности
        '''
        CMD = 'element/append'
        Param = {'element': element_id,
                 'children': ','.join(['%s' % id for id in children_ids])}
        Url = self.getDimensionUrlRequest(CMD, Param)
        self.getUrlResult(Url)
        self.loadElements()
    
    def replace_consolidate_element(self, element_id, children_ids):
        '''
        Замена значений сводного элемента размерности
        '''
        CMD = 'element/replace'
        Param = {'element': element_id,
                 'type': ELEMENT_TYPE_CONSOLIDATED,
                 'children': ','.join(['%s' % id for id in children_ids])}
        Url = self.getDimensionUrlRequest(CMD, Param)
        self.getUrlResult(Url)
        self.loadElements()