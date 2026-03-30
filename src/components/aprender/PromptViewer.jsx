import { useState, useEffect } from 'react';
import { marked } from 'marked';
import { RiFileCopyLine, RiCheckLine } from 'react-icons/ri';
import styles from './PromptViewer.module.css';

marked.setOptions({ breaks: true });

export default function PromptViewer({ content }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content ?? '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const html = content
    ? marked.parse(content)
    : '<p style="color:var(--text-muted)">Sin contenido</p>';

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <button className={styles.copyBtn} onClick={handleCopy}>
          {copied ? <RiCheckLine /> : <RiFileCopyLine />}
          {copied ? 'Copiado' : 'Copiar prompt'}
        </button>
      </div>
      <div
        className={styles.body}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
