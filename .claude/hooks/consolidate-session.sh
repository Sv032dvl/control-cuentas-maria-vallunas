#!/bin/bash
# Consolidate session: creates a timestamped note in Obsidian vault
# Called by Claude Code Stop hook

VAULT_DIR="$HOME/Documents/Obsidian/MariaVallunas/sessions"
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M")
NOTE_FILE="$VAULT_DIR/$TIMESTAMP.md"

# Only create if sessions dir exists
if [ ! -d "$VAULT_DIR" ]; then
  mkdir -p "$VAULT_DIR"
fi

# Create a placeholder session note
# Claude Code will fill this with session summary via MCP
cat > "$NOTE_FILE" << EOF
# Sesión $TIMESTAMP

## Resumen
_Pendiente de consolidación_

## Archivos modificados
_Ver git log_

## Tags
#session
EOF

echo "Session note created: $NOTE_FILE"
