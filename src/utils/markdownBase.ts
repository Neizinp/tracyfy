import type { CustomAttributeValue } from '../types/customAttributes';

/**
 * Filter out corrupted custom attribute values (strings like "[object Object]")
 * that may have been saved due to previous serialization bugs
 */
export function filterValidCustomAttributes(
    attrs: CustomAttributeValue[] | undefined
): CustomAttributeValue[] {
    return (attrs || []).filter(
        (attr): attr is CustomAttributeValue =>
            typeof attr === 'object' && attr !== null && 'attributeId' in attr
    );
}

/**
 * Convert a JavaScript object to YAML frontmatter string
 */
export function objectToYaml(obj: Record<string, unknown>): string {
    const lines: string[] = ['---'];

    for (const [key, value] of Object.entries(obj)) {
        if (value === undefined || value === null) continue;

        if (typeof value === 'string') {
            // Escape quotes and handle multiline strings
            if (value.includes('\n')) {
                lines.push(`${key}: |`);
                value.split('\n').forEach((line) => lines.push(`  ${line}`));
            } else {
                const escaped = value.replace(/"/g, '\\"');
                lines.push(`${key}: "${escaped}"`);
            }
        } else if (Array.isArray(value)) {
            if (value.length === 0) {
                lines.push(`${key}: []`);
            } else {
                lines.push(`${key}:`);
                value.forEach((item: unknown) => {
                    if (typeof item === 'string') {
                        lines.push(`  - "${item}"`);
                    } else if (typeof item === 'object' && item !== null) {
                        // Serialize objects as JSON for proper storage
                        lines.push(`  - ${JSON.stringify(item)}`);
                    } else {
                        lines.push(`  - ${item}`);
                    }
                });
            }
        } else if (typeof value === 'boolean') {
            lines.push(`${key}: ${value}`);
        } else if (typeof value === 'number') {
            lines.push(`${key}: ${value}`);
        } else if (typeof value === 'object') {
            // Nested object - simple representation
            lines.push(`${key}: ${JSON.stringify(value)}`);
        }
    }

    lines.push('---');
    return lines.join('\n');
}

/**
 * Parse YAML frontmatter from markdown content
 */
export function parseYamlFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
    const lines = content.split('\n');

    if (lines[0] !== '---') {
        return { frontmatter: {}, body: content };
    }

    let endIndex = -1;
    for (let i = 1; i < lines.length; i++) {
        if (lines[i] === '---') {
            endIndex = i;
            break;
        }
    }

    if (endIndex === -1) {
        return { frontmatter: {}, body: content };
    }

    const frontmatterLines = lines.slice(1, endIndex);
    const bodyLines = lines.slice(endIndex + 1);

    const frontmatter: Record<string, unknown> = {};
    let currentKey: string | null = null;
    let currentMultiline: string[] = [];
    let isMultiline = false;
    let isArrayList = false;
    let currentArray: unknown[] = [];

    for (const line of frontmatterLines) {
        if (line.trim() === '') continue;

        // Handle YAML array list items (  - "value" or   - value or   - {json})
        if (isArrayList) {
            if (line.startsWith('  - ')) {
                const itemValue = line.substring(4).trim();
                // Parse the array item value
                if (itemValue.startsWith('"') && itemValue.endsWith('"')) {
                    currentArray.push(itemValue.slice(1, -1).replace(/\\"/g, '"'));
                } else if (itemValue.startsWith('{') && itemValue.endsWith('}')) {
                    // Parse JSON object
                    try {
                        currentArray.push(JSON.parse(itemValue));
                    } catch {
                        currentArray.push(itemValue);
                    }
                } else if (itemValue === 'true' || itemValue === 'false') {
                    currentArray.push(itemValue === 'true');
                } else if (!isNaN(Number(itemValue)) && itemValue !== '') {
                    currentArray.push(Number(itemValue));
                } else {
                    currentArray.push(itemValue);
                }
                continue;
            } else {
                // End of array list
                if (currentKey) {
                    frontmatter[currentKey] = currentArray;
                }
                currentKey = null;
                currentArray = [];
                isArrayList = false;
            }
        }

        if (isMultiline) {
            if (line.startsWith('  ')) {
                currentMultiline.push(line.substring(2));
                continue;
            } else {
                // End of multiline
                if (currentKey) {
                    frontmatter[currentKey] = currentMultiline.join('\n');
                }
                currentKey = null;
                currentMultiline = [];
                isMultiline = false;
            }
        }

        if (!isMultiline && !isArrayList) {
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) continue;

            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();

            if (value === '|') {
                // Start of multiline string
                currentKey = key;
                isMultiline = true;
                currentMultiline = [];
            } else if (value === '') {
                // Could be start of YAML array list (key with no value)
                currentKey = key;
                isArrayList = true;
                currentArray = [];
            } else if (value === '[]') {
                frontmatter[key] = [];
            } else if (value.startsWith('[') && value.endsWith(']')) {
                // Array in JSON format
                try {
                    frontmatter[key] = JSON.parse(value);
                } catch {
                    frontmatter[key] = value;
                }
            } else if (value === 'true' || value === 'false') {
                frontmatter[key] = value === 'true';
            } else if (!isNaN(Number(value)) && value !== '') {
                frontmatter[key] = Number(value);
            } else if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                // Remove both double and single quotes around the value
                frontmatter[key] = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
            } else if (value.startsWith('{') && value.endsWith('}')) {
                // Object in JSON format
                try {
                    frontmatter[key] = JSON.parse(value);
                } catch {
                    frontmatter[key] = value;
                }
            } else {
                frontmatter[key] = value;
            }
        }
    }

    // Handle final multiline/array if still open
    if (isMultiline && currentKey) {
        frontmatter[currentKey] = currentMultiline.join('\n');
    }
    if (isArrayList && currentKey) {
        frontmatter[currentKey] = currentArray;
    }

    return {
        frontmatter,
        body: bodyLines.join('\n').trim(),
    };
}

/**
 * Robustly ensure a value is an array of strings.
 * Handles:
 * - Already an array (returns as is)
 * - Comma-separated string (splits and trims)
 * - Undefined/null (returns empty array)
 */
export function ensureArray<T>(value: unknown): T[] {
    if (Array.isArray(value)) {
        return value as T[];
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0) as unknown as T[];
    }
    return [];
}

/**
 * Extract sections from markdown body based on H2 headers
 */
export function extractH2Sections(body: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = body.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];

    for (const line of lines) {
        if (line.startsWith('## ')) {
            if (currentSection && currentContent.length > 0) {
                sections[currentSection] = currentContent.join('\n').trim();
            }
            currentSection = line.substring(3).trim();
            currentContent = [];
        } else if (line.startsWith('# ')) {
            // Skip main title
            continue;
        } else {
            currentContent.push(line);
        }
    }

    if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
}
