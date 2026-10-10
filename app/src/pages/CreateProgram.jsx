import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useBudgetStore } from "../stores/budgetStore";
import { useProgramStore } from "../stores/programStore";
import { useWalletStore } from "../stores/walletStore";

function CreateProgram() {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [budgetId, setBudgetId] = useState("");

  const {
    budgets,
    loading: budgetsLoading,
    error: budgetError,
    loadBudgets,
  } = useBudgetStore();

  const {
    loading,
    error,
    txHash,
    createProgram,
    clearResult,
  } = useProgramStore();

  const {
    account,
    isConnected,
    isCorrectNetwork,
  } = useWalletStore();

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  async function handleSubmit(event) {
    event.preventDefault();
    clearResult();

    if (!isConnected || !account) {
      return;
    }

    if (!isCorrectNetwork) {
      return;
    }

    const parsedBudgetId = Number(budgetId);
    const parsedAmount = amount.trim();

    if (
      !Number.isSafeInteger(parsedBudgetId) ||
      parsedBudgetId < 1
    ) {
      return;
    }

    if (!/^[1-9]\d*$/.test(parsedAmount)) {
      return;
    }

    const selectedBudget = budgets.find(
      (budget) => budget.id === parsedBudgetId
    );

    if (!selectedBudget || !selectedBudget.active) {
      return;
    }

    const allocation = BigInt(parsedAmount);
    const remaining =
      BigInt(selectedBudget.allocatedAmount) -
      BigInt(selectedBudget.disbursedAmount);

    if (allocation > remaining) {
      return;
    }

    console.log(
      name.trim(),
      parsedAmount,
      parsedBudgetId
    );

    await createProgram(
      name.trim(),
      parsedAmount,
      parsedBudgetId
    );
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
                    d="M4 21h16M6 21V8l6-4 6 4v13M9 10h.01M9 14h.01M15 10h.01M15 14h.01M10 21v-4h4v4"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 4v4m-2-2h4"
                  />
                </svg>
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Create a Government Program
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Allocate part of an existing government budget
                  to a specific program, such as hospital
                  construction or education development.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
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
                      Connect your wallet before submitting.
                    </p>
                  )}

                  {isConnected && !isCorrectNetwork && (
                    <p className="mt-3 text-sm text-amber-700">
                      Please switch MetaMask to Sepolia.
                    </p>
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

            {budgetError && (
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
                    Error loading budgets
                  </p>
                  <p className="mt-1 break-words text-sm text-red-700">
                    {budgetError}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="budgetId"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Select budget
                </label>

                <select
                  id="budgetId"
                  value={budgetId}
                  onChange={(event) =>
                    setBudgetId(event.target.value)
                  }
                  required
                  className={inputClass}
                >
                  <option value="">
                    {budgetsLoading
                      ? "Loading budgets..."
                      : "Choose a budget"}
                  </option>

                  {budgets
                    .filter((budget) => budget.active)
                    .map((budget) => (
                      <option
                        key={budget.id}
                        value={budget.id}
                      >
                        #{budget.id} — {budget.ministry}
                        {" (Fiscal year "}
                        {budget.fiscalYear}
                        {")"}
                      </option>
                    ))}
                </select>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Select an active budget with sufficient
                  remaining funds for this program.
                </p>
              </div>

              <div>
                <label
                  htmlFor="programName"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Program name
                </label>

                <input
                  id="programName"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Hospital Construction"
                  maxLength={100}
                  required
                  className={inputClass}
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Use a clear name that describes the purpose of
                  the government program.
                </p>
              </div>

              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Program allocation
                </label>

                <input
                  id="amount"
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value)
                  }
                  placeholder="300000"
                  required
                  className={inputClass}
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Enter a positive whole number in the same units
                  as the selected budget.
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
                    budgetsLoading ||
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
                      Waiting for transaction...
                    </>
                  ) : (
                    <>
                      Create Program
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
                  Only an authorized ministry can submit this
                  transaction. Confirm the details in your wallet
                  before approving.
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
                      Transaction confirmed
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-emerald-800">
                      Program creation was mined on Sepolia.
                    </p>

                    <p className="mt-3 text-sm text-emerald-800">
                      Transaction:
                    </p>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-2 break-all text-sm font-semibold text-emerald-800 underline decoration-emerald-400 underline-offset-4 hover:text-emerald-950"
                    >
                      View on Etherscan
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

                    <div className="mt-5 border-t border-emerald-200 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setName("");
                          setAmount("");
                          setBudgetId("");
                          loadBudgets();
                          clearResult();
                        }}
                        className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:w-auto"
                      >
                        Create another program
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link
            to="/budgets"
            className="text-sm font-medium text-indigo-600 transition hover:text-indigo-800"
          >
            Browse public budgets
          </Link>
        </div>

        <p className="mt-3 text-center text-xs leading-5 text-slate-500">
          OpenTreasury · Transparent public budgets, verifiable
          on-chain.
        </p>
      </div>
    </main>
  );
}

export default CreateProgram;
