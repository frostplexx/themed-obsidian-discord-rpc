export enum ThemeStyle {
  Default_dark = "default-old-dark",
  Default_light = "default-old-light",
  Default_new_dark = "default-new-dark",
  Default_new_light = "default-new-light",
  Catppuccin_Latte = "latte",
  Catppuccin_Frappe = "frappe",
  Catppuccin_Macchiato = "macchiato",
  Catppuccin_Mocha = "mocha",
  Cyberglow_Dark = "cyberglow-dark",
  Cyberglow_Light = "cyberglow-light",
  Tokyo_night_Dark = "tokyo-night-dark",
  Tokyo_night_Light = "tokyo-night-light"
}

export const THEME_OPTIONS: { [key in ThemeStyle]: string } = {
  [ThemeStyle.Default_dark]: 'Default Dark (Old)',
  [ThemeStyle.Default_light]: 'Default Light (Old)',
  [ThemeStyle.Default_new_dark]: 'Default Dark (New)',
  [ThemeStyle.Default_new_light]: 'Default Light (New)',
  [ThemeStyle.Catppuccin_Latte]: 'Catppuccin Latte',
  [ThemeStyle.Catppuccin_Frappe]: 'Catppuccin Frappe',
  [ThemeStyle.Catppuccin_Macchiato]: 'Catppuccin Macchiato',
  [ThemeStyle.Catppuccin_Mocha]: 'Catppuccin Mocha',
  [ThemeStyle.Cyberglow_Dark]: 'Cyberglow Dark',
  [ThemeStyle.Cyberglow_Light]: 'Cyberglow Light',
  [ThemeStyle.Tokyo_night_Dark]: 'Tokyo Night Dark',
  [ThemeStyle.Tokyo_night_Light]: 'Tokyo Night Light'
};

export const THEME_IMAGES: { [key in ThemeStyle]: string } = {
  [ThemeStyle.Default_dark]: 'default-dark.png',
  [ThemeStyle.Default_light]: 'default-light.png',
  [ThemeStyle.Default_new_dark]: 'default-new-dark.png',
  [ThemeStyle.Default_new_light]: 'default-new-light.png',
  [ThemeStyle.Catppuccin_Latte]: 'catppuccin-latte.png',
  [ThemeStyle.Catppuccin_Frappe]: 'catppuccin-frappe.png',
  [ThemeStyle.Catppuccin_Macchiato]: 'catppuccin-macchiato.png',
  [ThemeStyle.Catppuccin_Mocha]: 'catppuccin-mocha.png',
  [ThemeStyle.Cyberglow_Dark]: 'cyberglow-dark.png',
  [ThemeStyle.Cyberglow_Light]: 'cyberglow-light.png',
  [ThemeStyle.Tokyo_night_Dark]: 'tokyo-night-dark.png',
  [ThemeStyle.Tokyo_night_Light]: 'tokyo-night-light.png'
};
