import React, { useState } from "react";
import { Greeting, LiveClock } from "./LiveClock";
import "./RoleHome.css";

/**
 * Shared home screen for every role: greeting and a tabbed workspace. Each role supplies
 * its own tabs. Navigation lives in the site-wide menu (src/Components/AppMenu), which
 * opens by default on this screen.
 *
 * @param {{ tabs: {key: string, label: string, content: React.ReactNode, framed?: boolean}[],
 *           defaultTab?: string }} props
 */
const RoleHome = ({ tabs, defaultTab }) => {
  const [activeKey, setActiveKey] = useState(defaultTab ?? tabs[0]?.key);

  const activeTab = tabs.find((t) => t.key === activeKey) ?? tabs[0];

  const onTabKeyDown = (event, index) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(index + step + tabs.length) % tabs.length];
    setActiveKey(next.key);
    document.getElementById(`rh-tab-${next.key}`)?.focus();
  };

  return (
    <div className="rh-shell">
      <main className="rh-main">
        <div className="rh-column">
          <div className="rh-masthead">
            <Greeting />
            <LiveClock />
            <div className="rh-toran" aria-hidden="true" />
          </div>

          {tabs.length > 1 ? (
            <div role="tablist" aria-label="Workspace" className="rh-tabs">
              {tabs.map((tab, index) => (
                <button
                  key={tab.key}
                  id={`rh-tab-${tab.key}`}
                  type="button"
                  role="tab"
                  className="rh-tab"
                  aria-selected={tab.key === activeTab.key}
                  aria-controls="rh-panel"
                  tabIndex={tab.key === activeTab.key ? 0 : -1}
                  onClick={() => setActiveKey(tab.key)}
                  onKeyDown={(e) => onTabKeyDown(e, index)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : (
            <h2 className="rh-workspace-title">{activeTab.label}</h2>
          )}

          <section
            id="rh-panel"
            role={tabs.length > 1 ? "tabpanel" : undefined}
            aria-labelledby={tabs.length > 1 ? `rh-tab-${activeTab.key}` : undefined}
            className={`rh-panel${activeTab.framed === false ? " rh-panel--bare" : ""}`}
          >
            {activeTab.content}
          </section>
        </div>
      </main>
    </div>
  );
};

export default RoleHome;
