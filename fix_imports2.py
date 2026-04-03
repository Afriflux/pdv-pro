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

        content = content.replace("  LucideIcon\n  Globe", "  LucideIcon,\n  Globe")
        # In CloserSidebar it might be different, let's find any missing commas before Globe
        
        # General fix for missing commas before Globe
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if "Globe" in line and "from 'lucide-react'" not in line:
                if i > 0 and not lines[i-1].rstrip().endswith(',') and not lines[i-1].rstrip().endswith('{'):
                    # if the previous line is an import item but missing comma
                    lines[i-1] = lines[i-1] + ','

        with open(fname, 'w') as f:
            f.write('\n'.join(lines))

print("Imports fixed again!")
