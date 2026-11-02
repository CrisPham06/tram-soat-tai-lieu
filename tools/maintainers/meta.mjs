import { execFileSync } from 'node:child_process';
import os from 'node:os';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
const roots = ['src', 'tests', 'rulepacks', 'public'];
function files(dir) { return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name).replaceAll('\\','/')]); }
export function codeRevision() {
  const paths = roots.flatMap(files).sort();
  const hashes = execFileSync('git',['hash-object','--no-filters','--stdin-paths'],{input:paths.join('\n')+'\n',encoding:'utf8'}).trim().split(/\r?\n/);
  const manifest = paths.map((path,i) => `${path}\0${hashes[i]}\n`).join('');
  return execFileSync('git',['hash-object','--stdin'],{input:manifest,encoding:'utf8'}).trim();
}
export function metadata(command) {
  return { command, at: new Date().toISOString(), code_revision:codeRevision(), node: process.version, os: `${os.type()} ${os.release()} ${os.arch()}` };
}
