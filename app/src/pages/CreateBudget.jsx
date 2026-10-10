import { useState } from "react";
import { Link } from "react-router-dom";

import { useWalletStore } from "../stores/walletStore";
import { useCreateBudgetStore } from "../stores/createBudgetStore";
import { useBudgetStore } from "../stores/budgetStore";

function CreateBudget() {
  const [ministry, setMinistry] = useState("");
  const [fiscalYear, setFiscalYear] = useState("");
  const [amount, setAmount] = useState("");

  const {
    account,
    isConnected,
    isCorrectNetwork,
    switchNetwork,
  } = useWalletStore();

  const {
    loading,
    error,
    txHash,
    submitBudget,
    reset,
  } = useCreateBudgetStore();

  const loadBudgets = useBudgetStore(
    (state) => state.loadBudgets
  );

  async function handleSubmit(event) {
    event.preventDefault();
    reset();

    if (!isConnected || !account) {
      return;
    }

    if (!isCorrectNetwork) {
      return;
    }

    const year = Number(fiscalYear);

    if (
      !ministry.trim() ||
      !Number.isInteger(year) ||
      year < 1 ||
      year > 65535 ||
      !/^[1-9]\d*$/.test(amount.trim())
    ) {
      return;
    }

    const result = await submitBudget(
      ministry.trim(),
      year,
      amount.trim()
    );

    if (result) {
      await loadBudgets();
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/budgets"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-indigo-600"
        >
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
              d="m15 18-6-6 6-6"
            />
          </svg>
          Back to budgets
        </Link>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-white px-6 py-7 sm:px-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
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
                    d="M3 21h18M5 21V7l8-4 8 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01M11 21v-4h2v4"
                  />
                </svg>
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Create Government Budget
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Register a ministry budget on the blockchain to
                  make public allocations easier to verify and
                  track.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <rect
                      width="16"
                      height="12"
                      x="4"
                      y="6"
                      rx="2"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 10h8M8 14h4"
                    />
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    Connected wallet
                  </p>
                  <p className="mt-1 break-all font-mono text-xs leading-5 text-slate-600">
                    {account || "Not connected"}
                  </p>

                  {!isConnected && (
                    <p className="mt-3 text-sm text-amber-700">
                      Connect your authorized ministry wallet
                      first.
                    </p>
                  )}

                  {isConnected && !isCorrectNetwork && (
                    <div className="mt-3">
                      <p className="mb-3 text-sm text-amber-700">
                        Switch to the Sepolia network before
                        creating a budget.
                      </p>
                      <button
                        type="button"
                        onClick={switchNetwork}
                        className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-100"
                      >
                        Switch to Sepolia
                      </button>
                    </div>
                  )}
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    !isConnected
                      ? "bg-slate-200 text-slate-600"
                      : !isCorrectNetwork
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {!isConnected
                    ? "Disconnected"
                    : !isCorrectNetwork
                    ? "Wrong network"
                    : "Connected"}
                </span>
              </div>
            </section>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="ministry"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Ministry name
                </label>
                <input
                  id="ministry"
                  value={ministry}
                  onChange={(event) =>
                    setMinistry(event.target.value)
                  }
                  placeholder="Ministry of Health"
                  maxLength={100}
                  required
                  className={inputClass}
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Enter the official name of the ministry
                  receiving the allocation.
                </p>
              </div>

              <div>
                <label
                  htmlFor="fiscalYear"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Fiscal year
                </label>
                <input
                  id="fiscalYear"
                  type="number"
                  min="1"
                  max="65535"
                  step="1"
                  value={fiscalYear}
                  onChange={(event) =>
                    setFiscalYear(event.target.value)
                  }
                  placeholder="2026"
                  required
                  className={inputClass}
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Enter a whole-number fiscal year supported by
                  the contract.
                </p>
              </div>

              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Allocated amount
                </label>
                <div className="relative">
                  <input
                    id="amount"
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(event) =>
                      setAmount(event.target.value)
                    }
                    placeholder="1000000"
                    required
                    className={`${inputClass} pr-20`}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-xs font-medium text-slate-500">
                    Units
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Use the same units as your contract's budget
                  amounts. Enter a positive whole number.
                </p>
              </div>

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
                      Transaction failed
                    </p>
                    <p className="mt-1 break-words text-sm text-red-700">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-200 pt-6">
                <button
                  type="submit"
                  disabled={
                    loading ||
                    !isConnected ||
                    !isCorrectNetwork
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:w-auto sm:min-w-48"
                >
                  {loading ? (
                    <>
                      <svg
                        className="h-5 w-5 animate-spin"
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
                      Waiting for confirmation...
                    </>
                  ) : (
                    <>
                      Create Budget
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
                    </>
                  )}
                </button>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  You will need to approve the transaction in
                  your wallet.
                </p>
              </div>
            </form>

            {txHash && (
              <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m5 12 4 4L19 6"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-emerald-900">
                      Budget transaction confirmed
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-emerald-800">
                      Your transaction has been submitted
                      successfully. You can view its details on
                      Etherscan.
                    </p>

                    <a
                      href={`https://sepolia.etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 break-all text-sm font-semibold text-emerald-800 underline decoration-emerald-400 underline-offset-4 hover:text-emerald-950"
                    >
                      View transaction on Etherscan
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-4 w-4 shrink-0"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14 3h7v7m-1-6-9 9"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"
                        />
                      </svg>
                    </a>

                    <div className="mt-5 flex flex-col gap-3 border-t border-emerald-200 pt-4 sm:flex-row sm:items-center">
                      <Link
                        to="/budgets"
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                      >
                        View public budgets
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setMinistry("");
                          setFiscalYear("");
                          setAmount("");
                          reset();
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                      >
                        Create another budget
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-slate-500">
          OpenTreasury · Transparent public budgets, verifiable
          on-chain.
        </p>
      </div>
    </main>
  );
}

export default CreateBudget;
