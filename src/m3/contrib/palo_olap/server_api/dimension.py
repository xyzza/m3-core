#coding: utf-8
'''
Управление размерностями куба на сервере Palo Olap
'''
ELEMENT_TYPE_NUMERIC = 1
ELEMENT_TYPE_STRING = 2
ELEMENT_TYPE_CONSOLIDATED = 4

class PaloDimension():
    '''
    измерение (по сути обертка над апи для добавления, редактирования элементов
    '''
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
        self.__maxId = None

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
    
    def deleteElement(self, id):
        '''
        Удаление элемента
        '''
        CMD = 'element/destroy'
        Param = {'element': id}
        Url = self.getDimensionUrlRequest(CMD, Param)
        self.getUrlResult(Url)
        
    def renameElement(self, id, new_name):
        '''
        Удаление элемента
        '''
        CMD = 'element/rename'
        try:
            new_name = new_name.encode('utf-8')
        except UnicodeDecodeError:
            pass
        Param = {'element': id,
                 'new_name': new_name}
        Url = self.getDimensionUrlRequest(CMD, Param)
        self.getUrlResult(Url)
        
    def moveElement(self, Name, NewPosition):
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
        name = name.strip()
        param = {'new_name': name,
                 'type': type
                 }
        if type == ELEMENT_TYPE_CONSOLIDATED and children_ids:
            param['children'] = ','.join(['%s' % id for id in children_ids])
        Url = self.getDimensionUrlRequest(CMD, param)
        Res = self.getUrlResult(Url)
        Element = Res.read().split('\n')[:-1][0]
        id, name = Element.split(';')[:2]
        return int(id)
    
        
    
    def create_elements(self, names, type = ELEMENT_TYPE_NUMERIC):
        '''
        Массовое добавление элементов в размерность
        '''
        def norm_name(name):
            name = name.strip()
            need_q = False
            if name.find(',')>-1:
                name = name.replace('",', '" ,') #заменим недопустимые сиволы
                need_q = True
            for wrong in [';']:
                if name.find(wrong)>-1:
                    need_q = True
            for bad in ['\n', '\r', '\t']:
                name = name.replace(bad, '')
            if need_q:
                name = '"%s"' % name
            
            return name
        assert len(names)!=0
        CMD = 'element/create_bulk'
        first_name = names.pop(0)
        start_id = self.create_element(first_name, type)
        names = [norm_name(obj) for obj in names]        
        
        str_names = ','.join(names)
        try:
            str_names = str_names.encode('utf-8')
        except UnicodeDecodeError:
            pass
        Param = {'name_elements': str_names,
                 'type': type}
        Url = self.getDimensionUrlRequest(CMD, Param)
        res = self.getUrlResult(Url)
        return range(start_id, start_id+len(names)+1)
        
    def append_to_consolidate_element(self, element_id, children_ids):
        '''
        Добавление к сводному элементу размерности
        '''
        CMD = 'element/append'
        Param = {'element': element_id,
                 'children': ','.join(['%s' % id for id in children_ids])}
        Url = self.getDimensionUrlRequest(CMD, Param)
        self.getUrlResult(Url)
    
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

    def replace_element(self, element_id, type = ELEMENT_TYPE_NUMERIC):
        '''
        Замена значений эелмента (смена типа)
        '''
        CMD = 'element/replace'
        Param = {'element': element_id,
                 'type': type
                 }
        Url = self.getDimensionUrlRequest(CMD, Param)
        self.getUrlResult(Url)

    def get_all_elements(self):
        '''
        вернуть все элементы в виде кортежа id, name
        '''
        CMD = 'dimension/elements'
        Url = self.getDimensionUrlRequest(CMD)
        Res = self.getUrlResult(Url)
        List = Res.read().split('\n')[:-1]
        res = []
        for Element in List:
            id, name = Element.split(';')[:2]
            try:
                name = name[1:-1].decode('utf-8').replace('""','"')
            except UnicodeDecodeError:
                name = name[1:-1]
            res.append((id, name))
        return res
        