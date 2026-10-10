
import { useCallback, useEffect, useState } from "react";
import { BrowserProvider } from "ethers";
import { Link } from "react-router-dom";
import { useWalletStore } from "../stores/walletStore";
import { isAuthorizedMinistry } from "../services/budgetRegistry";

const BASE_URL = import.meta.env.VITE_API_URL;

const API_URL =`${BASE_URL}/api`;

const gatewayBase = (
  import.meta.env.VITE_PINATA_GATEWAY || ""
)
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "");

export default function ReviewerDashboard() {
  const account = useWalletStore((s) => s.account);
  const isConnected = useWalletStore((s) => s.isConnected);
  const isCorrectNetwork = useWalletStore((s) => s.isCorrectNetwork);
  const connectWallet = useWalletStore((s) => s.connectWallet);
  const switchNetwork = useWalletStore((s) => s.switchNetwork);

  const [authorized, setAuthorized] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);
  const [reports, setReports] = useState([]);
  const [metadata, setMetadata] = useState({});
  const [reasons, setReasons] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/reports`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not load citizen reports.");
      }

      setReports(result.reports || []);
    } catch (err) {
      setError(err.message || "Could not load citizen reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Use the same ministry check as RoleDashboard.
  useEffect(() => {
    let cancelled = false;

    async function checkRole() {
      setAuthorized(false);
      setError("");

      if (!isConnected || !account || !isCorrectNetwork) {
        setCheckingRole(false);
        return;
      }

      setCheckingRole(true);

      try {
        const result = await isAuthorizedMinistry(account);

        if (!cancelled) setAuthorized(result === true);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.shortMessage ||
              err.reason ||
              err.message ||
              "Could not check ministry permissions."
          );
        }
      } finally {
        if (!cancelled) setCheckingRole(false);
      }
    }

    checkRole();

    return () => {
      cancelled = true;
    };
  }, [account, isConnected, isCorrectNetwork]);

  // Load report descriptions from IPFS.
  useEffect(() => {
    let cancelled = false;

    async function loadMetadata() {
      if (!gatewayBase) return;

      const missing = reports.filter(
        (report) =>
          report.metadataCID &&
          !Object.prototype.hasOwnProperty.call(metadata, report.id)
      );

      for (const report of missing) {
        try {
          const response = await fetch(
            `https://${gatewayBase}/ipfs/${encodeURIComponent(
              report.metadataCID
            )}`
          );

          if (!response.ok) {
            throw new Error("Could not fetch IPFS metadata.");
          }

          const data = await response.json();

          if (!cancelled) {
            setMetadata((current) => ({
              ...current,
              [report.id]: data,
            }));
          }
        } catch (err) {
          console.error("IPFS metadata error:", err);

          if (!cancelled) {
            setMetadata((current) => ({
              ...current,
              [report.id]: {
                error: "Metadata could not be loaded. Try refreshing.",
              },
            }));
          }
        }
      }
    }

    loadMetadata();

    return () => {
      cancelled = true;
    };
  }, [reports, metadata]);

  async function reviewReport(report, status) {
    const reason = (reasons[report.id] || "").trim();

    if (!isConnected || !isCorrectNetwork || !authorized) {
      setError("Connect an authorized ministry wallet on Sepolia.");
      return;
    }

    if (reason.length < 5 || reason.length > 2000) {
      setError("The review reason must contain 5–2000 characters.");
      return;
    }

    if (!window.ethereum) {
      setError("MetaMask is required to sign a review.");
      return;
    }

    setBusyId(report.id);
    setError("");
    setNotice("");

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();

      if (signerAddress.toLowerCase() !== account.toLowerCase()) {
        throw new Error(
          "The selected MetaMask account differs from the connected account. Reconnect your wallet."
        );
      }

      // Ask the backend for a challenge tied to this exact decision.
      const challengeResponse = await fetch(
        `${API_URL}/reviewer/challenge`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: signerAddress,
            reportId: report.id,
            status,
            reason,
          }),
        }
      );

      const challenge = await challengeResponse.json();

      if (!challengeResponse.ok || !challenge.success) {
        throw new Error(
          challenge.message || "Could not authorize the review."
        );
      }

      // The wallet signs the review message, not a blockchain transaction.
      const signature = await signer.signMessage(challenge.message);

      const response = await fetch(
        `${API_URL}/reports/${encodeURIComponent(report.id)}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: signerAddress,
            status,
            reason,
            nonce: challenge.nonce,
            signature,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "The review failed.");
      }

      setReports((current) =>
        current.map((item) =>
          item.id === report.id ? result.report : item
        )
      );

      setNotice(`Report ${status.toLowerCase()} successfully.`);
    } catch (err) {
      setError(err.message || "Could not review the report.");
    } finally {
      setBusyId("");
    }
  }

  const pendingCount = reports.filter(
    (report) => report.status === "Pending"
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            OpenTreasury
          </p>
          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Citizen Report Review
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Review submitted evidence and record a reasoned decision.
              </p>
            </div>
            <div className="rounded-xl bg-indigo-50 px-5 py-3">
              <p className="text-sm text-indigo-700">Pending reports</p>
              <p className="text-2xl font-bold text-indigo-900">
                {pendingCount}
              </p>
            </div>
          </div>

          {isConnected && account && (
            <p className="mt-4 break-all text-xs text-slate-500">
              Wallet: {account}
            </p>
          )}
        </header>

        {!isConnected && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-slate-700">
              Connect your wallet to check ministry permissions.
            </p>
            <button
              onClick={connectWallet}
              className="mt-4 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Connect MetaMask
            </button>
          </section>
        )}

        {isConnected && !isCorrectNetwork && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-semibold text-amber-900">
              Switch to Sepolia to review reports.
            </p>
            <button
              onClick={switchNetwork}
              className="mt-3 rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700"
            >
              Switch Network
            </button>
          </section>
        )}

        {isConnected && isCorrectNetwork && checkingRole && (
          <p className="rounded-xl bg-white p-4 text-slate-600">
            Checking ministry permissions…
          </p>
        )}

        {isConnected &&
          isCorrectNetwork &&
          !checkingRole &&
          !authorized && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="font-bold text-amber-900">
                Read-only access
              </h2>
              <p className="mt-2 text-sm leading-6 text-amber-800">
                Your wallet is not an authorized ministry. You can browse
                public reports, but only a ministry wallet can approve or
                reject them.
              </p>
              <Link
                to="/spending"
                className="mt-4 inline-block font-semibold text-indigo-700 underline"
              >
                Browse public spending
              </Link>
            </section>
          )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {notice}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={loadReports}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh reports
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-slate-500">
            Loading citizen reports…
          </p>
        ) : reports.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="font-semibold text-slate-800">
              No citizen reports found
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Submitted reports will appear here.
            </p>
          </section>
        ) : (
          <div className="space-y-5">
            {reports.map((report) => {
              const data = metadata[report.id];
              const canReview =
                authorized &&
                isConnected &&
                isCorrectNetwork &&
                report.status === "Pending";

              return (
                <article
                  key={report.id}
                  className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Spending ID: {report.spendingId}
                      </p>
                      <h2 className="mt-1 text-lg font-bold text-slate-900">
                        Citizen report
                      </h2>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                      {report.status}
                    </span>
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-slate-500">Reporter</p>
                      <p className="mt-1 break-all text-slate-800">
                        {report.reporter}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Submitted</p>
                      <p className="mt-1 text-slate-800">
                        {report.createdAt
                          ? new Date(report.createdAt).toLocaleString()
                          : "Unknown"}
                      </p>
                    </div>
                  </div>

                  <section className="rounded-xl bg-slate-50 p-4">
                    <h3 className="font-semibold text-slate-800">
                      Report explanation
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {data?.description ||
                        data?.error ||
                        "Loading report metadata from IPFS…"}
                    </p>

                    {data?.evidence?.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-slate-800">
                          Evidence files
                        </h4>
                        <ul className="mt-2 space-y-2">
                          {data.evidence.map((file, index) => (
                            <li key={`${file.cid}-${index}`}>
                              <a
                                href={`https://${gatewayBase}/ipfs/${encodeURIComponent(file.cid)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="break-all text-sm font-medium text-indigo-600 underline"
                              >
                                {file.filename || `Evidence ${index + 1}`}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </section>

                  <p className="break-all text-xs text-slate-500">
                    Metadata CID: {report.metadataCID}
                  </p>

                  {report.reviewReason && (
                    <section className="rounded-xl border border-slate-200 p-4">
                      <h3 className="text-sm font-semibold text-slate-800">
                        Review reason
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {report.reviewReason}
                      </p>
                    </section>
                  )}

                  {canReview && (
                    <section className="space-y-3 border-t border-slate-100 pt-5">
                      <label className="block text-sm font-semibold text-slate-700">
                        Review reason (required)
                        <textarea
                          rows={3}
                          value={reasons[report.id] || ""}
                          onChange={(event) =>
                            setReasons((current) => ({
                              ...current,
                              [report.id]: event.target.value,
                            }))
                          }
                          placeholder="Explain why the report is valid or invalid…"
                          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </label>

                      <div className="flex flex-wrap gap-3">
                        <button
                          disabled={busyId === report.id}
                          onClick={() => reviewReport(report, "Approved")}
                          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {busyId === report.id
                            ? "Processing…"
                            : "Approve report"}
                        </button>
                        <button
                          disabled={busyId === report.id}
                          onClick={() => reviewReport(report, "Rejected")}
                          className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {busyId === report.id
                            ? "Processing…"
                            : "Reject report"}
                        </button>
                      </div>
                    </section>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
