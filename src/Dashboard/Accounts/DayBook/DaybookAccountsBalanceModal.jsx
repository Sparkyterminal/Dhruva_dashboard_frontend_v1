import React, { useEffect, useState } from "react";
import { Button, DatePicker, Form, InputNumber, Modal, Select, Space, message } from "antd";
import dayjs from "dayjs";
import { createOpenCloseBalance, updateOpenCloseBalance } from "./daybookApi";

const ACCOUNT_OPTIONS = [
  "Dhruva Kumar H P-HDFC bank-5540",
  "Skyblue -HDFC-5540",
  "Skyblue -ICICI-1458",
];

const DEFAULT_ACCOUNT_ROWS = ACCOUNT_OPTIONS.map((accountName) => ({
  accountName,
  openingBalance: undefined,
  closingBalance: undefined,
}));

const toYMD = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value?.format === "function") return value.format("YYYY-MM-DD");
  return String(value);
};

const normalizeAccountRows = (record) => {
  const sourceRows = Array.isArray(record?.accountBalances)
    ? record.accountBalances
    : [];
  const sourceMap = new Map(
    sourceRows
      .filter((row) => row?.accountName)
      .map((row) => [
        row.accountName,
        {
          openingBalance: row?.openingBalance,
          closingBalance: row?.closingBalance,
        },
      ]),
  );

  return ACCOUNT_OPTIONS.map((accountName) => ({
    accountName,
    openingBalance: sourceMap.get(accountName)?.openingBalance,
    closingBalance: sourceMap.get(accountName)?.closingBalance,
  }));
};

const DaybookAccountsBalanceModal = ({
  open,
  mode,
  initialValues,
  existingBalances,
  authHeaders,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const isEdit = mode === "edit";

  useEffect(() => {
    if (!open) return;
    const accountRows = normalizeAccountRows(initialValues);
    form.setFieldsValue({
      balanceDate: initialValues?.balanceDate
        ? dayjs(initialValues.balanceDate)
        : null,
      cashOpeningBalance: initialValues?.cashOpeningBalance ?? undefined,
      cashClosingBalance: initialValues?.cashClosingBalance ?? undefined,
      accountRows,
    });
  }, [open, form, initialValues]);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const accountRows = Array.isArray(values?.accountRows)
        ? values.accountRows
        : [];
      const accountOpeningBalance = accountRows.reduce(
        (sum, row) => sum + Number(row?.openingBalance || 0),
        0,
      );
      const accountClosingBalance = accountRows.reduce(
        (sum, row) => sum + Number(row?.closingBalance || 0),
        0,
      );
      const payload = {
        balanceDate: toYMD(values?.balanceDate),
        cashOpeningBalance: values?.cashOpeningBalance,
        cashClosingBalance: values?.cashClosingBalance,
        accountOpeningBalance,
        accountClosingBalance,
        accountBalances: accountRows.map((row) => ({
          accountName: row?.accountName,
          openingBalance: row?.openingBalance,
          closingBalance: row?.closingBalance,
        })),
      };

      if (isEdit) {
        const id = initialValues?._id ?? initialValues?.id;
        await updateOpenCloseBalance({ id, payload, authHeaders });
      } else {
        await createOpenCloseBalance({ payload, authHeaders });
      }

      Modal.destroyAll();
      onSuccess?.();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      message.error("Failed to save balance record");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "Edit Open/Close Balance" : "Add Open/Close Balance"}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{}}
      >
        <Form.Item
          name="balanceDate"
          label="Balance Date"
          rules={[
            {
              validator: async (_, value) => {
                // Optional field, but if provided in Add mode it should be unique per day.
                if (!value || mode !== "add") return Promise.resolve();

                const dateStr = toYMD(value);
                const alreadyExists = (Array.isArray(existingBalances) ? existingBalances : [])
                  .some((item) => item?.balanceDate === dateStr);

                if (alreadyExists) {
                  return Promise.reject(
                    new Error("Balance for this date already exists. Please edit existing record."),
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <DatePicker style={{ width: "100%" }} size="large" />
        </Form.Item>

        <Form.Item
          name="cashOpeningBalance"
          label="Cash Opening Balance"
          rules={[
            { type: "number", min: 0, message: "Must be 0 or greater" },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            precision={2}
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="cashClosingBalance"
          label="Cash Closing Balance"
          rules={[
            { type: "number", min: 0, message: "Must be 0 or greater" },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            precision={2}
            size="large"
          />
        </Form.Item>

        <Form.List
          name="accountRows"
          initialValue={DEFAULT_ACCOUNT_ROWS}
          rules={[
            {
              validator: async (_, rows) => {
                if (!Array.isArray(rows) || rows.length !== 3) {
                  return Promise.reject(new Error("Please configure all 3 accounts."));
                }
                const selected = rows
                  .map((row) => row?.accountName)
                  .filter(Boolean);
                if (selected.length !== 3) {
                  return Promise.reject(new Error("Please select all 3 accounts."));
                }
                if (new Set(selected).size !== 3) {
                  return Promise.reject(new Error("Each account must be unique."));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          {(fields) => (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                Account Opening / Closing
              </div>
              {fields.map((field, index) => (
                <Space
                  key={field.key}
                  style={{ width: "100%", marginBottom: 12 }}
                  align="start"
                >
                  <Form.Item
                    {...field}
                    name={[field.name, "accountName"]}
                    label={index === 0 ? "Account" : ""}
                    rules={[{ required: true, message: "Select account" }]}
                    style={{ width: 220, marginBottom: 0 }}
                  >
                    <Select
                      size="large"
                      options={ACCOUNT_OPTIONS.map((label) => ({
                        label,
                        value: label,
                      }))}
                      placeholder="Select account"
                    />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, "openingBalance"]}
                    label={index === 0 ? "Opening" : ""}
                    rules={[
                      { required: true, message: "Enter opening" },
                      { type: "number", min: 0, message: "Must be 0 or greater" },
                    ]}
                    style={{ flex: 1, marginBottom: 0 }}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      precision={2}
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, "closingBalance"]}
                    label={index === 0 ? "Closing" : ""}
                    rules={[
                      { required: true, message: "Enter closing" },
                      { type: "number", min: 0, message: "Must be 0 or greater" },
                    ]}
                    style={{ flex: 1, marginBottom: 0 }}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      precision={2}
                      size="large"
                    />
                  </Form.Item>
                </Space>
              ))}
            </div>
          )}
        </Form.List>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Button onClick={onCancel} size="large">
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            size="large"
          >
            {isEdit ? "Update" : "Add"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default DaybookAccountsBalanceModal;

