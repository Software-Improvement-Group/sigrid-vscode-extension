export const SVG_ICON_NAMES = ['jira', 'azure-devops', 'sigrid-light'] as const;
export type SvgIconName = typeof SVG_ICON_NAMES[number];

export function isSvgIconName(value: string): value is SvgIconName {
  return (SVG_ICON_NAMES as readonly string[]).includes(value);
}
