import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWalletStore } from "../stores/walletStore";
import {
  isAuthorizedMinistry,
  isAuthorizedSpender,
} from "../services/budgetRegistry";
import MinistryDashboard from "./MinistryDashboard";
import SpenderDashboard from "./SpenderDashboard";

export default function RoleDashboard() {
  const account = useWalletStore((s) => s.account);
  const isConnected = useWalletStore((s) => s.isConnected);
  const isCorrectNetwork = useWalletStore((s) => s.isCorrectNetwork);
  const connectWallet = useWalletStore((s) => s.connectWallet);
  const switchNetwork = useWalletStore((s) => s.switchNetwork);

  const [ministry, setMinistry] = useState(false);
  const [spender, setSpender] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      setMinistry(false);
      setSpender(false);
      setError("");

      if (!isConnected || !account || !isCorrectNetwork) {
        return;
      }

      setLoading(true);

      try {
        const [isMinistry, isSpender] = await Promise.all([
          isAuthorizedMinistry(account),
          isAuthorizedSpender(account),
        ]);

        if (!cancelled) {
          setMinistry(isMinistry);
          setSpender(isSpender);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.shortMessage ||
            err.reason ||
            err.message ||
            "Could not check wallet permissions."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [account, isConnected, isCorrectNetwork]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-indigo-50 via-white to-white px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  OpenTreasury
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Your Dashboard
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                  Your available workspaces depend on your wallet's
                  on-chain permissions. Access public records or
                  manage government budgets and spending when
                  authorized.
                </p>
              </div>

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-8 w-8"
                >
                  <rect
                    x="3"
                    y="3"
                    width="8"
                    height="8"
                    rx="2"
                  />
                  <rect
                    x="13"
                    y="3"
                    width="8"
                    height="5"
                    rx="2"
                  />
                  <rect
                    x="13"
                    y="10"
                    width="8"
                    height="11"
                    rx="2"
                  />
                  <rect
                    x="3"
                    y="13"
                    width="8"
                    height="8"
                    rx="2"
                  />
                </svg>
              </div>
            </div>
          </div>
        </header>

        {!isConnected && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mx-auto max-w-xl py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-7 w-7"
                >
                  <rect
                    x="4"
                    y="6"
                    width="16"
                    height="12"
                    rx="2"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 10h8M8 14h4"
                  />
                </svg>
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                Connect your wallet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                You can browse public records without a wallet.
                Connect MetaMask to check whether your account has
                ministry or spender permissions.
              </p>

              <button
                onClick={connectWallet}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <rect
                    x="4"
                    y="6"
                    width="16"
                    height="12"
                    rx="2"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 10h8M8 14h4"
                  />
                </svg>
                Connect MetaMask
              </button>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-sm text-slate-500">
                  Want to explore first?
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-4">
                  <Link
                    to="/budgets"
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Explore Budgets
                  </Link>
                  <Link
                    to="/spending"
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Explore Spending
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {isConnected && !isCorrectNetwork && (
          <section className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M10.3 3.9 2.5 17.4A1.8 1.8 0 0 0 4.1 20h15.8a1.8 1.8 0 0 0 1.6-2.6L13.7 3.9a2 2 0 0 0-3.4 0Z"
                  />
                </svg>
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900">
                  Switch to Sepolia
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Your wallet is connected to a different network.
                  Switch to Sepolia to check your permissions and
                  access your workspace.
                </p>
              </div>

              <button
                onClick={switchNetwork}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-100"
              >
                Switch Network
              </button>
            </div>
          </section>
        )}

        {loading && (
          <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4">
            <svg
              className="h-5 w-5 animate-spin text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
              />
            </svg>
            <p className="text-sm font-medium text-indigo-800">
              Checking wallet permissions...
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5 shrink-0 text-red-600"
            >
              <circle cx="12" cy="12" r="9" />
              <path
                strokeLinecap="round"
                d="M12 8v4m0 4h.01"
              />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-800">
                Could not check wallet permissions
              </p>
              <p className="mt-1 break-words text-sm leading-6 text-red-700">
                {error}
              </p>
            </div>
          </div>
        )}

        <section className="space-y-5">
          {(!ministry && !spender && isConnected) && (
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-6 w-6"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 21v-2a8 8 0 0 1 16 0v2"
                    />
                  </svg>
                </div>

                <div>
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    Public access
                  </span>
                  <h2 className="mt-3 text-xl font-bold text-slate-900">
                    Everyone
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    No special permissions are required to explore
                    public government budget information.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 21h16M6 21V8l6-4 6 4v13M9 10h.01M15 10h.01M9 14h.01M15 14h.01"
                      />
                    </svg>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-800">
                    Government budgets
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Browse public allocations.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                    >
                      <rect
                        x="4"
                        y="4"
                        width="16"
                        height="16"
                        rx="2"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 9h8M8 13h8M8 17h4"
                      />
                    </svg>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-800">
                    Government programs
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Explore funded initiatives.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16 16 4 4M8 11h6"
                      />
                    </svg>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-800">
                    Spending and evidence
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Inspect spending records.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row">
                <Link
                  to="/budgets"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Explore Budgets
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12h14m-7-7 7 7-7 7"
                    />
                  </svg>
                </Link>

                <Link
                  to="/spending"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Explore Spending
                </Link>
              </div>
            </article>
          )}

          {ministry && <MinistryDashboard />}

          {spender && <SpenderDashboard />}
        </section>

        {isConnected &&
          isCorrectNetwork &&
          !loading &&
          !error &&
          !ministry &&
          !spender && (
            <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5 shrink-0 text-slate-500"
              >
                <circle cx="12" cy="12" r="9" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 11v5m0-8h.01"
                />
              </svg>
              <p className="text-sm leading-6 text-slate-600">
                Your wallet has public access, but no ministry or
                spender permissions have been detected.
              </p>
            </div>
          )}
      </div>
    </main>
  );
}
