## 2025-05-23 - Search performance optimization with useDeferredValue
**Learning:** In React 19, `useDeferredValue` is highly effective for decoupling expensive filtering logic from immediate UI feedback in search inputs. This is often better than traditional debouncing as it leverages concurrent rendering to keep the input responsive while the list updates as soon as the main thread is free.
**Action:** Prefer `useDeferredValue` for local search filtering in modules with large lists to avoid "stuttering" during rapid typing.
