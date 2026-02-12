import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin or owner role
    const { data: callerRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const callerRoleList = (callerRoles || []).map((r: any) => r.role);
    const isAdminOrOwner = callerRoleList.includes("admin") || callerRoleList.includes("owner");

    if (!isAdminOrOwner) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    if (action === "list_users") {
      // Get all profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get all roles
      const { data: roles } = await supabase.from("user_roles").select("*");

      // Get auth user emails
      const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const authUsers = authData?.users || [];

      const emailMap: Record<string, string> = {};
      for (const au of authUsers) {
        emailMap[au.id] = au.email || "";
      }

      const usersWithRoles = (profiles || []).map((p: any) => ({
        ...p,
        auth_email: emailMap[p.id] || p.email || "",
        roles: (roles || [])
          .filter((r: any) => r.user_id === p.id)
          .map((r: any) => r.role),
      }));

      return new Response(JSON.stringify({ users: usersWithRoles }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_role") {
      const { user_id, role, operation } = params;

      if (!user_id || !role) {
        return new Response(JSON.stringify({ error: "user_id and role required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate role is a valid enum value
      const validRoles = ["owner", "admin", "moderator", "developer", "media", "staff", "pro_member", "member", "user"];
      if (!validRoles.includes(role)) {
        return new Response(JSON.stringify({ error: "Invalid role" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (operation === "add") {
        const { error } = await supabase
          .from("user_roles")
          .upsert({ user_id, role }, { onConflict: "user_id,role" });
        if (error) throw error;
      } else if (operation === "remove") {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", user_id)
          .eq("role", role);
        if (error) throw error;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
