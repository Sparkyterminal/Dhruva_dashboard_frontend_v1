import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { Table, Button, Drawer, Card, Typography, Popconfirm, message, Spin } from "antd";
import { PlusOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import AddLeads from "./AddLeads";
import LeadForm from "./LeadForm";
import { API_BASE_URL } from "../../../../config";

const { Title } = Typography;

/** Get notes display */
function getNotesDisplay(notes) {
  if (!notes) return "—";
  // Show first 100 characters with ellipsis if longer
  return notes.length > 100 ? `${notes.substring(0, 100)}...` : notes;
}

const ViewLeads = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const config = { headers: { Authorization: user?.access_token } };
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [editInitialValues, setEditInitialValues] = useState(null);
  const [editFetching, setEditFetching] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [viewingLead, setViewingLead] = useState(null);
  const [viewFetching, setViewFetching] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}client-leads`, config);
      const list = res.data?.data ?? res.data?.leads ?? res.data;
      setLeads(Array.isArray(list) ? list : []);
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to load leads.");
      setLeads([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- config from closure
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleAddSuccess = () => {
    setDrawerOpen(false);
    fetchLeads();
  };

  const openEditDrawer = (id) => {
    setEditingLeadId(id);
    setEditDrawerOpen(true);
    setEditInitialValues(null);
  };

  useEffect(() => {
    if (!editDrawerOpen || !editingLeadId) return;
    setEditFetching(true);
    axios
      .get(`${API_BASE_URL}client-leads/${editingLeadId}`, config)
      .then((res) => {
        const raw = res.data?.data ?? res.data;
        setEditInitialValues(raw);
      })
      .catch(() => {
        message.error("Failed to load lead.");
        setEditDrawerOpen(false);
      })
      .finally(() => setEditFetching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- config from closure
  }, [editDrawerOpen, editingLeadId]);

  const handleEditSubmit = async (values) => {
    setEditSaving(true);
    try {
      await axios.put(`${API_BASE_URL}client-leads/${editingLeadId}`, values, config);
      message.success("Lead updated successfully.");
      setEditDrawerOpen(false);
      setEditingLeadId(null);
      setEditInitialValues(null);
      fetchLeads();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to update lead.");
    } finally {
      setEditSaving(false);
    }
  };

  const openViewDrawer = (id) => {
    setViewDrawerOpen(true);
    setViewingLead(null);
    setViewFetching(true);
    axios
      .get(`${API_BASE_URL}client-leads/${id}`, config)
      .then((res) => {
        const raw = res.data?.data ?? res.data;
        setViewingLead(raw);
      })
      .catch(() => message.error("Failed to load lead."))
      .finally(() => setViewFetching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- config from closure
  };

  const handleDelete = async (record) => {
    const id = record._id ?? record.id;
    if (!id) return;
    try {
      await axios.delete(`${API_BASE_URL}client-leads/${id}`, config);
      message.success("Lead deleted.");
      fetchLeads();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to delete lead.");
    }
  };

  const columns = [
    {
      title: "Sl no",
      key: "slNo",
      width: 70,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
    },
    {
      title: "Client details",
      dataIndex: "clientDetails",
      key: "clientDetails",
      ellipsis: true,
      render: (t) => t || "—",
    },
    {
      title: "Event type details",
      dataIndex: "eventTypeDetails",
      key: "eventTypeDetails",
      ellipsis: true,
      render: (t) => t || "—",
    },
    {
      title: "Notes",
      key: "notes",
      width: 300,
      ellipsis: true,
      render: (_, record) => (
        <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {getNotesDisplay(record.notes)}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 180,
      render: (_, record) => {
        const id = record._id ?? record.id;
        return (
          <>
            <Button
              type="link"
              size="small"
              onClick={() => openViewDrawer(record._id ?? record.id)}
            >
              View
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => openEditDrawer(id)}
            >
              Edit
            </Button>
            <Popconfirm
              title="Delete this lead?"
              description="This action cannot be undone."
              onConfirm={() => handleDelete(record)}
              okText="Delete"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
            >
              <Button type="link" size="small" danger>
                Delete
              </Button>
            </Popconfirm>
          </>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <Card bordered={false} bodyStyle={{ padding: "24px 28px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/user")}
              style={{ padding: "4px 0" }}
            >
              Back
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              Track Leads
            </Title>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setDrawerOpen(true)}
          >
            Add leads
          </Button>
        </div>

        <Table
          rowKey={(r) => r._id ?? r.id}
          columns={columns}
          dataSource={leads}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} leads` }}
          locale={{ emptyText: "No leads yet. Click “Add leads” to create one." }}
        />
      </Card>

      <Drawer
        title="Add lead"
        placement="right"
        width={480}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
      >
        <AddLeads onSuccess={handleAddSuccess} inDrawer />
      </Drawer>

      <Drawer
        title="Edit lead"
        placement="right"
        width={480}
        open={editDrawerOpen}
        onClose={() => {
          setEditDrawerOpen(false);
          setEditingLeadId(null);
          setEditInitialValues(null);
        }}
        destroyOnClose
      >
        {editFetching ? (
          <div style={{ padding: 24, textAlign: "center" }}>
            <Spin size="large" tip="Loading lead…" />
          </div>
        ) : (
          <LeadForm
            initialValues={editInitialValues}
            onSubmit={handleEditSubmit}
            submitLabel="Update lead"
            loading={editSaving}
          />
        )}
      </Drawer>

      <Drawer
        title="Lead details"
        placement="right"
        width={480}
        open={viewDrawerOpen}
        onClose={() => {
          setViewDrawerOpen(false);
          setViewingLead(null);
        }}
        destroyOnClose
        styles={{ body: { paddingTop: 16 } }}
      >
        {viewFetching ? (
          <div style={{ padding: 24, textAlign: "center" }}>
            <Spin size="large" tip="Loading…" />
          </div>
        ) : viewingLead ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>Status</div>
                <div style={{ fontSize: 15, color: "#0f172a" }}>{viewingLead.status || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>Client details</div>
                <div style={{ fontSize: 15, color: "#0f172a", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {viewingLead.clientDetails || "—"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>Event type details</div>
                <div style={{ fontSize: 15, color: "#0f172a", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {viewingLead.eventTypeDetails || "—"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>Notes</div>
                <div style={{ fontSize: 15, color: "#0f172a", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {viewingLead.notes || "—"}
                </div>
              </div>
            </div>
        ) : null}
      </Drawer>
    </div>
  );
};

export default ViewLeads;
