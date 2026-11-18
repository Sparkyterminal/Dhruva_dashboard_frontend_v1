import { toast } from "@/Components/AdminKit/toast";
import { fetchBillUrl } from "./everydayApi";

/**
 * Opens a bill in a new tab. The tab is opened first (so pop-up blockers allow it) and pointed at
 * the short-lived signed link once the API returns it.
 */
export const openBill = async ({ key, authHeaders }) => {
  const tab = window.open("", "_blank");
  try {
    const url = await fetchBillUrl({ key, authHeaders });
    if (!url) throw new Error("No link");
    if (tab) tab.location.href = url;
    else window.location.href = url;
  } catch {
    tab?.close();
    toast.error("Could not open the bill. Please try again.");
  }
};
