import { useState, useRef } from 'react';
import type { LoreCategory } from '@withersmith/engine';
import { useLoreDocuments } from '../hooks/use-lore';
import { parseFile } from '../store/file-parser';

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

  if (isLoading) return <p className="text-secondary">Loading lore...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>Codex ({documents.length})</h2>
        <button
          className="prismatic-btn small"
          onClick={() => (isAdding ? handleCancel() : setIsAdding(true))}
        >
          {isAdding ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {isAdding && (
        <div className="surface flex flex-col gap-sm mb-sm">
          {/* File upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing}
          >
            {parsing ? 'Parsing file...' : 'Upload .docx, .pdf, or .txt'}
          </button>

          {parseError && <p className="text-error">{parseError}</p>}

          <div className="divider">or paste content below</div>

          <input
            placeholder="Document title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as LoreCategory)}
            className="input"
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
            className="input"
            style={{ minHeight: 160 }}
          />
          {content && (
            <p className="text-tertiary text-xs text-mono text-right">
              ~{Math.ceil(content.length / 4).toLocaleString()} tokens
            </p>
          )}
          <button
            className="prismatic-btn filled"
            onClick={handleAdd}
            disabled={!title.trim() || !content.trim()}
          >
            Save Document
          </button>
        </div>
      )}

      <div className="flex flex-col gap-sm">
        {documents.map((doc) => (
          <div key={doc.id} className="card" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div>
                <span className="badge" style={{ marginRight: '0.5rem' }}>
                  {doc.category.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '0.9rem' }}>{doc.title}</span>
              </div>
              <span className="text-tertiary text-xs text-mono">
                ~{Math.ceil(doc.content.length / 4).toLocaleString()} tokens
              </span>
            </div>
            <button
              className="btn-danger"
              onClick={() => deleteDocument(doc.id)}
              style={{ marginLeft: '0.5rem', flexShrink: 0 }}
            >
              Delete
            </button>
          </div>
        ))}
        {documents.length === 0 && (
          <p className="text-tertiary text-center" style={{ padding: '2rem' }}>
            No lore documents yet. Upload your world-building files or paste content here.
          </p>
        )}
      </div>
    </div>
  );
}
