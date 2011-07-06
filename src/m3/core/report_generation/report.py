#coding:utf-8

import os
import sys
import datetime
import decimal
from uuid import uuid4
import tempfile

from django.conf import settings
from django.utils import importlib


#FIXME: грязный хак для WIN и OSX
can_use_uno = False

# Подготовка к запуску pyuno под Windows
# Если после этого не заработает, значит все плохо!
# http://stackoverflow.com/questions/4270962/using-pyuno-with-my-existing-pythonn-installation
if sys.platform.startswith('win'):
    # Ищем исполняемый файл OpenOffice в PATH
    for path in os.environ['PATH'].split(';'):
        office_path = os.path.normpath(path)
        if os.path.exists( os.path.join(office_path, 'soffice.exe') ):
            # Добавляем переменные окружения необходимые для UNO
            sys.path.append( os.path.join(office_path, '..\\Basis\\program') )
            os.environ['URE_BOOTSTRAP'] = 'vnd.sun.star.pathname:' + os.path.join(office_path, 'fundamental.ini')
            os.environ['UNO_PATH'] = office_path
            os.environ['PATH'] = os.environ['PATH'] + ';' + os.path.join(office_path, '..\\URE\\bin')
            can_use_uno = True
            break
elif sys.platform.startswith('darwin'):
    office_path = '/Applications/OpenOffice.app/Contents'
    if not os.path.exists( os.path.join(office_path, 'MacOS/soffice') ):
        office_path = '/Applications/LibreOffice.app/Contents'
        if os.path.exists( os.path.join(office_path, 'MacOS/soffice') ):
            can_use_uno = True
    else:
        can_use_uno = True
    if can_use_uno:
        sys.path.append( os.path.join(office_path, 'basis-link/program') )
        os.environ['URE_BOOTSTRAP'] = 'vnd.sun.star.pathname:' + os.path.join(office_path, 'MacOS/fundamentalrc')
        os.environ['UNO_PATH'] = os.path.join(office_path, 'program')
        os.environ['PATH'] = os.environ['PATH'] + ':' + os.path.join(office_path, 'basis-link/ure-link/lib')
    can_use_uno = False  #FIXME: у меня мак 64-битный, а офиса нет 64-битного! только 32-битный. В итоге библиотека pyuno.so не грузится!
else:
    can_use_uno = True
  
if can_use_uno:
    import uno
    from com.sun.star.beans import PropertyValue
    from com.sun.star.connection import NoConnectException
#else:
    #FIXME: убрал, чтобы хоть как-то работать!  raise Exception(u'Unable to find OpenOffice (LibreOffice) in PATH variable') 


def __get_template_path():
    ''' Ищем корневую папку проекта '''
    mod = importlib.import_module(settings.SETTINGS_MODULE)
    settings_abs_path = os.path.dirname(mod.__file__)
    return settings_abs_path
    
DEFAULT_REPORT_TEMPLATE_PATH = __get_template_path()

IMAGE_REGEX = '<img .*>'

IMAGE_TAG = '<img %s>'

VARIABLE_REGEX  = '#[:alpha:]+((_)*[:digit:]*[:alpha:]*)*#'

TEMPORARY_SHEET_NAME = 'template_zw'

OPENOFFICE_SERVER_PORT = getattr(settings, "OPENOFFICE_SERVER_PORT", None)
if not OPENOFFICE_SERVER_PORT:
    OPENOFFICE_SERVER_PORT = 8010


class ReportGeneratorException(Exception):
    pass

class OOParserException(Exception):
    pass
    
class OORunner(object):
    '''
    Cоединяется с сервером OpenOffice
    '''
    # Порт, на котором будет запущен сервер
    PORT = OPENOFFICE_SERVER_PORT
    
    CONTEXT = None
    
    # Количество попыток соединения с сервером 
    CONNECTION_RETRY_COUNT = 5            

    @staticmethod
    def get_desktop():
        '''
        Запускает сервер и возвращает объект Desktop
        '''        
        localContext = uno.getComponentContext()
        resolver = localContext.ServiceManager.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", localContext)
    
        # Пытаемся соединиться с сервером
        for i in range(OORunner.CONNECTION_RETRY_COUNT):
            try:
                OORunner.CONTEXT = resolver.resolve("uno:socket,host=localhost,port=%d;urp;StarOffice.ComponentContext" % OORunner.PORT)
            except NoConnectException:
                raise ReportGeneratorException, "Не удалось соединиться с сервером openoffice на порту %d" % OORunner.PORT    
        
        desktop = OORunner.CONTEXT.ServiceManager.createInstanceWithContext("com.sun.star.frame.Desktop", OORunner.CONTEXT)
        if not desktop:
            raise ReportGeneratorException, "Не удалось создать объект рабочей области Desktop на порту %d" % OORunner.PORT
        
        return desktop    
                              

class OOParser(object):
    '''
    Этот класс преобразовывает текст в соответствии с языком шаблонов.
    '''        
    TIME_FORMAT = "%H:%M:%S" 
                
    def find_image_tags(self, document, image_name):
        '''
        Находит, и возвращает в списке все теги изображений. 
        ''' 
        image_tag = IMAGE_TAG %image_name
        return self.find_regex_cells(document, image_tag)        
               
    def find_and_replace(self, document, regex, replace):
        '''
        Находит все строки, соответствующие регулярному выражению(задается строкой,
        по правилам опенофиса), и заменяет их на replace. 
        Если в document передана область ячеек таблицы, замена будет происходить 
        только в ней. 
        '''
        replace_descriptor = document.createReplaceDescriptor()
        replace_descriptor.SearchRegularExpression = True
        replace_descriptor.SearchString = regex
        replace_descriptor.ReplaceString = replace
        document.replaceAll(replace_descriptor)
    
    def find_regex_cells(self, document, regex):
        '''
        Находит все строки, соответствующие регулярному выражению(задается строкой,
        по правилам опенофиса). 
        Возвращает список ячеек таблицы, в которых было найдено совпадение.
        '''
        result = []
        search_descriptor = document.createSearchDescriptor()
        search_descriptor.SearchRegularExpression = True
        search_descriptor.SearchString = regex
        found = document.findFirst(search_descriptor)
        while found:
            result.append(found)
            found.String = ''
            found = document.findFirst(search_descriptor)
        return result
    
    def create_sections(self, document, report_object):
        '''
        Находит в листе Excel'я аннотации и составляет список секций. Считается, 
        что начало секции в шаблоне обозначается знаком '+' (напр., '+Шапка'), конец
        секции - знаком '-' ('-Шапка')
        '''   
        all_sections = {}
        annotations = document.getAnnotations()
        annotations_iter = annotations.createEnumeration()
        while annotations_iter.hasMoreElements():
            annotation = annotations_iter.nextElement()
            value = annotation.String
            position = annotation.Position
            section_names = value.split()
            for section_name in section_names:
                section_name = section_name.strip()
                if section_name[0] in ['+', '-']:
                    if all_sections.has_key(section_name[1:]):
                        all_sections[section_name[1:]].add_new_cell(position)
                    else:
                        new_section = Section()
                        new_section.name = section_name[1:]
                        new_section.report_object = report_object
                        new_section.add_new_cell(position)
                        all_sections[section_name[1:]] = new_section    
                else:
                    raise OOParserException, "Секции в ячейке (%s, %s) \
                    должны начинаться со знака '+' или '-'" %(position.Row+1, position.Column+1)            
        for section in all_sections.values():
            if not section.is_valid():
                raise OOParserException, u"Неверно задана секция %s. \
                Определена одна из двух ячеек" %section.name  
        #Флаг 8 отвечает за удаление аннотаций.
        document.clearContents(8)          
        return all_sections  
    
    def strftime_less_1900(self, dt):
        """ 
        Превращает дату dt в строку формата <%d.%m.%Y>, 
        т.к. штатный питонячий strftime не понимает даты меньше 1900 года
        (Украдено из старого генератора отчетов)
        """
        day = str(dt.day).zfill(2)
        month = str(dt.month).zfill(2)
        year = str(dt.year).zfill(4)
        return '%s.%s.%s' % (day, month, year)

    def convert_value(self, value):
        '''
        Преобразовывает значение в тип, подходящий для отображения в openoffice
        ''' 
        if isinstance(value, datetime.datetime):
            return "%s %s" % (self.strftime_less_1900(value), value.time().strftime(self.TIME_FORMAT))
        elif isinstance(value, datetime.date):
            return str(self.strftime_less_1900(value))
        elif isinstance(value, datetime.time):
            return str(value.strftime(self.TIME_FORMAT))   
        elif isinstance(value, basestring):
            return value    
        elif isinstance(value, (int, float, decimal.Decimal, long)):
            return str(value).replace('.', ',')        
        else:
            return repr(value)           


class Section(object):
    '''
    Класс, объекты которого представляют собой секцию в шаблоне отчета. 
    Секции получаются c помощью метода get_section объекта SpreadsheetReport. 
    Секции существуют только в контексте объекта отчета SpreadSheetReport.
    '''
    
    def __init__(self, name=None, left_cell_addr=None, right_cell_addr=None, 
                 report_object=None):
        #Название секции
        self.name = name
        #Верхняя левая ячейка - объект com.sun.star.table.CellAddress
        self.left_cell_addr = left_cell_addr
        #Нижняя правая ячейка - объект com.sun.star.table.CellAddress
        self.right_cell_addr = right_cell_addr
        #Объект отчета, в контексте которого будет выводиться секция
        self.report_object = report_object
        #Список вставленных в секцию изображений
        self.images = []
        
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
            if (cell.Row >= self.left_cell_addr.Row) and (cell.Column >= self.left_cell_addr.Column):
                self.set_right_cell_addr(cell)
            elif (cell.Row < self.left_cell_addr.Row) and (cell.Column < self.left_cell_addr.Column):   
                self.left_cell_addr = cell  
                self.set_right_cell_addr(self.left_cell_addr)   
            # Секция задана неверно, не записываем такую ерунду
            else:    
                raise OOParserException, "Неверно задана секция %s. \
                Определите верхнюю левую и нижнюю правую ячейки" %self.name
        # И то же самое, если задана правая ячейка
        elif self.right_cell_addr:
            if (cell.Row >= self.right_cell_addr.Row) and (cell.Column >= self.right_cell_addr.Column):
                self.left_cell_addr = self.right_cell_addr
                self.set_right_cell_addr(cell)
            elif (cell.Row < self.left_cell_addr.Row) and (cell.Column < self.left_cell_addr.Column):
                self.left_cell_addr = cell 
            # Секция задана неверно, не записываем такую ерунду
            else:    
                raise OOParserException, "Неверно задана секция %s. \
                Определите верхнюю левую и нижнюю правую ячейки" %self.name       
    
    def set_right_cell_addr(self, cell_addr):
        '''
        Устанавливает адрес правой ячейки секции. 
        В случае, если ячейка объединена, ее адрес в опенофисе равен адресу левой 
        верхней ячейки, входящей в объединение.
        Эта функция находит адрес правой нижней ячейки, входящей в объединение.  
        '''
        document  = self.report_object.document
        if document.getSheets().hasByName(TEMPORARY_SHEET_NAME):
            src_sheet = document.getSheets().getByName(TEMPORARY_SHEET_NAME)
        else:
            raise ReportGeneratorException, "Лист-шаблон отсутствует. Возможно, отчет уже был отображен."
        right_cell = src_sheet.getCellByPosition(cell_addr.Column, cell_addr.Row)
        # Смотрим, объединена ли ячейка. Если да, адресом правой ячейки секции 
        # будем считать адрес правой нижней ячейки 
        if right_cell.IsMerged:
            cursor = src_sheet.createCursorByRange(right_cell)
            cursor.collapseToMergedArea()
            column = cell_addr.Column + cursor.Columns.Count - 1
            row = cell_addr.Row + cursor.Rows.Count - 1
            new_right_position = uno.createUnoStruct('com.sun.star.table.CellAddress')
            new_right_position.Column = column
            new_right_position.Row = row
        else:
            new_right_position = cell_addr 
        self.right_cell_addr = new_right_position                
            
    def is_valid(self):
        '''
        Определяет, обе ли ячейки заданы
        '''        
        return self.left_cell_addr and self.right_cell_addr
        
    def copy (self, src_sheet, dest_cell):
        '''
        Копирует секцию в документе из листа src_sheet начиная с ячейки cell
        Ячейку можно получить из листа так: cell = sheet.getCellByPosition(2,5) 
        '''
        src_section_range = src_sheet.getCellRangeByPosition(self.left_cell_addr.Column,
                                                      self.left_cell_addr.Row,
                                                      self.right_cell_addr.Column,
                                                      self.right_cell_addr.Row)
        src_section_addr = src_section_range.getRangeAddress()
        dest_cell_addr = dest_cell.getCellAddress()
        src_sheet.copyRange(dest_cell_addr, src_section_addr)
        
            
    def flush(self, params, vertical=True):
        '''
        Производит подстановку значений переменных в секции. 
        Выводит секцию в заданном направлении. 
        Первая секция выводится начиная с левого верхнего угла листа (с позиции (0,0)). 
        Расположение выводимых секций определяется следующим образом. 
        При выводе секции горизонтально секция выводится справа от последней 
        выведенной секции. При выводе секции вертикально секция выводится начиная 
        с левого края листа, ниже последней выведенной секции.
        '''
        document = self.report_object.document
        dest_sheet = document.getSheets().getByIndex(1)
        section_width = abs(self.left_cell_addr.Column - self.right_cell_addr.Column)+1
        section_height = abs(self.left_cell_addr.Row - self.right_cell_addr.Row)+1
        x, y = self.report_object.get_section_render_position(vertical)
        self.report_object.update_previous_render_info(vertical, (x,y), section_width, section_height)
        
        #Лист с результатом - второй по счету
        dest_cell = dest_sheet.getCellByPosition(x,y)
        if document.getSheets().hasByName(TEMPORARY_SHEET_NAME):
            src_sheet = document.getSheets().getByName(TEMPORARY_SHEET_NAME)
        else:
            raise ReportGeneratorException, "Невозможно вывести секцию в отчет, \
            лист-шаблон отсутствует. Возможно, отчет уже был отображен."    
        self.copy(src_sheet, dest_cell)
        section_range = dest_sheet.getCellRangeByPosition(x,y,x+section_width-1,y+section_height-1)
        parser = OOParser()
        for key, value in params.items():
            if not isinstance(key, basestring):
                raise ReportGeneratorException, "Значение ключа для подстановки в шаблоне должно быть строковым: %s" % key
            value = parser.convert_value(value)
            parser.find_and_replace(section_range, u'#'+key+u'#', value)      
        #Если не все переменные в шаблоне были заменены, стираем оставшиеся
        parser.find_and_replace(section_range, VARIABLE_REGEX, '')
        #Задаем размеры строк и столбцов
        self.set_columns_width(x, src_sheet, dest_sheet)
        self.set_rows_height(y, src_sheet, dest_sheet)
        #Вставка изображений в секцию
        self.flush_images(dest_sheet, section_range)  
        #Если не все теги изображений в шаблоне были заменены, стираем оставшиеся
        parser.find_and_replace(section_range, IMAGE_REGEX, '')
        
    def set_rows_height(self, y, src_sheet, dest_sheet):
        '''
        Выставляет высоту строк в листе отчета в соответствиии с высотой строк 
        в секции
        '''    
        dest_row_index = y
        for src_row_index in range(self.left_cell_addr.Row,self.right_cell_addr.Row+1):
            #Если у ряда уже устанавливали высоту, перезаписывать не будем
            if dest_row_index in self.report_object.defined_height_rows:
                return
            else:
                #Если у ряда выставлена автовысота, устанавливать высоту не нужно 
                if src_sheet.getRows().getByIndex(src_row_index).OptimalHeight:
                    dest_sheet.getRows().getByIndex(dest_row_index).OptimalHeight = True
                else:
                    dest_sheet.getRows().getByIndex(dest_row_index).Height = \
                    src_sheet.getRows().getByIndex(src_row_index).Height
                self.report_object.defined_height_rows.append(dest_row_index)
            dest_row_index+=1    
    
    def set_columns_width(self, x, src_sheet, dest_sheet):
        '''
        Выставляет ширину колонок в листе отчета в соответствиии с шириной колонок 
        в секции
        '''
        dest_column_index = x
        for src_column_index in range(self.left_cell_addr.Column,self.right_cell_addr.Column+1):
            #Если у колонки уже устанавливали ширину, перезаписывать не будем
            if not(dest_column_index in self.report_object.defined_width_columns):
                dest_sheet.getColumns().getByIndex(dest_column_index).Width = \
                src_sheet.getColumns().getByIndex(src_column_index).Width
                self.report_object.defined_width_columns.append(dest_column_index)
            dest_column_index+=1          
            
    def create_image(self, name):
        '''
        Возвращает изображение для вставки в документ.
        '''       
        image = OOImage(name, self.report_object.document)
        self.images.append(image)
        return image   
     
    def flush_images(self, dest_sheet, section_range):
        '''
        Вставляет изображения в отчет.
        '''
        for image in self.images:
            parser = OOParser()
            image_tags = parser.find_image_tags(section_range, image.name)  
            if not image_tags:
                error_message = u"В секции %s не найден тег, соответствующий \
                                изображению с именем %s" %(self.name, image.name)
                raise ReportGeneratorException, error_message 
            for image_tag in image_tags:
                image.create_graphic_shape()
                image.set_image_location(image.position[0]+image_tag.Position.X, image.position[1]+image_tag.Position.Y)
                image.set_image_size(image.width, image.height)
                image.insert_into_document(dest_sheet)                   
                        
                    
class OOImage(object):
    '''
    Класс для удобной работы с изображениями. 
    '''    
    
    def __init__(self, name, document):
        self.document = document
        self.name = name
        self.image = None
        self.width = 1000
        self.height = 1000
        self.position = (0, 0)
        self.path = None
    
    def load_from_file(self, path):
        '''
        Загружает изображение из файла и помещает его в BitmapTable.
        '''  
        self.path = str(path)
        image_url = path_to_file_url(path)        
        bitmap = self.document.createInstance( "com.sun.star.drawing.BitmapTable" )
        #Это такой хитрый трюк получить само изображение, а не ссылку на него
        if not bitmap.hasByName(self.path):
            bitmap.insertByName(self.path, image_url)
        if not bitmap.hasByName(self.path):
            raise ReportGeneratorException, u"Не удалось загрузить изображение %s по адресу %s" %(self.name, path)                
                
    def set_image_size(self, width, height):
        '''
        Задает свойства ширина и высота для изображения в единицах 1/100 миллиметра
        '''
        size = uno.createUnoStruct('com.sun.star.awt.Size')
        size.Width = width
        size.Height = height
        self.image.setSize(size)
        self.image.SizeProtect = True
        
    def set_image_location(self, x, y):
        '''
        Задает положение изображения как позицию верхнего левого угла в единицах
        1/100 миллиметра
        '''
        point = uno.createUnoStruct('com.sun.star.awt.Point')
        point.X = x
        point.Y = y
        self.image.Position = point 
        
    def create_graphic_shape(self):
        '''
        Создает объект com.sun.star.drawing.GraphicObjectShape, который может
        быть встроен в документ(а не просто выставлен линк на изображение).
        Нужно для того, чтобы не быть "привязанным" к тому компьютеру, где документ 
        был изначально создан.
        '''
        image = self.document.createInstance("com.sun.star.drawing.GraphicObjectShape") 
        bitmap = self.document.createInstance( "com.sun.star.drawing.BitmapTable" )
        image_url = bitmap.getByName(self.path)
        image.GraphicURL = image_url
        self.image = image
            
    def insert_into_document(self, document):
        '''
        Вставляет в документ изображение.В случае вставки в электронную таблицу
        нужно передавать лист         
        '''       
        document.getDrawPage().add(self.image) 
        
                                 
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

def get_temporary_file_path(temporary_file_name):
    '''
    Возвращает путь к временному файлу
    '''
    temporary_path = getattr(settings, "REPORT_TEMPORARY_FILE_PATH", None)
    if not temporary_path:
        temporary_path = tempfile.gettempdir()
    return os.path.join(temporary_path, temporary_file_name)

def copy_document(desktop, src_file_path, dest_file_path, filter=None):
    '''
    Создает копию файла и возвращает объект документа созданного файла.
    '''
    properties = []
    if filter:
        filter_property = PropertyValue()
        filter_property.Name = "FilterName"
        filter_property.Value = filter
        properties.append(filter_property)    
    source_document = create_document(desktop, src_file_path)
    try:
        save_document_as(source_document, dest_file_path, tuple(properties))
    finally:
        source_document.close(True)
    document = create_document(desktop, dest_file_path)
    return document 
    

class DocumentReport(object):
    '''
    Класс для представления отчета-текстового документа.
    При инициализации объекта происходит соединение с сервером OpenOffice и 
    открывается файл шаблона, заданный в параметре template_name.
    '''
    def __init__(self, template_name):
        if not template_name:
            raise ReportGeneratorException, "Не указан путь до шаблона"   
        self.desktop = OORunner.get_desktop()         
        self.document = self.get_template_document(template_name)
        
    def show(self, result_name, params, filter=None):    
        '''
        Производит подстановку значений переменных в шаблоне. 
        Соответствие имен переменных и значений задается в словаре params. 
        Сохраняет отчет в файл, указанный в result_name. 
        Параметр filter задает формат результирующего файла
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
            value = parser.convert_value(value)
            parser.find_and_replace(self.document, '#'+key+'#', value)    
        #Если не все переменные в шаблоне были заменены, стираем оставшиеся
        parser.find_and_replace(self.document, VARIABLE_REGEX, '')
        result_path = os.path.join(DEFAULT_REPORT_TEMPLATE_PATH, result_name)
        save_document_as(self.document, result_path, tuple(properties))
        # Удаление временного файла
        self.clean_temporary_file()
        
    def get_template_document(self, template_name):
        '''
        Создает копию файла шаблона в директории для временных файлов и возвращает 
        объект открытого документа шаблона.
        '''
        template_path = os.path.join(DEFAULT_REPORT_TEMPLATE_PATH, template_name)
        temporary_file_name = 'report_template_%s.odt' %str(uuid4())[:8]
        self.temporary_file_path = get_temporary_file_path(temporary_file_name)
        document = copy_document(self.desktop, template_path, self.temporary_file_path)
        return document 
    
    def clean_temporary_file(self):
        '''
        Закрывает и удаляет временный файл шаблона.
        '''
        self.document.close(True)
        if os.path.exists(self.temporary_file_path):
            os.remove(self.temporary_file_path)
            
            
class SpreadsheetReport(object): 
    '''
    Класс для представления отчета-электронной таблицы.
    При инициализации объекта происходит соединение с сервером OpenOffice, 
    открывается файл шаблона, заданный в переменной template_name и из шаблона 
    извлекается информация о заданных секциях. 
    '''       
    def __init__(self, template_name):
        
        #Задаем начальное состояние конечного автомата, описывающего порядок
        #размещения секций.
        #На основе параметров последней выведенной секции работает алгоритм, 
        #выводящий секции "построчно".
        
        #Выводилась ли последняя секция вертикально (вниз)
        self.previous_vertical = True
        
        #Ширина последней выведенной секции
        self.previous_width = 0 
        
        #Длина последней выведенной секции
        self.previous_height = 0
        
        #Координата ячейки, с которой выводилась последняя секция
        self.previous_position = (0, 0)
        
        #Координата ячейки, с которой будет выводиться следующая секция
        self.current_position = (None, None)
        
        #Номера колонок, ширина которых уже была задана
        self.defined_width_columns = []
        
        #Номера рядов, высота которых уже была задана
        self.defined_height_rows = []
        
        self.desktop = OORunner.get_desktop()         
        self.document = self.get_template_document(template_name)
        # Первый лист шаблона, в котором должны быть заданы секции
        template_sheet = self.document.getSheets().getByIndex(0)
        #Вставляем новый лист с таким же названием, как лист шаблона, на вторую
        # позицию
        template_sheet_name = template_sheet.getName()
        template_sheet.setName(TEMPORARY_SHEET_NAME)
        self.document.getSheets().insertNewByName(template_sheet_name, 1)
        #Находим все секции в шаблоне
        parser = OOParser()
        self.sections = parser.create_sections(template_sheet, self)

    def get_section(self, section_name):
        '''
        Возвращает секцию по ее названию.
        '''  
        try:
            if isinstance(section_name, str):
                section_name = section_name.decode('utf-8')
            return self.sections[section_name]
        except KeyError:
            raise ReportGeneratorException, u"Секция с именем %s не найдена. Список \
            доступных секций: %s" %(section_name, self.sections.keys())
            
    def show(self, result_name, filter=None):    
        '''        
        Сохраняет отчет в файл, указанный в result_name. 
        Параметр filter задает формат результирующего файла.
        '''
        if not result_name:
            raise ReportGeneratorException, "Не указан путь до файла с отчетом"
        properties = []
        if filter:
            filter_property = PropertyValue()
            filter_property.Name = "FilterName"
            filter_property.Value = filter
            properties.append(filter_property)
        result_path = os.path.join(DEFAULT_REPORT_TEMPLATE_PATH, result_name)
        if self.document.getSheets().hasByName(TEMPORARY_SHEET_NAME):
            self.document.getSheets().removeByName(TEMPORARY_SHEET_NAME)
        save_document_as(self.document, result_path, tuple(properties))
        # Удаление временного файла
        self.clean_temporary_file()        
        
    def find_section_position(self, vertical):
        '''
        Возвращает координаты позиции в листе, с которой должна выводиться секция. 
        '''
        # Определяем новые координаты на основе текущего состояния автомата
        previous_x = self.previous_position[0]
        previous_y = self.previous_position[1]
        if self.previous_vertical:
            if vertical:
                x = previous_x
                y = previous_y + self.previous_height
            else:
                x = self.previous_width 
                y = previous_y
        else:
            if vertical:
                x = 0
                y = previous_y + self.previous_height
            else:
                x = previous_x + self.previous_width 
                y = previous_y 
        return (x,y)          
    
    def update_previous_render_info(self, vertical, section_position, section_width, section_height):
        '''
        Обновляем информацию о последней выведенной секции
        '''
        if self.current_position[0] is None or self.current_position[1] is None:
            self.previous_position = section_position
            self.previous_vertical = vertical
            self.previous_width = section_width    
            if vertical:
                self.previous_height = section_height
            else:
                self.previous_height = max(self.previous_height, section_height)
        else:
            self.current_position = (None, None)                            
         
    def get_section_render_position(self, vertical=True):
        '''
        Возвращает кортеж, пару координат (x,y) ячейки, начиная с которой  
        будет выводиться следующая секция.
        '''
        if self.current_position[0] is None or self.current_position[1] is None:
            return self.find_section_position(vertical)
        else:
            return self.current_position            
       
    def set_section_render_position(self, position_x, position_y):
        '''
        Устанавливает координаты ячейки электронной таблицы, с которой будет 
        выведена следующая секция. 
        '''
        assert isinstance(position_x, int)
        assert isinstance(position_y, int)
        self.current_position = (position_x, position_y)  
        
    def get_template_document(self, template_name):
        '''
        Создает копию файла шаблона в директории для временных файлов и возвращает 
        объект открытого документа шаблона.
        '''
        template_path = os.path.join(DEFAULT_REPORT_TEMPLATE_PATH, template_name)
        temporary_file_name = 'report_template_%s.ods' %str(uuid4())[:8]
        self.temporary_file_path = get_temporary_file_path(temporary_file_name)
        document = copy_document(self.desktop, template_path, self.temporary_file_path)
        return document 
    
    def clean_temporary_file(self):
        '''
        Закрывает и удаляет временный файл шаблона.
        '''
        self.document.close(True)
        if os.path.exists(self.temporary_file_path):
            os.remove(self.temporary_file_path)      
             