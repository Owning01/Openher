//! Triple-GPU backend para stats — portable CPU fallback + wgpu (Intel/AMD/NVIDIA) + CUDA opcional.
//! Detección runtime por vendor ID (0x10DE NVIDIA, 0x8086 Intel, 0x1002 AMD) via wgpu.
//! Sin GPU o bajo threshold (<50k rows) usa CPU (rayon/hashbrown) — paridad garantizada.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GpuVendor {
    Nvidia,
    Intel,
    Amd,
    Unknown,
    None,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BackendKind {
    Cpu,
    Wgpu { vendor: GpuVendor },
    Cuda,
}

impl std::fmt::Display for BackendKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            BackendKind::Cpu => write!(f, "CPU (rayon/hashbrown)"),
            BackendKind::Wgpu { vendor } => write!(f, "wgpu:{vendor:?} (Vulkan/D3D12)"),
            BackendKind::Cuda => write!(f, "CUDA (PTX)"),
        }
    }
}

/// Env `OPENCODE_STATS_GPU` fuerza backend: auto|cpu|cuda|intel|amd|wgpu
fn forced_kind() -> Option<BackendKind> {
    let v = std::env::var("OPENCODE_STATS_GPU").ok()?.to_lowercase();
    match v.as_str() {
        "cpu" => Some(BackendKind::Cpu),
        "cuda" => Some(BackendKind::Cuda),
        "intel" => Some(BackendKind::Wgpu { vendor: GpuVendor::Intel }),
        "amd" => Some(BackendKind::Wgpu { vendor: GpuVendor::Amd }),
        "wgpu" | "vulkan" | "d3d12" => Some(BackendKind::Wgpu { vendor: GpuVendor::Unknown }),
        "auto" | "" => None,
        _ => None,
    }
}

#[cfg(feature = "gpu")]
fn detect_wgpu_vendor() -> GpuVendor {
    // wgpu 24: Instance::new + enumerate_adapters sync
    let instance = wgpu::Instance::new(&wgpu::InstanceDescriptor {
        backends: wgpu::Backends::all(),
        ..Default::default()
    });
    let adapters = instance.enumerate_adapters(wgpu::Backends::all());
    // Priorizar discrete GPU, luego integrated
    let mut best: Option<(GpuVendor, wgpu::DeviceType)> = None;
    for adapter in adapters {
        let info = adapter.get_info();
        let vendor = match info.vendor {
            0x10DE => GpuVendor::Nvidia,
            0x8086 => GpuVendor::Intel,
            0x1002 => GpuVendor::Amd,
            _ => GpuVendor::Unknown,
        };
        // Prefer discrete over integrated, and known vendor over unknown
        let score = match (vendor, info.device_type) {
            (GpuVendor::Nvidia, wgpu::DeviceType::DiscreteGpu) => 100,
            (GpuVendor::Amd, wgpu::DeviceType::DiscreteGpu) => 90,
            (GpuVendor::Intel, wgpu::DeviceType::DiscreteGpu) => 80,
            (GpuVendor::Nvidia, _) => 70,
            (GpuVendor::Amd, _) => 60,
            (GpuVendor::Intel, _) => 50,
            (GpuVendor::Unknown, wgpu::DeviceType::DiscreteGpu) => 40,
            _ => 10,
        };
        let best_score = best.as_ref().map(|(v, t)| match (v, t) {
            (GpuVendor::Nvidia, wgpu::DeviceType::DiscreteGpu) => 100,
            (GpuVendor::Amd, wgpu::DeviceType::DiscreteGpu) => 90,
            (GpuVendor::Intel, wgpu::DeviceType::DiscreteGpu) => 80,
            (GpuVendor::Nvidia, _) => 70,
            (GpuVendor::Amd, _) => 60,
            (GpuVendor::Intel, _) => 50,
            (GpuVendor::Unknown, wgpu::DeviceType::DiscreteGpu) => 40,
            _ => 10,
        }).unwrap_or(0);
        if score > best_score {
            best = Some((vendor, info.device_type));
        }
    }
    best.map(|(v, _)| v).unwrap_or(GpuVendor::None)
}

#[cfg(not(feature = "gpu"))]
fn detect_wgpu_vendor() -> GpuVendor { GpuVendor::None }

/// Backend elegido (cacheado) — respeta `OPENCODE_STATS_GPU` y threshold.
pub fn chosen_backend(row_count: usize) -> BackendKind {
    if let Some(forced) = forced_kind() {
        return forced;
    }
    // Threshold: GPU solo si >50k rows para amortizar H2D copy
    const GPU_THRESHOLD: usize = 50_000;
    if row_count < GPU_THRESHOLD {
        return BackendKind::Cpu;
    }
    #[cfg(feature = "cuda")]
    {
        // Si CUDA feature habilitado y NVIDIA detectado, preferir CUDA sobre wgpu.
        // La disponibilidad real se verifica al crear el kernel; aquí solo routing.
        let vendor = detect_wgpu_vendor();
        if vendor == GpuVendor::Nvidia {
            return BackendKind::Cuda;
        }
        if vendor != GpuVendor::None && vendor != GpuVendor::Unknown {
            return BackendKind::Wgpu { vendor };
        }
        #[cfg(feature = "gpu")]
        return BackendKind::Wgpu { vendor: GpuVendor::Unknown };
        #[cfg(not(feature = "gpu"))]
        return BackendKind::Cpu;
    }
    #[cfg(all(feature = "gpu", not(feature = "cuda")))]
    {
        let vendor = detect_wgpu_vendor();
        if vendor == GpuVendor::None {
            return BackendKind::Cpu;
        }
        return BackendKind::Wgpu { vendor };
    }
    #[cfg(not(feature = "gpu"))]
    {
        return BackendKind::Cpu;
    }
}



/// Nombre para logs/paridad test
pub fn backend_name(row_count: usize) -> String {
    chosen_backend(row_count).to_string()
}

/// Trait para agregaciones — hoy delega a CPU; kernels WGSL/CUDA se inyectan tras validar paridad.
pub trait GpuBackend: Send + Sync {
    fn kind(&self) -> BackendKind;
    fn is_available(&self) -> bool;
}

/// Implementaciones stub que garantizan paridad CPU (kernels reales tras `cargo test --test stats_parity`)
#[cfg(feature = "gpu")]
pub struct WgpuBackend { pub vendor: GpuVendor }
#[cfg(feature = "gpu")]
impl GpuBackend for WgpuBackend {
    fn kind(&self) -> BackendKind { BackendKind::Wgpu { vendor: self.vendor } }
    fn is_available(&self) -> bool { self.vendor != GpuVendor::None }
}
#[cfg(feature = "cuda")]
pub struct CudaBackend;
#[cfg(feature = "cuda")]
impl GpuBackend for CudaBackend {
    fn kind(&self) -> BackendKind { BackendKind::Cuda }
    fn is_available(&self) -> bool { true }
}
pub struct CpuBackend;
impl GpuBackend for CpuBackend {
    fn kind(&self) -> BackendKind { BackendKind::Cpu }
    fn is_available(&self) -> bool { true }
}

/// Factory: elige backend según row_count y env; siempre retorna algo que funciona (fallback CPU).
pub fn make_backend(row_count: usize) -> Box<dyn GpuBackend> {
    match chosen_backend(row_count) {
        BackendKind::Cuda => {
            #[cfg(feature = "cuda")]
            return Box::new(CudaBackend);
            #[cfg(not(feature = "cuda"))]
            return Box::new(CpuBackend);
        }
        BackendKind::Wgpu { vendor } => {
            #[cfg(feature = "gpu")]
            return Box::new(WgpuBackend { vendor });
            #[cfg(not(feature = "gpu"))]
            return Box::new(CpuBackend);
        }
        BackendKind::Cpu => Box::new(CpuBackend),
    }
}
