#coding: utf-8
'''
Хелперы для валидации значений
'''

def checksum(number_str, coeffs):
    ''' 
    Проверяет соответстие длин(номера и множетеля), 
    и возвращает сумму после перемнмножения элементов. 
    '''
    assert len(number_str)==len(coeffs), "Length of the arguments doesn't match"

    summands = [coef*int(num) for coef, num in zip(coeffs, number_str)]
    return sum(summands)

def check_inn(inn):
    '''
    Проверка ИНН. Номер ИНН может задаваться как в виде строки, так и в виде 
    числа.
    
    
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

    >>>check_inn('7707083893')
    True
    >>>check_inn(164907541786)
    True
    >>>check_inn('165607117345')
    True
    >>>check_inn('0000000000')
    True
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
    inn_str = inn if isinstance(inn, basestring) else str(inn)
    if len(inn_str) == 10:
        return inn10(inn_str)
    elif len(inn_str) == 12:
        return inn12(inn_str)
    else:
        raise Exception('Length of the inn must be 8 or 10')    
    
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
    okpo_str = okpo if isinstance(okpo, basestring) else str(okpo)
    okpo_len = len(okpo_str)
    if okpo_len != 8 and okpo_len !=10:
        raise Exception('Length of the inn must be 8 or 10')
    
    COEF1 = range(1, 11)
    COEF2 = (3,13)
    checksum1 = checksum(okpo_str[:okpo_len-1], COEF1[:okpo_len-1])
    checknumber1 = checksum1 % 11
    if checknumber1 < 10:
        return okpo_str[-1] == str(checknumber1)
    else:
        checksum2 = checksum(okpo_str[:okpo_len-1], COEF2[:okpo_len-1])
        checknumber2 = checksum2 % 11
        if checknumber2 == 10:
            checknumber2 = 0
        return okpo_str[-1] == str(checknumber2)


def check_ks(ks, bik):
    '''
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
    ks_str = ks if isinstance(ks, basestring) else str(ks)
    bik_str = bik if isinstance(bik, basestring) else str(bik)
    
    assert len(ks_str)==20, 'Length of the ks must be 20'
    assert len(bik_str)==9, 'Length of the bik must be 9'
    
    COEF = (7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,)
    ks_modif = ''.join(['0', bik_str[5:7], ks_str])
    checksum1 = checksum(ks_modif, COEF)
    checknumber = checksum1 % 10
    return checknumber == 0


def check_rs(rs, bik):
    '''
    Проверка правильности указания расчётного счёта.
    
    Алгоритм проверки расчётного счёта с помощью БИКа банка:
    1. Для проверки контрольной суммы перед расчётным счётом добавляются 
    три последние цифры БИКа банка.
    2. Вычисляется контрольная сумма со следующими весовыми 
    коэффициентами: (7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1)
    3. Вычисляется контрольное число как остаток от деления контрольной 
    суммы на 10
    4. Контрольное число сравнивается с нулём. В случае их равенства 
    расчётного счёт считается правильным.        
    '''
    assert isinstance(rs, basestring), 'ks must be string'
    assert isinstance(bik, basestring), 'bik must be string'
    
    rs_str = rs if isinstance(rs, basestring) else str(rs)
    bik_str = bik if isinstance(bik, basestring) else str(bik)
    assert len(rs_str)==20, 'Length of the rs must be 20'
    assert len(bik_str)==9, 'Length of the bik must be 9'
    
    COEF = (7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,)
    rs_modif = bik_str[-3:] + rs_str
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
    -Полученное число на шаге 3 должно совпадать с контрольным числом (13-знак) 
    проверяемого ОГРН. В противном случае проверяемый ОРГН некорректен. 

    Алгоритм проверки 15-го значного ОГРН. 
    -14-ти значное число, полученное отбрасыванием последнего 15-го знака в 
    проверяемом ОГРН, делим на число 13. 
    -Отбрасываем остаток от получившегося числа на шаге 1 и умножаем на число 13. 
    -Высчитываем разницу между числом полученном на шаге 1 и шаге 2. 
    -Полученное число на шаге 3 должно совпадать с контрольным числом (15-знак) 
    проверяемого ОГРН. В противном случае проверяемый ОРГН некорректен.
    '''
    def ogrn13(ogrn_str_base):
        ogrn_str = ogrn_str_base[:-1]
        ogrn = int(ogrn_str)%11
        return ogrn == int(ogrn_str_base[-1])
        
    def ogrn15(ogrn_str_base):
        ogrn_str = ogrn_str_base[:-1]
        ogrn = int(ogrn_str)%13
        return ogrn == int(ogrn_str_base[-1])
    
    assert isinstance(ogrn, basestring), 'ogrn must be string'
    assert len(ogrn)==13 or 15, 'Length of the ogrn must be 13 or 15'
    ogrn_str = ogrn if isinstance(ogrn, basestring) else str(ogrn)
    if len(ogrn_str) == 13:
        return ogrn13(ogrn_str)
    elif len(ogrn_str) == 15:
        return ogrn15(ogrn_str)

def check_snils(base_snils):
    '''
    Алгоритм формирования контрольного числа СНИЛС таков:
    1) Проверка контрольного числа Страхового номера проводится только для 
    номеров больше номера 001—001-998 ("XXX-XXX-XXX YY")
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
    COEF = base_snils[-2:]
    snils =  ''.join(list_of_snils_digits)
    snils_str = snils if isinstance(snils, basestring) else str(snils)
    snils = checksum(snils_str, range(len(snils_str),0, -1))
    if snils < 100:
        check_number = snils
    elif snils == 100 or 101:
        check_number = 00
    elif snils > 101:
        check_number = snils % 101
    else:
        raise Exception('Length of the snils must be 9 digit numbers') 
    return COEF == str(check_number)
