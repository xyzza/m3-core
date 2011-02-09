#coding: utf-8
'''
Хелперы для валидации значений
'''

def checksum(number_str, coeffs):
    ''' 
    Проверяет соответстие длин(номера и множетеля), 
    и возвращает сумму после перемнмножения элементов. 
    '''
    if not len(number_str)==len(coeffs):
        return False

    summands = [coef*int(num) for coef, num in zip(coeffs, number_str)]
    return sum(summands)

def check_inn(inn):
    '''
    Проверка ИНН.     
    Для 10-ти значного ИНН алгоритм проверки выглядит следующим образом:
    1. Вычисляется контрольная сумма со следующими весовыми 
    коэффициентами: (2,4,10,3,5,9,4,6,8,0)
    2. Вычисляется контрольное число как остаток от деления контрольной 
    суммы на 11
    3. Если контрольное число больше 9, то контрольное число вычисляется 
    как остаток от деления контрольного числа на 10
    4. Контрольное число проверяется с десятым знаком ИНН. В случае их 
    равенства ИНН считается правильным.
    
    Для 12-ти значного ИНН алгоритм проверки выглядит следующим образом:
    1. Вычисляется контрольная сумма по 11-ти знакам со следующими весовыми 
    коэффициентами: (7,2,4,10,3,5,9,4,6,8,0)
    2. Вычисляется контрольное число(1) как остаток от деления контрольной 
    суммы на 11
    3. Если контрольное число(1) больше 9, то контрольное число(1) 
    вычисляется как остаток от деления контрольного числа(1) на 10
    4. Вычисляется контрольная сумма по 12-ти знакам со следующими 
    весовыми коэффициентами: (3,7,2,4,10,3,5,9,4,6,8,0).
    5. Вычисляется контрольное число(2) как остаток от деления контрольной 
    суммы на 11
    6. Если контрольное число(2) больше 9, то контрольное число(2) 
    вычисляется как остаток от деления контрольного числа(2) на 10
    7. Контрольное число(1) проверяется с одиннадцатым знаком ИНН и 
    контрольное число(2) проверяется с двенадцатым знаком ИНН. В случае их 
    равенства ИНН считается правильным.
    '''
    
    def inn10(inn):
        COEF10 = (2,4,10,3,5,9,4,6,8,0,)
        checksum1 = checksum(inn, COEF10)
        checknumber = checksum1 % 11
        if checknumber > 9:
            checknumber = checknumber % 10
        return inn[9] == str(checknumber)
    
    def inn12(inn):
        COEF12_1 = (7,2,4,10,3,5,9,4,6,8,0,)
        COEF12_2 = (3,7,2,4,10,3,5,9,4,6,8,0,)
        checksum1 = checksum(inn[:-1], COEF12_1)
        checknumber1 = checksum1 % 11
        if checknumber1 > 9:
            checknumber1 = checknumber1 % 10
        
        checksum2 = checksum(inn, COEF12_2)
        checknumber2 = checksum2 % 11
        if checknumber2 > 9:
            checknumber2 = checknumber2 % 10
    
        return (inn[10] == str(checknumber1)) and (inn[11] == str(checknumber2))
    
    assert isinstance(inn, basestring), 'inn must be string'
    if len(inn) == 10:
        return inn10(inn)
    elif len(inn) == 12:
        return inn12(inn)
    else:
        return False    
    
def check_strah(base_strah):
    '''
    1. Вычисляется контрольная сумма по первым 9-ти цифрам со следующими весовыми 
    коэффициентами: (9,8,7,6,5,4,3,2,1).
    2. Вычисляется контрольное число как остаток от деления контрольной суммы на 101
    3. Контрольное число сравнивается с двумя последними цифрами номера страхования 
    свидетельства ПФ. В случае их равенства номер страхования свидетельства ПФ 
    считается правильным.
    '''
    assert isinstance(base_strah, basestring), 'strah must be string'
    COEF = (9,8,7,6,5,4,3,2,1)
    strah_str = ''.join(base_strah.split(' ')[:-1])
    strah = checksum(strah_str, COEF)%101
    return strah == int(base_strah[-2:])

def check_okpo(okpo):
    '''
    Проверка правильности указания ОКПО:
    
    МЕТОДИКА РАСЧЕТА КОНТРОЛЬНОГО ЧИСЛА ДЛЯ КОДА ОКПО (ЕДИНА ДЛЯ ВСЕХ КОДОВ 
    СТАТИСТИКИ)
    
    Контрольное число рассчитывается следующим образом:
    
    1. Разрядам кода в общероссийском классификаторе, начиная со старшего 
    разряда, присваивается набор весов, соответствующий натуральному ряду 
    чисел от 1 до 10. Если разрядность кода больше 10, то набор весов 
    повторяется.
    2. Каждая цифра кода умножается на вес разряда и вычисляется сумма 
    полученных произведений.
    3. Контрольное число для кода представляет собой остаток от деления 
    полученной суммы на модуль «11».
    4. Контрольное число должно иметь один разряд, значение которого 
    находится в пределах от 0 до 9.
    
    Если получается остаток, равный 10, то для обеспечения одноразрядного 
    контрольного числа необходимо провести повторный расчет, применяя вторую 
    последовательность весов, сдвинутую на два разряда влево (3, 4, 5,…). 
    Если в случае повторного расчета остаток от деления вновь сохраняется 
    равным 10, то значение контрольного числа проставляется равным «0».
    
    >>>check_okpo('0081151683')
    True
    >>>check_okpo('01130957')
    True
    >>>check_okpo('02372510')
    True
    '''
    assert isinstance(okpo, basestring), 'okpo must be string'
    okpo_len = len(okpo)
    if okpo_len != 8 and okpo_len !=10:
        return False
    
    COEF1 = range(1, 11)
    COEF1.extend(range(1,10))
    COEF2 = range(3, 11)
    COEF2.extend(range(1,11))
    checksum1 = checksum(okpo[:okpo_len-1], COEF1[:okpo_len-1])
    checknumber1 = checksum1 % 11
    if checknumber1 < 10:
        return okpo[-1] == str(checknumber1)
    else:
        checksum2 = checksum(okpo[:okpo_len-1], COEF2[:okpo_len-1])
        checknumber2 = checksum2 % 11
        if checknumber2 == 10:
            checknumber2 = 0
        return okpo[-1] == str(checknumber2)


def check_ks(ks, bik):
    '''
    Номер корреспондентского счета: длина 20 символов
    БИК банка: длина 9 символов
    
    Проверка правильности указания корреспондентского счёта.
    
    Алгоритм проверки корреспондентского счёта с помощью БИКа банка:
    1. Для проверки контрольной суммы перед корреспондентским счётом 
    добавляются "0" и два знака БИКа банка, начиная с пятого знака.
    2. Вычисляется контрольная сумма со следующими весовыми 
    коэффициентами: (7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1)
    3. Вычисляется контрольное число как остаток от деления контрольной 
    суммы на 10
    4. Контрольное число сравнивается с нулём. В случае их равенства 
    корреспондентский счёт считается правильным.        
    '''
    assert isinstance(ks, basestring), 'ks must be string'
    assert isinstance(bik, basestring), 'bik must be string'
    if len(ks)!=20 or len(bik)!=9:
        return False
    
    COEF = (7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,)
    ks_modif = ''.join(['0', bik[4:6], ks])
    checksum1 = checksum(ks_modif, COEF)
    checknumber = checksum1 % 10
    return checknumber == 0


def check_rs(rs, bik):
    '''
    Номер расчетного счета: длина 20 символов
    БИК банка: длина 9 символов
    
    Проверка правильности указания расчётного счёта.
    
    Алгоритм проверки расчётного счёта с помощью БИКа банка:
    1. Для проверки контрольной суммы перед расчётным счётом добавляются 
    три последние цифры БИКа банка.
    Для учреждений, БИК которых оканчивается на 000 и 001, cначала должен
    идти "0", потом 5 и 6 цифры БИК, потом 20-значный номер счета.
    2. Вычисляется контрольная сумма со следующими весовыми 
    коэффициентами: (7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1)
    3. Вычисляется контрольное число как остаток от деления контрольной 
    суммы на 10
    4. Контрольное число сравнивается с нулём. В случае их равенства 
    расчётного счёт считается правильным.        
    '''
    assert isinstance(rs, basestring), 'ks must be string'
    assert isinstance(bik, basestring), 'bik must be string'
    if len(rs)!=20 or len(bik)!=9:
        return False
    COEF = (7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,)
    if (bik[6:9] == '001')or(bik[6:9] == '000'):
        rs_modif = ''.join(['0', bik[4:6], rs])
    else:
        rs_modif = bik[-3:] + rs
    checksum1 = checksum(rs_modif, COEF)
    checknumber = checksum1 % 10
    return checknumber == 0
       
def check_ogrn(ogrn):
    '''
    1. ОГРН 13-и значный. Предназначен для регистрации юридических лиц в 
    соотстветствющем реестре ЕГРЮЛ (единый государственный реестр юридических лиц). 
    2. ОГРН 15-и значный. Предназначен для регистрации индивидуальных 
    предпринимателей в соответствующем реестре ЕГРИП (единый государственный 
    реестр индивидуальных предпринимателей).
    
    Алгоритм проверки 13-го значного ОГРН. 
    -12-ти значное число, полученное отбрасыванием последнего 13-го знака в 
    проверяемом ОГРН, делим на число 11. 
    -Отбрасываем остаток от получившегося числа на шаге 1 и умножаем на число 11. 
    -Высчитываем разницу между числом полученном на шаге 1 и шаге 2. 
    Если остаток больше 9, то разница = последней цифре остатка.
    -Полученное число на шаге 3 должно совпадать с контрольным числом (13-знак) 
    проверяемого ОГРН. В противном случае проверяемый ОРГН некорректен. 

    Алгоритм проверки 15-го значного ОГРН. 
    -14-ти значное число, полученное отбрасыванием последнего 15-го знака в 
    проверяемом ОГРН, делим на число 13. 
    -Отбрасываем остаток от получившегося числа на шаге 1 и умножаем на число 13. 
    -Высчитываем разницу между числом полученном на шаге 1 и шаге 2. 
    Если остаток больше 9, то разница = последней цифре остатка.
    -Полученное число на шаге 3 должно совпадать с контрольным числом (15-знак) 
    проверяемого ОГРН. В противном случае проверяемый ОРГН некорректен.
    '''
    def ogrn13(ogrn_base):
        ogrn_str = ogrn_base[:-1]
        ogrn = int(ogrn_str)%11
        if ogrn>9:
            ogrn = ogrn-10
        return ogrn == int(ogrn_base[-1])
        
    def ogrn15(ogrn_base):
        ogrn_str = ogrn_base[:-1]
        ogrn = int(ogrn_str)%13
        if ogrn>9:
            ogrn = ogrn-10
        return ogrn == int(ogrn_base[-1])
    
    assert isinstance(ogrn, basestring), 'ogrn must be string'
    if len(ogrn) == 13:
        return ogrn13(ogrn)
    elif len(ogrn) == 15:
        return ogrn15(ogrn)
    else:
        return False

def check_snils(base_snils):
    '''
    СНИЛС: длина 9 символов + 2 символа контрольной суммы 001—001-998 99 ("XXX-XXX-XXX YY")
    
    Алгоритм формирования контрольного числа СНИЛС таков:
    1) Проверка контрольного числа Страхового номера проводится только для 
    номеров больше номера 001—001-998 99 ("XXX-XXX-XXX YY")
    2) Контрольное число СНИЛС рассчитывается следующим образом:
    2.1) Каждая цифра СНИЛС умножается на номер своей позиции 
    (позиции отсчитываются с конца)
    2.2) Полученные произведения суммируются
    2.3) Если сумма меньше 100, то контрольное число равно самой сумме
    2.4) Если сумма равна 100 или 101, то контрольное число равно 00
    2.5) Если сумма больше 101, то сумма делится нацело на 101 и контрольное 
    число определяется остатком от деления аналогично пунктам 2.3 и 2.4
    Есть мнение, что алгоритмически удобнее сумму не делить нацело на 101, 
    а из суммы циклически вычитать 101 до тех пор, пока остаток от вычитания 
    не будет меньше 102. Хотя по сути это и есть «деление нацело».
    '''
    assert isinstance(base_snils, basestring), 'snils must be string'
    list_of_snils_digits = base_snils[:-3].split('-')
    COEF = int(base_snils[-2:])
    snils_str =  ''.join(list_of_snils_digits)
    snils = checksum(snils_str, range(len(snils_str),0, -1))
    if snils < 100:
        check_number = snils
    elif snils == 100 or snils == 101:
        check_number = 0
    elif snils > 101:
        check_number = snils % 101
        if check_number == 100:
            check_number = 0
    return COEF == check_number
