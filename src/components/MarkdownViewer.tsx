import * as React from 'react';
import { useEffect, useRef } from 'react';
import { MarkdownRenderer, Component, requestUrl } from 'obsidian';
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

      const objectUrls: string[] = [];

      // Use Obsidian's built-in markdown renderer for native support of tags, images, links
      MarkdownRenderer.render(
        plugin.app,
        modifiedContent,
        containerRef.current,
        '',
        comp
      ).then(() => {
        if (!containerRef.current) return;
        const images = containerRef.current.querySelectorAll('img');
        images.forEach(async (img) => {
          const src = img.getAttribute('src');
          if (src && src.startsWith(baseUrl + '/api/file/')) {
            try {
              const res = await requestUrl({
                url: src,
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${plugin.settings.blinkoToken}`
                }
              });
              const blob = new Blob([res.arrayBuffer], { type: res.headers['content-type'] || 'image/png' });
              const objectUrl = URL.createObjectURL(blob);
              objectUrls.push(objectUrl);
              img.src = objectUrl;
            } catch (e) {
              console.error('Failed to load Blinko image:', e);
            }
          }
        });
      });

      return () => {
        comp.unload();
        objectUrls.forEach(URL.revokeObjectURL);
      };
    }
  }, [content, plugin]);

  return <div ref={containerRef} className="blinko-markdown-preview markdown-rendered" />;
};