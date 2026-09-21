// Fachada de compatibilidad. La implementación vive en ./api/index y la lógica
// está partida por dominio en ./api/*.ts. Acá solo se re-exporta la MISMA
// superficie (el objeto `api`, los tipos y los helpers) para que los import
// sites de "../api" (y los vi.mock("../api") de los tests) sigan funcionando
// sin cambios. No agregar lógica acá.
export * from "./api/index"
