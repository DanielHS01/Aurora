export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generateBusinessSlug(businessName: string): string {
  const base = slugify(businessName) || "negocio";
  const suffix = Math.random().toString(36).slice(2, 6); // 4 chars random
  return `${base}-${suffix}`;
}