#coding:utf-8

import uno
import os
import time
import subprocess
import shlex
from com.sun.star.beans import PropertyValue
from com.sun.star.connection import NoConnectException

IMAGE_TAG = '<img .*>'

class ReportGeneratorException(Exception):
    pass

class OOParserError(Exception):
    pass
    
class OORunner(object):
    '''
    Запускает, останавливает и соединяется с сервером OpenOffice
    '''
    port = 8010
        
    def start_server(self):
        '''
        Запускает OpenOffice
        ''' 
        command = 'soffice -accept="socket,host=localhost,port=%d;urp;\
                   StarOffice.ServiceManager" -norestore -nofirstwizard -nologo -headless' %self.port  
        args = shlex.split(command)
        try:
            subprocess.Popen(args)
        except OSError as e:
            raise ReportGeneratorException, "Не удалось запустить сервер на порту %d: %s. \
            Возможно, не установлен OpenOffice или не прописан путь в переменной окружения PATH" % (self.port, e.message)    
        time.sleep(1)
        
    def shutdown_desktop(self, desktop):
        '''
        Закрывает рабочую область OpenOffice
        '''     
        desktop.terminate()
        del desktop
        
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
        except NoConnectException:
            raise ReportGeneratorException, "Не удалось соединиться с сервером на порту %d" % self.port     
        
        desktop = context.ServiceManager.createInstanceWithContext("com.sun.star.frame.Desktop", context)
        if not desktop:
            raise ReportGeneratorException, "Не удалось создать объект рабочей области Desktop на порту %d" % self.port
        
        return desktop 
        
        
class OODocument(object):
    '''
    Класс, представляющий собой открытый документ. Может создаваться получением
    текущего документа рабочей области или открытием документа из файла. Если
    указанного файла не существует, будет создан новый, пустой.  
    '''
                               
    def __init__(self, desktop, path):
        if path:
            #В windows, несмотря на режим запуска OO с опцией headless, новые 
            # документы открываются в обычном режиме. Это свойство делает документ
            # скрытым 
            prop = PropertyValue()
            prop.Name = "Hidden"
            prop.Value = True
            file_url = path_to_file_url(path)
            self.document = desktop.loadComponentFromURL(file_url, "_blank", 0, (prop,))
        else:
            self.document = desktop.getCurrentComponent()
            
    def save_as(self, path, property=None):
        '''
        Сохраняет документ по указанному пути со свойствами property. property - 
        объект com.sun.star.beans.PropertyValue
        '''           
        file_url = path_to_file_url(path)
        if property:
            self.document.storeToURL(file_url, (property,))
        else:
            self.document.storeToURL(file_url, ())
        

def path_to_file_url(path):
    '''
    Преобразует путь в url, понятный для uno.
    '''
    abs_path = os.path.abspath(path)
    file_url = uno.systemPathToFileUrl(abs_path)
    return file_url    
                            

class OOParser(object):
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
            if replace:
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
                    raise OOParserError, "Неверно задана секция в \
                    ячейке c координатами (%s, %s)" %(position.Row+1, position.Column+1) 
                for section in all_sections['горизонт']:
                    if not section.is_valid():
                        raise OOParserError, "Неверно задана горизонтальная \
                        секция %s. Определена одна из двух ячеек" %self.name  
                for section in all_sections['вертикаль']:
                    if not section.is_valid():
                        raise OOParserError, "Неверно задана вертикальная \
                        секция %s. Определена одна из двух ячеек" %self.name     
        return all_sections                      


class Section(object):
    '''
    Класс, описывающий секции в шаблоне Excel
    '''
    
    def __init__(self, name=None, left_cell_addr=None, right_cell_addr=None):
        #Название секции
        name = name
        #Верхняя левая ячейка - объект com.sun.star.table.CellAddress
        left_cell_addr = left_cell_addr
        #Нижняя правая ячейка - объект com.sun.star.table.CellAddress
        right_cell_addr = right_cell_addr
        
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
            raise OOParserError, "Секция %s задается двумя ячейками, невозможно добавить третью." %self.name    
        #Если левая ячейка уже задана, определяем, действительно ли она левая    
        elif self.left_cell_addr:
            if (cell.Row > self.left_cell_addr.Row) and (cell.Column > self.left_cell_addr.Column):
                self.right_cell_addr = cell
            elif (cell.Row < self.left_cell_addr.Row) and (cell.Column < self.left_cell_addr.Column):   
                self.right_cell_addr = self.left_cell_addr
                self.left_cell_addr = cell     
            # Секция задана неверно, не записываем такую ерунду
            else:    
                raise Exception, "Неверно задана секция %s. \
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
                raise OOParserError, "Неверно задана секция %s. \
                Определите верхнюю левую и нижнюю правую ячейки" %self.name                 
            
    def is_valid(self):
        '''
        Определяет, обе ли ячейки заданы
        '''        
        return self.left_cell_addr and self.right_cell_addr
                    
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
