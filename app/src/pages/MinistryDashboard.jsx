import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useWalletStore } from "../stores/walletStore";
import { useBudgetStore } from "../stores/budgetStore";
import { isAuthorizedMinistry } from "../services/budgetRegistry";

function formatAmount(value) {
  return BigInt(value || "0").toLocaleString();
}

export default function MinistryDashboard() {
  const account = useWalletStore((state) => state.account);
  const isConnected = useWalletStore((state) => state.isConnected);
  const isCorrectNetwork = useWalletStore(
    (state) => state.isCorrectNetwork
  );
  const connectWallet = useWalletStore(
    (state) => state.connectWallet
  );
  const switchNetwork = useWalletStore(
    (state) => state.switchNetwork
  );

  const budgets = useBudgetStore((state) => state.budgets);
  const loadingBudgets = useBudgetStore((state) => state.loading);
  const budgetError = useBudgetStore((state) => state.error);
  const loadBudgets = useBudgetStore((state) => state.loadBudgets);

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(false);
  const [permissionError, setPermissionError] = useState("");

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  useEffect(() => {
    let cancelled = false;

    async function checkPermission() {
      if (!account || !isConnected || !isCorrectNetwork) {
        setIsAuthorized(false);
        setPermissionError("");
        return;
      }

      setCheckingPermission(true);
      setPermissionError("");

      try {
        const authorized = await isAuthorizedMinistry(account);

        if (!cancelled) {
          setIsAuthorized(authorized);
        }
      } catch (error) {
        if (!cancelled) {
          setIsAuthorized(false);
          setPermissionError(
            error.shortMessage || error.message || "Could not check permission."
          );
        }
      } finally {
        if (!cancelled) {
          setCheckingPermission(false);
        }
      }
    }

    checkPermission();

    return () => {
      cancelled = true;
    };
  }, [account, isConnected, isCorrectNetwork]);

  const activeBudgets = useMemo(
    () => budgets.filter((budget) => budget.active),
    [budgets]
  );

  const totals = useMemo(() => {
    return activeBudgets.reduce(
      (result, budget) => {
        result.allocated += BigInt(budget.allocatedAmount || "0");
        result.disbursed += BigInt(budget.disbursedAmount || "0");
        return result;
      },
      { allocated: 0n, disbursed: 0n }
    );
  }, [activeBudgets]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Page heading */}
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
            Ministry Portal
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Ministry Dashboard
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            Manage government budget records on OpenTreasury.
          </p>
        </div>

        {/* Wallet connection */}
        {!isConnected && (
          <section className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="3" />
                    <path d="M3 9h18M16 14h2" />
                  </svg>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Connect your wallet
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Connect the authorized ministry wallet to access ministry actions.
                  </p>
                </div>
              </div>

              <button
                onClick={connectWallet}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Connect MetaMask
              </button>
            </div>
          </section>
        )}

        {/* Network warning */}
        {isConnected && !isCorrectNetwork && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    !
                  </span>
                  <h2 className="text-lg font-semibold text-amber-900">
                    Wrong network
                  </h2>
                </div>

                <p className="mt-3 text-sm leading-6 text-amber-800">
                  Please switch MetaMask to Sepolia to use OpenTreasury.
                </p>
              </div>

              <button
                onClick={switchNetwork}
                className="rounded-lg bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                Switch to Sepolia
              </button>
            </div>
          </section>
        )}

        {/* Wallet status */}
        {isConnected && isCorrectNetwork && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Wallet status
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Connected account
                </p>
                <p className="mt-2 break-all font-mono text-sm text-slate-700">
                  {account}
                </p>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Sepolia Network
              </span>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              {checkingPermission && (
                <p className="text-sm text-slate-600">
                  Checking ministry authorization...
                </p>
              )}

              {!checkingPermission && !permissionError && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-slate-600">
                    Authorization:
                  </span>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
                      isAuthorized
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isAuthorized ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    />
                    {isAuthorized
                      ? "Authorized ministry"
                      : "Not authorized"}
                  </span>
                </div>
              )}

              {permissionError && (
                <p
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                >
                  Permission check failed: {permissionError}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Budget overview */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Budget overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              A summary of your active government budgets.
            </p>
          </div>

          {loadingBudgets && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              Loading budgets...
            </div>
          )}

          {budgetError && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
            >
              Budget error: {budgetError}
            </p>
          )}

          {!loadingBudgets && !budgetError && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500">
                    Active budgets
                  </p>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <rect x="4" y="3" width="16" height="18" rx="2" />
                      <path d="M8 8h8M8 12h8M8 16h5" />
                    </svg>
                  </span>
                </div>

                <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                  {activeBudgets.length.toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Currently active records
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500">
                    Total allocated
                  </p>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </span>
                </div>

                <p className="mt-5 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {formatAmount(totals.allocated.toString())}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Total funds allocated
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md sm:col-span-2 xl:col-span-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500">
                    Total disbursed
                  </p>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path d="M7 7h10v10M17 7 7 17M4 4v16h16" />
                    </svg>
                  </span>
                </div>

                <p className="mt-5 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {formatAmount(totals.disbursed.toString())}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Total funds disbursed
                </p>
              </div>
            </div>
          )}

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Amounts are displayed in the integer units stored by the contract.
          </p>
        </section>

        {/* Spender access */}
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Spender access management
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage access for authorized budget spenders.
            </p>
          </div>

          <Link
            to="/spenders/access"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
          >
            Manage Spender Access
            <span className="ml-2" aria-hidden="true">→</span>
          </Link>
        </section>

        {/* Quick actions */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Quick actions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Access common budget management tasks.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {isAuthorized && isConnected && isCorrectNetwork ? (
              <>
                <Link
                  to="/budgets/create"
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100">
                      <svg
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden="true"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Create a budget
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Create a new budget record.
                      </p>
                    </div>
                  </div>

                  <span className="text-xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600">
                    →
                  </span>
                </Link>

                <Link
                  to="/programs/create"
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                      <svg
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden="true"
                      >
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <path d="M8 9h8M8 13h5" />
                      </svg>
                    </span>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Create a program
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Add a program under a budget.
                      </p>
                    </div>
                  </div>

                  <span className="text-xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600">
                    →
                  </span>
                </Link>
              </>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 md:col-span-2">
                <p className="text-sm leading-6 text-slate-600">
                  Connect an authorized ministry wallet on Sepolia to use these actions.
                </p>
              </div>
            )}

            <Link
              to="/budgets"
              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md md:col-span-2"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-indigo-50 group-hover:text-indigo-600">
                  <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path d="M4 5h16M4 12h16M4 19h16" />
                  </svg>
                </span>

                <div>
                  <h3 className="font-semibold text-slate-900">
                    View all budgets
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Browse budget records on OpenTreasury.
                  </p>
                </div>
              </div>

              <span className="text-xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600">
                →
              </span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
