# Breaking changes

### 2.2.6
* Вместо параметра `DATE_FORMAT` из настроек Django используется 
 `PYTHON_DATE_FORMAT`. Если в проекте определён `DATE_FORMAT`
 отличный от `'%d.%m.%Y'`, то необходимо указать его в `PYTHON_DATE_FORMAT`. 