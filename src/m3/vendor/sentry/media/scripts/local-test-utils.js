/**
 * Created by kir
 * User: kirs
 * Date: 18.02.11
 * Time: 15:08
 */

/**
 * Получает переменные и url на странице
 * Так же можно получать переменные из respons'а
 */
function parseItems(inputBlock){

    var rootSecelctorBlock = "#requestinfo",
        findByKey = "POST"

    url = $('#summary .meta a').text();

    postBlock = $(rootSecelctorBlock + ' table tr th.key:contains('+findByKey+')').parent()
    var postBlockElements = postBlock.find(' tbody tr')
    postBlockElements.each(function(){
        var key = $(this).children('td').first();
        addNewBlock(inputBlock, key.text(), key.next().text()) //key:value
    })
    return postBlockElements.length ? true : false
}

/**
 * Parse incoming URL, in output will give array of location and url slugs
 * location is like (http://127.0.0.1:8000 or http://ya.ru)
 * slugs in address going after location expl (/news/today) or some thing like that
 * @param url
 */
function parsemyUrl(url){
    //RegExp parsing the URI like(http://ip:port/adress/subslug or http://dnsAdress.ru/adress/subslug)
    var urlParseRe = /(http:\/\/[\w*.]+[:\d+|\w+]+)([\/\w*]+)/,
        uriParstArray = urlParseRe.exec(url);
    return uriParstArray
}
/**
 * Create new blocks of lable + input
 * block append after last input block
 * @param key
 * @param value
 */
function addNewBlock(inputBlock, key, value){
    inputBlock.after('\
            <label id="Label" style="vertical-align:top">'+key+'</label><br />\
            <input id="'+value+'" name="'+value+'" value="'+value+'"type="text" style="width: 100%;" />\
                    ')
}
