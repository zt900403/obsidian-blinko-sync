import { App, PluginSettingTab, Setting } from 'obsidian';
import BlinkoSyncPlugin from './main';

export interface BlinkoSyncSettings {
  blinkoUrl: string;
  blinkoToken: string;
  syncFolder: string;
  username: string;
}

export const DEFAULT_SETTINGS: BlinkoSyncSettings = {
  blinkoUrl: 'http://localhost:3000',
  blinkoToken: '',
  syncFolder: 'Blinko Notes',
  username: 'Blinko'
}

export class BlinkoSettingTab extends PluginSettingTab {
  plugin: BlinkoSyncPlugin;

  constructor(app: App, plugin: BlinkoSyncPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const {containerEl} = this;
    containerEl.empty();
    containerEl.createEl('h2', {text: 'Settings for Blinko Sync'});

    new Setting(containerEl)
      .setName('Username')
      .setDesc('The username to display in the sidebar.')
      .addText(text => text
        .setPlaceholder('Blinko')
        .setValue(this.plugin.settings.username)
        .onChange(async (value) => {
          this.plugin.settings.username = value || 'Blinko';
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Blinko API URL')
      .setDesc('The base URL of your self-hosted Blinko instance (without trailing slash).')
      .addText(text => text
        .setPlaceholder('http://localhost:3000')
        .setValue(this.plugin.settings.blinkoUrl)
        .onChange(async (value) => {
          this.plugin.settings.blinkoUrl = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Blinko API Token')
      .setDesc('Your Bearer token for authentication.')
      .addText(text => text
        .setPlaceholder('Enter token')
        .setValue(this.plugin.settings.blinkoToken)
        .onChange(async (value) => {
          this.plugin.settings.blinkoToken = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Local Sync Folder')
      .setDesc('The folder in your Obsidian vault where notes will be synced.')
      .addText(text => text
        .setPlaceholder('Blinko Notes')
        .setValue(this.plugin.settings.syncFolder)
        .onChange(async (value) => {
          this.plugin.settings.syncFolder = value;
          await this.plugin.saveSettings();
        }));
  }
}