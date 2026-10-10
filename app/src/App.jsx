import { useEffect } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";

import { useWalletStore } from "./stores/walletStore";

import Budgets from "./pages/Budgets";
import BudgetDetails from "./pages/BudgetDetails";
import CreateProgram from "./pages/CreateProgram";
import CreateBudget from "./pages/CreateBudget";
import MinistryDashboard from "./pages/MinistryDashboard";
import SpenderDashboard from "./pages/SpenderDashboard";
import SpenderAccess from "./pages/SpenderAccess";
import RecordSpending from "./pages/RecordSpending";
import SpendingExplorer from "./pages/SpendingExplorer";
import RoleDashboard from "./pages/RoleDashboard";
import SpendingDetail from "./pages/SpendingDetail";
import Navbar from "./components/Navbar";
import ReportSpending from "./pages/ReportSpending";
import ReviewerDashboard from "./pages/ReviewerDashboard";





function App() {
  const {
    refreshWallet,
  } = useWalletStore();


  useEffect(() => {
    refreshWallet();

    if (!window.ethereum) {
      return;
    }

    window.ethereum.on(
      "accountsChanged",
      refreshWallet
    );

    window.ethereum.on(
      "chainChanged",
      refreshWallet
    );


    return () => {
      window.ethereum.removeListener(
        "accountsChanged",
        refreshWallet
      );

      window.ethereum.removeListener(
        "chainChanged",
        refreshWallet
      );
    };

  }, [refreshWallet]);


  return (
    <BrowserRouter>
      <Navbar />

      <Routes>

        <Route
          path="/"
          element={<RoleDashboard />}
        />

        <Route
          path="/budgets"
          element={<Budgets />}
        />
        <Route
          path="/budgets/:id"
          element={<BudgetDetails />}
        />

        <Route
          path="/programs/create"
          element={<CreateProgram />}
        />
        <Route
          path="/budgets/create"
          element={<CreateBudget />}
        />
        <Route
          path="/ministry"
          element={<MinistryDashboard />}
        />
        <Route path="/spender" element={<SpenderDashboard />} />
        <Route path="/spenders/access" element={<SpenderAccess />} />
        <Route
          path="/spending/create"
          element={<RecordSpending />}
        />
        <Route
          path="/spending"
          element={<SpendingExplorer />}
        />
        <Route path="/spending/:id" element={<SpendingDetail />} />
        <Route path="/spending/:id/report" element={<ReportSpending />} />
        <Route
          path="/reviewer"
          element={<ReviewerDashboard />}
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;