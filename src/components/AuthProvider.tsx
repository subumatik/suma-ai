'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

const AuthContext = createContext<{ user: User | null; role: string | null; loading: boolean }>({
  user: null,
  role: null,
  loading: true,
})

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
    setRole(data?.role ?? 'client')
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const u = session?.user ?? null
        setUser(u)
        if (u) {
          loadProfile(u.id)
        } else {
          setRole(null)
        }
        setLoading(false)
        if (event === 'SIGNED_IN') router.refresh()
        if (event === 'SIGNED_OUT') router.push('/login')
      }
    )

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        loadProfile(u.id)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
