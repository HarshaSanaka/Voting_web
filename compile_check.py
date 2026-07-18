import py_compile
import os

errors = []
for root, dirs, files in os.walk('.'):
    for f in files:
        if f.endswith('.py'):
            path = os.path.join(root, f)
            try:
                py_compile.compile(path, doraise=True)
                print('OK', path)
            except Exception as e:
                print('ERR', path, e)
                errors.append((path, str(e)))

if errors:
    print('\nSUMMARY: Found', len(errors), 'error(s)')
    for p, e in errors:
        print(p, e)
    raise SystemExit(1)
else:
    print('\nSUMMARY: All python files compiled successfully')
