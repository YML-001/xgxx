/* ============================================================
 * 学工信箱系统原型 —— 应用逻辑
 * hash 路由 + 学生端/办理端双视角 + 弹窗 + Canvas 图表
 * ============================================================ */

const NAV = {
  student: [
    { section: "常用" },
    { key: "home", label: "工作台", ico: "home" },
    { key: "write", label: "我要写信", ico: "write" },
    { key: "my", label: "我的信件", ico: "mail" },
    { key: "query", label: "信件查询", ico: "search" },
    { section: "信息公开" },
    { key: "public", label: "公开信件", ico: "megaphone" },
    { key: "policy", label: "制度文件", ico: "doc" },
    { key: "stats", label: "数据统计", ico: "chart" },
    { section: "帮助" },
    { key: "dept", label: "科室联系方式", ico: "phone" },
    { key: "faq", label: "常见问题", ico: "help" }
  ],
  leader: [
    { section: "科室办理" },
    { key: "leader-home", label: "科室工作台", ico: "dashboard" },
    { key: "leader-assign", label: "待指定回复人", ico: "share" },
    { key: "leader-approve", label: "待审批", ico: "userCheck" },
    { key: "sec-inbox", label: "科室收件箱", ico: "inbox" },
    { section: "信息公开" },
    { key: "public", label: "公开信件", ico: "megaphone" },
    { key: "policy", label: "制度文件", ico: "doc" }
  ],
  replier: [
    { section: "我的办理" },
    { key: "sec-home", label: "我的工作台", ico: "dashboard" },
    { key: "rep-todo", label: "我的待办", ico: "write" },
    { key: "sec-inbox", label: "科室收件箱", ico: "inbox" },
    { section: "信息公开" },
    { key: "public", label: "公开信件", ico: "megaphone" },
    { key: "policy", label: "制度文件", ico: "doc" }
  ],
  college: [
    { section: "学院协同" },
    { key: "col-todo", label: "协同待办", ico: "users" },
    { key: "col-visible", label: "学院可见信件", ico: "eye" },
    { section: "信息公开" },
    { key: "policy", label: "制度文件", ico: "doc" }
  ],
  admin: [
    { section: "办理" },
    { key: "admin-home", label: "办理工作台", ico: "dashboard" },
    { key: "dispatch", label: "待分派信件", ico: "share" },
    { key: "inbox", label: "信件收件箱", ico: "inbox" },
    { key: "supervise", label: "督办催办", ico: "clock" },
    { section: "运营" },
    { key: "publish", label: "公开情况", ico: "megaphone" },
    { key: "analytics", label: "统计分析", ico: "trend" },
    { section: "配置" },
    { key: "category-mgr", label: "分类管理", ico: "tags" },
    { key: "section-mgr", label: "科室与人员", ico: "building" },
    { key: "policy-mgr", label: "制度文件管理", ico: "book" },
    { key: "sla-mgr", label: "时限与模板", ico: "clock" },
    { key: "faq-mgr", label: "常见问题配置", ico: "help" }
  ]
};

const ROUTE_TITLES = {
  "home": ["工作台", "首页"],
  "write": ["我要写信", "首页 / 我要写信"],
  "write-notice": ["写信须知", "首页 / 我要写信 / 写信须知"],
  "my": ["我的信件", "首页 / 我的信件"],
  "query": ["信件查询", "首页 / 信件查询"],
  "public": ["公开信件", "信息公开 / 公开信件"],
  "policy": ["制度文件", "信息公开 / 制度文件"],
  "stats": ["数据统计", "信息公开 / 数据统计"],
  "dept": ["科室联系方式", "帮助 / 科室联系方式"],
  "faq": ["常见问题", "帮助 / 常见问题"],
  "leader-home": ["科室工作台", "科室办理 / 工作台"],
  "leader-assign": ["待指定回复人", "科室办理 / 待指定回复人"],
  "leader-approve": ["待审批", "科室办理 / 待审批"],
  "sec-home": ["我的工作台", "我的办理 / 工作台"],
  "rep-todo": ["我的待办", "我的办理 / 我的待办"],
  "sec-inbox": ["科室收件箱", "科室办理 / 科室收件箱"],
  "col-todo": ["协同待办", "学院协同 / 协同待办"],
  "col-visible": ["学院可见信件", "学院协同 / 学院可见信件"],
  "admin-home": ["办理工作台", "办理 / 工作台"],
  "dispatch": ["待分派信件", "办理 / 待分派"],
  "inbox": ["信件收件箱", "办理 / 收件箱"],
  "supervise": ["督办催办", "办理 / 督办催办"],
  "publish": ["公开情况", "运营 / 公开情况"],
  "analytics": ["统计分析", "运营 / 统计分析"],
  "category-mgr": ["分类管理", "配置 / 分类管理"],
  "section-mgr": ["科室与人员", "配置 / 科室与人员"],
  "policy-mgr": ["制度文件管理", "配置 / 制度文件管理"],
  "sla-mgr": ["时限与模板", "配置 / 时限与模板"],
  "faq-mgr": ["常见问题配置", "配置 / 常见问题配置"]
};

const HOME_ROUTES = { student: "home", admin: "admin-home", leader: "leader-home", replier: "sec-home", college: "col-todo" };

const App = {
  role: "student",
  section: "",
  member: null,        // 回复人视角下的当前成员（演示身份）
  college: "",         // 副书记视角下的当前学院
  mailbox: "学工信箱",
  route: "home",
  state: {},

  /* 当前回复人身份的成员 id（未取到时为空串） */
  memberId() { return (this.member && this.member.id) || ""; },

  /* 当前科室领导 */
  leader() { return sectionLeader(this.section); },

  homeRoute() { return HOME_ROUTES[this.role] || "home"; },

  /* 当前身份的消息接收键 */
  identityKey() {
    if (this.role === "admin") return "admin";
    if (this.role === "leader") { const l = this.leader(); return l ? "member:" + l.id : ""; }
    if (this.role === "replier") return this.member ? "member:" + this.member.id : "";
    if (this.role === "college") return "college:" + this.college;
    return "student:me";
  },

  /* ---------------- 初始化 ---------------- */
  init() {
    /* 支持通过 URL 直达指定身份：pc.html?role=leader&section=学生资助管理科&college=计算机学院
       role=section 为旧值，等同科室回复人。只在启动时读取，不改顶栏切换。 */
    const params = new URLSearchParams(location.search || "");
    const rawRole = params.get("role");
    const qRole = rawRole === "section" ? "replier" : rawRole;
    if (ROLE_KEYS.includes(qRole)) saveRole(qRole);
    const qSec = params.get("section");
    if (qSec && MOCK.sections.some(s => s.name === qSec)) saveSection(qSec);
    const qCol = params.get("college");
    if (qCol && findCollege(qCol)) saveCollege(qCol);
    /* 导航进入回复人且未指定 member 时，落到该科室第一位在用回复人，避免上次切换后演示待办对不上 */
    if (qRole === "replier" && qSec && MOCK.sections.some(s => s.name === qSec) && !params.get("member")) {
      const first = replierCandidates(qSec)[0];
      if (first) saveMember(first.id);
    }
    this.role = getRole();
    this.section = getSection();
    this.member = getMember();
    this.college = getCollege();
    this.mailbox = getMailbox();
    this.bindGlobal();
    this.renderRoleSwitch();
    this.renderContextSwitch();
    this.renderUser();
    window.addEventListener("hashchange", () => this.onHashChange());
    this.onHashChange();
  },

  bindGlobal() {
    document.getElementById("btn-write-quick").addEventListener("click", () => {
      this.role = "student"; saveRole("student"); this.applyRole();
      location.hash = "#/write-notice";
    });
    const bell = document.getElementById("msg-bell");
    if (bell) bell.addEventListener("click", () => this.showMessages());
    document.getElementById("modal-close").addEventListener("click", () => this.hideModal());
    document.getElementById("modal").addEventListener("click", (e) => {
      if (e.target.id === "modal") this.hideModal();
    });
    const menuBtn = document.getElementById("mobile-menu-btn");
    const mask = document.getElementById("sidebar-mask");
    menuBtn.addEventListener("click", () => {
      document.getElementById("sidebar").classList.toggle("open");
      mask.classList.toggle("show");
    });
    mask.addEventListener("click", () => {
      document.getElementById("sidebar").classList.remove("open");
      mask.classList.remove("show");
    });
  },

  /* ---------------- 身份 & 科室 ---------------- */
  roleLabel() {
    return (ROLE_LABELS[this.role] || "学生") + "视角";
  },

  renderRoleSwitch() {
    const el = document.getElementById("role-switch");
    el.innerHTML = ROLE_KEYS.map(k =>
      `<button data-role="${k}" class="${this.role === k ? "active" : ""}">${ROLE_LABELS[k]}</button>`
    ).join("");
    el.querySelectorAll("button").forEach(b => {
      b.addEventListener("click", () => {
        this.role = b.dataset.role; saveRole(this.role);
        this.applyRole();
        location.hash = "#/" + this.homeRoute();
      });
    });
  },

  applyRole() {
    this.member = getMember();
    this.college = getCollege();
    this.renderRoleSwitch();
    this.renderContextSwitch();
    this.renderUser();
  },

  renderUser() {
    const set = (avatar, name, sub) => {
      document.getElementById("user-avatar").textContent = avatar;
      document.getElementById("user-name").textContent = name;
      document.getElementById("user-sub").textContent = sub;
    };
    if (this.role === "admin") {
      set(MOCK.admin.avatar, MOCK.admin.name, MOCK.admin.role);
    } else if (this.role === "leader") {
      const l = this.leader();
      if (l) set(l.name.charAt(0), l.name, `${this.section} · ${l.title || "科室领导"}`);
      else set("—", "未配置科室领导", this.section);
    } else if (this.role === "replier") {
      const m = this.member || getMember();
      if (m) set(m.name.charAt(0), m.name, `${this.section} · ${m.title || "回复人"}`);
      else set("—", "暂无回复人", this.section);
    } else if (this.role === "college") {
      const c = findCollege(this.college);
      if (c) set(c.secretary.charAt(0), c.secretary, `${c.name} · ${c.title || "副书记"}`);
      else set("—", "学工系统未同步副书记", this.college || "");
    } else {
      set(MOCK.user.avatar, MOCK.user.name, MOCK.user.college);
    }
    document.getElementById("role-badge").textContent = this.roleLabel();
    document.getElementById("btn-write-quick").style.display = this.role === "student" ? "" : "none";
    this.renderBell();
  },

  /* 顶栏消息铃铛：显示当前身份未读数 */
  renderBell() {
    const dot = document.getElementById("msg-dot");
    if (!dot) return;
    const n = unreadCount(this.identityKey());
    dot.textContent = n > 99 ? "99+" : (n || "");
    dot.style.display = n ? "" : "none";
  },

  /* 消息中心弹窗：按当前身份列出收到的消息，点击打开对应信件 */
  showMessages() {
    const key = this.identityKey();
    const msgs = messagesFor(key);
    const unread = msgs.filter(m => !m.read).length;
    this.showModal(`消息通知 · ${ROLE_LABELS[this.role]}`, `
      <div class="msg-toolbar">
        <span>共 ${msgs.length} 条，未读 <b>${unread}</b> 条</span>
        ${unread ? `<button class="btn btn-outline btn-sm" id="msg-read-all">全部标为已读</button>` : ""}
      </div>
      <div class="msg-list">${messageItemsHtml(msgs, { empty: "当前身份暂无消息" })}</div>`);
    const all = document.getElementById("msg-read-all");
    if (all) all.addEventListener("click", () => { markRead(key); this.renderBell(); this.renderSidebar(); this.showMessages(); });
    document.querySelectorAll("#modal-body [data-msg]").forEach(el => el.addEventListener("click", () => {
      markRead(key, el.dataset.msg); this.renderBell();
      this.openLetter(el.dataset.msgLetter);
    }));
  },

  /* 按当前身份打开信件详情 */
  openLetter(id) {
    const l = getLetterById(id);
    if (!l) { this.toast("该信件不存在或已删除"); return; }
    if (this.role === "student") {
      if (l.owner === "me") this.showMyDetail(id); else this.showPublicDetail(id);
    } else if (this.role === "college") this.showCollab(id);
    else this.showHandle(id);
  },

  /* 顶栏上下文切换（演示用）：科室领导选科室；回复人选科室 + 本人；副书记选学院 */
  renderContextSwitch() {
    const el = document.getElementById("mailbox-switch");
    if (!["leader", "replier", "college"].includes(this.role)) { el.innerHTML = ""; el.style.display = "none"; return; }
    el.style.display = "";
    if (this.role === "college") {
      el.innerHTML = `<span class="switch-label">学院</span>`
        + `<select class="ctx-select" id="ctx-college">${collegeList(true).map(c =>
          `<option value="${escapeHtml(c.name)}" ${this.college === c.name ? "selected" : ""}>${escapeHtml(c.name)} · ${escapeHtml(c.secretary)}</option>`).join("")}</select>`;
      const sel = document.getElementById("ctx-college");
      if (sel) sel.addEventListener("change", () => {
        this.college = sel.value; saveCollege(this.college);
        this.renderUser(); this.render();
      });
      return;
    }
    const members = replierCandidates(this.section);
    const leader = this.leader();
    el.innerHTML = `<span class="switch-label">科室</span>`
      + `<select class="ctx-select" id="ctx-sec">${MOCK.sections.map(s =>
        `<option value="${escapeHtml(s.name)}" ${this.section === s.name ? "selected" : ""}>${escapeHtml(s.name)}</option>`).join("")}</select>`
      + (this.role === "leader"
        ? `<span class="switch-label">科室领导</span><span class="switch-fixed">${leader ? escapeHtml(leader.name + " · " + (leader.title || "科长")) : "未配置"}</span>`
        : `<span class="switch-label">本人</span>` + (members.length
          ? `<select class="ctx-select" id="ctx-member">${members.map(m =>
              `<option value="${escapeHtml(m.id)}" ${this.memberId() === m.id ? "selected" : ""}>${escapeHtml(m.name)}${m.title ? " · " + escapeHtml(m.title) : ""}</option>`).join("")}</select>`
          : `<span class="switch-empty">该科室暂无回复人</span>`));

    const secSel = document.getElementById("ctx-sec");
    if (secSel) secSel.addEventListener("change", () => {
      this.section = secSel.value; saveSection(this.section);
      this.member = replierCandidates(this.section)[0] || null;
      if (this.member) saveMember(this.member.id);
      this.renderContextSwitch(); this.renderUser(); this.render();
    });
    const memSel = document.getElementById("ctx-member");
    if (memSel) memSel.addEventListener("change", () => {
      saveMember(memSel.value);
      this.member = getMember();
      this.renderUser(); this.render();
    });
  },

  /* ---------------- 侧边栏导航 ---------------- */
  renderSidebar() {
    const nav = document.getElementById("sidebar-nav");
    const items = NAV[this.role];
    nav.innerHTML = items.map(it => {
      if (it.section) return `<div class="nav-section-title">${it.section}</div>`;
      const badge = this.navBadge(it.key);
      return `<button class="nav-item ${this.route === it.key ? "active" : ""}" data-key="${it.key}">
        <span class="nav-ico">${svgIcon(it.ico)}</span><span>${it.label}</span>
        ${badge ? `<span class="nav-badge">${badge}</span>` : ""}
      </button>`;
    }).join("");
    nav.querySelectorAll(".nav-item").forEach(b => {
      b.addEventListener("click", () => {
        location.hash = "#/" + b.dataset.key;
        document.getElementById("sidebar").classList.remove("open");
        document.getElementById("sidebar-mask").classList.remove("show");
      });
    });
  },

  navBadge(key) {
    const all = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    if (key === "my") return getMyLetters().filter(l => l.status !== STATUS.draft && l.mailbox === this.mailbox).length || "";
    if (key === "dispatch") return all.filter(l => stageOf(l) === STAGE.pending).length || "";
    if (key === "inbox") return all.filter(l => l.status === STATUS.doing).length || "";
    if (key === "supervise") return all.filter(l => isOverdue(l)).length || "";
    if (key === "leader-assign") return getSectionLetters(this.section).filter(l => stageOf(l) === STAGE.needReplier).length || "";
    if (key === "leader-approve") return getSectionLetters(this.section).filter(l => stageOf(l) === STAGE.approving).length || "";
    if (key === "rep-todo") return getMemberLetters(this.memberId()).filter(isReplierTurn).length || "";
    if (key === "col-todo") return getCollabLetters(this.college).filter(l => (l.collabs || []).some(c => c.college === this.college && !c.opinion)).length || "";
    return "";
  },

  /* ---------------- 路由 ---------------- */
  onHashChange() {
    const h = location.hash.replace(/^#\/?/, "") || this.homeRoute();
    this.route = h;
    this.applyRole();
    this.render();
  },

  navigate(key) { location.hash = "#/" + key; },

  render() {
    // 越权保护：身份与路由不匹配则回到对应首页
    const validKeys = NAV[this.role].filter(i => i.key).map(i => i.key)
      .concat(this.role === "student" ? ["write-notice"] : []);
    if (!validKeys.includes(this.route)) {
      this.route = this.homeRoute();
    }
    const meta = ROUTE_TITLES[this.route] || ["学工信箱", ""];
    document.getElementById("page-title").textContent = meta[0];
    document.getElementById("breadcrumb").textContent = meta[1];
    this.renderSidebar();
    this.renderBell();

    const map = {
      "home": () => this.renderHome(),
      "write": () => this.renderWrite(),
      "write-notice": () => this.renderNotice(),
      "my": () => this.renderMy(),
      "query": () => this.renderQuery(),
      "public": () => this.renderPublic(),
      "policy": () => this.renderPolicy(),
      "stats": () => this.renderStats(),
      "dept": () => this.renderDept(),
      "faq": () => this.renderFaq(),
      "leader-home": () => this.renderLeaderHome(),
      "leader-assign": () => this.renderLeaderList("assign"),
      "leader-approve": () => this.renderLeaderList("approve"),
      "sec-home": () => this.renderSectionHome(),
      "rep-todo": () => this.renderReplierTodo(),
      "sec-inbox": () => this.renderSectionInbox(),
      "col-todo": () => this.renderCollegeTodo(),
      "col-visible": () => this.renderCollegeVisible(),
      "admin-home": () => this.renderAdminHome(),
      "dispatch": () => this.renderDispatch(),
      "inbox": () => this.renderInbox(),
      "supervise": () => this.renderSupervise(),
      "publish": () => this.renderPublish(),
      "analytics": () => this.renderAnalytics(),
      "category-mgr": () => this.renderCategoryMgr(),
      "section-mgr": () => this.renderSectionMgr(),
      "policy-mgr": () => this.renderPolicyMgr(),
      "sla-mgr": () => this.renderSlaMgr(),
      "faq-mgr": () => this.renderFaqMgr()
    };
    const content = document.getElementById("app-content");
    content.innerHTML = (map[this.route] || map["home"])();
    content.scrollTop = 0;
    window.scrollTo(0, 0);
    if (this.afterRender) { const fn = this.afterRender; this.afterRender = null; fn(); }
  },

  /* ---------------- 基础设施 ---------------- */
  showModal(title, body) {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-body").innerHTML = body;
    document.getElementById("modal").classList.add("show");
  },
  hideModal() { document.getElementById("modal").classList.remove("show"); },

  toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  },

  /* 状态徽章 */
  statusBadge(status) {
    const c = statusColor(status);
    return `<span class="badge" style="background:${c}1a;color:${c}"><span class="dot" style="background:${c}"></span>${status}</span>`;
  },

  /* 办理环节徽章（办理端使用；学生端只看状态） */
  stageBadge(l) {
    const st = stageOf(l);
    const c = stageColor(st);
    return `<span class="badge stage-badge" style="background:${c}1a;color:${c}"><span class="dot" style="background:${c}"></span>${st}</span>`;
  },

  catBadge(cat) {
    const c = (MOCK.letterCategories.find(x => x.label === cat) || {}).color || "#627079";
    return `<span class="badge" style="background:${c}1a;color:${c}">${cat}</span>`;
  },

  /* 列表标题下的正文摘要（空内容返回空串，调用处自动跳过） */
  cellExcerpt(l) {
    const e = contentExcerpt(l.content, 56);
    return e ? `<div class="cell-excerpt">${escapeHtml(e)}</div>` : "";
  },

  /* 承办单元格：已分派显示「科室 + 科室领导 + 回复人」，未分派提示待综合办分派 */
  ownerCell(l, forStudent) {
    if (!l.dept) return `<span class="tag warn">待综合办分派</span>`;
    if (forStudent) return `<div>${escapeHtml(l.dept)}</div>` + (l.assignee ? `<div class="cell-sub">${svgIcon("userCheck")} ${escapeHtml(l.assignee.name)}</div>` : "");
    return `<div>${escapeHtml(l.dept)}</div>`
      + (l.leader ? `<div class="cell-sub">科长 ${escapeHtml(l.leader.name)}</div>` : "")
      + (l.assignee ? `<div class="cell-sub">${svgIcon("userCheck")} ${escapeHtml(l.assignee.name)}</div>` : `<div class="cell-sub warn-text">未指定回复人</div>`);
  },

  /* 分页组件 */
  paginate(list, page, size) {
    const total = Math.ceil(list.length / size) || 1;
    const p = Math.min(Math.max(1, page || 1), total);
    return { rows: list.slice((p - 1) * size, p * size), page: p, total };
  },
  pagerHtml(page, total, cb) {
    if (total <= 1) return "";
    let btns = `<button ${page === 1 ? "disabled" : ""} data-pg="${page - 1}">上一页</button>`;
    for (let i = 1; i <= total; i++) btns += `<button class="${i === page ? "active" : ""}" data-pg="${i}">${i}</button>`;
    btns += `<button ${page === total ? "disabled" : ""} data-pg="${page + 1}">下一页</button>`;
    btns += `<span class="page-info">第 ${page}/${total} 页</span>`;
    setTimeout(() => {
      document.querySelectorAll(`[data-pager="${cb}"] [data-pg]`).forEach(b => {
        b.addEventListener("click", () => { this.state[cb] = +b.dataset.pg; this.render(); });
      });
    }, 0);
    return `<div class="pagination" data-pager="${cb}">${btns}</div>`;
  }
};

/* ============================================================
 * 学生来信端页面
 * ============================================================ */
Object.assign(App, {
  /* ---------- 首页工作台 ---------- */
  renderHome() {
    const mine = getMyLetters().filter(l => l.status !== STATUS.draft && l.mailbox === this.mailbox);
    const all = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const pending = all.filter(l => l.status === STATUS.pending).length;
    const doing = all.filter(l => l.status === STATUS.doing).length;
    const done = all.filter(l => l.status === STATUS.done).length;
    const pub = getPublicLetters().filter(l => l.mailbox === this.mailbox).sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 5);

    this.afterRender = () => {
      document.querySelectorAll("[data-quick]").forEach(c =>
        c.addEventListener("click", () => this.navigate(c.dataset.quick === "write" ? "write-notice" : c.dataset.quick)));
      document.querySelectorAll("[data-open-public]").forEach(r =>
        r.addEventListener("click", () => this.showPublicDetail(r.dataset.openPublic)));
      this.drawDonut("home-donut", [
        { label: "待分派", value: pending, color: "#F29100" },
        { label: "办理中", value: doing, color: "#2A8DC7" },
        { label: "已办结", value: done, color: "#1BB975" }
      ].filter(x => x.value));
    };

    return `
    <div class="hero">
      <h2>倾听每一份诉求，回应每一份期待</h2>
      <p>学工信箱是学校与学生之间的连心桥。提交即收到收悉回执，承诺 ${MOCK.replyPromiseDays} 天内正式回复；来信由${MOCK.intakeSection}分给承办科室，科室回复人拟写答复，经科室领导审批后发送给您。</p>
      <div class="hero-stats">
        <div class="hero-stat"><strong>${all.length}</strong><span>累计来信（${this.mailbox}）</span></div>
        <div class="hero-stat"><strong>${done}</strong><span>已办结</span></div>
        <div class="hero-stat"><strong>${this.satisfactionRate(all)}%</strong><span>满意度</span></div>
      </div>
    </div>

    <div class="quick-grid">
      ${this.quickCard("write", "write", "我要写信", "反映问题 · 提出建议")}
      ${this.quickCard("query", "search", "信件查询", "凭编号追踪进度")}
      ${this.quickCard("my", "mail", "我的信件", `共 ${mine.length} 封`)}
      ${this.quickCard("public", "megaphone", "公开信件", "看看大家在关注什么")}
    </div>

    <div class="grid-3-2">
      <div class="card">
        <div class="card-header"><h3>最新公开信件</h3><span class="more" onclick="location.hash='#/public'">更多 ›</span></div>
        <div class="card-body" style="padding:0">
          <table><thead><tr><th>标题</th><th style="width:120px">承办科室</th><th style="width:100px">时间</th></tr></thead>
          <tbody>
            ${pub.length ? pub.map(l => `<tr class="clickable" data-open-public="${l.id}">
              <td>${escapeHtml(l.title)}${this.cellExcerpt(l)}</td><td>${deptLabel(l)}</td><td>${l.date}</td></tr>`).join("")
              : `<tr><td colspan="3" class="table-empty">暂无公开信件</td></tr>`}
          </tbody></table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>信件办理情况</h3></div>
        <div class="card-body">
          <div class="chart-wrap">
            <canvas id="home-donut" width="150" height="150"></canvas>
            <div class="chart-legend">
              <div class="legend-item"><span class="lg-dot" style="background:#F29100"></span>待分派<span class="lg-val">${pending}</span></div>
              <div class="legend-item"><span class="lg-dot" style="background:#2A8DC7"></span>办理中<span class="lg-val">${doing}</span></div>
              <div class="legend-item"><span class="lg-dot" style="background:#1BB975"></span>已办结<span class="lg-val">${done}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  },

  quickCard(key, ico, title, sub) {
    return `<div class="quick-card" data-quick="${key}">
      <div class="quick-ico">${svgIcon(ico)}</div><h4>${title}</h4><p>${sub}</p></div>`;
  },

  satisfactionRate(letters) {
    const rated = letters.filter(l => l.rating);
    if (!rated.length) return 100;
    const good = rated.filter(l => l.rating >= 4).length;
    return Math.round(good / rated.length * 100);
  },

  /* ---------- 写信须知 ---------- */
  renderNotice() {
    this.afterRender = () => {
      const btn = document.getElementById("notice-btn");
      let n = 8;
      btn.disabled = true;
      const timer = setInterval(() => {
        n--;
        if (n <= 0) { clearInterval(timer); btn.disabled = false; btn.textContent = "我已阅读，开始写信"; }
        else btn.textContent = `请阅读须知（${n}s）`;
      }, 1000);
      btn.textContent = `请阅读须知（${n}s）`;
      btn.addEventListener("click", () => { if (!btn.disabled) this.navigate("write"); });
    };
    const s = MOCK.acceptScope;
    return `
    <div class="card notice-box">
      <div class="card-header"><h3>写信须知</h3><span class="hint">提交至 ${this.mailbox}</span></div>
      <div class="card-body">
        <p>您好！为使您的来信得到及时办理和明确答复，请在写信前仔细阅读以下内容：</p>
        <ol class="notice-list">
          <li>请遵守国家法律法规和社会公德，如实反映情况，文明表达诉求。</li>
          <li>请遵循「一事一信」原则，标题简明扼要，内容实事求是。</li>
          <li>为便于核实与回访，建议使用真实姓名与联系方式；来信是否公开由承办科室在答复时确定，您本人始终可以查看自己的答复。</li>
          <li>同一事项已办结后，请勿以相同事实和理由重复提交。</li>
        </ol>
        <div class="flow-strip">
          <div class="flow-strip-title">办理流程</div>
          <div class="flow-steps">
            ${FLOW_STEPS.map((s, i) => `<div class="flow-step">
              <span class="fs-idx">${i + 1}</span>
              <div class="fs-body"><div class="fs-step">${escapeHtml(s.step)}</div>
                <div class="fs-actor">${escapeHtml(s.actor)}</div>
                <div class="fs-note">${escapeHtml(s.note)}</div></div>
            </div>`).join("")}
          </div>
        </div>
        <div class="scope-cols">
          <div class="scope-col accept">
            <h4>✓ 受理范围</h4>
            <ul>${s.accept.map(i => `<li>${i}</li>`).join("")}</ul>
          </div>
          <div class="scope-col reject">
            <h4>✕ 不予受理</h4>
            <ul>${s.reject.map(i => `<li>${i}</li>`).join("")}</ul>
          </div>
        </div>
        <button class="btn btn-primary countdown-btn" id="notice-btn">请阅读须知</button>
      </div>
    </div>`;
  },

  /* ---------- 我要写信 ---------- */
  renderWrite() {
    const u = MOCK.user;
    const draft = getDraft(this.mailbox) || {};
    const sel = (f, v) => draft[f] === v ? "selected" : "";
    this.afterRender = () => this.bindWrite();
    return `
    <div class="card">
      <div class="card-header"><h3>填写信件</h3><span class="hint">提交至 ${this.mailbox}</span></div>
      <div class="card-body">
        <form id="write-form" novalidate>
          <div class="form-row">
            <div class="form-group"><label class="form-required">姓名</label><input name="name" value="${escapeHtml(draft.name || u.name)}" required></div>
            <div class="form-group"><label class="form-required">证件信息</label><input name="idInfo" value="${escapeHtml(draft.idInfo || u.id)}" required></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-required">联系电话</label><input name="phone" value="${escapeHtml(draft.phone || u.phone)}" required></div>
            <div class="form-group"><label class="form-required">联系邮箱</label><input name="email" type="email" value="${escapeHtml(draft.email || u.email)}" required></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-required">所在单位</label><input name="unit" value="${escapeHtml(draft.unit || u.college)}" required></div>
            <div class="form-group"><label>联系地址</label><input name="address" value="${escapeHtml(draft.address || "")}"></div>
          </div>
          <div class="form-group"><label class="form-required">来信标题</label>
            <input name="title" id="w-title" value="${escapeHtml(draft.title || "")}" placeholder="简要概括您的诉求" maxlength="80" required></div>
          <div class="form-row">
            <div class="form-group"><label class="form-required">信件分类</label>
              <select name="category" required><option value="">请选择</option>
                ${MOCK.letterCategories.map(c => `<option ${sel("category", c.label)}>${c.label}</option>`).join("")}
              </select></div>
            <div class="form-group"><label class="form-required">事务分类</label>
              <select name="affair" id="w-affair" required><option value="">请选择</option>
                ${MOCK.affairCategories.map(a => `<option ${sel("affair", a)}>${a}</option>`).join("")}
              </select></div>
          </div>
          <p class="dept-hint" id="dept-hint"></p>
          <div class="form-group">
            <div class="rt-label"><label class="form-required" style="margin:0">信件内容</label>
              <button type="button" class="ai-btn" id="btn-ai" title="AI 帮你把语言组织得更清晰得体">${svgIcon("sparkles")} AI 润色</button>
            </div>
            <textarea id="w-content" rows="8" maxlength="2000" placeholder="请详细描述事件经过与诉求（不少于10字）">${escapeHtml(draft.content || "")}</textarea>
            <div class="char-counter"><span id="char-count">0</span> / 2000</div>
          </div>
          <div class="form-group"><label>附件材料</label>
            <div class="upload-zone" id="upload-zone"><div class="uz-inner">${svgIcon("paperclip")} 点击或拖拽文件到此处上传（照片 / 文档，可选）</div></div>
            <input type="file" id="upload-input" multiple hidden>
            <div class="up-list" id="upload-list"></div>
          </div>
          <p class="form-hint warn" id="dup-hint"></p>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">提交信件</button>
            <button type="button" class="btn btn-outline" id="btn-draft">存为草稿</button>
            <button type="button" class="btn btn-ghost" id="btn-cancel">取消</button>
          </div>
        </form>
      </div>
    </div>`;
  },

  bindWrite() {
    const form = document.getElementById("write-form");
    const content = document.getElementById("w-content");
    const counter = document.getElementById("char-count");
    const affair = document.getElementById("w-affair");
    const deptHint = document.getElementById("dept-hint");
    const dupHint = document.getElementById("dup-hint");

    const updateCount = () => {
      const n = content.value.length;
      counter.textContent = n;
      if (n >= 2000) this.toast("内容已达 2000 字上限");
    };
    const updateDept = () => {
      deptHint.textContent = `来信将统一送达${MOCK.intakeSection}受理，提交后立即收到收悉回执，${MOCK.replyPromiseDays} 天内正式回复`;
    };
    updateCount(); updateDept();
    content.addEventListener("input", updateCount);

    affair.addEventListener("change", updateDept);

    // AI 润色（纯文本）
    document.getElementById("btn-ai").addEventListener("click", () => {
      const raw = content.value.trim();
      if (raw.length < 6) { this.toast("请先输入一些内容，再让 AI 润色"); return; }
      this.aiPolishFlow(raw, form.category.value, form.affair.value, (text) => {
        content.value = text; updateCount();
      });
    });

    const uploader = makeUploader(
      document.getElementById("upload-zone"),
      document.getElementById("upload-input"),
      document.getElementById("upload-list"),
      (a) => this.showAttachmentPreview(a)
    );
    uploader.seed((getDraft(this.mailbox) || {}).attachments || []);

    const collect = () => {
      const fd = new FormData(form);
      const o = Object.fromEntries(fd.entries());
      o.content = content.value.trim();
      o.attachments = uploader.getMeta();
      return o;
    };

    const checkDup = (title) => getMyLetters().some(l =>
      l.status !== STATUS.draft && l.mailbox === this.mailbox && l.title === title);

    document.getElementById("btn-cancel").addEventListener("click", () => this.navigate("home"));

    document.getElementById("btn-draft").addEventListener("click", () => {
      const o = collect();
      const existing = getDraft(this.mailbox);
      const letter = Object.assign(existing || {
        id: genLetterId(), owner: "me", mailbox: this.mailbox,
        createdAt: new Date().toISOString(), date: formatDate(new Date())
      }, o, { status: STATUS.draft });
      upsertLetter(letter);
      this.toast("已保存为草稿");
      this.navigate("my");
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const o = collect();
      if (!o.name || !o.title || !o.category || !o.affair || !o.content) {
        this.toast("请填写所有必填项"); return;
      }
      if (o.content.length < 10) { this.toast("信件内容不少于10字"); return; }
      if (checkDup(o.title)) {
        dupHint.textContent = "⚠ 检测到您已提交过同标题信件，请勿重复提交";
        return;
      }
      const now = new Date();
      const existingDraft = getDraft(this.mailbox);
      const letter = Object.assign(existingDraft || { id: genLetterId(), owner: "me" }, o, {
        mailbox: this.mailbox,
        createdAt: now.toISOString(), date: formatDate(now),
        deadline: calcDeadline(now),
        urged: false, reopened: false, rating: null
      });
      submitLetter(letter);
      upsertLetter(letter);
      this.navigate("my");
      this.showReceipt(letter);
    });
  },

  /* 提交成功：展示收悉回执（M-01） */
  showReceipt(l) {
    this.showModal("提交成功 · 收悉回执", `
      <div class="receipt-box">
        <div class="receipt-head">${svgIcon("check")} 来信已送达${MOCK.intakeSection}，编号 <span class="mono">${escapeHtml(l.id)}</span></div>
        <div class="receipt-text">${escapeHtml((l.ack && l.ack.text) || "").replace(/\n/g, "<br>")}</div>
        <div class="receipt-meta">已通过 系统消息 + ITS 发送 · ${escapeHtml((l.ack && l.ack.at) || "")}</div>
      </div>
      <p class="form-hint" style="color:var(--text-muted)">收悉回执不是正式答复；正式答复经科室领导审批后发送，届时会再提醒您查看并评价。</p>
      <div class="modal-actions">
        <button class="btn btn-primary" id="rc-view">查看信件</button>
        <button class="btn btn-ghost" id="rc-close">知道了</button>
      </div>`);
    document.getElementById("rc-view").addEventListener("click", () => this.showMyDetail(l.id));
    document.getElementById("rc-close").addEventListener("click", () => this.hideModal());
  },

  /* ---------- AI 润色 ---------- */
  aiPolishFlow(raw, category, affair, apply) {
    this.showModal("AI 润色", `
      <div class="ai-loading" id="ai-loading">
        <div class="ai-spinner"></div>
        <p>AI 正在为您梳理表达、优化结构…</p>
      </div>`);
    setTimeout(() => {
      const polished = this.aiPolish(raw, category, affair);
      const body = document.getElementById("modal-body");
      if (!body) return;
      body.innerHTML = `
        <p class="ai-tip">AI 已在保留原意的基础上优化了措辞与条理，请对照确认后再应用：</p>
        <div class="ai-compare">
          <div class="ai-col"><div class="ai-col-title">润色前</div>
            <div class="ai-text pre-wrap">${escapeHtml(raw)}</div></div>
          <div class="ai-col"><div class="ai-col-title">润色后</div>
            <div class="ai-text pre-wrap">${escapeHtml(polished)}</div></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" id="ai-apply">应用润色结果</button>
          <button class="btn btn-outline" id="ai-regen">换一版</button>
          <button class="btn btn-ghost" id="ai-cancel">保留原文</button>
        </div>`;
      const applyBtn = document.getElementById("ai-apply");
      if (applyBtn) applyBtn.addEventListener("click", () => { apply(polished); this.hideModal(); this.toast("已应用 AI 润色结果"); });
      const regen = document.getElementById("ai-regen");
      if (regen) regen.addEventListener("click", () => this.aiPolishFlow(raw, category, affair, apply));
      const cancel = document.getElementById("ai-cancel");
      if (cancel) cancel.addEventListener("click", () => this.hideModal());
    }, 900);
  },

  /* 本地模拟的 AI 润色：规范称呼、分段、补充礼貌用语与诉求收束 */
  aiPolish(raw, category, affair) {
    const clean = raw.replace(/\s+/g, " ").trim();
    // 按句号/分号切分为条理化段落
    const sentences = clean.split(/(?<=[。；;!！?？])/).map(s => s.trim()).filter(Boolean);
    const lead = affair ? `我想就「${affair}」相关事项向您反映如下情况：` : "我想向您反映如下情况：";
    const items = sentences.length > 1 ? sentences : [clean];
    const bodyText = items.map((s, i) => `${i + 1}. ${s}`).join("\n");
    const closingMap = {
      "建议类": "以上为我的建议，恳请学校相关部门予以考虑，期待校园环境与服务不断改进。",
      "问题类": "上述问题已对我的学习生活造成一定影响，恳请相关部门尽快核实并妥善处理。",
      "咨询类": "以上为我的疑问，烦请老师在方便时予以解答，非常感谢。",
      "感谢类": "在此谨向相关老师和部门表示诚挚的感谢，为你们的用心服务点赞。",
      "投诉类": "恳请学校对上述情况予以重视、认真核查，并及时给予答复与处理。"
    };
    const closing = closingMap[category] || "恳请相关部门予以关注与处理，感谢您的辛勤付出！";
    return `尊敬的老师：\n\n您好！${lead}\n${bodyText}\n\n${closing}\n\n此致\n敬礼！`;
  },

  /* ---------- 我的信件 ---------- */
  renderMy() {
    const tab = this.state.myTab || "全部";
    const f = this.state.myFilter || {};
    let list = getMyLetters().filter(l => l.mailbox === this.mailbox);
    const counts = {
      "全部": list.filter(l => l.status !== STATUS.draft).length,
      "草稿": list.filter(l => l.status === STATUS.draft).length,
      "待分派": list.filter(l => l.status === STATUS.pending).length,
      "办理中": list.filter(l => l.status === STATUS.doing).length,
      "已办结": list.filter(l => l.status === STATUS.done).length
    };
    if (tab === "全部") list = list.filter(l => l.status !== STATUS.draft);
    else list = list.filter(l => l.status === tab);
    list = filterLetters(list, f).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const pg = this.paginate(list, this.state.myPage, 6);

    this.afterRender = () => {
      document.querySelectorAll("[data-tab]").forEach(t => t.addEventListener("click", () => {
        this.state.myTab = t.dataset.tab; this.state.myPage = 1; this.render();
      }));
      this.bindFilter("my", ["title", "content", "dept"]);
      document.querySelectorAll("[data-open]").forEach(r =>
        r.addEventListener("click", () => this.showMyDetail(r.dataset.open)));
      this.bindStudentRowActions();
    };

    const tabs = ["全部", "待分派", "办理中", "已办结", "草稿"];
    return `
    ${this.filterBar("my", [
      { name: "title", label: "信件标题", type: "text" },
      { name: "content", label: "信件内容", type: "text" },
      { name: "dept", label: "承办科室", type: "text" }
    ])}
    <div class="tabs">
      ${tabs.map(t => `<button class="tab ${tab === t ? "active" : ""}" data-tab="${t}">${t} <span class="cnt">${counts[t]}</span></button>`).join("")}
    </div>
    <div class="card"><div class="card-body" style="padding:0">
      <table><thead><tr>
        <th style="width:140px">信件编号</th><th>标题</th><th style="width:80px">分类</th>
        <th style="width:150px">承办科室 / 回复人</th><th style="width:95px">来信时间</th><th style="width:90px">状态</th>
        <th style="width:200px">操作</th>
      </tr></thead><tbody>
        ${pg.rows.length ? pg.rows.map(l => `<tr class="clickable" data-open="${l.id}">
          <td class="mono">${l.id}</td>
          <td>${escapeHtml(l.title)} ${l.urged ? '<span class="tag warn">已催办</span>' : ""} ${isOverdue(l) ? '<span class="tag overdue">超期</span>' : ""} ${l.supplements && l.supplements.length ? '<span class="tag info">已补充</span>' : ""}${this.cellExcerpt(l)}</td>
          <td>${this.catBadge(l.category)}</td>
          <td>${this.ownerCell(l, true)}</td>
          <td>${l.date}</td>
          <td>${this.statusBadge(l.status)}</td>
          <td>${this.studentRowActionsHtml(l)}</td>
        </tr>`).join("") : `<tr><td colspan="7" class="table-empty">暂无信件，点击右上角「我要写信」开始吧</td></tr>`}
      </tbody></table>
    </div></div>
    ${this.pagerHtml(pg.page, pg.total, "myPage")}`;
  },

  showMyDetail(id) {
    const l = getLetterById(id);
    if (!l) return;
    if (l.status === STATUS.draft) {
      this.showModal("草稿详情", `
        <div class="detail-head"><div><h4>${escapeHtml(l.title || "（未填写标题）")}</h4>
          <div class="detail-meta"><span class="mono">${l.id}</span> · ${l.mailbox} · 草稿</div></div></div>
        <div class="detail-section"><div class="sec-title">信件内容</div>
          <div class="rich-content">${l.content ? contentHtml(l.content) : "（未填写）"}</div></div>
        <div class="modal-actions">
          <button class="btn btn-primary" id="d-edit">继续编辑</button>
          <button class="btn btn-danger" id="d-del">删除草稿</button>
        </div>`);
      const editBtn = document.getElementById("d-edit");
      if (editBtn) editBtn.addEventListener("click", () => { this.hideModal(); this.navigate("write"); });
      const delBtn = document.getElementById("d-del");
      if (delBtn) delBtn.addEventListener("click", () => {
        saveLetters(getLetters().filter(x => x.id !== id));
        this.hideModal(); this.toast("草稿已删除"); this.render();
      });
      return;
    }
    this.showModal("信件详情", this.letterDetailHtml(l, "student"));
    this.bindLetterDetail(l, "student");
    this.bindAttachments(() => this.showMyDetail(l.id));
  },

  /* 信件详情：mode = student（本人）/ public（公开浏览）/ view（办理端） */
  letterDetailHtml(l, mode) {
    const ext = mode === "student" || mode === "public";
    const log = buildProcessLog(l, ext);
    const next = nextStepText(l);
    const supsHtml = supplementItemsHtml(l, "tag");
    const urgeHtml = ext ? "" : reminderItemsHtml(l);
    const dpHtml = ext ? "" : dispatchItemsHtml(l, "tag");
    const cbHtml = ext ? "" : collabItemsHtml(l);
    const apHtml = ext ? "" : approvalItemsHtml(l);
    const msgs = mode === "public" ? [] : letterMessages(l, ext);
    const ownerTags = l.dept
      ? `<span class="tag">承办：${escapeHtml(l.dept)}</span>`
        + (!ext && l.leader ? `<span class="tag">科室领导：${escapeHtml(leaderLabel(l))}</span>` : "")
        + (l.assignee ? `<span class="tag info">回复人：${escapeHtml(ext ? l.assignee.name : assigneeLabel(l))}</span>` : (ext ? "" : `<span class="tag warn">未指定回复人</span>`))
      : `<span class="tag warn">待${MOCK.intakeSection}分派</span>`;
    const draft = l.replyDraft && l.replyDraft.content;
    const replyHtml = l.reply
      ? `<div class="reply-box"><div class="pre-wrap" style="background:transparent;padding:0">${escapeHtml(l.reply.content)}</div>
          <div class="reply-time">—— ${escapeHtml(l.reply.dept)}${l.reply.by ? " · " + escapeHtml(l.reply.by) : ""} · ${escapeHtml(l.reply.time)}${!ext && l.reply.approvedBy ? ` · 审批：${escapeHtml(l.reply.approvedBy)}` : ""}</div></div>`
        + (!ext && l.publicScope ? `<div class="scope-line">公开范围：<span class="tag ${l.publicScope === "all" ? "ok" : "info"}">${PUBLIC_SCOPE[l.publicScope]}</span></div>` : "")
      : (ext
        ? `<div class="no-reply">${l.status === STATUS.pending
            ? `${MOCK.intakeSection}已收到来信，正在分给承办科室，请耐心等待`
            : (l.status === STATUS.withdrawn ? "来信已撤回" : "承办科室正在办理中，正式答复经科室领导审批后发送给您")}</div>`
        : (draft
          ? `<div class="reply-box draft"><div class="draft-flag">答复草稿 · 未发送</div><div class="pre-wrap" style="background:transparent;padding:0">${escapeHtml(draft)}</div>
              <div class="reply-time">—— ${escapeHtml(l.replyDraft.by || "")} · ${escapeHtml(l.replyDraft.at || "")}</div></div>`
          : `<div class="no-reply">尚无答复内容</div>`));
    const prevHtml = (l.prevReplies || []).map((r, i) => `<div class="reply-box prev">
        <div class="draft-flag">第 ${i + 1} 次答复（已申请二次办理）</div>
        <div class="pre-wrap" style="background:transparent;padding:0">${escapeHtml(r.content || "")}</div>
        <div class="reply-time">—— ${escapeHtml(r.dept || "")}${r.by ? " · " + escapeHtml(r.by) : ""} · ${escapeHtml(r.time || "")}${r.rating ? ` · 评价 ${r.rating} 星` : ""}</div></div>`).join("");
    return `
    <div class="detail-head">
      <div>
        <h4>${escapeHtml(l.title)}</h4>
        <div class="detail-meta">
          <span class="mono">${l.id}</span> · ${l.mailbox} · ${l.date}${!ext ? ` · ${escapeHtml(l.unit || "-")}` : ""}
        </div>
      </div>
      ${ext ? this.statusBadge(l.status) : this.stageBadge(l)}
    </div>
    <div style="margin:10px 0">
      ${this.catBadge(l.category)} <span class="tag">${l.affair}</span>
      ${ownerTags}
      ${mode !== "public" ? `<span class="tag">办结时限：${effectiveDeadline(l)}</span>` : ""}
      ${mode !== "public" && isOverdue(l) ? '<span class="tag overdue">已超期</span>' : ""}
      ${l.reopened ? '<span class="tag warn">二次办理</span>' : ""}
      ${l.supplements && l.supplements.length ? '<span class="tag info">已补充材料</span>' : ""}
      ${mode !== "public" && l.urged ? '<span class="tag warn">已催办</span>' : ""}
    </div>
    <div class="detail-section"><div class="sec-title">信件内容</div>
      <div class="rich-content">${contentHtml(l.content)}</div>
      ${l.attachments && l.attachments.length ? `<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px">${attachChipsHtml(l.attachments, "tag")}</div>` : ""}
    </div>
    ${mode === "student" && l.ack ? `<div class="detail-section"><div class="sec-title">收悉回执</div>
      <div class="ack-box">${escapeHtml(l.ack.text).replace(/\n/g, "<br>")}</div></div>` : ""}
    ${supsHtml && mode !== "public" ? `<div class="detail-section"><div class="sec-title">补充材料</div>${supsHtml}</div>` : ""}
    ${dpHtml ? `<div class="detail-section"><div class="sec-title">分派记录</div>${dpHtml}</div>` : ""}
    ${cbHtml ? `<div class="detail-section"><div class="sec-title">学院协同</div>${cbHtml}</div>` : ""}
    ${apHtml ? `<div class="detail-section"><div class="sec-title">审批记录</div>${apHtml}</div>` : ""}
    ${urgeHtml ? `<div class="detail-section"><div class="sec-title">催办记录</div>${urgeHtml}</div>` : ""}
    <div class="detail-section"><div class="sec-title">办理流程</div>
      <div class="timeline">
        ${log.map(s => `<div class="tl-item"><div class="tl-step">${s.step}</div>
          <div class="tl-meta">${s.time} · ${s.actor}</div>
          <div class="tl-note">${s.note}</div></div>`).join("")}
        ${next && !ext ? `<div class="tl-item pending"><div class="tl-step" style="color:var(--text-muted)">${next}</div></div>` : ""}
        ${ext && l.status !== STATUS.done && l.status !== STATUS.withdrawn ? `<div class="tl-item pending"><div class="tl-step" style="color:var(--text-muted)">待正式答复</div></div>` : ""}
      </div>
    </div>
    <div class="detail-section"><div class="sec-title">${l.reply || ext ? "正式答复" : "答复内容"}</div>
      ${replyHtml}${prevHtml}
    </div>
    ${msgs.length ? `<div class="detail-section"><div class="sec-title">消息记录${ext ? "" : `<span class="sec-sub">共 ${msgs.length} 条</span>`}</div>
      <div class="msg-list compact">${messageItemsHtml(msgs, { showTo: !ext })}</div></div>` : ""}
    ${mode === "student" ? this.studentActionsHtml(l) : ""}`;
  },

  studentActionsHtml(l) {
    if (l.status === STATUS.done) {
      return `<div class="detail-section"><div class="sec-title">满意度评价</div>
        ${l.rating ? this.ratingDoneHtml(l) : this.ratingFormHtml()}
      </div>
      ${l.rating ? `<div class="modal-actions">
        <button class="btn btn-outline" id="d-reopen">对结果不满意，申请二次办理</button>
      </div>` : ""}`;
    }
    if (l.status === STATUS.withdrawn) return "";
    return `<div class="modal-actions">
      <button class="btn btn-outline" id="d-supplement">补充材料</button>
      <button class="btn btn-outline" id="d-urge" ${l.urged ? "disabled" : ""}>${l.urged ? "已催办" : "催办"}</button>
      ${(l.status === STATUS.doing || l.status === STATUS.pending) ? `<button class="btn btn-danger" id="d-withdraw">撤回信件</button>` : ""}
    </div>`;
  },

  /* 列表行内操作：按状态仅展示可用动作，点击不打开详情 */
  studentRowActionsHtml(l) {
    if (l.status === STATUS.draft) {
      return `<div class="table-actions" data-stop>
        <button class="btn btn-primary btn-sm" data-act="edit" data-id="${l.id}">编辑</button>
        <button class="btn btn-danger btn-sm" data-act="del-draft" data-id="${l.id}">删除</button>
      </div>`;
    }
    if (l.status === STATUS.doing || l.status === STATUS.pending) {
      return `<div class="table-actions" data-stop>
        <button class="btn btn-outline btn-sm" data-act="supplement" data-id="${l.id}">补充</button>
        <button class="btn btn-outline btn-sm" data-act="urge" data-id="${l.id}" ${l.urged ? "disabled" : ""}>${l.urged ? "已催办" : "催办"}</button>
        <button class="btn btn-danger btn-sm" data-act="withdraw" data-id="${l.id}">撤回</button>
      </div>`;
    }
    if (l.status === STATUS.done) {
      return `<div class="table-actions" data-stop>
        ${l.rating
          ? `<button class="btn btn-outline btn-sm" data-act="reopen" data-id="${l.id}">二次办理</button>`
          : `<button class="btn btn-primary btn-sm" data-act="rate" data-id="${l.id}">评价</button>`}
      </div>`;
    }
    return `<span class="text-muted" style="font-size:12px;color:var(--text-muted)">—</span>`;
  },

  bindStudentRowActions() {
    document.querySelectorAll("[data-stop]").forEach(wrap => {
      wrap.addEventListener("click", e => e.stopPropagation());
    });
    document.querySelectorAll("[data-act]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const l = getLetterById(id);
        if (!l) return;
        const act = btn.dataset.act;
        if (act === "edit") { this.navigate("write"); return; }
        if (act === "del-draft") {
          saveLetters(getLetters().filter(x => x.id !== id));
          this.toast("草稿已删除"); this.render(); return;
        }
        if (act === "supplement") { this.showSupplement(l); return; }
        if (act === "urge") {
          if (l.urged) return;
          this.showUrge(l, () => this.render()); return;
        }
        if (act === "withdraw") {
          withdrawLetter(l); upsertLetter(l);
          this.toast("信件已撤回"); this.render(); return;
        }
        if (act === "rate") { this.showMyDetail(id); return; }
        if (act === "reopen") {
          requestReopen(l); upsertLetter(l);
          this.toast("已申请二次办理，信件回到原回复人重新办理"); this.render();
        }
      });
    });
  },

  /* 评价表单（未评价时）：星级（必填）+ 快捷标签（多选）+ 文字评价（选填） */
  ratingFormHtml() {
    return `<div class="rating-block">
      <div class="rating-row">
        <span class="rating-label">总体评分</span>
        <div class="rating-stars" id="rating-stars">${[1, 2, 3, 4, 5].map(i => `<button data-star="${i}" title="${i}星">★</button>`).join("")}</div>
        <span class="rating-hint" id="rating-hint">请点击星级</span>
      </div>
      <div class="rating-tags" id="rating-tags">${MOCK.ratingTags.map(t => `<button type="button" class="rate-chip" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join("")}</div>
      <textarea id="rating-comment" class="rating-comment" rows="3" maxlength="300" placeholder="说说本次办理的感受或建议（选填，最多 300 字）"></textarea>
      <div class="rating-actions"><button class="btn btn-primary btn-sm" id="rating-submit">${svgIcon("check")} 提交评价</button></div>
    </div>`;
  },

  /* 评价展示（已评价后只读）：星级 + 标签 + 文字 + 日期 */
  ratingDoneHtml(l) {
    return `<div class="rating-view">
      <div class="rating-view-top">
        <span class="rating-stars-static">${"★".repeat(l.rating)}${"☆".repeat(5 - l.rating)}</span>
        <span class="rating-score">${l.rating}.0 分</span>
        ${l.ratedAt ? `<span class="rating-date">评价于 ${l.ratedAt}</span>` : ""}
      </div>
      ${l.ratingTags && l.ratingTags.length ? `<div class="rating-tags-view">${l.ratingTags.map(t => `<span class="rate-chip on">${escapeHtml(t)}</span>`).join("")}</div>` : ""}
      ${l.ratingComment ? `<div class="rating-comment-view">${escapeHtml(l.ratingComment)}</div>` : ""}
    </div>`;
  },

  bindLetterDetail(l, mode) {
    const rateStars = document.getElementById("rating-stars");
    if (rateStars) {
      let sel = 0;
      const btns = rateStars.querySelectorAll("button");
      const hintEl = document.getElementById("rating-hint");
      const hints = ["请点击星级", "很不满意", "不太满意", "基本满意", "比较满意", "非常满意"];
      const paint = n => btns.forEach((x, i) => x.classList.toggle("on", i < n));
      btns.forEach(b => {
        b.addEventListener("mouseenter", () => btns.forEach((x, i) => x.classList.toggle("hover", i < +b.dataset.star)));
        b.addEventListener("mouseleave", () => btns.forEach(x => x.classList.remove("hover")));
        b.addEventListener("click", () => { sel = +b.dataset.star; paint(sel); if (hintEl) hintEl.textContent = hints[sel]; });
      });
      const tagWrap = document.getElementById("rating-tags");
      if (tagWrap) tagWrap.querySelectorAll(".rate-chip").forEach(c => c.addEventListener("click", () => c.classList.toggle("on")));
      const submit = document.getElementById("rating-submit");
      if (submit) submit.addEventListener("click", () => {
        if (!sel) { this.toast("请先选择星级评分"); return; }
        const ta = document.getElementById("rating-comment");
        rateLetter(l, sel, tagWrap ? [...tagWrap.querySelectorAll(".rate-chip.on")].map(c => c.dataset.tag) : [], ta ? ta.value.trim() : "");
        upsertLetter(l);
        this.toast("感谢您的评价！"); this.showMyDetail(l.id); this.renderSidebar();
      });
    }
    const reopen = document.getElementById("d-reopen");
    if (reopen) reopen.addEventListener("click", () => {
      requestReopen(l); upsertLetter(l);
      this.toast("已申请二次办理，原回复人将重新办理，答复仍须科室领导审批"); this.hideModal(); this.render();
    });
    const sup = document.getElementById("d-supplement");
    if (sup) sup.addEventListener("click", () => this.showSupplement(l));
    const urge = document.getElementById("d-urge");
    if (urge) urge.addEventListener("click", () => this.showUrge(l, () => { this.showMyDetail(l.id); this.renderSidebar(); }));
    const withdraw = document.getElementById("d-withdraw");
    if (withdraw) withdraw.addEventListener("click", () => {
      withdrawLetter(l); upsertLetter(l);
      this.toast("信件已撤回"); this.hideModal(); this.render();
    });
  },

  /* 催办：预览填充后的催办模板 + 选择渠道 + 发送并记录 */
  showUrge(l, onDone, by) {
    const channels = (MOCK.urgeChannels || ["sys"]).slice();
    this.showModal("催办", `
      <p class="form-hint" style="color:var(--text-muted);margin-bottom:12px">以下催办通知将发送给当前办理人（<b>${escapeHtml(urgeTarget(l))}</b>）：</p>
      <div class="detail-section"><div class="sec-title">催办内容（按模板自动生成）</div>
        <div class="urge-preview" id="urge-preview">${escapeHtml(fillUrgeTemplate(l))}</div>
      </div>
      <div class="form-group"><label>发送渠道</label>
        <div class="channel-opts">
          ${["sys", "its"].map(c => `<label class="channel-opt"><input type="checkbox" value="${c}" ${channels.includes(c) ? "checked" : ""}> ${CHANNEL_LABELS[c]}</label>`).join("")}
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" id="urge-send">${svgIcon("megaphone")} 发送催办</button>
        <button class="btn btn-ghost" id="urge-cancel">返回</button>
      </div>`);
    const send = document.getElementById("urge-send");
    if (send) send.addEventListener("click", () => {
      const ch = [...document.querySelectorAll(".channel-opts input:checked")].map(x => x.value);
      if (!ch.length) { this.toast("请至少选择一种发送渠道"); return; }
      sendUrge(l, ch, by || "student"); upsertLetter(l);
      this.toast(`已通过${channelLabel(ch)}催办至${urgeTarget(l)}`);
      if (onDone) onDone(); else this.hideModal();
    });
    const cancel = document.getElementById("urge-cancel");
    if (cancel) cancel.addEventListener("click", () => { if (onDone) onDone(); else this.hideModal(); });
  },

  showSupplement(l) {
    this.showModal("补充材料", `
      <p class="form-hint" style="color:var(--text-muted);margin-bottom:12px">补充与本诉求相关的情况说明或材料，提交后会提醒当前办理人查看。</p>
      <div class="form-group"><label>补充说明</label>
        <textarea id="sup-text" rows="5" placeholder="请描述需要补充的情况（若已上传附件，此项可不填）"></textarea></div>
      <div class="form-group"><label>补充附件</label>
        <div class="upload-zone" id="sup-upload"><div class="uz-inner">${svgIcon("paperclip")} 点击或拖拽上传附件（照片 / 文档，可选）</div></div>
        <input type="file" id="sup-upload-input" multiple hidden>
        <div class="up-list" id="sup-upload-list"></div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" id="sup-submit">提交补充</button>
        <button class="btn btn-ghost" id="sup-cancel">返回</button>
      </div>`);
    const uploader = makeUploader(
      document.getElementById("sup-upload"),
      document.getElementById("sup-upload-input"),
      document.getElementById("sup-upload-list"),
      (a) => this.showAttachmentPreview(a)
    );
    const submit = document.getElementById("sup-submit");
    if (submit) submit.addEventListener("click", () => {
      const t = document.getElementById("sup-text").value.trim();
      const atts = uploader.getMeta();
      if (!t && !atts.length) { this.toast("请填写补充说明或上传至少一个附件"); return; }
      addSupplement(l, t, atts);
      upsertLetter(l); this.toast("补充材料已提交，已提醒当前办理人"); this.showMyDetail(l.id);
    });
    const cancel = document.getElementById("sup-cancel");
    if (cancel) cancel.addEventListener("click", () => this.showMyDetail(l.id));
  },

  /* ---------- 信件查询（编号快速查询 + 多条件组合查询） ---------- */
  renderQuery() {
    const f = this.state.queryFilter || {};
    const hasCond = Object.keys(f).some(k => f[k]);
    const visible = getAllLetters().filter(l => l.owner === "me" || (l.status === STATUS.done && l.publicScope === "all"));
    const results = filterLetters(visible, Object.assign({ mailbox: this.mailbox }, f))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const pg = this.paginate(results, this.state.queryPage, 8);
    const recent = visible.slice(0, 4);

    this.afterRender = () => {
      const btn = document.getElementById("q-btn");
      const input = document.getElementById("q-input");
      const run = () => {
        const id = input.value.trim();
        const l = getLetterById(id);
        const box = document.getElementById("q-result");
        if (!id) { box.innerHTML = `<div class="no-reply">请输入信件编号</div>`; return; }
        if (!l || l.status === STATUS.draft || !(l.owner === "me" || (l.status === STATUS.done && l.publicScope === "all"))) {
          box.innerHTML = `<div class="no-reply">未查询到编号为 <b>${escapeHtml(id)}</b> 的信件（仅可查询本人来信或已公开信件）</div>`; return;
        }
        box.innerHTML = this.letterDetailHtml(l, l.owner === "me" ? "student" : "public");
        box.querySelectorAll(".modal-actions").forEach(x => x.remove());
      };
      btn.addEventListener("click", run);
      input.addEventListener("keydown", e => { if (e.key === "Enter") run(); });
      this.bindFilter("query");
      document.querySelectorAll("[data-open-public]").forEach(r =>
        r.addEventListener("click", () => {
          const l = getLetterById(r.dataset.openPublic);
          if (l && l.owner === "me") this.showMyDetail(l.id);
          else this.showPublicDetail(r.dataset.openPublic);
        }));
      this.bindStudentRowActions();
    };

    return `
    <div class="card"><div class="card-header"><h3>凭编号快速查询</h3><span class="hint">已知编号可精确定位</span></div>
      <div class="card-body">
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <input id="q-input" placeholder="请输入信件编号，如 XG20260612118" style="flex:1;min-width:240px;padding:10px 12px;border:1px solid var(--border);border-radius:9px">
          <button class="btn btn-primary" id="q-btn">查询</button>
        </div>
        <p class="form-hint" style="color:var(--text-muted)">提示：可试试这些编号 ${recent.map(l => `<span class="tag" onclick="document.getElementById('q-input').value='${l.id}';document.getElementById('q-btn').click()" style="cursor:pointer">${l.id}</span>`).join("")}</p>
        <div id="q-result" style="margin-top:14px"><div class="no-reply">输入编号后点击查询，查看信件的办理流程与答复</div></div>
      </div>
    </div>
    <p class="section-title">多条件组合查询</p>
    ${this.filterBar("query", [
      { name: "title", label: "信件标题", type: "text" },
      { name: "category", label: "信件分类", type: "select", options: MOCK.letterCategories.map(c => c.label) },
      { name: "affair", label: "事务分类", type: "select", options: MOCK.affairCategories },
      { name: "status", label: "办理状态", type: "select", options: [STATUS.pending, STATUS.doing, STATUS.done] },
      { name: "section", label: "承办科室", type: "select", options: MOCK.sections.map(s => s.name) },
      { name: "start", label: "起始日期", type: "date" },
      { name: "end", label: "截止日期", type: "date" }
    ])}
    <div class="card">
      <div class="card-header"><h3>查询结果</h3><span class="hint">${hasCond ? `按条件筛选 · 共 ${results.length} 封` : `默认展示最近来信 · 共 ${results.length} 封`}</span></div>
      <div class="card-body" style="padding:0">
        <table><thead><tr>
          <th style="width:140px">信件编号</th><th>标题</th><th style="width:80px">分类</th>
          <th style="width:140px">承办科室 / 回复人</th><th style="width:90px">状态</th><th style="width:95px">来信时间</th>
          <th style="width:200px">操作</th>
        </tr></thead><tbody>
          ${pg.rows.length ? pg.rows.map(l => `<tr class="clickable" data-open-public="${l.id}">
            <td class="mono">${l.id}</td>
            <td>${escapeHtml(l.title)}${this.cellExcerpt(l)}</td>
            <td>${this.catBadge(l.category)}</td>
            <td>${this.ownerCell(l, true)}</td>
            <td>${this.statusBadge(l.status)}</td>
            <td>${l.date}</td>
            <td>${l.owner === "me" ? this.studentRowActionsHtml(l) : `<span style="font-size:12px;color:var(--text-muted)">—</span>`}</td>
          </tr>`).join("") : `<tr><td colspan="7" class="table-empty">未找到符合条件的信件，请调整查询条件后重试</td></tr>`}
        </tbody></table>
      </div>
    </div>
    ${this.pagerHtml(pg.page, pg.total, "queryPage")}`;
  },

  /* ---------- 公开信件 ---------- */
  renderPublic() {
    const f = this.state.pubFilter || {};
    let list = getPublicLetters().filter(l => l.mailbox === this.mailbox);
    list = filterLetters(list, f).sort((a, b) => b.date.localeCompare(a.date));
    const pg = this.paginate(list, this.state.pubPage, 8);
    this.afterRender = () => {
      this.bindFilter("pub", ["title", "content", "dept"]);
      document.querySelectorAll("[data-open-public]").forEach(r =>
        r.addEventListener("click", () => this.showPublicDetail(r.dataset.openPublic)));
    };
    return `
    ${this.filterBar("pub", [
      { name: "title", label: "信件标题", type: "text" },
      { name: "content", label: "信件内容", type: "text" },
      { name: "dept", label: "承办科室", type: "text" }
    ])}
    <div class="card"><div class="card-body" style="padding:0">
      <table><thead><tr><th style="width:60px">序号</th><th>标题</th><th style="width:90px">分类</th><th style="width:120px">承办科室</th><th style="width:100px">时间</th></tr></thead>
      <tbody>
        ${pg.rows.length ? pg.rows.map((l, i) => `<tr class="clickable" data-open-public="${l.id}">
          <td>${(pg.page - 1) * 8 + i + 1}</td><td>${escapeHtml(l.title)}${this.cellExcerpt(l)}</td>
          <td>${this.catBadge(l.category)}</td><td>${deptLabel(l)}</td><td>${l.date}</td></tr>`).join("")
          : `<tr><td colspan="5" class="table-empty">暂无公开信件</td></tr>`}
      </tbody></table>
    </div></div>
    ${this.pagerHtml(pg.page, pg.total, "pubPage")}`;
  },

  showPublicDetail(id) {
    const l = getLetterById(id);
    if (!l) return;
    this.showModal("公开信件", this.letterDetailHtml(l, "public"));
    this.bindAttachments(() => this.showPublicDetail(id));
  },

  /* ---------- 制度文件 ---------- */
  renderPolicy() {
    const f = this.state.polFilter || {};
    let list = MOCK.policies.slice();
    if (f.title) list = list.filter(p => p.title.includes(f.title));
    if (f.cat) list = list.filter(p => p.cat === f.cat);
    if (f.status) list = list.filter(p => p.status === f.status);
    const pg = this.paginate(list, this.state.polPage, 8);
    this.afterRender = () => {
      this.bindFilter("pol", ["title", "cat", "status"]);
      document.querySelectorAll("[data-open-policy]").forEach(r =>
        r.addEventListener("click", () => this.showPolicyDetail(r.dataset.openPolicy)));
    };
    return `
    ${this.filterBar("pol", [
      { name: "title", label: "标题关键字", type: "text" },
      { name: "cat", label: "类别", type: "select", options: MOCK.policyCats },
      { name: "status", label: "效力状态", type: "select", options: ["现行有效", "已废止"] }
    ])}
    <div class="card"><div class="card-body" style="padding:0">
      <table><thead><tr><th style="width:60px">序号</th><th style="width:150px">文号</th><th>文件标题</th><th style="width:100px">类别</th><th style="width:90px">效力状态</th><th style="width:100px">日期</th></tr></thead>
      <tbody>
        ${pg.rows.length ? pg.rows.map((p, i) => `<tr class="clickable" data-open-policy="${escapeHtml(p.code)}">
          <td>${(pg.page - 1) * 8 + i + 1}</td><td class="mono">${p.code}</td><td>${escapeHtml(p.title)}</td>
          <td><span class="tag">${p.cat}</span></td>
          <td><span class="badge" style="background:${p.status === "现行有效" ? "#1BB9751a;color:#1BB975" : "#6270791a;color:#627079"}">${p.status}</span></td>
          <td>${p.date}</td></tr>`).join("")
          : `<tr><td colspan="6" class="table-empty">未找到相关文件</td></tr>`}
      </tbody></table>
    </div></div>
    ${this.pagerHtml(pg.page, pg.total, "polPage")}`;
  },

  showPolicyDetail(code) {
    const p = MOCK.policies.find(x => x.code === code);
    if (!p) return;
    this.showModal("制度文件详情", this.policyDetailHtml(p));
    this.bindAttachments(() => this.showPolicyDetail(code));
  },

  /* 制度文件详情 HTML（供弹窗与页面生成器复用） */
  policyDetailHtml(p) {
    const effective = p.status === "现行有效";
    const statusBadge = `<span class="badge" style="background:${effective ? "#1BB9751a;color:#1BB975" : "#6270791a;color:#627079"}">${p.status}</span>`;
    const attachments = p.attachments || [];
    return `
    <div class="detail-head">
      <div>
        <h4>${escapeHtml(p.title)}</h4>
        <div class="detail-meta"><span class="mono">${escapeHtml(p.code)}</span> · 发布日期 ${escapeHtml(p.date)}</div>
      </div>
      ${statusBadge}
    </div>
    <div style="margin:10px 0">
      <span class="tag">${escapeHtml(p.cat)}</span>
      <span class="tag">文号：${escapeHtml(p.code)}</span>
    </div>
    <div class="detail-section"><div class="sec-title">文件信息</div>
      <div class="info-grid">
        <div><div class="k">文号</div><div class="v mono">${escapeHtml(p.code)}</div></div>
        <div><div class="k">类别</div><div class="v">${escapeHtml(p.cat)}</div></div>
        <div><div class="k">效力状态</div><div class="v">${statusBadge}</div></div>
        <div><div class="k">发布日期</div><div class="v">${escapeHtml(p.date)}</div></div>
      </div>
    </div>
    <div class="detail-section"><div class="sec-title">文件正文</div>
      <div class="rich-content">${p.body ? contentHtml(p.body) : policySummary(p)}</div>
    </div>
    ${attachments.length ? `<div class="detail-section"><div class="sec-title">相关附件</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">${attachChipsHtml(attachments, "tag")}</div>
      <p class="form-hint" style="color:var(--text-muted)">点击附件可预览</p>
    </div>` : ""}`;
  },

  /* ---------- 数据统计 ---------- */
  renderStats() {
    const all = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const byCat = MOCK.letterCategories.map(c => ({
      label: c.label, color: c.color, value: all.filter(l => l.category === c.label).length
    })).filter(x => x.value > 0);
    const byDept = {};
    all.filter(l => l.dept).forEach(l => byDept[l.dept] = (byDept[l.dept] || 0) + 1);
    const deptRows = Object.entries(byDept).sort((a, b) => b[1] - a[1]);

    this.afterRender = () => {
      this.drawDonut("stat-donut", byCat);
      this.drawBars("stat-bars", deptRows.slice(0, 6).map(([k, v]) => ({ label: k.replace(/（.*）/, ""), value: v })));
    };

    const done = all.filter(l => l.status === STATUS.done).length;
    return `
    <div class="stat-grid">
      ${this.statCard("累计来信", all.length, "封 · " + this.mailbox, "#2A8DC7")}
      ${this.statCard("已办结", done, `办结率 ${all.length ? Math.round(done / all.length * 100) : 0}%`, "#1BB975")}
      ${this.statCard("平均办理时长", "3.6", "工作日", "#2A8DC7")}
      ${this.statCard("满意度", this.satisfactionRate(all) + "%", "好评占比", "#F29100")}
    </div>
    <div class="two-col">
      <div class="card"><div class="card-header"><h3>来信分类分布</h3></div>
        <div class="card-body"><div class="chart-wrap">
          <canvas id="stat-donut" width="160" height="160"></canvas>
          <div class="chart-legend">
            ${byCat.map(c => `<div class="legend-item"><span class="lg-dot" style="background:${c.color}"></span>${c.label}<span class="lg-val">${c.value}</span></div>`).join("")}
          </div>
        </div></div>
      </div>
      <div class="card"><div class="card-header"><h3>各承办科室来信量（Top6）</h3></div>
        <div class="card-body"><canvas id="stat-bars" width="440" height="220" style="max-width:100%"></canvas></div>
      </div>
    </div>
    <div class="card"><div class="card-header"><h3>科室办理统计</h3><span class="hint">按已分派信件统计</span></div>
      <div class="card-body" style="padding:0">
        <table><thead><tr><th style="width:60px">序号</th><th>承办科室</th><th>承办量</th><th>已办结</th><th>办结率</th></tr></thead>
        <tbody>
          ${deptRows.map(([d, v], i) => {
            const dn = all.filter(l => l.dept === d && l.status === STATUS.done).length;
            return `<tr><td>${i + 1}</td><td>${d}</td><td>${v}</td><td>${dn}</td><td>${Math.round(dn / v * 100)}%</td></tr>`;
          }).join("")}
        </tbody></table>
      </div>
    </div>`;
  },

  statCard(label, value, sub, color) {
    return `<div class="stat-card" style="--stat-accent:${color}">
      <div class="label"><span class="stat-dot" style="background:${color}"></span>${label}</div>
      <div class="value" style="color:${color}">${value}</div>
      <div class="sub">${sub}</div></div>`;
  },

  /* ---------- 科室联系方式 ---------- */
  renderDept() {
    return `
    <p class="section-title">学生工作部各科室负责人、科室成员、联系方式与职责分工</p>
    <div class="dept-grid">
      ${MOCK.sections.map(d => {
        const members = (d.members || []).filter(m => m.enabled !== false);
        return `<div class="dept-card">
        <h4>${d.name}</h4>
        <div class="dept-head">负责人：${escapeHtml(d.head)}</div>
        <div class="phone">${svgIcon("phone")} ${d.phone}</div>
        <div class="dept-email">${svgIcon("mail")} ${escapeHtml(d.email || "-")}</div>
        <div class="duty">${d.duty}</div>
        ${members.length ? `<div class="dept-members">
          <div class="dm-title">${svgIcon("users")} 科室成员</div>
          ${members.map(m => `<div class="dm-row"><span class="dm-name">${escapeHtml(m.name)}${m.leader ? ' <span class="tag info">科室领导</span>' : ""}</span>
            <span class="dm-title-tag">${escapeHtml(m.title || "科室成员")}</span>
            <span class="dm-phone mono">${escapeHtml(m.phone || "-")}</span></div>`).join("")}
        </div>` : ""}
      </div>`;
      }).join("")}
    </div>`;
  },

  /* ---------- 常见问题（学生端，读取配置） ---------- */
  renderFaq() {
    const faqs = faqsForDisplay();
    return `
    <div class="card"><div class="card-header"><h3>常见问题</h3></div>
      <div class="card-body">
        ${faqs.length ? faqs.map(f => `<details class="faq-item"><summary>${escapeHtml(f.q)}</summary>
          <div class="faq-a">${escapeHtml(f.a)}</div></details>`).join("") : '<div class="no-reply">暂无常见问题</div>'}
      </div>
    </div>`;
  },

  /* ---------- 筛选组件 ---------- */
  filterBar(ns, fields) {
    const cur = this.state[ns + "Filter"] || {};
    return `<div class="filter-bar" data-ns="${ns}">
      ${fields.map(f => {
        if (f.type === "select") {
          return `<div class="filter-item"><label>${f.label}</label>
            <select data-f="${f.name}"><option value="">全部</option>
            ${f.options.map(o => `<option ${cur[f.name] === o ? "selected" : ""}>${o}</option>`).join("")}</select></div>`;
        }
        if (f.type === "date") {
          return `<div class="filter-item"><label>${f.label}</label>
            <input type="date" data-f="${f.name}" value="${escapeHtml(cur[f.name] || "")}"></div>`;
        }
        return `<div class="filter-item"><label>${f.label}</label>
          <input data-f="${f.name}" value="${escapeHtml(cur[f.name] || "")}" placeholder="输入关键字"></div>`;
      }).join("")}
      <div class="filter-actions">
        <button class="btn btn-primary btn-sm" data-act="search">搜索</button>
        <button class="btn btn-outline btn-sm" data-act="reset">重置</button>
      </div>
    </div>`;
  },

  bindFilter(ns) {
    const bar = document.querySelector(`.filter-bar[data-ns="${ns}"]`);
    if (!bar) return;
    const collect = () => {
      const o = {};
      bar.querySelectorAll("[data-f]").forEach(el => { if (el.value.trim()) o[el.dataset.f] = el.value.trim(); });
      return o;
    };
    bar.querySelector('[data-act="search"]').addEventListener("click", () => {
      this.state[ns + "Filter"] = collect(); this.state[ns + "Page"] = 1; this.render();
    });
    bar.querySelector('[data-act="reset"]').addEventListener("click", () => {
      this.state[ns + "Filter"] = {}; this.state[ns + "Page"] = 1; this.render();
    });
    bar.querySelectorAll("[data-f]").forEach(el => el.addEventListener("keydown", e => {
      if (e.key === "Enter") { this.state[ns + "Filter"] = collect(); this.state[ns + "Page"] = 1; this.render(); }
    }));
  }
});

/* ============================================================
 * 办理端后台页面
 * ============================================================ */
Object.assign(App, {
  /* ---------- 办理工作台（综合办管理员） ---------- */
  renderAdminHome() {
    const all = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const pending = all.filter(l => stageOf(l) === STAGE.pending)
      .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    const doing = all.filter(l => l.status === STATUS.doing);
    const done = all.filter(l => l.status === STATUS.done);
    const overdue = all.filter(l => isOverdue(l));
    const stageRows = [STAGE.needReplier, STAGE.replying, STAGE.collab, STAGE.approving, STAGE.rejected, STAGE.confirm]
      .map(st => ({ st, n: doing.filter(l => stageOf(l) === st).length }));

    this.afterRender = () => {
      document.querySelectorAll("[data-handle]").forEach(r =>
        r.addEventListener("click", () => this.showHandle(r.dataset.handle)));
      document.querySelectorAll("[data-dispatch]").forEach(b =>
        b.addEventListener("click", (e) => { e.stopPropagation(); this.showDispatch(b.dataset.dispatch); }));
      this.drawDonut("admin-donut", [
        { label: "待分派", value: pending.length, color: "#F29100" },
        { label: "办理中", value: doing.length, color: "#2A8DC7" },
        { label: "已办结", value: done.length, color: "#1BB975" }
      ].filter(x => x.value));
    };

    return `
    <div class="hero hero-compact">
      <h2>${MOCK.intakeSection} · 办理工作台</h2>
      <p>${escapeHtml(MOCK.admin.name)} ｜ 全部来信统一送达本科室受理。请把来信分给承办科室的科室领导（科长），由科长指定回复人并审批答复；您负责全程督办催办。</p>
    </div>
    <div class="stat-grid">
      ${this.statCard("待分派", pending.length, "需尽快分给科室领导", "#F29100")}
      ${this.statCard("办理中", doing.length, "科室正在办理", "#2A8DC7")}
      ${this.statCard("已办结", done.length, "本周期", "#1BB975")}
      ${this.statCard("超期预警", overdue.length, "需督办", "#DF2027")}
    </div>
    <div class="grid-3-2">
      <div class="card">
        <div class="card-header"><h3>待分派来信</h3>
          <span class="more" onclick="location.hash='#/dispatch'">全部待分派 ›</span></div>
        <div class="card-body" style="padding:0">
          <table><thead><tr><th>来信</th><th style="width:88px">来信时间</th><th style="width:72px">操作</th></tr></thead>
          <tbody>
            ${pending.length ? pending.slice(0, 8).map(l => `<tr class="clickable" data-handle="${l.id}">
              <td>
                <div>${escapeHtml(l.title)} ${isOverdue(l) ? '<span class="tag overdue">超期</span>' : ""}</div>
                <div class="cell-sub"><span class="mono">${l.id}</span> · ${escapeHtml(l.name)} · ${escapeHtml(l.unit || "-")} · ${escapeHtml(l.affair)}</div>
              </td>
              <td>${l.date}</td>
              <td><button class="btn btn-primary btn-sm" data-dispatch="${l.id}">分派</button></td></tr>`).join("")
              : `<tr><td colspan="3" class="table-empty">暂无待分派来信，全部已分给科室领导</td></tr>`}
          </tbody></table>
        </div>
      </div>
      <div class="card"><div class="card-header"><h3>办理情况概览</h3></div>
        <div class="card-body"><div class="chart-wrap">
          <canvas id="admin-donut" width="150" height="150"></canvas>
          <div class="chart-legend">
            <div class="legend-item"><span class="lg-dot" style="background:#F29100"></span>待分派<span class="lg-val">${pending.length}</span></div>
            <div class="legend-item"><span class="lg-dot" style="background:#2A8DC7"></span>办理中<span class="lg-val">${doing.length}</span></div>
            <div class="legend-item"><span class="lg-dot" style="background:#1BB975"></span>已办结<span class="lg-val">${done.length}</span></div>
          </div>
        </div></div>
        <div class="card-body stage-strip">
          ${stageRows.map(r => `<div class="stage-cell"><span class="dot" style="background:${stageColor(r.st)}"></span>${r.st}<b>${r.n}</b></div>`).join("")}
        </div>
      </div>
    </div>`;
  },

  /* ---------- 待分派信件（综合办管理员核心页面） ---------- */
  renderDispatch() {
    const f = this.state.dpFilter || {};
    const all = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    let list = all.filter(l => stageOf(l) === STAGE.pending);
    const total = list.length;
    list = filterLetters(list, f).sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    const pg = this.paginate(list, this.state.dpPage, 8);
    const overdueCnt = list.filter(l => isOverdue(l)).length;
    /* 最近分派记录：按分派时间倒序 */
    const recent = all.filter(l => (l.dispatches || []).length)
      .map(l => ({ l: l, d: l.dispatches[l.dispatches.length - 1] }))
      .sort((a, b) => (b.d.at || "").localeCompare(a.d.at || "")).slice(0, 6);

    this.afterRender = () => {
      this.bindFilter("dp", ["title", "category", "affair"]);
      document.querySelectorAll("[data-handle]").forEach(r =>
        r.addEventListener("click", () => this.showHandle(r.dataset.handle)));
      document.querySelectorAll("[data-dispatch]").forEach(b =>
        b.addEventListener("click", (e) => { e.stopPropagation(); this.showDispatch(b.dataset.dispatch); }));
      this.bindBatchDispatch();
    };

    return `
    <p class="section-title">学生来信统一送达${MOCK.intakeSection}，请在此分给承办科室的科室领导（科长），由科长指定回复人。系统不按问题类型推荐科室。</p>
    <div class="stat-grid stat-grid-3">
      ${this.statCard("待分派总数", total, "等待分派", "#F29100")}
      ${this.statCard("其中超期", overdueCnt, "已超办结时限", "#DF2027")}
      ${this.statCard("可分科室", MOCK.sections.filter(s => sectionLeader(s.name)).length, "已配置科室领导", "#2A8DC7")}
    </div>
    ${this.filterBar("dp", [
      { name: "title", label: "信件标题", type: "text" },
      { name: "category", label: "信件分类", type: "select", options: MOCK.letterCategories.map(c => c.label) },
      { name: "affair", label: "事务分类", type: "select", options: MOCK.affairCategories }
    ])}
    <div class="card">
      <div class="card-header"><h3>待分派清单</h3>
        <div class="batch-bar">
          <span class="batch-hint" id="dp-batch-hint">已选 0 封</span>
          <button class="btn btn-primary btn-sm" id="btn-batch-dispatch" disabled>${svgIcon("share")} 批量分派</button>
        </div>
      </div>
      <div class="card-body" style="padding:0">
        <table><thead><tr>
          <th style="width:36px" class="sel-cell"><input type="checkbox" id="dp-sel-all" title="全选"></th>
          <th style="width:130px">编号</th><th>标题 / 事务</th><th style="width:76px">分类</th>
          <th style="width:62px">来信人</th><th style="width:110px">所在单位</th><th style="width:88px">来信时间</th><th style="width:72px">操作</th>
        </tr></thead><tbody>
          ${pg.rows.length ? pg.rows.map(l => `<tr class="clickable" data-handle="${l.id}">
            <td class="sel-cell"><input type="checkbox" class="dp-sel" data-sel="${l.id}" onclick="event.stopPropagation()"></td>
            <td class="mono">${l.id}</td>
            <td>${escapeHtml(l.title)} <span class="tag">${escapeHtml(l.affair)}</span> ${isOverdue(l) ? '<span class="tag overdue">超期</span>' : ""} ${l.urged ? '<span class="tag warn">已催办</span>' : ""}${this.cellExcerpt(l)}</td>
            <td>${this.catBadge(l.category)}</td>
            <td>${escapeHtml(l.name)}</td>
            <td>${escapeHtml(l.unit || "-")}</td>
            <td>${l.date}</td>
            <td><button class="btn btn-primary btn-sm" data-dispatch="${l.id}">分派</button></td>
          </tr>`).join("") : `<tr><td colspan="8" class="table-empty">暂无待分派来信</td></tr>`}
        </tbody></table>
      </div>
    </div>
    ${this.pagerHtml(pg.page, pg.total, "dpPage")}
    <div class="card"><div class="card-header"><h3>最近分派记录</h3><span class="hint">最新 6 条</span></div>
      <div class="card-body" style="padding:0">
        <table><thead><tr><th style="width:140px">编号</th><th>标题</th><th style="width:130px">承办科室</th><th style="width:140px">科室领导</th><th style="width:130px">分派时间</th></tr></thead>
        <tbody>
          ${recent.length ? recent.map(({ l, d }) => `<tr class="clickable" data-handle="${l.id}">
            <td class="mono">${l.id}</td><td>${escapeHtml(l.title)}</td>
            <td>${escapeHtml(d.section)}</td>
            <td>${escapeHtml(d.name)}${d.title ? `<span class="cell-sub">${escapeHtml(d.title)}${d.type === "改派科室" ? " · 改派" : ""}</span>` : ""}</td>
            <td>${escapeHtml(d.at || "")}</td></tr>`).join("")
            : `<tr><td colspan="5" class="table-empty">暂无分派记录</td></tr>`}
        </tbody></table>
      </div>
    </div>`;
  },

  /* 批量分派：勾选多封 → 统一分给同一科室领导 */
  bindBatchDispatch() {
    const hint = document.getElementById("dp-batch-hint");
    const btn = document.getElementById("btn-batch-dispatch");
    const all = document.getElementById("dp-sel-all");
    if (!btn) return;
    const boxes = () => [...document.querySelectorAll(".dp-sel")];
    const selected = () => boxes().filter(b => b.checked).map(b => b.dataset.sel);
    const sync = () => {
      const n = selected().length;
      if (hint) hint.textContent = `已选 ${n} 封`;
      btn.disabled = n === 0;
      if (all) all.checked = n > 0 && n === boxes().length;
    };
    boxes().forEach(b => b.addEventListener("change", sync));
    if (all) all.addEventListener("change", () => { boxes().forEach(b => { b.checked = all.checked; }); sync(); });
    btn.addEventListener("click", () => {
      const ids = selected();
      if (!ids.length) { this.toast("请先勾选需分派的来信"); return; }
      this.showDispatch(ids);
    });
    sync();
  },

  /* ---------- 分派弹窗：选择承办科室，系统带出该科室的科室领导（科长） ---------- */
  showDispatch(idOrIds) {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    const letters = ids.map(getLetterById).filter(Boolean);
    if (!letters.length) return;
    if (this.role !== "admin") { this.toast(`仅${MOCK.intakeSection}可分派`); return; }
    const single = letters.length === 1 ? letters[0] : null;
    const isTransfer = !!(single && single.dept);
    this.state.dpSec = "";

    const targetInfo = single
      ? `<div class="dispatch-target">
          <div class="dt-title">${escapeHtml(single.title)}</div>
          <div class="dt-meta"><span class="mono">${single.id}</span> · ${escapeHtml(single.name)} · ${escapeHtml(single.unit || "-")} · ${single.date}</div>
          <div class="dt-tags">${this.catBadge(single.category)} <span class="tag">${escapeHtml(single.affair)}</span>
            ${isTransfer ? `<span class="tag warn">原科室：${escapeHtml(single.dept)}${single.leader ? " · 科长 " + escapeHtml(single.leader.name) : ""}</span>` : ""}</div>
          <div class="dt-content">${escapeHtml(contentExcerpt(single.content, 160))}</div>
        </div>`
      : `<div class="dispatch-target">
          <div class="dt-title">批量分派 ${letters.length} 封来信</div>
          <div class="dt-meta">以下来信将统一分给同一科室的科室领导</div>
          <div class="dt-list">${letters.map(l => `<div class="dt-row"><span class="mono">${l.id}</span> ${escapeHtml(l.title)} <span class="tag">${escapeHtml(l.affair)}</span></div>`).join("")}</div>
        </div>`;

    this.showModal(isTransfer ? "改派科室" : "分给科室领导", `
      ${targetInfo}
      <div class="detail-section"><div class="sec-title">选择承办科室${isTransfer ? "（改派后原分派记录保留，回复人需由新科室领导重新指定）" : ""}</div>
        <div class="pick-grid" id="dp-sec-grid">
          ${MOCK.sections.map(s => {
            const leader = sectionLeader(s.name);
            const load = getSectionLetters(s.name).filter(l => l.status === STATUS.doing).length;
            const cur = isTransfer && s.name === single.dept;
            return `<button type="button" class="pick-item" data-sec="${escapeHtml(s.name)}" ${leader && !cur ? "" : "disabled"}>
              <span class="pi-name">${escapeHtml(s.name)}${cur ? '<span class="pi-rec">当前</span>' : ""}</span>
              <span class="pi-sub">${leader ? `科室领导 ${escapeHtml(leader.name)}（${escapeHtml(leader.title || "科长")}） · 在办 ${load} 封` : "未配置科室领导"}</span>
            </button>`;
          }).join("")}
        </div>
        <p class="form-hint" style="color:var(--text-muted)" id="dp-hint">请选择承办科室；系统不按问题类型推荐科室。</p>
      </div>
      <div class="form-group"><label>${isTransfer ? "改派说明" : "分派说明"}（可选）</label>
        <textarea id="dp-note" rows="2" placeholder="如：请核实后指定回复人，按时答复"></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" id="dp-confirm">${svgIcon("share")} ${isTransfer ? "确认改派" : "确认分派"}</button>
        <button class="btn btn-ghost" id="dp-cancel">取消</button>
      </div>`);

    document.querySelectorAll("#dp-sec-grid [data-sec]").forEach(b => b.addEventListener("click", () => {
      this.state.dpSec = b.dataset.sec;
      document.querySelectorAll("#dp-sec-grid [data-sec]").forEach(x => x.classList.toggle("on", x === b));
      const leader = sectionLeader(b.dataset.sec);
      const hint = document.getElementById("dp-hint");
      if (hint && leader) hint.textContent = `将分给 ${b.dataset.sec} 科室领导 ${leader.name}（${leader.title || "科长"}）${leader.phone ? " · " + leader.phone : ""}，由其指定回复人`;
    }));

    const confirm = document.getElementById("dp-confirm");
    if (confirm) confirm.addEventListener("click", () => {
      const sec = this.state.dpSec;
      if (!sec) { this.toast("请先选择承办科室"); return; }
      const note = ((document.getElementById("dp-note") || {}).value || "").trim();
      letters.forEach(l => { assignLeader(l, sec, note); upsertLetter(l); });
      const leader = sectionLeader(sec);
      this.toast(letters.length > 1
        ? `已将 ${letters.length} 封来信分给 ${sec} · ${leader ? leader.name : ""}`
        : `已${isTransfer ? "改派" : "分"}至 ${sec} · 科室领导 ${leader ? leader.name : ""}，已发送提醒`);
      this.hideModal(); this.render();
    });
    const cancel = document.getElementById("dp-cancel");
    if (cancel) cancel.addEventListener("click", () => this.hideModal());
  },

  /* ---------- 信件收件箱（综合办：全部来信，含承办去向） ---------- */
  renderInbox() {
    const f = this.state.inboxFilter || {};
    let list = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const tab = this.state.inboxTab || "全部";
    const counts = {
      "全部": list.length,
      "待分派": list.filter(l => l.status === STATUS.pending).length,
      "办理中": list.filter(l => l.status === STATUS.doing).length,
      "已办结": list.filter(l => l.status === STATUS.done).length,
      "已撤回": list.filter(l => l.status === STATUS.withdrawn).length
    };
    if (tab !== "全部") list = list.filter(l => l.status === tab);
    list = filterLetters(list, f).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const pg = this.paginate(list, this.state.inboxPage, 8);
    const stageOpts = [STAGE.pending, STAGE.needReplier, STAGE.replying, STAGE.collab, STAGE.approving, STAGE.rejected, STAGE.confirm, STAGE.done];

    this.afterRender = () => {
      document.querySelectorAll("[data-tab]").forEach(t => t.addEventListener("click", () => {
        this.state.inboxTab = t.dataset.tab; this.state.inboxPage = 1; this.render();
      }));
      this.bindFilter("inbox");
      document.querySelectorAll("[data-handle]").forEach(r =>
        r.addEventListener("click", () => this.showHandle(r.dataset.handle)));
      document.querySelectorAll("[data-dispatch]").forEach(b =>
        b.addEventListener("click", (e) => { e.stopPropagation(); this.showDispatch(b.dataset.dispatch); }));
    };
    const tabs = ["全部", "待分派", "办理中", "已办结", "已撤回"];
    return `
    ${this.filterBar("inbox", [
      { name: "title", label: "信件标题", type: "text" },
      { name: "category", label: "信件分类", type: "select", options: MOCK.letterCategories.map(c => c.label) },
      { name: "stage", label: "当前环节", type: "select", options: stageOpts },
      { name: "dept", label: "承办科室", type: "text" },
      { name: "assignee", label: "回复人", type: "text" }
    ])}
    <div class="tabs">
      ${tabs.map(t => `<button class="tab ${tab === t ? "active" : ""}" data-tab="${t}">${t} <span class="cnt">${counts[t]}</span></button>`).join("")}
    </div>
    <div class="card"><div class="card-body" style="padding:0">
      <table><thead><tr>
        <th style="width:140px">编号</th><th>标题</th><th style="width:80px">分类</th>
        <th style="width:66px">来信人</th><th style="width:150px">承办科室 / 科长 / 回复人</th><th style="width:90px">来信时间</th><th style="width:104px">当前环节</th><th style="width:70px">操作</th>
      </tr></thead><tbody>
        ${pg.rows.length ? pg.rows.map(l => `<tr class="clickable" data-handle="${l.id}">
          <td class="mono">${l.id}</td>
          <td>${escapeHtml(l.title)} ${isOverdue(l) ? '<span class="tag overdue">超期</span>' : ""} ${l.urged ? '<span class="tag warn">已催办</span>' : ""} ${l.reopened ? '<span class="tag warn">二次办理</span>' : ""}${this.cellExcerpt(l)}</td>
          <td>${this.catBadge(l.category)}</td>
          <td>${escapeHtml(l.name)}</td>
          <td>${this.ownerCell(l)}</td>
          <td>${l.date}</td>
          <td>${this.stageBadge(l)}</td>
          <td>${stageOf(l) === STAGE.pending
            ? `<button class="btn btn-primary btn-sm" data-dispatch="${l.id}">分派</button>`
            : `<button class="btn btn-outline btn-sm" data-handle="${l.id}" onclick="event.stopPropagation()">查看</button>`}</td>
        </tr>`).join("") : `<tr><td colspan="8" class="table-empty">暂无信件</td></tr>`}
      </tbody></table>
    </div></div>
    ${this.pagerHtml(pg.page, pg.total, "inboxPage")}`;
  },

  /* ---------- 信件办理详情（综合办：分派/改派/督办；科室领导：指定回复人/审批；回复人：拟稿/协同/提交/确认发送） ---------- */
  showHandle(id) {
    const l = getLetterById(id);
    if (!l) return;
    const role = this.role;
    if (role === "college") { this.showCollab(id); return; }
    if ((role === "leader" || role === "replier") && l.dept !== this.section) {
      this.toast(l.dept ? "该信件不属于本科室" : `该信件尚未分派，正在${MOCK.intakeSection}受理`); return;
    }
    const st = stageOf(l);
    const isLeader = role === "leader";
    const isMine = role === "replier" && l.assignee && l.assignee.memberId === this.memberId();
    const draft = (l.replyDraft && l.replyDraft.content) || "";
    const lastReject = (l.approvals || []).slice().reverse().find(a => a.result === "reject");
    const latestOpinion = (l.collabs || []).slice().reverse().find(c => c.opinion);
    const blocks = [];
    const actions = [];

    if (role === "admin") {
      if (st === STAGE.pending) actions.push(`<button class="btn btn-primary" id="h-dispatch">${svgIcon("share")} 分给科室领导</button>`);
      else if (l.status === STATUS.doing) actions.push(`<button class="btn btn-outline" id="h-dispatch">${svgIcon("share")} 改派科室</button>`);
      if ((l.status === STATUS.doing || l.status === STATUS.pending) && !l.urged) actions.push(`<button class="btn btn-outline" id="h-urge">督办提醒</button>`);
    }

    if (isLeader && [STAGE.needReplier, STAGE.replying, STAGE.rejected, STAGE.collab].includes(st)) {
      const cands = replierCandidates(l.dept);
      const cur = l.assignee ? l.assignee.memberId : "";
      this.state.hRep = cur || "";
      blocks.push(`<div class="detail-section action-block"><div class="sec-title">${cur ? "改派回复人" : "指定回复人"}</div>
        ${cands.length ? `<div class="pick-grid pick-grid-member" id="h-rep-grid">${cands.map(m => {
          const load = getMemberLetters(m.id).filter(x => x.status === STATUS.doing).length;
          return `<button type="button" class="pick-item ${m.id === cur ? "on" : ""}" data-rep="${escapeHtml(m.id)}">
            <span class="pi-name">${escapeHtml(m.name)}${m.id === cur ? '<span class="pi-rec">当前</span>' : ""}</span>
            <span class="pi-sub">${escapeHtml(m.title || "科室成员")} · 在办 ${load} 封</span></button>`;
        }).join("")}</div>` : `<div class="no-reply">本科室暂无可指定的回复人，请联系综合办在「科室与人员」中添加</div>`}
        <div class="form-group" style="margin-top:10px"><label>说明（可选）</label>
          <input id="h-rep-note" placeholder="如：请核实后三个工作日内拟写答复"></div>
      </div>`);
      if (cands.length) actions.push(`<button class="btn btn-primary" id="h-assign">${svgIcon("userCheck")} ${cur ? "确认改派" : "确认指定"}</button>`);
    }

    if (isLeader && st === STAGE.approving) {
      blocks.push(`<div class="detail-section action-block"><div class="sec-title">审批答复</div>
        <div class="approve-draft"><div class="draft-flag">待审批答复 · ${escapeHtml(assigneeLabel(l))} 提交</div>${escapeHtml(draft).replace(/\n/g, "<br>")}</div>
        ${latestOpinion ? `<div class="cb-opinion" style="margin-top:8px"><b>学院处理意见</b>：${escapeHtml(latestOpinion.opinion)}</div>` : ""}
        <div class="form-group" style="margin-top:10px"><label>审批意见（打回时必填）</label>
          <textarea id="h-opinion" rows="3" placeholder="通过可不填；打回请写明修改意见"></textarea></div>
        <p class="form-hint" style="color:var(--text-muted)">科室领导只审批，不直接修改答复或发送给学生；通过后由回复人确认发送。</p>
      </div>`);
      actions.push(`<button class="btn btn-primary" id="h-pass">${svgIcon("check")} 审批通过</button>`);
      actions.push(`<button class="btn btn-danger" id="h-reject">打回修改</button>`);
    }

    if (isMine && (st === STAGE.replying || st === STAGE.rejected)) {
      const col = collegeList(true).find(c => c.name === l.unit);
      blocks.push(`<div class="detail-section action-block"><div class="sec-title">${st === STAGE.rejected ? "按审批意见修改答复" : "拟写答复"}</div>
        ${st === STAGE.rejected && lastReject ? `<div class="reject-banner"><b>审批打回</b>（${escapeHtml(lastReject.by)} · ${escapeHtml(lastReject.at)}）：${escapeHtml(lastReject.opinion)}</div>` : ""}
        ${latestOpinion ? `<div class="cb-opinion"><b>${escapeHtml(latestOpinion.college)}处理意见</b>：${escapeHtml(latestOpinion.opinion)}</div>` : ""}
        <div class="form-group"><label class="form-required">答复内容</label>
          <textarea id="h-reply" rows="6" placeholder="请拟写正式答复，提交科室领导审批后再由您确认发送给学生">${escapeHtml(draft)}</textarea></div>
        <p class="form-hint" style="color:var(--text-muted)">${col
          ? `如不能直接拟写，可请来信学生所在学院（${escapeHtml(col.name)}）副书记 ${escapeHtml(col.secretary)} 协同。`
          : "来信学生所在学院没有副书记。副书记由学工系统维护，信箱直接使用，暂不能发起学院协同。"}</p>
      </div>`);
      actions.push(`<button class="btn btn-primary" id="h-submit">${svgIcon("share")} ${st === STAGE.rejected ? "修改后再次提交审批" : "提交科室领导审批"}</button>`);
      actions.push(`<button class="btn btn-outline" id="h-save">暂存答复</button>`);
      if (col && st === STAGE.replying) actions.push(`<button class="btn btn-outline" id="h-collab">${svgIcon("users")} 发起学院协同</button>`);
    }

    if (isMine && st === STAGE.collab) {
      const c = openCollab(l);
      blocks.push(`<div class="detail-section action-block"><div class="sec-title">学院协同中</div>
        <div class="no-reply">已请 ${escapeHtml(c ? c.college + "副书记 " + c.secretary : "学院副书记")} 协同。副书记指定人员线下承办后写处理意见并发回，届时您会收到提醒，再据此拟写答复。</div></div>`);
    }

    if (isMine && st === STAGE.approving) {
      blocks.push(`<div class="detail-section action-block"><div class="sec-title">等待审批</div>
        <div class="no-reply">答复已提交 ${escapeHtml(leaderLabel(l))} 审批。审批通过后您需再次确认，才会发送给学生。</div></div>`);
    }

    if (isMine && st === STAGE.confirm) {
      blocks.push(`<div class="detail-section action-block"><div class="sec-title">确认发送</div>
        <div class="approve-draft"><div class="draft-flag ok">科室领导已审批通过</div>${escapeHtml(draft).replace(/\n/g, "<br>")}</div>
        <div class="form-group" style="margin-top:12px"><label class="form-required">公开范围</label>
          <div class="radio-group scope-radio">
            <label><input type="radio" name="h-scope" value="all"> 全部公开<span class="form-hint">其他学生可在「公开信件」中查看</span></label>
            <label><input type="radio" name="h-scope" value="college"> 仅该学院副书记可见<span class="form-hint">仅${escapeHtml(l.unit || "该学院")}副书记可见</span></label>
          </div>
          <p class="form-hint" style="color:var(--text-muted)">无论选择哪种范围，来信学生本人都能看到正式答复。</p>
        </div>
      </div>`);
      actions.push(`<button class="btn btn-primary" id="h-send">${svgIcon("check")} 确认发送并办结</button>`);
    }

    if (role === "replier" && !isMine && l.status !== STATUS.done) {
      blocks.push(`<div class="detail-section"><div class="sec-title">办理答复</div>
        <div class="no-reply">${l.assignee ? `本信件由 <b>${escapeHtml(assigneeLabel(l))}</b> 负责回复，您可查看但不可代为答复。` : "本信件尚待科室领导指定回复人。"}</div></div>`);
    }

    const title = {
      admin: st === STAGE.pending ? "信件受理（综合办）" : "信件督办（综合办）",
      leader: st === STAGE.approving ? "审批答复（科室领导）" : (st === STAGE.needReplier ? "指定回复人（科室领导）" : "信件详情（本科室）"),
      replier: isMine ? `信件办理 · ${st}` : "信件详情（本科室）"
    }[role] || "信件详情";

    this.showModal(title, `
      ${this.letterDetailHtml(l, "view")}
      <div class="detail-section"><div class="sec-title">来信人信息</div>
        <div class="info-grid">
          <div><div class="k">姓名</div><div class="v">${escapeHtml(l.name)}</div></div>
          <div><div class="k">所在单位</div><div class="v">${escapeHtml(l.unit || "-")}</div></div>
          <div><div class="k">联系电话</div><div class="v">${escapeHtml(l.phone || "-")}</div></div>
          <div><div class="k">联系邮箱</div><div class="v">${escapeHtml(l.email || "-")}</div></div>
        </div>
      </div>
      <div class="detail-section"><div class="sec-title">承办信息</div>
        <div class="info-grid">
          <div><div class="k">承办科室</div><div class="v">${escapeHtml(deptLabel(l))}</div></div>
          <div><div class="k">科室领导</div><div class="v">${escapeHtml(leaderLabel(l) || "—")}</div></div>
          <div><div class="k">回复人</div><div class="v">${escapeHtml(assigneeLabel(l) || "—")}</div></div>
          <div><div class="k">当前办理人</div><div class="v">${escapeHtml(handlerLabel(l))}</div></div>
          <div><div class="k">分派时间</div><div class="v">${escapeHtml(l.dispatchedAt || "—")}</div></div>
          <div><div class="k">办结时限</div><div class="v">${effectiveDeadline(l)}${isOverdue(l) ? ' <span class="tag overdue">超期</span>' : ""}</div></div>
        </div>
      </div>
      ${blocks.join("")}
      ${actions.length ? `<div class="modal-actions">${actions.join("")}</div>` : ""}`);
    this.bindHandle(l);
    this.bindAttachments(() => this.showHandle(id));
  },

  bindHandle(l) {
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener("click", fn); };
    const done = (msg) => { upsertLetter(l); this.toast(msg); this.hideModal(); this.render(); };
    const replyText = () => ((document.getElementById("h-reply") || {}).value || "").trim();

    on("h-dispatch", () => this.showDispatch(l.id));
    on("h-urge", () => {
      sendUrge(l, MOCK.urgeChannels, "admin");
      done(`已通过${channelLabel(MOCK.urgeChannels)}向 ${urgeTarget(l)} 发送督办提醒`);
    });

    document.querySelectorAll("#h-rep-grid [data-rep]").forEach(b => b.addEventListener("click", () => {
      this.state.hRep = b.dataset.rep;
      document.querySelectorAll("#h-rep-grid [data-rep]").forEach(x => x.classList.toggle("on", x === b));
    }));
    on("h-assign", () => {
      const mid = this.state.hRep;
      if (!mid) { this.toast("请选择回复人"); return; }
      if (l.assignee && l.assignee.memberId === mid) { this.toast("请选择一位新的回复人"); return; }
      const rec = assignReplier(l, mid, ((document.getElementById("h-rep-note") || {}).value || "").trim());
      done(`已${rec.type === "改派回复人" ? "改派" : "指定"} ${rec.name} 为回复人，已发送提醒`);
    });

    on("h-pass", () => {
      approveReply(l, true, ((document.getElementById("h-opinion") || {}).value || "").trim());
      done("审批通过，已提醒回复人确认发送");
    });
    on("h-reject", () => {
      const op = ((document.getElementById("h-opinion") || {}).value || "").trim();
      if (!op) { this.toast("打回时请填写修改意见"); return; }
      approveReply(l, false, op);
      done("已打回回复人修改，并附审批意见");
    });

    on("h-save", () => {
      saveReplyDraft(l, replyText());
      upsertLetter(l); this.toast("答复已暂存");
    });
    on("h-submit", () => {
      const txt = replyText();
      if (txt.length < 10) { this.toast("请填写答复内容（不少于10字）后再提交审批"); return; }
      submitApproval(l, txt);
      done(`已提交 ${l.leader ? l.leader.name : "科室领导"} 审批`);
    });
    on("h-collab", () => {
      const txt = replyText();
      if (txt) saveReplyDraft(l, txt);
      upsertLetter(l);
      this.showCollabStart(l.id);
    });
    on("h-send", () => {
      const scope = (document.querySelector('input[name="h-scope"]:checked') || {}).value;
      if (!scope) { this.toast("请选择公开范围"); return; }
      confirmSend(l, scope);
      done(`正式答复已发送给来信人，信件办结（${PUBLIC_SCOPE[scope]}）`);
    });
  },

  /* 发起学院协同：直接发给来信学生所在学院的副书记 */
  showCollabStart(id) {
    const l = getLetterById(id);
    if (!l) return;
    const c = collegeList(true).find(x => x.name === l.unit);
    if (!c) { this.toast("来信学生所在学院没有副书记。副书记由学工系统维护，信箱直接使用"); return; }
    this.showModal("发起学院协同", `
      <div class="dispatch-target">
        <div class="dt-title">${escapeHtml(l.title)}</div>
        <div class="dt-meta"><span class="mono">${l.id}</span> · ${escapeHtml(l.name)} · ${escapeHtml(l.unit || "-")}</div>
      </div>
      <div class="info-grid" style="margin:12px 0">
        <div><div class="k">协同学院</div><div class="v">${escapeHtml(c.name)}</div></div>
        <div><div class="k">副书记</div><div class="v">${escapeHtml(c.secretary)}（${escapeHtml(c.title || "副书记")}）</div></div>
        <div><div class="k">联系电话</div><div class="v">${escapeHtml(c.phone || "-")}</div></div>
      </div>
      <div class="form-group"><label class="form-required">协同说明</label>
        <textarea id="cb-note" rows="3" placeholder="请说明需要学院核实或承办的事项"></textarea></div>
      <p class="form-hint" style="color:var(--text-muted)">直接发给学生所在学院的副书记。副书记指定人员线下承办后写处理意见并发回您；线下承办不是系统审批环节。</p>
      <div class="modal-actions">
        <button class="btn btn-primary" id="cb-send">${svgIcon("users")} 发送协同请求</button>
        <button class="btn btn-ghost" id="cb-back">返回</button>
      </div>`);
    document.getElementById("cb-send").addEventListener("click", () => {
      const note = document.getElementById("cb-note").value.trim();
      if (!note) { this.toast("请填写协同说明"); return; }
      startCollab(l, note); upsertLetter(l);
      this.toast(`已请 ${c.name}副书记 ${c.secretary} 协同`); this.hideModal(); this.render();
    });
    document.getElementById("cb-back").addEventListener("click", () => this.showHandle(id));
  },

  /* 副书记：查看协同信件并写处理意见 */
  showCollab(id) {
    const l = getLetterById(id);
    if (!l) return;
    const mine = (l.collabs || []).filter(c => c.college === this.college);
    const visible = l.status === STATUS.done && l.unit === this.college && (l.publicScope === "all" || l.publicScope === "college");
    if (!mine.length && !visible) { this.toast("该信件不在本学院协同或可见范围内"); return; }
    const open = mine.slice().reverse().find(c => !c.opinion);
    this.showModal(open ? "协同待办 · 写处理意见" : "信件详情（学院）", `
      ${this.letterDetailHtml(l, "view")}
      ${open ? `<div class="detail-section action-block"><div class="sec-title">处理意见</div>
        <div class="cb-note">协同说明（${escapeHtml(open.by || "")}）：${escapeHtml(open.note || "—")}</div>
        <div class="form-group" style="margin-top:10px"><label class="form-required">处理意见</label>
          <textarea id="col-opinion" rows="4" placeholder="请指定人员线下承办，承办完成后在此写明处理意见"></textarea></div>
        <p class="form-hint" style="color:var(--text-muted)">处理意见发回科室回复人，由其拟写正式答复并提交科室领导审批。副书记不直接对学生办结。</p>
      </div>
      <div class="modal-actions"><button class="btn btn-primary" id="col-send">${svgIcon("share")} 发回科室回复人</button></div>` : ""}`);
    const send = document.getElementById("col-send");
    if (send) send.addEventListener("click", () => {
      const op = document.getElementById("col-opinion").value.trim();
      if (op.length < 5) { this.toast("请填写处理意见（不少于5字）"); return; }
      collabOpinion(l, op); upsertLetter(l);
      this.toast(`处理意见已发回 ${l.assignee ? l.assignee.name : "回复人"}`); this.hideModal(); this.render();
    });
    this.bindAttachments(() => this.showCollab(id));
  },

  /* 办理端通用信件表格 */
  letterTable(rows, opts) {
    const o = opts || {};
    const btn = o.btn || (() => "查看");
    return `<table><thead><tr>
        <th style="width:140px">编号</th><th>标题</th><th style="width:80px">分类</th>
        <th style="width:66px">来信人</th><th style="width:${o.ownerWidth || 140}px">${o.ownerLabel || "科室 / 回复人"}</th><th style="width:95px">办结时限</th><th style="width:104px">当前环节</th><th style="width:76px">操作</th>
      </tr></thead><tbody>
      ${rows.length ? rows.map(l => {
        const b = btn(l);
        return `<tr class="clickable ${o.hl && o.hl(l) ? "row-hl" : ""}" data-handle="${l.id}">
          <td class="mono">${l.id}</td>
          <td>${escapeHtml(l.title)} ${isOverdue(l) ? '<span class="tag overdue">超期</span>' : ""} ${l.urged && l.status !== STATUS.done ? '<span class="tag warn">催办</span>' : ""} ${l.reopened ? '<span class="tag warn">二次办理</span>' : ""} ${l.supplements && l.supplements.length ? '<span class="tag info">已补充</span>' : ""}${this.cellExcerpt(l)}</td>
          <td>${this.catBadge(l.category)}</td>
          <td>${escapeHtml(l.name)}</td>
          <td>${o.owner ? o.owner(l) : this.ownerCell(l)}</td>
          <td>${effectiveDeadline(l)}</td>
          <td>${this.stageBadge(l)}</td>
          <td><button class="btn ${b === "查看" ? "btn-outline" : "btn-primary"} btn-sm" data-handle="${l.id}" onclick="event.stopPropagation()">${b}</button></td>
        </tr>`;
      }).join("") : `<tr><td colspan="8" class="table-empty">${o.empty || "暂无信件"}</td></tr>`}
      </tbody></table>`;
  },

  bindHandleRows() {
    document.querySelectorAll("[data-handle]").forEach(r =>
      r.addEventListener("click", () => this.showHandle(r.dataset.handle)));
  },

  /* ============================================================
   * 科室领导（科长）：指定回复人 + 审批全部答复
   * ============================================================ */
  renderLeaderHome() {
    const sec = this.section;
    const me = this.leader();
    const list = getSectionLetters(sec);
    const needRep = list.filter(l => stageOf(l) === STAGE.needReplier).sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    const approving = list.filter(l => stageOf(l) === STAGE.approving);
    const doing = list.filter(l => l.status === STATUS.doing);
    const overdue = list.filter(l => isOverdue(l));
    this.afterRender = () => this.bindHandleRows();
    return `
    <div class="hero hero-compact">
      <h2>${escapeHtml(sec)} · 科室工作台</h2>
      <p>${escapeHtml(me ? me.name + "（" + (me.title || "科长") + "）" : "未配置科室领导")} ｜ 综合办分到本科室的来信由您指定回复人；所有正式答复都须经您审批，通过后由回复人确认发送。</p>
    </div>
    <div class="stat-grid">
      ${this.statCard("待指定回复人", needRep.length, "需尽快指定", "#E07B00")}
      ${this.statCard("待审批", approving.length, "回复人已提交", "#006DAD")}
      ${this.statCard("科室在办", doing.length, "办理中信件", "#2A8DC7")}
      ${this.statCard("超期预警", overdue.length, "需尽快办结", "#DF2027")}
    </div>
    <div class="card"><div class="card-header"><h3>待审批</h3><span class="more" onclick="location.hash='#/leader-approve'">全部 ›</span></div>
      <div class="card-body" style="padding:0">${this.letterTable(approving.slice(0, 6), { btn: () => "审批", empty: "暂无待审批答复" })}</div></div>
    <div class="card"><div class="card-header"><h3>待指定回复人</h3><span class="more" onclick="location.hash='#/leader-assign'">全部 ›</span></div>
      <div class="card-body" style="padding:0">${this.letterTable(needRep.slice(0, 6), { btn: () => "指定", empty: "暂无待指定回复人的来信" })}</div></div>
    ${this.memberLoadCard(sec)}`;
  },

  /* 科室成员承办分布 */
  memberLoadCard(sec, me) {
    const leader = sectionLeader(sec);
    const members = sectionMembers(sec);
    return `<div class="card"><div class="card-header"><h3>${escapeHtml(sec)} · 回复人办理分布</h3><span class="hint">共 ${getSectionLetters(sec).length} 封分到本科室</span></div>
      <div class="card-body" style="padding:0">
        <table class="member-load-table"><thead><tr><th>成员</th><th>岗位</th><th>负责总量</th><th>待我办理</th><th>审批中</th><th>已办结</th><th>联系电话</th></tr></thead>
        <tbody>
          ${members.length ? members.map(m => {
            const items = getMemberLetters(m.id);
            const isLeader = leader && m.id === leader.id;
            return `<tr${me && m.id === me.id ? ' class="row-hl"' : ""}>
              <td><strong>${escapeHtml(m.name)}</strong>${isLeader ? ' <span class="tag info">科室领导</span>' : ""}${me && m.id === me.id ? ' <span class="tag info">本人</span>' : ""}</td>
              <td>${escapeHtml(m.title || "—")}</td>
              <td>${isLeader ? "—" : items.length}</td>
              <td>${isLeader ? "—" : items.filter(isReplierTurn).length}</td>
              <td>${isLeader ? "—" : items.filter(l => stageOf(l) === STAGE.approving).length}</td>
              <td>${isLeader ? "—" : items.filter(l => l.status === STATUS.done).length}</td>
              <td class="mono">${escapeHtml(m.phone || "-")}</td></tr>`;
          }).join("") : `<tr><td colspan="7" class="table-empty">本科室暂无成员</td></tr>`}
        </tbody></table>
      </div></div>`;
  },

  /* 科室领导：待指定回复人 / 待审批 列表 */
  renderLeaderList(kind) {
    const sec = this.section;
    const stage = kind === "assign" ? STAGE.needReplier : STAGE.approving;
    const list = getSectionLetters(sec).filter(l => stageOf(l) === stage)
      .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    this.afterRender = () => this.bindHandleRows();
    return `
    <p class="section-title">${kind === "assign"
      ? `${escapeHtml(sec)} · 综合办分到本科室、尚未指定回复人的来信。请指定本科室回复人。`
      : `${escapeHtml(sec)} · 回复人已提交的答复。所有信件都须审批；不通过请打回并写明修改意见，通过后由回复人确认发送。`}</p>
    <div class="card"><div class="card-body" style="padding:0">
      ${this.letterTable(list, { btn: () => kind === "assign" ? "指定" : "审批", empty: kind === "assign" ? "暂无待指定回复人的来信" : "暂无待审批答复" })}
    </div></div>`;
  },

  /* ============================================================
   * 科室回复人：拟稿、学院协同、提交审批、确认发送
   * ============================================================ */
  renderSectionHome() {
    const sec = this.section;
    const me = this.member;
    const mine = me ? getMemberLetters(me.id) : [];
    const todo = mine.filter(isReplierTurn).sort((a, b) => effectiveDeadline(a).localeCompare(effectiveDeadline(b)));
    const approving = mine.filter(l => stageOf(l) === STAGE.approving);
    const collab = mine.filter(l => stageOf(l) === STAGE.collab);
    const done = mine.filter(l => l.status === STATUS.done);

    this.afterRender = () => {
      this.bindHandleRows();
      this.drawDonut("sec-donut", [
        { label: "待我办理", value: todo.length, color: "#2A8DC7" },
        { label: "学院协同中", value: collab.length, color: "#7A5CC2" },
        { label: "待审批", value: approving.length, color: "#006DAD" },
        { label: "已办结", value: done.length, color: "#1BB975" }
      ].filter(x => x.value));
    };

    return `
    <div class="hero hero-compact">
      <h2>${escapeHtml(me ? me.name : sec)} · 我的工作台</h2>
      <p>${escapeHtml(sec)}${me && me.title ? " · " + escapeHtml(me.title) : ""} ｜ 科室领导指定给您的来信由您拟写答复；不能直接拟写的可请学生所在学院副书记协同。答复经科室领导审批通过后，由您确认发送并选择公开范围。</p>
    </div>
    <div class="stat-grid">
      ${this.statCard("待我办理", todo.length, "回复中 / 已打回 / 待确认发送", "#2A8DC7")}
      ${this.statCard("学院协同中", collab.length, "等待副书记意见", "#7A5CC2")}
      ${this.statCard("待审批", approving.length, "已提交科室领导", "#006DAD")}
      ${this.statCard("我已办结", done.length, "累计办结", "#1BB975")}
    </div>
    <div class="grid-3-2">
      <div class="card">
        <div class="card-header"><h3>待我办理</h3><span class="more" onclick="location.hash='#/rep-todo'">全部 ›</span></div>
        <div class="card-body" style="padding:0">
          ${this.letterTable(todo.slice(0, 8), { btn: () => "办理", owner: l => escapeHtml(l.unit || "-"), ownerLabel: "所在单位", ownerWidth: 110, empty: "暂无待我办理的来信" })}
        </div>
      </div>
      <div class="card"><div class="card-header"><h3>我的办理情况</h3></div>
        <div class="card-body"><div class="chart-wrap">
          <canvas id="sec-donut" width="150" height="150"></canvas>
          <div class="chart-legend">
            <div class="legend-item"><span class="lg-dot" style="background:#2A8DC7"></span>待我办理<span class="lg-val">${todo.length}</span></div>
            <div class="legend-item"><span class="lg-dot" style="background:#7A5CC2"></span>学院协同中<span class="lg-val">${collab.length}</span></div>
            <div class="legend-item"><span class="lg-dot" style="background:#006DAD"></span>待审批<span class="lg-val">${approving.length}</span></div>
            <div class="legend-item"><span class="lg-dot" style="background:#1BB975"></span>已办结<span class="lg-val">${done.length}</span></div>
          </div>
        </div></div>
      </div>
    </div>
    ${this.memberLoadCard(sec, me)}`;
  },

  /* 回复人：我的待办（按环节分页签） */
  renderReplierTodo() {
    const me = this.member;
    const mine = me ? getMemberLetters(me.id) : [];
    const tabs = [
      { k: "todo", t: "全部待办", f: isReplierTurn },
      { k: STAGE.replying, t: "回复中", f: l => stageOf(l) === STAGE.replying },
      { k: STAGE.rejected, t: "已打回", f: l => stageOf(l) === STAGE.rejected },
      { k: STAGE.confirm, t: "待确认发送", f: l => stageOf(l) === STAGE.confirm },
      { k: STAGE.collab, t: "学院协同中", f: l => stageOf(l) === STAGE.collab },
      { k: STAGE.approving, t: "待审批", f: l => stageOf(l) === STAGE.approving },
      { k: STAGE.done, t: "已办结", f: l => l.status === STATUS.done }
    ];
    const tab = this.state.repTab || "todo";
    const cur = tabs.find(t => t.k === tab) || tabs[0];
    const list = mine.filter(cur.f).sort((a, b) => effectiveDeadline(a).localeCompare(effectiveDeadline(b)));
    const pg = this.paginate(list, this.state.repPage, 8);
    this.afterRender = () => {
      document.querySelectorAll("[data-tab]").forEach(t => t.addEventListener("click", () => {
        this.state.repTab = t.dataset.tab; this.state.repPage = 1; this.render();
      }));
      this.bindHandleRows();
    };
    return `
    <p class="section-title">${escapeHtml(this.section)} · 科室领导指定由您回复的来信</p>
    <div class="tabs">
      ${tabs.map(t => `<button class="tab ${cur.k === t.k ? "active" : ""}" data-tab="${t.k}">${t.t} <span class="cnt">${mine.filter(t.f).length}</span></button>`).join("")}
    </div>
    <div class="card"><div class="card-body" style="padding:0">
      ${this.letterTable(pg.rows, { btn: l => isReplierTurn(l) ? "办理" : "查看", owner: l => escapeHtml(l.unit || "-"), ownerLabel: "所在单位", ownerWidth: 110, empty: "暂无信件" })}
    </div></div>
    ${this.pagerHtml(pg.page, pg.total, "repPage")}`;
  },

  /* 科室收件箱：科室领导、回复人共用 */
  renderSectionInbox() {
    const sec = this.section;
    const me = this.member;
    const isRep = this.role === "replier";
    const f = this.state.secFilter || {};
    const scope = isRep ? (this.state.secScope || "mine") : "all";
    const base = getSectionLetters(sec);
    let list = scope === "mine" ? base.filter(l => me && l.assignee && l.assignee.memberId === me.id) : base;
    const scopeCounts = {
      mine: me ? base.filter(l => l.assignee && l.assignee.memberId === me.id).length : 0,
      all: base.length
    };
    const tabs = [
      { k: "全部", f: () => true },
      { k: "待回复", f: l => [STAGE.needReplier, STAGE.replying, STAGE.collab, STAGE.rejected, STAGE.confirm].includes(stageOf(l)) },
      { k: "待审批", f: l => stageOf(l) === STAGE.approving },
      { k: "已办结", f: l => l.status === STATUS.done }
    ];
    const tab = this.state.secTab || "全部";
    const cur = tabs.find(t => t.k === tab) || tabs[0];
    const counts = {};
    tabs.forEach(t => { counts[t.k] = list.filter(t.f).length; });
    list = filterLetters(list.filter(cur.f), f).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const pg = this.paginate(list, this.state.secPage, 8);

    this.afterRender = () => {
      document.querySelectorAll("[data-scope]").forEach(s => s.addEventListener("click", () => {
        this.state.secScope = s.dataset.scope; this.state.secPage = 1; this.render();
      }));
      document.querySelectorAll("[data-tab]").forEach(t => t.addEventListener("click", () => {
        this.state.secTab = t.dataset.tab; this.state.secPage = 1; this.render();
      }));
      this.bindFilter("sec");
      this.bindHandleRows();
    };
    const btn = l => {
      if (this.role === "leader") {
        if (stageOf(l) === STAGE.needReplier) return "指定";
        if (stageOf(l) === STAGE.approving) return "审批";
        return "查看";
      }
      return me && l.assignee && l.assignee.memberId === me.id && isReplierTurn(l) ? "办理" : "查看";
    };
    return `
    <p class="section-title">${escapeHtml(sec)} · 综合办分到本科室的来信${isRep ? "；仅指定给本人的信件可拟写答复" : "；科室领导负责指定回复人和审批答复"}</p>
    ${isRep ? `<div class="scope-switch">
      <button class="scope-btn ${scope === "mine" ? "active" : ""}" data-scope="mine">${svgIcon("userCheck")} 我负责的 <span class="cnt">${scopeCounts.mine}</span></button>
      <button class="scope-btn ${scope === "all" ? "active" : ""}" data-scope="all">${svgIcon("inbox")} 本科室全部 <span class="cnt">${scopeCounts.all}</span></button>
    </div>` : ""}
    ${this.filterBar("sec", [
      { name: "title", label: "信件标题", type: "text" },
      { name: "category", label: "信件分类", type: "select", options: MOCK.letterCategories.map(c => c.label) },
      { name: "affair", label: "事务分类", type: "select", options: MOCK.affairCategories },
      { name: "assignee", label: "回复人", type: "text" }
    ])}
    <div class="tabs">
      ${tabs.map(t => `<button class="tab ${cur.k === t.k ? "active" : ""}" data-tab="${t.k}">${t.k} <span class="cnt">${counts[t.k]}</span></button>`).join("")}
    </div>
    <div class="card"><div class="card-body" style="padding:0">
      ${this.letterTable(pg.rows, {
        btn, ownerLabel: "回复人", ownerWidth: 120,
        owner: l => l.assignee ? escapeHtml(l.assignee.name) + (me && l.assignee.memberId === me.id && isRep ? ' <span class="tag info">本人</span>' : "") : '<span class="tag warn">未指定</span>',
        hl: l => isRep && me && l.assignee && l.assignee.memberId === me.id,
        empty: scope === "mine" ? "暂无指定给我的信件" : "本科室暂无信件"
      })}
    </div></div>
    ${this.pagerHtml(pg.page, pg.total, "secPage")}`;
  },

  /* ============================================================
   * 学院副书记：协同待办 + 学院可见信件
   * ============================================================ */
  renderCollegeTodo() {
    const col = this.college;
    const c = findCollege(col);
    const list = getCollabLetters(col);
    const openOf = l => (l.collabs || []).some(x => x.college === col && !x.opinion);
    const tab = this.state.colTab || "open";
    const rows = list.filter(l => tab === "open" ? openOf(l) : !openOf(l))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    this.afterRender = () => {
      document.querySelectorAll("[data-tab]").forEach(t => t.addEventListener("click", () => { this.state.colTab = t.dataset.tab; this.render(); }));
      document.querySelectorAll("[data-collab]").forEach(r => r.addEventListener("click", () => this.showCollab(r.dataset.collab)));
    };
    return `
    <div class="hero hero-compact">
      <h2>${escapeHtml(col)} · 协同待办</h2>
      <p>${escapeHtml(c ? c.secretary + "（" + (c.title || "副书记") + "）" : "学工系统未同步副书记")} ｜ 科室回复人不能直接拟写时，会把本学院学生的来信直接发给您。请指定人员线下承办，承办完成后写处理意见发回回复人；线下承办不作为系统审批环节。副书记由学工系统维护，信箱直接使用。</p>
    </div>
    <div class="tabs">
      <button class="tab ${tab === "open" ? "active" : ""}" data-tab="open">待写处理意见 <span class="cnt">${list.filter(openOf).length}</span></button>
      <button class="tab ${tab === "done" ? "active" : ""}" data-tab="done">已发回 <span class="cnt">${list.filter(l => !openOf(l)).length}</span></button>
    </div>
    <div class="card"><div class="card-body" style="padding:0">
      <table><thead><tr><th style="width:140px">编号</th><th>标题</th><th style="width:66px">来信人</th><th style="width:150px">发起科室 / 回复人</th><th style="width:130px">发起时间</th><th style="width:104px">当前环节</th><th style="width:76px">操作</th></tr></thead>
      <tbody>
        ${rows.length ? rows.map(l => {
          const cb = (l.collabs || []).filter(x => x.college === col).slice(-1)[0] || {};
          return `<tr class="clickable" data-collab="${l.id}">
            <td class="mono">${l.id}</td>
            <td>${escapeHtml(l.title)}<div class="cell-excerpt">协同说明：${escapeHtml(cb.note || "—")}</div></td>
            <td>${escapeHtml(l.name)}</td>
            <td>${escapeHtml(l.dept || "-")}<div class="cell-sub">${escapeHtml(l.assignee ? l.assignee.name : "-")}</div></td>
            <td>${escapeHtml(cb.at || "")}</td>
            <td>${this.stageBadge(l)}</td>
            <td><button class="btn ${openOf(l) ? "btn-primary" : "btn-outline"} btn-sm">${openOf(l) ? "写意见" : "查看"}</button></td></tr>`;
        }).join("") : `<tr><td colspan="7" class="table-empty">${tab === "open" ? "暂无待写处理意见的协同信件" : "暂无已发回的协同信件"}</td></tr>`}
      </tbody></table>
    </div></div>`;
  },

  renderCollegeVisible() {
    const col = this.college;
    const list = getCollegeVisibleLetters(col).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const pg = this.paginate(list, this.state.colPage, 8);
    this.afterRender = () => {
      document.querySelectorAll("[data-collab]").forEach(r => r.addEventListener("click", () => this.showCollab(r.dataset.collab)));
    };
    return `
    <p class="section-title">${escapeHtml(col)}学生来信中，承办科室设为「全部公开」或「仅该学院副书记可见」的已办结信件</p>
    <div class="card"><div class="card-body" style="padding:0">
      <table><thead><tr><th style="width:140px">编号</th><th>标题</th><th style="width:80px">分类</th><th style="width:66px">来信人</th><th style="width:130px">承办科室</th><th style="width:140px">公开范围</th><th style="width:100px">办结时间</th></tr></thead>
      <tbody>
        ${pg.rows.length ? pg.rows.map(l => `<tr class="clickable" data-collab="${l.id}">
          <td class="mono">${l.id}</td><td>${escapeHtml(l.title)}${this.cellExcerpt(l)}</td>
          <td>${this.catBadge(l.category)}</td><td>${escapeHtml(l.name)}</td><td>${escapeHtml(l.dept || "-")}</td>
          <td><span class="tag ${l.publicScope === "all" ? "ok" : "info"}">${PUBLIC_SCOPE[l.publicScope]}</span></td>
          <td>${escapeHtml(((l.reply && l.reply.time) || "").slice(0, 10))}</td></tr>`).join("")
          : `<tr><td colspan="7" class="table-empty">暂无本学院可见信件</td></tr>`}
      </tbody></table>
    </div></div>
    ${this.pagerHtml(pg.page, pg.total, "colPage")}`;
  },

  /* ---------- 督办催办 ---------- */
  renderSupervise() {
    const all = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const overdue = all.filter(l => isOverdue(l));
    const urged = all.filter(l => l.urged && l.status !== STATUS.done);
    const pendingOverdue = overdue.filter(l => l.status === STATUS.pending);
    const near = all.filter(l => !isOverdue(l) && l.status === STATUS.doing)
      .sort((a, b) => (a.deadline || "").localeCompare(b.deadline || "")).slice(0, 6);

    this.afterRender = () => {
      document.querySelectorAll("[data-handle]").forEach(r =>
        r.addEventListener("click", () => this.showHandle(r.dataset.handle)));
      this.bindBatchUrge();
    };

    const rowHtml = (l) => `<tr class="clickable" data-handle="${l.id}">
      <td class="sel-cell"><input type="checkbox" class="urge-sel" data-sel="${l.id}" onclick="event.stopPropagation()"></td>
      <td class="mono">${l.id}</td><td>${escapeHtml(l.title)} ${l.urged ? '<span class="tag warn">已催办</span>' : ""}${this.cellExcerpt(l)}</td>
      <td>${this.ownerCell(l)}</td>
      <td>${escapeHtml(handlerLabel(l))}</td>
      <td>${effectiveDeadline(l)}</td><td>${this.stageBadge(l)}</td></tr>`;

    return `
    <div class="stat-grid">
      ${this.statCard("超期未办结", overdue.length, "需重点督办", "#DF2027")}
      ${this.statCard("超期未分派", pendingOverdue.length, "综合办需尽快分派", "#F29100")}
      ${this.statCard("学生催办", urged.length, "已收到催办", "#F29100")}
      ${this.statCard("临期待办", near.length, "临近办结时限", "#2A8DC7")}
    </div>
    <div class="card"><div class="card-header"><h3>超期未办结清单</h3>
      <div class="batch-bar">
        <span class="batch-hint" id="batch-hint">已选 0 封</span>
        <button class="btn btn-primary btn-sm" id="btn-batch-urge" disabled>${svgIcon("megaphone")} 批量催办</button>
      </div>
    </div>
      <div class="card-body" style="padding:0"><table><thead><tr><th style="width:40px"><input type="checkbox" id="urge-sel-all" title="全选"></th><th style="width:140px">编号</th><th>标题</th><th style="width:150px">科室 / 回复人</th><th style="width:150px">当前办理人</th><th style="width:95px">办结时限</th><th style="width:104px">当前环节</th></tr></thead>
      <tbody>${overdue.length ? overdue.map(rowHtml).join("") : `<tr><td colspan="7" class="table-empty">暂无超期信件，办理情况良好</td></tr>`}</tbody></table></div>
    </div>
    <div class="card"><div class="card-header"><h3>学生催办件</h3><span class="hint">学生主动发起的催办</span></div>
      <div class="card-body" style="padding:0"><table><thead><tr><th style="width:140px">编号</th><th>标题</th><th style="width:150px">科室 / 回复人</th><th style="width:150px">催办送达</th><th style="width:95px">办结时限</th><th style="width:104px">当前环节</th><th style="width:90px">操作</th></tr></thead>
      <tbody>${urged.length ? urged.map(l => `<tr class="clickable" data-handle="${l.id}">
        <td class="mono">${l.id}</td><td>${escapeHtml(l.title)} <span class="tag warn">已催办</span>${this.cellExcerpt(l)}</td><td>${this.ownerCell(l)}</td>
        <td>${escapeHtml(((l.reminders || []).slice(-1)[0] || {}).to || handlerLabel(l))}</td>
        <td>${effectiveDeadline(l)}</td><td>${this.stageBadge(l)}</td>
        <td>${l.status === STATUS.pending
          ? `<button class="btn btn-primary btn-sm" data-dispatch-btn="${l.id}" onclick="event.stopPropagation()">去分派</button>`
          : `<button class="btn btn-outline btn-sm" data-handle-btn="${l.id}" onclick="event.stopPropagation()">去督办</button>`}</td></tr>`).join("") : `<tr><td colspan="7" class="table-empty">暂无催办件</td></tr>`}</tbody></table></div>
    </div>`;
  },

  /* 批量催办：多选超期信件，向各自当前办理人按模板发送并记录 */
  bindBatchUrge() {
    const selAll = document.getElementById("urge-sel-all");
    const hint = document.getElementById("batch-hint");
    const btn = document.getElementById("btn-batch-urge");
    const boxes = () => [...document.querySelectorAll(".urge-sel")];
    const selectedIds = () => boxes().filter(b => b.checked).map(b => b.dataset.sel);
    const refresh = () => {
      const n = selectedIds().length;
      if (hint) hint.textContent = `已选 ${n} 封`;
      if (btn) btn.disabled = n === 0;
      if (selAll) { const all = boxes(); selAll.checked = all.length > 0 && all.every(b => b.checked); }
    };
    boxes().forEach(b => b.addEventListener("change", refresh));
    if (selAll) selAll.addEventListener("change", () => { boxes().forEach(b => { b.checked = selAll.checked; }); refresh(); });
    document.querySelectorAll("[data-handle-btn]").forEach(b => b.addEventListener("click", () => this.showHandle(b.dataset.handleBtn)));
    document.querySelectorAll("[data-dispatch-btn]").forEach(b => b.addEventListener("click", () => this.showDispatch(b.dataset.dispatchBtn)));
    if (btn) btn.addEventListener("click", () => {
      const ids = selectedIds();
      const targets = ids.map(id => getLetterById(id)).filter(l => l && l.status !== STATUS.done);
      if (!targets.length) { this.toast("请先选择需催办的未办结信件"); return; }
      targets.forEach(l => { sendUrge(l, MOCK.urgeChannels, "admin"); upsertLetter(l); });
      this.toast(`已通过${channelLabel(MOCK.urgeChannels)}批量催办 ${targets.length} 封`);
      this.render();
    });
    refresh();
  },

  /* ---------- 公开情况（只读：公开范围由回复人确认发送时选择） ---------- */
  renderPublish() {
    const f = this.state.pubFilter || "";
    const done = filterLetters(getAllLetters(), { mailbox: this.mailbox }).filter(l => l.status === STATUS.done);
    const cnt = { "": done.length, all: done.filter(l => l.publicScope === "all").length, college: done.filter(l => l.publicScope === "college").length };
    const list = done.filter(l => !f || l.publicScope === f)
      .sort((a, b) => ((b.reply && b.reply.time) || b.date).localeCompare((a.reply && a.reply.time) || a.date));
    const pg = this.paginate(list, this.state.pubmgrPage, 8);
    this.afterRender = () => {
      document.querySelectorAll("[data-pubf]").forEach(t => t.addEventListener("click", () => {
        this.state.pubFilter = t.dataset.pubf; this.state.pubmgrPage = 1; this.render();
      }));
      document.querySelectorAll("[data-open-public]").forEach(r =>
        r.addEventListener("click", () => this.showPublishDetail(r.dataset.openPublic)));
    };
    return `
    <p class="section-title">公开范围由科室回复人在确认发送时选择：「全部公开」进入学生端公开信件；「仅该学院副书记可见」只对来信学生所在学院副书记可见。本页只读查看。</p>
    <div class="tabs">
      <button class="tab ${f === "" ? "active" : ""}" data-pubf="">全部已办结 <span class="cnt">${cnt[""]}</span></button>
      <button class="tab ${f === "all" ? "active" : ""}" data-pubf="all">全部公开 <span class="cnt">${cnt.all}</span></button>
      <button class="tab ${f === "college" ? "active" : ""}" data-pubf="college">仅该学院副书记可见 <span class="cnt">${cnt.college}</span></button>
    </div>
    <div class="card"><div class="card-body" style="padding:0">
      <table><thead><tr><th style="width:140px">编号</th><th>标题</th><th style="width:150px">科室 / 回复人</th><th style="width:110px">所在单位</th><th style="width:100px">办结时间</th><th style="width:140px">公开范围</th></tr></thead>
      <tbody>
        ${pg.rows.length ? pg.rows.map(l => `<tr class="clickable" data-open-public="${l.id}">
          <td class="mono">${l.id}</td><td>${escapeHtml(l.title)}${this.cellExcerpt(l)}</td><td>${this.ownerCell(l)}</td>
          <td>${escapeHtml(l.unit || "-")}</td><td>${escapeHtml(((l.reply && l.reply.time) || l.date || "").slice(0, 10))}</td>
          <td>${l.publicScope ? `<span class="tag ${l.publicScope === "all" ? "ok" : "info"}">${PUBLIC_SCOPE[l.publicScope]}</span>` : "—"}</td>
        </tr>`).join("") : `<tr><td colspan="6" class="table-empty">暂无信件</td></tr>`}
      </tbody></table>
    </div></div>
    ${this.pagerHtml(pg.page, pg.total, "pubmgrPage")}`;
  },

  showPublishDetail(id) {
    const l = getLetterById(id);
    if (!l) return;
    this.showModal("信件详情", this.letterDetailHtml(l, "view"));
    this.bindAttachments(() => this.showPublishDetail(id));
  },

  /* ---------- 统计分析 ---------- */
  renderAnalytics() {
    const f = this.state.anFilter || {};
    const gran = f.gran || "month";
    const granLabel = { year: "年度", quarter: "季度", month: "月度" };
    const base = filterLetters(getAllLetters(), { mailbox: this.mailbox });
    const years = [...new Set(base.map(letterDateStr).map(d => d.slice(0, 4)).filter(Boolean))].sort();

    let all = base.slice();
    if (f.year) all = all.filter(l => letterDateStr(l).slice(0, 4) === f.year);
    if (f.category) all = all.filter(l => l.category === f.category);
    if (f.dept) all = all.filter(l => l.dept === f.dept);

    const trend = bucketCounts(all, gran);
    const byCat = MOCK.letterCategories.map(c => ({
      label: c.label, color: c.color, value: all.filter(l => l.category === c.label).length
    })).filter(x => x.value > 0);
    const byDept = {};
    all.filter(l => l.dept).forEach(l => byDept[l.dept] = (byDept[l.dept] || 0) + 1);
    const deptRows = Object.entries(byDept).sort((a, b) => b[1] - a[1]);
    /* 回复人绩效：按成员统计负责量与办结率 */
    const byMember = {};
    all.filter(l => l.assignee && l.assignee.memberId).forEach(l => {
      const k = l.assignee.memberId;
      if (!byMember[k]) byMember[k] = { name: l.assignee.name, title: l.assignee.title || "", section: l.dept, items: [] };
      byMember[k].items.push(l);
    });
    const memberRows = Object.values(byMember).sort((a, b) => b.items.length - a.items.length);
    const rated = all.filter(l => l.rating);
    const done = all.filter(l => l.status === STATUS.done).length;
    const doing = all.filter(l => l.status === STATUS.doing).length;
    const pending = all.filter(l => l.status === STATUS.pending).length;
    const scopeSub = granLabel[gran] + "视角 · " + (f.year ? f.year + "年" : "全部年份");

    /* 维度派生数据 */
    const statusDist = [
      { name: "待分派", value: pending, color: "#F29100" },
      { name: "办理中", value: doing, color: "#2A8DC7" },
      { name: "已办结", value: done, color: "#1BB975" },
      { name: "已撤回", value: all.filter(l => l.status === STATUS.withdrawn).length, color: "#627079" }
    ].filter(x => x.value);
    const ratingDist = [5, 4, 3, 2, 1].map(s => ({ star: s, value: rated.filter(l => l.rating === s).length }));
    const overdueCnt = all.filter(l => isOverdue(l)).length;
    const overdueDist = [
      { name: "超期未办结", value: overdueCnt, color: "#DF2027" },
      { name: "在办(正常)", value: doing + pending - overdueCnt, color: "#F29100" },
      { name: "已办结", value: done, color: "#1BB975" }
    ].filter(x => x.value > 0);
    const urgeByDept = {};
    all.forEach(l => { const n = (l.reminders && l.reminders.length) || 0; if (n) urgeByDept[deptLabel(l)] = (urgeByDept[deptLabel(l)] || 0) + n; });
    const urgeRows = Object.entries(urgeByDept).sort((a, b) => b[1] - a[1]);

    this.afterRender = () => {
      this.echartsDispose();
      const PAL = ["#2A8DC7", "#9CBFDA", "#1BB975", "#F29100", "#DF2027", "#006DAD", "#D6EAF9", "#909399"];
      const axisBase = { axisLine: { lineStyle: { color: "#E2E8F0" } }, axisLabel: { color: "#696F7D" }, axisTick: { show: false } };
      // 趋势
      this.echartInit("an-trend", {
        color: ["#2A8DC7"], grid: { left: 42, right: 20, top: 24, bottom: 40 },
        tooltip: { trigger: "axis" },
        xAxis: Object.assign({ type: "category", data: trend.map(t => t.label), boundaryGap: trend.length <= 1 }, axisBase),
        yAxis: Object.assign({ type: "value", minInterval: 1, splitLine: { lineStyle: { color: "#F1F5F9" } } }, axisBase),
        series: [{
          type: "line", smooth: true, data: trend.map(t => t.value), symbolSize: 7,
          lineStyle: { width: 3 }, areaStyle: { color: "rgba(48,135,204,.14)" }, label: { show: true, color: "#3C444F" }
        }]
      });
      // 分类占比
      this.echartInit("an-cat", {
        tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
        legend: { bottom: 0, textStyle: { color: "#696F7D" } },
        series: [{
          type: "pie", radius: ["42%", "68%"], center: ["50%", "44%"], avoidLabelOverlap: true,
          itemStyle: { borderColor: "#fff", borderWidth: 2 }, label: { show: false },
          data: byCat.map(c => ({ name: c.label, value: c.value, itemStyle: { color: c.color } }))
        }]
      });
      // 科室来信量
      this.echartInit("an-dept", {
        color: ["#2A8DC7"], grid: { left: 46, right: 16, top: 20, bottom: 78 },
        tooltip: { trigger: "axis" },
        xAxis: Object.assign({ type: "category", data: deptRows.map(([k]) => k.replace(/（.*）/, "")), axisLabel: { color: "#696F7D", interval: 0, rotate: 32, fontSize: 10 } }, { axisLine: { lineStyle: { color: "#E2E8F0" } }, axisTick: { show: false } }),
        yAxis: Object.assign({ type: "value", minInterval: 1, splitLine: { lineStyle: { color: "#F1F5F9" } } }, axisBase),
        series: [{ type: "bar", data: deptRows.map(([, v]) => v), barMaxWidth: 30, itemStyle: { borderRadius: [4, 4, 0, 0] }, label: { show: true, position: "top", color: "#3C444F" } }]
      });
      // 办理状态分布
      this.echartInit("an-status", {
        tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
        legend: { bottom: 0, textStyle: { color: "#696F7D" } },
        series: [{ type: "pie", radius: "62%", center: ["50%", "44%"], data: statusDist.map(s => ({ name: s.name, value: s.value, itemStyle: { color: s.color } })), label: { color: "#3C444F", formatter: "{b}\n{c}" } }]
      });
      // 满意度评分分布
      this.echartInit("an-rating", {
        color: ["#F29100"], grid: { left: 42, right: 20, top: 20, bottom: 30 },
        tooltip: { trigger: "axis" },
        xAxis: Object.assign({ type: "category", data: ratingDist.map(r => r.star + "★") }, axisBase),
        yAxis: Object.assign({ type: "value", minInterval: 1, splitLine: { lineStyle: { color: "#F1F5F9" } } }, axisBase),
        series: [{ type: "bar", data: ratingDist.map(r => r.value), barMaxWidth: 34, itemStyle: { borderRadius: [4, 4, 0, 0] }, label: { show: true, position: "top", color: "#3C444F" } }]
      });
      // 超期情况
      this.echartInit("an-overdue", {
        tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
        legend: { bottom: 0, textStyle: { color: "#696F7D" } },
        series: [{ type: "pie", radius: ["42%", "68%"], center: ["50%", "44%"], itemStyle: { borderColor: "#fff", borderWidth: 2 }, label: { show: false }, data: overdueDist.map(s => ({ name: s.name, value: s.value, itemStyle: { color: s.color } })) }]
      });
      // 催办统计（各科室催办次数）
      this.echartInit("an-urge", {
        color: ["#DF2027"], grid: { left: 46, right: 16, top: 20, bottom: 78 },
        tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: urgeRows.map(([k]) => k.replace(/（.*）/, "")), axisLabel: { color: "#696F7D", interval: 0, rotate: 32, fontSize: 10 }, axisLine: { lineStyle: { color: "#E2E8F0" } }, axisTick: { show: false } },
        yAxis: Object.assign({ type: "value", minInterval: 1, splitLine: { lineStyle: { color: "#F1F5F9" } } }, axisBase),
        series: [{ type: "bar", data: urgeRows.map(([, v]) => v), barMaxWidth: 30, itemStyle: { color: "#F29100", borderRadius: [4, 4, 0, 0] }, label: { show: true, position: "top", color: "#3C444F" } }]
      });

      document.querySelectorAll("[data-gran]").forEach(b => b.addEventListener("click", () => {
        this.state.anFilter = Object.assign({}, this.state.anFilter, { gran: b.dataset.gran }); this.render();
      }));
      const bindSel = (id, key) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", () => { this.state.anFilter = Object.assign({}, this.state.anFilter, { [key]: el.value }); this.render(); });
      };
      bindSel("an-year", "year"); bindSel("an-cat-filter", "category"); bindSel("an-dept-filter", "dept");
      const reset = document.getElementById("an-reset");
      if (reset) reset.addEventListener("click", () => { this.state.anFilter = { gran }; this.render(); });
    };

    const emptyNote = '<div class="no-reply" style="margin:0">所选范围暂无数据</div>';
    return `
    <div class="card an-controls">
      <div class="an-ctrl-group">
        <span class="an-ctrl-label">${svgIcon("clock")} 统计粒度</span>
        <div class="seg-toggle">${["year", "quarter", "month"].map(g => `<button class="seg-btn ${gran === g ? "active" : ""}" data-gran="${g}">${granLabel[g]}</button>`).join("")}</div>
      </div>
      <div class="an-ctrl-group">
        <label class="an-ctrl-label" for="an-year">年份</label>
        <select id="an-year"><option value="">全部年份</option>${years.map(y => `<option ${f.year === y ? "selected" : ""}>${y}</option>`).join("")}</select>
      </div>
      <div class="an-ctrl-group">
        <label class="an-ctrl-label" for="an-cat-filter">信件分类</label>
        <select id="an-cat-filter"><option value="">全部分类</option>${MOCK.letterCategories.map(c => `<option ${f.category === c.label ? "selected" : ""}>${c.label}</option>`).join("")}</select>
      </div>
      <div class="an-ctrl-group">
        <label class="an-ctrl-label" for="an-dept-filter">承办科室</label>
        <select id="an-dept-filter"><option value="">全部科室</option>${MOCK.sections.map(s => `<option ${f.dept === s.name ? "selected" : ""}>${s.name}</option>`).join("")}</select>
      </div>
      <button class="btn btn-outline btn-sm" id="an-reset">重置</button>
    </div>

    <div class="stat-grid">
      ${this.statCard("来信总量", all.length, scopeSub, "#2A8DC7")}
      ${this.statCard("待分派", pending, "待综合办分派", "#F29100")}
      ${this.statCard("办结率", (all.length ? Math.round(done / all.length * 100) : 0) + "%", "已办结 / 总量", "#1BB975")}
      ${this.statCard("好评率", this.satisfactionRate(all) + "%", `${rated.length} 份评价 · 4星及以上`, "#F29100")}
    </div>

    <div class="card">
      <div class="card-header"><h3>${svgIcon("trend")} 来信量趋势（${granLabel[gran]}）</h3><span class="card-hint">共 ${trend.length} 个区间 · ${all.length} 封</span></div>
      <div class="card-body">${trend.length ? '<div class="echart" id="an-trend" style="height:280px"></div>' : emptyNote}</div>
    </div>

    <div class="two-col">
      <div class="card"><div class="card-header"><h3>${svgIcon("chart")} 信件分类占比</h3></div>
        <div class="card-body">${byCat.length ? '<div class="echart" id="an-cat" style="height:300px"></div>' : emptyNote}</div>
      </div>
      <div class="card"><div class="card-header"><h3>${svgIcon("building")} 各科室承办量</h3><span class="card-hint">仅统计已分派</span></div>
        <div class="card-body">${deptRows.length ? '<div class="echart" id="an-dept" style="height:300px"></div>' : emptyNote}</div>
      </div>
    </div>

    <div class="two-col">
      <div class="card"><div class="card-header"><h3>${svgIcon("chart")} 办理状态分布</h3></div>
        <div class="card-body">${statusDist.length ? '<div class="echart" id="an-status" style="height:300px"></div>' : emptyNote}</div>
      </div>
      <div class="card"><div class="card-header"><h3>${svgIcon("chart")} 满意度评分分布</h3><span class="card-hint">${rated.length} 份评价</span></div>
        <div class="card-body">${rated.length ? '<div class="echart" id="an-rating" style="height:300px"></div>' : emptyNote}</div>
      </div>
    </div>

    <div class="two-col">
      <div class="card"><div class="card-header"><h3>${svgIcon("clock")} 超期情况</h3></div>
        <div class="card-body">${overdueDist.length ? '<div class="echart" id="an-overdue" style="height:300px"></div>' : emptyNote}</div>
      </div>
      <div class="card"><div class="card-header"><h3>${svgIcon("megaphone")} 催办统计（各科室）</h3><span class="card-hint">按催办次数</span></div>
        <div class="card-body">${urgeRows.length ? '<div class="echart" id="an-urge" style="height:300px"></div>' : emptyNote}</div>
      </div>
    </div>

    <div class="two-col">
      <div class="card"><div class="card-header"><h3>${svgIcon("chart")} 科室办理绩效</h3></div>
        <div class="card-body" style="padding:0">
          <table><thead><tr><th style="width:50px">序号</th><th>承办科室</th><th style="width:70px">承办量</th><th style="width:70px">已办结</th><th style="width:70px">办结率</th><th style="width:88px">满意度</th></tr></thead>
          <tbody>
            ${deptRows.length ? deptRows.map(([d, v], i) => {
              const items = all.filter(l => l.dept === d);
              const dn = items.filter(l => l.status === STATUS.done).length;
              const rd = items.filter(l => l.rating);
              const avg = rd.length ? (rd.reduce((s, x) => s + x.rating, 0) / rd.length).toFixed(1) : "-";
              return `<tr><td>${i + 1}</td><td>${d}</td><td>${v}</td><td>${dn}</td><td>${Math.round(dn / v * 100)}%</td><td>${avg === "-" ? "-" : "★ " + avg}</td></tr>`;
            }).join("") : `<tr><td colspan="6" class="table-empty">暂无数据</td></tr>`}
          </tbody></table>
        </div>
      </div>
      <div class="card"><div class="card-header"><h3>${svgIcon("userCheck")} 回复人办理绩效</h3><span class="card-hint">Top 10</span></div>
        <div class="card-body" style="padding:0">
          <table><thead><tr><th style="width:50px">序号</th><th>回复人</th><th>所属科室</th><th style="width:70px">负责量</th><th style="width:70px">已办结</th><th style="width:88px">满意度</th></tr></thead>
          <tbody>
            ${memberRows.length ? memberRows.slice(0, 10).map((m, i) => {
              const dn = m.items.filter(l => l.status === STATUS.done).length;
              const rd = m.items.filter(l => l.rating);
              const avg = rd.length ? (rd.reduce((s, x) => s + x.rating, 0) / rd.length).toFixed(1) : "-";
              return `<tr><td>${i + 1}</td>
                <td><strong>${escapeHtml(m.name)}</strong>${m.title ? `<span class="cell-sub">${escapeHtml(m.title)}</span>` : ""}</td>
                <td>${escapeHtml(m.section || "-")}</td><td>${m.items.length}</td><td>${dn}</td>
                <td>${avg === "-" ? "-" : "★ " + avg}</td></tr>`;
            }).join("") : `<tr><td colspan="6" class="table-empty">暂无分派记录</td></tr>`}
          </tbody></table>
        </div>
      </div>
    </div>`;
  },

  /* ---------- 分类管理（信件分类 / 事务分类；不再绑定归口科室，由综合办人工分派） ---------- */
  renderCategoryMgr() {
    const cats = MOCK.letterCategories;
    const affairs = currentAffairs();
    const usage = (name, key) => getAllLetters().filter(l => l[key] === name).length;

    this.afterRender = () => {
      const addCat = document.getElementById("btn-add-cat");
      if (addCat) addCat.addEventListener("click", () => this.showCatForm(-1));
      const addAff = document.getElementById("btn-add-affair");
      if (addAff) addAff.addEventListener("click", () => this.showAffairForm(-1));
      document.querySelectorAll("[data-edit-cat]").forEach(b => b.addEventListener("click", () => this.showCatForm(+b.dataset.editCat)));
      document.querySelectorAll("[data-del-cat]").forEach(b => b.addEventListener("click", () => this.delCat(+b.dataset.delCat)));
      document.querySelectorAll("[data-edit-affair]").forEach(b => b.addEventListener("click", () => this.showAffairForm(+b.dataset.editAffair)));
      document.querySelectorAll("[data-del-affair]").forEach(b => b.addEventListener("click", () => this.delAffair(+b.dataset.delAffair)));
    };

    return `
    <p class="section-title">维护信件分类与事务分类。事务分类用于学生写信和统计，不再预设归口科室，由${MOCK.intakeSection}人工分派。</p>
    <div class="two-col">
      <div class="card">
        <div class="card-header"><h3>信件分类（一级）</h3><button class="btn btn-primary btn-sm" id="btn-add-cat">＋ 新增分类</button></div>
        <div class="card-body" style="padding:0">
          <table><thead><tr><th>分类名称</th><th style="width:90px">标识色</th><th style="width:80px">使用量</th><th style="width:120px">操作</th></tr></thead>
          <tbody>
            ${cats.map((c, i) => `<tr>
              <td>${this.catBadge(c.label)}</td>
              <td><span class="color-swatch" style="background:${c.color}"></span><span class="mono">${c.color}</span></td>
              <td>${usage(c.label, "category")}</td>
              <td class="table-actions">
                <button class="btn btn-outline btn-sm" data-edit-cat="${i}">编辑</button>
                <button class="btn btn-danger btn-sm" data-del-cat="${i}">删除</button>
              </td></tr>`).join("")}
          </tbody></table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>事务分类（二级）</h3><button class="btn btn-primary btn-sm" id="btn-add-affair">＋ 新增事务</button></div>
        <div class="card-body" style="padding:0">
          <table><thead><tr><th>事务名称</th><th style="width:70px">来信</th><th style="width:120px">操作</th></tr></thead>
          <tbody>
            ${affairs.map((a, i) => `<tr>
              <td>${escapeHtml(a)}</td>
              <td>${usage(a, "affair")}</td>
              <td class="table-actions">
                <button class="btn btn-outline btn-sm" data-edit-affair="${i}">编辑</button>
                <button class="btn btn-danger btn-sm" data-del-affair="${i}">删除</button>
              </td></tr>`).join("")}
          </tbody></table>
        </div>
      </div>
    </div>`;
  },

  showCatForm(idx) {
    const editing = idx >= 0;
    const c = editing ? MOCK.letterCategories[idx] : { label: "", color: "#2A8DC7" };
    const palette = ["#2A8DC7", "#006DAD", "#9CBFDA", "#1BB975", "#F29100", "#DF2027", "#627079", "#B0CEE4"];
    this.showModal(editing ? "编辑信件分类" : "新增信件分类", `
      <div class="form-group"><label class="form-required">分类名称</label>
        <input id="cat-label" value="${escapeHtml(c.label)}" placeholder="如：建议类" maxlength="10"></div>
      <div class="form-group"><label class="form-required">标识色</label>
        <div class="palette" id="cat-palette">
          ${palette.map(p => `<span class="palette-dot ${p === c.color ? "on" : ""}" data-color="${p}" style="background:${p}"></span>`).join("")}
        </div>
        <input id="cat-color" value="${escapeHtml(c.color)}" class="mono" style="margin-top:8px;max-width:120px">
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" id="cat-save">保存</button>
        <button class="btn btn-ghost" id="cat-cancel">取消</button>
      </div>`);
    const colorInput = document.getElementById("cat-color");
    document.querySelectorAll("#cat-palette .palette-dot").forEach(d => d.addEventListener("click", () => {
      colorInput.value = d.dataset.color;
      document.querySelectorAll("#cat-palette .palette-dot").forEach(x => x.classList.remove("on"));
      d.classList.add("on");
    }));
    const save = document.getElementById("cat-save");
    if (save) save.addEventListener("click", () => {
      const label = document.getElementById("cat-label").value.trim();
      const color = colorInput.value.trim() || "#2A8DC7";
      if (!label) { this.toast("请填写分类名称"); return; }
      const list = MOCK.letterCategories.slice();
      if (MOCK.letterCategories.some((x, i) => x.label === label && i !== idx)) { this.toast("该分类已存在"); return; }
      if (editing) list[idx] = { label, color }; else list.push({ label, color });
      saveCategories(list);
      this.hideModal(); this.toast("已保存"); this.render();
    });
    const cancel = document.getElementById("cat-cancel");
    if (cancel) cancel.addEventListener("click", () => this.hideModal());
  },

  delCat(idx) {
    const c = MOCK.letterCategories[idx];
    if (!c) return;
    const used = getAllLetters().filter(l => l.category === c.label).length;
    if (used > 0) { this.toast(`已有 ${used} 封信件使用「${c.label}」，不能删除`); return; }
    const list = MOCK.letterCategories.slice(); list.splice(idx, 1);
    saveCategories(list); this.toast("已删除"); this.render();
  },

  showAffairForm(idx) {
    const affairs = currentAffairs();
    const editing = idx >= 0;
    const old = editing ? affairs[idx] : "";
    this.showModal(editing ? "编辑事务分类" : "新增事务分类", `
      <div class="form-group"><label class="form-required">事务名称</label>
        <input id="aff-name" value="${escapeHtml(old)}" placeholder="如：宿舍管理" maxlength="12"></div>
      <div class="modal-actions">
        <button class="btn btn-primary" id="aff-save">保存</button>
        <button class="btn btn-ghost" id="aff-cancel">取消</button>
      </div>`);
    const save = document.getElementById("aff-save");
    if (save) save.addEventListener("click", () => {
      const name = document.getElementById("aff-name").value.trim();
      if (!name) { this.toast("请填写事务名称"); return; }
      const list = currentAffairs();
      if (list.some((x, i) => x === name && i !== idx)) { this.toast("该事务已存在"); return; }
      if (editing) list[idx] = name; else list.push(name);
      saveAffairs(list);
      this.hideModal(); this.toast("已保存"); this.render();
    });
    const cancel = document.getElementById("aff-cancel");
    if (cancel) cancel.addEventListener("click", () => this.hideModal());
  },

  delAffair(idx) {
    const affairs = currentAffairs();
    const a = affairs[idx];
    if (!a) return;
    const used = getAllLetters().filter(l => l.affair === a).length;
    if (used > 0) { this.toast(`已有 ${used} 封信件使用「${a}」，不能删除`); return; }
    affairs.splice(idx, 1);
    saveAffairs(affairs); this.toast("已删除"); this.render();
  },

  /* ---------- 科室与人员（科室 + 成员；每个科室标记一位科室领导，其余为回复人） ---------- */
  renderSectionMgr() {
    const secs = MOCK.sections;
    const active = this.state.mgrSec && secs.some(s => s.name === this.state.mgrSec)
      ? this.state.mgrSec : (secs[0] || {}).name;
    const usage = (name) => getAllLetters().filter(l => l.dept === name).length;
    const cur = secs.find(s => s.name === active) || {};
    const members = cur.members || [];

    this.afterRender = () => {
      const add = document.getElementById("btn-add-sec");
      if (add) add.addEventListener("click", () => this.showSectionForm(-1));
      document.querySelectorAll("[data-edit-sec]").forEach(b => b.addEventListener("click", (e) => { e.stopPropagation(); this.showSectionForm(+b.dataset.editSec); }));
      document.querySelectorAll("[data-del-sec]").forEach(b => b.addEventListener("click", (e) => { e.stopPropagation(); this.delSection(+b.dataset.delSec); }));
      document.querySelectorAll("[data-pick-sec]").forEach(r => r.addEventListener("click", () => {
        this.state.mgrSec = r.dataset.pickSec; this.render();
      }));
      const addM = document.getElementById("btn-add-member");
      if (addM) addM.addEventListener("click", () => this.showMemberForm(active, -1));
      document.querySelectorAll("[data-edit-member]").forEach(b => b.addEventListener("click", () => this.showMemberForm(active, +b.dataset.editMember)));
      document.querySelectorAll("[data-del-member]").forEach(b => b.addEventListener("click", () => this.delMember(active, +b.dataset.delMember)));
      document.querySelectorAll("[data-toggle-member]").forEach(b => b.addEventListener("click", () => this.toggleMember(active, +b.dataset.toggleMember)));
    };

    return `
    <p class="section-title">维护学工部各科室及其成员。每个科室标记一位科室领导（科长），负责指定回复人和审批答复；其余在用成员为可被指定的回复人。</p>
    <div class="card">
      <div class="card-header"><h3>科室通讯录</h3><button class="btn btn-primary btn-sm" id="btn-add-sec">＋ 新增科室</button></div>
      <div class="card-body" style="padding:0">
        <table><thead><tr>
          <th style="width:170px">科室名称</th><th style="width:90px">科室领导</th><th style="width:130px">联系电话</th>
          <th style="width:160px">邮箱</th><th style="width:70px">回复人</th><th style="width:60px">承办</th><th style="width:120px">操作</th>
        </tr></thead><tbody>
          ${secs.map((d, i) => {
            const ld = sectionLeader(d.name);
            return `<tr class="clickable ${d.name === active ? "row-hl" : ""}" data-pick-sec="${escapeHtml(d.name)}">
            <td><strong>${escapeHtml(d.name)}</strong>${d.name === MOCK.intakeSection ? ' <span class="tag info">统一受理</span>' : ""}</td>
            <td>${ld ? escapeHtml(ld.name) : '<span class="tag warn">未设置</span>'}</td>
            <td class="mono">${escapeHtml(d.phone || "-")}</td>
            <td>${escapeHtml(d.email || "-")}</td>
            <td>${replierCandidates(d.name).length ? `${replierCandidates(d.name).length} 人` : '<span class="tag warn">未配置</span>'}</td>
            <td>${usage(d.name)}</td>
            <td class="table-actions">
              <button class="btn btn-outline btn-sm" data-edit-sec="${i}">编辑</button>
              <button class="btn btn-danger btn-sm" data-del-sec="${i}">删除</button>
            </td></tr>`;
          }).join("")}
        </tbody></table>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <h3>${escapeHtml(active || "—")} · 科室成员</h3>
        <button class="btn btn-primary btn-sm" id="btn-add-member" ${active ? "" : "disabled"}>＋ 新增成员</button>
      </div>
      <div class="card-body" style="padding:0">
        <table><thead><tr>
          <th style="width:120px">姓名</th><th style="width:90px">身份</th><th style="width:130px">岗位 / 职务</th><th style="width:130px">联系电话</th>
          <th style="width:170px">邮箱</th><th style="width:70px">经办量</th><th style="width:80px">状态</th><th style="width:180px">操作</th>
        </tr></thead><tbody>
          ${members.length ? members.map((m, i) => {
            const items = m.leader ? getSectionLetters(active).filter(l => l.leader && l.leader.memberId === m.id) : getMemberLetters(m.id);
            const doing = items.filter(l => l.status === STATUS.doing).length;
            const off = m.enabled === false;
            return `<tr class="${off ? "row-off" : ""}">
              <td><strong>${escapeHtml(m.name)}</strong></td>
              <td>${m.leader ? '<span class="tag info">科室领导</span>' : '<span class="tag">回复人</span>'}</td>
              <td>${escapeHtml(m.title || "-")}</td>
              <td class="mono">${escapeHtml(m.phone || "-")}</td>
              <td>${escapeHtml(m.email || "-")}</td>
              <td>${items.length}${doing ? `<span class="cell-sub">在办 ${doing}</span>` : ""}</td>
              <td>${off
                ? '<span class="badge" style="background:#6270791a;color:#627079">已停用</span>'
                : '<span class="badge" style="background:#1BB9751a;color:#1BB975">在用</span>'}</td>
              <td class="table-actions">
                <button class="btn btn-outline btn-sm" data-edit-member="${i}">编辑</button>
                <button class="btn btn-outline btn-sm" data-toggle-member="${i}">${off ? "启用" : "停用"}</button>
                <button class="btn btn-danger btn-sm" data-del-member="${i}">删除</button>
              </td></tr>`;
          }).join("") : `<tr><td colspan="8" class="table-empty">该科室暂无成员，请点击「新增成员」添加</td></tr>`}
        </tbody></table>
      </div>
    </div>
    <p class="form-hint" style="color:var(--text-muted)">提示：点击上方科室行可切换下方成员列表。分派时系统自动带出该科室的科室领导；停用的回复人不再出现在科室领导的指定列表中，历史记录保留。</p>`;
  },

  /* 科室领导变更后，同步本科室在办信件上的科室领导快照 */
  syncLeaderSnapshot(section) {
    const ld = sectionLeader(section);
    const letters = getLetters().map(l => {
      if (l.dept === section && l.status === STATUS.doing && ld) {
        l.leader = { section, memberId: ld.id, name: ld.name, title: ld.title || "" };
      }
      return l;
    });
    saveLetters(letters);
    const s = MOCK.sections.find(x => x.name === section);
    if (s && ld) { s.head = ld.name; saveConfig(); }
  },

  /* 科室成员表单：姓名 / 身份 / 岗位 / 联系方式 */
  showMemberForm(section, idx) {
    const list = sectionMembers(section).map(m => Object.assign({}, m));
    const editing = idx >= 0;
    const m = editing ? list[idx] : { id: "", name: "", title: "", phone: "", email: "", enabled: true, leader: false };
    const curLeader = list.find(x => x.leader);
    this.showModal(editing ? `编辑成员 · ${section}` : `新增成员 · ${section}`, `
      <div class="form-row">
        <div class="form-group"><label class="form-required">姓名</label>
          <input id="mb-name" value="${escapeHtml(m.name)}" placeholder="成员姓名" maxlength="10"></div>
        <div class="form-group"><label class="form-required">岗位 / 职务</label>
          <input id="mb-title" value="${escapeHtml(m.title || "")}" placeholder="如：科长 / 资助干事" maxlength="16"></div>
      </div>
      <div class="form-group"><label class="form-required">身份</label>
        <div class="radio-group">
          <label><input type="radio" name="mb-role" value="replier" ${!m.leader ? "checked" : ""}> 回复人（由科室领导指定回复来信）</label>
          <label><input type="radio" name="mb-role" value="leader" ${m.leader ? "checked" : ""}> 科室领导（科长：指定回复人、审批答复）</label>
        </div>
        <p class="form-hint" style="color:var(--text-muted)">每个科室只有一位科室领导${curLeader && curLeader.id !== m.id ? `，当前为 ${escapeHtml(curLeader.name)}；改为本成员后，本科室在办信件的科室领导同步更换` : ""}</p>
      </div>
      <div class="form-row">
        <div class="form-group"><label>联系电话</label>
          <input id="mb-phone" value="${escapeHtml(m.phone || "")}" placeholder="如：0731-88830041"></div>
        <div class="form-group"><label>邮箱</label>
          <input id="mb-email" value="${escapeHtml(m.email || "")}" placeholder="如：qiumin@xg.edu.cn"></div>
      </div>
      <div class="form-group"><label>状态</label>
        <div class="radio-group">
          <label><input type="radio" name="mb-enabled" value="1" ${m.enabled !== false ? "checked" : ""}> 在用</label>
          <label><input type="radio" name="mb-enabled" value="0" ${m.enabled === false ? "checked" : ""}> 停用</label>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" id="mb-save">保存</button>
        <button class="btn btn-ghost" id="mb-cancel">取消</button>
      </div>`);
    const save = document.getElementById("mb-save");
    if (save) save.addEventListener("click", () => {
      const name = document.getElementById("mb-name").value.trim();
      const title = document.getElementById("mb-title").value.trim();
      if (!name) { this.toast("请填写成员姓名"); return; }
      if (!title) { this.toast("请填写岗位 / 职务"); return; }
      if (list.some((x, i) => x.name === name && i !== idx)) { this.toast("该科室已存在同名成员"); return; }
      const asLeader = (document.querySelector('input[name="mb-role"]:checked') || {}).value === "leader";
      const enabled = (document.querySelector('input[name="mb-enabled"]:checked') || {}).value !== "0";
      if (m.leader && !asLeader) { this.toast("请先将其他成员设为科室领导，再调整本成员身份"); return; }
      if (asLeader && !enabled) { this.toast("科室领导须为在用状态"); return; }
      if (!asLeader && editing) {
        const doing = getMemberLetters(m.id).filter(l => l.status === STATUS.doing).length;
        if (!enabled && doing) { this.toast(`${m.name} 仍有 ${doing} 封在办信件，请科室领导改派后再停用`); return; }
      }
      if (asLeader && !m.leader) {
        const doing = editing ? getMemberLetters(m.id).filter(l => l.status === STATUS.doing).length : 0;
        if (doing) { this.toast(`${m.name} 仍负责回复 ${doing} 封在办信件，改派后才能设为科室领导`); return; }
        list.forEach(x => { x.leader = false; });
      }
      const data = {
        id: m.id || genMemberId(), name, title, leader: asLeader,
        phone: document.getElementById("mb-phone").value.trim(),
        email: document.getElementById("mb-email").value.trim(),
        enabled
      };
      if (editing) list[idx] = data; else list.push(data);
      saveSectionMembers(section, list);
      if (editing && m.id) {
        const letters = getLetters().map(l => {
          if (l.assignee && l.assignee.memberId === m.id) l.assignee = Object.assign({}, l.assignee, { name: data.name, title: data.title });
          if (l.leader && l.leader.memberId === m.id) l.leader = Object.assign({}, l.leader, { name: data.name, title: data.title });
          return l;
        });
        saveLetters(letters);
      }
      if (asLeader) this.syncLeaderSnapshot(section);
      this.state.mgrSec = section;
      this.hideModal(); this.toast("已保存"); this.render();
    });
    const cancel = document.getElementById("mb-cancel");
    if (cancel) cancel.addEventListener("click", () => this.hideModal());
  },

  /* 停用 / 启用成员：停用后不再出现在科室领导的指定列表 */
  toggleMember(section, idx) {
    const list = sectionMembers(section).map(m => Object.assign({}, m));
    const m = list[idx];
    if (!m) return;
    const off = m.enabled === false;
    if (!off) {
      if (m.leader) { this.toast("科室领导不能停用，请先将其他成员设为科室领导"); return; }
      const doing = getMemberLetters(m.id).filter(l => l.status === STATUS.doing).length;
      if (doing > 0) { this.toast(`${m.name} 仍有 ${doing} 封在办信件，请科室领导改派后再停用`); return; }
    }
    m.enabled = off;
    saveSectionMembers(section, list);
    this.state.mgrSec = section;
    this.toast(off ? `已启用 ${m.name}` : `已停用 ${m.name}`); this.render();
  },

  delMember(section, idx) {
    const list = sectionMembers(section).map(m => Object.assign({}, m));
    const m = list[idx];
    if (!m) return;
    if (m.leader) { this.toast("科室领导不能删除，请先将其他成员设为科室领导"); return; }
    const used = getMemberLetters(m.id).length;
    if (used > 0) { this.toast(`${m.name} 已负责 ${used} 封信件，不能删除，可改为「停用」`); return; }
    list.splice(idx, 1);
    saveSectionMembers(section, list);
    this.state.mgrSec = section;
    this.toast("已删除"); this.render();
  },

  showSectionForm(idx) {
    const editing = idx >= 0;
    const s = editing ? MOCK.sections[idx] : { name: "", head: "", phone: "", email: "", duty: "" };
    const ld = editing ? sectionLeader(s.name) : null;
    this.showModal(editing ? "编辑科室" : "新增科室", `
      <div class="form-row">
        <div class="form-group"><label class="form-required">科室名称</label>
          <input id="sec-name" value="${escapeHtml(s.name)}" placeholder="如：学生资助管理科" maxlength="20"></div>
        <div class="form-group"><label class="form-required">科室领导（科长）</label>
          ${editing
            ? `<input value="${escapeHtml(ld ? ld.name : "未设置")}" disabled><p class="form-hint" style="color:var(--text-muted)">在下方成员列表中编辑成员身份可更换科室领导</p>`
            : `<input id="sec-head" placeholder="科长姓名，将自动建为科室领导" maxlength="10">`}</div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>联系电话</label>
          <input id="sec-phone" value="${escapeHtml(s.phone)}" placeholder="如：0731-88830000"></div>
        <div class="form-group"><label>邮箱</label>
          <input id="sec-email" value="${escapeHtml(s.email)}" placeholder="如：zz@xg.edu.cn"></div>
      </div>
      <div class="form-group"><label>职责说明</label>
        <textarea id="sec-duty" rows="3" placeholder="简要描述该科室的职责范围">${escapeHtml(s.duty || "")}</textarea></div>
      <div class="modal-actions">
        <button class="btn btn-primary" id="sec-save">保存</button>
        <button class="btn btn-ghost" id="sec-cancel">取消</button>
      </div>`);
    const save = document.getElementById("sec-save");
    if (save) save.addEventListener("click", () => {
      const name = document.getElementById("sec-name").value.trim();
      const headEl = document.getElementById("sec-head");
      const head = headEl ? headEl.value.trim() : (ld ? ld.name : s.head);
      const phone = document.getElementById("sec-phone").value.trim();
      const email = document.getElementById("sec-email").value.trim();
      const duty = document.getElementById("sec-duty").value.trim();
      if (!name) { this.toast("请填写科室名称"); return; }
      if (!head) { this.toast("请填写科室领导"); return; }
      if (MOCK.sections.some((x, i) => x.name === name && i !== idx)) { this.toast("该科室已存在"); return; }
      const list = MOCK.sections.map(x => Object.assign({}, x));
      if (editing) {
        const old = list[idx].name;
        list[idx] = Object.assign(list[idx], { name, head, phone, email, duty });
        delete list[idx].affairs;
        if (old !== name) {
          const letters = getLetters().map(l => {
            if (l.dept === old) l.dept = name;
            if (l.leader && l.leader.section === old) l.leader.section = name;
            if (l.assignee && l.assignee.section === old) l.assignee.section = name;
            if (l.reply && l.reply.dept === old) l.reply.dept = name;
            (l.dispatches || []).forEach(d => {
              if (d.section === old) d.section = name;
              if (d.fromSection === old) d.fromSection = name;
            });
            return l;
          });
          saveLetters(letters);
          if (this.state.mgrSec === old) this.state.mgrSec = name;
          if (localStorage.getItem(STORE_KEYS.section) === old) saveSection(name);
        }
      } else {
        list.push({
          name, head, phone, email, duty,
          members: [{ id: genMemberId(), leader: true, name: head, title: "科长", phone, email, enabled: true }]
        });
      }
      saveSections(list);
      if (!editing) this.state.mgrSec = name;
      if (editing && name !== s.name && this.section === s.name) this.section = name;
      this.hideModal(); this.toast(editing ? "已保存" : "已新增科室，请继续添加回复人"); this.render();
    });
    const cancel = document.getElementById("sec-cancel");
    if (cancel) cancel.addEventListener("click", () => this.hideModal());
  },

  delSection(idx) {
    const s = MOCK.sections[idx];
    if (!s) return;
    if (s.name === MOCK.intakeSection) { this.toast(`「${s.name}」为统一受理科室，不能删除`); return; }
    const used = getAllLetters().filter(l => l.dept === s.name).length;
    if (used > 0) { this.toast(`「${s.name}」已承办 ${used} 封信件，不能删除`); return; }
    const list = MOCK.sections.slice(); list.splice(idx, 1);
    if (this.state.mgrSec === s.name) this.state.mgrSec = null;
    saveSections(list); this.toast("已删除"); this.render();
  },

  /* ---------- 制度文件管理 ---------- */
  renderPolicyMgr() {
    const list = MOCK.policies;
    this.afterRender = () => {
      const add = document.getElementById("btn-add-policy");
      if (add) add.addEventListener("click", () => this.showPolicyForm(-1));
      document.querySelectorAll("[data-edit-policy]").forEach(b => b.addEventListener("click", () => this.showPolicyForm(+b.dataset.editPolicy)));
      document.querySelectorAll("[data-del-policy]").forEach(b => b.addEventListener("click", () => this.delPolicy(+b.dataset.delPolicy)));
      document.querySelectorAll("[data-toggle-policy]").forEach(b => b.addEventListener("click", () => this.togglePolicy(+b.dataset.togglePolicy)));
    };
    return `
    <p class="section-title">维护学工部制度/规范性文件，学生端「制度文件」将同步展示现行有效文件</p>
    <div class="card">
      <div class="card-header"><h3>制度文件清单</h3><button class="btn btn-primary btn-sm" id="btn-add-policy">＋ 新增文件</button></div>
      <div class="card-body" style="padding:0">
        <table><thead><tr>
          <th style="width:150px">文号</th><th>文件标题</th><th style="width:100px">类别</th>
          <th style="width:100px">效力状态</th><th style="width:100px">日期</th><th style="width:170px">操作</th>
        </tr></thead><tbody>
          ${list.length ? list.map((p, i) => `<tr>
            <td class="mono">${escapeHtml(p.code)}</td>
            <td>${escapeHtml(p.title)}</td>
            <td><span class="tag">${escapeHtml(p.cat)}</span></td>
            <td>${p.status === "现行有效" ? '<span class="tag" style="background:#1BB9751a;color:#1BB975">现行有效</span>' : '<span class="tag" style="background:#6270791a;color:#627079">已废止</span>'}</td>
            <td>${escapeHtml(p.date)}</td>
            <td class="table-actions">
              <button class="btn btn-outline btn-sm" data-toggle-policy="${i}">${p.status === "现行有效" ? "置为废止" : "恢复有效"}</button>
              <button class="btn btn-outline btn-sm" data-edit-policy="${i}">编辑</button>
              <button class="btn btn-danger btn-sm" data-del-policy="${i}">删除</button>
            </td></tr>`).join("")
            : `<tr><td colspan="6" class="table-empty">暂无制度文件</td></tr>`}
        </tbody></table>
      </div>
    </div>`;
  },

  /* 制度文件编辑表单 HTML（供弹窗与页面生成器复用） */
  policyFormHtml(p) {
    const initAtt = (p.attachments || []).map(a => typeof a === "string" ? { name: a, size: 0, type: "" } : a);
    return `
      <div class="form-row">
        <div class="form-group"><label class="form-required">文号</label>
          <input id="pol-code" value="${escapeHtml(p.code)}" placeholder="如：学工〔2026〕7号"></div>
        <div class="form-group"><label class="form-required">发布日期</label>
          <input id="pol-date" type="date" value="${escapeHtml(p.date)}"></div>
      </div>
      <div class="form-group"><label class="form-required">文件标题</label>
        <input id="pol-title" value="${escapeHtml(p.title)}" placeholder="如：关于印发《XXX办法》的通知"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-required">类别</label>
          <select id="pol-cat">${MOCK.policyCats.map(c => `<option ${c === p.cat ? "selected" : ""}>${c}</option>`).join("")}</select></div>
        <div class="form-group"><label>效力状态</label>
          <select id="pol-status">${["现行有效", "已废止"].map(s => `<option ${s === p.status ? "selected" : ""}>${s}</option>`).join("")}</select></div>
      </div>
      <div class="form-group">
        <label>文件正文</label>
        <div class="rt-toolbar" id="pol-rt-toolbar">${rtToolbarHtml("rt-btn")}</div>
        <div class="rt-editor" id="pol-body" contenteditable="true" data-placeholder="请输入制度文件正文，可使用工具栏排版（标题、条款、列表等）">${p.body || ""}</div>
        <p class="form-hint" style="color:var(--text-muted)">正文将展示在学生端「制度文件」详情；留空时详情页自动生成文件摘要。</p>
      </div>
      <div class="form-group"><label>附件材料</label>
        <div class="upload-zone" id="pol-upload"><div class="uz-inner">${svgIcon("paperclip")} 点击或拖拽上传制度文件附件（PDF / Word / 图片，可选）</div></div>
        <input type="file" id="pol-upload-input" multiple hidden>
        <div class="up-list" id="pol-attach-list">${uploaderItemsHtml(initAtt)}</div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="pol-preview">${svgIcon("eye")} 预览</button>
        <button class="btn btn-primary" id="pol-save">保存</button>
        <button class="btn btn-ghost" id="pol-cancel">取消</button>
      </div>`;
  },

  showPolicyForm(idx, draft) {
    const editing = idx >= 0;
    const base = editing ? MOCK.policies[idx]
      : { code: "", title: "", cat: MOCK.policyCats[0], status: "现行有效", date: formatDate(new Date()), body: "", attachments: [] };
    const p = Object.assign({ body: "", attachments: [] }, base, draft || {});

    this.showModal(editing ? "编辑制度文件" : "新增制度文件", this.policyFormHtml(p));

    /* 正文富文本编辑器 */
    const bodyEl = document.getElementById("pol-body");
    const syncPh = () => { if (bodyEl) bodyEl.classList.toggle("empty", !stripHtml(bodyEl.innerHTML)); };
    syncPh();
    if (bodyEl) bodyEl.addEventListener("input", syncPh);
    bindRt(document.getElementById("pol-rt-toolbar"), bodyEl, syncPh);

    /* 真实附件上传 */
    let uploader;
    const collect = () => ({
      code: document.getElementById("pol-code").value.trim(),
      title: document.getElementById("pol-title").value.trim(),
      date: document.getElementById("pol-date").value.trim(),
      cat: document.getElementById("pol-cat").value,
      status: document.getElementById("pol-status").value,
      body: stripHtml(bodyEl.innerHTML) ? bodyEl.innerHTML : "",
      attachments: uploader.getMeta()
    });
    uploader = makeUploader(
      document.getElementById("pol-upload"),
      document.getElementById("pol-upload-input"),
      document.getElementById("pol-attach-list"),
      (a) => this.showAttachmentPreview(a, () => this.showPolicyForm(idx, collect()))
    );
    uploader.seed(p.attachments || []);

    const preview = document.getElementById("pol-preview");
    if (preview) preview.addEventListener("click", () => {
      const d = collect();
      if (!d.code && !d.title) { this.toast("请先填写文号或标题再预览"); return; }
      this.showPolicyPreview(idx, d);
    });

    const save = document.getElementById("pol-save");
    if (save) save.addEventListener("click", () => {
      const o = collect();
      if (!o.code || !o.title || !o.date) { this.toast("请填写文号、标题与日期"); return; }
      const list = MOCK.policies.map(x => Object.assign({}, x));
      const item = { code: o.code, title: o.title, cat: o.cat, status: o.status, date: o.date, body: o.body, attachments: o.attachments };
      if (editing) list[idx] = item; else list.unshift(item);
      savePolicies(list);
      this.hideModal(); this.toast("已保存"); this.render();
    });
    const cancel = document.getElementById("pol-cancel");
    if (cancel) cancel.addEventListener("click", () => this.hideModal());
  },

  /* 预览：以查看端详情样式呈现表单当前内容，可返回继续编辑 */
  showPolicyPreview(idx, draft) {
    this.showModal("制度文件预览", `
      ${this.policyDetailHtml(draft)}
      <div class="modal-actions">
        <button class="btn btn-primary" id="pol-prev-back">‹ 返回编辑</button>
      </div>`);
    this.bindAttachments(() => this.showPolicyPreview(idx, draft));
    const back = document.getElementById("pol-prev-back");
    if (back) back.addEventListener("click", () => this.showPolicyForm(idx, draft));
  },

  /* 绑定详情/预览中的附件点击 → 附件预览弹窗（携带 name/size/type） */
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
      ? `<img src="${att.url}" alt="${escapeHtml(name)}" style="display:block;max-width:100%;max-height:420px;margin:0 auto;border-radius:10px;border:1px solid var(--border)">`
      : `<div style="text-align:center"><div style="font-size:48px;color:var(--primary);line-height:1">${svgIcon(fileIcon(att))}</div></div>`;
    this.showModal("附件预览", `
      <div style="padding:6px 0 2px">${media}</div>
      <div style="text-align:center;margin-top:12px">
        <h4 style="font-size:16px;margin-bottom:6px">${escapeHtml(name)}</h4>
        <div><span class="tag">${label}</span>${size ? ` <span class="tag">${size}</span>` : ""}</div>
      </div>
      ${img ? "" : `<div class="no-reply" style="margin-top:12px">原型演示：附件预览 —— 实际系统将在此加载并在线预览文件内容。</div>`}
      <div class="modal-actions">
        <button class="btn btn-outline" id="att-back">‹ 返回</button>
        <button class="btn btn-primary" id="att-dl">下载附件</button>
      </div>`);
    const back = document.getElementById("att-back");
    if (back) back.addEventListener("click", () => { if (onBack) onBack(); else this.hideModal(); });
    const dl = document.getElementById("att-dl");
    if (dl) dl.addEventListener("click", () => this.toast("原型演示：文件下载功能暂未开放"));
  },

  togglePolicy(idx) {
    const list = MOCK.policies.map(x => Object.assign({}, x));
    if (!list[idx]) return;
    list[idx].status = list[idx].status === "现行有效" ? "已废止" : "现行有效";
    savePolicies(list); this.toast("状态已更新"); this.render();
  },

  delPolicy(idx) {
    const list = MOCK.policies.slice();
    if (!list[idx]) return;
    list.splice(idx, 1);
    savePolicies(list); this.toast("已删除"); this.render();
  },

  /* ---------- 时限与模板（回复承诺天数 + 超期天数 + 收悉回执模板 + 催办模板 + 默认渠道 + 消息模板一览） ---------- */
  renderSlaMgr() {
    const ackPh = ["{姓名}", "{标题}", "{编号}", "{来信时间}", "{承诺天数}", "{回执时间}"];
    const urgePh = ["{当前办理人}", "{科室}", "{科室领导}", "{回复人}", "{姓名}", "{事务分类}", "{标题}", "{编号}", "{来信时间}", "{已过天数}", "{催办时间}"];
    const chip = (list) => list.map(p => `<code class="ph-chip">${p}</code>`).join(" ");
    this.afterRender = () => {
      const save = document.getElementById("btn-save-sla");
      if (save) save.addEventListener("click", () => {
        const promise = parseInt(document.getElementById("promise-days").value, 10);
        const days = parseInt(document.getElementById("overdue-days").value, 10);
        if (!Number.isInteger(promise) || promise < 1 || promise > 60) { this.toast("回复承诺天数须为 1–60 之间的整数"); return; }
        if (!Number.isInteger(days) || days < 0 || days > 365) { this.toast("超期天数须为 0–365 之间的整数"); return; }
        const ack = document.getElementById("ack-template").value.trim();
        const tpl = document.getElementById("urge-template").value.trim();
        if (!ack) { this.toast("请填写收悉回执模板"); return; }
        if (!tpl) { this.toast("请填写催办消息模板"); return; }
        const ch = [...document.querySelectorAll(".channel-opts input:checked")].map(x => x.value);
        if (!ch.length) { this.toast("请至少选择一种默认发送渠道"); return; }
        saveTimeConfig({ promiseDays: promise, overdueDays: days, ackTemplate: ack, urgeTemplate: tpl, channels: ch });
        this.toast("时限与模板已保存，新提交与新催办即时生效");
        this.render();
      });
      const reset = document.getElementById("btn-reset-ack");
      if (reset) reset.addEventListener("click", () => { document.getElementById("ack-template").value = DEFAULT_ACK_TEMPLATE; });
    };
    return `
    <p class="section-title">设置回复承诺时限、超期判定和消息模板。学生提交后系统自动发送收悉回执（M-01），其中的承诺天数取自本页。</p>
    <div class="card">
      <div class="card-header"><h3>办理时限</h3><span class="hint">统一适用全部信件</span></div>
      <div class="card-body">
        <div class="form-row" style="max-width:720px">
          <div class="form-group">
            <label class="form-required">回复承诺天数</label>
            <div style="display:flex;align-items:center;gap:10px">
              <input type="number" min="1" max="60" id="promise-days" value="${MOCK.replyPromiseDays}" class="sla-input" style="width:120px">
              <span style="color:var(--text-soft)">天</span>
            </div>
            <p class="form-hint">写入收悉回执的 <code class="ph-chip">{承诺天数}</code>，告知学生多久内给予正式回复。</p>
          </div>
          <div class="form-group">
            <label class="form-required">超过多少天未办结视为超期</label>
            <div style="display:flex;align-items:center;gap:10px">
              <input type="number" min="0" max="365" id="overdue-days" value="${MOCK.overdueDays}" class="sla-input" style="width:120px">
              <span style="color:var(--text-soft)">天</span>
            </div>
            <p class="form-hint">办结时限 = 来信提交日（二次办理为重新办理日）+ 该天数。</p>
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>收悉回执模板（M-01）</h3><button class="btn btn-ghost btn-sm" id="btn-reset-ack">恢复默认</button></div>
      <div class="card-body">
        <div class="form-group">
          <textarea id="ack-template" rows="7" class="rating-comment" style="width:100%">${escapeHtml(MOCK.ackTemplate || DEFAULT_ACK_TEMPLATE)}</textarea>
          <p class="form-hint">可用占位符：${chip(ackPh)}。回执只表示来信已收悉，不代表办理结果。</p>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>催办消息模板（M-15 / M-16）</h3><span class="hint">学生催办、综合办督办共用</span></div>
      <div class="card-body">
        <div class="form-group">
          <textarea id="urge-template" rows="4" class="rating-comment" style="width:100%">${escapeHtml(MOCK.urgeTemplate)}</textarea>
          <p class="form-hint">可用占位符：${chip(urgePh)}
            <br><code class="ph-chip">{当前办理人}</code> 按信件所处环节自动取：待分派为综合办，待指定回复人 / 待审批为科室领导，其余为回复人。</p>
        </div>
        <div class="form-group">
          <label class="form-required">默认发送渠道</label>
          <div class="channel-opts">
            ${["sys", "its"].map(c => `<label class="channel-opt"><input type="checkbox" value="${c}" ${(MOCK.urgeChannels || []).includes(c) ? "checked" : ""}> ${CHANNEL_LABELS[c]}</label>`).join("")}
          </div>
        </div>
      </div>
    </div>
    <div class="form-actions"><button class="btn btn-primary" id="btn-save-sla">保存配置</button></div>
    <div class="card" style="margin-top:16px">
      <div class="card-header"><h3>消息模板一览</h3><span class="hint">按流程节点自动发送（M-12、M-14 已取消）</span></div>
      <div class="card-body" style="padding:0">
        <table><thead><tr><th style="width:70px">编号</th><th style="width:130px">名称</th><th style="width:130px">渠道</th><th>模板内容</th></tr></thead>
        <tbody>${Object.keys(MSG_TEMPLATES).map(k => `<tr>
          <td class="mono">${k}</td><td>${escapeHtml(MSG_TEMPLATES[k].name)}</td>
          <td>${escapeHtml(channelLabel(MSG_TEMPLATES[k].channel))}</td>
          <td class="tpl-cell">${escapeHtml(templateText(k)).replace(/\n/g, "<br>")}</td></tr>`).join("")}</tbody></table>
      </div>
    </div>`;
  },


  /* ---------- 常见问题配置（管理员维护学生端 FAQ） ---------- */
  renderFaqMgr() {
    const faqs = loadFaqs();
    this.afterRender = () => {
      const add = document.getElementById("btn-add-faq");
      if (add) add.addEventListener("click", () => this.showFaqForm(-1));
      document.querySelectorAll("[data-edit-faq]").forEach(b => b.addEventListener("click", () => this.showFaqForm(+b.dataset.editFaq)));
      document.querySelectorAll("[data-del-faq]").forEach(b => b.addEventListener("click", () => this.delFaq(+b.dataset.delFaq)));
      document.querySelectorAll("[data-toggle-faq]").forEach(b => b.addEventListener("click", () => this.toggleFaq(+b.dataset.toggleFaq)));
      document.querySelectorAll("[data-move-faq]").forEach(b => b.addEventListener("click", () => this.moveFaq(+b.dataset.moveFaq, b.dataset.dir)));
    };
    return `
    <p class="section-title">维护学生端「常见问题」内容。启用的条目将按排序展示给学生（桌面端与移动端一致）。</p>
    <div class="card">
      <div class="card-header"><h3>常见问题列表</h3><button class="btn btn-primary btn-sm" id="btn-add-faq">＋ 新增问题</button></div>
      <div class="card-body" style="padding:0">
        <table><thead><tr><th style="width:56px">排序</th><th>问题 / 解答</th><th style="width:100px">分类</th><th style="width:90px">状态</th><th style="width:210px">操作</th></tr></thead>
        <tbody>
          ${faqs.length ? faqs.map((f, i) => `<tr>
            <td>
              <div class="faq-order">
                <button class="btn btn-ghost btn-xs" data-move-faq="${i}" dir="up" ${i === 0 ? "disabled" : ""} title="上移">${svgIcon("up")}</button>
                <span class="faq-ord-num">${i + 1}</span>
                <button class="btn btn-ghost btn-xs" data-move-faq="${i}" dir="down" ${i === faqs.length - 1 ? "disabled" : ""} title="下移">${svgIcon("down")}</button>
              </div>
            </td>
            <td><div class="faq-q-cell">${escapeHtml(f.q)}</div><div class="faq-a-cell">${escapeHtml(f.a)}</div></td>
            <td>${f.category ? `<span class="tag">${escapeHtml(f.category)}</span>` : '<span class="tag">—</span>'}</td>
            <td>${f.enabled !== false ? '<span class="badge" style="background:#1BB9751a;color:#1BB975">启用</span>' : '<span class="badge" style="background:#6270791a;color:#627079">停用</span>'}</td>
            <td class="table-actions">
              <button class="btn btn-outline btn-sm" data-edit-faq="${i}">编辑</button>
              <button class="btn btn-outline btn-sm" data-toggle-faq="${i}">${f.enabled !== false ? "停用" : "启用"}</button>
              <button class="btn btn-danger btn-sm" data-del-faq="${i}">删除</button>
            </td></tr>`).join("") : `<tr><td colspan="5" class="table-empty">暂无常见问题，点击右上角「新增问题」添加</td></tr>`}
        </tbody></table>
      </div>
    </div>`;
  },

  showFaqForm(idx) {
    const editing = idx >= 0;
    const list = loadFaqs();
    const f = editing ? list[idx] : { q: "", a: "", category: "", enabled: true };
    this.showModal(editing ? "编辑常见问题" : "新增常见问题", `
      <div class="form-group"><label class="form-required">问题</label>
        <input id="faq-q" value="${escapeHtml(f.q)}" placeholder="如：写信后多久能收到回复？" maxlength="60"></div>
      <div class="form-group"><label class="form-required">解答</label>
        <textarea id="faq-a" rows="5" class="rating-comment" style="width:100%" placeholder="请填写该问题的解答说明">${escapeHtml(f.a)}</textarea></div>
      <div class="form-group"><label>分类（可选）</label>
        <input id="faq-cat" value="${escapeHtml(f.category || "")}" placeholder="如：办理流程 / 使用指南 / 受理范围" maxlength="12"></div>
      <div class="form-group"><label class="channel-opt" style="display:inline-flex">
        <input type="checkbox" id="faq-enabled" ${f.enabled !== false ? "checked" : ""}> 启用（展示给学生）</label></div>
      <div class="modal-actions">
        <button class="btn btn-primary" id="faq-save">保存</button>
        <button class="btn btn-ghost" id="faq-cancel">取消</button>
      </div>`);
    const save = document.getElementById("faq-save");
    if (save) save.addEventListener("click", () => {
      const q = document.getElementById("faq-q").value.trim();
      const a = document.getElementById("faq-a").value.trim();
      const category = document.getElementById("faq-cat").value.trim();
      const enabled = document.getElementById("faq-enabled").checked;
      if (!q || !a) { this.toast("请填写问题与解答"); return; }
      const next = loadFaqs().slice();
      if (editing) next[idx] = Object.assign({}, next[idx], { q, a, category, enabled });
      else next.push({ id: genFaqId(), q, a, category, enabled, order: next.length + 1 });
      saveFaqs(next);
      this.hideModal(); this.toast("已保存"); this.render();
    });
    const cancel = document.getElementById("faq-cancel");
    if (cancel) cancel.addEventListener("click", () => this.hideModal());
  },

  delFaq(idx) {
    const list = loadFaqs().slice();
    if (!list[idx]) return;
    const q = list[idx].q;
    if (!window.confirm(`确定删除「${q}」这条常见问题吗？`)) return;
    list.splice(idx, 1);
    saveFaqs(list); this.toast("已删除"); this.render();
  },

  toggleFaq(idx) {
    const list = loadFaqs().slice();
    if (!list[idx]) return;
    list[idx] = Object.assign({}, list[idx], { enabled: list[idx].enabled === false });
    saveFaqs(list); this.toast(list[idx].enabled ? "已启用" : "已停用"); this.render();
  },

  moveFaq(idx, dir) {
    const list = loadFaqs().slice();
    const to = dir === "up" ? idx - 1 : idx + 1;
    if (to < 0 || to >= list.length) return;
    const tmp = list[idx]; list[idx] = list[to]; list[to] = tmp;
    saveFaqs(list); this.render();
  }
});

/* ============================================================
 * ECharts（统计分析）+ Canvas 图表（其余页面）
 * ============================================================ */
Object.assign(App, {
  /* 初始化一个 ECharts 实例并登记，供重绘/自适应管理 */
  echartInit(id, option) {
    if (typeof echarts === "undefined") return null;
    const el = document.getElementById(id);
    if (!el) return null;
    const inst = echarts.init(el);
    inst.setOption(option);
    if (!this._charts) this._charts = [];
    this._charts.push(inst);
    if (!this._resizeBound) {
      this._resizeBound = true;
      window.addEventListener("resize", () => (this._charts || []).forEach(c => { try { c.resize(); } catch (e) {} }));
    }
    return inst;
  },
  /* 重绘前销毁旧实例，避免容器复用导致的重复绘制/内存泄漏 */
  echartsDispose() {
    (this._charts || []).forEach(c => { try { c.dispose(); } catch (e) {} });
    this._charts = [];
  },

  drawDonut(id, data) {
    const cv = document.getElementById(id);
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const w = cv.width, h = cv.height, cx = w / 2, cy = h / 2;
    const r = Math.min(w, h) / 2 - 6, inner = r * 0.62;
    ctx.clearRect(0, 0, w, h);
    const total = data.reduce((s, d) => s + d.value, 0);
    if (!total) {
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.arc(cx, cy, inner, 0, Math.PI * 2, true); ctx.fill();
      ctx.fillStyle = "#627079"; ctx.font = "12px sans-serif"; ctx.textAlign = "center"; ctx.fillText("暂无数据", cx, cy + 4);
      return;
    }
    let start = -Math.PI / 2;
    data.forEach(d => {
      const ang = d.value / total * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + ang); ctx.closePath();
      ctx.fillStyle = d.color || "#2A8DC7"; ctx.fill();
      start += ang;
    });
    ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
    ctx.fillStyle = "#3C444F"; ctx.textAlign = "center";
    ctx.font = "bold 22px sans-serif"; ctx.fillText(total, cx, cy);
    ctx.font = "11px sans-serif"; ctx.fillStyle = "#627079"; ctx.fillText("总计", cx, cy + 16);
  },

  drawBars(id, data) {
    const cv = document.getElementById(id);
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const w = cv.width, h = cv.height;
    const padL = 30, padB = 40, padT = 14, padR = 10;
    ctx.clearRect(0, 0, w, h);
    if (!data.length) { ctx.fillStyle = "#627079"; ctx.font = "12px sans-serif"; ctx.textAlign = "center"; ctx.fillText("暂无数据", w / 2, h / 2); return; }
    const max = Math.max(...data.map(d => d.value), 1);
    const chartH = h - padB - padT, chartW = w - padL - padR;
    const bw = chartW / data.length * 0.5;
    const gap = chartW / data.length;
    // 网格线
    ctx.strokeStyle = "#f1f5f9"; ctx.fillStyle = "#627079"; ctx.font = "10px sans-serif"; ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const y = padT + chartH - chartH * i / 4;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
      ctx.fillText(Math.round(max * i / 4), padL - 4, y + 3);
    }
    const colors = ["#2A8DC7", "#9CBFDA", "#1BB975", "#F29100", "#DF2027", "#006DAD"];
    data.forEach((d, i) => {
      const x = padL + gap * i + (gap - bw) / 2;
      const bh = d.value / max * chartH;
      const y = padT + chartH - bh;
      ctx.fillStyle = colors[i % colors.length];
      const rr = 4;
      ctx.beginPath();
      ctx.moveTo(x, y + rr); ctx.arcTo(x, y, x + rr, y, rr);
      ctx.lineTo(x + bw - rr, y); ctx.arcTo(x + bw, y, x + bw, y + rr, rr);
      ctx.lineTo(x + bw, y + bh); ctx.lineTo(x, y + bh); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#3C444F"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(d.value, x + bw / 2, y - 5);
      ctx.fillStyle = "#475569"; ctx.font = "10px sans-serif";
      const label = d.label.length > 6 ? d.label.slice(0, 6) : d.label;
      ctx.fillText(label, x + bw / 2, h - padB + 14);
    });
  }
});

/* 启动应用 */
document.addEventListener("DOMContentLoaded", () => App.init());


