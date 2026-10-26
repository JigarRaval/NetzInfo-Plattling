/**
 * Profile.jsx - Practical employee account page
 */

import React, { useState, useEffect } from "react";
import { api } from "../lib/api.js";
import { Button } from "../ui/kit.jsx";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconBuilding,
  IconEdit,
  IconLogout,
  IconSave,
  IconX,
  IconLock,
} from "../ui/Icons.jsx";

export default function Profile({ t, worker, signOut, go }) {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  // PIN Update State
  const [showPinForm, setShowPinForm] = useState(false);
  const [pinData, setPinData] = useState({ current: "", new: "", confirm: "" });
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState("");
  const [savingPin, setSavingPin] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getUserProfile();
      setProfile(data);
      setEditForm(data);
    } catch (err) {
      console.error("Failed to load profile:", err);
      if (worker) {
        const workerProfile = {
          workerId: worker.id,
          name: worker.name,
          email: "",
          phone: "",
          department: "",
          lastLogin: new Date(),
        };
        setProfile(workerProfile);
        setEditForm(workerProfile);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updateData = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        department: editForm.department,
      };

      const updated = await api.updateUserProfile(updateData);
      setProfile(updated);
      setIsEditing(false);
      setSuccess(t("profile_updated") || "Profile updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(`Failed to update profile: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

    async function handlePinSave(e) {
      e.preventDefault();
      setPinError("");
      setPinSuccess("");

      if (pinData.new.length < 6) {
        setPinError(
          t("profile_pin_length") || "The new PIN must be at least 6 digits."
        );
        return;
      }
      if (pinData.new !== pinData.confirm) {
        setPinError(t("profile_pin_mismatch") || "The new PINs do not match.");
        return;
      }

      setSavingPin(true);
      try {
        await api.updatePin(pinData.current, pinData.new);
        setPinSuccess(t("profile_pin_success") || "PIN successfully changed.");
        setPinData({ current: "", new: "", confirm: "" });
        setTimeout(() => {
          setShowPinForm(false);
          setPinSuccess("");
        }, 3000);
      } catch (err) {
        // LOG THE FULL ERROR FOR DEBUGGING
        console.error("PIN Update Failed:", err);

        // Show specific error based on backend response
        if (err.message === "wrong_current_pin" || err.status === 401) {
          setPinError(
            t("profile_pin_error") || "The current PIN is incorrect."
          );
        } else if (err.message === "invalid_pin_length") {
          setPinError(
            t("profile_pin_length") || "The new PIN must be at least 6 digits."
          );
        } else if (err.status === 500) {
          setPinError(
            "Server error: Please try again later or contact support."
          );
        } else {
          setPinError(`Error: ${err.message || "Unknown error"}`);
        }
      } finally {
        setSavingPin(false);
      }
    }

  function handleCancel() {
    setEditForm(profile);
    setIsEditing(false);
    setError("");
  }

  if (loading) {
    return (
      <div className="wrap mt-4">
        <p>Loading...</p>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="wrap">
      {/* 1. Page Header */}
      <header className="page-header">
        <h1>{t("nav_profile") || "My Profile"}</h1>
        <p>{t("profile_subtitle") || "Manage your account information"}</p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        {/* 2. Profile Summary */}
        <div className="profile-summary">
          <div className="profile-avatar-initials">
            {getInitials(profile?.name || worker?.name)}
          </div>
          <div className="profile-details">
            <h2 className="profile-name">{profile?.name || worker?.name}</h2>
            <div className="profile-meta">
              <span>
                Worker ID:{" "}
                <strong className="font-mono">
                  {profile?.workerId || worker?.id}
                </strong>
              </span>
              {profile?.email && (
                <span>
                  <IconMail size={16} /> {profile.email}
                </span>
              )}
            </div>
          </div>
          {!isEditing && (
            <div className="profile-actions-top">
              <Button
                onClick={() => setIsEditing(true)}
                icon={<IconEdit size={16} />}
              >
                {t("profile_edit") || "Edit Profile"}
              </Button>
              <Button
                variant="outline"
                onClick={signOut}
                icon={<IconLogout size={16} />}
              >
                {t("um_logout") || "Logout"}
              </Button>
            </div>
          )}
        </div>

        {/* 3 & 4. Personal Information / Account Actions */}
        {isEditing ? (
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                value={editForm.name || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={editForm.email || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
                placeholder="your.email@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                value={editForm.phone || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
                placeholder="+49 123 456 7890"
              />
            </div>

            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                type="text"
                value={editForm.department || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, department: e.target.value })
                }
                placeholder="e.g., Operations, Maintenance"
              />
            </div>

            <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
              <Button
                type="submit"
                disabled={saving}
                icon={<IconSave size={16} />}
              >
                {saving ? "Saving..." : t("c_save") || "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                icon={<IconX size={16} />}
              >
                {t("c_cancel") || "Cancel"}
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <h3 className="footer-title" style={{ marginBottom: "16px" }}>
              Personal Information
            </h3>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Full Name</span>
                <span className="info-value">
                  {profile?.name || <span className="empty">Not set</span>}
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">Email Address</span>
                <span className="info-value">
                  {profile?.email || <span className="empty">Not set</span>}
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">Phone Number</span>
                <span className="info-value">
                  {profile?.phone || <span className="empty">Not set</span>}
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">Department</span>
                <span className="info-value">
                  {profile?.department || (
                    <span className="empty">Not set</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security / PIN Section */}
      {!isEditing && (
        <div className="card" style={{ marginTop: "24px" }}>
          <div className="card-header">
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <IconLock size={20} /> Security
            </h2>
            <p>Manage your account security settings.</p>
          </div>

          {pinSuccess && (
            <div
              className="alert alert-success"
              style={{ marginBottom: "16px" }}
            >
              {pinSuccess}
            </div>
          )}
          {pinError && (
            <div className="alert alert-error" style={{ marginBottom: "16px" }}>
              {pinError}
            </div>
          )}

          {!showPinForm ? (
            <div>
              <Button
                variant="outline"
                onClick={() => setShowPinForm(true)}
                icon={<IconLock size={16} />}
              >
                {t("profile_change_pin") || "Change PIN"}
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePinSave} style={{ maxWidth: "400px" }}>
              <div className="form-group">
                <label>{t("profile_current_pin") || "Current PIN"}</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pinData.current}
                  onChange={(e) =>
                    setPinData({ ...pinData, current: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  {t("profile_new_pin") || "New PIN (min. 6 digits)"}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pinData.new}
                  onChange={(e) =>
                    setPinData({ ...pinData, new: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("profile_confirm_pin") || "Confirm new PIN"}</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pinData.confirm}
                  onChange={(e) =>
                    setPinData({ ...pinData, confirm: e.target.value })
                  }
                  required
                />
              </div>
              <div className="row" style={{ marginTop: "16px" }}>
                <Button type="submit" disabled={savingPin}>
                  {savingPin ? "Saving..." : "Update PIN"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPinForm(false);
                    setPinError("");
                    setPinData({ current: "", new: "", confirm: "" });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
