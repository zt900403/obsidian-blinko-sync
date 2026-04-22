import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import BlinkoSyncPlugin from './main';
import { App as ReactApp } from './components/App';

export const BLINKO_VIEW_TYPE = 'blinko-view';

export class BlinkoView extends ItemView {
  root: ReactDOM.Root | null = null;

  constructor(leaf: WorkspaceLeaf, private plugin: BlinkoSyncPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return BLINKO_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Blinko Sync';
  }

  getIcon(): string {
    return 'edit-3';
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    const reactContainer = container.createEl('div', { cls: 'blinko-react-root' });
    this.root = ReactDOM.createRoot(reactContainer);
    this.root.render(
      React.createElement(ReactApp, { plugin: this.plugin })
    );
  }

  async onClose() {
    if (this.root) {
      this.root.unmount();
    }
  }
}