import { useState } from 'react'

export function LoginPage() {
  const [userId, setUserId] = useState('')
  const [passwd, setPasswd] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const API_URL = import.meta.env.VITE_API_URL

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, passwd }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || 'ログインに失敗しました')
      }
      const data = await res.json()
      // token を保存（簡易実装）
      if (data.token) {
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('userId', userId)
        // 必要なら emp_id / emp_name も保存
        if (data.emp_id) localStorage.setItem('empId', data.emp_id)
        if (data.emp_name) localStorage.setItem('empName', data.emp_name)
        // ログイン後の遷移（ルーティング使う場合は navigate('/') 等を使ってください）
        window.location.href = '/'
      } else {
        throw new Error('トークンが返却されませんでした')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
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