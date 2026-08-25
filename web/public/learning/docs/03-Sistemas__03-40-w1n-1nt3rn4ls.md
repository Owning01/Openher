# Windows Internals Avanzado

---

## Indice

> ⏱️ **Tiempo estimado:** 25 horas (~5 sesiones) (2184 lineas)


1. [Arquitectura Windows NT](#1-arquitectura-windows-nt)
2. [ntoskrnl y el Kernel](#2-ntoskrnl-y-el-kernel)
3. [Procesos y EPROCESS](#3-procesos-y-eprocess)
4. [Threads y ETHREAD](#4-threads-y-ethread)
5. [Memoria Virtual y VAD](#5-memoria-virtual-y-vad)
6. [Pool Memory](#6-pool-memory)
7. [Formato PE y Carga de Imagenes](#7-formato-pe-y-carga-de-imagenes)
8. [Token y Privilegios](#8-token-y-privilegios)
9. [Object Manager](#9-object-manager)
10. [Registry Internals](#10-registry-internals)
11. [System Calls y SSDT](#11-system-calls-y-ssdt)
12. [APC, DPC e Interrupciones](#12-apc-dpc-e-interrupciones)
13. [IO Manager y IRP](#13-io-manager-y-irp)
14. [Cache Manager y Memory Manager](#14-cache-manager-y-memory-manager)
15. [Ejercicios Practicos](#15-ejercicios-practicos)
16. [Referencias](#16-referencias)

---

## 1. Arquitectura Windows NT

### 1.1 Capas del Sistema

Windows NT tiene una arquitectura de capas superpuestas bien definida:

```
User Mode (Ring 3)
├── System Processes (smss.exe, csrss.exe)
├── Service Processes (svchost.exe, services.exe)
├── User Applications (chrome.exe, notepad.exe)
├── Environment Subsystems (win32k.sys)
└── DLLs (kernel32.dll, ntdll.dll, user32.dll)
        │
        │  System Service Dispatch (syscall/sysenter)
        ▼
Kernel Mode (Ring 0)
├── Win32k.sys (Graphics/GUI)
├── Executive
│   ├── Process Manager (Ps)
│   ├── Memory Manager (Mm)
│   ├── IO Manager (Io)
│   ├── Cache Manager (Cc)
│   ├── Object Manager (Ob)
│   ├── Security Reference Monitor (Se)
│   ├── Configuration Manager (Cm)
│   ├── Power Manager (Po)
│   └── Plug & Play Manager (Pnp)
├── Kernel (ke)
│   ├── Thread Scheduling
│   ├── Interrupt Handling
│   ├── DPC/APC
│   └── Trap/Syscall Dispatch
├── HAL (Hardware Abstraction Layer)
└── Device Drivers
```

### 1.2 [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) Mode vs User Mode

Windows usa dos niveles de privilegio (ring 0 y ring 3 en [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86)-64):

**User Mode (Ring 3):**
- Acceso restringido a memoria
- No puede ejecutar instrucciones privilegiadas
- Cada [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) tiene su propio espacio de direcciones
- Si crashea, solo muere el proceso
- Se comunica con kernel via system calls

**Kernel Mode (Ring 0):**
- Acceso completo a toda la memoria
- Ejecuta cualquier instruccion CPU
- Comparte un unico espacio de direcciones (0x80000000+)
- Si crashea, mata todo el sistema (BSOD)
- [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) verificador protege contra errores comunes

**Transicion User-Kernel:**
```asm
; x64 syscall example
mov r10, rcx        ; save return address
mov eax, syscall_number  ; system call number
syscall             ; transition to kernel
; returns to user mode via sysret
```

### 1.3 HAL (Hardware Abstraction Layer)

La HAL abstrae las diferencias de hardware entre plataformas:
- Cache de CPU (L1, L2, L3)
- Controladores de interrupcion (APIC, I/O APIC)
- Timers (HPET, ACPI PM timer)
- DMA
- Multiprocesador

```bash
# Ver HAL cargada
# En dump:
lm m hal
!hal

# HALs comunes:
# hal.dll        -> Uniprocessor ACPI PC
# halacpi.dll    -> APIC
# halmps.dll     -> Multiprocessor
# halmacpi.dll   -> Multiprocessor APIC
```

### 1.4 [sistema de archivos](../raw/0s-f0nd4m3nt0s.md#sistema-de-archivos) del Kernel

El kernel de Windows (ntoskrnl.exe) se compone de:

| Archivo | Proposito |
|---------|-----------|
| ntoskrnl.exe | Kernel principal (uniprocesador) |
| ntkrnlmp.exe | Kernel multiprocesador |
| ntkrnlpa.exe | Kernel PAE (32-bit) |
| ntkrpamp.exe | Kernel multiprocesador PAE |
| hal.dll | HAL |
| win32k.sys | Kernel graphics driver |
| cdd.dll | Canonical Display Driver |

```bash
# Ver version del kernel
wmic os get version
winver
# En dump: lm n nt
```

### 1.5 Ejercicios Practicos

**Ejercicio 1.1:** Identifica los modulos del kernel cargados en tu sistema usando `lm` en WinDbg o [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) `Get-WindowsDriver`.

**Ejercicio 1.2:** Usa WinDbg para listar todas las entradas de la SSDT con `!syscall` o `dqs nt!KeServiceDescriptorTable`.

---

## 2. ntoskrnl y el [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

### 2.1 Kernel Image Sections

El ejecutable del kernel (ntoskrnl.exe) se divide en secciones:

```bash
dumpbin /headers C:\Windows\System32\ntoskrnl.exe
```

Secciones principales:
- **.text**: Codigo ejecutable
- **.data**: Datos inicializados
- **.rdata**: Constantes y tablas (SSDT, pagedata)
- **.pdata**: Exception handling data
- **.reloc**: Relocation data
- **.edata**: Export directory

### 2.2 Principales Componentes del Kernel

**Dispatcher Header (DISPATCHER_HEADER):**
```c
typedef struct _DISPATCHER_HEADER {
    UCHAR Type;           // Tipo de objeto
    UCHAR Absolute;       // Timer absolute flag
    UCHAR Size;          // Tamaño en bytes / 4
    UCHAR Inserted;      // En lista de espera?
    LONG SignalState;    // Estado de señal
    LIST_ENTRY WaitListHead; // Lista de threads esperando
} DISPATCHER_HEADER;
```

**Tipos de dispatcher:**
| Type | Objeto | Descripcion |
|------|--------|-------------|
| 0x00 | EventNotification | Evento notifications |
| 0x01 | EventSynchronization | Evento con sync |
| 0x02 | Mutant | Mutex |
| 0x03 | Process | Objeto de [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) |
| 0x04 | Queue | Cola de IO completion |
| 0x05 | Semaphore | Semaforo |
| 0x06 | Thread | Objeto de thread |
| 0x07 | Timer | Timer de notification |
| 0x08 | TimerSynchronization | Timer sync |
| 0x09 | Gate | Puerta de sync |

### 2.3 [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) Verifier

Driver Verifier es una herramienta que monitorea drivers en busca de comportamiento incorrecto:

```bash
# Activar Driver Verifier
verifier.exe

# Modos comunes:
# 1. Standard flags
# 2. Deadlock detection
# 3. DMA verification
# 4. Force IRQL checking
# 5. I/O verification
# 6. Memory pool tracking
# 7. Special pool
# 8. SCSI verification

# Desde linea:
verifier /standard /driver driver.sys
verifier /flags 0x1BB /all
# Flags: 0x1 (Special Pool), 0x2 (IRQL), 0x8 (Pool Tracking), 0x20 (IO), 0x80 (Deadlock), 0x100 (DMA), 0x200 (Force), 0x400 (Low Resources)

# Verificar estado
verifier /query
```

### 2.4 Bug Checks (BSOD)

Los bug checks mas comunes en kernel:

| Bug Check Code | Nombre | Causa Tipica |
|----------------|--------|--------------|
| 0x0000000A | IRQL_NOT_LESS_OR_EQUAL | IRQL incorrecto para operacion |
| 0x0000001E | KMODE_EXCEPTION_NOT_HANDLED | Excepcion en kernel |
| 0x00000024 | NTFS_FILE_SYSTEM | Problema de filesystem |
| 0x0000002E | DATA_BUS_ERROR | Error de bus |
| 0x0000003B | SYSTEM_SERVICE_EXCEPTION | Excepcion en [syscall](../raw/0s-f0nd4m3nt0s.md#syscalls) |
| 0x00000044 | MULTIP_IRQL_COMPLETION | IRQL multiple |
| 0x00000050 | PAGE_FAULT_IN_NONPAGED_AREA | Page fault en memoria no paginable |
| 0x0000007E | SYSTEM_THREAD_EXCEPTION_NOT_HANDLED | Excepcion en thread de sistema |
| 0x0000009F | DRIVER_POWER_STATE_FAILURE | Problema de power state |
| 0x000000BE | ATTEMPTED_WRITE_TO_READONLY_MEMORY | Escritura a memoria solo lectura |
| 0x000000C4 | DRIVER_VERIFIER_DETECTED_VIOLATION | Violacion detectada por verifier |
| 0x000000D1 | DRIVER_IRQL_NOT_LESS_OR_EQUAL | Driver con IRQL incorrecto |

```bash
# Analisis de crash dump
WinDbg: !analyze -v
# Buscar: BUGCHECK_CODE, BUGCHECK_STR, PROCESS_NAME, MODULE_NAME
```

### 2.5 System Variables Globales

Variables globales clave del kernel:

```c
// WinDbg: dt nt!_KdDebuggerDataBlock
// WinDbg: dd nt!KiDebuggerDataBlock

// Ejemplos de variables globales:
nt!PsActiveProcessHead     // Lista de procesos (LIST_ENTRY)
nt!PsLoadedModuleList      // Lista de modulos cargados
nt!KeServiceDescriptorTable // SSDT
nt!KiPcr                  // Processor Control Region
nt!KiProcessorBlock       // Array de PRCBs
nt!MmPfnDatabase          // PFN database
nt!MmSystemRangeStart     // Inicio de memoria de sistema
```

### 2.6 Ejercicios Practicos

**Ejercicio 2.1:** Usa WinDbg para dump `nt!PsActiveProcessHead` y recorre la lista de procesos desde kernel.

**Ejercicio 2.2:** Analiza un crash dump con `!analyze -v` e identifica el driver culpable, el codigo de error, y el proceso asociado.

---

## 3. Procesos y EPROCESS

### 3.1 Estructura EPROCESS

La estructura EPROCESS es el objeto de [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) en el [kernel](../raw/0s-f0nd4m3nt0s.md#kernel). Cada [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) tiene un EPROCESS asociado.

```c
// WinDbg: dt nt!_EPROCESS
typedef struct _EPROCESS {
    KPROCESS Pcb;                              // 0x000 - Kernel process block
    EX_PUSH_LOCK ProcessLock;                  // 0x0D8 - Lock del proceso
    LARGE_INTEGER CreateTime;                  // 0x0E0 - Fecha de creacion
    LARGE_INTEGER ExitTime;                    // 0x0E8 - Fecha de finalizacion
    LIST_ENTRY ActiveProcessLinks;             // 0x0F0 - Lista de procesos activos
    HANDLE UniqueProcessId;                    // 0x100 - PID
    LIST_ENTRY ThreadListHead;                 // 0x108 - Lista de threads
    HANDLE_TABLE ObjectTable;                  // 0x110 - Tabla de handles
    EX_FAST_REF Token;                         // 0x118 - Token de seguridad
    MM_AVL_TABLE VadRoot;                      // 0x120 - VAD tree root
    UCHAR ImageFileName[15];                   // 0x2E8 - Nombre del ejecutable
    UNICODE_STRING CommandLine;                // Command line
    PEB Peb;                                   // PEB en user mode
    ULONG Flags;                               // Flags del proceso
    ULONG Flags2;                              // Flags del proceso
    EX_FAST_REF Win32Process;                  // W32 process structure
    PVOID SectionObject;                       // Seccion de imagen
    PVOID SectionBaseAddress;                  // Base de la seccion
    PVOID PaeTop;                              // Pae top
    PVOID VadFreeHint;                         // Hint de VAD free
    PVOID VadRootLarge;                        // Large VAD
    USHORT ParentProcess;                      // PID del padre
    // ... muchos mas campos
} EPROCESS;
```

### 3.2 Campos Criticos de EPROCESS

| Offset (Win10 [x64](../raw/4ss3mbly-f0r-h4ck3rs.md#x64)) | Campo | Descripcion | Uso [forense](../raw/w1n-f0r3ns1cs.md#forense) |
|---|---|---|---|
| 0x000 | Pcb (KPROCESS) | Base del proceso | Scheduling |
| 0x0E0 | CreateTime | Fecha de creacion | Timeline |
| 0x0E8 | ExitTime | Fecha de salida | Timeline |
| 0x0F0 | ActiveProcessLinks | Lista enlazada | Enumeracion |
| 0x100 | UniqueProcessId | PID | Identificacion |
| 0x108 | ThreadListHead | Lista de threads | Thread enumeration |
| 0x110 | ObjectTable | Tabla de handles | Handle enumeration |
| 0x118 | Token | Security token | Privilegios |
| 0x120 | VadRoot | VAD tree | Mapeo de memoria |
| 0x2E0 | ImageFileName | Nombre | Identificacion |
| 0x2F0 | CommandLine | Command line | Identificacion |
| 0x300 | [peb](../raw/w1n-1nt3rn4ls.md#peb) | [peb](../raw/w1n-1nt3rn4ls.md#peb) address | User-mode state |

### 3.3 KPROCESS (Kernel Process Block)

```c
typedef struct _KPROCESS {
    DISPATCHER_HEADER Header;          // Type = 0x03 (Process)
    LIST_ENTRY ProcessListEntry;      // Lista de procesos del kernel
    EXECUTION_STATE ExecutionState;   // Estado de ejecucion
    KAFFINITY Affinity;              // CPU affinity
    KAFFINITY AffinityRevision;      // Revision de affinity
    ULONG EnableCycleTimer;          // Cycle timer
    ULONG CycleTimer;                // Timer de ciclos
    LONG Quantum;                    // Quantum de tiempo
    ULONG BasePriority;              // Prioridad base
    ULONG ThreadSeed;                // Seed para threads
    ULONG ProcessFlags;             // Flags del proceso
    KEVENT ExitEvent;               // Evento de salida
} KPROCESS;
```

### 3.4 Enumeracion de Procesos desde Kernel

```c
// Como recorre Windows los procesos:
void EnumerateProcesses() {
    PLIST_ENTRY Head = &PsActiveProcessHead;
    PLIST_ENTRY Entry = Head->Flink;
    
    while (Entry != Head) {
        PEPROCESS Process = CONTAINING_RECORD(Entry, EPROCESS, ActiveProcessLinks);
        
        // Acceder a campos
        HANDLE pid = Process->UniqueProcessId;
        char* name = Process->ImageFileName;
        PTOKEN token = (PTOKEN)(Process->Token & ~0xF); // EX_FAST_REF
        
        Entry = Entry->Flink;
    }
}
```

```bash
# Enumeracion desde WinDbg
!process 0 0
# Lista todos los procesos

!process 0 1
# Lista procesos con detalle

# Por PID
!process 1234 0

# dt EPROCESS desde dump
dt nt!_EPROCESS <EPROCESS_ADDRESS>
```

### 3.5 Process Manipulation ([dkom](../raw/k3rn3l-h4ck1ng.md#dkom))

Direct Kernel Object Manipulation permite modificar EPROCESS en memoria para ocultar procesos:

```c
// Tecnica: Remover de ActiveProcessLinks
void HideProcess(PEPROCESS Process) {
    // Remover de lista de procesos
    RemoveEntryList(&Process->ActiveProcessLinks);
    
    // Cambiar flags para evitar deteccion
    Process->Flags = /* flags alterados */;
    
    // Si se quiere cambiar PID
    Process->UniqueProcessId = (HANDLE)fake_pid;
}
```

```bash
# Deteccion de DKOM:
# 1. Comparar !process 0 0 con resultados de task manager
# 2. Usar !psscan (Volatility) que no usa lista enlazada
# 3. Buscar EPROCESS huérfanos
# 4. Verificar integridad de ActiveProcessLinks
```

### 3.6 PEB (Process Environment Block)

El PEB reside en memoria de user-mode pero es referenciado desde EPROCESS:

```c
typedef struct _PEB {
    BYTE InheritedAddressSpace;          // Heredo espacio?
    BYTE ReadImageFileExecOptions;       // Options de ejecucion
    BYTE BeingDebugged;                  // DEBUGGED flag
    BYTE BitField;                       // Varios flags
    ULONG SessionId;                     // Session ID
    PVOID Mutant;                        // Win32 mutex
    PVOID ImageBaseAddress;             // Base de la imagen
    PPEB_LDR_DATA Ldr;                  // Loader data
    PRTL_USER_PROCESS_PARAMETERS ProcessParameters;  // Parametros
    ULONG SubSystemData;                // Subsystem
    PVOID PostProcessInitRoutine;
    ULONG NumberOfHeaps;                // Numero de heaps
    PVOID Heaps;                        // Lista de heaps
    PVOID ReadOnlySharedMemoryBase;     // Shared memory base
    BOOL FastPebLock;
    ULONG SpareBool;
    BOOL IsProtectedProcess;            // PPL?
    BOOL IsImageDynamicallyRelocated;
    // ... mas campos
} PEB;
```

```bash
# Leer PEB desde WinDbg
!peb <PEB_ADDRESS>

# Desde Volatility
windows.pebscan --pid <PID>

# dt PEB
dt nt!_PEB <PEB_ADDRESS>
```

### 3.7 Proteccion de Procesos (PPL)

Windows protege procesos criticos via PPL (Protected Process Light):

| Nivel | Proteccion | Ejemplos |
|---|---|---|
| PsProtectedSignerNone | Sin proteccion | Apps de usuario |
| PsProtectedSignerAuthenticode | Firma valida | .NET native |
| PsProtectedSignerCodeGen | CodeGen | .NET |
| PsProtectedSignerAntimalware | Antimalware | Defender |
| PsProtectedSignerLsa | LSA | lsass.exe |
| PsProtectedSignerWindows | Windows | tcb |
| PsProtectedSignerWinTcb | WinTCB | Kernel, smss |
| PsProtectedSignerWinSystem | System | csrss |

```bash
# Verificar proteccion
!process 0 0  # Mirar columna "Protect"

# Desde cmd
powershell "Get-Process | Select Name,Id,StartInfo.ProtectedProcess | Format-Table"

# Bypass de PPL requiere driver firmado por Microsoft
```

### 3.8 Procesos Especiales

| Proceso | PID | Descripcion | Importancia Forense |
|---|---|---|---|
| System | 4 | Kernel-mode process | N/A |
| smss.exe | [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables) | Session Manager | Creacion de sesiones |
| csrss.exe | Variable | Client/Server Runtime | Win32 support |
| wininit.exe | Variable | Windows Init | Inicio de sesion 0 |
| winlogon.exe | Variable | Logon | Inicio de sesion interactivo |
| services.exe | Variable | Service Control Manager | Gestion de servicios |
| lsass.exe | Variable | LSA Subsystem | [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) |
| svchost.exe | Variable | Service Host | Host de servicios |
| explorer.exe | Variable | Windows Explorer | Shell de usuario |

### 3.9 Ejercicios Practicos

**Ejercicio 3.1:** Usa WinDbg en un memory dump para recorrer `PsActiveProcessHead` manualmente y listar todos los procesos.

**Ejercicio 3.2:** Escribe un script en [python](../raw/pyth0n-f0r-h4ck1ng.md) + Volatility 3 que liste EPROCESS mostrando PID, nombre, create time, y token privileges.

**Ejercicio 3.3:** Crea un [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) que oculte un proceso mediante DKOM (quitandolo de ActiveProcessLinks). En entorno controlado, detectalo usando Volatility `psscan`.

---

## 4. Threads y ETHREAD

### 4.1 Estructura ETHREAD

```c
// dt nt!_ETHREAD
typedef struct _ETHREAD {
    KTHREAD Tcb;                    // Kernel Thread Block
    LARGE_INTEGER CreateTime;       // Creacion
    LARGE_INTEGER ExitTime;         // Salida
    PVOID ExitStatus;              // Codigo de salida
    LIST_ENTRY ThreadListEntry;    // Lista de threads del proceso
    LIST_ENTRY ActiveTimerList;    // Timers activos
    PS_CREATE_INFO CreateInfo;     // Info de creacion
    PVOID Cid;                     // Client ID (PID+TID)
    ULONG LpMaximumSpinCount;      // Spin count
    PS_IMPERSONATION_INFORMATION ImpersonationInfo;  // Impersonacion
    PVOID Win32StartAddress;       // Direccion de inicio
    BOOLEAN HardErrorsAreDisabled; // Errores HW
    BOOLEAN LegacyCalloutActive;
    PVOID ForwardClusterShadow;
    LIST_ENTRY ThreadListEntry;    // Thread list
    PAGEFAULT_HISTORY PageFaultHistory;
} ETHREAD;
```

### 4.2 KTHREAD

```c
typedef struct _KTHREAD {
    DISPATCHER_HEADER Header;     // Type = 0x06
    PVOID InitialStack;           // Initial stack
    PVOID StackBase;              // Base del stack
    PVOID StackLimit;             // Limite del stack
    PVOID KernelStack;            // Kernel stack actual
    PVOID ThreadLock;             // Thread lock
    UCHAR ApcState;               // APC state
    SCHAR Priority;               // Prioridad dinamica
    ULONG BasePriority;           // Prioridad base
    ULONG PreviousMode;           // Previous execution mode
    KAFFINITY Affinity;           // CPU affinity
    KPROCESS Process;             // Proceso padre
    PVOID Win32Thread;            // Win32 thread info
    ULONG LpcReplyMessageId;
    ULONG LpcReplyMessageId2;
    ULONG KernelStackResident;
    ULONG SuspendCount;           // Suspend count
    ULONG WaitTime;               // Wait time
    UCHAR WaitReason;              // Wait reason
    UCHAR WaitMode;                // Wait mode
    UCHAR WaitStatus;              // Wait status
} KTHREAD;
```

### 4.3 [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de Creacion de Thread

```bash
# Syscall NtCreateThread -> PspCreateThread -> KeInitThread
#
# Pasos:
# 1. Validar parametros (PROCESS_CREATE_THREAD access)
# 2. Asignar ETHREAD + kernel stack (pool)
# 3. Inicializar KTHREAD (prioridad, affinity, quantum)
# 4. Crear Teb (Thread Environment Block) en user mode
# 5. Asociar al proceso (thread list)
# 6. Inicializar contexto de inicio
# 7. Insertar en lista de threads del proceso
# 8. KeStartThread -> Thread se vuelve schedulable

// Contexto de inicio
typedef struct _INITIAL_TEB {
    PVOID StackBase;
    PVOID StackLimit;
    PVOID StackCommit;
    PVOID StackCommitMax;
    PVOID StackReserved;
} INITIAL_TEB;
```

### 4.4 Thread Scheduling

Windows usa scheduling con prioridades (0-31):

```
Clases de Prioridad:
├── Real-time (16-31): Usado por el sistema
│   ├── 31: High (idle thread)
│   └── 16: Low real-time
├── Dynamic (1-15): Threads normales
│   ├── 15: Highest
│   ├── 7: Normal
│   └── 1: Idle
└── Zero Page Thread (0): Solo para zero pages
```

```c
// Quantum por defecto segun SKU:
// Client: 2 quantums (~40ms)
// Server: 12 quantums (~240ms)
// Variable: 6-24 quantums

// Estructura de Quantum
#define QUANTUM_PER_TICK 3  // ~15ms
#define QUANTUM_CLIENT 2    // ~30ms

typedef struct _KTHREAD_QUANTUM {
    LONG Quantum;           // Ticks restantes
    LONG InitialQuantum;    // Quantum inicial
    ULONG ActiveQuantum;    // Quantum activo
} KTHREAD_QUANTUM;
```

### 4.5 Thread States

| Estado | Descripcion |
|---|---|
| Ready | Listo para ejecutar, esperando CPU |
| DeferredReady | Listo pero aun no en cola |
| Standby | Sera ejecutado por core especifico |
| Running | Ejecutando actualmente |
| Waiting | Esperando objeto (evento, mutex, etc.) |
| Transition | En transicion entre estados |
| Terminated | Thread finalizado pero EPROCESS vivo |
| GateWaiting | Esperando en una gate |
| Suspended | Suspendido (SuspendCount > 0) |

```bash
# Ver estado de threads
!thread <ETHREAD_ADDRESS>
!process 0 0  # Muestra numero de threads por proceso

# Tag de thread en pool
# Pool tag: "Thre"
```

### 4.6 Thread Hijacking y Deteccion

```c
// Tecnica de thread hijacking para inyeccion:
// 1. Abrir thread con THREAD_ALL_ACCESS
// 2. SuspendThread()
// 3. SetThreadContext() en RIP/RSP
// 4. ResumeThread()

// Deteccion:
// - Verificar Win32StartAddress contra DLLs cargadas
// - Detectar threads con context sospechoso
// - Volatility: threadscan, apihooks

// Ejemplo de deteccion en Volatility:
// python3 vol.py -f memory.dmp windows.threads --pid 1234
```

### 4.7 Ejercicios Practicos

**Ejercicio 4.1:** Usa WinDbg para listar todos los threads de un proceso con `!process <PID> 7`. Identifica el thread main (primer thread).

**Ejercicio 4.2:** En un memory dump, identifica threads con Win32StartAddress fuera de modulos cargados (posible thread hijacking).

---

## 5. Memoria Virtual y VAD

### 5.1 Espacio de Direcciones

En Windows [x64](../raw/4ss3mbly-f0r-h4ck3rs.md#x64), el espacio de direcciones se divide:

```
User Space (0x0000000000000000 - 0x00007FFFFFFFFFFF)
├── NULL Pointer Guard (0x0 - 0xFFFF)
├── 64KB reserved
├── Code / Heap / Stack
└── Shared user data (0x7FFE0000 - 0x7FFEFFFF)

Kernel Space (0xFFFF800000000000 - 0xFFFFFFFFFFFFFFFF)
├── System PTEs (Page Table Entries)
├── System Cache
├── Paged Pool
├── Non-Paged Pool
├── PFN Database
├── Kernel Image (ntoskrnl.exe + HAL)
├── HAL Extensions
├── Space for driver images
├── Session Space
└── HyperSpace
```

### 5.2 VAD (Virtual Address Descriptors)

El VAD es un arbol AVL que describe rangos de memoria virtual:

```c
typedef struct _MMVAD {
    MMVAD_FLAGS u1;               // Flags
    MMVAD_FLAGS2 u2;              // Flags 2
    PVOID StartingVpn;            // Pagina inicial (VPN)
    PVOID EndingVpn;              // Pagina final  
    PVOID Subsection;             // Subseccion
    PVOID FileObject;             // File object asociado
    PVOID FirstPrototypePte;      // Prototype PTE
    PVOID LastPte;               // Ultima PTE
    ULONG ViewLinks;              // VAD links
    EX_PUSH_LOCK PushLock;        // Lock
} MMVAD;
```

```bash
# Ver VAD de un proceso
!vad <PROCESS>  # Tira el arbol VAD
!address <PROCESS> # Resumen de memoria

# Tipos de VAD:
# VadNone (0) - No mapeado
# VadRead (1) - Solo lectura
# VadWrite (2) - Lectura/Escritura
# VadExecute (3) - Ejecutable
# VadExecuteRead (4) - RX
# VadExecuteReadWrite (5) - RWX
# VadWriteCopy (6) - Copy-on-Write
```

### 5.3 PFN Database

La PFN (Page Frame Number) database trackea cada pagina de memoria fisica:

```c
typedef struct _MMPFN {
    PVOID u1;              // Varios usos
    PVOID u2;
    PVOID u3;
    struct _MMPTE* PteAddress;  // PTE que referencia
    LONG ReferenceCount;        // Referencias
    BYTE Color;
    BYTE PageLocation;          // Lista donde esta
    BYTE Priority;             // Prioridad
    BYTE Flags;                // Flags
} MMPFN;
```

```bash
# Ver PFN
!pfn <PFN_NUMBER>

# Listas de PFN:
# ActiveAndValid    - Paginas en uso
# StandbyList      - Paginas en standby (cached)
# ModifiedList     - Paginas modificadas
# ModifiedNoWriteList - Paginas por escribir
# BadList          - Paginas malas
# FreeList         - Paginas libres
```

### 5.4 Page Table Entries

En x64, las page tables tienen 4 niveles:

```
     PML4 (512 entries)
       │
       ▼
     PDPT (512 entries)
       │
       ▼
     PDT (512 entries)
       │
       ▼
     PT (512 entries)
       │
       ▼
     4KB Page

# Cada entrada: 8 bytes
# PML4 -> PDPT -> PDT -> PT -> Page
```

```c
typedef struct _MMPTE {
    ULONGLONG Valid:1;         // Pagina valida?
    ULONGLONG Write:1;         // Writable?
    ULONGLONG Owner:1;         // User/Supervisor
    ULONGLONG WriteThrough:1;  // WT cache?
    ULONGLONG CacheDisable:1;  // CD cache?
    ULONGLONG Accessed:1;      // Fue accesada?
    ULONGLONG Dirty:1;         // Fue escrita?
    ULONGLONG LargePage:1;     // 2MB page?
    ULONGLONG Global:1;        // Global page?
    ULONGLONG CopyOnWrite:1;   // Copy-on-write?
    ULONGLONG Prototype:1;     // Prototype PTE?
    ULONGLONG Transition:1;    // En transicion?
    ULONGLONG PageFrameNumber:40;  // PFN
} MMPTE;
```

### 5.5 Memory-Mapped Files y Sections

```c
// Section objects representan memoria compartida
typedef struct _SECTION {
    SECTION_INHERIT Inherit;    // Inheritance
    SECTION_EXTEND_SIZE ExtendSize;
    SECTION_FLAGS Flags;
    MM_SECTION_FLAGS MmSectionFlags;
    PVOID FileObject;           // Archivo mapeado
    PVOID Segment;              // Segment
    LARGE_INTEGER Size;         // Tamano
} SECTION;
```

### 5.6 Ejercicios Practicos

**Ejercicio 5.1:** En un memory dump, usa `!vad` para identificar regiones de memoria con [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) inusuales (RWX). Busca posibles inyecciones.

**Ejercicio 5.2:** Analiza las page tables de un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) con `!pte <address>` y documenta las propiedades de cada nivel.

---

## 6. Pool Memory

### 6.1 Pool Header

```c
typedef struct _POOL_HEADER {
    union {
        struct {
            USHORT PreviousSize : 9;  // Tamano del bloque anterior
            USHORT PoolIndex : 7;     // Pool index
        };
        USHORT PreviousSize;
    };
    union {
        struct {
            USHORT PoolType : 9;      // Tipo de pool
            USHORT PoolIndex : 7;
        };
        USHORT PoolSize;               // Tamano del bloque actual
    };
    ULONG PoolTag;                     // Tag de 4 caracteres
    PVOID ProcessBilled;              // Proceso asociado (quota)
} POOL_HEADER;
```

### 6.2 Pool Tags Comunes

| Tag | Descripcion | Componente |
|-----|-------------|------------|
| Proc | Process object | Ps |
| Thre | Thread object | Ps |
| File | File object | Io |
| MmSt | Memory section | Mm |
| Vadl | VAD | Mm |
| IoNx | I/O Request Packet | Io |
| SePa | Security descriptor | Se |
| ObHd | Object handle table | Ob |
| Key_ | Registry key | Cm |
| ACPIf | ACPI | Hal |
| Dmm_ | Desktop heap | Win32k |
| Gh04 | GDI handle | Win32k |
| UsrC | User object | Win32k |

### 6.3 Tipos de Pool

| PoolType | Valor | Descripcion |
|----------|-------|-------------|
| NonPagedPool | 0 | Siempre en RAM (ISR/DPC safe) |
| PagedPool | 1 | Puede ser paginado |
| NonPagedPoolExecute | 2 | Non-paged + executable |
| PagedPoolCache | 3 | Cache |
| SessionPool | 4 | Espacio de sesion |
| PagedPoolSession | 5 | Session paged |

```bash
# Ver uso de pool
!poolused 2  # Muestra pool por tag
!poolfind <TAG> # Busca bloques con tag especifico
!pool <ADDRESS> # Info de un bloque de pool

# Ver memoria de pool total
!vm
```

### 6.4 Special Pool

Special Pool es una feature de [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) Verifier que asigna cada asignacion en paginas separadas:

```c
// Cuando se activa:
// - Cada asignacion termina al final de una pagina
// - La pagina siguiente es guard page (invalida)
// - Overflow inmediatamente causa bug check
// - Underflow: la pagina anterior es guard

// Comandos:
verifier /flags 0x1 /driver driver.sys

// Detectar en dump:
!verifier
!memusage  // Buscar "Special Pool"
```

### 6.5 Pool Corruption y Deteccion

```c
// Pool header corruption detection
// Windows verifica:
// 1. PreviousSize == PoolSize (size consistency)
// 2. PoolTag no es un puntero valido (no es 0xBAD0...)
// 3. PoolType es valido (0-15)
// 4. ProcessBilled no es invalido

// Bug checks comunes por pool:
// 0xC1: SPECIAL_POOL_DETECTED_MEMORY_CORRUPTION
// 0xC4: DRIVER_VERIFIER_DETECTED_VIOLATION
// 0xD6: DRIVER_PAGE_FAULT_BEYOND_END_OF_ALLOCATION
```

### 6.6 Busqueda de Tags de Pool en Volatility

```bash
# Volatility pool scanning:
vol -f memory.dmp windows.pool
vol -f memory.dmp windows.pool --tag "Proc"
vol -f memory.dmp windows.pool --tag "Thre"

# Pool scanner para artefactos forenses:
# - Process objects (tag Proc)
# - Thread objects (tag Thre)
# - File objects (tag File)
# - Registry cells (CM cells)
```

### 6.7 Ejercicios Practicos

**Ejercicio 6.1:** En un memory dump, usa `!poolused 2` para identificar los tags de pool mas usados y suma la memoria total por tag.

**Ejercicio 6.2:** Busca objetos File (tag "File") en un dump con Volatility y lista todos los handles de archivo abiertos en el momento del dump.

---

## 7. Formato [pe](../raw/w1n-1nt3rn4ls.md#pe) y Carga de Imagenes

### 7.1 Estructura PE

```c
// DOS Header (64 bytes)
typedef struct _IMAGE_DOS_HEADER {
    WORD e_magic;         // MZ (0x5A4D)
    WORD e_cblp;
    WORD e_cp;
    WORD e_crlc;
    WORD e_cparhdr;
    WORD e_minalloc;
    WORD e_maxalloc;
    WORD e_ss;
    WORD e_sp;
    WORD e_csum;
    WORD e_ip;
    WORD e_cs;
    WORD e_lfarlc;
    WORD e_ovno;
    WORD e_res[4];
    WORD e_oemid;
    WORD e_oeminfo;
    WORD e_res2[10];
    LONG e_lfanew;        // Offset al NT Header
} IMAGE_DOS_HEADER;

// NT Headers
typedef struct _IMAGE_NT_HEADERS64 {
    DWORD Signature;      // PE\0\0 (0x00004550)
    IMAGE_FILE_HEADER FileHeader;   // File header
    IMAGE_OPTIONAL_HEADER64 OptionalHeader; // Optional header
} IMAGE_NT_HEADERS64;

// Section Header
typedef struct _IMAGE_SECTION_HEADER {
    BYTE Name[8];         // .text, .data, .rdata
    ULONG VirtualSize;    // Tamaño en memoria
    ULONG VirtualAddress; // RVA
    ULONG SizeOfRawData;  // Tamaño en disco
    ULONG PointerToRawData; // Offset en archivo
    ULONG PointerToRelocations;
    ULONG PointerToLinenumbers;
    USHORT NumberOfRelocations;
    USHORT NumberOfLinenumbers;
    ULONG Characteristics; // Permisos de seccion
} IMAGE_SECTION_HEADER;
```

### 7.2 Secciones PE Mas Comunes

| Seccion | Contenido | [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) | Caracteristicas |
|---------|-----------|----------|-----------------|
| .text | Codigo ejecutable | Execute/Read | IMAGE_SCN_MEM_EXECUTE |
| .data | Datos globales | Read/Write | IMAGE_SCN_MEM_WRITE |
| .rdata | Constantes, IAT | Read | Solo lectura |
| .pdata | Exception handlers | Read | Solo [x64](../raw/4ss3mbly-f0r-h4ck3rs.md#x64) |
| .idata | Import table | Read | [legacy](../raw/l3g4cy-3nt3rpr1s3.md) (normalmente en .rdata) |
| .edata | Export table | Read | Solo DLLs |
| .reloc | Base relocations | Read | ASLR support |
| .rsrc | Resources | Read | Iconos, dialogos |
| .[tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) | Thread Local Storage | Read/Write | [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) |
| .gfids | Global function [ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips)) | Read | Control flow guard |

### 7.3 [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de Carga de Imagen

```bash
# NtCreateSection -> MmCreateSection
#   -> Crear SECTION object
#   -> Parsear PE header
#   -> Crear segment y subsection
#   -> Mapear secciones con permisos

# NtMapViewOfSection -> MmMapViewOfSection
#   -> Crear VAD entries
#   -> Asignar paginas (validas o prototipos)
#   -> Cargar IAT, imports

# LdrInitializeThunk (user mode)
#   -> Procesar imports (IAT)
#   -> Procesar delays
#   -> Llamar DllMain
#   -> TLS callbacks
```

### 7.4 PE Packing y Detection

```bash
# Detectar PE packeado:
# 1. High entropy en .text
# 2. Solo una seccion con todo
# 3. Import table minima o ausente
# 4. Section names inusuales (UPX0, UPX1, .packed)
# 5. SizeOfRawData ≈ 0 con VirtualSize > 0
# 6. Entropy > 6.5 en .text

# Herramientas:
dumpbin /headers file.exe
pecheck file.exe
exeinfo file.exe
die (Detect It Easy) file.exe
```

### 7.5 Import/Export y API Hooking

```c
// IAT Hooking:
// 1. Encontrar IAT en memoria
// 2. Cambiar el puntero de funcion
// 3. Si es hook de user -> DLL modificada
// 4. Si es hook de kernel -> SSDT hook

// Deteccion de IAT hooks:
// - Comparar IAT in-memory vs on-disk
// - Verificar que apunta dentro de modulos cargados
// - Volatility: apihooks

// Ejemplo Volatility:
// vol -f dump.dmp windows.apihooks
```

### 7.6 Ejercicios Practicos

**Ejercicio 7.1:** Analiza un ejecutable sospechoso con `dumpbin`, `pecheck` y `die`. Identifica: secciones, imports, exports, posibles packing.

**Ejercicio 7.2:** En un memory dump, detecta hooks en la IAT usando Volatility. Documenta que funciones estan hookeadas y por que modulo.

---

## 8. Token y Privilegios

### 8.1 Estructura TOKEN

```c
typedef struct _TOKEN {
    TOKEN_SOURCE TokenSource;              // Fuente del token
    LUID TokenId;                          // ID del token
    LUID AuthenticationId;                 // ID de autenticacion
    LARGE_INTEGER ExpirationTime;          // Expiracion
    PEReserve Erd;
    PLUID ModifiedId;
    SE_TOKEN_TYPE TokenType;               // Primary o Impersonation
    SECURITY_IMPERSONATION_LEVEL ImpersonationLevel;
    TOKEN_STATISTICS Statistics;           // Estadisticas
    PVOID DynamicPart;                     // Dynamic part
    ULONG DefaultDacl;                     // DACL default
    TOKEN_PRIVILEGES Privileges;           // Privilegios
    SECURITY_GROUPS_AND_GROUPS Groups;     // Grupos
    TOKEN_OWNER Owner;                     // Owner
    TOKEN_PRIMARY_GROUP PrimaryGroup;      // Grupo primario
    TOKEN_DEFAULT_DACL DefaultDacl;        // DACL
    TOKEN_USER User;                       // Usuario
    TOKEN_GROUPS RestrictedSids;           // SIDs restringidos
} TOKEN;
```

### 8.2 Privilegios Criticos

| Privilegio | Valor | Descripcion | Uso Malicioso |
|------------|-------|-------------|---------------|
| SeDebugPrivilege | 20 | Debug programs | Inyeccion en procesos |
| SeTcbPrivilege | 7 | Act as part of OS | Escalar a SYSTEM |
| SeTakeOwnershipPrivilege | 9 | Take ownership | Acceder a objetos |
| SeBackupPrivilege | 17 | Backup files | Leer archivos restringidos |
| SeRestorePrivilege | 18 | Restore files | Escribir archivos protegidos |
| SeLoadDriverPrivilege | 10 | Load drivers | Cargar [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) malicioso |
| SeCreateTokenPrivilege | 3 | Create token | Crear token arbitrario |
| SeAssignPrimaryTokenPrivilege | 2 | Assign token | Asignar token a [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) |
| SeIncreaseQuotaPrivilege | 5 | Increase quota | Aumentar quotas |
| SeIncreaseBasePriorityPrivilege | 14 | Increase priority | Prioridad realtime |

```bash
# Ver privilegios de un token
!token <TOKEN_ADDRESS>
!process 0 0  # Muestra token

# Desde user mode
whoami /priv
powershell "Get-Process -Id <PID> | Select-Object -ExpandProperty Privileges"
```

### 8.3 Token Elevation

```c
// UAC y token elevation:
// 1. Usuario logueado obtiene Token filtrado (sin admin rights)
// 2. Al ejecutar "Run as Administrator":
//    - LinkedToken guarda el token completo
//    - Se usa el token elevado (LinkedToken)
// 3. El filtro remueve:
//    - Privilegios administrativos
//    - Grupos admin SIDs

// Estructura del token elevation:
// TOKEN_ELEVATION_TYPE:
// TokenElevationTypeDefault (1) - Sin UAC
// TokenElevationTypeFull (2) - Token completo
// TokenElevationTypeLimited (3) - Token filtrado

// LinkedToken:
// EPROCESS->Token tiene el limited token
// TOKEN->LinkedToken tiene el full token
```

### 8.4 [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing) y Detection

```c
// Tecnica de token stealing:
void StealToken(PEPROCESS Target) {
    PEPROCESS System = PsGetCurrentProcess();
    
    // Copiar Token del proceso SYSTEM
    ExFreePool(System->Token);
    System->Token = Target->Token;
    // Ahora el proceso tiene privilegios de SYSTEM
}

// Deteccion:
// - Token inusual para el proceso (ej: explorer.exe con SYSTEM token)
// - Multiple procesos compartiendo mismo TOKEN
// - Volatility: token_steal_check
```

```bash
# Detectar token stealing:
!process 0 0  # Verificar tokens de procesos

# Volatility
vol -f dump.dmp windows.privileges --pid 1234
```

### 8.5 Ejercicios Practicos

**Ejercicio 8.1:** En un dump, identifica procesos con SeDebugPrivilege habilitado. Documenta si es legitimo para ese proceso.

**Ejercicio 8.2:** Analiza un caso de token stealing: compara el TOKEN de un proceso sospechoso contra el de SYSTEM.

---

## 9. Object Manager

### 9.1 Namespace de Objetos

El Object Manager mantiene un namespace jerarquico:

```
\ (Root)
├── \GLOBAL?? (DOS device names)  -> \??\C:
├── \BaseNamedObjects             -> Eventos, mutexes, semaforos
├── \Device                       -> Dispositivos
│   ├── \Device\HarddiskVolume1
│   ├── \Device\KeyboardClass0
│   └── \Device\Tcpip
├── \Driver                       -> Objetos de drivers
├── \FileSystem                   -> Filesystem recognizers
├── \KnownDlls                    -> DLLs pre-mapeadas
├── \Callback                     -> Callback objects
├── \Nls                          -> NLS tables
├── \ObjectTypes                  -> Tipos de objetos
├── \RPC Control                  -> RPC endpoints
├── \Security                     -> Security objects
├── \Sessions                     -> Session space
├── \Windows                      -> Windows subsystem
└── \KernelObjects                -> Kernel objects
```

### 9.2 Tipos de Objetos

```bash
# Ver tipos de objetos:
!object \ObjectTypes
dt nt!_OBJECT_TYPE

# Tipos principales:
# - Type, Directory, SymbolicLink, Token, Job
# - Process, Thread, File, Device, Driver
# - Event, Mutant, Semaphore, Timer
# - Section, Key, KeyedEvent, Port
# - WaitablePort, Adapter, Controller
# - IoCompletion, FileObject, FilterCommunicationPort
```

### 9.3 HANDLE_TABLE

```c
typedef struct _HANDLE_TABLE {
    ULONG NextHandleNeedingPool;
    LONG HandleCount;
    ULONG TableCode;              // Puntero + nivel de tabla
    PEPROCESS QuotaProcess;       // Proceso responsable
    PVOID HandleTableList;        // Lista de tablas
    ULONG UniqueProcessId;        // PID
} HANDLE_TABLE;
```

```bash
# Ver handles de un proceso
!handle <PID>
!handle 0 <PID>  # Todos los handles

# Objects por handle
!handle <HANDLE_VALUE> <PID>

# Ver handle table
!htrace <PID>

# Deteccion de handle leaks:
# - HandleCount creciendo sin limite
# - HandleValue muy alto
# - Objeto sin close
```

### 9.4 Object Type Structure

```c
typedef struct _OBJECT_TYPE {
    LIST_ENTRY TypeList;              // Lista de tipos
    UNICODE_STRING Name;              // Nombre (ej: "Process")
    ULONG DefaultObject;              // Default non-paged pool size
    ULONG Index;                      // Indice de tipo
    ULONG TotalNumberOfObjects;       // Total de objetos
    ULONG TotalNumberOfHandles;       // Total de handles
    ULONG HighWaterNumberOfObjects;   // Maximo de objetos
    ULONG HighWaterNumberOfHandles;   // Maximo de handles
    OBJECT_TYPE_INITIALIZER TypeInfo; // Callbacks de tipo
    EXPORTED_OBJECT_TYPE ExportedTypeInfo;
    ULONG Key;                        // Pool tag
    OBJECT_TYPE_OBJECT_LOCK ObjectLock;
} OBJECT_TYPE;

typedef struct _OBJECT_TYPE_INITIALIZER {
    USHORT Length;
    BOOLEAN UseDefaultObject;
    BOOLEAN CaseInsensitive;
    BOOLEAN MaintainHandleDatabase;
    BOOLEAN PermanentObject;
    BOOLEAN DefaultPagedPoolCharge;
    BOOLEAN DefaultNonPagedPoolCharge;
    POBJECT_DUMP_PROCEDURE DumpProcedure;    // Dump callback
    POBJECT_OPEN_PROCEDURE OpenProcedure;    // Open callback
    POBJECT_CLOSE_PROCEDURE CloseProcedure;  // Close callback
    POBJECT_DELETE_PROCEDURE DeleteProcedure; // Delete callback
    POBJECT_PARSE_PROCEDURE ParseProcedure;  // Parse callback
    POBJECT_QUERYNAME_PROCEDURE QueryNameProcedure;
} OBJECT_TYPE_INITIALIZER;
```

### 9.5 Ejercicios Practicos

**Ejercicio 9.1:** En WinDbg, explora `\ObjectTypes` y documenta 10 tipos de objetos con su TotalNumberOfObjects y HighWaterNumberOfObjects.

**Ejercicio 9.2:** Lista todos los handles de un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) sospechoso con `!handle <PID>`. Identifica handles inusuales (dispositivos, eventos, secciones).

---

## 10. Registry Internals

### 10.1 Architecture del Registry

El registry de Windows se almacena en hives:

```
Hives del Sistema:
├── SYSTEM (HKLM\SYSTEM)
│   └── %SystemRoot%\System32\config\SYSTEM
├── SOFTWARE (HKLM\SOFTWARE)
│   └── %SystemRoot%\System32\config\SOFTWARE
├── SAM (HKLM\SAM)
│   └── %SystemRoot%\System32\config\SAM
├── SECURITY (HKLM\SECURITY)
│   └── %SystemRoot%\System32\config\SECURITY
├── DEFAULT (HKU\.DEFAULT)
│   └── %SystemRoot%\System32\config\DEFAULT
├── NTUSER.DAT (HKU\<SID>)
│   └── %UserProfile%\NTUSER.DAT
└── USRCLASS.DAT (HKCU\Software\Classes)
    └── %UserProfile%\AppData\Local\Microsoft\Windows\UsrClass.dat
```

### 10.2 Hive Structure

```c
typedef struct _HBASE_BLOCK {
    ULONG Signature;          // "regf"
    ULONG Sequence1;          // Sequence number
    ULONG Sequence2;
    LARGE_INTEGER TimeStamp;  // Ultima modificacion
    ULONG MajorVersion;       // Version mayor
    ULONG MinorVersion;       // Version menor
    ULONG Type;               // Tipo
    ULONG Format;             // Formato
    ULONG RootCell;           // Root cell index
    ULONG Length;             // Tamaño total
    ULONG ClusterFactor;      // Cluster factor
    BYTE FileName[64];        // Nombre de archivo
    BYTE Reserved[404];
    ULONG Checksum;           // Checksum
} HBASE_BLOCK;

// Cell types:
// Hive Cell: Estructura basica
// Key Cell (nk): Nodo de clave
// Value Cell (vk): Valor
// Security Cell (sk): Seguridad
// Subkey List (li, lh, ri): Listas de subclaves
// Value List (lv): Lista de valores
```

### 10.3 Key Cell (nk)

```c
typedef struct _CM_KEY_NODE {
    USHORT Signature;           // "nk"
    USHORT Flags;               // Flags
    LARGE_INTEGER LastWriteTime; // Ultima escritura
    ULONG Spare;
    ULONG Parent;               // Parent cell index
    ULONG SubKeyCounts[2];      // Subkeys count
    ULONG SubKeyLists[2];       // Subkey list cells
    ULONG ValueList;            // Value list cell
    ULONG ValueListCount;       // Cantidad de valores
    ULONG SecurityCell;         // Security cell
    ULONG ClassCell;            // Class cell
    ULONG Flags2;
    UNICODE_STRING Name;        // Nombre de la clave
} CM_KEY_NODE;
```

### 10.4 Value Cell (vk)

```c
typedef struct _CM_KEY_VALUE {
    USHORT Signature;           // "vk"
    USHORT NameLength;          // Longitud del nombre
    ULONG DataLength;           // Longitud del dato
    ULONG Data;                 // Offset del dato o inline
    ULONG Type;                 // Tipo (REG_SZ, REG_DWORD, etc.)
    USHORT Flags;
    USHORT Spare;
    UNICODE_STRING Name;        // Nombre
} CM_KEY_VALUE;
```

### 10.5 Tipos de Datos del Registry

| Tipo | Valor | Descripcion |
|------|-------|-------------|
| REG_NONE | 0 | Sin tipo |
| REG_SZ | 1 | String |
| REG_EXPAND_SZ | 2 | String expandible (%PATH%) |
| REG_BINARY | 3 | Binario |
| REG_DWORD | 4 | Entero 32-bit |
| REG_DWORD_BIG_ENDIAN | 5 | DWORD big endian |
| REG_LINK | 6 | Symbolic link |
| REG_MULTI_SZ | 7 | Multi-string |
| REG_RESOURCE_LIST | 8 | Resource list |
| REG_FULL_RESOURCE_DESCRIPTOR | 9 | Full resource |
| REG_RESOURCE_REQUIREMENTS_LIST | 10 | Resource requirements |
| REG_QWORD | 11 | Entero 64-bit |

### 10.6 Registry as Evidence

```bash
# Forensica de Registry:

# 1. Ultima hora de apagado:
# SYSTEM\CurrentControlSet\Control\Windows\ShutdownTime

# 2. Programas ejecutados (UserAssist):
# NTUSER.DAT\Software\Microsoft\Windows\CurrentVersion\Explorer\UserAssist

# 3. USB devices:
# SYSTEM\CurrentControlSet\Enum\USBSTOR

# 4. Network interfaces:
# SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces

# 5. Servicios instalados:
# SYSTEM\CurrentControlSet\Services

# 6. Software installed:
# SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall

# 7. MRU (Most Recently Used):
# NTUSER.DAT\Software\Microsoft\Windows\CurrentVersion\Explorer\RecentDocs

# 8. Typed URLs:
# NTUSER.DAT\Software\Microsoft\Internet Explorer\TypedURLs
```

```bash
# Herramientas de analisis de registry:
reg export HKLM\SYSTEM system.reg
reg save HKLM\SAM SAM.hive
python3 -c "import Registry; Registry.parse('SAM.hive')"

# Registry Viewer:
regedit.exe
RECmd.exe (Eric Zimmerman)
Registry Explorer (Eric Zimmerman)
```
### 10.7 CmRegisterCallback

```c
// Monitoreo de registry via callback:
NTSTATUS CmRegisterCallback(
    PEX_CALLBACK_FUNCTION Function,
    PVOID Context,
    PLARGE_INTEGER Cookie
);

// Tipos de notificacion:
// RegNtPreDeleteKey
// RegNtPreSetValueKey
// RegNtPreCreateKey
// RegNtPostOpenKey
// RegNtPreRenameKey

// Malware usa callbacks para ocultar keys:
// -> Interceptar RegNtPreEnumKey
// -> Omitir keys especificas
```

### 10.8 Ejercicios Practicos

**Ejercicio 10.1:** Extrae los hives SYSTEM, SOFTWARE, SAM y NTUSER.DAT de un sistema Windows. Analiza: USBSTOR, servicios, software instalado, UserAssist.

**Ejercicio 10.2:** Busca en NTUSER.DAT las URLs escritas en el explorador y los documentos recientes (RecentDocs). Construye una linea de tiempo de actividad del usuario.

---

## 11. System Calls y SSDT

### 11.1 SSDT (System Service Descriptor Table)

```bash
# Ver SSDT:
dqs nt!KeServiceDescriptorTable
!syscall <INDEX>

# Estructura:
# KeServiceDescriptorTable:
# +0x000 ServiceTable     : Puntero a tabla de servicios
# +0x008 CounterTable      : Contadores
# +0x010 ServiceLimit      : Numero de servicios
# +0x018 ArgumentTable     : Tabla de argumentos (numero de bytes)
```

### 11.2 System Call Flow

```asm
; User mode call:
mov r10, rcx           ; Save return address
mov eax, SSDT_INDEX    ; System call number
syscall                 ; Transition to kernel
; ... returns from kernel

; Kernel mode dispatch:
; KiSystemService -> KiSystemServiceHandler
;   1. Obtener SSDT base
;   2. Validar SSDT_INDEX (0 <= index < ServiceLimit)
;   3. Despachar: ServiceTable[index](args)
;   4. Retornar a user mode via sysret

; SSDT Hooking:
; Cambiar ServiceTable[index] por funcion propia
; HookedFunction -> OriginalFunction (para pasar la llamada)
```

### 11.3 SSDT Shadow (win32k.sys)

```bash
# win32k.sys tiene su propia SSDT shadow:
# KeServiceDescriptorTableShadow
# Contiene servicios de GUI (NtUser*, NtGdi*)
# Solo accesible desde threads GUI

# Ver shadow SSDT:
!syscalls 1
```

### 11.4 SSDT Hooking Detection

```c
// Deteccion de hooks en SSDT:
// 1. Comparar ServiceTable[] contra direcciones validas de ntoskrnl
// 2. Verificar que apuntan dentro de .text de ntoskrnl.exe
// 3. Si apuntan a otro modulo, probablemente hook

// WinDbg:
!syscalls 0  // Listar todos los syscalls
lm           // Listar modulos
```

```bash
# Volatility:
vol -f dump.dmp windows.ssdt
```

### 11.5 Ejercicios Practicos

**Ejercicio 11.1:** Enumera la SSDT completa con `!syscalls 0` en WinDbg. Documenta 10 servicios interesantes (NtCreateProcess, NtOpenProcess, NtReadVirtualMemory, etc.).

**Ejercicio 11.2:** Detecta hooks en la SSDT comparando las direcciones contra la base de ntoskrnl.exe.

---

## 12. APC, DPC e Interrupciones

### 12.1 APC (Asynchronous Procedure Calls)

```c
typedef struct _KAPC {
    CSHORT Type;                         // APC Type
    CSHORT Size;
    ULONG Spare0;
    struct _KTHREAD *Thread;            // Thread target
    LIST_ENTRY ApcListEntry;            // Lista de APCs
    PKKERNEL_ROUTINE KernelRoutine;     // Kernel callback
    PKRUNDOWN_ROUTINE RundownRoutine;   // Rundown callback
    PKNORMAL_ROUTINE NormalRoutine;     // Normal callback
    PVOID NormalContext;                // Context
    PVOID SystemArgument1;             // Argumento 1
    PVOID SystemArgument2;             // Argumento 2
    KAPC_ENVIRONMENT ApcStateIndex;     // Current APC state
    UCHAR ApcMode;                     // KernelMode o UserMode
    BOOLEAN Inserted;                   // En lista?
} KAPC;
```

```c
// Tipos de APC:
// 1. Kernel APC: Siempre se ejecuta en kernel mode
// 2. User APC: Se ejecuta en user mode (AlertableWait)
// 3. Special APC: Alta prioridad (ISR/DPC safe)

// APC Injection (tecnica maliciosa):
// 1. QueueUserAPC a thread remoto
// 2. Thread debe entrar en alertable state
// 3. APC se ejecuta en contexto del thread target
// 4. Evita CreateRemoteThread detection

// Deteccion de APC injection:
// - APCQueueList de threads sospechosos
// - Volatility: apcscan
```

### 12.2 DPC (Deferred Procedure Calls)

```c
typedef struct _KDPC {
    CSHORT Type;              // DPC Type
    CSHORT Importance;        // Importancia
    volatile LIST_ENTRY DpcListEntry;  // En lista?
    PKDEFERRED_ROUTINE DeferredRoutine; // Deferred callback
    PVOID DeferredContext;    // Contexto
    PVOID SystemArgument1;
    PVOID SystemArgument2;
    PVOID Lock;
} KDPC;
```

```bash
# DPCs se ejecutan en DISPATCH_LEVEL (IRQL 2)
# No pueden: page fault, esperar objetos, tocar paginated pool
# Usados por drivers para completar IO

# Ver DPCs:
!dpcs
!timer
```

### 12.3 Interrupt Handling

```bash
# IRQL Levels en Windows x64:
# 31: HIGH_LEVEL (power, inter-processor)
# 30: POWER_LEVEL
# 29: IPI_LEVEL (inter-processor interrupt)
# 28: CLOCK_LEVEL (clock interrupt)
# 27: PROFILE_LEVEL (profile)
# 26: PRIMARY_VECTOR_BASE
# 3-25: DIRQL (device IRQL)
# 2: DISPATCH_LEVEL (DPC level)
# 1: APC_LEVEL
# 0: PASSIVE_LEVEL (normal)

# Ver IDT:
!idt
```

### 12.4 Ejercicios Practicos

**Ejercicio 12.1:** En un dump, identifica APCs pendientes con `!apc`. Verifica si hay APCs inyectados en threads de procesos de usuario.

**Ejercicio 12.2:** Usa Volatility `apcscan` para detectar posible APC injection en un memory dump.

---

## 13. IO Manager y IRP

### 13.1 IRP (I/O Request Packet)

```c
typedef struct _IRP {
    CSHORT Type;                 // IO_TYPE_IRP
    USHORT Size;                 // Tamaño
    ULONG Flags;                 // Flags
    PVOID AssociatedIrp;        // Irp asociado (master/slave)
    LIST_ENTRY ThreadListEntry; // Thread list
    PVOID UserIosb;             // IO Status Block
    PVOID UserEvent;            // Evento de user mode
    PVOID UserApcRoutine;       // APC routine de user
    PVOID UserApcContext;       // APC context
    IO_STATUS_BLOCK IoStatus;   // Status de IO
    KEVENT CancelEvent;         // Cancel event
    PVOID CancelRoutine;        // Cancel routine
    PVOID StackLocations;       // IO_STACK_LOCATIONs
    USHORT RequestorMode;       // Modo del requestor
    SCHAR PendingReturned;      // Pending flag
    UCHAR Cancel;               // Cancel flag
    PVOID Tail;                 // Tail section
} IRP;
```

### 13.2 Device Stack

```bash
# Jerarquia de drivers para un dispositivo:

# 1. File System Driver (ntfs.sys)
# 2. Volume Manager (volmgrx.sys)
# 3. Partition Manager (partmgr.sys)
# 4. Class Driver (disk.sys)
# 5. Port Driver (storport.sys)
# 6. Miniport Driver (per fabricante)
# 7. Actual hardware

# Ver device stack:
!devstack <DEVICE_OBJECT>
!devnode 0 1

# Drivers en cadena:
lm km
```

### 13.3 IO_STACK_LOCATION

```c
typedef struct _IO_STACK_LOCATION {
    UCHAR MajorFunction;           // IRP_MJ_*
    UCHAR MinorFunction;           // IRP_MN_*
    UCHAR Flags;
    UCHAR Control;
    union {
        // Parametros especificos por funcion
        struct { PARAMETERS Read; };
        struct { PARAMETERS Write; };
        struct { PARAMETERS DeviceIoControl; };
        // ...
    };
    PDEVICE_OBJECT DeviceObject;   // Device target
    PFILE_OBJECT FileObject;       // File object
} IO_STACK_LOCATION;

// Major functions comunes:
// IRP_MJ_CREATE (0) - Crear/Abrir
// IRP_MJ_CLOSE (2) - Cerrar
// IRP_MJ_READ (3) - Leer
// IRP_MJ_WRITE (4) - Escribir
// IRP_MJ_DEVICE_CONTROL (14) - IOCTL
```

### 13.4 IOCTL y Comunicacion con Drivers

```c
// User mode -> Driver communication:
// DeviceIoControl -> NtDeviceIoControlFile -> IRP_MJ_DEVICE_CONTROL

// IOCTL codes:
// CTL_CODE(DeviceType, Function, Method, Access)

// Methods:
// METHOD_BUFFERED (0)   - System buffer
// METHOD_IN_DIRECT (1)  - Input direct
// METHOD_OUT_DIRECT (2) - Output direct
// METHOD_NEITHER (3)     - User buffer

// Ejemplo:
#define IOCTL_TEST CTL_CODE(FILE_DEVICE_UNKNOWN, 0x800, METHOD_BUFFERED, FILE_ANY_ACCESS)

// Driver debe validar:
// 1. InputBufferLength >= esperado
// 2. OutputBuffer >= esperado
// 3. IOCTL code valido (evitar fuzzing)
```

### 13.5 Ejercicios Practicos

**Ejercicio 13.1:** Lista los device stacks en un sistema con `!devstack`. Identifica el [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) de disco y su cadena completa.

**Ejercicio 13.2:** Analiza IRPs pendientes en un dump con `!irpfind`. Detecta posibles IOCTL maliciosos hacia drivers.

---

## 14. Cache Manager y Memory Manager

### 14.1 Cache Manager

```bash
# System Cache:
# Memoria virtual para cache de archivos
# Mapea archivos en kernel address space
# Maneja: read-ahead, write-behind, lazy write

# Ver cache:
!filecache
!poolused 2  # Buscar tag "MmCa"
```

### 14.2 Memory Manager Structures

```bash
# Working Set (WS):
# Paginas de un proceso actualmente en memoria fisica
# Gestionado por balance set manager (cada ~1 seg)

# Modified Page Writer:
# Page de modified list -> written to disk
# Dos threads: MiModifiedPageWriter, MiMappedPageWriter

# Page Fault:
# Si PTE.Valid == 0 -> page fault
# Tipos:
# - Page fault valido: pagina en standby/modified list
# - Page fault invalido: pagina en disco
# - Page fault de transicion
# - Page fault de prototipo (shared pages)
```

### 14.3 Pool Quotas

```c
typedef struct _POOL_QUOTA_LIMITS {
    SIZE_T PagedPoolLimit;          // Maximo paged pool
    SIZE_T NonPagedPoolLimit;       // Maximo non-paged pool
    SIZE_T PeakPagedPool;           // Peak paged
    SIZE_T PeakNonPagedPool;        // Peak non-paged
    SIZE_T PagedPoolUsage;          // Current paged
    SIZE_T NonPagedPoolUsage;       // Current non-paged
} POOL_QUOTA_LIMITS;
```

### 14.4 Ejercicios Practicos

**Ejercicio 14.1:** Usa `!filecache` para ver el cache de archivos. Identifica archivos con grandes cantidades de datos cacheados.

**Ejercicio 14.2:** Analiza page faults en un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) con `!process <PID> 7` y determina que paginas estan causando faults.

---

## 15. Ejercicios Practicos

### Ejercicio 15.1: Analisis de EPROCESS

Usa WinDbg en un memory dump para:
1. Encontrar PsActiveProcessHead: `dqs nt!PsActiveProcessHead`
2. Recorrer ActiveProcessLinks manualmente
3. Para cada EPROCESS, extraer: PID, ImageFileName, CreateTime, ExitTime, Token
4. Identificar procesos con privilegios elevados

### Ejercicio 15.2: Pool Scanning

1. Usa `!poolused 2` para listar tags de pool
2. Busca objetos Process (tag "Proc") con `!poolfind Proc`
3. Identifica procesos ocultos (no en PsActiveProcessHead pero con pool tag)

### Ejercicio 15.3: SSDT Analysis

1. Dump de SSDT con `!syscalls 0`
2. Verificar que todos los servicios apuntan dentro de ntoskrnl.exe
3. Si hay direcciones fuera de ntoskrnl, identificar posibles hooks

### Ejercicio 15.4: Token Privileges Audit

1. Para cada [proceso](../raw/0s-f0nd4m3nt0s.md#procesos), extraer el token
2. Listar privilegios habilitados
3. Identificar procesos con SeDebugPrivilege innecesario
4. Detectar [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing) (mismo token en procesos distintos)

### Ejercicio 15.5: Keyboard [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) IRP Analysis

1. Encontrar driver de teclado: `!object \Device\KeyboardClass0`
2. Listar driver stack
3. Analizar IRPs pendientes con `!irpfind`
4. Identificar posibles keyboard loggers

---

## 16. Referencias

### Libros
- [windows internals](../raw/w1n-1nt3rn4ls.md) (Part 1 & 2) - Pavel Yosifovich, Alex Ionescu
- Practical Reverse Engineering - Bruce Dang
- The Rootkit Arsenal - Bill Blunden
- Malware Analysis & Detection Engineering - Abhijit Mohanta

### Herramientas
- WinDbg: Debugging de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) y dumps
- Volatility 3: Analisis de memory dumps
- Process Explorer: Ver EPROCESS en vivo
- WinObj: Object Manager namespace browser
- LiveKD: WinDbg en sistema vivo
- PYKD: [python](../raw/pyth0n-f0r-h4ck1ng.md) extension for WinDbg

### Comandos Utiles
```bash
# WinDbg Kernel Debugging
.sympath srv*C:\Symbols*https://msdl.microsoft.com/download/symbols
.reload
!process 0 0
!syscalls 0
!poolused 2
!vad 0
!handle 0 ffffa00012345678
dt nt!_EPROCESS

# Volatility 3
vol -f memory.dmp windows.psscan
vol -f memory.dmp windows.ssdt
vol -f memory.dmp windows.modules
vol -f memory.dmp windows.pool --tag Proc
vol -f memory.dmp windows.registry.hives
```

## 17. [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de Creacion de Procesos

### 17.1 NtCreateUserProcess

```c
// Syscall flow: CreateProcess -> kernel32!CreateProcessInternalW
//   -> ntdll!NtCreateUserProcess (syscall)
// PASOS:
// 1. PspAllocProcess: asignar EPROCESS + KPROCESS
// 2. PspInitProcessToken: asignar y verificar token
// 3. MmInitProcessAddressSpace: crear espacio de direcciones
// 4. PspInsertProcess: insertar en lista global
// 5. LdrInitThunk: cargar PE en memoria
// 6. PspUserThreadStart: crear thread principal
```

### 17.2 [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) Callbacks de Procesos

```c
NTSTATUS PsSetCreateProcessNotifyRoutine(
    PCREATE_PROCESS_NOTIFY_ROUTINE Notify,
    BOOLEAN Add
);

VOID ProcessCreateCallback(
    HANDLE ParentId, HANDLE ProcessId, BOOLEAN Create
) {
    if (Create) {
        LogEvent("Process created", ProcessId, ParentId);
        if (IsMaliciousProcess(ProcessId)) {
            TerminateProcess(ProcessId);
        }
    }
}
```

## 18. Minifilter Drivers

### 18.1 Arquitectura Filter Manager

Los minifilters drivers permiten interceptar operaciones de I/O:

```c
NTSTATUS FltRegisterFilter(
    PDRIVER_OBJECT Driver,
    PFLT_REGISTRATION Registration,
    PFLT_FILTER *RetFilter
);

// Altitudes de carga:
// 420000: File system (NTFS)
// 360000: Encryption
// 320000: Security enhancers
// 280000: Anti-virus
// 240000: Backup
// 20000: Replication
```

### 18.2 Pre/Post Operation Callbacks

```c
FLT_PREOP_CALLBACK_STATUS MinifilterPreRead(
    PFLT_CALLBACK_DATA Data,
    PCFLT_RELATED_OBJECTS FltObjects,
    PVOID *CompletionContext
) {
    PFLT_IO_PARAMETER_BLOCK Iopb = Data->Iopb;
    UNICODE_STRING fileName = FltObjects->FileObject->FileName;
    
    if (IsProtectedFile(fileName)) {
        Data->IoStatus.Status = STATUS_ACCESS_DENIED;
        return FLT_PREOP_COMPLETE;
    }
    return FLT_PREOP_SUCCESS_WITH_CALLBACK;
}
```

## 19. Network Drivers (NDIS y WFP)

### 19.1 NDIS Architecture

```bash
# Capas NDIS:
# 1. Protocol Driver (TCP/IP)
# 2. NDIS Library
# 3. Intermediate Driver (filtro)
# 4. Miniport Driver (hardware)

# Registro: NdisSendNetBufferLists
#  -> Intermediate filter -> Miniport -> Hardware
```

### 19.2 WFP (Windows Filtering Platform)

```c
// WFP callout para filtrar paquetes
NTSTATUS FwpsCalloutRegister(
    void *DeviceObject,
    FWPS_CALLOUT Callout,
    UINT32 *CalloutId
);

VOID ClassifyCallback(
    const FWPS_INCOMING_VALUES *inFixedValues,
    const FWPS_INCOMING_METADATA_VALUES *inMetaValues,
    void *layerData,
    const void *classifyContext,
    FWPS_FILTER *filter,
    UINT64 flowContext,
    FWPS_CLASSIFY_OUT *classifyOut
) {
    // FWP_ACTION_PERMIT, FWP_ACTION_BLOCK
}
```

## 20. WSL (Windows Subsystem for Linux)

### 20.1 WSL2 Architecture

```bash
# WSL2 usa VM con kernel Linux real
# Componentes:
# - VM: kernel Linux
# - VMMem: memoria gestionada por Hyper-V
# - 9P: filesystem compartido
# - WSLG: GPU forwarding

# Comandos:
wsl --status
wsl --list --verbose
wsl --shutdown

# Filesystem acceso:
# Desde Windows: \\wsl.localhost\Ubuntu\home\user\
# Desde Linux: /mnt/c/Users/user/
```

### 20.2 Ejercicios de Integracion

**Ejercicio 20.1:** Escribe un minifilter [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) que registre todos los accesos a archivos .docx en el sistema.

**Ejercicio 20.2:** Usa WinDbg para depurar un minifilter: break en `FltpPerformPreCallbacks` y analiza la pila de callbacks.

**Ejercicio 20.3:** Configura WFP para bloquear trafico saliente a una [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) especifica usando un callout driver.

## 21. [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de Boot de Windows

### 21.1 Fases de Boot

```bash
# Windows Boot Process:
# 1. Power On -> UEFI/BIOS POST
# 2. UEFI Firmware -> Secure Boot check
# 3. Bootloader: bootmgfw.efi (Windows Boot Manager)
# 4. bootmgr -> winload.exe (OS Loader)
# 5. ntoskrnl.exe (Kernel) -> HAL -> Drivers
# 6. Session Manager (smss.exe)
# 7. Winlogon (winlogon.exe)
# 8. Service Control Manager (services.exe)
# 9. LSASS (lsass.exe) - Authentication
# 10. Explorer.exe (Shell)

# Secure Boot chain (UEFI):
# UEFI Firmware → Bootloader → OS Kernel → Drivers
# Cada etapa verifica firma de la siguiente
```

### 21.2 Boot Configuration Data (BCD)

```bash
# BCD store contiene configuracion de boot
# Ubicacion: \EFI\Microsoft\Boot\BCD (ESP)
# Formato: registry hive

# Comandos:
bcdedit /enum
bcdedit /enum all
bcdedit /enum {current}
bcdedit /ems

# Opciones de boot:
# /DEBUG: Debug mode
# /SOS: Display driver loads
# /BREAK: Break at boot
# /NOGUIBOOT: No GUI boot
# /BOOTLOG: Boot log
# /BASEVIDEO: VGA mode
# /SAFEBOOT: Safe mode
```

### 21.3 [bootkit](../raw/u3f1-r00tk1ts.md#bootkits) Detection Points

```c
// Puntos de deteccion de bootkits:
// 1. UEFI Firmware: CHIPSEC scan
// 2. Bootloader: verificar firma de bootmgfw.efi
// 3. winload.exe: verificar integridad
// 4. ntoskrnl.exe: verificar hash en memoria
// 5. Boot drivers: listar y verificar todos

// Deteccion en memoria:
// boot_verify.exe - Verificar cadena de boot
// !process 0 0 - Buscar procesos inusuales tempranos
```

## 22. Windows Defender [exploit](../raw/m3t4spl01t.md#exploits) Guard

### 22.1 Componentes

```bash
# 1. Attack Surface Reduction (ASR)
# Reglas que bloquean comportamientos comunes de malware:
Set-MpPreference -AttackSurfaceReductionRules_Ids <GUID> -AttackSurfaceReductionRules_Actions Enabled

# ASR Reglas importantes:
# 75668c1f-73b5-4cf0-bb93-3ecf5cb7cc84: Bloquear Office creando procesos hijo
# 3b576869-a4ec-4529-8536-b80a7769e899: Bloquear descargas desde Office
# d4f940ab-401b-4efc-aadc-ad5f3c50688a: Bloquear ejecucion de JS/VBS
# 92e97fa1-2edf-4476-bdd6-9dd0b4dddc7b: Bloquear credenciales de LSASS

# 2. Controlled Folder Access
Set-MpPreference -EnableControlledFolderAccess Enabled
Add-MpPreference -ControlledFolderAccessProtectedFolders "C:\Users\*\Documents"

# 3. Network Protection
Set-MpPreference -EnableNetworkProtection Enabled

# 4. Exploit Protection
# Config en: Settings > Update & Security > Windows Security > App & browser control
```

## 23. Hyper-V Internals

### 23.1 Hyper-V Architecture

```bash
# Hyper-V es un hypervisor tipo 1 (bare-metal)
# Componentes:
# 1. Hyper-V Hypervisor (hvix64.exe)
# 2. Windows Partition (root partition)
# 3. Child Partitions (VMs)
# 4. VMBus (comunicacion inter-partition)
# 5. Virtualization Service Provider (VSP)
# 6. Virtualization Service Client (VSC)

# Memory isolation:
# - SLAT (Second Level Address Translation)
# - EPT (Extended Page Tables) en Intel
# - NPT (Nested Page Tables) en AMD

# Comandos:
Get-VM
Get-VMNetworkAdapter
Get-VMHardDiskDrive
Get-VMProcessor
```

### 23.2 Hyper-V Security

```c
// Hyper-V Security Features:
// 1. Secure Boot for VMs (UEFI + GPT)
// 2. Shielded VMs (BitLocker encrypted)
// 3. Host Guardian Service (attestation)
// 4. VMConnect (enhanced session mode)
// 5. Virtual TPM (vTPM 2.0)

// VM Escape Detection:
// - Hyper-V enforces isolation via VMBus
// - VMs cannot access host memory directly
// - All I/O goes through VSP/VSC
// - Vulnerabilities: CVE-2018-0891, CVE-2019-0721
```

## 24. Ejercicios de Integracion

### 24.1 Laboratorio de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) Debugging

```bash
# Configurar kernel debugging:
# Host: WinDbg
# Target: VM con Windows (serial pipe)
bcdedit /debug on
bcdedit /dbgsettings serial debugport:1 baudrate:115200

# Conectar WinDbg:
# File -> Kernel Debug -> COM -> Port: \\.\pipe\com_1

# Comandos de debugging avanzados:
# Analizar estructura de procesos
dt nt!_EPROCESS
!process 0 0

# Analizar memoria
!vm
!memusage
!poolused 2

# Kernel objects
!object \ObjectTypes
!handle 0 ffffa00012345678

# Thread analysis
!thread
!pcr
!running
```

### 24.2 Ejercicios con WinDbg

**Ejercicio 24.1:** En un memory dump, recorre la lista de procesos usando PsActiveProcessHead manualmente con WinDbg.

**Ejercicio 24.2:** Encuentra modulos del kernel cargados y determina si hay modulos no firmados.

**Ejercicio 24.3:** Analiza la pila de llamadas de un thread sospechoso usando `k` y `kb`.

**Ejercicio 24.4:** Detecta hooks en la SSDT comparando direcciones contra la base de ntoskrnl.

**Ejercicio 24.5:** Encuentra un pool tag especifico y traza su origen hasta el [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) responsable.

**Ejercicio 24.6:** Analiza un device stack completo para un dispositivo de almacenamiento.

**Ejercicio 24.7:** Configura un laboratorio de debugging kernel entre dos maquinas virtuales.
```

