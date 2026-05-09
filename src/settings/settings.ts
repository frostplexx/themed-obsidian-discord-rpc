import { ThemeStyle } from './themes';

export class DiscordRPCSettings {
  showVaultName: boolean = true;
  showCurrentFileName: boolean = true;
  showFolderName: boolean = false;  // ADD THIS LINE
  showConnectionTimer: boolean = false;
  showPopups: boolean = true;
  customVaultName: string = "";
  showFileExtension: boolean = false;
  useLoadedTime: boolean = false;
  connectOnStart: boolean = true;
  autoHideStatusBar: boolean = true;
  privacyMode: boolean = false;
  themeStyle: ThemeStyle = ThemeStyle.Default_new_dark;
}

export enum PluginState {
  connected,
  connecting,
  disconnected,
}