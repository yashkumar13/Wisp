import { useMemo, useState, type FormEvent } from 'react'
import axios from 'axios'
 
interface FormData {
  username: string
  email: string
  password: string
}
type AuthPageProps = {
  mode: 'signup' | 'login'
  onModeChange: (mode: 'signup' | 'login') => void
  onAuthenticate: (user: FormData) => void
}

export function AuthPage({ mode, onModeChange, onAuthenticate }: AuthPageProps) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const defaultFormData: FormData = {
    username: '',
    email: '',
    password: '',
  }

  const heading = useMemo(
    () => (mode === 'signup' ? 'Create your account' : 'Welcome back'),
    [mode],
  )

  const subheading = useMemo(
    () =>
      mode === 'signup'
        ? 'Start your private conversations in seconds.'
        : 'Sign in to continue your chat thread.',
    [mode],
  )

  const handleSubmit = async ( event: FormEvent) => {
    const data: FormData = {
      username: username.trim(),
      email: email.trim(),
      password,
    }
    console.log('Form submitted with data:', data)

    event.preventDefault()
    const res: any = await axios.post('http://localhost:3000/api/user', data);
    console.log('Response from server:', res.data);

    // onAuthenticate({
    //   username: username.trim() || email.split('@')[0] || 'guest',
    //   email: email.trim(),
    //   password,
    // })
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand-lockup">
          <div className="brand-badge">Wisp</div>
          <div>
            <p className="eyebrow">Realtime chat</p>
            <h1>{heading}</h1>
            <p className="hero-copy">{subheading}</p>
          </div>
        </div>

        <div className="auth-content">
          <div className="mode-switcher">
            <button
              type="button"
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => onModeChange('signup')}
            >
              Create account
            </button>
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => onModeChange('login')}
            >
              Login
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label>
              <span>Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your username"
                required
              />
            </label>
          )}

          <label>
            <span>{mode === 'signup' ? 'Email' : 'Email or Username'}</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={mode === 'signup' ? 'you@example.com' : 'name@example.com or username'}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          <button type="submit" className="primary-button">
            {mode === 'signup' ? 'Create account' : 'Login to chat'}
          </button>
        </form>
      </div>
    </div>
    </div>
  )
}
