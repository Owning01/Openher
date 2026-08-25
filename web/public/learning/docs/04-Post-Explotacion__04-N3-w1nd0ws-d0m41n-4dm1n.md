# w1nd0ws-d0m41n-4dm1n.md
## Windows Domain Admin básico ([ad](../raw/w1nd0ws-d0m41n-4dm1n.md), [gpo](../raw/w1nd0ws-d0m41n-4dm1n.md#group-policy), [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns), DFS)

> **Autor:** Contribución comunitaria
> **Nivel:** Intermedio
> **Objetivo:** Administrar y entender un dominio Windows: [active directory](../raw/w1nd0ws-d0m41n-4dm1n.md), [group policy](../raw/w1nd0ws-d0m41n-4dm1n.md#group-policy), DNS, DFS, usuarios, grupos, seguridad y replicación.
> **Requisitos:** Conocimientos básicos de Windows Server, [redes](../raw/r3d3s-f0nd4m3nt0s.md) y administración de sistemas.

---

## Índice

> ⏱️ **Tiempo estimado:** 20 horas (~4 sesiones) (2318 lineas)


1. [Introducción](#1-introducción)
   - 1.1 [¿Qué es Active Directory?](#11-qué-es-active-directory)
   - 1.2 [Terminología básica](#12-terminología-básica)
2. [Estructura de AD](#2-estructura-de-ad)
   - 2.1 [Forest](#21-forest)
   - 2.2 [Domain](#22-domain)
   - 2.3 [Tree](#23-tree)
   - 2.4 [OU (Organizational Unit)](#24-ou-organizational-unit)
   - 2.5 [Site](#25-site)
   - 2.6 [Domain Controller (DC)](#26-domain-controller-dc)
   - 2.7 [Global Catalog](#27-global-catalog)
   - 2.8 [FSMO Roles](#28-fsmo-roles)
   - 2.9 [Trust Relationships](#29-trust-relationships)
3. [Autenticación en AD](#3-autenticación-en-ad)
   - 3.1 [Kerberos: KDC, TGT, TGS](#31-kerberos-kdc-tgt-tgs)
   - 3.2 [Kerberos: Authenticator y Service Tickets](#32-kerberos-authenticator-y-service-tickets)
   - 3.3 [SPN (Service Principal Name)](#33-spn-service-principal-name)
   - 3.4 [NTLM: Challenge-Response](#34-ntlm-challenge-response)
   - 3.5 [Protocol Transition](#35-protocol-transition)
4. [DNS en AD](#4-dns-en-ad)
   - 4.1 [SRV Records](#41-srv-records)
   - 4.2 [_ldap._tcp.dc._msdcs](#42-ldaptcpdcmsdcs)
   - 4.3 [Zones en AD](#43-zones-en-ad)
   - 4.4 [DNSSEC](#44-dnssec)
   - 4.5 [AD Integrated Zones](#45-ad-integrated-zones)
   - 4.6 [Secure Dynamic Updates](#46-secure-dynamic-updates)
5. [GPO (Group Policy)](#5-gpo-group-policy)
   - 5.1 [Procesamiento: LSDOU](#51-procesamiento-lsdou)
   - 5.2 [Administrative Templates](#52-administrative-templates)
   - 5.3 [Security Settings](#53-security-settings)
   - 5.4 [Software Installation](#54-software-installation)
   - 5.5 [Drive Maps](#55-drive-maps)
   - 5.6 [GPO Filtering](#56-gpo-filtering)
   - 5.7 [WMI Filtering](#57-wmi-filtering)
6. [DFS (Distributed File System)](#6-dfs-distributed-file-system)
   - 6.1 [DFS Namespaces](#61-dfs-namespaces)
   - 6.2 [DFS Replication (DFS-R)](#62-dfs-replication-dfs-r)
   - 6.3 [Namespace Types](#63-namespace-types)
7. [User and Computer Management](#7-user-and-computer-management)
   - 7.1 [ADUC (dsa.msc)](#71-aduc-dsamsс)
   - 7.2 [ADSI Edit](#72-adsi-edit)
   - 7.3 [PowerShell: New-ADUser, Get-ADComputer](#73-powershell-new-aduser-get-adcomputer)
   - 7.4 [Set-ADAccountPassword](#74-set-adaccountpassword)
   - 7.5 [Attribute Editor](#75-attribute-editor)
8. [Security Groups](#8-security-groups)
   - 8.1 [Domain Local](#81-domain-local)
   - 8.2 [Global](#82-global)
   - 8.3 [Universal](#83-universal)
   - 8.4 [Nesting y Group Scope](#84-nesting-y-group-scope)
   - 8.5 [AGDLP y AGUDLP](#85-agdlp-y-agudlp)
   - 8.6 [Built-in Groups](#86-built-in-groups)
9. [AD Permissions](#9-ad-permissions)
   - 9.1 [Object Permissions](#91-object-permissions)
   - 9.2 [Delegation of Control](#92-delegation-of-control)
   - 9.3 [AD ACLs](#93-ad-acls)
   - 9.4 [Inheritance](#94-inheritance)
   - 9.5 [DSHeuristics](#95-dsheuristics)
   - 9.6 [adminSDHolder](#96-adminsdholder)
10. [Sites and Replication](#10-sites-and-replication)
    - 10.1 [Site Links](#101-site-links)
    - 10.2 [Bridgehead Servers](#102-bridgehead-servers)
    - 10.3 [Replication Topology](#103-replication-topology)
    - 10.4 [KCC (Knowledge Consistency Checker)](#104-kcc-knowledge-consistency-checker)
    - 10.5 [ISTG (Inter-Site Topology Generator)](#105-istg-inter-site-topology-generator)
    - 10.6 [Change Notification](#106-change-notification)
11. [Domain Joins](#11-domain-joins)
    - 11.1 [Computer Account](#111-computer-account)
    - 11.2 [Secure Channel](#112-secure-channel)
    - 11.3 [Computer Object](#113-computer-object)
    - 11.4 [Managed vs Unmanaged](#114-managed-vs-unmanaged)
    - 11.5 [Interaction with Domain](#115-interaction-with-domain)
12. [Active Directory desde PowerShell](#12-active-directory-desde-powershell)
    - 12.1 [Módulo AD](#121-módulo-ad)
    - 12.2 [Scripting básico](#122-scripting-básico)
    - 12.3 [Reportes y auditoría](#123-reportes-y-auditoría)
13. [Seguridad en AD](#13-seguridad-en-ad)
    - 13.1 [Account Policies](#131-account-policies)
    - 13.2 [Kerberos Hardening](#132-kerberos-hardening)
    - 13.3 [LAPS (Local Admin Password Solution)](#133-laps-local-admin-password-solution)
    - 13.4 [Delegated Authentication](#134-delegated-authentication)
14. [Ejercicios Prácticos](#14-ejercicios-prácticos)
    - 14.1 [Ejercicio 1: Crear una OU structure](#141-ejercicio-1-crear-una-ou-structure)
    - 14.2 [Ejercicio 2: Delegar control en una OU](#142-ejercicio-2-delegar-control-en-una-ou)
    - 14.3 [Ejercicio 3: Crear un GPO y filtrarlo con WMI](#143-ejercicio-3-crear-un-gpo-y-filtrarlo-con-wmi)
    - 14.4 [Ejercicio 4: Configurar DFS Namespace](#144-ejercicio-4-configurar-dfs-namespace)
    - 14.5 [Ejercicio 5: Script de creación masiva de usuarios](#145-ejercicio-5-script-de-creación-masiva-de-usuarios)
    - 14.6 [Ejercicio 6: Auditar permisos de AD](#146-ejercicio-6-auditar-permisos-de-ad)
    - 14.7 [Ejercicio 7: Configurar Kerberos delegation](#147-ejercicio-7-configurar-kerberos-delegation)
    - 14.8 [Ejercicio 8: Migración de FSMO roles](#148-ejercicio-8-migración-de-fsmo-roles)
15. [Referencias](#15-referencias)

---

## 1) Introducción

### 1.1 ¿Qué es [active directory](../raw/w1nd0ws-d0m41n-4dm1n.md)?

Active Directory ([ad](../raw/w1nd0ws-d0m41n-4dm1n.md)) es el servicio de directorio de Microsoft para entornos Windows empresariales. Es una base de datos jerárquica que almacena información sobre todos los recursos de la [red](../raw/r3d3s-f0nd4m3nt0s.md): usuarios, computadoras, grupos, impresoras, servidores, aplicaciones.

Pero AD no es solo una base de datos. Es un conjunto de servicios que incluyen:

- **LDAP** (Lightweight Directory Access Protocol): [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red) de acceso a la base de datos
- **Kerberos**: autenticación
- **[dns](../raw/r3d3s-f0nd4m3nt0s.md#dns)**: resolución de nombres
- **[gpo](../raw/w1nd0ws-d0m41n-4dm1n.md#group-policy)**: administración centralizada de configuraciones
- **DFS**: [sistema de archivos](../raw/0s-f0nd4m3nt0s.md#sistema-de-archivos) distribuido

Como administrador de dominio, tu trabajo es mantener esta infraestructura andando, segura y performante.

### 1.2 Terminología básica

- **[domain controller](../raw/w1nd0ws-d0m41n-4dm1n.md#domain-controller) (DC):** Servidor que corre AD DS (Active Directory Domain Services)
- **Forest:** Límite de seguridad superior. Contiene uno o más domains compartiendo un schema, configuration y global catalog
- **Domain:** Unidad administrativa dentro del forest. Comparte una base de datos de AD
- **OU (Organizational Unit):** [contenedor](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) dentro de un domain para organizar objetos
- **Tree:** Conjunto de domains con un namespace DNS contiguo
- **Site:** Representación física de la red (ubicaciones geográficas)
- **GC (Global Catalog):** Repositorio parcial de todos los objetos del forest
- **FSMO:** Roles de operación single-master (cinco roles especiales)
- **Trust:** Relación de confianza entre domains/forests
- **TGT:** Ticket Granting Ticket (Kerberos)
- **SPN:** Service Principal Name (identificador único para un servicio)

---

## 2) Estructura de [ad](../raw/w1nd0ws-d0m41n-4dm1n.md)

### 2.1 Forest

El **forest** es el [contenedor](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) más grande en AD. Es el límite de seguridad lógico. Todo lo que está dentro del forest confía en todo lo demás (automáticamente).

```
Forest: empresa.com
├── Domain: empresa.com (root domain)
│   ├── OU: Usuarios
│   ├── OU: Servidores
│   └── OU: Equipos
├── Domain: sucursal.empresa.com (child domain)
│   ├── OU: Usuarios
│   └── OU: Equipos
└── Domain: filial.com (tree domain)
    └── ...
```

Características clave del forest:
- **Schema único:** Todos los domains comparten el mismo schema (definición de objetos y atributos)
- **Configuration único:** Configuración replicada a todos los DCs
- **Global Catalog compartido:** Cada domain contribuye al GC
- **Enterprise Admins y Schema Admins:** Grupos universales que operan a nivel forest

```powershell
# Ver el forest actual
Get-ADForest

# Ver todos los domains del forest
Get-ADForest | Select-Object -ExpandProperty Domains
```

### 2.2 Domain

El **domain** es la unidad administrativa central. Cada domain:

- Tiene su propia base de datos NTDS (NT Directory Services)
- Usa su propia policy (password policy, lockout policy)
- Tiene sus propios Domain Admins
- Se identifica por su FQDN (Fully Qualified Domain Name)

```powershell
# Ver información del domain
Get-ADDomain

# Ver controllers del domain
Get-ADDomainController -Filter *

# Password policy del domain
Get-ADDefaultDomainPasswordPolicy
```

La password policy incluye:
- `ComplexityEnabled`: requiere mayúsculas, minúsculas, números, símbolos
- `MinPasswordLength`: mínimo de caracteres (default 7, recomendado 14+)
- `MaxPasswordAge`: días de validez (default 42)
- `LockoutThreshold`: intentos antes de bloquear
- `LockoutDuration`: minutos de bloqueo
- `ReversibleEncryptionEnabled`: NUNCA habilitar esto

### 2.3 Tree

Un **tree** es un conjunto de domains que forman un namespace [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) contiguo.

```
Ejemplo de tree:
dominio.com
├── ventas.dominio.com  (child de dominio.com)
│   └── norte.ventas.dominio.com (child de ventas.dominio.com)
└── rrhh.dominio.com

Un segundo tree sería:
otrodominio.com (comparten forest pero distinto namespace)
```

Los domains en un tree comparten:
- Transitive trust bidireccional automático
- Schema común
- Global Catalog

### 2.4 OU (Organizational Unit)

Las OUs son contenedores dentro de un domain que te permiten organizar objetos jerárquicamente. Son el principal mecanismo para delegar administración y aplicar GPOs.

```powershell
# Crear estructura de OUs
New-ADOrganizationalUnit -Name "Empresa" -Path "DC=dominio,DC=com"
New-ADOrganizationalUnit -Name "Usuarios" -Path "OU=Empresa,DC=dominio,DC=com"
New-ADOrganizationalUnit -Name "Servidores" -Path "OU=Empresa,DC=dominio,DC=com"
New-ADOrganizationalUnit -Name "Equipos" -Path "OU=Empresa,DC=dominio,DC=com"

# Sub-OUs
New-ADOrganizationalUnit -Name "Sistemas" -Path "OU=Servidores,OU=Empresa,DC=dominio,DC=com"
New-ADOrganizationalUnit -Name "BasesDeDatos" -Path "OU=Servidores,OU=Empresa,DC=dominio,DC=com"
```

Buenas prácticas para OUs:
- Separar por ubicación geográfica, función o departamento
- Usar OUs para delegar control (no trusts ni domains)
- Máximo profundidad de 4-5 niveles
- No mezclar computadoras y usuarios en la misma OU

### 2.5 Site

Los **sites** representan la topología física de la [red](../raw/r3d3s-f0nd4m3nt0s.md). Se usan para controlar el tráfico de replicación entre DCs.

```powershell
# Ver sites
Get-ADReplicationSite -Filter *

# Crear un site
New-ADReplicationSite -Name "BuenosAires"

# Ver subnets asociadas
Get-ADReplicationSubnet -Filter *

# Asociar subnet a site
New-ADReplicationSubnet -Name "192.168.1.0/24" -Site "BuenosAires"
```

Un site puede tener:
- Uno o más DCs
- Uno o más subnets
- Site links a otros sites (con costo y schedule)

### 2.6 [domain controller](../raw/w1nd0ws-d0m41n-4dm1n.md#domain-controller) (DC)

El Domain Controller es el servidor que corre AD DS. Un domain puede tener múltiples DCs para redundancia y balance de carga.

```powershell
# Listar todos los DCs del domain
Get-ADDomainController -Filter *

# Promover un server a DC (Server Manager o PowerShell)
# Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools
# Import-Module ADDSDeployment
# Install-ADDSDomainController -DomainName "dominio.com" -SiteName "BuenosAires"
```

Los DCs almacenan la base de datos NTDS en `C:\Windows\NTDS\ntds.dit`.

### 2.7 Global Catalog

El **Global Catalog (GC)** es un índice parcial de todos los objetos del forest. Permite búsquedas rápidas sin consultar cada domain.

```powershell
# Ver qué servidores son GC
Get-ADDomainController -Filter * | Select-Object Name, IsGlobalCatalog

# Habilitar GC en un DC (Server Manager o AD Sites and Services)
# En ADSS: servidor -> NTDS Settings -> Properties -> "Global Catalog"
```

El GC es crítico para:
- Autenticación de usuarios UPN (user@domain)
- Búsqueda de objetos entre domains
- Aplicaciones que consultan AD (Exchange, SharePoint, Lync)

### 2.8 FSMO Roles

FSMO (Flexible Single Master Operation) son cinco roles que solo un DC puede tener a la vez:

**A nivel forest:**
1. **Schema Master:** Controla modificaciones al schema AD
2. **Domain Naming Master:** Agrega/elimina domains del forest

**A nivel domain:**
3. **PDC Emulator:** Reloj maestro, cambios de password, [gpo](../raw/w1nd0ws-d0m41n-4dm1n.md#group-policy) updates, pre-Windows auth
4. **RID Master:** Asigna pools de RID (Relative ID) a otros DCs
5. **Infrastructure Master:** Actualiza referencias a objetos en otros domains

```powershell
# Ver FSMO roles
netdom query fsmo

# O con PowerShell:
Get-ADForest | Select-Object SchemaMaster, DomainNamingMaster
Get-ADDomain | Select-Object PDCEmulator, RIDMaster, InfrastructureMaster

# Transferir roles (mover graceful)
Move-ADDirectoryServerOperationMasterRole -Identity "DC02" -OperationMasterRole PDCEmulator, RIDMaster, InfrastructureMaster

# Seize roles (forzar, solo si el dueño original no vuelve)
Move-ADDirectoryServerOperationMasterRole -Identity "DC02" -OperationMasterRole PDCEmulator -Force
```

### 2.9 Trust Relationships

Los trusts permiten a usuarios de un domain acceder a recursos en otro domain.

**Tipos de trust:**
- **Parent-child trust:** Automático, transitivo, bidireccional
- **Tree-root trust:** Automático entre trees del mismo forest
- **External trust:** Manual, no transitivo (entre domains de distintos forests)
- **Forest trust:** Manual, transitivo, entre forests enteros
- **Shortcut trust:** Manual, entre domains del mismo forest (optimiza autenticación)
- **Realm trust:** Entre AD y un Kerberos realm (Linux/Unix)

```powershell
# Ver trusts del domain
Get-ADTrust -Filter *

# Crear trust externo
New-ADTrust -Name "otrodom.com" -SourceForest "dominio.com" `
    -TargetForest "otrodom.com" -TrustType External `
    -TrustDirection Bidirectional -TrustScope Domain

# Crear shortcut trust
New-ADTrust -Name "europa.dominio.com" `
    -Target "europa.dominio.com" -Type Shortcut `
    -Direction Bidirectional -SourceForest "america.dominio.com"

# Ver todas las trust relationships del forest
Get-ADForest | Select-Object -ExpandProperty UPNSuffixes
```

La **dirección del trust** define la relación:
- **One-way incoming:** Confían en nosotros
- **One-way outgoing:** Confiamos en ellos
- **Bidirectional:** Confianza mutua

La **transitividad**:
- **Transitive:** La confianza se extiende a otros domains (no requiere trusts explícitos)
- **Non-transitive:** Solo aplica al domain específico

---

## 3) Autenticación en [ad](../raw/w1nd0ws-d0m41n-4dm1n.md)

### 3.1 Kerberos: KDC, TGT, TGS

Kerberos es el [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red) de autenticación predeterminado en AD desde Windows 2000. Reemplazó a NTLM.

**Componentes:**
- **KDC (Key Distribution Center):** Servicio en cada DC que emite tickets
- **AS (Authentication Service):** Parte del KDC que da TGTs
- **TGS (Ticket Granting Service):** Parte del KDC que da service tickets

**Flujo básico:**

```
Cliente                           KDC (DC)
   |                                 |
   |---- AS-REQ (user, timestamp) -->|
   |                                 | Verifica usuario en AD
   |<--- AS-REP (TGT encriptado) ----|
   |                                 |
   |---- TGS-REQ (TGT, SPN) ------->|
   |                                 | Verifica TGT, chequea SPN
   |<--- TGS-REP (Service Ticket) ---|
   |                                 |
   |---- AP-REQ (Service Ticket) --->|
   |                                 | Aplica valida el ticket
   |<--- AP-REP (autenticado) -------|
```

### 3.2 Kerberos: Authenticator y Service Tickets

**TGT (Ticket Granting Ticket):**
- Encriptado con la clave KRBTGT del domain (nadie más puede leerlo)
- Validez: 10 horas por defecto
- Contiene: SID del usuario, grupos, tiempo de validez
- Se renueva automáticamente mientras el usuario esté logueado

**Service Ticket:**
- Encriptado con la clave del servicio (basada en el SPN)
- Incluye el PAC (Privilege Attribute Certificate) con los grupos del usuario
- Validez: 10 horas (renovable)
- El servidor que recibe el ticket lo descifra con su clave

```powershell
# Ver tickets Kerberos en una máquina
klist

# Forzar renovación de TGT
klist purge
# O reiniciar sesión

# Ver configuración Kerberos del domain
Get-ADObject -Identity "CN=Kerberos Policies,CN=Policies,CN=System,DC=dominio,DC=com"
```

**Atributos del ticket:**
- `Ticket lifetime`: 10 horas
- `Renew lifetime`: 7 días (máximo renovación)
- `Max service ticket lifetime`: 10 horas
- `Clock skew tolerance`: 5 minutos

### 3.3 SPN (Service Principal Name)

Un SPN (Service Principal Name) identifica de manera única un servicio en AD. Es fundamental para Kerberos.

**Formato:** `serviceclass/host:port`

```powershell
# Ver SPNs de una cuenta
setspn -L SERVIDOR01

# Ver todos los SPNs en el dominio
setspn -T dominio.com -Q */*

# Agregar SPN manual
setspn -S HTTP/webserver.dominio.com CUENTA_SERVICIO

# Eliminar SPN
setspn -D HTTP/webserver.dominio.com CUENTA_SERVICIO

# Buscar SPNs específicos
Get-ADComputer -Filter * | ForEach-Object {
    setspn -L $_.Name
} | Where-Object { $_ -match "MSSQL" }
```

**SPNs comunes:**
- `HTTP/webserver.dominio.com` (IIS)
- `MSSQLSvc/sqlserver.dominio.com:1433` (SQL Server)
- `HOST/servidor.dominio.com` (generic host)
- `TERMSRV/servidor.dominio.com` (Remote Desktop)
- `exchangeMDB/exchserver.dominio.com` (Exchange)

Si el SPN está duplicado, Kerberos fallará. Usá `setspn -X` para buscar duplicados:

```powershell
setspn -X
```

### 3.4 NTLM: Challenge-Response

NTLM (NT LAN Manager) es el protocolo de autenticación heredado que Kerberos reemplazó. Sigue usándose como fallback cuando Kerberos no es posible.

**Flujo NTLMv2:**

```
Cliente                        Servidor
   |                               |
   |---- NEGOTIATE --------------->|
   |<--- CHALLENGE (16-byte) -----|
   |                               |
   |---- AUTHENTICATE ------------>|
   |    (hash(NTLM) del challenge) |
   |                               |
   |                               | Envía challenge+response al DC
   |                               | DC verifica contra SAM
   |<--- ACCEPT/DENY --------------|
```

**NTLM vs Kerberos:**
| Característica | Kerberos | NTLM |
|----------------|----------|------|
| Centralizado | KDC | Workstation/DC |
| Trust delegation | Sí (constrained/unconstrained) | No |
| Double-hop | Sí (delegation) | No |
| [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) | Tickets | Challenge-response |
| Forward/Replay attacks | Resistente | Vulnerable |

```powershell
# Ver uso de NTLM en el dominio (auditoría)
# GPO: Network Security: Restrict NTLM: Audit Incoming NTLM Traffic

# Dejar de usar NTLM (en transición)
# GPO: Network Security: Restrict NTLM: NTLM authentication in this domain
# Settings: Deny all, Deny for domain servers to domain clients
```

### 3.5 Protocol Transition

Protocol transition permite que una aplicación autentique un usuario con un método no-Kerberos (como forms auth o certificado) y después use Kerberos para el "double-hop" (delegaciación).

```powershell
# Habilitar protocol transition en una cuenta de servicio
# Requiere: "Trust this user for delegation to specified services only"
# + "Use Kerberos only" DESACTIVADO (permite protocol transition)

Set-ADUser -Identity "CUENTA_SERVICIO" -PrincipalsAllowedToDelegateToAccount (Get-ADComputer "SERVIDOR02")
```

---

## 4) [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) en [ad](../raw/w1nd0ws-d0m41n-4dm1n.md)

### 4.1 SRV Records

AD depende críticamente del DNS. Sin DNS, AD no funciona. Los SRV records son la clave para que los clientes encuentren DCs y servicios.

```powershell
# Ver SRV records en el DNS
Get-DnsServerResourceRecord -ZoneName "dominio.com" -RRType "SRV"
```

Los SRV records más importantes:

```
_ldap._tcp.dominio.com            -> DC:389 (LDAP)
_ldap._tcp.dc._msdcs.dominio.com  -> DC:389 (DC locator)
_gc._tcp.dominio.com              -> GC:3268 (Global Catalog)
_kerberos._tcp.dominio.com        -> DC:88 (Kerberos)
_kpasswd._tcp.dominio.com         -> DC:464 (Password change)
```

```powershell
# Verificar que los SRV records estén correctos
nslookup -type=srv _ldap._tcp.dominio.com
nslookup -type=srv _kerberos._tcp.dominio.com
```

### 4.2 _ldap._tcp.dc._msdcs

El subdominio `_msdcs` es crítico para la operación del [domain controller](../raw/w1nd0ws-d0m41n-4dm1n.md#domain-controller) locator.

```
_msdcs.dominio.com
├── _ldap._tcp.dc._msdcs.dominio.com -> SRV records de DCs
├── _ldap._tcp.{SiteName}._sites.dc._msdcs.dominio.com -> DCs por site
├── _ldap._tcp.pdc._msdcs.dominio.com -> PDC Emulator
├── _ldap._tcp.gc._msdcs.dominio.com -> Global Catalog
└── _ldap._tcp.{DomainGuid}.domains._msdcs.forestroot.com

# Verificar
nslookup -type=srv _ldap._tcp.dc._msdcs.dominio.com
```

Si estos registros faltan, los clientes no pueden encontrar el dominio.

### 4.3 Zones en AD

AD DNS soporta tres tipos de zonas:

**Primary zone:** Almacenada en el DC, permitiendo updates
**Secondary zone:** Copia de solo lectura (para balance)
**AD Integrated zone:** Almacenada en la base de datos de AD y replicada automáticamente (recomendada)

```powershell
# Ver zonas DNS
Get-DnsServerZone

# Crear zona AD integrated
Add-DnsServerPrimaryZone -Name "nuevodominio.com" `
    -ReplicationScope "Domain" -PassThru

# Tipos de replication scope:
# - Forest: replica a todos los DCs del forest
# - Domain: replica a todos los DCs del domain
# - Legacy: replica según el scope configurado en AD
```

### 4.4 DNSSEC

DNSSEC agrega firmas criptográficas a los registros DNS para prevenir ataques de envenenamiento de caché.

```powershell
# Instalar módulo DNSSEC
Add-WindowsFeature -Name RSAT-DNS-Server

# Firmar zona
Add-DnsServerSigningKey -ZoneName "dominio.com" `
    -KeyType "KeySigningKey" -NotAfter (Get-Date).AddYears(5)
Add-DnsServerSigningKey -ZoneName "dominio.com" `
    -KeyType "ZoneSigningKey"

# Habilitar DNSSEC en zona
Set-DnsServerZone -Name "dominio.com" -SecureDelegations $true

# Revisar estado
Get-DnsServerZone -Name "dominio.com" | fl DnsSec
```

### 4.5 AD Integrated Zones

Las zonas integradas en AD tienen ventajas importantes sobre zonas tradicionales:

1. **Replicación automática:** La zona se replica con la base de datos de AD (multimaster)
2. **Secure dynamic updates:** Solo cuentas autenticadas pueden actualizar DNS
3. **No single point of failure:** Todos los DCs autoritativos
4. **Menos tráfico de replicación:** El cambio DNS viaja con AD

```powershell
# Convertir zona a AD integrated
Set-DnsServerPrimaryZone -Name "dominio.com" -ReplicationScope "Domain"

# Ver propiedades
Get-DnsServerZone -Name "dominio.com" | Select Name, ZoneType, ReplicationScope
```

### 4.6 Secure Dynamic Updates

Por defecto, los clientes Windows registran dinámicamente sus registros DNS en AD. Con "Secure dynamic updates", solo el cliente que creó el registro puede modificarlo.

```powershell
# Configurar zona para secure updates
Set-DnsServerPrimaryZone -Name "dominio.com" -DynamicUpdate "Secure"

# Valores posibles:
# - None: no updates
# - NonsecureAndSecure: cualquiera puede actualizar
# - Secure: solo autenticados

# Ver configuración de scavenging (limpieza de registros viejos)
Set-DnsServerScavengingState -ApplyOnZone $true -ZoneName "dominio.com"
```

---

## 5) [gpo](../raw/w1nd0ws-d0m41n-4dm1n.md#group-policy) ([group policy](../raw/w1nd0ws-d0m41n-4dm1n.md#group-policy))

### 5.1 Procesamiento: LSDOU

Las GPOs se procesan en un orden específico. Las políticas posteriores sobreescriben las anteriores en caso de conflicto.

**Orden LSDOU:**
1. **L**ocal (política del equipo)
2. **S**ite (GPOs vinculadas al site)
3. **D**omain (GPOs vinculadas al domain)
4. **O**U (GPOs vinculadas a OUs, en orden jerárquico)

```
GPO Local (menor prioridad)
    ↓
GPO Site
    ↓
GPO Domain
    ↓
GPO OU Padre
    ↓
GPO OU Hija
    ↓
GPO OU Nieta (mayor prioridad)
```

```powershell
# Ver GPOs aplicadas a una computadora/usuario
gpresult /r /h reporte.html

# Ver en PowerShell
Get-GPResultantSetOfPolicy -ReportType Html -Path reporte.html

# Forzar actualización de GPO
gpupdate /force

# Ver GPOs en el dominio
Get-GPO -All

# Ver qué GPOs están vinculadas a una OU
Get-GPInheritance -Target "OU=Usuarios,DC=dominio,DC=com"
```

**Configuración de herencia:**
- **Enforced (No Override):** La política no puede ser sobreescrita por GPOs hijas
- **Block Inheritance:** Una OU puede bloquear la herencia de GPOs padre (excepto las Enforced)

```powershell
# Deshabilitar herencia en una OU
Set-GPInheritance -Target "OU=Usuarios,DC=dominio,DC=com" -IsBlocked $true

# Marcar GPO como Enforced
Set-GPO -Name "PolicySeguridad" -Enforce $true
```

### 5.2 Administrative Templates

Los Administrative Templates (.admx, .adml) son archivos XML que definen políticas basadas en registro (registry-based policies).

```powershell
# Agregar templates administrativos al Central Store
# Copiar archivos .admx y .adml a:
# \\dominio.com\SYSVOL\dominio.com\Policies\PolicyDefinitions

# Ver templates cargados (en GPMC)
# Computer Configuration -> Policies -> Administrative Templates
# User Configuration -> Policies -> Administrative Templates
```

Los templates más comunes:
- **System:**
  - Scripts (startup/shutdown, logon/logoff)
  - Group Policy (processing, loopback)
  - [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) execution policy
- **Windows Components:**
  - Windows Update (WSUS config)
  - BitLocker Drive Encryption
  - Windows Defender
  - Internet Explorer/Edge
  - Remote Desktop Services
  - Windows Store
- **Network:**
  - Network Connections
  - Offline Files
  - Background Intelligent Transfer (BITS)

**Templates custom:** podés crear tus propios .admx para aplicaciones que usan registro.

```xml
<?xml version="1.0" encoding="utf-8"?>
<policyDefinitions xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  revision="1.0" schemaVersion="1.0">
  <categories>
    <category name="MiApp" displayName="Mi Aplicacion" />
  </categories>
  <policies>
    <policy name="Setting1" class="Machine"
            displayName="Configuracion 1"
            explainText="Descripcion de la politica"
            key="SOFTWARE\MiApp"
            valueName="ConfigKey">
      <parentCategory ref="MiApp" />
      <supportedOn ref="Windows:6.0" />
      <enabledValue>
        <decimal value="1" />
      </enabledValue>
      <disabledValue>
        <decimal value="0" />
      </disabledValue>
    </policy>
  </policies>
</policyDefinitions>
```

### 5.3 Security Settings

Las Security Settings en GPO controlan la seguridad del sistema y de la [red](../raw/r3d3s-f0nd4m3nt0s.md).

```powershell
# Ver políticas de seguridad aplicadas
secedit /export /cfg secpolicy.inf

# Áreas de security settings:
```

**Account Policies (Computer Config -> Policies -> Windows Settings -> Security Settings):**

| Política | Recomendación |
|----------|---------------|
| Enforce password history | 24+ passwords |
| Maximum password age | 90 días (o 365 con passphrase) |
| Minimum password length | 14 caracteres |
| Minimum password length audit | Habilitar para detectar pass cortas |
| Account lockout threshold | 5 intentos |
| Account lockout duration | 15 minutos |
| Reset account lockout counter after | 15 minutos |

**Local Policies / User Rights Assignment:**

| Right | Recomendación |
|-------|---------------|
| Allow log on locally | Administrators, Users |
| Deny log on through Remote Desktop | No incluir Administrators si no es necesario |
| Access this computer from network | Administrators, Authenticated Users |
| SeIncreaseQuotaPrivilege | Administrators |
| SeServiceLogonRight | Accounts de servicio específicos |

**Security Options:**
- `Network access: Do not allow anonymous enumeration of SAM accounts` -> Enabled
- `Network security: LAN Manager authentication level` -> Send NTLMv2 response only. Refuse LM & NTLM
- `Microsoft network server: Digitally sign communications (always)` -> Enabled
- `Domain member: Digitally encrypt or sign secure channel data (always)` -> Enabled
- `User Account Control: Run all administrators in Admin Approval Mode` -> Enabled

### 5.4 Software Installation

La GPO de Software Installation permite instalar aplicaciones automáticamente:

```powershell
# Crear un GPO de software installation
New-GPO -Name "Instalar7Zip" -Comment "Instala 7-Zip en equipos"

# Configurar (usando GPMC o PowerShell)
# Computer Configuration -> Policies -> Software Settings -> Software Installation
# New -> Package -> apuntar a .msi en un share
# \\dominio.com\SYSVOL\Recursos\7z.msi
```

Tipos de deployment:
- **Assigned:** La aplicación se instala automáticamente (en computadora o usuario)
- **Published:** La aplicación aparece en "Add/Remove Programs" para instalación opcional

```powershell
# Modificar deployment type
Set-GPPrefRegistryValue -Name "Instalar7Zip" `
    -Context Computer -Action Update
```

### 5.5 Drive Maps

Mapear unidades de red con Group Policy Preferences:

```powershell
# Crear GPO con drive maps
$gpo = New-GPO -Name "MapUnidades"

# Configurar drive mapping (se hace en GPMC, pero podemos exportar/importar XML)
# User Configuration -> Preferences -> Windows Settings -> Drive Maps
# New -> Mapped Drive
# - Action: Create/Update/Replace/Delete
# - Path: \\servidor\share
# - Drive Letter: S:
# - Label: "Share de datos"
```

Las Drive Maps via GPO aparecen en el contexto del usuario (User Configuration), no Computer.

### 5.6 GPO Filtering

El filtrado permite que una GPO se aplique solo a grupos específicos, no a todos.

```powershell
# Por defecto, las GPOs se aplican a "Authenticated Users" (todos)
# Para filtrar:
# 1. Quitar "Authenticated Users" de Security Filtering
# 2. Agregar los grupos específicos

# En GPMC:
# Right-click GPO -> Security Filtering -> Remove "Authenticated Users"
# Add -> "Domain Computers" (para aplicar solo a computadoras)
# Add -> "Grupo_Servidores" (para aplicar solo a servidores específicos)

# Ver security filtering
Get-GPPermissions -Name "MiGPO" -All
```

### 5.7 [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Filtering

WMI filters permiten aplicar GPOs basándose en condiciones del sistema (versión de Windows, RAM, tipo de equipo, etc.).

Ejemplo: aplicar política solo a Windows 10/11:

```sql
-- Nombre del filter: "Windows 10+ Workstations"
SELECT * FROM Win32_OperatingSystem
WHERE Version LIKE "10.%" AND ProductType = "1"
```

Ejemplo: aplicar política solo a servidores con más de 8GB RAM:

```sql
-- Nombre del filter: "Servidores 8GB+"
SELECT * FROM Win32_ComputerSystem
WHERE TotalPhysicalMemory >= 8589934592
```

Ejemplo: aplicar solo a equipos con software específico:

```sql
SELECT * FROM Win32_Product
WHERE Name = "Microsoft Office Professional Plus 2019"
```

```powershell
# Crear WMI filter
$filter = New-GPO -Name "WMI_Filtro_Ejemplo"
Set-GPWMIFilter -Name "Windows Server 2022" -Script @{
    Namespace = "root\cimv2"
    Query     = "SELECT * FROM Win32_OperatingSystem WHERE Version LIKE '10.0.20348%'"
    Target    = "Computer"
}

# Ver filters
Get-GPWMIFilter -All
```

---

## 6) DFS (Distributed File System)

### 6.1 DFS Namespaces

DFS Namespaces permite presentar shares de múltiples servidores como un único namespace:

```
\\dominio.com\Recursos
├── \\Servidor01\Departamentos\Ventas
├── \\Servidor01\Departamentos\RRHH
├── \\Servidor02\Proyectos
└── \\Servidor03\Publico

Un usuario accede a: \\dominio.com\Recursos\Ventas
Y automáticamente lo redirige a: \\Servidor01\Departamentos\Ventas
```

```powershell
# Instalar DFS
Install-WindowsFeature -Name FS-DFS-Namespace, FS-DFS-Replication

# Crear namespace
New-DfsnRoot -Path "\\dominio.com\Recursos" `
    -TargetPath "\\Servidor01\Compartido" `
    -Type DomainV2

# Agregar folder targets
New-DfsnFolder -Path "\\dominio.com\Recursos\Ventas" `
    -TargetPath "\\Servidor02\Ventas"

# Ver configuración
Get-DfsnRoot -Path "\\dominio.com\Recursos"
Get-DfsnFolder -Path "\\dominio.com\Recursos\Ventas"
```

### 6.2 DFS Replication (DFS-R)

DFS-R reemplazó a FRS (File Replication Service) como el motor de replicación de archivos. SYSVOL usa DFS-R desde Windows Server 2008.

```powershell
# Crear replication group
New-DfsReplicationGroup -GroupName "ReplicacionVentas"

# Agregar servidores al grupo
Add-DfsrMember -GroupName "ReplicacionVentas" `
    -ComputerName "Servidor01", "Servidor02"

# Crear folder de replicación
Add-DfsrFolderToGroup -GroupName "ReplicacionVentas" `
    -FolderName "VentasData"

# Configurar conexiones entre miembros
Add-DfsrConnection -GroupName "ReplicacionVentas" `
    -SourceComputerName "Servidor01" `
    -DestinationComputerName "Servidor02"

# Ver estado de replicación
Get-DfsrStateUpdate -GroupName "ReplicacionVentas"
Get-DfsrBacklog -GroupName "ReplicacionVentas" `
    -SourceComputerName "Servidor01" `
    -DestinationComputerName "Servidor02"
```

DFS-R usa RDC (Remote Differential Compression): solo replica los bloques cambiados, no los archivos completos.

### 6.3 Namespace Types

**Domain-based namespace:**
- `\\dominio.com\Recursos`
- Hosteado en múltiples servidores (redundancia)
- Usa [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) para almacenar configuración
- Accesible desde cualquier dominio

```powershell
# Domain-based (recomendado)
New-DfsnRoot -Path "\\dominio.com\Recursos" -Type DomainV2
```

**Stand-alone namespace:**
- `\\Servidor01\Recursos`
- Hosteado en un solo servidor
- No requiere AD
- Útil para entornos sin AD o DMZ

```powershell
# Stand-alone
New-DfsnRoot -Path "\\Servidor01\Compartido" -Type Standalone
```

---

## 7) User and Computer Management

### 7.1 ADUC (dsa.msc)

[active directory](../raw/w1nd0ws-d0m41n-4dm1n.md) Users and Computers es la herramienta MMC principal para administrar objetos.

```powershell
# Abrir ADUC
dsa.msc

# Acciones comunes desde línea:
# Crear usuario desde consola: dsa.msc -> OU -> New -> User
# O desde línea:
dsadd user "CN=Juan Perez,OU=Usuarios,DC=dominio,DC=com" -samid jperez -upn [email protected] -pwd MiPassword123 -mustchpwd yes
```

ADUC permite:
- Crear/modificar/eliminar usuarios
- Resetear passwords
- Habilitar/deshabilitar cuentas
- Mover objetos entre OUs
- Administrar membresía de grupos
- Publicar certificados
- Configurar perfil de usuario (home folder, profile path, logon script)

### 7.2 ADSI Edit

ADSI Edit es una herramienta de bajo nivel para modificar directamente la base de datos de [ad](../raw/w1nd0ws-d0m41n-4dm1n.md). **Muy poderosa y peligrosa.**

```powershell
# Abrir ADSI Edit
adsiedit.msc

# Conectarse a un partition:
# - Default naming context: DC=dominio,DC=com (usuarios, grupos, etc.)
# - Configuration: CN=Configuration,DC=dominio,DC=com (sites, servicios, etc.)
# - Schema: CN=Schema,CN=Configuration,DC=dominio,DC=com (definiciones de atributos)
```

Usos comunes de ADSI Edit:
- Modificar atributos no expuestos en ADUC
- Habilitar funcionalidades de schema (como el "Show Advanced Features" en ADUC)
- Forzar modificaciones cuando la interfaz no permite hacerlo
- Solucionar problemas de confianza

```powershell
# PowerShell con ADSI también permite acceso de bajo nivel
$obj = [ADSI]"LDAP://CN=Juan Perez,OU=Usuarios,DC=dominio,DC=com"
$obj.Put("extensionAttribute1", "ValorCustom")
$obj.SetInfo()
```

### 7.3 [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell): New-ADUser, Get-ADComputer

El módulo Active Directory de PowerShell es la herramienta moderna por excelencia.

```powershell
# Importar módulo
Import-Module ActiveDirectory

# ---- USUARIOS ----

# Crear usuario
New-ADUser -Name "Juan Perez" `
    -SamAccountName "jperez" `
    -UserPrincipalName "[email protected]" `
    -GivenName "Juan" `
    -Surname "Perez" `
    -DisplayName "Juan Perez" `
    -Department "Ventas" `
    -Title "Vendedor" `
    -Office "Buenos Aires" `
    -Company "MiEmpresa" `
    -StreetAddress "Av. Siempre Viva 123" `
    -POBox "1000" `
    -City "CABA" `
    -State "CABA" `
    -Country "AR" `
    -PhoneNumber "+54 11 5555-1234" `
    -MobilePhone "+54 11 5555-5678" `
    -EmailAddress "[email protected]" `
    -HomePhone "+54 11 5555-9012" `
    -OtherName "JP" `
    -AccountPassword (ConvertTo-SecureString "MiPassword123!" -AsPlainText -Force) `
    -Enabled $true `
    -ChangePasswordAtLogon $true `
    -PasswordNeverExpires $false `
    -CannotChangePassword $false `
    -Path "OU=Usuarios,OU=Empresa,DC=dominio,DC=com"

# Obtener usuarios
Get-ADUser -Identity jperez
Get-ADUser -Filter {Department -eq "Ventas"} -Properties Department, Title
Get-ADUser -Filter * -SearchBase "OU=Usuarios,DC=dominio,DC=com"

# Modificar usuario
Set-ADUser -Identity jperez -Title "Vendedor Senior"

# Deshabilitar/habilitar
Disable-ADAccount -Identity jperez
Enable-ADAccount -Identity jperez

# ---- COMPUTADORAS ----

# Obtener computadoras
Get-ADComputer -Filter *
Get-ADComputer -Identity "PC-001" -Properties OperatingSystem, LastLogonDate, IPv4Address

# Buscar computadoras por sistema operativo
Get-ADComputer -Filter {OperatingSystem -like "*Windows 10*"}

# Computadoras que no hicieron login en 90 días
$corte = (Get-Date).AddDays(-90)
Get-ADComputer -Filter {LastLogonDate -lt $corte} -Properties LastLogonDate

# ---- GRUPOS ----

# Crear grupo
New-ADGroup -Name "GrupoVentas" `
    -GroupScope Global `
    -GroupCategory Security `
    -Path "OU=Grupos,DC=dominio,DC=com"

# Agregar miembros
Add-ADGroupMember -Identity "GrupoVentas" -Members "jperez", "mgarcia"

# Ver miembros
Get-ADGroupMember -Identity "GrupoVentas"
Get-ADPrincipalGroupMembership -Identity "jperez"
```

### 7.4 [set](../raw/ph1sh1ng.md#social-engineering-toolkit)-ADAccountPassword

```powershell
# Resetear password de usuario
$nuevoPassword = ConvertTo-SecureString "NuevoPass123!" -AsPlainText -Force
Set-ADAccountPassword -Identity jperez -NewPassword $nuevoPassword -Reset

# Forzar cambio en próximo login
Set-ADUser -Identity jperez -ChangePasswordAtLogon $true

# En servidores de varios DCs, es buena práctica verificar replicación
# del cambio de password (el PDC Emulator es el authoritative)
```

### 7.5 Attribute Editor

El Attribute Editor (disponible en ADUC con "Advanced Features" activado) permite ver/modificar todos los atributos de un objeto.

```powershell
# Habilitar Advanced Features en ADUC
# View -> Advanced Features (en ADUC)

# O ver atributos con PowerShell:
Get-ADUser -Identity jperez -Properties *

# Atributos útiles:
# - extensionAttribute1-15: atributos genéricos para aplicaciones
# - info: notas sobre el usuario
# - manager: su superior
# - directReports: subordinados (computado)
# - memberOf: grupos (computado)
# - primaryGroupID: grupo primario (default: Domain Users)
# - userAccountControl: flags de la cuenta (ver sección)
```

**userAccountControl flags:**

| Valor | Propiedad |
|-------|-----------|
| 0x0001 | ADS_UF_ACCOUNTDISABLE |
| 0x0002 | ADS_UF_HOMEDIR_REQUIRED |
| 0x0004 | ADS_UF_LOCKOUT |
| 0x0010 | ADS_UF_NORMAL_ACCOUNT |
| 0x0020 | ADS_UF_DONT_EXPIRE_PASSWD |
| 0x0040 | ADS_UF_MNS_LOGON_ACCOUNT |
| 0x0080 | ADS_UF_SMARTCARD_REQUIRED |
| 0x0100 | ADS_UF_TRUSTED_FOR_DELEGATION |
| 0x0200 | ADS_UF_NOT_DELEGATED |
| 0x10000 | ADS_UF_PASSWORD_EXPIRED |

```powershell
# Ver userAccountControl
Get-ADUser jperez -Properties userAccountControl | Format-List

# Marcar password como "nunca expira"
Set-ADUser jperez -PasswordNeverExpires $true
# Equivale a: userAccountControl incluye 0x10000
```

---

## 8) Security Groups

### 8.1 Domain Local

Los grupos Domain Local se usan para asignar [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) a recursos (archivos, carpetas, impresoras).

**Características:**
- Scope limitado al domain donde se crean
- Pueden contener: usuarios, grupos globales, grupos universales de cualquier dominio
- Se usan en las ACLs de los recursos

```powershell
# Crear grupo Domain Local
New-ADGroup -Name "DL_Acceso_Printer_HP" `
    -GroupScope DomainLocal `
    -GroupCategory Security `
    -Path "OU=GruposRecursos,DC=dominio,DC=com"
```

### 8.2 Global

Los grupos Global se usan para organizar usuarios con características similares.

**Características:**
- Pueden contener: usuarios y grupos globales del mismo dominio
- Visibles en todo el forest
- Se agregan a grupos Domain Local para dar permisos

```powershell
# Crear grupo Global
New-ADGroup -Name "G_Ventas" `
    -GroupScope Global `
    -GroupCategory Security `
    -Path "OU=GruposUsuarios,DC=dominio,DC=com"
```

### 8.3 Universal

Los grupos Universal pueden contener usuarios y grupos de cualquier dominio del forest.

**Características:**
- Almacenados en el Global Catalog (replicados a todos los DCs)
- Se usan para permisos entre dominios
- Cambios en membresía universal se replican a todos los GCs

```powershell
# Crear grupo Universal
New-ADGroup -Name "U_AccesoGlobal" `
    -GroupScope Universal `
    -GroupCategory Security `
    -Path "OU=GruposUniversales,DC=dominio,DC=com"
```

### 8.4 Nesting y Group Scope

Los grupos se pueden anidar (grupos dentro de grupos), pero con limitaciones según el scope:

| Group contiene | Domain Local | Global | Universal |
|----------------|--------------|--------|-----------|
| Usuarios del mismo dominio | Sí | Sí | Sí |
| Usuarios de otro dominio | Sí | No | Sí |
| Global del mismo dominio | Sí | Sí | Sí |
| Global de otro dominio | Sí | No | Sí |
| Universal | Sí | No | Sí |
| Domain Local | No | No | No |

### 8.5 AGDLP y AGUDLP

AGDLP es el modelo recomendado de nesting de grupos:

**A**ccounts (usuarios)
  → **G**lobal groups (rol funcional)
    → **D**omain **L**ocal groups (permiso de recurso)
      → **P**ermissions (ACL del recurso)

```
Ejemplo:
Usuario: Juan Perez (A)
  → Grupo: G_Ventas (G)
    → Grupo: DL_Acceso_CarpetaVentas (DL)
      → ACL: NTFS Modify en \\servidor\Ventas
```

**AGUDLP** es la variante para entre dominios:
**A**ccounts → **G**lobal → **U**niversal → **D**omain **L**ocal → **P**ermissions

```
Usuario de dominio A: Juan
  → Grupo Global_A_Ventas (mismo dominio)
    → Grupo Universal U_Acceso_Ventas (cross-domain)
      → Grupo DL_Acceso_Share (dominio B)
        → ACL en recurso del dominio B
```

### 8.6 Built-in Groups

[ad](../raw/w1nd0ws-d0m41n-4dm1n.md) incluye grupos built-in con privilegios especiales:

| Grupo | Nivel | Descripción |
|-------|-------|-------------|
| Domain Admins | Domain | Control total del dominio |
| Domain Users | Domain | Todos los usuarios del dominio |
| Domain Computers | Domain | Todas las computadoras |
| Enterprise Admins | Forest | Control total del forest |
| Schema Admins | Forest | Pueden modificar el schema |
| Administrators | Local (DC) | Administradores del DC (incluye Domain Admins) |
| Account Operators | Domain | Pueden crear/modificar cuentas |
| Server Operators | Domain | Pueden iniciar/detener servicios |
| Backup Operators | Domain | Pueden backup de archivos |
| Print Operators | Domain | Administran impresoras |

```powershell
# Ver miembros de un grupo built-in
Get-ADGroupMember -Identity "Domain Admins"

# Agregar usuario a Domain Admins (cuidado!)
Add-ADGroupMember -Identity "Domain Admins" -Members "jperez"
```

**Principio de mínimos privilegios:** ningún usuario (excepto cuentas de break glass) debería ser Domain Admin.

---

## 9) [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) Permissions

### 9.1 Object Permissions

Cada objeto en AD tiene una ACL (Access Control List) que define quién puede hacer qué sobre el objeto.

```powershell
# Ver ACL de un objeto AD
Get-Acl -Path "AD:CN=Juan Perez,OU=Usuarios,DC=dominio,DC=com" | Format-List

# Ver de forma más detallada
(Get-Acl -Path "AD:CN=Juan Perez,OU=Usuarios,DC=dominio,DC=com").Access
```

[permisos](../raw/0s-f0nd4m3nt0s.md#permisos) comunes:
- **GenericRead:** Leer atributos del objeto
- **GenericWrite:** Modificar atributos
- **WriteProperty:** Escribir propiedades específicas
- **ResetPassword:** Resetear contraseña
- **ChangePassword:** Cambiar contraseña (conociendo la anterior)
- **Validated write to SPN:** Agregar/modificar SPN

### 9.2 Delegation of Control

La Delegation of Control Wizard permite delegar administración sin dar permisos globales.

```powershell
# Delegar usando PowerShell
# Delegar a un grupo: "SoporteTI"
# En la OU: "OU=Usuarios,DC=dominio,DC=com"
# Permisos: resetear password, modificar atributos de contacto

# Crear el grupo de delegación
New-ADGroup -Name "G_SoporteTI" -GroupScope Global -Path "OU=Grupos,DC=dominio,DC=com"

# Delegar (usando dsacls)
# dsacls "OU=Usuarios,DC=dominio,DC=com" /G "DOMINIO\G_SoporteTI:CA;Reset Password"
# dsacls "OU=Usuarios,DC=dominio,DC=com" /G "DOMINIO\G_SoporteTI:WP;info"
```

O usando ADUC:
1. Right-click OU -> Delegate Control
2. Agregar grupo "G_SoporteTI"
3. Seleccionar: "Reset user passwords and force password change at next logon"
4. Seleccionar: "Modify the membership of a group"

### 9.3 AD ACLs

Cada ACE (Access Control Entry) en AD tiene:

- **Trustee:** A quién se aplica (usuario/grupo)
- **Access Control Type:** Allow / Deny
- **Permissions:** Lista de permisos específicos
- **Object Type:** Tipo de objeto al que aplica
- **Inherited Object Type:** Tipo de objeto hijo al que se hereda
- **Inheritance Flags:** Cómo se hereda

```powershell
# Agregar ACE custom a un objeto
$ou = "OU=Usuarios,DC=dominio,DC=com"
$group = New-Object System.Security.Principal.NTAccount("DOMINIO\G_SoporteTI")
$right = [System.DirectoryServices.ActiveDirectoryRights]"ResetPassword"
$type = [System.Security.AccessControl.AccessControlType]"Allow"
$inheritance = [System.DirectoryServices.ActiveDirectorySecurityInheritance]"Descendents"
$ace = New-Object System.DirectoryServices.ActiveDirectoryAccessRule `
    ($group, $right, $type, $inheritance)

$acl = Get-Acl "AD:$ou"
$acl.AddAccessRule($ace)
Set-Acl -Path "AD:$ou" -AclObject $acl
```

### 9.4 Inheritance

Por defecto, los objetos heredan permisos de sus contenedores padre.

```powershell
# Ver si un objeto tiene herencia habilitada
$obj = Get-Acl "AD:CN=Juan Perez,OU=Usuarios,DC=dominio,DC=com"
$obj.AreAccessRulesProtected  # True = herencia bloqueada

# Bloquear herencia (copiar permisos existentes)
$obj.SetAccessRuleProtection($true, $true)
Set-Acl -Path "AD:CN=Juan Perez,OU=Usuarios,DC=dominio,DC=com" -AclObject $obj
```

### 9.5 DSHeuristics

DSHeuristics es un atributo en `CN=Directory Service,CN=Windows NT,CN=Services,CN=Configuration,DC=dominio,DC=com` que controla el comportamiento de adminSDHolder.

```powershell
# Ver DSHeuristics actual
$ds = Get-ADObject "CN=Directory Service,CN=Windows NT,CN=Services,CN=Configuration,DC=dominio,DC=com"
$ds.dSHeuristics

# Modificar (muy avanzado, solo si sabés lo que hacés)
Set-ADObject -Identity "CN=Directory Service,CN=Windows NT,CN=Services,CN=Configuration,DC=dominio,DC=com" `
    -Replace @{dSHeuristics = "00000000010000000001"}
```

### 9.6 adminSDHolder

adminSDHolder protege cuentas privilegiadas de cambios de permisos accidentales o maliciosos.

**Cómo funciona:**
1. El [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) SDProp (Security Descriptor Propagator) corre cada 60 minutos
2. Compara los permisos de cuentas protegidas (Domain/RID Admins, Admins, etc.)
3. Si los permisos cambiaron, los restaura a los del objeto `adminSDHolder`
4. Esto previene que alguien delegue permisos a una OU y accidentalmente dé acceso a cuentas admin

```powershell
# Ver el objeto adminSDHolder
Get-ADObject "CN=AdminSDHolder,CN=System,DC=dominio,DC=com"

# Ver qué cuentas están protegidas
Get-ADUser -Filter {AdminCount -eq 1} -Properties AdminCount
```

---

## 10) Sites and Replication

### 10.1 Site Links

Los Site Links conectan sites y definen el costo y schedule de replicación.

```powershell
# Ver site links
Get-ADReplicationSiteLink -Filter *

# Crear site link
New-ADReplicationSiteLink -Name "BuenosAires-Mendoza" `
    -SitesIncluded "BuenosAires", "Mendoza" `
    -Cost 100 `
    -ReplicationFrequencyInMinutes 30  # replicación cada 30 min

# Ver costos y schedules
Get-ADReplicationSiteLink -Filter * | `
    Select Name, Cost, ReplicationFrequencyInMinutes, SitesIncluded
```

### 10.2 Bridgehead Servers

Bridgehead servers son los DCs designados para replicación entre sites.

```powershell
# Ver bridgeheads preferidos
Get-ADObject -Filter {ObjectClass -eq "site"} -Properties * | `
    Select Name, bridgeheadTransportList

# Configurar bridgehead preferido
# En AD Sites and Services:
# Servidor -> Properties -> "Preferred Bridgehead" -> IP
```

### 10.3 Replication Topology

La topología de replicación es el mapa de cómo se replican los datos entre DCs.

```powershell
# Ver topología de replicación
Get-ADReplicationConnection -Filter *

# Ver partners de replicación de un DC
Get-ADReplicationPartnerMetadata -Target "DC01.dominio.com"

# Forzar replicación entre dos DCs
Sync-ADObject -Source "DC01" -Destination "DC02"
Repadmin /syncall DC01 /e /d /q

# Ver estado de replicación
repadmin /replsummary
repadmin /showrepl
```

### 10.4 KCC (Knowledge Consistency Checker)

El KCC es un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) que corre automáticamente en cada DC para generar la topología de replicación.

```powershell
# Forzar KCC a recalcular topología
repadmin /kcc

# Ver si KCC está funcionando
repadmin /showrepl DC01 | findstr "KCC"

# El KCC garantiza:
# - Todos los DCs dentro de un site se replican entre sí (topología de anillo)
# - Por defecto, cada DC replica con al menos dos otros DCs
# - Si un DC falla, KCC ajusta la topología
```

### 10.5 ISTG (Inter-Site Topology Generator)

El ISTG es un DC designado (uno por forest) que genera la topología entre sites.

```powershell
# Ver cuál es el ISTG
repadmin /istg *

# El ISTG:
# - Decide qué bridgeheads usar entre sites
# - Crea conexiones de replicación entre sites
# - Se reevalúa si el bridgehead falla
# - Por defecto, es el DC con GUID más bajo
```

### 10.6 Change Notification

La notificación de cambios controla cuándo un DC notifica a otros sobre cambios.

```powershell
# Dentro de un site: notification es inmediata (casi)
# Entre sites: depende del schedule del site link

# Ver schedule del site link
Get-ADReplicationSiteLink -Identity "BuenosAires-Mendoza" | `
    Select-Object -ExpandProperty Schedule

# La replicación dentro del site:
# - Notificación ocurre en ~15 segundos
# - Si no hay cambios en 6 horas, se hace sync completo

# Forzar replicación inmediata con repadmin
repadmin /syncall /P /e /d /q
```

---

## 11) Domain Joins

### 11.1 Computer Account

Cuando una computadora se une al dominio, se crea un computer account object en [ad](../raw/w1nd0ws-d0m41n-4dm1n.md).

```powershell
# Unir computadora al dominio
Add-Computer -DomainName "dominio.com" -Credential DOMINIO\Administrador -Restart

# Crear computer account previamente (prestage)
New-ADComputer -Name "PC-NUEVA" -Path "OU=Equipos,DC=dominio,DC=com"

# Unir con cuenta prestageada
Add-Computer -DomainName "dominio.com" -Credential DOMINIO\Administrador
```

### 11.2 Secure Channel

Cada computadora unida al dominio tiene un secure channel con un DC. Este channel usa la contraseña del computer account.

```powershell
# Verificar secure channel
Test-ComputerSecureChannel -Repair  # repara si está roto

# Resetear secure channel (si está corrupto)
Reset-ComputerMachinePassword -Server DC01.dominio.com

# Ver desde el lado del DC
Get-ADComputer -Identity "PC-001" -Properties PasswordLastSet, PasswordExpired
```

### 11.3 Computer Object

El computer object tiene propiedades similares a un user object:

```powershell
# Propiedades del computer object
Get-ADComputer -Identity "PC-001" -Properties *

# Atributos clave:
# - OperatingSystem: Windows 10 Enterprise
# - OperatingSystemVersion: 10.0.19044
# - dNSHostName: PC-001.dominio.com
# - LastLogonDate: última vez que el equipo se logueó
# - IPv4Address: IP actual (si se registra dinámicamente)
# - ManagedBy: quién administra este equipo
# - userAccountControl: flags de la cuenta de computadora

# Computer account password rotation:
# - Windows 2000: cada 7 días
# - Windows 2008+: cada 30 días
```

### 11.4 Managed vs Unmanaged

**Managed computers:** administradas centralmente vía [gpo](../raw/w1nd0ws-d0m41n-4dm1n.md#group-policy), SCCM, Intune, etc.
**Unmanaged computers:** miembros del dominio pero sin administración central

```powershell
# Marcar computadora como managed
Set-ADComputer -Identity "PC-001" -ManagedBy "CN=Juan Perez,OU=Usuarios,DC=dominio,DC=com"

# Encontrar computadoras managed vs unmanaged
Get-ADComputer -Filter {ManagedBy -like "*"}  # managed
Get-ADComputer -Filter {ManagedBy -notlike "*"}  # unmanaged

# Servers managed por equipo de sistemas
Get-ADComputer -Filter {OperatingSystem -like "*Server*" -and ManagedBy -like "*Sistemas*"}
```

### 11.5 Interaction with Domain

Las computadoras unidas al dominio interactúan con AD de varias formas:

1. **Logon:** El cliente busca un DC vía [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) SRV record
2. **Authentication:** Kerberos (recomendado) o NTLM
3. **GPO:** Se descargan políticas de `\\dominio.com\SYSVOL`
4. **Certificate enrollment:** Si hay PKI
5. **Software deployment:** GPO software installation
6. **DNS registration:** La computadora registra su A/AAAA record
7. **Time sync:** Con el PDC Emulator (W32Time)

```powershell
# Ver DC con el que se autentica la computadora
nltest /dsgetdc:dominio.com

# Ver site de la computadora
nltest /dsgetsite

# Ver trusts
nltest /trusted_domains

# Ver secure channel
nltest /sc_query:dominio.com
```

---

## 12) [active directory](../raw/w1nd0ws-d0m41n-4dm1n.md) desde [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)

### 12.1 Módulo [ad](../raw/w1nd0ws-d0m41n-4dm1n.md)

El módulo ActiveDirectory se puede instalar en máquinas que no son DC:

```powershell
# En Windows 10/11:
# Settings -> Apps -> Manage Optional Features -> RSAT: Active Directory Domain Services and Lightweight Directory Services Tools

# O por PowerShell:
Add-WindowsCapability -Name Rsat.ActiveDirectory.DS-LDS.Tools~~~~0.0.1.0 -Online

# Verificar instalación
Get-Module -Name ActiveDirectory -ListAvailable

# Importar (si no se auto-importa)
Import-Module ActiveDirectory
```

### 12.2 [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) básico

```powershell
# Crear usuarios desde un CSV
$usuarios = Import-Csv -Path "C:\importar_usuarios.csv"

foreach ($user in $usuarios) {
    $upn = "$($user.username)@dominio.com"
    $pass = ConvertTo-SecureString "TempPass123!" -AsPlainText -Force

    New-ADUser -Name "$($user.nombre) $($user.apellido)" `
        -SamAccountName $user.username `
        -UserPrincipalName $upn `
        -GivenName $user.nombre `
        -Surname $user.apellido `
        -Department $user.departamento `
        -Title $user.puesto `
        -Path "OU=$($user.departamento),OU=Usuarios,DC=dominio,DC=com" `
        -AccountPassword $pass `
        -Enabled $true `
        -ChangePasswordAtLogon $true

    Write-Host "Creado: $upn"
}

# Reporte de usuarios
Get-ADUser -Filter * -Properties Department, Title, LastLogonDate, Enabled, PasswordLastSet | `
    Select-Object Name, SamAccountName, Department, Title, `
        @{N="LastLogon";E={[datetime]::FromFileTime($_.LastLogonDate)}}, `
        Enabled, PasswordLastSet | `
    Export-Csv -Path "reporte_usuarios.csv" -NoTypeInformation

# Deshabilitar cuentas inactivas (90+ días sin login)
$corte = (Get-Date).AddDays(-90)
$inactivos = Get-ADUser -Filter {LastLogonDate -lt $corte -and Enabled -eq $true} -Properties LastLogonDate

foreach ($user in $inactivos) {
    Disable-ADAccount -Identity $user.SamAccountName
    Write-Host "Deshabilitado: $($user.SamAccountName) - Ultimo login: $($user.LastLogonDate)"
}
```

### 12.3 Reportes y auditoría

```powershell
# Reporte de grupos y miembros
Get-ADGroup -Filter * -Properties Description | ForEach-Object {
    $group = $_
    $members = Get-ADGroupMember -Identity $group.DistinguishedName | Where-Object {
        $_.objectClass -eq "user"
    }
    [PSCustomObject]@{
        GroupName = $group.Name
        Description = $group.Description
        MemberCount = $members.Count
        Members = ($members.Name -join "; ")
    }
} | Export-Csv -Path "reporte_grupos.csv -NoTypeInformation

# Audit de cambios en AD
# Habilitar advanced audit policy:
# GPO: Computer Config -> Policies -> Windows Settings -> Security Settings
# -> Advanced Audit Policy -> DS Access -> Audit Directory Service Changes

# Ver eventos en Event Viewer:
# Windows Logs -> Security -> Event ID 5136 (modified)
# Event ID 5137 (created), 5141 (deleted)

# Buscar cambios recientes desde PowerShell
Get-WinEvent -LogName Security -FilterXPath "*[System[EventID=5136]]" -MaxEvents 50 | `
    Format-Table TimeCreated, Id, LevelDisplayName -AutoSize
```

---

## 13) Seguridad en [ad](../raw/w1nd0ws-d0m41n-4dm1n.md)

### 13.1 Account Policies

La password policy del domain se configura desde [gpo](../raw/w1nd0ws-d0m41n-4dm1n.md#group-policy) o con [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell):

```powershell
# Ver política actual
Get-ADDefaultDomainPasswordPolicy

# Modificar
Set-ADDefaultDomainPasswordPolicy -Identity "dominio.com" `
    -ComplexityEnabled $true `
    -MinPasswordLength 14 `
    -MaxPasswordAge 90.00:00:00 `
    -LockoutThreshold 5 `
    -LockoutDuration 00:15:00 `
    -ReversibleEncryptionEnabled $false
```

**Fine-Grained Password Policies (FGPP)** desde Windows Server 2008 permiten diferentes políticas para diferentes grupos:

```powershell
# Crear FGPP para administradores
New-ADFineGrainedPasswordPolicy -Name "AdminPolicy" `
    -Precedence 10 `
    -MinPasswordLength 16 `
    -MaxPasswordAge 60.00:00:00 `
    -LockoutThreshold 3 `
    -LockoutDuration 00:30:00 `
    -ComplexityEnabled $true

# Aplicar la FGPP a un grupo
Add-ADFineGrainedPasswordPolicySubject -Identity "AdminPolicy" `
    -Subjects "Domain Admins", "Enterprise Admins"
```

### 13.2 Kerberos Hardening

```powershell
# Configurar Kerberos hardening
# GPO: Computer Config -> Policies -> Windows Settings -> Security Settings
# -> Account Policies -> Kerberos Policy

# Enforce user logon restrictions -> Enabled
# Maximum lifetime for service ticket -> 600 minutos (10h, default)
# Maximum lifetime for user ticket -> 10 horas
# Maximum lifetime for user ticket renewal -> 7 días
# Maximum tolerance for computer clock synchronization -> 5 minutos

# Configuración recomendada para hardening:
Set-ADObject -Identity "CN=Kerberos Policies,CN=Policies,CN=System,DC=dominio,DC=com" `
    -Replace @{
        "msDS-MaximumRegistrationLifetime" = "600"
        "msDS-MinimumRegistrationLifetime" = "10"
    }
```

### 13.3 LAPS (Local Admin Password Solution)

LAPS administra la contraseña del administrador local en cada computadora unida al dominio. Cada equipo tiene una contraseña única almacenada en AD.

```powershell
# Instalar LAPS (descargar de Microsoft, instalar en DCs y equipos)

# Extender schema AD para LAPS
Update-AdmPwdADSchema

# Delegar permisos para LAPS
Set-AdmPwdComputerSelfPermission -OrgUnit "OU=Equipos,DC=dominio,DC=com"

# Ver contraseña de una computadora
Get-AdmPwdPassword -ComputerName "PC-001"

# O desde ADUC:
# Computadora -> Properties -> Attribute Editor
# ms-Mcs-AdmPwd (si tenés permisos)
```

### 13.4 Delegated Authentication

```powershell
# Configurar Kerberos Constrained Delegation (KCD)
# Permite que un servicio actúe en nombre de un usuario

# Configurar delegación no restringida (unconstrained)
Set-ADComputer -Identity "SERVIDOR01" -TrustedForDelegation $true

# Configurar delegación restringida (constrained) - recomendado
Set-ADUser -Identity "CUENTA_SERVICIO" -PrincipalsAllowedToDelegateToAccount `
    (Get-ADComputer "SQL01"), (Get-ADComputer "SQL02")

# Delegación basada en recursos (Resource-based KCD) - Windows 2012+
# Se configura en el recurso, no en la cuenta de servicio
Set-ADComputer -Identity "SQL01" -PrincipalsAllowedToDelegateToAccount `
    (Get-ADComputer "WEBSERVER")
```

---

## 14) Ejercicios Prácticos

### 14.1 Ejercicio 1: Crear una OU structure

Creá la siguiente estructura de OUs en un dominio de laboratorio:

```
DC=dominio,DC=com
├── OU=Empresa
│   ├── OU=Usuarios
│   │   ├── OU=Activos
│   │   └── OU=Inactivos
│   ├── OU=Computadoras
│   │   ├── OU=Workstations
│   │   └── OU=Servidores
│   ├── OU=Grupos
│   │   ├── OU=Seguridad
│   │   └── OU=Distribucion
│   └── OU=Recursos
│       ├── OU=Impresoras
│       └── OU=Shares
```

<details>
<summary>Ver solución</summary>

```powershell
Import-Module ActiveDirectory

$root = "DC=dominio,DC=com"

# Empresa
New-ADOrganizationalUnit -Name "Empresa" -Path $root

# Usuarios
New-ADOrganizationalUnit -Name "Usuarios" -Path "OU=Empresa,$root"
New-ADOrganizationalUnit -Name "Activos" -Path "OU=Usuarios,OU=Empresa,$root"
New-ADOrganizationalUnit -Name "Inactivos" -Path "OU=Usuarios,OU=Empresa,$root"

# Computadoras
New-ADOrganizationalUnit -Name "Computadoras" -Path "OU=Empresa,$root"
New-ADOrganizationalUnit -Name "Workstations" -Path "OU=Computadoras,OU=Empresa,$root"
New-ADOrganizationalUnit -Name "Servidores" -Path "OU=Computadoras,OU=Empresa,$root"

# Grupos
New-ADOrganizationalUnit -Name "Grupos" -Path "OU=Empresa,$root"
New-ADOrganizationalUnit -Name "Seguridad" -Path "OU=Grupos,OU=Empresa,$root"
New-ADOrganizationalUnit -Name "Distribucion" -Path "OU=Grupos,OU=Empresa,$root"

# Recursos
New-ADOrganizationalUnit -Name "Recursos" -Path "OU=Empresa,$root"
New-ADOrganizationalUnit -Name "Impresoras" -Path "OU=Recursos,OU=Empresa,$root"
New-ADOrganizationalUnit -Name "Shares" -Path "OU=Recursos,OU=Empresa,$root"
```
</details>

### 14.2 Ejercicio 2: Delegar control en una OU

Delegá el control de la OU "Usuarios\Activos" al grupo "SoporteTI" para:
1. Resetear passwords
2. Forzar cambio de password en próximo login
3. Habilitar/deshabilitar cuentas
4. Modificar propiedades de contacto (teléfono, dirección)
5. Desbloquear cuentas

<details>
<summary>Ver solución</summary>

Método 1: Delegation Wizard en ADUC
1. Right-click "Activos" OU -> Delegate Control
2. Add -> "SoporteTI"
3. Tasks to Delegate:
   - ✅ "Reset user passwords and force password change at next logon"
   - ✅ "Read all user information"
   - "Create a custom task to delegate" -> Only user objects -> 
     - ✅ "Write phone and mail options"
     - ✅ "Enable/disable account"
     - ✅ "Unlock account"

Método 2: [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)
```powershell
$ou = "OU=Activos,OU=Usuarios,OU=Empresa,DC=dominio,DC=com"
$group = New-Object System.Security.Principal.NTAccount("DOMINIO\SoporteTI")

# Resetear password
$ace1 = New-Object System.DirectoryServices.ActiveDirectoryAccessRule `
    ($group, "ResetPassword", "Allow", "Descendents", [Guid]"bf967aba-0de6-11d0-a285-00aa003049e2")

$ace2 = New-Object System.DirectoryServices.ActiveDirectoryAccessRule `
    ($group, "WriteProperty", "Allow", [Guid]"bf967a19-0de6-11d0-a285-00aa003049e2", "Descendents", [Guid]"bf967aba-0de6-11d0-a285-00aa003049e2")

$ace3 = New-Object System.DirectoryServices.ActiveDirectoryAccessRule `
    ($group, "WriteProperty", "Allow", [Guid]"bf967a37-0de6-11d0-a285-00aa003049e2", "Descendents", [Guid]"bf967aba-0de6-11d0-a285-00aa003049e2")

$acl = Get-Acl "AD:$ou"
$acl.AddAccessRule($ace1)
$acl.AddAccessRule($ace2)
$acl.AddAccessRule($ace3)
Set-Acl -Path "AD:$ou" -AclObject $acl
```
</details>

### 14.3 Ejercicio 3: Crear un [gpo](../raw/w1nd0ws-d0m41n-4dm1n.md#group-policy) y filtrarlo con [wmi](../raw/w1n-s9bsyst3ms.md#wmi)

1. Creá un GPO que mida 30 minutos de idle time antes de bloquear la pantalla
2. Aplicá solo a equipos Windows 10 Enterprise
3. Aplicá solo a equipos en el site "BuenosAires"

<details>
<summary>Ver solución</summary>

```powershell
# 1. Crear GPO
$gpo = New-GPO -Name "ScreenSaver_Policy" -Comment "Bloqueo de pantalla por idle"

# 2. Configurar políticas de screen saver
Set-GPRegistryValue -Name "ScreenSaver_Policy" `
    -Key "HKCU\Software\Policies\Microsoft\Windows\Control Panel\Desktop" `
    -ValueName "ScreenSaveActive" -Type String -Value "1"

Set-GPRegistryValue -Name "ScreenSaver_Policy" `
    -Key "HKCU\Software\Policies\Microsoft\Windows\Control Panel\Desktop" `
    -ValueName "ScreenSaverIsSecure" -Type String -Value "1"

Set-GPRegistryValue -Name "ScreenSaver_Policy" `
    -Key "HKCU\Software\Policies\Microsoft\Windows\Control Panel\Desktop" `
    -ValueName "ScreenSaveTimeOut" -Type String -Value "1800"

# 3. Crear WMI Filter
$wmiQuery = @"
SELECT * FROM Win32_OperatingSystem
WHERE Version LIKE "10.%" AND ProductType = "1"
"@

$wmiFilter = New-GPWMIFilter -Name "Windows 10 Workstations" `
    -Description "Solo aplica a Windows 10/11 workstations" `
    -PolicyType User `
    -QueryList @(New-GPWMIQuery -Query $wmiQuery -Namespace "root\cimv2")

# 4. Asociar WMI filter al GPO
Set-GPWMIFilterLink -GPO "ScreenSaver_Policy" -WMIFilter "Windows 10 Workstations"

# 5. Vincular GPO a la OU (depende de tu estructura)
New-GPLink -Name "ScreenSaver_Policy" `
    -Target "OU=Equipos,DC=dominio,DC=com" `
    -LinkEnabled Yes

# 6. (Opcional) Configurar Item-Level Targeting para site
# En GPMC -> GPO -> User Config -> Preferences -> Control Panel Settings -> Power Options
# New -> Power Scheme (targeting via site no es directo en GPO, usa Security Filtering)
```
</details>

### 14.4 Ejercicio 4: Configurar DFS Namespace

Creá un DFS namespace `\\dominio.com\Compartido` que incluya:
- `\\SrvArchivos01\Publico` -> `\\dominio.com\Compartido\Publico`
- `\\SrvArchivos02\Departamentos` -> `\\dominio.com\Compartido\Departamentos`
- Configurá failover con targets múltiples (misma carpeta en dos servidores)

<details>
<summary>Ver solución</summary>

```powershell
# Instalar DFS (si no está instalado)
Install-WindowsFeature -Name FS-DFS-Namespace, FS-DFS-Replication

# Crear namespace de dominio
New-DfsnRoot -Path "\\dominio.com\Compartido" `
    -TargetPath "\\SrvArchivos01\Publico" `
    -Type DomainV2 `
    -Description "Namespace compartido empresarial"

# Agregar carpetas con targets
New-DfsnFolder -Path "\\dominio.com\Compartido\Publico" `
    -TargetPath "\\SrvArchivos01\Publico" `
    -Description "Archivos públicos"

# Agregar folder con múltiples targets (failover)
New-DfsnFolder -Path "\\dominio.com\Compartido\Departamentos" `
    -TargetPath "\\SrvArchivos02\Departamentos" `
    -Description "Carpetas departamentales"

# Agregar segundo target para failover
New-DfsnFolderTarget -Path "\\dominio.com\Compartido\Departamentos" `
    -TargetPath "\\SrvArchivos03\Departamentos" `
    -ReferralPriorityClass "SiteCostNormal"

# Configurar orden de referidos
Set-DfsnFolderTarget -Path "\\dominio.com\Compartido\Departamentos" `
    -TargetPath "\\SrvArchivos02\Departamentos" `
    -ReferralPriorityClass "SiteCostNormal" `
    -ReferralPriorityRank 1

Set-DfsnFolderTarget -Path "\\dominio.com\Compartido\Departamentos" `
    -TargetPath "\\SrvArchivos03\Departamentos" `
    -ReferralPriorityClass "SiteCostNormal" `
    -ReferralPriorityRank 2

# Ver namespace
Get-DfsnRoot -Path "\\dominio.com\Compartido"
Get-DfsnFolder -Path "\\dominio.com\Compartido\Departamentos"
```
</details>

### 14.5 Ejercicio 5: Script de creación masiva de usuarios

Creá un script que:
1. Lea un CSV con campos: nombre, apellido, username, departamento, puesto
2. Genere el UPN automáticamente
3. Asigne una contraseña temporal
4. Cree el usuario en la OU correspondiente por departamento
5. Mueva el usuario al grupo correspondiente
6. Genere un reporte de creación

<details>
<summary>Ver solución</summary>

```powershell
param(
    [Parameter(Mandatory=$true)]
    [string]$CsvPath,
    [string]$Domain = "dominio.com",
    [string]$BaseOU = "OU=Usuarios,OU=Empresa"
)

Import-Module ActiveDirectory

$usuarios = Import-Csv -Path $CsvPath
$reporte = @()
$errores = @()
$defaultPass = "Cambiar123!"
$securePass = ConvertTo-SecureString $defaultPass -AsPlainText -Force

foreach ($user in $usuarios) {
    try {
        $sam = $user.username
        $upn = "$sam@$Domain"
        $name = "$($user.nombre) $($user.apellido)"
        $depOU = "OU=$($user.departamento),$BaseOU,$(('DC=' + $Domain -replace '\.', ',DC='))"

        # Verificar si OU del departamento existe, si no, crearla
        try {
            Get-ADOrganizationalUnit -Identity $depOU | Out-Null
        } catch {
            New-ADOrganizationalUnit -Name $user.departamento -Path "$BaseOU,$(('DC=' + $Domain -replace '\.', ',DC='))"
        }

        # Crear usuario
        New-ADUser -Name $name `
            -SamAccountName $sam `
            -UserPrincipalName $upn `
            -GivenName $user.nombre `
            -Surname $user.apellido `
            -Department $user.departamento `
            -Title $user.puesto `
            -Path $depOU `
            -AccountPassword $securePass `
            -Enabled $true `
            -ChangePasswordAtLogon $true `
            -PasswordNeverExpires $false

        # Agregar a grupo
        $grupo = "G_$($user.departamento)"
        try {
            Add-ADGroupMember -Identity $grupo -Members $sam -ErrorAction Stop
        } catch {
            Write-Warning "Grupo $grupo no encontrado, creando..."
            New-ADGroup -Name $grupo -GroupScope Global -Path "OU=Grupos,$BaseOU,$(('DC=' + $Domain -replace '\.', ',DC='))"
            Add-ADGroupMember -Identity $grupo -Members $sam
        }

        $reporte += [PSCustomObject]@{
            Username = $sam
            Nombre = $name
            UPN = $upn
            Departamento = $user.departamento
            Estado = "Creado"
        }

        Write-Host "OK: $upn" -ForegroundColor Green
    } catch {
        $errores += [PSCustomObject]@{
            Username = $user.username
            Error = $_.Exception.Message
        }
        Write-Host "ERROR: $($user.username) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Reportes
$reporte | Export-Csv -Path "reporte_creacion.csv" -NoTypeInformation
$errores | Export-Csv -Path "reporte_errores.csv" -NoTypeInformation

Write-Host "`nResumen:" -ForegroundColor Cyan
Write-Host "  Creados: $($reporte.Count)" -ForegroundColor Green
Write-Host "  Errores: $($errores.Count)" -ForegroundColor Red
```
</details>

### 14.6 Ejercicio 6: Auditar [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) de [ad](../raw/w1nd0ws-d0m41n-4dm1n.md)

Generá un reporte de todos los permisos delegados en una OU específica, identificando:
- Usuarios/grupos con permisos especiales
- Tipo de permiso (Read, Write, Reset Password, etc.)
- Si el permiso es heredado o directo

<details>
<summary>Ver solución</summary>

```powershell
param(
    [string]$TargetOU = "OU=Usuarios,OU=Empresa,DC=dominio,DC=com"
)

Import-Module ActiveDirectory

function Get-ADPermissions {
    param([string]$DN)
    
    $acl = Get-Acl -Path "AD:$DN"
    $resultados = @()
    
    foreach ($ace in $acl.Access) {
        if ($ace.IsInherited -eq $false) {  # Solo permisos directos
            $resultados += [PSCustomObject]@{
                Objeto = $DN
                Trustee = $ace.IdentityReference
                Tipo = $ace.AccessControlType
                Permisos = $ace.ActiveDirectoryRights
                Herencia = if ($ace.IsInherited) { "Heredado" } else { "Directo" }
            }
        }
    }
    
    return $resultados
}

# Obtener OU target y objetos hijos
Write-Host "Auditando: $TargetOU" -ForegroundColor Cyan

$ou = Get-ADOrganizationalUnit -Identity $TargetOU
$permisos = @()

# Permisos de la OU
$permisos += Get-ADPermissions -DN $TargetOU

# Permisos de sub-OUs
Get-ADOrganizationalUnit -Filter * -SearchBase $TargetOU -SearchScope OneLevel | ForEach-Object {
    $permisos += Get-ADPermissions -DN $_.DistinguishedName
}

# Permisos de objetos (users)
Get-ADUser -Filter * -SearchBase $TargetOU | ForEach-Object {
    $permisos += Get-ADPermissions -DN $_.DistinguishedName | Select-Object -First 3
}

# Reporte
$permisos | Export-Csv -Path "auditoria_permisos_AD.csv" -NoTypeInformation
$permisos | Format-Table -AutoSize -Wrap

Write-Host "Reporte exportado: auditoria_permisos_AD.csv" -ForegroundColor Green
```
</details>

### 14.7 Ejercicio 7: Configurar Kerberos delegation

Configurá delegación restringida (KCD) para que un servidor web pueda autenticarse en un servidor SQL en nombre del usuario.

<details>
<summary>Ver solución</summary>

```powershell
# Escenario:
# WEB01 (IIS) necesita conectarse a SQL01 (MSSQL) como el usuario autenticado
# WEB01 no debe poder delegar a otros servicios
# Esto es Kerberos Constrained Delegation

# Requisitos previos:
# 1. Todos los servidores deben estar en el dominio
# 2. SPN deben estar registrados

# Registrar SPN para SQL (si no existe)
setspn -S MSSQLSvc/SQL01.dominio.com:1433 DOMINIO\sql_service_account

# Configurar delegación restringida en la cuenta del servidor web
# Windows Server 2012+: Resource-based KCD (recomendado)
Set-ADComputer -Identity "SQL01" -PrincipalsAllowedToDelegateToAccount `
    (Get-ADComputer "WEB01")

# O método legacy (Windows 2008):
Set-ADComputer -Identity "WEB01" -PrincipalsAllowedToDelegateToAccount `
    (Get-ADComputer "SQL01")

# Verificar configuración
Get-ADComputer -Identity "WEB01" -Properties PrincipalsAllowedToDelegateToAccount
Get-ADComputer -Identity "SQL01" -Properties PrincipalsAllowedToDelegateToAccount

# Probar con PowerShell remoto:
# En WEB01 (como usuario autenticado):
# $cred = Get-Credential
# Invoke-Command -ComputerName SQL01 -Credential $cred -ScriptBlock { whoami }
```
</details>

### 14.8 Ejercicio 8: Migración de FSMO roles

Simulá la migración de los FSMO roles del DC01 al DC02, incluyendo:
- Transferencia graceful de todos los roles
- Verificación post-migración
- Procedimiento de seize (forzado) de un rol si el DC original no responde

<details>
<summary>Ver solución</summary>

```powershell
# --- Transferencia graceful (DC original está online) ---
# 1. Verificar roles actuales
Write-Host "=== Roles Actuales ===" -ForegroundColor Cyan
netdom query fsmo

# 2. Transferir schema master (forest level)
Move-ADDirectoryServerOperationMasterRole -Identity "DC02" `
    -OperationMasterRole SchemaMaster `
    -Confirm:$false

# 3. Transferir domain naming master (forest level)
Move-ADDirectoryServerOperationMasterRole -Identity "DC02" `
    -OperationMasterRole DomainNamingMaster `
    -Confirm:$false

# 4. Transferir PDC emulator
Move-ADDirectoryServerOperationMasterRole -Identity "DC02" `
    -OperationMasterRole PDCEmulator `
    -Confirm:$false

# 5. Transferir RID master
Move-ADDirectoryServerOperationMasterRole -Identity "DC02" `
    -OperationMasterRole RIDMaster `
    -Confirm:$false

# 6. Transferir infrastructure master
Move-ADDirectoryServerOperationMasterRole -Identity "DC02" `
    -OperationMasterRole InfrastructureMaster `
    -Confirm:$false

# 7. Verificar post-migración
Write-Host "`n=== Roles Post-Migración ===" -ForegroundColor Cyan
netdom query fsmo
Get-ADForest | Format-Table SchemaMaster, DomainNamingMaster
Get-ADDomain | Format-Table PDCEmulator, RIDMaster, InfrastructureMaster

# --- Seize forzado (DC01 no responde) ---
Write-Host "`n=== Seize de roles ===" -ForegroundColor Yellow
# Solo usar si DC01 no va a volver NUNCA MÁS
# El seize fuerza la transferencia sin acuerdo del otro DC

# Move-ADDirectoryServerOperationMasterRole -Identity "DC02" `
#     -OperationMasterRole PDCEmulator,RIDMaster,InfrastructureMaster `
#     -Force -Confirm:$false

# Después de seize, demoler DC01:
# Demote el server viejo (si sigue vivo, forzar demotion)
# Clean up metadata de AD si no se puede demote
# ntdsutil -> metadata cleanup -> remove selected server DC01
```
</details>

---

## 15) Referencias

- **Microsoft Docs - [active directory](../raw/w1nd0ws-d0m41n-4dm1n.md) Domain Services:** [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://learn.microsoft.[com](../raw/w1n-s9bsyst3ms.md#com)/en-us/windows-server/identity/[ad](../raw/w1nd0ws-d0m41n-4dm1n.md)-ds/get-started/virtual-dc/active-directory-domain-services-overview
- **Microsoft Learn - [group policy](../raw/w1nd0ws-d0m41n-4dm1n.md#group-policy):** https://learn.microsoft.com/en-us/previous-versions/windows/desktop/policy/group-policy-start-page
- **Microsoft Learn - DFS:** https://learn.microsoft.com/en-us/windows-server/storage/dfs/dfs-overview
- **Microsoft Learn - [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) in AD DS:** https://learn.microsoft.com/en-us/windows-server/networking/[dns](../raw/r3d3s-f0nd4m3nt0s.md#dns)/[dns](../raw/r3d3s-f0nd4m3nt0s.md#dns)-top
- **Kerberos Explained:** https://learn.microsoft.com/en-us/windows-server/security/kerberos/kerberos-authentication-overview
- **FSMO Roles:** https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/planning-flexible-single-master-operation-placement
- **LAPS:** https://learn.microsoft.com/en-us/windows-server/identity/laps/laps-overview
- **Best Practices for Securing AD:** https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/best-practices-for-securing-active-directory
- **[powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) ActiveDirectory Module:** https://learn.microsoft.com/en-us/[powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)/module/activedirectory/
- **AGDLP/AGUDLP Model:** https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/understand-security-groups
- **adminSDHolder:** https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/security-best-practices/appendix-c--protected-accounts-and-groups-in-active-directory
- **Repadmin Tool:** https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/repadmin
- **nltest Tool:** https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nltest

---
*Fin del tutorial w1nd0ws-d0m41n-4dm1n.md*


