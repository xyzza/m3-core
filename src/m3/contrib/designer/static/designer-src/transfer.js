/**
 * Crafted by ZIgi
 */

/*
* Объект для перевода модели из/в транспортный json
 */

ModelTransfer = Ext.apply({},{

    childPropertyObjects:{
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
    }
});