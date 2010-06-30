var kb_shift = false;
var kb_capslock = false;
var kb_english = false;

function setupKeyboard(){
    $('#keyboard li').click(function(){
        var $this = $(this),
        $input = $($('#keyboard-input-field').val());
        character = $('span:visible', $this).html();
        
        $input.focus(); // возвращаем фокус на поле ввода
        if ($this.hasClass('return')) return; // оставляем обработку в дочернем контектсе
        if ($this.hasClass('left-shift')) {
            $('.letter').toggleClass('uppercase');
            $('.symbol span').toggle();
            kb_shift = !kb_shift;
            kb_capslock = false;
            return false;
        }
        if ($this.hasClass('capslock')){
            $('.letter').toggleClass('uppercase');
            kb_capslock = true;
            return false;
        }
        if ($this.hasClass('delete')){
            deleteSymbol($input);
            return false;
        }
        if ($this.hasClass('rus-eng')){
            $('.letter span').toggle();
            kb_english = !kb_english;
            if(kb_english){
                $this.html('рус');
            }
            else{
                $this.html('англ');                
            }
            
            return false;
        }
        if ($this.hasClass('space')) character = ' ';
        if ($this.hasClass('uppercase')) character = character.toUpperCase();
        if (kb_shift === true) {
            $('.symbol span').toggle();
            if (kb_capslock == false) $('.letter').toggleClass('uppercase');
            
            kb_shift = false;
        }
        appendCharacter($input, character);
    });
    
    $('#keyboard-nav li').click(function(){
        var $this = $(this),
            $input = $($('#keyboard-input-field').val());
        $input.focus(); // возвращаем фокус на поле ввода
        if($this.hasClass('bt-left')) 
        {
            moveCaretLeft($input);
            return false;
        }
        if($this.hasClass('bt-right')){
            moveCaretRight($input);
            return false;
        }
    });
    
    $('#keyboard-num li').click(function(){
       var $this = $(this),
            $input = $(getKeyboardInputField()),
            character = $this.html();
       if($this.hasClass('number')){
           appendCharacter($input, character);
       }
    });
}

/* utilities */

function resetKeyboard(){
    $('#keyboard-container').height(0);
    $('#keyboard-nav-container').height(0);
    $('#keyboard-num-container').height(0);
    $('#keyboard-container').css('bottom', '0px');
    $('#keyboard-nav-container').css('bottom', '0px');
    setKeyboardInputField('');
}

function switchEnglish(){
    if(!kb_english){
        $('.letter span').toggle();
        kb_english = true;    
        $('.rus-eng').html('рус');    
    }
}
function switchRussian(){
    if(kb_english){
        $('.letter span').toggle();
        kb_english = false;    
        $('.rus-eng').html('англ');    
    }
}

function setKeyboardInputField(fieldSelector){
    $('#keyboard-input-field').val(fieldSelector);
}
function getKeyboardInputField(){
    return $('#keyboard-input-field').val();
}
function appendCharacter(inputField, character){
    var pos = inputField.caret(),
        value = '',
        new_value = '';
    
    if(character.length == 0){
        return;
    }
    
    if(inputField.tagName() == 'INPUT'){
        value = inputField.val();
    }
    new_value = value.substr(0, pos) + character + value.substr(pos);
    if(inputField.tagName() == 'INPUT'){
        inputField.val(new_value);
    }
    inputField.caret(pos + 1);
}

function deleteSymbol(inputField){
    if(inputField.tagName() == 'INPUT'){
        var strValue = inputField.val();
        var pos = inputField.caret();
        inputField.val(strValue.substr(0, pos - 1) + strValue.substr(pos));
        inputField.caret(pos-1);
    }
}

function moveCaretLeft(inputField){
    var pos = inputField.caret();
    if(pos > 0){
        inputField.caret(pos - 1);
    }
    return;
}
function moveCaretRight(inputField){
    var pos = inputField.caret(),
        inputValue = inputField.val();
    if(pos < inputValue.length){
        inputField.caret(pos + 1);
    }
    return;
}

$.fn.tagName = function() {
    return this.get(0).tagName;
}

$.fn.caret = function(pos) {
    var target = this[0];
    if (arguments.length == 0) { //get
      if (target.selectionStart) { //DOM
        var pos = target.selectionStart;
        return pos > 0 ? pos : 0;
      }
      else if (target.createTextRange) { //IE
        target.focus();
        var range = document.selection.createRange();
        if (range == null)
            return '0';
        var re = target.createTextRange();
        var rc = re.duplicate();
        re.moveToBookmark(range.getBookmark());
        rc.setEndPoint('EndToStart', re);
        return rc.text.length;
      }
      else return 0;
    } //set
    if (target.setSelectionRange) //DOM
      target.setSelectionRange(pos, pos);
    else if (target.createTextRange) { //IE
      var range = target.createTextRange();
      range.collapse(true);
      range.moveEnd('character', pos);
      range.moveStart('character', pos);
      range.select();
    }
}
