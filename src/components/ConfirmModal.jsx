import { useState, useCallback, createContext, useContext } from 'react'
import './ConfirmModal.css'

const ConfirmContext = createContext(null)

export function useConfirm() {
  return useContext(ConfirmContext)
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)

  // Returns a promise: resolves true on confirm, false on cancel
  const confirm = useCallback((message, opts = {}) => {
    return new Promise(resolve => {
      setState({ message, opts, resolve })
    })
  }, [])

  function close(result) {
    state?.resolve(result)
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="cm-overlay" onClick={() => close(false)}>
          <div className="cm-modal" onClick={e => e.stopPropagation()}>
            {state.opts.title && <div className="cm-title">{state.opts.title}</div>}
            <div className="cm-message">{state.message}</div>
            <div className="cm-actions">
              <button className="cm-btn cm-btn--cancel" onClick={() => close(false)}>
                {state.opts.cancelLabel ?? "CANCEL"}
              </button>
              <button
                className={`cm-btn cm-btn--confirm${state.opts.danger ? " cm-btn--danger" : ""}`}
                onClick={() => close(true)}
              >
                {state.opts.confirmLabel ?? "CONFIRM"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
