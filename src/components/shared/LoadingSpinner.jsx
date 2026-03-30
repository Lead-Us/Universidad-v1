export default function LoadingSpinner({ size = 'base', style }) {
  const cls = size === 'sm' ? 'spinner spinner-sm' : size === 'lg' ? 'spinner spinner-lg' : 'spinner';
  return <div className={cls} style={style} aria-label="Cargando…" />;
}
