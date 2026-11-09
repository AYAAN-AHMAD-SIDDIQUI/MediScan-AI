
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./MedicineScanner.css";
import {
  Activity,
  ArrowLeft,
  Camera,
  CheckCircle,
  AlertTriangle,
  LoaderCircle,
  ScanLine,
  Upload,
  X,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/medicine-scanner";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function MedicineScanner() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setError("");
    setScan(null);

    if (!selectedFile) {
      setFile(null);
      setPreview("");
      return;
    }

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setFile(null);
      setPreview("");
      setError("Please select a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setPreview("");
      setError("Image size must be 5 MB or less.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const clearImage = () => {
    setFile(null);
    setPreview("");
    setScan(null);
    setError("");

    const input = document.getElementById("medicine-image-input");
    if (input) input.value = "";
  };

  const handleScan = async (event) => {
    event.preventDefault();

    if (!token) {
      setError("Your login session has expired. Please log in again.");
      return;
    }

    if (!file) {
      setError("Please select a medicine package photo first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setScan(null);

      const formData = new FormData();
      formData.append("medicine", file);

      const response = await fetch(`${API_URL}/scan`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Medicine scan failed.");
      }

      if (!data.scan) {
        throw new Error("The server returned an invalid scan result.");
      }

      setScan(data.scan);
      loadHistory();
    } catch (err) {
      setError(err.message || "Unable to scan the medicine.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!token) return;

    try {
      setHistoryLoading(true);

      const response = await fetch(`${API_URL}/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load scan history.");
      }

      setHistory(Array.isArray(data.scans) ? data.scans : []);
    } catch (err) {
      console.error("Medicine history error:", err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [token]);

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? "Date unavailable"
      : parsedDate.toLocaleString();
  };

  return (
    <main className="medicine-scanner-page">
      <div className="medicine-scanner-container">
        <header className="medicine-scanner-header">
          <button
            type="button"
            className="medicine-back-button"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={17} />
            Dashboard
          </button>

          <div className="medicine-brand">
            <div className="medicine-brand-icon">
              <Activity size={24} />
            </div>

            <div>
              <span className="medicine-eyebrow">MEDISCAN AI</span>
              <h1>Medicine Scanner</h1>
              <p>
                AI-assisted medicine packaging recognition
              </p>
            </div>
          </div>
        </header>

        <section className="medicine-intro">
          <span className="medicine-intro-label">
            <ScanLine size={16} />
            AI + OCR SCANNER
          </span>

          <h2>Understand the label, not guess the medicine.</h2>

          <p>
            Upload a clear photo of the medicine strip, bottle, or box.
            The scanner extracts visible text and attempts to identify
            packaging details for verification.
          </p>
        </section>

        <div className="medicine-scanner-grid">
          <section className="medicine-card">
            <div className="medicine-card-heading">
              <div>
                <h2>Upload medicine photo</h2>
                <p>JPG, PNG or WEBP · Maximum 5 MB</p>
              </div>

              <Camera size={24} />
            </div>

            <form onSubmit={handleScan}>
              <label
                htmlFor="medicine-image-input"
                className="medicine-upload-area"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Selected medicine packaging preview"
                    className="medicine-image-preview"
                  />
                ) : (
                  <>
                    <div className="medicine-upload-icon">
                      <Upload size={28} />
                    </div>

                    <strong>Choose a medicine photo</strong>

                    <span>
                      Make sure the printed name and strength are readable.
                    </span>
                  </>
                )}
              </label>

              <input
                id="medicine-image-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="medicine-file-input"
                disabled={loading}
              />

              <div className="medicine-upload-actions">
                <label
                  htmlFor="medicine-image-input"
                  className={`medicine-secondary-button ${
                    loading ? "medicine-disabled" : ""
                  }`}
                >
                  <Camera size={17} />
                  {file ? "Change Photo" : "Select Photo"}
                </label>

                {file && (
                  <button
                    type="button"
                    className="medicine-secondary-button"
                    onClick={clearImage}
                    disabled={loading}
                  >
                    <X size={17} />
                    Remove
                  </button>
                )}
              </div>

              {file && (
                <div className="medicine-file-info">
                  <CheckCircle size={16} />
                  <span>{file.name}</span>
                  <span>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              )}

              {error && (
                <div className="medicine-error" role="alert">
                  <AlertTriangle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="medicine-scan-button"
                disabled={!file || loading}
              >
                {loading ? (
                  <>
                    <LoaderCircle className="medicine-spin" size={19} />
                    Reading medicine label...
                  </>
                ) : (
                  <>
                    <ScanLine size={19} />
                    Scan Medicine
                  </>
                )}
              </button>
            </form>

            {loading && (
              <p className="medicine-processing-note">
                OCR and AI are processing the image. Please wait.
              </p>
            )}
          </section>

          <section className="medicine-card medicine-result-card">
            <div className="medicine-card-heading">
              <div>
                <h2>Scan results</h2>
                <p>Review the extracted packaging information.</p>
              </div>

              <ScanLine size={24} />
            </div>

            {!scan && !loading && (
              <div className="medicine-empty-result">
                <div className="medicine-empty-icon">
                  <Camera size={30} />
                </div>

                <h3>No scan results yet</h3>

                <p>
                  Upload a medicine photo and select Scan Medicine
                  to view the extracted information.
                </p>
              </div>
            )}

            {loading && (
              <div className="medicine-empty-result">
                <LoaderCircle
                  size={30}
                  className="medicine-spin"
                />
                <h3>Analyzing image</h3>
                <p>Extracting text and checking visible label details.</p>
              </div>
            )}

            {scan && (
              <div className="medicine-result-content">
                <div className="medicine-status-banner">
                  <AlertTriangle size={20} />
                  <div>
                    <strong>
                      {scan.status === "POSSIBLE_MATCH_VERIFY"
                        ? "Possible match — verification required"
                        : "Needs manual review"}
                    </strong>

                    <p>
                      This result is not a confirmed medicine identity.
                    </p>
                  </div>
                </div>

                <div className="medicine-result-field">
                  <span>Possible medicine name</span>
                  <strong>
                    {scan.medicineName || "Not identified"}
                  </strong>
                </div>

                <div className="medicine-result-field">
                  <span>Strength</span>
                  <strong>
                    {scan.strength || "Not identified"}
                  </strong>
                </div>

                <div className="medicine-result-field">
                  <span>Manufacturer</span>
                  <strong>
                    {scan.manufacturer || "Not identified"}
                  </strong>
                </div>

                <div className="medicine-result-field">
                  <span>Ingredients</span>
                  <strong>
                    {scan.ingredients || "Not identified"}
                  </strong>
                </div>

                <div className="medicine-confidence">
                  <span>AI confidence estimate</span>
                  <strong>{scan.confidence ?? 0}%</strong>
                </div>

                <p className="medicine-confidence-note">
                  This score is an AI estimate, not a clinically validated
                  probability that the medicine was identified correctly.
                </p>

                {scan.visibleLabelText && (
                  <details className="medicine-ocr-details">
                    <summary>View extracted label text</summary>
                    <p>{scan.visibleLabelText}</p>
                  </details>
                )}

                {Array.isArray(scan.warnings) &&
                  scan.warnings.length > 0 && (
                    <div className="medicine-warnings">
                      <h3>
                        <AlertTriangle size={18} />
                        Warnings
                      </h3>

                      <ul>
                        {scan.warnings.map((warning, index) => (
                          <li key={`${index}-${warning}`}>
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                <p className="medicine-disclaimer">
                  {scan.disclaimer ||
                    "AI-assisted label extraction only. Ask a pharmacist to verify the medicine before relying on the result."}
                </p>
              </div>
            )}
          </section>
        </div>

        <section className="medicine-safety-notice">
          <AlertTriangle size={22} />

          <div>
            <h3>Important safety information</h3>
            <p>
              A photo cannot reliably confirm a medicine's identity,
              authenticity, contents, or suitability for you. Do not take,
              stop, or change a medicine based only on this scan. Verify
              the packaging with a qualified pharmacist or healthcare
              professional.
            </p>
          </div>
        </section>

        <section className="medicine-card medicine-history-card">
          <div className="medicine-card-heading">
            <div>
              <h2>Recent scans</h2>
              <p>Your recent saved medicine scan records.</p>
            </div>

            <button
              type="button"
              className="medicine-secondary-button"
              onClick={loadHistory}
              disabled={historyLoading}
            >
              {historyLoading ? (
                <LoaderCircle size={16} className="medicine-spin" />
              ) : (
                <Activity size={16} />
              )}
              Refresh
            </button>
          </div>

          {historyLoading && history.length === 0 ? (
            <p className="medicine-muted">Loading scan history...</p>
          ) : history.length === 0 ? (
            <p className="medicine-muted">
              No saved scans yet.
            </p>
          ) : (
            <div className="medicine-history-list">
              {history.map((item) => (
                <article
                  className="medicine-history-item"
                  key={item.id}
                >
                  <div className="medicine-history-icon">
                    <ScanLine size={20} />
                  </div>

                  <div className="medicine-history-details">
                    <strong>
                      {item.medicineName || "Medicine not identified"}
                    </strong>

                    <span>
                      {item.strength || "Strength not identified"}
                    </span>

                    <span>{formatDate(item.createdAt)}</span>
                  </div>

                  <span className="medicine-history-status">
                    {item.status || "NEEDS_REVIEW"}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default MedicineScanner;
