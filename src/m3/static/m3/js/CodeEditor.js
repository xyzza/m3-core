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
                value: this.sourceCode
            }]
        });
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
           onChange: function() {
               var sCode = oThis.codeMirrorEditor.getCode();
               oCmp.setValue(sCode);

               if(oThis.oldSourceCode == sCode){
                   oThis.setTitleClass(true);
               }else{
                   oThis.setTitleClass();
               }

           }
       });

        var sParserType = oThis.parser || 'python';
        editorConfig = Ext.applyIf(editorConfig, Ext.m3.CodeEditorConfig.parser[sParserType]);

        this.codeMirrorEditor = new CodeMirror.fromTextArea( Ext.getDom(oCmp.id).id, editorConfig);
    },

    setTitleClass: function(){
        this.contentChanged = arguments[0] !== true;
    }
});

Ext.reg('uxCodeEditor', Ext.m3.CodeEditor);
