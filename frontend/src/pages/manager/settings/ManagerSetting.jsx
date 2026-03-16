import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import {
  getManagerProfile,
  updateManagerProfile,
  getManagerBranch,
} from "../../../api/manager.services";

export default function ManagerSettings() {
  const [profile, setProfile] = useState(null);
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const profileData = await getManagerProfile();
      const branchData = await getManagerBranch();

      setProfile(profileData);
      setBranch(branchData);

      setForm({
        full_name: profileData.full_name || "",
        email: profileData.email || "",
      });
    } catch (err) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!confirmPassword) {
      toast.error("Enter password to confirm");
      return;
    }

    try {
      await updateManagerProfile({
        ...form,
        password: confirmPassword,
      });

      toast.success("Profile updated");

      setEditing(false);
      setShowPasswordModal(false);
      setConfirmPassword("");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-600 dark:text-slate-300">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* TITLE */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Manager Settings
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage your account settings
          </p>
        </div>

        {/* PROFILE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Profile
            </h2>

            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="text-indigo-600 dark:text-indigo-400 font-medium"
              >
                Edit
              </button>
            ) : (
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
              >
                Save Changes
              </button>
            )}
          </div>

          <div className="space-y-4">

            <div>
              <label className="text-sm text-slate-700 dark:text-slate-300">
                Full Name
              </label>

              <input
                disabled={!editing}
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                className="w-full mt-1 px-4 py-2 border rounded-lg
                bg-white dark:bg-slate-800
                text-slate-900 dark:text-white
                border-slate-200 dark:border-slate-700
                disabled:opacity-60"
              />
            </div>

            <div>
              <label className="text-sm text-slate-700 dark:text-slate-300">
                Email
              </label>

              <input
                disabled={!editing}
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="w-full mt-1 px-4 py-2 border rounded-lg
                bg-white dark:bg-slate-800
                text-slate-900 dark:text-white
                border-slate-200 dark:border-slate-700
                disabled:opacity-60"
              />
            </div>

          </div>
        </div>

        {/* BRANCH INFO */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">

          <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
            Branch Information
          </h2>

          <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">

            <p>
              <span className="font-medium">Branch Name:</span>{" "}
              {branch?.name || "-"}
            </p>

            <p>
              <span className="font-medium">Address:</span>{" "}
              {branch?.address || "-"}
            </p>

            <p>
              <span className="font-medium">Phone:</span>{" "}
              {branch?.phone || "-"}
            </p>

          </div>
        </div>
      </div>

      {/* PASSWORD CONFIRM MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl w-[350px] border border-slate-200 dark:border-slate-800">

            <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">
              Confirm Password
            </h3>

            <input
              type="password"
              placeholder="Enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg
              bg-white dark:bg-slate-800
              text-slate-900 dark:text-white
              border-slate-200 dark:border-slate-700
              placeholder-slate-400 dark:placeholder-slate-500"
            />

            <div className="flex justify-end gap-3 mt-4">

              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-3 py-2 text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>

              <button
                onClick={saveProfile}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
              >
                Confirm
              </button>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}