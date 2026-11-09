import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../../services/authService";

function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
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

            await registerUser(form);

            navigate("/login");

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Registration failed"
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
                    <p>GET STARTED</p>
                    <h1>Create your account</h1>
                    <span>
                        Start organizing your health information.
                    </span>
                </div>

                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <label>Full Name</label>

                    <input
                        type="text"
                        name="name"
                        placeholder="Enter your name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />

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
                        placeholder="Create a password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating account..."
                            : "Create Account →"}
                    </button>

                </form>

                <p className="auth-footer">
                    Already have an account?
                    {" "}
                    <Link to="/login">
                        Sign in
                    </Link>
                </p>

            </div>

        </div>
    );
}

export default Register;