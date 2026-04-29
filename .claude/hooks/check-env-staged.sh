#!/bin/bash
# PreToolUse Hook: Bloquea git commit si hay archivos .env staged
# Claude Code llama este script con el input del tool en stdin (JSON)

PROJECT_DIR="/Users/ernestoah/Documents/Antigravity/universidadv1"

INPUT=$(cat)
CMD=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('command', ''))
except:
    print('')
" 2>/dev/null || echo "")

# Solo actuar en comandos git commit
if echo "$CMD" | grep -q "git commit"; then
    STAGED_ENV=$(git -C "$PROJECT_DIR" diff --cached --name-only 2>/dev/null | grep -E '\.env')
    if [ -n "$STAGED_ENV" ]; then
        echo "❌ BLOQUEADO: Archivos .env detectados en staging area:" >&2
        echo "$STAGED_ENV" >&2
        echo "" >&2
        echo "Elimínalos antes de commitear:" >&2
        echo "  git restore --staged <archivo>" >&2
        exit 2  # exit 2 = bloquea la acción en Claude Code
    fi
fi
