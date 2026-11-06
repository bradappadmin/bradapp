export const ROLES = ["super_admin", "admin", "member"] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "super_admin":
      return "Super admin";
    case "admin":
      return "Admin";
    case "member":
      return "Member";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}
