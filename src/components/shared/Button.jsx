import styles from './Button.module.css';

/**
 * variant: 'primary' | 'ghost' | 'danger'
 * size:    'sm' | 'base' | 'lg'
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'base',
  onClick,
  type = 'button',
  disabled = false,
  style,
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={[styles.btn, styles[variant], styles[size], className].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
