import { useState } from "react";
import { getProofOfDelivery, downloadPodSignature } from "../services/api";

function SignatureVerification() {
  const [podId, setPodId] = useState("");
  const [pod, setPod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLoad = async (e) => {
    e.preventDefault();
    if (!podId.trim()) return;
    setLoading(true);
    setError("");
    setPod(null);
    try {
      const res = await getProofOfDelivery(podId.trim());
      setPod(res.data);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Could not load this proof of delivery."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await downloadPodSignature(podId.trim());
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `signature-pod-${podId.trim()}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Signature download failed.");
    }
  };

  return (
    <section className="page">
      <div className="card">
        <div className="card-title">Customer Signature Verification</div>

        <form className="form-row" onSubmit={handleLoad}>
          <div className="field">
            <label htmlFor="podId">Proof of Delivery ID</label>
            <input
              id="podId"
              value={podId}
              onChange={(e) => setPodId(e.target.value)}
              placeholder="e.g. 11"
            />
          </div>
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Loading..." : "Load signature"}
          </button>
        </form>

        {error && <div className="alert error">{error}</div>}

        {pod && (
          <div className="signature-block">
            {pod.signatureUrl ? (
              <img
                className="signature-image"
                src={pod.signatureUrl}
                alt={`Customer signature for POD ${podId}`}
              />
            ) : (
              <div className="topbar-meta">No signature captured for this POD.</div>
            )}

            {pod.signatureUrl && (
              <button className="button" type="button" onClick={handleDownload}>
                Download signature
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default SignatureVerification;