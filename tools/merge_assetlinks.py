"""Fusionne les associations Android du domaine sans perdre les anciens certificats."""
import json
import re
import sys
from pathlib import Path

if len(sys.argv) != 3:
    raise SystemExit("Usage: python3 tools/merge_assetlinks.py NOUVEAU.json .well-known/assetlinks.json")
new_path, output = Path(sys.argv[1]), Path(sys.argv[2])
new = json.loads(new_path.read_text(encoding="utf-8"))
old = json.loads(output.read_text(encoding="utf-8")) if output.is_file() else []
if not isinstance(new, list) or not isinstance(old, list):
    raise SystemExit("assetlinks.json doit contenir une liste JSON.")

def is_fyblic(item):
    target = item.get("target") or {}
    return target.get("namespace") == "android_app" and target.get("package_name") == "com.fyblic.nativeapp"

fingerprints = set()
for entry in old + new:
    if not isinstance(entry, dict) or not is_fyblic(entry):
        continue
    for key in (entry.get("target") or {}).get("sha256_cert_fingerprints", []):
        if isinstance(key, str) and re.fullmatch(r"(?:[A-Fa-f0-9]{2}:){31}[A-Fa-f0-9]{2}", key):
            fingerprints.add(key.upper())
if not fingerprints:
    raise SystemExit("Aucune empreinte SHA-256 d'application Fyblic valide dans le fichier fourni.")
rest = [entry for entry in old if not (isinstance(entry, dict) and is_fyblic(entry))]
rest.append({"relation": ["delegate_permission/common.handle_all_urls"], "target": {
    "namespace": "android_app", "package_name": "com.fyblic.nativeapp",
    "sha256_cert_fingerprints": sorted(fingerprints)
}})
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(rest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print("Associations FYBLIC conservées :", len(fingerprints))
