/**
 * Расширенный функционал комбобокса
 */

Ext3.m3.ComboBox =  Ext3.extend(Ext3.form.ComboBox,{
	/**
	 * Возвращает текстовое представление комбобокса
	 */
	getText: function(){
		return this.lastSelectionText;
	}
})