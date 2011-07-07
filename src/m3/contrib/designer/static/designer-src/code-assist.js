Ext.namespace('M3Designer.code');

/**
 * @class M3Designer.code.CodeAssistPlugin
 * Плагин для CodeEditor. По нажатию на ctrl+space отправляет запрос на получения подсказок для кода на сервер
 */

M3Designer.code.CodeAssistPlugin = Ext.extend(Object,{
    codeAssistUrl:'designer/codeassist',

    constructor:function(cfg) {
        Ext.apply(this, cfg);
        M3Designer.code.CodeAssistPlugin.superclass.constructor.call(this);
    },
    init:function(codeEditor) {
        codeEditor.codeAssistUrl = this.codeAssistUrl;
        
        Ext.apply(codeEditor,{
            triggerCodeEditor:codeEditor.triggerCodeEditor.createSequence(function(){
                this.on('editorkeyevent', function(i,e) {
                    if (e.keyCode == 32 && (e.ctrlKey || e.metaKey) && !e.altKey) {
                        e.stop();
                        this.loadProposals();
                      }
               },this);

                this.on('editorfocus', function() {
                    if (this.completionMenu) {
                        this.completionMenu.destroy();
                    }
                });

            }),

            loadProposals:function() {
                var offset = this.codeMirrorEditor.getRange({line:0,ch:0}, this.codeMirrorEditor.getCursor()).length;

                var dataObj = {
                    code:this.codeMirrorEditor.getValue(),
                    offset:offset
                };

                Ext.Ajax.request({
                    url: this.codeAssistUrl,
                    method:'POST',
                    params: {
                        data: Ext.util.JSON.encode(dataObj)
                    },
                    success: this.onSuccessCodeAssistLoad.createDelegate(this),
                    failure: this.onFailureCodeAssistLoad
                });

            },

            onSuccessCodeAssistLoad:function(response) {
                var data = Ext.util.JSON.decode(response.responseText);
                if (data.success) {
                    this.createCompletionMenu(data.props);
                }
                else {
                    Ext.Msg.alert('Ошибка синтаксиса', data.error.message);
                }
            },

            onFailureCodeAssistLoad:function(response, opts) {
                if (window.uiAjaxFailMessage) {
                    window.uiAjaxFailMessage(response, opts);
                } else {
                    Ext.MessageBox.alert('Ошибка', 'Произошла непредвиденная ошибка. Обратитесь к разработчикам');
                }
            },

            createCompletionMenu:function(completions) {

                if (completions === undefined || completions.length === 0) {
                    return;
                }

                var menu = new M3Designer.code.CompletionMenu({
                    proposals:completions,
                    editor:this.codeMirrorEditor
                });

                menu.showCompletions();
                this.completionMenu = menu;
            }
        });
    }
});

/**
 * Окошко для автокомплита
 */
M3Designer.code.CompletionMenu = Ext.extend(Ext.menu.Menu, {

    proposals:undefined,
    
    editor:undefined,

    keyDownDelegate:undefined,

    showSeparator:false,

    maxHeight:300,
    initComponent:function() {

        var items = [], i =0, item, text, icon;
        var clickFn = this.onItemClick.createDelegate(this);

        for (;i<this.proposals.length;i++) {
            item = this.proposals[i];
            text = item.text + ' (' + item.scope;
            if (item.type && item.type != '') {
                text += ',' + item.type + ')';
                icon = 'icon-'+item.type;
                if (item.type === 'instance'){
                    icon = 'icon-'+item.type+'-'+item.scope;
                }
            }
            else {
                text += ')';
            }

            items.push({
                text: text,
                data: item,
                iconCls: icon,
                listeners: {
                    click : clickFn
                }
            });
        }

        this.items = items;
        M3Designer.code.CompletionMenu.superclass.initComponent.call(this);
        this.on('hide', this.onHide, this);
        this.on('destroy', this.onDestroy, this);

        this.keyDownDelegate = this.keyDownHandler.createDelegate(this);

        Ext.EventManager.on(Ext.getBody(),'keydown',this.keyDownHandler, this);
    },

    onMenuClick:function(menu, menuItem) {
       this.insertCode(menuItem.data.text);
       this.destroy();
    },

    /**
     * Переопределенная функция  родительского класса - координата Y
     * пересчитывается самостоятельно, тк в оргинальном вариант разработчиков ExtJS при
     * использовании свойства maxHeight меню всегда показывается с Y = 0 если оно аппендится к боди
     */
    showAt:function(xy, parentMenu) {
        var y = xy[1], parentEl, viewHeight;
        M3Designer.code.CompletionMenu.superclass.showAt.call(this, xy,parentMenu);
        parentEl = Ext.fly(this.el.dom.parentNode);
        viewHeight = parentEl.getViewSize().height;
        if ((y + this.el.getHeight()) > viewHeight) {
            this.el.setXY([ xy[0], viewHeight - this.el.getHeight() - 25 ]);
        }
        else {
            this.el.setXY( [xy[0], y]);    
        }
    },

    onItemClick:function(item) {
        this.insertCode(item.data.text);
        this.destroy();
    },

    onHide:function() {
        //
    },

    onDestroy:function() {
        Ext.EventManager.un(Ext.getBody(),'keydown', this.keyDownHandler);
    },

    showCompletions:function() {
        var pos = this.editor.cursorCoords();
        this.editorCursor = this.editor.getCursor(false);
        this.token = this.editor.getTokenAt(this.editorCursor);
        if (this.token.string[0] === '.') {
            this.dot = true;
        }
        this.showAt([pos.x,pos.yBot]);
    },

    insertCode:function(code) {
        this.editor.replaceRange(code, {
                    line:this.editorCursor.line,
                    ch: this.dot ? this.token.start + 1 : this.token.start
                }, {
                    line : this.editorCursor.line,
                    ch: this.token.end
                }
        );
    },

    keyDownHandler:function(e) {
        if (e.PAGE_DOWN === e.getCharCode()) {
            if (!this.tryActivate( this.items.indexOf(this.activeItem) +5, 1  )) {
                this.tryActivate(0,1);
            }
        }
        else if(e.PAGE_UP === e.getCharCode()) {
            if(!this.tryActivate(this.items.indexOf(this.activeItem)-5, -1)){
                this.tryActivate(this.items.length-1, -1);
            }
        }
        else if (e.ESC === e.getCharCode()) {
            e.stopEvent();
            this.destroy();
            this.editor.focus();
        }

        if (e.isSpecialKey()) {
            e.stopEvent();
            return;
        }
        var c = String.fromCharCode( e.getCharCode()).toLowerCase();
        var code;

        if (this.dot && this.token.string.length >= 1) {
            code = this.token.string.substr(1, this.token.string.length);
        }
        else {
            code = this.token.string;
        }

        e.stopEvent();
        this.insertCode(code + c);
        this.destroy();
    }
    
});
