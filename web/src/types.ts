export type Role = "super_admin" | "admin" | "member";

export type User = {
  id: number;
  email: string;
  displayName: string;
  role: Role;
};

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
