.. _ssl_certificate::

Настройки репозитария
=====================

Для того, чтобы начать работу с новым сервером репозитариев, нужно внести несколько изменений в конфигурацию Mercurial.
Файл конфигурации находится:

В linux: /Home/%username%/.hgrc

В Windows: C:\Users\%username%\Mercurial.ini

Перед тем как вносить изменения, советую сделать резервную копию :)

Открываем файл .hgrc (в Windows он называется Mercurial.ini) и меняем пару секций: ::

    [auth]
    src.bars-open.ru.prefix = src.bars-open.ru
    src.bars-open.ru.username = Ваш логин
    src.bars-open.ru.password = Ваш пароль


логин и пароль остались прежними, далее прописываем новый ключ ::

    [hostfingerprints]
    src.bars-open.ru = bb:1e:59:b8:c2:b8:15:3c:05:80:af:a5:d2:ff:b8:a1:bf:62:c8:5b
