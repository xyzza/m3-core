#coding:utf-8

import uno
import os
import time
import subprocess
import shlex
from django.conf import settings
from django.utils import importlib
from com.sun.star.beans import PropertyValue
from com.sun.star.connection import NoConnectException


def __get_template_path():
    ''' Ищем корневую папку проекта '''
    mod = importlib.import_module(settings.SETTINGS_MODULE)
    settings_abs_path = os.path.dirname(mod.__file__)
    return settings_abs_path
    
DEFAULT_REPORT_TEMPLATE_PATH = __get_template_path()

IMAGE_REGEX = '<img .*>'

VARIABLE_REGEX  = '#[:alpha:]+((_)*[:digit:]*[:alpha:]*)*#'

class ReportGeneratorException(Exception):
    pass

class OOParserException(Exception):
    pass
    
class OORunner(object):
    '''
    Запускает, останавливает и соединяется с сервером OpenOffice
    '''
    # Порт, на котором будет запущен сервер
    PORT = 8010
    
    CONTEXT = None
    
    # Количество попыток соединения с сервером 
    CONNECTIONS_COUNT = 5
    
    @staticmethod    
    def start_server():
        '''
        Запускает OpenOffice
        ''' 
        command = 'soffice -accept="socket,host=localhost,port=%d;urp;\
                   StarOffice.ServiceManager" -norestore -nofirstwizard -nologo -headless' %OORunner.PORT  
        args = shlex.split(command)
        try:
            subprocess.Popen(args)
        except OSError as e:
            raise ReportGeneratorException, "Не удалось запустить сервер на порту %d: %s. \
            Возможно, не установлен OpenOffice или не прописан путь в переменной окружения PATH" % (OORunner.PORT, e.message)    
        
    @staticmethod
    def shutdown_desktop(desktop):
        '''
        Закрывает рабочую область OpenOffice
        '''     
        desktop.terminate()
        del desktop
        
    @staticmethod
    def get_desktop(start=False):
        '''
        Запускает сервер (если start = True), и возвращает объект Desktop
        '''        
        localContext = uno.getComponentContext()
        resolver = localContext.ServiceManager.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", localContext)
        if start:
            OORunner.start_server()   
        
        # Пытаемся соединиться с сервером
        for i in range(OORunner.CONNECTIONS_COUNT):
            try:
                OORunner.CONTEXT = resolver.resolve("uno:socket,host=localhost,port=%d;urp;StarOffice.ComponentContext" % OORunner.PORT)
            except NoConnectException:
                time.sleep(1)
                
        # Количество попыток исчерпано        
        if not OORunner.CONTEXT:        
            raise ReportGeneratorException, "Не удалось соединиться с сервером на порту %d" % OORunner.PORT     
        
        desktop = OORunner.CONTEXT.ServiceManager.createInstanceWithContext("com.sun.star.frame.Desktop", OORunner.CONTEXT)
        if not desktop:
            raise ReportGeneratorException, "Не удалось создать объект рабочей области Desktop на порту %d" % OORunner.PORT
        
        return desktop    
                              

class OOParser(object):
    '''
    Этот класс будет преобразовывать текст в соответствии с языком шаблонов.
    '''        
    
    def replace_beans(self, text, dict):
        '''
        Заменяет в переданной строке все вхождения ${object.attribute1.attribute2}
        на значения соответствующих элементов словаря. Причем, attribute1 может
        быть как атрибутом объекта, так и ключем словаря object. attribute2 может 
        быть значением функции без параметров. 
        '''
        pass
            
    def find_image_tags(self, document):
        '''
        Находит, извлекает и возвращает в списке все теги изображений. 
        ''' 
        return self.find_and_replace(document, IMAGE_TAG)        
               
    def find_and_replace(self, document, regex, replace=None):
        '''
        Находит все строки, соответствующие регулярному выражению(задается строкой,
        по правилам опенофиса), и заменяет их на replace (Если значение replace 
        не задано, замены не будет).
        В случае, если document - лист calc'а, очистится все значение ячейки. 
        Возвращает список удовлетворяющих регулярному выражению строк. 
        '''
        result = []
        search = document.createSearchDescriptor()
        search.SearchRegularExpression = True
        search.SearchString = regex
        found = document.findFirst(search)
        while found:
            result.append(found.String)
            if replace <> None:
                found.String = replace
            found = document.findNext(found.End, search)
        return result 
    
    def create_sections(self, document):
        '''
        Находит в листе Excel'я аннотации и составляет списки горизонтальных 
        и вертикальных секций. Считается, что горизонтальная секция начинается с 
        'горизонт', вертикальная  - с 'вертикаль'. На выходе - словарь
        {'горизонт':[секция1, секция2], 'вертикаль':[...]}
        TODO: переделать функцию, секции не будут делиться на горизонтальные и
        вертикальные
        '''   
        all_sections = {'горизонт':[], 'вертикаль':[]}
        annotations = document.getAnnotations()
        annotations_iter = annotations.createEnumeration()
        while annotations_iter.hasMoreElements():
            annotation = annotations_iter.nextElement()
            value = annotation.String
            position = annotation.Position
            section_names = value.split()
            for section_name in section_names:
                if section_name.startswith('горизонт') or section_name.startswith('Горизонт'):
                    #section_name[8] отрезает у названия секции приставку горизонт
                    section = [sec for sec in all_sections['горизонт'] if sec.name==section_name[8:]]
                    if section:
                        #Берем первую секцию с таким названием, других быть не должно
                        section[0].add_new_cell(position)
                    else:
                        new_section = Section()
                        new_section.name = section_name[8:]
                        new_section.add_new_cell(position)
                        all_sections['горизонт'].append(new_section)    
                elif section_name.startswith('вертикаль') or section_name.startswith('Вертикаль'):
                    #section_name[9] отрезает у названия секции приставку вертикаль
                    section = [sec for sec in all_sections['вертикаль'] if sec.name==section_name[9:]]
                    if section:
                        #Берем первую секцию с таким названием, других быть не должно
                        section[0].add_new_cell(position)
                    else:
                        new_section = Section()
                        new_section.name = section_name[9:]
                        new_section.add_new_cell(position)
                        all_sections['вертикаль'].append(new_section)    
                else:
                    raise OOParserException, "Неверно задана секция в \
                    ячейке c координатами (%s, %s)" %(position.Row+1, position.Column+1) 
        for section in all_sections['горизонт']:
            if not section.is_valid():
                raise OOParserException, "Неверно задана горизонтальная \
                секция %s. Определена одна из двух ячеек" %section.name  
        for section in all_sections['вертикаль']:
            if not section.is_valid():
                raise OOParserException, "Неверно задана вертикальная \
                секция %s. Определена одна из двух ячеек" %section.name     
        return all_sections                      


class Section(object):
    '''
    Класс, описывающий секции в шаблоне Excel
    '''
    
    def __init__(self, name=None, left_cell_addr=None, right_cell_addr=None):
        #Название секции
        self.name = name
        #Верхняя левая ячейка - объект com.sun.star.table.CellAddress
        self.left_cell_addr = left_cell_addr
        #Нижняя правая ячейка - объект com.sun.star.table.CellAddress
        self.right_cell_addr = right_cell_addr
        
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
            raise OOParserException, "Секция %s задается двумя ячейками, невозможно добавить третью." %self.name    
        #Если левая ячейка уже задана, определяем, действительно ли она левая    
        elif self.left_cell_addr:
            if (cell.Row > self.left_cell_addr.Row) and (cell.Column > self.left_cell_addr.Column):
                self.right_cell_addr = cell
            elif (cell.Row < self.left_cell_addr.Row) and (cell.Column < self.left_cell_addr.Column):   
                self.right_cell_addr = self.left_cell_addr
                self.left_cell_addr = cell     
            # Секция задана неверно, не записываем такую ерунду
            else:    
                raise OOParserException, "Неверно задана секция %s. \
                Определите верхнюю левую и нижнюю правую ячейки" %self.name
        # И то же самое, если задана правая ячейка
        elif self.right_cell_addr:
            if (cell.Row > self.right_cell_addr.Row) and (cell.Column > self.right_cell_addr.Column):
                self.left_cell_addr = self.right_cell_addr
                self.right_cell_addr = cell
            elif (cell.Row < self.left_cell_addr.Row) and (cell.Column < self.left_cell_addr.Column):
                self.left_cell_addr = cell     
            # Секция задана неверно, не записываем такую ерунду
            else:    
                raise OOParserException, "Неверно задана секция %s. \
                Определите верхнюю левую и нижнюю правую ячейки" %self.name                 
            
    def is_valid(self):
        '''
        Определяет, обе ли ячейки заданы
        '''        
        return self.left_cell_addr and self.right_cell_addr
    
    def copy(self, context, document, from_sheet, cell):
        '''
        Копирует секцию в документе из листа from_sheet начиная с ячейки cell
        Ячейку можно получить из листа так: cell = sheet.getCellByPosition(2,5)     
        '''
    
        dispatcher = context.ServiceManager.createInstanceWithContext("com.sun.star.frame.DispatchHelper", context) 
        section_range = from_sheet.getCellRangeByPosition(self.left_cell_addr.Column,
                                                      self.left_cell_addr.Row,
                                                      self.right_cell_addr.Column,
                                                      self.right_cell_addr.Row)
        document.CurrentController.select(section_range)
        prop = PropertyValue()
        prop.Name = "Flags"
        #Так задаются флаги: A - all or S - string V - value D - date, time F - formulas  
        #N - notes T - formats
        # Не копируем комментарии 
        prop.Value = "SVDFT"
        # Копируем выделенную секцию
        dispatcher.executeDispatch(document.getCurrentController().getFrame(), ".uno:Copy", "", 0, ())
        # Выделяем ячейку, в которую будет вставляться секция
        document.CurrentController.select(cell)
        # Вставляем секцию
        dispatcher.executeDispatch(document.getCurrentController().getFrame(), ".uno:InsertContents", "", 0,(prop,))
                    
                    
class OOImage(object):
    '''
    Класс для удобной работы с изображениями. 
    '''    
    
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
        
    def insert_into_text_document(self, document):
        '''
        Вставляет в документ изображение.В случае вставки в электронную таблицу
        нужно передавать лист         
        '''       
        document.getDrawPage().add(image)  
        
                                 
def create_document(desktop, path):
    '''
    Создает объект документа рабочей области из файла path.
    '''
    if path:
        #В windows, несмотря на режим запуска OO с опцией headless, новые 
        # документы открываются в обычном режиме. Это свойство делает документ
        # скрытым 
        prop = PropertyValue()
        prop.Name = "Hidden"
        prop.Value = True
        file_url = path_to_file_url(path)
        return desktop.loadComponentFromURL(file_url, "_blank", 0, (prop,))
    else:
        return desktop.getCurrentComponent()
             
             
def save_document_as(document, path, properties):
    '''
    Сохраняет документ по указанному пути со свойствами property. property - 
    объект com.sun.star.beans.PropertyValue
    '''           
    file_url = path_to_file_url(path)
    document.storeToURL(file_url, properties)
        

def path_to_file_url(path):
    '''
    Преобразует путь в url, понятный для uno.
    '''
    abs_path = os.path.abspath(path)
    file_url = uno.systemPathToFileUrl(abs_path)
    return file_url 


class DocumentReport(object):
    '''
    Класс для создания отчетов-текстовых документов.
    '''
    def __init__(self, template_name):
        if not template_name:
            raise ReportGeneratorException, "Не указан путь до шаблона"   
        self.desktop = OORunner.get_desktop(start=True)         
        template_path = os.path.join(DEFAULT_REPORT_TEMPLATE_PATH, template_name)
        self.document = create_document(self.desktop, template_path)
        
    def show(self, result_name, params, filter=None):    
        '''
        Подставляет в документе шаблона на место строк-ключей словаря params 
        значения, соответствующие ключам. 
        
        Допустимые значения фильтра: 
        "writer_pdf_Export" - pdf
        "MS Word 97" - doc
        "Rich Text Format" - rtf
        "HTML" - html
        "Text" - txt
        "writer8" - odt
        '''
        assert isinstance(params, dict) 
        if not result_name:
            raise ReportGeneratorException, "Не указан путь до файла с отчетом"
        properties = []
        if filter:
            filter_property = PropertyValue()
            filter_property.Name = "FilterName"
            filter_property.Value = filter
            properties.append(filter_property)
        parser = OOParser()
        for key, value in params.items():
            if not isinstance(key, str):
                raise ReportGeneratorException, "Значение ключа для подстановки в шаблоне должно быть строковым"
            parser.find_and_replace(self.document, '#'+key+'#', str(value))    
        #Если не все переменные в шаблоне были заменены, стираем оставшиеся
        parser.find_and_replace(self.document, VARIABLE_REGEX, '')
        result_path = os.path.join(DEFAULT_REPORT_TEMPLATE_PATH, result_name)
        save_document_as(self.document, result_path, tuple(properties))