import * as React from 'react';
import { useEffect, useRef } from 'react';
import { MarkdownRenderer, Component } from 'obsidian';
import BlinkoSyncPlugin from '../main';

interface Props {
  content: string;
  plugin: BlinkoSyncPlugin;
}

export const MarkdownViewer: React.FC<Props> = ({ content, plugin }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.empty();
      const comp = new Component();
      
      const baseUrl = plugin.settings.blinkoUrl.replace(/\/+$/, '');
      const modifiedContent = content
        .replace(/\]\(\/api\/file\//g, `](${baseUrl}/api/file/`)
        .replace(/src="\/api\/file\//g, `src="${baseUrl}/api/file/`);

      // Use Obsidian's built-in markdown renderer for native support of tags, images, links
      MarkdownRenderer.render(
        plugin.app,
        modifiedContent,
        containerRef.current,
        '',
        comp
      );
      return () => {
        comp.unload();
      };
    }
  }, [content, plugin]);

  return <div ref={containerRef} className="blinko-markdown-preview markdown-rendered" />;
};