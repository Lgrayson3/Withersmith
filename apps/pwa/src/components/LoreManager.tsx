import { useState, useRef } from 'react';
import type { LoreCategory } from '@withersmith/engine';
import { useLoreDocuments } from '../hooks/use-lore';
import { parseFile, detectFileType } from '../store/file-parser';

const CATEGORIES: LoreCategory[] = [
  'cosmology',
  'character_profiles',
  'geography',
  'magic_system',
  'factions',
  'timeline',
  'languages',
  'custom',
];

const ACCEPTED_TYPES = '.docx,.pdf,.txt,.md';

export function LoreManager() {
  const { documents, isLoading, addDocument, deleteDocument } = useLoreDocuments();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<LoreCategory>('cosmology');
  const [content, setContent] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError('');
    setParsing(true);

    try {
      const result = await parseFile(file);
      setContent(result.text);
      if (!title) setTitle(result.title);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setParsing(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAdd = async () => {
    if (!title.trim() || !content.trim()) return;
    await addDocument({
      title: title.trim(),
      category,
      content: content.trim(),
      priority: documents.length,
    });
    setTitle('');
    setContent('');
    setParseError('');
    setIsAdding(false);
  };

  const handleCancel = () => {
    setTitle('');
    setContent('');
    setParseError('');
    setIsAdding(false);
  };

  if (isLoading) return <p style={{ color: '#8a8a9a' }}>Loading lore...</p>;

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.heading}>Codex ({documents.length})</h2>
        <button
          style={styles.addBtn}
          onClick={() => (isAdding ? handleCancel() : setIsAdding(true))}
        >
          {isAdding ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {isAdding && (
        <div style={styles.form}>
          {/* File upload area */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            style={styles.uploadBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing}
          >
            {parsing ? 'Parsing file...' : 'Upload .docx, .pdf, or .txt'}
          </button>

          {parseError && <p style={styles.error}>{parseError}</p>}

          <div style={styles.divider}>
            <span style={styles.dividerText}>or paste content below</span>
          </div>

          <input
            placeholder="Document title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as LoreCategory)}
            style={styles.input}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace('_', ' ')}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Lore content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ ...styles.input, minHeight: '160px', resize: 'vertical' }}
          />
          {content && (
            <p style={styles.charCount}>
              ~{Math.ceil(content.length / 4).toLocaleString()} tokens
            </p>
          )}
          <button
            style={styles.saveBtn}
            onClick={handleAdd}
            disabled={!title.trim() || !content.trim()}
          >
            Save Document
          </button>
        </div>
      )}

      <div style={styles.list}>
        {documents.map((doc) => (
          <div key={doc.id} style={styles.item}>
            <div style={styles.itemInfo}>
              <div>
                <span style={styles.category}>{doc.category.replace('_', ' ')}</span>
                <span style={styles.itemTitle}>{doc.title}</span>
              </div>
              <span style={styles.itemTokens}>
                ~{Math.ceil(doc.content.length / 4).toLocaleString()} tokens
              </span>
            </div>
            <button
              style={styles.deleteBtn}
              onClick={() => deleteDocument(doc.id)}
            >
              Delete
            </button>
          </div>
        ))}
        {documents.length === 0 && (
          <p style={styles.empty}>
            No lore documents yet. Upload your world-building files or paste content here.
          </p>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  heading: {
    margin: 0,
    color: '#e6e6e6',
    fontSize: '1.1rem',
  },
  addBtn: {
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    border: '1px solid #4a6fa5',
    background: 'transparent',
    color: '#4a6fa5',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem',
    padding: '1rem',
    background: '#0f0f23',
    borderRadius: '8px',
  },
  uploadBtn: {
    padding: '1rem',
    borderRadius: '8px',
    border: '2px dashed #3a3a5a',
    background: 'transparent',
    color: '#6a8ab5',
    cursor: 'pointer',
    fontSize: '0.9rem',
    textAlign: 'center',
    transition: 'border-color 0.2s',
  },
  error: {
    color: '#ff6b6b',
    fontSize: '0.8rem',
    margin: 0,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    margin: '0.25rem 0',
  },
  dividerText: {
    color: '#5a5a6a',
    fontSize: '0.75rem',
    whiteSpace: 'nowrap',
  },
  input: {
    padding: '0.6rem',
    borderRadius: '6px',
    border: '1px solid #2a2a4a',
    background: '#16213e',
    color: '#e6e6e6',
    fontSize: '0.85rem',
    fontFamily: 'inherit',
  },
  charCount: {
    color: '#5a7a9a',
    fontSize: '0.75rem',
    margin: 0,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  saveBtn: {
    padding: '0.6rem',
    borderRadius: '6px',
    border: 'none',
    background: '#4a6fa5',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    background: '#16213e',
    borderRadius: '8px',
  },
  itemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
    minWidth: 0,
  },
  category: {
    display: 'inline-block',
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    background: '#2a2a4a',
    color: '#8a8a9a',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    marginRight: '0.5rem',
  },
  itemTitle: {
    color: '#e6e6e6',
    fontSize: '0.9rem',
  },
  itemTokens: {
    color: '#5a7a9a',
    fontSize: '0.7rem',
    fontFamily: 'monospace',
  },
  deleteBtn: {
    padding: '0.3rem 0.6rem',
    borderRadius: '4px',
    border: 'none',
    background: '#3a1a1a',
    color: '#ff6b6b',
    cursor: 'pointer',
    fontSize: '0.75rem',
    flexShrink: 0,
    marginLeft: '0.5rem',
  },
  empty: {
    color: '#5a5a6a',
    textAlign: 'center',
    padding: '2rem',
    fontSize: '0.85rem',
  },
};
