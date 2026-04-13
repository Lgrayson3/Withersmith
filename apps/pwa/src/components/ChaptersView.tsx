import { useState } from 'react';
import { useChapters } from '../hooks/use-chapters';

export function ChaptersView() {
  const { chapters, isLoading, updateChapter, deleteChapter } = useChapters();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; content: string } | null>(null);

  if (isLoading) return <p className="text-secondary">Loading chapters...</p>;

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    setEditing(null);
  };

  const handleEdit = (id: string, content: string) => {
    setEditing({ id, content });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    await updateChapter(editing.id, { content: editing.content });
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    await deleteChapter(id);
    if (expandedId === id) setExpandedId(null);
  };

  const totalTokens = chapters.reduce(
    (sum, ch) => sum + Math.ceil(ch.content.length / 4), 0,
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>
          Chapters ({chapters.length})
        </h2>
        {chapters.length > 0 && (
          <span className="text-tertiary text-xs text-mono">
            ~{totalTokens.toLocaleString()} total tokens
          </span>
        )}
      </div>

      <div className="flex flex-col gap-sm">
        {chapters.map((ch) => (
          <div key={ch.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header - always visible */}
            <div
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem', cursor: 'pointer',
              }}
              onClick={() => handleToggle(ch.id)}
            >
              <div>
                <span className="badge" style={{ marginRight: '0.5rem' }}>
                  #{ch.number}
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                  {ch.title}
                </span>
              </div>
              <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                <span className="text-tertiary text-xs text-mono">
                  ~{Math.ceil(ch.content.length / 4).toLocaleString()} tokens
                </span>
                <span className="text-tertiary" style={{ fontSize: '0.8rem' }}>
                  {expandedId === ch.id ? '\u25B2' : '\u25BC'}
                </span>
              </div>
            </div>

            {/* Expanded content */}
            {expandedId === ch.id && (
              <div style={{ borderTop: '1px solid var(--border-light)' }}>
                {editing?.id === ch.id ? (
                  <div style={{ padding: '0.75rem' }} className="flex flex-col gap-sm">
                    <textarea
                      className="input"
                      value={editing.content}
                      onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                      style={{ minHeight: 200 }}
                    />
                    <div className="flex gap-sm">
                      <button className="prismatic-btn filled" onClick={handleSaveEdit}>
                        Save Changes
                      </button>
                      <button className="prismatic-btn" onClick={() => setEditing(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="output-prose" style={{ maxHeight: '50vh' }}>
                      {ch.content}
                    </div>
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      borderTop: '1px solid var(--border-light)',
                      display: 'flex', gap: '0.5rem',
                    }}>
                      <button
                        className="prismatic-btn small"
                        onClick={(e) => { e.stopPropagation(); handleEdit(ch.id, ch.content); }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-danger"
                        onClick={(e) => { e.stopPropagation(); handleDelete(ch.id); }}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {chapters.length === 0 && (
          <p className="text-tertiary text-center" style={{ padding: '2rem' }}>
            No crystallized chapters yet. Generate a draft, refine it, then hit Crystallize to save it here.
          </p>
        )}
      </div>
    </div>
  );
}
