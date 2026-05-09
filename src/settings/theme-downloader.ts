import { ThemeStyle, THEME_OPTIONS } from './themes';
import { requestUrl, DataAdapter } from 'obsidian';

export class ThemeDownloader {
  private readonly GITHUB_REPO = 'Mouadhbendjedidi/themed-obsidian-discord-rpc';
  private readonly GITHUB_BRANCH = 'main';
  private readonly THEMES_BASE_URL = `https://raw.githubusercontent.com/${this.GITHUB_REPO}/${this.GITHUB_BRANCH}/assets/themes`;

  async downloadTheme(themeStyle: ThemeStyle, dataPath: string, adapter: DataAdapter): Promise<void> {
    const fileName = this.getThemeFileName(themeStyle);
    const url = `${this.THEMES_BASE_URL}/${fileName}`;
    
    try {
      const response = await requestUrl({ url });
      
      if (response.status !== 200) {
        throw new Error(`Failed to download theme: HTTP ${response.status}`);
      }
      
      // Save to plugin data folder
      const themePath = `${dataPath}/theme-${themeStyle}.png`;
      await adapter.writeBinary(themePath, response.arrayBuffer);
      
      return;
    } catch (error) {
      throw new Error(`Failed to download theme ${THEME_OPTIONS[themeStyle]}: ${error}`);
    }
  }

  async downloadAllThemes(dataPath: string, adapter: DataAdapter): Promise<void> {
    const themes = Object.values(ThemeStyle) as ThemeStyle[];
    const errors: string[] = [];

    for (const theme of themes) {
      try {
        await this.downloadTheme(theme, dataPath, adapter);
      } catch (error) {
        errors.push(error as string);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Some themes failed to download:\n${errors.join('\n')}`);
    }
  }

  async updateThemes(dataPath: string, adapter: DataAdapter): Promise<{ updated: string[]; skipped: string[] }> {
    const themes = Object.values(ThemeStyle) as ThemeStyle[];
    const updated: string[] = [];
    const skipped: string[] = [];

    for (const theme of themes) {
      const themePath = this.getLocalThemePath(theme, dataPath);
      
      try {
        const exists = await adapter.exists(themePath);
        if (!exists) {
          // Download missing theme
          await this.downloadTheme(theme, dataPath, adapter);
          updated.push(THEME_OPTIONS[theme]);
        } else {
          skipped.push(THEME_OPTIONS[theme]);
        }
      } catch (error) {
        throw new Error(`Failed to download ${THEME_OPTIONS[theme]}: ${error}`);
      }
    }

    return { updated, skipped };
  }

  getLocalThemePath(themeStyle: ThemeStyle, dataPath: string): string {
    return `${dataPath}/theme-${themeStyle}.png`;
  }

  private getThemeFileName(themeStyle: ThemeStyle): string {
    switch (themeStyle) {
      case ThemeStyle.Default_dark:
        return 'default-dark.png';
      case ThemeStyle.Default_light:
        return 'default-light.png';
      case ThemeStyle.Default_new_dark:
        return 'default-new-dark.png';
      case ThemeStyle.Default_new_light:
        return 'default-new-light.png';
      case ThemeStyle.Catppuccin_Latte:
        return 'catppuccin-latte.png';
      case ThemeStyle.Catppuccin_Frappe:
        return 'catppuccin-frappe.png';
      case ThemeStyle.Catppuccin_Macchiato:
        return 'catppuccin-macchiato.png';
      case ThemeStyle.Catppuccin_Mocha:
        return 'catppuccin-mocha.png';
      case ThemeStyle.Cyberglow_Dark:
        return 'cyberglow-dark.png';
      case ThemeStyle.Cyberglow_Light:
        return 'cyberglow-light.png';
      case ThemeStyle.Tokyo_night_Dark:
        return 'tokyo-night-dark.png';
      case ThemeStyle.Tokyo_night_Light:
        return 'tokyo-night-light.png';
      default:
        throw new Error(`Unknown theme: ${themeStyle}`);
    }
  }
}
