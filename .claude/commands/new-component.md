Create a new React component for this project.

## Usage
Provide: component name (PascalCase), domain folder (`shared` | `ramos` | `dashboard` | `calendario` | `aprender` | `layout`), and a one-line description.

## Steps

### 1. Create `src/components/$DOMAIN/$NAME.jsx`
```jsx
import styles from './$NAME.module.css';

export default function $NAME({ /* props */ }) {
  return (
    <div className={styles.container}>
      {/* content */}
    </div>
  );
}
```

### 2. Create `src/components/$DOMAIN/$NAME.module.css`
```css
.container {
  background: var(--lg-surface);
  border: 1px solid var(--lg-border);
  border-radius: 12px;
  box-shadow: var(--lg-shadow);
  backdrop-filter: var(--blur-base);
  padding: 16px;
  color: var(--text-primary);
  transition: box-shadow var(--dur-fast) ease, transform var(--dur-fast) ease;
}

.container:hover {
  box-shadow: var(--lg-shadow-hover);
}
```

## Rules
- Use ONLY CSS custom properties — never hardcode colors, shadows, or blur values
- Icons: `import { RiXxxLine } from 'react-icons/ri'` — Remix Icons only
- Co-locate `.module.css` in the same folder as the `.jsx` file
- Data fetching belongs in hooks, not components — receive data as props
- For modals: `import Modal from '../shared/Modal.jsx'`
- For buttons: `import Button from '../shared/Button.jsx'` (variant: `primary` | `ghost` | `danger`, size: `sm` | `base` | `lg`)
