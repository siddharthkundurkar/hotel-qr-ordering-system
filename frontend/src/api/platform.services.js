import api from "./interceptors";

/* =====================================================
   🏢 CREATE COMPANY WITH OWNER (SUPER ADMIN)
===================================================== */
export const createCompanyWithOwner = async (payload) => {
  const res = await api.post("/platform/companies", payload);
  return res.data;
};

/* =====================================================
   👑 GET PLATFORM OWNERS (WITH PAGINATION)
===================================================== */
export const getPlatformOwners = async (params = {}) => {
  const res = await api.get("/platform/owners", { params });

  const payload = res?.data;

  return {
    owners:
      payload?.data ||
      payload?.rows ||
      (Array.isArray(payload) ? payload : []),

    total:
      payload?.total ??
      payload?.count ??
      payload?.totalCount ??
      0,
  };
};

/* =====================================================
   👑 CREATE OWNER (SUPER ADMIN)
===================================================== */
export const createOwnerBySuperAdmin = async (payload) => {
  const res = await api.post("/platform/owners", payload);
  return res.data;
};

/* =====================================================
   🔄 UPDATE OWNER STATUS
===================================================== */
export const updateOwnerStatus = async (ownerId, status) => {
  const res = await api.patch(
    `/platform/owners/${ownerId}/status`,
    { status }
  );
  return res.data;
};

/* =====================================================
   🏢 GET PLATFORM COMPANIES (WITH PAGINATION)
===================================================== */
export const getPlatformCompanies = async (params = {}) => {
  const res = await api.get("/platform/companies", { params });

  const payload = res?.data;

  return {
    companies:
      payload?.data ||
      payload?.rows ||
      (Array.isArray(payload) ? payload : []),

    total:
      payload?.total ??
      payload?.count ??
      payload?.totalCount ??
      0,
  };
};

/* =====================================================
   🏢 UPDATE COMPANY STATUS
===================================================== */
export const updateCompanyStatus = async (companyId, status) => {
  const res = await api.patch(
    `/platform/companies/${companyId}/status`,
    { status }
  );
  return res.data;
};
