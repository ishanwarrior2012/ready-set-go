import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { logger } from "@/lib/logger";

export type AppRole = "owner" | "admin" | "moderator" | "developer" | "media" | "staff" | "pro_member" | "member" | "user";

interface UseAuthorizationReturn {
  roles: AppRole[];
  isOwner: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isDeveloper: boolean;
  isStaff: boolean;
  isProMember: boolean;
  isUser: boolean;
  loading: boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
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

  const hasAnyRole = useCallback(
    (checkRoles: AppRole[]) => checkRoles.some((r) => roles.includes(r)),
    [roles]
  );

  return {
    roles,
    isOwner: roles.includes("owner"),
    isAdmin: roles.includes("admin") || roles.includes("owner"),
    isModerator: roles.includes("moderator"),
    isDeveloper: roles.includes("developer"),
    isStaff: roles.includes("staff"),
    isProMember: roles.includes("pro_member"),
    isUser: roles.includes("user"),
    loading,
    hasRole,
    hasAnyRole,
    refreshRoles: fetchRoles,
  };
}
