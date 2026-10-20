import axiosClient from "@/api/axiosClient";
import React, { useEffect, useMemo, useState } from "react";
import { message, Skeleton } from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Building2, CircleCheck, Search } from "lucide-react";
import {
  EmptyState,
  PageHero,
  SearchBox,
  Segmented,
  StatCard,
  StatRow,
} from "@/Components/PageKit";
import "./Departments.css";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
];

const Departments = () => {
  const user = useSelector((state) => state.user.value);
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const config = {
    headers: { Authorization: user?.access_token },
  };

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`department/all`, config);
      setDepartments(res.data.departments || []);
    } catch (err) {
      message.error("Failed to fetch departments");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return departments.filter((d) => {
      if (filter === "active" && !d.is_active) return false;
      if (!q) return true;
      return (
        String(d.name || "").toLowerCase().includes(q) ||
        String(d.department_id || "").toLowerCase().includes(q)
      );
    });
  }, [departments, search, filter]);

  const activeCount = departments.filter((d) => d.is_active).length;

  const open = (departmentId) => navigate(`/user/departments/${departmentId}`);

  return (
    <div className="pk-page">
      <div className="pk-wrap">
        <PageHero
          eyebrow="Organisation"
          title="Departments"
          subtitle="Open a department to see its requests, amounts and status."
          onBack={() => navigate("/user")}
        />

        <StatRow>
          <StatCard
            icon={<Building2 size={21} aria-hidden="true" />}
            label="Total departments"
            value={departments.length}
          />
          <StatCard
            tone="gold"
            icon={<CircleCheck size={21} aria-hidden="true" />}
            label="Active"
            value={activeCount}
          />
        </StatRow>

        <section className="pk-panel">
          <div className="pk-toolbar">
            <div className="pk-toolbar-left">
              <SearchBox
                icon={<Search size={16} aria-hidden="true" />}
                value={search}
                onChange={setSearch}
                placeholder="Search department name or ID"
                label="Search departments"
              />
              <Segmented options={FILTERS} value={filter} onChange={setFilter} label="Status" />
            </div>
            <span className="pk-muted">
              {visible.length} of {departments.length}
            </span>
          </div>

          {loading ? (
            <div className="pk-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div className="pk-card" key={i}>
                  <Skeleton active avatar paragraph={{ rows: 1 }} />
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<Building2 size={26} aria-hidden="true" />}
              title="No departments found"
              hint={search || filter !== "all" ? "Try a different search or filter." : undefined}
            />
          ) : (
            <div className="pk-grid">
              {visible.map((department) => (
                <button
                  type="button"
                  key={department.id}
                  className="pk-card dp-card"
                  onClick={() => open(department.id)}
                >
                  <span className="pk-who">
                    <span className="pk-avatar" aria-hidden="true">
                      {String(department.name || "?").trim().charAt(0).toUpperCase()}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <strong>{department.name}</strong>
                      <span>ID: {department.department_id || "—"}</span>
                    </span>
                  </span>
                  <span className="dp-foot">
                    {department.is_active ? (
                      <span className="pk-pill">Active</span>
                    ) : (
                      <span className="pk-pill is-grey">Inactive</span>
                    )}
                    <span className="dp-go">
                      Open <ArrowRight size={15} aria-hidden="true" />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Departments;
