#coding:utf-8
__author__ = 'ZIgi'

import json
from m3.contrib.m3_docs.models import DocumentType,DocumentField,DocumentSection,DocumentFieldTypeEnum
from django.db import transaction

class DesignerConfigAdapter:

    def create_doctype(self):
        result = {
            'type':'document',
            'name':'Новый документ',
            'code':'',
            'id':0
        }
        return json.dumps(result)

    def read_doctype(self, document_type_id):

        doc_type = DocumentType.objects.get(pk = document_type_id)
        result = {
            'id':doc_type.id,
            'type':'document',
            'name':doc_type.name,
            'code':doc_type.code,
            'items':[]
        }

        all_fields = list(DocumentField.objects.filter(document_type = doc_type))
        all_section = list(DocumentSection.objects.filter(document_type = doc_type))

        #добавим все поля в корень

        result['items'].extend(
            [ self._get_document_field_data(field) for field in all_fields if field.section is None ]
        )

        return json.dumps(result)

    @transaction.commit_on_success
    def save_doctype(self, json_string, doc_type_group_id):
        data_obj = json.loads(json_string)

        doc_type_model = self._get_document_type_model(data_obj['model'], doc_type_group_id)
        doc_type_model.save()

        def parse_section(section_model, section_data_obj, doc_type_id):
            for i in section_data_obj['items']:
                if i['type'] == 'section':
                    new_section = self._get_document_section_model(i)
                    new_section.parent = section_model
                    new_section.document_type_id = doc_type_id
                    new_section.save()
                    parse_section(new_section,i, doc_type_id)
                else:
                    new_field = self._get_document_field_model(i)
                    new_field.section = section_model
                    new_field.document_type_id = doc_type_id
                    new_field.save()

        for i in data_obj['model']['items']:
            if i['type'] == 'section':
                section_model = self._get_document_section_model(i)
                section_model.document_type_id = doc_type_model.id
                section_model.save()
                parse_section(section_model, i, doc_type_model.id)
            else:
                field_model = self._get_document_field_model(i)
                field_model.document_type_id = doc_type_model.id
                field_model.save()

    ###########################################################
    # Преобразования из json'а в модели
    ###########################################################

    def _get_document_type_model(self, data_object, parent_id):
        doc_type = DocumentType() if data_object['id'] == 0 else DocumentType.objects.get(pk = int(data_object['id']))
        doc_type.name = data_object['name']
        doc_type.code = data_object['code']
        doc_type.parent_id = parent_id
        return doc_type

    def _get_document_field_model(self, data_obj):
        doc_field = DocumentField() if data_obj['id'] == 0 else DocumentField.objects.get(pk = int(data_obj['id']))

        types = {
            'text':DocumentFieldTypeEnum.STRING,
            'number':DocumentFieldTypeEnum.NUMBER,
            'date':DocumentFieldTypeEnum.DATE
        }

        doc_field.type = types[data_obj['type']]
        doc_field.name = data_obj['name']
        doc_field.order_index = data_obj['orderIndex']
        return doc_field

    def _get_document_section_model(self, data_obj):
        doc_section = DocumentSection() if data_obj['id'] == 0 else \
            DocumentSection.objects.get(pk = int(data_obj['id']))
        doc_section.name = data_obj['name']
        doc_section.order_index = data_obj['orderIndex']
        return doc_section

    ###########################################################
    # Преобразования из моделей в json
    ###########################################################

    def _get_document_section_data(self, doc_section):
        result = {
            'id':doc_section.id,
            'name':doc_section.name,
            'type':'section',
            'orderIndex':doc_section.order_index,
            'items':[]
        }

        return result

    def _get_document_field_data(self, doc_field):
        types = {
            DocumentFieldTypeEnum.STRING:'text',
            DocumentFieldTypeEnum.NUMBER:'number',
            DocumentFieldTypeEnum.DATE:'date'
        }

        result = {
            'id':doc_field.id,
            'type':types[doc_field.type],
            'name':doc_field.name,
            'orderIndex':doc_field.order_index
        }

        return result
