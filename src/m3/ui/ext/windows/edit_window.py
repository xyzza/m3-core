#coding:utf-8
'''
Created on 02.03.2010

@author: akvarats
'''

from base import BaseExtWindow

class ExtEditWindow(BaseExtWindow):
    def __init__(self, *args, **kwargs):
        super(ExtEditWindow, self).__init__(*args, **kwargs)
        self.__form = None
        self.renderer.template = 'ext-script/ext-editwindowscript.js' 
        self.init_component(*args, **kwargs)
        
    #=======================================================================
    # Свойство класса form
    #=======================================================================
    @property
    def form(self):
        return self.__form
 
    @form.setter
    def form(self, value):
        self.items.append(value)
        self.__form = value
    #=======================================================================
    
    
    # Данный код должен находится в базовом классе, но т.к. не вcе шаблоны 
    # переведены на новый рендеринг, остается пока в каждом 
    def render(self):
        assert getattr(self, '_ext_name'), 'Class %s is not define "_ext_name"' % \
            (self.__class__.__name__,)
        
        self.pre_render()
        
        try:
            self.render_base_config()
            self.render_params()
        except UnicodeDecodeError:
            raise Exception('Some attribute is not unicode')
        except Exception as msg:
            raise Exception(msg) 
        
        base_config = self._get_config_str()
        params = self._get_params_str()
        res =  '%(ext_name)s({%(base_config)s},{%(params)s})' \
                            % {'ext_name': self._ext_name,
                            'base_config': base_config,
                            'params': params }
                            
        return 'new %s' % res if not self._is_function_render else res