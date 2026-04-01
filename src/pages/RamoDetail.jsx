import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RiArrowLeftLine, RiPencilLine } from 'react-icons/ri';
import { useRamo }  from '../hooks/useRamos.js';
import { useRamos } from '../hooks/useRamos.js';
import UnitTimeline        from '../components/ramos/UnitTimeline.jsx';
import FilesBrowser        from '../components/ramos/FilesBrowser.jsx';
import EvaluationSchedule  from '../components/ramos/EvaluationSchedule.jsx';
import AttendanceTracker   from '../components/ramos/AttendanceTracker.jsx';
import RamoForm            from '../components/ramos/RamoForm.jsx';
import Modal               from '../components/shared/Modal.jsx';
import Button              from '../components/shared/Button.jsx';
import InlineEdit          from '../components/shared/InlineEdit.jsx';
import LoadingSpinner      from '../components/shared/LoadingSpinner.jsx';
import styles from './RamoDetail.module.css';

const TABS = ['Temario', 'Calificaciones', 'Asistencias', 'Archivos'];

export default function RamoDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { ramo, loading, reload } = useRamo(id);
  const { update }                = useRamos();
  const [tab,    setTab]    = useState('Temario');
  const [modal,  setModal]  = useState(false);
  const [saving, setSaving] = useState(false);

  // Must be before any conditional returns (Rules of Hooks)
  const allFiles = useMemo(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`uni_files_${id}`) ?? '{}');
      return (saved.todos ?? []).map(f => f.name);
    } catch {
      return ramo?.allFiles ?? [];
    }
  }, [id, ramo]);

  if (loading) {
    return <div className="page" />;
  }

  if (!ramo) {
    return (
      <div className="page">
        <div className="page-content">
          <p style={{ color: 'var(--color-danger)' }}>Ramo no encontrado.</p>
          <Button variant="ghost" onClick={() => navigate('/ramos')}>
            <RiArrowLeftLine /> Volver
          </Button>
        </div>
      </div>
    );
  }

  const handleSave = async (data) => {
    setSaving(true);
    try   { await update(id, data); setModal(false); }
    finally { setSaving(false); }
  };

  // Inline save para campos del header
  const saveField = async (field, value) => {
    await update(id, { [field]: value });
    await reload();
  };

  return (
    <div className="page">
      <div className="page-content">

        {/* Back */}
        <button className={styles.back} onClick={() => navigate('/ramos')}>
          <RiArrowLeftLine /> Ramos
        </button>

        {/* Header con edición inline */}
        <div className={styles.header} style={{ borderLeftColor: ramo.color }}>
          <div className={styles.headerContent}>
            <InlineEdit
              value={ramo.code}
              onSave={v => saveField('code', v)}
              className={styles.code}
              style={{ color: ramo.color }}
            />
            <InlineEdit
              value={ramo.name}
              onSave={v => saveField('name', v)}
              tag="h1"
              className={styles.name}
            />
            <div className={styles.meta}>
              <InlineEdit
                value={ramo.professor}
                onSave={v => saveField('professor', v)}
              />
              <span>·</span>
              <InlineEdit
                value={ramo.section}
                onSave={v => saveField('section', v)}
              />
              {ramo.classroom !== undefined && (
                <>
                  <span>·</span>
                  <InlineEdit
                    value={ramo.classroom ?? ''}
                    onSave={v => saveField('classroom', v)}
                    placeholder="Sala"
                  />
                </>
              )}
              <span>·</span>
              <span>
                <InlineEdit
                  value={String(ramo.credits)}
                  onSave={v => saveField('credits', Number(v))}
                  type="number"
                  min={1}
                  max={12}
                /> créditos
              </span>
              {ramo.has_attendance && (
                <span style={{ color: 'var(--color-warning)' }}>· ● Asistencia</span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setModal(true)} title="Editar horario y datos">
            <RiPencilLine /> Editar
          </Button>
        </div>

        {/* Tabs — pill style */}
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t}
              className={[styles.tab, tab === t ? styles.tabActive : ''].join(' ')}
              style={tab === t ? { '--tab-accent': ramo.color } : undefined}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={styles.tabContent}>
          {tab === 'Temario'        && (
            <UnitTimeline
              ramoId={id}
              ramoColor={ramo.color}
              allFiles={allFiles}
            />
          )}
          {tab === 'Calificaciones' && (
            <EvaluationSchedule ramoId={id} ramoColor={ramo.color} />
          )}
          {tab === 'Asistencias'    && (
            <AttendanceTracker ramoId={id} ramoColor={ramo.color} />
          )}
          {tab === 'Archivos'       && <FilesBrowser unitId={id} />}
        </div>

      </div>

      {/* Modal para horarios / datos completos */}
      <Modal open={modal} onClose={() => setModal(false)} title="Editar horario y datos">
        <RamoForm
          initial={ramo}
          onSave={handleSave}
          onCancel={() => setModal(false)}
          loading={saving}
        />
      </Modal>
    </div>
  );
}
