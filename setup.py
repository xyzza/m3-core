#coding: utf-8
from setuptools import setup, find_packages

requires = []
with open('src/requires.txt', 'r') as f:
    requires.extend(f.readlines())

setup(name='m3-ext4',
      version='1.5.1.1',
      url='https://src.bars-open.ru/py/m3/m3',
      license='Apache License, Version 2.0',
      author='BARS Group',
      author_email='telepenin@bars-open.ru',
      package_dir={'': 'src'},
      packages=find_packages('src'),
      description=u'Платформа М3',
      install_requires=requires,
      include_package_data=True,
      classifiers=[
        'Intended Audience :: Developers',
        'Environment :: Web Environment',
        'Natural Language :: Russian',
        'Natural Language :: English',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
      ],
      )
