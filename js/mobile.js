/* ============================================================
 * 学工信箱系统原型 —— 移动端应用
 * 复用 js/data.js（同一套 localStorage，与桌面端数据同步）
 * 顶部 AppBar + 底部 TabBar + 底部抽屉
 * ============================================================ */

/* 底部标签：学生、综合办、科室负责人、科室回复人、科室分管领导、学院副书记 */
const M_TABS = {
  student: [
    { key: "home", label: "首页", ico: "home" },
    { key: "public", label: "公开", ico: "megaphone" },
    { key: "__fab" },
    { key: "my", label: "我的", ico: "mail" },
    { key: "more", label: "更多", ico: "menu" }
  ],
  admin: [
    { key: "admin-home", label: "工作台", ico: "dashboard" },
    { key: "dispatch", label: "待分派", ico: "share" },
    { key: "inbox", label: "收件箱", ico: "inbox" },
    { key: "supervise", label: "督办", ico: "clock" },
    { key: "more", label: "更多", ico: "menu" }
  ],
  leader: [
    { key: "leader-home", label: "工作台", ico: "dashboard" },
    { key: "leader-approve", label: "待审批", ico: "userCheck" },
    { key: "sec-inbox", label: "收件箱", ico: "inbox" },
    { key: "more", label: "更多", ico: "menu" }
  ],
  replier: [
    { key: "sec-home", label: "工作台", ico: "dashboard" },
    { key: "rep-todo", label: "待我办理", ico: "write" },
    { key: "sec-inbox", label: "收件箱", ico: "inbox" },
    { key: "more", label: "更多", ico: "menu" }
  ],
  writer: [
    { key: "writer-home", label: "工作台", ico: "dashboard" },
    { key: "writer-todo", label: "待起草", ico: "write" },
    { key: "sec-inbox", label: "收件箱", ico: "inbox" },
    { key: "more", label: "更多", ico: "menu" }
  ],
  college: [
    { key: "col-todo", label: "协同待办", ico: "users" },
    { key: "col-visible", label: "学院可见", ico: "eye" },
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
  policy: { title: "制度文件", sub: true },
  stats: { title: "数据统计", sub: true },
  dept: { title: "科室联系", sub: true },
  faq: { title: "常见问题", sub: true },
  msgs: { title: "消息通知", sub: true },
  "leader-home": { title: "科室工作台", tab: "leader-home" },
  "leader-approve": { title: "待审批答复", tab: "leader-approve" },
  "sec-home": { title: "我的工作台", tab: "sec-home" },
  "rep-todo": { title: "待我办理", tab: "rep-todo" },
  "writer-home": { title: "回复人工作台", tab: "writer-home" },
  "writer-todo": { title: "待我起草", tab: "writer-todo" },
  "sec-inbox": { title: "科室收件箱", tab: "sec-inbox" },
  "col-todo": { title: "协同待办", tab: "col-todo" },
  "col-visible": { title: "学院可见信件", tab: "col-visible" },
  "admin-home": { title: "办理工作台", tab: "admin-home" },
  "dispatch": { title: "待分派信件", tab: "dispatch" },
  "inbox": { title: "信件收件箱", tab: "inbox" },
  "supervise": { title: "督办催办", tab: "supervise" },
  "admin-stats": { title: "统计分析", sub: true }
};

const M_HOME = { student: "home", admin: "admin-home", leader: "leader-home", replier: "sec-home", writer: "writer-home", college: "col-todo" };

const MApp = {
  role: "student",
  section: "",
  member: null,
  writer: null,
  college: "",
  mailbox: "学工信箱",
  route: "home",
  state: {},

  memberId() { return (this.member && this.member.id) || ""; },
  writerId() { return (this.writer && this.writer.id) || ""; },
  leader() { return sectionLeader(this.section); },

  homeRoute() { return M_HOME[this.role] || "home"; },

  /* 旧「信件查询」已下线：学院副书记没有公开信件，回到首页；其余身份打开公开信件 */
  removedQueryRoute() {
    return this.role === "college" ? this.homeRoute() : "public";
  },

  identityKey() {
    if (this.role === "admin") return "admin";
    if (this.role === "leader") { const l = this.leader(); return l ? "member:" + l.id : ""; }
    if (this.role === "replier") return this.member ? "member:" + this.member.id : "";
    if (this.role === "writer") return this.writer ? "member:" + this.writer.id : "";
    if (this.role === "college") return "college:" + this.college;
    return "student:me";
  },

  init() {
    /* 支持通过 URL 直达指定身份：mobile.html?role=leader&section=学生资助管理科&college=计算机学院 */
    const params = new URLSearchParams(location.search);
    const qRole = params.get("role") === "section" ? "replier" : params.get("role");
    if (ROLE_KEYS.includes(qRole)) saveRole(qRole);
    const qSec = params.get("section");
    if (qSec && MOCK.sections.some(s => s.name === qSec)) saveSection(qSec);
    const qCol = params.get("college");
    if (qCol && findCollege(qCol)) saveCollege(qCol);
    /* 导航进入科室负责人且未指定 member 时，落到该科室第一位在用科室负责人，避免上次切换后演示待办对不上 */
    if (qRole === "replier" && qSec && MOCK.sections.some(s => s.name === qSec) && !params.get("member")) {
      const first = sectionCharge(qSec) || replierCandidates(qSec)[0];
      if (first) saveMember(first.id);
    }
    if (qRole === "writer") {
      const secName = (qSec && MOCK.sections.some(s => s.name === qSec)) ? qSec : getSection();
      const list = writerCandidates(secName);
      const picked = list.find(m => m.id === params.get("writer")) || list[0];
      if (picked) saveWriter(picked.id);
    }
    this.role = getRole();
    this.section = getSection();
    this.member = getMember();
    this.writer = getWriter();
    this.college = getCollege();
    this.mailbox = getMailbox();
    const hashRoute = (location.hash || "").replace(/^#\/?/, "");
    this.route = hashRoute === "query" ? this.removedQueryRoute() : this.homeRoute();
    if (hashRoute === "query") {
      history.replaceState(null, "", location.pathname + location.search + "#/" + this.route);
    }
    this.bindShell();
    this.startClock();
    this.render();
  },

  bindShell() {
    document.getElementById("m-fab").addEventListener("click", () => this.go("write-notice"));
    document.getElementById("m-back").addEventListener("click", () => this.back());
    document.getElementById("m-mailbox-btn").addEventListener("click", () => this.showMailboxSheet());
    document.getElementById("m-bell").addEventListener("click", () => this.go("msgs"));
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
    if (route === "query") route = this.removedQueryRoute();
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

  /* 当前身份可访问的路由 */
  canVisit(r) {
    if (["more", "public", "policy", "dept", "faq", "msgs"].includes(r)) return true;
    if ((M_TABS[this.role] || []).some(t => t.key === r)) return true;
    if (this.role === "student") return ["write", "write-notice", "stats"].includes(r);
    return this.role === "admin" && r === "admin-stats";
  },

  /* 渲染 */
  render() {
    this.member = getMember();
    this.writer = getWriter();
    this.college = getCollege();
    if (this.route === "query") this.route = this.removedQueryRoute();
    if (!this.canVisit(this.route)) this.route = this.homeRoute();
    const meta = M_ROUTES[this.route] || { title: "学工信箱" };
    document.getElementById("m-title").textContent = meta.title;
    document.getElementById("m-back").classList.toggle("hidden", !meta.sub);
    document.getElementById("m-mailbox-btn").style.display = "none";
    const fab = document.getElementById("m-fab");
    if (fab) fab.style.display = this.role === "student" ? "" : "none";

    const map = {
      home: () => this.pHome(), public: () => this.pPublic(), my: () => this.pMy(), more: () => this.pMore(),
      write: () => this.pWrite(), "write-notice": () => this.pNotice(),
      policy: () => this.pPolicy(), stats: () => this.pStats(), dept: () => this.pDept(), faq: () => this.pFaq(),
      msgs: () => this.pMessages(),
      "leader-home": () => this.pLeaderHome(), "leader-approve": () => this.pLeaderList("approve"),
      "sec-home": () => this.pSectionHome(), "rep-todo": () => this.pReplierTodo(), "sec-inbox": () => this.pSectionInbox(),
      "writer-home": () => this.pWriterHome(), "writer-todo": () => this.pWriterTodo(),
      "col-todo": () => this.pCollegeTodo(), "col-visible": () => this.pCollegeVisible(),
      "admin-home": () => this.pAdminHome(), "dispatch": () => this.pDispatch(), "inbox": () => this.pInbox(),
      "supervise": () => this.pSupervise(), "admin-stats": () => this.pAnalytics()
    };
    document.getElementById("m-content").innerHTML = (map[this.route] || map[this.homeRoute()])();
    this.renderTabbar();
    this.renderBell();
    if (this._after) { const f = this._after; this._after = null; f(); }
  },

  renderBell() {
    const dot = document.getElementById("m-bell-dot");
    if (!dot) return;
    const n = unreadCount(this.identityKey());
    dot.textContent = n > 99 ? "99+" : (n || "");
    dot.style.display = n ? "" : "none";
  },

  renderTabbar() {
    const bar = document.getElementById("m-tabbar");
    const activeTab = (M_ROUTES[this.route] || {}).tab;
    const tabs = M_TABS[this.role] || M_TABS.student;
    bar.classList.toggle("cols-3", tabs.length === 3);
    bar.classList.toggle("cols-4", tabs.length === 4);
    bar.innerHTML = tabs.map(t => {
      if (t.key === "__fab") return `<div class="m-tab spacer"></div>`;
      const badge = this.tabBadge(t.key);
      return `<button class="m-tab ${activeTab === t.key ? "active" : ""}" data-tab="${t.key}">
        <span class="m-tab-ico">${svgIcon(t.ico)}</span><span>${t.label}${badge ? ` (${badge})` : ""}</span></button>`;
    }).join("");
    bar.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => this.go(b.dataset.tab)));
  },

  tabBadge(key) {
    const all = () => filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const sec = () => getSectionLetters(this.section);
    if (key === "my") return getMyLetters().filter(l => l.status !== STATUS.draft && l.mailbox === this.mailbox).length || "";
    if (key === "dispatch") return all().filter(l => stageOf(l) === STAGE.pending).length || "";
    if (key === "inbox") return all().filter(l => l.status === STATUS.doing).length || "";
    if (key === "supervise") return all().filter(l => isOverdue(l)).length || "";
    if (key === "leader-approve") return sec().filter(l => stageOf(l) === STAGE.approving).length || "";
    if (key === "rep-todo") return getMemberLetters(this.memberId()).filter(isReplierTurn).length || "";
    if (key === "writer-todo") return getWriterLetters(this.writerId()).filter(isWriterTurn).length || "";
    if (key === "col-todo") return getCollabLetters(this.college).filter(l => (l.collabs || []).some(c => c.college === this.college && !c.opinion)).length || "";
    return "";
  },

  /* 工具 */
  statusBadge(s) { const c = statusColor(s); return `<span class="m-badge" style="background:${c}1a;color:${c}"><span class="dot" style="background:${c}"></span>${s}</span>`; },
  stageBadge(l) { const st = stageOf(l); const c = stageColor(st); return `<span class="m-badge" style="background:${c}1a;color:${c}"><span class="dot" style="background:${c}"></span>${st}</span>`; },
  catBadge(cat) { const c = (MOCK.letterCategories.find(x => x.label === cat) || {}).color || "#627079"; return `<span class="m-badge" style="background:${c}1a;color:${c}">${cat}</span>`; },
  liExcerpt(l) { const e = contentExcerpt(l.content, 70); return e ? `<div class="m-li-excerpt">${escapeHtml(e)}</div>` : ""; },
  satisfaction(list) { const r = list.filter(l => l.rating); if (!r.length) return 100; return Math.round(r.filter(l => l.rating >= 4).length / r.length * 100); },

  /* 消息通知页：当前身份收到的消息，点击打开对应信件 */
  pMessages() {
    const key = this.identityKey();
    const msgs = messagesFor(key);
    const unread = msgs.filter(m => !m.read).length;
    this._after = () => {
      const all = document.getElementById("m-msg-all");
      if (all) all.addEventListener("click", () => { markRead(key); this.render(); });
      document.querySelectorAll("[data-msg]").forEach(el => el.addEventListener("click", () => {
        markRead(key, el.dataset.msg); this.renderBell(); el.classList.remove("unread");
        this.openLetter(el.dataset.msgLetter);
      }));
    };
    return `
    <div class="msg-toolbar"><span>${escapeHtml(ROLE_LABELS[this.role])} · 共 ${msgs.length} 条，未读 <b>${unread}</b> 条</span>
      ${unread ? `<button class="m-btn m-btn-outline m-btn-sm" id="m-msg-all">全部已读</button>` : ""}</div>
    <div class="msg-list">${messageItemsHtml(msgs, { empty: "当前身份暂无消息" })}</div>`;
  },

  openLetter(id) {
    const l = getLetterById(id);
    if (!l) { this.toast("该信件不存在或已删除"); return; }
    if (this.role === "student") this.showLetterDetail(id, l.owner === "me" ? "student" : "public");
    else if (this.role === "college") this.showCollabSheet(id);
    else this.showHandleSheet(id);
  }
};

/* ============================================================
 * 学生端页面
 * ============================================================ */
Object.assign(MApp, {
  pHome() {
    const all = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const mine = getMyLetters().filter(l => l.status !== STATUS.draft && l.mailbox === this.mailbox);
    const done = all.filter(l => l.status === STATUS.done).length;
    const pub = getPublicLetters().filter(l => l.mailbox === this.mailbox).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
    const quick = [
      { k: "write-notice", ico: "write", t: "写信" },
      { k: "my", ico: "mail", t: "我的" },
      { k: "public", ico: "megaphone", t: "公开" }
    ];
    this._after = () => {
      document.querySelectorAll("[data-go]").forEach(el => el.addEventListener("click", () => this.go(el.dataset.go)));
      document.querySelectorAll("[data-letter]").forEach(el => el.addEventListener("click", () => this.showLetterDetail(el.dataset.letter, "public")));
    };
    return `
    <div class="m-hero">
      <h2>倾听你的声音</h2>
      <p>来信统一送达${MOCK.intakeSection}，分给科室办理，答复经科室分管领导审批 · 件件有回音</p>
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
        <div class="m-li-meta"><span class="m-dept">${deptLabel(l)}</span> · <span>${l.date}</span></div>
      </div>`).join("") : `<div class="m-empty" style="padding:20px 0"><span class="ico">${svgIcon("megaphone")}</span>暂无公开信件</div>`}
    </div>
    <p class="m-topnote">当前为移动端原型 · <a href="pc.html">切换到桌面端</a></p>`;
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
        <li>建议使用真实信息以便核实回访；提交后系统自动发送收悉回执，${MOCK.replyPromiseDays} 天内给予正式回复。</li>
        <li>同一事项办结后请勿以相同理由重复提交。</li>
      </ol>
      <div class="m-flow">
        <div class="m-flow-t">办理流程</div>
        ${FLOW_STEPS.map((f, i) => `<div class="m-flow-step"><span class="i">${i + 1}</span>
          <div><div class="s">${escapeHtml(f.step)}<span class="a">${escapeHtml(f.actor)}</span></div>
          <div class="n">${escapeHtml(f.note)}</div></div></div>`).join("")}
      </div>
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
    const updDept = () => {
      deptHint.textContent = `统一送达${MOCK.intakeSection}受理，由综合办分给相关科室办理`;
    };
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
      const letter = Object.assign(ex || { id: genLetterId(), owner: "me", mailbox: this.mailbox, createdAt: new Date().toISOString(), date: formatDate(new Date()) }, o, { status: STATUS.draft });
      upsertLetter(letter); this.toast("已保存为草稿"); this.go("my");
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const o = collect();
      if (!o.name || !o.title || !o.category || !o.affair || !o.content) { this.toast("请填写所有必填项"); return; }
      if (o.content.length < 10) { this.toast("信件内容不少于10字"); return; }
      if (getMyLetters().some(l => l.status !== STATUS.draft && l.mailbox === this.mailbox && l.title === o.title)) { dupHint.textContent = "⚠ 已提交过同标题信件，请勿重复提交"; return; }
      const now = new Date(); const ex = getDraft(this.mailbox);
      const letter = Object.assign(ex || { id: genLetterId(), owner: "me" }, o, {
        mailbox: this.mailbox, dept: "", leader: null, assignee: null, dispatches: [],
        createdAt: now.toISOString(), date: formatDate(now), deadline: calcDeadline(now), urged: false, reopened: false, reply: null, rating: null
      });
      submitLetter(letter);
      upsertLetter(letter); this.go("my"); this.showReceipt(letter);
    });
  },

  /* 收悉回执（M-01）：提交后立即展示，不代表办理结果 */
  showReceipt(l) {
    const ack = (l.ack && l.ack.text) || "";
    this.showSheet("提交成功", `
      <div class="receipt-box">
        <div class="receipt-head">${svgIcon("check")} 来信已送达${MOCK.intakeSection}</div>
        <div class="receipt-meta">信件编号 <span class="mono">${escapeHtml(l.id)}</span> · 承诺 ${MOCK.replyPromiseDays} 天内正式回复</div>
        <div class="receipt-text">${escapeHtml(ack).replace(/\n/g, "<br>")}</div>
      </div>
      <p class="m-hint">回执已同步发送到消息通知，可在「我的信件」查看办理进度。</p>
      <div class="m-sheet-actions"><button class="m-btn m-btn-primary" id="m-rc-ok">我知道了</button></div>`);
    document.getElementById("m-rc-ok").addEventListener("click", () => this.closeSheet());
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
    const counts = { "全部": list.filter(l => l.status !== STATUS.draft).length, "草稿": list.filter(l => l.status === STATUS.draft).length };
    [STATUS.pending, STATUS.doing, STATUS.done].forEach(s => counts[s] = list.filter(l => l.status === s).length);
    list = tab === "全部" ? list.filter(l => l.status !== STATUS.draft) : list.filter(l => l.status === tab);
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    this._after = () => {
      document.querySelectorAll("[data-seg]").forEach(s => s.addEventListener("click", () => { this.state.myTab = s.dataset.seg; this.render(); }));
      document.querySelectorAll("[data-letter]").forEach(el => el.addEventListener("click", () => this.showLetterDetail(el.dataset.letter, "student")));
    };
    const tabs = ["全部", "待分派", "办理中", "已办结", "草稿"];
    return `
    <div class="m-segtabs">${tabs.map(t => `<button class="m-seg ${tab === t ? "active" : ""}" data-seg="${t}">${t} ${counts[t]}</button>`).join("")}</div>
    ${list.length ? list.map(l => this.letterListItem(l)).join("") : `<div class="m-empty"><span class="ico">${svgIcon("inbox")}</span>暂无信件，点击下方 ＋ 写信</div>`}`;
  },

  letterListItem(l) {
    return `<div class="m-list-item" data-letter="${l.id}">
      <div class="m-li-top"><div class="m-li-title">${escapeHtml(l.title || "（未填写标题）")}</div>${this.statusBadge(l.status)}</div>
      ${this.liExcerpt(l)}
      <div class="m-li-meta">${this.catBadge(l.category)} <span class="mono">${l.id}</span>
        ${l.dept ? `<span class="m-dept">${escapeHtml(l.dept)}${assigneeLabel(l) ? " · " + escapeHtml((l.assignee || {}).name) : ""}</span>` : '<span class="m-tag warn">待分派</span>'}
        ${l.urged && l.status !== STATUS.done ? '<span class="m-tag warn">已催办</span>' : ""}${isOverdue(l) ? '<span class="m-tag overdue">超期</span>' : ""}</div>
    </div>`;
  },

  /* 公开信件 */
  pPublic() {
    const kw = this.state.pubKw || "";
    let list = getPublicLetters().filter(l => l.mailbox === this.mailbox);
    if (kw) list = list.filter(l => (l.title + deptLabel(l)).includes(kw));
    list.sort((a, b) => b.date.localeCompare(a.date));
    this._after = () => {
      const inp = document.getElementById("m-pub-search");
      if (inp) inp.addEventListener("input", () => { this.state.pubKw = inp.value.trim(); clearTimeout(this._ps); this._ps = setTimeout(() => this.render(), 250); });
      document.querySelectorAll("[data-letter]").forEach(el => el.addEventListener("click", () => this.showLetterDetail(el.dataset.letter, "public")));
    };
    return `
    <div class="m-search"><input id="m-pub-search" placeholder="搜索标题 / 承办科室" value="${escapeHtml(kw)}"></div>
    ${list.length ? list.map(l => `<div class="m-list-item" data-letter="${l.id}">
      <div class="m-li-title">${escapeHtml(l.title)}</div>
      ${this.liExcerpt(l)}
      <div class="m-li-meta">${this.catBadge(l.category)} <span class="m-dept">${deptLabel(l)}</span> · ${l.date}</div>
    </div>`).join("") : `<div class="m-empty"><span class="ico">${svgIcon("megaphone")}</span>暂无公开信件</div>`}`;
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
        <span class="m-badge" style="background:${p.status === "现行有效" ? "#1BB9751a;color:#1BB975" : "#6270791a;color:#627079"}">${p.status}</span> · ${p.date}</div>
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
    const badge = `<span class="m-badge" style="background:${effective ? "#1BB9751a;color:#1BB975" : "#6270791a;color:#627079"}">${p.status}</span>`;
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
    const byDept = {}; all.filter(l => l.dept).forEach(l => byDept[l.dept] = (byDept[l.dept] || 0) + 1);
    const deptRows = Object.entries(byDept).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxDept = Math.max(...deptRows.map(r => r[1]), 1);
    const done = all.filter(l => l.status === STATUS.done).length;
    this._after = () => this.drawDonut("m-donut", byCat);
    return `
    <div class="m-stat-grid">
      ${this.miniStat("累计来信", all.length, this.mailbox, "#2A8DC7")}
      ${this.miniStat("已办结", done, `办结率 ${all.length ? Math.round(done / all.length * 100) : 0}%`, "#1BB975")}
      ${this.miniStat("平均时长", "3.6", "工作日", "#2A8DC7")}
      ${this.miniStat("满意度", this.satisfaction(all) + "%", "好评占比", "#F29100")}
    </div>
    <div class="m-card">
      <div class="m-card-title">来信分类分布</div>
      <div class="m-chart-wrap"><canvas id="m-donut" width="150" height="150"></canvas></div>
      <div class="m-chart-legend">${byCat.map(c => `<div class="m-lg"><span class="d" style="background:${c.color}"></span>${c.label}<span class="v">${c.value}</span></div>`).join("")}</div>
    </div>
    <div class="m-card">
      <div class="m-card-title">各承办科室来信量 Top6</div>
      ${deptRows.map(([d, v]) => `<div class="m-bar-row"><span class="lbl">${d.replace(/（.*）/, "")}</span><span class="m-bar-track"><span class="m-bar-fill" style="width:${v / maxDept * 100}%"></span></span><span class="val">${v}</span></div>`).join("")}
    </div>`;
  },

  miniStat(label, val, sub, color) {
    return `<div class="m-stat" style="--acc:${color}"><div class="m-stat-label">${label}</div><div class="m-stat-val" style="color:${color}">${val}</div><div class="m-stat-sub">${sub}</div></div>`;
  },

  /* 科室联系 */
  pDept() {
    return MOCK.sections.map(d => {
      const members = (d.members || []).filter(m => m.enabled !== false);
      return `<div class="m-dept">
      <h4>${d.name}</h4>
      <div class="hd">科室分管领导：${escapeHtml((sectionLeader(d.name) || {}).name || d.head || "-")}</div>
      <div class="ph">${svgIcon("phone")} ${d.phone}</div>
      <div class="ph">${svgIcon("mail")} ${escapeHtml(d.email || "-")}</div>
      <div class="du">${d.duty}</div>
      ${members.length ? `<div class="m-dept-members">
        <div class="mm-t">${svgIcon("users")} 科室成员</div>
        ${members.map(m => `<div class="mm-row"><span class="nm">${escapeHtml(m.name)}</span>
          <span class="tt">${escapeHtml(m.title || "科室成员")}${m.leader ? "（科室分管领导）" : ""}</span>
          <span class="ph2 mono">${escapeHtml(m.phone || "-")}</span></div>`).join("")}
      </div>` : ""}
    </div>`;
    }).join("");
  },

  /* FAQ（读取配置：仅启用项，按 order） */
  pFaq() {
    const faqs = faqsForDisplay();
    return `<div class="m-card">${faqs.length ? faqs.map(f => `<details class="m-faq"><summary>${escapeHtml(f.q)}</summary><div class="a">${escapeHtml(f.a)}</div></details>`).join("") : '<div class="m-no-reply">暂无常见问题</div>'}</div>`;
  },

  /* 更多（含身份切换器 + 科室 / 本人 / 学院选择器） */
  pMore() {
    const common = [
      { k: "public", ico: "megaphone", t: "公开信件" }, { k: "policy", ico: "doc", t: "制度文件" },
      { k: "dept", ico: "phone", t: "科室联系" }, { k: "faq", ico: "help", t: "常见问题" }
    ];
    const moreItems = this.role === "student" ? [
      { k: "policy", ico: "doc", t: "制度文件" },
      { k: "stats", ico: "chart", t: "数据统计" }, { k: "dept", ico: "phone", t: "科室联系" },
      { k: "faq", ico: "help", t: "常见问题" }
    ] : (this.role === "college" ? common.filter(i => i.k !== "public") : common);
    const moreCard = (i) => `<div class="m-more-item" data-more="${i.k}"><div class="ic">${svgIcon(i.ico)}</div><span>${i.t}</span></div>`;
    let user;
    if (this.role === "admin") user = { avatar: MOCK.admin.avatar, nm: MOCK.admin.name, sb: MOCK.admin.role };
    else if (this.role === "leader") {
      const ld = this.leader();
      user = ld ? { avatar: ld.name.charAt(0), nm: ld.name, sb: `${this.section} · ${ld.title || "科室分管领导"}` } : { avatar: "—", nm: "未配置科室分管领导", sb: this.section };
    } else if (this.role === "replier") {
      const m = this.member || getMember();
      user = m ? { avatar: m.name.charAt(0), nm: m.name, sb: `${this.section} · ${m.title || "科室负责人"}` } : { avatar: "—", nm: "暂无科室负责人", sb: this.section };
    } else if (this.role === "writer") {
      const m = this.writer || getWriter();
      user = m ? { avatar: m.name.charAt(0), nm: m.name, sb: `${this.section} · ${m.title || "科室回复人"}` } : { avatar: "—", nm: "暂无科室回复人", sb: this.section };
    } else if (this.role === "college") {
      const c = findCollege(this.college);
      user = c ? { avatar: c.secretary.charAt(0), nm: c.secretary, sb: `${c.name} · ${c.title || "副书记"}` } : { avatar: "—", nm: "学工系统未同步副书记", sb: this.college };
    } else user = { avatar: MOCK.user.avatar, nm: MOCK.user.name, sb: MOCK.user.college };
    const writers = writerCandidates(this.section);
    const charge = sectionCharge(this.section);

    this._after = () => {
      document.querySelectorAll("[data-more]").forEach(el => el.addEventListener("click", () => this.go(el.dataset.more)));
      document.querySelectorAll("[data-role]").forEach(b => b.addEventListener("click", () => {
        this.role = b.dataset.role; saveRole(this.role); this.go("more");
      }));
      document.querySelectorAll("[data-sec]").forEach(b => b.addEventListener("click", () => {
        this.section = b.dataset.sec; saveSection(this.section);
        const nextCharge = sectionCharge(this.section);
        if (nextCharge) saveMember(nextCharge.id);
        const nextWriter = writerCandidates(this.section)[0];
        if (nextWriter) saveWriter(nextWriter.id);
        this.member = getMember();
        this.writer = getWriter();
        this.render(); this.toast(`已切换至 ${this.section}`);
      }));
      document.querySelectorAll("[data-writer]").forEach(b => b.addEventListener("click", () => {
        saveWriter(b.dataset.writer); this.writer = getWriter();
        this.render(); this.toast(`已切换为 ${this.writer ? this.writer.name : ""}`);
      }));
      document.querySelectorAll("[data-col]").forEach(b => b.addEventListener("click", () => {
        this.college = b.dataset.col; saveCollege(this.college);
        this.render(); this.toast(`已切换至 ${this.college}`);
      }));
      document.querySelectorAll("[data-home]").forEach(b => b.addEventListener("click", () => this.go(this.homeRoute())));
    };
    return `
    <div class="m-more-user">
      <div class="m-more-avatar">${escapeHtml(user.avatar)}</div>
      <div><div class="nm">${escapeHtml(user.nm)}</div><div class="sb">${escapeHtml(user.sb)}</div></div>
    </div>
    <div class="m-section-title">切换身份（演示）</div>
    <div class="m-role-switch m-role-6">
      ${ROLE_KEYS.map(k => `<button class="m-role-chip ${this.role === k ? "active" : ""}" data-role="${k}">${ROLE_LABELS[k]}</button>`).join("")}
    </div>
    ${this.role === "leader" || this.role === "replier" || this.role === "writer" ? `
    <div class="m-section-title">选择科室</div>
    <div class="m-role-secs">
      ${MOCK.sections.map(s => `<button class="m-chip ${this.section === s.name ? "active" : ""}" data-sec="${escapeHtml(s.name)}">${s.name}</button>`).join("")}
    </div>` : ""}
    ${this.role === "leader" ? `<p class="m-hint">科室分管领导：${escapeHtml(this.leader() ? this.leader().name : "未配置")}，只负责审批</p>` : ""}
    ${this.role === "replier" ? `<p class="m-hint">科室负责人：${escapeHtml(charge ? charge.name : "未配置")}。综合办把来信分给这位负责人。</p>` : ""}
    ${this.role === "writer" ? `
    <div class="m-section-title">选择本人（科室回复人）</div>
    <div class="m-role-secs">
      ${writers.length
        ? writers.map(m => `<button class="m-chip ${this.writerId() === m.id ? "active" : ""}" data-writer="${escapeHtml(m.id)}">${escapeHtml(m.name)} · ${escapeHtml(m.title || "成员")}</button>`).join("")
        : `<span class="m-hint warn">该科室暂无科室回复人</span>`}
    </div>` : ""}
    ${this.role === "college" ? `
    <div class="m-section-title">选择学院</div>
    <div class="m-role-secs">
      ${collegeList(true).map(c => `<button class="m-chip ${this.college === c.name ? "active" : ""}" data-col="${escapeHtml(c.name)}">${escapeHtml(c.name)} · ${escapeHtml(c.secretary)}</button>`).join("")}
    </div>` : ""}
    ${this.role !== "student" ? `<button class="m-btn m-btn-primary" data-home style="margin:6px 0 4px">进入${escapeHtml(ROLE_LABELS[this.role])}工作台</button>` : ""}
    ${this.role === "admin" ? `
    <div class="m-section-title">运营</div>
    <div class="m-more-grid">
      ${moreCard({ k: "admin-stats", ico: "chart", t: "统计分析" })}
    </div>
    <p class="m-hint">批量催办、科室与人员、时限与模板等配置请在桌面端操作。学院副书记由学工系统维护，信箱直接使用。</p>` : ""}
    <div class="m-section-title">更多功能</div>
    <div class="m-more-grid">
      ${moreItems.map(moreCard).join("")}
    </div>
    <p class="m-topnote" style="color:var(--text-muted)">学工信箱移动端原型 · <a href="pc.html" style="color:var(--primary)">前往桌面端</a></p>`;
  },

  /* ============================================================
   * 移动端办理端（综合办 / 科室分管领导 / 科室负责人 / 学院副书记）
   * ============================================================ */
  handleListItem(l, opts) {
    const o = opts || {};
    const owner = l.dept
      ? `<span class="m-dept">${escapeHtml(l.dept)}${l.assignee ? " · " + escapeHtml(l.assignee.name) : " · 未指定科室负责人"}</span>`
      : `<span class="m-tag warn">待分派</span>`;
    return `<div class="m-list-item" data-handle="${l.id}">
      <div class="m-li-top"><div class="m-li-title">${escapeHtml(l.title)}</div>${this.stageBadge(l)}</div>
      ${this.liExcerpt(l)}
      <div class="m-li-meta">${this.catBadge(l.category)} <span class="mono">${l.id}</span> ${owner} · 时限 ${effectiveDeadline(l)}
        ${l.urged && l.status !== STATUS.done ? '<span class="m-tag warn">催办</span>' : ""}${isOverdue(l) ? '<span class="m-tag overdue">超期</span>' : ""}${l.reopened ? '<span class="m-tag warn">二次办理</span>' : ""}${o.mineTag ? ' <span class="m-tag info">本人</span>' : ""}</div>
      ${o.action ? `<div style="margin-top:8px">${o.action}</div>` : ""}
    </div>`;
  },

  bindHandleList() {
    document.querySelectorAll("[data-handle]").forEach(el => el.addEventListener("click", () => this.showHandleSheet(el.dataset.handle)));
    document.querySelectorAll("[data-dispatch]").forEach(b => b.addEventListener("click", (e) => { e.stopPropagation(); this.showDispatchSheet(b.dataset.dispatch); }));
  },

  emptyHtml(ico, text) { return `<div class="m-empty" style="padding:18px 0"><span class="ico">${svgIcon(ico)}</span>${text}</div>`; },

  /* 科室分管领导工作台 */
  pLeaderHome() {
    const sec = this.section;
    const ld = this.leader();
    const list = getSectionLetters(sec);
    const approving = list.filter(l => stageOf(l) === STAGE.approving);
    this._after = () => this.bindHandleList();
    return `
    <div class="m-work-hero">
      <h2>${escapeHtml(sec)}</h2>
      <p>${escapeHtml(ld ? ld.name + "（" + (ld.title || "科长") + "）" : "未配置科室分管领导")} ｜ 只审批答复，通过后由科室负责人确认发送</p>
    </div>
    <div class="m-stat-grid">
      ${this.miniStat("待审批", approving.length, "科室负责人已提交", "#006DAD")}
      ${this.miniStat("已退回", list.filter(l => stageOf(l) === STAGE.rejected).length, "负责人再修改", "#DF2027")}
      ${this.miniStat("科室在办", list.filter(l => l.status === STATUS.doing).length, "办理中", "#2A8DC7")}
      ${this.miniStat("超期", list.filter(l => isOverdue(l)).length, "需尽快办结", "#F29100")}
    </div>
    <div class="m-card"><div class="m-card-title">待审批</div>
      ${approving.length ? approving.slice(0, 6).map(l => this.handleListItem(l)).join("") : this.emptyHtml("userCheck", "暂无待审批答复")}</div>
    <div class="m-card"><div class="m-card-title">人员办理情况</div>
      ${sectionMembers(sec, true).filter(m => !m.leader).length ? sectionMembers(sec, true).filter(m => !m.leader).map(m => {
        const items = m.charge ? getMemberLetters(m.id) : getWriterLetters(m.id);
        const todoN = m.charge ? items.filter(isReplierTurn).length : items.filter(isWriterTurn).length;
        return `<div class="m-perf-row"><span class="nm">${escapeHtml(m.name)}</span>
          <span class="mt">${escapeHtml(memberDutyLabel(m))} · 待处理 ${todoN} · 办结 ${items.filter(l => l.status === STATUS.done).length}</span></div>`;
      }).join("") : `<div class="m-no-reply">本科室暂无科室负责人</div>`}
    </div>`;
  },

  pLeaderList(kind) {
    const list = getSectionLetters(this.section).filter(l => stageOf(l) === STAGE.approving)
      .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    this._after = () => this.bindHandleList();
    return `
    <p class="m-section-title">${escapeHtml(this.section)} · 答复须经您审批。通过后由科室负责人确认发送，不会自动发给学生。</p>
    ${list.length ? list.map(l => this.handleListItem(l, { action: `<button class="m-btn m-btn-primary m-btn-sm">审批</button>` })).join("")
      : this.emptyHtml("userCheck", "暂无待审批答复")}`;
  },

  /* 科室负责人工作台 */
  pSectionHome() {
    const sec = this.section;
    const me = this.member;
    const mine = me ? getMemberLetters(me.id) : [];
    const todo = mine.filter(isReplierTurn).sort((a, b) => effectiveDeadline(a).localeCompare(effectiveDeadline(b)));
    const collab = mine.filter(l => stageOf(l) === STAGE.collab).length;
    const approving = mine.filter(l => stageOf(l) === STAGE.approving).length;
    const done = mine.filter(l => l.status === STATUS.done).length;
    this._after = () => {
      this.drawDonut("m-sec-donut", [
        { label: "待我办理", value: todo.length, color: "#2A8DC7" },
        { label: "学院协同中", value: collab, color: "#7A5CC2" },
        { label: "待审批", value: approving, color: "#006DAD" },
        { label: "已办结", value: done, color: "#1BB975" }
      ].filter(x => x.value));
      this.bindHandleList();
    };
    return `
    <div class="m-work-hero">
      <h2>${escapeHtml(me ? me.name : sec)} · 我的工作台</h2>
      <p>${escapeHtml(sec)}${me && me.title ? " · " + escapeHtml(me.title) : ""} ｜ 可自己写，也可同时指定回复人和学院协同</p>
    </div>
    <div class="m-stat-grid">
      ${this.miniStat("待我办理", todo.length, "回复中/已打回/待发送", "#2A8DC7")}
      ${this.miniStat("学院协同中", collab, "等待副书记意见", "#7A5CC2")}
      ${this.miniStat("待审批", approving, "已提交科室分管领导", "#006DAD")}
      ${this.miniStat("我已办结", done, "累计办结", "#1BB975")}
    </div>
    <div class="m-card">
      <div class="m-card-title">待我办理 <span class="more" data-go-todo>全部 ›</span></div>
      ${todo.length ? todo.slice(0, 6).map(l => this.handleListItem(l)).join("") : this.emptyHtml("inbox", "暂无待我办理的来信")}
    </div>
    <div class="m-card">
      <div class="m-card-title">我的办理情况</div>
      <div class="m-chart-wrap"><canvas id="m-sec-donut" width="150" height="150"></canvas></div>
      <div class="m-chart-legend">
        <div class="m-lg"><span class="d" style="background:#2A8DC7"></span>待我办理<span class="v">${todo.length}</span></div>
        <div class="m-lg"><span class="d" style="background:#7A5CC2"></span>学院协同中<span class="v">${collab}</span></div>
        <div class="m-lg"><span class="d" style="background:#006DAD"></span>待审批<span class="v">${approving}</span></div>
        <div class="m-lg"><span class="d" style="background:#1BB975"></span>已办结<span class="v">${done}</span></div>
      </div>
    </div>`;
  },

  pReplierTodo() {
    const me = this.member;
    const mine = me ? getMemberLetters(me.id) : [];
    const tabs = [
      ["todo", "待办", isReplierTurn],
      [STAGE.rejected, "已打回", l => stageOf(l) === STAGE.rejected],
      [STAGE.confirm, "待发送", l => stageOf(l) === STAGE.confirm],
      [STAGE.collab, "协同中", l => stageOf(l) === STAGE.collab],
      [STAGE.approving, "待审批", l => stageOf(l) === STAGE.approving],
      [STAGE.done, "已办结", l => l.status === STATUS.done]
    ];
    const tab = this.state.repTab || "todo";
    const cur = tabs.find(t => t[0] === tab) || tabs[0];
    const list = mine.filter(cur[2]).sort((a, b) => effectiveDeadline(a).localeCompare(effectiveDeadline(b)));
    this._after = () => {
      document.querySelectorAll("[data-seg]").forEach(s => s.addEventListener("click", () => { this.state.repTab = s.dataset.seg; this.render(); }));
      this.bindHandleList();
    };
    return `
    <div class="m-segtabs m-seg-scroll">${tabs.map(t => `<button class="m-seg ${cur[0] === t[0] ? "active" : ""}" data-seg="${t[0]}">${t[1]} ${mine.filter(t[2]).length}</button>`).join("")}</div>
    ${list.length ? list.map(l => this.handleListItem(l)).join("") : this.emptyHtml("inbox", "暂无信件")}`;
  },

  pWriterHome() {
    const me = this.writer;
    const mine = me ? getWriterLetters(me.id) : [];
    const todo = mine.filter(isWriterTurn);
    this._after = () => this.bindHandleList();
    return `
    <div class="m-work-hero">
      <h2>${escapeHtml(me ? me.name : this.section)} · 回复人</h2>
      <p>起草后交回科室负责人。不能提交审批，也不能直接回复学生。</p>
    </div>
    <div class="m-stat-grid">
      ${this.miniStat("待我起草", todo.length, "交回负责人", "#0E8A7D")}
      ${this.miniStat("已交回", mine.filter(l => l.writer && l.writer.status === "returned" && l.status === STATUS.doing).length, "等待确认", "#2A8DC7")}
      ${this.miniStat("与我相关", mine.length, "被指定过", "#006DAD")}
      ${this.miniStat("已办结", mine.filter(l => l.status === STATUS.done).length, "负责人已发送", "#1BB975")}
    </div>
    <div class="m-card"><div class="m-card-title">待我起草</div>
      ${todo.length ? todo.slice(0, 6).map(l => this.handleListItem(l)).join("") : this.emptyHtml("write", "暂无需要您起草的来信")}
    </div>`;
  },

  pWriterTodo() {
    const me = this.writer;
    const mine = me ? getWriterLetters(me.id) : [];
    const tabs = [
      ["todo", "待起草", isWriterTurn],
      ["back", "已交回", l => l.writer && l.writer.status === "returned" && l.status !== STATUS.done],
      ["done", "已办结", l => l.status === STATUS.done]
    ];
    const tab = this.state.writerTab || "todo";
    const cur = tabs.find(t => t[0] === tab) || tabs[0];
    const list = mine.filter(cur[2]);
    this._after = () => {
      document.querySelectorAll("[data-seg]").forEach(s => s.addEventListener("click", () => { this.state.writerTab = s.dataset.seg; this.render(); }));
      this.bindHandleList();
    };
    return `
    <div class="m-segtabs">${tabs.map(t => `<button class="m-seg ${cur[0] === t[0] ? "active" : ""}" data-seg="${t[0]}">${t[1]} ${mine.filter(t[2]).length}</button>`).join("")}</div>
    ${list.length ? list.map(l => this.handleListItem(l)).join("") : this.emptyHtml("write", "暂无信件")}`;
  },

  /* 科室收件箱（分管领导、科室负责人、科室回复人共用） */
  pSectionInbox() {
    const sec = this.section;
    const isRep = this.role === "replier";
    const isWriterRole = this.role === "writer";
    const scope = (isRep || isWriterRole) ? (this.state.secScope || "mine") : "all";
    const tab = this.state.secTab || "全部";
    const kw = this.state.secKw || "";
    const base = getSectionLetters(sec);
    const mineId = isWriterRole ? this.writerId() : this.memberId();
    const mineOf = l => isWriterRole ? (l.writer && l.writer.memberId === mineId) : (l.assignee && l.assignee.memberId === mineId);
    let list = scope === "mine" ? base.filter(mineOf) : base;
    const tabs = {
      "全部": () => true,
      "待回复": l => [STAGE.replying, STAGE.writing, STAGE.collab, STAGE.rejected, STAGE.confirm].includes(stageOf(l)),
      "待审批": l => stageOf(l) === STAGE.approving,
      "已办结": l => l.status === STATUS.done
    };
    const counts = {};
    Object.keys(tabs).forEach(k => { counts[k] = list.filter(tabs[k]).length; });
    list = list.filter(tabs[tab] || tabs["全部"]);
    if (kw) list = list.filter(l => (l.title + l.name + l.id).includes(kw));
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    this._after = () => {
      const inp = document.getElementById("m-sec-search");
      if (inp) inp.addEventListener("input", () => { this.state.secKw = inp.value.trim(); clearTimeout(this._ss); this._ss = setTimeout(() => this.render(), 250); });
      document.querySelectorAll("[data-scope]").forEach(b => b.addEventListener("click", () => { this.state.secScope = b.dataset.scope; this.render(); }));
      document.querySelectorAll("[data-seg]").forEach(s => s.addEventListener("click", () => { this.state.secTab = s.dataset.seg; this.render(); }));
      this.bindHandleList();
    };
    return `
    <p class="m-section-title">${escapeHtml(sec)} · 综合办分到本科室的信件</p>
    ${(isRep || isWriterRole) ? `<div class="m-segtabs">
      <button class="m-seg ${scope === "mine" ? "active" : ""}" data-scope="mine">${isWriterRole ? "我起草的" : "我负责的"} ${base.filter(mineOf).length}</button>
      <button class="m-seg ${scope === "all" ? "active" : ""}" data-scope="all">本科室全部 ${base.length}</button>
    </div>` : ""}
    <div class="m-search"><input id="m-sec-search" placeholder="搜索标题 / 来信人 / 编号" value="${escapeHtml(kw)}"></div>
    <div class="m-segtabs">${Object.keys(tabs).map(t => `<button class="m-seg ${tab === t ? "active" : ""}" data-seg="${t}">${t} ${counts[t]}</button>`).join("")}</div>
    ${list.length ? list.map(l => this.handleListItem(l, { mineTag: (isRep || isWriterRole) && mineOf(l) })).join("")
      : this.emptyHtml("inbox", scope === "mine" ? "暂无指定给我的信件" : "本科室暂无信件")}`;
  },

  /* 学院副书记：协同待办 */
  pCollegeTodo() {
    const col = this.college;
    const c = findCollege(col);
    const list = getCollabLetters(col);
    const openOf = l => (l.collabs || []).some(x => x.college === col && !x.opinion);
    const tab = this.state.colTab || "open";
    const rows = list.filter(l => tab === "open" ? openOf(l) : !openOf(l)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    this._after = () => {
      document.querySelectorAll("[data-seg]").forEach(s => s.addEventListener("click", () => { this.state.colTab = s.dataset.seg; this.render(); }));
      document.querySelectorAll("[data-collab]").forEach(el => el.addEventListener("click", () => this.showCollabSheet(el.dataset.collab)));
    };
    return `
    <div class="m-work-hero">
      <h2>${escapeHtml(col)} · 协同待办</h2>
      <p>${escapeHtml(c ? c.secretary + "（" + (c.title || "副书记") + "）" : "学工系统未同步副书记")} ｜ 指定人员线下承办后写处理意见，发回科室负责人。副书记由学工系统维护，信箱直接使用。</p>
    </div>
    <div class="m-segtabs">
      <button class="m-seg ${tab === "open" ? "active" : ""}" data-seg="open">待写意见 ${list.filter(openOf).length}</button>
      <button class="m-seg ${tab === "done" ? "active" : ""}" data-seg="done">已发回 ${list.filter(l => !openOf(l)).length}</button>
    </div>
    ${rows.length ? rows.map(l => {
      const cb = (l.collabs || []).filter(x => x.college === col).slice(-1)[0] || {};
      return `<div class="m-list-item" data-collab="${l.id}">
        <div class="m-li-top"><div class="m-li-title">${escapeHtml(l.title)}</div>${this.stageBadge(l)}</div>
        <div class="m-li-excerpt">协同说明：${escapeHtml(cb.note || "—")}</div>
        <div class="m-li-meta"><span class="mono">${l.id}</span> <span class="m-dept">${escapeHtml(l.dept || "-")} · ${escapeHtml(l.assignee ? l.assignee.name : "-")}</span> · ${escapeHtml(cb.at || "")}</div>
        ${openOf(l) ? `<div style="margin-top:8px"><button class="m-btn m-btn-primary m-btn-sm">写处理意见</button></div>` : ""}
      </div>`;
    }).join("") : this.emptyHtml("users", tab === "open" ? "暂无待写处理意见的协同信件" : "暂无已发回的协同信件")}`;
  },

  pCollegeVisible() {
    const list = getCollegeVisibleLetters(this.college).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    this._after = () => {
      document.querySelectorAll("[data-collab]").forEach(el => el.addEventListener("click", () => this.showCollabSheet(el.dataset.collab)));
    };
    return `
    <p class="m-section-title">${escapeHtml(this.college)}学生来信中「全部公开」或「仅该学院副书记可见」的已办结信件</p>
    ${list.length ? list.map(l => `<div class="m-list-item" data-collab="${l.id}">
      <div class="m-li-top"><div class="m-li-title">${escapeHtml(l.title)}</div><span class="m-tag ${l.publicScope === "all" ? "ok" : "info"}">${PUBLIC_SCOPE[l.publicScope]}</span></div>
      ${this.liExcerpt(l)}
      <div class="m-li-meta">${this.catBadge(l.category)} <span class="mono">${l.id}</span> <span class="m-dept">${escapeHtml(l.dept || "-")}</span> · ${escapeHtml(((l.reply && l.reply.time) || "").slice(0, 10))}</div>
    </div>`).join("") : this.emptyHtml("eye", "暂无本学院可见信件")}`;
  },

  /* 办理工作台（综合办） */
  pAdminHome() {
    const all = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const pending = all.filter(l => stageOf(l) === STAGE.pending).sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    const doing = all.filter(l => l.status === STATUS.doing);
    const done = all.filter(l => l.status === STATUS.done).length;
    const overdue = all.filter(l => isOverdue(l)).length;
    const stages = [STAGE.replying, STAGE.writing, STAGE.collab, STAGE.approving, STAGE.rejected, STAGE.confirm];
    this._after = () => {
      this.drawDonut("m-admin-donut", [
        { label: "待分派", value: pending.length, color: "#F29100" },
        { label: "办理中", value: doing.length, color: "#2A8DC7" },
        { label: "已办结", value: done, color: "#1BB975" }
      ].filter(x => x.value));
      this.bindHandleList();
      document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => this.go(b.dataset.go)));
    };
    return `
    <div class="m-work-hero">
      <h2>办理工作台</h2>
      <p>${escapeHtml(MOCK.admin.name)} ｜ 来信统一送达${MOCK.intakeSection}，由您分派负责科室</p>
    </div>
    <div class="m-stat-grid">
      ${this.miniStat("待分派", pending.length, "需尽快分派负责科室", "#F29100")}
      ${this.miniStat("办理中", doing.length, "科室在办", "#2A8DC7")}
      ${this.miniStat("已办结", done, "本周期", "#1BB975")}
      ${this.miniStat("超期预警", overdue, "需督办", "#DF2027")}
    </div>
    <div class="m-card">
      <div class="m-card-title">办理中环节分布</div>
      <div class="m-stage-strip">${stages.map(s => `<div class="m-stage-cell"><b style="color:${stageColor(s)}">${doing.filter(l => stageOf(l) === s).length}</b><span>${s}</span></div>`).join("")}</div>
    </div>
    <div class="m-card">
      <div class="m-card-title">待分派来信 <span class="more" data-go="dispatch">全部 ›</span></div>
      ${pending.length
        ? pending.slice(0, 6).map(l => this.handleListItem(l, { action: `<button class="m-btn m-btn-primary m-btn-sm" data-dispatch="${l.id}">分派负责科室</button>` })).join("")
        : this.emptyHtml("share", "暂无待分派来信")}
    </div>
    <div class="m-card">
      <div class="m-card-title">办理情况概览</div>
      <div class="m-chart-wrap"><canvas id="m-admin-donut" width="150" height="150"></canvas></div>
      <div class="m-chart-legend">
        <div class="m-lg"><span class="d" style="background:#F29100"></span>待分派<span class="v">${pending.length}</span></div>
        <div class="m-lg"><span class="d" style="background:#2A8DC7"></span>办理中<span class="v">${doing.length}</span></div>
        <div class="m-lg"><span class="d" style="background:#1BB975"></span>已办结<span class="v">${done}</span></div>
      </div>
    </div>`;
  },

  /* 待分派信件（综合办） */
  pDispatch() {
    const kw = this.state.dpKw || "";
    const all = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    let list = all.filter(l => stageOf(l) === STAGE.pending);
    const total = list.length;
    const overdueCnt = list.filter(l => isOverdue(l)).length;
    if (kw) list = list.filter(l => (l.title + l.name + l.id + l.affair).includes(kw));
    list.sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    const recent = all.filter(l => (l.dispatches || []).length)
      .map(l => ({ l: l, d: l.dispatches[l.dispatches.length - 1] }))
      .sort((a, b) => (b.d.at || "").localeCompare(a.d.at || "")).slice(0, 4);
    this._after = () => {
      const inp = document.getElementById("m-dp-search");
      if (inp) inp.addEventListener("input", () => { this.state.dpKw = inp.value.trim(); clearTimeout(this._ds); this._ds = setTimeout(() => this.render(), 250); });
      this.bindHandleList();
    };
    return `
    <div class="m-stat-grid m-stat-3">
      ${this.miniStat("待分派", total, "等待分派负责科室", "#F29100")}
      ${this.miniStat("其中超期", overdueCnt, "超办结时限", "#DF2027")}
      ${this.miniStat("承办科室", MOCK.sections.length, "各设一位科室分管领导", "#2A8DC7")}
    </div>
    <p class="m-section-title">选择负责科室，系统带出该科室的科室分管领导</p>
    <div class="m-search"><input id="m-dp-search" placeholder="搜索标题 / 来信人 / 事务 / 编号" value="${escapeHtml(kw)}"></div>
    ${list.length
      ? list.map(l => this.handleListItem(l, { action: `<button class="m-btn m-btn-primary m-btn-sm" data-dispatch="${l.id}">分派负责科室</button>` })).join("")
      : this.emptyHtml("share", "暂无待分派来信")}
    <div class="m-section-title" style="margin-top:16px">最近分派记录</div>
    ${recent.length ? recent.map(({ l, d }) => `<div class="m-list-item" data-handle="${l.id}">
      <div class="m-li-title">${escapeHtml(l.title)}</div>
      <div class="m-li-meta"><span class="mono">${l.id}</span> <span class="m-dept">${escapeHtml(d.type || "分派")} · ${escapeHtml(d.section)} · ${escapeHtml(d.name)}</span> · ${escapeHtml(d.at || "")}</div>
    </div>`).join("") : `<div class="m-no-reply">暂无分派记录</div>`}`;
  },

  /* 信件收件箱（综合办） */
  pInbox() {
    const tab = this.state.inboxTab || "全部";
    const kw = this.state.inboxKw || "";
    let list = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const tabs = ["全部", STATUS.pending, STATUS.doing, STATUS.done, STATUS.withdrawn];
    const counts = {};
    tabs.forEach(t => { counts[t] = t === "全部" ? list.length : list.filter(l => l.status === t).length; });
    if (tab !== "全部") list = list.filter(l => l.status === tab);
    if (kw) list = list.filter(l => (l.title + l.name + l.id + deptLabel(l) + (assigneeLabel(l) || "")).includes(kw));
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    this._after = () => {
      const inp = document.getElementById("m-inbox-search");
      if (inp) inp.addEventListener("input", () => { this.state.inboxKw = inp.value.trim(); clearTimeout(this._is); this._is = setTimeout(() => this.render(), 250); });
      document.querySelectorAll("[data-seg]").forEach(s => s.addEventListener("click", () => { this.state.inboxTab = s.dataset.seg; this.render(); }));
      this.bindHandleList();
    };
    return `
    <div class="m-search"><input id="m-inbox-search" placeholder="搜索标题 / 来信人 / 科室 / 科室负责人 / 编号" value="${escapeHtml(kw)}"></div>
    <div class="m-segtabs m-seg-scroll">${tabs.map(t => `<button class="m-seg ${tab === t ? "active" : ""}" data-seg="${t}">${t} ${counts[t]}</button>`).join("")}</div>
    ${list.length ? list.map(l => this.handleListItem(l, {
      action: stageOf(l) === STAGE.pending ? `<button class="m-btn m-btn-primary m-btn-sm" data-dispatch="${l.id}">分派负责科室</button>` : ""
    })).join("") : this.emptyHtml("inbox", "暂无信件")}`;
  },

  /* 督办催办（单封督办；批量催办仅桌面端） */
  pSupervise() {
    const all = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const overdue = all.filter(l => isOverdue(l));
    const urged = all.filter(l => l.urged && l.status !== STATUS.done);
    const pendingOverdue = overdue.filter(l => stageOf(l) === STAGE.pending).length;
    this._after = () => {
      this.bindHandleList();
      document.querySelectorAll("[data-remind]").forEach(b => b.addEventListener("click", (e) => {
        e.stopPropagation();
        const l = getLetterById(b.dataset.remind);
        if (!l) return;
        sendUrge(l, MOCK.urgeChannels, "admin"); upsertLetter(l);
        this.toast(`已通过${channelLabel(MOCK.urgeChannels)}督办 ${urgeTarget(l)}`); this.render();
      }));
    };
    const item = (l) => `<div class="m-list-item" data-handle="${l.id}">
      <div class="m-li-top"><div class="m-li-title">${escapeHtml(l.title)}</div>${this.stageBadge(l)}</div>
      <div class="m-li-meta"><span class="mono">${l.id}</span> <span class="m-dept">当前办理人：${escapeHtml(handlerLabel(l))}</span>
        · 时限 ${effectiveDeadline(l)}${isOverdue(l) ? ' <span class="m-tag overdue">超期</span>' : ""}${l.urged ? ' <span class="m-tag warn">催办</span>' : ""}</div>
      <div style="margin-top:8px">${stageOf(l) === STAGE.pending
        ? `<button class="m-btn m-btn-primary m-btn-sm" data-dispatch="${l.id}">去分派</button>`
        : `<button class="m-btn m-btn-outline m-btn-sm" data-remind="${l.id}">督办提醒</button>`}</div>
    </div>`;
    return `
    <div class="m-stat-grid">
      ${this.miniStat("超期未办结", overdue.length, "需重点督办", "#DF2027")}
      ${this.miniStat("超期未分派", pendingOverdue, "综合办待分派", "#F29100")}
      ${this.miniStat("学生催办", urged.length, "已收到催办", "#F29100")}
      ${this.miniStat("临期待办", all.filter(l => !isOverdue(l) && l.status === STATUS.doing).length, "临近时限", "#2A8DC7")}
    </div>
    <p class="m-hint">督办提醒发给信件当前办理人；批量催办请在桌面端操作。</p>
    <div class="m-section-title">超期未办结清单</div>
    ${overdue.length ? overdue.map(item).join("") : this.emptyHtml("clock", "暂无超期信件，办理情况良好")}
    <div class="m-section-title" style="margin-top:16px">学生催办件</div>
    ${urged.length ? urged.map(item).join("") : this.emptyHtml("megaphone", "暂无催办件")}`;
  },

  /* 统计分析（mirror renderAnalytics） */
  pAnalytics() {
    const gran = this.state.anGran || "month";
    const granLabel = { year: "年度", quarter: "季度", month: "月度" };
    const all = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const byCat = MOCK.letterCategories.map(c => ({ label: c.label, color: c.color, value: all.filter(l => l.category === c.label).length })).filter(x => x.value);
    const byStatus = [[STATUS.pending, "#F29100"], [STATUS.doing, "#2A8DC7"], [STATUS.done, "#1BB975"]]
      .map(([st, c]) => ({ label: st, color: c, value: all.filter(l => l.status === st).length }));
    const maxStatus = Math.max(...byStatus.map(s => s.value), 1);
    const byDept = {}; all.filter(l => l.dept).forEach(l => byDept[l.dept] = (byDept[l.dept] || 0) + 1);
    const deptRows = Object.entries(byDept).sort((a, b) => b[1] - a[1]);
    const byMember = {};
    all.filter(l => l.assignee && l.assignee.memberId).forEach(l => {
      const k = l.assignee.memberId;
      if (!byMember[k]) byMember[k] = { name: l.assignee.name, title: l.assignee.title || "", items: [] };
      byMember[k].items.push(l);
    });
    const memberRows = Object.values(byMember).sort((a, b) => b.items.length - a.items.length).slice(0, 8);
    const done = all.filter(l => l.status === STATUS.done).length;
    const trend = bucketCounts(all, gran);
    const maxTrend = Math.max(...trend.map(t => t.value), 1);
    this._after = () => {
      this.drawDonut("m-an-donut", byCat);
      document.querySelectorAll("[data-angran]").forEach(s => s.addEventListener("click", () => { this.state.anGran = s.dataset.angran; this.render(); }));
    };
    return `
    <div class="m-stat-grid">
      ${this.miniStat("来信总量", all.length, this.mailbox, "#2A8DC7")}
      ${this.miniStat("办结率", (all.length ? Math.round(done / all.length * 100) : 0) + "%", "已办结/总量", "#1BB975")}
      ${this.miniStat("待分派", all.filter(l => l.status === STATUS.pending).length, "待综合办分派", "#F29100")}
      ${this.miniStat("好评率", this.satisfaction(all) + "%", "4星及以上", "#F29100")}
    </div>
    <div class="m-card">
      <div class="m-card-title">来信量趋势</div>
      <div class="m-segtabs">${["year", "quarter", "month"].map(g => `<button class="m-seg ${gran === g ? "active" : ""}" data-angran="${g}">${granLabel[g]}</button>`).join("")}</div>
      ${trend.length ? trend.map(t => `<div class="m-bar-row"><span class="lbl">${t.label}</span><span class="m-bar-track"><span class="m-bar-fill" style="width:${t.value / maxTrend * 100}%;background:#2A8DC7"></span></span><span class="val">${t.value}</span></div>`).join("") : `<div class="m-no-reply">暂无数据</div>`}
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
      ${deptRows.length ? deptRows.map(([d, v]) => {
        const items = all.filter(l => l.dept === d);
        const dn = items.filter(l => l.status === STATUS.done).length;
        const rd = items.filter(l => l.rating);
        const avg = rd.length ? (rd.reduce((s, x) => s + x.rating, 0) / rd.length).toFixed(1) : "-";
        return `<div class="m-perf-row"><span class="nm">${d.replace(/（.*）/, "")}</span><span class="mt">承办 ${v} · 办结 ${dn} · ${Math.round(dn / v * 100)}%${avg === "-" ? "" : " · ★" + avg}</span></div>`;
      }).join("") : `<div class="m-no-reply">暂无数据</div>`}
    </div>
    <div class="m-card">
      <div class="m-card-title">科室负责人办理绩效 Top8</div>
      ${memberRows.length ? memberRows.map(m => {
        const dn = m.items.filter(l => l.status === STATUS.done).length;
        const rd = m.items.filter(l => l.rating);
        const avg = rd.length ? (rd.reduce((s, x) => s + x.rating, 0) / rd.length).toFixed(1) : "-";
        return `<div class="m-perf-row"><span class="nm">${escapeHtml(m.name)}</span><span class="mt">${escapeHtml(m.title)} · 负责 ${m.items.length} · 办结 ${dn}${avg === "-" ? "" : " · ★" + avg}</span></div>`;
      }).join("") : `<div class="m-no-reply">暂无分派记录</div>`}
    </div>`;
  },

  /* 办理抽屉：按身份和环节展示可做的操作 */
  showHandleSheet(id) {
    const l = getLetterById(id);
    if (!l) return;
    const role = this.role;
    if (role === "college") { this.showCollabSheet(id); return; }
    if ((role === "leader" || role === "replier" || role === "writer") && l.dept !== this.section) {
      this.toast(l.dept ? "该信件不属于本科室" : `该信件尚未分派，正在${MOCK.intakeSection}受理`); return;
    }
    const st = stageOf(l);
    const isLeader = role === "leader";
    const isMine = role === "replier" && l.assignee && l.assignee.memberId === this.memberId();
    const isWriter = role === "writer" && l.writer && l.writer.memberId === this.writerId() && writerDrafting(l);
    const draft = (l.replyDraft && l.replyDraft.content) || "";
    const lastReject = (l.approvals || []).slice().reverse().find(a => a.result === "reject");
    const latestOpinion = (l.collabs || []).slice().reverse().find(c => c.opinion);
    const blocks = [];
    const acts = [];

    if (role === "admin") {
      if (st === STAGE.pending) acts.push(`<button class="m-btn m-btn-primary" id="mh-dispatch">${svgIcon("share")} 分派负责科室</button>`);
      else if (l.status === STATUS.doing) acts.push(`<button class="m-btn m-btn-outline" id="mh-dispatch">改派科室</button>`);
      if ((l.status === STATUS.doing || l.status === STATUS.pending) && !l.urged) acts.push(`<button class="m-btn m-btn-outline" id="mh-urge">督办提醒</button>`);
    }

    if (isLeader && st === STAGE.approving) {
      blocks.push(`<div class="m-sec"><div class="m-sec-t">审批答复</div>
        <div class="m-reply draft"><div class="draft-flag">待审批 · ${escapeHtml(assigneeLabel(l))} 提交</div>${contentHtml(draft)}</div>
        ${latestOpinion ? `<div class="cb-opinion"><b>学院处理意见</b>：${escapeHtml(latestOpinion.opinion)}</div>` : ""}
        <div class="m-field" style="margin-top:8px"><label>审批意见（打回时必填）</label><textarea id="mh-opinion" rows="3" placeholder="通过可不填；打回请写明修改意见"></textarea></div>
        <p class="m-hint">科室分管领导只审批，不直接修改或发送；通过后由科室负责人确认发送。</p></div>`);
      acts.push(`<div class="m-btn-row"><button class="m-btn m-btn-danger" id="mh-reject">打回修改</button><button class="m-btn m-btn-primary" id="mh-pass">审批通过</button></div>`);
    }

    if (isMine && [STAGE.replying, STAGE.rejected, STAGE.collab, STAGE.writing].includes(st)) {
      const col = collegeList(true).find(c => c.name === l.unit);
      const open = openCollab(l);
      const drafting = writerDrafting(l);
      const writers = writerCandidates(l.dept);
      const canWriter = writers.length > 0;
      const canCollab = !!(col && !open);
      blocks.push(`<div class="m-sec"><div class="m-sec-t">${st === STAGE.rejected ? "按审批意见继续办理" : "办理安排"}</div>
        ${st === STAGE.rejected && lastReject ? `<div class="reject-banner"><b>审批退回</b>（${escapeHtml(lastReject.by)}）：${escapeHtml(lastReject.opinion)}</div>` : ""}
        ${latestOpinion ? `<div class="cb-opinion"><b>${escapeHtml(latestOpinion.college)}处理意见</b>：${escapeHtml(latestOpinion.opinion)}</div>` : ""}
        ${drafting ? `<div class="m-no-reply">科室回复人 ${escapeHtml(writerLabel(l))} 正在起草，稿件交回后再提交审批。</div>` : ""}
        ${open ? `<div class="m-no-reply">已请 ${escapeHtml(open.college)}副书记 ${escapeHtml(open.secretary)} 协同，可同时指定科室回复人。</div>` : ""}
        ${(canWriter || canCollab) ? `<p class="m-hint">指定科室回复人和发起学院协同可以同时勾选，也可以分步办理。</p>
          ${canWriter ? `<label class="form-check"><input type="checkbox" id="mh-writer-on"> 指定科室回复人</label>
            <div class="m-field"><select id="mh-writer-pick">${writers.map(m => `<option value="${escapeHtml(m.id)}" ${l.writer && l.writer.memberId === m.id ? "selected" : ""}>${escapeHtml(m.name)}${m.title ? " · " + escapeHtml(m.title) : ""}</option>`).join("")}</select></div>
            <div class="m-field"><input id="mh-writer-note" placeholder="给回复人的说明（可选）"></div>` : ""}
          ${canCollab ? `<label class="form-check"><input type="checkbox" id="mh-collab-on"> 发起学院协同（${escapeHtml(col.secretary)}）</label>
            <div class="m-field"><textarea id="mh-collab-note" rows="2" placeholder="需要学院核实或承办的事项"></textarea></div>` : ""}` : ""}
      </div>`);
      if (canWriter || canCollab) acts.push(`<button class="m-btn m-btn-outline" id="mh-arrange">确认办理安排</button>`);
      if (!drafting) {
        blocks.push(`<div class="m-sec"><div class="m-sec-t">${st === STAGE.rejected ? "自己修改答复" : "自己撰写答复"}</div>
          <div class="m-field"><label class="req">答复内容</label><textarea id="mh-reply" rows="5" placeholder="可自己撰写。回复人交回稿件后，由您确认再提交审批。">${escapeHtml(draft)}</textarea></div>
          <p class="m-hint">提交后由科室分管领导审批。通过后回到您这里确认发送。</p></div>`);
        acts.push(`<button class="m-btn m-btn-primary" id="mh-submit">${st === STAGE.rejected ? "修改后再次提交审批" : "提交科室分管领导审批"}</button>`);
        acts.push(`<button class="m-btn m-btn-outline" id="mh-save">暂存答复</button>`);
      }
    }

    if (isWriter) {
      blocks.push(`<div class="m-sec"><div class="m-sec-t">起草答复</div>
        ${latestOpinion ? `<div class="cb-opinion"><b>学院处理意见（供参考）</b>：${escapeHtml(latestOpinion.opinion)}</div>` : ""}
        ${l.writer && l.writer.note ? `<p class="m-hint">科室负责人说明：${escapeHtml(l.writer.note)}</p>` : ""}
        <div class="m-field"><label class="req">答复稿</label><textarea id="mh-reply" rows="5" placeholder="写完后交回科室负责人">${escapeHtml(draft)}</textarea></div>
        <p class="m-hint">不要直接回复学生，也不要自己提交审批。</p></div>`);
      acts.push(`<button class="m-btn m-btn-primary" id="mh-writer-submit">交回科室负责人</button>`);
      acts.push(`<button class="m-btn m-btn-outline" id="mh-save">暂存稿件</button>`);
    }

    if (isMine && st === STAGE.approving) {
      blocks.push(`<div class="m-sec"><div class="m-sec-t">等待审批</div><div class="m-no-reply">答复已提交 ${escapeHtml(leaderLabel(l))} 审批，通过后由您确认发送。</div></div>`);
    }
    if (isMine && st === STAGE.confirm) {
      blocks.push(`<div class="m-sec"><div class="m-sec-t">确认发送</div>
        <div class="m-reply draft"><div class="draft-flag ok">科室分管领导已审批通过</div>${contentHtml(draft)}</div>
        <div class="m-field" style="margin-top:10px"><label class="req">公开范围</label>
          <div class="m-radio m-radio-col">
            <label><input type="radio" name="mh-scope" value="all"><span>全部公开</span></label>
            <label><input type="radio" name="mh-scope" value="college"><span>仅该学院副书记可见</span></label>
          </div>
          <p class="m-hint">来信学生本人始终可看到正式答复。</p></div></div>`);
      acts.push(`<button class="m-btn m-btn-primary" id="mh-send">确认发送并办结</button>`);
    }
    if (role === "replier" && !isMine && l.status !== STATUS.done) {
      blocks.push(`<div class="m-sec"><div class="m-sec-t">办理答复</div><div class="m-no-reply">${l.assignee ? `本信件由 ${escapeHtml(assigneeLabel(l))} 负责，您可查看但不能代为办理` : "本信件尚未分派到科室负责人"}</div></div>`);
    }
    if (role === "writer" && !isWriter && l.status !== STATUS.done) {
      blocks.push(`<div class="m-sec"><div class="m-sec-t">起草答复</div><div class="m-no-reply">${writerDrafting(l) ? `本信件由 ${escapeHtml(writerLabel(l))} 起草` : "这封信当前没有指定您起草"}</div></div>`);
    }

    const body = `
      ${this.letterDetailBody(l, "view")}
      <div class="m-sec"><div class="m-sec-t">来信人与承办信息</div>
        <div class="m-content-box">
          <p>来信人：${escapeHtml(l.name)}　${escapeHtml(l.unit || "-")}　${escapeHtml(l.phone || "-")}</p>
          <p>承办科室：${escapeHtml(deptLabel(l))}　科室分管领导：${escapeHtml(leaderLabel(l) || "—")}</p>
          <p>科室负责人：${escapeHtml(assigneeLabel(l) || "—")}　科室回复人：${escapeHtml(writerLabel(l) || "未指定")}</p>
          <p>当前办理人：${escapeHtml(handlerLabel(l))}</p>
        </div>
      </div>
      ${blocks.join("")}
      ${acts.length ? `<div class="m-sheet-actions">${acts.join("")}</div>` : ""}`;
    const title = role === "admin" ? (st === STAGE.pending ? "信件受理（综合办）" : "信件督办（综合办）")
      : (isLeader ? (st === STAGE.approving ? "审批答复" : "信件详情（本科室）")
        : (role === "writer" ? (isWriter ? "起草答复" : "信件详情（本科室）")
          : (isMine ? `信件办理 · ${st}` : "信件详情（本科室）")));
    this.showSheet(title, body);
    this.bindAttachments(() => this.showHandleSheet(id));
    this.bindHandleSheet(l);
  },

  bindHandleSheet(l) {
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener("click", fn); };
    const done = (msg) => { upsertLetter(l); this.toast(msg); this.closeSheet(); this.render(); };
    const replyText = () => ((document.getElementById("mh-reply") || {}).value || "").trim();
    on("mh-dispatch", () => this.showDispatchSheet(l.id));
    on("mh-urge", () => { sendUrge(l, MOCK.urgeChannels, "admin"); done(`已通过${channelLabel(MOCK.urgeChannels)}督办 ${urgeTarget(l)}`); });
    on("mh-arrange", () => {
      const useW = !!((document.getElementById("mh-writer-on") || {}).checked);
      const useC = !!((document.getElementById("mh-collab-on") || {}).checked);
      if (!useW && !useC) { this.toast("请勾选科室回复人、学院协同，或两项同时勾选"); return; }
      if (useW) {
        const mid = ((document.getElementById("mh-writer-pick") || {}).value || "");
        if (!mid) { this.toast("请选择科室回复人"); return; }
        const same = l.writer && l.writer.status === "drafting" && l.writer.memberId === mid;
        if (!same) {
          const rec = assignWriter(l, mid, ((document.getElementById("mh-writer-note") || {}).value || "").trim());
          if (!rec) { this.toast("无法指定该科室回复人"); return; }
        }
      }
      if (useC && !openCollab(l)) {
        const note = ((document.getElementById("mh-collab-note") || {}).value || "").trim();
        if (!note) { this.toast("请填写协同说明"); return; }
        if (!startCollab(l, note)) { this.toast("无法发起学院协同"); return; }
      }
      done(useW && useC ? "已同时指定科室回复人和学院协同" : (useW ? "已指定科室回复人" : "已发起学院协同"));
    });
    on("mh-writer-submit", () => {
      const txt = replyText();
      if (txt.length < 10) { this.toast("请填写答复稿（不少于10字）"); return; }
      if (!submitWriterDraft(l, txt)) { this.toast("当前不能交回稿件"); return; }
      done(`稿件已交回科室负责人 ${l.assignee ? l.assignee.name : ""}`);
    });
    on("mh-pass", () => { approveReply(l, true, ((document.getElementById("mh-opinion") || {}).value || "").trim()); done("审批通过，已提醒科室负责人确认发送"); });
    on("mh-reject", () => {
      const op = ((document.getElementById("mh-opinion") || {}).value || "").trim();
      if (!op) { this.toast("打回时请填写修改意见"); return; }
      approveReply(l, false, op); done("已打回科室负责人修改");
    });
    on("mh-save", () => { saveReplyDraft(l, replyText()); upsertLetter(l); this.toast("答复已暂存"); });
    on("mh-submit", () => {
      const txt = replyText();
      if (writerDrafting(l)) { this.toast("科室回复人还未交回稿件"); return; }
      if (txt.length < 10) { this.toast("请填写答复内容（不少于10字）"); return; }
      if (!submitApproval(l, txt)) { this.toast("当前不能提交审批"); return; }
      done(`已提交 ${l.leader ? l.leader.name : "科室分管领导"} 审批`);
    });
    on("mh-collab", () => {
      const txt = replyText();
      if (txt) saveReplyDraft(l, txt);
      upsertLetter(l); this.showCollabStartSheet(l.id);
    });
    on("mh-send", () => {
      const scope = (document.querySelector('input[name="mh-scope"]:checked') || {}).value;
      if (!scope) { this.toast("请选择公开范围"); return; }
      confirmSend(l, scope); done(`已发送给来信人并办结（${PUBLIC_SCOPE[scope]}）`);
    });
  },

  /* 科室负责人发起学院协同 */
  showCollabStartSheet(id) {
    const l = getLetterById(id);
    const c = l && collegeList(true).find(x => x.name === l.unit);
    if (!c) { this.toast("来信学生所在学院没有副书记。副书记由学工系统维护，信箱直接使用"); return; }
    this.showSheet("发起学院协同", `
      <div class="m-dispatch-target"><div class="dt">${escapeHtml(l.title)}</div>
        <div class="dm"><span class="mono">${l.id}</span> · ${escapeHtml(l.name)} · ${escapeHtml(l.unit || "-")}</div></div>
      <div class="m-content-box" style="margin:10px 0"><p>协同学院：${escapeHtml(c.name)}</p><p>副书记：${escapeHtml(c.secretary)}（${escapeHtml(c.title || "副书记")}）</p></div>
      <div class="m-field"><label class="req">协同说明</label><textarea id="mcb-note" rows="3" placeholder="请说明需要学院核实或承办的事项"></textarea></div>
      <p class="m-hint">直接发给学生所在学院的副书记；线下承办不作为系统审批环节。</p>
      <div class="m-sheet-actions"><div class="m-btn-row">
        <button class="m-btn m-btn-outline" id="mcb-back">返回</button>
        <button class="m-btn m-btn-primary" id="mcb-send">发送协同请求</button>
      </div></div>`);
    document.getElementById("mcb-send").addEventListener("click", () => {
      const note = document.getElementById("mcb-note").value.trim();
      if (!note) { this.toast("请填写协同说明"); return; }
      startCollab(l, note); upsertLetter(l);
      this.toast(`已请 ${c.name}副书记 ${c.secretary} 协同`); this.closeSheet(); this.render();
    });
    document.getElementById("mcb-back").addEventListener("click", () => this.showHandleSheet(id));
  },

  /* 学院副书记：查看协同信件 / 写处理意见 */
  showCollabSheet(id) {
    const l = getLetterById(id);
    if (!l) return;
    const mine = (l.collabs || []).filter(c => c.college === this.college);
    const visible = l.status === STATUS.done && l.unit === this.college && (l.publicScope === "all" || l.publicScope === "college");
    if (!mine.length && !visible) { this.toast("该信件不在本学院协同或可见范围内"); return; }
    const open = mine.slice().reverse().find(c => !c.opinion);
    this.showSheet(open ? "写处理意见" : "信件详情（学院）", `
      ${this.letterDetailBody(l, "view")}
      ${open ? `<div class="m-sec"><div class="m-sec-t">处理意见</div>
        <div class="cb-note">协同说明（${escapeHtml(open.by || "")}）：${escapeHtml(open.note || "—")}</div>
        <div class="m-field" style="margin-top:8px"><label class="req">处理意见</label><textarea id="mcol-op" rows="4" placeholder="请填写处理意见"></textarea></div>
        <p class="m-hint">处理意见发回科室负责人，由其拟写答复并提交科室分管领导审批。</p></div>
      <div class="m-sheet-actions"><button class="m-btn m-btn-primary" id="mcol-send">发回科室负责人</button></div>` : ""}`);
    const send = document.getElementById("mcol-send");
    if (send) send.addEventListener("click", () => {
      const op = document.getElementById("mcol-op").value.trim();
      if (op.length < 5) { this.toast("请填写处理意见（不少于5字）"); return; }
      collabOpinion(l, op); upsertLetter(l);
      this.toast(`处理意见已发回 ${l.assignee ? l.assignee.name : "科室负责人"}`); this.closeSheet(); this.render();
    });
    this.bindAttachments(() => this.showCollabSheet(id));
  },

  /* 分派抽屉：选择负责科室，并分给该科室的科室负责人 */
  showDispatchSheet(id) {
    const l = getLetterById(id);
    if (!l) return;
    if (this.role !== "admin") { this.toast(`仅${MOCK.intakeSection}可分派`); return; }
    const isTransfer = !!l.dept;
    this.state.dpSec = "";
    this.showSheet(isTransfer ? "改派科室" : "分派负责科室", `
      <div class="m-dispatch-target">
        <div class="dt">${escapeHtml(l.title)}</div>
        <div class="dm"><span class="mono">${l.id}</span> · ${escapeHtml(l.name)} · ${escapeHtml(l.unit || "-")} · ${l.date}</div>
        <div class="dg">${this.catBadge(l.category)} <span class="m-tag">${escapeHtml(l.affair)}</span>
          ${isTransfer ? `<span class="m-tag warn">原科室 ${escapeHtml(l.dept)} · ${escapeHtml(l.assignee ? l.assignee.name : "")}</span>` : ""}</div>
      </div>
      <div class="m-sec"><div class="m-sec-t">选择承办科室</div>
        <div class="m-pick" id="mdp-secs">
          ${MOCK.sections.map(s => {
            const charge = sectionCharge(s.name);
            const self = s.name === l.dept;
            return `<button type="button" class="m-pick-item" data-sec="${escapeHtml(s.name)}" ${charge && !self ? "" : "disabled"}>
              <span class="n">${escapeHtml(s.name)}${self ? '<span class="r">当前</span>' : ""}</span>
              <span class="s">${charge ? `科室负责人 ${escapeHtml(charge.name)} · 在办 ${getSectionLetters(s.name).filter(x => x.status === STATUS.doing).length}` : "未设置科室负责人"}</span>
            </button>`;
          }).join("")}
        </div>
        <div class="m-hint" id="mdp-hint">请指定负责科室，并分派给该科室的科室负责人</div>
      </div>
      <div class="m-field"><label>分派说明（可选）</label>
        <textarea id="mdp-note" rows="2" placeholder="如：请科室核实后答复"></textarea></div>
      <div class="m-sheet-actions">
        <button class="m-btn m-btn-primary" id="mdp-confirm">${isTransfer ? "确认改派" : "确认分派"}</button>
        <button class="m-btn m-btn-outline" id="mdp-cancel">取消</button>
      </div>`);
    document.querySelectorAll("#mdp-secs [data-sec]").forEach(b => b.addEventListener("click", () => {
      if (b.disabled) return;
      this.state.dpSec = b.dataset.sec;
      document.querySelectorAll("#mdp-secs [data-sec]").forEach(x => x.classList.toggle("on", x === b));
      const charge = sectionCharge(this.state.dpSec);
      document.getElementById("mdp-hint").textContent = `将分派负责科室 ${this.state.dpSec}，科室负责人 ${charge ? charge.name : ""}`;
    }));
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener("click", fn); };
    on("mdp-confirm", () => {
      const sec = this.state.dpSec;
      if (!sec) { this.toast("请选择负责科室"); return; }
      const rec = assignSection(l, sec, ((document.getElementById("mdp-note") || {}).value || "").trim());
      if (!rec) { this.toast("该科室未设置科室负责人"); return; }
      upsertLetter(l);
      this.toast(`已${isTransfer ? "改派" : "分派"}至 ${sec}，已通知科室负责人 ${rec.name}`);
      this.closeSheet(); this.render();
    });
    on("mdp-cancel", () => this.closeSheet());
  },

  /* 信件详情（学生/公开/查看） */
  showLetterDetail(id, mode) {
    const l = getLetterById(id);
    if (!l) return;
    if (l.status === STATUS.draft) {
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

  /* mode：student（本人）/ public（公开信件）/ view（办理端） */
  letterDetailBody(l, mode) {
    const ext = mode === "student" || mode === "public";
    const log = buildProcessLog(l, ext);
    const next = nextStepText(l);
    const supsHtml = mode === "public" ? "" : supplementItemsHtml(l, "m-tag");
    const urgeHtml = ext ? "" : reminderItemsHtml(l);
    const dpHtml = ext ? "" : dispatchItemsHtml(l, "m-tag");
    const cbHtml = ext ? "" : collabItemsHtml(l);
    const apHtml = ext ? "" : approvalItemsHtml(l);
    const msgs = mode === "public" ? [] : letterMessages(l, ext);
    const draft = l.replyDraft && l.replyDraft.content;
    const owner = l.dept
      ? `<span class="m-tag">承办：${escapeHtml(l.dept)}</span>${!ext && l.leader ? `<span class="m-tag">科室分管领导：${escapeHtml(l.leader.name)}</span>` : ""}${l.assignee ? `<span class="m-tag info">科室负责人：${escapeHtml(l.assignee.name)}</span>` : ""}`
      : `<span class="m-tag warn">待${MOCK.intakeSection}分派</span>`;
    const replyHtml = l.reply
      ? `<div class="m-reply"><div class="m-content-box" style="background:transparent;padding:0">${contentHtml(l.reply.content)}</div><div class="rt">—— ${escapeHtml(l.reply.dept)}${l.reply.by ? " · " + escapeHtml(l.reply.by) : ""} · ${escapeHtml(l.reply.time)}</div></div>`
        + (!ext && l.publicScope ? `<div class="scope-line">公开范围：<span class="m-tag ${l.publicScope === "all" ? "ok" : "info"}">${PUBLIC_SCOPE[l.publicScope]}</span></div>` : "")
      : (ext
        ? `<div class="m-no-reply">${l.status === STATUS.pending ? `${MOCK.intakeSection}已收到来信，正在分给承办科室` : (l.status === STATUS.withdrawn ? "来信已撤回" : "承办科室正在办理，正式答复经科室分管领导审批后发送给您")}</div>`
        : (draft ? `<div class="m-reply draft"><div class="draft-flag">答复草稿 · 未发送</div>${contentHtml(draft)}<div class="rt">—— ${escapeHtml(l.replyDraft.by || "")} · ${escapeHtml(l.replyDraft.at || "")}</div></div>` : `<div class="m-no-reply">尚无答复内容</div>`));
    const prevHtml = (l.prevReplies || []).map((r, i) => `<div class="m-reply prev"><div class="draft-flag">第 ${i + 1} 次答复（已申请二次办理）</div>${contentHtml(r.content || "")}<div class="rt">—— ${escapeHtml(r.dept || "")} · ${escapeHtml(r.time || "")}</div></div>`).join("");
    return `
    <div class="m-detail-title">${escapeHtml(l.title)}</div>
    <div class="m-detail-meta"><span class="mono">${l.id}</span> · ${l.mailbox} · ${l.date} ${ext ? this.statusBadge(l.status) : this.stageBadge(l)}</div>
    <div class="m-detail-tags">${this.catBadge(l.category)} <span class="m-tag">${l.affair}</span> ${owner}
      ${mode !== "public" ? `<span class="m-tag">办结时限：${effectiveDeadline(l)}</span>` : ""}${mode !== "public" && isOverdue(l) ? ' <span class="m-tag overdue">超期</span>' : ""}${l.reopened ? ' <span class="m-tag warn">二次办理</span>' : ""}${mode !== "public" && l.urged ? ' <span class="m-tag warn">已催办</span>' : ""}</div>
    <div class="m-sec"><div class="m-sec-t">信件内容</div><div class="m-content-box">${contentHtml(l.content)}</div>
      ${l.attachments && l.attachments.length ? `<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px">${attachChipsHtml(l.attachments, "m-tag")}</div>` : ""}</div>
    ${mode === "student" && l.ack ? `<div class="m-sec"><div class="m-sec-t">收悉回执</div><div class="ack-box">${escapeHtml(l.ack.text).replace(/\n/g, "<br>")}</div></div>` : ""}
    ${supsHtml ? `<div class="m-sec"><div class="m-sec-t">补充材料</div>${supsHtml}</div>` : ""}
    ${dpHtml ? `<div class="m-sec"><div class="m-sec-t">分派记录</div>${dpHtml}</div>` : ""}
    ${cbHtml ? `<div class="m-sec"><div class="m-sec-t">学院协同</div>${cbHtml}</div>` : ""}
    ${apHtml ? `<div class="m-sec"><div class="m-sec-t">审批记录</div>${apHtml}</div>` : ""}
    ${urgeHtml ? `<div class="m-sec"><div class="m-sec-t">催办记录</div>${urgeHtml}</div>` : ""}
    <div class="m-sec"><div class="m-sec-t">办理流程</div><div class="m-timeline">
      ${log.map(s => `<div class="m-tl"><div class="s">${s.step}</div><div class="m">${s.time} · ${s.actor}</div><div class="n">${s.note}</div></div>`).join("")}
      ${next && !ext ? `<div class="m-tl pending"><div class="s" style="color:var(--text-muted)">${next}</div></div>` : ""}
      ${ext && l.status !== STATUS.done && l.status !== STATUS.withdrawn ? `<div class="m-tl pending"><div class="s" style="color:var(--text-muted)">待正式答复</div></div>` : ""}
    </div></div>
    <div class="m-sec"><div class="m-sec-t">${l.reply || ext ? "正式答复" : "答复内容"}</div>${replyHtml}${prevHtml}</div>
    ${msgs.length ? `<div class="m-sec"><div class="m-sec-t">消息记录（${msgs.length}）</div><div class="msg-list compact">${messageItemsHtml(msgs, { showTo: !ext })}</div></div>` : ""}
    ${mode === "student" ? this.studentActions(l) : ""}`;
  },

  studentActions(l) {
    if (l.status === STATUS.done) {
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
    if (l.status !== STATUS.doing && l.status !== STATUS.pending) return "";
    return `<div class="m-sheet-actions">
      <div class="m-btn-row">
        <button class="m-btn m-btn-outline" id="md-supplement">补充材料</button>
        <button class="m-btn m-btn-outline" id="md-urge" ${l.urged ? "disabled" : ""}>${l.urged ? "已催办" : "催办"}</button>
      </div>
      <button class="m-btn m-btn-danger" id="md-withdraw">撤回信件</button>
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
      const ta = document.getElementById("m-rate-comment");
      rateLetter(l, sel, tagWrap ? [...tagWrap.querySelectorAll(".m-rate-chip.on")].map(c => c.dataset.tag) : [], ta ? ta.value.trim() : "");
      upsertLetter(l); this.toast("感谢您的评价！"); this.showLetterDetail(l.id, "student");
    });
  },

  bindDetailActions(l, mode) {
    this.bindStars(l);
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener("click", fn); };
    on("md-reopen", () => { requestReopen(l); upsertLetter(l); this.toast("已申请二次办理，答复仍须科室分管领导审批"); this.closeSheet(); this.render(); });
    on("md-urge", () => this.showUrgeSheet(l));
    on("md-withdraw", () => { withdrawLetter(l); upsertLetter(l); this.toast("信件已撤回"); this.closeSheet(); this.render(); });
    on("md-supplement", () => this.showSupplement(l));
  },

  /* 催办：预览模板 + 选择渠道 + 发送并记录 */
  showUrgeSheet(l) {
    const channels = (MOCK.urgeChannels || ["sys"]).slice();
    this.showSheet("催办", `
      <p class="m-hint">以下催办通知将发送给当前办理人（<b>${escapeHtml(urgeTarget(l))}</b>）：</p>
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
      this.toast(`已通过${channelLabel(ch)}催办至${urgeTarget(l)}`); this.showLetterDetail(l.id, "student");
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
    data.forEach(d => { const ang = d.value / total * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, start + ang); ctx.closePath(); ctx.fillStyle = d.color || "#2A8DC7"; ctx.fill(); start += ang; });
    ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
    ctx.fillStyle = "#3C444F"; ctx.textAlign = "center"; ctx.font = "bold 22px sans-serif"; ctx.fillText(total, cx, cy);
    ctx.font = "10px sans-serif"; ctx.fillStyle = "#627079"; ctx.fillText("总计", cx, cy + 15);
  }
});

/* 启动 */
document.addEventListener("DOMContentLoaded", () => MApp.init());

