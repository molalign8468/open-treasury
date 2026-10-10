import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useBudgetStore } from "../stores/budgetStore";

function formatDate(timestamp) {
  const date = new Date(Number(timestamp) * 1000);

  return Number.isNaN(date.getTime())
    ? "Unknown"
    : date.toLocaleString();
}

function getRemainingAmount(allocatedAmount, spentAmount) {
  try {
    return (
      BigInt(String(allocatedAmount ?? 0)) -
      BigInt(String(spentAmount ?? 0))
    ).toString();
  } catch {
    return "Unavailable";
  }
}

function BudgetDetails() {
  const { id } = useParams();
  const budgetId = Number(id);

  const {
    selectedBudget,
    programs,
    loading,
    error,
    loadBudget,
    loadProgramsByBudget,
  } = useBudgetStore();

  useEffect(() => {
    if (!Number.isSafeInteger(budgetId) || budgetId < 1) {
      return;
    }

    loadBudget(budgetId);
    loadProgramsByBudget(budgetId);
  }, [budgetId, loadBudget, loadProgramsByBudget]);

  const retry = () => {
    loadBudget(budgetId);
    loadProgramsByBudget(budgetId);
  };

  if (!Number.isSafeInteger(budgetId) || budgetId < 1) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-white p-8 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
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
                d="M12 9v4m0 4h.01M10.3 3.9 1.8 18.5A1.7 1.7 0 0 0 3.3 21h17.4a1.7 1.7 0 0 0 1.5-2.5L13.7 3.9a2 2 0 0 0-3.4 0Z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Invalid budget ID
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            The budget ID in the URL is invalid.
          </p>
          <Link
            to="/budgets"
            className="mt-6 inline-flex items-center gap-2 font-semibold text-indigo-600 transition hover:text-indigo-800"
          >
            <span aria-hidden="true">←</span> All Budgets
          </Link>
        </div>
      </main>
    );
  }

  if (loading && !selectedBudget) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-10 py-8 shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
          <p className="mt-4 font-medium text-slate-700">
            Loading budget details...
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Retrieving budget information
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
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

          <h1 className="text-xl font-bold text-slate-900">
            Unable to load budget
          </h1>
          <p role="alert" className="mt-2 text-sm text-red-600">
            Error: {error}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={retry}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Retry
            </button>
            <Link
              to="/budgets"
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ← All Budgets
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!selectedBudget || Number(selectedBudget.id) !== budgetId) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <svg
              className="h-7 w-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Budget not found
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Budget not found or not loaded yet.
          </p>
          <Link
            to="/budgets"
            className="mt-6 inline-flex items-center gap-2 font-semibold text-indigo-600 transition hover:text-indigo-800"
          >
            <span aria-hidden="true">←</span> All Budgets
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/budgets"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
        >
          <span aria-hidden="true">←</span>
          All Budgets
        </Link>

        <header className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-2 bg-indigo-600" />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                  Government Budget Record
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {selectedBudget.ministry}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Budget #{selectedBudget.id}
                </p>
              </div>

              <span
                className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
                  selectedBudget.active
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                    : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    selectedBudget.active
                      ? "bg-emerald-500"
                      : "bg-slate-400"
                  }`}
                />
                {selectedBudget.active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">
                  Fiscal Year
                </p>
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {selectedBudget.fiscalYear}
                </p>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                <p className="text-sm font-medium text-indigo-700">
                  Allocated Amount
                </p>
                <p className="mt-2 break-all text-xl font-bold text-slate-900">
                  {String(selectedBudget.allocatedAmount)}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-sm font-medium text-emerald-700">
                  Disbursed Amount
                </p>
                <p className="mt-2 break-all text-xl font-bold text-slate-900">
                  {String(selectedBudget.disbursedAmount)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">
                  Created At
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                  {formatDate(selectedBudget.createdAt)}
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Created By
              </p>
              <p className="mt-2 break-all font-mono text-sm text-slate-700">
                {selectedBudget.createdBy}
              </p>
            </div>
          </div>
        </header>

        <section className="mt-8">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                Budget Breakdown
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                Programs funded by this budget
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review program allocations, spending, and remaining funds.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6">
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
                No programs yet
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                No programs found for this budget.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {programs.map((program) => (
                <article
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:p-6"
                  key={String(program.id)}
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
                          Program #{program.id}
                        </p>
                        <h3 className="mt-1 break-words text-lg font-bold text-slate-900">
                          {program.name}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        program.active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {program.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        Allocated
                      </p>
                      <p className="mt-1 break-all text-sm font-bold text-slate-900">
                        {String(program.allocatedAmount)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        Spent
                      </p>
                      <p className="mt-1 break-all text-sm font-bold text-slate-900">
                        {String(program.spentAmount)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-indigo-50/70 p-3">
                      <p className="text-xs font-medium text-indigo-700">
                        Remaining
                      </p>
                      <p className="mt-1 break-all text-sm font-bold text-indigo-900">
                        {getRemainingAmount(
                          program.allocatedAmount,
                          program.spentAmount
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <Link
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:border-indigo-600 hover:bg-indigo-600 hover:text-white sm:w-auto"
                      to={`/spending?programId=${encodeURIComponent(
                        String(program.id)
                      )}`}
                    >
                      View Spending for This Program
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default BudgetDetails;
