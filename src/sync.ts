import { App, normalizePath, TFolder, TFile } from 'obsidian';
import { BlinkoNote } from './api';
import { BlinkoSyncSettings } from './settings';

export class BlinkoSync {
  constructor(private app: App, private settings: BlinkoSyncSettings) {}

  private async ensureFolderExists(folderPath: string) {
    const normalizedPath = normalizePath(folderPath);
    const parts = normalizedPath.split('/');
    let currentPath = '';
    
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const folder = this.app.vault.getAbstractFileByPath(currentPath);
      if (!folder) {
        await this.app.vault.createFolder(currentPath);
      } else if (!(folder instanceof TFolder)) {
        throw new Error(`Path ${currentPath} exists but is not a folder.`);
      }
    }
  }

  private extractTitle(content: string): string {
    const firstLine = content.split('\n')[0].replace(/^#+\s*/, '').trim();
    const sanitized = firstLine.replace(/[\\/:*?"<>|]/g, '').substring(0, 50);
    return sanitized || 'Untitled';
  }

  private async findExistingFile(id: number): Promise<TFile | null> {
    const folderPath = normalizePath(this.settings.syncFolder);
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (folder && folder instanceof TFolder) {
      const files: TFile[] = [];
      const stack: TFolder[] = [folder];
      
      while (stack.length > 0) {
        const current = stack.pop()!;
        for (const child of current.children) {
          if (child instanceof TFile && child.extension === 'md') {
            if (child.name === `${id}.md` || child.name.startsWith(`${id}-`)) {
              return child;
            }
          } else if (child instanceof TFolder) {
            stack.push(child);
          }
        }
      }
    }
    return null;
  }

  async syncNote(note: BlinkoNote) {
    const syncFolder = this.settings.syncFolder;
    if (!syncFolder || !syncFolder.trim()) return;
    
    try {
      let targetFolder = syncFolder;
      if (this.settings.groupByDate && note.createdAt) {
        const dateStr = note.createdAt.split('T')[0];
        targetFolder = `${syncFolder}/${dateStr}`;
      }
      
      await this.ensureFolderExists(targetFolder);
      
      const title = this.extractTitle(note.content);
      const newFileName = `${note.id}-${title}.md`;
      const newFilePath = normalizePath(`${targetFolder}/${newFileName}`);
      
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

  async forceSync(allNotes: BlinkoNote[]) {
    const syncFolder = this.settings.syncFolder;
    if (!syncFolder || !syncFolder.trim()) return;
    try {
      await this.ensureFolderExists(syncFolder);
      const folderPath = normalizePath(syncFolder);
      const folder = this.app.vault.getAbstractFileByPath(folderPath);
      
      if (folder && folder instanceof TFolder) {
        const validIds = new Set(allNotes.map(n => n.id));
        const stack: TFolder[] = [folder];
        
        while (stack.length > 0) {
          const current = stack.pop()!;
          for (const child of current.children) {
            if (child instanceof TFile && child.extension === 'md') {
              const match = child.name.match(/^(\d+)(?:-|\.md$)/);
              if (match) {
                const fileId = parseInt(match[1], 10);
                if (!validIds.has(fileId)) {
                  await this.app.vault.delete(child);
                }
              }
            } else if (child instanceof TFolder) {
              stack.push(child);
            }
          }
        }
      }
      
      for (const note of allNotes) {
        await this.syncNote(note);
      }
    } catch(e) {
      console.error("Force sync error:", e);
    }
  }

  async deleteSyncedNote(id: number) {
    if (!this.settings.syncFolder || !this.settings.syncFolder.trim()) return;
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
