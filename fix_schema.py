import re

with open('prisma/schema.prisma', 'r') as f:
    text = f.read()

# Etape 1 : Retirer toutes les lignes contenant @@schema("public")
lines = [l for l in text.split('\n') if '@@schema("public")' not in l]

# Etape 2 : Rajouter exactement un @@schema("public") avant l'accolade fermante d'un model/enum
out = ""
in_block = False

for line in lines:
    if line.startswith('model ') or line.startswith('enum '):
        in_block = True
    
    if in_block and line.strip() == '}':
        out += '  @@schema("public")\n'
        in_block = False
        
    out += line + '\n'

with open('prisma/schema.prisma', 'w') as f:
    f.write(out)

