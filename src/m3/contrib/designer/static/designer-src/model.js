/**
 * Crafted by ZIgi
 */
Ext.namespace('M3Designer.model');

/**
 * @class M3Designer.model.ComponentModel
 * Внутрення модель представления структуры компонента формы. Для простоты реализации
 * наследуемся от классов Ext.data.Tree и Ext.data.Node, предоставляющих уже реалзованые функции
 * работы с деревом и его вершинами
 */
M3Designer.model.ComponentModel = Ext.extend(Ext.data.Node, {
    /**
     * @constructor
     * @param config Объект конфига.
     */
    constructor: function (config) {
        this.type = config.type || 'undefined';
        M3Designer.model.ComponentModel.superclass.constructor.call(this, config);
    },

    /**
     * Проверка можно ли в вершину добавлять дочерние
     */
    isContainer: function () {
        return M3Designer.Types.isTypeContainer(this.attributes.type);
    },
    /*Проверяет на наличие свойста равному quealTo в дочерних элементах*/
    hasPropertyEqualTo: function (propertyName, quealTo) {
        var res = false;
        for (var i=0; i<this.childNodes.length;i++){
            if (this.childNodes[i].attributes.properties[propertyName] == quealTo)
                res = true;
        };
        return res;
    },
    /**
     * Проверка ограничений на допустимость вложенности
     * @param {string} childType тип совместимость с которым проверяем
     */
    checkRestrictions: function (childType) {
        var i, j, k = 0;
        var restrictions = M3Designer.Types.getTypeRestrictions(this.attributes.type);
        //ограничения не заданы. Считаем что все можно. Те разруливание происходит только по признаку
        //isContainer
        if (!restrictions) {
            return true;
        }

        //проверка на допустимость, если ограничения такого типа не заданы - считаем что все можно
        var allowedCheck = !(restrictions.allowed);
        if (!allowedCheck) {
            for (i = 0; i < restrictions.allowed.length; i++) {
                allowedCheck = childType === restrictions.allowed[i];
                if (allowedCheck) {
                    break;
                }
            }
        }

        //проверка на недопустимость
        var disallowedCheck = !(restrictions.disallowed);
        if (!Ext.isEmpty(restrictions.disallowed)) {
            for (j = 0; j < restrictions.disallowed.length; j++) {
                disallowedCheck = childType !== restrictions.disallowed[j];
                if (!disallowedCheck) {
                    break;
                }
            }
        }

        //проверка на уникальность - в гриде один стор может быть например
        var singleCheck = true;
        if (!Ext.isEmpty(restrictions.single) && (restrictions.single.indexOf(childType) !== -1)) {
            for (k = 0; k < this.childNodes.length; k++) {
                if (this.childNodes[k].attributes.type === childType) {
                    singleCheck = false;
                    break;
                }
            }
        }

        return allowedCheck && disallowedCheck && singleCheck;
    }
});

/**
 * @class M3Designer.model.FormModel Класс модели формы
 */
M3Designer.model.FormModel = Ext.extend(Ext.data.Tree, {
    constructor: function (root) {
        M3Designer.model.FormModel.superclass.constructor.call(this, root);
    },

    /**
     * Поиск модели по id. Это именно поиск с обходом. Может быть в дальнейшем стоит разобраться
     * со словарем nodeHash внутри дерева и его использовать для поиска по id(но это вряд ли, деревья маленькие)
     */
    findModelById: function (id) {
        if (this.root.id === id) {
            return this.root;
        }
        return this.root.findChild('id', id, true);
    },

    /**
     * Поиск модели свойству
     */
    findModelByPropertyValue: function (name, value) {
        if (this.root.attributes.properties[name] === value) {
            return this.root;
        }
        var fn = function (node) {
                if (node.attributes.properties[name] && node.attributes.properties[name] === value) {
                    return true;
                }
            };
        return this.root.findChildBy(fn, this, true);
    },

    /**
     * Поиск кол-ва моделей определенного типа
     */
    countModelsByType: function (type) {
        var counter = 0;
        this.root.cascade(function () {
            if (this.attributes.type === type) {
                counter++;
            }
        });
        return counter;
    },

    /**
     * Сортирует коллекции items дерева в соответствии в orderIndex атрибутами.
     */
    initOrderIndexes: function () {
        //вообще код здесь это наследие m3_docs. Очень странно, но кажется он правильно работает. Может он
        // и не нужен(учитывая что
        //вообще говоря теперь orderIndex'ы на сервере здесь не храняться)
        var sortFn = function (node1, node2) {
                if (node1.attributes.orderIndex > node2.attributes.orderIndex) {
                    return 1;
                } else if (node1.attributes.orderIndex === node2.attributes.orderIndex) {
                    return 0;
                } else if (node1.attributes.orderIndex < node2.attributes.orderIndex) {
                    return -1;
                }
            };

        this.root.cascade(function (node) {
            node.sort(sortFn);
        });

        //Смотрим на события изменения в дереве и обновляем orderIndex.
        //Он нам нужен для хранения на сервере верного
        //порядка расположения компонентов на форме
        this.on('append', function (tree, selfNode, node, index) {
            node.attributes.orderIndex = index;
        });
        this.on('move', function (tree, selfNode, oldParent, newParent, index) {
            selfNode.attributes.orderIndex = index;
        });
        this.on('remove', function (tree, parent, node) {
            var next = node.nextSibling;
            while (next) {
                next.attributes.orderIndex--;
                next = next.nextSibling;
            }
        });
        this.on('insert', function (tree, parent, node, refNode) {
            node.attributes.orderIndex = refNode.attributes.orderIndex;
            var next = node.nextSibling;
            while (next) {
                next.attributes.orderIndex++;
                next = next.nextSibling;
            }
        });
    }
});