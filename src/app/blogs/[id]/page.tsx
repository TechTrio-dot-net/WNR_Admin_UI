"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { getBlog, updateBlog, Blog } from "@/lib/api";

export default function EditBlogPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    content: "",
    excerpt: "",
    featuredImage: "",
    tags: [] as string[],
    status: "draft" as "published" | "draft",
  });

  useEffect(() => {
    if (!id) return;

    const loadBlog = async () => {
      try {
        const data = await getBlog(id);
        setBlog(data);
        setFormData({
          title: data.title,
          author: data.author,
          content: data.content,
          excerpt: data.excerpt,
          featuredImage: data.featuredImage || "",
          tags: data.tags,
          status: data.status,
        });
      } catch (error) {
        console.error("Failed to fetch blog:", error);
        toast.error("Blog not found.");
        router.push("/blogs");
      } finally {
        setLoading(false);
      }
    };

    loadBlog();
  }, [id, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsString = e.target.value;
    const tags = tagsString
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    setFormData((prev) => ({ ...prev, tags }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    try {
      await updateBlog(id, formData);
      toast.success("Blog updated successfully.");
      router.push("/blogs");
    } catch (error) {
      console.error("Failed to update blog:", error);
      toast.error("Failed to update blog. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="space-y-3">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="p-6">
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Blog Not Found</h1>
          <Link
            href="/blogs"
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition"
          >
            Back to Blogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Edit Blog</h1>
        <Link
          href="/blogs"
          className="bg-muted text-foreground border border-border px-4 py-2 rounded-lg font-medium hover:bg-muted/80 transition"
        >
          Back to Blogs
        </Link>
      </div>

      {/* Form Card */}
      <div className="bg-card shadow rounded-lg p-6 border border-border">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
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
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter author name"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Excerpt *
            </label>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Brief description of the blog post"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Content *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              required
              rows={10}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Full blog content"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Featured Image */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Featured Image URL
              </label>
              <input
                type="url"
                name="featuredImage"
                value={formData.featuredImage}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://example.com/image.jpg"
              />
              {formData.featuredImage && (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground mb-2">Image Preview:</p>
                  <img
                    src={formData.featuredImage}
                    alt="Featured image preview"
                    className="w-full h-32 object-cover rounded-md border border-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags.join(", ")}
              onChange={handleTagsChange}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="health, nutrition, organic (comma-separated)"
            />
            <p className="text-sm text-muted-foreground mt-1">Separate tags with commas</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link
              href="/blogs"
              className="px-6 py-2 rounded bg-muted text-foreground border border-border hover:bg-muted/80 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
