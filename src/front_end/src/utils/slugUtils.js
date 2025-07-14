export function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function findApiBySlug(apiCatalog, slug) {
  return apiCatalog.find(api => generateSlug(api.name) === slug);
}