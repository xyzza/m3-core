/**
 * Crafted by ZIgi
 */

Ext.namespace('M3Designer.model');

/**
 *  Внутрення модель представления структуры документа. Для простоты реализации
 * наследуемся от классов Ext.data.Tree и Ext.data.Node, предоставляющих уже реалзованые функции
 * работы с деревом и его вершинами.
 */

M3Designer.model.ComponentModel = Ext.extend(Ext.data.Node, {
    constructor: function(config) {
        this.type = config.type || 'undefined';
        M3Designer.model.ComponentModel.superclass.constructor.call(this,config);
    },
    isContainer: function() {
        return M3Designer.Types.isTypeContainer(this.attributes.type);
    },
    checkRestrictions: function(childType) {
        var restrictions = M3Designer.Types.getTypeRestrictions(this.attributes.type);
        //ограничения не заданы. Считаем что все можно. Те разруливание происходит только по признаку
        //isContainer
        if (!restrictions) {
            return true;
        }

        //проверка на допустимость, если ограничения такого типа не заданы - считаем что все можно
        var allowedCheck = !(restrictions.allowed);
        if (!allowedCheck) {
            for (var i = 0;i< restrictions.allowed.length;i++) {
                allowedCheck = childType == restrictions.allowed[i];
                if (allowedCheck) {
                    break;
                }
            }
        }

        //проверка на недопустимость
        var disallowedCheck = !(restrictions.disallowed);
        if (!Ext.isEmpty(restrictions.disallowed)) {
            for (var i = 0;i< restrictions.disallowed.length;i++) {
                disallowedCheck = childType != restrictions.disallowed[i];
                if (!disallowedCheck) {
                    break;
                }
            }
        }

        //проверка на уникальность - в гриде один стор может быть например
        var singleCheck = true;
        if (!Ext.isEmpty(restrictions.single) && (restrictions.single.indexOf(childType) != -1)) {
            for (var i=0; i < this.childNodes.length;i++) {
                if (this.childNodes[i].attributes.type == childType) {
                    singleCheck = false;
                    break;
                }
            }
        }

        return allowedCheck && disallowedCheck && singleCheck;
    }
});

M3Designer.model.FormModel = Ext.extend(Ext.data.Tree, {
    constructor:function(root) {
        M3Designer.model.FormModel.superclass.constructor.call(this, root);
    },
    /**
     * Поиск модели по id. Это именно поиск с обходом. Может быть в дальнейшем стоит разобраться
     * со словарем nodeHash внутри дерева и его использовать для поиска по id(но это вряд ли, деревья маленькие)
     */
    findModelById:function(id) {
        if (this.root.id == id ){
            return this.root;
        }
        return this.root.findChild('id',id, true);
    },
    /*
    * Поиск кол-ва моделей определенного типа
    */
    countModelsByType:function(type) {
        var counter = 0;

        this.root.cascade( function(node) {
            if (this.attributes.type == type) {
                counter++;
            }
        } );

        return counter;
    },
    /**
     * Сортирует коллекции items дерева в соответствии в orderIndex атрибутами
     */
    initOrderIndexes:function() {
        var sortFn = function(node1, node2) {
            if (node1.attributes.orderIndex > node2.attributes.orderIndex ) {
                return 1;
            }
            else if (node1.attributes.orderIndex == node2.attributes.orderIndex) {
                return 0;
            }
            else if (node1.attributes.orderIndex < node2.attributes.orderIndex) {
                return -1;
            }
        };

        this.root.cascade(function(node){
            node.sort( sortFn );
        } );

        //Смотрим на события изменения в дереве и обновляем orderIndex.
        //Он нам нужен для хранения на сервере верного
        //порядка расположения компонентов на форме
        this.on('append', function(tree, self, node, index) {
            node.attributes.orderIndex = index;
        } );
        this.on('move', function(tree, self, oldParent, newParent, index ) {
            self.attributes.orderIndex = index ;
        });
        this.on('remove', function(tree, parent, node) {
            var next  = node.nextSibling;
            while(next) {
                next.attributes.orderIndex--;
                next = next.nextSibling;
            }
        });
        this.on('insert', function(tree, parent, node, refNode) {
            node.attributes.orderIndex = refNode.attributes.orderIndex;
            var next = node.nextSibling;
            while (next) {
                next.attributes.orderIndex++;
                next = next.nextSibling;
            }
        });
    }
});