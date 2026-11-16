/** IDs of the artifacts that are not in the trash */
export function activeIds(items: { id: string; isDeleted?: boolean }[]): string[] {
  return items.filter((item) => !item.isDeleted).map((item) => item.id);
}
