/**
 * Crafted by ZIgi
 */
Ext.namespace('M3Designer.model');

/**
 * @class M3Designer.model.ModelTypeLibrary
 * Класс хранит в себе информацию о возможных типах компонентов, доступных им свойств, отображение в тулбоксе.
 * Предоставляется внешний интерфейс для получения ин-ции о свойствах из других частей программы.
 */
M3Designer.model.ModelTypeLibrary = Ext.apply({}, {
    enumConfig: {
        layout: ['auto', 'fit', 'form', 'hbox', 'vbox', 'border', 'absolute', 'accordion'],
        labelAlign: ['left', 'top'],
        region: ['north', 'south', 'center', 'east', 'west'],
        mode: ['local', 'remote'],
        triggerAction: ['query', 'all'],
        parentDockType: ['tbar', 'bbar', 'fbar', '(none)'],
        //addressField
        level: ['place', 'street', 'house', 'flat'],
        viewMode: ['one','two', 'three'],
        buttonAlign: ['left', 'center', 'right']
    },

    /**
     * Возвращает массив из объектов со свойствами типа и его типов родителей. Внутренний метод предназначеный
     * для поиска свойств в цепочке наследования. Объекты свойств заполнены в порядке от предка к ребенку
     */
    _buildInheritanceChain: function (type) {
        var inheritanceChain = [];
        var t = type;

        do { // кажется цикл do - while в послед раз я писал года три назад O_o
            inheritanceChain.unshift(this.typesConfig[t].properties);
            t = this.typesConfig[t].parent;
        } while (this.typesConfig[t] !== undefined);
        return inheritanceChain;
    },

    /**
     * Возаращает ограничения для переданого типа
     */
    getTypeRestrictions: function (type) {
        return this.typesConfig[type].childTypesRestrictions;
    },

    /**
     * Возвращает объект со свойствами заполнеными дефолтными значениями по типу модели,
     * с учетом наследования типов
     */
    getTypeDefaultProperties: function (type) {
        var chain = this._buildInheritanceChain(type);
        var i, j = 0;

        var cfg = {};
        for (i = 0; i <= chain.length; i++) {
            var currentType = chain[i];
            //пояснение для тех кто не достиг дзена - в js объекты и ассоциативные массивы(словари) одно и тоже
            //И более того, с помощью цикла for можно итерировать по свойствам массива(читай - получить все ключи словаря)
            for (j in currentType) {
                if (currentType.hasOwnProperty(j)) {
                    cfg[j] = currentType[j].defaultValue;
                    if (currentType[j].isNotEditable) {
                        Ext.destroyMembers(cfg, j);
                    }
                }
            }
        }
        return cfg;
    },

    /**
     * Возвращает объект со свойствами доступными для быстрого редактирования, с учетом наследования типов
     * Фактически копипаст с getTypeDefaultProperties, есть возможность объединения
     */
    getQuickEditProperties: function (type) {
        var chain = this._buildInheritanceChain(type);
        var i, j = 0;

        var cfg = {};
        for (i = 0; i <= chain.length; i++) {
            var currentType = chain[i];
            for (j in currentType) {
                if (currentType.hasOwnProperty(j)) {
                    if (currentType[j].isQuickEditable) {
                        cfg[j] = currentType[j].defaultValue;
                    }
                }
            }
        }
        return cfg;
    },

    /**
     * Возвращает конфиг объекта с атрибутами, нужными для его создания и заполнеными дефолтными значениями
     */
    getTypeInitProperties: function (type) {
        var chain = this._buildInheritanceChain(type);
        var i, j = 0;
        var cfg = {};
        for (i = 0; i < chain.length; i++) {
            var currentType = chain[i];
            for (j in currentType) {
                if (currentType.hasOwnProperty(j) && currentType[j].isInitProperty) {
                    cfg[j] = currentType[j].defaultValue;
                }
            }
        }
        return cfg;
    },

    /**
     * Возвращает класс иконки для переданного типа
     */
    getTypeIconCls: function (type) {
        return this.typesConfig[type].treeIconCls;
    },

    /**
     * Просто проверка является ли тип контейнером
     */
    isTypeContainer: function (type) {
        return this.typesConfig[type].isContainer ? true : false;
    },

    /**
     * Является ли данное свойство объектом?
     */
    isPropertyObject: function (type, property) {
        var chain = this._buildInheritanceChain(type);
        var prop, i;

        for (i = chain.length - 1; i >= 0; i--) {
            if (chain[i].hasOwnProperty(property)) {
                prop = chain[i][property];
                break;
            }
        }
        return (prop.hasOwnProperty('propertyType') && prop.propertyType === 'object');
    },

    /**
     * Возвращает списко значений перечисления(типичный пример - layout)
     */
    getEnumValues: function (enumName) {
        return this.enumConfig[enumName];
    },

    /**
     * Тип свойства модели - простое(string, number, boolean - трактуется по типу дефолтного значения),
     * перечисление(enum) или объектное(object) - метод используется при редактировании в свойств компонентов
     * в PropertyGrid'е
     */
    getPropertyType: function (modelTypeName, propertyName) {
        var chain = this._buildInheritanceChain(modelTypeName);
        var prop, i;

        //найдем сначала пропертю в цепочке наследования
        for (i = chain.length - 1; i >= 0; i--) {
            if (chain[i].hasOwnProperty(propertyName)) {
                prop = chain[i][propertyName];
                break;
            }
        }

        if (prop.hasOwnProperty('propertyType')) {
            return prop.propertyType;
        } else {
            return typeof prop.defaultValue;
        }
    },

    /**
     * Метод возвращает массив ExtTreeNode для отображения в тулбоксе
     */
    getToolboxData: function () {
        var result = [];
        var categories = {};
        var type;

        for (type in this.typesConfig) {
            if (this.typesConfig.hasOwnProperty(type) &&
                    this.typesConfig[type].hasOwnProperty('toolboxData')) {

                var currentType = this.typesConfig[type];

                var node = new Ext.tree.TreeNode({
                    text: this.typesConfig[type].toolboxData.text,
                    type: type,
                    iconCls: this.typesConfig[type].treeIconCls,
                    isToolboxNode: true
                });

                if (currentType.toolboxData.hasOwnProperty('category')) {
                    if (categories[currentType.toolboxData.category]) {
                        categories[currentType.toolboxData.category].appendChild(node);
                    } else {
                        var categoryNode = new Ext.tree.TreeNode({
                            text: currentType.toolboxData.category,
                            allowDrag: false
                        });
                        categories[currentType.toolboxData.category] = categoryNode;
                        categoryNode.appendChild(node);
                        result.push(categoryNode);
                    }
                } else {
                    result.push(node);
                }
            }
        }
        return result;
    }
});

// Шорткат
M3Designer.Types = M3Designer.model.ModelTypeLibrary;