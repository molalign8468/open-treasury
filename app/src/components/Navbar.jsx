import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useWalletStore } from "../stores/walletStore";
import {
  isAuthorizedMinistry,
  isAuthorizedSpender,
} from "../services/budgetRegistry";

export default function Navbar() {
  const account = useWalletStore((s) => s.account);
  const isConnected = useWalletStore((s) => s.isConnected);
  const isCorrectNetwork = useWalletStore((s) => s.isCorrectNetwork);
  const connectWallet = useWalletStore((s) => s.connectWallet);

  const [ministry, setMinistry] = useState(false);
  const [spender, setSpender] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkRoles() {
      setMinistry(false);
      setSpender(false);

      if (!isConnected || !account || !isCorrectNetwork) return;

      try {
        const [m, s] = await Promise.all([
          isAuthorizedMinistry(account),
          isAuthorizedSpender(account),
        ]);

        if (!cancelled) {
          setMinistry(m);
          setSpender(s);
        }
      } catch (error) {
        console.error("Could not check wallet permissions:", error);
      }
    }

    checkRoles();
    return () => {
      cancelled = true;
    };
  }, [account, isConnected, isCorrectNetwork]);

  const links = [
    { label: "Budgets", to: "/budgets" },
    { label: "Spending Explorer", to: "/spending" },
    ...(ministry
      ? [
          { label: "Create Budget", to: "/budgets/create" },
          { label: "Create Program", to: "/programs/create" },
          { label: "Manage Spenders", to: "/spenders/access" },
        ]
      : []),
    ...(spender
      ? [
          { label: "Record Spending", to: "/spending/create" },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          className="flex shrink-0 items-center gap-3 text-xl font-bold tracking-tight text-slate-900 transition hover:text-indigo-700"
          to="/"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-extrabold text-white shadow-sm">
            OT
          </span>
          <span>
            Open<span className="text-indigo-600">Treasury</span>
          </span>
        </Link>

        <nav
          className="order-3 flex w-full flex-wrap items-center gap-2 md:order-2 md:w-auto"
          aria-label="Main navigation"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="order-2 flex shrink-0 items-center gap-3 md:order-3">
          {isConnected ? (
            <span
              title={account}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            </span>
          ) : (
            <button
              onClick={connectWallet}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

