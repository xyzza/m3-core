/**
 * @class Ext.m3.CodeEditor
 * @extends Ext.Panel
 * Converts a panel into a code mirror editor with toolbar
 * @constructor
 *
 * @version 0.1
 */

 // Define a set of code type configurations

Ext.ns('Ext.m3.CodeEditorConfig');

Ext.apply(Ext.m3.CodeEditorConfig, {
    cssPath: "m3static/vendor/codemirror/css/",
    jsPath: "m3static/vendor/codemirror/js/"
});

Ext.apply(Ext.m3.CodeEditorConfig, {
    parser: {
        python: { // js code
            parserfile: ["parsepython.js"],
            stylesheet: Ext.m3.CodeEditorConfig.cssPath + "pythoncolors.css"
        },
        css: {
            parserfile: ["parsecss.js"],
            stylesheet: Ext.m3.CodeEditorConfig.cssPath + "csscolors.css"
        },
        html: {
            parserfile: ["parsexml.js", "parsecss.js", "tokenizejavascript.js", "parsejavascript.js", "parsehtmlmixed.js"],
            stylesheet: [Ext.m3.CodeEditorConfig.cssPath+"xmlcolors.css",
                        Ext.m3.CodeEditorConfig.cssPath+"javascriptcolors.css",
                        Ext.m3.CodeEditorConfig.cssPath+"csscolors.css"]
        },
        javascript: {
            parserfile: ["tokenizejavascript.js", "parsejavascript.js"],
            stylesheet: Ext.m3.CodeEditorConfig.cssPath + "javascriptcolors.css"
        },
        sql: {
            parserfile: ["parsesql.js"],
            stylesheet: Ext.m3.CodeEditorConfig.cssPath + "sqlcolors.css"
        }
    }
});

//Ext.ns('Ext.m3');
Ext.m3.CodeEditor = Ext.extend(Ext.Panel, {
    sourceCode: '/*Default code*/ ',
    readOnly: false,

    constructor: function(baseConfig){
        Ext.m3.CodeEditor.superclass.constructor.call(this, baseConfig);
    },

    initComponent: function() {
        // this property is used to determine if the source content changes
        this.contentChanged = false;

        Ext.apply(this, {
            items: [{
                xtype: 'textarea',
                readOnly: this.readOnly,
                hidden: true,
                value: this.sourceCode,
                enableKeyEvents: true
            }]
        });

        this.addEvents('editorkeyevent');

        Ext.m3.CodeEditor.superclass.initComponent.apply(this, arguments);
    },


    onRender: function() {
        Ext.m3.CodeEditor.superclass.onRender.apply(this, arguments);

        this.oldSourceCode = this.sourceCode;
        // trigger editor on afterlayout
        this.on('afterlayout', this.triggerCodeEditor, this, {
            single: true
        });

    },

    fireKeyEvent:function(i,e) {
        this.fireEvent('editorkeyevent', i, e);
    },

    /** @private*/
    triggerCodeEditor: function() {
        var oThis = this;
        var oCmp = this.findByType('textarea')[0];
        var editorConfig = Ext.applyIf(this.codeMirrorEditor || {}, {
           height: "100%",
           width: "100%",
           lineNumbers: true,
           textWrapping: false,
           content: oCmp.getValue(),
           indentUnit: 4,
           tabMode: 'shift',
           readOnly: oCmp.readOnly,
           basefiles: ['codemirror_base.js'],
           path: Ext.m3.CodeEditorConfig.jsPath,
           autoMatchParens: true,
           onKeyEvent:this.fireKeyEvent.createDelegate(this),
            

           initCallback: function(editor) {
               editor.win.document.body.lastChild.scrollIntoView();
               try {
                   var iLineNmbr = ((Ext.state.Manager.get("edcmr_" + oThis.itemId + '_lnmbr') !== undefined) ? Ext.state.Manager.get("edcmr_" + oThis.itemId + '_lnmbr') : 1);
//                   console.log(iLineNmbr);
                   editor.jumpToLine(iLineNmbr);
               }catch(e){
//                   console.error(e);
               };
               /*Хендлер на save из iframe.textarea*/
               Ext.fly(editor.win.document.body).on('keydown',function(e,t,o){
                   if (e.ctrlKey && (e.keyCode == 83)) {
                       oThis.fireEvent('save');
                       e.stopEvent();
                   };
               });
           },
            /* Событие изменения контента */
           onChange: function() {
               //FIXME!
               return;
               var sCode = oThis.codeMirrorEditor.getCode();
               oCmp.setValue(sCode);
               if(oThis.oldSourceCode == sCode) oThis.setTitleClass(true);
               else oThis.setTitleClass();
               oThis.fireEvent('contentChaged', oThis);
           }
       }); 

        //var sParserType = oThis.parser || 'python';
        //editorConfig = Ext.applyIf(editorConfig, Ext.m3.CodeEditorConfig.parser[sParserType]);

        this.codeMirrorEditor = new CodeMirror.fromTextArea( Ext.getDom(oCmp.id), editorConfig);
    },

    getCode: function(){
        if (typeof this.codeMirrorEditor != "undefined"){
            return this.codeMirrorEditor.getCode();
        }
        else{
            return '';
        }
    },

    setTitleClass: function(){
        this.contentChanged = arguments[0] !== true;
    },

    getTextArea:function() {
        return this.findByType('textarea')[0];
    }
});

Ext.reg('uxCodeEditor', Ext.m3.CodeEditor);
