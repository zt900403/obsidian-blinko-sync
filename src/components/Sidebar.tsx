import * as React from 'react';
import { useState, useMemo } from 'react';
import { MessageSquare, Calendar, Shuffle, Search, ArrowDownAZ } from 'lucide-react';
import { BlinkoNote } from '../api';

interface SidebarProps {
  notes: BlinkoNote[];
  filterMode: string;
  setFilterMode: (mode: string) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  username: string;
}

interface TagNode {
  name: string;
  fullPath: string;
  count: number;
  children: { [key: string]: TagNode };
}

export const Sidebar: React.FC<SidebarProps> = ({ notes, filterMode, setFilterMode, selectedTag, setSelectedTag, username }) => {
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  
  const totalNotes = notes.length;
  const activeDays = new Set<string>();
  const tagTree: { [key: string]: TagNode } = {};
  let totalTagsCount = 0;

  notes.forEach(note => {
    if (note.createdAt) {
      const date = new Date(note.createdAt).toLocaleDateString('en-CA');
      activeDays.add(date);
    }
    const tags = note.content.match(/#[\w\u4e00-\u9fa5/]+/g);
    if (tags) {
      const uniqueTagsInNote = new Set(tags.map(t => t.substring(1)));
      uniqueTagsInNote.forEach(tagPath => {
        const parts = tagPath.split('/');
        let currentLevel = tagTree;
        let currentPath = '';

        parts.forEach((part, index) => {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          if (!currentLevel[part]) {
            currentLevel[part] = {
              name: part,
              fullPath: currentPath,
              count: 0,
              children: {}
            };
            if (index === parts.length - 1) totalTagsCount++;
          }
          if (index === parts.length - 1) {
            currentLevel[part].count++;
          }
          currentLevel = currentLevel[part].children;
        });
      });
    }
  });

  const totalDays = activeDays.size;

  const today = new Date();
  const heatmapDates = [];
  for (let i = 84; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    heatmapDates.push(d.toLocaleDateString('en-CA'));
  }

  // Filter tags based on search query
  const filterTagTree = (nodes: { [key: string]: TagNode }, query: string): { [key: string]: TagNode } => {
    if (!query) return nodes;
    const lowerQuery = query.toLowerCase();
    const result: { [key: string]: TagNode } = {};
    
    for (const key in nodes) {
      const node = nodes[key];
      // If node matches, include it and its children
      if (node.name.toLowerCase().includes(lowerQuery)) {
        result[key] = node;
      } else {
        // If node doesn't match, check if any children match
        const filteredChildren = filterTagTree(node.children, query);
        if (Object.keys(filteredChildren).length > 0) {
          result[key] = { ...node, children: filteredChildren };
        }
      }
    }
    return result;
  };

  const filteredTagTree = useMemo(() => filterTagTree(tagTree, tagSearchQuery), [tagTree, tagSearchQuery]);

  const renderTagTree = (nodes: { [key: string]: TagNode }, depth: number = 0) => {
    return Object.values(nodes).map(node => (
      <div key={node.fullPath} className="blinko-tag-tree-node">
        <button 
          className={`blinko-tag-item ${selectedTag === node.fullPath ? 'active' : ''}`}
          onClick={() => { setFilterMode('all'); setSelectedTag(node.fullPath); }}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          <div className="blinko-tag-item-left">
            <span className="hash">#</span> 
            <span className="blinko-tag-name">{node.name}</span>
          </div>
          {node.count > 0 && <span className="blinko-tag-count">{node.count}</span>}
        </button>
        {Object.keys(node.children).length > 0 && (
          <div className="blinko-tag-children">
            {renderTagTree(node.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="blinko-sidebar">
      <div className="blinko-username">{username || 'Blinko'} <span>PRO</span></div>

      <div className="blinko-stats">
        <div className="blinko-stat-item">
          <div className="blinko-stat-value">{totalNotes}</div>
          <div className="blinko-stat-label">笔记</div>
        </div>
        <div className="blinko-stat-item">
          <div className="blinko-stat-value">{totalTagsCount}</div>
          <div className="blinko-stat-label">标签</div>
        </div>
        <div className="blinko-stat-item">
          <div className="blinko-stat-value">{totalDays}</div>
          <div className="blinko-stat-label">天</div>
        </div>
      </div>

      <div className="blinko-heatmap-container">
        <div className="blinko-heatmap">
          {heatmapDates.map(date => {
            const count = notes.filter(n => n.createdAt?.startsWith(date)).length;
            return (
              <div 
                key={date} 
                className={`blinko-heatmap-cell ${count > 0 ? (count > 2 ? 'level-2' : 'level-1') : 'level-0'}`}
                title={`${count} 条笔记于 ${date}`}
              />
            );
          })}
        </div>
        <div className="blinko-heatmap-labels">
          <span>三个月前</span>
          <span>近期</span>
        </div>
      </div>

      <div className="blinko-nav-menu">
        <button 
          className={`blinko-nav-item ${filterMode === 'all' && !selectedTag ? 'active' : ''}`}
          onClick={() => { setFilterMode('all'); setSelectedTag(null); }}
        >
          <MessageSquare size={16} /> 全部笔记
        </button>
        <button 
          className={`blinko-nav-item ${filterMode === 'daily_review' ? 'active' : ''}`}
          onClick={() => { setFilterMode('daily_review'); setSelectedTag(null); }}
        >
          <Calendar size={16} /> 每日回顾
        </button>
        <button 
          className={`blinko-nav-item ${filterMode === 'random_walk' ? 'active' : ''}`}
          onClick={() => { setFilterMode('random_walk'); setSelectedTag(null); }}
        >
          <Shuffle size={16} /> 随机漫步
        </button>
      </div>

      <div className="blinko-tags-section">
        <div className="blinko-tags-header">
          <span>全部标签</span>
          <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
            <span style={{fontSize: '0.85em', cursor: 'pointer'}}>排序</span>
            <Search size={14} style={{cursor: 'pointer'}} onClick={() => {
              const input = document.getElementById('blinko-tag-search');
              if (input) {
                input.style.display = input.style.display === 'none' ? 'block' : 'none';
                input.focus();
              }
            }}/>
          </div>
        </div>
        <input 
          id="blinko-tag-search"
          type="text" 
          placeholder="搜索标签..." 
          style={{display: 'none', marginBottom: '8px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', width: '100%', fontSize: '0.9em'}}
          value={tagSearchQuery}
          onChange={(e) => setTagSearchQuery(e.target.value)}
        />
        <div className="blinko-tags-list">
          {renderTagTree(filteredTagTree)}
        </div>
      </div>
    </div>
  );
};