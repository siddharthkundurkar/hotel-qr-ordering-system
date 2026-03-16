import { useState, useEffect } from "react";
import { User, Building2, Lock, Save, Pencil } from "lucide-react";
import toast from "react-hot-toast";

import {
  getOwnerProfile,
  updateOwnerProfile,
  getCompanySettings,
  updateCompanySettings
} from "../../../api/owner.services";

import PasswordConfirmModal from "./PasswordConfirmModal";

export default function OwnerSettings() {

  const [profile, setProfile] = useState({ name: "", email: "" });
  const [hotel, setHotel] = useState({ hotelName: "", address: "", city: "" });

  const [editProfile, setEditProfile] = useState(false);
  const [editHotel, setEditHotel] = useState(false);

  const [confirmModal, setConfirmModal] = useState(null);

  /* ================= LOAD DATA ================= */

useEffect(() => {
  const load = async () => {
    try {

      const profileData = await getOwnerProfile();
      const companyData = await getCompanySettings();

      console.log("COMPANY DATA:", companyData);

      setProfile({
        name: profileData?.full_name || "",
        email: profileData?.email || ""
      });

      setHotel({
        hotelName: companyData?.name || "",
        address: companyData?.address || "",
        city: companyData?.city || ""
      });

    } catch (err) {
      console.error(err);
      toast.error("Failed to load settings");
    }
  };

  load();
}, []);

  /* ================= HANDLERS ================= */

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleHotelChange = (e) => {
    setHotel({ ...hotel, [e.target.name]: e.target.value });
  };

  /* ================= SAVE WITH PASSWORD ================= */

  const requestProfileSave = () => {
    setConfirmModal({
      type: "profile",
      data: profile
    });
  };

  const requestHotelSave = () => {
    setConfirmModal({
      type: "hotel",
      data: hotel
    });
  };

  const confirmSave = async (password) => {
    try {

      if (confirmModal.type === "profile") {
        await updateOwnerProfile({
          ...confirmModal.data,
          password
        });

        setEditProfile(false);
      }

      if (confirmModal.type === "hotel") {
        await updateCompanySettings({
          ...confirmModal.data,
          password
        });

        setEditHotel(false);
      }

      toast.success("Settings updated");

    } catch {
      toast.error("Update failed");
    }

    setConfirmModal(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* PROFILE */}

      <Card
        title="Profile Information"
        icon={<User size={18} />}
        onEdit={() => setEditProfile(!editProfile)}
        editing={editProfile}
      >

        <div className="grid md:grid-cols-2 gap-4">

          <Input
            label="Full Name"
            name="name"
            value={profile.name}
            onChange={handleProfileChange}
            disabled={!editProfile}
          />

          <Input
            label="Email"
            name="email"
            value={profile.email}
            onChange={handleProfileChange}
            disabled={!editProfile}
          />

        </div>

        {editProfile && <SaveButton onClick={requestProfileSave} />}

      </Card>

      {/* HOTEL */}

      <Card
        title="Hotel Information"
        icon={<Building2 size={18} />}
        onEdit={() => setEditHotel(!editHotel)}
        editing={editHotel}
      >

        <div className="grid md:grid-cols-2 gap-4">

          <Input
            label="Hotel Name"
            name="hotelName"
            value={hotel.hotelName}
            onChange={handleHotelChange}
            disabled={!editHotel}
          />

          <Input
            label="City"
            name="city"
            value={hotel.city}
            onChange={handleHotelChange}
            disabled={!editHotel}
          />

          <div className="md:col-span-2">
            <Input
              label="Address"
              name="address"
              value={hotel.address}
              onChange={handleHotelChange}
              disabled={!editHotel}
            />
          </div>

        </div>

        {editHotel && <SaveButton onClick={requestHotelSave} />}

      </Card>

      {/* PASSWORD MODAL */}

      {confirmModal && (
        <PasswordConfirmModal
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmSave}
        />
      )}

    </div>
  );
}

/* ---------------- CARD ---------------- */

function Card({ title, icon, children, onEdit, editing }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">

      <div className="flex justify-between items-center mb-5">

        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          {icon}
          {title}
        </div>

        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <Pencil size={16} />
          {editing ? "Cancel" : "Edit"}
        </button>

      </div>

      {children}

    </div>
  );
}

/* ---------------- INPUT ---------------- */

function Input({ label, disabled, ...props }) {
  return (
    <div>

      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>

      <input
        disabled={disabled}
        {...props}
        className={`w-full mt-1 px-4 py-2.5 rounded-lg border
        ${disabled
          ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
          : "bg-white dark:bg-slate-800"}
        border-slate-300 dark:border-slate-700
        text-slate-900 dark:text-slate-200
        focus:ring-2 focus:ring-indigo-500 outline-none`}
      />

    </div>
  );
}

/* ---------------- SAVE BUTTON ---------------- */

function SaveButton({ onClick }) {
  return (
    <div className="flex justify-end mt-6">
      <button
        onClick={onClick}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg"
      >
        <Save size={16} />
        Save Changes
      </button>
    </div>
  );
}