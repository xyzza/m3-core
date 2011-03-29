/**
 * Crafted by ZIgi
 */

/**
 *  Внутрення модель представления структуры документа. Для простоты реализации
 * наследуемся от классов Ext.data.Tree и Ext.data.Node, предоставляющих уже реалзованые функции
 * работы с деревом и его вершинами.
 */

ComponentModel = Ext.extend(Ext.data.Node, {
    constructor: function(config) {
        this.type = config.type || 'undefined';
        ComponentModel.superclass.constructor.call(this,config);
    },
    isContainer: function() {
        return ModelTypeLibrary.isTypeContainer(this.attributes.type);
    }
});

DocumentModel = Ext.extend(Ext.data.Tree, {
    deletedItemsBag:[],//здесь храняться удаленные пользователем компоненты
    constructor:function(root) {
        DocumentModel.superclass.constructor.call(this, root);
        this.on('remove', this._onRemove);
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
    },
    /*
    * Обработчик при удалении дочернего компонента
     */
    _onRemove:function(tree, parent, node) {
        //будем сохранять только те компоненты, что существуют на сервере
        //в делетед итемс кладутся только данные, те если положить сам объект ComponentModel
        //то после опреации remove из него будут почищены дочерние свойства
        if (node.attributes.serverId) {
            var doRecursion = function(item) {
                var newNode = {
                    id:item.attributes.id,
                    type:item.attributes.type
                };

                if (item.isContainer()) {
                    newNode.items = [];
                    for (var i=0;i<item.childNodes.length;i++) {
                        newNode.items.push(doRecursion(item.childNodes[i]))
                    }
                }
                return newNode;
            };

            var item = doRecursion(node);
            this.deletedItemsBag.push(item);
        }
    }
});

/**
 * "Статические" методы - по json передаваемому с сервера строит древовидную модель
 * @param jsonObj - сериализованая модель
 */
DocumentModel._cleanConfig = function(jsonObj) {
    //Удаляеца items из объекта. Значение id присваиваецо атрибуту serverId,
    //тк внутри js код используются внутренний id'шники
    var config = Ext.apply({}, jsonObj);
    Ext.destroyMembers(config, 'items');
    if (jsonObj.hasOwnProperty('id')) {
        config.serverId = jsonObj.id;
    }
    return config;
};

DocumentModel.initFromJson = function(jsonObj) {
    //обходит json дерево и строт цивилизованое дерево с нодами, событьями и проч
    var root = new ComponentModel(DocumentModel._cleanConfig(jsonObj));

    var callBack = function(node, jsonObj) {
        var newNode = new ComponentModel(DocumentModel._cleanConfig(jsonObj));
        node.appendChild(newNode);
        if (!jsonObj.items)
            return;
        for (var i = 0; i < jsonObj.items.length; i++) {
            callBack(newNode, jsonObj.items[i])
        }
    };

    if (jsonObj.items) {
        for (var i = 0; i < jsonObj.items.length; i++) {
            callBack(root, jsonObj.items[i])
        }
    }

    var result = new DocumentModel(root);
    result.initOrderIndexes();
    return result;
};