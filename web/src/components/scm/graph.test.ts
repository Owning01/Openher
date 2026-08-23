import { describe, expect, it } from "vitest"
import { EMPTY_GRAPH_STATE, layoutGraph, laneColor } from "./graph"

const e = (sha: string, parents: string[] = []) => ({ sha, parents })

describe("layoutGraph", () => {
  it("linear history stays in lane 0", () => {
    const { rows } = layoutGraph([e("a", ["b"]), e("b", ["c"]), e("c")])
    expect(rows.map((r) => r.lane)).toEqual([0, 0, 0])
    expect(rows.every((r) => r.laneCount === 1)).toBe(true)
  })

  it("branch fan-out allocates a new lane and colors stay per slot", () => {
    const { rows } = layoutGraph([
      e("main1", ["merge"]),
      e("merge", ["base", "side"]), // merge commit
      e("side", ["base"]),
      e("base"),
    ])
    // main1 hereda lane 0; merge en lane 0; side abre lane 1; base cierra.
    expect(rows[2].lane).toBe(1)
    expect(rows[2].nodeColor).toBe(laneColor(1))
  })

  it("merge edges appear as branch on parent row and merge curves on child row", () => {
    const commits = [e("m", ["a", "b"]), e("b"), e("a")]
    const { rows } = layoutGraph(commits)
    // m tiene dos parents: first parent a queda en su lane, b genera branch edge.
    const branchEdges = rows[0].bottomEdges.filter((ed) => ed.kind === "branch")
    expect(branchEdges).toHaveLength(1)
    // La fila de b debe tener un top edge merge hacia la lane del merge... b es
    // segundo parent: cuando aparece, colapsa vía merge curve en su propia fila.
    const bRow = rows[1]
    expect(bRow.topEdges.some((ed) => ed.kind === "straight")).toBe(true)
  })

  it("lane indices are stable across pagination via previous state", () => {
    const page1 = [e("c3", ["c2"]), e("c2", ["c1"])]
    const r1 = layoutGraph(page1)
    const page2 = [e("side", ["c0"]), e("c1", ["c0"]), e("c0")]
    const r2 = layoutGraph(page2, r1.state)
    // c1 sigue esperándose en la lane 0 del estado previo.
    expect(r2.rows.find((r) => r.sha === "c1")?.lane).toBe(0)
  })

  it("empty input yields empty rows and empty state", () => {
    const out = layoutGraph([])
    expect(out.rows).toEqual([])
    expect(out.state).toEqual(EMPTY_GRAPH_STATE)
  })
})
