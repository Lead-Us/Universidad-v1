import { useState } from 'react';
import { RiAddLine } from 'react-icons/ri';
import { useRamos } from '../hooks/useRamos.js';
import RamoCard from '../components/ramos/RamoCard.jsx';
import RamoForm from '../components/ramos/RamoForm.jsx';
import Modal    from '../components/shared/Modal.jsx';
import Button   from '../components/shared/Button.jsx';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';
import styles from './Ramos.module.css';

export default function Ramos() {
  const { ramos, loading, error, add, update, remove } = useRamos();
  const [modal,  setModal]  = useState(false);
  const [edited, setEdited] = useState(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEdited(null); setModal(true); };
  const openEdit   = (ramo) => { setEdited(ramo); setModal(true); };
  const close      = () => { setModal(false); setEdited(null); };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (edited) await update(edited.id, data);
      else        await add(data);
      close();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await remove(id);
    // Also clear localStorage files for this ramo
    try { localStorage.removeItem(`uni_files_${id}`); } catch {}
  };

  return (
    <div className="page">
      <div className="page-content">

        <h1 className={styles.sectionHeading}>Mis Ramos</h1>
        {ramos.length > 0 && (
          <p className={styles.sectionSub}>{ramos.length} {ramos.length === 1 ? 'ramo' : 'ramos'} este semestre</p>
        )}

        <div className="section-header" style={{ marginBottom: 'var(--space-5)' }}>
          <span />
          <Button onClick={openCreate}>
            <RiAddLine /> Agregar ramo
          </Button>
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{error}</p>}

        {!loading && ramos.length > 0 && (
          <div className={styles.scrollSection}>
            <div className={styles.scrollRow}>
              {ramos.map(r => (
                <RamoCard key={r.id} ramo={r} onEdit={openEdit} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        {!loading && ramos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            <p style={{ marginBottom: 'var(--space-4)' }}>Aún no tienes ramos agregados.</p>
            <Button onClick={openCreate}><RiAddLine /> Agregar primer ramo</Button>
          </div>
        )}

      </div>

      <Modal open={modal} onClose={close} title={edited ? 'Editar ramo' : 'Nuevo ramo'}>
        <RamoForm
          initial={edited}
          onSave={handleSave}
          onCancel={close}
          loading={saving}
        />
      </Modal>
    </div>
  );
}
