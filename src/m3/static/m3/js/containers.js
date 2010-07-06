/**
 * Функции вместо рендера компонентов-контейнеров
 * @author: prefer
 */
/**
 * Создание расширенного дерева, на базе внешего компонента
 * @param {Object} baseConfig Базовый конфиг для компонента
 * @param {Object} params Дрополнительные параметра для правильной конф-ии
 */
function createAdvancedTreeGrid(baseConfig, params){
	return new Ext.m3.AdvancedTreeGrid(baseConfig, params);
}

/**
 * Создание грида
 * @param {Object} baseConfig
 * @param {Object} params
 */
function createGridPanel(baseConfig, params){
	return new Ext.m3.GridPanel(baseConfig, params);
}

/**
 * Создание объектного грида
 * @param {Object} baseConfig
 * @param {Object} params
 */
function createObjectGrid(baseConfig, params){
	
	
	
	return new Ext.m3.GridPanel(baseConfig, params);
}
