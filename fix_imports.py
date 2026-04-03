import os

files_to_update = [
    'components/portal/PortalSidebar.tsx',
    'components/admin/AdminSidebar.tsx',
    'components/closer/CloserSidebar.tsx',
    'components/client/ClientSidebar.tsx'
]

for fname in files_to_update:
    if os.path.exists(fname):
        with open(fname, 'r') as f:
            content = f.read()

        content = content.replace("} Globe,\n} from 'lucide-react'", "  Globe\n} from 'lucide-react'")
        content = content.replace("}\n  Globe,\n}", "  Globe\n}")

        with open(fname, 'w') as f:
            f.write(content)

print("Imports fixed!")
