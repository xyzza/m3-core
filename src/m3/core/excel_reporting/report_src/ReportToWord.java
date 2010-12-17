/*
 * Word report generator for platform BARS M3
 * Author: prefer
 * Version: 0.1
 */

import java.io.*;

import org.apache.poi.hpsf.CustomProperties;
import org.apache.poi.hpsf.DocumentSummaryInformation;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.usermodel.Range;
import org.apache.poi.hwpf.usermodel.ParagraphProperties;
import org.apache.poi.hwpf.usermodel.Paragraph;
import org.apache.poi.hwpf.usermodel.CharacterRun;
import org.apache.poi.poifs.filesystem.POIFSFileSystem;

public class ReportToWord {
	
	final static String str = "test_task.doc";
	
	 public static void main (String[] args) throws Exception {
	        // POI apparently can't create a document from scratch,
	        // so we need an existing empty dummy document
	        //POIFSFileSystem fs = new POIFSFileSystem(new FileInputStream(str));
	        HWPFDocument doc = new HWPFDocument(new FileInputStream(str));

//	        // centered paragraph with large font size
//	        Range range = doc.getRange();
////	        
//	       // range.replaceText("Сулейманов", "Иванов");
////	        
//	        Paragraph par1 = range.insertAfter(new ParagraphProperties(), 0);
//	        //par1.replaceText("1", "3");
//	        par1.setSpacingAfter(200);
//	        par1.setJustification((byte) 1);
//	        // justification: 0=left, 1=center, 2=right, 3=left and right
////
//	        CharacterRun run1 = par1.insertAfter("one");
//	        run1.setFontSize(2 * 18);
//	        // font size: twice the point size
//
//	        // paragraph with bold typeface
//	        Paragraph par2 = run1.insertAfter(new ParagraphProperties(), 0);
//	        par2.setSpacingAfter(200);
//	        CharacterRun run2 = par2.insertAfter("two two two two two two two two two two two two two");
//	        run2.setBold(true);
//
//	        // paragraph with italic typeface and a line indent in the first line
//	        Paragraph par3 = run2.insertAfter(new ParagraphProperties(), 0);
//	        par3.setFirstLineIndent(200);
//	        par3.setSpacingAfter(200);
//	        CharacterRun run3 = par3.insertAfter("three three three three three three three three three "
//	            + "three three three three three three three three three three three three three three "
//	            + "three three three three three three three three three three three three three three");
//	        run3.setItalic(true);
//
//	        // add a custom document property (needs POI 3.5; POI 3.2 doesn't save custom properties)
//	        DocumentSummaryInformation dsi = doc.getDocumentSummaryInformation();
//	        CustomProperties cp = dsi.getCustomProperties();
//	        if (cp == null)
//	            cp = new CustomProperties();
//	        cp.put("myProperty", "foo bar baz");
//	        dsi.setCustomProperties(cp);

	        doc.write(new FileOutputStream("generate.doc"));
	        System.out.println("Complete!");
	    }
}