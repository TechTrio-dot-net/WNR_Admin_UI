"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { fetchBlogs, deleteBlog } from "@/lib/api";

interface Blog {
  id: string;
  title: string;
  author: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  tags: string[];
  status: "published" | "draft";
  createdAt: string;
  updatedAt: string;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // confirm delete modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);

  useEffect(() => {
    const loadBlogs = async () => {
      try {
        const data = await fetchBlogs();
        setBlogs(data);
      } catch (error) {
        console.error("Failed to fetch blogs:", error);
        toast.error("Failed to fetch blogs.");
      } finally {
        setLoading(false);
      }
    };
    loadBlogs();
  }, []);

  const filteredBlogs = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return blogs.filter((blog) => {
      const matchesSearch =
        blog.title.toLowerCase().includes(q) ||
        blog.author.toLowerCase().includes(q) ||
        blog.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || blog.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [blogs, searchTerm, statusFilter]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getStatusBadge = (status: Blog["status"]) => {
    switch (status) {
      case "published":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20";
      case "draft":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

  const askDeleteBlog = (blogId: string) => {
    setTargetId(blogId);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!targetId) return;
    try {
      await deleteBlog(targetId);
      setBlogs((prev) => prev.filter((b) => b.id !== targetId));
      toast.success("Blog deleted.");
    } catch (error) {
      console.error("Failed to delete blog:", error);
      toast.error("Failed to delete blog. Please try again.");
    } finally {
      setConfirmOpen(false);
      setTargetId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-12 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Blog Management</h1>

        <Link
          href="/blogs/add"
          className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition"
        >
          Add New Blog
        </Link>
      </div>

      {/* Blog Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card shadow rounded-lg p-6 border border-border">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Total Blogs</h3>
          <p className="text-3xl font-bold text-foreground">{blogs.length}</p>
        </div>
        <div className="bg-card shadow rounded-lg p-6 border border-border">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Published</h3>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {blogs.filter((b) => b.status === "published").length}
          </p>
        </div>
        <div className="bg-card shadow rounded-lg p-6 border border-border">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Drafts</h3>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
            {blogs.filter((b) => b.status === "draft").length}
          </p>
        </div>
        <div className="bg-card shadow rounded-lg p-6 border border-border">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Authors</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {new Set(blogs.map((b) => b.author)).size}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card shadow rounded-lg p-4 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Search Blogs
            </label>
            <input
              type="text"
              placeholder="Search by title, author, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Blogs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBlogs.map((blog) => (
          <div
            key={blog.id}
            className="bg-card shadow rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            {blog.featuredImage && (
              <img
                src={blog.featuredImage}
                alt={blog.title}
                className="w-full h-48 object-cover"
              />
            )}

            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(blog.status)}`}>
                  {blog.status.toUpperCase()}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(blog.createdAt)}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                {blog.title}
              </h3>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {blog.excerpt}
              </p>

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-foreground">
                  By {blog.author}
                </span>
                {blog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {blog.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-muted text-foreground/80 border border-border px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {blog.tags.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{blog.tags.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/blogs/${blog.id}`}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition text-center"
                >
                  Edit
                </Link>
                <button
                  onClick={() => askDeleteBlog(blog.id)}
                  className="bg-red-600 dark:bg-red-500 text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBlogs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-foreground mb-2">No blogs found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search criteria"
              : "Get started by creating your first blog post"}
          </p>
          <Link
            href="/blogs/add"
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition"
          >
            Create Your First Blog
          </Link>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border rounded-xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-border">
              <h4 className="text-lg font-semibold">Delete blog?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                This action cannot be undone.
              </p>
            </div>
            <div className="p-5 flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={() => { setConfirmOpen(false); setTargetId(null); }}
                className="px-4 py-2 rounded-md bg-muted text-foreground border border-border hover:bg-muted/80 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-md bg-red-600 dark:bg-red-500 text-white hover:opacity-90 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
