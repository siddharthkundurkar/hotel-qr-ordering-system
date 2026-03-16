// src/utils/dbBranch.js
import { db } from "../config/db.js";

/* =================================================
   🧠 ENTERPRISE BRANCH QUERY WRAPPER
================================================= */

/**
 * Safe SELECT with branch enforcement
 */
export const branchQuery = async (
  req,
  sql,
  params = [],
  options = {}
) => {
  const { skipBranch = false } = options;

  // SUPER ADMIN can bypass
  if (skipBranch || req.user?.role === "SUPER_ADMIN") {
    return db.query(sql, params);
  }

  const branchId = req.user?.branchId;

  if (!branchId) {
    throw new Error("Branch context missing in branchQuery");
  }

  /* =================================================
     🔒 Auto inject branch filter
  ================================================= */

  const hasWhere = /where/i.test(sql);

  const safeSql = hasWhere
    ? `${sql} AND branchId = ?`
    : `${sql} WHERE branchId = ?`;

  const safeParams = [...params, branchId];

  return db.query(safeSql, safeParams);
};

/**
 * Safe UPDATE/DELETE with branch enforcement
 */
export const branchExecute = async (
  req,
  sql,
  params = [],
  options = {}
) => {
  return branchQuery(req, sql, params, options);
};