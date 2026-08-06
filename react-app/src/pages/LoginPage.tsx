import { useState } from 'react'

type LoginPageProps = {
  onLoginSuccess: (empId: string) => void
}

const LOGIN_ERROR_MESSAGE = 'ユーザーIDまたはパスワードが違います。'

export const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()

    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          passwd: password,
        }),
      })

      const body = (await response.json().catch(() => null)) as
        | { message?: string; empId?: string }
        | null

      if (!response.ok) {
        setError(LOGIN_ERROR_MESSAGE)
        return
      }

      onLoginSuccess(body?.empId ?? '')
    } catch {
      setError(LOGIN_ERROR_MESSAGE)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>交通費精算システム</h1>
        <form onSubmit={handleSubmit} autoComplete="on">
          <div className="form-group">
            <label htmlFor="userId">ユーザーID</label>
            <input
              id="userId"
              name="login-user-id"
              type="text"
              maxLength={16}
              autoComplete="username"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="16文字以内のユーザーIDを入力"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              id="password"
              name="login-password"
              type="text"
              inputMode="text"
              className="password-like-input"
              maxLength={72}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="72文字以内で入力"
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  )
}