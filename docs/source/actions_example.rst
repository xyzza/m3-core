.. _actions_example:

Различные примеры экшенов и паков
=================================

Базовые классы:

    .. autoclass:: m3.ui.actions.ActionPack


    .. autoclass:: m3.ui.actions.Action

Паки для работы с обычными справочниками
=========================================

    .. autoclass:: m3.ui.actions.packs.BaseDictionaryActions

Иллюстрация:

    .. image:: images/actions/examples/BaseDictionaryActionExample.png

Данный пак содержит необходимый функционал для работы со справочником. Для его использования
достаточно реализовать окно добавления/редактирования записей справочника и задать ``URL``.

    .. autoclass:: m3.ui.actions.packs.BaseDictionaryModelActions

Иллюстрация:

    .. image:: images/actions/examples/BaseDictionaryModelActionsExample.png

Данный пак является спецификацией предыдущего. Для использования необходимо дополнительно задать модель.

    .. autoclass:: m3.ui.actions.packs.BaseEnumerateDictionary

Отличие данного класса от ``BaseDictionaryModelActions`` заключается в том, что мы задаём
вместо модели класс-перечисление.

Паки для работы с иерархическими справочниками
==============================================

    .. autoclass:: m3.ui.actions.dicts.tree.BaseTreeDictionaryActions

Данный пак содержит необходимый функционал для работы с иерархическим справочником. Для использования необходимо
задать окна создания и редактирования записей.

    .. autoclass:: m3.ui.actions.dicts.tree.BaseTreeDictionaryModelActions

Иллюстрация:

    .. image:: images/actions/examples/BaseTreeDictionaryModelActionsExample.png

На картинке мы видим окно с двумя гридами. Данные из левого грида берутся из модели, прописанной в атрибуте класса
``tree_model``. Стоит отметить, что модель является иерархической, т.е. содержит внутри себя поле-ссылку на запись
в этой же модели. Указать данное поле можно использую атрибут класса ``tree_parent_field``. Правый грид связан с моделью
прописанной в атрибуте класса ``list_model``. Каждая запись в ``list_model`` содержит поле-ссылку на запись в ``tree_model``.
Данное поле задается атрибутом-класса ``list_parent_field``. Для использования класса достаточно реализовать окна
создания/редактирования для ``tree_model`` и ``list_model``, а также указать сами модели.









