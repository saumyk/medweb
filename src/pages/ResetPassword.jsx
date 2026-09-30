import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, LoaderCircle } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import './ResetPassword.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { loading, user, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (password.length < 6) {
      setMessage('Your new password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('The passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await updatePassword(password);
    setIsSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    navigate('/dashboard', { replace: true });
  };

  return (
    <section className="reset-password-page">
      <div className="reset-password-card glass">
        <span className="reset-password-icon"><KeyRound size={25} /></span>
        <h1>Choose a new password</h1>
        <p className="reset-password-intro">Use a password you do not use on other websites.</p>

        {loading ? (
          <p className="reset-password-state"><LoaderCircle size={18} className="animate-spin" /> Verifying your reset link…</p>
        ) : !user ? (
          <p className="reset-password-state reset-password-error">This reset link is invalid or has expired. Request a new reset link from the sign-in menu.</p>
        ) : (
          <form className="reset-password-form" onSubmit={handleSubmit}>
            <label htmlFor="new-password">New password</label>
            <div className="reset-password-input">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength="6"
                required
              />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <label htmlFor="confirm-password">Confirm new password</label>
            <div className="reset-password-input">
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength="6"
                required
              />
            </div>

            {message && <p className="reset-password-error" role="alert">{message}</p>}
            <button type="submit" className="reset-password-submit" disabled={isSubmitting}>
              {isSubmitting && <LoaderCircle size={17} className="animate-spin" />}
              Save new password
            </button>
          </form>
        )}

        <Link to="/" className="reset-password-home">Return to home</Link>
      </div>
    </section>
  );
};

export default ResetPassword;
