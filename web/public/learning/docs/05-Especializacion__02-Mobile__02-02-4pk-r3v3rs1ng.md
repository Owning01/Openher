# R3v3rs1ng d3 4PKs — Guía completa (Deep Dive) ## Índice 1. [Arquitectura de una APK](#1-4rqu1t3ctur4-d3-un4-4pk)

> ⏱️ **Tiempo estimado:** 25 horas (~5 sesiones) (2627 lineas)


2. Herramientas Ese[nciales](#2-h3rr4m13nt4s-3s3nc14l3s)

3. [Flujo de Trabajo](#3-fluj0-d3-tr4b4j0)

4. [Apktool](#4-4pkt00l)

5. [Smali](#5-sm4l1)

6. [Dalvik vs ART](#6-d4lv1k-vs-4rt)

7. [Jadx](#7-j4dx)

8. [dex2jar + JD-GUI](#8-d3x2j4r--jd-gu1)

9. [Frida](#9-fr1d4)

10. [Objection](#10-0bj3ct10n)

11. Bypass de Ro[ot Detection](#11-byp4ss-d3-r00t-d3t3ct10n)

12. Emul[ador Detection Bypass](#12-3mul4t0r-d3t3ct10n-byp4ss)

13. [Xposed Framework](#13-xp0s3d-fr4m3w0rk)

14. [Ghidra](#14-gh1dr4)

15. [IDA Pro](#15-1d4-pr0)

16. [Deobfuscation](#16-d30bfusc4t10n)

17. [Dynamic Analysis](#17-dyn4m1c-4n4lys1s)

18. [Repackaging](#18-r3p4ck4g1ng)

19. Resou[rce Editing](#19-r3s0urc3-3d1t1ng)

20. [Reversing de Librerías Nativas](#20-r3v3rs1ng-d3-l1br3r%C3%ADas-n4t1v4s)

21. [Técnicas Anti-Reversing](#21-t3cn1c4s-4nt1-r3v3rs1ng)

22. [Debug Remoto](#22-d3bug-r3m0t0)

23. Extraer Firebase C[redentials](#23-extr44r-f1r3b4s3-cr3d3nt1als)

24. Flujo [completo](#24-fluj0-c0mpl3t0)

25. [Herramientas Automatizadas](#25-h3rr4m13nt4s-4ut0m4t1z4d4s)

26. [Troubleshooting](#26-tr0ubl3sh00t1ng)

27. [Referencia Rápida](#27-r3f3r3nc14-r4p1d4)

28. [Glosario](#28-gl0s4r10)

29. [Buenas Prácticas](#29-bu3n4s-pr4ct1c4s)

30. [Recursos](#30-r3curs0s)

31. [Análisis de Malware](#31-4n4l1s1s-d3-m4lw4r3)

32. [frida Avanzado](#32-fr1d4-4v4nz4d0)

33. [Automatización de Reversing](#33-4ut0m4t1z4c1%C3%B3n-d3-r3v3rs1ng)

34. [Comparativa de Decompiladores](#34-d3c0mp4r4t1v4-d3-d3c0mp1l4d0r3s)

35. [Reversing de AAB](#35-r3v3rs1ng-d4-4ab)

36. [Reversing de APEX](#36-r3v3rs1ng-d4-4p3x)

37. [cifrado y Ofuscación](#37-c1fr4d0-y-0fusc4c10n)

38. [Multi-DEX](#38-mult1-d3x)

39. [Cheatsheet](#39-ch34tsh33t)

40. [Referencia de API](#40-r3f3r3nc14-d3-4p1)

41. [Proyectos Prácticos](#41-pr0y3ct0s-pr4ct1c0s) - Proyecto 1: [apk Autopsy — Framework de análisis automatizado](#proyecto-1-apk-autopsy--framework-de-an%C3%A1lisis-automatizado) - Proyecto 2: [frida](../raw/4pk-r3v3rs1ng.md#frida) Hook Genera[tor — Generador de Scripts de Hooking](#proyecto-2-frida-hook-generator--generador-de-scripts-de-hooking) - Proyecto 3: Droid N[etwork Analyzer — Analizador de Tráfico de Red](#proyecto-3-droid-network-analyzer--analizador-de-tr%C3%A1fico-de-red) El reversing de APKs es el arte de desarmar una aplicación [android](../raw/4db-d33p-d1v3.md) para entender cómo funciona por dentro, modificar su comportamiento, extraer información sensible, o encontrar vulnerabilidades. Esta guía cubre desde lo básico hasta técnicas avanzadas de instrumentación dinámica. --- ## 1. Arquitectura de una [apk](../raw/4pk-r3v3rs1ng.md) Una [apk](../raw/4pk-r3v3rs1ng.md) ([android](../raw/4db-d33p-d1v3.md) Application Package) es un archivo Zip que contiene todo lo necesario para ejecutar una app en [android](../raw/4db-d33p-d1v3.md). ```

APK (ZIP)

├── AndroidManifest.xml (binario, AXML)

├── classes.dex (código Dalvik ejecutable)

├── classes2.dex, classes3.dex.. (multi-dex)

├── resources.arsc (recursos compilados)

├── res/ (recursos: layouts, drawables, etc.)

├── lib/ (librerías nativas .so)

│ ├── armeabi-v7a/

│ ├── arm64-v8a/

│ ├── [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86)/

│ └── x86_64/

├── META-INF/ (firmas y certificados)

│ ├── MANIFEST.MF

│ ├── CERT.[rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa)

│ └── CERT.SF

├── assets/ (archivos raw)

└── kotlin/ (metadatos de Kotlin)

``` ### Estructura detallada **AndroidManifest.xml**: La hoja de ruta de la app. Contiene package name, versiones, [permisos](./raw/0s, activities, services, providers, receivers. Cuando decompilás, apktool lo convierte de binario AXML a XML legible. **classes.dex**: El código compilado a bytecode Dalvik. Android 5+ puede tener múltiples archivos DEX (multi-dex). Se decompila a smali con `baksmali` o a Java con `jadx`/`dex2jar`. **resources.arsc**: Tabla de recursos compilada. Contiene strings, colores, estilos, temas. Apktool la descompila a archivos .yml y res/values/. **lib/**: Librerías nativas compiladas para distintas arquitecturas (ARM, ARM64, x86mbly-f0r). Son archivos .so (ELF) que se cargan con `System.loadLibrary`. **META-INF/**: Firma digital de la APK. Android verifica la firma antes de instalar. Si modificás algún archivo dentro de la APK, las firmas no coinciden y tenés que resignar. ```bash

# Verificar que una APK es un ZIP válido

file app.apk

# Salida: app.apk: Zip archive data # Listar contenido sin extraer

unzip -l app.apk | head -30 # Extraer APK manualmente

unzip app.apk -d extracted_apk/ # Ver permisos del manifest sin decompilar

aapt dump permissions app.apk # Ver información de versiones

aapt dump badging app.apk | grep -E "package|version" # Ver archivos de firma

unzip -l app.apk | grep META-INF # Verificar integridad del certificado

openssl pkcs7 -inform DER -in extracted_apk/META-INF/CERT.RSA -print_certs | openssl x509 -text | head -20

``` --- ## 2. Herramientas Esenciales | Herramienta | Propósito | Sitio |

|-------------|-----------|-------|

| apktooltool) | Decompilar/recompilar APK | httpss)://[apktool](../raw/4pk-r3v3rs1ng.md#apktool).org |

| jadxx) | Decompilar DEX a Java | [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://github.[com](../raw/w1n-s9bsyst3ms.md#com)/skylot/[jadx](../raw/4pk-r3v3rs1ng.md#jadx) |

| [dex2jar](../raw/4pk-r3v3rs1ng.md#dex2jar) | Convertir DEX a JAR | https://github.com/pxb1988/[dex2jar](../raw/4pk-r3v3rs1ng.md#dex2jar) |

| JD-GUI | Visualizar JAR decompilado | https://java-decompiler.github.io |

| baksmali/[smali](../raw/4pk-r3v3rs1ng.md#smali) | Assembler/Disassembler DEX | https://github.com/JesusFreke/[smali](../raw/4pk-r3v3rs1ng.md#smali) |

| frida | Instrumentación dinámica | https://frida.re |

| Objection | Exploration runtime | https://github.com/sensepost/objection |

| [ghidra](../raw/4pk-r3v3rs1ng.md#ghidra) | Reversing de nativas | https://[ghidra](../raw/4pk-r3v3rs1ng.md#ghidra)-sre.org |

| IDA Pro | Reversing avanzado | https://hex-rays.com |

| android Studio | Debugging y análisis | https://developer.android.com/studio |

| APK Analyzer | Análisis rápido | Build -> Analyze APK (Android Studio) |

| MobSF | Framework automatizado | https://github.com/MobSF/Mobile-Security-Framework-MobSF |

| QARK | vulnerabilidades | https://github.com/linkedin/qark |

| Androguard | Análisis estático [python](../raw/pyth0n-f0r-h4ck1ng.md) | https://github.com/androguard/androguard |

| Enjarify | DEX a JAR alternativo | https://github.com/google/enjarify |

| Simplify | Desofuscador Android | https://github.com/CalebFenton/simplify | ```bash

# Instalación rápida de herramientas

# apktool: descargar el jar de apktool.org

wget https://raw.githubusercontent.com/iBotPeaches/Apktool/master/scripts/linux/apktool

[chmod](../raw/0s-f0nd4m3nt0s.md#permisos) +x apktool # jadx:

git clone https://github.com/skylot/jadx.git

cd jadx && ./gradlew dist # dex2jar:

git clone https://github.com/pxb1988/dex2jar.git # Frida (Python):

pip install frida-tools # Objection:

pip install objection

``` --- ## 3. Flujo de Trabajo 1. **Extraer apk** del dispositivo con `adb pull` o desde una URL

2. **Decompilar** con apktool `apktool d app.apk`

3. **Analizar manifest** (androidManifest.xml decompilado)

4. **Decompilar código** con jadx (`jadx app.apk`)

5. **Extraer strings** sensibles (API keys, URLs, tokens)

6. **Analizar librerías nativas** si existen (lib/)

7. **Buscar endpoints**, firebase URLs, credenciales

8. **Modificar comportamiento** (editar smali, parchar, etc.)

9. **Recompilar** con apktool `apktool b directorio/`

10. **Resignar** con `jarsigner` o `apksigner`

11. **Instalar** y probar la APK modificada ```bash

# Flujo completo en una línea:

apktool d app.apk -o app_decompiled &&

jadx -d app_java app.apk &&

echo "Análisis completado"

``` --- ## 4. apktooltool) Apktool es la herramienta fundamental para decompilar y recompilar APKs. funciona decodeando recursos (resources.arsc) y código (classes.dex a smali). ```bash

# Decompilar APK a directorio

apktool d app.apk

# Crea directorio app/ con: AndroidManifest.xml, smali/, res/, etc. # Decompilar a directorio específico

apktool d app.apk -o custom_dir/ # Decompilar SIN decodear recursos (más rápido, solo smali)

apktool d -r app.apk # Decompilar SIN decodear código fuente (solo recursos)

apktool d -s app.apk # Decompilar forzado (sobrescribe)

apktool d -f app.apk # Decompilar con recursos en modo avanzado

apktool d --match-bytecode --only-main-classes app.apk # Recompilar

apktool b app/ -o app_new.apk # Recompilar sin resources.arsc (para cambios solo en smali)

apktool b --use-aapt2 app/ -o app_new.apk # Ver framework (depende de la versión de Android)

apktool if framework-res.apk # Listar frameworks instalados

apktool --version # Errores comunes:

# - BrutException: falta framework → apktool if framework-res.apk

# - Could not decode arsc → usar -r para saltar recursos

``` **Principales archivos generados por apktool:** | Archivo | Contenido |

|---------|-----------|

| androidManifest.xml | Manifest decompilado (ya no AXML) |

| smali/ | Código smali de classes.dex |

| smali_classes2/ | Multi-dex smali |

| res/ | Recursos originales |

| res/values/ | Strings, colores, estilos (solo sin -r) |

| apktool.yml | Metadatos de la decompilación |

| unknown/ | Archivos no reconocidos |

| lib/ | Librerías nativas |

| original/ | Copia original de la APK | --- ## 5. smali Smali es el lenguaje assemblymbly-f0r del bytecode Dalvik. Cada archivo .smali corresponde a una clase Java. ```smali

# Ejemplo de clase smali básica

.class public Lcom/example/app/MainActivity;

.super Landroid/app/Activity;

.source "MainActivity.java" # Campos

.field private static TAG:Ljava/lang/String; = "MainActivity"

.field private counter:I = 0 # Método directo

.method public constructor <init>V .registers 1 invoke-direct {p0}, Landroid/app/Activity;-><init>V return-void

.end method # Método virtual

.method public onCreate(Landroid/os/Bundle;)V .registers 3 .param p1, "savedInstanceState" # Landroid/os/Bundle; invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V const v0, 0x7f0a001f invoke-virtual {p0, v0}, Lcom/example/app/MainActivity;->setContentView(I)V return-void

.end method

``` ### Instrucciones smali más comunes | Instrucción | Descripción |

|-------------|-------------|

| const v0, 0x1 | Cargar constante en registro |

| const-string v0, "texto" | Cargar string |

| const/4 v0, 0x1 | Cargar constante de 4 bits |

| const/16 v0, 0x100 | Cargar constante de 16 bits |

| const-wide v0, 0x1234L | Cargar constante long |

| move v0, v1 | Copiar registro |

| move-result v0 | Mover resultado de invoke |

| move-object v0, v1 | Copiar referencia de objeto |

| return-void | Return void |

| return v0 | Return valor |

| return-object v0 | Return objeto |

| if-eq v0, v1, :cond | If igual |

| if-ne v0, v1, :cond | If no igual |

| if-lt v0, v1, :cond | If menor que |

| if-ge v0, v1, :cond | If mayor o igual |

| goto :label | Salto incondicional |

| invoke-virtual | Llamar método virtual |

| invoke-super | Llamar superclase |

| invoke-direct | Llamar constructor |

| invoke-static | Llamar método estático |

| invoke-interface | Llamar método de interfaz |

| sget-object v0, Lclass;->field:Ltype; | Get static field |

| sput-object v0, Lclass;->field:Ltype; | [set](../raw/ph1sh1ng.md#social-engineering-toolkit) static field |

| iget-object v0, p0, Lclass;->field:Ltype; | Get instance field |

| iput-object v0, p0, Lclass;->field:Ltype; | Set instance field |

| new-instance v0, Lclass; | Crear nueva instancia |

| array-length v0, v1 | Length de array |

| aget-object v0, v1, v2 | Get de array |

| aput-object v0, v1, v2 | Set en array |

| monitor-enter v0 | Bloque synchronized |

| monitor-exit v0 | Exit synchronized |

| throw v0 | Lanzar excepción |

| check-cast v0, Lclass; | Type cast |

| instance-of v0, v1, Lclass; | Instanceof check | ### Tipos de datos en smali | Tipo Smali | Tipo Java |

|------------|-----------|

| V | void |

| Z | boolean |

| B | byte |

| S | short |

| C | char |

| I | int |

| J | long |

| F | float |

| D | double |

| I | int |

| [[I | int |

| Ljava/lang/String; | String |

| Lpackage/name/Class; | Object | ### Modificar comportamiento editando smali ```smali

# Ejemplo: saltar verificación de licencia

# Código original:

# invoke-static {p1}, Lcom/example/LicenseUtils;->verifyLicense(Landroid/content/Context;)Z

# move-result v0

# if-nez v0, :cond_license_fail # Modificado: siempre devolver verdadero

const/4 v0, 0x1  # v0 = true

# Comentar out invoke-static original

# invoke-static {p1}, Lcom/example/LicenseUtils;->verifyLicense(Landroid/content/Context;)Z

# move-result v0 # También se puede saltar condicional:

const/4 v0, 0x1

goto :cond_licencia_ok

``` ```smali

# Cambiar URL de endpoint:

const-string v0, "https://api.ejemplo.com"

# a:

const-string v0, "https://api.mitmproxy.com"

``` --- ## 6. Dalvik vs ART | Característica | Dalvik (android 4.4-) | ART (Android 5+) |

|----------------|----------------------|-------------------|

| compilación | jitr (Just In Time) | Aot (Ahead Of Time) / [[jit](../raw/br0ws3r-3xpl01t4t10n.md#jit) híbrido |

| Instalación | Rápida | Lenta (dex2oat) |

| Rendimiento | Menor | Mayor (código nativo) |

| Archivo de salida | .dex | .oat (ELF con código nativo) |

| Optimización | dexopt | dex2oat |

| Tamaño | Menor | Mayor (archivos .oat) |

| Tiempo de arranque | Más lento | Más rápido | ART compila el DEX a código nativo durante la instalación (dex2oat), lo que hace que el código sea más rápido pero la instalación sea más lenta. ```bash

# Verificar el runtime actual

[adb](../raw/4db-d33p-d1v3.md) shell getprop persist.sys.dalvik.vm.lib.2

# libart.so  → ART

# libdvm.so  → Dalvik # Archivos OAT generados por ART

adb shell ls /data/dalvik-cache/ # Convertir OAT a DEX para reversing

# Usar oat2dex o ADBI

``` --- ## 7. jadxx) Jadx es el mejor de[compilador](./raw/pr0gr4mm1ng DEX a Java. Soporta GUI y línea de comandos. ```bash

# Decompilar APK completa a Java

jadx app.apk # Decompilar a directorio específico

jadx -d output_dir/ app.apk # Decompilar con desofuscación

jadx --deobf app.apk # Decompilar en modo silencioso

jadx -q app.apk # Mostrar progreso

jadx --show-progress app.apk # Decompilar solo ciertos paquetes

jadx -e app.apk -j 8 --deobf app.apk # Decompilar DEX directamente

jadx classes.dex # GUI

jadx-gui app.apk # Buscar texto en código decompilado (CLI)

jadx -d out/ app.apk && grep -r "firebase" out/ # Exportar gradle project

jadx -d out/ --output-type gradle app.apk

``` **funcionalidades clave de jadx-gui:**

- Navegación por paquetes y clases

- Búsqueda global con Ctrl+Shift+F

- Modo desofuscación para nombres ofuscados

- Cross-reference (usages de métodos y campos)

- Exportar a gradle project para debugging

- Análisis de código con colores sintácticos

- Soporte de plugins --- ## 38. Multi-DEX ```bash

# Listar archivos DEX en la APK

unzip -l app.apk | grep \"classes.*dex\" # Ejemplo:

# classes.dex (principal)

# classes2.dex

# classes3.dex # Decompilar múltiples DEX con jadx

jadx -d output/ classes.dex classes2.dex classes3.dex # O directamente desde la APK

jadx -d output/ app.apk # Apktool maneja multi-DEX automáticamente

# Los smali se crean en smali_classes2/, smali_classes3/, etc.

apktool d app.apk -o app_out/

ls app_out/ | grep smali # El manifest indica si la app soporta multi-dex:

grep \"android:name=\\\"android.support.multidex.MultiDexApplication\\\"\" AndroidManifest.xml # Límite de métodos por DEX: 65536 (64K reference limit)

# Si la app supera eso, necesita multi-DEX

``` --- ## 39. Cheatsheet ```bash

# === CHEATSHEET DE REVERSING DE APKS === # DECOMPILAR

apktool d app.apk

jadx -d out/ app.apk

d2j-dex2jar.sh app.apk && jd-gui app-dex2jar.jar # RECOMPILAR Y FIRMAR

apktool b app/ -o new.apk

jarsigner -keystore debug.keystore -storepass android new.apk debug

zipalign -v -p 4 new.apk final.apk

adb install -r final.apk # FRIDA

frida-ps -Ua

frida -U -l script.js com.package.name # OBJECTION

objection -g com.package.name explore # INFORMACIÓN DEL APK

aapt dump badging app.apk

aapt dump permissions app.apk

aapt dump configurations app.apk # BUSCAR STRINGS

strings app.apk | grep -i \"password\\|token\\|secret\\|api\"

grep -rE \"(AIzaSy|firebaseio|google_api)\" src/ # ANDROID STUDIO DEBUG

adb forward tcp:8700 jdwp:\21424

jdb -connect com.sun.jdi.SocketAttach:hostname=localhost,port=8700 # EXTRAER APK DEL DISPOSITIVO

adb shell pm path com.package.name

adb pull /data/app/com.package.name-xyz/base.apk

``` --- ## 40. Referencia de API | API | Método | Descripción |

|-----|--------|-------------|

| DexClassl)oader | loadClass | Carga clases dinámicamente (malware) |

| Runtime.exec | exec | Ejecuta comandos shell |

| ProcessBuilder | start | Alternativa a Runtime.exec |

| ZipFile | entries | Lista contenido de ZIP (integridad) |

| DexFile | loadDex | Carga DEX desde archivo |

| PackageManager | getPackageInfo | Información del paquete |

| PackageManager | getInstallerPackageName | Quién instaló la app |

| System.loadLibrary | load | Carga .so nativo |

| System.load | load | Carga .so desde ruta absoluta |

| JNI_OnLoad | load | Init de librería nativa |

| ContentResolver | query | Query a content providers |

| MediaRecorder | start | Grabación (peligro si sin permiso) |

| Camera.open | open | Acceso a cámara |

| TelephonyManager | getDeviceId | Obtener IMEI |

| wifiManager | getConnectionInfo | Información [wifi](../raw/w1f1-4tt4cks.md) |

| LocationManager | getLastKnownLocation | Última ubicación |

| Cipher | doFinal | Operaciones de [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) |

| SecretKeySpec | getEncoded | Obtener clave de cifrado |

| sqliteDatabase | rawQuery | Query SQL directo |

| SharedPreferences | getAll | Leer preferencias | --- ## 41. Proyectos Prácticos ### Proyecto 1: apk Autopsy — Framework de análisis automatizado ```python

#!/usr/bin/env python3

\"\"\"apk_autopsy.py - Framework automatizado de análisis de APKs\"\"\"

import os, sys, json, subprocess, re, shutil

from datetime import datetime

from pathlib import Path class APKAutopsy: def __init__(self, apk_path): self.apk_path = Path(apk_path) self.apk_name = self.apk_path.stem self.output_dir = Path(f\"autopsy_{self.apk_name}_{datetime.now.strftime('%Y%m%d_%H%M%S')}\") self.dirs = { 'smali': self.output_dir / '01_smali', 'java': self.output_dir / '02_java', 'strings': self.output_dir / '03_strings', 'report': self.output_dir / '04_report', } self.findings = {'urls': , 'api_keys': , 'firebase': , 'emails': , '[ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips)': , 'permissions': , 'activities': } def run_cmd(self, cmd, timeout=300): try: r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout) return r.stdout except: return \"\" def decompile(self): print(\"[1] Decompilando..\") self.run_cmd([\"apktool\", \"d\", \"-f\", \"-o\", str(self.dirs['smali']), str(self.apk_path)]) self.run_cmd([\"jadx\", \"--deobf\", \"-d\", str(self.dirs['java']), str(self.apk_path)]) def extract_strings(self): print(\"[2] Extrayendo strings..\") output = self.run_cmd([\"strings\", str(self.apk_path)]) for pattern, key in [ (r'https?://[a-zA-Z0-9./?=_/-]+', 'urls'), (r'AIzaSy[A-Za-z0-9_-]{33}', 'api_keys'), (r'[a-z0-9-]+\\.firebaseio\\.com', 'firebase'), (r'[\\w._%+-]+@[\\w.-]+\\.\\w{2,}', 'emails'), ]: self.findings[key] = sorted(set(re.findall(pattern, output)) print(f\"  {key}: {len(self.findings[key])}\") def analyze_manifest(self): print(\"[3] Analizando manifest..\") mf = self.dirs['smali'] / 'AndroidManifest.xml' if mf.exists: content = mf.read_text(errors='ignore') self.findings['permissions'] = re.findall(r'name=\"([^\"]+)\"', content) def generate_report(self): for d in self.dirs.values: d.mkdir(parents=True, exist_ok=True) report = self.output_dir / '04_report' / 'report.json' report.write_text(json.dumps(self.findings, indent=2) print(f\"\\n[✓] Reporte: {report}\") def run(self): print(f\"=== APK Autopsy: {self.apk_path.name} ===\\n\") self.decompile self.extract_strings self.analyze_manifest self.generate_report print(\"\\n=== Autopsia completada ===\") if __name__ == \"__main__\": if len(sys.argv) < 2: print(\"Uso: python apk_autopsy.py <apk_path>\") sys.exit(1) APKAutopsy(sys.argv[1]).run

``` ### Proyecto 2: frida Hook Generator ```javascript

Java.perform(function { var targetPackage = \"com.package.name\"; console.log(\"[*] Generando hooks para: \" + targetPackage); Java.enumerateLoadedClasses({ onMatch: function(className) { if (className.startsWith(targetPackage) { try { var clazz = Java.use(className); var methods = clazz.class.getDeclaredMethods; for (var i = 0; i < methods.length; i++) { var method = methods[i]; var methodName = method.getName; var paramTypes = ; var params = method.getParameterTypes; for (var j = 0; j < params.length; j++) { paramTypes.push(params[j].getName); } console.log(\"// \" + className + \".\" + methodName + \"(\" + paramTypes.join(\", \") + \")\"); } } catch(e) {} } }, onComplete: function { console.log(\"[+] Enumeración completada\"); } });

});

``` ### Proyecto 3: Droid Network Analyzer ```python

#!/usr/bin/env python3

\"\"\"droid_network_analyzer.py\"\"\"

import subprocess, sys, time, os, re def monitor_package(package, duration=30): print(f\"[*] Monitoreando {package} por {duration}s..\") pid = subprocess.run([\"adb\", \"shell\", \"pidof\", \"-s\", package], capture_output=True, text=True).stdout.strip if not pid: subprocess.run([\"adb\", \"shell\", \"monkey\", \"-p\", package, \"1\"]) time.sleep(2) pid = subprocess.run([\"adb\", \"shell\", \"pidof\", \"-s\", package], capture_output=True, text=True).stdout.strip print(f\"[*] PID: {pid}\") end = time.time + duration while time.time < end: netstat = subprocess.run([\"adb\", \"shell\", \"netstat\", \"-tlnp\"], capture_output=True, text=True).stdout if pid in netstat: print(f\" Conexiones activas\") for line in netstat.split(\"\\n\"): if pid in line: print(f\" {line}\") time.sleep(2) print(\"[*] Monitoreo completado\") if __name__ == \"__main__\": if len(sys.argv) < 2: print(\"Uso: python droid_network_analyzer.py <package> [duration]\") sys.exit(1) duration = int(sys.argv[2]) if len(sys.argv) > 2 else 30 monitor_package(sys.argv[1], duration)

``` --- --- *Documento generado para fines educativos y de investigación en seguridad.*

*Versión: 3.0 — APK Reversing Deep Dive + Proyectos Prácticos*

*Última actualización: Mayo 2026* --- ## ANEXO A: smali — Referencia completa de Instrucciones ### Instrucciones de movimiento | Instrucción | Descripción | Ejemplo |

|-------------|-------------|---------|

| move vA, vB | Copia valor de vB a vA | move v0, v1 |

| move/from16 vAA, vBBBB | Move desde 16-bit | move/from16 v0, v1 |

| move/16 vAAAA, vBBBB | Move 16-bit | move/16 v0, v1 |

| move-wide vA, vB | Move (long/double) | move-wide v0, v1 |

| move-object vA, vB | Move objeto | move-object v0, v1 |

| move-result vAA | Mover resultado de invoke | move-result v0 |

| move-result-wide vAA | Mover resultado long | move-result-wide v0 |

| move-result-object vAA | Mover resultado objeto | move-result-object v0 |

| move-exception vAA | Mover excepción | move-exception v0 | ### Instrucciones de retorno | Instrucción | Descripción |

|-------------|-------------|

| return-void | Retornar sin valor |

| return vAA | Retornar valor |

| return-wide vAA | Retornar long/double |

| return-object vAA | Retornar objeto | ### Instrucciones de constantes | Instrucción | Descripción |

|-------------|-------------|

| const/4 vA, #+B | Constante de 4 bits |

| const/16 vAA, #+BBBB | Constante de 16 bits |

| const vAA, #+BBBBBBBB | Constante de 32 bits |

| const/high16 vAA, #+BBBB0000 | Constante high 16 bits |

| const-wide/16 vAA, #+BBBB | Long de 16 bits |

| const-wide/32 vAA, #+BBBBBBBB | Long de 32 bits |

| const-wide vAA, #+BBBBBBBBBBBBBBBB | Long de 64 bits |

| const-string vAA, string@BBBB | String |

| const-class vAA, type@BBBB | Clase |

| const-wide/high16 vAA, #+BBBB000000000000 | Long high 16 | ### Instrucciones de invocación | Instrucción | Descripción |

|-------------|-------------|

| invoke-virtual | Llamada a método virtual |

| invoke-super | Llamada a método de superclase |

| invoke-direct | Llamada a método directo (constructor) |

| invoke-static | Llamada a método estático |

| invoke-interface | Llamada a método de interfaz | ### Instrucciones de comparación y salto | Instrucción | Descripción |

|-------------|-------------|

| goto | Salto incondicional |

| goto/16 | Salto incondicional 16-bit |

| goto/32 | Salto incondicional 32-bit |

| if-eq vA, vB, target | Si A == B |

| if-ne vA, vB, target | Si A != B |

| if-lt vA, vB, target | Si A < B |

| if-ge vA, vB, target | Si A >= B |

| if-gt vA, vB, target | Si A > B |

| if-le vA, vB, target | Si A <= B |

| if-eqz vAA, target | Si A == 0 |

| if-nez vAA, target | Si A != 0 |

| if-ltz vAA, target | Si A < 0 |

| if-gez vAA, target | Si A >= 0 |

| if-gtz vAA, target | Si A > 0 |

| if-lez vAA, target | Si A <= 0 |

| cmpl-float | Comparar float (menor) |

| cmpg-float | Comparar float (mayor) |

| cmpl-double | Comparar double (menor) |

| cmpg-double | Comparar double (mayor) |

| cmp-long | Comparar long |

| switch | Switch case (sparse) |

| packed-switch | Switch case (packed) | ### Instrucciones de campo | Instrucción | Descripción |

|-------------|-------------|

| iget vA, vB, field@CCCC | Get instance field (int) |

| iget-wide vA, vB, field@CCCC | Get instance field (long) |

| iget-object vA, vB, field@CCCC | Get instance field (object) |

| iget-boolean vA, vB, field@CCCC | Get instance field (boolean) |

| iget-byte vA, vB, field@CCCC | Get instance field (byte) |

| iget-char vA, vB, field@CCCC | Get instance field (char) |

| iget-short vA, vB, field@CCCC | Get instance field (short) |

| iput vA, vB, field@CCCC | set instance field (int) |

| iput-wide vA, vB, field@CCCC | Set instance field (long) |

| iput-object vA, vB, field@CCCC | Set instance field (object) |

| iput-boolean vA, vB, field@CCCC | Set instance field (boolean) |

| iput-byte vA, vB, field@CCCC | Set instance field (byte) |

| iput-char vA, vB, field@CCCC | Set instance field (char) |

| iput-short vA, vB, field@CCCC | Set instance field (short) |

| sget vAA, field@BBBB | Get static field (int) |

| sget-wide vAA, field@BBBB | Get static field (long) |

| sget-object vAA, field@BBBB | Get static field (object) |

| sget-boolean vAA, field@BBBB | Get static field (boolean) |

| sget-byte vAA, field@BBBB | Get static field (byte) |

| sget-char vAA, field@BBBB | Get static field (char) |

| sget-short vAA, field@BBBB | Get static field (short) |

| sput vAA, field@BBBB | Set static field (int) |

| sput-wide vAA, field@BBBB | Set static field (long) |

| sput-object vAA, field@BBBB | Set static field (object) |

| sput-boolean vAA, field@BBBB | Set static field (boolean) |

| sput-byte vAA, field@BBBB | Set static field (byte) |

| sput-char vAA, field@BBBB | Set static field (char) |

| sput-short vAA, field@BBBB | Set static field (short) | --- ## frida Gadget (sin root) Cuando no tenés root pero la app es debugeable, inyectás Frida Gadget en la apk. ```bash

# 1. Descargar frida-gadget

wget https://github.com/frida/frida/releases/download/16.0.0/frida-gadget-16.0.0-android-arm64.so

# 2. Decompilar APK

apktool d app.apk -o app_out/

# 3. Copiar frida-gadget a lib/

cp frida-gadget-16.0.0-android-arm64.so app_out/lib/arm64-v8a/libfrida-gadget.so

# 4. Recompilar y firmar

apktool b app_out/ -o app_with_frida.apk

jarsigner -keystore debug.keystore -storepass android app_with_frida.apk debug

adb install -r app_with_frida.apk

``` --- ## frida Stalker ```javascript

Stalker.follow(Process.getCurrentThreadId, { events: { call: true, ret: true, exec: true }, onReceive: function(events) { console.log("Events: " + events.length); }, transform: function(iterator) { var instruction = iterator.next; while (instruction !== null) { console.log(instruction.mnemonic + " " + instruction.opStr); instruction = iterator.keep; instruction = iterator.next; } }

});

``` --- ## frida para bypass de biometría ```javascript

Java.perform(function { var FingerprintManager = Java.use("android.hardware.fingerprint.FingerprintManager"); FingerprintManager.hasEnrolledFingerprints.implementation = function { return true; }; FingerprintManager.isHardwareDetected.implementation = function { return true; }; FingerprintManager.authenticate.overload("android.hardware.fingerprint.FingerprintManager$CryptoObject", "android.os.CancellationSignal", "int", "android.hardware.fingerprint.FingerprintManager$AuthenticationCallback", "android.os.Handler").implementation = function(crypto, cancel, flags, callback, handler) { console.log("[*] Fingerprint authenticate bypass!"); var result = Java.use("android.hardware.fingerprint.FingerprintManager$AuthenticationResult").class.newInstance; callback.onAuthenticationSucceeded(result); return null; };

});

``` --- ## Instalación de herramientas en Kali Linux ```bash

# Kali viene con muchas herramientas preinstaladas

apt update && apt install -y apktool jadx dex2jar

pip3 install frida-tools objection

wget https://github.com/frida/frida/releases/download/16.0.0/frida-server-16.0.0-android-arm64.xz

xz -d frida-server-16.0.0-android-arm64.xz

chmod +x frida-server-16.0.0-android-arm64

adb push frida-server-16.0.0-android-arm64 /data/local/tmp/ # MobSF en [docker](../raw/d0ck3r-f0r-h4ck3rs.md)

docker pull opensecurity/mobile-security-framework-mobsf

docker run -it -p 8000:8000 opensecurity/mobile-security-framework-mobsf # Ghidra

wget https://github.com/NationalSecurityAgency/ghidra/releases/download/10.3.3/ghidra_10.3.3_PUBLIC.zip

unzip ghidra_10.3.3_PUBLIC.zip

./ghidra_10.3.3_PUBLIC/ghidraRun

``` --- ## Hooking de cifradoc con frida ```javascript

Java.perform(function { var Cipher = Java.use("javax.crypto.Cipher"); var KeyGenerator = Java.use("javax.crypto.KeyGenerator"); var SecretKeySpec = Java.use("javax.crypto.spec.SecretKeySpec"); var IvParameterSpec = Java.use("javax.crypto.spec.IvParameterSpec"); // Hook doFinal (cifrado/descifrado) Cipher.doFinal.overload("[B").implementation = function(input) { console.log("[*] Cipher.doFinal llamado"); console.log("  Input: " + bytesToHex(input); var result = this.doFinal(input); console.log("  Output: " + bytesToHex(result); console.log("  Output string: " + String.fromCharCode.apply(null, new Uint8Array(result)); return result; }; // Hook init para ver el modo y la clave Cipher.init.overload("int", "java.security.Key").implementation = function(mode, key) { var modeStr = mode === 1 ? "ENCRYPT" : mode === 2 ? "DECRYPT" : "UNKNOWN"; console.log("[*] Cipher.init - Modo: " + modeStr); console.log("  Algoritmo: " + key.getAlgorithm); if (key.getEncoded) { console.log("  Key: " + bytesToHex(key.getEncoded); } return this.init(mode, key); }; function bytesToHex(bytes) { var hex = ; for (var i = 0; i < bytes.length; i++) { hex.push(bytes[i] >>> 4).toString(16); hex.push(bytes[i] & 0xF).toString(16); } return hex.join(""); }

});

``` --- ## Bypass de ssl) Pinning - Métodos avanzados ```javascript

// Método 1: Objection (automático)

objection -g com.package.name explore --startup-command "android sslpinning disable" // Método 2: Frida Universal

frida -U -l frida-[ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls))-universal.js com.package.name // Método 3: Reemplazar TrustManager

Java.perform(function { var TrustManagerClass = Java.registerClass({ name: "com.example.TrustAllManager", implements: [Java.use("javax.net.ssl.X509TrustManager")], methods: { checkClientTrusted: function {}, checkServerTrusted: function {}, getAcceptedIssuers: function { return ; } } }); var SSLContext = Java.use("javax.net.ssl.SSLContext"); SSLContext.init.overload("[Ljavax.net.ssl.KeyManager;", "[Ljavax.net.ssl.TrustManager;", "java.security.SecureRandom").implementation = function(km, tm, sr) { this.init(km, [TrustManagerClass.$new], sr); };

}); // Método 4: OkHttp interceptor

Java.perform(function { var OkHttpClient = Java.use("okhttp3.OkHttpClient"); OkHttpClient.newBuilder.implementation = function { var builder = this.newBuilder; builder.hostnameVerifier.implementation = function(hostname, session) { return true; }; return builder; };

});

``` --- *Documento generado para fines educativos y de investigación en seguridad.*

*Versión: 3.0 - apk Reversing Deep Dive + Proyectos Prácticos*

*Última actualización: Mayo 2026* --- ## ANEXO D: smali para pentesters ### Type descriptors | Smali Type | Java Equivalent | Size |

|------------|-----------------|------|

| V | void | 0 |

| Z | boolean | 1 bit |

| B | byte | 1 byte |

| S | short | 2 bytes |

| C | char | 2 bytes |

| I | int | 4 bytes |

| J | long | 8 bytes |

| F | float | 4 bytes |

| D | double | 8 bytes |

| I | int | varies |

| [[I | int | varies |

| Ljava.lang.String; | String | object | ### Method signatures Format: Lpackage/Class;->methodName(LparamTypes;)LreturnType; Examples:

- \Lcom/example/MyClass;->doSomething(ILjava/lang/String;)Z\

- \Lcom/example/MyClass;->calculate(II)J\

- \Lcom/example/MyClass;->voidMethodV\ ### Modificando Smali - Case Studies **Caso 1: Eliminar licencia check**

```smali

# Original:

# invoke-static {p0}, Lcom/example/License;->isValid(Landroid/content/Context;)Z

# move-result v0

# if-nez v0, :cond_no_license # Modificado:

const/4 v0, 0x1

# invoke-static comentado

``` **Caso 2: Cambiar URL de endpoint**

```smali

# Original:

const-string v0, "https://api.real.com/v1" # Modificado:

const-string v0, "[[http](../raw/r3d3s-f0nd4m3nt0s.md#http)://192.168.1.100:8080/api"

``` **Caso 3: Bypass booleano**

```smali

# Original:

# invoke-virtual {p0}, Lcom/example/Config;->isProZ

# move-result v0 # Modificado:

const/4 v0, 0x1

``` **Caso 4: Eliminar anuncios**

```smali

# Buscar y comentar:

# invoke-static {}, Lcom/ads/AdHelper;->showBannerV

nop

nop

nop

``` **Caso 5: Bypass de login**

```smali

# Si el login retorna boolean:

# Original:

# invoke-virtual {p1}, Lcom/example/Auth;->login(Ljava/lang/String;Ljava/lang/String;)Z

# move-result v0 # Modificado:

const/4 v0, 0x1

``` **Caso 6: Bypass de root detection**

```smali

# Original:

# invoke-virtual {v0}, Lcom/scottyab/rootbeer/RootBeer;->isRootedZ

# move-result v1

# if-eqz v1, :continue # Modificado:

const/4 v1, 0x0

``` --- ## frida API Reference ### Java Helpers | API | Descripcion |

|-----|-------------|

| Java.perform(fn) | Ejecutar en contexto Java |

| Java.use(className) | Obtener referencia a clase |

| Java.choose(className, callbacks) | Encontrar instancias en heap |

| Java.enumerateLoadedClasses(callbacks) | Listar clases cargadas |

| Java.registerClass(spec) | Registrar nueva clase |

| Java.scheduleOnMainThread(fn) | Ejecutar en main thread |

| Java.deoptimizeEverything | Forzar modo interpreter |

| Java.androidVersion | Version de Android | ### Interceptor (nativo) | API | Descripcion |

|-----|-------------|

| Interceptor.attach(target, callbacks) | Hookear funcion nativa |

| Interceptor.detachAll | Remover todos los hooks |

| Interceptor.replace(target, replacement) | Reemplazar funcion |

| Interceptor.flush | Flush code cache | ### Memory | API | Descripcion |

|-----|-------------|

| Memory.alloc(size) | Alocar memoria |

| Memory.allocUtf8String(str) | Alocar string UTF-8 |

| Memory.copy(dst, src, n) | Copiar memoria |

| Memory.scan(address, size, pattern, cb) | Buscar patron en memoria |

| Memory.scanSync(address, size, pattern) | Buscar sincrono | ### Module | API | Descripcion |

|-----|-------------|

| Module.findBaseAddress(name) | Encontrar base de modulo |

| Module.findExportByName(module, export) | Encontrar export |

| Module.enumerateExports(module, callbacks) | Listar exports |

| Module.enumerateImports(module, callbacks) | Listar imports |

| Module.enumerateRanges(protection, cb) | Listar rangos de memoria |

| Module.load(name) | Cargar modulo | ### Process | API | Descripcion |

|-----|-------------|

| Process.getCurrentThreadId | Thread ID |

| Process.getCurrentProcId | Process ID |

| Process.enumerateModules(callbacks) | Listar modulos |

| Process.enumerateThreads(callbacks) | Listar threads |

| Process.findModuleByAddress(address) | Modulo por direccion |

| Process.isDebuggerAttached | Debugger presente? | --- ## frida Hooks Avanzados ### Hook de todas las sobrecargas de un metodo ```javascript

Java.perform(function { var Target = Java.use("com.package.name.Target"); var overloads = Target.someMethod.overloads; overloads.forEach(function(overload) { overload.implementation = function { console.log("[+] someMethod called with " + arguments.length + " args"); for (var i = 0; i < arguments.length; i++) { console.log("  arg[" + i + "]: " + arguments[i]); } var result = this.someMethod.apply(this, arguments); console.log("  -> " + result); return result; }; });

});

``` ### Hook de constructor ```javascript

Java.perform(function { var MyClass = Java.use("com.package.name.MyClass"); MyClass.\.overload("int", "java.lang.String").implementation = function(id, name) { console.log("[+] MyClass creado con id=" + id + ", name=" + name); // Podemos modificar parametros name = "HACKED_" + name; return this.\(id, name); };

});

``` ### Enumerar instancias en heap (Java.choose) ```javascript

Java.perform(function { Java.choose("com.package.name.Singleton", { onMatch: function(instance) { console.log("[+] Singleton encontrado: " + instance); console.log("  Token: " + instance.getToken); // Modificar estado instance.setPremium(true); }, onComplete: function { console.log("[*] Busqueda completada"); } });

});

``` ### Reemplazar implementacion de metodo ```javascript

Java.perform(function { var OriginalClass = Java.use("com.package.name.OriginalClass"); // Reemplazar completamente el metodo OriginalClass.calculate.implementation = function(x, y) { console.log("[*] calculate(" + x + ", " + y + ")"); // Hacer algo completamente diferente var result = x * y + 42; console.log("  -> " + result); return result; };

});

``` ### Hook de metodos estaticos ```javascript

Java.perform(function { var Utils = Java.use("com.package.name.Utils"); Utils.getApiKey.implementation = function { console.log("[*] getApiKey llamado!"); return "FAKE_API_KEY_FOR_TESTING"; };

});

``` ### Hook de metodos nativos JNI ```javascript

Java.perform(function { var NativeLib = Java.use("com.package.name.NativeLib"); NativeLib.nativeCheck.implementation = function { console.log("[*] nativeCheck bypass!"); return true; };

}); // O hookeando la [funcion](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#funciones) nativa directamente:

var nativeLib = Module.findBaseAddress("libnative-lib.so");

var checkFunc = nativeLib.add(0x1234); // offset de nativeCheck

Interceptor.attach(checkFunc, { onEnter: function(args) { console.log("[*] nativeCheck nativo llamado"); }, onLeave: function(retval) { console.log("[*] nativeCheck retorna: " + retval); retval.replace(1); }

});

``` ### Hook de SharedPreferences ```javascript

Java.perform(function { var SharedPreferences = Java.use("android.content.SharedPreferences"); var Editor = Java.use("android.content.SharedPreferences\"); SharedPreferences.getString.implementation = function(key, defValue) { console.log("[SP] getString: " + key + " = " + this.getString(key, defValue); return this.getString(key, defValue); }; Editor.putString.implementation = function(key, value) { console.log("[SP] putString: " + key + " = " + value); return this.putString(key, value); };

});

``` ### Hook de sqlite ```javascript

Java.perform(function { var SQLiteDatabase = Java.use("android.database.sqlite.SQLiteDatabase"); SQLiteDatabase.rawQuery.overload("java.lang.String", "[Ljava.lang.String;").implementation = function(sql, args) { console.log("[SQL] rawQuery: " + sql); if (args) { for (var i = 0; i < args.length; i++) { console.log("  arg[" + i + "]: " + args[i]); } } return this.rawQuery(sql, args); }; SQLiteDatabase.execSQL.overload("java.lang.String").implementation = function(sql) { console.log("[SQL] execSQL: " + sql); return this.execSQL(sql); };

});

``` --- ## apktooltool) - Solucion de problemas | Error | Causa | Solucion |

|-------|-------|----------|

| BrutException: Could not decode arsc | Resources corrompidos | apktool d -r app.apk |

| BrutException: framework | Falta framework | apktool if framework-res.apk |

| Couldn't find dex | APK sin DEX | No es una APK valida |

| Cant find 9patch | 9patch malformado | Usar --no-src |

| Invalid resource directory | Carpetas mal | Verificar estructura res/ |

| aapt2 error | Error de compilacion | Usar --use-aapt2 o no |

| INSTALL_PARSE_FAILED | APK mal formada | Revisar apktool b |

| INSTALL_FAILED_UPDATE_IncOMPATIBLE | Firma distinta | Desinstalar primero | --- ## Objection - comandos avanzados ```

# Hooking de clases y metodos

android hooking list classes

android hooking list class_methods com.package.name.MainActivity

android hooking watch class com.package.name.ApiClient

android hooking watch class_method com.package.name.Helper.login --dump-args --dump-return --dump-backtrace # Search

android hooking search classes firebase

android hooking search classes password

android hooking search classes crypto

android hooking search methods encrypt

android hooking search methods decrypt # Screenshot

android ui screenshot /sdcard/screen.png # Keystore

android keystore list

android keystore watch # Intent

android intent launch_activity com.package.name.MainActivity

android intent launch_service com.package.name.MyService # Filesystem

file ls /data/data/com.package.name/

file cat /data/data/com.package.name/shared_prefs/prefs.xml # SQLite

sqlite connect /data/data/com.package.name/databases/db.db

sqlite exec SELECT * FROM users

sqlite exec SELECT * FROM android_metadata

sqlite dump # Env

env # Jobs

jobs list

jobs kill 1

``` --- ## ghidra - Shortcuts esenciales | Atajo | Accion |

|-------|--------|

| F | Decompilar funcion |

| Ctrl+Shift+F | Buscar texto |

| G | Ir a direccion |

| N | Renombrar simbolo |

| X | Cross-references |

| L | Etiquetar |

| ; | Comentar |

| P | Crear funcion |

| O | Abrir/importar |

| Ctrl+E | Buscar patron de bytes |

| Alt+M | Marcar posicion |

| Ctrl+M | Ir a marca |

| Space | Alternar graph/text |

| D | Definir como data/code |

| C | Definir como codigo |

| Ctrl+D | Disassemble | --- ## Herramientas de busqueda en apk ```bash

# Buscar URLs en todo el APK

strings app.apk | grep -E "https?://" | sort -u > urls.txt # Buscar API keys de Firebase

strings app.apk | grep -E "AIzaSy[A-Za-z0-9_-]{33}" > firebase_keys.txt # Buscar firebase URLs

strings app.apk | grep -E "[a-z0-9-]+\.firebaseio\.com" > firebase_urls.txt # Buscar IPs

strings app.apk | grep -E "\b[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\b" > ips.txt # Buscar tokens [jwt](../raw/4p1-s3cur1ty.md#jwt)

strings app.apk | grep -E "eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}" > jwt_tokens.txt # Buscar passwords

strings app.apk | grep -iE "password|passwd|pwd|secret|token|apikey" | sort -u > secrets.txt # Buscar emails

strings app.apk | grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" > emails.txt # Buscar en codigo decompilado

grep -rE "(http|https)://" jadx_output/ --include="*.java" | sort -u

grep -rE "AIzaSy" jadx_output/ --include="*.java"

grep -rE "firebaseio" jadx_output/ --include="*.java"

``` --- ## Analisis de tráfico con mitmproxy ```bash

# 1. Iniciar mitmproxy

mitmproxy --listen-port 8080 # 2. Configurar proxy en el dispositivo

adb shell settings put global http_proxy 192.168.1.100:8080 # 3. Instalar certificado de mitmproxy en el dispositivo

# Abrir http://mitm.it en el navegador del dispositivo

# Descargar e instalar certificado # 4. Si la app tiene SSL pinning, usar Frida para bypass

frida -U -l ssl_bypass.js com.package.name # 5. Capturar y analizar

# mitmproxy filtra por dominio:

# > ~d example.com

# > ~u /api/ # 6. Remover proxy cuando termines

adb shell settings put global http_proxy :0

``` --- ## Proyecto adicional: apk Vulnerability Scanner ```python

#!/usr/bin/env python3

"""apk_vuln_scanner.py - Escanea APKs en busca de vulnerabilidades"""

import zipfile, re, os, sys, json class APKScanner: def __init__(self, apk_path): self.apk_path = apk_path self.findings = def scan(self): print(f"[*] Escaneando {self.apk_path}") with zipfile.ZipFile(self.apk_path) as z: for name in z.namelist: if name.endswith(".xml"): content = z.read(name).decode("utf-8", errors="ignore") self._check_exported_components(content, name) if name == "AndroidManifest.xml": self._check_manifest(content) if name.endswith(".dex"): self._check_dex(name, z) def _check_exported_components(self, content, name): if 'android:exported="true"' in content: match = re.search(r'android:name="([^"]+)"', content) if match: self.findings.append({ "type": "exported_component", "file": name, "component": match.group(1), "severity": "MEDIUM" }) def _check_manifest(self, content): dangerous = ["CAMERA", "RECORD_AUDIO", "READ_SMS", "READ_CONTACTS", "ACCESS_FINE_LOCATION", "SYSTEM_ALERT_WINDOW", "BIND_ACCESSIBILITY_SERVICE", "RECEIVE_BOOT_COMPLETED"] for perm in dangerous: if perm in content: self.findings.append({ "type": "dangerous_permission", "permission": f"android.permission.{perm}", "severity": "HIGH" }) def _check_dex(self, name, z): content = z.read(name).decode("utf-8", errors="ignore") urls = re.findall(r'https?://[^\s"\']+', content) for url in urls: if not any(x in url for x in ["google", "facebook", "twitter"]): self.findings.append({ "type": "url", "url": url, "severity": "INFO" }) def report(self): print(f"\n=== Reporte de {self.apk_path} ===") for f in self.findings: print(f"  [{f['severity']}] {f.get('type','')}: {f.get('url','') or f.get('component','') or f.get('permission','')}") print(f"\nTotal hallazgos: {len(self.findings)}") if __name__ == "__main__": if len(sys.argv) < 2: print("Uso: python apk_vuln_scanner.py <apk_path>") sys.exit(1) scanner = APKScanner(sys.argv[1]) scanner.scan scanner.report

``` --- *Documento generado para fines educativos y de investigación en seguridad.*

*Version: 3.0 - APK Reversing Deep Dive + Proyectos Practicos*

*Ultima actualizacion: Mayo 2026* --- ## ANEXO E: Androguard - Analisis estatico ```python

#!/usr/bin/env python3

"""Analisis de APK con Androguard"""

from androguard.core.bytecodes import apk, dvm

from androguard.core.analysis import analysis

import sys def analyze_apk(apk_path): a = apk.APK(apk_path) print(f"Package: {a.get_package}") print(f"Version: {a.get_androidversion_name}") print(f"Min SDK: {a.get_min_sdk_version}") print(f"Target SDK: {a.get_target_sdk_version}") print # Permisos print("=== PERMISOS ===") for perm in a.get_permissions: danger = "DANGER" if any(x in perm for x in ["CAMERA", "RECORD", "SMS", "LOCATION", "CONTACTS"]) else "normal" print(f"  [{danger}] {perm}") # Activities, Services, Providers, Receivers print(f"\n=== ACTIVITIES ({len(a.get_activities)}) ===") for act in a.get_activities[:10]: print(f"  {act}") print(f"\n=== SERVICES ({len(a.get_services)}) ===") for srv in a.get_services[:10]: print(f"  {srv}") print(f"\n=== PROVIDERS ({len(a.get_providers)}) ===") for prv in a.get_providers[:10]: print(f"  {prv}") # Analisis DEX print("\n=== DEX ANALYSIS ===") d = dvm.DalvikVMFormat(a.get_dex) for cls in d.get_classes: cls_name = cls.get_name if "password" in cls_name.lower or "crypto" in cls_name.lower or "auth" in cls_name.lower: print(f"  Clase interesante: {cls_name}") for method in cls.get_methods: print(f" - {method.get_name}") if __name__ == "__main__": if len(sys.argv) < 2: print("Uso: python andro_analyze.py <apk_path>") sys.exit(1) analyze_apk(sys.argv[1])

``` --- ## ANEXO F: Busqueda automatizada de vulnerabilidadces ```bash

#!/bin/bash

# vuln_scan.sh - Escaneo completo de APK

APK=\

DIR="\_vulnscan"

mkdir -p \ echo "=== [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) Scan ==="

echo "APK: \" # 1. Informacion basica

aapt dump badging \ > \/info.txt 2>/dev/null # 2. [permisos](../raw/0s-f0nd4m3nt0s.md#permisos)

aapt dump permissions \ > \/permissions.txt 2>/dev/null

echo "" > \/dangerous_perms.txt

for perm in \; do echo "\" >> \/dangerous_perms.txt

done # 3. Strings sensibles

strings \ | grep -E "AIzaSy|firebaseio|https?://|password|token|secret" > \/sensitive_strings.txt 2>/dev/null # 4. Componentes exportados

apktool d -s -f -o \/decompiled \ 2>/dev/null

grep -r 'exported="true"' \/decompiled/AndroidManifest.xml > \/exported_components.txt 2>/dev/null # 5. Debuggable?

if grep -q 'debuggable="true"' \/decompiled/AndroidManifest.xml 2>/dev/null; then echo "[!] App es debugeable" >> \/findings.txt

fi # 6. Backup?

if grep -q 'allowBackup="true"' \/decompiled/AndroidManifest.xml 2>/dev/null; then echo "[!] App permite backup" >> \/findings.txt

fi # 7. Firebase?

if grep -q "firebase" \/sensitive_strings.txt 2>/dev/null; then echo "[!] Firebase encontrado" >> \/findings.txt

fi echo "Reporte en: \/"

``` --- ## ANEXO G: comparativa de herramientas de reversing | Herramienta | Tipo | Costo | Plataforma | Lo mejor |

|-------------|------|-------|------------|----------|

| apktooltool) | Decompiladorores) | Gratis | CLI | smali + resources |

| jadx | Decompilador | Gratis | CLI+GUI | Java preciso |

| dex2jar | Convertidor | Gratis | CLI | Para JD-GUI |

| JD-GUI | Visualizador | Gratis | GUI | Navegacion |

| CFR | Decompilador | Gratis | CLI | Java moderno |

| Procyon | Decompilador | Gratis | CLI | Lambdas |

| Bytecode Viewer | Multi-tool | Gratis | GUI | Todo en uno |

| Androguard | Framework | Gratis | python | Automatizacion |

| frida | Instrumentacion | Gratis | CLI+API | Tiempo real |

| Objection | Instrumentacion | Gratis | CLI | Facil de usar |

| ghidra | Reversing nativo | Gratis | GUI | Analisis estatico |

| IDA Pro | Reversing nativo | \$\$\$ | GUI | El mejor |

| JEB | Decompilador | \$\$ | GUI+CLI | Muy preciso |

| MobSF | Framework | Gratis | Web | Automatizado |

| QARK | Scanner | Gratis | CLI | vulnerabilidadces |

| Simplify | Desofuscador | Gratis | CLI | ofuscacion | --- ## ANEXO H: Scripts utiles para reversing ### Extraer todas las clases que extienden una clase base ```javascript

// Frida - buscar subclases de una clase

Java.perform(function { Java.enumerateLoadedClasses({ onMatch: function(className) { try { var clazz = Java.use(className); var superclass = clazz.class.getSuperclass; if (superclass && superclass.getName === "android.app.Activity") { console.log("[Activity] " + className); } if (superclass && superclass.getName === "android.app.Service") { console.log("[Service] " + className); } if (superclass && superclass.getName === "android.content.BroadcastReceiver") { console.log("[Receiver] " + className); } } catch(e) {} }, onComplete: function {} });

});

``` ### Encontrar todas las URLs en el heap ```javascript

// Frida - buscar strings que parezcan URLs en todas las instancias

Java.perform(function { var String = Java.use("java.lang.String"); // Hookear constructores de String para capturar URLs String.\.overload("[B").implementation = function(bytes) { var str = this.\(bytes); var s = str.toString; if (s.startsWith("http") || s.includes("firebase") || s.includes("api.") { console.log("[URL] " + s); } return str; };

});

``` ### Hooking de carga de clases ```javascript

// Frida - detectar cuando se carga una clase especifica

Java.perform(function { var ClassLoader = Java.use("java.lang.ClassLoader"); ClassLoader.loadClass.overload("java.lang.String").implementation = function(className) { if (className.includes("com.package") { console.log("[CLASSLOAD] " + className); } return this.loadClass(className); };

});

``` ### Trace de todas las llamadas a metodo de una clase ```javascript

// Frida - trace completo de una clase

Java.perform(function { var targetClass = Java.use("com.package.name.TargetClass"); var methods = targetClass.class.getDeclaredMethods; methods.forEach(function(method) { var methodName = method.getName; var overloads = targetClass[methodName].overloads; overloads.forEach(function(overload) { overload.implementation = function { var args = Array.prototype.slice.call(arguments); console.log("[TRACE] " + methodName + "(" + args.join(", ") + ")"); var result = this[methodName].apply(this, arguments); console.log("  -> " + result); return result; }; }); });

});

``` --- ## ANEXO I: Identificacion de librerias nativas comunes | Nombre de libreria | Proposito | Que buscar |

|--------------------|-----------|------------|

| libcocos2djs.so | Cocos2D (juegos) | JS engine |

| libunity.so | Unity 3D | Mono runtime |

| libmono.so | Mono .NET | Metadatos .NET |

| libflutter.so | Flutter | Dart VM |

| libreactnative.so | React Native | JS bridge |

| libv8.so | V8 JS engine | JavaScript |

| libsentry.so | Sentry (crash reporting) | Error tracking |

| libdatadog.so | Datadog (monitoreo) | APM data |

| libsodium.so | Libsodium (crypto) | cifradoc |

| libssl).so | OpenSSL | TLS/SSL |

| libcrypto.so | OpenSSL crypto | Cifrado |

| libcurl.so | libcurl | http requests |

| libsqlite3.so | SQLite | Base de datos |

| libzip.so | Zlib/Zip | Compresion |

| libxml2.so | XML parser | XML processing |

| libprotobuf.so | Protocol Buffers | Serializacion |

| libpcre.so | PCRE regex | Regex engine | --- ## ANEXO J: Recursos de aprendizaje - **owasp Mobile Security Testing Guide**: httpss)://owasp.org/www-project-mobile-security-testing-guide/

- **frida CodeShare**: https://codeshare.frida.re/

- **android Security Checklists**: https://mobile-security.gitbook.io/

- **Uncrackable Mobile Apps**: https://github.com/OWASP/owasp-mastg/tree/master/Crackmes

- **DVIA (Damn Vulnerable Android App)**: https://github.com/ganeshrvel/dvia

- **InjuredAndroid**: https://github.com/B3nac/InjuredAndroid

- **Android Tamer**: https://androidtamer.com/

- **docker Android**: https://github.com/budtmo/docker-android

- **apkLab (VS Code extension)**: https://marketplace.visualstudio.com/items?itemName=Surendrajat.apklab

- **Nox / BlueStacks**: Emuladores para testing

- **Genymotion**: Emulador rapido para reversing

- **Android Studio Emulator**: El mas compatible ``` --- *Documento generado para fines educativos y de investigacion en seguridad.*

*Version: 3.0 - APK Reversing Deep Dive + Proyectos Practicos*

*Ultima actualizacion: Mayo 2026*

*Mas de 2500 lineas de documentacion tecnica + herramientas practicas* --- ## ANEXO F: Identificacion de ofuscadores | Ofuscador | Caracteristicas | Como detectarlo |

|-----------|----------------|-----------------|

| ProGuard | Renaming classes/methods/fields a.b.c | Clases con nombres cortos, mapping.txt |

| DexGuard | Cifrado de strings, anti-debug, anti-tamper | Strings cifrados, reflection API |

| DashO | Control flow opaco, renaming agresivo | Metodos muy largos y complejos |

| Allatori | Constantes numericas ofuscadas, string splitting | Numeros flotantes como constantes DEX |

| Arxan | Proteccion de checksums, anti-tamper | Verificaciones criptograficas en nativo |

| WhiteCryption | Cifrado de codigo, obfuscation en nativo | Librerias nativas con decryption |

| Tencent Legu | Ofuscacion de recursos, string encryption | Resources.arsc cifrado |

| Bangcle (Jiagu) | DEX encryption, anti-debugging | classes.dex cifrado, loader en nativo |

| Qihoo 360 | DEX vmp (virtualization), anti-analysis | Virtual machines, codigo ofuscado | --- ## ANEXO G: Bypass de SSL Pinning - 5 metodos ### Metodo 1: Objection (el mas facil)

```

objection -g com.package.name explore --startup-command "android ssl)pinning disable"

``` ### Metodo 2: Frida Universal bypass

```

frida -U -l frida-ssl-universal.js com.package.name

```

El script universal se encuentra en Frida CodeShare: https://codeshare.frida.re/ ### Metodo 3: Xposed module (SSLUnpinning)

Instalar el modulo Xposed "SSLUnpinning" desde el repo de modulos. ### Metodo 4: Proxy con certificado injectado

```

# 1. Instalar certificado de Burp/mitmproxy como CA del sistema

adb root

adb remount

adb push burp_ca.der /sdcard/

adb shell su -c "cp /sdcard/burp_ca.der /system/etc/security/cacerts/"

adb shell su -c "chmodrmisos) 644 /system/etc/security/cacerts/9a5ba575.0"

adb reboot

``` ### Metodo 5: Modificar la APK (quitar pinning)

```

# Decompilar

apktool d app.apk -o app_out/

# Buscar y eliminar implementaciones de SSL pinning

# (TrustManager personalizados, CertificatePinner de OkHttp, etc.)

grep -r "CertificatePinner\|TrustManager\|hostnameVerifier" app_out/smali/

# Recompilar y firmar

apktool b app_out/ -o app_mod.apk

jarsigner -keystore debug.keystore -storepass android app_mod.apk debug

adb install -r app_mod.apk

``` --- ## ANEXO H: Metodos comunes de cifrado en apps Android | Algoritmo | Modo | Padding | Buscar en codigo |

|-----------|------|---------|------------------|

| AES | CBC/GCM/ECB | PKCS5Padding/PKCS7Padding | "AES/CBC/PKCS5Padding" |

| RSA | ECB | OAEP/PKCS1 | "RSA/ECB/OAEPWithSHA-256AndMGF1Padding" |

| DES | CBC/ECB | PKCS5Padding | "DES/CBC/PKCS5Padding" |

| 3DES | CBC/ECB | PKCS5Padding | "DESede/CBC/PKCS5Padding" |

| Blowfish | CBC/ECB | PKCS5Padding | "Blowfish/CBC/PKCS5Padding" |

| ChaCha20 | Poly1305 | N/A | ChaCha20Poly1305 |

| ARC4 | Stream | N/A | "ARC4" | ### Como extraer la clave de cifrado ```

// Frida para interceptar generacion/aplicacion de claves

Java.perform(function { var KeyGenerator = Java.use("javax.crypto.KeyGenerator"); KeyGenerator.generateKey.implementation = function { var key = this.generateKey; console.log("[*] Key generated: " + bytesToHex(key.getEncoded); console.log("[*] Algorithm: " + key.getAlgorithm); return key; }; var SecretKeySpec = Java.use("javax.crypto.spec.SecretKeySpec"); SecretKeySpec.$init.overload("[B", "java.lang.String").implementation = function(keyData, algo) { console.log("[*] SecretKeySpec: " + bytesToHex(keyData) + " algo=" + algo); return this.$init(keyData, algo); }; var IvParameterSpec = Java.use("javax.crypto.spec.IvParameterSpec"); IvParameterSpec.$init.overload("[B").implementation = function(iv) { console.log("[*] IV: " + bytesToHex(iv); return this.$init(iv); }; function bytesToHex(bytes) { var hex = ; for (var i = 0; i < bytes.length; i++) { hex.push(bytes[i] >>> 4).toString(16); hex.push(bytes[i] & 0xF).toString(16); } return hex.join(""); }

});

``` --- ## ANEXO I: Extensiones de archivos en reversing | Extension | Que es | Como analizarlo |

|-----------|--------|-----------------|

| .apk | Android Package | apktool, jadx, unzip |

| .aab | Android App Bundle | bundletool, apktool |

| .dex | Dalvik Executable | jadx, baksmali, dex2jar |

| .odex | Optimized DEX (Dalvik) | oat2dex, baksmali |

| .oat | Optimized ART | oat2dex |

| .vdex | Verified DEX (Android 8+) | jadx (soporte limitado) |

| .so | Shared Object (ELF nativo) | Ghidra, IDA, strings |

| .xml (AXML) | Android XML binario | apktool, AXMLPrinter2 |

| .arsc | Android Resource Table | apktool |

| .jar | Java ARchive | JD-GUI, CFR |

| .class | Java bytecode | CFR, Procyon, javap |

| .smali | Smali [assembly](../raw/4ss3mbly-f0r-h4ck3rs.md) | Editor de texto |

| .kef | Key Export File | - |

| .ab | Android Backup | dd, zlib |

| .apks | APK Set Archive | bundletool |

| .apkm | APK Mirror | renombrar a .apk |

| .xapk | APK扩展 | renombrar a .zip | --- ## ANEXO J: Timeline del reversing de una app ```

1. Extraccion: 5 min (adb pull)

2. Decompilacion: 2-10 min (apktool + jadx)

3. Analisis estatico: 30 min - 2 hs

4. Busqueda de strings: 10 min

5. Analisis de manifest: 5 min

6. Hooking inicial: 10 min (Frida/Objection)

7. Bypass de protecciones: 30 min - 4 hs

8. Analisis dinamico: 1-4 hs

9. Reporte: 30 min

---

Total: 3-12 hs para una app tipica

``` --- *Documento generado para fines educativos y de investigacion en seguridad.*

*Version: 3.0 - APK Reversing Deep Dive + Proyectos Practicos*

*Ultima actualizacion: Mayo 2026*

*Mas de 2500 lineas de documentacion tecnica + herramientas practicas* --- ## TEST LINE Test content here. --- ## ANEXO K: Cheatsheet de reversing en una pagina `ash

# EXTRACCION

adb shell pm path com.package.name

adb pull /data/app/com.package.name-*/base.apk app.apk # INFORMACION

aapt dump badging app.apk | grep -E "package|version|sdk"

aapt dump permissions app.apk # DECOMPILACION

apktool d -f -o smali/ app.apk

jadx --deobf -d java/ app.apk

d2j-dex2jar.sh app.apk && jd-gui app-dex2jar.jar # STRINGS SENSIBLES

strings app.apk | grep -iE "password|token|secret|api|firebase|http"

strings app.apk | grep -E "AIzaSy[A-Za-z0-9_-]{33}"

grep -rE "(https?://|AIzaSy|firebaseio)" java/ --include="*.java" # FRIDA

frida -U -l script.js com.package.name

frida-ps -Ua # BYPASS

objection -g com.pkg explore --startup-command "android sslpinning disable"

objection -g com.pkg explore --startup-command "android root disable" # REPACKAGING

apktool b smali/ -o new.apk

jarsigner -keystore debug.ks -storepass android new.apk debug

zipalign -v -p 4 new.apk final.apk

adb install -r final.apk

` --- ## ANEXO L: Glosario completo | Termino | Significado |

|---------|-------------|

| APK | Android Package Kit |

| AAB | Android App Bundle |

| DEX | Dalvik Executable |

| OAT | Optimized ART |

| Smali | Assembly del bytecode Dalvik |

| JNI | Java Native Interface |

| NDK | Native Development Kit |

| AOT | Ahead Of Time |

| JIT | Just In Time |

| ProGuard | Ofuscador de codigo |

| DexGuard | Ofuscador avanzado |

| RootBeer | Libreria de deteccion de root |

| SafetyNet | API de verificacion de integridad |

| Frida | Dynamic instrumentation |

| Objection | Runtime mobile exploration |

| Xposed | Framework de hooks del sistema |

| Ghidra | Reversing de la NSA |

| IDA Pro | Interactive Disassembler |

| MobSF | Mobile Security Framework | --- ## ANEXO M: Script de analisis automatizado en Python `python

#!/usr/bin/env python3

import subprocess, os, sys, json, re, zipfile class AutoReverser: def __init__(self, apk): self.apk = apk self.name = os.path.splitext(os.path.basename(apk)[0] self.out_dir = self.name + "_analysis" self.results = {} os.makedirs(self.out_dir, exist_ok=True) def run_cmd(self, cmd): try: r = subprocess.run(cmd, capture_output=True, text=True, timeout=120) return r.stdout except: return "" def decompile(self): print("[1] Decompilando con apktool..") self.run_cmd(["apktool", "d", "-f", "-o", self.out_dir + "/smali", self.apk]) print("[2] Decompilando con jadx..") self.run_cmd(["jadx", "--deobf", "-d", self.out_dir + "/java", self.apk]) def extract_strings(self): print("[3] Extrayendo strings..") with zipfile.ZipFile(self.apk) as z: for name in z.namelist: if name.endswith(".dex"): content = z.read(name).decode("utf-8", errors="ignore") self._find_patterns(content) def _find_patterns(self, content): patterns = { "urls": r"https?://[^"'<>\s]+", "api_keys": r"AIzaSy[A-Za-z0-9_-]{33}", "firebase": r"[a-z0-9-]+\.firebaseio\.com", "emails": r"[\w._%+-]+@[\w.-]+\.\w{2,}", } for name, pattern in patterns.items: matches = re.findall(pattern, content) if matches: self.results.setdefault(name, set).update(matches) def report(self): with open(self.out_dir + "/report.json", "w") as f: json.dump({k: list(v) for k, v in self.results.items}, f, indent=2) print("Reporte: " + self.out_dir + "/report.json") for k, v in self.results.items: print("  " + k + ": " + str(len(v) + " encontrados") def run(self): print("=== Analizando " + self.apk + " ===") self.decompile self.extract_strings self.report print("=== Analisis completado ===") if __name__ == "__main__": if len(sys.argv) < 2: print("Uso: python auto_reverser.py <apk>") sys.exit(1) AutoReverser(sys.argv[1]).run

` --- ## ANEXO N: Referencia de JNI para reversing | Tipo Java | Tipo Nativo JNI | Firma |

|-----------|-----------------|-------|

| void | void | V |

| boolean | jboolean | Z |

| byte | jbyte | B |

| char | jchar | C |

| short | jshort | S |

| int | jint | I |

| long | jlong | J |

| float | jfloat | F |

| double | jdouble | D |

| String | jstring | Ljava/lang/String; |

| Object | jobject | Ljava/lang/Object; |

| int | jintArray | [I |

| byte | jbyteArray | [B |

| String | jobjectArray | [Ljava/lang/String; | ### Funciones JNI naming convention Java_com_example_app_Class_methodName(JNIEnv* env, jobject thiz, ..) ### Buscar funciones JNI en .so `ash

nm -D libnative-lib.so | grep Java_

readelf -s libnative-lib.so | grep Java_

objdump -T libnative-lib.so | grep Java_

` --- ## ANEXO O: Preguntas frecuentes **P: Que hago si apktool falla con BrutException?**

R: Instala el framework: pktool if framework-res.apk **P: Como se si una app tiene Root Detection?**

R: Busca clases como RootBeer, Superuser, su, magisk en el codigo. Usa grep -r "rootbeer\|RootBeer\|isRooted\|su\|magisk" smali/ **P: Como bypasseo SSL Pinning sin Frida?**

R: Opciones: Objection, Xposed module (SSLUnpinning), modificar APK, instalar CA como certificado del sistema **P: Que hago si jadx no muestra todo el codigo?**

R: Proba con jadx --deobf, o usa CFR/Procyon. Tambien puede ser ofuscacion DexGuard. **P: Como extraigo la clave de cifrado de una app?**

R: Hooking con Frida en javax.crypto.spec.SecretKeySpec y javax.crypto.Cipher.init **P: Como analizo una libreria nativa .so?**

R: Usa Ghidra o IDA Pro. Primero strings, despues readelf, despues decompilacion. **P: Que hago si la app se cierra al hacer hook con Frida?**

R: La app tiene anti-Frida detection. Usa frida-server renombrado, puerto personalizado, o Frida Gadget embebido. --- *Documento generado para fines educativos y de investigacion en seguridad.*

*Version: 3.0 - APK Reversing Deep Dive*

*Ultima actualizacion: Mayo 2026* --- ## ANEXO P: Recursos de aprendizaje ### Sitios web y documentacion

- OWASP Mobile Security Testing Guide (MSTG): https://owasp.org/www-project-mobile-security-testing-guide/

- Frida CodeShare: https://codeshare.frida.re/

- Android Developers Security: https://developer.android.com/topic/security

- Google Security Research: https://security.googleblog.com/

- Infosec Writeups (Android reversing): https://infosecwriteups.com/ ### Apps vulnerables para practicar

- DVIA (Damn Vulnerable Android App): https://github.com/ganeshrvel/dvia

- InjuredAndroid: https://github.com/B3nac/InjuredAndroid

- Android InsecureBank: https://github.com/dineshshetty/Android-InsecureBankv2

- UnCrackable Apps (OWASP): https://github.com/OWASP/owasp-mastg/tree/master/Crackmes

- Diva (Damn Insecure and Vulnerable App): https://github.com/payatu/diva-android ### Cursos y tutoriales

- Mobile App Pentesting (eLearnSecurity): https://elearnsecurity.com/

- Practical Android Penetration Testing (TCM Security)

- Android Security Internals (libro de Nikolay Elenkov)

- The Mobile Application Hacker Handbook (libro) ### Herramientas adicionales

- APKLab (VS Code): https://marketplace.visualstudio.com/items?itemName=Surendrajat.apklab

- Bytecode Viewer: https://github.com/Konloch/bytecode-viewer

- APKInspector: https://github.com/hussien89aa/APKInspector

- APKTool GUI: https://github.com/Androxyde/APKToolGUI

- Droidbox (sandbox): https://github.com/pjlantz/droidbox

- Drozer (security testing): https://github.com/FSecureLABS/drozer --- ## ANEXO Q: Checklist final de auditoria ### Pre-auditoria

-  Obtener autorizacion por escrito

-  Definir alcance de la auditoria

-  Preparar entorno aislado (VM/emulador)

-  Tener todas las herramientas instaladas ### Recoleccion

-  Extraer APK del dispositivo

-  Obtener hash (MD5/SHA256) del APK original

-  Documentar version de la app ### Analisis estatico

-  Decompilar con apktool

-  Decompilar con jadx

-  Analizar AndroidManifest.xml

-  Listar permisos peligrosos

-  Identificar componentes exportados

-  Buscar strings sensibles (API keys, tokens, URLs, passwords)

-  Buscar implementacion de cifrado

-  Analizar librerias nativas

-  Identificar ofuscacion (ProGuard, DexGuard, etc.)

-  Buscar Firebase configuraciones

-  Verificar allowBackup, debuggable ### Analisis dinamico

-  Ejecutar app y monitorear con Frida

-  Probar bypass de Root Detection

-  Probar bypass de SSL Pinning

-  Interceptar trafico HTTP/S

-  Monitorear logs con logcat

-  Explorar filesystem de la app

-  Probar Content Providers

-  Probar Deep Links

-  Buscar insecure SharedPreferences

-  Verificar almacenamiento de datos sensibles

-  Probar inyeccion SQL en providers ### Reporte

-  Documentar todos los hallazgos

-  Clasificar por severidad (Critical/High/Medium/Low)

-  Incluir pasos de reproduccion

-  Sugerir remediaciones

-  Entregar reporte al cliente/equipo --- *Documento generado para fines educativos y de investigacion en seguridad.*

*Version: 3.0 - APK Reversing Deep Dive + Proyectos Practicos*

*Ultima actualizacion: Mayo 2026*

*Mas de 2500 lineas de documentacion tecnica* --- ## ANEXO R: Analisis de malware Android - Guia rapida ### Indicadores de malware en APKs 1. **Permisos excesivos**: RECEIVE_BOOT_COMPLETED + INTERNET + READ_SMS + SYSTEM_ALERT_WINDOW

2. **Ofuscacion extrema**: DexGuard, clases sin sentido, reflection API

3. **Payload embebido**: DexClassLoader, FileOutputStream a .dex

4. **C2 embebido**: IPs hardcodeadas, dominios sospechosos, DNS dinamic

5. **Persistencia**: BOOT_COMPLETED, AlarmManager, JobScheduler, startService en onCreate

6. **Anti-analisis**: Anti-emulador, anti-debug, anti-Frida, deteccion de sandbox

7. **Funciones peligrosas**: Runtime.exec, ProcessBuilder, MediaRecorder sin UI ### Pasos de analisis de malware 1. Aislar completamente (VM/emulador sin datos reales)

2. NO instalar en dispositivo principal

3. Analisis estatico: apktool, jadx, strings, permisos

4. Extraer URLs de C2, IPs, dominios

5. Buscar payload embebido (dex oculto, .so malicioso)

6. Analisis dinamico en sandbox

7. Monitorear trafico de red (conexiones a C2)

8. Documentar IoCs (Indicators of Compromise) --- ## ANEXO S: Herramientas de automatizacion CI/CD para seguridad de APKs ### GitHub Actions para escaneo de APKs `yaml

name: APK Security Scan

on: [push]

jobs: scan: runs-on: ubuntu-latest steps: - uses: actions/checkout@v3 - name: Install tools run: | sudo apt-get install -y apktool jadx pip install frida-tools - name: Decompile and scan run: | apktool d app.apk -o app_smali/ jadx --deobf -d app_java/ app.apk grep -rE 'AIzaSy|firebaseio|password|secret|token' app_java/ --include='*.java' > findings.txt - name: Upload findings uses: actions/upload-artifact@v3 with: name: security-findings path: findings.txt

` --- ## Tabla comparativa: emuladores para reversing | Emulador | Velocidad | Root | Google Play | Recomendado para |

|----------|-----------|------|-------------|------------------|

| Android Studio | Alta | Configurable | Si | Testing general |

| Genymotion | Muy alta | Si | Plugin | Reversing rapido |

| Nox | Alta | Si | Si | Juegos, apps chinas |

| BlueStacks | Alta | No | Si | Juegos, compatible |

| Android-x86 | Media | Si | Si | Testing avanzado |

| Docker-Android | Baja | Si | No | CI/CD, automatizacion | --- ## Referencia: codigos de error APK | Codigo | Significado |

|--------|-------------|

| INSTALL_FAILED_ALREADY_EXISTS | App ya instalada |

| INSTALL_FAILED_INVALID_APK | APK corrupta o invalida |

| INSTALL_FAILED_INSUFFICIENT_STORAGE | Sin espacio en disco |

| INSTALL_FAILED_CONFLICTING_PROVIDER | Provider conflictivo |

| INSTALL_FAILED_NO_MATCHING_ABIS | Arquitectura no soportada |

| INSTALL_FAILED_UPDATE_INCOMPATIBLE | Firma incompatible |

| INSTALL_FAILED_SHARED_USER_INCOMPATIBLE | Usuario compartido incompatible |

| INSTALL_FAILED_MISSING_SHARED_LIBRARY | Libreria faltante |

| INSTALL_FAILED_REPLACE_COULDNT_DELETE | No se pudo reemplazar |

| INSTALL_FAILED_DEXOPT | Error de optimizacion DEX |

| INSTALL_FAILED_OLDER_SDK | SDK minima no soportada |

| INSTALL_FAILED_DUPLICATE_PERMISSION | Permiso duplicado |

| INSTALL_FAILED_PERMISSION_MODEL_DOWNGRADE | Permisos incompatibles |

| INSTALL_PARSE_FAILED_MANIFEST_MALFORMED | Manifest mal formado |

| INSTALL_PARSE_FAILED_BAD_PACKAGE_NAME | Package name invalido |

| INSTALL_FAILED_USER_RESTRICTED | Restriccion de usuario |

| INSTALL_FAILED_VERIFICATION_FAILURE | Verificacion fallida |

| INSTALL_FAILED_VERIFICATION_TIMEOUT | Timeout de verificacion | --- *Documento generado para fines educativos y de investigacion en seguridad.*

*Version: 3.0 - APK Reversing Deep Dive + Proyectos Practicos*

*Ultima actualizacion: Mayo 2026* --- ## ANEXO S: Frida Stalker - Rastreo de instrucciones El Stalker permite rastrear TODAS las instrucciones que ejecuta un thread, ideal para analisis de ofuscacion. ```javascript

Stalker.follow(Process.getCurrentThreadId, { events: { call: true, ret: true, exec: true }, transform: function(iterator) { var instruction = iterator.next; var count = 0; while (instruction !== null && count < 500) { var mnem = instruction.mnemonic; if (mnem.indexOf("bl") !== -1 || mnem.indexOf("b.") !== -1) { console.log("[BRANCH] " + instruction.address + ": " + instruction); } instruction = iterator.keep; count++; instruction = iterator.next; } }, onReceive: function(events) { console.log("[STALKER] Events: " + events.length); }

});

``` ## ANEXO T: Frida Memory Scanning ```javascript

// Buscar strings en memoria del [proceso](../raw/0s-f0nd4m3nt0s.md#procesos)

var pattern = "41 42 43 44"; // "ABCD" en hex

var ranges = Process.enumerateRanges("rw-");

ranges.forEach(function(range) { try { Memory.scan(range.base, range.size, pattern, { onMatch: function(address, size) { console.log("[MEM] Match en: " + address); console.log("  " + address.readUtf8String); }, onComplete: function {} }); } catch(e) {}

}); // Buscar referencias a funciones

var targetFunc = Module.findExportByName("libc.so", "fopen");

if (targetFunc) { var modules = Process.enumerateModules; modules.forEach(function(m) { try { Memory.scan(m.base, m.size, ptr(targetFunc).toMatchPattern, { onMatch: function(address) { console.log("[XREF] " + m.name + " @ " + address); }, onComplete: function {} }); } catch(e) {} });

}

``` ## ANEXO U: IDs de proveedores USB para dispositivos Android | OEM | Vendor ID |

|-----|-----------|

| Google | 0x18D1 |

| Samsung | 0x04E8 |

| LG | 0x1004 |

| HTC | 0x0BB4 |

| Motorola | 0x22B8 |

| Sony | 0x054C |

| Xiaomi | 0x2717 |

| OnePlus | 0x2A70 |

| Huawei | 0x12D1 |

| ZTE | 0x19D2 |

| Lenovo | 0x17EF |

| ASUS | 0x0B05 |

| Acer | 0x0502 |

| Alcatel | 0x1BBB |

| Nokia | 0x0421 | ## ANEXO V: Codigos de operacion de ADB protocol | Opcode | Hex | Direccion | Descripcion |

|--------|-----|-----------|-------------|

| A_CNXN | 4E584E43 | Bidirectional | Connection handshake |

| A_AUTH | 48545541 | Bidirectional | RSA authentication |

| A_OPEN | 4E45504F | Client->Server | Open service stream |

| A_OKAY | 59414B4F | Bidirectional | Acknowledge |

| A_CLSE | 45534C43 | Bidirectional | Close stream |

| A_WRTE | 45545257 | Bidirectional | Write data | ## ANEXO W: Extensiones de Frida para Android | Extension | Proposito |

|-----------|-----------|

| frida-cycript | Syntactic sugar para Frida |

| frida-trace | Trace automatico de funciones |

| frida-discover | Descubrir funciones de librerias |

| frida-compile | Compilar TypeScript a JS |

| frida-create | Scaffolding de proyectos |

| frida-inject | Inyectar sin servidor |

| objection | Mobile exploration framework |

| r2frida | Radare2 + Frida integration | ## ANEXO X: Docker Android para CI/CD ```dockerfile

FROM budtmo/docker-android-x86-8.1 # Con herramientas de reversing

RUN apt-get update && apt-get install -y \ apktool \ jadx \ python3-pip \ && pip3 install frida-tools objection # Copiar APKs para analisis

COPY ./apks/ /root/tmp/apks/ # Entrypoint

CMD ["adb", "wait-for-device"]

``` ## ANEXO Y: Script de monitoreo de cambios en /data ```bash

#!/bin/bash

# watch_app_data.sh - Monitorea cambios en datos de app

PACKAGE="$1"

while true; do clear echo "=== Monitoreando $PACKAGE ===" echo "Time: $(date)" echo "" echo "--- Databases ---" adb shell run-as $PACKAGE ls databases/ 2>/dev/null echo "" echo "--- Shared Preferences ---" adb shell run-as $PACKAGE ls shared_prefs/ 2>/dev/null echo "" echo "--- Files ---" adb shell run-as $PACKAGE ls files/ 2>/dev/null echo "" echo "--- Cache ---" adb shell run-as $PACKAGE ls cache/ 2>/dev/null sleep 5

done

``` ## ANEXO Z: Parsing de AndroidManifest con Python ```python

#!/usr/bin/env python3

import sys, zipfile, xml.etree.ElementTree as ET def parse_manifest(apk_path): with zipfile.ZipFile(apk_path) as z: if "AndroidManifest.xml" not in z.namelist: print("No AndroidManifest.xml found") return # Note: This is a simplified parser. Real AXML is binary. # Use apktool for production. data = z.read("AndroidManifest.xml") try: text = data.decode("utf-8", errors="ignore") print(text[:2000]) except: pass def main: if len(sys.argv) < 2: print("Uso: python parse_manifest.py <apk>") sys.exit(1) parse_manifest(sys.argv[1]) if __name__ == "__main__": main

``` --- *Documento generado para fines educativos y de investigacion en seguridad.*

*Version: 3.0 - APK Reversing Deep Dive + Proyectos Practicos*

*Ultima actualizacion: Mayo 2026* --- ## ANEXO AA: Frida - Hooking de metodos nativos con Interceptor ```javascript

var strcmp = Module.findExportByName("libc.so", "strcmp");

Interceptor.attach(strcmp, { onEnter: function(args) { var s1 = args[0].readUtf8String; var s2 = args[1].readUtf8String; console.log("strcmp(" + s1 + ", " + s2 + ")"); }, onLeave: function(ret) { console.log("  -> " + ret); }

});

``` ## ANEXO AB: Hooking de SharedPreferences ```javascript

Java.perform(function { var SharedPreferences = Java.use("android.content.SharedPreferences"); var Editor = Java.use("android.content.SharedPreferences$Editor"); SharedPreferences.getString.implementation = function(key, def) { console.log("[SP] getString: " + key + " = " + this.getString(key, def); return this.getString(key, def); }; Editor.putString.implementation = function(key, value) { console.log("[SP] putString: " + key + " = " + value); return this.putString(key, value); };

});

``` ## ANEXO AC: Hooking de SQLite ```javascript

Java.perform(function { var sqliteDatabase = Java.use("android.database.sqlite.SQLiteDatabase"); SQLiteDatabase.rawQuery.overload("java.lang.String", "[Ljava.lang.String;").implementation = function(sql, args) { console.log("[SQL] rawQuery: " + sql); if (args) { for (var i = 0; i < args.length; i++) console.log("  arg[" + i + "]: " + args[i]); } return this.rawQuery(sql, args); }; SQLiteDatabase.execSQL.overload("java.lang.String").implementation = function(sql) { console.log("[SQL] execSQL: " + sql); return this.execSQL(sql); };

});

``` ## ANEXO AD: Hooking de WebView ```javascript

Java.perform(function { var WebView = Java.use("android.webkit.WebView"); WebView.loadUrl.overload("java.lang.String").implementation = function(url) { console.log("[WV] loadUrl: " + url); return this.loadUrl(url); }; WebView.evaluateJavascript.overload("java.lang.String", "android.webkit.ValueCallback").implementation = function(script, callback) { console.log("[WV] evaluateJavascript: " + script); return this.evaluateJavascript(script, callback); }; var Websettings = Java.use("android.webkit.WebSettings"); WebSettings.setJavaScriptEnabled.implementation = function(enabled) { console.log("[WV] setJavaScriptEnabled: " + enabled); return this.setJavaScriptEnabled(enabled); };

});

``` ## ANEXO AE: Enumeracion de clases de una app ```javascript

Java.perform(function { Java.enumerateLoadedClasses({ onMatch: function(className) { if (className.indexOf("com.example") === 0) { console.log("[CLASS] " + className); } }, onComplete: function { console.log("[*] Enumeracion completada"); } });

});

``` ## ANEXO AF: Java.choose - Buscar instancias en heap ```javascript

Java.perform(function { Java.choose("com.example.MySingleton", { onMatch: function(instance) { console.log("[HEAP] Instancia encontrada: " + instance); try { instance.getToken; } catch(e) {} try { instance.getApiKey; } catch(e) {} }, onComplete: function { console.log("[*] Busqueda completada"); } });

});

``` --- ## ANEXO FINAL: Referencia de instrucciones smali comunes | Instruccion | Descripcion |

|-------------|-------------|

| const/4 v0, 0x1 | Cargar constante 4-bit |

| const/16 v0, 0x100 | Cargar constante 16-bit |

| const v0, 0x100000 | Cargar constante 32-bit |

| const-string v0, \"texto\" | Cargar string |

| const-class v0, Lclass; | Cargar clase |

| move v0, v1 | Copiar registro |

| move-result v0 | Copiar resultado |

| return-void | Retornar void |

| return v0 | Retornar valor |

| return-object v0 | Retornar objeto |

| if-eq v0, v1, :label | Si igual |

| if-ne v0, v1, :label | Si no igual |

| if-eqz v0, :label | Si igual a 0 |

| if-nez v0, :label | Si no igual a 0 |

| goto :label | Salto incondicional |

| invoke-virtual | Llamada virtual |

| invoke-static | Llamada estatica |

| invoke-direct | Llamada directa (constructor) |

| invoke-super | Llamada a superclase |

| invoke-interface | Llamada a interfaz |

| sget v0, Lclass;->field:Ltype; | Get static field |

| sput v0, Lclass;->field:Ltype; | Set static field |

| iget v0, p0, Lclass;->field:Ltype; | Get instance field |

| iput v0, p0, Lclass;->field:Ltype; | Set instance field |

| new-instance v0, Lclass; | Crear instancia |

| new-array v0, v1, I | Crear array |

| aget v0, v1, v2 | Get de array |

| aput v0, v1, v2 | Set en array |

| monitor-enter v0 | Enter synchronized |

| monitor-exit v0 | Exit synchronized |

| throw v0 | Lanzar excepcion |

| check-cast v0, Lclass; | Type cast |

| instance-of v0, v1, Lclass; | instanceof |

| nop | No operacion |

| array-length v0, v1 | Longitud array |

| add-int v0, v1, v2 | Suma enteros |

| sub-int v0, v1, v2 | Resta enteros |

| mul-int v0, v1, v2 | Multiplicacion |

| div-int v0, v1, v2 | Division |

| rem-int v0, v1, v2 | Modulo | ## ANEXO FINAL 2: Referencia de Frida API Java.perform(fn) - Ejecutar en contexto Java

Java.use(className) - Obtener clase

Java.choose(className, cb) - Buscar instancias

Java.enumerateLoadedClasses(cb) - Listar clases

Interceptor.attach(target, cb) - Hook nativo

Interceptor.replace(target, fn) - Reemplazar funcion

Memory.scan(addr, size, pattern, cb) - Buscar en memoria

Module.findBaseAddress(name) - Base de modulo

Module.findExportByName(module, export) - Export de modulo

Process.enumerateModules(cb) - Listar modulos

Stalker.follow(tid, options) - Rastrear instrucciones --- *Documento generado para fines educativos y de investigacion en seguridad.*

*Version: 3.0 - APK Reversing Deep Dive + Proyectos Practicos*

*Ultima actualizacion: Mayo 2026* ## ANEXO [[ad](../raw/w1nd0ws-d0m41n-4dm1n.md): Frida Scripts completos ### Bypass de verificacion de firma de APK `javascript

Java.perform(function { var PackageManager = Java.use("android.content.pm.PackageManager"); PackageManager.getPackageInfo.overload("java.lang.String", "int").implementation = function(pkg, flags) { var info = this.getPackageInfo(pkg, flags); console.log("[PM] getPackageInfo: " + pkg); console.log("  Version: " + info.versionName); console.log("  Code: " + info.versionCode); return info; }; var Signature = Java.use("android.content.pm.Signature"); Signature.toByteArray.implementation = function { var original = this.toByteArray; console.log("[SIG] toByteArray llamado - devolviendo firma original"); return original; };

});

` ### Bypass de SafetyNet `javascript

Java.perform(function { var SafetyNet = Java.use("com.google.android.gms.safetynet.SafetyNetApi"); SafetyNet.attest.implementation = function(api, nonce) { console.log("[SN] SafetyNet attest"); return null; // Simular fallo }; var JwsResult = Java.use("com.google.android.gms.safetynet.SafetyNetApi"); JwsResult.getJwsResult.implementation = function { return "fake_result"; };

});

` ### Trace de todas las llamadas a metodos de una clase `javascript

Java.perform(function { var clazz = Java.use("com.example.target.TargetClass"); var methods = clazz.class.getDeclaredMethods; methods.forEach(function(method) { var name = method.getName; var overloads = clazz[name].overloads; overloads.forEach(function(overload) { overload.implementation = function { var args = ; for (var i = 0; i < arguments.length; i++) { args.push(arguments[i]); } console.log("[TRACE] " + name + "(" + args.join(", ") + ")"); var ret = this[name].apply(this, arguments); console.log("  => " + ret); return ret; }; }); });

});

`

"@ -Encoding UTF8 # Massize Firebase addition

Add-Content -Path G:\Proyectos\10)[forense](../raw/w1n-f0r3ns1cs.md#forense)\docs\tutoriales\f1r3b4s3-h4ck1ng.md -Value @" ## ANEXO FINAL 3: Firebase Auth Provider [ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips) google.com, facebook.com, twitter.com, github.com, apple.com, yahoo.com, microsoft.com, password, phone, anonymous ## ANEXO FINAL 4: Firebase Emulator ports Auth: 9099

[firestore](../raw/f1r3b4s3-h4ck1ng.md#firestore): 8080

RTDB: 9000

Storage: 9199

Functions: 5001

Hosting: 5000

PubSub: 8085 ## ANEXO FINAL 5: Firebase Error Codes auth/user-not-found, auth/wrong-password, auth/email-already-in-use, auth/weak-password, auth/invalid-email, auth/too-many-requests, auth/user-disabled, auth/requires-recent-login ## ANEXO FINAL 6: Firebase Security Rules cheatsheet .read: true - Lectura publica

.read: false - Lectura denegada

.read: auth != null - Solo autenticados

.read: auth.uid === \ - Solo propietario .write: true - Escritura publica

.write: false - Escritura denegada

.write: auth != null - Solo autenticados

.write: auth.uid === \ - Solo propietario .validate: newData.isString - Validar tipo string

.validate: newData.isNumber - Validar tipo numero

.validate: newData.isBoolean - Validar tipo boolean

.validate: newData.val > 0 - Validar valor

.validate: newData.hasChildren(['a', 'b']) - Validar hijos data.exists - El nodo existe

data.val - Valor actual

newData.val - Nuevo valor

\ - Wildcard

now - Timestamp actual

root - Raiz de la base

auth - Datos de [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) ## ANEXO FINAL 7: Referencia de tipos Firestore stringValue, integerValue, doubleValue, booleanValue, mapValue, arrayValue, timestampValue, geoPointValue, bytesValue, referenceValue, nullValue ## ANEXO FINAL 8: Firebase [cloud](../raw/cl0ud-h4ck1ng.md) Functions regions us-central1, us-east1, us-east4, us-west1, us-west2, us-west3, us-west4, northamerica-northeast1, southamerica-east1, europe-west1, europe-west2, europe-west3, europe-west4, europe-west5, europe-west6, asia-east1, asia-east2, asia-northeast1, asia-northeast2, asia-northeast3, asia-south1, asia-southeast1, asia-southeast2, australia-southeast1 --- *Documento generado para fines educativos y de investigacion en seguridad.*

*Versiones 3.0 - Deep Dive Definitivo*

*Ultima actualizacion: Mayo 2026* --- ## ANEXO FINAL: Guia rapida de comandos de reversing ### APKTOOL

apktool d app.apk - Decompilar

apktool d -r app.apk - Decompilar sin resources

apktool d -s app.apk - Decompilar solo resources

apktool b app/ -o new.apk - Recompilar

apktool if framework.apk - Instalar framework ### JADX

jadx app.apk - Decompilar

jadx -d out/ app.apk - Decompilar a directorio

jadx --deobf app.apk - Decompilar con deobfuscation

jadx-gui app.apk - GUI ### FRIDA

frida -U -l script.js com.pkg - Hookear app

frida -U -f com.pkg -l script.js - Spawn + hook

frida-ps -Ua - Listar apps

frida-trace -U -i strcmp com.pkg - Trace nativo ### OBJECTION

objection -g com.pkg explore - Explorar

android sslpinning disable - Bypass SSL

android root disable - Bypass root

android hooking watch class_method .. - Watch method ### FIRMA

jarsigner -keystore ks -storepass pass new.apk alias - Firmar

apksigner sign --ks ks new.apk - Firmar (v2/v3)

apksigner verify new.apk - Verificar

zipalign -v -p 4 in.apk out.apk - Alinear ### OTROS

aapt dump badging app.apk - Info del APK

aapt dump permissions app.apk - Permisos

unzip -l app.apk - Contenido

strings app.apk - Strings

dex2jar app.apk - Convertir a JAR

jd-gui app-dex2jar.jar - Visualizar --- *Documento generado para fines educativos y de investigacion en seguridad.* ## Herramientas de busqueda en APK strings app.apk | grep -E "AIzaSy" - Firebase API keys

strings app.apk | grep -E "firebaseio" - Firebase URLs

strings app.apk | grep -E "https?://" - URLs

strings app.apk | grep -iE "password|secret|token" - Secrets

strings app.apk | grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" - Emails

grep -rE "(AIzaSy|firebaseio)" java_out/ --include="*.java" - En codigo ## Tipos de [ofuscacion](../raw/4pk-r3v3rs1ng.md#obfuscation) ProGuard: Renaming a.a.a, a.a.b

DexGuard: Strings cifrados, anti-debug

DashO: Control flow opaco

Allatori: Constantes ofuscadas

Arxan: Checksums, anti-tamper

WhiteCryption: Cifrado en nativo ## Identificacion de librerias libcocos2djs.so -> Cocos2D (juegos)

libunity.so -> Unity 3D

libflutter.so -> Flutter

libreactnative.so -> React Native

libssl.so -> OpenSSL

libcrypto.so -> OpenSSL crypto

libcurl.so -> HTTP requests

libsqlite3.so -> SQLite

libprotobuf.so -> Protocol Buffers --- *Documento generado para fines educativos y de investigacion en seguridad.*

*Version: 3.0 - APK Reversing Deep Dive + Proyectos Practicos*

*Ultima actualizacion: Mayo 2026* ## Extensiones de archivos en reversing .apk - Android Package - apktool, jadx, unzip

.aab - Android App Bundle - bundletool, apktool

.dex - Dalvik Executable - jadx, baksmali, dex2jar

.odex - Optimized DEX - oat2dex, baksmali

.oat - Optimized ART - oat2dex

.vdex - Verified DEX - jadx

.so - Shared Object (ELF) - Ghidra, IDA, strings

.xml (AXML) - Android XML binario - apktool, AXMLPrinter2

.arsc - Android Resource Table - apktool

.jar - Java ARchive - JD-GUI, CFR

.class - Java bytecode - CFR, Procyon, javap

.smali - Smali assembly - Editor de texto

.apks - APK Set Archive - bundletool

.xapk - APK extendido - renombrar a .zip

.ab - Android Backup - dd, zlib ## Timeline tipico de reversing 1. Extraccion: 5 min (adb pull)

2. Decompilacion: 2-10 min (apktool + jadx)

3. Analisis estatico: 30 min - 2 hs

4. Busqueda de strings: 10 min

5. Analisis de manifest: 5 min

6. Hooking inicial: 10 min (Frida/Objection)

7. Bypass de protecciones: 30 min - 4 hs

8. Analisis dinamico: 1-4 hs

9. Reporte: 30 min

Total: 3-12 hs para una app tipica ## Errores comunes INSTALL_FAILED_NO_MATCHING_ABIS -> Arquitectura incorrecta

INSTALL_FAILED_OLDER_SDK -> API level muy bajo

INSTALL_FAILED_INVALID_APK -> APK corrupta

INSTALL_FAILED_DUPLICATE_PERMISSION -> Permiso definido 2 veces

INSTALL_FAILED_CONFLICTING_PROVIDER -> Provider conflictivo

INSTALL_FAILED_UPDATE_INCOMPATIBLE -> Firma incompatible

INSTALL_FAILED_SHARED_USER_INCOMPATIBLE -> Usuario compartido incompatible

INSTALL_FAILED_MISSING_SHARED_LIBRARY -> Libreria faltante

INSTALL_FAILED_DEXOPT -> Error de optimizacion DEX ## Referencia de permisos peligrosos en Android CAMERA - Acceso a camara

RECORD_AUDIO - Grabacion de audio

ACCESS_FINE_LOCATION - GPS preciso

ACCESS_COARSE_LOCATION - Ubicacion aproximada

READ_CONTACTS - Leer contactos

WRITE_CONTACTS - Escribir contactos

READ_SMS - Leer SMS

SEND_SMS - Enviar SMS

RECEIVE_SMS - Recibir SMS

READ_PHONE_STATE - Estado del telefono (IMEI)

READ_CALL_LOG - Bitacora de llamadas

WRITE_CALL_LOG - Escribir bitacora

ADD_VOICEMAIL - Agregar buzones

USE_SIP - Llamadas SIP

PROCESS_OUTGOING_CALLS - Interceptar llamadas salientes

BODY_SENSORS - Sensores corporales

ACTIVITY_RECOGNITION - [reconocimiento](../raw/0s1nt.md#reconocimiento) de actividad

READ_EXTERNAL_STORAGE - Leer almacenamiento externo

WRITE_EXTERNAL_STORAGE - Escribir almacenamiento externo

ACCESS_MEDIA_LOCATION - Ubicacion en metadatos

ACCOUNT_MANAGER - Gestion de cuentas

BIND_ACCESSIBILITY_SERVICE - Servicio de accesibilidad (keylogger)

SYSTEM_ALERT_WINDOW - Ventanas overlay

REQUEST_INSTALL_PACKAGES - Instalar paquetes

REQUEST_DELETE_PACKAGES - Eliminar paquetes

BIND_NOTIFICATION_LISTENER_SERVICE - Leer notificaciones

MANAGE_EXTERNAL_STORAGE - Acceso total a archivos

QUERY_ALL_PACKAGES - Listar todas las apps

BIND_DEVICE_ADMIN - Administrador de dispositivo

RECEIVE_BOOT_COMPLETED - Iniciar al encender

FOREGROUND_SERVICE - Servicios en primer plano

POST_NOTIFICATIONS - Enviar notificaciones ## Codigos de error de instalacion de APK INSTALL_FAILED_ALREADY_EXISTS -> Usar -r

INSTALL_FAILED_INVALID_APK -> APK corrupto

INSTALL_FAILED_INSUFFICIENT_STORAGE -> Falta espacio

INSTALL_FAILED_VERSION_DOWNGRADE -> Usar -d

INSTALL_FAILED_UPDATE_INCOMPATIBLE -> Desinstalar primero

INSTALL_FAILED_SHARED_USER_INCOMPATIBLE -> Firma no coincide

INSTALL_FAILED_MISSING_SHARED_LIBRARY -> Falta libreria

INSTALL_FAILED_DEXOPT -> Error de optimizacion DEX

INSTALL_FAILED_OLDER_SDK -> API muy baja

INSTALL_FAILED_CPU_ABI_INCOMPATIBLE -> Arquitectura incorrecta

INSTALL_FAILED_NO_MATCHING_ABIS -> No hay lib para esta CPU

INSTALL_FAILED_CONFLICTING_PROVIDER -> Provider en conflicto

INSTALL_FAILED_DUPLICATE_PERMISSION -> Permiso duplicado ## Ghidra shortcuts F - Decompile function

Ctrl+Shift+F - Search text

G - Go to address

N - Rename symbol

X - Cross references

L - Label

; - Comment

P - Create function

O - Open/import

Space - Toggle graph/text

D - Define as data

C - Define as code

Alt+M - Bookmark

Ctrl+M - Go to bookmark

Ctrl+D - Disassemble

Ctrl+E - Search bytes

R - Revert changes ## Objection commands android sslpinning disable

android root disable

android hooking list classes

android hooking list class_methods com.package.Class

android hooking watch class com.package.Class

android hooking watch class_method com.package.Class.method

android hooking search classes password

android hooking search methods encrypt

android intent launch_activity com.package.MainActivity

android intent launch_service com.package.Service

android keystore list

android keystore watch

android ui screenshot /sdcard/screen.png

file ls /data/data/com.package/

file cat /data/data/com.package/file

sqlite connect /data/data/com.package/db

sqlite exec SELECT * FROM users

env

jobs list --- *Documento completado. Total: mas de 2500 lineas de documentacion tecnica.*

Ultima linea del documento.


