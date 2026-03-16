import { Routes, Route } from "react-router-dom";
import ManagerLayout from "../layouts/ManagerLayout";
import ManagerDashboard from "../pages/manager/ManagerDashboard";
import TableDashboard from "../pages/manager/TableDashboard";

export default function ManagerRoutes() {
  return (
    <Routes>
      {/* MANAGER LAYOUT */}
      <Route path="/manager" element={<ManagerLayout />}>
        {/* DEFAULT PAGE */}
        <Route index element={<ManagerDashboard />} />

        {/* 👇 THIS IS THE MISSING LINE */}
        <Route path="tables" element={<TableDashboard />} />

        {/* (optional future routes) */}
        {/* <Route path="staff" element={<StaffDashboard />} /> */}
        {/* <Route path="orders" element={<OrdersDashboard />} /> */}
      </Route>
    </Routes>
  );
}
