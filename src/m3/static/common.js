/**
 * Содержит общие функции вызываемые из разных частей
 */
Ext.QuickTips.init();

var SOFTWARE_NAME = 'Платформа М3';

/*
 * выполняет обработку failure response при submit пользовательских форм
 * context.action -- объект, передаваемый из failure handle
 * context.title -- заголовок окон с сообщением об ошибке
 * context.message -- текст в случае, если с сервера на пришло иного сообщения об ошибке
 */
function uiFailureResponseOnFormSubmit(context){
    if(context.action.failureType=='server'){
        obj = Ext.util.JSON.decode(context.action.response.responseText);
        Ext.Msg.show({title: context.title,
                      msg: obj.error_msg,
                      buttons: Ext.Msg.OK,
                      icon: Ext.Msg.WARNING});
    }else{
        Ext.Msg.alert(context.title, context.message);
    }
}

// Стандартное окно отображаемое если не удалось получить ответ от сервера по неизвестной причине
function uiAjaxFailMessage(){
	Ext.Msg.alert(SOFTWARE_NAME, 'Извините, сервер временно не доступен.');
}

// Проверяет есть ли в ответе сообщение и выводит его
// Возвращает серверный success
function uiShowErrorMessage(response){
	obj = Ext.util.JSON.decode(response.responseText);
	if (obj.error_msg)
		Ext.Msg.alert(SOFTWARE_NAME, obj.error_msg);
	if (obj.code)
		alert('Пришел код на выполнение ' + obj.code);
	return obj.success;
}
