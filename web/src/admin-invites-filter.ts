import type { FamilyInvite } from "./api";

export type AdminInvitesGroup = "all" | "active" | "used";

export const ADMIN_INVITES_GROUP_OPTIONS: Array<{
  id: AdminInvitesGroup;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "used", label: "Used/redeemed" },
];

export type InviteLifecycle = "active" | "used_up" | "expired" | "revoked";

export function inviteLifecycle(
  invite: FamilyInvite,
  nowMs: number = Date.now(),
): InviteLifecycle {
  if (invite.revokedAt) return "revoked";
  if (invite.expiresAt && new Date(invite.expiresAt).getTime() <= nowMs) return "expired";
  if (invite.maxUses != null && invite.usesCount >= invite.maxUses) return "used_up";
  return "active";
}

export function inviteStatusLabel(lifecycle: InviteLifecycle): string {
  switch (lifecycle) {
    case "active":
      return "Active";
    case "used_up":
      return "Used up";
    case "expired":
      return "Expired";
    case "revoked":
      return "Revoked";
    default: {
      const _exhaustive: never = lifecycle;
      return _exhaustive;
    }
  }
}

export function parseAdminInvitesGroup(raw: string | null): AdminInvitesGroup {
  switch (raw) {
    case "active":
    case "used":
      return raw;
    default:
      return "all";
  }
}

export function matchesAdminInvitesQuery(invite: FamilyInvite, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const creator = (invite.createdByDisplayName ?? "").toLowerCase();
  return invite.code.toLowerCase().includes(needle) || creator.includes(needle);
}

export function matchesAdminInvitesGroup(
  invite: FamilyInvite,
  group: AdminInvitesGroup,
  nowMs: number = Date.now(),
): boolean {
  const lifecycle = inviteLifecycle(invite, nowMs);
  switch (group) {
    case "all":
      return true;
    case "active":
      return lifecycle === "active";
    case "used":
      return lifecycle !== "active";
    default: {
      const _exhaustive: never = group;
      return _exhaustive;
    }
  }
}

export function filterAdminInvites(
  invites: FamilyInvite[],
  q: string,
  group: AdminInvitesGroup,
  nowMs: number = Date.now(),
): FamilyInvite[] {
  return invites.filter(
    (invite) =>
      matchesAdminInvitesQuery(invite, q) && matchesAdminInvitesGroup(invite, group, nowMs),
  );
}
