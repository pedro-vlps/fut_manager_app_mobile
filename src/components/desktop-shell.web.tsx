import { PropsWithChildren } from 'react';
import { Link, usePathname } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { useResponsive } from '@/contexts/responsive';
import './desktop-shell.css';

const items = [
  { href: '/', label: 'Minhas peladas', icon: 'M3 10 12 3l9 7v11h-6v-7H9v7H3Z' },
  { href: '/championships', label: 'Campeonatos', icon: 'M7 3h10v7a5 5 0 0 1-10 0Zm0 2H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 15v6m-4 0h8' },
  { href: '/clubs', label: 'Meus times', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m17 0v-2a4 4 0 0 0-3-3.87M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m8-8a4 4 0 0 1 0 8' },
  { href: '/trophies', label: 'Meus troféus', icon: 'm12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z' },
  { href: '/profile', label: 'Meu perfil', icon: 'M20 21v-2a7 7 0 0 0-14 0v2M13 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8' },
] as const;

export default function DesktopShell({ children }: PropsWithChildren) {
  const { session, signOut } = useAuth();
  const layout = useResponsive();
  const pathname = usePathname();
  const visible = layout.desktop && !!session;
  const active = (href: string) => href === '/' ? pathname === '/' || pathname.startsWith('/groups') : pathname.startsWith(href);
  const section = items.find(item => active(item.href))?.label ?? 'Organize seu futebol';
  const links = <>{items.map(item => <Link key={item.href} href={item.href} asChild><a className={`desktop-nav-link ${active(item.href) ? 'is-active' : ''}`}
    aria-current={active(item.href) ? 'page' : undefined} aria-label={item.label} title={layout.compactSidebar ? item.label : undefined}>
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={item.icon} /></svg>
    <span>{item.label}</span>
  </a></Link>)}</>;
  return <div className="desktop-app-root" data-desktop-shell={visible ? 'true' : undefined}>
    {visible && layout.sidebar && <aside className={`desktop-sidebar ${layout.compactSidebar ? 'is-compact' : ''}`} style={{ width: layout.sidebarWidth }}>
      <Link href="/" asChild><a className="desktop-brand" aria-label="Fut Manager · Minhas peladas"><b>FM</b><span>fut<strong>manager</strong></span></a></Link>
      <div className="desktop-sidebar-caption">SEU FUTEBOL, ORGANIZADO</div>
      <nav aria-label="Navegação principal" className="desktop-nav">{links}</nav>
      <Link href="/create" asChild><a className="desktop-create" aria-label="Criar grupo ou campeonato" title="Criar grupo ou campeonato"><span aria-hidden="true">+</span><span>Criar grupo ou campeonato</span></a></Link>
      <div className="desktop-sidebar-footer"><p>Sua turma. Seu jogo.</p></div>
    </aside>}
    <div className="desktop-app-main">
      {visible && session && <header className="desktop-header">
        <div><span className="desktop-header-eyebrow">FUT MANAGER</span><strong>{section}</strong></div>
        <div className="desktop-account"><Link href="/profile" aria-label="Abrir meu perfil"><b>{session.profile.name.trim().charAt(0).toUpperCase()}</b><span>{session.profile.name}</span></Link><button type="button" onClick={signOut}>Sair</button></div>
      </header>}
      {visible && !layout.sidebar && <nav aria-label="Navegação principal" className="desktop-top-nav">{links}<Link href="/create" asChild><a className="desktop-nav-link">+ Criar</a></Link></nav>}
      <main className="desktop-route-content">{children}</main>
    </div>
  </div>;
}
