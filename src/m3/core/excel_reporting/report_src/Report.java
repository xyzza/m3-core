import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;

import org.apache.poi.hssf.usermodel.HSSFCell;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.ss.util.CellRangeAddress;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

public class Report {
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
			// "s://STAND_ALONE_SOFTWARE//_DEV//workspace//report//media//json.txt" "windows-1251" 
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
	
	private ReportGenerator(JSONObject json) throws InvalidFormatException, IOException{
		String XLS_filename = (String)json.get("TEMPLATE_FILE_PATH");
	    InputStream inp = new FileInputStream(XLS_filename);
	    Workbook book = WorkbookFactory.create(inp);
		
		this.in_book = book;
		this.root = json;
		in_sheet = book.getSheetAt(0);
		out_sheet = createShadowSheet();
		merged_regions = getMergedRegions(in_sheet);
	}
	
	/**
	 * Копирование ячейки 1 к 1
	 * @param oldCell
	 * @param newCell
	 */
	private void copyCell(Cell oldCell, Cell newCell){
        newCell.setCellStyle(oldCell.getCellStyle());
        newCell.setCellComment(oldCell.getCellComment());

        // Копирум значение
        switch (oldCell.getCellType()) {
        	case HSSFCell.CELL_TYPE_STRING:
        		newCell.setCellValue(oldCell.getStringCellValue());
                break;
            case HSSFCell.CELL_TYPE_NUMERIC:
            	newCell.setCellValue(oldCell.getNumericCellValue());
                break;
            case HSSFCell.CELL_TYPE_BLANK:
            	//newCell.setCellValue(HSSFCell.CELL_TYPE_BLANK);
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
		for (Cell current_cell: current_row){
			Row out_row = out_sheet.getRow(write_to_row + inserted_rows);
			if (out_row == null)
				out_row = out_sheet.createRow(write_to_row + inserted_rows);
			out_row.setHeight(current_row.getHeight());
			Cell out_cell = out_row.getCell(current_cell.getColumnIndex(), Row.CREATE_NULL_AS_BLANK);
			copyCell(current_cell, out_cell);
			
			// Подстановка значений в скопированный ячейке
			processReplaceTag(out_cell, obj);
			
		}
	}

	/**
	 * Поиск и обработка тега ЗАМЕНА в ячейке 
	 * @param outCell 
	 * @param obj спозиционированный JSON объект
	 * @throws Exception 
	 */
	private void processReplaceTag(Cell outCell, JSONObject obj) throws Exception {
		// TODO Auto-generated method stub
		if (outCell.getCellType() != Cell.CELL_TYPE_STRING)
			return;
		String cell_text = outCell.getStringCellValue();
		int start_tag = cell_text.indexOf('$');
		if (start_tag > -1){
			int end_tag = cell_text.indexOf('$', start_tag + 1);
			if (end_tag > -1){
				String key = cell_text.substring(start_tag + 1, end_tag);
				String tag = cell_text.substring(start_tag, end_tag + 1);
				Object value = obj.get(key);
				// Значение для переменной не найдено, значит разработчики так и задумали (оптимистично)
				if (value == null)
					value = "";
				cell_text = cell_text.replace(tag, value.toString());
				outCell.setCellValue(cell_text);
			}
		}
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
	 * Генерация отчета.
	 * @throws Exception
	 */
	public void generate() throws Exception {
		Range range = new Range();
		range.start_row = in_sheet.getFirstRowNum();
		range.end_row = in_sheet.getLastRowNum();
		renderRange(root, range, range.start_row);
		
		// Подмена листов. Удаляем шаблонный лист и активируем результат
		String name = in_sheet.getSheetName();
		in_book.removeSheetAt(in_book.getSheetIndex(in_sheet));
		in_book.setSheetName(in_book.getSheetIndex(out_sheet), name);
		in_book.setActiveSheet(in_book.getSheetIndex(out_sheet));
		
	    // Пишем результат
		String outfile = (String)root.get("OUTPUT_FILE_PATH");
	    FileOutputStream fileOut = new FileOutputStream(outfile);
	    in_book.write(fileOut);
	    fileOut.close();
	}
}

class Range{
	String name;
	int cell_num;
	int start_row;
	int end_row;
}

//TODO: Копирование рисунков
//TODO: Написать стресс тест
