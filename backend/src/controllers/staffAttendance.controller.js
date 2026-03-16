import { db } from "../config/db.js";

/* =====================================
   STAFF CHECK-IN
   (only one open session per user)
===================================== */
export const checkIn = async (req, res, next) => {
  try {
    const { id: staffId, branchId } = req.user;

    if (!branchId) {
      return res.status(400).json({
        message: "Branch not assigned to user",
      });
    }

    /* ❌ Prevent multiple active check-ins */
    const [[active]] = await db.query(
      `
      SELECT id
      FROM staff_attendance
      WHERE staff_id = ?
        AND branch_id = ?
        AND check_out IS NULL
      `,
      [staffId, branchId]
    );

    if (active) {
      return res.status(409).json({
        message: "Already checked in",
      });
    }

    await db.query(
      `
      INSERT INTO staff_attendance
        (staff_id, branch_id, check_in)
      VALUES (?, ?, NOW())
      `,
      [staffId, branchId]
    );

    res.json({ message: "Check-in successful" });
  } catch (err) {
    next(err);
  }
};

/* =====================================
   STAFF CHECK-OUT
===================================== */
export const checkOut = async (req, res, next) => {
  try {
    const { id: staffId, branchId } = req.user;

    if (!branchId) {
      return res.status(400).json({
        message: "Branch not assigned to user",
      });
    }

    const [result] = await db.query(
      `
      UPDATE staff_attendance
      SET check_out = NOW()
      WHERE staff_id = ?
        AND branch_id = ?
        AND check_out IS NULL
      `,
      [staffId, branchId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: "No active check-in found",
      });
    }

    res.json({ message: "Check-out successful" });
  } catch (err) {
    next(err);
  }
};

/* =====================================
   MY ATTENDANCE (STAFF)
===================================== */
export const getMyAttendance = async (req, res, next) => {
  try {
    const { id: staffId, branchId } = req.user;

    const [rows] = await db.query(
      `
      SELECT
        id,
        check_in,
        check_out,
        TIMESTAMPDIFF(
          MINUTE,
          check_in,
          COALESCE(check_out, NOW())
        ) AS workedMinutes
      FROM staff_attendance
      WHERE staff_id = ?
        AND branch_id = ?
      ORDER BY check_in DESC
      LIMIT 30
      `,
      [staffId, branchId]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/* =====================================
   BRANCH ATTENDANCE (MANAGER / OWNER)
===================================== */
export const getBranchAttendance = async (req, res, next) => {
  try {
    const { branchId } = req.user;
    const { date } = req.query;

    let dateFilter = "";
    const params = [branchId];

    if (date) {
      dateFilter = "AND DATE(a.check_in) = ?";
      params.push(date);
    }

    const [rows] = await db.query(
      `
      SELECT
        a.id,
        a.staff_id,
        u.name AS staffName,
        a.check_in,
        a.check_out,
        TIMESTAMPDIFF(
          MINUTE,
          a.check_in,
          COALESCE(a.check_out, NOW())
        ) AS workedMinutes
      FROM staff_attendance a
      JOIN users u ON u.id = a.staff_id
      WHERE a.branch_id = ?
      ${dateFilter}
      ORDER BY a.check_in DESC
      `,
      params
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
};
