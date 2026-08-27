# Hacking Aeroespacial y Satelites

## Índice

> ⏱️ **Tiempo estimado:** 25 horas (~5 sesiones) (4257 lineas)

- [Introducción al Hacking Espacial](#introduccion-al-hacking-espacial)
  - [Que es el hacking aeroespacial](#que-es-el-hacking-aeroespacial)
  - [Modelo de amenaza en el espacio](#modelo-de-amenaza-en-el-espacio)
  - [Satelites como objetivos](#satelites-como-objetivos)
  - [Regulaciones y etica](#regulaciones-y-etica)
  - [Historia del hacking satelital](#historia-del-hacking-satelital)

- [Comunicaciones Satelitales](#comunicaciones-satelitales)
  - [Bandas L, S, C, X, Ku, Ka](#bandas-l-s-c-x-ku-ka)
  - [Orbitas: LEO, MEO, GEO, HEO](#orbitas-leo-meo-geo-heo)
  - [Asignacion de transpondedores](#asignacion-de-transpondedores)
  - [Modulacion y codificacion](#modulacion-y-codificacion)
  - [Presupuesto de enlace](#presupuesto-de-enlace)
  - [Interferencias RF](#interferencias-rf)
  - [Ejercicio: calculo de link budget](#ejercicio-calculo-de-link-budget)

- [Protocolo CCSDS](#protocolo-ccsds)
  - [Telemetria y Telecomando](#telemetria-y-telecomando)
  - [Estructura de paquetes espaciales](#estructura-de-paquetes-espaciales)
  - [Space Packet Protocol](#space-packet-protocol)
  - [COP-1: Communications Operation Procedure](#cop-1-communications-operation-procedure)
  - [CFDP: CCSDS File Delivery Protocol](#cfdp-ccsds-file-delivery-protocol)
  - [Seguridad en CCSDS](#seguridad-en-ccsds)
  - [Ejercicio: decodificar trama CCSDS](#ejercicio-decodificar-trama-ccsds)

- [Explotacion de Estaciones Terrenas](#explotacion-de-estaciones-terrenas)
  - [Sistemas de control de antenas](#sistemas-de-control-de-antenas)
  - [Software de tracking](#software-de-tracking)
  - [Vulnerabilidades en command uplink](#vulnerabilidades-en-command-uplink)
  - [Autenticacion satelital](#autenticacion-satelital)
  - [SATCOM eavesdropping](#satcom-eavesdropping)
  - [Ejercicio: analisis de estacion terrena](#ejercicio-analisis-de-estacion-terrena)

- [GNSS Spoofing y Jamming](#gnss-spoofing-y-jamming)
  - [Estructura de senal GPS](#estructura-de-senal-gps)
  - [Codigo C/A y P(Y)](#codigo-ca-y-py)
  - [Civil vs militar](#civil-vs-militar)
  - [Spoofing: tecnicas y defensas](#spoofing-tecnicas-y-defensas)
  - [Jamming de GNSS](#jamming-de-gnss)
  - [Anti-spoofing: autenticacion](#anti-spoofing-autenticacion)
  - [RAIM: Receiver Autonomous Integrity Monitoring](#raim-receiver-autonomous-integrity-monitoring)
  - [Ejercicio: simulador de spoofing](#ejercicio-simulador-de-spoofing)

- [CubeSat Hacking](#cubesat-hacking)
  - [Componentes COTS en espacio](#componentes-cots-en-espacio)
  - [Software open-source para CubeSats](#software-open-source-para-cubesats)
  - [CAN bus en aplicaciones espaciales](#can-bus-en-aplicaciones-espaciales)
  - [Firmware vulnerabilities](#firmware-vulnerabilities)
  - [SDR en CubeSats](#sdr-en-cubesats)
  - [Ejercicio: audit de firmware CubeSat](#ejercicio-audit-de-firmware-cubesat)

- [Intercepcion de Satelites](#intercepcion-de-satelites)
  - [Recepcion de downlink](#recepcion-de-downlink)
  - [Decodificacion de telemetria](#decodificacion-de-telemetria)
  - [Extraccion de imagenes satelitales](#extraccion-de-imagenes-satelitales)
  - [Satelites meteorologicos: APT/HRPT](#satelites-meteorologicos-apthrpt)
  - [Satelites de observacion terrestre](#satelites-de-observacion-terrestre)
  - [Decodificacion NOAA](#decodificacion-noaa)
  - [Ejercicio: capturar imagen de satelite](#ejercicio-capturar-imagen-de-satelite)

- [Software Defined Radio para Satelites](#software-defined-radio-para-satelites)
  - [GNU Radio: fundamentos](#gnu-radio-fundamentos)
  - [Procesamiento de senales satelitales](#procesamiento-de-senales-satelitales)
  - [gr-satellites: framework](#gr-satellites-framework)
  - [SDRangel para analisis](#sdrangel-para-analisis)
  - [Configuracion de SDR para espacio](#configuracion-de-sdr-para-espacio)
  - [Ejercicio: decodificar telemetria con GNU Radio](#ejercicio-decodificar-telemetria-con-gnu-radio)

- [Seguridad en Enlaces Ascendentes](#seguridad-en-enlaces-ascendentes)
  - [Command uplink vulnerabilities](#command-uplink-vulnerabilities)
  - [Autenticacion debil en satelites legacy](#autenticacion-debil-en-satelites-legacy)
  - [Buffer overflows en OBC](#buffer-overflows-en-obc)
  - [Inyeccion de comandos](#inyeccion-de-comandos)
  - [Anti-spoofing en uplink](#anti-spoofing-en-uplink)
  - [Ejercicio: analisis de protocolo uplink](#ejercicio-analisis-de-protocolo-uplink)

- [Criptografia en el Espacio](#criptografia-en-el-espacio)
  - [Cifrado en enlaces satelitales](#cifrado-en-enlaces-satelitales)
  - [Key management en misiones](#key-management-en-misiones)
  - [PQC para aplicaciones satelitales](#pqc-para-aplicaciones-satelitales)
  - [Quantum key distribution en espacio](#quantum-key-distribution-en-espacio)
  - [Vulnerabilidades en crypto satelital](#vulnerabilidades-en-crypto-satelital)
  - [Ejercicio: analisis de cifrado](#ejercicio-analisis-de-cifrado)

---

## 1. Introducción al Hacking Espacial

### 1.1 Teoria: Introduccion al Hacking Espacial

RAIM (Receiver Autonomous Integrity Monitoring) es una tecnica de deteccion de fallos que usa redundancia de mediciones de multiples satelites para identificar senales anomulas. Sin embargo, RAIM no fue disenado para detectar ataques de spoofing sofisticados donde todas las senales falsas son consistentes entre si.

Los satelites modernos son sistemas informaticos complejos que orbitan la Tierra comunicandose con estaciones terrenas mediante enlaces de radiofrecuencia. La seguridad de estos sistemas es critica no solo por el costo de los activos sino por las implicaciones de seguridad nacional. Un atacante con equipo de radio basico ([sdr](../raw/sdr-t3l3c0ms.md) + antena) puede interceptar telemetria o incluso enviar comandos no autorizados.

El GNSS (Global Navigation Satellite System) es vulnerable a ataques de spoofing donde un atacante transmite senales GPS falsas que el receptor interpreta como legitimas. El spoofing puede desviar drones de su ruta, alterar la navegacion de barcos, o manipular la sincronizacion de [redes](../raw/r3d3s-f0nd4m3nt0s.md) financieras. La senal civil GPS L1 C/A no tiene [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) criptografica.

El [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) CCSDS (Consultative Committee for Space Data Systems) es el estandar internacional para comunicaciones espaciales. Define la estructura de paquetes de telemetria y telecomando, los procedimientos de control de enlace (COP-1) y la entrega de archivos (CFDP). Muchas implementaciones de CCSDS carecen de autenticacion y [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) adecuados.

Los CubeSats son satelites pequenos y de bajo costo que utilizan componentes COTS (Commercial Off-The-Shelf). Esto los hace accesibles pero tambien vulnerables: muchos usan microcontroladores sin protecciones de seguridad, protocolos de comunicacion sin cifrado, y software open-source con vulnerabilidades conocidas.
