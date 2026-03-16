import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import type { User } from "@/types"
import { authApi } from "@/services/api"

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  })

  useEffect(() => {
    const token = localStorage.getItem("token")
    const savedUser = localStorage.getItem("user")

    if (token && savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as User
        setState({ user: parsed, token, isLoading: true })
      } catch {
        setState({ user: null, token: null, isLoading: false })
        return
      }
      authApi.me().then(
        (user) => {
          setState({ user, token, isLoading: false })
          localStorage.setItem("user", JSON.stringify(user))
        },
        () => {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          setState({ user: null, token: null, isLoading: false })
        }
      )
      return
    }

    setState((s) => ({ ...s, isLoading: false }))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await authApi.login(email, password)
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))
    setState({ user, token, isLoading: false })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setState({ user: null, token: null, isLoading: false })
  }, [])

  const value: AuthContextValue = {
    ...state,
    isAdmin:
      state.user?.role?.toLowerCase() === "admin" ||
      state.user?.email?.toLowerCase() === "admin@projectify.com",
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
