import { vi } from './copy.vi';
import { publicLinks } from './public-links';

export function PublicFooter() {
  return <footer className="site-footer"><div className="shell"><p>{vi.footerDemo} · <a href={publicLinks.source} target="_blank" rel="noreferrer">{vi.footerSource}</a> · {vi.footerOffline}</p><span>ANMBEENINE</span></div></footer>;
}
