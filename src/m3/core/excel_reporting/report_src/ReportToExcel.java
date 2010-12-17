/*
 * Excel report generator for platform BARS M3
 * Author: Safiullin Vadim
 * License: BSD
 * Version: 0.3 development in progress
 */

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.text.DateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.poi.hssf.usermodel.HSSFCell;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Comment;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Footer;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.PrintSetup;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.ss.util.CellRangeAddress;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

public class ReportToExcel {
	/**
	 * @param args
	 * @throws Exception 
	 */
	public static void main(String[] args) throws Exception {	
		// Как пользоваться?
		if (args.length == 0){
			System.out.println("Report generator for M3 platform.");
			System.out.println("Use command line arguments:");
			System.out.println("java -jar report.jar ENCODING FILEPATH");
			System.out.println("FILEPATH - full path to excel template file.");
			System.out.println("ENCODING - file or console encoding, like UTF-8 or windows-1251");
			return;
		}
		
		ReportGenerator report = null;
		if (args.length == 2)
			// Для отладки запускай с параметрами
			// "windows-1251" "s://STAND_ALONE_SOFTWARE//_DEV//workspace//report//media//json.txt" 
			report = ReportGenerator.createFromFiles(args[0], args[1]);
		else if (args.length == 1){
			report = ReportGenerator.createFromStdin(args[0]);
		}

		report.generate();

		System.out.println("Complete!");
	}
}

class ReportGenerator{
	/**
	 * Получение данных для отчета из JSON файла
	 * @param JSON_filename
	 * @param encoding
	 * @return
	 * @throws IOException
	 * @throws InvalidFormatException
	 * @throws ParseException
	 */
	
	final static String TOKEN_IF = "#ЕСЛИ";
	final static String TOKEN_THEN = " ТО";
	final static String[] TOKEN_CONDITIONS = new String[]{"="}; //TODO: Когда-нибудь тут будет больше условий ;)
	final static String PROP_FONT = "ШРИФТ";
	final static String PROP_COLOR = "ЦВЕТ";
	final static HashMap<String, Short> COLOR_MAP = new HashMap<String, Short>();
	static final String TAG_REPEAT_START = "#ПОВТОРЯТЬСТРОКУ";
	static final String TAG_REPEAT_END = "##ПОВТОРЯТЬСТРОКУ";
	static final String TAG_AUTOHIGHT = "#АВТОВЫСОТА";
	
	public static ReportGenerator createFromFiles(String encoding, String JSON_filename)
	throws IOException, InvalidFormatException, ParseException{
		InputStream fis = new FileInputStream(JSON_filename);
		InputStreamReader isr = new InputStreamReader(fis, encoding);
		JSONParser json = new JSONParser();
		JSONObject data = (JSONObject)json.parse(isr);
		return new ReportGenerator(data);
	}
	
	public static ReportGenerator createFromStdin(String encoding) 
	throws IOException, ParseException, InvalidFormatException{
		InputStreamReader isr = new InputStreamReader(System.in, encoding);
		JSONParser json = new JSONParser();
		JSONObject data = (JSONObject)json.parse(isr);
		return new ReportGenerator(data);
	}

	Workbook in_book;
	JSONObject root;
	Sheet in_sheet, out_sheet;
	ArrayList<CellRangeAddress> merged_regions;
	
	// Во время генерации отчета происходит поиск некоторых специальных ячеек по их комментарию
	// Они запоминаются и используются в дальнейшем
	Cell cell_repeat_tag_start = null;
	Cell cell_repeat_tag_end = null;
	
	
	private ReportGenerator(JSONObject json) throws InvalidFormatException, IOException{
		String XLS_filename = (String)json.get("TEMPLATE_FILE_PATH");
	    InputStream inp = new FileInputStream(XLS_filename);
	    Workbook book = WorkbookFactory.create(inp);
		
		this.in_book = book;
		this.root = json;
		in_sheet = book.getSheetAt(0);
		out_sheet = createShadowSheet();
		
		// Инициализация всяких констант ;)
		initializeConstants();
	}
	
	private void initializeConstants() {
		// Это потому что я не умею определять HashMap сразу
		COLOR_MAP.put("КРАСНЫЙ", IndexedColors.RED.getIndex());
		COLOR_MAP.put("ЗАЛЕНЫЙ", IndexedColors.GREEN.getIndex());
		COLOR_MAP.put("ЖЕЛТЫЙ", IndexedColors.YELLOW.getIndex());
		COLOR_MAP.put("ЧЕРНЫЙ", IndexedColors.BLACK.getIndex());
		COLOR_MAP.put("СИНИЙ", IndexedColors.BLUE.getIndex());
	}

	/**
	 * Вызывается из копирования ячейки, чтобы запомнить позиции ячеек помеченных специальными тегами.
	 * Сделать это можно только тут, т.к. новые ячейки имеют другие координаты
	 * @param oldCell старая ячейка содержащая комментарий
	 * @param newCell новая ячейка
	 */
	private void saveSpecialCellPositions(Cell oldCell, Cell newCell){
		Comment comment = oldCell.getCellComment();
		if (comment!=null){
			String text = comment.getString().getString().toUpperCase();
			if (text.equals(TAG_REPEAT_START))
				cell_repeat_tag_start = newCell;
			else if (text.equals(TAG_REPEAT_END))
				cell_repeat_tag_end = newCell;
		}
	}
	
	/**
	 * Копирование ячейки 1 к 1
	 * @param oldCell
	 * @param newCell
	 */
	private void copyCell(Cell oldCell, Cell newCell){
		saveSpecialCellPositions(oldCell, newCell);
        newCell.setCellStyle(oldCell.getCellStyle());

        // Копирум значение
        switch (oldCell.getCellType()) {
        	case HSSFCell.CELL_TYPE_STRING:
        		newCell.setCellValue(oldCell.getStringCellValue());
                break;
            case HSSFCell.CELL_TYPE_NUMERIC:
            	newCell.setCellValue(oldCell.getNumericCellValue());
                break;
            case HSSFCell.CELL_TYPE_BLANK:
            	newCell.setCellType(HSSFCell.CELL_TYPE_BLANK);
                break;
            case HSSFCell.CELL_TYPE_BOOLEAN:
            	newCell.setCellValue(oldCell.getBooleanCellValue());
                break;
            case HSSFCell.CELL_TYPE_FORMULA:
            	newCell.setCellFormula(oldCell.getCellFormula());
                break;
        }
	}
	
	/**
	 * Ищет начало тега РАЗВЕРТКИ для заданной строки
	 * @param currentRow
	 * @return
	 */
	private Range searchBeginOfRange(Row currentRow) {
		for (Cell current_cell: currentRow){
    		if (current_cell.getCellType() == Cell.CELL_TYPE_STRING){
    			String cell_text = current_cell.getStringCellValue();
    			int pos = cell_text.indexOf("#");
    			if (pos == 0){
    				Range range = new Range();
    				range.name = cell_text.substring(1);
    				range.start_row = currentRow.getRowNum() + 1;
   					range.cell_num = current_cell.getColumnIndex();
   					return range;
   				}
   			}
		}
		return null;
	}
	
	/**
	 * Ищет конец тега РАЗВЕРТКИ для заданного регина в интервале строк
	 * @param range
	 * @param start_row
	 * @param end_row
	 * @return
	 * @throws Exception
	 */
	private int searchEndOfRange(Range range, int start_row, int end_row) throws Exception{
		for (int row_num = start_row + 1; row_num <= end_row; row_num++){
			Row row = in_sheet.getRow(row_num);
			if (row != null){
				Cell current_cell = row.getCell(range.cell_num, Row.RETURN_BLANK_AS_NULL);
				if (current_cell != null){
					if (current_cell.getCellType() == Cell.CELL_TYPE_STRING){
						String cell_text = current_cell.getStringCellValue();
		    			if (cell_text.compareTo("##" + range.name) == 0){
		    				range.end_row = row_num - 1;
		    				return row_num;
		    			}
					}
				}
			}
		}
		throw new Exception("No close tag found for " + range.name);
	}
	
	/**
	 * Находит в заданном регионе объединенные ячейки и транслирет их на результат исходя из смещения
	 * @param start_orig_row номер строки начала секции шаблона
	 * @param end_orig_row номер строки конца секции щаблона
	 * @param offset номер строки начала результирующей секции
	 */
	private void copyMergedRegions(int start_orig_row, int end_orig_row, int offset){
		for (CellRangeAddress merged_region: merged_regions){
			int firstRow = merged_region.getFirstRow();
			for (int virtRow = start_orig_row; virtRow <= end_orig_row; virtRow++){
				if (firstRow == virtRow){
					// Делаем аналогичные объединенные ячейки
					CellRangeAddress new_addr = merged_region.copy();
					int h = new_addr.getLastRow() - new_addr.getFirstRow();
					new_addr.setFirstRow(offset + new_addr.getFirstRow() - start_orig_row);
					new_addr.setLastRow(new_addr.getFirstRow() + h);
					out_sheet.addMergedRegion(new_addr);
				}
			}
		}
	}
	
	/**
	 * Обработка диапазона строк в шаблоне с записью в результат
	 * @param obj спозиционированный JSON объект
	 * @param range
	 * @param write_to_row номер строки с которой начинается запись (начальное смещение)
	 * @return
	 * @throws Exception
	 */
	private int renderRange(JSONObject obj, Range range, int write_to_row) throws Exception{
		int inserted_rows = 0;
		int start_section = range.start_row;
		int new_sector_start = write_to_row;
		// Перебираем все ячейки в регионе 
		int row_num = range.start_row;
		for (; row_num <= range.end_row; row_num++){
	    	Row current_row = in_sheet.getRow(row_num);
	    	if (current_row == null){
	    		inserted_rows++;
	    		continue;
	    	}
	    	
	    	Range inner_range = searchBeginOfRange(current_row);
	    	if (inner_range == null){
	    		// Копируем строку в новый лист
	    		copyRowWithReplace(obj, write_to_row, inserted_rows, current_row);
	    		inserted_rows++;
	    		
	    	} else {
	    		// Перед обработкой региона объединяем верхние ячейки
	    		copyMergedRegions(start_section, row_num, new_sector_start);
	    		
	    		// Ищем конец региона
	    		int end_region = searchEndOfRange(inner_range, row_num + 1, range.end_row);
	    		JSONArray arr = (JSONArray)obj.get(inner_range.name);
	    		for (int i = 0; i < arr.size(); i++){
	    			Object new_obj = arr.get(i);
	    			int writed = renderRange((JSONObject)new_obj, inner_range, write_to_row + inserted_rows);
	    			inserted_rows += writed;
	    		} 
	    		row_num = end_region;
	    		
	    		start_section = row_num;
	    		new_sector_start = write_to_row + inserted_rows - 1;
	    	}

	    }
		// Объединение нужно делать даже если не было вложенных регионов
		copyMergedRegions(start_section, row_num, new_sector_start);
		return inserted_rows;
	}

	/**
	 * Копирование строки из шаблона в результат с обработкой тегов
	 * @param obj спозиционированный JSON объект
	 * @param write_to_row
	 * @param inserted_rows
	 * @param current_row
	 * @throws Exception 
	 */
	private void copyRowWithReplace(JSONObject obj, int write_to_row, int inserted_rows, Row current_row) throws Exception {
		boolean autoHeight = false;
		for (Cell current_cell: current_row){
			Row out_row = out_sheet.getRow(write_to_row + inserted_rows);
			if (out_row == null)
				out_row = out_sheet.createRow(write_to_row + inserted_rows);
			
			// Если в комментарии автовысота, то не переписываем высоту строки
			Comment comm = current_cell.getCellComment();
			if (comm != null)
				if (comm.getString().getString().toUpperCase().equals(TAG_AUTOHIGHT))
					autoHeight = true;
			if (!autoHeight)
				out_row.setHeight(current_row.getHeight());
			Cell out_cell = out_row.getCell(current_cell.getColumnIndex(), Row.CREATE_NULL_AS_BLANK);
			
			// Установка стиля оригинальной ячейке
			processConditionTag(current_cell, obj);
			
			copyCell(current_cell, out_cell);
			
			// Подстановка значений в скопированный ячейке
			processReplaceTag(out_cell, obj, "");
		}
	}
	
	/*
	 * Обрабатывает условия внутри комментария ячейки.
	 * Пока поддерживается синтаксис ЕСЛИ условие ТО свойства.
	 * @param outCell изменяемая ячейка
	 * @param obj спозиционированный JSON объект
	 */
	private void processConditionTag(Cell outCell, JSONObject obj) throws Exception {
		// Если ли комментарий вообще?
		Comment comm = outCell.getCellComment();
		if (comm == null)
			return;
		
		// Пытаемся найти выражение "ЕСЛИ"
		String comment_text = comm.getString().getString();
		boolean has_token_if = (comment_text.length() > 5 && comment_text.toUpperCase().startsWith(TOKEN_IF));
		if (!has_token_if)
			return;
		int token_if_index = comment_text.toUpperCase().indexOf(TOKEN_THEN);
		if (has_token_if && token_if_index<0)
			throw new Exception("Token " + TOKEN_IF + " found but token " + TOKEN_THEN + " not found.");
			
		// Найдено! Извлекаем условие и свойства
		String condition_text = comment_text.substring(TOKEN_THEN.length() + 3, token_if_index);
		String properties_text = comment_text.substring(token_if_index + TOKEN_THEN.length());
		
		// Проверяем удовлетворяется ли условие
		int condition_index = 0;
		int condition_token_len = 0;
		for (String cond: TOKEN_CONDITIONS){
			condition_index = condition_text.indexOf(cond);
			if (condition_index > 0){
				condition_token_len = cond.length();
				break;
			}
		}
		if (condition_index == 0)
			throw new Exception("Condition not found!");
		
		// Извлекаем значение первого операнда из контекста 
		String operand1 = condition_text.substring(0, condition_index);
		Object value = obj.get(operand1);
		if (value==null)
			throw new Exception("Not found value for variable " + operand1);
		operand1 = value.toString();
		
		// Извлекаем значения операндов
		String operand2 = condition_text.substring(condition_index + condition_token_len);

		boolean equal = false;
		// Пробуем с целыми 
		try{
			int value1 = Integer.parseInt(operand1);
			int value2 = Integer.parseInt(operand2);
			if (value1 == value2)
				equal = true;
			
		}catch (Exception e){
			// Пробуем с булево
			try{
				boolean value1 = Boolean.parseBoolean(operand1);
				boolean value2 = Boolean.parseBoolean(operand2);
				if (value1 == value2)
					equal = true;
				
			}catch (Exception ex){
				// Пробуем со строками
				try{
					if (operand1.equals(operand2))
						equal = true;
					
				}catch (Exception exc){
					// Не удалось сравнить!
					throw new Exception("Not comparable operands " + operand1 + " and " + operand2);
				}
			}
		}
		
		//FIXME: Поддерживать больше условий!
		if (equal){			
			// Теперь начинается самое интересное! Нужно распарсить параметры новых свойств ячейки!
			String[] properties = properties_text.split(",");
			for (String prop: properties){
				String[] lex = prop.replaceAll(" ", "").split(":");
				if (lex.length != 2)
					throw new Exception("Invalid property definition " + prop);

				processCellProperty(outCell, lex[0], lex[1]);
			}
		}
	}
	
	/*
	 * Задает ячейке новое свойство. Проблема заключается в том, что нельзя имзменить текущий стиль ячейки, 
	 * потому что его могут использовать другие ячейки, соответственно они тоже изменяется.
	 * Нужно создать новый стиль на основе старого.
	 * @param outCell изменяемая ячейка
	 * @param property название свойства
	 * @param value значение свойства
	 */
	private void processCellProperty(Cell outCell, String property, String value) throws Exception{
		// Создаем новый стиль на основе старого
		Workbook wb = outCell.getSheet().getWorkbook();
		CellStyle new_style = wb.createCellStyle();
		new_style.cloneStyleFrom(outCell.getCellStyle());
		// Создаем новый шрифт на основе старого
		Font new_font = clone_font(wb, wb.getFontAt(new_style.getFontIndex()));
		
		if (property.equals(PROP_COLOR)){
			Short color = COLOR_MAP.get(value);
			if (color == null)
				throw new Exception("Unknown color " + value);
			new_font.setColor(color);
			
		} else if (property.equals(PROP_FONT)){
			if (value.equals("ЖИРНЫЙ"))
				new_font.setBoldweight(Font.BOLDWEIGHT_BOLD);
			else if (value.equals("ПОДЧЕРКНУТЫЙ"))
				new_font.setUnderline(Font.U_SINGLE);
			else if (value.equals("ЗАЧЕРКНУТЫЙ"))
				new_font.setStrikeout(true);
			else
				throw new Exception("Unknown property value " + value);
			
		} else
			throw new Exception("Unknown property " + property);
		
		new_style.setFont(new_font);
		outCell.setCellStyle(new_style);
	}

	private Font clone_font(Workbook wb, Font font){
		Font new_font = wb.createFont();
		new_font.setBoldweight(font.getBoldweight());
		new_font.setCharSet(font.getCharSet());
		new_font.setColor(font.getColor());
		new_font.setFontHeight(font.getFontHeight());
		new_font.setFontHeightInPoints(font.getFontHeightInPoints());
		new_font.setFontName(font.getFontName());
		new_font.setItalic(font.getItalic());
		new_font.setStrikeout(font.getStrikeout());
		new_font.setTypeOffset(font.getTypeOffset());
		new_font.setUnderline(font.getUnderline());
		return new_font;
	}
	
	/*
	 * В строке может встретится специальный тег M3 обозначающий что в ней содержится
	 * тип данных не поддерживаемый напрямую JSON
	 * Тег обозначается #m3..# , где .. 2 символа под обозначение типа 
	 */
	private String getTypeTagFromString(String value){
		if ((value.length() >= 6) && (value.substring(0, 3).equals("#m3")) && (value.charAt(5) == '#')){
			return value.substring(3, 5);
		}
		return null;
	}
	
	static final Pattern TAG_REGEX_REPLACE = Pattern.compile("\\$.+?\\$");
	
	/**
	 * Поиск и обработка тега ЗАМЕНА в ячейке 
	 * @param outCell 
	 * @param obj спозиционированный JSON объект
	 * @throws Exception 
	 */
	private void processReplaceTag(Cell outCell, JSONObject obj, String token_prefix) throws Exception {
		if (outCell.getCellType() != Cell.CELL_TYPE_STRING)
			return;
		String cell_text = outCell.getStringCellValue();
		
		Matcher m = TAG_REGEX_REPLACE.matcher(cell_text);	
		HashMap<String, Object> keys = new HashMap<String, Object>();
		while (m.find()){
			// Извлекаем ключ из найденного выражения
			String token = m.group();
			String key = token.substring(1, token.length() - 1);
			
			// Если задан префикс, то подходят только ключи с заданным префиксом
			if (token_prefix.length() > 0)
				if (key.indexOf(token_prefix) != 0)
					continue;
				else
					key = key.substring(token_prefix.length());
			
			Object value = obj.get(key);
			// Значение для переменной не найдено, значит разработчики так и задумали (оптимистично)
			if (value == null)
				value = "";
			
			keys.put(token, value);
		}
		
		if (keys.isEmpty())
			return;
		
		// Причем если тег только один и заполняет всю строку, то нужно поменять тип ячейки под это значение
		if (keys.size() == 1){
			String token = keys.keySet().toArray()[0].toString();
			Object value = keys.get(token);
			String str_value = value.toString();
			
			if (cell_text.length() == token.length()){
				if (value.getClass() == String.class){
					// Строка может быть не просто строка, а специальный тип
					String inner_type = getTypeTagFromString(str_value);
					if (inner_type != null){
						str_value = str_value.substring(6);
						if (inner_type.equals("dd")){
							Date d = DateFormat.getDateInstance(DateFormat.SHORT, Locale.GERMANY).parse(str_value);
							outCell.setCellValue(d);
						}else if (inner_type.equals("tt")){
							Date d = DateFormat.getTimeInstance(DateFormat.SHORT, Locale.GERMANY).parse(str_value);
							outCell.setCellValue(d);
						}else if (inner_type.equals("dt")){
							Date d = DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT).parse(str_value);
							outCell.setCellValue(d);
						}else
							throw new Exception("Unknown M3 type token " + str_value);
					}else
						outCell.setCellValue(str_value);
				}else if (value.getClass() == Long.class){
					outCell.setCellValue(Long.parseLong(str_value));
				}else if (value.getClass() == Double.class){
					outCell.setCellValue(Double.parseDouble(str_value));
				}else if (value.getClass() == Boolean.class){
					outCell.setCellValue(Boolean.parseBoolean(str_value));
				}
				return;
			}
		}
		
		// В исходном значении строки нужно заменить каждый тег на соответствующее значение
		for (Map.Entry<String, Object> entry: keys.entrySet()){
			String token = entry.getKey();
			String str_value = entry.getValue().toString();
				
			// Если внутри есть специальный тег типа, то удаляем его
			if (getTypeTagFromString(str_value) != null)
				str_value = str_value.substring(6);
			
			cell_text = cell_text.replace(token, str_value);
		}
		outCell.setCellValue(cell_text);
	}

	/**
	 * Возвращает новый лист со скопированными глобальными параметрами
	 * @return
	 */
	public Sheet createShadowSheet(){
		Sheet out_sheet = in_book.createSheet("RESULT");
		// Пока только ширины колонок
		for (int i = 0; i < 256; i++){
			int width = in_sheet.getColumnWidth(i);
			out_sheet.setColumnWidth(i, width);
		}
		
		// Копируем кучу параметров листа
		out_sheet.setAutobreaks(in_sheet.getAutobreaks());
		out_sheet.setDisplayFormulas(in_sheet.isDisplayFormulas());
		out_sheet.setDisplayGridlines(in_sheet.isDisplayGridlines());
		out_sheet.setDisplayZeros(in_sheet.isDisplayZeros());
		out_sheet.setDisplayRowColHeadings(in_sheet.isDisplayRowColHeadings());
		
		// Копируем кучу параметров печати
		PrintSetup out_print = out_sheet.getPrintSetup();
		PrintSetup in_print = in_sheet.getPrintSetup();
		out_print.setCopies(in_print.getCopies());
		out_print.setDraft(in_print.getDraft());
		out_print.setFitHeight(in_print.getFitHeight());
		out_print.setFitWidth(in_print.getFitWidth());
		out_print.setFooterMargin(in_print.getFooterMargin());
		out_print.setHeaderMargin(in_print.getHeaderMargin());
		out_print.setHResolution(in_print.getHResolution());
		out_print.setLandscape(in_print.getLandscape());
		out_print.setLeftToRight(in_print.getLeftToRight());
		out_print.setNoColor(in_print.getNoColor());
		out_print.setNoOrientation(in_print.getNoOrientation());
		out_print.setNotes(in_print.getNotes());
		out_print.setPageStart(in_print.getPageStart());
		out_print.setPaperSize(in_print.getPaperSize());
		out_print.setScale(in_print.getScale());
		out_print.setVResolution(in_print.getVResolution());
		
		// Колонтитулы, мать их, неправильно ставит MS Office 2007
		// Если генератор падает тут, значит колонтитул нужно прописать вручную
		Footer in_foot = in_sheet.getFooter();
		Footer out_foot = out_sheet.getFooter();
		out_foot.setCenter(in_foot.getCenter());
		out_foot.setLeft(in_foot.getLeft());
		out_foot.setRight(in_foot.getRight());
				
		return out_sheet;
	}
	
	/**
	 * Возвращает список диапазонов объединенный ячеек на листе
	 * @param sheet
	 * @return
	 */
	private ArrayList<CellRangeAddress> getMergedRegions(Sheet sheet){
		ArrayList<CellRangeAddress> merged_cells = new ArrayList<CellRangeAddress>();
		for (int i = 0; ; i++){
			CellRangeAddress addr = sheet.getMergedRegion(i);
			if (addr != null)
				merged_cells.add(addr);
			else
				break;
		}
		return merged_cells;
	}
	
	/**
	 * Сдвигает все содержимое вправо
	 * @param start_row Начальная строка интервала сдвига
	 * @param end_row Конечная строка интервала сдвига
	 * @param start_col Колонка с которой начинается сдвиг (включительно)
	 * @param offset Количество смещаемых колонок
	 */
	private void horizontalShift(Sheet sheet, int start_row, int end_row, int start_col, int offset){
		for (int row_num = start_row; row_num <= end_row; row_num++){
			Row current_row = sheet.getRow(row_num);
			if (current_row == null)
				continue;
			
			// Нужно брать ячейки с конца строки по start_col и копировать их на offset позиций правее
			short last_col = current_row.getLastCellNum();
			for (short col_num = last_col; col_num >= start_col; col_num--){
				Cell current_cell = current_row.getCell(col_num);
				if (current_cell == null)
					continue;
				
				Cell new_cell = safeGetCell(sheet, row_num, col_num + offset);
				copyCell(current_cell, new_cell);
			}
		}
	}
	
	/**
	 * Фундаментальный метод!
	 * Безопасно возвращает ячейку, если ее нет, то создает пустую
	 * @param destSheet Страница из которой берется ячейка
	 * @param row_offset Номер строки ячейки
	 * @param col_offset Номер колонки ячейки
	 * @return Cell
	 */
	private Cell safeGetCell(Sheet destSheet, int row_num, int col_num){
		Row r = destSheet.getRow(row_num);
		if (r == null)
			r = destSheet.createRow(row_num);
		Cell c = r.getCell(col_num);
		if (c == null)
			c = r.createCell(col_num);
		return c;
	}
	
	/**
	 * Фундаментальный метод!
	 * Копирует прямоугольный регион из одной книги в другую по заданным координатам
	 * @param sourceRegion Координаты исходного региона на странице
	 * @param sourceSheet Исходная страница с которой читаем ячейки
	 * @param destSheet Целевая страница на которую пишем ячейки
	 * @param row_offset Номер строки с которая начинается запись региона
	 * @param col_offset Номер колонки с которой начинается запись региона
	 */
	private void copyRegion(SheetRegion sourceRegion, Sheet sourceSheet, Sheet destSheet, int row_offset, int col_offset){
		// Для каждой строки в регионе
		for (int row_num = sourceRegion.start_row; row_num <= sourceRegion.end_row; row_num++){
			Row current_row = sourceSheet.getRow(row_num);
			if (current_row == null)
				continue;
			
			// Для каждой ячейки в строке региона
			for (int col_num = sourceRegion.start_col; col_num <= sourceRegion.end_col; col_num++){
				Cell current_cell = current_row.getCell(col_num, Row.CREATE_NULL_AS_BLANK);
				
				// Создаем целевую ячейку и копируем в неё
				int y = row_offset + row_num - sourceRegion.start_row;
				int x = col_offset + col_num - sourceRegion.start_col;
				Cell destCell = safeGetCell(destSheet, y, x);
				copyCell(current_cell, destCell);
			}
		}
		
		// !!! Копирование смежных регионов !!!
		// Подразумевается что внутри региона смежные ячейки не вылезают наружу.
		// Не могу представить случай когда это пригодилось бы.
		ArrayList<CellRangeAddress> mregions = getMergedRegions(sourceSheet);
		for (int row_num = sourceRegion.start_row; row_num <= sourceRegion.end_row; row_num++){
			for (int col_num = sourceRegion.start_col; col_num <= sourceRegion.end_col; col_num++){
				// Ищем пересечение координат текущей ячейки с началом одного из смежных регионов
				for (CellRangeAddress reg: mregions){
					if ((reg.getFirstRow() == row_num) && (reg.getFirstColumn() == col_num)){
						// Новый регион нужно сместить на разницу между исходным и целевым регионом
						int delta_y = row_offset - sourceRegion.start_row;
						int delta_x = col_offset - sourceRegion.start_col;
						CellRangeAddress new_nreg = new CellRangeAddress(
								reg.getFirstRow() + delta_y,
								reg.getLastRow() + delta_y,
								reg.getFirstColumn() + delta_x,
								reg.getLastColumn() + delta_x);
						destSheet.addMergedRegion(new_nreg);
					}
				}
			}
		}
	}
	
	/*
	 * Обрабатывает все теги подстановки в заданном регионе
	 */
	private void processTagsInRegion(Sheet sheet, SheetRegion region, JSONObject obj, String token_prefix) throws Exception{
		// Перебор строк
		for (int row_num = region.start_row; row_num <= region.end_row; row_num++){
			Row row = sheet.getRow(row_num);
			if (row == null)
				continue;
			// Перебор колонок
			for (int col_num = region.start_col; col_num <= region.end_col; col_num++){
				Cell cell = row.getCell(col_num);
				if (cell == null)
					continue;
				
				processReplaceTag(cell, obj, token_prefix + '.');
				
			}
		}
	}
	
	private void grow_horizontal_regions() throws Exception {
		// Вложенные теги оставляем до лучших времен
		// Пока будем искать на листе все теги сверху вниз и слева на право
		
		int start_scan_row = 0;
		for(;;){
			// Ищем начальный тег горизонтального региона
			Cell start_cell = Scan(in_sheet, start_scan_row, -1, -1, -1, "%", false, 1);
			if (start_cell == null)
				break;
			
			String[] strs = start_cell.getStringCellValue().split(" ");
			String tag_key = strs[0].substring(1);
			
			SheetRegion tag_region = new SheetRegion();
			tag_region.start_row = start_cell.getRowIndex() + 1;
			tag_region.start_col = start_cell.getColumnIndex();
			tag_region.end_col = tag_region.start_col + Integer.parseInt(strs[1]) - 1;
			String tag = start_cell.getStringCellValue();
			
			// Ищем конечный тег горизонтального региона
			Cell end_cell = Scan(in_sheet, tag_region.start_row, -1, tag_region.start_col, tag_region.start_col, "%" + tag, false, 0);
			if (end_cell == null)
				throw new Exception("End of region " + tag + " not found");
			tag_region.end_row = end_cell.getRowIndex() - 1;
			
			// Количество регионов которые нужно раскопировать
			JSONArray arr =	(JSONArray)root.get(tag_key);
			int size = arr.size() - 1;
			
			// Сдвиг ячеек справа от региона и копирование
			int offset = (size) * (tag_region.end_col - tag_region.start_col + 1);
			horizontalShift(in_sheet, tag_region.start_row,	tag_region.end_row, tag_region.end_col + 1, offset);
			for (int i = 0; i < size; i++){
				int col_offset = tag_region.end_col + i * (tag_region.end_col - tag_region.start_col + 1) + 1;
				copyRegion(tag_region, in_sheet, in_sheet, tag_region.start_row, col_offset);
			}
			
			// Обработка тегов внутри скопированных областей И САМОЙ исходной области
			String token_prefix = tag_key;
			for (int i = 0; i < size + 1; i++){
				JSONObject obj = (JSONObject)arr.get(i);
				processTagsInRegion(in_sheet, tag_region, obj, token_prefix);
				tag_region = tag_region.shift(0, tag_region.end_col - tag_region.start_col + 1);
			}
			
			start_scan_row = tag_region.end_row + 2;
		}
	}
	
	private Cell Scan(Sheet sheet, SheetRegion region, String token, boolean in_comments, int mode){
		return Scan(sheet, region.start_row, region.end_row, region.start_col, region.end_col, token, in_comments, mode);
	}
	
	private Cell Scan(Sheet sheet, int start_row, int end_row, int start_col, int end_col, 
					  String token, boolean in_comments, int mode){
		// Подготовка интервалов
		int srow = start_row;
		if (start_row < 0)
			srow = sheet.getFirstRowNum();
		int erow = end_row;
		if (end_row < 0)
			erow = sheet.getLastRowNum();
		// Перебор строк
		for (int row_num = srow; row_num <= erow; row_num++){
			Row row = sheet.getRow(row_num);
			if (row == null)
				continue;
			// Интервал для колонок
			int scol = start_col;
			if (scol < 0)
				scol = row.getFirstCellNum();
			int ecol = end_col;
			if (ecol < 0)
				ecol = row.getLastCellNum();
			// Перебор колонок
			for (int col_num = scol; col_num <= ecol; col_num++){
				Cell cell = row.getCell(col_num);
				if (cell == null)
					continue;
				// Откуда берем текст
				String text = "";
				if (in_comments == true){
					// Из коммента
					Comment comm = cell.getCellComment();
					if (comm == null)
						continue;
					text = comm.getString().getString();
				}else{
					// Из самого содержимого
					if (cell.getCellType() == Cell.CELL_TYPE_STRING)
						text = cell.getStringCellValue();
					else
						continue;
				}
				
				// Сравнение зависит от режима
				// 0 - полное регистронезависимое соответствие
				// 1 - с начала строки (как правило поиск начала тега)
				if (mode == 0){
					if (text.toUpperCase().equals(token.toUpperCase()))
						return cell;
				}else if (mode == 1){
					if (text.substring(0, token.length()).equals(token))
						return cell;
				}
			}
		}
		return null;
	}
	
	/**
	 * Обрабатывает на странице теги повторяющихся строк и колонок. Это нужно например для заголовков длинных таблиц.
	 * Теги определяются в комментариях #ПовторятьСтроку и #ПовторятьКолонку и закрываются на ##...
	 * Важно! Таги должны быть заданы в первой строке или первой колонке! Интервал повторения один и непрерывный!
	 * @param sheet Страница для обработки
	 */
	public void setRepeatedArea(int destSheetIndex){
		if (cell_repeat_tag_start != null){
			RepeatedArea area = new RepeatedArea();
			if (cell_repeat_tag_end != null){
				// Есть завершающий тег, то повторять интервал между ними
				area.start_row = cell_repeat_tag_start.getRowIndex();
				area.end_row = cell_repeat_tag_end.getRowIndex();
			}else{
				// Если нет закрывающего тега, то повторять только одну строку
				area.start_row = cell_repeat_tag_start.getRowIndex();
				area.end_row = cell_repeat_tag_start.getRowIndex();
			}
			in_book.setRepeatingRowsAndColumns(destSheetIndex, area.start_col, area.end_col, area.start_row, area.end_row);
		}
	}
	
	/**
	 * Удаляет со страницы все строки с тегами #, ##, %, %% которые
	 * @param sheet Целевая страница
	 */
	private void clean_unused_tags(Sheet sheet){
		// Перебор строк
		for (int row_num = sheet.getLastRowNum(); row_num >= sheet.getFirstRowNum(); row_num--){
			Row row = sheet.getRow(row_num);
			if (row == null)
				continue;
			boolean has_tag = false;
			// Перебор колонок
			for (Cell cell: row){
				if (cell.getCellType() == Cell.CELL_TYPE_STRING){
					String value = cell.getStringCellValue();
					if ((value.length() > 3) && (value.indexOf("%") == 0)){
						has_tag = true;
						break;
					}
				}
			}
			// Удаляем если есть мусор
			if (has_tag){
				//sheet.removeRow(row);
				sheet.shiftRows(row_num + 1, sheet.getLastRowNum(), -1);
			}
		}
	}
	
	/**
	 * Генерация отчета.
	 * @throws Exception
	 */
	public void generate() throws Exception {
		// Предварительная развертка горизонтальных регионов		
		grow_horizontal_regions();
		clean_unused_tags(in_sheet);
		
		merged_regions = getMergedRegions(in_sheet);
		
		Range range = new Range();
		range.start_row = in_sheet.getFirstRowNum();
		range.end_row = in_sheet.getLastRowNum();
		renderRange(root, range, range.start_row);
		
		// Копируем область печати (больше не копируем - должна определяться сама при предв. просмотре в экселе)
//		String area = in_book.getPrintArea(in_book.getSheetIndex(in_sheet));
		
		// Подмена листов. Удаляем шаблонный лист и активируем результат
		String name = in_sheet.getSheetName();
		in_book.removeSheetAt(in_book.getSheetIndex(in_sheet));
		in_book.setSheetName(in_book.getSheetIndex(out_sheet), name);
		
//		if (area != null){
//			int t = area.indexOf('!');
//			area = area.substring(t + 1);
//			in_book.setPrintArea(in_book.getSheetIndex(out_sheet), area);
//		}
		
		setRepeatedArea(in_book.getSheetIndex(out_sheet));
		
		// Новую закладку делаем активной
		in_book.setActiveSheet(in_book.getSheetIndex(out_sheet));
		in_book.setSelectedTab(in_book.getSheetIndex(out_sheet));
		
	    // Пишем результат
		String outfile = (String)root.get("OUTPUT_FILE_PATH");
	    FileOutputStream fileOut = new FileOutputStream(outfile);
	    in_book.write(fileOut);
	    fileOut.close();
	}

}

/*
 * Хер пойми что он делает, я уже забыл! ;)
 */
class Range{
	String name;
	int cell_num;
	int start_row;
	int end_row;
}

/*
 * Класс описывает прямоугольную область на страце
 */
class SheetRegion{
	int start_row;
	int end_row;
	int start_col;
	int end_col;
	
	/**
	 * Возвращает новый регион со вдвинутыми координатами
	 */
	public SheetRegion shift(int delta_row, int delta_col) {
		SheetRegion region = new SheetRegion();
		region.start_row = start_row + delta_row;
		region.end_row = end_row + delta_row;
		region.start_col = start_col + delta_col;
		region.end_col = end_col + delta_col;
		return region;
	}
}

/*
 * Хранит повторяемую область для печати
 */
class RepeatedArea{
	int start_row = -1;
	int end_row = -1;
	int start_col = -1;
	int end_col = -1;
}

//TODO: Копирование рисунков
//TODO: Переписать все к чертям собачим
//TODO: Прославиться на весь мир
//TODO: Написать о себе статью в википедии
//TODO: Генератор превратился в антипаттерн "God Class". Нужно разбить на мелкие специализированные классы.
