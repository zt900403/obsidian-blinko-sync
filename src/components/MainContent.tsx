import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { BlinkoNote } from '../api';
import BlinkoSyncPlugin from '../main';
import { MarkdownViewer } from './MarkdownViewer';
import { MoreHorizontal, X, Check, Edit2, Trash2 } from 'lucide-react';
import { BlinkoAPI } from '../api';
import { BlinkoSync } from '../sync';

interface Props {
  plugin: BlinkoSyncPlugin;
  notes: BlinkoNote[];
  onDelete: (id: number) => void;
}

export const MainContent: React.FC<Props> = ({ plugin, notes, onDelete }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (notes.length === 0) {
    return <div className="blinko-empty-state">没有找到相关的笔记，快去记录点什么吧！</div>;
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  const startEdit = (note: BlinkoNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
    setActiveMenuId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async (note: BlinkoNote) => {
    if (editContent.trim() === note.content || !editContent.trim() || saving) {
      cancelEdit();
      return;
    }
    setSaving(true);
    try {
      const api = new BlinkoAPI(plugin.settings);
      const sync = new BlinkoSync(plugin.app, plugin.settings.syncFolder);
      await api.createNote(editContent, note.type || 0, note.id);
      note.content = editContent;
      await sync.syncNote(note);
    } catch (e) {
      console.error("Failed to update", e);
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  };

  const handleTextareaRef = (el: HTMLTextAreaElement | null) => {
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  return (
    <div className="blinko-note-list">
      {notes.map(note => (
        <div key={note.id} className="blinko-note-card-flomo" onDoubleClick={() => { if(editingId !== note.id) startEdit(note); }}>
          <div className="blinko-note-header-flomo">
            <div className="blinko-note-time-flomo">{formatDateTime(note.createdAt)}</div>
            <div className="blinko-dropdown-container">
              <button 
                className={`blinko-action-icon ${activeMenuId === note.id ? 'active' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === note.id ? null : note.id);
                }}
              >
                <MoreHorizontal size={16} />
              </button>
              {activeMenuId === note.id && (
                <div className="blinko-dropdown-menu show" ref={menuRef}>
                  <button onClick={() => startEdit(note)}>
                    <Edit2 size={14} style={{marginRight: '8px'}} /> 编辑
                  </button>
                  <button className="delete-btn" onClick={() => {
                    if(confirm('确认删除这条笔记吗？')) {
                      onDelete(note.id);
                    }
                    setActiveMenuId(null);
                  }}>
                    <Trash2 size={14} style={{marginRight: '8px'}} /> 删除
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="blinko-note-body-flomo">
            {editingId === note.id ? (
              <div className="blinko-inline-editor">
                <textarea 
                  ref={handleTextareaRef}
                  className="blinko-inline-textarea"
                  value={editContent}
                  onChange={e => {
                    setEditContent(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  autoFocus
                  disabled={saving}
                />
                <div className="blinko-inline-actions">
                  <button onClick={cancelEdit} disabled={saving}><X size={14}/> 取消</button>
                  <button onClick={() => saveEdit(note)} disabled={saving} className="primary"><Check size={14}/> 保存</button>
                </div>
              </div>
            ) : (
              <MarkdownViewer content={note.content} plugin={plugin} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};