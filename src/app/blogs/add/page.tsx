"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addBlog, Blog } from "@/lib/api";

export default function AddBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [blog, setBlog] = useState<Omit<Blog, "id" | "createdAt" | "updatedAt">>({
    title: "",
    author: "",
    content: "",
    excerpt: "",
    featuredImage: "",
    tags: [],
    status: "draft",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPG, PNG, GIF, or WebP are allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setBlog((prev) => ({ ...prev, featuredImage: ev.target!.result as string }));
        toast.success("Featured image added.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    setBlog((prev) => ({ ...prev, tags }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addBlog({ ...blog, tags: blog.tags ?? [] });
      toast.success("Blog added successfully.");
      router.push("/blogs");
    } catch (err) {
      console.error("Failed to add blog:", err);
      toast.error("Failed to add blog. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Add New Blog</h1>
          <button
            onClick={() => router.push("/blogs")}
            className="px-4 py-2 bg-muted text-foreground border border-border hover:bg-muted/80 rounded text-sm font-medium transition"
          >
            Cancel
          </button>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-card shadow rounded-lg p-6 border border-border"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={blog.title}
                onChange={(e) => setBlog({ ...blog, title: e.target.value })}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter blog title"
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Author *
              </label>
              <input
                type="text"
                required
                value={blog.author}
                onChange={(e) => setBlog({ ...blog, author: e.target.value })}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter author name"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Status
              </label>
              <select
                value={blog.status}
                onChange={(e) =>
                  setBlog({ ...blog, status: e.target.value as "published" | "draft" })
                }
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            {/* Tags */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Tags
              </label>
              <input
                type="text"
                value={blog.tags.join(", ")}
                onChange={handleTagsChange}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="health, nutrition, organic (comma-separated)"
              />
              {blog.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {blog.tags.map((tag, idx) => (
                    <span
                      key={`${tag}-${idx}`}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-foreground/80 border border-border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Featured Image */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Featured Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {blog.featuredImage && (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground mb-2">Preview</p>
                  <img
                    src={blog.featuredImage}
                    alt="Featured"
                    className="w-40 h-28 object-cover rounded border border-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      toast.error("Could not load preview image.");
                    }}
                  />
                </div>
              )}
            </div>

            {/* Excerpt */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Excerpt *
              </label>
              <textarea
                required
                value={blog.excerpt}
                onChange={(e) => setBlog({ ...blog, excerpt: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Brief summary of the blog post"
              />
            </div>

            {/* Content */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Content *
              </label>
              <textarea
                required
                value={blog.content}
                onChange={(e) => setBlog({ ...blog, content: e.target.value })}
                rows={10}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Full blog content"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push("/blogs")}
              className="px-6 py-2 bg-muted text-foreground border border-border hover:bg-muted/80 rounded text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Blog"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
