;OSU
;Installer Source for NSIS 3.0 or higher

Unicode True
!include "MUI2.nsh"
!include "FileFunc.nsh"

; ------------------- ;
;  Parse Gruntfile.js ;
; ------------------- ;
!searchparse /file "..\Gruntfile.js" "version: '" APP_NW "',"

; ------------------- ;
;  Parse package.json ;
; ------------------- ;
!searchparse /file "..\package.json" '"releaseName": "' APP_NAME '",'
!searchreplace APP_NAME "${APP_NAME}" "-" " "
!searchparse /file "..\package.json" '"version": "' OSU_VERSION '",'
!searchreplace OSU_VERSION_CLEAN "${OSU_VERSION}" "-" ".0"
!searchparse /file "..\package.json" '"homepage": "' APP_URL '",'
!searchparse /file "..\package.json" '"name": "' DATA_FOLDER '",'

; ------------------- ;
;      Settings       ;
; ------------------- ;
;General Settings
!define COMPANY_NAME "vankasteelj"
Name "${APP_NAME}"
Caption "${APP_NAME} ${OSU_VERSION}"
BrandingText "${APP_NAME} ${OSU_VERSION}"
VIAddVersionKey "ProductName" "${APP_NAME}"
VIAddVersionKey "ProductVersion" "${OSU_VERSION}"
VIAddVersionKey "FileDescription" "${APP_NAME} ${OSU_VERSION} Installer"
VIAddVersionKey "FileVersion" "${OSU_VERSION}"
VIAddVersionKey "CompanyName" "${COMPANY_NAME}"
VIAddVersionKey "LegalCopyright" "${APP_URL}"
VIProductVersion "${OSU_VERSION_CLEAN}.0"

OutFile "..\releases\${APP_NAME} ${OSU_VERSION} - Setup.exe"
CRCCheck on
SetCompressor /SOLID lzma

;Default installation folder
InstallDir "$PROGRAMFILES\${APP_NAME}"

;Request application privileges
;RequestExecutionLevel user

!define UNINSTALL_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"

; ------------------- ;
;     UI Settings     ;
; ------------------- ;
;Define UI settings
!define MUI_UI_HEADERIMAGE_RIGHT "..\app\images\os-icon.png"
!define MUI_ICON "..\dist\os-icon.ico"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_LINK "${APP_URL}"
!define MUI_FINISHPAGE_LINK_LOCATION "${APP_URL}"
!define MUI_FINISHPAGE_RUN "$INSTDIR\OpenSubtitles-Uploader.exe"
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

; ------------------- ;
;    Install code     ;
; ------------------- ;
Function .onInit ; check for previous version
    Exec "taskkill /F /IM OpenSubtitles-Uploader.exe /T"
    ReadRegStr $0 HKCU "${UNINSTALL_KEY}" "InstallString"
    StrCmp $0 "" done
    StrCpy $INSTDIR $0
done:
FunctionEnd

Section ; NWjs Files

    ;Delete existing install
    RMDir /r "$INSTDIR"

    ;Set output path to InstallDir
    CreateDirectory "$INSTDIR"
    SetOutPath "$INSTDIR"

    ;Add the files
    File /oname=OpenSubtitles-Uploader.exe "..\builds\cache\${APP_NW}\win32\nw.exe"
    File "..\builds\cache\${APP_NW}\win32\nw.pak"
    File /r "..\builds\cache\${APP_NW}\win32\locales"
    File "..\builds\cache\${APP_NW}\win32\icudtl.dat"
    File "..\dist\os-icon.ico"

SectionEnd

Section ; App Files

    ;Set output path to InstallDir
    SetOutPath "$INSTDIR\app"

    ;Add the files
    File /r "..\app\css"
    File /r "..\app\images"
    File /r "..\app\js"
    File "..\app\index.html"

    SetOutPath "$INSTDIR"
    File "..\package.json"
    File /oname=License.txt "..\LICENSE"

    SetOutPath "$INSTDIR\node_modules"
    File /r /x "*grunt*" /x "nw-gyp" /x "bower" /x ".bin" /x "bin" /x "test"  /x "test*" /x "example*" /x ".*" /x "*.md" /x "*.gz" /x "benchmark*" /x "*.markdown" "..\node_modules\*.*"

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
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\OpenSubtitles-Uploader.exe" "" "$INSTDIR\os-icon.ico" "" "" "" "${APP_NAME} ${OSU_VERSION}"
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\Uninstall ${APP_NAME}.lnk" "$INSTDIR\Uninstall.exe" "" "$INSTDIR\os-icon.ico" "" "" "" "Uninstall ${APP_NAME}"

    ;Desktop Shortcut
    Delete "$DESKTOP\${APP_NAME}.lnk"

    ;Add/remove programs uninstall entry
    ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
    IntFmt $0 "0x%08X" $0
    WriteRegDWORD HKCU "${UNINSTALL_KEY}" "EstimatedSize" "$0"
    WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayName" "${APP_NAME}"
    WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayIcon" "$INSTDIR\os-icon.ico"
    WriteRegStr HKCU "${UNINSTALL_KEY}" "Publisher" "${COMPANY_NAME}"
    WriteRegStr HKCU "${UNINSTALL_KEY}" "UninstallString" "$INSTDIR\Uninstall.exe"
    WriteRegStr HKCU "${UNINSTALL_KEY}" "InstallString" "$INSTDIR"
    WriteRegStr HKCU "${UNINSTALL_KEY}" "URLInfoAbout" "${APP_URL}"

    System::Call "shell32::SHChangeNotify(i,i,i,i) (0x08000000, 0x1000, 0, 0)"

SectionEnd

; ------------------- ;
;     Uninstaller     ;
; ------------------- ;
Section "uninstall" 

    RMDir /r "$INSTDIR"
    RMDir /r "$SMPROGRAMS\${APP_NAME}"
    Delete "$DESKTOP\${APP_NAME}.lnk"
    
    MessageBox MB_YESNO|MB_ICONQUESTION "$(removeDataFolder)" IDNO NoUninstallData
    RMDir /r "$LOCALAPPDATA\${DATA_FOLDER}"
    NoUninstallData:
    DeleteRegKey HKCU "${UNINSTALL_KEY}"
    DeleteRegKey HKCU "Software\Chromium" ;workaround for NW leftovers

SectionEnd

; ------------------ ;
;  Desktop Shortcut  ;
; ------------------ ;
Function finishpageaction
    CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\OpenSubtitles-Uploader.exe" "" "$INSTDIR\os-icon.ico" "" "" "" "${APP_NAME} ${OSU_VERSION}"
FunctionEnd