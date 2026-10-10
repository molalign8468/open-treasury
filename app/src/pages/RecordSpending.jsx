import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWalletStore } from "../stores/walletStore";
import {
  getAllPrograms,
  isAuthorizedSpender,
  recordSpending,
} from "../services/budgetRegistry";

const API_URL = "http://localhost:5000/api/evidence";

function formatAmount(value) {
  return BigInt(value || "0").toLocaleString();
}

export default function RecordSpending() {
  const account = useWalletStore((state) => state.account);
  const isConnected = useWalletStore((state) => state.isConnected);
  const isCorrectNetwork = useWalletStore(
    (state) => state.isCorrectNetwork
  );
  const connectWallet = useWalletStore((state) => state.connectWallet);
  const switchNetwork = useWalletStore((state) => state.switchNetwork);

  const [programs, setPrograms] = useState([]);
  const [programId, setProgramId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);

  const [authorized, setAuthorized] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);

  const [cid, setCid] = useState("");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!isConnected || !account || !isCorrectNetwork) {
        setAuthorized(false);
        setPrograms([]);
        return;
      }

      setLoadingPrograms(true);
      setError("");

      try {
        const [permission, allPrograms] = await Promise.all([
          isAuthorizedSpender(account),
          getAllPrograms(),
        ]);

        if (cancelled) return;

        setAuthorized(permission);
        setPrograms(
          allPrograms.filter((program) => {
            const remaining =
              BigInt(program.allocatedAmount) -
              BigInt(program.spentAmount);

            return program.active && remaining > 0n;
          })
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err.shortMessage ||
              err.reason ||
              err.message ||
              "Could not load spending information."
          );
        }
      } finally {
        if (!cancelled) setLoadingPrograms(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [account, isConnected, isCorrectNetwork]);

  const selectedProgram = programs.find(
    (program) => program.id === Number(programId)
  );

  const remaining = selectedProgram
    ? BigInt(selectedProgram.allocatedAmount) -
      BigInt(selectedProgram.spentAmount)
    : 0n;

  function validateDetails() {
    if (!isConnected || !isCorrectNetwork || !authorized) {
      return "Connect an authorized spender wallet on Sepolia.";
    }

    if (!selectedProgram) {
      return "Select an active program with available funds.";
    }

    if (!/^[1-9]\d*$/.test(amount.trim())) {
      return "Amount must be a positive whole number.";
    }

    if (BigInt(amount.trim()) > remaining) {
      return "Amount exceeds the program's remaining allocation.";
    }

    if (!description.trim()) {
      return "Spending description is required.";
    }

    if (files.length === 0 && !cid) {
      return "Select at least one evidence file.";
    }

    if (files.some((file) => file.size === 0)) {
      return "One or more selected files are empty.";
    }

    return "";
  }

  async function uploadEvidence() {
    setError("");
    setMessage("");

    const validationError = validateDetails();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (cid) {
      setMessage(
        "Evidence is already uploaded. You can record it on-chain."
      );
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("description", description.trim());

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Evidence upload failed.");
      }

      if (!data.cid || typeof data.cid !== "string") {
        throw new Error(
          "The backend response did not contain a valid CID."
        );
      }

      setCid(data.cid);
      setMessage(
        "Evidence uploaded. Review the details, then record spending on-chain."
      );
    } catch (err) {
      setError(
        err.message ||
          "Could not upload evidence. Check that the backend is running."
      );
    } finally {
      setUploading(false);
    }
  }

  async function submitSpending() {
    setError("");
    setMessage("");
    setTxHash("");

    const validationError = validateDetails();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!cid) {
      setError("Upload evidence before recording spending.");
      return;
    }

    setRecording(true);

    try {
      // Recheck permission immediately before sending the transaction.
      const permission = await isAuthorizedSpender(account);

      if (!permission) {
        setAuthorized(false);
        throw new Error(
          "This wallet is no longer an authorized spender."
        );
      }

      // Recheck the selected program's latest on-chain state.
      const latestPrograms = await getAllPrograms();
      const latest = latestPrograms.find(
        (program) => program.id === Number(programId)
      );

      if (!latest || !latest.active) {
        throw new Error("This program is no longer active.");
      }

      const latestRemaining =
        BigInt(latest.allocatedAmount) - BigInt(latest.spentAmount);

      if (BigInt(amount.trim()) > latestRemaining) {
        throw new Error(
          "The amount exceeds the program's latest remaining allocation."
        );
      }

      const result = await recordSpending(
        Number(programId),
        amount.trim(),
        cid
      );

      setTxHash(result.hash);
      setMessage("Spending successfully recorded on Sepolia.");

      // Prevent accidentally submitting the same form twice.
      setCid("");
      setFiles([]);
      setAmount("");
      setDescription("");
      setProgramId("");

      const refreshedPrograms = await getAllPrograms();
      setPrograms(
        refreshedPrograms.filter((program) => {
          const available =
            BigInt(program.allocatedAmount) -
            BigInt(program.spentAmount);

          return program.active && available > 0n;
        })
      );
    } catch (err) {
      setError(
        err.shortMessage ||
          err.reason ||
          err.message ||
          "The spending transaction failed."
      );
    } finally {
      setRecording(false);
    }
  }

  const gateway = (
    import.meta.env.VITE_PINATA_GATEWAY || ""
  )
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  const gatewayUrl =
    gateway && cid ? `https://${gateway}/ipfs/${cid}` : "";

  const inputClasses =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100";

  const buttonClasses =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Page header */}
        <header className="mb-8">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v18m9-9H3"
              />
              <rect
                x="4"
                y="5"
                width="16"
                height="14"
                rx="2"
              />
            </svg>
          </div>

          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Spender Workspace
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Record Government Spending
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Upload supporting evidence and record spending transactions
            on the Sepolia blockchain for transparent public verification.
          </p>
        </header>

        {/* Wallet and network status */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="15" rx="2" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 14h2M3 9h18M7 5V3h10v2"
                />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-900">
                Wallet connection
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Connect an authorized spender wallet and use the Sepolia
                network to record spending.
              </p>

              {isConnected && isCorrectNetwork && (
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Connected wallet
                    </p>
                    <code className="mt-1 block break-all rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                      {account}
                    </code>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-slate-600">
                      Spender authorization:
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                        authorized
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          authorized ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      />
                      {authorized ? "Authorized" : "Not authorized"}
                    </span>
                  </div>
                </div>
              )}

              {!isConnected && (
                <button
                  onClick={connectWallet}
                  className={`${buttonClasses} mt-4`}
                >
                  Connect MetaMask
                </button>
              )}

              {isConnected && !isCorrectNetwork && (
                <button
                  onClick={switchNetwork}
                  className={`${buttonClasses} mt-4`}
                >
                  Switch to Sepolia
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Loading status */}
        {loadingPrograms && (
          <div
            role="status"
            className="mb-6 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800"
          >
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
            Loading active programs...
          </div>
        )}

        {/* Spending form */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
            <h2 className="text-lg font-bold text-slate-900">
              Spending details
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Select the program, enter the amount, and attach supporting
              documentation.
            </p>
          </div>

          <div className="space-y-6 p-5 sm:p-7">
            {/* Program selection */}
            <div>
              <label
                htmlFor="program"
                className="block text-sm font-semibold text-slate-800"
              >
                Government program <span className="text-rose-500">*</span>
              </label>

              <select
                id="program"
                value={programId}
                onChange={(event) => {
                  setProgramId(event.target.value);
                  setCid("");
                  setTxHash("");
                  setMessage("");
                  setError("");
                }}
                disabled={uploading || recording}
                className={inputClasses}
              >
                <option value="">Select a program</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name} (Program #{program.id})
                  </option>
                ))}
              </select>

              {selectedProgram && (
                <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-indigo-700">
                    Remaining allocation
                  </p>
                  <p className="mt-1 text-xl font-bold text-indigo-950">
                    {formatAmount(remaining.toString())}
                  </p>
                  <p className="mt-1 text-xs text-indigo-700">
                    Amount available before this program reaches its
                    allocation limit.
                  </p>
                </div>
              )}

              {!loadingPrograms &&
                isConnected &&
                isCorrectNetwork &&
                authorized &&
                programs.length === 0 && (
                  <p className="mt-2 text-sm text-amber-700">
                    No active programs with available funds were found.
                  </p>
                )}
            </div>

            {/* Amount */}
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-semibold text-slate-800"
              >
                Spending amount <span className="text-rose-500">*</span>
              </label>
              <input
                id="amount"
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setCid("");
                  setTxHash("");
                }}
                placeholder="Enter a whole-number amount"
                disabled={uploading || recording}
                className={inputClasses}
              />
              <p className="mt-2 text-xs text-slate-500">
                Enter a positive whole number. The amount cannot exceed
                the program&apos;s remaining allocation.
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-slate-800"
              >
                Spending description{" "}
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setCid("");
                  setTxHash("");
                }}
                placeholder="Explain what this spending is for..."
                rows={5}
                disabled={uploading || recording}
                className={`${inputClasses} resize-y`}
              />
              <p className="mt-2 text-xs text-slate-500">
                Describe the purpose of the expenditure and what the
                attached evidence supports.
              </p>
            </div>

            {/* Evidence files */}
            <div>
              <label
                htmlFor="evidence"
                className="block text-sm font-semibold text-slate-800"
              >
                Supporting evidence{" "}
                <span className="text-rose-500">*</span>
              </label>

              <div className="mt-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 transition hover:border-indigo-300 sm:p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    <svg
                      className="h-6 w-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 16V4m0 0L7 9m5-5 5 5M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"
                      />
                    </svg>
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-800">
                    Upload invoices, receipts, PDFs, or images
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Select one or more files to support this expenditure.
                  </p>

                  <input
                    id="evidence"
                    type="file"
                    multiple
                    onChange={(event) => {
                      setFiles(Array.from(event.target.files || []));
                      setCid("");
                      setTxHash("");
                      setMessage("");
                      setError("");
                    }}
                    disabled={uploading || recording}
                    className="mt-4 block w-full max-w-md text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-100 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-200 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {files.length > 0 && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Selected files
                    </h3>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {files.length} file{files.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <ul className="space-y-2">
                    {files.map((file, index) => (
                      <li
                        key={`${file.name}-${index}`}
                        className="flex min-w-0 items-start gap-3 rounded-lg bg-slate-50 p-3"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500">
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14 3v6h5M9 14h6M9 17h6"
                            />
                          </svg>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-medium text-slate-800">
                            {file.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Upload evidence action */}
            <div className="border-t border-slate-200 pt-6">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Upload evidence
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    Upload your supporting files and receive an IPFS
                    content identifier before submitting the transaction.
                  </p>
                </div>
              </div>

              <button
                onClick={uploadEvidence}
                disabled={
                  uploading ||
                  recording ||
                  !isConnected ||
                  !isCorrectNetwork ||
                  !authorized ||
                  Boolean(cid)
                }
                className={`${buttonClasses} w-full sm:w-auto`}
              >
                {uploading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {uploading
                  ? "Uploading evidence..."
                  : cid
                    ? "Evidence uploaded"
                    : "1. Upload Evidence"}
              </button>
            </div>

            {/* Uploaded evidence details and on-chain action */}
            {cid && (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m5 12 4 4L19 6"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-emerald-900">
                      Evidence uploaded successfully
                    </h2>
                    <p className="mt-1 text-sm text-emerald-800">
                      Your evidence metadata is ready. Review the CID
                      before recording spending on-chain.
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Metadata CID
                  </p>
                  <code className="mt-2 block break-all rounded-xl border border-emerald-200 bg-white p-4 text-xs leading-5 text-slate-700">
                    {cid}
                  </code>
                </div>

                {gatewayUrl ? (
                  <a
                    href={gatewayUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                  >
                    View evidence metadata
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14 4h6v6m-11 4L20 4M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"
                      />
                    </svg>
                  </a>
                ) : (
                  <p className="mt-3 text-xs leading-5 text-slate-600">
                    Set VITE_PINATA_GATEWAY in your frontend environment
                    to enable the gateway link.
                  </p>
                )}

                <div className="mt-6 border-t border-emerald-200 pt-5">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Record spending on-chain
                      </h3>
                      <p className="mt-1 text-sm leading-5 text-slate-600">
                        Confirm the transaction in MetaMask to record this
                        expenditure on Sepolia.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={submitSpending}
                    disabled={recording || uploading || !authorized}
                    className={buttonClasses}
                  >
                    {recording && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    )}
                    {recording
                      ? "Waiting for confirmation..."
                      : "2. Record Spending on Sepolia"}
                  </button>
                </div>
              </section>
            )}
          </div>
        </section>

        {/* Success message */}
        {message && (
          <div
            role="status"
            className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <svg
              className="mt-0.5 h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m5 12 4 4L19 6"
              />
            </svg>
            <p>{message}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            <svg
              className="mt-0.5 h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01"
              />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {/* Confirmed transaction */}
        {txHash && (
          <section className="mt-6 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m5 12 4 4L19 6"
                  />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-slate-900">
                  Spending transaction confirmed
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Your spending transaction has been submitted successfully
                  on Sepolia.
                </p>
                <code className="mt-3 block break-all rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                  {txHash}
                </code>
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  View transaction on Sepolia Etherscan
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14 4h6v6m-11 4L20 4M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </section>
        )}

        {/* Back navigation */}
        <div className="mt-8">
          <Link
            to="/spender"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-700"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m15 18-6-6 6-6M9 12h12"
              />
            </svg>
            Back to Spender Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
