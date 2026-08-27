# Criptografia Cuantica y Canales Laterales

## Índice

> ⏱️ **Tiempo estimado:** 30 horas (~6 sesiones) (7316 lineas)

- [Introduccion a los Canales Laterales](#introduccion-a-los-canales-laterales)
  - [Que es un canal lateral](#que-es-un-canal-lateral)
  - [Clasificacion de ataques](#clasificacion-de-ataques)
  - [Modelo de amenaza](#modelo-de-amenaza)
  - [Breve historia](#breve-historia)
  - [Canales pasivos vs activos](#canales-pasivos-vs-activos)
  - [Herramientas basicas](#herramientas-basicas)

- [Timing Attacks](#timing-attacks)
  - [Fundamentos teoricos](#fundamentos-teoricos)
  - [Ataque a comprobacion de contrasenas](#ataque-a-comprobacion-de-contrasenas)
  - [Ataque a RSA con Kocher](#ataque-a-rsa-con-kocher)
  - [Ataque a AES via cache-timing](#ataque-a-aes-via-cache-timing)
  - [Constant-time programming](#constant-time-programming)
  - [Ejercicio practico: timing attack a PIN](#ejercicio-practico-timing-attack-a-pin)
  - [Timing con redes neuronales](#timing-con-redes-neuronales)
  - [Medicion precisa con RDTSC](#medicion-precisa-con-rdtsc)

- [Simple Power Analysis (SPA)](#simple-power-analysis-spa)
  - [Principios fisicos del consumo de potencia](#principios-fisicos-del-consumo-de-potencia)
  - [Identificacion visual de operaciones](#identificacion-visual-de-operaciones)
  - [SPA sobre RSA: square-and-multiply](#spa-sobre-rsa-square-and-multiply)
  - [SPA sobre AES: AddRoundKey vs SubBytes](#spa-sobre-aes-addroundkey-vs-subbytes)
  - [ChipWhisperer: setup y captura](#chipwhisperer-setup-y-captura)
  - [PicoScope para adquisicion](#picoscope-para-adquisicion)
  - [OpenSCA: analisis de trazas](#opensca-analisis-de-trazas)
  - [Wavelets y PCA para SPA](#wavelets-y-pca-para-spa)

- [Differential Power Analysis (DPA)](#differential-power-analysis-dpa)
  - [Concepto de correlacion](#concepto-de-correlacion)
  - [Recoleccion de trazas](#recoleccion-de-trazas)
  - [DPA de 1er orden sobre AES](#dpa-de-1er-orden-sobre-aes)
  - [Correlation Power Analysis (CPA)](#correlation-power-analysis-cpa)
  - [Template Attacks](#template-attacks)
  - [DPA de alto orden (HO-DPA)](#dpa-de-alto-orden-ho-dpa)
  - [Contramedidas: masking y hiding](#contramedidas-masking-y-hiding)
  - [Ejercicio practico: DPA en Jupyter](#ejercicio-practico-dpa-en-jupyter)

- [Ataques Electromagneticos (EMA)](#ataques-electromagneticos-ema)
  - [Emisiones EM como canal lateral](#emisiones-em-como-canal-lateral)
  - [Sondas EM y amplificadores](#sondas-em-y-amplificadores)
  - [EMA vs DPA: ventajas y desventajas](#ema-vs-dpa-ventajas-y-desventajas)
  - [Ataques EM localizados en FPGAs](#ataques-em-localizados-en-fpgas)
  - [Ejercicio practico: sonda EM casera](#ejercicio-practico-sonda-em-casera)

- [Ataques Acusticos](#ataques-acusticos)
  - [Ruido de CPU como oraculo](#ruido-de-cpu-como-oraculo)
  - [Ataque acustico a RSA](#ataque-acustico-a-rsa)
  - [Ataque acustico a impresoras](#ataque-acustico-a-impresoras)
  - [Analisis espectral y filtrado](#analisis-espectral-y-filtrado)
  - [Ejercicio practico: grabacion y analisis](#ejercicio-practico-grabacion-y-analisis)

- [Cache Timing Attacks](#cache-timing-attacks)
  - [Arquitectura de cache moderna](#arquitectura-de-cache-moderna)
  - [Flush+Reload](#flushreload)
  - [Prime+Probe](#primeprobe)
  - [Evict+Reload](#evictreload)
  - [Meltdown y Spectre](#meltdown-y-spectre)
  - [Ataque a AES via cache-bank timing](#ataque-a-aes-via-cache-bank-timing)
  - [Mitigaciones en software y hardware](#mitigaciones-en-software-y-hardware)
  - [Ejercicio practico: Flush+Reload en x86](#ejercicio-practico-flushreload-en-x86)

- [RSA Side-Channel](#rsa-side-channel)
  - [Square-and-Multiply](#square-and-multiply)
  - [Montgomery ladder](#montgomery-ladder)
  - [Sliding window exponentiation](#sliding-window-exponentiation)
  - [Blinding como contramedida](#blinding-como-contramedida)
  - [RSA-CRT: ataque de Bellcore](#rsa-crt-ataque-de-bellcore)
  - [Ejercicio practico: simular RSA side-channel](#ejercicio-practico-simular-rsa-side-channel)

- [AES Side-Channel](#aes-side-channel)
  - [Implementacion basada en T-tables](#implementacion-basada-en-t-tables)
  - [Ataque de cache-timing a T-tables](#ataque-de-cache-timing-a-t-tables)
  - [Ataque de template a S-Box](#ataque-de-template-a-s-box)
  - [AES-NI: hardware mitigado](#aes-ni-hardware-mitigado)
  - [Bitsliced AES](#bitsliced-aes)
  - [Ejercicio practico: recuperar clave AES](#ejercicio-practico-recuperar-clave-aes)

- [Fallos de Entropia y PRNGs](#fallos-de-entropia-y-prngs)
  - [Importancia de la entropia en criptografia](#importancia-de-la-entropia-en-criptografia)
  - [/dev/urandom vs /dev/random en Linux](#devurandom-vs-devrandom-en-linux)
  - [Yarrow y Fortuna](#yarrow-y-fortuna)
  - [Linux CSPRNG internals (ChaCha20)](#linux-csprng-internals-chacha20)
  - [Dual-EC-DRBG](#dual-ec-drbg)
  - [Ataque a claves RSA con baja entropia](#ataque-a-claves-rsa-con-baja-entropia)
  - [Ejercicio practico: recovery de clave debil](#ejercicio-practico-recovery-de-clave-debil)

- [Post-Quantum Cryptography (PQC)](#post-quantum-cryptography-pqc)
  - [Introduccion: la amenaza cuantica](#introduccion-la-amenaza-cuantica)
  - [Algoritmo de Shor](#algoritmo-de-shor)
  - [Algoritmo de Grover](#algoritmo-de-grover)
  - [NIST PQC Standardization](#nist-pqc-standardization)
  - [Hardware cuantico actual 2025](#hardware-cuantico-actual-2025)
  - [Cronograma de migracion recomendado](#cronograma-de-migracion-recomendado)

- [Criptografia Lattice-Based](#criptografia-lattice-based)
  - [Fundamentos de lattices](#fundamentos-de-lattices)
  - [Learning With Errors (LWE)](#learning-with-errors-lwe)
  - [Ring-LWE y Module-LWE](#ring-lwe-y-module-lwe)
  - [CRYSTALS-Kyber (ML-KEM)](#crystals-kyber-ml-kem)
  - [CRYSTALS-Dilithium (ML-DSA)](#crystals-dilithium-ml-dsa)
  - [FALCON](#falcon)
  - [Side-channels en lattice-based](#side-channels-en-lattice-based)
  - [Compresion de coeficientes Kyber](#compresion-de-coeficientes-kyber)
  - [NTT y muestreo de polinomios](#ntt-y-muestreo-de-polinomios)
  - [Ejercicio practico: usar liboqs](#ejercicio-practico-usar-liboqs)

- [Criptografia Hash-Based](#criptografia-hash-based)
  - [Arboles de Merkle](#arboles-de-merkle)
  - [LM-OTS](#lm-ots)
  - [SPHINCS+ (SLH-DSA)](#sphincs+-slh-dsa)
  - [XMSS (stateful)](#xmss-stateful)
  - [Ejercicio practico: firmar con SPHINCS+](#ejercicio-practico-firmar-con-sphincs+)

- [Criptografia Code-Based](#criptografia-code-based)
  - [Codigos lineales y Goppa](#codigos-lineales-y-goppa)
  - [Classic McEliece](#classic-mceliece)
  - [BIKE y HQC](#bike-y-hqc)
  - [Algoritmo de Patterson](#algoritmo-de-patterson)
  - [Side-channels en code-based](#side-channels-en-code-based)
  - [Ejercicio practico: Classic McEliece con liboqs](#ejercicio-practico-classic-mceliece-con-liboqs)

- [Criptografia Isogeny-Based](#criptografia-isogeny-based)
  - [Curvas elipticas e isogenias](#curvas-elipticas-e-isogenias)
  - [SIDH y SIKE](#sidh-y-sike)
  - [El ataque de Castryck-Decru (2022)](#el-ataque-de-castryck-decru-2022)
  - [SQIsign y el futuro](#sqisign-y-el-futuro)
  - [Estado actual post-ataque](#estado-actual-post-ataque)
  - [Ejercicio exploratorio](#ejercicio-exploratorio)

- [Herramientas y Laboratorio](#herramientas-y-laboratorio)
  - [ChipWhisperer setup](#chipwhisperer-setup)
  - [OpenSCA](#opensca)
  - [PicoScope](#picoscope)
  - [Jupyter Notebooks](#jupyter-notebooks)
  - [liboqs](#liboqs)
  - [OQS-OpenSSL](#oqs-openssl)
  - [Automacion DPA](#automacion-dpa)
  - [Sonda EM profesional](#sonda-em-profesional)
  - [Ejercicio integrador final](#ejercicio-integrador-final)

- [Anexos](#anexos)
  - [Papers fundamentales](#papers-fundamentales)
  - [Glosario de terminos](#glosario-de-terminos)
  - [Herramientas recomendadas](#herramientas-recomendadas)

---

## 1. Introducción a los Canales Laterales

### 1.1 Teoria: Introduccion a los Canales Laterales

El consumo de potencia en circuitos CMOS esta dominado por la conmutacion de los transistores. Cada vez que un bit cambia de 0 a 1 o viceversa, fluye una corriente transitoria para cargar o descargar la capacitancia parasita. La cantidad total de corriente en un ciclo de clock depende de cuantos bits conmutan simultaneamente, lo que se conoce como peso de Hamming (Hamming weight) y es directamente proporcional a los datos que se procesan.

Los ataques de tiempo (timing attacks) explotan la variacion en la duracion de las operaciones segun los valores de los operandos. Por ejemplo, en [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa) la exponenciacion modular con square-and-multiply ejecuta una multiplicacion adicional cuando el bit del exponente es 1. Si podemos medir con precision nanosegundos, podemos determinar el valor de cada bit del exponente secreto.

El analisis diferencial de potencia (DPA) es una tecnica estadistica que permite extraer claves incluso cuando el ruido de medicion es mayor que la senal individual. La idea es recolectar miles de trazas de potencia para diferentes entradas conocidas, y para cada hipotesis de clave calcular la correlacion entre un modelo de consumo y las trazas reales. La hipotesis correcta mostrara el pico de correlacion mas alto.
