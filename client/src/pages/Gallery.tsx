import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminHeader from "@/components/AdminHeader";
import ImageUploadModal from "@/components/ImageUploadModal";
import ImageSearch from "@/components/ImageSearch";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatFileSize } from "@/lib/imageUtils";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Edit, Upload, Calendar, Image as ImageIcon, Search, Trash2 } from "lucide-react";
import type { Image } from "@shared/schema";

export default function Gallery() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: images, isLoading, error } = useQuery<Image[]>({
    queryKey: ["/api/images"],
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await fetch(`/api/images/${imageId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("admin_session")}`
        }
      });
      if (response.status === 401) {
        // Session expired, clear local storage and prompt to login
        localStorage.removeItem("admin_session");
        throw new Error("Session expired. Please log in again.");
      }
      if (!response.ok) {
        throw new Error("Failed to delete image");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete image",
        variant: "destructive",
      });
    },
  });

  // Filter and sort images based on search and sort criteria
  const filteredAndSortedImages = useMemo(() => {
    if (!images) return [];

    let filtered = images;

    // Apply search filter with trimmed lowercase comparison
    if (searchTerm.trim()) {
      const lowercaseSearch = searchTerm.toLowerCase().trim();
      filtered = images.filter(image => 
        image.originalName.toLowerCase().includes(lowercaseSearch)
      );
    }

    // Apply sorting with optimized comparisons
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        case "oldest":
          return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        case "largest":
          return b.size - a.size;
        case "smallest":
          return a.size - b.size;
        case "name":
          return a.originalName.localeCompare(b.originalName);
        default:
          return 0;
      }
    });
  }, [images, searchTerm, sortBy]);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-destructive">Failed to load images. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Photo Gallery</h2>
            <p className="text-muted-foreground">
              Explore our collection of images and create custom designs with text overlays
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span>{filteredAndSortedImages?.length || 0} of {images?.length || 0} Photos</span>
              </div>
              {searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Filtered by: "{searchTerm}"
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Images
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filter Controls */}
        <ImageSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {isLoading ? (
          <LoadingSpinner message="Loading images..." />
        ) : filteredAndSortedImages && filteredAndSortedImages.length > 0 ? (
          <div className="gallery-grid">
            {filteredAndSortedImages.map((image) => (
              <Card key={image.id} className="hover-lift material-transition cursor-pointer group">
                <div className="relative aspect-w-16 aspect-h-12 overflow-hidden rounded-t-xl">
                  <img
                    src={(image.thumbnailUrl || `/uploads/${image.filename}`).startsWith('/') ? (image.thumbnailUrl || `/uploads/${image.filename}`) : `/${image.thumbnailUrl || `/uploads/${image.filename}`}`}
                    alt={image.originalName}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      // Fallback to main image if thumbnail fails
                      if (image.thumbnailUrl && e.currentTarget.src.includes('thumbnails')) {
                        e.currentTarget.src = `/uploads/${image.filename}`;
                      }
                    }}
                    onLoad={() => {
                      console.log("Gallery image loaded:", image.thumbnailUrl || `/uploads/${image.filename}`);
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Badge variant="secondary" className="text-xs">
                      {formatFileSize(image.size)}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium text-foreground truncate mb-1">
                        {image.originalName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          {image.width}×{image.height}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(image.uploadedAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">
                          {image.mimeType.split('/')[1].toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/editor/${image.id}`}>
                          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        {isAuthenticated && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (window.confirm("Are you sure you want to delete this image?")) {
                                deleteImageMutation.mutate(image.id);
                              }
                            }}
                            disabled={deleteImageMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {deleteImageMutation.isPending ? "Deleting..." : "Delete"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searchTerm && images && images.length > 0 ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">No matching images</h3>
            <p className="text-muted-foreground mb-6">
              No images found matching "{searchTerm}". Try adjusting your search terms.
            </p>
            <Button
              variant="outline"
              onClick={() => setSearchTerm("")}
              className="mr-2"
            >
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="text-center py-16">
            <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">No images yet</h3>
            <p className="text-muted-foreground mb-6">
              The gallery is empty. {isAuthenticated ? "Upload some images to get started." : "Admin can upload images to get started."}
            </p>
            {isAuthenticated && (
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Images
              </Button>
            )}
          </div>
        )}
      </main>

      <ImageUploadModal 
        open={showUploadModal} 
        onOpenChange={setShowUploadModal} 
      />
    </div>
  );
}
