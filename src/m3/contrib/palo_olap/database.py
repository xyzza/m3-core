#coding: utf-8
'''
Управление базой на сервере Palo Olap
'''

from cube import PaloCube
from dimension import PaloDimension

class PaloDataBase():
    '''
    База данных. Содержит размерности и кубы
    '''
    
    def __init__(self, Interface, APIOutput):
        self.Sid = Interface.Sid
        self.Client = Interface.Client
        self.getUrlResult = Interface.getUrlResult
        self.UrlEncoder = Interface.UrlEncoder
        self.ServerRoot = Interface.ServerRoot
        APIOutput = APIOutput.split(';')
        self.__ID = APIOutput[0]
        self.__Name = APIOutput[1][1:-1]
        self.__NumDimensions = APIOutput[2]
        self.__NumCubes = APIOutput[3]
        self.__isSystem = bool(APIOutput[5])
        self.__Token = APIOutput[6]
        self.__DimensionsList = {}
        self.__CubesList = {}
        self.__DimensionsDictionary = {}
        self.__CubesDictionary = {}
        self.load_dimensions()
        self.loadCubes()  
    
    def getID(self):
        '''
        Идентификатор базы
        '''
        return self.__ID
    
    def getName(self):
        '''
        Наименование базы
        '''
        return self.__Name

    def getNumDimensions(self):
        '''
        Количество размерностей
        '''
        return self.__NumDims
    
    def getNumCubes(self):
        '''
        Количество кубов
        '''
        return self.__NumCubes
    
    def getToken(self):
        '''
        Токен базы
        '''
        return self.__Token
    
    def isSystem(self):
        '''
        Признак что база системная
        '''
        return self.__isSystem
    
    def load_dimensions(self):
        '''
        Загрузить размерности
        '''
        CMD = 'database/dimensions'
        Param = {'show_attribute': 1}
        Url = self.getDatabaseUrlRequest(CMD, Param)
        Res = self.getUrlResult(Url)
        for Row in Res.read().split('\n')[:-1]:
            DimObj = PaloDimension(self, Row)
            self.__DimensionsList[DimObj.getName()] = DimObj
            self.__DimensionsDictionary[str(DimObj.getID())] = DimObj.getName()

    def loadCubes(self):
        '''
        Загрузить кубы
        '''
        CMD = 'database/cubes'
        Param = {'show_attribute': 1}
        Url = self.getDatabaseUrlRequest(CMD, Param)
        Res = self.getUrlResult(Url)
        for Row in Res.read().split('\n')[:-1]:
            if int(Row.split(';')[4]) > 0:
                CubeObj = PaloCube(self, Row)
                self.__CubesList[CubeObj.getName()] = CubeObj
                self.__CubesDictionary[str(CubeObj.getID())] = CubeObj.getName()
    
    def get_dimension(self, dimension_name):
        '''
        Получить размерность по имени
        '''
        return self.__DimensionsList[dimension_name]

    def getDimensionNameByID(self, ID):
        '''
        Получить размерность по ID
        '''
        ID = str(ID)
        return self.__DimensionsDictionary[ID]

    def _getFullLoadedDimension(self, ID):
        '''
        Получить и загрузить размерность по ID
        '''
        ID = str(ID)
        Name = self.getDimensionNameByID(ID)
        Dim = self.__DimensionsList[Name]
        if Dim.isLoaded():
            return Dim
        else:
            Dim.loadElements()
            return self.__DimensionsList[Name]

    def dropDimension(self, Name):
        '''
        Удалить размерность по имени
        '''
        CMD = 'dimension/destroy'
        Param = {'dimension': self.getDimension(Name).getID()}
        Url = self.getDatabaseUrlRequest(CMD, Param)
        self.getUrlResult(Url)
        del self.__DimensionsDictionary[Name]

    def clearDimension(self, Name):
        '''
        Очистить размерность по имени
        '''
        self.getDimension(Name).Clear()
    
    def getCube(self, CubeName):
        '''
        Получить куб по имени
        '''
        try:
            return self.__CubesList[CubeName]
        except:
            return False

    def Save(self, Param = {}):
        '''
        Сохранить базу (не кубы)
        '''
        CMD = 'database/save'
        Url = self.getDatabaseUrlRequest(CMD)
        Res = self.getUrlResult(Url)
        return Res
    
    def getDatabaseUrlRequest(self, CMD, Param = {}):
        '''
        Ссылка на команду управления базой
        '''
        UrlRequest = self.ServerRoot + CMD + '?sid=' + self.Sid + '&database=' + self.getID()
        ''
        return UrlRequest + '&' + self.UrlEncoder(Param)
    
    def create_dimension(self, name):
        '''
        Создать размерность
        '''
        CMD = 'dimension/create'
        try:
            name = name.encode('utf-8')
        except UnicodeDecodeError:
            pass
        Param = {'new_name': name}
        Url = self.getDatabaseUrlRequest(CMD, Param)
        Res = self.getUrlResult(Url)
        DimObj = PaloDimension(self, Res.read())
        self.__DimensionsList[name] = DimObj
        self.__DimensionsDictionary[str(DimObj.getID())] = name
        return DimObj
    
    def dimension_exists(self, Name):
        '''
        Проверка присутствия размерности в кубе
        '''
        return Name in self.__DimensionsList.keys()