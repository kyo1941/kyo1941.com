export function getSafeAdminRedirect(value: string | null) {
  if (!value?.startsWith("/admin")) return "/admin";
  if (value.startsWith("//")) return "/admin";
  return value;
}
