# Automocion y redes V2X (Vehicle-to-Everything)

## Índice

> ⏱️ **Tiempo estimado:** 30 horas (~6 sesiones) (2849 lineas)

- Introduccion a la Segurid[ad Automotriz](#introduccion-a-la-seguridad-automotriz) - [Panorama de seguridad vehicular](#panorama-de-seguridad-vehicular) - Supe[rficie de ataque de un vehiculo](#superficie-de-ataque-de-un-vehiculo) - [ECUs: Unidades electronicas de control](#ecus-unidades-electronicas-de-control) - Arquitectura de [red vehicular](#arquitectura-de-red-vehicular) - [Regulaciones UN R155/R156](#regulaciones-un-r155r156) - [Evolucion de ataques automotive](#evolucion-de-ataques-automotive) - [setup de herramientas](#setup-de-herramientas)

- [can  Fundamentals](#can-bus-fundamentals) - [CAN 2.0 vs CAN FD](#can-20-vs-can-fd) - [Arbitraje y prioridad de mensajes](#arbitraje-y-prioridad-de-mensajes) - [Formato de trama CAN](#formato-de-trama-can) - Identificadores ([idss)) y filtros](#identificadores-ids-y-filtros) - [DBC files: definicion de mensajes](#dbc-files-definicion-de-mensajes) - Bit timing y sin[cronizacion](#bit-timing-y-sincronizacion) - [Errores y manejo de fallos](#errores-y-manejo-de-fallos) - [CANtact, PCAN-USB, SocketCAN](#cantact-pcan-usb-socketcan) - [Ejercicio: sniffear trafico CAN](#ejercicio-sniffear-trafico-can)

- [CAN Injection](#can-injection) - [puerto obd-ii: acceso fisico](#puerto-obd-ii-acceso-fisico) - [CAN frame crafting](#can-frame-crafting) - [Envio de mensajes arbitrarios](#envio-de-mensajes-arbitrarios) - [DoS sobre CAN bus](#dos-sobre-can-bus) - [fuzzing a ECUs](#fuzzing-a-ecus) - [uds: ISO 14229](#uds-iso-14229) - [Lectura de DTCs](#lectura-de-dtcs) - [Re-flashing via bootloader](#re-flashing-via-bootloader) - [SavvyCAN, Vehicle Spy](#savvycan-vehicle-spy) - [Ejercicio: inyectar trama CAN maliciosa](#ejercicio-inyectar-trama-can-maliciosa)

- [Automotive Ethernet](#automotive-ethernet) - [BroadR-Reach (100BASE-T1)](#broadr-reach-100base-t1) - [Arquitectura Ethernet automotive](#arquitectura-ethernet-automotive) - [SOME/IP protocol](#someip-protocol) - DoIP: Diagnost[ics over IP](#doip-diagnostics-over-ip) - [AVB/TSN](#avbtsn) - [Seguridad en Ethernet automotive](#seguridad-en-ethernet-automotive) - [vlan segmentation](#vlan-segmentation) - [Ejercicio: analisis SOME/IP](#ejercicio-analisis-someip)

- ECU [firmware Reversing](#ecu-firmware-reversing) - [Lectura de flash via UDS 0x27/0x34/0x36/0x37](#lectura-de-flash-via-uds-0x270x340x360x37) - Bootloader [exploitation](#bootloader-exploitation) - [JTAG/SWD debugging](#jtagswd-debugging) - [Extraccion de firmware](#extraccion-de-firmware) - [Analisis estatico de firmware](#analisis-estatico-de-firmware) - [Emulacion de ECUs](#emulacion-de-ecus) - [Side-channel en ECUs](#side-channel-en-ecus) - JTAGula[tor, OpenOCD](#jtagulator,-openocd) - [Ejercicio: dump de firmware ECU](#ejercicio-dump-de-firmware-ecu)

- [Carga Electrica: CCS/CHAdeMO](#carga-electrica-ccs/chademo) - [Introduccion a carga de VE](#introduccion-a-carga-de-ve) - [Protocolo CCS](#protocolo-ccs) - [Protocolo CHAdeMO](#protocolo-chademo) - [PLC sobre CP/PE](#plc-sobre-cppe) - [OCPP: Open Charge Point Protocol](#ocpp-open-charge-point-protocol) - [vulnerabilidades en cargadores](#vulnerabilidades-en-cargadores) - [ISO 15118 V2G](#iso-15118-v2g) - [Ejercicio: analisis OCPP](#ejercicio-analisis-ocpp)

- V2X [communication](#v2x-communication) - [DSRC vs C-V2X](#dsrc-vs-c-v2x) - [Basic Safety Message (BSM)](#basic-safety-message-bsm) - [SCMS](#scms) - [Certificados y autenticacion V2X](#certificados-y-autenticacion-v2x) - [Spoofing y jamming V2X](#spoofing-y-jamming-v2x) - [Privacidad y seudonimos](#privacidad-y-seudonimos) - [IEEE 1609.x WAVE](#ieee-1609x-wave) - [ETSI ITS-G5](#etsi-its-g5) - [Ejercicio: analisis de paquete V2X](#ejercicio-analisis-de-paquete-v2x)

- [Ataques Remotos a Vehiculos](#ataques-remotos-a-vehiculos) - [Telematics Unit exploitation](#telematics-unit-exploitation) - [OTA update abuse](#ota-update-abuse) - [Mobile app API attacks](#mobile-app-api-attacks) - Backend [cloud vulnerabilities](#backend-cloud-vulnerabilities) - [Bluetooth/Keyless entry attacks](#bluetoothkeyless-entry-attacks) - [TPMS](#tpms) - [Infotainment pwnage](#infotainment-pwnage) - Ejercicio: [frida en head unit](#ejercicio-frida-en-head-unit)

- [ADAS Sensor Attacks](#adas-sensor-attacks) - [LiDAR spoofing](#lidar-spoofing) - [Camera blinding](#camera-blinding) - [Radar jamming](#radar-jamming) - [Ultrasonic sensor replay](#ultrasonic-sensor-replay) - [Sensor fusion attacks](#sensor-fusion-attacks) - [pe](../raw/w1n-1nt3rn4ls.md#pe)[rception system evasion](#perception-system-evasion) - [Physical world attacks](#physical-world-attacks) - Adve[rsarial examples](#adversarial-examples) - [Ejercicio: adversarial patch para stop sign](#ejercicio-adversarial-patch-para-stop-sign)

- [Automotive Pentesting](#automotive-pentesting) - [Metodologia de pentesting automotive](#metodologia-de-pentesting-automotive) - [reconnaissance de vehiculo](#reconnaissance-de-vehiculo) - [Analisis de bus CAN](#analisis-de-bus-can) - [Pruebas de UDS](#pruebas-de-uds) - [Fuzzing de ECUs](#fuzzing-de-ecus) - [Escalada de privilegios](#escalada-de-privilegios) - [Post-explotacion](#post-explotacion) - [Reporte de vulnerabilidades](#reporte-de-vulnerabilidades) - [CANtact, PCAN, UDSim](#cantact,-pcan,-udsim) - [Ejercicio: pentesting completo](#ejercicio-pentesting-completo)

---

## 1. Introducción a la Seguridad Automotriz

### 1.1 Teoria: Introduccion a la Seguridad Automotriz

El [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) obd (On-Board Diagnostics) es el conector estandarizado para diagnostico vehicular. Proporciona acceso directo al bus CAN, permitiendo leer y escribir mensajes. Un atacante con acceso [fisico](../raw/ph7s1c4l-r3d.md) al [obd-ii](../raw/4ut0m0t1v3-s3c.md#obd-ii) puede enviar tramas CAN arbitrarias para controlar ECUs, incluyendo frenos, motor, direccion y airbags.

CAN FD (Flexible Data-Rate) es una extension de CAN 2.0 que permite velocidades de datos de hasta 8 Mbps (vs 1 Mbps de CAN clasico) y tramas de hasta 64 bytes. CAN FD mantiene compatibilidad hacia atras pero requiere controladores especificos.

El [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red))) CAN 2.0 usa tramas de hasta 8 bytes de datos con un identificador de 11 bits (CAN 2.0A) o 29 bits (CAN 2.0B). El arbitraje se realiza por el ID: el mensaje con ID mas bajo gana el bus. Esto significa que los mensajes de alta prioridad (como los de frenado) siempre tienen preferencia.

[uds](../raw/4ut0m0t1v3-s3c.md#uds) (Unified Diagnostic Services, ISO 14229) es el protocolo de diagnostico estandar para vehiculos modernos. Define servicios como 0x22 (ReadDataByIdentifier), 0x2E (WriteDataByIdentifier), 0x27 (SecurityAccess), 0x34 (RequestDownload) y 0x36 (TransferData). El servicio 0x27 requiere un algoritmo de semilla-clave que a menudo es debil y reversible.
