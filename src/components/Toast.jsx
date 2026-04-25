import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react'
import './Toast.css'

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message, type = 'success', duration = 4000) => {
    const id = ++_id
    setToasts(prev => [...prev, { id, message, type }])
    if (duration > 0) setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  toast.success = (msg, dur) => toast(msg, 'success', dur)
  toast.error   = (msg, dur) => toast(msg, 'error',   dur)
  toast.warning = (msg, dur) => toast(msg, 'warning', dur)

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <ToastItem key={t.id} {...t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ id, message, type, onDismiss }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`toast toast--${type} ${visible ? 'toast--in' : ''}`}>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={() => onDismiss(id)}>✕</button>
    </div>
  )
}
