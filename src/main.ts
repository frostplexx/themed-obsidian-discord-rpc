import { Client } from "discord-rpc";
import { MarkdownView, Plugin, PluginManifest, TFile } from "obsidian";
import { Logger } from "./logger";
import { DiscordRPCSettings, PluginState } from "./settings/settings";
import { DiscordRPCSettingsTab } from "./settings/settings-tab";
import { StatusBar } from "./status-bar";
import { ThemeStyle } from "./settings/themes";
import { ThemeDownloader } from "./settings/theme-downloader";

export default class ObsidianDiscordRPC extends Plugin {
  public state: PluginState = PluginState.disconnected;
  public settings: DiscordRPCSettings = new DiscordRPCSettings();
  public statusBar!: StatusBar;
  public rpc!: Client;
  public logger: Logger = new Logger(this);
  public currentFile!: TFile;
  public loadedTime!: Date;
  public lastSetTime!: Date;
  private themeDownloader!: ThemeDownloader;

  setState(state: PluginState) {
    this.state = state;
  }

  getState(): PluginState {
    return this.state;
  }

  public getApp(): any {
    return this.app;
  }

  public getPluginManifest(): PluginManifest {
    return this.manifest;
  }

  public getDataPath(): string {
    return `${this.app.vault.configDir}/plugins/${this.manifest.id}`;
  }

  async onload() {
    const statusBarEl = this.addStatusBarItem();
    this.statusBar = new StatusBar(statusBarEl);
    this.themeDownloader = new ThemeDownloader();

    // Ensure data folder exists
    const dataPath = this.getDataPath();
    if (!(await this.app.vault.adapter.exists(dataPath))) {
      await this.app.vault.adapter.mkdir(dataPath);
    }

    this.settings = (await this.loadData()) || new DiscordRPCSettings();

    // Auto-download themes if not already downloaded
    this.autoDownloadThemesIfNeeded(dataPath);

    this.registerEvent(
      this.app.workspace.on("file-open", this.onFileOpen, this)
    );

    this.registerInterval(
      window.setInterval(async () => {
        if (
          this.settings.showConnectionTimer &&
          this.getState() == PluginState.connected
        ) {
          this.statusBar.displayTimer(
            this.settings.useLoadedTime ? this.loadedTime : this.lastSetTime,
          );
        }
      }, 500),
    );

    this.registerDomEvent(statusBarEl, "click", async () => {
      if (this.getState() == PluginState.disconnected) {
        await this.connectDiscord();
      } else if (this.getState() == PluginState.connected) {
        await this.disconnectDiscord();
      }
    });

    this.addSettingTab(new DiscordRPCSettingsTab(this.app, this));

    this.addCommand({
      id: "reconnect-discord",
      name: "Reconnect to Discord",
      callback: async () => await this.connectDiscord(),
    });

    this.addCommand({
      id: "disconnect-discord",
      name: "Disconnect from Discord",
      callback: async () => await this.disconnectDiscord(),
    });

    if (this.settings.connectOnStart) {
      this.connectDiscord().then(() => {

        let view = this.app.workspace.getActiveViewOfType(MarkdownView);
        const files: TFile[] = this.app.vault.getMarkdownFiles();

        if (view) {
          const displayText = view.getDisplayText();
          files.forEach((file) => {
            if (file.basename === displayText) {
              this.onFileOpen(file);
            }
          });
        }
      });
    } else {
      this.setState(PluginState.disconnected);
      this.statusBar.displayState(
        this.getState(),
        this.settings.autoHideStatusBar
      );
    }
  }

  async onFileOpen(file: TFile) {
    this.currentFile = file;
    if (this.getState() === PluginState.connected) {
      await this.setActivity(
        this.app.vault.getName(),
        file.basename,
        file.extension
      );
    }
  }

  async onunload() {
    await this.saveData(this.settings);
    this.rpc.clearActivity();
    this.rpc.destroy();
  }

  async connectDiscord(): Promise<void> {
    this.loadedTime = new Date();
    this.lastSetTime = new Date();

    this.rpc = new Client({
      transport: "ipc",
    });

    this.setState(PluginState.connecting);
    this.statusBar.displayState(
      this.getState(),
      this.settings.autoHideStatusBar
    );

    this.rpc.once("ready", () => {
      this.setState(PluginState.connected);
      this.statusBar.displayState(
        this.getState(),
        this.settings.autoHideStatusBar
      );
      this.logger.log("Connected to Discord", this.settings.showPopups);
    });

    try {
      await this.rpc.login({
        clientId: "1352970439684657152",
      });
      await this.setActivity(this.app.vault.getName(), "...", "");
    } catch (error) {
      this.setState(PluginState.disconnected);
      this.statusBar.displayState(
        this.getState(),
        this.settings.autoHideStatusBar
      );
      this.logger.log("Failed to connect to Discord", this.settings.showPopups);
    }
  }

  async disconnectDiscord(): Promise<void> {
    this.rpc.clearActivity();
    this.rpc.destroy();
    this.setState(PluginState.disconnected);
    this.statusBar.displayState(
      this.getState(),
      this.settings.autoHideStatusBar
    );
    this.logger.log("Disconnected from Discord", this.settings.showPopups);
  }

  async setActivity(
    vaultName: string,
    fileName: string,
    fileExtension: string
  ): Promise<void> {
    if (this.getState() === PluginState.connected) {
      let vault: string;
      if (this.settings.customVaultName === "") {
        vault = vaultName;
      } else {
        vault = this.settings.customVaultName;
      }

      let file: string;
      if (this.settings.showFileExtension) {
        file = fileName + "." + fileExtension;
      } else {
        file = fileName;
      }

      let folderPath = "";
      if (this.settings.showFolderName && this.currentFile) {
        const path = this.currentFile.parent?.path;
        if (path && path !== "/") {
          folderPath = path;
        }
      }

      let date: Date;
      if (this.settings.useLoadedTime) {
        date = this.loadedTime;
      } else {
        date = new Date();
      }
      this.lastSetTime = date;

      const themeImagePath = this.getThemeImagePath(this.settings.themeStyle);
      let useLocalImage = await this.app.vault.adapter.exists(themeImagePath);

      // If theme image doesn't exist, try to download it
      if (!useLocalImage) {
        try {
          const dataPath = this.getDataPath();
          this.logger.log(`Downloading missing theme: ${this.settings.themeStyle}...`, false);
          await this.themeDownloader.downloadTheme(this.settings.themeStyle, dataPath, this.app.vault.adapter);
          useLocalImage = true;
          this.logger.log(`✅ Theme downloaded successfully!`, this.settings.showPopups);
        } catch (error) {
          this.logger.log(`⚠️ Failed to download theme. Download manually in settings.`, this.settings.showPopups);
        }
      }

      const largeImage = useLocalImage ? { largeImagePath: themeImagePath } : {};

      if (this.settings.privacyMode) {
        await this.rpc.setActivity({
          details: `Editing Notes`,
          state: `Working in a Vault`,
          startTimestamp: date,
          largeImageText: "no info just privacy mode",
          ...largeImage,
        });
      } else if (
        this.settings.showVaultName &&
        this.settings.showCurrentFileName &&
        this.settings.showFolderName &&
        folderPath
      ) {
        await this.rpc.setActivity({
          details: `Editing ${file}`,
          state: `Vault: ${vault}  ▸ ${folderPath}`,
          startTimestamp: date,
          largeImageText: "I'm thinking!",
          ...largeImage,
        });
      } else if (
        this.settings.showVaultName &&
        this.settings.showCurrentFileName
      ) {
        await this.rpc.setActivity({
          details: `Editing ${file}`,
          state: `Vault: ${vault}`,
          startTimestamp: date,
          largeImageText: "I'm thinking!",
          ...largeImage,
        });
      } else if (
        this.settings.showFolderName &&
        folderPath &&
        this.settings.showCurrentFileName
      ) {
        await this.rpc.setActivity({
          details: `Editing: ${file}`,
          state: `Folder: ${folderPath}`,
          startTimestamp: date,
          largeImageText: "I'm thinking!",
          ...largeImage,
        });
      } else if (this.settings.showVaultName) {
        await this.rpc.setActivity({
          state: `Vault: ${vault}`,
          startTimestamp: date,
          largeImageText: "Obsidian",
          ...largeImage,
        });
      } else if (this.settings.showCurrentFileName) {
        await this.rpc.setActivity({
          details: `Editing ${file}`,
          startTimestamp: date,
          largeImageText: "I'm thinking!",
          ...largeImage,
        });
      } else {
        await this.rpc.setActivity({
          startTimestamp: date,
          largeImageText: "Obsidian",
          ...largeImage,
        });
      }
    }
  }

  private getThemeImagePath(themeStyle: ThemeStyle): string {
    const dataPath = this.getDataPath();
    return `${dataPath}/theme-${themeStyle}.png`;
  }

  private getPluginPath(): string {
    return this.manifest.dir || (this.app.vault.adapter as any)['basePath'];
  }

  private async autoDownloadThemesIfNeeded(dataPath: string): Promise<void> {
    try {
      // Check if any theme image already exists
      const files = await this.app.vault.adapter.list(dataPath);
      const themesExist = files.files.some((file: string) => 
        file.startsWith('theme-') && file.endsWith('.png')
      );

      if (!themesExist) {
        this.logger.log('Auto-downloading themes...', false);
        await this.themeDownloader.downloadAllThemes(dataPath, this.app.vault.adapter);
        this.logger.log('✅ Themes downloaded successfully!', this.settings.showPopups);
      }
    } catch (error) {
      this.logger.log(`⚠️ Failed to auto-download themes: ${error}`, this.settings.showPopups);
    }
  }
}
