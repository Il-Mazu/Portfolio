import { useState, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

const postFiles = import.meta.glob('/src/blog/*.md', { eager: true, query: '?raw', import: 'default' });

function parseFrontmatter(raw) {
  const fm = { title: '', date: '', tags: [] };
  if (!raw) return fm;
  for (const line of raw.trim().split('\n')) {
    const ci = line.indexOf(':');
    if (ci === -1) continue;
    const key = line.slice(0, ci).trim();
    let val = line.slice(ci + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    }
    fm[key] = val;
  }
  return fm;
}

export const posts = Object.entries(postFiles)
  .map(([path, raw]) => {
    const slug = path.split('/').pop().replace('.md', '');
    const parts = raw.split('---');
    const fm = parseFrontmatter(parts[1]);
    const content = parts.slice(2).join('---').trim();
    return { slug, ...fm, content };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

const retroTheme = {
  'code[class*="language-"]': {
    color: '#33ff55',
    background: 'none',
    fontFamily: '"Share Tech Mono", monospace',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  'pre[class*="language-"]': {
    color: '#33ff55',
    background: '#0a0a0a',
    fontFamily: '"Share Tech Mono", monospace',
    fontSize: '14px',
    lineHeight: '1.5',
    padding: '14px',
    border: '1px solid #1a1a1a',
    borderRadius: '0',
    overflow: 'auto',
  },
  comment: { color: '#555' },
  punctuation: { color: '#777' },
  keyword: { color: '#ffaa00' },
  string: { color: '#33ff55' },
  number: { color: '#ffaa00' },
  function: { color: '#eee' },
  'class-name': { color: '#eee' },
  operator: { color: '#777' },
  tag: { color: '#ffaa00' },
  attr: { color: '#33ff55' },
  selector: { color: '#eee' },
};

function BlogList({ posts, onRead, tagFilter, allTags, onTagFilter, onNotif }) {
  return (
    <>
      <span className="c-dim">── latest entries ──────────────</span><br /><br />
      {tagFilter && (
        <div className="blog-filter-bar">
          <span className="c-dim">filter: </span>
          <span className="blog-filter-tag" onClick={() => onTagFilter(null)}>
            #{tagFilter} <span className="c-dim">×</span>
          </span>
        </div>
      )}
      {posts.length === 0 && (
        <div className="c-dim">// no posts match this tag</div>
      )}
      {posts.map((post, i) => (
        <div key={post.slug} className="blog-entry" onClick={() => onRead(post.slug)}>
          <div className="entry-date">{post.date}</div>
          <div className="entry-title"><span className="entry-arrow">»</span> {post.title}</div>
          <div className="entry-tags">
            {post.tags.map(t => (
              <span
                key={t}
                className="blog-tag"
                onClick={e => { e.stopPropagation(); onTagFilter(t); }}
              >{`[#${t}]`}</span>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function CodeBlock({ className, children }) {
  const match = /language-(\w+)/.exec(className || '');
  if (!match) {
    return <code className="inline-code">{children}</code>;
  }
  return (
    <SyntaxHighlighter style={retroTheme} language={match[1]} PreTag="div">
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  );
}

function BlogImage({ src, alt }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <>
      <img src={src} alt={alt} className="blog-image" onClick={() => setOpen(true)} />
      {open && (
        <div className="lightbox-overlay" onClick={() => setOpen(false)}>
          <img src={src} alt={alt} className="lightbox-image" />
        </div>
      )}
    </>
  );
}

function BlogReader({ post, onBack }) {
  return (
    <div className="blog-reader">
      <div className="blog-back" onClick={onBack}>« cd ..</div>
      <div className="blog-post-header">
        <div className="blog-post-date c-dim">{post.date}</div>
        <h1 className="blog-post-title">{post.title}</h1>
        <div className="entry-tags blog-post-tags">
          {post.tags.map(t => <span key={t} className="c-dim">{`[#${t}]`}</span>)}
        </div>
      </div>
      <hr className="hr" />
      <div className="blog-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            code: CodeBlock,
            img: BlogImage,
            blockquote({ children }) {
              const first = Array.isArray(children) ? children[0] : children;
              const text = first?.props?.children?.[0] || '';
              const match = typeof text === 'string' && text.match(/^\[!(\w+)\]\s*/);
              if (match) {
                return (
                  <div className={`callout callout-${match[1].toLowerCase()}`}>
                    {children}
                  </div>
                );
              }
              return <blockquote>{children}</blockquote>;
            },
          }}
        >
          {post.content || '*// silence*'}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default function BlogWindow({ onNotif }) {
  const [view, setView] = useState('list');
  const [currentSlug, setCurrentSlug] = useState(null);
  const [tagFilter, setTagFilter] = useState(null);

  const currentPost = useMemo(
    () => posts.find(p => p.slug === currentSlug),
    [currentSlug]
  );

  const filteredPosts = useMemo(
    () => tagFilter ? posts.filter(p => p.tags.includes(tagFilter)) : posts,
    [tagFilter]
  );

  const allTags = useMemo(
    () => [...new Set(posts.flatMap(p => p.tags))],
    []
  );

  const handleRead = (slug) => {
    setCurrentSlug(slug);
    setView('read');
  };

  const handleBack = () => {
    setView('list');
    setCurrentSlug(null);
  };

  if (view === 'read' && currentPost) {
    return <BlogReader post={currentPost} onBack={handleBack} />;
  }

  return (
    <BlogList
      posts={filteredPosts}
      onRead={handleRead}
      tagFilter={tagFilter}
      allTags={allTags}
      onTagFilter={setTagFilter}
      onNotif={onNotif}
    />
  );
}
