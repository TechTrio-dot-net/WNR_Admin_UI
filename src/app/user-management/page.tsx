// app/users/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { toast } from "sonner";

type Role = "Admin" | "User";
type Status = "active" | "suspended" | "terminated" | "invited";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  createdAt?: string;
  lastLogin?: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "Admin",
      status: "active",
      createdAt: "2024-01-03T09:12:00Z",
      lastLogin: "2024-09-04T10:00:00Z",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "User",
      status: "suspended",
      createdAt: "2024-01-12T14:20:00Z",
      lastLogin: "2024-08-30T18:47:00Z",
    },
    {
      id: "3",
      name: "Aarav Gupta",
      email: "aarav@shop.co",
      role: "User",
      status: "invited",
      createdAt: "2024-02-02T12:00:00Z",
    },
  ]);

  // search & filters
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery =
        !query ||
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, q, roleFilter, statusFilter]);

  // create/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "User" as Role,
    status: "active" as Status,
  });

  // confirm dialog
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    desc?: string;
    onConfirm?: () => void;
  }>({ open: false, title: "" });

  const resetForm = () =>
    setFormData({ name: "", email: "", role: "User", status: "active" });

  const openCreate = () => {
    setEditingUser(null);
    resetForm();
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setShowModal(true);
  };

  const isEmail = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim().toLowerCase());

  const handleCreateOrUpdate = () => {
    if (!formData.name.trim()) return toast.error("Name is required.");
    if (!isEmail(formData.email)) return toast.error("Enter a valid email.");

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id ? { ...u, ...formData } : u
        )
      );
      toast.success("User updated.");
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        status: formData.status,
        createdAt: new Date().toISOString(),
      };
      setUsers((prev) => [newUser, ...prev]);
      toast.success("User created.");
    }

    setShowModal(false);
    setEditingUser(null);
    resetForm();
  };

  const setStatus = (id: string, status: Status) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
  };

  const handleActivate = (u: User) => {
    if (u.status === "active") return;
    setStatus(u.id, "active");
    toast.success(`${u.name} activated.`);
  };

  const handleSuspend = (u: User) => {
    if (u.status === "terminated") {
      return toast.error("Cannot suspend a terminated user.");
    }
    if (u.status === "suspended") return;
    setStatus(u.id, "suspended");
    toast.warning(`${u.name} suspended.`);
  };

  const handleTerminate = (u: User) => {
    setConfirm({
      open: true,
      title: "Terminate user?",
      desc:
        "This revokes access immediately. You can delete the account later if needed.",
      onConfirm: () => {
        setStatus(u.id, "terminated");
        toast.success(`${u.name} terminated.`);
      },
    });
  };

  const handleDelete = (u: User) => {
    setConfirm({
      open: true,
      title: "Delete user?",
      desc:
        "This will permanently remove the user record. This cannot be undone.",
      onConfirm: () => {
        setUsers((prev) => prev.filter((x) => x.id !== u.id));
        toast.success(`${u.name} deleted.`);
      },
    });
  };

  const handleRowAction = (action: string, u: User) => {
    switch (action) {
      case "edit":
        openEdit(u);
        break;
      case "activate":
        handleActivate(u);
        break;
      case "suspend":
        handleSuspend(u);
        break;
      case "terminate":
        handleTerminate(u);
        break;
      case "delete":
        handleDelete(u);
        break;
      default:
        break;
    }
  };

  const statusBadge = (s: Status) => {
    switch (s) {
      case "active":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20";
      case "suspended":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20";
      case "terminated":
        return "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20";
      case "invited":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground border";
    }
  };

  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-2xl font-bold text-foreground">User Management</h3>
        <button
          onClick={openCreate}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90"
        >
          Create User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email…"
            className="px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All roles</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="suspended">Suspended</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide w-56">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide w-24">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide w-32">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide w-44">
                  Last Login
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide w-[280px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => {
                const canActivate = u.status !== "active";
                const canSuspend = u.status !== "suspended" && u.status !== "terminated";
                const canTerminate = u.status !== "terminated";
                return (
                  <tr key={u.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {u.name}
                      <div className="text-xs text-muted-foreground">
                        Joined {formatDate(u.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{u.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${statusBadge(
                          u.status
                        )}`}
                      >
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {formatDate(u.lastLogin)}
                    </td>
                    <td className="px-4 py-3">
                      {/* Single dropdown for all actions */}
                      <div className="inline-flex items-center gap-2">
                        <select
                          aria-label="Row actions"
                          value="" // keep placeholder after selection
                          onChange={(e) => {
                            const val = e.target.value;
                            e.currentTarget.blur();
                            handleRowAction(val, u);
                          }}
                          className="px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="" disabled>
                            Actions…
                          </option>
                          <option value="edit">Edit</option>
                          <option value="activate" disabled={!canActivate}>
                            Activate
                          </option>
                          <option value="suspend" disabled={!canSuspend}>
                            Suspend
                          </option>
                          <option value="terminate" disabled={!canTerminate}>
                            Terminate
                          </option>
                          <option value="delete">Delete</option>
                        </select>
                        {/* (Optional) quick hint */}
                        <span className="text-xs text-muted-foreground hidden xl:inline">
                          Choose an action
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No users match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-5 border-b border-border">
              <h4 className="text-lg font-semibold">
                {editingUser ? "Edit User" : "Create User"}
              </h4>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Name
                </label>
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Email
                </label>
                <input
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="name@domain.com"
                  type="email"
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as Role })
                    }
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as Status,
                      })
                    }
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="active">Active</option>
                    <option value="invited">Invited</option>
                    <option value="suspended">Suspended</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-border flex flex-col sm:flex-row gap-2 justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingUser(null);
                  resetForm();
                }}
                className="px-4 py-2 rounded-md bg-muted border border-border hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrUpdate}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90"
              >
                {editingUser ? "Save Changes" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirm.open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-border">
              <h4 className="text-lg font-semibold">{confirm.title}</h4>
              {confirm.desc && (
                <p className="text-sm text-muted-foreground mt-1">{confirm.desc}</p>
              )}
            </div>
            <div className="p-5 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                onClick={() => setConfirm({ open: false, title: "" })}
                className="px-4 py-2 rounded-md bg-muted border border-border hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirm.onConfirm?.();
                  setConfirm({ open: false, title: "" });
                }}
                className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:opacity-90"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
