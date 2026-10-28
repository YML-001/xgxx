/* ============================================================
 * 学工信箱 —— 页面拆分生成器
 * 把 SPA 的每个「点击可到达的页面」快照为独立静态 HTML，
 * 方便设计师逐页设计（复用 css/style.css、css/mobile.css）。
 *
 * 用法：node tools/build-pages.js
 * 产物：pages/index.html + pages/desktop/*.html + pages/mobile/*.html
 *
 * 说明：
 *  - 生成的页面已「冻结」（不加载 app.js / mobile.js），保留完整结构与样式；
 *  - 侧边栏 / 底部导航已改写为静态链接，可在各页面间点击跳转；
 *  - 图表（原运行时 Canvas 绘制）以占位框呈现，供设计师替换视觉；
 *  - 数据来自 js/data.js 的初始演示数据。
 * ============================================================ */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "pages");
const OUT_D = path.join(OUT, "desktop");
const OUT_M = path.join(OUT, "mobile");
const OUT_ASSETS = path.join(OUT, "assets");   // pages/ 自包含运行时资源（css/js/vendor）


/* ---------------- 浏览器环境垫片 ---------------- */
function makeLocalStorage() {
  let s = {};
  return {
    getItem: (k) => (k in s ? s[k] : null),
    setItem: (k, v) => { s[k] = String(v); },
    removeItem: (k) => { delete s[k]; },
    clear: () => { s = {}; }
  };
}
global.localStorage = makeLocalStorage();
global.document = {
  addEventListener() {},
  getElementById() { return null; },
  querySelector() { return null; },
  querySelectorAll() { return []; }
};
global.window = global;
global.location = { hash: "" };

/* ---------------- 载入数据层与两端应用 ---------------- */
const dataJs = fs.readFileSync(path.join(ROOT, "js/data.js"), "utf8");
const appJs = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
const mobileJs = fs.readFileSync(path.join(ROOT, "js/mobile.js"), "utf8");
const capture = "\n;globalThis.__X={App,MOCK,NAV,ROUTE_TITLES,MApp,M_TABS,M_ROUTES,ROLE_KEYS,ROLE_LABELS,DEMO_SECTION,DEMO_COLLEGE,getMyLetters,getAllLetters,sectionMembers,replierCandidates,sectionLeader,findCollege,unreadCount};globalThis.__svgIcon=svgIcon;\n";
eval(dataJs + "\n" + appJs + "\n" + mobileJs + capture);
const { App, MOCK, NAV, ROUTE_TITLES, MApp, M_TABS, ROLE_KEYS, ROLE_LABELS, DEMO_SECTION, DEMO_COLLEGE } = globalThis.__X;
const secMembers = globalThis.__X.sectionMembers;
const repCands = globalThis.__X.replierCandidates;
const secLeader = globalThis.__X.sectionLeader;
const colOf = globalThis.__X.findCollege;
const unreadOf = globalThis.__X.unreadCount;
/* 用别名避免与 data.js 中同名函数声明（eval 泄漏到模块作用域）冲突 */
const getMy = globalThis.__X.getMyLetters;
const getAll = globalThis.__X.getAllLetters;
const drawIcon = globalThis.__svgIcon;

/* ---------------- 通用工具 ---------------- */
const HOME_KEYS = ["home", "sec-home", "admin-home", "leader-home", "col-todo"];
function slugForKey(key) {
  if (HOME_KEYS.includes(key)) return "home";
  if (key === "sec-inbox" || key === "inbox") return "inbox";
  return key;
}
function fileForRoleKey(role, key) { return `${role}-${slugForKey(key)}.html`; }

/* 设置演示身份上下文（桌面端 App / 移动端 MApp 共用） */
function setCtx(app, role) {
  app.role = role;
  app.section = DEMO_SECTION;
  app.member = repCands(DEMO_SECTION)[0] || null;
  app.college = DEMO_COLLEGE;
  app.mailbox = "学工信箱";
  app.state = {};
}

/* 把运行时 Canvas 图表替换为占位框 */
function replaceCanvas(html) {
  return html.replace(/<canvas\b([^>]*)><\/canvas>/g, (m, attrs) => {
    const w = (attrs.match(/width="(\d+)"/) || [])[1] || 160;
    const h = (attrs.match(/height="(\d+)"/) || [])[1] || 160;
    return `<div class="chart-slot" style="width:${w}px;height:${h}px;max-width:100%"><span>图表区域</span><small>Canvas 运行时绘制</small></div>`;
  });
}

/* 把运行时 ECharts 容器替换为占位框（设计稿冻结页无运行时脚本） */
function replaceEcharts(html) {
  return html.replace(/<div class="echart"[^>]*style="height:(\d+)px"[^>]*><\/div>/g, (m, h) =>
    `<div class="chart-slot" style="width:100%;height:${h}px"><span>图表区域</span><small>ECharts 运行时绘制</small></div>`);
}

const CHART_STYLE = `<style>
  /* 设计稿占位：图表槽位 */
  .chart-slot{display:flex;flex-direction:column;align-items:center;justify-content:center;
    border:1.5px dashed #cbd5e1;border-radius:14px;background:#f6f9fb;color:#94a3b8;
    font-size:12px;gap:4px;text-align:center;margin:auto}
  .chart-slot small{font-size:10px;opacity:.75}
  .page-stub-note{position:fixed;right:14px;bottom:12px;z-index:60;background:rgba(15,23,42,.82);
    color:#fff;font-size:11px;line-height:1.4;padding:7px 11px;border-radius:9px;
    font-family:-apple-system,"PingFang SC",sans-serif;box-shadow:0 6px 18px -6px rgba(0,0,0,.4);pointer-events:none}
</style>`;

const STUB = `<script>/* 静态设计稿：仅屏蔽内联事件报错，不做任何渲染 */
window.App={toast(){},navigate(){},showModal(){},hideModal(){}};
window.MApp={toast(){},go(){}};</script>`;

/* ---------------- 桌面端外壳 ---------------- */
function roleLabel(role) { return (ROLE_LABELS[role] || "学生") + "视角"; }
function userCard(role) {
  if (role === "admin") return { avatar: MOCK.admin.avatar, name: MOCK.admin.name, sub: MOCK.admin.role };
  if (role === "leader") {
    const l = secLeader(DEMO_SECTION);
    return l ? { avatar: l.name.charAt(0), name: l.name, sub: DEMO_SECTION + " · " + (l.title || "科室领导") } : { avatar: "-", name: "-", sub: DEMO_SECTION };
  }
  if (role === "replier") {
    const m = repCands(DEMO_SECTION)[0];
    return m ? { avatar: m.name.charAt(0), name: m.name, sub: DEMO_SECTION + " · " + (m.title || "回复人") } : { avatar: "-", name: "-", sub: DEMO_SECTION };
  }
  if (role === "college") {
    const c = colOf(DEMO_COLLEGE);
    return c ? { avatar: c.secretary.charAt(0), name: c.secretary, sub: c.name + " · " + (c.title || "副书记") } : { avatar: "-", name: "-", sub: DEMO_COLLEGE };
  }
  return { avatar: MOCK.user.avatar, name: MOCK.user.name, sub: MOCK.user.college };
}
function bellCount(app, role) { setCtx(app, role); return unreadOf(app.identityKey()); }
function navBadgesFor(role) {
  setCtx(App, role);
  const map = {};
  NAV[role].forEach(it => { if (it.key) { const b = App.navBadge(it.key); if (b) map[it.key] = b; } });
  return map;
}
function sidebarNav(role, activeKey, badges) {
  return NAV[role].map(it => {
    if (it.section) return `        <div class="nav-section-title">${it.section}</div>`;
    const active = it.key === activeKey ? " active" : "";
    const badge = badges[it.key] ? `<span class="nav-badge">${badges[it.key]}</span>` : "";
    return `        <button class="nav-item${active}" onclick="location.href='${fileForRoleKey(role, it.key)}'">` +
      `<span class="nav-ico">${drawIcon(it.ico)}</span><span>${it.label}</span>${badge}</button>`;
  }).join("\n");
}
function roleSwitch(role) {
  return ROLE_KEYS
    .map(k => `<button class="${role === k ? "active" : ""}" onclick="location.href='${k}-home.html'">${ROLE_LABELS[k]}</button>`)
    .join("");
}
function contextSwitch(role) {
  if (role === "college") {
    return `<span class="switch-label">学院</span><select class="ctx-select" title="切换学院（设计稿示意）">`
      + MOCK.colleges.filter(c => c.enabled !== false).map(c => `<option ${c.name === DEMO_COLLEGE ? "selected" : ""}>${c.name} · ${c.secretary}</option>`).join("")
      + `</select>`;
  }
  if (role !== "leader" && role !== "replier") return "";
  const sec = `<span class="switch-label">科室</span><select class="ctx-select" title="切换科室（设计稿示意）">`
    + MOCK.sections.map(s => `<option ${s.name === DEMO_SECTION ? "selected" : ""}>${s.name}</option>`).join("") + `</select>`;
  if (role === "leader") {
    const l = secLeader(DEMO_SECTION);
    return sec + `<span class="switch-label">科室领导</span><span class="switch-fixed">${l ? l.name + " · " + (l.title || "科长") : "未配置"}</span>`;
  }
  const members = repCands(DEMO_SECTION);
  return sec + `<span class="switch-label">本人</span>`
    + (members.length
        ? `<select class="ctx-select" title="切换本人身份（设计稿示意）">`
          + members.map((m, i) => `<option ${i === 0 ? "selected" : ""}>${m.name}${m.title ? " · " + m.title : ""}</option>`).join("")
          + `</select>`
        : `<span class="switch-empty">该科室暂无回复人</span>`);
}
function transformDesktopContent(html, role) {
  html = replaceCanvas(html);
  html = replaceEcharts(html);
  html = html.replace(/location\.hash='#\/([a-z-]+)'/g, (m, k) => `location.href='${role}-${slugForKey(k)}.html'`);
  html = html.replace(/data-quick="([a-z-]+)"/g, (m, k) => {
    const slug = k === "write" ? "write-notice" : slugForKey(k);
    return `data-quick="${k}" onclick="location.href='${role}-${slug}.html'"`;
  });
  /* 冻结页里的列表行改写为跳转到独立详情页（详情内容与角色无关，统一指向学生端详情页） */
  html = html.replace(/data-open-public="[^"]*"/g, `onclick="location.href='student-public-detail.html'"`);
  html = html.replace(/data-open-policy="[^"]*"/g, `onclick="location.href='student-policy-detail.html'"`);
  html = html.replace(/data-open="[^"]*"/g, `onclick="location.href='student-my-detail.html'"`);
  html = html.replace(/data-pubf="[^"]*"/g, "");
  return html;
}

function buildDesktop({ role, route, label, contentHtml, activeKey, pageTitle, breadcrumb }) {
  const meta = ROUTE_TITLES[route] || [label, ""];
  const title = pageTitle || meta[0];
  const crumb = breadcrumb !== undefined ? breadcrumb : meta[1];
  const badges = navBadgesFor(role);
  const uc = userCard(role);
  const ctx = contextSwitch(role);
  const bell = bellCount(App, role);
  const writeBtn = role === "student"
    ? `<button class="btn btn-primary" id="btn-write-quick" onclick="location.href='student-write-notice.html'">＋ 我要写信</button>`
    : `<button class="btn btn-primary" id="btn-write-quick" style="display:none">＋ 我要写信</button>`;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>学工信箱 · ${title}（${roleLabel(role)}）</title>
  <link rel="stylesheet" href="../assets/css/style.css">
  ${CHART_STYLE}
</head>
<body>
  <div class="app-shell">
    <aside class="sidebar" id="sidebar">
      <div class="brand">
        <div class="brand-icon">工</div>
        <div class="brand-text"><h1>学工信箱</h1><p>接诉即办 · 件件有回音</p></div>
      </div>
      <nav class="nav-group" id="sidebar-nav">
${sidebarNav(role, activeKey || route, badges)}
      </nav>
      <div class="sidebar-footer">
        <div class="role-badge" id="role-badge">${roleLabel(role)}</div>
        <div class="user-card">
          <div class="user-avatar" id="user-avatar">${uc.avatar}</div>
          <div class="user-info"><strong id="user-name">${uc.name}</strong><span id="user-sub">${uc.sub}</span></div>
        </div>
      </div>
    </aside>
    <div class="main">
      <header class="topbar">
        <div class="topbar-left">
          <button class="icon-btn mobile-menu-btn" id="mobile-menu-btn" aria-label="展开菜单">☰</button>
          <div class="topbar-title">
            <h2 id="page-title">${title}</h2>
            <div class="breadcrumb" id="breadcrumb">${crumb}</div>
          </div>
        </div>
        <div class="topbar-actions">
          <div class="mailbox-switch" id="mailbox-switch"${ctx ? "" : ' style="display:none"'}>${ctx}</div>
          <div class="role-switch" id="role-switch">${roleSwitch(role)}</div>
          <button class="icon-btn msg-bell" id="msg-bell" aria-label="消息通知" title="消息通知（未读 ${bell}）"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:1.1em;height:1.1em"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg><span class="msg-dot" id="msg-dot">${bell || ""}</span></button>
          ${writeBtn}
        </div>
      </header>
      <main class="content" id="app-content">
${transformDesktopContent(contentHtml, role)}
      </main>
    </div>
  </div>
  <div class="mask" id="sidebar-mask"></div>
  <div class="modal-overlay" id="modal">
    <div class="modal">
      <div class="modal-header"><h3 id="modal-title">详情</h3><button class="modal-close" id="modal-close" aria-label="关闭">&times;</button></div>
      <div class="modal-body" id="modal-body"></div>
    </div>
  </div>
  <output class="toast" id="toast" aria-live="polite"></output>
  <div class="page-stub-note">静态设计稿 · 顶栏/侧栏可点击跳转</div>
  ${STUB}
</body>
</html>`;
}

/* ---------------- 移动端外壳 ---------------- */
function transformMobileContent(html, route, role) {
  html = replaceCanvas(html);
  const target = (k) => (role !== "student" && M_SLUG[k]) ? mFileForTab(role, k) : `${k}.html`;
  html = html.replace(/data-go="([a-z-]+)"/g, (m, k) => `data-go="${k}" onclick="location.href='${target(k)}'"`);
  html = html.replace(/data-more="([a-z-]+)"/g, (m, k) => `data-more="${k}" onclick="location.href='${target(k)}'"`);
  html = html.replace(/data-role="([a-z]+)"/g, (m, k) => `data-role="${k}" onclick="location.href='${mFileForTab(k, k === "student" ? "home" : "more")}'"`);
  /* 列表行改写为跳转到独立详情页；「我的」列表进个人详情，其余进公开详情 */
  const letterTarget = route === "my" ? "my-detail.html" : "public-detail.html";
  html = html.replace(/data-letter="[^"]*"/g, `onclick="location.href='${letterTarget}'"`);
  html = html.replace(/data-policy="[^"]*"/g, `onclick="location.href='policy-detail.html'"`);
  /* 根目录实时 PC 入口是 pc.html；pages/ 内对应副本是 app.html。兼容旧文案 index.html。 */
  html = html.replace(/href="(?:index|pc)\.html"/g, 'href="../app.html"');
  return html;
}
/* 办理端 tab-key → 生成文件名映射（学生端为 <route>.html，其余为 <role>-<slug>.html） */
const M_SLUG = {
  "leader-home": "home", "leader-assign": "assign", "leader-approve": "approve",
  "sec-home": "home", "rep-todo": "todo", "sec-inbox": "inbox",
  "col-todo": "home", "col-visible": "visible",
  "admin-home": "home", "dispatch": "dispatch", "inbox": "inbox", "supervise": "supervise", "admin-stats": "stats",
  "more": "more"
};
function mFileForTab(role, key) {
  if (role === "student") return key + ".html";
  return `${role}-${M_SLUG[key] || key}.html`;
}
function mobileTabbar(role, activeTab) {
  setCtx(MApp, role);
  return (M_TABS[role] || M_TABS.student).map(t => {
    if (t.key === "__fab") return `        <div class="m-tab spacer"></div>`;
    const active = activeTab === t.key ? " active" : "";
    const badge = MApp.tabBadge(t.key);
    const b = badge ? ` (${badge})` : "";
    return `        <button class="m-tab${active}" onclick="location.href='${mFileForTab(role, t.key)}'">` +
      `<span class="m-tab-ico">${drawIcon(t.ico)}</span><span>${t.label}${b}</span></button>`;
  }).join("\n");
}
function buildMobile({ role = "student", route, label, sub, tab, contentHtml, backHref }) {
  const back = sub
    ? `<button class="m-back" id="m-back" aria-label="返回" onclick="location.href='${backHref || "home.html"}'">‹</button>`
    : `<button class="m-back hidden" id="m-back" aria-label="返回">‹</button>`;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>学工信箱 移动端 · ${label}</title>
  <link rel="stylesheet" href="../assets/css/mobile.css">
  ${CHART_STYLE}
</head>
<body>
  <div class="device">
    <div class="phone">
      <div class="statusbar">
        <span class="sb-time" id="sb-time">9:41</span>
        <span class="sb-icons">●●● &#128246; &#128267;</span>
      </div>
      <header class="m-appbar" id="m-appbar">
        ${back}
        <div class="m-appbar-title" id="m-title">${label}</div>
        <button class="m-appbar-btn" id="m-mailbox-btn" aria-label="切换信箱" style="display:none">&#9662;</button>
        <button class="m-appbar-btn m-bell" id="m-bell" aria-label="消息通知"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>${(() => { const n = bellCount(MApp, role); return n ? `<span class="m-bell-dot">${n}</span>` : ""; })()}</button>
      </header>
      <main class="m-main" id="m-content">
${transformMobileContent(contentHtml, route, role)}
      </main>
      ${role === "student" ? `<button class="m-fab" id="m-fab" aria-label="我要写信" onclick="location.href='write-notice.html'">＋</button>` : ""}
      <nav class="m-tabbar${(M_TABS[role] || []).length === 3 ? " cols-3" : ""}" id="m-tabbar">
${mobileTabbar(role, tab)}
      </nav>
      <div class="m-sheet-overlay" id="m-sheet">
        <div class="m-sheet">
          <div class="m-sheet-handle"></div>
          <div class="m-sheet-head"><h3 id="m-sheet-title">详情</h3><button class="m-sheet-close" id="m-sheet-close" aria-label="关闭">&times;</button></div>
          <div class="m-sheet-body" id="m-sheet-body"></div>
        </div>
      </div>
      <div class="m-toast" id="m-toast" aria-live="polite"></div>
    </div>
  </div>
  ${STUB}
</body>
</html>`;
}

/* ---------------- 独立详情页内容包裹 ---------------- */
function desktopDetailContent(bodyHtml, backHref, backLabel) {
  return `        <div style="margin-bottom:14px">
          <a class="btn btn-outline btn-sm" href="${backHref}">‹ 返回${backLabel}</a>
        </div>
        <div class="card"><div class="card-body">
${bodyHtml}
        </div></div>`;
}
function mobileDetailContent(bodyHtml) {
  return `        <div class="m-card">
${bodyHtml}
        </div>`;
}

/* ---------------- 任务清单 ---------------- */
const desktopJobs = [
  { role: "student", route: "home", method: "renderHome", label: "工作台" },
  { role: "student", route: "write-notice", method: "renderNotice", label: "写信须知" },
  { role: "student", route: "write", method: "renderWrite", label: "我要写信" },
  { role: "student", route: "my", method: "renderMy", label: "我的信件" },
  { role: "student", route: "query", method: "renderQuery", label: "信件查询" },
  { role: "student", route: "public", method: "renderPublic", label: "公开信件" },
  { role: "student", route: "policy", method: "renderPolicy", label: "制度文件" },
  { role: "student", route: "stats", method: "renderStats", label: "数据统计" },
  { role: "student", route: "dept", method: "renderDept", label: "科室联系方式" },
  { role: "student", route: "faq", method: "renderFaq", label: "常见问题" },
  { role: "admin", route: "admin-home", method: "renderAdminHome", label: "办理工作台" },
  { role: "admin", route: "dispatch", method: "renderDispatch", label: "待分派信件" },
  { role: "admin", route: "inbox", method: "renderInbox", label: "信件收件箱" },
  { role: "admin", route: "supervise", method: "renderSupervise", label: "督办催办" },
  { role: "admin", route: "publish", method: "renderPublish", label: "公开情况" },
  { role: "admin", route: "analytics", method: "renderAnalytics", label: "统计分析" },
  { role: "admin", route: "category-mgr", method: "renderCategoryMgr", label: "分类管理" },
  { role: "admin", route: "section-mgr", method: "renderSectionMgr", label: "科室与人员" },
  { role: "admin", route: "policy-mgr", method: "renderPolicyMgr", label: "制度文件管理" },
  { role: "admin", route: "sla-mgr", method: "renderSlaMgr", label: "时限与模板" },
  { role: "admin", route: "faq-mgr", method: "renderFaqMgr", label: "常见问题配置" },
  { role: "leader", route: "leader-home", method: "renderLeaderHome", label: "科室工作台" },
  { role: "leader", route: "leader-assign", method: "renderLeaderList", arg: "assign", label: "待指定回复人" },
  { role: "leader", route: "leader-approve", method: "renderLeaderList", arg: "approve", label: "待审批" },
  { role: "leader", route: "sec-inbox", method: "renderSectionInbox", label: "科室收件箱" },
  { role: "leader", route: "public", method: "renderPublic", label: "公开信件" },
  { role: "leader", route: "policy", method: "renderPolicy", label: "制度文件" },
  { role: "replier", route: "sec-home", method: "renderSectionHome", label: "我的工作台" },
  { role: "replier", route: "rep-todo", method: "renderReplierTodo", label: "待我办理" },
  { role: "replier", route: "sec-inbox", method: "renderSectionInbox", label: "科室收件箱" },
  { role: "replier", route: "public", method: "renderPublic", label: "公开信件" },
  { role: "replier", route: "policy", method: "renderPolicy", label: "制度文件" },
  { role: "college", route: "col-todo", method: "renderCollegeTodo", label: "协同待办" },
  { role: "college", route: "col-visible", method: "renderCollegeVisible", label: "学院可见信件" },
  { role: "college", route: "policy", method: "renderPolicy", label: "制度文件" }
];

const mobileJobs = [
  { route: "home", method: "pHome", label: "首页", tab: "home" },
  { route: "public", method: "pPublic", label: "公开信件", tab: "public" },
  { route: "my", method: "pMy", label: "我的信件", tab: "my" },
  { route: "more", method: "pMore", label: "更多", tab: "more" },
  { route: "write-notice", method: "pNotice", label: "写信须知", sub: true },
  { route: "write", method: "pWrite", label: "我要写信", sub: true },
  { route: "query", method: "pQuery", label: "信件查询", sub: true },
  { route: "policy", method: "pPolicy", label: "制度文件", sub: true },
  { route: "stats", method: "pStats", label: "数据统计", sub: true },
  { route: "dept", method: "pDept", label: "科室联系", sub: true },
  { route: "faq", method: "pFaq", label: "常见问题", sub: true },
  { route: "msgs", method: "pMessages", label: "消息通知", sub: true, backHref: "home.html" },
  { role: "admin", route: "admin-home", method: "pAdminHome", label: "办理工作台", tab: "admin-home" },
  { role: "admin", route: "dispatch", method: "pDispatch", label: "待分派信件", tab: "dispatch" },
  { role: "admin", route: "inbox", method: "pInbox", label: "信件收件箱", tab: "inbox" },
  { role: "admin", route: "supervise", method: "pSupervise", label: "督办催办", tab: "supervise" },
  { role: "admin", route: "admin-stats", method: "pAnalytics", label: "统计分析", sub: true, backHref: "admin-more.html" },
  { role: "admin", route: "more", method: "pMore", label: "更多", tab: "more" },
  { role: "leader", route: "leader-home", method: "pLeaderHome", label: "科室工作台", tab: "leader-home" },
  { role: "leader", route: "leader-assign", method: "pLeaderList", arg: "assign", label: "待指定回复人", tab: "leader-assign" },
  { role: "leader", route: "leader-approve", method: "pLeaderList", arg: "approve", label: "待审批答复", tab: "leader-approve" },
  { role: "leader", route: "sec-inbox", method: "pSectionInbox", label: "科室收件箱", tab: "sec-inbox" },
  { role: "leader", route: "more", method: "pMore", label: "更多", tab: "more" },
  { role: "replier", route: "sec-home", method: "pSectionHome", label: "我的工作台", tab: "sec-home" },
  { role: "replier", route: "rep-todo", method: "pReplierTodo", label: "待我办理", tab: "rep-todo" },
  { role: "replier", route: "sec-inbox", method: "pSectionInbox", label: "科室收件箱", tab: "sec-inbox" },
  { role: "replier", route: "more", method: "pMore", label: "更多", tab: "more" },
  { role: "college", route: "col-todo", method: "pCollegeTodo", label: "协同待办", tab: "col-todo" },
  { role: "college", route: "col-visible", method: "pCollegeVisible", label: "学院可见信件", tab: "col-visible" },
  { role: "college", route: "more", method: "pMore", label: "更多", tab: "more" }
];

/* ---------------- 自包含资源打包 ---------------- */
/* 把根目录 css/js/vendor 复制进 pages/assets/，并生成 pages/ 内的实时应用副本，
 * 使「仅上传 pages/ 文件夹」即可完整预览（导航中心 + 实时 PC/移动应用 + 全部静态快照）。
 * 根目录仍为唯一「源」，每次生成自动同步，无需手工复制。 */
function copyInto(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}
function rewriteAssetPaths(html) {
  return html
    .replace(/href="css\//g, 'href="assets/css/')
    .replace(/src="js\//g, 'src="assets/js/')
    .replace(/src="vendor\//g, 'src="assets/vendor/');
}
function bundleAssets() {
  [
    ["css/style.css", "css/style.css"],
    ["css/mobile.css", "css/mobile.css"],
    ["js/data.js", "js/data.js"],
    ["js/app.js", "js/app.js"],
    ["js/mobile.js", "js/mobile.js"],
    ["vendor/echarts.min.js", "vendor/echarts.min.js"]
  ].forEach(([src, rel]) => copyInto(path.join(ROOT, src), path.join(OUT_ASSETS, rel)));
  /* 实时应用副本（路径改写到 pages/assets/）。
   * 只读根目录 pc.html / mobile.html，不读、不写根 index.html（那是给老师的导航页）。 */
  fs.writeFileSync(path.join(OUT, "app.html"), rewriteAssetPaths(fs.readFileSync(path.join(ROOT, "pc.html"), "utf8")));
  fs.writeFileSync(path.join(OUT, "mobile.html"), rewriteAssetPaths(fs.readFileSync(path.join(ROOT, "mobile.html"), "utf8")));
  /* pages/mobile.html 与 pages/app.html 同级，桌面端链接改到 app.html */
  const mobileCopy = path.join(OUT_ASSETS, "js/mobile.js");
  fs.writeFileSync(mobileCopy, fs.readFileSync(mobileCopy, "utf8").replace(/href="pc\.html"/g, 'href="app.html"'));
}

/* ---------------- 执行生成 ---------------- */
fs.mkdirSync(OUT_D, { recursive: true });
fs.mkdirSync(OUT_M, { recursive: true });
[OUT_D, OUT_M].forEach(dir => fs.readdirSync(dir).filter(f => f.endsWith(".html")).forEach(f => fs.unlinkSync(path.join(dir, f))));
bundleAssets();

const built = { desktop: [], mobile: [] };

desktopJobs.forEach(job => {
  setCtx(App, job.role);
  App.route = job.route;
  App.afterRender = null;
  const content = App[job.method](job.arg);
  const file = fileForRoleKey(job.role, job.route);
  fs.writeFileSync(path.join(OUT_D, file), buildDesktop({ ...job, contentHtml: content }));
  built.desktop.push({ file, ...job });
});

mobileJobs.forEach(job => {
  const role = job.role || "student";
  setCtx(MApp, role);
  MApp.route = job.route;
  MApp._after = null;
  const content = MApp[job.method](job.arg);
  const file = job.file || mFileForTab(role, job.route);
  fs.writeFileSync(path.join(OUT_M, file), buildMobile({ ...job, role, contentHtml: content }));
  built.mobile.push({ file, role, label: job.label, tab: job.tab, sub: job.sub });
});

/* ---------------- 生成独立详情页（列表行点击可到达） ---------------- */
const myLetters = getMy().filter(l => l.status !== "草稿");
const sampleMy = myLetters.find(l => l.status === "已办结") || myLetters[0];
if (!repCands(DEMO_SECTION).length) throw new Error("演示科室缺少回复人配置：" + DEMO_SECTION);
const publicLetters = getAll().filter(l => l.publicScope === "all" && l.status === "已办结");
/* 公开详情优先选取其他同学的来信，避免与「我的信件」详情重复 */
const samplePublic = publicLetters.find(l => l.owner === "other") || publicLetters[0] || getAll()[0];
/* 详情页与编辑示意页优先选取带正文+附件的制度文件，以完整展示新功能 */
const samplePolicy = MOCK.policies.find(p => p.body && p.attachments && p.attachments.length)
  || MOCK.policies.find(p => p.status === "现行有效") || MOCK.policies[0];

/* 桌面端详情页 */
setCtx(App, "student"); App.afterRender = null;
const detailDesktopJobs = [
  {
    file: "student-my-detail.html", activeKey: "my", label: "我的信件 · 详情",
    pageTitle: "我的信件 · 信件详情", breadcrumb: "首页 / 我的信件 / 信件详情",
    body: App.letterDetailHtml(sampleMy, "student"), backHref: "student-my.html", backLabel: "我的信件"
  },
  {
    file: "student-public-detail.html", activeKey: "public", label: "公开信件 · 详情",
    pageTitle: "公开信件 · 信件详情", breadcrumb: "信息公开 / 公开信件 / 信件详情",
    body: App.letterDetailHtml(samplePublic, "public"), backHref: "student-public.html", backLabel: "公开信件"
  },
  {
    file: "student-policy-detail.html", activeKey: "policy", label: "制度文件 · 详情",
    pageTitle: "制度文件 · 文件详情", breadcrumb: "信息公开 / 制度文件 / 文件详情",
    body: App.policyDetailHtml(samplePolicy), backHref: "student-policy.html", backLabel: "制度文件"
  }
];
detailDesktopJobs.forEach(job => {
  const content = desktopDetailContent(job.body, job.backHref, job.backLabel);
  fs.writeFileSync(path.join(OUT_D, job.file), buildDesktop({
    role: "student", route: job.file.replace(/\.html$/, ""), label: job.label,
    activeKey: job.activeKey, pageTitle: job.pageTitle, breadcrumb: job.breadcrumb, contentHtml: content
  }));
  built.desktop.push({ file: job.file, role: "student", label: job.label });
});

/* 移动端详情页 */
setCtx(MApp, "student"); MApp._after = null;
const detailMobileJobs = [
  { file: "my-detail.html", title: "信件详情", navLabel: "我的信件 · 详情", backHref: "my.html", body: MApp.letterDetailBody(sampleMy, "student") },
  { file: "public-detail.html", title: "信件详情", navLabel: "公开信件 · 详情", backHref: "public.html", body: MApp.letterDetailBody(samplePublic, "public") },
  { file: "policy-detail.html", title: "文件详情", navLabel: "制度文件 · 详情", backHref: "policy.html", body: MApp.policyDetailBody(samplePolicy) }
];
detailMobileJobs.forEach(job => {
  const route = job.file.replace(/\.html$/, "");
  fs.writeFileSync(path.join(OUT_M, job.file), buildMobile({
    route, label: job.title, sub: true, backHref: job.backHref, contentHtml: mobileDetailContent(job.body)
  }));
  built.mobile.push({ file: job.file, label: job.navLabel });
});

/* 管理员：制度文件编辑表单设计页（正文富文本 + 附件上传 + 预览 示意） */
setCtx(App, "admin"); App.afterRender = null;
const policyFormContent = `        <p class="section-title">制度文件编辑（正文富文本 + 附件上传 + 预览）· 设计示意</p>
        <div class="card"><div class="card-header"><h3>编辑制度文件</h3><span class="hint">${escapeHtml(samplePolicy.code)}</span></div>
          <div class="card-body">
${App.policyFormHtml(samplePolicy)}
          </div>
        </div>`;
fs.writeFileSync(path.join(OUT_D, "admin-policy-form.html"), buildDesktop({
  role: "admin", route: "admin-policy-form", label: "制度文件编辑",
  activeKey: "policy-mgr", pageTitle: "制度文件编辑 · 示意", breadcrumb: "配置 / 制度文件管理 / 编辑文件",
  contentHtml: policyFormContent
}));
built.desktop.push({ file: "admin-policy-form.html", role: "admin", label: "制度文件编辑（示意）" });

/* ---------------- 生成索引导航页（中南主色体系风格） ---------------- */
const totalPages = built.desktop.length + built.mobile.length;

const roleCards = [
  {
    name: "学生", icon: "write", tag: "诉求提交方", tagColor: "green",
    grad: "linear-gradient(135deg,#3fd0a3,#1BB975)",
    ports: ["桌面端", "移动端"],
    duty: "提交并跟踪本人诉求，来信统一送达综合办公室受理；提交后收到收悉回执，可评价并申请二次办理。",
    perms: ["写信 / 查询 / 撤回", "催办 / 补充材料", "收悉回执 / 消息通知", "满意度评价 / 二次办理"],
    home: "desktop/student-home.html"
  },
  {
    name: "综合办", icon: "dashboard", tag: "统一受理与分派", tagColor: "orange",
    grad: "linear-gradient(135deg,#f6a94a,#F29100)",
    ports: ["桌面端", "移动端"],
    duty: "统一受理全部来信，选择承办科室后由系统带出科室领导；负责改派科室、督办催办与后台配置。",
    perms: ["分给科室领导 / 改派科室", "督办 / 批量催办", "科室与人员 / 分类管理", "公开情况 / 时限与模板 / 统计"],
    home: "desktop/admin-home.html"
  },
  {
    name: "科室领导（科长）", icon: "userCheck", tag: "指定与审批", tagColor: "blue",
    grad: "linear-gradient(135deg,#5aa9e6,#3087CC)",
    ports: ["桌面端", "移动端"],
    duty: "接收综合办分来的信件，指定本科室回复人；所有答复都须经其审批，通过后由回复人确认发送。",
    perms: ["指定 / 改派回复人", "审批通过 / 打回修改", "查看本科室全部信件", "不直接修改或发送答复"],
    home: "desktop/leader-home.html"
  },
  {
    name: "科室回复人", icon: "write", tag: "拟稿与发送", tagColor: "blue",
    grad: "linear-gradient(135deg,#6fb8ea,#2A8DC7)",
    ports: ["桌面端", "移动端"],
    duty: "拟写答复并提交科室领导审批；不能直接拟写时请学生所在学院副书记协同；审批通过后确认发送并选择公开范围。",
    perms: ["拟写 / 暂存答复", "发起学院协同", "提交审批 / 按意见修改", "确认发送 · 选择公开范围"],
    home: "desktop/replier-home.html"
  },
  {
    name: "学院副书记", icon: "users", tag: "学院协同", tagColor: "green",
    grad: "linear-gradient(135deg,#9b86d6,#7A5CC2)",
    ports: ["桌面端", "移动端"],
    duty: "接收回复人直接发来的协同请求，指定人员线下承办后写处理意见发回；可查看本学院「仅该学院副书记可见」的信件。",
    perms: ["协同待办 / 写处理意见", "查看学院可见信件", "线下承办不作为审批环节"],
    home: "desktop/college-home.html"
  }
];

const navGroups = [
  ...ROLE_KEYS.map(k => ({ key: k, icon: { student: "mail", admin: "dashboard", leader: "userCheck", replier: "write", college: "users" }[k],
    title: `桌面端 · ${ROLE_LABELS[k]}`, desc: roleCards.find(r => r.name.indexOf(ROLE_LABELS[k]) === 0 || (k === "admin" && r.name === "综合办")).tag,
    items: built.desktop.filter(d => d.role === k), dir: "desktop" })),
  ...ROLE_KEYS.map(k => ({ key: "m-" + k, icon: "phone", title: `移动端 · ${ROLE_LABELS[k]}`, desc: "H5",
    items: built.mobile.filter(m => (m.role || "student") === k), dir: "mobile" }))
];

function roleCardHtml(r) {
  return `        <a class="role-card" href="${r.home}">
          <div class="role-top">
            <div class="role-av" style="background:${r.grad}">${drawIcon(r.icon)}</div>
            <div>
              <div class="role-name">${r.name}</div>
              <span class="tag ${r.tagColor}">${r.tag}</span>
            </div>
          </div>
          <div class="role-lbl">使用端口</div>
          <div class="ports">${r.ports.map(p => `<span class="port">${p}</span>`).join("")}</div>
          <div class="role-lbl">核心职责</div>
          <p class="duty">${r.duty}</p>
          <div class="role-lbl">权限范围</div>
          <div class="perms">${r.perms.map(p => `<div class="perm"><span class="ck">✓</span>${p}</div>`).join("")}</div>
        </a>`;
}
function navGroupHtml(g) {
  const cards = g.items.map(it => `          <a class="p-card" href="${g.dir}/${it.file}">
            <span class="t">${it.label}</span>
            <span class="f">${it.file}</span>
          </a>`).join("\n");
  return `      <section class="section">
        <div class="section-hd"><span class="ic">${drawIcon(g.icon)}</span><h2>${g.title}</h2><span class="cnt">${g.items.length} 页 · ${g.desc}</span></div>
        <div class="page-grid">
${cards}
        </div>
      </section>`;
}

const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>学工信箱 · 原型页面导航</title>
  <style>
    :root{
      --blue:#2A8DC7;--blue-dark:#006DAD;--blue-soft:#E3F1F9;
      --ink:#1E323F;--text:#3C444F;--muted:#627079;--muted2:#909399;
      --border:#E3F1F9;--bg:#E3F1F9;--card:#FFFFFF;
      --green:#1BB975;--green-soft:#E8FCF4;--orange:#F29100;--orange-soft:#FFF5E5;
    }
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'OPPOSans',-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;
      background:var(--bg);color:var(--text);line-height:1.65;-webkit-font-smoothing:antialiased}
    a{text-decoration:none;color:inherit}
    .wrap{max-width:1040px;margin:0 auto;padding:0 24px}

    /* Hero */
    .hero{text-align:center;padding:60px 24px 44px}
    .hero-icon{width:74px;height:74px;border-radius:20px;margin:0 auto 22px;display:flex;align-items:center;justify-content:center;
      background:linear-gradient(135deg,#4aa3db,#2b7ec4);box-shadow:0 14px 30px -10px rgba(48,135,204,.55);
      color:#fff;font-size:34px;font-weight:700}
    .hero h1{font-size:30px;font-weight:700;color:var(--ink);letter-spacing:.5px}
    .hero .sub{max-width:668px;margin:15px auto 0;color:var(--muted);font-size:15px}
    .hero .emph{max-width:700px;margin:8px auto 0;color:var(--text);font-size:15px;font-weight:600}
    .badges{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:22px}
    .badge{display:inline-flex;align-items:center;gap:7px;font-size:13px;padding:7px 15px;border-radius:999px}
    .badge.a{background:var(--blue-soft);color:var(--blue)}
    .badge.b{background:#fff;color:var(--text);border:1px solid var(--border)}
    .stats{display:flex;justify-content:center;gap:54px;flex-wrap:wrap;margin-top:36px}
    .stat .n{font-size:33px;font-weight:700;color:var(--blue);line-height:1}
    .stat .l{margin-top:9px;color:var(--muted);font-size:13px}

    /* 演示入口（进入实时应用） */
    .demo-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .demo-card{display:flex;align-items:center;gap:16px;background:linear-gradient(135deg,#f3f9fd,#e7f1fb);
      border:1px solid #cfe3f4;border-radius:18px;padding:20px 22px;transition:.18s}
    .demo-card:hover{border-color:var(--blue);transform:translateY(-3px);box-shadow:0 18px 38px -18px rgba(48,135,204,.6)}
    .demo-ic{width:54px;height:54px;border-radius:15px;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-size:26px}
    .demo-tx{flex:1;min-width:0}
    .demo-tx h3{font-size:17px;font-weight:700;color:var(--ink)}
    .demo-tx p{font-size:12.5px;color:var(--muted);margin-top:3px}
    .demo-go{flex:none;font-size:13px;color:var(--blue);font-weight:600;white-space:nowrap}
    @media(max-width:560px){.demo-grid{grid-template-columns:1fr}}

    /* Sections */
    .board{background:#fff;border-top:1px solid var(--border);padding:6px 0 40px;margin-top:22px}
    .section{padding:6px 0}
    .section-hd{display:flex;align-items:center;gap:10px;margin:30px 0 16px}
    .section-hd .ic{width:28px;height:28px;border-radius:8px;background:var(--blue-soft);color:var(--blue);
      display:flex;align-items:center;justify-content:center;font-size:15px;flex:none}
    .section-hd h2{font-size:19px;font-weight:700;color:var(--ink)}
    .section-hd .cnt{color:var(--muted2);font-size:13px;font-weight:400}

    /* Role cards */
    .role-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}
    .role-card{display:block;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:22px;
      box-shadow:0 1px 2px rgba(16,24,40,.04);transition:.16s}
    .role-card:hover{border-color:#cfe0f0;box-shadow:0 14px 30px -16px rgba(48,135,204,.5);transform:translateY(-2px)}
    .role-top{display:flex;align-items:center;gap:13px;margin-bottom:6px}
    .role-av{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;flex:none}
    .role-name{font-size:17px;font-weight:700;color:var(--ink)}
    .tag{display:inline-block;margin-top:5px;font-size:12px;padding:2px 9px;border-radius:6px;font-weight:500}
    .tag.green{background:var(--green-soft);color:var(--green)}
    .tag.blue{background:var(--blue-soft);color:var(--blue)}
    .tag.orange{background:var(--orange-soft);color:var(--orange)}
    .role-lbl{font-size:12px;color:var(--muted2);letter-spacing:.4px;margin:15px 0 8px}
    .ports{display:flex;gap:8px;flex-wrap:wrap}
    .port{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;color:var(--text);
      border:1px solid var(--border);border-radius:8px;padding:5px 10px;background:#fafbfc}
    .duty{font-size:13.5px;color:var(--muted)}
    .perms{display:grid;grid-template-columns:1fr 1fr;gap:9px 14px}
    .perm{display:flex;align-items:flex-start;gap:7px;font-size:13px;color:var(--text)}
    .perm .ck{color:var(--green);font-weight:700;flex:none}

    /* Page link cards */
    .page-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(212px,1fr));gap:12px}
    .p-card{display:flex;flex-direction:column;gap:5px;background:var(--card);border:1px solid var(--border);
      border-radius:13px;padding:15px 16px;transition:.15s}
    .p-card:hover{border-color:var(--blue);transform:translateY(-2px);box-shadow:0 12px 24px -14px rgba(48,135,204,.6)}
    .p-card .t{font-weight:600;font-size:15px;color:var(--ink)}
    .p-card .f{color:var(--muted2);font-size:12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}

    .tip{max-width:1040px;margin:0 auto;background:var(--blue-soft);color:#245b86;font-size:12.5px;
      padding:11px 16px;border-radius:11px}
    .foot{color:var(--muted2);font-size:12px;text-align:center;padding:34px 0 54px}
    .foot code{background:#eceff2;padding:1px 6px;border-radius:5px}
    @media(max-width:560px){.hero h1{font-size:24px}.stats{gap:34px}.perms{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <div class="hero">
    <div class="hero-icon">工</div>
    <h1>学工信箱 · 原型页面导航</h1>
    <p class="sub">学生工作部「学工信箱」交互原型，覆盖学生来信、综合办分派、科室领导指定与审批、回复人拟稿与发送、学院副书记协同全流程。</p>
    <p class="emph">学生提交 → 综合办分给科室领导 → 科室领导指定回复人 → 回复人拟稿（可请学院副书记协同）→ 科室领导审批 → 回复人确认发送并选择公开范围。</p>
    <div class="badges">
      <span class="badge a">${drawIcon("doc")} 静态设计稿</span>
      <span class="badge b">${drawIcon("tags")} 共享 style.css · mobile.css</span>
    </div>
    <div class="stats">
      <div class="stat"><div class="n">${totalPages}</div><div class="l">HTML 页面</div></div>
      <div class="stat"><div class="n">2</div><div class="l">终端形态</div></div>
      <div class="stat"><div class="n">${ROLE_KEYS.length}</div><div class="l">演示身份</div></div>
      <div class="stat"><div class="n">${MOCK.sections.length}</div><div class="l">承办科室</div></div>
      <div class="stat"><div class="n">${MOCK.colleges.length}</div><div class="l">学院副书记</div></div>
    </div>
  </div>

  <div class="board">
    <div class="tip">这些页面为「设计稿快照」，已冻结交互（未加载 app.js / mobile.js）；顶栏 / 侧栏 / 底部导航已改写为可点击跳转，图表以占位框呈现，弹窗类状态暂未包含。</div>
    <div class="wrap">
      <section class="section">
        <div class="section-hd"><span class="ic">${drawIcon("sparkles")}</span><h2>演示入口</h2><span class="cnt">一键进入可交互的实时应用（非静态设计稿）</span></div>
        <div class="demo-grid">
          <a class="demo-card" href="app.html">
            <div class="demo-ic" style="background:linear-gradient(135deg,#4aa3db,#2b7ec4)">${drawIcon("dashboard")}</div>
            <div class="demo-tx"><h3>PC 端 · 桌面后台</h3><p>五种身份可在顶栏切换</p></div>
            <span class="demo-go">进入 ›</span>
          </a>
${ROLE_KEYS.map(k => `          <a class="demo-card" href="mobile.html?role=${k}">
            <div class="demo-ic" style="background:${roleCards[ROLE_KEYS.indexOf(k)].grad}">${drawIcon("phone")}</div>
            <div class="demo-tx"><h3>移动端 · ${ROLE_LABELS[k]}</h3><p>${roleCards[ROLE_KEYS.indexOf(k)].tag}</p></div>
            <span class="demo-go">进入 ›</span>
          </a>`).join("\n")}
        </div>
      </section>
      <section class="section">
        <div class="section-hd"><span class="ic">${drawIcon("users")}</span><h2>角色与权限</h2><span class="cnt">点击卡片进入对应视角首页</span></div>
        <div class="role-grid">
${roleCards.map(roleCardHtml).join("\n")}
        </div>
      </section>
${navGroups.map(navGroupHtml).join("\n")}
      <p class="foot">由 <code>tools/build-pages.js</code> 生成 · 共 ${totalPages} 个页面 · 重新生成：<code>node tools/build-pages.js</code></p>
    </div>
  </div>
</body>
</html>`;
fs.writeFileSync(path.join(OUT, "index.html"), indexHtml);

console.log(`✔ 自包含资源 → pages/assets/（css·js·vendor）+ pages/app.html + pages/mobile.html`);
console.log(`✔ 桌面端 ${built.desktop.length} 页 → pages/desktop/`);
console.log(`✔ 移动端 ${built.mobile.length} 页 → pages/mobile/`);
console.log(`✔ 索引 → pages/index.html`);
console.log(`合计 ${built.desktop.length + built.mobile.length} 个页面`);
