#!/usr/bin/env node
'use strict';

/**
 * Codex용 미디어 원고 CLI.
 *
 * Supabase CLI의 기존 로그인 권한으로 실행 시점에 API 키를 받아 쓰며,
 * 키를 디스크나 출력에 남기지 않는다. 접근 범위는 notes 테이블의
 * blog/youtube 행으로 제한한다.
 */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const PROJECT_REF = 'eukwfypbfqojbaihfqye';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const MEDIA_TYPES = new Set(['blog', 'youtube']);
const STATUSES = new Set(['saving', 'uploaded']);

function fail(message, details) {
  console.error(JSON.stringify({ ok: false, error: message, details: details || undefined }, null, 2));
  process.exit(1);
}

function parseArgs(argv) {
  const command = argv[0] || 'help';
  const args = {};
  for (let i = 1; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) fail(`알 수 없는 인수: ${token}`);
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) args[key] = true;
    else { args[key] = value; i += 1; }
  }
  return { command, args };
}

function readServiceRoleKey() {
  let executable = 'supabase';
  if (process.platform === 'win32') {
    const npxRoot = path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
    const candidates = fs.existsSync(npxRoot)
      ? fs.readdirSync(npxRoot).map((folder) => path.join(
          npxRoot, folder, 'node_modules', '@supabase', 'cli-windows-x64', 'bin', 'supabase.exe'
        )).filter((candidate) => fs.existsSync(candidate))
      : [];
    candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    if (!candidates[0]) {
      fail('Supabase CLI 실행 파일을 찾지 못했습니다. 먼저 `npx supabase projects list`를 한 번 실행하세요.');
    }
    executable = candidates[0];
  }

  const result = spawnSync(executable, [
    'projects', 'api-keys',
    '--project-ref', PROJECT_REF,
    '--output', 'pretty',
  ], {
    encoding: 'utf8',
    windowsHide: true,
    shell: false,
    timeout: 60000,
    env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: '1' },
  });

  if (result.error) fail('Supabase CLI 실행 실패', result.error.message);
  if (result.status !== 0) fail('Supabase CLI 인증 또는 API 키 조회 실패', String(result.stderr || '').trim());

  const output = String(result.stdout || '');
  const match = output.match(/service_role\s*\|\s*([^\s|]+)/i);
  if (!match || !match[1] || match[1].includes('…') || match[1].includes('·')) {
    fail('service_role 키를 찾지 못했습니다. 먼저 `npx supabase login` 상태를 확인하세요.');
  }
  return match[1];
}

let serviceRoleKey = '';
async function request(path, options = {}) {
  if (!serviceRoleKey) serviceRoleKey = readServiceRoleKey();
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Accept: 'application/json',
    ...(options.headers || {}),
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); }
    catch { data = text; }
  }
  if (!response.ok) fail(`Supabase 요청 실패 (${response.status})`, data);
  return { data, headers: response.headers };
}

function requireMediaType(value) {
  if (!MEDIA_TYPES.has(value)) fail('--type은 blog 또는 youtube여야 합니다.');
  return value;
}

function requireStatus(value) {
  const status = value || 'saving';
  if (!STATUSES.has(status)) fail('--status는 saving 또는 uploaded여야 합니다.');
  return status;
}

function requireId(value) {
  if (!value || !/^[0-9a-f-]+$/i.test(value)) fail('유효한 --id가 필요합니다.');
  return value;
}

function readContentFile(path) {
  if (!path) fail('--content-file 경로가 필요합니다.');
  if (!fs.existsSync(path)) fail(`본문 파일을 찾을 수 없습니다: ${path}`);
  return fs.readFileSync(path, 'utf8');
}

function output(value) {
  console.log(JSON.stringify({ ok: true, ...value }, null, 2));
}

async function getMediaRow(id) {
  const params = new URLSearchParams({ select: '*', id: `eq.${id}`, limit: '1' });
  const { data } = await request(`notes?${params}`);
  const row = Array.isArray(data) ? data[0] : null;
  if (!row || !MEDIA_TYPES.has(row.type)) fail('해당 미디어 원고를 찾지 못했습니다.');
  return row;
}

async function main() {
  const { command, args } = parseArgs(process.argv.slice(2));

  if (command === 'help') {
    output({ usage: [
      'node tools/media-notes.cjs count --type youtube',
      'node tools/media-notes.cjs list --type blog --limit 20',
      'node tools/media-notes.cjs search --type youtube --query "검색어" --limit 20',
      'node tools/media-notes.cjs get --id UUID',
      'node tools/media-notes.cjs create --type blog --date YYYY-MM-DD --title "제목" --status saving --content-file PATH',
      'node tools/media-notes.cjs update --id UUID [--title "제목"] [--status uploaded] [--date YYYY-MM-DD] [--content-file PATH]',
    ] });
    return;
  }

  if (command === 'count') {
    const type = requireMediaType(args.type);
    const params = new URLSearchParams({ select: 'id', type: `eq.${type}`, limit: '1' });
    const { headers } = await request(`notes?${params}`, { headers: { Prefer: 'count=exact' } });
    const range = headers.get('content-range') || '';
    const count = Number(range.split('/')[1]);
    output({ type, count: Number.isFinite(count) ? count : null });
    return;
  }

  if (command === 'list' || command === 'search') {
    const type = requireMediaType(args.type);
    const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 200);
    const params = new URLSearchParams({
      select: 'id,date,type,title,status,saved_at',
      type: `eq.${type}`,
      order: 'saved_at.desc',
      limit: String(limit),
    });
    if (command === 'search') {
      const query = String(args.query || '').trim().replace(/[*,()]/g, ' ');
      if (!query) fail('--query가 필요합니다.');
      params.set('or', `(title.ilike.*${query}*,content.ilike.*${query}*)`);
    }
    const { data } = await request(`notes?${params}`);
    output({ type, count: data.length, rows: data });
    return;
  }

  if (command === 'get') {
    const row = await getMediaRow(requireId(args.id));
    output({ row });
    return;
  }

  if (command === 'create') {
    const type = requireMediaType(args.type);
    const title = String(args.title || '').trim();
    const date = String(args.date || '').trim();
    if (!title) fail('--title이 필요합니다.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('--date는 YYYY-MM-DD 형식이어야 합니다.');
    const body = {
      type,
      date,
      title,
      status: requireStatus(args.status),
      content: readContentFile(args['content-file']),
    };
    const { data } = await request('notes', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body,
    });
    output({ action: 'created', row: data[0] });
    return;
  }

  if (command === 'update') {
    const id = requireId(args.id);
    const before = await getMediaRow(id);
    const patch = { saved_at: new Date().toISOString() };
    if (args.title !== undefined) {
      patch.title = String(args.title).trim();
      if (!patch.title) fail('--title은 빈 값일 수 없습니다.');
    }
    if (args.status !== undefined) patch.status = requireStatus(args.status);
    if (args.date !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) fail('--date는 YYYY-MM-DD 형식이어야 합니다.');
      patch.date = args.date;
    }
    if (args['content-file'] !== undefined) patch.content = readContentFile(args['content-file']);
    if (Object.keys(patch).length === 1) fail('수정할 필드가 없습니다.');

    const params = new URLSearchParams({ id: `eq.${id}`, type: `eq.${before.type}` });
    const { data } = await request(`notes?${params}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: patch,
    });
    output({ action: 'updated', before, row: data[0] });
    return;
  }

  fail(`지원하지 않는 명령: ${command}`);
}

main().catch((error) => fail('예상하지 못한 오류', error.message));
