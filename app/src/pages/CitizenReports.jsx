
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWalletStore } from "../stores/walletStore";
import { getCitizenTokenBalance } from "../services/citizenToken";

const BASE_URL = import.meta.env.VITE_API_URL;

const API_URL = `${BASE_URL}/api/reports`;

function shortenAddress(address = "") {
  if (address.length < 14) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export default function CitizenReports({ spendingId }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const account = useWalletStore((state) => state.account);
const isConnected = useWalletStore((state) => state.isConnected);
const isCorrectNetwork = useWalletStore(
  (state) => state.isCorrectNetwork
);

const [tokenBalance, setTokenBalance] = useState(null);
const [balanceLoading, setBalanceLoading] = useState(false);
const [balanceError, setBalanceError] = useState("");

  const loadTokenBalance = useCallback(async () => {
    if (!isConnected || !isCorrectNetwork || !account) {
      setTokenBalance(null);
      setBalanceError("");
      return;
    }

    setBalanceLoading(true);
    setBalanceError("");

    try {
      const result = await getCitizenTokenBalance(account);
      setTokenBalance(result);
    } catch (err) {
      setBalanceError(err.message || "Could not load CITIZEN balance.");
    } finally {
      setBalanceLoading(false);
    }
  }, [account, isConnected, isCorrectNetwork]);

  useEffect(() => {
    loadTokenBalance();
  }, [loadTokenBalance]);

  useEffect(() => {
    if (!spendingId) {
      setLoading(false);
      setError("Spending record ID is missing.");
      return;
    }

    const controller = new AbortController();

    async function loadReports() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}?spendingId=${encodeURIComponent(spendingId)}`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load reports.");
        }

        setReports(data.reports || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Could not load citizen reports.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadReports();

    return () => controller.abort();
  }, [spendingId]);

  const gateway = (import.meta.env.VITE_PINATA_GATEWAY || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  const gatewayBase = gateway
    ? `https://${gateway}/ipfs/`
    : "https://gateway.pinata.cloud/ipfs/";

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Citizen accountability
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Citizen reports
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Reports submitted about this spending record.
          </p>
        </div>

        <Link
          to={`/spending/${spendingId}/report`}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + Submit a report 
        </Link>
        <button
            type="button"
            onClick={() => {
              loadTokenBalance();
              window.location.reload();
            }}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        
      </div>
      

      <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
          <p className="text-sm font-medium text-indigo-800">
            Your CITIZEN token balance
          </p>

          {balanceLoading ? (
            <p className="mt-2 text-sm text-slate-600">
              Loading balance...
            </p>
          ) : tokenBalance ? (
            <p className="mt-2 text-3xl font-bold text-indigo-950">
              {Number(tokenBalance.balance).toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })}{" "}
              <span className="text-lg">{tokenBalance.symbol}</span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              {!isConnected
                ? "Connect your wallet to view your balance."
                : !isCorrectNetwork
                  ? "Switch to Sepolia to view your balance."
                  : "Your token balance is currently unavailable."}
            </p>
          )}

          {balanceError && (
            <p className="mt-2 text-sm text-rose-700">{balanceError}</p>
          )}

          <p className="mt-2 text-xs text-indigo-800">
            Earn 10 CITIZEN tokens for each eligible report approved by a ministry.
          </p>
        </div>

      <div className="mt-5">
        {loading ? (
          <p className="text-sm text-slate-500">Loading citizen reports...</p>
        ) : error ? (
          <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
            <p className="font-medium text-slate-700">
              No citizen reports yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Citizens can submit evidence-based reports about this spending.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {reports.length} report{reports.length === 1 ? "" : "s"} found
            </p>

            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                gatewayBase={gatewayBase}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ReportCard({ report, gatewayBase }) {
  const [metadata, setMetadata] = useState(null);
  const [metadataError, setMetadataError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadMetadata() {
      try {
        const response = await fetch(
          `${gatewayBase}${encodeURIComponent(report.metadataCID)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Could not load report metadata from IPFS.");
        }

        const data = await response.json();
        setMetadata(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setMetadataError(err.message);
        }
      }
    }

    if (report.metadataCID) loadMetadata();

    return () => controller.abort();
  }, [report.metadataCID, gatewayBase]);

  const status = report.status || "Pending";

  const statusClasses = {
    Pending: "bg-amber-100 text-amber-800",
    Approved: "bg-emerald-100 text-emerald-800",
    Rejected: "bg-rose-100 text-rose-800",
  };

  return (
    <article className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            statusClasses[status] || "bg-slate-100 text-slate-700"
          }`}
        >
          {status}
        </span>

        <time className="text-xs text-slate-500">
          {report.createdAt
            ? new Date(report.createdAt).toLocaleString()
            : "Date unavailable"}
        </time>
      </div>

      <p className="mt-3 text-xs text-slate-500">Reporter</p>
      <code className="break-all text-xs text-slate-700">
        {shortenAddress(report.reporter)}
      </code>

      {metadata ? (
        <>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">
            Report description
          </h3>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
            {metadata.description || "No description available."}
          </p>

          <h3 className="mt-4 text-sm font-semibold text-slate-900">
            Supporting evidence
          </h3>

          {metadata.evidence?.length ? (
            <ul className="mt-2 space-y-2">
              {metadata.evidence.map((file, index) => (
                <li key={`${file.cid}-${index}`}>
                  <a
                    href={`${gatewayBase}${encodeURIComponent(file.cid)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="break-words text-sm font-medium text-indigo-700 underline hover:text-indigo-900"
                  >
                    {file.filename || `Evidence ${index + 1}`}
                  </a>
                  <span className="ml-2 text-xs text-slate-500">
                    {file.type || "File"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              No evidence details available.
            </p>
          )}
        </>
      ) : metadataError ? (
        <p className="mt-4 text-sm text-amber-700">
          The report is listed, but its IPFS metadata could not be loaded.
          Check your Pinata gateway configuration.
        </p>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          Loading report details from IPFS...
        </p>
      )}

      {report.metadataCID && (
        <a
          href={`${gatewayBase}${encodeURIComponent(report.metadataCID)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm font-semibold text-indigo-700 underline"
        >
          View report metadata on IPFS
        </a>
      )}

      {status === "Rejected" && report.reviewReason && (
        <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
          <strong>Review reason:</strong> {report.reviewReason}
        </div>
      )}
      {status === "Approved" && (
          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="font-semibold text-emerald-800">
              {report.rewardTxHash
                ? "Citizen reward transaction recorded"
                : "Report approved — reward transaction not recorded"}
            </p>

            {report.rewardTxHash ? (
              <>
                <p className="mt-1 text-sm text-emerald-700">
                  Reward: 10 CITIZEN
                </p>

                <a
                  href={`https://sepolia.etherscan.io/tx/${report.rewardTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block break-all text-sm font-semibold text-emerald-800 underline"
                >
                  View reward transaction on Sepolia Etherscan ↗
                </a>
              </>
            ) : (
              <p className="mt-1 text-sm text-emerald-700">
                The report is approved, but the backend has not recorded a reward transaction hash.
              </p>
            )}
          </div>
        )}
    </article>
  );
}
