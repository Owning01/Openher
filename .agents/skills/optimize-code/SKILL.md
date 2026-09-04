---
name: optimize-code
description: General-purpose code optimization for any language. Audits and fixes performance issues across algorithms, data structures, I/O, memory, concurrency, databases, networking, caching, and build pipelines. Use when asked to "optimize", "improve performance", "make it faster", "reduce latency", or "refactor for speed".
metadata:
  model: models/gemini-3.1-pro-preview
  last_modified: Sat, 20 Jun 2026 16:30:00 GMT
---

# Code Optimization (General Purpose)

## Usage Rules & Execution Priority

1.  **ENVIRONMENT TRIAGE**: Before auditing, instantly identify the language, framework, and execution environment. Suppress checklists that are physically impossible or idiomatic anti-patterns for that environment (e.g., do not suggest manual memory management in JavaScript, or async/await in pure standard C).
2.  **MACRO OVER MICRO**: Always prioritize Macro-optimizations (Algorithm complexity, I/O bottlenecks, N+1 queries) over Micro-optimizations (Loop unrolling, bit-shifting, inlining) unless explicitly told that macro-architecture is locked.
3.  **CONTEXTUAL PRUNING**: Do not display the entire checklist. Only reason about and output sections relevant to the user's snippet.

---

## 1. Algorithms & Data Structures

### 1.1 Time complexity
- Identify O(n²) or worse loops and reduce them
- Nested loops over the same data → hash maps or sets for O(1) lookups
- Sorting: avoid custom comparators that recompute values each comparison (precompute once)
- Two-pointer and sliding window techniques over brute force

### 1.2 Data structure selection
- Hash map / set for lookups instead of linear search
- Priority queue / heap for top-k or scheduling problems
- Stack / queue for sequential processing (avoid repeated list operations)
- Tree / trie for prefix searches and range queries
- Bloom filter for probabilistic membership checks (memory-constrained)

### 1.3 Space complexity
- Mutate in-place instead of creating copies
- Stream / lazy evaluation over loading everything into memory
- Bit manipulation over boolean arrays (flagsets)
- Reuse buffers instead of allocating per iteration

### 1.4 Recursion
- Tail recursion optimization where supported
- Convert deep recursion to iterative (stack overflow prevention)
- Memoization for overlapping subproblems (DP)

---

## 2. I/O Optimization

### 2.1 File I/O
- Buffered reads/writes instead of byte-by-byte
- Memory-map files for random access patterns (mmap)
- Batch writes instead of per-record flushing
- Use binary formats over text when parsing overhead is high
- Asynchronous / non-blocking I/O for concurrent operations

### 2.2 Serialization
- Binary serialization (protobuf, msgpack, bson) over JSON/XML for large payloads
- Zero-copy deserialization (flatbuffers, cap'n proto)
- Schema-aware parsing over generic DOM parsing (e.g., SAX over DOM for XML)

### 2.3 Compression
- Compress large payloads before network transfer or disk write
- Choose codec by use case: gzip (speed), zstd (ratio), lz4 (ultra-fast)
- Pre-compress static assets at build time

---

## 3. Memory Management

### 3.1 Allocation
- Pool / reuse objects instead of allocating in hot paths
- Arena allocators for sequential short-lived objects
- Stack allocation over heap where possible
- Avoid boxing/unboxing of primitives in hot paths

### 3.2 Leaks
- Unregister event listeners / callbacks on teardown
- Clear circular references (use WeakRef / weak pointers)
- Close file handles, network sockets, database connections
- Limit closure captures that keep large objects alive

### 3.3 Cache locality
- Arrays of structs (AoS) → structs of arrays (SoA) for hot loops
- Contiguous memory (vectors, arrays) over linked structures
- Align data structures to cache line boundaries
- Prefetch hints for predictable access patterns

### 3.4 Garbage collection
- Reduce allocation rate in hot paths (fewer GC pauses)
- Pool / reuse objects to avoid GC pressure
- Tune GC parameters (heap size, generational thresholds)
- Use value types / structs over reference types for small data

---

## 4. Concurrency & Parallelism

### 4.1 Multi-threading
- Thread pool over creating threads per task
- Work-stealing schedulers for load balancing
- Lock-free data structures (atomic operations) over mutex
- Read-write locks for read-heavy workloads
- Sharding / partitioning to reduce contention

### 4.2 Async / non-blocking
- Event loop / async-await over blocking threads (I/O-bound workloads)
- Coroutines / fibers for cooperative multitasking
- Batch async operations with fan-out (Promise.all, WaitGroup)
- Backpressure and flow control to prevent resource exhaustion

### 4.3 Synchronization
- Minimize critical section size
- Lock-free / wait-free algorithms for high-contention paths
- Optimistic concurrency (retry on conflict) over pessimistic locking
- Reduce false sharing by padding hot fields to cache line boundaries

### 4.4 Parallel patterns
- Map-reduce for data-parallel workloads
- Pipeline / producer-consumer for stream processing
- Fork-join for divide-and-conquer algorithms
- Actor model for isolated mutable state

---

## 5. Database Optimization

### 5.1 Query optimization
- Index columns used in WHERE, JOIN, ORDER BY, GROUP BY
- Composite indexes for multi-column queries (column order matters)
- Covering indexes to avoid table lookups
- Avoid SELECT * — fetch only needed columns
- Use EXPLAIN / query plan analysis to find bottlenecks

### 5.2 Connection management
- Connection pooling (avoid open/close per request)
- Batch inserts/updates in transactions
- Read replicas for read-heavy workloads
- Connection timeout and retry with backoff

### 5.3 Schema design
- Denormalization for read-heavy workloads (fewer joins)
- Partitioning / sharding for large tables
- Materialized views for expensive aggregations
- Avoid N+1 queries — use JOIN or batch loading

### 5.4 Caching
- Query result cache (Redis, Memcached)
- Application-level cache with TTL and invalidation
- Database buffer pool tuning
- Prepared statement caching

---

## 6. Network Optimization

### 6.1 Protocol
- HTTP/2 multiplexing over HTTP/1.1 pipelining
- gRPC / protocol buffers over REST+JSON for internal services
- Keep-alive / connection reuse instead of per-request connections
- Compression (gzip, brotli) for responses
- Binary protocols over text for high-throughput paths

### 6.2 Latency
- CDN for static assets and edge caching
- Connection pooling and pre-warming
- DNS caching and pre-resolution
- TCP tuning (window size, congestion control)
- Batching requests instead of individual calls

### 6.3 Payload
- Pagination over unbounded result sets
- Field selection / sparse fieldsets
- Incremental / delta updates instead of full payloads
- Server-sent events (SSE) or WebSockets over polling

---

## 7. Caching Strategies

### 7.1 Layers
- Browser / client cache (Cache-Control headers, ETags)
- CDN cache (edge caching)
- Reverse proxy cache (Varnish, Nginx)
- Application cache (in-memory, Redis)
- Database query cache

### 7.2 Policies
- LRU (Least Recently Used) for general-purpose
- LFU (Least Frequently Used) for skewed access patterns
- TTL-based expiration for time-sensitive data
- Write-through vs write-behind (lazy write)
- Cache invalidation: event-driven over time-based

### 7.3 Prefetching
- Pre-load data likely to be requested soon
- Speculative execution for predictable paths
- Warm caches on deployment (avoid cold start)

---

## 8. Code Quality & Maintainability (Performance-Related)

### 8.1 Hot paths
- Profile first, optimize second (never guess)
- Identify 80/20 bottlenecks (Pareto principle)
- Inline small hot functions (compiler hints: `inline`, `@pragma`)
- Branch prediction: most likely branch first

### 8.2 Conditionals
- Reduce branching in hot paths (lookup tables, branchless programming)
- Simplify boolean expressions (early returns, guard clauses)
- Switch over if-else chains for multi-way branches (compiler optimizes better)

### 8.3 Loop optimizations
- Loop unrolling for small fixed-size loops
- Hoist invariant calculations outside loops
- Strength reduction (multiply → shift, divide → multiply by reciprocal)
- Vectorization hints (SIMD annotations)

### 8.4 Avoid premature optimization
- Do not optimize cold paths — measure first
- Keep code readable unless the hot path proves it needs tuning
- Document why an optimization exists (avoid future refactor that removes it)

---

## 9. Build & Deployment

### 9.1 Build time
- Incremental compilation / caching
- Parallel build tasks
- Module federation / code splitting for large projects
- Avoid recompilation of unchanged dependencies

### 9.2 Artifact size
- Tree shaking / dead code elimination
- Minification (JS, CSS, HTML)
- Code splitting (lazy load modules)
- Dependency audit: remove unused libraries
- Binary stripping for compiled languages

### 9.3 Startup time
- Lazy initialization over eager loading
- Preload only critical resources
- Async initialization of non-critical services
- Profile application startup (Flame graph)

---

## 10. Security (Performance-Aware)

- Rate limiting to prevent resource exhaustion
- Connection limits per client
- Timeouts for all external calls
- Payload size limits (prevent OOM attacks)
- Circuit breakers for downstream failures

---

## 11. Profiling & Benchmarking

### 11.1 Profiling tools by language
| Language        | CPU Profiler        | Memory Profiler  | Tracing          |
|-----------------|---------------------|------------------|------------------|
| Dart/Flutter    | DevTools CPU        | DevTools Memory  | DevTools Timeline|
| JavaScript/Node | Chrome DevTools     | Chrome Memory    | perf / tracing   |
| Python          | cProfile / py-spy   | memory_profiler  | viztracer        |
| Rust            | perf / flamegraph    | heaptrack        | tracing crate    |
| Go              | pprof               | pprof (heap)     | trace / fgprof   |
| Java            | Async Profiler      | JFR / JMC        | JFR              |
| C++             | perf / VerySleepy   | Valgrind / ASan  | perf / ETW       |

### 11.2 Methodology
- Establish a baseline before optimizing
- Measure wall-clock time, CPU time, memory, I/O, network
- Run multiple samples (warm-up + steady-state)
- Statistical significance (not single-run flukes)
- Compare before/after with the same environment and inputs

### 11.3 What to measure
- Latency (p50, p95, p99, p999)
- Throughput (requests/sec, ops/sec)
- Memory: allocated bytes, GC pauses, resident set size
- CPU: user vs sys, idle, iowait
- I/O: read/write ops, disk utilization

---

## 12. Language-Specific Patterns

### 12.1 Interpreted languages (Python, Ruby, JS)
- Avoid dynamic dispatch in hot paths
- Use native/C extensions for CPU-bound code
- Prefer standard library functions (C-optimized) over manual loops
- JIT warm-up: profile-guided optimization (PGO)

### 12.2 Compiled languages (C++, Rust, Go, Java)
- Compiler optimization flags: `-O2`/`-O3`, LTO, PGO
- Link-time optimization (LTO) across translation units
- Profile-guided optimization (PGO) for branch prediction
- Intrinsics / SIMD for data-parallel operations

### 12.3 JIT languages (Java, C#, JS V8)
- Warm-up loops (tiered compilation)
- Avoid megamorphic call sites (inline caches)
- Reduce allocation pressure (GC tuning)
- Escape analysis for stack allocation

---

## Workflow: Systematic Execution & Output Format

When code is provided, you must respond strictly using the following 4-Phase structure:

### Phase 1: Diagnosis & Constraints
* State identified language/runtime environment.
* List the top 1-3 bottlenecks found (categorized by High/Medium/Low impact).

### Phase 2: The Big-O / Architectural Shift (If applicable)
* If an algorithmic change is needed, explicitly contrast the current vs. proposed complexity (e.g., O(N^2) -> O(N log N)).

### Phase 3: Optimized Implementation
* Provide the fully refactored, production-ready code.
* Use clean, idiomatic syntax for the target language.
* Add minimal, high-value comments directly inside the code explaining *why* a complex optimization was made.

### Phase 4: Verification & Benchmarking Advice
* Provide the exact specific tool/standard library module the user should run to verify this specific change (e.g., `timeit` for Python, `go test -bench` for Go, `BenchmarkDotNet` for C#). Do not just list a generic table.
