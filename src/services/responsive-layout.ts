export function isMobileBrowser(browser: { userAgent: string; platform?: string; maxTouchPoints?: number; mobile?: boolean }) {
  return browser.mobile === true || /Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|Kindle/i.test(browser.userAgent)
    || (/Mac/i.test(browser.platform ?? '') && (browser.maxTouchPoints ?? 0) > 1);
}

export function responsiveLayout(width: number, mobileBrowser: boolean) {
  const desktop = !mobileBrowser;
  const sidebar = desktop && width >= 900;
  const compactSidebar = sidebar && width < 1280;
  const sidebarWidth = sidebar ? compactSidebar ? 84 : 256 : 0;
  const availableWidth = Math.max(0, width - sidebarWidth);
  const padding = availableWidth < 520 ? 16 : desktop ? 32 : 24;
  const contentWidth = Math.min(availableWidth, desktop ? 1240 : 760) - padding * 2;
  const columns = desktop && contentWidth >= 1050 ? 3 : desktop && contentWidth >= 680 ? 2 : 1;
  return { desktop, sidebar, compactSidebar, sidebarWidth, availableWidth, padding, contentWidth, columns,
    contentMaxWidth: desktop ? 1240 : 760, wideLogin: desktop && width >= 1000 };
}
