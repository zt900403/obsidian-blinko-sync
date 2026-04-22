import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { BlinkoNote } from '../api';
import BlinkoSyncPlugin from '../main';
import { MarkdownViewer } from './MarkdownViewer';
import { ChevronLeft, ChevronRight, MoreHorizontal, Trash2 } from 'lucide-react';

interface Props {
  plugin: BlinkoSyncPlugin;
  notes: BlinkoNote[];
  onDelete: (id: number) => void;
  title: string;
}

export const CarouselContent: React.FC<Props> = ({ plugin, notes, onDelete, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (notes.length === 0) {
    return (
      <div className="blinko-empty-state">
        {title === '每日回顾' ? '今天还没有记录笔记哦。' : '没有找到可以漫步的笔记。'}
      </div>
    );
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

  const handlePrev = () => {
    setMenuOpen(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : notes.length - 1));
  };

  const handleNext = () => {
    setMenuOpen(false);
    setCurrentIndex((prev) => (prev < notes.length - 1 ? prev + 1 : 0));
  };

  const currentNote = notes[currentIndex];

  return (
    <div className="blinko-carousel-wrapper">
      <div className="blinko-carousel-card">
        <div className="blinko-note-header-flomo">
          <div className="blinko-note-time-flomo">{formatDateTime(currentNote.createdAt)}</div>
          <div className="blinko-dropdown-container">
            <button 
              className={`blinko-action-icon ${menuOpen ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="blinko-dropdown-menu show" ref={menuRef}>
                <button className="delete-btn" onClick={() => {
                  if(confirm('确认删除这条笔记吗？')) {
                    onDelete(currentNote.id);
                    if (notes.length === 1) setCurrentIndex(0);
                    else if (currentIndex === notes.length - 1) setCurrentIndex(currentIndex - 1);
                  }
                  setMenuOpen(false);
                }}>
                  <Trash2 size={14} style={{marginRight: '8px'}} /> 删除
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="blinko-note-body-flomo">
          <MarkdownViewer content={currentNote.content} plugin={plugin} />
        </div>
      </div>
      
      <div className="blinko-carousel-controls">
        <button className="blinko-carousel-btn" onClick={handlePrev}>
          <ChevronLeft size={20} />
        </button>
        <div className="blinko-carousel-indicator">
          {currentIndex + 1} / {notes.length}
        </div>
        <button className="blinko-carousel-btn" onClick={handleNext}>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};