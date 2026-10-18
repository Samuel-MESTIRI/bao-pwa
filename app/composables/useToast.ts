interface Toast {
  id: number
  message: string
  variant: 'success' | 'info' | 'error'
}

let nextId = 0

export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  function show(message: string, variant: Toast['variant'] = 'success') {
    const id = ++nextId
    toasts.value = [...toasts.value.slice(-2), { id, message, variant }]
    setTimeout(() => (toasts.value = toasts.value.filter(t => t.id !== id)), 2800)
  }

  return { toasts, show, error: (message: string) => show(message, 'error') }
}
