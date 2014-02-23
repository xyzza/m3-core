#coding: utf-8
import datetime
from decimal import Decimal
import json
import re
import traceback
from django.db import models
from django.utils.datastructures import SortedDict


class ObjectFromJson(object):

    """
        класс надстройка над моделью данных
    """
    strict_data_types = [list, dict]
    sort_fields_name = True #признак сортировки полей

    fields_formatters = {
        models.BooleanField: {
            "formatter": lambda x: lambda u=x: True if u else False if isinstance(x, basestring) else bool,
            "input_types": (basestring, bool, )
        },
        models.NullBooleanField: {
            "formatter": bool, "input_types": (bool, )
        },
        models.CharField: {
            "formatter": unicode, "input_types": None
        },
        models.TextField: {
            "formatter": unicode, "input_types": None
        },
        models.DateField: {
            "formatter": lambda x, format_: datetime.datetime.strptime(x, format_),
            "formats": [
                (ur"(\d{2,4}-\d{2}-\d{2})(.*)", "%Y-%m-%d"),
                (ur"(\d{2}-\d{2}-\d{2,4})(.*)", "%d-%m-%Y"),
                (ur"(\d{2}\/\d{2}\/\d{2,4})(.*)", "%d/%m/%Y"),
                (ur"(\d{2,4}/\d{2}/\d{2})(.*)", "%Y/%m/%d"),
                (ur"(\d{2}\.\d{2}\.\d{2,4})(.*)", "%d.%m.%Y"),
                (ur"(\d{2,4}\.\d{2}\.\d{2})(.*)", "%Y.%m.%d"),
            ],
            "input_types": (datetime.datetime, datetime.date, basestring)
        },
        models.DateTimeField: {
            "formatter": lambda x, format_: datetime.datetime.strptime(x, format_),
            "formats": [
                (ur"(\d{2,4}-\d{2}-\d{2})\s(\d{2}\:\d{2}\:\d{2})*", "%Y-%m-%d %H:%M:%S"),
                (ur"(\d{2}-\d{2}-\d{2,4})\s(\d{2}\:\d{2}\:\d{2})*", "%d-%m-%Y %H:%M:%S"),
                (ur"(\d{2}\/\d{2}\/\d{2,4})\s(\d{2}\:\d{2}\:\d{2})*", "%Y/%m/%d %H:%M:%S"),
                (ur"(\d{2,4}/\d{2}/\d{2})\s(\d{2}\:\d{2}\:\d{2})*", "%Y/%m/%d %H:%M:%S"),
                (ur"(\d{2,4}\.\d{2}\.\d{2})\s(\d{2}\:\d{2}\:\d{2})*", "%Y.%m.%d %H:%M:%S"),
                (ur"(\d{2}\.\d{2}\.\d{2,4})\s(\d{2}\:\d{2}\:\d{2})*", "%d.%m.%Y %H:%M:%S"),
                (ur"(\d{2,4}-\d{2}-\d{2})(.*)", "%Y-%m-%d"),
                (ur"(\d{2}-\d{2}-\d{2,4})(.*)", "%d-%m-%Y"),
                (ur"(\d{2}\/\d{2}\/\d{2,4})(.*)", "%d/%m/%Y"),
                (ur"(\d{2,4}/\d{2}/\d{2})(.*)", "%Y/%m/%d"),
                (ur"(\d{2}\.\d{2}\.\d{2,4})(.*)", "%d.%m.%Y"),
                (ur"(\d{2,4}\.\d{2}\.\d{2})(.*)", "%Y.%m.%d"),
            ],
            "input_types": (datetime.datetime, datetime.date, basestring)
        },
        models.PositiveIntegerField: {
            "formatter": int,
            "input_types": (basestring, int)
        },
        models.PositiveSmallIntegerField: {
            "formatter": int,
            "input_types": (basestring, int)
        },
        models.OneToOneField: {
            "formatter": int,
            "input_types": (basestring, int)
        },
        models.ForeignKey: {
            "formatter": int,
            "input_types": (basestring, int)
        },
        models.ManyToManyField: {
            "formatter": lambda x: map(int, x),
            "input_types": (list,)
        },
        models.FileField: {
            "formatter": lambda x: x,
            "input_types": (str, )
        },
        models.DecimalField: {
            "formatter": lambda x: Decimal(x),
            "input_types": (str, basestring)
        }
    }
    exclude_types = [models.AutoField, ]
    evaluation_result = None

    class EvaluationResult(object):
        #результат преобразования данных
        error_fields = {}   #поля с ошибками
        valid_fields = []   #валидные поля
        ignored_data = {}   #поля проигнорированные в преобразовании

        def __init__(self):
            self.error_fields = {}
            self.valid_fields = []
            self.ignored_data = {}

        def __str__(self):
            title = "valid={0}, error={1}, ignored={2}\n".format(len(self.valid_fields),
                                                        len(self.error_fields),
                                                        len(self.ignored_data))
            valids = "\n--VALIDS--\n"+",".join(self.valid_fields)
            errors = "\n--ERRORS--\n"+",".join(self.error_fields)
            ignore = "\n--IGNORE--\n"+",".join(self.ignored_data)

            print_string = "\n".join([title, valids, errors, ignore])

            return print_string

    class EvaluationError(Exception):
        #ошибка преобразования
        def __init__(self, errors):
            print(errors)
            title = u"Detect errors:\n"
            msg = u"\n".join(errors)
            self.message = title + msg
    class WrongDataFormat(Exception):
        #неправильный синтаксис данных
        pass
    class WrongInputDataType(Exception):
        #неправильный входной тип данных
        pass
    class FieldNotRecognize(Exception):
        #поле данных не присутствует в модели
        pass

    def __init__(self, model, data):
        self._isinstance = False
        try:
            issubclass(model, models.Model)
        except TypeError as err:
            self._isinstance = True
            self.instance = model

        self.formatted_data = SortedDict()
        self.model = model if not self._isinstance else model.__class__
        self._evaluated = False
        assert data, "ObjectFromJson Error -> non data is not allowable!"

        if isinstance(data, basestring):
            try:
                self.data = json.loads(data)
            except SyntaxError as err:
                raise self.WrongDataFormat

        if self.is_strict_type(data):
            self.data = data
        else:
            raise self.WrongInputDataType

        self.eval()

    def is_strict_type(self, data):
        check = lambda y: filter(lambda x: isinstance(y, x),
                       self.strict_data_types)

        return check(data)

    def format_(self, formatters):

        eval_result = self.evaluation_result

        for field, formatter in formatters:
            source_value = self.data[field]
            fr = formatter['formatter']
            string_formats = formatter.get('formats', [])
            check_types = formatter['input_types']
            error_ = ""
            searchable_field_name = field[:-3] if field.endswith(u"_id") else field
            field_object = self.model._meta.get_field_by_name(searchable_field_name)[0]
            is_default_value = field_object.default is not None

            if not source_value and not is_default_value:
                error_ = "not null field->value=null"
            else:
                if source_value:
                    if check_types is None or filter(lambda x: isinstance(source_value, x), check_types):
                        try:
                            #для входных строковых форматов нужно использовать разбор по регулярным
                            #выражениям
                            if string_formats and isinstance(source_value, basestring):
                                assert (filter(lambda x: isinstance(x, basestring), string_formats),
                                    u"ObjectFromJson instance accepted only string input format!")

                                des_format = None
                                for k, f in enumerate(string_formats):
                                    pattern, out_format = f
                                    r = re.compile(pattern)
                                    if re.match(r, source_value):
                                        des_format = out_format
                                        break

                                if not des_format:
                                    error_ = "no input format->value=%s" % (source_value, )
                                else:
                                    self.formatted_data[field_object.attname] = fr(source_value, des_format)
                            else:
                                self.formatted_data[field_object.attname] = fr(source_value)
                        except Exception as err:
                            error_ = traceback.print_exc()
                        else:
                            eval_result.valid_fields.append(field)
                    else:
                        error_ = "not acceptable input format"

            if error_:
                eval_result.error_fields.setdefault(field, [])
                eval_result.error_fields[field].append(error_)

    def eval(self):
        """
            преобразовываем данные в модель
        """
        if not self.instance:
            self.instance = self.model()

        eres = self.evaluation_result = self.EvaluationResult()
        formatters = []

        for f in self.model._meta.fields:

            if (f.__class__ not in self.exclude_types
                and f.__class__ not in self.fields_formatters):
                raise self.FieldNotRecognize
            elif f.__class__ in self.exclude_types:
                continue

            formatter = self.fields_formatters[f.__class__]

            in_data = ((f.name in self.data and f.name)
                or (f.attname in self.data and f.attname))
            err = ""

            if in_data and (not f.null or f.null):
                context_fname = in_data
                formatters.append((context_fname, formatter))
            elif not in_data and not f.null:
                #проверим значение в экземпляре модели
                if not getattr(self.instance, f.attname):
                    if f.default is None:
                        err = "not in data"
                    else:
                        err = f.default
            else:
                eres.ignored_data.setdefault(f.name, [])
                eres.ignored_data[f.name].append(f.name)

            if err:
                eres.error_fields.setdefault(f.name, [])
                eres.error_fields[f.name].append(err)

        if self.sort_fields_name:
            formatters = sorted(formatters, key=lambda x: x[0])

        self.format_(formatters)

        if not self.valid:
            raise self.EvaluationError(self.evaluation_result.error_fields)

        self._evaluated = True

        return self.evaluation_result

    def save(self, local=False):
        self.eval()
        self.instance.__dict__.update(self.formatted_data)
        if not local:
            self.instance.save()
        self.evaluation_result.error_fields = {}
        self.evaluation_result.valid_fields = []
        self.evaluation_result.ignored_data = {}
        return None

    @property
    def valid(self):

        if not self.evaluation_result.error_fields:
            return True

        return False
