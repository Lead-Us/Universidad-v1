import { useState } from 'react';
import { marked } from 'marked';
import Button from '../shared/Button.jsx';
import styles from './PromptEditor.module.css';

marked.setOptions({ breaks: true });

export default function PromptEditor({ initialContent, onSave, onCancel, loading }) {
  const [content,  setContent]  = useState(initialContent ?? '');
  const [preview,  setPreview]  = useState(false);

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={[styles.modeBtn, !preview ? styles.modeActive : ''].join(' ')}
          onClick={() => setPreview(false)}
        >
          Editar
        </button>
        <button
          type="button"
          className={[styles.modeBtn, preview ? styles.modeActive : ''].join(' ')}
          onClick={() => setPreview(true)}
        >
          Preview
        </button>
      </div>

      {preview ? (
        <div
          className={styles.preview}
          dangerouslySetInnerHTML={{ __html: marked.parse(content) }}
        />
      ) : (
        <textarea
          className={styles.textarea}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="# Prompt para NotebookLM&#10;&#10;Escribe el contenido del prompt en Markdown…"
          spellCheck={false}
        />
      )}

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button
          type="button"
          onClick={() => onSave(content)}
          disabled={loading}
        >
          {loading ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}
