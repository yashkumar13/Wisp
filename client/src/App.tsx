import { useMemo, useState } from 'react'
import './App.css'
import { AuthPage } from './pages/AuthPage'
import { ChatPage } from './pages/ChatPage'

function App() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('Guest')

  const currentView = useMemo(
    () =>
      isAuthenticated ? (
        <ChatPage username={username} onLogout={() => setIsAuthenticated(false)} />
      ) : (
        <AuthPage
          mode={mode}
          onModeChange={setMode}
          onAuthenticate={({ username: nextUsername, email, password }) => {
            setUsername(nextUsername || email.split('@')[0] || 'Guest')
            setIsAuthenticated(true)
            console.log('Auth payload', { username: nextUsername, email, password })
          }}
        />
      ),
    [isAuthenticated, mode, username],
  )

  return <>{currentView}</>
}

export default App
