import { useEffect, useState } from "react";
import {
  checkIn,
  checkOut,
  getMyAttendance,
} from "../../api/attendance.services";
import toast from "react-hot-toast";

export default function StaffAttendanceBar() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    try {
      const res = await getMyAttendance();
      const rows = res.data || [];
      const active = rows.find(r => !r.check_out);

      setCheckedIn(!!active);
      setSession(active || null);
    } catch {
      toast.error("Attendance load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleCheckIn = async () => {
    try {
      await checkIn();
      toast.success("Checked in");
      loadStatus();
    } catch (err) {
      toast.error(err?.response?.data?.message);
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut();
      toast.success("Checked out");
      loadStatus();
    } catch (err) {
      toast.error(err?.response?.data?.message);
    }
  };

  if (loading) return null;

  return (
    <div className="sticky top-0 z-30 bg-white border-b px-4 py-2 flex justify-between items-center">
      <div>
        <p className="text-sm font-semibold text-slate-700">
          Attendance
        </p>

        {checkedIn && (
          <p className="text-xs text-slate-500">
            Checked in at{" "}
            {new Date(session.check_in).toLocaleTimeString()}
          </p>
        )}
      </div>

      {checkedIn ? (
        <button
          onClick={handleCheckOut}
          className="px-4 py-2 rounded-lg text-sm font-semibold
                     bg-red-600 text-white active:bg-red-700"
        >
          Check Out
        </button>
      ) : (
        <button
          onClick={handleCheckIn}
          className="px-4 py-2 rounded-lg text-sm font-semibold
                     bg-emerald-600 text-white active:bg-emerald-700"
        >
          Check In
        </button>
      )}
    </div>
  );
}
