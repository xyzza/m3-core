/**
 * @class Ext3.m3.CodeEditor
 * @extends Ext3.Panel
 * Converts a panel into a code mirror editor with toolbar
 * @constructor
 *
 * @version 0.1
 */

 // Define a set of code type configurations

Ext3.ns('Ext3.m3.CodeEditorConfig');
Ext3.apply(Ext3.m3.CodeEditorConfig, {
    parser: {
        python: { mode: {name: "python", version: 2, singleLineStringErrors: false}},
        css: {mode: "css"},
        html: {mode: "text/html", tabMode: "indent"},
        javascript:{ mode:{ name: "javascript", json: true}},
        sql: {lineNumbers: true, matchBrackets: true, indentUnit: 4, mode: "text/x3-plsql"}
    }
});

//Ext3.ns('Ext3.m3');
Ext3.m3.CodeEditor = Ext3.extend(Ext3.Panel, {
    sourceCode: '/*Default code*/ ',
    readOnly: false,
    theme:'default',
    constructor: function(baseConfig){
        Ext3.m3.CodeEditor.superclass.constructor.call(this, baseConfig);
    },

    initComponent: function() {
        // this property is used to determine if the source content changes
        this.contentChanged = false;

        Ext3.apply(this, {
            items: [{
                xtype: 'textarea',
                readOnly: this.readOnly,
                hidden: true,
                value: this.sourceCode,
                enableKeyEvents: true
            }]
        });

        this.addEvents('editorkeyevent','editorfocus');

        Ext3.m3.CodeEditor.superclass.initComponent.apply(this, arguments);
    },


    onRender: function() {
        Ext3.m3.CodeEditor.superclass.onRender.apply(this, arguments);

        this.oldSourceCode = this.sourceCode;
        // trigger editor on afterlayout
        this.on('afterlayout', this.triggerCodeEditor, this, {
            single: true
        });

    },
    /* Хендлер перехвата клавиатурных действий */
    fireKeyEvent:function(i,e) {
        this.fireEvent('editorkeyevent', i, e);
    },

    fireFocusEvent:function() {
        this.fireEvent('editorfocus');
    },

    contentChange: function() {
        var oCmp = this.getTextArea();
        var sCode = this.codeMirrorEditor.getValue();

        oCmp.setValue(sCode);
        if(this.oldSourceCode == sCode) this.setTitleClass(true);
        else this.setTitleClass();
        this.fireEvent('contentchanged', this);
    },

    /** @private*/
    triggerCodeEditor: function() {
        var oThis = this;
        var oCmp = this.getTextArea();
        var editorConfig = Ext3.applyIf(this.codeMirrorEditor || {}, {
            height: "100%",
            width: "100%",
            theme: this.theme,
            lineNumbers: true,
            indentUnit: 4,
            tabMode: "shift",
            matchBrackets: true,
            textWrapping: false,
            content: oCmp.getValue(),
            readOnly: oCmp.readOnly,
            autoMatchParens: true,
            /* Событие нажатия клавиши */
            onKeyEvent: this.fireKeyEvent.createDelegate(this),
            /* Событие изменения контента */
            onChange: this.contentChange.createDelegate(this),
            /* Событие фокуса эдитора */
            onFocus:this.fireFocusEvent.createDelegate(this)
       });

        var sParserType = oThis.parser || 'python';
        editorConfig = Ext3.applyIf(editorConfig, Ext3.m3.CodeEditorConfig.parser[sParserType]);

        this.codeMirrorEditor = new CodeMirror.fromTextArea(Ext3.getDom(oCmp.id), editorConfig);
    },

    setTitleClass: function(){
        this.contentChanged = arguments[0] !== true;
    },

    getTextArea:function() {
        return this.findByType('textarea')[0];
    }
});

Ext3.reg('uxCodeEditor', Ext3.m3.CodeEditor);
