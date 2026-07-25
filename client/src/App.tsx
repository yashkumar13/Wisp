import { useEffect, useMemo, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import axios from 'axios'
import './App.css'
import { AuthPage } from './pages/AuthPage'
import { ChatPage } from './pages/ChatPage'

function getTokenFromCookie() {
  const cookie = document.cookie
    .split('; ')
    .find((cookiePair) => cookiePair.startsWith('accessToken='))
  return cookie ? cookie.split('=')[1] : null
}

function connectSocket(token: string) {
  return io('http://localhost:3000', {
    auth: { token: `Bearer ${token}` },
    transports: ['websocket'],
  })
}

type UserAuth = {
  userId?: string
  username: string
  email: string
  token: string
}

function parseJwt(token: string) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

function App() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('Guest')
  const [userId, setUserId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const existingToken = getTokenFromCookie()
    if (existingToken) {
      axios.defaults.headers.common.Authorization = `Bearer ${existingToken}`
      setToken(existingToken)
      setIsAuthenticated(true)

      const payload = parseJwt(existingToken)
      if (payload?.username) {
        setUsername(payload.username)
      }
      if (payload?.sub) {
        setUserId(payload.sub)
      }
    }
  }, [])

  useEffect(() => {
    if (!token) {
      setSocket(null)
      return
    }

    axios.defaults.headers.common.Authorization = `Bearer ${token}`
    const clientSocket = connectSocket(token)
    setSocket(clientSocket)

    return () => {
      clientSocket.disconnect()
    }
  }, [token])

  const handleAuthenticate = ({ userId: nextUserId, username: nextUsername, email, token: authToken }: UserAuth) => {
    setUserId(nextUserId ?? null)
    setUsername(nextUsername || email.split('@')[0] || 'Guest')
    setToken(authToken)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    document.cookie = 'accessToken=; path=/; max-age=0'
    setToken(null)
    setIsAuthenticated(false)
    setUsername('Guest')
  }

  const currentView = useMemo(
    () =>
      isAuthenticated ? (
        <ChatPage username={username} userId={userId} onLogout={handleLogout} socket={socket} />
      ) : (
        <AuthPage
          mode={mode}
          onModeChange={setMode}
          onAuthenticate={handleAuthenticate}
        />
      ),
    [isAuthenticated, mode, username, socket],
  )

  return <>{currentView}</>
}

export default App
