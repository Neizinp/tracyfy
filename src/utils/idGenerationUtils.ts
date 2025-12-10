/**
 * Utility functions for generating unique IDs for different artifact types.
 * Handles finding the next available ID number while respecting already-used numbers.
 */

/**
 * Finds the lowest available number not in the used set
 * @param usedNumbers - Set of already-used numbers
 * @returns The lowest available number (1-indexed)
 */
function findLowestAvailableNumber(usedNumbers: Set<number>): number {
  let nextNumber = 1;
  while (usedNumbers.has(nextNumber)) {
    nextNumber++;
  }
  return nextNumber;
}

/**
 * Generates a new requirement ID (format: REQ-###)
 * @param usedReqNumbers - Set of already-used requirement numbers
 * @returns New unique requirement ID
 */
export function generateNextReqId(usedReqNumbers: Set<number>): string {
  const nextNumber = findLowestAvailableNumber(usedReqNumbers);
  return `REQ-${String(nextNumber).padStart(3, '0')}`;
}

/**
 * Generates a new use case ID (format: UC-###)
 * @param usedUcNumbers - Set of already-used use case numbers
 * @returns New unique use case ID
 */
export function generateNextUcId(usedUcNumbers: Set<number>): string {
  const nextNumber = findLowestAvailableNumber(usedUcNumbers);
  return `UC-${String(nextNumber).padStart(3, '0')}`;
}

/**
 * Generates a new test case ID (format: TC-###)
 * @param usedTestNumbers - Set of already-used test case numbers
 * @returns New unique test case ID
 */
export function generateNextTestCaseId(usedTestNumbers: Set<number>): string {
  const nextNumber = findLowestAvailableNumber(usedTestNumbers);
  return `TC-${String(nextNumber).padStart(3, '0')}`;
}

/**
 * Generates a new information ID (format: INFO-###)
 * @param usedInfoNumbers - Set of already-used information numbers
 * @returns New unique information ID
 */
export function generateNextInfoId(usedInfoNumbers: Set<number>): string {
  const nextNumber = findLowestAvailableNumber(usedInfoNumbers);
  return `INFO-${String(nextNumber).padStart(3, '0')}`;
}
