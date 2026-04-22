import { Plugin, WorkspaceLeaf } from 'obsidian';
import { BlinkoSettingTab, BlinkoSyncSettings, DEFAULT_SETTINGS } from './settings';
import { BlinkoView, BLINKO_VIEW_TYPE } from './view';

export default class BlinkoSyncPlugin extends Plugin {
  settings: BlinkoSyncSettings;

  async onload() {
    await this.loadSettings();

    this.registerView(
      BLINKO_VIEW_TYPE,
      (leaf) => new BlinkoView(leaf, this)
    );

    this.addRibbonIcon('edit-3', 'Open Blinko Sync', () => {
      this.activateView();
    });

    this.addCommand({
      id: 'open-blinko-sync',
      name: 'Open Blinko Sync View',
      callback: () => {
        this.activateView();
      }
    });

    this.addCommand({
      id: 'search-blinko-sync',
      name: 'Search Blinko Sync',
      callback: async () => {
        await this.activateView();
        setTimeout(() => {
          const searchInput = document.querySelector('.blinko-search-input') as HTMLInputElement | null;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }, 100);
      }
    });

    this.addSettingTab(new BlinkoSettingTab(this.app, this));
  }

  onunload() {}

  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(BLINKO_VIEW_TYPE);

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      // Create a new leaf in the main workspace area
      leaf = workspace.getLeaf(false);
      await leaf.setViewState({ type: BLINKO_VIEW_TYPE, active: true });
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}