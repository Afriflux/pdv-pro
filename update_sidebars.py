import os

files_to_update = [
    'components/portal/PortalSidebar.tsx',
    'components/admin/AdminSidebar.tsx',
    'components/closer/CloserSidebar.tsx'
]

mobile_bell = '<NotificationBell />'
desktop_bell = '<NotificationBell />'

desktop_link = '''<Link href="/" title="Voir la Landing Page" className="flex items-center justify-center w-8 h-8 rounded-lg text-white/50 hover:bg-white/10 hover:text-emerald-400 transition-colors">
            <Globe className="w-5 h-5" />
          </Link>
          <NotificationBell />'''

mobile_link = '''<Link href="/" title="Voir la Landing Page" className="flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-emerald-400 transition-colors">
              <Globe className="w-[22px] h-[22px]" />
            </Link>
            <NotificationBell />'''

for fname in files_to_update:
    if os.path.exists(fname):
        with open(fname, 'r') as f:
            content = f.read()

        if 'Globe' not in content:
            # We add Globe to lucide-react imports. Look for 'lucide-react'
            content = content.replace("from 'lucide-react'", "Globe,\n} from 'lucide-react'")
            content = content.replace("}\nGlobe,", "  Globe,\n}")

            # Replace the FIRST NotificationBell (desktop)
            content = content.replace("<NotificationBell />", desktop_link, 1)
            
            # Replace the SECOND NotificationBell (mobile)
            content = content.replace("<NotificationBell />", mobile_link, 1)

        with open(fname, 'w') as f:
            f.write(content)

# ClientSidebar doesn't have NotificationBell
client_file = 'components/client/ClientSidebar.tsx'
if os.path.exists(client_file):
    with open(client_file, 'r') as f:
        content = f.read()
    
    if 'Globe' not in content:
        content = content.replace("from 'lucide-react'", "Globe,\n} from 'lucide-react'")
        content = content.replace("}\nGlobe,", "  Globe,\n}")
        
        desktop_link_client = '''<Link href="/" title="Voir la Landing Page" className="flex items-center justify-center w-8 h-8 rounded-lg text-white/50 hover:bg-white/10 hover:text-emerald-400 transition-colors">
              <Globe className="w-5 h-5" />
            </Link>
            {setCollapsed && ('''
            
        mobile_link_client = '''</div>
          <div className="flex items-center gap-2">
            <Link href="/" title="Voir la Landing Page" className="flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-emerald-400 transition-colors">
              <Globe className="w-[22px] h-[22px]" />
            </Link>
          </div>
        </div>

        {mobileOpen && ('''
        
        content = content.replace("{setCollapsed && (", desktop_link_client, 1)
        content = content.replace("</div>\n        </div>\n\n        {mobileOpen && (", mobile_link_client, 1)
        
        with open(client_file, 'w') as f:
            f.write(content)

print("Sidebars updated successfully!")
