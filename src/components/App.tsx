import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import BlinkoSyncPlugin from '../main';
import { BlinkoAPI, BlinkoNote } from '../api';
import { BlinkoSync } from '../sync';
import { NoteInput } from './NoteInput';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { CarouselContent } from './CarouselContent';
import { Search, Loader2 } from 'lucide-react';

interface AppProps {
  plugin: BlinkoSyncPlugin;
}

export const App: React.FC<AppProps> = ({ plugin }) => {
  const [notes, setNotes] = useState<BlinkoNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all'); 
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [randomWalkIndices, setRandomWalkIndices] = useState<number[]>([]);

  const loadNotes = useCallback(async (showLoading = true) => {
    const api = new BlinkoAPI(plugin.settings);
    const sync = new BlinkoSync(plugin.app, plugin.settings.syncFolder);

    if (showLoading) setLoading(true);
    setError(null);
    try {
      const fetchedNotes = await api.fetchNotes();
      setNotes(fetchedNotes);
      for (const note of fetchedNotes) {
        await sync.syncNote(note);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [plugin]);

  useEffect(() => {
    loadNotes();
    const interval = setInterval(() => {
      loadNotes(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [loadNotes]);

  useEffect(() => {
    if (filterMode === 'random_walk' && notes.length > 0) {
      const indices = [];
      const numToPick = Math.min(5, notes.length);
      const available = Array.from({ length: notes.length }, (_, i) => i);
      for (let i = 0; i < numToPick; i++) {
        const randIdx = Math.floor(Math.random() * available.length);
        indices.push(available[randIdx]);
        available.splice(randIdx, 1);
      }
      setRandomWalkIndices(indices);
    }
  }, [filterMode, notes.length]);

  const filteredNotes = useMemo(() => {
    let result = [...notes];
    if (filterMode === 'daily_review') {
      const todayStr = new Date().toLocaleDateString('en-CA');
      result = result.filter(n => n.createdAt?.startsWith(todayStr) || n.updatedAt?.startsWith(todayStr));
    } else if (filterMode === 'random_walk') {
      result = randomWalkIndices.map(i => notes[i]).filter(Boolean);
    }
    if (selectedTag) {
      result = result.filter(n => n.content.includes(`#${selectedTag}`));
    }
    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(n => n.content.toLowerCase().includes(lowerQ));
    }
    return result;
  }, [notes, filterMode, selectedTag, searchQuery, randomWalkIndices]);

  const handleCreateNote = async (content: string, type: number = 0) => {
    const api = new BlinkoAPI(plugin.settings);
    try {
      await api.createNote(content, type);
      await loadNotes(false); 
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteNote = async (id: number) => {
    const api = new BlinkoAPI(plugin.settings);
    const sync = new BlinkoSync(plugin.app, plugin.settings.syncFolder);
    try {
      await api.deleteNote(id);
      setNotes(notes.filter(n => n.id !== id));
      await sync.deleteSyncedNote(id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getTitle = () => {
    if (selectedTag) return `#${selectedTag}`;
    if (filterMode === 'daily_review') return '每日回顾';
    if (filterMode === 'random_walk') return '随机漫步';
    return '全部笔记';
  };

  return (
    <div className="blinko-layout-wrapper">
      <Sidebar 
        notes={notes} 
        filterMode={filterMode} 
        setFilterMode={setFilterMode} 
        selectedTag={selectedTag} 
        setSelectedTag={setSelectedTag} 
        username={plugin.settings.username || 'Blinko'}
      />
      <div className="blinko-main-area">
        <div className="blinko-scrollable-content">
          <div className="blinko-topbar">
            <div className="blinko-topbar-inner">
              <div className="blinko-title-dropdown">{getTitle()}</div>
              <div className="blinko-search-wrapper">
                <input 
                  type="text" 
                  className="blinko-search-input" 
                  placeholder="搜索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={14} className="blinko-search-icon" />
              </div>
            </div>
          </div>
          
          {error && <div className="blinko-error-banner">{error}</div>}
          
          {filterMode === 'all' && !selectedTag && !searchQuery && (
            <div className="blinko-input-section">
              <NoteInput plugin={plugin} onSubmit={handleCreateNote} />
            </div>
          )}

          <div className="blinko-view-title">
            {filterMode === 'daily_review' && <h2>每日回顾</h2>}
            {filterMode === 'random_walk' && <h2>随机漫步</h2>}
            {selectedTag && <h2>#{selectedTag}</h2>}
          </div>

          {(filterMode === 'daily_review' || filterMode === 'random_walk') ? (
            <CarouselContent 
              plugin={plugin} 
              notes={filteredNotes} 
              onDelete={handleDeleteNote}
              title={filterMode === 'daily_review' ? '每日回顾' : '随机漫步'}
            />
          ) : (
            <MainContent 
              plugin={plugin} 
              notes={filteredNotes} 
              onDelete={handleDeleteNote} 
            />
          )}
        </div>
      </div>
    </div>
  );
};