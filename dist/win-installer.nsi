;Installer Source for NSIS 3.0.4 or higher

Unicode True
!include "MUI2.nsh"
!include "FileFunc.nsh"

; ------------------- ;
;  Parse package.json ;
; ------------------- ;
!searchparse /file "..\package.json" '"name": "' APP_REAL_NAME '",'
!searchparse /file "..\package.json" '"releaseName": "' APP_NAME '",'
!searchreplace APP_NAME "${APP_NAME}" "-" " "
!searchparse /file "..\package.json" '"version": "' APP_VERSION '",'
!searchreplace APP_VERSION_CLEAN "${APP_VERSION}" "-" ".0"
!searchparse /file "..\package.json" '"homepage": "' APP_URL '",'
!searchparse /file "..\package.json" '"license": "' APP_LICENSE '",'
!searchparse /file "..\package.json" '"icon": "' APP_ICON '",'
!searchreplace APP_ICON_LOCAL_PATH "${APP_ICON}" "/" "\"
!searchparse /file "..\package.json" '"name": "' DATA_FOLDER '",'

; ------------------- ;
;    Architecture     ;
; ------------------- ;
;Default to detected platform build if not defined by -DARCH= argument
!ifndef ARCH
    !if /fileexists "..\build\${APP_REAL_NAME}\win64\*.*"
        !define ARCH "win64"
    !else
        !define ARCH "win32"
    !endif
!endif

; ------------------- ;
;  OUTDIR (installer) ;
; ------------------- ;
;Default to ../build if not defined by -DOUTDIR= argument
!ifndef OUTDIR
    !define OUTDIR "../build"
!endif

; ------------------- ;
;      Settings       ;
; ------------------- ;
;General Settings
!define COMPANY_NAME "vankasteelj"
Name "${APP_NAME}"
Caption "${APP_NAME} ${APP_VERSION}"
BrandingText "${APP_NAME} ${APP_VERSION}"
VIAddVersionKey "ProductName" "NSIS Installer"
VIAddVersionKey "ProductVersion" "3.0.4+"
VIAddVersionKey "FileDescription" "${APP_NAME} ${APP_VERSION} Installer"
VIAddVersionKey "FileVersion" "${APP_VERSION}"
VIAddVersionKey "CompanyName" "${COMPANY_NAME}"
VIAddVersionKey "LegalCopyright" "${APP_LICENSE}"
VIProductVersion "${APP_VERSION_CLEAN}.0"

OutFile "..\build\${APP_REAL_NAME}-${APP_VERSION}-${ARCH}-setup.exe"
CRCCheck on
SetCompressor /SOLID lzma

;Default installation folder
InstallDir "$PROGRAMFILES64\${APP_NAME}"

;Request application privileges
;RequestExecutionLevel user

!define UNINSTALL_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"

; ------------------- ;
;     UI Settings     ;
; ------------------- ;
;Define UI settings
!define MUI_ICON "../${APP_ICON}"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\orange-uninstall.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEFINISHPAGE_BITMAP "${NSISDIR}\Contrib\Graphics\Wizard\nsis3-vintage.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "${NSISDIR}\Contrib\Graphics\Wizard\orange-uninstall.bmp"
!define MUI_FINISHPAGE_LINK "${APP_URL}"
!define MUI_FINISHPAGE_LINK_LOCATION "${APP_URL}"
!define MUI_FINISHPAGE_RUN "$INSTDIR\${APP_REAL_NAME}.exe"
!define MUI_FINISHPAGE_SHOWREADME ""
!define MUI_FINISHPAGE_SHOWREADME_NOTCHECKED
!define MUI_FINISHPAGE_SHOWREADME_TEXT "$(desktopShortcut)"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION finishpageaction

;Define the pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

;Define uninstall pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

;Load Language File
!insertmacro MUI_LANGUAGE "English"
LangString desktopShortcut ${LANG_ENGLISH} "Desktop Shortcut"
LangString removeDataFolder ${LANG_ENGLISH} "Remove all databases and configuration files?"
LangString currentlyRunning ${LANG_ENGLISH} "${APP_NAME} is currently running.$\r$\nDo you want to close it now?"

!insertmacro MUI_LANGUAGE "French"
LangString desktopShortcut ${LANG_French} "Placer un raccourci sur le bureau"
LangString removeDataFolder ${LANG_French} "Supprimer toutes les databases et les fichiers de configuration ?"
LangString currentlyRunning ${LANG_French} "${APP_NAME} est en cours d'utilisation.$\r$\nFaut-il le fermer ?"

; ------------------- ;
;    Check Process    ;
; ------------------- ;
!macro isRunning un
    Function ${un}isRunning
        FindWindow $0 "" "${APP_REAL_NAME}"
        StrCmp $0 0 notRunning
        MessageBox MB_YESNO|MB_ICONEXCLAMATION "$(currentlyRunning)" /SD IDYES IDNO userQuit
            SendMessage $0 ${WM_CLOSE} "" "${APP_REAL_NAME}"
            Goto notRunning
        userQuit:
            Abort
        notRunning:
    FunctionEnd
!macroend
!insertmacro isRunning ""
!insertmacro isRunning "un."

; ------------------- ;
;    Install code     ;
; ------------------- ;
Function .onInit ; check for previous version
    Call isRunning
    ReadRegStr $0 HKCU "${UNINSTALL_KEY}" "InstallString"
    StrCmp $0 "" done
    StrCpy $INSTDIR $0
    done:
FunctionEnd

Section ; Main Files

    ;Delete existing install
    RMDir /r "$INSTDIR"

    ;Set output path to InstallDir
    CreateDirectory "$INSTDIR"
    SetOutPath "$INSTDIR"

    ;Add the files
    File /r "..\build\${APP_REAL_NAME}\${ARCH}\*"

    ;Create uninstaller
    WriteUninstaller "$INSTDIR\Uninstall.exe"

SectionEnd

; ------------------- ;
;      Shortcuts      ;
; ------------------- ;
Section ; Shortcuts

    ;Working Directory
    SetOutPath "$INSTDIR"

    ;Start Menu Shortcut
    RMDir /r "$SMPROGRAMS\${APP_NAME}"
    CreateDirectory "$SMPROGRAMS\${APP_NAME}"
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\${APP_REAL_NAME}.exe" "" "$INSTDIR\${APP_ICON_LOCAL_PATH}" "" "" "" "${APP_NAME}"
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\Uninstall ${APP_NAME}.lnk" "$INSTDIR\Uninstall.exe"

    ;Desktop Shortcut
    Delete "$DESKTOP\${APP_NAME}.lnk"

    ;Add/remove programs uninstall entry
    ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
    IntFmt $0 "0x%08X" $0
    WriteRegDWORD HKCU "${UNINSTALL_KEY}" "EstimatedSize" "$0"
    WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayName" "${APP_NAME}"
    WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayVersion" "${APP_VERSION}"
    WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayIcon" "$INSTDIR\${APP_ICON_LOCAL_PATH}"
    WriteRegStr HKCU "${UNINSTALL_KEY}" "Publisher" "${COMPANY_NAME}"
    WriteRegStr HKCU "${UNINSTALL_KEY}" "UninstallString" "$INSTDIR\Uninstall.exe"
    WriteRegStr HKCU "${UNINSTALL_KEY}" "InstallString" "$INSTDIR"
    WriteRegStr HKCU "${UNINSTALL_KEY}" "URLInfoAbout" "${APP_URL}"
    WriteRegStr HKCU "${UNINSTALL_KEY}" "HelpLink" "${APP_URL}"

    System::Call "shell32::SHChangeNotify(i,i,i,i) (0x08000000, 0x1000, 0, 0)"

SectionEnd

; ------------------- ;
;     Uninstaller     ;
; ------------------- ;
Section "uninstall" 

    Call un.isRunning
    RMDir /r "$INSTDIR"
    RMDir /r "$SMPROGRAMS\${APP_NAME}"
    Delete "$DESKTOP\${APP_NAME}.lnk"
    
    MessageBox MB_YESNO|MB_ICONQUESTION "$(removeDataFolder)" IDNO NoUninstallData
        RMDir /r "$LOCALAPPDATA\${DATA_FOLDER}"
    NoUninstallData:
        DeleteRegKey HKCU "${UNINSTALL_KEY}"
        DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Run\{APP_NAME}"

SectionEnd

; ------------------ ;
;  Desktop Shortcut  ;
; ------------------ ;
Function finishpageaction
    CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${APP_REAL_NAME}.exe" "" "$INSTDIR\${APP_ICON_LOCAL_PATH}" "" "" "" "${APP_NAME}"
FunctionEnd