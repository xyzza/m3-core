/**
 * Crafted by ZIgi
 */

Ext.namespace('M3Designer');

/*
* Объект для перевода модели из/в транспортный json
 */

M3Designer.ModelTransfer = Ext.apply({},{
    doToolbarDeserializeWorkaround:function(property, componentNode){
        //Ладно, кто бы что не говорил тулбары архитектурно некрасивы в 3 эксте кто бы что не говорил, я счетаю
        if (componentNode.attributes.type == 'toolbar') {
            if (property == 'tbar' || property == 'fbar' || property == 'bbar' ) {
                componentNode.attributes.properties.parentDockType = property;
            }
            else {
                componentNode.attributes.properties.parentDockType = '(none)';
            }
        }
    },
    doToolbarSerializeWorkaround:function(node) {
        if (node.type == 'toolbar') {
            Ext.destroyMembers(node, 'parentDockType');
        }
    },
    childPropertyObjects:{
        mapedToPropertiesTypes:['store','tbar','fbar','bbar'],
        isPropertyMapedType:function(property) {
            return this.mapedToPropertiesTypes.indexOf(property) > 0;
        },
        getTypeProperty:function(model) {
            if (this.hasOwnProperty(model.attributes.type)) {
                return this[model.attributes.type](model);
            }
            else {
                return undefined;
            }
        },
        arrayStore:function(model) {
            return 'store';
        },
        jsonStore:function(model) {
            return 'store';    
        },
        toolbar:function(model) {
            if (model.attributes.properties.parentDockType == '(none)') {
                return undefined;
            }
            else {
                return model.attributes.properties.parentDockType;
            }
        }
    },
    serialize:function(model) {
        var result = {};

        var doRecursion = function(model) {
            var node = {};
            Ext.apply(node, model.attributes.properties);
            node.type = model.attributes.type;
            node.id = model.attributes.properties.id;
            this.doToolbarSerializeWorkaround(node);
            if (model.hasChildNodes()) {
                node.items = [];
                for (var i = 0; i < model.childNodes.length; i++){
                    var property = this.childPropertyObjects.getTypeProperty(model.childNodes[i]);
                    if (property == undefined) {
                        node.items.push( doRecursion.call(this, model.childNodes[i]) );
                    }
                    else {
                        node[property] = doRecursion.call(this, model.childNodes[i]);
                    }
                }
            }
            return node;
        };

        result.model = doRecursion.call(this,model.root);

        return result;
    },
    _cleanConfig:function(jsonObj) {
        //Удаляеца items из объекта. Значение id присваиваецо атрибуту serverId,
        //тк внутри js код используются внутренний id'шники
        var config = {
            properties:{
            }
        };
        Ext.apply(config.properties, jsonObj);
        config.type = jsonObj.type;
        Ext.destroyMembers(config, 'items');
        Ext.destroyMembers(config.properties,'type');
        for (var p in jsonObj) {
            if (this.childPropertyObjects.isPropertyMapedType(p)) {
                Ext.destroyMembers(config.properties,p);
            }
        }
        return config;
    },
    deserialize:function(jsonObj) {
        //обходит json дерево и строт цивилизованое дерево с нодами, событьями и проч
        var root = new M3Designer.model.ComponentModel(this._cleanConfig(jsonObj));

        var callBack = function(jsonObj) {
            var newNode = new M3Designer.model.ComponentModel(this._cleanConfig(jsonObj));

            for (var p in jsonObj) {
                if (this.childPropertyObjects.isPropertyMapedType(p)) {
                    var child = callBack.call(this, jsonObj[p]);
                    newNode.appendChild(child);
                    this.doToolbarDeserializeWorkaround(p, child)
                }
            }

            if (jsonObj.items) {
                for (var i = 0; i < jsonObj.items.length; i++) {
                    newNode.appendChild(callBack.call(this, jsonObj.items[i]));
                }
            }
            return newNode;
        };

        if (jsonObj.items) {
            for (var i = 0; i < jsonObj.items.length; i++) {
                root.appendChild(callBack.call(this,jsonObj.items[i]))
            }
        }

        for (var p in jsonObj) {
            if (this.childPropertyObjects.isPropertyMapedType(p)) {
                var child = callBack.call(this, jsonObj[p]);
                root.appendChild(child);
                this.doToolbarDeserializeWorkaround(p, child);
            }
        }

        var result = new M3Designer.model.FormModel(root);
        result.initOrderIndexes();
        return result;
    }
});