import { Routes, Route } from "react-router-dom";
import OwnerLayout from "../layouts/OwnerLayout";

import Company from "../pages/owner/Company";
import Branches from "../pages/owner/Branches";
import Managers from "../pages/owner/Managers";
import Staff from "../pages/owner/Staff";
import Reports from "../pages/owner/Reports";
import Settings from "../pages/owner/Settings";
import OwnerDashboard from "../pages/owner/dashboard/OwnerDashboard";

export default function OwnerRoutes() {
  return (
   <Route element={<OwnerLayout />}>
  <Route index element={<OwnerDashboard />} />
  <Route path="company" element={<Company />} />
  <Route path="branches" element={<Branches />} />
  <Route path="managers" element={<Managers />} />
  <Route path="staff" element={<Staff />} />
  <Route path="reports" element={<Reports />} />
  <Route path="settings" element={<Settings />} />
</Route>
  );
}
