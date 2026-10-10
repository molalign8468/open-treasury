import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAllSpendings } from "../services/budgetRegistry";
import CitizenReports from "./CitizenReports";

export default function SpendingDetail() {
  const { id } = useParams();

  const [spending, setSpending] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [error, setError] = useState("");
  const [metadataError, setMetadataError] = useState("");

  const gateway = (
    import.meta.env.VITE_PINATA_GATEWAY || ""
  )
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  function ipfsUrl(cid) {
    if (!cid || !gateway) return null;

    return `https://${gateway}/ipfs/${encodeURIComponent(cid)}`;
  }

  useEffect(() => {
    let cancelled = false;

    async function loadSpending() {
      setLoading(true);
      setError("");
      setSpending(null);
      setMetadata(null);
      setMetadataError("");

      try {
        const records = await getAllSpendings();

        const record = records.find(
          (item) => String(item.id) === String(id)
        );

        if (!record) {
          throw new Error(`Spending record #${id} was not found.`);
        }

        if (!cancelled) {
          setSpending(record);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.shortMessage ||
              err.reason ||
              err.message ||
              "Failed to load spending details."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSpending();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Fetch the JSON metadata referenced by the on-chain CID.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadMetadata() {
      if (!spending?.metadataCID) return;

      const url = ipfsUrl(spending.metadataCID);

      if (!url) {
        setMetadataError(
          "Configure VITE_PINATA_GATEWAY to display IPFS metadata."
        );
        return;
      }

      setMetadataLoading(true);
      setMetadata(null);
      setMetadataError("");

      try {
        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `IPFS gateway returned HTTP ${response.status}.`
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setMetadata(data);
        }
      } catch (err) {
        if (!cancelled && err.name !== "AbortError") {
          setMetadataError(
            err.message ||
              "Unable to load IPFS metadata."
          );
        }
      } finally {
        if (!cancelled) setMetadataLoading(false);
      }
    }

    loadMetadata();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [spending?.metadataCID]);

  function formatDate(timestamp) {
    if (timestamp === null || timestamp === undefined) {
      return "Unknown";
    }

    const date = new Date(Number(timestamp) * 1000);

    return Number.isNaN(date.getTime())
      ? "Unknown"
      : date.toLocaleString();
  }

  function formatMetadataDate(value) {
    if (!value) return "Unknown";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString();
  }

  function formatFileSize(bytes) {
    const size = Number(bytes);

    if (!Number.isFinite(size) || size < 0) {
      return "Unknown size";
    }

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 py-12">
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-10 py-8 shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
          <p className="mt-4 font-medium text-slate-700">
            Loading spending details...
          </p>
        </div>
      </main>
    );
  }

  if (error || !spending) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <Link
            to="/spending"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
          >
            ← Back to Spending Explorer
          </Link>

          <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M10.3 3.9 1.8 18.5A1.7 1.7 0 0 0 3.3 21h17.4a1.7 1.7 0 0 0 1.5-2.5L13.7 3.9a2 2 0 0 0-3.4 0Z"
              />
            </svg>
          </div>

          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Spending record unavailable
          </h1>
          <p
            role="alert"
            className="mt-2 text-sm leading-6 text-red-600"
          >
            {error || "Spending record not found."}
          </p>
        </div>
      </main>
    );
  }

  const evidence = Array.isArray(metadata?.evidence)
    ? metadata.evidence
    : [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
          to="/spending"
        >
          ← Back to Spending Explorer
        </Link>


        <header className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-2 bg-indigo-600" />

          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                Public Spending Record
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Spending #{String(spending.id)}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Detailed expenditure information and supporting evidence.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              On-chain record
            </span>
          </div>
        </header>

        <section className="mt-6 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
          <div className="bg-indigo-600 px-6 py-5 sm:px-8">
            <p className="text-sm font-medium text-indigo-100">
              Recorded amount
            </p>
            <strong className="mt-2 block break-all text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {String(spending.amount)}
            </strong>
            <small className="mt-2 block text-sm text-indigo-100">
              Raw on-chain units; currency formatting not applied.
            </small>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              Transaction Overview
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Spending Information
            </h2>
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Spending ID
              </dt>
              <dd className="mt-2 break-words text-sm font-semibold text-slate-900">
                {String(spending.id)}
              </dd>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Program ID
              </dt>
              <dd className="mt-2 break-words text-sm font-semibold text-slate-900">
                {String(spending.programId)}
              </dd>
            </div>

            <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Recorded by
              </dt>
              <dd className="mt-2 break-all font-mono text-sm text-slate-800">
                {spending.recordedBy || "Unknown"}
              </dd>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Transaction timestamp
              </dt>
              <dd className="mt-2 text-sm leading-6 text-slate-800">
                {formatDate(spending.timestamp)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                Decentralized Evidence
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                IPFS Evidence Metadata
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Metadata retrieved using the CID stored on-chain.
              </p>
            </div>

            {spending.metadataCID && ipfsUrl(spending.metadataCID) && (
              <a
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-600 hover:text-white"
                href={ipfsUrl(spending.metadataCID)}
                target="_blank"
                rel="noopener noreferrer"
              >
                View raw JSON ↗
              </a>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Metadata CID
            </span>
            <code className="mt-2 block break-all font-mono text-sm leading-6 text-slate-800">
              {spending.metadataCID || "No metadata CID"}
            </code>
          </div>

          {metadataLoading && (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-600" />
              <p className="text-sm font-medium text-indigo-800">
                Loading IPFS metadata...
              </p>
            </div>
          )}

          {metadataError && (
            <p
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
              role="alert"
            >
              {metadataError}
            </p>
          )}

          {metadata && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Description
                  </span>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
                    {metadata.description || "No description provided."}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Metadata created
                  </span>
                  <p className="mt-2 text-sm leading-6 text-slate-800">
                    {formatMetadataDate(metadata.createdAt)}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-bold text-slate-900">
                    Supporting Evidence Files
                  </h3>
                  <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {evidence.length} files
                  </span>
                </div>

                {evidence.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                    No evidence files are listed in this metadata.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {evidence.map((file, index) => {
                      const fileUrl = ipfsUrl(file.cid);
                      const isImage =
                        typeof file.type === "string" &&
                        file.type.startsWith("image/");

                      return (
                        <article
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-indigo-200 hover:shadow-sm"
                          key={`${file.cid || file.filename}-${index}`}
                        >
                          {isImage && fileUrl && (
                            <a
                              className="block overflow-hidden bg-slate-100"
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                className="max-h-80 w-full object-contain"
                                src={fileUrl}
                                alt={file.filename || "Evidence preview"}
                                loading="lazy"
                              />
                            </a>
                          )}

                          <div className="p-5">
                            <div className="flex items-start gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <svg
                                  className="h-5 w-5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6M8 13h8M8 17h8"
                                  />
                                </svg>
                              </div>

                              <div className="min-w-0 flex-1">
                                <h4 className="break-words font-bold text-slate-900">
                                  {file.filename || "Unnamed file"}
                                </h4>

                                <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  <div>
                                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                      File type
                                    </dt>
                                    <dd className="mt-1 break-words text-sm text-slate-700">
                                      {file.type || "Unknown"}
                                    </dd>
                                  </div>

                                  <div>
                                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                      File size
                                    </dt>
                                    <dd className="mt-1 text-sm text-slate-700">
                                      {formatFileSize(file.size)}
                                    </dd>
                                  </div>
                                </dl>
                              </div>
                            </div>

                            <div className="mt-5 rounded-xl bg-slate-50 p-3">
                              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                File CID
                              </span>
                              <code className="mt-1 block break-all font-mono text-xs leading-5 text-slate-700">
                                {file.cid || "Not provided"}
                              </code>
                            </div>

                            {fileUrl ? (
                              <a
                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Open Evidence File ↗
                              </a>
                            ) : (
                              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
                                Configure your IPFS gateway to open this file.
                              </p>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          <CitizenReports spendingId={spending.id} />
        </section>

        <footer className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="9" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 11v5m0-8h.01"
              />
            </svg>
            <p className="text-sm leading-6 text-slate-500">
              This page displays on-chain spending information and the
              metadata returned by the configured IPFS gateway. File
              contents and claims in the metadata should be independently
              verified.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
