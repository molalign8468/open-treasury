import { useEffect } from "react";
import { useBudgetStore } from "../stores/budgetStore";
import { Link } from "react-router-dom";

function Budgets() {
  const {
    budgets,
    loading,
    error,
    loadBudgets,
  } = useBudgetStore();

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
            <p className="mt-4 text-sm font-medium text-slate-600">
              Loading budgets...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-xl font-bold text-rose-600">
              !
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Error loading budgets
            </h2>

            <p className="mt-2 break-words text-sm leading-6 text-rose-700">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
            Public Records
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Government Budgets
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Explore government budget allocations and track their disbursement
            through OpenTreasury.
          </p>
        </div>

        {/* Budget count */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Budget records
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Browse available budget records.
            </p>
          </div>

          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600">
            {budgets.length} {budgets.length === 1 ? "budget" : "budgets"}
          </span>
        </div>

        {/* Empty state */}
        {budgets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
              >
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 8h8M8 12h8M8 16h5" />
              </svg>
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              No budgets found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              There are no budget records available to display.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {budgets.map((budget) => (
              <div
                key={budget.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:border-indigo-200 hover:shadow-md sm:p-7"
              >
                {/* Card header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
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
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        Budget record
                      </p>
                      <h2 className="mt-1 text-lg font-bold text-slate-900">
                        Budget #{budget.id}
                      </h2>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      budget.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        budget.active
                          ? "bg-emerald-500"
                          : "bg-slate-400"
                      }`}
                    />
                    {budget.active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Budget details */}
                <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Ministry
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                      {budget.ministry}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-500">
                        Fiscal Year
                      </p>
                      <p className="mt-2 text-base font-semibold text-slate-900">
                        {budget.fiscalYear}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-500">
                        Status
                      </p>
                      <p
                        className={`mt-2 text-base font-semibold ${
                          budget.active
                            ? "text-emerald-700"
                            : "text-slate-600"
                        }`}
                      >
                        {budget.active ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Allocated
                      </p>
                      <p className="mt-1 break-words text-lg font-bold text-slate-900">
                        {budget.allocatedAmount}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Disbursed
                      </p>
                      <p className="mt-1 break-words text-lg font-bold text-indigo-700">
                        {budget.disbursedAmount}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details link */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <Link
                    to={`/budgets/${budget.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    View budget details
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default Budgets;