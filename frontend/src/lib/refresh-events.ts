export const REFRESH_ATTENDANCE_EVENT = "ems:refresh-attendance";

export function dispatchRefreshAttendance() {
  window.dispatchEvent(new Event(REFRESH_ATTENDANCE_EVENT));
}
