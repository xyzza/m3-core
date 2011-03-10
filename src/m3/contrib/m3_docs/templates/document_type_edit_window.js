ViewRefresher = Ext.extend(Object, {
    constructor: function(panel, model) {
        this._model = model;
        this._panel = panel;
    },
    refresh: function(){
    
        this._panel.removeAll();        
        
        Ext.each( this._model.items, function(el) { 
            //this._panel.items.add(Ext.id(), this._createField(el));
            this._panel.add(this._createField(el));
        }, this);
        
        this._panel.doLayout();
    },
    _refreshElement:function(el) {
        if (el.cls == 'field') {
            return this._createField(el);
        }
        else if (el.cls == 'section') {
            //this.
        };
    },
    _createField:function(fieldModel) {
        var config = {
            fieldLabel : fieldModel.name
        };
        
        var cls = null;
        switch(fieldModel.type)
        {
            case 'text': 
                cls = Ext.form.TextField;
            break;
            case 'number':
                cls = Ext.form.NumberField;
            break;
        }
        
        return new cls(config);
    },
    _createSection:function(sectionModel) {
        //return new Ext.form.FieldSet()
    }
});

var fake = {
    cls:'document',
    items:[
        {
            cls:'section',
            id:33,
            name:'Тупо секция',
            items:[
                {
                    id:1,
                    cls:'field',
                    type:'text',
                    name:'Это строка'
                },
                {
                    id:2,
                    cls:'field',
                    type:'number',
                    name:'Это число'
                }]
        }
    ]
};

var fake2 = {
    cls:'document',
    items:[
                {
                    id:1,
                    cls:'field',
                    type:'text',
                    name:'Это строка'
                },
                {
                    id:2,
                    cls:'field',
                    type:'number',
                    name:'Это число'
                }]
};


var previewPanel = Ext.getCmp('{{ component.preview_panel.client_id }}');
var refresher = new ViewRefresher(previewPanel, fake2);

function test(){
    previewPanel.removeAll();
    previewPanel.doLayout();
    alert('bla');
}

function addBtnClick() {
    var p = previewPanel;

    var simple = new Ext.form.TextField({
        fieldLabel: 'teh test'
    });

    p.add(simple);
    p.doLayout();
}

function deleteBtnClick() {
    alert("delete");
    refresher.refresh();
}