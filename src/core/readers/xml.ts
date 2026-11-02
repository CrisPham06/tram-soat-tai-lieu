import { SaxesParser } from 'saxes';
import { LIMITS, reject } from '../limits';
export interface XmlNode { name: string; attrs: Record<string, string>; children: XmlNode[]; text: string }
export function parseXml(bytes: Uint8Array): XmlNode {
  if (bytes.length > LIMITS.xmlBytes) return reject('xml-limit');
  let source: string;
  try { source = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { return reject('xml-broken'); }
  if (/<!\s*(?:DOCTYPE|ENTITY)/i.test(source)) return reject('xml-doctype');
  const root: XmlNode = { name: '#root', attrs: {}, children: [], text: '' }, stack = [root];
  const parser = new SaxesParser({ xmlns: true });
  parser.on('doctype', () => reject('xml-doctype'));
  parser.on('error', () => reject('xml-broken'));
  parser.on('opentag', tag => {
    if (stack.length > LIMITS.xmlDepth) return reject('xml-depth');
    const node: XmlNode = { name: tag.local, attrs: Object.fromEntries(Object.values(tag.attributes).map(a => [a.local, a.value])), children: [], text: '' };
    stack[stack.length - 1].children.push(node); stack.push(node);
  });
  parser.on('text', text => { stack[stack.length - 1].text += text; });
  parser.on('cdata', text => { stack[stack.length - 1].text += text; });
  parser.on('closetag', () => { stack.pop(); });
  try { parser.write(source).close(); } catch (e) { if (e instanceof Error && e.name === 'ScreeningError') throw e; return reject('xml-broken'); }
  return root;
}
export function all(node: XmlNode, name: string): XmlNode[] { return node.children.flatMap(n => [...(n.name === name ? [n] : []), ...all(n, name)]); }
export function content(node: XmlNode): string { return node.text + node.children.map(content).join(''); }
export function textRuns(node: XmlNode): string { if (['t', 'delText'].includes(node.name)) return content(node); if (['br', 'cr'].includes(node.name)) return '\n'; if (node.name === 'tab') return '\t'; return node.children.map(textRuns).join(''); }
