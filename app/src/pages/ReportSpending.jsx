
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useWalletStore } from "../stores/walletStore";

const API_URL = "http://localhost:5000/api/evidence";

export default function ReportSpending() {
  const { id } = useParams();

  const account = useWalletStore((state) => state.account);
  const isConnected = useWalletStore((state) => state.isConnected);
  const connectWallet = useWalletStore((state) => state.connectWallet);

  const spendingId = Number(id);

  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cid, setCid] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const gateway = (import.meta.env.VITE_PINATA_GATEWAY || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  const gatewayUrl =
    gateway && cid ? `https://${gateway}/ipfs/${cid}` : "";

  async function submitReport(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setCid("");

    if (!Number.isSafeInteger(spendingId) || spendingId < 1) {
      setError("Invalid spending record ID.");
      return;
    }

    if (!isConnected || !account) {
      setError("Connect your wallet before submitting a report.");
      return;
    }

    if (!description.trim()) {
      setError("A report description is required.");
      return;
    }

    if (files.length === 0) {
      setError("Attach at least one evidence file.");
      return;
    }

    if (files.length > 5) {
      setError("You can upload a maximum of five files.");
      return;
    }

    if (files.some((file) => file.size === 0)) {
      setError("One or more selected files are empty.");
      return;
    }

    if (files.some((file) => file.size > 10 * 1024 * 1024)) {
      setError("Each evidence file must be 10 MB or smaller.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("reportType", "citizen-report");
      formData.append("spendingId", String(spendingId));
      formData.append("reporter", account);
      formData.append("description", description.trim());

      files.forEach((file) => formData.append("files", file));

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Report upload failed.");
      }

      if (!data.cid || typeof data.cid !== "string") {
        throw new Error("The backend did not return a valid IPFS CID.");
      }

      setCid(data.cid);
      setMessage(
        "Report metadata and evidence uploaded to IPFS successfully."
      );
    } catch (err) {
      setError(
        err.message ||
          "Could not submit the report. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClasses =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  const buttonClasses =
    "inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          to={`/spending/${spendingId}`}
          className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
        >
          ← Back to spending record
        </Link>

        <header className="mb-7 mt-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Citizen accountability
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Report suspicious spending
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Describe your concern and provide supporting documents.
            Reports are for review; submitting a report does not by itself
            establish wrongdoing or guarantee a reward.
          </p>
          <p className="mt-3 text-sm font-medium text-slate-700">
            Spending record: #{spendingId}
          </p>
        </header>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Reporter wallet</h2>

          {isConnected && account ? (
            <code className="mt-3 block break-all rounded-lg bg-slate-50 p-3 text-xs">
              {account}
            </code>
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-600">
                Connect a wallet to associate this report with your address.
              </p>
              <button
                type="button"
                onClick={connectWallet}
                className={`${buttonClasses} mt-4`}
              >
                Connect MetaMask
              </button>
            </>
          )}
        </section>

        <form
          onSubmit={submitReport}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div>
            <label
              htmlFor="report-description"
              className="block text-sm font-semibold"
            >
              Explain your concern <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="report-description"
              required
              minLength={1}
              rows={5}
              maxLength={5000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Explain what appears inconsistent and why the evidence supports your concern..."
              className={inputClasses}
              disabled={loading}
            />
            <p className="mt-2 text-xs text-slate-500">
              Maximum 5,000 characters. Focus on specific facts and evidence.
            </p>
          </div>

          <div>
            <label
              htmlFor="report-evidence"
              className="block text-sm font-semibold"
            >
              Supporting evidence <span className="text-rose-600">*</span>
            </label>
            <input
              id="report-evidence"
              type="file"
              multiple
              required
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.doc,.docx"
              onChange={(event) => {
                setFiles(Array.from(event.target.files || []));
                setCid("");
                setMessage("");
                setError("");
              }}
              className={inputClasses}
              disabled={loading}
            />
            <p className="mt-2 text-xs text-slate-500">
              Attach 1–5 files. Maximum 10 MB per file.
            </p>

            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="break-words rounded-lg bg-slate-50 p-3 text-sm"
                  >
                    {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isConnected || !account}
            className={`${buttonClasses} w-full`}
          >
            {loading ? "Uploading report..." : "Submit report to IPFS"}
          </button>

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </p>
          )}

          {message && (
            <section
              role="status"
              className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
            >
              <h2 className="font-semibold text-emerald-900">
                Report uploaded
              </h2>
              <p className="text-sm text-emerald-800">{message}</p>
              <p className="text-xs font-semibold text-slate-600">
                Report metadata CID
              </p>
              <code className="block break-all rounded-lg bg-white p-3 text-xs">
                {cid}
              </code>
              {gatewayUrl && (
                <a
                  href={gatewayUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm font-semibold text-indigo-700 underline"
                >
                  View report metadata on IPFS
                </a>
              )}
            </section>
          )}
        </form>
      </div>
    </main>
  );
}
