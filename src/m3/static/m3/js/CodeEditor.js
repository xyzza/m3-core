/**
 * @class Ext.ux.panel.CodeEditor
 * @extends Ext.Panel
 * Converts a panel into a code mirror editor with toolbar
 * @constructor
 *
 * @version 0.1
 */

 // Define a set of code type configurations

Ext.ns('Ext.ux.panel.CodeEditorConfig');

Ext.apply(Ext.ux.panel.CodeEditorConfig, {
    cssPath: "m3static/vendor/codemirror/css/",
    jsPath: "m3static/vendor/codemirror/js/"
});

Ext.apply(Ext.ux.panel.CodeEditorConfig, {
    parser: {
        python: { // js code
            parserfile: ["parsepython.js"],
            stylesheet: Ext.ux.panel.CodeEditorConfig.cssPath + "pythoncolors.css"
        }
    }
});

Ext.ns('Ext.ux.panel');
Ext.ux.panel.CodeEditor = Ext.extend(Ext.Panel, {
    sourceCode: '/*Default code*/ ',

    constructor: function(baseConfig, params){
        if (params) {
            this.sourceCode = params.sourceCode ? params.sourceCode : '# Paste code here';
            this.readOnly = params.readOnly ? params.readOnly : false;
        }

        Ext.ux.form.FileUploadField.superclass.constructor.call(this, baseConfig, params);
    },

    initComponent: function() {
        // this property is used to determine if the source content changes
        this.contentChanged = false;
        var oThis = this;

        Ext.apply(this, {
            items: [{
                xtype: 'textarea',
                readOnly: this.readOnly,
                hidden: true,
                value: this.sourceCode,
                enableKeyEvents: true
            }]

        });
        Ext.ux.panel.CodeEditor.superclass.initComponent.apply(this, arguments);
    },


    onRender: function() {
        this.oldSourceCode = this.sourceCode;
        Ext.ux.panel.CodeEditor.superclass.onRender.apply(this, arguments);
        // trigger editor on afterlayout
        this.on('afterlayout', this.triggerCodeEditor, this, {
            single: true
        });

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
           path: Ext.ux.panel.CodeEditorConfig.jsPath,
           autoMatchParens: true,
           initCallback: function(editor) {
               editor.win.document.body.lastChild.scrollIntoView();
               try {
                   var iLineNmbr = ((Ext.state.Manager.get("edcmr_" + oThis.itemId + '_lnmbr') !== undefined) ? Ext.state.Manager.get("edcmr_" + oThis.itemId + '_lnmbr') : 1);
//                   console.log(iLineNmbr);
                   editor.jumpToLine(iLineNmbr);
               }catch(e){
//                   console.error(e);
               }
           },
            /* Событие изменения контента */
           onChange: function() {
               var sCode = oThis.codeMirrorEditor.getCode();
               oCmp.setValue(sCode);

               if(oThis.oldSourceCode == sCode){
                   oThis.setTitleClass(true);
               }else{
                   oThis.setTitleClass();
               }
               oThis.fireEvent('contentChaged', oThis);
           }
//           ,onKeyEvent: function(){console.log('keypress')}
       }); 

        var sParserType = oThis.parser || 'python';
        editorConfig = Ext.applyIf(editorConfig, Ext.ux.panel.CodeEditorConfig.parser[sParserType]);

        this.codeMirrorEditor = new CodeMirror.fromTextArea( Ext.getDom(oCmp.id).id, editorConfig);
    },

    setTitleClass: function(){
        this.contentChanged = arguments[0] !== true;
    }
});

Ext.reg('uxCodeEditor', Ext.ux.panel.CodeEditor);
