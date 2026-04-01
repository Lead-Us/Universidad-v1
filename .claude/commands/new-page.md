Scaffold a new page, its CSS module, and register the route.

## Usage
Provide: page name in PascalCase (e.g. `Estadisticas`), URL path (e.g. `/estadisticas`), and whether it needs a new service/hook.

## Steps

### 1. Create `src/pages/$NAME.jsx`
```jsx
import styles from './$NAME.module.css';
// import { useXxx } from '../hooks/useXxx.js';

export default function $NAME() {
  // const { data, loading, error } = useXxx();

  return (
    <div className="page">
      <div className="page-content">
        <div className="section-header">
          <h1 className="section-title">$TITLE</h1>
        </div>

        {/* content */}
      </div>
    </div>
  );
}
```

### 2. Create `src/pages/$NAME.module.css`
```css
/* Page-specific overrides only — global layout comes from index.css */
.container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
```

### 3. Add route in `src/App.jsx`
At the top: `import $NAME from './pages/$NAME.jsx';`

Inside `<Route element={<Layout />}>`:
```jsx
<Route path="/$PATH" element={<$NAME />} />
```

### 4. If a nav link is needed
Check `src/components/layout/Layout.jsx` or `Navbar.jsx` for the nav item list and add the link there.

### 5. If new data is needed
Run `/new-service` first to scaffold the service and hook, then import the hook in the page.

## Rules
- Page wrapper MUST be `<div className="page"><div className="page-content">...</div></div>`
- Section header pattern: `<div className="section-header"><h1 className="section-title">...</h1></div>`
- Route goes inside the existing `<Route element={<Layout />}>` block — never create a new BrowserRouter
- Import order in App.jsx: group page imports together alphabetically
