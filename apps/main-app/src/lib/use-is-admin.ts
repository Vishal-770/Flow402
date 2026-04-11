"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/src/lib/auth-client";

/**
 * Returns true if the current user has the `catalog:create` permission —
 * which means they are an admin (role="admin" or in adminUserIds).
 *
 * Uses Better Auth's authClient.admin.hasPermission — the BA-native way.
 * No manual role string comparisons needed.
 */
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!session?.user) {
      setIsAdmin(false);
      return;
    }

    // Use BA's permission engine — syncs with server-side access control
    authClient.admin.hasPermission({
      permissions: { catalog: ["create"] },
    }).then(({ data }) => {
      setIsAdmin(data?.success === true);
    }).catch(() => {
      setIsAdmin(false);
    });
  }, [session?.user?.id]);

  return isAdmin;
}
