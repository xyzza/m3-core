#coding:utf-8

import ConfigParser
import re
import os
import subprocess
import hashlib
import sys
import uuid
import shutil
import zipfile
import compileall
import datetime

#===============================================================================
# Классы, для сборки информации об изменениях в версии
class FileList():
    def __init__(self):
        self.files = {}
    def build(self, root):
        def md5sum(fname):
            '''Returns an md5 hash for file fname, or stdin if fname is "-".'''
            def sumfile(fobj):
                '''Returns an md5 hash for an object with read() method.'''
                m = hashlib.md5()
                while True:
                    d = fobj.read(8096)
                    if not d:
                        break
                    m.update(d)
                return m.hexdigest()
            if fname == '-':
                ret = sumfile(sys.stdin)
            else:
                try:
                    f = file(fname, 'rb')
                except:
                    return 'Failed to open file'
                ret = sumfile(f)
                f.close()
            return ret

        # ----------------------------------------------------
        def get_files(path):
            result = []
            names = sorted(os.listdir(path))
            top = path
            for name in names:
                file_path = os.path.normpath(os.path.join(top, name))
                if file_path[-3:] == 'pyc' and os.path.exists(file_path[:-1]):
                    #есть py, pyc на не нужен
                    continue
                if os.path.isdir(file_path):
                    child_files = get_files(os.path.join(top, name))
                    result.extend(child_files)
                elif os.path.isfile(file_path):
                    #if not os.path.splitext(file_path)[1] in IGNORED_FILES_WITH_EXT:
                    #    result.append(file_path)
                    result.append(file_path)
            return result
        # --------------------------------------------------
        file_list = get_files(root)
        for name in file_list:
            self.files[name] = md5sum(name)

#===============================================================================
# Операции над файлами
def copy_file(filepath, src_basepath, dst_basepath):
    def normdir(dirname):
        return os.path.normpath(dirname) + '/'

    basefrom = normdir(src_basepath.strip())
    baseto = normdir(dst_basepath.strip())
    localpath, filename = os.path.split(filepath)

    localpath = localpath[len(basefrom):]
    targetpath = os.path.join(baseto, localpath)
    if not os.path.exists(targetpath):
        os.makedirs(targetpath)
    shutil.copyfile(filepath, os.path.join(targetpath, filename))

#===============================================================================
#  Основная процедура построения
#===============================================================================

def execute(config_temp_dir, config_result_file, config_project_dir):

    print '---------------------------------------'
    print 'dist-bulder'
    print 'current dir:', os.getcwd()
    print 'path to project:', config_project_dir
    #print 'path to m3:', config_m3_dir
    print 'path to temp dir :', config_temp_dir
    print 'output file:', config_result_file
    print '--------------------------'

    try:
        # создаем врвменный каталог
        tempdir = os.path.normpath(os.path.join(config_temp_dir, str(uuid.uuid4())[0:8]))
        os.makedirs(tempdir)

        # открываем zip архив с результатом сборки
        output_dir, output_name = os.path.split(config_result_file)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        zip = zipfile.ZipFile(config_result_file, 'w', zipfile.ZIP_DEFLATED)

        # копируем файлы во временный каталог
        print 'Copy files...'
        #m3_files = FileList()
        #m3_files.build(config_m3_dir)
        #for file in m3_files.keys():
        #    print 'add:', file[len(config_m3_dir)+1:]
        #    copy_file(file, srcdir, tempdir)
        project_files = FileList()
        project_files.build(config_project_dir)
        for file in project_files.files.keys():
            print 'add:', file[len(config_project_dir) + 1:]
            copy_file(file, config_project_dir, tempdir)

        # компиляция
        print 'Compile python files...'
        compileall.compile_dir(tempdir)

        # архивация
        print 'Compressing files to zip archive...'
        distfiles = FileList()
        distfiles.build(tempdir)

        # делаем обработку файла 
        for file in distfiles.files.keys():
            linuxed_filename = file.replace('\\', '/')
            if file[-3:].lower() == '.py':
                if (not '/migrations/' in linuxed_filename
                    and not '/vendor/' in linuxed_filename
                    and not '/management/' in linuxed_filename
                    ):
                    continue
            if file[-4:].lower() == '.pyc':
                if ('/migrations/' in linuxed_filename
                    or '/vendor/' in linuxed_filename
                    or '/management/' in linuxed_filename
                    ):
                    continue
            zip.write(file, file[len(tempdir) + 1:])
        zip.close()

        # удаляем временную папку
        print 'Remove trash...'
        try:
            shutil.rmtree(tempdir, True)
        except:
            print 'cannot remove trash from temp directory'
    except Exception as exc:
        print 'dist-builder aborted with message: '
        print exc.message
    


if __name__ == '__main__':   
    if len(sys.argv) != 4:
        print u'usage: compile_to.py path_to_project_src path_to_temp output_file'
        sys.exit()

    execute(sys.argv[2], sys.argv[1], sys.argv[3])
    #config_m3_dir = sys.argv[2]
