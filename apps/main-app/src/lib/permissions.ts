import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

/**
 * Custom access control for Flow402.
 * "catalog" covers tokens & chains — the admin-only writable resources.
 */
export const statement = {
  ...defaultStatements,
  catalog: ["create", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

/** Regular user: can only read (no catalog permissions) */
export const user = ac.newRole({
  ...{}, // no catalog perms
});

/** Admin: full catalog control + all default admin perms */
export const adminRole = ac.newRole({
  catalog: ["create", "update", "delete"],
  ...adminAc.statements,
});
