import axiosClient from "@/api/axiosClient";
import { mapLimit } from "@/lib/async";

export const getRowId = (row) => row?._id || row?.id;

export const CA_ACTIONS = {
  APPROVED: { verb: "Approve", past: "approved", progressVerb: "Approving", tone: "approve" },
  REJECTED: { verb: "Reject", past: "rejected", progressVerb: "Rejecting", tone: "reject" },
};

export const isCaPending = (row) => row?.ca_check === "PENDING";

/**
 * Applies the CA decision to many requirements. There is no bulk endpoint, so it sends one
 * PATCH per row (a few at a time) and reports each result, so one failure never blocks the rest.
 * `config` is the axios config with the Authorization header.
 * @returns {{ succeeded: object[], failed: { row: object, error: string }[] }}
 */
export const runBulkCaCheck = async ({ rows, action, config, onProgress, concurrency = 4 }) => {
  let done = 0;
  const results = await mapLimit(rows, concurrency, async (row) => {
    try {
      await axiosClient.patch(
        `request/${getRowId(row)}`,
        { ca_check: action, ca_approved: action === "APPROVED" },
        config,
      );
      return { row, ok: true };
    } catch (err) {
      return { row, ok: false, error: err?.response?.data?.message || "Request failed" };
    } finally {
      done += 1;
      onProgress?.(done, rows.length);
    }
  });
  return {
    succeeded: results.filter((r) => r.ok).map((r) => r.row),
    failed: results.filter((r) => !r.ok).map(({ row, error }) => ({ row, error })),
  };
};
