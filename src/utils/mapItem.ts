
export function findMemberByKeyFromMap(
  datasMap: Record<string, any>,
  key: string
): any | undefined {
  return datasMap[key];
}
