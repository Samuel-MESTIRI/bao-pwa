interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  danger?: boolean
}

interface ConfirmState extends ConfirmOptions {
  resolve: (ok: boolean) => void
}

/** Demande de confirmation dans une feuille du bas : `if (await confirm({...})) …` */
export function useConfirm() {
  const state = useState<ConfirmState | null>('confirm', () => null)

  function confirm(options: ConfirmOptions) {
    state.value?.resolve(false)
    return new Promise<boolean>((resolve) => {
      state.value = { ...options, resolve }
    })
  }

  function answer(ok: boolean) {
    state.value?.resolve(ok)
    state.value = null
  }

  return { state, confirm, answer }
}
