import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { FileText, Eye, Pencil, Trash2, Send, ExternalLink, Search, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type BlogPost = Tables<"blog_posts">;

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-green-500/10 text-green-600 dark:text-green-400",
  scheduled: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  failed: "bg-destructive/10 text-destructive",
};

export default function BlogPosts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [deletePost, setDeletePost] = useState<BlogPost | null>(null);
  const [publishPost, setPublishPost] = useState<BlogPost | null>(null);

  const { data: blogPosts, isLoading, refetch } = useQuery({
    queryKey: ["blog-posts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BlogPost[];
    },
    enabled: !!user?.id,
  });

  const { data: destinations } = useQuery({
    queryKey: ["publishing-destinations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("publishing_destinations")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async (post: Partial<BlogPost> & { id: string }) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          meta_description: post.meta_description,
          seo_keywords: post.seo_keywords,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      setEditPost(null);
      toast({ title: "Blog post updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update blog post", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      setDeletePost(null);
      toast({ title: "Blog post deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete blog post", variant: "destructive" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async ({ postId, destinationId }: { postId: string; destinationId: string }) => {
      // For now, just update the status to published
      // In a real implementation, this would call an edge function to publish to the destination
      const { error } = await supabase
        .from("blog_posts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          published_to: destinationId,
        })
        .eq("id", postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      setPublishPost(null);
      toast({ title: "Blog post published successfully" });
    },
    onError: () => {
      toast({ title: "Failed to publish blog post", variant: "destructive" });
    },
  });

  const filteredPosts = blogPosts?.filter((post) => {
    const matchesSearch =
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.product_title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Blog Posts</h1>
            <p className="text-muted-foreground">Manage your generated affiliate blog posts</p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card>
        <CardHeader>
          <CardTitle className="sr-only">Blog Posts List</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading blog posts...</div>
            ) : filteredPosts?.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No blog posts found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate blog posts from your listings to get started
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts?.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {post.title}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-muted-foreground">
                          {post.product_title || post.amazon_asin || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[post.status || "draft"]}>
                            {post.status || "draft"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {post.generation_mode || "manual"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(post.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPreviewPost(post)}
                              title="Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditPost(post)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {post.status !== "published" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setPublishPost(post)}
                                title="Publish"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            {post.published_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                title="View Published"
                              >
                                <a href={post.published_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletePost(post)}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={!!previewPost} onOpenChange={() => setPreviewPost(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview: {previewPost?.title}</DialogTitle>
            </DialogHeader>
          <DialogHeader>
            <DialogTitle>Preview: {previewPost?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {previewPost?.featured_image_url && (
              <img
                src={previewPost.featured_image_url}
                alt={previewPost.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            <div className="flex flex-wrap gap-2">
              {previewPost?.seo_keywords?.map((keyword, i) => (
                <Badge key={i} variant="secondary">{keyword}</Badge>
              ))}
            </div>
            {previewPost?.excerpt && (
              <p className="text-muted-foreground italic">{previewPost.excerpt}</p>
            )}
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: previewPost?.content || "" }}
            />
            {previewPost?.affiliate_link && (
              <div className="pt-4 border-t">
                <Button asChild>
                  <a href={previewPost.affiliate_link} target="_blank" rel="noopener noreferrer">
                    View on Amazon
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editPost} onOpenChange={() => setEditPost(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
          </DialogHeader>
          {editPost && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editPost.title}
                  onChange={(e) => setEditPost({ ...editPost, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Excerpt</label>
                <Textarea
                  value={editPost.excerpt || ""}
                  onChange={(e) => setEditPost({ ...editPost, excerpt: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Meta Description</label>
                <Textarea
                  value={editPost.meta_description || ""}
                  onChange={(e) => setEditPost({ ...editPost, meta_description: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium">SEO Keywords (comma-separated)</label>
                <Input
                  value={editPost.seo_keywords?.join(", ") || ""}
                  onChange={(e) =>
                    setEditPost({
                      ...editPost,
                      seo_keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean),
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={editPost.content}
                  onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPost(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => editPost && updateMutation.mutate(editPost)}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletePost} onOpenChange={() => setDeletePost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Blog Post</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete "{deletePost?.title}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePost(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletePost && deleteMutation.mutate(deletePost.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>

        {/* Publish Dialog */}
        <PublishDialog
          post={publishPost}
          destinations={destinations || []}
          onClose={() => setPublishPost(null)}
          onPublish={(destinationId) =>
            publishPost && publishMutation.mutate({ postId: publishPost.id, destinationId })
          }
          isPending={publishMutation.isPending}
        />
      </div>
  );
}

function PublishDialog({
  post,
  destinations,
  onClose,
  onPublish,
  isPending,
}: {
  post: BlogPost | null;
  destinations: Tables<"publishing_destinations">[];
  onClose: () => void;
  onPublish: (destinationId: string) => void;
  isPending: boolean;
}) {
  const [selectedDestination, setSelectedDestination] = useState<string>("");

  if (!post) return null;

  return (
    <Dialog open={!!post} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish Blog Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Select a destination to publish "{post.title}"
          </p>
          {destinations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No publishing destinations configured. Go to Blog Generator settings to add one.
            </p>
          ) : (
            <Select value={selectedDestination} onValueChange={setSelectedDestination}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {destinations.map((dest) => (
                  <SelectItem key={dest.id} value={dest.id}>
                    {dest.name} ({dest.destination_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onPublish(selectedDestination)}
            disabled={!selectedDestination || isPending}
          >
            {isPending ? "Publishing..." : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
