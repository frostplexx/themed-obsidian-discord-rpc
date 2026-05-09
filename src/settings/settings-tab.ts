import { PluginSettingTab, Setting, App, Notice } from "obsidian";
import { Logger } from "src/logger";
import ObsidianDiscordRPC from "src/main";
import { PluginState } from './settings';
import { ThemeStyle, THEME_OPTIONS } from './themes';
import { ThemeDownloader } from './theme-downloader';

export class DiscordRPCSettingsTab extends PluginSettingTab {
  public logger: Logger;
  private plugin: ObsidianDiscordRPC;
  private themeDownloader: ThemeDownloader;

  constructor(app: App, plugin: ObsidianDiscordRPC) {
    super(app, plugin);
    this.plugin = plugin;
    this.logger = new Logger(plugin);
    this.themeDownloader = new ThemeDownloader();
  }

  display(): void {
    const { containerEl } = this;
    const plugin = this.plugin;  // Use the properly typed property instead of casting

    containerEl.empty();

    new Setting(containerEl).setName('Vault name').setHeading();
    new Setting(containerEl)
      .setName("Privacy mode")
      .setDesc("Enable this to hide the name of the vault and Hide file names")
      .addToggle((boolean) =>
        boolean.setValue(plugin.settings.privacyMode).onChange((value) => {
          plugin.settings.privacyMode = value;
          plugin.saveData(plugin.settings);

          plugin.setActivity("", "", "");
        })
      );
    new Setting(containerEl)
      .setName("Show vault name")
      .setDesc(
        "Enable this to show the name of the vault you are working with."
      )
      .addToggle((boolean) =>
        boolean.setValue(plugin.settings.showVaultName).onChange((value) => {
          plugin.settings.showVaultName = value;
          plugin.saveData(plugin.settings);

          plugin.setActivity(
            this.app.vault.getName(),
            plugin.currentFile.basename,
            plugin.currentFile.extension
          );
        })
      );

    new Setting(containerEl)
      .setName("Set custom vault name")
      .setDesc(
        "Change the vault name shown publicly. Leave blank to use your actual vault name."
      )
      .addText((text) =>
        text.setValue(plugin.settings.customVaultName).onChange((value) => {
          plugin.settings.customVaultName = value;
          plugin.saveData(plugin.settings);

          plugin.setActivity(
            this.app.vault.getName(),
            plugin.currentFile.basename,
            plugin.currentFile.extension
          );
        })
      );

    new Setting(containerEl).setName('File & Folder Name').setHeading();
    new Setting(containerEl)
      .setName("Show current file name")
      .setDesc("Enable this to show the name of the file you are working on.")
      .addToggle((boolean) =>
        boolean
          .setValue(plugin.settings.showCurrentFileName)
          .onChange((value) => {
            plugin.settings.showCurrentFileName = value;
            plugin.saveData(plugin.settings);

            plugin.setActivity(
              this.app.vault.getName(),
              plugin.currentFile.basename,
              plugin.currentFile.extension
            );
          })
      );
    new Setting(containerEl)
      .setName("Show folder name")
      .setDesc("Enable this to show the folder path where the file is located.")
      .addToggle((boolean) =>
        boolean
          .setValue(plugin.settings.showFolderName)
          .onChange((value) => {
            plugin.settings.showFolderName = value;
            plugin.saveData(plugin.settings);

            plugin.setActivity(
              this.app.vault.getName(),
              plugin.currentFile.basename,
              plugin.currentFile.extension
            );
          })
      );
    new Setting(containerEl)
      .setName("Show file extension")
      .setDesc("Enable this to show file extension.")
      .addToggle((boolean) =>
        boolean
          .setValue(plugin.settings.showFileExtension)
          .onChange((value) => {
            plugin.settings.showFileExtension = value;
            plugin.saveData(plugin.settings);

            plugin.setActivity(
              this.app.vault.getName(),
              plugin.currentFile.basename,
              plugin.currentFile.extension
            );
          })
      );

    new Setting(containerEl).setName('Time tracking').setHeading();
    new Setting(containerEl)
      .setName("Use obsidian total time")
      .setDesc(
        "Enable to use the total time you have been using Obsidian, instead of the time spent editing a single file."
      )
      .addToggle((boolean) => {
        boolean.setValue(plugin.settings.useLoadedTime).onChange((value) => {
          plugin.settings.useLoadedTime = value;
          plugin.saveData(plugin.settings);

          plugin.setActivity(
            this.app.vault.getName(),
            plugin.currentFile.basename,
            plugin.currentFile.extension
          );
        });
      });

    new Setting(containerEl).setName('Status bar').setHeading();
    new Setting(containerEl)
      .setName("Automatically hide status bar")
      .setDesc(
        "Automatically hide status bar after successfully connecting to Discord."
      )
      .addToggle((boolean) => {
        boolean
          .setValue(plugin.settings.autoHideStatusBar)
          .onChange((value) => {
            plugin.settings.autoHideStatusBar = value;
            plugin.saveData(plugin.settings);

            plugin.setActivity(
              this.app.vault.getName(),
              plugin.currentFile.basename,
              plugin.currentFile.extension
            );
          });
      });

      new Setting(containerEl)
      .setName("Show connected time")
      .setDesc(
        "Show time spent editing file or time connected to Discord in the status bar."
      )
      .addToggle((boolean) => {
        boolean.setValue(plugin.settings.showConnectionTimer).onChange((value) => {
          plugin.settings.showConnectionTimer = value;
          plugin.saveData(plugin.settings);

          plugin.setActivity(
            this.app.vault.getName(),
            plugin.currentFile.basename,
            plugin.currentFile.extension
          );
          // needed to make timer disappear, otherwise it will freeze
          plugin.statusBar.displayState(plugin.getState(), plugin.settings.autoHideStatusBar);
        });
      });

    new Setting(containerEl).setName('Startup behavior').setHeading();
    new Setting(containerEl)
      .setName("Automatically connect to Discord")
      .setDesc(
        "Automatically connect to Discord on startup. You can always click the status bar to manually connect."
      )
      .addToggle((boolean) => {
        boolean.setValue(plugin.settings.connectOnStart).onChange((value) => {
          plugin.settings.connectOnStart = value;
          plugin.saveData(plugin.settings);

          plugin.setActivity(
            this.app.vault.getName(),
            plugin.currentFile.basename,
            plugin.currentFile.extension
          );
        });
      });

    new Setting(containerEl).setName('Notices').setHeading();
    new Setting(containerEl)
      .setName("Show notices")
      .setDesc("Enable this to show connection Notices.")
      .addToggle((boolean) =>
        boolean.setValue(plugin.settings.showPopups).onChange((value) => {
          plugin.settings.showPopups = value;
          plugin.saveData(plugin.settings);

          plugin.setActivity(
            this.app.vault.getName(),
            plugin.currentFile.basename,
            plugin.currentFile.extension
          );
        })
      );
      new Setting(containerEl).setName('Theme style').setHeading();
      new Setting(containerEl)
          .setName('Theme style')
          .setDesc('Choose the theme style for Discord Rich Presence')
          .addDropdown(dropdown => {
              Object.entries(THEME_OPTIONS).forEach(([value, label]: [string, string]) => {
                  dropdown.addOption(value, label);
              });
              return dropdown
                  .setValue(plugin.settings.themeStyle)
                  .onChange(async (value) => {
                      plugin.settings.themeStyle = value as ThemeStyle;
                      await plugin.saveData(plugin.settings);
                      if (plugin.getState() === PluginState.connected) {
                          await plugin.setActivity(
                              plugin.app.vault.getName(),
                              plugin.currentFile?.basename ?? "...",
                              plugin.currentFile?.extension ?? ""
                          );
                      }
                  });
          });

      new Setting(containerEl).setName('Download Themes').setHeading();
      new Setting(containerEl)
          .setName('Download all themes')
          .setDesc('Download all theme images from GitHub and cache them locally')
          .addButton(button => button
              .setButtonText('Download All')
              .onClick(async () => {
                  button.setDisabled(true);
                  button.setButtonText('Downloading...');
                  try {
                      await this.themeDownloader.downloadAllThemes(this.plugin.getDataPath(), this.plugin.app.vault.adapter);
                      new Notice('✅ All themes downloaded successfully!');
                  } catch (error) {
                      new Notice(`❌ Download failed: ${error}`);
                  } finally {
                      button.setDisabled(false);
                      button.setButtonText('Download All');
                  }
              }));

      new Setting(containerEl)
          .setName('Update themes')
          .setDesc('Check for new themes and download any missing ones')
          .addButton(button => button
              .setButtonText('Update Themes')
              .onClick(async () => {
                  button.setDisabled(true);
                  button.setButtonText('Checking...');
                  try {
                      const result = await this.themeDownloader.updateThemes(this.plugin.getDataPath(), this.plugin.app.vault.adapter);
                      if (result.updated.length > 0) {
                          new Notice(`✅ Downloaded ${result.updated.length} new theme(s):\n${result.updated.join(', ')}`);
                      } else {
                          new Notice('✅ All themes are up to date!');
                      }
                  } catch (error) {
                      new Notice(`❌ Update failed: ${error}`);
                  } finally {
                      button.setDisabled(false);
                      button.setButtonText('Update Themes');
                  }
              }));

      let selectedThemeForDownload = plugin.settings.themeStyle;
      new Setting(containerEl)
          .setName('Download specific theme')
          .setDesc('Select a theme and download just that one')
          .addDropdown(dropdown => {
              Object.entries(THEME_OPTIONS).forEach(([value, label]: [string, string]) => {
                  dropdown.addOption(value, label);
              });
              dropdown.setValue(plugin.settings.themeStyle);
              dropdown.onChange((value) => {
                  selectedThemeForDownload = value as ThemeStyle;
              });
              return dropdown;
          })
          .addButton(button => button
              .setButtonText('Download Selected')
              .onClick(async () => {
                  button.setDisabled(true);
                  button.setButtonText('Downloading...');
                  try {
                      await this.themeDownloader.downloadTheme(selectedThemeForDownload, this.plugin.getDataPath(), this.plugin.app.vault.adapter);
                      new Notice(`✅ ${THEME_OPTIONS[selectedThemeForDownload]} downloaded successfully!`);
                  } catch (error) {
                      new Notice(`❌ Download failed: ${error}`);
                  } finally {
                      button.setDisabled(false);
                      button.setButtonText('Download Selected');
                  }
              }));
  }
}
