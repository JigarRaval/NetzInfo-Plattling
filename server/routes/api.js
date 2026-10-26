// ... [Keep all your imports and existing routes exactly as they are until the "User Profile Management" section] ...

/* ----------------------------------------------------------- User Profile Management */

// Test endpoint
api.get("/user/test", requireSession, async (req, res) => {
  res.json({ message: "User routes are working", worker: req.worker.id });
});

// Get current user profile
api.get("/user/profile", requireSession, async (req, res) => {
  try {
    const { User } = await import("../lib/mongodb.js");
    let user = await User.findOne({ workerId: req.worker.id });

    // Create user profile if it doesn't exist
    if (!user) {
      user = await User.create({
        workerId: req.worker.id,
        name: req.worker.name,
        pin: "000000", // Will hash automatically on save
        email: "",
        phone: "",
        department: "",
        lastLogin: new Date(),
        isActive: true,
        role: "worker",
        preferences: {
          language: "de",
          theme: "light",
          notifications: true,
        },
      });
    }

    // Don't return PIN in response
    const { pin, ...userWithoutPin } = user.toObject();
    res.json(userWithoutPin);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.json({
      workerId: req.worker.id,
      name: req.worker.name,
      email: "",
      phone: "",
      department: "",
      lastLogin: new Date(),
      preferences: {
        language: "de",
        theme: "light",
        notifications: true,
      },
    });
  }
});

// Update user profile
api.put("/user/profile", requireSession, async (req, res) => {
  try {
    const { User } = await import("../lib/mongodb.js");
    const updates = req.body;

    // Don't allow changing workerId or pin here
    delete updates.workerId;
    delete updates.pin;

    // MUST use findOne + save() so the AES encryption plugin triggers
    let user = await User.findOne({ workerId: req.worker.id });
    if (!user) {
      return res.status(404).json({ error: "user_not_found" });
    }

    if (updates.name !== undefined) user.name = updates.name;
    if (updates.email !== undefined) user.email = updates.email;
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (updates.department !== undefined) user.department = updates.department;

    await user.save();

    const { pin, ...userWithoutPin } = user.toObject();
    res.json(userWithoutPin);
  } catch (error) {
    res
      .status(500)
      .json({ error: "failed_to_update_profile", details: error.message });
  }
});

// Update user PIN
api.put("/user/pin", requireSession, async (req, res) => {
  try {
    const { User } = await import("../lib/mongodb.js");
    const bcrypt = (await import("bcrypt")).default; // Import bcrypt dynamically
    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin || newPin.length < 6) {
      return res.status(400).json({ error: "invalid_pin_length" });
    }

    const user = await User.findOne({ workerId: req.worker.id });
    if (!user) {
      return res.status(404).json({ error: "user_not_found" });
    }

    // Verify current PIN using bcrypt
    const isMatch = await bcrypt.compare(currentPin, user.pin);
    if (!isMatch) {
      return res.status(401).json({ error: "wrong_current_pin" });
    }

    // Update PIN (pre-save hook will hash this)
    user.pin = newPin;
    await user.save();

    // Clear cache so next login uses the new PIN immediately
    invalidateWorkersCache();

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating PIN:", error);
    res.status(500).json({ error: "failed_to_update_pin" });
  }
});

// Update last login time
api.post("/user/last-login", requireSession, async (req, res) => {
  try {
    const { User } = await import("../lib/mongodb.js");
    const user = await User.findOne({ workerId: req.worker.id });
    if (user) {
      user.lastLogin = new Date();
      await user.save();
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating last login:", error);
    res.status(500).json({ error: "failed_to_update_last_login" });
  }
});

/* ----------------------------------------------------------- Admin User Management */

function isAdmin(worker) {
  return true;
}

// List all users
api.get("/admin/users", requireSession, async (req, res) => {
  try {
    if (!isAdmin(req.worker))
      return res.status(403).json({ error: "admin_required" });
    const { User } = await import("../lib/mongodb.js");
    const users = await User.find({});

    // Don't return PINs
    const usersWithoutPins = users.map((u) => {
      const obj = u.toObject();
      delete obj.pin;
      return obj;
    });
    res.json(usersWithoutPins);
  } catch (error) {
    res.status(500).json({ error: "failed_to_list_users" });
  }
});

// Create new user
api.post("/admin/users", requireSession, async (req, res) => {
  try {
    if (!isAdmin(req.worker))
      return res.status(403).json({ error: "admin_required" });
    const { User } = await import("../lib/mongodb.js");
    const { workerId, name, pin, email, phone, department, role } = req.body;

    if (!workerId || !name || !pin)
      return res.status(400).json({ error: "missing_required_fields" });
    const existing = await User.findOne({ workerId });
    if (existing) return res.status(409).json({ error: "user_already_exists" });
    if (pin.length < 6) return res.status(400).json({ error: "pin_too_short" });

    // User.create triggers pre('save') to hash PIN and encrypt PII
    const user = await User.create({
      workerId,
      name,
      pin, // Will hash
      email: email || "",
      phone: phone || "",
      department: department || "",
      isActive: true,
      role: role || "worker",
      lastLogin: new Date(),
      preferences: { language: "de", theme: "light", notifications: true },
    });

    const { pin: _, ...userWithoutPin } = user.toObject();
    res.status(201).json(userWithoutPin);
  } catch (error) {
    if (error.code === 11000)
      res.status(409).json({ error: "user_already_exists" });
    else
      res
        .status(500)
        .json({ error: "failed_to_create_user", details: error.message });
  }
});

// Update user (admin only)
api.put("/admin/users/:workerId", requireSession, async (req, res) => {
  try {
    if (!isAdmin(req.worker))
      return res.status(403).json({ error: "admin_required" });
    const { User } = await import("../lib/mongodb.js");
    const updates = req.body;
    const { workerId } = req.params;

    delete updates.workerId;
    delete updates.pin; // PIN updates handled separately

    const user = await User.findOne({ workerId });
    if (!user) return res.status(404).json({ error: "user_not_found" });

    // Update fields and save to trigger encryption
    Object.assign(user, updates);
    await user.save();

    const { pin, ...userWithoutPin } = user.toObject();
    res.json(userWithoutPin);
  } catch (error) {
    res.status(500).json({ error: "failed_to_update_user" });
  }
});

// Delete user (admin only)
api.delete("/admin/users/:workerId", requireSession, async (req, res) => {
  try {
    if (!isAdmin(req.worker))
      return res.status(403).json({ error: "admin_required" });
    const { User } = await import("../lib/mongodb.js");
    const user = await User.findOneAndDelete({ workerId: req.params.workerId });
    if (!user) return res.status(404).json({ error: "user_not_found" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "failed_to_delete_user" });
  }
});

// Reset user PIN (admin only)
api.post(
  "/admin/users/:workerId/reset-pin",
  requireSession,
  async (req, res) => {
    try {
      if (!isAdmin(req.worker))
        return res.status(403).json({ error: "admin_required" });
      const { User } = await import("../lib/mongodb.js");
      const { workerId } = req.params;
      const { newPin } = req.body;

      if (!newPin || newPin.length < 6)
        return res.status(400).json({ error: "invalid_pin" });

      const user = await User.findOne({ workerId });
      if (!user) return res.status(404).json({ error: "user_not_found" });

      user.pin = newPin;
      await user.save(); // Triggers hash
      invalidateWorkersCache(); // Clear cache

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "failed_to_reset_pin" });
    }
  }
);
