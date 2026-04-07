import os
import re

directories_to_scan = [
    'app',
    'components',
    'lib',
    'prompts',
    'public',
    'sql',
    'types'
]

skip_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.tsbuildinfo']

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return

    # Direct brute-force replacement
    new_content = content.replace('PDV', 'Yayyam')
    new_content = new_content.replace('pdv', 'yayyam')
    new_content = new_content.replace('Pdv', 'Yayyam')
    
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

print("Brute-force rebrand done.")
