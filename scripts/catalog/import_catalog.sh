#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
bundled_python="${HOME}/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3"

if [[ -n "${SECTIONSYNC_PYTHON:-}" ]]; then
  python_bin="${SECTIONSYNC_PYTHON}"
elif [[ -x "${bundled_python}" ]]; then
  python_bin="${bundled_python}"
else
  python_bin="python3"
fi

exec "${python_bin}" "${script_dir}/import_pdf.py" "$@"
