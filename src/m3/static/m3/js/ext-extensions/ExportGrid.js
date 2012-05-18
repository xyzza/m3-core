Ext3.ns('Ext3.ux.grid');

Ext3.ux.grid.Exporter = Ext3.extend(Ext3.util.Observable,{
    title:'',
    sendDatFromStore: true,
    constructor: function(config){
        Ext3.ux.grid.Exporter.superclass.constructor.call(this);
    },
    init: function(grid){
        if (grid instanceof Ext3.grid.GridPanel){
            this.grid = grid;
            this.grid.on('afterrender', this.onRender, this);
        }
        this.dataUrl = this.grid.dataUrl;
    },
    onRender:function(){
        //создадим top bar, если его нет
        if (!this.grid.tbar){
            this.grid.elements += ',tbar';
            tbar = new Ext3.Toolbar();
            this.grid.tbar = tbar;
            this.grid.add(tbar);
            this.grid.doLayout();
    }
        //добавим кнопку
        this.grid.tbar.insert(0, new Ext3.Button({
            text:'Экспорт',
            iconCls:'icon-application-go',
            listeners:{
                scope:this,
                click:this.exportData                
            }
        }));
    },
    exportData:function(){
        columns = []
        Ext3.each(this.grid.colModel.config,function(column,index){
            columns.push({
                data_index:column.dataIndex,
                header:column.header,
                id:column.id,
                is_column:column.isCoumn,
                sortable:column.sortable,
                width:column.width
            })
        });
        data = []

        if (this.sendDatFromStore){
            Ext3.each(this.grid.store.data.items,function(item,index){ data.push(item.data) });
        }
        params = {
            columns: Ext3.encode(columns),
            title: this.title || this.grid.title || this.grid.id,
            data: Ext3.encode(data)
        }
        Ext3.Ajax.request({
            url : '/ui/exportgrid-export',
            success : function(res,opt){                
                location.href=res.responseText;
            },
            failure : function(){
            },
            params : params
        });
    }
});