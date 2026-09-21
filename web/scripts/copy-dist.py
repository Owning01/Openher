import shutil, os, sys

# Rutas relativas al repo: funciona en cualquier clone (antes estaba hardcodeado G:\...).
here = os.path.dirname(os.path.abspath(__file__))
repo = os.path.dirname(os.path.dirname(here))
src = os.path.join(repo, 'web', 'dist')
dst = os.path.join(repo, 'web', 'android', 'app', 'src', 'main', 'assets', 'public')

fails = []
copied = 0
for dirpath, dirs, files in os.walk(src):
    rel = os.path.relpath(dirpath, src)
    tgt_dir = dst if rel == '.' else os.path.join(dst, rel)
    os.makedirs(tgt_dir, exist_ok=True)
    for f in files:
        try:
            shutil.copy2(os.path.join(dirpath, f), os.path.join(tgt_dir, f))
            copied += 1
        except Exception as e:
            fails.append((f, str(e)))

print('copied:', copied, 'failures:', fails if fails else 'none')
if fails:
    sys.exit(1)
