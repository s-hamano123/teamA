import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function LoginPage() {
  const [userId, setUserId] = useState('')
  const [passwd, setPasswd] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const API_URL = import.meta.env.VITE_API_URL

  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/')
  }

  return (
    <div>
        <h1>交通費精算システム</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="userId">ユーザーID</label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="ユーザーID を入力"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="passwd">パスワード</label>
            <input
              id="passwd"
              type="password"
              value={passwd}
              onChange={(e) => setPasswd(e.target.value)}
              placeholder="パスワードを入力"
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
    </div>
  )
}