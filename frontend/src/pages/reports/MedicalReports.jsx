import ReportAssistant from "../../components/ReportAssistant";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Activity,
  ArrowLeft,
  FileText,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  LoaderCircle,
  Trash2,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/reports";

function MedicalReports() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [file, setFile] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadReports = async () => {
    if (!token) {
      setError("Login session nahi mila. Dobara login karo.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Reports load nahi hui.");
      }

      setReports(Array.isArray(data.reports) ? data.reports : []);
    } catch (err) {
      setError(err.message || "Backend se connect nahi ho pa raha.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // Load reports when the page opens or login token changes.
  }, [token]);

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Pehle report image select karo.");
      return;
    }

    if (!token) {
      setError("Login session nahi mila. Dobara login karo.");
      return;
    }

    const formData = new FormData();
    formData.append("report", file);

    try {
      setUploading(true);
      setError("");
      setMessage("");

      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Report upload failed.");
      }

      setFile(null);
      event.target.reset();
      setMessage("Report successfully upload ho gayi.");
      await loadReports();
    } catch (err) {
      setError(err.message || "Report upload nahi ho payi.");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async (reportId) => {
    try {
      setAnalyzingId(reportId);
      setError("");
      setMessage("");

      const response = await fetch(`${API_URL}/${reportId}/analyze`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Report analysis failed.");
      }

      setMessage("Report analysis complete ho gayi.");
      await loadReports();
    } catch (err) {
      setError(err.message || "Analysis nahi ho payi.");
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDelete = async (reportId) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Report #${reportId}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(reportId);
      setError("");
      setMessage("");

      const response = await fetch(`${API_URL}/${reportId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Report delete nahi hui.");
      }

      setReports((previousReports) =>
        previousReports.filter((report) => report.id !== reportId)
      );

      setMessage(`Report #${reportId} successfully delete ho gayi.`);
    } catch (err) {
      setError(err.message || "Report delete nahi ho payi.");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusClass = (status) => {
    if (status === "NORMAL") return "status-normal";
    if (status === "OUTSIDE_RANGE") return "status-warning";
    if (status === "NEEDS_REVIEW") return "status-review";
    return "status-pending";
  };

  return (
    <div className="reports-page">
      <style>{`
        .reports-page {
          min-height: 100vh;
          padding: 36px;
          background: #0b1120;
          color: #f8fafc;
          font-family: Arial, sans-serif;
        }
        .reports-container {
          max-width: 1100px;
          margin: 0 auto;
        }
        .reports-topbar, .report-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .reports-topbar {
          margin-bottom: 32px;
        }
        .reports-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: 700;
        }
        .reports-brand-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #6366f1, #06b6d4);
          border-radius: 12px;
        }
        .reports-back, .reports-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid #334155;
          border-radius: 10px;
          padding: 11px 16px;
          background: #172338;
          color: #f8fafc;
          cursor: pointer;
          font-size: 14px;
        }
        .reports-button.primary {
          background: #4f46e5;
          border-color: #4f46e5;
        }
        .reports-button.danger {
          background: #991b1b;
          border-color: #b91c1c;
        }
        .reports-button.danger:hover {
          background: #b91c1c;
        }
        .reports-button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }
        .reports-heading {
          margin-bottom: 28px;
        }
        .reports-eyebrow {
          color: #818cf8;
          letter-spacing: 2px;
          font-size: 12px;
          font-weight: 700;
        }
        .reports-heading h1 {
          font-size: clamp(28px, 4vw, 38px);
          margin: 10px 0;
        }
        .reports-heading p, .muted {
          color: #94a3b8;
          line-height: 1.6;
        }
        .reports-panel {
          background: #111c2e;
          border: 1px solid #27364e;
          border-radius: 18px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .reports-panel h2 {
          margin-top: 0;
          font-size: 20px;
        }
        .upload-form {
          display: flex;
          gap: 14px;
          align-items: center;
          flex-wrap: wrap;
        }
        .upload-form input {
          flex: 1;
          min-width: 220px;
          padding: 12px;
          border: 1px dashed #475569;
          border-radius: 10px;
          background: #0b1120;
          color: #cbd5e1;
        }
        .notice {
          padding: 13px 16px;
          border-radius: 10px;
          margin-bottom: 18px;
          overflow-wrap: anywhere;
        }
        .notice.error {
          background: #451a24;
          color: #fecdd3;
        }
        .notice.success {
          background: #12352f;
          color: #a7f3d0;
        }
        .report-item {
          padding: 20px 0;
          border-bottom: 1px solid #27364e;
        }
        .report-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .report-row {
          align-items: flex-start;
        }
        .report-title {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          min-width: 0;
        }
        .report-title h3 {
          margin: 0 0 8px;
          overflow-wrap: anywhere;
        }
        .report-icon {
          color: #818cf8;
          flex-shrink: 0;
        }
        .report-meta {
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.7;
        }
        .status {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 700;
          margin-top: 5px;
        }
        .status-normal {
          color: #6ee7b7;
          background: #064e3b;
        }
        .status-warning {
          color: #fcd34d;
          background: #713f12;
        }
        .status-review, .status-pending {
          color: #cbd5e1;
          background: #334155;
        }
        .analysis-box {
          margin-top: 18px;
          padding: 16px;
          background: #0b1120;
          border-radius: 12px;
          border: 1px solid #27364e;
        }
        .analysis-box h4 {
          margin: 0 0 12px;
        }
        .parameter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
        }
        .parameter {
          padding: 12px;
          background: #152137;
          border-radius: 9px;
          overflow-wrap: anywhere;
        }
        .parameter strong, .parameter span {
          display: block;
          margin-bottom: 6px;
        }
        .report-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .empty-reports {
          text-align: center;
          padding: 38px 10px;
          color: #94a3b8;
        }
        .empty-reports svg {
          color: #818cf8;
        }
        @media (max-width: 600px) {
          .reports-page { padding: 18px; }
          .reports-panel { padding: 18px; }
          .upload-form {
            align-items: stretch;
            flex-direction: column;
          }
          .upload-form input, .upload-form button {
            width: 100%;
            box-sizing: border-box;
          }
          .report-actions {
            width: 100%;
          }
          .report-actions .reports-button {
            flex: 1;
          }
        }
      `}</style>

      <div className="reports-container">
        <div className="reports-topbar">
          <div className="reports-brand">
            <div className="reports-brand-icon">
              <Activity size={22} />
            </div>
            MediScan AI
          </div>

          <button
            className="reports-back"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>
        </div>

        <header className="reports-heading">
          <div className="reports-eyebrow">PATIENT WORKSPACE</div>
          <h1>Medical Reports</h1>
          <p>Upload a report image and review extracted values.</p>
        </header>

        {error && (
          <div className="notice error">
            <AlertCircle size={17} style={{ verticalAlign: "middle" }} />{" "}
            {error}
          </div>
        )}

        {message && (
          <div className="notice success">
            <CheckCircle size={17} style={{ verticalAlign: "middle" }} />{" "}
            {message}
          </div>
        )}

        <section className="reports-panel">
          <h2>Upload a report</h2>
          <p className="muted">
            Select a clear JPG, PNG, or other supported image. Current OCR
            setup is intended for images, not PDF files.
          </p>

          <form className="upload-form" onSubmit={handleUpload}>
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setFile(event.target.files?.[0] || null)
              }
            />

            <button
              className="reports-button primary"
              type="submit"
              disabled={!file || uploading}
            >
              {uploading ? (
                <LoaderCircle size={17} />
              ) : (
                <Upload size={17} />
              )}
              {uploading ? "Uploading..." : "Upload Report"}
            </button>
          </form>
        </section>

        <section className="reports-panel">
          <div className="report-row">
            <div>
              <h2>My Reports</h2>
              <p className="muted">
                Your uploaded reports and analysis results.
              </p>
            </div>

            <button
              className="reports-button"
              onClick={loadReports}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="empty-reports">
              <LoaderCircle size={26} />
              <p>Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="empty-reports">
              <FileText size={36} />
              <h3>No reports yet</h3>
              <p>Upload a sample report image to begin testing.</p>
            </div>
          ) : (
            reports.map((report) => {
              const result = report.analysis?.result;
              const parameters = Array.isArray(result?.parameters)
                ? result.parameters
                : [];

              return (
                <article className="report-item" key={report.id}>
                  <div className="report-row">
                    <div className="report-title">
                      <FileText className="report-icon" size={24} />

                      <div>
                        <h3>Report #{report.id}</h3>

                        <div className="report-meta">
                          Type: {report.reportType || "Not identified"}
                          <br />
                          Uploaded:{" "}
                          {new Date(report.createdAt).toLocaleString()}
                          <br />
                          File type: {report.fileType}
                        </div>

                        <span
                          className={`status ${getStatusClass(report.status)}`}
                        >
                          {report.status || "PENDING"}
                        </span>
                      </div>
                    </div>

                    <div className="report-actions">
                      <button
                        className="reports-button primary"
                        onClick={() => handleAnalyze(report.id)}
                        disabled={
                          analyzingId !== null ||
                          deletingId !== null
                        }
                      >
                        {analyzingId === report.id ? (
                          <LoaderCircle size={16} />
                        ) : (
                          <Activity size={16} />
                        )}
                        {analyzingId === report.id
                          ? "Analyzing..."
                          : "Analyze Report"}
                      </button>

                      <button
                        className="reports-button danger"
                        onClick={() => handleDelete(report.id)}
                        disabled={
                          deletingId !== null ||
                          analyzingId !== null
                        }
                      >
                        {deletingId === report.id ? (
                          <LoaderCircle size={16} />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        {deletingId === report.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>

                  {result && (
                    <div className="analysis-box">
                      <h4>Analysis Summary</h4>

                      <p>
                        {result.simpleExplanation ||
                          "Review the extracted values below."}
                      </p>

                      <p className="report-meta">
                        Report type:{" "}
                        {result.reportType ||
                          report.reportType ||
                          "Unknown"}
                        <br />
                        Overall status:{" "}
                        {result.overallStatus || report.status}
                        {typeof result.ocrConfidence === "number" &&
                          ` · OCR confidence: ${result.ocrConfidence.toFixed(1)}%`}
                      </p>

                      {parameters.length > 0 ? (
                        <div className="parameter-grid">
                          {parameters.map((parameter, index) => (
                            <div
                              className="parameter"
                              key={`${parameter.test}-${index}`}
                            >
                              <strong>{parameter.test}</strong>

                              <span>
                                Value:{" "}
                                {parameter.value ?? "Needs verification"}{" "}
                                {parameter.unit || ""}
                              </span>

                              <span>
                                {parameter.referenceRange
                                  ? `${parameter.referenceRange.min} - ${parameter.referenceRange.max}`
                                  : "Needs review"}
                              </span>

                              <span
                                className={`status ${getStatusClass(parameter.status)}`}
                              >
                                {parameter.status || "NEEDS_REVIEW"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="muted">
                          No structured values were extracted. Check the
                          original report and OCR output.
                        </p>
                      )}

                      <p
                        className="report-meta"
                        style={{ marginTop: 16 }}
                      >
                        {result.disclaimer ||
                          "Automated extraction is not a diagnosis. A qualified clinician should review the original report."}
                      </p>
                    </div>
                  )}

                  {/* Ask Your Report AI Assistant */}
                  {result && (
                    <ReportAssistant
                      key={report.id}
                      reportId={report.id}
                      token={token}
                    />
                  )}
                </article>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}

export default MedicalReports;
