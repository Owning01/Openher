// KanbanPanel — tablero kanban (tableros, tarjetas DnD, notas, envío a sesión).
// Extraído de shellPanels.tsx: mismo código, sin cambios de conducta.

import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { KANBAN_COLORS, kanbanPromptText, shell } from "../shell"
import type { KanbanBoard, KanbanCard } from "../shell"
import { useT } from "../i18n-context"
import { useDialog } from "./DialogProvider"
import { api } from "../api"
import { STORAGE_KEYS } from "../constants"
import type { Session } from "../entities/session/model"
import type { ServerConfig } from "../types"
import { SendIcon } from "../Icons"

export const KanbanPanel = memo(function KanbanPanel() {
  const t = useT()
  const { confirm } = useDialog()
  const [boards, setBoards] = useState<KanbanBoard[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [drag, setDrag] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [showNotes, setShowNotes] = useState<boolean>(true)
  const [boardNotes, setBoardNotes] = useState<string>("")
  const [showAddBoard, setShowAddBoard] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")
  const [showAddCard, setShowAddCard] = useState<{ column: string } | null>(null)
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null)
  const [cardTitle, setCardTitle] = useState("")
  const [cardNotes, setCardNotes] = useState("")
  const [cardColor, setCardColor] = useState(KANBAN_COLORS[0])
  const [kbError, setKbError] = useState<string | null>(null)
  // Enviar tarjeta como prompt a una sesión: la tarjeta es el prompt.
  const [sendCard, setSendCard] = useState<KanbanCard | null>(null)
  const [sendPrompt, setSendPrompt] = useState("")
  const [sendSessions, setSendSessions] = useState<Session[] | null>(null)
  const [sendSearch, setSendSearch] = useState("")
  const [sendTarget, setSendTarget] = useState<string | null>(null)
  const [sendBusy, setSendBusy] = useState(false)
  const [sendDone, setSendDone] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)

  const readServerConfig = (): ServerConfig | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SERVER)
      if (!raw) return null
      const p = JSON.parse(raw)
      if (!p?.host?.trim()) return null
      return { host: p.host, port: Number(p.port) || 4096, username: p.username ?? "opencode", password: p.password ?? "", apiVersion: p.apiVersion ?? "auto" }
    } catch {
      return null
    }
  }

  const openSendCard = (card: KanbanCard) => {
    setSendCard(card)
    setSendPrompt(kanbanPromptText(card.title, card.notes))
    setSendSearch("")
    setSendTarget(null)
    setSendBusy(false)
    setSendDone(null)
    setSendError(null)
    setSendSessions(null)
    const cfg = readServerConfig()
    if (!cfg) {
      setSendError(t('shell.needsConfig'))
      return
    }
    api.listGlobalSessions(cfg)
      .catch(() => api.listSessions(cfg))
      .then((list) => setSendSessions(Array.isArray(list) ? list : []))
      .catch((e) => setSendError(e instanceof Error ? e.message : t('shell.sendFailed')))
  }

  const submitSendCard = async () => {
    const target = sendSessions?.find((s) => s.id === sendTarget) ?? null
    if (!target || !sendPrompt.trim() || sendBusy) return
    const cfg = readServerConfig()
    if (!cfg) {
      setSendError(t('shell.needsConfig'))
      return
    }
    setSendBusy(true)
    setSendError(null)
    try {
      await api.sendPrompt(cfg, target.id, sendPrompt.trim(), target.directory)
      setSendDone(target.title?.trim() || target.id.slice(0, 8))
    } catch (e) {
      setSendError(e instanceof Error ? e.message : t('shell.sendFailed'))
    } finally {
      setSendBusy(false)
    }
  }

  const sendFiltered = useMemo(() => {
    if (!sendSessions) return []
    const q = sendSearch.trim().toLowerCase()
    const list = q
      ? sendSessions.filter((s) => (s.title ?? "").toLowerCase().includes(q) || (s.directory ?? "").toLowerCase().includes(q))
      : sendSessions
    return [...list].sort((a, b) => (b.time?.updated ?? 0) - (a.time?.updated ?? 0))
  }, [sendSessions, sendSearch])
  const SEND_LIST_CAP = 80

  const load = useCallback(() => {
    shell.kanban.all().then(({ boards }) => {
      setBoards(boards)
      setActive((a) => {
        const next = a && boards.some((b) => b.id === a) ? a : boards[0]?.id ?? null
        if (next) setBoardNotes(localStorage.getItem(`opencode.kanban.notes.${next}`) || "")
        return next
      })
    })
  }, [])
  useEffect(load, [load])
  useEffect(() => { if (active) setBoardNotes(localStorage.getItem(`opencode.kanban.notes.${active}`) || "") }, [active])

  const handleNotesChange = (val: string) => {
    setBoardNotes(val)
    if (active) localStorage.setItem(`opencode.kanban.notes.${active}`, val)
  }

  const board = boards.find((b) => b.id === active) ?? null

  const filteredCards = (colId: string) => {
    if (!board) return []
    let cards = board.cards.filter((c) => c.column === colId)
    if (search.trim()) {
      const q = search.toLowerCase()
      cards = cards.filter((c) => c.title.toLowerCase().includes(q) || c.notes.toLowerCase().includes(q))
    }
    return cards
  }

  const openAddCard = (column: string) => {
    setCardTitle("")
    setCardNotes("")
    setCardColor(KANBAN_COLORS[Math.floor(Math.random() * KANBAN_COLORS.length)])
    setKbError(null)
    setShowAddCard({ column })
  }

  const submitAddCard = async () => {
    if (!board || !showAddCard || !cardTitle.trim()) return
    setKbError(null)
    try {
      await shell.kanban.addCard(board.id, showAddCard.column, cardTitle.trim(), cardNotes.trim(), cardColor)
    } catch (e) {
      // Sin esto el modal se cerraba igual y la tarjeta "desaparecía".
      setKbError(e instanceof Error ? e.message : "No se pudo guardar la tarjeta")
      return
    }
    setShowAddCard(null)
    load()
  }

  const openEditCard = (card: KanbanCard) => {
    setEditingCard(card)
    setCardTitle(card.title)
    setCardNotes(card.notes)
    setCardColor(card.color)
    setKbError(null)
  }

  const submitEditCard = async () => {
    if (!editingCard || !cardTitle.trim()) return
    setKbError(null)
    try {
      // La columna también se persiste: antes se cambiaba en el select pero
      // nunca se enviaba y al recargar la tarjeta "volvía" a su columna.
      await shell.kanban.updateCard(editingCard.id, { title: cardTitle.trim(), notes: cardNotes.trim(), color: cardColor, column: editingCard.column })
    } catch (e) {
      setKbError(e instanceof Error ? e.message : "No se pudo guardar la tarjeta")
      return
    }
    setEditingCard(null)
    load()
  }

  const drop = async (column: string) => {
    if (drag) {
      await shell.kanban.updateCard(drag, { column })
      setDrag(null)
      setDragOverCol(null)
      load()
    }
  }

  const delCard = async (cardId: string) => {
    if (!(await confirm({ message: t('shell.deleteCard') ?? "¿Eliminar tarjeta?", confirmText: t('common.yes'), cancelText: t('common.cancel'), variant: "danger" }))) return
    await shell.kanban.delCard(cardId)
    load()
  }

  const submitAddBoard = async () => {
    if (!newBoardName.trim()) return
    await shell.kanban.addBoard(newBoardName.trim())
    setNewBoardName("")
    setShowAddBoard(false)
    load()
  }

  if (!board) {
    return (
      <div className="shell-kanban-empty">
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--primary-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>️</div>
        <p style={{ fontWeight: 600 }}>{t('shell.noBoards')}</p>
        <p style={{ fontSize: "0.82rem", color: "var(--muted)", textAlign: "center", maxWidth: 300 }}>Crea tu primer tablero para organizar tareas con columnas y tarjetas arrastrables.</p>
        <button className="btn-primary" onClick={() => setShowAddBoard(true)}>{t('shell.newBoard')}</button>
        {showAddBoard && (
          <div className="shell-kanban-modal-overlay" onClick={() => setShowAddBoard(false)}>
            <div className="shell-kanban-modal" onClick={(e) => e.stopPropagation()}>
              <div className="shell-kanban-modal-head"><h3>{t('shell.newBoard')}</h3><button className="btn-icon" onClick={() => setShowAddBoard(false)}>×</button></div>
              <div className="shell-kanban-modal-body">
                <label>Nombre del tablero<input value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} placeholder="Ej: Sprint 12, Roadmap Q4" autoFocus onKeyDown={(e) => e.key === "Enter" && submitAddBoard()} /></label>
              </div>
              <div className="shell-kanban-modal-foot"><button className="btn-secondary" onClick={() => setShowAddBoard(false)}>Cancelar</button><button className="btn-primary" onClick={submitAddBoard} disabled={!newBoardName.trim()}>Crear tablero</button></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const totalCards = board.cards.length
  const colCount = board.columns.length

  return (
    <div className="shell-kanban">
      {/* Header premium: tabs de tableros + búsqueda + acciones */}
      <div className="shell-kanban-head">
        <div className="shell-kanban-board-tabs">
          {boards.map((b) => (
            <button key={b.id} className={`shell-kanban-board-tab${b.id === active ? " active" : ""}`} onClick={() => setActive(b.id)} title={b.name}>
              <span>{b.name}</span>
              <span className="shell-kanban-board-tab-count">{b.cards.length}</span>
            </button>
          ))}
          <button className="shell-kanban-board-tab" onClick={() => setShowAddBoard(true)} title={t('shell.newBoard')} style={{ borderStyle: "dashed" }}>+ {t('shell.newBoard')}</button>
        </div>
        <div className="shell-kanban-head-actions">
          <div className="shell-kanban-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20L16 16" /></svg>
            <input type="search" placeholder="Buscar tarjetas..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: "0.72rem", color: "var(--muted)", whiteSpace: "nowrap" }}>{totalCards} tarjetas · {colCount} columnas</span>
          <button type="button" className={`btn-secondary compact${showNotes ? " active" : ""}`} onClick={() => setShowNotes((v) => !v)} title="Notas del tablero" aria-pressed={showNotes}>Notas</button>
          <button className="btn-icon compact" title={t('shell.deleteBoard')} onClick={async () => { if (board && !(await confirm({ message: t('shell.deleteBoard'), confirmText: t('common.yes'), cancelText: t('common.cancel'), variant: "danger" }))) return; shell.kanban.delBoard(board.id).then(load) }} style={{ color: "var(--muted)" }}>×</button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden", gap: 12 }}>
        <div className="shell-kanban-cols">
          {board.columns.map((col, colIdx) => {
            const cards = filteredCards(col.id)
            const isDragOver = dragOverCol === col.id
            return (
              <div key={col.id} className={`shell-kanban-col${isDragOver ? " drag-over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id) }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={() => drop(col.id)}>
                <div className="shell-kanban-col-head">
                  <span className="shell-kanban-col-dot" style={{ background: KANBAN_COLORS[colIdx % KANBAN_COLORS.length] }} />
                  <span className="shell-kanban-col-title">{col.title}</span>
                  <span className="shell-kanban-col-count">{cards.length}</span>
                </div>
                <div className="shell-kanban-cards">
                  {cards.map((c) => (
                    <div key={c.id} className={`shell-kanban-card${drag === c.id ? " dragging" : ""}`} style={{ "--card-color": c.color } as React.CSSProperties}
                      draggable onDragStart={() => setDrag(c.id)} onDragEnd={() => { setDrag(null); setDragOverCol(null) }}
                      onClick={() => openEditCard(c)}
                      tabIndex={0} role="button" aria-label={`${c.title}${c.notes ? ` — ${c.notes}` : ""}`}
                      title={c.notes ? `${c.title}\n${c.notes}` : c.title}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEditCard(c) } }}>
                      <div className="shell-kanban-card-head">
                        <span className="shell-kanban-card-title">{c.title}</span>
                        <span className="shell-kanban-card-actions">
                          <button onClick={(e) => { e.stopPropagation(); openSendCard(c) }} title={t('shell.sendToSession')} aria-label={t('shell.sendToSession')}><SendIcon size={13} /></button>
                          <button onClick={(e) => { e.stopPropagation(); openEditCard(c) }} title="Editar"></button>
                          <button className="danger" onClick={(e) => { e.stopPropagation(); delCard(c.id) }} title="Eliminar">×</button>
                        </span>
                      </div>
                      {c.notes && <div className="shell-kanban-card-notes">{c.notes}</div>}
                      <div className="shell-kanban-card-foot">
                        <span className="shell-kanban-card-meta">
                          {c.notes && <span className="shell-kanban-card-tag">nota</span>}
                          <span className="shell-kanban-card-date">#{c.id.slice(0, 4)}</span>
                        </span>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                      </div>
                    </div>
                  ))}
                  {cards.length === 0 && search && <div style={{ padding: 12, textAlign: "center", color: "var(--muted)", fontSize: "0.82rem" }}>Sin resultados</div>}
                  <button className="shell-kanban-add" onClick={() => openAddCard(col.id)}>+ {t('shell.addCard')}</button>
                </div>
              </div>
            )
          })}
        </div>

        {showNotes && (
          <div className="shell-kanban-notes">
            <div className="shell-kanban-notes-head">
              <span className="shell-kanban-notes-title"> Notas — {board.name}</span>
              <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{boardNotes.length} caracteres</span>
                <button type="button" className="btn-icon compact" title="Copiar" onClick={() => navigator.clipboard?.writeText(boardNotes)}>Copiar</button>
                <button type="button" className="btn-icon compact" title="Limpiar" onClick={async () => { if (!(await confirm({ message: "¿Limpiar notas?", confirmText: t('common.yes'), cancelText: t('common.cancel') }))) return; handleNotesChange("") }}>Limpiar</button>
              </span>
            </div>
            <textarea value={boardNotes} onChange={(e) => handleNotesChange(e.target.value)} placeholder="Notas del tablero — se guardan automáticamente..." />
          </div>
        )}
      </div>

      {/* Modal nuevo tablero */}
      {showAddBoard && (
        <div className="shell-kanban-modal-overlay" onClick={() => setShowAddBoard(false)}>
          <div className="shell-kanban-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shell-kanban-modal-head"><h3>{t('shell.newBoard')}</h3><button className="btn-icon" onClick={() => setShowAddBoard(false)}>×</button></div>
            <div className="shell-kanban-modal-body">
              <label>Nombre<input value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} placeholder="Ej: Backlog, En curso" autoFocus onKeyDown={(e) => e.key === "Enter" && submitAddBoard()} /></label>
            </div>
            <div className="shell-kanban-modal-foot"><button className="btn-secondary" onClick={() => setShowAddBoard(false)}>Cancelar</button><button className="btn-primary" onClick={submitAddBoard} disabled={!newBoardName.trim()}>Crear</button></div>
          </div>
        </div>
      )}

      {/* Modal nueva tarjeta */}
      {showAddCard && (
        <div className="shell-kanban-modal-overlay" onClick={() => setShowAddCard(null)}>
          <div className="shell-kanban-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shell-kanban-modal-head"><h3>Nueva tarjeta — {board.columns.find((c) => c.id === showAddCard.column)?.title}</h3><button className="btn-icon" onClick={() => setShowAddCard(null)}>×</button></div>
            <div className="shell-kanban-modal-body">
              <label>Título<input value={cardTitle} onChange={(e) => setCardTitle(e.target.value)} placeholder="Ej: Implementar login" autoFocus /></label>
              <label>Notas<textarea value={cardNotes} onChange={(e) => setCardNotes(e.target.value)} placeholder="Detalles, checklist, enlaces..." rows={3} /></label>
              {kbError && <div role="alert" style={{ color: "var(--danger)", fontSize: "0.78rem" }}>{kbError}</div>}
              <label>Color<div className="shell-kanban-color-pick">{KANBAN_COLORS.map((col) => <button key={col} className={`shell-kanban-color-dot${cardColor === col ? " active" : ""}`} style={{ background: col, color: col }} onClick={() => setCardColor(col)} aria-label={col} />)}</div></label>
            </div>
            <div className="shell-kanban-modal-foot"><button className="btn-secondary" onClick={() => setShowAddCard(null)}>Cancelar</button><button className="btn-primary" onClick={submitAddCard} disabled={!cardTitle.trim()}>Crear tarjeta</button></div>
          </div>
        </div>
      )}

      {/* Modal editar tarjeta */}
      {editingCard && (
        <div className="shell-kanban-modal-overlay" onClick={() => setEditingCard(null)}>
          <div className="shell-kanban-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shell-kanban-modal-head"><h3>Editar tarjeta</h3><button className="btn-icon" onClick={() => setEditingCard(null)}>×</button></div>
            <div className="shell-kanban-modal-body">
              <label>Título<input value={cardTitle} onChange={(e) => setCardTitle(e.target.value)} autoFocus /></label>
              <label>Notas<textarea value={cardNotes} onChange={(e) => setCardNotes(e.target.value)} rows={4} /></label>
              {kbError && <div role="alert" style={{ color: "var(--danger)", fontSize: "0.78rem" }}>{kbError}</div>}
              <label>Columna<select value={editingCard.column} onChange={(e) => setEditingCard({ ...editingCard, column: e.target.value })}>{board.columns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
              <label>Color<div className="shell-kanban-color-pick">{KANBAN_COLORS.map((col) => <button key={col} className={`shell-kanban-color-dot${cardColor === col ? " active" : ""}`} style={{ background: col, color: col }} onClick={() => setCardColor(col)} />)}</div></label>
            </div>
            <div className="shell-kanban-modal-foot"><button className="btn-secondary" onClick={() => setEditingCard(null)}>Cancelar</button><button className="btn-primary" onClick={submitEditCard}>Guardar</button></div>
          </div>
        </div>
      )}

      {/* Modal enviar tarjeta como prompt a una sesión */}
      {sendCard && (
        <div className="shell-kanban-modal-overlay" onClick={() => { if (!sendBusy) setSendCard(null) }}>
          <div className="shell-kanban-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shell-kanban-modal-head"><h3>{t('shell.sendToSession')}</h3><button className="btn-icon" onClick={() => setSendCard(null)}>×</button></div>
            <div className="shell-kanban-modal-body">
              {sendDone ? (
                <div role="status" className="shell-kanban-send-ok">{t('shell.sentTo', { name: sendDone })}</div>
              ) : (
                <>
                  <label>{t('shell.promptToSend')}<textarea value={sendPrompt} onChange={(e) => setSendPrompt(e.target.value)} rows={4} disabled={sendBusy} /></label>
                  <label>{t('shell.pickSession')}
                    <input type="search" value={sendSearch} onChange={(e) => setSendSearch(e.target.value)} placeholder={t('shell.searchSessions')} disabled={sendBusy || !sendSessions} />
                  </label>
                  {sendError && <div role="alert" style={{ color: "var(--danger)", fontSize: "0.78rem" }}>{sendError}</div>}
                  {!sendSessions && !sendError && <div style={{ color: "var(--muted)", fontSize: "0.82rem" }}>…</div>}
                  {sendSessions && sendFiltered.length === 0 && <div style={{ color: "var(--muted)", fontSize: "0.82rem" }}>{t('shell.noSessionsFound')}</div>}
                  {sendFiltered.length > 0 && (
                    <div className="shell-kanban-send-list" role="listbox" aria-label={t('shell.pickSession')}>
                      {sendFiltered.slice(0, SEND_LIST_CAP).map((s) => (
                        <button key={s.id} type="button" role="option" aria-selected={sendTarget === s.id}
                          className={`shell-kanban-send-row${sendTarget === s.id ? " active" : ""}`}
                          onClick={() => setSendTarget(s.id)} disabled={sendBusy}>
                          <span className="shell-kanban-send-row-title">{s.title?.trim() || s.id.slice(0, 8)}</span>
                          <span className="shell-kanban-send-row-dir">{s.directory}</span>
                        </button>
                      ))}
                      {sendFiltered.length > SEND_LIST_CAP && (
                        <div style={{ color: "var(--muted)", fontSize: "0.75rem", textAlign: "center" }}>{t('shell.moreSessions', { n: String(sendFiltered.length - SEND_LIST_CAP) })}</div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="shell-kanban-modal-foot">
              {sendDone
                ? <button className="btn-primary" onClick={() => setSendCard(null)}>OK</button>
                : (<><button className="btn-secondary" onClick={() => setSendCard(null)} disabled={sendBusy}>Cancelar</button><button className="btn-primary" onClick={submitSendCard} disabled={!sendTarget || !sendPrompt.trim() || sendBusy}>{sendBusy ? "…" : t('shell.send')}</button></>)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
