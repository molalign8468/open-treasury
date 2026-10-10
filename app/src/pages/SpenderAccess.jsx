import { useState } from "react";
import { useWalletStore } from "../stores/walletStore";
import {
  authorizeSpender,
  revokeSpender,
  isAuthorizedMinistry,
} from "../services/budgetRegistry";

export default function SpenderAccess() {
  const account = useWalletStore((state) => state.account);
  const isConnected = useWalletStore((state) => state.isConnected);
  const isCorrectNetwork = useWalletStore(
    (state) => state.isCorrectNetwork
  );

  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");

  async function manageSpender(action) {
    setMessage("");
    setError("");
    setTxHash("");

    if (!isConnected || !isCorrectNetwork || !account) {
      setError("Connect your ministry wallet on Sepolia first.");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
      setError("Enter a valid Ethereum wallet address.");
      return;
    }

    setLoading(true);

    try {
      const ministry = await isAuthorizedMinistry(account);

      if (!ministry) {
        throw new Error("Your wallet is not an authorized ministry.");
      }

      const result =
        action === "authorize"
          ? await authorizeSpender(address.trim())
          : await revokeSpender(address.trim());

      setTxHash(result.hash);
      setMessage(
        action === "authorize"
          ? "Spender authorization transaction confirmed."
          : "Spender revocation transaction confirmed."
      );
      setAddress("");
    } catch (err) {
      setError(
        err.shortMessage || err.reason || err.message ||
        "The transaction failed."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                    d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4"
                  />
                </svg>
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Spender Access Management
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Manage spending permissions by authorizing a
                  spending officer's wallet or revoking its access
                  to the budget system.
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
                    Ministry wallet
                  </p>
                  <p className="mt-1 break-all font-mono text-xs leading-5 text-slate-600">
                    {account || "Not connected"}
                  </p>

                  {!isConnected && (
                    <p className="mt-3 text-sm text-amber-700">
                      Connect your ministry wallet to manage
                      spender permissions.
                    </p>
                  )}

                  {isConnected && !isCorrectNetwork && (
                    <p className="mt-3 text-sm text-amber-700">
                      Switch MetaMask to Sepolia before continuing.
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

            <section>
              <h2 className="text-lg font-semibold text-slate-900">
                Manage spender permissions
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Enter the Ethereum address of the spending officer
                whose permissions you want to manage.
              </p>

              <div className="mt-5">
                <label
                  htmlFor="spender-address"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Spender wallet address
                </label>
                <input
                  id="spender-address"
                  value={address}
                  onChange={(event) =>
                    setAddress(event.target.value)
                  }
                  placeholder="0x..."
                  autoComplete="off"
                  className={inputClass}
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Enter a valid 42-character Ethereum wallet
                  address starting with 0x.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  disabled={loading}
                  onClick={() => manageSpender("authorize")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
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
                      Processing...
                    </>
                  ) : (
                    <>
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
                          d="M12 5v14m-7-7h14"
                        />
                      </svg>
                      Authorize Spender
                    </>
                  )}
                </button>

                <button
                  disabled={loading}
                  onClick={() => manageSpender("revoke")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {loading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
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
                      Processing...
                    </>
                  ) : (
                    <>
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
                          d="M5 12h14"
                        />
                      </svg>
                      Revoke Spender
                    </>
                  )}
                </button>
              </div>
            </section>

            {message && (
              <div
                role="status"
                className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5 shrink-0 text-emerald-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m5 12 4 4L19 6"
                  />
                </svg>
                <p className="text-sm font-medium leading-6 text-emerald-800">
                  {message}
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
                    Unable to update spender access
                  </p>
                  <p className="mt-1 break-words text-sm leading-6 text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {txHash && (
              <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <p className="text-sm font-semibold text-slate-900">
                  Transaction details
                </p>
                <p className="mt-1 break-all font-mono text-xs leading-5 text-slate-500">
                  {txHash}
                </p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
                >
                  View on Etherscan
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
                      d="M14 3h7v7m-1-6-9 9"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"
                    />
                  </svg>
                </a>
              </section>
            )}

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5 shrink-0 text-amber-700"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M10.3 3.9 2.5 17.4A1.8 1.8 0 0 0 4.1 20h15.8a1.8 1.8 0 0 0 1.6-2.6L13.7 3.9a2 2 0 0 0-3.4 0Z"
                  />
                </svg>
                <p className="text-sm leading-6 text-amber-900">
                  Only wallets authorized as ministries by the
                  contract can successfully manage spender
                  permissions. MetaMask must be connected to
                  Sepolia. Verify the wallet address carefully
                  before authorizing or revoking access.
                </p>
              </div>
            </div>
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