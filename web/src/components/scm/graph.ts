// Lane-based graph layout para git log lineal.
// Puerto de src/modules/git-history/lib/graph.ts de terax-ai (Apache-2.0).
//
// Input: commits newest-first con SHAs de parents.
// Output: layout por fila que el SVG rail dibuja directo.
//
// Algoritmo: mantener `lanes` — array de "próximos commits esperados" por lane.
// Por commit top-to-bottom:
//   1. Buscar lanes que esperan este commit (uno o más — merges apuntan al
//      leftmost; los demás colapsan en él).
//   2. Si ninguno, alocar el primer slot libre.
//   3. Reemplazar la lane del commit por su first parent, alocar lanes para
//      parents adicionales (reusando una lane que ya los espera cuando sea
//      posible — mantiene la historia visualmente consistente).

export type LaneColor = string;

export const LANE_COLORS: LaneColor[] = [
  "#60a5fa", // blue-400
  "#c084fc", // purple-400
  "#34d399", // emerald-400
  "#fbbf24", // amber-400
  "#f472b6", // pink-400
  "#22d3ee", // cyan-400
  "#fb923c", // orange-400
  "#a3e635", // lime-400
];

export function laneColor(index: number): LaneColor {
  return LANE_COLORS[index % LANE_COLORS.length];
}

export type GraphEdge =
  | { kind: "straight"; lane: number; color: LaneColor }
  | { kind: "merge"; fromLane: number; toLane: number; color: LaneColor }
  | { kind: "branch"; fromLane: number; toLane: number; color: LaneColor };

export type GraphRow = {
  sha: string;
  lane: number;
  nodeColor: LaneColor;
  laneCount: number;
  topEdges: GraphEdge[];
  bottomEdges: GraphEdge[];
};

export type GraphState = {
  lanes: (string | null)[];
};

export const EMPTY_GRAPH_STATE: GraphState = { lanes: [] };

export type LogEntryLite = { sha: string; parents: string[] };

function trimTrailing(lanes: (string | null)[]): (string | null)[] {
  let end = lanes.length;
  while (end > 0 && lanes[end - 1] === null) end--;
  return end === lanes.length ? lanes : lanes.slice(0, end);
}

function firstFreeSlot(lanes: (string | null)[]): number {
  for (let i = 0; i < lanes.length; i++) {
    if (lanes[i] === null) return i;
  }
  return lanes.length;
}

/**
 * Calcula las filas del grafo. Pasar el estado de cola previo al agregar una
 * página nueva para que los índices de lane sean estables entre paginaciones.
 */
export function layoutGraph(
  commits: readonly LogEntryLite[],
  previous: GraphState = EMPTY_GRAPH_STATE,
): { rows: GraphRow[]; state: GraphState } {
  const lanes: (string | null)[] = previous.lanes.slice();
  const rows: GraphRow[] = [];

  for (const commit of commits) {
    const claiming: number[] = [];
    for (let i = 0; i < lanes.length; i++) {
      if (lanes[i] === commit.sha) claiming.push(i);
    }

    let lane: number;
    if (claiming.length > 0) {
      lane = claiming[0];
    } else {
      lane = firstFreeSlot(lanes);
      if (lane === lanes.length) lanes.push(null);
    }

    const lanesBefore = lanes.slice();
    const topEdges: GraphEdge[] = [];

    // Lanes passthrough (mitad superior): toda lane con valor que no colapsa
    // en este commit continúa recta hacia el medio.
    for (let i = 0; i < lanesBefore.length; i++) {
      const v = lanesBefore[i];
      if (v === null) continue;
      if (v === commit.sha && i !== lane) {
        topEdges.push({ kind: "merge", fromLane: i, toLane: lane, color: laneColor(i) });
      } else if (i === lane && v === commit.sha) {
        topEdges.push({ kind: "straight", lane: i, color: laneColor(i) });
      } else {
        topEdges.push({ kind: "straight", lane: i, color: laneColor(i) });
      }
    }

    // Colapsar todas las claiming lanes (las consume esta fila).
    for (const idx of claiming) lanes[idx] = null;
    if (claiming.length === 0) {
      lanes[lane] = null;
    }

    // Ubicar parents.
    const parents = commit.parents;
    const bottomEdges: GraphEdge[] = [];
    if (parents.length > 0) {
      // First parent queda en la lane del commit.
      lanes[lane] = parents[0];

      // Parents adicionales → reusar lane existente o alocar nueva.
      for (let p = 1; p < parents.length; p++) {
        const parentSha = parents[p];
        let parentLane = lanes.indexOf(parentSha);
        if (parentLane === -1) {
          parentLane = firstFreeSlot(lanes);
          if (parentLane === lanes.length) lanes.push(null);
          lanes[parentLane] = parentSha;
        }
        if (parentLane !== lane) {
          bottomEdges.push({
            kind: "branch",
            fromLane: lane,
            toLane: parentLane,
            color: laneColor(parentLane),
          });
        }
      }
    }

    // Passthrough salientes: toda lane activa en el after-state dibuja hacia
    // abajo desde su posición. Saltar las lanes branch ya registradas.
    const branchTargets = new Set(
      bottomEdges
        .filter((e): e is Extract<GraphEdge, { kind: "branch" }> => e.kind === "branch")
        .map((e) => e.toLane),
    );
    for (let i = 0; i < lanes.length; i++) {
      const v = lanes[i];
      if (v === null) continue;
      if (branchTargets.has(i)) continue;
      bottomEdges.push({ kind: "straight", lane: i, color: laneColor(i) });
    }

    const trimmed = trimTrailing(lanes);
    if (trimmed.length !== lanes.length) {
      lanes.length = trimmed.length;
    }

    const widestLane = Math.max(lanesBefore.length, lanes.length, lane + 1);

    rows.push({
      sha: commit.sha,
      lane,
      nodeColor: laneColor(lane),
      laneCount: widestLane,
      topEdges,
      bottomEdges,
    });
  }

  return { rows, state: { lanes: lanes.slice() } };
}
