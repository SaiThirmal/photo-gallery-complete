import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export default function LoadingSpinner({ 
  message = "Loading...", 
  size = "md" 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center space-x-3">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
        <span className="text-muted-foreground">{message}</span>
      </div>
    </div>
  );
}
