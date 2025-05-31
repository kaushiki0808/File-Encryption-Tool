// App.jsx
import React, { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [action, setAction] = useState("encrypt");
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [serverDetails, setServerDetails] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
    setShowDetails(false);
    setServerDetails(null);
  };

  const handleGenerateKey = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("http://localhost:5000/generate-key", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setMessage(data.message);
      } else {
        let errorMsg = "Failed to generate key.";
        try {
          const data = await res.json();
          errorMsg = data.message || errorMsg;
        } catch {}
        setMessage(errorMsg);
      }
    } catch (err) {
      setMessage("Failed to generate key. Server not reachable.");
    }
    setLoading(false);
  };

  const handleProcess = async () => {
    if (!file) {
      setMessage("Please select a file.");
      return;
    }
    setLoading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);

    const endpoint = action === "encrypt" ? "encrypt" : "decrypt";
    try {
      const res = await fetch(`http://localhost:5000/${endpoint}`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        setMessage(`${action === "encrypt" ? "Encrypted" : "Decrypted"} file downloaded.`);
      } else {
        const data = await res.json();
        setMessage(data.message || "Error processing file.");
      }
    } catch (err) {
      setMessage("Server error. Please try again.");
    }
    setLoading(false);
  };

  const handleViewDetails = async () => {
    if (!file) return;
    setLoading(true);
    setServerDetails(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("http://localhost:5000/file-details", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setServerDetails(data);
      } else {
        setServerDetails({ error: "Could not fetch details from server." });
      }
    } catch {
      setServerDetails({ error: "Could not fetch details from server." });
    }
    setLoading(false);
    setShowDetails(true);
  };

  const renderFileDetails = () => {
    if (!file) return null;
    return (
      <div
        style={{
          marginTop: 10,
          marginBottom: 18,
          padding: "10px 14px",
          background: "#f1f5f9",
          borderRadius: 6,
          fontSize: 15,
          color: "#2d3748",
          border: "1px solid #e2e8f0",
        }}
      >
        <strong>Name:</strong> {file.name} <br />
        <strong>Type:</strong> {file.type || "Unknown"} <br />
        <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB <br />
        <strong>Last Modified:</strong>{" "}
        {file.lastModified
          ? new Date(file.lastModified).toLocaleString()
          : "Unknown"}
        {serverDetails && (
          <div style={{ marginTop: 8 }}>
            <hr style={{ margin: "8px 0" }} />
            <strong>Server Details:</strong>
            {serverDetails.error ? (
              <div style={{ color: "red" }}>{serverDetails.error}</div>
            ) : (
              <div>
                <strong>Name:</strong> {serverDetails.name} <br />
                <strong>Type:</strong> {serverDetails.type} <br />
                <strong>Size (KB):</strong> {serverDetails.size_kb} <br />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "3rem auto",
        padding: 32,
        borderRadius: 12,
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
        background: "#fff",
        fontFamily: "Segoe UI, Arial, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", color: "#2d3748", marginBottom: 24 }}>
        <span role="img" aria-label="lock">🔒</span> File Encryption Tool
      </h1>
      <button
        onClick={handleGenerateKey}
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px 0",
          background: "#3182ce",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontWeight: 600,
          fontSize: 16,
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: 18,
          transition: "background 0.2s"
        }}
      >
        {loading ? "Processing..." : "Generate Key"}
      </button>
      <hr style={{ margin: "18px 0" }} />
      <label
        htmlFor="file-upload"
        style={{
          display: "block",
          marginBottom: 12,
          fontWeight: 500,
          color: "#4a5568"
        }}
      >
        Select file to {action}:
      </label>
      <input
        id="file-upload"
        type="file"
        onChange={handleFileChange}
        style={{
          marginBottom: 8,
          padding: "6px 0",
        }}
        disabled={loading}
      />
      {file && (
        <>
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            style={{
              marginBottom: 8,
              marginLeft: 8,
              padding: "4px 12px",
              background: "#e2e8f0",
              border: "none",
              borderRadius: 4,
              fontSize: 14,
              color: "#2d3748",
              cursor: "pointer",
              fontWeight: 500,
            }}
            disabled={loading}
          >
            {showDetails ? "Hide Details" : "View Details"}
          </button>
          <button
            type="button"
            onClick={handleViewDetails}
            style={{
              marginBottom: 8,
              marginLeft: 8,
              padding: "4px 12px",
              background: "#bee3f8",
              border: "none",
              borderRadius: 4,
              fontSize: 14,
              color: "#2b6cb0",
              cursor: "pointer",
              fontWeight: 500,
            }}
            disabled={loading}
          >
            Get Server Details
          </button>
        </>
      )}
      {showDetails && renderFileDetails()}
      <div style={{ marginBottom: 18 }}>
        <label style={{ marginRight: 16, fontWeight: 500 }}>
          <input
            type="radio"
            value="encrypt"
            checked={action === "encrypt"}
            onChange={() => setAction("encrypt")}
            disabled={loading}
            style={{ marginRight: 6 }}
          />
          Encrypt
        </label>
        <label style={{ fontWeight: 500 }}>
          <input
            type="radio"
            value="decrypt"
            checked={action === "decrypt"}
            onChange={() => setAction("decrypt")}
            disabled={loading}
            style={{ marginRight: 6 }}
          />
          Decrypt
        </label>
      </div>
      <button
        onClick={handleProcess}
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px 0",
          background: "#38a169",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontWeight: 600,
          fontSize: 16,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background 0.2s"
        }}
      >
        {loading
          ? "Processing..."
          : action === "encrypt"
          ? "Encrypt File"
          : "Decrypt File"}
      </button>
      {message && (
        <div
          style={{
            marginTop: 24,
            padding: "12px 16px",
            borderRadius: 6,
            background: "#f7fafc",
            color: "#2d3748",
            border: "1px solid #e2e8f0",
            fontWeight: 500,
            textAlign: "center"
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}

export default App;