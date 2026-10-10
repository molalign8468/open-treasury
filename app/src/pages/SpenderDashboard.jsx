import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWalletStore } from "../stores/walletStore";
import {
  getAllPrograms,
  isAuthorizedSpender,
} from "../services/budgetRegistry";

function getRemainingAmount(allocatedAmount, spentAmount) {
  return (
    BigInt(allocatedAmount ?? 0) -
    BigInt(spentAmount ?? 0)
  );
}


function formatAmount(amount) {
  try {
    return BigInt(String(amount ?? 0)).toLocaleString();
  } catch {
    return "Unavailable";
  }
}

function SpenderDashboard() {
  const account = useWalletStore((state) => state.account);
  const isConnected = useWalletStore((state) => state.isConnected);
  const isCorrectNetwork = useWalletStore(
    (state) => state.isCorrectNetwork
  );
  const connectWallet = useWalletStore((state) => state.connectWallet);
  const switchNetwork = useWalletStore((state) => state.switchNetwork);

  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setError("");

      if (!isConnected || !account || !isCorrectNetwork) {
        setAuthorized(false);
        setPrograms([]);
        setChecking(false);
        setLoadingPrograms(false);
        return;
      }

      setChecking(true);
      setLoadingPrograms(true);

      try {
        const [permission, allPrograms] = await Promise.all([
          isAuthorizedSpender(account),
          getAllPrograms(),
        ]);

        if (!cancelled) {
          setAuthorized(permission);
          setPrograms(allPrograms);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.shortMessage ||
              err.reason ||
              err.message ||
              "Failed to load spender information."
          );
          setPrograms([]);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
          setLoadingPrograms(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [account, isConnected, isCorrectNetwork]);

  const canRecordSpending =
    isConnected && isCorrectNetwork && authorized;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-2 bg-indigo-600" />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                  OpenTreasury / Spending
                </p>

                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Spender Dashboard
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  View government-funded programs, verify your wallet
                  permissions, and review program allocations and spending.
                </p>
              </div>

              <Link
                to="/budgets"
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <span aria-hidden="true">←</span>
                Browse Budgets
              </Link>
            </div>
          </div>
        </header>

        {/* Wallet and Authorization */}
        <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 9h18m-5 5h2"
                  />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-500">
                  Wallet Connection
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {isConnected ? "Wallet Connected" : "Connect Your Wallet"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {isConnected
                    ? "Your wallet is connected to OpenTreasury."
                    : "Connect MetaMask to verify your spender permissions."}
                </p>

                {isConnected && account && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Connected Address
                    </p>
                    <p className="mt-2 break-all font-mono text-sm text-slate-700">
                      {account}
                    </p>
                  </div>
                )}

                {!isConnected && (
                  <button
                    type="button"
                    onClick={connectWallet}
                    className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Connect MetaMask
                  </button>
                )}
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
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
                    d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9 12 2 2 4-4"
                  />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-500">
                  Network & Permissions
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {!isConnected
                    ? "Wallet Not Connected"
                    : !isCorrectNetwork
                      ? "Incorrect Network"
                      : checking
                        ? "Checking Authorization..."
                        : authorized
                          ? "Authorized Spender"
                          : "Access Restricted"}
                </h2>

                <div className="mt-3">
                  {!isConnected ? (
                    <p className="text-sm leading-6 text-slate-500">
                      Connect your wallet to check your authorization status.
                    </p>
                  ) : !isCorrectNetwork ? (
                    <p className="text-sm leading-6 text-amber-700">
                      Switch to the Sepolia test network to access contract data.
                    </p>
                  ) : checking ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-600" />
                      Verifying permissions on the blockchain...
                    </div>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
                        authorized
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                          : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          authorized ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                      {authorized ? "Permission Verified" : "Not Authorized"}
                    </span>
                  )}
                </div>

                {isConnected && !isCorrectNetwork && (
                  <button
                    type="button"
                    onClick={switchNetwork}
                    className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Switch to Sepolia
                  </button>
                )}
              </div>
            </div>
          </article>
        </section>

        {/* Errors */}
        {error && (
          <section
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-white p-6 shadow-sm"
          >
            <h2 className="font-bold text-slate-900">
              Unable to load dashboard
            </h2>
            <p className="mt-2 break-words text-sm leading-6 text-red-600">
              {error}
            </p>
          </section>
        )}

        {/* Programs */}
        <section className="mt-8">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                Program Overview
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                Available Programs
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review program allocations, spending, and remaining funds.
              </p>
            </div>

            <span className="inline-flex w-fit items-center rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
              {loadingPrograms
                ? "Loading..."
                : `${programs.length} ${
                    programs.length === 1 ? "Program" : "Programs"
                  }`}
            </span>
          </div>

          {loadingPrograms ? (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-600" />
              <p className="text-sm font-medium text-slate-600">
                Loading programs...
              </p>
            </div>
          ) : programs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
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
                    d="M4 7h16M4 12h16M4 17h10M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                  />
                </svg>
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No programs found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                No programs are currently available to display.
              </p>

              <Link
                to="/budgets"
                className="mt-5 inline-flex items-center gap-2 font-semibold text-indigo-600 transition hover:text-indigo-800"
              >
                Browse Budgets <span aria-hidden="true">→</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {programs.map((program) => (
                <article
                  key={String(program.id)}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
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
                            d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"
                          />
                        </svg>
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Program #{String(program.id)}
                        </p>
                        <h3 className="mt-1 break-words text-lg font-bold text-slate-900">
                          {program.name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Budget ID: {String(program.budgetId)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        Allocated
                      </p>
                      <p className="mt-1 break-all text-sm font-bold text-slate-900">
                        {formatAmount(program.allocatedAmount)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        Spent
                      </p>
                      <p className="mt-1 break-all text-sm font-bold text-slate-900">
                        {formatAmount(program.spentAmount)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
                      <p className="text-xs font-medium text-indigo-700">
                        Remaining
                      </p>
                      <p className="mt-1 break-all text-sm font-bold text-indigo-900">
                        {formatAmount(
                          getRemainingAmount(
                            program.allocatedAmount,
                            program.spentAmount
                          )
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <Link
                      to={`/spending?programId=${encodeURIComponent(
                        String(program.id)
                      )}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:border-indigo-600 hover:bg-indigo-600 hover:text-white sm:w-auto"
                    >
                      View Program Spending
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Spending Actions */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            Spending Access
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-900">
            Ready to record spending?
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {canRecordSpending
              ? "Your wallet is authorized. You can proceed to the spending workflow."
              : "Connect your wallet, switch to Sepolia, and verify spender authorization before recording a transaction."}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/spending/create"
              aria-disabled={!canRecordSpending}
              onClick={(event) => {
                if (!canRecordSpending) event.preventDefault();
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition ${
                canRecordSpending
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "cursor-not-allowed bg-slate-100 text-slate-400"
              }`}
            >
              Record Spending <span aria-hidden="true">→</span>
            </Link>

            <Link
              to="/budgets"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Browse Budgets
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default SpenderDashboard;
