"use client";

import { useEffect, useMemo, useState } from "react";

type Branch = {
  id: number;
  name: string;
  code: string;
  manager: string;
  active: boolean;
};

type Employee = {
  id: number;
  name: string;
  branchId: number;
  days: number;
  gross: number;
  returns: number;
};

const STORAGE_KEY = "salestrack-functional-v2";

const defaultBranches: Branch[] = [
  { id: 1, name: "Cairo Main", code: "CAI-001", manager: "Branch Manager", active: true },
  { id: 2, name: "Giza Branch", code: "GIZ-001", manager: "Giza Manager", active: true },
];

const defaultEmployees: Employee[] = [
  { id: 1, name: "Ahmed Hassan", branchId: 1, days: 26, gross: 42000, returns: 1200 },
  { id: 2, name: "Mohamed Ali", branchId: 1, days: 24, gross: 38000, returns: 800 },
  { id: 3, name: "Sara Ibrahim", branchId: 2, days: 22, gross: 31000, returns: 500 },
];

export default function Dashboard() {
  const [tab, setTab] = useState("Dashboard");
  const [target, setTarget] = useState(120000);
  const [branches, setBranches] = useState<Branch[]>(defaultBranches);
  const [employees, setEmployees] = useState<Employee[]>(defaultEmployees);
  const [selectedBranchId, setSelectedBranchId] = useState<number | "all">("all");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.branches?.length) setBranches(data.branches);
        if (data.employees) setEmployees(data.employees);
        if (typeof data.target === "number") setTarget(data.target);
      } catch {}
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ branches, employees, target })
      );
    }
  }, [branches, employees, target, hydrated]);

  const visibleEmployees = useMemo(
    () =>
      selectedBranchId === "all"
        ? employees
        : employees.filter((e) => e.branchId === selectedBranchId),
    [employees, selectedBranchId]
  );

  const branchEmployeeCount = (branchId: number) =>
    employees.filter((e) => e.branchId === branchId).length;

  const branchTarget = (branchId: number) => {
    if (branches.length === 0) return 0;
    if (selectedBranchId !== "all") {
      return selectedBranchId === branchId ? target : 0;
    }
    return target / branches.length;
  };

  const allocatedTarget = (employee: Employee) => {
    const branchEmployees = employees.filter(
      (e) => e.branchId === employee.branchId
    );
    const totalDays = branchEmployees.reduce((s, e) => s + Number(e.days || 0), 0);
    const currentBranchTarget = branchTarget(employee.branchId);
    return totalDays > 0
      ? (currentBranchTarget * Number(employee.days || 0)) / totalDays
      : 0;
  };

  const net = (employee: Employee) =>
    Number(employee.gross || 0) - Number(employee.returns || 0);

  const totalNet = visibleEmployees.reduce((s, e) => s + net(e), 0);
  const currentTarget =
    selectedBranchId === "all" ? target : branchTarget(selectedBranchId);
  const achievement = currentTarget ? (totalNet / currentTarget) * 100 : 0;

  function addBranch() {
    const id = Date.now();
    setBranches((items) => [
      ...items,
      {
        id,
        name: "New Branch",
        code: `BR-${String(items.length + 1).padStart(3, "0")}`,
        manager: "Not Assigned",
        active: true,
      },
    ]);
  }

  function updateBranch(id: number, field: keyof Branch, value: string | boolean) {
    setBranches((items) =>
      items.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  }

  function deleteBranch(id: number) {
    const count = branchEmployeeCount(id);
    if (count > 0) {
      alert(
        `This branch has ${count} employee(s). Please reassign or delete the employees before deleting the branch.`
      );
      return;
    }
    if (!confirm("Delete this branch?")) return;
    setBranches((items) => items.filter((b) => b.id !== id));
    if (selectedBranchId === id) setSelectedBranchId("all");
  }

  function addEmployee() {
    if (!branches.length) {
      alert("Please create a branch first.");
      setTab("Branches");
      return;
    }
    setEmployees((items) => [
      ...items,
      {
        id: Date.now(),
        name: "New Employee",
        branchId: branches[0].id,
        days: 26,
        gross: 0,
        returns: 0,
      },
    ]);
  }

  function updateEmployee(
    id: number,
    field: keyof Employee,
    value: string | number
  ) {
    setEmployees((items) =>
      items.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  }

  function deleteEmployee(id: number) {
    if (confirm("Delete this employee?")) {
      setEmployees((items) => items.filter((e) => e.id !== id));
    }
  }

  const menu = ["Dashboard", "Branches", "Employees", "Daily Sales", "Reports", "Settings"];

  return (
    <main className="app">
      <aside>
        <div className="logo">Sales<span>Track</span><small>PRO</small></div>
        <div className="user">👤 Super Administrator<br/><small>System Owner</small></div>

        {menu.map((m) => (
          <button
            key={m}
            className={tab === m ? "nav active" : "nav"}
            onClick={() => setTab(m)}
          >
            {m}
          </button>
        ))}
        <div className="sideFoot">© SalesTrack Online</div>
      </aside>

      <section className="workspace">
        <header>
          <div>
            <h1>{tab}</h1>
            <p>Manage your branches, employees, sales and performance.</p>
          </div>
          <div className="headerActions">
            <button>🔔</button>
            <button className="primary">September 2026</button>
          </div>
        </header>

        {tab === "Dashboard" && (
          <>
            <div className="filterBar">
              <label>View Branch</label>
              <select
                value={selectedBranchId}
                onChange={(e) =>
                  setSelectedBranchId(
                    e.target.value === "all" ? "all" : Number(e.target.value)
                  )
                }
              >
                <option value="all">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="cards">
              <Card t="Monthly Target" v={currentTarget.toLocaleString()} />
              <Card t="Net Sales" v={totalNet.toLocaleString()} />
              <Card t="Achievement" v={achievement.toFixed(1) + "%"} />
              <Card t="Remaining" v={Math.max(0, currentTarget - totalNet).toLocaleString()} />
            </div>

            <div className="grid2">
              <div className="panel">
                <h3>Monthly Sales Progress</h3>
                <div className="progress">
                  <div style={{ width: Math.min(100, achievement) + "%" }} />
                </div>
                <strong>{achievement.toFixed(1)}% achieved</strong>
                <p>{totalNet.toLocaleString()} of {currentTarget.toLocaleString()}</p>
              </div>

              <div className="panel">
                <h3>Branch Performance</h3>
                {branches.map((b) => {
                  const branchEmployees = employees.filter((e) => e.branchId === b.id);
                  const branchNet = branchEmployees.reduce((s, e) => s + net(e), 0);
                  const bt = branchTarget(b.id);
                  const p = bt ? (branchNet / bt) * 100 : 0;
                  return <Rank key={b.id} name={b.name} value={p} />;
                })}
              </div>
            </div>
          </>
        )}

        {tab === "Branches" && (
          <div className="panel">
            <div className="panelHead">
              <div>
                <h3>Branch Management</h3>
                <p>Add, edit and remove branches.</p>
              </div>
              <button className="primary" onClick={addBranch}>+ Add Branch</button>
            </div>

            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Branch Name</th>
                    <th>Code</th>
                    <th>Branch Manager</th>
                    <th>Employees</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <input
                          value={b.name}
                          onChange={(e) => updateBranch(b.id, "name", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          value={b.code}
                          onChange={(e) => updateBranch(b.id, "code", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          value={b.manager}
                          onChange={(e) => updateBranch(b.id, "manager", e.target.value)}
                        />
                      </td>
                      <td>{branchEmployeeCount(b.id)}</td>
                      <td>
                        <select
                          value={b.active ? "Active" : "Inactive"}
                          onChange={(e) =>
                            updateBranch(b.id, "active", e.target.value === "Active")
                          }
                        >
                          <option>Active</option>
                          <option>Inactive</option>
                        </select>
                      </td>
                      <td>
                        <button className="danger" onClick={() => deleteBranch(b.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "Employees" && (
          <div className="panel">
            <div className="panelHead">
              <div>
                <h3>Employee & Target Management</h3>
                <p>Assign every employee to a branch and distribute targets by working days.</p>
              </div>
              <button className="primary" onClick={addEmployee}>+ Add Employee</button>
            </div>

            <div className="targetBox">
              <label>Company Monthly Target</label>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value || 0))}
              />
            </div>

            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Assigned Branch</th>
                    <th>Working Days</th>
                    <th>Allocated Target</th>
                    <th>Gross Sales</th>
                    <th>Returns</th>
                    <th>Net Sales</th>
                    <th>Achievement</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e) => {
                    const a = allocatedTarget(e);
                    const p = a ? (net(e) / a) * 100 : 0;
                    return (
                      <tr key={e.id}>
                        <td>
                          <input
                            value={e.name}
                            onChange={(x) => updateEmployee(e.id, "name", x.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            value={e.branchId}
                            onChange={(x) =>
                              updateEmployee(e.id, "branchId", Number(x.target.value))
                            }
                          >
                            {branches.map((b) => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="31"
                            value={e.days}
                            onChange={(x) =>
                              updateEmployee(e.id, "days", Number(x.target.value))
                            }
                          />
                        </td>
                        <td>{a.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td>{e.gross.toLocaleString()}</td>
                        <td>{e.returns.toLocaleString()}</td>
                        <td>{net(e).toLocaleString()}</td>
                        <td className={p >= 100 ? "good" : "warn"}>{p.toFixed(1)}%</td>
                        <td>
                          <button className="danger" onClick={() => deleteEmployee(e.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "Daily Sales" && (
          <div className="panel">
            <div className="panelHead">
              <h3>Daily Sales Entry</h3>
              <input className="date" type="date" defaultValue="2026-09-01" />
            </div>
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Branch</th>
                    <th>Gross Sales</th>
                    <th>Returns</th>
                    <th>Net Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e) => (
                    <tr key={e.id}>
                      <td>{e.name}</td>
                      <td>{branches.find((b) => b.id === e.branchId)?.name || "-"}</td>
                      <td>
                        <input
                          type="number"
                          value={e.gross}
                          onChange={(x) =>
                            updateEmployee(e.id, "gross", Number(x.target.value))
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={e.returns}
                          onChange={(x) =>
                            updateEmployee(e.id, "returns", Number(x.target.value))
                          }
                        />
                      </td>
                      <td>{net(e).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "Reports" && (
          <div className="panel">
            <h3>Performance Report</h3>
            <p>Branch and employee data are calculated from the current system records.</p>
            <div className="cards compactCards">
              <Card t="Branches" v={String(branches.length)} />
              <Card t="Employees" v={String(employees.length)} />
              <Card t="Net Sales" v={employees.reduce((s, e) => s + net(e), 0).toLocaleString()} />
              <Card t="Target" v={target.toLocaleString()} />
            </div>
          </div>
        )}

        {tab === "Settings" && (
          <div className="panel">
            <h3>System Settings</h3>
            <p>Current version stores demo data in your browser. The next production step is Supabase persistence so all users share the same online database.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function Card({ t, v }: { t: string; v: string }) {
  return <div className="card"><span>{t}</span><strong>{v}</strong></div>;
}

function Rank({ name, value }: { name: string; value: number }) {
  return (
    <div className="rank">
      <div><b>{name}</b><span>{value.toFixed(1)}%</span></div>
      <div className="miniProgress"><i style={{ width: Math.min(100, value) + "%" }} /></div>
    </div>
  );
}
