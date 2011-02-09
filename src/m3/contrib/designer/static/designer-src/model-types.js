/**
 * Crafted by ZIgi
 */

/*
 * Класс хранит в себе информацию о возможных типах компонентов, доступных им свойст, отображение в тулбоксе
 */

ModelTypeLibrary = Ext.apply(Object, {
    enumConfig: {
        layout:['auto','fit','form','hbox','vbox','border','absolute'],
        labelAlign:['left','top']
    },
    /**
     * Возвращает объект со свойствами заполнеными дефолтными значениями по типу модели
     *
     */
    getTypeDefaultProperties:function(type) {
        //пояснение для тех кто не достиг дзена - в js объекты и ассоциативные массивы(словари) одно и тоже
        //И более того, с помощью цикла for можно итерировать по свойствам массива(читай - получить все ключи словаря)
        var currentType = this.typesConfig[type]['properties'];
        var cfg = {};
        for (var i in currentType) {
            cfg[i] = currentType[i]['defaultValue'];
        }
        return cfg;
    },
    /*
    * Возвращает конфиг объекта с атрибутами, нужными для его создания и заполнеными дефолтными значениями
    */
    getTypeInitProperties:function(type) {
        var currentType = this.typesConfig[type]['properties'];
        var cfg = {};
        for (var i in currentType) {
            if (currentType[i]['isInitProperty']) {
                cfg[i] = currentType[i]['defaultValue'];
            }
        }
        return cfg;
    },
    /**
     * Возвращает класс иконки для переданного типа
     */
    getTypeIconCls:function(type) {
        return this.typesConfig[type]['treeIconCls'];
    },
    /**
     * Просто проверка является ли тип контейнером
     */
    isTypeContainer:function(type) {
        return this.typesConfig[type].isContainer ? true : false;
    },
    /*
    * Является ли данное свойство объектом?
    */
    isPropertyObject:function(type, property) {
        if (this.typesConfig[type]['properties'][property].hasOwnProperty('propertyType') &&
                this.typesConfig[type]['properties'][property]['propertyType'] == 'object') {
            return true;
        }
        else
        {
            return false;
        }
    },
    /*
    * Возвращает списко значений перечисления(типичный пример - layout)
    */
    getEnumValues: function(enumName) {
        return this.enumConfig[enumName];    
    },
    /*
    * Тип свойства модели - простое(string, number, boolean - трактуется по типу дефолтного значения),
    * перечисление(enum) или объектное(object) - метод используется при редактировании в свойств компонентов
    * в PropertyGrid'е
    */
    getPropertyType:function(modelTypeName, propertyName) {
        if (this.typesConfig[modelTypeName]['properties'][propertyName].hasOwnProperty('propertyType')) {
            return this.typesConfig[modelTypeName]['properties'][propertyName]['propertyType']
        }
        else {
            return typeof this.typesConfig[modelTypeName]['properties'][propertyName]['defaultValue'];
        }
    },
    /*
     * Метод возвращает массив ExtTreeNode для отображения в тулбоксе
     */
    getToolboxData:function() {
        var result = [];
        var categories = {};

        for (var type in this.typesConfig){
           if (!this.typesConfig[type].hasOwnProperty('toolboxData')) {
                continue;
           };

           var currentType = this.typesConfig[type];

           var node = new Ext.tree.TreeNode({
               text:this.typesConfig[type]['toolboxData'].text,
               type:type,
               iconCls:this.typesConfig[type]['treeIconCls']
           });

           if (currentType['toolboxData'].hasOwnProperty('category')) {

               if (categories[currentType['toolboxData']['category']]) {
                   categories[currentType['toolboxData']['category']].appendChild(node);
               }
               else {
                   var categoryNode = new Ext.tree.TreeNode({
                       text:currentType['toolboxData']['category'],
                       allowDrag:false
                   });
                   categories[currentType['toolboxData']['category']] = categoryNode; 
                   categoryNode.appendChild(node);
                   result.push(categoryNode);
               }
           }
           else {
               result.push(node);
           }
        }
        return result;
    }
});
