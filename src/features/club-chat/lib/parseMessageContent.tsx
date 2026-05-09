import React from 'react';
import { LruCache } from '@/lib/lru';
import { normalizeHttpUrl } from '@/lib/safeUrl';

const cache = new LruCache<string, string>(500);

export function parseMessageContent(text: string, query: string): React.ReactElement | null {
  if (!text) return null;

  const key = text + '\0' + query;
  let html = cache.get(key);

  if (html === undefined) {
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    if (query.trim()) {
      const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      escaped = escaped.replace(new RegExp(`(${q})`, 'gi'), '<mark class="bg-amber-200 text-navy rounded px-0.5">$1</mark>');
    }

    escaped = escaped.replace(/(?:\r\n|\r|\n)/g, '<br/>');
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    escaped = escaped.replace(/\*(.*?)\*/g, '<i>$1</i>');
    escaped = escaped.replace(/__(.*?)__/g, '<u>$1</u>');
    escaped = escaped.replace(/~~(.*?)~~/g, '<del>$1</del>');
    escaped = escaped.replace(/`(.*?)`/g, '<code class="font-mono text-[13px] bg-black/10 px-1 rounded">$1</code>');
    escaped = escaped.replace(/\|\|(.*?)\|\|/g, '<span class="spoiler blur-sm hover:blur-none transition-all cursor-pointer select-none" title="Click to reveal">$1</span>');
    escaped = escaped.replace(/^&gt;\s(.+)$/gm, '<blockquote class="border-l-2 border-current opacity-70 pl-2 my-0.5 italic">$1</blockquote>');
    escaped = escaped.replace(/((?:https?:\/\/)[^\s<]+)/g, (rawUrl) => {
      const urlValue = rawUrl.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      const safeUrl = normalizeHttpUrl(urlValue);
      if (!safeUrl) return rawUrl;
      const escapedHref = safeUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      return `<a href="${escapedHref}" target="_blank" rel="noopener noreferrer nofollow" class="text-blue-500 hover:underline break-all">${rawUrl}</a>`;
    });

    html = escaped;
    cache.set(key, html);
  }

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
