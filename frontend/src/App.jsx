import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./component/ProtectedRoute";

/* ================= PUBLIC ================= */
import LandingScreen from "./pages/platform/LandingScreen";
import Login from "./pages/Auth/Login";
import ScanPage from "./pages/public/ScanPage";


/* ================= LAYOUTS ================= */
import OwnerLayout from "./layouts/OwnerLayout";
import ManagerLayout from "./layouts/ManagerLayout";
import StaffLayout from "./layouts/StaffLayout";
import CashierLayout from "./layouts/CashierLayout";
import CustomerLayout from "./layouts/CustomerLayout";
import KitchenLayout from "./layouts/KitchenLayout";

/* ================= OWNER ================= */
import BranchList from "./pages/owner/branches/BranchList";
import CreateBranch from "./pages/Auth/CreateBranch";
import ManagerList from "./pages/owner/manager/ManagerList";
import CreateBranchModal from "./pages/owner/branches/CreateBranchModal";
import OwnerSettings from "./pages/owner/settings/OwnerSettings";
/* ================= MANAGER ================= */
import ManagerDashboard from "./pages/manager/dashboard/ManagerDashboard1";
import ManagerStaff from "./pages/manager/staff/ManagerStaff";
import ManagerTables from "./pages/manager/tables/ManagerTables";
import ManagerOrders from "./pages/manager/orders/ManagerOrder";
import ManagerInventory from "./pages/manager/inventory/ManagerInventory";
import ManagerSettings from "./pages/manager/settings/ManagerSetting";
import ManagerMenu from "./pages/manager/menu/Managermenu";

/* ================= STAFF ================= */
import WaiterDashboard from "./pages/waiter/WaiterDashboard";
import KitchenOrders from "./pages/kitchen/KitchenOrders";
import KitchenOrderHistory from "./pages/kitchen/KitchenOrderHistory";

/* ================= CASHIER ================= */
import CashierDashboard from "./pages/cashier/CashierDashboard";
import CashierOrdersPage from "./pages/cashier/CahierOrderPage";
import CashierHistory from "./pages/cashier/CashierHistory";

/* ================= CUSTOMER ================= */
import CustomerMenu from "./pages/public/CustomerMenu";
import CustomerLiveOrder from "./pages/public/CustomerLiveOrder";
import OwnerSmartGate from "./component/OwnerSmartGate";

/* ================= PLATFORM ================= */
import PlatformLayout from "./layouts/PlatformLayout";
import PlatformDashboard from "./pages/platform/PlatformDashboard";
import PlatformOwners from "./pages/platform/platformOwner";
import PlatformCompanies from "./pages/platform/PlatformCompany";
import PlatformHome from "./pages/platform/PlatformHome";
import CreateCompanyForm from "./pages/platform/CreateCompanyForm";
import WaiterLayout from "./layouts/WaiterLayout";
import ReadyOrders from "./pages/waiter/ReadyOrders";
import MyOrders from "./pages/waiter/MyOrders";
import SelectBranchPage from "./pages/manager/SelectBranchPage";
import OwnerReports from "./pages/owner/report/OwnerReport";
import ServedOrders from "./pages/waiter/ServedOrders";
export default function App() {
  return (
    <Routes>
      {/* ================= PUBLIC ================= */}
      <Route path="/" element={<LandingScreen />} />
      <Route path="/login" element={<Login />} />
      <Route
  path="/manager/select-branch"
  element={
    <ProtectedRoute roles={["MANAGER"]}>
      <SelectBranchPage />
    </ProtectedRoute>
  }
/>
      {/* ================= SUPER ADMIN ================= */}
      <Route
  path="/platform"
  element={
    <ProtectedRoute roles={["SUPER_ADMIN"]}>
      <PlatformLayout />
    </ProtectedRoute>
  }
>
  <Route index element={<PlatformHome />} />
  <Route path="dashboard" element={<PlatformDashboard />} />
  <Route path="owners" element={<PlatformOwners />} />
  <Route path="companies" element={<PlatformCompanies />} />

  {/* ⭐⭐⭐ ADD THIS ⭐⭐⭐ */}
  <Route path="create-company" element={<CreateCompanyForm />} />
</Route>


      {/* ================= OWNER SETUP ================= */}
      <Route
        path="/setup/branch"
        element={
          <ProtectedRoute roles={["OWNER"]}>
            <CreateBranch />
          </ProtectedRoute>
        }
      />

      {/* ================= PUBLIC QR ================= */}
      <Route path="/qr/:token" element={<ScanPage />} />
      

      {/* ================= OWNER ================= */}
     <Route
  path="/owner"
  element={
    <ProtectedRoute roles={["OWNER"]}>
      <OwnerSmartGate>
        <OwnerLayout />
      </OwnerSmartGate>
    </ProtectedRoute>
  }
>
  <Route index element={<BranchList />} />
  <Route path="branches" element={<BranchList />} />
  <Route path="branches/new" element={<CreateBranchModal />} />
  <Route path="managers" element={<ManagerList />} />
  <Route path="staff" element={<ManagerStaff />} />   {/* ✅ Added */}
  <Route path="settings" element={<OwnerSettings />} />
  <Route path="reports" element={<OwnerReports />} />   {/* ✅ Added */}
</Route>

      {/* ================= MANAGER ================= */}
      <Route
  path="/manager"
  element={
    <ProtectedRoute roles={["MANAGER"]}>
      <ManagerLayout />
    </ProtectedRoute>
  }
>
  <Route path="select-branch" element={<SelectBranchPage />} />
  <Route index element={<ManagerDashboard />} />
  <Route path="staff" element={<ManagerStaff />} />
  <Route path="tables" element={<ManagerTables />} />
  <Route path="menu" element={<ManagerMenu />} />
  <Route path="orders" element={<ManagerOrders />} />
  <Route path="inventory" element={<ManagerInventory />} />
  <Route path="settings" element={<ManagerSettings />} />
</Route>
      {/* ================= STAFF ================= */}
     <Route
  path="/staff"
  element={
    <ProtectedRoute roles={["WAITER", "KITCHEN"]}>
      <StaffLayout />
    </ProtectedRoute>
  }
>
  {/* ================= WAITER ================= */}
<Route
  path="waiter"
  element={
    <ProtectedRoute roles={["WAITER"]}>
      <WaiterLayout />
    </ProtectedRoute>
  }
>
  <Route index element={<ReadyOrders />} />
  <Route path="ready" element={<ReadyOrders />} />
  <Route path="dashboard" element={<WaiterDashboard />} />
  <Route path="served-orders" element={<ServedOrders />} />
  <Route path="my" element={<MyOrders />} />
</Route>
  {/* ================= KITCHEN ================= */}
  <Route
    path="kitchen"
    element={
      <ProtectedRoute roles={["KITCHEN"]}>
        <KitchenLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<KitchenOrders />} />
    <Route path="history" element={<KitchenOrderHistory />} />
  </Route>
</Route>

      {/* ================= CUSTOMER ================= */}
      <Route path="/scan/:token" element={<CustomerLayout />}>
        <Route index element={<ScanPage />} />
        <Route path="menu" element={<CustomerMenu />} />
        <Route path="live-order" element={<CustomerLiveOrder />} />
       
      </Route>

      {/* ================= CASHIER ================= */}
      <Route
        path="/cashier"
        element={
          <ProtectedRoute roles={["CASHIER"]}>
            <CashierLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CashierDashboard />} />
        <Route path="dashboard" element={<CashierDashboard />} />
        <Route path="orders" element={<CashierOrdersPage />} />
        <Route path="history" element={<CashierHistory />} />
      </Route>
    </Routes>
  );
}
