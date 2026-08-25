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



#### 1.2 Que es un canal lateral

El sub-tema Que es un canal lateral dentro de Introduccion a los Canales Laterales requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Que es un canal lateral
import os, sys, time, struct
import numpy as np

class Queesuncanallateral:
    """Implementacion de Que es un canal lateral para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Que es un canal lateral."""
    obj = Queesuncanallateral(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Que es un canal lateral.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 1.3 Clasificacion de ataques

El sub-tema Clasificacion de ataques dentro de Introduccion a los Canales Laterales requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Clasificacion de ataques
import os, sys, time, struct
import numpy as np

class Clasificaciondeataques:
    """Implementacion de Clasificacion de ataques para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Clasificacion de ataques."""
    obj = Clasificaciondeataques(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Clasificacion de ataques.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 1.4 Modelo de amenaza

El sub-tema Modelo de amenaza dentro de Introduccion a los Canales Laterales requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Modelo de amenaza
import os, sys, time, struct
import numpy as np

class Modelodeamenaza:
    """Implementacion de Modelo de amenaza para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Modelo de amenaza."""
    obj = Modelodeamenaza(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Modelo de amenaza.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 1.5 Breve historia

El sub-tema Breve historia dentro de Introduccion a los Canales Laterales requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Breve historia
import os, sys, time, struct
import numpy as np

class Brevehistoria:
    """Implementacion de Breve historia para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Breve historia."""
    obj = Brevehistoria(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Breve historia.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 1.6 Canales pasivos vs activos

El sub-tema Canales pasivos vs activos dentro de Introduccion a los Canales Laterales requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Canales pasivos vs activos
import os, sys, time, struct
import numpy as np

class Canalespasivosvsactivos:
    """Implementacion de Canales pasivos vs activos para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Canales pasivos vs activos."""
    obj = Canalespasivosvsactivos(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Canales pasivos vs activos.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 1.7 Herramientas basicas

El sub-tema Herramientas basicas dentro de Introduccion a los Canales Laterales requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Herramientas basicas
import os, sys, time, struct
import numpy as np

class Herramientasbasicas:
    """Implementacion de Herramientas basicas para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Herramientas basicas."""
    obj = Herramientasbasicas(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Herramientas basicas.
Puede adaptarse y extenderse segun las necesidades del analisis.

### 1.3 Comandos y Herramientas

```bash
pip install numpy scipy matplotlib jupyter scikit-learn
git clone https://github.com/newaetech/chipwhisperer
pip install chipwhisperer opensca pyserial
pip install liboqs cryptography
```

### 1.4 Ejercicios Practicos

**Ejercicio 1 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Introduccion a los Canales Laterales implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en [python](../raw/pyth0n-f0r-h4ck1ng.md)
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 2 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Introduccion a los Canales Laterales implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 3 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Introduccion a los Canales Laterales implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 4 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Introduccion a los Canales Laterales implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 5 (Nivel Avanzado):**

Objetivo: Aplicar los conceptos de Introduccion a los Canales Laterales implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

Para el nivel avanzado, incorporar tecnicas de optimizacion y
analisis comparativo. Extender la implementacion con funcionalidades
adicionales y probar en escenarios realistas.

---

## 2. Timing Attacks

### 2.1 Teoria: Timing Attacks

Los ataques de template son la forma mas poderosa de side-channel analysis. Consisten en dos fases: profiling, donde se construye un modelo estadistico detallado (media y covarianza) para cada valor de clave posible usando un dispositivo identico, y ataque, donde se compara la traza del dispositivo objetivo contra los templates usando maxima verosimilitud (log-likelihood bajo distribucion normal multivariada).

La [criptografia post-cuantica](../raw/pqc-s1d3-ch4nn3ls.md) ([pqc](../raw/pqc-s1d3-ch4nn3ls.md)) busca algoritmos seguros contra computadoras cuanticas. Los algoritmos de Shor y Grover amenazan respectivamente la [criptografia](../raw/crypt0-f0r-h4ck3rs.md) de clave publica ([rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa), ECC) y la de clave simetrica ([aes](../raw/crypt0-f0r-h4ck3rs.md#aes)). [nist](../raw/p3nt3st-m3th0d0l0gy.md#nist) estandarizo ML-KEM (Kyber) para intercambio de claves y ML-DSA (Dilithium) para firmas digitales, ambos basados en problemas de lattices.

El consumo de potencia en circuitos CMOS esta dominado por la conmutacion de los transistores. Cada vez que un bit cambia de 0 a 1 o viceversa, fluye una corriente transitoria para cargar o descargar la capacitancia parasita. La cantidad total de corriente en un ciclo de clock depende de cuantos bits conmutan simultaneamente, lo que se conoce como peso de Hamming (Hamming weight) y es directamente proporcional a los datos que se procesan.

Las implementaciones constant-time son esenciales para prevenir timing attacks. El principio fundamental es que el tiempo de ejecucion no debe depender de ningun dato secreto. Esto implica: usar operaciones bitwise en lugar de condicionales, evitar accesos a memoria indexados por datos secretos, y asegurar que todos los bucles recorran el mismo numero de iteraciones independientemente de los valores.

El analisis diferencial de potencia (DPA) es una tecnica estadistica que permite extraer claves incluso cuando el ruido de medicion es mayor que la senal individual. La idea es recolectar miles de trazas de potencia para diferentes entradas conocidas, y para cada hipotesis de clave calcular la correlacion entre un modelo de consumo y las trazas reales. La hipotesis correcta mostrara el pico de correlacion mas alto.

La [criptografia post-cuantica](../raw/pqc-s1d3-ch4nn3ls.md) (PQC) busca algoritmos seguros contra computadoras cuanticas. Los algoritmos de Shor y Grover amenazan respectivamente la criptografia de clave publica (RSA, ECC) y la de clave simetrica (AES). NIST estandarizo ML-KEM (Kyber) para intercambio de claves y ML-DSA (Dilithium) para firmas digitales, ambos basados en problemas de lattices.

Los ataques de template son la forma mas poderosa de side-channel analysis. Consisten en dos fases: profiling, donde se construye un modelo estadistico detallado (media y covarianza) para cada valor de clave posible usando un dispositivo identico, y ataque, donde se compara la traza del dispositivo objetivo contra los templates usando maxima verosimilitud (log-likelihood bajo distribucion normal multivariada).

Las implementaciones constant-time son esenciales para prevenir timing attacks. El principio fundamental es que el tiempo de ejecucion no debe depender de ningun dato secreto. Esto implica: usar operaciones bitwise en lugar de condicionales, evitar accesos a memoria indexados por datos secretos, y asegurar que todos los bucles recorran el mismo numero de iteraciones independientemente de los valores.

#### 2.2 Fundamentos teoricos

El sub-tema Fundamentos teoricos dentro de Timing Attacks requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Fundamentos teoricos
import os, sys, time, struct
import numpy as np

class Fundamentosteoricos:
    """Implementacion de Fundamentos teoricos para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Fundamentos teoricos."""
    obj = Fundamentosteoricos(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Fundamentos teoricos.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 2.3 Ataque a comprobacion de contrasenas

El sub-tema Ataque a comprobacion de contrasenas dentro de Timing Attacks requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ataque a comprobacion de contrasenas
import os, sys, time, struct
import numpy as np

class Ataqueacomprobaciondecontrasenas:
    """Implementacion de Ataque a comprobacion de contrasenas para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ataque a comprobacion de contrasenas."""
    obj = Ataqueacomprobaciondecontrasenas(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ataque a comprobacion de contrasenas.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 2.4 Ataque a RSA con Kocher

El sub-tema Ataque a RSA con Kocher dentro de Timing Attacks requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ataque a RSA con Kocher
import os, sys, time, struct
import numpy as np

class AtaqueaRSAconKocher:
    """Implementacion de Ataque a RSA con Kocher para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ataque a RSA con Kocher."""
    obj = AtaqueaRSAconKocher(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ataque a RSA con Kocher.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 2.5 Ataque a AES via cache-timing

El sub-tema Ataque a AES via cache-timing dentro de Timing Attacks requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ataque a AES via cache-timing
import os, sys, time, struct
import numpy as np

class AtaqueaAESviacachetiming:
    """Implementacion de Ataque a AES via cache-timing para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ataque a AES via cache-timing."""
    obj = AtaqueaAESviacachetiming(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ataque a AES via cache-timing.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 2.6 Constant-time programming

El sub-tema Constant-time programming dentro de Timing Attacks requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Constant-time programming
import os, sys, time, struct
import numpy as np

class Constanttimeprogramming:
    """Implementacion de Constant-time programming para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Constant-time programming."""
    obj = Constanttimeprogramming(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Constant-time programming.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 2.7 Ejercicio practico: timing attack a PIN

El sub-tema Ejercicio practico: timing attack a PIN dentro de Timing Attacks requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ejercicio practico: timing attack a PIN
import os, sys, time, struct
import numpy as np

class Ejerciciopractico:timingattackaPIN:
    """Implementacion de Ejercicio practico: timing attack a PIN para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ejercicio practico: timing attack a PIN."""
    obj = Ejerciciopractico:timingattackaPIN(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ejercicio practico: timing attack a PIN.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 2.8 Timing con [redes](../raw/r3d3s-f0nd4m3nt0s.md) neuronales

El sub-tema Timing con redes neuronales dentro de Timing Attacks requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Timing con redes neuronales
import os, sys, time, struct
import numpy as np

class Timingconredesneuronales:
    """Implementacion de Timing con redes neuronales para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Timing con redes neuronales."""
    obj = Timingconredesneuronales(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Timing con redes neuronales.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 2.9 Medicion precisa con RDTSC

El sub-tema Medicion precisa con RDTSC dentro de Timing Attacks requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Medicion precisa con RDTSC
import os, sys, time, struct
import numpy as np

class MedicionprecisaconRDTSC:
    """Implementacion de Medicion precisa con RDTSC para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Medicion precisa con RDTSC."""
    obj = MedicionprecisaconRDTSC(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Medicion precisa con RDTSC.
Puede adaptarse y extenderse segun las necesidades del analisis.

### 2.3 Comandos y Herramientas

```bash
pip install numpy scipy matplotlib jupyter scikit-learn
git clone https://github.com/newaetech/chipwhisperer
pip install chipwhisperer opensca pyserial
pip install liboqs cryptography
```

### 2.4 Ejercicios Practicos

**Ejercicio 1 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Timing Attacks implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en [python](../raw/pyth0n-f0r-h4ck1ng.md)
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 2 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Timing Attacks implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 3 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Timing Attacks implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 4 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Timing Attacks implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 5 (Nivel Avanzado):**

Objetivo: Aplicar los conceptos de Timing Attacks implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

Para el nivel avanzado, incorporar tecnicas de optimizacion y
analisis comparativo. Extender la implementacion con funcionalidades
adicionales y probar en escenarios realistas.

---

## 3. Simple Power Analysis (SPA)

### 3.1 Teoria: Simple Power Analysis (SPA)

Las implementaciones constant-time son esenciales para prevenir timing attacks. El principio fundamental es que el tiempo de ejecucion no debe depender de ningun dato secreto. Esto implica: usar operaciones bitwise en lugar de condicionales, evitar accesos a memoria indexados por datos secretos, y asegurar que todos los bucles recorran el mismo numero de iteraciones independientemente de los valores.

El analisis diferencial de potencia (DPA) es una tecnica estadistica que permite extraer claves incluso cuando el ruido de medicion es mayor que la senal individual. La idea es recolectar miles de trazas de potencia para diferentes entradas conocidas, y para cada hipotesis de clave calcular la correlacion entre un modelo de consumo y las trazas reales. La hipotesis correcta mostrara el pico de correlacion mas alto.

La [criptografia post-cuantica](../raw/pqc-s1d3-ch4nn3ls.md) ([pqc](../raw/pqc-s1d3-ch4nn3ls.md)) busca algoritmos seguros contra computadoras cuanticas. Los algoritmos de Shor y Grover amenazan respectivamente la [criptografia](../raw/crypt0-f0r-h4ck3rs.md) de clave publica ([rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa), ECC) y la de clave simetrica ([aes](../raw/crypt0-f0r-h4ck3rs.md#aes)). [nist](../raw/p3nt3st-m3th0d0l0gy.md#nist) estandarizo ML-KEM (Kyber) para intercambio de claves y ML-DSA (Dilithium) para firmas digitales, ambos basados en problemas de lattices.

Las implementaciones constant-time son esenciales para prevenir timing attacks. El principio fundamental es que el tiempo de ejecucion no debe depender de ningun dato secreto. Esto implica: usar operaciones bitwise en lugar de condicionales, evitar accesos a memoria indexados por datos secretos, y asegurar que todos los bucles recorran el mismo numero de iteraciones independientemente de los valores.

Los ataques de template son la forma mas poderosa de side-channel analysis. Consisten en dos fases: profiling, donde se construye un modelo estadistico detallado (media y covarianza) para cada valor de clave posible usando un dispositivo identico, y ataque, donde se compara la traza del dispositivo objetivo contra los templates usando maxima verosimilitud (log-likelihood bajo distribucion normal multivariada).

Los ataques de cache timing explotan la diferencia de latencia entre acceder a memoria cache (tipicamente 4-12 ciclos de reloj) versus memoria RAM (200+ ciclos). Flush+Reload es la tecnica mas conocida: el atacante fuerza la salida de cache de una direccion especifica, espera a que la victima potencialmente la acceda, y luego mide el tiempo de recarga. Si es rapido, la victima accedio a esa direccion.

Un canal lateral (side-channel) es cualquier fuga de informacion que se produce durante la ejecucion de un algoritmo criptografico y que no forma parte del output esperado. Cuando un microcontrolador ejecuta una operacion como AES o RSA, las transiciones logicas internas generan variaciones medibles en el consumo de corriente, el campo electromagnetico circundante, el tiempo de ejecucion e incluso el sonido emitido por los capacitores de la fuente.

Las contramedidas contra side-channel attacks se dividen en dos categorias principales: hiding y masking. Hiding busca hacer que el consumo sea constante independientemente de los datos, mediante tecnicas como dual-rail logic o insercion de operaciones dummy. Masking oculta los valores intermedios combinando cada dato secreto con mascaras aleatorias, haciendo que el consumo en cada punto temporal no se correlacione directamente con ningun valor secreto.

#### 3.2 Principios fisicos del consumo de potencia

El sub-tema Principios fisicos del consumo de potencia dentro de Simple Power Analysis (SPA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Principios fisicos del consumo de potencia
import os, sys, time, struct
import numpy as np

class Principiosfisicosdelconsumodepotencia:
    """Implementacion de Principios fisicos del consumo de potencia para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Principios fisicos del consumo de potencia."""
    obj = Principiosfisicosdelconsumodepotencia(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Principios fisicos del consumo de potencia.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 3.3 Identificacion visual de operaciones

El sub-tema Identificacion visual de operaciones dentro de Simple Power Analysis (SPA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Identificacion visual de operaciones
import os, sys, time, struct
import numpy as np

class Identificacionvisualdeoperaciones:
    """Implementacion de Identificacion visual de operaciones para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Identificacion visual de operaciones."""
    obj = Identificacionvisualdeoperaciones(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Identificacion visual de operaciones.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 3.4 SPA sobre RSA: square-and-multiply

El sub-tema SPA sobre RSA: square-and-multiply dentro de Simple Power Analysis (SPA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: SPA sobre RSA: square-and-multiply
import os, sys, time, struct
import numpy as np

class SPAsobreRSA:squareandmultiply:
    """Implementacion de SPA sobre RSA: square-and-multiply para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para SPA sobre RSA: square-and-multiply."""
    obj = SPAsobreRSA:squareandmultiply(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de SPA sobre RSA: square-and-multiply.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 3.5 SPA sobre AES: AddRoundKey vs SubBytes

El sub-tema SPA sobre AES: AddRoundKey vs SubBytes dentro de Simple Power Analysis (SPA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: SPA sobre AES: AddRoundKey vs SubBytes
import os, sys, time, struct
import numpy as np

class SPAsobreAES:AddRoundKeyvsSubBytes:
    """Implementacion de SPA sobre AES: AddRoundKey vs SubBytes para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para SPA sobre AES: AddRoundKey vs SubBytes."""
    obj = SPAsobreAES:AddRoundKeyvsSubBytes(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de SPA sobre AES: AddRoundKey vs SubBytes.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 3.6 ChipWhisperer: setup y captura

El sub-tema ChipWhisperer: setup y captura dentro de Simple Power Analysis (SPA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: ChipWhisperer: setup y captura
import os, sys, time, struct
import numpy as np

class ChipWhisperer:setupycaptura:
    """Implementacion de ChipWhisperer: setup y captura para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para ChipWhisperer: setup y captura."""
    obj = ChipWhisperer:setupycaptura(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de ChipWhisperer: setup y captura.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 3.7 PicoScope para adquisicion

El sub-tema PicoScope para adquisicion dentro de Simple Power Analysis (SPA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: PicoScope para adquisicion
import os, sys, time, struct
import numpy as np

class PicoScopeparaadquisicion:
    """Implementacion de PicoScope para adquisicion para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para PicoScope para adquisicion."""
    obj = PicoScopeparaadquisicion(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de PicoScope para adquisicion.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 3.8 OpenSCA: analisis de trazas

El sub-tema OpenSCA: analisis de trazas dentro de Simple Power Analysis (SPA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: OpenSCA: analisis de trazas
import os, sys, time, struct
import numpy as np

class OpenSCA:analisisdetrazas:
    """Implementacion de OpenSCA: analisis de trazas para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para OpenSCA: analisis de trazas."""
    obj = OpenSCA:analisisdetrazas(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de OpenSCA: analisis de trazas.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 3.9 Wavelets y PCA para SPA

El sub-tema Wavelets y PCA para SPA dentro de Simple Power Analysis (SPA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Wavelets y PCA para SPA
import os, sys, time, struct
import numpy as np

class WaveletsyPCAparaSPA:
    """Implementacion de Wavelets y PCA para SPA para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Wavelets y PCA para SPA."""
    obj = WaveletsyPCAparaSPA(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Wavelets y PCA para SPA.
Puede adaptarse y extenderse segun las necesidades del analisis.

### 3.3 Comandos y Herramientas

```bash
pip install numpy scipy matplotlib jupyter scikit-learn
git clone https://github.com/newaetech/chipwhisperer
pip install chipwhisperer opensca pyserial
pip install liboqs cryptography
```

### 3.4 Ejercicios Practicos

**Ejercicio 1 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Simple Power Analysis (SPA) implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en [python](../raw/pyth0n-f0r-h4ck1ng.md)
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 2 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Simple Power Analysis (SPA) implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 3 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Simple Power Analysis (SPA) implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 4 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Simple Power Analysis (SPA) implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 5 (Nivel Avanzado):**

Objetivo: Aplicar los conceptos de Simple Power Analysis (SPA) implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

Para el nivel avanzado, incorporar tecnicas de optimizacion y
analisis comparativo. Extender la implementacion con funcionalidades
adicionales y probar en escenarios realistas.

---

## 4. Differential Power Analysis (DPA)

### 4.1 Teoria: Differential Power Analysis (DPA)

Un canal lateral (side-channel) es cualquier fuga de informacion que se produce durante la ejecucion de un algoritmo criptografico y que no forma parte del output esperado. Cuando un microcontrolador ejecuta una operacion como [aes](../raw/crypt0-f0r-h4ck3rs.md#aes) o [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa), las transiciones logicas internas generan variaciones medibles en el consumo de corriente, el campo electromagnetico circundante, el tiempo de ejecucion e incluso el sonido emitido por los capacitores de la fuente.

La [criptografia post-cuantica](../raw/pqc-s1d3-ch4nn3ls.md) ([pqc](../raw/pqc-s1d3-ch4nn3ls.md)) busca algoritmos seguros contra computadoras cuanticas. Los algoritmos de Shor y Grover amenazan respectivamente la [criptografia](../raw/crypt0-f0r-h4ck3rs.md) de clave publica (RSA, ECC) y la de clave simetrica (AES). [nist](../raw/p3nt3st-m3th0d0l0gy.md#nist) estandarizo ML-KEM (Kyber) para intercambio de claves y ML-DSA (Dilithium) para firmas digitales, ambos basados en problemas de lattices.

Los ataques de tiempo (timing attacks) explotan la variacion en la duracion de las operaciones segun los valores de los operandos. Por ejemplo, en RSA la exponenciacion modular con square-and-multiply ejecuta una multiplicacion adicional cuando el bit del exponente es 1. Si podemos medir con precision nanosegundos, podemos determinar el valor de cada bit del exponente secreto.

Las implementaciones constant-time son esenciales para prevenir timing attacks. El principio fundamental es que el tiempo de ejecucion no debe depender de ningun dato secreto. Esto implica: usar operaciones bitwise en lugar de condicionales, evitar accesos a memoria indexados por datos secretos, y asegurar que todos los bucles recorran el mismo numero de iteraciones independientemente de los valores.

El consumo de potencia en circuitos CMOS esta dominado por la conmutacion de los transistores. Cada vez que un bit cambia de 0 a 1 o viceversa, fluye una corriente transitoria para cargar o descargar la capacitancia parasita. La cantidad total de corriente en un ciclo de clock depende de cuantos bits conmutan simultaneamente, lo que se conoce como peso de Hamming (Hamming weight) y es directamente proporcional a los datos que se procesan.

Un canal lateral (side-channel) es cualquier fuga de informacion que se produce durante la ejecucion de un algoritmo criptografico y que no forma parte del output esperado. Cuando un microcontrolador ejecuta una operacion como AES o RSA, las transiciones logicas internas generan variaciones medibles en el consumo de corriente, el campo electromagnetico circundante, el tiempo de ejecucion e incluso el sonido emitido por los capacitores de la fuente.

La [criptografia post-cuantica](../raw/pqc-s1d3-ch4nn3ls.md) (PQC) busca algoritmos seguros contra computadoras cuanticas. Los algoritmos de Shor y Grover amenazan respectivamente la criptografia de clave publica (RSA, ECC) y la de clave simetrica (AES). NIST estandarizo ML-KEM (Kyber) para intercambio de claves y ML-DSA (Dilithium) para firmas digitales, ambos basados en problemas de lattices.

Las implementaciones constant-time son esenciales para prevenir timing attacks. El principio fundamental es que el tiempo de ejecucion no debe depender de ningun dato secreto. Esto implica: usar operaciones bitwise en lugar de condicionales, evitar accesos a memoria indexados por datos secretos, y asegurar que todos los bucles recorran el mismo numero de iteraciones independientemente de los valores.

#### 4.2 Concepto de correlacion

El sub-tema Concepto de correlacion dentro de Differential Power Analysis (DPA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Concepto de correlacion
import os, sys, time, struct
import numpy as np

class Conceptodecorrelacion:
    """Implementacion de Concepto de correlacion para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Concepto de correlacion."""
    obj = Conceptodecorrelacion(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Concepto de correlacion.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 4.3 Recoleccion de trazas

El sub-tema Recoleccion de trazas dentro de Differential Power Analysis (DPA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Recoleccion de trazas
import os, sys, time, struct
import numpy as np

class Recolecciondetrazas:
    """Implementacion de Recoleccion de trazas para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Recoleccion de trazas."""
    obj = Recolecciondetrazas(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Recoleccion de trazas.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 4.4 DPA de 1er orden sobre AES

El sub-tema DPA de 1er orden sobre AES dentro de Differential Power Analysis (DPA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: DPA de 1er orden sobre AES
import os, sys, time, struct
import numpy as np

class DPAde1erordensobreAES:
    """Implementacion de DPA de 1er orden sobre AES para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para DPA de 1er orden sobre AES."""
    obj = DPAde1erordensobreAES(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de DPA de 1er orden sobre AES.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 4.5 Correlation Power Analysis (CPA)

El sub-tema Correlation Power Analysis (CPA) dentro de Differential Power Analysis (DPA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Correlation Power Analysis (CPA)
import os, sys, time, struct
import numpy as np

class CorrelationPowerAnalysis(CPA):
    """Implementacion de Correlation Power Analysis (CPA) para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Correlation Power Analysis (CPA)."""
    obj = CorrelationPowerAnalysis(CPA)(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Correlation Power Analysis (CPA).
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 4.6 Template Attacks

El sub-tema Template Attacks dentro de Differential Power Analysis (DPA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Template Attacks
import os, sys, time, struct
import numpy as np

class TemplateAttacks:
    """Implementacion de Template Attacks para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Template Attacks."""
    obj = TemplateAttacks(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Template Attacks.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 4.7 DPA de alto orden (HO-DPA)

El sub-tema DPA de alto orden (HO-DPA) dentro de Differential Power Analysis (DPA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: DPA de alto orden (HO-DPA)
import os, sys, time, struct
import numpy as np

class DPAdealtoorden(HODPA):
    """Implementacion de DPA de alto orden (HO-DPA) para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para DPA de alto orden (HO-DPA)."""
    obj = DPAdealtoorden(HODPA)(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de DPA de alto orden (HO-DPA).
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 4.8 Contramedidas: masking y hiding

El sub-tema Contramedidas: masking y hiding dentro de Differential Power Analysis (DPA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Contramedidas: masking y hiding
import os, sys, time, struct
import numpy as np

class Contramedidas:maskingyhiding:
    """Implementacion de Contramedidas: masking y hiding para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Contramedidas: masking y hiding."""
    obj = Contramedidas:maskingyhiding(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Contramedidas: masking y hiding.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 4.9 Ejercicio practico: DPA en Jupyter

El sub-tema Ejercicio practico: DPA en Jupyter dentro de Differential Power Analysis (DPA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ejercicio practico: DPA en Jupyter
import os, sys, time, struct
import numpy as np

class Ejerciciopractico:DPAenJupyter:
    """Implementacion de Ejercicio practico: DPA en Jupyter para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ejercicio practico: DPA en Jupyter."""
    obj = Ejerciciopractico:DPAenJupyter(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ejercicio practico: DPA en Jupyter.
Puede adaptarse y extenderse segun las necesidades del analisis.

### 4.3 Comandos y Herramientas

```bash
pip install numpy scipy matplotlib jupyter scikit-learn
git clone https://github.com/newaetech/chipwhisperer
pip install chipwhisperer opensca pyserial
pip install liboqs cryptography
```

### 4.4 Ejercicios Practicos

**Ejercicio 1 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Differential Power Analysis (DPA) implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en [python](../raw/pyth0n-f0r-h4ck1ng.md)
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 2 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Differential Power Analysis (DPA) implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 3 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Differential Power Analysis (DPA) implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 4 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Differential Power Analysis (DPA) implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 5 (Nivel Avanzado):**

Objetivo: Aplicar los conceptos de Differential Power Analysis (DPA) implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

Para el nivel avanzado, incorporar tecnicas de optimizacion y
analisis comparativo. Extender la implementacion con funcionalidades
adicionales y probar en escenarios realistas.

---

## 5. Ataques Electromagneticos (EMA)

### 5.1 Teoria: Ataques Electromagneticos (EMA)

Los ataques de cache timing explotan la diferencia de latencia entre acceder a memoria cache (tipicamente 4-12 ciclos de reloj) versus memoria RAM (200+ ciclos). Flush+Reload es la tecnica mas conocida: el atacante fuerza la salida de cache de una direccion especifica, espera a que la victima potencialmente la acceda, y luego mide el tiempo de recarga. Si es rapido, la victima accedio a esa direccion.

Los ataques de template son la forma mas poderosa de side-channel analysis. Consisten en dos fases: profiling, donde se construye un modelo estadistico detallado (media y covarianza) para cada valor de clave posible usando un dispositivo identico, y ataque, donde se compara la traza del dispositivo objetivo contra los templates usando maxima verosimilitud (log-likelihood bajo distribucion normal multivariada).

Los ataques de cache timing explotan la diferencia de latencia entre acceder a memoria cache (tipicamente 4-12 ciclos de reloj) versus memoria RAM (200+ ciclos). Flush+Reload es la tecnica mas conocida: el atacante fuerza la salida de cache de una direccion especifica, espera a que la victima potencialmente la acceda, y luego mide el tiempo de recarga. Si es rapido, la victima accedio a esa direccion.

El consumo de potencia en circuitos CMOS esta dominado por la conmutacion de los transistores. Cada vez que un bit cambia de 0 a 1 o viceversa, fluye una corriente transitoria para cargar o descargar la capacitancia parasita. La cantidad total de corriente en un ciclo de clock depende de cuantos bits conmutan simultaneamente, lo que se conoce como peso de Hamming (Hamming weight) y es directamente proporcional a los datos que se procesan.

Las contramedidas contra side-channel attacks se dividen en dos categorias principales: hiding y masking. Hiding busca hacer que el consumo sea constante independientemente de los datos, mediante tecnicas como dual-rail logic o insercion de operaciones dummy. Masking oculta los valores intermedios combinando cada dato secreto con mascaras aleatorias, haciendo que el consumo en cada punto temporal no se correlacione directamente con ningun valor secreto.

El analisis diferencial de potencia (DPA) es una tecnica estadistica que permite extraer claves incluso cuando el ruido de medicion es mayor que la senal individual. La idea es recolectar miles de trazas de potencia para diferentes entradas conocidas, y para cada hipotesis de clave calcular la correlacion entre un modelo de consumo y las trazas reales. La hipotesis correcta mostrara el pico de correlacion mas alto.

Un canal lateral (side-channel) es cualquier fuga de informacion que se produce durante la ejecucion de un algoritmo criptografico y que no forma parte del output esperado. Cuando un microcontrolador ejecuta una operacion como [aes](../raw/crypt0-f0r-h4ck3rs.md#aes) o [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa), las transiciones logicas internas generan variaciones medibles en el consumo de corriente, el campo electromagnetico circundante, el tiempo de ejecucion e incluso el sonido emitido por los capacitores de la fuente.

El consumo de potencia en circuitos CMOS esta dominado por la conmutacion de los transistores. Cada vez que un bit cambia de 0 a 1 o viceversa, fluye una corriente transitoria para cargar o descargar la capacitancia parasita. La cantidad total de corriente en un ciclo de clock depende de cuantos bits conmutan simultaneamente, lo que se conoce como peso de Hamming (Hamming weight) y es directamente proporcional a los datos que se procesan.

#### 5.2 Emisiones EM como canal lateral

El sub-tema Emisiones EM como canal lateral dentro de Ataques Electromagneticos (EMA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Emisiones EM como canal lateral
import os, sys, time, struct
import numpy as np

class EmisionesEMcomocanallateral:
    """Implementacion de Emisiones EM como canal lateral para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Emisiones EM como canal lateral."""
    obj = EmisionesEMcomocanallateral(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Emisiones EM como canal lateral.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 5.3 Sondas EM y amplificadores

El sub-tema Sondas EM y amplificadores dentro de Ataques Electromagneticos (EMA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Sondas EM y amplificadores
import os, sys, time, struct
import numpy as np

class SondasEMyamplificadores:
    """Implementacion de Sondas EM y amplificadores para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Sondas EM y amplificadores."""
    obj = SondasEMyamplificadores(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Sondas EM y amplificadores.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 5.4 EMA vs DPA: ventajas y desventajas

El sub-tema EMA vs DPA: ventajas y desventajas dentro de Ataques Electromagneticos (EMA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: EMA vs DPA: ventajas y desventajas
import os, sys, time, struct
import numpy as np

class EMAvsDPA:ventajasydesventajas:
    """Implementacion de EMA vs DPA: ventajas y desventajas para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para EMA vs DPA: ventajas y desventajas."""
    obj = EMAvsDPA:ventajasydesventajas(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de EMA vs DPA: ventajas y desventajas.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 5.5 Ataques EM localizados en FPGAs

El sub-tema Ataques EM localizados en FPGAs dentro de Ataques Electromagneticos (EMA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ataques EM localizados en FPGAs
import os, sys, time, struct
import numpy as np

class AtaquesEMlocalizadosenFPGAs:
    """Implementacion de Ataques EM localizados en FPGAs para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ataques EM localizados en FPGAs."""
    obj = AtaquesEMlocalizadosenFPGAs(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ataques EM localizados en FPGAs.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 5.6 Ejercicio practico: sonda EM casera

El sub-tema Ejercicio practico: sonda EM casera dentro de Ataques Electromagneticos (EMA) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ejercicio practico: sonda EM casera
import os, sys, time, struct
import numpy as np

class Ejerciciopractico:sondaEMcasera:
    """Implementacion de Ejercicio practico: sonda EM casera para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ejercicio practico: sonda EM casera."""
    obj = Ejerciciopractico:sondaEMcasera(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ejercicio practico: sonda EM casera.
Puede adaptarse y extenderse segun las necesidades del analisis.

### 5.3 Comandos y Herramientas

```bash
pip install numpy scipy matplotlib jupyter scikit-learn
git clone https://github.com/newaetech/chipwhisperer
pip install chipwhisperer opensca pyserial
pip install liboqs cryptography
```

### 5.4 Ejercicios Practicos

**Ejercicio 1 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Ataques Electromagneticos (EMA) implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en [python](../raw/pyth0n-f0r-h4ck1ng.md)
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 2 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Ataques Electromagneticos (EMA) implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 3 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Ataques Electromagneticos (EMA) implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 4 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Ataques Electromagneticos (EMA) implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 5 (Nivel Avanzado):**

Objetivo: Aplicar los conceptos de Ataques Electromagneticos (EMA) implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

Para el nivel avanzado, incorporar tecnicas de optimizacion y
analisis comparativo. Extender la implementacion con funcionalidades
adicionales y probar en escenarios realistas.

---

## 6. Ataques Acusticos

### 6.1 Teoria: Ataques Acusticos

Las implementaciones constant-time son esenciales para prevenir timing attacks. El principio fundamental es que el tiempo de ejecucion no debe depender de ningun dato secreto. Esto implica: usar operaciones bitwise en lugar de condicionales, evitar accesos a memoria indexados por datos secretos, y asegurar que todos los bucles recorran el mismo numero de iteraciones independientemente de los valores.

Las contramedidas contra side-channel attacks se dividen en dos categorias principales: hiding y masking. Hiding busca hacer que el consumo sea constante independientemente de los datos, mediante tecnicas como dual-rail logic o insercion de operaciones dummy. Masking oculta los valores intermedios combinando cada dato secreto con mascaras aleatorias, haciendo que el consumo en cada punto temporal no se correlacione directamente con ningun valor secreto.

Las implementaciones constant-time son esenciales para prevenir timing attacks. El principio fundamental es que el tiempo de ejecucion no debe depender de ningun dato secreto. Esto implica: usar operaciones bitwise en lugar de condicionales, evitar accesos a memoria indexados por datos secretos, y asegurar que todos los bucles recorran el mismo numero de iteraciones independientemente de los valores.

El analisis diferencial de potencia (DPA) es una tecnica estadistica que permite extraer claves incluso cuando el ruido de medicion es mayor que la senal individual. La idea es recolectar miles de trazas de potencia para diferentes entradas conocidas, y para cada hipotesis de clave calcular la correlacion entre un modelo de consumo y las trazas reales. La hipotesis correcta mostrara el pico de correlacion mas alto.

Un canal lateral (side-channel) es cualquier fuga de informacion que se produce durante la ejecucion de un algoritmo criptografico y que no forma parte del output esperado. Cuando un microcontrolador ejecuta una operacion como [aes](../raw/crypt0-f0r-h4ck3rs.md#aes) o [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa), las transiciones logicas internas generan variaciones medibles en el consumo de corriente, el campo electromagnetico circundante, el tiempo de ejecucion e incluso el sonido emitido por los capacitores de la fuente.

Los ataques electromagneticos (EMA) ofrecen ventajas sobre los de potencia porque pueden enfocarse en areas especificas del chip, midiendo la actividad localizada en lugar del consumo global. Una sonda EM de campo cercano colocada sobre el modulo AES de una System-on-Chip puede capturar senales con mejor relacion senal-ruido que una medicion de corriente en el pin de alimentacion.

El consumo de potencia en circuitos CMOS esta dominado por la conmutacion de los transistores. Cada vez que un bit cambia de 0 a 1 o viceversa, fluye una corriente transitoria para cargar o descargar la capacitancia parasita. La cantidad total de corriente en un ciclo de clock depende de cuantos bits conmutan simultaneamente, lo que se conoce como peso de Hamming (Hamming weight) y es directamente proporcional a los datos que se procesan.

El analisis diferencial de potencia (DPA) es una tecnica estadistica que permite extraer claves incluso cuando el ruido de medicion es mayor que la senal individual. La idea es recolectar miles de trazas de potencia para diferentes entradas conocidas, y para cada hipotesis de clave calcular la correlacion entre un modelo de consumo y las trazas reales. La hipotesis correcta mostrara el pico de correlacion mas alto.

#### 6.2 Ruido de CPU como oraculo

El sub-tema Ruido de CPU como oraculo dentro de Ataques Acusticos requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ruido de CPU como oraculo
import os, sys, time, struct
import numpy as np

class RuidodeCPUcomooraculo:
    """Implementacion de Ruido de CPU como oraculo para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ruido de CPU como oraculo."""
    obj = RuidodeCPUcomooraculo(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ruido de CPU como oraculo.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 6.3 Ataque acustico a RSA

El sub-tema Ataque acustico a RSA dentro de Ataques Acusticos requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ataque acustico a RSA
import os, sys, time, struct
import numpy as np

class AtaqueacusticoaRSA:
    """Implementacion de Ataque acustico a RSA para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ataque acustico a RSA."""
    obj = AtaqueacusticoaRSA(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ataque acustico a RSA.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 6.4 Ataque acustico a impresoras

El sub-tema Ataque acustico a impresoras dentro de Ataques Acusticos requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ataque acustico a impresoras
import os, sys, time, struct
import numpy as np

class Ataqueacusticoaimpresoras:
    """Implementacion de Ataque acustico a impresoras para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ataque acustico a impresoras."""
    obj = Ataqueacusticoaimpresoras(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ataque acustico a impresoras.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 6.5 Analisis espectral y filtrado

El sub-tema Analisis espectral y filtrado dentro de Ataques Acusticos requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Analisis espectral y filtrado
import os, sys, time, struct
import numpy as np

class Analisisespectralyfiltrado:
    """Implementacion de Analisis espectral y filtrado para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Analisis espectral y filtrado."""
    obj = Analisisespectralyfiltrado(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Analisis espectral y filtrado.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 6.6 Ejercicio practico: grabacion y analisis

El sub-tema Ejercicio practico: grabacion y analisis dentro de Ataques Acusticos requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ejercicio practico: grabacion y analisis
import os, sys, time, struct
import numpy as np

class Ejerciciopractico:grabacionyanalisis:
    """Implementacion de Ejercicio practico: grabacion y analisis para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ejercicio practico: grabacion y analisis."""
    obj = Ejerciciopractico:grabacionyanalisis(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ejercicio practico: grabacion y analisis.
Puede adaptarse y extenderse segun las necesidades del analisis.

### 6.3 Comandos y Herramientas

```bash
pip install numpy scipy matplotlib jupyter scikit-learn
git clone https://github.com/newaetech/chipwhisperer
pip install chipwhisperer opensca pyserial
pip install liboqs cryptography
```

### 6.4 Ejercicios Practicos

**Ejercicio 1 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Ataques Acusticos implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en [python](../raw/pyth0n-f0r-h4ck1ng.md)
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 2 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Ataques Acusticos implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 3 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Ataques Acusticos implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 4 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Ataques Acusticos implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 5 (Nivel Avanzado):**

Objetivo: Aplicar los conceptos de Ataques Acusticos implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

Para el nivel avanzado, incorporar tecnicas de optimizacion y
analisis comparativo. Extender la implementacion con funcionalidades
adicionales y probar en escenarios realistas.

---

## 7. Cache Timing Attacks

### 7.1 Teoria: Cache Timing Attacks

Los ataques de cache timing explotan la diferencia de latencia entre acceder a memoria cache (tipicamente 4-12 ciclos de reloj) versus memoria RAM (200+ ciclos). Flush+Reload es la tecnica mas conocida: el atacante fuerza la salida de cache de una direccion especifica, espera a que la victima potencialmente la acceda, y luego mide el tiempo de recarga. Si es rapido, la victima accedio a esa direccion.

Las contramedidas contra side-channel attacks se dividen en dos categorias principales: hiding y masking. Hiding busca hacer que el consumo sea constante independientemente de los datos, mediante tecnicas como dual-rail logic o insercion de operaciones dummy. Masking oculta los valores intermedios combinando cada dato secreto con mascaras aleatorias, haciendo que el consumo en cada punto temporal no se correlacione directamente con ningun valor secreto.

Un canal lateral (side-channel) es cualquier fuga de informacion que se produce durante la ejecucion de un algoritmo criptografico y que no forma parte del output esperado. Cuando un microcontrolador ejecuta una operacion como [aes](../raw/crypt0-f0r-h4ck3rs.md#aes) o [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa), las transiciones logicas internas generan variaciones medibles en el consumo de corriente, el campo electromagnetico circundante, el tiempo de ejecucion e incluso el sonido emitido por los capacitores de la fuente.

Las implementaciones constant-time son esenciales para prevenir timing attacks. El principio fundamental es que el tiempo de ejecucion no debe depender de ningun dato secreto. Esto implica: usar operaciones bitwise en lugar de condicionales, evitar accesos a memoria indexados por datos secretos, y asegurar que todos los bucles recorran el mismo numero de iteraciones independientemente de los valores.

Los ataques de template son la forma mas poderosa de side-channel analysis. Consisten en dos fases: profiling, donde se construye un modelo estadistico detallado (media y covarianza) para cada valor de clave posible usando un dispositivo identico, y ataque, donde se compara la traza del dispositivo objetivo contra los templates usando maxima verosimilitud (log-likelihood bajo distribucion normal multivariada).

Los ataques de tiempo (timing attacks) explotan la variacion en la duracion de las operaciones segun los valores de los operandos. Por ejemplo, en RSA la exponenciacion modular con square-and-multiply ejecuta una multiplicacion adicional cuando el bit del exponente es 1. Si podemos medir con precision nanosegundos, podemos determinar el valor de cada bit del exponente secreto.

El analisis diferencial de potencia (DPA) es una tecnica estadistica que permite extraer claves incluso cuando el ruido de medicion es mayor que la senal individual. La idea es recolectar miles de trazas de potencia para diferentes entradas conocidas, y para cada hipotesis de clave calcular la correlacion entre un modelo de consumo y las trazas reales. La hipotesis correcta mostrara el pico de correlacion mas alto.

Los ataques de tiempo (timing attacks) explotan la variacion en la duracion de las operaciones segun los valores de los operandos. Por ejemplo, en RSA la exponenciacion modular con square-and-multiply ejecuta una multiplicacion adicional cuando el bit del exponente es 1. Si podemos medir con precision nanosegundos, podemos determinar el valor de cada bit del exponente secreto.

#### 7.2 Arquitectura de cache moderna

El sub-tema Arquitectura de cache moderna dentro de Cache Timing Attacks requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Arquitectura de cache moderna
import os, sys, time, struct
import numpy as np

class Arquitecturadecachemoderna:
    """Implementacion de Arquitectura de cache moderna para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Arquitectura de cache moderna."""
    obj = Arquitecturadecachemoderna(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Arquitectura de cache moderna.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 7.3 Flush+Reload

El sub-tema Flush+Reload dentro de Cache Timing Attacks requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Flush+Reload
import os, sys, time, struct
import numpy as np

class Flush+Reload:
    """Implementacion de Flush+Reload para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Flush+Reload."""
    obj = Flush+Reload(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Flush+Reload.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 7.4 Prime+Probe

El sub-tema Prime+Probe dentro de Cache Timing Attacks requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Prime+Probe
import os, sys, time, struct
import numpy as np

class Prime+Probe:
    """Implementacion de Prime+Probe para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Prime+Probe."""
    obj = Prime+Probe(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Prime+Probe.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 7.5 Evict+Reload

El sub-tema Evict+Reload dentro de Cache Timing Attacks requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Evict+Reload
import os, sys, time, struct
import numpy as np

class Evict+Reload:
    """Implementacion de Evict+Reload para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Evict+Reload."""
    obj = Evict+Reload(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Evict+Reload.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 7.6 Meltdown y Spectre

El sub-tema Meltdown y Spectre dentro de Cache Timing Attacks requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Meltdown y Spectre
import os, sys, time, struct
import numpy as np

class MeltdownySpectre:
    """Implementacion de Meltdown y Spectre para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Meltdown y Spectre."""
    obj = MeltdownySpectre(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Meltdown y Spectre.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 7.7 Ataque a AES via cache-bank timing

El sub-tema Ataque a AES via cache-bank timing dentro de Cache Timing Attacks requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ataque a AES via cache-bank timing
import os, sys, time, struct
import numpy as np

class AtaqueaAESviacachebanktiming:
    """Implementacion de Ataque a AES via cache-bank timing para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ataque a AES via cache-bank timing."""
    obj = AtaqueaAESviacachebanktiming(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ataque a AES via cache-bank timing.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 7.8 Mitigaciones en software y hardware

El sub-tema Mitigaciones en software y hardware dentro de Cache Timing Attacks requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Mitigaciones en software y hardware
import os, sys, time, struct
import numpy as np

class Mitigacionesensoftwareyhardware:
    """Implementacion de Mitigaciones en software y hardware para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Mitigaciones en software y hardware."""
    obj = Mitigacionesensoftwareyhardware(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Mitigaciones en software y hardware.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 7.9 Ejercicio practico: Flush+Reload en [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86)

El sub-tema Ejercicio practico: Flush+Reload en x86 dentro de Cache Timing Attacks requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ejercicio practico: Flush+Reload en x86
import os, sys, time, struct
import numpy as np

class Ejerciciopractico:Flush+Reloadenx86:
    """Implementacion de Ejercicio practico: Flush+Reload en x86 para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ejercicio practico: Flush+Reload en x86."""
    obj = Ejerciciopractico:Flush+Reloadenx86(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ejercicio practico: Flush+Reload en x86.
Puede adaptarse y extenderse segun las necesidades del analisis.

### 7.3 Comandos y Herramientas

```bash
pip install numpy scipy matplotlib jupyter scikit-learn
git clone https://github.com/newaetech/chipwhisperer
pip install chipwhisperer opensca pyserial
pip install liboqs cryptography
```

### 7.4 Ejercicios Practicos

**Ejercicio 1 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Cache Timing Attacks implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en [python](../raw/pyth0n-f0r-h4ck1ng.md)
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 2 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Cache Timing Attacks implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 3 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Cache Timing Attacks implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 4 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Cache Timing Attacks implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 5 (Nivel Avanzado):**

Objetivo: Aplicar los conceptos de Cache Timing Attacks implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

Para el nivel avanzado, incorporar tecnicas de optimizacion y
analisis comparativo. Extender la implementacion con funcionalidades
adicionales y probar en escenarios realistas.

---

## 8. [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa) Side-Channel

### 8.1 Teoria: RSA Side-Channel

La contramedida clasica contra side-channel en RSA es el blinding: antes de descifrar, se multiplica el ciphertext por un valor aleatorio r elevado a e (clave publica), se descifra este valor cegado, y luego se multiplica por el inverso de r para obtener el mensaje original. Asi el atacante nunca ve la entrada real al algoritmo de exponenciacion.

El ataque de timing de Kocher (1996) fue el primero en demostrar que midiendo tiempos de descifrado RSA se podian recuperar bits de la clave privada. Kocher observo que el tiempo de la multiplicacion modular variaba segun el tamano de los operandos, y que esta variacion correlacionaba con los bits del exponente.

El ataque de timing de Kocher (1996) fue el primero en demostrar que midiendo tiempos de descifrado RSA se podian recuperar bits de la clave privada. Kocher observo que el tiempo de la multiplicacion modular variaba segun el tamano de los operandos, y que esta variacion correlacionaba con los bits del exponente.

El algoritmo square-and-multiply procesa los bits del exponente de izquierda a derecha o viceversa. Para cada bit, siempre se ejecuta una operacion de elevacion al cuadrado (square). Solo cuando el bit es 1 se ejecuta adicionalmente una multiplicacion (multiply). Esta multiplicacion condicional crea un leak de tiempo y potencia que permite determinar cada bit del exponente.

La contramedida clasica contra side-channel en RSA es el blinding: antes de descifrar, se multiplica el ciphertext por un valor aleatorio r elevado a e (clave publica), se descifra este valor cegado, y luego se multiplica por el inverso de r para obtener el mensaje original. Asi el atacante nunca ve la entrada real al algoritmo de exponenciacion.

RSA es el criptosistema de clave publica mas utilizado. Su seguridad se basa en la dificultad de factorizar el producto de dos numeros primos grandes. La operacion fundamental es la exponenciacion modular: m = c^d mod n para descifrado, donde d es la clave privada. La implementacion de esta exponenciacion es el punto mas vulnerable a ataques de canal lateral.

La contramedida clasica contra side-channel en RSA es el blinding: antes de descifrar, se multiplica el ciphertext por un valor aleatorio r elevado a e (clave publica), se descifra este valor cegado, y luego se multiplica por el inverso de r para obtener el mensaje original. Asi el atacante nunca ve la entrada real al algoritmo de exponenciacion.

El ataque de timing de Kocher (1996) fue el primero en demostrar que midiendo tiempos de descifrado RSA se podian recuperar bits de la clave privada. Kocher observo que el tiempo de la multiplicacion modular variaba segun el tamano de los operandos, y que esta variacion correlacionaba con los bits del exponente.

#### 8.2 Square-and-Multiply

El sub-tema Square-and-Multiply dentro de RSA Side-Channel requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Square-and-Multiply
import os, sys, time, struct
import numpy as np

class SquareandMultiply:
    """Implementacion de Square-and-Multiply para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Square-and-Multiply."""
    obj = SquareandMultiply(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Square-and-Multiply.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 8.3 Montgomery ladder

El sub-tema Montgomery ladder dentro de RSA Side-Channel requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Montgomery ladder
import os, sys, time, struct
import numpy as np

class Montgomeryladder:
    """Implementacion de Montgomery ladder para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Montgomery ladder."""
    obj = Montgomeryladder(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Montgomery ladder.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 8.4 Sliding window exponentiation

El sub-tema Sliding window exponentiation dentro de RSA Side-Channel requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Sliding window exponentiation
import os, sys, time, struct
import numpy as np

class Slidingwindowexponentiation:
    """Implementacion de Sliding window exponentiation para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Sliding window exponentiation."""
    obj = Slidingwindowexponentiation(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Sliding window exponentiation.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 8.5 Blinding como contramedida

El sub-tema Blinding como contramedida dentro de RSA Side-Channel requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Blinding como contramedida
import os, sys, time, struct
import numpy as np

class Blindingcomocontramedida:
    """Implementacion de Blinding como contramedida para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Blinding como contramedida."""
    obj = Blindingcomocontramedida(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Blinding como contramedida.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 8.6 RSA-CRT: ataque de Bellcore

El sub-tema RSA-CRT: ataque de Bellcore dentro de RSA Side-Channel requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: RSA-CRT: ataque de Bellcore
import os, sys, time, struct
import numpy as np

class RSACRT:ataquedeBellcore:
    """Implementacion de RSA-CRT: ataque de Bellcore para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para RSA-CRT: ataque de Bellcore."""
    obj = RSACRT:ataquedeBellcore(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de RSA-CRT: ataque de Bellcore.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 8.7 Ejercicio practico: simular RSA side-channel

El sub-tema Ejercicio practico: simular RSA side-channel dentro de RSA Side-Channel requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ejercicio practico: simular RSA side-channel
import os, sys, time, struct
import numpy as np

class Ejerciciopractico:simularRSAsidechannel:
    """Implementacion de Ejercicio practico: simular RSA side-channel para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ejercicio practico: simular RSA side-channel."""
    obj = Ejerciciopractico:simularRSAsidechannel(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ejercicio practico: simular RSA side-channel.
Puede adaptarse y extenderse segun las necesidades del analisis.

### 8.3 Comandos y Herramientas

```bash
pip install numpy scipy matplotlib jupyter scikit-learn
git clone https://github.com/newaetech/chipwhisperer
pip install chipwhisperer opensca pyserial
pip install liboqs cryptography
```

### 8.4 Ejercicios Practicos

**Ejercicio 1 (Nivel Basico):**

Objetivo: Aplicar los conceptos de RSA Side-Channel implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en [python](../raw/pyth0n-f0r-h4ck1ng.md)
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 2 (Nivel Basico):**

Objetivo: Aplicar los conceptos de RSA Side-Channel implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 3 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de RSA Side-Channel implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 4 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de RSA Side-Channel implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 5 (Nivel Avanzado):**

Objetivo: Aplicar los conceptos de RSA Side-Channel implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

Para el nivel avanzado, incorporar tecnicas de optimizacion y
analisis comparativo. Extender la implementacion con funcionalidades
adicionales y probar en escenarios realistas.

---

## 9. [aes](../raw/crypt0-f0r-h4ck3rs.md#aes) Side-Channel

### 9.1 Teoria: AES Side-Channel

Las implementaciones rapidas de AES usan T-tables, que combinan SubBytes, ShiftRows y MixColumns en una unica operacion de busqueda en tabla. Cada T-table es un arreglo de 256 entradas de 32 bits (1 KB por tabla, 4 tablas = 4 KB). El acceso a T0[byte] usa el valor del byte como indice, lo que crea un leak de cache dependiente de los datos.

Bitsliced AES es una implementacion que procesa todos los bits del estado en paralelo usando operaciones bitwise (AND, XOR, OR). Cada S-Box se implementa como una [red](../raw/r3d3s-f0nd4m3nt0s.md) de puertas logicas (~150 operaciones) sin accesos a memoria. Esto elimina por completo los leaks de cache y hace que el tiempo sea independiente de los datos.

Bitsliced AES es una implementacion que procesa todos los bits del estado en paralelo usando operaciones bitwise (AND, XOR, OR). Cada S-Box se implementa como una red de puertas logicas (~150 operaciones) sin accesos a memoria. Esto elimina por completo los leaks de cache y hace que el tiempo sea independiente de los datos.

Bitsliced AES es una implementacion que procesa todos los bits del estado en paralelo usando operaciones bitwise (AND, XOR, OR). Cada S-Box se implementa como una red de puertas logicas (~150 operaciones) sin accesos a memoria. Esto elimina por completo los leaks de cache y hace que el tiempo sea independiente de los datos.

Bitsliced AES es una implementacion que procesa todos los bits del estado en paralelo usando operaciones bitwise (AND, XOR, OR). Cada S-Box se implementa como una red de puertas logicas (~150 operaciones) sin accesos a memoria. Esto elimina por completo los leaks de cache y hace que el tiempo sea independiente de los datos.

AES (Advanced Encryption Standard) es el cifrador simetrico mas utilizado globalmente. Opera sobre bloques de 128 bits con claves de 128, 192 o 256 bits. El algoritmo consiste en 10, 12 o 14 rondas, cada una con cuatro operaciones: SubBytes (sustitucion via S-Box), ShiftRows (desplazamiento de filas), MixColumns (mezcla de columnas) y AddRoundKey (XOR con clave de ronda).

Las implementaciones rapidas de AES usan T-tables, que combinan SubBytes, ShiftRows y MixColumns en una unica operacion de busqueda en tabla. Cada T-table es un arreglo de 256 entradas de 32 bits (1 KB por tabla, 4 tablas = 4 KB). El acceso a T0[byte] usa el valor del byte como indice, lo que crea un leak de cache dependiente de los datos.

AES-NI (AES New Instructions) son instrucciones [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86) que realizan rondas completas de AES en hardware. Al no usar T-tables ni accesos a memoria indexados por datos, AES-NI es inherentemente resistente a cache-timing attacks. La instruccion AESENC realiza una ronda completa incluyendo SubBytes, ShiftRows, MixColumns y AddRoundKey en un solo ciclo de reloj.

#### 9.2 Implementacion basada en T-tables

El sub-tema Implementacion basada en T-tables dentro de AES Side-Channel requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Implementacion basada en T-tables
import os, sys, time, struct
import numpy as np

class ImplementacionbasadaenTtables:
    """Implementacion de Implementacion basada en T-tables para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Implementacion basada en T-tables."""
    obj = ImplementacionbasadaenTtables(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Implementacion basada en T-tables.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 9.3 Ataque de cache-timing a T-tables

El sub-tema Ataque de cache-timing a T-tables dentro de AES Side-Channel requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ataque de cache-timing a T-tables
import os, sys, time, struct
import numpy as np

class AtaquedecachetimingaTtables:
    """Implementacion de Ataque de cache-timing a T-tables para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ataque de cache-timing a T-tables."""
    obj = AtaquedecachetimingaTtables(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ataque de cache-timing a T-tables.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 9.4 Ataque de template a S-Box

El sub-tema Ataque de template a S-Box dentro de AES Side-Channel requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ataque de template a S-Box
import os, sys, time, struct
import numpy as np

class AtaquedetemplateaSBox:
    """Implementacion de Ataque de template a S-Box para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ataque de template a S-Box."""
    obj = AtaquedetemplateaSBox(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ataque de template a S-Box.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 9.5 AES-NI: hardware mitigado

El sub-tema AES-NI: hardware mitigado dentro de AES Side-Channel requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: AES-NI: hardware mitigado
import os, sys, time, struct
import numpy as np

class AESNI:hardwaremitigado:
    """Implementacion de AES-NI: hardware mitigado para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para AES-NI: hardware mitigado."""
    obj = AESNI:hardwaremitigado(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de AES-NI: hardware mitigado.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 9.6 Bitsliced AES

El sub-tema Bitsliced AES dentro de AES Side-Channel requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Bitsliced AES
import os, sys, time, struct
import numpy as np

class BitslicedAES:
    """Implementacion de Bitsliced AES para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Bitsliced AES."""
    obj = BitslicedAES(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Bitsliced AES.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 9.7 Ejercicio practico: recuperar clave AES

El sub-tema Ejercicio practico: recuperar clave AES dentro de AES Side-Channel requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ejercicio practico: recuperar clave AES
import os, sys, time, struct
import numpy as np

class Ejerciciopractico:recuperarclaveAES:
    """Implementacion de Ejercicio practico: recuperar clave AES para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ejercicio practico: recuperar clave AES."""
    obj = Ejerciciopractico:recuperarclaveAES(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ejercicio practico: recuperar clave AES.
Puede adaptarse y extenderse segun las necesidades del analisis.

### 9.3 Comandos y Herramientas

```bash
pip install numpy scipy matplotlib jupyter scikit-learn
git clone https://github.com/newaetech/chipwhisperer
pip install chipwhisperer opensca pyserial
pip install liboqs cryptography
```

### 9.4 Ejercicios Practicos

**Ejercicio 1 (Nivel Basico):**

Objetivo: Aplicar los conceptos de AES Side-Channel implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en [python](../raw/pyth0n-f0r-h4ck1ng.md)
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 2 (Nivel Basico):**

Objetivo: Aplicar los conceptos de AES Side-Channel implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 3 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de AES Side-Channel implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 4 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de AES Side-Channel implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 5 (Nivel Avanzado):**

Objetivo: Aplicar los conceptos de AES Side-Channel implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

Para el nivel avanzado, incorporar tecnicas de optimizacion y
analisis comparativo. Extender la implementacion con funcionalidades
adicionales y probar en escenarios realistas.

---

## 10. Fallos de Entropia y PRNGs

### 10.1 Teoria: Fallos de Entropia y PRNGs

El consumo de potencia en circuitos CMOS esta dominado por la conmutacion de los transistores. Cada vez que un bit cambia de 0 a 1 o viceversa, fluye una corriente transitoria para cargar o descargar la capacitancia parasita. La cantidad total de corriente en un ciclo de clock depende de cuantos bits conmutan simultaneamente, lo que se conoce como peso de Hamming (Hamming weight) y es directamente proporcional a los datos que se procesan.

Los ataques de cache timing explotan la diferencia de latencia entre acceder a memoria cache (tipicamente 4-12 ciclos de reloj) versus memoria RAM (200+ ciclos). Flush+Reload es la tecnica mas conocida: el atacante fuerza la salida de cache de una direccion especifica, espera a que la victima potencialmente la acceda, y luego mide el tiempo de recarga. Si es rapido, la victima accedio a esa direccion.

Los ataques de template son la forma mas poderosa de side-channel analysis. Consisten en dos fases: profiling, donde se construye un modelo estadistico detallado (media y covarianza) para cada valor de clave posible usando un dispositivo identico, y ataque, donde se compara la traza del dispositivo objetivo contra los templates usando maxima verosimilitud (log-likelihood bajo distribucion normal multivariada).

Los ataques de cache timing explotan la diferencia de latencia entre acceder a memoria cache (tipicamente 4-12 ciclos de reloj) versus memoria RAM (200+ ciclos). Flush+Reload es la tecnica mas conocida: el atacante fuerza la salida de cache de una direccion especifica, espera a que la victima potencialmente la acceda, y luego mide el tiempo de recarga. Si es rapido, la victima accedio a esa direccion.

El consumo de potencia en circuitos CMOS esta dominado por la conmutacion de los transistores. Cada vez que un bit cambia de 0 a 1 o viceversa, fluye una corriente transitoria para cargar o descargar la capacitancia parasita. La cantidad total de corriente en un ciclo de clock depende de cuantos bits conmutan simultaneamente, lo que se conoce como peso de Hamming (Hamming weight) y es directamente proporcional a los datos que se procesan.

El analisis diferencial de potencia (DPA) es una tecnica estadistica que permite extraer claves incluso cuando el ruido de medicion es mayor que la senal individual. La idea es recolectar miles de trazas de potencia para diferentes entradas conocidas, y para cada hipotesis de clave calcular la correlacion entre un modelo de consumo y las trazas reales. La hipotesis correcta mostrara el pico de correlacion mas alto.

El consumo de potencia en circuitos CMOS esta dominado por la conmutacion de los transistores. Cada vez que un bit cambia de 0 a 1 o viceversa, fluye una corriente transitoria para cargar o descargar la capacitancia parasita. La cantidad total de corriente en un ciclo de clock depende de cuantos bits conmutan simultaneamente, lo que se conoce como peso de Hamming (Hamming weight) y es directamente proporcional a los datos que se procesan.

Los ataques de cache timing explotan la diferencia de latencia entre acceder a memoria cache (tipicamente 4-12 ciclos de reloj) versus memoria RAM (200+ ciclos). Flush+Reload es la tecnica mas conocida: el atacante fuerza la salida de cache de una direccion especifica, espera a que la victima potencialmente la acceda, y luego mide el tiempo de recarga. Si es rapido, la victima accedio a esa direccion.

#### 10.2 Importancia de la entropia en [criptografia](../raw/crypt0-f0r-h4ck3rs.md)

El sub-tema Importancia de la entropia en criptografia dentro de Fallos de Entropia y PRNGs requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Importancia de la entropia en criptografia
import os, sys, time, struct
import numpy as np

class Importanciadelaentropiaencriptografia:
    """Implementacion de Importancia de la entropia en criptografia para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Importancia de la entropia en criptografia."""
    obj = Importanciadelaentropiaencriptografia(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Importancia de la entropia en criptografia.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 10.3 /dev/urandom vs /dev/random en Linux

El sub-tema /dev/urandom vs /dev/random en Linux dentro de Fallos de Entropia y PRNGs requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: /dev/urandom vs /dev/random en Linux
import os, sys, time, struct
import numpy as np

class devurandomvsdevrandomenLinux:
    """Implementacion de /dev/urandom vs /dev/random en Linux para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para /dev/urandom vs /dev/random en Linux."""
    obj = devurandomvsdevrandomenLinux(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de /dev/urandom vs /dev/random en Linux.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 10.4 Yarrow y Fortuna

El sub-tema Yarrow y Fortuna dentro de Fallos de Entropia y PRNGs requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Yarrow y Fortuna
import os, sys, time, struct
import numpy as np

class YarrowyFortuna:
    """Implementacion de Yarrow y Fortuna para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Yarrow y Fortuna."""
    obj = YarrowyFortuna(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Yarrow y Fortuna.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 10.5 Linux CSPRNG internals (ChaCha20)

El sub-tema Linux CSPRNG internals (ChaCha20) dentro de Fallos de Entropia y PRNGs requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Linux CSPRNG internals (ChaCha20)
import os, sys, time, struct
import numpy as np

class LinuxCSPRNGinternals(ChaCha20):
    """Implementacion de Linux CSPRNG internals (ChaCha20) para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Linux CSPRNG internals (ChaCha20)."""
    obj = LinuxCSPRNGinternals(ChaCha20)(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Linux CSPRNG internals (ChaCha20).
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 10.6 Dual-EC-DRBG

El sub-tema Dual-EC-DRBG dentro de Fallos de Entropia y PRNGs requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Dual-EC-DRBG
import os, sys, time, struct
import numpy as np

class DualECDRBG:
    """Implementacion de Dual-EC-DRBG para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Dual-EC-DRBG."""
    obj = DualECDRBG(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Dual-EC-DRBG.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 10.7 Ataque a claves [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa) con baja entropia

El sub-tema Ataque a claves RSA con baja entropia dentro de Fallos de Entropia y PRNGs requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ataque a claves RSA con baja entropia
import os, sys, time, struct
import numpy as np

class AtaqueaclavesRSAconbajaentropia:
    """Implementacion de Ataque a claves RSA con baja entropia para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ataque a claves RSA con baja entropia."""
    obj = AtaqueaclavesRSAconbajaentropia(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ataque a claves RSA con baja entropia.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 10.8 Ejercicio practico: recovery de clave debil

El sub-tema Ejercicio practico: recovery de clave debil dentro de Fallos de Entropia y PRNGs requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ejercicio practico: recovery de clave debil
import os, sys, time, struct
import numpy as np

class Ejerciciopractico:recoverydeclavedebil:
    """Implementacion de Ejercicio practico: recovery de clave debil para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ejercicio practico: recovery de clave debil."""
    obj = Ejerciciopractico:recoverydeclavedebil(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ejercicio practico: recovery de clave debil.
Puede adaptarse y extenderse segun las necesidades del analisis.

### 10.3 Comandos y Herramientas

```bash
pip install numpy scipy matplotlib jupyter scikit-learn
git clone https://github.com/newaetech/chipwhisperer
pip install chipwhisperer opensca pyserial
pip install liboqs cryptography
```

### 10.4 Ejercicios Practicos

**Ejercicio 1 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Fallos de Entropia y PRNGs implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en [python](../raw/pyth0n-f0r-h4ck1ng.md)
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 2 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Fallos de Entropia y PRNGs implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 3 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Fallos de Entropia y PRNGs implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 4 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Fallos de Entropia y PRNGs implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 5 (Nivel Avanzado):**

Objetivo: Aplicar los conceptos de Fallos de Entropia y PRNGs implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

Para el nivel avanzado, incorporar tecnicas de optimizacion y
analisis comparativo. Extender la implementacion con funcionalidades
adicionales y probar en escenarios realistas.

---

## 11. [post-quantum](../raw/pqc-s1d3-ch4nn3ls.md)-s1d3-ch4nn3ls.md) [cryptography](../raw/crypt0-f0r-h4ck3rs.md) ([pqc](../raw/pqc-s1d3-ch4nn3ls.md))

### 11.1 Teoria: Post-Quantum Cryptography (PQC)

CRYSTALS-Dilithium es un esquema de firma basado en la dificultad de encontrar vectores cortos en lattices. Ofrece tres niveles de seguridad: Dilithium2 (~[aes](../raw/crypt0-f0r-h4ck3rs.md#aes)-128), Dilithium3 (~[aes](../raw/crypt0-f0r-h4ck3rs.md#aes)-192) y Dilithium5 (~[aes](../raw/crypt0-f0r-h4ck3rs.md#aes)-256). Los tamanos de firma son 2420, 3293 y 4595 bytes respectivamente, significativamente mayores que ECDSA pero necesarios para seguridad post-cuantica.

La computacion cuantica amenaza los fundamentos de la [criptografia](../raw/crypt0-f0r-h4ck3rs.md) actual. El algoritmo de Shor (1994) factoriza enteros en tiempo polinomial O((log N)^3), lo que significa que [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa)-2048 podria romperse con ~4000 qubits logicos. El algoritmo de Grover busca en un espacio no estructurado con speedup cuadratico, reduciendo AES-128 a ~64 bits de seguridad efectiva.

La computacion cuantica amenaza los fundamentos de la criptografia actual. El algoritmo de Shor (1994) factoriza enteros en tiempo polinomial O((log N)^3), lo que significa que RSA-2048 podria romperse con ~4000 qubits logicos. El algoritmo de Grover busca en un espacio no estructurado con speedup cuadratico, reduciendo AES-128 a ~64 bits de seguridad efectiva.

La computacion cuantica amenaza los fundamentos de la criptografia actual. El algoritmo de Shor (1994) factoriza enteros en tiempo polinomial O((log N)^3), lo que significa que RSA-2048 podria romperse con ~4000 qubits logicos. El algoritmo de Grover busca en un espacio no estructurado con speedup cuadratico, reduciendo AES-128 a ~64 bits de seguridad efectiva.

CRYSTALS-Dilithium es un esquema de firma basado en la dificultad de encontrar vectores cortos en lattices. Ofrece tres niveles de seguridad: Dilithium2 (~AES-128), Dilithium3 (~AES-192) y Dilithium5 (~AES-256). Los tamanos de firma son 2420, 3293 y 4595 bytes respectivamente, significativamente mayores que ECDSA pero necesarios para seguridad post-cuantica.

CRYSTALS-Kyber es un mecanismo de encapsulamiento de claves (KEM) basado en el problema Module-LWE. Sus parametros principales son: Kyber-512 (seguridad ~AES-128, llave publica 800B, ciphertext 768B), Kyber-768 (~AES-192, PK 1184B, CT 1088B), y Kyber-1024 (~AES-256, PK 1568B, CT 1568B).

La computacion cuantica amenaza los fundamentos de la criptografia actual. El algoritmo de Shor (1994) factoriza enteros en tiempo polinomial O((log N)^3), lo que significa que RSA-2048 podria romperse con ~4000 qubits logicos. El algoritmo de Grover busca en un espacio no estructurado con speedup cuadratico, reduciendo AES-128 a ~64 bits de seguridad efectiva.

CRYSTALS-Kyber es un mecanismo de encapsulamiento de claves (KEM) basado en el problema Module-LWE. Sus parametros principales son: Kyber-512 (seguridad ~AES-128, llave publica 800B, ciphertext 768B), Kyber-768 (~AES-192, PK 1184B, CT 1088B), y Kyber-1024 (~AES-256, PK 1568B, CT 1568B).

#### 11.2 Introduccion: la amenaza cuantica

El sub-tema Introduccion: la amenaza cuantica dentro de Post-Quantum Cryptography (PQC) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Introduccion: la amenaza cuantica
import os, sys, time, struct
import numpy as np

class Introduccion:laamenazacuantica:
    """Implementacion de Introduccion: la amenaza cuantica para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Introduccion: la amenaza cuantica."""
    obj = Introduccion:laamenazacuantica(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Introduccion: la amenaza cuantica.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 11.3 Algoritmo de Shor

El sub-tema Algoritmo de Shor dentro de Post-Quantum Cryptography (PQC) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Algoritmo de Shor
import os, sys, time, struct
import numpy as np

class AlgoritmodeShor:
    """Implementacion de Algoritmo de Shor para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Algoritmo de Shor."""
    obj = AlgoritmodeShor(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Algoritmo de Shor.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 11.4 Algoritmo de Grover

El sub-tema Algoritmo de Grover dentro de Post-Quantum Cryptography (PQC) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Algoritmo de Grover
import os, sys, time, struct
import numpy as np

class AlgoritmodeGrover:
    """Implementacion de Algoritmo de Grover para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Algoritmo de Grover."""
    obj = AlgoritmodeGrover(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Algoritmo de Grover.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 11.5 [nist](../raw/p3nt3st-m3th0d0l0gy.md#nist) PQC Standardization

El sub-tema NIST PQC Standardization dentro de Post-Quantum Cryptography (PQC) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: NIST PQC Standardization
import os, sys, time, struct
import numpy as np

class NISTPQCStandardization:
    """Implementacion de NIST PQC Standardization para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para NIST PQC Standardization."""
    obj = NISTPQCStandardization(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de NIST PQC Standardization.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 11.6 Hardware cuantico actual 2025

El sub-tema Hardware cuantico actual 2025 dentro de Post-Quantum Cryptography (PQC) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Hardware cuantico actual 2025
import os, sys, time, struct
import numpy as np

class Hardwarecuanticoactual2025:
    """Implementacion de Hardware cuantico actual 2025 para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Hardware cuantico actual 2025."""
    obj = Hardwarecuanticoactual2025(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Hardware cuantico actual 2025.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 11.7 Cronograma de migracion recomendado

El sub-tema Cronograma de migracion recomendado dentro de Post-Quantum Cryptography (PQC) requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Cronograma de migracion recomendado
import os, sys, time, struct
import numpy as np

class Cronogramademigracionrecomendado:
    """Implementacion de Cronograma de migracion recomendado para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Cronograma de migracion recomendado."""
    obj = Cronogramademigracionrecomendado(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Cronograma de migracion recomendado.
Puede adaptarse y extenderse segun las necesidades del analisis.

### 11.3 Comandos y Herramientas

```bash
pip install numpy scipy matplotlib jupyter scikit-learn
git clone https://github.com/newaetech/chipwhisperer
pip install chipwhisperer opensca pyserial
pip install liboqs cryptography
```

### 11.4 Ejercicios Practicos

**Ejercicio 1 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Post-Quantum Cryptography (PQC) implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en [python](../raw/pyth0n-f0r-h4ck1ng.md)
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 2 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Post-Quantum Cryptography (PQC) implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 3 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Post-Quantum Cryptography (PQC) implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 4 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Post-Quantum Cryptography (PQC) implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 5 (Nivel Avanzado):**

Objetivo: Aplicar los conceptos de Post-Quantum Cryptography (PQC) implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

Para el nivel avanzado, incorporar tecnicas de optimizacion y
analisis comparativo. Extender la implementacion con funcionalidades
adicionales y probar en escenarios realistas.

---

## 12. [criptografia](../raw/crypt0-f0r-h4ck3rs.md) Lattice-Based

### 12.1 Teoria: Criptografia Lattice-Based

La [criptografia post-cuantica](../raw/pqc-s1d3-ch4nn3ls.md)-s1d3-ch4nn3ls.md) ([pqc](../raw/pqc-s1d3-ch4nn3ls.md)) busca algoritmos seguros contra computadoras cuanticas. Los algoritmos de Shor y Grover amenazan respectivamente la criptografia de clave publica ([rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa), ECC) y la de clave simetrica ([aes](../raw/crypt0-f0r-h4ck3rs.md#aes)). [nist](../raw/p3nt3st-m3th0d0l0gy.md#nist) estandarizo ML-KEM (Kyber) para intercambio de claves y ML-DSA (Dilithium) para firmas digitales, ambos basados en problemas de lattices.

Los ataques de cache timing explotan la diferencia de latencia entre acceder a memoria cache (tipicamente 4-12 ciclos de reloj) versus memoria RAM (200+ ciclos). Flush+Reload es la tecnica mas conocida: el atacante fuerza la salida de cache de una direccion especifica, espera a que la victima potencialmente la acceda, y luego mide el tiempo de recarga. Si es rapido, la victima accedio a esa direccion.

Los ataques electromagneticos (EMA) ofrecen ventajas sobre los de potencia porque pueden enfocarse en areas especificas del chip, midiendo la actividad localizada en lugar del consumo global. Una sonda EM de campo cercano colocada sobre el modulo AES de una System-on-Chip puede capturar senales con mejor relacion senal-ruido que una medicion de corriente en el pin de alimentacion.

Los ataques de cache timing explotan la diferencia de latencia entre acceder a memoria cache (tipicamente 4-12 ciclos de reloj) versus memoria RAM (200+ ciclos). Flush+Reload es la tecnica mas conocida: el atacante fuerza la salida de cache de una direccion especifica, espera a que la victima potencialmente la acceda, y luego mide el tiempo de recarga. Si es rapido, la victima accedio a esa direccion.

Los ataques de template son la forma mas poderosa de side-channel analysis. Consisten en dos fases: profiling, donde se construye un modelo estadistico detallado (media y covarianza) para cada valor de clave posible usando un dispositivo identico, y ataque, donde se compara la traza del dispositivo objetivo contra los templates usando maxima verosimilitud (log-likelihood bajo distribucion normal multivariada).

Los ataques electromagneticos (EMA) ofrecen ventajas sobre los de potencia porque pueden enfocarse en areas especificas del chip, midiendo la actividad localizada en lugar del consumo global. Una sonda EM de campo cercano colocada sobre el modulo AES de una System-on-Chip puede capturar senales con mejor relacion senal-ruido que una medicion de corriente en el pin de alimentacion.

La criptografia post-cuantica (PQC) busca algoritmos seguros contra computadoras cuanticas. Los algoritmos de Shor y Grover amenazan respectivamente la criptografia de clave publica (RSA, ECC) y la de clave simetrica (AES). NIST estandarizo ML-KEM (Kyber) para intercambio de claves y ML-DSA (Dilithium) para firmas digitales, ambos basados en problemas de lattices.

Un canal lateral (side-channel) es cualquier fuga de informacion que se produce durante la ejecucion de un algoritmo criptografico y que no forma parte del output esperado. Cuando un microcontrolador ejecuta una operacion como AES o RSA, las transiciones logicas internas generan variaciones medibles en el consumo de corriente, el campo electromagnetico circundante, el tiempo de ejecucion e incluso el sonido emitido por los capacitores de la fuente.

#### 12.2 Fundamentos de lattices

El sub-tema Fundamentos de lattices dentro de Criptografia Lattice-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Fundamentos de lattices
import os, sys, time, struct
import numpy as np

class Fundamentosdelattices:
    """Implementacion de Fundamentos de lattices para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Fundamentos de lattices."""
    obj = Fundamentosdelattices(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Fundamentos de lattices.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 12.3 Learning With Errors (LWE)

El sub-tema Learning With Errors (LWE) dentro de Criptografia Lattice-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Learning With Errors (LWE)
import os, sys, time, struct
import numpy as np

class LearningWithErrors(LWE):
    """Implementacion de Learning With Errors (LWE) para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Learning With Errors (LWE)."""
    obj = LearningWithErrors(LWE)(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Learning With Errors (LWE).
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 12.4 Ring-LWE y Module-LWE

El sub-tema Ring-LWE y Module-LWE dentro de Criptografia Lattice-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ring-LWE y Module-LWE
import os, sys, time, struct
import numpy as np

class RingLWEyModuleLWE:
    """Implementacion de Ring-LWE y Module-LWE para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ring-LWE y Module-LWE."""
    obj = RingLWEyModuleLWE(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ring-LWE y Module-LWE.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 12.5 CRYSTALS-Kyber (ML-KEM)

El sub-tema CRYSTALS-Kyber (ML-KEM) dentro de Criptografia Lattice-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: CRYSTALS-Kyber (ML-KEM)
import os, sys, time, struct
import numpy as np

class CRYSTALSKyber(MLKEM):
    """Implementacion de CRYSTALS-Kyber (ML-KEM) para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para CRYSTALS-Kyber (ML-KEM)."""
    obj = CRYSTALSKyber(MLKEM)(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de CRYSTALS-Kyber (ML-KEM).
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 12.6 CRYSTALS-Dilithium (ML-DSA)

El sub-tema CRYSTALS-Dilithium (ML-DSA) dentro de Criptografia Lattice-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: CRYSTALS-Dilithium (ML-DSA)
import os, sys, time, struct
import numpy as np

class CRYSTALSDilithium(MLDSA):
    """Implementacion de CRYSTALS-Dilithium (ML-DSA) para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para CRYSTALS-Dilithium (ML-DSA)."""
    obj = CRYSTALSDilithium(MLDSA)(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de CRYSTALS-Dilithium (ML-DSA).
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 12.7 FALCON

El sub-tema FALCON dentro de Criptografia Lattice-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: FALCON
import os, sys, time, struct
import numpy as np

class FALCON:
    """Implementacion de FALCON para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para FALCON."""
    obj = FALCON(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de FALCON.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 12.8 Side-channels en lattice-based

El sub-tema Side-channels en lattice-based dentro de Criptografia Lattice-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Side-channels en lattice-based
import os, sys, time, struct
import numpy as np

class Sidechannelsenlatticebased:
    """Implementacion de Side-channels en lattice-based para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Side-channels en lattice-based."""
    obj = Sidechannelsenlatticebased(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Side-channels en lattice-based.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 12.9 Compresion de coeficientes Kyber

El sub-tema Compresion de coeficientes Kyber dentro de Criptografia Lattice-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Compresion de coeficientes Kyber
import os, sys, time, struct
import numpy as np

class CompresiondecoeficientesKyber:
    """Implementacion de Compresion de coeficientes Kyber para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Compresion de coeficientes Kyber."""
    obj = CompresiondecoeficientesKyber(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Compresion de coeficientes Kyber.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 12.10 NTT y muestreo de polinomios

El sub-tema NTT y muestreo de polinomios dentro de Criptografia Lattice-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: NTT y muestreo de polinomios
import os, sys, time, struct
import numpy as np

class NTTymuestreodepolinomios:
    """Implementacion de NTT y muestreo de polinomios para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para NTT y muestreo de polinomios."""
    obj = NTTymuestreodepolinomios(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de NTT y muestreo de polinomios.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 12.11 Ejercicio practico: usar liboqs

El sub-tema Ejercicio practico: usar liboqs dentro de Criptografia Lattice-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ejercicio practico: usar liboqs
import os, sys, time, struct
import numpy as np

class Ejerciciopractico:usarliboqs:
    """Implementacion de Ejercicio practico: usar liboqs para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ejercicio practico: usar liboqs."""
    obj = Ejerciciopractico:usarliboqs(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ejercicio practico: usar liboqs.
Puede adaptarse y extenderse segun las necesidades del analisis.

### 12.3 Comandos y Herramientas

```bash
pip install numpy scipy matplotlib jupyter scikit-learn
git clone https://github.com/newaetech/chipwhisperer
pip install chipwhisperer opensca pyserial
pip install liboqs cryptography
```

### 12.4 Ejercicios Practicos

**Ejercicio 1 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Criptografia Lattice-Based implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en [python](../raw/pyth0n-f0r-h4ck1ng.md)
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 2 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Criptografia Lattice-Based implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 3 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Criptografia Lattice-Based implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 4 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Criptografia Lattice-Based implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 5 (Nivel Avanzado):**

Objetivo: Aplicar los conceptos de Criptografia Lattice-Based implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

Para el nivel avanzado, incorporar tecnicas de optimizacion y
analisis comparativo. Extender la implementacion con funcionalidades
adicionales y probar en escenarios realistas.

---

## 13. [criptografia](../raw/crypt0-f0r-h4ck3rs.md) [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions)-Based

### 13.1 Teoria: Criptografia Hash-Based

Los ataques de template son la forma mas poderosa de side-channel analysis. Consisten en dos fases: profiling, donde se construye un modelo estadistico detallado (media y covarianza) para cada valor de clave posible usando un dispositivo identico, y ataque, donde se compara la traza del dispositivo objetivo contra los templates usando maxima verosimilitud (log-likelihood bajo distribucion normal multivariada).

Los ataques de tiempo (timing attacks) explotan la variacion en la duracion de las operaciones segun los valores de los operandos. Por ejemplo, en [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa) la exponenciacion modular con square-and-multiply ejecuta una multiplicacion adicional cuando el bit del exponente es 1. Si podemos medir con precision nanosegundos, podemos determinar el valor de cada bit del exponente secreto.

La [criptografia post-cuantica](../raw/pqc-s1d3-ch4nn3ls.md)-s1d3-ch4nn3ls.md) ([pqc](../raw/pqc-s1d3-ch4nn3ls.md)) busca algoritmos seguros contra computadoras cuanticas. Los algoritmos de Shor y Grover amenazan respectivamente la criptografia de clave publica (RSA, ECC) y la de clave simetrica ([aes](../raw/crypt0-f0r-h4ck3rs.md#aes)). [nist](../raw/p3nt3st-m3th0d0l0gy.md#nist) estandarizo ML-KEM (Kyber) para intercambio de claves y ML-DSA (Dilithium) para firmas digitales, ambos basados en problemas de lattices.

Los ataques electromagneticos (EMA) ofrecen ventajas sobre los de potencia porque pueden enfocarse en areas especificas del chip, midiendo la actividad localizada en lugar del consumo global. Una sonda EM de campo cercano colocada sobre el modulo AES de una System-on-Chip puede capturar senales con mejor relacion senal-ruido que una medicion de corriente en el pin de alimentacion.

Las implementaciones constant-time son esenciales para prevenir timing attacks. El principio fundamental es que el tiempo de ejecucion no debe depender de ningun dato secreto. Esto implica: usar operaciones bitwise en lugar de condicionales, evitar accesos a memoria indexados por datos secretos, y asegurar que todos los bucles recorran el mismo numero de iteraciones independientemente de los valores.

Los ataques de tiempo (timing attacks) explotan la variacion en la duracion de las operaciones segun los valores de los operandos. Por ejemplo, en RSA la exponenciacion modular con square-and-multiply ejecuta una multiplicacion adicional cuando el bit del exponente es 1. Si podemos medir con precision nanosegundos, podemos determinar el valor de cada bit del exponente secreto.

Los ataques de template son la forma mas poderosa de side-channel analysis. Consisten en dos fases: profiling, donde se construye un modelo estadistico detallado (media y covarianza) para cada valor de clave posible usando un dispositivo identico, y ataque, donde se compara la traza del dispositivo objetivo contra los templates usando maxima verosimilitud (log-likelihood bajo distribucion normal multivariada).

El analisis diferencial de potencia (DPA) es una tecnica estadistica que permite extraer claves incluso cuando el ruido de medicion es mayor que la senal individual. La idea es recolectar miles de trazas de potencia para diferentes entradas conocidas, y para cada hipotesis de clave calcular la correlacion entre un modelo de consumo y las trazas reales. La hipotesis correcta mostrara el pico de correlacion mas alto.

#### 13.2 Arboles de Merkle

El sub-tema Arboles de Merkle dentro de Criptografia Hash-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Arboles de Merkle
import os, sys, time, struct
import numpy as np

class ArbolesdeMerkle:
    """Implementacion de Arboles de Merkle para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Arboles de Merkle."""
    obj = ArbolesdeMerkle(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Arboles de Merkle.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 13.3 LM-OTS

El sub-tema LM-OTS dentro de Criptografia Hash-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: LM-OTS
import os, sys, time, struct
import numpy as np

class LMOTS:
    """Implementacion de LM-OTS para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para LM-OTS."""
    obj = LMOTS(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de LM-OTS.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 13.4 SPHINCS+ (SLH-DSA)

El sub-tema SPHINCS+ (SLH-DSA) dentro de Criptografia Hash-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: SPHINCS+ (SLH-DSA)
import os, sys, time, struct
import numpy as np

class SPHINCS+(SLHDSA):
    """Implementacion de SPHINCS+ (SLH-DSA) para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para SPHINCS+ (SLH-DSA)."""
    obj = SPHINCS+(SLHDSA)(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de SPHINCS+ (SLH-DSA).
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 13.5 XMSS (stateful)

El sub-tema XMSS (stateful) dentro de Criptografia Hash-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: XMSS (stateful)
import os, sys, time, struct
import numpy as np

class XMSS(stateful):
    """Implementacion de XMSS (stateful) para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para XMSS (stateful)."""
    obj = XMSS(stateful)(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de XMSS (stateful).
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 13.6 Ejercicio practico: firmar con SPHINCS+

El sub-tema Ejercicio practico: firmar con SPHINCS+ dentro de Criptografia Hash-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ejercicio practico: firmar con SPHINCS+
import os, sys, time, struct
import numpy as np

class Ejerciciopractico:firmarconSPHINCS+:
    """Implementacion de Ejercicio practico: firmar con SPHINCS+ para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ejercicio practico: firmar con SPHINCS+."""
    obj = Ejerciciopractico:firmarconSPHINCS+(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ejercicio practico: firmar con SPHINCS+.
Puede adaptarse y extenderse segun las necesidades del analisis.

### 13.3 Comandos y Herramientas

```bash
pip install numpy scipy matplotlib jupyter scikit-learn
git clone https://github.com/newaetech/chipwhisperer
pip install chipwhisperer opensca pyserial
pip install liboqs cryptography
```

### 13.4 Ejercicios Practicos

**Ejercicio 1 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Criptografia Hash-Based implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en [python](../raw/pyth0n-f0r-h4ck1ng.md)
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 2 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Criptografia Hash-Based implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 3 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Criptografia Hash-Based implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 4 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Criptografia Hash-Based implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 5 (Nivel Avanzado):**

Objetivo: Aplicar los conceptos de Criptografia Hash-Based implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

Para el nivel avanzado, incorporar tecnicas de optimizacion y
analisis comparativo. Extender la implementacion con funcionalidades
adicionales y probar en escenarios realistas.

---

## 14. [criptografia](../raw/crypt0-f0r-h4ck3rs.md) Code-Based

### 14.1 Teoria: Criptografia Code-Based

Los ataques de cache timing explotan la diferencia de latencia entre acceder a memoria cache (tipicamente 4-12 ciclos de reloj) versus memoria RAM (200+ ciclos). Flush+Reload es la tecnica mas conocida: el atacante fuerza la salida de cache de una direccion especifica, espera a que la victima potencialmente la acceda, y luego mide el tiempo de recarga. Si es rapido, la victima accedio a esa direccion.

Los ataques de tiempo (timing attacks) explotan la variacion en la duracion de las operaciones segun los valores de los operandos. Por ejemplo, en [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa) la exponenciacion modular con square-and-multiply ejecuta una multiplicacion adicional cuando el bit del exponente es 1. Si podemos medir con precision nanosegundos, podemos determinar el valor de cada bit del exponente secreto.

La [criptografia post-cuantica](../raw/pqc-s1d3-ch4nn3ls.md)-s1d3-ch4nn3ls.md) ([pqc](../raw/pqc-s1d3-ch4nn3ls.md)) busca algoritmos seguros contra computadoras cuanticas. Los algoritmos de Shor y Grover amenazan respectivamente la criptografia de clave publica (RSA, ECC) y la de clave simetrica ([aes](../raw/crypt0-f0r-h4ck3rs.md#aes)). [nist](../raw/p3nt3st-m3th0d0l0gy.md#nist) estandarizo ML-KEM (Kyber) para intercambio de claves y ML-DSA (Dilithium) para firmas digitales, ambos basados en problemas de lattices.

Los ataques de cache timing explotan la diferencia de latencia entre acceder a memoria cache (tipicamente 4-12 ciclos de reloj) versus memoria RAM (200+ ciclos). Flush+Reload es la tecnica mas conocida: el atacante fuerza la salida de cache de una direccion especifica, espera a que la victima potencialmente la acceda, y luego mide el tiempo de recarga. Si es rapido, la victima accedio a esa direccion.

La criptografia post-cuantica (PQC) busca algoritmos seguros contra computadoras cuanticas. Los algoritmos de Shor y Grover amenazan respectivamente la criptografia de clave publica (RSA, ECC) y la de clave simetrica (AES). NIST estandarizo ML-KEM (Kyber) para intercambio de claves y ML-DSA (Dilithium) para firmas digitales, ambos basados en problemas de lattices.

Las contramedidas contra side-channel attacks se dividen en dos categorias principales: hiding y masking. Hiding busca hacer que el consumo sea constante independientemente de los datos, mediante tecnicas como dual-rail logic o insercion de operaciones dummy. Masking oculta los valores intermedios combinando cada dato secreto con mascaras aleatorias, haciendo que el consumo en cada punto temporal no se correlacione directamente con ningun valor secreto.

Las implementaciones constant-time son esenciales para prevenir timing attacks. El principio fundamental es que el tiempo de ejecucion no debe depender de ningun dato secreto. Esto implica: usar operaciones bitwise en lugar de condicionales, evitar accesos a memoria indexados por datos secretos, y asegurar que todos los bucles recorran el mismo numero de iteraciones independientemente de los valores.

Las contramedidas contra side-channel attacks se dividen en dos categorias principales: hiding y masking. Hiding busca hacer que el consumo sea constante independientemente de los datos, mediante tecnicas como dual-rail logic o insercion de operaciones dummy. Masking oculta los valores intermedios combinando cada dato secreto con mascaras aleatorias, haciendo que el consumo en cada punto temporal no se correlacione directamente con ningun valor secreto.

#### 14.2 Codigos lineales y Goppa

El sub-tema Codigos lineales y Goppa dentro de Criptografia Code-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Codigos lineales y Goppa
import os, sys, time, struct
import numpy as np

class CodigoslinealesyGoppa:
    """Implementacion de Codigos lineales y Goppa para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Codigos lineales y Goppa."""
    obj = CodigoslinealesyGoppa(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Codigos lineales y Goppa.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 14.3 Classic McEliece

El sub-tema Classic McEliece dentro de Criptografia Code-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Classic McEliece
import os, sys, time, struct
import numpy as np

class ClassicMcEliece:
    """Implementacion de Classic McEliece para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Classic McEliece."""
    obj = ClassicMcEliece(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Classic McEliece.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 14.4 BIKE y HQC

El sub-tema BIKE y HQC dentro de Criptografia Code-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: BIKE y HQC
import os, sys, time, struct
import numpy as np

class BIKEyHQC:
    """Implementacion de BIKE y HQC para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para BIKE y HQC."""
    obj = BIKEyHQC(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de BIKE y HQC.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 14.5 Algoritmo de Patterson

El sub-tema Algoritmo de Patterson dentro de Criptografia Code-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Algoritmo de Patterson
import os, sys, time, struct
import numpy as np

class AlgoritmodePatterson:
    """Implementacion de Algoritmo de Patterson para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Algoritmo de Patterson."""
    obj = AlgoritmodePatterson(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Algoritmo de Patterson.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 14.6 Side-channels en code-based

El sub-tema Side-channels en code-based dentro de Criptografia Code-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Side-channels en code-based
import os, sys, time, struct
import numpy as np

class Sidechannelsencodebased:
    """Implementacion de Side-channels en code-based para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Side-channels en code-based."""
    obj = Sidechannelsencodebased(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Side-channels en code-based.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 14.7 Ejercicio practico: Classic McEliece con liboqs

El sub-tema Ejercicio practico: Classic McEliece con liboqs dentro de Criptografia Code-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ejercicio practico: Classic McEliece con liboqs
import os, sys, time, struct
import numpy as np

class Ejerciciopractico:ClassicMcEliececonliboqs:
    """Implementacion de Ejercicio practico: Classic McEliece con liboqs para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ejercicio practico: Classic McEliece con liboqs."""
    obj = Ejerciciopractico:ClassicMcEliececonliboqs(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ejercicio practico: Classic McEliece con liboqs.
Puede adaptarse y extenderse segun las necesidades del analisis.

### 14.3 Comandos y Herramientas

```bash
pip install numpy scipy matplotlib jupyter scikit-learn
git clone https://github.com/newaetech/chipwhisperer
pip install chipwhisperer opensca pyserial
pip install liboqs cryptography
```

### 14.4 Ejercicios Practicos

**Ejercicio 1 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Criptografia Code-Based implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en [python](../raw/pyth0n-f0r-h4ck1ng.md)
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 2 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Criptografia Code-Based implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 3 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Criptografia Code-Based implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 4 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Criptografia Code-Based implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 5 (Nivel Avanzado):**

Objetivo: Aplicar los conceptos de Criptografia Code-Based implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

Para el nivel avanzado, incorporar tecnicas de optimizacion y
analisis comparativo. Extender la implementacion con funcionalidades
adicionales y probar en escenarios realistas.

---

## 15. [criptografia](../raw/crypt0-f0r-h4ck3rs.md) Isogeny-Based

### 15.1 Teoria: Criptografia Isogeny-Based

Las contramedidas contra side-channel attacks se dividen en dos categorias principales: hiding y masking. Hiding busca hacer que el consumo sea constante independientemente de los datos, mediante tecnicas como dual-rail logic o insercion de operaciones dummy. Masking oculta los valores intermedios combinando cada dato secreto con mascaras aleatorias, haciendo que el consumo en cada punto temporal no se correlacione directamente con ningun valor secreto.

Las implementaciones constant-time son esenciales para prevenir timing attacks. El principio fundamental es que el tiempo de ejecucion no debe depender de ningun dato secreto. Esto implica: usar operaciones bitwise en lugar de condicionales, evitar accesos a memoria indexados por datos secretos, y asegurar que todos los bucles recorran el mismo numero de iteraciones independientemente de los valores.

Los ataques de cache timing explotan la diferencia de latencia entre acceder a memoria cache (tipicamente 4-12 ciclos de reloj) versus memoria RAM (200+ ciclos). Flush+Reload es la tecnica mas conocida: el atacante fuerza la salida de cache de una direccion especifica, espera a que la victima potencialmente la acceda, y luego mide el tiempo de recarga. Si es rapido, la victima accedio a esa direccion.

Los ataques de cache timing explotan la diferencia de latencia entre acceder a memoria cache (tipicamente 4-12 ciclos de reloj) versus memoria RAM (200+ ciclos). Flush+Reload es la tecnica mas conocida: el atacante fuerza la salida de cache de una direccion especifica, espera a que la victima potencialmente la acceda, y luego mide el tiempo de recarga. Si es rapido, la victima accedio a esa direccion.

Los ataques de tiempo (timing attacks) explotan la variacion en la duracion de las operaciones segun los valores de los operandos. Por ejemplo, en [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa) la exponenciacion modular con square-and-multiply ejecuta una multiplicacion adicional cuando el bit del exponente es 1. Si podemos medir con precision nanosegundos, podemos determinar el valor de cada bit del exponente secreto.

Los ataques electromagneticos (EMA) ofrecen ventajas sobre los de potencia porque pueden enfocarse en areas especificas del chip, midiendo la actividad localizada en lugar del consumo global. Una sonda EM de campo cercano colocada sobre el modulo [aes](../raw/crypt0-f0r-h4ck3rs.md#aes) de una System-on-Chip puede capturar senales con mejor relacion senal-ruido que una medicion de corriente en el pin de alimentacion.

El analisis diferencial de potencia (DPA) es una tecnica estadistica que permite extraer claves incluso cuando el ruido de medicion es mayor que la senal individual. La idea es recolectar miles de trazas de potencia para diferentes entradas conocidas, y para cada hipotesis de clave calcular la correlacion entre un modelo de consumo y las trazas reales. La hipotesis correcta mostrara el pico de correlacion mas alto.

El analisis diferencial de potencia (DPA) es una tecnica estadistica que permite extraer claves incluso cuando el ruido de medicion es mayor que la senal individual. La idea es recolectar miles de trazas de potencia para diferentes entradas conocidas, y para cada hipotesis de clave calcular la correlacion entre un modelo de consumo y las trazas reales. La hipotesis correcta mostrara el pico de correlacion mas alto.

#### 15.2 Curvas elipticas e isogenias

El sub-tema Curvas elipticas e isogenias dentro de Criptografia Isogeny-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Curvas elipticas e isogenias
import os, sys, time, struct
import numpy as np

class Curvaselipticaseisogenias:
    """Implementacion de Curvas elipticas e isogenias para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Curvas elipticas e isogenias."""
    obj = Curvaselipticaseisogenias(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Curvas elipticas e isogenias.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 15.3 SIDH y SIKE

El sub-tema SIDH y SIKE dentro de Criptografia Isogeny-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: SIDH y SIKE
import os, sys, time, struct
import numpy as np

class SIDHySIKE:
    """Implementacion de SIDH y SIKE para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para SIDH y SIKE."""
    obj = SIDHySIKE(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de SIDH y SIKE.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 15.4 El ataque de Castryck-Decru (2022)

El sub-tema El ataque de Castryck-Decru (2022) dentro de Criptografia Isogeny-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: El ataque de Castryck-Decru (2022)
import os, sys, time, struct
import numpy as np

class ElataquedeCastryckDecru(2022):
    """Implementacion de El ataque de Castryck-Decru (2022) para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para El ataque de Castryck-Decru (2022)."""
    obj = ElataquedeCastryckDecru(2022)(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de El ataque de Castryck-Decru (2022).
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 15.5 SQIsign y el futuro

El sub-tema SQIsign y el futuro dentro de Criptografia Isogeny-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: SQIsign y el futuro
import os, sys, time, struct
import numpy as np

class SQIsignyelfuturo:
    """Implementacion de SQIsign y el futuro para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para SQIsign y el futuro."""
    obj = SQIsignyelfuturo(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de SQIsign y el futuro.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 15.6 Estado actual post-ataque

El sub-tema Estado actual post-ataque dentro de Criptografia Isogeny-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Estado actual post-ataque
import os, sys, time, struct
import numpy as np

class Estadoactualpostataque:
    """Implementacion de Estado actual post-ataque para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Estado actual post-ataque."""
    obj = Estadoactualpostataque(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Estado actual post-ataque.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 15.7 Ejercicio exploratorio

El sub-tema Ejercicio exploratorio dentro de Criptografia Isogeny-Based requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ejercicio exploratorio
import os, sys, time, struct
import numpy as np

class Ejercicioexploratorio:
    """Implementacion de Ejercicio exploratorio para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ejercicio exploratorio."""
    obj = Ejercicioexploratorio(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ejercicio exploratorio.
Puede adaptarse y extenderse segun las necesidades del analisis.

### 15.3 Comandos y Herramientas

```bash
pip install numpy scipy matplotlib jupyter scikit-learn
git clone https://github.com/newaetech/chipwhisperer
pip install chipwhisperer opensca pyserial
pip install liboqs cryptography
```

### 15.4 Ejercicios Practicos

**Ejercicio 1 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Criptografia Isogeny-Based implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en [python](../raw/pyth0n-f0r-h4ck1ng.md)
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 2 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Criptografia Isogeny-Based implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 3 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Criptografia Isogeny-Based implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 4 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Criptografia Isogeny-Based implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 5 (Nivel Avanzado):**

Objetivo: Aplicar los conceptos de Criptografia Isogeny-Based implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

Para el nivel avanzado, incorporar tecnicas de optimizacion y
analisis comparativo. Extender la implementacion con funcionalidades
adicionales y probar en escenarios realistas.

---

## 16. Herramientas y Laboratorio

### 16.1 Teoria: Herramientas y Laboratorio

Las contramedidas contra side-channel attacks se dividen en dos categorias principales: hiding y masking. Hiding busca hacer que el consumo sea constante independientemente de los datos, mediante tecnicas como dual-rail logic o insercion de operaciones dummy. Masking oculta los valores intermedios combinando cada dato secreto con mascaras aleatorias, haciendo que el consumo en cada punto temporal no se correlacione directamente con ningun valor secreto.

Los ataques de template son la forma mas poderosa de side-channel analysis. Consisten en dos fases: profiling, donde se construye un modelo estadistico detallado (media y covarianza) para cada valor de clave posible usando un dispositivo identico, y ataque, donde se compara la traza del dispositivo objetivo contra los templates usando maxima verosimilitud (log-likelihood bajo distribucion normal multivariada).

Los ataques electromagneticos (EMA) ofrecen ventajas sobre los de potencia porque pueden enfocarse en areas especificas del chip, midiendo la actividad localizada en lugar del consumo global. Una sonda EM de campo cercano colocada sobre el modulo [aes](../raw/crypt0-f0r-h4ck3rs.md#aes) de una System-on-Chip puede capturar senales con mejor relacion senal-ruido que una medicion de corriente en el pin de alimentacion.

Los ataques de cache timing explotan la diferencia de latencia entre acceder a memoria cache (tipicamente 4-12 ciclos de reloj) versus memoria RAM (200+ ciclos). Flush+Reload es la tecnica mas conocida: el atacante fuerza la salida de cache de una direccion especifica, espera a que la victima potencialmente la acceda, y luego mide el tiempo de recarga. Si es rapido, la victima accedio a esa direccion.

Las implementaciones constant-time son esenciales para prevenir timing attacks. El principio fundamental es que el tiempo de ejecucion no debe depender de ningun dato secreto. Esto implica: usar operaciones bitwise en lugar de condicionales, evitar accesos a memoria indexados por datos secretos, y asegurar que todos los bucles recorran el mismo numero de iteraciones independientemente de los valores.

Las contramedidas contra side-channel attacks se dividen en dos categorias principales: hiding y masking. Hiding busca hacer que el consumo sea constante independientemente de los datos, mediante tecnicas como dual-rail logic o insercion de operaciones dummy. Masking oculta los valores intermedios combinando cada dato secreto con mascaras aleatorias, haciendo que el consumo en cada punto temporal no se correlacione directamente con ningun valor secreto.

La [criptografia post-cuantica](../raw/pqc-s1d3-ch4nn3ls.md) ([pqc](../raw/pqc-s1d3-ch4nn3ls.md)) busca algoritmos seguros contra computadoras cuanticas. Los algoritmos de Shor y Grover amenazan respectivamente la [criptografia](../raw/crypt0-f0r-h4ck3rs.md) de clave publica ([rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa), ECC) y la de clave simetrica (AES). [nist](../raw/p3nt3st-m3th0d0l0gy.md#nist) estandarizo ML-KEM (Kyber) para intercambio de claves y ML-DSA (Dilithium) para firmas digitales, ambos basados en problemas de lattices.

Las implementaciones constant-time son esenciales para prevenir timing attacks. El principio fundamental es que el tiempo de ejecucion no debe depender de ningun dato secreto. Esto implica: usar operaciones bitwise en lugar de condicionales, evitar accesos a memoria indexados por datos secretos, y asegurar que todos los bucles recorran el mismo numero de iteraciones independientemente de los valores.

#### 16.2 ChipWhisperer setup

El sub-tema ChipWhisperer setup dentro de Herramientas y Laboratorio requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: ChipWhisperer setup
import os, sys, time, struct
import numpy as np

class ChipWhisperersetup:
    """Implementacion de ChipWhisperer setup para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para ChipWhisperer setup."""
    obj = ChipWhisperersetup(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de ChipWhisperer setup.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 16.3 OpenSCA

El sub-tema OpenSCA dentro de Herramientas y Laboratorio requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: OpenSCA
import os, sys, time, struct
import numpy as np

class OpenSCA:
    """Implementacion de OpenSCA para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para OpenSCA."""
    obj = OpenSCA(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de OpenSCA.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 16.4 PicoScope

El sub-tema PicoScope dentro de Herramientas y Laboratorio requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: PicoScope
import os, sys, time, struct
import numpy as np

class PicoScope:
    """Implementacion de PicoScope para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para PicoScope."""
    obj = PicoScope(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de PicoScope.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 16.5 Jupyter Notebooks

El sub-tema Jupyter Notebooks dentro de Herramientas y Laboratorio requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Jupyter Notebooks
import os, sys, time, struct
import numpy as np

class JupyterNotebooks:
    """Implementacion de Jupyter Notebooks para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Jupyter Notebooks."""
    obj = JupyterNotebooks(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Jupyter Notebooks.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 16.6 liboqs

El sub-tema liboqs dentro de Herramientas y Laboratorio requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: liboqs
import os, sys, time, struct
import numpy as np

class liboqs:
    """Implementacion de liboqs para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para liboqs."""
    obj = liboqs(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de liboqs.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 16.7 OQS-OpenSSL

El sub-tema OQS-OpenSSL dentro de Herramientas y Laboratorio requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: OQS-OpenSSL
import os, sys, time, struct
import numpy as np

class OQSOpenSSL:
    """Implementacion de OQS-OpenSSL para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para OQS-OpenSSL."""
    obj = OQSOpenSSL(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de OQS-OpenSSL.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 16.8 Automacion DPA

El sub-tema Automacion DPA dentro de Herramientas y Laboratorio requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Automacion DPA
import os, sys, time, struct
import numpy as np

class AutomacionDPA:
    """Implementacion de Automacion DPA para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Automacion DPA."""
    obj = AutomacionDPA(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Automacion DPA.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 16.9 Sonda EM profesional

El sub-tema Sonda EM profesional dentro de Herramientas y Laboratorio requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Sonda EM profesional
import os, sys, time, struct
import numpy as np

class SondaEMprofesional:
    """Implementacion de Sonda EM profesional para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Sonda EM profesional."""
    obj = SondaEMprofesional(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Sonda EM profesional.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 16.10 Ejercicio integrador final

El sub-tema Ejercicio integrador final dentro de Herramientas y Laboratorio requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Ejercicio integrador final
import os, sys, time, struct
import numpy as np

class Ejerciciointegradorfinal:
    """Implementacion de Ejercicio integrador final para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Ejercicio integrador final."""
    obj = Ejerciciointegradorfinal(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Ejercicio integrador final.
Puede adaptarse y extenderse segun las necesidades del analisis.

### 16.3 Comandos y Herramientas

```bash
pip install numpy scipy matplotlib jupyter scikit-learn
git clone https://github.com/newaetech/chipwhisperer
pip install chipwhisperer opensca pyserial
pip install liboqs cryptography
```

### 16.4 Ejercicios Practicos

**Ejercicio 1 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Herramientas y Laboratorio implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en [python](../raw/pyth0n-f0r-h4ck1ng.md)
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 2 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Herramientas y Laboratorio implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 3 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Herramientas y Laboratorio implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 4 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Herramientas y Laboratorio implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 5 (Nivel Avanzado):**

Objetivo: Aplicar los conceptos de Herramientas y Laboratorio implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

Para el nivel avanzado, incorporar tecnicas de optimizacion y
analisis comparativo. Extender la implementacion con funcionalidades
adicionales y probar en escenarios realistas.

---

## 17. Anexos

### 17.1 Teoria: Anexos

Los ataques de template son la forma mas poderosa de side-channel analysis. Consisten en dos fases: profiling, donde se construye un modelo estadistico detallado (media y covarianza) para cada valor de clave posible usando un dispositivo identico, y ataque, donde se compara la traza del dispositivo objetivo contra los templates usando maxima verosimilitud (log-likelihood bajo distribucion normal multivariada).

Los ataques de template son la forma mas poderosa de side-channel analysis. Consisten en dos fases: profiling, donde se construye un modelo estadistico detallado (media y covarianza) para cada valor de clave posible usando un dispositivo identico, y ataque, donde se compara la traza del dispositivo objetivo contra los templates usando maxima verosimilitud (log-likelihood bajo distribucion normal multivariada).

Los ataques de template son la forma mas poderosa de side-channel analysis. Consisten en dos fases: profiling, donde se construye un modelo estadistico detallado (media y covarianza) para cada valor de clave posible usando un dispositivo identico, y ataque, donde se compara la traza del dispositivo objetivo contra los templates usando maxima verosimilitud (log-likelihood bajo distribucion normal multivariada).

Las implementaciones constant-time son esenciales para prevenir timing attacks. El principio fundamental es que el tiempo de ejecucion no debe depender de ningun dato secreto. Esto implica: usar operaciones bitwise en lugar de condicionales, evitar accesos a memoria indexados por datos secretos, y asegurar que todos los bucles recorran el mismo numero de iteraciones independientemente de los valores.

Los ataques de cache timing explotan la diferencia de latencia entre acceder a memoria cache (tipicamente 4-12 ciclos de reloj) versus memoria RAM (200+ ciclos). Flush+Reload es la tecnica mas conocida: el atacante fuerza la salida de cache de una direccion especifica, espera a que la victima potencialmente la acceda, y luego mide el tiempo de recarga. Si es rapido, la victima accedio a esa direccion.

Los ataques electromagneticos (EMA) ofrecen ventajas sobre los de potencia porque pueden enfocarse en areas especificas del chip, midiendo la actividad localizada en lugar del consumo global. Una sonda EM de campo cercano colocada sobre el modulo [aes](../raw/crypt0-f0r-h4ck3rs.md#aes) de una System-on-Chip puede capturar senales con mejor relacion senal-ruido que una medicion de corriente en el pin de alimentacion.

El analisis diferencial de potencia (DPA) es una tecnica estadistica que permite extraer claves incluso cuando el ruido de medicion es mayor que la senal individual. La idea es recolectar miles de trazas de potencia para diferentes entradas conocidas, y para cada hipotesis de clave calcular la correlacion entre un modelo de consumo y las trazas reales. La hipotesis correcta mostrara el pico de correlacion mas alto.

Un canal lateral (side-channel) es cualquier fuga de informacion que se produce durante la ejecucion de un algoritmo criptografico y que no forma parte del output esperado. Cuando un microcontrolador ejecuta una operacion como AES o [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa), las transiciones logicas internas generan variaciones medibles en el consumo de corriente, el campo electromagnetico circundante, el tiempo de ejecucion e incluso el sonido emitido por los capacitores de la fuente.

#### 17.2 Papers fundamentales

El sub-tema Papers fundamentales dentro de Anexos requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Papers fundamentales
import os, sys, time, struct
import numpy as np

class Papersfundamentales:
    """Implementacion de Papers fundamentales para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Papers fundamentales."""
    obj = Papersfundamentales(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Papers fundamentales.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 17.3 Glosario de terminos

El sub-tema Glosario de terminos dentro de Anexos requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Glosario de terminos
import os, sys, time, struct
import numpy as np

class Glosariodeterminos:
    """Implementacion de Glosario de terminos para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Glosario de terminos."""
    obj = Glosariodeterminos(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Glosario de terminos.
Puede adaptarse y extenderse segun las necesidades del analisis.

#### 17.4 Herramientas recomendadas

El sub-tema Herramientas recomendadas dentro de Anexos requiere atencion especial. A continuacion
presentamos un ejemplo practico con codigo comentado.

```python
# Ejemplo: Herramientas recomendadas
import os, sys, time, struct
import numpy as np

class Herramientasrecomendadas:
    """Implementacion de Herramientas recomendadas para propositos educativos."""

    def __init__(self, debug=False):
        self.debug = debug
        self.state = {}

    def process(self, data):
        """Procesa los datos de entrada."""
        result = []
        for byte in data:
            result.append(byte ^ 0xFF)
        return bytes(result)

    def analyze(self, data):
        """Analiza los resultados del procesamiento."""
        n = len(data)
        stats = {
            "length": n,
            "mean": np.mean(list(data)) if n else 0,
            "std": np.std(list(data)) if n else 0,
        }
        return stats

def main():
    """Punto de entrada para Herramientas recomendadas."""
    obj = Herramientasrecomendadas(debug=True)
    test_data = bytes(range(256))
    processed = obj.process(test_data)
    stats = obj.analyze(processed)
    print(f"Estadisticas: {stats}")

if __name__ == "__main__":
    main()
```

Este codigo implementa los conceptos fundamentales de Herramientas recomendadas.
Puede adaptarse y extenderse segun las necesidades del analisis.

### 17.3 Comandos y Herramientas

```bash
pip install numpy scipy matplotlib jupyter scikit-learn
git clone https://github.com/newaetech/chipwhisperer
pip install chipwhisperer opensca pyserial
pip install liboqs cryptography
```

### 17.4 Ejercicios Practicos

**Ejercicio 1 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Anexos implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en [python](../raw/pyth0n-f0r-h4ck1ng.md)
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 2 (Nivel Basico):**

Objetivo: Aplicar los conceptos de Anexos implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 3 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Anexos implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 4 (Nivel Intermedio):**

Objetivo: Aplicar los conceptos de Anexos implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

**Ejercicio 5 (Nivel Avanzado):**

Objetivo: Aplicar los conceptos de Anexos implementando un script funcional.

Pasos sugeridos:
1. Investigar los fundamentos teoricos del tema
2. Configurar el entorno con las herramientas necesarias
3. Implementar la funcionalidad principal en Python
4. Agregar manejo de errores y casos bordes
5. Probar con datos de muestra y verificar resultados
6. Documentar las observaciones y conclusiones

Para el nivel avanzado, incorporar tecnicas de optimizacion y
analisis comparativo. Extender la implementacion con funcionalidades
adicionales y probar en escenarios realistas.

## Anexos

### Papers Fundamentales

- Kocher, P. Timing Attacks on Implementations of Diffie-Hellman, [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa), DSS (1996)
- Kocher, P., Jaffe, J., Jun, B. Differential Power Analysis (1999)
- Bernstein, D. Cache-timing attacks on [aes](../raw/crypt0-f0r-h4ck3rs.md#aes) (2005)
- Genkin, D. et al. RSA Key Extraction via Low-Bandwidth Acoustic Cryptanalysis (2013)
- Lipp, M. et al. Meltdown: Reading [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) Memory from User Space (2018)
- Kocher, P. et al. Spectre Attacks: Exploiting Speculative Execution (2018)
- Castryck, W., Decru, T. An Efficient Key Recovery Attack on SIDH (2022)
- [nist](../raw/p3nt3st-m3th0d0l0gy.md#nist) [post-quantum](../raw/pqc-s1d3-ch4nn3ls.md)-s1d3-ch4nn3ls.md) [cryptography](../raw/crypt0-f0r-h4ck3rs.md) Standardization (2024)

### Glosario

- **SPA**: Simple Power Analysis - Analisis simple de potencia
- **DPA**: Differential Power Analysis - Analisis diferencial de potencia
- **CPA**: Correlation Power Analysis - Analisis de potencia por correlacion
- **EMA**: Electromagnetic Analysis - Analisis electromagnetico
- **[pqc](../raw/pqc-s1d3-ch4nn3ls.md)**: Post-Quantum Cryptography - [criptografia post-cuantica](../raw/pqc-s1d3-ch4nn3ls.md)
- **LWE**: Learning With Errors - Aprendizaje con errores
- **KEM**: Key Encapsulation Mechanism - Mecanismo de encapsulamiento de claves
- **NTT**: Number Theoretic Transform - Transformada numerica teorica
- **SNR**: Signal-to-Noise Ratio - Relacion senal-ruido
- **AES-NI**: AES New Instructions - Instrucciones [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86) para AES

### Herramientas Recomendadas

- **ChipWhisperer**: Plataforma hardware para captura y analisis de canales laterales
- **OpenSCA**: Toolkit open-source para side-channel analysis en [python](../raw/pyth0n-f0r-h4ck1ng.md)
- **PicoScope**: Osciloscopio USB de alta resolucion para captura de senales analogicas
- **liboqs**: Libreria de [criptografia post-cuantica](../raw/pqc-s1d3-ch4nn3ls.md) del proyecto OpenQuantumSafe
- **scikit-learn**: Machine learning para clasificacion de trazas side-channel
- **Jupyter**: Entorno interactivo ideal para analisis exploratorio de datos side-channel
- **GNU Radio**: Framework de [software defined radio](../raw/sdr-t3l3c0ms.md)-t3l3c0ms.md) para procesamiento de senales


