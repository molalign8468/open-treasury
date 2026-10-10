import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useSearchParams } from "react-router-dom";

import { getAllSpendings } from "../services/budgetRegistry";
import { listenToContractEvent } from "../services/contractEvents";

export default function SpendingExplorer() {
  const [spendings, setSpendings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [searchParams] = useSearchParams();
  const selectedProgramId = searchParams.get("programId");

  const loadSpendings = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);

      setError("");

      const data = await getAllSpendings();
      setSpendings(data);
    } catch (err) {
      setError(
        err.shortMessage ||
          err.reason ||
          err.message ||
          "Failed to load spending records."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        setLoading(true);
        setError("");

        const data = await getAllSpendings();

        if (!cancelled) {
          setSpendings(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.shortMessage ||
              err.reason ||
              err.message ||
              "Failed to load spending records."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initialLoad();

    const refresh = () => {
      if (!cancelled) {
        loadSpendings();
      }
    };

    const cleanup = listenToContractEvent(
      "SpendingRecorded",
      refresh
    );

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [loadSpendings]);

  const gateway = (
    import.meta.env.VITE_PINATA_GATEWAY || ""
  )
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  function formatDate(timestamp) {
    const date = new Date(Number(timestamp) * 1000);

    return Number.isNaN(date.getTime())
      ? "Unknown"
      : date.toLocaleString();
  }

  // Filter by the selected program and the user's search term.
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return spendings.filter((spending) => {
      const matchesProgram =
        selectedProgramId === null ||
        String(spending.programId) === selectedProgramId;

      const matchesSearch =
        !query ||
        [
          spending.id,
          spending.programId,
          spending.metadataCID,
          spending.recordedBy,
        ].some((value) =>
          String(value ?? "").toLowerCase().includes(query)
        );

      return matchesProgram && matchesSearch;
    });
  }, [spendings, search, selectedProgramId]);

  // Group the filtered records by program ID.
  const groupedSpendings = useMemo(() => {
    const groups = new Map();

    for (const spending of filtered) {
      const programId = String(spending.programId);

      if (!groups.has(programId)) {
        groups.set(programId, []);
      }

      groups.get(programId).push(spending);
    }

    return [...groups.entries()].sort(([a], [b]) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }, [filtered]);

  // Sum raw on-chain integer amounts without floating-point errors.
  function getProgramTotal(records) {
    try {
      return records
        .reduce(
          (total, spending) =>
            total + BigInt(String(spending.amount ?? 0)),
          0n
        )
        .toString();
    } catch {
      return "Unable to calculate";
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-10 py-8 shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
          <p className="mt-4 font-medium text-slate-700">
            Loading spending records...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-2 bg-indigo-600" />

          <div className="p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              OpenTreasury · Public Records
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Government Spending Explorer
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Explore public expenditures grouped by government
              program. Inspect transaction details and supporting
              evidence.
            </p>

            {selectedProgramId !== null && (
              <div className="mt-6 flex flex-col gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                    Selected Program
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-indigo-950">
                    Spending for Program #{selectedProgramId}
                  </h2>
                </div>

                <Link
                  to="/spending"
                  className="inline-flex w-fit items-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-600 hover:text-white"
                >
                  ← View All Spending
                </Link>
              </div>
            )}
          </div>
        </header>

        {error && (
          <div
            className="mt-6 flex flex-col gap-4 rounded-2xl border border-red-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
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
                    d="M12 8v4m0 4h.01M10.3 3.9 1.8 18.5A1.7 1.7 0 0 0 3.3 21h17.4a1.7 1.7 0 0 0 1.5-2.5L13.7 3.9a2 2 0 0 0-3.4 0Z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  Unable to load spending records
                </h2>
                <p className="mt-1 text-sm leading-6 text-red-600">
                  {error}
                </p>
              </div>
            </div>

            <button
              onClick={() => loadSpendings(true)}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-500">
                {selectedProgramId !== null
                  ? "All spending records"
                  : "Total spending records"}
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
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
                    d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                  />
                </svg>
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              {spendings.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-500">
                {selectedProgramId !== null
                  ? "Selected program"
                  : "Programs with spending"}
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
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
                    d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"
                  />
                </svg>
              </span>
            </div>
            <p className="mt-4 break-words text-3xl font-bold tracking-tight text-slate-900">
              {selectedProgramId !== null
                ? `#${selectedProgramId}`
                : new Set(
                    spendings.map((s) => String(s.programId))
                  ).size}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-500">
                Matching records
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
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
                    d="m5 12 4 4L19 6"
                  />
                </svg>
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              {filtered.length}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <label
            htmlFor="spending-search-input"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Search spending records
          </label>

          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="11" cy="11" r="7" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16 16 4 4"
              />
            </svg>

            <input
              id="spending-search-input"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by spending ID, CID, or wallet..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </div>
        </section>

        {groupedSpendings.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 7h16M4 12h16M4 17h10M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                />
              </svg>
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              No matching records
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              {spendings.length === 0
                ? "No spending records have been recorded yet."
                : selectedProgramId !== null && filtered.length === 0
                  ? search.trim()
                    ? "No spending records for this program match your search."
                    : "No spending records have been recorded for this program yet."
                  : "No spending records match your search."}
            </p>

            {selectedProgramId !== null && (
              <Link
                to="/spending"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                View all spending records
              </Link>
            )}
          </div>
        ) : (
          <section className="mt-8 space-y-6">
            {groupedSpendings.map(([programId, records]) => (
              <article
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                key={programId}
              >
                <header className="flex flex-col gap-5 border-b border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div>
                    <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
                      Government Program
                    </span>

                    <h2 className="mt-3 text-xl font-bold text-slate-900">
                      Program #{programId}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {records.length} spending{" "}
                      {records.length === 1 ? "record" : "records"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-indigo-100 bg-white p-4 sm:min-w-52">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Total recorded amount
                    </span>
                    <p className="mt-2 break-all text-2xl font-bold text-indigo-700">
                      {getProgramTotal(records)}
                    </p>
                    <small className="mt-1 block text-xs text-slate-500">
                      Raw on-chain units
                    </small>
                  </div>
                </header>

                <div className="divide-y divide-slate-100">
                  {records.map((spending) => (
                    <div
                      className="p-5 transition hover:bg-slate-50/70 sm:p-6"
                      key={String(spending.id)}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <h3 className="text-base font-bold text-slate-900">
                          <Link
                            className="transition hover:text-indigo-600"
                            to={`/spending/${spending.id}`}
                          >
                            Spending #{spending.id} →
                          </Link>
                        </h3>

                        <span className="inline-flex w-fit rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-700">
                          {String(spending.amount)} raw units
                        </span>
                      </div>

                      <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="min-w-0 rounded-xl border border-slate-100 p-3">
                          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Program ID
                          </dt>
                          <dd className="mt-2 break-words text-sm font-medium text-slate-800">
                            {String(spending.programId)}
                          </dd>
                        </div>

                        <div className="min-w-0 rounded-xl border border-slate-100 p-3">
                          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Recorded by
                          </dt>
                          <dd className="mt-2 break-all font-mono text-sm text-slate-700">
                            {spending.recordedBy || "Unknown"}
                          </dd>
                        </div>

                        <div className="min-w-0 rounded-xl border border-slate-100 p-3">
                          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Recorded at
                          </dt>
                          <dd className="mt-2 text-sm leading-6 text-slate-700">
                            {formatDate(spending.timestamp)}
                          </dd>
                        </div>

                        <div className="min-w-0 rounded-xl border border-slate-100 p-3">
                          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Evidence CID
                          </dt>
                          <dd className="mt-2 break-all font-mono text-sm text-slate-700">
                            {spending.metadataCID || "No evidence CID"}
                          </dd>
                        </div>
                      </dl>

                      {spending.metadataCID && gateway && (
                        <div className="mt-4">
                          <a
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:border-emerald-600 hover:bg-emerald-600 hover:text-white"
                            href={`https://${gateway}/ipfs/${encodeURIComponent(
                              spending.metadataCID
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14 3h7v7m-1-6L10 14M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"
                              />
                            </svg>
                            View evidence on IPFS ↗
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
