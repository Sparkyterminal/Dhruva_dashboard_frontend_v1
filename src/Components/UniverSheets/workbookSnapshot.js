/**
 * Helpers to safely clone / validate full Univer IWorkbookData snapshots.
 * Ensures multi-sheet workbooks (all tabs + all cellData) survive save/load.
 */

/**
 * Deep-clone JSON-serializable workbook data.
 * Strips non-JSON values and avoids shared references with Univer's live model.
 */
export const cloneWorkbookData = (workbookData) => {
  if (!workbookData || typeof workbookData !== "object") return null;
  try {
    if (typeof structuredClone === "function") {
      return structuredClone(workbookData);
    }
  } catch {
    // fall through to JSON
  }
  try {
    return JSON.parse(JSON.stringify(workbookData));
  } catch {
    return null;
  }
};

/**
 * Count sheets and non-empty cells across the entire workbook (all tabs).
 */
export const getWorkbookStats = (workbookData) => {
  if (!workbookData || typeof workbookData !== "object") {
    return { sheetCount: 0, cellCount: 0, sheetNames: [] };
  }

  const sheets = workbookData.sheets || {};
  const order = Array.isArray(workbookData.sheetOrder)
    ? workbookData.sheetOrder
    : Object.keys(sheets);

  let cellCount = 0;
  const sheetNames = [];

  order.forEach((sheetId) => {
    const sheet = sheets[sheetId];
    if (!sheet) return;
    sheetNames.push(sheet.name || sheetId);
    const cellData = sheet.cellData || {};
    Object.keys(cellData).forEach((rowKey) => {
      const row = cellData[rowKey];
      if (!row || typeof row !== "object") return;
      Object.keys(row).forEach((colKey) => {
        if (row[colKey] != null) cellCount += 1;
      });
    });
  });

  // Also count sheets that exist but are missing from sheetOrder
  Object.keys(sheets).forEach((sheetId) => {
    if (!order.includes(sheetId)) {
      const sheet = sheets[sheetId];
      sheetNames.push(sheet?.name || sheetId);
      const cellData = sheet?.cellData || {};
      Object.keys(cellData).forEach((rowKey) => {
        const row = cellData[rowKey];
        if (!row || typeof row !== "object") return;
        Object.keys(row).forEach((colKey) => {
          if (row[colKey] != null) cellCount += 1;
        });
      });
    }
  });

  return {
    sheetCount: Object.keys(sheets).length,
    cellCount,
    sheetNames,
  };
};

/**
 * Ensure snapshot is a full workbook object with every sheet intact.
 * Rebuilds sheetOrder to include any sheets present in `sheets` that were omitted.
 * Does NOT drop or shrink cellData.
 */
export const prepareWorkbookSnapshotForSave = (workbookData) => {
  const cloned = cloneWorkbookData(workbookData);
  if (!cloned) return null;

  const sheets =
    cloned.sheets && typeof cloned.sheets === "object" ? cloned.sheets : {};
  const sheetIds = Object.keys(sheets);

  if (sheetIds.length === 0) {
    return cloned;
  }

  const existingOrder = Array.isArray(cloned.sheetOrder)
    ? cloned.sheetOrder.filter((id) => sheets[id])
    : [];

  const missing = sheetIds.filter((id) => !existingOrder.includes(id));
  cloned.sheetOrder = [...existingOrder, ...missing];
  cloned.sheets = sheets;

  // Keep styles / resources as-is (needed for multi-sheet formatting)
  if (!cloned.styles || typeof cloned.styles !== "object") {
    cloned.styles = {};
  }
  if (!Array.isArray(cloned.resources)) {
    cloned.resources = cloned.resources ? cloned.resources : [];
  }

  return cloned;
};

/**
 * Ordered list of sheets: [{ id, name }]
 */
export const listWorkbookSheets = (workbookData) => {
  if (!workbookData || typeof workbookData !== "object") return [];
  const sheets =
    workbookData.sheets && typeof workbookData.sheets === "object"
      ? workbookData.sheets
      : {};
  const order = Array.isArray(workbookData.sheetOrder)
    ? workbookData.sheetOrder.filter((id) => sheets[id])
    : [];
  const listed = new Set();
  const result = [];

  order.forEach((sheetId) => {
    listed.add(sheetId);
    result.push({
      id: sheetId,
      name: String(sheets[sheetId]?.name || sheetId),
    });
  });

  Object.keys(sheets).forEach((sheetId) => {
    if (listed.has(sheetId)) return;
    result.push({
      id: sheetId,
      name: String(sheets[sheetId]?.name || sheetId),
    });
  });

  return result;
};

/**
 * Apply sheet tab names (and optional workbook display name) onto a snapshot.
 * Does not drop cellData — only renames.
 *
 * @param {object} workbookData
 * @param {Array<{ id: string, name: string }>|Record<string, string>} sheetNames
 * @param {string} [workbookName] - sets IWorkbookData.name when provided
 */
export const applySheetNamesToWorkbook = (
  workbookData,
  sheetNames,
  workbookName,
) => {
  const cloned = cloneWorkbookData(workbookData);
  if (!cloned) return null;

  const sheets =
    cloned.sheets && typeof cloned.sheets === "object" ? cloned.sheets : {};

  const nameMap = new Map();
  if (Array.isArray(sheetNames)) {
    sheetNames.forEach((row) => {
      if (row?.id == null) return;
      const n = String(row.name ?? "").trim();
      if (n) nameMap.set(String(row.id), n);
    });
  } else if (sheetNames && typeof sheetNames === "object") {
    Object.entries(sheetNames).forEach(([id, name]) => {
      const n = String(name ?? "").trim();
      if (n) nameMap.set(String(id), n);
    });
  }

  nameMap.forEach((name, id) => {
    if (sheets[id] && typeof sheets[id] === "object") {
      sheets[id] = { ...sheets[id], name };
    }
  });

  cloned.sheets = sheets;

  if (workbookName != null && String(workbookName).trim()) {
    cloned.name = String(workbookName).trim();
  }

  return prepareWorkbookSnapshotForSave(cloned);
};

/**
 * True when loaded snapshot looks like a valid multi-sheet-capable workbook.
 */
export const isValidWorkbookData = (workbookData) => {
  if (!workbookData || typeof workbookData !== "object") return false;
  if (!workbookData.sheets || typeof workbookData.sheets !== "object") {
    return false;
  }
  return Object.keys(workbookData.sheets).length > 0;
};
