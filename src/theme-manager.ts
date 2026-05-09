/**
 * Theme Manager - Fetches and manages theme images from GitHub repository
 * Fetches from the latest release tag, not main branch
 */

const GITHUB_REPO = "Mouadhbendjedidi/themed-obsidian-discord-rpc";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}`;

interface ThemeImage {
  name: string;
  displayName: string;
  url: string;
}

interface ThemeConfig {
  name: string;
  displayName: string;
  filename: string;
}

let cachedThemeImages: ThemeImage[] | null = null;
let cachedThemeConfig: ThemeConfig[] | null = null;
let cachedLatestTag: string | null = null;
let cacheTimestamp: number = 0;
let configCacheTimestamp: number = 0;
let tagCacheTimestamp: number = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

/**
 * Get the latest release tag from GitHub
 */
async function getLatestTag(): Promise<string> {
  const now = Date.now();

  // Return cached tag if still valid
  if (
    cachedLatestTag !== null &&
    now - tagCacheTimestamp < CACHE_DURATION
  ) {
    return cachedLatestTag;
  }

  try {
    const response = await fetch(`${GITHUB_API_URL}/releases/latest`);

    if (!response.ok) {
      console.warn(`Failed to fetch latest release: ${response.status}`);
      return "main"; // Fallback to main if API fails
    }

    const releaseData = await response.json();
    const tag = releaseData.tag_name || "main";
    
    cachedLatestTag = tag;
    tagCacheTimestamp = now;
    
    return tag;
  } catch (error) {
    console.warn("Error fetching latest tag:", error);
    return "main"; // Fallback to main if fetch fails
  }
}

/**
 * Get the raw GitHub URL for a file at the latest tag
 */
async function getGitHubRawUrl(filePath: string): Promise<string> {
  const tag = await getLatestTag();
  return `https://raw.githubusercontent.com/${GITHUB_REPO}/${tag}/${filePath}`;
}

/**
 * Load theme configuration from themes.json
 */
async function loadThemeConfig(): Promise<ThemeConfig[]> {
  const now = Date.now();

  // Return cached config if still valid
  if (
    cachedThemeConfig !== null &&
    now - configCacheTimestamp < CACHE_DURATION
  ) {
    return cachedThemeConfig;
  }

  try {
    const themesJsonUrl = await getGitHubRawUrl("assets/themes/themes.json");
    const response = await fetch(themesJsonUrl);
    
    if (!response.ok) {
      console.warn(`Failed to fetch themes.json: ${response.status}`);
      return getDefaultThemeConfig();
    }

    const config = await response.json();
    
    if (!Array.isArray(config)) {
      console.warn("Unexpected format in themes.json");
      return getDefaultThemeConfig();
    }

    cachedThemeConfig = config;
    configCacheTimestamp = now;
    return config;
  } catch (error) {
    console.warn("Error loading themes.json:", error);
    return getDefaultThemeConfig();
  }
}

/**
 * Get default theme configuration as fallback
 */
function getDefaultThemeConfig(): ThemeConfig[] {
  return [
    {
      name: "default-old-dark",
      displayName: "Default Dark (Old)",
      filename: "default-old-dark.png",
    },
    {
      name: "default-old-light",
      displayName: "Default Light (Old)",
      filename: "default-old-light.png",
    },
    {
      name: "default-new-dark",
      displayName: "Default Dark (New)",
      filename: "default-new-dark.png",
    },
    {
      name: "default-new-light",
      displayName: "Default Light (New)",
      filename: "default-new-light.png",
    },
  ];
}

/**
 * Fetch the list of PNG files from GitHub repository using themes.json
 */
async function fetchThemeImagesFromGitHub(): Promise<ThemeImage[]> {
  try {
    const config = await loadThemeConfig();
    const tag = await getLatestTag();
    const themesBaseUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${tag}/assets/themes`;
    
    const themeImages: ThemeImage[] = config.map((theme: ThemeConfig) => ({
      name: theme.name,
      displayName: theme.displayName,
      url: `${themesBaseUrl}/${theme.filename}`,
    }));

    return themeImages.length > 0 ? themeImages : buildFallbackThemes(getDefaultThemeConfig());
  } catch (error) {
    console.warn("Error fetching theme images from GitHub:", error);
    return buildFallbackThemes(getDefaultThemeConfig());
  }
}

/**
 * Build ThemeImage array from ThemeConfig
 */
function buildFallbackThemes(config: ThemeConfig[]): ThemeImage[] {
  const themesBaseUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/assets/themes`;
  return config.map((theme: ThemeConfig) => ({
    name: theme.name,
    displayName: theme.displayName,
    url: `${themesBaseUrl}/${theme.filename}`,
  }));
}

/**
 * Get all available theme images (with caching)
 */
export async function getThemeImages(): Promise<ThemeImage[]> {
  const now = Date.now();

  // Return cached data if still valid
  if (
    cachedThemeImages !== null &&
    now - cacheTimestamp < CACHE_DURATION
  ) {
    return cachedThemeImages;
  }

  // Fetch fresh data from GitHub
  const images = await fetchThemeImagesFromGitHub();
  cachedThemeImages = images;
  cacheTimestamp = now;

  return images;
}

/**
 * Get the image URL for a specific theme style
 * Falls back to theme style key if image not found
 */
export async function getThemeImageUrl(themeStyle: string): Promise<string> {
  const images = await getThemeImages();
  const image = images.find((img) => img.name === themeStyle);

  if (image) {
    return image.url;
  }

  // If no image found, return the theme style as fallback
  // (will use Discord portal assets if they exist)
  return themeStyle;
}

/**
 * Get all theme images and their URLs as a map
 */
export async function getThemeImageMap(): Promise<Record<string, string>> {
  const images = await getThemeImages();
  const map: Record<string, string> = {};

  images.forEach((img) => {
    map[img.name] = img.url;
  });

  return map;
}

/**
 * Get all theme images with display names
 */
export async function getAllThemesWithDisplay(): Promise<
  Array<{ name: string; displayName: string; url: string }>
> {
  return getThemeImages();
}

/**
 * Clear the cache (useful for testing or manual refresh)
 */
export function clearThemeCache(): void {
  cachedThemeImages = null;
  cachedThemeConfig = null;
  cachedLatestTag = null;
  cacheTimestamp = 0;
  configCacheTimestamp = 0;
  tagCacheTimestamp = 0;
}
