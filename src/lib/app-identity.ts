import packageJson from "../../package.json";

function formatPackageDisplayName(name: string): string {
  return name
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export const APP_PACKAGE_NAME = packageJson.name;
export const APP_VERSION = packageJson.version;
export const APP_DISPLAY_NAME = formatPackageDisplayName(APP_PACKAGE_NAME);
export const APP_BRAND_TITLE = `${APP_DISPLAY_NAME} v${APP_VERSION}`;
