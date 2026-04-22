import { requestUrl } from 'obsidian';
import { BlinkoSyncSettings } from './settings';

export interface BlinkoNote {
  id: number;
  content: string;
  createdAt?: string;
  updatedAt?: string;
  type?: number;
  isArchived?: boolean;
}

export class BlinkoAPI {
  constructor(private settings: BlinkoSyncSettings) {}

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.settings.blinkoToken.trim()}`,
      'Content-Type': 'application/json'
    };
  }

  private getBaseUrl() {
    return this.settings.blinkoUrl.replace(/\/+$/, '');
  }

  async fetchNotes(): Promise<BlinkoNote[]> {
    if (!this.settings.blinkoUrl || !this.settings.blinkoToken) {
      throw new Error("Please configure Blinko API URL and Token in settings.");
    }
    
    try {
      const response = await requestUrl({
        url: `${this.getBaseUrl()}/api/v1/note/list`,
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          page: 1,
          size: 50,
          orderBy: "desc"
        })
      });
      
      if (response.status >= 400) {
        throw new Error(`Failed to fetch notes: ${response.status}`);
      }

      const data = response.json;
      if (Array.isArray(data)) {
        return data as BlinkoNote[];
      } else if (data && Array.isArray(data.items)) {
        return data.items as BlinkoNote[];
      }
      return [];
    } catch (e: any) {
      throw new Error(`Fetch Error: ${e.message}`);
    }
  }

  async fetchAllNotes(): Promise<BlinkoNote[]> {
    if (!this.settings.blinkoUrl || !this.settings.blinkoToken) {
      throw new Error("Please configure Blinko API URL and Token in settings.");
    }
    
    let allNotes: BlinkoNote[] = [];
    let page = 1;
    const size = 500;
    
    try {
      while (true) {
        const response = await requestUrl({
          url: `${this.getBaseUrl()}/api/v1/note/list`,
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ page, size, orderBy: "desc" })
        });
        
        if (response.status >= 400) {
          throw new Error(`Failed to fetch notes: ${response.status}`);
        }

        const data = response.json;
        let items: BlinkoNote[] = [];
        
        if (Array.isArray(data)) {
          items = data as BlinkoNote[];
        } else if (data && Array.isArray(data.items)) {
          items = data.items as BlinkoNote[];
        }
        
        allNotes = [...allNotes, ...items];
        
        if (items.length < size) {
          break; // Last page
        }
        page++;
      }
      return allNotes;
    } catch (e: any) {
      throw new Error(`Fetch Error: ${e.message}`);
    }
  }

  async createNote(content: string, type: number = 0, id?: number): Promise<void> {
    try {
      const body: any = { content, type };
      if (id !== undefined) body.id = id;
      
      const response = await requestUrl({
        url: `${this.getBaseUrl()}/api/v1/note/upsert`,
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });
      
      if (response.status >= 400) {
        throw new Error(`Failed to create note: ${response.status}`);
      }
    } catch (e: any) {
      throw new Error(`Create Error: ${e.message}`);
    }
  }

  async deleteNote(id: number): Promise<void> {
    try {
      const response = await requestUrl({
        url: `${this.getBaseUrl()}/api/v1/note/batch-delete`,
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ids: [id]
        })
      });
      
      if (response.status >= 400 && response.status !== 404) {
        throw new Error(`Failed to delete note: ${response.status}`);
      }
    } catch (e: any) {
      throw new Error(`Delete Error: ${e.message}`);
    }
  }
}