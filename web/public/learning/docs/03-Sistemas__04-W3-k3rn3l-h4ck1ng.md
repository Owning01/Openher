# k3rn3l-h4ck1ng -- Kernel Exploitation y BYOVD

---
## Indice

> ⏱️ **Tiempo estimado:** 35 horas (~7 sesiones) (4548 lineas)

1.[Basics](#1) 2.[BYOVD](#2) 3.[Arb RW](#3) 4.[Token Steal](#4) 5.[DKOM](#5) 6.[Shellcode](#6) 7.[DSE Bypass](#7) 8.[Pool Exp](#8) 9.[UAF](#9) 10.[Tools](#10)
---


## 1. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).



## 21. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 22. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 23. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 24. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 25. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 26. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 27. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 28. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 29. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 30. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 31. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 32. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 33. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 34. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 35. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 36. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 37. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 38. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 39. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 40. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 41. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 42. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 43. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 44. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 45. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 46. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 47. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 48. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 49. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 50. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 51. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 52. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 53. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 54. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).


## 55. Tecnica de Explotacion de [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

Kernel exploitation en Windows. Ring 0 vs Ring 3. Vulnerabilidades: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), use-after-free, pool overflow, integer overflow, race conditions, arbitrary write, arbitrary read, NULL pointer dereference, uninitialized memory.

### BYOVD (Bring Your Own Vulnerable [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers))

BYOVD consiste en cargar un driver firmado pero vulnerable para obtener acceso al kernel desde user mode. Pasos: 1) Encontrar driver firmado con vuln conocida. 2) Cargar el driver via servicio. 3) Enviar IOCTL malicioso. 4) Explotar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades). 5) Escalar privilegios.

```c
HANDLE hDevice = CreateFile("\\\\.\\VulnerableDev", GENERIC_READ|GENERIC_WRITE,
    0, NULL, OPEN_EXISTING, 0, NULL);
DWORD bytesReturned;
DeviceIoControl(hDevice, IOCTL_VULNERABLE, input, size, output, outSize,
    &bytesReturned, NULL);
```

Drivers vulnerables conocidos: gdrv.sys (Gigabyte), aswrgb.sys (Avast), rzpnk.sys (Razer), iqvw64e.sys (Intel), nvoclock.sys (NVIDIA), amdfendrv.sys (AMD), ene.sys (ENE), asusgio2.sys (ASUS), dbutil_2_3.sys (Dell), cpuz.sys (CPU-Z).

### [token stealing](../raw/k3rn3l-h4ck1ng.md#token-stealing)

Tecnica clasica: reemplazar el TOKEN del EPROCESS actual con el de SYSTEM.
EPROCESS->Token offset debe ser determinado para la version de Windows.
PsInitialSystemProcess contiene EPROCESS de SYSTEM (PID 4).

### Tecnica de Kernel Exploitation 1

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: [desbordamiento de buffer](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow) en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de [puntero](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#punteros) NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**[dkom](../raw/k3rn3l-h4ck1ng.md#dkom) (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /[set](../raw/ph1sh1ng.md#social-engineering-toolkit) testsigning on
2. DSE [exploit](../raw/m3t4spl01t.md#exploits): Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL [fuzzer](../raw/fuzz1ng.md#fuzzer), IDA Pro, Volatility


### Tecnica de Kernel Exploitation 2

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 3

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 4

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 5

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 6

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 7

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 8

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 9

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 10

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 11

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 12

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 13

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 14

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 15

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 16

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 17

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 18

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 19

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 20

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 21

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 22

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 23

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 24

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 25

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 26

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 27

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 28

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 29

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 30

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 31

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 32

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 33

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 34

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 35

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 36

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 37

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 38

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 39

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 40

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 41

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 42

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 43

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 44

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 45

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 46

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 47

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 48

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 49

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 50

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 51

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 52

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 53

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 54

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 55

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 56

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 57

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 58

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 59

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 60

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 61

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 62

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 63

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 64

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


### Tecnica de Kernel Exploitation 65

**Vulnerabilidades de Kernel:**

Las vulnerabilidades de kernel en Windows incluyen:
1. Buffer Overflow: Desbordamiento de buffer en IOCTL handler
2. Pool Overflow: Desbordamiento en asignacion de pool
3. Use-After-Free: Uso de memoria liberada
4. Integer Overflow: Desbordamiento aritmetico en calculo de tamano
5. Race Condition: Condicion de carrera TOCTOU
6. Arbitrary Write: Escritura arbitraria via IOCTL
7. Arbitrary Read: Lectura arbitraria via IOCTL
8. NULL Pointer Dereference: Desreferencia de puntero NULL
9. Uninitialized Memory: Uso de memoria no inicializada
10. Type Confusion: Confusion de tipos

**BYOVD (Bring Your Own Vulnerable Driver):**

BYOVD carga un driver firmado pero vulnerable para obtener acceso al kernel.
Pasos: 1) Identificar driver firmado con vulnerabilidad conocida.
2) Cargar el driver: sc create vulndrv binPath= C:\drivers\vuln.sys type= kernel
3) Iniciar: sc start vulndrv
4) Obtener handle: CreateFile(\\.\VulnDev, ...)
5) Enviar IOCTL: DeviceIoControl(hDevice, IOCTL_CODE, ...)
6) Escalar privilegios via token stealing

**Token Stealing:**

Tecnica: reemplazar EPROCESS->Token con token de SYSTEM.
Offsets varian entre versiones de Windows.
PsInitialSystemProcess apunta a EPROCESS de SYSTEM (PID 4).

**DKOM (Direct Kernel Object Manipulation):**

Modificar estructuras del kernel para ocultar procesos, drivers, puertos.
Tecnicas: romper ActiveProcessLinks, remover de PsLoadedModuleList,
modificar TOKEN, modificar handle table.

**DSE Bypass:**

Driver Signature Enforcement bypasses:
1. testsigning mode: bcdedit /set testsigning on
2. DSE exploit: Parchear CiInitialize
3. Vulnerable signed driver: BYOVD
4. Kernel debug: WinDbg para deshabilitar DSE
5. Physical memory access: Leer/escribir /dev/mem

**Pool Exploitation:**

Pool overflow: sobreescribir POOL_HEADER del siguiente bloque.
Modificar PoolTag, PreviousSize, PoolIndex.
Causar corrupcion en free list.

**Herramientas:** WinDbg, DriverBuddy, IOCTL fuzzer, IDA Pro, Volatility


