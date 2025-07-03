import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [sessionId, setSessionId] = useState<string | null>(
    localStorage.getItem("admin_session")
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: validationResult, isLoading } = useQuery({
    queryKey: ["/auth/validate"],
    enabled: !!sessionId,
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
    staleTime: 0, // Always validate when needed
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        throw new Error("Login failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      localStorage.setItem("admin_session", data.sessionId);
      queryClient.invalidateQueries({ queryKey: ["/auth/validate"] });
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log in",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (sessionId) {
        await apiRequest("POST", "/auth/logout", {});
      }
    },
    onSuccess: () => {
      setSessionId(null);
      localStorage.removeItem("admin_session");
      queryClient.invalidateQueries({ queryKey: ["/auth/validate"] });
      toast({
        title: "Success",
        description: "Logged out successfully!",
      });
    },
  });

  // Set authorization header for API requests
  useEffect(() => {
    if (sessionId) {
      // Set headers for both /api and /auth routes
      queryClient.setQueryDefaults(["/api"], {
        meta: { headers: { Authorization: `Bearer ${sessionId}` } },
      });
      queryClient.setQueryDefaults(["/auth"], {
        meta: { headers: { Authorization: `Bearer ${sessionId}` } },
      });
    }
  }, [sessionId, queryClient]);

  return {
    isAuthenticated: !!sessionId && (isLoading || validationResult?.isValid),
    isLoading,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
