#!/usr/bin/env node
'use strict';

/**
 * 업무노트 > 프로젝트 읽기 전용 CLI (2026-11-26).
 *
 * tools/media-notes.cjs와 같은 방식 — Supabase CLI의 기존 로그인 권한으로 실행 시점에 API 키를 받아 쓰며
 * 키를 디스크나 출력에 남기지 않는다. projects·project_tabs, 업무노트(notes의 general), 월간 업무·메모를 GET으로만 읽는다(쓰기 명령 없음).
 *
 *   node tools/project-notes.cjs list
 *   node tools/project-notes.cjs get --id 프로젝트_ID [--out 저장할_JSON_경로]
 */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const PROJECT_REF = 'eukwfypbfqojbaihfqye';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

function fail(message, details) {
  console.error(JSON.stringify({ ok: false, error: message, details: details || undefined }, null, 2));
  process.exit(1);
}

function readServiceRoleKey() {
  let executable = 'supabase';
  if (process.platform === 'win32') {
    const npxRoot = path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
    const candidates = fs.existsSync(npxRoot)
      ? fs.readdirSync(npxRoot).map(folder => path.join(
          npxRoot, folder, 'node_modules', '@supabase', 'cli-windows-x64', 'bin', 'supabase.exe'
        )).filter(candidate => fs.existsSync(candidate))
      : [];
    candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    if (!candidates[0]) fail('Supabase CLI 실행 파일을 찾지 못했습니다. 먼저 `npx supabase projects list`를 한 번 실행하세요.');
    executable = candidates[0];
  }
  const result = spawnSync(executable, ['projects', 'api-keys', '--project-ref', PROJECT_REF, '--output', 'pretty'], {
    encoding: 'utf8', windowsHide: true, shell: false, timeout: 60000,
    env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: '1' },
  });
  if (result.error) fail('Supabase CLI 실행 실패', result.error.message);
  if (result.status !== 0) fail('Supabase CLI 인증 또는 API 키 조회 실패', String(result.stderr || '').trim());
  const match = String(result.stdout || '').match(/service_role\s*\|\s*([^\s|]+)/i);
  if (!match || !match[1] || match[1].includes('…') || match[1].includes('·')) {
    fail('service_role 키를 찾지 못했습니다. 먼저 `npx supabase login` 상태를 확인하세요.');
  }
  return match[1];
}

let serviceRoleKey = '';
async function get(query) {
  if (!serviceRoleKey) serviceRoleKey = readServiceRoleKey();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    method: 'GET',
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, Accept: 'application/json' },
  });
  const text = await response.text();
  if (!response.ok) fail(`Supabase 요청 실패 (${response.status})`, text);
  return JSON.parse(text);
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = {};
  for (let i = 0; i < rest.length; i += 2) args[String(rest[i]).replace(/^--/, '')] = rest[i + 1];

  if (command === 'list') {
    const rows = await get('projects?select=id,title,subtitle,category,updated_at&order=updated_at.desc&limit=100');
    console.log(JSON.stringify({ ok: true, count: rows.length, rows }, null, 2));
    return;
  }
  if (command === 'get') {
    if (!args.id || !/^[0-9a-z-]+$/i.test(args.id)) fail('유효한 --id가 필요합니다.');
    const [project] = await get(`projects?select=*&id=eq.${args.id}&limit=1`);
    if (!project) fail('해당 프로젝트를 찾지 못했습니다.');
    const tabs = await get(`project_tabs?select=*&project_id=eq.${args.id}&order=sort_order.asc`);
    const json = JSON.stringify({ ok: true, project, tabs }, null, 2);
    if (args.out) { fs.writeFileSync(args.out, json, 'utf8'); console.log(JSON.stringify({ ok: true, out: args.out, tabs: tabs.map(t => ({ id: t.id, title: t.title, length: String(t.content || '').length })) }, null, 2)); }
    else console.log(json);
    return;
  }
  // 업무노트(날짜별 일반 노트) — 기간을 정해 읽는다. 결과는 파일로 저장한다.
  if (command === 'worknotes') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.since || '') || !args.out) fail('worknotes에는 --since YYYY-MM-DD와 --out 경로가 필요합니다.');
    const rows = await get(`notes?select=id,date,type,title,content,saved_at&type=eq.general&date=gte.${args.since}&order=date.desc&limit=500`);
    fs.writeFileSync(args.out, JSON.stringify(rows, null, 2), 'utf8');
    console.log(JSON.stringify({ ok: true, count: rows.length, from: rows.at(-1)?.date, to: rows[0]?.date, out: args.out }, null, 2));
    return;
  }
  // 월간 업무(monthly_tasks)와 월간 메모(monthly_memos) 전체 — 파일로 저장한다.
  if (command === 'monthly') {
    if (!args.out) fail('monthly에는 --out 경로가 필요합니다.');
    // 한 번에 1,000줄까지만 오므로 나눠 읽는다.
    const all = async query => { const rows = []; for (let offset = 0; ; offset += 1000) { const page = await get(`${query}&limit=1000&offset=${offset}`); rows.push(...page); if (page.length < 1000) return rows; } };
    const tasks = await all('monthly_tasks?select=*&year=gte.2026&order=id.asc');
    const memos = await all('monthly_memos?select=*&order=type.asc,key.asc');
    fs.writeFileSync(args.out, JSON.stringify({ tasks, memos }, null, 2), 'utf8');
    console.log(JSON.stringify({ ok: true, tasks: tasks.length, memos: memos.length, out: args.out }, null, 2));
    return;
  }
  fail('사용법: node tools/project-notes.cjs list | get --id ID [--out 경로] | worknotes --since YYYY-MM-DD --out 경로');
}

main().catch(error => fail('예상하지 못한 오류', error.message));
