/* ============================================================
 * 学工信箱系统原型 —— 移动端应用
 * 复用 js/data.js（同一套 localStorage，与桌面端数据同步）
 * 顶部 AppBar + 底部 TabBar + 底部抽屉
 * ============================================================ */

/* 底部标签配置（按身份区分：学生 / 科室负责人 / 管理员） */
const M_TABS = {
  student: [
    { key: "home", label: "首页", ico: "home" },
    { key: "public", label: "公开", ico: "megaphone" },
    { key: "__fab" },
    { key: "my", label: "我的", ico: "mail" },
    { key: "more", label: "更多", ico: "menu" }
  ],
  section: [
    { key: "sec-home", label: "工作台", ico: "dashboard" },
    { key: "sec-inbox", label: "收件箱", ico: "inbox" },
    { key: "more", label: "更多", ico: "menu" }
  ],
  admin: [
    { key: "admin-home", label: "工作台", ico: "dashboard" },
    { key: "inbox", label: "收件箱", ico: "inbox" },
    { key: "supervise", label: "督办", ico: "clock" },
    { key: "admin-stats", label: "统计", ico: "trend" },
    { key: "more", label: "更多", ico: "menu" }
  ]
};

/* 页面标题 + 是否子页（子页显示返回、隐藏 TabBar 高亮） */
const M_ROUTES = {
  home: { title: "学工信箱", tab: "home" },
  public: { title: "公开信件", tab: "public" },
  my: { title: "我的信件", tab: "my" },
  more: { title: "更多", tab: "more" },
  write: { title: "我要写信", sub: true },
  "write-notice": { title: "写信须知", sub: true },
  query: { title: "信件查询", sub: true },
  policy: { title: "制度文件", sub: true },
  stats: { title: "数据统计", sub: true },
  dept: { title: "科室联系", sub: true },
  faq: { title: "常见问题", sub: true },
  "sec-home": { title: "科室工作台", tab: "sec-home" },
  "sec-inbox": { title: "科室收件箱", tab: "sec-inbox" },
  "admin-home": { title: "办理工作台", tab: "admin-home" },
  "inbox": { title: "信件收件箱", tab: "inbox" },
  "supervise": { title: "督办催办", tab: "supervise" },
  "admin-stats": { title: "统计分析", tab: "admin-stats" }
};

const MApp = {
  role: "student",
  section: "",
  mailbox: "学工信箱",
  route: "home",
  state: {},

  homeRoute() {
    return this.role === "admin" ? "admin-home" : (this.role === "section" ? "sec-home" : "home");
  },

  init() {
    /* 支持通过 URL 直达指定身份：mobile.html?role=admin&section=学生日常管理科 */
    const params = new URLSearchParams(location.search);
    const qRole = params.get("role");
    if (["student", "section", "admin"].includes(qRole)) saveRole(qRole);
    const qSec = params.get("section");
    if (qSec && MOCK.sections.some(s => s.name === qSec)) saveSection(qSec);
    this.role = getRole();
    this.section = getSection();
    this.mailbox = getMailbox();
    this.route = this.homeRoute();
    this.bindShell();
    this.startClock();
    this.render();
  },

  bindShell() {
    document.getElementById("m-fab").addEventListener("click", () => this.go("write-notice"));
    document.getElementById("m-back").addEventListener("click", () => this.back());
    document.getElementById("m-mailbox-btn").addEventListener("click", () => this.showMailboxSheet());
    document.getElementById("m-sheet-close").addEventListener("click", () => this.closeSheet());
    document.getElementById("m-sheet").addEventListener("click", (e) => {
      if (e.target.id === "m-sheet") this.closeSheet();
    });
  },

  startClock() {
    const el = document.getElementById("sb-time");
    const upd = () => { const d = new Date(); el.textContent = `${d.getHours()}:${pad(d.getMinutes())}`; };
    upd(); setInterval(upd, 30000);
  },

  /* 导航 */
  go(route) {
    const meta = M_ROUTES[route];
    if (!meta) return;
    if (meta.tab) this._lastTab = route;
    this.route = route;
    this.render();
    document.getElementById("m-content").scrollTop = 0;
  },
  back() {
    const meta = M_ROUTES[this.route];
    if (meta && meta.sub) this.go(this._lastTab || this.homeRoute());
  },

  toast(msg) {
    const t = document.getElementById("m-toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove("show"), 2000);
  },

  /* 抽屉 */
  showSheet(title, body) {
    document.getElementById("m-sheet-title").textContent = title;
    document.getElementById("m-sheet-body").innerHTML = body;
    document.getElementById("m-sheet").classList.add("show");
  },
  closeSheet() { document.getElementById("m-sheet").classList.remove("show"); },

  showMailboxSheet() {
    this.showSheet("选择信箱", `<div class="m-mailbox-list">
      ${MOCK.mailboxes.map(m => `<button data-mb="${m}" class="${m === this.mailbox ? "active" : ""}">${m}${m === this.mailbox ? " ✓" : ""}</button>`).join("")}
    </div>`);
    document.querySelectorAll("[data-mb]").forEach(b => b.addEventListener("click", () => {
      this.mailbox = b.dataset.mb; saveMailbox(this.mailbox); this.closeSheet(); this.render(); this.toast(`已切换至 ${this.mailbox}`);
    }));
  },

  /* 渲染 */
  render() {
    const meta = M_ROUTES[this.route] || { title: "学工信箱" };
    document.getElementById("m-title").textContent = meta.title;
    document.getElementById("m-back").classList.toggle("hidden", !meta.sub);
    document.getElementById("m-mailbox-btn").style.display = "none";
    const fab = document.getElementById("m-fab");
    if (fab) fab.style.display = this.role === "student" ? "" : "none";

    const map = {
      home: () => this.pHome(), public: () => this.pPublic(), my: () => this.pMy(), more: () => this.pMore(),
      write: () => this.pWrite(), "write-notice": () => this.pNotice(), query: () => this.pQuery(),
      policy: () => this.pPolicy(), stats: () => this.pStats(), dept: () => this.pDept(), faq: () => this.pFaq(),
      "sec-home": () => this.pSectionHome(), "sec-inbox": () => this.pSectionInbox(),
      "admin-home": () => this.pAdminHome(), "inbox": () => this.pInbox(),
      "supervise": () => this.pSupervise(), "admin-stats": () => this.pAnalytics()
    };
    document.getElementById("m-content").innerHTML = (map[this.route] || map[this.homeRoute()])();
    this.renderTabbar();
    if (this._after) { const f = this._after; this._after = null; f(); }
  },

  renderTabbar() {
    const bar = document.getElementById("m-tabbar");
    const activeTab = (M_ROUTES[this.route] || {}).tab;
    const tabs = M_TABS[this.role] || M_TABS.student;
    bar.innerHTML = tabs.map(t => {
      if (t.key === "__fab") return `<div class="m-tab spacer"></div>`;
      const badge = this.tabBadge(t.key);
      return `<button class="m-tab ${activeTab === t.key ? "active" : ""}" data-tab="${t.key}">
        <span class="m-tab-ico">${svgIcon(t.ico)}</span><span>${t.label}${badge ? ` (${badge})` : ""}</span></button>`;
    }).join("");
    bar.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => this.go(b.dataset.tab)));
  },

  tabBadge(key) {
    if (key === "my") return getMyLetters().filter(l => l.status !== "草稿" && l.mailbox === this.mailbox).length || "";
    if (key === "inbox") return filterLetters(getAllLetters(), { mailbox: this.mailbox }).filter(l => l.status === "办理中").length || "";
    if (key === "sec-inbox") return getSectionLetters(this.section).filter(l => l.status === "办理中").length || "";
    if (key === "supervise") return filterLetters(getAllLetters(), { mailbox: this.mailbox }).filter(l => isOverdue(l)).length || "";
    return "";
  },

  /* 工具 */
  statusBadge(s) { const c = statusColor(s); return `<span class="m-badge" style="background:${c}1a;color:${c}"><span class="dot" style="background:${c}"></span>${s}</span>`; },
  catBadge(cat) { const c = (MOCK.letterCategories.find(x => x.label === cat) || {}).color || "#9096A2"; return `<span class="m-badge" style="background:${c}1a;color:${c}">${cat}</span>`; },
  liExcerpt(l) { const e = contentExcerpt(l.content, 70); return e ? `<div class="m-li-excerpt">${escapeHtml(e)}</div>` : ""; },
  satisfaction(list) { const r = list.filter(l => l.rating); if (!r.length) return 100; return Math.round(r.filter(l => l.rating >= 4).length / r.length * 100); }
};

/* ============================================================
 * 学生端页面
 * ============================================================ */
Object.assign(MApp, {
  pHome() {
    const all = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const mine = getMyLetters().filter(l => l.status !== "草稿" && l.mailbox === this.mailbox);
    const done = all.filter(l => l.status === "已办结").length;
    const pub = all.filter(l => l.isPublic === "yes" && l.status === "已办结").slice(0, 3);
    const quick = [
      { k: "write-notice", ico: "write", t: "写信" },
      { k: "query", ico: "search", t: "查询" },
      { k: "my", ico: "mail", t: "我的" },
      { k: "public", ico: "megaphone", t: "公开" }
    ];
    this._after = () => {
      document.querySelectorAll("[data-go]").forEach(el => el.addEventListener("click", () => this.go(el.dataset.go)));
      document.querySelectorAll("[data-letter]").forEach(el => el.addEventListener("click", () => this.showLetterDetail(el.dataset.letter, "view")));
    };
    return `
    <div class="m-hero">
      <h2>倾听你的声音</h2>
      <p>反映问题 · 提出建议 · 接诉即办，件件有回音</p>
      <div class="m-hero-stats">
        <div class="m-hero-stat"><strong>${all.length}</strong><span>累计来信</span></div>
        <div class="m-hero-stat"><strong>${done}</strong><span>已办结</span></div>
        <div class="m-hero-stat"><strong>${this.satisfaction(all)}%</strong><span>满意度</span></div>
      </div>
    </div>
    <div class="m-quick">
      ${quick.map(q => `<div class="m-quick-item" data-go="${q.k}"><div class="m-quick-ico">${svgIcon(q.ico)}</div><span>${q.t}</span></div>`).join("")}
    </div>
    <div class="m-card">
      <div class="m-card-title">最新公开信件 <span class="more" data-go="public">更多 ›</span></div>
      ${pub.length ? pub.map(l => `<div class="m-list-item" data-letter="${l.id}" style="margin-bottom:8px">
        <div class="m-li-title">${escapeHtml(l.title)}</div>
        ${this.liExcerpt(l)}
        <div class="m-li-meta"><span class="m-dept">${l.dept}</span> · <span>${l.date}</span></div>
      </div>`).join("") : `<div class="m-empty" style="padding:20px 0"><span class="ico">${svgIcon("megaphone")}</span>暂无公开信件</div>`}
    </div>
    <p class="m-topnote">当前为移动端原型 · <a href="index.html">切换到桌面端</a></p>`;
  },

  /* 写信须知 */
  pNotice() {
    this._after = () => {
      const btn = document.getElementById("m-notice-btn");
      let n = 6; btn.disabled = true;
      const timer = setInterval(() => { n--; if (n <= 0) { clearInterval(timer); btn.disabled = false; btn.textContent = "我已阅读，开始写信"; } else btn.textContent = `请阅读须知（${n}s）`; }, 1000);
      btn.textContent = `请阅读须知（${n}s）`;
      btn.addEventListener("click", () => { if (!btn.disabled) this.go("write"); });
    };
    const s = MOCK.acceptScope;
    return `
    <div class="m-card m-notice">
      <p style="font-size:13.5px">为使来信得到及时办理与明确答复，请先阅读以下须知：</p>
      <ol>
        <li>遵守法律法规与公德，如实反映、文明表达。</li>
        <li>遵循「一事一信」，标题简明、内容实事求是。</li>
        <li>建议使用真实信息以便核实回访；不愿公开可选「不公开」。</li>
        <li>同一事项办结后请勿以相同理由重复提交。</li>
      </ol>
      <div class="m-scope accept"><h5>✓ 受理范围</h5><ul>${s.accept.map(i => `<li>${i}</li>`).join("")}</ul></div>
      <div class="m-scope reject"><h5>✕ 不予受理</h5><ul>${s.reject.map(i => `<li>${i}</li>`).join("")}</ul></div>
    </div>
    <button class="m-btn m-btn-primary" id="m-notice-btn">请阅读须知</button>`;
  },

  /* 写信 */
  pWrite() {
    const u = MOCK.user;
    const draft = getDraft(this.mailbox) || {};
    const sel = (f, v) => draft[f] === v ? "selected" : "";
    this._after = () => this.bindWrite();
    return `
    <form id="m-write-form">
      <div class="m-field-2">
        <div class="m-field"><label class="req">姓名</label><input name="name" value="${escapeHtml(draft.name || u.name)}"></div>
        <div class="m-field"><label class="req">证件信息</label><input name="idInfo" value="${escapeHtml(draft.idInfo || u.id)}"></div>
      </div>
      <div class="m-field-2">
        <div class="m-field"><label class="req">联系电话</label><input name="phone" value="${escapeHtml(draft.phone || u.phone)}"></div>
        <div class="m-field"><label class="req">联系邮箱</label><input name="email" value="${escapeHtml(draft.email || u.email)}"></div>
      </div>
      <div class="m-field"><label class="req">所在单位</label><input name="unit" value="${escapeHtml(draft.unit || u.college)}"></div>
      <div class="m-field"><label class="req">来信标题</label><input name="title" id="mw-title" value="${escapeHtml(draft.title || "")}" placeholder="简要概括诉求" maxlength="80"></div>
      <div class="m-field-2">
        <div class="m-field"><label class="req">信件分类</label>
          <select name="category"><option value="">请选择</option>${MOCK.letterCategories.map(c => `<option ${sel("category", c.label)}>${c.label}</option>`).join("")}</select></div>
        <div class="m-field"><label class="req">事务分类</label>
          <select name="affair" id="mw-affair"><option value="">请选择</option>${MOCK.affairCategories.map(a => `<option ${sel("affair", a)}>${a}</option>`).join("")}</select></div>
      </div>
      <div class="m-hint" id="mw-dept"></div>
      <div class="m-field">
        <div class="m-rt-label"><label class="req" style="margin:0">信件内容</label><button type="button" class="m-ai-btn" id="mw-ai">${svgIcon("sparkles")} AI 润色</button></div>
        <textarea id="mw-content" rows="6" maxlength="2000" placeholder="请详细描述事件经过与诉求（不少于10字）">${escapeHtml(draft.content || "")}</textarea>
        <div class="m-char"><span id="mw-count">0</span> / 2000</div>
      </div>
      <div class="m-field"><label>附件材料</label>
        <div class="m-upload" id="mw-upload"><div class="uz-inner">${svgIcon("paperclip")} 点击或拖拽上传附件（照片 / 文档，可选）</div></div>
        <input type="file" id="mw-upload-input" multiple hidden>
        <div class="up-list" id="mw-upload-list"></div>
      </div>
      <div class="m-field"><label class="req">能否公开</label>
        <div class="m-radio">
          <label><input type="radio" name="isPublic" value="yes" ${draft.isPublic !== "no" ? "checked" : ""}><span>可公开</span></label>
          <label><input type="radio" name="isPublic" value="no" ${draft.isPublic === "no" ? "checked" : ""}><span>不公开</span></label>
        </div>
      </div>
      <div class="m-hint warn" id="mw-dup"></div>
      <div class="m-btn-row" style="margin-top:8px">
        <button type="button" class="m-btn m-btn-outline" id="mw-draft">存草稿</button>
        <button type="submit" class="m-btn m-btn-primary">提交信件</button>
      </div>
    </form>`;
  },

  bindWrite() {
    const form = document.getElementById("m-write-form");
    const content = document.getElementById("mw-content");
    const count = document.getElementById("mw-count");
    const affair = document.getElementById("mw-affair");
    const deptHint = document.getElementById("mw-dept");
    const dupHint = document.getElementById("mw-dup");

    const upd = () => { const n = content.value.length; count.textContent = n; if (n >= 2000) this.toast("内容已达 2000 字上限"); };
    const updDept = () => { const d = MOCK.affairToSection[affair.value]; deptHint.textContent = d ? `将归口至：${d}` : ""; };
    upd(); updDept();
    content.addEventListener("input", upd);
    affair.addEventListener("change", updDept);

    document.getElementById("mw-ai").addEventListener("click", () => {
      const raw = content.value.trim();
      if (raw.length < 6) { this.toast("请先输入一些内容再润色"); return; }
      this.aiPolishFlow(raw, form.category.value, form.affair.value, text => { content.value = text; upd(); });
    });
    const uploader = makeUploader(
      document.getElementById("mw-upload"),
      document.getElementById("mw-upload-input"),
      document.getElementById("mw-upload-list"),
      (a) => this.showAttachmentPreview(a)
    );
    uploader.seed((getDraft(this.mailbox) || {}).attachments || []);

    const collect = () => {
      const o = Object.fromEntries(new FormData(form).entries());
      o.content = content.value.trim();
      o.attachments = uploader.getMeta(); return o;
    };
    document.getElementById("mw-draft").addEventListener("click", () => {
      const o = collect(); const ex = getDraft(this.mailbox);
      const letter = Object.assign(ex || { id: genLetterId(), owner: "me", mailbox: this.mailbox, createdAt: new Date().toISOString(), date: formatDate(new Date()) }, o, { status: "草稿" });
      upsertLetter(letter); this.toast("已保存为草稿"); this.go("my");
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const o = collect();
      if (!o.name || !o.title || !o.category || !o.affair || !o.content) { this.toast("请填写所有必填项"); return; }
      if (o.content.length < 10) { this.toast("信件内容不少于10字"); return; }
      if (getMyLetters().some(l => l.status !== "草稿" && l.mailbox === this.mailbox && l.title === o.title)) { dupHint.textContent = "⚠ 已提交过同标题信件，请勿重复提交"; return; }
      const now = new Date(); const ex = getDraft(this.mailbox);
      const letter = Object.assign(ex || { id: genLetterId(), owner: "me" }, o, {
        mailbox: this.mailbox, status: "办理中", dept: MOCK.affairToSection[o.affair] || "综合办公室",
        createdAt: now.toISOString(), date: formatDate(now), deadline: calcDeadline(now), urged: false, reopened: false, reply: null, rating: null
      });
      upsertLetter(letter); this.toast(`提交成功！编号 ${letter.id}`); this.go("my");
    });
  },

  /* AI 润色 */
  aiPolishFlow(raw, category, affair, apply) {
    this.showSheet("AI 润色", `<div class="m-ai-loading"><div class="m-ai-spinner"></div><p>AI 正在梳理表达、优化结构…</p></div>`);
    setTimeout(() => {
      const polished = this.aiPolish(raw, category, affair);
      const body = document.getElementById("m-sheet-body");
      if (!body) return;
      body.innerHTML = `
        <div class="m-ai-block"><div class="t">润色前</div><div class="m-ai-text">${escapeHtml(raw)}</div></div>
        <div class="m-ai-block"><div class="t">润色后</div><div class="m-ai-text" style="white-space:pre-wrap">${escapeHtml(polished)}</div></div>
        <div class="m-sheet-actions">
          <button class="m-btn m-btn-primary" id="mai-apply">应用润色结果</button>
          <div class="m-btn-row">
            <button class="m-btn m-btn-outline" id="mai-regen">换一版</button>
            <button class="m-btn m-btn-outline" id="mai-cancel">保留原文</button>
          </div>
        </div>`;
      document.getElementById("mai-apply").addEventListener("click", () => { apply(polished); this.closeSheet(); this.toast("已应用 AI 润色结果"); });
      document.getElementById("mai-regen").addEventListener("click", () => this.aiPolishFlow(raw, category, affair, apply));
      document.getElementById("mai-cancel").addEventListener("click", () => this.closeSheet());
    }, 850);
  },

  aiPolish(raw, category, affair) {
    const clean = raw.replace(/\s+/g, " ").trim();
    const sentences = clean.split(/(?<=[。；;!！?？])/).map(s => s.trim()).filter(Boolean);
    const lead = affair ? `我想就「${affair}」相关事项反映如下情况：` : "我想反映如下情况：";
    const bodyText = (sentences.length > 1 ? sentences : [clean]).map((s, i) => `${i + 1}. ${s}`).join("\n");
    const closing = {
      "建议类": "以上为我的建议，恳请学校相关部门予以考虑。",
      "问题类": "上述问题已影响我的学习生活，恳请尽快核实处理。",
      "咨询类": "以上为我的疑问，烦请老师方便时解答，谢谢。",
      "感谢类": "谨向相关老师和部门致以诚挚感谢！",
      "投诉类": "恳请学校重视并认真核查，及时给予答复。"
    }[category] || "恳请相关部门予以关注与处理，感谢！";
    return `尊敬的老师：\n\n您好！${lead}\n${bodyText}\n\n${closing}\n\n此致\n敬礼！`;
  },

  /* 我的信件 */
  pMy() {
    const tab = this.state.myTab || "全部";
    let list = getMyLetters().filter(l => l.mailbox === this.mailbox);
    const counts = { "全部": list.filter(l => l.status !== "草稿").length, "办理中": 0, "已办结": 0, "草稿": list.filter(l => l.status === "草稿").length };
    ["办理中", "已办结"].forEach(s => counts[s] = list.filter(l => l.status === s).length);
    list = tab === "全部" ? list.filter(l => l.status !== "草稿") : list.filter(l => l.status === tab);
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    this._after = () => {
      document.querySelectorAll("[data-seg]").forEach(s => s.addEventListener("click", () => { this.state.myTab = s.dataset.seg; this.render(); }));
      document.querySelectorAll("[data-letter]").forEach(el => el.addEventListener("click", () => this.showLetterDetail(el.dataset.letter, "student")));
    };
    const tabs = ["全部", "办理中", "已办结", "草稿"];
    return `
    <div class="m-segtabs">${tabs.map(t => `<button class="m-seg ${tab === t ? "active" : ""}" data-seg="${t}">${t} ${counts[t]}</button>`).join("")}</div>
    ${list.length ? list.map(l => this.letterListItem(l)).join("") : `<div class="m-empty"><span class="ico">${svgIcon("inbox")}</span>暂无信件，点击下方 ＋ 写信</div>`}`;
  },

  letterListItem(l) {
    return `<div class="m-list-item" data-letter="${l.id}">
      <div class="m-li-top"><div class="m-li-title">${escapeHtml(l.title || "（未填写标题）")}</div>${this.statusBadge(l.status)}</div>
      ${this.liExcerpt(l)}
      <div class="m-li-meta">${this.catBadge(l.category)} <span class="mono">${l.id}</span>
        ${l.urged ? '<span class="m-tag warn">已催办</span>' : ""}${isOverdue(l) ? '<span class="m-tag overdue">超期</span>' : ""}</div>
    </div>`;
  },

  /* 公开信件 */
  pPublic() {
    const kw = this.state.pubKw || "";
    let list = getAllLetters().filter(l => l.mailbox === this.mailbox && l.isPublic === "yes" && l.status === "已办结");
    if (kw) list = list.filter(l => (l.title + l.dept).includes(kw));
    list.sort((a, b) => b.date.localeCompare(a.date));
    this._after = () => {
      const inp = document.getElementById("m-pub-search");
      if (inp) inp.addEventListener("input", () => { this.state.pubKw = inp.value.trim(); clearTimeout(this._ps); this._ps = setTimeout(() => this.render(), 250); });
      document.querySelectorAll("[data-letter]").forEach(el => el.addEventListener("click", () => this.showLetterDetail(el.dataset.letter, "view")));
    };
    return `
    <div class="m-search"><input id="m-pub-search" placeholder="搜索标题 / 答复科室" value="${escapeHtml(kw)}"></div>
    ${list.length ? list.map(l => `<div class="m-list-item" data-letter="${l.id}">
      <div class="m-li-title">${escapeHtml(l.title)}</div>
      ${this.liExcerpt(l)}
      <div class="m-li-meta">${this.catBadge(l.category)} <span class="m-dept">${l.dept}</span> · ${l.date}</div>
    </div>`).join("") : `<div class="m-empty"><span class="ico">${svgIcon("megaphone")}</span>暂无公开信件</div>`}`;
  },

  /* 信件查询（编号快速查询 + 多条件查询） */
  pQuery() {
    const recent = getAllLetters().slice(0, 4);
    const f = this.state.queryFilter || {};
    const hasCond = Object.keys(f).some(k => f[k]);
    const results = filterLetters(getAllLetters(), Object.assign({ mailbox: this.mailbox }, f))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const sel = (name, v) => f[name] === v ? "selected" : "";
    this._after = () => {
      const run = () => {
        const id = document.getElementById("m-q-input").value.trim();
        const l = getLetterById(id);
        const box = document.getElementById("m-q-result");
        if (!id) { box.innerHTML = `<div class="m-no-reply">请输入信件编号</div>`; return; }
        if (!l || l.status === "草稿") { box.innerHTML = `<div class="m-no-reply">未查询到编号 ${escapeHtml(id)} 的信件</div>`; return; }
        box.innerHTML = this.letterDetailBody(l, "view");
        this.bindStars(l);
      };
      document.getElementById("m-q-btn").addEventListener("click", run);
      document.querySelectorAll("[data-fill]").forEach(t => t.addEventListener("click", () => { document.getElementById("m-q-input").value = t.dataset.fill; run(); }));
      const apply = document.getElementById("m-q-search");
      if (apply) apply.addEventListener("click", () => {
        const o = {};
        const title = document.getElementById("m-q-title").value.trim();
        const category = document.getElementById("m-q-cat").value;
        const status = document.getElementById("m-q-status").value;
        if (title) o.title = title;
        if (category) o.category = category;
        if (status) o.status = status;
        this.state.queryFilter = o; this.render();
      });
      const reset = document.getElementById("m-q-reset");
      if (reset) reset.addEventListener("click", () => { this.state.queryFilter = {}; this.render(); });
      document.querySelectorAll("[data-letter]").forEach(el => el.addEventListener("click", () => this.showLetterDetail(el.dataset.letter, "view")));
    };
    return `
    <div class="m-search"><input id="m-q-input" placeholder="输入信件编号，如 XG20260612118"><button class="m-btn m-btn-primary m-btn-sm" id="m-q-btn">查询</button></div>
    <div style="margin-bottom:14px">${recent.map(l => `<span class="m-chip" data-fill="${l.id}" style="display:inline-block;margin:0 6px 6px 0">${l.id}</span>`).join("")}</div>
    <div id="m-q-result"><div class="m-no-reply">输入编号后查询办理进度与答复</div></div>

    <div class="m-section-title" style="margin-top:18px">多条件查询</div>
    <div class="m-field"><label>信件标题</label><input id="m-q-title" value="${escapeHtml(f.title || "")}" placeholder="输入标题关键字"></div>
    <div class="m-field-2">
      <div class="m-field"><label>信件分类</label>
        <select id="m-q-cat"><option value="">全部</option>${MOCK.letterCategories.map(c => `<option ${sel("category", c.label)}>${c.label}</option>`).join("")}</select></div>
      <div class="m-field"><label>办理状态</label>
        <select id="m-q-status"><option value="">全部</option>${["办理中", "已办结"].map(s => `<option ${sel("status", s)}>${s}</option>`).join("")}</select></div>
    </div>
    <div class="m-btn-row" style="margin-bottom:16px">
      <button class="m-btn m-btn-outline" id="m-q-reset">重置</button>
      <button class="m-btn m-btn-primary" id="m-q-search">搜索</button>
    </div>
    <div class="m-section-title">查询结果 · ${hasCond ? `共 ${results.length} 封` : "最近来信"}</div>
    ${results.length ? results.slice(0, 20).map(l => this.letterListItem(l)).join("") : `<div class="m-empty"><span class="ico">${svgIcon("search")}</span>未找到符合条件的信件</div>`}`;
  },

  /* 制度文件 */
  pPolicy() {
    const kw = this.state.polKw || "";
    let list = MOCK.policies.slice();
    if (kw) list = list.filter(p => p.title.includes(kw) || p.code.includes(kw));
    this._after = () => {
      const inp = document.getElementById("m-pol-search");
      if (inp) inp.addEventListener("input", () => { this.state.polKw = inp.value.trim(); clearTimeout(this._pos); this._pos = setTimeout(() => this.render(), 250); });
      document.querySelectorAll("[data-policy]").forEach(el => el.addEventListener("click", () => this.showPolicyDetail(el.dataset.policy)));
    };
    return `
    <div class="m-search"><input id="m-pol-search" placeholder="搜索文件标题 / 文号" value="${escapeHtml(kw)}"></div>
    ${list.length ? list.map(p => `<div class="m-list-item" data-policy="${escapeHtml(p.code)}">
      <div class="m-li-title">${escapeHtml(p.title)}</div>
      <div class="m-li-meta"><span class="mono">${p.code}</span> <span class="m-tag">${p.cat}</span>
        <span class="m-badge" style="background:${p.status === "现行有效" ? "#1BB9751a;color:#1BB975" : "#9096A21a;color:#9096A2"}">${p.status}</span> · ${p.date}</div>
    </div>`).join("") : `<div class="m-empty"><span class="ico">${svgIcon("doc")}</span>未找到相关文件</div>`}`;
  },

  showPolicyDetail(code) {
    const p = MOCK.policies.find(x => x.code === code);
    if (!p) return;
    this.showSheet("制度文件详情", this.policyDetailBody(p));
    this.bindAttachments(() => this.showPolicyDetail(code));
  },

  bindAttachments(onBack) {
    document.querySelectorAll("[data-att-name]").forEach(el =>
      el.addEventListener("click", () => this.showAttachmentPreview({ name: el.dataset.attName, size: +el.dataset.attSize || 0, type: el.dataset.attType || "" }, onBack)));
  },

  showAttachmentPreview(att, onBack) {
    const name = attachName(att);
    const label = fileTypeLabel(att);
    const size = formatFileSize(attachSize(att));
    const img = isImageAttach(att) && att && att.url;
    const media = img
      ? `<img src="${att.url}" alt="${escapeHtml(name)}" style="display:block;max-width:100%;max-height:340px;margin:0 auto;border-radius:10px">`
      : `<div style="text-align:center"><div style="font-size:46px;color:var(--primary);line-height:1">${svgIcon(fileIcon(att))}</div></div>`;
    this.showSheet("附件预览", `
      <div style="padding:6px 0 2px">${media}</div>
      <div style="text-align:center;margin-top:10px">
        <div class="m-detail-title">${escapeHtml(name)}</div>
        <div style="margin-top:6px"><span class="m-tag">${label}</span>${size ? ` <span class="m-tag">${size}</span>` : ""}</div>
      </div>
      ${img ? "" : `<div class="m-no-reply" style="margin-top:10px">原型演示：附件预览 —— 实际系统将在此加载并在线预览文件内容。</div>`}
      <div class="m-sheet-actions"><div class="m-btn-row">
        <button class="m-btn m-btn-outline" id="m-att-back">‹ 返回</button>
        <button class="m-btn m-btn-primary" id="m-att-dl">下载附件</button>
      </div></div>`);
    const back = document.getElementById("m-att-back");
    if (back) back.addEventListener("click", () => { if (onBack) onBack(); else this.closeSheet(); });
    const dl = document.getElementById("m-att-dl");
    if (dl) dl.addEventListener("click", () => this.toast("原型演示：文件下载暂未开放"));
  },

  /* 制度文件详情内容（供抽屉与页面生成器复用） */
  policyDetailBody(p) {
    const effective = p.status === "现行有效";
    const badge = `<span class="m-badge" style="background:${effective ? "#1BB9751a;color:#1BB975" : "#9096A21a;color:#9096A2"}">${p.status}</span>`;
    const attachments = p.attachments || [];
    return `
    <div class="m-detail-title">${escapeHtml(p.title)}</div>
    <div class="m-detail-meta"><span class="mono">${escapeHtml(p.code)}</span> · ${escapeHtml(p.date)} ${badge}</div>
    <div class="m-detail-tags"><span class="m-tag">${escapeHtml(p.cat)}</span> <span class="m-tag">文号：${escapeHtml(p.code)}</span></div>
    <div class="m-sec"><div class="m-sec-t">文件信息</div>
      <div class="m-content-box">
        <p>类别：${escapeHtml(p.cat)}</p>
        <p>效力状态：${escapeHtml(p.status)}</p>
        <p>发布日期：${escapeHtml(p.date)}</p>
      </div>
    </div>
    <div class="m-sec"><div class="m-sec-t">文件正文</div>
      <div class="m-content-box">${p.body ? contentHtml(p.body) : policySummary(p)}</div>
    </div>
    ${attachments.length ? `<div class="m-sec"><div class="m-sec-t">相关附件</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">${attachChipsHtml(attachments, "m-tag")}</div>
      <p class="m-hint" style="color:var(--text-muted)">点击附件可预览</p>
    </div>` : ""}`;
  },

  /* 数据统计 */
  pStats() {
    const all = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const byCat = MOCK.letterCategories.map(c => ({ label: c.label, color: c.color, value: all.filter(l => l.category === c.label).length })).filter(x => x.value);
    const byDept = {}; all.forEach(l => byDept[l.dept] = (byDept[l.dept] || 0) + 1);
    const deptRows = Object.entries(byDept).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxDept = Math.max(...deptRows.map(r => r[1]), 1);
    const done = all.filter(l => l.status === "已办结").length;
    this._after = () => this.drawDonut("m-donut", byCat);
    return `
    <div class="m-stat-grid">
      ${this.miniStat("累计来信", all.length, this.mailbox, "#3087CC")}
      ${this.miniStat("已办结", done, `办结率 ${all.length ? Math.round(done / all.length * 100) : 0}%`, "#1BB975")}
      ${this.miniStat("平均时长", "3.6", "工作日", "#3087CC")}
      ${this.miniStat("满意度", this.satisfaction(all) + "%", "好评占比", "#F29100")}
    </div>
    <div class="m-card">
      <div class="m-card-title">来信分类分布</div>
      <div class="m-chart-wrap"><canvas id="m-donut" width="150" height="150"></canvas></div>
      <div class="m-chart-legend">${byCat.map(c => `<div class="m-lg"><span class="d" style="background:${c.color}"></span>${c.label}<span class="v">${c.value}</span></div>`).join("")}</div>
    </div>
    <div class="m-card">
      <div class="m-card-title">各科室来信量 Top6</div>
      ${deptRows.map(([d, v]) => `<div class="m-bar-row"><span class="lbl">${d.replace(/（.*）/, "")}</span><span class="m-bar-track"><span class="m-bar-fill" style="width:${v / maxDept * 100}%"></span></span><span class="val">${v}</span></div>`).join("")}
    </div>`;
  },

  miniStat(label, val, sub, color) {
    return `<div class="m-stat" style="--acc:${color}"><div class="m-stat-label">${label}</div><div class="m-stat-val" style="color:${color}">${val}</div><div class="m-stat-sub">${sub}</div></div>`;
  },

  /* 科室联系 */
  pDept() {
    return MOCK.sections.map(d => `<div class="m-dept">
      <h4>${d.name}</h4>
      <div class="hd">负责人：${escapeHtml(d.head)}</div>
      <div class="ph">${svgIcon("phone")} ${d.phone}</div>
      <div class="ph">${svgIcon("mail")} ${escapeHtml(d.email || "-")}</div>
      <div class="du">${d.duty}</div>
      <div>${d.affairs.map(a => `<span class="m-tag">${a}</span>`).join("")}</div>
    </div>`).join("");
  },

  /* FAQ（读取配置：仅启用项，按 order） */
  pFaq() {
    const faqs = faqsForDisplay();
    return `<div class="m-card">${faqs.length ? faqs.map(f => `<details class="m-faq"><summary>${escapeHtml(f.q)}</summary><div class="a">${escapeHtml(f.a)}</div></details>`).join("") : '<div class="m-no-reply">暂无常见问题</div>'}</div>`;
  },

  /* 更多（含身份切换器 + 科室选择器） */
  pMore() {
    const moreItems = {
      student: [
        { k: "query", ico: "search", t: "信件查询" }, { k: "policy", ico: "doc", t: "制度文件" },
        { k: "stats", ico: "chart", t: "数据统计" }, { k: "dept", ico: "phone", t: "科室联系" },
        { k: "faq", ico: "help", t: "常见问题" }
      ],
      section: [
        { k: "public", ico: "megaphone", t: "公开信件" }, { k: "policy", ico: "doc", t: "制度文件" },
        { k: "dept", ico: "phone", t: "科室联系" }, { k: "faq", ico: "help", t: "常见问题" }
      ],
      admin: [
        { k: "public", ico: "megaphone", t: "公开信件" }, { k: "policy", ico: "doc", t: "制度文件" },
        { k: "dept", ico: "phone", t: "科室联系" }, { k: "faq", ico: "help", t: "常见问题" }
      ]
    }[this.role] || [];
    let user;
    if (this.role === "admin") user = { avatar: MOCK.admin.avatar, nm: MOCK.admin.name, sb: MOCK.admin.role };
    else if (this.role === "section") { const s = MOCK.sections.find(x => x.name === this.section) || MOCK.sections[0]; user = { avatar: (s.head || "").charAt(0), nm: s.head, sb: s.name + " · 负责人" }; }
    else user = { avatar: MOCK.user.avatar, nm: MOCK.user.name, sb: MOCK.user.college };
    const roles = [["student", "学生"], ["section", "科室负责人"], ["admin", "管理员"]];

    this._after = () => {
      document.querySelectorAll("[data-more]").forEach(el => el.addEventListener("click", () => this.go(el.dataset.more)));
      document.querySelectorAll("[data-role]").forEach(b => b.addEventListener("click", () => {
        this.role = b.dataset.role; saveRole(this.role); this.go(this.homeRoute());
      }));
      document.querySelectorAll("[data-sec]").forEach(b => b.addEventListener("click", () => {
        this.section = b.dataset.sec; saveSection(this.section); this.render(); this.toast(`已切换至 ${this.section}`);
      }));
    };
    return `
    <div class="m-more-user">
      <div class="m-more-avatar">${user.avatar}</div>
      <div><div class="nm">${escapeHtml(user.nm)}</div><div class="sb">${escapeHtml(user.sb)}</div></div>
    </div>
    <div class="m-section-title">切换身份（演示）</div>
    <div class="m-role-switch">
      ${roles.map(([k, t]) => `<button class="m-role-chip ${this.role === k ? "active" : ""}" data-role="${k}">${t}</button>`).join("")}
    </div>
    ${this.role === "section" ? `
    <div class="m-section-title">选择科室</div>
    <div class="m-role-secs">
      ${MOCK.sections.map(s => `<button class="m-chip ${this.section === s.name ? "active" : ""}" data-sec="${escapeHtml(s.name)}">${s.name}</button>`).join("")}
    </div>` : ""}
    <div class="m-section-title">更多功能</div>
    <div class="m-more-grid">
      ${moreItems.map(i => `<div class="m-more-item" data-more="${i.k}"><div class="ic">${svgIcon(i.ico)}</div><span>${i.t}</span></div>`).join("")}
    </div>
    <p class="m-topnote" style="color:var(--text-muted)">学工信箱移动端原型 · <a href="index.html" style="color:var(--primary)">前往桌面端</a></p>`;
  },

  /* ============================================================
   * 移动端办理端（科室负责人 / 管理员）
   * ============================================================ */
  handleListItem(l) {
    return `<div class="m-list-item" data-handle="${l.id}">
      <div class="m-li-top"><div class="m-li-title">${escapeHtml(l.title)}</div>${this.statusBadge(l.status)}</div>
      ${this.liExcerpt(l)}
      <div class="m-li-meta">${this.catBadge(l.category)} <span class="mono">${l.id}</span> <span class="m-dept">${l.dept}</span> · ${l.date}
        ${l.urged ? '<span class="m-tag warn">催办</span>' : ""}${isOverdue(l) ? '<span class="m-tag overdue">超期</span>' : ""}</div>
    </div>`;
  },

  handleDonutLegend(doing, done) {
    return `<div class="m-chart-legend">
      <div class="m-lg"><span class="d" style="background:#3087CC"></span>办理中<span class="v">${doing}</span></div>
      <div class="m-lg"><span class="d" style="background:#1BB975"></span>已办结<span class="v">${done}</span></div>
    </div>`;
  },

  /* 科室工作台（mirror renderSectionHome） */
  pSectionHome() {
    const sec = this.section;
    const list = getSectionLetters(sec);
    const doing = list.filter(l => l.status === "办理中").length;
    const done = list.filter(l => l.status === "已办结").length;
    const overdue = list.filter(l => isOverdue(l)).length;
    const todo = list.filter(l => l.status === "办理中").sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));
    const secObj = MOCK.sections.find(s => s.name === sec) || {};
    this._after = () => {
      this.drawDonut("m-sec-donut", [{ label: "办理中", value: doing, color: "#3087CC" }, { label: "已办结", value: done, color: "#1BB975" }].filter(x => x.value));
      document.querySelectorAll("[data-handle]").forEach(el => el.addEventListener("click", () => this.showHandleSheet(el.dataset.handle)));
    };
    return `
    <div class="m-work-hero">
      <h2>${escapeHtml(sec)} · 工作台</h2>
      <p>负责人 ${escapeHtml(secObj.head || "")} ｜ 仅可办理归口本科室的信件</p>
    </div>
    <div class="m-stat-grid">
      ${this.miniStat("本科室累计", list.length, "承接总量", "#006DAD")}
      ${this.miniStat("办理中", doing, "正在处理", "#3087CC")}
      ${this.miniStat("已办结", done, "本科室累计", "#1BB975")}
      ${this.miniStat("超期", overdue, "需尽快办结", "#DF2027")}
    </div>
    <div class="m-card">
      <div class="m-card-title">本科室待办</div>
      ${todo.length ? todo.slice(0, 8).map(l => this.handleListItem(l)).join("") : `<div class="m-empty" style="padding:18px 0"><span class="ico">${svgIcon("inbox")}</span>本科室暂无待办信件</div>`}
    </div>
    <div class="m-card">
      <div class="m-card-title">本科室办理情况</div>
      <div class="m-chart-wrap"><canvas id="m-sec-donut" width="150" height="150"></canvas></div>
      ${this.handleDonutLegend(doing, done)}
    </div>`;
  },

  /* 科室收件箱（mirror renderSectionInbox） */
  pSectionInbox() {
    const sec = this.section;
    const tab = this.state.secTab || "全部";
    const kw = this.state.secKw || "";
    let list = getSectionLetters(sec);
    const counts = { "全部": list.length, "办理中": list.filter(l => l.status === "办理中").length, "已办结": list.filter(l => l.status === "已办结").length };
    if (tab !== "全部") list = list.filter(l => l.status === tab);
    if (kw) list = list.filter(l => (l.title + l.name + l.id).includes(kw));
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    this._after = () => {
      const inp = document.getElementById("m-sec-search");
      if (inp) inp.addEventListener("input", () => { this.state.secKw = inp.value.trim(); clearTimeout(this._ss); this._ss = setTimeout(() => this.render(), 250); });
      document.querySelectorAll("[data-seg]").forEach(s => s.addEventListener("click", () => { this.state.secTab = s.dataset.seg; this.render(); }));
      document.querySelectorAll("[data-handle]").forEach(el => el.addEventListener("click", () => this.showHandleSheet(el.dataset.handle)));
    };
    return `
    <p class="m-section-title">${escapeHtml(sec)} · 归口本科室的信件</p>
    <div class="m-search"><input id="m-sec-search" placeholder="搜索标题 / 来信人 / 编号" value="${escapeHtml(kw)}"></div>
    <div class="m-segtabs">${["全部", "办理中", "已办结"].map(t => `<button class="m-seg ${tab === t ? "active" : ""}" data-seg="${t}">${t} ${counts[t]}</button>`).join("")}</div>
    ${list.length ? list.map(l => this.handleListItem(l)).join("") : `<div class="m-empty"><span class="ico">${svgIcon("inbox")}</span>本科室暂无信件</div>`}`;
  },

  /* 办理工作台（mirror renderAdminHome） */
  pAdminHome() {
    const all = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const doing = all.filter(l => l.status === "办理中").length;
    const done = all.filter(l => l.status === "已办结").length;
    const overdue = all.filter(l => isOverdue(l)).length;
    const todo = all.filter(l => l.status === "办理中").sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));
    this._after = () => {
      this.drawDonut("m-admin-donut", [{ label: "办理中", value: doing, color: "#3087CC" }, { label: "已办结", value: done, color: "#1BB975" }].filter(x => x.value));
      document.querySelectorAll("[data-handle]").forEach(el => el.addEventListener("click", () => this.showHandleSheet(el.dataset.handle)));
    };
    return `
    <div class="m-work-hero">
      <h2>办理工作台</h2>
      <p>${escapeHtml(MOCK.admin.name)} ｜ 来信按事务自动归口，管理员统筹转办与督办</p>
    </div>
    <div class="m-stat-grid">
      ${this.miniStat("累计来信", all.length, this.mailbox, "#006DAD")}
      ${this.miniStat("办理中", doing, "正在处理", "#3087CC")}
      ${this.miniStat("已办结", done, "本周期", "#1BB975")}
      ${this.miniStat("超期预警", overdue, "需督办", "#DF2027")}
    </div>
    <div class="m-card">
      <div class="m-card-title">我的待办</div>
      ${todo.length ? todo.slice(0, 8).map(l => this.handleListItem(l)).join("") : `<div class="m-empty" style="padding:18px 0"><span class="ico">${svgIcon("inbox")}</span>暂无待办信件</div>`}
    </div>
    <div class="m-card">
      <div class="m-card-title">办理情况概览</div>
      <div class="m-chart-wrap"><canvas id="m-admin-donut" width="150" height="150"></canvas></div>
      ${this.handleDonutLegend(doing, done)}
    </div>`;
  },

  /* 信件收件箱（全部，mirror renderInbox） */
  pInbox() {
    const tab = this.state.inboxTab || "全部";
    const kw = this.state.inboxKw || "";
    let list = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const counts = { "全部": list.length, "办理中": list.filter(l => l.status === "办理中").length, "已办结": list.filter(l => l.status === "已办结").length };
    if (tab !== "全部") list = list.filter(l => l.status === tab);
    if (kw) list = list.filter(l => (l.title + l.name + l.id + l.dept).includes(kw));
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    this._after = () => {
      const inp = document.getElementById("m-inbox-search");
      if (inp) inp.addEventListener("input", () => { this.state.inboxKw = inp.value.trim(); clearTimeout(this._is); this._is = setTimeout(() => this.render(), 250); });
      document.querySelectorAll("[data-seg]").forEach(s => s.addEventListener("click", () => { this.state.inboxTab = s.dataset.seg; this.render(); }));
      document.querySelectorAll("[data-handle]").forEach(el => el.addEventListener("click", () => this.showHandleSheet(el.dataset.handle)));
    };
    return `
    <div class="m-search"><input id="m-inbox-search" placeholder="搜索标题 / 来信人 / 科室 / 编号" value="${escapeHtml(kw)}"></div>
    <div class="m-segtabs">${["全部", "办理中", "已办结"].map(t => `<button class="m-seg ${tab === t ? "active" : ""}" data-seg="${t}">${t} ${counts[t]}</button>`).join("")}</div>
    ${list.length ? list.map(l => this.handleListItem(l)).join("") : `<div class="m-empty"><span class="ico">${svgIcon("inbox")}</span>暂无信件</div>`}`;
  },

  /* 督办催办（mirror renderSupervise） */
  pSupervise() {
    const all = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const overdue = all.filter(l => isOverdue(l));
    const urged = all.filter(l => l.urged && l.status !== "已办结");
    const near = all.filter(l => !isOverdue(l) && l.status === "办理中").length;
    this._after = () => {
      document.querySelectorAll("[data-handle]").forEach(el => el.addEventListener("click", () => this.showHandleSheet(el.dataset.handle)));
      document.querySelectorAll("[data-remind]").forEach(b => b.addEventListener("click", (e) => { e.stopPropagation(); this.toast("催办单已生成并送达归口科室"); }));
    };
    const item = (l) => `<div class="m-list-item" data-handle="${l.id}">
      <div class="m-li-top"><div class="m-li-title">${escapeHtml(l.title)}</div>${this.statusBadge(l.status)}</div>
      <div class="m-li-meta"><span class="mono">${l.id}</span> <span class="m-dept">${l.dept}</span> · ${l.date} · 时限 ${effectiveDeadline(l)}${isOverdue(l) ? ' <span class="m-tag overdue">超期</span>' : ""}${l.urged ? ' <span class="m-tag warn">催办</span>' : ""}</div>
      <div style="margin-top:8px"><button class="m-btn m-btn-outline m-btn-sm" data-remind="${l.id}">生成催办单</button></div>
    </div>`;
    return `
    <div class="m-stat-grid m-stat-3">
      ${this.miniStat("超期未办结", overdue.length, "需重点督办", "#DF2027")}
      ${this.miniStat("学生催办", urged.length, "已收到催办", "#F29100")}
      ${this.miniStat("临期待办", near, "临近时限", "#3087CC")}
    </div>
    <div class="m-section-title">超期未办结清单</div>
    ${overdue.length ? overdue.map(item).join("") : `<div class="m-empty"><span class="ico">${svgIcon("clock")}</span>暂无超期信件，办理情况良好</div>`}
    <div class="m-section-title" style="margin-top:16px">学生催办件</div>
    ${urged.length ? urged.map(item).join("") : `<div class="m-empty"><span class="ico">${svgIcon("megaphone")}</span>暂无催办件</div>`}`;
  },

  /* 统计分析（mirror renderAnalytics） */
  pAnalytics() {
    const gran = this.state.anGran || "month";
    const granLabel = { year: "年度", quarter: "季度", month: "月度" };
    const all = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const byCat = MOCK.letterCategories.map(c => ({ label: c.label, color: c.color, value: all.filter(l => l.category === c.label).length })).filter(x => x.value);
    const byStatus = [["办理中", "#3087CC"], ["已办结", "#1BB975"]].map(([s, c]) => ({ label: s, color: c, value: all.filter(l => l.status === s).length }));
    const maxStatus = Math.max(...byStatus.map(s => s.value), 1);
    const byDept = {}; all.forEach(l => byDept[l.dept] = (byDept[l.dept] || 0) + 1);
    const deptRows = Object.entries(byDept).sort((a, b) => b[1] - a[1]);
    const done = all.filter(l => l.status === "已办结").length;
    const trend = bucketCounts(all, gran);
    const maxTrend = Math.max(...trend.map(t => t.value), 1);
    this._after = () => {
      this.drawDonut("m-an-donut", byCat);
      document.querySelectorAll("[data-angran]").forEach(s => s.addEventListener("click", () => { this.state.anGran = s.dataset.angran; this.render(); }));
    };
    return `
    <div class="m-stat-grid">
      ${this.miniStat("来信总量", all.length, this.mailbox, "#3087CC")}
      ${this.miniStat("办结率", (all.length ? Math.round(done / all.length * 100) : 0) + "%", "已办结/总量", "#1BB975")}
      ${this.miniStat("参评量", all.filter(l => l.rating).length, "已评价", "#3087CC")}
      ${this.miniStat("好评率", this.satisfaction(all) + "%", "4星及以上", "#F29100")}
    </div>
    <div class="m-card">
      <div class="m-card-title">来信量趋势</div>
      <div class="m-segtabs">${["year", "quarter", "month"].map(g => `<button class="m-seg ${gran === g ? "active" : ""}" data-angran="${g}">${granLabel[g]}</button>`).join("")}</div>
      ${trend.length ? trend.map(t => `<div class="m-bar-row"><span class="lbl">${t.label}</span><span class="m-bar-track"><span class="m-bar-fill" style="width:${t.value / maxTrend * 100}%;background:#3087CC"></span></span><span class="val">${t.value}</span></div>`).join("") : `<div class="m-no-reply">暂无数据</div>`}
    </div>
    <div class="m-card">
      <div class="m-card-title">信件分类占比</div>
      <div class="m-chart-wrap"><canvas id="m-an-donut" width="150" height="150"></canvas></div>
      <div class="m-chart-legend">${byCat.map(c => `<div class="m-lg"><span class="d" style="background:${c.color}"></span>${c.label}<span class="v">${c.value}</span></div>`).join("")}</div>
    </div>
    <div class="m-card">
      <div class="m-card-title">办理状态分布</div>
      ${byStatus.map(s => `<div class="m-bar-row"><span class="lbl">${s.label}</span><span class="m-bar-track"><span class="m-bar-fill" style="width:${s.value / maxStatus * 100}%;background:${s.color}"></span></span><span class="val">${s.value}</span></div>`).join("")}
    </div>
    <div class="m-card">
      <div class="m-card-title">科室办理绩效</div>
      ${deptRows.map(([d, v]) => {
        const items = all.filter(l => l.dept === d);
        const dn = items.filter(l => l.status === "已办结").length;
        const rd = items.filter(l => l.rating);
        const avg = rd.length ? (rd.reduce((s, x) => s + x.rating, 0) / rd.length).toFixed(1) : "-";
        return `<div class="m-perf-row"><span class="nm">${d.replace(/（.*）/, "")}</span><span class="mt">承接 ${v} · 办结 ${dn} · ${Math.round(dn / v * 100)}%${avg === "-" ? "" : " · ★" + avg}</span></div>`;
      }).join("")}
    </div>`;
  },

  /* 办理抽屉（mirror showHandle/bindHandle，按身份区分） */
  showHandleSheet(id) {
    const l = getLetterById(id);
    if (!l) return;
    const isAdmin = this.role === "admin";
    if (!isAdmin && l.dept !== this.section) { this.toast("该信件不属于本科室"); return; }
    const deptField = isAdmin
      ? `<div class="m-field"><label>归口科室（转办）</label><select id="mh-dept">${MOCK.sections.map(d => `<option ${d.name === l.dept ? "selected" : ""}>${d.name}</option>`).join("")}</select></div>`
      : `<div class="m-field"><label>归口科室</label><input value="${escapeHtml(l.dept)}" disabled></div>`;
    const body = `
      ${this.letterDetailBody(l, "view")}
      <div class="m-sec"><div class="m-sec-t">来信人信息</div>
        <div class="m-content-box">
          <p>姓名：${escapeHtml(l.name)}　所在单位：${escapeHtml(l.unit || "-")}</p>
          <p>联系电话：${escapeHtml(l.phone || "-")}</p>
          <p>联系邮箱：${escapeHtml(l.email || "-")}</p>
        </div>
      </div>
      <div class="m-sec"><div class="m-sec-t">办理操作</div>
        ${deptField}
        <div class="m-field"><label>答复内容</label><textarea id="mh-reply" rows="4" placeholder="请填写办理答复">${escapeHtml(l.reply ? l.reply.content : "")}</textarea></div>
      </div>
      <div class="m-sheet-actions">
        ${isAdmin && l.status !== "已办结" ? `<div class="m-btn-row"><button class="m-btn m-btn-outline" id="mh-transfer">转办科室</button>${!l.urged ? `<button class="m-btn m-btn-outline" id="mh-urge">督办提醒</button>` : ""}</div>` : ""}
        ${l.status !== "已办结" ? `<button class="m-btn m-btn-primary" id="mh-done">答复并办结</button>` : `<button class="m-btn m-btn-outline" id="mh-reopen">重新打开</button>`}
      </div>`;
    this.showSheet(isAdmin ? "信件办理（管理员）" : "信件办理（本科室）", body);
    this.bindAttachments(() => this.showHandleSheet(id));
    this.bindHandleSheet(l);
  },

  bindHandleSheet(l) {
    const deptSel = document.getElementById("mh-dept");
    const replyBox = document.getElementById("mh-reply");
    const save = () => { if (deptSel) l.dept = deptSel.value; l.deadline = calcDeadline(new Date(l.createdAt)); };
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener("click", fn); };
    on("mh-transfer", () => { save(); l.status = "办理中"; upsertLetter(l); this.toast(`已转办至 ${l.dept}`); this.closeSheet(); this.render(); });
    on("mh-urge", () => { sendUrge(l, MOCK.urgeChannels, "admin"); upsertLetter(l); this.toast(`已通过${channelLabel(MOCK.urgeChannels)}向 ${l.dept} 发送督办提醒`); this.closeSheet(); this.render(); });
    on("mh-done", () => {
      const txt = replyBox.value.trim();
      if (!txt) { this.toast("请填写答复内容后再办结"); return; }
      save(); l.reply = { dept: l.dept, time: formatDateTime(new Date()), content: txt };
      l.status = "已办结"; upsertLetter(l); this.toast("信件已答复并办结"); this.closeSheet(); this.render();
    });
    on("mh-reopen", () => { l.status = "办理中"; upsertLetter(l); this.toast("信件已重新打开"); this.closeSheet(); this.render(); });
  },

  /* 信件详情（学生/查看） */
  showLetterDetail(id, mode) {
    const l = getLetterById(id);
    if (!l) return;
    if (l.status === "草稿") {
      this.showSheet("草稿", `
        <div class="m-detail-title">${escapeHtml(l.title || "（未填写标题）")}</div>
        <div class="m-detail-meta"><span class="mono">${l.id}</span> · 草稿</div>
        <div class="m-content-box">${l.content ? contentHtml(l.content) : "（未填写）"}</div>
        <div class="m-sheet-actions"><div class="m-btn-row">
          <button class="m-btn m-btn-primary" id="md-edit">继续编辑</button>
          <button class="m-btn m-btn-danger" id="md-del">删除草稿</button>
        </div></div>`);
      document.getElementById("md-edit").addEventListener("click", () => { this.closeSheet(); this.go("write"); });
      document.getElementById("md-del").addEventListener("click", () => { saveLetters(getLetters().filter(x => x.id !== id)); this.closeSheet(); this.toast("草稿已删除"); this.render(); });
      return;
    }
    this.showSheet("信件详情", this.letterDetailBody(l, mode));
    this.bindDetailActions(l, mode);
    this.bindAttachments(() => this.showLetterDetail(id, mode));
  },

  letterDetailBody(l, mode) {
    const log = buildProcessLog(l);
    const supsHtml = supplementItemsHtml(l, "m-tag");
    const urgeHtml = reminderItemsHtml(l);
    return `
    <div class="m-detail-title">${escapeHtml(l.title)}</div>
    <div class="m-detail-meta"><span class="mono">${l.id}</span> · ${l.mailbox} · ${l.date} ${this.statusBadge(l.status)}</div>
    <div class="m-detail-tags">${this.catBadge(l.category)} <span class="m-tag">${l.affair}</span> <span class="m-tag">归口：${l.dept}</span> <span class="m-tag">办结时限：${effectiveDeadline(l)}</span>${isOverdue(l) ? ' <span class="m-tag overdue">超期</span>' : ""}${l.supplements && l.supplements.length ? ' <span class="m-tag info">已补充</span>' : ""}${l.urged ? ' <span class="m-tag warn">已催办</span>' : ""}</div>
    <div class="m-sec"><div class="m-sec-t">信件内容</div><div class="m-content-box">${contentHtml(l.content)}</div>
      ${l.attachments && l.attachments.length ? `<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px">${attachChipsHtml(l.attachments, "m-tag")}</div>` : ""}</div>
    ${supsHtml ? `<div class="m-sec"><div class="m-sec-t">补充材料</div>${supsHtml}</div>` : ""}
    ${urgeHtml ? `<div class="m-sec"><div class="m-sec-t">催办记录</div>${urgeHtml}</div>` : ""}
    <div class="m-sec"><div class="m-sec-t">办理流程</div><div class="m-timeline">
      ${log.map(s => `<div class="m-tl"><div class="s">${s.step}</div><div class="m">${s.time} · ${s.actor}</div><div class="n">${s.note}</div></div>`).join("")}
      ${l.status !== "已办结" && l.status !== "已撤回" ? `<div class="m-tl pending"><div class="s" style="color:var(--text-muted)">待答复反馈</div></div>` : ""}
    </div></div>
    <div class="m-sec"><div class="m-sec-t">办理答复</div>
      ${l.reply ? `<div class="m-reply"><div class="m-content-box" style="background:transparent;padding:0">${contentHtml(l.reply.content)}</div><div class="rt">—— ${l.reply.dept} · ${l.reply.time}</div></div>` : `<div class="m-no-reply">归口科室正在办理中，请耐心等待</div>`}
    </div>
    ${mode === "student" ? this.studentActions(l) : ""}`;
  },

  studentActions(l) {
    if (l.status === "已办结") {
      return `<div class="m-sec"><div class="m-sec-t">满意度评价</div>
        ${l.rating ? this.mRatingDone(l) : `<div class="m-rating-form">
          <div class="m-rate-line"><div class="m-stars" id="m-stars">${[1, 2, 3, 4, 5].map(i => `<button data-star="${i}">★</button>`).join("")}</div><span class="m-rate-hint" id="m-rate-hint">请点击星级</span></div>
          <div class="m-rate-tags" id="m-rate-tags">${MOCK.ratingTags.map(t => `<button type="button" class="m-rate-chip" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join("")}</div>
          <textarea id="m-rate-comment" class="m-rate-comment" rows="3" maxlength="300" placeholder="说说本次办理的感受或建议（选填）"></textarea>
          <button class="m-btn m-btn-primary" id="m-rate-submit">提交评价</button>
        </div>`}
        </div>
        ${l.rating ? `<div class="m-sheet-actions"><button class="m-btn m-btn-outline" id="md-reopen">对结果不满意，申请二次办理</button></div>` : ""}`;
    }
    return `<div class="m-sheet-actions">
      <div class="m-btn-row">
        <button class="m-btn m-btn-outline" id="md-supplement">补充材料</button>
        <button class="m-btn m-btn-outline" id="md-urge" ${l.urged ? "disabled" : ""}>${l.urged ? "已催办" : "催办"}</button>
      </div>
      ${l.status === "办理中" ? `<button class="m-btn m-btn-danger" id="md-withdraw">撤回信件</button>` : ""}
    </div>`;
  },

  mRatingDone(l) {
    return `<div class="m-rating-view">
      <div class="m-rating-top"><span class="m-stars-static">${"★".repeat(l.rating)}${"☆".repeat(5 - l.rating)}</span><span class="m-rating-score">${l.rating}.0 分</span>${l.ratedAt ? `<span class="m-rating-date">评价于 ${l.ratedAt}</span>` : ""}</div>
      ${l.ratingTags && l.ratingTags.length ? `<div class="m-rate-tags-view">${l.ratingTags.map(t => `<span class="m-rate-chip on">${escapeHtml(t)}</span>`).join("")}</div>` : ""}
      ${l.ratingComment ? `<div class="m-rate-comment-view">${escapeHtml(l.ratingComment)}</div>` : ""}
    </div>`;
  },

  bindStars(l) {
    const stars = document.getElementById("m-stars");
    if (!stars) return;
    let sel = 0;
    const btns = stars.querySelectorAll("button");
    const hintEl = document.getElementById("m-rate-hint");
    const hints = ["请点击星级", "很不满意", "不太满意", "基本满意", "比较满意", "非常满意"];
    btns.forEach(b => b.addEventListener("click", () => {
      sel = +b.dataset.star; btns.forEach((x, i) => x.classList.toggle("on", i < sel)); if (hintEl) hintEl.textContent = hints[sel];
    }));
    const tagWrap = document.getElementById("m-rate-tags");
    if (tagWrap) tagWrap.querySelectorAll(".m-rate-chip").forEach(c => c.addEventListener("click", () => c.classList.toggle("on")));
    const submit = document.getElementById("m-rate-submit");
    if (submit) submit.addEventListener("click", () => {
      if (!sel) { this.toast("请先选择星级评分"); return; }
      l.rating = sel;
      const ta = document.getElementById("m-rate-comment");
      l.ratingComment = ta ? ta.value.trim() : "";
      l.ratingTags = tagWrap ? [...tagWrap.querySelectorAll(".m-rate-chip.on")].map(c => c.dataset.tag) : [];
      l.ratedAt = formatDate(new Date());
      upsertLetter(l); this.toast("感谢您的评价！"); this.showLetterDetail(l.id, "student");
    });
  },

  bindDetailActions(l, mode) {
    this.bindStars(l);
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener("click", fn); };
    on("md-reopen", () => { l.status = "办理中"; l.reopened = true; l.reply = null; l.rating = null; l.ratingComment = ""; l.ratingTags = []; l.ratedAt = null; l.deadline = calcDeadline(new Date()); upsertLetter(l); this.toast("已申请二次办理"); this.closeSheet(); this.render(); });
    on("md-urge", () => this.showUrgeSheet(l));
    on("md-withdraw", () => { l.status = "已撤回"; upsertLetter(l); this.toast("信件已撤回"); this.closeSheet(); this.render(); });
    on("md-supplement", () => this.showSupplement(l));
  },

  /* 催办：预览模板 + 选择渠道 + 发送并记录 */
  showUrgeSheet(l) {
    const channels = (MOCK.urgeChannels || ["sys"]).slice();
    this.showSheet("催办", `
      <p class="m-hint">以下催办通知将发送至归口科室（<b>${escapeHtml(l.dept)}</b>）：</p>
      <div class="m-sec"><div class="m-sec-t">催办内容（按模板自动生成）</div>
        <div class="urge-preview">${escapeHtml(fillUrgeTemplate(l))}</div></div>
      <div class="m-field"><label>发送渠道</label>
        <div class="channel-opts">
          ${["sys", "its"].map(c => `<label class="channel-opt"><input type="checkbox" value="${c}" ${channels.includes(c) ? "checked" : ""}> ${CHANNEL_LABELS[c]}</label>`).join("")}
        </div>
      </div>
      <div class="m-sheet-actions"><div class="m-btn-row">
        <button class="m-btn m-btn-outline" id="m-urge-back">返回</button>
        <button class="m-btn m-btn-primary" id="m-urge-ok">发送催办</button>
      </div></div>`);
    document.getElementById("m-urge-ok").addEventListener("click", () => {
      const ch = [...document.querySelectorAll(".channel-opts input:checked")].map(x => x.value);
      if (!ch.length) { this.toast("请至少选择一种发送渠道"); return; }
      sendUrge(l, ch, "student"); upsertLetter(l);
      this.toast(`已通过${channelLabel(ch)}催办至${l.dept}`); this.showLetterDetail(l.id, "student");
    });
    document.getElementById("m-urge-back").addEventListener("click", () => this.showLetterDetail(l.id, "student"));
  },

  showSupplement(l) {
    this.showSheet("补充材料", `
      <div class="m-field"><label>补充说明</label><textarea id="m-sup" rows="4" placeholder="请描述需要补充的情况（若已上传附件，此项可不填）"></textarea></div>
      <div class="m-field"><label>补充附件</label>
        <div class="m-upload" id="m-sup-upload"><div class="uz-inner">${svgIcon("paperclip")} 点击或拖拽上传附件（照片 / 文档，可选）</div></div>
        <input type="file" id="m-sup-upload-input" multiple hidden>
        <div class="up-list" id="m-sup-upload-list"></div>
      </div>
      <div class="m-sheet-actions"><div class="m-btn-row">
        <button class="m-btn m-btn-outline" id="m-sup-back">返回</button>
        <button class="m-btn m-btn-primary" id="m-sup-ok">提交补充</button>
      </div></div>`);
    const uploader = makeUploader(
      document.getElementById("m-sup-upload"),
      document.getElementById("m-sup-upload-input"),
      document.getElementById("m-sup-upload-list"),
      (a) => this.showAttachmentPreview(a)
    );
    document.getElementById("m-sup-ok").addEventListener("click", () => {
      const t = document.getElementById("m-sup").value.trim();
      const atts = uploader.getMeta();
      if (!t && !atts.length) { this.toast("请填写补充说明或上传至少一个附件"); return; }
      addSupplement(l, t, atts);
      upsertLetter(l); this.toast("补充材料已提交"); this.showLetterDetail(l.id, "student");
    });
    document.getElementById("m-sup-back").addEventListener("click", () => this.showLetterDetail(l.id, "student"));
  }
});

/* ============================================================
 * Canvas 图表
 * ============================================================ */
Object.assign(MApp, {
  /* Canvas 环形图 */
  drawDonut(id, data) {
    const cv = document.getElementById(id); if (!cv) return;
    const ctx = cv.getContext("2d"); const w = cv.width, h = cv.height, cx = w / 2, cy = h / 2;
    const r = Math.min(w, h) / 2 - 4, inner = r * 0.62;
    ctx.clearRect(0, 0, w, h);
    const total = data.reduce((s, d) => s + d.value, 0);
    if (!total) { ctx.fillStyle = "#e2e8f0"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.arc(cx, cy, inner, 0, 7, true); ctx.fill(); return; }
    let start = -Math.PI / 2;
    data.forEach(d => { const ang = d.value / total * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, start + ang); ctx.closePath(); ctx.fillStyle = d.color || "#3087CC"; ctx.fill(); start += ang; });
    ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
    ctx.fillStyle = "#3C444F"; ctx.textAlign = "center"; ctx.font = "bold 22px sans-serif"; ctx.fillText(total, cx, cy);
    ctx.font = "10px sans-serif"; ctx.fillStyle = "#9096A2"; ctx.fillText("总计", cx, cy + 15);
  }
});

/* 启动 */
document.addEventListener("DOMContentLoaded", () => MApp.init());

