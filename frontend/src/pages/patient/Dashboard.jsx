import { useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  FileText,
  ScanLine,
  Pill,
  CalendarDays,
  LogOut,
  Activity,
  ArrowRight,
  ShieldCheck,
  Clock3,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-page">

      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">

        <div className="logo">
          <div className="logo-icon">
            <Activity size={22} />
          </div>

          <span>MediScan AI</span>
        </div>

        <nav className="sidebar-nav">

          <button className="nav-item active">
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/reports")}
          >
            <FileText size={19} />
            <span>Medical Reports</span>
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/xray")}
          >
            <ScanLine size={19} />
            <span>X-Ray Analysis</span>
          </button>

          <button
            className="nav-item"
onClick={() => navigate("/medicine-scanner")}          >
            <Pill size={19} />
            <span>Medicine Scanner</span>
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/appointments")}
          >
            <CalendarDays size={19} />
            <span>Appointments</span>
          </button>

        </nav>

        {/* Sidebar bottom */}

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>

      </aside>


      {/* ================= MAIN ================= */}

      <main className="dashboard-main">

        {/* HEADER */}

        <header className="dashboard-header">

          <div>

            <p className="eyebrow">
              PATIENT DASHBOARD
            </p>

            <h1>
              Welcome back 👋
            </h1>

            <p className="subtitle">
              Manage your health records and AI-assisted analysis.
            </p>

          </div>


          <div className="profile-circle">
            P
          </div>

        </header>


        {/* ================= QUICK ACTIONS ================= */}

        <section>

          <div className="section-heading">

            <div>

              <h2>
                Quick Actions
              </h2>

              <p>
                Start an AI-assisted health workflow
              </p>

            </div>

          </div>


          <div className="action-grid">

            {/* REPORT */}

            <button
              className="action-card"
              onClick={() => navigate("/reports")}
            >

              <div className="action-icon purple">
                <FileText size={24} />
              </div>

              <div className="action-content">

                <h3>
                  Analyze Report
                </h3>

                <p>
                  Upload a medical report and get a structured AI-assisted summary.
                </p>

              </div>

              <ArrowRight size={20} />

            </button>


            {/* X-RAY */}

            <button
              className="action-card"
              onClick={() => navigate("/xray")}
            >

              <div className="action-icon cyan">
                <ScanLine size={24} />
              </div>

              <div className="action-content">

                <h3>
                  Scan X-Ray
                </h3>

                <p>
                  Upload an X-ray image for AI-assisted image review.
                </p>

              </div>

              <ArrowRight size={20} />

            </button>


            {/* MEDICINE */}

            <button
              className="action-card"
onClick={() => navigate("/medicine-scanner")}            >

              <div className="action-icon green">
                <Pill size={24} />
              </div>

              <div className="action-content">

                <h3>
                  Medicine Scanner
                </h3>

                <p>
                  Identify medicine information from a medicine image.
                </p>

              </div>

              <ArrowRight size={20} />

            </button>

          </div>

        </section>


        {/* ================= OVERVIEW ================= */}

        <section className="stats-section">

          <div className="section-heading">

            <div>

              <h2>
                Overview
              </h2>

              <p>
                Your health activity
              </p>

            </div>

          </div>


          <div className="stats-grid">

            {/* REPORTS */}

            <div className="stat-card">

              <FileText size={22} />

              <span>
                Total Reports
              </span>

              <strong>
                0
              </strong>

            </div>


            {/* XRAYS */}

            <div className="stat-card">

              <ScanLine size={22} />

              <span>
                X-Ray Scans
              </span>

              <strong>
                0
              </strong>

            </div>


            {/* APPOINTMENTS */}

            <div className="stat-card">

              <CalendarDays size={22} />

              <span>
                Appointments
              </span>

              <strong>
                0
              </strong>

            </div>

          </div>

        </section>


        {/* ================= RECENT ACTIVITY ================= */}

        <section className="recent-section">

          <div className="section-heading">

            <div>

              <h2>
                Recent Activity
              </h2>

              <p>
                Your latest health analyses
              </p>

            </div>

          </div>


          <div className="empty-state">

            <Activity size={34} />

            <h3>
              No recent activity
            </h3>

            <p>
              Your reports and X-ray analyses will appear here.
            </p>

          </div>

        </section>


        {/* ================= TRUST FOOTER ================= */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginTop: "-18px",
            color: "#64748b",
            fontSize: "12px",
          }}
        >

          <ShieldCheck size={16} />

          <span>
            AI-assisted tools • Professional review recommended
          </span>

          <Clock3 size={15} />

        </div>

      </main>

    </div>
  );
}

export default Dashboard;