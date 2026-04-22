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

  private extractTitle(content: string): string {
    const firstLine = content.split('\n')[0].replace(/^#+\s*/, '').trim();
    const sanitized = firstLine.replace(/[\\/:*?"<>|]/g, '').substring(0, 50);
    return sanitized || 'Untitled';
  }

  private async findExistingFile(id: number): Promise<TFile | null> {
    const folderPath = normalizePath(this.syncFolder);
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (folder && folder instanceof TFolder) {
      for (const file of folder.children) {
        if (file instanceof TFile && file.extension === 'md') {
          if (file.name === `${id}.md` || file.name.startsWith(`${id}-`)) {
            return file;
          }
        }
      }
    }
    return null;
  }

  async syncNote(note: BlinkoNote) {
    if (!this.syncFolder || !this.syncFolder.trim()) return;
    
    try {
      await this.ensureFolderExists(this.syncFolder);
      
      const title = this.extractTitle(note.content);
      const newFileName = `${note.id}-${title}.md`;
      const newFilePath = normalizePath(`${this.syncFolder}/${newFileName}`);
      
      const contentStr = `---\nid: ${note.id}\ncreated: ${note.createdAt || new Date().toISOString()}\n---\n\n${note.content}`;

      const existingFile = await this.findExistingFile(note.id);

      if (existingFile) {
        await this.app.vault.modify(existingFile, contentStr);
        if (existingFile.path !== newFilePath) {
          await this.app.fileManager.renameFile(existingFile, newFilePath);
        }
      } else {
        await this.app.vault.create(newFilePath, contentStr);
      }
    } catch(e) {
      console.error("Local sync error:", e);
    }
  }

  async deleteSyncedNote(id: number) {
    if (!this.syncFolder || !this.syncFolder.trim()) return;
    try {
      const existingFile = await this.findExistingFile(id);
      if (existingFile) {
        await this.app.vault.delete(existingFile);
      }
    } catch(e) {
      console.error("Local delete error:", e);
    }
  }
}
