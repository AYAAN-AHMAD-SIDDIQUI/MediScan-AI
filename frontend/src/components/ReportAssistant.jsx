
import { useState } from "react";
import { MessageCircle, Send, LoaderCircle, Bot, User } from "lucide-react";

const API_URL = "http://localhost:5000/api/reports";

const suggestions = [
  "Explain my report in simple language",
  "Which values need verification?",
  "What questions should I ask my doctor?",
];

function ReportAssistant({ reportId, token }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const askQuestion = async (event, suggestedQuestion) => {
    if (event) event.preventDefault();

    const text = (suggestedQuestion ?? question).trim();

    if (!text || loading) return;

    if (!token) {
      setError("Your login session has expired. Please log in again.");
      return;
    }

    const previousMessages = messages;
    const nextMessages = [
      ...previousMessages,
      { role: "user", text },
    ];

    setMessages(nextMessages);
    setQuestion("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/${reportId}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: text,
          history: previousMessages.slice(-8),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not get an answer."
        );
      }

      setMessages((current) => [
        ...current,
        {
          role: "model",
          text: data.answer,
        },
      ]);
    } catch (err) {
      // Remove the unanswered question so it can be retried.
      setMessages((current) =>
        current.filter((_, index) => index !== current.length - 1)
      );
      setQuestion(text);
      setError(err.message || "Assistant is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="report-assistant">
      <style>{`
        .report-assistant {
          margin-top: 18px;
          padding: 18px;
          border: 1px solid #303f5a;
          border-radius: 14px;
          background: #101a2b;
          color: #f8fafc;
        }
        .assistant-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }
        .assistant-heading svg {
          color: #818cf8;
        }
        .assistant-subtitle {
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.6;
        }
        .assistant-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 16px 0;
        }
        .assistant-suggestion {
          border: 1px solid #394967;
          border-radius: 18px;
          background: #172338;
          color: #c7d2fe;
          padding: 8px 11px;
          cursor: pointer;
          font-size: 12px;
        }
        .assistant-suggestion:disabled {
          opacity: .5;
          cursor: not-allowed;
        }
        .assistant-messages {
          display: grid;
          gap: 12px;
          margin: 16px 0;
        }
        .assistant-message {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .assistant-message-icon {
          flex-shrink: 0;
          display: grid;
          place-items: center;
          width: 30px;
          height: 30px;
          border-radius: 9px;
          background: #202c49;
          color: #a5b4fc;
        }
        .assistant-bubble {
          min-width: 0;
          max-width: 100%;
          padding: 12px;
          border-radius: 10px;
          background: #19263b;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
          line-height: 1.6;
          font-size: 14px;
        }
        .assistant-message.user .assistant-bubble {
          background: #26265b;
        }
        .assistant-form {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 12px;
        }
        .assistant-input {
          flex: 1;
          min-width: 0;
          padding: 12px;
          border: 1px solid #394967;
          border-radius: 10px;
          background: #0b1120;
          color: #f8fafc;
          outline: none;
        }
        .assistant-input:focus {
          border-color: #818cf8;
        }
        .assistant-send {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 12px 15px;
          border: 0;
          border-radius: 10px;
          background: #4f46e5;
          color: white;
          cursor: pointer;
        }
        .assistant-send:disabled {
          opacity: .55;
          cursor: not-allowed;
        }
        .assistant-error {
          margin-top: 12px;
          color: #fda4af;
          font-size: 13px;
        }
        .assistant-disclaimer {
          margin-top: 12px;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.6;
        }
        @media (max-width: 500px) {
          .assistant-form {
            align-items: stretch;
          }
          .assistant-send {
            padding: 12px;
          }
        }
      `}</style>

      <div className="assistant-heading">
        <MessageCircle size={22} />
        <h3 style={{ margin: 0 }}>Ask Your Report AI</h3>
      </div>

      <div className="assistant-subtitle">
        Ask questions about this report. Answers explain the available
        report data; they do not provide a medical diagnosis.
      </div>

      <div className="assistant-suggestions">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="assistant-suggestion"
            disabled={loading}
            onClick={() => askQuestion(null, suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="assistant-messages" aria-live="polite">
        {messages.map((message, index) => (
          <div
            key={`${index}-${message.role}`}
            className={`assistant-message ${message.role === "user" ? "user" : "model"}`}
          >
            <div className="assistant-message-icon">
              {message.role === "user" ? (
                <User size={16} />
              ) : (
                <Bot size={16} />
              )}
            </div>

            <div className="assistant-bubble">{message.text}</div>
          </div>
        ))}

        {loading && (
          <div className="assistant-message">
            <div className="assistant-message-icon">
              <Bot size={16} />
            </div>
            <div className="assistant-bubble">
              <LoaderCircle
                size={16}
                style={{ verticalAlign: "middle" }}
              />{" "}
              Reviewing your report...
            </div>
          </div>
        )}
      </div>

      <form
        className="assistant-form"
        onSubmit={(event) => askQuestion(event)}
      >
        <input
          className="assistant-input"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a question about this report..."
          maxLength={1000}
          disabled={loading}
          aria-label="Ask a question about this report"
        />

        <button
          className="assistant-send"
          type="submit"
          disabled={loading || !question.trim()}
          aria-label="Send question"
        >
          {loading ? (
            <LoaderCircle size={17} />
          ) : (
            <Send size={17} />
          )}
          Send
        </button>
      </form>

      {error && <div className="assistant-error">{error}</div>}

      <p className="assistant-disclaimer">
        Educational information only, not a diagnosis or treatment
        recommendation. Verify uncertain values with the original report
        and consult a qualified healthcare professional.
      </p>
    </section>
  );
}

export default ReportAssistant;
