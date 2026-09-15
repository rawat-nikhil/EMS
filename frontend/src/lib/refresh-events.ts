export const REFRESH_ATTENDANCE_EVENT = "ems:refresh-attendance";
export const REFRESH_TIMESHEET_EVENT = "ems:refresh-timesheet";
export const REFRESH_DASHBOARD_EVENT = "ems:refresh-dashboard";

export function dispatchRefreshAttendance() {
  window.dispatchEvent(new Event(REFRESH_ATTENDANCE_EVENT));
  window.dispatchEvent(new Event(REFRESH_DASHBOARD_EVENT));
}

export function dispatchRefreshTimesheet() {
  window.dispatchEvent(new Event(REFRESH_TIMESHEET_EVENT));
  window.dispatchEvent(new Event(REFRESH_DASHBOARD_EVENT));
}
