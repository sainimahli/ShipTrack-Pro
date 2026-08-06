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
        err?.response?.data?.message ||
          "Could not load this proof of delivery."
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className="p-6 text-white"
          style={{
            background:
              "linear-gradient(135deg, #10263f 0%, #14506b 52%)",
          }}
        >
          <h1 className="text-3xl font-bold">
            Customer Signature Verification
          </h1>
          <p className="mt-2 text-gray-200">
            Verify and download customer Proof of Delivery signatures.
          </p>
        </div>

        <div className="p-8">
          {/* Form */}
          <form
            onSubmit={handleLoad}
            className="flex flex-col md:flex-row gap-4"
          >
            <div className="flex-1">
              <label className="block mb-2 text-gray-700 font-semibold">
                Proof of Delivery ID
              </label>

              <input
                type="text"
                value={podId}
                onChange={(e) => setPodId(e.target.value)}
                placeholder="Enter POD ID (e.g. 11)"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                style={{
                  "--tw-ring-color": "#14506b",
                }}
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="text-white px-8 py-3 rounded-xl font-semibold transition duration-300 hover:opacity-90 disabled:opacity-60"
                style={{
                  background:
                    "linear-gradient(135deg, #10263f 0%, #14506b 52%)",
                }}
              >
                {loading ? "Loading..." : "Load Signature"}
              </button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="mt-6 bg-red-100 border border-red-300 text-red-700 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Signature */}
          {pod && (
            <div className="mt-8 bg-gray-50 border rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Signature Preview
              </h2>

              {pod.signatureUrl ? (
                <>
                  <div className="flex justify-center">
                    <img
                      src={pod.signatureUrl}
                      alt={`Customer signature for POD ${podId}`}
                      className="max-h-72 rounded-xl border bg-white p-4 shadow"
                    />
                  </div>

                  <div className="flex justify-center mt-6">
                    <button
                      onClick={handleDownload}
                      className="text-white px-6 py-3 rounded-xl font-semibold transition duration-300 hover:opacity-90"
                      style={{
                        background:
                          "linear-gradient(135deg, #10263f 0%, #14506b 52%)",
                      }}
                    >
                      Download Signature
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-xl p-4 text-center">
                  No signature captured for this Proof of Delivery.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SignatureVerification;