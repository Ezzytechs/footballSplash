import { createContext, useContext } from 'react'

export type Notify = (message: string) => void

export const NoticeContext = createContext<Notify>(() => {})

/** Read the toast function from anywhere inside a <NoticeProvider />. */
export function useNotice(): Notify {
  return useContext(NoticeContext)
}
