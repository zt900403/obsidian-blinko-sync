import * as React from 'react';
import { BlinkoNote } from '../api';
import { Trash2 } from 'lucide-react';

interface TimelineProps {
  notes: BlinkoNote[];
  onDelete: (id: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ notes, onDelete }) => {
  if (notes.length === 0) {
    return <div className="blinko-empty">No notes found. Capture your first thought!</div>;
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return 'Unknown time';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="blinko-timeline">
      {notes.map((note, index) => {
        const currentNoteDate = formatDate(note.createdAt);
        const previousNoteDate = index > 0 ? formatDate(notes[index - 1].createdAt) : null;
        const showDateSeparator = currentNoteDate !== previousNoteDate;

        return (
          <React.Fragment key={note.id}>
            {showDateSeparator && (
              <div className="blinko-date-separator">
                <span>{currentNoteDate}</span>
              </div>
            )}
            <div className="blinko-timeline-item">
              <div className="blinko-timeline-left">
                <div className="blinko-timeline-time">{formatTime(note.createdAt)}</div>
                <div className="blinko-timeline-dot"></div>
                <div className="blinko-timeline-line"></div>
              </div>
              <div className="blinko-timeline-right">
                <div className="blinko-note-card">
                  <div className="blinko-note-content">{note.content}</div>
                  <div className="blinko-note-footer">
                    <button 
                      className="blinko-icon-btn blinko-delete-btn" 
                      onClick={() => onDelete(note.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};