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

            onSuccessCodeAssistLoad:function(response, opts) {
                var data = Ext.util.JSON.decode(response.responseText);
                this.createCompletionBox(data.proposal);
            },

            onFailureCodeAssistLoad:function(response, opts) {
                if (window.uiAjaxFailMessage) {
                    window.uiAjaxFailMessage(response, opts);
                } else {
                    Ext.MessageBox.alert('Ошибка', 'Произошла непредвиденная ошибка. Обратитесь к разработчикам');
                }
            },

            createCompletionBox:function(completions) {
                var editor = this.codeMirrorEditor;

                var complete = document.createElement("div");
                complete.className = "completions";
                var sel = complete.appendChild(document.createElement("select"));
                sel.multiple = true;
                for (var i = 0; i < completions.length; ++i) {
                  var opt = sel.appendChild(document.createElement("option"));
                  opt.appendChild(document.createTextNode(completions[i]));
                }
                sel.firstChild.selected = true;
                sel.size = Math.min(10, completions.length);
                var pos = editor.cursorCoords();
                complete.style.left = pos.x + "px";
                complete.style.top = pos.yBot + "px";
                document.body.appendChild(complete);
                // Hack to hide the scrollbar.
                if (completions.length <= 10)
                  complete.style.width = (sel.clientWidth - 1) + "px";

                var done = false;
                function close() {
                  if (done) return;
                  done = true;
                  complete.parentNode.removeChild(complete);
                }
                function pick() {
                  insert(sel.options[sel.selectedIndex].value);
                  close();
                  setTimeout(function(){editor.focus();}, 50);
                }
                var cur = editor.getCursor(false), token = editor.getTokenAt(cur), tprop = token;
                function insert(str) {
                    editor.replaceRange(str, {line: cur.line, ch: token.start}, {line: cur.line, ch: token.end});
                }
                function stopEvent() {
                    if (this.preventDefault) {this.preventDefault(); this.stopPropagation();}
                    else {this.returnValue = false; this.cancelBubble = true;}
                  }
                function addStop(event) {
                    if (!event.stop) event.stop = stopEvent;
                    return event;
                  }
                function connect(node, type, handler) {
                    function wrapHandler(event) {handler(addStop(event || window.event));}
                    if (typeof node.addEventListener == "function")
                      node.addEventListener(type, wrapHandler, false);
                    else
                      node.attachEvent("on" + type, wrapHandler);
                }

                connect(sel, "blur", close);
                connect(sel, "keydown", function(event) {
                  var code = event.keyCode;
                  // Enter and space
                  if (code == 13 || code == 32) {event.stop(); pick();}
                  // Escape
                  else if (code == 27) {event.stop(); close(); editor.focus();}
                  //else if (code != 38 && code != 40) {close(); editor.focus(); setTimeout(startComplete, 50);}
                });
                connect(sel, "dblclick", pick);

                sel.focus();
                // Opera sometimes ignores focusing a freshly created node
                if (window.opera) setTimeout(function(){if (!done) sel.focus();}, 100);
            }
        });

    }
});
