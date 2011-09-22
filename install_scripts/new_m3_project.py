#coding:utf-8
import os
import sys
import subprocess
import shutil
import optparse

#Общие константы
REPO_LOCATION = 'https://readonly:onlyread@repos.med.bars-open.ru/'
APP_VERSION = 'default'

#Общие глобальные переменные
SCRIPT_ROOT = os.path.dirname(__file__)

#Константы старых значений
APP_NAME = 'm3_blank'
DB_NAME = 'bars_m3_blank'
VERBOSE_NAME = 'm3_blank_verbose_name'

#Глобальные переменные новых значений
NEW_APP_NAME = ''
NEW_DB_NAME = ''
NEW_VERBOSE_NAME= u'Барс.Болванка'

# Глобальные значения правил переименования
RENAMED = []

def prepare_options():
    global NEW_APP_NAME
    global NEW_DB_NAME
    global SCRIPT_ROOT
    global RENAMED
    global NEW_VERBOSE_NAME

    usage = u"Использование: %prog [options] [NAME]"
    parser = optparse.OptionParser(usage)
    parser.add_option("-d" , "--directory", dest="directory",
        help=u"Путь до директории, в которой нужно завести проект. "
        u"По умолчанию будет использована папка, в которой "
        u"лежит скрипт.")

    parser.add_option("-b", "--database-name", dest="database_name",
        help=u'Название БД, роли пользователя БД и пароля этой роли '
        u'одновременно. По умолчанию будет использовано '
        u'"bars_"+ название проекта')

    parser.add_option("-v", "--verbose-name", dest="verbose_name",
        help=u"Название проекта, понятное человеку. Будет отображаться в заголовке "
        u"браузера, в сообщениях для пользователя, и т.п.")

    (options, args) = parser.parse_args()
    if len(args) != 1:
        print u"Ошибка: У нового приложения должно быть название"
        parser.print_help()
        sys.exit()

    NEW_APP_NAME = args.pop()

    if options.directory:
        if os.path.exists(options.directory):
            if os.path.exists(os.path.join(options.directory, "m3_blank")):
                sys.exit(u"Ошибка: В папке уже есть копия приложения"
                    u"-болванки m3_blank. Пожалуйста, удалите её, перед тем как продолжить")
            SCRIPT_ROOT = options.directory
            os.chdir(options.directory)
        else:
            sys.exit(u"Ошибка: Нет такой директории")

    if options.database_name:
        NEW_DB_NAME = options.database_name
    else:
        NEW_DB_NAME = "bars_" + NEW_APP_NAME

    if options.verbose_name:
        NEW_VERBOSE_NAME = options.verbose_name

    RENAMED.extend([
        (VERBOSE_NAME, NEW_VERBOSE_NAME),
        (DB_NAME, NEW_DB_NAME),
        (APP_NAME, NEW_APP_NAME),
    ])

def create_project():
    has_error = False

    app_repo_root = os.path.join(SCRIPT_ROOT, APP_NAME)
    if not os.path.exists(app_repo_root):
        print '  ', u'Клонирование репозитария приложения-болванки'
        if not clone_repo(APP_NAME, app_repo_root):
            has_error = True
            print '!!', u'Исходные тексты приложения', APP_NAME, u'из-за возникшей ошибки находятся в неактуальном состоянии'
    else:
        print '  ', u'Пул репозитария приложения', APP_NAME
        if not pull_repo(app_repo_root):
            has_error = True
            print '!!', u'Исходные тексты приложения', APP_NAME, u'из-за возникшей ошибки находятся в неактуальном состоянии'

    print '  ', u'Обновление репозитария приложения', APP_NAME, u'на ветку', APP_VERSION
    if not update_repo(app_repo_root, APP_VERSION):
        has_error = True
        print '!!', u'Исходные тексты приложения', APP_NAME, u'из-за возникшей ошибки находятся в неактуальном состоянии'   

    rename_dir(app_repo_root)     

#Работа с репозиторием hg
def clone_repo(app_name, app_repo_root):

    out, err = run_command(['hg', 'clone', '--insecure', REPO_LOCATION + app_name, app_repo_root])
    if err:
        print '  ', u'Клонирование репозитория', REPO_LOCATION + app_name, u'завершено с ошибкой:', err

    return not err

def pull_repo(app_repo_root):

    out, err = run_command(['hg', 'pull', '-R', app_repo_root])
    if err:
        print '  ', u'Пул репозитория', app_repo_root, u'завершен с ошибкой:', err

    return not err

def update_repo(app_repo_root, app_version):

    out, err = run_command(['hg', 'update', app_version, '-R', app_repo_root])
    if err:
        print '  ', u'Обновление репозитория', app_repo_root, u'не ветку', app_version, u'завершено с ошибкой:', err

    return not err

#Переименование папок
def rename_dir(main_path):
    if os.path.exists(NEW_APP_NAME):
        shutil.rmtree(APP_NAME, ignore_errors=True)
        sys.exit(u"Ошибка: В папке уже есть копия приложения с таким названием. Пожалуйста, удалите её, прежде чем продолжить.")
    os.chdir(os.path.join(os.path.join(APP_NAME, 'src'), APP_NAME))
    os.rename(APP_NAME+'.conf', NEW_APP_NAME+'.conf')
    os.chdir('..')
    os.rename(APP_NAME, NEW_APP_NAME)
    os.chdir('..')
    #Избавляемся от контроля версий
    shutil.rmtree('.hg', ignore_errors=True)
    os.chdir('..')
    os.rename(APP_NAME, NEW_APP_NAME)

#Переименование внутри файлов

class ReplaceContrib(object):

    # Название текущего файла
    CURRENT_FILE = None

    # Допустимые расширения
    FILE_EXTENSIONS = ('.py','.conf','.js','.html')

    @classmethod   
    def run(cls, ffile, dir=None):
        if dir is None:
            abs_path = os.path.abspath(ffile)
            dir = os.path.dirname(abs_path)
        else:
            dir = os.path.abspath(dir)            
            if not os.path.isdir(dir):
                print '%s is not directory!' % dir
                return

        cls.CURRENT_FILE = sys.argv[0]        
        cls.replace_files(dir)

    @classmethod   
    def replace_files(cls, path):
        '''
        Рекурсивно обходит все py-файлы
        '''    

        for ffile in os.listdir(path):

            path_file = unicode( os.path.join(path, ffile) )
            if os.path.isdir(path_file):
                cls.replace_files(path_file)
            elif not cls.CURRENT_FILE.endswith(ffile):
                basename, extension = os.path.splitext(ffile)
                if extension in ReplaceContrib.FILE_EXTENSIONS:
                    cls.replace_file(path_file)                    

    @classmethod                     
    def replace_file(cls, path_file):
        """
        Переименовывает или показывает warning, если сработало условие
        """
        lines = []
        had_changed = False
        with open(path_file, 'r') as f:
            for line in f.xreadlines():

                for old, new in RENAMED:
                    if old in line:
                        line = line.replace(old, new)

                        if not had_changed:
                            had_changed = True                       

                lines.append(line)

        # Сохранение файла
        if had_changed:
            outfile = file(path_file, 'w')
            outfile.writelines(lines)
            outfile.close()

#Вспомогательные системные функции    
def run_command(command):
    '''
    Выполняет команду как subprocess,
    возвращает (stdout, stderr) процесса 
    '''
    popen = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    popen.wait()
    return popen.communicate()

if __name__ == '__main__':
    prepare_options()
    create_project()
    ReplaceContrib.run(__file__)
