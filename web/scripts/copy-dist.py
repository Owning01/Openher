import shutil, os

src = r'G:\Proyectos\opencode-remote-android\web\dist'
dst = r'G:\Proyectos\opencode-remote-android\web\android\app\src\main\assets\public'
fails = []
for root, dirs, files in os.walk(src):
    rel = os.path.relpath(root, src)
    tgt_dir = dst if rel == '.' else os.path.join(dst, rel)
    os.makedirs(tgt_dir, exist_ok=True)
    for f in files:
        try:
            shutil.copy2(os.path.join(root, f), os.path.join(tgt_dir, f))
        except Exception as e:
            fails.append((f, str(e)))
print('failures:', fails if fails else 'none')
