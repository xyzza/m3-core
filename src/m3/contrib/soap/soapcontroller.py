#coding:utf-8
import re
import sys

from ZSI import Fault, ParsedSoap, ParseException, FaultFromZSIException, FaultFromException
from ZSI.writer import SoapWriter
from ZSI.resolvers import MIMEResolver

from django.http import HttpResponse
from django.db.transaction import commit_on_success
from django.utils.encoding import force_unicode

from m3.ui.actions import ActionController, Action, ActionPack
from m3.helpers import logger

from django.conf import settings


class PostNotSpecified(Exception):
    pass

class SoapLogicalException(Exception):
    '''
    логическая ошибка обращения к webservic'у
    логироваться в sentry не будет
    '''
    pass

class SOAPAction(Action):
    '''
    Действие обработки запроса к веб-сервису
    '''
    _zsiService = None

    def __init__(self, zsiServiceClass, url):
        super(Action, self).__init__()
        #self._zsiService = zsiServiceClass('webservices/needs')
        self._zsiService = zsiServiceClass()
        self.url = url

    def getWSDL(self, request):
        '''
        Получение файла с описанием интерфейса взаимодействия (WSDL-файла)
        '''
        wsdl = self._zsiService._wsdl
        #тут надо также учитывать протокол!
        if request.is_secure():
            serviceUrl = u'https://%s%s' % (request.get_host(), self.get_absolute_url())
        else:
            serviceUrl = u'http://%s%s' % (request.get_host(), self.get_absolute_url())
        #print serviceUrl
        soapAddress = '<soap:address location="%s"/>' % serviceUrl
        wsdlre = re.compile('\<soap:address[^\>]*>', re.IGNORECASE)
        wsdl = re.sub(wsdlre, soapAddress, wsdl)
        return wsdl

    def dispatch(self, ps, SendResponse, SendFault, post, action, nsdict={}, **kw):
        '''Send ParsedSoap instance to ServiceContainer, which dispatches to
        appropriate service via post, and method via action.  Response is a
        self-describing pyobj, which is passed to a SoapWriter.
    
        Call SendResponse or SendFault to send the reply back, appropriately.
    
        '''

        try:
            method = self._zsiService.getOperation(ps, action)
        except Exception, e:
            return SendFault(FaultFromException(e, 0, sys.exc_info()[2]), **kw)

        try:
            request, result = method(ps)
        except Exception, e:
            return SendFault(FaultFromException(e, 0, sys.exc_info()[2]), **kw)

        # Verify if Signed
        self._zsiService.verify(ps)

        # If No response just return.
        if result is None:
            return SendResponse('', **kw)

        sw = SoapWriter(nsdict=nsdict)
        try:
            sw.serialize(result)
        except Exception, e:
            return SendFault(FaultFromException(e, 0, sys.exc_info()[2]), **kw)


        # Create Signatures
        self._zsiService.sign(sw)

        try:
            soapdata = str(sw)
            return SendResponse(soapdata, **kw)
        except Exception, e:
            return SendFault(FaultFromException(e, 0, sys.exc_info()[2]), **kw)

    def sendXML(self, text, code=200, **kw):
        '''
        Посылка данных (XML)
        '''
        if settings.DEBUG:
            logger.debug('Response %s' % self.url)
            logger.debug(force_unicode(text))
        return HttpResponse(text, 'text/xml', code)

    def sendFault(self, f, **kw):
        '''
        Посылка ошибки
        '''
        if settings.DEBUG:
            logger.debug('!!!!!----ERROR----!!!!!')
        #попробуем отдать эту ошибку sentry (служба логирования ошибок)
        exc_info = sys.exc_info()
        if exc_info[0] != SoapLogicalException:
            #логируем только не логические ошибки
            try:
                from sentry.client.models import get_client
                get_client().create_from_exception(exc_info)
            except:
                pass
        logger.error(f.AsSOAP())
        return self.sendXML(f.AsSOAP(), 500, **kw)

    @commit_on_success
    def run(self, request, context):
        '''
        Обработка запроса к веб-сервису
        '''
        if settings.DEBUG:
            logger.debug('Request %s' % self.url)
            logger.debug(force_unicode(request.raw_post_data))

        if request.method != 'POST':
            if request.GET.has_key('wsdl') or request.GET.has_key('WSDL'):
                return self.sendXML(self.getWSDL(request))
            return self.sendXML(Fault(Fault.Client, 'Must use POST'))

        #for k,v in request.META.iteritems(): print k, '=', v

        soapAction = request.META['HTTP_SOAPACTION']
        post = request.path
        if not post:
            raise PostNotSpecified, 'HTTP POST not specified in request'
        if soapAction:
            soapAction = soapAction.strip('\'"')
        post = post.strip('\'"')

        environ = request.environ
        ct = environ['CONTENT_TYPE']
        try:
            if ct.startswith('multipart/'):
                cid = MIMEResolver(ct, request.raw_post_data)
                xml = cid.GetSOAPPart()
                ps = ParsedSoap(xml, resolver=cid.Resolve)
            else:
                #print 'POST'
                #print request.raw_post_data
                ps = ParsedSoap(request.raw_post_data)
        except ParseException, e:
            return self.sendFault(FaultFromZSIException(e))

        #kw['request'] = request
        ps.request = request #чтоб передать запрос в обработчик акшена
        return self.dispatch(ps, self.sendXML, self.sendFault, post=post, action=soapAction)


class SOAPController(ActionController):
    '''
    Контроллер управления веб-сервисами
    '''
    def registerService(self, zslServiceClass, url):
        '''
        Регистрация веб-сервиса
        '''
        act = SOAPAction(zslServiceClass, url)
        pack = ActionPack()
        pack.actions.append(act)
        self.packs.append(pack)
