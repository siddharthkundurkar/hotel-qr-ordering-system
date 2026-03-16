import api from "./interceptors"; // your authenticated axios instance

export const checkIn = () =>
  api.post("/attendance/check-in");

export const checkOut = () =>
  api.post("/attendance/check-out");

export const getMyAttendance = () =>
  api.get("/attendance/me");
