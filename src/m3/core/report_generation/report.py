#coding:utf-8
import uno
import os
import time

OPENOFFICE_PORT = 8010
OPENOFFICE_PATH = '/usr/lib/openoffice/program'
OPENOFFICE_COMMAND = 'soffice'
IMAGE_TAG = '<img .*>'

class OORunner:
    '''
    Запускает, останавливает и соединяется с сервером OpenOffice
    '''
    def __init__(self, app=OPENOFFICE_COMMAND, port=OPENOFFICE_PORT, 
                 path=OPENOFFICE_PATH):
        '''
        Создает объект OORunner для запуска сервера, слушающего заданный порт.
        Принимает параметры путь расположения офиса и строку-команду для запуска 
        приложения (writer или calc)   
        '''
        self.port = port
        self.path = path
        self.app = app
        
    def start_server(self):
        '''
        Запускает OpenOffice (TODO: сделать в режиме headless)
        ''' 
        args = [os.path.join(self.path, self.app), 
                '-accept=socket,host=localhost,port=%d;urp;StarOffice.ServiceManager' % self.port]   
        try:
            pid = os.spawnve(os.P_NOWAIT, args[0], args, os.environ)
        except Exception, e:
            raise Exception, "Не удалось запустить сервер на порту %d: %s" % (self.port, e.message)    
        
        if pid<=0:
            raise Exception, "Не удалось запустить сервер на порту %d" % (self.port)
        time.sleep(1)
        
    def stop_server(self):
        '''
        Останавливает OpenOffice
        '''     
        try:
            desktop = self.get_desktop(no_start=True)
            desktop.terminate()
        except Exception, e:
            pass
        
    def get_desktop(self, start=False):
        '''
        Запускает сервер (если start = True), и возвращает объект Desktop
        '''        
        localContext = uno.getComponentContext()
        resolver = localContext.ServiceManager.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", localContext)
        if start:
            self.start_server()
            
        try:
            context = resolver.resolve("uno:socket,host=localhost,port=%d;urp;StarOffice.ComponentContext" % self.port)
        except Exception, e:
            raise Exception, "Не удалось соединиться с сервером на порту %d" % self.port     
        
        try:
            desktop = context.ServiceManager.createInstanceWithContext("com.sun.star.frame.Desktop", context)
        except Exception, e:
            raise Exception, "Не удалось создать объект рабочей области Desktop на порту %d" % self.port
        if not desktop:
            raise Exception, "Не удалось создать объект рабочей области Desktop на порту %d" % self.port
        
        return desktop  
        
        
class OODocument:
    '''
    Класс, представляющий собой открытый документ. Может создаваться получением
    текущего документа рабочей области или открытием документа из файла. Если
    указанного файла не существует, будет создан новый, пустой.  
    '''
    document = None
                               
    def __init__(self, desktop, path):
        if path:
            file_url = path_to_file_url(path)
            self.document = desktop.loadComponentFromURL(file_url, "_blank", 0, tuple([]))
        else:
            self.document = desktop.getCurrentComponent()
            
    def save_as(self, path, property):
        '''
        Сохраняет документ по указанному пути со свойствами property. property - 
        объект com.sun.star.beans.PropertyValue
        '''           
        file_url = path_to_file_url(path)
        self.document.storeToURL(file_url, (property,))
        

def path_to_file_url(path):
    '''
    Преобразует путь в url, понятный для uno.
    '''
    abs_path = os.path.abspath(path)
    file_url = uno.systemPathToFileUrl(abs_path)
    return file_url    
                            

class OOParser:
    '''
    Этот класс будет всячески преобразовывать текст в соответствии с придуманным
    нами языком шаблонов.
    '''        
    
    def replace_beans(self, text, dict):
        '''
        Заменяет в переданной строке все вхождения ${object.attribute1.attribute2}
        на значения соответствующих элементов словаря. Причем, attribute1 может
        быть как атрибутом объекта, так и ключем словаря object. attribute2 может 
        быть значением функции без параметров.
        Если бин n-уровневый, (напр, $$${{{object}}}), функция сделает его 
        (n-1)- уровневым (т.е. $${{object}}) (Это типа экранирование такое)  
        '''
        pass
            
    def extract_image_tags(self, document):
         '''
         Находит, извлекает и возвращает в списке все теги изображений. 
         ''' 
         return self.find_and_replace(document, IMAGE_TAG, '')
               
         
    def find_and_replace(self, document, regex, replace):
        '''
        Находит все строки, соответствующие регулярному выражению(задается строкой,
        по правила опенофиса), и заменяет их на replace.
        В случае, если document - лист calc'а, очистится все значение ячейки. 
        Возвращает список того, что было удалено. 
        '''
        result = []
        search = document.createSearchDescriptor()
        search.SearchRegularExpression = True
        search.SearchString = regex
        found = document.findFirst(search)
        while found:
            result.append(found.String)
            found.String = replace
            found = document.findNext(found.End, search)
        return result 
    
    def create_sections(self, document):
        '''
        Находит в листе Excel'я аннотации и составляет списки горизонтальных 
        и вертикальных секций. Считается, что горизонтальная секция начинается с 
        'горизонт', вертикальная  - с 'вертикаль'. На выходе - словарь
        {'горизонт':[секция1, секция2], 'вертикаль':[...]}
        '''   
        all_sections = {u'горизонт':[], u'вертикаль':[]}
        annotations = document.getAnnotations()
        annotations_iter = annotations.createEnumeration()
        while annotations_iter.hasMoreElements():
            annotation = annotations_iter.nextElement()
            value = annotation.String
            position = annotation.Position
            section_names = value.split()
            for name in section_names:
                if name.startswith(u'горизонт') or name.startswith(u'Горизонт'):
                    #name[8] отрезает у названия секции приставку горизонт
                    section = [sec for sec in all_sections[u'горизонт'] if sec.name==name[8:]]
                    if section:
                        #Берем первую секцию с таким названием, других быть не должно
                        section[0].add_new_cell(position)
                    else:
                        new_section = Section()
                        new_section.name = name[8:]
                        new_section.add_new_cell(position)
                        all_sections[u'горизонт'].append(new_section)    
                elif name.startswith(u'вертикаль') or name.startswith(u'Вертикаль'):
                    #name[9] отрезает у названия секции приставку вертикаль
                    section = [sec for sec in all_sections[u'вертикаль'] if sec.name==name[9:]]
                    if section:
                        #Берем первую секцию с таким названием, других быть не должно
                        section[0].add_new_cell(position)
                    else:
                        new_section = Section()
                        new_section.name = name[9:]
                        new_section.add_new_cell(position)
                        all_sections[u'вертикаль'].append(new_section)    
                else:
                    raise Exception, u"Неверно задана секция в ячейке c координатами (%s, %s)" %(position.Row+1, position.Column+1) 
                for section in all_sections[u'горизонт']:
                    if not section.is_valid():
                        raise Exception, u"Неверно задана горизонтальная секция %s. Определена одна из двух ячеек" %self.name  
                for section in all_sections[u'вертикаль']:
                    if not section.is_valid():
                        raise Exception, u"Неверно задана вертикальная секция %s. Определена одна из двух ячеек" %self.name     
        return all_sections                      


class Section:
    '''
    Класс, описывающий секции в шаблоне Excel
    '''
    #Название секции
    name = None
    #Верхняя левая ячейка - объект com.sun.star.table.CellAddress
    left_cell_addr = None
    #Нижняя правая ячейка - объект com.sun.star.table.CellAddress
    right_cell_addr = None
    
    def add_new_cell(self, cell):
        '''
        Добавляет новую ячейку. Если одна из ячеек не определена, добавляет 
        ячейку как левую. Если добавляется вторая, определяется, какая из них левая
        '''
        #Если это первая добавляемая ячейка
        if not self.left_cell_addr and not self.right_cell_addr:
            self.left_cell_addr = cell
        #Если пытаются добавить третью ячейку, ругаемся    
        elif self.left_cell_addr and self.right_cell_addr:
            raise Exception, u"Секция %s задается двумя ячейками, невозможно добавить третью." %self.name    
        #Если левая ячейка уже задана, определяем, действительно ли она левая    
        elif self.left_cell_addr:
            if (cell.Row > self.left_cell_addr.Row)and(cell.Column > self.left_cell_addr.Column):
                self.right_cell_addr = cell
            elif (cell.Row < self.left_cell_addr.Row)and(cell.Column < self.left_cell_addr.Column):   
                self.right_cell_addr = self.left_cell_addr
                self.left_cell_addr = cell     
            # Секция задана неверно, не записываем такую ерунду
            else:    
                raise Exception, u"Неверно задана секция %s. Определите верхнюю левую и нижнюю правую ячейки" %self.name
        # И то же самое, если задана правая ячейка
        elif self.right_cell_addr:
            if (cell.Row > self.right_cell_addr.Row)and(cell.Column > self.right_cell_addr.Column):
                self.left_cell_addr = self.right_cell_addr
                self.right_cell_addr = cell
            elif (cell.Row < self.left_cell_addr.Row)and(cell.Column < self.left_cell_addr.Column):
                self.left_cell_addr = cell     
            # Секция задана неверно, не записываем такую ерунду
            else:    
                raise Exception, u"Неверно задана секция %s. Определите верхнюю левую и нижнюю правую ячейки" %self.name                 
            
    def is_valid(self):
        '''
        Определяет, обе ли ячейки заданы
        '''        
        return self.left_cell_addr and self.right_cell_addr
                    
class OOImage:
    '''
    Класс для удобной работы с изображениями. 
    '''    
    image = None
    
    def __init__(self, path, document):
        '''
        Создает объект com.sun.star.drawing.GraphicObjectShape, который может
        быть встроен в документ(а не просто выставлен линк на изображение).
        Нужно для того, чтобы не быть "привязанным" к тому компьютеру, где документ 
        был изначально создан.
        '''  
        image_url = path_to_file_url(path)        
        image = document.createInstance("com.sun.star.drawing.GraphicObjectShape") 
        bitmap = document.createInstance( "com.sun.star.drawing.BitmapTable" )
        #Просто рандомное имя image; это такой хитрый трюк получить само изображение,
        #а не ссылку на него
        if not bitmap.hasByName('image'):
            bitmap.insertByName('image', image_url)
        image_url = bitmap.getByName( 'image' )
        image.GraphicURL = image_url
        self.image = image
                
    def set_image_size(self, width, height):
        '''
        Задает свойства ширина и высота для изображения в единицах 1/100 миллиметра
        '''                
        size = uno.createUnoStruct('com.sun.star.awt.Size')
        size.Width = width
        size.Height = height
        self.image.Size = size
        
    def set_image_location(self, x, y):
        '''
        Задает положение изображения как позицию верхнего левого угла в единицах
        1/100 миллиметра
        '''
        point = uno.createUnoStruct('com.sun.star.awt.Point')
        point.X = x
        point.Y = y
        self.image.Position = point 
        
    def insert_into_document(self, document):
        '''
        Вставляет в документ изображение. Работает только для текстовых док-ов         
        '''       
        document.getDrawPage().add(image)       