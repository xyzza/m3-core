; Script generated by the Inno Setup Script Wizard.
; SEE THE DOCUMENTATION FOR DETAILS ON CREATING INNO SETUP SCRIPT FILES!

[Setup]
; NOTE: The value of AppId uniquely identifies this application.
; Do not use the same AppId value in installers for other applications.
; (To generate a new GUID, click Tools | Generate GUID inside the IDE.)
AppId={{7D70E2F7-5C14-45BE-B555-D7C7947637E5}
AppName=m3
AppVerName=0.5
AppPublisher=Bars M3
AppPublisherURL=http://www.bars-open.ru/
AppSupportURL=http://www.bars-open.ru/
AppUpdatesURL=http://www.bars-open.ru/
DefaultDirName={pf}\m3
DefaultGroupName=m3
DisableProgramGroupPage=yes
;InfoBeforeFile=C:\Documents and Settings\�������������\������� ����\src\InfoBeforeInstall.txt
;InfoAfterFile=C:\Documents and Settings\�������������\������� ����\src\InfoAfterInstall.txt
OutputDir=C:\Documents and Settings\�������������\������� ����
OutputBaseFilename=setup
Compression=lzma
SolidCompression=yes

[Languages]
Name: russian; MessagesFile: compiler:Languages\Russian.isl

[Files]
; NOTE: Don't use "Flags: ignoreversion" on any shared system files
Source: src\python-2.6.4.msi; DestDir: {tmp}; Check: not CheckPythonExists(False)
Source: src\postgresql-8.4.2-1-windows.exe; DestDir: {tmp}; Flags: deleteafterinstall; Check: CheckInstallDataManage(ExpandConstant('{cm:Postgre}'));
Source: src\m3project.zip; DestDir: {tmp}; Flags: deleteafterinstall
Source: src\setup.py; DestDir: {tmp}; Flags: deleteafterinstall
;Source: src\psycopg2-2.0.13.win32-py2.6-pg8.4.1-release.exe; DestDir: {tmp}; Flags: deleteafterinstall


[Run]
Filename: msiexec.exe; Parameters: "/i ""{tmp}\python-2.6.4.msi"""; Flags: skipifsilent; Components: install_python; StatusMsg: ��������� Python...
Filename: {tmp}\postgresql-8.4.2-1-windows.exe; Flags: skipifsilent; Parameters: {code:GetPostgreInstalParameters}; Check: CheckInstallDataManage(ExpandConstant('{cm:Postgre}')); StatusMsg: ��������� PostgreSQL...
Filename: {tmp}\psycopg2-2.0.13.win32-py2.6-pg8.4.1-release.exe; StatusMsg: ��������� Psycopg2...
Filename: {code:GetPythonInstallPath}\python; Components: " install_project"; Check: CheckPythonExists(True); Parameters: {code:GetScriptParameters}; StatusMsg: �� ���������� �������� ����! ���� ��������� ����������...
;"{tmp}\setup.py -p ""{app}"" -s ""{tmp}/m3project.zip"" -t 1 -d postgre --host locagHost --port 5432 --user django --password django --superuser postgres --db-name m3 --superpassword 123"

[Components]
Name: install_python; Description: ���������� Python 2.6.4; Languages: ; Types: custom; Flags: fixed; Check: not CheckPythonExists(False)
;Name: install_postrgre; Description: ���������� PostgreSQL 8.4.2; Types: custom; Languages: ; Flags: checkablealone; Check: not CheckPostgreExists
Name: install_project; Description: M3 project; Flags: fixed; Types: custom
Name: i_mysql; Description: ������������ MySQL; Types: custom; Flags: exclusive checkablealone
Name: i_oracle; Description: ������������ Oracle; Flags: exclusive checkablealone; Types: custom
Name: i_postgre; Description: ������������ PostgreSQL; Flags: exclusive checkablealone; Types: custom

[Types]
Name: custom; Description: ������ ���������; Flags: iscustom

[CustomMessages]
; �������������� ����:
Postgre = postgre
Oracle  = oracle
MySql   = mysql
Sqlite  = sqlite

[Code]
const
  // ��� ����������:
	TYPE_INSTALL = 1; // 1 -- full install, 2 -- update version, 3 -- update build
	
  // ��������������� ������:
  PYTHON_VER = '2.6';
	// POSTGRE_VER = '8.4';

	// � ���������� ������ ��������� ���������... ���
	// x -- ������ �������� �� ������ ����
	// y -- ������ �������� �� �������� ����, ������ ����� ���������� �� ��� Y
	// h -- ������ ������
	// w -- ������ ������
	X = 5;
	Y = 5;
	H = 170;
	W = 200;

	LABEL_W  = 20;   // ������ �����
	EDIT_W   = 120;  // ������ Edita
	EDIT_X   = 70;   // ������ ����� Edita

var
  // ��������� �������� �������� ����
	SettingsDbPage: TInputQueryWizardPage;

  // ���������� ��������� �� ��������� �������� ����������� � ��
  gInstallDM : TNewCheckBox;
  gHost,
	gPort,
	gUser,
	gDBName,
	gSuperUser: TNewEdit;
	gPass,
	gSuperPass: TPasswordEdit;
	
	gStaticText: TNewStaticText;

// �������� python
function CheckPythonExists(CheckForScript:boolean): Boolean;
begin
	Result := False;
	
	// � ����������� �� ���� ��������� ���� ��� ��������������� � ������ ����� �������.
	if RegKeyExists(HKEY_CURRENT_USER, 'SOFTWARE\Python\PythonCore\' + PYTHON_VER + '\InstallPath') then begin
		// ����� ��� �������� ����� ������ ����� try � ���� ������� InstallPath
		Result := True; // ���������� �� � silent ������... ����� ���� �������� � �������� psycopg2
	end
	else if RegKeyExists(HKEY_LOCAL_MACHINE, 'SOFTWARE\Python\PythonCore\' + PYTHON_VER + '\InstallPath') then begin
		Result := True; // ���������� � ������� ������
	end;
	if  CheckForScript and not Result then
	   MsgBox('Python ' + PYTHON_VER + ' �� ����������!',mbError,MB_OK);
end;

// �������� ���� � ����� ��� ����� python
function GetPythonInstallPath(AParam: String):string;
var
	lPythonInstallPath: string;
begin
	Result:='';
	if RegQueryStringValue(HKEY_CURRENT_USER,
						'SOFTWARE\Python\PythonCore\' + PYTHON_VER + '\InstallPath',
						'',
						lPythonInstallPath) then begin
		Result:= lPythonInstallPath;
	end
	else if RegQueryStringValue(HKEY_LOCAL_MACHINE,
						'SOFTWARE\Python\PythonCore\' + PYTHON_VER + '\InstallPath',
						'',
						lPythonInstallPath) then begin
		Result:= lPythonInstallPath;
	end
end;

// ���������� ������ � ��������� ����
function GetPostgre():string;
begin
  Result:= ExpandConstant('{cm:Postgre}');
end;

function GetOracle():string;
begin
  Result:= ExpandConstant('{cm:Oracle}');
end;

function GetMySql():string;
begin
  Result:= ExpandConstant('{cm:MySql}');
end;
//------------------------------------

// ���������� ��������� ����
function GetChosenDataManage(): string;
begin
  if IsComponentSelected('i_mysql') then begin
      Result:= GetMySql();
  end
  else if IsComponentSelected('i_oracle') then begin
      Result:= GetOracle();
  end
  else if IsComponentSelected('i_postgre') then begin
      Result:= GetPostgre();
  end
  else
      Result := '';
end;

// ��������� � ���������� ������ ���������� ���������� Postgre
function GetPostgreInstalParameters(AParam: String):string;
begin
  Result:= '--unattendedmodeui minimal --superpassword ' + gSuperPass.Text + ' --serverport ' + gPort.Text + ' --superaccount ' + gSuperUser.Text;
end;

// ��������� � ���������� ������ ���������� ���������� ��� setup.py
function GetScriptParameters(AParam: string): string;
begin
	 Result := ExpandConstant('{tmp}') + '\setup.py -p "' + ExpandConstant('{app}')
		+ '" -s "' + ExpandConstant('{tmp}') +'\m3project.zip" -t ' + IntToStr(TYPE_INSTALL) + ' -d ' + GetPostgre()
    + ' --host ' + gHost.Text + ' --port ' + gPort.Text
    + ' --user ' + gUser.Text+ ' --password ' + gPass.Text
		+ ' --superuser ' + gSuperUser.Text + ' --superpassword ' + gSuperPass.Text + ' --db-name ' + gDBName.Text;
end;

// ������������� �������� �� ��������� ��� ��������� ����
procedure SetDefaultDataManageParameters();
begin
    if IsComponentSelected('i_mysql') then begin
        gInstallDM.Caption:= '���������� My SQL';
        SettingsDbPage.Caption := '������������� My SQL';
        SettingsDbPage.Description := '������������ ����������� � My SQL';
        gPort.Text := '3306';
        gStaticText.Caption := '��� ��������� Mysql' +#13#10 + '�������� ���� ���� � ������' +#13#10 + '�� ���������!';
    end
    else if IsComponentSelected('i_oracle') then begin
        gInstallDM.Caption:= '���������� Oracle';
        SettingsDbPage.Caption := '������������� Oracle';
        SettingsDbPage.Description := '������������ ����������� � Oracle';
        gPort.Text := '1521';
        gStaticText.Caption := '��� ��������� Oracle' + #13#10 + '�������� ���� ���� � ������' +#13#10 + '�� ���������!';
    end
    else if IsComponentSelected('i_postgre') then begin
        gInstallDM.Caption:= '���������� PostgreSQL';
        SettingsDbPage.Caption := '������������� PostgreSQL';
        SettingsDbPage.Description := '������������ ����������� � PostgreSQL';
        gPort.Text := '5432';
        gStaticText.Caption := '��� ��������� Postgre' +#13#10 + '�������� ���� ���� � ������' +#13#10 + '�� ���������!';
    end;
end;

procedure OnClickInstallDM(Sender: TObject);
begin
    if (gInstallDM.Checked) then
        gStaticText.Visible := True
    else
        gStaticText.Visible := False;
end;

procedure InitializeWizard;
var
	lPanel, lPanelAdmin : TPanel;

	gHostLabel,
	lParamLabel,
	gPortLabel,
	gUserLabel,
	gPasslabel,
	gDBNameLabel,
	lParamLabelAdmin,
	gSuperUserLabel,
	gSuperPassLabel: TLabel;
begin
	SettingsDbPage := CreateInputQueryPage(wpSelectComponents,'','','');

	gInstallDM := TNewCheckBox.Create(SettingsDbPage);
	gInstallDM.Caption:= '���������� ';
	gInstallDM.State 	:= cbChecked;
	gInstallDM.Parent := SettingsDbPage.Surface;
	gInstallDM.Width 	:= SettingsDbPage.SurfaceWidth;
	gInstallDM.Align 	:= alTop;
	gInstallDM.OnClick:= @OnClickInstallDM;

	lPanel := TPanel.Create(SettingsDbPage);
	lPanel.Parent 	:= SettingsDbPage.Surface;
	lPanel.Top		  := gInstallDM.Top + gInstallDM.Height + Y;
	lPanel.Height 	:= H;
	lPanel.Width 	  := W;

	// Description:
	lParamLabel := TLabel.Create(lPanel);
	lParamLabel.Caption   := '��������� �����������:';
	lParamLabel.Top 	    := ScaleX(Y);
	lParamLabel.Width 	  := ScaleY(LABEL_W);
	lParamLabel.Left 	    := ScaleY(X);
	lParamLabel.Parent 	  := lPanel;
	//lParamLabel.Font.Size := 8;
	lParamLabel.Font.Style:= [fsBold];

	// host -- ����������� � ��
	gHostLabel := TLabel.Create(lPanel);
	gHostLabel.Caption:= '�����:';
	gHostLabel.Top 		:= lParamLabel.Top + lParamLabel.Height + Y + 5;
	gHostLabel.Width 	:= ScaleY(LABEL_W);
	gHostLabel.Left 	:= ScaleY(X);
	gHostLabel.Parent := lPanel;

	gHost := TNewEdit.Create(lPanel);
	gHost.Text 		:= 'localhost';
	gHost.Top 		:= lParamLabel.Top + lParamLabel.Height + Y;
	gHost.Width 	:= ScaleY(EDIT_W);
	gHost.Left 		:= ScaleX(EDIT_X);
	gHost.Parent 	:= lPanel;

	// ���� -- ����������� � ��
	gPortLabel := TLabel.Create(lPanel);
	gPortLabel.Caption:= '����:';
	gPortLabel.Top 		:= gHostLabel.Top + gHostLabel.Height + Y + 7;
	gPortLabel.Width 	:= ScaleY(LABEL_W);
	gPortLabel.Left 	:= ScaleY(X);
	gPortLabel.Parent := lPanel;

	gPort := TNewEdit.Create(lPanel);
	gPort.Text 		:= '';
	gPort.Top 		:= gHostLabel.Top + gHostLabel.Height + Y + 2;
	gPort.Width 	:= ScaleY(EDIT_W);
	gPort.Left 		:= ScaleX(EDIT_X);
	gPort.Parent 	:= lPanel;

	// ���� -- ����������� � ��
	gUserLabel := TLabel.Create(lPanel);
	gUserLabel.Caption 	:= '�����:';
	gUserLabel.Top 		:= gPortLabel.Top + gPortLabel.Height + Y + 7;
	gUserLabel.Width 	:= ScaleY(LABEL_W);
	gUserLabel.Left 	:= ScaleY(X);
	gUserLabel.Parent := lPanel;

	gUser := TNewEdit.Create(lPanel);
	gUser.Text 		:= 'test';
	gUser.Top 		:= gPort.Top + gPort.Height + Y;
	gUser.Width 	:= ScaleY(EDIT_W);
	gUser.Left 		:= ScaleX(EDIT_X);
	gUser.Parent 	:= lPanel;

	// ������
	gPassLabel := TLabel.Create(lPanel);
	gPassLabel.Caption:= '������:';
	gPassLabel.Top 		:= gUserLabel.Top + gUserLabel.Height + Y + 7;
	gPassLabel.Width 	:= ScaleY(LABEL_W);
	gPassLabel.Left 	:= ScaleY(X);
	gPassLabel.Parent := lPanel;

	gPass := TPasswordEdit.Create(lPanel);
	gPass.Text 		:= 'test';
	gPass.Top 		:= gUser.Top + gUser.Height + Y;
	gPass.Width 	:= ScaleY(EDIT_W);
	gPass.Left 		:= ScaleX(EDIT_X);
	gPass.Parent 	:= lPanel;

	// ��� ���� -- ����������� � ��
	gDBNameLabel := TLabel.Create(lPanel);
	gDBNameLabel.Caption 	:= '��� ����:';
	gDBNameLabel.Top 		  := gPassLabel.Top + gPassLabel.Height + Y + 7;
	gDBNameLabel.Width 		:= ScaleY(LABEL_W);
	gDBNameLabel.Left 		:= ScaleY(X);
	gDBNameLabel.Parent 	:= lPanel;

	gDBName := TNewEdit.Create(lPanel);
	gDBName.Text 		:= 'm3project';
	gDBName.Top 		:= gPass.Top + gPass.Height + Y;
	gDBName.Width 	:= ScaleY(EDIT_W);
	gDBName.Left 		:= ScaleX(EDIT_X);
	gDBName.Parent 	:= lPanel;

	// ������ ��� ���������� ��������������
	lPanelAdmin := TPanel.Create(SettingsDbPage);
	lPanelAdmin.Parent 	:= SettingsDbPage.Surface;
	lPanelAdmin.Top		:= gInstallDM.Top + gInstallDM.Height + Y;
	lPanelAdmin.Left	:= W + Y;
	lPanelAdmin.Height:= H;
	lPanelAdmin.Width := W;

	// �������� ������ ��������������:
	lParamLabelAdmin := TLabel.Create(lPanelAdmin);
	lParamLabelAdmin.Caption := '��������� ��������������:';
	lParamLabelAdmin.Top 	:= ScaleX(Y);
	lParamLabelAdmin.Width 	:= ScaleY(LABEL_W);
	lParamLabelAdmin.Left 	:= ScaleY(X);
	lParamLabelAdmin.Parent := lPanelAdmin;
	lParamLabelAdmin.Font.Size := 8;
	lParamLabelAdmin.Font.Style := [fsBold];

	// ���� -- ����������� � ��
	gSuperUserLabel := TLabel.Create(lPanelAdmin);
	gSuperUserLabel.Caption := '�����:';
	gSuperUserLabel.Top 	  := lParamLabelAdmin.Top + lParamLabelAdmin.Height + Y + 5;
	gSuperUserLabel.Width 	:= ScaleY(LABEL_W);
	gSuperUserLabel.Left 	  := ScaleY(X);
	gSuperUserLabel.Parent 	:= lPanelAdmin;

	gSuperUser := TNewEdit.Create(lPanelAdmin);
	gSuperUser.Text 	:= 'postgres';
	gSuperUser.Top 		:= lParamLabelAdmin.Top + lParamLabelAdmin.Height + Y;
	gSuperUser.Width 	:= ScaleY(EDIT_W);
	gSuperUser.Left 	:= ScaleX(EDIT_X);
	gSuperUser.Parent := lPanelAdmin;

	// ������
	gSuperPassLabel := TLabel.Create(lPanelAdmin);
	gSuperPassLabel.Caption  := '������:';
	gSuperPassLabel.Top 	   := gSuperUserLabel.Top + gSuperUserLabel.Height + Y + 7;
	gSuperPassLabel.Width 	 := ScaleY(LABEL_W);
	gSuperPassLabel.Left 	   := ScaleY(X);
	gSuperPassLabel.Parent 	 := lPanelAdmin;

	gSuperPass := TPasswordEdit.Create(lPanelAdmin);
	gSuperPass.Text 	:= '123';
	gSuperPass.Top 		:= gSuperUser.Top + gSuperUser.Height + Y;
	gSuperPass.Width 	:= ScaleY(EDIT_W);
	gSuperPass.Left 	:= ScaleX(EDIT_X);
	gSuperPass.Parent 	:= lPanelAdmin;
	
	// �����, ��������� ����� ���������� ������������
  gStaticText         := TNewStaticText.Create(lPanelAdmin);
  gStaticText.Top     := gSuperPass.Top + gSuperPass.Height + ScaleY(Y)*3;
  gStaticText.Height  := 100;
  gStaticText.Left    := ScaleY(X)*3
  gStaticText.Width   := ScaleY(LABEL_W) + ScaleY(EDIT_W);
  gStaticText.AutoSize:= True;
  gStaticText.Parent  := lPanelAdmin;

end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
	lErrorStr, lUseDataBase: string;
begin
	lErrorStr:= '���� ������� ��������� ������:' + #13#10;
	Result := True;
	if CurPageID = SettingsDbPage.ID then begin
		if gHost.Text = '' then begin
			lErrorStr:= lErrorStr + '�� ��������� ���� "�����"!' +#13#10;
			Result:= False;
		end;
		if gPort.Text = '' then begin
			lErrorStr:= lErrorStr + '�� ��������� ���� "����"!' +#13#10;
			Result:= False;
		end;
		if gUser.Text = '' then begin
			lErrorStr:= lErrorStr + '�� ��������� ����  "�����"!' +#13#10;
			Result:= False;
		end;
		if gDBName.Text = '' then begin
			lErrorStr:= lErrorStr + '�� ��������� ���� "��� ����"!' +#13#10;
			Result:= False;
		end;
		if gSuperUser.Text = '' then begin
			lErrorStr:= lErrorStr + '�� ��������� ���� "�����" ��������������!' +#13#10;
			Result:= False;
		end;

    if (Result = False) then
		  MsgBox(lErrorStr, mbError, MB_Ok)
		// else MsgBox(GetStringParameters(''), mbInformation, MB_OK)

	end
	else if CurPageID = wpSelectComponents then begin
      SetDefaultDataManageParameters();
	end;

end;

// ��������: ����� �� ������������� ����
function CheckInstallDataManage(AType: string): Boolean;
begin
    Result:= False;
    if (gInstallDM.Checked) and (GetChosenDataManage() = AType) then begin
        Result:= True;
    end;
end;











; Script generated by the Inno Setup Script Wizard.
; SEE THE DOCUMENTATION FOR DETAILS ON CREATING INNO SETUP SCRIPT FILES!

[Setup]
; NOTE: The value of AppId uniquely identifies this application.
; Do not use the same AppId value in installers for other applications.
; (To generate a new GUID, click Tools | Generate GUID inside the IDE.)
AppId={{7D70E2F7-5C14-45BE-B555-D7C7947637E5}
AppName=m3
AppVerName=0.5
AppPublisher=Bars M3
AppPublisherURL=http://www.bars-open.ru/
AppSupportURL=http://www.bars-open.ru/
AppUpdatesURL=http://www.bars-open.ru/
DefaultDirName={pf}\m3
DefaultGroupName=m3
DisableProgramGroupPage=yes
;InfoBeforeFile=C:\Documents and Settings\Администратор\Рабочий стол\src\InfoBeforeInstall.txt
;InfoAfterFile=C:\Documents and Settings\Администратор\Рабочий стол\src\InfoAfterInstall.txt
OutputDir=C:\Documents and Settings\Администратор\Рабочий стол
OutputBaseFilename=setup
Compression=lzma
SolidCompression=yes

[Languages]
Name: russian; MessagesFile: compiler:Languages\Russian.isl

[Files]
; NOTE: Don't use "Flags: ignoreversion" on any shared system files
Source: src\python-2.6.4.msi; DestDir: {tmp}; Check: not CheckPythonExists(False)
Source: src\postgresql-8.4.2-1-windows.exe; DestDir: {tmp}; Flags: deleteafterinstall; Check: CheckInstallDataManage(ExpandConstant('{cm:Postgre}'));
Source: src\m3project.zip; DestDir: {tmp}; Flags: deleteafterinstall
Source: src\setup.py; DestDir: {tmp}; Flags: deleteafterinstall
;Source: src\psycopg2-2.0.13.win32-py2.6-pg8.4.1-release.exe; DestDir: {tmp}; Flags: deleteafterinstall


[Run]
Filename: msiexec.exe; Parameters: "/i ""{tmp}\python-2.6.4.msi"""; Flags: skipifsilent; Components: install_python; StatusMsg: Установка Python...
Filename: {tmp}\postgresql-8.4.2-1-windows.exe; Flags: skipifsilent; Parameters: {code:GetPostgreInstalParameters}; Check: CheckInstallDataManage(ExpandConstant('{cm:Postgre}')); StatusMsg: Установка PostgreSQL...
Filename: {tmp}\psycopg2-2.0.13.win32-py2.6-pg8.4.1-release.exe; StatusMsg: Установка Psycopg2...
Filename: {code:GetPythonInstallPath}\python; Components: " install_project"; Check: CheckPythonExists(True); Parameters: {code:GetScriptParameters}; StatusMsg: Не закрывайте дочернее окно! Идет установка приложения...
;"{tmp}\setup.py -p ""{app}"" -s ""{tmp}/m3project.zip"" -t 1 -d postgre --host locagHost --port 5432 --user django --password django --superuser postgres --db-name m3 --superpassword 123"

[Components]
Name: install_python; Description: Установить Python 2.6.4; Languages: ; Types: custom; Flags: fixed; Check: not CheckPythonExists(False)
;Name: install_postrgre; Description: Установить PostgreSQL 8.4.2; Types: custom; Languages: ; Flags: checkablealone; Check: not CheckPostgreExists
Name: install_project; Description: M3 project; Flags: fixed; Types: custom
Name: i_mysql; Description: Использовать MySQL; Types: custom; Flags: exclusive checkablealone
Name: i_oracle; Description: Использовать Oracle; Flags: exclusive checkablealone; Types: custom
Name: i_postgre; Description: Использовать PostgreSQL; Flags: exclusive checkablealone; Types: custom

[Types]
Name: custom; Description: Полная установка; Flags: iscustom

[CustomMessages]
; поддерживаемые СУБД:
Postgre = postgre
Oracle  = oracle
MySql   = mysql
Sqlite  = sqlite

[Code]
const
  // Тип инсталяции:
	TYPE_INSTALL = 1; // 1 -- full install, 2 -- update version, 3 -- update build
	
  // Устанавливаемые версии:
  PYTHON_VER = '2.6';
	// POSTGRE_VER = '8.4';

	// В процедурах нельзя объявлять константы... ппц
	// x -- отступ контрола от левого края
	// y -- отступ контрола от верхнего края, отступ между контролами по оси Y
	// h -- высота панели
	// w -- ширина панели
	X = 5;
	Y = 5;
	H = 170;
	W = 200;

	LABEL_W  = 20;   // ширина метки
	EDIT_W   = 120;  // ширина Edita
	EDIT_X   = 70;   // отступ слева Edita

var
  // кастомная страница настроек субд
	SettingsDbPage: TInputQueryWizardPage;

  // глобальные параметры на кастомной странице подключения к бд
  gInstallDM : TNewCheckBox;
  gHost,
	gPort,
	gUser,
	gDBName,
	gSuperUser: TNewEdit;
	gPass,
	gSuperPass: TPasswordEdit;
	
	gStaticText: TNewStaticText;

// Проверка python
function CheckPythonExists(CheckForScript:boolean): Boolean;
begin
	Result := False;
	
	// В зависимости от типа установки этот гад устанавливается в разные корни реестра.
	if RegKeyExists(HKEY_CURRENT_USER, 'SOFTWARE\Python\PythonCore\' + PYTHON_VER + '\InstallPath') then begin
		// можно еще добавить вызов питона через try и ключ реестра InstallPath
		Result := True; // Установлен но в silent режиме... Могут быть проблемы с импортом psycopg2
	end
	else if RegKeyExists(HKEY_LOCAL_MACHINE, 'SOFTWARE\Python\PythonCore\' + PYTHON_VER + '\InstallPath') then begin
		Result := True; // Установлен в громком режиме
	end;
	if  CheckForScript and not Result then
	   MsgBox('Python ' + PYTHON_VER + ' не установлен!',mbError,MB_OK);
end;

// добывает путь к папке где лежит python
function GetPythonInstallPath(AParam: String):string;
var
	lPythonInstallPath: string;
begin
	Result:='';
	if RegQueryStringValue(HKEY_CURRENT_USER,
						'SOFTWARE\Python\PythonCore\' + PYTHON_VER + '\InstallPath',
						'',
						lPythonInstallPath) then begin
		Result:= lPythonInstallPath;
	end
	else if RegQueryStringValue(HKEY_LOCAL_MACHINE,
						'SOFTWARE\Python\PythonCore\' + PYTHON_VER + '\InstallPath',
						'',
						lPythonInstallPath) then begin
		Result:= lPythonInstallPath;
	end
end;

// Возвращает строку с названием СУБД
function GetPostgre():string;
begin
  Result:= ExpandConstant('{cm:Postgre}');
end;

function GetOracle():string;
begin
  Result:= ExpandConstant('{cm:Oracle}');
end;

function GetMySql():string;
begin
  Result:= ExpandConstant('{cm:MySql}');
end;
//------------------------------------

// возвращает выбронную СУБД
function GetChosenDataManage(): string;
begin
  if IsComponentSelected('i_mysql') then begin
      Result:= GetMySql();
  end
  else if IsComponentSelected('i_oracle') then begin
      Result:= GetOracle();
  end
  else if IsComponentSelected('i_postgre') then begin
      Result:= GetPostgre();
  end
  else
      Result := '';
end;

// Формирует и возвращает строку параметров инсталяции Postgre
function GetPostgreInstalParameters(AParam: String):string;
begin
  Result:= '--unattendedmodeui minimal --superpassword ' + gSuperPass.Text + ' --serverport ' + gPort.Text + ' --superaccount ' + gSuperUser.Text;
end;

// Формирует и возвращает строку параметров инсталяции для setup.py
function GetScriptParameters(AParam: string): string;
begin
	 Result := ExpandConstant('{tmp}') + '\setup.py -p "' + ExpandConstant('{app}')
		+ '" -s "' + ExpandConstant('{tmp}') +'\m3project.zip" -t ' + IntToStr(TYPE_INSTALL) + ' -d ' + GetPostgre()
    + ' --host ' + gHost.Text + ' --port ' + gPort.Text
    + ' --user ' + gUser.Text+ ' --password ' + gPass.Text
		+ ' --superuser ' + gSuperUser.Text + ' --superpassword ' + gSuperPass.Text + ' --db-name ' + gDBName.Text;
end;

// Устанавливает значения по умолчанию для выбранных СУБД
procedure SetDefaultDataManageParameters();
begin
    if IsComponentSelected('i_mysql') then begin
        gInstallDM.Caption:= 'Установить My SQL';
        SettingsDbPage.Caption := 'Использование My SQL';
        SettingsDbPage.Description := 'Конфигурация подключения к My SQL';
        gPort.Text := '3306';
        gStaticText.Caption := 'При установке Mysql' +#13#10 + 'оставьте поля Порт и Пароль' +#13#10 + 'по умолчанию!';
    end
    else if IsComponentSelected('i_oracle') then begin
        gInstallDM.Caption:= 'Установить Oracle';
        SettingsDbPage.Caption := 'Использование Oracle';
        SettingsDbPage.Description := 'Конфигурация подключения к Oracle';
        gPort.Text := '1521';
        gStaticText.Caption := 'При установке Oracle' + #13#10 + 'оставьте поля Порт и Пароль' +#13#10 + 'по умолчанию!';
    end
    else if IsComponentSelected('i_postgre') then begin
        gInstallDM.Caption:= 'Установить PostgreSQL';
        SettingsDbPage.Caption := 'Использование PostgreSQL';
        SettingsDbPage.Description := 'Конфигурация подключения к PostgreSQL';
        gPort.Text := '5432';
        gStaticText.Caption := 'При установке Postgre' +#13#10 + 'оставьте поля Порт и Пароль' +#13#10 + 'по умолчанию!';
    end;
end;

procedure OnClickInstallDM(Sender: TObject);
begin
    if (gInstallDM.Checked) then
        gStaticText.Visible := True
    else
        gStaticText.Visible := False;
end;

procedure InitializeWizard;
var
	lPanel, lPanelAdmin : TPanel;

	gHostLabel,
	lParamLabel,
	gPortLabel,
	gUserLabel,
	gPasslabel,
	gDBNameLabel,
	lParamLabelAdmin,
	gSuperUserLabel,
	gSuperPassLabel: TLabel;
begin
	SettingsDbPage := CreateInputQueryPage(wpSelectComponents,'','','');

	gInstallDM := TNewCheckBox.Create(SettingsDbPage);
	gInstallDM.Caption:= 'Установить ';
	gInstallDM.State 	:= cbChecked;
	gInstallDM.Parent := SettingsDbPage.Surface;
	gInstallDM.Width 	:= SettingsDbPage.SurfaceWidth;
	gInstallDM.Align 	:= alTop;
	gInstallDM.OnClick:= @OnClickInstallDM;

	lPanel := TPanel.Create(SettingsDbPage);
	lPanel.Parent 	:= SettingsDbPage.Surface;
	lPanel.Top		  := gInstallDM.Top + gInstallDM.Height + Y;
	lPanel.Height 	:= H;
	lPanel.Width 	  := W;

	// Description:
	lParamLabel := TLabel.Create(lPanel);
	lParamLabel.Caption   := 'Параметры подключения:';
	lParamLabel.Top 	    := ScaleX(Y);
	lParamLabel.Width 	  := ScaleY(LABEL_W);
	lParamLabel.Left 	    := ScaleY(X);
	lParamLabel.Parent 	  := lPanel;
	//lParamLabel.Font.Size := 8;
	lParamLabel.Font.Style:= [fsBold];

	// host -- подключение к бд
	gHostLabel := TLabel.Create(lPanel);
	gHostLabel.Caption:= 'Адрес:';
	gHostLabel.Top 		:= lParamLabel.Top + lParamLabel.Height + Y + 5;
	gHostLabel.Width 	:= ScaleY(LABEL_W);
	gHostLabel.Left 	:= ScaleY(X);
	gHostLabel.Parent := lPanel;

	gHost := TNewEdit.Create(lPanel);
	gHost.Text 		:= 'localhost';
	gHost.Top 		:= lParamLabel.Top + lParamLabel.Height + Y;
	gHost.Width 	:= ScaleY(EDIT_W);
	gHost.Left 		:= ScaleX(EDIT_X);
	gHost.Parent 	:= lPanel;

	// Порт -- подключение к бд
	gPortLabel := TLabel.Create(lPanel);
	gPortLabel.Caption:= 'Порт:';
	gPortLabel.Top 		:= gHostLabel.Top + gHostLabel.Height + Y + 7;
	gPortLabel.Width 	:= ScaleY(LABEL_W);
	gPortLabel.Left 	:= ScaleY(X);
	gPortLabel.Parent := lPanel;

	gPort := TNewEdit.Create(lPanel);
	gPort.Text 		:= '';
	gPort.Top 		:= gHostLabel.Top + gHostLabel.Height + Y + 2;
	gPort.Width 	:= ScaleY(EDIT_W);
	gPort.Left 		:= ScaleX(EDIT_X);
	gPort.Parent 	:= lPanel;

	// Юзер -- подключение к бд
	gUserLabel := TLabel.Create(lPanel);
	gUserLabel.Caption 	:= 'Логин:';
	gUserLabel.Top 		:= gPortLabel.Top + gPortLabel.Height + Y + 7;
	gUserLabel.Width 	:= ScaleY(LABEL_W);
	gUserLabel.Left 	:= ScaleY(X);
	gUserLabel.Parent := lPanel;

	gUser := TNewEdit.Create(lPanel);
	gUser.Text 		:= 'test';
	gUser.Top 		:= gPort.Top + gPort.Height + Y;
	gUser.Width 	:= ScaleY(EDIT_W);
	gUser.Left 		:= ScaleX(EDIT_X);
	gUser.Parent 	:= lPanel;

	// Пароль
	gPassLabel := TLabel.Create(lPanel);
	gPassLabel.Caption:= 'Пароль:';
	gPassLabel.Top 		:= gUserLabel.Top + gUserLabel.Height + Y + 7;
	gPassLabel.Width 	:= ScaleY(LABEL_W);
	gPassLabel.Left 	:= ScaleY(X);
	gPassLabel.Parent := lPanel;

	gPass := TPasswordEdit.Create(lPanel);
	gPass.Text 		:= 'test';
	gPass.Top 		:= gUser.Top + gUser.Height + Y;
	gPass.Width 	:= ScaleY(EDIT_W);
	gPass.Left 		:= ScaleX(EDIT_X);
	gPass.Parent 	:= lPanel;

	// Имя базы -- подключение к бд
	gDBNameLabel := TLabel.Create(lPanel);
	gDBNameLabel.Caption 	:= 'Имя базы:';
	gDBNameLabel.Top 		  := gPassLabel.Top + gPassLabel.Height + Y + 7;
	gDBNameLabel.Width 		:= ScaleY(LABEL_W);
	gDBNameLabel.Left 		:= ScaleY(X);
	gDBNameLabel.Parent 	:= lPanel;

	gDBName := TNewEdit.Create(lPanel);
	gDBName.Text 		:= 'm3project';
	gDBName.Top 		:= gPass.Top + gPass.Height + Y;
	gDBName.Width 	:= ScaleY(EDIT_W);
	gDBName.Left 		:= ScaleX(EDIT_X);
	gDBName.Parent 	:= lPanel;

	// Панель для параметров администратора
	lPanelAdmin := TPanel.Create(SettingsDbPage);
	lPanelAdmin.Parent 	:= SettingsDbPage.Surface;
	lPanelAdmin.Top		:= gInstallDM.Top + gInstallDM.Height + Y;
	lPanelAdmin.Left	:= W + Y;
	lPanelAdmin.Height:= H;
	lPanelAdmin.Width := W;

	// Описание панели администратора:
	lParamLabelAdmin := TLabel.Create(lPanelAdmin);
	lParamLabelAdmin.Caption := 'Параметры администратора:';
	lParamLabelAdmin.Top 	:= ScaleX(Y);
	lParamLabelAdmin.Width 	:= ScaleY(LABEL_W);
	lParamLabelAdmin.Left 	:= ScaleY(X);
	lParamLabelAdmin.Parent := lPanelAdmin;
	lParamLabelAdmin.Font.Size := 8;
	lParamLabelAdmin.Font.Style := [fsBold];

	// Юзер -- подключение к бд
	gSuperUserLabel := TLabel.Create(lPanelAdmin);
	gSuperUserLabel.Caption := 'Логин:';
	gSuperUserLabel.Top 	  := lParamLabelAdmin.Top + lParamLabelAdmin.Height + Y + 5;
	gSuperUserLabel.Width 	:= ScaleY(LABEL_W);
	gSuperUserLabel.Left 	  := ScaleY(X);
	gSuperUserLabel.Parent 	:= lPanelAdmin;

	gSuperUser := TNewEdit.Create(lPanelAdmin);
	gSuperUser.Text 	:= 'postgres';
	gSuperUser.Top 		:= lParamLabelAdmin.Top + lParamLabelAdmin.Height + Y;
	gSuperUser.Width 	:= ScaleY(EDIT_W);
	gSuperUser.Left 	:= ScaleX(EDIT_X);
	gSuperUser.Parent := lPanelAdmin;

	// Пароль
	gSuperPassLabel := TLabel.Create(lPanelAdmin);
	gSuperPassLabel.Caption  := 'Пароль:';
	gSuperPassLabel.Top 	   := gSuperUserLabel.Top + gSuperUserLabel.Height + Y + 7;
	gSuperPassLabel.Width 	 := ScaleY(LABEL_W);
	gSuperPassLabel.Left 	   := ScaleY(X);
	gSuperPassLabel.Parent 	 := lPanelAdmin;

	gSuperPass := TPasswordEdit.Create(lPanelAdmin);
	gSuperPass.Text 	:= '123';
	gSuperPass.Top 		:= gSuperUser.Top + gSuperUser.Height + Y;
	gSuperPass.Width 	:= ScaleY(EDIT_W);
	gSuperPass.Left 	:= ScaleX(EDIT_X);
	gSuperPass.Parent 	:= lPanelAdmin;
	
	// Текст, выводящий некую информацию пользователю
  gStaticText         := TNewStaticText.Create(lPanelAdmin);
  gStaticText.Top     := gSuperPass.Top + gSuperPass.Height + ScaleY(Y)*3;
  gStaticText.Height  := 100;
  gStaticText.Left    := ScaleY(X)*3
  gStaticText.Width   := ScaleY(LABEL_W) + ScaleY(EDIT_W);
  gStaticText.AutoSize:= True;
  gStaticText.Parent  := lPanelAdmin;

end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
	lErrorStr, lUseDataBase: string;
begin
	lErrorStr:= 'Были найдены следующие ошибки:' + #13#10;
	Result := True;
	if CurPageID = SettingsDbPage.ID then begin
		if gHost.Text = '' then begin
			lErrorStr:= lErrorStr + 'Не заполнено поле "Адрес"!' +#13#10;
			Result:= False;
		end;
		if gPort.Text = '' then begin
			lErrorStr:= lErrorStr + 'Не заполнено поле "Порт"!' +#13#10;
			Result:= False;
		end;
		if gUser.Text = '' then begin
			lErrorStr:= lErrorStr + 'Не заполнено поле  "Логин"!' +#13#10;
			Result:= False;
		end;
		if gDBName.Text = '' then begin
			lErrorStr:= lErrorStr + 'Не заполнено поле "Имя базы"!' +#13#10;
			Result:= False;
		end;
		if gSuperUser.Text = '' then begin
			lErrorStr:= lErrorStr + 'Не заполнено поле "Логин" администратора!' +#13#10;
			Result:= False;
		end;

    if (Result = False) then
		  MsgBox(lErrorStr, mbError, MB_Ok)
		// else MsgBox(GetStringParameters(''), mbInformation, MB_OK)

	end
	else if CurPageID = wpSelectComponents then begin
      SetDefaultDataManageParameters();
	end;

end;

// Проверка: Нужно ли устанавливать СУБД
function CheckInstallDataManage(AType: string): Boolean;
begin
    Result:= False;
    if (gInstallDM.Checked) and (GetChosenDataManage() = AType) then begin
        Result:= True;
    end;
end;












