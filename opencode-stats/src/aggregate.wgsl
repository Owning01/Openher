// WGSL compute para agregación por clave — compartido Intel/AMD/NVIDIA (wgpu Vulkan/D3D12)
// Workgroup 64, hash table open-addressing en storage buffer.
// Fallback CPU si driver no soporta compute. Mantiene paridad con db.rs aggregate.

struct SessionGpu {
    input: u32,
    output: u32,
    reasoning: u32,
    cache_read: u32,
    cache_write: u32,
    cost: f32, // bitcast
    key_hash: u32,
}

struct GroupGpu {
    input: atomic<u32>,
    output: atomic<u32>,
    reasoning: atomic<u32>,
    cache_read: atomic<u32>,
    cache_write: atomic<u32>,
    cost_bits: atomic<u32>, // f32 atomic via bitcast + loop
    n: atomic<u32>,
}

@group(0) @binding(0) var<storage, read> sessions: array<SessionGpu>;
@group(0) @binding(1) var<storage, read_write> groups: array<GroupGpu>;
@group(0) @binding(2) var<storage, read> hash_to_slot: array<u32>; // key_hash -> slot index

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let idx = gid.x;
    if (idx >= arrayLength(&sessions)) { return; }
    let s = sessions[idx];
    let slot = hash_to_slot[s.key_hash % arrayLength(&hash_to_slot)];
    // Contención: atomics; cost requiere loop CAS por float
    atomicAdd(&groups[slot].input, s.input);
    atomicAdd(&groups[slot].output, s.output);
    atomicAdd(&groups[slot].reasoning, s.reasoning);
    atomicAdd(&groups[slot].cache_read, s.cache_read);
    atomicAdd(&groups[slot].cache_write, s.cache_write);
    atomicAdd(&groups[slot].n, 1u);
    // f32 add via bitcast loop
    var old = atomicLoad(&groups[slot].cost_bits);
    var new_val: u32;
    loop {
        let old_f = bitcast<f32>(old);
        let new_f = old_f + s.cost;
        new_val = bitcast<u32>(new_f);
        let res = atomicCompareExchangeWeak(&groups[slot].cost_bits, old, new_val);
        if (res.exchanged) { break; }
        old = res.old_value;
    }
}
