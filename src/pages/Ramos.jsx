import { useState } from 'react';
import { RiAddLine } from 'react-icons/ri';
import { useRamos } from '../hooks/useRamos.js';
import RamoCard from '../components/ramos/RamoCard.jsx';
import RamoForm from '../components/ramos/RamoForm.jsx';
import Modal    from '../components/shared/Modal.jsx';
import Button   from '../components/shared/Button.jsx';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';

export default function Ramos() {
  const { ramos, loading, error, add, update } = useRamos();
  const [modal,  setModal]  = useState(false);
  const [edited, setEdited] = useState(null); // ramo being edited
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

  return (
    <div className="page">
      <div className="page-content">

        <div className="section-header">
          <h1 className="section-title">Ramos</h1>
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

        {!loading && (
          <div className="cards-grid stagger">
            {ramos.map(r => (
              <RamoCard key={r.id} ramo={r} onEdit={openEdit} />
            ))}
          </div>
        )}

      </div>

      <Modal
        open={modal}
        onClose={close}
        title={edited ? 'Editar ramo' : 'Nuevo ramo'}
      >
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
