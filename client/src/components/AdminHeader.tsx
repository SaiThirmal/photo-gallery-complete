import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Crop, Upload, LogOut, LogIn } from "lucide-react";
import AdminLoginModal from "./AdminLoginModal";
import ImageUploadModal from "./ImageUploadModal";
import { useState } from "react";

export default function AdminHeader() {
  const [location] = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <>
      <header className="bg-card shadow-lg sticky top-0 z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <Crop className="text-primary h-8 w-8" />
                <h1 className="text-xl font-semibold text-foreground">PhotoGallery</h1>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/">
                <Button 
                  variant={location === "/" ? "default" : "ghost"}
                  className="material-transition"
                >
                  Gallery
                </Button>
              </Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowUploadModal(true)}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 material-transition"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => logout()}
                    className="text-muted-foreground hover:text-foreground material-transition"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 material-transition"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Admin Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <AdminLoginModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal} 
      />
      
      <ImageUploadModal 
        open={showUploadModal} 
        onOpenChange={setShowUploadModal} 
      />
    </>
  );
}
