import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createInitialState, type GameState } from '../domain/schemas'
import { clearAllData, GAME_STATE_KEY, loadState, replaceFromBackup, saveState } from '../domain/storage'

interface GameStateValue {
  state: GameState
  recovered: boolean
  notice: string
  update: (change: (state: GameState) => GameState) => boolean
  importBackup: (raw: string) => boolean
  clear: () => void
  dismissNotice: () => void
}

const Context = createContext<GameStateValue | null>(null)

export function GameStateProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => loadState(), [])
  const [state, setState] = useState(initial.state)
  const [notice, setNotice] = useState(initial.recovered ? 'Stored data was invalid, so a safe empty state was loaded. Your original browser entry was not overwritten.' : '')

  const update = useCallback((change: (current: GameState) => GameState) => {
    let success = false
    setState((current) => {
      try {
        const saved = saveState(change(current), current.revision)
        success = true
        return saved
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'The change could not be saved.')
        return current
      }
    })
    return success
  }, [])

  const importBackup = useCallback((raw: string) => {
    try {
      const saved = replaceFromBackup(raw, state.revision)
      setState(saved)
      setNotice('Backup imported. The API key in this browser was left unchanged.')
      return true
    } catch (error) {
      setNotice(error instanceof Error ? `Import rejected: ${error.message}` : 'Import rejected.')
      return false
    }
  }, [state.revision])

  const clear = useCallback(() => { clearAllData(); setState(createInitialState()); setNotice('All game data and both browser key copies were removed.') }, [])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === GAME_STATE_KEY) setNotice('This game changed in another tab. Reload before making more changes.')
    }
    addEventListener('storage', onStorage)
    return () => removeEventListener('storage', onStorage)
  }, [])

  return <Context.Provider value={{ state, recovered: initial.recovered, notice, update, importBackup, clear, dismissNotice: () => setNotice('') }}>{children}</Context.Provider>
}

export function useGameState() {
  const value = useContext(Context)
  if (!value) throw new Error('useGameState must be used inside GameStateProvider.')
  return value
}

