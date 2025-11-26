#!/usr/bin/env node

/**
 * Script para configurar automaticamente novos ambientes
 * 
 * Uso:
 *   node scripts/setup-environment.js <nome-do-ambiente>
 * 
 * Exemplo:
 *   node scripts/setup-environment.js cozinha
 * 
 * O script irá:
 * 1. Criar a pasta public/img/<ambiente> (se não existir)
 * 2. Criar a pasta public/presets/<ambiente>
 * 3. Gerar um viewerState.json inicial baseado nas imagens encontradas
 * 4. Atualizar o arquivo de configuração de ambientes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const IMG_DIR = path.join(PUBLIC_DIR, 'img');
const PRESETS_DIR = path.join(PUBLIC_DIR, 'presets');
const ENVIRONMENTS_CONFIG = path.join(PUBLIC_DIR, 'environments.json');

/**
 * Sanitiza o nome do arquivo para criar um label legível
 */
function sanitizeLabel(filename) {
  return filename
    .replace(/\.(png|jpg|jpeg|webp)$/i, '')
    .replace(/^\d+\s*-\s*/, '')
    .replace(/_/g, ' ')
    .toUpperCase()
    .trim();
}

/**
 * Cria a estrutura de pastas para um novo ambiente
 */
function createEnvironmentStructure(envName) {
  const envImgDir = path.join(IMG_DIR, envName);
  const envPresetDir = path.join(PRESETS_DIR, envName);

  // Criar pasta de imagens se não existir
  if (!fs.existsSync(envImgDir)) {
    fs.mkdirSync(envImgDir, { recursive: true });
    console.log(`✓ Criada pasta de imagens: ${envImgDir}`);
  } else {
    console.log(`⚠ Pasta de imagens já existe: ${envImgDir}`);
  }

  // Criar pasta de presets se não existir
  if (!fs.existsSync(envPresetDir)) {
    fs.mkdirSync(envPresetDir, { recursive: true });
    console.log(`✓ Criada pasta de presets: ${envPresetDir}`);
  } else {
    console.log(`⚠ Pasta de presets já existe: ${envPresetDir}`);
  }

  return { envImgDir, envPresetDir };
}

/**
 * Escaneia a pasta de imagens e retorna lista de arquivos PNG/JPG
 */
function scanImageFiles(envImgDir) {
  if (!fs.existsSync(envImgDir)) {
    return [];
  }

  const files = fs.readdirSync(envImgDir);
  return files
    .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .filter(f => f !== 'FINAL.png') // FINAL.png é tratado separadamente
    .sort();
}

/**
 * Gera o viewerState.json inicial baseado nas imagens encontradas
 */
function generateViewerState(imageFiles) {
  const values = {};
  const lightsState = {};
  const daylightTargets = [];

  imageFiles.forEach(file => {
    const label = sanitizeLabel(file);
    const isDaylight = file.startsWith('0 -') || label.includes('DOME') || label.includes('CORTINA');

    values[file] = 50;
    lightsState[file] = {
      nome: label,
      estado: true,
      dimmerizavel: false,
      valor: 50,
      pontos: []
    };

    if (isDaylight) {
      daylightTargets.push(file);
    }
  });

  values.__daylight = 50;

  return {
    values,
    lightsState,
    hotspots: [],
    portals: [], // Novo: array de portais para outros ambientes
    debugClick: false,
    showFinal: false,
    daylightTargets
  };
}

/**
 * Salva o viewerState.json na pasta de presets
 */
function saveViewerState(envPresetDir, viewerState) {
  const presetPath = path.join(envPresetDir, 'viewerState.json');
  
  if (fs.existsSync(presetPath)) {
    console.log(`⚠ Arquivo de preset já existe: ${presetPath}`);
    console.log('  Pulando criação para não sobrescrever configurações existentes.');
    return false;
  }

  fs.writeFileSync(presetPath, JSON.stringify(viewerState, null, 2), 'utf-8');
  console.log(`✓ Criado arquivo de preset: ${presetPath}`);
  return true;
}

/**
 * Atualiza ou cria o arquivo environments.json
 */
function updateEnvironmentsConfig(envName) {
  let environments = [];

  // Ler arquivo existente se houver
  if (fs.existsSync(ENVIRONMENTS_CONFIG)) {
    try {
      const content = fs.readFileSync(ENVIRONMENTS_CONFIG, 'utf-8');
      environments = JSON.parse(content);
    } catch (err) {
      console.warn('⚠ Erro ao ler environments.json, criando novo arquivo');
      environments = [];
    }
  }

  // Verificar se ambiente já existe
  const exists = environments.some(env => env.id === envName);
  if (exists) {
    console.log(`⚠ Ambiente "${envName}" já existe em environments.json`);
    return;
  }

  // Adicionar novo ambiente
  environments.push({
    id: envName,
    name: envName.charAt(0).toUpperCase() + envName.slice(1),
    imgPath: `/img/${envName}`,
    presetPath: `/presets/${envName}/viewerState.json`,
    thumbnail: `/img/${envName}/FINAL.png` // Usar FINAL.png como thumbnail se existir
  });

  fs.writeFileSync(ENVIRONMENTS_CONFIG, JSON.stringify(environments, null, 2), 'utf-8');
  console.log(`✓ Ambiente "${envName}" adicionado ao environments.json`);
}

/**
 * Função principal
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Erro: Nome do ambiente não fornecido');
    console.log('\nUso:');
    console.log('  node scripts/setup-environment.js <nome-do-ambiente>');
    console.log('\nExemplo:');
    console.log('  node scripts/setup-environment.js cozinha');
    process.exit(1);
  }

  const envName = args[0].toLowerCase().replace(/\s+/g, '-');
  
  console.log(`\n🚀 Configurando ambiente: ${envName}\n`);

  // 1. Criar estrutura de pastas
  const { envImgDir, envPresetDir } = createEnvironmentStructure(envName);

  // 2. Escanear imagens
  const imageFiles = scanImageFiles(envImgDir);
  console.log(`\n📁 Encontradas ${imageFiles.length} imagens em ${envImgDir}`);

  if (imageFiles.length === 0) {
    console.log('\n⚠ Nenhuma imagem encontrada. Adicione arquivos PNG/JPG à pasta:');
    console.log(`   ${envImgDir}`);
    console.log('\nDepois execute este script novamente.');
  } else {
    // 3. Gerar e salvar viewerState.json
    const viewerState = generateViewerState(imageFiles);
    saveViewerState(envPresetDir, viewerState);
  }

  // 4. Atualizar environments.json
  updateEnvironmentsConfig(envName);

  console.log('\n✅ Configuração concluída!\n');
  console.log('Próximos passos:');
  console.log(`  1. Adicione as imagens de camadas em: ${envImgDir}`);
  console.log(`  2. Configure os portais e hotspots no viewer`);
  console.log(`  3. Salve a configuração final usando o botão "Salvar config"`);
  console.log('');
}

main();
