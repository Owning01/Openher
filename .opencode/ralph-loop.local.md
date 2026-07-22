---
active: true
iteration: 0
maxIterations: 200
---

Implement all 20 features for OpenCode Mobile Android client:

1. Default port 4096 (SettingsPanel.tsx)
2. Session fork/branching (SessionCard, ChatView, App.tsx)
3. MCP Resource Browser (new component MCPBrowser.tsx)
4. Archived Sessions View (new component ArchivedList.tsx)
5. Inline Diff in Messages (new component InlineDiff.tsx, update MessageBubble)
6. Image Lightbox (new component ImageLightbox.tsx)
7. Keyboard Shortcuts Overlay (new component ShortcutsModal.tsx)
8. Offline Action Queue (new hook useOfflineQueue.ts)
9. Granular Notifications (new hook useNotifications.ts)
10. Inline File Editor (new component FileEditor.tsx, new api methods)
11. Diff Apply/Reject (update DiffViewer.tsx)
12. Full-text Session Search (update SessionList.tsx, useOfflineCache.ts)
13. Custom Theme Creator (new component ThemeCreator.tsx)
14. Drag-to-reorder Favorites (new component FavoritesManager.tsx)
15. Deep Link Connection (new hook useDeepLink.ts)
16. Terminal/Shell UI (new component TerminalView.tsx, new hook useShell.ts)

Plus all wiring in App.tsx, api.ts, types.ts, constants.ts, i18n.ts, styles.css.

Implement ALL of them. Build after each batch. Do NOT stop until all 16 features are done and building.