import os

files_to_update = [
    'components/dashboard/Sidebar.tsx',
    'components/portal/PortalSidebar.tsx',
    'components/admin/AdminSidebar.tsx',
    'components/closer/CloserSidebar.tsx',
    'components/client/ClientSidebar.tsx'
]

desktop_link = '''<Link href="/" title="Voir la Landing Page" className="flex items-center justify-center w-8 h-8 rounded-lg text-white/50 hover:bg-white/10 hover:text-emerald-400 transition-colors">
            <Globe className="w-5 h-5" />
          </Link>'''
          
mobile_link = '''<Link href="/" title="Voir la Landing Page" className="flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-emerald-400 transition-colors">
              <Globe className="w-[22px] h-[22px]" />
            </Link>'''
            
client_desktop_link = '''<Link href="/" title="Voir la Landing Page" className="flex items-center justify-center w-8 h-8 rounded-lg text-white/50 hover:bg-white/10 hover:text-emerald-400 transition-colors">
              <Globe className="w-5 h-5" />
            </Link>'''
client_mobile_link = '''<Link href="/" title="Voir la Landing Page" className="flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-emerald-400 transition-colors">
              <Globe className="w-[22px] h-[22px]" />
            </Link>'''

for fname in files_to_update:
    if os.path.exists(fname):
        with open(fname, 'r') as f:
            content = f.read()

        # Remove Globe from import
        content = content.replace("  Globe\n} from 'lucide-react'", "} from 'lucide-react'")
        content = content.replace(",\n  Globe\n} from 'lucide-react'", "\n} from 'lucide-react'")
        content = content.replace("  Globe,\n} from 'lucide-react'", "} from 'lucide-react'")
        
        # Remove the <Link> blocks
        content = content.replace(desktop_link + "\n          ", "")
        content = content.replace(mobile_link + "\n            ", "")
        
        content = content.replace(client_desktop_link + "\n            ", "")
        content = content.replace(client_mobile_link + "\n            ", "")

        with open(fname, 'w') as f:
            f.write(content)

print("Globe buttons removed from sidebars!")
