import { useState } from "react";
import {
  ArrowLeft,
  Upload,
  ScanLine,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Activity,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function XrayAnalyzer() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [result, setResult] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) return;

    setError("");
    setResult(null);

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid X-ray image.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB.");
      return;
    }

    setFile(selectedFile);

    const imageUrl = URL.createObjectURL(selectedFile);
    setPreview(imageUrl);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload an X-ray image first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      // =========================
      // STEP 1: UPLOAD
      // =========================

      const formData = new FormData();

      formData.append("xray", file);

      const uploadResponse = await api.post(
        "/xrays/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const xrayId = uploadResponse.data.xray.id;

      // =========================
      // STEP 2: ANALYZE
      // =========================

      const analyzeResponse = await api.post(
        `/xrays/${xrayId}/analyze`
      );

      setResult(
        analyzeResponse.data.analysis.result
      );

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Something went wrong while analyzing the X-ray."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
  };

  // =========================
  // HIGHLIGHTED IMAGE URL
  // =========================

  const getHighlightedImageUrl = () => {
    const imagePath =
      result?.localization?.highlightedImageUrl;

    if (!imagePath) {
      return null;
    }

    return `http://localhost:5000${imagePath}`;
  };

  const highlightedImageUrl =
    getHighlightedImageUrl();

  const detections =
    result?.localization?.detections || [];

  return (
    <div className="dashboard-page">

      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">

        <div className="logo">

          <div className="logo-icon">
            <ScanLine size={22} />
          </div>

          <span>MediScan AI</span>

        </div>

        <nav className="sidebar-nav">

          <button
            className="nav-item"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <ScanLine size={19} />
            <span>Dashboard</span>
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate("/reports")
            }
          >
            <Upload size={19} />
            <span>Medical Reports</span>
          </button>

          <button className="nav-item active">
            <ScanLine size={19} />
            <span>X-Ray Analysis</span>
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate("/medicine")
            }
          >
            <ScanLine size={19} />
            <span>Medicine Scanner</span>
          </button>

        </nav>

      </aside>


      {/* ================= MAIN ================= */}

      <main className="dashboard-main">

        {/* HEADER */}

        <div className="dashboard-header">

          <div>

            <p className="eyebrow">
              AI X-RAY ANALYSIS
            </p>

            <h1>
              X-Ray Analyzer
            </h1>

            <p className="subtitle">
              Upload an X-ray image for AI-assisted
              technical review.
            </p>

          </div>

        </div>


        {/* BACK */}

        <button
          onClick={() =>
            navigate("/dashboard")
          }
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "transparent",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            marginBottom: "22px",
            fontSize: "13px",
          }}
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </button>


        {/* ================= UPLOAD ================= */}

        {!result && (

          <section>

            <div className="section-heading">

              <div>

                <h2>
                  Upload X-Ray
                </h2>

                <p>
                  Supported image formats up to 10MB
                </p>

              </div>

            </div>


            <div
              style={{
                padding: "30px",
                border: "1px solid #263650",
                borderRadius: "18px",
                background: "#172338",
              }}
            >

              {!preview ? (

                <label
                  htmlFor="xray-upload"
                  style={{
                    minHeight: "280px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px dashed #3b4c69",
                    borderRadius: "15px",
                    cursor: "pointer",
                    background:
                      "rgba(11,18,32,0.35)",
                  }}
                >

                  <div
                    className="action-icon cyan"
                    style={{
                      width: "60px",
                      height: "60px",
                      marginBottom: "18px",
                    }}
                  >
                    <Upload size={27} />
                  </div>

                  <h3
                    style={{
                      color: "#f1f5f9",
                      fontSize: "16px",
                      marginBottom: "8px",
                    }}
                  >
                    Upload X-Ray Image
                  </h3>

                  <p
                    style={{
                      color: "#94a3b8",
                      fontSize: "13px",
                    }}
                  >
                    Click to select an image
                  </p>

                  <input
                    id="xray-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{
                      display: "none",
                    }}
                  />

                </label>

              ) : (

                <div>

                  <div
                    style={{
                      width: "100%",
                      maxWidth: "700px",
                      margin: "0 auto",
                      borderRadius: "14px",
                      overflow: "hidden",
                      background: "#0b1220",
                    }}
                  >

                    <img
                      src={preview}
                      alt="Uploaded X-ray"
                      style={{
                        width: "100%",
                        maxHeight: "500px",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />

                  </div>


                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      marginTop: "18px",
                      gap: "15px",
                      flexWrap: "wrap",
                    }}
                  >

                    <div>

                      <p
                        style={{
                          color: "#f1f5f9",
                          fontSize: "14px",
                          fontWeight: "600",
                        }}
                      >
                        {file?.name}
                      </p>

                      <p
                        style={{
                          color: "#64748b",
                          fontSize: "12px",
                          marginTop: "4px",
                        }}
                      >
                        {(
                          file?.size /
                          1024 /
                          1024
                        ).toFixed(2)}{" "}
                        MB
                      </p>

                    </div>


                    <button
                      onClick={resetScan}
                      style={{
                        padding: "10px 15px",
                        borderRadius: "9px",
                        border:
                          "1px solid #34445f",
                        background: "#111a2b",
                        color: "#cbd5e1",
                        cursor: "pointer",
                      }}
                    >
                      Change Image
                    </button>

                  </div>

                </div>

              )}


              {/* ERROR */}

              {error && (

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    marginTop: "18px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background:
                      "rgba(251,113,133,0.08)",
                    border:
                      "1px solid rgba(251,113,133,0.18)",
                    color: "#fb7185",
                    fontSize: "13px",
                  }}
                >

                  <AlertCircle size={17} />

                  {error}

                </div>

              )}


              {/* ANALYZE BUTTON */}

              {preview && (

                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  style={{
                    width: "100%",
                    marginTop: "20px",
                    padding: "14px 20px",
                    border: "none",
                    borderRadius: "11px",
                    background:
                      "linear-gradient(135deg,#6366f1,#06b6d4)",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "650",
                    cursor: loading
                      ? "not-allowed"
                      : "pointer",
                    opacity:
                      loading ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "9px",
                  }}
                >

                  {loading ? (

                    <>
                      <Loader2
                        size={18}
                        className="spin"
                      />

                      Running AI Analysis...
                    </>

                  ) : (

                    <>
                      <ScanLine size={18} />

                      Analyze X-Ray
                    </>

                  )}

                </button>

              )}

            </div>

          </section>

        )}


        {/* ================= RESULT ================= */}

        {result && (

          <section>

            <div className="section-heading">

              <div>

                <h2>
                  Analysis Result
                </h2>

                <p>
                  AI-assisted technical observations
                </p>

              </div>

            </div>


            {/* ================= STATUS ================= */}

            <div
              style={{
                padding: "20px",
                borderRadius: "15px",
                border:
                  "1px solid rgba(251,191,36,0.25)",
                background:
                  "rgba(251,191,36,0.07)",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "18px",
              }}
            >

              <AlertCircle
                size={26}
                color="#fbbf24"
              />

              <div>

                <h3
                  style={{
                    color: "#f1f5f9",
                    fontSize: "15px",
                    marginBottom: "4px",
                  }}
                >
                  Professional Review Recommended
                </h3>

                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: "12px",
                  }}
                >
                  Status: {result.status}
                </p>

              </div>

            </div>


            {/* ================= STATS ================= */}

            <div className="stats-grid">

              <div className="stat-card">

                <ScanLine size={22} />

                <span>
                  Body Part
                </span>

                <strong
                  style={{
                    fontSize: "18px",
                  }}
                >
                  {result.bodyPart ||
                    "Unknown"}
                </strong>

              </div>


              <div className="stat-card">

                <ShieldCheck size={22} />

                <span>
                  Image Quality
                </span>

                <strong
                  style={{
                    fontSize: "18px",
                  }}
                >
                  {result.imageQuality ||
                    "N/A"}
                </strong>

              </div>


              <div className="stat-card">

                <Activity size={22} />

                <span>
                  Model Confidence
                </span>

                <strong
                  style={{
                    fontSize: "18px",
                  }}
                >
                  {detections.length > 0
                    ? `${Math.round(
                        detections[0]
                          .confidence * 100
                      )}%`
                    : "No region"}
                </strong>

              </div>

            </div>


            {/* ================= AI HIGHLIGHT ================= */}

            {highlightedImageUrl && (

              <div
                style={{
                  marginTop: "20px",
                  padding: "22px",
                  borderRadius: "15px",
                  border:
                    "1px solid rgba(34,211,238,0.22)",
                  background:
                    "rgba(34,211,238,0.05)",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "8px",
                  }}
                >

                  <MapPin
                    size={20}
                    color="#22d3ee"
                  />

                  <h3
                    style={{
                      color: "#f1f5f9",
                      fontSize: "16px",
                      margin: 0,
                    }}
                  >
                    AI-Detected Region
                  </h3>

                </div>

                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: "12px",
                    lineHeight: "1.6",
                    marginBottom: "18px",
                  }}
                >
                  The segmentation model has highlighted
                  a region requiring professional review.
                  This highlighted area is model output,
                  not a confirmed diagnosis.
                </p>


                <div
                  style={{
                    width: "100%",
                    maxWidth: "760px",
                    margin: "0 auto",
                    borderRadius: "14px",
                    overflow: "hidden",
                    background: "#050b14",
                    border:
                      "1px solid #263650",
                  }}
                >

                  <img
                    src={highlightedImageUrl}
                    alt="X-ray with AI-detected region highlighted"
                    style={{
                      width: "100%",
                      maxHeight: "600px",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />

                </div>


                {/* DETECTION DETAILS */}

                {detections.length > 0 && (

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(180px,1fr))",
                      gap: "12px",
                      marginTop: "16px",
                    }}
                  >

                    <div
                      style={{
                        padding: "14px",
                        borderRadius: "10px",
                        background:
                          "rgba(15,23,42,0.7)",
                        border:
                          "1px solid #263650",
                      }}
                    >

                      <span
                        style={{
                          display: "block",
                          color: "#64748b",
                          fontSize: "11px",
                          marginBottom: "5px",
                        }}
                      >
                        Detected Class
                      </span>

                      <strong
                        style={{
                          color: "#f1f5f9",
                          fontSize: "14px",
                        }}
                      >
                        {detections[0].class}
                      </strong>

                    </div>


                    <div
                      style={{
                        padding: "14px",
                        borderRadius: "10px",
                        background:
                          "rgba(15,23,42,0.7)",
                        border:
                          "1px solid #263650",
                      }}
                    >

                      <span
                        style={{
                          display: "block",
                          color: "#64748b",
                          fontSize: "11px",
                          marginBottom: "5px",
                        }}
                      >
                        Model Confidence
                      </span>

                      <strong
                        style={{
                          color: "#22d3ee",
                          fontSize: "14px",
                        }}
                      >
                        {Math.round(
                          detections[0]
                            .confidence * 100
                        )}
                        %
                      </strong>

                    </div>


                    <div
                      style={{
                        padding: "14px",
                        borderRadius: "10px",
                        background:
                          "rgba(15,23,42,0.7)",
                        border:
                          "1px solid #263650",
                      }}
                    >

                      <span
                        style={{
                          display: "block",
                          color: "#64748b",
                          fontSize: "11px",
                          marginBottom: "5px",
                        }}
                      >
                        Localized Regions
                      </span>

                      <strong
                        style={{
                          color: "#f1f5f9",
                          fontSize: "14px",
                        }}
                      >
                        {detections.length}
                      </strong>

                    </div>

                  </div>

                )}

              </div>

            )}


            {/* ================= OBSERVATIONS ================= */}

            <div
              style={{
                marginTop: "20px",
                padding: "22px",
                borderRadius: "15px",
                border: "1px solid #263650",
                background: "#172338",
              }}
            >

              <h3
                style={{
                  color: "#f1f5f9",
                  fontSize: "16px",
                  marginBottom: "16px",
                }}
              >
                AI Observations
              </h3>


              {result.observations?.map(
                (observation, index) => (

                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: "11px",
                      marginBottom: "13px",
                      color: "#cbd5e1",
                      fontSize: "13px",
                      lineHeight: "1.6",
                    }}
                  >

                    <CheckCircle2
                      size={17}
                      color="#22d3ee"
                      style={{
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    />

                    <span>
                      {observation}
                    </span>

                  </div>

                )
              )}

            </div>


            {/* ================= SIMPLE EXPLANATION ================= */}

            {result.simpleExplanation && (

              <div
                style={{
                  marginTop: "18px",
                  padding: "22px",
                  borderRadius: "15px",
                  border:
                    "1px solid rgba(34,211,238,0.22)",
                  background:
                    "rgba(34,211,238,0.06)",
                }}
              >

                <h3
                  style={{
                    color: "#f1f5f9",
                    fontSize: "16px",
                    marginBottom: "10px",
                  }}
                >
                  🗣️ Aasaan Bhasha Mein
                </h3>

                <p
                  style={{
                    color: "#cbd5e1",
                    fontSize: "14px",
                    lineHeight: "1.7",
                    margin: 0,
                  }}
                >
                  {result.simpleExplanation}
                </p>

                <p
                  style={{
                    color: "#64748b",
                    fontSize: "11px",
                    lineHeight: "1.5",
                    marginTop: "12px",
                    marginBottom: 0,
                  }}
                >
                  Ye explanation sirf AI ke technical
                  observations ko simple language me
                  samjhane ke liye hai. Final review
                  doctor/radiologist se karwana chahiye.
                </p>

              </div>

            )}


            {/* ================= AREAS FOR REVIEW ================= */}

            {result.areasForReview?.length > 0 && (

              <div
                style={{
                  marginTop: "18px",
                  padding: "22px",
                  borderRadius: "15px",
                  border:
                    "1px solid rgba(99,102,241,0.2)",
                  background:
                    "rgba(99,102,241,0.06)",
                }}
              >

                <h3
                  style={{
                    color: "#f1f5f9",
                    fontSize: "16px",
                    marginBottom: "14px",
                  }}
                >
                  Areas for Professional Review
                </h3>


                {result.areasForReview.map(
                  (area, index) => (

                    <p
                      key={index}
                      style={{
                        color: "#aeb9ca",
                        fontSize: "13px",
                        marginBottom: "8px",
                      }}
                    >
                      • {area}
                    </p>

                  )
                )}

              </div>

            )}


            {/* ================= DISCLAIMER ================= */}

            <div
              style={{
                marginTop: "18px",
                padding: "15px",
                borderRadius: "11px",
                background:
                  "rgba(148,163,184,0.06)",
                border:
                  "1px solid #263650",
                color: "#94a3b8",
                fontSize: "12px",
                lineHeight: "1.6",
              }}
            >

              <ShieldCheck
                size={15}
                style={{
                  verticalAlign: "middle",
                  marginRight: "7px",
                }}
              />

              {result.disclaimer ||
                "This AI-assisted prototype does not provide a medical diagnosis. Professional review is recommended."}

            </div>


            {/* ================= NEW SCAN ================= */}

            <button
              onClick={resetScan}
              style={{
                marginTop: "20px",
                padding: "12px 18px",
                borderRadius: "10px",
                border:
                  "1px solid #34445f",
                background: "#111a2b",
                color: "#cbd5e1",
                cursor: "pointer",
              }}
            >
              Analyze Another X-Ray
            </button>

          </section>

        )}

      </main>

    </div>
  );
}

export default XrayAnalyzer;