import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (isSigningUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-form-container">
                <h1 className="login-title">{isSigningUp ? 'Create an Account' : 'Welcome Back!'}</h1>
                <p className="login-subtitle">Connect and chat with your friends.</p>
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="login-input"
                            placeholder="Email Address"
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="login-input"
                            placeholder="Password"
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    {error && <p className="login-error">{error}</p>}
                    <button type="submit" className="login-button">
                        {isSigningUp ? 'Sign Up' : 'Log In'}
                    </button>
                    <p className="toggle-form">
                        {isSigningUp ? 'Already have an account?' : "Don't have an account?"}
                        <button type="button" onClick={() => setIsSigningUp(!isSigningUp)} className="toggle-button">
                            {isSigningUp ? 'Log In' : 'Sign Up'}
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default LoginForm;