#!/usr/bin/env python3
"""
Script para gerenciar ambientes do projeto viz360
Permite adicionar e remover ambientes facilmente

Uso:
    python manage-environments.py add <nome>        # Adicionar ambiente
    python manage-environments.py remove <nome>     # Remover ambiente
    python manage-environments.py list              # Listar ambientes
"""

import json
import os
import shutil
import sys
from pathlib import Path

# Diretórios do projeto
ROOT_DIR = Path(__file__).parent.parent
PUBLIC_DIR = ROOT_DIR / 'public'
IMG_DIR = PUBLIC_DIR / 'img'
PRESETS_DIR = PUBLIC_DIR / 'presets'
ENVIRONMENTS_FILE = PUBLIC_DIR / 'environments.json'


def sanitize_label(filename):
    """Converte nome de arquivo em label legível"""
    name = filename.replace('.png', '').replace('.jpg', '').replace('.jpeg', '')
    name = name.split(' - ', 1)[-1] if ' - ' in name else name
    return name.replace('_', ' ').upper().strip()


def load_environments():
    """Carrega lista de ambientes"""
    if not ENVIRONMENTS_FILE.exists():
        return []
    
    with open(ENVIRONMENTS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_environments(environments):
    """Salva lista de ambientes"""
    with open(ENVIRONMENTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(environments, f, indent=2, ensure_ascii=False)


def create_environment(env_name):
    """Cria um novo ambiente"""
    env_id = env_name.lower().replace(' ', '-')
    
    # Criar diretórios
    env_img_dir = IMG_DIR / env_id
    env_preset_dir = PRESETS_DIR / env_id
    
    env_img_dir.mkdir(parents=True, exist_ok=True)
    env_preset_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"✓ Criadas pastas:")
    print(f"  - {env_img_dir}")
    print(f"  - {env_preset_dir}")
    
    # Escanear imagens (se existirem)
    image_files = list(env_img_dir.glob('*.png')) + list(env_img_dir.glob('*.jpg'))
    image_files = [f.name for f in image_files if f.name != 'FINAL.png']
    image_files.sort()
    
    # Gerar viewerState.json
    viewer_state = {
        "values": {},
        "lightsState": {},
        "hotspots": [],
        "portals": [],
        "debugClick": False,
        "showFinal": False,
        "daylightTargets": []
    }
    
    for img_file in image_files:
        label = sanitize_label(img_file)
        viewer_state["values"][img_file] = 50
        viewer_state["lightsState"][img_file] = {
            "nome": label,
            "estado": True,
            "dimmerizavel": False,
            "valor": 50,
            "pontos": []
        }
        
        # Adicionar a daylightTargets se for luz de ambiente
        if any(x in label for x in ['DOME', 'CORTINA', 'SOL']):
            viewer_state["daylightTargets"].append(img_file)
    
    viewer_state["values"]["__daylight"] = 50
    
    # Salvar viewerState.json
    preset_file = env_preset_dir / 'viewerState.json'
    if not preset_file.exists():
        with open(preset_file, 'w', encoding='utf-8') as f:
            json.dump(viewer_state, f, indent=2, ensure_ascii=False)
        print(f"✓ Criado preset: {preset_file}")
    else:
        print(f"⚠ Preset já existe: {preset_file}")
    
    # Atualizar environments.json
    environments = load_environments()
    
    if any(e['id'] == env_id for e in environments):
        print(f"⚠ Ambiente '{env_id}' já existe em environments.json")
        return
    
    environments.append({
        "id": env_id,
        "name": env_name.title(),
        "imgPath": f"/img/{env_id}",
        "presetPath": f"/presets/{env_id}/viewerState.json",
        "thumbnail": f"/img/{env_id}/FINAL.png"
    })
    
    save_environments(environments)
    print(f"✓ Ambiente '{env_name}' adicionado ao environments.json")
    
    if not image_files:
        print(f"\n⚠ Nenhuma imagem encontrada em {env_img_dir}")
        print(f"  Adicione arquivos PNG/JPG e execute novamente para gerar o preset")


def remove_environment(env_name):
    """Remove um ambiente"""
    env_id = env_name.lower().replace(' ', '-')
    
    # Carregar ambientes
    environments = load_environments()
    
    # Encontrar ambiente
    env_to_remove = next((e for e in environments if e['id'] == env_id), None)
    
    if not env_to_remove:
        print(f"❌ Ambiente '{env_id}' não encontrado")
        return
    
    # Confirmar remoção
    print(f"\n⚠️  ATENÇÃO: Você está prestes a remover o ambiente '{env_name}'")
    print(f"   Isso irá:")
    print(f"   - Remover entrada de environments.json")
    print(f"   - MANTER as pastas de imagens e presets (segurança)")
    print(f"\n   Para deletar as pastas também, faça manualmente:")
    print(f"   - {IMG_DIR / env_id}")
    print(f"   - {PRESETS_DIR / env_id}")
    
    confirm = input(f"\n   Continuar? (s/N): ").strip().lower()
    
    if confirm != 's':
        print("❌ Operação cancelada")
        return
    
    # Remover de environments.json
    environments = [e for e in environments if e['id'] != env_id]
    save_environments(environments)
    
    print(f"✓ Ambiente '{env_name}' removido de environments.json")
    print(f"\n💡 As pastas foram mantidas para segurança.")
    print(f"   Se quiser deletá-las, execute:")
    print(f"   Remove-Item -Recurse '{IMG_DIR / env_id}'")
    print(f"   Remove-Item -Recurse '{PRESETS_DIR / env_id}'")


def list_environments():
    """Lista todos os ambientes"""
    environments = load_environments()
    
    if not environments:
        print("Nenhum ambiente configurado")
        return
    
    print(f"\n📋 Ambientes configurados ({len(environments)}):\n")
    
    for i, env in enumerate(environments, 1):
        print(f"{i}. {env['name']} (id: {env['id']})")
        print(f"   Imagens: {env['imgPath']}")
        print(f"   Preset: {env['presetPath']}")
        
        # Verificar se as pastas existem
        img_path = PUBLIC_DIR / env['imgPath'].lstrip('/')
        preset_path = PUBLIC_DIR / env['presetPath'].lstrip('/')
        
        img_exists = img_path.exists()
        preset_exists = preset_path.exists()
        
        if img_exists:
            img_count = len(list(img_path.glob('*.png'))) + len(list(img_path.glob('*.jpg')))
            print(f"   ✓ {img_count} imagens encontradas")
        else:
            print(f"   ❌ Pasta de imagens não existe")
        
        if preset_exists:
            print(f"   ✓ Preset existe")
        else:
            print(f"   ❌ Preset não existe")
        
        print()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == 'add':
        if len(sys.argv) < 3:
            print("❌ Erro: Nome do ambiente não fornecido")
            print("Uso: python manage-environments.py add <nome>")
            sys.exit(1)
        
        env_name = ' '.join(sys.argv[2:])
        create_environment(env_name)
    
    elif command == 'remove':
        if len(sys.argv) < 3:
            print("❌ Erro: Nome do ambiente não fornecido")
            print("Uso: python manage-environments.py remove <nome>")
            sys.exit(1)
        
        env_name = ' '.join(sys.argv[2:])
        remove_environment(env_name)
    
    elif command == 'list':
        list_environments()
    
    else:
        print(f"❌ Comando desconhecido: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == '__main__':
    main()
