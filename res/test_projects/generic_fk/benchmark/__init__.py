# -*- coding: utf-8 -*-
import sys

# Инициализация записи логов
import logging
logging.basicConfig(filename = 'performance.log', 
                    level = logging.INFO,
                    format = '%(asctime)s - %(message)s')

# Также будем писать в консоль
console = logging.StreamHandler(sys.stdout)
console.setLevel(logging.INFO)
logging.getLogger('').addHandler(console)

# Первое сообщение
logging.info('Инициализация приложения')