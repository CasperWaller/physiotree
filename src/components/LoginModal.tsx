import { useState } from 'react';

interface Props {
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
}

export function LoginModal({ onClose, onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onLogin(email, password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inloggning misslyckades');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="guided" role="dialog" aria-label="Logga in">
      <form className="guided__box login" onSubmit={submit}>
        <button type="button" className="guided__close" onClick={onClose} aria-label="Stäng">×</button>
        <span className="side-panel__tag">Admin</span>
        <h2>Logga in</h2>
        <div className="edit">
          <label>
            E-post
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Lösenord
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className="edit__error">{error}</p>}
          <div className="edit__actions">
            <button type="submit" className="edit__save" disabled={busy}>
              {busy ? 'Loggar in…' : 'Logga in'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
