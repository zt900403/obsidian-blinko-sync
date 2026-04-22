import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Send, Hash, Image as ImageIcon, Heading, List, ListOrdered, Zap, CheckSquare } from 'lucide-react';
import BlinkoSyncPlugin from '../main';

interface NoteInputProps {
  plugin: BlinkoSyncPlugin;
  onSubmit: (content: string, type: number) => Promise<void>;
}

export const NoteInput: React.FC<NoteInputProps> = ({ plugin, onSubmit }) => {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [noteType, setNoteType] = useState<number>(0); 
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    await onSubmit(content, noteType);
    setContent('');
    setSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent(content + text);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + text + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, 150)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [content]);

  return (
    <div className="blinko-input-box-flomo" onMouseDown={e => e.stopPropagation()}>
      <div className="blinko-input-main-wrapper">
        <textarea
          ref={textareaRef}
          className="blinko-textarea-flomo"
          placeholder="记录点什么吧... (Cmd/Ctrl + Enter 发送)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={submitting}
        />
      </div>

      <div className="blinko-input-toolbar">
        <div className="blinko-toolbar-icons">
          <button className="blinko-toolbar-btn" onClick={() => insertText('#')} title="标签"><Hash size={16}/></button>
          <button className="blinko-toolbar-btn" title="图片"><ImageIcon size={16}/></button>
          <button className="blinko-toolbar-btn" onClick={() => insertText('\n## ')} title="标题"><Heading size={16}/></button>
          <button className="blinko-toolbar-btn" onClick={() => insertText('\n- ')} title="列表"><List size={16}/></button>
          <button className="blinko-toolbar-btn" onClick={() => insertText('\n1. ')} title="有序列表"><ListOrdered size={16}/></button>
          <button className="blinko-toolbar-btn" onClick={() => insertText('\n- [ ] ')} title="待办"><CheckSquare size={16}/></button>
        </div>
        
        <div className="blinko-toolbar-right">
          <button 
            className="blinko-type-selector-btn"
            onClick={() => setNoteType(noteType === 0 ? 1 : 0)}
          >
            <Zap size={14} fill={noteType === 0 ? "#eab308" : "none"} color={noteType === 0 ? "#eab308" : "#999"} />
            <span>{noteType === 0 ? '闪念' : '文章'}</span>
          </button>

          <button 
            className="blinko-send-btn-flomo" 
            onClick={handleSubmit} 
            disabled={submitting || !content.trim()}
          >
            <Send size={16} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
};