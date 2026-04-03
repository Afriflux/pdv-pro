import os

files_to_update = [
    'app/dashboard/layout.tsx',
    'app/portal/layout.tsx',
    'app/admin/layout.tsx',
    'app/closer/layout.tsx',
    'app/client/layout.tsx'
]

for fname in files_to_update:
    if os.path.exists(fname):
        with open(fname, 'r') as f:
            content = f.read()

        if "GlobalHomeButton" not in content:
            # Add import
            import_statement = "import { GlobalHomeButton } from '@/components/shared/GlobalHomeButton'\n"
            # Insert after other imports
            first_import = content.find("import ")
            if first_import != -1:
                content = content[:first_import] + import_statement + content[first_import:]
                
            # Make main relative if it's not
            content = content.replace('className="flex-1 bg-[', 'className="relative flex-1 bg-[')
            content = content.replace('className="flex-1 min-w-0 bg-[', 'className="relative flex-1 min-w-0 bg-[')
            content = content.replace('<main className="flex-1', '<main className="relative flex-1')

            # Insert <GlobalHomeButton /> right after <main ...>
            main_start = content.find("<main")
            if main_start != -1:
                main_end = content.find(">", main_start)
                content = content[:main_end+1] + "\n        <GlobalHomeButton />" + content[main_end+1:]

        with open(fname, 'w') as f:
            f.write(content)

print("GlobalHomeButton added!")
