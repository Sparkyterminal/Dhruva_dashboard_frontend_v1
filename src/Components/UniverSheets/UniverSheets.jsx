import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import UniverPresetSheetsCoreEnUS from "@univerjs/preset-sheets-core/locales/en-US";
import { createUniver, LocaleType, mergeLocales } from "@univerjs/presets";
import "@univerjs/preset-sheets-core/lib/index.css";
import {
  cloneWorkbookData,
  prepareWorkbookSnapshotForSave,
} from "./workbookSnapshot";

/**
 * Reusable Univer Sheets spreadsheet.
 *
 * `workbook.save()` always returns the FULL workbook (every sheet tab + cellData).
 * We only end the active cell edit first so the latest typed value is included —
 * that does not drop data from other sheets.
 *
 * @example
 * const sheetsRef = useRef(null);
 * <UniverSheets ref={sheetsRef} workbookData={savedSnapshot} />
 * const full = await sheetsRef.current.getWorkbookDataAsync();
 */
const UniverSheets = forwardRef(function UniverSheets(
  {
    workbookData,
    className,
    style,
    onReady,
    readOnly = false,
    header = true,
    toolbar = true,
    footer = true,
    formulaBar = true,
    contextMenu = true,
  },
  ref,
) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  const showHeader = readOnly ? false : header;
  const showToolbar = readOnly ? false : toolbar;
  const showFooter = readOnly ? true : footer; // keep sheet tabs visible in view mode
  const showFormulaBar = readOnly ? false : formulaBar;
  const showContextMenu = readOnly ? false : contextMenu;

  const applyReadOnly = (univerAPI) => {
    try {
      const workbook = univerAPI?.getActiveWorkbook?.();
      if (!workbook) return;
      try {
        workbook.disableSelection?.();
      } catch {
        // optional API
      }
      const permission = workbook.getWorkbookPermission?.();
      permission?.setReadOnly?.();
      permission?.setPermissionDialogVisible?.(false);
    } catch {
      // permission APIs may vary by Univer version
    }
  };

  const commitEditingAndSave = async () => {
    const api = apiRef.current;
    const workbook = api?.getActiveWorkbook?.();
    if (!workbook) return null;

    // Commit only the in-progress editor cell. Other sheets are already in the model.
    try {
      if (typeof workbook.endEditingAsync === "function") {
        await workbook.endEditingAsync(true);
      } else if (typeof workbook.endEditing === "function") {
        workbook.endEditing(true);
      }
    } catch {
      // Editor may not be open
    }

    // Let Univer flush the committed value into the snapshot before save()
    await new Promise((resolve) => setTimeout(resolve, 0));

    const raw = workbook.save?.() ?? null;
    // Full multi-sheet clone — never send a live reference
    return prepareWorkbookSnapshotForSave(raw);
  };

  useImperativeHandle(ref, () => ({
    getAPI: () => apiRef.current,
    getWorkbookData: () => {
      const workbook = apiRef.current?.getActiveWorkbook?.();
      try {
        workbook?.endEditing?.(true);
      } catch {
        // ignore
      }
      return prepareWorkbookSnapshotForSave(workbook?.save?.() ?? null);
    },
    getWorkbookDataAsync: commitEditingAndSave,
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const { univerAPI } = createUniver({
      locale: LocaleType.EN_US,
      locales: {
        [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS),
      },
      presets: [
        UniverSheetsCorePreset({
          container: containerRef.current,
          header: showHeader,
          toolbar: showToolbar,
          footer: showFooter,
          formulaBar: showFormulaBar,
          contextMenu: showContextMenu,
        }),
      ],
    });

    apiRef.current = univerAPI;

    // Clone so Univer owns its copy; React state keeps the full multi-sheet snapshot
    const initial =
      workbookData && typeof workbookData === "object"
        ? cloneWorkbookData(workbookData) || {}
        : {};
    univerAPI.createWorkbook(initial);

    if (readOnly) {
      const applyWhenReady = () => applyReadOnly(univerAPI);
      applyWhenReady();
      try {
        univerAPI.addEvent?.(univerAPI.Event?.LifeCycleChanged, ({ stage }) => {
          if (
            stage === univerAPI.Enum?.LifecycleStages?.Rendered ||
            stage === "Rendered"
          ) {
            applyWhenReady();
          }
        });
      } catch {
        // lifecycle hook optional
      }
    }

    onReady?.(univerAPI);

    return () => {
      try {
        univerAPI.dispose();
      } catch {
        // ignore dispose errors on unmount
      }
      apiRef.current = null;
    };
    // Mount-only: workbookData is initial snapshot (parent remounts via key after load).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 480,
        ...style,
      }}
    />
  );
});

export default UniverSheets;
