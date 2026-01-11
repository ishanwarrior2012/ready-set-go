import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { logger } from "@/lib/logger";

export type AppRole = "admin" | "moderator" | "user";

interface UseAuthorizationReturn {
  roles: AppRole[];
  isAdmin: boolean;
  isModerator: boolean;
  isUser: boolean;
  loading: boolean;
  hasRole: (role: AppRole) => boolean;
  refreshRoles: () => Promise<void>;
}

export function useAuthorization(): UseAuthorizationReturn {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        logger.error("Error fetching roles:", error);
        setRoles([]);
      } else {
        setRoles(data?.map((r) => r.role as AppRole) || []);
      }
    } catch (err) {
      logger.error("Error fetching roles:", err);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const hasRole = useCallback(
    (role: AppRole) => roles.includes(role),
    [roles]
  );

  return {
    roles,
    isAdmin: roles.includes("admin"),
    isModerator: roles.includes("moderator"),
    isUser: roles.includes("user"),
    loading,
    hasRole,
    refreshRoles: fetchRoles,
  };
}
