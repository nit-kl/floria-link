/** Bump when shipped assets change so browsers refetch images. */
export const ASSET_VERSION = "5";

export function withAssetVersion(src) {
  if (!src) return src;
  if (src.includes("?")) return src;
  return `${src}?v=${ASSET_VERSION}`;
}
