## 2025-05-15 - Concurrent Search with useDeferredValue
**Learning:** For search inputs filtering large datasets in React 18+, `useDeferredValue` provides a smoother user experience than traditional debouncing by allowing the input to update immediately while deferring the expensive list re-render until the main thread is idle. This is particularly effective in this codebase where complex module views re-render as a whole.
**Action:** Prefer `useDeferredValue` for search-based filtering in high-interaction components to maintain UI fluidness.
