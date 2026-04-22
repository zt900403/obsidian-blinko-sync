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

  private obfuscate(text: string): string {
    if (!text || text.startsWith('ENC:')) return text;
    try {
      const buffer = Buffer.from(text, 'utf-8');
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= 0x5B; // Simple XOR
      }
      return 'ENC:' + buffer.toString('base64');
    } catch (e) {
      return text;
    }
  }

  private deobfuscate(text: string): string {
    if (!text || !text.startsWith('ENC:')) return text;
    try {
      const b64 = text.replace('ENC:', '');
      const buffer = Buffer.from(b64, 'base64');
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= 0x5B;
      }
      return buffer.toString('utf-8');
    } catch (e) {
      return text;
    }
  }

  async loadSettings() {
    const data = await this.loadData();
    if (data && data.blinkoToken) {
      data.blinkoToken = this.deobfuscate(data.blinkoToken);
    }
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
  }

  async saveSettings() {
    const dataToSave = { ...this.settings };
    if (dataToSave.blinkoToken) {
      dataToSave.blinkoToken = this.obfuscate(dataToSave.blinkoToken);
    }
    await this.saveData(dataToSave);
  }
}