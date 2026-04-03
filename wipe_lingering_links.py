import os
import re

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

        # Regex to remove any links containing <Globe> before a NotificationBell or setCollapsed
        pattern1 = r'<Link[^>]*Globe[^>]*>[^<]*<Globe[^>]*>[^<]*</Link>'
        content = re.sub(pattern1, '', content, flags=re.IGNORECASE)
        
        # Another pass for links that might have been broken like <Link...>, \n <Globe... \n </Link>
        pattern2 = r'<Link[^>]+href="/"[^>]*title="Voir la Landing Page"[^>]*>,\s*<Globe[^>]+>\s*</Link>'
        content = re.sub(pattern2, '', content, flags=re.IGNORECASE)

        # In case there are multiple, just do it repeatedly
        content = re.sub(pattern2, '', content, flags=re.IGNORECASE)

        with open(fname, 'w') as f:
            f.write(content)

print("Lingering links wiped")
