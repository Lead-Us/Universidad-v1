import { useState, useRef, useEffect } from 'react';

/**
 * InlineEdit — campo que muestra texto normal hasta que el usuario hace click.
 * Al hacer click, se convierte en un <input> editable.
 * Guarda con Enter o blur; cancela con Escape.
 *
 * Props:
 *   value      — valor actual
 *   onSave     — función (newValue) => void llamada al guardar
 *   tag        — tag HTML para el modo display (default: 'span')
 *   className  — clase para el modo display
 *   inputClass — clase adicional para el input
 *   placeholder — placeholder del input
 *   type       — tipo del input (default: 'text')
 *   min/max/step — para type="number"
 *   style      — estilos inline del display
 */
export default function InlineEdit({
  value,
  onSave,
  tag = 'span',
  className = '',
  inputClass = '',
  placeholder = '',
  type = 'text',
  min,
  max,
  step,
  style,
  children,
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value ?? '');
  const inputRef = useRef(null);

  // Sincronizar draft cuando value cambia externamente
  useEffect(() => {
    if (!editing) setDraft(value ?? '');
  }, [value, editing]);

  const startEdit = (e) => {
    e.stopPropagation();
    setDraft(value ?? '');
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    if (String(draft) !== String(value ?? '')) {
      onSave(type === 'number' ? Number(draft) : draft);
    }
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value ?? '');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') cancel();
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className={`inline-edit-input ${inputClass}`}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        onClick={e => e.stopPropagation()}
        style={{ width: type === 'number' ? '64px' : undefined }}
      />
    );
  }

  const Tag = tag;
  return (
    <Tag
      className={`inline-edit-field ${className}`}
      onClick={startEdit}
      title="Click para editar"
      style={style}
    >
      {children ?? (value || placeholder || '—')}
    </Tag>
  );
}
