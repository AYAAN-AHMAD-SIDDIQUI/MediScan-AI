import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError("");

            const data = await loginUser(form);

            login(data.token);

            navigate("/dashboard");
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Login failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">

            <div className="auth-card">

                <div className="auth-logo">
                    <div className="logo-icon">M</div>
                    <span>
                        MediScan <b>AI</b>
                    </span>
                </div>

                <div className="auth-heading">
                    <p>WELCOME BACK</p>
                    <h1>Sign in to MediScan</h1>
                    <span>
                        Access your health analysis dashboard.
                    </span>
                </div>

                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <label>Email</label>

                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />

                    <label>Password</label>

                    <input
                        type="password"
                        name="password"
                        placeholder="Enter your password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In →"}
                    </button>

                </form>

                <p className="auth-footer">
                    Don't have an account?
                    {" "}
                    <Link to="/register">
                        Create account
                    </Link>
                </p>

            </div>

        </div>
    );
}

export default Login;