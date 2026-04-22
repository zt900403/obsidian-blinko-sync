import { App, normalizePath, TFolder, TFile } from 'obsidian';
import { BlinkoNote } from './api';

export class BlinkoSync {
  constructor(private app: App, private syncFolder: string) {}

  private async ensureFolderExists(folderPath: string) {
    const normalizedPath = normalizePath(folderPath);
    const folder = this.app.vault.getAbstractFileByPath(normalizedPath);
    if (!folder) {
      await this.app.vault.createFolder(normalizedPath);
    } else if (!(folder instanceof TFolder)) {
      throw new Error(`Path ${normalizedPath} exists but is not a folder.`);
    }
  }

  async syncNote(note: BlinkoNote) {
    if (!this.syncFolder || !this.syncFolder.trim()) return;
    
    try {
      await this.ensureFolderExists(this.syncFolder);
      
      const fileName = `${note.id}.md`;
      const filePath = normalizePath(`${this.syncFolder}/${fileName}`);
      const file = this.app.vault.getAbstractFileByPath(filePath);
      
      const content = `---\nid: ${note.id}\ncreated: ${note.createdAt || new Date().toISOString()}\n---\n\n${note.content}`;

      if (file && file instanceof TFile) {
        await this.app.vault.modify(file, content);
      } else {
        await this.app.vault.create(filePath, content);
      }
    } catch(e) {
      console.error("Local sync error:", e);
    }
  }

  async deleteSyncedNote(id: number) {
    if (!this.syncFolder || !this.syncFolder.trim()) return;
    
    const fileName = `${id}.md`;
    const filePath = normalizePath(`${this.syncFolder}/${fileName}`);
    const file = this.app.vault.getAbstractFileByPath(filePath);
    
    if (file && file instanceof TFile) {
      await this.app.vault.delete(file);
    }
  }
}