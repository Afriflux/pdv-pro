import os
import re

directories_to_scan = [
    'app',
    'components',
    'lib',
    'prompts',
    'public',
    'sql'
]

replacements = [
    (r'\bPDV Pro\b', 'Yayyam'),
    (r'\bPDV PRO\b', 'YAYYAM'),
    (r'\bPDV\b', 'Yayyam'),
    (r'\bpdvpro\b', 'yayyam'),
    (r'\bpdv\b', 'yayyam')
]

# We want to skip any .jpg, .png, .webp, .ico etc
skip_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.tsbuildinfo']

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return

    new_content = content
    for pattern, replacement in replacements:
        # Ignore case for pdvpro/yayyam domains but the regex is exact here
        new_content = re.sub(pattern, replacement, new_content)
    
    # Also replace some specific concatenated terms
    new_content = new_content.replace('PDVConnexion', 'YayyamConnexion')
    new_content = new_content.replace('PDVAnalytics', 'YayyamAnalytics')
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {filepath}")

for directory in directories_to_scan:
    if not os.path.exists(directory):
        continue
    for root, dirs, files in os.walk(directory):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in skip_extensions:
                continue
            filepath = os.path.join(root, file)
            process_file(filepath)

print("Rebranding done.")
