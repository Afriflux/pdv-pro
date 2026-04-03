import os

fname = 'components/admin/AdminSidebar.tsx'
if os.path.exists(fname):
    with open(fname, 'r') as f:
        content = f.read()

    if " Globe" not in content[:content.find("from 'lucide-react'")]:
        content = content.replace("from 'lucide-react'", "Globe,\n} from 'lucide-react'")
        content = content.replace("}\nGlobe,\n}", "Globe\n}")

        with open(fname, 'w') as f:
            f.write(content)
        print("Fixed AdminSidebar.tsx")
